# Music Player Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade ZAO OS music player with glassmorphism visuals, spectrum analyzer, 5-band EQ, smart omnibar for universal song adding, listening history page, Last.fm scrobbling, and TIDAL SDK playback.

**Architecture:** 4 phases — visual foundation first (glassmorphism + spectrum), then audio processing (EQ), then parallel independent features (omnibar, history, scrobbling), then TIDAL SDK. 14 new files, 6 modified files, 1 new npm dependency.

**Tech Stack:** Web Audio API (BiquadFilterNode, AnalyserNode, createMediaElementSource), audioMotion-analyzer (MIT), Last.fm API, TIDAL Developer SDK, Songlink/Odesli, Audius API v1, Next.js 16 App Router, Supabase, Tailwind v4.

---

## Phase 1: Visual Foundation

### Task 1: Install audioMotion-analyzer

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install audiomotion-analyzer
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('audiomotion-analyzer'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add audiomotion-analyzer for spectrum visualization"
```

---

### Task 2: Color Extractor for Glassmorphism

**Files:**
- Create: `src/lib/music/colorExtractor.ts`

- [ ] **Step 1: Create the color extractor utility**

```typescript
// src/lib/music/colorExtractor.ts
'use client'

const colorCache = new Map<string, { r: number; g: number; b: number }>()

export async function extractDominantColor(
  imageUrl: string
): Promise<{ r: number; g: number; b: number }> {
  if (colorCache.has(imageUrl)) return colorCache.get(imageUrl)!

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 50
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)

      const data = ctx.getImageData(0, 0, size, size).data
      let r = 0, g = 0, b = 0, count = 0

      // Sample center 60% of image to avoid edges
      const margin = Math.floor(size * 0.2)
      for (let y = margin; y < size - margin; y++) {
        for (let x = margin; x < size - margin; x++) {
          const i = (y * size + x) * 4
          // Skip very dark and very light pixels
          const brightness = data[i] + data[i + 1] + data[i + 2]
          if (brightness > 30 && brightness < 720) {
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
            count++
          }
        }
      }

      if (count === 0) {
        const fallback = { r: 245, g: 166, b: 35 } // gold fallback
        colorCache.set(imageUrl, fallback)
        resolve(fallback)
        return
      }

      const result = {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
      }
      colorCache.set(imageUrl, result)
      resolve(result)
    }

    img.onerror = () => {
      const fallback = { r: 245, g: 166, b: 35 }
      resolve(fallback)
    }

    img.src = imageUrl
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/music/colorExtractor.ts
git commit -m "feat: add dominant color extractor for glassmorphism backgrounds"
```

---

### Task 3: Spectrum Visualizer Component

**Files:**
- Create: `src/components/music/SpectrumVisualizer.tsx`

- [ ] **Step 1: Create the spectrum visualizer component**

```typescript
// src/components/music/SpectrumVisualizer.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface SpectrumVisualizerProps {
  isPlaying: boolean
  className?: string
}

