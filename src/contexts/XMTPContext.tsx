'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { Client, Dm, Group } from '@xmtp/browser-sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = Client<any>;
import type { XMTPConversation, XMTPMessage } from '@/types/xmtp';

interface XMTPContextValue {
  client: AnyClient | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  conversations: XMTPConversation[];
  activeConversationId: string | null;
  messages: XMTPMessage[];
  loadingMessages: boolean;
  connect: (address: `0x${string}`, signMessage: (msg: string) => Promise<string>) => Promise<void>;
  disconnect: () => void;
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
  const clientRef = useRef<AnyClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<XMTPMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const msgAbortRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async (client: AnyClient) => {
    try {
      const allConvos = await client.conversations.list();
      const dms = await client.conversations.listDms();
      const dmIds = new Set(dms.map((d: Dm) => d.id));

      const mapped: XMTPConversation[] = await Promise.all(
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
          };
        })
      );

      // Sort by last message time, most recent first
      mapped.sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() ?? 0;
        const bTime = b.lastMessageAt?.getTime() ?? 0;
        return bTime - aTime;
      });

      setConversations(mapped);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  const connect = useCallback(async (
    address: `0x${string}`,
    signMessage: (msg: string) => Promise<string>
  ) => {
    if (clientRef.current) return;
    setIsConnecting(true);
    setError(null);

    try {
      const { createWalletSigner, createXMTPClient } = await import('@/lib/xmtp/client');
      const signer = createWalletSigner(address, signMessage);
      const client = await createXMTPClient(signer);
      clientRef.current = client;
      setIsConnected(true);

      // Load conversations
      await client.conversations.sync();
      await loadConversations(client);

      // Stream new conversations in background
      const controller = new AbortController();
      abortRef.current = controller;
      (async () => {
        try {
          const stream = await client.conversations.stream({
            onValue: () => {
              if (clientRef.current) loadConversations(clientRef.current);
            },
          });
          // Keep stream alive until abort
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
      const message = err instanceof Error ? err.message : 'Failed to connect to XMTP';
      setError(message);
      console.error('XMTP connect error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [loadConversations]);

  const selectConversation = useCallback(async (id: string | null) => {
    setActiveConversationId(id);

    // Abort previous message stream
    if (msgAbortRef.current) {
      msgAbortRef.current.abort();
      msgAbortRef.current = null;
    }

    if (!id || !clientRef.current) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      const conv = await clientRef.current.conversations.getConversationById(id);
      if (!conv) {
        setMessages([]);
        return;
      }

      await conv.sync();
      const rawMessages = await conv.messages({ limit: BigInt(50) });
      const myInboxId = clientRef.current.inboxId;

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
              if (!clientRef.current) return;
              const newMsg: XMTPMessage = {
                id: msg.id,
                conversationId: id,
                senderInboxId: msg.senderInboxId,
                content: typeof msg.content === 'string' ? msg.content : '[media]',
                sentAt: msg.sentAt,
                isFromMe: msg.senderInboxId === clientRef.current.inboxId,
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
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!clientRef.current || !activeConversationId || !text.trim()) return;

    const conv = await clientRef.current.conversations.getConversationById(activeConversationId);
    if (!conv) return;

    await conv.sendText(text.trim());
  }, [activeConversationId]);

  const createDm = useCallback(async (peerAddress: `0x${string}`) => {
    if (!clientRef.current) return null;

    try {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');
      const conv = await clientRef.current.conversations.createDmWithIdentifier({
        identifierKind: IdentifierKind.Ethereum,
        identifier: peerAddress,
      });
      await loadConversations(clientRef.current);
      return conv.id;
    } catch (err) {
      console.error('Failed to create DM:', err);
      return null;
    }
  }, [loadConversations]);

  const createGroup = useCallback(async (name: string, memberAddresses: `0x${string}`[]) => {
    if (!clientRef.current) return null;

    try {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');
      const identifiers = memberAddresses.map((addr) => ({
        identifierKind: IdentifierKind.Ethereum,
        identifier: addr,
      }));
      const conv = await clientRef.current.conversations.createGroupWithIdentifiers(identifiers, {
        groupName: name,
        groupDescription: `ZAO group: ${name}`,
      });
      await loadConversations(clientRef.current);
      return conv.id;
    } catch (err) {
      console.error('Failed to create group:', err);
      return null;
    }
  }, [loadConversations]);

  const refreshConversations = useCallback(async () => {
    if (!clientRef.current) return;
    await clientRef.current.conversations.sync();
    await loadConversations(clientRef.current);
  }, [loadConversations]);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    msgAbortRef.current?.abort();
    msgAbortRef.current = null;
    if (clientRef.current) {
      clientRef.current.close();
      clientRef.current = null;
    }
    setIsConnected(false);
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <XMTPContext.Provider
      value={{
        client: clientRef.current,
        isConnecting,
        isConnected,
        error,
        conversations,
        activeConversationId,
        messages,
        loadingMessages,
        connect,
        disconnect,
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
