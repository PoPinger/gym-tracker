// Kulka, the GymTracker mascot: an original round pixel-art character with a headband. The admin can give an
// account Ariana instead (a chibi girl, see ARIANA): same poses and props, mapped onto her body.
// Every frame is composed from fill-only parts on a 24×28 grid; each part gets its own 1px outline,
// so overlapping parts stay readable. Frames are built once into one SVG path per colour.

import type { MascotKind } from '../../types';

export const GRID_W = 24;
export const GRID_H = 28;

const PAL: Record<string, string> = {
  k: '#1e1b4b', // outline
  K: '#334155', // bar, strings (no outline)
  p: '#4f46e5', P: '#3730a3', l: '#c7d2fe',
  w: '#ffffff', r: '#fb7185', y: '#f59e0b', S: '#e9a979', b: '#38bdf8',
  d: '#cbd5e1', // dust (no outline)
  g: '#94a3b8', G: '#64748b', // trash can
  Y: '#facc15', // construction helmet, excavator
  B: '#a16207', // clipboard
  e: '#22c55e', // checkmark stamp
  O: '#c2410c', // brick
  // Ariana
  h: '#b87a3d', H: '#8c5627', j: '#dca867', // hair
  n: '#2a2630', // headband
  s: '#f7c9a3', q: '#e8a882', // skin
  c: '#6e3b1b', // eyes
  v: '#8bbd6e', V: '#5e9448', // outfit
  m: '#a9de8c', // clover earrings
  u: '#f6f1e8', U: '#cfc5b6', // boots
};
const NO_OUTLINE = new Set(['K', 'd']);

type Cell = string | null;
interface Canvas { top: number; px: Cell[][] } // top: extra rows above the grid (drawn above the viewBox)
type Px = [number, number, string];
type Pt = [number, number];

const newCanvas = (w = GRID_W, h = GRID_H, top = 0): Canvas => ({ top, px: Array.from({ length: h + top }, () => Array<Cell>(w).fill(null)) });
const put = (c: Canvas, x: number, y: number, ch: string) => {
  const row = c.px[y + c.top];
  if (row && x >= 0 && x < row.length) row[x] = ch;
};

