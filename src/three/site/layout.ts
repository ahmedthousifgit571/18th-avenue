import footprints from './footprints.json';
import context from './context.json';
import { amenities } from '@/content/amenities';

/**
 * Scene layout in metres. +x east, +y up, +z south; origin at the centre of the client's site-plan drawing.
 * Tower wings and trees come from scripts/site-footprints.mjs (vectorised from the drawing at 12.4 px/m);
 * the remaining structures are read off the same drawing by hand, in drawing fractions (fx, fy).
 */
export const PX_PER_M = footprints.pxPerM;
export const PLAN_W = footprints.image.width / PX_PER_M; // ≈163.5 m
export const PLAN_H = footprints.image.height / PX_PER_M; // ≈114.2 m

export type XZ = [number, number];
export const planToWorld = ([fx, fy]: XZ): XZ => [(fx - 0.5) * PLAN_W, (fy - 0.5) * PLAN_H];

export const FLOOR_H = 3.3;
/** The towers' long axis follows the plot, which is turned about 12° anticlockwise on the drawing. */
export const SITE_ANGLE = 0.205;

export type TowerDef = {
  id: 1 | 2 | 3 | 4 | 5;
  levels: number;
  wings: XZ[][];
  centre: XZ;
  core: { centre: XZ; size: [number, number] };
  height: number;
};

const byTower = (id: number) => footprints.wings.filter((w) => w.tower === id);

function average(points: XZ[]): XZ {
  return [points.reduce((a, p) => a + p[0], 0) / points.length, points.reduce((a, p) => a + p[1], 0) / points.length];
}

function towerDef(id: TowerDef['id'], levels: number): TowerDef {
  const wings = byTower(id).map((w) => w.poly as XZ[]);
  const centres = byTower(id).map((w) => w.centre as XZ);
  const centre = average(centres);
  // The lift core sits between the two wings (Tower 4, a single wing, has its core at its east end).
  let coreCentre: XZ;
  if (centres.length === 2) {
    coreCentre = average(centres);
    // Towers 2 and 3 stand back to back with their cores between them; nudge each core towards the other tower.
    if (id === 3) coreCentre = [coreCentre[0], coreCentre[1] + 6.5];
    if (id === 2) coreCentre = [coreCentre[0], coreCentre[1] - 6.5];
  } else {
    coreCentre = [centre[0] + 10.5, centre[1] - 2.6];
  }
  return {
    id,
    levels,
    wings,
    centre,
    core: { centre: coreCentre, size: id === 4 ? [6.5, 7.5] : [7, 8.5] },
    height: levels * FLOOR_H,
  };
}

// Towers 1–4 rise 18 residential levels; Tower 5 has 16 (live unit table: "2nd to 16th Floor").
export const TOWERS: TowerDef[] = [towerDef(1, 18), towerDef(2, 18), towerDef(3, 18), towerDef(4, 18), towerDef(5, 16)];

export const PLOT: XZ[] = footprints.plot as XZ[];
export const TREES: XZ[] = footprints.trees as XZ[];

const P = (pts: XZ[]) => pts.map(planToWorld);

