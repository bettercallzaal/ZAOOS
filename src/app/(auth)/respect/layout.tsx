import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fractal Respect — The ZAO',
  description:
    'View the Respect leaderboard and track peer-ranked contributions across The ZAO community.',
  openGraph: {
    title: 'Fractal Respect — The ZAO',
    description:
      'View the Respect leaderboard and track peer-ranked contributions across The ZAO community.',
    url: 'https://zaoos.com/respect',
    images: [{ url: 'https://zaoos.com/og.png', width: 1200, height: 630 }],
  },
};

export default function RespectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
