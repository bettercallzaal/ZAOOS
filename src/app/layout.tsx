import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';
import { getWagmiConfig } from '@/lib/wagmi/config';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { MiniAppReady } from '@/components/miniapp/MiniAppReady';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og',
  button: {
    title: 'Open ZAO OS',
    action: {
      type: 'launch_miniapp',
      url: 'https://zaoos.com/miniapp',
      name: 'ZAO OS',
      splashImageUrl: 'https://zaoos.com/splash.png',
      splashBackgroundColor: '#0a1628',
    },
  },
});

const SITE_DESCRIPTION =
  'The ZAO on Farcaster — a decentralized music community on Base with channel chat, encrypted XMTP DMs, shared listening, on-chain governance, reputation, and ZABAL tokens.';

export const metadata: Metadata = {
  metadataBase: new URL('https://zaoos.com'),
  title: { default: 'ZAO OS', template: '%s · ZAO OS' },
  description: SITE_DESCRIPTION,
  applicationName: 'ZAO OS',
  authors: [{ name: 'The ZAO', url: 'https://thezao.xyz' }],
  creator: 'The ZAO',
  publisher: 'The ZAO',
  category: 'social',
  keywords: [
    'The ZAO',
    'ZAO OS',
    'Farcaster',
    'Base chain',
    'decentralized music',
    'music community',
    'music DAO',
    'XMTP',
    'ZABAL token',
    'onchain governance',
    'Farcaster mini app',
    'Web3 community',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'ZAO OS',
    description: SITE_DESCRIPTION,
    url: 'https://zaoos.com',
    siteName: 'ZAO OS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZAO OS',
    description: SITE_DESCRIPTION,
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const initialState = cookieToInitialState(getWagmiConfig(), headersList.get('cookie'));

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
        <MiniAppReady />
        <Providers wagmiInitialState={initialState}>{children}</Providers>
        <ServiceWorkerRegistration />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
