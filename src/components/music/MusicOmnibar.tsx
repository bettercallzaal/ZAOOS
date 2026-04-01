'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isMusicUrl } from '@/lib/music/isMusicUrl'
import { ArtworkImage } from '@/components/music/ArtworkImage'

interface MusicOmnibarProps {
  variant?: 'full' | 'compact'
  onPlay?: (track: OmnibarResult) => void
  onQueue?: (track: OmnibarResult) => void
}

export interface OmnibarResult {
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const inputType = query ? (isMusicUrl(query) ? 'url' : 'search') : 'browse'

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (inputType === 'search') {
      timerRef.current = setTimeout(() => setDebouncedQuery(query), 300)
    } else if (inputType === 'url') {
      setDebouncedQuery(query)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, inputType])

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

  const { data: urlResult, isLoading: urlLoading } = useQuery({
    queryKey: ['music-resolve', debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(debouncedQuery)}`)
      if (!res.ok) return null
      return (await res.json()) as OmnibarResult
    },
    enabled: !!debouncedQuery && inputType === 'url',
    staleTime: 300_000,
  })

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
  const results = useMemo(() => {
    if (inputType === 'url' && urlResult) return [urlResult];
    if (inputType === 'search') return searchResults ?? [];
    return browseResults ?? [];
  }, [inputType, urlResult, searchResults, browseResults]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && results && results.length > 0) {
        e.preventDefault()
        onPlay?.(results[0])
      }
    },
    [results, onPlay],
  )

  return (
    <div className="w-full">
      <div className="relative">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <span className="text-gray-500 text-sm">&#x1F50D;</span>
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
            <button
              onClick={() => {
                setQuery('')
                setDebouncedQuery('')
              }}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              &#x2715;
            </button>
          )}
        </div>
      </div>

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

      {results && results.length > 0 && (
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
                &#x25B6;
              </button>
              <button
                onClick={() => onQueue?.(track)}
                className="text-[#f5a623] opacity-0 group-hover:opacity-100 transition-opacity text-lg font-bold"
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
