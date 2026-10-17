'use client';

import { useCallback } from 'react';

/**
 * Day one connects with the app-generated burner key only. The own-wallet
 * option (wagmi `signMessage`, never a private key) from ZAOOS
 * `src/hooks/useWalletXMTP.ts` is not ported yet; this stub keeps the ported
 * MessagesRoom unchanged and reports that no wallet can connect.
 */
export function useWalletXMTP() {
  const connectWalletToXMTP = useCallback(async () => {}, []);
  return {
    connectWalletToXMTP,
    canConnect: false,
    isWalletConnected: false,
    isAlreadyLinked: false,
    walletAddress: undefined as `0x${string}` | undefined,
  };
}
