import * as THREE from 'three';
import { FLOOR_H } from './layout';

/**
 * Procedural materials for the site model. The tower glass is a MeshStandardMaterial patched to draw the curtain
 * wall (mullions, rail, spandrel), interior-mapped rooms with curtains and blinds, and lit rooms after dusk.
 * Solids get weathering and timber grain; neighbourhood blocks get windows and roof finishes. Everything keys off
 * world position and normal, so no texture downloads are needed.
 */
export type Uniform = { value: number };
export type TowerUniforms = {
  uWindows: { value: number };
  uSeed: { value: number };
  uHighlight: { value: number };
  uDim: { value: number };
  uTime: { value: number };
};

export const HIGHLIGHT = new THREE.Color('#e9cf95');

function patchHighlight(shader: THREE.WebGLProgramParametersWithUniforms, u: TowerUniforms) {
  shader.uniforms.uHighlight = u.uHighlight;
  shader.uniforms.uDim = u.uDim;
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
uniform float uHighlight;
uniform float uDim;`,
    )
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))) * 0.5 + 0.22, uDim * 0.7);
totalEmissiveRadiance += vec3(0.91, 0.78, 0.5) * uHighlight * 0.45;`,
    );
}

/** World position and normal varyings that also respect instancing (the stock chunks only do so behind defines). */
const WORLD_VARYINGS_VERTEX = `
vec4 wp4 = vec4(transformed, 1.0);
mat3 wn3 = mat3(modelMatrix);
#ifdef USE_INSTANCING
wp4 = instanceMatrix * wp4;
wn3 = wn3 * mat3(instanceMatrix);
#endif
vWorldP = (modelMatrix * wp4).xyz;
vWorldN = normalize(wn3 * objectNormal);`;

/** Small value-noise kit shared by the facade shaders. */
const NOISE_GLSL = `
float hash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm2(vec2 p) { return vnoise(p) * 0.55 + vnoise(p * 2.13 + 7.1) * 0.3 + vnoise(p * 4.7 + 3.3) * 0.15; }
// Box-filtered coverage of a band occupying [0, frac) of every unit cell (after IQ's filtered grid): crisp up close,
// and it fades to its true average coverage with distance instead of swelling into a grey wash.
float bandCov(float x, float frac, float fw) {
  float n = 1.0 / frac;
  float w = fw + 1e-4;
  float a = x + 0.5 * w;
  float b = x - 0.5 * w;
  return clamp((floor(a) + min(fract(a) * n, 1.0) - floor(b) - min(fract(b) * n, 1.0)) / (n * w), 0.0, 1.0);
}`;

/**
 * Curtain-wall glass that reads as real apartments:
 *  - per-pane reflection wobble (real panes are never perfectly flat) with a Fresnel-weighted sky reflection;
 *  - "interior mapping": each 3.3 m bay is a fake room box (ceiling, floor, side walls, back wall, furniture band)
 *    ray-traced in the fragment shader, so rooms shift with parallax as the camera moves;
 *  - per-room sheer curtains or roller blinds, a balustrade rail and thin mullions;
 *  - after dusk a deterministic scatter of rooms switches their ceiling lights on.
 */
