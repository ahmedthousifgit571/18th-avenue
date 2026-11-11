'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONTEXT, PLAN_H, PLAN_W, SHOP_HEIGHT, SITE_ANGLE, STRUCTURES, TREES, seeded, type XZ } from './layout';
import { extrudeUp } from './Towers';

export type LandscapeUniforms = { uTime: { value: number }; uGlow: { value: number } };

function flatShape(poly: XZ[]) {
  const s = new THREE.Shape();
  poly.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  s.closePath();
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(-Math.PI / 2);
  return g;
}

function makeWater(u: LandscapeUniforms, color = '#3f9fb3') {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.86, envMapIntensity: 1.6 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = u.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWp;')
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
vec2 wp = vWp.xz;
float r1 = sin(wp.x * 1.3 + uTime * 1.1) * cos(wp.y * 1.7 - uTime * 0.9);
float r2 = sin(wp.x * 3.1 - wp.y * 2.3 + uTime * 1.7);
vec3 ripple = normalize(vec3(r1 * 0.08 + r2 * 0.04, 1.0, r2 * 0.06 - r1 * 0.05));
normal = normalize((viewMatrix * vec4(ripple, 0.0)).xyz);`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float caustic = pow(abs(sin(vWp.x * 2.1 + uTime) * sin(vWp.z * 2.4 - uTime * 0.8)), 6.0);
diffuseColor.rgb += caustic * 0.12;`,
      );
  };
  return m;
}

function makeLitGlass(u: LandscapeUniforms) {
  // Clubhouse / pod / shop glazing: reflective by day, warm interiors after dusk.
  const m = new THREE.MeshStandardMaterial({ color: '#4b5d68', roughness: 0.1, metalness: 0.3, envMapIntensity: 1.2 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uGlow = u.uGlow;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.74, 0.46) * uGlow * 1.1;');
  };
  return m;
}

function courtTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#5f8a5a';
  g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#3d6fa3';
  g.fillRect(40, 56, 176, 400);
  g.strokeStyle = '#f4f1ea';
  g.lineWidth = 3;
  g.strokeRect(40, 56, 176, 400);
  g.strokeRect(62, 56, 132, 400);
  g.beginPath();
  g.moveTo(62, 162);
  g.lineTo(194, 162);
  g.moveTo(62, 350);
  g.lineTo(194, 350);
  g.moveTo(128, 162);
  g.lineTo(128, 350);
  g.stroke();
  g.lineWidth = 2;
  g.strokeStyle = '#1d1d1d';
  g.beginPath();
  g.moveTo(30, 256);
  g.lineTo(226, 256);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function boxAt(centre: XZ, size: [number, number], h: number, y = 0) {
  const g = new THREE.BoxGeometry(size[0], h, size[1]);
  g.rotateY(SITE_ANGLE);
  g.translate(centre[0], y + h / 2, centre[1]);
  return g;
}

