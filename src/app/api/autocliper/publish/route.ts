/**
 * POST /api/autocliper/publish
 * Publish an approved clip via Postiz
 */

import { NextResponse } from 'next/server'
import { getSessionData } from '@/lib/auth/session'
import { PublishRequestSchema, validateRequest, getClipDraft, publishClipDraft, postToPostiz, buildCaption, postizConfig } from '@/lib/autocliper'
import type { Platform } from '@/lib/autocliper'

export async function POST(request: Request) {
  try {
    const session = await getSessionData()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as unknown
    const validation = validateRequest<Record<string, unknown>>(PublishRequestSchema, body)

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    const data = validation.data as Record<string, unknown>
    const clipId = data.clipId as string
    const platformsParam = (data.platforms as unknown[]) || []
    
    const platforms: Platform[] = platformsParam && platformsParam.length > 0
      ? (platformsParam as Platform[])
      : ([...postizConfig.platforms] as Platform[])

    const clip = getClipDraft(clipId)
    if (!clip) {
      return NextResponse.json({ success: false, error: `Clip not found: ${clipId}` }, { status: 404 })
    }

    if (clip.stage !== 'approved') {
      return NextResponse.json({ success: false, error: `Clip must be approved (stage: ${clip.stage})` }, { status: 400 })
    }

    if (!clip.generatedClips || clip.generatedClips.length === 0) {
      return NextResponse.json({ success: false, error: 'No generated clips' }, { status: 400 })
    }

    const clipToPublish = clip.generatedClips.find((c) => c.ready)
    if (!clipToPublish) {
      return NextResponse.json({ success: false, error: 'No ready clip found' }, { status: 400 })
    }

    const caption = buildCaption(clip.title, clipToPublish.caption, 300)

    try {
      const postizResponse = await postToPostiz({
        content: caption,
        platforms,
        attachments: [{ type: 'video', url: clipToPublish.url, altText: clip.title }],
        scheduledAt: new Date().toISOString(),
      })

      const published = publishClipDraft(clipId, postizResponse.id)

      return NextResponse.json({
        success: true,
        clip: published,
        postizResponse,
        message: `Clip published to ${platforms.join(', ')}!`,
      })
    } catch (postizError: unknown) {
      const errorMsg = postizError instanceof Error ? postizError.message : 'Postiz error'
      return NextResponse.json({ success: false, error: errorMsg }, { status: 503 })
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[api/autocliper/publish]', errorMsg)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
