import { XMTPProvider } from '@/contexts/XMTPContext';
import { ChatRoom } from '@/components/chat/ChatRoom';

export default function ChatPage() {
  return (
    <XMTPProvider>
      <ChatRoom />
    </XMTPProvider>
  );
}
