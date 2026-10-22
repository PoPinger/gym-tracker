// "Moja waga" views: setup, weight panel (summary, weekly-average chart, week list) and week detail
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, CalendarDays, Check, CheckCircle2, ChevronRight, Minus, Pencil, Plus, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useDrawOnView } from '../hooks/useDrawOnView';
import AnimatedValue from './AnimatedValue';
import WeightRider from './mascot/WeightRider';
import GoalKulka from './mascot/GoalKulka';
import WeekStampKulka, { type StampCue } from './mascot/WeekStampKulka';
import CelebrateMascot from './mascot/CelebrateMascot';
import Confetti from './mascot/Confetti';
import { prefersReducedMotion } from '../hooks/useFirstInView';
import { plural } from '../utils/plural';
import { trendTone, type WeightGoal } from '../utils/weightTrend';
import type { WeightCycle, WeightWeek } from '../types';

// Weights in this section use a Polish decimal comma without a trailing ",0" (94,3 / 91)
const fmtNum = (v: number) => v.toLocaleString('pl-PL', { maximumFractionDigits: 1 });
const fmtKg = (v: number | null) => v == null ? '—' : `${fmtNum(v)} kg`;
const fmtDiff = (d: number | null) => d == null ? '—' : `${d > 0 ? '+' : d < 0 ? '−' : ''}${fmtNum(Math.abs(d))} kg`;

// Weight change with arrow, coloured by the cycle goal (see utils/weightTrend)
function Diff({ d, goal, big }: { d: number | null; goal: string | null; big?: boolean }) {
  const icon = d == null || d === 0 ? <Minus size={big ? 16 : 13} /> : d > 0 ? <TrendingUp size={big ? 16 : 13} /> : <TrendingDown size={big ? 16 : 13} />;
  return <span className={`w-diff tone-${trendTone(d, goal)}${big ? ' big' : ''}`}>{icon}<AnimatedValue value={d} format={fmtDiff} /></span>;
}

/* ─────────── SETUP ─────────── */
export function SetupView({ months, setMonths, goal, setGoal, error, loading, onSubmit }: {
  months: number; setMonths: (n: number) => void; goal: WeightGoal | null; setGoal: (g: WeightGoal) => void;
  error: string; loading: boolean; onSubmit: (e: React.FormEvent) => void;
}) {
  const { t } = useLanguage();
  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header"><div><h1 className="page-title">{t('my_weight_title')}</h1><p className="page-subtitle">{t('my_weight_subtitle')}</p></div></div>
      <form className="card w-setup" onSubmit={onSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <label className="form-label">{t('goal_label')}</label>
        <div className="seg-control w-goal-seg" role="radiogroup" aria-label={t('goal_label')}>
          {(['bulk', 'cut'] as const).map(g => (
            <button key={g} type="button" role="radio" aria-checked={goal === g} className={goal === g ? 'selected' : ''} onClick={() => setGoal(g)}>
              {g === 'bulk' ? <TrendingUp size={18} /> : <TrendingDown size={18} />} {g === 'bulk' ? t('goal_bulk') : t('goal_cut')}
            </button>
          ))}
        </div>

        <label className="form-label">{t('edit_duration_label')}</label>
        <div className="seg-control seg-control-12" role="radiogroup" aria-label={t('edit_duration_label')}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
            <button key={n} type="button" role="radio" aria-checked={months === n} className={months === n ? 'selected' : ''} onClick={() => setMonths(n)}>{n}</button>
          ))}
        </div>
        <div className="plan-stats one">
          <div><span className="plan-stat">{months * 4}</span><span className="day-list-label">{plural(months * 4, t('weeks_1'), t('weeks_2_4'), t('weeks_5plus'))}</span></div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t('configuring') : <><Plus size={16} /> {t('start_tracking_btn')}</>}
        </button>
      </form>
    </div>
  );
}

