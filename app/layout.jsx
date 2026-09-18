import './globals.css';
import './qa.css';

export const metadata = {
  title: 'Join HAPI — Humanist Alliance Philippines, International',
  description: 'A humanist community for curious minds, kind action, and a more human future.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
