'use client';

import Image from 'next/image';
import { useRef } from 'react';
import FitText from '@/components/ui/FitText';
import Reveal from '@/components/type/Reveal';
import { Chars } from '@/components/type/Split';
import { residencesCopy } from '@/content/home';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

/** "RESIDENCES" in golden capitals on draped cream silk, with a room of the show flat opening at the top left. */
export default function ResidencesIntro() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo('[data-silk]', { scale: 1.18, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
        const card = ref.current!.querySelector('[data-card]')!;
        gsap.fromTo(card, { clipPath: 'inset(100% 0% 0% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: ref.current, start: 'top 70%' } });
        gsap.fromTo(card.querySelector('img'), { scale: 1.35 }, { scale: 1, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: ref.current, start: 'top 70%' } });
        gsap.to(card, { yPercent: -18, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="residences" className="relative min-h-svh overflow-hidden bg-sand text-golden" aria-labelledby="residences-title">
      <div data-silk className="absolute inset-0">
        <Image src={residencesCopy.backdrop.src} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="wrap relative flex min-h-svh flex-col pb-[8vh] pt-[14vh] md:pt-0">
        <div data-card className="card w-[64vw] md:w-[30vw]" style={{ aspectRatio: 1.46 }}>
          <Image src={residencesCopy.card.src} alt="The living room of the show flat, artist’s impression" fill sizes="(min-width: 768px) 30vw, 64vw" className="object-cover" />
        </div>
        <Reveal as="h2" id="residences-title" className="mt-[7vh] font-serif uppercase leading-[0.8] text-golden md:w-[56vw]">
          <FitText as="span" className="block" guessVw={11.5}>
            <Chars text="Residences" />
          </FitText>
        </Reveal>
        <Reveal className="mt-auto pt-[10vh] md:ml-[31%] md:w-[38vw]">
          <p data-fade className="t-body text-golden">
            {residencesCopy.text}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
