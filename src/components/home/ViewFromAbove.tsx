'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Letters } from '@/components/type/Split';
import { textures } from '@/content/cinema';
import { amenities } from '@/content/amenities';
import footprints from '@/three/site/footprints.json';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

const { width: W, height: H } = textures.aerial;
// Tower numbers sit on each tower's wings (footprints are metres from the drawing's centre, 12.4 px/m).
const towers = [1, 2, 3, 4, 5].map((t) => {
  const ws = footprints.wings.filter((w) => w.tower === t);
  const cx = ws.reduce((s, w) => s + w.centre[0], 0) / ws.length;
  const cy = ws.reduce((s, w) => s + w.centre[1], 0) / ws.length;
  return { t, x: (W / 2 + cx * footprints.pxPerM) / W, y: (H / 2 + cy * footprints.pxPerM) / H };
});
const LABELS = ['1', '12', '18', 'B'].map((k) => amenities.find((a) => a.key === k)!);

/**
 * The reference's "VIEW FROM ABOVE": pinned, the camera pans across the client's site plan while cloud banks part,
 * the title dissolves letter by letter into a blur, and the tower numbers and a few landmarks of the plan appear.
 */
export default function ViewFromAbove() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const plane = ref.current!.querySelector<HTMLElement>('[data-plane]')!;
        const travel = () => Math.max(0, plane.offsetWidth - window.innerWidth);
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
        });
        tl.set({}, {}, 10);
        tl.fromTo(plane, { x: 0, scale: 1.12 }, { x: () => -travel(), scale: 1, duration: 10 }, 0);
        tl.fromTo('[data-cloud="0"]', { xPercent: 0, yPercent: 0, scale: 1, opacity: 0.95 }, { xPercent: -70, yPercent: -25, scale: 1.6, opacity: 0, duration: 4.2, ease: 'power1.in' }, 0);
        tl.fromTo('[data-cloud="1"]', { xPercent: 0, yPercent: 0, scale: 1, opacity: 0.9 }, { xPercent: 60, yPercent: 30, scale: 1.7, opacity: 0, duration: 4.8, ease: 'power1.in' }, 0.2);
        tl.fromTo('[data-cloud="2"]', { xPercent: 0, scale: 1, opacity: 0.85 }, { xPercent: 40, yPercent: -40, scale: 1.5, opacity: 0, duration: 5.2, ease: 'power1.in' }, 0.4);
        tl.fromTo('[data-cloud="3"]', { xPercent: 0, opacity: 0 }, { xPercent: -40, opacity: 0.7, duration: 3 }, 6.2);
        tl.to('[data-cloud="3"]', { xPercent: -90, opacity: 0, duration: 1.8 }, 8.2);
        tl.fromTo('[data-title] [data-letter]', { opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(16px)', duration: 1.4, stagger: 0.32 }, 2.4);
        tl.fromTo('[data-num]', { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 1, stagger: 0.35, ease: 'back.out(2)' }, 2.6);
        tl.fromTo('[data-tag]', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.4 }, 4);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="above" className="relative h-[320vh] bg-pine-deep" aria-label="View from above">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div data-plane className="absolute left-0 top-1/2 h-[155vh] -translate-y-1/2 origin-[0_50%] md:h-[175vh]" style={{ aspectRatio: `${W} / ${H}` }}>
          <Image src={textures.aerial.src} alt="The client’s site plan of 18th Avenue seen from above" fill sizes="260vh" className="object-cover" priority={false} />
          {towers.map((t) => (
            <span
              key={t.t}
              data-num
              className="absolute -translate-x-1/2 -translate-y-1/2 font-serif text-[clamp(3rem,6vh,5.5rem)] leading-none text-pine drop-shadow-[0_2px_10px_rgb(255_255_255/0.6)]"
              style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }}
              aria-label={`Tower ${t.t}`}
            >
              {t.t}
            </span>
          ))}
          {LABELS.map((a) => (
            <span
              key={a.key}
              data-tag
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-charcoal/75 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.08em] text-cream backdrop-blur"
              style={{ left: `${a.at[0][0] * 100}%`, top: `${a.at[0][1] * 100}%` }}
            >
              {a.name}
            </span>
          ))}
        </div>

        {/* Cloud banks */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Image data-cloud="0" src={textures.clouds[0]} alt="" width={1400} height={900} className="absolute -left-[12%] top-[-6%] w-[80vw] max-w-none" />
          <Image data-cloud="1" src={textures.clouds[1]} alt="" width={1400} height={900} className="absolute -right-[16%] bottom-[-14%] w-[88vw] max-w-none" />
          <Image data-cloud="2" src={textures.clouds[2]} alt="" width={1200} height={1200} className="absolute left-[22%] top-[18%] w-[62vw] max-w-none" />
          <Image data-cloud="3" src={textures.clouds[0]} alt="" width={1400} height={900} className="absolute right-[-30%] top-[30%] w-[70vw] max-w-none opacity-0" />
        </div>

        <div className="absolute inset-x-0 top-0 h-[40vh] bg-linear-to-b from-black/35 to-transparent" aria-hidden />
        <h2 data-title className="t-display absolute inset-x-0 top-[13vh] text-center text-[clamp(3rem,8.4vw,11rem)] text-cream drop-shadow-[0_4px_30px_rgb(0_0_0/0.25)]">
          <Letters text="View from above" />
        </h2>
      </div>
    </section>
  );
}
