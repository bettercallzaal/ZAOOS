import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MessagesRoom } from '@/components/messages/MessagesRoom';
import { XMTPProvider } from '@/contexts/XMTPContext';
import { requireMember } from '@/lib/membership';

export const metadata: Metadata = { title: 'Messages - ZAO XMTP' };

export default async function MessagesPage() {
  if (!(await requireMember({ persist: false }))) redirect('/');
  return (
    <XMTPProvider>
      <MessagesRoom />
    </XMTPProvider>
  );
}