export function makeGlass(u: TowerUniforms) {
  // Dark tinted glass, as in the client's renders: by day it mostly reflects, and rooms only show close up.
  const m = new THREE.MeshStandardMaterial({ color: '#1d272e', roughness: 0.05, metalness: 0.12, envMapIntensity: 1.25 });
  const FH = FLOOR_H.toFixed(2);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWindows = u.uWindows;
    shader.uniforms.uSeed = u.uSeed;
    shader.uniforms.uTime = u.uTime;
    patchHighlight(shader, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${WORLD_VARYINGS_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uWindows;
uniform float uSeed;
uniform float uTime;
varying vec3 vWorldP;
varying vec3 vWorldN;
${NOISE_GLSL}
const float FH = ${FH};
const float PANE = 1.65;
const float ROOM_W = 3.3;
const float ROOM_D = 5.2;

// Ray-traced room behind a window. Returns colour (rgb) and how much ceiling light it gets (a).
vec4 roomColour(vec3 p, vec3 v, float r1, float r2, float r3, out float depth) {
  vec3 tv = vec3(
    v.x > 0.0 ? (ROOM_W - p.x) / v.x : -p.x / min(v.x, -1e-4),
    v.y > 0.0 ? (FH - p.y) / v.y : -p.y / min(v.y, -1e-4),
    ROOM_D / max(-v.z, 1e-3)
  );
  float t = min(tv.x, min(tv.y, tv.z));
  vec3 h = p + v * t;
  depth = clamp(-h.z / ROOM_D, 0.0, 1.0);
  vec3 wall = mix(vec3(0.86, 0.84, 0.79), vec3(0.78, 0.74, 0.67), r1);
  vec3 col;
  float ceilingLight = 0.0;
  if (t == tv.z) {
    // Back wall: a darker furniture band (sofa / cabinets / bed) and a door-height shadow.
    col = wall * 0.92;
    float band = step(h.y, 0.85 + r2 * 0.35) * step(0.6, fract(h.x / ROOM_W * 1.0 + r3));
    vec3 furniture = mix(vec3(0.34, 0.3, 0.27), vec3(0.62, 0.57, 0.5), r2);
    col = mix(col, furniture, band);
    float door = step(abs(h.x - ROOM_W * (0.25 + 0.5 * r3)), 0.45) * step(h.y, 2.15);
    col = mix(col, col * 0.55, door * step(0.5, r1));
  } else if (t == tv.y) {
    if (v.y > 0.0) {
      col = vec3(0.92, 0.91, 0.88);
      // Downlights on a grid.
      vec2 g = fract(vec2(h.x / 1.1, h.z / 1.3)) - 0.5;
      ceilingLight = smoothstep(0.12, 0.0, length(g));
    } else {
      vec3 timber = mix(vec3(0.46, 0.35, 0.26), vec3(0.58, 0.47, 0.36), vnoise(vec2(h.x * 0.6, h.z * 9.0)));
      vec3 tile = mix(vec3(0.74, 0.72, 0.68), vec3(0.66, 0.64, 0.6), step(0.5, fract(h.x / 0.6) ) * 0.5 + step(0.5, fract(h.z / 0.6)) * 0.5);
      col = mix(timber, tile, step(0.55, r2));
    }
  } else {
    col = wall * 0.97;
  }
  return vec4(col, ceilingLight);
}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec3 Nw = normalize(vWorldN);
float isRoof = step(0.5, abs(Nw.y));
vec3 Tw = isRoof > 0.5 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), Nw));
float along = dot(vWorldP, Tw);
float floorIdx = floor(vWorldP.y / FH);
float fy = fract(vWorldP.y / FH);
float roomIdx = floor(along / ROOM_W);
float paneIdx = floor(along / PANE);
float r1 = hash3(vec3(floorIdx, roomIdx, uSeed));
float r2 = hash3(vec3(roomIdx * 1.7, floorIdx * 3.1, uSeed + 9.0));
float r3 = hash3(vec3(roomIdx * 0.3, floorIdx * 7.7, uSeed + 2.0));
float paneR = hash3(vec3(paneIdx, floorIdx, uSeed + 4.0));

// Frames: thin mullions at each pane, a balustrade rail, a dark spandrel at the slab.
float ax = along / PANE;
float ay = vWorldP.y / FH;
float fwx = fwidth(ax);
float fwy = fwidth(ay);
float mullion = bandCov(ax + 0.02, 0.04, fwx);
float rail = bandCov(ay - 0.32, 0.022, fwy);
float spandrel = bandCov(ay, 0.055, fwy);
float frame = clamp(mullion + rail * 0.85 + spandrel, 0.0, 1.0);

// Interior mapping.
vec3 V = normalize(vWorldP - cameraPosition);
vec3 vt = vec3(dot(V, Tw), V.y, dot(V, Nw));
vec3 rp = vec3(fract(along / ROOM_W) * ROOM_W, fy * FH, 0.0);
float roomDepth;
vec4 room = roomColour(rp, vt, r1, r2, r3, roomDepth);
vec3 interior = room.rgb;

