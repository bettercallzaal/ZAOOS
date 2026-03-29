'use client'

import { useEffect, useState, useCallback } from 'react'
import { getEqualizer, FREQUENCIES, EQ_PRESETS } from '@/lib/music/equalizer'

const BAND_LABELS = ['60', '230', '910', '3.6k', '14k']

export default function EqualizerPanel() {
  const [gains, setGains] = useState<number[]>([0, 0, 0, 0, 0])
  const [activePreset, setActivePreset] = useState<string | null>('Flat')

  useEffect(() => {
    const eq = getEqualizer()
    setGains(eq.getGains())
  }, [])

  const handleGainChange = useCallback((index: number, value: number) => {
    const eq = getEqualizer()
    eq.setGain(index, value)
    setGains(eq.getGains())
    setActivePreset(null)
  }, [])

  const handlePreset = useCallback((name: string) => {
    const eq = getEqualizer()
    eq.applyPreset(name)
    setGains(eq.getGains())
    setActivePreset(name)
  }, [])

  return (
    <div className="px-4 py-3">
      {/* Preset chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {Object.keys(EQ_PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => handlePreset(name)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activePreset === name
                ? 'bg-[#f5a623] text-[#0a1628]'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Band sliders */}
      <div className="flex justify-between items-end gap-2 mt-2" style={{ height: 160 }}>
        {gains.map((gain, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] text-gray-500">{gain > 0 ? '+' : ''}{gain}</span>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={gain}
              onChange={(e) => handleGainChange(i, Number(e.target.value))}
              className="w-full accent-[#f5a623]"
              style={{
                writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
                direction: 'rtl',
                height: 120,
                width: 28,
              }}
            />
            <span className="text-[10px] text-gray-500 mt-1">{BAND_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
