'use client';

import Image from 'next/image';
import { useRef } from 'react';
import Pill from '@/components/ui/Pill';
import FitText from '@/components/ui/FitText';
import Scramble from '@/components/type/Scramble';
import Reveal from '@/components/type/Reveal';
import WordFade from '@/components/type/WordFade';
import { Chars } from '@/components/type/Split';
import { rootsCopy } from '@/content/home';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

/**
 * The reference's navy "YOUR ROOTS" moment, for the development's signature: BUNGALOWS IN THE AIR across the full
 * width, the paragraph surfacing word by word, and a pane (the private lift foyer) turning slowly as it floats by.
 */
export default function Roots() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          '[data-pane]',
          { y: () => window.innerHeight * 0.35, rotationY: -28, rotationX: 14, rotationZ: -4, transformPerspective: 1100 },
          { y: () => -window.innerHeight * 0.3, rotationY: 14, rotationX: 2, rotationZ: 3, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative overflow-hidden bg-navy py-[10vh] text-cream" aria-labelledby="roots-title">
      <div className="wrap">
        <Scramble text={rootsCopy.kicker.toUpperCase()} className="t-kicker text-lime md:ml-[7.5vw]" />
        <Reveal as="h2" id="roots-title" className="mt-[3vh] font-serif uppercase leading-[0.82] text-cream-dark">
          <FitText as="span" className="block max-md:hidden" guessVw={9.6}>
            <Chars text={rootsCopy.title} />
          </FitText>
          <span className="md:hidden">
            <FitText as="span" className="block" guessVw={22}>
              <Chars text="Bungalows" />
            </FitText>
            <FitText as="span" className="block" guessVw={22}>
              <Chars text="in the air" />
            </FitText>
          </span>
        </Reveal>

        <div className="mt-[8vh] grid items-start gap-12 md:grid-cols-12">
          <div className="md:col-span-5 md:col-start-2">
            <WordFade text={rootsCopy.text} className="t-statement-sm text-cream" />
            <Pill href="/residences" className="mt-[6vh] text-cream">
              Explore residences
            </Pill>
          </div>
          <div className="relative md:col-span-4 md:col-start-8">
            <div data-pane className="card mx-auto w-[56vw] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] md:w-[19vw]" style={{ aspectRatio: 0.86 }}>
              <Image src={rootsCopy.card.src} alt="The private lift foyer of the show flat, artist’s impression" fill sizes="(min-width: 768px) 20vw, 56vw" className="object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
