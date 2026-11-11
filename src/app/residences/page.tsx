import type { Metadata } from 'next';
import ResidencesView from '@/components/residences/ResidencesView';

export const metadata: Metadata = {
  title: 'Residences',
  description: 'All thirteen 18th Avenue layouts across five towers: floor plans, room areas and a 3D tower and floor picker.',
};

export default function ResidencesPage() {
  return <ResidencesView />;
}
