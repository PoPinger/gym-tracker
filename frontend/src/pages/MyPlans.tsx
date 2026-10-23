import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { plansApi, logsApi, exercisesApi, apiErrorDetail } from '../services/api';
import { MUSCLE_GROUPS } from '../types';
import PageLoader from '../components/PageLoader';
import PlansEmptyState from '../components/PlansEmptyState';
import PlanCard from '../components/PlanCard';
import DayList from '../components/DayList';
import ExerciseEditor from '../components/ExerciseEditor';
import WorkoutLogger from '../components/WorkoutLogger';
import Mascot from '../components/mascot/Mascot';
import ConfirmDialog from '../components/ConfirmDialog';
import { kulkaDelay, trashDelay, SHRUG_MS, STAMP_MS } from '../components/mascot/trash';
import BuilderKulka, { type BuilderOutcome } from '../components/mascot/BuilderKulka';
import WeeksMascot from '../components/mascot/WeeksMascot';
import CelebrateMascot from '../components/mascot/CelebrateMascot';
import Confetti from '../components/mascot/Confetti';
import CelebrationLayer from '../components/CelebrationLayer';
import { resolveDayColor, type DayColor } from '../utils/dayColors';
import { plural } from '../utils/plural';
import { useLanguage } from '../i18n/LanguageContext';
import { isValidRepRange, repRangePayload } from '../utils/repRange';
import { firstWeight } from '../utils/progress';
import { todayIso } from '../utils/date';
import { DEFAULT_REST } from '../utils/rest';
import { hasUnsaved, useRefresh } from '../hooks/useRefresh';
import { useCelebration, DAY_CELEBRATION_MS, WEEK_CELEBRATION_MS } from '../hooks/useCelebration';
import { navTransition } from '../utils/motion';
import type { PlanSummary, Plan, WeekSummary, WeekInfo, DayLog, SetLog } from '../types';
import {
  ChevronRight, CheckCircle2, XCircle, ArrowLeft,
  Dumbbell, Trophy, Plus, Check,
} from 'lucide-react';

type View = 'list' | 'weeks' | 'days' | 'workout' | 'edit-plan' | 'edit-exercises';

interface EditExDraft { id?: number; name: string; muscle_group: string; sets: number; rep_min: string; rep_max: string; rest_seconds: number; }
interface EditDayDraft { id: number; day_name: string; color: DayColor; exercises: EditExDraft[]; }
// Field values captured before a "skipped" auto-fill, keyed by exercise log id
type FillSnapshot = Record<number, { set_logs: SetLog[]; weight: string }>;

// The weight field of each exercise, filled from its saved sets
const weightsOf = (log: DayLog) => Object.fromEntries(log.exercise_logs.map(el => {
  const w = el.set_logs.find(s => s.weight_kg != null)?.weight_kg ?? null;
  return [el.id, w != null ? String(w) : ''];
}));

