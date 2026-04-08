import { useEffect, useState, useCallback } from 'react';
import { weightApi } from '../services/api';
import type { WeightCycle, WeightWeek } from '../types';
import { DAY_NAMES } from '../types';
import { Scale, ArrowLeft, CheckCircle2, RotateCcw, TrendingDown, TrendingUp, Plus } from 'lucide-react';

type View = 'setup' | 'weeks' | 'week-detail';

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

function DiffBadge({ val }: { val: number | null }) {
  if (val === null) return null;
  if (val < 0) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, color:'var(--success)', fontWeight:700, fontSize:14 }}>
      <TrendingDown size={13} />{val} kg
    </span>
  );
  if (val > 0) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, color:'var(--danger)', fontWeight:700, fontSize:14 }}>
      <TrendingUp size={13} />+{val} kg
    </span>
  );
  return <span style={{ color:'var(--text-muted)', fontWeight:600, fontSize:14 }}>— bez zmian</span>;
}

export default function MyWeight() {
  const [cycle, setCycle]               = useState<WeightCycle | null>(null);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState<View>('setup');
  const [selectedWeek, setSelectedWeek] = useState<WeightWeek | null>(null);

  const [startWeight, setStartWeight]   = useState('');
  const [months, setMonths]             = useState(3);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError]     = useState('');

  const [dayInputs, setDayInputs]   = useState<Record<number, Record<number, string>>>({});
  const [daySaving, setDaySaving]   = useState<Record<number, boolean>>({});
  const [daySaved, setDaySaved]     = useState<Record<number, boolean>>({});

  const [showReset, setShowReset]       = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const loadCycle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await weightApi.getCurrentCycle();
      if (res.data) { setCycle(res.data); setView('weeks'); }
    } catch { setCycle(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCycle(); }, [loadCycle]);

  useEffect(() => {
    if (!cycle) return;
    const inputs: Record<number, Record<number, string>> = {};
    for (const week of cycle.weeks) {
      inputs[week.id] = {};
      for (const day of week.day_logs) {
        inputs[week.id][day.day_of_week] = day.weight_kg != null ? String(day.weight_kg) : '';
      }
    }
    setDayInputs(inputs);
  }, [cycle]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(startWeight);
    if (isNaN(w) || w <= 0) { setSetupError('Podaj prawidłową wagę'); return; }
    setSetupLoading(true); setSetupError('');
    try {
      const res = await weightApi.createCycle(w, months);
      setCycle(res.data); setView('weeks');
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Nie udało się utworzyć cyklu');
    } finally { setSetupLoading(false); }
  };

  const handleReset = async () => {
    if (!cycle) return;
    await weightApi.deleteCycle(cycle.id);
    setCycle(null); setView('setup'); setShowReset(false);
  };

  const handleDayInput = (weekId: number, dayOfWeek: number, value: string) => {
    setDayInputs(prev => ({ ...prev, [weekId]: { ...prev[weekId], [dayOfWeek]: value } }));
  };

  const saveDayWeight = async (dayLogId: number, weekId: number, dayOfWeek: number) => {
    const value = dayInputs[weekId]?.[dayOfWeek];
    if (!value) return;
    const w = parseFloat(value);
    if (isNaN(w) || w <= 0) return;
    setDaySaving(prev => ({ ...prev, [dayLogId]: true }));
    try {
      await weightApi.saveDayWeight(dayLogId, w);
      setDaySaved(prev => ({ ...prev, [dayLogId]: true }));
      setTimeout(() => setDaySaved(prev => ({ ...prev, [dayLogId]: false })), 2000);
      setCycle(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          weeks: prev.weeks.map(wk => wk.id !== weekId ? wk : {
            ...wk,
            day_logs: wk.day_logs.map(dl =>
              dl.day_of_week !== dayOfWeek ? dl : { ...dl, weight_kg: w, logged_at: new Date().toISOString() }
            ),
          }),
        };
      });
    } finally { setDaySaving(prev => ({ ...prev, [dayLogId]: false })); }
  };

  const completeWeek = async (weekId: number) => {
    await weightApi.completeWeek(weekId);
    setShowComplete(false);
    setView('weeks');
    await loadCycle();
  };

  const computeAverage = (week: WeightWeek): number | null => {
    const weights = week.day_logs.filter(d => d.weight_kg != null).map(d => d.weight_kg!);
    if (!weights.length) return null;
    return Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10;
  };

  const getWeek1Avg = (): number | null => {
    if (!cycle) return null;
    const w1 = cycle.weeks.find(w => w.week_number === 1);
    return w1 ? computeAverage(w1) : null;
  };

  const getPrevWeekAvg = (weekNum: number): number | null => {
    if (!cycle || weekNum <= 1) return null;
    const prev = cycle.weeks.find(w => w.week_number === weekNum - 1);
    return prev ? computeAverage(prev) : null;
  };

  if (loading) return (
    <div className="loading-screen"><div className="spinner" /><span className="loading-text">Ładowanie danych wagowych…</span></div>
  );

  /* ═══ KONFIGURACJA ═══ */
  if (view === 'setup') return (
    <div style={{ maxWidth: 520 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Moja waga</h1>
          <p className="page-subtitle">Śledź postępy wagowe w czasie</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ width:40, height:40, background:'var(--primary-light)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Scale size={20} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text-heading)' }}>Skonfiguruj śledzenie wagi</div>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>Loguj wagę codziennie, aby monitorować trendy</div>
          </div>
        </div>

        {setupError && <div className="alert alert-error" style={{ marginBottom:16 }}>{setupError}</div>}

        <form onSubmit={handleSetup} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="form-group">
            <label className="form-label">Waga startowa (kg)</label>
            <input
              type="number" className="form-input"
              placeholder="np. 75.5" step="0.1" min="1"
              value={startWeight} onChange={e => setStartWeight(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Czas trwania — <strong>{months} {months === 1 ? 'miesiąc' : 'miesięcy'}</strong>
              <span style={{ color:'var(--text-muted)', fontWeight:400 }}> · {months * 4} tygodni</span>
            </label>
            <div className="num-picker" style={{ marginTop:10 }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button key={n} type="button"
                  className={`num-pill ${months === n ? 'selected' : ''}`}
                  onClick={() => setMonths(n)}>{n}</button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={setupLoading} style={{ marginTop:4 }}>
            {setupLoading ? 'Konfigurowanie…' : <><Plus size={16} /> Rozpocznij śledzenie</>}
          </button>
        </form>
      </div>
    </div>
  );

  /* ═══ TYGODNIE ═══ */
  if (view === 'weeks' && cycle) {
    const allComplete = cycle.weeks.every(w => w.status === 'completed');
    return (
      <div style={{ maxWidth: 900 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Moja waga</h1>
            <p className="page-subtitle">
              Rozpoczęto od <strong>{cycle.start_weight} kg</strong> · {cycle.months} {cycle.months === 1 ? 'miesiąc' : 'miesięcy'}
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowReset(true)}
            style={{ color:'var(--danger)', borderColor:'var(--danger)' }}>
            <RotateCcw size={13} /> Zresetuj
          </button>
        </div>

        {allComplete && (
          <div style={{ background:'var(--success-light)', border:'1px solid var(--success-border)', borderRadius:'var(--radius-lg)', padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <CheckCircle2 size={18} color="var(--success)" />
            <span style={{ fontSize:14, fontWeight:600, color:'var(--success)' }}>Wszystkie tygodnie ukończone! Zakończyłeś cykl śledzenia wagi.</span>
          </div>
        )}

        <div className="tiles-grid">
          {cycle.weeks.map(week => {
            const avg = computeAverage(week);
            const prevAvg = getPrevWeekAvg(week.week_number);
            const diff = avg != null && prevAvg != null ? +(avg - prevAvg).toFixed(1) : null;

            return (
              <div key={week.id}
                className={`tile ${week.status === 'completed' ? 'completed' : ''}`}
                onClick={() => { setSelectedWeek(week); setView('week-detail'); }}>
                {week.status === 'completed'
                  ? <CheckCircle2 size={24} color="var(--success)" />
                  : <span className="tile-num">T{week.week_number}</span>}
                <span className="tile-label">Tydzień {week.week_number}</span>
                {avg != null && (
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text-body)' }}>{avg} kg</span>
                )}
                {diff !== null && (
                  <span style={{ fontSize:11, fontWeight:600, color: diff <= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {diff > 0 ? '+' : ''}{diff} kg
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {showReset && (
          <Confirm
            title="Zresetować śledzenie wagi?"
            body="Wszystkie dane wagowe zostaną trwale usunięte. Tej operacji nie można cofnąć."
            okLabel="Zresetuj" okClass="btn-danger"
            onOk={handleReset} onCancel={() => setShowReset(false)}
          />
        )}
      </div>
    );
  }

  /* ═══ SZCZEGÓŁY TYGODNIA ═══ */
  if (view === 'week-detail' && selectedWeek && cycle) {
    const avg      = computeAverage(selectedWeek);
    const prevAvg  = getPrevWeekAvg(selectedWeek.week_number);
    const week1Avg = getWeek1Avg();
    const diffPrev = avg != null && prevAvg != null ? +(avg - prevAvg).toFixed(1) : null;
    const diffW1   = avg != null && week1Avg != null && selectedWeek.week_number > 1 ? +(avg - week1Avg).toFixed(1) : null;
    return (
      <div style={{ maxWidth: 700 }}>
        <button className="back-btn" onClick={() => setView('weeks')}>
          <ArrowLeft size={15} /> Wszystkie tygodnie
        </button>

        <div className="page-header">
          <div>
            <h1 className="page-title">Tydzień {selectedWeek.week_number}</h1>
            <p className="page-subtitle">Wpisz dzienne odczyty wagi</p>
          </div>
        </div>

        {/* Statystyki */}
        {avg != null && (
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-subtle)', marginBottom:4 }}>
                  Średnia tygodnia
                </div>
                <div style={{ fontSize:28, fontWeight:900, color:'var(--text-heading)', letterSpacing:'-0.5px' }}>
                  {avg} <span style={{ fontSize:16, fontWeight:500, color:'var(--text-muted)' }}>kg</span>
                </div>
              </div>
              {diffPrev !== null && (
                <div>
                  <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-subtle)', marginBottom:4 }}>
                    vs poprz. tydz.
                  </div>
                  <div style={{ marginTop:4 }}><DiffBadge val={diffPrev} /></div>
                </div>
              )}
              {diffW1 !== null && (
                <div>
                  <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-subtle)', marginBottom:4 }}>
                    vs Tydzień 1
                  </div>
                  <div style={{ marginTop:4 }}><DiffBadge val={diffW1} /></div>
                </div>
          )}
            </div>
          </div>
        )}

        {/* Dzienne odczyty */}
        <div className="card">
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:14 }}>
            Dzienne odczyty
          </div>
          <div className="weight-grid">
            {selectedWeek.day_logs
              .sort((a, b) => a.day_of_week - b.day_of_week)
              .map(dayLog => {
                const isSaved = dayLog.weight_kg != null || daySaved[dayLog.id];
                return (
                  <div key={dayLog.id} className="weight-day">
                    <div className="weight-day-name">{DAY_NAMES[dayLog.day_of_week]}</div>
                    <input
                      type="number"
                      className={`weight-day-input${isSaved ? ' is-saved' : ''}`}
                      placeholder="kg"
                      step="0.1" min="1"
                      value={dayInputs[selectedWeek.id]?.[dayLog.day_of_week] ?? ''}
                      onChange={e => handleDayInput(selectedWeek.id, dayLog.day_of_week, e.target.value)}
                    />
                    <button
                      className={`weight-save-btn btn btn-sm ${daySaved[dayLog.id] ? 'btn-success' : 'btn-outline'}`}
                      disabled={daySaving[dayLog.id]}
                      onClick={() => saveDayWeight(dayLog.id, selectedWeek.id, dayLog.day_of_week)}
                    >
                      {daySaving[dayLog.id] ? '…' : daySaved[dayLog.id] ? <CheckCircle2 size={13} /> : 'Zapisz'}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        {selectedWeek.status !== 'completed' && (
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-success btn-full" onClick={() => setShowComplete(true)}>
              <CheckCircle2 size={16} /> Zakończ tydzień
            </button>
          </div>
        )}

        {showComplete && (
          <Confirm
            title={`Zakończyć tydzień ${selectedWeek.week_number}?`}
            body="Oznacz tydzień jako ukończony. Możesz edytować wpisy później."
            okLabel="Zakończ tydzień" okClass="btn-success"
            onOk={() => completeWeek(selectedWeek.id)}
            onCancel={() => setShowComplete(false)}
          />
        )}
      </div>
    );
  }

  return null;
}
