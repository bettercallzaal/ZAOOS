import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { VisitorFeed } from '@/components/gate/VisitorFeed';
import { getReaderSession } from '@/lib/auth/session';
import { openFrontDoorEnabled } from '@/lib/gates/front-door';

export const metadata: Metadata = {
  title: 'The ZAO on Farcaster',
  description: 'Read the ZAO channels on Farcaster. Members post; everyone can read.',
};

/**
 * The open front door: a signed-in Farcaster visitor reads the ZAO channel
 * feeds here. Members go to /chat. Does not exist while the flag is off.
 */
export default async function FeedPage() {
  if (!openFrontDoorEnabled()) notFound();
  const reader = await getReaderSession();
  if (!reader) redirect('/');
  if (reader.role === 'member') redirect('/chat');

  return <VisitorFeed displayName={reader.displayName || reader.username} pfpUrl={reader.pfpUrl} />;
}
