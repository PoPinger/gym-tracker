// Kulka on the "Moja waga" chart: once the line has finished drawing, appears on the first point and
// follows the real trend point to point (slides down a drop, climbs a rise, walks a flat part),
// then idles on the last point. Positions are in % of the plot box, like the chart's dots.
import { useEffect, useRef, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import { prefersReducedMotion } from '../../hooks/useFirstInView';

export interface RiderPoint { x: number; y: number; kg: number }

const FLAT_KG = 0.2; // smaller weekly changes count as flat
const MOVES = {
  slide: { ms: 750, easing: 'ease-in' },
  climb: { ms: 1300, easing: 'linear' },
  walk: { ms: 900, easing: 'linear' },
} as const;

export default function WeightRider({ pts, drawn }: { pts: RiderPoint[]; drawn: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MascotState>('idle');
  const [reduced] = useState(prefersReducedMotion);
  const ptsRef = useRef(pts);

  useEffect(() => {
    const el = ref.current;
    const route = ptsRef.current;
    if (!drawn || reduced || !el?.animate || route.length < 2) return;
    let cancelled = false;
    const anims: Animation[] = [];
    (async () => {
      await new Promise(r => window.setTimeout(r, 450)); // a moment on the first point
      for (let k = 1; k < route.length && !cancelled; k++) {
        const a = route[k - 1], b = route[k], d = b.kg - a.kg;
        const m = d <= -FLAT_KG ? 'slide' : d >= FLAT_KG ? 'climb' : 'walk';
        setMode(m);
        const anim = el.animate(
          [{ left: `${a.x}%`, top: `${a.y}%` }, { left: `${b.x}%`, top: `${b.y}%` }],
          { duration: MOVES[m].ms, easing: MOVES[m].easing, fill: 'forwards' });
        anims.push(anim);
        try { await anim.finished; } catch { return; }
      }
      if (!cancelled) setMode('idle');
    })();
    return () => { cancelled = true; anims.forEach(a => a.cancel()); };
  }, [drawn, reduced]);

  if (!drawn || pts.length < 2) return null;
  // Reduced motion: no travel, Kulka simply stands on the last point
  const start = reduced ? pts[pts.length - 1] : pts[0];
  return (
    <div ref={ref} className="m-rider" style={{ left: `${start.x}%`, top: `${start.y}%` }}>
      <Mascot size={34} state={mode} className="m-rider-pop" />
    </div>
  );
}
