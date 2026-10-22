// Pixel confetti in the app colours: a small burst around its positioned parent (Kulka), or a big shower
// falling over it (a list). Never blocks clicks, removed after CONFETTI_MS; nothing with reduced motion.
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { prefersReducedMotion } from '../../hooks/useFirstInView';

const COLORS = ['#4f46e5', '#f59e0b', '#fb7185', '#38bdf8', '#22c55e', '#a5b4fc'];
const CONFETTI_MS = 3000;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const px = (v: number) => `${Math.round(v)}px`;

function pieces(big: boolean): CSSProperties[] {
  if (big) {
    // Falling from the top over the whole parent, all landed by ~2.8 s
    return Array.from({ length: 70 }, (_, i) => ({
      left: `${rnd(0, 100)}%`, background: COLORS[i % COLORS.length], width: i % 3 ? 5 : 7, height: i % 3 ? 5 : 7,
      animationDelay: `${Math.round(rnd(0, 900))}ms`, animationDuration: `${Math.round(rnd(1400, 1900))}ms`,
      '--dx': px(rnd(-40, 40)), '--r': `${Math.round(rnd(-1, 1) * 2) * 90}deg`,
    }) as CSSProperties);
  }
  // Two bursts (one per jump), mostly upwards
  return Array.from({ length: 24 }, (_, i) => {
    const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), d = rnd(26, 46);
    return {
      background: COLORS[i % COLORS.length], width: 4, height: 4,
      animationDelay: `${(i < 12 ? 0 : 650) + Math.round(rnd(0, 120))}ms`, animationDuration: `${Math.round(rnd(800, 1000))}ms`,
      '--dx': px(Math.cos(a) * d), '--dy': px(Math.sin(a) * d),
    } as CSSProperties;
  });
}

export default function Confetti({ big = false }: { big?: boolean }) {
  const [on, setOn] = useState(() => !prefersReducedMotion());
  const [items] = useState(() => pieces(big));
  useEffect(() => {
    const t = window.setTimeout(() => setOn(false), CONFETTI_MS);
    return () => window.clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <span className={`m-confetti ${big ? 'm-confetti-big' : 'm-confetti-small'}`} aria-hidden="true">
      {items.map((s, i) => <span key={i} style={s} />)}
    </span>
  );
}
