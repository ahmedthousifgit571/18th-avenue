'use client';
/* eslint-disable react-hooks/immutability -- three.js objects are mutated every frame inside useFrame by design. */

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { drag, stage } from '@/lib/stage';
import { bungalowCam, EXPLORER, heroCam, LIGHT_CAM, towersCam, type Cam } from './shots';

const tmp = new THREE.Vector3();

/** Where the subject sits on screen for each shot, as a view offset (fractions of width / height). */
function framing(portrait: boolean): [number, number] {
  if (!stage.framed) return [0, 0];
  switch (stage.shot) {
    case 'hero':
      return portrait ? [0, 0.12] : [-0.12, 0.02];
    case 'bungalow':
      return portrait ? [0, 0.15] : [-0.15, 0];
    case 'explorer':
      return [0, portrait ? 0.1 : 0.05];
    case 'light':
      return portrait ? [0, 0.02] : [-0.13, -0.07];
    case 'towers':
      return portrait ? [0, 0.2] : [0.19, 0];
    default:
      return [0, 0];
  }
}

export function desiredCam(time: number): Cam {
  switch (stage.shot) {
    case 'hero':
      return heroCam(stage.progress, time);
    case 'bungalow':
      return bungalowCam(stage.progress);
    case 'explorer': {
      const c = EXPLORER[stage.chapter] ?? EXPLORER[0];
      // A slow drift so a resting chapter still breathes.
      const d = Math.sin(time * 0.15) * 0.04;
      const pos: Cam['pos'] = [c.pos[0] + (c.pos[2] - c.target[2]) * d, c.pos[1], c.pos[2] - (c.pos[0] - c.target[0]) * d];
      return { ...c, pos };
    }
    case 'light':
      return LIGHT_CAM;
    case 'towers':
      return towersCam(stage.tower, !stage.framed);
    default:
      return heroCam(0, time);
  }
}

/** Damps the camera towards the active shot and adds the visitor's drag (orbit about the target). */
export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const cur = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; fov: number; ox: number; oy: number } | null>(null);

  useFrame(({ clock }, dt) => {
    const want = desiredCam(clock.elapsedTime);
    if (!cur.current) {
      cur.current = { pos: new THREE.Vector3(...want.pos), target: new THREE.Vector3(...want.target), fov: want.fov, ox: 0, oy: 0 };
    }
    const c = cur.current;
    const k = stage.shot === 'bungalow' ? 6 : 3.2;
    const step = 1 - Math.exp(-k * Math.min(dt, 0.1));
    c.pos.lerp(tmp.set(...want.pos), step);
    c.target.lerp(tmp.set(...want.target), step);
    c.fov += (want.fov - c.fov) * step;

    // Drag springs back when released.
    if (!stage.dragging) {
      drag.yaw *= Math.exp(-1.6 * Math.min(dt, 0.1));
      drag.pitch *= Math.exp(-2.2 * Math.min(dt, 0.1));
    }
    const offset = tmp.copy(c.pos).sub(c.target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    sph.theta += drag.yaw;
    sph.phi = THREE.MathUtils.clamp(sph.phi - drag.pitch, 0.12, stage.shot === 'bungalow' ? 2.2 : 1.45);
    // Portrait screens have a narrow horizontal field of view: step back so the model still fits across.
    const aspect = size.width / Math.max(1, size.height);
    if (aspect < 1 && stage.shot !== 'bungalow') sph.radius *= Math.min(1.85, Math.pow(1 / aspect, 0.62));
    else if (aspect < 1) sph.radius *= Math.min(1.5, Math.pow(1 / aspect, 0.4));
    offset.setFromSpherical(sph);
    camera.position.copy(c.target).add(offset);
    camera.lookAt(c.target);
    const [fx, fy] = framing(size.height > size.width);
    c.ox += (fx - c.ox) * step;
    c.oy += (fy - c.oy) * step;
    camera.fov = c.fov;
    camera.setViewOffset(size.width, size.height, c.ox * size.width, c.oy * size.height, size.width, size.height);
  });
  return null;
}
