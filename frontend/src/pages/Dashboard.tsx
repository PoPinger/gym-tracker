import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import type { DashboardData } from '../types';
import {
  Flame, TrendingUp, Calendar, Dumbbell, Scale,
  ChevronRight, Activity, Award, BarChart2, Clock
} from 'lucide-react';

function StatCard({ icon, iconClass, label, value, sub }: {
  icon: React.ReactNode; iconClass: string;
  label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData]   = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : 'pl-PL', { day:'numeric', month:'short' }) : '—';

  const workoutLabel = (n: number) => {
    if (n === 1) return t('workouts_1');
    if (n >= 2 && n <= 4) return t('workouts_2_4');
    return t('workouts_5plus');
  };

  const dayLabel = (n: number) => {
    if (n === 1) return t('days_streak_1');
    return t('days_streak_other');
  };

  useEffect(() => {
    dashboardApi.get().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <span className="loading-text">{t('loading_dashboard')}</span>
    </div>
  );

  const d = data!;
  const hasAnything = d.quick_stats.total > 0 || d.current_plan || d.weight_panel;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('dashboard_title')}</h1>
          <p className="page-subtitle">{t('dashboard_subtitle')}</p>
        </div>
        {!d.current_plan && (
          <button className="btn btn-primary" onClick={() => navigate('/create-plan')}>
            <span>{t('dashboard_create_plan')}</span>
            <ChevronRight size={16} />
          </button>
        )}
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

          {/* Stats row */}
          <div className="grid-4">
            <StatCard icon={<Activity size={20} />} iconClass="indigo"
              label={t('stat_this_week')} value={d.quick_stats.this_week}
              sub={workoutLabel(d.quick_stats.this_week)} />
            <StatCard icon={<Calendar size={20} />} iconClass="green"
              label={t('stat_this_month')} value={d.quick_stats.this_month}
              sub={workoutLabel(d.quick_stats.this_month)} />
            <StatCard icon={<BarChart2 size={20} />} iconClass="amber"
              label={t('stat_total')} value={d.quick_stats.total}
              sub={workoutLabel(d.quick_stats.total)} />
            <StatCard icon={<Flame size={20} />} iconClass="red"
              label={t('stat_streak')} value={d.streak}
              sub={dayLabel(d.streak)} />
          </div>

          {/* Plan + Progress */}
          {d.current_plan && (
            <div className="grid-2">
              <div className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <div className="card-label">{t('current_plan_label')}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.3px', marginTop:2 }}>
                      {d.current_plan.name}
                    </div>
                  </div>
                  <span className="badge badge-active">{t('badge_active')}</span>
                </div>

                <div style={{ display:'flex', gap:20, marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-subtle)' }}>{t('week_label')}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:'var(--primary)' }}>
                      {d.current_plan.current_week}<span style={{ fontSize:14, fontWeight:500, color:'var(--text-muted)' }}>/{d.current_plan.total_weeks}</span>
                    </div>
                  </div>
                  {d.current_plan.next_day && (
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-subtle)' }}>{t('next_day_label')}</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'var(--text-heading)', marginTop:2 }}>{d.current_plan.next_day}</div>
                    </div>
                  )}
                </div>

                <button className="btn btn-primary btn-sm" onClick={() => navigate('/plans')}>
                  {t('open_plan')} <ChevronRight size={14} />
                </button>
              </div>

              {d.plan_progress && (
                <div className="card" style={{ display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div>
                    <div className="card-label">{t('plan_progress_label')}</div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:4, marginBottom:16 }}>
                      <span style={{ fontSize:42, fontWeight:900, color:'var(--primary)', letterSpacing:'-1px' }}>
                        {d.plan_progress.percentage}
                      </span>
                      <span style={{ fontSize:20, fontWeight:700, color:'var(--text-muted)' }}>%</span>
                    </div>
                  </div>
                  <div>
                    <div className="progress-track" style={{ height:10, marginBottom:10 }}>
                      <div className="progress-fill" style={{ width:`${d.plan_progress.percentage}%` }} />
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>
                      {d.plan_progress.completed_weeks} {t('of_preposition')} {d.plan_progress.total_weeks} {t('weeks_completed')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last + Next workout */}
          <div className="grid-2">
            <div className="card">
              <div className="card-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Clock size={13} /> {t('last_workout_label')}
              </div>
              {d.last_workout ? (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:4 }}>{d.last_workout.day_name}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>
                    {d.last_workout.plan_name} · {fmt(d.last_workout.date)}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ background:'var(--primary-light)', borderRadius:6, padding:'4px 10px' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--primary)' }}>{d.last_workout.exercise_count}</span>
                      <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:4 }}>{t('exercises_count')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop:8, color:'var(--text-muted)', fontSize:14 }}>{t('no_workouts')}</div>
              )}
            </div>

            <div className="card">
              <div className="card-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Dumbbell size={13} /> {t('next_workout_label')}
              </div>
              {d.next_workout?.day_name ? (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:4 }}>{d.next_workout.day_name}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>{d.next_workout.plan_name}</div>
                  {d.next_workout.preview_exercises.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
                      {d.next_workout.preview_exercises.map((ex, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                          <span style={{ width:18, height:18, background:'var(--bg-subtle)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--text-muted)', flexShrink:0 }}>{i+1}</span>
                          <span style={{ color:'var(--text-body)' }}>{ex.name}</span>
                          <span style={{ color:'var(--text-subtle)' }}>·</span>
                          <span style={{ color:'var(--text-muted)' }}>{ex.sets}×</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="btn btn-success btn-sm" onClick={() => navigate('/plans')}>
                    {t('start_workout')} <ChevronRight size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ marginTop:8, color:'var(--text-muted)', fontSize:14 }}>
                  {d.current_plan ? t('all_caught_up') : t('create_plan_to_start')}
                </div>
              )}
            </div>
          </div>

          {/* Weight + Best progress */}
          <div className="grid-2">
            <div className="card">
              <div className="card-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Scale size={13} /> {t('weight_label')}
              </div>
              {d.weight_panel ? (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:'flex', gap:20, flexWrap:'wrap', marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--text-subtle)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{t('last_entry')}</div>
                      <div style={{ fontSize:26, fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.5px', marginTop:2 }}>
                        {d.weight_panel.last_weight !== null ? `${d.weight_panel.last_weight} kg` : '—'}
                      </div>
                    </div>
                    {d.weight_panel.change_vs_prev_week !== null && (
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-subtle)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{t('vs_prev_week')}</div>
                        <div style={{
                          fontSize:20, fontWeight:800, marginTop:2,
                          color: d.weight_panel.change_vs_prev_week <= 0 ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {d.weight_panel.change_vs_prev_week > 0 ? '+' : ''}{d.weight_panel.change_vs_prev_week} kg
                        </div>
                      </div>
                    )}
                  </div>
                  {d.weight_panel.avg_last_week !== null && (
                    <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>
                      {t('avg_prev_week')}: <strong style={{ color:'var(--text-body)' }}>{d.weight_panel.avg_last_week} kg</strong>
                    </div>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={() => navigate('/weight')}>
                    {t('weight_details')} <ChevronRight size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:12 }}>{t('no_weight_data')}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate('/weight')}>
                    {t('configure_tracking')}
                  </button>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Award size={13} /> {t('best_progress_label')}
              </div>
              {d.best_progress ? (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--text-heading)', marginBottom:4 }}>{d.best_progress.exercise}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>
                    {t('currently')} <strong style={{ color:'var(--text-body)' }}>{d.best_progress.current_weight} kg</strong>
                  </div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--success-light)', borderRadius:10, padding:'8px 14px' }}>
                    <TrendingUp size={18} color="var(--success)" />
                    <span style={{ fontSize:22, fontWeight:900, color:'var(--success)', letterSpacing:'-0.5px' }}>+{d.best_progress.gain_kg} kg</span>
                    <span style={{ fontSize:12, color:'var(--success)', fontWeight:600 }}>{t('weight_gain')}</span>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop:8, color:'var(--text-muted)', fontSize:14 }}>
                  {t('complete_workouts_for_records')}
                </div>
              )}
            </div>
          </div>

          {/* Recent workouts */}
          {d.recent_workouts.length > 0 && (
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div className="card-label" style={{ marginBottom:0 }}>{t('recent_workouts_label')}</div>
                <button className="btn btn-ghost btn-xs" onClick={() => navigate('/plans')}>
                  {t('all_plans')} <ChevronRight size={13} />
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {d.recent_workouts.map((w, i) => (
                  <div key={w.id} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'12px 0',
                    borderBottom: i < d.recent_workouts.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36, height:36, background:'var(--primary-light)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Dumbbell size={16} color="var(--primary)" />
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text-heading)' }}>{w.day_name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{w.plan_name}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-subtle)', fontWeight:500 }}>{fmt(w.date)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
