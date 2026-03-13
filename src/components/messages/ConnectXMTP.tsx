'use client';

import { useState, useEffect, useCallback } from 'react';

interface WalletInfo {
  address: string;
  label: string;
  source: 'verified' | 'custody' | 'external';
}

interface ConnectXMTPProps {
  isConnecting: boolean;
  connectingWallet: string | null;
  connectedWallets: string[];
  error: string | null;
  onConnectWallet: (address: `0x${string}`) => void;
  onContinue: () => void;
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ConnectXMTP({
  isConnecting,
  connectingWallet,
  connectedWallets,
  error,
  onConnectWallet,
  onContinue,
}: ConnectXMTPProps) {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [externalAddress, setExternalAddress] = useState('');

  // Fetch Farcaster-linked wallets
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/wallet');
        if (!res.ok) throw new Error('Failed to fetch wallets');
        const data = await res.json();

        const found: WalletInfo[] = [];

        if (data.verifiedAddresses?.length) {
          data.verifiedAddresses.forEach((addr: string, i: number) => {
            found.push({
              address: addr.toLowerCase(),
              label: data.verifiedAddresses.length === 1 ? 'Verified Wallet' : `Verified Wallet ${i + 1}`,
              source: 'verified',
            });
          });
        }

        if (data.custodyAddress) {
          found.push({
            address: data.custodyAddress.toLowerCase(),
            label: 'Custody Wallet',
            source: 'custody',
          });
        }

        setWallets(found);
      } catch (err) {
        console.error('Failed to load wallets:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddExternal = useCallback(() => {
    const addr = externalAddress.trim();
    if (!addr.match(/^0x[a-fA-F0-9]{40}$/)) return;

    const normalized = addr.toLowerCase();
    if (wallets.some((w) => w.address === normalized)) return;

    setWallets((prev) => [...prev, {
      address: normalized,
      label: 'External Wallet',
      source: 'external' as const,
    }]);
    setExternalAddress('');
    setShowAddWallet(false);
  }, [externalAddress, wallets]);

  const hasConnected = connectedWallets.length > 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      {/* Header */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f5a623]/20 to-[#f5a623]/5 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Private Messaging</h2>
      <p className="text-sm text-gray-400 max-w-sm mb-1">
        End-to-end encrypted messaging powered by XMTP.
      </p>
      <p className="text-xs text-gray-500 max-w-sm mb-6">
        Connect your wallets to see messages across all of them. Each wallet has its own XMTP inbox. No gas fees — just a signature to prove ownership.
      </p>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-900/30 text-red-400 text-xs rounded-lg max-w-sm">
          {error}
        </div>
      )}

      {/* Wallet list */}
      <div className="w-full max-w-sm space-y-2 mb-6">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <div className="px-4 py-3 bg-white/5 rounded-xl text-sm text-gray-400">
            No wallets found on your Farcaster account. Add one below.
          </div>
        ) : (
          wallets.map((wallet) => {
            const isConnected = connectedWallets.includes(wallet.address);
            const isCurrentlyConnecting = connectingWallet === wallet.address;

            return (
              <div
                key={wallet.address}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  isConnected
                    ? 'bg-[#f5a623]/5 border-[#f5a623]/30'
                    : 'bg-white/5 border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Wallet icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isConnected ? 'bg-[#f5a623]/20' : 'bg-white/10'
                }`}>
                  {isConnected ? (
                    <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.75a2.25 2.25 0 012.25 2.25V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3H18" />
                    </svg>
                  )}
                </div>

                {/* Wallet info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white">{wallet.label}</p>
                  <p className="text-xs text-gray-500 font-mono">{truncateAddress(wallet.address)}</p>
                </div>

                {/* Source badge */}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  wallet.source === 'verified'
                    ? 'bg-green-900/30 text-green-400'
                    : wallet.source === 'custody'
                    ? 'bg-blue-900/30 text-blue-400'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {wallet.source === 'verified' ? 'Farcaster' : wallet.source === 'custody' ? 'Custody' : 'External'}
                </span>

                {/* Connect button */}
                {isConnected ? (
                  <span className="text-xs text-[#f5a623] font-medium flex-shrink-0">Connected</span>
                ) : (
                  <button
                    onClick={() => onConnectWallet(wallet.address as `0x${string}`)}
                    disabled={isConnecting}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#f5a623] text-black font-medium hover:bg-[#ffd700] transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {isCurrentlyConnecting ? (
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Connect'
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Add external wallet */}
        {showAddWallet ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={externalAddress}
              onChange={(e) => setExternalAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-3 py-2 bg-white/5 border border-gray-800 rounded-lg text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/50"
            />
            <button
              onClick={handleAddExternal}
              disabled={!externalAddress.match(/^0x[a-fA-F0-9]{40}$/)}
              className="px-3 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/15 disabled:opacity-30 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAddWallet(false); setExternalAddress(''); }}
              className="px-2 py-2 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddWallet(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Another Wallet
          </button>
        )}
      </div>

      {/* Continue button */}
      {hasConnected && (
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-6 py-3 bg-[#f5a623] text-black font-medium rounded-xl hover:bg-[#ffd700] transition-colors"
        >
          Open Messages
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}

      {/* Connected count */}
      {hasConnected && (
        <p className="text-xs text-gray-600 mt-3">
          {connectedWallets.length} wallet{connectedWallets.length > 1 ? 's' : ''} connected — you can add more anytime
        </p>
      )}
    </div>
  );
}
