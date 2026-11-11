'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Car, Footprints } from 'lucide-react';
import Reveal from '@/components/type/Reveal';
import Wordmark from '@/components/chrome/Wordmark';
import map from '@/content/map.json';
import travel from '@/content/travel.json';
import { landmarks } from '@/content/landmarks';
import { around } from '@/content/home';

type Trip = { minutes: number; km: number } | null;
type Place = { at: number[]; drive: Trip; walk: Trip; routes: { drive: number[][] | null; walk: number[][] | null } };
const places = travel.places as unknown as Record<string, Place>;

// The map window in OSM map units (10 m each), +y south; the plot is at the origin.
const BOX = { x: -118, y: -96, w: 246, h: 232 };
const TILT = { x: 54, z: -22 };

const items = around.map((id) => {
  const lm = landmarks.find((l) => l.id === id)!;
  const p = places[id];
  const walk = lm.claim?.mode === 'walk' ? lm.claim.minutes : p.walk?.minutes ?? null;
  const drive = p.drive?.minutes ?? null;
  // Places beyond the window sit on its edge with an arrow pointing their way.
  const fx = (p.at[0] - BOX.x) / BOX.w;
  const fy = (p.at[1] - BOX.y) / BOX.h;
  const off = fx < 0.04 || fx > 0.96 || fy < 0.04 || fy > 0.96;
  return {
    id,
    name: lm.name.replace('Sultan Omar Ali Saifuddien Mosque', 'Omar Ali Saifuddien Mosque').replace('Taman Jubli Perak Sultan Haji Hassanal Bolkiah', 'Taman Jubli Perak'),
    blurb: lm.blurb,
    claim: lm.claim?.note,
    walk,
    drive,
    x: Math.min(0.94, Math.max(0.06, fx)),
    y: Math.min(0.94, Math.max(0.06, fy)),
    off,
    route: p.routes.drive ?? p.routes.walk,
  };
});

/**
 * "What's around": the places in a large serif list beside a tilted 3D street map (OpenStreetMap roads). Picking a
 * place lifts its pin and draws the drive there. Minutes are OSRM estimates; Crown Park keeps the client's claim.
 */
