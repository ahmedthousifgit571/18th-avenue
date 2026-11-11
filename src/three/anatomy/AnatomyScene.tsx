'use client';
/* eslint-disable react-hooks/immutability -- three.js objects are mutated every frame inside useFrame by design. */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Html } from '@react-three/drei';
import { makeSkyMaterial, SkyDome } from '../site/Sky';
import {
  makeBasementFloorMaterial,
  makeCarMaterial,
  makeGlass,
  makeGroundMaterial,
  makeLiftLobbyMaterial,
  makeSolid,
  PALETTE,
  towerUniforms,
} from '../site/materials';
import { usePlateGeometry, WALL_HEIGHT } from '../site/FloorPlate';
import { carGeometry } from '../site/Basement';
import { SITE_ANGLE } from '../site/layout';
import { lightAt, sunDirection } from '@/lib/sun';
import { layoutById, sqft } from '@/content/units';
import { anatomyCopy, type AnatomyChapterId } from '@/content/home';
import { BASE_Y, buildBasement, buildTower, CORE_SIZE, CORE_TOP, CUT_Y, edges } from './model';
import { anatomyDrag } from './state';

type LayerId = 'slabs' | 'walls' | 'core' | 'facade' | 'plate' | 'basement';
const LAYERS: LayerId[] = ['slabs', 'walls', 'core', 'facade', 'plate', 'basement'];
/** Layers that stay out of sight unless a chapter is about them (they sit inside or under the tower). */
const TUCKED: LayerId[] = ['plate', 'basement'];
const GHOST = 0.035;
const GHOST_EDGE = 0.09;
const LINE = '#314759';
const HORIZON = '#e4e3d9';

type V3 = [number, number, number];
type Cam = { pos: V3; target: V3; fov: number };
type ChapterDef = { members: LayerId[]; cam: Cam; lift?: number; ground?: number; coreOpacity?: number; liftCar?: boolean };

/** What each chapter isolates, and where the camera stands (tower frame: core at the origin, long axis along x). */
const CHAPTERS: Record<AnatomyChapterId, ChapterDef> = {
  full: { members: [], cam: { pos: [-78, 20, 172], target: [3, 33, 0], fov: 30 } },
  slabs: { members: ['slabs'], cam: { pos: [118, 96, 132], target: [0, 30, 0], fov: 30 } },
  walls: { members: ['walls', 'core'], cam: { pos: [-70, 150, 112], target: [0, 22, 0], fov: 30 } },
  lift: { members: ['core'], cam: { pos: [70, 34, 150], target: [0, 29, 0], fov: 30 }, coreOpacity: 0.55, liftCar: true },
  homes: { members: ['plate'], cam: { pos: [-46, CUT_Y + 50, 66], target: [0, CUT_Y + 5, 0], fov: 32 }, lift: 15 },
  facade: { members: ['facade'], cam: { pos: [104, 26, 132], target: [-2, 34, 0], fov: 30 } },
  basement: { members: ['basement', 'core'], cam: { pos: [70, 40, 92], target: [0, -2, 0], fov: 32 }, ground: 0.1, liftCar: true },
};
const IDS = anatomyCopy.chapters.map((c) => c.id);
const OUTRO: Cam = { pos: [-92, 30, 160], target: [0, 32, 0], fov: 30 };

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * Math.min(dt, 0.1)));

/** `quiet` lines (fins, panels, crown) only draw when their layer is the subject: as ghosts they turn to hatching. */
type Registry = Map<LayerId, { solids: THREE.Mesh[]; lines: THREE.LineSegments[]; quiet: THREE.LineSegments[] }>;

function setFade(m: THREE.Material, v: number) {
  m.opacity = v;
  const fading = v < 0.99;
  if (m.transparent !== fading) {
    m.transparent = fading;
    m.depthWrite = !fading;
    m.needsUpdate = true;
  }
}

/** One solid mesh plus its edge lines, filed under a layer so the director can fade both. */
function Part({ layer, geometry, material, reg, lineMat, edgeAngle, quiet }: { layer: LayerId; geometry: THREE.BufferGeometry; material: THREE.Material; reg: Registry; lineMat: THREE.LineBasicMaterial; edgeAngle?: number; quiet?: boolean }) {
  const lines = useMemo(() => edges(geometry, edgeAngle), [geometry, edgeAngle]);
  useEffect(() => () => lines.dispose(), [lines]);
  const entry = reg.get(layer)!;
  return (
    <>
      <mesh
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        ref={(m) => {
          if (m && !entry.solids.includes(m)) entry.solids.push(m);
          return () => {
            if (m) entry.solids.splice(entry.solids.indexOf(m), 1);
          };
        }}
      />
      <lineSegments
        geometry={lines}
        material={lineMat}
        renderOrder={2}
        ref={(l) => {
          const list = quiet ? entry.quiet : entry.lines;
          if (l && !list.includes(l)) list.push(l);
          return () => {
            if (l) list.splice(list.indexOf(l), 1);
          };
        }}
      />
    </>
  );
}

