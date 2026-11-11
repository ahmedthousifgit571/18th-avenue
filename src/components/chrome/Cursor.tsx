'use client';

import { useEffect, useRef } from 'react';
import { FINE_POINTER, gsap } from '@/lib/gsap';

const LABELS: Record<string, string> = { drag: 'Drag', view: 'View', play: 'Play', look: 'Drag to look' };

/** A soft champagne ring that follows the pointer and names what a drag or click will do. Fine pointers only. */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia(FINE_POINTER).matches) return;
    document.documentElement.classList.add('has-cursor');
    const el = ring.current!;
    const x = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
    let mode = '';
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      el.classList.add('is-live');
      x(e.clientX);
      y(e.clientY);
      const target = (e.target as Element | null)?.closest<HTMLElement>('[data-cursor], a, button, input[type=range], [role=button]');
      const next = target?.dataset.cursor ?? (target ? 'link' : '');
      if (next !== mode) {
        mode = next;
        el.dataset.mode = mode;
        if (label.current) label.current.textContent = LABELS[mode] ?? '';
      }
    };
    const down = () => el.classList.add('is-down');
    const up = () => el.classList.remove('is-down');
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <div ref={ring} className="cursor" aria-hidden>
      <span ref={label} className="cursor-label" />
    </div>
  );
}