// Fill-only pixels; the 4-neighbour ring not covered by the part itself is outlined first
function layer(c: Canvas, px: Px[]) {
  const own = new Set(px.map(([x, y]) => `${x},${y}`));
  for (const [x, y, ch] of px) {
    if (NO_OUTLINE.has(ch)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!own.has(`${x + dx},${y + dy}`)) put(c, x + dx, y + dy, 'k');
  }
  for (const [x, y, ch] of px) put(c, x, y, ch);
}
function sprite(c: Canvas, rows: string[], ox: number, oy: number) {
  const px: Px[] = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px.push([x + ox, y + oy, ch]); }));
  layer(c, px);
}
// Thick polyline (square brush), used for the noodle arms and parachute strings
function limb(c: Canvas, pts: Pt[], t: number, col: string) {
  layer(c, line(pts, t, col));
}
function line(pts: Pt[], t: number, col: string): Px[] {
  const px = new Map<string, Px>();
  const o = Math.floor((t - 1) / 2);
  const brush = (x: number, y: number) => { for (let i = 0; i < t; i++) for (let j = 0; j < t; j++) px.set(`${x - o + i},${y - o + j}`, [x - o + i, y - o + j, col]); };
  for (let i = 0; i < pts.length - 1; i++) {
    let [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      brush(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  return [...px.values()];
}

/* ─────────── Parts ─────────── */
const BODY = [
  '.....pppppp.....',
  '...pppppppppp...',
  '..pppppppppppp..',
  '.yyyyyyyyyyyyyy.',
  '.yyyyyyyyyyyyyy.',
  'pppppppppppppppp',
  'pppkwppppppkwppp',
  'pppkkppppppkkppp',
  'pprrppkppkpprrpp',
  'pppppppkkppppppp',
  'ppppllllllllpppp',
  '.ppllllllllllpp.',
  '.ppllllllllllpp.',
  '..ppllllllllpp..',
  '....pppppppp....',
];
const TAIL = ['yy.', '.yy', '..y'];
const FEET: Record<string, string> = {
  stand: '...PPP....PPP...',
  tuck: '....PPP..PPP....',
  walk1: '..PPP.....PPP...',
  walk2: '...PPP.....PPP..',
  run1: '.PPP........PPP.',
  run2: '....PPPPPP......',
  skid: '.......PPP.PPP..',
  sit: '..PPPP....PPPP..',
  stomp: '...PPP..........', // right foot raised (pose.stomp)
};
const BARBELL = ['yy..................yy', 'yy..................yy', 'yyKKKKKKKKKKKKKKKKKKyy', 'SS..................SS', 'SS..................SS'];
const DUMBBELL = ['yyy', 'SSS', '.K.', '.K.', 'yyy', 'SSS'];
const CANOPY = [
  '......yyyyyyyy......',
  '...yyyyyyyyyyyyyy...',
  '.yywwyyyywwyyyywwyy.',
  'yyyyyyyyyyyyyyyyyyyy',
  'y..yy..yy..yy..yy..y',
];
const CANOPY_FOLD = [
  '...yyyyyyyy...',
  '.yyyyyyyyyyyy.',
  'yy.yy.yy.yy.yy',
];
const CANOPY_BUNDLE = ['.yyyy.', 'yywwyy', '.yyyy.'];
const PAPER = ['wwww', 'wddw', 'wwww'];
const HELMET = [
  '.....YYYYYY.....',
  '...YYYYYYYYYY...',
  '..YYYwYYYYYYYY..',
  '..YYYYYYYYYYYY..',
  'YYYYYYYYYYYYYYYY',
];
const CLIPBOARD = ['..KK..', 'BBBBBB', 'BwwwwB', 'BwddwB', 'BwwwwB', 'BwddwB', 'BBBBBB'];
const CLIPBOARD_OK = ['..KK..', 'BBBBBB', 'BwwwwB', 'BwwweB', 'BewewB', 'BwewwB', 'BBBBBB'];
const PENCIL = ['..r', '.y.', 'K..'];
const STAMP = ['KK', 'ee'];
export const BRICK = ['OOOOOOOOOOOOOO', 'OOOdOOOOOOdOOO', 'OOOOOOOOOOOOOO'];
const DROP = ['b', 'b'];
export const TOWEL = ['wwwwwwww', 'bbbbbbbb', 'wwwwwwww', 'bbbbbbbb', 'wwwwwwww', 'w.w.w.w.'];
const TOWEL_HAND = ['wwww', 'bbbb', 'wwww'];
const NOTEBOOK = ['wwKww', 'wdKdw', 'wwKdw', 'wwKww'];
export const STAMP_MARK = ['......e', '.....ee', 'e...ee.', 'ee.ee..', '.eee...', '..e....'];

type Eyes = 'open' | 'blink' | 'happy' | 'effort' | 'half' | 'lookL' | 'lookR' | 'lookUp' | 'sad' | 'angry';
type Mouth = 'smile' | 'open' | 'grit' | 'frown' | 'flat' | 'pant';
type Arms = { L: Pt[]; R: Pt[] };

interface Pose {
  sit?: boolean; feet?: keyof typeof FEET; eyes?: Eyes; mouth?: Mouth; arms?: Arms;
  bar?: boolean; dumbbell?: boolean; feetFwd?: boolean; drops?: Pt[]; dust?: boolean;
  canopy?: 'open' | 'fold' | 'bundle';
  lArmFrom?: Pt; // arm starting elsewhere than the shoulder (head-on-hand)
  noArms?: boolean; // hands behind the back
  paper?: Pt; paperBehind?: Pt; // sheet of paper (top-left), in front of or behind the body
  helmet?: boolean; harness?: boolean;
  clip?: Pt; clipOk?: boolean; clipBehind?: Pt; // clipboard (top-left), held or tucked behind the body
  pencil?: boolean; stamp?: boolean; brick?: boolean; // in the right hand (the brick in both)
  thumb?: 'L' | 'R';
  kick?: 'back' | 'fwd';
  stomp?: boolean; // right foot lifted for a stomp
  towel?: boolean; finger?: boolean; // towel in the right hand, raised index finger (right hand)
  notebook?: boolean; // small notebook held in front of the belly
  own?: boolean; front?: boolean; // skin pose overrides: coordinates already in the skin's grid; raised arms stay in front
}

function kulkaEyes(c: Canvas, bx: number, by: number, eyes: Eyes) {
  const P = (x: number, y: number, ch: string) => put(c, bx + x, by + y, ch);
  for (const ex of [3, 11]) {
    const ey = 6;
    if (eyes === 'open') continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) P(ex + dx, ey + dy, 'p');
    if (eyes === 'blink') { P(ex, ey + 1, 'k'); P(ex + 1, ey + 1, 'k'); }
    if (eyes === 'happy') { P(ex, ey + 1, 'k'); P(ex + 1, ey, 'k'); P(ex + 2, ey + 1, 'k'); }
    if (eyes === 'effort') { P(ex, ey + 1, 'k'); P(ex + 1, ey + 1, 'k'); P(ex === 3 ? ex : ex + 1, ey, 'k'); }
    if (eyes === 'half') { P(ex, ey, 'P'); P(ex + 1, ey, 'P'); P(ex, ey + 1, 'k'); P(ex + 1, ey + 1, 'k'); }
    if (eyes === 'lookL') { P(ex - 1, ey, 'k'); P(ex, ey, 'w'); P(ex - 1, ey + 1, 'k'); P(ex, ey + 1, 'k'); }
    if (eyes === 'lookR') { P(ex + 1, ey, 'k'); P(ex + 2, ey, 'w'); P(ex + 1, ey + 1, 'k'); P(ex + 2, ey + 1, 'k'); }
    if (eyes === 'lookUp') { P(ex, ey - 1, 'k'); P(ex + 1, ey - 1, 'w'); P(ex, ey, 'k'); P(ex + 1, ey, 'k'); P(ex, ey + 1, 'p'); P(ex + 1, ey + 1, 'p'); }
    if (eyes === 'sad') { P(ex === 3 ? ex + 1 : ex, ey, 'k'); P(ex, ey + 1, 'k'); P(ex + 1, ey + 1, 'k'); }
    // Brows slanting down toward the nose
    if (eyes === 'angry') { P(ex === 3 ? ex : ex + 1, ey - 1, 'k'); P(ex === 3 ? ex + 1 : ex, ey, 'k'); P(ex, ey + 1, 'k'); P(ex + 1, ey + 1, 'k'); }
  }
  if (eyes === 'sad') P(3, 8, 'b');
}
// Mouth over the face fill colour; (bx, by) as Kulka's body origin, so the mouth spans x 6–9, y 8–10
function mouthAt(c: Canvas, bx: number, by: number, mouth: Mouth, fill: string) {
  const P = (x: number, y: number, ch: string) => put(c, bx + x, by + y, ch === 'p' ? fill : ch);
  if (mouth === 'smile') return;
  for (const [x, y] of [[6, 8], [9, 8], [7, 9], [8, 9]]) P(x, y, 'p');
  if (mouth === 'open') { P(6, 9, 'k'); P(9, 9, 'k'); P(7, 9, 'r'); P(8, 9, 'r'); P(7, 10, 'k'); P(8, 10, 'k'); P(6, 10, 'p'); P(9, 10, 'p'); }
  if (mouth === 'pant') { P(7, 9, 'k'); P(8, 9, 'k'); P(7, 10, 'r'); P(8, 10, 'r'); }
  if (mouth === 'grit') { P(6, 9, 'k'); P(7, 9, 'w'); P(8, 9, 'w'); P(9, 9, 'k'); }
  if (mouth === 'frown') { P(7, 8, 'k'); P(8, 8, 'k'); P(6, 9, 'k'); P(9, 9, 'k'); }
  if (mouth === 'flat') { P(7, 9, 'k'); P(8, 9, 'k'); }
}

const last = (a: Pt[]) => a[a.length - 1];

/* ─────────── Frames ─────────── */
const IDLE_ARMS: Arms = { L: [[2, 22]], R: [[21, 22]] };
const PRESS_UP: Arms = { L: [[2, 12], [4, 4]], R: [[21, 12], [19, 4]] };
const BAR_CHEST: Arms = { L: [[1, 23], [3, 21]], R: [[22, 23], [20, 21]] };
const PAPER_UP: Arms = { L: [[2, 22]], R: [[22, 18], [21, 15]] };
// Builder (helmet + clipboard held in front of the belly by the left hand); the right hand writes
const CLIP: Pt = [9, 21];
const HOLD: Pt[] = [[8, 25]];
const write = (h: Pt): Arms => ({ L: HOLD, R: [[17, 24], h] });
const B = { helmet: true } as const;
const BW = { ...B, clip: CLIP, pencil: true } as const;
const POSES = {
  idle: { arms: IDLE_ARMS, dumbbell: true },
  blink: { arms: IDLE_ARMS, dumbbell: true, eyes: 'blink' },
  wave1: { arms: { L: [[1, 16], [1, 12]], R: [[21, 22]] }, dumbbell: true, eyes: 'happy', mouth: 'open' },
  wave2: { arms: { L: [[1, 16], [3, 12]], R: [[21, 22]] }, dumbbell: true, eyes: 'happy', mouth: 'open' },
  press0: { arms: { L: [[1, 23], [3, 21]], R: [[22, 23], [20, 21]] }, bar: true },
  press1: { arms: { L: [[1, 14], [2, 9]], R: [[22, 14], [21, 9]] }, bar: true, eyes: 'effort', mouth: 'grit' },
  press2: { arms: PRESS_UP, bar: true, eyes: 'effort', mouth: 'grit' },
  press3: { arms: PRESS_UP, bar: true, eyes: 'happy' },
  curlDown: { arms: IDLE_ARMS, dumbbell: true, eyes: 'effort' },
  curlUp: { arms: { L: [[2, 22]], R: [[23, 21], [21, 16]] }, dumbbell: true, eyes: 'effort', mouth: 'grit' },
  tired1: { arms: { L: [[3, 24]], R: [[20, 24]] }, dumbbell: true, eyes: 'blink', mouth: 'pant', drops: [[2, 12], [21, 15]] },
  tired2: { arms: { L: [[3, 24]], R: [[20, 24]] }, dumbbell: true, eyes: 'half', mouth: 'open', drops: [[2, 14], [21, 17], [1, 9]] },
  rest: { sit: true, arms: { L: [[3, 25]], R: [[20, 25]] }, eyes: 'blink' },
  jump: { feet: 'tuck', arms: { L: [[2, 15], [1, 11]], R: [[21, 15], [22, 11]] }, dumbbell: true, eyes: 'happy', mouth: 'open' },
  sad: { arms: { L: [[3, 24]], R: [[20, 24]] }, dumbbell: true, eyes: 'sad', mouth: 'frown' },
  sadBlink: { arms: { L: [[3, 24]], R: [[20, 24]] }, dumbbell: true, eyes: 'blink', mouth: 'frown' },
  bored: { sit: true, lArmFrom: [3, 26], arms: { L: [[5, 21]], R: [[20, 25]] }, eyes: 'half', mouth: 'flat' },
  boredSigh: { sit: true, lArmFrom: [3, 26], arms: { L: [[5, 21]], R: [[20, 25]] }, eyes: 'blink', mouth: 'pant' },
  slide: { sit: true, feetFwd: true, arms: { L: [[2, 17], [2, 13]], R: [[21, 17], [21, 13]] }, eyes: 'happy', mouth: 'open' },
  climb1: { feet: 'walk1', arms: { L: [[2, 16], [3, 12]], R: [[21, 22]] }, dumbbell: true, mouth: 'grit' },
  climb2: { feet: 'walk2', arms: { L: [[2, 22]], R: [[22, 16], [21, 12]] }, mouth: 'grit' },
  walk1: { feet: 'walk1', arms: { L: [[2, 21]], R: [[21, 23]] }, dumbbell: true },
  walk2: { feet: 'walk2', arms: { L: [[3, 23]], R: [[21, 21]] }, dumbbell: true },
  run1: { feet: 'run1', arms: { L: [[1, 18]], R: [[22, 23]] }, mouth: 'open' },
  run2: { feet: 'run2', arms: { L: [[2, 23]], R: [[22, 18]] }, mouth: 'open' },
  skid: { feet: 'skid', arms: { L: [[1, 17]], R: [[22, 17]] }, eyes: 'effort', mouth: 'grit', dust: true },
  hang: { arms: { L: [[7, 14], [11, 6]], R: [[16, 14], [12, 9]] }, eyes: 'happy' },
  parachute: { canopy: 'open', arms: { L: [[5, 12]], R: [[18, 12]] }, eyes: 'happy' },
  paraFold: { canopy: 'fold', arms: { L: [[6, 13]], R: [[17, 13]] }, eyes: 'happy' },
  paraBundle: { canopy: 'bundle', arms: IDLE_ARMS, eyes: 'blink' },
  idleHappy: { arms: IDLE_ARMS, dumbbell: true, eyes: 'happy' },
  smile: { arms: IDLE_ARMS, eyes: 'happy' },
  paperLook: { arms: PAPER_UP, paper: [20, 11], eyes: 'lookR', mouth: 'flat' },
  paperWorry: { arms: PAPER_UP, paper: [20, 11], mouth: 'flat', drops: [[1, 12]] },
  paperHide: { noArms: true, paperBehind: [19, 17], eyes: 'happy' },
  toss: { arms: { L: [[2, 22]], R: [[22, 15], [23, 10]] }, eyes: 'happy', mouth: 'open' },
  walkBar1: { feet: 'walk1', arms: BAR_CHEST, bar: true },
  walkBar2: { feet: 'walk2', arms: BAR_CHEST, bar: true },
  cheer: { feet: 'tuck', arms: PRESS_UP, bar: true, eyes: 'happy', mouth: 'open' },
  peekL: { arms: IDLE_ARMS, eyes: 'lookL' },
  peekR: { arms: IDLE_ARMS, eyes: 'lookR' },
  // Builder (Edytuj plan, cycle duration)
  writeA: { ...BW, arms: write([14, 23]), eyes: 'lookR' },
  writeB: { ...BW, arms: write([15, 22]), eyes: 'lookR' },
  chin1: { ...BW, arms: { L: HOLD, R: [[19, 22], [16, 21]] }, eyes: 'lookUp' },
  chin2: { ...BW, arms: { L: HOLD, R: [[19, 22], [16, 20]] }, eyes: 'lookUp', mouth: 'flat' },
  stampUp: { ...B, clip: CLIP, stamp: true, arms: { L: HOLD, R: [[21, 16], [17, 13]] }, eyes: 'effort', mouth: 'grit' },
  stampDown: { ...B, clip: CLIP, clipOk: true, stamp: true, arms: { L: HOLD, R: [[18, 22], [14, 20]] }, eyes: 'happy', mouth: 'open' },
  thumbsUp: { ...B, clip: CLIP, clipOk: true, thumb: 'R', arms: { L: HOLD, R: [[22, 16], [22, 13]] }, eyes: 'happy', mouth: 'open' },
  shrug: { ...B, clipBehind: [18, 18], arms: { L: [[1, 19], [0, 16]], R: [[22, 19], [23, 16]] }, eyes: 'half', mouth: 'flat' },
  tuck: { ...B, clipBehind: [18, 18], arms: IDLE_ARMS, eyes: 'half', mouth: 'flat' },
  ride: { ...B, sit: true, arms: { L: [[2, 18], [1, 15]], R: [[21, 18], [22, 15]] }, eyes: 'happy', mouth: 'open' },
  jumpH: { ...B, feet: 'tuck', arms: { L: [[2, 15], [1, 11]], R: [[21, 15], [22, 11]] }, eyes: 'happy', mouth: 'open' },
  // Crane (exercise editor)
  harness: { ...B, harness: true, arms: { L: [[7, 13], [11, 8]], R: [[16, 13], [12, 8]] }, eyes: 'happy' },
  tick1: { ...BW, sit: true, arms: write([14, 23]), eyes: 'lookR' },
  tick2: { ...BW, sit: true, arms: write([13, 24]), eyes: 'lookR', mouth: 'flat' },
  runH1: { ...B, feet: 'run1', arms: { L: [[1, 18]], R: [[22, 23]] }, mouth: 'open' },
  runH2: { ...B, feet: 'run2', arms: { L: [[2, 23]], R: [[22, 18]] }, mouth: 'open' },
  carry1: { ...B, feet: 'walk1', brick: true, arms: { L: [[2, 12], [4, 5]], R: [[21, 12], [19, 5]] }, eyes: 'effort', mouth: 'grit' },
  carry2: { ...B, feet: 'walk2', brick: true, arms: { L: [[2, 12], [4, 6]], R: [[21, 12], [19, 6]] }, eyes: 'effort', mouth: 'grit' },
  pushUp: { ...B, arms: { L: [[2, 12], [4, 6]], R: [[21, 12], [19, 6]] }, eyes: 'effort', mouth: 'grit', drops: [[1, 14]] },
  pushDown: { ...B, feet: 'skid', arms: { L: [[1, 24], [2, 27]], R: [[22, 24], [21, 27]] }, eyes: 'effort', mouth: 'grit', drops: [[22, 13]] },
  kickBack: { ...B, feet: 'tuck', kick: 'back', arms: { L: [[1, 17]], R: [[22, 20]] }, eyes: 'effort', mouth: 'grit' },
  kickFwd: { ...B, feet: 'tuck', kick: 'fwd', arms: { L: [[1, 20]], R: [[22, 17]] }, eyes: 'happy', mouth: 'open' },
  wipe1: { ...B, arms: { L: [[3, 16], [6, 14]], R: IDLE_ARMS.R }, eyes: 'blink', mouth: 'pant', drops: [[20, 13]] },
  wipe2: { ...B, arms: { L: [[4, 15], [12, 14]], R: IDLE_ARMS.R }, eyes: 'half', mouth: 'pant', drops: [[21, 15]] },
  thumbsUpH: { ...B, thumb: 'L', arms: { L: [[2, 16], [2, 13]], R: IDLE_ARMS.R }, eyes: 'happy', mouth: 'open' },
  // Masa / Redukcja (the body is scaled by CSS)
  puff: { arms: { L: [[1, 21]], R: [[22, 21]] }, eyes: 'blink', mouth: 'flat' },
  shrink: { arms: { L: [[3, 23]], R: [[20, 23]] }, eyes: 'open', mouth: 'open' },
  // Training day skipped: stomps (fists on the hips), winds up and throws the towel; one exercise skipped: wags a finger
  stomp1: { stomp: true, feet: 'stomp', arms: { L: [[1, 19], [3, 23]], R: [[22, 19], [20, 23]] }, eyes: 'angry', mouth: 'frown' },
  stomp2: { arms: { L: [[1, 19], [3, 23]], R: [[22, 19], [20, 23]] }, eyes: 'angry', mouth: 'frown', dust: true },
  windup: { towel: true, arms: { L: [[1, 19], [3, 23]], R: [[22, 15], [21, 10]] }, eyes: 'angry', mouth: 'grit' },
  throw: { feet: 'skid', arms: { L: [[1, 19], [3, 23]], R: [[21, 19], [17, 19]] }, eyes: 'angry', mouth: 'open' },
  wagL: { finger: true, arms: { L: IDLE_ARMS.L, R: [[22, 18], [21, 15]] }, eyes: 'lookL', mouth: 'frown' },
  wagR: { finger: true, arms: { L: IDLE_ARMS.L, R: [[22, 18], [23, 15]] }, eyes: 'lookR', mouth: 'frown' },
  // Weight week: writes in a notebook, pockets it, looks around; stamps a confirmed day
  note1: { notebook: true, pencil: true, arms: write([14, 23]), eyes: 'lookR' },
  note2: { notebook: true, pencil: true, arms: write([15, 22]), eyes: 'lookR' },
  pocket: { arms: { L: IDLE_ARMS.L, R: [[20, 24], [17, 25]] }, eyes: 'happy' },
  bare: { arms: IDLE_ARMS },
  bareBlink: { arms: IDLE_ARMS, eyes: 'blink' },
  dayStampUp: { stamp: true, arms: { L: IDLE_ARMS.L, R: [[21, 16], [18, 12]] }, eyes: 'effort', mouth: 'grit' },
  dayStampDown: { stamp: true, arms: { L: IDLE_ARMS.L, R: [[21, 22], [19, 24]] }, eyes: 'happy', mouth: 'open' },
} satisfies Record<string, Pose>;

export type FrameName = keyof typeof POSES;
export interface FramePath { fill: string; d: string }

/* ─────────── Skins: the same poses and props, drawn as a different character ─────────── */
// Pose coordinates are on Kulka's grid; a skin maps them onto its own body (identity for Kulka).
interface Skin {
  top: number; // extra canvas rows above the grid, for props over a tall head (the svg overflows upwards)
  up: number; // vertical shift of the parachute, which hangs over the head
  map: (p: Pt) => Pt; // arm points (Kulka grid) → this skin
  drop: (p: Pt) => Pt; // sweat drops
  shoulders: [Pt, Pt]; // standing; sitting drops them by 1
  arm: string; hand: string;
  raisedBehind?: boolean; // arms raised above the shoulders go behind the head and hair
  helmet: Pt; // standing
  harness: (by: number) => Pt[];
  body: (c: Canvas, pose: Pose, by: number) => void; // body + feet
  face: (c: Canvas, pose: Pose, by: number) => void;
  poses?: Partial<Record<FrameName, Pose>>; // per-pose changes, in the skin's own coordinates (pose.own)
}

const KULKA: Skin = {
  top: 0, up: 0, map: p => p, drop: p => p, shoulders: [[4, 20], [19, 20]], arm: 'p', hand: 'p',
  helmet: [4, 9], harness: by => [[6, by + 4], [12, by - 3], [17, by + 4]],
  body(c, pose, by) {
    const bx = 4;
    sprite(c, BODY, bx, by);
    sprite(c, TAIL, bx + 16, by + 3);
    if (pose.sit) sprite(c, [FEET.sit], bx, by + 14);
    else sprite(c, [FEET[pose.feet ?? 'stand']], bx, by + 15);
    if (pose.feetFwd) sprite(c, ['PP', 'PP'], bx + 15, by + 12);
    if (pose.kick === 'back') sprite(c, ['PP'], bx - 2, by + 13);
    if (pose.kick === 'fwd') sprite(c, ['PPP'], bx + 15, by + 12);
    if (pose.stomp) sprite(c, ['PPP'], bx + 10, by + 13);
  },
  face(c, pose, by) {
    kulkaEyes(c, 4, by, pose.eyes ?? 'open');
    mouthAt(c, 4, by, pose.mouth ?? 'smile', 'p');
  },
};

// Ariana: a chibi girl (about 2.5 heads tall) with long wavy hair, a high ponytail, a black headband,
// clover earrings, a green crop top + skirt and white boots. Parts in absolute columns, rows for standing.
const ARIANA_HAIR = [ // behind everything, from row 6
  '....hhhhhhhhhhhhhhhh....',
  '...hhhhhhhhhhhhhhhhhh...',
  '...hhhhhhhhhhhhhhhhhh...',
  '...hhhhhhhhhhhhhhhhhh...',
  '..hhhhhhhhhhhhhhhhhhhh..',
  '..hhhhhhhhhhhhhhhhhhhh..',
  '..hhhhhhhhhhhhhhhhhhhh..',
  '..hhhhhhhhhhhhhhhhhhhh..',
  '..hHjhhhhhhhhhhhhhhjHh..', // 14
  '..hHjhhhhhhhhhhhhhhjHh..',
  '..hhHjhhhhhhhhhhhhjHhh..',
  '.hhhHjhhhhhhhhhhhhjHhhh.',
  '.hhHjhhhhhhhhhhhhhhjHhh.',
  '.hhHjhh..........hhjHhh.',
  '.hHjhh............hhjHh.',
  '..hh.h............h.hh..', // 21
];
const ARIANA_HEAD = [ // from row 0
  '..........hhhhh.........',
  '........hhjjhhhhH.......',
  '......hhhjjhhhhhhh......',
  '.....hjjhhhhhhhhhhh.....',
  '....hhnnnnnnnnnnnnhh....',
  '....hnnnnnnnnnnnnnnh....',
  '....hhhjjhhhhhhhhhhh....',
  '...hhhhhhjjhhhsssshhh...',
  '...hhhh' + 's'.repeat(11) + 'hhh...',
  '...hhh' + 's'.repeat(12) + 'hhh...',
  '...hjh' + 's'.repeat(12) + 'hjh...',
  '...hmhsr' + 's'.repeat(8) + 'rshmh...',
  '...hmh' + 's'.repeat(12) + 'hmh...',
  '...hhhh.' + 's'.repeat(8) + '.hhhh...',
];
const ARIANA_TORSO = [ // from row 14
  '..........ssss..........',
  '.......vvvssssvvv.......',
  '.......vvvvvvvvvv.......',
  '........vvvUUvvv........',
  '.........ssssss.........',
  '........VvvvvvvV........',
  '.......VvvvvvvvvV.......',
];
// Kulka-grid y → Ariana rows (knots, linear in between): overhead, head top, eyes, shoulders, hands, feet
const ARIANA_Y: [number, number][] = [[0, -6], [4, -3], [6, -2], [9, -1], [11, 1], [12, 3], [14, 7], [17, 12], [20, 15], [22, 18], [24, 21], [25, 22], [27, 26]];
function arianaY(y: number): number {
  for (let i = 1; i < ARIANA_Y.length; i++) {
    const [a, A] = ARIANA_Y[i - 1], [b, B] = ARIANA_Y[i];
    if (y <= b) return Math.round(A + (B - A) * (y - a) / (b - a));
  }
  return y;
}
// Feet of a FEET row (absolute centres); a 6-wide run is two feet side by side
function feetCentres(row: string): number[] {
  const out: number[] = [];
  row.replace(/P+/g, (run, i: number) => {
    const n = run.length > 3 ? 2 : 1, w = run.length / n;
    for (let k = 0; k < n; k++) out.push(4 + i + k * w + (w - 1) / 2);
    return run;
  });
  return out;
}
// Leg from the hip under the skirt to a white boot standing at (x, y = sole row); toe points outwards
function arianaLeg(hip: Pt, x: number, y: number, left: boolean): Px[] {
  const boot = left ? ['.uu', '.uu', '.uU', 'uuU'] : ['uu.', 'uu.', 'Uu.', 'Uuu'];
  const bx = left ? x - 1 : x;
  return [...line([hip, [x, y - 3]], 2, 's'), ...boot.flatMap((r, j) => [...r].flatMap((ch, i): Px[] => ch === '.' ? [] : [[bx + i, y - 3 + j, ch]]))];
}
const ARIANA_EYES: [number, 1 | -1][] = [[8, -1], [14, 1]];
const ARIANA: Skin = {
  top: 8, up: -9,
  map: ([x, y]) => [Math.round(11.5 + (x - 11.5) * (y < 17 ? 1 : 0.7)), arianaY(y)],
  drop: ([x, y]) => [x, arianaY(y)],
  shoulders: [[7, 15], [15, 15]], arm: 'v', hand: 's', raisedBehind: true,
  helmet: [4, 0], harness: by => [[8, by + 5], [12, -3], [15, by + 5]],
  body(c, pose, by) {
    const dy = by - 11;
    sprite(c, ARIANA_HAIR, 0, 6 + dy);
    // Both legs are one part, so the outline between them is a single line
    const [l, r] = feetCentres(FEET[pose.sit ? 'sit' : pose.feet ?? 'stand']).map((cx, i) => Math.floor(11.5 + (cx - 11.5) * 0.7) - i);
    const hl: Pt = [9, 20 + dy], hr: Pt = [12, 20 + dy];
    const legs: Px[] = [];
    if (pose.kick === 'back') legs.push(...arianaLeg(hl, 5, 24, true));
    else if (l !== undefined) legs.push(...arianaLeg(hl, l, 26, true));
    if (pose.kick === 'fwd' || pose.feetFwd) legs.push(...arianaLeg(hr, 17, 24, false));
    else if (pose.stomp) legs.push(...arianaLeg(hr, 14, 23, false));
    else if (r !== undefined) legs.push(...arianaLeg(hr, r, 26, false));
    layer(c, legs);
    sprite(c, ARIANA_TORSO, 0, 14 + dy);
    sprite(c, ARIANA_HEAD, 0, dy);
  },
  face(c, pose, by) {
    const dy = by - 11, eyes = pose.eyes ?? 'open';
    const P = (x: number, y: number, ch: string) => put(c, x, y + dy, ch);
    for (const [ex, side] of ARIANA_EYES) {
      const ey = 9, outer = side < 0 ? ex - 1 : ex + 2, inner = side < 0 ? ex + 1 : ex;
      const lash = (flick = true) => { P(ex, ey - 1, 'k'); P(ex + 1, ey - 1, 'k'); if (flick) P(outer, ey - 1, 'k'); };
      const iris = (a: string, b: string, cc: string, d: string) => { P(ex, ey, a); P(ex + 1, ey, b); P(ex, ey + 1, cc); P(ex + 1, ey + 1, d); };
      if (eyes === 'open') { lash(); iris('c', 'w', 'c', 'c'); }
      if (eyes === 'blink') { P(ex, ey + 1, 'k'); P(ex + 1, ey + 1, 'k'); P(outer, ey, 'k'); }
      if (eyes === 'happy') { P(ex, ey, 'k'); P(ex + 1, ey, 'k'); P(ex - 1, ey + 1, 'k'); P(ex + 2, ey + 1, 'k'); }
      if (eyes === 'effort') { P(ex, ey + 1, 'k'); P(ex + 1, ey + 1, 'k'); P(side < 0 ? ex : ex + 1, ey, 'k'); P(outer, ey - 1, 'k'); }
      if (eyes === 'half') { P(ex, ey, 'k'); P(ex + 1, ey, 'k'); P(outer, ey, 'k'); P(ex, ey + 1, 'c'); P(ex + 1, ey + 1, 'c'); }
      if (eyes === 'lookL') { lash(); iris('c', 'w', 'c', 'w'); }
      if (eyes === 'lookR') { lash(); iris('w', 'c', 'w', 'c'); }
      if (eyes === 'lookUp') { lash(); iris('c', 'c', 'w', 'w'); }
      if (eyes === 'sad') { lash(false); P(inner, ey - 2, 'k'); iris('c', 'w', 'c', 'c'); }
      if (eyes === 'angry') { P(outer, ey - 2, 'k'); P(inner, ey - 1, 'k'); P(side < 0 ? ex : ex + 1, ey - 1, 'k'); iris('c', 'c', 'c', 'c'); }
    }
    if (eyes === 'sad') P(8, 11, 'b');
    const mouth = pose.mouth ?? 'smile';
    if (mouth === 'smile') for (const [x, y] of [[10, 11], [13, 11], [11, 12], [12, 12]]) P(x, y, 'k');
    else mouthAt(c, 4, 3 + dy, mouth, 's');
  },
  poses: {
    hang: { own: true, arms: { L: [[6, 8], [11, -3]], R: [[17, 8], [12, -1]] }, eyes: 'happy' },
    harness: { helmet: true, harness: true, own: true, arms: { L: [[8, 18], [9, 17]], R: [[15, 18], [14, 17]] }, eyes: 'happy' },
    paperLook: { front: true, arms: PAPER_UP, paper: [20, 11], eyes: 'lookR', mouth: 'flat' },
    paperWorry: { front: true, arms: PAPER_UP, paper: [20, 11], mouth: 'flat', drops: [[1, 12]] },
    bored: { sit: true, own: true, arms: { L: [[5, 19], [8, 14]], R: [[17, 22]] }, eyes: 'half', mouth: 'flat' },
    boredSigh: { sit: true, own: true, arms: { L: [[5, 19], [8, 14]], R: [[17, 22]] }, eyes: 'blink', mouth: 'pant' },
    wipe1: { helmet: true, own: true, front: true, arms: { L: [[4, 12], [7, 7]], R: [[18, 18]] }, eyes: 'blink', mouth: 'pant', drops: [[20, 5]] },
    wipe2: { helmet: true, own: true, front: true, arms: { L: [[5, 11], [12, 7]], R: [[18, 18]] }, eyes: 'half', mouth: 'pant', drops: [[21, 7]] },
  },
};

const SKINS: Record<MascotKind, Skin> = { kulka: KULKA, ariana: ARIANA };

function compose(pose: Pose, sk: Skin): Canvas {
  const c = newCanvas(GRID_W, GRID_H, sk.top);
  const by = pose.sit ? 12 : 11, dy = by - 11, up = sk.up;
  const M = pose.own ? (p: Pt) => p : sk.map;
  const U = ([x, y]: Pt): Pt => [x, y + up];
  if (pose.canopy === 'open') {
    sprite(c, CANOPY, 2, up);
    limb(c, [U([3, 5]), M([5, 12])], 1, 'K');
    limb(c, [U([20, 5]), M([18, 12])], 1, 'K');
  }
  if (pose.canopy === 'fold') {
    sprite(c, CANOPY_FOLD, 5, 3 + up);
    limb(c, [U([5, 6]), M([6, 12])], 1, 'K');
    limb(c, [U([18, 6]), M([17, 12])], 1, 'K');
  }
  if (pose.canopy === 'bundle') sprite(c, CANOPY_BUNDLE, 9, 7 + up);
  if (pose.paperBehind) sprite(c, PAPER, ...pose.paperBehind);
  if (pose.clipBehind) sprite(c, CLIPBOARD, ...pose.clipBehind);
  if (pose.harness) limb(c, sk.harness(by), 1, 'K');
  const arms = pose.arms ?? { L: [[2, 22]], R: [[21, 22]] };
  const L = arms.L.map(M), R = arms.R.map(M);
  const [[slx, sly], [srx, sry]] = sk.shoulders;
  const shL: Pt = pose.lArmFrom ? M(pose.lArmFrom) : [slx, sly + dy], shR: Pt = [srx, sry + dy];
  const hl = last(L), hr = last(R);
  const H2 = sk.hand.repeat(2);
  const hand = (h: Pt) => sprite(c, [H2, H2], h[0], h[1] - 1);
  const behind = (h: Pt, s: Pt) => !!sk.raisedBehind && !pose.front && h[1] < s[1] - 3;
  const lb = behind(hl, shL), rb = behind(hr, shR);
  if (!pose.noArms) {
    if (lb) { limb(c, [shL, ...L], 2, sk.arm); hand(hl); }
    if (rb) { limb(c, [shR, ...R], 2, sk.arm); hand(hr); }
  }
  sk.body(c, pose, by);
  sk.face(c, pose, by);
  if (pose.helmet) sprite(c, HELMET, sk.helmet[0], sk.helmet[1] + dy);
  if (!pose.noArms) {
    if (!lb) limb(c, [shL, ...L], 2, sk.arm);
    if (!rb) limb(c, [shR, ...R], 2, sk.arm);
    // Props held in a hand keep their offset to that hand
    const near = ([x, y]: Pt, k: Pt, h: Pt): Pt => [x + h[0] - k[0], y + h[1] - k[1]];
    const kl = pose.own ? hl : last(arms.L), kr = pose.own ? hr : last(arms.R);
    if (pose.bar) sprite(c, BARBELL, 1, hl[1] - 2);
    if (pose.dumbbell) sprite(c, DUMBBELL, hr[0] - 1, hr[1] - 2);
    if (pose.paper) sprite(c, PAPER, ...near(pose.paper, kr, hr));
    if (pose.clip) sprite(c, pose.clipOk ? CLIPBOARD_OK : CLIPBOARD, ...near(pose.clip, kl, hl));
    if (pose.brick) sprite(c, BRICK, 5, hl[1] - 3);
    if (pose.notebook) sprite(c, NOTEBOOK, ...near([9, 22], kl, hl));
    if (!lb) hand(hl);
    if (!rb) hand(hr);
    if (pose.pencil) sprite(c, PENCIL, hr[0] - 2, hr[1] - 3);
    if (pose.stamp) sprite(c, STAMP, hr[0], hr[1] + 1);
    if (pose.towel) sprite(c, TOWEL_HAND, hr[0] - 1, hr[1] - 4);
    if (pose.finger) sprite(c, [sk.hand, sk.hand, sk.hand], hr[0], hr[1] - 4);
    if (pose.thumb) { const h = pose.thumb === 'L' ? hl : hr; sprite(c, [sk.hand, sk.hand], h[0], h[1] - 3); }
  }
  for (const d of pose.drops ?? []) sprite(c, DROP, ...(pose.own ? d : sk.drop(d)));
  if (pose.dust) { sprite(c, ['.dd', 'dddd'], 0, 25); sprite(c, ['d'], 3, 23); }
  return c;
}


// One path per colour: horizontal runs of equal pixels as 1px-high rectangles
function toPaths(c: Canvas): FramePath[] {
  const byColor = new Map<string, string>();
  c.px.forEach((row, i) => {
    const y = i - c.top;
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (!ch) { x++; continue; }
      let e = x;
      while (e + 1 < row.length && row[e + 1] === ch) e++;
      byColor.set(ch, (byColor.get(ch) ?? '') + `M${x} ${y}h${e - x + 1}v1h${-(e - x + 1)}z`);
      x = e + 1;
    }
  });
  return [...byColor].map(([ch, d]) => ({ fill: PAL[ch], d }));
}

const poseOf = (name: FrameName, sk: Skin) => ({ ...POSES[name], ...sk.poses?.[name] }) as Pose;

const cache = new Map<string, FramePath[]>();
export function framePaths(name: FrameName, kind: MascotKind = 'kulka'): FramePath[] {
  const key = `${kind}:${name}`;
  let f = cache.get(key);
  if (!f) {
    const sk = SKINS[kind];
    f = toPaths(compose(poseOf(name, sk), sk));
    cache.set(key, f);
  }
  return f;
}

// Grid cell of a frame's hand, for props placed next to it outside the sprite (e.g. the stamp mark)
export function handCell(name: FrameName, kind: MascotKind, side: 'L' | 'R'): Pt {
  const sk = SKINS[kind], pose = poseOf(name, sk);
  const pts = (pose.arms ?? IDLE_ARMS)[side];
  return (pose.own ? (p: Pt) => p : sk.map)(last(pts));
}

// First grid row of the head (its outline), per mascot: the rows above it are empty in most frames
export const HEAD_ROW: Record<MascotKind, number> = { kulka: 10, ariana: -1 };

// Standalone props drawn in Kulka's style (outlined, same palette), e.g. the trash can of the delete dialogs
export function propPaths(rows: string[]): { w: number; h: number; paths: FramePath[] } {
  const w = Math.max(...rows.map(r => r.length)) + 2, h = rows.length + 2;
  const c = newCanvas(w, h);
  sprite(c, rows, 1, 1);
  return { w, h, paths: toPaths(c) };
}

// Excavator of the builder entrance, without its bucket (a separate prop drawn in front of Kulka).
// Grid 39×31 cells; the stick ends at the bucket's hinge: EXC_BUCKET_UP / EXC_BUCKET_DOWN (bucket top-left).
export const EXC_W = 39, EXC_H = 31;
export const EXC_BUCKET_UP: Pt = [26, 10], EXC_BUCKET_DOWN: Pt = [26, 23];
export const EXC_BUCKET = ['Y..........Y', 'YYYYYYYYYYYY', 'YYYYYYYYYYYY', '.YYYYYYYYYY.', '..GGGGGGGG..'];
export function excavatorPaths(down: boolean): FramePath[] {
  const c = newCanvas(EXC_W, EXC_H);
  const [bx, by] = down ? EXC_BUCKET_DOWN : EXC_BUCKET_UP;
  limb(c, [[15, 19], down ? [24, 13] : [25, 8], [bx + 6, by + 1]], 3, 'Y');
  sprite(c, ['K', 'K', 'K'], 11, 10);
  sprite(c, ['YYYYYYYYY', 'YbbbbbYYY', 'YbbbbbYYY', 'YbbbbbYYY', 'YYYYYYYYY', 'YYYYYYYYY', 'YYYYYYYYY', 'YYYYYYYYY'], 3, 13);
  sprite(c, ['YYYYYYYYYYYYYYYYYY', 'YYYYYYYYYYYYYYYYYY', 'YYYYYYYYYYYYYYYYYY', 'YYYYYYYYYYYYYYYYYY', 'KKKKKKKKKKKKKKKKKK'], 2, 21);
  sprite(c, ['.GGGGGGGGGGGGGGGGGG.', 'GgKggKggKggKggKggKgG', '.GGGGGGGGGGGGGGGGGG.'], 1, 26);
  return toPaths(c);
}
