// Procedural backdrops for the home page (no stock imagery):
//   public/media/textures/silk.webp     a soft cream fabric with large diagonal folds (Residences backdrop)
//   public/media/textures/cloud-*.webp  white cloud banks with alpha ("View from above")
//   public/media/textures/aerial.webp   the client's site plan with the bold "TOWER n" roof labels painted out
// Usage: node scripts/make-textures.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'public/media/textures');
await fs.mkdir(outDir, { recursive: true });

// Deterministic value noise.
function makeNoise(seed) {
  const P = new Uint8Array(512);
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
  const val = new Float32Array(256).map(() => rnd());
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const a = val[P[(P[xi & 255] + yi) & 511] & 255];
    const b = val[P[(P[(xi + 1) & 255] + yi) & 511] & 255];
    const c = val[P[(P[xi & 255] + yi + 1) & 511] & 255];
    const d = val[P[(P[(xi + 1) & 255] + yi + 1) & 511] & 255];
    const u = fade(xf), v = fade(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
const fbm = (n, x, y, oct = 5) => {
  let a = 0.5, f = 1, s = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    s += a * n(x * f, y * f);
    norm += a;
    a *= 0.5;
    f *= 2.03;
  }
  return s / norm;
};
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const only = process.argv.slice(2);
const want = (k) => !only.length || only.includes(k);

// 1. Silk: a height field of a few broad folds, lit from the upper left.
if (want('silk')) {
  const W = 960, H = 540;
  const noise = makeNoise(7);
  const folds = [
    { a: 1.0, ang: -0.9, wl: 1150, ph: 0.6 },
    { a: 0.6, ang: -0.55, wl: 760, ph: 2.2 },
    { a: 0.22, ang: -1.2, wl: 420, ph: 4.1 },
  ];
  const height = (x, y) => {
    let h = 0;
    for (const f of folds) {
      const t = ((x * Math.cos(f.ang) + y * Math.sin(f.ang)) / f.wl) * Math.PI * 2 + f.ph + fbm(noise, x / 520, y / 520, 3) * 1.6;
      // Soft rounded crests and sharper valleys, like draped fabric.
      h += f.a * Math.pow((Math.sin(t) + 1) / 2, 1.6);
    }
    return h * 340;
  };
  const L = [-0.55, -0.6, 0.58];
  const ll = Math.hypot(...L);
  const light = L.map((v) => v / ll);
  const buf = Buffer.alloc(W * H * 3);
  const lo = [214, 198, 166], hi = [248, 242, 226];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = height(x + 1, y) - height(x - 1, y);
      const dy = height(x, y + 1) - height(x, y - 1);
      const nx = -dx, ny = -dy, nz = 2;
      const nl = Math.hypot(nx, ny, nz);
      const diff = Math.max(0, (nx * light[0] + ny * light[1] + nz * light[2]) / nl);
      const shade = Math.min(1, 0.18 + diff * 0.95);
      const i = (y * W + x) * 3;
      for (let k = 0; k < 3; k++) buf[i + k] = Math.round(lo[k] + (hi[k] - lo[k]) * shade);
    }
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
    .blur(2.2)
    .resize(1920, 1080, { kernel: 'lanczos3' })
    .webp({ quality: 80 })
    .toFile(path.join(outDir, 'silk.webp'));
  console.log('silk.webp');
}

// 2. Clouds: fBm thresholded into soft white banks; alpha fades towards the edges of each image.
if (want('clouds')) for (const [name, seed, W, H, cover] of [
  ['cloud-a', 11, 1400, 900, 0.5],
  ['cloud-b', 23, 1400, 900, 0.56],
  ['cloud-c', 37, 1200, 1200, 0.5],
]) {
  const noise = makeNoise(seed);
  const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const nx = x / W - 0.5, ny = y / H - 0.5;
      const edge = 1 - smooth(0.22, 0.5, Math.hypot(nx * 1.1, ny * 1.25));
      const n = fbm(noise, x / 260, y / 260, 6);
      const a = smooth(cover, cover + 0.28, n * (0.55 + edge * 0.6)) * edge;
      const shade = 0.86 + 0.14 * smooth(0.3, 0.8, fbm(noise, x / 120 + 40, y / 120 + 40, 3));
      const i = (y * W + x) * 4;
      const c = Math.round(255 * shade);
      buf[i] = c;
      buf[i + 1] = c;
      buf[i + 2] = Math.min(255, c + 4);
      buf[i + 3] = Math.round(255 * Math.min(1, a * 1.1));
    }
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).blur(1.2).webp({ quality: 78, alphaQuality: 80 }).toFile(path.join(outDir, `${name}.webp`));
  console.log(`${name}.webp`);
}

