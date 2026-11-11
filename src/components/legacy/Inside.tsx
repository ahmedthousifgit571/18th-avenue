'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { interiors } from '@/content/interiors';
import { media } from '@/content/media';
import { attractions } from '@/content/project';
import { layoutById, sqft } from '@/content/units';

const plan = media.plans['t5-gb'];
const layout = layoutById('t5-gb')!;

/**
 * A walk through the show flat: the client's interior renders on a horizontal track pinned to the scroll, with the
 * Type 5 Ground B plan (the plan these renders hang off on the live site) marking where you are standing.
 */
export default function Inside() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION_OK,
        () => {
          const t = track.current!;
          const dist = () => t.scrollWidth - window.innerWidth;
          gsap.fromTo(
            t,
            { x: 0 },
            {
              x: () => -dist(),
              ease: 'none',
              scrollTrigger: {
                trigger: ref.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.4,
                invalidateOnRefresh: true,
                onUpdate: (self) => setActive(Math.min(interiors.length - 1, Math.max(0, Math.round(self.progress * (interiors.length + 0.6) - 0.8)))),
              },
            },
          );
        },
        ref,
      );
      return () => mm.revert();
    },
    { scope: ref },
  );

  const ready = attractions.find((a) => a.title.startsWith('Ready'))!;

  return (
    <section ref={ref} className="relative z-[3] h-[460vh] bg-paper motion-reduce:h-auto" data-tone="light" aria-labelledby="inside-title">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:py-24">
        <div ref={track} className="flex w-max items-center gap-6 pl-[var(--gutter)] pr-[var(--gutter)] md:gap-10 motion-reduce:w-full motion-reduce:flex-wrap">
          {/* Intro panel */}
          <div className="flex w-[84vw] shrink-0 flex-col justify-center gap-8 md:w-[38vw]">
            <p className="eyebrow text-bronze">Inside the residence</p>
            <h2 id="inside-title" className="display h-lg">
              Ready to <em>move in.</em>
            </h2>
            <p className="body max-w-md">{ready.body}</p>
            <div className="flex items-end gap-6">
              <div className="relative w-56 shrink-0 md:w-64" style={{ aspectRatio: `${plan.width}/${plan.height}` }}>
                <Image src={plan.src} alt="Type 5 Ground B floor plan" fill sizes="256px" className="object-contain mix-blend-multiply" />
                {interiors.map((it, i) => (
                  <span
                    key={it.id}
                    className={`absolute grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-all duration-500 ${
                      active === i ? 'scale-125 bg-bronze ring-4 ring-champagne/50' : 'bg-ink/30'
                    }`}
                    style={{ left: `${it.at[0] * 100}%`, top: `${it.at[1] * 100}%` }}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-xs leading-relaxed text-mute">
                Show flat: {layout.type}
                <br />
                Tower 5, {layout.floors.replace(' (B)', '')}
                <br />
                {sqft(layout.area.gross)} sq ft · {layout.bedrooms}
              </p>
            </div>
          </div>

          {interiors.map((it, i) => {
            const m = media.flat[it.id];
            const portrait = m.height > m.width;
            return (
              <figure key={it.id} className={`relative shrink-0 ${portrait ? 'w-[64vw] md:w-[30vw]' : 'w-[84vw] md:w-[52vw]'}`}>
                <div className="relative overflow-hidden rounded-sm bg-sand" style={{ aspectRatio: portrait ? '4/5' : '4/3' }}>
                  <Image
                    src={m.src}
                    alt={`${it.caption}, artist's impression`}
                    fill
                    sizes={portrait ? '(min-width: 768px) 30vw, 64vw' : '(min-width: 768px) 52vw, 84vw'}
                    className={`object-cover transition-transform duration-[1400ms] ease-[var(--ease-avenue)] ${active === i ? 'scale-100' : 'scale-[1.06]'}`}
                  />
                </div>
                <figcaption className="mt-4 flex items-baseline justify-between gap-4">
                  <span className="flex items-baseline gap-3">
                    <span className="num text-mute">{String(i + 1).padStart(2, '0')}</span>
                    <span className="display text-2xl md:text-3xl">{it.caption}</span>
                  </span>
                  <span className="hidden text-right text-sm text-mute md:block">{it.line}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
