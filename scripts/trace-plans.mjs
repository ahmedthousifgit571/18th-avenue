// Traces the structural walls out of each live floor-plan image into SVG path data.
//   src/content/plans.json  { [planId]: { w, h, d } }  (d in the plan image's pixel space)
// The walls on these drawings are solid black and thick; furniture is grey and thin. A median filter removes the
// thin strokes (furniture, dimensions, text), a threshold keeps the black, and potrace vectorises what is left.
// Usage: node scripts/trace-plans.mjs [--preview]   (--preview writes PNG overlays to assets-src/trace-preview)
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import potrace from 'potrace';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'scripts/assets.json'), 'utf8'));
const ids = Object.keys(manifest.groups.plans).filter((k) => /^t\d/.test(k));
const preview = process.argv.includes('--preview');

function trace(buf) {
  return new Promise((resolve, reject) => {
    const p = new potrace.Potrace({ turdSize: 40, optTolerance: 0.4, alphaMax: 0.6, threshold: 128, blackOnWhite: true });
    p.loadImage(buf, (err) => {
      if (err) return reject(err);
      const tag = p.getPathTag('#000');
      resolve(tag.match(/ d="([^"]+)"/)?.[1] ?? '');
    });
  });
}

const out = {};
for (const id of ids) {
  const src = path.join(root, 'public/media/plans', `${id}.webp`);
  const { width: w, height: h } = await sharp(src).metadata();
  const mask = await sharp(src)
    .flatten({ background: '#fff' })
    .greyscale()
    .median(5)
    .threshold(70)
    .png()
    .toBuffer();
  const d = (await trace(mask))
    .replace(/(\d+\.\d{1})\d+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  out[id] = { w, h, d };
  console.log(`${id.padEnd(6)} ${w}×${h}  ${(d.length / 1024).toFixed(1)} KB`);

  if (preview) {
    const dir = path.join(root, 'assets-src/trace-preview');
    await fs.mkdir(dir, { recursive: true });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="${d}" fill="#c2410c" fill-opacity="0.85"/></svg>`;
    await sharp(src)
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toFile(path.join(dir, `${id}.png`));
  }
}
await fs.writeFile(path.join(root, 'src/content/plans.json'), JSON.stringify(out));
console.log('wrote src/content/plans.json');
