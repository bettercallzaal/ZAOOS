'use client';

import { useCallback } from 'react';
import type { Dm, Group } from '@xmtp/browser-sdk';
import type { XMTPConversation } from '@/types/xmtp';
import type { XMTPSharedRefs, XMTPSharedState, AnyClient } from '@/contexts/xmtp/types';
import { isTextMessage } from '@/contexts/xmtp/types';

/**
 * Hook for conversation list management: load, seed, select, refresh, remove.
 */
export function useConversations(refs: XMTPSharedRefs, state: XMTPSharedState) {
  const {
    walletsRef, activeConvIdRef, activeConvWalletRef, isLoadingConvRef,
    messageIdSetRef, lastMessagesRef, unreadCountsRef, convSelectGenRef,
  } = refs;
  const {
    setConversations, setActiveConversationId, setMessages, setLoadingMessages,
    setError,
  } = state;

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
  }, [walletsRef]);

  /**
   * Load conversations from all connected clients.
   * Does NOT call lastMessage() — uses in-memory cache instead.
   */
  const loadAllConversations = useCallback(async () => {
    const { getPeerProfiles, getMemberProfiles, savePeerProfile, saveMemberProfile } = await import('@/lib/xmtp/client');
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
              } else {
                // Fallback: try to resolve from zaoMembers by matching addresses
                try {
                  const dm = conv as Dm;
                  const peerMembers = await dm.members();
                  const peerMember = peerMembers.find((m) => m.inboxId === peerInboxId);
                  if (peerMember) {
                    const peerAddresses = (peerMember.accountIdentifiers ?? []).map((id: { identifier: string }) => id.identifier.toLowerCase());
                    const matched = refs.zaoMembersRef.current.find((zm) =>
                      zm.addresses.some((a) => peerAddresses.includes(a.toLowerCase()))
                    );
                    if (matched) {
                      const resolvedProfile = {
                        fid: matched.fid ?? 0,
                        username: matched.username ?? matched.displayName,
                        displayName: matched.displayName,
                        pfpUrl: matched.pfpUrl ?? '',
                      };
                      peer = resolvedProfile;
                      savePeerProfile(conv.id, resolvedProfile);
                      saveMemberProfile(peerInboxId, resolvedProfile);
                    }
                  }
                } catch { /* non-critical */ }
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
  }, [walletsRef, lastMessagesRef, unreadCountsRef, refs.zaoMembersRef, setConversations]);

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
  }, [walletsRef, lastMessagesRef]);

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

      const decoded = rawMessages
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
  }, [
    convSelectGenRef, activeConvIdRef, activeConvWalletRef, isLoadingConvRef,
    messageIdSetRef, lastMessagesRef, unreadCountsRef,
    setActiveConversationId, setMessages, setLoadingMessages, setError, setConversations,
    findClientForConversation,
  ]);

  /**
   * Refresh conversations by syncing all clients and reloading.
   */
  const refreshConversations = useCallback(async () => {
    const { ConsentState } = await import('@xmtp/browser-sdk');
    for (const [, wc] of walletsRef.current) {
      await wc.client.conversations.syncAll([ConsentState.Allowed]);
    }
    await seedLastMessages();
    await loadAllConversations();
  }, [walletsRef, seedLastMessages, loadAllConversations]);

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
  }, [activeConvIdRef, activeConvWalletRef, messageIdSetRef, lastMessagesRef, unreadCountsRef, setConversations, setActiveConversationId, setMessages]);

  return {
    findClientForConversation,
    loadAllConversations,
    seedLastMessages,
    selectConversation,
    refreshConversations,
    removeConversation,
  };
}
