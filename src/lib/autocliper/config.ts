/**
 * zaal-autocliper configuration
 */

export type Platform = 'warpcast' | 'x' | 'bluesky' | 'discord'

export const postizConfig = {
  apiKey: process.env.POSTIZ_API_KEY,
  baseUrl: process.env.POSTIZ_API_URL || 'https://api.postiz.com/public/v1',
  platforms: ['warpcast', 'x', 'bluesky', 'discord'] as Platform[],
  rateLimitPerHour: 90,
} as const

if (!postizConfig.apiKey && process.env.NODE_ENV === 'production') {
  console.warn(
    '[autocliper] POSTIZ_API_KEY not set. Clips will be staged as drafts but not published.',
  )
}

export const clipperConfig = {
  videoMaxSizeMB: 500,
  supportedFormats: ['mp4', 'mov', 'webm', 'mkv'] as const,
  transcriptionProvider: 'whisper',
  defaultAspectRatio: '9:16',
  ffmpegTimeout: 300_000,
  captionMaxChars: 300,
  captionMustMention: '/wavewarz',
  platforms: postizConfig.platforms,
  platformsCanOmit: true,
} as const
