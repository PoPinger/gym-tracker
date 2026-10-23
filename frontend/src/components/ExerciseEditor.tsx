// Exercise editor of a training day: compact rows (number, name, muscle chip, "3 × 6–8"),
// one row expanded at a time for editing. Accented with the day's colour. Saved exercises open their history.
import { useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Dumbbell, History, Minus, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { MUSCLE_GROUP_TO_KEY } from '../i18n/translations';
import { MUSCLE_GROUPS } from '../types';
import { plural } from '../utils/plural';
import { isValidRepRange } from '../utils/repRange';
import { clampRest, formatRest, REST_MAX, REST_MIN, REST_STEP } from '../utils/rest';
import type { DayColor } from '../utils/dayColors';
import CraneKulka, { type EditorCue } from './mascot/CraneKulka';
import { kulkaDelay, WIPE_MS } from './mascot/trash';
import ExerciseHistorySheet from './ExerciseHistorySheet';

export interface ExerciseDraft { id?: number; name: string; muscle_group: string; sets: number; rep_min: string; rep_max: string; rest_seconds: number; }
type Field = 'name' | 'muscle_group' | 'sets' | 'rep_min' | 'rep_max' | 'rest_seconds';

type T = ReturnType<typeof useLanguage>['t'];
const muscleLabel = (t: T, g: string) => t(MUSCLE_GROUP_TO_KEY[g] ?? 'muscle_chest');
const rangeText = (ex: ExerciseDraft) =>
  ex.rep_min !== '' && ex.rep_max !== '' ? (ex.rep_min === ex.rep_max ? ex.rep_min : `${ex.rep_min}–${ex.rep_max}`) : null;
// "3 × 6–8", or "3 serie" without a range
const summary = (t: T, ex: ExerciseDraft) => {
  const r = rangeText(ex);
  return r ? `${ex.sets} × ${r}` : `${ex.sets} ${plural(ex.sets, t('sets_1'), t('sets_2_4'), t('sets_5plus'))}`;
};

function SetsStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { t } = useLanguage();
  return (
    <span className="exed-stepper">
      <button type="button" aria-label={t('sets_decrease')} disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))}><Minus size={15} /></button>
      <strong>{value}</strong>
      <button type="button" aria-label={t('sets_increase')} disabled={value >= 10} onClick={() => onChange(Math.min(10, value + 1))}><Plus size={15} /></button>
    </span>
  );
}

// Rest between sets: 0:30–5:00 in 15 s steps
function RestStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { t } = useLanguage();
  return (
    <span className="exed-stepper exed-rest">
      <button type="button" aria-label={t('rest_decrease')} disabled={value <= REST_MIN} onClick={() => onChange(clampRest(value - REST_STEP))}><Minus size={15} /></button>
      <strong>{formatRest(value)}</strong>
      <button type="button" aria-label={t('rest_increase')} disabled={value >= REST_MAX} onClick={() => onChange(clampRest(value + REST_STEP))}><Plus size={15} /></button>
    </span>
  );
}

