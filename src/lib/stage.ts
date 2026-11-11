'use client';

import { useSyncExternalStore } from 'react';

/**
 * Shared state between the DOM sections and the WebGL stage on the home page.
 * Fast-changing values (scroll progress, drag) are read every frame straight from `stage`; React UI subscribes to the
 * slow ones (chapter, tower, finishes…) through `useStage`.
 */
export type Shot = 'hero' | 'bungalow' | 'explorer' | 'light' | 'towers' | 'room';
export type FinishSlot = 'floor' | 'walls' | 'joinery';
export type Finishes = Record<FinishSlot, string>;

export type StageState = {
  shot: Shot;
  /** 0–1 progress through the active shot's section. */
  progress: number;
  /** Is any 3D section on screen? The canvas idles otherwise. */
  visible: boolean;
  /** Opacity of the canvas layer (fades between 3D and DOM chapters). */
  fade: number;
  chapter: number;
  /** Hour of day for the light study, 5.5–21. */
  hour: number;
  tower: number;
  /** Highlighted floor on the selected tower (Residences page), 0 for none. */
  floor: number;
  hoverTower: number;
  hoverAmenity: string | null;
  finishes: Finishes;
  roomHour: number;
  selectedSurface: FinishSlot | null;
  dragging: boolean;
  ready: boolean;
  quality: 'high' | 'low';
  /** Shift the subject beside the page copy (home page). Off when the canvas sits in its own card. */
  framed: boolean;
};

const initial: StageState = {
  shot: 'hero',
  progress: 0,
  visible: true,
  fade: 1,
  chapter: 0,
  hour: 17.35,
  tower: 0,
  floor: 0,
  hoverTower: 0,
  hoverAmenity: null,
  finishes: { floor: 'marble', walls: 'warm-white', joinery: 'walnut' },
  roomHour: 17.35,
  selectedSurface: null,
  dragging: false,
  ready: false,
  quality: 'high',
  framed: true,
};

export const stage: StageState = { ...initial };

/** Pointer drag offsets, written by the canvas pointer handlers and eased back by the camera rig. */
export const drag = { yaw: 0, pitch: 0, vx: 0 };

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

export function setStage(patch: Partial<StageState>) {
  let changed = false;
  for (const k in patch) {
    const key = k as keyof StageState;
    if (stage[key] !== patch[key]) {
      (stage as Record<string, unknown>)[key] = patch[key];
      changed = true;
    }
  }
  if (changed) {
    version++;
    listeners.forEach((l) => l());
  }
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Subscribe a component to one slice of the stage. Selectors must return primitives or stable references. */
export function useStage<T>(selector: (s: StageState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(stage),
    () => selector(initial),
  );
}

export const stageVersion = () => version;
