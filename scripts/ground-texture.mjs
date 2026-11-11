// Makes the 3D podium's ground texture from the client's site-plan render: the numbered markers, letter rings,
// and the road lettering are painted out (each filled from the colours just around it), because the
// 3D scene draws its own live markers on top.
//   public/media/textures/ground.webp
// Usage: node scripts/ground-texture.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { amenities } from '../src/content/amenities.ts';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'public/media/plans/site-layout.webp');
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const px = (x, y) => (Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 3;

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

// Deterministic per-pixel grain so filled discs don't look flat.
const noise = (x, y) => (Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) * 6;

function fillDisc(cx, cy, r) {
  // Diffusion inpaint: seed the disc with the median of its surroundings, then relax every pixel towards the
  // average of its neighbours so gradients from the edge flow inwards; finish with a little grain.
  const ring = [[], [], []];
  for (let a = 0; a < 64; a++) {
    for (const rr of [r + 4, r + 8]) {
      const i = px(Math.round(cx + Math.cos((a / 64) * Math.PI * 2) * rr), Math.round(cy + Math.sin((a / 64) * Math.PI * 2) * rr));
      for (let k = 0; k < 3; k++) ring[k].push(data[i + k]);
    }
  }
  const seed = ring.map(median);
  const inside = [];
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++) if (Math.hypot(x - cx, y - cy) <= r) inside.push([x, y]);
  for (const [x, y] of inside) for (let k = 0; k < 3; k++) data[px(x, y) + k] = seed[k];
  for (let it = 0; it < 90; it++) {
    for (const [x, y] of inside) {
      const i = px(x, y);
      for (let k = 0; k < 3; k++)
        data[i + k] = (data[px(x + 1, y) + k] + data[px(x - 1, y) + k] + data[px(x, y + 1) + k] + data[px(x, y - 1) + k] + 2) >> 2; // +2 rounds; a plain floor darkens over many passes
    }
  }
  for (const [x, y] of inside) {
    const i = px(x, y);
    const n = noise(x, y) - 3;
    for (let k = 0; k < 3; k++) data[i + k] = Math.max(0, Math.min(255, data[i + k] + n));
  }
}

// Replace bright lettering inside a box with the median of the darker (asphalt) pixels around it.
function eraseText(x0, y0, x1, y1, bright = 175) {
  const bg = [[], [], []];
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = px(x, y);
      if (data[i] < bright - 25) for (let k = 0; k < 3; k++) bg[k].push(data[i + k]);
    }
  const c = bg.map(median);
  for (let y = y0 - 2; y <= y1 + 2; y++)
    for (let x = x0 - 2; x <= x1 + 2; x++) {
      const i = px(x, y);
      if (data[i] > bright - 40) for (let k = 0; k < 3; k++) data[i + k] = c[k] + noise(x, y);
    }
}

for (const a of amenities) for (const [fx, fy] of a.at) fillDisc(Math.round(fx * W), Math.round(fy * H), 32);

const box = (fx0, fy0, fx1, fy1, bright) =>
  eraseText(Math.round(fx0 * W), Math.round(fy0 * H), Math.round(fx1 * W), Math.round(fy1 * H), bright);
box(0.012, 0.27, 0.05, 0.69, 170); // "JALAN HAJI BASIR"

await fs.mkdir(path.join(root, 'public/media/textures'), { recursive: true });
const out = path.join(root, 'public/media/textures/ground.webp');
await sharp(data, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 90 }).toFile(out);
console.log(`wrote ${path.relative(root, out)} ${W}×${H}`);