// 3. Aerial: the painted-out site plan (ground.webp) with each tower wing's roof refilled flat, which removes the
// drawing's bold "TOWER n" labels. Wing outlines come from scripts/site-footprints.mjs (metres, 12.4 px/m,
// origin at the drawing's centre).
if (want('aerial')) {
  const fp = JSON.parse(await fs.readFile(path.join(root, 'src/three/site/footprints.json'), 'utf8'));
  const { width: W, height: H } = fp.image;
  const px = ([x, y]) => [W / 2 + x * fp.pxPerM, H / 2 + y * fp.pxPerM];
  const shrink = (poly, d) => {
    // Inset each vertex towards the centroid (good enough for these near-rectangular wings).
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
    const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    return poly.map(([x, y]) => {
      const vx = x - cx, vy = y - cy;
      const l = Math.hypot(vx, vy) || 1;
      return [x - (vx / l) * d, y - (vy / l) * d];
    });
  };
  const paths = fp.wings
    .map((w) => shrink(w.poly.map(px), 4))
    .map((poly) => `<path d="M${poly.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L')}Z" fill="#f4f3ee"/>`)
    .join('');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${paths}</svg>`);
  const { data, info } = await sharp(path.join(outDir, 'ground.webp'))
    .composite([{ input: svg }])
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // The labels also cross the lift cores between wings: inside each tower's bounding box (wings plus core), find
  // dark, neutral pixels (the label ink; trees and shadows are green) and paint them with the core's light grey.
  const C = info.channels;
  const byTower = new Map();
  for (const w of fp.wings) {
    const pts = w.poly.map(px);
    const b = byTower.get(w.tower) ?? [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of pts) {
      b[0] = Math.min(b[0], x);
      b[1] = Math.min(b[1], y);
      b[2] = Math.max(b[2], x);
      b[3] = Math.max(b[3], y);
    }
    byTower.set(w.tower, b);
  }
  const mask = new Uint8Array(info.width * info.height);
  for (const [, [x0, y0, x1, y1]] of byTower) {
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
      for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        const i = (y * info.width + x) * C;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        if (lum < 140 && chroma < 34) mask[y * info.width + x] = 1;
      }
  }
  // Dilate twice to catch anti-aliased edges, then fill each masked pixel with the mean of nearby unmasked ones.
  for (let pass = 0; pass < 2; pass++) {
    const next = mask.slice();
    for (let y = 1; y < info.height - 1; y++)
      for (let x = 1; x < info.width - 1; x++) {
        const k = y * info.width + x;
        if (mask[k]) continue;
        if (mask[k - 1] || mask[k + 1] || mask[k - info.width] || mask[k + info.width]) next[k] = 1;
      }
    mask.set(next);
  }
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      if (!mask[y * info.width + x]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let rad = 3; n < 6 && rad < 30; rad += 3)
        for (let dy = -rad; dy <= rad; dy += 3)
          for (let dx = -rad; dx <= rad; dx += 3) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= info.width || yy >= info.height || mask[yy * info.width + xx]) continue;
            const j = (yy * info.width + xx) * C;
            r += data[j];
            g += data[j + 1];
            b += data[j + 2];
            n++;
          }
      if (n) {
        const i = (y * info.width + x) * C;
        data[i] = Math.round(r / n);
        data[i + 1] = Math.round(g / n);
        data[i + 2] = Math.round(b / n);
      }
    }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: C } })
    .webp({ quality: 88 })
    .toFile(path.join(outDir, 'aerial.webp'));
  console.log('aerial.webp');
}
