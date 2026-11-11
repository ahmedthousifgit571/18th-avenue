// Proves every unit figure on the site is the client's own: parses the live Unit Plan page and diffs it against
// src/content/units.ts, field by field and in order.
// Usage: node scripts/verify-data.mjs [--live]   (--live re-downloads the page instead of using assets-src/live)
import fs from 'node:fs/promises';
import path from 'node:path';
import { layouts } from '../src/content/units.ts';

const root = path.resolve(import.meta.dirname, '..');
const cache = path.join(root, 'assets-src/live/apartment.html');
let html;
if (process.argv.includes('--live')) {
  html = await (await fetch('https://18thavenue.com.bn/apartment/', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  await fs.mkdir(path.dirname(cache), { recursive: true });
  await fs.writeFile(cache, html);
} else {
  html = await fs.readFile(cache, 'utf8');
}

const tokens = html
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]*>/g, '\n')
  .replace(/&#038;|&amp;/g, '&')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

const num = (s) => (s === 'NA' ? null : Number(s.replace(/[^0-9.]/g, '')));
const blocks = [];
for (let i = 0; i < tokens.length; i++) {
  if (!/^TOWER \d$/.test(tokens[i])) continue;
  const b = { tower: Number(tokens[i].slice(6)), floors: tokens[i + 1] };
  const m = tokens[i + 2].match(/No\.of Units: (\d+) \((.+)\)/);
  b.units = Number(m[1]);
  b.bedrooms = m[2];
  // Field/value pairs until the next block. The first occurrence wins (Tower 5 Ground A repeats an area block).
  for (let j = i + 3; j < tokens.length && !/^TOWER \d$/.test(tokens[j]) && j < i + 60; j++) {
    const key = tokens[j];
    const val = tokens[j + 1];
    const map = {
      'Internal Area': 'internal',
      'Balcony/PES': 'balcony',
      'A/C Ledge': 'acLedge',
      'Gross Total Area': 'gross',
      'Living Room': 'living',
      'Master Bedroom': 'master',
      'Bedroom 1': 'bed1',
      'Bedroom 2': 'bed2',
      'Dining Room': 'dining',
      Kitchen: 'kitchen',
      Ultilities: 'utility',
    };
    if (map[key] && !(map[key] in b)) b[map[key]] = num(val);
  }
  blocks.push(b);
}

let diffs = 0;
const check = (where, label, live, ours) => {
  if (live !== ours) {
    diffs++;
    console.log(`✗ ${where} ${label}: live ${JSON.stringify(live)} vs ours ${JSON.stringify(ours)}`);
  }
};
if (blocks.length !== layouts.length) check('count', 'layouts', blocks.length, layouts.length);
blocks.forEach((b, i) => {
  const l = layouts[i];
  if (!l) return;
  const w = `${l.id}`;
  check(w, 'tower', b.tower, l.tower);
  check(w, 'floors', b.floors, l.floors);
  check(w, 'units', b.units, l.unitsListed);
  check(w, 'bedrooms', b.bedrooms, l.bedrooms);
  for (const k of ['internal', 'balcony', 'acLedge', 'gross']) check(w, k, b[k], l.area[k]);
  for (const k of ['living', 'master', 'bed1', 'bed2', 'dining', 'kitchen', 'utility']) check(w, k, b[k], l.rooms[k]);
});

const homeTokens = (await fs.readFile(path.join(root, 'assets-src/live/home.html'), 'utf8')).match(/TYPE \d[^|<]*@ [\d,.]+ sf/g) ?? [];
console.log(`home page size list: ${homeTokens.length ? homeTokens.join(' · ') : 'not found'}`);
console.log(diffs ? `\n${diffs} difference(s)` : `✓ all ${layouts.length} layouts match the live unit table (${blocks.length} blocks parsed)`);
process.exitCode = diffs ? 1 : 0;
