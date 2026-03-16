import type { Metadata } from 'next';
import { XMTPProvider } from '@/contexts/XMTPContext';
import { MessagesRoom } from '@/components/messages/MessagesRoom';

export const metadata: Metadata = { title: 'Messages - ZAO OS' };

export default function MessagesPage() {
  return (
    <XMTPProvider>
      <MessagesRoom />
    </XMTPProvider>
  );
}
