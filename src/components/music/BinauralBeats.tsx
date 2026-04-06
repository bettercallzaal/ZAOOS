'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AmbientMixer } from '@/components/music/AmbientMixer';

// ─── Presets ──────────────────────────────────────────────────────────

interface BinauralPreset {
  name: string;
  description: string;
  beatFrequency: number;
  carrierFrequency: number;
  wave: 'delta' | 'theta' | 'alpha' | 'beta' | 'custom';
  icon: string;
  color: string;
}

// ─── Saved custom preset type ────────────────────────────────────────

interface SavedCustomPreset {
  carrier: number;
  beat: number;
  name: string;
}

const STORAGE_KEY = 'zao-binaural-custom-presets';

function loadSavedPresets(): SavedCustomPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePresetsToStorage(presets: SavedCustomPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch { /* storage full or unavailable */ }
}

const PRESETS: BinauralPreset[] = [
  {
    name: 'Deep Sleep',
    description: 'Delta waves — wind down and drift off',
    beatFrequency: 2.5,
    carrierFrequency: 100,
    wave: 'delta',
    icon: '🌙',
    color: 'from-indigo-600/20 to-purple-900/20',
  },
  {
    name: 'Meditation',
    description: 'Theta waves — quiet the mind',
    beatFrequency: 6,
    carrierFrequency: 120,
    wave: 'theta',
    icon: '🧘',
    color: 'from-violet-600/20 to-indigo-900/20',
  },
  {
    name: 'Calm Focus',
    description: 'Alpha waves — relaxed awareness',
    beatFrequency: 10,
    carrierFrequency: 136.1,
    wave: 'alpha',
    icon: '🎯',
    color: 'from-emerald-600/20 to-teal-900/20',
  },
  {
    name: 'Deep Focus',
    description: 'Beta waves — analytical concentration',
    beatFrequency: 15,
    carrierFrequency: 180,
    wave: 'beta',
    icon: '🧠',
    color: 'from-amber-600/20 to-orange-900/20',
  },
  {
    name: 'Schumann Resonance',
    description: "Earth's frequency — grounding & creativity",
    beatFrequency: 7.83,
    carrierFrequency: 125,
    wave: 'theta',
    icon: '🌍',
    color: 'from-cyan-600/20 to-blue-900/20',
  },
];

const TIMER_OPTIONS = [
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '1 hour', seconds: 3600 },
  { label: 'No limit', seconds: 0 },
];

// ─── Component ────────────────────────────────────────────────────────

