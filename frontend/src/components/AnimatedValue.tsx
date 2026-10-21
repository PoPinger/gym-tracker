// A progress value that counts up from 0 and slides in (up if positive, down if negative)
// the first time it comes into view. Later changes (typing, saving) show immediately.
// A hidden copy of the final text reserves the width, so counting never shifts the layout.
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, useFirstInView } from '../hooks/useFirstInView';

const DURATION = 1400;
const easeOut = (p: number) => 1 - (1 - p) ** 3;

type Phase = 'wait' | 'run' | 'done';

export default function AnimatedValue({ value, format, decimals = 1, empty = '—' }: {
  value: number | null; format: (n: number) => string; decimals?: number; empty?: string;
}) {
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? 'done' : 'wait'));
  const [shown, setShown] = useState(0);
  const latest = useRef(value);
  const raf = useRef(0);
  useEffect(() => { latest.current = value; });
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // Decided once, at the first view: count a number up, leave "—" as it is
  const ref = useFirstInView<HTMLSpanElement>(() => {
    const to = latest.current;
    if (prefersReducedMotion() || to == null) { setPhase('done'); return; }
    const f = 10 ** decimals, t0 = performance.now();
    setPhase('run');
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION);
      if (p >= 1 || latest.current !== to) { setPhase('done'); return; } // finished, or changed mid-count: show the final value
      setShown(Math.round(to * easeOut(p) * f) / f);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  });

  const text = (n: number | null) => (n == null ? empty : format(n));
  const live = phase === 'done' ? text(value) : phase === 'run' ? text(shown) : text(value == null ? null : 0);
  const dir = value == null || value === 0 ? '' : value > 0 ? ' av-up' : ' av-down';

  return (
    <span ref={phase === 'done' ? undefined : ref} className={`av av-${phase}${dir}`}>
      <span className="av-ghost" aria-hidden="true">{text(value)}</span>
      <span className="av-live">{live}</span>
    </span>
  );
}
