import { TOWERS, FLOOR_H, planToWorld } from './layout';

export type V3 = [number, number, number];
export type Cam = { pos: V3; target: V3; fov: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const mixCam = (a: Cam, b: Cam, t: number): Cam => {
  const e = ease(t);
  return {
    pos: [lerp(a.pos[0], b.pos[0], e), lerp(a.pos[1], b.pos[1], e), lerp(a.pos[2], b.pos[2], e)],
    target: [lerp(a.target[0], b.target[0], e), lerp(a.target[1], b.target[1], e), lerp(a.target[2], b.target[2], e)],
    fov: lerp(a.fov, b.fov, e),
  };
};

const T1 = TOWERS[0];
/** Centre of the five towers in plan. */
const CLUSTER = TOWERS.reduce((c, t) => [c[0] + t.centre[0] / TOWERS.length, c[1] + t.centre[1] / TOWERS.length], [0, 0]);
export const SPLIT_LEVEL = 11;
export const CUT_Y = SPLIT_LEVEL * FLOOR_H;
const t1c = T1.core.centre;

/** Keyframes for "Bungalows in the air" (progress 0–1 through the pinned section). */
const BUNGALOW: Cam[] = [
  { pos: [t1c[0] - 120, 72, t1c[1] + 150], target: [t1c[0], 32, t1c[1]], fov: 30 },
  { pos: [t1c[0] - 58, 50, t1c[1] + 70], target: [t1c[0], CUT_Y + 2, t1c[1]], fov: 32 },
  { pos: [t1c[0] - 34, CUT_Y + 46, t1c[1] + 52], target: [t1c[0] + 2, CUT_Y + 3, t1c[1]], fov: 34 },
  { pos: [t1c[0] - 22, 14, t1c[1] + 46], target: [t1c[0], -2, t1c[1]], fov: 38 },
  { pos: [t1c[0] - 16, -1.2, t1c[1] + 22], target: [t1c[0] + 1, -3.4, t1c[1]], fov: 44 },
];
// Progress at which each keyframe is reached.
const BUNGALOW_AT = [0, 0.22, 0.52, 0.8, 1];

export function bungalowCam(p: number): Cam {
  for (let i = 0; i < BUNGALOW_AT.length - 1; i++) {
    if (p <= BUNGALOW_AT[i + 1]) return mixCam(BUNGALOW[i], BUNGALOW[i + 1], seg(p, BUNGALOW_AT[i], BUNGALOW_AT[i + 1]));
  }
  return BUNGALOW.at(-1)!;
}

/** How far the upper floors of Tower 1 have lifted (metres), and how visible the plate and basement are. */
export function bungalowState(p: number) {
  return {
    lift: ease(seg(p, 0.18, 0.46)) * 15,
    plate: ease(seg(p, 0.26, 0.42)) * (1 - seg(p, 0.86, 0.95)),
    basement: ease(seg(p, 0.66, 0.84)),
  };
}

const fountain = planToWorld([0.21, 0.534]);
const lagoon = planToWorld([0.56, 0.47]);
const gardens = planToWorld([0.48, 0.66]);
const shops = planToWorld([0.86, 0.66]);

export const EXPLORER: (Cam & { title: string; kicker: string; keys: string[] })[] = [
  {
    title: 'Full View',
    kicker: 'Complete site overview',
    keys: [],
    pos: [150, 150, 205],
    target: [0, 8, 0],
    fov: 30,
  },
  {
    title: 'Grand Piazza Arrival',
    kicker: 'Guard house, piazza and drop-off',
    keys: ['A', 'B', 'C', 'E', 'H'],
    pos: [fountain[0] - 62, 26, fountain[1] + 58],
    target: [fountain[0] + 6, 3, fountain[1] - 4],
    fov: 34,
  },
  {
    title: 'The Lagoon',
    kicker: 'Pool, pavilions and sun decks',
    keys: ['4', '5', '11', '12', '13', '14', '17'],
    pos: [lagoon[0] + 26, 92, lagoon[1] + 70],
    target: [lagoon[0] - 4, 0, lagoon[1] - 4],
    fov: 34,
  },
  {
    title: 'Five Towers',
    kicker: 'Two homes per floor, one private lift',
    keys: [],
    pos: [-175, 92, 160],
    target: [0, 26, 0],
    fov: 30,
  },
  {
    title: 'Gardens & Wellness',
    kicker: 'Eco pond, sensory garden, yoga deck',
    keys: ['1', '2', '3', '6', '7', '8', '9', '10'],
    pos: [gardens[0] - 32, 36, gardens[1] + 62],
    target: [gardens[0] - 6, 1, gardens[1] - 10],
    fov: 34,
  },
  {
    title: 'Integrated Shops',
    kicker: '17 retail units below the tennis court',
    keys: ['18', 'I', 'D'],
    pos: [shops[0] + 46, 11, shops[1] + 58],
    target: [shops[0] - 4, 4, shops[1] - 6],
    fov: 36,
  },
  {
    title: 'Below Ground',
    kicker: 'Full basement car park, lift to your door',
    keys: ['E'],
    pos: [52, 168, 150],
    target: [-6, -6, 8],
    fov: 30,
  },
];

export function heroCam(p: number, time: number): Cam {
  const a = -0.82 + time * 0.018 + p * 0.45;
  const r = 230 - p * 70;
  return { pos: [Math.sin(a) * r, 96 - p * 38, Math.cos(a) * r], target: [0, 18 - p * 4, 0], fov: 30 };
}

export const LIGHT_CAM: Cam = { pos: [80, 180, 230], target: [0, 12, 4], fov: 30 };

export function towersCam(tower: number, roomy = false): Cam {
  if (!tower) return { pos: [70, 240, 270], target: [-4, 8, 2], fov: 30 };
  const t = TOWERS[tower - 1];
  // Look in from the tower's open side: out from the site centre, turned a little for a three-quarter view.
  const len = Math.hypot(t.centre[0], t.centre[1]) || 1;
  const a = Math.atan2(t.centre[1] / len, t.centre[0] / len) + 0.45;
  if (roomy) {
    // Residences picker (a half-width panel): aim between the chosen tower and the cluster's centre and stand
    // further off, so all five towers fit with headroom for their tags and the chosen one still leads.
    const aim = [t.centre[0] * 0.55 + CLUSTER[0] * 0.45, t.centre[1] * 0.55 + CLUSTER[1] * 0.45];
    return {
      pos: [aim[0] + Math.cos(a) * 250, t.height + 92, aim[1] + Math.sin(a) * 250],
      target: [aim[0], t.height * 0.5, aim[1]],
      fov: 30,
    };
  }
  return {
    pos: [t.centre[0] + Math.cos(a) * 150, t.height + 80, t.centre[1] + Math.sin(a) * 150],
    target: [t.centre[0], t.height * 0.42, t.centre[1]],
    fov: 30,
  };
}
