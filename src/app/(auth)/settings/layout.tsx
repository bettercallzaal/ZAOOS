import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — ZAO OS',
  description:
    'Manage your ZAO OS account settings, notifications, and connected services.',
  openGraph: {
    title: 'Settings — ZAO OS',
    description:
      'Manage your ZAO OS account settings, notifications, and connected services.',
    url: 'https://zaoos.com/settings',
    images: [{ url: 'https://zaoos.com/og.png', width: 1200, height: 630 }],
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
