// Kulka, the animated pixel-art mascot (or Ariana, when the admin gave the account her: useMascotKind). Poses
// switch with CSS keyframes (one <g> per frame); movement (bob, entrances, hops) is CSS too (index.css, "Mascot").
// Tapping makes the mascot wave.
// With prefers-reduced-motion: no entrance and one static pose per state.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { prefersReducedMotion } from '../../hooks/useFirstInView';
import { framePaths, GRID_H, GRID_W, type FrameName } from './kulkaSprites';
import { useMascotKind } from './MascotContext';
import type { MascotKind } from '../../types';

interface Clip { frames: [FrameName, number][]; loop?: boolean; bob?: boolean; cls?: string }

// Workout done: curls getting faster, then tired (panting, sweat), then sitting down to rest
const curls = [520, 460, 400, 340, 280, 230, 190, 160, 135, 115, 100, 90].flatMap(ms => [['curlDown', ms], ['curlUp', ms]] as [FrameName, number][]);
const alternate = (a: FrameName, b: FrameName, ms: number, n: number) => Array.from({ length: n }, () => [[a, ms], [b, ms]] as [FrameName, number][]).flat();
const writing = (ms: number, n: number) => alternate('writeA', 'writeB', ms, n);
const panting = Array.from({ length: 4 }, () => [['tired1', 380], ['tired2', 380]] as [FrameName, number][]).flat();

const CLIPS = {
  idle: { frames: [['idle', 2600], ['blink', 140], ['idle', 1500], ['blink', 140]], loop: true, bob: true },
  press: { frames: [['press0', 450], ['press1', 230], ['press2', 320], ['press3', 300], ['press1', 200]], loop: true },
  done: { frames: [...curls, ...panting, ['rest', 1000]] },
  progressUp: { frames: [['jump', 1000]], cls: 'm-s-hop' },
  progressDown: { frames: [['sad', 1400], ['sadBlink', 140]], loop: true },
  skipped: { frames: [['bored', 2600], ['boredSigh', 700]], loop: true },
  slide: { frames: [['slide', 1000]] },
  climb: { frames: [['climb1', 220], ['climb2', 220]], loop: true },
  walk: { frames: [['walk1', 200], ['walk2', 200]], loop: true },
  run: { frames: [['run1', 110], ['run2', 110]], loop: true },
  skid: { frames: [['skid', 1000]] },
  wave: { frames: [['wave1', 200], ['wave2', 200]], loop: true },
  hang: { frames: [['hang', 1000]] },
  jump: { frames: [['jump', 1000]] },
  parachute: { frames: [['parachute', 1000]] },
  paraFold: { frames: [['paraFold', 200], ['paraBundle', 220]] },
  happy: { frames: [['idleHappy', 2600], ['blink', 140], ['idleHappy', 1500], ['blink', 140]], loop: true, bob: true },
  // Delete dialogs: unsure look at the paper, hiding it (cancel), throwing it away (confirm)
  worry: { frames: [['paperLook', 1400], ['paperWorry', 900]], loop: true },
  hide: { frames: [['paperHide', 1000]] },
  toss: { frames: [['toss', 450], ['smile', 600]] },
  walkBar: { frames: [['walkBar1', 200], ['walkBar2', 200]], loop: true },
  cheer: { frames: [['cheer', 1000]], cls: 'm-s-hop' },
  peekL: { frames: [['peekL', 1000]] },
  peekR: { frames: [['peekR', 1000]] },
  // Builder: writes, now and then looks up tapping the pencil on his chin; faster while the form changes
  build: { frames: [...writing(260, 6), ['chin1', 500], ['chin2', 180], ['chin1', 180], ['chin2', 180], ['chin1', 400]], loop: true },
  buildFast: { frames: writing(100, 1), loop: true },
  stamp: { frames: [['stampUp', 260], ['stampDown', 300], ['thumbsUp', 1000]] },
  shrug: { frames: [['shrug', 450], ['tuck', 1000]] },
  ride: { frames: [['ride', 1000]] },
  jumpH: { frames: [['jumpH', 1000]] },
  // Crane: hanging by the harness, ticking off the list, running/carrying a brick, pushing, kicking, wiping sweat
  harness: { frames: [['harness', 1000]] },
  tick: { frames: [['tick1', 700], ['tick2', 220], ['tick1', 900], ['tick2', 220], ['tick1', 500]], loop: true },
  runH: { frames: [['runH1', 110], ['runH2', 110]], loop: true },
  carry: { frames: [['carry1', 160], ['carry2', 160]], loop: true },
  pushUp: { frames: [['pushUp', 1000]] },
  pushDown: { frames: [['pushDown', 1000]] },
  kick: { frames: [['kickBack', 220], ['kickFwd', 1000]] },
  wipe: { frames: [['wipe1', 120], ['wipe2', 120], ['wipe1', 120], ['wipe2', 120], ['thumbsUpH', 1000]] },
  // Masa / Redukcja: the body is scaled up / down by CSS (index.css)
  puff: { frames: [['puff', 1000]] },
  shrink: { frames: [['shrink', 1000]] },
  // Training day: annoyed stomps, then the towel throw (TowelThrow.tsx flies it at THROW_AT_MS); a finger wag
  annoyed: { frames: [['stomp1', 170], ['stomp2', 170], ['stomp1', 170], ['stomp2', 170], ['windup', 240], ['throw', 1000]], cls: 'm-s-stomp' },
  wag: { frames: [['wagL', 150], ['wagR', 150], ['wagL', 150], ['wagR', 150], ['wagL', 200]], cls: 'm-s-shake' },
  // Weight week: notebook loop; stamping a day
  notebook: { frames: [...alternate('note1', 'note2', 230, 6), ['pocket', 500], ['peekL', 600], ['peekR', 600], ['bare', 2200], ['bareBlink', 140], ['bare', 1400]], loop: true, bob: true },
  dayStamp: { frames: [['dayStampUp', 220], ['dayStampDown', 1000]] },
  // Rest timer: sits sipping water now and then; rest over: stands up, fists up, ready
  drink: { frames: [['drinkHold', 1800], ['drinkBlink', 140], ['drinkHold', 700], ['drinkSip', 1200], ['drinkHold', 1400]], loop: true },
  ready: { frames: [['ready1', 420], ['ready2', 300]], loop: true, bob: true },
} satisfies Record<string, Clip>;

