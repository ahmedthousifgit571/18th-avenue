'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLOT, SITE_ANGLE, TOWERS, seeded, type XZ } from './layout';
import { extrudeUp } from './Towers';

export const BASEMENT_Y = -4.6;

/**
 * A generic saloon in metres: a side profile extruded across the width with rounded (bevelled) edges, plus four
 * wheels. Length runs along x (rear at −2.2), ground at y = 0. `aPart` marks wheels for the car material.
 */
export function carGeometry() {
  // Side profile with curved bumpers, a rounded roof and a raked windscreen.
  const s = new THREE.Shape();
  s.moveTo(-2.1, 0.3);
  s.quadraticCurveTo(-2.24, 0.36, -2.22, 0.6);
  s.quadraticCurveTo(-2.2, 0.86, -2.0, 0.92);
  s.lineTo(-1.5, 0.97);
  s.quadraticCurveTo(-1.15, 1.32, -0.85, 1.4);
  s.quadraticCurveTo(-0.2, 1.47, 0.42, 1.42);
  s.quadraticCurveTo(0.7, 1.36, 1.2, 0.99);
  s.quadraticCurveTo(1.75, 0.9, 2.1, 0.82);
  s.quadraticCurveTo(2.26, 0.74, 2.22, 0.5);
  s.quadraticCurveTo(2.2, 0.32, 2.05, 0.3);
  s.closePath();
  const depth = 1.48;
  const body = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.06, bevelSegments: 3, curveSegments: 5 });
  body.translate(0, 0, -depth / 2);
  body.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(body.attributes.position.count), 1));
  const wheels = [[-1.4, 0.78], [-1.4, -0.78], [1.35, 0.78], [1.35, -0.78]].map(([x, z]) => {
    const w = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 14).rotateX(Math.PI / 2).translate(x, 0.33, z).toNonIndexed();
    w.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(w.attributes.position.count).fill(1), 1));
    return w;
  });
  const g = mergeGeometries([body.index ? body.toNonIndexed() : body, ...wheels]);
  g.computeBoundingSphere();
  return g;
}

function inside([x, z]: XZ, poly: XZ[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

/**
 * The full basement car park: a slab under the whole plot, a column grid, rows of parked cars, and each tower's
 * lift core dropping through to it (the private lift lobbies glow when the chapter calls for them).
 */
export default function Basement({ materials }: { materials: { slab: THREE.Material; column: THREE.Material; car: THREE.Material; core: THREE.Material } }) {
  const cols = useRef<THREE.InstancedMesh>(null);
  const cars = useRef<THREE.InstancedMesh>(null);
  const cores = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const inset = PLOT.map(([x, z]) => [x * 0.9, z * 0.86] as XZ);
    const slab = extrudeUp(inset, 0.4).translate(0, BASEMENT_Y - 0.4, 0);
    const c = Math.cos(SITE_ANGLE);
    const s = Math.sin(SITE_ANGLE);
    const rot = (u: number, v: number): XZ => [u * c + v * s, -u * s + v * c];
    const columns: XZ[] = [];
    for (let u = -72; u <= 72; u += 8.4) for (let v = -48; v <= 48; v += 8.4) {
      const p = rot(u, v);
      if (inside(p, inset)) columns.push(p);
    }
    const rand = seeded(42);
    const carList: { p: XZ; c: THREE.Color }[] = [];
    const paints = ['#e9e6df', '#2b2d31', '#8b9097', '#6d1f22', '#30475e', '#c9c4b8', '#1c1d20'];
    for (let v = -40; v <= 40; v += 7.2) {
      for (let u = -66; u <= 66; u += 2.7) {
        if (rand() < 0.28) continue;
        const p = rot(u, v + (Math.floor((v + 40) / 7.2) % 2 ? 2.6 : -2.6));
        if (!inside(p, inset)) continue;
        carList.push({ p, c: new THREE.Color(paints[Math.floor(rand() * paints.length)]) });
      }
    }
    return { slab, columns, carList, carGeo: carGeometry() };
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), SITE_ANGLE);
    data.columns.forEach((p, i) => {
      m.compose(new THREE.Vector3(p[0], BASEMENT_Y / 2, p[1]), q, new THREE.Vector3(0.7, -BASEMENT_Y, 0.7));
      cols.current!.setMatrixAt(i, m);
    });
    const qc = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), SITE_ANGLE + Math.PI / 2);
    data.carList.forEach((car, i) => {
      m.compose(new THREE.Vector3(car.p[0], BASEMENT_Y, car.p[1]), qc, new THREE.Vector3(1, 1, 1));
      cars.current!.setMatrixAt(i, m);
      cars.current!.setColorAt(i, car.c);
    });
    TOWERS.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.core.centre[0], BASEMENT_Y / 2, t.core.centre[1]), q, new THREE.Vector3(t.core.size[0], -BASEMENT_Y, t.core.size[1]));
      cores.current!.setMatrixAt(i, m);
    });
    for (const r of [cols, cars, cores]) {
      r.current!.instanceMatrix.needsUpdate = true;
      r.current!.computeBoundingSphere();
    }
    if (cars.current!.instanceColor) cars.current!.instanceColor.needsUpdate = true;
  }, [data]);

  return (
    <group>
      <mesh geometry={data.slab} material={materials.slab} receiveShadow />
      <instancedMesh ref={cols} args={[undefined, materials.column, data.columns.length]}>
        <boxGeometry />
      </instancedMesh>
      <instancedMesh ref={cars} args={[data.carGeo, materials.car, data.carList.length]} castShadow />
      <instancedMesh ref={cores} args={[undefined, materials.core, TOWERS.length]}>
        <boxGeometry />
      </instancedMesh>
    </group>
  );
}