export function BinauralBeats() {
  const [activePreset, setActivePreset] = useState<BinauralPreset | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [timerSeconds, setTimerSeconds] = useState(1800); // default 30min
  const [remaining, setRemaining] = useState(0);

  // Custom frequency state
  const [customExpanded, setCustomExpanded] = useState(false);
  const [customCarrier, setCustomCarrier] = useState(200);
  const [customBeat, setCustomBeat] = useState(10);
  const [savedPresets, setSavedPresets] = useState<SavedCustomPreset[]>([]);
  const [saveName, setSaveName] = useState('');

  // Load saved presets from localStorage on mount
  useEffect(() => {
    setSavedPresets(loadSavedPresets());
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ensure AudioContext exists (shared with AmbientMixer)
  const getOrCreateAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const stopAudio = useCallback(() => {
    try {
      leftOscRef.current?.stop();
      rightOscRef.current?.stop();
    } catch { /* already stopped */ }
    leftOscRef.current = null;
    rightOscRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
    setRemaining(0);
  }, []);

  const startAudio = useCallback((preset: BinauralPreset) => {
    // Stop any existing playback
    stopAudio();

    const ctx = getOrCreateAudioCtx();

    if (ctx.state === 'suspended') ctx.resume();

    // Create stereo merger for left/right channel separation
    const merger = ctx.createChannelMerger(2);
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gainRef.current = gain;

    // Left ear: carrier frequency
    const leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = preset.carrierFrequency;
    const leftGain = ctx.createGain();
    leftGain.gain.value = 1;
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0); // left channel

    // Right ear: carrier + beat frequency
    const rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.value = preset.carrierFrequency + preset.beatFrequency;
    const rightGain = ctx.createGain();
    rightGain.gain.value = 1;
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1); // right channel

    merger.connect(gain);
    gain.connect(ctx.destination);

    leftOsc.start();
    rightOsc.start();

    leftOscRef.current = leftOsc;
    rightOscRef.current = rightOsc;

    setActivePreset(preset);
    setPlaying(true);

    // Timer
    if (timerSeconds > 0) {
      setRemaining(timerSeconds);
      timerRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            stopAudio();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    navigator.vibrate?.(10);
  }, [volume, timerSeconds, stopAudio, getOrCreateAudioCtx]);

  // Update volume on the fly
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      audioCtxRef.current?.close();
    };
  }, [stopAudio]);

  const handlePresetClick = (preset: BinauralPreset) => {
    if (playing && activePreset?.name === preset.name) {
      stopAudio();
    } else {
      startAudio(preset);
    }
  };

  // Play custom frequencies
  const handlePlayCustom = useCallback(() => {
    const customPreset: BinauralPreset = {
      name: `Custom ${customCarrier}/${customBeat}`,
      description: `${customCarrier} Hz carrier + ${customBeat} Hz beat`,
      beatFrequency: customBeat,
      carrierFrequency: customCarrier,
      wave: 'custom',
      icon: '\u{2699}\uFE0F',
      color: 'from-[#f5a623]/20 to-amber-900/20',
    };

    if (playing && activePreset?.wave === 'custom') {
      stopAudio();
    } else {
      startAudio(customPreset);
    }
  }, [customCarrier, customBeat, playing, activePreset, startAudio, stopAudio]);

  // Save a custom preset to localStorage
  const handleSaveCustom = useCallback(() => {
    const name = saveName.trim() || `Custom ${customCarrier}/${customBeat}`;
    const newPreset: SavedCustomPreset = { carrier: customCarrier, beat: customBeat, name };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    savePresetsToStorage(updated);
    setSaveName('');
  }, [saveName, customCarrier, customBeat, savedPresets]);

  // Delete a saved custom preset
  const handleDeleteSaved = useCallback((index: number) => {
    const updated = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(updated);
    savePresetsToStorage(updated);
  }, [savedPresets]);

  // Play a saved custom preset
  const handlePlaySaved = useCallback((saved: SavedCustomPreset) => {
    setCustomCarrier(saved.carrier);
    setCustomBeat(saved.beat);
    const preset: BinauralPreset = {
      name: saved.name,
      description: `${saved.carrier} Hz carrier + ${saved.beat} Hz beat`,
      beatFrequency: saved.beat,
      carrierFrequency: saved.carrier,
      wave: 'custom',
      icon: '\u{2699}\uFE0F',
      color: 'from-[#f5a623]/20 to-amber-900/20',
    };
    startAudio(preset);
  }, [startAudio]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Binaural Beats</h2>
          <p className="text-xs text-gray-500 mt-0.5">Headphones required for full effect</p>
        </div>
        {playing && remaining > 0 && (
          <span className="text-xs text-[#f5a623] bg-[#f5a623]/10 px-2.5 py-1 rounded-full tabular-nums">
            {formatTime(remaining)}
          </span>
        )}
      </div>

      {/* Preset cards */}
      <div className="space-y-2">
        {PRESETS.map((preset) => {
          const isActive = playing && activePreset?.name === preset.name;

          return (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                isActive
                  ? 'bg-gradient-to-r border-[#f5a623]/30 shadow-lg shadow-[#f5a623]/5 ' + preset.color
                  : 'bg-[#0d1b2a] border-white/[0.08] hover:border-white/[0.08]'
              }`}
            >
              {/* Icon */}
              <div className={`w-11 h-11 flex-shrink-0 rounded-lg flex items-center justify-center text-lg ${
                isActive ? 'bg-[#f5a623]/20' : 'bg-white/5'
              }`}>
                {isActive ? (
                  <div className="flex items-end gap-px">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-[3px] bg-[#f5a623] rounded-full animate-bounce"
                        style={{
                          height: `${6 + i * 3}px`,
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: '0.6s',
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <span>{preset.icon}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isActive ? 'text-[#f5a623]' : 'text-white'}`}>
                  {preset.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{preset.description}</p>
              </div>

              {/* Frequency badge */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-[#f5a623]/15 text-[#f5a623]' : 'bg-white/5 text-gray-500'
                }`}>
                  {preset.beatFrequency} Hz
                </span>
                <span className="text-[9px] text-gray-600 capitalize">{preset.wave}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Frequency Section */}
      <div className="mt-3">
        <button
          onClick={() => setCustomExpanded((v) => !v)}
          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
            playing && activePreset?.wave === 'custom'
              ? 'bg-gradient-to-r from-[#f5a623]/20 to-amber-900/20 border-[#f5a623]/30 shadow-lg shadow-[#f5a623]/5'
              : 'bg-[#0d1b2a] border-white/[0.08] hover:border-white/[0.08]'
          }`}
        >
          <div className={`w-11 h-11 flex-shrink-0 rounded-lg flex items-center justify-center text-lg ${
            playing && activePreset?.wave === 'custom' ? 'bg-[#f5a623]/20' : 'bg-white/5'
          }`}>
            {playing && activePreset?.wave === 'custom' ? (
              <div className="flex items-end gap-px">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-[#f5a623] rounded-full animate-bounce"
                    style={{
                      height: `${6 + i * 3}px`,
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '0.6s',
                    }}
                  />
                ))}
              </div>
            ) : (
              <span>{'\u2699\uFE0F'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${
              playing && activePreset?.wave === 'custom' ? 'text-[#f5a623]' : 'text-white'
            }`}>
              Custom Frequency
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Set your own carrier and beat frequencies</p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${customExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {customExpanded && (
          <div className="mt-2 p-4 rounded-xl bg-[#0d1b2a] border border-white/[0.08] space-y-4">
            {/* Carrier Frequency Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-300">Carrier Frequency</label>
                <span className="text-xs font-mono text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full">
                  {customCarrier} Hz
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={500}
                step={1}
                value={customCarrier}
                onChange={(e) => setCustomCarrier(parseInt(e.target.value, 10))}
                className="w-full h-1.5 accent-[#f5a623] cursor-pointer"
                aria-label="Carrier frequency"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-gray-600">50 Hz</span>
                <span className="text-[9px] text-gray-600">500 Hz</span>
              </div>
            </div>

            {/* Beat Frequency Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-300">Beat Frequency</label>
                <span className="text-xs font-mono text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full">
                  {customBeat} Hz
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={40}
                step={0.5}
                value={customBeat}
                onChange={(e) => setCustomBeat(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#f5a623] cursor-pointer"
                aria-label="Beat frequency"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-gray-600">1 Hz (Delta)</span>
                <span className="text-[9px] text-gray-600">40 Hz (Gamma)</span>
              </div>
            </div>

            {/* Live preview */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
              <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <p className="text-[10px] text-gray-400 font-mono tabular-nums">
                Left: {customCarrier} Hz | Right: {customCarrier + customBeat} Hz
              </p>
            </div>

            {/* Play + Save buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePlayCustom}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  playing && activePreset?.wave === 'custom'
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    : 'bg-[#f5a623]/20 text-[#f5a623] hover:bg-[#f5a623]/30 border border-[#f5a623]/30'
                }`}
              >
                {playing && activePreset?.wave === 'custom' ? 'Stop' : 'Play Custom'}
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 border border-white/[0.08] transition-colors"
              >
                Save
              </button>
            </div>

            {/* Save name input (optional) */}
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Preset name (optional)"
              className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            />

            {/* Saved presets list */}
            {savedPresets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Saved Presets</p>
                {savedPresets.map((sp, idx) => (
                  <div
                    key={`${sp.name}-${idx}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08] group"
                  >
                    <button
                      onClick={() => handlePlaySaved(sp)}
                      className="flex-1 text-left"
                    >
                      <p className="text-xs font-medium text-gray-300">{sp.name}</p>
                      <p className="text-[10px] text-gray-600 font-mono">
                        {sp.carrier} Hz + {sp.beat} Hz beat
                      </p>
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-red-400 transition-all"
                      aria-label={`Delete ${sp.name}`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ambient Mixer */}
      <AmbientMixer getAudioCtx={getOrCreateAudioCtx} />

      {/* Controls */}
      <div className="mt-4 space-y-3">
        {/* Volume */}
        <div className="flex items-center gap-3 px-1">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[#f5a623] cursor-pointer"
            aria-label="Binaural beats volume"
          />
          <span className="text-[10px] text-gray-500 tabular-nums w-6 text-right">
            {Math.round(volume * 100)}
          </span>
        </div>

        {/* Timer pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setTimerSeconds(opt.seconds)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                timerSeconds === opt.seconds
                  ? 'bg-[#f5a623]/20 text-[#f5a623] ring-1 ring-[#f5a623]/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Headphone notice */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          <p className="text-[10px] text-gray-500">
            Binaural beats require stereo headphones. Each ear receives a slightly different frequency — the brain perceives the difference as a rhythmic pulse.
          </p>
        </div>
      </div>
    </div>
  );
}
