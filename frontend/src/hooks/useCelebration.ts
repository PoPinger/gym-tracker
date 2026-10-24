import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './useFirstInView';

// Longest a celebration may hold the next screen back
export const CELEBRATION_MAX_MS = 3000;
// How long the finish celebrations play: a day (CelebrateMascot jump + small confetti burst) and a week
// (longer jump + big confetti shower, all landed by ~2.8 s)
export const DAY_CELEBRATION_MS = 1900;
export const WEEK_CELEBRATION_MS = 2800;
// Signed in / registered: Kulka jumps into a pixel hole on the auth sheet (AuthKulka)
export const HOLE_MS = 1300;

// A celebration (Kulka + confetti) that plays in full on the current screen before navigating. The caller
// saves first and starts it only once the save succeeded; then() runs when it has finished, after
// CELEBRATION_MAX_MS at the latest, or at once when skipped (any tap on <CelebrationLayer>).
// Reduced motion: then() runs right away.
export function useCelebration() {
  const [active, setActive] = useState(false);
  const timer = useRef<number>(undefined);
  const next = useRef<(() => void) | null>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const finish = useCallback(() => {
    window.clearTimeout(timer.current);
    const then = next.current;
    next.current = null;
    setActive(false);
    then?.();
  }, []);

  const run = useCallback((ms: number, then: () => void) => {
    if (prefersReducedMotion()) { then(); return; }
    window.clearTimeout(timer.current);
    next.current = then;
    setActive(true);
    timer.current = window.setTimeout(finish, Math.min(ms, CELEBRATION_MAX_MS));
  }, [finish]);

  return { active, run, skip: finish };
}
