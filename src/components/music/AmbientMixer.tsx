'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

interface AmbientLayer {
  id: string;
  label: string;
  icon: string;
  type: 'generated' | 'file';
  url?: string;
  generator?: 'white' | 'pink' | 'brown';
}

interface LayerState {
  active: boolean;
  volume: number;
}

interface AmbientMixerProps {
  getAudioCtx: () => AudioContext;
}

// ─── Sound definitions ───────────────────────────────────────────────

const AMBIENT_SOUNDS: AmbientLayer[] = [
  { id: 'whitenoise', label: 'White Noise', icon: '\u{1F4FB}', type: 'generated', generator: 'white' },
  { id: 'pinknoise', label: 'Pink Noise', icon: '\u{1F338}', type: 'generated', generator: 'pink' },
  { id: 'brownnoise', label: 'Brown Noise', icon: '\u{1F33F}', type: 'generated', generator: 'brown' },
  { id: 'rain', label: 'Rain', icon: '\u{1F327}\uFE0F', type: 'file', url: '/audio/rain.mp3' },
  { id: 'ocean', label: 'Ocean', icon: '\u{1F30A}', type: 'file', url: '/audio/ocean.mp3' },
  { id: 'forest', label: 'Forest', icon: '\u{1F332}', type: 'file', url: '/audio/forest.mp3' },
  { id: 'fire', label: 'Fireplace', icon: '\u{1F525}', type: 'file', url: '/audio/fire.mp3' },
  { id: 'wind', label: 'Wind', icon: '\u{1F4A8}', type: 'file', url: '/audio/wind.mp3' },
];

// ─── Noise generators ────────────────────────────────────────────────

const BUFFER_SIZE = 2; // seconds

function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * BUFFER_SIZE;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * BUFFER_SIZE;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * BUFFER_SIZE;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }
  return buffer;
}

// ─── Component ───────────────────────────────────────────────────────

export function AmbientMixer({ getAudioCtx }: AmbientMixerProps) {
  const [expanded, setExpanded] = useState(false);
  const [layers, setLayers] = useState<Record<string, LayerState>>(() => {
    const init: Record<string, LayerState> = {};
    for (const s of AMBIENT_SOUNDS) {
      init[s.id] = { active: false, volume: 50 };
    }
    return init;
  });

  // Refs for audio nodes per layer
  const nodesRef = useRef<Record<string, {
    source: AudioBufferSourceNode;
    gain: GainNode;
  }>>({});
  const masterGainRef = useRef<GainNode | null>(null);

  // Get or create master gain connected to the shared AudioContext
  const getMasterGain = useCallback(() => {
    const ctx = getAudioCtx();
    if (!masterGainRef.current) {
      const mg = ctx.createGain();
      mg.gain.value = 1;
      mg.connect(ctx.destination);
      masterGainRef.current = mg;
    }
    return masterGainRef.current;
  }, [getAudioCtx]);

  // Start a generated noise layer
  const startLayer = useCallback((sound: AmbientLayer, vol: number) => {
    if (sound.type !== 'generated' || !sound.generator) return;

    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const master = getMasterGain();
    if (!master) return;

    // Create buffer
    let buffer: AudioBuffer;
    switch (sound.generator) {
      case 'pink':
        buffer = createPinkNoiseBuffer(ctx);
        break;
      case 'brown':
        buffer = createBrownNoiseBuffer(ctx);
        break;
      default:
        buffer = createWhiteNoiseBuffer(ctx);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = vol / 100;

    source.connect(gain);
    gain.connect(master);
    source.start();

    nodesRef.current[sound.id] = { source, gain };
  }, [getAudioCtx, getMasterGain]);

  // Stop a layer
  const stopLayer = useCallback((id: string) => {
    const node = nodesRef.current[id];
    if (node) {
      try { node.source.stop(); } catch { /* already stopped */ }
      node.gain.disconnect();
      delete nodesRef.current[id];
    }
  }, []);

  // Toggle a layer on/off
  const toggleLayer = useCallback((sound: AmbientLayer) => {
    setLayers((prev) => {
      const current = prev[sound.id];
      const next = { ...current, active: !current.active };

      if (next.active) {
        if (sound.type === 'generated') {
          startLayer(sound, current.volume);
        }
      } else {
        stopLayer(sound.id);
      }

      return { ...prev, [sound.id]: next };
    });
  }, [startLayer, stopLayer]);

  // Update volume for a layer
  const setLayerVolume = useCallback((id: string, vol: number) => {
    setLayers((prev) => ({
      ...prev,
      [id]: { ...prev[id], volume: vol },
    }));

    const node = nodesRef.current[id];
    if (node) {
      node.gain.gain.value = vol / 100;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const id of Object.keys(nodesRef.current)) {
        try { nodesRef.current[id].source.stop(); } catch { /* ok */ }
      }
      nodesRef.current = {};
      if (masterGainRef.current) {
        masterGainRef.current.disconnect();
        masterGainRef.current = null;
      }
    };
  }, []);

  const activeCount = Object.values(layers).filter((l) => l.active).length;

  return (
    <div className="mt-4">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#0d1b2a] border border-gray-800 hover:border-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
          <span className="text-sm font-medium text-gray-300">Ambient Mixer</span>
          {activeCount > 0 && (
            <span className="text-[10px] bg-[#f5a623]/15 text-[#f5a623] px-1.5 py-0.5 rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-2 space-y-1.5">
          {AMBIENT_SOUNDS.map((sound) => {
            const state = layers[sound.id];
            const isFile = sound.type === 'file';
            const isActive = state.active;

            return (
              <div
                key={sound.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-[#f5a623]/5 border-[#f5a623]/20'
                    : isFile
                      ? 'bg-[#0d1b2a]/50 border-gray-800/50 opacity-60'
                      : 'bg-[#0d1b2a] border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Toggle */}
                <button
                  onClick={() => !isFile && toggleLayer(sound)}
                  disabled={isFile}
                  className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center text-base transition-colors ${
                    isActive
                      ? 'bg-[#f5a623]/20'
                      : isFile
                        ? 'bg-white/[0.02] cursor-not-allowed'
                        : 'bg-white/5 hover:bg-white/10 cursor-pointer'
                  }`}
                  aria-label={`Toggle ${sound.label}`}
                >
                  <span>{sound.icon}</span>
                </button>

                {/* Label + slider */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${isActive ? 'text-[#f5a623]' : isFile ? 'text-gray-600' : 'text-gray-300'}`}>
                      {sound.label}
                    </span>
                    {isFile && (
                      <span className="text-[9px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
                        Coming soon
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] text-gray-500 tabular-nums">
                        {state.volume}%
                      </span>
                    )}
                  </div>
                  {!isFile && (
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={state.volume}
                      onChange={(e) => setLayerVolume(sound.id, parseInt(e.target.value, 10))}
                      disabled={!isActive}
                      className={`w-full h-1 rounded-full cursor-pointer ${
                        isActive ? 'accent-[#f5a623]' : 'accent-gray-600'
                      }`}
                      aria-label={`${sound.label} volume`}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Info note */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-gray-800/30">
            <svg className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-[10px] text-gray-600">
              Noise layers are generated in real-time. Nature sounds will be available in a future update.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
