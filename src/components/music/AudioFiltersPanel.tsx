'use client';

import { useCallback, useState } from 'react';
import { AUDIO_FILTERS, FILTER_CATEGORIES, type AudioFilterPreset } from '@/lib/music/audioFilters';

let sharedActiveFilterKey: string | null = null;

export function getActiveFilterKey(): string | null {
  return sharedActiveFilterKey;
}

function getAudioElement(): HTMLAudioElement | null {
  const a = (globalThis as Record<string, unknown>).__zao_audio_a as HTMLAudioElement | undefined;
  const b = (globalThis as Record<string, unknown>).__zao_audio_b as HTMLAudioElement | undefined;
  if (a && !a.paused && a.src) return a;
  if (b && !b.paused && b.src) return b;
  if (a?.src) return a;
  if (b?.src) return b;
  return document.querySelector('audio');
}

interface AudioFiltersPanelProps {
  visible: boolean;
}

export function AudioFiltersPanel({ visible }: AudioFiltersPanelProps) {
  const [activeKey, setActiveKey] = useState<string | null>(sharedActiveFilterKey);
  const [activeCategory, setActiveCategory] = useState(0);

  const activateFilter = useCallback((key: string, preset: AudioFilterPreset) => {
    const audioEl = getAudioElement();
    if (!audioEl) return;

    if (sharedActiveFilterKey === key) {
      audioEl.playbackRate = 1.0;
      sharedActiveFilterKey = null;
      setActiveKey(null);
      return;
    }

    audioEl.playbackRate = preset.playbackRate ?? 1.0;
    sharedActiveFilterKey = key;
    setActiveKey(key);
  }, []);

  const clearFilter = useCallback(() => {
    const audioEl = getAudioElement();
    if (audioEl) audioEl.playbackRate = 1.0;
    sharedActiveFilterKey = null;
    setActiveKey(null);
  }, []);

  const currentCategory = FILTER_CATEGORIES[activeCategory];
  const categoryFilters = currentCategory.keys
    .filter((k) => AUDIO_FILTERS[k])
    .map((k) => ({ key: k, preset: AUDIO_FILTERS[k] }));

  const activePreset = activeKey ? AUDIO_FILTERS[activeKey] : null;

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        visible ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="px-4 pb-3 space-y-2">
        {/* Category tabs */}
        <div className="flex gap-1 justify-center">
          {FILTER_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                activeCategory === i
                  ? 'bg-[#f5a623]/15 text-[#f5a623]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <button
            onClick={clearFilter}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              !activeKey
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Off
          </button>

          {categoryFilters.map(({ key, preset }) => (
            <button
              key={key}
              onClick={() => activateFilter(key, preset)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                activeKey === key
                  ? 'bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/50'
                  : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
              }`}
            >
              {preset.icon} {preset.name}
            </button>
          ))}
        </div>

        {/* Active filter info */}
        {activePreset && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] text-[#f5a623] font-medium">
              {activePreset.icon} {activePreset.name}
            </span>
            <span className="text-[10px] text-gray-500">
              {activePreset.playbackRate !== 1.0
                ? `${activePreset.playbackRate}x`
                : ''
              }
            </span>
            <span className="text-[10px] text-gray-600">
              {activePreset.description}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
