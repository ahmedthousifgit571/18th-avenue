'use client';

import Image from 'next/image';
import { useRef } from 'react';
import Video from '@/components/ui/Video';
import FitText from '@/components/ui/FitText';
import { Letters, Words } from '@/components/type/Split';
import { clips } from '@/content/cinema';
import { locationCopy } from '@/content/home';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

/**
 * The reference's Location moment, pinned: the film opens out from a framed pane to full bleed, a photograph rises
 * at the top left, the paragraph surfaces word by word and LOCATION condenses letter by letter out of a blur.
 */
export default function LocationScene() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: '(min-width: 768px)', motion: MOTION_OK }, (ctx) => {
        const { desktop, motion } = ctx.conditions as { desktop: boolean; motion: boolean };
        if (!motion) return;
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 1 },
        });
        tl.set({}, {}, 10);
        tl.fromTo(
          '[data-frame]',
          { clipPath: desktop ? 'inset(12% 30% 12% 4% round 22px)' : 'inset(18% 6% 30% 6% round 18px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 3.6, ease: 'power2.inOut' },
          0,
        );
        tl.fromTo('[data-film]', { scale: 1.35 }, { scale: 1, duration: 4.5, ease: 'power1.out' }, 0);
        tl.fromTo('[data-shade]', { opacity: 0 }, { opacity: 1, duration: 2 }, 2);
        tl.fromTo('[data-photo]', { y: () => window.innerHeight * 0.7, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 3, ease: 'power2.out' }, 2.4);
        tl.to('[data-photo]', { y: () => -window.innerHeight * 0.12, duration: 4.6 }, 5.4);
        tl.fromTo('[data-word]', { opacity: 0.12, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.5, stagger: 0.09 }, 3.2);
        tl.fromTo(
          '[data-letter]',
          { opacity: 0, filter: 'blur(18px)', yPercent: 18 },
          { opacity: 1, filter: 'blur(0px)', yPercent: 0, duration: 1.1, stagger: 0.22, ease: 'power2.out' },
          4.6,
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="location" className="relative h-[250vh] bg-vanilla" aria-label="Location">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div data-frame className="absolute inset-0 overflow-hidden">
          <div data-film className="absolute inset-0">
            <Video clip={clips.location} className="cover" label="An aerial orbit around the towers and their neighbourhood, from the developer's film" />
          </div>
          <div data-shade className="absolute inset-0 bg-linear-to-t from-black/50 via-black/15 to-black/25" />
        </div>

        <div data-photo className="card absolute left-[var(--gutter)] top-[8vh] w-[58vw] md:top-0 md:w-[30vw]" style={{ aspectRatio: 1.45 }}>
          <Image src={locationCopy.card.src} alt="Taman Mahkota Jubli Emas and the Omar Ali Saifuddien Mosque" fill sizes="(min-width: 768px) 30vw, 58vw" className="object-cover" />
        </div>

        {/*
          The paragraph rides directly above LOCATION in one bottom-anchored column. LOCATION is sized by width, so on
          wide, short windows it grows tall; a paragraph placed at a fixed height would run into it.
        */}
        <div className="absolute bottom-[6vh] left-[var(--gutter)] right-[var(--gutter)] flex flex-col md:left-auto md:w-[56vw]">
          {/* md: 38% of the 56vw column puts the paragraph's left edge where it sat before (about 61% across). */}
          <p className="mb-[4.5vh] max-w-[25rem] text-[0.95rem] leading-[1.42] text-vanilla md:ml-[38%] md:w-[46%] md:max-w-none">
            <Words text={locationCopy.text} />
          </p>
          <h2 className="font-serif uppercase leading-[0.8] text-cream-dark">
            <FitText as="span" className="block" guessVw={11}>
              <Letters text="Location" />
            </FitText>
          </h2>
        </div>
      </div>
    </section>
  );
}
