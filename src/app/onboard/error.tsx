'use client';

import Link from 'next/link';

export default function OnboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={reset}
            className="bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-gray-400 text-sm hover:text-white transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
