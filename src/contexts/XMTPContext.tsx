'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Client, Dm, Group, DecodedMessage } from '@xmtp/browser-sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = Client<any>;
import type { XMTPConversation, XMTPMessage } from '@/types/xmtp';
import type { XMTPPeerProfile } from '@/lib/xmtp/client';

interface WalletClient {
  address: string;
  client: AnyClient;
}

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

interface XMTPContextValue {
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

  autoConnect: (fid: number) => Promise<void>;
  connectWallet: (address: `0x${string}`, signMessage: (msg: string) => Promise<string>) => Promise<void>;
  disconnectWallet: (address: string) => void;
  disconnectAll: () => void;
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

const XMTPContext = createContext<XMTPContextValue | null>(null);

export function useXMTPContext() {
  const ctx = useContext(XMTPContext);
  if (!ctx) throw new Error('useXMTPContext must be used within XMTPProvider');
  return ctx;
}

/**
 * Check if a message is displayable text.
 * Logs dropped messages to help debug missing content.
 */
function isTextMessage(msg: DecodedMessage): boolean {
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

export function XMTPProvider({ children }: { children: React.ReactNode }) {
  const walletsRef = useRef<Map<string, WalletClient>>(new Map());
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const actionErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showActionError = useCallback((msg: string) => {
    if (actionErrorTimerRef.current) clearTimeout(actionErrorTimerRef.current);
    setActionError(msg);
    actionErrorTimerRef.current = setTimeout(() => setActionError(null), 5000);
  }, []);
  const [streamConnected, setStreamConnected] = useState(false);
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<XMTPMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [zaoMembers, setZaoMembers] = useState<ZaoMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  // Track active conversation for the global message stream
  const activeConvIdRef = useRef<string | null>(null);
  const activeConvWalletRef = useRef<string | null>(null);

  // Prevents stream from adding messages while selectConversation is loading
  const isLoadingConvRef = useRef(false);

  // Message ID set for O(1) dedup
  const messageIdSetRef = useRef(new Set<string>());

  // Global stream cleanup functions
  const convStreamCleanupRef = useRef<(() => void) | null>(null);
  const msgStreamCleanupRef = useRef<(() => void) | null>(null);

  // Guard: prevent duplicate stream listeners
  const streamsActiveRef = useRef(false);

  // Auto-reconnect timer cleanup
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reconnection attempt counter (caps retries to prevent infinite loops)
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Whether a reconnection is actively in progress
  const [reconnecting, setReconnecting] = useState(false);

  // Generation counter for selectConversation race condition prevention
  const convSelectGenRef = useRef(0);

  // In-memory last message cache (avoids calling lastMessage() per conversation)
  const lastMessagesRef = useRef<Map<string, { content: string; sentAt: Date }>>(new Map());

  // Unread message counts per conversation
  const unreadCountsRef = useRef<Map<string, number>>(new Map());

  // Client ref for reconnection
  const primaryClientRef = useRef<AnyClient | null>(null);

  /**
   * Load conversations from all connected clients.
   * Does NOT call lastMessage() — uses in-memory cache instead.
   */
  const loadAllConversations = useCallback(async () => {
    const { getPeerProfiles, getMemberProfiles, savePeerProfile } = await import('@/lib/xmtp/client');
    const peerProfiles = getPeerProfiles();
    const memberProfiles = getMemberProfiles();
    const allMapped: XMTPConversation[] = [];

    for (const [address, wc] of walletsRef.current.entries()) {
      try {
        const allConvos = await wc.client.conversations.list();
        const dms = await wc.client.conversations.listDms();
        const dmIds = new Set(dms.map((d: Dm) => d.id));

        const mapped = await Promise.all(
          allConvos.map(async (conv: Dm | Group) => {
            const isDm = dmIds.has(conv.id);
            const group = conv as Group;

            let peer = isDm ? peerProfiles[conv.id] : undefined;

            let peerInboxId: string | undefined;
            if (isDm) {
              try {
                peerInboxId = await (conv as Dm).peerInboxId();
              } catch { /* non-critical */ }
            }

            if (isDm && !peer && peerInboxId) {
              const memberMatch = memberProfiles[peerInboxId];
              if (memberMatch) {
                peer = memberMatch;
                savePeerProfile(conv.id, memberMatch);
              }
            }

            const cached = lastMessagesRef.current.get(conv.id);

            return {
              id: conv.id,
              type: isDm ? 'dm' as const : 'group' as const,
              name: (!isDm && group.name) ? group.name : (isDm && peer ? peer.displayName || `@${peer.username}` : isDm ? 'Direct Message' : 'Group'),
              imageUrl: (!isDm && group.imageUrl) ? group.imageUrl : undefined,
              description: (!isDm && group.description) ? group.description : undefined,
              peerInboxId,
              peerDisplayName: peer ? (peer.displayName || `@${peer.username}`) : undefined,
              peerPfpUrl: peer?.pfpUrl || undefined,
              lastMessage: cached?.content,
              lastMessageAt: cached?.sentAt,
              unreadCount: unreadCountsRef.current.get(conv.id) || 0,
              walletAddress: address,
            } as XMTPConversation;
          })
        );
        allMapped.push(...mapped);
      } catch (err) {
        console.error(`[XMTP] Failed to load conversations for ${address}:`, err);
      }
    }

    allMapped.sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() ?? 0;
      const bTime = b.lastMessageAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    setConversations(allMapped);
  }, []);

  /**
   * Seed the last-message cache by fetching one message per conversation.
   */
  const seedLastMessages = useCallback(async () => {
    for (const [, wc] of walletsRef.current.entries()) {
      try {
        const convos = await wc.client.conversations.list();
        const BATCH = 20;
        for (let i = 0; i < convos.length; i += BATCH) {
          const batch = convos.slice(i, i + BATCH);
          await Promise.allSettled(batch.map(async (conv: Dm | Group) => {
            const msg = await conv.lastMessage();
            if (msg && isTextMessage(msg)) {
              lastMessagesRef.current.set(conv.id, {
                content: msg.content as string,
                sentAt: msg.sentAt,
              });
            }
          }));
        }
      } catch { /* non-critical */ }
    }
  }, []);

  /**
   * Start global streams with error handling and reconnection.
   */
  const startGlobalStreams = useCallback(async (client: AnyClient) => {
    // Prevent duplicate stream listeners
    if (streamsActiveRef.current) return;
    streamsActiveRef.current = true;

    // Clean up existing streams before starting new ones
    convStreamCleanupRef.current?.();
    msgStreamCleanupRef.current?.();

    try {
      // Stream new conversations
      const convStream = await client.conversations.stream({
        onValue: () => {
          loadAllConversations();
        },
        onError: (err: Error) => {
          console.error('[XMTP] Conversation stream error:', err);
        },
        onFail: () => {
          console.error('[XMTP] Conversation stream permanently failed');
          streamsActiveRef.current = false;
          setStreamConnected(false);
          setError('Live updates disconnected. New conversations may not appear automatically.');
        },
      });
      convStreamCleanupRef.current = () => { void convStream.end(); };

      // Stream ALL messages across ALL conversations
      const [{ getMemberProfiles, getPeerProfiles }, { ConsentState }] = await Promise.all([
        import('@/lib/xmtp/client'),
        import('@xmtp/browser-sdk'),
      ]);
      const msgStream = await client.conversations.streamAllMessages({
        consentStates: [ConsentState.Allowed],
        onValue: (msg: DecodedMessage) => {
          // Reset reconnect counter on successful message receipt
          reconnectAttemptsRef.current = 0;
          if (!isTextMessage(msg)) return;

          // Skip if selectConversation is mid-load (prevents race condition)
          const isForActiveConv = msg.conversationId === activeConvIdRef.current;

          const content = msg.content as string;
          const conversationId = msg.conversationId;
          const isFromMe = msg.senderInboxId === client.inboxId;

          // Update last message cache
          lastMessagesRef.current.set(conversationId, {
            content,
            sentAt: msg.sentAt,
          });

          // Track unread counts for non-active conversations
          if (!isFromMe && conversationId !== activeConvIdRef.current) {
            const current = unreadCountsRef.current.get(conversationId) || 0;
            unreadCountsRef.current.set(conversationId, current + 1);
          }

          // Update sidebar with last message + unread count
          setConversations((prev) =>
            prev
              .map((c) =>
                c.id === conversationId
                  ? {
                      ...c,
                      lastMessage: content,
                      lastMessageAt: msg.sentAt,
                      unreadCount: unreadCountsRef.current.get(conversationId) || 0,
                    }
                  : c
              )
              .sort((a, b) => {
                const aTime = a.lastMessageAt?.getTime() ?? 0;
                const bTime = b.lastMessageAt?.getTime() ?? 0;
                return bTime - aTime;
              })
          );

          // Add to active conversation's message list (skip if mid-load to prevent race)
          if (isForActiveConv && !isLoadingConvRef.current) {
            const memberProfiles = getMemberProfiles();
            const peerProfiles = getPeerProfiles();
            const mp = memberProfiles[msg.senderInboxId];
            const peer = peerProfiles[conversationId];

            const senderName = isFromMe
              ? undefined
              : mp?.displayName || (mp?.username ? `@${mp.username}` : undefined)
                || peer?.displayName || (peer?.username ? `@${peer.username}` : undefined);

            const newMsg: XMTPMessage = {
              id: msg.id,
              conversationId,
              senderInboxId: msg.senderInboxId,
              senderDisplayName: senderName,
              senderPfpUrl: isFromMe ? undefined : mp?.pfpUrl || peer?.pfpUrl || undefined,
              content,
              sentAt: msg.sentAt,
              isFromMe,
            };

            // O(1) dedup using Set
            if (!messageIdSetRef.current.has(newMsg.id)) {
              messageIdSetRef.current.add(newMsg.id);
              setMessages((prev) => [...prev, newMsg]);
            }
          }
        },
        onError: (err: Error) => {
          console.error('[XMTP] Message stream error:', err);
        },
        onFail: () => {
          console.error('[XMTP] Message stream permanently failed after retries');
          streamsActiveRef.current = false;
          setStreamConnected(false);
          setError('Message stream disconnected. Please refresh to reconnect.');
        },
        // SDK built-in retry: 6 attempts with 10s delay by default
        retryOnFail: true,
      });
      msgStreamCleanupRef.current = () => { void msgStream.end(); };
      setStreamConnected(true);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      // Clear any previous stream error now that streams are healthy
      setError((prev) => {
        if (prev && (prev.includes('stream') || prev.includes('disconnected') || prev.includes('reconnect'))) {
          return null;
        }
        return prev;
      });
    } catch (err: unknown) {
      console.error('[XMTP] Failed to start streams:', err);
      setStreamConnected(false);
      streamsActiveRef.current = false;

      reconnectAttemptsRef.current += 1;

      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setReconnecting(false);
        setError('Message stream disconnected after multiple retries. Use the reconnect button to try again.');
        return;
      }

      // Auto-reconnect with exponential backoff, capped at 30s
      const delay = Math.min(5000 * Math.pow(1.5, reconnectAttemptsRef.current - 1), 30000);
      setReconnecting(true);
      setError(`Stream disconnected. Reconnecting (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (primaryClientRef.current) {
          startGlobalStreams(primaryClientRef.current).catch((e) =>
            console.error('[XMTP] Reconnection failed:', e)
          );
        }
      }, delay);
    }
  }, [loadAllConversations]);

  /**
   * Check which Farcaster follows + ZAO members are reachable via XMTP
   */
  const checkZaoMembers = useCallback(async () => {
    const client = walletsRef.current.values().next();
    if (client.done) return;
    const xmtpClient = client.value.client;

    setLoadingMembers(true);
    try {
      const membersRes = await fetch('/api/members');
      const zaoData = membersRes.ok ? await membersRes.json() : { members: [], currentFid: 0 };
      const currentFid = zaoData.currentFid;

      interface MergedMember {
        fid: number | null;
        username: string | null;
        displayName: string;
        pfpUrl: string | null;
        addresses: string[];
        storedXmtpAddress?: string | null;
        lastLoginAt?: string | null;
      }

      const merged: MergedMember[] = (zaoData.members || [])
        .filter((m: { fid: number | null }) => m.fid !== currentFid)
        .map((m: MergedMember) => ({ ...m }));

      const reachableMap = new Map<number, string>(); // memberIdx → reachable address

      // Members with a stored XMTP address are immediately reachable (no canMessage needed)
      const needsCanMessage: string[] = [];
      const addrToMemberIdx = new Map<string, number>();
      for (let i = 0; i < merged.length; i++) {
        const m = merged[i];
        if (m.storedXmtpAddress) {
          reachableMap.set(i, m.storedXmtpAddress.toLowerCase());
        } else {
          // Only check canMessage for members without a stored XMTP address
          for (const addr of m.addresses) {
            const normalized = addr.toLowerCase();
            if (!addrToMemberIdx.has(normalized)) {
              needsCanMessage.push(normalized);
              addrToMemberIdx.set(normalized, i);
            }
          }
        }
      }

      // Run canMessage only for members without a stored address
      if (needsCanMessage.length > 0) {
        try {
          const { IdentifierKind } = await import('@xmtp/browser-sdk');
          const BATCH_SIZE = 100;
          for (let i = 0; i < needsCanMessage.length; i += BATCH_SIZE) {
            const batch = needsCanMessage.slice(i, i + BATCH_SIZE);
            const identifiers = batch.map((addr) => ({
              identifierKind: IdentifierKind.Ethereum,
              identifier: addr,
            }));
            const results = await xmtpClient.canMessage(identifiers);
            for (const [addr, canMsg] of results.entries()) {
              if (canMsg) {
                const idx = addrToMemberIdx.get(addr.toLowerCase());
                if (idx !== undefined && !reachableMap.has(idx)) {
                  reachableMap.set(idx, addr.toLowerCase());
                }
              }
            }
          }
        } catch (err) {
          console.error('[XMTP] canMessage check failed:', err);
        }
      }

      const mapped: ZaoMember[] = merged
        .map((m: { fid: number | null; username: string | null; displayName: string; pfpUrl: string | null; addresses: string[]; lastLoginAt?: string | null }, idx: number) => ({
          fid: m.fid,
          username: m.username,
          displayName: m.displayName,
          pfpUrl: m.pfpUrl,
          addresses: m.addresses,
          reachable: reachableMap.has(idx),
          xmtpAddress: reachableMap.get(idx) || null,
          lastLoginAt: m.lastLoginAt || null,
        }))
        .sort((a: ZaoMember, b: ZaoMember) => {
          if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
          return a.displayName.localeCompare(b.displayName);
        });

      setZaoMembers(mapped);
      setLoadingMembers(false);

      const reachable = mapped.filter((m: ZaoMember) => m.reachable);
      console.debug(`[XMTP] ${reachable.length} reachable peers found`);

      // Resolve XMTP inbox IDs BEFORE starting streams (prevents "Unknown sender")
      const reachableMembersForInbox = mapped.filter((m: ZaoMember) => m.reachable && m.addresses.length > 0);
      if (reachableMembersForInbox.length > 0) {
        try {
          const { IdentifierKind } = await import('@xmtp/browser-sdk');
          const { saveMemberProfile } = await import('@/lib/xmtp/client');
          const PARALLEL = 10;
          for (let i = 0; i < reachableMembersForInbox.length; i += PARALLEL) {
            const batch = reachableMembersForInbox.slice(i, i + PARALLEL);
            await Promise.allSettled(batch.map(async (m) => {
              const inboxId = await xmtpClient.fetchInboxIdByIdentifier({
                identifierKind: IdentifierKind.Ethereum,
                identifier: m.xmtpAddress || m.addresses[0] || '',
              });
              if (inboxId) {
                saveMemberProfile(inboxId, {
                  fid: m.fid ?? 0,
                  username: m.username ?? m.displayName,
                  displayName: m.displayName,
                  pfpUrl: m.pfpUrl ?? '',
                });
              }
            }));
          }
          console.debug(`[XMTP] Resolved inbox IDs for ${reachableMembersForInbox.length} reachable peers`);
        } catch (err) {
          console.error('[XMTP] Inbox ID resolution failed:', err);
        }
      }

      await loadAllConversations();

      // Auto-create ZAO General for reachable ZAO members
      const reachableMembers = mapped.filter((m: ZaoMember) => m.reachable && m.addresses.length > 0);
      if (reachableMembers.length > 0) {
        const ZAO_GROUP_KEY = 'zaoos-xmtp-zao-general';
        let groupExists = false;
        for (const [, wc] of walletsRef.current.entries()) {
          const allConvos = await wc.client.conversations.list();
          for (const c of allConvos) {
            if ((c as Group).name === 'ZAO General') {
              groupExists = true;
              localStorage.setItem(ZAO_GROUP_KEY, c.id);
              break;
            }
          }
          if (groupExists) break;
        }

        if (!groupExists) {
          try {
            const { IdentifierKind } = await import('@xmtp/browser-sdk');
            const identifiers = reachableMembers.filter((m: ZaoMember) => m.addresses.length > 0).map((m: ZaoMember) => ({
              identifierKind: IdentifierKind.Ethereum,
              identifier: m.xmtpAddress || m.addresses[0],
            }));
            const conv = await xmtpClient.conversations.createGroupWithIdentifiers(identifiers, {
              groupName: 'ZAO General',
              groupDescription: 'General chat for all ZAO members',
            });
            localStorage.setItem(ZAO_GROUP_KEY, conv.id);
            await loadAllConversations();
          } catch (err) {
            console.error('[XMTP] Failed to create ZAO General group:', err);
          }
        }
      }
    } catch (err) {
      console.error('[XMTP] Failed to check ZAO members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [loadAllConversations]);

  /**
   * Auto-connect using a ZAO-generated XMTP-only key (no MetaMask needed).
   */
  const autoConnect = useCallback(async (fid: number) => {
    if (walletsRef.current.size > 0) return;
    if (tabLocked) {
      setError('ZAO OS messaging is open in another tab. Please close the other tab first.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const [{ getOrCreateLocalKey, createLocalSigner, createXMTPClient, saveConnectedWallet }, { ConsentState }] =
        await Promise.all([import('@/lib/xmtp/client'), import('@xmtp/browser-sdk')]);

      const privateKey = getOrCreateLocalKey(fid);
      const signer = await createLocalSigner(privateKey);
      const identifier = await Promise.resolve(signer.getIdentifier());
      const address = identifier.identifier.toLowerCase();

      setConnectingWallet(address);

      const client = await createXMTPClient(signer, address);
      primaryClientRef.current = client;

      await client.conversations.syncAll([ConsentState.Allowed]);

      walletsRef.current.set(address, { address, client });
      saveConnectedWallet(address);
      setConnectedWallets(Array.from(walletsRef.current.keys()));

      // Persist XMTP address to DB so other members can discover us
      fetch('/api/users/xmtp-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmtpAddress: address }),
      }).catch(() => { /* non-critical */ });

      // Seed last message cache, load conversations, then start streams
      await seedLastMessages();
      await loadAllConversations();
      await checkZaoMembers().catch((e: unknown) =>
        console.error('[XMTP] checkZaoMembers non-critical error:', e)
      );

      // Start global streams AFTER conversations are loaded
      await startGlobalStreams(client);

      // Clear any previous errors on successful connection
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to XMTP';
      setError(message);
      console.error('[XMTP] Auto-connect error:', err);
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  }, [tabLocked, seedLastMessages, loadAllConversations, checkZaoMembers, startGlobalStreams]);

  /**
   * Connect a specific wallet to XMTP
   */
  const connectWallet = useCallback(async (
    address: `0x${string}`,
    signMessage: (msg: string) => Promise<string>
  ) => {
    const normalized = address.toLowerCase();
    if (walletsRef.current.has(normalized)) return;
    if (tabLocked) {
      setError('ZAO OS messaging is open in another tab. Please close the other tab first.');
      return;
    }

    setIsConnecting(true);
    setConnectingWallet(normalized);
    setError(null);

    try {
      const [{ createWalletSigner, createXMTPClient, saveConnectedWallet }, { ConsentState }] =
        await Promise.all([import('@/lib/xmtp/client'), import('@xmtp/browser-sdk')]);
      const signer = await createWalletSigner(address, signMessage);
      const client = await createXMTPClient(signer, normalized);
      primaryClientRef.current = client;

      await client.conversations.syncAll([ConsentState.Allowed]);

      walletsRef.current.set(normalized, { address: normalized, client });
      saveConnectedWallet(normalized);
      setConnectedWallets(Array.from(walletsRef.current.keys()));

      await seedLastMessages();
      await loadAllConversations();
      await startGlobalStreams(client);

      // Clear any previous errors on successful connection
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet to XMTP';
      setError(message);
      console.error('[XMTP] Connect error:', err);
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  }, [tabLocked, seedLastMessages, loadAllConversations, startGlobalStreams]);

  const disconnectWallet = useCallback(async (address: string) => {
    const normalized = address.toLowerCase();
    const wc = walletsRef.current.get(normalized);
    if (!wc) return;

    wc.client.close();
    walletsRef.current.delete(normalized);

    const { removeConnectedWallet } = await import('@/lib/xmtp/client');
    removeConnectedWallet(normalized);

    setConnectedWallets(Array.from(walletsRef.current.keys()));
    loadAllConversations();
  }, [loadAllConversations]);

  const disconnectAll = useCallback(() => {
    // Stop global streams
    convStreamCleanupRef.current?.();
    msgStreamCleanupRef.current?.();
    convStreamCleanupRef.current = null;
    msgStreamCleanupRef.current = null;
    streamsActiveRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setStreamConnected(false);
    setReconnecting(false);
    reconnectAttemptsRef.current = 0;

    for (const [, wc] of walletsRef.current) {
      wc.client.close();
    }
    walletsRef.current.clear();
    primaryClientRef.current = null;
    lastMessagesRef.current.clear();
    messageIdSetRef.current.clear();

    if (typeof window !== 'undefined') {
      localStorage.removeItem('zaoos-xmtp-wallets');
    }

    setConnectedWallets([]);
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    activeConvIdRef.current = null;
    activeConvWalletRef.current = null;
  }, []);

  /**
   * Find which wallet client owns a conversation
   */
  const findClientForConversation = useCallback(async (convId: string): Promise<{ client: AnyClient; address: string } | null> => {
    for (const [address, wc] of walletsRef.current.entries()) {
      try {
        const conv = await wc.client.conversations.getConversationById(convId);
        if (conv) return { client: wc.client, address };
      } catch {
        // Client may not have this conversation
      }
    }
    return null;
  }, []);

  /**
   * Select a conversation and load its messages.
   * Uses isLoadingConvRef to prevent race conditions with the global stream.
   */
  const selectConversation = useCallback(async (id: string | null) => {
    // Increment generation to cancel any in-flight selectConversation calls
    const gen = ++convSelectGenRef.current;

    setActiveConversationId(id);
    activeConvIdRef.current = id;

    if (!id) {
      setMessages([]);
      messageIdSetRef.current.clear();
      activeConvWalletRef.current = null;
      isLoadingConvRef.current = false;
      return;
    }

    // Mark as loading — prevents stream from writing messages during load
    isLoadingConvRef.current = true;
    setLoadingMessages(true);

    try {
      const result = await findClientForConversation(id);
      if (gen !== convSelectGenRef.current) return; // stale — user switched conversations
      if (!result) {
        console.warn('[XMTP] Conversation not found:', id);
        setMessages([]);
        setError('This conversation is no longer available');
        return;
      }

      const { client } = result;
      activeConvWalletRef.current = result.address;

      const conv = await client.conversations.getConversationById(id);
      if (gen !== convSelectGenRef.current) return; // stale
      if (!conv) {
        console.warn('[XMTP] Could not load conversation:', id);
        setMessages([]);
        setError('This conversation is no longer available');
        return;
      }

      // Sync this specific conversation to get latest messages
      await conv.sync();
      if (gen !== convSelectGenRef.current) return; // stale
      const rawMessages = await conv.messages({ limit: BigInt(50) });
      if (gen !== convSelectGenRef.current) return; // stale
      const myInboxId = client.inboxId;

      const { getPeerProfiles, getMemberProfiles } = await import('@/lib/xmtp/client');
      const peerProfiles = getPeerProfiles();
      const memberProfiles = getMemberProfiles();
      const peer = peerProfiles[id];

      const decoded: XMTPMessage[] = rawMessages
        .filter(isTextMessage)
        .map((msg) => {
          const isFromMe = msg.senderInboxId === myInboxId;
          const memberProfile = memberProfiles[msg.senderInboxId];
          const senderName = isFromMe
            ? undefined
            : memberProfile?.displayName || (memberProfile?.username ? `@${memberProfile.username}` : undefined)
              || peer?.displayName || (peer?.username ? `@${peer.username}` : undefined);

          return {
            id: msg.id,
            conversationId: id,
            senderInboxId: msg.senderInboxId,
            senderDisplayName: senderName,
            senderPfpUrl: isFromMe ? undefined : memberProfile?.pfpUrl || peer?.pfpUrl || undefined,
            content: msg.content as string,
            sentAt: msg.sentAt,
            isFromMe,
          };
        });

      if (gen !== convSelectGenRef.current) return; // stale — don't apply results

      // Rebuild message ID set for dedup
      messageIdSetRef.current = new Set(decoded.map((m) => m.id));
      setMessages(decoded);

      // Clear unread count AFTER messages are loaded (not before)
      unreadCountsRef.current.set(id, 0);
      setConversations((prev) =>
        prev.map((c) => c.id === id ? { ...c, unreadCount: 0 } : c)
      );

      // Update last message cache from what we loaded
      if (decoded.length > 0) {
        const last = decoded[decoded.length - 1];
        lastMessagesRef.current.set(id, { content: last.content, sentAt: last.sentAt });
      }
    } catch (err) {
      if (gen !== convSelectGenRef.current) return; // stale — suppress error for cancelled load
      console.error('[XMTP] Failed to load messages:', err);
      setError('Failed to load messages. Try again.');
    } finally {
      // Only update loading state if this is still the current generation
      if (gen === convSelectGenRef.current) {
        setLoadingMessages(false);
        isLoadingConvRef.current = false;
      }
    }
  }, [findClientForConversation]);

  /**
   * Send a message using SDK's native optimistic send.
   * sendText(text, true) stores locally for instant UI, publishMessages() sends to network.
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!activeConversationId || !text.trim() || !activeConvWalletRef.current) return;

    const wc = walletsRef.current.get(activeConvWalletRef.current);
    if (!wc) return;

    const conv = await wc.client.conversations.getConversationById(activeConversationId);
    if (!conv) return;

    const trimmed = text.trim();

    try {
      // Step 1: Store locally (optimistic) — returns message ID
      const msgId = await conv.sendText(trimmed, true);

      // Show optimistic message in UI immediately
      const optimisticMsg: XMTPMessage = {
        id: msgId,
        conversationId: activeConversationId,
        senderInboxId: wc.client.inboxId ?? '',
        content: trimmed,
        sentAt: new Date(),
        isFromMe: true,
      };

      messageIdSetRef.current.add(msgId);
      setMessages((prev) => [...prev, optimisticMsg]);

      // Update sidebar immediately
      lastMessagesRef.current.set(activeConversationId, {
        content: trimmed,
        sentAt: optimisticMsg.sentAt,
      });
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === activeConversationId
              ? { ...c, lastMessage: trimmed, lastMessageAt: optimisticMsg.sentAt }
              : c
          )
          .sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0))
      );

      // Step 2: Publish to network
      await conv.publishMessages();
    } catch (err) {
      console.error('[XMTP] Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    }
  }, [activeConversationId]);

  const getFirstClient = useCallback((): AnyClient | null => {
    const first = walletsRef.current.values().next();
    return first.done ? null : first.value.client;
  }, []);

  /**
   * Create or find existing DM. Uses getDmByInboxId to avoid duplicates.
   */
  const createDm = useCallback(async (peerAddress: `0x${string}`, peerProfile?: XMTPPeerProfile) => {
    const client = getFirstClient();
    if (!client) return null;

    try {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');

      const inboxId = await client.fetchInboxIdByIdentifier({
        identifierKind: IdentifierKind.Ethereum,
        identifier: peerAddress,
      });
      if (inboxId) {
        const existing = await client.conversations.getDmByInboxId(inboxId);
        if (existing) {
          if (peerProfile) {
            const { savePeerProfile, saveMemberProfile } = await import('@/lib/xmtp/client');
            savePeerProfile(existing.id, peerProfile);
            saveMemberProfile(inboxId, peerProfile);
          }
          await loadAllConversations();
          return existing.id;
        }
      }

      const conv = await client.conversations.createDmWithIdentifier({
        identifierKind: IdentifierKind.Ethereum,
        identifier: peerAddress,
      });

      if (peerProfile) {
        const { savePeerProfile, saveMemberProfile } = await import('@/lib/xmtp/client');
        savePeerProfile(conv.id, peerProfile);
        try {
          const peerInboxId = await (conv as Dm).peerInboxId();
          if (peerInboxId) saveMemberProfile(peerInboxId, peerProfile);
        } catch { /* non-critical */ }
      }

      await loadAllConversations();
      return conv.id;
    } catch (err) {
      console.error('[XMTP] Failed to create DM:', err);
      showActionError('Failed to start conversation. The recipient may not have XMTP enabled.');
      return null;
    }
  }, [getFirstClient, loadAllConversations, showActionError]);

  const createGroup = useCallback(async (name: string, members: { address: `0x${string}`; profile?: XMTPPeerProfile }[]) => {
    const client = getFirstClient();
    if (!client) return null;

    try {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');
      const identifiers = members.map((m) => ({
        identifierKind: IdentifierKind.Ethereum,
        identifier: m.address,
      }));
      const conv = await client.conversations.createGroupWithIdentifiers(identifiers, {
        groupName: name,
        groupDescription: `ZAO group: ${name}`,
      });

      const profiledMembers = members.filter((m) => m.profile);
      if (profiledMembers.length > 0) {
        try {
          const group = conv as Group;
          const xmtpMembers = await group.members();
          const { saveMemberProfile } = await import('@/lib/xmtp/client');
          for (const xm of xmtpMembers) {
            const addresses = (xm.accountIdentifiers ?? []).map((id: { identifier: string }) => id.identifier.toLowerCase());
            const matched = profiledMembers.find((pm) =>
              addresses.includes(pm.address.toLowerCase())
            );
            if (matched?.profile && xm.inboxId) {
              saveMemberProfile(xm.inboxId, matched.profile);
            }
          }
        } catch { /* non-critical */ }
      }

      await loadAllConversations();
      return conv.id;
    } catch (err) {
      console.error('[XMTP] Failed to create group:', err);
      showActionError('Failed to create group. Some members may not have XMTP enabled.');
      return null;
    }
  }, [getFirstClient, loadAllConversations, showActionError]);

  const startDmWithMember = useCallback(async (member: ZaoMember) => {
    if (member.addresses.length === 0) return;
    // Use the address that passed canMessage, fall back to first address
    const addr = (member.xmtpAddress || member.addresses[0]) as `0x${string}`;
    const profile: XMTPPeerProfile = {
      fid: member.fid ?? 0,
      username: member.username ?? member.displayName,
      displayName: member.displayName,
      pfpUrl: member.pfpUrl ?? '',
    };
    const convId = await createDm(addr, profile);
    if (convId) selectConversation(convId);
  }, [createDm, selectConversation]);

  const refreshConversations = useCallback(async () => {
    const { ConsentState } = await import('@xmtp/browser-sdk');
    for (const [, wc] of walletsRef.current) {
      await wc.client.conversations.syncAll([ConsentState.Allowed]);
    }
    await seedLastMessages();
    await loadAllConversations();
  }, [seedLastMessages, loadAllConversations]);

  /**
   * Clear the current error state (for user-initiated dismissal).
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearActionError = useCallback(() => {
    if (actionErrorTimerRef.current) clearTimeout(actionErrorTimerRef.current);
    setActionError(null);
  }, []);

  /**
   * Remove a conversation from the local list (hide it).
   * Does not delete on the XMTP network — just removes from UI.
   */
  const removeConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvIdRef.current === id) {
      setActiveConversationId(null);
      activeConvIdRef.current = null;
      activeConvWalletRef.current = null;
      setMessages([]);
      messageIdSetRef.current.clear();
    }
    lastMessagesRef.current.delete(id);
    unreadCountsRef.current.delete(id);
  }, []);

  /**
   * Leave a group conversation on the XMTP network and remove from UI.
   */
  const leaveGroup = useCallback(async (id: string) => {
    const result = await findClientForConversation(id);
    if (!result) {
      showActionError('Could not find this conversation.');
      return;
    }
    try {
      await result.client.conversations.sync();
      const convos = await result.client.conversations.list();
      const conv = convos.find((c) => c.id === id);
      if (conv && result.client.inboxId) {
        const group = conv as Group;
        await group.removeMembers([result.client.inboxId]);
      }
    } catch (err) {
      console.error('[XMTP] Failed to leave group on network:', err);
      // Still remove locally even if network leave fails
    }
    // Remove from local state
    removeConversation(id);
  }, [findClientForConversation, removeConversation, showActionError]);

  /**
   * Get the member list for a group conversation.
   * Reads cached profiles from localStorage; falls back to truncated inbox IDs.
   */
  const getGroupMembers = useCallback(async (conversationId: string) => {
    const result = await findClientForConversation(conversationId);
    if (!result) return [];

    try {
      await result.client.conversations.sync();
      const convos = await result.client.conversations.list();
      const dms = await result.client.conversations.listDms();
      const dmIds = new Set(dms.map((d: Dm) => d.id));
      const conv = convos.find((c) => c.id === conversationId);
      if (!conv || dmIds.has(conv.id)) return [];

      const group = conv as Group;
      const xmtpMembers = await group.members();
      const { getMemberProfiles } = await import('@/lib/xmtp/client');
      const profiles = getMemberProfiles();

      return xmtpMembers.map((m) => {
        const profile = profiles[m.inboxId];
        if (profile) {
          return {
            inboxId: m.inboxId,
            displayName: profile.displayName,
            pfpUrl: profile.pfpUrl || '',
            username: profile.username,
          };
        }
        // Fallback: cross-reference accountIdentifiers with zaoMembers
        const addresses = (m.accountIdentifiers ?? []).map((id: { identifier: string }) => id.identifier.toLowerCase());
        const matched = zaoMembers.find((zm) =>
          zm.addresses.some((a) => addresses.includes(a.toLowerCase()))
        );
        if (matched) {
          return {
            inboxId: m.inboxId,
            displayName: matched.displayName,
            pfpUrl: matched.pfpUrl ?? '',
            username: matched.username ?? matched.displayName,
          };
        }
        return {
          inboxId: m.inboxId,
          displayName: m.inboxId.slice(0, 8),
          pfpUrl: '',
          username: undefined,
        };
      });
    } catch (err) {
      console.error('[XMTP] Failed to get group members:', err);
      return [];
    }
  }, [findClientForConversation, zaoMembers]);

  /**
   * Manually reconnect streams (user-initiated).
   */
  const reconnectStreams = useCallback(async () => {
    if (!primaryClientRef.current) {
      setError('No XMTP client available. Please reconnect your wallet.');
      return;
    }
    // Clear any existing reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    // Tear down existing streams
    convStreamCleanupRef.current?.();
    msgStreamCleanupRef.current?.();
    convStreamCleanupRef.current = null;
    msgStreamCleanupRef.current = null;
    streamsActiveRef.current = false;

    // Reset attempt counter for manual reconnection
    reconnectAttemptsRef.current = 0;
    setError(null);
    setReconnecting(true);

    await startGlobalStreams(primaryClientRef.current);
  }, [startGlobalStreams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (actionErrorTimerRef.current) {
        clearTimeout(actionErrorTimerRef.current);
        actionErrorTimerRef.current = null;
      }
      convStreamCleanupRef.current?.();
      msgStreamCleanupRef.current?.();
      streamsActiveRef.current = false;
      for (const [, wc] of walletsRef.current) {
        wc.client.close();
      }
      walletsRef.current.clear();
    };
  }, []);

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
    disconnectAll, selectConversation, sendMessage, createDm, createGroup,
    refreshConversations, startDmWithMember, clearError, clearActionError, reconnectStreams,
    removeConversation, leaveGroup, checkZaoMembers, getGroupMembers,
  ]);

  return (
    <XMTPContext.Provider value={contextValue}>
      {children}
    </XMTPContext.Provider>
  );
}
