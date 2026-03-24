'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';

interface LensAuthState {
  isConnecting: boolean;
  error: string | null;
  connectedHandle: string | null;
}

/**
 * Lens Protocol V3 auth hook.
 * Uses wagmi wallet to authenticate with Lens SDK.
 * Captures tokens via custom storage provider.
 */
export function useLensAuth() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [state, setState] = useState<LensAuthState>({
    isConnecting: false,
    error: null,
    connectedHandle: null,
  });

  const connect = useCallback(async () => {
    if (!address || !walletClient) {
      setState(s => ({ ...s, error: 'Connect your wallet first (use the wallet button at top)' }));
      return;
    }

    setState({ isConnecting: true, error: null, connectedHandle: null });

    try {
      const { PublicClient, mainnet, evmAddress } = await import('@lens-protocol/client');
      const { fetchAccountsAvailable } = await import('@lens-protocol/client/actions');
      const { signMessageWith } = await import('@lens-protocol/client/viem');

      const appAddress = process.env.NEXT_PUBLIC_LENS_APP_ADDRESS
        || '0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE';

      // Custom storage to capture tokens
      const tokenStore: Record<string, string> = {};
      const storage = {
        getItem: (key: string) => tokenStore[key] || null,
        setItem: (key: string, value: string) => { tokenStore[key] = value; },
        removeItem: (key: string) => { delete tokenStore[key]; },
      };

      const client = PublicClient.create({
        environment: mainnet,
        origin: window.location.origin,
        storage,
      });

      // Check for existing Lens accounts
      const accountsResult = await fetchAccountsAvailable(client, {
        managedBy: evmAddress(address),
        includeOwned: true,
      });

      const accounts = accountsResult.isOk() ? accountsResult.value : null;

      let handle = address.slice(0, 10) + '...';
      let loginResult;

      if (accounts?.items && accounts.items.length > 0) {
        const account = accounts.items[0] as Record<string, Record<string, unknown>>;
        const accountAddr = (account.account?.address || account.address) as string;
        loginResult = await client.login({
          accountOwner: {
            account: evmAddress(accountAddr),
            app: evmAddress(appAddress),
            owner: evmAddress(address),
          },
          signMessage: signMessageWith(walletClient),
        });

        const nestedUsername = account.account?.username as Record<string, unknown> | undefined;
        const topUsername = account.username as Record<string, unknown> | undefined;
        const username = (nestedUsername?.localName || topUsername?.localName) as string | undefined;
        handle = username ? `${username}.lens` : accountAddr?.slice(0, 10) + '...';
      } else {
        loginResult = await client.login({
          onboardingUser: {
            app: evmAddress(appAddress),
            wallet: evmAddress(address),
          },
          signMessage: signMessageWith(walletClient),
        });
        handle = 'new:' + address.slice(0, 8);
      }

      if (loginResult.isErr()) {
        const err = loginResult.error as Record<string, unknown> | undefined;
        throw new Error((err?.message as string) || 'Login failed');
      }

      // Extract tokens from our custom storage
      const storedKeys = Object.keys(tokenStore);
      let accessToken = '';
      let refreshToken = '';

      // The SDK stores credentials as JSON in storage
      for (const key of storedKeys) {
        try {
          const val = tokenStore[key];
          if (val.includes('accessToken') || val.includes('refreshToken')) {
            const parsed = JSON.parse(val);
            accessToken = parsed.accessToken || parsed.data?.accessToken || '';
            refreshToken = parsed.refreshToken || parsed.data?.refreshToken || '';
            break;
          }
          // Sometimes stored as plain token strings
          if (key.includes('access') && val.startsWith('ey')) accessToken = val;
          if (key.includes('refresh') && val.startsWith('ey')) refreshToken = val;
        } catch {
          // Try as plain string
          if (key.includes('access')) accessToken = tokenStore[key];
          if (key.includes('refresh')) refreshToken = tokenStore[key];
        }
      }

      // Log what we captured for debugging
      console.info('[lens-auth] Storage keys:', storedKeys);
      console.info('[lens-auth] Got tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken });

      // If we still don't have tokens, dump all storage for debugging
      if (!accessToken) {
        console.info('[lens-auth] All stored values:', JSON.stringify(tokenStore));
      }

      // Save to our server
      const saveRes = await fetch('/api/platforms/lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          accessToken,
          refreshToken,
          accountAddress: address,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save connection');
      }

      setState({ isConnecting: false, error: null, connectedHandle: handle });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Lens';
      console.error('[lens-auth] Error:', msg);
      setState({ isConnecting: false, error: msg, connectedHandle: null });
    }
  }, [address, walletClient]);

  return { ...state, connect, walletAddress: address };
}
