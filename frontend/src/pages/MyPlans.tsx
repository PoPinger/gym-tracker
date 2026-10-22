import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { plansApi, logsApi, apiErrorDetail } from '../services/api';
import { MUSCLE_GROUPS } from '../types';
import AppLoader from '../components/AppLoader';
import PlansEmptyState from '../components/PlansEmptyState';
import PlanCard from '../components/PlanCard';
import DayList from '../components/DayList';
import ExerciseEditor from '../components/ExerciseEditor';
import WorkoutLogger from '../components/WorkoutLogger';
import Mascot from '../components/mascot/Mascot';
import ConfirmDialog from '../components/ConfirmDialog';
import { trashDelay } from '../components/mascot/trash';
import WeeksMascot from '../components/mascot/WeeksMascot';
import CelebrateMascot from '../components/mascot/CelebrateMascot';
import Confetti from '../components/mascot/Confetti';
import { resolveDayColor, type DayColor } from '../utils/dayColors';
import { plural } from '../utils/plural';
import { useLanguage } from '../i18n/LanguageContext';
import { isValidRepRange, repRangePayload } from '../utils/repRange';
import { firstWeight } from '../utils/progress';
import { todayIso } from '../utils/date';
import type { PlanSummary, Plan, WeekSummary, WeekInfo, DayLog, SetLog } from '../types';
import {
  ChevronRight, CheckCircle2, XCircle, ArrowLeft,
  Dumbbell, Trophy, Plus, Check,
} from 'lucide-react';

type View = 'list' | 'weeks' | 'days' | 'workout' | 'edit-plan' | 'edit-exercises';