function pointInPoly([x, z]: XZ, poly: XZ[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/* ------------------------------------------------------------------------------------------------------------------
 * Trees. Canopies are clouds of alpha-tested leaf cards (not solid blobs): each card carries a painted leaf cluster
 * and a soft "spherical" normal, so a crown shades like foliage, lets light through at its edges and casts dappled
 * shadows. Palms (the pool garden in the client's renders) get drooping fronds.
 * ---------------------------------------------------------------------------------------------------------------- */

function leafTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const rand = seeded(77);
  // Dense core so the cluster survives mip-mapping at distance; ragged leafy rim for close-ups.
  for (let i = 0; i < 420; i++) {
    const r = Math.pow(rand(), 0.75) * 112;
    const a = rand() * Math.PI * 2;
    const x = 128 + Math.cos(a) * r;
    const y = 128 + Math.sin(a) * r;
    const len = 13 + rand() * 15;
    const top = 1 - y / 256;
    const hue = 82 + rand() * 26;
    const light = 20 + rand() * 16 + top * 14;
    g.save();
    g.translate(x, y);
    g.rotate(a + (rand() - 0.5) * 1.6);
    g.fillStyle = `hsl(${hue} ${38 + rand() * 18}% ${light}%)`;
    g.beginPath();
    g.ellipse(0, 0, len, len * 0.38, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `hsl(${hue + 4} 40% ${light + 9}% / 0.55)`;
    g.beginPath();
    g.ellipse(len * 0.15, -len * 0.08, len * 0.55, len * 0.16, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function frondTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 512;
  const g = c.getContext('2d')!;
  const rand = seeded(91);
  g.lineCap = 'round';
  // Leaflets angled off a central rachis, shortening towards the tip (v = 0 base, v = 1 tip → canvas top).
  for (let y = 500; y > 12; y -= 7) {
    const t = 1 - y / 512;
    const len = 58 * (1 - t * 0.75) + rand() * 6;
    const light = 24 + rand() * 12 + t * 6;
    g.strokeStyle = `hsl(${88 + rand() * 18} 42% ${light}%)`;
    g.lineWidth = 4.5 - t * 2;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(64, y);
      g.quadraticCurveTo(64 + side * len * 0.5, y - 10, 64 + side * len, y - 22 - rand() * 6);
      g.stroke();
    }
  }
  g.strokeStyle = 'hsl(70 30% 34%)';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(64, 512);
  g.lineTo(64, 8);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

type GeoArrays = { pos: number[]; nor: number[]; uv: number[]; col: number[] };

function pushQuad(o: GeoArrays, corners: THREE.Vector3[], uvs: [number, number][], n: THREE.Vector3, shade: number) {
  for (const k of [0, 1, 2, 0, 2, 3]) {
    o.pos.push(corners[k].x, corners[k].y, corners[k].z);
    o.nor.push(n.x, n.y, n.z);
    o.uv.push(uvs[k][0], uvs[k][1]);
    o.col.push(shade, shade, shade);
  }
}

function toGeometry(o: GeoArrays) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(o.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(o.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(o.uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(o.col, 3));
  g.computeBoundingSphere();
  return g;
}

/** A broadleaf crown: ~54 leaf cards in a flattened ellipsoid (rain-tree / angsana silhouette), unit radius. */
function canopyCards() {
  const rand = seeded(13);
  const o: GeoArrays = { pos: [], nor: [], uv: [], col: [] };
  const tmp = new THREE.Vector3();
  for (let i = 0; i < 54; i++) {
    const dir = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
    if (dir.lengthSq() < 0.05) dir.set(0, 1, 0);
    dir.normalize();
    const r = 0.45 + 0.55 * Math.sqrt(rand());
    const centre = new THREE.Vector3(dir.x * r, dir.y * r * 0.62, dir.z * r);
    const size = 0.62 + rand() * 0.38;
    const facing = dir.clone().add(tmp.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(1.2)).normalize();
    const t = new THREE.Vector3().crossVectors(facing, Math.abs(facing.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
    const b = new THREE.Vector3().crossVectors(facing, t).normalize();
    const spin = rand() * Math.PI * 2;
    const tu = t.clone().multiplyScalar(Math.cos(spin)).addScaledVector(b, Math.sin(spin)).multiplyScalar(size / 2);
    const tv = b.clone().multiplyScalar(Math.cos(spin)).addScaledVector(t, -Math.sin(spin)).multiplyScalar(size / 2);
    const corners = [
      centre.clone().sub(tu).sub(tv),
      centre.clone().add(tu).sub(tv),
      centre.clone().add(tu).add(tv),
      centre.clone().sub(tu).add(tv),
    ];
    // Spherical normal biased upwards: the crown shades as one soft volume.
    const n = new THREE.Vector3(centre.x, centre.y * 1.5 + 0.35, centre.z).normalize();
    // Cheap ambient occlusion: inner and lower cards are darker.
    const shade = 0.5 + 0.5 * Math.min(1, r * (0.75 + 0.25 * (dir.y * 0.5 + 0.5)));
    pushQuad(o, corners, [[0, 0], [1, 0], [1, 1], [0, 1]], n, shade);
  }
  return toGeometry(o);
}

/** A palm crown: 13 arching fronds, each a folded ribbon of 7 segments, unit length; origin at the crown. */
function palmCrown() {
  const rand = seeded(29);
  const o: GeoArrays = { pos: [], nor: [], uv: [], col: [] };
  const N = 13;
  const SEG = 7;
  for (let f = 0; f < N; f++) {
    const yaw = (f / N) * Math.PI * 2 + rand() * 0.3;
    const lift = 0.55 - rand() * 0.5 - (f % 3 === 0 ? 0.35 : 0);
    const out = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
    const side = new THREE.Vector3(-out.z, 0, out.x);
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= SEG; s++) {
      const t = s / SEG;
      // Rise then droop along an arc.
      pts.push(out.clone().multiplyScalar(t).add(new THREE.Vector3(0, lift * t - 0.75 * t * t, 0)));
    }
    for (let s = 0; s < SEG; s++) {
      const w0 = 0.2 * Math.sin(Math.PI * Math.min(1, (s / SEG) * 1.15 + 0.12));
      const w1 = 0.2 * Math.sin(Math.PI * Math.min(1, ((s + 1) / SEG) * 1.15 + 0.12));
      const a = pts[s];
      const b = pts[s + 1];
      const fold = 0.06;
      const shade = 0.75 + 0.25 * (s / SEG);
      const n = new THREE.Vector3(0, 1, 0).addScaledVector(out, 0.25).normalize();
      for (const sd of [-1, 1]) {
        const ea = a.clone().addScaledVector(side, sd * w0).add(new THREE.Vector3(0, -fold, 0));
        const eb = b.clone().addScaledVector(side, sd * w1).add(new THREE.Vector3(0, -fold, 0));
        const u0 = sd < 0 ? 0 : 1;
        pushQuad(
          o,
          sd < 0 ? [ea, a.clone(), b.clone(), eb] : [a.clone(), ea, eb, b.clone()],
          sd < 0 ? [[u0, s / SEG], [0.5, s / SEG], [0.5, (s + 1) / SEG], [u0, (s + 1) / SEG]] : [[0.5, s / SEG], [u0, s / SEG], [u0, (s + 1) / SEG], [0.5, (s + 1) / SEG]],
          n,
          shade,
        );
      }
    }
  }
  return toGeometry(o);
}

/** Foliage material: alpha-tested, double-sided, and with the back-face normal flip removed so cards keep their soft shading. */
function foliageMaterial(map: THREE.Texture, translucency = 0.12) {
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.42, side: THREE.DoubleSide, vertexColors: true, roughness: 0.82 });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <normal_fragment_begin>',
        `float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
vec3 normal = normalize( vNormal );
vec3 nonPerturbedNormal = normal;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
totalEmissiveRadiance += diffuseColor.rgb * vec3(0.9, 1.0, 0.55) * ${translucency.toFixed(3)};`,
      );
  };
  m.customProgramCacheKey = () => `foliage-${translucency}`;
  return m;
}

type TreeItem = { p: XZ; s: number; c: THREE.Color; palm: boolean; yaw: number; lean: number };

function Trees() {
  const assets = useMemo(() => {
    const leaves = leafTexture();
    const fronds = frondTexture();
    return {
      canopyGeo: canopyCards(),
      crownGeo: palmCrown(),
      canopyMat: foliageMaterial(leaves),
      crownMat: foliageMaterial(fronds, 0.16),
      bark: new THREE.MeshStandardMaterial({ color: '#5e5145', roughness: 1 }),
      palmBark: new THREE.MeshStandardMaterial({ color: '#8b8072', roughness: 0.95 }),
      trunkGeo: new THREE.CylinderGeometry(0.55, 1, 1, 7, 1).translate(0, 0.5, 0),
      palmTrunkGeo: new THREE.CylinderGeometry(0.75, 1, 1, 8, 4).translate(0, 0.5, 0),
    };
  }, []);
  const canopy = useRef<THREE.InstancedMesh>(null);
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  const palmTrunk = useRef<THREE.InstancedMesh>(null);

  const items = useMemo(() => {
    const rand = seeded(5);
    const list: TreeItem[] = [];
    // Gentle hue and value drift between trees; the leaf texture carries the actual greens.
    const tint = () => new THREE.Color().setHSL(0.22 + (rand() - 0.5) * 0.06, 0.25 + rand() * 0.2, 0.62 + rand() * 0.16);
    // Inside the site: many palms around the pool garden, as in the client's renders.
    for (const p of TREES) list.push({ p, s: 0.85 + rand() * 0.5, c: tint(), palm: rand() < 0.45, yaw: rand() * Math.PI * 2, lean: (rand() - 0.5) * 0.16 });
    // Neighbourhood trees outside the drawing, kept off buildings and roads.
    let tries = 0;
    while (list.length < TREES.length + 260 && tries < 6000) {
      tries++;
      const a = rand() * Math.PI * 2;
      const r = 70 + Math.sqrt(rand()) * 330;
      const p: XZ = [Math.cos(a) * r, Math.sin(a) * r];
      if (Math.abs(p[0]) < PLAN_W / 2 + 2 && Math.abs(p[1]) < PLAN_H / 2 + 2) continue;
      if (CONTEXT.buildings.some((b) => pointInPoly(p, b.poly))) continue;
      if (CONTEXT.roads.some((rd) => rd.line.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < rd.width + 2))) continue;
      list.push({ p, s: 0.8 + rand() * 0.8, c: tint(), palm: rand() < 0.1, yaw: rand() * Math.PI * 2, lean: (rand() - 0.5) * 0.2 });
    }
    return { broad: list.filter((t) => !t.palm), palms: list.filter((t) => t.palm) };
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    items.broad.forEach((t, i) => {
      q.setFromEuler(e.set(0, t.yaw, 0));
      const h = 3.6 * t.s;
      m.compose(new THREE.Vector3(t.p[0], h + 1.5 * t.s, t.p[1]), q, new THREE.Vector3(3.1 * t.s, 3.1 * t.s, 3.1 * t.s));
      canopy.current!.setMatrixAt(i, m);
      canopy.current!.setColorAt(i, t.c);
      m.compose(new THREE.Vector3(t.p[0], 0, t.p[1]), q, new THREE.Vector3(0.2 * t.s, h + 0.8 * t.s, 0.2 * t.s));
      trunk.current!.setMatrixAt(i, m);
    });
    items.palms.forEach((t, i) => {
      const h = 7.5 * t.s;
      q.setFromEuler(e.set(t.lean, t.yaw, t.lean * 0.6));
      m.compose(new THREE.Vector3(t.p[0], 0, t.p[1]), q, new THREE.Vector3(0.17, h, 0.17));
      palmTrunk.current!.setMatrixAt(i, m);
      // Crown sits at the (leaning) trunk top.
      const top = new THREE.Vector3(0, h, 0).applyQuaternion(q).add(new THREE.Vector3(t.p[0], 0, t.p[1]));
      m.compose(top, new THREE.Quaternion().setFromEuler(e.set(0, t.yaw * 1.7, 0)), new THREE.Vector3(3.2 * t.s, 3.2 * t.s, 3.2 * t.s));
      crown.current!.setMatrixAt(i, m);
      crown.current!.setColorAt(i, t.c);
    });
    for (const r of [canopy, trunk, crown, palmTrunk]) {
      if (!r.current) continue;
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
  }, [items]);

  return (
    <group>
      <instancedMesh ref={canopy} args={[assets.canopyGeo, assets.canopyMat, items.broad.length]} castShadow receiveShadow />
      <instancedMesh ref={trunk} args={[assets.trunkGeo, assets.bark, items.broad.length]} castShadow />
      <instancedMesh ref={crown} args={[assets.crownGeo, assets.crownMat, items.palms.length]} castShadow receiveShadow />
      <instancedMesh ref={palmTrunk} args={[assets.palmTrunkGeo, assets.palmBark, items.palms.length]} castShadow />
    </group>
  );
}

export default function Landscape({ uniforms }: { uniforms: LandscapeUniforms }) {
  const parts = useMemo(() => {
    const S = STRUCTURES;
    const water = makeWater(uniforms);
    const glass = makeLitGlass(uniforms);
    const court = courtTexture();
    return {
      water,
      glass,
      courtMat: new THREE.MeshStandardMaterial({ map: court, roughness: 0.85 }),
      lagoon: flatShape(S.lagoon).translate(0, 0.09, 0),
      splash: flatShape(S.splash).translate(0, 0.09, 0),
      clubGlass: S.clubhouse.map((p) => extrudeUp(p, 7.6, 0.97)),
      clubRoof: S.clubhouse.map((p) => extrudeUp(p, 0.55, 1.02).translate(0, 7.6, 0)),
      clubMid: S.clubhouse.map((p) => extrudeUp(p, 0.35, 1.0).translate(0, 3.8, 0)),
      podGlass: S.pods.map((p) => extrudeUp(p, 3.4, 0.94).translate(0, 0.1, 0)),
      podRoof: S.pods.map((p) => extrudeUp(p, 0.32, 1.0).translate(0, 3.5, 0)),
      shops: extrudeUp(S.shops, SHOP_HEIGHT - 0.6, 0.985),
      shopsRoof: extrudeUp(S.shops, 0.6, 1.0).translate(0, SHOP_HEIGHT - 0.6, 0),
      court: flatShape(S.tennis).translate(0, SHOP_HEIGHT + 0.03, 0),
      small: [
        boxAt(S.guardHouse.centre, S.guardHouse.size, 3.2),
        boxAt(S.toilets.centre, S.toilets.size, 3.3),
        extrudeUp(S.substation, 4.2),
        extrudeUp(S.refuse, 3.2),
      ],
      pavilions: [boxAt(S.bbq.centre, S.bbq.size, 0.3, 3.2), boxAt(S.rest.centre, S.rest.size, 0.3, 3.2)],
      fountain: S.fountain,
    };
  }, [uniforms]);

  // Court UVs: map the polygon's bounding box to 0–1 so the canvas lines land on the court.
  useLayoutEffect(() => {
    const g = parts.court;
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    const pos = g.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    // Rotate into the court's own frame first so the lines run along it.
    const c = Math.cos(-SITE_ANGLE);
    const s = Math.sin(-SITE_ANGLE);
    const cx = (bb.min.x + bb.max.x) / 2;
    const cz = (bb.min.z + bb.max.z) / 2;
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    const local: [number, number][] = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) - cx;
      const z = pos.getZ(i) - cz;
      const u = x * c - z * s;
      const v = x * s + z * c;
      local.push([u, v]);
      minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v);
    }
    local.forEach(([u, v], i) => {
      uv[i * 2] = (u - minU) / (maxU - minU);
      uv[i * 2 + 1] = 1 - (v - minV) / (maxV - minV);
    });
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }, [parts.court]);

  const jet = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (jet.current) jet.current.scale.y = 1 + Math.sin(clock.elapsedTime * 3) * 0.12;
  });

  return (
    <group>
      <mesh geometry={parts.lagoon} material={parts.water} receiveShadow />
      <mesh geometry={parts.splash} material={parts.water} receiveShadow />
      <group position={[parts.fountain.centre[0], 0, parts.fountain.centre[1]]}>
        <mesh position-y={0.25} receiveShadow>
          <cylinderGeometry args={[parts.fountain.radius + 0.5, parts.fountain.radius + 0.6, 0.5, 40]} />
          <meshStandardMaterial color="#e7e2d8" roughness={0.6} />
        </mesh>
        <mesh position-y={0.52} rotation-x={-Math.PI / 2} material={parts.water}>
          <circleGeometry args={[parts.fountain.radius, 40]} />
        </mesh>
        <mesh ref={jet} position-y={1.4}>
          <coneGeometry args={[0.7, 2.2, 16, 1, true]} />
          <meshStandardMaterial color="#d9f0f4" transparent opacity={0.55} roughness={0.1} />
        </mesh>
      </group>

      {parts.clubGlass.map((g, i) => (
        <mesh key={`cg${i}`} geometry={g} material={parts.glass} castShadow receiveShadow />
      ))}
      {parts.clubMid.map((g, i) => (
        <mesh key={`cm${i}`} geometry={g} castShadow>
          <meshStandardMaterial color="#efebe4" roughness={0.6} />
        </mesh>
      ))}
      {parts.clubRoof.map((g, i) => (
        <mesh key={`cr${i}`} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial color="#4b4f57" roughness={0.7} />
        </mesh>
      ))}
      {parts.podGlass.map((g, i) => (
        <mesh key={`pg${i}`} geometry={g} material={parts.glass} castShadow />
      ))}
      {parts.podRoof.map((g, i) => (
        <mesh key={`pr${i}`} geometry={g} castShadow>
          <meshStandardMaterial color="#f4f1ea" roughness={0.45} />
        </mesh>
      ))}

      <mesh geometry={parts.shops} material={parts.glass} castShadow receiveShadow />
      <mesh geometry={parts.shopsRoof} castShadow receiveShadow>
        <meshStandardMaterial color="#e9e4da" roughness={0.7} />
      </mesh>
      <mesh geometry={parts.court} material={parts.courtMat} receiveShadow />

      {parts.small.map((g, i) => (
        <mesh key={`s${i}`} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial color={i === 2 ? '#5a5d63' : '#ece7de'} roughness={0.8} />
        </mesh>
      ))}
      {parts.pavilions.map((g, i) => (
        <mesh key={`pv${i}`} geometry={g} castShadow>
          <meshStandardMaterial color="#7a5f45" roughness={0.6} />
        </mesh>
      ))}
      <Trees />
    </group>
  );
}
