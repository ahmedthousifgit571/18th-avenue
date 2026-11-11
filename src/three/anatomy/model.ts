import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FLOOR_H, SITE_ANGLE, TOWERS, seeded, type XZ } from '../site/layout';
import { coreRect, extrudeUp } from '../site/Towers';

/**
 * Tower 1 of 18th Avenue, taken apart into the layers the home page's anatomy tour shows one at a time: flat slabs,
 * shear walls, the lift core, the façade (glass, fins, bronze panels, crown), a typical floor and the basement.
 *
 * Coordinates are the tower's own frame in metres: the lift core at the origin, the long axis along +x, ground at y = 0.
 * Every layer is split at SPLIT into a lower and an upper stack, so the upper floors can lift away from a floor.
 */
export const TOWER = TOWERS[0];
export const LEVELS = TOWER.levels;
export const TOP = LEVELS * FLOOR_H;
/** The typical floor opens on top of this level. */
export const SPLIT = 9;
export const CUT_Y = SPLIT * FLOOR_H;
export const BASE_Y = -4.6;
export const CORE_TOP = TOP + 3.2;
export const CORE_SIZE = TOWER.core.size;

const C = TOWER.core.centre;
const cs = Math.cos(SITE_ANGLE);
const sn = Math.sin(SITE_ANGLE);
/** Site-plan metres → tower frame (inverse of the site's rotation about the core). */
const toLocal = ([x, z]: XZ): XZ => {
  const dx = x - C[0];
  const dz = z - C[1];
  return [dx * cs - dz * sn, dx * sn + dz * cs];
};

export const WINGS: XZ[][] = TOWER.wings.map((w) => w.map(toLocal));
export const CORE: XZ[] = coreRect(TOWER).map(toLocal);
const SHAPES = [...WINGS, CORE];

export type Pair = { lower: THREE.BufferGeometry; upper: THREE.BufferGeometry };

function merge(parts: THREE.BufferGeometry[]) {
  const flat = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    n.clearGroups();
    for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') n.deleteAttribute(k);
    return n;
  });
  const m = mergeGeometries(flat, false)!;
  m.computeBoundingSphere();
  m.computeBoundingBox();
  return m;
}

const BOX = new THREE.BoxGeometry(1, 1, 1);
const box = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, rotY = 0) =>
  BOX.clone().applyMatrix4(
    new THREE.Matrix4().compose(new THREE.Vector3(cx, cy, cz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(sx, sy, sz)),
  );

type Edge = { a: XZ; len: number; dir: XZ; normal: XZ };
function edgesOf(poly: XZ[]): Edge[] {
  const area = poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0);
  const sign = area > 0 ? 1 : -1;
  return poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dir: XZ = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    return { a, len, dir, normal: [-dir[1] * sign, dir[0] * sign] as XZ };
  });
}

function bbox(poly: XZ[]) {
  const xs = poly.map((p) => p[0]);
  const zs = poly.map((p) => p[1]);
  return { u0: Math.min(...xs), u1: Math.max(...xs), v0: Math.min(...zs), v1: Math.max(...zs) };
}

/** Floor f sits at (f − 1) · FLOOR_H; f = LEVELS + 1 is the roof slab. */
const stackFloors = (upper: boolean) => (upper ? [SPLIT + 1, LEVELS + 1] : [1, SPLIT]);
const stackSpan = (upper: boolean) => (upper ? { y0: CUT_Y, h: TOP - CUT_Y } : { y0: 0, h: CUT_Y });

function pair(build: (upper: boolean) => THREE.BufferGeometry[]): Pair {
  return { lower: merge(build(false)), upper: merge(build(true)) };
}

