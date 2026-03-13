import { XMTPProvider } from '@/contexts/XMTPContext';
import { MessagesRoom } from '@/components/messages/MessagesRoom';

export default function MessagesPage() {
  return (
    <XMTPProvider>
      <MessagesRoom />
    </XMTPProvider>
  );
}
