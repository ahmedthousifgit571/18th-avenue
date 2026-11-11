'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Box } from 'lucide-react';
import Pill from '@/components/ui/Pill';
import Scramble from '@/components/type/Scramble';
import { Chars, RiseWords } from '@/components/type/Split';
import { intro } from '@/content/home';
import { media } from '@/content/media';
import { stills } from '@/content/cinema';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';

type Pose = { x: number; y: number; rx: number; ry: number; rz: number; s: number };
type CardSpec = {
  img: { src: string; width: number; height: number };
  alt: string;
  /** Width as a fraction of the viewport width (desktop, mobile). */
  w: [number, number];
  ratio: number;
  /** Timeline span (0–10) and the start and end poses: centre position as viewport fractions, rotations in degrees. */
  span: [number, number];
  from: [Pose, Pose];
  to: [Pose, Pose];
};

// Desktop pose first, then mobile. Panes enter low, cross the frame on a slight diagonal and leave at the top,
// turning in 3D as they go; their perspective gives the reference's skewed, rounded panes.
const CARDS: CardSpec[] = [
  {
    img: media.exterior.tower,
    alt: 'A tower of 18th Avenue, artist’s impression',
    w: [0.25, 0.56],
    ratio: 0.76,
    span: [0, 4.4],
    from: [
      { x: 0.79, y: 1.18, rx: 26, ry: -34, rz: -9, s: 0.92 },
      { x: 0.68, y: 1.3, rx: 20, ry: -24, rz: -6, s: 0.92 },
    ],
    to: [
      { x: 0.71, y: -0.72, rx: 2, ry: -4, rz: 5, s: 1.04 },
      { x: 0.6, y: -0.55, rx: 2, ry: -4, rz: 4, s: 1 },
    ],
  },
  {
    img: stills.dropOff,
    alt: 'The drop-off porch at night, from the developer’s film',
    w: [0.2, 0.46],
    ratio: 0.82,
    span: [0.5, 5.2],
    from: [
      { x: 0.55, y: 1.25, rx: 24, ry: 30, rz: 6, s: 0.9 },
      { x: 0.3, y: 1.45, rx: 18, ry: 22, rz: 5, s: 0.9 },
    ],
    to: [
      { x: 0.42, y: -0.45, rx: 4, ry: 6, rz: -4, s: 1.02 },
      { x: 0.28, y: -0.35, rx: 4, ry: 6, rz: -3, s: 1 },
    ],
  },
  {
    img: media.flat.living,
    alt: 'The living room of the show flat, artist’s impression',
    w: [0.29, 0.62],
    ratio: 1.12,
    span: [3.5, 8.2],
    from: [
      { x: 0.22, y: 1.5, rx: 24, ry: 32, rz: 8, s: 0.9 },
      { x: 0.42, y: 1.6, rx: 18, ry: 24, rz: 6, s: 0.9 },
    ],
    to: [
      { x: 0.26, y: -0.55, rx: 4, ry: 8, rz: -5, s: 1.04 },
      { x: 0.46, y: -0.45, rx: 4, ry: 6, rz: -4, s: 1 },
    ],
  },
  {
    img: media.flat.dining,
    alt: 'The dining room of the show flat, artist’s impression',
    w: [0.17, 0.42],
    ratio: 0.86,
    span: [3.9, 8.8],
    from: [
      { x: 0.42, y: 1.5, rx: 22, ry: -30, rz: -7, s: 0.88 },
      { x: 0.74, y: 1.7, rx: 18, ry: -22, rz: -5, s: 0.88 },
    ],
    to: [
      { x: 0.36, y: -0.4, rx: 3, ry: -6, rz: 4, s: 1.02 },
      { x: 0.72, y: -0.3, rx: 3, ry: -6, rz: 3, s: 1 },
    ],
  },
];

const T = { ch2: 3.3, ch3: 6.7, end: 10 };

/**
 * The reference's long pinned introduction: three chapters over a pine-green field with slow light beams. Image
 * panes fly through 3D space as you scroll, the serif copy trades sides, and the last chapter sets the tagline in
 * capitals. A hairline at the foot fills with progress and counts 01 / 02 / 03.
 */