type ClipName = keyof typeof CLIPS;
export type MascotState = 'idle' | 'press' | 'done' | 'progressUp' | 'progressDown' | 'skipped' | 'slide' | 'climb' | 'walk' | 'run' | 'skid'
  | 'happy' | 'worry' | 'hide' | 'toss' | 'walkBar' | 'cheer' | 'jump'
  | 'build' | 'buildFast' | 'stamp' | 'shrug' | 'ride' | 'jumpH'
  | 'harness' | 'tick' | 'runH' | 'carry' | 'pushUp' | 'pushDown' | 'kick' | 'wipe' | 'puff' | 'shrink'
  | 'annoyed' | 'wag' | 'notebook' | 'dayStamp' | 'drink' | 'ready';
export type MascotEntrance = 'none' | 'rope' | 'run' | 'peek' | 'trampoline' | 'parachute';

// Static pose per state for reduced motion
const STATIC: Record<MascotState, FrameName> = {
  idle: 'idle', press: 'press3', done: 'rest', progressUp: 'jump', progressDown: 'sad', skipped: 'bored',
  slide: 'slide', climb: 'climb1', walk: 'walk1', run: 'run1', skid: 'skid',
  happy: 'idleHappy', worry: 'paperWorry', hide: 'paperHide', toss: 'smile', walkBar: 'walkBar1', cheer: 'cheer', jump: 'jump',
  build: 'writeA', buildFast: 'writeA', stamp: 'thumbsUp', shrug: 'tuck', ride: 'ride', jumpH: 'jumpH',
  harness: 'harness', tick: 'tick1', runH: 'runH1', carry: 'carry1', pushUp: 'pushUp', pushDown: 'pushDown', kick: 'kickFwd',
  wipe: 'thumbsUpH', puff: 'puff', shrink: 'shrink',
  annoyed: 'bored', wag: 'wagL', notebook: 'note1', dayStamp: 'dayStampDown', drink: 'drinkHold', ready: 'ready1',
};

// Entrance = timed steps of (pose clip, CSS class that moves the mascot); durations match index.css
const ENTRANCES: Record<Exclude<MascotEntrance, 'none'>, { clip: ClipName; ms: number; cls: string }[]> = {
  rope: [{ clip: 'hang', ms: 1600, cls: 'm-e-rope' }, { clip: 'jump', ms: 450, cls: 'm-e-hop' }],
  run: [{ clip: 'run', ms: 900, cls: 'm-e-run' }, { clip: 'skid', ms: 450, cls: 'm-e-skid' }],
  peek: [
    { clip: 'peekL', ms: 600, cls: 'm-e-peek' }, { clip: 'peekR', ms: 600, cls: 'm-e-peek-hold' },
    { clip: 'peekL', ms: 450, cls: 'm-e-peek-hold' }, { clip: 'jump', ms: 550, cls: 'm-e-peek-hop' },
  ],
  trampoline: [{ clip: 'jump', ms: 750, cls: 'm-e-tramp' }, { clip: 'idle', ms: 260, cls: 'm-e-land' }],
  parachute: [{ clip: 'parachute', ms: 2400, cls: 'm-e-para' }, { clip: 'paraFold', ms: 420, cls: 'm-e-land' }],
};

const WAVE_MS = 1200;
const LABEL = { kulka: 'mascot_label', ariana: 'mascot_label_ariana' } as const;

