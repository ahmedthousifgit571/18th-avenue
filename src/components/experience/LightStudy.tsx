'use client';

import { useCallback, useRef, useState } from 'react';
import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { useStageSection } from '@/lib/useStageSection';
import { setStage } from '@/lib/stage';
import { scrollToY } from '@/lib/scroller';
import { formatHour, HOUR_PRESETS, sunPosition } from '@/lib/sun';

const FROM = 6.2;
const TO = 20;
const ICONS = [Sunrise, Sun, Sunset, Moon];

function phase(h: number) {
  if (h < 10.5) return 'Morning';
  if (h < 15.5) return 'Midday';
  if (h < 18.25) return 'Golden hour';
  return 'Night';
}

/**
 * The sun-path study: scrolling moves the real Bandar Seri Begawan sun across the towers, from sunrise to night.
 * The slider and presets drive the same scroll position, so there is one source of truth.
 */
export default function LightStudy() {
  const ref = useRef<HTMLElement>(null);
  const [hour, setHour] = useState(FROM);
  const onProgress = useCallback((v: number) => {
    const h = FROM + v * (TO - FROM);
    setHour(h);
    setStage({ hour: h });
  }, []);
  useStageSection(ref, 'light', { onProgress });

  const seek = (h: number, immediate = false) => {
    const el = ref.current!;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    scrollToY(top + ((h - FROM) / (TO - FROM)) * span, { immediate, duration: 1.6 });
  };

  const { azimuth, elevation } = sunPosition(hour);
  const p = (hour - FROM) / (TO - FROM);

  return (
    <section ref={ref} data-tone="dark" className="on-dark pointer-events-none relative h-[340vh] text-ivory" aria-labelledby="light-title">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-night/70 via-night/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night/70 to-transparent" />
        <div className="wrap relative flex h-full flex-col justify-between pb-8 pt-[calc(var(--header-h)+2rem)] md:pb-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div className="max-w-xl">
              <p className="eyebrow mb-4 text-champagne">Light study · Bandar Seri Begawan, 4.9° N</p>
              <h2 id="light-title" className="display h-lg">
                Light, all the <em>way round.</em>
              </h2>
              <p className="body mt-5 max-w-md">
                “Design concept provides for ample natural lighting, ventilation and all round views.” Here is the real
                sun over the towers, hour by hour.
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="num text-[clamp(3.5rem,8vw,7rem)] leading-none" aria-live="polite">
                {formatHour(hour)}
              </p>
              <p className="eyebrow mt-2 text-champagne">{phase(hour)}</p>
              <p className="mt-2 text-xs text-ivory/60">
                {elevation > 0 ? `Sun ${Math.round(elevation)}° high, bearing ${Math.round(azimuth)}°` : 'Sun below the horizon'}
              </p>
            </div>
          </div>

          <div className="pointer-events-auto">
            <div className="mb-5 flex flex-wrap gap-2">
              {HOUR_PRESETS.map((pr, i) => {
                const Icon = ICONS[i];
                const active = phase(hour) === (pr.label === 'Noon' ? 'Midday' : pr.label);
                return (
                  <button
                    key={pr.label}
                    type="button"
                    onClick={() => seek(pr.hour)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] transition-colors duration-500 ${
                      active ? 'border-champagne bg-champagne text-ink' : 'border-ivory/35 hover:border-ivory'
                    }`}
                  >
                    <Icon size={14} strokeWidth={1.5} /> {pr.label}
                  </button>
                );
              })}
            </div>
            <label className="sr-only" htmlFor="sun-slider">
              Time of day
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[#f2b48a] via-[#fff3d6] via-60% to-[#45466a]" />
              <input
                id="sun-slider"
                type="range"
                min={0}
                max={1000}
                value={Math.round(p * 1000)}
                onChange={(e) => seek(FROM + (Number(e.target.value) / 1000) * (TO - FROM), true)}
                className="sun-range relative w-full"
                aria-valuetext={`${formatHour(hour)}, ${phase(hour)}`}
              />
            </div>
            <div className="relative mt-2 h-4 text-[0.625rem] uppercase tracking-[0.2em] text-ivory/55">
              {[
                { h: 6.2, label: '06:12 sunrise', align: 'left' },
                { h: 12.08, label: '12:05 noon', align: 'center' },
                { h: 18, label: '18:00 sunset', align: 'center' },
                { h: 20, label: '20:00', align: 'right' },
              ].map((t) => (
                <span
                  key={t.label}
                  className="absolute top-0 whitespace-nowrap"
                  style={{
                    left: `${((t.h - FROM) / (TO - FROM)) * 100}%`,
                    transform: t.align === 'center' ? 'translateX(-50%)' : t.align === 'right' ? 'translateX(-100%)' : undefined,
                  }}
                >
                  <span className={t.align === 'center' ? 'hidden sm:inline' : ''}>{t.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
