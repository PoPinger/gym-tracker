import { useRef, useState } from 'react';
import { useRefresh } from '../hooks/useRefresh';
import { useNavigate } from 'react-router-dom';
import { plansApi, apiErrorDetail } from '../services/api';
import { MUSCLE_GROUPS } from '../types';
import { MUSCLE_GROUP_TO_KEY } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';
import { isValidRepRange, repRangePayload } from '../utils/repRange';
import { Plus, Trash2, ChevronUp, ChevronDown, ArrowRight, ArrowLeft, Dumbbell, Moon } from 'lucide-react';
import { plural } from '../utils/plural';
import { clampRest, DEFAULT_REST, formatRest, REST_MAX, REST_MIN, REST_STEP } from '../utils/rest';
import DayList from '../components/DayList';
import StepperMascot from '../components/mascot/StepperMascot';
import { defaultDayColor, type DayColor } from '../utils/dayColors';
import { flipSwap, navTransition } from '../utils/motion';

type Step = 1 | 2 | 3 | 4;

interface ExDraft { name: string; muscle_group: string; sets: number; rep_min: string; rep_max: string; rest_seconds: number; }
interface DayDraft { day_name: string; color: DayColor; exercises: ExDraft[]; }

function StepIndicator({ step, labels, current }: { step: Step; labels: string[]; current: string }) {
  return (
    <>
      <div className="steps has-mascot">
        <StepperMascot step={step} />
        {labels.map((label, i) => {
          const n = (i + 1) as Step;
          const state = step > n ? 'done' : step === n ? 'active' : 'todo';
          return (
            <div key={n} className={`step-item ${state}`} style={{ flex: i < labels.length - 1 ? 1 : 'none', display:'flex', alignItems:'center', minWidth: 0 }}>
              <div className={`step-bubble ${state}`}>
                {state === 'done' ? '✓' : n}
              </div>
              <span className="step-name" style={{ whiteSpace:'nowrap', marginRight:6 }}>{label}</span>
              {i < labels.length - 1 && <div className={`step-connector ${state === 'done' ? 'done' : ''}`} />}
            </div>
          );
        })}
      </div>
      {/* Narrow screens show only the circles plus this full label of the current step */}
      <div className="step-current">{current}</div>
    </>
  );
}

