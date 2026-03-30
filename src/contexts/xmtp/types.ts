import type { Client, DecodedMessage } from '@xmtp/browser-sdk';

// ── XMTP Client Types ──────────────────────────────────────────────

export type AnyClient = Client<unknown>;

export interface WalletClient {
  address: string;
  client: AnyClient;
}

// ── Domain Types ────────────────────────────────────────────────────

export interface ZaoMember {
  fid: number | null;
  username: string | null;
  displayName: string;
  pfpUrl: string | null;
  addresses: string[];
  reachable: boolean;
  xmtpAddress: string | null;  // The specific address that passed canMessage
  lastLoginAt: string | null;  // ISO timestamp
}

export interface MessagingPrefs {
  autoJoinGroup: boolean;
  allowNonZaoDms: boolean;
}

// ── Context Value ───────────────────────────────────────────────────

import type { XMTPConversation, XMTPMessage } from '@/types/xmtp';
import type { XMTPPeerProfile } from '@/lib/xmtp/client';

export interface XMTPContextValue {
  connectedWallets: string[];
  activeWalletCount: number;
  isConnecting: boolean;
  connectingWallet: string | null;
  isConnected: boolean;
  error: string | null;
  actionError: string | null; // transient errors from DM/group creation (auto-dismiss)
  streamConnected: boolean;
  tabLocked: boolean;

  conversations: XMTPConversation[];
  activeConversationId: string | null;
  messages: XMTPMessage[];
  loadingMessages: boolean;

  zaoMembers: ZaoMember[];
  loadingMembers: boolean;

  reconnecting: boolean;
  activeXMTPAddress: string | null;

  autoConnect: (fid: number) => Promise<void>;
  connectWallet: (address: `0x${string}`, signMessage: (msg: string) => Promise<string>) => Promise<void>;
  disconnectWallet: (address: string) => void;
  disconnectAll: () => void;
  switchWallet: () => void;
  selectConversation: (id: string | null) => void;
  sendMessage: (text: string) => Promise<void>;
  createDm: (peerAddress: `0x${string}`, peerProfile?: XMTPPeerProfile) => Promise<string | null>;
  createGroup: (name: string, members: { address: `0x${string}`; profile?: XMTPPeerProfile }[]) => Promise<string | null>;
  refreshConversations: () => Promise<void>;
  startDmWithMember: (member: ZaoMember) => Promise<void>;
  clearError: () => void;
  clearActionError: () => void;
  reconnectStreams: () => Promise<void>;
  removeConversation: (id: string) => void;
  leaveGroup: (id: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  getGroupMembers: (conversationId: string) => Promise<{ inboxId: string; displayName: string; pfpUrl: string; username?: string }[]>;
}

// ── Shared Refs (passed between hooks) ──────────────────────────────

import type { MutableRefObject, Dispatch, SetStateAction } from 'react';

export interface XMTPSharedRefs {
  walletsRef: MutableRefObject<Map<string, WalletClient>>;
  primaryClientRef: MutableRefObject<AnyClient | null>;
  activeConvIdRef: MutableRefObject<string | null>;
  activeConvWalletRef: MutableRefObject<string | null>;
  isLoadingConvRef: MutableRefObject<boolean>;
  messageIdSetRef: MutableRefObject<Set<string>>;
  convStreamCleanupRef: MutableRefObject<(() => void) | null>;
  msgStreamCleanupRef: MutableRefObject<(() => void) | null>;
  streamsActiveRef: MutableRefObject<boolean>;
  reconnectTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  reconnectAttemptsRef: MutableRefObject<number>;
  convSelectGenRef: MutableRefObject<number>;
  lastMessagesRef: MutableRefObject<Map<string, { content: string; sentAt: Date }>>;
  unreadCountsRef: MutableRefObject<Map<string, number>>;
  messagingPrefsRef: MutableRefObject<MessagingPrefs>;
  actionErrorTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  zaoMembersRef: MutableRefObject<ZaoMember[]>;
}

export interface XMTPSharedState {
  setConnectedWallets: Dispatch<SetStateAction<string[]>>;
  setIsConnecting: Dispatch<SetStateAction<boolean>>;
  setConnectingWallet: Dispatch<SetStateAction<string | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setStreamConnected: Dispatch<SetStateAction<boolean>>;
  setConversations: Dispatch<SetStateAction<XMTPConversation[]>>;
  setActiveConversationId: Dispatch<SetStateAction<string | null>>;
  setMessages: Dispatch<SetStateAction<XMTPMessage[]>>;
  setLoadingMessages: Dispatch<SetStateAction<boolean>>;
  setZaoMembers: Dispatch<SetStateAction<ZaoMember[]>>;
  setLoadingMembers: Dispatch<SetStateAction<boolean>>;
  setReconnecting: Dispatch<SetStateAction<boolean>>;
  tabLocked: boolean;
  activeConversationId: string | null;
  zaoMembers: ZaoMember[];
  showActionError: (msg: string) => void;
}

// ── Constants ───────────────────────────────────────────────────────

export const PREFS_DEFAULTS: MessagingPrefs = { autoJoinGroup: true, allowNonZaoDms: false };
export const MAX_RECONNECT_ATTEMPTS = 5;

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Check if a message is displayable text.
 * Logs dropped messages to help debug missing content.
 */
export function isTextMessage(msg: DecodedMessage): boolean {
  if (msg.contentType?.typeId === 'text') return true;
  // Fallback for older SDK versions
  if (typeof msg.content === 'string' && msg.content.length > 0) return true;
  // Log dropped messages for debugging
  if (process.env.NODE_ENV === 'development') {
    console.debug('[XMTP] Dropped non-text message:', {
      id: msg.id,
      contentType: msg.contentType?.typeId,
      contentKind: typeof msg.content,
      conversationId: msg.conversationId,
    });
  }
  return false;
}
