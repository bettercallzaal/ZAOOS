import type { Metadata } from 'next';

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

export const metadata: Metadata = {
  title: 'ZAO OS Mini App',
  description: 'The ZAO Community on Farcaster — gated music community mini app',
  other: {
    'fc:miniapp': miniAppEmbed,
  },
};

// Never cache the miniapp entry HTML — Farcaster client + SW were serving
// stale builds where sdk.actions.ready() never fired, leaving users stuck on
// the native splash screen.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
