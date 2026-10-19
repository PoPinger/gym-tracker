import { useEffect, useState, useCallback } from 'react';
import { weightApi, apiErrorDetail } from '../services/api';
import AppLoader from '../components/AppLoader';
import { useLanguage } from '../i18n/LanguageContext';
import type { WeightCycle, WeightWeek } from '../types';
import GoalSwitch from '../components/GoalSwitch';
import { SetupView, PanelView, WeekView } from '../components/WeightViews';
import { firstLoggedWeight, lastLoggedWeight, type WeightGoal } from '../utils/weightTrend';

type View = 'setup' | 'weeks' | 'week-detail';

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

export default function MyWeight() {
  const { t } = useLanguage();

  const [cycle, setCycle]               = useState<WeightCycle | null>(null);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState<View>('setup');
  const [selectedWeek, setSelectedWeek] = useState<WeightWeek | null>(null);

  const [setupGoal, setSetupGoal]       = useState<WeightGoal | null>(null);
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
    if (!setupGoal) { setSetupError(t('goal_required')); return; }
    setSetupLoading(true); setSetupError('');
    try {
      const res = await weightApi.createCycle(months, setupGoal);
      setCycle(res.data); setView('weeks');
    } catch (err) {
      setSetupError(apiErrorDetail(err) || t('setup_error_default'));
    } finally { setSetupLoading(false); }
  };

  const [goalSaving, setGoalSaving] = useState(false);
  const changeGoal = async (goal: WeightGoal) => {
    if (!cycle) return;
    setGoalSaving(true);
    try {
      const res = await weightApi.updateGoal(cycle.id, goal);
      setCycle(prev => prev ? { ...prev, goal: res.data.goal } : prev);
    } finally { setGoalSaving(false); }
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

  // Translated day names by index (0=Mon … 6=Sun)
  const dayNames = [
    t('day_mon'), t('day_tue'), t('day_wed'),
    t('day_thu'), t('day_fri'), t('day_sat'), t('day_sun'),
  ];

  if (loading) return <AppLoader />;

  /* ═══ SETUP ═══ */
  if (view === 'setup') return (
    <SetupView months={months} setMonths={setMonths} goal={setupGoal} setGoal={g => { setSetupGoal(g); setSetupError(''); }}
      error={setupError} loading={setupLoading} onSubmit={handleSetup} />
  );

  /* ═══ WEEKS VIEW ═══ */
  if (view === 'weeks' && cycle) return (
    <>
      <PanelView cycle={cycle} first={firstLoggedWeight(cycle)} last={lastLoggedWeight(cycle)}
        avg={computeAverage} prevAvg={getPrevWeekAvg}
        onOpenWeek={week => { setSelectedWeek(week); setView('week-detail'); }} onReset={() => setShowReset(true)}
        goalSwitch={<GoalSwitch goal={cycle.goal} onChange={changeGoal} disabled={goalSaving} />} />
      {showReset && (
        <ConfirmDialog
          title={t('reset_weight_title')}
          body={t('reset_weight_body')}
          okLabel={t('reset_btn')} okClass="btn-danger"
          cancelLabel={t('cancel_btn')}
          onOk={handleReset} onCancel={() => setShowReset(false)}
        />
      )}
    </>
  );

  /* ═══ WEEK DETAIL ═══ */
  if (view === 'week-detail' && selectedWeek && cycle) {
    // Read the week from the cycle so saved days update the averages right away
    const week     = cycle.weeks.find(w => w.id === selectedWeek.id) ?? selectedWeek;
    const avg      = computeAverage(week);
    const prevAvg  = getPrevWeekAvg(week.week_number);
    const week1Avg = getWeek1Avg();
    const diffPrev = avg != null && prevAvg != null ? +(avg - prevAvg).toFixed(1) : null;
    const diffW1   = avg != null && week1Avg != null && week.week_number > 1 ? +(avg - week1Avg).toFixed(1) : null;
    return (
      <>
        <WeekView week={week} goal={cycle.goal} avgVal={avg} diffPrev={diffPrev} diffW1={diffW1} dayNames={dayNames}
          inputs={dayInputs[week.id] ?? {}} onInput={(day, v) => handleDayInput(week.id, day, v)}
          onSave={(logId, day) => saveDayWeight(logId, week.id, day)} saving={daySaving} saved={daySaved}
          onBack={() => setView('weeks')} onFinish={() => setShowComplete(true)} />
        {showComplete && (
          <ConfirmDialog
            title={`${t('finish_week_question')} ${week.week_number}?`}
            body={t('finish_week_body')}
            okLabel={t('finish_week_btn')} okClass="btn-success"
            cancelLabel={t('cancel_btn')}
            onOk={() => completeWeek(week.id)}
            onCancel={() => setShowComplete(false)}
          />
        )}
      </>
    );
  }

  return null;
}
