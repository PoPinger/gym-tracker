import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationMap } from '../i18n/translations';
import type { CalendarWorkout } from '../types';
import { toIsoDate, todayIso } from '../utils/date';

export default function WorkoutCalendar({ workouts }: { workouts: CalendarWorkout[] }) {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [month, setMonth]   = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [active, setActive] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map: Record<string, CalendarWorkout[]> = {};
    for (const w of workouts) (map[w.date] ??= []).push(w);
    return map;
  }, [workouts]);

  const year = month.getFullYear();
  const m    = month.getMonth();
  const lead = (new Date(year, m, 1).getDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, m, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);

  const today = todayIso();
  const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  const shift = (delta: number) => { setActive(null); setMonth(new Date(year, m + delta, 1)); };

  const open = (w: CalendarWorkout) =>
    navigate('/plans', { state: { openDay: { planId: w.plan_id, weekId: w.week_id, planDayId: w.plan_day_id, logId: w.log_id } } });

  // Touch devices: first tap shows the tooltip, second tap opens the day
  const onCellClick = (iso: string) => {
    const list = byDate[iso];
    if (!list) { setActive(active === iso ? null : iso); return; }
    if (canHover || active === iso) open(list[0]);
    else setActive(iso);
  };

  return (
    <div className="card">
      <div className="cal-header">
        <div className="card-label" style={{ marginBottom:0 }}>{t('calendar_title')}</div>
        <div className="cal-nav">
          <button className="btn btn-ghost btn-xs" onClick={() => shift(-1)} aria-label={t('calendar_prev')}>
            <ChevronLeft size={16} />
          </button>
          <span className="cal-month">{t(`month_${m + 1}` as keyof TranslationMap)} {year}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => shift(1)} aria-label={t('calendar_next')}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="cal-grid">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="cal-weekday">{t(`weekday_short_${i}` as keyof TranslationMap)}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-cell cal-empty" />;
          const iso   = toIsoDate(d);
          const list  = byDate[iso] ?? [];
          const level = list.length >= 2 ? 'cal-l2' : list.length === 1 ? 'cal-l1' : '';
          const col   = i % 7;
          const align = col < 2 ? 'cal-tip-left' : col > 4 ? 'cal-tip-right' : '';
          const label = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'pl-PL', { day:'numeric', month:'long', year:'numeric' });
          return (
            <button key={i} type="button"
              className={`cal-cell ${level} ${iso === today ? 'cal-today' : ''} ${active === iso ? 'cal-active' : ''}`}
              onClick={() => onCellClick(iso)}
              aria-label={[label, ...list.map(w => w.day_name)].join(', ')}>
              <span className={`cal-tip ${align}`}>
                <strong>{label}</strong>
                {list.map(w => <span key={w.log_id}>{w.day_name}</span>)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
