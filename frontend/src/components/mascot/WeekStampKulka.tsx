// Kulka on the weight week view, standing on the top-right corner of the "Dzienne odczyty" card. Idle: writes in
// a notebook, pockets it, looks around. When a day is confirmed (its save succeeded) he runs to that day's tile,
// stamps it with a green checkmark and runs back; the save itself is never waited for.
// Rendered inside the position: relative card, which it measures. Reduced motion: static pose, no running.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import { prefersReducedMotion } from '../../hooks/useFirstInView';
import { GRID_H, GRID_W, handCell, propPaths, STAMP_MARK } from './kulkaSprites';
import { useMascotKind } from './MascotContext';

export interface StampCue { index: number; seq: number }

const SIZE = 48;
const C = SIZE / GRID_W;
const H = GRID_H * C;
const RUN_PX_MS = 1.6;
const STAMP_DOWN_MS = 220, STAMP_HOLD_MS = 480;
const MARK = propPaths(STAMP_MARK);

interface Pos { x: number; y: number }
const runMs = (a: Pos, b: Pos) => Math.round(Math.min(500, Math.max(220, Math.hypot(b.x - a.x, b.y - a.y) * RUN_PX_MS)));

export default function WeekStampKulka({ cue }: { cue: StampCue | null }) {
  const [reduced] = useState(prefersReducedMotion);
  const [state, setState] = useState<MascotState>('notebook');
  const [mark, setMark] = useState<Pos | null>(null);
  const [hx, hy] = handCell('dayStampDown', useMascotKind(), 'R');
  const stampX = (hx + 1) * C, stampY = (hy + 2) * C; // the stamp's face, under the right hand
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef<Pos>({ x: 0, y: 0 });
  const timers = useRef<number[]>([]);
  const busy = useRef(false);

  const card = () => ref.current!.parentElement!;
  const rest = (): Pos => ({ x: Math.round(card().clientWidth - SIZE - 14), y: Math.round(-H + 1) });
  const moveTo = (p: Pos, ms = 0) => {
    const el = ref.current;
    if (!el) return;
    pos.current = p;
    el.style.transition = ms ? `transform ${ms}ms linear` : 'none';
    el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  };
  const clear = () => { timers.current.forEach(t => window.clearTimeout(t)); timers.current = []; };
  const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  useLayoutEffect(() => {
    moveTo(rest());
    const onResize = () => { if (!busy.current) moveTo(rest()); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clear(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (!cue || reduced || !ref.current) return;
    const tile = card().querySelectorAll<HTMLElement>('.w-day-cell')[cue.index];
    if (!tile) return;
    const b = card().getBoundingClientRect(), r = tile.getBoundingClientRect();
    // Stands on the tile's top edge so the stamp in his right hand comes down on the tile's centre
    const target = { x: Math.round(r.left - b.left + r.width / 2 - stampX), y: Math.round(r.top - b.top - H + 10) };
    const from = pos.current, t1 = runMs(from, target), t2 = t1 + STAMP_DOWN_MS, t3 = t2 + STAMP_HOLD_MS;
    clear();
    busy.current = true;
    moveTo(target, t1);
    at(0, () => { setMark(null); setState('run'); });
    at(t1, () => setState('dayStamp'));
    at(t2, () => setMark({ x: target.x + stampX - (MARK.w * C) / 2, y: target.y + stampY }));
    at(t3, () => { const home = rest(); setState('run'); moveTo(home, runMs(target, home)); at(runMs(target, home), () => { setState('notebook'); busy.current = false; }); });
    at(t2 + 900, () => setMark(null));
  }, [cue?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => clear, []);

  return (
    <>
      <div ref={ref} className="m-stamper"><Mascot size={SIZE} state={state} /></div>
      {mark && (
        <span className="m-stamp-mark" style={{ left: mark.x, top: mark.y }} aria-hidden="true">
          <svg viewBox={`0 0 ${MARK.w} ${MARK.h}`} width={MARK.w * C} height={MARK.h * C} shapeRendering="crispEdges">
            {MARK.paths.map(p => <path key={p.fill} fill={p.fill} d={p.d} />)}
          </svg>
        </span>
      )}
    </>
  );
}
