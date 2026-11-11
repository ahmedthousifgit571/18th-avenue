'use client';

import { useRef } from 'react';
import Video from '@/components/ui/Video';
import FitText from '@/components/ui/FitText';
import Reveal from '@/components/type/Reveal';
import { Chars } from '@/components/type/Split';
import { clips } from '@/content/cinema';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { whenLoaded } from '@/lib/ready';

/**
 * The reference's opening frame: the building on film, edge to edge, with the name set across the full width at
 * its foot. The film settles in as the intro sketch fades, and drifts slower than the page as you scroll away.
 */
export default function Hero() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const media = ref.current!.querySelector('[data-media]');
        // A gentle settle: a bigger start scale upsamples the 1080p film enough to look soft while it eases in.
        gsap.set(media, { scale: 1.08 });
        const stop = whenLoaded(() => gsap.to(media, { scale: 1, duration: 2.4, ease: 'expo.out' }));
        gsap.to('[data-drift]', {
          yPercent: 22,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.to('[data-title]', {
          yPercent: -35,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
        });
        return stop;
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative h-svh min-h-[34rem] overflow-hidden bg-pine-deep text-cream" aria-label="18th Avenue">
      <div data-drift className="absolute inset-0">
        <div data-media className="absolute inset-0">
          <Video clip={clips.hero} eager className="cover" label="The 18th Avenue towers from the street, from the developer's film" />
        </div>
      </div>
      {/* Fine moving grain: makes the rendered film read as cinematic rather than compressed. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="film-grain" />
      </div>
      {/* Legibility veils: a soft dark sky at the top for the header, deeper at the foot for the name. */}
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[52%] bg-linear-to-t from-black/50 via-black/15 to-transparent" />

      <div data-title className="wrap absolute inset-x-0 bottom-0 pb-[6.5vh] md:pb-[7.5vh]">
        <Reveal on="load" delay={0.15}>
          <h1 className="sr-only">18th Avenue, Bandar Seri Begawan</h1>
          <FitText guessVw={13.5} className="hidden font-serif uppercase leading-[0.78] text-[#f6efdd] md:block" max={420}>
            <Chars text="18th Avenue" />
          </FitText>
          <div className="font-serif uppercase leading-[0.8] text-[#f6efdd] md:hidden">
            <FitText guessVw={30}>
              <Chars text="18th" />
            </FitText>
            <FitText guessVw={24}>
              <Chars text="Avenue" />
            </FitText>
          </div>
          <div data-fade className="mt-5 flex items-center justify-between gap-6 text-[0.72rem] uppercase tracking-[0.08em] text-cream/80 md:mt-6">
            <span>Bandar Seri Begawan · Brunei Darussalam</span>
            <span className="hidden items-center gap-3 md:flex">
              Scroll to discover
              <span className="relative block h-8 w-px overflow-hidden bg-cream/25">
                <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_var(--ease-avenue-in-out)_infinite] bg-cream" />
              </span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
