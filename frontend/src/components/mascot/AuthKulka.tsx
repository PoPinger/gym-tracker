// Kulka on the signed-out screens (always Kulka: no account yet), standing on the auth sheet's top edge.
// Login / register: waves in a loop. Password reset: scratches his head while pixel question marks float up
// and fade out. exiting (after a successful sign-in, see useCelebration): a pixel hole opens on the sheet
// next to him, he jumps in and disappears, the hole closes (HOLE_MS in hooks/useCelebration, index.css "auth hole").
// With prefers-reduced-motion: a static pose (and one question mark); exiting never shows (no celebration).
import { useState } from 'react';
import Mascot from './Mascot';
import { HOLE, propPaths, QMARK } from './kulkaSprites';
import { prefersReducedMotion } from '../../hooks/useFirstInView';

const SIZE = 48;
const CELL = SIZE / 24; // same pixel size as Kulka's 24-wide grid
const Q = propPaths(QMARK);
const H = propPaths(HOLE);
// Start spots over the head (px from the mascot's left edge) and delays (s); index.css staggers them so 1–3 show
const MARKS = [{ x: 14, d: 0 }, { x: -2, d: 0.8 }, { x: 38, d: 1.6 }];

const Prop = ({ p, className, style }: { p: typeof Q; className: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox={`0 0 ${p.w} ${p.h}`} width={p.w * CELL} height={p.h * CELL}
    shapeRendering="crispEdges" aria-hidden="true">
    {p.paths.map(path => <path key={path.fill} fill={path.fill} d={path.d} />)}
  </svg>
);

export default function AuthKulka({ mode, exiting = false }: { mode: 'wave' | 'confused'; exiting?: boolean }) {
  const [reduced] = useState(prefersReducedMotion);
  if (exiting) return (
    <div className="m-spot-auth">
      <Prop p={H} className="m-hole" />
      {/* Clipped at the hole's middle, so Kulka disappears into it */}
      <div className="m-hole-clip">
        <div className="m-hole-dive"><Mascot size={SIZE} kind="kulka" state="jump" noWave /></div>
      </div>
    </div>
  );
  const marks = mode === 'confused' ? (reduced ? MARKS.slice(0, 1) : MARKS) : [];
  return (
    <div className="m-spot-auth">
      {marks.map(m => <Prop key={m.x} p={Q} className="m-qmark" style={{ left: m.x, animationDelay: `${m.d}s` }} />)}
      <Mascot size={SIZE} kind="kulka" state={mode === 'wave' ? 'hello' : 'confused'} />
    </div>
  );
}
