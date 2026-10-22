// Kulka the builder (Edytuj plan card, cycle duration dialog), in a helmet with a clipboard. Entrance: a pixel
// excavator drives in from the left along the top edge of the container carrying him in its bucket, lowers the
// bucket, he hops out to his spot at the top right, and the excavator drives off, clipped at the container's right
// edge (~2.5 s). Then he writes; faster for a moment whenever `activity` changes. `outcome` plays the stamp +
// thumbs up (save) or the shrug (cancel); callers close after STAMP_MS / SHRUG_MS (trash.ts).
// Rendered inside a position: relative container. Reduced motion: no entrance, static poses.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import { prefersReducedMotion } from '../../hooks/useFirstInView';
import { excavatorPaths, propPaths, EXC_BUCKET, EXC_BUCKET_DOWN, EXC_BUCKET_UP, EXC_H, EXC_W, GRID_H, GRID_W, type FramePath } from './kulkaSprites';

const SIZE = 40;
const C = SIZE / GRID_W; // one pixel-art cell, the same for the excavator
const H = GRID_H * C;
const LANE_H = 84; // matches .m-build-lane
const RIGHT = 14; // matches .m-build-spot
const RIDER_X = EXC_BUCKET_UP[0] + 6 - GRID_W / 2; // Kulka centred on the bucket
const riderTop = (bucketY: number) => (bucketY + 1 - 24) * C; // sitting low in the bucket
const RIG_TOP = LANE_H + 1 - (EXC_H - 1) * C; // tracks on the container's top border, like Kulka's feet
const BUCKET = propPaths(EXC_BUCKET);
const EXC = { up: excavatorPaths(false), down: excavatorPaths(true) };
const FAST_MS = 1200;
// Entrance timeline (ms): drive in, lower the bucket, hop out (the excavator drives off meanwhile)
const DRIVE_IN = 1100, LOWER = 300, HOP = 450, DRIVE_OFF = 900;

type Phase = 'in' | 'down' | 'hop' | 'off' | 'done';
export type BuilderOutcome = 'save' | 'cancel' | null;

function Svg({ w, h, paths, cls }: { w: number; h: number; paths: FramePath[]; cls?: string }) {
  return (
    <svg className={cls} viewBox={`0 0 ${w} ${h}`} width={w * C} height={h * C} shapeRendering="crispEdges" aria-hidden="true">
      {paths.map(p => <path key={p.fill} fill={p.fill} d={p.d} />)}
    </svg>
  );
}

export default function BuilderKulka({ activity, outcome = null, intro = true, onIntroDone }: {
  activity: unknown; outcome?: BuilderOutcome; intro?: boolean; onIntroDone?: () => void;
}) {
  const [reduced] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState<Phase>(intro && !reduced ? 'in' : 'done');
  const laneRef = useRef<HTMLDivElement>(null), rigRef = useRef<HTMLDivElement>(null), spotRef = useRef<HTMLDivElement>(null);
  const stopX = useRef(0);
  const doneCb = useRef(onIntroDone);
  useEffect(() => { doneCb.current = onIntroDone; });

  // Writing faster for a moment after every change (state adjusted during render when the prop changes)
  const [seen, setSeen] = useState(activity);
  const [fast, setFast] = useState(0);
  if (activity !== seen) { setSeen(activity); setFast(f => f + 1); }
  useEffect(() => {
    if (!fast) return;
    const t = window.setTimeout(() => setFast(0), FAST_MS);
    return () => window.clearTimeout(t);
  }, [fast]);

  // Drive in to a stop left of the spot, then step through the phases
  useLayoutEffect(() => {
    const lane = laneRef.current, rig = rigRef.current;
    if (phase !== 'in' || !lane || !rig) return;
    const spotX = lane.clientWidth - RIGHT - SIZE;
    stopX.current = Math.max(0, spotX - 34 - RIDER_X * C);
    const anim = rig.animate([{ transform: `translateX(${-EXC_W * C}px)` }, { transform: `translateX(${stopX.current}px)` }],
      { duration: DRIVE_IN, easing: 'cubic-bezier(.25,.6,.4,1)', fill: 'forwards' });
    const at = [DRIVE_IN, DRIVE_IN + LOWER, DRIVE_IN + LOWER + HOP, DRIVE_IN + LOWER + DRIVE_OFF];
    const next: Phase[] = ['down', 'hop', 'off', 'done'];
    const timers = at.map((ms, i) => window.setTimeout(() => { setPhase(next[i]); if (next[i] === 'done') doneCb.current?.(); }, ms));
    return () => { anim.cancel(); timers.forEach(t => window.clearTimeout(t)); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hop from the bucket to the spot in an arc while the excavator drives off to the right edge
  useLayoutEffect(() => {
    const lane = laneRef.current, rig = rigRef.current, spot = spotRef.current;
    if (phase !== 'hop' || !lane || !rig || !spot) return;
    const w = lane.clientWidth;
    const dx = stopX.current + RIDER_X * C - (w - RIGHT - SIZE);
    const dy = RIG_TOP + riderTop(EXC_BUCKET_DOWN[1]) - (LANE_H + 1 - H);
    spot.animate([
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: `translate(${dx * 0.45}px, ${Math.min(dy, 0) - 26}px)`, offset: 0.5 },
      { transform: 'none' },
    ], { duration: HOP, easing: 'ease-in-out' });
    rig.animate([{ transform: `translateX(${stopX.current}px)` }, { transform: `translateX(${w + 4}px)` }],
      { duration: DRIVE_OFF, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
  }, [phase]);

  const lowered = phase !== 'in';
  const bucket = lowered ? EXC_BUCKET_DOWN : EXC_BUCKET_UP;
  const state: MascotState = phase === 'hop' ? 'jumpH'
    : outcome === 'save' ? 'stamp' : outcome === 'cancel' ? 'shrug' : fast ? 'buildFast' : 'build';

  return (
    <div ref={laneRef} className="m-build-lane">
      {phase !== 'done' && (
        <div ref={rigRef} className="m-build-rig" style={{ top: RIG_TOP, transform: `translateX(${-EXC_W * C}px)` }}>
          <Svg w={EXC_W} h={EXC_H} paths={lowered ? EXC.down : EXC.up} />
          {(phase === 'in' || phase === 'down') && (
            <div className="m-build-rider" style={{ left: RIDER_X * C, top: riderTop(bucket[1]) }}>
              <Mascot size={SIZE} state="ride" noWave />
            </div>
          )}
          <span className="m-build-bucket" style={{ left: (bucket[0] - 1) * C, top: (bucket[1] - 1) * C }}>
            <Svg w={BUCKET.w} h={BUCKET.h} paths={BUCKET.paths} />
          </span>
        </div>
      )}
      {phase !== 'in' && phase !== 'down' && (
        <div ref={spotRef} className="m-build-spot">
          <Mascot size={SIZE} state={state} noWave />
        </div>
      )}
    </div>
  );
}
