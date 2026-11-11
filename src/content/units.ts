import type { media } from './media';

/**
 * All 13 unit layouts exactly as published on 18thavenue.com.bn/apartment (checked by scripts/verify-data.mjs).
 * Areas are square feet. Two live-site HTML glitches are corrected: "Ultilities" → utility, "123/td>" → 123.
 * `unitsListed` is the live "No. of Units" figure: homes on those floors of that tower (A and B positions together).
 */
export type TowerId = 1 | 2 | 3 | 4 | 5;
export type Bedrooms = '2BR+1' | '3BR' | '3BR+1';

export type Layout = {
  id: string;
  tower: TowerId;
  /** The tab label used on the live site. */
  label: string;
  type: string;
  position: 'Unit A' | 'Unit B' | null;
  ground: boolean;
  floors: string;
  floorFrom: number;
  floorTo: number;
  unitsListed: number;
  bedrooms: Bedrooms;
  area: { internal: number; balcony: number; acLedge: number; gross: number };
  rooms: {
    living: number;
    master: number;
    bed1: number;
    bed2: number | null;
    dining: number;
    kitchen: number;
    utility: number | null;
  };
  plan: keyof typeof media.plans;
  keyPlan: keyof typeof media.plans;
};

const T1_ROOMS = { living: 365, master: 200, bed1: 100, bed2: 148, dining: 123, kitchen: 107, utility: 30 };
const T2_ROOMS = { living: 318, master: 210, bed1: 108, bed2: 108, dining: 120, kitchen: 145, utility: null };
const T3_ROOMS = { living: 250, master: 180, bed1: 118, bed2: null, dining: 124, kitchen: 85, utility: 55 };
const T5_ROOMS = { living: 347, master: 200, bed1: 100, bed2: 148, dining: 120, kitchen: 112, utility: 30 };

export const layouts: Layout[] = [
  {
    id: 't1-a',
    tower: 1,
    label: 'TYPE-1 (Unit A Layout)',
    type: 'Type 1',
    position: 'Unit A',
    ground: false,
    floors: '2nd to 18th Floor',
    floorFrom: 2,
    floorTo: 18,
    unitsListed: 34,
    bedrooms: '3BR+1',
    area: { internal: 1582.0, balcony: 108.6, acLedge: 93.0, gross: 1783.6 },
    rooms: T1_ROOMS,
    plan: 't1-a',
    keyPlan: 'key-t1-a',
  },
  {
    id: 't1-b',
    tower: 1,
    label: 'TYPE-1 (Unit B Layout)',
    type: 'Type 1',
    position: 'Unit B',
    ground: false,
    floors: '2nd to 18th Floor',
    floorFrom: 2,
    floorTo: 18,
    unitsListed: 34,
    bedrooms: '3BR',
    area: { internal: 1582.0, balcony: 108.6, acLedge: 93.0, gross: 1783.6 },
    rooms: T1_ROOMS,
    plan: 't1-b',
    keyPlan: 'key-t1-b',
  },
  {
    id: 't1-ga',
    tower: 1,
    label: 'TYPE-1 (Unit A Layout) Ground',
    type: 'Type 1 Ground',
    position: 'Unit A',
    ground: true,
    floors: '1st Floor',
    floorFrom: 1,
    floorTo: 1,
    unitsListed: 2,
    bedrooms: '3BR+1',
    area: { internal: 1582.0, balcony: 275.4, acLedge: 93.0, gross: 1950.4 },
    rooms: T1_ROOMS,
    plan: 't1-ga',
    keyPlan: 'key-t1-a',
  },
  {
    id: 't1-gb',
    tower: 1,
    label: 'TYPE-1 (Unit B Layout) Ground',
    type: 'Type 1 Ground',
    position: 'Unit B',
    ground: true,
    floors: '1st Floor',
    floorFrom: 1,
    floorTo: 1,
    unitsListed: 2,
    bedrooms: '3BR+1',
    area: { internal: 1582.0, balcony: 275.4, acLedge: 93.0, gross: 1950.4 },
    rooms: T1_ROOMS,
    plan: 't1-gb',
    keyPlan: 'key-t1-b',
  },
  {
    id: 't2',
    tower: 2,
    label: 'TYPE-2 (Unit A Layout)',
    type: 'Type 2',
    position: 'Unit A',
    ground: false,
    floors: '2nd to 18th Floor',
    floorFrom: 2,
    floorTo: 18,
    unitsListed: 34,
    bedrooms: '3BR',
    area: { internal: 1345.0, balcony: 118.0, acLedge: 27.8, gross: 1490.8 },
    rooms: T2_ROOMS,
    plan: 't2',
    keyPlan: 'key-t2',
  },
  {
    id: 't2-g',
    tower: 2,
    label: 'TYPE-2 (Unit A Layout) Ground',
    type: 'Type 2 Ground',
    position: 'Unit A',
    ground: true,
    floors: '1st Floor',
    floorFrom: 1,
    floorTo: 1,
    unitsListed: 2,
    bedrooms: '3BR',
    area: { internal: 1345.0, balcony: 401.4, acLedge: 27.5, gross: 1773.9 },
    rooms: T2_ROOMS,
    plan: 't2-g',
    keyPlan: 'key-t2',
  },
  {
    id: 't3',
    tower: 3,
    label: 'TYPE-3 (Unit B Layout)',
    type: 'Type 3',
    position: 'Unit B',
    ground: false,
    floors: '2nd to 18th Floor',
    floorFrom: 2,
    floorTo: 18,
    unitsListed: 34,
    bedrooms: '2BR+1',
    area: { internal: 1087.0, balcony: 48.0, acLedge: 49.0, gross: 1184.0 },
    rooms: T3_ROOMS,
    plan: 't3',
    keyPlan: 'key-t3',
  },
  {
    id: 't3-g',
    tower: 3,
    label: 'TYPE-3 (Unit B Layout) Ground',
    type: 'Type 3 Ground',
    position: 'Unit B',
    ground: true,
    floors: '1st Floor',
    floorFrom: 1,
    floorTo: 1,
    unitsListed: 2,
    bedrooms: '2BR+1',
    area: { internal: 1087.0, balcony: 115.9, acLedge: 49.0, gross: 1251.9 },
    rooms: T3_ROOMS,
    plan: 't3-g',
    keyPlan: 'key-t3',
  },
  {
    id: 't4',
    tower: 4,
    label: 'TYPE-4',
    type: 'Type 4',
    position: null,
    ground: false,
    floors: '2nd to 18th Floor',
    floorFrom: 2,
    floorTo: 18,
    unitsListed: 17,
    bedrooms: '3BR',
    area: { internal: 1345.0, balcony: 118.0, acLedge: 27.8, gross: 1490.8 },
    rooms: T2_ROOMS,
    plan: 't4',
    keyPlan: 'key-t4',
  },
  {
    id: 't4-g',
    tower: 4,
    label: 'TYPE-4 (Ground)',
    type: 'Type 4 Ground',
    position: null,
    ground: true,
    floors: '1st Floor',
    floorFrom: 1,
    floorTo: 1,
    unitsListed: 1,
    bedrooms: '3BR',
    area: { internal: 1345.0, balcony: 401.4, acLedge: 27.5, gross: 1773.9 },
    rooms: T2_ROOMS,
    plan: 't4-g',
    keyPlan: 'key-t4',
  },
  {
    id: 't5',
    tower: 5,
    label: 'TYPE-5 (Unit B Layout)',
    type: 'Type 5',
    position: 'Unit B',
    ground: false,
    floors: '2nd to 16th Floor',
    floorFrom: 2,
    floorTo: 16,
    unitsListed: 30,
    bedrooms: '3BR+1',
    area: { internal: 1582.0, balcony: 108.6, acLedge: 93.0, gross: 1783.6 },
    rooms: T5_ROOMS,
    plan: 't5',
    keyPlan: 'key-t5',
  },
  {
    id: 't5-ga',
    tower: 5,
    label: 'TYPE-5 (Unit A Layout) Ground',
    type: 'Type 5 Ground A',
    position: 'Unit A',
    ground: true,
    floors: '1st Floor (A)',
    floorFrom: 1,
    floorTo: 1,
    unitsListed: 1,
    bedrooms: '3BR+1',
    area: { internal: 1582.0, balcony: 138.7, acLedge: 93.0, gross: 1813.7 },
    rooms: T5_ROOMS,
    plan: 't5-ga',
    keyPlan: 'key-t5-ga',
  },
  {
    id: 't5-gb',
    tower: 5,
    label: 'TYPE-5 (Unit B Layout) Ground',
    type: 'Type 5 Ground B',
    position: 'Unit B',
    ground: true,
    floors: '1st Floor (B)',
    floorFrom: 1,
    floorTo: 1,
    unitsListed: 1,
    bedrooms: '2BR+1',
    area: { internal: 1345.0, balcony: 146.2, acLedge: 27.8, gross: 1519.0 },
    rooms: { living: 383, master: 200, bed1: 100, bed2: null, dining: 120, kitchen: 112, utility: 30 },
    plan: 't5-gb',
    keyPlan: 'key-t5-gb',
  },
];