export default function CreatePlan() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep]               = useState<Step>(1);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [months, setMonths]           = useState(3);
  const [planName, setPlanName]       = useState('');
  const [days, setDays]               = useState<DayDraft[]>([]);
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  // Nothing to re-fetch here; a started plan keeps the app from reloading for a new version
  useRefresh({ dirty: () => step > 1 || planName.trim() !== '' });

  const defaultDayNames = [
    t('default_day_push'), t('default_day_pull'), t('default_day_legs'),
    t('default_day_upper'), t('default_day_lower'), t('default_day_full'), t('default_day_cardio'),
  ];

  // 3 visible steps; the exercise editor (internal step 4) belongs to "Układanie planu"
  const stepLabels = [
    t('step_days_per_week'),
    t('step_duration'),
    t('step_day_names'),
  ];
  const shownStep = Math.min(step, 3) as Step;
  const stepCurrent = `${t('step_counter').replace('{n}', String(shownStep)).replace('{total}', String(stepLabels.length))}: ${stepLabels[shownStep - 1]}`;

  const goToStep3 = () => {
    const next: DayDraft[] = Array.from({ length: daysPerWeek }, (_, i) =>
      days[i] ?? { day_name: defaultDayNames[i] ?? `${t('day_number_fallback')} ${i + 1}`, color: defaultDayColor(i), exercises: [] }
    );
    navTransition('forward', () => {
      setDays(next);
      setActiveDayIdx(0);
      setStep(3);
    });
  };

  // Steps slide like pages: forward from the right, back from the left
  const goStep = (n: Step) => navTransition(n > step ? 'forward' : 'back', () => setStep(n));
  const goToExercises = (idx: number) => navTransition('forward', () => { setActiveDayIdx(idx); setStep(4); });

  const setDayName = (i: number, name: string) => {
    setDays(d => d.map((day, idx) => idx === i ? { ...day, day_name: name } : day));
  };

  const setDayColor = (i: number, color: DayColor) => {
    setDays(d => d.map((day, idx) => idx === i ? { ...day, color } : day));
  };

  const addEx = () => {
    setDays(d => d.map((day, i) => i !== activeDayIdx ? day : {
      ...day, exercises: [...day.exercises, { name: '', muscle_group: MUSCLE_GROUPS[0], sets: 3, rep_min: '', rep_max: '', rest_seconds: DEFAULT_REST }]
    }));
  };

  const setEx = (ei: number, field: keyof ExDraft, val: string | number) => {
    setDays(d => d.map((day, i) => i !== activeDayIdx ? day : {
      ...day, exercises: day.exercises.map((ex, j) => j !== ei ? ex : { ...ex, [field]: val })
    }));
  };

  const removeEx = (ei: number) => {
    setDays(d => d.map((day, i) => i !== activeDayIdx ? day : {
      ...day, exercises: day.exercises.filter((_, j) => j !== ei)
    }));
  };

  // The two rows glide into each other's place
  const exListRef = useRef<HTMLDivElement>(null);
  const moveEx = (ei: number, dir: -1 | 1) => {
    const target = ei + dir;
    flipSwap(exListRef.current, ei, target, () => setDays(d => d.map((day, i) => {
      if (i !== activeDayIdx) return day;
      const exs = [...day.exercises];
      if (target < 0 || target >= exs.length) return day;
      [exs[ei], exs[target]] = [exs[target], exs[ei]];
      return { ...day, exercises: exs };
    })));
  };

  const savePlan = async () => {
    const named = days.flatMap(d => d.exercises.filter(e => e.name.trim()));
    if (named.some(e => !isValidRepRange(e.rep_min, e.rep_max))) { setError(t('rep_range_error')); return; }
    setSaving(true); setError('');
    try {
      await plansApi.create({
        name: planName, days_per_week: daysPerWeek, months,
        days: days.map((d, di) => ({
          day_name: d.day_name, day_order: di, color: d.color,
          exercises: d.exercises.filter(e => e.name.trim()).map((e, ei) => ({
            name: e.name, muscle_group: e.muscle_group, sets: e.sets, exercise_order: ei, rest_seconds: e.rest_seconds,
            ...repRangePayload(e.rep_min, e.rep_max),
          })),
        })),
      });
      navTransition('forward', () => navigate('/plans'));
    } catch (e) {
      setError(apiErrorDetail(e) || t('save_plan_error'));
    } finally {
      setSaving(false);
    }
  };

  const activeDay = days[activeDayIdx];

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('create_plan_title')}</h1>
          <p className="page-subtitle">{t('create_plan_subtitle')}</p>
        </div>
      </div>

      <StepIndicator step={shownStep} labels={stepLabels} current={stepCurrent} />

      <div className="card">

        {/* Step 1: days/week */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:6 }}>
              {t('step1_heading')}
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24 }}>
              {t('step1_body')}
            </p>
            <div className="seg-control" role="radiogroup" aria-label={t('step1_heading')}>
              {[1,2,3,4,5,6,7].map(n => (
                <button key={n} role="radio" aria-checked={daysPerWeek === n}
                  className={daysPerWeek === n ? 'selected' : ''} onClick={() => setDaysPerWeek(n)}>{n}</button>
              ))}
            </div>
            <div className="day-list plan-summary">
              <div className="day-list-row">
                <span className="day-list-icon"><Dumbbell size={16} /></span>
                <div className="day-list-field">
                  <span className="day-list-label">{t('summary_trainings_per_week')}</span>
                  <span className="plan-summary-value">{daysPerWeek}</span>
                </div>
              </div>
              <div className="day-list-row">
                <span className="day-list-icon plan-summary-rest"><Moon size={16} /></span>
                <div className="day-list-field">
                  <span className="day-list-label">{t('summary_rest_days')}</span>
                  <span className="plan-summary-value">{7 - daysPerWeek}</span>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => goStep(2)}>
              {t('next_btn')} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: months */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:6 }}>
              {t('step2_heading')}
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24 }}>
              {t('step2_body')}
            </p>
            <div className="seg-control seg-control-12" role="radiogroup" aria-label={t('step2_heading')}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button key={n} role="radio" aria-checked={months === n}
                  className={months === n ? 'selected' : ''} onClick={() => setMonths(n)}>{n}</button>
              ))}
            </div>
            <div className="plan-stats">
              <div>
                <span className="plan-stat">{months * 4}</span>
                <span className="day-list-label">{plural(months * 4, t('weeks_1'), t('weeks_2_4'), t('weeks_5plus'))}</span>
              </div>
              <div>
                <span className="plan-stat">{months * 4 * daysPerWeek}</span>
                <span className="day-list-label">{plural(months * 4 * daysPerWeek, t('workouts_1'), t('workouts_2_4'), t('workouts_5plus'))}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-outline" onClick={() => goStep(1)}>
                <ArrowLeft size={16} /> {t('back_btn')}
              </button>
              <button className="btn btn-primary" onClick={goToStep3}>
                {t('next_btn')} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: plan name + days */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:6 }}>
              {t('step3_heading')}
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>
              {t('step3_body')}
            </p>

            <DayList days={days} planName={planName} onPlanNameChange={setPlanName}
              onDayNameChange={setDayName} onDayColorChange={setDayColor} onOpenExercises={goToExercises} />

            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button className="btn btn-outline" onClick={() => goStep(2)}>
                <ArrowLeft size={16} /> {t('back_btn')}
              </button>
              <button className="btn btn-primary" disabled={saving} onClick={savePlan}>
                {saving ? t('saving') : <><span>{t('save_plan_btn')}</span><ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: exercises */}
        {step === 4 && activeDay && (
          <div>
            <button className="back-btn" onClick={() => goStep(3)}>
              <ArrowLeft size={15} /> {t('back_to_days')}
            </button>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:4 }}>
              {activeDay.day_name}
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>
              {t('step4_body')}
            </p>

            {activeDay.exercises.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:14 }}>
                {t('no_exercises_empty')}
              </div>
            )}

            <div ref={exListRef} style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
              {activeDay.exercises.map((ex, ei) => (
                <div key={ei} data-flip className="ex-builder" style={{ background:'var(--bg-subtle)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
                    <div style={{ width:26, height:26, background:'white', border:'1.5px solid var(--border)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:9 }}>
                      <span style={{ fontSize:11, fontWeight:800, color:'var(--text-subtle)' }}>{ei+1}</span>
                    </div>
                    <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                      <input className="form-input" placeholder={t('exercise_name_placeholder')}
                        value={ex.name} onChange={e => setEx(ei, 'name', e.target.value)} />
                      <select className="form-select" style={{ width:'auto', minWidth:130 }}
                        value={ex.muscle_group} onChange={e => setEx(ei, 'muscle_group', e.target.value)}>
                        {MUSCLE_GROUPS.map(g => (
                          <option key={g} value={g}>{t(MUSCLE_GROUP_TO_KEY[g] ?? 'muscle_chest')}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingLeft:36 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>{t('sets_label')}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:6, background:'white', border:'1.5px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                        <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 4px', fontSize:18, lineHeight:1, display:'flex', alignItems:'center' }}
                          onClick={() => setEx(ei, 'sets', Math.max(1, ex.sets - 1))}>−</button>
                        <span style={{ fontWeight:800, fontSize:15, color:'var(--text-heading)', minWidth:16, textAlign:'center' }}>{ex.sets}</span>
                        <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 4px', fontSize:18, lineHeight:1, display:'flex', alignItems:'center' }}
                          onClick={() => setEx(ei, 'sets', Math.min(10, ex.sets + 1))}>+</button>
                      </div>
                      <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>{t('rep_range_label')}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:4, background:'white', border:'1.5px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                        <input type="number" min={1} max={100} step={1} className="rep-range-input" placeholder="min"
                          value={ex.rep_min} onChange={e => setEx(ei, 'rep_min', e.target.value)} />
                        <span style={{ color:'var(--text-muted)' }}>–</span>
                        <input type="number" min={1} max={100} step={1} className="rep-range-input" placeholder="max"
                          value={ex.rep_max} onChange={e => setEx(ei, 'rep_max', e.target.value)} />
                      </div>
                      <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>{t('rest_label')}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:6, background:'white', border:'1.5px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                        <button aria-label={t('rest_decrease')} disabled={ex.rest_seconds <= REST_MIN} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 4px', fontSize:18, lineHeight:1, display:'flex', alignItems:'center', opacity: ex.rest_seconds <= REST_MIN ? 0.3 : 1 }}
                          onClick={() => setEx(ei, 'rest_seconds', clampRest(ex.rest_seconds - REST_STEP))}>−</button>
                        <span style={{ fontWeight:800, fontSize:15, color:'var(--text-heading)', minWidth:34, textAlign:'center' }}>{formatRest(ex.rest_seconds)}</span>
                        <button aria-label={t('rest_increase')} disabled={ex.rest_seconds >= REST_MAX} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 4px', fontSize:18, lineHeight:1, display:'flex', alignItems:'center', opacity: ex.rest_seconds >= REST_MAX ? 0.3 : 1 }}
                          onClick={() => setEx(ei, 'rest_seconds', clampRest(ex.rest_seconds + REST_STEP))}>+</button>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn-icon" onClick={() => moveEx(ei, -1)} disabled={ei === 0}
                        style={{ opacity: ei === 0 ? 0.3 : 1 }}>
                        <ChevronUp size={15} />
                      </button>
                      <button className="btn-icon" onClick={() => moveEx(ei, 1)} disabled={ei === activeDay.exercises.length - 1}
                        style={{ opacity: ei === activeDay.exercises.length - 1 ? 0.3 : 1 }}>
                        <ChevronDown size={15} />
                      </button>
                      <button className="btn-icon" onClick={() => removeEx(ei)}
                        style={{ color:'var(--danger)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-outline btn-full" onClick={addEx} style={{ marginBottom:24 }}>
              <Plus size={16} /> {t('add_exercise_btn')}
            </button>

            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button className="btn btn-outline" onClick={() => goStep(3)}>
                <ArrowLeft size={16} /> {t('back_to_days')}
              </button>
              <button className="btn btn-primary" disabled={saving} onClick={savePlan}>
                {saving ? t('saving') : <><span>{t('save_plan_btn')}</span><ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
