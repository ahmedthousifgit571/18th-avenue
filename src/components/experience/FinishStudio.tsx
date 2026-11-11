'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Sunset } from 'lucide-react';
import { FINISHES } from '@/three/room/finishes';
import { setStage, stage, useStage, type FinishSlot } from '@/lib/stage';

const RoomStage = dynamic(() => import('@/three/room/RoomStage'), { ssr: false });

const TIMES = [
  { label: 'Morning', hour: 9, Icon: Sun },
  { label: 'Golden hour', hour: 17.35, Icon: Sunset },
  { label: 'Night', hour: 19.6, Icon: Moon },
];

/** STILL/FORM's room customiser, set in an 18th Avenue living and dining room facing the evening sun. */
export default function FinishStudio() {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const finishes = useStage((s) => s.finishes);
  const selected = useStage((s) => s.selectedSurface);
  const roomHour = useStage((s) => s.roomHour);

  useEffect(() => {
    const el = ref.current!;
    const pre = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '120% 0px' });
    const vis = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '0px' });
    pre.observe(el);
    vis.observe(el);
    return () => {
      pre.disconnect();
      vis.disconnect();
    };
  }, []);

  const choose = (slot: FinishSlot, id: string) => setStage({ selectedSurface: slot, finishes: { ...stage.finishes, [slot]: id } });

  return (
    <section ref={ref} data-tone="dark" className="on-dark relative z-[3] h-[100svh] min-h-[640px] overflow-hidden bg-night text-ivory" aria-labelledby="studio-title">
      {near && <RoomStage active={onScreen} />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/70 via-transparent to-night/85" />

      <div className="wrap pointer-events-none relative flex h-full flex-col justify-between pb-6 pt-[calc(var(--header-h)+1.5rem)] md:pb-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <p className="eyebrow mb-4 text-champagne">Finish studio</p>
            <h2 id="studio-title" className="display h-md">
              Make it <em>yours.</em>
            </h2>
            <p className="body mt-4 hidden md:block">
              A living and dining room at true scale, with the higher ceilings the flat-slab structure allows. Try the
              finishes, then watch it hold the evening light.
            </p>
          </div>
          <div className="pointer-events-auto flex gap-2">
            {TIMES.map(({ label, hour, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setStage({ roomHour: hour })}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.625rem] font-medium uppercase tracking-[0.2em] transition-colors duration-500 ${
                  Math.abs(roomHour - hour) < 0.5 ? 'border-champagne bg-champagne text-ink' : 'border-ivory/35 hover:border-ivory'
                }`}
              >
                <Icon size={13} strokeWidth={1.5} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="hint mb-4 flex justify-center text-ivory/60">
            <span className="hidden md:inline">Drag to look</span>
            <span className="md:hidden">Swipe to look</span> <i /> <span className="hidden md:inline">Click to customize finishes</span>
            <span className="md:hidden">Tap to change</span>
          </p>
          <div className="pointer-events-auto grid gap-3 rounded-lg border border-ivory/10 bg-night/70 p-3 backdrop-blur-md md:grid-cols-3 md:gap-6 md:p-5">
            {(Object.keys(FINISHES) as FinishSlot[]).map((slot) => {
              const group = FINISHES[slot];
              const current = group.options.find((o) => o.id === finishes[slot])!;
              return (
                <div key={slot} className={`flex items-center justify-between gap-4 rounded-md px-2 py-1.5 transition-colors duration-500 md:block md:px-3 md:py-2 ${selected === slot ? 'bg-ivory/[0.07]' : ''}`}>
                  <div className="min-w-0">
                    <p className="eyebrow text-champagne">{group.label}</p>
                    <p className="mt-1 truncate font-serif text-lg leading-tight md:text-xl">{current.name}</p>
                  </div>
                  <div className="flex shrink-0 gap-2 md:mt-3" role="radiogroup" aria-label={group.label}>
                    {group.options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={finishes[slot] === o.id}
                        aria-label={o.name}
                        title={`${o.name}: ${o.note}`}
                        onClick={() => choose(slot, o.id)}
                        className={`size-9 rounded-full border-2 transition-[transform,border-color] duration-500 md:size-10 ${
                          finishes[slot] === o.id ? 'scale-110 border-champagne' : 'border-ivory/20 hover:border-ivory/60'
                        }`}
                        style={{ background: o.swatch }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
