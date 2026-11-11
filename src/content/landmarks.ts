import type { media } from './media';

/**
 * Places named by the live site: the "Prime Location" list, the Landmarks page and the location map (Radisson,
 * Kianggeh market, schools). `query` is what scripts/travel-times.mjs geocodes (or `coord` where geocoding is
 * ambiguous). Minutes come from OSRM routing on OpenStreetMap data: approximate, free-flow, not live traffic.
 * Golden Jubilee Crown Park keeps the live site's own claim: "5 minutes walk".
 */
export type LandmarkGroup = 'Culture' | 'Parks & river' | 'Everyday' | 'Connections';

export type Landmark = {
  id: string;
  name: string;
  group: LandmarkGroup;
  query?: string;
  coord?: [number, number];
  blurb?: string;
  photo?: keyof typeof media.landmarks;
  /** Use walking time as the headline figure (it is closer on foot than the drive suggests). */
  walk?: boolean;
  /** A figure published by the client, shown instead of the computed one. */
  claim?: { minutes: number; mode: 'walk' | 'drive'; note: string };
};

export const landmarks: Landmark[] = [
  {
    id: 'crown-park',
    name: 'Golden Jubilee Crown Park',
    group: 'Parks & river',
    query: 'Taman Mahkota Jubli Emas, Bandar Seri Begawan',
    blurb: 'The eco-corridor riverfront public park.',
    photo: 'taman-mahkota',
    walk: true,
    claim: { minutes: 5, mode: 'walk', note: 'Published by 18th Avenue' },
  },
  {
    id: 'mosque',
    name: 'Sultan Omar Ali Saifuddien Mosque',
    group: 'Culture',
    query: 'Omar Ali Saifuddien Mosque, Bandar Seri Begawan',
    blurb:
      'Built in 1958 and named after the 28th Sultan, it dominates the city centre: one of the most magnificent mosques in South East Asia.',
    photo: 'mosque',
  },
  {
    id: 'kianggeh',
    name: 'Tamu Kianggeh market',
    group: 'Everyday',
    query: 'Tamu Kianggeh, Bandar Seri Begawan',
  },
  {
    id: 'radisson',
    name: 'Radisson Hotel',
    group: 'Everyday',
    query: 'Radisson Hotel, Jalan Tasek, Bandar Seri Begawan',
    walk: true,
  },
  {
    id: 'cbd',
    name: 'Central business district',
    group: 'Connections',
    query: 'Yayasan Sultan Haji Hassanal Bolkiah Complex, Bandar Seri Begawan',
    blurb: 'Banks, offices and the Yayasan complex.',
  },
  {
    id: 'jubli-perak',
    name: 'Taman Jubli Perak Sultan Haji Hassanal Bolkiah',
    group: 'Parks & river',
    query: 'Taman Jubli Perak, Bandar Seri Begawan',
    photo: 'taman-jubli-perak',
    walk: true,
  },
  {
    id: 'kampong-ayer',
    name: 'Kampong Ayer',
    group: 'Culture',
    query: 'Kampong Ayer Cultural and Tourism Gallery, Bandar Seri Begawan',
    blurb:
      'The “Venice of the East”: historic houses on stilts across the Brunei River, home to about 30,000 people.',
    photo: 'kampong-ayer',
  },
  {
    id: 'river',
    name: 'Brunei River cruise',
    group: 'Parks & river',
    coord: [4.8858, 114.9412], // the Waterfront promenade on Jalan McArthur (not named in OSM)
    blurb: 'An evening on the river past historical and cultural sites, with dining on board.',
    photo: 'river-cruise',
  },
  {
    id: 'tasek-lama',
    name: 'Tasek Lama Recreational Park',
    group: 'Parks & river',
    query: 'Taman Peraginan Tasek Lama',
  },
  {
    id: 'schools',
    name: 'Prestigious schools',
    group: 'Everyday',
    query: 'Sekolah Tinggi Perempuan Raja Isteri, Bandar Seri Begawan',
    blurb: 'STPRI, SMSA and Politeknik Brunei nearby.',
    walk: true,
  },
  {
    id: 'ripas',
    name: 'RIPAS Hospital',
    group: 'Everyday',
    query: 'RIPAS Hospital, Bandar Seri Begawan',
  },
  {
    id: 'muzium',
    name: 'Brunei Muzium',
    group: 'Culture',
    query: 'Brunei Museum, Kota Batu',
  },
  {
    id: 'gadong',
    name: 'Gadong shopping malls',
    group: 'Everyday',
    query: 'The Mall Gadong, Bandar Seri Begawan',
    blurb: 'The Mall, Gadong night market and the Cineplex.',
  },
  {
    id: 'palace',
    name: 'Istana Nurul Iman',
    group: 'Culture',
    query: 'Istana Nurul Iman, Bandar Seri Begawan',
    blurb: 'The Royal Palace on the Brunei River.',
  },
  {
    id: 'airport',
    name: 'Brunei International Airport',
    group: 'Connections',
    query: 'Brunei International Airport',
  },
  {
    id: 'golf',
    name: 'RBA Golf Course',
    group: 'Connections',
    coord: [4.9314, 114.9254], // the golf course below the airport (unnamed in OSM; on the client's map as RBA Golf Course)
  },
];

/** The centre of Lot 32170 (the construction site on Jalan Haji Basir, Kg. Pusar Ulak), located on satellite imagery. */
export const SITE_COORD: [number, number] = [4.89493, 114.93705];
