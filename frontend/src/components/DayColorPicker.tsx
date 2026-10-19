import { useEffect, useRef, useState } from 'react';
import { Check, Dumbbell } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationMap } from '../i18n/translations';
import { DAY_COLORS, type DayColor } from '../utils/dayColors';

const POPOVER_W = 228; // 5 × 36px swatches + gaps + padding
const POPOVER_H = 104;
const MARGIN = 8;

// Day icon tile that opens a colour popover; the popover stays inside the viewport
export default function DayColorPicker({ color, onChange }: { color: DayColor; onChange: (c: DayColor) => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; above: boolean }>({ left: 0, above: false });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r && !open) {
      const overflowRight = r.left + POPOVER_W - (window.innerWidth - MARGIN);
      const above = window.innerHeight - r.bottom < POPOVER_H + MARGIN && r.top > POPOVER_H + MARGIN;
      setPos({ left: overflowRight > 0 ? -Math.min(overflowRight, r.left - MARGIN) : 0, above });
    }
    setOpen(o => !o);
  };

  return (
    <div className="day-color-picker" ref={ref}>
      <button type="button" className={`day-color-tile day-color-${color}`} onClick={toggle}
        aria-label={t('day_color_label')} aria-haspopup="true" aria-expanded={open}>
        <Dumbbell size={16} />
      </button>
      {open && (
        <div className={`day-color-popover${pos.above ? ' above' : ''}`} style={{ left: pos.left }} role="listbox" aria-label={t('day_color_label')}>
          {DAY_COLORS.map(c => (
            <button key={c} type="button" role="option" aria-selected={c === color}
              className={`day-color-swatch day-color-${c}${c === color ? ' selected' : ''}`}
              title={t(`color_${c}` as keyof TranslationMap)} aria-label={t(`color_${c}` as keyof TranslationMap)}
              onClick={() => { onChange(c); setOpen(false); }}>
              {c === color && <Check size={16} strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
