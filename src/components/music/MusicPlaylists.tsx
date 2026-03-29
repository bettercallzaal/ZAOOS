'use client';

import { useRadioContext as useRadio } from '@/providers/audio/RadioProvider';
import { communityConfig } from '@/../community.config';
import { MusicIcon, PlayingBars } from './MusicPageUtils';

export function PlaylistsSection({ radio }: { radio: ReturnType<typeof useRadio> }) {
  const playlists = communityConfig.music.radioPlaylists;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Playlists</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {playlists.map((pl, i) => {
          const isActive =
            radio.isRadioMode && radio.currentStationIndex === i;

          return (
            <button
              key={pl.name}
              onClick={() => {
                if (isActive) return;
                if (radio.isRadioMode) {
                  radio.switchStation(i);
                } else {
                  radio.startRadio(i);
                }
              }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                isActive
                  ? 'bg-[#f5a623]/10 border-[#f5a623]/30'
                  : 'bg-[#0d1b2a] border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Playlist artwork */}
              <div className={`w-14 h-14 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden ${
                isActive
                  ? 'bg-[#f5a623]/20 ring-1 ring-[#f5a623]/30'
                  : 'bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]'
              }`}>
                {isActive ? (
                  <PlayingBars />
                ) : (
                  <MusicIcon className="w-6 h-6 text-[#f5a623]/40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  isActive ? 'text-[#f5a623]' : 'text-white'
                }`}>
                  {pl.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{pl.artist}</p>
              </div>

              {/* Play indicator */}
              <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${
                isActive
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'bg-white/5 text-gray-400 group-hover:text-white'
              }`}>
                {isActive ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
