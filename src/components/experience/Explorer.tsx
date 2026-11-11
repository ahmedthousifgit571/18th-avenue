'use client';

import { useCallback, useRef, useState } from 'react';
import { useStageSection } from '@/lib/useStageSection';
import { setStage } from '@/lib/stage';
import { scrollToY } from '@/lib/scroller';
import { EXPLORER } from '@/three/site/shots';
import { amenities } from '@/content/amenities';

/** Still/Form's chapter rail ("01 of 07") over the live site model; scroll or tap a tick to move between views. */
export default function Explorer() {
  const ref = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);
  const [p, setP] = useState(0);
  const last = useRef(-1);
  const n = EXPLORER.length;

  const onProgress = useCallback(
    (v: number) => {
      setP(v);
      const c = Math.min(n - 1, Math.floor(v * n));
      if (c !== last.current) {
        last.current = c;
        setChapter(c);
        setStage({ chapter: c });
      }
    },
    [n],
  );
  useStageSection(ref, 'explorer', { onProgress });

  const goTo = (i: number) => {
    const el = ref.current!;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    scrollToY(top + ((i + 0.5) / n) * span);
  };

  const c = EXPLORER[chapter];
  const names = c.keys.map((k) => amenities.find((a) => a.key === k)?.name).filter(Boolean);

  return (
    <section ref={ref} id="experience" data-tone="dark" className="on-dark pointer-events-none relative h-[760vh] text-ivory" aria-label="3D experience">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-night/85 via-night/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-night/45 to-transparent" />

        <div className="wrap relative flex h-full flex-col justify-end pb-6 md:pb-9">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="eyebrow mb-3 flex items-center gap-3 text-champagne">
                <span className="h-px w-8 bg-champagne" /> 3D Experience
              </p>
              <h2 key={c.title} className="display h-md animate-[rise_0.9s_var(--ease-avenue)_both]">
                {c.title}
              </h2>
              <p className="eyebrow mt-3 text-ivory/70">{c.kicker}</p>
              {names.length > 0 && (
                <p key={`n${chapter}`} className="mt-4 hidden max-w-xl text-sm text-ivory/70 md:block animate-[rise_0.9s_var(--ease-avenue)_0.1s_both]">
                  {names.join(' · ')}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="num text-[clamp(3rem,7vw,6rem)] leading-none">{String(chapter + 1).padStart(2, '0')}</p>
              <p className="eyebrow mt-1 text-ivory/60">of {String(n).padStart(2, '0')}</p>
            </div>
          </div>

          {/* Rail */}
          <div className="pointer-events-auto relative mt-7">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ivory/20" />
            <div className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-champagne" style={{ width: `${p * 100}%` }} />
            <ol className="relative flex justify-between">
              {EXPLORER.map((ch, i) => (
                <li key={ch.title}>
                  <button type="button" onClick={() => goTo(i)} className="group relative grid size-8 place-items-center" aria-label={`${String(i + 1).padStart(2, '0')}: ${ch.title}`} aria-current={chapter === i ? 'step' : undefined}>
                    <span className={`block rounded-full transition-all duration-500 ${chapter === i ? 'size-3 bg-champagne' : i < chapter ? 'size-1.5 bg-champagne' : 'size-1.5 bg-ivory/60 group-hover:bg-ivory'}`} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <p className="hint mt-3 flex justify-center text-ivory/55">
            <span>Scroll to move</span> <i /> <span className="hidden md:inline">Drag to rotate</span>
            <span className="md:hidden">Swipe to turn</span>
          </p>
        </div>
      </div>
    </section>
  );
}
