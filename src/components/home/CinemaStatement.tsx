'use client';

import Image from 'next/image';
import { useRef } from 'react';
import Video from '@/components/ui/Video';
import Reveal from '@/components/type/Reveal';
import { Chars } from '@/components/type/Split';
import type { Clip } from '@/content/cinema';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

type Props = {
  id: string;
  clip: Clip;
  clipLabel: string;
  /** `position` is the CSS object-position for the cover crop (default centre). */
  card: { src: string; alt: string; position?: string };
  title: string[];
  text: string;
  /** 'retail': title top left, copy bottom left, card bottom right. 'amenities': card top left, copy bottom left, title bottom right. */
  layout: 'retail' | 'amenities';
  tint?: string;
};

/**
 * The reference's full-bleed film statements ("OFFICE SPACES AND RETAILS", "AMENITIES"): a moving backdrop, an
 * inset photograph that drifts against the scroll, a short paragraph and capitals that rise letter by letter.
 */
export default function CinemaStatement({ id, clip, clipLabel, card, title, text, layout, tint = 'from-black/55 via-black/20 to-black/30' }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo('[data-film]', { yPercent: -10, scale: 1.12 }, { yPercent: 10, scale: 1, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo('[data-card]', { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo('[data-card] img', { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: ref.current, start: 'top 65%' } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const retail = layout === 'retail';
  const heading = (
    <Reveal as="h2" className={`t-title text-cream-dark ${retail ? 'text-[clamp(3.2rem,8.3vw,11rem)]' : 'text-[clamp(3.6rem,9.6vw,12.5rem)] md:text-right'}`}>
      {title.map((line, i) => (
        <span key={i} className="block">
          <Chars text={line} />
        </span>
      ))}
    </Reveal>
  );

  return (
    <section ref={ref} id={id} className="relative min-h-[112svh] overflow-hidden bg-pine-deep text-cream" aria-label={title.join(' ')}>
      <div data-film className="absolute inset-0">
        <Video clip={clip} className="cover" label={clipLabel} />
      </div>
      <div className={`absolute inset-0 bg-linear-to-t ${tint}`} />

      <div className="wrap relative flex min-h-[112svh] flex-col pb-[8vh] pt-[13vh]">
        {retail ? (
          heading
        ) : (
          <div data-card className="card w-[62vw] md:w-[30vw]" style={{ aspectRatio: 1.43 }}>
            <Image src={card.src} alt={card.alt} fill sizes="(min-width: 768px) 30vw, 62vw" className="object-cover" />
          </div>
        )}

        <div className="mt-auto grid items-end gap-10 pt-[12vh] md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p data-fade className="t-body max-w-[23rem] text-cream">
              {text}
            </p>
          </Reveal>
          {retail ? (
            <div data-card className="card w-[70vw] justify-self-end md:col-span-5 md:col-start-8 md:w-full" style={{ aspectRatio: 1.43 }}>
              <Image src={card.src} alt={card.alt} fill sizes="(min-width: 768px) 32vw, 70vw" className="object-cover" style={{ objectPosition: card.position }} />
            </div>
          ) : (
            <div className="md:col-span-8">{heading}</div>
          )}
        </div>
      </div>
    </section>
  );
}
