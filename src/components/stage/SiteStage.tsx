'use client';

import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import SiteScene from '@/three/site/SiteScene';
import { drag, setStage, stage, useStage } from '@/lib/stage';

/** Pauses rendering while no 3D chapter is on screen. */
function FrameGate() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const visible = useStage((s) => s.visible);
  useEffect(() => setFrameloop(visible ? 'always' : 'never'), [visible, setFrameloop]);
  return null;
}

/** Software renderers (headless, very old GPUs) get the light pipeline from the start. */
function QualityProbe() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const ctx = gl.getContext();
    const ext = ctx.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (/swiftshader|llvmpipe|software/i.test(name) || (coarse && window.devicePixelRatio > 2.5)) setStage({ quality: 'low' });
  }, [gl]);
  return null;
}

function Effects() {
  const quality = useStage((s) => s.quality);
  if (quality === 'low') return null;
  return (
    <EffectComposer multisampling={4}>
      {/*
        No `halfRes`: n8ao 2.0.1's half-res path uses a multi-target shim whose `.texture` is an array, and three ≥ r187
        throws on it every frame ("reading 'length'" in setupRenderTarget), which leaves the canvas blank.
        Full-res "performance" (8 samples) costs about what half-res "medium" did; PerformanceMonitor drops effects if it lags.
      */}
      <N8AO aoRadius={6} distanceFalloff={1.2} intensity={2.2} quality="performance" />
      <Bloom luminanceThreshold={0.92} luminanceSmoothing={0.2} intensity={0.55} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}

export default function SiteStage({ className = 'fixed inset-0 z-0' }: { className?: string }) {
  const fade = useStage((s) => s.fade);
  const visible = useStage((s) => s.visible);
  const quality = useStage((s) => s.quality);
  const last = useRef<{ x: number; y: number; id: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    last.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    setStage({ dragging: true });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const l = last.current;
    if (!l || l.id !== e.pointerId) return;
    const dx = e.clientX - l.x;
    const dy = e.clientY - l.y;
    l.x = e.clientX;
    l.y = e.clientY;
    drag.yaw = THREE.MathUtils.clamp(drag.yaw - dx * 0.0042, -1.4, 1.4);
    // Touch drags only turn the model sideways; vertical swipes stay page scrolls.
    if (e.pointerType !== 'touch') drag.pitch = THREE.MathUtils.clamp(drag.pitch - dy * 0.003, -0.5, 0.5);
  };
  const onUp = () => {
    last.current = null;
    setStage({ dragging: false });
  };

  return (
    <div
      className={className}
      style={{ opacity: fade, visibility: visible || fade > 0.01 ? 'visible' : 'hidden', touchAction: 'pan-y' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      data-cursor="drag"
      aria-hidden
    >
      <Canvas
        shadows
        dpr={quality === 'low' ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: quality === 'low', powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping }}
        camera={{ fov: 30, near: 1, far: 3200, position: [-160, 96, 160] }}
      >
        <PerformanceMonitor onDecline={() => stage.quality !== 'low' && setStage({ quality: 'low' })} />
        <QualityProbe />
        <FrameGate />
        <Suspense fallback={null}>
          <SiteScene />
          <Effects />
        </Suspense>
      </Canvas>
    </div>
  );
}
