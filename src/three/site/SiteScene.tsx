'use client';
/* eslint-disable react-hooks/immutability -- three.js objects are mutated every frame inside useFrame by design. */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Html } from '@react-three/drei';
import Ground from './Ground';
import Towers, { type TowerHandle } from './Towers';
import Landscape, { type LandscapeUniforms } from './Landscape';
import Basement, { BASEMENT_Y } from './Basement';
import Pins from './Pins';
import CameraRig from './CameraRig';
import { makeSkyMaterial, SkyDome } from './Sky';
import { makeBasementFloorMaterial, makeCarMaterial, makeLiftLobbyMaterial, makeSolid, towerUniforms } from './materials';
import { CORE_D, CORE_W, usePlateGeometry, WALL_HEIGHT } from './FloorPlate';
import { FLOOR_H, SITE_ANGLE, TOWERS } from './layout';
import { coreRect, extrudeUp } from './Towers';
import { bungalowState, CUT_Y } from './shots';
import { lightAt, sunDirection } from '@/lib/sun';
import { setStage, stage, useStage } from '@/lib/stage';
import { layoutById, sqft } from '@/content/units';

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * Math.min(dt, 0.1)));

const SHOT_HOUR: Record<string, number> = { hero: 16.95, bungalow: 16.4, explorer: 15.9, towers: 15.2, room: 17.35 };

