// Confirmation dialog. With `trash` (delete/reset confirmations) Kulka stands on it next to a trash can:
// cancel plays a short animation before onCancel, confirm calls onOk right away (the caller closes the
// dialog after awaiting the action together with trashDelay()).
import { useEffect, useRef, useState } from 'react';
import TrashKulka from './mascot/TrashKulka';
import { TRASH_MS, type TrashPhase } from './mascot/trash';
import { prefersReducedMotion } from '../hooks/useFirstInView';

export default function ConfirmDialog({ title, body, onOk, onCancel, okLabel, cancelLabel, okClass = 'btn-primary', trash = false }: {
  title: string; body: string; onOk: () => void; onCancel: () => void;
  okLabel: string; cancelLabel: string; okClass?: string; trash?: boolean;
}) {
  const [phase, setPhase] = useState<TrashPhase>('open');
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // A second click while animating is ignored; cancel still works after a confirm (e.g. the request failed)
  const cancel = () => {
    if (phase === 'cancel') return;
    if (!trash || prefersReducedMotion()) { onCancel(); return; }
    setPhase('cancel');
    timer.current = window.setTimeout(onCancel, TRASH_MS);
  };
  const ok = () => {
    if (phase !== 'open') return;
    if (trash) setPhase('confirm');
    onOk();
  };

  return (
    <div className="modal-overlay">
      <div className={`modal${trash ? ' has-mascot' : ''}`}>
        {trash && <TrashKulka phase={phase} />}
        <div className="modal-title">{title}</div>
        <p className="modal-body">{body}</p>
        <div className="modal-actions">
          <button className="btn btn-outline btn-sm" onClick={cancel}>{cancelLabel}</button>
          <button className={`btn ${okClass} btn-sm`} onClick={ok}>{okLabel}</button>
        </div>
      </div>
    </div>
  );
}
