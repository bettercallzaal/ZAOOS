'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { Client, Dm, Group } from '@xmtp/browser-sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = Client<any>;
import type { XMTPConversation, XMTPMessage } from '@/types/xmtp';

interface WalletClient {
  address: string;
  client: AnyClient;
  streamController: AbortController | null;
}

interface XMTPContextValue {
  // Multi-wallet state
  connectedWallets: string[];
  activeWalletCount: number;
  isConnecting: boolean;
  connectingWallet: string | null;
  isConnected: boolean;
  error: string | null;

  // Unified inbox
  conversations: XMTPConversation[];
  activeConversationId: string | null;
  messages: XMTPMessage[];
  loadingMessages: boolean;

  // Actions
  connectWallet: (address: `0x${string}`, signMessage: (msg: string) => Promise<string>) => Promise<void>;
  disconnectWallet: (address: string) => void;
  disconnectAll: () => void;
  selectConversation: (id: string | null) => void;
  sendMessage: (text: string) => Promise<void>;
  createDm: (peerAddress: `0x${string}`) => Promise<string | null>;
  createGroup: (name: string, memberAddresses: `0x${string}`[]) => Promise<string | null>;
  refreshConversations: () => Promise<void>;
}

const XMTPContext = createContext<XMTPContextValue | null>(null);

export function useXMTPContext() {
  const ctx = useContext(XMTPContext);
  if (!ctx) throw new Error('useXMTPContext must be used within XMTPProvider');
  return ctx;
}

