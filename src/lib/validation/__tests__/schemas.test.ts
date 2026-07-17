// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  allowlistEntrySchema,
  castHashSchema,
  castTextSchema,
  channelIdSchema,
  communityIssueSchema,
  createProposalSchema,
  csvRowSchema,
  hideMessageSchema,
  proposalCategorySchema,
  proposalCommentSchema,
  proposalVoteSchema,
  removeAllowlistSchema,
  sendMessageSchema,
} from '../schemas';

// ---------------------------------------------------------------------------
// castTextSchema
// ---------------------------------------------------------------------------
describe('castTextSchema', () => {
  it('accepts a valid string', () => {
    expect(castTextSchema.safeParse('hello').success).toBe(true);
  });

  it('rejects an empty string (min 1)', () => {
    expect(castTextSchema.safeParse('').success).toBe(false);
  });

  it('accepts a string of exactly 1024 characters (max boundary)', () => {
    expect(castTextSchema.safeParse('a'.repeat(1024)).success).toBe(true);
  });

  it('rejects a string of 1025 characters (exceeds max)', () => {
    expect(castTextSchema.safeParse('a'.repeat(1025)).success).toBe(false);
  });

  it('rejects a whitespace-only string (trim then min 1)', () => {
    expect(castTextSchema.safeParse('   ').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// channelIdSchema
// ---------------------------------------------------------------------------
describe('channelIdSchema', () => {
  it('accepts a simple lowercase word', () => {
    expect(channelIdSchema.safeParse('music').success).toBe(true);
  });

  it('accepts hyphenated lowercase channel id', () => {
    expect(channelIdSchema.safeParse('hip-hop').success).toBe(true);
  });

  it('rejects uppercase letters and spaces', () => {
    expect(channelIdSchema.safeParse('My Channel').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(channelIdSchema.safeParse('').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// castHashSchema
// ---------------------------------------------------------------------------
describe('castHashSchema', () => {
  it('accepts a valid 0x-prefixed 40-hex-char hash', () => {
    expect(castHashSchema.safeParse('0x' + 'a'.repeat(40)).success).toBe(true);
  });

  it('accepts a valid 0x-prefixed 64-hex-char hash', () => {
    expect(castHashSchema.safeParse('0x' + 'f'.repeat(64)).success).toBe(true);
  });

  it('accepts uppercase hex chars (case-insensitive)', () => {
    expect(castHashSchema.safeParse('0x' + 'ABCDEF1234'.repeat(4)).success).toBe(true);
  });

  it('rejects a hash without 0x prefix', () => {
    expect(castHashSchema.safeParse('a'.repeat(40)).success).toBe(false);
  });

  it('rejects a hash shorter than 40 hex chars', () => {
    expect(castHashSchema.safeParse('0x' + 'a'.repeat(39)).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sendMessageSchema
// ---------------------------------------------------------------------------
describe('sendMessageSchema', () => {
  it('accepts minimal valid input (just text)', () => {
    expect(sendMessageSchema.safeParse({ text: 'Hello world' }).success).toBe(true);
  });

  it('accepts text with a single valid embedUrl', () => {
    const result = sendMessageSchema.safeParse({
      text: 'Check this out',
      embedUrls: ['https://example.com/image.png'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects embedUrls array with more than 2 entries', () => {
    const result = sendMessageSchema.safeParse({
      text: 'Too many urls',
      embedUrls: [
        'https://example.com/1',
        'https://example.com/2',
        'https://example.com/3',
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects crossPostChannels array with more than 3 entries', () => {
    const result = sendMessageSchema.safeParse({
      text: 'Cross posting everywhere',
      crossPostChannels: ['music', 'art', 'tech', 'gaming'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid URL in embedUrls', () => {
    const result = sendMessageSchema.safeParse({
      text: 'Bad embed',
      embedUrls: ['not-a-url'],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hideMessageSchema
// ---------------------------------------------------------------------------
describe('hideMessageSchema', () => {
  const validHash = '0x' + 'a'.repeat(40);

  it('accepts a valid castHash', () => {
    expect(hideMessageSchema.safeParse({ castHash: validHash }).success).toBe(true);
  });

  it('accepts when reason is omitted (optional)', () => {
    expect(hideMessageSchema.safeParse({ castHash: validHash }).success).toBe(true);
  });

  it('rejects when reason exceeds 500 characters', () => {
    const result = hideMessageSchema.safeParse({
      castHash: validHash,
      reason: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// csvRowSchema
// ---------------------------------------------------------------------------
describe('csvRowSchema', () => {
  it('accepts a valid CSV row', () => {
    const result = csvRowSchema.safeParse({
      ign: 'PlayerOne',
      wallet_address: '0x' + 'a'.repeat(40),
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty ign', () => {
    const result = csvRowSchema.safeParse({
      ign: '',
      wallet_address: '0x' + 'a'.repeat(40),
    });
    expect(result.success).toBe(false);
  });

  it('rejects wallet_address without 0x prefix', () => {
    const result = csvRowSchema.safeParse({
      ign: 'PlayerOne',
      wallet_address: 'a'.repeat(40),
    });
    expect(result.success).toBe(false);
  });

  it('rejects wallet_address with wrong length', () => {
    const result = csvRowSchema.safeParse({
      ign: 'PlayerOne',
      wallet_address: '0x' + 'a'.repeat(39),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// communityIssueSchema
// ---------------------------------------------------------------------------
describe('communityIssueSchema', () => {
  const validIssue = {
    title: 'Something is broken',
    description: 'The login button does not work on mobile devices.',
    type: 'bug' as const,
    priority: 'high' as const,
  };

  it('accepts a fully valid issue', () => {
    expect(communityIssueSchema.safeParse(validIssue).success).toBe(true);
  });

  it('rejects a title under 5 characters', () => {
    const result = communityIssueSchema.safeParse({ ...validIssue, title: 'Bug' });
    expect(result.success).toBe(false);
  });

  it('rejects a description under 10 characters', () => {
    const result = communityIssueSchema.safeParse({ ...validIssue, description: 'Short' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid type enum value', () => {
    const result = communityIssueSchema.safeParse({ ...validIssue, type: 'complaint' });
    expect(result.success).toBe(false);
  });

  it('defaults priority to "medium" when omitted', () => {
    const { priority: _p, ...withoutPriority } = validIssue;
    const parsed = communityIssueSchema.parse(withoutPriority);
    expect(parsed.priority).toBe('medium');
  });

  it('accepts priority "high" explicitly', () => {
    const result = communityIssueSchema.safeParse({ ...validIssue, priority: 'high' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// allowlistEntrySchema
// ---------------------------------------------------------------------------
describe('allowlistEntrySchema', () => {
  it('passes the refine when only fid is provided', () => {
    expect(allowlistEntrySchema.safeParse({ fid: 12345 }).success).toBe(true);
  });

  it('passes the refine when only wallet_address is provided', () => {
    expect(
      allowlistEntrySchema.safeParse({ wallet_address: '0x' + 'a'.repeat(40) }).success,
    ).toBe(true);
  });

  it('fails the refine when neither fid nor wallet_address is provided', () => {
    expect(allowlistEntrySchema.safeParse({ real_name: 'Alice' }).success).toBe(false);
  });

  it('passes when both fid and wallet_address are provided', () => {
    const result = allowlistEntrySchema.safeParse({
      fid: 42,
      wallet_address: '0x' + 'b'.repeat(40),
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// removeAllowlistSchema
// ---------------------------------------------------------------------------
describe('removeAllowlistSchema', () => {
  it('accepts a valid UUID', () => {
    const result = removeAllowlistSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    const result = removeAllowlistSchema.safeParse({ id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects when id field is missing', () => {
    const result = removeAllowlistSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// proposalCategorySchema
// ---------------------------------------------------------------------------
describe('proposalCategorySchema', () => {
  it.each(['general', 'technical', 'community', 'governance', 'treasury', 'wavewarz', 'social'])(
    'accepts valid category: %s',
    (category) => {
      expect(proposalCategorySchema.safeParse(category).success).toBe(true);
    },
  );

  it('rejects an invalid category', () => {
    expect(proposalCategorySchema.safeParse('politics').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createProposalSchema
// ---------------------------------------------------------------------------
describe('createProposalSchema', () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString();

  it('accepts a minimal valid proposal', () => {
    const result = createProposalSchema.safeParse({
      title: 'Fund the hackathon',
      description: 'We need money for the event',
    });
    expect(result.success).toBe(true);
  });

  it('defaults category to "general" when omitted', () => {
    const parsed = createProposalSchema.parse({
      title: 'My proposal',
      description: 'Describing the proposal here',
    });
    expect(parsed.category).toBe('general');
  });

  it('accepts a valid future closes_at ISO date', () => {
    const result = createProposalSchema.safeParse({
      title: 'Timed proposal',
      description: 'Closes in the future',
      closes_at: futureDate,
    });
    expect(result.success).toBe(true);
  });

  it('rejects closes_at in the past', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const result = createProposalSchema.safeParse({
      title: 'Past proposal',
      description: 'Already closed',
      closes_at: pastDate,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty title', () => {
    const result = createProposalSchema.safeParse({
      title: '',
      description: 'Has description',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a title over 200 characters', () => {
    const result = createProposalSchema.safeParse({
      title: 'T'.repeat(201),
      description: 'Has description',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid publish_image_url', () => {
    const result = createProposalSchema.safeParse({
      title: 'Image proposal',
      description: 'Testing image url',
      publish_image_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// proposalCommentSchema
// ---------------------------------------------------------------------------
describe('proposalCommentSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts a valid comment', () => {
    const result = proposalCommentSchema.safeParse({
      proposal_id: validUuid,
      body: 'This is a great proposal!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty body', () => {
    const result = proposalCommentSchema.safeParse({
      proposal_id: validUuid,
      body: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a body over 2000 characters', () => {
    const result = proposalCommentSchema.safeParse({
      proposal_id: validUuid,
      body: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-UUID proposal_id', () => {
    const result = proposalCommentSchema.safeParse({
      proposal_id: 'bad-id',
      body: 'Valid body',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// proposalVoteSchema
// ---------------------------------------------------------------------------
describe('proposalVoteSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it.each(['for', 'against', 'abstain'])('accepts valid vote: %s', (vote) => {
    const result = proposalVoteSchema.safeParse({ proposal_id: validUuid, vote });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid vote value', () => {
    const result = proposalVoteSchema.safeParse({
      proposal_id: validUuid,
      vote: 'maybe',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-UUID proposal_id', () => {
    const result = proposalVoteSchema.safeParse({
      proposal_id: 'not-a-uuid',
      vote: 'for',
    });
    expect(result.success).toBe(false);
  });
});
