'use client';

import { useState } from 'react';

type SyncResult = {
  success: boolean;
  stats: {
    wallets: number;
    members: number;
    sessions: number;
    scores: number;
    hosts: number;
    festivals: number;
    misc: number;
    enriched: number;
    firstRespectSet: number;
  };
  errors: string[];
};

export function ImportRespectButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/respect-import', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Sync failed');
        return;
      }

      setResult(data);
    } catch {
      setError('Network error — could not reach server');
    } finally {
      setSyncing(false);
    }
  };

  const totalImported = result
    ? result.stats.members + result.stats.sessions + result.stats.scores +
      result.stats.hosts + result.stats.festivals + result.stats.misc
    : 0;

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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Syncing Airtable…
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Sync from Airtable
          </>
        )}
      </button>

      {/* Success toast */}
      {result && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-green-900/90 border border-green-700 text-green-200 text-xs rounded-lg px-3 py-2.5 shadow-lg min-w-[220px]">
          <p className="font-medium text-green-100 mb-1.5">Sync complete — {totalImported} records</p>
          <div className="space-y-0.5 text-[10px] text-green-300/80">
            <p>{result.stats.members} members · {result.stats.wallets} wallets</p>
            <p>{result.stats.sessions} sessions · {result.stats.scores} scores</p>
            <p>{result.stats.hosts} hosts · {result.stats.festivals} festivals · {result.stats.misc} misc</p>
            <p>{result.stats.enriched} enriched · {result.stats.firstRespectSet} first-respect dates set</p>
          </div>
          {result.errors.length > 0 && (
            <p className="text-yellow-300 mt-1.5 text-[10px]">
              {result.errors.length} warning{result.errors.length !== 1 ? 's' : ''}: {result.errors[0]}
            </p>
          )}
          <button onClick={() => setResult(null)} className="absolute top-1.5 right-2 text-green-400 hover:text-green-200 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-red-900/90 border border-red-700 text-red-200 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg flex items-center gap-2">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}
    </div>
  );
}
