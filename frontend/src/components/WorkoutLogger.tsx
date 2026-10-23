// Workout logger of a training day: one focus card per exercise, accented with the day's colour.
// Mobile first: big numeric inputs, per-exercise saved/unsaved status and a sticky finish bar.
// Per set: optional RIR and a ✓ that saves and starts the exercise's rest timer (shown in the finish bar).
// The exercise name opens its history; a deload week shows no progress and Kulka stretches.
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, CheckCircle2, Circle, Dumbbell, History, SkipForward, StickyNote, TrendingUp } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { MUSCLE_GROUP_TO_KEY } from '../i18n/translations';
import { exerciseScore, firstWeight, formatKg, formatPct, progressPct, shouldAddWeight } from '../utils/progress';
import { formatRepRange } from '../utils/repRange';
import { todayIso } from '../utils/date';
import { DEFAULT_REST, formatRest } from '../utils/rest';
import { useRestTimer } from '../hooks/useRestTimer';
import { useRefresh } from '../hooks/useRefresh';
import type { DayColor } from '../utils/dayColors';
import AnimatedValue from './AnimatedValue';
import Mascot from './mascot/Mascot';
import TowelThrow from './mascot/TowelThrow';
import ExerciseHistorySheet from './ExerciseHistorySheet';
import { prefersReducedMotion } from '../hooks/useFirstInView';
import type { DayLog, ExerciseLog } from '../types';

type Status = 'empty' | 'unsaved' | 'saved' | 'skipped';
type Ref = { weight: number | null; pct: number | null };

export interface WorkoutLoggerProps {
  dayLog: DayLog; dayName: string; color: DayColor; backLabel: string; onBack: () => void;
  workoutDate: string; onDateChange: (d: string) => void; dateInvalid: boolean;
  skipped: boolean; onToggleSkipped: (v: boolean) => void; onToggleExerciseSkipped: (id: number, v: boolean) => void;
  weights: Record<number, string>; onEditSet: (id: number, setNum: number, raw: string) => void; onEditWeight: (id: number, raw: string) => void;
  onEditRir: (id: number, setNum: number, raw: string) => void; onSaveNote: (id: number, note: string) => Promise<void>;
  onSave: (id: number) => Promise<void>; saving: Record<number, boolean>;
  onFinish: () => void;
}

// What was last loaded from or sent to the server, to tell saved from unsaved
const fingerprint = (el: ExerciseLog, weight: string) =>
  JSON.stringify([el.skipped, weight, el.set_logs.map(s => [s.reps, s.rir ?? null])]);
const hasData = (el: ExerciseLog, weight: string) => weight !== '' || el.set_logs.some(s => s.reps != null);
const pctTone = (pct: number | null) => pct == null || pct === 0 ? 'neutral' : pct > 0 ? 'good' : 'bad';
// How long Kulka reacts to a saved exercise's progress vs the previous week
const REACTION_MS = { progressUp: 2200, progressDown: 2600, wag: 800 } as const;
// Skipping the day: Kulka stomps, releases the towel at THROW_AT_MS (Mascot.tsx "annoyed"), sits bored at ANNOYED_MS
const THROW_AT_MS = 920;
const ANNOYED_MS = 1500;
const REST_ADD_S = 30;
const RIR_VALUES = [0, 1, 2, 3, 4, 5];

function StatusBadge({ s }: { s: Status }) {
  const { t } = useLanguage();
  const label = { empty: t('wl_status_empty'), unsaved: t('wl_status_unsaved'), saved: t('save_sets_saved'), skipped: t('exercise_skipped_label') }[s];
  const icon = { empty: <Circle size={12} />, unsaved: <span className="wl-dot" />, saved: <Check size={12} strokeWidth={3} />, skipped: <SkipForward size={12} /> }[s];
  return <span className={`wl-status ${s}`}>{icon}{label}</span>;
}

function Pill({ label, d }: { label: string; d: Ref }) {
  const { lang } = useLanguage();
  return (
    <span className="wl-pill">
      <small>{label}</small>
      <span>{d.weight != null ? formatKg(d.weight, lang) : '—'}</span>
      <strong className={`tone-${pctTone(d.pct)}`}><AnimatedValue value={d.pct} format={v => formatPct(v, lang)} /></strong>
    </span>
  );
}

