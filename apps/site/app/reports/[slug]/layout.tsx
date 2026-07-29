import { Barlow_Condensed, Source_Serif_4 } from 'next/font/google';
import './report.css';

// Self-hosted via next/font (no CDN <link> — that would cost a render-blocking
// round trip and leak the visit to Google Fonts on a confidential document).
// IBM Plex Mono is already loaded globally as --font-plex-mono; reused here.
const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
});

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${barlow.variable} ${sourceSerif.variable}`}>
      {children}
    </div>
  );
}
