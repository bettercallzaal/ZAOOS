/**
 * zaal-autocliper: Multi-platform clip distribution tool
 */

export { postizConfig, clipperConfig } from './config'
export type { Platform } from './config'

export type { ClipMetadata, ClipStage, TranscriptSegment, HighlightWindow, GeneratedClip, PostizPostRequest, PostizPostResponse } from './types'

export { postToPostiz, validatePlatforms, buildCaption } from './postiz-api'

export { createClipDraft, getClipDraft, listClipsByStage, updateClipDraft, approveClipDraft, rejectClipDraft, publishClipDraft, getDraftStats, clearAllDrafts } from './drafts'

export { ClipMetadataSchema, ApprovalRequestSchema, PublishRequestSchema, validateRequest } from './validation'
export type { ClipMetadataInput, ApprovalRequestInput, PublishRequestInput } from './validation'
