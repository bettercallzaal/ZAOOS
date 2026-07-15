/**
 * zaal-autocliper type definitions
 */

import type { Platform } from './config'

/**
 * ClipStage represents the state of a clip in the autocliper pipeline
 */
export type ClipStage = 'draft' | 'approved' | 'published' | 'rejected'

export interface ClipMetadata {
  id: string
  sourceUrl: string
  sourceType: 'restream' | 'stream' | 'call' | 'wavewarz' | 'other'
  title: string
  description: string
  createdAt: string
  transcriptUrl?: string
  highlights?: HighlightWindow[]
  generatedClips?: GeneratedClip[]
  stage: ClipStage
  stagedAt: string
  approvedAt?: string
  publishedAt?: string
  rejectedAt?: string
  postizPostId?: string
  postizScheduledAt?: Record<Platform, string | null>
  postizError?: string
  tags?: string[]
  mentions?: string[]
  notes?: string
}

export interface TranscriptSegment {
  id: string
  start: number
  end: number
  text: string
  speaker?: string
  confidence?: number
}

export interface HighlightWindow {
  id: string
  startSecond: number
  endSecond: number
  durationSeconds: number
  score: number
  reason: string
  suggestedCaption?: string
}

export interface GeneratedClip {
  id: string
  filename: string
  path: string
  url: string
  startSecond: number
  endSecond: number
  durationSeconds: number
  aspectRatio: string
  filesize: number
  caption: string
  generatedAt: string
  ready: boolean
}

export interface PostizPostRequest {
  content: string
  platforms: Platform[]
  attachments?: PostizAttachment[]
  scheduledAt?: string
}

export interface PostizAttachment {
  type: 'image' | 'video' | 'link'
  url: string
  altText?: string
}

export interface PostizPostResponse {
  id: string
  scheduled: Record<Platform, ScheduledPost | null>
  error?: string
}

export interface ScheduledPost {
  platform: Platform
  scheduledAt: string
  status: 'scheduled' | 'posted' | 'failed'
}
