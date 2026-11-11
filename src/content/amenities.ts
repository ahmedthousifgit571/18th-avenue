import type { media } from './media';

/**
 * The site-plan legend, word for word from the live home page ("Layout Plan").
 * `at` is the marker position on public/media/plans/site-layout.webp as a fraction of width/height: the orange
 * dots were detected automatically (colour blobs), the white letter rings read off by hand. The 3D scene converts the same points into metres.
 */
export type Amenity = {
  key: string;
  name: string;
  detail?: string[];
  /** Marker position(s) on the drawing; a few items are marked twice. */
  at: [number, number][];
  zone: 'arrival' | 'lagoon' | 'gardens' | 'sport' | 'service' | 'club';
  photo?: keyof typeof media.facilities;
};

export const amenities: Amenity[] = [
  { key: '1', name: 'Club House', detail: ['Concierge & lounge', 'Fitness Gym', 'Club Toilets'], at: [[0.323, 0.563]], zone: 'club', photo: 'clubhouse' },
  { key: '2', name: 'Cascading Water Feature', at: [[0.374, 0.575]], zone: 'gardens' },
  { key: '3', name: 'Eco pond', at: [[0.398, 0.509]], zone: 'gardens' },
  { key: '4', name: 'Gourmet Pavillion', at: [[0.453, 0.563]], zone: 'lagoon', photo: 'gourmet-dining' },
  { key: '5', name: 'Entertainment Pavillion', at: [[0.508, 0.563]], zone: 'lagoon', photo: 'entertainment-room' },
  { key: '6', name: 'Reading Room', at: [[0.565, 0.571]], zone: 'gardens', photo: 'reading-room' },
  { key: '7', name: 'Yoga Deck', at: [[0.565, 0.741]], zone: 'gardens' },
  { key: '8', name: 'Sensory Garden', at: [[0.199, 0.659]], zone: 'gardens' },
  { key: '9', name: 'Outdoor Gym', at: [[0.533, 0.727]], zone: 'sport' },
  { key: '10', name: 'Herb Garden', at: [[0.569, 0.643]], zone: 'gardens' },
  { key: '11', name: 'Sun Deck', at: [[0.49, 0.43], [0.717, 0.44]], zone: 'lagoon' },
  { key: '12', name: 'Lagoon Swimming Pool', at: [[0.549, 0.454]], zone: 'lagoon' },
  { key: '13', name: 'Kid’s Splash', at: [[0.775, 0.382]], zone: 'lagoon' },
  { key: '14', name: 'Barbeque Pavillion', at: [[0.76, 0.292]], zone: 'lagoon' },
  { key: '15', name: 'Kid’s Adventure Play', at: [[0.828, 0.36]], zone: 'sport' },
  { key: '16', name: 'Pool Toilets', at: [[0.763, 0.239]], zone: 'service' },
  { key: '17', name: 'Rest Pavillion', at: [[0.799, 0.469]], zone: 'lagoon' },
  { key: '18', name: 'Tennis Court', at: [[0.854, 0.635]], zone: 'sport' },
  { key: 'A', name: 'Guard House', at: [[0.12, 0.55]], zone: 'arrival' },
  { key: 'B', name: 'Grand Piazza Arrival', at: [[0.256, 0.533]], zone: 'arrival' },
  { key: 'C', name: 'Sheltered Walkway', at: [[0.406, 0.601]], zone: 'arrival' },
  { key: 'D', name: 'Plaza Steps to Shops', at: [[0.473, 0.7]], zone: 'arrival' },
  { key: 'E', name: 'Basement Carpark Ramp', at: [[0.237, 0.382], [0.142, 0.655]], zone: 'service' },
  { key: 'F', name: 'Electrical Sub-station', at: [[0.138, 0.35]], zone: 'service' },
  { key: 'G', name: 'Refuse Centre', at: [[0.128, 0.445]], zone: 'service' },
  { key: 'H', name: 'Service Entry', at: [[0.077, 0.415]], zone: 'service' },
  { key: 'I', name: 'Driveway Entry to Shops', at: [[0.077, 0.86], [0.816, 0.85]], zone: 'arrival' },
];

/** live: Facilities & Services cards (tagline, then name). */
export const facilities: { name: string; tagline: string; photo: keyof typeof media.facilities | 'foyer' }[] = [
  { name: 'Club House', tagline: 'Wind down and connect in every step.', photo: 'clubhouse' },
  { name: 'Coworking spaces', tagline: 'Read or do work – your choice.', photo: 'reading-room' },
  { name: 'Kitchen appliances', tagline: 'Never miss a meal.', photo: 'kitchen' },
  { name: 'Gym', tagline: 'Relax and stay in shape.', photo: 'gym' },
  { name: 'Gourmet Dining', tagline: 'Experience gourmet dining in privacy.', photo: 'gourmet-dining' },
  { name: 'Foyer', tagline: 'Grand entrance to grand relaxation.', photo: 'foyer' },
  { name: 'Entertainment Room', tagline: 'Catch your latest favourite flicks.', photo: 'entertainment-room' },
  { name: 'Dining Room', tagline: 'Experience cosy dining together.', photo: 'dining-room' },
  { name: 'Closet Space', tagline: 'Feel good. Look good.', photo: 'closet' },
];
