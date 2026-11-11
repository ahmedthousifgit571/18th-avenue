// Builds the Location section's data from OpenStreetMap:
//   src/content/travel.json  geocoded landmarks, OSRM drive + walk minutes, simplified route lines
//   src/content/map.json     major roads and water around Bandar Seri Begawan, projected to an SVG viewBox
// Usage: node scripts/location.mjs [--map-only | --travel-only]
// Data © OpenStreetMap contributors (ODbL). Routing: FOSSGIS OSRM (routing.openstreetmap.de), free-flow times.
import fs from 'node:fs/promises';
import path from 'node:path';
import { landmarks, SITE_COORD } from '../src/content/landmarks.ts';

const root = path.resolve(import.meta.dirname, '..');
const UA = 'eighteenth-avenue-pitch-build/1.0 (static site data script)';
const args = new Set(process.argv.slice(2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Equirectangular metres around the site, then a fixed viewBox scale.
const [LAT0, LON0] = SITE_COORD;
const KX = 111320 * Math.cos((LAT0 * Math.PI) / 180);
const KY = 110574;
const M_PER_UNIT = 10; // 1 viewBox unit = 10 m
const toXY = ([lat, lon]) => [((lon - LON0) * KX) / M_PER_UNIT, (-(lat - LAT0) * KY) / M_PER_UNIT];
const r1 = (n) => Math.round(n * 10) / 10;

function simplify(points, tol) {
  if (points.length < 3) return points;
  const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const segDist = (p, a, b) => {
    const l = sq(a, b);
    if (!l) return sq(p, a);
    let t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l;
    t = Math.max(0, Math.min(1, t));
    return sq(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
  };
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let max = 0;
    let idx = 0;
    for (let i = s + 1; i < e; i++) {
      const d = segDist(points[i], points[s], points[e]);
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (max > tol * tol) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const pathD = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])} ${r1(p[1])}`).join('');

async function getJSON(url, init) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...(init?.headers ?? {}) } });
    if (res.ok) return res.json();
    console.warn(`  ${res.status} on ${url.slice(0, 90)}…, retrying`);
    await sleep(2500 * (attempt + 1));
  }
  throw new Error(`failed: ${url}`);
}

async function geocode(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=bn&q=${encodeURIComponent(q)}`;
  const [hit] = await getJSON(url);
  await sleep(1100); // Nominatim usage policy: max 1 request per second
  return hit ? [Number(hit.lat), Number(hit.lon)] : null;
}

async function route(profile, from, to) {
  const host = { car: 'routed-car', foot: 'routed-foot' }[profile];
  const url = `https://routing.openstreetmap.de/${host}/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const data = await getJSON(url);
  await sleep(400);
  const r = data.routes?.[0];
  if (!r) return null;
  return { seconds: r.duration, metres: r.distance, line: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]) };
}

if (!args.has('--map-only')) {
  const out = { origin: SITE_COORD, generated: new Date().toISOString().slice(0, 10), places: {} };
  for (const l of landmarks) {
    const coord = l.coord ?? (await geocode(l.query));
    if (!coord) {
      console.warn(`! could not geocode ${l.id} (${l.query})`);
      continue;
    }
    const car = await route('car', SITE_COORD, coord);
    const foot = await route('foot', SITE_COORD, coord);
    const line = (r) => r && simplify(r.line.map(toXY), 0.6).map((p) => [r1(p[0]), r1(p[1])]);
    // A walk over 45 minutes (or across the river by boat) isn't a walk; show the drive only.
    const walkable = foot && foot.seconds <= 45 * 60;
    out.places[l.id] = {
      coord,
      at: toXY(coord).map(r1),
      drive: car && { minutes: Math.max(1, Math.round(car.seconds / 60)), km: Math.round(car.metres / 100) / 10 },
      walk: walkable ? { minutes: Math.max(1, Math.round(foot.seconds / 60)), km: Math.round(foot.metres / 100) / 10 } : null,
      routes: { drive: line(car), walk: walkable ? line(foot) : null },
    };
    console.log(
      `${l.id.padEnd(14)} drive ${out.places[l.id].drive?.minutes ?? '–'} min (${out.places[l.id].drive?.km} km)  walk ${out.places[l.id].walk?.minutes ?? '–'} min`,
    );
  }
  await fs.writeFile(path.join(root, 'src/content/travel.json'), JSON.stringify(out));
  console.log('wrote src/content/travel.json');
}

if (!args.has('--travel-only')) {
  // Around 11 × 10 km: Gadong and the airport to the north-west, Kota Batu to the east, the palace to the south-west.
  const bbox = [4.862, 114.885, 4.958, 114.985]; // S, W, N, E
  const q = `[out:json][timeout:120];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"](${bbox});
  way["waterway"~"^(river|canal)$"](${bbox});
  way["natural"="water"](${bbox});
  way["natural"="coastline"](${bbox});
  way["aeroway"="runway"](${bbox});
);
out geom tags;`;
  console.log('querying Overpass (this can take a minute)…');
  const data = await getJSON('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: new URLSearchParams({ data: q }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const layers = { major: [], minor: [], river: [], water: [], coast: [], runway: [] };
  const names = [];
  for (const el of data.elements) {
    if (!el.geometry) continue;
    const t = el.tags ?? {};
    const pts = el.geometry.map((g) => toXY([g.lat, g.lon]));
    const closed = el.geometry.length > 3 && el.geometry[0].lat === el.geometry.at(-1).lat && el.geometry[0].lon === el.geometry.at(-1).lon;
    let layer;
    if (t.highway) layer = /motorway|trunk|primary/.test(t.highway) ? 'major' : 'minor';
    else if (t.waterway) layer = 'river';
    else if (t.natural === 'water') layer = closed ? 'water' : 'river';
    else if (t.natural === 'coastline') layer = 'coast';
    else if (t.aeroway) layer = 'runway';
    if (!layer) continue;
    const s = simplify(pts, layer === 'minor' ? 1.2 : 0.8);
    if (s.length < 2) continue;
    layers[layer].push(pathD(s) + (layer === 'water' ? 'Z' : ''));
    if (layer === 'major' && t.name && !names.some((n) => n.name === t.name)) {
      const mid = s[Math.floor(s.length / 2)];
      names.push({ name: t.name, at: mid.map(r1) });
    }
  }
  const [x0, y1] = toXY([bbox[0], bbox[1]]);
  const [x1, y0] = toXY([bbox[2], bbox[3]]);
  const map = {
    viewBox: [r1(x0), r1(y0), r1(x1 - x0), r1(y1 - y0)],
    metresPerUnit: M_PER_UNIT,
    layers: Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.join('')])),
    roadNames: names,
    attribution: '© OpenStreetMap contributors',
  };
  await fs.writeFile(path.join(root, 'src/content/map.json'), JSON.stringify(map));
  const kb = (JSON.stringify(map).length / 1024).toFixed(0);
  console.log(`wrote src/content/map.json (${kb} KB; ${Object.entries(layers).map(([k, v]) => `${k} ${v.length}`).join(', ')})`);
}
