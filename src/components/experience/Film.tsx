'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';
import { scroller } from '@/lib/scroller';

const EVENT = 'avenue:film';
export const openFilm = () => window.dispatchEvent(new Event(EVENT));

/** The developer's own film (encoded to 720p by scripts/make-film.mjs), in a full-screen player. */
export function FilmModal() {
  const [open, setOpen] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const v = video.current;
    scroller.lenis?.stop();
    close.current?.focus();
    v?.play().catch(() => {});
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      scroller.lenis?.start();
      v?.pause();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-night/95 p-4 backdrop-blur-sm md:p-10" role="dialog" aria-modal="true" aria-label="18th Avenue film">
      <button ref={close} type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 grid size-12 place-items-center rounded-full border border-ivory/40 text-ivory md:right-8 md:top-8">
        <X size={18} strokeWidth={1.4} />
        <span className="sr-only">Close film</span>
      </button>
      <video
        ref={video}
        src="/media/film/18th-avenue-720p.mp4"
        poster="/media/film/towers-poster.webp"
        controls
        playsInline
        preload="none"
        className="aspect-video max-h-full w-full max-w-6xl rounded-sm bg-black"
      />
    </div>
  );
}

export default function Film() {
  return (
    <section className="on-dark relative z-[3] bg-night text-ivory" data-tone="dark" aria-labelledby="film-title">
      <button type="button" onClick={openFilm} className="group relative block w-full overflow-hidden text-left" data-cursor="play">
        <div className="relative aspect-[4/5] w-full md:aspect-[21/9]">
          <Image src="/media/film/towers-poster.webp" alt="Still from the 18th Avenue film" fill sizes="100vw" className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-avenue)] group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-night/10" />
        </div>
        <div className="wrap absolute inset-x-0 bottom-0 flex flex-col gap-6 pb-10 md:flex-row md:items-end md:justify-between md:pb-16">
          <div>
            <p className="eyebrow mb-4 text-champagne">The film · 2 min 48 s</p>
            <h2 id="film-title" className="display h-lg max-w-[14ch]">
              Live where convenience <em>meets luxury.</em>
            </h2>
          </div>
          <span className="flex items-center gap-4">
            <span className="grid size-20 place-items-center rounded-full border border-ivory/50 transition-colors duration-500 group-hover:border-champagne group-hover:bg-champagne group-hover:text-ink md:size-24">
              <Play size={22} strokeWidth={1.3} />
            </span>
            <span className="eyebrow">Play film</span>
          </span>
        </div>
      </button>
    </section>
  );
}
