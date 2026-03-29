'use client'

import { useEffect, useRef, useState } from 'react'

interface SpectrumVisualizerProps {
  isPlaying: boolean
  className?: string
}

interface ZaoGlobal {
  __zao_audio_a?: HTMLAudioElement
  __zao_audio_b?: HTMLAudioElement
}

export default function SpectrumVisualizer({ isPlaying, className }: SpectrumVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const analyzerRef = useRef<InstanceType<typeof import('audiomotion-analyzer').default> | null>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!containerRef.current || !visible) return

    let analyzer: InstanceType<typeof import('audiomotion-analyzer').default> | null = null

    async function init() {
      const AudioMotionAnalyzer = (await import('audiomotion-analyzer')).default

      // Get the currently active audio element
      const audioEl = (globalThis as ZaoGlobal).__zao_audio_a
      if (!audioEl) return

      try {
        analyzer = new AudioMotionAnalyzer(containerRef.current!, {
          source: audioEl,
          mode: 3, // 1/12th octave bands
          barSpace: 0.2,
          gradient: 'custom',
          showScaleX: false,
          showScaleY: false,
          showBgColor: false,
          overlay: true,
          reflexRatio: 0.3,
          reflexAlpha: 0.2,
          smoothing: 0.7,
          weightingFilter: 'A',
        })

        analyzer.registerGradient('custom', {
          colorStops: [
            { color: '#e8941a', pos: 0 },
            { color: '#f5a623', pos: 0.5 },
            { color: '#ffd700', pos: 1 },
          ],
        })
        analyzer.gradient = 'custom'

        analyzerRef.current = analyzer
      } catch {
        // AudioContext may fail on some browsers — silent fallback
      }
    }

    init()

    return () => {
      if (analyzer) {
        try { analyzer.destroy() } catch {}
      }
      analyzerRef.current = null
    }
  }, [visible])

  // Toggle active element when crossfading
  useEffect(() => {
    const analyzer = analyzerRef.current
    if (!analyzer) return

    const checkActive = () => {
      const audioA = (globalThis as ZaoGlobal).__zao_audio_a
      const audioB = (globalThis as ZaoGlobal).__zao_audio_b
      const active = audioA && !audioA.paused ? audioA : audioB && !audioB.paused ? audioB : null
      if (active) {
        try { analyzer.connectInput(active) } catch {}
      }
    }

    const interval = setInterval(checkActive, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden cursor-pointer ${className ?? ''}`}
      style={{ height: 120, background: 'rgba(245, 166, 35, 0.05)' }}
      onClick={() => setVisible((v) => !v)}
    />
  )
}
