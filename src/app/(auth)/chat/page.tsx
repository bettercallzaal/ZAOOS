import type { Metadata } from 'next';
import { XMTPProvider } from '@/contexts/XMTPContext';
import { ChatRoom } from '@/components/chat/ChatRoom';

export const metadata: Metadata = { title: 'Chat - ZAO OS' };

export default function ChatPage() {
  return (
    <XMTPProvider>
      <ChatRoom />
    </XMTPProvider>
  );
}
