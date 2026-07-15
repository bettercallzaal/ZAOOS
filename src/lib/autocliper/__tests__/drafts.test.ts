/**
 * Tests for draft management
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createClipDraft,
  getClipDraft,
  listClipsByStage,
  updateClipDraft,
  approveClipDraft,
  rejectClipDraft,
  publishClipDraft,
  getDraftStats,
  clearAllDrafts,
} from '../drafts'

describe('Draft Management', () => {
  beforeEach(() => {
    clearAllDrafts()
  })

  it('should create a clip draft', () => {
    const clip = createClipDraft('https://example.com/video.mp4', 'wavewarz', 'Test Clip', 'Test')
    expect(clip.id).toBeDefined()
    expect(clip.stage).toBe('draft')
    expect(clip.title).toBe('Test Clip')
  })

  it('should retrieve a clip draft by ID', () => {
    const created = createClipDraft('https://example.com/video.mp4', 'wavewarz', 'Test', 'Test')
    const retrieved = getClipDraft(created.id)
    expect(retrieved?.id).toBe(created.id)
  })

  it('should approve a clip draft', () => {
    const clip = createClipDraft('https://example.com/video.mp4', 'wavewarz', 'Test', 'Test')
    const approved = approveClipDraft(clip.id)
    expect(approved?.stage).toBe('approved')
    expect(approved?.approvedAt).toBeDefined()
  })

  it('should publish a clip', () => {
    const clip = createClipDraft('https://example.com/video.mp4', 'wavewarz', 'Test', 'Test')
    approveClipDraft(clip.id)
    const published = publishClipDraft(clip.id, 'postiz-123')
    expect(published?.stage).toBe('published')
    expect(published?.postizPostId).toBe('postiz-123')
  })

  it('should list clips by stage', () => {
    const clip1 = createClipDraft('https://example.com/video1.mp4', 'wavewarz', 'Clip 1', 'Test')
    const clip2 = createClipDraft('https://example.com/video2.mp4', 'wavewarz', 'Clip 2', 'Test')
    approveClipDraft(clip2.id)

    const drafts = listClipsByStage('draft')
    const approved = listClipsByStage('approved')

    expect(drafts.length).toBe(1)
    expect(approved.length).toBe(1)
  })

  it('should provide statistics', () => {
    createClipDraft('https://example.com/video1.mp4', 'wavewarz', 'Clip 1', 'Test')
    const clip2 = createClipDraft('https://example.com/video2.mp4', 'wavewarz', 'Clip 2', 'Test')
    approveClipDraft(clip2.id)

    const stats = getDraftStats()
    expect(stats.total).toBe(2)
    expect(stats.byStage.draft).toBe(1)
    expect(stats.byStage.approved).toBe(1)
  })
})
