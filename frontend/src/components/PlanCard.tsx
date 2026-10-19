import { useEffect, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronRight, Clock, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { resolveDayColor } from '../utils/dayColors';
import type { PlanSummary } from '../types';

const MENU_H = 100;
const MARGIN = 8;

// Plan card for "Moje plany": progress, day colours and actions.
// Desktop shows all actions in one row; on narrow screens Kopiuj / Usuń move into a "⋯" menu (CSS).
export default function PlanCard({ plan, onOpen, onEdit, onCopy, onDelete }: {
  plan: PlanSummary; onOpen: () => void; onEdit: () => void; onCopy: () => void; onDelete: () => void;
}) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAbove, setMenuAbove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const toggleMenu = () => {
    const r = menuRef.current?.getBoundingClientRect();
    if (r && !menuOpen) setMenuAbove(window.innerHeight - r.bottom < MENU_H + MARGIN && r.top > MENU_H + MARGIN);
    setMenuOpen(o => !o);
  };

  const totalWeeks = plan.months * 4;
  const finished = plan.status === 'completed';
  const pct = totalWeeks ? plan.completed_weeks / totalWeeks : 0;
  const currentWeek = Math.min(plan.completed_weeks + 1, totalWeeks);

  return (
    <div className={`plan-card${finished ? ' finished' : ''}`}>
      <div>
        <div className="plan-card-title">
          <span className="plan-card-name">{plan.name}</span>
          {finished
            ? <span className="badge badge-completed"><CheckCircle2 size={10} /> {t('badge_completed')}</span>
            : <span className="badge badge-active">{t('badge_active')}</span>}
        </div>
        <div className="plan-card-meta">
          <span><CalendarDays size={14} /> {plan.days_per_week} {t('days_per_week_abbr')}</span>
          <span><Clock size={14} /> {plan.months} {t('months_abbr')} · {totalWeeks} {t('weeks_abbr')}</span>
        </div>
      </div>

      <div>
        <div className="plan-progress-top">
          <span>{finished ? t('plan_finished_label') : t('plan_progress_week').replace('{n}', String(currentWeek)).replace('{total}', String(totalWeeks))}</span>
          <strong>{Math.round(pct * 100)}%</strong>
        </div>
        <div className="plan-progress-bar"><span style={{ width: `${pct * 100}%` }} /></div>
      </div>

      {plan.days.length > 0 && (
        <div className="day-dots">
          {plan.days.map((d, i) => (
            <span key={i} className={`day-dot day-color-${resolveDayColor(d.color, i)}`}><span />{d.day_name}</span>
          ))}
        </div>
      )}

      <div className="plan-card-actions">
        <button className="btn btn-primary btn-sm" onClick={onOpen}>{t('open_btn')} <ChevronRight size={14} /></button>
        <button className="btn btn-outline btn-sm" onClick={onEdit}><Pencil size={13} /> {t('edit_btn')}</button>
        <button className="btn btn-outline btn-sm plan-card-wide-only" onClick={onCopy}><Copy size={13} /> {t('copy_btn')}</button>
        <button className="btn btn-outline btn-sm btn-danger-outline plan-card-wide-only" onClick={onDelete}><Trash2 size={13} /> {t('delete_btn')}</button>
        <div className="plan-card-more" ref={menuRef}>
          <button className="btn btn-outline btn-sm" aria-label={t('more_actions')} aria-haspopup="true" aria-expanded={menuOpen} onClick={toggleMenu}>
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className={`plan-card-menu${menuAbove ? ' above' : ''}`} role="menu">
              <button role="menuitem" onClick={() => { setMenuOpen(false); onCopy(); }}><Copy size={14} /> {t('copy_btn')}</button>
              <button role="menuitem" className="danger" onClick={() => { setMenuOpen(false); onDelete(); }}><Trash2 size={14} /> {t('delete_btn')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
