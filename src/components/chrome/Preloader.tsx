'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { scroller } from '@/lib/scroller';

// The five towers in elevation, roughly as they stand on the site plan (x, width, height in a 1000 x 620 frame).
const TOWERS = [
  { x: 128, w: 118, h: 372 },
  { x: 282, w: 104, h: 418 },
  { x: 418, w: 132, h: 462 },
  { x: 586, w: 98, h: 404 },
  { x: 716, w: 140, h: 336 },
];
const GROUND = 548;

type Line = { d: string; delay: number; dur: number; w?: number; o?: number };

/** Architect's pencil lines: every stroke overshoots its corner a little, as in a hand sketch. */
function sketch(): Line[] {
  const lines: Line[] = [{ d: `M40 ${GROUND + 1} L960 ${GROUND - 1}`, delay: 0, dur: 1.2, w: 1.1, o: 0.9 }];
  TOWERS.forEach((t, i) => {
    const top = GROUND - t.h;
    const base = 0.25 + i * 0.12;
    const o = 7; // overshoot
    lines.push({ d: `M${t.x} ${GROUND + o} L${t.x + 0.6} ${top - o}`, delay: base, dur: 1.1, w: 1 });
    lines.push({ d: `M${t.x + t.w} ${GROUND + o} L${t.x + t.w - 0.5} ${top - o}`, delay: base + 0.08, dur: 1.1, w: 1 });
    lines.push({ d: `M${t.x - o} ${top} L${t.x + t.w + o} ${top + 0.4}`, delay: base + 0.5, dur: 0.6, w: 1 });
    // Crown and core.
    lines.push({ d: `M${t.x + t.w * 0.18} ${top} L${t.x + t.w * 0.18} ${top - 16} L${t.x + t.w * 0.62} ${top - 16} L${t.x + t.w * 0.62} ${top}`, delay: base + 0.75, dur: 0.6, w: 0.8, o: 0.7 });
    lines.push({ d: `M${t.x + t.w / 2} ${GROUND} L${t.x + t.w / 2 + 0.4} ${top}`, delay: base + 0.55, dur: 0.9, w: 0.6, o: 0.45 });
    // Floor lines, drawn quickly from the ground up.
    const floors = 17;
    for (let f = 1; f < floors; f++) {
      const y = GROUND - (t.h / floors) * f;
      if (f % 2 && i % 2) continue;
      lines.push({ d: `M${t.x} ${y} L${t.x + t.w} ${y + (f % 3) * 0.3}`, delay: base + 0.45 + f * 0.035, dur: 0.45, w: 0.55, o: 0.5 });
    }
  });
  // A few trees at the foot.
  [70, 264, 400, 566, 700, 890].forEach((x, i) => {
    const r = 16 + (i % 3) * 5;
    lines.push({
      d: `M${x} ${GROUND} L${x} ${GROUND - r} M${x - r} ${GROUND - r} Q${x - r} ${GROUND - r * 2.3} ${x} ${GROUND - r * 2.2} Q${x + r} ${GROUND - r * 2.3} ${x + r} ${GROUND - r} Q${x} ${GROUND - r * 0.6} ${x - r} ${GROUND - r}`,
      delay: 1.0 + i * 0.07,
      dur: 0.9,
      w: 0.7,
      o: 0.6,
    });
  });
  return lines;
}
const LINES = sketch();


/**
 * The opening curtain: on vanilla paper, the five towers are sketched in fine pencil lines (the reference opens the
 * same way), then the paper fades and the film settles in. It also waits for the fonts and the hero film's first
 * frame, capped so it never holds anyone up for long. Client-side returns to Home skip it.
 */
export default function Preloader() {
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    // `is-loaded` is only set once a curtain has lifted, so client-side returns to Home skip it. (No module-level
    // "played" flag: StrictMode runs this effect twice in development, and the second run must start cleanly.)
    if (html.classList.contains('is-loaded')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- skipping the curtain on client-side returns
      setGone(true);
      return;
    }
    // Keep the pencil lines about 1px on screen whatever the drawing's size (stroke widths are in viewBox units).
    const svg = root.current?.querySelector('svg');
    if (svg) svg.style.setProperty('--k', String(1000 / Math.max(1, svg.clientWidth)));
    html.classList.add('is-loading');
    scroller.lenis?.stop();
    window.scrollTo(0, 0);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    const minTime = reduce ? 200 : 2600;
    const video = document.querySelector<HTMLVideoElement>('video');
    let videoReady = !video || video.readyState >= 2;
    const onReady = () => (videoReady = true);
    video?.addEventListener('loadeddata', onReady, { once: true });

    let raf = 0;
    let lifted = false;
    let tl: gsap.core.Timeline | null = null;
    const check = () => {
      const t = performance.now() - t0;
      const fonts = !document.fonts || document.fonts.status === 'loaded';
      if (!lifted && t > minTime && ((fonts && videoReady) || t > 5500)) {
        lifted = true;
        const el = root.current!;
        tl = gsap.timeline({
          onComplete: () => {
            setGone(true);
          },
        });
        tl.to(el.querySelector('svg'), { scale: 1.06, opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
          .to(el, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 0.35)
          .add(() => {
            html.classList.remove('is-loading');
            html.classList.add('is-loaded');
            scroller.lenis?.start();
          }, 0.45);
        return;
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => {
      cancelAnimationFrame(raf);
      tl?.kill();
      video?.removeEventListener('loadeddata', onReady);
      if (!html.classList.contains('is-loaded')) {
        html.classList.remove('is-loading');
        scroller.lenis?.start();
      }
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} data-preloader className="fixed inset-0 z-[80] grid place-items-center bg-vanilla text-pine" aria-hidden>
      <svg viewBox="0 0 1000 620" className="sketch w-[min(78vw,64rem)] overflow-visible" fill="none" stroke="currentColor" strokeLinecap="round">
        {LINES.map((l, i) => (
          <path
            key={i}
            d={l.d}
            pathLength={1}
            opacity={l.o ?? 0.85}
            style={{ '--delay': `${l.delay}s`, '--d': `${l.dur}s`, strokeWidth: `calc(${l.w ?? 1}px * var(--k, 1))` } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
