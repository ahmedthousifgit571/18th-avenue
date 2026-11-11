import type { media } from './media';

/**
 * The show-flat renders from the live home page. There they pop up from hotspots on the Type 5 Ground B plan; the
 * captions are the live ones, except "view-kitchen", which the live site labels a second "BATH" although the
 * image shows the kitchen island (its filename is VIEW-TO-KITCHEN). `at` places each hotspot on plans/t5-gb.
 */
export type Interior = {
  id: keyof typeof media.flat;
  caption: string;
  room: string;
  at: [number, number];
  /** ours: one quiet line per room for the walk-through. */
  line: string;
};

export const interiors: Interior[] = [
  { id: 'foyer', caption: 'Foyer', room: 'Foyer', at: [0.15, 0.45], line: 'A private lift opens onto your own front door.' },
  { id: 'view-wet-kitchen', caption: 'View to wet kitchen', room: 'Kitchen', at: [0.41, 0.42], line: 'The island opens the kitchen to the dining room.' },
  { id: 'wet-kitchen', caption: 'Wet kitchen', room: 'Kitchen', at: [0.36, 0.57], line: 'Built-in cabinets, ready for the first meal.' },
  { id: 'dining', caption: 'Dining', room: 'Dining', at: [0.55, 0.57], line: 'Long tables, warm pendants, full-height glass.' },
  { id: 'living', caption: 'Living', room: 'Living', at: [0.38, 0.28], line: 'The city on one side, the garden canopy on the other.' },
  { id: 'view-kitchen', caption: 'View to kitchen', room: 'Living', at: [0.49, 0.37], line: 'One open room from the sofa to the stove.' },
  { id: 'bedroom', caption: 'Bedroom', room: 'Bedroom 1', at: [0.66, 0.24], line: 'Corner glass and a wardrobe wall.' },
  { id: 'master-1', caption: 'Master bedroom', room: 'Master bedroom', at: [0.85, 0.37], line: 'Morning light, high ceilings, nothing overhead.' },
  { id: 'master-2', caption: 'Master bedroom', room: 'Walk-in wardrobe', at: [0.8, 0.5], line: 'A dressing room framed in glass and champagne metal.' },
  { id: 'bath', caption: 'Bath', room: 'Master bath', at: [0.81, 0.66], line: 'Stone, timber and a frameless shower.' },
];
