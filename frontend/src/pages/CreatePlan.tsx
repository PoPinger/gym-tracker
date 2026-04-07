import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plansApi } from '../services/api';
import { MUSCLE_GROUPS } from '../types';
import { Plus, Trash2, ChevronUp, ChevronDown, ArrowRight, ArrowLeft, Dumbbell } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

interface ExDraft { name: string; muscle_group: string; sets: number; }
interface DayDraft { day_name: string; exercises: ExDraft[]; }

const DEFAULT_DAY_NAMES = ['Pchanie', 'Ciąganie', 'Nogi', 'Górna część', 'Dolna część', 'Całe ciało', 'Kardio'];

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n:1, label:'Dni/tydz.' },
    { n:2, label:'Czas' },
    { n:3, label:'Nazwy dni' },
    { n:4, label:'Ćwiczenia' },
  ];
  return (
    <div className="steps">
      {steps.map((s, i) => {
        const state = step > s.n ? 'done' : step === s.n ? 'active' : 'todo';
        return (
          <div key={s.n} className={`step-item ${state}`} style={{ flex: i < steps.length - 1 ? 1 : 'none', display:'flex', alignItems:'center', minWidth: 0 }}>
            <div className={`step-bubble ${state}`}>
              {state === 'done' ? '✓' : s.n}
            </div>
            <span className="step-name" style={{ whiteSpace:'nowrap', marginRight:6 }}>{s.label}</span>
            {i < steps.length - 1 && <div className={`step-connector ${state === 'done' ? 'done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function CreatePlan() {
  const navigate = useNavigate();
  const [step, setStep]               = useState<Step>(1);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [months, setMonths]           = useState(3);
  const [planName, setPlanName]       = useState('Mój plan treningowy');
  const [days, setDays]               = useState<DayDraft[]>([]);
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const goToStep3 = () => {
    const next: DayDraft[] = Array.from({ length: daysPerWeek }, (_, i) =>
      days[i] ?? { day_name: DEFAULT_DAY_NAMES[i] ?? `Dzień ${i + 1}`, exercises: [] }
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
    const t = ei + dir;
    setDays(d => d.map((day, i) => {
      if (i !== activeDayIdx) return day;
      const exs = [...day.exercises];
      if (t < 0 || t >= exs.length) return day;
      [exs[ei], exs[t]] = [exs[t], exs[ei]];
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
      setError(e.response?.data?.detail || 'Nie udało się zapisać planu');
    } finally {
      setSaving(false);
    }
  };

  const activeDay = days[activeDayIdx];

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Utwórz plan treningowy</h1>
          <p className="page-subtitle">Zbuduj swój spersonalizowany harmonogram treningów</p>
        </div>
      </div>

      <StepIndicator step={step} />

      <div className="card">

        {/* ── Krok 1: dni/tydzień ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:6 }}>
              Ile dni w tygodniu?
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24 }}>
              Wybierz, jak często chcesz trenować każdego tygodnia.
            </p>
            <div className="num-picker" style={{ marginBottom:32 }}>
              {[1,2,3,4,5,6,7].map(n => (
                <button key={n} className={`num-pill ${daysPerWeek === n ? 'selected' : ''}`}
                  onClick={() => setDaysPerWeek(n)}>{n}</button>
              ))}
            </div>
            <div style={{ background:'var(--primary-light)', borderRadius:10, padding:'12px 16px', marginBottom:28 }}>
              <span style={{ fontSize:13, color:'var(--primary)', fontWeight:600 }}>
                {daysPerWeek} {daysPerWeek === 1 ? 'dzień treningowy' : 'dni treningowych'} w tygodniu
              </span>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Dalej <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Krok 2: miesiące ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:6 }}>
              Na ile miesięcy?
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24 }}>
              Określa łączny czas trwania planu.
            </p>
            <div className="num-picker" style={{ marginBottom:32 }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button key={n} className={`num-pill ${months === n ? 'selected' : ''}`}
                  onClick={() => setMonths(n)}>{n}</button>
              ))}
            </div>
            <div style={{ background:'var(--primary-light)', borderRadius:10, padding:'12px 16px', marginBottom:28 }}>
              <span style={{ fontSize:13, color:'var(--primary)', fontWeight:600 }}>
                {months} mies. · {months * 4} tyg. łącznie · {months * 4 * daysPerWeek} sesji treningowych
              </span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Wstecz
              </button>
              <button className="btn btn-primary" onClick={goToStep3}>
                Dalej <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Krok 3: nazwa planu + dni ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:6 }}>
              Skonfiguruj swój plan
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>
              Nadaj nazwę planowi i każdemu dniu, następnie kliknij dzień, aby dodać ćwiczenia.
            </p>

            <div className="form-group" style={{ marginBottom:24 }}>
              <label className="form-label">Nazwa planu</label>
              <input className="form-input" value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder="np. GBP 3-dniowy split" />
            </div>

            <div className="section-title">Dni treningowe</div>
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
                    placeholder={`Nazwa dnia ${i+1}`}
                    onClick={e => e.stopPropagation()}
                  />
                  <button className="btn btn-outline btn-sm" onClick={() => goToExercises(i)}
                    style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
                    <Dumbbell size={14} />
                    {day.exercises.length > 0
                      ? `${day.exercises.length} ${day.exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}`
                      : 'Dodaj ćwiczenia'}
                  </button>
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Wstecz
              </button>
              <button className="btn btn-primary" disabled={saving} onClick={savePlan}>
                {saving ? 'Zapisywanie…' : <><span>Zapisz plan</span><ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── Krok 4: ćwiczenia ── */}
        {step === 4 && activeDay && (
          <div>
            <button className="back-btn" onClick={() => setStep(3)}>
              <ArrowLeft size={15} /> Wróć do dni
            </button>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:4 }}>
              {activeDay.day_name}
            </h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>
              Dodaj ćwiczenia do tego dnia treningowego
            </p>

            {activeDay.exercises.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:14 }}>
                Brak ćwiczeń — dodaj pierwsze poniżej
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
                      <input className="form-input" placeholder="Nazwa ćwiczenia (np. Wyciskanie)"
                        value={ex.name} onChange={e => setEx(ei, 'name', e.target.value)} />
                      <select className="form-select" style={{ width:'auto', minWidth:130 }}
                        value={ex.muscle_group} onChange={e => setEx(ei, 'muscle_group', e.target.value)}>
                        {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingLeft:36 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>Serie:</span>
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
              <Plus size={16} /> Dodaj ćwiczenie
            </button>

            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button className="btn btn-outline" onClick={() => setStep(3)}>
                <ArrowLeft size={16} /> Wróć do dni
              </button>
              <button className="btn btn-primary" disabled={saving} onClick={savePlan}>
                {saving ? 'Zapisywanie…' : <><span>Zapisz plan</span><ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