export function buildTower() {
  const slabs = pair((upper) => {
    const [a, b] = stackFloors(upper);
    const out: THREE.BufferGeometry[] = [];
    for (let f = a; f <= b; f++) for (const s of SHAPES) out.push(extrudeUp(s, 0.34, 1.035).translate(0, (f - 1) * FLOOR_H - 0.17, 0));
    return out;
  });

  const glass = pair((upper) => {
    const { y0, h } = stackSpan(upper);
    return SHAPES.map((s) => extrudeUp(s, h, 0.985).translate(0, y0, 0));
  });

  // Vertical fins every ~1.65 m along each face, and the warm bronze bands at both ends of each wing's longest face.
  const fins = pair((upper) => {
    const { y0, h } = stackSpan(upper);
    const out: THREE.BufferGeometry[] = [];
    for (const s of SHAPES) {
      for (const e of edgesOf(s)) {
        if (e.len < 2.4) continue;
        const rot = Math.atan2(-e.dir[1], e.dir[0]);
        const n = Math.floor((e.len - 1) / 1.65);
        for (let i = 1; i <= n; i++) {
          const t = (i / (n + 1)) * e.len;
          out.push(box(e.a[0] + e.dir[0] * t + e.normal[0] * 0.24, y0 + h / 2, e.a[1] + e.dir[1] * t + e.normal[1] * 0.24, 0.1, h, 0.36, rot));
        }
      }
    }
    return out;
  });
  const panels = pair((upper) => {
    const { y0, h } = stackSpan(upper);
    const out: THREE.BufferGeometry[] = [];
    for (const s of SHAPES) {
      const e = edgesOf(s).sort((p, q) => q.len - p.len)[0];
      const rot = Math.atan2(-e.dir[1], e.dir[0]);
      for (const t of [1.0, e.len - 1.0]) out.push(box(e.a[0] + e.dir[0] * t + e.normal[0] * 0.2, y0 + h / 2, e.a[1] + e.dir[1] * t + e.normal[1] * 0.2, 1.9, h, 0.38, rot));
    }
    return out;
  });

  // Shear walls: cross walls through each wing (the flat slabs span between them), running the full height.
  const walls = pair((upper) => {
    const { y0, h } = stackSpan(upper);
    const out: THREE.BufferGeometry[] = [];
    for (const w of WINGS) {
      const { u0, u1, v0, v1 } = bbox(w);
      const depth = v1 - v0;
      const vm = (v0 + v1) / 2;
      // Each wing runs outwards from the core.
      const outer = Math.abs(u0) > Math.abs(u1) ? u0 : u1;
      const inner = outer === u0 ? u1 : u0;
      // Party wall beside the core, two cross walls and the gable end, set inside the glass line.
      for (const t of [0.12, 0.42, 0.7, 0.93]) {
        const u = inner + (outer - inner) * t;
        out.push(box(u, y0 + h / 2, vm, 0.32, h, depth * (t > 0.9 ? 0.62 : 0.78)));
      }
      // A short spine wall between the bedrooms and the living side.
      out.push(box(inner + (outer - inner) * 0.27, y0 + h / 2, vm + depth * 0.06, Math.abs(outer - inner) * 0.3, h, 0.28));
    }
    return out;
  });

  // The lift core: a concrete shaft from the basement to the lift motor room above the roof.
  const [cw, cd] = CORE_SIZE;
  const core: Pair = {
    lower: merge([box(0, (BASE_Y + CUT_Y) / 2, 0, cw * 0.9, CUT_Y - BASE_Y, cd * 0.9)]),
    upper: merge([box(0, (CUT_Y + TOP) / 2, 0, cw * 0.9, TOP - CUT_Y, cd * 0.9), box(0, TOP + 1.6, 0, cw * 0.7, 3.2, cd * 0.6)]),
  };

  // Crown: a floating white frame on slender posts above the roof, with planters (as on the client's renders).
  const crown = merge([
    ...WINGS.map((w) => extrudeUp(w, 0.45, 1.05).translate(0, TOP + 3.4, 0)),
    ...WINGS.flatMap((w) =>
      edgesOf(w)
        .filter((e) => e.len >= 5)
        .flatMap((e) => {
          const n = Math.max(1, Math.floor(e.len / 4.2));
          return Array.from({ length: n + 1 }, (_, i) => {
            const t = (i / n) * e.len;
            return box(e.a[0] + e.dir[0] * t + e.normal[0] * 0.35, TOP + 1.7, e.a[1] + e.dir[1] * t + e.normal[1] * 0.35, 0.22, 3.4, 0.22);
          });
        }),
    ),
  ]);
  const planters = merge(WINGS.map((w) => extrudeUp(w, 0.9, 0.55).translate(0, TOP + 0.17, 0)));

  return { slabs, glass, fins, panels, walls, core, crown, planters };
}

export type TowerModel = ReturnType<typeof buildTower>;

/** The basement under the tower: slab, column grid, the private lift lobby and a few parked cars. */
export const BASEMENT = { u: 31, v: 19 };
export function buildBasement() {
  const { u, v } = BASEMENT;
  const slab = merge([box(0, BASE_Y - 0.2, 0, u * 2, 0.4, v * 2)]);
  const cols: THREE.BufferGeometry[] = [];
  for (let x = -u + 3; x <= u - 3; x += 8.4)
    for (let z = -v + 3; z <= v - 3; z += 8.4) {
      if (Math.abs(x) < 6 && Math.abs(z) < 6.5) continue;
      cols.push(box(x, BASE_Y / 2, z, 0.7, -BASE_Y, 0.7));
    }
  const columns = merge(cols);
  // Rows follow the bay lines painted by makeBasementFloorMaterial(0).
  const rand = seeded(7);
  const paints = ['#e9e6df', '#2b2d31', '#8b9097', '#6d1f22', '#30475e', '#c9c4b8', '#1c1d20'];
  const cars: { x: number; z: number; color: THREE.Color }[] = [];
  for (let z = -40; z <= 40; z += 7.2) {
    const r = Math.round((z + 40) / 7.2);
    const zc = z + (r % 2 ? 2.6 : -2.6);
    if (Math.abs(zc) > v - 3) continue;
    for (let x = -66; x <= 66; x += 2.7) {
      if (Math.abs(x) > u - 3 || (Math.abs(x) < 7 && Math.abs(zc) < 8)) continue;
      if (rand() < 0.3) continue;
      cars.push({ x, z: zc, color: new THREE.Color(paints[Math.floor(rand() * paints.length)]) });
    }
  }
  const lobby: [number, number, number] = [CORE_SIZE[0] * 1.12, -BASE_Y - 0.1, CORE_SIZE[1] * 1.12];
  return { slab, columns, cars, lobby };
}

/** Edge lines for the drawing look, skipping faces closer than `angle` degrees. */
export function edges(g: THREE.BufferGeometry, angle = 24) {
  return new THREE.EdgesGeometry(g, angle);
}
