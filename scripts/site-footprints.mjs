// Vectorises the 3D scene's footprints from the client's site plan (public/media/plans/site-layout.webp):
//   - the nine tower wings (the white blocks), assigned to Towers 1–5 by position
//   - tree positions (the dark canopy green)
// Output: src/three/site/footprints.json, in metres. +x east, +z south (plan "up" is north: Jalan Haji Basir, on
// the plan's left edge, runs at a bearing of 3° in OpenStreetMap). Scale: 12.4 px per metre, measured from the
// doubles tennis court (23.77 × 10.97 m) and confirmed by the wing areas matching the published internal areas.
// Usage: node scripts/site-footprints.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import potrace from 'potrace';

const root = path.resolve(import.meta.dirname, '..');
const SRC = path.join(root, 'public/media/plans/site-layout.webp');
export const PX_PER_M = 12.4;

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const toM = ([x, y]) => [Math.round(((x - W / 2) / PX_PER_M) * 100) / 100, Math.round(((y - H / 2) / PX_PER_M) * 100) / 100];

function maskFrom(test) {
  const out = Buffer.alloc(W * H, 255);
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    if (test(r, g, b, i % W, Math.floor(i / W))) out[i] = 0;
  }
  return sharp(out, { raw: { width: W, height: H, channels: 1 } }).median(3).png().toBuffer();
}

function tracePolys(png, turdSize) {
  return new Promise((resolve, reject) => {
    const p = new potrace.Potrace({ turdSize, alphaMax: 0, optCurve: false, threshold: 128, blackOnWhite: true });
    p.loadImage(png, (err) => {
      if (err) return reject(err);
      const d = p.getPathTag('#000').match(/ d="([^"]+)"/)?.[1] ?? '';
      // With alphaMax 0 potrace emits only straight segments: "M x y L x y x y … Z" (one subpath per outline).
      const polys = d
        .split('M')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const nums = s.replace(/[LZ]/g, ' ').trim().split(/[\s,]+/).map(Number);
          const pts = [];
          for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
          return pts;
        });
      resolve(polys);
    });
  });
}

function simplify(points, tol) {
  // Douglas–Peucker on a closed ring (split at the point farthest from the first).
  const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const seg = (p, a, b) => {
    const l = sq(a, b);
    if (!l) return sq(p, a);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l));
    return sq(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
  };
  const dp = (pts) => {
    if (pts.length < 3) return pts;
    let max = 0, idx = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = seg(pts[i], pts[0], pts.at(-1));
      if (d > max) [max, idx] = [d, i];
    }
    if (max <= tol * tol) return [pts[0], pts.at(-1)];
    return [...dp(pts.slice(0, idx + 1)).slice(0, -1), ...dp(pts.slice(idx))];
  };
  let far = 0;
  points.forEach((p, i) => { if (sq(p, points[0]) > sq(points[far], points[0])) far = i; });
  const a = dp(points.slice(0, far + 1));
  const b = dp([...points.slice(far), points[0]]);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

const area = (pts) => Math.abs(pts.reduce((a, p, i) => a + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0) / 2);
const centroid = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

// Tower wings: near-white, neutral pixels (the drawing's building roofs).
const wingPng = await maskFrom((r, g, b) => r > 228 && g > 226 && b > 222 && Math.abs(r - b) < 14);
const wingPolys = (await tracePolys(wingPng, 2500)).filter((p) => area(p) > 9000).map((p) => simplify(p, 3.5));

// Which tower a wing belongs to, by where its centre sits on the plan (fractions of width/height).
function towerOf([fx, fy]) {
  if (fy < 0.47 && fx < 0.55) return 5;
  if (fy < 0.42) return 4;
  if (fy < 0.6) return 3;
  if (fx > 0.55) return 2;
  return 1;
}
const wings = wingPolys
  .map((poly) => {
    const c = centroid(poly);
    return { tower: towerOf([c[0] / W, c[1] / H]), centre: toM(c), areaM2: Math.round(area(poly) / PX_PER_M ** 2), poly: poly.map(toM) };
  })
  .sort((a, b) => a.tower - b.tower || a.centre[0] - b.centre[0]);

// Trees: dark canopy green on the drawing, sampled on a 3 m grid and thinned to one tree per ~4.5 m.
const trees = [];
const STEP = Math.round(PX_PER_M * 3);
for (let y = STEP; y < H - STEP; y += STEP) {
  for (let x = STEP; x < W - STEP; x += STEP) {
    const i = (y * W + x) * 3;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const canopy = g > r + 14 && g > b + 8 && g < 150 && r < 120;
    if (!canopy) continue;
    const m = toM([x + ((x * 7919 + y * 104729) % STEP) - STEP / 2, y + ((x * 15485863 + y) % STEP) - STEP / 2]);
    if (trees.every((t) => (t[0] - m[0]) ** 2 + (t[1] - m[1]) ** 2 > 4.5 ** 2)) trees.push(m);
  }
}

// Plot boundary (the red dashed line), read off the drawing by hand: TL, TR, BR, BL as fractions.
const plot = [
  [0.095, 0.28],
  [0.825, 0.03],
  [0.935, 0.8],
  [0.1, 0.935],
].map(([fx, fy]) => toM([fx * W, fy * H]));

const out = { pxPerM: PX_PER_M, image: { width: W, height: H }, plot, wings, trees };
await fs.mkdir(path.join(root, 'src/three/site'), { recursive: true });
await fs.writeFile(path.join(root, 'src/three/site/footprints.json'), JSON.stringify(out));
console.log(`plot area ${Math.round(area(plot))} m² (${(area(plot) / 4046.86).toFixed(2)} acres)`);
for (const w of wings) console.log(`tower ${w.tower} wing  centre ${w.centre}  ${w.areaM2} m²  ${w.poly.length} pts`);
console.log(`${trees.length} trees`);