// Frame visibility keyframes per clip, injected once: each frame is shown (step-end) in its time windows
const pct = (v: number) => `${+(v * 100).toFixed(3)}%`;
function clipCss(name: string, clip: Clip): string {
  const total = clip.frames.reduce((s, [, ms]) => s + ms, 0);
  const windows = new Map<FrameName, [number, number][]>();
  let at = 0;
  clip.frames.forEach(([f, ms], i) => {
    const end = !clip.loop && i === clip.frames.length - 1 ? total : at + ms; // a one-shot clip holds its last frame
    windows.set(f, [...(windows.get(f) ?? []), [at / total, end / total]]);
    at += ms;
  });
  let css = '';
  for (const [f, ws] of windows) {
    const stops = new Map<string, number>([['0%', 0]]);
    for (const [a, b] of ws) { stops.set(pct(a), 1); if (b < 1) stops.set(pct(b), 0); }
    stops.set('100%', ws[ws.length - 1][1] >= 1 ? 1 : 0); // explicit end value, kept by "forwards"
    css += `@keyframes mk-${name}-${f}{${[...stops].map(([k, v]) => `${k}{opacity:${v}}`).join('')}}`;
    css += `.mk-${name}-${f}{opacity:0;animation:mk-${name}-${f} ${total}ms step-end ${clip.loop ? 'infinite' : '1 forwards'}}`;
  }
  return css;
}
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const el = document.createElement('style');
  el.dataset.mascot = '';
  el.textContent = Object.entries(CLIPS).filter(([, c]) => c.frames.length > 1).map(([n, c]) => clipCss(n, c)).join('');
  document.head.appendChild(el);
}

function Frame({ name, kind, cls }: { name: FrameName; kind: MascotKind; cls?: string }) {
  return <g className={cls}>{framePaths(name, kind).map(p => <path key={p.fill} fill={p.fill} d={p.d} />)}</g>;
}

// noWave: tapping does nothing (Kulka in his helmet has no waving frames); kind: a given mascot instead of the account's
export default function Mascot({ state = 'idle', entrance = 'none', size = 48, className = '', style, noWave = false, kind: kindProp }: {
  state?: MascotState; entrance?: MascotEntrance; size?: number; className?: string; style?: CSSProperties; noWave?: boolean; kind?: MascotKind;
}) {
  const { t } = useLanguage();
  const accountKind = useMascotKind();
  const kind = kindProp ?? accountKind;
  const ref = useRef<HTMLButtonElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const steps = reduced || entrance === 'none' ? [] : ENTRANCES[entrance];
  const [stepIdx, setStepIdx] = useState(0);
  const [waving, setWaving] = useState(false);
  const waveTimer = useRef<number>(undefined);
  injectStyles();

  // Distances for the entrances, measured before the first paint: to the top, left and bottom of the screen
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // On mobile the fixed top bar covers the top of the screen: entrances from above start right below it,
    // except the rope, which hangs from the very top of the screen over the bar (index.css raises it)
    const bar = document.querySelector('.topbar')?.getBoundingClientRect();
    const top = entrance !== 'rope' && bar && bar.height > 0 ? Math.max(0, bar.bottom) : 0;
    el.style.setProperty('--m-top', `${Math.round(r.bottom - top)}px`);
    el.style.setProperty('--m-left', `${Math.round(r.right)}px`);
    el.style.setProperty('--m-below', `${Math.round(window.innerHeight - r.top)}px`);
  }, [entrance]);

  // Advance the entrance steps once, on mount
  useEffect(() => {
    if (!steps.length) return;
    let i = 0;
    let timer = 0;
    const next = () => { i += 1; setStepIdx(i); if (i < steps.length) timer = window.setTimeout(next, steps[i].ms); };
    timer = window.setTimeout(next, steps[0].ms);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => window.clearTimeout(waveTimer.current), []);

  const wave = () => {
    if (reduced || noWave) return;
    setWaving(true);
    window.clearTimeout(waveTimer.current);
    waveTimer.current = window.setTimeout(() => setWaving(false), WAVE_MS);
  };

  const step = stepIdx < steps.length ? steps[stepIdx] : null;
  const clipName: ClipName = step ? step.clip : waving ? 'wave' : state;
  const clip: Clip = CLIPS[clipName];
  const names = reduced ? [STATIC[state]] : [...new Set(clip.frames.map(([f]) => f))];
  const animated = !reduced && names.length > 1;
  const moveCls = step ? step.cls : !reduced && !waving ? clip.cls ?? '' : '';

  return (
    <button ref={ref} type="button" className={`mascot m-k-${kind} ${moveCls} ${className}`} style={{ width: size, ...style }}
      onClick={wave} aria-label={t(LABEL[kind])} title={t(LABEL[kind])}>
      {entrance === 'rope' && step && <span className={`m-rope${stepIdx > 0 ? ' m-rope-up' : ''}`} aria-hidden="true" />}
      <svg viewBox={`0 0 ${GRID_W} ${GRID_H}`} width={size} height={size * GRID_H / GRID_W} shapeRendering="crispEdges" aria-hidden="true">
        {/* key restarts the frame animations whenever the clip changes */}
        <g key={`${kind}-${clipName}`} className={!reduced && clip.bob ? 'm-bob' : undefined}>
          {names.map(n => <Frame key={n} name={n} kind={kind} cls={animated ? `mk-${clipName}-${n}` : undefined} />)}
        </g>
      </svg>
    </button>
  );
}
