import { describe, expect, it } from 'vitest';
import {
  ApprovalRequestSchema,
  ClipMetadataSchema,
  PublishRequestSchema,
  validateRequest,
} from '../validation';

const VALID_CLIP: Parameters<typeof ClipMetadataSchema.safeParse>[0] = {
  sourceUrl: 'https://www.twitch.tv/bettercallzaal',
  sourceType: 'stream',
  title: 'WaveWarZ Takeover Highlights',
  description: 'Best moments from COC #7.',
};

// ---------------------------------------------------------------------------
// ClipMetadataSchema
// ---------------------------------------------------------------------------
describe('ClipMetadataSchema', () => {
  it('accepts a fully valid clip', () => {
    expect(ClipMetadataSchema.safeParse(VALID_CLIP).success).toBe(true);
  });

  it('accepts an optional transcriptUrl', () => {
    const result = ClipMetadataSchema.safeParse({
      ...VALID_CLIP,
      transcriptUrl: 'https://example.com/transcript.vtt',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL sourceUrl', () => {
    const result = ClipMetadataSchema.safeParse({ ...VALID_CLIP, sourceUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid sourceType', () => {
    const result = ClipMetadataSchema.safeParse({ ...VALID_CLIP, sourceType: 'livestream' });
    expect(result.success).toBe(false);
  });

  it('rejects a title over 200 characters', () => {
    const result = ClipMetadataSchema.safeParse({ ...VALID_CLIP, title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects an empty title', () => {
    const result = ClipMetadataSchema.safeParse({ ...VALID_CLIP, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a description over 1000 characters', () => {
    const result = ClipMetadataSchema.safeParse({ ...VALID_CLIP, description: 'x'.repeat(1001) });
    expect(result.success).toBe(false);
  });

  it('rejects a non-URL transcriptUrl when provided', () => {
    const result = ClipMetadataSchema.safeParse({ ...VALID_CLIP, transcriptUrl: 'bad-url' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid sourceType values', () => {
    const types = ['restream', 'stream', 'call', 'wavewarz', 'other'] as const;
    for (const sourceType of types) {
      expect(ClipMetadataSchema.safeParse({ ...VALID_CLIP, sourceType }).success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// ApprovalRequestSchema
// ---------------------------------------------------------------------------
describe('ApprovalRequestSchema', () => {
  const VALID_APPROVAL = { clipId: '550e8400-e29b-41d4-a716-446655440000' };

  it('accepts a minimal approval request', () => {
    expect(ApprovalRequestSchema.safeParse(VALID_APPROVAL).success).toBe(true);
  });

  it('rejects a non-UUID clipId', () => {
    const result = ApprovalRequestSchema.safeParse({ clipId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid platform', () => {
    const result = ApprovalRequestSchema.safeParse({
      ...VALID_APPROVAL,
      platforms: ['twitter'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid platforms', () => {
    const result = ApprovalRequestSchema.safeParse({
      ...VALID_APPROVAL,
      platforms: ['warpcast', 'x', 'bluesky', 'discord'],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PublishRequestSchema
// ---------------------------------------------------------------------------
describe('PublishRequestSchema', () => {
  it('accepts a minimal publish request', () => {
    expect(
      PublishRequestSchema.safeParse({ clipId: '550e8400-e29b-41d4-a716-446655440000' }).success,
    ).toBe(true);
  });

  it('rejects a non-UUID clipId', () => {
    const result = PublishRequestSchema.safeParse({ clipId: 'bad' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateRequest helper
// ---------------------------------------------------------------------------
describe('validateRequest', () => {
  it('returns success:true and parsed data on valid input', () => {
    const result = validateRequest<typeof VALID_CLIP>(ClipMetadataSchema, VALID_CLIP);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(VALID_CLIP.title);
    }
  });

  it('returns success:false with a human-readable error string on invalid input', () => {
    const result = validateRequest(ClipMetadataSchema, { sourceUrl: 'bad', sourceType: 'nope' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it('includes field paths in error messages', () => {
    const result = validateRequest(ClipMetadataSchema, { ...VALID_CLIP, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('title');
    }
  });

  it('joins multiple errors with semicolons', () => {
    const result = validateRequest(ClipMetadataSchema, {
      sourceUrl: 'bad',
      sourceType: 'invalid',
      title: '',
      description: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain(';');
    }
  });
});
