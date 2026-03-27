'use client';

import { useCallback, useState } from 'react';
import { AUDIO_FILTERS, type AudioFilterPreset } from '@/lib/music/audioFilters';

// ── Module-level state (persists across re-mounts) ──
let sharedActiveFilterKey: string | null = null;

export function getActiveFilterKey(): string | null {
  return sharedActiveFilterKey;
}

/** Find the currently active audio element from the player */
function getAudioElement(): HTMLAudioElement | null {
  // Try globalThis first (set by HTMLAudioProvider)
  const a = (globalThis as Record<string, unknown>).__zao_audio_a as HTMLAudioElement | undefined;
  const b = (globalThis as Record<string, unknown>).__zao_audio_b as HTMLAudioElement | undefined;
  // Return whichever one has a src and isn't paused, or the first with a src
  if (a && !a.paused && a.src) return a;
  if (b && !b.paused && b.src) return b;
  if (a?.src) return a;
  if (b?.src) return b;
  // Fallback to DOM query
  return document.querySelector('audio');
}

interface AudioFiltersPanelProps {
  visible: boolean;
}

export function AudioFiltersPanel({ visible }: AudioFiltersPanelProps) {
  const [activeKey, setActiveKey] = useState<string | null>(sharedActiveFilterKey);

  const activateFilter = useCallback((key: string, preset: AudioFilterPreset) => {
    const audioEl = getAudioElement();
    if (!audioEl) {
      console.warn('[AudioFilters] No audio element — play a track first');
      return;
    }

    // Toggle off if tapping active filter
    if (sharedActiveFilterKey === key) {
      audioEl.playbackRate = 1.0;
      sharedActiveFilterKey = null;
      setActiveKey(null);
      return;
    }

    // Apply the preset's playback rate (nightcore = 1.25x, vaporwave = 0.8x, others = 1.0)
    audioEl.playbackRate = preset.playbackRate ?? 1.0;

    sharedActiveFilterKey = key;
    setActiveKey(key);
  }, []);

  const clearFilter = useCallback(() => {
    const audioEl = getAudioElement();
    if (audioEl) {
      audioEl.playbackRate = 1.0;
    }
    sharedActiveFilterKey = null;
    setActiveKey(null);
  }, []);

  const filterEntries = Object.entries(AUDIO_FILTERS);
  const activePreset = activeKey ? AUDIO_FILTERS[activeKey] : null;

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        visible ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="px-8 pb-3 space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <button
            onClick={clearFilter}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !activeKey
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
            }`}
          >
            Off
          </button>

          {filterEntries.map(([key, preset]) => (
            <button
              key={key}
              onClick={() => activateFilter(key, preset)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                activeKey === key
                  ? 'bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/50 shadow-sm shadow-[#f5a623]/10'
                  : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              {preset.icon} {preset.name}
            </button>
          ))}
        </div>

        {activePreset && (
          <p className="text-[10px] text-gray-500 text-center leading-tight">
            {activePreset.description}
          </p>
        )}
      </div>
    </div>
  );
}
