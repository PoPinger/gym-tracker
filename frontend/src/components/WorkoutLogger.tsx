// Workout logger of a training day: one focus card per exercise, accented with the day's colour.
// Mobile first: big numeric inputs, per-exercise saved/unsaved status and a sticky finish bar.
import { useState } from 'react';
import { ArrowLeft, CalendarDays, Check, CheckCircle2, Circle, Dumbbell, SkipForward, TrendingUp } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { MUSCLE_GROUP_TO_KEY } from '../i18n/translations';
import { exerciseScore, firstWeight, formatKg, formatPct, progressPct, shouldAddWeight } from '../utils/progress';
import { formatRepRange } from '../utils/repRange';
import { todayIso } from '../utils/date';
import type { DayColor } from '../utils/dayColors';
import AnimatedValue from './AnimatedValue';
import type { DayLog, ExerciseLog } from '../types';

type Status = 'empty' | 'unsaved' | 'saved' | 'skipped';
type Ref = { weight: number | null; pct: number | null };

export interface WorkoutLoggerProps {
  dayLog: DayLog; dayName: string; color: DayColor; backLabel: string; onBack: () => void;
  workoutDate: string; onDateChange: (d: string) => void; dateInvalid: boolean;
  skipped: boolean; onToggleSkipped: (v: boolean) => void; onToggleExerciseSkipped: (id: number, v: boolean) => void;
  weights: Record<number, string>; onEditSet: (id: number, setNum: number, raw: string) => void; onEditWeight: (id: number, raw: string) => void;
  onSave: (id: number) => Promise<void>; saving: Record<number, boolean>;
  onFinish: () => void;
}

// What was last loaded from or sent to the server, to tell saved from unsaved
const fingerprint = (el: ExerciseLog, weight: string) =>
  JSON.stringify([el.skipped, weight, el.set_logs.map(s => s.reps)]);
const hasData = (el: ExerciseLog, weight: string) => weight !== '' || el.set_logs.some(s => s.reps != null);
const pctTone = (pct: number | null) => pct == null || pct === 0 ? 'neutral' : pct > 0 ? 'good' : 'bad';

function StatusBadge({ s }: { s: Status }) {
  const { t } = useLanguage();
  const label = { empty: t('wl_status_empty'), unsaved: t('wl_status_unsaved'), saved: t('save_sets_saved'), skipped: t('exercise_skipped_label') }[s];
  const icon = { empty: <Circle size={12} />, unsaved: <span className="wl-dot" />, saved: <Check size={12} strokeWidth={3} />, skipped: <SkipForward size={12} /> }[s];
  return <span className={`wl-status ${s}`}>{icon}{label}</span>;
}

function Pill({ label, d }: { label: string; d: Ref }) {
  const { lang } = useLanguage();
  return (
    <span className="wl-pill">
      <small>{label}</small>
      <span>{d.weight != null ? formatKg(d.weight, lang) : '—'}</span>
      <strong className={`tone-${pctTone(d.pct)}`}><AnimatedValue value={d.pct} format={v => formatPct(v, lang)} /></strong>
    </span>
  );
}

