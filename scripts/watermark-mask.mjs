// Builds a pixel-exact mask of the film's "18th AVENUE" watermark for ffmpeg's removelogo filter.
// The watermark is fixed on screen while the camera moves, so across a moving shot its pixels barely change and are
// brighter than their surroundings. Output: assets-src/cinema/watermark-mask.png (1920x1080, white = watermark).
// Usage: node scripts/watermark-mask.mjs [startSeconds] [endSeconds]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'assets-src/film/unityland-final.mp4');
const outDir = path.join(root, 'assets-src/cinema');
await fs.mkdir(outDir, { recursive: true });

const [a = 19.5, b = 34.6] = process.argv.slice(2).map(Number);
// The watermark lives in the top-left corner; only that box is analysed.
const BOX = { x: 0, y: 0, w: 600, h: 210 };
const N = 48;

const frames = [];
for (let i = 0; i < N; i++) {
  const t = a + ((b - a) * i) / (N - 1);
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', t.toFixed(2), '-i', src, '-frames:v', '1', '-vf', `crop=${BOX.w}:${BOX.h}:${BOX.x}:${BOX.y},format=gray`, '-f', 'rawvideo', '-'], {
    maxBuffer: 1 << 26,
  });
  frames.push(raw);
}

const n = BOX.w * BOX.h;
const mean = new Float32Array(n);
const sd = new Float32Array(n);
for (const f of frames) for (let i = 0; i < n; i++) mean[i] += f[i] / N;
for (const f of frames) for (let i = 0; i < n; i++) sd[i] += (f[i] - mean[i]) ** 2 / N;
for (let i = 0; i < n; i++) sd[i] = Math.sqrt(sd[i]);

// Per-frame "local background": the frame blurred. The watermark is a thin bright stroke, so it stands above it.
const blurred = await Promise.all(
  frames.map((f) => sharp(f, { raw: { width: BOX.w, height: BOX.h, channels: 1 } }).blur(6).extractChannel(0).raw().toBuffer()),
);
const lift = new Float32Array(n);
frames.forEach((f, k) => {
  const bl = blurred[k];
  for (let i = 0; i < n; i++) lift[i] += (f[i] - bl[i]) / N; // signed: noise averages out, a fixed bright stroke does not
});

// DEBUG_MAPS: write the analysis maps next to the mask.
if (process.env.DEBUG_MAPS) {
  const toImg = (arr, scale, off = 0) => Buffer.from(Array.from(arr, (v) => Math.max(0, Math.min(255, (v + off) * scale))));
  await sharp(toImg(mean, 1), { raw: { width: BOX.w, height: BOX.h, channels: 1 } }).png().toFile(path.join(outDir, 'dbg-mean.png'));
  await sharp(toImg(sd, 6), { raw: { width: BOX.w, height: BOX.h, channels: 1 } }).png().toFile(path.join(outDir, 'dbg-sd.png'));
  await sharp(toImg(lift, 8, 16), { raw: { width: BOX.w, height: BOX.h, channels: 1 } }).png().toFile(path.join(outDir, 'dbg-lift.png'));
}
let mask = new Uint8Array(n);
// Only inside the two glyph groups ("18th" and "ΛVENUE"): facade slab lines that barely move would pass too.
const KEEP = [
  { x0: 30, y0: 38, x1: 182, y1: 166 },
  { x0: 185, y0: 80, x1: 526, y1: 126 },
];
const inKeep = (x, y) => KEEP.some((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
for (let i = 0; i < n; i++) if (lift[i] > 4 && sd[i] < 26 && inKeep(i % BOX.w, Math.floor(i / BOX.w))) mask[i] = 1;

// Dilate three times (anti-aliased edges and the glyphs' soft glow).
for (let pass = 0; pass < 3; pass++) {
  const next = mask.slice();
  for (let y = 1; y < BOX.h - 1; y++)
    for (let x = 1; x < BOX.w - 1; x++) {
      const k = y * BOX.w + x;
      if (!mask[k] && (mask[k - 1] || mask[k + 1] || mask[k - BOX.w] || mask[k + BOX.w])) next[k] = 1;
    }
  mask = next;
}

const full = Buffer.alloc(1920 * 1080);
let count = 0;
for (let y = 0; y < BOX.h; y++)
  for (let x = 0; x < BOX.w; x++)
    if (mask[y * BOX.w + x]) {
      full[(BOX.y + y) * 1920 + BOX.x + x] = 255;
      count++;
    }
const file = path.join(outDir, 'watermark-mask.png');
await sharp(full, { raw: { width: 1920, height: 1080, channels: 1 } }).png().toFile(file);
await sharp(full, { raw: { width: 1920, height: 1080, channels: 1 } }).extract({ left: 0, top: 0, width: BOX.w, height: BOX.h }).png().toFile(path.join(outDir, 'watermark-mask-preview.png'));
console.log(`mask: ${count} px → ${path.relative(root, file)}`);
