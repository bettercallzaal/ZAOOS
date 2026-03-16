'use client';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-2">Chat Error</h2>
        <p className="text-gray-400 text-sm mb-6">
          {error.message || 'Failed to load chat. Please try again.'}
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={reset}
            className="bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Reload Chat
          </button>
          <a
            href="/chat"
            className="text-gray-400 text-sm hover:text-white transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
