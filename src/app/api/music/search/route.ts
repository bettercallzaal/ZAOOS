import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { searchAudiusTracks } from '@/lib/music/audius'
import { getSupabaseAdmin } from '@/lib/db/supabase'

const SearchSchema = z.object({
  q: z.string().min(1).max(200),
  genre: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.fid && !session?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = Object.fromEntries(req.nextUrl.searchParams)
    const parsed = SearchSchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { q, genre, limit } = parsed.data

    const [audiusResult, libraryResult] = await Promise.allSettled([
      searchAudiusTracks(q, limit),
      searchLibrary(q, limit),
    ])

    const results: SearchResult[] = []

    if (audiusResult.status === 'fulfilled' && audiusResult.value) {
      for (const track of audiusResult.value) {
        results.push({
          id: `audius-${track.id}`,
          title: track.title,
          artist: track.user?.name ?? 'Unknown',
          artworkUrl: track.artwork?.['480x480'] ?? track.artwork?.['150x150'] ?? '',
          platform: 'audius',
          url: `https://audius.co${track.permalink}`,
          streamUrl: `https://api.audius.co/v1/tracks/${track.id}/stream?app_name=ZAO-OS`,
          playCount: track.play_count ?? 0,
        })
      }
    }

    if (libraryResult.status === 'fulfilled' && libraryResult.value) {
      for (const song of libraryResult.value) {
        const isDupe = results.some(
          (r) =>
            r.title.toLowerCase() === song.title?.toLowerCase() &&
            r.artist.toLowerCase() === song.artist?.toLowerCase(),
        )
        if (!isDupe) {
          results.push({
            id: `library-${song.id}`,
            title: song.title ?? 'Unknown',
            artist: song.artist ?? 'Unknown',
            artworkUrl: song.artwork_url ?? '',
            platform: song.platform ?? 'audio',
            url: song.url ?? '',
            streamUrl: song.stream_url ?? song.url ?? '',
            playCount: song.play_count ?? 0,
          })
        }
      }
    }

    // Suppress unused genre variable lint warning — reserved for future filtering
    void genre

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

interface LibrarySong {
  id: string
  title: string | null
  artist: string | null
  artwork_url: string | null
  url: string | null
  stream_url: string | null
  platform: string | null
  play_count: number | null
}

async function searchLibrary(query: string, limit: number): Promise<LibrarySong[]> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('songs')
    .select('id, title, artist, artwork_url, url, stream_url, platform, play_count')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .order('play_count', { ascending: false })
    .limit(limit)
  return (data as LibrarySong[] | null) ?? []
}
