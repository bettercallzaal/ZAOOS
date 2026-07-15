/**
 * Clip draft management
 */

import { v4 as uuidv4 } from 'uuid'
import type { ClipMetadata, ClipStage } from './types'

const draftStore = new Map<string, ClipMetadata>()

export function createClipDraft(
  sourceUrl: string,
  sourceType: ClipMetadata['sourceType'],
  title: string,
  description: string,
): ClipMetadata {
  const clip: ClipMetadata = {
    id: uuidv4(),
    sourceUrl,
    sourceType,
    title,
    description,
    createdAt: new Date().toISOString(),
    stage: 'draft',
    stagedAt: new Date().toISOString(),
  }

  draftStore.set(clip.id, clip)
  return clip
}

export function getClipDraft(clipId: string): ClipMetadata | undefined {
  return draftStore.get(clipId)
}

export function listClipsByStage(stage: ClipStage): ClipMetadata[] {
  return Array.from(draftStore.values()).filter((clip) => clip.stage === stage)
}

export function updateClipDraft(
  clipId: string,
  updates: Partial<ClipMetadata>,
): ClipMetadata | undefined {
  const clip = draftStore.get(clipId)
  if (!clip) return undefined

  const updated = { ...clip, ...updates, id: clip.id }
  draftStore.set(clipId, updated)
  return updated
}

export function approveClipDraft(clipId: string): ClipMetadata | undefined {
  const clip = draftStore.get(clipId)
  if (!clip) return undefined

  const approved = {
    ...clip,
    stage: 'approved' as const,
    approvedAt: new Date().toISOString(),
  }

  draftStore.set(clipId, approved)
  return approved
}

export function rejectClipDraft(clipId: string): ClipMetadata | undefined {
  const clip = draftStore.get(clipId)
  if (!clip) return undefined

  const rejected = {
    ...clip,
    stage: 'rejected' as const,
    rejectedAt: new Date().toISOString(),
  }

  draftStore.set(clipId, rejected)
  return rejected
}

export function publishClipDraft(
  clipId: string,
  postizPostId: string,
): ClipMetadata | undefined {
  const clip = draftStore.get(clipId)
  if (!clip) return undefined

  const published = {
    ...clip,
    stage: 'published' as const,
    publishedAt: new Date().toISOString(),
    postizPostId,
  }

  draftStore.set(clipId, published)
  return published
}

export function getDraftStats(): {
  total: number
  byStage: Record<ClipStage, number>
} {
  const stats = {
    total: draftStore.size,
    byStage: {
      draft: 0,
      approved: 0,
      published: 0,
      rejected: 0,
    } as Record<ClipStage, number>,
  }

  draftStore.forEach((clip) => {
    stats.byStage[clip.stage]++
  })

  return stats
}

export function clearAllDrafts(): void {
  draftStore.clear()
}
