'use client';

interface PublishButtonProps {
  platformCount: number;
  crossPostEnabled: boolean;
  onToggleCrossPost: () => void;
  onSubmit: () => void;
  disabled: boolean;
  loading: boolean;
}

export function PublishButton({
  platformCount,
  crossPostEnabled,
  onToggleCrossPost,
  onSubmit,
  disabled,
  loading,
}: PublishButtonProps) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Toggle between Send / Publish modes */}
      <button
        type="button"
        onClick={onToggleCrossPost}
        className={`flex-shrink-0 p-2 rounded-md transition-colors ${
          crossPostEnabled
            ? 'text-[#f5a623] bg-[#f5a623]/10'
            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
        }`}
        title={crossPostEnabled ? 'Switch to single-platform send' : 'Enable cross-platform publishing'}
        aria-label={crossPostEnabled ? 'Disable cross-posting' : 'Enable cross-posting'}
        aria-pressed={crossPostEnabled}
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
      </button>

      {/* Main action button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading}
        className={`font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
          crossPostEnabled
            ? 'bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628]'
            : 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
            Sending
          </>
        ) : crossPostEnabled ? (
          <>
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
            {`Publish (${platformCount})`}
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
            Send
          </>
        )}
      </button>
    </div>
  );
}
