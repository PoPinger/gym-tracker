import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { plansApi, logsApi, apiErrorDetail } from '../services/api';
import { MUSCLE_GROUPS } from '../types';
import { MUSCLE_GROUP_TO_KEY } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';
import { isValidRepRange, repRangePayload, formatRepRange } from '../utils/repRange';
import { exerciseScore, progressPct, formatPct, formatKg, firstWeight, shouldAddWeight } from '../utils/progress';
import { todayIso } from '../utils/date';
import type { PlanSummary, Plan, WeekSummary, WeekInfo, DayLog, SetLog } from '../types';
import {
  ChevronRight, Copy, CheckCircle2, XCircle, ArrowLeft,
  Dumbbell, Trophy, Plus,
  Pencil, Trash2, ChevronUp, ChevronDown,
} from 'lucide-react';

type View = 'list' | 'weeks' | 'days' | 'workout' | 'edit-plan' | 'edit-exercises';

interface EditExDraft { id?: number; name: string; muscle_group: string; sets: number; rep_min: string; rep_max: string; }
interface EditDayDraft { id: number; day_name: string; exercises: EditExDraft[]; }
// Field values captured before a "skipped" auto-fill, keyed by exercise log id
type FillSnapshot = Record<number, { set_logs: SetLog[]; weight: string }>;

