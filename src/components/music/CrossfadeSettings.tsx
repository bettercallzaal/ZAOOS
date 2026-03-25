'use client';

import { usePlayer } from '@/providers/audio';

const CROSSFADE_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '1s', value: 1 },
  { label: '2s', value: 2 },
  { label: '3s', value: 3 },
  { label: '5s', value: 5 },
  { label: '8s', value: 8 },
  { label: '12s', value: 12 },
];

export function CrossfadeSettings() {
  const player = usePlayer();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Crossfade</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Smooth transition between tracks
          </p>
        </div>
        <span className="text-xs text-gray-400 tabular-nums">
          {player.crossfade === 0 ? 'Off' : `${player.crossfade}s`}
        </span>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {CROSSFADE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => player.setCrossfade(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              player.crossfade === opt.value
                ? 'bg-[#f5a623]/20 text-[#f5a623] ring-1 ring-[#f5a623]/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <input
        type="range"
        min={0}
        max={12}
        step={1}
        value={player.crossfade}
        onChange={(e) => player.setCrossfade(parseInt(e.target.value))}
        className="w-full h-1.5 accent-[#f5a623] cursor-pointer"
        aria-label="Crossfade duration"
      />
    </div>
  );
}
