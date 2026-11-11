'use client';

import { useEffect, useRef } from 'react';
import type { Clip } from '@/content/cinema';

type Props = {
  clip: Clip;
  className?: string;
  /** The hero starts loading at once; everything else waits until it nears the viewport. */
  eager?: boolean;
  label?: string;
};

/**
 * A muted, looping background film. It only plays while on screen (and not at all with reduced motion, where the
 * poster stays), so several loops on one page never decode at the same time.
 */
export default function Video({ clip, className = '', eager = false, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) return;
    let loaded = eager;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!loaded) {
            loaded = true;
            v.preload = 'auto';
            v.load();
          }
          v.play().catch(() => {});
        } else v.pause();
      },
      { rootMargin: '25% 0px 25% 0px' },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [eager]);

  return (
    <video
      ref={ref}
      className={className}
      poster={clip.poster}
      width={clip.width}
      height={clip.height}
      muted
      loop
      playsInline
      autoPlay={eager}
      preload={eager ? 'auto' : 'none'}
      disablePictureInPicture
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* AV1 Main, 10-bit: browsers without a decoder skip to the H.264 file. */}
      {clip.av1 && <source src={clip.av1} type='video/mp4; codecs="av01.0.08M.10"' />}
      <source src={clip.src} type="video/mp4" />
    </video>
  );
}
