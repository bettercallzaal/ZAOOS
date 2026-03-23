'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';

interface LensAuthState {
  isConnecting: boolean;
  error: string | null;
  connectedHandle: string | null;
}

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
      setState(s => ({ ...s, error: 'Connect your wallet first' }));
      return;
    }

    setState({ isConnecting: true, error: null, connectedHandle: null });

    try {
      // Dynamic import to avoid SSR issues with Lens SDK
      const { PublicClient, mainnet, evmAddress } = await import("@lens-protocol/client");
      const { fetchAccountsAvailable } = await import("@lens-protocol/client/actions");
      const { signMessageWith } = await import("@lens-protocol/client/viem");

      const appAddress = process.env.NEXT_PUBLIC_LENS_APP_ADDRESS
        || "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE";

      const client = PublicClient.create({
        environment: mainnet,
        origin: window.location.origin,
      });

      // Check for existing Lens accounts
      const accounts = await fetchAccountsAvailable(client, {
        managedBy: evmAddress(address),
        includeOwned: true,
      });

      let sessionClient;
      let handle = address.slice(0, 10) + '...';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((accounts as any)?.items && (accounts as any).items.length > 0) {
        // Login with existing account
        const account = (accounts as any).items[0];
        const result = await client.login({
          accountOwner: {
            account: evmAddress(account.account.address),
            app: evmAddress(appAddress),
            owner: evmAddress(address),
          },
          signMessage: signMessageWith(walletClient),
        });

        if (result.isErr()) throw new Error(result.error?.message || 'Login failed');
        sessionClient = result.value;
        handle = account.account.username?.localName
          || account.account.address.slice(0, 10) + '...';
      } else {
        // Onboard as new user
        const result = await client.login({
          onboardingUser: {
            app: evmAddress(appAddress),
            wallet: evmAddress(address),
          },
          signMessage: signMessageWith(walletClient),
        });

        if (result.isErr()) throw new Error(result.error?.message || 'Onboarding failed');
        sessionClient = result.value;
        handle = 'new-user:' + address.slice(0, 8);
      }

      // Try to enable signless mode (one extra wallet sign, but then no more popups)
      try {
        const { enableSignless } = await import("@lens-protocol/client/actions");
        const { handleOperationWith } = await import("@lens-protocol/client/viem");
        await enableSignless(sessionClient).andThen(handleOperationWith(walletClient));
      } catch {
        // Signless may already be enabled or not supported — continue anyway
      }

      // Get the session credentials to store server-side
      const credentials = await sessionClient.getCredentials();

      // Save tokens to our server
      const saveRes = await fetch('/api/platforms/lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          accessToken: (credentials as any)?.accessToken || '',
          refreshToken: (credentials as any)?.refreshToken || '',
          accountAddress: (accounts as any)?.items?.[0]?.account?.address || address,
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
