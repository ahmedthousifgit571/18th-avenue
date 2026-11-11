'use client';

import { useLayoutEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Font size before measuring, in vw (keeps the server render close to the fitted size). */
  guessVw: number;
  as?: 'h1' | 'h2' | 'p' | 'div' | 'span';
  /** Upper bound in px, so a very wide window doesn't blow the type up without limit. */
  max?: number;
};

/**
 * One line of display type stretched to the exact width of its container, like the reference's
 * "BELGRADE ARBOR" and "YOUR ROOTS". Re-fits on resize and once the web font has loaded.
 */
export default function FitText({ children, className = '', guessVw, as: Tag = 'div', max = 900 }: Props) {
  const box = useRef<HTMLElement>(null);
  const line = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = box.current;
    const span = line.current;
    if (!el || !span) return;
    const fit = () => {
      const w = el.clientWidth;
      if (!w) return;
      span.style.fontSize = '100px';
      // The span is inline-block, so its box is the text's own width (a block would report the container's).
      const natural = span.getBoundingClientRect().width;
      if (!natural) return;
      const size = Math.min(max, (100 * w) / natural);
      span.style.fontSize = `${size.toFixed(2)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    let alive = true;
    document.fonts?.ready.then(() => alive && fit());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [max]);

  return (
    <Tag ref={box as never} className={className}>
      <span ref={line} className="inline-block whitespace-nowrap" style={{ fontSize: `${guessVw}vw` }}>
        {children}
      </span>
    </Tag>
  );
}
