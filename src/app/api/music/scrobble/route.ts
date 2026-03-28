import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/db/supabase'
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

    const supabase = getSupabaseAdmin()
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
