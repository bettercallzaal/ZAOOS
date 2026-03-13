'use client';

interface PlayerButtonsProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  size?: 'sm' | 'md';
}

export function PlayerButtons({
  isPlaying,
  isLoading,
  onPlayPause,
  onPrev,
  onNext,
  size = 'md',
}: PlayerButtonsProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const btnBase =
    'flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default';

  return (
    <div className="flex items-center gap-2">
      {onPrev && (
        <button onClick={onPrev} className={btnBase} aria-label="Previous">
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>
      )}

      <button
        onClick={onPlayPause}
        disabled={isLoading}
        className={`${btnBase} w-8 h-8 rounded-full bg-[#f5a623] text-[#0d1b2a] hover:bg-[#f5b84a] hover:text-[#0d1b2a] disabled:bg-gray-700 disabled:text-gray-500`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <svg className={`${iconSize} animate-spin`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
            <path
              d="M12 2a10 10 0 0110 10"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-75"
            />
          </svg>
        ) : isPlaying ? (
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {onNext && (
        <button onClick={onNext} className={btnBase} aria-label="Next">
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
