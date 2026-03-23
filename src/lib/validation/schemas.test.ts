import { describe, it, expect } from 'vitest';
import {
  sendMessageSchema,
  proposalCategorySchema,
  createProposalSchema,
  proposalVoteSchema,
} from './schemas';

describe('sendMessageSchema', () => {
  it('accepts valid input', () => {
    const result = sendMessageSchema.safeParse({ text: 'Hello world' });
    expect(result.success).toBe(true);
  });

  it('rejects empty text', () => {
    const result = sendMessageSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
  });

  it('rejects text over 1024 characters', () => {
    const result = sendMessageSchema.safeParse({ text: 'a'.repeat(1025) });
    expect(result.success).toBe(false);
  });
});

describe('proposalCategorySchema', () => {
  it.each(['general', 'technical', 'community', 'governance', 'treasury', 'wavewarz', 'social'])(
    'accepts valid category: %s',
    (category) => {
      const result = proposalCategorySchema.safeParse(category);
      expect(result.success).toBe(true);
    },
  );

  it('rejects invalid category', () => {
    const result = proposalCategorySchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('createProposalSchema', () => {
  it('rejects closes_at in the past', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const result = createProposalSchema.safeParse({
      title: 'Test Proposal',
      description: 'A test proposal description',
      closes_at: pastDate,
    });
    expect(result.success).toBe(false);
  });
});

describe('proposalVoteSchema', () => {
  it.each(['for', 'against', 'abstain'])('accepts valid vote: %s', (vote) => {
    const result = proposalVoteSchema.safeParse({
      proposal_id: '550e8400-e29b-41d4-a716-446655440000',
      vote,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid vote value', () => {
    const result = proposalVoteSchema.safeParse({
      proposal_id: '550e8400-e29b-41d4-a716-446655440000',
      vote: 'maybe',
    });
    expect(result.success).toBe(false);
  });
});
