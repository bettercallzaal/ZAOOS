import type { Metadata } from 'next';

const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og-nexus.png',
  button: {
    title: 'Explore ZAO Nexus',
    action: {
      type: 'launch_miniapp',
      url: 'https://zaoos.com/nexus',
    },
  },
});

export const metadata: Metadata = {
  title: 'ZAO Nexus | ZAO OS',
  description: 'Community resources — ZAO Nexus links to the member directory, calendar, and Respect leaderboard.',
  other: { 'fc:miniapp': miniAppEmbed },
};

export default function NexusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
