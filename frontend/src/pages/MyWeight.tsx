import { useEffect, useState, useCallback } from 'react';
import { useRefresh } from '../hooks/useRefresh';
import { useCelebration, WEEK_CELEBRATION_MS } from '../hooks/useCelebration';
import { navTransition } from '../utils/motion';
import CelebrationLayer from '../components/CelebrationLayer';
import { weightApi, apiErrorDetail } from '../services/api';
import PageLoader from '../components/PageLoader';
import ConfirmDialog from '../components/ConfirmDialog';
import { kulkaDelay, trashDelay, SHRUG_MS, STAMP_MS } from '../components/mascot/trash';
import BuilderKulka, { type BuilderOutcome } from '../components/mascot/BuilderKulka';
import { useLanguage } from '../i18n/LanguageContext';
import type { WeightCycle, WeightWeek } from '../types';
import GoalSwitch from '../components/GoalSwitch';
import type { GoalPick } from '../components/mascot/GoalKulka';
import { SetupView, PanelView, WeekView } from '../components/WeightViews';
import { lastLoggedWeight, type WeightGoal } from '../utils/weightTrend';
import { plural } from '../utils/plural';
import { formatKg } from '../utils/progress';

type View = 'setup' | 'weeks' | 'week-detail';

export default function MyWeight() {
  const { t, lang } = useLanguage();

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
  // Week just finished on its detail view: Kulka celebrates there before the weeks panel opens
  const [doneWeekId, setDoneWeekId]     = useState<number | null>(null);
  // Finishing the week failed to save: shown on the week, which stays open
  const [finishError, setFinishError]   = useState(false);
  const celebration = useCelebration();

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

  // A weight typed but not saved yet (the inputs are rebuilt from the cycle when it is re-fetched)
  const weightsDirty = () => !!cycle && cycle.weeks.some(w => w.day_logs.some(d =>
    (dayInputs[w.id]?.[d.day_of_week] ?? '') !== (d.weight_kg != null ? String(d.weight_kg) : '')));
  useRefresh({
    reload: async () => {
      if (!cycle || weightsDirty()) return;
      const res = await weightApi.getCurrentCycle();
      if (res.data) setCycle(res.data);
    },
    dirty: () => weightsDirty() || editMonths != null,
  });

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupGoal) { setSetupError(t('goal_required')); return; }
    setSetupLoading(true); setSetupError('');
    try {
      const res = await weightApi.createCycle(months, setupGoal);
      navTransition('forward', () => { setCycle(res.data); setView('weeks'); });
    } catch (err) {
      setSetupError(apiErrorDetail(err) || t('setup_error_default'));
    } finally { setSetupLoading(false); }
  };

  const [goalSaving, setGoalSaving] = useState(false);
  // Every click on Masa / Redukcja (also the selected one): Kulka on the toggle grows / shrinks
  const [goalPick, setGoalPick]     = useState<GoalPick | null>(null);
  const changeGoal = async (goal: WeightGoal) => {
    if (!cycle) return;
    setGoalSaving(true);
    try {
      const res = await weightApi.updateGoal(cycle.id, goal);
      setCycle(prev => prev ? { ...prev, goal: res.data.goal } : prev);
    } finally { setGoalSaving(false); }
  };

  // Cycle duration: null = dialog closed
  const [editMonths, setEditMonths]         = useState<number | null>(null);
  const [durationSaving, setDurationSaving] = useState(false);
  const [durationError, setDurationError]   = useState('');
  const [showShorten, setShowShorten]       = useState(false);
  // Kulka the builder on the dialog: excavator entrance once per opening, stamp on save, shrug on cancel
  const [durationIntro, setDurationIntro]     = useState(true);
  const [durationOutcome, setDurationOutcome] = useState<BuilderOutcome>(null);

  // closing: the shorten dialog's trash animation or Kulka's stamp, awaited with the request before the dialog closes
  const saveDuration = async (closing: Promise<void> = Promise.resolve()) => {
    if (!cycle || editMonths == null) return;
    if (editMonths === cycle.months) { await closing; setShowShorten(false); setEditMonths(null); setDurationOutcome(null); return; }
    setDurationSaving(true); setDurationError('');
    try {
      const [res] = await Promise.all([weightApi.updateMonths(cycle.id, editMonths), closing]);
      setCycle(res.data); setEditMonths(null);
    } catch (err) {
      setDurationError(apiErrorDetail(err) || t('save_changes_error'));
    } finally { setDurationSaving(false); setShowShorten(false); setDurationOutcome(null); }
  };

  const handleSaveDuration = () => {
    if (durationOutcome) return;
    if (cycle && editMonths != null && editMonths < cycle.months) setShowShorten(true);
    else { setDurationOutcome('save'); void saveDuration(kulkaDelay(STAMP_MS)); }
  };

  const cancelDuration = () => {
    if (durationOutcome) return;
    setDurationOutcome('cancel');
    void kulkaDelay(SHRUG_MS).then(() => { setEditMonths(null); setDurationOutcome(null); });
  };

  const handleReset = async () => {
    if (!cycle) return;
    await Promise.all([weightApi.deleteCycle(cycle.id), trashDelay()]);
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
      // Queued on the phone (sent when online); the label names the entry if the server rejects it
      const weekNum = cycle?.weeks.find(wk => wk.id === weekId)?.week_number;
      await weightApi.saveDayWeight(dayLogId, w, `${dayNames[dayOfWeek]} · ${t('week_tile_label')} ${weekNum ?? ''} · ${formatKg(w, lang)}`);
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

  // Saved right away; once saved Kulka celebrates with big confetti over the readings, then the weeks
  // panel opens. A failed save keeps the week open with an error.
  const completeWeek = async (weekId: number) => {
    setFinishError(false);
    try { await weightApi.completeWeek(weekId); }
    catch { setShowComplete(false); setFinishError(true); return; }
    setShowComplete(false);
    setDoneWeekId(weekId);
    // Marked done at once, then refreshed in place (no loader); kept done even if the refresh comes back empty
    setCycle(prev => prev && { ...prev, weeks: prev.weeks.map(wk => wk.id === weekId ? { ...wk, status: 'completed' } : wk) });
    void weightApi.getCurrentCycle().then(res => { if (res.data) setCycle(res.data); }, () => {});
    celebration.run(WEEK_CELEBRATION_MS, () => navTransition('back', () => setView('weeks')));
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

  if (loading) return <PageLoader cards={2} />;

  /* ═══ SETUP ═══ */
  if (view === 'setup') return (
    <SetupView months={months} setMonths={setMonths} goal={setupGoal} setGoal={g => { setSetupGoal(g); setSetupError(''); }}
      error={setupError} loading={setupLoading} onSubmit={handleSetup} />
  );

  /* ═══ WEEKS VIEW ═══ */
  if (view === 'weeks' && cycle) return (
    <>
      <PanelView cycle={cycle} first={getWeek1Avg()} last={lastLoggedWeight(cycle)}
        avg={computeAverage} prevAvg={getPrevWeekAvg}
        onOpenWeek={week => navTransition('forward', () => { setSelectedWeek(week); setDoneWeekId(null); setFinishError(false); setView('week-detail'); })} onReset={() => setShowReset(true)}
        onEditDuration={() => { setEditMonths(cycle.months); setDurationError(''); setDurationIntro(true); }}
        goalSwitch={<GoalSwitch goal={cycle.goal} onChange={changeGoal} disabled={goalSaving}
          onPick={g => setGoalPick(p => ({ goal: g, seq: (p?.seq ?? 0) + 1 }))} />} goalPick={goalPick} />
      {showReset && (
        <ConfirmDialog
          title={t('reset_weight_title')}
          body={t('reset_weight_body')}
          okLabel={t('reset_btn')} okClass="btn-danger" trash
          cancelLabel={t('cancel_btn')}
          onOk={handleReset} onCancel={() => setShowReset(false)}
        />
      )}
      {editMonths != null && !showShorten && (
        <div className="modal-overlay">
          <div className="modal w-duration-modal has-builder" role="dialog" aria-modal="true" aria-label={t('weight_edit_duration_title')}>
            <BuilderKulka activity={editMonths} outcome={durationOutcome} intro={durationIntro} onIntroDone={() => setDurationIntro(false)} />
            <div className="modal-title">{t('weight_edit_duration_title')}</div>
            <label className="form-label">{t('edit_duration_label')}</label>
            <div className="seg-control seg-control-12" role="radiogroup" aria-label={t('edit_duration_label')}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button key={n} type="button" role="radio" aria-checked={editMonths === n}
                  className={editMonths === n ? 'selected' : ''} onClick={() => setEditMonths(n)}>{n}</button>
              ))}
            </div>
            <div className="plan-stats one">
              <div>
                <span className="plan-stat">{editMonths * 4}</span>
                <span className="day-list-label">{plural(editMonths * 4, t('weeks_1'), t('weeks_2_4'), t('weeks_5plus'))}</span>
              </div>
            </div>
            {durationError && <div className="alert alert-error">{durationError}</div>}
            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={cancelDuration}>{t('cancel_btn')}</button>
              <button className="btn btn-primary btn-sm" disabled={durationSaving} onClick={handleSaveDuration}>
                {durationSaving ? t('saving') : t('save_changes_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showShorten && editMonths != null && (
        <ConfirmDialog
          title={t('shorten_cycle_title')}
          body={t('shorten_cycle_body').replace('{from}', String(editMonths * 4 + 1)).replace('{to}', String(cycle.months * 4))}
          okLabel={t('shorten_cycle_confirm')} okClass="btn-danger" trash
          cancelLabel={t('cancel_btn')}
          onOk={() => void saveDuration(trashDelay())} onCancel={() => setShowShorten(false)}
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
          onBack={() => navTransition('back', () => setView('weeks'))} onFinish={() => setShowComplete(true)} celebrate={doneWeekId === week.id}
          finishError={finishError} />
        {celebration.active && <CelebrationLayer onSkip={celebration.skip} />}
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