// Sheer curtains (drawn across part of the bay) or roller blinds (lowered from the top).
float curtainKind = hash3(vec3(floorIdx * 2.3, roomIdx, uSeed + 11.0));
float tc = 0.18 / max(-vt.z, 1e-3);
float cx = (rp.x + vt.x * tc) / ROOM_W;
float cyy = (rp.y + vt.y * tc) / FH;
if (curtainKind < 0.42) {
  float cover = 0.25 + 0.6 * r3;
  float onLeft = step(0.5, r1);
  float inCurtain = onLeft > 0.5 ? step(cx, cover) : step(1.0 - cover, cx);
  float folds = 0.86 + 0.14 * sin(cx * ROOM_W * 22.0 + r2 * 6.0);
  vec3 sheer = vec3(0.93, 0.91, 0.86) * folds;
  interior = mix(interior, sheer, inCurtain * 0.82 * step(0.0, cyy) * step(cyy, 1.0));
} else if (curtainKind < 0.62) {
  float blindTo = 1.0 - (0.2 + 0.6 * r2);
  float inBlind = step(blindTo, cyy) * step(cyy, 1.0);
  interior = mix(interior, mix(vec3(0.82, 0.78, 0.7), vec3(0.6, 0.58, 0.55), r3), inBlind);
}

// Daylight falls off into the room; the glass itself is a dark tinted pane that mostly reflects.
float daylight = mix(1.0, 0.42, roomDepth);
interior *= daylight;
vec3 glassTint = vec3(0.6, 0.68, 0.72);
vec3 frameCol = mix(vec3(0.74, 0.73, 0.7), vec3(0.3, 0.32, 0.34), spandrel);
diffuseColor.rgb = mix(diffuseColor.rgb * (0.94 + 0.12 * paneR), frameCol, frame);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.5, 0.48), isRoof);
float glassMask = (1.0 - frame) * (1.0 - isRoof);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
// Slight per-pane bow so reflections break up pane by pane, as on a real curtain wall.
vec3 wobble = (Tw * (paneR - 0.5) * 0.05 + vec3(0.0, 1.0, 0.0) * (hash3(vec3(paneIdx, floorIdx, uSeed + 6.0)) - 0.5) * 0.035) * glassMask;
normal = normalize(normal + (viewMatrix * vec4(wobble, 0.0)).xyz);`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
metalnessFactor = mix(0.05, metalnessFactor, glassMask);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = mix(0.55, roughnessFactor, glassMask);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
float cosT = clamp(dot(-V, Nw), 0.0, 1.0);
float fres = 0.06 + 0.94 * pow(1.0 - cosT, 5.0);
// After dusk about half the homes are lit, each differently: warm or neutral, bright or lamp-only, the odd TV glow.
float lit = step(1.0 - uWindows * 0.5, r1);
vec3 warm = mix(vec3(1.0, 0.62, 0.34), vec3(1.0, 0.86, 0.68), r2);
vec3 lightCol = mix(warm, vec3(0.55, 0.7, 1.0), step(0.94, r3));
float lampOnly = step(0.68, r2);
float level = (0.45 + 1.05 * r3) * mix(1.0, 0.4, lampOnly);
vec3 nightRoom = interior * lightCol * (0.4 + 1.5 * room.a + 0.6 * (1.0 - roomDepth)) * lit * level * 1.5;
// Rooms are far dimmer than a sunlit facade; this keeps them a subtle depth cue behind the tint.
vec3 dayRoom = interior * 0.12 * (1.0 - uWindows);
totalEmissiveRadiance += (dayRoom + nightRoom) * glassTint * (1.0 - fres) * glassMask * (1.0 - uDim * 0.6);`,
      );
  };
  m.customProgramCacheKey = () => 'tower-glass-v2';
  return m;
}

/**
 * Slabs, fins, panels and cores: subtle weathering (large-scale tone drift, rain streaks on vertical faces) and,
 * with `grain`, vertical timber-look planks for the warm bronze bands. Also shares the highlight / dim patch.
 */
