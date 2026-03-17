'use client';

import { useState } from 'react';

type ImportResult = {
  imported: number;
  errors: string[];
};

export function ImportRespectButton() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/respect-import', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Import failed');
        return;
      }

      setResult(data);

      // Auto-dismiss success after 5 seconds
      setTimeout(() => setResult(null), 5000);
    } catch {
      setError('Network error — could not reach server');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleImport}
        disabled={importing}
        className="text-sm text-gray-400 hover:text-[#f5a623] bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
      >
        {importing ? (
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
            Importing…
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
            Import from Airtable
          </>
        )}
      </button>

      {/* Success toast */}
      {result && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-green-900/90 border border-green-700 text-green-200 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          Imported {result.imported} members
          {result.errors.length > 0 && (
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
