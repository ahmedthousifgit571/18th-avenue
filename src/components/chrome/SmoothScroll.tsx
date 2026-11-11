'use client';

import { useEffect, useRef } from 'react';
import { ReactLenis, useLenis, type LenisRef } from 'lenis/react';
import { gsap, MOTION_OK, ScrollTrigger } from '@/lib/gsap';
import { scroller } from '@/lib/scroller';

function Bridge() {
  const lenis = useLenis(ScrollTrigger.update);
  useEffect(() => {
    scroller.lenis = lenis ?? null;
    // Development only: lets browser test scripts jump to sections.
    if (process.env.NODE_ENV === 'development') (window as unknown as { __lenis?: unknown }).__lenis = lenis;
  }, [lenis]);
  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<LenisRef>(null);

  useEffect(() => {
    // Pages without the home page's intro curtain are ready at once ("load" reveals wait for this class). Child
    // effects run first, so on Home the curtain is already in the DOM here and keeps control.
    if (!document.querySelector('[data-preloader]')) document.documentElement.classList.add('is-loaded');
    const tick = (time: number) => ref.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    let cancelled = false;
    // Web fonts change text metrics, which moves every trigger below the fold.
    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh());
    return () => {
      cancelled = true;
      gsap.ticker.remove(tick);
    };
  }, []);

  const smoothWheel = typeof window === 'undefined' || window.matchMedia(MOTION_OK).matches;

  return (
    <ReactLenis root ref={ref} options={{ autoRaf: false, lerp: 0.085, smoothWheel, anchors: { offset: 0 } }}>
      <Bridge />
      {children}
    </ReactLenis>
  );
}
