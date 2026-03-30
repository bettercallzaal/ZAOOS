'use client';

import Link from 'next/link';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const msg = error.message || '';
  const page = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm mb-4">
          This page crashed. Try refreshing or go back home.
        </p>

        <details className="mb-5 text-left">
          <summary className="text-[10px] text-gray-600 cursor-pointer hover:text-gray-400">Show error details (for Zaal)</summary>
          <pre className="mt-2 text-[10px] text-gray-600 bg-gray-900/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
            Page: {page}
            Error: {msg || 'No message'}
            {error.digest && `Digest: ${error.digest}`}
          </pre>
        </details>

        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="w-full py-2.5 bg-[#f5a623] text-black text-sm font-medium rounded-xl hover:bg-[#ffd700] transition-colors"
          >
            Try again
          </button>
          <Link href="/home" className="text-sm text-gray-400 hover:text-white transition-colors py-1">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
