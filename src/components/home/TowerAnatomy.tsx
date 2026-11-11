'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pointer, Rotate3d } from 'lucide-react';
import Pill from '@/components/ui/Pill';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { scrollToY } from '@/lib/scroller';
import { anatomyCopy } from '@/content/home';

const AnatomyCanvas = dynamic(() => import('./AnatomyCanvas'), { ssr: false });

/**
 * Still/Form's "STILL / FORM" moment, for one of the five towers. A marquee runs behind a small film still; the still
 * opens to full screen and dissolves like ink into the live 3D tower; then seven chapters isolate one layer each
 * (the rest turn to ghosted line drawing) while a rail and a progress bar count 01–07. An end card leads on to the
 * full 3D experience.
 *
 * Scroll lengths follow the reference (in viewport heights): 220 to open, 100 per chapter, then the end card.
 */
const CH = anatomyCopy.chapters;
const N = CH.length;
const INTRO = 220;
const PER = 100;
const OUTRO = 110;
const TOTAL = INTRO + PER * N + OUTRO;
const E_CARD = 100 / TOTAL; // card is full screen
const E_IN = INTRO / TOTAL; // ink gone, chapters begin
const E_OUT = (INTRO + PER * N) / TOTAL; // chapters end, end card
const pad = (n: number) => String(n).padStart(2, '0');
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Fractal value noise, 0–1, for the ink dissolve mask (computed once per size). */
function inkNoise(w: number, h: number) {
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return s - Math.floor(s);
  };
  const vnoise = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy * (1 - ux) + (d - b) * ux * uy;
  };
  const out = new Float32Array(w * h);
  const aspect = w / h;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      let x = (i / w) * aspect * 2.2;
      let y = (j / h) * 2.2;
      let v = 0;
      let amp = 0.5;
      for (let o = 0; o < 5; o++) {
        v += amp * vnoise(x, y);
        x *= 2;
        y *= 2;
        amp *= 0.5;
      }
      out[j * w + i] = v;
    }
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of out) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) / (hi - lo || 1);
  return out;
}

