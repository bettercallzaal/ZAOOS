'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface ConnectXMTPProps {
  isConnecting: boolean;
  error: string | null;
  onConnect: () => void;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ConnectXMTP({ isConnecting, error, onConnect }: ConnectXMTPProps) {
  const { isConnected: hasWallet, address: wagmiAddress } = useAccount();
  const [verifiedAddresses, setVerifiedAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  // Fetch user's verified Farcaster addresses
  useEffect(() => {
    fetch('/api/users/wallet')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.verifiedAddresses) {
          setVerifiedAddresses(data.verifiedAddresses);
        }
      })
      .catch(() => { /* non-critical */ });
  }, []);

  // Build deduplicated wallet list: wagmi wallet + verified addresses
  const allWallets: { address: string; label: string; isWagmi: boolean }[] = [];
  const seen = new Set<string>();

  if (wagmiAddress) {
    const norm = wagmiAddress.toLowerCase();
    seen.add(norm);
    allWallets.push({ address: norm, label: 'Connected Wallet', isWagmi: true });
  }

  for (const addr of verifiedAddresses) {
    const norm = addr.toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      allWallets.push({ address: norm, label: 'Farcaster Verified', isWagmi: false });
    }
  }

  // Auto-select wagmi wallet if nothing selected
  const effectiveSelected = selectedAddress ?? (wagmiAddress?.toLowerCase() || null);

  const selectedIsWagmi = effectiveSelected
    ? wagmiAddress?.toLowerCase() === effectiveSelected
    : false;

  const canConnect = hasWallet && selectedIsWagmi && !isConnecting;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f5a623]/20 to-[#f5a623]/5 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Private Messaging</h2>
      <p className="text-sm text-gray-400 max-w-sm mb-2">
        End-to-end encrypted messaging powered by XMTP. DM other ZAO members or create private group chats.
      </p>
      <p className="text-xs text-gray-600 max-w-sm mb-6">
        Choose which wallet to use as your XMTP messaging identity.
      </p>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-900/30 text-red-400 text-xs rounded-lg max-w-sm">
          {error}
        </div>
      )}

      {/* Wallet Picker */}
      {hasWallet && allWallets.length > 1 ? (
        <div className="w-full max-w-sm mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Select Wallet</p>
          <div className="space-y-2">
            {allWallets.map((w) => (
              <button
                key={w.address}
                onClick={() => setSelectedAddress(w.address)}
                disabled={isConnecting}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
                  effectiveSelected === w.address
                    ? 'border-[#f5a623] bg-[#f5a623]/5'
                    : 'border-gray-800 bg-[#0d1b2a] hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    effectiveSelected === w.address ? 'bg-[#f5a623]' : 'bg-gray-700'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm text-white font-mono truncate">{shortAddr(w.address)}</p>
                    <p className="text-xs text-gray-500">{w.label}</p>
                  </div>
                </div>
                {w.isWagmi && (
                  <span className="text-[10px] text-green-500/70 flex-shrink-0 ml-2">Active</span>
                )}
                {!w.isWagmi && effectiveSelected === w.address && (
                  <span className="text-[10px] text-[#f5a623] flex-shrink-0 ml-2">Switch wallet first</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {hasWallet ? (
        <div className="space-y-3">
          <button
            onClick={onConnect}
            disabled={!canConnect}
            className="flex items-center gap-2 px-6 py-3 bg-[#f5a623] text-black font-medium rounded-xl hover:bg-[#ffd700] transition-colors disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Setting up messaging...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Enable Messaging
              </>
            )}
          </button>
          {effectiveSelected && !selectedIsWagmi && (
            <p className="text-xs text-[#f5a623] max-w-sm">
              To use this wallet, switch to it in your wallet app first, then reconnect.
            </p>
          )}
        </div>
      ) : (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="flex items-center gap-2 px-6 py-3 bg-[#f5a623] text-black font-medium rounded-xl hover:bg-[#ffd700] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      )}
    </div>
  );
}
