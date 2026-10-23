// Kulka on the signed-out screens (always Kulka: no account yet), standing on the auth card's top edge above
// the logo. Login: waves in a loop. Password reset: scratches his head while pixel question marks float up
// and fade out. With prefers-reduced-motion: a static pose (and one question mark).
import { useState } from 'react';
import Mascot from './Mascot';
import { propPaths, QMARK } from './kulkaSprites';
import { prefersReducedMotion } from '../../hooks/useFirstInView';

const SIZE = 48;
const CELL = SIZE / 24; // same pixel size as Kulka's 24-wide grid
const Q = propPaths(QMARK);
// Start spots over the head (px from the mascot's left edge) and delays (s); index.css staggers them so 1–3 show
const MARKS = [{ x: 14, d: 0 }, { x: -2, d: 0.8 }, { x: 38, d: 1.6 }];

export default function AuthKulka({ mode }: { mode: 'wave' | 'confused' }) {
  const [reduced] = useState(prefersReducedMotion);
  const marks = mode === 'confused' ? (reduced ? MARKS.slice(0, 1) : MARKS) : [];
  return (
    <div className="m-spot-auth">
      {marks.map(m => (
        <svg key={m.x} className="m-qmark" style={{ left: m.x, animationDelay: `${m.d}s` }} viewBox={`0 0 ${Q.w} ${Q.h}`}
          width={Q.w * CELL} height={Q.h * CELL} shapeRendering="crispEdges" aria-hidden="true">
          {Q.paths.map(p => <path key={p.fill} fill={p.fill} d={p.d} />)}
        </svg>
      ))}
      <Mascot size={SIZE} kind="kulka" state={mode === 'wave' ? 'hello' : 'confused'} />
    </div>
  );
}
