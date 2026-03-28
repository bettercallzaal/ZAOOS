import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Members — ZAO OS',
  description:
    'Browse the ZAO community directory. Discover music artists, respect holders, and collaborators building onchain together.',
  openGraph: {
    title: 'Members — ZAO OS',
    description:
      'Browse the ZAO community directory. Discover music artists and collaborators building onchain together.',
    url: 'https://zaoos.com/members',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Members — ZAO OS',
    description:
      'Browse the ZAO community directory. Discover music artists and collaborators building onchain together.',
  },
};

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
