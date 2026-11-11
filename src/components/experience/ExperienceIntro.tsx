'use client';

import { useRef } from 'react';
import FitText from '@/components/ui/FitText';
import Reveal from '@/components/type/Reveal';
import { Chars } from '@/components/type/Split';
import { useStageSection } from '@/lib/useStageSection';

/** Opening frame of the 3D page: the live site model behind a full-width "3D EXPERIENCE". */
export default function ExperienceIntro() {
  const ref = useRef<HTMLElement>(null);
  useStageSection(ref, 'hero', { startAtTop: true });

  return (
    <section ref={ref} data-tone="dark" className="on-dark pointer-events-none relative h-[118svh] text-cream" aria-labelledby="xp-title">
      <div className="sticky top-0 flex h-svh flex-col justify-end overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-pine-deep/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-pine-deep/80 via-pine-deep/30 to-transparent" />
        <div className="wrap relative pb-[7vh]">
          <Reveal on="load">
            <p data-fade className="t-kicker mb-5 text-lime">
              The live site model
            </p>
            <h1 id="xp-title" className="font-serif uppercase leading-[0.8] text-[#f6efdd]">
              <FitText as="span" className="block" guessVw={12}>
                <Chars text="3D Experience" />
              </FitText>
            </h1>
            <div data-fade className="mt-6 flex flex-wrap items-center justify-between gap-4 text-[0.72rem] uppercase tracking-[0.08em] text-cream/80">
              <span>Five towers on the real plot, Jalan Haji Basir, Bandar Seri Begawan</span>
              <span className="hidden md:inline">Scroll to explore · Drag to rotate</span>
              <span className="md:hidden">Scroll to explore · Swipe to turn</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
