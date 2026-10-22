// Timing shared by the delete/reset dialogs (ConfirmDialog with `trash`) and their callers, and by the
// other short Kulka reactions that play before a view or dialog closes
import { prefersReducedMotion } from '../../hooks/useFirstInView';

export type TrashPhase = 'open' | 'cancel' | 'confirm';

export const TRASH_MS = 800;
export const STAMP_MS = 800; // builder: stamp + thumbs up on save
export const SHRUG_MS = 700; // builder: shrug on cancel
export const WIPE_MS = 700; // exercise editor: wipe + thumbs up on "Gotowe"
// Resolves when the animation is over (immediately with reduced motion); await it together with the action, never before it
export const kulkaDelay = (ms: number) => new Promise<void>(r => window.setTimeout(r, prefersReducedMotion() ? 0 : ms));
export const trashDelay = () => kulkaDelay(TRASH_MS);
