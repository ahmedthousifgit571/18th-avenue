'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Plus, X } from 'lucide-react';
import PlanDraw from './PlanDraw';
import { setStage, useStage } from '@/lib/stage';
import { layouts, ROOM_LABELS, sizeRange, sqft, towers, type Bedrooms, type Layout } from '@/content/units';
import { media } from '@/content/media';
import { project } from '@/content/project';

const SiteStage = dynamic(() => import('@/components/stage/SiteStage'), { ssr: false });

const BEDS: ('All' | Bedrooms)[] = ['All', '2BR+1', '3BR', '3BR+1'];

function AreaBar({ l }: { l: Layout }) {
  const parts = [
    { k: 'Internal', v: l.area.internal, c: 'bg-ink' },
    { k: 'Balcony / PES', v: l.area.balcony, c: 'bg-bronze' },
    { k: 'A/C ledge', v: l.area.acLedge, c: 'bg-champagne' },
  ];
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full">
        {parts.map((p) => (
          <span key={p.k} className={`${p.c} transition-[flex-grow] duration-700`} style={{ flexGrow: p.v }} />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3">
        {parts.map((p) => (
          <div key={p.k}>
            <dt className="flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.16em] text-mute">
              <span className={`size-2 rounded-full ${p.c}`} />
              {p.k}
            </dt>
            <dd className="mt-1 font-serif text-lg">{sqft(p.v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ResidencesView() {
  const tower = useStage((s) => s.tower) || 1;
  const floor = useStage((s) => s.floor);
  const [layoutId, setLayoutId] = useState('t1-a');
  const [beds, setBeds] = useState<'All' | Bedrooms>('All');
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // URL state: ?tower=3&layout=t3-g (read once, written on change; no Suspense needed).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const l = layouts.find((x) => x.id === q.get('layout'));
    const t = Number(q.get('tower')) || l?.tower || 1;
    const first = l ?? layouts.find((x) => x.tower === t)!;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the query string is client-only, read once on mount
    setLayoutId(first.id);
    setStage({ shot: 'towers', tower: t, floor: first.floorFrom === first.floorTo ? 1 : 8, visible: true, framed: false, progress: 0 });
    return () => setStage({ framed: true, floor: 0, tower: 0 });
  }, []);

  const picked = layouts.find((l) => l.id === layoutId) ?? layouts[0];
  // Written from user actions only (an effect would overwrite the deep link during StrictMode's remount).
  const writeUrl = (l: Layout) => {
    const q = new URLSearchParams(window.location.search);
    q.set('tower', String(l.tower));
    q.set('layout', l.id);
    history.replaceState(null, '', `${window.location.pathname}?${q}`);
  };

  const towerLayouts = layouts.filter((l) => l.tower === tower);
  const matches = (l: Layout) => beds === 'All' || l.bedrooms === beds;
  const t = towers[tower - 1];

  const pickTower = (id: number) => {
    const first = layouts.filter((l) => l.tower === id).find(matches) ?? layouts.find((l) => l.tower === id)!;
    setLayoutId(first.id);
    writeUrl(first);
    setStage({ tower: id, floor: first.floorFrom === first.floorTo ? 1 : Math.min(8, first.floorTo) });
  };
  const pickLayout = (l: Layout) => {
    setLayoutId(l.id);
    writeUrl(l);
    setStage({ tower: l.tower, floor: l.floorFrom === l.floorTo ? 1 : Math.min(Math.max(floor || 8, l.floorFrom), l.floorTo) });
  };
  const pickFloor = (f: number) => {
    const ground = f === 1;
    const candidate = towerLayouts.filter((l) => (ground ? l.ground : !l.ground));
    const keep = candidate.find((l) => l.position === layout.position) ?? candidate[0];
    if (keep) {
      setLayoutId(keep.id);
      writeUrl(keep);
    }
    setStage({ floor: f });
  };

  // A tower picked on the 3D model (its name tag) shows that tower's first layout.
  const layout = picked.tower === tower ? picked : layouts.find((l) => l.tower === tower)!;

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? [...c.slice(1), id] : [...c, id]));
  const compared = useMemo(() => compare.map((id) => layouts.find((l) => l.id === id)!), [compare]);

  return (
    <main className="relative bg-ivory pb-28 pt-[calc(var(--header-h)+2.5rem)]" data-tone="light">
      <section className="wrap" aria-labelledby="res-title">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow mb-4 text-bronze">Residences</p>
            <h1 id="res-title" className="display h-lg">
              Thirteen layouts, <em>five towers.</em>
            </h1>
          </div>
          <dl className="grid grid-cols-3 gap-4 md:col-span-5">
            <div>
              <dt className="eyebrow text-mute">Residences</dt>
              <dd className="num mt-1 text-4xl">159</dd>
            </div>
            <div>
              <dt className="eyebrow text-mute">Sizes, sq ft</dt>
              <dd className="num mt-1 text-4xl">
                {Math.round(sizeRange[0]).toLocaleString('en-GB')}–{Math.round(sizeRange[1]).toLocaleString('en-GB')}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-mute">Bedrooms</dt>
              <dd className="num mt-1 text-4xl">2+1 – 3+1</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="wrap mt-10 grid gap-8 lg:grid-cols-12" aria-label="Tower and layout selector">
        {/* 3D picker */}
        <div className="lg:col-span-6">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
            <div className="on-dark relative aspect-square overflow-hidden rounded-lg bg-night sm:aspect-4/3 lg:aspect-auto lg:h-[calc(100svh-var(--header-h)-2rem)]">
              <SiteStage className="absolute inset-0" />
              {/* The tower and its levels are already stated beside the model; only the gesture hint stays, low and quiet. */}
              <p className="hint pointer-events-none absolute bottom-4 left-4 hidden rounded-full bg-night/45 px-3 py-1.5 text-[0.58rem] text-ivory/85 backdrop-blur md:flex">
                Drag to rotate <i /> Tap a tower
              </p>
              {/* Floor scrubber: a compact rail at mid-height instead of a full-height column. */}
              <div className="absolute right-3 top-1/2 flex h-[min(80%,24rem)] w-10 -translate-y-1/2 flex-col items-center gap-1 rounded-full bg-night/40 py-3 text-ivory backdrop-blur md:h-[min(68%,24rem)]" role="radiogroup" aria-label="Floor">
                <span className="eyebrow mb-1 text-[0.5rem] text-champagne">Floor</span>
                <div className="flex flex-1 flex-col-reverse justify-between">
                  {Array.from({ length: t.levels }, (_, i) => i + 1).map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={floor === f}
                      aria-label={`Floor ${f}`}
                      onClick={() => pickFloor(f)}
                      className={`group flex h-full min-h-[9px] items-center gap-1.5 px-1 text-[0.6rem] leading-none tabular-nums ${floor === f ? 'text-champagne' : 'text-ivory/50 hover:text-ivory'}`}
                    >
                      <span className={`h-px transition-all ${floor === f ? 'w-4 bg-champagne' : 'w-2 bg-ivory/40 group-hover:w-3'}`} />
                      <span className={floor === f || f === 1 || f % 5 === 0 ? '' : 'opacity-0 group-hover:opacity-100'}>{f}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel */}
        <div className="lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2" role="tablist" aria-label="Towers">
              {towers.map((tw) => {
                const has = layouts.some((l) => l.tower === tw.id && matches(l));
                return (
                  <button
                    key={tw.id}
                    type="button"
                    role="tab"
                    aria-selected={tower === tw.id}
                    onClick={() => pickTower(tw.id)}
                    onPointerEnter={() => setStage({ hoverTower: tw.id })}
                    onPointerLeave={() => setStage({ hoverTower: 0 })}
                    className={`num grid size-12 place-items-center rounded-full border text-xl transition-all duration-500 ${
                      tower === tw.id ? 'border-ink bg-ink text-ivory' : has ? 'border-line hover:border-ink' : 'border-line opacity-30'
                    }`}
                  >
                    {tw.id}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Bedrooms">
              {BEDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={beds === b}
                  onClick={() => setBeds(b)}
                  className={`rounded-full border px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.16em] transition-colors ${beds === b ? 'border-bronze bg-bronze text-ivory' : 'border-line text-ink-soft hover:border-ink'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-y border-line py-5">
            <div>
              <p className="num text-3xl">{t.homes}</p>
              <p className="eyebrow mt-1 text-mute">homes in Tower {t.id}</p>
            </div>
            <div>
              <p className="num text-3xl">{t.perFloor}</p>
              <p className="eyebrow mt-1 text-mute">{t.perFloor === 1 ? 'home per floor' : 'homes per floor'}</p>
            </div>
            <div>
              <p className="num text-3xl">{t.levels}</p>
              <p className="eyebrow mt-1 text-mute">residential levels</p>
            </div>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label={`Tower ${tower} layouts`}>
            {towerLayouts.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => pickLayout(l)}
                  aria-pressed={l.id === layout.id}
                  className={`rounded-md border px-4 py-2.5 text-left transition-all duration-300 ${l.id === layout.id ? 'border-ink bg-ink text-ivory' : matches(l) ? 'border-line bg-paper hover:border-ink' : 'border-line opacity-35'}`}
                >
                  <span className="block font-serif text-lg leading-tight">
                    {l.type}
                    {l.position ? ` · ${l.position.replace('Unit ', '')}` : ''}
                  </span>
                  <span className={`text-[0.625rem] uppercase tracking-[0.14em] ${l.id === layout.id ? 'text-ivory/70' : 'text-mute'}`}>
                    {sqft(l.area.gross)} sq ft · {l.bedrooms}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <article key={layout.id} className="mt-8 animate-[rise_0.7s_var(--ease-avenue)_both]" aria-labelledby="layout-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-bronze">
                  Tower {layout.tower} · {layout.floors}
                </p>
                <h2 id="layout-title" className="display h-md mt-2">
                  {layout.type}
                  {layout.position && <em> · {layout.position}</em>}
                </h2>
              </div>
              <div className="text-right">
                <p className="num text-5xl leading-none">{sqft(layout.area.gross)}</p>
                <p className="eyebrow mt-1 text-mute">sq ft gross · {layout.bedrooms}</p>
              </div>
            </div>

            <div className="mt-6">
              <AreaBar l={layout} />
            </div>

            <div className="mt-8">
              <PlanDraw layout={layout} />
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_auto]">
              <table className="w-full text-sm">
                <caption className="eyebrow mb-3 text-left text-mute">Main rooms (approx. sq ft)</caption>
                <tbody className="divide-y divide-line border-y border-line">
                  {(Object.keys(ROOM_LABELS) as (keyof Layout['rooms'])[]).map((k) =>
                    layout.rooms[k] == null ? null : (
                      <tr key={k}>
                        <th scope="row" className="py-2.5 text-left font-normal text-ink-soft">
                          {ROOM_LABELS[k]}
                        </th>
                        <td className="py-2.5 text-right font-serif text-lg">{layout.rooms[k]}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
              <figure className="sm:w-48">
                <div className="relative aspect-[285/179] overflow-hidden rounded-sm border border-line bg-paper">
                  <Image src={media.plans[layout.keyPlan].src} alt={`Key plan: where ${layout.type} sits in Tower ${layout.tower}`} fill sizes="192px" className="object-contain" />
                </div>
                <figcaption className="mt-2 text-xs text-mute">Key plan · {layout.unitsListed} homes on {layout.floors.toLowerCase().replace(' floor', '')} floor{layout.floorFrom === layout.floorTo ? '' : 's'}</figcaption>
              </figure>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={`/?layout=${layout.id}#contact`} className="btn btn-solid">
                Enquire about this layout <ArrowUpRight size={14} />
              </Link>
              <button type="button" onClick={() => toggleCompare(layout.id)} className="btn">
                {compare.includes(layout.id) ? <Check size={14} /> : <Plus size={14} />} {compare.includes(layout.id) ? 'In compare' : 'Compare'}
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* All layouts */}
      <section className="wrap mt-28" aria-labelledby="all-title">
        <div className="mb-8 flex items-end justify-between">
          <h2 id="all-title" className="display h-sm">
            All thirteen layouts
          </h2>
          <p className="eyebrow text-mute">{layouts.filter(matches).length} shown</p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {layouts.filter(matches).map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => {
                  pickLayout(l);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group block w-full text-left"
              >
                <div className="relative aspect-[5/4] overflow-hidden rounded-md border border-line bg-paper p-3">
                  <Image src={media.plans[l.plan].src} alt={`${l.label} plan`} fill sizes="(min-width: 1024px) 22vw, 46vw" className="object-contain p-3 mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <p className="eyebrow mt-3 text-bronze">Tower {l.tower}</p>
                <p className="mt-1 font-serif text-xl">
                  {l.type}
                  {l.position ? ` · ${l.position}` : ''}
                </p>
                <p className="text-sm text-mute">
                  {sqft(l.area.gross)} sq ft · {l.bedrooms} · {l.floors}
                </p>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-mute">
          Areas are approximate and as published by the developer. The developer’s headline figure is 159 residences;
          the published unit table adds up to {towers.reduce((a, t) => a + t.homes, 0)}. {project.disclaimer}
        </p>
      </section>

      {/* Compare tray */}
      {compared.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur">
          <div className="wrap flex items-center gap-4 py-3">
            <p className="eyebrow hidden text-mute sm:block">Compare</p>
            <ul className="flex flex-1 gap-2 overflow-x-auto">
              {compared.map((l) => (
                <li key={l.id} className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-ivory py-1 pl-3 pr-1 text-sm">
                  T{l.tower} {l.type.replace('Type ', '')}
                  {l.position ? ` ${l.position.slice(-1)}` : ''}
                  <button type="button" onClick={() => toggleCompare(l.id)} className="grid size-6 place-items-center rounded-full hover:bg-sand" aria-label={`Remove ${l.label}`}>
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setShowCompare(true)} disabled={compared.length < 2} className="btn btn-solid disabled:opacity-40">
              Compare {compared.length}
            </button>
          </div>
        </div>
      )}
      {showCompare && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-night/60 p-0 backdrop-blur-sm sm:items-center sm:p-8" role="dialog" aria-modal="true" aria-label="Compare layouts" onClick={() => setShowCompare(false)}>
          <div className="max-h-[88svh] w-full max-w-4xl overflow-auto rounded-t-xl bg-paper p-6 sm:rounded-xl md:p-10" onClick={(e) => e.stopPropagation()} data-lenis-prevent>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="display h-sm">Side by side</h2>
              <button type="button" onClick={() => setShowCompare(false)} className="grid size-10 place-items-center rounded-full border border-line" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th />
                  {compared.map((l) => (
                    <th key={l.id} className="pb-4 text-left align-bottom font-normal">
                      <span className="eyebrow block text-bronze">Tower {l.tower}</span>
                      <span className="font-serif text-xl">{l.type}{l.position ? ` · ${l.position.slice(-1)}` : ''}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[
                  ['Gross area (sq ft)', (l: Layout) => sqft(l.area.gross)],
                  ['Internal (sq ft)', (l: Layout) => sqft(l.area.internal)],
                  ['Balcony / PES (sq ft)', (l: Layout) => sqft(l.area.balcony)],
                  ['Bedrooms', (l: Layout) => l.bedrooms],
                  ['Floors', (l: Layout) => l.floors],
                  ...(Object.keys(ROOM_LABELS) as (keyof Layout['rooms'])[]).map((k) => [`${ROOM_LABELS[k]} (sq ft)`, (l: Layout) => l.rooms[k] ?? '–'] as const),
                ].map(([label, fn]) => (
                  <tr key={label as string}>
                    <th scope="row" className="py-2.5 pr-4 text-left font-normal text-mute">
                      {label as string}
                    </th>
                    {compared.map((l) => (
                      <td key={l.id} className="py-2.5 font-serif text-lg">
                        {(fn as (l: Layout) => string | number)(l)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
