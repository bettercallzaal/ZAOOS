'use client';

import { useNowPlaying, NowPlayingEntry } from '@/hooks/useNowPlaying';
import { usePlayer } from '@/providers/audio';
import { useAuth } from '@/hooks/useAuth';
import { useOverlaySync } from '@/hooks/useOverlaySync';
import type { TrackType } from '@/types/music';

/**
 * Horizontal scrolling bar showing members currently listening.
 * Renders at the top of MusicSidebar or chat sidebar.
 * Returns null if nobody is listening.
 */
export function NowPlayingBar() {
  const { user } = useAuth();
  useOverlaySync(user?.fid);
  const { presenceState } = useNowPlaying(
    user ? { fid: user.fid, username: user.username } : null,
  );
  const player = usePlayer();

  if (presenceState.length === 0) return null;

  const handlePlay = (entry: NowPlayingEntry) => {
    // Build a minimal TrackMetadata to play this track
    player.play({
      id: `np-${entry.fid}-${entry.url}`,
      type: entry.type as TrackType,
      trackName: entry.trackName,
      artistName: entry.artistName,
      artworkUrl: entry.artworkUrl,
      url: entry.url,
      feedId: `np-${entry.fid}`,
    });
  };

  return (
    <div className="border-b border-white/[0.08] bg-[#0d1b2a]/80 backdrop-blur-sm">
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] text-gray-500 flex-shrink-0 mr-1">
          Listening now
        </span>
        {presenceState.map((entry) => (
          <button
            key={entry.fid}
            onClick={() => handlePlay(entry)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0 max-w-[180px]"
            title={`${entry.username} - ${entry.trackName}`}
          >
            {/* Avatar placeholder — 24x24 circle with initial */}
            <div className="w-6 h-6 rounded-full bg-[#f5a623]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-[#f5a623]">
                {entry.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-400 truncate leading-tight">
                {entry.username}
              </p>
              <p className="text-[10px] text-white truncate leading-tight">
                {entry.trackName}
              </p>
            </div>
            {/* Playing indicator */}
            <div className="flex items-end gap-px flex-shrink-0">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-0.5 bg-[#f5a623] rounded-full animate-bounce"
                  style={{
                    height: `${4 + i * 2}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.6s',
                  }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
