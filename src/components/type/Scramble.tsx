'use client';

import { useEffect, useRef } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

type Props = {
  text: string;
  className?: string;
  /** Start when told to (a parent timeline), instead of when scrolled into view. */
  play?: boolean;
  as?: 'p' | 'span' | 'div';
};

/**
 * The reference's kicker reveal: letters arrive left to right, each cycling through random glyphs before it
 * settles. The full text is in the DOM from the start (for layout and screen readers); only its glyphs change.
 */
export default function Scramble({ text, className = '', play, as: Tag = 'p' }: Props) {
  const ref = useRef<HTMLElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let raf = 0;
    const run = () => {
      if (done.current) return;
      done.current = true;
      const t0 = performance.now();
      const per = 32; // ms between letters starting
      const settle = 260; // ms each letter scrambles
      const tick = (now: number) => {
        const t = now - t0;
        let out = '';
        let finished = true;
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          const local = t - i * per;
          if (c === ' ' || local >= settle) out += c;
          else if (local < 0) {
            out += ' ';
            finished = false;
          } else {
            out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            finished = false;
          }
        }
        el.textContent = out;
        if (!finished) raf = requestAnimationFrame(tick);
        else el.textContent = text;
      };
      raf = requestAnimationFrame(tick);
    };
    if (play === undefined) {
      el.style.opacity = '1';
      const st = ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: run });
      return () => {
        st.kill();
        cancelAnimationFrame(raf);
      };
    }
    if (play) run();
    return () => cancelAnimationFrame(raf);
  }, [play, text]);

  // Driven by a parent: stay invisible (but keep the line's space) until told to play, so the full text never
  // flashes before the scramble starts.
  return (
    <Tag ref={ref as never} className={`${className} ${play === false ? 'motion-safe:opacity-0' : ''}`} aria-label={text}>
      {text}
    </Tag>
  );
}
