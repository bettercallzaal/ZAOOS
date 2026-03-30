import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { scrobble, updateNowPlaying } from '@/lib/music/lastfm'
import { submitListen, submitNowPlaying } from '@/lib/music/listenbrainz'
import { logger } from '@/lib/logger';

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
      .select('lastfm_session_key, listenbrainz_token')
      .eq('fid', session.fid)
      .single()

    if (!settings?.lastfm_session_key && !settings?.listenbrainz_token) {
      return NextResponse.json({ skipped: true, reason: 'No scrobbling service connected' })
    }

    const sk = settings.lastfm_session_key

    // Last.fm scrobble
    if (sk) {
      if (action === 'scrobble') {
        await scrobble({ artist, track, album, timestamp: Math.floor(Date.now() / 1000), sk });
      } else {
        await updateNowPlaying({ artist, track, album, sk });
      }
    }

    // ListenBrainz scrobble (fire-and-forget)
    if (settings?.listenbrainz_token) {
      try {
        if (action === 'scrobble') {
          await submitListen({
            artist, track, album,
            timestamp: Math.floor(Date.now() / 1000),
            userToken: settings.listenbrainz_token,
          });
        } else {
          await submitNowPlaying({
            artist, track, album,
            userToken: settings.listenbrainz_token,
          });
        }
      } catch (lbError) {
        logger.error('[scrobble] ListenBrainz error:', lbError);
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Scrobble error:', error)
    return NextResponse.json({ error: 'Scrobble failed' }, { status: 500 })
  }
}