/** Draws the film still (cover-fitted to the viewport) through an ink mask; `p` runs 0 (whole) to 1.5 (gone). */
function useInk(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const st = useRef<{ img: HTMLImageElement | null; noise: Float32Array | null; mask: HTMLCanvasElement | null; mw: number; mh: number; p: number }>({
    img: null,
    noise: null,
    mask: null,
    mw: 0,
    mh: 0,
    p: 0,
  });

  const draw = useCallback(
    (p: number) => {
      const s = st.current;
      s.p = p;
      const cv = canvasRef.current;
      if (!cv || !s.img?.complete || !s.img.naturalWidth || !s.noise || !s.mask) return;
      const ctx = cv.getContext('2d')!;
      const W = cv.width;
      const H = cv.height;
      ctx.globalCompositeOperation = 'copy';
      if (p >= 1.5) {
        ctx.clearRect(0, 0, W, H);
        return;
      }
      const iw = s.img.naturalWidth;
      const ih = s.img.naturalHeight;
      const k = Math.max(W / iw, H / ih);
      ctx.drawImage(s.img, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
      ctx.globalCompositeOperation = 'source-over';
      if (p <= 0) return;
      const mctx = s.mask.getContext('2d')!;
      const data = mctx.createImageData(s.mw, s.mh);
      // Low-noise areas go first; a band of ±0.12 around the threshold gives the ink its soft, bleeding rim.
      const th = -0.15 + 1.3 * (p / 1.5);
      for (let i = 0; i < s.noise.length; i++) {
        const t = clamp01((s.noise[i] - th + 0.12) / 0.24);
        data.data[i * 4 + 3] = t * t * (3 - 2 * t) * 255;
      }
      mctx.putImageData(data, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(s.mask, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    },
    [canvasRef],
  );

  useEffect(() => {
    const s = st.current;
    const size = () => {
      const cv = canvasRef.current;
      if (!cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      cv.style.width = `${window.innerWidth}px`;
      cv.style.height = `${window.innerHeight}px`;
      // The mask is low resolution on purpose: upscaling it gives the ink its soft, bleeding edge.
      s.mh = 150;
      s.mw = Math.max(1, Math.round((150 * window.innerWidth) / window.innerHeight));
      s.noise = inkNoise(s.mw, s.mh);
      s.mask = s.mask ?? document.createElement('canvas');
      s.mask.width = s.mw;
      s.mask.height = s.mh;
      draw(s.p);
    };
    const img = new Image();
    img.decoding = 'async';
    img.src = anatomyCopy.card.src;
    img.onload = () => draw(s.p);
    s.img = img;
    size();
    window.addEventListener('resize', size);
    return () => window.removeEventListener('resize', size);
  }, [canvasRef, draw]);

  return draw;
}

export default function TowerAnatomy() {
  const ref = useRef<HTMLElement>(null);
  const ink = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const railFill = useRef<HTMLDivElement>(null);
  const barFill = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const drawInk = useInk(ink);

  const [near, setNear] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [outro, setOutro] = useState(false);
  const readyRef = useRef(false);
  const inkP = useRef(0);
  const hinted = useRef({ rotate: false, click: false });

  // Mount the WebGL canvas a screen ahead of the section; it only renders while the section is near.
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        setNear(e.isIntersecting);
        if (e.isIntersecting) setMounted(true);
      },
      { rootMargin: '120% 0px 120% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onReady = useCallback(() => {
    readyRef.current = true;
    setReady(true);
    drawInk(inkP.current);
  }, [drawInk]);

  useGSAP(
    () => {
      const el = ref.current!;
      const track = el.querySelector<HTMLElement>('[data-track]')!;
      const prompt = el.querySelector<HTMLElement>('[data-prompt]')!;
      const mm = gsap.matchMedia();
      let loop: gsap.core.Tween | null = null;
      mm.add(MOTION_OK, () => {
        loop = gsap.to(track, { xPercent: -33.333, duration: 26, ease: 'none', repeat: -1 });
        return () => loop?.kill();
      });
      // The marquee only runs while the section is on screen.
      const onScreen = ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? loop?.play() : loop?.pause()) });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true },
        onUpdate: () => {
          const e = tl.progress();
          const p = 1.5 * clamp01((e - E_CARD) / (E_IN - E_CARD));
          if (p !== inkP.current) {
            inkP.current = p;
            // Hold the still until the 3D tower has rendered, so the ink never opens onto an empty canvas.
            drawInk(readyRef.current ? p : 0);
          }
          if (card.current) card.current.style.visibility = p >= 1.5 && readyRef.current ? 'hidden' : 'visible';
          setEntered(e >= E_CARD);
          const c = clamp01((e - E_IN) / (E_OUT - E_IN));
          setChapter(e < E_IN ? 0 : Math.min(N - 1, Math.floor(c * N)));
          setOutro(e >= E_OUT + 0.012);
          if (railFill.current) railFill.current.style.transform = `scaleY(${clamp01((c * N - 0.5) / (N - 1))})`;
          if (barFill.current) barFill.current.style.transform = `scaleX(${c})`;
          if (knob.current) knob.current.style.left = `${c * 100}%`;
        },
      });
      tl.to({}, { duration: 1 }, 0);
      tl.to(card.current, { width: () => window.innerWidth, height: () => window.innerHeight, borderRadius: 0, ease: 'power2.inOut', duration: E_CARD }, 0)
        .to(prompt, { opacity: 0, duration: 30 / TOTAL }, 0)
        .to(track, { opacity: 0, yPercent: -25, duration: 60 / TOTAL }, 20 / TOTAL);
      return () => {
        onScreen.kill();
        mm.revert();
      };
    },
    { scope: ref },
  );

  // Caption lines rise in on every chapter change.
  useGSAP(
    () => {
      if (!entered || outro) return;
      gsap.fromTo(hud.current!.querySelectorAll('[data-hud-text]'), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 });
    },
    { dependencies: [chapter, entered, outro], scope: hud },
  );

  // One-off hints, as on the reference: "drag to rotate" on the second chapter, the clickable rail on the third.
  useGSAP(
    () => {
      if (!entered || outro) return;
      const kind = chapter === 1 ? 'rotate' : chapter === 2 ? 'click' : null;
      if (!kind || hinted.current[kind]) return;
      const tl = gsap.timeline({ delay: 0.5, onComplete: () => void (hinted.current[kind] = true) });
      if (kind === 'click')
        tl.fromTo('.rail-hint', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 0)
          .to('.rail-hint-icon', { x: -6, duration: 0.35, repeat: 5, yoyo: true, ease: 'power1.inOut' }, 0)
          .fromTo('.rail-hint-ring', { scale: 1, opacity: 0.6 }, { scale: 2, opacity: 0, duration: 0.7, repeat: 2, ease: 'power1.out' }, 0)
          .to('.rail-hint', { opacity: 0, scale: 0.6, duration: 0.4, ease: 'power2.in' }, 2.1);
      else
        tl.fromTo('.rotate-hint', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0)
          .to('.rotate-hint-icon', { rotation: 360, duration: 1.4, repeat: 2, ease: 'power1.inOut' }, 0)
          .to('.rotate-hint', { opacity: 0, y: 10, duration: 0.5, ease: 'power2.in' }, 4.2);
    },
    { dependencies: [chapter, entered, outro], scope: ref },
  );

  const goTo = (i: number) => {
    const el = ref.current!;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    scrollToY(top + (E_IN + ((i + 0.5) / N) * (E_OUT - E_IN)) * span);
  };

  const c = CH[chapter];
  const show = entered && ready;

  return (
    <section ref={ref} id="anatomy" className="relative bg-sand text-pine" style={{ height: `${TOTAL + 100}vh` }} aria-label="Tower anatomy in 3D">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* Marquee */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center overflow-hidden" aria-hidden>
          <div data-track className="flex whitespace-nowrap font-serif text-[clamp(4.2rem,17vw,9rem)] uppercase leading-none tracking-[-0.01em] will-change-transform lg:text-[clamp(6rem,11vw,12rem)]">
            {[0, 1, 2].map((k) => (
              <div key={k} className="flex shrink-0">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="mx-[0.22em] flex items-center gap-[0.44em]">
                    {anatomyCopy.marquee}
                    <i className="block size-[0.12em] rounded-full bg-golden" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* The live tower */}
        <div className={`absolute inset-0 z-30 overflow-hidden bg-pine-deep transition-opacity duration-700 ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!show}>
          {mounted && <AnatomyCanvas chapter={chapter} outro={outro} running={near} onReady={onReady} />}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-night/40 to-transparent" />

          {/* Rail */}
          <nav
            aria-label="Tower layers"
            className={`pointer-events-none absolute right-4 top-[38%] z-10 -translate-y-1/2 scale-90 drop-shadow-[0_1px_4px_rgb(31_40_25/0.45)] transition-opacity duration-500 lg:right-10 lg:top-1/2 lg:scale-100 ${outro ? 'opacity-0' : ''}`}
          >
            <div className="pointer-events-auto relative flex flex-col items-center gap-4 rounded-full bg-night/25 px-1.5 py-2 backdrop-blur-[6px]">
              <div className="absolute left-1/2 top-[1.125rem] h-[calc(100%-2.25rem)] w-px -translate-x-1/2 bg-cream/25" />
              <div ref={railFill} className="absolute left-1/2 top-[1.125rem] h-[calc(100%-2.25rem)] w-px origin-top -translate-x-1/2 bg-cream shadow-[0_0_8px_rgb(255_244_214/0.5)]" style={{ transform: 'scaleY(0)' }} />
              {CH.map((ch, i) => (
                <button
                  key={ch.id}
                  type="button"
                  title={ch.title}
                  aria-label={`Show ${ch.title}`}
                  aria-current={i === chapter ? 'step' : undefined}
                  tabIndex={show ? 0 : -1}
                  onClick={() => goTo(i)}
                  className="group relative z-10 grid size-5 place-items-center rounded-full"
                >
                  <span
                    className={`block rounded-full border transition-all duration-300 ${
                      i === chapter ? 'size-3.5 border-cream bg-cream ring-4 ring-cream/20' : i < chapter ? 'size-2 border-cream/80 bg-cream/80' : 'size-2 border-cream/45 group-hover:border-cream'
                    }`}
                  />
                  <span className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 whitespace-nowrap text-[0.64rem] font-medium uppercase tracking-[0.2em] text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:block">
                    {ch.title}
                  </span>
                </button>
              ))}
              <span aria-hidden className="rail-hint pointer-events-none absolute -left-12 top-1/2 -mt-[18px] flex size-9 items-center justify-center opacity-0">
                <span className="rail-hint-ring absolute inset-0 rounded-full bg-cream/60" />
                <span className="relative flex size-9 items-center justify-center rounded-full bg-cream text-pine shadow-lg">
                  <Pointer className="rail-hint-icon size-[1.15rem]" strokeWidth={1.75} />
                </span>
              </span>
            </div>
          </nav>

          {/* Drag hint */}
          <div className="pointer-events-none absolute inset-x-0 bottom-[11.5rem] z-10 hidden justify-center lg:flex">
            <div aria-hidden className="rotate-hint flex flex-col items-center gap-2 text-cream opacity-0">
              <span className="flex size-12 items-center justify-center rounded-full border border-cream/50 bg-cream/10 backdrop-blur-sm">
                <Rotate3d className="rotate-hint-icon size-6" strokeWidth={1.5} />
              </span>
              <span className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-cream/85">Drag to rotate</span>
            </div>
          </div>

          {/* Caption, count and progress */}
          <div
            ref={hud}
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-night/75 via-night/30 to-transparent px-[var(--gutter)] pb-6 pt-24 text-cream transition-opacity duration-500 lg:pb-8 lg:pt-32 ${outro ? 'opacity-0' : ''}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div className="min-w-0 pr-10 lg:pr-0" role="status" aria-live="polite">
                <div className="mb-3 flex items-center gap-2.5 text-[0.64rem] font-medium uppercase tracking-[0.2em] text-cream/75">
                  <span className="h-px w-6 bg-cream/60" />
                  <span>{anatomyCopy.eyebrow}</span>
                </div>
                <div className="overflow-hidden pb-[0.12em]">
                  <h3 data-hud-text className="font-serif text-[clamp(2.5rem,5.2vw,5.4rem)] leading-[0.95]">
                    {c.title}
                  </h3>
                </div>
                <div className="mt-3 overflow-hidden">
                  <p data-hud-text className="max-w-md text-[0.7rem] font-medium uppercase tracking-[0.16em] text-cream/80 md:text-[0.8rem]">
                    {c.stat}
                  </p>
                </div>
              </div>
              <div className="shrink-0 max-sm:hidden sm:text-right">
                <div className="overflow-hidden pb-[0.06em]">
                  <div data-hud-text className="num text-[clamp(3.4rem,8vw,8rem)] leading-[0.9]">
                    {pad(chapter + 1)}
                  </div>
                </div>
                <div className="mt-2 text-[0.64rem] font-medium uppercase tracking-[0.2em] text-cream/65">of {pad(N)}</div>
              </div>
            </div>
            <div className="relative mt-6 h-[2px] w-full bg-cream/25">
              <div ref={barFill} className="absolute inset-0 origin-left bg-cream" style={{ transform: 'scaleX(0)' }} />
              {Array.from({ length: N - 1 }, (_, i) => (
                <span key={i} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-cream/50" style={{ left: `${((i + 1) / N) * 100}%` }} />
              ))}
              <span ref={knob} className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream shadow-[0_0_10px_rgb(255_244_214/0.7)]" style={{ left: '0%' }} />
            </div>
            <p className="mt-3 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-cream/55 sm:hidden">
              {pad(chapter + 1)} of {pad(N)} · swipe the tower to turn it
            </p>
          </div>

          {/* End card */}
          <div
            className={`absolute inset-0 z-20 flex items-end transition-opacity duration-700 md:items-center ${outro ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={!outro}
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-night/80 via-night/35 to-transparent md:bg-linear-to-r md:from-night/75 md:via-night/30 md:to-transparent" />
            <div className={`wrap relative max-w-[44rem] pb-[max(2.5rem,6vh)] text-cream transition-transform duration-1000 ease-[var(--ease-avenue)] md:pb-0 ${outro ? 'translate-y-0' : 'translate-y-8'}`}>
              <p className="t-kicker text-lime">{anatomyCopy.cta.kicker}</p>
              <h3 className="mt-5 font-serif text-[clamp(2.8rem,6vw,6.2rem)] leading-[0.92]">
                {anatomyCopy.cta.title.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </h3>
              <p className="t-body mt-6 max-w-[26rem] text-cream/80">{anatomyCopy.cta.text}</p>
              <div className={outro ? '' : 'invisible'}>
                <Pill href={anatomyCopy.cta.href} solid className="mt-9">
                  {anatomyCopy.cta.label}
                </Pill>
              </div>
            </div>
          </div>
        </div>

        {/* The film still: opens to full screen, then dissolves into the tower. */}
        <div
          ref={card}
          className="pointer-events-none absolute left-1/2 top-1/2 z-40 h-[30vh] w-[min(72vw,18rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[3px] bg-pine shadow-[0_30px_60px_-30px_rgb(46_58_38/0.55)] lg:h-[40vh] lg:w-[min(72vw,25rem)]"
          role="img"
          aria-label={anatomyCopy.cardAlt}
        >
          <canvas ref={ink} className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" />
        </div>

        <p data-prompt className="hint absolute bottom-8 left-1/2 z-30 -translate-x-1/2 text-pine/60">
          {anatomyCopy.prompt}
        </p>
      </div>
    </section>
  );
}
