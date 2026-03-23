import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';
import { getWagmiConfig } from '@/lib/wagmi/config';
import './globals.css';
import { Providers } from './providers';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og.png',
  button: {
    title: 'Open ZAO OS',
    action: {
      type: 'launch_miniapp',
      url: 'https://zaoos.com',
      name: 'ZAO OS',
      splashImageUrl: 'https://zaoos.com/splash.png',
      splashBackgroundColor: '#0a1628',
    },
  },
});

export const metadata: Metadata = {
  metadataBase: new URL('https://zaoos.com'),
  title: 'ZAO OS',
  description: 'The ZAO Community on Farcaster — gated chat for ZAO members',
  openGraph: {
    title: 'ZAO OS',
    description: 'The ZAO Community on Farcaster — gated chat for ZAO members',
    url: 'https://zaoos.com',
    siteName: 'ZAO OS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZAO OS',
    description: 'The ZAO Community on Farcaster — gated chat for ZAO members',
  },
  other: {
    'fc:miniapp': miniAppEmbed,
    'fc:frame': miniAppEmbed,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a1628',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const initialState = cookieToInitialState(
    getWagmiConfig(),
    headersList.get('cookie')
  );

  return (
    <html lang="en">
      <head>
        <meta property="csp-nonce" content={nonce} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers wagmiInitialState={initialState}>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
