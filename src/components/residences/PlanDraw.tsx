'use client';

import Image from 'next/image';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import plans from '@/content/plans.json';
import { media } from '@/content/media';
import type { Layout } from '@/content/units';

/**
 * Draws a layout live: the walls traced from the client's drawing are stroked in, filled, then the original plan
 * (furniture, labels, dimensions) fades in underneath and the trace steps back.
 */
export default function PlanDraw({ layout }: { layout: Layout }) {
  const [run, setRun] = useState(0);
  const trace = plans[layout.plan as keyof typeof plans];
  const img = media.plans[layout.plan];
  return (
    <div className="relative">
      <div key={`${layout.id}-${run}`} className="plan-draw relative overflow-hidden rounded-md bg-paper" style={{ aspectRatio: `${img.width}/${img.height}` }}>
        <Image src={img.src} alt={`${layout.label} floor plan`} fill sizes="(min-width: 1024px) 40vw, 92vw" className="plan-img object-contain mix-blend-multiply" />
        {trace && (
          <svg viewBox={`0 0 ${trace.w} ${trace.h}`} className="plan-trace absolute inset-0 size-full" aria-hidden>
            <path d={trace.d} pathLength={1} />
          </svg>
        )}
      </div>
      <button type="button" onClick={() => setRun((r) => r + 1)} className="eyebrow absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-paper/90 px-3 py-1.5 text-mute backdrop-blur hover:text-ink">
        <RotateCcw size={12} /> Redraw
      </button>
    </div>
  );
}
