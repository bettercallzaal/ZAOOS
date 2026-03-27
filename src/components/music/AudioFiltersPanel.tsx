'use client';

import { useCallback, useState } from 'react';
import {
  AUDIO_FILTERS,
  applyFilter,
  removeFilter,
  type AudioFilterPreset,
} from '@/lib/music/audioFilters';

// ── Module-level singletons (survive re-mounts, persist across expanded player open/close) ──
let sharedAudioContext: AudioContext | null = null;
let sharedSourceNode: MediaElementAudioSourceNode | null = null;
let sharedActiveNodes: AudioNode[] = [];
let sharedActiveFilterKey: string | null = null;
let sharedConnectedElement: HTMLAudioElement | null = null;

/**
 * Returns the current active filter key (module-level). Used by ExpandedPlayer
 * to highlight the filter toggle when a filter is active.
 */
export function getActiveFilterKey(): string | null {
  return sharedActiveFilterKey;
}

interface AudioFiltersPanelProps {
  visible: boolean;
}

export function AudioFiltersPanel({ visible }: AudioFiltersPanelProps) {
  const [activeKey, setActiveKey] = useState<string | null>(sharedActiveFilterKey);

  /**
   * Lazily create AudioContext + MediaElementSourceNode on first filter activation.
   * Must be called inside a user gesture handler (click/tap) to comply with autoplay policy.
   * A MediaElementSourceNode can only be created once per audio element, so we store it.
   */
  const ensureAudioContext = useCallback((): {
    ctx: AudioContext;
    source: MediaElementAudioSourceNode;
  } | null => {
    if (sharedAudioContext && sharedSourceNode) {
      // Resume if suspended (browser may suspend after inactivity)
      if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume();
      }
      return { ctx: sharedAudioContext, source: sharedSourceNode };
    }

    // Get the audio element exposed by HTMLAudioProvider via globalThis
    const audioEl = (globalThis as Record<string, unknown>).__zao_audio_a as HTMLAudioElement | undefined;
    if (!audioEl) {
      console.warn('[AudioFilters] No audio element found — is music playing?');
      return null;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audioEl);
    // Connect source directly to destination (passthrough until a filter is applied)
    source.connect(ctx.destination);

    sharedAudioContext = ctx;
    sharedSourceNode = source;
    sharedConnectedElement = audioEl;

    return { ctx, source };
  }, []);

  const activateFilter = useCallback((key: string, preset: AudioFilterPreset) => {
    const result = ensureAudioContext();
    if (!result) return;

    const { ctx, source } = result;

    // Remove existing filter chain if any
    if (sharedActiveNodes.length > 0) {
      removeFilter(source, ctx.destination, sharedActiveNodes, sharedConnectedElement ?? undefined);
      sharedActiveNodes = [];
    }

    // If tapping the already-active filter, toggle it off
    if (sharedActiveFilterKey === key) {
      sharedActiveFilterKey = null;
      setActiveKey(null);
      if (sharedConnectedElement) {
        sharedConnectedElement.playbackRate = 1.0;
      }
      return;
    }

    // Apply new filter
    const nodes = applyFilter(ctx, source, ctx.destination, preset);
    sharedActiveNodes = nodes;
    sharedActiveFilterKey = key;
    setActiveKey(key);

    // Apply playbackRate for nightcore/vaporwave presets
    if (sharedConnectedElement) {
      sharedConnectedElement.playbackRate = preset.playbackRate ?? 1.0;
    }
  }, [ensureAudioContext]);

  const clearFilter = useCallback(() => {
    if (sharedAudioContext && sharedSourceNode && sharedActiveNodes.length > 0) {
      removeFilter(
        sharedSourceNode,
        sharedAudioContext.destination,
        sharedActiveNodes,
        sharedConnectedElement ?? undefined,
      );
      sharedActiveNodes = [];
    }

    sharedActiveFilterKey = null;
    setActiveKey(null);

    if (sharedConnectedElement) {
      sharedConnectedElement.playbackRate = 1.0;
    }
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
        {/* Filter pills — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {/* Off button */}
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

        {/* Active filter description */}
        {activePreset && (
          <p className="text-[10px] text-gray-500 text-center leading-tight">
            {activePreset.description}
          </p>
        )}
      </div>
    </div>
  );
}
