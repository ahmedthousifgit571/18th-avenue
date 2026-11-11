'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { setStage, stage, type Shot } from '@/lib/stage';

const onScreen = new Set<string>();

/**
 * Connects a home-page section to the WebGL stage:
 * - while the section holds the middle of the viewport, it owns the shot;
 * - its scroll progress (top of section at top of viewport → bottom at bottom) is written to `stage.progress`;
 * - the canvas keeps rendering only while at least one 3D section is on screen.
 * Sections are tall, with a CSS-sticky inner frame, so no GSAP pin spacers are involved.
 */
export function useStageSection(
  ref: React.RefObject<HTMLElement | null>,
  shot: Shot,
  opts: { onProgress?: (p: number) => void; startAtTop?: boolean } = {},
) {
  const { onProgress, startAtTop } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const id = `${shot}-${Math.random().toString(36).slice(2, 7)}`;
    const owner = ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (self.isActive) setStage({ shot });
      },
    });
    const progress = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: startAtTop ? 'bottom top' : 'bottom bottom',
      onUpdate: (self) => {
        if (stage.shot === shot) setStage({ progress: self.progress });
        onProgress?.(self.progress);
      },
      onToggle: (self) => {
        if (self.isActive && stage.shot === shot) setStage({ progress: self.progress });
      },
    });
    const vis = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) onScreen.add(id);
        else onScreen.delete(id);
        setStage({ visible: onScreen.size > 0 });
      },
    });
    // Initial state (e.g. a reload part-way down the page).
    if (owner.isActive) setStage({ shot, progress: progress.progress });
    if (vis.isActive) onScreen.add(id);
    setStage({ visible: onScreen.size > 0 });
    return () => {
      owner.kill();
      progress.kill();
      vis.kill();
      onScreen.delete(id);
      setStage({ visible: onScreen.size > 0 });
    };
  }, [ref, shot, onProgress, startAtTop]);
}
