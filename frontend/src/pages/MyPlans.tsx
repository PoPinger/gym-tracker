import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { plansApi, logsApi } from '../services/api';
import { MUSCLE_GROUPS } from '../types';
import type { PlanSummary, Plan, WeekSummary, WeekInfo, DayLog } from '../types';
import {
  ChevronRight, Copy, CheckCircle2, ArrowLeft,
  Dumbbell, TrendingUp, TrendingDown, Trophy, Plus,
  Pencil, Trash2, ChevronUp, ChevronDown,
} from 'lucide-react';

type View = 'list' | 'weeks' | 'days' | 'workout' | 'edit-plan' | 'edit-exercises';

/* ── edit draft types ── */
interface EditExDraft { id?: number; name: string; muscle_group: string; sets: number; }
interface EditDayDraft { id: number; day_name: string; exercises: EditExDraft[]; }

/* ── helpers ── */
const trend = (curr: number | null, prev: number | null) => {
  if (curr == null || prev == null) return null;
  return +(curr - prev).toFixed(1);
};

function Delta({ val }: { val: number | null }) {
  if (val === null) return null;
  if (val > 0) return <span className="delta delta-pos"><TrendingUp size={10} /> +{val}</span>;
  if (val < 0) return <span className="delta delta-neg"><TrendingDown size={10} /> {val}</span>;
  return <span className="delta delta-neu">—</span>;
}

