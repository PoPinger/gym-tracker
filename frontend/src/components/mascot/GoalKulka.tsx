// Kulka on the Masa / Redukcja toggle of "Moja waga", standing on its top edge above the labels. He jumps there
// from the chart when his ride ends (`from`: the rider's last box on screen), or simply stands there when there
// is no ride. Every click on "Masa" makes him grow 5× bigger (a bit rounder), on "Redukcja" 5× smaller (a bit
// slimmer), also on the already selected option (0.6 s there, 0.5 s hold, 0.6 s back, scaled from his feet;
// index.css). While big he is drawn over the page without blocking clicks; the scale is capped and he is shifted
// sideways so he always stays on screen. Reduced motion: no jump, no size change.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import { prefersReducedMotion } from '../../hooks/useFirstInView';
import { GRID_H, HEAD_ROW } from './kulkaSprites';
import { useMascotKind } from './MascotContext';

export interface GoalPick { goal: 'bulk' | 'cut'; seq: number }

const SIZE = 34;
const JUMP_MS = 700;
const SHAPE_MS = 1700; // matches .m-goal-bulk / .m-goal-cut
const GROW = 5, ROUND = 1.07; // Masa: height ×5, width a bit more
const SHRINK = 0.2, SLIM = 0.86; // Redukcja: height ×0.2, width a bit less
const EDGE = 4; // px kept free at the screen edges

export default function GoalKulka({ pick, from }: { pick: GoalPick | null; from: DOMRect | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [jumping, setJumping] = useState(!!from && !reduced);
  const headRow = HEAD_ROW[useMascotKind()]; // only the rows from the head down count for the top edge

  // Size change on every click (state adjusted during render when the prop changes); a new seq restarts it
  const [seenPick, setSeenPick] = useState(pick);
  const [shape, setShape] = useState<GoalPick | null>(null);
  if (pick !== seenPick) {
    setSeenPick(pick);
    if (pick && !reduced) setShape(pick);
  }
  useEffect(() => {
    if (!shape) return;
    const t = window.setTimeout(() => setShape(null), SHAPE_MS);
    return () => window.clearTimeout(t);
  }, [shape]);

  // Target scale (--gx/--gy) and sideways shift (--gdx) for this click, so the scaled Kulka fits on screen
  useLayoutEffect(() => {
    const el = ref.current;
    if (!shape || !el) return;
    const r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    let gx = SHRINK * SLIM, gy = SHRINK;
    if (shape.goal === 'bulk') {
      gy = Math.max(1, Math.min(GROW, (r.bottom - EDGE) / (r.height * (1 - headRow / GRID_H))));
      gx = Math.min(gy * ROUND, (vw - 2 * EDGE) / r.width);
    }
    const cx = r.left + r.width / 2, half = (r.width * gx) / 2;
    const dx = Math.max(EDGE - (cx - half), Math.min(0, vw - EDGE - (cx + half)));
    el.style.setProperty('--gx', gx.toFixed(3));
    el.style.setProperty('--gy', gy.toFixed(3));
    el.style.setProperty('--gdx', `${Math.round(dx)}px`);
  }, [shape, headRow]);

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

  const state: MascotState = jumping ? 'jump' : shape ? (shape.goal === 'bulk' ? 'puff' : 'shrink') : 'idle';
  return (
    <div ref={ref} className={`m-goal${shape ? ' m-goal-sizing' : ''}`}>
      <Mascot key={shape?.seq ?? 0} size={SIZE} state={state} className={shape ? `m-goal-${shape.goal}` : ''} />
    </div>
  );
}
