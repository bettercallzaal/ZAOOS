'use client';

import { useCallback, useState, useRef } from 'react';
import { AUDIO_FILTERS, FILTER_CATEGORIES, type AudioFilterPreset } from '@/lib/music/audioFilters';
import { getActiveFilterKey as readSharedKey, setActiveFilterKey } from '@/lib/music/audioFilterState';

// Re-export for any legacy callers that imported the helper from here.
// New code should import directly from '@/lib/music/audioFilterState'.
export { getActiveFilterKey } from '@/lib/music/audioFilterState';

const SPEED_PRESETS = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2.0 },
] as const;

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
  const [activeKey, setActiveKey] = useState<string | null>(readSharedKey());
  const [activeCategory, setActiveCategory] = useState(0);
  const [customSpeed, setCustomSpeed] = useState(1.0);
  const sliderRef = useRef<HTMLInputElement>(null);

  const activateFilter = useCallback((key: string, preset: AudioFilterPreset) => {
    const audioEl = getAudioElement();
    if (!audioEl) return;

    if (readSharedKey() === key) {
      audioEl.playbackRate = 1.0;
      setActiveFilterKey(null);
      setActiveKey(null);
      setCustomSpeed(1.0);
      return;
    }

    const rate = preset.playbackRate ?? 1.0;
    audioEl.playbackRate = rate;
    setActiveFilterKey(key);
    setActiveKey(key);
    setCustomSpeed(rate);
  }, []);

  const clearFilter = useCallback(() => {
    const audioEl = getAudioElement();
    if (audioEl) audioEl.playbackRate = 1.0;
    setActiveFilterKey(null);
    setActiveKey(null);
    setCustomSpeed(1.0);
  }, []);

  const handleCustomSpeed = useCallback((speed: number) => {
    const audioEl = getAudioElement();
    if (audioEl) audioEl.playbackRate = speed;
    setCustomSpeed(speed);
    setActiveFilterKey('custom');
    setActiveKey('custom');
  }, []);

  const resetSpeed = useCallback(() => {
    const audioEl = getAudioElement();
    if (audioEl) audioEl.playbackRate = 1.0;
    setCustomSpeed(1.0);
    setActiveFilterKey(null);
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
        visible ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
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
        {activeKey === 'custom' ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] text-[#f5a623] font-medium">
              🎛️ Custom
            </span>
            <span className="text-[10px] text-gray-500">
              {customSpeed.toFixed(2)}x
            </span>
          </div>
        ) : activePreset ? (
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
        ) : null}

        {/* Custom Speed Slider */}
        <div className="space-y-1.5 pt-1 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-medium">Custom Speed</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#f5a623] font-mono font-semibold tabular-nums min-w-[3ch] text-right">
                {customSpeed.toFixed(2)}x
              </span>
              {customSpeed !== 1.0 && (
                <button
                  onClick={resetSpeed}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <input
            ref={sliderRef}
            type="range"
            min={0.25}
            max={4.0}
            step={0.05}
            value={customSpeed}
            onChange={(e) => handleCustomSpeed(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#f5a623] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#f5a623] [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(245,166,35,0.5)]"
          />

          <div className="flex gap-1 justify-center">
            {SPEED_PRESETS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => handleCustomSpeed(value)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                  Math.abs(customSpeed - value) < 0.01
                    ? 'bg-[#f5a623]/15 text-[#f5a623]'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
