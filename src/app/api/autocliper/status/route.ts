/**
 * GET /api/autocliper/status
 * Get autocliper system status
 */

import { NextResponse } from 'next/server'
import { postizConfig, clipperConfig, getDraftStats } from '@/lib/autocliper'

export async function GET() {
  try {
    const stats = getDraftStats()

    return NextResponse.json({
      success: true,
      status: {
        postizConfigured: !!postizConfig.apiKey,
        ffmpegAvailable: true,
        storageReady: true,
      },
      config: {
        platforms: clipperConfig.platforms,
        videoMaxSizeMB: clipperConfig.videoMaxSizeMB,
        captionMaxChars: clipperConfig.captionMaxChars,
        postizRateLimitPerHour: postizConfig.rateLimitPerHour,
      },
      stats,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[api/autocliper/status]', errorMsg)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
