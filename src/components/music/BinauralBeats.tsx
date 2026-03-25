'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Presets ──────────────────────────────────────────────────────────

interface BinauralPreset {
  name: string;
  description: string;
  beatFrequency: number;
  carrierFrequency: number;
  wave: 'delta' | 'theta' | 'alpha' | 'beta';
  icon: string;
  color: string;
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

  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const ctx = audioCtxRef.current || new AudioContext();
    audioCtxRef.current = ctx;

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
  }, [volume, timerSeconds, stopAudio]);

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
                  : 'bg-[#0d1b2a] border-gray-800 hover:border-gray-700'
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-gray-800/50">
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
