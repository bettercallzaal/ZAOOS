// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  LIBRARY_TAGS,
  libraryCommentSchema,
  libraryDeleteSchema,
  librarySubmitSchema,
  libraryVoteSchema,
} from '../library-schemas';

// ---------------------------------------------------------------------------
// LIBRARY_TAGS
// ---------------------------------------------------------------------------

describe('LIBRARY_TAGS', () => {
  it('has exactly 8 tags', () => {
    expect(LIBRARY_TAGS.length).toBe(8);
  });

  it('includes expected categories', () => {
    expect(LIBRARY_TAGS).toContain('Music');
    expect(LIBRARY_TAGS).toContain('Governance');
    expect(LIBRARY_TAGS).toContain('AI');
    expect(LIBRARY_TAGS).toContain('Other');
  });
});

// ---------------------------------------------------------------------------
// librarySubmitSchema
// ---------------------------------------------------------------------------

describe('librarySubmitSchema', () => {
  it('accepts a minimal valid submission (just input)', () => {
    expect(librarySubmitSchema.safeParse({ input: 'https://example.com' }).success).toBe(true);
  });

  it('accepts all optional fields', () => {
    expect(
      librarySubmitSchema.safeParse({
        input: 'some topic',
        note: 'interesting',
        tags: ['Music', 'AI'],
      }).success,
    ).toBe(true);
  });

  it('rejects empty input string', () => {
    expect(librarySubmitSchema.safeParse({ input: '' }).success).toBe(false);
  });

  it('rejects whitespace-only input (trim then min 1)', () => {
    expect(librarySubmitSchema.safeParse({ input: '   ' }).success).toBe(false);
  });

  it('rejects input over 2000 chars', () => {
    expect(librarySubmitSchema.safeParse({ input: 'a'.repeat(2001) }).success).toBe(false);
  });

  it('rejects note over 1000 chars', () => {
    expect(
      librarySubmitSchema.safeParse({ input: 'topic', note: 'n'.repeat(1001) }).success,
    ).toBe(false);
  });

  it('rejects tags array with more than 3 items', () => {
    expect(
      librarySubmitSchema.safeParse({
        input: 'topic',
        tags: ['Music', 'AI', 'Tech', 'Culture'],
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid tag value', () => {
    expect(
      librarySubmitSchema.safeParse({ input: 'topic', tags: ['InvalidTag' as never] }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// libraryVoteSchema
// ---------------------------------------------------------------------------

describe('libraryVoteSchema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts upvote', () => {
    expect(libraryVoteSchema.safeParse({ entry_id: uuid, vote_type: 'up' }).success).toBe(true);
  });

  it('accepts downvote', () => {
    expect(libraryVoteSchema.safeParse({ entry_id: uuid, vote_type: 'down' }).success).toBe(true);
  });

  it('rejects non-UUID entry_id', () => {
    expect(libraryVoteSchema.safeParse({ entry_id: 'not-a-uuid', vote_type: 'up' }).success).toBe(
      false,
    );
  });

  it('rejects invalid vote_type', () => {
    expect(
      libraryVoteSchema.safeParse({ entry_id: uuid, vote_type: 'neutral' as never }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// libraryCommentSchema
// ---------------------------------------------------------------------------

describe('libraryCommentSchema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts a valid comment', () => {
    expect(
      libraryCommentSchema.safeParse({ entry_id: uuid, body: 'Great resource!' }).success,
    ).toBe(true);
  });

  it('rejects empty body (min 1)', () => {
    expect(libraryCommentSchema.safeParse({ entry_id: uuid, body: '' }).success).toBe(false);
  });

  it('rejects whitespace-only body (trim then min 1)', () => {
    expect(libraryCommentSchema.safeParse({ entry_id: uuid, body: '   ' }).success).toBe(false);
  });

  it('rejects body over 500 chars', () => {
    expect(
      libraryCommentSchema.safeParse({ entry_id: uuid, body: 'b'.repeat(501) }).success,
    ).toBe(false);
  });

  it('accepts body of exactly 500 chars', () => {
    expect(
      libraryCommentSchema.safeParse({ entry_id: uuid, body: 'b'.repeat(500) }).success,
    ).toBe(true);
  });

  it('rejects non-UUID entry_id', () => {
    expect(
      libraryCommentSchema.safeParse({ entry_id: 'abc', body: 'Hello' }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// libraryDeleteSchema
// ---------------------------------------------------------------------------

describe('libraryDeleteSchema', () => {
  it('accepts a valid UUID', () => {
    expect(
      libraryDeleteSchema.safeParse({ entry_id: '550e8400-e29b-41d4-a716-446655440000' }).success,
    ).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    expect(libraryDeleteSchema.safeParse({ entry_id: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects missing entry_id', () => {
    expect(libraryDeleteSchema.safeParse({}).success).toBe(false);
  });
});
