'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FLOOR_H, SITE_ANGLE, TOWERS, type TowerDef, type XZ } from './layout';
import { makeGlass, makeSolid, PALETTE, towerUniforms, type TowerUniforms } from './materials';

/** World (x, z) polygon → THREE.Shape in the extrusion's plane (shape y = −world z, see `extrudeUp`). */
function shapeOf(poly: XZ[], scale = 1) {
  const c = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
  const s = new THREE.Shape();
  poly.forEach(([x, z], i) => {
    const px = c[0] + (x - c[0]) * scale;
    const pz = c[1] + (z - c[1]) * scale;
    if (i === 0) s.moveTo(px, -pz);
    else s.lineTo(px, -pz);
  });
  s.closePath();
  return s;
}

/** Extrudes a footprint upwards: the result spans y = 0…height in world space. */
export function extrudeUp(poly: XZ[], height: number, scale = 1) {
  const g = new THREE.ExtrudeGeometry(shapeOf(poly, scale), { depth: height, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  return g;
}

type Edge = { a: XZ; b: XZ; len: number; dir: XZ; normal: XZ };

function edgesOf(poly: XZ[]): Edge[] {
  // Signed area tells us the winding, so normals always point outwards.
  const area = poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0);
  const sign = area > 0 ? 1 : -1;
  return poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const dir: XZ = [dx / len, dz / len];
    return { a, b, len, dir, normal: [-dir[1] * sign, dir[0] * sign] as XZ };
  });
}

/** The lift core as a rectangle in plan (it is glazed and slabbed like the wings). */
export function coreRect(t: TowerDef): XZ[] {
  const [cx, cz] = t.core.centre;
  const [w, d] = t.core.size;
  const c = Math.cos(SITE_ANGLE);
  const s = Math.sin(SITE_ANGLE);
  return ([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]] as XZ[]).map(([u, v]) => [cx + u * c + v * s, cz - u * s + v * c]);
}

type Built = {
  glass: THREE.BufferGeometry[];
  slab: THREE.BufferGeometry[];
  fins: THREE.Matrix4[];
  panels: THREE.Matrix4[];
  crownPosts: THREE.Matrix4[];
};

function buildStack(t: TowerDef, from: number, to: number): Built {
  const y0 = (from - 1) * FLOOR_H;
  const h = (to - from + 1) * FLOOR_H;
  const out: Built = { glass: [], slab: [], fins: [], panels: [], crownPosts: [] };
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);

  for (const wing of [...t.wings, coreRect(t)]) {
    const g = extrudeUp(wing, h, 0.985);
    g.translate(0, y0, 0);
    out.glass.push(g);
    out.slab.push(extrudeUp(wing, 0.34, 1.035));

    for (const e of edgesOf(wing)) {
      if (e.len < 2.4) continue;
      const angle = Math.atan2(-e.dir[1], e.dir[0]);
      q.setFromAxisAngle(up, angle);
      // Vertical bronze fins every ~1.65 m along each face.
      const n = Math.floor((e.len - 1) / 1.65);
      for (let i = 1; i <= n; i++) {
        const t0 = (i / (n + 1)) * e.len;
        const x = e.a[0] + e.dir[0] * t0 + e.normal[0] * 0.24;
        const z = e.a[1] + e.dir[1] * t0 + e.normal[1] * 0.24;
        m.compose(new THREE.Vector3(x, y0 + h / 2, z), q, new THREE.Vector3(0.1, h, 0.36));
        out.fins.push(m.clone());
      }
    }
    // Solid bronze panels at both ends of the two longest faces (the warm vertical bands in the client's film).
    const longest = edgesOf(wing).sort((a, b) => b.len - a.len).slice(0, 1);
    for (const e of longest) {
      const angle = Math.atan2(-e.dir[1], e.dir[0]);
      q.setFromAxisAngle(up, angle);
      for (const t0 of [1.0, e.len - 1.0]) {
        const x = e.a[0] + e.dir[0] * t0 + e.normal[0] * 0.2;
        const z = e.a[1] + e.dir[1] * t0 + e.normal[1] * 0.2;
        m.compose(new THREE.Vector3(x, y0 + h / 2, z), q, new THREE.Vector3(1.9, h, 0.38));
        out.panels.push(m.clone());
      }
    }
  }
  return out;
}

function mergeAll(geos: THREE.BufferGeometry[]) {
  // Tiny merge: concatenates non-indexed position/normal/uv attributes.
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const count = parts.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  let o = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    uv.set(g.attributes.uv.array as Float32Array, o * 2);
    o += g.attributes.position.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  merged.computeBoundingSphere();
  return merged;
}

function Instanced({ matrices, geometry, material }: { matrices: THREE.Matrix4[]; geometry: THREE.BufferGeometry; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    matrices.forEach((mx, i) => mesh.setMatrixAt(i, mx));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} castShadow receiveShadow />;
}

const BOX = new THREE.BoxGeometry(1, 1, 1);

export type TowerHandle = { uniforms: TowerUniforms; upper: THREE.Group | null };

/**
 * One tower. `split` cuts it into a lower and an upper stack (the upper stack can lift away to reveal a floor plate,
 * used by the "Bungalows in the air" chapter).
 */
