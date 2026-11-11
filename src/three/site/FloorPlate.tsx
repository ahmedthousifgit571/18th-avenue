'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import plans from '@/content/plans.json';

/** The client's Type 1 drawings are 52.5 px per metre (15,350 mm across the outer walls of plan t1-a). */
const PX_PER_M = 52.5;
const WALL_H = 2.9;
export const CORE_W = 6.2;
export const CORE_D = 7.4;

function wallsFrom(d: string) {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
  const shapes = data.paths.flatMap((p) => p.toShapes());
  const g = new THREE.ExtrudeGeometry(shapes, { depth: WALL_H, bevelEnabled: false, curveSegments: 2 });
  // SVG is y-down; flip so the drawing reads the right way round once laid flat (+z = down the page).
  g.scale(1 / PX_PER_M, -1 / PX_PER_M, 1);
  g.rotateX(-Math.PI / 2);
  g.computeBoundingBox();
  return g;
}

export type PlateGeometry = {
  a: THREE.BufferGeometry;
  b: THREE.BufferGeometry;
  floorA: THREE.BufferGeometry;
  floorB: THREE.BufferGeometry;
  width: number;
  depth: number;
  aCentre: [number, number];
  bCentre: [number, number];
};

/**
 * One typical floor of Tower 1, built from the traced walls of the live plans: Unit B on the left, the shared lift
 * core in the middle, Unit A on the right (each plan's foyer faces the core).
 */
export function usePlateGeometry(): PlateGeometry {
  return useMemo(() => {
    const a = wallsFrom(plans['t1-a'].d);
    const b = wallsFrom(plans['t1-b'].d);
    const ba = a.boundingBox!;
    const bb = b.boundingBox!;
    // Centre each plan vertically on the core; butt their foyer sides against it.
    a.translate(CORE_W / 2 - ba.min.x, 0, -(ba.min.z + ba.max.z) / 2);
    b.translate(-CORE_W / 2 - bb.max.x, 0, -(bb.min.z + bb.max.z) / 2);
    a.computeBoundingBox();
    b.computeBoundingBox();
    const floorOf = (g: THREE.BufferGeometry) => {
      const box = g.boundingBox!;
      const f = new THREE.BoxGeometry(box.max.x - box.min.x + 0.6, 0.3, box.max.z - box.min.z + 0.6);
      f.translate((box.min.x + box.max.x) / 2, -0.15, (box.min.z + box.max.z) / 2);
      return f;
    };
    const A = a.boundingBox!;
    const B = b.boundingBox!;
    return {
      a,
      b,
      floorA: floorOf(a),
      floorB: floorOf(b),
      width: A.max.x - B.min.x,
      depth: Math.max(A.max.z - A.min.z, B.max.z - B.min.z),
      aCentre: [(A.min.x + A.max.x) / 2, (A.min.z + A.max.z) / 2],
      bCentre: [(B.min.x + B.max.x) / 2, (B.min.z + B.max.z) / 2],
    };
  }, []);
}

export const WALL_HEIGHT = WALL_H;
