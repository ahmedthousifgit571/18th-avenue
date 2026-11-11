'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'animejs';
import { Car, Footprints } from 'lucide-react';
import map from '@/content/map.json';
import travel from '@/content/travel.json';
import { landmarks, type LandmarkGroup } from '@/content/landmarks';

type Mode = 'drive' | 'walk';
type Place = {
  at: number[];
  drive: { minutes: number; km: number } | null;
  walk: { minutes: number; km: number } | null;
  routes: { drive: number[][] | null; walk: number[][] | null };
};
const places = travel.places as unknown as Record<string, Place>;
const GROUPS: LandmarkGroup[] = ['Parks & river', 'Culture', 'Everyday', 'Connections'];
const HOME_BOX = [-125, -100, 250, 210];

function boxFor(points: number[][], aspect: number) {
  const xs = [0, ...points.map((p) => p[0])];
  const ys = [0, ...points.map((p) => p[1])];
  let x0 = Math.min(...xs);
  let x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  const pad = Math.max(40, (x1 - x0 + y1 - y0) * 0.2);
  x0 -= pad;
  x1 += pad;
  y0 -= pad;
  y1 += pad;
  let w = x1 - x0;
  let h = y1 - y0;
  if (w / h > aspect) {
    const nh = w / aspect;
    y0 -= (nh - h) / 2;
    h = nh;
  } else {
    const nw = h * aspect;
    x0 -= (nw - w) / 2;
    w = nw;
  }
  return [x0, y0, w, h];
}

