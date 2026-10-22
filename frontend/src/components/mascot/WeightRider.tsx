// Kulka on the "Moja waga" chart: starts on the first point together with the line and rides the tip
// of the line while it is drawn (same ease-out timeline as useDrawOnView), sliding down a drop,
// climbing a rise, walking a flat part; ends on the last point as the line finishes, then idles there,
// or, with onArrive, hands over to GoalKulka (jumps to the Masa / Redukcja toggle) and disappears.
// Positions are in % of the plot box, like the chart's dots.
import { useEffect, useRef, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import { prefersReducedMotion } from '../../hooks/useFirstInView';
import { reachAt } from '../../hooks/useDrawOnView';

export interface RiderPoint { x: number; y: number; kg: number }

const FLAT_KG = 0.2; // smaller weekly changes count as flat

export default function WeightRider({ pts, drawing, onArrive }: { pts: RiderPoint[]; drawing: boolean; onArrive?: (box: DOMRect) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MascotState>('idle');
  const [reduced] = useState(prefersReducedMotion);
  const [gone, setGone] = useState(false);
  const ptsRef = useRef(pts);
  const arriveRef = useRef(onArrive);
  useEffect(() => { arriveRef.current = onArrive; });

  useEffect(() => {
    const el = ref.current;
    const route = ptsRef.current;
    if (!drawing || reduced || !el || route.length < 2) return;
    // When the line reaches each point: same timeline as the line (useDrawOnView), linear within a segment
    const x0 = route[0].x, span = route[route.length - 1].x - x0 || 1;
    const at = route.map(p => reachAt((p.x - x0) / span));
    const end = at[at.length - 1];
    const t0 = performance.now();
    let raf = 0;
    let k = 0; // current segment route[k] → route[k + 1]
    let shown: MascotState | null = null;
    const tick = (now: number) => {
      const t = Math.min(end, now - t0);
      while (k < route.length - 2 && t >= at[k + 1]) k++;
      const a = route[k], b = route[k + 1];
      const f = at[k + 1] > at[k] ? Math.min(1, (t - at[k]) / (at[k + 1] - at[k])) : 1;
      el.style.left = `${a.x + (b.x - a.x) * f}%`;
      el.style.top = `${a.y + (b.y - a.y) * f}%`;
      const d = b.kg - a.kg;
      const m: MascotState = t >= end ? 'idle' : d <= -FLAT_KG ? 'slide' : d >= FLAT_KG ? 'climb' : 'walk';
      if (m !== shown) { shown = m; setMode(m); }
      if (t < end) raf = requestAnimationFrame(tick);
      else if (arriveRef.current) { arriveRef.current(el.firstElementChild!.getBoundingClientRect()); setGone(true); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [drawing, reduced]);

  // With onArrive and reduced motion GoalKulka stands on the toggle right away instead
  if (!drawing || pts.length < 2 || gone || (reduced && onArrive)) return null;
  // Reduced motion: no ride, Kulka simply stands on the last point
  const start = reduced ? pts[pts.length - 1] : pts[0];
  return (
    <div ref={ref} className="m-rider" style={{ left: `${start.x}%`, top: `${start.y}%` }}>
      <Mascot size={34} state={mode} className="m-rider-pop" />
    </div>
  );
}
