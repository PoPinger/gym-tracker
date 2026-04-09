import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plansApi } from '../services/api';
import { MUSCLE_GROUPS } from '../types';
import { MUSCLE_GROUP_TO_KEY } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';
import { Plus, Trash2, ChevronUp, ChevronDown, ArrowRight, ArrowLeft, Dumbbell } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

interface ExDraft { name: string; muscle_group: string; sets: number; }
interface DayDraft { day_name: string; exercises: ExDraft[]; }

function StepIndicator({ step, labels }: { step: Step; labels: string[] }) {
  return (
    <div className="steps">
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

  const defaultDayNames = [
    t('default_day_push'), t('default_day_pull'), t('default_day_legs'),
    t('default_day_upper'), t('default_day_lower'), t('default_day_full'), t('default_day_cardio'),
  ];

  const stepLabels = [
    t('step_days_per_week'),
    t('step_duration'),
    t('step_day_names'),
    t('step_exercises'),
  ];

  const goToStep3 = () => {
    const next: DayDraft[] = Array.from({ length: daysPerWeek }, (_, i) =>
      days[i] ?? { day_name: defaultDayNames[i] ?? `${t('day_number_fallback')} ${i + 1}`, exercises: [] }
    );
    setDays(next);
    setActiveDayIdx(0);
    setStep(3);
  };

  const goToExercises = (idx: number) => { setActiveDayIdx(idx); setStep(4); };

  const setDayName = (i: number, name: string) => {
    setDays(d => d.map((day, idx) => idx === i ? { ...day, day_name: name } : day));
  };

  const addEx = () => {
    setDays(d => d.map((day, i) => i !== activeDayIdx ? day : {
      ...day, exercises: [...day.exercises, { name: '', muscle_group: MUSCLE_GROUPS[0], sets: 3 }]
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

  const moveEx = (ei: number, dir: -1 | 1) => {
    const target = ei + dir;
    setDays(d => d.map((day, i) => {
      if (i !== activeDayIdx) return day;
      const exs = [...day.exercises];
      if (target < 0 || target >= exs.length) return day;
      [exs[ei], exs[target]] = [exs[target], exs[ei]];
      return { ...day, exercises: exs };
    }));
  };

  const savePlan = async () => {
    setSaving(true); setError('');
    try {
      await plansApi.create({
        name: planName, days_per_week: daysPerWeek, months,
        days: days.map((d, di) => ({
          day_name: d.day_name, day_order: di,
          exercises: d.exercises.filter(e => e.name.trim()).map((e, ei) => ({
            name: e.name, muscle_group: e.muscle_group, sets: e.sets, exercise_order: ei,
          })),
        })),
      });
      navigate('/plans');
    } catch (e: any) {
      setError(e.response?.data?.detail || t('save_plan_error'));
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

      <StepIndicator step={step} labels={stepLabels} />

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
            <div className="num-picker" style={{ marginBottom:32 }}>
              {[1,2,3,4,5,6,7].map(n => (
                <button key={n} className={`num-pill ${daysPerWeek === n ? 'selected' : ''}`}
                  onClick={() => setDaysPerWeek(n)}>{n}</button>
              ))}
            </div>
            <div style={{ background:'var(--primary-light)', borderRadius:10, padding:'12px 16px', marginBottom:28 }}>
              <span style={{ fontSize:13, color:'var(--primary)', fontWeight:600 }}>
                {daysPerWeek} {daysPerWeek === 1 ? t('training_day_singular') : t('training_days_plural')}
              </span>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
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
            <div className="num-picker" style={{ marginBottom:32 }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button key={n} className={`num-pill ${months === n ? 'selected' : ''}`}
                  onClick={() => setMonths(n)}>{n}</button>
              ))}
            </div>
            <div style={{ background:'var(--primary-light)', borderRadius:10, padding:'12px 16px', marginBottom:28 }}>
              <span style={{ fontSize:13, color:'var(--primary)', fontWeight:600 }}>
                {months} {t('months_abbr')} · {months * 4} {t('weeks_abbr')} · {months * 4 * daysPerWeek} {t('training_sessions')}
              </span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>
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

            <div className="form-group" style={{ marginBottom:24 }}>
              <label className="form-label">{t('plan_name_label')}</label>
              <input className="form-input" value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder={t('plan_name_placeholder')} />
            </div>

            <div className="section-title">{t('training_days_section')}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
              {days.map((day, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:10,
                  background:'var(--bg-subtle)', border:'1.5px solid var(--border)',
                  borderRadius:'var(--radius)', padding:'12px 14px',
                }}>
                  <div style={{ width:28, height:28, background:'var(--primary-light)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'var(--primary)' }}>{i+1}</span>
                  </div>
                  <input className="form-input" style={{ flex:1, minWidth:0 }}
                    value={day.day_name}
                    onChange={e => setDayName(i, e.target.value)}
                    placeholder={`${t('day_name_placeholder')} ${i+1}`}
                    onClick={e => e.stopPropagation()}
                  />
                  <button className="btn btn-outline btn-sm" onClick={() => goToExercises(i)}
                    style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
                    <Dumbbell size={14} />
                    {day.exercises.length > 0
                      ? `${day.exercises.length} ${day.exercises.length === 1 ? t('exercise_singular') : t('exercises_plural')}`
                      : t('add_exercises_btn')}
                  </button>
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>
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
            <button className="back-btn" onClick={() => setStep(3)}>
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

            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
              {activeDay.exercises.map((ex, ei) => (
                <div key={ei} className="ex-builder" style={{ background:'var(--bg-subtle)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14 }}>
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
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>{t('sets_label')}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:6, background:'white', border:'1.5px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                        <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 4px', fontSize:18, lineHeight:1, display:'flex', alignItems:'center' }}
                          onClick={() => setEx(ei, 'sets', Math.max(1, ex.sets - 1))}>−</button>
                        <span style={{ fontWeight:800, fontSize:15, color:'var(--text-heading)', minWidth:16, textAlign:'center' }}>{ex.sets}</span>
                        <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 4px', fontSize:18, lineHeight:1, display:'flex', alignItems:'center' }}
                          onClick={() => setEx(ei, 'sets', Math.min(10, ex.sets + 1))}>+</button>
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
              <button className="btn btn-outline" onClick={() => setStep(3)}>
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
