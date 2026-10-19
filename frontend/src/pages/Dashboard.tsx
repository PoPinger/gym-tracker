import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { trendTone } from '../utils/weightTrend';
import { plural } from '../utils/plural';
import { useLanguage } from '../i18n/LanguageContext';
import WorkoutCalendar from '../components/WorkoutCalendar';
import AppLoader from '../components/AppLoader';
import type { DashboardData } from '../types';

function StatCard({ icon, iconClass, label, value, sub, valueClass, onClick }: {
  icon: string; iconClass: string; label: string; value: string | number; sub: string;
  valueClass?: string; onClick?: () => void;
}) {
  const body = (
    <>
      <div className={`stat-icon ${iconClass}`}><img className="stat-icon-img" src={icon} alt="" /></div>
      <div className="card-label">{label}</div>
      <div className={`card-value${valueClass ? ` ${valueClass}` : ''}`}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </>
  );
  return onClick
    ? <button type="button" className="card stat-card stat-card-link" onClick={onClick}>{body}</button>
    : <div className="card stat-card">{body}</div>;
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

      {hasAnything && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <WorkoutCalendar workouts={d.workout_calendar} />

          <div className="stats-grid">
            <StatCard icon="/icons/stat-month.png" iconClass="green"
              label={t('stat_this_month')} value={d.quick_stats.this_month} sub={workoutLabel(d.quick_stats.this_month)} />
            <StatCard icon="/icons/stat-year.png" iconClass="amber"
              label={t('stat_this_year')} value={d.quick_stats.this_year} sub={workoutLabel(d.quick_stats.this_year)} />
            <StatCard icon="/icons/stat-streak.png" iconClass="red"
              label={t('stat_streak')} value={d.streak} sub={weekLabel(d.streak)} />
            {/* Total change since the start of the cycle: current week average − week 1 average */}
            <StatCard icon="/icons/stat-weight-transparent.png" iconClass="indigo"
              label={goalLabel ? `${t('weight_label')} · ${goalLabel}` : t('weight_label')}
              value={w?.change != null ? fmtChange(w.change) : '—'}
              valueClass={w?.change != null ? `tone-${trendTone(w.change, w.goal)}` : undefined}
              sub={w?.current_week_avg != null
                ? t('weight_tile_current_avg').replace('{kg}', `${fmtNum(w.current_week_avg)} kg`)
                : t('weight_tile_empty')}
              onClick={() => navigate('/weight')} />
          </div>
        </div>
      )}
    </div>
  );
}
