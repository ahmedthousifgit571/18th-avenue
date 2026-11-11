'use client';

import type Lenis from 'lenis';

/** The page's Lenis instance, for components that need to scroll programmatically. */
export const scroller: { lenis: Lenis | null } = { lenis: null };

export function scrollToY(y: number, opts: { duration?: number; immediate?: boolean } = {}) {
  if (scroller.lenis) scroller.lenis.scrollTo(y, { duration: opts.duration ?? 1.4, immediate: opts.immediate, lock: false, force: true });
  else window.scrollTo({ top: y, behavior: opts.immediate ? 'instant' : 'smooth' });
}

export function scrollToEl(el: Element | string, offset = 0) {
  const target = typeof el === 'string' ? document.querySelector(el) : el;
  if (!target) return;
  const y = target.getBoundingClientRect().top + window.scrollY + offset;
  scrollToY(y);
}
