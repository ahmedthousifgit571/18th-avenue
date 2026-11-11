'use client';

import { useRef } from 'react';
import { gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';

type Props = {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  className?: string;
  children: React.ReactNode;
  /** 'load' plays once the page curtain lifts; 'scroll' plays when the text reaches the viewport. */
  on?: 'load' | 'scroll';
  delay?: number;
  stagger?: number;
};

/** Character-by-character rise, each line clipped (Still/Form's poetic headline reveal). */
export default function SplitReveal({ as: Tag = 'h2', className = '', children, on = 'scroll', delay = 0, stagger = 0.022 }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      const mm = gsap.matchMedia();
      mm.add(
        MOTION_OK,
        () => {
          const split = SplitText.create(el, { type: 'lines,chars', linesClass: 'split-line', charsClass: 'split-char', mask: 'lines', autoSplit: true });
          gsap.set(split.chars, { yPercent: 110, y: 0 });
          const play = () =>
            gsap.fromTo(split.chars, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.15, ease: 'avenue', stagger, delay });
          if (on === 'load') {
            const start = () => play();
            if (document.documentElement.classList.contains('is-loaded')) start();
            else {
              const obs = new MutationObserver(() => {
                if (document.documentElement.classList.contains('is-loaded')) {
                  obs.disconnect();
                  start();
                }
              });
              obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
              return () => obs.disconnect();
            }
          } else {
            ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: play });
          }
          return () => split.revert();
        },
        ref,
      );
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
