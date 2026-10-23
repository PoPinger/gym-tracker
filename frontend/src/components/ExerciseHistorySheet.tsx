// "Historia ćwiczenia": bottom sheet with the e1RM per week (Epley, drawn like the other charts) and every logged week.
// Deload and skipped weeks are marked and never count as the best week.
import { useEffect, useState } from 'react';
import { History, StickyNote, X } from 'lucide-react';
import { exercisesApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useDrawOnView } from '../hooks/useDrawOnView';
import { exerciseScore, firstWeight, formatKg } from '../utils/progress';
import type { ExerciseHistory, ExerciseHistoryEntry } from '../types';

type Point = { e: ExerciseHistoryEntry; score: number };

const fmtDate = (iso: string, lang: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'en' ? 'en-US' : 'pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });

function Chart({ points, best }: { points: Point[]; best: Point | null }) {
  const { t, lang } = useLanguage();
  const [ref, pending] = useDrawOnView<HTMLDivElement>();
  const scores = points.map(p => p.score);
  const min = Math.min(...scores), max = Math.max(...scores), span = max - min || 1;
  // Percent coordinates, shared by the stretched line and the round HTML dots over it
  const xy = points.map((p, i) => [points.length > 1 ? i / (points.length - 1) * 100 : 50, 8 + (1 - (p.score - min) / span) * 84]);
  return (
    <div className="hist-chart-wrap">
      <div className="hist-chart-axis"><span>{formatKg(Math.round(max * 10) / 10, lang)}</span><span>{formatKg(Math.round(min * 10) / 10, lang)}</span></div>
      <div ref={ref} className={`hist-chart${pending ? ' draw-pending' : ''}`} role="img" aria-label={t('history_chart_label')}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {points.length > 1 && <polyline data-draw points={xy.map(p => p.join(',')).join(' ')} />}
        </svg>
        {points.map((p, i) => (
          <span key={p.e.exercise_log_id} data-draw-dot className={`hist-dot${p.e.is_deload ? ' deload' : ''}${p === best ? ' best' : ''}`}
            style={{ left: `${xy[i][0]}%`, top: `${xy[i][1]}%` }}>
            {p === best && <span className={`hist-best-tag${xy[i][0] > 80 ? ' edge-r' : xy[i][0] < 20 ? ' edge-l' : ''}`}>{t('history_best')}</span>}
          </span>
        ))}
      </div>
      <div className="hist-chart-caption">{t('history_chart_label')}</div>
    </div>
  );
}

export default function ExerciseHistorySheet({ exerciseId, name, onClose }: { exerciseId: number; name: string; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const [allPlans, setAllPlans] = useState(false);
  const [data, setData] = useState<ExerciseHistory | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    exercisesApi.history(exerciseId, allPlans)
      .then(r => { if (live) setData(r.data); })
      .catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [exerciseId, allPlans]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleAllPlans = () => { setAllPlans(v => !v); setData(null); setError(false); };

  const entries = data?.entries ?? [];
  const points: Point[] = entries.filter(e => !e.skipped)
    .map(e => ({ e, score: exerciseScore(e.sets) }))
    .filter((p): p is Point => p.score != null);
  const best = points.filter(p => !p.e.is_deload).reduce<Point | null>((b, p) => (!b || p.score > b.score ? p : b), null);
  const showPlan = allPlans && new Set(entries.map(e => e.plan_id)).size > 1;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="hist-title" onClick={e => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <span className="hist-icon"><History size={18} /></span>
          <div>
            <h2 id="hist-title">{t('history_title')}</h2>
            <p>{name}</p>
          </div>
          <button type="button" className="sheet-close" aria-label={t('history_close')} onClick={onClose}><X size={18} /></button>
        </div>

        {data?.has_other_plans && (
          <button type="button" role="switch" aria-checked={allPlans} className={`wl-switch${allPlans ? ' on' : ''}`} onClick={toggleAllPlans}>
            <span className="wl-switch-track"><span /></span>{t('history_all_plans')}
          </button>
        )}

        {error ? <div className="alert alert-error">{t('history_error')}</div> : !data ? <div className="hist-loading" /> : (
          <>
            {data.notes.map(n => (
              <div key={n.plan_id} className="hist-note"><StickyNote size={14} />
                <span>{data.notes.length > 1 && <b>{n.plan_name}: </b>}{n.note}</span></div>
            ))}
            {points.length > 0 && <Chart key={String(allPlans)} points={points} best={best} />}
            {entries.length === 0 ? <div className="hist-empty">{t('history_empty')}</div> : (
              <ul className="hist-list">
                {[...entries].reverse().map(e => {
                  const w = firstWeight(e.sets);
                  return (
                    <li key={e.exercise_log_id} className={`hist-row${e.is_deload ? ' deload' : ''}${e.skipped ? ' skipped' : ''}`}>
                      <div className="hist-row-head">
                        <span className="hist-date">{e.workout_date ? fmtDate(e.workout_date, lang) : t('history_no_date')}</span>
                        <span className="hist-week">{t('week_tile_label')} {e.week_number}{showPlan && ` · ${e.plan_name}`}</span>
                        {e.is_deload && <span className="deload-badge">{t('deload_badge')}</span>}
                        {e.skipped && <span className="status-pill skipped">{t('exercise_skipped_label')}</span>}
                      </div>
                      <div className="hist-row-body">
                        <span className="hist-weight">{w != null ? formatKg(w, lang) : '—'}</span>
                        <span className="hist-sets">
                          {e.sets.map(s => (
                            <span key={s.set_number} className="hist-set">{s.reps ?? '—'}{s.rir != null && <small>{t('wl_rir_short')} {s.rir}</small>}</span>
                          ))}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
