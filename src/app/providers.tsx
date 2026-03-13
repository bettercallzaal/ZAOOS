'use client';

import { AuthKitProvider } from '@farcaster/auth-kit';

const authKitConfig = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: process.env.NEXT_PUBLIC_SIWF_DOMAIN || 'zaoos.com',
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider config={authKitConfig}>
      {children}
    </AuthKitProvider>
  );
}
