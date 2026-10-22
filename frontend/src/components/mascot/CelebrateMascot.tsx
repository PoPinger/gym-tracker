// Kulka on the week days view after finishing a day: jumps for joy with a small confetti burst, then the
// "workout done" curls; after finishing the whole week: jumps longer (the page adds the big confetti over
// the day list), then idles happily. Reduced motion: static happy pose, no confetti.
import { useEffect, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import Confetti from './Confetti';
import { prefersReducedMotion } from '../../hooks/useFirstInView';

const JOY_DAY_MS = 1500;
const JOY_WEEK_MS = 2500;

export default function CelebrateMascot({ week = false, size = 52 }: { week?: boolean; size?: number }) {
  const [reduced] = useState(prefersReducedMotion);
  const [state, setState] = useState<MascotState>(reduced ? 'happy' : 'progressUp');
  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setState(week ? 'happy' : 'done'), week ? JOY_WEEK_MS : JOY_DAY_MS);
    return () => window.clearTimeout(t);
  }, [reduced, week]);
  return (
    <span className="m-celebrate">
      <Mascot size={size} state={state} />
      {!week && <Confetti />}
    </span>
  );
}
