'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/** A gradient sky with a soft sun glow. Uniforms are driven by the lighting director. */
export function makeSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color('#6f9fd1') },
      uHorizon: { value: new THREE.Color('#e6ebee') },
      uGround: { value: new THREE.Color('#99958a') },
      uSun: { value: new THREE.Color('#ffffff') },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunI: { value: 1 },
      // Cloud threshold: higher values clear the sky (the home page's tower anatomy uses a clearer sky).
      uCover: { value: 0.5 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uHorizon, uGround, uSun, uSunDir;
      uniform float uSunI;
      uniform float uCover;
      varying vec3 vDir;
      float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float a = 0.5, s = 0.0;
        for (int i = 0; i < 5; i++) { s += vn(p) * a; p = p * 2.03 + 11.7; a *= 0.5; }
        return s;
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = h > 0.0 ? mix(uHorizon, uTop, pow(smoothstep(0.0, 0.62, h), 0.7)) : mix(uHorizon, uGround, smoothstep(0.0, -0.12, h));
        float s = max(dot(d, normalize(uSunDir)), 0.0);
        // Tropical cumulus: flattened onto a cloud deck so they thin out towards the horizon. They are what the
        // tower glass reflects, which is most of what makes a curtain wall read as real.
        if (h > 0.0) {
          vec2 cuv = d.xz / (h + 0.18) * 1.35;
          float c = fbm(cuv + 3.0);
          float cover = smoothstep(uCover, uCover + 0.28, c) * smoothstep(0.0, 0.2, h);
          float shade = smoothstep(0.45, 0.9, fbm(cuv * 1.9 + 8.0));
          vec3 lum = (uHorizon * 0.65 + uTop * 0.25) + uSun * 0.35 * clamp(uSunI, 0.0, 1.0);
          vec3 cloud = mix(lum * 1.08, lum * 0.78, shade) + uSun * pow(s, 8.0) * 0.35 * clamp(uSunI, 0.0, 1.0);
          col = mix(col, cloud, cover * 0.92);
        }
        col += uSun * (pow(s, 900.0) * 6.0 + pow(s, 24.0) * 0.28 + pow(s, 4.0) * 0.12) * clamp(uSunI, 0.0, 1.2);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function SkyDome({ material, radius = 1400 }: { material: THREE.ShaderMaterial; radius?: number }) {
  const geo = useMemo(() => new THREE.SphereGeometry(radius, 48, 24), [radius]);
  return <mesh geometry={geo} material={material} renderOrder={-1} frustumCulled={false} />;
}
