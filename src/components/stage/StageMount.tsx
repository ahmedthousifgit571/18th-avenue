'use client';

import dynamic from 'next/dynamic';

// three.js and the scene load on the client only, in their own chunk.
const SiteStage = dynamic(() => import('./SiteStage'), { ssr: false });

export default function StageMount() {
  return <SiteStage />;
}