function Rig({ chapter, outro }: { chapter: number; outro: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const cur = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; fov: number; spin: number; ox: number; oy: number } | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const sph = useMemo(() => new THREE.Spherical(), []);

  useFrame(({ clock }, dt) => {
    const want = outro ? OUTRO : CHAPTERS[IDS[chapter] ?? 'full'].cam;
    if (!cur.current) cur.current = { pos: new THREE.Vector3(...want.pos), target: new THREE.Vector3(...want.target), fov: want.fov, spin: 0, ox: 0, oy: 0 };
    const c = cur.current;
    const step = 1 - Math.exp(-2.4 * Math.min(dt, 0.1));
    c.pos.lerp(tmp.set(...want.pos), step);
    c.target.lerp(tmp.set(...want.target), step);
    c.fov += (want.fov - c.fov) * step;
    // The end card turns the tower slowly; chapters only breathe.
    c.spin = outro ? c.spin + dt * 0.07 : damp(c.spin, 0, 1.2, dt);

    if (!anatomyDrag.dragging) {
      anatomyDrag.yaw *= Math.exp(-0.9 * Math.min(dt, 0.1));
      anatomyDrag.pitch *= Math.exp(-1.6 * Math.min(dt, 0.1));
    }
    const offset = tmp.copy(c.pos).sub(c.target);
    sph.setFromVector3(offset);
    sph.theta += anatomyDrag.yaw + c.spin + Math.sin(clock.elapsedTime * 0.13) * 0.035;
    sph.phi = THREE.MathUtils.clamp(sph.phi - anatomyDrag.pitch, 0.18, 1.62);
    // Portrait screens see little across: step back so the tower still fits.
    const aspect = size.width / Math.max(1, size.height);
    if (aspect < 1) sph.radius *= Math.min(1.7, Math.pow(1 / aspect, 0.55));
    offset.setFromSpherical(sph);
    camera.position.copy(c.target).add(offset);
    camera.lookAt(c.target);
    camera.fov = c.fov;
    // Phones: lift the subject clear of the caption block. End card: move the tower right of the copy.
    const fx = outro && aspect >= 1 ? -0.17 : 0;
    const fy = aspect < 1 ? (outro ? 0.16 : 0.08) : 0;
    c.ox = damp(c.ox, fx, 2.4, dt);
    c.oy = damp(c.oy, fy, 2.4, dt);
    camera.setViewOffset(size.width, size.height, c.ox * size.width, c.oy * size.height, size.width, size.height);
  });
  return null;
}