export default function Around() {
  const [active, setActive] = useState<string>(items[0].id);
  const a = items.find((i) => i.id === active)!;
  const routeD = useMemo(() => (a.route ? a.route.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('') : ''), [a]);
  const stage = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<Record<string, [number, number]>>({});

  // Read where the tilted plane puts each anchor (relative to the map box), on mount and whenever it resizes.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const next: Record<string, [number, number]> = {};
      el.querySelectorAll<HTMLElement>('[data-anchor]').forEach((n) => {
        const r = n.getBoundingClientRect();
        next[n.dataset.anchor!] = [r.left - box.left, r.top - box.top];
      });
      setPins(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section id="around" className="relative overflow-hidden bg-vanilla py-[12vh] text-pine md:py-[10vh]" aria-labelledby="around-title">
      <div className="wrap grid gap-10 md:grid-cols-12 md:gap-6">
        <div className="relative z-[2] md:col-span-5">
          <Reveal>
            <p id="around-title" data-fade className="t-kicker text-[0.95rem] text-pine">
              What’s around
            </p>
          </Reveal>
          <ul className="mt-6 flex flex-col" role="list">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(it.id)}
                  onFocus={() => setActive(it.id)}
                  onClick={() => setActive(it.id)}
                  aria-pressed={active === it.id}
                  className={`t-list block text-left text-[clamp(1.9rem,3.1vw,3.9rem)] leading-[1.06] transition-[color,transform] duration-500 ease-[var(--ease-avenue)] ${
                    active === it.id ? 'translate-x-2 italic text-pine' : 'text-golden/85 hover:text-golden'
                  }`}
                >
                  {it.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 border-t border-pine/20 pt-6" aria-live="polite">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <p className="t-kicker text-[0.85rem] text-golden">{a.name}</p>
              {a.walk != null && (
                <p className="flex items-center gap-2 text-[0.9rem]">
                  <Footprints size={15} strokeWidth={1.4} aria-hidden /> {a.walk} min<span className="sr-only"> walk</span>
                </p>
              )}
              {a.drive != null && (
                <p className="flex items-center gap-2 text-[0.9rem]">
                  <Car size={15} strokeWidth={1.4} aria-hidden /> {a.drive} min<span className="sr-only"> drive</span>
                </p>
              )}
            </div>
            <p key={a.id} className="t-body mt-3 max-w-[30rem] text-pine/80 animate-[rise_0.7s_var(--ease-avenue)_both]">
              {a.blurb ?? 'Close to home, minutes from the towers.'}
              {a.claim && <span className="mt-2 block text-[0.75rem] text-pine/55">Walking time: {a.claim.toLowerCase()}.</span>}
            </p>
            <p className="mt-4 text-[0.68rem] text-pine/45">Travel times: OSRM estimates on OpenStreetMap roads, without traffic. Map data © OpenStreetMap contributors.</p>
          </div>
        </div>

        {/* Tilted map */}
        <div ref={stage} className="relative md:col-span-7 md:-mr-[var(--gutter)] md:-mt-[8vh]" aria-hidden>
          <div className="relative mx-auto aspect-[1.06] w-[118%] max-w-none -translate-x-[8%] [perspective:1600px] md:w-[108%] md:translate-x-0">
            <div
              className="absolute inset-0 [transform-style:preserve-3d]"
              style={{ transform: `rotateX(${TILT.x}deg) rotateZ(${TILT.z}deg)` }}
            >
              <svg
                viewBox={`${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}`}
                className="absolute inset-0 h-full w-full [mask-image:radial-gradient(closest-side,#000_62%,transparent_100%)]"
                preserveAspectRatio="xMidYMid slice"
              >
                <path d={map.layers.water} fill="#dfe5da" />
                <path d={map.layers.river} fill="none" stroke="#dfe5da" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
                <path d={map.layers.minor} fill="none" stroke="#c9ccb8" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <path d={map.layers.major} fill="none" stroke="#8f9884" strokeWidth={2.2} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                {routeD && (
                  <path key={a.id} d={routeD} fill="none" stroke="#a68150" strokeWidth={2.6} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="route-draw" />
                )}
              </svg>

              {/* The plot: a low golden block standing on the map. */}
              <div className="absolute [transform-style:preserve-3d]" style={{ left: `${(-BOX.x / BOX.w) * 100}%`, top: `${(-BOX.y / BOX.h) * 100}%`, transform: 'rotateZ(-13deg)' }}>
                <div className="absolute -left-[1.6rem] -top-[1.1rem] h-[2.2rem] w-[3.2rem] [transform-style:preserve-3d]">
                  <div className="absolute inset-0 bg-[#e4cfa3]" style={{ transform: 'translateZ(1.4rem)' }} />
                  <div className="absolute inset-x-0 bottom-0 h-[1.4rem] origin-bottom bg-[#c6a674]" style={{ transform: 'rotateX(-90deg)' }} />
                  <div className="absolute inset-y-0 right-0 w-[1.4rem] origin-right bg-[#b8955f]" style={{ transform: 'rotateY(90deg)' }} />
                </div>
              </div>

              {/* Anchors only: the browser projects them through the tilt, and the flat pins below follow them. */}
              <span data-anchor="home" className="absolute size-0" style={{ left: `${(-BOX.x / BOX.w) * 100}%`, top: `${(-BOX.y / BOX.h) * 100}%` }} />
              {items.map((it) => (
                <span key={it.id} data-anchor={it.id} className="absolute size-0" style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }} />
              ))}
            </div>
          </div>

          {/* Flat pins over the tilted map (pins inside the 3D plane get sliced by depth sorting). */}
          <div className="pointer-events-none absolute inset-0">
            {pins.home && (
              <div className="absolute -translate-x-1/2 -translate-y-full pb-6" style={{ left: pins.home[0], top: pins.home[1] }}>
                <div className="rounded-md bg-golden px-2.5 py-2 text-vanilla shadow-[0_10px_25px_-8px_rgb(0_0_0/0.35)]">
                  <Wordmark className="h-4 w-auto" />
                </div>
                <span className="absolute bottom-0 left-1/2 h-6 w-px bg-golden" />
              </div>
            )}
            {items.map((it) => {
              const p = pins[it.id];
              if (!p) return null;
              const on = active === it.id;
              return (
                <div key={it.id} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: p[0], top: p[1] }}>
                  <div className={`flex flex-col items-center transition-transform duration-500 ease-[var(--ease-avenue)] ${on ? '-translate-y-1.5 scale-110' : ''}`}>
                    <span
                      className={`mb-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-center text-[0.72rem] leading-tight transition-colors ${on ? 'bg-pine font-medium text-cream' : 'bg-vanilla/80 text-golden max-md:hidden'}`}
                    >
                      {it.off ? '↑ ' : ''}
                      {it.name}
                    </span>
                    <span className={`size-3 rounded-full transition-colors ${on ? 'bg-pine ring-4 ring-lime/70' : 'bg-golden'}`} />
                    <span className={`h-3 w-px ${on ? 'bg-pine' : 'bg-golden'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