function RefBlock({ title, weightLabel, progressLabel, weight, pct, lang }: {
  title: string; weightLabel: string; progressLabel: string;
  weight: number | null; pct: number | null; lang: string;
}) {
  const pctColor = pct == null || pct === 0 ? 'var(--text-muted)' : pct > 0 ? 'var(--success)' : 'var(--danger)';
  const label = { fontSize:11, color:'var(--text-subtle)' } as const;
  const value = { fontSize:15, fontWeight:600, color:'var(--text-heading)' } as const;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <span style={{ ...label, fontWeight:600 }}>{title}</span>
      <div style={{ display:'flex', alignItems:'baseline', gap:'2px 12px', flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'baseline', gap:4 }}>
          <span style={label}>{weightLabel}</span>
          <span style={value}>{weight != null ? formatKg(weight, lang) : '—'}</span>
        </span>
        <span style={{ display:'flex', alignItems:'baseline', gap:4 }}>
          <span style={label}>{progressLabel}</span>
          <span style={{ ...value, color: pctColor }}>{pct != null ? formatPct(pct, lang) : '—'}</span>
        </span>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, body, onOk, onCancel, okLabel, cancelLabel, okClass = 'btn-primary' }: {
  title: string; body: string; onOk: () => void; onCancel: () => void;
  okLabel: string; cancelLabel: string; okClass?: string;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">{title}</div>
        <p className="modal-body">{body}</p>
        <div className="modal-actions">
          <button className="btn btn-outline btn-sm" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${okClass} btn-sm`} onClick={onOk}>{okLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function MyPlans() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();

  const [view, setView]             = useState<View>('list');
  const [plans, setPlans]           = useState<PlanSummary[]>([]);
  const [plan, setPlan]             = useState<Plan | null>(null);
  const [weeks, setWeeks]           = useState<WeekSummary[]>([]);
  const [weekInfo, setWeekInfo]     = useState<WeekInfo | null>(null);
  const [dayLog, setDayLog]         = useState<DayLog | null>(null);
  const [loading, setLoading]       = useState(true);
  const [confirm, setConfirm]       = useState<null | 'day' | 'week' | 'plan' | 'shorten'>(null);

  const [saving,  setSaving]  = useState<Record<number, boolean>>({});
  const [saved,   setSaved]   = useState<Record<number, boolean>>({});
  const [exerciseWeights, setExerciseWeights] = useState<Record<number, string>>({});
  const [workoutDate, setWorkoutDate] = useState('');
  const [skipped, setSkipped]         = useState(false);
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
    setWeekInfo(r.data); setView('days');
  };

  const openDay = async (weekId: number, planDayId: number, logId: number | null) => {
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
      setSaved(p => ({ ...p, [exLogId]: true }));
      setTimeout(() => setSaved(p => ({ ...p, [exLogId]: false })), 2500);
    } finally { setSaving(p => ({ ...p, [exLogId]: false })); }
  };

  const finishDay = async () => {
    if (!dayLog || dateInvalid) return;
    // Save every exercise first so typed but unsaved values are never lost (sets are saved per exercise)
    await Promise.all(dayLog.exercise_logs.map(el => logsApi.saveSets(el.id, el.set_logs, workoutDate, skipped, el.skipped)));
    await logsApi.completeDay(dayLog.id, workoutDate, skipped);
    if (weekInfo) { const r = await logsApi.getWeekDays(weekInfo.week_id); setWeekInfo(r.data); }
    setView('days');
  };

  const finishWeek = async () => {
    if (!weekInfo || !plan) return;
    await logsApi.completeWeek(weekInfo.week_id);
    const r = await plansApi.getWeeks(plan.id); setWeeks(r.data); setView('weeks');
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
    setEditDays(full.days.map(d => ({
      id: d.id,
      day_name: d.day_name,
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

  const saveEdit = async () => {
    if (!editPlan) return;
    const named = editDays.flatMap(d => d.exercises.filter(e => e.name.trim()));
    if (named.some(e => !isValidRepRange(e.rep_min, e.rep_max))) { setEditError(t('rep_range_error')); return; }
    setEditSaving(true); setEditError('');
    try {
      await plansApi.updateStructure(editPlan.id, {
        name: editName,
        days: editDays.map((d) => ({
          id: d.id,
          day_name: d.day_name,
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
      await loadPlans();
      setView('list');
    } catch (e) {
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
    await plansApi.delete(planToDelete.id);
    setPlanToDelete(null);
    await loadPlans();
  };

  const prevR = (exId: number, setNum: number) =>
    dayLog?.prev_week_data?.[exId]?.find(s => s.set_number === setNum)?.reps ?? null;

  const allDaysComplete  = weekInfo?.days.every(d => d.status === 'completed') ?? false;
  const allWeeksComplete = weeks.length > 0 && weeks.every(w => w.status === 'completed');

  if (loading) return <div className="loading-screen"><div className="spinner" /><span className="loading-text">{t('loading_plans')}</span></div>;

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
        <button className="btn btn-primary" onClick={() => navigate('/create-plan')}>
          <Plus size={16} /> {t('new_plan_btn')}
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-emoji">📋</div>
          <h3>{t('no_plans_title')}</h3>
          <p>{t('no_plans_body')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-plan')}>{t('create_plan_btn')}</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {plans.map(p => (
            <div key={p.id} className={`plan-card ${p.status === 'completed' ? 'completed-plan' : ''}`}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                  <span className="plan-card-name">{p.name}</span>
                  <span className={`badge ${p.status === 'completed' ? 'badge-completed' : 'badge-active'}`}>
                    {p.status === 'completed' ? <><CheckCircle2 size={10} /> {t('badge_completed')}</> : t('badge_active')}
                  </span>
                </div>
                <div className="plan-card-meta">
                  {p.days_per_week} {t('days_per_week_abbr')} · {p.months} {t('months_abbr')} · {p.months * 4} {t('weeks_abbr')}
                </div>
              </div>
              <div className="plan-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => copyPlan(p.id)}>
                  <Copy size={13} /> {t('copy_btn')}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>
                  <Pencil size={13} /> {t('edit_btn')}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setPlanToDelete(p)}
                  style={{ color:'var(--danger)', borderColor:'var(--danger)' }}>
                  <Trash2 size={13} /> {t('delete_btn')}
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => openPlan(p)}>
                  {t('open_btn')} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {planToDelete && (
        <ConfirmDialog
          title={t('delete_plan_title')}
          body={t('delete_plan_body')}
          okLabel={t('delete_plan_confirm')} okClass="btn-danger"
          cancelLabel={t('cancel_btn')}
          onOk={deletePlan} onCancel={() => setPlanToDelete(null)}
        />
      )}
    </div>
  );

  /* ═══ EDIT PLAN – DAY LIST ═══ */
  if (view === 'edit-plan' && editPlan) {
    const activeEditDay = editDays[editActiveDayIdx];
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

          <div className="form-group" style={{ marginBottom:24 }}>
            <label className="form-label">{t('edit_duration_label')}</label>
            <div className="num-picker" style={{ marginBottom:8 }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button key={n} className={`num-pill ${editMonths === n ? 'selected' : ''}`}
                  onClick={() => setEditMonths(n)}>{n}</button>
              ))}
            </div>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>
              {editMonths} {t('months_abbr')} · {editMonths * 4} {t('weeks_abbr')}
            </span>
          </div>

          <div className="section-title">{t('training_days_section')}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
            {editDays.map((day, i) => (
              <div key={day.id} style={{
                display:'flex', alignItems:'center', gap:10,
                background:'var(--bg-subtle)', border:'1.5px solid var(--border)',
                borderRadius:'var(--radius)', padding:'12px 14px',
              }}>
                <div style={{ width:28, height:28, background:'var(--primary-light)', borderRadius:8,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:800, color:'var(--primary)' }}>{i+1}</span>
                </div>
                <input className="form-input" style={{ flex:1, minWidth:0 }}
                  value={day.day_name}
                  onChange={e => setEditDays(ds => ds.map((d, idx) => idx === i ? { ...d, day_name: e.target.value } : d))}
                  onClick={e => e.stopPropagation()}
                />
                <button className="btn btn-outline btn-sm"
                  onClick={() => { setEditActiveDayIdx(i); setView('edit-exercises'); }}
                  style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
                  <Dumbbell size={14} />
                  {day.exercises.length > 0
                    ? `${day.exercises.length} ${day.exercises.length === 1 ? t('exercise_singular') : t('exercises_plural')}`
                    : t('add_exercises_btn')}
                </button>
              </div>
            ))}
          </div>

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
            okLabel={t('shorten_plan_confirm')} okClass="btn-danger"
            cancelLabel={t('cancel_btn')}
            onOk={() => { setConfirm(null); void saveEdit(); }}
            onCancel={() => setConfirm(null)}
          />
        )}

        {activeEditDay && activeEditDay.exercises.length > 0 && (
          <div style={{ marginTop:12, padding:'12px 16px', background:'var(--bg-subtle)', borderRadius:'var(--radius)', fontSize:13, color:'var(--text-muted)' }}>
            <strong style={{ color:'var(--text-body)' }}>{activeEditDay.day_name}</strong> · {activeEditDay.exercises.length} {t('exercises_plural')}
          </div>
        )}
      </div>
    );
  }

  /* ═══ EDIT EXERCISES ═══ */
  if (view === 'edit-exercises' && editPlan) {
    const activeEditDay = editDays[editActiveDayIdx];
    return (
      <div style={{ maxWidth: 720 }}>
        <button className="back-btn" onClick={() => setView('edit-plan')}>
          <ArrowLeft size={15} /> {t('back_to_days')}
        </button>
        <div className="page-header">
          <div>
            <h1 className="page-title">{activeEditDay?.day_name}</h1>
            <p className="page-subtitle">{t('edit_exercises_subtitle')}</p>
          </div>
        </div>

        <div className="card">
          {(!activeEditDay || activeEditDay.exercises.length === 0) && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:14 }}>
              {t('no_exercises_empty')}
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
            {activeEditDay?.exercises.map((ex, ei) => (
              <div key={ei} style={{ background:'var(--bg-subtle)', border:'1.5px solid var(--border)',
                borderRadius:'var(--radius-lg)', padding:14 }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ width:26, height:26, background:'white', border:'1.5px solid var(--border)',
                    borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:9 }}>
                    <span style={{ fontSize:11, fontWeight:800, color:'var(--text-subtle)' }}>{ei+1}</span>
                  </div>
                  <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                    <input className="form-input" placeholder={t('exercise_name_edit_placeholder')}
                      value={ex.name} onChange={e => setEditEx(ei, 'name', e.target.value)} />
                    <select className="form-select" style={{ width:'auto', minWidth:130 }}
                      value={ex.muscle_group} onChange={e => setEditEx(ei, 'muscle_group', e.target.value)}>
                      {MUSCLE_GROUPS.map(g => (
                        <option key={g} value={g}>{t(MUSCLE_GROUP_TO_KEY[g] ?? 'muscle_chest')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingLeft:36 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>{t('sets_label')}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'white',
                      border:'1.5px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                      <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)',
                        padding:'2px 4px', fontSize:18, lineHeight:1 }}
                        onClick={() => setEditEx(ei, 'sets', Math.max(1, ex.sets - 1))}>−</button>
                      <span style={{ fontWeight:800, fontSize:15, color:'var(--text-heading)', minWidth:16, textAlign:'center' }}>{ex.sets}</span>
                      <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)',
                        padding:'2px 4px', fontSize:18, lineHeight:1 }}
                        onClick={() => setEditEx(ei, 'sets', Math.min(10, ex.sets + 1))}>+</button>
                    </div>
                    <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>{t('rep_range_label')}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:4, background:'white',
                      border:'1.5px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                      <input type="number" min={1} max={100} step={1} className="rep-range-input" placeholder="min"
                        value={ex.rep_min} onChange={e => setEditEx(ei, 'rep_min', e.target.value)} />
                      <span style={{ color:'var(--text-muted)' }}>–</span>
                      <input type="number" min={1} max={100} step={1} className="rep-range-input" placeholder="max"
                        value={ex.rep_max} onChange={e => setEditEx(ei, 'rep_max', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:4 }}>
                    <button className="btn-icon" onClick={() => moveEditEx(ei, -1)} disabled={ei === 0}
                      style={{ opacity: ei === 0 ? 0.3 : 1 }}><ChevronUp size={15} /></button>
                    <button className="btn-icon" onClick={() => moveEditEx(ei, 1)}
                      disabled={ei === (activeEditDay?.exercises.length ?? 0) - 1}
                      style={{ opacity: ei === (activeEditDay?.exercises.length ?? 0) - 1 ? 0.3 : 1 }}><ChevronDown size={15} /></button>
                    <button className="btn-icon" onClick={() => removeEditEx(ei)}
                      style={{ color:'var(--danger)' }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-outline btn-full" onClick={addEditEx} style={{ marginBottom:20 }}>
            <Plus size={16} /> {t('add_exercise_btn')}
          </button>

          <button className="btn btn-primary" onClick={() => setView('edit-plan')}>
            <CheckCircle2 size={15} /> {t('done_label')}
          </button>
        </div>
      </div>
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

      <div className="tiles-grid">
        {weeks.map(w => (
          <div key={w.id} className={`tile ${w.status === 'completed' ? 'completed' : ''}`}
            onClick={() => openWeek(w)}>
            {w.status === 'completed'
              ? <CheckCircle2 size={24} color="var(--success)" />
              : <span className="tile-num">{t('week_abbr')}{w.week_number}</span>}
            <span className="tile-label">{t('week_tile_label')} {w.week_number}</span>
            {w.status === 'completed' && <span style={{ fontSize:11, color:'var(--success)', fontWeight:600 }}>{t('done_label')}</span>}
          </div>
        ))}
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

      <div className="tiles-grid">
        {weekInfo.days.map(d => {
          const done = d.status === 'completed';
          const skip = done && d.skipped;
          return (
            <div key={d.plan_day_id}
              className={`tile ${skip ? 'skipped' : done ? 'completed' : ''}`}
              onClick={() => openDay(weekInfo.week_id, d.plan_day_id, d.log_id)}>
              {skip
                ? <XCircle size={24} color="var(--danger)" />
                : done
                  ? <CheckCircle2 size={24} color="var(--success)" />
                  : <Dumbbell size={24} color="var(--text-subtle)" />}
              <span className="tile-num" style={{ fontSize:15 }}>{d.day_name}</span>
              <span className="tile-label">{skip ? t('skipped_label') : done ? t('done_label') : t('tap_to_train')}</span>
            </div>
          );
        })}
      </div>

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
    const dayName = weekInfo.days.find(d => d.plan_day_id === dayLog.plan_day_id)?.day_name ?? t('training_fallback');
    return (
      <div style={{ maxWidth: 700 }}>
        <button className="back-btn" onClick={() => setView('days')}>
          <ArrowLeft size={15} /> {t('week_tile_label')} {weekInfo.week_number}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:16 }}>
          <label className="form-label" htmlFor="workout-date">{t('workout_date_label')}</label>
          <input id="workout-date" type="date" className="form-input" style={{ width:'auto' }}
            value={workoutDate} max={todayIso()} onChange={e => setWorkoutDate(e.target.value)} />
          <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <input type="checkbox" checked={skipped} onChange={e => toggleSkipped(e.target.checked)}
              style={{ width:18, height:18, accentColor:'var(--danger)' }} />
            {t('skipped_checkbox_label')}
          </label>
        </div>
        {dateInvalid && <div className="alert alert-error" style={{ marginBottom:16 }}>{t('workout_date_future')}</div>}
        <div className="page-header">
          <div>
            <h1 className="page-title">{dayName}</h1>
            <p className="page-subtitle">
              {dayLog.plan_name} · {t('week_tile_label')} {dayLog.week_number}
              {dayLog.status === 'completed' && (
                <span style={{ marginLeft:8 }}>
                  <span className="badge badge-completed"><CheckCircle2 size={10} /> {t('badge_completed')}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {dayLog.exercise_logs.map(el => {
            const weekNum   = dayLog.week_number ?? 1;
            const prevSets  = dayLog.prev_week_data?.[el.exercise_id];
            const w1Sets    = dayLog.week1_data?.[el.exercise_id];
            const curScore  = exerciseScore(el.set_logs);
            const muscleKey = MUSCLE_GROUP_TO_KEY[el.muscle_group];
            const repRange  = formatRepRange(el.rep_min, el.rep_max);

            return (
              <div key={el.id} className={`exercise-card${el.skipped ? ' skipped' : ''}`}>
                <div className="ex-header">
                  <div>
                    <div className="ex-name">
                      {el.exercise_name}
                      {el.skipped && <span className="ex-skipped-badge">{t('exercise_skipped_label')}</span>}
                    </div>
                    <div className="ex-meta">
                      {muscleKey ? t(muscleKey) : el.muscle_group} · {el.sets} {t('sets_unit')}
                      {repRange && ` · ${t('rep_range_label')} ${repRange}`}
                    </div>
                  </div>
                  <div className="ex-actions">
                    <label className="ex-skip">
                      <input type="checkbox" checked={el.skipped} onChange={e => toggleExerciseSkipped(el.id, e.target.checked)} />
                      {t('exercise_skipped_checkbox')}
                    </label>
                    <button
                      className={`btn btn-sm ${saved[el.id] ? 'btn-success' : 'btn-outline'}`}
                      disabled={saving[el.id] || dateInvalid}
                      onClick={() => saveSets(el.id)}
                      style={{ flexShrink:0 }}
                    >
                      {saving[el.id] ? t('save_sets_saving') : saved[el.id] ? <><CheckCircle2 size={14} /> {t('save_sets_saved')}</> : t('save_sets_btn')}
                    </button>
                  </div>
                </div>

                <div className="sets-header" style={{ gridTemplateColumns:'40px minmax(0, 1fr) minmax(0, 1fr)' }}>
                  <span>{t('sets_header')}</span>
                  <span>{t('reps_header')}</span>
                  <span>{t('prev_week_abbr')}</span>
                </div>

                {el.set_logs.map(s => {
                  const prevReps = prevR(el.exercise_id, s.set_number);
                  return (
                    <div key={s.set_number} className="set-row" style={{ gridTemplateColumns:'40px minmax(0, 1fr) minmax(0, 1fr)' }}>
                      <span className="set-num">{s.set_number}</span>
                      <input type="number" className="set-input" placeholder={t('reps_placeholder')} min={0}
                        value={s.reps ?? ''}
                        onChange={e => editSet(el.id, s.set_number, e.target.value)} />
                      {prevReps !== null ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                          {prevReps}
                        </span>
                      ) : (
                        <span />
                      )}
                    </div>
                  );
                })}

                <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:'12px 24px', flexWrap:'wrap',
                  paddingTop:10, borderTop:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)' }}>{t('weight_field_label')}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <input type="number" className="set-input" placeholder="0" step={0.5} min={0}
                        style={{ width:80 }}
                        value={exerciseWeights[el.id] ?? ''}
                        onChange={e => editExerciseWeight(el.id, e.target.value)} />
                      <span style={{ fontSize:13, color:'var(--text-muted)' }}>kg</span>
                      {weekNum > 1 && !dayLog.prev_week_skipped?.includes(el.exercise_id)
                        && shouldAddWeight(prevSets, el.rep_max) && (
                        <span className="add-weight-hint">{t('add_weight_hint')}</span>
                      )}
                    </div>
                  </div>

                  {weekNum > 1 && (
                    <RefBlock title={t('prev_week_label')} weightLabel={t('weight_field_label')} progressLabel={t('progress_label')}
                      weight={firstWeight(prevSets)} pct={el.skipped ? null : progressPct(curScore, exerciseScore(prevSets))} lang={lang} />
                  )}
                  {weekNum > 2 && (
                    <RefBlock title={t('first_week_label')} weightLabel={t('weight_field_label')} progressLabel={t('progress_label')}
                      weight={firstWeight(w1Sets)} pct={el.skipped ? null : progressPct(curScore, exerciseScore(w1Sets))} lang={lang} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <button className="btn btn-success btn-full btn-lg" disabled={dateInvalid} onClick={() => setConfirm('day')}>
            <CheckCircle2 size={18} /> {t('finish_day_btn')}
          </button>
        </div>

        {confirm === 'day' && (
          <ConfirmDialog
            title={t('finish_day_title')}
            body={t('finish_day_body')}
            okLabel={t('finish_day_btn')} okClass="btn-success"
            cancelLabel={t('cancel_btn')}
            onOk={() => { finishDay(); setConfirm(null); }} onCancel={() => setConfirm(null)}
          />
        )}
      </div>
    );
  }

  return null;
}