/** Belgrade Arbor's proximity matrix with real routes: times are OSRM estimates on OpenStreetMap roads. */
export default function Location() {
  const [mode, setMode] = useState<Mode>('drive');
  const [activeId, setActiveId] = useState('crown-park');
  const svg = useRef<SVGSVGElement>(null);
  const view = useRef({ x: HOME_BOX[0], y: HOME_BOX[1], w: HOME_BOX[2], h: HOME_BOX[3] });
  const [zoom, setZoom] = useState(HOME_BOX[2]);

  const active = places[activeId];
  const lm = landmarks.find((l) => l.id === activeId)!;
  const routeMode: Mode = mode === 'walk' && active?.routes.walk ? 'walk' : 'drive';
  const route = useMemo(() => active?.routes[routeMode] ?? [], [active, routeMode]);
  const routeD = useMemo(() => route.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(''), [route]);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const aspect = r.width / Math.max(1, r.height);
    const [x, y, w, h] = route.length ? boxFor([...route, active.at], aspect) : HOME_BOX;
    const v = view.current;
    setZoom(w);
    const anim = animate(v, {
      x,
      y,
      w,
      h,
      duration: 1300,
      ease: 'inOutQuart',
      onUpdate: () => el.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`),
    });
    return () => {
      anim.pause();
    };
  }, [route, active]);

  const minutes = (id: string) => {
    const l = landmarks.find((x) => x.id === id)!;
    const p = places[id];
    if (!p) return null;
    if (l.claim && l.claim.mode === mode) return { v: l.claim.minutes, note: l.claim.note, mode };
    if (mode === 'walk' && p.walk) return { v: p.walk.minutes, note: `${p.walk.km} km on foot`, mode: 'walk' as Mode };
    if (p.drive) return { v: p.drive.minutes, note: `${p.drive.km} km by road`, mode: 'drive' as Mode };
    return null;
  };

  return (
    <section id="location" className="relative z-[3] bg-paper py-24 md:py-36" data-tone="light" aria-labelledby="location-title">
      <div className="wrap">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow mb-5 text-bronze">Prime location</p>
            <h2 id="location-title" className="display h-lg">
              Best location in <em>Bandar Seri Begawan.</em>
            </h2>
          </div>
          <div className="md:col-span-5">
            <p className="body">
              5 minutes’ walk from the eco-corridor riverfront public park, Golden Jubilee Crown Park, and close to the
              central business district, hospitals, schools, the airport and the city’s landmarks.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-line p-1" role="radiogroup" aria-label="Travel mode">
              {(['drive', 'walk'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] transition-colors duration-500 ${mode === m ? 'bg-ink text-ivory' : 'text-ink-soft'}`}
                >
                  {m === 'drive' ? <Car size={14} strokeWidth={1.5} /> : <Footprints size={14} strokeWidth={1.5} />} {m === 'drive' ? 'Drive' : 'Walk'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="sticky top-[calc(var(--header-h)+1rem)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#efe9dd] lg:aspect-square">
                <svg ref={svg} viewBox={HOME_BOX.join(' ')} className="absolute inset-0 size-full" role="img" aria-label={`Map: route from 18th Avenue to ${lm.name}`}>
                  <path d={map.layers.water} fill="#c9d9da" />
                  <path d={map.layers.river} fill="none" stroke="#c9d9da" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={map.layers.runway} fill="none" stroke="#d8d0c0" strokeWidth={5} />
                  <path d={map.layers.minor} fill="none" stroke="#ddd4c4" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
                  <path d={map.layers.major} fill="none" stroke="#cbbf9f" strokeWidth={2.2} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                  {route.length > 0 && (
                    <path key={`${activeId}-${routeMode}`} d={routeD} fill="none" stroke="#806938" strokeWidth={zoom / 150} strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="route-draw" />
                  )}
                  {Object.entries(places).map(([id, p]) => (
                    <g key={id} transform={`translate(${p.at[0]} ${p.at[1]})`}>
                      <circle r={zoom / 160} fill={id === activeId ? '#806938' : '#1e1e1e'} opacity={id === activeId ? 1 : 0.45} />
                    </g>
                  ))}
                  {active && (
                    <g transform={`translate(${active.at[0]} ${active.at[1]})`}>
                      <text y={-zoom / 55} textAnchor="middle" fontSize={zoom / 30} fill="#1e1e1e" stroke="#efe9dd" strokeWidth={zoom / 160} paintOrder="stroke" style={{ fontFamily: 'var(--font-serif)' }}>
                        {lm.name}
                      </text>
                    </g>
                  )}
                  <g>
                    <circle r={zoom / 60} fill="#d1be95" opacity={0.35} className="origin-center animate-ping [transform-box:fill-box] [animation-duration:2.4s]" />
                    <circle r={zoom / 95} fill="#1e1e1e" />
                    <circle r={zoom / 220} fill="#d1be95" />
                    <text y={zoom / 28} textAnchor="middle" fontSize={zoom / 34} fill="#1e1e1e" stroke="#efe9dd" strokeWidth={zoom / 160} paintOrder="stroke" letterSpacing={zoom / 400} style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                      18TH AVENUE
                    </text>
                  </g>
                </svg>
                <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] backdrop-blur">
                  18th Avenue → {lm.name}
                </div>
                <p className="absolute bottom-2 right-3 text-[0.625rem] text-ink-soft/70">{map.attribution}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            {GROUPS.map((g) => (
              <div key={g} className="mb-8">
                <p className="eyebrow mb-2 text-bronze">{g}</p>
                <ul className="divide-y divide-line border-y border-line">
                  {landmarks
                    .filter((l) => l.group === g && places[l.id])
                    .map((l) => {
                      const m = minutes(l.id);
                      const on = activeId === l.id;
                      return (
                        <li key={l.id}>
                          <button
                            type="button"
                            onClick={() => setActiveId(l.id)}
                            onPointerEnter={() => setActiveId(l.id)}
                            className={`flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors ${on ? 'text-ink' : 'text-ink-soft hover:text-ink'}`}
                            aria-pressed={on}
                          >
                            <span className="min-w-0">
                              <span className="block font-serif text-xl leading-tight">{l.name}</span>
                              {on && l.blurb && <span className="mt-1 block text-xs leading-relaxed text-mute animate-[rise_0.5s_var(--ease-avenue)_both]">{l.blurb}</span>}
                            </span>
                            {m && (
                              <span className="shrink-0 text-right">
                                <span className="num block text-3xl leading-none">
                                  {m.v}
                                  <span className="ml-1 text-base text-mute">min</span>
                                </span>
                                <span className="mt-1 flex items-center justify-end gap-1 text-[0.625rem] uppercase tracking-[0.16em] text-mute">
                                  {m.mode === 'walk' ? <Footprints size={11} /> : <Car size={11} />} {m.note}
                                </span>
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
            <p className="text-xs leading-relaxed text-mute">
              Approximate times without traffic, routed on OpenStreetMap roads (OSRM). The Crown Park walk is the
              developer’s published figure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
