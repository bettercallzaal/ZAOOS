'use client'

import { useEffect, useState } from 'react'
import type { Episode } from '@/lib/bcz-yapz/types'
import type { Chapter } from '@/lib/bcz-yapz/chapters'
import { EpisodeListCard } from './EpisodeListCard'
import { EpisodeGridCard } from './EpisodeGridCard'

type View = 'list' | 'grid'

const STORAGE_KEY = 'bcz-yapz:view'

interface EpisodeListProps {
  episodes: Episode[]
  chaptersBySlug: Record<string, Chapter[] | null>
}

export function EpisodeList({ episodes, chaptersBySlug }: EpisodeListProps) {
  const [view, setView] = useState<View>('list')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'list' || stored === 'grid') setView(stored)
  }, [])

  useEffect(() => {
    if (!mounted) return
    window.localStorage.setItem(STORAGE_KEY, view)
  }, [view, mounted])

  return (
    <section className="bg-[#0a1628] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Episodes</h2>
          <div
            role="radiogroup"
            aria-label="View"
            className="inline-flex overflow-hidden rounded-md border border-white/10 text-xs"
          >
            <button
              type="button"
              role="radio"
              aria-checked={view === 'list'}
              onClick={() => setView('list')}
              className={`px-3 py-1.5 ${
                view === 'list'
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'bg-transparent text-white/70 hover:text-white'
              }`}
            >
              List
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={view === 'grid'}
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 ${
                view === 'grid'
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'bg-transparent text-white/70 hover:text-white'
              }`}
            >
              Thumbnails
            </button>
          </div>
        </div>
        {view === 'list' ? (
          <ul className="space-y-4">
            {episodes.map((episode, idx) => (
              <li key={episode.slug}>
                <EpisodeListCard
                  episode={episode}
                  displayIndex={episodes.length - idx}
                  chapters={chaptersBySlug[episode.slug] ?? null}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {episodes.map((episode, idx) => (
              <li key={episode.slug}>
                <EpisodeGridCard
                  episode={episode}
                  displayIndex={episodes.length - idx}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
