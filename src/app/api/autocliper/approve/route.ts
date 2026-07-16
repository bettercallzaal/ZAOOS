/**
 * POST /api/autocliper/approve
 * Approve a clip draft for publishing
 */

import { NextResponse } from 'next/server'
import { getSessionData } from '@/lib/auth/session'
import { ApprovalRequestSchema, validateRequest, getClipDraft, approveClipDraft } from '@/lib/autocliper'

export async function POST(request: Request) {
  try {
    const session = await getSessionData()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as unknown
    const validation = validateRequest<Record<string, unknown>>(ApprovalRequestSchema, body)

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    const data = validation.data as Record<string, unknown>
    const clipId = data.clipId as string

    const clip = getClipDraft(clipId)
    if (!clip) {
      return NextResponse.json({ success: false, error: `Clip not found: ${clipId}` }, { status: 404 })
    }

    if (clip.stage !== 'draft') {
      return NextResponse.json({ success: false, error: `Clip is not a draft (stage: ${clip.stage})` }, { status: 400 })
    }

    const approved = approveClipDraft(clipId)

    return NextResponse.json({ success: true, clip: approved, message: 'Clip approved for publishing' })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[api/autocliper/approve]', errorMsg)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