interface EditExDraft { id?: number; name: string; muscle_group: string; sets: number; rep_min: string; rep_max: string; }
interface EditDayDraft { id: number; day_name: string; color: DayColor; exercises: EditExDraft[]; }
// Field values captured before a "skipped" auto-fill, keyed by exercise log id
type FillSnapshot = Record<number, { set_logs: SetLog[]; weight: string }>;

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

  const [editPlan, setEditPlan]               = useState<Plan | null>(null);
  const [editName, setEditName]               = useState('');
  const [editMonths, setEditMonths]           = useState(3);
  const [editDays, setEditDays]               = useState<EditDayDraft[]>([]);
  const [editActiveDayIdx, setEditActiveDayIdx] = useState(0);
  const [editSaving, setEditSaving]           = useState(false);
  const [editError, setEditError]             = useState('');

  const [planToDelete, setPlanToDelete] = useState<PlanSummary | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try { const r = await plansApi.list(); setPlans(r.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const openPlan = async (p: PlanSummary) => {
    const [pr, wr] = await Promise.all([plansApi.get(p.id), plansApi.getWeeks(p.id)]);
    setPlan(pr.data); setWeeks(wr.data); setView('weeks');
  };

  const openWeek = async (w: WeekSummary) => {
    const r = await logsApi.getWeekDays(w.id);
    setRestWeekId(null); setDoneWeekId(null); setWeekInfo(r.data); setView('days');
  };

  const openDay = async (weekId: number, planDayId: number, logId: number | null) => {
    setRestWeekId(null); setDoneWeekId(null);
    let resolvedId = logId;
    if (!resolvedId) {
      const r = await logsApi.createDayLog(planDayId, weekId);
      resolvedId = r.data.id;
    }
    const r = await logsApi.getDayLog(resolvedId!);
    const log: DayLog = r.data;

    const weights: Record<number, string> = {};
    for (const el of log.exercise_logs) {
      const w = el.set_logs.find(s => s.weight_kg != null)?.weight_kg ?? null;
      weights[el.id] = w != null ? String(w) : '';
    }
    setExerciseWeights(weights);
    setWorkoutDate(log.workout_date ?? todayIso());
    setSkipped(log.skipped);
    setDaySnapshot(null);
    setExSnapshots({});
    setDayLog(log);
    setView('workout');
  };

  // Opened from the dashboard calendar: jump straight to the training day
  useEffect(() => {
    const target = (location.state as { openDay?: { planId: number; weekId: number; planDayId: number; logId: number } } | null)?.openDay;
    if (!target) return;
    navigate(location.pathname, { replace: true, state: null });
    (async () => {
      const [pr, wr, dr] = await Promise.all([
        plansApi.get(target.planId), plansApi.getWeeks(target.planId), logsApi.getWeekDays(target.weekId),
      ]);
      setPlan(pr.data); setWeeks(wr.data); setWeekInfo(dr.data);
      await openDay(target.weekId, target.planDayId, target.logId);
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
      await logsApi.saveSets(exLogId, el.set_logs, workoutDate, skipped, el.skipped);
    } finally { setSaving(p => ({ ...p, [exLogId]: false })); }
  };

  const finishDay = async () => {
    if (!dayLog || dateInvalid) return;
    // Save every exercise first so typed but unsaved values are never lost (sets are saved per exercise)
    await Promise.all(dayLog.exercise_logs.map(el => logsApi.saveSets(el.id, el.set_logs, workoutDate, skipped, el.skipped)));
    await logsApi.completeDay(dayLog.id, workoutDate, skipped);
    if (weekInfo) { const r = await logsApi.getWeekDays(weekInfo.week_id); setWeekInfo(r.data); }
    setRestWeekId(skipped ? null : weekInfo?.week_id ?? null);
    setView('days');
  };

  const finishWeek = async () => {
    if (!weekInfo || !plan) return;
    await logsApi.completeWeek(weekInfo.week_id);
    // Stay on the day list (now shown as completed) for the celebration
    const [wr, dr] = await Promise.all([plansApi.getWeeks(plan.id), logsApi.getWeekDays(weekInfo.week_id)]);
    setWeeks(wr.data); setWeekInfo(dr.data); setRestWeekId(null); setDoneWeekId(weekInfo.week_id);
  };

  const finishPlan = async () => {
    if (!plan) return;
    await plansApi.complete(plan.id);
    await loadPlans(); setView('list');
  };

  const copyPlan = async (id: number) => { await plansApi.copy(id); await loadPlans(); };

  const openEdit = async (p: PlanSummary) => {
    const r = await plansApi.get(p.id);
    const full: Plan = r.data;
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
      })),
    })));
    setEditActiveDayIdx(0);
    setEditError('');
    setView('edit-plan');
  };

  // closing: the shorten dialog's trash animation, awaited with the request before leaving the view
  const saveEdit = async (closing: Promise<void> = Promise.resolve()) => {
    if (!editPlan) return;
    const named = editDays.flatMap(d => d.exercises.filter(e => e.name.trim()));
    if (named.some(e => !isValidRepRange(e.rep_min, e.rep_max))) { setConfirm(null); setEditError(t('rep_range_error')); return; }
    setEditSaving(true); setEditError('');
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
              id: e.id, name: e.name, muscle_group: e.muscle_group, sets: e.sets, exercise_order: ei,
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
      setView('list');
    } catch (e) {
      setConfirm(null);
      setEditError(apiErrorDetail(e) || t('save_changes_error'));
    } finally { setEditSaving(false); }
  };

  const handleSaveEdit = () => {
    if (!editPlan) return;
    if (editMonths < editPlan.months) {
      setConfirm('shorten');
    } else {
      void saveEdit();
    }
  };

  const addEditEx = () => {
    setEditDays(d => d.map((day, i) => i !== editActiveDayIdx ? day : {
      ...day, exercises: [...day.exercises, { name: '', muscle_group: MUSCLE_GROUPS[0], sets: 3, rep_min: '', rep_max: '' }]
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

  if (loading) return <AppLoader />;

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
          <button className="btn btn-primary" onClick={() => navigate('/create-plan')}>
            <Plus size={16} /> {t('new_plan_btn')}
          </button>
        )}
      </div>

      {plans.length === 0 ? (
        <PlansEmptyState onCreate={() => navigate('/create-plan')} />
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
        <button className="back-btn" onClick={() => setView('list')}>
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

        <div className="card">
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
            onOpenExercises={i => { setEditActiveDayIdx(i); setView('edit-exercises'); }} />

          {editError && <div className="alert alert-error" style={{ marginBottom:16 }}>{editError}</div>}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="btn btn-outline" onClick={() => setView('list')}>{t('cancel_btn')}</button>
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
        onAdd={addEditEx} onDone={() => setView('edit-plan')} onBack={() => setView('edit-plan')} />
    );
  }

  /* ═══ WEEKS VIEW ═══ */
  if (view === 'weeks' && plan) return (
    <div style={{ maxWidth: 900 }}>
      <button className="back-btn" onClick={() => setView('list')}>
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

      <div className={`week-cards${currentWeekId != null ? ' has-mascot' : ''}`}>
        {currentWeekId != null && <WeeksMascot />}
        {weeks.map(w => {
          const state = w.status === 'completed' ? 'done' : w.id === currentWeekId ? 'current' : '';
          return (
            <button key={w.id} className={`week-card ${state}`} onClick={() => openWeek(w)}>
              <span className="day-list-label">{t('week_tile_label')}</span>
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
      <button className="back-btn" onClick={() => setView('weeks')}>
        <ArrowLeft size={15} /> {t('all_weeks')}
      </button>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('week_tile_label')} {weekInfo.week_number}</h1>
          <p className="page-subtitle">{weekInfo.plan_name}</p>
        </div>
        {allDaysComplete && weekInfo.status !== 'completed' && (
          <button className="btn btn-success" onClick={() => setConfirm('week')}>
            <CheckCircle2 size={16} /> {t('finish_week_btn')}
          </button>
        )}
      </div>

      <div className="day-cards">
        {doneWeekId === weekInfo.week_id && <Confetti big />}
        {weekInfo.days.map((d, i) => {
          const state = d.status === 'completed' ? (d.skipped ? 'skipped' : 'done') : '';
          return (
            <button key={d.plan_day_id} className={`day-card day-color-${resolveDayColor(d.color, i)} ${state}`}
              onClick={() => openDay(weekInfo.week_id, d.plan_day_id, d.log_id)}>
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
        : restWeekId === weekInfo.week_id && <div className="m-spot-rest"><CelebrateMascot /></div>}

      {confirm === 'week' && (
        <ConfirmDialog
          title={`${t('finish_week_question')} ${weekInfo.week_number}?`}
          body={t('finish_week_body')}
          okLabel={t('finish_week_btn')} okClass="btn-success"
          cancelLabel={t('cancel_btn')}
          onOk={() => { finishWeek(); setConfirm(null); }} onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );

  /* ═══ WORKOUT LOGGER ═══ */
  if (view === 'workout' && dayLog && weekInfo) {
    const dayIdx  = weekInfo.days.findIndex(d => d.plan_day_id === dayLog.plan_day_id);
    const day     = weekInfo.days[dayIdx];
    return (
      <>
        <WorkoutLogger key={dayLog.id} dayLog={dayLog} dayName={day?.day_name ?? t('training_fallback')} color={resolveDayColor(day?.color, Math.max(dayIdx, 0))}
          backLabel={`${t('week_tile_label')} ${weekInfo.week_number}`} onBack={() => setView('days')}
          workoutDate={workoutDate} onDateChange={setWorkoutDate} dateInvalid={dateInvalid}
          skipped={skipped} onToggleSkipped={toggleSkipped} onToggleExerciseSkipped={toggleExerciseSkipped}
          weights={exerciseWeights} onEditSet={editSet} onEditWeight={editExerciseWeight}
          onSave={saveSets} saving={saving} onFinish={() => setConfirm('day')} />

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