export const ROOM_LABELS: Record<keyof Layout['rooms'], string> = {
  living: 'Living room',
  master: 'Master bedroom',
  bed1: 'Bedroom 1',
  bed2: 'Bedroom 2',
  dining: 'Dining room',
  kitchen: 'Kitchen',
  utility: 'Utility',
};

export type Tower = {
  id: TowerId;
  name: string;
  levels: number;
  /** Homes per typical floor, from the live unit table. */
  perFloor: number;
  /** Sum of the live "No. of Units" figures for this tower. */
  homes: number;
  sizes: [number, number];
  bedrooms: Bedrooms[];
};

function towerSummary(id: TowerId): Tower {
  const list = layouts.filter((l) => l.tower === id);
  // A and B layouts on the same floors share one listed count, so count each floor range once.
  const byFloors = new Map<string, number>();
  for (const l of list) byFloors.set(l.floors.replace(/ \([AB]\)$/, '') + (l.floors.match(/\(([AB])\)$/)?.[1] ?? ''), l.unitsListed);
  const homes = [...byFloors.values()].reduce((a, b) => a + b, 0);
  const typical = list.find((l) => !l.ground)!;
  const grosses = list.map((l) => l.area.gross);
  return {
    id,
    name: `Tower ${id}`,
    levels: typical.floorTo,
    perFloor: Math.round(typical.unitsListed / (typical.floorTo - typical.floorFrom + 1)),
    homes,
    sizes: [Math.min(...grosses), Math.max(...grosses)],
    bedrooms: [...new Set(list.map((l) => l.bedrooms))].sort() as Bedrooms[],
  };
}

export const towers: Tower[] = ([1, 2, 3, 4, 5] as TowerId[]).map(towerSummary);

/** Sum of the live unit table (158). The live site's headline figure is 159. */
export const tableTotal = towers.reduce((a, t) => a + t.homes, 0);

export const sizeRange: [number, number] = [
  Math.min(...layouts.map((l) => l.area.gross)),
  Math.max(...layouts.map((l) => l.area.gross)),
];

export const sqft = (n: number, dp = 1) =>
  n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });

export const layoutById = (id: string) => layouts.find((l) => l.id === id);
