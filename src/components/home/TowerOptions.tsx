'use client';

import Image from 'next/image';
import { useState } from 'react';
import Pill from '@/components/ui/Pill';
import Reveal from '@/components/type/Reveal';
import { Chars } from '@/components/type/Split';
import { towerOptions } from '@/content/home';
import { clips } from '@/content/cinema';
import footprints from '@/three/site/footprints.json';

// Mini key plan: the nine tower wings and the plot boundary, traced from the client's site plan (metres).
const xs = footprints.plot.map((p) => p[0]);
const ys = footprints.plot.map((p) => p[1]);
const PAD = 6;
const VB = [Math.min(...xs) - PAD, Math.min(...ys) - PAD, Math.max(...xs) - Math.min(...xs) + PAD * 2, Math.max(...ys) - Math.min(...ys) + PAD * 2];
const poly = (pts: number[][]) => pts.map((p) => p.join(',')).join(' ');

/**
 * The reference's business-wings picker, for the five towers: a full-height film still with THE TOWERS on the
 * left; on pine, the tower list (italic lime when chosen), its homes and layouts, and where it stands on the plot.
 */
export default function TowerOptions() {
  const [t, setT] = useState(0);
  const o = towerOptions[t];

  return (
    <section className="relative grid md:h-svh md:min-h-[44rem] md:grid-cols-2" aria-label="The five towers">
      <div className="relative min-h-[75svh] overflow-hidden bg-pine md:min-h-0">
        <Image src={clips.hero.poster} alt="The towers from the street, from the developer’s film" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[38%_50%]" />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/10" />
        <Reveal as="h2" className="t-title absolute bottom-[7vh] left-[var(--gutter)] text-[clamp(3.4rem,6.6vw,8.6rem)] text-cream">
          <span className="block">
            <Chars text="Five" />
          </span>
          <span className="block">
            <Chars text="Towers" />
          </span>
        </Reveal>
      </div>

      <div className="bg-pine-glow wrap relative flex flex-col overflow-hidden pb-10 pt-12 text-cream md:pb-[6vh] md:pl-[6vw] md:pt-[5.5vh]">
        <div className="light-beams opacity-70" aria-hidden />
        <ul role="list" className="relative">
          {towerOptions.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => setT(i)}
                onMouseEnter={() => setT(i)}
                aria-pressed={t === i}
                className={`t-list text-left text-[clamp(2rem,3vw,3.9rem)] leading-[1.04] transition-[color,transform] duration-500 ease-[var(--ease-avenue)] ${t === i ? 'translate-x-1.5 italic text-lime' : 'text-cream hover:text-cream-dark'}`}
              >
                {x.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="relative mt-12 grid gap-6 border-t border-cream/20 pt-6 md:mt-auto md:grid-cols-[1fr_auto]">
          <div>
            <p key={o.id} className="t-statement-sm text-cream-dark animate-[rise_0.6s_var(--ease-avenue)_both]">
              {o.homes} residences, {o.perFloor === 1 ? 'one' : 'two'} per floor
            </p>
            <p key={`t${o.id}`} className="t-body mt-3 max-w-[30rem] text-cream/85 animate-[rise_0.6s_var(--ease-avenue)_0.05s_both]">
              {o.text}
            </p>
            <Pill href={`/residences?tower=${o.id}`} className="mt-8 text-cream">
              Find out more
            </Pill>
          </div>
          <svg viewBox={VB.join(' ')} className="w-[min(46vw,13rem)] self-end justify-self-end" aria-label={`Tower ${o.id} on the site plan`} role="img">
            <polygon points={poly(footprints.plot)} fill="none" stroke="rgb(255 244 214 / 0.35)" strokeWidth={0.6} strokeDasharray="2 1.6" />
            {footprints.wings.map((w, i) => (
              <polygon
                key={i}
                points={poly(w.poly)}
                fill={w.tower === o.id ? '#e7fd55' : 'rgb(255 244 214 / 0.16)'}
                stroke={w.tower === o.id ? '#e7fd55' : 'rgb(255 244 214 / 0.3)'}
                strokeWidth={0.4}
                className="transition-[fill] duration-500"
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