// The logger is keyed by the day log, so the saved snapshot is taken once when the day opens
export default function WorkoutLogger(p: WorkoutLoggerProps) {
  const { t } = useLanguage();
  const { dayLog, weights } = p;
  const [savedPrint, setSavedPrint] = useState<Record<number, string>>(() =>
    Object.fromEntries(dayLog.exercise_logs.map(el => [el.id, fingerprint(el, weights[el.id] ?? '')])));

  // References are the last / first earlier non-deload weeks; a deload week itself shows no progress
  const deload = !!dayLog.is_deload;
  const prevNum = dayLog.prev_week_number ?? null;
  const w1Num = dayLog.week1_number ?? null;
  const items = dayLog.exercise_logs.map(el => {
    const w = weights[el.id] ?? '';
    const prevSets = dayLog.prev_week_data?.[el.exercise_id];
    const w1Sets = dayLog.week1_data?.[el.exercise_id];
    const cur = exerciseScore(el.set_logs);
    // Loaded with data and untouched counts as saved; any change since the last save is "unsaved"
    const status: Status = savedPrint[el.id] !== fingerprint(el, w) ? 'unsaved' : el.skipped ? 'skipped' : hasData(el, w) ? 'saved' : 'empty';
    return {
      el, w, status, range: formatRepRange(el.rep_min, el.rep_max),
      prevSet: (n: number) => prevSets?.find(s => s.set_number === n),
      addHint: !deload && prevNum != null && !dayLog.prev_week_skipped?.includes(el.exercise_id) && shouldAddWeight(prevSets, el.rep_max),
      prev: prevNum != null ? { weight: firstWeight(prevSets), pct: el.skipped || deload ? null : progressPct(cur, exerciseScore(prevSets)) } : null,
      w1: w1Num != null && prevNum != null && w1Num < prevNum ? { weight: firstWeight(w1Sets), pct: el.skipped || deload ? null : progressPct(cur, exerciseScore(w1Sets)) } : null,
    };
  });
  const savedCount = items.filter(i => i.status === 'saved' || i.status === 'skipped').length;

  const [reaction, setReaction] = useState<keyof typeof REACTION_MS | null>(null);
  const reactionTimer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(reactionTimer.current), []);
  const react = (r: keyof typeof REACTION_MS) => {
    setReaction(r);
    window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setReaction(null), REACTION_MS[r]);
  };

  // Only switching a toggle on here plays a reaction (an already skipped day just shows the bored pose)
  const [reduced] = useState(prefersReducedMotion);
  const [annoyed, setAnnoyed] = useState(false);
  const [towelFrom, setTowelFrom] = useState<{ x: number; y: number; seq: number } | null>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const throwTimers = useRef<number[]>([]);
  useEffect(() => () => throwTimers.current.forEach(t => window.clearTimeout(t)), []);
  const toggleSkipped = (v: boolean) => {
    p.onToggleSkipped(v);
    throwTimers.current.forEach(t => window.clearTimeout(t));
    setAnnoyed(v && !reduced);
    if (!v || reduced) return;
    throwTimers.current = [
      window.setTimeout(() => {
        const r = slotRef.current?.querySelector('.mascot')?.getBoundingClientRect();
        if (r) setTowelFrom(f => ({ x: r.left + r.width * 0.75, y: r.top + r.height * 0.45, seq: (f?.seq ?? 0) + 1 }));
      }, THROW_AT_MS),
      window.setTimeout(() => setAnnoyed(false), ANNOYED_MS),
    ];
  };
  const toggleExerciseSkipped = (id: number, v: boolean) => {
    p.onToggleExerciseSkipped(id, v);
    if (v && !reduced) react('wag');
  };

  const timer = useRestTimer(dayLog.id);
  const save = async (id: number, print: string, pct: number | null) => {
    timer.dismiss();
    await p.onSave(id);
    setSavedPrint(s => ({ ...s, [id]: print }));
    if (pct == null || pct === 0) return;
    react(pct > 0 ? 'progressUp' : 'progressDown');
  };
  // ✓ on a set: saves the exercise as it is now and starts its rest (none after the last set)
  const saveSet = (el: ExerciseLog, setNum: number, print: string, pct: number | null) => {
    const lastSet = Math.max(...el.set_logs.map(s => s.set_number));
    const body = t('push_rest_body').replace('{exercise}', el.exercise_name)
      .replace('{n}', String(setNum + 1)).replace('{total}', String(lastSet));
    if (setNum < lastSet) timer.start(el.id, el.rest_seconds ?? DEFAULT_REST, { title: t('wl_rest_done'), body });
    else timer.skip();
    void save(el.id, print, pct);
  };

  // Persistent note of the plan exercise: one open at a time
  const [note, setNote] = useState<{ id: number; text: string; saving: boolean; error: boolean } | null>(null);
  // Unsaved sets or an open note keep the refresh button from replacing the day's data
  useRefresh({ dirty: () => note != null || items.some(i => i.status === 'unsaved') });
  const saveNote = async (text: string) => {
    if (!note) return;
    setNote({ ...note, text, saving: true, error: false });
    try { await p.onSaveNote(note.id, text.trim()); setNote(null); }
    catch { setNote(n => n && { ...n, saving: false, error: true }); }
  };
  const [history, setHistory] = useState<{ id: number; name: string } | null>(null);
  const restEx = timer.rest && dayLog.exercise_logs.find(el => el.id === timer.rest!.exLogId);

  return (
    <div className={`wl day-color-${p.color}`} style={{ maxWidth: 700 }}>
      <button className="back-btn" onClick={p.onBack}><ArrowLeft size={15} /> {p.backLabel}</button>
      <div className="page-header wl-header">
        <span className="wl-day-icon"><Dumbbell size={20} /></span>
        <div>
          <h1 className="page-title">{p.dayName}</h1>
          <p className="page-subtitle">
            {dayLog.plan_name} · {t('week_tile_label')} {dayLog.week_number}
            {deload && <> <span className="deload-badge">{t('deload_badge')}</span></>}
            {dayLog.status === 'completed' && <> <span className="badge badge-completed"><CheckCircle2 size={10} /> {t('badge_completed')}</span></>}
          </p>
        </div>
      </div>

      <div className="wl-daybar">
        <label className="wl-date">
          <CalendarDays size={16} />
          <span>{t('workout_date_label').replace(':', '')}</span>
          <input type="date" value={p.workoutDate} max={todayIso()} onChange={e => p.onDateChange(e.target.value)} />
        </label>
        <button type="button" role="switch" aria-checked={p.skipped} className={`wl-switch danger${p.skipped ? ' on' : ''}`} onClick={() => toggleSkipped(!p.skipped)}>
          <span className="wl-switch-track"><span /></span>{t('skipped_checkbox_label')}
        </button>
      </div>
      {p.dateInvalid && <div className="alert alert-error" style={{ marginBottom: 14 }}>{t('workout_date_future')}</div>}

      <div className="wl-list">
        {items.map((it, i) => {
          const { el } = it;
          const muscleKey = MUSCLE_GROUP_TO_KEY[el.muscle_group];
          const needsSave = it.status === 'unsaved' || it.status === 'empty';
          return (
            <section key={el.id} className={`wl-card ${it.status}`}>
              <div className="wl-card-head">
                <span className="wl-num">{i + 1}</span>
                <div className="wl-card-title">
                  <h2><button type="button" className="wl-name-btn" aria-label={`${t('history_open')}: ${el.exercise_name}`}
                    onClick={() => setHistory({ id: el.exercise_id, name: el.exercise_name })}>{el.exercise_name}<History size={14} /></button></h2>
                  <span className="wl-chip">{muscleKey ? t(muscleKey) : el.muscle_group}</span> <span className="wl-plan">{el.sets} × {it.range ?? '—'}</span>
                </div>
                <StatusBadge s={it.status} />
              </div>

              <div className="wl-sets">
                {el.set_logs.map(s => {
                  const pr = it.prevSet(s.set_number);
                  const done = it.status === 'saved' && s.reps != null;
                  return (
                    <div key={s.set_number} className="wl-set">
                      <span className="wl-label">{t('sets_header')} {s.set_number}</span>
                      <input type="number" inputMode="numeric" min={0} className="wl-input" placeholder={t('wl_reps_placeholder')}
                        aria-label={`${t('sets_header')} ${s.set_number}`}
                        value={s.reps ?? ''} onChange={e => p.onEditSet(el.id, s.set_number, e.target.value)} />
                      <select className={`wl-rir${s.rir != null ? ' set' : ''}`} aria-label={t('wl_rir_label')} title={t('wl_rir_label')}
                        value={s.rir ?? ''} onChange={e => p.onEditRir(el.id, s.set_number, e.target.value)}>
                        <option value="">{t('wl_rir_short')}</option>
                        {RIR_VALUES.map(v => <option key={v} value={v}>{t('wl_rir_short')} {v}</option>)}
                      </select>
                      <button type="button" className={`wl-set-save${done ? ' done' : ''}`} aria-label={t('wl_save_set')} title={t('wl_save_set')}
                        disabled={s.reps == null || p.saving[el.id] || p.dateInvalid}
                        onClick={() => saveSet(el, s.set_number, fingerprint(el, it.w), it.prev?.pct ?? null)}>
                        <Check size={18} strokeWidth={3} />
                      </button>
                      <span className="wl-set-prev">
                        {pr?.reps != null && <>{t('wl_prev_short')} <b>{pr.reps}</b></>}
                        {pr?.rir != null && <small>{t('wl_rir_short')} {pr.rir}</small>}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="wl-weight">
                <label>
                  <span className="wl-label">{t('wl_weight_label')}</span>
                  <span className="wl-weight-field">
                    <input type="number" inputMode="decimal" step={0.5} min={0} className="wl-input" placeholder="0"
                      value={it.w} onChange={e => p.onEditWeight(el.id, e.target.value)} />
                    kg
                  </span>
                </label>
                {it.addHint && <span className="wl-hint"><TrendingUp size={13} /> {t('add_weight_hint')}</span>}
              </div>

              {(it.prev || it.w1) && (
                <div className="wl-pills">
                  {it.prev && <Pill label={t('vs_prev_week_label')} d={it.prev} />}
                  {it.w1 && <Pill label={t('vs_week1_label')} d={it.w1} />}
                </div>
              )}

              <div className="wl-note">
                {note?.id === el.id ? (
                  <div className="wl-note-edit">
                    <textarea className="form-input" rows={2} maxLength={500} autoFocus placeholder={t('wl_note_placeholder')} aria-label={t('wl_note_btn')}
                      value={note.text} onChange={e => setNote({ ...note, text: e.target.value })} />
                    {note.error && <span className="wl-note-error">{t('wl_note_error')}</span>}
                    <div className="wl-note-actions">
                      {el.note && <button type="button" className="btn btn-outline btn-sm btn-danger-outline" disabled={note.saving} onClick={() => void saveNote('')}>{t('wl_note_delete')}</button>}
                      <button type="button" className="btn btn-outline btn-sm" disabled={note.saving} onClick={() => setNote(null)}>{t('cancel_btn')}</button>
                      <button type="button" className="btn btn-primary btn-sm" disabled={note.saving} onClick={() => void saveNote(note.text)}>{t('wl_note_save')}</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className={`wl-note-btn${el.note ? ' has' : ''}`} onClick={() => setNote({ id: el.id, text: el.note ?? '', saving: false, error: false })}>
                    <StickyNote size={14} /> <b>{t('wl_note_btn')}</b>{el.note && <span>{el.note}</span>}
                  </button>
                )}
              </div>

              <div className="wl-actions">
                <button type="button" role="switch" aria-checked={el.skipped} className={`wl-switch${el.skipped ? ' on' : ''}`}
                  onClick={() => toggleExerciseSkipped(el.id, !el.skipped)}>
                  <span className="wl-switch-track"><span /></span>{t('exercise_skipped_checkbox')}
                </button>
                <button type="button" disabled={p.saving[el.id] || p.dateInvalid} onClick={() => void save(el.id, fingerprint(el, it.w), it.prev?.pct ?? null)}
                  className={`btn wl-save ${needsSave ? 'btn-primary' : 'btn-outline saved'}`}>
                  {p.saving[el.id] ? t('save_sets_saving') : needsSave ? t('save_sets_btn') : <><Check size={15} strokeWidth={3} /> {t('save_sets_saved')}</>}
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <div className={`wl-finishbar${timer.rest ? ' resting' : ''}`}>
        {/* Kulka jumps in from the bottom of the screen; the clip box hides it below the bar */}
        <span ref={slotRef} className="wl-mascot-slot">
          <span className="wl-mascot-clip"><Mascot entrance="trampoline" size={40}
            state={annoyed ? 'annoyed' : p.skipped ? 'skipped' : reaction ?? (timer.rest ? 'drink' : timer.ready ? 'ready' : deload ? 'stretch' : 'idle')} /></span>
          {timer.ready && !timer.rest && (
            <button type="button" className="wl-rest-bubble" onClick={timer.dismiss}>{t('wl_rest_done')}</button>
          )}
        </span>
        {towelFrom && <TowelThrow key={towelFrom.seq} from={towelFrom} onDone={() => setTowelFrom(null)} />}
        {timer.rest ? (
          <div className="wl-rest" role="timer" aria-label={restEx ? `${t('wl_rest_label')} · ${restEx.exercise_name}` : t('wl_rest_label')}>
            <span className="wl-rest-time"><small>{t('wl_rest_label')}</small><strong>{formatRest(timer.remaining)}</strong></span>
            <button type="button" className="wl-rest-btn" onClick={() => timer.add(REST_ADD_S)}>{t('wl_rest_add')}</button>
            <button type="button" className="wl-rest-btn" onClick={timer.skip}>{t('wl_rest_skip')}</button>
            <span className="wl-rest-bar" style={{ transform: `scaleX(${timer.progress})` }} />
          </div>
        ) : (
          <span className="wl-finish-count">{t('wl_saved_count').replace('{n}', String(savedCount)).replace('{total}', String(items.length))}</span>
        )}
        <button className="btn btn-success btn-lg" disabled={p.dateInvalid} onClick={p.onFinish} aria-label={t('finish_day_btn')}>
          <CheckCircle2 size={18} /> <span className="wl-finish-label">{t('finish_day_btn')}</span>
        </button>
      </div>
      {history && <ExerciseHistorySheet exerciseId={history.id} name={history.name} onClose={() => setHistory(null)} />}
    </div>
  );
}
