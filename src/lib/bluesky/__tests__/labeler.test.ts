// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import type { AtpAgent } from '@atproto/api';
import { applyMemberLabel, isMemberLabeled } from '../labeler';

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// isMemberLabeled — pure function
// ---------------------------------------------------------------------------

describe('isMemberLabeled', () => {
  it('returns true when the DID is in the member list', () => {
    expect(isMemberLabeled('did:plc:alice', ['did:plc:alice', 'did:plc:bob'])).toBe(true);
  });

  it('returns false when the DID is not in the member list', () => {
    expect(isMemberLabeled('did:plc:stranger', ['did:plc:alice', 'did:plc:bob'])).toBe(false);
  });

  it('returns false for an empty member list', () => {
    expect(isMemberLabeled('did:plc:alice', [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyMemberLabel — mocked AtpAgent
// ---------------------------------------------------------------------------

function makeAgent(createRecord: ReturnType<typeof vi.fn>): AtpAgent {
  return {
    session: { did: 'did:plc:community' },
    api: { com: { atproto: { repo: { createRecord } } } },
  } as unknown as AtpAgent;
}

describe('applyMemberLabel', () => {
  it('returns true when the API call succeeds', async () => {
    const createRecord = vi.fn().mockResolvedValue({});
    const agent = makeAgent(createRecord);
    const result = await applyMemberLabel(agent, 'did:plc:member1');
    expect(result).toBe(true);
    expect(createRecord).toHaveBeenCalledOnce();
  });

  it('returns false when the API call throws', async () => {
    const createRecord = vi.fn().mockRejectedValue(new Error('Unauthorized'));
    const agent = makeAgent(createRecord);
    const result = await applyMemberLabel(agent, 'did:plc:other');
    expect(result).toBe(false);
  });
});
