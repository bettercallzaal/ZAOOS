'use client';

import dynamic from 'next/dynamic';

const SolanaProviders = dynamic(
  () => import('@/components/providers/SolanaProviders').then(m => ({ default: m.SolanaProviders })),
  { ssr: false },
);

const SolanaWalletConnect = dynamic(
  () => import('@/components/solana/SolanaWalletConnect').then(m => ({ default: m.SolanaWalletConnect })),
  { ssr: false, loading: () => <div className="h-12 animate-pulse bg-white/5 rounded-lg" /> },
);

interface LazySolanaWalletConnectProps {
  savedWallet: string | null;
  onSaved: (wallet: string | null) => void;
}

export function LazySolanaWalletConnect({ savedWallet, onSaved }: LazySolanaWalletConnectProps) {
  return (
    <SolanaProviders>
      <SolanaWalletConnect savedWallet={savedWallet} onSaved={onSaved} />
    </SolanaProviders>
  );
}
