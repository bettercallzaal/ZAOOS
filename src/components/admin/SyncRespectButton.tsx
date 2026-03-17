'use client';

import { useState } from 'react';

type SyncResult = {
  synced: number;
  total: number;
  errors?: string[];
};

export function SyncRespectButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/respect/sync', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Sync failed');
        return;
      }

      setResult(data);

      // Auto-dismiss success after 5 seconds
      setTimeout(() => setResult(null), 5000);
    } catch {
      setError('Network error — could not reach server');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="text-sm text-gray-400 hover:text-[#f5a623] bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
      >
        {syncing ? (
          <>
            <svg
              className="animate-spin h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Syncing…
          </>
        ) : (
          'Sync Respect'
        )}
      </button>

      {/* Success toast */}
      {result && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-green-900/90 border border-green-700 text-green-200 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          Synced {result.synced}/{result.total} members
          {result.errors && result.errors.length > 0 && (
            <span className="text-yellow-300 ml-1">
              ({result.errors.length} error{result.errors.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-red-900/90 border border-red-700 text-red-200 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg flex items-center gap-2">
          {error}
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
