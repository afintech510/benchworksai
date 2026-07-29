import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import './globals.css';

// Display — Space Grotesk (600/700). Wired to --font-space-grotesk.
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

// Body — IBM Plex Sans (400/500/600).
const plexSans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

// Mono — IBM Plex Mono (labels, data, eyebrows).
const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BenchworksAI — AI Solutions for Business',
    template: '%s | BenchworksAI',
  },
  description:
    'BenchworksAI is a full-service digital team for local business — websites and platforms, SEO, Google Ads, email & SMS marketing, automation, chatbots, and AI education & training.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://benchworksai.com'),
  openGraph: {
    type: 'website',
    siteName: 'BenchworksAI',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
  },
};

// REV-032: Blocking inline script to prevent FOUC on theme load.
// Defaults to DARK unless the user has explicitly chosen light (persisted toggle wins).
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
