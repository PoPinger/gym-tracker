// Draws chart lines left to right the first time the chart comes into view.
// Lines are marked with data-draw (<line>/<polyline>), points with data-draw-dot.
// Dash lengths are measured in screen pixels: the charts are stretched SVGs with non-scaling strokes,
// where pathLength / user-space lengths don't match the dashes Safari draws.
import { useState } from 'react';
import { prefersReducedMotion, useFirstInView } from './useFirstInView';

const DRAW_MS = 3600;
const CAP_PAD = 4; // keeps the round line cap hidden before a line starts drawing
// Inverse of ease-out cubic: when (ms) the drawing front reaches a horizontal position p (0–1)
const reachAt = (p: number) => (1 - Math.cbrt(1 - Math.min(1, Math.max(0, p)))) * DRAW_MS;

function screenPoints(el: SVGGeometryElement): DOMPoint[] {
  const m = el.getScreenCTM();
  if (!m) return [];
  let pts: DOMPoint[] = [];
  if (el instanceof SVGLineElement) {
    pts = [new DOMPoint(el.x1.baseVal.value, el.y1.baseVal.value), new DOMPoint(el.x2.baseVal.value, el.y2.baseVal.value)];
  } else if (el instanceof SVGPolylineElement) {
    for (let i = 0; i < el.points.numberOfItems; i++) {
      const p = el.points.getItem(i);
      pts.push(new DOMPoint(p.x, p.y));
    }
  }
  return pts.map(p => p.matrixTransform(m));
}

function draw(root: Element) {
  const lines = [...root.querySelectorAll<SVGGeometryElement>('[data-draw]')]
    .map(el => ({ el, pts: screenPoints(el) })).filter(l => l.pts.length >= 2);
  if (!lines.length) return;
  // One timeline from the first to the last drawn point (not the plot width, which includes weeks without data)
  const x0 = Math.min(...lines.map(l => l.pts[0].x)), x1 = Math.max(...lines.map(l => l.pts.at(-1)!.x));
  const at = (x: number) => reachAt((x - x0) / (x1 - x0 || 1));

  lines.forEach(({ el, pts }) => {
    if (!el.animate) return;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const len = cum.at(-1)!;
    const start = at(pts[0].x), end = at(pts.at(-1)!.x), span = end - start;
    if (len === 0 || span <= 0) return;
    // One keyframe per vertex, timed by its x, so the front moves left to right with an overall ease-out
    const frames: Keyframe[] = pts.map((p, i) => ({
      offset: Math.min(1, Math.max(0, (at(p.x) - start) / span)),
      strokeDashoffset: `${i === 0 ? len + CAP_PAD : len - cum[i]}px`,
    }));
    el.style.strokeDasharray = `${len}px ${len + CAP_PAD * 2}px`;
    const a = el.animate(frames, { duration: span, delay: start, fill: 'backwards', easing: 'linear' });
    a.onfinish = a.oncancel = () => { el.style.strokeDasharray = ''; };
  });

  root.querySelectorAll<Element>('[data-draw-dot]').forEach(el => {
    if (!el.animate) return;
    const r = el.getBoundingClientRect();
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: Math.max(0, at(r.left + r.width / 2) - 320), fill: 'backwards', easing: 'ease-out' });
  });
}

// The last dot fades in by DRAW_MS + 480 ms (see draw); `drawn` turns true after that
const DONE_MS = DRAW_MS + 500;

// `pending` keeps lines and dots hidden (class draw-pending) until the chart has been seen;
// `drawn` tells when the draw animation has fully finished
export function useDrawOnView<T extends Element>() {
  const [pending, setPending] = useState(() => !prefersReducedMotion());
  const [drawn, setDrawn] = useState(false);
  const ref = useFirstInView<T>(el => {
    if (prefersReducedMotion()) { setPending(false); setDrawn(true); return; }
    draw(el);
    setPending(false);
    window.setTimeout(() => setDrawn(true), DONE_MS);
  }, 0.3);
  return [ref, pending, drawn] as const;
}
