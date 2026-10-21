import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { trendTone } from '../utils/weightTrend';
import { plural } from '../utils/plural';
import { useLanguage } from '../i18n/LanguageContext';
import WorkoutCalendar from '../components/WorkoutCalendar';
import AppLoader from '../components/AppLoader';
import AnimatedValue from '../components/AnimatedValue';
import { useDrawOnView } from '../hooks/useDrawOnView';
import type { DashboardData } from '../types';

function StatCard({ icon, iconClass, label, value, sub, valueClass, onClick, extra, className = '' }: {
  icon: string; iconClass: string; label: string; value: React.ReactNode; sub: string;
  valueClass?: string; onClick?: () => void; extra?: React.ReactNode; className?: string;
}) {
  const body = (
    <>
      <div className={`stat-icon ${iconClass}`}><img className="stat-icon-img" src={icon} alt="" /></div>
      <div className="card-label">{label}</div>
      <div className={`card-value${valueClass ? ` ${valueClass}` : ''}`}>{value}</div>
      <div className="stat-sub">{sub}</div>
      {extra}
    </>
  );
  return onClick
    ? <button type="button" className={`card stat-card stat-card-link ${className}`} onClick={onClick}>{body}</button>
    : <div className={`card stat-card ${className}`}>{body}</div>;
}

// Weekly averages as a tiny line; the last point marked
function Sparkline({ values, tone }: { values: number[]; tone: string }) {
  const [ref, pending] = useDrawOnView<SVGSVGElement>();
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [i / (values.length - 1) * 100, 4 + (1 - (v - min) / span) * 32]);
  return (
    <svg ref={ref} className={`stat-spark tone-${tone}${pending ? ' draw-pending' : ''}`} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline data-draw points={pts.map(p => p.join(',')).join(' ')} />
      <circle data-draw-dot cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="3" />
    </svg>
  );
}

// Weights use a Polish decimal comma without a trailing ",0" (94,3 / 91), like "Moja waga"
const fmtNum = (v: number) => v.toLocaleString('pl-PL', { maximumFractionDigits: 1 });
const fmtChange = (d: number) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${fmtNum(Math.abs(d))} kg`;

export default function Dashboard() {
  const [data, setData]   = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const workoutLabel = (n: number) => plural(n, t('workouts_1'), t('workouts_2_4'), t('workouts_5plus'));
  const weekLabel = (n: number) => plural(n, t('weeks_streak_1'), t('weeks_streak_2_4'), t('weeks_streak_5plus'));

  useEffect(() => {
    dashboardApi.get().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLoader />;

  const d = data!;
  const hasAnything = d.has_plan || d.quick_stats.this_year > 0 || d.workout_calendar.length > 0 || d.weight_panel;
  const w = d.weight_panel;
  const goalLabel = w?.goal === 'cut' ? t('goal_cut') : w?.goal === 'bulk' ? t('goal_bulk') : null;
  const weightTone = w?.change != null ? trendTone(w.change, w.goal) : 'neutral';
  // Streak progress towards the next multiple of 4 weeks
  const streakGoal = Math.max(4, Math.ceil((d.streak + 1) / 4) * 4);

  const month = <StatCard icon="/icons/stat-month.png" iconClass="green"
    label={t('stat_this_month')} value={<AnimatedValue value={d.quick_stats.this_month} format={String} decimals={0} />} sub={workoutLabel(d.quick_stats.this_month)} />;
  const year = <StatCard icon="/icons/stat-year.png" iconClass="amber"
    label={t('stat_this_year')} value={<AnimatedValue value={d.quick_stats.this_year} format={String} decimals={0} />} sub={workoutLabel(d.quick_stats.this_year)} />;
  const streak = <StatCard icon="/icons/stat-streak.png" iconClass="red" className="stat-streak"
    label={t('stat_streak')} value={<AnimatedValue value={d.streak} format={String} decimals={0} />} sub={weekLabel(d.streak)}
    extra={(
      <div className="stat-flame">
        <span className="plan-progress-bar"><span style={{ width: `${(d.streak / streakGoal) * 100}%` }} /></span>
        <small>{t('streak_goal').replace('{n}', String(streakGoal))}</small>
      </div>
    )} />;
  // Total change since the start of the cycle: current week average − week 1 average
  const weight = <StatCard icon="/icons/stat-weight-transparent.png" iconClass="indigo" className="stat-weight"
    label={goalLabel ? `${t('weight_label')} · ${goalLabel}` : t('weight_label')}
    value={<AnimatedValue value={w?.change ?? null} format={fmtChange} />}
    valueClass={w?.change != null ? `tone-${weightTone}` : undefined}
    sub={w?.current_week_avg != null
      ? t('weight_tile_current_avg').replace('{kg}', `${fmtNum(w.current_week_avg)} kg`)
      : t('weight_tile_empty')}
    extra={<Sparkline values={w?.weekly_avgs ?? []} tone={weightTone} />}
    onClick={() => navigate('/weight')} />;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('dashboard_title')}</h1>
          <p className="page-subtitle">{t('dashboard_subtitle')}</p>
        </div>
      </div>

      {!hasAnything && (
        <div className="card" style={{ textAlign:'center', padding:'56px 32px' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🏋️</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text-heading)', marginBottom:8 }}>{t('dashboard_welcome_title')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24, maxWidth:360, margin:'0 auto 24px' }}>
            {t('dashboard_welcome_body')}
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/create-plan')}>
            {t('dashboard_create_first_plan')}
          </button>
        </div>
      )}

      {/* Mosaic: calendar as the big card, weight (sparkline) and streak beside it, month/year below */}
      {hasAnything && (
        <div className="stats-mosaic">
          <WorkoutCalendar workouts={d.workout_calendar} className="stats-cal" />
          {weight}
          {streak}
          {month}
          {year}
        </div>
      )}
    </div>
  );
}
