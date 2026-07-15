/**
 * POST /api/autocliper/ingest
 * Ingest a video source and create a clip draft
 */

import { NextResponse } from 'next/server'
import { getSessionData } from '@/lib/auth/session'
import { ClipMetadataSchema, validateRequest, createClipDraft } from '@/lib/autocliper'

export async function POST(request: Request) {
  try {
    const session = await getSessionData()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as unknown
    const validation = validateRequest<Record<string, unknown>>(ClipMetadataSchema, body)

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    const data = validation.data as Record<string, unknown>
    const sourceUrl = data.sourceUrl as string
    const sourceType = data.sourceType as 'restream' | 'stream' | 'call' | 'wavewarz' | 'other'
    const title = data.title as string
    const description = data.description as string

    const clip = createClipDraft(sourceUrl, sourceType, title, description)

    return NextResponse.json(
      { success: true, clip, message: `Clip draft created (ID: ${clip.id})` },
      { status: 201 },
    )
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[api/autocliper/ingest]', errorMsg)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
