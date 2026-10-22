// Kulka on the delete/reset dialogs: stands on the dialog's top edge next to a pixel trash can, holding a
// sheet of paper. Open: unsure looks; cancel: hides the paper behind his back; confirm: throws it into
// the can and the lid shuts with a bounce. The dialog closes after TRASH_MS (trash.ts; immediately with reduced motion).
import { useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import { propPaths } from './kulkaSprites';
import { prefersReducedMotion } from '../../hooks/useFirstInView';
import type { TrashPhase } from './trash';

const SIZE = 40;
const CELL = SIZE / 24; // same pixel size as Kulka's 24-wide grid
const LID = propPaths(['....GGGG....', 'gggggggggggg']);
const CAN = propPaths([
  'gggggggggg',
  'gGggGggGgg',
  'gGggGggGgg',
  'gGggGggGgg',
  'gGggGggGgg',
  'gGggGggGgg',
  'gGggGggGgg',
  '.gggggggg.',
]);
const PAPER = propPaths(['wwww', 'wddw', 'wwww']);

function Prop({ art, cls }: { art: ReturnType<typeof propPaths>; cls: string }) {
  return (
    <svg className={cls} viewBox={`0 0 ${art.w} ${art.h}`} width={art.w * CELL} height={art.h * CELL} shapeRendering="crispEdges" aria-hidden="true">
      {art.paths.map(p => <path key={p.fill} fill={p.fill} d={p.d} />)}
    </svg>
  );
}

const STATE: Record<TrashPhase, MascotState> = { open: 'worry', cancel: 'hide', confirm: 'toss' };

export default function TrashKulka({ phase }: { phase: TrashPhase }) {
  const [reduced] = useState(prefersReducedMotion);
  return (
    <div className={`m-trash m-trash-${phase}`}>
      <Mascot size={SIZE} state={STATE[phase]} />
      <span className="m-trash-can">
        <Prop art={LID} cls="m-trash-lid" />
        <Prop art={CAN} cls="m-trash-body" />
      </span>
      {phase === 'confirm' && !reduced && <Prop art={PAPER} cls="m-trash-paper" />}
    </div>
  );
}
