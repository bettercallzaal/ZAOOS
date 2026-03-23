'use client';

import { useState } from 'react';
import { useLensAuth } from '@/hooks/useLensAuth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LensConnectProps {
  initialHandle: string | null;
  onStatusChange: (handle: string | null) => void;
}

// ---------------------------------------------------------------------------
// Lens Icon (inline SVG)
// ---------------------------------------------------------------------------

function LensIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a3.5 3.5 0 013.5 3.5c0 1.655-1.156 3.042-2.702 3.393a.75.75 0 00-.548.548C11.9 14.087 10.513 15.243 8.858 15.243A3.5 3.5 0 015.358 11.743c0-1.655 1.156-3.042 2.702-3.393a.75.75 0 00.548-.548C8.958 6.156 10.345 5 12 5zm4.5 6.5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LensConnect({ initialHandle, onStatusChange }: LensConnectProps) {
  const { isConnecting, error, connectedHandle, connect, walletAddress } = useLensAuth();
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const displayHandle = connectedHandle || initialHandle;

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setDisconnectError(null);
    try {
      const res = await fetch('/api/platforms/lens', { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to disconnect');
      }
      onStatusChange(null);
    } catch (err) {
      setDisconnectError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  // Notify parent when connection succeeds
  if (connectedHandle && connectedHandle !== initialHandle) {
    onStatusChange(connectedHandle);
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d1b2a] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center">
            <LensIcon className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Lens Protocol</h3>
            {displayHandle ? (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Connected as {displayHandle}
              </p>
            ) : (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                Not connected
              </p>
            )}
          </div>
        </div>

        {displayHandle ? (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-400/20 hover:border-red-400/40 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting || !walletAddress}
            className="text-xs text-green-400 hover:text-green-300 px-3 py-1.5 rounded-lg border border-green-400/20 hover:border-green-400/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Signing...' : 'Connect with Wallet'}
          </button>
        )}
      </div>

      {/* Help text, errors, success */}
      {(!walletAddress && !displayHandle) && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500">Connect your wallet above to link Lens</p>
        </div>
      )}

      {(error || disconnectError) && (
        <div className="px-4 pb-3">
          <p className="text-xs text-red-400">{error || disconnectError}</p>
        </div>
      )}

      {connectedHandle && (
        <div className="px-4 pb-3">
          <p className="text-xs text-green-400">
            Connected! Signless mode enabled — posts won&apos;t require wallet popups.
          </p>
        </div>
      )}
    </div>
  );
}
