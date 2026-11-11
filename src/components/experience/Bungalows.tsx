'use client';

import { useCallback, useRef, useState } from 'react';
import { useStageSection } from '@/lib/useStageSection';
import { features, project } from '@/content/project';

// Copy: headings are ours; the bodies are the live site's "Features of Development".
const STEPS = [
  { at: 0, kicker: `${project.architect} · Concept architect & master planner`, title: ['Bungalows', 'in the air.'], body: features[0].body },
  { at: 0.3, kicker: 'A typical floor of Tower 1', title: ['One lift.', 'Two homes.'], body: 'Unit A and Unit B share a private lift lobby, nothing else. Each home has its own foyer, corner glass and all-round views.' },
  { at: 0.56, kicker: 'Structure', title: ['Higher ceilings,', 'bigger rooms.'], body: features[2].body },
  { at: 0.8, kicker: 'Full basement car park', title: ['Drive home', 'to your lift.'], body: features[1].body },
];

export default function Bungalows() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [p, setP] = useState(0);
  const onProgress = useCallback((v: number) => {
    setP(v);
    let s = 0;
    STEPS.forEach((st, i) => v >= st.at && (s = i));
    setStep(s);
  }, []);
  useStageSection(ref, 'bungalow', { onProgress });

  return (
    <section ref={ref} data-tone="dark" className="on-dark pointer-events-none relative h-[520vh] text-ivory" aria-labelledby="bungalow-title">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-night/70 via-night/25 to-transparent md:w-[58%]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night/60 to-transparent md:hidden" />
        <div className="wrap relative flex h-full flex-col justify-end pb-14 md:justify-center md:pb-0">
          <div className="relative min-h-[19rem] max-w-xl md:min-h-[24rem]">
            {STEPS.map((s, i) => (
              <div
                key={s.kicker}
                className="absolute inset-x-0 bottom-0 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-avenue)] md:top-0 md:bottom-auto"
                style={{ opacity: step === i ? 1 : 0, transform: `translateY(${step === i ? 0 : step > i ? -24 : 24}px)` }}
                aria-hidden={step !== i}
              >
                <p className="eyebrow mb-5 text-champagne">{s.kicker}</p>
                <h2 id={i === 0 ? 'bungalow-title' : undefined} className="display h-lg">
                  {s.title[0]}
                  <br />
                  <em>{s.title[1]}</em>
                </h2>
                <p className="body mt-6 max-w-md">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress rail */}
        <div className="absolute right-[var(--gutter)] top-1/2 hidden -translate-y-1/2 flex-col items-end gap-4 md:flex">
          {STEPS.map((s, i) => (
            <div key={s.kicker} className="flex items-center gap-3">
              <span className={`eyebrow transition-opacity duration-500 ${step === i ? 'opacity-100' : 'opacity-40'}`}>0{i + 1}</span>
              <span className="h-px bg-ivory transition-all duration-700" style={{ width: step === i ? 40 : 16, opacity: step === i ? 1 : 0.4 }} />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-[var(--gutter)] bottom-5 h-px bg-ivory/15 md:bottom-8">
          <div className="h-full origin-left bg-champagne" style={{ transform: `scaleX(${p})` }} />
        </div>
      </div>
    </section>
  );
}
