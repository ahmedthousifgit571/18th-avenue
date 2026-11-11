'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { prefersReducedMotion } from '@/lib/gsap';

/** Counts up to `value` (anime.js) the first time it scrolls into view. Renders the final value for no-JS/SEO. */
export default function Counter({ value, decimals = 0, className = '', duration = 1800 }: { value: number; decimals?: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (prefersReducedMotion()) return;
    const fmt = (n: number) => n.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    el.textContent = fmt(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const o = { v: 0 };
        animate(o, { v: value, duration, ease: 'outExpo', onUpdate: () => (el.textContent = fmt(o.v)) });
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, decimals, duration]);
  return (
    <span ref={ref} className={className}>
      {value.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}
