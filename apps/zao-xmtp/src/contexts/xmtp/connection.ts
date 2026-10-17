'use client';

// Ported from ZAOOS src/contexts/xmtp/connection.ts (bettercallzaal/ZAOOS, MIT) on 2026-10-17. Changed: publishXmtpAddress
// now proves control of the address with a signature (ZAO XMTP addition); comment em dashes became hyphens.

import { useCallback } from 'react';
import type { AnyClient, XMTPSharedRefs, XMTPSharedState } from '@/contexts/xmtp/types';

/**
 * Hook for XMTP client connection lifecycle: auto-connect, connect wallet,
 * disconnect, and switch wallet.
 */
export function useConnection(
  refs: XMTPSharedRefs,
  state: XMTPSharedState,
  seedLastMessages: () => Promise<void>,
  loadAllConversations: () => Promise<void>,
  checkZaoMembers: () => Promise<void>,
  startGlobalStreams: (client: AnyClient) => Promise<void>,
) {
  const {
    walletsRef,
    primaryClientRef,
    activeConvIdRef,
    activeConvWalletRef,
    messageIdSetRef,
    convStreamCleanupRef,
    msgStreamCleanupRef,
    streamsActiveRef,
    reconnectTimerRef,
    reconnectAttemptsRef,
    lastMessagesRef,
    messagingPrefsRef,
  } = refs;
  const {
    setConnectedWallets,
    setIsConnecting,
    setConnectingWallet,
    setError,
    setStreamConnected,
    setConversations,
    setActiveConversationId,
    setMessages,
    setReconnecting,
    tabLocked,
    showActionError,
  } = state;

  /** Fetch user's messaging preferences from the API */
  const fetchMessagingPrefs = useCallback(async () => {
    try {
      const res = await fetch('/api/users/messaging-prefs');
      if (res.ok) {
        const prefs = await res.json();
        messagingPrefsRef.current = { ...messagingPrefsRef.current, ...prefs };
      }
    } catch {
      /* use defaults */
    }
  }, [messagingPrefsRef]);

  /**
   * Save the XMTP address so other members can discover us. Non-fatal: a failure
   * is logged and shown as a toast, because the connection itself still works.
   * ZAO XMTP: the server asks for a signature from the address itself, so the
   * key behind it signs the server's message first (see lib/xmtp/address-claim.ts).
   */
  const publishXmtpAddress = useCallback(
    async (address: string, signMessage: (message: string) => Promise<string>) => {
      try {
        const challenge = await fetch(`/api/users/xmtp-address?address=${encodeURIComponent(address)}`);
        if (!challenge.ok) throw new Error(`xmtp-address challenge responded ${challenge.status}`);
        const { message } = (await challenge.json()) as { message: string };
        const signature = await signMessage(message);
        const res = await fetch('/api/users/xmtp-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xmtpAddress: address, signature }),
        });
        if (!res.ok) throw new Error(`xmtp-address responded ${res.status}`);
      } catch (err: unknown) {
        console.error('[XMTP] Failed to save XMTP address:', err);
        showActionError(
          'Messaging is on, but your address could not be saved. Other members may not find you yet.',
        );
      }
    },
    [showActionError],
  );

  /**
   * Auto-connect using a ZAO-generated XMTP-only key (no MetaMask needed).
   */
  const autoConnect = useCallback(
    async (fid: number) => {
      if (walletsRef.current.size > 0) return;
      if (tabLocked) {
        setError('ZAO OS messaging is open in another tab. Please close the other tab first.');
        return;
      }

      setIsConnecting(true);
      setError(null);

      try {
        // Fetch user messaging preferences before connecting
        await fetchMessagingPrefs();

        const [
          { getOrCreateLocalKey, createLocalSigner, createXMTPClient, saveConnectedWallet },
          { ConsentState },
        ] = await Promise.all([import('@/lib/xmtp/client'), import('@xmtp/browser-sdk')]);

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
        void publishXmtpAddress(address, async (message) => {
          const { signWithLocalKey } = await import('@/lib/xmtp/address-claim');
          return signWithLocalKey(privateKey, message);
        });

        // Seed last message cache, load conversations, resolve members, then re-load to apply profiles
        await seedLastMessages();
        await loadAllConversations();
        await checkZaoMembers().catch((e: unknown) =>
          console.error('[XMTP] checkZaoMembers non-critical error:', e),
        );
        // Re-load conversations now that member profiles are populated
        await loadAllConversations();

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
    },
    [
      walletsRef,
      primaryClientRef,
      tabLocked,
      setConnectedWallets,
      setIsConnecting,
      setConnectingWallet,
      setError,
      fetchMessagingPrefs,
      publishXmtpAddress,
      seedLastMessages,
      loadAllConversations,
      checkZaoMembers,
      startGlobalStreams,
    ],
  );

  /**
   * Connect a specific wallet to XMTP
   */
  const connectWallet = useCallback(
    async (address: `0x${string}`, signMessage: (msg: string) => Promise<string>) => {
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
        // Fetch user messaging preferences before connecting
        await fetchMessagingPrefs();

        const [{ createWalletSigner, createXMTPClient, saveConnectedWallet }, { ConsentState }] =
          await Promise.all([import('@/lib/xmtp/client'), import('@xmtp/browser-sdk')]);
        const signer = await createWalletSigner(address, signMessage);
        const client = await createXMTPClient(signer, normalized);
        primaryClientRef.current = client;

        await client.conversations.syncAll([ConsentState.Allowed]);

        walletsRef.current.set(normalized, { address: normalized, client });
        saveConnectedWallet(normalized);
        setConnectedWallets(Array.from(walletsRef.current.keys()));

        // Persist XMTP address to DB so other members can discover us
        void publishXmtpAddress(normalized, signMessage);

        // Full initialization: seed, load, check members, re-load with profiles, start streams
        await seedLastMessages();
        await loadAllConversations();
        await checkZaoMembers().catch((e: unknown) =>
          console.error('[XMTP] checkZaoMembers non-critical error:', e),
        );
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
    },
    [
      walletsRef,
      primaryClientRef,
      tabLocked,
      setConnectedWallets,
      setIsConnecting,
      setConnectingWallet,
      setError,
      fetchMessagingPrefs,
      publishXmtpAddress,
      seedLastMessages,
      loadAllConversations,
      checkZaoMembers,
      startGlobalStreams,
    ],
  );

  /**
   * Disconnect a specific wallet from XMTP.
   */
  const disconnectWallet = useCallback(
    async (address: string) => {
      const normalized = address.toLowerCase();
      const wc = walletsRef.current.get(normalized);
      if (!wc) return;

      wc.client.close();
      walletsRef.current.delete(normalized);

      const { removeConnectedWallet } = await import('@/lib/xmtp/client');
      removeConnectedWallet(normalized);

      setConnectedWallets(Array.from(walletsRef.current.keys()));
      loadAllConversations();
    },
    [walletsRef, setConnectedWallets, loadAllConversations],
  );

  /**
   * Disconnect all wallets, stop streams, and clear all state.
   */
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
      localStorage.removeItem('zaoos-xmtp-peers');
      localStorage.removeItem('zaoos-xmtp-members');
    }

    setConnectedWallets([]);
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    activeConvIdRef.current = null;
    activeConvWalletRef.current = null;
  }, [
    walletsRef,
    primaryClientRef,
    activeConvIdRef,
    activeConvWalletRef,
    messageIdSetRef,
    convStreamCleanupRef,
    msgStreamCleanupRef,
    streamsActiveRef,
    reconnectTimerRef,
    reconnectAttemptsRef,
    lastMessagesRef,
    setConnectedWallets,
    setStreamConnected,
    setConversations,
    setMessages,
    setActiveConversationId,
    setReconnecting,
  ]);

  /**
   * Switch XMTP wallet - disconnects all and clears saved wallets so the user
   * returns to the wallet picker screen on the Messages page.
   */
  const switchWallet = useCallback(() => {
    disconnectAll();
  }, [disconnectAll]);

  return {
    autoConnect,
    connectWallet,
    disconnectWallet,
    disconnectAll,
    switchWallet,
  };
}
