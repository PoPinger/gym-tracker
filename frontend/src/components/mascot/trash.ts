// Timing shared by the delete/reset dialogs (ConfirmDialog with `trash`) and their callers
import { prefersReducedMotion } from '../../hooks/useFirstInView';

export type TrashPhase = 'open' | 'cancel' | 'confirm';

export const TRASH_MS = 800;
// Resolves when the closing animation is over; await it together with the action, never before it
export const trashDelay = () => new Promise<void>(r => window.setTimeout(r, prefersReducedMotion() ? 0 : TRASH_MS));
