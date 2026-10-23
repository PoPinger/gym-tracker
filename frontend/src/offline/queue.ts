// Offline outbox: every workout / weight write is stored in IndexedDB first and sent in order.
// - Network error, timeout or 5xx: the write stays queued and is retried (online event, app focus, every 30 s).
// - 401: the queue pauses (the API client sends the user to log in); nothing is dropped.
// - Any other 4xx: the write moves to the "failed" list, shown in the sync pill, until retried or discarded.
// Cached GET responses are overlaid with every write not yet on the server, so the app (also after
// being closed offline) shows what was saved on the phone.
// Days never opened before get temporary negative ids offline; they are mapped to the real ids on sync.
import axios, { type AxiosInstance } from 'axios';
import { currentUserId, idbAll, idbDelete, idbGet, idbPut } from './db';
import type { DayLog, ExerciseLog, Plan, WeekInfo, WeightCycle } from '../types';

export interface SetIn { set_number: number; reps: number | null; weight_kg: number | null; rir?: number | null }

export type Op =
  | { kind: 'createDay'; weekId: number; planDayId: number; tempId: number; tempExLogs: Record<number, number> }
  | { kind: 'saveSets'; exLogId: number; sets: SetIn[]; workoutDate?: string; skipped?: boolean; exerciseSkipped?: boolean }
  | { kind: 'completeDay'; logId: number; workoutDate?: string; skipped?: boolean }
  | { kind: 'note'; exerciseId: number; note: string }
  | { kind: 'weight'; dayLogId: number; weightKg: number };

export interface OpRecord {
  seq?: number;
  user: number;
  op: Op;
  label: string;           // what the write was about (exercise, day, week), shown in the failed list
  status: 'queued' | 'failed';
  deferred: boolean;       // not sent right away (made offline or behind other queued writes)
  createdAt: string;
}

export interface SyncState {
  online: boolean;         // the last attempt reached the server (and the browser reports online)
  pending: number;         // queued writes not yet on the server
  syncing: boolean;        // sending writes that were saved offline
  justSynced: boolean;     // offline writes have just all been sent (shown briefly)
  failed: OpRecord[];
}

const RETRY_MS = 30_000;
const SYNCED_MS = 2500;
const SEND_TIMEOUT_MS = 15_000;

let transport: AxiosInstance | null = null;
export const setTransport = (api: AxiosInstance) => { transport = api; };

/* ── status store (useSyncExternalStore) ── */

let state: SyncState = { online: navigator.onLine, pending: 0, syncing: false, justSynced: false, failed: [] };
const listeners = new Set<() => void>();
const setState = (patch: Partial<SyncState>) => { state = { ...state, ...patch }; listeners.forEach(l => l()); };
export const getSyncState = () => state;
export const subscribeSync = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/* ── storage ── */

const cacheKey = (user: number, url: string) => `${user}|${url}`;
const idMapKey = (user: number) => `idmap:${user}`;

export async function readCache<T>(url: string): Promise<T | undefined> {
  const user = currentUserId();
  if (user == null) return undefined;
  try { return (await idbGet<{ data: T }>('cache', cacheKey(user, url)))?.data; } catch { return undefined; }
}

export async function writeCache(url: string, data: unknown) {
  const user = currentUserId();
  if (user == null) return;
  try { await idbPut('cache', { key: cacheKey(user, url), data, at: Date.now() }); } catch { /* storage unavailable: online only */ }
}

async function userRecords(user: number): Promise<OpRecord[]> {
  try {
    return (await idbAll<OpRecord>('ops')).filter(r => r.user === user).sort((a, b) => a.seq! - b.seq!);
  } catch { return []; }
}

// Writes not yet on the server (queued and failed), oldest first
export async function pendingRecords(): Promise<OpRecord[]> {
  const user = currentUserId();
  return user == null ? [] : userRecords(user);
}

export async function idMap(): Promise<Record<number, number>> {
  const user = currentUserId();
  if (user == null) return {};
  try { return (await idbGet<{ map: Record<number, number> }>('meta', idMapKey(user)))?.map ?? {}; } catch { return {}; }
}

const resolveId = (id: number, map: Record<number, number>) => (id < 0 ? map[id] ?? id : id);

let tempSeq = 0;
export const newTempId = () => -(Date.now() * 1000 + (tempSeq++ % 1000));

/* ── sending ── */

export const isNetworkError = (e: unknown) => axios.isAxiosError(e) && !e.response;
const isRetryable = (e: unknown) => {
  if (!axios.isAxiosError(e) || !e.response) return true;
  const s = e.response.status;
  return s >= 500 || s === 408 || s === 429;
};

// A write replayed from the offline queue never sends a completely empty set, so it cannot
// wipe a set saved meanwhile (e.g. on another device): last write wins per set, no set is lost.
const setsToSend = (r: OpRecord, sets: SetIn[]) =>
  r.deferred ? sets.filter(s => s.reps != null || s.weight_kg != null || s.rir != null) : sets;

