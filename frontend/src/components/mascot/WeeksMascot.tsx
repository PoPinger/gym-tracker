// Kulka on the plan weeks view, rendered inside .week-cards: walks in from the left edge of the grid
// carrying a barbell, stops on top of the current week's tile (its right corner, clear of the number and
// status) and presses the barbell overhead in a loop. Reduced motion: no walk, static press pose.
import { useLayoutEffect, useRef, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';
import { prefersReducedMotion } from '../../hooks/useFirstInView';
import { GRID_H, GRID_W } from './kulkaSprites';

const SIZE = 48;
const HEIGHT = SIZE * GRID_H / GRID_W;
const WALK_MS_PER_PX = 5;

export default function WeeksMascot() {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [mode, setMode] = useState<MascotState>(reduced ? 'press' : 'walkBar');

  useLayoutEffect(() => {
    const el = ref.current, grid = el?.parentElement;
    if (!el || !grid) return;
    const target = () => {
      const tile = grid.querySelector<HTMLElement>('.week-card.current');
      return tile && { x: tile.offsetLeft + tile.offsetWidth - SIZE - 6, y: tile.offsetTop - HEIGHT + 1 };
    };
    const place = () => {
      const t = target();
      if (!t) return;
      el.style.transition = 'none';
      el.style.top = `${t.y}px`;
      el.style.transform = `translateX(${t.x}px)`;
    };
    let timer = 0;
    const t = target();
    if (!t) return;
    if (reduced) place();
    else {
      // Start just left of the grid on the tile's row, then walk to the tile
      const from = -SIZE / 2, ms = Math.min(1800, Math.max(500, (t.x - from) * WALK_MS_PER_PX));
      el.style.top = `${t.y}px`;
      el.style.transform = `translateX(${from}px)`;
      void el.offsetWidth; // commit the start position before the transition
      el.style.transition = `transform ${ms}ms linear`;
      el.style.transform = `translateX(${t.x}px)`;
      timer = window.setTimeout(() => setMode('press'), ms);
    }
    window.addEventListener('resize', place);
    return () => { window.removeEventListener('resize', place); window.clearTimeout(timer); };
  }, [reduced]);

  return (
    <div ref={ref} className="m-weeks">
      <Mascot size={SIZE} state={mode} />
    </div>
  );
}