export function Tower({ def, split, handle }: { def: TowerDef; split?: number; handle?: (h: TowerHandle) => void }) {
  const upperRef = useRef<THREE.Group>(null);
  const data = useMemo(() => {
    const uniforms = towerUniforms(def.id * 7.31);
    const mats = {
      glass: makeGlass(uniforms),
      slab: makeSolid(PALETTE.slab, uniforms, { roughness: 0.55 }),
      fin: makeSolid(PALETTE.fin, uniforms, { roughness: 0.5, metalness: 0.25 }),
      panel: makeSolid(PALETTE.panel, uniforms, { roughness: 0.62, metalness: 0.05, grain: true }),
      core: makeSolid(PALETTE.core, uniforms, { roughness: 0.85 }),
      crown: makeSolid(PALETTE.crown, uniforms, { roughness: 0.5 }),
      green: makeSolid(PALETTE.roofGreen, uniforms, { roughness: 0.95 }),
    };
    const stacks = split ? [buildStack(def, 1, split), buildStack(def, split + 1, def.levels)] : [buildStack(def, 1, def.levels)];
    const slabMatrices = (from: number, to: number) => {
      const list: THREE.Matrix4[] = [];
      for (let f = from; f <= to + 1; f++) list.push(new THREE.Matrix4().makeTranslation(0, (f - 1) * FLOOR_H - 0.17, 0));
      return list;
    };
    const ranges = split ? [[1, split], [split + 1, def.levels]] : [[1, def.levels]];
    return {
      uniforms,
      mats,
      stacks: stacks.map((s, i) => ({
        glass: mergeAll(s.glass),
        slabGeo: mergeAll(s.slab),
        slabs: slabMatrices(ranges[i][0], ranges[i][1]),
        fins: s.fins,
        panels: s.panels,
      })),
    };
  }, [def, split]);

  useLayoutEffect(() => {
    handle?.({ uniforms: data.uniforms, upper: upperRef.current });
  }, [data, handle]);

  const top = def.levels * FLOOR_H;
  const coreH = 3.2;
  const roof = useMemo(() => {
    // Crown: a floating white frame above the roof on slender posts, plus planters, as on the client's renders.
    const posts: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    for (const wing of def.wings) {
      for (const e of edgesOf(wing)) {
        if (e.len < 5) continue;
        const n = Math.max(1, Math.floor(e.len / 4.2));
        for (let i = 0; i <= n; i++) {
          const t0 = (i / n) * e.len;
          posts.push(
            new THREE.Matrix4().compose(
              new THREE.Vector3(e.a[0] + e.dir[0] * t0 + e.normal[0] * 0.35, top + 1.7, e.a[1] + e.dir[1] * t0 + e.normal[1] * 0.35),
              q,
              new THREE.Vector3(0.22, 3.4, 0.22),
            ),
          );
        }
      }
    }
    return {
      posts,
      crown: mergeAll(def.wings.map((w) => extrudeUp(w, 0.45, 1.05).translate(0, top + 3.4, 0))),
      coreRoof: extrudeUp(coreRect(def), 0.34, 1.035).translate(0, top - 0.17, 0),
      planters: mergeAll(def.wings.map((w) => extrudeUp(w, 0.9, 0.55).translate(0, top + 0.17, 0))),
    };
  }, [def, top]);

  const [lower, upper] = data.stacks;
  const coreMatrix = useMemo(
    () => [
      new THREE.Matrix4().compose(
        new THREE.Vector3(def.core.centre[0], top + coreH / 2, def.core.centre[1]),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), SITE_ANGLE),
        new THREE.Vector3(def.core.size[0] * 0.7, coreH, def.core.size[1] * 0.6),
      ),
    ],
    [def, coreH, top],
  );

  const stackMeshes = (s: (typeof data.stacks)[number]) => (
    <>
      <mesh geometry={s.glass} material={data.mats.glass} castShadow receiveShadow />
      <Instanced matrices={s.slabs} geometry={s.slabGeo} material={data.mats.slab} />
      <Instanced matrices={s.fins} geometry={BOX} material={data.mats.fin} />
      <Instanced matrices={s.panels} geometry={BOX} material={data.mats.panel} />
    </>
  );

  return (
    <group name={`tower-${def.id}`}>
      {stackMeshes(lower)}
      <group ref={upperRef}>
        <Instanced matrices={coreMatrix} geometry={BOX} material={data.mats.core} />
        {upper && stackMeshes(upper)}
        <mesh geometry={roof.crown} material={data.mats.crown} castShadow />
        <mesh geometry={roof.planters} material={data.mats.green} receiveShadow />
        <mesh geometry={roof.coreRoof} material={data.mats.slab} castShadow />
        <Instanced matrices={roof.posts} geometry={BOX} material={data.mats.crown} />
      </group>
    </group>
  );
}

export default function Towers({ onHandle }: { onHandle?: (id: number, h: TowerHandle) => void }) {
  return (
    <group>
      {TOWERS.map((t) => (
        <Tower key={t.id} def={t} split={t.id === 1 ? 11 : undefined} handle={onHandle ? (h) => onHandle(t.id, h) : undefined} />
      ))}
    </group>
  );
}