async function send(r: OpRecord, map: Record<number, number>) {
  if (!transport) throw new Error('no transport');
  const cfg = { timeout: SEND_TIMEOUT_MS };
  const op = r.op;
  switch (op.kind) {
    case 'createDay': {
      const res = await transport.post<DayLog>('/day-logs', { plan_day_id: op.planDayId, training_week_id: op.weekId }, cfg);
      const next = { ...map, [op.tempId]: res.data.id };
      for (const el of res.data.exercise_logs) {
        const temp = op.tempExLogs[el.exercise_id];
        if (temp != null) next[temp] = el.id;
      }
      await idbPut('meta', { key: idMapKey(r.user), map: next });
      Object.assign(map, next);
      return;
    }
    case 'saveSets': {
      const id = resolveId(op.exLogId, map);
      if (id < 0) throw unresolved();
      await transport.put(`/exercise-logs/${id}/sets`, setsToSend(r, op.sets),
        { ...cfg, params: { workout_date: op.workoutDate, skipped: op.skipped, exercise_skipped: op.exerciseSkipped } });
      return;
    }
    case 'completeDay': {
      const id = resolveId(op.logId, map);
      if (id < 0) throw unresolved();
      await transport.post(`/day-logs/${id}/complete`, { workout_date: op.workoutDate, skipped: op.skipped }, cfg);
      return;
    }
    case 'note':
      await transport.put(`/exercises/${op.exerciseId}`, { note: op.note }, cfg);
      return;
    case 'weight':
      await transport.put(`/weight/day-logs/${op.dayLogId}`, { weight_kg: op.weightKg }, cfg);
      return;
  }
}

// A temporary id whose "create day" write failed: the write cannot be sent, so it fails like a 4xx
const unresolved = () => Object.assign(new Error('unresolved id'), { unresolved: true });

let running = false;
let again = false;
let retryTimer: number | undefined;
let syncedTimer: number | undefined;

export function flush(): void {
  if (running) { again = true; return; }
  running = true;
  void run().finally(() => {
    running = false;
    if (again) { again = false; flush(); }
  });
}

async function run() {
  const user = currentUserId();
  if (user == null) return;
  window.clearTimeout(retryTimer);
  let sentDeferred = false;
  const map = await idMap();
  for (;;) {
    const records = await userRecords(user);
    const queued = records.filter(r => r.status === 'queued');
    setState({ pending: queued.length, failed: records.filter(r => r.status === 'failed') });
    const r = queued[0];
    if (!r) break;
    if (!navigator.onLine) { setState({ online: false, syncing: false }); break; }
    if (r.deferred) setState({ syncing: true, justSynced: false });
    try {
      await send(r, map);
      await idbDelete('ops', r.seq!);
      sentDeferred ||= r.deferred;
      setState({ online: true });
    } catch (e) {
      if ((e as { unresolved?: boolean }).unresolved || !isRetryable(e)) {
        if (axios.isAxiosError(e) && e.response?.status === 401) { setState({ syncing: false }); break; }
        await idbPut('ops', { ...r, status: 'failed' });
        continue;
      }
      // Still offline / server down: everything queued now replays as an offline write
      await Promise.all(queued.filter(q => !q.deferred).map(q => idbPut('ops', { ...q, deferred: true })));
      setState({ online: !isNetworkError(e), syncing: false });
      retryTimer = window.setTimeout(flush, RETRY_MS);
      break;
    }
  }
  if (state.syncing || sentDeferred) {
    const done = state.pending === 0;
    setState({ syncing: false, justSynced: done && sentDeferred });
    if (done && sentDeferred) {
      window.clearTimeout(syncedTimer);
      syncedTimer = window.setTimeout(() => setState({ justSynced: false }), SYNCED_MS);
    }
  }
}

// Store a write and start sending; resolves once it is safely on the phone.
// Without IndexedDB (e.g. blocked storage) the write is sent directly, as before offline mode.
export async function enqueue(op: Op, label: string): Promise<void> {
  const user = currentUserId();
  const queuedBefore = state.pending > 0;
  const record: OpRecord = {
    user: user ?? -1, op, label, status: 'queued',
    deferred: !navigator.onLine || queuedBefore, createdAt: new Date().toISOString(),
  };
  try {
    if (user == null) throw new Error('no user');
    await idbPut('ops', record);
  } catch {
    await send({ ...record, deferred: false }, await idMap());
    return;
  }
  setState({ pending: state.pending + 1 });
  flush();
}

export async function retryFailed(seq: number) {
  const r = (await pendingRecords()).find(x => x.seq === seq);
  if (r) await idbPut('ops', { ...r, status: 'queued', deferred: true });
  flush();
}

export async function discardFailed(seq: number) {
  await idbDelete('ops', seq);
  flush();
}

