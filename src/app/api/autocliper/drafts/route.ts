/**
 * GET /api/autocliper/drafts
 * List all clip drafts by stage
 */

import { NextResponse } from 'next/server'
import { getSessionData } from '@/lib/auth/session'
import { listClipsByStage, getDraftStats } from '@/lib/autocliper'
import type { ClipStage } from '@/lib/autocliper'

export async function GET(request: Request) {
  try {
    const session = await getSessionData()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stageParam = searchParams.get('stage') as ClipStage | null

    let clips
    if (stageParam) {
      const validStages: ClipStage[] = ['draft', 'approved', 'published', 'rejected']
      if (!validStages.includes(stageParam)) {
        return NextResponse.json({ success: false, error: `Invalid stage: ${stageParam}` }, { status: 400 })
      }
      clips = listClipsByStage(stageParam)
    } else {
      clips = [...listClipsByStage('draft'), ...listClipsByStage('approved'), ...listClipsByStage('published'), ...listClipsByStage('rejected')]
    }

    const stats = getDraftStats()

    return NextResponse.json({ success: true, clips, stats, count: clips.length })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[api/autocliper/drafts]', errorMsg)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
