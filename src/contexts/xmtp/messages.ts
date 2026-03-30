'use client';

import { useCallback } from 'react';
import type { DecodedMessage } from '@xmtp/browser-sdk';
import type { XMTPMessage } from '@/types/xmtp';
import type { XMTPSharedRefs, XMTPSharedState, AnyClient } from '@/contexts/xmtp/types';
import { isTextMessage, MAX_RECONNECT_ATTEMPTS } from '@/contexts/xmtp/types';

/**
 * Hook for message sending and global stream management.
 */
export function useMessages(
  refs: XMTPSharedRefs,
  state: XMTPSharedState,
  loadAllConversations: () => Promise<void>,
) {
  const {
    walletsRef, primaryClientRef, activeConvIdRef, activeConvWalletRef,
    isLoadingConvRef, messageIdSetRef, convStreamCleanupRef, msgStreamCleanupRef,
    streamsActiveRef, reconnectTimerRef, reconnectAttemptsRef, lastMessagesRef,
    unreadCountsRef,
  } = refs;
  const {
    setError, setStreamConnected, setConversations, setMessages,
    setReconnecting, activeConversationId, showActionError,
  } = state;

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
          const isForActiveConv = msg.conversationId === activeConvIdRef.current;
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
  }, [
    streamsActiveRef, convStreamCleanupRef, msgStreamCleanupRef, reconnectAttemptsRef,
    reconnectTimerRef, primaryClientRef, activeConvIdRef, isLoadingConvRef,
    messageIdSetRef, lastMessagesRef, unreadCountsRef,
    setError, setStreamConnected, setConversations, setMessages, setReconnecting,
    loadAllConversations,
  ]);

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
    if (trimmed.length > 4000) {
      showActionError('Message too long (max 4000 characters)');
      return;
    }

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
  }, [
    activeConversationId, activeConvWalletRef, walletsRef, messageIdSetRef,
    lastMessagesRef, setMessages, setConversations, setError, showActionError,
  ]);

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
  }, [
    primaryClientRef, reconnectTimerRef, convStreamCleanupRef, msgStreamCleanupRef,
    streamsActiveRef, reconnectAttemptsRef, setError, setReconnecting, startGlobalStreams,
  ]);

  return {
    startGlobalStreams,
    sendMessage,
    reconnectStreams,
  };
}