// The logger is keyed by the day log, so the saved snapshot is taken once when the day opens
export default function WorkoutLogger(p: WorkoutLoggerProps) {
  const { t } = useLanguage();
  const { dayLog, weights } = p;
  const [savedPrint, setSavedPrint] = useState<Record<number, string>>(() =>
    Object.fromEntries(dayLog.exercise_logs.map(el => [el.id, fingerprint(el, weights[el.id] ?? '')])));

  const weekNum = dayLog.week_number ?? 1;
  const items = dayLog.exercise_logs.map(el => {
    const w = weights[el.id] ?? '';
    const prevSets = dayLog.prev_week_data?.[el.exercise_id];
    const w1Sets = dayLog.week1_data?.[el.exercise_id];
    const cur = exerciseScore(el.set_logs);
    // Loaded with data and untouched counts as saved; any change since the last save is "unsaved"
    const status: Status = savedPrint[el.id] !== fingerprint(el, w) ? 'unsaved' : el.skipped ? 'skipped' : hasData(el, w) ? 'saved' : 'empty';
    return {
      el, w, status, range: formatRepRange(el.rep_min, el.rep_max),
      prevReps: (n: number) => prevSets?.find(s => s.set_number === n)?.reps ?? null,
      addHint: weekNum > 1 && !dayLog.prev_week_skipped?.includes(el.exercise_id) && shouldAddWeight(prevSets, el.rep_max),
      prev: weekNum > 1 ? { weight: firstWeight(prevSets), pct: el.skipped ? null : progressPct(cur, exerciseScore(prevSets)) } : null,
      w1: weekNum > 2 ? { weight: firstWeight(w1Sets), pct: el.skipped ? null : progressPct(cur, exerciseScore(w1Sets)) } : null,
    };
  });
  const savedCount = items.filter(i => i.status === 'saved' || i.status === 'skipped').length;

  const save = async (id: number, print: string) => {
    await p.onSave(id);
    setSavedPrint(s => ({ ...s, [id]: print }));
  };

  return (
    <div className={`wl day-color-${p.color}`} style={{ maxWidth: 700 }}>
      <button className="back-btn" onClick={p.onBack}><ArrowLeft size={15} /> {p.backLabel}</button>
      <div className="page-header wl-header">
        <span className="wl-day-icon"><Dumbbell size={20} /></span>
        <div>
          <h1 className="page-title">{p.dayName}</h1>
          <p className="page-subtitle">
            {dayLog.plan_name} · {t('week_tile_label')} {dayLog.week_number}
            {dayLog.status === 'completed' && <> <span className="badge badge-completed"><CheckCircle2 size={10} /> {t('badge_completed')}</span></>}
          </p>
        </div>
      </div>

      <div className="wl-daybar">
        <label className="wl-date">
          <CalendarDays size={16} />
          <span>{t('workout_date_label').replace(':', '')}</span>
          <input type="date" value={p.workoutDate} max={todayIso()} onChange={e => p.onDateChange(e.target.value)} />
        </label>
        <button type="button" role="switch" aria-checked={p.skipped} className={`wl-switch danger${p.skipped ? ' on' : ''}`} onClick={() => p.onToggleSkipped(!p.skipped)}>
          <span className="wl-switch-track"><span /></span>{t('skipped_checkbox_label')}
        </button>
      </div>
      {p.dateInvalid && <div className="alert alert-error" style={{ marginBottom: 14 }}>{t('workout_date_future')}</div>}

      <div className="wl-list">
        {items.map((it, i) => {
          const { el } = it;
          const muscleKey = MUSCLE_GROUP_TO_KEY[el.muscle_group];
          const needsSave = it.status === 'unsaved' || it.status === 'empty';
          return (
            <section key={el.id} className={`wl-card ${it.status}`}>
              <div className="wl-card-head">
                <span className="wl-num">{i + 1}</span>
                <div className="wl-card-title">
                  <h2>{el.exercise_name}</h2>
                  <span className="wl-chip">{muscleKey ? t(muscleKey) : el.muscle_group}</span> <span className="wl-plan">{el.sets} × {it.range ?? '—'}</span>
                </div>
                <StatusBadge s={it.status} />
              </div>

              <div className="wl-sets">
                {el.set_logs.map(s => {
                  const pr = it.prevReps(s.set_number);
                  return (
                    <label key={s.set_number} className="wl-set">
                      <span className="wl-label">{t('sets_header')} {s.set_number}</span>
                      <input type="number" inputMode="numeric" min={0} className="wl-input" placeholder={t('reps_header').toLowerCase()}
                        value={s.reps ?? ''} onChange={e => p.onEditSet(el.id, s.set_number, e.target.value)} />
                      <span className="wl-set-prev">{pr != null && <>{t('wl_prev_short')} <b>{pr}</b></>}</span>
                    </label>
                  );
                })}
              </div>

              <div className="wl-weight">
                <label>
                  <span className="wl-label">{t('wl_weight_label')}</span>
                  <span className="wl-weight-field">
                    <input type="number" inputMode="decimal" step={0.5} min={0} className="wl-input" placeholder="0"
                      value={it.w} onChange={e => p.onEditWeight(el.id, e.target.value)} />
                    kg
                  </span>
                </label>
                {it.addHint && <span className="wl-hint"><TrendingUp size={13} /> {t('add_weight_hint')}</span>}
              </div>

              {(it.prev || it.w1) && (
                <div className="wl-pills">
                  {it.prev && <Pill label={t('vs_prev_week_label')} d={it.prev} />}
                  {it.w1 && <Pill label={t('vs_week1_label')} d={it.w1} />}
                </div>
              )}

              <div className="wl-actions">
                <button type="button" role="switch" aria-checked={el.skipped} className={`wl-switch${el.skipped ? ' on' : ''}`}
                  onClick={() => p.onToggleExerciseSkipped(el.id, !el.skipped)}>
                  <span className="wl-switch-track"><span /></span>{t('exercise_skipped_checkbox')}
                </button>
                <button type="button" disabled={p.saving[el.id] || p.dateInvalid} onClick={() => void save(el.id, fingerprint(el, it.w))}
                  className={`btn wl-save ${needsSave ? 'btn-primary' : 'btn-outline saved'}`}>
                  {p.saving[el.id] ? t('save_sets_saving') : needsSave ? t('save_sets_btn') : <><Check size={15} strokeWidth={3} /> {t('save_sets_saved')}</>}
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <div className="wl-finishbar">
        <span className="wl-finish-count">{t('wl_saved_count').replace('{n}', String(savedCount)).replace('{total}', String(items.length))}</span>
        <button className="btn btn-success btn-lg" disabled={p.dateInvalid} onClick={p.onFinish}><CheckCircle2 size={18} /> {t('finish_day_btn')}</button>
      </div>
    </div>
  );
}
