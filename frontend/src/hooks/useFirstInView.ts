import { useCallback, useEffect, useRef } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Callback ref that calls onFirstView(el) once, the first time the element is at least partly on screen
export function useFirstInView<T extends Element>(onFirstView: (el: T) => void, threshold = 0.2) {
  const cb = useRef(onFirstView);
  const fired = useRef(false);
  useEffect(() => { cb.current = onFirstView; });

  return useCallback((el: T | null) => {
    if (!el || fired.current) return;
    const fire = () => { if (!fired.current) { fired.current = true; cb.current(el); } };
    if (typeof IntersectionObserver === 'undefined') { requestAnimationFrame(fire); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); fire(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
}
