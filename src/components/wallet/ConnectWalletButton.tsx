'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletXMTP } from '@/hooks/useWalletXMTP';

interface ConnectWalletButtonProps {
  compact?: boolean;
}

export function ConnectWalletButton({ compact }: ConnectWalletButtonProps) {
  const { connectWalletToXMTP, canConnect, isAlreadyLinked, isWalletConnected } = useWalletXMTP();

  return (
    <div className="flex flex-col gap-2">
      <ConnectButton
        chainStatus="none"
        showBalance={false}
        accountStatus={compact ? 'avatar' : 'address'}
      />

      {isWalletConnected && !isAlreadyLinked && (
        <button
          onClick={connectWalletToXMTP}
          disabled={!canConnect}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-sm text-[#f5a623] font-medium hover:bg-[#f5a623]/20 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Link to XMTP Messaging
        </button>
      )}

      {isAlreadyLinked && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/5 border border-green-500/10">
          <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-xs text-green-500/80">Wallet linked to XMTP</span>
        </div>
      )}
    </div>
  );
}