/* ── modal potwierdzenia ── */
function Confirm({ title, body, onOk, onCancel, okLabel = 'Potwierdź', okClass = 'btn-primary' }: {
  title: string; body: string; onOk: () => void; onCancel: () => void;
  okLabel?: string; okClass?: string;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">{title}</div>
        <p className="modal-body">{body}</p>
        <div className="modal-actions">
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Anuluj</button>
          <button className={`btn ${okClass} btn-sm`} onClick={onOk}>{okLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function MyPlans() {
  const navigate = useNavigate();
  const [view, setView]             = useState<View>('list');
  const [plans, setPlans]           = useState<PlanSummary[]>([]);
  const [plan, setPlan]             = useState<Plan | null>(null);
  const [weeks, setWeeks]           = useState<WeekSummary[]>([]);
  const [weekInfo, setWeekInfo]     = useState<WeekInfo | null>(null);
  const [dayLog, setDayLog]         = useState<DayLog | null>(null);
  const [loading, setLoading]       = useState(true);
  const [confirm, setConfirm]       = useState<null | 'day' | 'week' | 'plan'>(null);

  /* workout – per-exercise save state */
  const [saving,  setSaving]  = useState<Record<number, boolean>>({});
  const [saved,   setSaved]   = useState<Record<number, boolean>>({});
  /* workout – single weight per exercise */
  const [exerciseWeights, setExerciseWeights] = useState<Record<number, string>>({});

  /* edit plan state */
  const [editPlan, setEditPlan]               = useState<Plan | null>(null);
  const [editName, setEditName]               = useState('');
  const [editDays, setEditDays]               = useState<EditDayDraft[]>([]);
  const [editActiveDayIdx, setEditActiveDayIdx] = useState(0);
  const [editSaving, setEditSaving]           = useState(false);
  const [editError, setEditError]             = useState('');

  /* delete state */
  const [planToDelete, setPlanToDelete] = useState<PlanSummary | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try { const r = await plansApi.list(); setPlans(r.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  /* ── navigation ── */
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

    // initialise one weight per exercise from the first logged set
    const weights: Record<number, string> = {};
    for (const el of log.exercise_logs) {
      const w = el.set_logs.find(s => s.weight_kg != null)?.weight_kg ?? null;
      weights[el.id] = w != null ? String(w) : '';
    }
    setExerciseWeights(weights);
    setDayLog(log);
    setView('workout');
  };

  /* ── workout editing ── */
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

  const saveSets = async (exLogId: number) => {
    if (!dayLog) return;
    const el = dayLog.exercise_logs.find(e => e.id === exLogId);
    if (!el) return;
    setSaving(p => ({ ...p, [exLogId]: true }));
    try {
      await logsApi.saveSets(exLogId, el.set_logs);
      setSaved(p => ({ ...p, [exLogId]: true }));
      setTimeout(() => setSaved(p => ({ ...p, [exLogId]: false })), 2500);
    } finally { setSaving(p => ({ ...p, [exLogId]: false })); }
  };

  const finishDay = async () => {
    if (!dayLog) return;
    await logsApi.completeDay(dayLog.id);
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

  /* ── plan editing ── */
  const openEdit = async (p: PlanSummary) => {
    const r = await plansApi.get(p.id);
    const full: Plan = r.data;
    setEditPlan(full);
    setEditName(full.name);
    setEditDays(full.days.map(d => ({
      id: d.id,
      day_name: d.day_name,
      exercises: d.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        muscle_group: ex.muscle_group,
        sets: ex.sets,
      })),
    })));
    setEditActiveDayIdx(0);
    setEditError('');
    setView('edit-plan');
  };

  const saveEdit = async () => {
    if (!editPlan) return;
    setEditSaving(true); setEditError('');
    try {
      await plansApi.updateStructure(editPlan.id, {
        name: editName,
        days: editDays.map((d, _di) => ({
          id: d.id,
          day_name: d.day_name,
          exercises: d.exercises
            .filter(e => e.name.trim())
            .map((e, ei) => ({ id: e.id, name: e.name, muscle_group: e.muscle_group, sets: e.sets, exercise_order: ei })),
        })),
      });
      await loadPlans();
      setView('list');
    } catch (e: any) {
      setEditError(e.response?.data?.detail || 'Nie udało się zapisać zmian');
    } finally { setEditSaving(false); }
  };

  /* edit exercise helpers */
  const addEditEx = () => {
    setEditDays(d => d.map((day, i) => i !== editActiveDayIdx ? day : {
      ...day, exercises: [...day.exercises, { name: '', muscle_group: MUSCLE_GROUPS[0], sets: 3 }]
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
    const t = ei + dir;
    setEditDays(d => d.map((day, i) => {
      if (i !== editActiveDayIdx) return day;
      const exs = [...day.exercises];
      if (t < 0 || t >= exs.length) return day;
      [exs[ei], exs[t]] = [exs[t], exs[ei]];
      return { ...day, exercises: exs };
    }));
  };

  /* ── plan deletion ── */
  const deletePlan = async () => {
    if (!planToDelete) return;
    await plansApi.delete(planToDelete.id);
    setPlanToDelete(null);
    await loadPlans();
  };

  /* comparison helpers */
  const prevW = (exId: number, setNum: number) =>
    dayLog?.prev_week_data?.[exId]?.find(s => s.set_number === setNum)?.weight_kg ?? null;
  const w1W = (exId: number, setNum: number) =>
    dayLog?.week1_data?.[exId]?.find(s => s.set_number === setNum)?.weight_kg ?? null;

  const allDaysComplete  = weekInfo?.days.every(d => d.status === 'completed') ?? false;
  const allWeeksComplete = weeks.length > 0 && weeks.every(w => w.status === 'completed');

  if (loading) return <div className="loading-screen"><div className="spinner" /><span className="loading-text">Ładowanie planów…</span></div>;

  /* ═══════════════════════════════════════════
     LISTA PLANÓW
  ═══════════════════════════════════════════ */
  if (view === 'list') return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Moje plany</h1>
          <p className="page-subtitle">{plans.length} {plans.length === 1 ? 'plan' : 'planów'} łącznie</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/create-plan')}>
          <Plus size={16} /> Nowy plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-emoji">📋</div>
          <h3>Brak planów</h3>
          <p>Utwórz pierwszy plan treningowy i zacznij śledzić treningi</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-plan')}>Utwórz plan</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {plans.map(p => (
            <div key={p.id} className={`plan-card ${p.status === 'completed' ? 'completed-plan' : ''}`}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                  <span className="plan-card-name">{p.name}</span>
                  <span className={`badge ${p.status === 'completed' ? 'badge-completed' : 'badge-active'}`}>
                    {p.status === 'completed' ? <><CheckCircle2 size={10} /> Ukończony</> : 'Aktywny'}
                  </span>
                </div>
                <div className="plan-card-meta">
                  {p.days_per_week} dni/tydz. · {p.months} mies. · {p.months * 4} tyg.
                </div>
              </div>
              <div className="plan-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => copyPlan(p.id)}>
                  <Copy size={13} /> Kopiuj
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>
                  <Pencil size={13} /> Edytuj
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setPlanToDelete(p)}
                  style={{ color:'var(--danger)', borderColor:'var(--danger)' }}>
                  <Trash2 size={13} /> Usuń
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => openPlan(p)}>
                  Otwórz <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {planToDelete && (
        <Confirm
          title="Usunąć plan?"
          body="Czy na pewno chcesz usunąć ten plan? Tej operacji nie można cofnąć."
          okLabel="Usuń plan" okClass="btn-danger"
          onOk={deletePlan} onCancel={() => setPlanToDelete(null)}
        />
      )}
    </div>
  );

  /* ═══════════════════════════════════════════
     EDYCJA PLANU – LISTA DNI
  ═══════════════════════════════════════════ */
  if (view === 'edit-plan' && editPlan) {
    const activeEditDay = editDays[editActiveDayIdx];
    return (
      <div style={{ maxWidth: 720 }}>
        <button className="back-btn" onClick={() => setView('list')}>
          <ArrowLeft size={15} /> Moje plany
        </button>
        <div className="page-header">
          <div>
            <h1 className="page-title">Edytuj plan</h1>
            <p className="page-subtitle">
              {editPlan.days_per_week} dni/tydz. · {editPlan.months} mies. · {editPlan.months * 4} tyg.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="form-group" style={{ marginBottom:24 }}>
            <label className="form-label">Nazwa planu</label>
            <input className="form-input" value={editName}
              onChange={e => setEditName(e.target.value)} />
          </div>

          <div className="section-title">Dni treningowe</div>
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
                    ? `${day.exercises.length} ${day.exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}`
                    : 'Dodaj ćwiczenia'}
                </button>
              </div>
            ))}
          </div>

          {editError && <div className="alert alert-error" style={{ marginBottom:16 }}>{editError}</div>}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="btn btn-outline" onClick={() => setView('list')}>Anuluj</button>
            <button className="btn btn-primary" disabled={editSaving} onClick={saveEdit}>
              {editSaving ? 'Zapisywanie…' : 'Zapisz zmiany'}
            </button>
          </div>
        </div>

        {/* preview of active day's exercises (if any selected) */}
        {activeEditDay && activeEditDay.exercises.length > 0 && (
          <div style={{ marginTop:12, padding:'12px 16px', background:'var(--bg-subtle)', borderRadius:'var(--radius)', fontSize:13, color:'var(--text-muted)' }}>
            <strong style={{ color:'var(--text-body)' }}>{activeEditDay.day_name}</strong> · {activeEditDay.exercises.length} ćwiczeń
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     EDYCJA ĆWICZEŃ DNIA
  ═══════════════════════════════════════════ */
  if (view === 'edit-exercises' && editPlan) {
    const activeEditDay = editDays[editActiveDayIdx];
    return (
      <div style={{ maxWidth: 720 }}>
        <button className="back-btn" onClick={() => setView('edit-plan')}>
          <ArrowLeft size={15} /> Wróć do dni
        </button>
        <div className="page-header">
          <div>
            <h1 className="page-title">{activeEditDay?.day_name}</h1>
            <p className="page-subtitle">Edytuj ćwiczenia dnia treningowego</p>
          </div>
        </div>

        <div className="card">
          {(!activeEditDay || activeEditDay.exercises.length === 0) && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:14 }}>
              Brak ćwiczeń — dodaj pierwsze poniżej
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
                    <input className="form-input" placeholder="Nazwa ćwiczenia"
                      value={ex.name} onChange={e => setEditEx(ei, 'name', e.target.value)} />
                    <select className="form-select" style={{ width:'auto', minWidth:130 }}
                      value={ex.muscle_group} onChange={e => setEditEx(ei, 'muscle_group', e.target.value)}>
                      {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingLeft:36 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>Serie:</span>
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
            <Plus size={16} /> Dodaj ćwiczenie
          </button>

          <button className="btn btn-primary" onClick={() => setView('edit-plan')}>
            <CheckCircle2 size={15} /> Gotowe
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     TYGODNIE
  ═══════════════════════════════════════════ */
  if (view === 'weeks' && plan) return (
    <div style={{ maxWidth: 900 }}>
      <button className="back-btn" onClick={() => setView('list')}>
        <ArrowLeft size={15} /> Moje plany
      </button>
      <div className="page-header">
        <div>
          <h1 className="page-title">{plan.name}</h1>
          <p className="page-subtitle">{plan.months * 4} tyg. · {plan.days_per_week} dni/tydz.</p>
        </div>
        {allWeeksComplete && plan.status !== 'completed' && (
          <button className="btn btn-success" onClick={() => setConfirm('plan')}>
            <Trophy size={16} /> Zakończ plan
          </button>
        )}
      </div>

      <div className="tiles-grid">
        {weeks.map(w => (
          <div key={w.id} className={`tile ${w.status === 'completed' ? 'completed' : ''}`}
            onClick={() => openWeek(w)}>
            {w.status === 'completed'
              ? <CheckCircle2 size={24} color="var(--success)" />
              : <span className="tile-num">T{w.week_number}</span>}
            <span className="tile-label">Tydzień {w.week_number}</span>
            {w.status === 'completed' && <span style={{ fontSize:11, color:'var(--success)', fontWeight:600 }}>Gotowe</span>}
          </div>
        ))}
      </div>

      {confirm === 'plan' && (
        <Confirm title="Zakończyć plan?" body="Oznacz plan jako ukończony. Wszystkie dane pozostają zapisane i można je edytować."
          okLabel="Zakończ plan" okClass="btn-success"
          onOk={() => { finishPlan(); setConfirm(null); }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );

  /* ═══════════════════════════════════════════
     DNI
  ═══════════════════════════════════════════ */
  if (view === 'days' && weekInfo && plan) return (
    <div style={{ maxWidth: 700 }}>
      <button className="back-btn" onClick={() => setView('weeks')}>
        <ArrowLeft size={15} /> Wszystkie tygodnie
      </button>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tydzień {weekInfo.week_number}</h1>
          <p className="page-subtitle">{weekInfo.plan_name}</p>
        </div>
        {allDaysComplete && weekInfo.status !== 'completed' && (
          <button className="btn btn-success" onClick={() => setConfirm('week')}>
            <CheckCircle2 size={16} /> Zakończ tydzień
          </button>
        )}
      </div>

      <div className="tiles-grid">
        {weekInfo.days.map(d => (
          <div key={d.plan_day_id}
            className={`tile ${d.status === 'completed' ? 'completed' : ''}`}
            onClick={() => openDay(weekInfo.week_id, d.plan_day_id, d.log_id)}>
            {d.status === 'completed'
              ? <CheckCircle2 size={24} color="var(--success)" />
              : <Dumbbell size={24} color="var(--text-subtle)" />}
            <span className="tile-num" style={{ fontSize:15 }}>{d.day_name}</span>
            <span className="tile-label">{d.status === 'completed' ? 'Gotowe' : 'Dotknij, aby trenować'}</span>
          </div>
        ))}
      </div>

      {confirm === 'week' && (
        <Confirm title={`Zakończyć tydzień ${weekInfo.week_number}?`}
          body="Oznacz tydzień jako ukończony. Możesz edytować dane później."
          okLabel="Zakończ tydzień" okClass="btn-success"
          onOk={() => { finishWeek(); setConfirm(null); }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );

  /* ═══════════════════════════════════════════
     TRENING (logger)
  ═══════════════════════════════════════════ */
  if (view === 'workout' && dayLog && weekInfo) {
    const dayName = weekInfo.days.find(d => d.plan_day_id === dayLog.plan_day_id)?.day_name ?? 'Trening';
    return (
      <div style={{ maxWidth: 700 }}>
        <button className="back-btn" onClick={() => setView('days')}>
          <ArrowLeft size={15} /> Tydzień {weekInfo.week_number}
        </button>
        <div className="page-header">
          <div>
            <h1 className="page-title">{dayName}</h1>
            <p className="page-subtitle">
              {dayLog.plan_name} · Tydzień {dayLog.week_number}
              {dayLog.status === 'completed' && (
                <span style={{ marginLeft:8 }}>
                  <span className="badge badge-completed"><CheckCircle2 size={10} /> Ukończony</span>
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {dayLog.exercise_logs.map(el => {
            const hasPrev = !!dayLog.prev_week_data?.[el.exercise_id];
            const showW1  = !!dayLog.week1_data?.[el.exercise_id] && (dayLog.week_number ?? 1) > 1;
            const pw      = prevW(el.exercise_id, 1);
            const w1      = w1W(el.exercise_id, 1);
            const curW    = exerciseWeights[el.id] !== '' ? Number(exerciseWeights[el.id]) : null;
            const dPrev   = trend(curW, pw);
            const dW1     = trend(curW, w1);

            return (
              <div key={el.id} className="exercise-card">
                <div className="ex-header">
                  <div>
                    <div className="ex-name">{el.exercise_name}</div>
                    <div className="ex-meta">{el.muscle_group} · {el.sets} serii</div>
                  </div>
                  <button
                    className={`btn btn-sm ${saved[el.id] ? 'btn-success' : 'btn-outline'}`}
                    disabled={saving[el.id]}
                    onClick={() => saveSets(el.id)}
                    style={{ flexShrink:0 }}
                  >
                    {saving[el.id] ? 'Zapisywanie…' : saved[el.id] ? <><CheckCircle2 size={14} /> Zapisano</> : 'Zapisz'}
                  </button>
                </div>

                {/* Sets – reps only */}
                <div className="sets-header" style={{ gridTemplateColumns:'40px 1fr' }}>
                  <span>Seria</span>
                  <span>Powt.</span>
                </div>

                {el.set_logs.map(s => (
                  <div key={s.set_number} className="set-row" style={{ gridTemplateColumns:'40px 1fr' }}>
                    <span className="set-num">{s.set_number}</span>
                    <input type="number" className="set-input" placeholder="powt." min={0}
                      value={s.reps ?? ''}
                      onChange={e => editSet(el.id, s.set_number, e.target.value)} />
                  </div>
                ))}

                {/* Single weight field for entire exercise */}
                <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
                  paddingTop:10, borderTop:'1px solid var(--border)' }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)' }}>Ciężar:</span>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <input type="number" className="set-input" placeholder="0" step={0.5} min={0}
                      style={{ width:80 }}
                      value={exerciseWeights[el.id] ?? ''}
                      onChange={e => editExerciseWeight(el.id, e.target.value)} />
                    <span style={{ fontSize:13, color:'var(--text-muted)' }}>kg</span>
                  </div>

                  {(hasPrev || showW1) && (
                    <div className="prev-data" style={{ marginTop:0 }}>
                      {hasPrev && pw != null && (
                        <span className="prev-item">
                          poprz.: {pw}kg <Delta val={dPrev} />
                        </span>
                      )}
                      {showW1 && w1 != null && (
                        <span className="prev-item">
                          tydz.1: {w1}kg <Delta val={dW1} />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <button className="btn btn-success btn-full btn-lg" onClick={() => setConfirm('day')}>
            <CheckCircle2 size={18} /> Zakończ dzień
          </button>
        </div>

        {confirm === 'day' && (
          <Confirm title="Zakończyć trening?" body="Oznacz dzień jako ukończony. Możesz edytować wpisy później."
            okLabel="Zakończ dzień" okClass="btn-success"
            onOk={() => { finishDay(); setConfirm(null); }} onCancel={() => setConfirm(null)} />
        )}
      </div>
    );
  }

  return null;
}
