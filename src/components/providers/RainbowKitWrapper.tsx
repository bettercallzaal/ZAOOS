'use client';

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

export function RainbowKitWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RainbowKitProvider
      theme={darkTheme({
        accentColor: '#f5a623',
        accentColorForeground: '#0a1628',
        borderRadius: 'medium',
      })}
    >
      {children}
    </RainbowKitProvider>
  );
}
