'use client';

import { useMemo, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniAppGate } from '@/components/miniapp/MiniAppGate';
import { getWagmiConfig } from '@/lib/wagmi/config';

// Lazy-load heavy wallet/auth providers — not needed on initial page render
import dynamic from 'next/dynamic';

const LazyRainbowKit = dynamic(
  () => import('@/components/providers/RainbowKitWrapper').then(m => ({ default: m.RainbowKitWrapper })),
  { ssr: false },
);

const LazyAuthKit = dynamic(
  () => import('@/components/providers/AuthKitWrapper').then(m => ({ default: m.AuthKitWrapper })),
  { ssr: false },
);

interface ProvidersProps {
  children: React.ReactNode;
  wagmiInitialState?: State;
}

export function Providers({ children, wagmiInitialState }: ProvidersProps) {
  const [wagmiConfig] = useState(() => getWagmiConfig());
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <WagmiProvider config={wagmiConfig} initialState={wagmiInitialState}>
      <QueryClientProvider client={queryClient}>
        <LazyRainbowKit>
          <LazyAuthKit>
            <MiniAppGate>{children}</MiniAppGate>
          </LazyAuthKit>
        </LazyRainbowKit>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
