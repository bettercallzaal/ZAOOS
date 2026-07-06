import type { Metadata } from 'next';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { XMTPProvider } from '@/contexts/XMTPContext';

export const metadata: Metadata = { title: 'Chat - ZAO OS' };

export default function ChatPage() {
  return (
    <XMTPProvider>
      <ChatRoom />
    </XMTPProvider>
  );
}
