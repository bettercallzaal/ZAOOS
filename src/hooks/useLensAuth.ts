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
 * Dynamic imports all Lens modules to avoid SSR issues.
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
      // Dynamic import all Lens SDK modules
      const { PublicClient, mainnet, evmAddress } = await import('@lens-protocol/client');
      const { fetchAccountsAvailable } = await import('@lens-protocol/client/actions');
      const { signMessageWith } = await import('@lens-protocol/client/viem');

      const appAddress = process.env.NEXT_PUBLIC_LENS_APP_ADDRESS
        || '0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE';

      const client = PublicClient.create({
        environment: mainnet,
        origin: window.location.origin,
      });

      // Check for existing Lens accounts
      const accountsResult = await fetchAccountsAvailable(client, {
        managedBy: evmAddress(address),
        includeOwned: true,
      });

      // Unwrap the Result type
      const accounts = accountsResult.isOk() ? accountsResult.value : null;

      let sessionClient;
      let handle = address.slice(0, 10) + '...';

      if (accounts?.items && accounts.items.length > 0) {
        // Login with existing account
        const account = accounts.items[0];
        const accountAddr = (account as any).account?.address || (account as any).address;
        const result = await client.login({
          accountOwner: {
            account: evmAddress(accountAddr),
            app: evmAddress(appAddress),
            owner: evmAddress(address),
          },
          signMessage: signMessageWith(walletClient),
        });

        if (result.isErr()) throw new Error((result.error as any)?.message || 'Login failed');
        sessionClient = result.value;

        const username = (account as any).account?.username?.localName
          || (account as any).username?.localName;
        handle = username ? `${username}.lens` : accountAddr?.slice(0, 10) + '...';
      } else {
        // Onboard as new user
        const result = await client.login({
          onboardingUser: {
            app: evmAddress(appAddress),
            wallet: evmAddress(address),
          },
          signMessage: signMessageWith(walletClient),
        });

        if (result.isErr()) throw new Error((result.error as any)?.message || 'Onboarding failed');
        sessionClient = result.value;
        handle = 'new:' + address.slice(0, 8);
      }

      // Try to enable signless mode
      try {
        const { enableSignless } = await import('@lens-protocol/client/actions');
        const { handleOperationWith } = await import('@lens-protocol/client/viem');
        await enableSignless(sessionClient).andThen(handleOperationWith(walletClient));
      } catch {
        // Signless may already be enabled or not supported
      }

      // Get credentials to store server-side
      let accessToken = '';
      let refreshToken = '';
      try {
        const credentials = await (sessionClient as any).getCredentials();
        accessToken = credentials?.accessToken || '';
        refreshToken = credentials?.refreshToken || '';
      } catch {
        // Some SDK versions don't have getCredentials
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
      setState({ isConnecting: false, error: msg, connectedHandle: null });
    }
  }, [address, walletClient]);

  return { ...state, connect, walletAddress: address };
}
