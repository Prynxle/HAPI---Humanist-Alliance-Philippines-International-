import './globals.css';
import './registration.css';

export const metadata = {
  title: 'Discarding God | HAPI Conference 2026',
  description: '1st Secular Philosophical Paper Conference by Humanist Alliance Philippines, International.',
  icons: { icon: '/hapi.ico' },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
