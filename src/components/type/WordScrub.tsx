'use client';

import { useRef } from 'react';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

/** Words brighten one by one as the paragraph scrolls through the viewport. */
export default function WordScrub({ text, className = '', as: Tag = 'p' }: { text: string; className?: string; as?: 'p' | 'h2' }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION_OK,
        () => {
          const words = ref.current!.querySelectorAll('.w');
          gsap.fromTo(
            words,
            { opacity: 0.16 },
            { opacity: 1, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: ref.current, start: 'top 78%', end: 'bottom 42%', scrub: 0.6 } },
          );
        },
        ref,
      );
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref as never} className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="w">
          {w}{' '}
        </span>
      ))}
    </Tag>
  );
}
