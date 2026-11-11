'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import SplitReveal from '@/components/type/SplitReveal';
import WordScrub from '@/components/type/WordScrub';
import { BasementDiagram, LiftDiagram, SlabDiagram } from './FeatureDiagrams';
import { about, attractions, features, project } from '@/content/project';
import { media } from '@/content/media';
import { observeReveal } from '@/lib/gsap';

const DIAGRAMS = { lift: LiftDiagram, basement: BasementDiagram, structure: SlabDiagram };

export default function AboutView() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => observeReveal(root.current!), []);

  return (
    <main ref={root} className="relative bg-ivory">
      {/* Hero */}
      <section className="on-dark relative h-[92svh] min-h-[560px] overflow-hidden text-ivory" data-tone="dark" aria-labelledby="about-title">
        <Image src="/media/film/towers-poster.webp" alt="The 18th Avenue towers, artist's impression" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/30 to-night/40" />
        <div className="wrap relative flex h-full flex-col justify-end pb-12 md:pb-16">
          <p className="eyebrow mb-5 text-champagne-soft">About 18th Avenue</p>
          <SplitReveal as="h1" on="scroll" className="display h-xl max-w-[13ch]">
            Your Detached Home <em>in the Sky.</em>
          </SplitReveal>
          <p className="body mt-6 max-w-xl text-ivory/80">{about.welcome}</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 md:py-36" data-tone="light" aria-label="Our story">
        <div className="wrap grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow text-bronze">About us</p>
            <div className="reveal relative mt-8 hidden aspect-[4/5] overflow-hidden rounded-sm md:block">
              <Image src={media.exterior.pool.src} alt="The lagoon pool and pavilions, artist's impression" fill sizes="30vw" className="object-cover" />
            </div>
          </div>
          <div className="md:col-span-8">
            <WordScrub text={about.castle} className="display text-[clamp(1.8rem,3.4vw,3.3rem)] leading-[1.1]" />
            <div className="mt-14 grid gap-8 md:grid-cols-2">
              <p className="body reveal">{about.jv}</p>
              <p className="body reveal">{about.design}</p>
              <p className="body reveal md:col-span-2 md:max-w-xl">{about.scale}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership diagram */}
      <section className="bg-paper py-24 md:py-32" data-tone="light" aria-labelledby="jv-title">
        <div className="wrap">
          <p className="eyebrow mb-5 text-bronze">The partnership</p>
          <h2 id="jv-title" className="display h-lg max-w-3xl">
            Three names behind <em>one address.</em>
          </h2>
          <div className="reveal relative mt-16">
            {/* Connector through the three circle centres (columns are a 3-col grid with gap-10, circles are size-28). */}
            <div aria-hidden className="absolute top-[calc(3.5rem_-_1px)] right-[calc((100%_-_5rem)/6)] left-[calc((100%_-_5rem)/6)] hidden h-[2px] md:block">
              <svg viewBox="0 0 100 2" preserveAspectRatio="none" className="draw-in block size-full text-bronze" fill="none" stroke="currentColor">
                <path d="M0 1H100" strokeWidth="1.2" pathLength={1} />
              </svg>
            </div>
            <ol className="relative grid gap-10 md:grid-cols-3">
              {[
                { role: 'Landowner', name: project.landowner, text: 'Brings the prime land at Lot 32170, Kg. Pusar Ulak, in the heart of the capital.' },
                { role: 'Developer', name: project.developer, text: 'The developer of 18th Avenue. Construction began in July 2024, on an estimated three-year programme.' },
                { role: 'Architect & master planner', name: project.architect, text: 'Singapore based, Temasek owned: designed the “bungalows in the air”.' },
              ].map((p, i) => (
                <li key={p.name} className="flex flex-col items-center text-center">
                  <span className="num grid size-28 place-items-center rounded-full border border-bronze bg-ivory text-3xl text-bronze">{String(i + 1).padStart(2, '0')}</span>
                  <p className="eyebrow mt-6 text-bronze">{p.role}</p>
                  <p className="display mt-2 text-[clamp(1.8rem,2.6vw,2.4rem)]">{p.name}</p>
                  <p className="body mt-3 max-w-xs">{p.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* We Build Value */}
      <section className="on-dark bg-night py-28 text-ivory md:py-40" data-tone="dark" aria-labelledby="value-title">
        <div className="wrap grid gap-12 md:grid-cols-12 md:items-end">
          <h2 id="value-title" className="display h-xl md:col-span-7">
            We Build <em>Value.</em>
          </h2>
          <p className="lede text-ivory/80 md:col-span-5">{about.valueBody}</p>
        </div>
      </section>

      {/* Features of development */}
      <section className="py-24 md:py-36" data-tone="light" aria-labelledby="features-title">
        <div className="wrap">
          <p className="eyebrow mb-5 text-bronze">Features of development</p>
          <h2 id="features-title" className="display h-lg max-w-3xl">
            Designed by Surbana Jurong, <em>built for living.</em>
          </h2>
          <ul className="mt-16 grid gap-12 md:grid-cols-3">
            {features.map((f) => {
              const D = DIAGRAMS[f.id];
              return (
                <li key={f.id} className="reveal flex flex-col gap-5">
                  <div className="rounded-md border border-line bg-paper p-6 text-ink">
                    <D />
                  </div>
                  <h3 className="display h-sm">{f.title}</h3>
                  <p className="body">{f.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Attractions */}
      <section className="bg-paper py-24 md:py-36" data-tone="light" aria-labelledby="attractions-title">
        <div className="wrap">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="eyebrow mb-5 text-bronze">Our attractions</p>
              <h2 id="attractions-title" className="display h-lg">
                A new <em>happy place.</em>
              </h2>
            </div>
            <p className="body md:col-span-5">Eleven reasons, in the developer’s own words.</p>
          </div>
          <ol className="mt-14 grid border-t border-line sm:grid-cols-2 lg:grid-cols-3">
            {attractions.map((a, i) => (
              <li key={a.title} className="reveal flex gap-5 border-b border-line py-8 sm:pr-8">
                <span className="num text-2xl text-bronze">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-serif text-2xl leading-tight">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32" data-tone="light" aria-label="Next steps">
        <div className="wrap flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <h2 className="display h-lg max-w-2xl">
            Find the home that <em>fits.</em>
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/residences" className="btn btn-solid">
              Explore residences <ArrowRight size={14} />
            </Link>
            <Link href="/#contact" className="btn">
              Register interest
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
