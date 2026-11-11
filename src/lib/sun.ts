/**
 * Solar position for Bandar Seri Begawan (NOAA's simplified equations, good to a fraction of a degree), plus the
 * light colours the scene uses at each hour. BSB sits at 4.9°N, so the sun climbs almost straight up and sets fast.
 */
export const BSB = { lat: 4.8949, lon: 114.937, utcOffset: 8 };

/**
 * A fixed reference day (10 November) keeps server and client renders identical. At 4.9°N the sun's path barely
 * changes through the year: sunrise and sunset move by about 20 minutes.
 */
export const REFERENCE_DATE = new Date(Date.UTC(2026, 10, 10));

const rad = Math.PI / 180;

/** Returns azimuth (degrees clockwise from north) and elevation (degrees) for a local hour on a given date. */
export function sunPosition(hour: number, date: Date = REFERENCE_DATE) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000);
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hour - 12) / 24);
  const eqTime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const timeOffset = eqTime + 4 * BSB.lon - 60 * BSB.utcOffset;
  const trueSolarMinutes = hour * 60 + timeOffset;
  const hourAngle = (trueSolarMinutes / 4 - 180) * rad;
  const lat = BSB.lat * rad;
  const cosZenith = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
  const zenith = Math.acos(Math.min(1, Math.max(-1, cosZenith)));
  const elevation = 90 - zenith / rad;
  let azimuth =
    Math.acos(Math.min(1, Math.max(-1, (Math.sin(lat) * Math.cos(zenith) - Math.sin(decl)) / (Math.cos(lat) * Math.sin(zenith))))) / rad;
  azimuth = hourAngle > 0 ? (azimuth + 180) % 360 : (540 - azimuth) % 360;
  return { azimuth, elevation };
}

/** Unit vector towards the sun in scene space (+x east, +y up, +z south). */
export function sunDirection(hour: number, date?: Date): [number, number, number] {
  const { azimuth, elevation } = sunPosition(hour, date);
  const az = azimuth * rad;
  const el = elevation * rad;
  return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
}

type Stop = { h: number; sky: string; horizon: string; ground: string; sun: string; sunI: number; amb: number; windows: number; fog: string };

// Hand-graded keys for Brunei light: humid haze in the morning, white noon, a short amber dusk, blue night.
const STOPS: Stop[] = [
  { h: 5.4, sky: '#141c2b', horizon: '#3a3f52', ground: '#1b2028', sun: '#ff9a62', sunI: 0.0, amb: 0.2, windows: 1, fog: '#2b3040' },
  { h: 6.25, sky: '#5b6f8f', horizon: '#f2b48a', ground: '#6b6458', sun: '#ffb27a', sunI: 1.2, amb: 0.42, windows: 0.35, fog: '#c9a58a' },
  { h: 7.6, sky: '#7fa6cf', horizon: '#ece3d2', ground: '#8f8a7c', sun: '#fff0d8', sunI: 2.5, amb: 0.6, windows: 0, fog: '#d9dcd8' },
  { h: 12.2, sky: '#6f9fd1', horizon: '#e6ebee', ground: '#99958a', sun: '#ffffff', sunI: 3.0, amb: 0.72, windows: 0, fog: '#dfe5e8' },
  { h: 15.8, sky: '#7ea2c8', horizon: '#efdcc0', ground: '#948c7b', sun: '#ffe2b4', sunI: 2.7, amb: 0.6, windows: 0, fog: '#e2d6c2' },
  { h: 17.3, sky: '#6a7ea3', horizon: '#f6b679', ground: '#7d6e5e', sun: '#ffab5e', sunI: 2.3, amb: 0.48, windows: 0, fog: '#e3b48c' },
  { h: 17.95, sky: '#3f4a6b', horizon: '#de8a68', ground: '#4c4440', sun: '#ff7a4a', sunI: 0.8, amb: 0.32, windows: 0.55, fog: '#866676' },
  { h: 18.6, sky: '#1a2236', horizon: '#45466a', ground: '#22252c', sun: '#ff7a4a', sunI: 0, amb: 0.22, windows: 1, fog: '#2c3044' },
  { h: 21, sky: '#0d1320', horizon: '#232a40', ground: '#15181e', sun: '#ff7a4a', sunI: 0, amb: 0.18, windows: 1, fog: '#1a1f2c' },
];

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export type Light = {
  sky: [number, number, number];
  horizon: [number, number, number];
  ground: [number, number, number];
  sun: [number, number, number];
  fog: [number, number, number];
  sunI: number;
  amb: number;
  windows: number;
};

export function lightAt(hour: number): Light {
  const h = Math.min(STOPS.at(-1)!.h, Math.max(STOPS[0].h, hour));
  let i = 0;
  while (i < STOPS.length - 2 && STOPS[i + 1].h < h) i++;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const t = (h - a.h) / (b.h - a.h);
  const s = t * t * (3 - 2 * t);
  const mix = (x: string, y: string) => {
    const p = hexToRgb(x);
    const q = hexToRgb(y);
    return [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s, p[2] + (q[2] - p[2]) * s] as [number, number, number];
  };
  return {
    sky: mix(a.sky, b.sky),
    horizon: mix(a.horizon, b.horizon),
    ground: mix(a.ground, b.ground),
    sun: mix(a.sun, b.sun),
    fog: mix(a.fog, b.fog),
    sunI: a.sunI + (b.sunI - a.sunI) * s,
    amb: a.amb + (b.amb - a.amb) * s,
    windows: a.windows + (b.windows - a.windows) * s,
  };
}

export function formatHour(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60 / 5) * 5;
  const hh = m === 60 ? h + 1 : h;
  const mm = m === 60 ? 0 : m;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export const HOUR_PRESETS = [
  { label: 'Morning', hour: 7.4 },
  { label: 'Noon', hour: 12.2 },
  { label: 'Golden hour', hour: 17.35 },
  { label: 'Night', hour: 19.6 },
] as const;
