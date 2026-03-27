'use client';

import { useCallback, useState } from 'react';
import { AUDIO_FILTERS, type AudioFilterPreset } from '@/lib/music/audioFilters';

// ── Module-level singletons (persist across re-mounts) ──
let sharedAudioContext: AudioContext | null = null;
let sharedSourceNode: MediaElementAudioSourceNode | null = null;
let sharedActiveNodes: AudioNode[] = [];
let sharedActiveFilterKey: string | null = null;
let sharedConnectedElement: HTMLAudioElement | null = null;

export function getActiveFilterKey(): string | null {
  return sharedActiveFilterKey;
}

interface AudioFiltersPanelProps {
  visible: boolean;
}

export function AudioFiltersPanel({ visible }: AudioFiltersPanelProps) {
  const [activeKey, setActiveKey] = useState<string | null>(sharedActiveFilterKey);

  const ensureAudioContext = useCallback((): {
    ctx: AudioContext;
    source: MediaElementAudioSourceNode;
  } | null => {
    try {
      if (sharedAudioContext && sharedSourceNode) {
        if (sharedAudioContext.state === 'suspended') {
          sharedAudioContext.resume();
        }
        return { ctx: sharedAudioContext, source: sharedSourceNode };
      }

      // Find the active audio element — try globalThis first, then DOM query
      let audioEl = (globalThis as Record<string, unknown>).__zao_audio_a as HTMLAudioElement | undefined;
      if (!audioEl) {
        audioEl = document.querySelector('audio') as HTMLAudioElement | undefined;
      }
      if (!audioEl) {
        console.warn('[AudioFilters] No audio element found — play a track first');
        return null;
      }

      // Set crossOrigin to allow Web Audio API processing
      audioEl.crossOrigin = 'anonymous';

      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audioEl);
      source.connect(ctx.destination);

      sharedAudioContext = ctx;
      sharedSourceNode = source;
      sharedConnectedElement = audioEl;

      return { ctx, source };
    } catch (err) {
      console.error('[AudioFilters] Failed to create audio context:', err);
      return null;
    }
  }, []);

  const activateFilter = useCallback((key: string, preset: AudioFilterPreset) => {
    const result = ensureAudioContext();
    if (!result) return;

    const { ctx, source } = result;

    // If tapping the already-active filter, toggle it off
    if (sharedActiveFilterKey === key) {
      clearFilterInternal(source, ctx.destination);
      setActiveKey(null);
      return;
    }

    // Remove existing filter chain
    if (sharedActiveNodes.length > 0) {
      clearFilterInternal(source, ctx.destination);
    }

    try {
      // Disconnect source from destination to insert filter chain
      source.disconnect();

      // Build chain: source -> node[0] -> node[1] -> ... -> destination
      const nodes: AudioNode[] = [];
      let previous: AudioNode = source;

      for (const config of preset.nodes) {
        const node = createAudioNode(ctx, config);
        previous.connect(node);
        nodes.push(node);
        previous = node;
      }
      previous.connect(ctx.destination);

      sharedActiveNodes = nodes;
      sharedActiveFilterKey = key;
      setActiveKey(key);

      // Apply playbackRate for nightcore/vaporwave
      if (sharedConnectedElement) {
        sharedConnectedElement.playbackRate = preset.playbackRate ?? 1.0;
      }
    } catch (err) {
      console.error('[AudioFilters] Failed to apply filter:', err);
      // Reconnect source directly on failure
      try { source.connect(ctx.destination); } catch { /* already connected */ }
    }
  }, [ensureAudioContext]);

  const clearFilter = useCallback(() => {
    if (sharedAudioContext && sharedSourceNode) {
      clearFilterInternal(sharedSourceNode, sharedAudioContext.destination);
    }
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

// ── Internal helpers ──

function clearFilterInternal(source: AudioNode, destination: AudioNode) {
  try {
    source.disconnect();
    for (const node of sharedActiveNodes) {
      node.disconnect();
    }
    source.connect(destination);
  } catch { /* ignore disconnect errors */ }

  sharedActiveNodes = [];
  sharedActiveFilterKey = null;

  if (sharedConnectedElement) {
    sharedConnectedElement.playbackRate = 1.0;
  }
}

function createAudioNode(ctx: AudioContext, config: import('@/lib/music/audioFilters').AudioNodeConfig): AudioNode {
  switch (config.type) {
    case 'biquad': {
      const bq = ctx.createBiquadFilter();
      bq.type = config.filter;
      if (config.frequency !== undefined) bq.frequency.value = config.frequency;
      if (config.gain !== undefined) bq.gain.value = config.gain;
      if (config.Q !== undefined) bq.Q.value = config.Q;
      return bq;
    }
    case 'gain': {
      const g = ctx.createGain();
      g.gain.value = config.gain;
      return g;
    }
    case 'stereoPanner': {
      const p = ctx.createStereoPanner();
      p.pan.value = config.pan;
      return p;
    }
    case 'delay': {
      const d = ctx.createDelay();
      d.delayTime.value = config.delayTime;
      return d;
    }
  }
}
