import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
