'use client';

import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import Room, { look } from './Room';
import { setStage, useStage } from '@/lib/stage';

function Gate({ active }: { active: boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => setFrameloop(active ? 'always' : 'never'), [active, setFrameloop]);
  return null;
}

/** The show-room canvas: its own small WebGL context, only rendering while its section is on screen. */
export default function RoomStage({ active }: { active: boolean }) {
  const finishes = useStage((s) => s.finishes);
  const low = useStage((s) => s.quality === 'low');
  const last = useRef<{ x: number; y: number; id: number } | null>(null);

  return (
    <div
      className="absolute inset-0"
      style={{ touchAction: 'pan-y' }}
      data-cursor="look"
      onPointerDown={(e) => {
        last.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        setStage({ dragging: true });
      }}
      onPointerMove={(e) => {
        const l = last.current;
        if (!l || l.id !== e.pointerId) return;
        look.yaw = THREE.MathUtils.clamp(look.yaw + (e.clientX - l.x) * 0.0035, -0.9, 0.9);
        if (e.pointerType !== 'touch') look.pitch = THREE.MathUtils.clamp(look.pitch + (e.clientY - l.y) * 0.0025, -0.35, 0.3);
        l.x = e.clientX;
        l.y = e.clientY;
      }}
      onPointerUp={() => {
        last.current = null;
        setStage({ dragging: false });
      }}
      onPointerCancel={() => {
        last.current = null;
        setStage({ dragging: false });
      }}
    >
      <Canvas
        shadows
        dpr={low ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
        camera={{ fov: 52, near: 0.05, far: 200, position: [3.55, 1.55, 2.85] }}
      >
        <Gate active={active} />
        <Suspense fallback={null}>
          <Room finishes={finishes} />
        </Suspense>
      </Canvas>
    </div>
  );
}