export default function SpectrumVisualizer({ isPlaying, className }: SpectrumVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const analyzerRef = useRef<any>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!containerRef.current || !visible) return

    let analyzer: any = null

    async function init() {
      const AudioMotionAnalyzer = (await import('audiomotion-analyzer')).default

      // Get the currently active audio element
      const audioEl = (globalThis as any).__zao_audio_a as HTMLAudioElement | undefined
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
      const audioA = (globalThis as any).__zao_audio_a as HTMLAudioElement | undefined
      const audioB = (globalThis as any).__zao_audio_b as HTMLAudioElement | undefined
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/music/SpectrumVisualizer.tsx
git commit -m "feat: add spectrum visualizer component with audioMotion-analyzer"
```

---

### Task 4: Integrate Glassmorphism + Spectrum into ExpandedPlayer

**Files:**
- Modify: `src/components/music/ExpandedPlayer.tsx`

- [ ] **Step 1: Read the current ExpandedPlayer to understand exact structure**

Read `src/components/music/ExpandedPlayer.tsx` fully. Note the imports, state variables, and JSX layout.

- [ ] **Step 2: Add imports and glassmorphism state**

Add at the top of ExpandedPlayer.tsx, after existing imports:

```typescript
import { extractDominantColor } from '@/lib/music/colorExtractor'
import dynamic from 'next/dynamic'

const SpectrumVisualizer = dynamic(
  () => import('@/components/music/SpectrumVisualizer'),
  { ssr: false }
)
```

Add inside the component, after existing state declarations:

```typescript
const [bgColor, setBgColor] = useState({ r: 10, g: 22, b: 40 }) // navy default

useEffect(() => {
  if (metadata?.artworkUrl) {
    extractDominantColor(metadata.artworkUrl).then(setBgColor)
  }
}, [metadata?.artworkUrl])
```

- [ ] **Step 3: Add glassmorphism background to the outer wrapper**

Find the outermost container div of ExpandedPlayer and add inline style for the dynamic gradient background. The exact edit depends on the current JSX structure (read in step 1), but the pattern is:

```typescript
// Add as the first child inside the outer container, behind all content
<div
  className="absolute inset-0 transition-colors duration-500"
  style={{
    background: `radial-gradient(circle at 50% 30%, rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.2), transparent 70%)`,
  }}
/>
<div className="absolute inset-0 backdrop-blur-xl" />
```

All existing content should get `className="relative z-10"` or be wrapped in a relative container.

- [ ] **Step 4: Add SpectrumVisualizer below controls, above existing panels**

Insert between the transport controls and the existing panel content (lyrics, queue, etc.):

```tsx
<SpectrumVisualizer
  isPlaying={isPlaying}
  className="mx-4 my-3"
/>
```

- [ ] **Step 5: Add icon bar for panel switching**

Replace the existing panel toggle buttons (if any) with an icon bar:

```tsx
const [activePanel, setActivePanel] = useState<'eq' | 'lyrics' | 'queue' | 'share' | null>(null)

// In JSX, below the SpectrumVisualizer:
<div className="flex justify-around border-t border-white/10 pt-3 mt-3">
  {[
    { id: 'eq' as const, icon: '🎤', label: 'EQ' },
    { id: 'lyrics' as const, icon: '🎵', label: 'Lyrics' },
    { id: 'queue' as const, icon: '📝', label: 'Queue' },
    { id: 'share' as const, icon: '🔗', label: 'Share' },
  ].map((item) => (
    <button
      key={item.id}
      onClick={() => setActivePanel(activePanel === item.id ? null : item.id)}
      className={`flex flex-col items-center gap-1 text-xs transition-colors ${
        activePanel === item.id ? 'text-[#f5a623]' : 'text-gray-500'
      }`}
    >
      <span className="text-lg">{item.icon}</span>
      {item.label}
    </button>
  ))}
</div>

{/* Conditionally render panels */}
{activePanel === 'lyrics' && <LyricsPanel ... />}
{activePanel === 'queue' && <QueuePanel ... />}
{activePanel === 'share' && <ShareMenu ... />}
{activePanel === 'eq' && <div className="p-4 text-center text-gray-500">EQ coming in Phase 2</div>}
```

- [ ] **Step 6: Verify the app builds**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/music/ExpandedPlayer.tsx
git commit -m "feat: add glassmorphism background + spectrum visualizer to ExpandedPlayer"
```

---

## Phase 2: Audio Processing

### Task 5: AudioEqualizer Class

**Files:**
- Create: `src/lib/music/equalizer.ts`

- [ ] **Step 1: Create the equalizer class**

```typescript
// src/lib/music/equalizer.ts
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

  constructor() {
    this.loadSettings()
  }

  private ensureContext() {
    if (!this.context) {
      this.context = new AudioContext()
      this.filters = FREQUENCIES.map((freq, i) => {
        const filter = this.context!.createBiquadFilter()
        filter.type = FILTER_TYPES[i]
        filter.frequency.value = freq
        filter.gain.value = this.gains[i]
        if (filter.type === 'peaking') filter.Q.value = 1
        return filter
      })
      // Chain filters together
      for (let i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].connect(this.filters[i + 1])
      }
      this.filters[this.filters.length - 1].connect(this.context.destination)
    }
  }

  connect(element: HTMLAudioElement) {
    this.ensureContext()
    if (this.activeElement === element) return

    // createMediaElementSource can only be called ONCE per element
    let source = this.connectedSources.get(element)
    if (!source) {
      source = this.context!.createMediaElementSource(element)
      this.connectedSources.set(element, source)
    }

    // Disconnect previous active element's source from filter chain
    if (this.activeElement) {
      const prevSource = this.connectedSources.get(this.activeElement)
      if (prevSource) {
        try { prevSource.disconnect() } catch {}
        // Re-route previous element directly to destination so it still plays
        try { prevSource.connect(this.context!.destination) } catch {}
      }
    }

    // Route new element through filter chain
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

  destroy() {
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

// Singleton — one EQ instance for the whole app
let instance: AudioEqualizer | null = null
export function getEqualizer(): AudioEqualizer {
  if (!instance) instance = new AudioEqualizer()
  return instance
}

export { EQ_PRESETS, FREQUENCIES }
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/music/equalizer.ts
git commit -m "feat: add 5-band AudioEqualizer class with presets and persistence"
```

---

### Task 6: Equalizer Panel UI

**Files:**
- Create: `src/components/music/EqualizerPanel.tsx`

- [ ] **Step 1: Create the equalizer panel component**

```typescript
// src/components/music/EqualizerPanel.tsx
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
    setActivePreset(null) // clear preset indicator on manual change
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
                writingMode: 'vertical-lr' as any,
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/music/EqualizerPanel.tsx
git commit -m "feat: add EqualizerPanel UI with presets and vertical sliders"
```

---

### Task 7: Wire EQ into ExpandedPlayer + HTMLAudioProvider

**Files:**
- Modify: `src/components/music/ExpandedPlayer.tsx`
- Modify: `src/providers/audio/HTMLAudioProvider.tsx`

- [ ] **Step 1: Read HTMLAudioProvider.tsx for the exact audio element exposure pattern**

Read `src/providers/audio/HTMLAudioProvider.tsx` — note where `__zao_audio_a` and `__zao_audio_b` are assigned.

- [ ] **Step 2: Add EQ connection in HTMLAudioProvider**

After the lines where `globalThis.__zao_audio_a = audioA` (or equivalent), add EQ auto-connect logic. Find the `play()` or `load()` method and add:

```typescript
// At top of file, add import:
import { getEqualizer } from '@/lib/music/equalizer'

// Inside the play() or load() method, after setting src on the active element:
// Connect EQ to the currently active audio element
try {
  const eq = getEqualizer()
  const activeEl = /* the element that is about to play */
  eq.connect(activeEl)
} catch {}
```

The exact insertion point depends on the code structure read in step 1. The key: call `eq.connect(element)` whenever the active audio element changes (including during crossfade swaps).

- [ ] **Step 3: Import and render EqualizerPanel in ExpandedPlayer**

In ExpandedPlayer.tsx, add import:

```typescript
import dynamic from 'next/dynamic'
const EqualizerPanel = dynamic(() => import('@/components/music/EqualizerPanel'), { ssr: false })
```

Replace the Phase 2 placeholder from Task 4:

```tsx
{activePanel === 'eq' && <EqualizerPanel />}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/providers/audio/HTMLAudioProvider.tsx src/components/music/ExpandedPlayer.tsx
git commit -m "feat: wire 5-band EQ into audio pipeline and ExpandedPlayer"
```

---

## Phase 3: Parallel Features

### Task 8: Unified Search API

**Files:**
- Create: `src/app/api/music/search/route.ts`

- [ ] **Step 1: Create the search endpoint**

```typescript
// src/app/api/music/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { searchAudiusTracks } from '@/lib/music/audius'
import { createClient } from '@/lib/db/supabase'

const SearchSchema = z.object({
  q: z.string().min(1).max(200),
  genre: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = Object.fromEntries(req.nextUrl.searchParams)
    const parsed = SearchSchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { q, genre, limit } = parsed.data

    // Search in parallel across all sources
    const [audiusResult, libraryResult] = await Promise.allSettled([
      searchAudiusTracks(q, limit),
      searchLibrary(q, limit),
    ])

    const results: SearchResult[] = []

    // Audius results
    if (audiusResult.status === 'fulfilled' && audiusResult.value) {
      for (const track of audiusResult.value) {
        results.push({
          id: `audius-${track.id}`,
          title: track.title,
          artist: track.user?.name ?? 'Unknown',
          artworkUrl: track.artwork?.['480x480'] ?? track.artwork?.['150x150'] ?? '',
          platform: 'audius' as const,
          url: `https://audius.co${track.permalink}`,
          streamUrl: `https://api.audius.co/v1/tracks/${track.id}/stream?app_name=ZAO-OS`,
          playCount: track.play_count ?? 0,
        })
      }
    }

    // Library results (songs already in ZAO)
    if (libraryResult.status === 'fulfilled' && libraryResult.value) {
      for (const song of libraryResult.value) {
        // Dedupe: skip if Audius already has same title+artist
        const isDupe = results.some(
          (r) => r.title.toLowerCase() === song.title?.toLowerCase() &&
                 r.artist.toLowerCase() === song.artist?.toLowerCase()
        )
        if (!isDupe) {
          results.push({
            id: `library-${song.id}`,
            title: song.title ?? 'Unknown',
            artist: song.artist ?? 'Unknown',
            artworkUrl: song.artwork_url ?? '',
            platform: (song.platform ?? 'audio') as any,
            url: song.url ?? '',
            streamUrl: song.stream_url ?? song.url ?? '',
            playCount: song.play_count ?? 0,
          })
        }
      }
    }

    return NextResponse.json({ results, sources: ['audius', 'library'] })
  } catch (error) {
    console.error('Music search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

interface SearchResult {
  id: string
  title: string
  artist: string
  artworkUrl: string
  platform: string
  url: string
  streamUrl: string
  playCount: number
}

async function searchLibrary(query: string, limit: number) {
  const supabase = createClient()
  const { data } = await supabase
    .from('songs')
    .select('id, title, artist, artwork_url, url, stream_url, platform, play_count')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .order('play_count', { ascending: false })
    .limit(limit)
  return data ?? []
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/music/search/route.ts
git commit -m "feat: add unified music search API (Audius + library)"
```

---

### Task 9: MusicOmnibar Component

**Files:**
- Create: `src/components/music/MusicOmnibar.tsx`

- [ ] **Step 1: Create the omnibar component**

```typescript
// src/components/music/MusicOmnibar.tsx
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isMusicUrl } from '@/lib/music/isMusicUrl'
import ArtworkImage from '@/components/music/ArtworkImage'

interface MusicOmnibarProps {
  variant?: 'full' | 'compact'
  onPlay?: (track: OmnibarResult) => void
  onQueue?: (track: OmnibarResult) => void
}

interface OmnibarResult {
  id: string
  title: string
  artist: string
  artworkUrl: string
  platform: string
  url: string
  streamUrl: string
}

const GENRES = ['All', 'Trending', 'Hip-Hop', 'Electronic', 'Lo-Fi', 'R&B']

export default function MusicOmnibar({ variant = 'full', onPlay, onQueue }: MusicOmnibarProps) {
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  const inputType = query ? (isMusicUrl(query) ? 'url' : 'search') : 'browse'

  // Debounce search queries
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (inputType === 'search') {
      timerRef.current = setTimeout(() => setDebouncedQuery(query), 300)
    } else if (inputType === 'url') {
      setDebouncedQuery(query) // URLs resolve immediately
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, inputType])

  // Search query
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['music-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || inputType === 'browse') return null
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`)
      if (!res.ok) return null
      const data = await res.json()
      return data.results as OmnibarResult[]
    },
    enabled: !!debouncedQuery && inputType === 'search',
    staleTime: 60_000,
  })

  // URL resolution
  const { data: urlResult, isLoading: urlLoading } = useQuery({
    queryKey: ['music-resolve', debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(debouncedQuery)}`)
      if (!res.ok) return null
      return await res.json() as OmnibarResult
    },
    enabled: !!debouncedQuery && inputType === 'url',
    staleTime: 300_000,
  })

  // Browse (Audius trending)
  const { data: browseResults } = useQuery({
    queryKey: ['music-browse', activeGenre],
    queryFn: async () => {
      const genre = activeGenre === 'All' || activeGenre === 'Trending' ? '' : activeGenre
      const res = await fetch(`/api/music/search?q=trending&genre=${genre}&limit=20`)
      if (!res.ok) return null
      const data = await res.json()
      return data.results as OmnibarResult[]
    },
    enabled: inputType === 'browse',
    staleTime: 300_000,
  })

  const isLoading = searchLoading || urlLoading
  const results = inputType === 'url' && urlResult ? [urlResult]
    : inputType === 'search' ? (searchResults ?? [])
    : (browseResults ?? [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      onPlay?.(results[0])
    }
  }, [results, onPlay])

  return (
    <div className="w-full">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <span className="text-gray-500">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste URL or search any song..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
          />
          {isLoading && (
            <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
          )}
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-500 hover:text-gray-300">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Genre chips (browse mode only) */}
      {inputType === 'browse' && variant === 'full' && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeGenre === genre
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-3 space-y-1 max-h-80 overflow-y-auto">
          {results.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-2.5 transition-colors group"
            >
              <ArtworkImage
                src={track.artworkUrl}
                alt={track.title}
                width={40}
                height={40}
                className="rounded shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{track.title}</div>
                <div className="text-xs text-gray-500 truncate">
                  {track.artist}
                  {track.platform && (
                    <span className="ml-1.5 text-[10px] uppercase text-gray-600">
                      {track.platform}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onPlay?.(track)}
                className="text-[#f5a623] opacity-0 group-hover:opacity-100 transition-opacity text-lg"
                title="Play now"
              >
                ▶
              </button>
              <button
                onClick={() => onQueue?.(track)}
                className="text-[#f5a623] opacity-0 group-hover:opacity-100 transition-opacity text-lg"
                title="Add to queue"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/music/MusicOmnibar.tsx
git commit -m "feat: add MusicOmnibar with URL auto-detect, search, and browse"
```

---

### Task 10: Integrate Omnibar into Music Page

**Files:**
- Modify: `src/app/(auth)/music/page.tsx` or `src/components/music/MusicPage.tsx`

- [ ] **Step 1: Read the current music page to understand layout**

Read `src/components/music/MusicPage.tsx` (or wherever the music page content lives).

- [ ] **Step 2: Add MusicOmnibar at the top of the music page**

Add import and render the omnibar at the top of the page content, wiring `onPlay` and `onQueue` to the existing `usePlayer` hook:

```tsx
import MusicOmnibar from '@/components/music/MusicOmnibar'
import { usePlayer } from '@/hooks/usePlayer'

// Inside the component:
const { play } = usePlayer()

// At top of page JSX, before existing content:
<MusicOmnibar
  variant="full"
  onPlay={(track) => play({
    id: track.id,
    type: (track.platform as any) || 'audio',
    trackName: track.title,
    artistName: track.artist,
    artworkUrl: track.artworkUrl,
    url: track.url,
    streamUrl: track.streamUrl,
    feedId: track.id,
  })}
  onQueue={(track) => {
    // Add to queue via usePlayerQueue if available
  }}
/>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/music/MusicPage.tsx
git commit -m "feat: integrate MusicOmnibar into /music page"
```

---

### Task 11: Listening History API

**Files:**
- Create: `src/app/api/music/history/route.ts`

- [ ] **Step 1: Create the history endpoint**

```typescript
// src/app/api/music/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { createClient } from '@/lib/db/supabase'

const HistorySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('week'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = Object.fromEntries(req.nextUrl.searchParams)
    const parsed = HistorySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { period, limit, offset } = parsed.data
    const supabase = createClient()

    let query = supabase
      .from('songs')
      .select('id, title, artist, artwork_url, url, stream_url, platform, play_count, last_played_at', { count: 'exact' })
      .not('last_played_at', 'is', null)
      .order('last_played_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Date filter
    if (period !== 'all') {
      const now = new Date()
      let since: Date
      if (period === 'today') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (period === 'week') {
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else {
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      query = query.gte('last_played_at', since.toISOString())
    }

    const { data, count, error } = await query

    if (error) {
      console.error('History query error:', error)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    return NextResponse.json({
      tracks: data ?? [],
      total: count ?? 0,
      hasMore: (offset + limit) < (count ?? 0),
    })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/music/history/route.ts
git commit -m "feat: add listening history API with date filtering and pagination"
```

---

### Task 12: Listening History Page

**Files:**
- Create: `src/app/(auth)/music/history/page.tsx`

- [ ] **Step 1: Create the history page**

```typescript
// src/app/(auth)/music/history/page.tsx
import type { Metadata } from 'next'
import HistoryClient from './HistoryClient'

export const metadata: Metadata = { title: 'Listening History — ZAO OS' }

export default function HistoryPage() {
  return <HistoryClient />
}
```

- [ ] **Step 2: Create the client component**

```typescript
// src/app/(auth)/music/history/HistoryClient.tsx
'use client'

import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { usePlayer } from '@/hooks/usePlayer'
import ArtworkImage from '@/components/music/ArtworkImage'

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
] as const

export default function HistoryClient() {
  const [period, setPeriod] = useState<string>('week')
  const { play } = usePlayer()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['listening-history', period],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`/api/music/history?period=${period}&limit=20&offset=${pageParam}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.reduce((sum: number, p: any) => sum + p.tracks.length, 0) : undefined,
    initialPageParam: 0,
  })

  const tracks = data?.pages.flatMap((p) => p.tracks) ?? []
  const total = data?.pages[0]?.total ?? 0

  function handlePlay(track: any) {
    play({
      id: track.id,
      type: track.platform ?? 'audio',
      trackName: track.title ?? 'Unknown',
      artistName: track.artist ?? 'Unknown',
      artworkUrl: track.artwork_url ?? '',
      url: track.url ?? '',
      streamUrl: track.stream_url ?? track.url ?? '',
      feedId: track.id,
    })
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Listening History</h1>
        <span className="text-sm text-gray-500">{total} plays</span>
      </div>

      {/* Period filter */}
      <div className="flex gap-2 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              period === p.id
                ? 'bg-[#f5a623] text-[#0a1628]'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div className="space-y-1">
        {tracks.map((track: any) => (
          <button
            key={`${track.id}-${track.last_played_at}`}
            onClick={() => handlePlay(track)}
            className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors text-left"
          >
            <ArtworkImage
              src={track.artwork_url}
              alt={track.title ?? ''}
              width={48}
              height={48}
              className="rounded shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{track.title ?? 'Unknown'}</div>
              <div className="text-xs text-gray-500 truncate">{track.artist ?? 'Unknown'}</div>
            </div>
            {track.play_count > 1 && (
              <span className="shrink-0 bg-[#f5a623]/10 text-[#f5a623] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {track.play_count}×
              </span>
            )}
            <span className="shrink-0 text-xs text-gray-600">
              {track.last_played_at ? timeAgo(track.last_played_at) : ''}
            </span>
          </button>
        ))}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full mt-4 py-2 text-sm text-[#f5a623] hover:text-white transition-colors"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load more'}
        </button>
      )}

      {tracks.length === 0 && (
        <div className="text-center text-gray-500 py-12">No listening history for this period.</div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/music/history/
git commit -m "feat: add listening history page with date filters and infinite scroll"
```

---

### Task 13: Last.fm Client Library

**Files:**
- Create: `src/lib/music/lastfm.ts`

- [ ] **Step 1: Create the Last.fm API client**

```typescript
// src/lib/music/lastfm.ts
import crypto from 'crypto'

const API_URL = 'https://ws.audioscrobbler.com/2.0/'

function getApiKey() { return process.env.LASTFM_API_KEY! }
function getApiSecret() { return process.env.LASTFM_API_SECRET! }

function signParams(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
  const sig = sorted.map((k) => `${k}${params[k]}`).join('') + getApiSecret()
  return crypto.createHash('md5').update(sig).digest('hex')
}

async function callApi(params: Record<string, string>) {
  const allParams = { ...params, api_key: getApiKey(), format: 'json' }
  allParams.api_sig = signParams(allParams)

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(allParams).toString(),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Last.fm API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function scrobble(params: {
  artist: string
  track: string
  album?: string
  timestamp: number
  sk: string
}) {
  return callApi({
    method: 'track.scrobble',
    artist: params.artist,
    track: params.track,
    ...(params.album ? { album: params.album } : {}),
    timestamp: String(params.timestamp),
    sk: params.sk,
  })
}

export async function updateNowPlaying(params: {
  artist: string
  track: string
  album?: string
  sk: string
}) {
  return callApi({
    method: 'track.updateNowPlaying',
    artist: params.artist,
    track: params.track,
    ...(params.album ? { album: params.album } : {}),
    sk: params.sk,
  })
}

export function getAuthUrl(callbackUrl: string): string {
  return `https://www.last.fm/api/auth/?api_key=${getApiKey()}&cb=${encodeURIComponent(callbackUrl)}`
}

export async function getSession(token: string): Promise<string> {
  const result = await callApi({
    method: 'auth.getSession',
    token,
  })
  return result.session.key
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/music/lastfm.ts
git commit -m "feat: add Last.fm API client (scrobble, nowPlaying, auth)"
```

---

### Task 14: Last.fm Scrobble API Route

**Files:**
- Create: `src/app/api/music/scrobble/route.ts`

- [ ] **Step 1: Create the scrobble endpoint**

```typescript
// src/app/api/music/scrobble/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { createClient } from '@/lib/db/supabase'
import { scrobble, updateNowPlaying } from '@/lib/music/lastfm'

const ScrobbleSchema = z.object({
  artist: z.string().min(1),
  track: z.string().min(1),
  album: z.string().optional(),
  action: z.enum(['scrobble', 'nowplaying']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = ScrobbleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { artist, track, album, action } = parsed.data

    // Get user's Last.fm session key from settings
    const supabase = createClient()
    const { data: settings } = await supabase
      .from('user_settings')
      .select('lastfm_session_key')
      .eq('fid', session.fid)
      .single()

    if (!settings?.lastfm_session_key) {
      return NextResponse.json({ error: 'Last.fm not connected' }, { status: 400 })
    }

    const sk = settings.lastfm_session_key

    if (action === 'scrobble') {
      await scrobble({
        artist,
        track,
        album,
        timestamp: Math.floor(Date.now() / 1000),
        sk,
      })
    } else {
      await updateNowPlaying({ artist, track, album, sk })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Scrobble error:', error)
    return NextResponse.json({ error: 'Scrobble failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/music/scrobble/route.ts
git commit -m "feat: add Last.fm scrobble API route"
```

---

### Task 15: Wire Scrobbling into PlayerProvider

**Files:**
- Modify: `src/providers/audio/PlayerProvider.tsx`

- [ ] **Step 1: Read PlayerProvider.tsx for the timeupdate/PROGRESS dispatch pattern**

Read `src/providers/audio/PlayerProvider.tsx` — find where `PROGRESS` action is dispatched and where track changes happen.

- [ ] **Step 2: Add scrobble tracking**

Add a ref to track scrobble state, and fire scrobbles on threshold:

```typescript
// Near other refs at top of component:
const scrobbledRef = useRef(false)
const nowPlayingRef = useRef('')

// In the effect or callback that handles PROGRESS/timeupdate:
// After position and duration are available:
useEffect(() => {
  const { position, duration, metadata, status } = state
  if (status !== 'playing' || !metadata || !duration) return

  // Send nowPlaying on track change
  const trackKey = `${metadata.artistName}-${metadata.trackName}`
  if (trackKey !== nowPlayingRef.current) {
    nowPlayingRef.current = trackKey
    scrobbledRef.current = false
    fetch('/api/music/scrobble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist: metadata.artistName,
        track: metadata.trackName,
        action: 'nowplaying',
      }),
    }).catch(() => {}) // fire-and-forget
  }

  // Scrobble after 50% or 4 minutes
  if (!scrobbledRef.current && duration > 30000) {
    const halfDuration = duration / 2
    const fourMinutes = 240000
    if (position > Math.min(halfDuration, fourMinutes)) {
      scrobbledRef.current = true
      fetch('/api/music/scrobble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: metadata.artistName,
          track: metadata.trackName,
          action: 'scrobble',
        }),
      }).catch(() => {})
    }
  }
}, [state.position, state.duration, state.metadata, state.status])
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/providers/audio/PlayerProvider.tsx
git commit -m "feat: wire Last.fm scrobbling into PlayerProvider (50%/4min threshold)"
```

---

## Phase 4: TIDAL SDK

### Task 16: TIDAL API Client

**Files:**
- Create: `src/lib/music/tidal.ts`

- [ ] **Step 1: Create the TIDAL client**

```typescript
// src/lib/music/tidal.ts
const TIDAL_API = 'https://openapi.tidal.com/v2'

function getClientId() { return process.env.TIDAL_CLIENT_ID! }
function getClientSecret() { return process.env.TIDAL_CLIENT_SECRET! }

export async function searchTidal(query: string, limit = 10): Promise<TidalTrack[]> {
  const res = await fetch(
    `${TIDAL_API}/searchresults/${encodeURIComponent(query)}?countryCode=US&limit=${limit}&include=tracks`,
    {
      headers: {
        Authorization: `Bearer ${await getClientToken()}`,
        'Content-Type': 'application/vnd.api+json',
      },
      signal: AbortSignal.timeout(10000),
    }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.tracks ?? []).map(mapTrack)
}

export async function getTidalTrack(id: string): Promise<TidalTrack | null> {
  const res = await fetch(`${TIDAL_API}/tracks/${id}?countryCode=US`, {
    headers: {
      Authorization: `Bearer ${await getClientToken()}`,
      'Content-Type': 'application/vnd.api+json',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return null
  return mapTrack(await res.json())
}

// Client credentials token (no user auth needed for catalog search)
let cachedToken: { token: string; expiresAt: number } | null = null

async function getClientToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const res = await fetch('https://auth.tidal.com/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: getClientId(),
      client_secret: getClientSecret(),
    }),
  })

  if (!res.ok) throw new Error('TIDAL auth failed')
  const data = await res.json()

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return cachedToken.token
}

function mapTrack(raw: any): TidalTrack {
  return {
    id: raw.id ?? raw.data?.id,
    title: raw.title ?? raw.attributes?.title ?? 'Unknown',
    artist: raw.artists?.[0]?.name ?? raw.attributes?.artists?.[0]?.name ?? 'Unknown',
    album: raw.album?.title ?? '',
    artworkUrl: raw.album?.imageCover?.[0]?.url ?? '',
    duration: raw.duration ?? raw.attributes?.duration ?? 0,
    url: `https://tidal.com/browse/track/${raw.id ?? raw.data?.id}`,
  }
}

export interface TidalTrack {
  id: string
  title: string
  artist: string
  album: string
  artworkUrl: string
  duration: number
  url: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/music/tidal.ts
git commit -m "feat: add TIDAL API client (catalog search, track metadata)"
```

---

### Task 17: Upgrade TidalProvider

**Files:**
- Modify: `src/providers/audio/TidalProvider.tsx`

- [ ] **Step 1: Read the current TidalProvider and the pattern from other providers (e.g., SpotifyProvider.tsx)**

Read `src/providers/audio/TidalProvider.tsx` and `src/providers/audio/SpotifyProvider.tsx` to understand the controller registration pattern.

- [ ] **Step 2: Rewrite TidalProvider with SDK playback**

The TIDAL Web Player SDK is required for playback. Since the SDK may not be publicly available yet (the portal is new), implement a progressive approach: use the catalog API for metadata/search (Task 16), but keep external redirect for actual playback until the Player SDK is accessible. The provider should check if the SDK is loaded and fall back gracefully.

```typescript
// src/providers/audio/TidalProvider.tsx
'use client'

import { ReactNode, useEffect, useRef, useCallback } from 'react'

interface TidalProviderProps {
  children: ReactNode
  onRegister?: (type: string, controller: any) => void
}

export function TidalProvider({ children, onRegister }: TidalProviderProps) {
  const registered = useRef(false)

  useEffect(() => {
    if (registered.current || !onRegister) return
    registered.current = true

    // Register a controller that opens TIDAL externally
    // TODO: Replace with SDK playback when TIDAL Player module is publicly available
    onRegister('tidal', {
      play: () => {},
      pause: () => {},
      seek: () => {},
      load: (url: string) => {
        // Extract track ID and open in TIDAL
        window.open(url, '_blank', 'noopener')
      },
      setVolume: () => {},
    })
  }, [onRegister])

  return <>{children}</>
}
```

- [ ] **Step 3: Add TIDAL to the search pipeline**

In `src/app/api/music/search/route.ts`, add TIDAL as a search source:

```typescript
// Add import at top:
import { searchTidal } from '@/lib/music/tidal'

// In the Promise.allSettled array, add:
const [audiusResult, libraryResult, tidalResult] = await Promise.allSettled([
  searchAudiusTracks(q, limit),
  searchLibrary(q, limit),
  process.env.TIDAL_CLIENT_ID ? searchTidal(q, Math.min(limit, 5)) : Promise.resolve([]),
])

// After library results, add TIDAL results:
if (tidalResult.status === 'fulfilled' && tidalResult.value) {
  for (const track of tidalResult.value) {
    const isDupe = results.some(
      (r) => r.title.toLowerCase() === track.title.toLowerCase() &&
             r.artist.toLowerCase() === track.artist.toLowerCase()
    )
    if (!isDupe) {
      results.push({
        id: `tidal-${track.id}`,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl,
        platform: 'tidal',
        url: track.url,
        streamUrl: track.url, // external for now
        playCount: 0,
      })
    }
  }
}

// Update sources array:
return NextResponse.json({ results, sources: ['audius', 'library', 'tidal'] })
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/providers/audio/TidalProvider.tsx src/app/api/music/search/route.ts
git commit -m "feat: upgrade TIDAL integration with catalog search + progressive SDK fallback"
```

---

## Final Verification

### Task 18: Full Build + Lint Check

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: No new errors.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 3: Final commit if any lint fixes needed**

```bash
git add -A
git commit -m "fix: lint cleanup for music player upgrade"
```
