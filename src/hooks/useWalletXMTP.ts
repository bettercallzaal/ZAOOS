'use client';

import { useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useXMTPContext } from '@/contexts/XMTPContext';

/**
 * Bridge hook: connects a wagmi-managed wallet to XMTP.
 * Uses wagmi's useWalletClient to get a signMessage callback,
 * then passes it to XMTPContext's existing connectWallet method.
 */
export function useWalletXMTP() {
  const { address, isConnected: isWalletConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const xmtp = useXMTPContext();

  const isAlreadyLinked = address
    ? xmtp.connectedWallets.includes(address.toLowerCase())
    : false;

  const canConnect = isWalletConnected && !!walletClient && !isAlreadyLinked && !xmtp.isConnecting;

  const connectWalletToXMTP = useCallback(async () => {
    if (!address || !walletClient) return;

    const signMessage = async (message: string): Promise<string> => {
      return walletClient.signMessage({ message });
    };

    await xmtp.connectWallet(address as `0x${string}`, signMessage);
  }, [address, walletClient, xmtp]);

  return {
    connectWalletToXMTP,
    canConnect,
    isWalletConnected,
    isAlreadyLinked,
    walletAddress: address,
  };
}
