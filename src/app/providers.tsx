'use client';

import { useMemo, useState } from 'react';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniAppGate } from '@/components/miniapp/MiniAppGate';
import { AudioProviders } from '@/providers/audio';
import '@farcaster/auth-kit/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  const config = useMemo(() => ({
    rpcUrl: 'https://mainnet.optimism.io',
    domain: typeof window !== 'undefined' ? window.location.host : 'zaoos.com',
  }), []);

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthKitProvider config={config}>
        <AudioProviders>
          <MiniAppGate>{children}</MiniAppGate>
        </AudioProviders>
      </AuthKitProvider>
    </QueryClientProvider>
  );
}
