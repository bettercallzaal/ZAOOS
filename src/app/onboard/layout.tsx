import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join ZAO OS',
  description:
    'Check your wallet eligibility and join ZAO OS — the gated Farcaster community for music artists building onchain.',
  openGraph: {
    title: 'Join ZAO OS',
    description:
      'Check your wallet eligibility and join the ZAO community.',
    url: 'https://zaoos.com/onboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join ZAO OS',
    description:
      'Check your wallet eligibility and join the ZAO community.',
  },
};

export default function OnboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
