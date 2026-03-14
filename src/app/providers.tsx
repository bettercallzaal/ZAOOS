'use client';

import { useMemo, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniAppGate } from '@/components/miniapp/MiniAppGate';
import { AudioProviders } from '@/providers/audio';
import { getWagmiConfig } from '@/lib/wagmi/config';
import '@farcaster/auth-kit/styles.css';
import '@rainbow-me/rainbowkit/styles.css';

interface ProvidersProps {
  children: React.ReactNode;
  wagmiInitialState?: State;
}

export function Providers({ children, wagmiInitialState }: ProvidersProps) {
  const authKitConfig = useMemo(() => ({
    rpcUrl: 'https://mainnet.optimism.io',
    domain: typeof window !== 'undefined' ? window.location.host : 'zaoos.com',
  }), []);

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
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#f5a623',
            accentColorForeground: '#0a1628',
            borderRadius: 'medium',
          })}
        >
          <AuthKitProvider config={authKitConfig}>
            <AudioProviders>
              <MiniAppGate>{children}</MiniAppGate>
            </AudioProviders>
          </AuthKitProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
