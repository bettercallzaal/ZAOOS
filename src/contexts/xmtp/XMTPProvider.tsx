'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { XMTPConversation, XMTPMessage } from '@/types/xmtp';
import type {
  XMTPContextValue,
  WalletClient,
  AnyClient,
  ZaoMember,
  MessagingPrefs,
  XMTPSharedRefs,
  XMTPSharedState,
} from '@/contexts/xmtp/types';
import { PREFS_DEFAULTS } from '@/contexts/xmtp/types';
import { useConversations } from '@/contexts/xmtp/conversations';
import { useMessages } from '@/contexts/xmtp/messages';
import { useMembers } from '@/contexts/xmtp/members';
import { useGroups } from '@/contexts/xmtp/groups';
import { useConnection } from '@/contexts/xmtp/connection';

// ── Context ─────────────────────────────────────────────────────────

const XMTPContext = createContext<XMTPContextValue | null>(null);

export function useXMTPContext() {
  const ctx = useContext(XMTPContext);
  if (!ctx) throw new Error('useXMTPContext must be used within XMTPProvider');
  return ctx;
}

/** Safe version that returns disconnected defaults when outside XMTPProvider. */
export function useXMTPContextSafe(): Pick<XMTPContextValue, 'isConnected' | 'activeXMTPAddress' | 'switchWallet'> {
  const ctx = useContext(XMTPContext);
  if (!ctx) return { isConnected: false, activeXMTPAddress: null, switchWallet: () => {} };
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────

export function XMTPProvider({ children }: { children: React.ReactNode }) {
  // ── State ──────────────────────────────────────────────────────────
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<XMTPMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [zaoMembers, setZaoMembers] = useState<ZaoMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Multi-tab OPFS lock detection — XMTP browser SDK uses OPFS which doesn't support concurrent access
  const [tabLocked, setTabLocked] = useState(false);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('zao-xmtp-tab-lock');
    const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Announce presence
    channel.postMessage({ type: 'ping', tabId });

    channel.onmessage = (event) => {
      if (event.data.type === 'ping' && event.data.tabId !== tabId) {
        // Another tab is active — respond so they know we exist
        channel.postMessage({ type: 'pong', tabId });
      }
      if (event.data.type === 'pong' && event.data.tabId !== tabId) {
        // We detected another tab — block XMTP connection
        setTabLocked(true);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // ── Refs ───────────────────────────────────────────────────────────
  const walletsRef = useRef<Map<string, WalletClient>>(new Map());
  const primaryClientRef = useRef<AnyClient | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const activeConvWalletRef = useRef<string | null>(null);
  const isLoadingConvRef = useRef(false);
  const messageIdSetRef = useRef(new Set<string>());
  const convStreamCleanupRef = useRef<(() => void) | null>(null);
  const msgStreamCleanupRef = useRef<(() => void) | null>(null);
  const streamsActiveRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const convSelectGenRef = useRef(0);
  const lastMessagesRef = useRef<Map<string, { content: string; sentAt: Date }>>(new Map());
  const unreadCountsRef = useRef<Map<string, number>>(new Map());
  const messagingPrefsRef = useRef<MessagingPrefs>(PREFS_DEFAULTS);
  const actionErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zaoMembersRef = useRef<ZaoMember[]>([]);

  // ── Action Error Helper ────────────────────────────────────────────
  const showActionError = useCallback((msg: string) => {
    if (actionErrorTimerRef.current) clearTimeout(actionErrorTimerRef.current);
    setActionError(msg);
    actionErrorTimerRef.current = setTimeout(() => setActionError(null), 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearActionError = useCallback(() => {
    if (actionErrorTimerRef.current) clearTimeout(actionErrorTimerRef.current);
    setActionError(null);
  }, []);

  // ── Shared Refs & State ────────────────────────────────────────────
  const sharedRefs: XMTPSharedRefs = useMemo(() => ({
    walletsRef, primaryClientRef, activeConvIdRef, activeConvWalletRef,
    isLoadingConvRef, messageIdSetRef, convStreamCleanupRef, msgStreamCleanupRef,
    streamsActiveRef, reconnectTimerRef, reconnectAttemptsRef, convSelectGenRef,
    lastMessagesRef, unreadCountsRef, messagingPrefsRef, actionErrorTimerRef,
    zaoMembersRef,
  }), []);

  const sharedState: XMTPSharedState = useMemo(() => ({
    setConnectedWallets, setIsConnecting, setConnectingWallet, setError, setActionError,
    setStreamConnected, setConversations, setActiveConversationId, setMessages,
    setLoadingMessages, setZaoMembers, setLoadingMembers, setReconnecting,
    tabLocked, activeConversationId, zaoMembers, showActionError,
  }), [tabLocked, activeConversationId, zaoMembers, showActionError]);

  // ── Compose Hooks ──────────────────────────────────────────────────
  const {
    findClientForConversation, loadAllConversations, seedLastMessages,
    selectConversation, refreshConversations, removeConversation,
  } = useConversations(sharedRefs, sharedState);

  const {
    startGlobalStreams, sendMessage, reconnectStreams,
  } = useMessages(sharedRefs, sharedState, loadAllConversations);

  const {
    getFirstClient, checkZaoMembers, createDm, startDmWithMember,
  } = useMembers(sharedRefs, sharedState, loadAllConversations, selectConversation);

  const {
    createGroup, leaveGroup, getGroupMembers,
  } = useGroups(
    sharedRefs, sharedState, getFirstClient, findClientForConversation,
    loadAllConversations, removeConversation,
  );

  const {
    autoConnect, connectWallet, disconnectWallet, disconnectAll, switchWallet,
  } = useConnection(
    sharedRefs, sharedState, seedLastMessages, loadAllConversations,
    checkZaoMembers, startGlobalStreams,
  );

  // ── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    const wallets = walletsRef.current;
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (actionErrorTimerRef.current) {
        clearTimeout(actionErrorTimerRef.current);
        actionErrorTimerRef.current = null;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally reading stable refs in cleanup
      convStreamCleanupRef.current?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally reading stable refs in cleanup
      msgStreamCleanupRef.current?.();
      streamsActiveRef.current = false;
      for (const [, wc] of wallets) {
        wc.client.close();
      }
      wallets.clear();
    };
  }, []);

  // ── Context Value ──────────────────────────────────────────────────
  const contextValue = useMemo(() => ({
    connectedWallets,
    activeWalletCount: connectedWallets.length,
    isConnecting,
    connectingWallet,
    isConnected: connectedWallets.length > 0,
    error,
    actionError,
    streamConnected,
    tabLocked,
    reconnecting,
    activeXMTPAddress: connectedWallets[0] ?? null,
    conversations,
    activeConversationId,
    messages,
    loadingMessages,
    zaoMembers,
    loadingMembers,
    autoConnect,
    connectWallet,
    disconnectWallet,
    disconnectAll,
    switchWallet,
    selectConversation,
    sendMessage,
    createDm,
    createGroup,
    refreshConversations,
    startDmWithMember,
    clearError,
    clearActionError,
    reconnectStreams,
    removeConversation,
    leaveGroup,
    refreshMembers: checkZaoMembers,
    getGroupMembers,
  }), [
    connectedWallets, isConnecting, connectingWallet, error, actionError, streamConnected,
    tabLocked, reconnecting, conversations, activeConversationId, messages, loadingMessages,
    zaoMembers, loadingMembers, autoConnect, connectWallet, disconnectWallet,
    disconnectAll, switchWallet, selectConversation, sendMessage, createDm, createGroup,
    refreshConversations, startDmWithMember, clearError, clearActionError, reconnectStreams,
    removeConversation, leaveGroup, checkZaoMembers, getGroupMembers,
  ]);

  return (
    <XMTPContext.Provider value={contextValue}>
      {children}
    </XMTPContext.Provider>
  );
}
