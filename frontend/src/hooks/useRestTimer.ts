// Rest timer of the workout logger: one timer at a time, stored as an end timestamp (not a ticking counter),
// so it stays right after switching apps, locking the screen or reloading. Kept per day log in localStorage.
// When the rest is over: vibration, a short beep (if the browser allows audio) and the "ready" state.
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Rest { exLogId: number; endAt: number; total: number }
interface Stored { rest: Rest | null; ready: boolean; endedAt?: number }

const TICK_MS = 250;
// A rest that ended longer ago than this is forgotten when the logger opens again
const STALE_MS = 15 * 60 * 1000;
const key = (dayLogId: number) => `gt-rest-${dayLogId}`;

function load(dayLogId: number): Stored {
  try {
    const s = JSON.parse(localStorage.getItem(key(dayLogId)) ?? 'null') as Stored | null;
    if (!s) return { rest: null, ready: false };
    if (s.rest && s.rest.endAt > Date.now()) return s;
    // Ended while the app was closed: show the ready state straight away (unless that was long ago)
    const endedAt = s.rest ? s.rest.endAt : s.endedAt ?? 0;
    const ready = (s.ready || !!s.rest) && Date.now() - endedAt < STALE_MS;
    return { rest: null, ready, endedAt };
  } catch { return { rest: null, ready: false }; }
}

// Two short beeps; the context is unlocked by the tap that started the rest
function beep(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    void ctx.resume();
    [0, 0.22].forEach(at => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.16);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 0.18);
    });
  } catch { /* audio not allowed */ }
}

export function useRestTimer(dayLogId: number) {
  const [state, setState] = useState<Stored>(() => load(dayLogId));
  const [now, setNow] = useState(() => Date.now());
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    try { localStorage.setItem(key(dayLogId), JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [dayLogId, state]);

  const { rest } = state;
  useEffect(() => {
    if (!rest) return;
    const check = () => {
      const t = Date.now();
      setNow(t);
      if (t < rest.endAt) return;
      setState({ rest: null, ready: true, endedAt: rest.endAt });
      // Only alert when the rest ends with the app in front; coming back later just shows the ready state
      if (document.visibilityState === 'visible' && t - rest.endAt < 2000) {
        try { navigator.vibrate?.([200, 100, 200]); } catch { /* not supported */ }
        beep(audio.current);
      }
    };
    check();
    const id = window.setInterval(check, TICK_MS);
    document.addEventListener('visibilitychange', check);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', check); };
  }, [rest]);

  const start = useCallback((exLogId: number, seconds: number) => {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!audio.current && Ctx) audio.current = new Ctx();
      void audio.current?.resume();
    } catch { /* audio not allowed */ }
    const t = Date.now();
    setNow(t);
    setState({ rest: { exLogId, endAt: t + seconds * 1000, total: seconds * 1000 }, ready: false });
  }, []);
  const add = useCallback((seconds: number) => setState(s => s.rest
    ? { ...s, rest: { ...s.rest, endAt: s.rest.endAt + seconds * 1000, total: s.rest.total + seconds * 1000 } } : s), []);
  const skip = useCallback(() => setState({ rest: null, ready: false }), []);
  const dismiss = useCallback(() => setState(s => s.ready ? { rest: s.rest, ready: false } : s), []);

  useEffect(() => () => { void audio.current?.close().catch(() => {}); }, []);

  return {
    rest,
    ready: state.ready,
    remaining: rest ? Math.max(0, (rest.endAt - now) / 1000) : 0,
    progress: rest ? Math.min(1, Math.max(0, 1 - (rest.endAt - now) / rest.total)) : 0,
    start, add, skip, dismiss,
  };
}
