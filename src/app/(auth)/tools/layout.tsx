import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artist Tools — The ZAO',
  description:
    'Access artist tools for music submissions, profile cards, and creative utilities inside ZAO OS.',
  openGraph: {
    title: 'Artist Tools — The ZAO',
    description:
      'Access artist tools for music submissions, profile cards, and creative utilities inside ZAO OS.',
    url: 'https://zaoos.com/tools',
    images: [{ url: 'https://zaoos.com/og.png', width: 1200, height: 630 }],
  },
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
