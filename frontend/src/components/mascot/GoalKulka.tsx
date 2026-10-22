// Kulka on the Masa / Redukcja toggle of "Moja waga", standing on its top edge above the labels. He jumps there
// from the chart when his ride ends (`from`: the rider's last box on screen), or simply stands there when there
// is no ride. Switching to "Masa" inflates him, "Redukcja" stretches him thin (~0.6 s each way with a short hold;
// index.css). Reduced motion: no jump, no shape change.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import { prefersReducedMotion } from '../../hooks/useFirstInView';

const SIZE = 34;
const JUMP_MS = 700;
const SHAPE_MS = 1800; // matches .m-goal-bulk / .m-goal-cut

export default function GoalKulka({ goal, from }: { goal: string | null; from: DOMRect | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [jumping, setJumping] = useState(!!from && !reduced);

  // Shape change on every goal switch (state adjusted during render when the prop changes)
  const [seenGoal, setSeenGoal] = useState(goal);
  const [shape, setShape] = useState<{ goal: string; seq: number } | null>(null);
  if (goal !== seenGoal) {
    setSeenGoal(goal);
    if (goal && !reduced) setShape(s => ({ goal, seq: (s?.seq ?? 0) + 1 }));
  }
  useEffect(() => {
    if (!shape) return;
    const t = window.setTimeout(() => setShape(null), SHAPE_MS);
    return () => window.clearTimeout(t);
  }, [shape]);

  // Jump in an arc from the end of the chart line
  useLayoutEffect(() => {
    const el = ref.current;
    if (!from || reduced || !el) return;
    const r = el.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (r.left + r.width / 2), dy = from.bottom - r.bottom;
    const anim = el.animate([
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: `translate(${dx * 0.5}px, ${Math.min(dy, 0) - 50}px)`, offset: 0.55 },
      { transform: 'none' },
    ], { duration: JUMP_MS, easing: 'ease-in-out' });
    anim.onfinish = () => setJumping(false);
    return () => anim.cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const state: MascotState = jumping ? 'jump' : shape ? (shape.goal === 'bulk' ? 'puff' : 'stretch') : 'idle';
  return (
    <div ref={ref} className="m-goal">
      <Mascot key={shape?.seq ?? 0} size={SIZE} state={state} className={shape ? `m-goal-${shape.goal}` : ''} />
    </div>
  );
}
