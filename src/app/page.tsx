import Preloader from '@/components/chrome/Preloader';
import Hero from '@/components/home/Hero';
import Introduction from '@/components/home/Introduction';
import LocationScene from '@/components/home/LocationScene';
import Around from '@/components/home/Around';
import ResidencesIntro from '@/components/home/ResidencesIntro';
import ResidenceOptions from '@/components/home/ResidenceOptions';
import CinemaStatement from '@/components/home/CinemaStatement';
import TowerOptions from '@/components/home/TowerOptions';
import TowerAnatomy from '@/components/home/TowerAnatomy';
import Roots from '@/components/home/Roots';
import AmenityOptions from '@/components/home/AmenityOptions';
import ViewFromAbove from '@/components/home/ViewFromAbove';
import KeyFacts from '@/components/home/KeyFacts';
import { clips } from '@/content/cinema';
import { amenitiesCopy, retailCopy } from '@/content/home';

/** Home, in the order of belgradearbor.rs: film, pinned introduction, location, residences, shops, towers (then
 * Still/Form's 3D tour of one tower, layer by layer), the signature, amenities, the view from above and the figures (the register form is in the footer). */
export default function Home() {
  return (
    <>
      <main className="relative">
        <Hero />
        <Introduction />
        <LocationScene />
        <Around />
        <ResidencesIntro />
        <ResidenceOptions />
        <CinemaStatement
          id="retail"
          layout="retail"
          clip={clips.retail}
          clipLabel="The shop street at the foot of the towers, from the developer's film"
          card={{ src: retailCopy.card.src, alt: retailCopy.cardAlt, position: retailCopy.cardPosition }}
          title={[...retailCopy.title]}
          text={retailCopy.text}
          tint="from-pine-deep/80 via-pine-deep/35 to-pine-deep/45"
        />
        <TowerOptions />
        <TowerAnatomy />
        <Roots />
        <CinemaStatement
          id="amenities"
          layout="amenities"
          clip={clips.amenities}
          clipLabel="The lagoon pool deck and the glass pool pavilions, from the developer's film"
          card={{ src: amenitiesCopy.card.src, alt: 'The fitness gym, from the developer’s film' }}
          title={['Amenities']}
          text={amenitiesCopy.text}
        />
        <AmenityOptions />
        <ViewFromAbove />
        <KeyFacts />
      </main>
      <Preloader />
    </>
  );
}
