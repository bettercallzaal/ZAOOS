'use client'

const EQ_PRESETS: Record<string, number[]> = {
  Flat:          [0,  0,  0,  0,  0],
  'Bass Boost':  [8,  4,  0,  0,  0],
  'Treble Boost':[0,  0,  0,  4,  8],
  Vocal:         [-2, 0,  4,  3, -1],
  Rock:          [4,  2, -1,  3,  5],
  'Lo-Fi':       [3,  1, -2, -3, -4],
}

const FREQUENCIES = [60, 230, 910, 3600, 14000]
const FILTER_TYPES: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf']

const STORAGE_KEY = 'zao-eq-settings'

export class AudioEqualizer {
  private context: AudioContext | null = null
  private filters: BiquadFilterNode[] = []
  private connectedSources = new Map<HTMLAudioElement, MediaElementAudioSourceNode>()
  private activeElement: HTMLAudioElement | null = null
  private gains: number[] = [0, 0, 0, 0, 0]
  private visibilityHandler: (() => void) | null = null

  constructor() {
    this.loadSettings()
  }

  /** Returns true if any EQ band is non-zero (not flat) */
  isActive(): boolean {
    return this.gains.some(g => g !== 0)
  }

  /** Connect to the currently playing audio element (called when EQ settings change) */
  connectIfActive() {
    if (this.isActive() && !this.activeElement) {
      // Look for the active audio element via the global refs set by HTMLAudioProvider
      const audioA = (globalThis as Record<string, unknown>).__zao_audio_a as HTMLAudioElement | undefined
      const audioB = (globalThis as Record<string, unknown>).__zao_audio_b as HTMLAudioElement | undefined
      const active = audioA && !audioA.paused ? audioA : audioB && !audioB.paused ? audioB : null
      if (active) this.connect(active)
    }
  }

  private ensureContext() {
    if (!this.context) {
      this.context = new AudioContext()
      // Resume immediately — may be suspended by browser autoplay policy
      if (this.context.state === 'suspended') {
        this.context.resume().catch(() => {});
      }
      this.filters = FREQUENCIES.map((freq, i) => {
        const filter = this.context!.createBiquadFilter()
        filter.type = FILTER_TYPES[i]
        filter.frequency.value = freq
        filter.gain.value = this.gains[i]
        if (filter.type === 'peaking') filter.Q.value = 1
        return filter
      })
      for (let i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].connect(this.filters[i + 1])
      }
      this.filters[this.filters.length - 1].connect(this.context.destination)

      // Resume AudioContext when returning to the app — browsers suspend it in background
      this.visibilityHandler = () => {
        if (!document.hidden && this.context?.state === 'suspended') {
          this.context.resume().catch(() => {})
        }
      }
      document.addEventListener('visibilitychange', this.visibilityHandler)
    }
  }

  connect(element: HTMLAudioElement) {
    this.ensureContext()
    // Ensure context is running (user may have interacted since creation)
    if (this.context?.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
    if (this.activeElement === element) return

    let source = this.connectedSources.get(element)
    if (!source) {
      source = this.context!.createMediaElementSource(element)
      this.connectedSources.set(element, source)
    }

    if (this.activeElement) {
      const prevSource = this.connectedSources.get(this.activeElement)
      if (prevSource) {
        try { prevSource.disconnect() } catch {}
        try { prevSource.connect(this.context!.destination) } catch {}
      }
    }

    try { source.disconnect() } catch {}
    source.connect(this.filters[0])
    this.activeElement = element
  }

  setGain(bandIndex: number, gainDb: number) {
    const clamped = Math.max(-12, Math.min(12, gainDb))
    this.gains[bandIndex] = clamped
    if (this.filters[bandIndex]) {
      this.filters[bandIndex].gain.value = clamped
    }
    this.saveSettings()
  }

  getGains(): number[] {
    return [...this.gains]
  }

  applyPreset(name: string) {
    const preset = EQ_PRESETS[name]
    if (!preset) return
    preset.forEach((gain, i) => this.setGain(i, gain))
  }

  getPresetNames(): string[] {
    return Object.keys(EQ_PRESETS)
  }

  private saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.gains))
    } catch {}
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 5) {
          this.gains = parsed
        }
      }
    } catch {}
  }

  /** Resume the AudioContext — call on user interaction or visibility change */
  resume() {
    if (this.context?.state === 'suspended') {
      this.context.resume().catch(() => {})
    }
  }

  destroy() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
    this.connectedSources.forEach((source) => {
      try { source.disconnect() } catch {}
    })
    this.connectedSources.clear()
    if (this.context) {
      try { this.context.close() } catch {}
    }
    this.context = null
    this.filters = []
    this.activeElement = null
  }
}

let instance: AudioEqualizer | null = null
export function getEqualizer(): AudioEqualizer {
  if (!instance) instance = new AudioEqualizer()
  return instance
}

export { EQ_PRESETS, FREQUENCIES }
