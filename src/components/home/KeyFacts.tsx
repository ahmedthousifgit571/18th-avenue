'use client';

import Image from 'next/image';
import { useRef } from 'react';
import Pill from '@/components/ui/Pill';
import Reveal from '@/components/type/Reveal';
import { RiseWords } from '@/components/type/Split';
import { keyFacts } from '@/content/home';
import { media } from '@/content/media';
import { project } from '@/content/project';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';

/**
 * The reference's payment-plan panel, for the development's figures: the lagoon pool at dusk beside a pine
 * column of italic lime numbers that count up as they arrive.
 */
export default function KeyFacts() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const nums = gsap.utils.toArray<HTMLElement>('[data-count]');
        const st = ScrollTrigger.create({
          trigger: ref.current,
          start: 'top 60%',
          once: true,
          onEnter: () =>
            nums.forEach((el, i) => {
              const target = Number(el.dataset.count);
              const dp = el.dataset.count!.includes('.') ? 1 : 0;
              const o = { v: 0 };
              gsap.to(o, { v: target, duration: 1.6, delay: i * 0.12, ease: 'power3.out', onUpdate: () => (el.textContent = o.v.toFixed(dp)) });
            }),
        });
        gsap.fromTo('[data-row]', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 1, ease: 'avenue', scrollTrigger: { trigger: ref.current, start: 'top 60%' } });
        return () => st.kill();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative grid md:min-h-svh md:grid-cols-2" aria-labelledby="facts-title">
      <div className="relative min-h-[60svh] overflow-hidden bg-pine-deep md:min-h-0">
        <Image src={media.exterior.pool.src} alt="The lagoon pool and its glass pavilions at dusk, artist’s impression" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="bg-pine-glow wrap relative overflow-hidden pb-[8vh] pt-[8vh] text-cream md:pl-[6vw]">
        <div className="light-beams opacity-60" aria-hidden />
        <Reveal as="h2" id="facts-title" className="t-statement relative text-cream-dark">
          <RiseWords text="The development" />
        </Reveal>
        <dl className="relative mt-[5vh]">
          {keyFacts.map((f) => (
            <div key={f.label} data-row className="flex items-baseline gap-6 border-b border-cream/20 py-[1.6vh]">
              <dt className="sr-only">{f.label}</dt>
              <dd className="w-[7.5rem] shrink-0 font-serif text-[clamp(2.6rem,3.6vw,4.4rem)] italic leading-none text-lime" data-count={f.value}>
                {f.value}
              </dd>
              <dd className="text-[0.95rem] font-medium">{f.label}</dd>
            </div>
          ))}
        </dl>
        <p className="relative mt-6 max-w-[30rem] text-[0.8rem] text-cream/65">
          Construction began in {project.construction.commencement} and runs for about {project.construction.period}. Joint development of {project.landowner} and {project.developer}.
        </p>
        <Pill href="#contact" solid className="relative mt-[5vh]">
          Register interest
        </Pill>
      </div>
    </section>
  );
}
