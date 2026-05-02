import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ecosystem — The ZAO',
  description:
    'Explore the ZABAL ecosystem of partners, collaborators, and aligned communities building alongside The ZAO.',
  openGraph: {
    title: 'Ecosystem — The ZAO',
    description:
      'Explore the ZABAL ecosystem of partners, collaborators, and aligned communities building alongside The ZAO.',
    url: 'https://zaoos.com/ecosystem',
    images: [{ url: 'https://zaoos.com/og', width: 1200, height: 630 }],
  },
};

export default function EcosystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
