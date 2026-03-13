'use client';

interface ConnectXMTPProps {
  isConnecting: boolean;
  error: string | null;
  onConnect: () => void;
}

export function ConnectXMTP({ isConnecting, error, onConnect }: ConnectXMTPProps) {
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
        You&apos;ll need to sign a message with your wallet to enable messaging. No gas fees.
      </p>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-900/30 text-red-400 text-xs rounded-lg max-w-sm">
          {error}
        </div>
      )}

      <button
        onClick={onConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 px-6 py-3 bg-[#f5a623] text-black font-medium rounded-xl hover:bg-[#ffd700] transition-colors disabled:opacity-50"
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Connecting...
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
    </div>
  );
}
