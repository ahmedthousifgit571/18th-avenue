import { clips, stills, textures, type Still } from './cinema';
import { media } from './media';
import { layouts, towers, sqft, type TowerId } from './units';

/**
 * Copy for the Belgrade-Arbor-style home page, section by section.
 * `live` = quoted from 18thavenue.com.bn (or its film), `condensed` = live wording shortened, `ours` = new pitch
 * wording to confirm with the client (also listed in the README).
 */

type Img = Still | { src: string; width: number; height: number };

// ours (mirrors the reference's "BELGRADE ARBOR DESIGN" kicker)
export const intro = {
  chapters: [
    {
      kicker: '18th Avenue design',
      // condensed from the live About page
      text: 'Designed by the award-winning Surbana Jurong, 18th Avenue recreates the spacious living of “bungalows in the air”: only two detached homes on every floor.',
      cards: [stills.towersStreet, stills.dropOff] as Img[],
    },
    {
      kicker: 'In the heart of the capital',
      // condensed from the live home page
      text: 'In the heart of Bandar Seri Begawan, 18th Avenue stands as an epitome of modern lifestyle homes: private and tranquil, resort-like, and well-connected to the city.',
      cards: [media.flat.living, media.flat.dining] as Img[],
    },
  ],
  // live tagline
  title: ['Your sky-high', 'sanctuary'],
  // condensed from the live home page
  body: 'The development sits on 2.5 acres in the very heart of the city: 5 towers, 18 levels, 159 private, exclusive luxury apartments and 17 retail units, with a wide range of choices at affordable prices.',
} as const;

// condensed from the live About page ("a person’s home is their castle…")
export const locationCopy = {
  text: 'A home should be close to wherever you need to be. Whether you work in the city or unwind with your loved ones, 18th Avenue sits at the heart of the capital, on Lot 32170 in Kg. Pusar Ulak, Mukim Kianggeh.',
  card: media.landmarks['taman-mahkota'] as Img,
};

/** "What's around": ids from landmarks.ts; minutes from travel.json (OSRM), Crown Park keeps the live claim. */
export const around = ['crown-park', 'mosque', 'kampong-ayer', 'kianggeh', 'jubli-perak', 'ripas', 'airport'] as const;

// live (About page welcome)
export const residencesCopy = {
  text: 'Here at 18th Avenue, we provide modern homes catered to diverse demographics and lifestyles. Whether you are a go-getter looking for an efficient location to the city, or a family looking for a tranquil lifestyle, our residence gives you a versatile space to come home to.',
  card: media.flat.living as Img,
  backdrop: textures.silk,
};

const range = (id: TowerId) => {
  const t = towers[id - 1];
  return t.sizes[0] === t.sizes[1] ? `${sqft(t.sizes[0])} sq ft` : `${sqft(t.sizes[0])} – ${sqft(t.sizes[1])} sq ft`;
};
// The live table's "+1" is the utility room (only layouts with a utility area carry it), so it stays "+ 1".
const bedLabel = (b: string) => b.replace('BR', ' Bedroom').replace('+1', ' + 1');

/** One option per tower type (each tower has its own layout family), all figures from units.ts. */
export const residenceOptions = towers.map((t) => {
  const typical = layouts.find((l) => l.tower === t.id && !l.ground)!;
  return {
    id: t.id,
    label: `Type ${t.id}`,
    homes: t.homes,
    beds: t.bedrooms.map(bedLabel).join(' · '),
    sizes: range(t.id),
    floors: `Floors 1 – ${typical.floorTo}`,
  };
});

/** The show-flat renders (one flat, a Type 5 Ground B home), for the residence slider. */
export const showFlat: { img: Img; caption: string }[] = [
  { img: media.flat.living, caption: 'Living' },
  { img: media.flat.dining, caption: 'Dining' },
  { img: media.flat['view-kitchen'], caption: 'View to kitchen' },
  { img: media.flat.bedroom, caption: 'Bedroom' },
  { img: media.flat['master-1'], caption: 'Master bedroom' },
  { img: media.flat.bath, caption: 'Bath' },
];

export const retailCopy = {
  // live: the film's closing line "Shop, dine, play and live at 18th Avenue, your all-in-one"
  title: ['Shop, dine,', 'play & live'],
  // condensed from the live "Integrated Shop Units" attraction and the unit count
  text: 'An integrated row of adjacent shops for retail and eateries, for residents’ convenience: 17 retail units at the foot of the towers.',
  // The developer's photoreal render of the shop row (live site: "Perspective of the Additional Shop & Tennis Court"),
  // in place of the film's animated café. The shops are not built yet, so no photograph exists.
  card: media.exterior.shops as Img,
  cardAlt: 'The shop row at the foot of the towers: a pizza place, minimart and coffee shops, artist’s impression',
  // Frames the coffee shop and the minimart in the 1.43 card.
  cardPosition: '64% 58%',
};

