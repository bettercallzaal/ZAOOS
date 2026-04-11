import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal | THE ZAO',
  description: 'Explore The ZAO ecosystem. Music, social, governance, building, earning - find your portal.',
  openGraph: {
    title: 'Portal | THE ZAO',
    description: 'Explore The ZAO ecosystem. Find your portal into music, community, and web3.',
    url: 'https://zaoos.com/portal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal | THE ZAO',
    description: 'Explore The ZAO ecosystem. Find your portal into music, community, and web3.',
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