export default function MyPlans() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [view, setView]             = useState<View>('list');
  const [plans, setPlans]           = useState<PlanSummary[]>([]);
  const [plan, setPlan]             = useState<Plan | null>(null);
  const [weeks, setWeeks]           = useState<WeekSummary[]>([]);
  const [weekInfo, setWeekInfo]     = useState<WeekInfo | null>(null);
  const [dayLog, setDayLog]         = useState<DayLog | null>(null);
  const [loading, setLoading]       = useState(true);
  const [confirm, setConfirm]       = useState<null | 'day' | 'week' | 'plan' | 'shorten'>(null);

  const [saving,  setSaving]  = useState<Record<number, boolean>>({});
  const [exerciseWeights, setExerciseWeights] = useState<Record<number, string>>({});
  const [workoutDate, setWorkoutDate] = useState('');
  const [skipped, setSkipped]         = useState(false);
  // Week whose day was just finished (not skipped): Kulka plays the "workout done" sequence under its days
  const [restWeekId, setRestWeekId]   = useState<number | null>(null);
  // Week just finished as a whole: Kulka celebrates with big confetti over its days
  const [doneWeekId, setDoneWeekId]   = useState<number | null>(null);
  const [daySnapshot, setDaySnapshot] = useState<FillSnapshot | null>(null);
  const [exSnapshots, setExSnapshots] = useState<FillSnapshot>({});
  const [deloadError, setDeloadError] = useState(false);
  // Finishing a day / week failed to save: shown on that screen, which stays open
  const [finishError, setFinishError] = useState(false);
  const celebration = useCelebration();
  // Opened offline something never loaded on this phone: a short hint instead of an error
  const [offlineMiss, setOfflineMiss] = useState(false);
  const missTimer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(missTimer.current), []);
  const showOfflineMiss = () => {
    setOfflineMiss(true);
    window.clearTimeout(missTimer.current);
    missTimer.current = window.setTimeout(() => setOfflineMiss(false), 5000);
  };

  const [editPlan, setEditPlan]               = useState<Plan | null>(null);
  const [editName, setEditName]               = useState('');
  const [editMonths, setEditMonths]           = useState(3);
  const [editDays, setEditDays]               = useState<EditDayDraft[]>([]);
  const [editActiveDayIdx, setEditActiveDayIdx] = useState(0);
  const [editSaving, setEditSaving]           = useState(false);
  const [editError, setEditError]             = useState('');
  const [editIntro, setEditIntro]             = useState(true); // Kulka's excavator entrance, once per opening
  const [editOutcome, setEditOutcome]         = useState<BuilderOutcome>(null);

  const [planToDelete, setPlanToDelete] = useState<PlanSummary | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try { const r = await plansApi.list(); setPlans(r.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const openPlan = async (p: PlanSummary) => {
    try {
      const [pr, wr] = await Promise.all([plansApi.get(p.id), plansApi.getWeeks(p.id)]);
      navTransition('forward', () => { setPlan(pr.data); setWeeks(wr.data); setOfflineMiss(false); setView('weeks'); });
    } catch { showOfflineMiss(); }
  };

  const openWeek = async (w: WeekSummary) => {
    try {
      const r = await logsApi.getWeekDays(w.id);
      navTransition('forward', () => {
        setRestWeekId(null); setDoneWeekId(null); setDeloadError(false); setFinishError(false); setOfflineMiss(false); setWeekInfo(r.data); setView('days');
      });
    } catch { showOfflineMiss(); }
  };

  // Deload marks the whole week; shown at once, reverted if the request fails
  const toggleDeload = async (isDeload: boolean) => {
    if (!weekInfo) return;
    const weekId = weekInfo.week_id;
    const apply = (v: boolean) => {
      setWeekInfo(w => w && w.week_id === weekId ? { ...w, is_deload: v } : w);
      setWeeks(ws => ws.map(w => w.id === weekId ? { ...w, is_deload: v } : w));
    };
    apply(isDeload); setDeloadError(false);
    try { await logsApi.setDeload(weekId, isDeload); }
    catch { apply(!isDeload); setDeloadError(true); }
  };

  // label: day name and week, shown if the offline-created day can't be saved later
  const openDay = async (weekId: number, planDayId: number, logId: number | null, planId: number, label: string) => {
    let log: DayLog;
    try {
      let resolvedId = logId;
      if (!resolvedId) {
        const r = await logsApi.createDayLog(planDayId, weekId, planId, label);
        resolvedId = r.data.id;
      }
      log = (await logsApi.getDayLog(resolvedId!)).data;
    } catch { showOfflineMiss(); return; }
    navTransition('forward', () => {
      setRestWeekId(null); setDoneWeekId(null); setFinishError(false); setOfflineMiss(false);

      setExerciseWeights(weightsOf(log));
      setWorkoutDate(log.workout_date ?? todayIso());
      setSkipped(log.skipped);
      setDaySnapshot(null);
      setExSnapshots({});
      setDayLog(log);
      setView('workout');
    });
  };

  // Refresh button: re-fetch what the open view shows, in place. The open training day is re-fetched
  // only while nothing in it is unsaved (its date and "skipped" switch stay as they are); the plan editor
  // is never touched and keeps the app from reloading for a new version.
  const [dayRev, setDayRev] = useState(0);
  useRefresh({
    reload: async () => {
      if (view === 'list') { setPlans((await plansApi.list()).data); return; }
      if (!plan || (view !== 'weeks' && view !== 'days' && view !== 'workout')) return;
      const [pr, wr, dr] = await Promise.all([
        plansApi.get(plan.id), plansApi.getWeeks(plan.id), view !== 'weeks' && weekInfo ? logsApi.getWeekDays(weekInfo.week_id) : null,
      ]);
      setPlan(pr.data); setWeeks(wr.data);
      if (dr) setWeekInfo(dr.data);
      if (view !== 'workout' || !dayLog || hasUnsaved()) return;
      const log = (await logsApi.getDayLog(dayLog.id)).data;
      if (hasUnsaved()) return;
      setExerciseWeights(weightsOf(log));
      setDaySnapshot(null);
      setExSnapshots({});
      setDayLog(log);
      setDayRev(r => r + 1); // the logger takes a new saved snapshot
    },
    dirty: () => view === 'edit-plan' || view === 'edit-exercises',
  });

  // Opened from the dashboard calendar: jump straight to the training day
  useEffect(() => {
    const target = (location.state as { openDay?: { planId: number; weekId: number; planDayId: number; logId: number } } | null)?.openDay;
    if (!target) return;
    navigate(location.pathname, { replace: true, state: null });
    (async () => {
      try {
        const [pr, wr, dr] = await Promise.all([
          plansApi.get(target.planId), plansApi.getWeeks(target.planId), logsApi.getWeekDays(target.weekId),
        ]);
        setPlan(pr.data); setWeeks(wr.data); setWeekInfo(dr.data);
        const info: WeekInfo = dr.data;
        const name = info.days.find(d => d.plan_day_id === target.planDayId)?.day_name ?? t('training_fallback');
        await openDay(target.weekId, target.planDayId, target.logId, target.planId, `${name} · ${t('week_tile_label')} ${info.week_number}`);
      } catch { showOfflineMiss(); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editSet = (exLogId: number, setNum: number, raw: string) => {
    const val = raw === '' ? null : Number(raw);
    setDayLog(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercise_logs: prev.exercise_logs.map(el => el.id !== exLogId ? el : {
          ...el,
          set_logs: el.set_logs.map(s => s.set_number !== setNum ? s : { ...s, reps: val }),
        }),
      };
    });
  };

  const editRir = (exLogId: number, setNum: number, raw: string) => {
    const val = raw === '' ? null : Number(raw);
    setDayLog(prev => prev && {
      ...prev,
      exercise_logs: prev.exercise_logs.map(el => el.id !== exLogId ? el : {
        ...el,
        set_logs: el.set_logs.map(s => s.set_number !== setNum ? s : { ...s, rir: val }),
      }),
    });
  };

  // The note belongs to the plan exercise, so it shows every week until changed
  const saveNote = async (exLogId: number, note: string) => {
    const el = dayLog?.exercise_logs.find(e => e.id === exLogId);
    if (!el) return;
    await exercisesApi.saveNote(el.exercise_id, note, el.exercise_name);
    setDayLog(prev => prev && {
      ...prev,
      exercise_logs: prev.exercise_logs.map(e => e.exercise_id === el.exercise_id ? { ...e, note: note || null } : e),
    });
  };

  const editExerciseWeight = (exLogId: number, raw: string) => {
    setExerciseWeights(prev => ({ ...prev, [exLogId]: raw }));
    const val = raw === '' ? null : Number(raw);
    setDayLog(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercise_logs: prev.exercise_logs.map(el => el.id !== exLogId ? el : {
          ...el,
          set_logs: el.set_logs.map(s => ({ ...s, weight_kg: val })),
        }),
      };
    });
  };

  const dateInvalid = !workoutDate || workoutDate > todayIso();

  // Labels of queued writes, shown in the sync pill's list if the server ever rejects one
  const weekLabel = dayLog ? `${t('week_tile_label')} ${dayLog.week_number ?? weekInfo?.week_number ?? ''}` : '';
  const dayLabel = () => `${weekInfo?.days.find(d => d.plan_day_id === dayLog?.plan_day_id)?.day_name ?? t('training_fallback')} · ${weekLabel}`;
  const sendSets = (el: DayLog['exercise_logs'][number]) =>
    logsApi.saveSets(el.id, el.set_logs, `${el.exercise_name} · ${weekLabel}`, workoutDate, skipped, el.skipped);

  // Copy reps/weight from the previous week's same exercise; fields without previous data stay as they are
  const fillFromPrevWeek = (log: DayLog, exLogIds: number[]) => {
    const weights: Record<number, string> = {};
    const exercise_logs = log.exercise_logs.map(el => {
      const prev = log.prev_week_data?.[el.exercise_id];
      if (!exLogIds.includes(el.id) || !prev?.length) return el;
      const w = firstWeight(prev);
      if (w != null) weights[el.id] = String(w);
      return {
        ...el,
        set_logs: el.set_logs.map(s => ({
          ...s,
          reps: prev.find(p => p.set_number === s.set_number)?.reps ?? s.reps,
          weight_kg: w ?? s.weight_kg,
        })),
      };
    });
    setExerciseWeights(prev => ({ ...prev, ...weights }));
    setDayLog({ ...log, exercise_logs });
  };

  const takeSnapshot = (log: DayLog, exLogIds: number[]): FillSnapshot =>
    Object.fromEntries(log.exercise_logs.filter(el => exLogIds.includes(el.id))
      .map(el => [el.id, { set_logs: el.set_logs, weight: exerciseWeights[el.id] ?? '' }]));

  // Restore the pre-check values; without a snapshot (e.g. reopened after saving) the fields are cleared
  const restoreSnapshot = (log: DayLog, exLogIds: number[], snap: FillSnapshot | null) => {
    const weights: Record<number, string> = {};
    const exercise_logs = log.exercise_logs.map(el => {
      if (!exLogIds.includes(el.id)) return el;
      const s = snap?.[el.id];
      weights[el.id] = s ? s.weight : '';
      return { ...el, set_logs: s ? s.set_logs : el.set_logs.map(x => ({ ...x, reps: null, weight_kg: null })) };
    });
    setExerciseWeights(prev => ({ ...prev, ...weights }));
    setDayLog({ ...log, exercise_logs });
  };

  // Skipped workout / exercise: checking auto-fills from the previous week, unchecking reverts the fill
  const toggleSkipped = (checked: boolean) => {
    setSkipped(checked);
    if (!dayLog) return;
    // Individually skipped exercises keep their own state
    const ids = dayLog.exercise_logs.filter(el => !el.skipped).map(el => el.id);
    if (checked) {
      setDaySnapshot(takeSnapshot(dayLog, ids));
      fillFromPrevWeek(dayLog, ids);
    } else {
      restoreSnapshot(dayLog, ids, daySnapshot);
      setDaySnapshot(null);
    }
  };

  const toggleExerciseSkipped = (exLogId: number, checked: boolean) => {
    if (!dayLog) return;
    const log = { ...dayLog, exercise_logs: dayLog.exercise_logs.map(el => el.id === exLogId ? { ...el, skipped: checked } : el) };
    if (checked) {
      setExSnapshots(prev => ({ ...prev, ...takeSnapshot(dayLog, [exLogId]) }));
      fillFromPrevWeek(log, [exLogId]);
    } else {
      const snap = exSnapshots[exLogId];
      restoreSnapshot(log, [exLogId], snap ? { [exLogId]: snap } : null);
      setExSnapshots(prev => { const next = { ...prev }; delete next[exLogId]; return next; });
    }
  };

  const saveSets = async (exLogId: number) => {
    if (!dayLog || dateInvalid) return;
    const el = dayLog.exercise_logs.find(e => e.id === exLogId);
    if (!el) return;
    setSaving(p => ({ ...p, [exLogId]: true }));
    try {
      await sendSets(el);
    } finally { setSaving(p => ({ ...p, [exLogId]: false })); }
  };

  // Saved right away; once saved Kulka celebrates on the logger, then the day list opens (a skipped day
  // has no celebration and goes back at once). A failed save keeps the logger open with an error.
  const finishDay = async () => {
    if (!dayLog || dateInvalid) return;
    const weekId = weekInfo?.week_id ?? null;
    setFinishError(false);
    try {
      // Save every exercise first so typed but unsaved values are never lost (sets are saved per exercise)
      // (queued in this order, so they also reach the server in this order)
      for (const el of dayLog.exercise_logs) await sendSets(el);
      await logsApi.completeDay(dayLog.id, dayLabel(), workoutDate, skipped);
    } catch { setFinishError(true); return; }
    setWeekInfo(w => w && { ...w, days: w.days.map(d => d.plan_day_id === dayLog.plan_day_id ? { ...d, status: 'completed', skipped } : d) });
    if (weekId != null) void logsApi.getWeekDays(weekId).then(r => setWeekInfo(w => w && w.week_id === weekId ? r.data : w), () => {});
    const back = () => navTransition('back', () => { setRestWeekId(skipped ? null : weekId); setView('days'); });
    if (skipped) back(); else celebration.run(DAY_CELEBRATION_MS, back);
  };

  // Saved right away; once saved Kulka celebrates with big confetti over the (now completed) day list,
  // then the weeks list opens. A failed save keeps the day list open with an error.
  const finishWeek = async () => {
    if (!weekInfo || !plan) return;
    const weekId = weekInfo.week_id, planId = plan.id;
    setFinishError(false);
    try { await logsApi.completeWeek(weekId); }
    catch { setFinishError(true); return; }
    setWeekInfo(w => w && w.week_id === weekId ? { ...w, status: 'completed' } : w);
    setWeeks(ws => ws.map(w => w.id === weekId ? { ...w, status: 'completed' } : w));
    setRestWeekId(null); setDoneWeekId(weekId);
    void Promise.all([plansApi.getWeeks(planId), logsApi.getWeekDays(weekId)]).then(([wr, dr]) => {
      setWeeks(wr.data); setWeekInfo(w => w && w.week_id === weekId ? dr.data : w);
    }, () => {});
    celebration.run(WEEK_CELEBRATION_MS, () => navTransition('back', () => setView('weeks')));
  };

  const finishPlan = async () => {
    if (!plan) return;
    await plansApi.complete(plan.id);
    await loadPlans(); navTransition('back', () => setView('list'));
  };

  const copyPlan = async (id: number) => { await plansApi.copy(id); await loadPlans(); };

  const openEdit = async (p: PlanSummary) => {
    const r = await plansApi.get(p.id);
    const full: Plan = r.data;
    navTransition('forward', () => {
      setEditPlan(full);
      setEditName(full.name);
      setEditMonths(full.months);
      setEditDays(full.days.map((d, i) => ({
        id: d.id,
        day_name: d.day_name,
        color: resolveDayColor(d.color, i),
        exercises: d.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          muscle_group: ex.muscle_group,
          sets: ex.sets,
          rep_min: ex.rep_min != null ? String(ex.rep_min) : '',
          rep_max: ex.rep_max != null ? String(ex.rep_max) : '',
          rest_seconds: ex.rest_seconds ?? DEFAULT_REST,
        })),
      })));
      setEditActiveDayIdx(0);
      setEditError('');
      setEditIntro(true);
      setEditOutcome(null);
      setView('edit-plan');
    });
  };

  // closing: the shorten dialog's trash animation or Kulka's stamp, awaited with the request before leaving the view
  const saveEdit = async (closing: Promise<void> = Promise.resolve()) => {
    if (!editPlan) return;
    const named = editDays.flatMap(d => d.exercises.filter(e => e.name.trim()));
    if (named.some(e => !isValidRepRange(e.rep_min, e.rep_max))) { setConfirm(null); setEditError(t('rep_range_error')); return; }
    setEditSaving(true); setEditError(''); setEditOutcome('save');
    try {
      await plansApi.updateStructure(editPlan.id, {
        name: editName,
        days: editDays.map((d) => ({
          id: d.id,
          day_name: d.day_name,
          color: d.color,
          exercises: d.exercises
            .filter(e => e.name.trim())
            .map((e, ei) => ({
              id: e.id, name: e.name, muscle_group: e.muscle_group, sets: e.sets, exercise_order: ei, rest_seconds: e.rest_seconds,
              ...repRangePayload(e.rep_min, e.rep_max),
            })),
        })),
      });
      if (editMonths !== editPlan.months) {
        await plansApi.update(editPlan.id, { months: editMonths });
      }
      await closing;
      setConfirm(null);
      await loadPlans();
      navTransition('back', () => setView('list'));
    } catch (e) {
      setConfirm(null); setEditOutcome(null);
      setEditError(apiErrorDetail(e) || t('save_changes_error'));
    } finally { setEditSaving(false); }
  };

  const handleSaveEdit = () => {
    if (!editPlan || editOutcome) return;
    if (editMonths < editPlan.months) {
      setConfirm('shorten');
    } else {
      void saveEdit(kulkaDelay(STAMP_MS));
    }
  };

  const cancelEdit = () => {
    if (editOutcome) return;
    setEditOutcome('cancel');
    void kulkaDelay(SHRUG_MS).then(() => navTransition('back', () => setView('list')));
  };

  const addEditEx = () => {
    setEditDays(d => d.map((day, i) => i !== editActiveDayIdx ? day : {
      ...day, exercises: [...day.exercises, { name: '', muscle_group: MUSCLE_GROUPS[0], sets: 3, rep_min: '', rep_max: '', rest_seconds: DEFAULT_REST }]
    }));
  };

  const setEditEx = (ei: number, field: keyof EditExDraft, val: string | number) => {
    setEditDays(d => d.map((day, i) => i !== editActiveDayIdx ? day : {
      ...day, exercises: day.exercises.map((ex, j) => j !== ei ? ex : { ...ex, [field]: val })
    }));
  };

  const removeEditEx = (ei: number) => {
    setEditDays(d => d.map((day, i) => i !== editActiveDayIdx ? day : {
      ...day, exercises: day.exercises.filter((_, j) => j !== ei)
    }));
  };

  const moveEditEx = (ei: number, dir: -1 | 1) => {
    const target = ei + dir;
    setEditDays(d => d.map((day, i) => {
      if (i !== editActiveDayIdx) return day;
      const exs = [...day.exercises];
      if (target < 0 || target >= exs.length) return day;
      [exs[ei], exs[target]] = [exs[target], exs[ei]];
      return { ...day, exercises: exs };
    }));
  };

  const deletePlan = async () => {
    if (!planToDelete) return;
    await Promise.all([plansApi.delete(planToDelete.id), trashDelay()]);
    setPlanToDelete(null);
    await loadPlans();
  };

  const allDaysComplete  = weekInfo?.days.every(d => d.status === 'completed') ?? false;
  const allWeeksComplete = weeks.length > 0 && weeks.every(w => w.status === 'completed');
  const completedWeeks   = weeks.filter(w => w.status === 'completed').length;
  const currentWeekId    = weeks.find(w => w.status !== 'completed')?.id;

  if (loading) return <PageLoader cards={3} />;

  /* ═══ PLAN LIST ═══ */
  if (view === 'list') return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('my_plans_title')}</h1>
          <p className="page-subtitle">
            {plans.length} {plans.length === 1 ? t('plans_count_1') : t('plans_count_other')} {t('plans_total_suffix')}
          </p>
        </div>
        {/* With no plans the empty state has the only call to action */}
        {plans.length > 0 && (
          <button className="btn btn-primary" onClick={() => navTransition('forward', () => navigate('/create-plan'))}>
            <Plus size={16} /> {t('new_plan_btn')}
          </button>
        )}
      </div>

      {offlineMiss && <div className="alert alert-info" role="status">{t('offline_unavailable')}</div>}
      {plans.length === 0 ? (
        <PlansEmptyState onCreate={() => navTransition('forward', () => navigate('/create-plan'))} />
      ) : (
        <div className="plan-list has-mascot">
          <div className="m-spot-plans"><Mascot entrance="peek" size={40} /></div>
          {plans.map(p => (
            <PlanCard key={p.id} plan={p} onOpen={() => openPlan(p)} onEdit={() => openEdit(p)}
              onCopy={() => copyPlan(p.id)} onDelete={() => setPlanToDelete(p)} />
          ))}
        </div>
      )}

      {planToDelete && (
        <ConfirmDialog
          title={t('delete_plan_title')}
          body={t('delete_plan_body')}
          okLabel={t('delete_plan_confirm')} okClass="btn-danger" trash
          cancelLabel={t('cancel_btn')}
          onOk={deletePlan} onCancel={() => setPlanToDelete(null)}
        />
      )}
    </div>
  );

  /* ═══ EDIT PLAN – DAY LIST ═══ */
  if (view === 'edit-plan' && editPlan) {
    return (
      <div style={{ maxWidth: 720 }}>
        <button className="back-btn" onClick={() => navTransition('back', () => setView('list'))}>
          <ArrowLeft size={15} /> {t('back_to_my_plans')}
        </button>
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('edit_plan_title')}</h1>
            <p className="page-subtitle">
              {editPlan.days_per_week} {t('days_per_week_abbr')} · {editMonths} {t('months_abbr')} · {editMonths * 4} {t('weeks_abbr')}
            </p>
          </div>
        </div>

        <div className="card has-builder">
          <BuilderKulka activity={`${editName}|${editMonths}|${JSON.stringify(editDays)}`} outcome={editOutcome}
            intro={editIntro} onIntroDone={() => setEditIntro(false)} />
          <div className="form-group" style={{ marginBottom:24 }}>
            <label className="form-label">{t('plan_name_label')}</label>
            <input className="form-input" value={editName}
              onChange={e => setEditName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('edit_duration_label')}</label>
            <div className="seg-control seg-control-12" role="radiogroup" aria-label={t('edit_duration_label')}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button key={n} role="radio" aria-checked={editMonths === n}
                  className={editMonths === n ? 'selected' : ''} onClick={() => setEditMonths(n)}>{n}</button>
              ))}
            </div>
            <div className="plan-stats">
              <div>
                <span className="plan-stat">{editMonths * 4}</span>
                <span className="day-list-label">{plural(editMonths * 4, t('weeks_1'), t('weeks_2_4'), t('weeks_5plus'))}</span>
              </div>
              <div>
                <span className="plan-stat">{editMonths * 4 * editPlan.days_per_week}</span>
                <span className="day-list-label">{plural(editMonths * 4 * editPlan.days_per_week, t('workouts_1'), t('workouts_2_4'), t('workouts_5plus'))}</span>
              </div>
            </div>
          </div>

          <DayList days={editDays}
            onDayNameChange={(i, name) => setEditDays(ds => ds.map((d, idx) => idx === i ? { ...d, day_name: name } : d))}
            onDayColorChange={(i, color) => setEditDays(ds => ds.map((d, idx) => idx === i ? { ...d, color } : d))}
            onOpenExercises={i => navTransition('forward', () => { setEditActiveDayIdx(i); setView('edit-exercises'); })} />

          {editError && <div className="alert alert-error" style={{ marginBottom:16 }}>{editError}</div>}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="btn btn-outline" onClick={cancelEdit}>{t('cancel_btn')}</button>
            <button className="btn btn-primary" disabled={editSaving} onClick={handleSaveEdit}>
              {editSaving ? t('saving') : t('save_changes_btn')}
            </button>
          </div>
        </div>

        {confirm === 'shorten' && (
          <ConfirmDialog
            title={t('shorten_plan_title')}
            body={t('shorten_plan_body')}
            okLabel={t('shorten_plan_confirm')} okClass="btn-danger" trash
            cancelLabel={t('cancel_btn')}
            onOk={() => void saveEdit(trashDelay())}
            onCancel={() => setConfirm(null)}
          />
        )}
      </div>
    );
  }

  /* ═══ EDIT EXERCISES ═══ */
  if (view === 'edit-exercises' && editPlan) {
    const activeEditDay = editDays[editActiveDayIdx];
    return (
      <ExerciseEditor dayName={activeEditDay?.day_name ?? ''} color={activeEditDay?.color ?? resolveDayColor(null, editActiveDayIdx)}
        exercises={activeEditDay?.exercises ?? []} onChange={setEditEx} onMove={moveEditEx} onRemove={removeEditEx}
        onAdd={addEditEx} onDone={() => navTransition('back', () => setView('edit-plan'))} onBack={() => navTransition('back', () => setView('edit-plan'))} />
    );
  }

  /* ═══ WEEKS VIEW ═══ */
  if (view === 'weeks' && plan) return (
    <div style={{ maxWidth: 900 }}>
      <button className="back-btn" onClick={() => navTransition('back', () => setView('list'))}>
        <ArrowLeft size={15} /> {t('back_to_my_plans')}
      </button>
      <div className="page-header">
        <div>
          <h1 className="page-title">{plan.name}</h1>
          <p className="page-subtitle">{plan.months * 4} {t('weeks_abbr')} · {plan.days_per_week} {t('days_per_week_abbr')}</p>
        </div>
        {allWeeksComplete && plan.status !== 'completed' && (
          <button className="btn btn-success" onClick={() => setConfirm('plan')}>
            <Trophy size={16} /> {t('finish_plan_btn')}
          </button>
        )}
      </div>

      <div className={`plan-summary-card${allWeeksComplete ? ' has-mascot' : ''}`}>
        {allWeeksComplete && <div className="m-spot-summary"><Mascot state="cheer" size={48} /></div>}
        <div className="plan-summary-count">
          <span className="plan-summary-big">{completedWeeks}<small>/{weeks.length}</small></span>
          <span className="day-list-label">{t('weeks_completed_label')}</span>
        </div>
        <div className="plan-progress-bar"><span style={{ width: `${weeks.length ? completedWeeks / weeks.length * 100 : 0}%` }} /></div>
        <div className="day-dots">
          {plan.days.map((d, i) => (
            <span key={d.id} className={`day-dot day-color-${resolveDayColor(d.color, i)}`}><span />{d.day_name}</span>
          ))}
        </div>
      </div>

      {offlineMiss && <div className="alert alert-info" role="status">{t('offline_unavailable')}</div>}
      <div className={`week-cards${currentWeekId != null ? ' has-mascot' : ''}`}>
        {currentWeekId != null && <WeeksMascot />}
        {weeks.map(w => {
          const state = w.status === 'completed' ? 'done' : w.id === currentWeekId ? 'current' : '';
          return (
            <button key={w.id} className={`week-card ${state}${w.is_deload ? ' deload' : ''}`} onClick={() => openWeek(w)}>
              <span className="day-list-label">{t('week_tile_label')}</span>
              {w.is_deload && <span className="deload-badge">{t('deload_badge')}</span>}
              <span className="week-card-num">{w.week_number}</span>
              <span className="week-card-state">
                {state === 'done' ? <><Check size={12} /> {t('done_label')}</> : state === 'current' ? t('week_current') : t('week_planned')}
              </span>
            </button>
          );
        })}
      </div>

      {confirm === 'plan' && (
        <ConfirmDialog
          title={t('finish_plan_title')}
          body={t('finish_plan_body')}
          okLabel={t('finish_plan_btn')} okClass="btn-success"
          cancelLabel={t('cancel_btn')}
          onOk={() => { finishPlan(); setConfirm(null); }} onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );

  /* ═══ DAYS VIEW ═══ */
  if (view === 'days' && weekInfo && plan) return (
    <div style={{ maxWidth: 700 }}>
      <button className="back-btn" onClick={() => navTransition('back', () => setView('weeks'))}>
        <ArrowLeft size={15} /> {t('all_weeks')}
      </button>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('week_tile_label')} {weekInfo.week_number}{weekInfo.is_deload && <> <span className="deload-badge">{t('deload_badge')}</span></>}</h1>
          <p className="page-subtitle">{weekInfo.plan_name}</p>
        </div>
        {allDaysComplete && weekInfo.status !== 'completed' && (
          <button className="btn btn-success" onClick={() => setConfirm('week')}>
            <CheckCircle2 size={16} /> {t('finish_week_btn')}
          </button>
        )}
      </div>

      <div className={`deload-bar${weekInfo.is_deload ? ' on' : ''}`}>
        <button type="button" role="switch" aria-checked={weekInfo.is_deload} className={`wl-switch deload${weekInfo.is_deload ? ' on' : ''}`}
          onClick={() => void toggleDeload(!weekInfo.is_deload)}>
          <span className="wl-switch-track"><span /></span>
          <span className="deload-bar-text">{t('deload_toggle')}<small>{t('deload_hint')}</small></span>
        </button>
        {weekInfo.is_deload && <Mascot state="stretch" size={40} />}
      </div>
      {deloadError && <div className="alert alert-error" style={{ marginBottom: 14 }}>{t('deload_error')}</div>}
      {finishError && <div className="alert alert-error" role="alert" style={{ marginBottom: 14 }}>{t('finish_save_error')}</div>}

      {offlineMiss && <div className="alert alert-info" role="status">{t('offline_unavailable')}</div>}
      <div className="day-cards">
        {doneWeekId === weekInfo.week_id && <Confetti big />}
        {weekInfo.days.map((d, i) => {
          const state = d.status === 'completed' ? (d.skipped ? 'skipped' : 'done') : '';
          return (
            <button key={d.plan_day_id} className={`day-card day-color-${resolveDayColor(d.color, i)} ${state}`}
              onClick={() => openDay(weekInfo.week_id, d.plan_day_id, d.log_id, weekInfo.plan_id, `${d.day_name} · ${t('week_tile_label')} ${weekInfo.week_number}`)}>
              <span className="day-card-icon">
                {state === 'skipped' ? <XCircle size={20} /> : state === 'done' ? <CheckCircle2 size={20} /> : <Dumbbell size={20} />}
              </span>
              <span className="day-card-body">
                <span className="day-list-label">{t('day_number_fallback')} {i + 1}</span>
                <span className="day-card-name">{d.day_name}</span>
              </span>
              <span className={`status-pill ${state}`}>
                {state === 'skipped' ? t('skipped_label') : state === 'done' ? t('done_label') : t('tap_to_train')}
              </span>
              <ChevronRight size={16} className="day-card-chevron" />
            </button>
          );
        })}
      </div>
      {doneWeekId === weekInfo.week_id
        ? <div className="m-spot-rest"><CelebrateMascot week /></div>
        : restWeekId === weekInfo.week_id && <div className="m-spot-rest"><Mascot state="done" size={52} /></div>}

      {confirm === 'week' && (
        <ConfirmDialog
          title={`${t('finish_week_question')} ${weekInfo.week_number}?`}
          body={t('finish_week_body')}
          okLabel={t('finish_week_btn')} okClass="btn-success"
          cancelLabel={t('cancel_btn')}
          onOk={() => { finishWeek(); setConfirm(null); }} onCancel={() => setConfirm(null)}
        />
      )}
      {celebration.active && <CelebrationLayer onSkip={celebration.skip} />}
    </div>
  );

  /* ═══ WORKOUT LOGGER ═══ */
  if (view === 'workout' && dayLog && weekInfo) {
    const dayIdx  = weekInfo.days.findIndex(d => d.plan_day_id === dayLog.plan_day_id);
    const day     = weekInfo.days[dayIdx];
    return (
      <>
        <WorkoutLogger key={`${dayLog.id}-${dayRev}`} dayLog={dayLog} dayName={day?.day_name ?? t('training_fallback')} color={resolveDayColor(day?.color, Math.max(dayIdx, 0))}
          backLabel={`${t('week_tile_label')} ${weekInfo.week_number}`} onBack={() => navTransition('back', () => setView('days'))}
          workoutDate={workoutDate} onDateChange={setWorkoutDate} dateInvalid={dateInvalid}
          skipped={skipped} onToggleSkipped={toggleSkipped} onToggleExerciseSkipped={toggleExerciseSkipped}
          weights={exerciseWeights} onEditSet={editSet} onEditWeight={editExerciseWeight} onEditRir={editRir} onSaveNote={saveNote}
          onSave={saveSets} saving={saving} onFinish={() => setConfirm('day')} finishError={finishError} />
        {celebration.active && (
          <CelebrationLayer onSkip={celebration.skip}>
            <span className="celebrate-kulka"><CelebrateMascot size={64} /></span>
          </CelebrationLayer>
        )}

        {confirm === 'day' && (
          <ConfirmDialog
            title={t('finish_day_title')}
            body={t('finish_day_body')}
            okLabel={t('finish_day_btn')} okClass="btn-success"
            cancelLabel={t('cancel_btn')}
            onOk={() => { finishDay(); setConfirm(null); }} onCancel={() => setConfirm(null)}
          />
        )}
      </>
    );
  }

  return null;
}