export function makeSolid(
  color: string,
  u: TowerUniforms,
  opts: THREE.MeshStandardMaterialParameters & {
    grain?: boolean;
    /** World y of a floor: paints yellow/black car-park hazard stripes on the bottom 0.9 m. */
    hazardFrom?: number;
  } = {},
) {
  const { grain = false, hazardFrom, ...params } = opts;
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0, ...params });
  m.onBeforeCompile = (shader) => {
    patchHighlight(shader, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${WORLD_VARYINGS_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec3 sN = normalize(vWorldN);
vec3 sT = abs(sN.y) > 0.5 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), sN));
float sAlong = dot(vWorldP, sT);
float vertical = 1.0 - step(0.5, abs(sN.y));
// Large-scale tone drift.
float drift = fbm2(vec2(sAlong, vWorldP.y + vWorldP.z * 0.37) * 0.35);
diffuseColor.rgb *= 0.95 + 0.09 * drift;
// Rain streaks: long, thin, darker streaks on vertical faces.
float streak = vnoise(vec2(sAlong * 7.0, vWorldP.y * 0.12)) * vnoise(vec2(sAlong * 2.3, vWorldP.y * 0.5));
diffuseColor.rgb *= 1.0 - smoothstep(0.25, 0.7, streak) * 0.1 * vertical;
${
  grain
    ? `// Vertical timber-look planks with fine grain.
float plank = floor(sAlong / 0.16);
float pr = hash2(vec2(plank, 3.0));
float fine = vnoise(vec2(sAlong * 60.0, vWorldP.y * 1.6)) * 0.6 + vnoise(vec2(sAlong * 140.0, vWorldP.y * 3.0)) * 0.4;
float seam = smoothstep(0.0, 0.06, fract(sAlong / 0.16)) * (1.0 - smoothstep(0.94, 1.0, fract(sAlong / 0.16)));
diffuseColor.rgb *= (0.86 + 0.22 * pr) * (0.9 + 0.16 * fine) * mix(0.78, 1.0, seam * vertical + (1.0 - vertical));`
    : ''
}
${
  hazardFrom !== undefined
    ? `float hz = vWorldP.y - (${hazardFrom.toFixed(2)});
float stripe = step(0.5, fract((sAlong + hz) * 2.2));
vec3 hazard = mix(vec3(0.86, 0.66, 0.12), vec3(0.06), stripe);
diffuseColor.rgb = mix(diffuseColor.rgb, hazard, step(hz, 0.9) * vertical);`
    : ''
}`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (drift - 0.5) * 0.18, 0.05, 1.0);`,
      );
  };
  m.customProgramCacheKey = () => (grain ? 'tower-solid-grain' : hazardFrom !== undefined ? `tower-solid-hazard-${hazardFrom}` : 'tower-solid-v2');
  return m;
}

/**
 * Private lift lobby in the basement (instanced unit boxes, one per tower core): stone walls with a pair of
 * brushed-steel lift doors centred on every face, washed by warm downlights. Keeps a soft glow so the chapter's
 * "drive to your lift" beat still reads.
 */
export function makeLiftLobbyMaterial(floorY: number) {
  const m = new THREE.MeshStandardMaterial({ color: '#d9cfbd', roughness: 0.55, emissive: '#e7cf96', emissiveIntensity: 0.35, transparent: true });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vLocal;\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${WORLD_VARYINGS_VERTEX}\nvLocal = position;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vLocal;\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float h = vWorldP.y - (${floorY.toFixed(2)});
float side = 1.0 - step(0.5, abs(normalize(vWorldN).y));
float acrossL = abs(vLocal.x) > 0.499 ? vLocal.z : vLocal.x;
float door = step(abs(acrossL), 0.17) * step(h, 2.35) * side;
float split = step(abs(acrossL), 0.006) * door;
float frameD = (step(abs(acrossL), 0.19) - step(abs(acrossL), 0.17)) * step(h, 2.5) * side;
vec3 steel = vec3(0.6, 0.61, 0.62) * (0.92 + 0.12 * fract(sin(floor(h * 40.0) * 12.9) * 4375.5));
diffuseColor.rgb = mix(diffuseColor.rgb, steel, door);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2), split + frameD * 0.6);
float lobbyWash = smoothstep(4.6, 1.0, h) * side;
float lobbyDoor = door;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
totalEmissiveRadiance *= (0.25 + 0.75 * lobbyWash) * (1.0 - lobbyDoor * 0.7);`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
metalnessFactor = mix(metalnessFactor, 0.85, lobbyDoor);`,
      );
  };
  m.customProgramCacheKey = () => 'lift-lobby';
  return m;
}

/**
 * Neighbourhood buildings: per-building plaster tone and roof finish (terracotta, blue metal, concrete) from an
 * `aBid` attribute in 0–1, window rows per 3.4 m storey, and the same weathering as the towers. `uGlow` lights a
 * share of the windows after dusk; `uQuiet` (0–1) fades the neighbourhood to soft white massing, the classic
 * architectural-model look, where the project should stand alone (the Residences picker).
 */
