import type { Metadata } from 'next';
import { MessagesRoom } from '@/components/messages/MessagesRoom';
import { XMTPProvider } from '@/contexts/XMTPContext';

export const metadata: Metadata = { title: 'Messages - ZAO OS' };

export default function MessagesPage() {
  return (
    <XMTPProvider>
      <MessagesRoom />
    </XMTPProvider>
  );
}
