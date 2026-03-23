'use client';

import { communityConfig } from '@/../community.config';

interface RadioButtonProps {
  isRadioMode: boolean;
  radioLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  /** 'compact' = icon-only for header, 'full' = wide card for sidebar */
  variant?: 'compact' | 'full';
  playlistName?: string;
}

export function RadioButton({
  isRadioMode,
  radioLoading,
  onStart,
  onStop,
  variant = 'compact',
  playlistName,
}: RadioButtonProps) {
  if (variant === 'compact') {
    return (
      <button
        onClick={() => isRadioMode ? onStop() : onStart()}
        disabled={radioLoading}
        className={`relative flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
          isRadioMode
            ? 'bg-[#f5a623]/20 text-[#f5a623]'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        } disabled:opacity-50`}
        aria-label={isRadioMode ? 'Stop radio' : `Play ${communityConfig.music.radioName}`}
        title={isRadioMode ? 'Stop radio' : communityConfig.music.radioName}
      >
        {radioLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75zm-1.683 6.443l-.311.07a1.027 1.027 0 00-.757 1.236c.124.543.679.887 1.236.757l.311-.07a1.027 1.027 0 00.757-1.236 1.04 1.04 0 00-1.236-.757zm6.456 0l-.312.07a1.027 1.027 0 00-.756 1.236c.124.543.678.887 1.236.757l.311-.07a1.027 1.027 0 00.757-1.236 1.04 1.04 0 00-1.236-.757z" />
          </svg>
        )}
        {isRadioMode && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#f5a623] animate-pulse" />
        )}
      </button>
    );
  }

  // Full variant — card for sidebar
  return (
    <button
      onClick={isRadioMode ? onStop : onStart}
      disabled={radioLoading}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
        isRadioMode
          ? 'bg-[#f5a623]/10 border-b border-[#f5a623]/20'
          : 'bg-gradient-to-r from-[#f5a623]/5 to-transparent border-b border-gray-800 hover:from-[#f5a623]/10'
      } disabled:opacity-50`}
    >
      {/* Radio icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isRadioMode
          ? 'bg-[#f5a623] shadow-md shadow-[#f5a623]/20'
          : 'bg-[#f5a623]/15'
      }`}>
        {radioLoading ? (
          <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
            isRadioMode ? 'border-black border-t-transparent' : 'border-[#f5a623] border-t-transparent'
          }`} />
        ) : (
          <svg className={`w-5 h-5 ${isRadioMode ? 'text-black' : 'text-[#f5a623]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75zm-1.683 6.443l-.311.07a1.027 1.027 0 00-.757 1.236c.124.543.679.887 1.236.757l.311-.07a1.027 1.027 0 00.757-1.236 1.04 1.04 0 00-1.236-.757zm6.456 0l-.312.07a1.027 1.027 0 00-.756 1.236c.124.543.678.887 1.236.757l.311-.07a1.027 1.027 0 00.757-1.236 1.04 1.04 0 00-1.236-.757z" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-semibold ${isRadioMode ? 'text-[#f5a623]' : 'text-white'}`}>
          {communityConfig.music.radioName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {isRadioMode
            ? 'Shuffle playing — tap to stop'
            : playlistName || 'Shuffle community playlist'}
        </p>
      </div>

      {/* Animated bars when playing */}
      {isRadioMode && (
        <div className="flex items-end gap-px h-4 flex-shrink-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[3px] bg-[#f5a623] rounded-full animate-bounce"
              style={{
                height: `${4 + i * 3}px`,
                animationDelay: `${i * 0.12}s`,
                animationDuration: '0.5s',
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