export function makeContextMaterial(uGlow: Uniform, uQuiet: Uniform) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.88 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uGlow = uGlow;
    shader.uniforms.uQuiet = uQuiet;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float aBid;\nvarying float vBid;\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${WORLD_VARYINGS_VERTEX}\nvBid = aBid;`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform float uGlow;\nuniform float uQuiet;\nvarying float vBid;\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;\n${NOISE_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec3 cN = normalize(vWorldN);
float roof = step(0.5, cN.y);
vec3 cT = roof > 0.5 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), cN));
float cAlong = dot(vWorldP, cT);
float b1 = fract(vBid * 7.13);
float b2 = fract(vBid * 3.71 + 0.3);
vec3 plaster = b1 < 0.3 ? vec3(0.9, 0.87, 0.81) : b1 < 0.55 ? vec3(0.84, 0.82, 0.76) : b1 < 0.8 ? vec3(0.91, 0.86, 0.72) : vec3(0.8, 0.83, 0.82);
vec3 roofCol = b2 < 0.38 ? vec3(0.56, 0.29, 0.2) : b2 < 0.62 ? vec3(0.33, 0.42, 0.5) : b2 < 0.85 ? vec3(0.62, 0.61, 0.58) : vec3(0.42, 0.42, 0.41);
// Windows: one row per storey, 1.3 m wide every 2.4 m, box-filtered so they settle to a tone with distance.
float lv = vWorldP.y / 3.4;
float wx = cAlong / 2.4;
float winX = bandCov(wx + 0.27, 0.54, fwidth(wx));
float winY = bandCov(lv - 0.3, 0.45, fwidth(lv));
float win = winX * winY * (1.0 - roof) * step(0.6, vWorldP.y);
vec3 glass = vec3(0.17, 0.19, 0.21) + 0.05 * hash2(floor(vec2(wx, lv)) + vBid * 13.0);
vec3 wall = plaster * (0.93 + 0.1 * fbm2(vec2(cAlong, vWorldP.y) * 0.4));
float streak = vnoise(vec2(cAlong * 5.0, vWorldP.y * 0.15)) * vnoise(vec2(cAlong * 1.7, vWorldP.y * 0.6));
wall *= 1.0 - smoothstep(0.25, 0.7, streak) * 0.12;
vec3 roofTone = roofCol * (0.9 + 0.18 * fbm2(vWorldP.xz * 0.25));
diffuseColor.rgb = roof > 0.5 ? roofTone : mix(wall, glass, win);
// Quiet mode: pale massing, windows reduced to a faint ghost.
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.89, 0.86) * (roof > 0.5 ? 1.0 : 0.95 - 0.05 * win), uQuiet * 0.9);
float cWin = win * (1.0 - uQuiet);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.2, cWin);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
float cLit = step(0.6, hash2(floor(vec2(wx, lv)) + vBid * 31.0));
totalEmissiveRadiance += vec3(1.0, 0.76, 0.48) * cWin * cLit * uGlow * 0.9;`,
      );
  };
  m.customProgramCacheKey = () => 'context-blocks';
  return m;
}

/** Ground beyond the drawing: grass patches and bare earth instead of one flat tint. */
export function makeGroundMaterial(color: string) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${WORLD_VARYINGS_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float gA = fbm2(vWorldP.xz * 0.018);
float gB = fbm2(vWorldP.xz * 0.11 + 4.0);
vec3 lush = vec3(0.52, 0.6, 0.38);
vec3 dry = vec3(0.68, 0.66, 0.52);
vec3 earth = vec3(0.6, 0.53, 0.43);
vec3 g = mix(lush, dry, smoothstep(0.35, 0.7, gA));
g = mix(g, earth, smoothstep(0.62, 0.8, gB) * 0.45);
diffuseColor.rgb = mix(diffuseColor.rgb, g * (0.92 + 0.12 * vnoise(vWorldP.xz * 0.9)), 0.8);`,
      );
  };
  m.customProgramCacheKey = () => 'ground-patches';
  return m;
}

/** Asphalt with fine aggregate noise and faint wear along the wheel paths. */
export function makeRoadMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: '#6c6b67', roughness: 0.92 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${WORLD_VARYINGS_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
diffuseColor.rgb *= 0.88 + 0.2 * fbm2(vWorldP.xz * 0.08) + 0.06 * vnoise(vWorldP.xz * 6.0);`,
      );
  };
  m.customProgramCacheKey = () => 'road-asphalt';
  return m;
}

/**
 * Car paint for the basement fleet (instanced; paint colour comes from the instance colour). Object-space position
 * picks out the glasshouse band, the B-pillar, tail and head lights; `aPart` = 1 marks the wheels.
 */
