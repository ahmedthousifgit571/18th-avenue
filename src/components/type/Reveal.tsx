'use client';

import { useRef } from 'react';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { whenLoaded } from '@/lib/ready';

type Props = {
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  children: React.ReactNode;
  /** 'view' plays when the block reaches the viewport; 'load' when the intro curtain lifts. */
  on?: 'view' | 'load';
  delay?: number;
  stagger?: number;
  start?: string;
  id?: string;
};

/**
 * Plays the reference's entrance on everything marked inside it: [data-char] glyphs and [data-rise] words rise out
 * of their clipping boxes, [data-fade] blocks fade up. Hidden states come from CSS (html.js) so nothing flashes.
 */
export default function Reveal({ as: Tag = 'div', className = '', children, on = 'view', delay = 0, stagger, start = 'top 86%', id }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const chars = el.querySelectorAll('[data-char]');
        const rises = el.querySelectorAll('[data-rise]');
        const fades = el.querySelectorAll('[data-fade]');
        const tl = gsap.timeline({ paused: true, delay });
        // y: 0 in both states: GSAP would otherwise read the CSS start transform into `y` and leave it applied.
        if (chars.length) tl.fromTo(chars, { yPercent: 115, y: 0 }, { yPercent: 0, y: 0, duration: 1.25, ease: 'avenue', stagger: stagger ?? Math.min(0.035, 0.9 / chars.length) }, 0);
        if (rises.length) tl.fromTo(rises, { yPercent: 115, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, ease: 'avenue', stagger: stagger ?? Math.min(0.02, 0.7 / rises.length) }, 0.05);
        if (fades.length) tl.fromTo(fades, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: 'avenue', stagger: 0.08 }, 0.25);
        tl.eventCallback('onComplete', () => el.setAttribute('data-revealed', ''));
        if (on === 'load') return whenLoaded(() => tl.play());
        const st = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => tl.play() });
        return () => st.kill();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as never} className={className} data-reveal="" id={id}>
      {children}
    </Tag>
  );
}
