'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStageSection } from '@/lib/useStageSection';
import { setStage, useStage } from '@/lib/stage';
import { layouts, sqft, towers } from '@/content/units';

/** Belgrade Arbor's building picker, in miniature: choose a tower on the model or the tabs, see what it holds. */
export default function TowerSelect() {
  const ref = useRef<HTMLElement>(null);
  useStageSection(ref, 'towers');
  const tower = useStage((s) => s.tower);
  const t = tower ? towers[tower - 1] : null;
  const list = t ? layouts.filter((l) => l.tower === t.id) : [];

  return (
    <section ref={ref} data-tone="dark" className="on-dark pointer-events-none relative h-[190vh] text-ivory" aria-labelledby="towers-title">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-gradient-to-l from-night/80 via-night/45 to-transparent md:block" />
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-night/90 via-night/60 to-transparent md:hidden" />
        <div className="wrap relative flex h-full flex-col justify-end pb-8 md:items-end md:justify-center md:pb-0">
          <div className="pointer-events-auto w-full max-w-md">
            <p className="eyebrow mb-4 text-champagne">Choose your tower</p>
            <h2 id="towers-title" className="display h-md">
              Five towers, <em>thirteen layouts.</em>
            </h2>
            <div className="mt-6 flex gap-2" role="tablist" aria-label="Towers">
              {towers.map((tw) => (
                <button
                  key={tw.id}
                  type="button"
                  role="tab"
                  aria-selected={tower === tw.id}
                  onClick={() => setStage({ tower: tower === tw.id ? 0 : tw.id })}
                  onPointerEnter={() => setStage({ hoverTower: tw.id })}
                  onPointerLeave={() => setStage({ hoverTower: 0 })}
                  className={`num grid size-12 place-items-center rounded-full border text-xl transition-colors duration-500 ${
                    tower === tw.id ? 'border-champagne bg-champagne text-ink' : 'border-ivory/35 hover:border-ivory'
                  }`}
                >
                  {tw.id}
                </button>
              ))}
            </div>
            <div className="mt-6 min-h-[13.5rem] border-t border-line-light pt-5">
              {t ? (
                <div key={t.id} className="animate-[rise_0.7s_var(--ease-avenue)_both]">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="num text-3xl">{t.homes}</p>
                      <p className="eyebrow mt-1 text-ivory/60">homes</p>
                    </div>
                    <div>
                      <p className="num text-3xl">{t.levels}</p>
                      <p className="eyebrow mt-1 text-ivory/60">levels</p>
                    </div>
                    <div>
                      <p className="num text-3xl">{t.perFloor}</p>
                      <p className="eyebrow mt-1 text-ivory/60">per floor</p>
                    </div>
                  </div>
                  <ul className="mt-5 flex flex-col divide-y divide-ivory/10 text-sm">
                    {list.map((l) => (
                      <li key={l.id} className="flex justify-between py-2">
                        <span className="text-ivory/80">
                          {l.type}
                          {l.position && !l.type.includes(l.position.slice(-1)) ? ` · ${l.position}` : ''}
                        </span>
                        <span className="text-ivory/60">
                          {sqft(l.area.gross)} sq ft · {l.bedrooms}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/residences?tower=${t.id}`} className="btn mt-6">
                    See Tower {t.id} layouts <ArrowRight size={14} strokeWidth={1.5} />
                  </Link>
                </div>
              ) : (
                <p className="body">Tap a tower on the model, or a number above, to see its homes, sizes and layouts.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
