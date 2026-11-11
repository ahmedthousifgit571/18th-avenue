'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { CONTEXT, PLAN_H, PLAN_W, seeded, type XZ } from './layout';
import { extrudeUp } from './Towers';
import { makeContextMaterial, makeGroundMaterial, makeRoadMaterial, type Uniform } from './materials';

const BASE = '#b9bfa8';

/**
 * Bakes the drawing onto a canvas with its edges feathered into the base ground colour, so the material can stay
 * opaque (transparent ground planes don't sort or shadow reliably).
 */
function featheredGround(image: HTMLImageElement) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = Math.round((2048 * image.height) / image.width);
  const g = c.getContext('2d')!;
  g.drawImage(image, 0, 0, c.width, c.height);
  const fx = c.width * 0.07;
  const fy = c.height * 0.09;
  const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, BASE);
    grad.addColorStop(1, BASE + '00');
    g.fillStyle = grad;
    g.fillRect(rx, ry, rw, rh);
  };
  edge(0, 0, fx, 0, 0, 0, fx, c.height);
  edge(c.width, 0, c.width - fx, 0, c.width - fx, 0, fx, c.height);
  edge(0, 0, 0, fy, 0, 0, c.width, fy);
  edge(0, c.height, 0, c.height - fy, 0, c.height - fy, c.width, fy);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function ribbon(line: XZ[], width: number, y: number) {
  // Flat strip along a polyline (mitre-free; fine at these widths).
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < line.length; i++) {
    const p = line[i];
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * (width / 2);
    const nz = (dx / l) * (width / 2);
    pos.push(p[0] + nx, y, p[1] + nz, p[0] - nx, y, p[1] - nz);
    if (i < line.length - 1) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Concatenates geometries; `ids` (one per geometry) becomes a per-vertex `aBid` attribute for per-building variety. */
function merge(geos: THREE.BufferGeometry[], ids?: number[]) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const count = parts.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const bid = new Float32Array(count);
  let o = 0;
  parts.forEach((g, i) => {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    if (ids) bid.fill(ids[i], o, o + g.attributes.position.count);
    o += g.attributes.position.count;
  });
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (ids) m.setAttribute('aBid', new THREE.BufferAttribute(bid, 1));
  // Up-facing roofs read lighter than walls; normals are flat after toNonIndexed.
  m.computeBoundingSphere();
  return m;
}

export default function Ground({
  groundRef,
  baseRef,
  glow,
  quiet,
}: {
  groundRef?: React.Ref<THREE.MeshStandardMaterial>;
  baseRef?: (m: THREE.MeshStandardMaterial) => void;
  /** Night-time window glow for the neighbourhood (shared with the landscape). */
  glow: Uniform;
  /** 0–1: fades the neighbourhood to plain massing so the towers stand alone. */
  quiet: Uniform;
}) {
  const baseMat = useMemo(() => makeGroundMaterial(BASE), []);
  const blockMat = useMemo(() => makeContextMaterial(glow, quiet), [glow, quiet]);
  const roadMat = useMemo(() => makeRoadMaterial(), []);
  useEffect(() => baseRef?.(baseMat), [baseMat, baseRef]);
  const map = useTexture('/media/textures/ground.webp');
  const planMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: featheredGround(map.image as HTMLImageElement),
        roughness: 0.95,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [map],
  );

  const ctx = useMemo(() => {
    const rand = seeded(18);
    const blocks = CONTEXT.buildings.map((b) => {
      const levels = b.levels ?? (b.kind === 'apartments' ? 4 + Math.floor(rand() * 3) : 1 + Math.floor(rand() * 2.6));
      return extrudeUp(b.poly, Math.min(40, levels * 3.4));
    });
    const roads = CONTEXT.roads.map((r) => ribbon(r.line, r.width, 0.03));
    const water = CONTEXT.water.map((w) => ribbon(w.line, w.width, 0.02));
    const ids = blocks.map(() => rand());
    return { blocks: merge(blocks, ids), roads: merge(roads), water: water.length ? merge(water) : null };
  }, []);

  return (
    <group>
      {/* Base ground out to the haze */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05} receiveShadow material={baseMat}>
        <circleGeometry args={[1500, 64]} />
      </mesh>
      {/* The client's own site-plan render as the podium surface */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow renderOrder={1}>
        <planeGeometry args={[PLAN_W, PLAN_H]} />
        <primitive object={planMat} attach="material" ref={groundRef} />
      </mesh>
      <mesh geometry={ctx.roads} material={roadMat} receiveShadow />
      {ctx.water && (
        <mesh geometry={ctx.water}>
          <meshStandardMaterial color="#6f8f98" roughness={0.25} metalness={0.2} />
        </mesh>
      )}
      <mesh geometry={ctx.blocks} material={blockMat} castShadow receiveShadow />
    </group>
  );
}
