'use client';

import Image from 'next/image';
import { useState } from 'react';
import { amenities, facilities, type Amenity } from '@/content/amenities';
import { media } from '@/content/media';

const ZONES: { id: Amenity['zone'][]; label: string }[] = [
  { id: ['club', 'arrival'], label: 'Arrival & club' },
  { id: ['lagoon'], label: 'The lagoon' },
  { id: ['gardens'], label: 'Gardens & wellness' },
  { id: ['sport'], label: 'Sport & play' },
  { id: ['service'], label: 'Services' },
];

const photoOf = (key: string) => (key === 'foyer' ? media.flat.foyer : media.facilities[key as keyof typeof media.facilities]);

export default function Amenities() {
  const [hot, setHot] = useState<string | null>(null);
  const active = amenities.find((a) => a.key === hot);
  const plan = media.plans['site-layout'];

  return (
    <section id="amenities" className="relative z-[3] bg-ivory py-24 md:py-36" data-tone="light" aria-labelledby="amenities-title">
      <div className="wrap">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow mb-5 text-bronze">Facilities & services</p>
            <h2 id="amenities-title" className="display h-lg">
              Resort-like living, <em>at home.</em>
            </h2>
          </div>
          <p className="body md:col-span-5">
            Experience the modern convenience with our state-of-the-art facilities and services: a clubhouse, a lagoon
            pool with glass pavilions, gardens for every hour and a tennis court above the shops. Every detail is
            designed for your comfort and well-being.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          {/* The site plan with live markers */}
          <div className="relative lg:col-span-8">
            <div className="relative overflow-hidden rounded-md bg-sand" style={{ aspectRatio: `${plan.width}/${plan.height}` }}>
              <Image src="/media/textures/ground.webp" alt="18th Avenue site plan, artist's impression" fill sizes="(min-width: 1024px) 64vw, 100vw" className="object-cover" />
              {amenities.flatMap((a) =>
                a.at.map(([x, y], i) => (
                  <button
                    key={`${a.key}-${i}`}
                    type="button"
                    onPointerEnter={() => setHot(a.key)}
                    onPointerLeave={() => setHot(null)}
                    onFocus={() => setHot(a.key)}
                    onBlur={() => setHot(null)}
                    onClick={() => setHot(hot === a.key ? null : a.key)}
                    className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-sans font-semibold transition-all duration-300 ${
                      /^\d/.test(a.key) ? 'bg-champagne text-ink' : 'bg-ink text-ivory'
                    } ${hot === a.key ? 'z-10 size-8 text-xs ring-4 ring-white/70' : 'size-5 text-[0.55rem] md:size-6 md:text-[0.625rem]'}`}
                    style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                    aria-label={`${a.key}: ${a.name}`}
                  >
                    {a.key}
                  </button>
                )),
              )}
              {active && (
                <div
                  className="pointer-events-none absolute z-20 w-44 -translate-x-1/2 overflow-hidden rounded-md bg-paper shadow-xl animate-[rise_0.4s_var(--ease-avenue)_both] md:w-52"
                  style={{ left: `${Math.min(86, Math.max(14, active.at[0][0] * 100))}%`, top: `${active.at[0][1] * 100}%`, transform: `translate(-50%, ${active.at[0][1] > 0.55 ? 'calc(-100% - 22px)' : '22px'})` }}
                >
                  {active.photo && (
                    <div className="relative aspect-[4/3]">
                      <Image src={photoOf(active.photo).src} alt="" fill sizes="208px" className="object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-serif text-lg leading-tight">{active.name}</p>
                    {active.detail && <p className="mt-1 text-xs text-mute">{active.detail.join(' · ')}</p>}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-mute">Site plan by Surbana Jurong. Artist’s impression; subject to change.</p>
          </div>

          {/* Legend */}
          <div className="lg:col-span-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
              {ZONES.map((z) => (
                <div key={z.label}>
                  <p className="eyebrow mb-3 text-bronze">{z.label}</p>
                  <ul className="grid grid-cols-1 gap-1">
                    {amenities
                      .filter((a) => z.id.includes(a.zone))
                      .map((a) => (
                        <li key={a.key}>
                          <button
                            type="button"
                            onPointerEnter={() => setHot(a.key)}
                            onPointerLeave={() => setHot(null)}
                            onFocus={() => setHot(a.key)}
                            onBlur={() => setHot(null)}
                            className={`flex w-full items-center gap-3 py-1 text-left text-sm transition-colors ${hot === a.key ? 'text-ink' : 'text-ink-soft'}`}
                          >
                            <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[0.55rem] font-semibold ${/^\d/.test(a.key) ? 'bg-champagne text-ink' : 'bg-ink text-ivory'}`}>{a.key}</span>
                            <span className={hot === a.key ? 'underline decoration-champagne underline-offset-4' : ''}>{a.name}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Facilities & Services cards (live taglines) */}
      <div className="mt-24 md:mt-32">
        <div className="wrap mb-8 flex items-end justify-between">
          <h3 className="display h-sm">Modern facilities & services</h3>
          <p className="eyebrow hidden text-mute md:block">Scroll sideways →</p>
        </div>
        <ul className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] pb-4">
          {facilities.map((f, i) => {
            const m = photoOf(f.photo);
            return (
              <li key={f.name} className="group w-[72vw] shrink-0 snap-start sm:w-[44vw] md:w-[30vw] lg:w-[22vw]">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand">
                  <Image src={m.src} alt={`${f.name}, artist's impression`} fill sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 72vw" className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-avenue)] group-hover:scale-105" />
                  <span className="num absolute left-4 top-3 text-lg text-white/90 drop-shadow">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <p className="mt-4 text-sm text-mute">{f.tagline}</p>
                <p className="mt-1 font-serif text-2xl">{f.name}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
