// The towel Kulka throws when the training day is marked as skipped: it flies from his hand at the user, growing
// as if coming out of the screen, hits the glass (squash + bounce), then slides down and fades (TOWEL_MS, index.css).
// Fixed over the whole screen (portal), never blocks clicks; the caller renders it only without reduced motion.
import { useLayoutEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { propPaths, TOWEL } from './kulkaSprites';

export const TOWEL_MS = 1200;
const ART = propPaths(TOWEL);
const CELL = 40 / 24; // same pixel size as Kulka in the finish bar

// from: the throwing hand, in viewport coordinates
export default function TowelThrow({ from, onDone }: { from: { x: number; y: number }; onDone: () => void }) {
  const [to] = useState(() => ({ x: window.innerWidth / 2, y: window.innerHeight * 0.42 }));
  useLayoutEffect(() => {
    const t = window.setTimeout(onDone, TOWEL_MS);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const w = ART.w * CELL, h = ART.h * CELL;
  return createPortal(
    <span className="m-towel" aria-hidden="true" style={{
      left: from.x - w / 2, top: from.y - h / 2,
      '--tx': `${Math.round(to.x - from.x)}px`, '--ty': `${Math.round(to.y - from.y)}px`,
    } as CSSProperties}>
      <svg viewBox={`0 0 ${ART.w} ${ART.h}`} width={w} height={h} shapeRendering="crispEdges">
        {ART.paths.map(p => <path key={p.fill} fill={p.fill} d={p.d} />)}
      </svg>
    </span>,
    document.body,
  );
}
