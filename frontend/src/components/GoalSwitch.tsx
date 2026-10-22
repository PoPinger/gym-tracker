import { useLanguage } from '../i18n/LanguageContext';
import type { WeightGoal } from '../utils/weightTrend';

// Small segmented toggle to change the cycle goal without resetting it; onPick fires on every click
// (also on the selected option), onChange only when the goal changes
export default function GoalSwitch({ goal, onChange, onPick, disabled }: {
  goal: string | null; onChange: (g: WeightGoal) => void; onPick?: (g: WeightGoal) => void; disabled?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={`goal-switch${goal ? '' : ' unset'}`} role="radiogroup" aria-label={t('goal_label')}>
      {(['bulk', 'cut'] as const).map(g => (
        <button key={g} type="button" role="radio" aria-checked={goal === g} disabled={disabled}
          className={goal === g ? 'selected' : ''} onClick={() => { onPick?.(g); if (goal !== g) onChange(g); }}>
          {g === 'bulk' ? t('goal_bulk') : t('goal_cut')}
        </button>
      ))}
    </div>
  );
}
