import { ChevronRight, ClipboardList } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { resolveDayColor, type DayColor } from '../utils/dayColors';
import { plural } from '../utils/plural';
import DayColorPicker from './DayColorPicker';

interface DayListDay { day_name: string; color?: string | null; exercises: unknown[]; }

// Compact list of training days: colour icon, inline name editing, exercise count pill
export default function DayList({ days, planName, onPlanNameChange, onDayNameChange, onDayColorChange, onOpenExercises }: {
  days: DayListDay[];
  planName?: string;
  onPlanNameChange?: (name: string) => void;
  onDayNameChange: (index: number, name: string) => void;
  onDayColorChange: (index: number, color: DayColor) => void;
  onOpenExercises: (index: number) => void;
}) {
  const { t } = useLanguage();
  const exLabel = (n: number) =>
    n > 0 ? `${n} ${plural(n, t('exercise_singular'), t('exercises_2_4'), t('exercises_plural'))}` : t('add_exercises_btn');

  return (
    <div className="day-list">
      {onPlanNameChange && (
        <div className="day-list-row day-list-row-name">
          <span className="day-list-icon"><ClipboardList size={16} /></span>
          <label className="day-list-field">
            <span className="day-list-label">{t('plan_name_label')}</span>
            <input className="day-list-input" value={planName ?? ''}
              onChange={e => onPlanNameChange(e.target.value)} placeholder={t('plan_name_placeholder')} />
          </label>
        </div>
      )}
      <div className="day-list-section">{t('training_days_section')} · {days.length}</div>
      {days.map((day, i) => (
        <div key={i} className="day-list-row">
          <DayColorPicker color={resolveDayColor(day.color, i)} onChange={c => onDayColorChange(i, c)} />
          <label className="day-list-field">
            <span className="day-list-label">{t('day_number_fallback')} {i + 1}</span>
            <input className="day-list-input" value={day.day_name}
              onChange={e => onDayNameChange(i, e.target.value)}
              placeholder={`${t('day_name_placeholder')} ${i + 1}`} />
          </label>
          <button type="button" className={`day-list-pill${day.exercises.length ? '' : ' empty'}`} onClick={() => onOpenExercises(i)}>
            {exLabel(day.exercises.length)} <ChevronRight size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
