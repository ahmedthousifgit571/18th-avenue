import type { Metadata } from 'next';
import AboutView from '@/components/about/AboutView';
import Developer from '@/components/about/Developer';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Your Detached Home in the Sky: a joint development of Brunei Hotel and Unity Land Sdn Bhd, designed by Surbana Jurong, on Lot 32170 in the heart of Bandar Seri Begawan.',
};

export default function AboutPage() {
  return (
    <div>
      <AboutView />
      <Developer />
    </div>
  );
}
