import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Governance — The ZAO',
  description:
    'Propose and vote on ZAO governance decisions using Fractal Respect. Shape the future of the decentralized music community.',
  openGraph: {
    title: 'Governance — The ZAO',
    description:
      'Propose and vote on ZAO governance decisions using Fractal Respect. Shape the future of the decentralized music community.',
    url: 'https://zaoos.com/governance',
    images: [{ url: 'https://zaoos.com/og', width: 1200, height: 630 }],
  },
};

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
