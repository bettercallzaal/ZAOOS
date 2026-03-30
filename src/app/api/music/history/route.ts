import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger';

const HistorySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('week'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.fid && !session?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = Object.fromEntries(req.nextUrl.searchParams)
    const parsed = HistorySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { period, limit, offset } = parsed.data
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('songs')
      .select('id, title, artist, artwork_url, url, stream_url, platform, play_count, last_played_at', { count: 'exact' })
      .not('last_played_at', 'is', null)
      .order('last_played_at', { ascending: false })
      .range(offset, offset + limit - 1)

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
      logger.error('History query error:', error)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    return NextResponse.json({
      tracks: data ?? [],
      total: count ?? 0,
      hasMore: (offset + limit) < (count ?? 0),
    })
  } catch (error) {
    logger.error('History error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
