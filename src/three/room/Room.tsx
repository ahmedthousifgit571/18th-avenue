'use client';
/* eslint-disable react-hooks/immutability -- three.js objects are mutated every frame inside useFrame by design. */

import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { FINISHES, makeFinishMaterials } from './finishes';
import { lightAt, sunPosition } from '@/lib/sun';
import { setStage, stage, type FinishSlot } from '@/lib/stage';
import { seeded } from '@/three/site/layout';

const W = 9.2;
const D = 6.8;
const H = 3.1; // flat slabs and shear walls: the brief's "higher ceiling height"
const WINDOW_AZ = 250; // the window faces west-south-west, into the evening sun

export const look = { yaw: 0, pitch: 0 };

/** Draws a Bandar Seri Begawan skyline (mosque dome and minaret, low city, palms) for the view out of the window. */
function skyline() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 512;
  const g = c.getContext('2d')!;
  const r = seeded(9);
  // Drawn in white on a transparent canvas: the material colour tints it, the canvas alpha cuts it out.
  g.fillStyle = '#fff';
  // Distant hills
  g.globalAlpha = 0.45;
  g.beginPath();
  g.moveTo(0, 360);
  for (let x = 0; x <= 2048; x += 32) g.lineTo(x, 330 + Math.sin(x * 0.004) * 26 + Math.sin(x * 0.013) * 9);
  g.lineTo(2048, 512);
  g.lineTo(0, 512);
  g.fill();
  g.globalAlpha = 1;
  // Low city blocks
  for (let x = 0; x < 2048; ) {
    const w = 30 + r() * 90;
    const h = 30 + r() * r() * 120;
    g.fillRect(x, 430 - h, w, h + 82);
    x += w + r() * 10;
  }
  // The mosque: a golden dome on a drum, with a slender minaret
  const mx = 1180;
  g.fillRect(mx - 120, 330, 240, 120);
  g.fillRect(mx - 52, 270, 104, 70);
  g.beginPath();
  g.ellipse(mx, 272, 62, 70, 0, Math.PI, 0);
  g.fill();
  g.fillRect(mx - 3, 182, 6, 24);
  g.fillRect(mx + 210, 160, 22, 290);
  g.beginPath();
  g.moveTo(mx + 204, 162);
  g.lineTo(mx + 221, 112);
  g.lineTo(mx + 238, 162);
  g.fill();
  // Palms and canopy along the front
  for (let x = -20; x < 2068; x += 40 + r() * 70) {
    const y = 455 + r() * 20;
    g.beginPath();
    g.ellipse(x, y, 40 + r() * 40, 26 + r() * 20, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillRect(0, 470, 2048, 42);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;

  // Night: scattered warm windows on the same silhouette
  const n = document.createElement('canvas');
  n.width = 1024;
  n.height = 256;
  const ng = n.getContext('2d')!;
  for (let i = 0; i < 420; i++) {
    ng.fillStyle = `rgba(255,${190 + r() * 50},${120 + r() * 60},${0.5 + r() * 0.5})`;
    ng.fillRect(r() * 1024, 150 + r() * 70, 2 + r() * 2, 2 + r() * 2);
  }
  ng.fillStyle = 'rgba(255,214,140,0.9)';
  ng.beginPath();
  ng.ellipse(590, 136, 31, 35, 0, Math.PI, 0);
  ng.fill();
  const nt = new THREE.CanvasTexture(n);
  nt.colorSpace = THREE.SRGBColorSpace;
  return { silhouette: t, lights: nt };
}

/** Sky gradient, sun glow, the skyline silhouette and its night windows, in one opaque material. */
function makeSky(view: { silhouette: THREE.Texture; lights: THREE.Texture }) {
  return new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uGlowI: { value: 0 },
      uSil: { value: view.silhouette },
      uLights: { value: view.lights },
      uSilColor: { value: new THREE.Color('#4d443a') },
      uNight: { value: 0 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uTop, uHorizon, uGlow, uSilColor; uniform float uGlowI, uNight; uniform sampler2D uSil, uLights; varying vec2 vUv;
      void main(){
        vec3 c = mix(uHorizon, uTop, smoothstep(0.32, 1.0, vUv.y));
        c += uGlow * uGlowI * exp(-pow((vUv.x - 0.32) * 3.0, 2.0) - pow((vUv.y - 0.36) * 5.0, 2.0));
        // The skyline band sits just above eye level, across the middle of the view.
        vec2 suv = vec2(vUv.x, (vUv.y - 0.2) / 0.58);
        if (suv.y > 0.0 && suv.y < 1.0) {
          float a = texture2D(uSil, suv).a;
          c = mix(c, mix(uSilColor, uHorizon, 0.38), a); // atmospheric haze on the distant city
          c += texture2D(uLights, suv).rgb * texture2D(uLights, suv).a * uNight * a;
        }
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

type SlotProps = { slot: FinishSlot; children: React.ReactNode };

/** Wraps selectable surfaces: a click (not a drag) cycles that surface to its next finish. */
function Slot({ slot, children }: SlotProps) {
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setStage({ selectedSurface: slot });
    document.body.dataset.roomHover = slot;
  };
  const out = () => {
    if (document.body.dataset.roomHover === slot) delete document.body.dataset.roomHover;
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    const opts = FINISHES[slot].options;
    const cur = opts.findIndex((o) => o.id === stage.finishes[slot]);
    setStage({ selectedSurface: slot, finishes: { ...stage.finishes, [slot]: opts[(cur + 1) % opts.length].id } });
  };
  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click}>
      {children}
    </group>
  );
}

export default function Room({ finishes }: { finishes: { floor: string; walls: string; joinery: string } }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const mats = useMemo(() => makeFinishMaterials(), []);
  const view = useMemo(() => skyline(), []);
  const sky = useMemo(() => makeSky(view), [view]);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const warm = useRef<THREE.PointLight>(null);
  const warm2 = useRef<THREE.PointLight>(null);
  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff4de', emissive: '#ffd9a0', emissiveIntensity: 0 }), []);
  const slats = useRef<THREE.InstancedMesh | null>(null);
  const hourNow = useRef(stage.roomHour);

  const floor = mats.floor[finishes.floor] ?? mats.floor.marble;
  const wall = mats.walls[finishes.walls] ?? mats.walls['warm-white'];
  const join = mats.joinery[finishes.joinery] ?? mats.joinery.walnut;

  const fabric = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9d0c2', roughness: 1 }), []);
  const accent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a4552f', roughness: 0.95 }), []);
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.15 }), []);
  const leather = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9b6a48', roughness: 0.6 }), []);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.4, metalness: 0.6 }), []);
  // Plain thin glass: physical transmission only samples opaque objects and would hide the skyline layers.
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#dfe8ec', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.07, depthWrite: false }), []);
  const rug = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f3d4f', roughness: 1 }), []);
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4f6b3c', roughness: 0.9, flatShading: true }), []);

  // Place the slats whenever the instanced mesh (re)mounts; a ref callback survives remounts that an empty-deps
  // effect would miss.
  const placeSlats = useCallback((mesh: THREE.InstancedMesh | null) => {
    slats.current = mesh;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    let i = 0;
    for (let z = -2.7; z <= 1.25; z += 0.13) {
      m.makeTranslation(-W / 2 + 0.06, H / 2 - 0.05, z);
      mesh.setMatrixAt(i++, m);
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  useLayoutEffect(() => {
    // Shadow frustum props don't refresh the projection by themselves.
    sun.current?.shadow.camera.updateProjectionMatrix();
  }, []);

  useFrame((state, dt) => {
    hourNow.current += (stage.roomHour - hourNow.current) * (1 - Math.exp(-3 * Math.min(dt, 0.1)));
    const h = hourNow.current;
    const L = lightAt(h);
    const { azimuth, elevation } = sunPosition(h);
    const rel = ((azimuth - WINDOW_AZ) * Math.PI) / 180;
    const el = (Math.max(elevation, 2) * Math.PI) / 180;
    const facing = Math.max(0, Math.cos(rel)) * Math.min(1, Math.max(0, elevation / 6));
    if (sun.current) {
      sun.current.position.set(Math.sin(rel) * Math.cos(el) * 30, Math.sin(el) * 30, -Math.cos(rel) * Math.cos(el) * 30);
      sun.current.color.setRGB(...L.sun);
      sun.current.intensity = L.sunI * facing * 3.4;
    }
    if (hemi.current) {
      hemi.current.color.setRGB(...L.sky);
      hemi.current.groundColor.setRGB(...L.ground);
      hemi.current.intensity = 0.75 + L.amb * 1.6;
    }
    const night = L.windows;
    if (warm.current) warm.current.intensity = 5 + night * 24;
    if (warm2.current) warm2.current.intensity = 3 + night * 15;
    glowMat.emissiveIntensity = 0.4 + night * 3.2;
    (sky.uniforms.uTop.value as THREE.Color).setRGB(...L.sky);
    (sky.uniforms.uHorizon.value as THREE.Color).setRGB(...L.horizon);
    (sky.uniforms.uGlow.value as THREE.Color).setRGB(...L.sun);
    sky.uniforms.uGlowI.value = facing * 0.6;
    (sky.uniforms.uSilColor.value as THREE.Color).setRGB(...L.ground).multiplyScalar(0.5 - night * 0.3);
    sky.uniforms.uNight.value = night;

    // Drag to look, from a fixed eye in the corner of the room.
    if (!stage.dragging) {
      look.yaw *= Math.exp(-0.8 * Math.min(dt, 0.1));
      look.pitch *= Math.exp(-1.2 * Math.min(dt, 0.1));
    }
    const baseYaw = 0.76 + Math.sin(state.clock.elapsedTime * 0.12) * 0.03;
    const yaw = baseYaw + look.yaw;
    const pitch = -0.06 + look.pitch;
    camera.position.set(3.55, 1.55, 2.85);
    camera.lookAt(3.55 + Math.sin(yaw) * -Math.cos(pitch), 1.55 + Math.sin(pitch), 2.85 - Math.cos(yaw) * Math.cos(pitch));
  });

  return (
    <>
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={1} shadow-camera-far={60} />
      <pointLight ref={warm} position={[2.4, 2.2, -0.9]} color="#ffcf94" distance={9} decay={1.6} castShadow={false} />
      <pointLight ref={warm2} position={[-2, 2.6, -0.4]} color="#ffd6a3" distance={8} decay={1.6} />
      <Environment frames={1} resolution={64} environmentIntensity={0.95}>
        <Lightformer form="rect" intensity={2.4} position={[0, 2, -6]} scale={[10, 4, 1]} color="#fff3e2" />
        <Lightformer form="rect" intensity={0.6} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 8, 1]} color="#ffffff" />
      </Environment>

      {/* View out of the window */}
      <mesh position={[-6, 5.1, -46]} material={sky}>
        <planeGeometry args={[150, 46]} />
      </mesh>

      {/* Shell */}
      <Slot slot="floor">
        <mesh rotation-x={-Math.PI / 2} receiveShadow material={floor}>
          <planeGeometry args={[W, D]} />
        </mesh>
      </Slot>
      <mesh rotation-x={Math.PI / 2} position-y={H}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#f7f5f0" roughness={0.95} />
      </mesh>
      {/* Ceiling cove light strips */}
      <mesh position={[0, H - 0.04, D / 2 - 0.35]} material={glowMat}>
        <boxGeometry args={[W - 0.8, 0.04, 0.12]} />
      </mesh>
      <mesh position={[-W / 2 + 0.35, H - 0.04, 0]} material={glowMat}>
        <boxGeometry args={[0.12, 0.04, D - 0.8]} />
      </mesh>
      <Slot slot="walls">
        <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2} receiveShadow material={wall}>
          <planeGeometry args={[D, H]} />
        </mesh>
        <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow material={wall}>
          <planeGeometry args={[D, H]} />
        </mesh>
        <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI} receiveShadow material={wall}>
          <planeGeometry args={[W, H]} />
        </mesh>
      </Slot>

      {/* Window wall: full-height glass between slim mullions */}
      <group position={[0, 0, -D / 2]}>
        <mesh position={[0, H / 2, 0]} material={glass}>
          <planeGeometry args={[W, H]} />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[-W / 2 + (i * W) / 6, H / 2, 0]} material={metal} castShadow>
            <boxGeometry args={[0.06, H, 0.12]} />
          </mesh>
        ))}
        <mesh position={[0, H - 0.05, 0]} material={metal} castShadow>
          <boxGeometry args={[W, 0.1, 0.14]} />
        </mesh>
        <mesh position={[0, 0.03, 0]} material={metal}>
          <boxGeometry args={[W, 0.06, 0.16]} />
        </mesh>
        {/* Sheer curtains gathered at the sides */}
        <mesh position={[-W / 2 + 0.35, H / 2, 0.25]}>
          <boxGeometry args={[0.55, H - 0.1, 0.08]} />
          <meshStandardMaterial color="#efe9df" roughness={1} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* Joinery feature wall: slats, floating console, TV */}
      <Slot slot="joinery">
        <instancedMesh ref={placeSlats} args={[undefined, undefined, 40]} material={join} castShadow receiveShadow>
          <boxGeometry args={[0.05, H - 0.1, 0.07]} />
        </instancedMesh>
        <mesh position={[-W / 2 + 0.3, 0.42, -0.7]} material={join} castShadow receiveShadow>
          <boxGeometry args={[0.45, 0.36, 3.2]} />
        </mesh>
      </Slot>
      <mesh position={[-W / 2 + 0.14, 1.45, -0.7]} castShadow>
        <boxGeometry args={[0.05, 0.85, 1.5]} />
        <meshStandardMaterial color="#0d0d0f" roughness={0.25} metalness={0.4} />
      </mesh>

      {/* Living set */}
      <mesh rotation-x={-Math.PI / 2} position={[-1.9, 0.006, -0.7]} material={rug} receiveShadow>
        <planeGeometry args={[3.2, 2.5]} />
      </mesh>
      <group position={[-0.65, 0, -0.7]}>
        <RoundedBox args={[0.95, 0.42, 2.6]} radius={0.06} position={[0, 0.25, 0]} material={fabric} castShadow receiveShadow />
        <RoundedBox args={[0.24, 0.5, 2.6]} radius={0.08} position={[0.36, 0.62, 0]} material={fabric} castShadow />
        <RoundedBox args={[0.9, 0.36, 0.22]} radius={0.06} position={[0, 0.55, 1.2]} material={fabric} castShadow />
        <RoundedBox args={[0.9, 0.36, 0.22]} radius={0.06} position={[0, 0.55, -1.2]} material={fabric} castShadow />
        <RoundedBox args={[0.16, 0.42, 0.42]} radius={0.06} position={[0.18, 0.66, 0.6]} rotation-y={-0.3} material={accent} castShadow />
        <RoundedBox args={[0.16, 0.42, 0.42]} radius={0.06} position={[0.18, 0.66, -0.55]} rotation-y={0.2} material={accent} castShadow />
      </group>
      <group position={[-2.05, 0, -0.7]}>
        <mesh position={[0, 0.4, 0]} material={stone} castShadow receiveShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.05, 48]} />
        </mesh>
        <mesh position={[0, 0.19, 0]} material={metal} castShadow>
          <cylinderGeometry args={[0.07, 0.24, 0.36, 24]} />
        </mesh>
      </group>
      <group position={[-2.3, 0, -2.55]} rotation-y={0.5}>
        <RoundedBox args={[0.8, 0.4, 0.8]} radius={0.08} position={[0, 0.24, 0]} material={leather} castShadow />
        <RoundedBox args={[0.8, 0.5, 0.18]} radius={0.08} position={[0, 0.6, 0.32]} material={leather} castShadow />
      </group>

      {/* Dining: marble table, six chairs, three pendants */}
      <group position={[2.35, 0, -0.85]}>
        <RoundedBox args={[1.05, 0.05, 2.2]} radius={0.02} position={[0, 0.76, 0]} material={stone} castShadow receiveShadow />
        <mesh position={[0, 0.37, 0]} material={metal} castShadow>
          <boxGeometry args={[0.12, 0.74, 1.4]} />
        </mesh>
        {[-0.7, 0, 0.7].flatMap((z) => [-1, 1].map((s) => [s, z] as const)).map(([s, z]) => (
          <group key={`${s}${z}`} position={[s * 0.68, 0, z]} rotation-y={s > 0 ? -Math.PI / 2 : Math.PI / 2}>
            <RoundedBox args={[0.46, 0.06, 0.46]} radius={0.02} position={[0, 0.46, 0]} material={leather} castShadow />
            <RoundedBox args={[0.46, 0.42, 0.05]} radius={0.02} position={[0, 0.7, -0.2]} material={leather} castShadow />
            <mesh position={[0, 0.22, 0]} material={metal}>
              <cylinderGeometry args={[0.02, 0.02, 0.44, 8]} />
            </mesh>
          </group>
        ))}
        {[-0.6, 0, 0.6].map((z) => (
          <group key={z} position={[0, 0, z]}>
            <mesh position={[0, H - 0.5, 0]} material={metal}>
              <cylinderGeometry args={[0.004, 0.004, 1, 4]} />
            </mesh>
            <mesh position={[0, H - 1.08, 0]} material={glowMat}>
              <coneGeometry args={[0.13, 0.26, 24, 1, true]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* A potted tree by the glass */}
      <group position={[3.85, 0, -2.75]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.2, 0.5, 24]} />
          <meshStandardMaterial color="#d8d1c4" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.35, 0]} material={leaf} castShadow>
          <icosahedronGeometry args={[0.55, 1]} />
        </mesh>
        <mesh position={[0.2, 1.75, 0.1]} material={leaf} castShadow>
          <icosahedronGeometry args={[0.4, 1]} />
        </mesh>
      </group>
    </>
  );
}
