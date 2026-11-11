import type { Metadata } from 'next';
import StageMount from '@/components/stage/StageMount';
import ExperienceIntro from '@/components/experience/ExperienceIntro';
import Bungalows from '@/components/experience/Bungalows';
import Explorer from '@/components/experience/Explorer';
import LightStudy from '@/components/experience/LightStudy';
import FinishStudio from '@/components/experience/FinishStudio';

export const metadata: Metadata = {
  title: '3D Experience',
  description:
    'Explore 18th Avenue in 3D: the five towers on the real plot, bungalows in the air, seven chapters through the site plan, the Bandar Seri Begawan sun path and a finish studio.',
};

/** The reference keeps its 3D model on its own page; so does this site. One fixed WebGL canvas drives the chapters. */
export default function ExperiencePage() {
  return (
    <div className="relative bg-pine-deep">
      <StageMount />
      <main className="relative z-[2]">
        <ExperienceIntro />
        <Bungalows />
        <Explorer />
        <LightStudy />
        <FinishStudio />
      </main>
    </div>
  );
}