function Plate({ group, mats }: { group: React.RefObject<THREE.Group | null>; mats: { wall: THREE.Material; floor: THREE.Material; core: THREE.Material } }) {
  const g = usePlateGeometry();
  const show = useStage((s) => s.shot === 'bungalow' && s.progress > 0.34 && s.progress < 0.84);
  const a = layoutById('t1-a')!;
  const b = layoutById('t1-b')!;
  const t1 = TOWERS[0];
  return (
    <group ref={group} position={[t1.core.centre[0], CUT_Y + 0.2, t1.core.centre[1]]} rotation-y={SITE_ANGLE} visible={false}>
      <mesh geometry={g.floorA} material={mats.floor} receiveShadow />
      <mesh geometry={g.floorB} material={mats.floor} receiveShadow />
      <mesh geometry={g.a} material={mats.wall} castShadow receiveShadow />
      <mesh geometry={g.b} material={mats.wall} castShadow receiveShadow />
      <mesh position={[0, WALL_HEIGHT / 2 + 0.6, 0]} material={mats.core}>
        <boxGeometry args={[CORE_W * 0.82, WALL_HEIGHT + 1.2, CORE_D * 0.8]} />
      </mesh>
      {show && (
        <>
          <Html position={[g.bCentre[0], WALL_HEIGHT + 1.5, g.bCentre[1]]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
            <div className="plate-tag">
              <b>Home B</b>
              <span>
                {sqft(b.area.gross)} sq ft · {b.bedrooms}
              </span>
            </div>
          </Html>
          <Html position={[g.aCentre[0], WALL_HEIGHT + 1.5, g.aCentre[1]]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
            <div className="plate-tag">
              <b>Home A</b>
              <span>
                {sqft(a.area.gross)} sq ft · {a.bedrooms}
              </span>
            </div>
          </Html>
          <Html position={[0, WALL_HEIGHT + 3.4, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
            <div className="plate-tag plate-tag-core">
              <b>One private lift</b>
              <span>Two homes on this floor</span>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

/** A glowing band around the chosen floor of the chosen tower (Residences page floor scrubber). */
function FloorHighlight() {
  const tower = useStage((s) => s.tower);
  const floor = useStage((s) => s.floor);
  const shot = useStage((s) => s.shot);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#fff1cf', emissive: '#f3d89c', emissiveIntensity: 2.2, transparent: true, opacity: 0.88, depthWrite: false }),
    [],
  );
  const geos = useMemo(() => {
    if (!tower || !floor) return [];
    const t = TOWERS[tower - 1];
    return [...t.wings, coreRect(t)].map((w) => extrudeUp(w, FLOOR_H * 0.9, 1.1).translate(0, (floor - 1) * FLOOR_H + 0.16, 0));
  }, [tower, floor]);
  if (shot !== 'towers' || !geos.length) return null;
  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} renderOrder={3} />
      ))}
    </group>
  );
}

export default function SiteScene() {
  const { scene, gl } = useThree();
  const towerHandles = useRef(new Map<number, TowerHandle>());
  const land = useMemo<LandscapeUniforms>(() => ({ uTime: { value: 0 }, uGlow: { value: 0 } }), []);
  const quiet = useMemo(() => ({ value: 0 }), []);
  const sky = useMemo(() => makeSkyMaterial(), []);
  const sun = useRef<THREE.DirectionalLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const groundMat = useRef<THREE.MeshStandardMaterial>(null);
  const plateGroup = useRef<THREE.Group>(null);
  const basementGroup = useRef<THREE.Group>(null);
  const baseMat = useRef<THREE.MeshStandardMaterial | null>(null);
  const setBase = useCallback((m: THREE.MeshStandardMaterial) => {
    baseMat.current = m;
  }, []);
  const quality = useStage((s) => s.quality);
  const live = useRef({ hour: 16.95, lift: 0, plate: 0, basement: 0, hi: [0, 0, 0, 0, 0], dim: [0, 0, 0, 0, 0], frames: 0 });

  const mats = useMemo(
    () => ({
      plate: {
        wall: new THREE.MeshStandardMaterial({ color: '#fbf9f5', emissive: '#fbf9f5', emissiveIntensity: 0.12, roughness: 0.6, side: THREE.DoubleSide, transparent: true }),
        floor: new THREE.MeshStandardMaterial({ color: '#e3dccd', roughness: 0.8, transparent: true }),
        core: new THREE.MeshStandardMaterial({ color: '#d1be95', emissive: '#d1be95', emissiveIntensity: 0.9, roughness: 0.4, transparent: true }),
      },
      basement: {
        slab: makeBasementFloorMaterial(SITE_ANGLE),
        column: makeSolid('#cfcac0', towerUniforms(0), { roughness: 0.8, transparent: true, hazardFrom: BASEMENT_Y }),
        car: makeCarMaterial(),
        core: makeLiftLobbyMaterial(BASEMENT_Y),
      },
    }),
    [],
  );

  useEffect(() => {
    gl.shadowMap.type = THREE.PCFShadowMap;
    // The frustum props don't refresh the shadow camera's projection on their own.
    sun.current?.shadow.camera.updateProjectionMatrix();
  }, [gl]);

  useFrame((state, dt) => {
    const L0 = live.current;
    const s = stage;
    // Time of day
    const targetHour = s.shot === 'light' ? s.hour : (SHOT_HOUR[s.shot] ?? 16);
    L0.hour = damp(L0.hour, targetHour, s.shot === 'light' ? 5 : 1.4, dt);
    const L = lightAt(L0.hour);
    const dir = sunDirection(L0.hour);
    const up = Math.max(0, Math.min(1, (dir[1] + 0.02) / 0.08));
    if (sun.current) {
      sun.current.position.set(dir[0] * 320, Math.max(dir[1], 0.02) * 320, dir[2] * 320);
      sun.current.color.setRGB(...L.sun);
      sun.current.intensity = L.sunI * up * 1.35;
    }
    if (moon.current) moon.current.intensity = (1 - up) * 0.45;
    if (hemi.current) {
      hemi.current.color.setRGB(...L.sky);
      hemi.current.groundColor.setRGB(...L.ground);
      hemi.current.intensity = L.amb * 0.95;
    }
    if (scene.fog) (scene.fog as THREE.Fog).color.setRGB(...L.fog);
    const su = sky.uniforms;
    (su.uTop.value as THREE.Color).setRGB(...L.sky);
    (su.uHorizon.value as THREE.Color).setRGB(...L.fog);
    (su.uGround.value as THREE.Color).setRGB(...L.ground);
    (su.uSun.value as THREE.Color).setRGB(...L.sun);
    (su.uSunDir.value as THREE.Vector3).set(...dir);
    su.uSunI.value = up;
    land.uTime.value += dt;
    land.uGlow.value = L.windows * 0.85;
    // The Residences picker shows the neighbourhood as plain massing, so the five towers read on their own.
    quiet.value = damp(quiet.value, s.shot === 'towers' ? 1 : 0, 3, dt);

    // Chapter-driven state: Tower 1 lifting apart, the floor plate, the basement reveal.
    const b =
      s.shot === 'bungalow'
        ? bungalowState(s.progress)
        : { lift: 0, plate: 0, basement: s.shot === 'explorer' && s.chapter === 6 ? 1 : 0 };
    const k = s.shot === 'bungalow' ? 7 : 3;
    L0.lift = damp(L0.lift, b.lift, k, dt);
    L0.plate = damp(L0.plate, b.plate, k, dt);
    L0.basement = damp(L0.basement, b.basement, 3.5, dt);

    const t1 = towerHandles.current.get(1);
    if (t1?.upper) t1.upper.position.y = L0.lift;
    if (plateGroup.current) {
      plateGroup.current.visible = L0.plate > 0.01;
      const sc = 0.92 + 0.08 * L0.plate;
      plateGroup.current.scale.setScalar(sc);
      plateGroup.current.position.y = CUT_Y + 0.2 + (1 - L0.plate) * 2;
      for (const m of Object.values(mats.plate)) {
        m.opacity = L0.plate;
        // Only blend while fading: opaque walls sort and shade cleanly once the plate has landed.
        const fading = L0.plate < 0.985;
        if (m.transparent !== fading) {
          m.transparent = fading;
          m.needsUpdate = true;
        }
      }
    }
    if (basementGroup.current) {
      basementGroup.current.visible = L0.basement > 0.01;
      for (const m of Object.values(mats.basement)) m.opacity = L0.basement;
    }
    if (groundMat.current) {
      groundMat.current.opacity = 1 - 0.82 * L0.basement;
      const see = L0.basement > 0.001;
      if (groundMat.current.transparent !== see) {
        groundMat.current.transparent = see;
        groundMat.current.depthWrite = !see;
        groundMat.current.needsUpdate = true;
      }
    }
    if (baseMat.current) {
      baseMat.current.opacity = 1 - 0.9 * L0.basement;
      const see = L0.basement > 0.001;
      if (baseMat.current.transparent !== see) {
        baseMat.current.transparent = see;
        baseMat.current.depthWrite = !see;
        baseMat.current.needsUpdate = true;
      }
    }

    // Tower highlight / dim
    const pick = s.shot === 'towers' || (s.shot === 'explorer' && s.chapter === 3);
    TOWERS.forEach((t, i) => {
      const h = towerHandles.current.get(t.id);
      if (!h) return;
      const hiTarget = pick ? (s.tower === t.id ? (s.floor ? 0.35 : 1) : s.hoverTower === t.id ? 0.55 : 0) : 0;
      // Focus: dim the other towers when one is picked, while Tower 1 opens up, and over the basement.
      const focusT1 = s.shot === 'bungalow' && s.progress > 0.2 && s.progress < 0.86 && t.id !== 1;
      const dimTarget = (pick && s.tower && s.tower !== t.id) || focusT1 || L0.basement > 0.5 ? 1 : 0;
      L0.hi[i] = damp(L0.hi[i], hiTarget, 6, dt);
      L0.dim[i] = damp(L0.dim[i], dimTarget, 5, dt);
      h.uniforms.uHighlight.value = L0.hi[i];
      h.uniforms.uDim.value = L0.dim[i];
      h.uniforms.uWindows.value = L.windows;
    });

    // Tell the page once real frames are on screen.
    if (!s.ready && ++L0.frames > 3) setStage({ ready: true });
    void state;
  });

  return (
    <>
      <SkyDome material={sky} />
      <fog attach="fog" args={['#dfe5e8', 320, 1150]} />
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
        shadow-camera-left={-125}
        shadow-camera-right={125}
        shadow-camera-top={125}
        shadow-camera-bottom={-125}
        shadow-camera-near={10}
        shadow-camera-far={700}
      />
      <directionalLight ref={moon} position={[-120, 220, -80]} color="#8ea6d6" intensity={0} />
      {/* 256 px so the cloud deck reads in the glass; still one sky draw per cube face per frame. */}
      <Environment frames={Infinity} resolution={quality === 'low' ? 128 : 256} environmentIntensity={0.42}>
        <SkyDome material={sky} radius={60} />
      </Environment>

      <Ground groundRef={groundMat} baseRef={setBase} glow={land.uGlow} quiet={quiet} />
      <Towers onHandle={(id, h) => towerHandles.current.set(id, h)} />
      <Landscape uniforms={land} />
      <group ref={basementGroup} visible={false}>
        <Basement materials={mats.basement} />
      </group>
      <Plate group={plateGroup} mats={mats.plate} />
      <FloorHighlight />
      <Pins />
      <CameraRig />
    </>
  );
}
