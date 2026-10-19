import { useLanguage } from '../i18n/LanguageContext';
import type { WeightGoal } from '../utils/weightTrend';

// Small segmented toggle to change the cycle goal without resetting it
export default function GoalSwitch({ goal, onChange, disabled }: {
  goal: string | null; onChange: (g: WeightGoal) => void; disabled?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={`goal-switch${goal ? '' : ' unset'}`} role="radiogroup" aria-label={t('goal_label')}>
      {(['bulk', 'cut'] as const).map(g => (
        <button key={g} type="button" role="radio" aria-checked={goal === g} disabled={disabled}
          className={goal === g ? 'selected' : ''} onClick={() => goal !== g && onChange(g)}>
          {g === 'bulk' ? t('goal_bulk') : t('goal_cut')}
        </button>
      ))}
    </div>
  );
}
