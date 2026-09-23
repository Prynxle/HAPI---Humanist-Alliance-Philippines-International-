import './globals.css';
import './registration.css';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be set for production builds so Open Graph URLs resolve absolutely.');
}

export const metadata = {
  title: 'Discarding God | HAPI Conference 2026',
  description: '1st Secular Philosophical Paper Conference by Humanist Alliance Philippines, International.',
  icons: { icon: '/hapi.ico' },
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: '1st Secular Philosophical Paper Conference',
    description: '1st Secular Philosophical Paper Conference on the theme "Discarding God: Values in a Worldview Without Religion" — November 20, 2026 at The Ministry Lounge Bar & Cafe, Makati City.',
    url: '/',
    siteName: 'Humanist Alliance Philippines, International (HAPI)',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1536,
        height: 1024,
        alt: 'HAPI — 1st Secular Philosophical Paper Conference — Discarding God: Values in a Worldview Without Religion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '1st Secular Philosophical Paper Conference',
    description: '1st Secular Philosophical Paper Conference on the theme "Discarding God: Values in a Worldview Without Religion" — November 20, 2026 at The Ministry Lounge Bar & Cafe, Makati City.',
    images: [
      {
        url: '/og-image.png',
        alt: 'HAPI — 1st Secular Philosophical Paper Conference — Discarding God: Values in a Worldview Without Religion',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
