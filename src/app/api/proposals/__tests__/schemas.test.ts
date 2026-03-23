import { describe, it, expect } from 'vitest';
import {
  createProposalSchema,
  proposalVoteSchema,
  proposalCommentSchema,
  proposalCategorySchema,
} from '@/lib/validation/schemas';

describe('createProposalSchema', () => {
  it('accepts valid proposal with all fields', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const result = createProposalSchema.safeParse({
      title: 'Fund community event',
      description: 'We should fund a community event for ZAO members.',
      category: 'treasury',
      closes_at: future,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid proposal with only required fields', () => {
    const result = createProposalSchema.safeParse({
      title: 'Simple proposal',
      description: 'A basic description.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('general'); // default
    }
  });

  it('rejects empty title', () => {
    const result = createProposalSchema.safeParse({
      title: '',
      description: 'Valid description',
    });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only title', () => {
    const result = createProposalSchema.safeParse({
      title: '   ',
      description: 'Valid description',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title over 200 characters', () => {
    const result = createProposalSchema.safeParse({
      title: 'x'.repeat(201),
      description: 'Valid description',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = createProposalSchema.safeParse({
      title: 'Valid title',
      description: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description over 5000 characters', () => {
    const result = createProposalSchema.safeParse({
      title: 'Valid title',
      description: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = createProposalSchema.safeParse({
      title: 'Valid title',
      description: 'Valid description',
      category: 'invalid_category',
    });
    expect(result.success).toBe(false);
  });

  it('rejects closes_at in the past', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const result = createProposalSchema.safeParse({
      title: 'Valid title',
      description: 'Valid description',
      closes_at: past,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-ISO closes_at string', () => {
    const result = createProposalSchema.safeParse({
      title: 'Valid title',
      description: 'Valid description',
      closes_at: 'next-tuesday',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing title and description', () => {
    const result = createProposalSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('proposalVoteSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid "for" vote', () => {
    const result = proposalVoteSchema.safeParse({
      proposal_id: validUuid,
      vote: 'for',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid "against" vote', () => {
    const result = proposalVoteSchema.safeParse({
      proposal_id: validUuid,
      vote: 'against',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid "abstain" vote', () => {
    const result = proposalVoteSchema.safeParse({
      proposal_id: validUuid,
      vote: 'abstain',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid vote value', () => {
    const result = proposalVoteSchema.safeParse({
      proposal_id: validUuid,
      vote: 'maybe',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID proposal_id', () => {
    const result = proposalVoteSchema.safeParse({
      proposal_id: 'not-a-uuid',
      vote: 'for',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing proposal_id', () => {
    const result = proposalVoteSchema.safeParse({ vote: 'for' });
    expect(result.success).toBe(false);
  });

  it('rejects missing vote', () => {
    const result = proposalVoteSchema.safeParse({ proposal_id: validUuid });
    expect(result.success).toBe(false);
  });
});

describe('proposalCommentSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid comment', () => {
    const result = proposalCommentSchema.safeParse({
      proposal_id: validUuid,
      body: 'I support this proposal.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty body', () => {
    const result = proposalCommentSchema.safeParse({
      proposal_id: validUuid,
      body: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only body', () => {
    const result = proposalCommentSchema.safeParse({
      proposal_id: validUuid,
      body: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects body over 2000 characters', () => {
    const result = proposalCommentSchema.safeParse({
      proposal_id: validUuid,
      body: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID proposal_id', () => {
    const result = proposalCommentSchema.safeParse({
      proposal_id: 'bad-id',
      body: 'Valid body',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = proposalCommentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('proposalCategorySchema', () => {
  const validCategories = ['general', 'technical', 'community', 'governance', 'treasury', 'wavewarz', 'social'];

  it.each(validCategories)('accepts "%s"', (cat) => {
    const result = proposalCategorySchema.safeParse(cat);
    expect(result.success).toBe(true);
  });

  it('rejects unknown category', () => {
    const result = proposalCategorySchema.safeParse('art');
    expect(result.success).toBe(false);
  });

  it.each(['funding', 'music'])('rejects removed category: %s', (cat) => {
    const result = proposalCategorySchema.safeParse(cat);
    expect(result.success).toBe(false);
  });
});
