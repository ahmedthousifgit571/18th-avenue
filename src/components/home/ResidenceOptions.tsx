'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Pill from '@/components/ui/Pill';
import Arrow from '@/components/ui/Arrow';
import FitText from '@/components/ui/FitText';
import { residenceOptions, showFlat } from '@/content/home';

/**
 * Split screen, as on the reference: the tower types as a serif list (the chosen one in italic) with the number of
 * homes and the layout facts, beside a slider of the show-flat rooms under a lime RESIDENCES.
 */
export default function ResidenceOptions() {
  const [type, setType] = useState(0);
  const [slide, setSlide] = useState(0);
  const o = residenceOptions[type];
  const pick = (i: number) => {
    setType(i);
    setSlide(i % showFlat.length);
  };
  const step = (d: number) => setSlide((s) => (s + d + showFlat.length) % showFlat.length);

  return (
    <section className="relative grid bg-vanilla text-pine md:h-svh md:min-h-[42rem] md:grid-cols-2" aria-label="Residence types">
      <div className="wrap flex flex-col pb-10 pt-[12vh] md:pb-[6vh] md:pt-[5.5vh]">
        <ul role="list">
          {residenceOptions.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => pick(i)}
                onMouseEnter={() => pick(i)}
                aria-pressed={type === i}
                className={`t-list text-left transition-[color,transform] duration-500 ease-[var(--ease-avenue)] ${type === i ? 'translate-x-1.5 italic text-pine' : 'text-golden/75 hover:text-golden'}`}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
        <Link href="/residences" className="link-u mt-6 self-start text-[0.72rem] text-pine">
          View all layouts
        </Link>

        <div className="mt-12 border-t border-pine/20 pt-6 md:mt-auto">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-end gap-4">
              <p key={o.id} className="t-num text-[clamp(3.6rem,5vw,5.6rem)] leading-[0.8] animate-[rise_0.6s_var(--ease-avenue)_both]">
                {o.homes}
              </p>
              <p className="pb-1 text-[0.85rem] leading-tight text-golden">
                homes
                <br />
                in Tower {o.id}
              </p>
            </div>
            <Pill href="#contact" className="text-pine">
              Submit a request
            </Pill>
          </div>
          <p key={`d${o.id}`} className="mt-5 text-[0.85rem] text-pine/75 animate-[rise_0.6s_var(--ease-avenue)_both]">
            {o.beds} · {o.sizes} · {o.floors}
          </p>
        </div>
      </div>

      <div className="relative min-h-[70svh] overflow-hidden bg-pine md:min-h-0">
        {showFlat.map((s, i) => (
          <div
            key={s.caption + i}
            className={`absolute inset-0 transition-[opacity,transform,clip-path] duration-[1100ms] ease-[var(--ease-avenue)] ${
              slide === i ? 'scale-100 opacity-100 [clip-path:inset(0_0_0_0)]' : 'scale-[1.06] opacity-0 [clip-path:inset(0_0_0_18%)]'
            }`}
            aria-hidden={slide !== i}
          >
            <Image src={s.img.src} alt={`${s.caption} of the show flat, artist’s impression`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/45 to-transparent" />
        <button type="button" onClick={() => step(-1)} className="absolute left-5 top-1/2 grid size-[3.2rem] -translate-y-1/2 place-items-center rounded-full bg-black/25 text-cream backdrop-blur transition-colors hover:bg-black/45" aria-label="Previous room">
          <Arrow direction="left" />
        </button>
        <button type="button" onClick={() => step(1)} className="absolute right-5 top-1/2 grid size-[3.2rem] -translate-y-1/2 place-items-center rounded-full bg-black/25 text-cream backdrop-blur transition-colors hover:bg-black/45" aria-label="Next room">
          <Arrow />
        </button>
        <p className="absolute left-6 top-6 text-[0.7rem] uppercase tracking-[0.08em] text-cream/85">
          Show flat · {showFlat[slide].caption} <span className="text-cream/55">· {String(slide + 1).padStart(2, '0')}/{String(showFlat.length).padStart(2, '0')}</span>
        </p>
        <div className="absolute bottom-[4vh] right-[var(--gutter)] w-[62%] font-serif uppercase leading-[0.8] text-lime" aria-hidden>
          <FitText guessVw={6.5}>Residences</FitText>
        </div>
      </div>
    </section>
  );
}
