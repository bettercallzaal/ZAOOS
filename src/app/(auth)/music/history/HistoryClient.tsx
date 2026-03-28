'use client'

import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { usePlayerContext } from '@/providers/audio/PlayerProvider'
import { ArtworkImage } from '@/components/music/ArtworkImage'
import type { TrackType } from '@/types/music'

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
] as const

export default function HistoryClient() {
  const [period, setPeriod] = useState<string>('week')
  const { dispatch } = usePlayerContext()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['listening-history', period],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`/api/music/history?period=${period}&limit=20&offset=${pageParam}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.reduce((sum: number, p: { tracks: unknown[] }) => sum + p.tracks.length, 0) : undefined,
    initialPageParam: 0,
  })

  const tracks = data?.pages.flatMap((p) => p.tracks) ?? []
  const total = data?.pages[0]?.total ?? 0

  function handlePlay(track: {
    id: string
    platform?: string
    title?: string
    artist?: string
    artwork_url?: string
    url?: string
    stream_url?: string
    last_played_at?: string
  }) {
    dispatch({
      type: 'PLAY',
      payload: {
        id: track.id,
        type: (track.platform ?? 'audio') as TrackType,
        trackName: track.title ?? 'Unknown',
        artistName: track.artist ?? 'Unknown',
        artworkUrl: track.artwork_url ?? '',
        url: track.url ?? '',
        streamUrl: track.stream_url ?? track.url ?? '',
        feedId: track.id,
      },
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

      <div className="flex gap-2 mb-4 flex-wrap">
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

      <div className="space-y-1">
        {tracks.map((track: {
          id: string
          play_count: number
          last_played_at?: string
          title?: string
          artist?: string
          artwork_url?: string
          url?: string
          stream_url?: string
          platform?: string
        }) => (
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

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full mt-4 py-2 text-sm text-[#f5a623] hover:text-white transition-colors disabled:opacity-50"
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
