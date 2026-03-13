export interface XMTPMessage {
  id: string;
  conversationId: string;
  senderInboxId: string;
  senderAddress?: string;
  senderDisplayName?: string;
  senderPfpUrl?: string;
  content: string;
  sentAt: Date;
  isFromMe: boolean;
}

export interface XMTPConversation {
  id: string;
  type: 'dm' | 'group';
  name: string;
  imageUrl?: string;
  description?: string;
  peerInboxId?: string; // for DMs
  peerAddress?: string; // for DMs
  peerDisplayName?: string; // for DMs
  peerPfpUrl?: string; // for DMs
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  memberCount?: number;
  walletAddress?: string; // which connected wallet owns this conversation
}

export interface XMTPMember {
  inboxId: string;
  address?: string;
  displayName?: string;
  pfpUrl?: string;
  fid?: number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}