export function makeCarMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.28, metalness: 0.35, transparent: true });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float aPart;\nvarying float vPart;\nvarying vec3 vLocal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvPart = aPart;\nvLocal = position;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying float vPart;\nvarying vec3 vLocal;`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float glassBand = step(0.93, vLocal.y) * step(vLocal.y, 1.36) * step(0.5, vLocal.x + 2.2) * step(vLocal.x, 1.22);
float pillar = step(abs(vLocal.x + 0.1), 0.07);
float isGlass = glassBand * (1.0 - pillar) * (1.0 - vPart);
float tail = step(vLocal.x, -2.12) * step(0.6, vLocal.y) * step(vLocal.y, 0.78) * step(0.42, abs(vLocal.z));
float head = step(2.1, vLocal.x) * step(0.6, vLocal.y) * step(vLocal.y, 0.76) * step(0.4, abs(vLocal.z));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.08, 0.09), isGlass);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.06, 0.05), tail * (1.0 - vPart));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.86, 0.84), head * (1.0 - vPart));
// Tyres with a brushed alloy hub on the outer face.
float hubX = vLocal.x < 0.0 ? -1.4 : 1.35;
float hubR = length(vec2(vLocal.x - hubX, vLocal.y - 0.33));
float hub = step(hubR, 0.17) * step(0.86, abs(vLocal.z));
float spokes = step(0.5, fract(atan(vLocal.y - 0.33, vLocal.x - hubX) * 0.796)) * step(0.05, hubR);
diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.035), vec3(0.42, 0.43, 0.45) * mix(1.0, 0.55, spokes), hub), vPart);
float carGlass = isGlass;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = mix(mix(roughnessFactor, 0.06, carGlass), 0.85, vPart);`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
metalnessFactor = mix(metalnessFactor, 0.0, max(carGlass, vPart));`,
      );
  };
  m.customProgramCacheKey = () => 'car-paint';
  return m;
}

/** Basement floor: sealed concrete with a soft sheen, tyre marks, and painted bay lines matching the car rows. */
export function makeBasementFloorMaterial(siteAngle: number) {
  const m = new THREE.MeshStandardMaterial({ color: '#8f918c', roughness: 0.42, transparent: true });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${WORLD_VARYINGS_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\nvarying vec3 vWorldN;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float ca = cos(${siteAngle.toFixed(4)});
float sa = sin(${siteAngle.toFixed(4)});
float bu = vWorldP.x * ca - vWorldP.z * sa;
float bv = vWorldP.x * sa + vWorldP.z * ca;
float row = floor((bv + 40.0) / 7.2 + 0.5);
float rowC = -40.0 + row * 7.2 + (mod(row, 2.0) > 0.5 ? 2.6 : -2.6);
float inStall = step(abs(bv - rowC), 2.45);
float lineU = bandCov((bu + 66.0) / 2.7 + 0.5 + 0.012, 0.024, fwidth(bu / 2.7));
float lineEnd = bandCov((bv - rowC) / 4.9 + 0.5 + 0.006, 0.012, fwidth(bv / 4.9)) * step(abs(bv - rowC), 2.6);
float paint = max(lineU * inStall, lineEnd);
float top = step(0.5, vWorldN.y);
vec3 conc = diffuseColor.rgb * (0.9 + 0.16 * fbm2(vWorldP.xz * 0.3)) * (0.96 + 0.06 * vnoise(vWorldP.xz * 4.0));
float tyre = smoothstep(0.55, 0.8, vnoise(vec2(bu * 0.08, bv * 1.6))) * (1.0 - inStall) * 0.12;
conc *= 1.0 - tyre;
diffuseColor.rgb = mix(conc, vec3(0.93, 0.92, 0.86), paint * top);`,
      );
  };
  m.customProgramCacheKey = () => 'basement-floor';
  return m;
}

export function towerUniforms(seed: number): TowerUniforms {
  return { uWindows: { value: 0 }, uSeed: { value: seed }, uHighlight: { value: 0 }, uDim: { value: 0 }, uTime: { value: 0 } };
}

export const PALETTE = {
  slab: '#f2efe9',
  fin: '#e4dfd6',
  panel: '#8a6a4f',
  core: '#d8d3ca',
  crown: '#f7f5f0',
  roofGreen: '#5f7a4d',
};