export default function Introduction() {
  const ref = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);
  const [kicked, setKicked] = useState([false, false]);

  useGSAP(
    () => {
      const root = ref.current!;
      const mm = gsap.matchMedia();
      mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)', motion: MOTION_OK }, (ctx) => {
        const { desktop, motion } = ctx.conditions as { desktop: boolean; mobile: boolean; motion: boolean };
        const k = desktop ? 0 : 1;
        const cards = gsap.utils.toArray<HTMLElement>('[data-card]', root);
        const chs = gsap.utils.toArray<HTMLElement>('[data-ch]', root);
        const [ch1, ch2, ch3] = chs;
        gsap.set([ch2, ch3], { autoAlpha: 0 });

        const pose = (p: Pose) => ({
          xPercent: -50,
          yPercent: -50,
          x: () => p.x * window.innerWidth,
          y: () => p.y * window.innerHeight,
          rotationX: p.rx,
          rotationY: p.ry,
          rotationZ: p.rz,
          scale: p.s,
          transformPerspective: 1200,
        });

        // Chapter 1 arrives as the section scrolls up into view (not scrubbed).
        if (motion) {
          gsap.set(ch1.querySelectorAll('[data-rise]'), { yPercent: 115, y: 0 });
          gsap.set(ch1.querySelectorAll('[data-fade]'), { autoAlpha: 0, y: 20 });
        }
        const enter = ScrollTrigger.create({
          trigger: root,
          start: 'top 55%',
          once: true,
          onEnter: () => {
            setKicked((s) => [true, s[1]]);
            if (!motion) return;
            gsap.to(ch1.querySelectorAll('[data-rise]'), { yPercent: 0, y: 0, duration: 1.2, ease: 'avenue', stagger: 0.018, delay: 0.25 });
            gsap.to(ch1.querySelectorAll('[data-fade]'), { autoAlpha: 1, y: 0, duration: 1, ease: 'avenue', delay: 0.9 });
          },
        });

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const t = self.progress * T.end;
              const c = t < T.ch2 ? 0 : t < T.ch3 ? 1 : 2;
              setChapter((prev) => (prev === c ? prev : c));
              if (t > T.ch2 - 0.1) setKicked((s) => (s[1] ? s : [s[0], true]));
            },
          },
        });
        tl.set({}, {}, T.end);

        // Reduced motion: no flights (the panes stay hidden) and the chapters simply cross-fade.
        if (motion)
          cards.forEach((el, i) => {
            const c = CARDS[i];
            tl.fromTo(el, { ...pose(c.from[k]), autoAlpha: 1 }, { ...pose(c.to[k]), duration: c.span[1] - c.span[0] }, c.span[0]);
          });
        else gsap.set(cards, { autoAlpha: 0 });
        const lift = () => (motion ? -0.06 * window.innerHeight : 0);

        // Chapter 1 out, chapter 2 in.
        tl.to(ch1, { autoAlpha: 0, y: lift, duration: 0.7, ease: 'power1.in' }, T.ch2 - 0.8);
        tl.set(ch2, { autoAlpha: 1 }, T.ch2 - 0.05);
        if (motion) {
          tl.fromTo(ch2.querySelectorAll('[data-rise]'), { yPercent: 115, y: 0 }, { yPercent: 0, y: 0, duration: 0.9, stagger: 0.012, ease: 'power2.out' }, T.ch2);
          tl.fromTo(ch2.querySelectorAll('[data-fade]'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5 }, T.ch2 + 0.6);
        }
        tl.to(ch2, { autoAlpha: 0, y: lift, duration: 0.7, ease: 'power1.in' }, T.ch3 - 0.8);

        // Chapter 3: the tagline in capitals, then the line of copy and the link.
        tl.set(ch3, { autoAlpha: 1 }, T.ch3 - 0.05);
        if (motion) {
          tl.fromTo(ch3.querySelectorAll('[data-char]'), { yPercent: 115, y: 0 }, { yPercent: 0, y: 0, duration: 1, stagger: 0.03, ease: 'power3.out' }, T.ch3);
          tl.fromTo(ch3.querySelectorAll('[data-fade]'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 }, T.ch3 + 0.9);
        }

        tl.fromTo('[data-progress]', { scaleX: 0 }, { scaleX: 1, duration: T.end }, 0);

        return () => enter.kill();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="introduction" className="relative h-[560vh] bg-pine text-cream md:h-[620vh]" aria-label="Introduction">
      <div className="sticky top-0 h-svh overflow-hidden bg-pine-glow">
        <div className="light-beams" aria-hidden />
        {/* A ghost of the towers, far back and out of focus. */}
        <div className="absolute inset-y-0 right-0 w-[70%] opacity-[0.13] mix-blend-luminosity" aria-hidden>
          <Image src={stills.aerial.src} alt="" fill sizes="30vw" quality={70} className="scale-110 object-cover blur-[22px]" />
        </div>

        {/* Flying panes */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {CARDS.map((c, i) => (
            <div
              key={i}
              data-card
              className="card invisible absolute left-0 top-0 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.55)] max-md:[width:var(--wm)] md:[width:var(--wd)]"
              style={{ '--wd': `${c.w[0] * 100}vw`, '--wm': `${c.w[1] * 100}vw`, aspectRatio: c.ratio } as React.CSSProperties}
            >
              <Image src={c.img.src} alt={c.alt} fill sizes="(min-width: 768px) 30vw, 62vw" className="object-cover" />
            </div>
          ))}
        </div>

        {/* Chapter 1: left */}
        <div data-ch className="wrap absolute inset-x-0 top-[12vh] md:top-[8.5vh]">
          <div className="max-w-[40rem] md:w-[42vw]">
            <Scramble text={intro.chapters[0].kicker.toUpperCase()} play={kicked[0]} className="t-kicker text-lime" />
            <p className="t-statement mt-[4vh]">
              <RiseWords text={intro.chapters[0].text} />
            </p>
            <div data-fade className="mt-[6vh] hidden md:block">
              <Pill href="/experience" icon={<Box size={18} strokeWidth={1} className="pill-arrow" />}>
                Explore in 3D
              </Pill>
            </div>
          </div>
        </div>

        {/* Chapter 2: right */}
        <div data-ch className="wrap absolute inset-x-0 top-[12vh] md:top-[8.5vh]">
          <div className="max-w-[44rem] md:ml-auto md:mr-[3vw] md:w-[44vw]">
            <Scramble text={intro.chapters[1].kicker.toUpperCase()} play={kicked[1]} className="t-kicker text-lime" />
            <p className="t-statement mt-[4vh]">
              <RiseWords text={intro.chapters[1].text} />
            </p>
            <div data-fade className="mt-[6vh] hidden md:block">
              <Pill href="/experience" icon={<Box size={18} strokeWidth={1} className="pill-arrow" />}>
                Explore in 3D
              </Pill>
            </div>
          </div>
        </div>

        {/* Chapter 3: the tagline */}
        <div data-ch className="wrap absolute inset-x-0 top-[12vh] md:top-[9vh]">
          <h2 className="t-display text-cream max-md:text-[13.5vw]">
            <Chars text={intro.title[0]} />
            <br />
            <Chars text={intro.title[1]} />
          </h2>
          <div className="mt-[6vh] max-w-[24rem] md:ml-[50%] md:mt-[9vh]">
            <p data-fade className="t-body text-cream/90">
              {intro.body}
            </p>
            <Link data-fade href="/residences" className="link-u mt-[5vh] text-lime">
              Explore the residences
            </Link>
          </div>
        </div>

        {/* Progress */}
        <div className="wrap absolute inset-x-0 bottom-[6vh] flex items-center gap-5 md:bottom-[8vh]" aria-hidden>
          <div className="relative h-px w-[min(15vw,15rem)] min-w-[7rem] bg-cream/20">
            <div data-progress className="absolute inset-0 origin-left bg-lime" style={{ transform: 'scaleX(0)' }} />
          </div>
          <span className="t-label w-6 text-[0.68rem] text-cream/45 tabular-nums">0{chapter + 1}</span>
        </div>
      </div>
    </section>
  );
}
