// Kulka on the exercise editor of a training day, in his helmet. Entrance: a crane hook lowers him by his harness
// from the top of the screen onto the top edge of the exercise list (right end), he unhooks and the hook goes back
// up (~2 s). Idle: sits there ticking off the exercises. Reactions to the editor's `cue` (the action itself has
// already happened): "Dodaj ćwiczenie" – runs to the button and carries a brick to the new row, which pops in;
// move – pushes the row up/down while it slides; delete – kicks a brick into the trash can; "Gotowe" – wipes his
// sweat and gives a thumbs up (the editor leaves after WIPE_MS, trash.ts).
// Rendered inside the position: relative .exed container, which it measures. Reduced motion: no movement.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import { TrashCan } from './TrashKulka';
import { prefersReducedMotion } from '../../hooks/useFirstInView';
import { BRICK, GRID_H, GRID_W, propPaths } from './kulkaSprites';

export interface EditorCue { kind: 'add' | 'up' | 'down' | 'remove' | 'done'; index: number; seq: number }

const SIZE = 40;
const C = SIZE / GRID_W;
const H = GRID_H * C;
const SIT_DROP = 2; // px the sitting Kulka sinks onto the list edge
const LOWER_MS = 1300, UNHOOK_MS = 300, HOOK_UP_MS = 600;
const RUN_PX_MS = 1.6; // run speed: ms per px, clamped
const BRICK_ART = propPaths(BRICK.map(r => r.slice(0, 8)));
const HOOK = propPaths(['..g', '..g', 'g.g', 'ggg']);

interface Pos { x: number; y: number }
interface Step { at: number; state?: MascotState; to?: Pos; ms?: number; fx?: () => void }

const runMs = (a: Pos, b: Pos) => Math.round(Math.min(450, Math.max(200, Math.hypot(b.x - a.x, b.y - a.y) * RUN_PX_MS)));
const slide = (el: Element, from: number, holdUntil: number, ms: number) =>
  el.animate([{ transform: `translateY(${from}px)` }, { transform: `translateY(${from}px)`, offset: holdUntil / ms }, { transform: 'none' }],
    { duration: ms, easing: 'ease-in-out' });