/** Hand-read from the drawing (drawing fractions → metres). */
export const STRUCTURES = {
  clubhouse: [
    P([
      [0.228, 0.413],
      [0.258, 0.408],
      [0.263, 0.545],
      [0.232, 0.548],
    ]),
    P([
      [0.258, 0.406],
      [0.294, 0.402],
      [0.296, 0.436],
      [0.314, 0.434],
      [0.318, 0.554],
      [0.264, 0.558],
    ]),
  ],
  // The three glass pods in the lagoon: 4 Gourmet, 5 Entertainment, 6 Reading Room.
  pods: [
    P([
      [0.437, 0.528],
      [0.455, 0.508],
      [0.468, 0.52],
      [0.463, 0.583],
      [0.445, 0.6],
      [0.433, 0.575],
    ]),
    P([
      [0.484, 0.548],
      [0.5, 0.512],
      [0.52, 0.52],
      [0.528, 0.548],
      [0.512, 0.578],
      [0.49, 0.575],
    ]),
    P([
      [0.538, 0.575],
      [0.556, 0.548],
      [0.576, 0.556],
      [0.582, 0.583],
      [0.567, 0.6],
      [0.545, 0.598],
    ]),
  ],
  lagoon: P([
    [0.37, 0.53],
    [0.38, 0.497],
    [0.418, 0.478],
    [0.458, 0.462],
    [0.505, 0.447],
    [0.552, 0.43],
    [0.6, 0.414],
    [0.645, 0.398],
    [0.69, 0.382],
    [0.712, 0.39],
    [0.708, 0.418],
    [0.665, 0.434],
    [0.62, 0.45],
    [0.585, 0.468],
    [0.56, 0.495],
    [0.548, 0.53],
    [0.52, 0.548],
    [0.47, 0.552],
    [0.43, 0.548],
    [0.395, 0.545],
  ]),
  splash: P([
    [0.752, 0.358],
    [0.79, 0.35],
    [0.8, 0.385],
    [0.79, 0.412],
    [0.76, 0.408],
    [0.748, 0.385],
  ]),
  fountain: { centre: planToWorld([0.21, 0.534]), radius: 4.6 },
  guardHouse: { centre: planToWorld([0.118, 0.548]), size: [3.2, 3.6] as [number, number] },
  substation: P([
    [0.118, 0.318],
    [0.152, 0.316],
    [0.154, 0.398],
    [0.12, 0.4],
  ]),
  refuse: P([
    [0.118, 0.424],
    [0.14, 0.423],
    [0.141, 0.466],
    [0.119, 0.467],
  ]),
  bbq: { centre: planToWorld([0.76, 0.292]), size: [6.5, 4.8] as [number, number] },
  toilets: { centre: planToWorld([0.763, 0.236]), size: [6, 3.2] as [number, number] },
  rest: { centre: planToWorld([0.799, 0.466]), size: [4.2, 4.2] as [number, number] },
  // Shops under the tennis court: the client's perspective is titled "Additional Shop & Tennis Court", and the
  // drawing's "I. Driveway Entry to Shops" arrives right below the court. Interpretation, not confirmed.
  shops: P([
    [0.8, 0.488],
    [0.882, 0.476],
    [0.905, 0.745],
    [0.822, 0.758],
  ]),
  tennis: P([
    [0.818, 0.505],
    [0.876, 0.497],
    [0.893, 0.712],
    [0.835, 0.72],
  ]),
};

export const SHOP_HEIGHT = 4.6;

export type Pin = { key: string; name: string; position: [number, number, number] };

/** Amenity markers in world space (first marked position of each legend item). */
export const PINS: Pin[] = amenities.map((a) => {
  const [x, z] = planToWorld(a.at[0]);
  const raised = a.key === '18' ? SHOP_HEIGHT + 0.5 : a.key === '1' ? 9 : a.key === '16' || a.key === '14' || a.key === '17' ? 4.5 : 1.6;
  return { key: a.key, name: a.name, position: [x, raised, z] };
});

type CtxBuilding = { levels: number | null; kind: string; name: string | null; poly: XZ[] };
type CtxLine = { width: number; name?: string | null; line: XZ[] };

const inPlan = ([x, z]: XZ, margin = 0) => Math.abs(x) < PLAN_W / 2 - margin && Math.abs(z) < PLAN_H / 2 - margin;

/** OpenStreetMap neighbours, minus anything the drawing itself already shows. */
export const CONTEXT = {
  buildings: (context.buildings as CtxBuilding[]).filter((b) => !b.poly.every((p) => inPlan(p, -2))),
  // Split each road where it crosses the drawing, so a road never jumps straight across the plot.
  roads: (context.roads as CtxLine[]).flatMap((r) => {
    const runs: XZ[][] = [[]];
    for (const p of r.line) {
      if (inPlan(p, 6)) {
        if (runs.at(-1)!.length) runs.push([]);
      } else runs.at(-1)!.push(p);
    }
    return runs.filter((l) => l.length > 1).map((line) => ({ ...r, line }));
  }),
  water: context.water as CtxLine[],
};

/** Deterministic pseudo-random numbers so the scene is identical on every load. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