export function startSync() {
  window.addEventListener('online', () => { setState({ online: true }); flush(); });
  window.addEventListener('offline', () => setState({ online: false }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') flush(); });
  flush();
}

/* ── overlay of pending writes on cached / fetched data ── */

const applySets = (el: ExerciseLog, r: OpRecord, op: Extract<Op, { kind: 'saveSets' }>) => {
  for (const s of setsToSend(r, op.sets)) {
    const cur = el.set_logs.find(x => x.set_number === s.set_number);
    if (cur) Object.assign(cur, { reps: s.reps, weight_kg: s.weight_kg, rir: s.rir ?? null });
  }
  if (op.exerciseSkipped != null) el.skipped = op.exerciseSkipped;
};

export async function overlay<T>(url: string, data: T, extra: OpRecord[] = []): Promise<T> {
  const current = await pendingRecords();
  const bySeq = new Map<number, OpRecord>();
  [...extra, ...current].forEach(r => bySeq.set(r.seq!, r));
  const records = [...bySeq.values()].sort((a, b) => a.seq! - b.seq!);
  if (!records.length || data == null) return data;
  const map = await idMap();
  const res = (id: number | null) => (id == null ? id : resolveId(id, map));
  const out = structuredClone(data);

  if (/^\/day-logs\/-?\d+$/.test(url)) {
    const log = out as unknown as DayLog;
    for (const r of records) {
      const op = r.op;
      if (op.kind === 'saveSets') {
        const el = log.exercise_logs.find(e => res(e.id) === res(op.exLogId));
        if (!el) continue;
        applySets(el, r, op);
        if (op.skipped != null) log.skipped = op.skipped;
        if (op.workoutDate) log.workout_date = op.workoutDate;
      } else if (op.kind === 'completeDay' && res(op.logId) === res(log.id)) {
        log.status = 'completed';
        log.completed_at ??= r.createdAt;
        if (op.skipped != null) log.skipped = op.skipped;
        if (op.workoutDate) log.workout_date = op.workoutDate;
      } else if (op.kind === 'note') {
        log.exercise_logs.forEach(e => { if (e.exercise_id === op.exerciseId) e.note = op.note || null; });
      }
    }
  } else if (/^\/weeks\/\d+\/days$/.test(url)) {
    const week = out as unknown as WeekInfo;
    for (const { op } of records) {
      if (op.kind === 'createDay' && op.weekId === week.week_id) {
        const d = week.days.find(x => x.plan_day_id === op.planDayId);
        if (d && d.log_id == null) { d.log_id = res(op.tempId); d.status = 'active'; }
      } else if (op.kind === 'completeDay') {
        const d = week.days.find(x => x.log_id != null && res(x.log_id) === res(op.logId));
        if (d) { d.status = 'completed'; if (op.skipped != null) d.skipped = op.skipped; }
      }
    }
  } else if (/^\/plans\/\d+$/.test(url)) {
    const plan = out as unknown as Plan;
    for (const { op } of records) {
      if (op.kind !== 'note') continue;
      plan.days.forEach(d => d.exercises.forEach(e => { if (e.id === op.exerciseId) e.note = op.note || null; }));
    }
  } else if (url === '/weight/current-cycle') {
    const cycle = out as unknown as WeightCycle;
    for (const r of records) {
      const op = r.op;
      if (op.kind !== 'weight') continue;
      cycle.weeks.forEach(w => w.day_logs.forEach(d => {
        if (d.id === op.dayLogId) { d.weight_kg = op.weightKg; d.logged_at = r.createdAt; }
      }));
    }
  }
  return out;
}

/* ── a training day opened offline for the first time ── */

// Built from the cached plan: same shape as the server's day log, with temporary ids.
// The "previous week" comparison is not available until the day is opened online.
export async function createDayOffline(weekId: number, planDayId: number, planId: number, label: string): Promise<DayLog | null> {
  const [plan, week] = await Promise.all([readCache<Plan>(`/plans/${planId}`), readCache<WeekInfo>(`/weeks/${weekId}/days`)]);
  const day = plan?.days.find(d => d.id === planDayId);
  if (!plan || !day) return null;
  const tempExLogs: Record<number, number> = {};
  const exercise_logs: ExerciseLog[] = [...day.exercises].sort((a, b) => a.exercise_order - b.exercise_order).map(ex => {
    const id = newTempId();
    tempExLogs[ex.id] = id;
    return {
      id, exercise_id: ex.id, exercise_name: ex.name, muscle_group: ex.muscle_group, sets: ex.sets,
      rep_min: ex.rep_min ?? null, rep_max: ex.rep_max ?? null, rest_seconds: ex.rest_seconds ?? null, note: ex.note ?? null,
      skipped: false,
      set_logs: Array.from({ length: ex.sets }, (_, i) => ({ id: 0, set_number: i + 1, reps: null, weight_kg: null, rir: null })),
    };
  });
  const tempId = newTempId();
  const log: DayLog = {
    id: tempId, training_week_id: weekId, plan_day_id: planDayId, status: 'active', completed_at: null,
    workout_date: null, skipped: false, exercise_logs,
    prev_week_data: {}, prev_week_skipped: [], week1_data: {}, prev_week_number: null, week1_number: null,
    week_number: week?.week_number, is_deload: week?.is_deload ?? false, plan_name: plan.name,
  };
  await writeCache(`/day-logs/${tempId}`, log);
  await enqueue({ kind: 'createDay', weekId, planDayId, tempId, tempExLogs }, label);
  return log;
}
