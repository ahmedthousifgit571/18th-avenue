import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Work_Sans } from 'next/font/google';
import 'lenis/dist/lenis.css';
import './globals.css';
import SmoothScroll from '@/components/chrome/SmoothScroll';
import Header from '@/components/chrome/Header';
import Footer from '@/components/chrome/Footer';
import { InlineScript } from '@/components/ui/InlineScript';
import { project } from '@/content/project';

// Belgrade Arbor pairs Editorial Old with Work Sans. Instrument Serif is the closest free match to Editorial Old's
// narrow, high-contrast text and its calligraphic italic. (18th Avenue's own site uses Cormorant Garamond and
// Montserrat; swapping back is a change to these two loaders.)
const serif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--nf-serif',
  display: 'swap',
});
const sans = Work_Sans({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--nf-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(project.url),
  title: { default: `${project.name} | ${project.tagline}`, template: `%s | ${project.name}` },
  description: project.description,
  openGraph: { title: `${project.name}, Bandar Seri Begawan`, description: project.description, images: ['/media/cinema/hero-poster.webp'], type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#2e3a26',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // The inline script adds `js` to <html> before first paint (reveal states hide text only when JS will play them).
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html="document.documentElement.classList.add('js')" />
      </head>
      {/* Browser extensions (ColorZilla adds cz-shortcut-listen) write attributes onto <body> before hydration. */}
      <body suppressHydrationWarning>
        <SmoothScroll>
          <Header />
          {children}
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
