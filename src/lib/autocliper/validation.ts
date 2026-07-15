/**
 * Input validation for autocliper
 */

import { z } from 'zod'

const VideoUrlSchema = z.string().url('Must be a valid URL')

export const ClipMetadataSchema = z.object({
  sourceUrl: VideoUrlSchema,
  sourceType: z.enum(['restream', 'stream', 'call', 'wavewarz', 'other']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  transcriptUrl: VideoUrlSchema.optional(),
})

export type ClipMetadataInput = z.infer<typeof ClipMetadataSchema>

export const ApprovalRequestSchema = z.object({
  clipId: z.string().uuid(),
  platforms: z.array(z.enum(['warpcast', 'x', 'bluesky', 'discord'])).optional(),
  approvedBy: z.string().optional(),
})

export type ApprovalRequestInput = z.infer<typeof ApprovalRequestSchema>

export const PublishRequestSchema = z.object({
  clipId: z.string().uuid(),
  generatedClipId: z.string().optional(),
  platforms: z.array(z.enum(['warpcast', 'x', 'bluesky', 'discord'])).optional(),
})

export type PublishRequestInput = z.infer<typeof PublishRequestSchema>

export function validateRequest<T>(
  schema: z.ZodSchema,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    return { success: false, error: errorMessages }
  }
  return { success: true, data: result.data as T }
}
