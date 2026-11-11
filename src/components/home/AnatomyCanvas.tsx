'use client';

import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import AnatomyScene from '@/three/anatomy/AnatomyScene';
import { anatomyDrag } from '@/three/anatomy/state';

/** The anatomy tour's own WebGL canvas (loaded on the client only, in its own chunk, when the section nears). */
export default function AnatomyCanvas({ chapter, outro, running, onReady }: { chapter: number; outro: boolean; running: boolean; onReady: () => void }) {
  const last = useRef<{ x: number; y: number; id: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    last.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    anatomyDrag.dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const l = last.current;
    if (!l || l.id !== e.pointerId) return;
    anatomyDrag.yaw = THREE.MathUtils.clamp(anatomyDrag.yaw - (e.clientX - l.x) * 0.0045, -1.6, 1.6);
    // Touch drags only turn the tower; vertical swipes stay page scrolls.
    if (e.pointerType !== 'touch') anatomyDrag.pitch = THREE.MathUtils.clamp(anatomyDrag.pitch - (e.clientY - l.y) * 0.003, -0.45, 0.45);
    l.x = e.clientX;
    l.y = e.clientY;
  };
  const onUp = () => {
    last.current = null;
    anatomyDrag.dragging = false;
  };

  return (
    <div
      className="absolute inset-0"
      style={{ touchAction: 'pan-y' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      data-cursor="drag"
      aria-hidden
    >
      <Canvas
        shadows
        dpr={[1, 1.6]}
        frameloop={running ? 'always' : 'never'}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping }}
        camera={{ fov: 30, near: 1, far: 2600, position: [-62, 16, 118] }}
      >
        <Suspense fallback={null}>
          <AnatomyScene chapter={chapter} outro={outro} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
