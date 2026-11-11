/**
 * Full-bleed loops and stills cut from Unity Land's own 18th Avenue film by scripts/make-cinema.mjs (watermark and
 * burned-in subtitles cropped out), plus the procedural backdrops from scripts/make-textures.mjs.
 * All imagery is the developer's artist's impression.
 */
/** `src` is H.264 (plays everywhere); `av1`, when present, is the sharper, lighter encode browsers try first. */
export type Clip = { src: string; av1?: string; poster: string; width: number; height: number };
export type Still = { src: string; width: number; height: number };

const clip = (name: string, width: number, height: number): Clip => ({
  src: `/media/cinema/${name}.mp4`,
  poster: `/media/cinema/${name}.webp`,
  width,
  height,
});
const still = (name: string): Still => ({ src: `/media/cinema/still-${name}.webp`, width: 1920, height: 724 });

export const clips = {
  /** Street-level towers against the sky: graded, slowed to an eased drift, pendulum loop (see make-cinema.mjs). */
  hero: { src: '/media/cinema/hero.mp4', av1: '/media/cinema/hero.av1.mp4', poster: '/media/cinema/hero-poster.webp', width: 1920, height: 884 },
  /** Aerial orbit around the five towers in their neighbourhood. */
  location: clip('location', 1600, 604),
  /** The shop street. */
  retail: clip('retail', 1600, 604),
  /** Lagoon pool deck, then the glass pool pavilions. */
  amenities: clip('amenities', 1600, 604),
} as const;

export const stills = {
  towersStreet: still('towers-street'),
  aerial: still('aerial'),
  towerTop: still('tower-top'),
  dropOff: still('drop-off'),
  poolDeck: still('pool-deck'),
  kidsPool: still('kids-pool'),
  gym: still('gym'),
  pavilion: still('pavilion'),
  gourmet: still('gourmet'),
  bbq: still('bbq'),
  shops: still('shops'),
  coffee: still('coffee'),
  living: still('living'),
  windowView: still('window-view'),
  kitchen: still('kitchen'),
} as const;

/** The film's end card: the towers drawn on white. Blended onto the footer sky with mix-blend-mode: multiply. */
export const endcard: Still = { src: '/media/cinema/endcard-towers.webp', width: 1000, height: 770 };

export const textures = {
  silk: { src: '/media/textures/silk.webp', width: 1920, height: 1080 },
  /** The client's site plan, painted out and with the roof labels removed. 12.4 px per metre. */
  aerial: { src: '/media/textures/aerial.webp', width: 2027, height: 1416 },
  clouds: ['/media/textures/cloud-a.webp', '/media/textures/cloud-b.webp', '/media/textures/cloud-c.webp'],
} as const;
