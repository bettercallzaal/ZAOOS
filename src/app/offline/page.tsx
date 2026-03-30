'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0a1628] px-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-[#f5a623]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
          />
          <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </div>

      <h1 className="text-xl font-bold text-white mb-2">You are offline</h1>
      <p className="text-sm text-gray-400 max-w-xs mb-8">
        ZAO OS needs an internet connection to load new content. Check your
        connection and try again.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#f5a623]/90 active:scale-[0.98] transition-all"
      >
        Try again
      </button>
    </div>
  );
}
