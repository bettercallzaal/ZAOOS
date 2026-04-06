'use client';

import { useMemo } from 'react';
import { AuthKitProvider } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';

export function AuthKitWrapper({ children }: { children: React.ReactNode }) {
  const config = useMemo(() => ({
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://optimism-rpc.publicnode.com',
    domain: typeof window !== 'undefined' ? window.location.host : 'zaoos.com',
  }), []);

  return (
    <AuthKitProvider config={config}>
      {children}
    </AuthKitProvider>
  );
}
