'use client';

import { useRef } from 'react';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { Words } from './Split';

type Props = {
  text: string;
  className?: string;
  as?: 'p' | 'h2' | 'div';
  start?: string;
  end?: string;
};

/**
 * Words surface one by one as the paragraph scrolls through the viewport: each fades in from a soft blur and settles
 * from a slight offset (the reference's "evolves alongside you" lines).
 */
export default function WordFade({ text, className = '', as: Tag = 'p', start = 'top 82%', end = 'bottom 45%' }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const words = ref.current!.querySelectorAll('[data-word]');
        gsap.fromTo(
          words,
          { opacity: 0.08, filter: 'blur(8px)', yPercent: 18 },
          {
            opacity: 1,
            filter: 'blur(0px)',
            yPercent: 0,
            ease: 'none',
            stagger: 0.06,
            scrollTrigger: { trigger: ref.current, start, end, scrub: 0.8 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref as never} className={className}>
      <Words text={text} />
    </Tag>
  );
}
