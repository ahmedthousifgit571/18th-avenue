// Neighbourhood context for the 3D site model: real OpenStreetMap building footprints and roads within ~450 m,
// converted to the scene's metres (+x east, +z south, origin at the centre of the client's site plan).
//   src/three/site/context.json
// The plot centre was located on satellite imagery: the construction site (started July 2024) on the east side of
// the southern end of Jalan Haji Basir, whose size and skew match the drawing (2.6 acres measured).
// Usage: node scripts/context.mjs        Data © OpenStreetMap contributors (ODbL).
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
export const PLOT_CENTRE = [4.89493, 114.93705];
const R = 460;
const [LAT0, LON0] = PLOT_CENTRE;
const KX = 111320 * Math.cos((LAT0 * Math.PI) / 180);
const KY = 110574;
const toM = (lat, lon) => [Math.round((lon - LON0) * KX * 10) / 10, Math.round(-(lat - LAT0) * KY * 10) / 10];

const q = `[out:json][timeout:90];
(
  way["building"](around:${R},${LAT0},${LON0});
  way["highway"~"^(primary|secondary|tertiary|residential|unclassified|service)$"](around:${R + 80},${LAT0},${LON0});
  way["waterway"](around:${R + 80},${LAT0},${LON0});
);
out geom tags;`;

let data;
for (let i = 0; i < 4 && !data; i++) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: new URLSearchParams({ data: q }),
    headers: { 'User-Agent': 'eighteenth-avenue-pitch-build/1.0', 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (res.ok) data = await res.json();
  else await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
}
if (!data) throw new Error('Overpass failed');

const buildings = [];
const roads = [];
const water = [];
for (const el of data.elements) {
  if (!el.geometry) continue;
  const t = el.tags ?? {};
  const pts = el.geometry.map((g) => toM(g.lat, g.lon));
  if (t.building) {
    if (pts.length < 4) continue;
    const levels = Number(t['building:levels']) || null;
    buildings.push({ levels, kind: t.building, name: t.name ?? null, poly: pts.slice(0, -1) });
  } else if (t.highway) {
    const width = { primary: 14, secondary: 11, tertiary: 9, residential: 6.5, unclassified: 6.5, service: 4.5 }[t.highway];
    roads.push({ width, name: t.name ?? null, line: pts });
  } else if (t.waterway) {
    water.push({ width: t.waterway === 'river' ? 18 : 5, line: pts });
  }
}
await fs.mkdir(path.join(root, 'src/three/site'), { recursive: true });
await fs.writeFile(path.join(root, 'src/three/site/context.json'), JSON.stringify({ centre: PLOT_CENTRE, buildings, roads, water }));
console.log(`${buildings.length} buildings, ${roads.length} roads, ${water.length} waterways`);
const inside = buildings.filter((b) => b.poly.every(([x, z]) => Math.abs(x) < 60 && Math.abs(z) < 40));
console.log(`buildings fully inside the plot core: ${inside.length}`, inside.map((b) => b.name || b.kind).join(', '));
