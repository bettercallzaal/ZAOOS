'use client';

/**
 * Replaces ZAOOS `src/components/messages/ConnectXMTP.tsx`, which offered a
 * wallet picker (RainbowKit + wagmi). Day one has no wallet option: the
 * burner key for the signed-in FID connects on its own (MessagesRoom retries),
 * so this panel only shows progress and errors. Same props, so MessagesRoom is unchanged.
 */
interface ConnectXMTPProps {
  isConnecting: boolean;
  error: string | null;
  onConnect: () => void;
}

export function ConnectXMTP({ isConnecting, error }: ConnectXMTPProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-lg font-semibold text-[#f5a623]">Private messages</h2>
      {error ? (
        <>
          <p role="alert" className="max-w-sm text-sm text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a1628]"
          >
            Try again
          </button>
        </>
      ) : (
        <p className="max-w-sm text-sm text-slate-300">
          {isConnecting
            ? 'Setting up your messaging key in this browser...'
            : 'Connecting to XMTP...'}
        </p>
      )}
      <p className="max-w-sm text-xs text-slate-500">
        Your messaging key is made in this browser and never leaves it. It holds no funds.
      </p>
    </div>
  );
}
