import type { Metadata } from 'next';
import { SpacesLayoutClient } from './SpacesLayoutClient';

export const metadata: Metadata = {
  title: 'Spaces — ZAO OS',
  description:
    'Live audio rooms for the ZAO community. Join conversations, listen to music together, and connect with fellow artists in real time.',
  openGraph: {
    title: 'Spaces — ZAO OS',
    description:
      'Live audio rooms for the ZAO community. Join conversations and connect with fellow artists.',
    url: 'https://zaoos.com/spaces',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spaces — ZAO OS',
    description:
      'Live audio rooms for the ZAO community. Join conversations and connect with fellow artists.',
  },
};

/**
 * Spaces layout — server component for SEO metadata,
 * delegates rendering to SpacesLayoutClient for auth-dependent chrome.
 */
export default function SpacesLayout({ children }: { children: React.ReactNode }) {
  return <SpacesLayoutClient>{children}</SpacesLayoutClient>;
}