export default function CraneKulka({ cue }: { cue: EditorCue | null }) {
  const [reduced] = useState(prefersReducedMotion);
  const [state, setState] = useState<MascotState>(reduced ? 'tick' : 'harness');
  const [hook, setHook] = useState(!reduced);
  const [kick, setKick] = useState<{ brick: Pos; can: Pos; closing: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null), hookRef = useRef<HTMLDivElement>(null), brickRef = useRef<HTMLSpanElement>(null);
  const pos = useRef<Pos>({ x: 0, y: 0 });
  const timers = useRef<number[]>([]);
  const busy = useRef(!reduced);

  // Coordinates relative to the .exed container
  const box = () => ref.current!.parentElement!.getBoundingClientRect();
  const rel = (r: DOMRect) => { const b = box(); return { left: r.left - b.left, right: r.right - b.left, top: r.top - b.top, bottom: r.bottom - b.top, height: r.height }; };
  const q = <T extends Element = HTMLElement>(sel: string) => ref.current!.parentElement!.querySelector<T>(sel);
  const rest = (): Pos => {
    const anchor = q('.exed-list') ?? q('.exed-empty') ?? q('.exed-add');
    if (!anchor) return pos.current;
    const r = rel(anchor.getBoundingClientRect());
    return { x: Math.round(r.right - SIZE - 10), y: Math.round(r.top - H + SIT_DROP) };
  };
  const moveTo = (p: Pos, ms = 0) => {
    const el = ref.current;
    if (!el) return;
    pos.current = p;
    el.style.transition = ms ? `transform ${ms}ms linear` : 'none';
    el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  };
  const clear = () => { timers.current.forEach(t => window.clearTimeout(t)); timers.current = []; };
  const play = (steps: Step[]) => {
    clear();
    for (const s of steps) {
      timers.current.push(window.setTimeout(() => {
        if (s.state) setState(s.state);
        if (s.to) moveTo(s.to, s.ms);
        s.fx?.();
      }, s.at));
    }
  };
  // Run back to the spot and sit down again
  const home = (at: number, from: Pos): Step[] => {
    const r = rest(), ms = runMs(from, r);
    return [{ at, state: 'runH', to: r, ms }, { at: at + ms, state: 'tick', fx: () => { busy.current = false; } }];
  };

  // Entrance: lowered on the hook from the top of the screen (right below the mobile top bar)
  useLayoutEffect(() => {
    const r = rest();
    const bar = document.querySelector('.topbar')?.getBoundingClientRect();
    const top = bar && bar.height > 0 ? Math.max(0, bar.bottom) : 0;
    const drop = Math.round(box().top + r.y - top + H);
    ref.current!.style.setProperty('--m-top', `${drop + H}px`);
    if (reduced) { moveTo(r); return; }
    moveTo({ x: r.x, y: r.y - drop });
    void ref.current!.offsetWidth;
    moveTo(r, LOWER_MS);
    ref.current!.style.transition = `transform ${LOWER_MS}ms cubic-bezier(.3,.5,.4,1)`;
    play([
      { at: LOWER_MS, state: 'jumpH' },
      { at: LOWER_MS + 80, fx: () => hookRef.current?.animate([{ transform: 'none' }, { transform: `translateY(${-drop - H}px)` }], { duration: HOOK_UP_MS, easing: 'ease-in', fill: 'forwards' }) },
      { at: LOWER_MS + UNHOOK_MS, state: 'tick', fx: () => { busy.current = false; } },
      { at: LOWER_MS + 80 + HOOK_UP_MS, fx: () => setHook(false) },
    ]);
    return clear;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the spot when the layout changes size
  useEffect(() => {
    const onResize = () => { if (!busy.current) moveTo(rest()); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reactions, measured after the editor has rendered the change
  useLayoutEffect(() => {
    if (!cue || !ref.current) return;
    if (cue.kind === 'done') { busy.current = true; play([{ at: 0, state: 'wipe' }]); return; }
    if (reduced) return;
    const items = ref.current.parentElement!.querySelectorAll<HTMLElement>('.exed-item');
    const from = pos.current;
    busy.current = true;
    const reset: Step = { at: 0, fx: () => { setHook(false); setKick(null); } };

    if (cue.kind === 'add') {
      const btn = q('.exed-add'), item = items[cue.index];
      if (!btn || !item) { play(home(0, from)); return; }
      const b = rel(btn.getBoundingClientRect()), row = rel(item.querySelector('.exed-row')!.getBoundingClientRect());
      const atBtn = { x: Math.round(b.right - SIZE - 24), y: Math.round(b.bottom - H) };
      const atRow = { x: Math.round(row.right - SIZE - 48), y: Math.round(row.bottom - H) };
      const t1 = runMs(from, atBtn), t2 = t1 + 150, t3 = t2 + runMs(atBtn, atRow);
      // The new row stays faded until the brick arrives, then pops in (it is already there and usable)
      item.animate([{ opacity: 0.3, transform: 'scale(.96)' }, { opacity: 0.3, transform: 'scale(.96)', offset: t3 / (t3 + 300) },
        { opacity: 1, transform: 'scale(1.02)', offset: (t3 + 180) / (t3 + 300) }, { opacity: 1, transform: 'none' }], { duration: t3 + 300 });
      play([
        reset,
        { at: 0, state: 'runH', to: atBtn, ms: t1 },
        { at: t1, state: 'carry' },
        { at: t2, to: atRow, ms: t3 - t2 },
        { at: t3, state: 'jumpH' },
        ...home(t3 + 250, atRow),
      ]);
    } else if (cue.kind === 'up' || cue.kind === 'down') {
      const up = cue.kind === 'up';
      const moved = items[cue.index], other = items[cue.index + (up ? 1 : -1)];
      if (!moved || !other) { play(home(0, from)); return; }
      const m = rel(moved.getBoundingClientRect()), hOther = other.getBoundingClientRect().height, hMoved = m.height;
      // Where the moved row was before the swap; Kulka pushes it from there (from below going up, from above going down)
      const oldTop = up ? m.top + hOther : m.top - hOther;
      const x = Math.round(m.right - SIZE - 56);
      const start = up ? { x, y: Math.round(oldTop + hMoved - 6 * C) } : { x, y: Math.round(oldTop - H + 2) };
      const end = { x, y: start.y + (up ? -hOther : hOther) };
      const t1 = runMs(from, start), ms = t1 + 320;
      moved.style.position = 'relative'; moved.style.zIndex = '1';
      slide(moved, oldTop - m.top, t1, ms).onfinish = () => { moved.style.position = ''; moved.style.zIndex = ''; };
      slide(other, up ? -hMoved : hMoved, t1, ms);
      play([
        reset,
        { at: 0, state: 'runH', to: start, ms: t1 },
        { at: t1, state: up ? 'pushUp' : 'pushDown', to: end, ms: 320 },
        ...home(ms + 200, end),
      ]);
    } else if (cue.kind === 'remove') {
      const list = q('.exed-list') ?? q('.exed-empty') ?? q('.exed-add');
      if (!list) { play(home(0, from)); return; }
      const l = rel(list.getBoundingClientRect());
      const next = items[cue.index];
      const y = next ? rel(next.getBoundingClientRect()).top + 30 : l.bottom;
      const spot = { x: Math.round(l.right - SIZE - 96), y: Math.round(y - H) };
      const brick = { x: spot.x + SIZE - 4, y: Math.round(y - BRICK_ART.h * C) };
      const can = { x: Math.round(l.right - 34), y: Math.round(y) }; // bottom-left of the can
      const t1 = runMs(from, spot);
      play([
        reset,
        { at: 0, state: 'runH', to: spot, ms: t1 },
        { at: t1, state: 'kick', fx: () => setKick({ brick, can, closing: false }) },
        { at: t1 + 220, fx: () => brickRef.current?.animate([
          { transform: 'none' },
          { transform: `translate(${(can.x - brick.x) / 2}px, -26px) rotate(140deg)`, offset: 0.5 },
          { transform: `translate(${can.x + 4 - brick.x}px, ${can.y - 22 - brick.y}px) rotate(260deg) scale(.6)`, opacity: 0 },
        ], { duration: 360, easing: 'ease-in', fill: 'forwards' }) },
        { at: t1 + 600, fx: () => setKick(k => k && { ...k, closing: true }) },
        { at: t1 + 1100, fx: () => setKick(null) },
        ...home(t1 + 700, spot),
      ]);
    }
  }, [cue?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => clear, []);

  return (
    <>
      <div ref={ref} className="m-crane">
        {hook && (
          <div ref={hookRef} className="m-crane-hook">
            <span className="m-crane-cable" />
            <svg viewBox="0 0 5 6" width={5 * C} height={6 * C} shapeRendering="crispEdges" aria-hidden="true">
              {HOOK.paths.map(p => <path key={p.fill} fill={p.fill} d={p.d} />)}
            </svg>
          </div>
        )}
        <Mascot size={SIZE} state={state} noWave />
      </div>
      {kick && (
        <>
          <span ref={brickRef} className="m-crane-brick" style={{ left: kick.brick.x, top: kick.brick.y }}>
            <svg viewBox={`0 0 ${BRICK_ART.w} ${BRICK_ART.h}`} width={BRICK_ART.w * C} height={BRICK_ART.h * C} shapeRendering="crispEdges" aria-hidden="true">
              {BRICK_ART.paths.map(p => <path key={p.fill} fill={p.fill} d={p.d} />)}
            </svg>
          </span>
          <span className="m-crane-can" style={{ left: kick.can.x, top: kick.can.y }}><TrashCan closing={kick.closing} /></span>
        </>
      )}
    </>
  );
}
