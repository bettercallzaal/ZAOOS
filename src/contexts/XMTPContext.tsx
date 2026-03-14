'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { Client, Dm, Group } from '@xmtp/browser-sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = Client<any>;
import type { XMTPConversation, XMTPMessage } from '@/types/xmtp';
import type { XMTPPeerProfile } from '@/lib/xmtp/client';

interface WalletClient {
  address: string;
  client: AnyClient;
  streamController: AbortController | null;
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

  // ZAO members reachability
  zaoMembers: ZaoMember[];
  loadingMembers: boolean;

  // Actions
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
  const msgAbortRef = useRef<AbortController | null>(null);
  // Track which wallet owns the active conversation
  const activeConvWalletRef = useRef<string | null>(null);
  // Cache of allowlist members (address → profile) for resolving XMTP peers
  const membersByAddrRef = useRef<Map<string, { fid: number; username: string; displayName: string; pfpUrl: string }>>(new Map());

  /**
   * Load and merge conversations from all connected wallet clients
   */
  const loadAllConversations = useCallback(async () => {
    const { getPeerProfiles, savePeerProfile, saveMemberProfile } = await import('@/lib/xmtp/client');
    const peerProfiles = getPeerProfiles();
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

            // Resolve peer profile for DMs
            let peer = isDm ? peerProfiles[conv.id] : undefined;

            // If no stored profile, try to resolve from conversation members + allowlist cache
            if (isDm && !peer && membersByAddrRef.current.size > 0) {
              try {
                const members = await conv.members();
                const myInboxId = wc.client.inboxId;
                for (const m of members) {
                  if (m.inboxId === myInboxId) continue;
                  const addrs = (m.accountIdentifiers ?? []).map((id: { identifier: string }) => id.identifier.toLowerCase());
                  for (const a of addrs) {
                    const match = membersByAddrRef.current.get(a);
                    if (match) {
                      peer = match;
                      // Persist so we don't re-resolve
                      savePeerProfile(conv.id, match);
                      saveMemberProfile(m.inboxId, match);
                      break;
                    }
                  }
                  if (peer) break;
                }
              } catch { /* non-critical */ }
            }

            // For groups, also resolve members we haven't seen before
            if (!isDm && membersByAddrRef.current.size > 0) {
              try {
                const members = await conv.members();
                for (const m of members) {
                  const addrs = (m.accountIdentifiers ?? []).map((id: { identifier: string }) => id.identifier.toLowerCase());
                  for (const a of addrs) {
                    const match = membersByAddrRef.current.get(a);
                    if (match && m.inboxId) {
                      saveMemberProfile(m.inboxId, match);
                      break;
                    }
                  }
                }
              } catch { /* non-critical */ }
            }

            return {
              id: conv.id,
              type: isDm ? 'dm' as const : 'group' as const,
              name: (!isDm && group.name) ? group.name : (isDm && peer ? peer.displayName || `@${peer.username}` : isDm ? 'Direct Message' : 'Group'),
              imageUrl: (!isDm && group.imageUrl) ? group.imageUrl : undefined,
              description: (!isDm && group.description) ? group.description : undefined,
              peerInboxId: isDm ? await (conv as Dm).peerInboxId() : undefined,
              peerDisplayName: peer ? (peer.displayName || `@${peer.username}`) : undefined,
              peerPfpUrl: peer?.pfpUrl || undefined,
              lastMessage: typeof lastContent === 'string' ? lastContent : undefined,
              lastMessageAt: lastMsg?.sentAt,
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

    // Sort by last message time, most recent first
    allMapped.sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() ?? 0;
      const bTime = b.lastMessageAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    setConversations(allMapped);
  }, []);

  /**
   * Check which ZAO allowlist members are reachable via XMTP
   */
  const checkZaoMembers = useCallback(async () => {
    const client = walletsRef.current.values().next();
    if (client.done) return;
    const xmtpClient = client.value.client;

    setLoadingMembers(true);
    try {
      const res = await fetch('/api/members');
      if (!res.ok) return;
      const { members, currentFid } = await res.json();

      // Build address → profile lookup for conversation resolution
      const addrMap = new Map<string, { fid: number; username: string; displayName: string; pfpUrl: string }>();
      for (const m of members) {
        const profile = { fid: m.fid ?? 0, username: m.username ?? m.displayName, displayName: m.displayName, pfpUrl: m.pfpUrl ?? '' };
        for (const addr of m.addresses) {
          addrMap.set(addr.toLowerCase(), profile);
        }
      }
      membersByAddrRef.current = addrMap;

      // Collect all unique addresses to check
      const allAddresses: string[] = [];
      const addrToMemberIdx = new Map<string, number>();

      for (let i = 0; i < members.length; i++) {
        // Skip self
        if (members[i].fid === currentFid) continue;
        for (const addr of members[i].addresses) {
          const normalized = addr.toLowerCase();
          if (!addrToMemberIdx.has(normalized)) {
            allAddresses.push(normalized);
            addrToMemberIdx.set(normalized, i);
          }
        }
      }

      // Batch canMessage check
      let reachableSet = new Set<number>(); // indices of reachable members
      if (allAddresses.length > 0) {
        try {
          const { IdentifierKind } = await import('@xmtp/browser-sdk');
          const identifiers = allAddresses.map((addr) => ({
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
        } catch (err) {
          console.error('canMessage check failed:', err);
        }
      }

      const mapped: ZaoMember[] = members
        .filter((_: unknown, i: number) => {
          // Keep all non-self members
          return members[i].fid !== currentFid;
        })
        .map((m: { fid: number | null; username: string | null; displayName: string; pfpUrl: string | null; addresses: string[] }, origIdx: number) => ({
          ...m,
          reachable: reachableSet.has(origIdx),
        }))
        // Sort: reachable first, then alphabetical
        .sort((a: ZaoMember, b: ZaoMember) => {
          if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
          return a.displayName.localeCompare(b.displayName);
        });

      setZaoMembers(mapped);

      // Reload conversations now that we have member profiles to resolve against
      await loadAllConversations();

      // Auto-create "ZAO General" group if it doesn't exist yet
      const reachableMembers = mapped.filter((m: ZaoMember) => m.reachable && m.addresses.length > 0);
      if (reachableMembers.length > 0) {
        const ZAO_GROUP_KEY = 'zaoos-xmtp-zao-general';
        const existingGroupId = localStorage.getItem(ZAO_GROUP_KEY);

        // Check if the group still exists in our conversation list
        let groupExists = false;
        if (existingGroupId) {
          for (const [, wc] of walletsRef.current.entries()) {
            const conv = await wc.client.conversations.getConversationById(existingGroupId);
            if (conv) { groupExists = true; break; }
          }
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

            // Store member profiles for sender resolution
            try {
              const { saveMemberProfile } = await import('@/lib/xmtp/client');
              const groupMembers = await (conv as Group).members();
              for (const xm of groupMembers) {
                const addresses = (xm.accountIdentifiers ?? []).map((id: { identifier: string }) => id.identifier.toLowerCase());
                const matched = reachableMembers.find((rm: ZaoMember) =>
                  rm.addresses.some((a: string) => addresses.includes(a.toLowerCase()))
                );
                if (matched && xm.inboxId) {
                  saveMemberProfile(xm.inboxId, {
                    fid: matched.fid ?? 0,
                    username: matched.username ?? matched.displayName,
                    displayName: matched.displayName,
                    pfpUrl: matched.pfpUrl ?? '',
                  });
                }
              }
            } catch { /* non-critical */ }

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
   * This is the default flow for Farcaster-authenticated users.
   */
  const autoConnect = useCallback(async (fid: number) => {
    if (walletsRef.current.size > 0) return; // Already connected

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
      await client.conversations.sync();

      const controller = new AbortController();
      walletsRef.current.set(address, {
        address,
        client,
        streamController: controller,
      });

      saveConnectedWallet(address);
      setConnectedWallets(Array.from(walletsRef.current.keys()));
      await loadAllConversations();

      // Check which ZAO members are reachable via XMTP
      checkZaoMembers();

      // Stream new conversations
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
      const message = err instanceof Error ? err.message : 'Failed to connect to XMTP';
      setError(message);
      console.error('XMTP auto-connect error:', err);
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  }, [loadAllConversations, checkZaoMembers]);

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

      // Resolve sender names: for DMs, the other person is the stored peer
      const { getPeerProfiles, getMemberProfiles } = await import('@/lib/xmtp/client');
      const peerProfiles = getPeerProfiles();
      const memberProfiles = getMemberProfiles();
      const peer = peerProfiles[id];

      const decoded: XMTPMessage[] = rawMessages
        .filter((msg) => typeof msg.content === 'string')
        .map((msg) => {
          const isFromMe = msg.senderInboxId === myInboxId;
          const memberProfile = memberProfiles[msg.senderInboxId];
          const senderName = isFromMe
            ? undefined
            : memberProfile?.displayName || memberProfile?.username
              ? `@${memberProfile.username}`
              : peer?.displayName || peer?.username
                ? peer.displayName || `@${peer.username}`
                : undefined;

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

      // Stream new messages for this conversation
      const controller = new AbortController();
      msgAbortRef.current = controller;
      (async () => {
        try {
          const stream = await conv.stream({
            onValue: (msg) => {
              if (!client) return;
              // Skip non-text messages (group updates, etc.)
              if (typeof msg.content !== 'string') return;
              const isFromMe = msg.senderInboxId === client.inboxId;
              const mp = memberProfiles[msg.senderInboxId];
              const senderName = isFromMe
                ? undefined
                : mp?.displayName || mp?.username
                  ? `@${mp.username}`
                  : peer?.displayName || peer?.username
                    ? peer.displayName || `@${peer.username}`
                    : undefined;
              const newMsg: XMTPMessage = {
                id: msg.id,
                conversationId: id,
                senderInboxId: msg.senderInboxId,
                senderDisplayName: senderName,
                senderPfpUrl: isFromMe ? undefined : mp?.pfpUrl || peer?.pfpUrl || undefined,
                content: msg.content,
                sentAt: msg.sentAt,
                isFromMe,
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

  const createDm = useCallback(async (peerAddress: `0x${string}`, peerProfile?: XMTPPeerProfile) => {
    const client = getFirstClient();
    if (!client) return null;

    try {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');
      const conv = await client.conversations.createDmWithIdentifier({
        identifierKind: IdentifierKind.Ethereum,
        identifier: peerAddress,
      });

      // Store peer profile for display name resolution
      if (peerProfile) {
        const { savePeerProfile } = await import('@/lib/xmtp/client');
        savePeerProfile(conv.id, peerProfile);

        // Also map the peer's inbox ID to their profile for message sender resolution
        try {
          const peerInboxId = await (conv as Dm).peerInboxId();
          if (peerInboxId) {
            const { saveMemberProfile } = await import('@/lib/xmtp/client');
            saveMemberProfile(peerInboxId, peerProfile);
          }
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

      // Store member profiles for message sender resolution
      // We'll map inbox IDs after the group is created
      const profiledMembers = members.filter((m) => m.profile);
      if (profiledMembers.length > 0) {
        try {
          const group = conv as Group;
          const xmtpMembers = await group.members();
          const { saveMemberProfile } = await import('@/lib/xmtp/client');
          for (const xm of xmtpMembers) {
            // Match by address — XMTP member addresses include the address used to create
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

  /**
   * Start a DM with a ZAO member (picks first reachable address)
   */
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
