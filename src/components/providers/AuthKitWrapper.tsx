'use client';

import { useMemo } from 'react';
import { AuthKitProvider } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';

export function AuthKitWrapper({ children }: { children: React.ReactNode }) {
  const config = useMemo(() => ({
    rpcUrl: 'https://mainnet.optimism.io',
    domain: typeof window !== 'undefined' ? window.location.host : 'zaoos.com',
  }), []);

  return (
    <AuthKitProvider config={config}>
      {children}
    </AuthKitProvider>
  );
}