export function XMTPProvider({ children }: { children: React.ReactNode }) {
  const walletsRef = useRef<Map<string, WalletClient>>(new Map());
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<XMTPMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const msgAbortRef = useRef<AbortController | null>(null);
  // Track which wallet owns the active conversation
  const activeConvWalletRef = useRef<string | null>(null);

  /**
   * Load and merge conversations from all connected wallet clients
   */
  const loadAllConversations = useCallback(async () => {
    const allMapped: XMTPConversation[] = [];

    for (const [address, wc] of walletsRef.current.entries()) {
      try {
        const allConvos = await wc.client.conversations.list();
        const dms = await wc.client.conversations.listDms();
        const dmIds = new Set(dms.map((d: Dm) => d.id));

        const mapped = await Promise.all(
          allConvos.map(async (conv: Dm | Group) => {
            const isDm = dmIds.has(conv.id);
            const lastMsg = await conv.lastMessage();
            const lastContent = lastMsg?.content;
            const group = conv as Group;

            return {
              id: conv.id,
              type: isDm ? 'dm' as const : 'group' as const,
              name: (!isDm && group.name) ? group.name : (isDm ? 'Direct Message' : 'Group'),
              imageUrl: (!isDm && group.imageUrl) ? group.imageUrl : undefined,
              description: (!isDm && group.description) ? group.description : undefined,
              peerInboxId: isDm ? await (conv as Dm).peerInboxId() : undefined,
              lastMessage: typeof lastContent === 'string' ? lastContent : lastContent ? '[media]' : undefined,
              lastMessageAt: lastMsg?.sentAt,
              unreadCount: 0,
              // Tag which wallet this conversation belongs to
              walletAddress: address,
            } as XMTPConversation;
          })
        );
        allMapped.push(...mapped);
      } catch (err) {
        console.error(`Failed to load conversations for ${address}:`, err);
      }
    }

    // Sort by last message time, most recent first
    allMapped.sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() ?? 0;
      const bTime = b.lastMessageAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    setConversations(allMapped);
  }, []);

  /**
   * Connect a specific wallet to XMTP
   */
  const connectWallet = useCallback(async (
    address: `0x${string}`,
    signMessage: (msg: string) => Promise<string>
  ) => {
    const normalized = address.toLowerCase();
    if (walletsRef.current.has(normalized)) return; // Already connected

    setIsConnecting(true);
    setConnectingWallet(normalized);
    setError(null);

    try {
      const { createWalletSigner, createXMTPClient, saveConnectedWallet } = await import('@/lib/xmtp/client');
      const signer = createWalletSigner(address, signMessage);
      const client = await createXMTPClient(signer, normalized);

      // Sync conversations
      await client.conversations.sync();

      // Store the client
      const controller = new AbortController();
      walletsRef.current.set(normalized, {
        address: normalized,
        client,
        streamController: controller,
      });

      // Save to localStorage for reconnection awareness
      saveConnectedWallet(normalized);

      // Update state
      setConnectedWallets(Array.from(walletsRef.current.keys()));

      // Load merged conversations
      await loadAllConversations();

      // Stream new conversations for this wallet
      (async () => {
        try {
          const stream = await client.conversations.stream({
            onValue: () => loadAllConversations(),
          });
          for await (const _ of stream) {
            if (controller.signal.aborted) {
              await stream.return();
              break;
            }
          }
        } catch {
          // Stream ended
        }
      })();

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet to XMTP';
      setError(message);
      console.error('XMTP connect error:', err);
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  }, [loadAllConversations]);

  /**
   * Disconnect a specific wallet
   */
  const disconnectWallet = useCallback((address: string) => {
    const normalized = address.toLowerCase();
    const wc = walletsRef.current.get(normalized);
    if (!wc) return;

    wc.streamController?.abort();
    wc.client.close();
    walletsRef.current.delete(normalized);

    const { removeConnectedWallet } = require('@/lib/xmtp/client');
    removeConnectedWallet(normalized);

    setConnectedWallets(Array.from(walletsRef.current.keys()));
    loadAllConversations();
  }, [loadAllConversations]);

  /**
   * Disconnect all wallets
   */
  const disconnectAll = useCallback(() => {
    msgAbortRef.current?.abort();
    msgAbortRef.current = null;

    for (const [, wc] of walletsRef.current) {
      wc.streamController?.abort();
      wc.client.close();
    }
    walletsRef.current.clear();

    if (typeof window !== 'undefined') {
      localStorage.removeItem('zaoos-xmtp-wallets');
    }

    setConnectedWallets([]);
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    activeConvWalletRef.current = null;
  }, []);

  /**
   * Find which wallet client owns a conversation
   */
  const findClientForConversation = useCallback(async (convId: string): Promise<{ client: AnyClient; address: string } | null> => {
    for (const [address, wc] of walletsRef.current.entries()) {
      const conv = await wc.client.conversations.getConversationById(convId);
      if (conv) return { client: wc.client, address };
    }
    return null;
  }, []);

  const selectConversation = useCallback(async (id: string | null) => {
    setActiveConversationId(id);

    // Abort previous message stream
    if (msgAbortRef.current) {
      msgAbortRef.current.abort();
      msgAbortRef.current = null;
    }

    if (!id) {
      setMessages([]);
      activeConvWalletRef.current = null;
      return;
    }

    setLoadingMessages(true);
    try {
      const result = await findClientForConversation(id);
      if (!result) {
        setMessages([]);
        return;
      }

      const { client } = result;
      activeConvWalletRef.current = result.address;

      const conv = await client.conversations.getConversationById(id);
      if (!conv) {
        setMessages([]);
        return;
      }

      await conv.sync();
      const rawMessages = await conv.messages({ limit: BigInt(50) });
      const myInboxId = client.inboxId;

      const decoded: XMTPMessage[] = rawMessages.map((msg) => ({
        id: msg.id,
        conversationId: id,
        senderInboxId: msg.senderInboxId,
        content: typeof msg.content === 'string' ? msg.content : '[media]',
        sentAt: msg.sentAt,
        isFromMe: msg.senderInboxId === myInboxId,
      }));

      setMessages(decoded);

      // Stream new messages for this conversation
      const controller = new AbortController();
      msgAbortRef.current = controller;
      (async () => {
        try {
          const stream = await conv.stream({
            onValue: (msg) => {
              if (!client) return;
              const newMsg: XMTPMessage = {
                id: msg.id,
                conversationId: id,
                senderInboxId: msg.senderInboxId,
                content: typeof msg.content === 'string' ? msg.content : '[media]',
                sentAt: msg.sentAt,
                isFromMe: msg.senderInboxId === client.inboxId,
              };
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === id
                    ? { ...c, lastMessage: newMsg.content, lastMessageAt: newMsg.sentAt }
                    : c
                )
              );
            },
          });
          for await (const _ of stream) {
            if (controller.signal.aborted) {
              await stream.return();
              break;
            }
          }
        } catch {
          // Stream ended
        }
      })();

    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [findClientForConversation]);

  const sendMessage = useCallback(async (text: string) => {
    if (!activeConversationId || !text.trim() || !activeConvWalletRef.current) return;

    const wc = walletsRef.current.get(activeConvWalletRef.current);
    if (!wc) return;

    const conv = await wc.client.conversations.getConversationById(activeConversationId);
    if (!conv) return;

    await conv.sendText(text.trim());
  }, [activeConversationId]);

  /**
   * Create a DM using the first connected wallet (or the primary wallet)
   */
  const getFirstClient = useCallback((): AnyClient | null => {
    const first = walletsRef.current.values().next();
    return first.done ? null : first.value.client;
  }, []);

  const createDm = useCallback(async (peerAddress: `0x${string}`) => {
    const client = getFirstClient();
    if (!client) return null;

    try {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');
      const conv = await client.conversations.createDmWithIdentifier({
        identifierKind: IdentifierKind.Ethereum,
        identifier: peerAddress,
      });
      await loadAllConversations();
      return conv.id;
    } catch (err) {
      console.error('Failed to create DM:', err);
      return null;
    }
  }, [getFirstClient, loadAllConversations]);

  const createGroup = useCallback(async (name: string, memberAddresses: `0x${string}`[]) => {
    const client = getFirstClient();
    if (!client) return null;

    try {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');
      const identifiers = memberAddresses.map((addr) => ({
        identifierKind: IdentifierKind.Ethereum,
        identifier: addr,
      }));
      const conv = await client.conversations.createGroupWithIdentifiers(identifiers, {
        groupName: name,
        groupDescription: `ZAO group: ${name}`,
      });
      await loadAllConversations();
      return conv.id;
    } catch (err) {
      console.error('Failed to create group:', err);
      return null;
    }
  }, [getFirstClient, loadAllConversations]);

  const refreshConversations = useCallback(async () => {
    for (const [, wc] of walletsRef.current) {
      await wc.client.conversations.sync();
    }
    await loadAllConversations();
  }, [loadAllConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const [, wc] of walletsRef.current) {
        wc.streamController?.abort();
        wc.client.close();
      }
      walletsRef.current.clear();
    };
  }, []);

  return (
    <XMTPContext.Provider
      value={{
        connectedWallets,
        activeWalletCount: walletsRef.current.size,
        isConnecting,
        connectingWallet,
        isConnected: walletsRef.current.size > 0,
        error,
        conversations,
        activeConversationId,
        messages,
        loadingMessages,
        connectWallet,
        disconnectWallet,
        disconnectAll,
        selectConversation,
        sendMessage,
        createDm,
        createGroup,
        refreshConversations,
      }}
    >
      {children}
    </XMTPContext.Provider>
  );
}