export default function ExerciseEditor({ dayName, color, exercises, onChange, onMove, onRemove, onAdd, onDone, onBack }: {
  dayName: string; color: DayColor; exercises: ExerciseDraft[];
  onChange: (ei: number, field: Field, val: string | number) => void;
  onMove: (ei: number, dir: -1 | 1) => void; onRemove: (ei: number) => void;
  onAdd: () => void; onDone: () => void; onBack: () => void;
}) {
  const { t } = useLanguage();
  const n = exercises.length;

  // One row open at a time; it follows its exercise through moves and deletes
  const [open, setOpen] = useState<number | null>(null);
  const focusNew = useRef(false);
  // Kulka reacts to each action after it has happened; "Gotowe" leaves once he has wiped his sweat
  const [cue, setCue] = useState<EditorCue | null>(null);
  const nudge = (kind: EditorCue['kind'], index: number) => setCue(c => ({ kind, index, seq: (c?.seq ?? 0) + 1 }));
  const leaving = useRef(false);
  const [history, setHistory] = useState<{ id: number; name: string } | null>(null);
  const move = (ei: number, dir: -1 | 1) => { onMove(ei, dir); setOpen(o => o === ei ? ei + dir : o === ei + dir ? ei : o); nudge(dir < 0 ? 'up' : 'down', ei + dir); };
  const remove = (ei: number) => { onRemove(ei); setOpen(o => o == null || o === ei ? null : o > ei ? o - 1 : o); nudge('remove', ei); };
  const add = () => { onAdd(); setOpen(n); focusNew.current = true; nudge('add', n); };
  const done = () => {
    if (leaving.current) return;
    leaving.current = true;
    nudge('done', 0);
    void kulkaDelay(WIPE_MS).then(onDone);
  };

  return (
    <div className={`exed has-crane day-color-${color}`} style={{ maxWidth: 720 }}>
      <CraneKulka cue={cue} />
      <button className="back-btn" onClick={onBack}><ArrowLeft size={15} /> {t('back_to_days')}</button>
      <div className="page-header exed-header">
        <span className="exed-day-icon"><Dumbbell size={20} /></span>
        <div>
          <h1 className="page-title">{dayName}</h1>
          <p className="page-subtitle">{t('edit_exercises_subtitle')} · {n} {plural(n, t('exercise_singular'), t('exercises_2_4'), t('exercises_plural'))}</p>
        </div>
      </div>

      {n === 0 ? <div className="exed-empty">{t('no_exercises_empty')}</div> : (
        <div className="day-list exed-list">
          {exercises.map((ex, ei) => {
            const isOpen = open === ei;
            const rangeOk = isValidRepRange(ex.rep_min, ex.rep_max);
            return (
              <div key={ei} className={`exed-item${isOpen ? ' open' : ''}`}>
                <button type="button" className="exed-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : ei)}>
                  <span className="exed-num">{ei + 1}</span>
                  <span className="exed-main">
                    <span className={`exed-name${ex.name.trim() ? '' : ' empty'}`}>{ex.name.trim() || t('ex_unnamed')}</span>
                    <span className="exed-chip">{muscleLabel(t, ex.muscle_group)}</span>
                  </span>
                  <span className={`exed-sum${rangeOk ? '' : ' invalid'}`}>{summary(t, ex)}</span>
                  <ChevronDown size={16} className="exed-chev" />
                </button>
                {isOpen && (
                  <div className="exed-body">
                    <input className="form-input" placeholder={t('exercise_name_edit_placeholder')} value={ex.name}
                      ref={el => { if (el && focusNew.current) { focusNew.current = false; el.focus(); } }}
                      onChange={e => onChange(ei, 'name', e.target.value)} />
                    <select className="form-select" value={ex.muscle_group} aria-label={t('ex_col_muscle')}
                      onChange={e => onChange(ei, 'muscle_group', e.target.value)}>
                      {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{muscleLabel(t, g)}</option>)}
                    </select>
                    <div className="exed-fields">
                      <label>
                        <span className="day-list-label">{t('ex_col_sets')}</span>
                        <SetsStepper value={ex.sets} onChange={v => onChange(ei, 'sets', v)} />
                      </label>
                      <label>
                        <span className="day-list-label">{t('ex_col_range')}</span>
                        <span className={`exed-range${rangeOk ? '' : ' invalid'}`}>
                          <input type="number" inputMode="numeric" min={1} max={100} step={1} placeholder="min" aria-label={t('rep_min_label')}
                            value={ex.rep_min} onChange={e => onChange(ei, 'rep_min', e.target.value)} />
                          <span>–</span>
                          <input type="number" inputMode="numeric" min={1} max={100} step={1} placeholder="max" aria-label={t('rep_max_label')}
                            value={ex.rep_max} onChange={e => onChange(ei, 'rep_max', e.target.value)} />
                        </span>
                      </label>
                      <label>
                        <span className="day-list-label">{t('ex_col_rest')}</span>
                        <RestStepper value={ex.rest_seconds} onChange={v => onChange(ei, 'rest_seconds', v)} />
                      </label>
                    </div>
                    <div className="exed-actions">
                      <button type="button" className="btn btn-outline btn-sm" disabled={ei === 0} onClick={() => move(ei, -1)}><ChevronUp size={15} /> {t('move_up')}</button>
                      <button type="button" className="btn btn-outline btn-sm" disabled={ei === n - 1} onClick={() => move(ei, 1)}><ChevronDown size={15} /> {t('move_down')}</button>
                      {ex.id != null && (
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setHistory({ id: ex.id!, name: ex.name.trim() })}><History size={14} /> {t('history_btn')}</button>
                      )}
                      <button type="button" className="btn btn-outline btn-sm btn-danger-outline" onClick={() => remove(ei)}><Trash2 size={14} /> {t('delete_btn')}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button type="button" className="exed-add" onClick={add}><Plus size={16} /> {t('add_exercise_btn')}</button>
      <button className="btn btn-primary exed-done" onClick={done}><CheckCircle2 size={15} /> {t('done_label')}</button>
      {history && <ExerciseHistorySheet exerciseId={history.id} name={history.name} onClose={() => setHistory(null)} />}
    </div>
  );
}