export default function AnatomyScene({ chapter, outro, onReady }: { chapter: number; outro: boolean; onReady?: () => void }) {
  const gl = useThree((s) => s.gl);
  const model = useMemo(() => buildTower(), []);
  const base = useMemo(() => buildBasement(), []);
  const carGeo = useMemo(() => carGeometry(), []);
  const plate = usePlateGeometry();
  const reg = useMemo<Registry>(() => new Map(LAYERS.map((l) => [l, { solids: [], lines: [], quiet: [] }])), []);
  const upper = useRef<THREE.Group>(null);
  const liftCar = useRef<THREE.Mesh>(null);
  const cars = useRef<THREE.InstancedMesh>(null);
  const sun = useRef<THREE.DirectionalLight>(null);

  const light = useMemo(() => {
    const hour = 15.6;
    const L = lightAt(hour);
    // Sun direction from the site frame into the tower frame.
    const d = sunDirection(hour);
    const c = Math.cos(SITE_ANGLE);
    const s = Math.sin(SITE_ANGLE);
    const dir: V3 = [d[0] * c - d[2] * s, d[1], d[0] * s + d[2] * c];
    return { L, dir };
  }, []);

  const sky = useMemo(() => {
    const m = makeSkyMaterial();
    const { L, dir } = light;
    // A clearer, bluer sky than the site model's warm afternoon key, so the pale layers read against it.
    (m.uniforms.uTop.value as THREE.Color).set('#4f84c4');
    (m.uniforms.uHorizon.value as THREE.Color).set(HORIZON);
    (m.uniforms.uGround.value as THREE.Color).setRGB(...L.ground);
    (m.uniforms.uSun.value as THREE.Color).setRGB(...L.sun);
    (m.uniforms.uSunDir.value as THREE.Vector3).set(...dir);
    m.uniforms.uSunI.value = 1;
    m.uniforms.uCover.value = 0.6;
    return m;
  }, [light]);

  const mats = useMemo(() => {
    const u = towerUniforms(7.31);
    const solid = (color: string, o: Parameters<typeof makeSolid>[2] = {}) => {
      const m = makeSolid(color, u, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...o });
      return m;
    };
    const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...p });
    const glass = makeGlass(u);
    glass.polygonOffset = true;
    glass.polygonOffsetFactor = 1;
    glass.polygonOffsetUnits = 1;
    const bSlab = makeBasementFloorMaterial(0);
    const car = makeCarMaterial();
    const lobby = makeLiftLobbyMaterial(BASE_Y);
    const solids: Record<LayerId, THREE.Material[]> = {
      slabs: [solid(PALETTE.slab, { roughness: 0.55 })],
      walls: [solid('#e7e2d8', { roughness: 0.82 })],
      core: [solid(PALETTE.core, { roughness: 0.85 })],
      facade: [
        glass,
        solid(PALETTE.fin, { roughness: 0.5, metalness: 0.25 }),
        solid(PALETTE.panel, { roughness: 0.62, metalness: 0.05, grain: true }),
        solid(PALETTE.crown, { roughness: 0.5 }),
        solid(PALETTE.roofGreen, { roughness: 0.95 }),
      ],
      plate: [
        std({ color: '#fbf9f5', emissive: '#fbf9f5', emissiveIntensity: 0.12, roughness: 0.6, side: THREE.DoubleSide }),
        std({ color: '#e3dccd', roughness: 0.8 }),
      ],
      basement: [bSlab, solid('#cfcac0', { roughness: 0.8, hazardFrom: BASE_Y }), car, lobby],
    };
    const lineMat = () => new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const lines = Object.fromEntries(LAYERS.map((l) => [l, lineMat()])) as Record<LayerId, THREE.LineBasicMaterial>;
    const quiet = Object.fromEntries(LAYERS.map((l) => [l, lineMat()])) as Record<LayerId, THREE.LineBasicMaterial>;
    const ground = makeGroundMaterial('#6f8452');
    const plinth = new THREE.MeshStandardMaterial({ color: '#d8d1c3', roughness: 0.9 });
    const hedge = new THREE.MeshStandardMaterial({ color: '#4f6a3c', roughness: 1 });
    const lift = new THREE.MeshStandardMaterial({ color: '#fff1cf', emissive: '#f3d08a', emissiveIntensity: 2.4, transparent: true, opacity: 0, toneMapped: false });
    return { solids, lines, quiet, ground, plinth, hedge, lift, u };
  }, []);

  // Planting strips around the plinth: a model-maker's hedge line that gives the tower its scale.
  const hedges = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const list: THREE.Matrix4[] = [];
    const add = (x: number, z: number, sx: number, sz: number) => list.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.55, z), new THREE.Quaternion(), new THREE.Vector3(sx, 0.9, sz)));
    add(0, -21.5, 62, 1.4);
    add(-12, 21.5, 38, 1.4);
    add(-31.5, 0, 1.4, 41);
    add(31.5, -6, 1.4, 29);
    return { g, list };
  }, []);
  const hedgeRef = useRef<THREE.InstancedMesh>(null);

  const plateTags = useMemo(() => {
    const a = layoutById('t1-a')!;
    const b = layoutById('t1-b')!;
    return { a: `${sqft(a.area.gross)} sq ft · ${a.bedrooms}`, b: `${sqft(b.area.gross)} sq ft · ${b.bedrooms}` };
  }, []);

  useEffect(() => {
    gl.shadowMap.type = THREE.PCFShadowMap;
    sun.current?.shadow.camera.updateProjectionMatrix();
  }, [gl]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    base.cars.forEach((c, i) => {
      m.compose(new THREE.Vector3(c.x, BASE_Y, c.z), q, new THREE.Vector3(1, 1, 1));
      cars.current!.setMatrixAt(i, m);
      cars.current!.setColorAt(i, c.color);
    });
    cars.current!.instanceMatrix.needsUpdate = true;
    if (cars.current!.instanceColor) cars.current!.instanceColor.needsUpdate = true;
    cars.current!.computeBoundingSphere();
    hedges.list.forEach((mx, i) => hedgeRef.current!.setMatrixAt(i, mx));
    hedgeRef.current!.instanceMatrix.needsUpdate = true;
    hedgeRef.current!.computeBoundingSphere();
  }, [base, hedges]);

  const live = useRef({ vis: {} as Record<LayerId, number>, edge: {} as Record<LayerId, number>, quiet: {} as Record<LayerId, number>, lift: 0, ground: 1, car: 0, frames: 0 });

  useFrame(({ clock }, dt) => {
    const L = live.current;
    const id = outro ? 'full' : (IDS[chapter] ?? 'full');
    const def = CHAPTERS[id];
    const full = id === 'full';
    // The first frames draw every layer see-through, then solid, so both shader variants of every material compile
    // while the canvas is still under the film still (switching later would hitch on the first chapter change).
    const warm = L.frames < 6;
    const warmV = L.frames < 3 ? 0.5 : 1;
    for (const layer of LAYERS) {
      const member = def.members.includes(layer);
      const tucked = TUCKED.includes(layer);
      const vTarget = warm ? warmV : full ? (tucked ? 0 : 1) : member ? (layer === 'core' && def.coreOpacity ? def.coreOpacity : 1) : tucked ? 0 : GHOST;
      const eTarget = warm || full ? 0 : member ? 1 : tucked ? 0 : GHOST_EDGE;
      const v = (L.vis[layer] = warm ? vTarget : damp(L.vis[layer] ?? vTarget, vTarget, 4.2, dt));
      const e = (L.edge[layer] = damp(L.edge[layer] ?? 0, eTarget, 4.2, dt));
      const q = (L.quiet[layer] = damp(L.quiet[layer] ?? 0, member && !full && !warm ? 1 : 0, 4.2, dt));
      for (const m of mats.solids[layer]) setFade(m, v);
      mats.lines[layer].opacity = e;
      mats.quiet[layer].opacity = q;
      const entry = reg.get(layer)!;
      for (const s of entry.solids) {
        s.visible = v > 0.004;
        s.castShadow = v > 0.6;
      }
      for (const l of entry.lines) l.visible = e > 0.004;
      for (const l of entry.quiet) l.visible = q > 0.004;
    }
    if (cars.current) cars.current.visible = (L.vis.basement ?? 0) > 0.004;

    L.lift = damp(L.lift, def.lift ?? 0, 3, dt);
    if (upper.current) upper.current.position.y = L.lift;

    L.ground = warm ? warmV : damp(L.ground, def.ground ?? 1, 3.5, dt);
    for (const m of [mats.ground, mats.plinth, mats.hedge]) setFade(m, L.ground);

    L.car = damp(L.car, def.liftCar && !outro ? 1 : 0, 4, dt);
    mats.lift.opacity = L.car;
    if (liftCar.current) {
      liftCar.current.visible = L.car > 0.01;
      const t = 0.5 - 0.5 * Math.cos(clock.elapsedTime * 0.42);
      liftCar.current.position.y = BASE_Y + 1.4 + (CORE_TOP - 4.5 - BASE_Y) * t;
    }
    if (L.frames++ === 9) onReady?.();
  });

  const lm = mats.lines;
  const S = mats.solids;
  const P = (layer: LayerId, geometry: THREE.BufferGeometry, material: THREE.Material, edgeAngle?: number, quiet = false) => (
    <Part
      key={`${layer}-${geometry.uuid}`}
      layer={layer}
      geometry={geometry}
      material={material}
      reg={reg}
      lineMat={quiet ? mats.quiet[layer] : lm[layer]}
      edgeAngle={edgeAngle}
      quiet={quiet}
    />
  );
  const stack = (k: 'lower' | 'upper') => (
    <>
      {P('slabs', model.slabs[k], S.slabs[0])}
      {P('walls', model.walls[k], S.walls[0])}
      {P('core', model.core[k], S.core[0])}
      {P('facade', model.glass[k], S.facade[0])}
      {P('facade', model.fins[k], S.facade[1], 60, true)}
      {P('facade', model.panels[k], S.facade[2], 60, true)}
    </>
  );

  const { L, dir } = light;
  const fogColor = useMemo(() => new THREE.Color(HORIZON), []);
  const show = !outro && IDS[chapter] === 'homes';
  const showLobby = !outro && IDS[chapter] === 'basement';

  return (
    <>
      <SkyDome material={sky} />
      <fog attach="fog" args={[fogColor, 260, 1000]} />
      <hemisphereLight color={new THREE.Color(...L.sky)} groundColor={new THREE.Color(...L.ground)} intensity={L.amb * 0.95} />
      <directionalLight
        ref={sun}
        position={[dir[0] * 200, Math.max(dir[1], 0.25) * 200, dir[2] * 200]}
        color={new THREE.Color(...L.sun)}
        intensity={L.sunI * 1.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.5}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={80}
        shadow-camera-bottom={-40}
        shadow-camera-near={20}
        shadow-camera-far={500}
      />
      <Environment frames={1} resolution={256} environmentIntensity={0.42}>
        <SkyDome material={sky} radius={60} />
      </Environment>

      {/* Ground: the lawn, a stone plinth and its hedges. */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} material={mats.ground} receiveShadow>
        <circleGeometry args={[600, 64]} />
      </mesh>
      <mesh position={[0, 0.06, 0]} material={mats.plinth} receiveShadow>
        <boxGeometry args={[66, 0.12, 46]} />
      </mesh>
      <instancedMesh ref={hedgeRef} args={[hedges.g, mats.hedge, hedges.list.length]} castShadow receiveShadow />

      <group>
        {stack('lower')}
        {/* The typical floor, traced from the Type 1 plans: Home B, the lift core, Home A. */}
        <group position={[0, CUT_Y + 0.2, 0]}>
          {P('plate', plate.floorA, S.plate[1])}
          {P('plate', plate.floorB, S.plate[1])}
          {P('plate', plate.a, S.plate[0], 70)}
          {P('plate', plate.b, S.plate[0], 70)}
          {show && (
            <>
              <Html position={[plate.bCentre[0], WALL_HEIGHT + 1.5, plate.bCentre[1]]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
                <div className="plate-tag">
                  <b>Home B</b>
                  <span>{plateTags.b}</span>
                </div>
              </Html>
              <Html position={[plate.aCentre[0], WALL_HEIGHT + 1.5, plate.aCentre[1]]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
                <div className="plate-tag">
                  <b>Home A</b>
                  <span>{plateTags.a}</span>
                </div>
              </Html>
              <Html position={[0, WALL_HEIGHT + 9.5, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
                <div className="plate-tag plate-tag-core">
                  <b>One private lift</b>
                  <span>Two homes on this floor</span>
                </div>
              </Html>
            </>
          )}
        </group>
      </group>
      <group ref={upper}>
        {stack('upper')}
        {P('facade', model.crown, S.facade[3], 60, true)}
        {P('facade', model.planters, S.facade[4], 24, true)}
      </group>

      {/* The lift car riding the shaft (Private Lift and Basement chapters). */}
      <mesh ref={liftCar} material={mats.lift} visible={false}>
        <boxGeometry args={[CORE_SIZE[0] * 0.42, 2.6, CORE_SIZE[1] * 0.36]} />
        {!outro && IDS[chapter] === 'lift' && (
          <Html position={[CORE_SIZE[0] * 0.5 + 2, 0, 0]} zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
            <div className="plate-tag plate-tag-core -translate-y-1/2">
              <b>One lift</b>
              <span>Two homes at every stop</span>
            </div>
          </Html>
        )}
      </mesh>

      {/* Basement */}
      <group>
        {P('basement', base.slab, S.basement[0])}
        {P('basement', base.columns, S.basement[1])}
        <instancedMesh ref={cars} args={[undefined, S.basement[2], base.cars.length]} castShadow visible={false}>
          <primitive object={carGeo} attach="geometry" />
        </instancedMesh>
        <mesh
          position={[0, BASE_Y / 2, 0]}
          material={S.basement[3]}
          ref={(m) => {
            const e = reg.get('basement')!;
            if (m && !e.solids.includes(m)) e.solids.push(m);
            return () => {
              if (m) e.solids.splice(e.solids.indexOf(m), 1);
            };
          }}
        >
          <boxGeometry args={base.lobby} />
        </mesh>
        {showLobby && (
          <Html position={[0, 1.2, CORE_SIZE[1] * 0.7]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
            <div className="plate-tag plate-tag-core">
              <b>Your private lift lobby</b>
              <span>Straight from your carpark</span>
            </div>
          </Html>
        )}
      </group>
      <Rig chapter={chapter} outro={outro} />
    </>
  );
}
