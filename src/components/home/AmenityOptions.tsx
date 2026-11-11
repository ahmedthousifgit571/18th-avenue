'use client';

import Image from 'next/image';
import { useState } from 'react';
import FitText from '@/components/ui/FitText';
import { amenityOptions } from '@/content/home';

/** The amenities as a serif list (italic when chosen) beside the matching room, under a cream AMENITIES. */
export default function AmenityOptions() {
  const [i, setI] = useState(0);
  const a = amenityOptions[i];

  return (
    <section className="relative grid bg-vanilla text-pine md:h-svh md:min-h-[42rem] md:grid-cols-2" aria-label="Facilities">
      <div className="wrap flex flex-col pb-10 pt-[12vh] md:pb-[6vh] md:pt-[5.5vh]">
        <ul role="list">
          {amenityOptions.map((x, k) => (
            <li key={x.name}>
              <button
                type="button"
                onClick={() => setI(k)}
                onMouseEnter={() => setI(k)}
                aria-pressed={i === k}
                className={`t-list text-left text-[clamp(2rem,3vw,3.9rem)] leading-[1.06] transition-[color,transform] duration-500 ease-[var(--ease-avenue)] ${i === k ? 'translate-x-1.5 italic text-pine' : 'text-golden/75 hover:text-golden'}`}
              >
                {x.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-12 border-t border-pine/20 pt-6 md:mt-auto" aria-live="polite">
          <p key={a.name} className="t-kicker text-[0.9rem] text-golden animate-[rise_0.6s_var(--ease-avenue)_both]">
            {a.name}
          </p>
          <p key={`t${a.name}`} className="t-statement-sm mt-3 max-w-[30rem] animate-[rise_0.6s_var(--ease-avenue)_0.04s_both]">
            {a.tagline}
          </p>
          <p key={`d${a.name}`} className="t-body mt-3 max-w-[30rem] text-pine/75 animate-[rise_0.6s_var(--ease-avenue)_0.08s_both]">
            {a.detail}
          </p>
        </div>
      </div>

      <div className="relative min-h-[70svh] overflow-hidden bg-pine md:min-h-0">
        {amenityOptions.map((x, k) => (
          <div
            key={x.name}
            className={`absolute inset-0 transition-[opacity,transform,clip-path] duration-[1100ms] ease-[var(--ease-avenue)] ${
              i === k ? 'scale-100 opacity-100 [clip-path:inset(0_0_0_0)]' : 'scale-[1.06] opacity-0 [clip-path:inset(0_0_0_18%)]'
            }`}
            aria-hidden={i !== k}
          >
            <Image src={x.img.src} alt={`${x.name}, artist’s impression`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/45 to-transparent" />
        <div className="absolute bottom-[4vh] right-[var(--gutter)] w-[64%] font-serif uppercase leading-[0.8] text-cream" aria-hidden>
          <FitText guessVw={6.5}>Amenities</FitText>
        </div>
      </div>
    </section>
  );
}
