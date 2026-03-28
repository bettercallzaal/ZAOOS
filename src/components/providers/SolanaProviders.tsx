'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { SOLANA_ENDPOINT, getSolanaWallets } from '@/lib/solana/config';

export function SolanaProviders({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => getSolanaWallets(), []);

  return (
    <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
