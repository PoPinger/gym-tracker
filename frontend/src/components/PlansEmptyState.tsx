import { Plus } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

// Empty "Moje plany": faded preview of plan cards with a single call to action on top
export default function PlansEmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useLanguage();
  const ghost = (dots: string[], extra = '') => (
    <div className={`plans-ghost ${extra}`} aria-hidden="true">
      <div className="plans-ghost-line w40" />
      <div className="plans-ghost-line w60 thin" />
      <div className="plans-ghost-bar"><span /></div>
      <div className="plans-ghost-dots">{dots.map(c => <span key={c} className={`day-color-${c}`} />)}</div>
      <div className="plans-ghost-btns"><span className="primary" /><span /><span /></div>
    </div>
  );

  return (
    <div className="plans-empty">
      {ghost(['indigo', 'green', 'amber'])}
      {ghost(['orange', 'teal', 'pink', 'lime'], 'second')}
      {ghost(['blue', 'red', 'sky'], 'third')}
      <div className="plans-empty-overlay">
        <div className="plans-empty-panel">
          <img className="plans-empty-img" src="/icons/empty-plans-transparent.png" alt="" />
          <h3>{t('no_plans_title')}</h3>
          <p>{t('no_plans_body')}</p>
          <button className="btn btn-primary" onClick={onCreate}><Plus size={16} /> {t('create_first_plan_btn')}</button>
        </div>
      </div>
    </div>
  );
}
