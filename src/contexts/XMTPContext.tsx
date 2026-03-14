'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
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
}

interface XMTPContextValue {
  connectedWallets: string[];
  activeWalletCount: number;
  isConnecting: boolean;
  connectingWallet: string | null;
  isConnected: boolean;
  error: string | null;

  conversations: XMTPConversation[];
  activeConversationId: string | null;
  messages: XMTPMessage[];
  loadingMessages: boolean;

  zaoMembers: ZaoMember[];
  loadingMembers: boolean;

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
}

const XMTPContext = createContext<XMTPContextValue | null>(null);

export function useXMTPContext() {
  const ctx = useContext(XMTPContext);
  if (!ctx) throw new Error('useXMTPContext must be used within XMTPProvider');
  return ctx;
}

// Helper: check if a message is displayable text
function isTextMessage(msg: DecodedMessage): boolean {
  if (msg.contentType?.typeId === 'text') return true;
  // Fallback for older SDK versions
  return typeof msg.content === 'string' && msg.content.length > 0;
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
  const [zaoMembers, setZaoMembers] = useState<ZaoMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Track active conversation for the global message stream
  const activeConvIdRef = useRef<string | null>(null);
  const activeConvWalletRef = useRef<string | null>(null);

  // Global stream cleanup functions
  const convStreamCleanupRef = useRef<(() => void) | null>(null);
  const msgStreamCleanupRef = useRef<(() => void) | null>(null);

  // In-memory last message cache (avoids calling lastMessage() per conversation)
  const lastMessagesRef = useRef<Map<string, { content: string; sentAt: Date }>>(new Map());

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

            // Resolve peer profile for DMs
            let peer = isDm ? peerProfiles[conv.id] : undefined;

            if (isDm && !peer) {
              try {
                const peerInboxId = await (conv as Dm).peerInboxId();
                const memberMatch = peerInboxId ? memberProfiles[peerInboxId] : undefined;
                if (peerInboxId && memberMatch) {
                  peer = memberMatch;
                  savePeerProfile(conv.id, memberMatch);
                }
              } catch { /* non-critical */ }
            }

            const peerInboxId = isDm ? await (conv as Dm).peerInboxId().catch(() => undefined) : undefined;

            // Use cached last message instead of fetching from DB
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
              unreadCount: 0,
              walletAddress: address,
            } as XMTPConversation;
          })
        );
        allMapped.push(...mapped);
      } catch (err) {
        console.error(`Failed to load conversations for ${address}:`, err);
      }
    }

    // Sort by last message time (or creation order if no messages)
    allMapped.sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() ?? 0;
      const bTime = b.lastMessageAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    setConversations(allMapped);
  }, []);

  /**
   * Seed the last-message cache by fetching one message per conversation.
   * Called once after initial sync, much faster than the old approach.
   */
  const seedLastMessages = useCallback(async () => {
    for (const [, wc] of walletsRef.current.entries()) {
      try {
        const convos = await wc.client.conversations.list();
        // Fetch last messages in parallel batches of 20
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
   * Start global streams: one for new conversations, one for ALL messages.
   * Following xmtp.chat best practice — single global message stream
   * instead of per-conversation streams.
   */
  const startGlobalStreams = useCallback(async (client: AnyClient) => {
    // Stream new conversations
    const convStream = await client.conversations.stream({
      onValue: () => {
        loadAllConversations();
      },
    });
    convStreamCleanupRef.current = () => { void convStream.end(); };

    // Stream ALL messages across ALL conversations
    const { getMemberProfiles, getPeerProfiles } = await import('@/lib/xmtp/client');
    const msgStream = await client.conversations.streamAllMessages({
      onValue: (msg: DecodedMessage) => {
        if (!isTextMessage(msg)) return;

        const content = msg.content as string;
        const conversationId = msg.conversationId;
        const isFromMe = msg.senderInboxId === client.inboxId;

        // Update last message cache
        lastMessagesRef.current.set(conversationId, {
          content,
          sentAt: msg.sentAt,
        });

        // Update sidebar
        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === conversationId
                ? { ...c, lastMessage: content, lastMessageAt: msg.sentAt }
                : c
            )
            .sort((a, b) => {
              const aTime = a.lastMessageAt?.getTime() ?? 0;
              const bTime = b.lastMessageAt?.getTime() ?? 0;
              return bTime - aTime;
            })
        );

        // If this message is for the active conversation, add it to messages
        if (conversationId === activeConvIdRef.current) {
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

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      },
    });
    msgStreamCleanupRef.current = () => { void msgStream.end(); };
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
      const [membersRes, followsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/following/online'),
      ]);

      const zaoData = membersRes.ok ? await membersRes.json() : { members: [], currentFid: 0 };
      const followsData = followsRes.ok ? await followsRes.json() : { members: [], currentFid: 0 };
      const currentFid = zaoData.currentFid || followsData.currentFid;

      // Merge: follows take priority (they have Neynar pfps), ZAO members fill gaps
      const byFid = new Map<number, { fid: number | null; username: string | null; displayName: string; pfpUrl: string | null; addresses: string[]; isZaoMember: boolean }>();

      for (const m of followsData.members || []) {
        if (m.fid && m.fid !== currentFid) {
          byFid.set(m.fid, { ...m, isZaoMember: false });
        }
      }

      for (const m of zaoData.members || []) {
        if (m.fid === currentFid) continue;
        const existing = m.fid ? byFid.get(m.fid) : undefined;
        if (existing) {
          const addrs = new Set([...existing.addresses, ...m.addresses]);
          existing.addresses = [...addrs];
          existing.isZaoMember = true;
          if (!existing.pfpUrl && m.pfpUrl) existing.pfpUrl = m.pfpUrl;
        } else {
          const key = m.fid || -(byFid.size + 1);
          byFid.set(key, { ...m, isZaoMember: true });
        }
      }

      const merged = Array.from(byFid.values());

      // Collect all unique addresses
      const allAddresses: string[] = [];
      const addrToMemberIdx = new Map<string, number>();
      for (let i = 0; i < merged.length; i++) {
        for (const addr of merged[i].addresses) {
          const normalized = addr.toLowerCase();
          if (!addrToMemberIdx.has(normalized)) {
            allAddresses.push(normalized);
            addrToMemberIdx.set(normalized, i);
          }
        }
      }

      // Batch canMessage in chunks of 100
      const reachableSet = new Set<number>();
      if (allAddresses.length > 0) {
        try {
          const { IdentifierKind } = await import('@xmtp/browser-sdk');
          const BATCH_SIZE = 100;
          for (let i = 0; i < allAddresses.length; i += BATCH_SIZE) {
            const batch = allAddresses.slice(i, i + BATCH_SIZE);
            const identifiers = batch.map((addr) => ({
              identifierKind: IdentifierKind.Ethereum,
              identifier: addr,
            }));
            const results = await xmtpClient.canMessage(identifiers);
            for (const [addr, canMsg] of results.entries()) {
              if (canMsg) {
                const idx = addrToMemberIdx.get(addr.toLowerCase());
                if (idx !== undefined) reachableSet.add(idx);
              }
            }
          }
        } catch (err) {
          console.error('canMessage check failed:', err);
        }
      }

      const mapped: ZaoMember[] = merged
        .map((m, idx) => ({
          fid: m.fid,
          username: m.username,
          displayName: m.displayName,
          pfpUrl: m.pfpUrl,
          addresses: m.addresses,
          reachable: reachableSet.has(idx),
        }))
        .sort((a: ZaoMember, b: ZaoMember) => {
          if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
          return a.displayName.localeCompare(b.displayName);
        });

      setZaoMembers(mapped);
      setLoadingMembers(false);

      const reachable = mapped.filter((m: ZaoMember) => m.reachable);
      console.log(`[XMTP] ${reachable.length} reachable peers found`);

      // Resolve XMTP inbox IDs in parallel batches of 10
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
                identifier: m.addresses[0],
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
          console.log(`[XMTP] Resolved inbox IDs for ${reachableMembersForInbox.length} reachable peers`);
        } catch (err) {
          console.error('Inbox ID resolution failed:', err);
        }
      }

      // Reload conversations with updated profile mappings
      await loadAllConversations();

      // Auto-create ZAO General — only ZAO allowlist members
      const zaoFids = new Set((zaoData.members || []).map((m: { fid: number | null }) => m.fid).filter(Boolean));
      const reachableMembers = mapped.filter((m: ZaoMember) => m.reachable && m.addresses.length > 0 && m.fid && zaoFids.has(m.fid));
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
            const identifiers = reachableMembers.map((m: ZaoMember) => ({
              identifierKind: IdentifierKind.Ethereum,
              identifier: m.addresses[0],
            }));
            const conv = await xmtpClient.conversations.createGroupWithIdentifiers(identifiers, {
              groupName: 'ZAO General',
              groupDescription: 'General chat for all ZAO members',
            });
            localStorage.setItem(ZAO_GROUP_KEY, conv.id);
            await loadAllConversations();
          } catch (err) {
            console.error('Failed to create ZAO General group:', err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to check ZAO members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [loadAllConversations]);

  /**
   * Auto-connect using a locally generated key (no MetaMask needed).
   */
  const autoConnect = useCallback(async (fid: number) => {
    if (walletsRef.current.size > 0) return;

    setIsConnecting(true);
    setError(null);

    try {
      const { getOrCreateLocalKey, createLocalSigner, createXMTPClient, saveConnectedWallet } =
        await import('@/lib/xmtp/client');

      const privateKey = getOrCreateLocalKey(fid);
      const signer = await createLocalSigner(privateKey);
      const identifier = await Promise.resolve(signer.getIdentifier());
      const address = identifier.identifier.toLowerCase();

      setConnectingWallet(address);

      const client = await createXMTPClient(signer, address);

      // syncAll catches up on ALL missed messages + conversations
      await client.conversations.syncAll();

      walletsRef.current.set(address, { address, client });
      saveConnectedWallet(address);
      setConnectedWallets(Array.from(walletsRef.current.keys()));

      // Seed last message cache, then load conversations
      await seedLastMessages();

      // Check members + resolve profiles, then load conversations
      await checkZaoMembers();

      // Start global streams (conversations + all messages)
      await startGlobalStreams(client);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to XMTP';
      setError(message);
      console.error('XMTP auto-connect error:', err);
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  }, [seedLastMessages, loadAllConversations, checkZaoMembers, startGlobalStreams]);

  /**
   * Connect a specific wallet to XMTP
   */
  const connectWallet = useCallback(async (
    address: `0x${string}`,
    signMessage: (msg: string) => Promise<string>
  ) => {
    const normalized = address.toLowerCase();
    if (walletsRef.current.has(normalized)) return;

    setIsConnecting(true);
    setConnectingWallet(normalized);
    setError(null);

    try {
      const { createWalletSigner, createXMTPClient, saveConnectedWallet } = await import('@/lib/xmtp/client');
      const signer = createWalletSigner(address, signMessage);
      const client = await createXMTPClient(signer, normalized);

      await client.conversations.syncAll();

      walletsRef.current.set(normalized, { address: normalized, client });
      saveConnectedWallet(normalized);
      setConnectedWallets(Array.from(walletsRef.current.keys()));

      await seedLastMessages();
      await loadAllConversations();
      await startGlobalStreams(client);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet to XMTP';
      setError(message);
      console.error('XMTP connect error:', err);
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  }, [seedLastMessages, loadAllConversations, startGlobalStreams]);

  const disconnectWallet = useCallback((address: string) => {
    const normalized = address.toLowerCase();
    const wc = walletsRef.current.get(normalized);
    if (!wc) return;

    wc.client.close();
    walletsRef.current.delete(normalized);

    const { removeConnectedWallet } = require('@/lib/xmtp/client');
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

    for (const [, wc] of walletsRef.current) {
      wc.client.close();
    }
    walletsRef.current.clear();
    lastMessagesRef.current.clear();

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
      const conv = await wc.client.conversations.getConversationById(convId);
      if (conv) return { client: wc.client, address };
    }
    return null;
  }, []);

  /**
   * Select a conversation and load its messages.
   * No per-conversation stream needed — global streamAllMessages handles real-time.
   */
  const selectConversation = useCallback(async (id: string | null) => {
    setActiveConversationId(id);
    activeConvIdRef.current = id;

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

      // Sync this specific conversation to get latest messages
      await conv.sync();
      const rawMessages = await conv.messages({ limit: BigInt(50) });
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

      setMessages(decoded);

      // Update last message cache from what we loaded
      if (decoded.length > 0) {
        const last = decoded[decoded.length - 1];
        lastMessagesRef.current.set(id, { content: last.content, sentAt: last.sentAt });
      }
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

      // Check for existing DM first
      const inboxId = await client.fetchInboxIdByIdentifier({
        identifierKind: IdentifierKind.Ethereum,
        identifier: peerAddress,
      });
      if (inboxId) {
        const existing = await client.conversations.getDmByInboxId(inboxId);
        if (existing) {
          // Store/update profile and return existing conversation
          if (peerProfile) {
            const { savePeerProfile, saveMemberProfile } = await import('@/lib/xmtp/client');
            savePeerProfile(existing.id, peerProfile);
            saveMemberProfile(inboxId, peerProfile);
          }
          await loadAllConversations();
          return existing.id;
        }
      }

      // No existing DM — create new one
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
      console.error('Failed to create DM:', err);
      return null;
    }
  }, [getFirstClient, loadAllConversations]);

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
      console.error('Failed to create group:', err);
      return null;
    }
  }, [getFirstClient, loadAllConversations]);

  const startDmWithMember = useCallback(async (member: ZaoMember) => {
    if (member.addresses.length === 0) return;
    const addr = member.addresses[0] as `0x${string}`;
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
    for (const [, wc] of walletsRef.current) {
      await wc.client.conversations.syncAll();
    }
    await seedLastMessages();
    await loadAllConversations();
  }, [seedLastMessages, loadAllConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      convStreamCleanupRef.current?.();
      msgStreamCleanupRef.current?.();
      for (const [, wc] of walletsRef.current) {
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
      }}
    >
      {children}
    </XMTPContext.Provider>
  );
}
