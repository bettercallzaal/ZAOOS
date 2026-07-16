/**
 * Postiz API client for clip distribution
 */

import { postizConfig } from './config'
import type { PostizPostRequest, PostizPostResponse } from './types'
import type { Platform } from './config'

/**
 * Post a clip to multiple platforms via Postiz API
 */
export async function postToPostiz(
  request: PostizPostRequest,
): Promise<PostizPostResponse> {
  if (!postizConfig.apiKey) {
    console.warn(
      '[autocliper/postiz] POSTIZ_API_KEY not set. Clip distribution stubbed.',
    )
    return {
      id: `stub-${Date.now()}`,
      scheduled: request.platforms.reduce(
        (acc, platform) => {
          acc[platform] = {
            platform,
            scheduledAt: new Date().toISOString(),
            status: 'scheduled',
          }
          return acc
        },
        {} as Record<Platform, any>,
      ),
    }
  }

  const url = `${postizConfig.baseUrl}/posts`

  const payload = {
    content: request.content,
    platforms: request.platforms,
    attachments: request.attachments || [],
    scheduledAt: request.scheduledAt || new Date().toISOString(),
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: postizConfig.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'zaal-autocliper/1.0.0',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Postiz API error: ${response.status} ${response.statusText}`,
      )
    }

    const data = (await response.json()) as PostizPostResponse
    return data
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('[autocliper/postiz] Failed:', errorMsg)
    throw new Error(`Failed to post to Postiz: ${errorMsg}`)
  }
}

export function validatePlatforms(platforms: Platform[]): boolean {
  return platforms.every((p) => postizConfig.platforms.includes(p))
}

export function buildCaption(
  title: string,
  description: string,
  maxChars: number = 300,
): string {
  const baseCaption = `${title}\n\n${description}`
  if (baseCaption.length <= maxChars) return baseCaption
  return baseCaption.substring(0, maxChars - 3) + '...'
}