export const towerOptions = towers.map((t) => {
  const list = layouts.filter((l) => l.tower === t.id);
  const typical = list.find((l) => !l.ground)!;
  return {
    id: t.id,
    label: `Tower ${t.id}`,
    homes: t.homes,
    perFloor: t.perFloor,
    text: `${typical.type} layouts, ${t.bedrooms.map(bedLabel).join(' and ').toLowerCase()}, ${range(t.id)} gross. Ground-floor homes and ${typical.floors.toLowerCase()}, ${t.perFloor === 1 ? 'one home' : 'two homes'} per floor.`,
  };
});

export const rootsCopy = {
  // live About tagline
  kicker: 'Your detached home in the sky',
  // live feature name
  title: 'Bungalows in the air',
  // condensed from the live "Features of Development"
  text: 'Private, exclusive and low density: one passenger lift serves only two homes on each floor. Drive straight to your designated carpark and up to your own private lift lobby.',
  card: media.flat.foyer as Img,
};

export const amenitiesCopy = {
  // condensed from the live "Fully equipped “Resort Like” facilities" attraction
  text: 'Fully equipped, resort-like facilities: a clubhouse, the lagoon pool, tennis court, gym and sauna, poolside gourmet dining, reading and entertainment rooms, an outdoor fitness station, a children’s playground and BBQ pavilion.',
  card: stills.gym as Img,
};

// Taglines are the live Facilities & Services lines; the pool line is from the client's film.
export const amenityOptions: { name: string; tagline: string; detail: string; img: Img }[] = [
  { name: 'Club House', tagline: 'Wind down and connect in every step.', detail: 'Concierge and lounge, the fitness gym and club facilities.', img: media.facilities.clubhouse },
  { name: 'Lagoon Pool', tagline: 'A refreshing swim in our lagoon pool.', detail: 'With sun decks, the kids’ splash and rest pavilions around it.', img: stills.poolDeck },
  { name: 'Gym', tagline: 'Relax and stay in shape.', detail: 'A fully equipped gym, plus the outdoor fitness station.', img: media.facilities.gym },
  { name: 'Gourmet Pavilion', tagline: 'Experience gourmet dining in privacy.', detail: 'Poolside dining for evenings with family and friends.', img: media.facilities['gourmet-dining'] },
  { name: 'Entertainment Pavilion', tagline: 'Catch your latest favourite flicks.', detail: 'A home-theatre lounge set in glass over the water.', img: media.facilities['entertainment-room'] },
  { name: 'Reading Room', tagline: 'Read or do work – your choice.', detail: 'A quiet room for reading and co-working.', img: media.facilities['reading-room'] },
];

// live figures
export const keyFacts = [
  { value: '5', label: 'Towers' },
  { value: '18', label: 'Levels' },
  { value: '159', label: 'Private residences' },
  { value: '17', label: 'Retail units' },
  { value: '2.5', label: 'Acres in the city centre' },
  { value: '99', label: 'Year single strata title' },
] as const;

/**
 * The Still/Form-style tour of one tower, layer by layer (Tower 1: the Type 1 plans are traced into the model).
 * Chapter names are ours; each `stat` is condensed from the live "Features of Development" and "Our Attractions".
 */
export const anatomyCopy = {
  marquee: '18th Avenue',
  prompt: 'Scroll to enter',
  card: { src: clips.hero.poster, width: clips.hero.width, height: clips.hero.height } as Img,
  cardAlt: 'The towers from the street, from the developer’s film',
  // ours
  eyebrow: 'Tower anatomy',
  chapters: [
    // live: "18 levels" and "Full basement carpark"
    { id: 'full', title: 'Full View', stat: 'Eighteen levels over a full basement' },
    // condensed live: "flat slabs, allowing … higher ceiling height"
    { id: 'slabs', title: 'Flat Slabs', stat: 'Higher ceilings, cleaner rooms' },
    // condensed live: "Shear wall design … bigger nett floor area"
    { id: 'walls', title: 'Shear Walls', stat: 'Bigger nett floor area' },
    // live: "one passenger lift serving only 2 units at each floor"
    { id: 'lift', title: 'Private Lift', stat: 'One lift serves only two homes' },
    // live About: "only 2 detached units per every floor"
    { id: 'homes', title: 'Two Homes a Floor', stat: 'Bungalows in the air' },
    // condensed live: "ample natural lighting, ventilation and all round views"
    { id: 'facade', title: 'Façade & Glass', stat: 'Natural light, all-round views' },
    // condensed live: "drive directly to their designated carpark leading to their private lift lobby"
    { id: 'basement', title: 'Basement', stat: 'Drive straight to your lift lobby' },
  ],
  // ours
  cta: {
    kicker: 'One tower, layer by layer',
    title: ['Now explore', 'all of 18th Avenue'],
    text: 'All five towers on the real plot in 3D: a tour of the site, the Bandar Seri Begawan sun path and a finish studio.',
    label: 'Explore the 3D experience',
    href: '/experience',
  },
} as const;

export type AnatomyChapterId = (typeof anatomyCopy.chapters)[number]['id'];