/* ─────────── WEEKLY-AVERAGE CHART ─────────── */
// Lines are SVG stretched to the box (non-scaling strokes); dots and labels are HTML so they stay round and readable
function WeeklyChart({ weeks, avg, goal, onRiderArrive }: {
  weeks: WeightWeek[]; avg: (w: WeightWeek) => number | null; goal: string | null; onRiderArrive?: (box: DOMRect) => void;
}) {
  const { t } = useLanguage();
  const [plotRef, pending] = useDrawOnView<HTMLDivElement>();
  const pts = weeks.map((w, i) => ({ n: w.week_number, i, a: avg(w) })).filter((p): p is { n: number; i: number; a: number } => p.a != null);
  if (pts.length < 2) return <div className="card w-chart"><div className="day-list-label">{t('weight_chart_title')}</div><div className="w-chart-empty">{t('weight_chart_empty')}</div></div>;

  const min = Math.min(...pts.map(p => p.a)), max = Math.max(...pts.map(p => p.a));
  const lo = min - Math.max((max - min) * 0.15, 0.2), hi = max + Math.max((max - min) * 0.15, 0.2);
  const x = (i: number) => (weeks.length > 1 ? i / (weeks.length - 1) : 0.5) * 100;
  const y = (a: number) => (1 - (a - lo) / (hi - lo)) * 100;
  const labelEvery = weeks.length > 16 ? 4 : weeks.length > 8 ? 2 : 1; // the last week is always labelled; drop a label too close to it

  return (
    <div className="card w-chart">
      <div className="day-list-label">{t('weight_chart_title')}</div>
      <div className="w-chart-body">
        <div className="w-chart-y"><span>{fmtNum(hi)}</span><span>{fmtNum((hi + lo) / 2)}</span><span>{fmtNum(lo)}</span></div>
        <div ref={plotRef} className={`w-chart-plot${pending ? ' draw-pending' : ''}`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {[0, 50, 100].map(g => <line key={g} x1="0" x2="100" y1={g} y2={g} className="w-chart-grid" />)}
            {pts.slice(1).map((p, k) => (
              <line key={p.n} data-draw x1={x(pts[k].i)} y1={y(pts[k].a)} x2={x(p.i)} y2={y(p.a)}
                className={`w-chart-seg tone-${trendTone(+(p.a - pts[k].a).toFixed(1), goal)}`} />
            ))}
          </svg>
          {pts.map((p, k) => (
            <span key={p.n} data-draw-dot className={`w-chart-dot tone-${k ? trendTone(+(p.a - pts[k - 1].a).toFixed(1), goal) : 'neutral'}`}
              style={{ left: `${x(p.i)}%`, top: `${y(p.a)}%` }} title={`${t('week_tile_label')} ${p.n}: ${fmtKg(p.a)}`} />
          ))}
          <WeightRider pts={pts.map(p => ({ x: x(p.i), y: y(p.a), kg: p.a }))} drawing={!pending} onArrive={onRiderArrive} />
        </div>
        <div className="w-chart-x">
          {weeks.map((w, i) => (i === weeks.length - 1 || (i % labelEvery === 0 && weeks.length - 1 - i >= labelEvery)) && (
            <span key={w.id} style={{ left: `${x(i)}%` }}>{t('week_abbr')}{w.week_number}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────── PANEL ─────────── */
export function PanelView({ cycle, first, last, avg, prevAvg, onOpenWeek, onReset, onEditDuration, goalSwitch }: {
  cycle: WeightCycle; first: number | null; last: number | null;
  avg: (w: WeightWeek) => number | null; prevAvg: (n: number) => number | null;
  onOpenWeek: (w: WeightWeek) => void; onReset: () => void; onEditDuration: () => void; goalSwitch: ReactNode;
}) {
  const { t } = useLanguage();
  const goal = cycle.goal;
  const weeks = [...cycle.weeks].sort((a, b) => a.week_number - b.week_number);
  const done = weeks.filter(w => w.status === 'completed').length;
  const current = weeks.find(w => w.status !== 'completed');
  const change = first != null && last != null ? +(last - first).toFixed(1) : null;
  // Kulka rides the chart line first (when it has one), then jumps onto the goal toggle
  const [rides] = useState(() => !prefersReducedMotion() && weeks.filter(w => avg(w) != null).length >= 2);
  const [riderAt, setRiderAt] = useState<DOMRect | null>(null);

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="page-header w-panel-header">
        <div>
          <h1 className="page-title">{t('my_weight_title')}</h1>
          <p className="page-subtitle">{t('started_from')} <strong>{fmtKg(first)}</strong> · {cycle.months} {cycle.months === 1 ? t('month_singular') : t('months_plural')}</p>
        </div>
        <div className="w-panel-actions has-mascot">
          <span className="w-goal-wrap">
            {goalSwitch}
            {(!rides || riderAt) && <GoalKulka goal={goal} from={riderAt} />}
          </span>
          <button className="btn btn-outline btn-sm" onClick={onEditDuration}><Pencil size={13} /> {t('edit_btn')}</button>
          <button className="btn btn-outline btn-sm btn-danger-outline" onClick={onReset}><RotateCcw size={13} /> {t('reset_btn')}</button>
        </div>
      </div>

      {!goal && <div className="alert alert-info w-goal-hint">{t('goal_not_set')}</div>}
      {weeks.every(w => w.status === 'completed') && <div className="w-finished"><CheckCircle2 size={18} /> {t('all_weeks_complete_msg')}</div>}

      <div className="w-summary">
        <span><small>{t('weight_start_label')}</small><strong>{fmtKg(first)}</strong></span>
        <ChevronRight size={16} className="w-summary-arrow" />
        <span><small>{t('weight_now_label')}</small><strong>{fmtKg(last)}</strong></span>
        <Diff d={change} goal={goal} big />
        <span className="w-summary-progress">
          <small>{done}/{weeks.length} {t('weeks_abbr')}</small>
          <span className="plan-progress-bar"><span style={{ width: `${(done / weeks.length) * 100}%` }} /></span>
        </span>
      </div>

      <WeeklyChart weeks={weeks} avg={avg} goal={goal} onRiderArrive={setRiderAt} />

      <div className="day-list w-week-list">
        {weeks.map(w => {
          const a = avg(w), p = prevAvg(w.week_number), d = a != null && p != null ? +(a - p).toFixed(1) : null;
          const logged = w.day_logs.filter(x => x.weight_kg != null).length;
          const st = w.status === 'completed' ? 'done' : w.id === current?.id ? 'current' : '';
          return (
            <button key={w.id} className={`day-list-row w-week-row ${st}`} onClick={() => onOpenWeek(w)}>
              <span className={`w-week-num ${st}`}>{st === 'done' ? <Check size={14} strokeWidth={3} /> : w.week_number}</span>
              <span className="day-list-field">
                <span className="day-list-label">{t('week_tile_label')} {w.week_number}</span>
                <span className="w-week-days" aria-label={`${logged}/7`}>{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < logged ? 'on' : ''} />)}<small>{logged}/7</small></span>
              </span>
              <span className="w-week-avg">{fmtKg(a)}</span>
              {d != null ? <Diff d={d} goal={goal} /> : <span className="w-week-diff-empty" />}
              <ChevronRight size={16} className="day-card-chevron" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── WEEK ─────────── */
// celebrate: the week was just finished here (Kulka jumps for joy with big confetti over the readings card)
export function WeekView({ week, goal, avgVal, diffPrev, diffW1, dayNames, inputs, onInput, onSave, saving, saved, onBack, onFinish, celebrate }: {
  week: WeightWeek; goal: string | null; avgVal: number | null; diffPrev: number | null; diffW1: number | null; dayNames: string[];
  inputs: Record<number, string>; onInput: (day: number, v: string) => void; onSave: (logId: number, day: number) => void;
  saving: Record<number, boolean>; saved: Record<number, boolean>; onBack: () => void; onFinish: () => void; celebrate: boolean;
}) {
  const { t } = useLanguage();
  const days = [...week.day_logs].sort((a, b) => a.day_of_week - b.day_of_week);
  const logged = days.filter(d => d.weight_kg != null).length;

  // A day whose save just succeeded: Kulka runs over and stamps its tile
  const [stamp, setStamp] = useState<StampCue | null>(null);
  const wasSaved = useRef(saved);
  useEffect(() => {
    const i = days.findIndex(d => saved[d.id] && !wasSaved.current[d.id]);
    wasSaved.current = saved;
    if (i >= 0) setStamp(s => ({ index: i, seq: (s?.seq ?? 0) + 1 }));
  }, [saved]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ maxWidth: 760 }}>
      <button className="back-btn" onClick={onBack}><ArrowLeft size={15} /> {t('all_weeks_back')}</button>
      <div className="page-header"><div>
        <h1 className="page-title">{t('week_tile_label')} {week.week_number}</h1>
        <p className="page-subtitle"><CalendarDays size={13} style={{ verticalAlign: '-2px' }} /> {t('weight_readings_count').replace('{n}', String(logged))}{week.status === 'completed' ? ` · ${t('done_label')}` : ''}</p>
      </div></div>

      <div className="w-week-stats">
        <div><span className="day-list-label">{t('week_avg_label')}</span><strong>{avgVal != null ? <>{fmtNum(avgVal)} <small>kg</small></> : '—'}</strong></div>
        <div><span className="day-list-label">{t('vs_prev_week_label')}</span><Diff d={diffPrev} goal={goal} big /></div>
        <div><span className="day-list-label">{t('vs_week1_label')}</span><Diff d={diffW1} goal={goal} big /></div>
      </div>

      <div className="card has-stamper">
        {celebrate ? <><Confetti big /><span className="m-stamp-home"><CelebrateMascot week size={48} /></span></> : <WeekStampKulka cue={stamp} />}
        <div className="day-list-label">{t('daily_readings_label')}</div>
        <div className="w-day-grid">
          {days.map(d => (
            <div key={d.id} className={`w-day-cell${d.weight_kg != null ? ' logged' : ''}`}>
              <span className="w-day-name">{dayNames[d.day_of_week]}</span>
              <input type="number" className="w-input" placeholder="kg" step="0.1" min="1" aria-label={dayNames[d.day_of_week]}
                value={inputs[d.day_of_week] ?? ''} onChange={e => onInput(d.day_of_week, e.target.value)} />
              <button className={`btn btn-sm ${saved[d.id] ? 'btn-success' : 'btn-outline'} w-save`} disabled={saving[d.id]}
                onClick={() => onSave(d.id, d.day_of_week)} aria-label={`${t('save_sets_btn')} ${dayNames[d.day_of_week]}`} title={t('save_sets_btn')}>
                {saving[d.id] ? '…' : <Check size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {week.status !== 'completed' && (
        <button className="btn btn-success btn-full w-finish" onClick={onFinish}><CheckCircle2 size={16} /> {t('finish_week_btn')}</button>
      )}
    </div>
  );
}
