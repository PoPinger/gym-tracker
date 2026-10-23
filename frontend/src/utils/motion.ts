// Shared motion helpers ("snappy & springy"); the CSS side lives in styles/motion.css with the same values.
// Every helper applies its state update right away (at most one frame later with the View Transitions
// API), so no motion ever delays an action or a save. Reduced motion: updates only, nothing moves.
import { flushSync } from 'react-dom';
import { prefersReducedMotion } from '../hooks/useFirstInView';

export const DUR_FAST = 150;
export const DUR = 180;
export const DUR_SLOW = 200;
export const EASE_SPRING = 'cubic-bezier(0.3, 1.3, 0.5, 1)';

export type NavDir = 'forward' | 'back';

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

// Page transition around a navigation (route change or in-page view switch): forward slides the new page
// in from the right, back from the left. View Transitions API where supported, else a CSS slide-in.
export function navTransition(dir: NavDir, update: () => void) {
  if (prefersReducedMotion()) { update(); return; }
  const doc = document as ViewTransitionDoc;
  const root = document.documentElement;
  if (doc.startViewTransition) {
    root.dataset.navDir = dir;
    try {
      const vt = doc.startViewTransition(() => flushSync(update));
      const done = () => { if (root.dataset.navDir === dir) delete root.dataset.navDir; };
      vt.finished.then(done, done);
      return;
    } catch { delete root.dataset.navDir; }
  }
  flushSync(update);
  const main = document.querySelector<HTMLElement>('.main-content');
  if (!main) return;
  main.classList.remove('nav-in-forward', 'nav-in-back');
  void main.offsetWidth; // restart the animation
  main.classList.add(`nav-in-${dir}`);
  window.setTimeout(() => main.classList.remove(`nav-in-${dir}`), DUR_SLOW + 50);
}

// Rows a and b of a list swap places (move up / down; a is the row moved): the update is applied at once,
// then both rows glide from where they were to their new place. The row pushed aside rides on top, so it
// stays visible over a tall (expanded) row. Rows are the list's children marked with data-flip.
export function flipSwap(list: HTMLElement | null, a: number, b: number, update: () => void) {
  const rows = () => (list ? Array.from(list.children).filter(el => el instanceof HTMLElement && el.dataset.flip != null) as HTMLElement[] : []);
  if (!list || prefersReducedMotion()) { update(); return; }
  const before = rows().map(el => el.getBoundingClientRect().top);
  flushSync(update);
  const after = rows();
  for (const [from, to] of [[a, b], [b, a]]) {
    const el = after[to];
    if (!el || before[from] == null) continue;
    const dy = before[from] - el.getBoundingClientRect().top;
    if (!dy) continue;
    const { position, zIndex, backgroundColor } = el.style;
    el.style.position = 'relative';
    el.style.zIndex = to === a ? '2' : '1';
    if (getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)') el.style.backgroundColor = 'var(--bg-white)';
    const anim = el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: DUR_SLOW, easing: EASE_SPRING });
    const reset = () => Object.assign(el.style, { position, zIndex, backgroundColor });
    anim.onfinish = reset; anim.oncancel = reset;
  }
}
