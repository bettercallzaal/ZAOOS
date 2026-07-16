import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockLogger } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockLogger: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLogger,
  },
}));

import { POST } from '@/app/api/music/submissions/vote/route';

const SUBMISSION_ID = VALID_UUID;
const VOTER_FID = 123;

describe('POST /api/music/submissions/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makePostRequest('/api/music/submissions/vote', { submissionId: SUBMISSION_ID });

    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('400 on missing submissionId', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    const req = makePostRequest('/api/music/submissions/vote', {});

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('400 on invalid UUID format', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    const req = makePostRequest('/api/music/submissions/vote', { submissionId: 'not-a-uuid' });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('adds a vote when none exists (toggle on)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: VOTER_FID }));

    // Mock the chain sequence:
    // 1. maybeSingle() for existing vote check -> null (no existing vote)
    // 2. insert() for adding vote
    // 3. then for count() query
    const existingChain = chainMock({ data: null });
    const insertChain = chainMock({ data: {} });
    const countChain = chainMock({ data: null, count: 5 });

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table !== 'song_votes') {
        throw new Error(`Unexpected table: ${table}`);
      }

      callCount++;
      if (callCount === 1) {
        // First call: check existing vote
        return existingChain.chain;
      }
      if (callCount === 2) {
        // Second call: insert vote
        return insertChain.chain;
      }
      // Third call: get vote count
      return countChain.chain;
    });

    const req = makePostRequest('/api/music/submissions/vote', { submissionId: SUBMISSION_ID });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.voted).toBe(true);
    expect(body.voteCount).toBe(5);
  });

  it('removes a vote when one exists (toggle off)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: VOTER_FID }));

    // Mock the chain sequence:
    // 1. maybeSingle() for existing vote check -> found with id 'v1'
    // 2. delete() for removing vote
    // 3. then for count() query
    const existingChain = chainMock({ data: { id: 'v1' } });
    const deleteChain = chainMock({ data: {} });
    const countChain = chainMock({ data: null, count: 2 });

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table !== 'song_votes') {
        throw new Error(`Unexpected table: ${table}`);
      }

      callCount++;
      if (callCount === 1) {
        // First call: check existing vote
        return existingChain.chain;
      }
      if (callCount === 2) {
        // Second call: delete vote
        return deleteChain.chain;
      }
      // Third call: get vote count
      return countChain.chain;
    });

    const req = makePostRequest('/api/music/submissions/vote', { submissionId: SUBMISSION_ID });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.voted).toBe(false);
    expect(body.voteCount).toBe(2);
  });

  it('returns 0 vote count when count is null', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: VOTER_FID }));

    const existingChain = chainMock({ data: null });
    const insertChain = chainMock({ data: {} });
    const countChain = chainMock({ data: null, count: null });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) return existingChain.chain;
      if (callCount === 2) return insertChain.chain;
      return countChain.chain;
    });

    const req = makePostRequest('/api/music/submissions/vote', { submissionId: SUBMISSION_ID });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.voteCount).toBe(0);
  });

  it('500 on error checking existing vote', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: VOTER_FID }));

    const existingChain = chainMock({ error: new Error('DB connection failed') });
    mockFrom.mockReturnValue(existingChain.chain);

    const req = makePostRequest('/api/music/submissions/vote', { submissionId: SUBMISSION_ID });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to process vote');
    expect(mockLogger).toHaveBeenCalled();
  });

  it('500 on error inserting vote', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: VOTER_FID }));

    const existingChain = chainMock({ data: null });
    const insertChain = chainMock({ error: new Error('Insert failed') });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) return existingChain.chain;
      return insertChain.chain;
    });

    const req = makePostRequest('/api/music/submissions/vote', { submissionId: SUBMISSION_ID });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to process vote');
    expect(mockLogger).toHaveBeenCalled();
  });

  it('500 on error deleting vote', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: VOTER_FID }));

    const existingChain = chainMock({ data: { id: 'v1' } });
    const deleteChain = chainMock({ error: new Error('Delete failed') });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) return existingChain.chain;
      return deleteChain.chain;
    });

    const req = makePostRequest('/api/music/submissions/vote', { submissionId: SUBMISSION_ID });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to process vote');
    expect(mockLogger).toHaveBeenCalled();
  });

  it('500 on error fetching vote count', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: VOTER_FID }));

    const existingChain = chainMock({ data: null });
    const insertChain = chainMock({ data: {} });
    const countChain = chainMock({ error: new Error('Count query failed') });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) return existingChain.chain;
      if (callCount === 2) return insertChain.chain;
      return countChain.chain;
    });

    const req = makePostRequest('/api/music/submissions/vote', { submissionId: SUBMISSION_ID });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to process vote');
    expect(mockLogger).toHaveBeenCalled();
  });

  it('uses voter FID from session', async () => {
    const customFid = 999;
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: customFid }));

    const existingChain = chainMock({ data: null });
    const insertChain = chainMock({ data: {} });
    const countChain = chainMock({ data: null, count: 1 });

    const eqCalls: Array<[string, unknown]> = [];
    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) {
        existingChain.chain.eq = vi.fn((field: string, value: unknown) => {
          eqCalls.push([field, value]);
          return existingChain.chain;
        });
        return existingChain.chain;
      }
      if (callCount === 2) return insertChain.chain;
      return countChain.chain;
    });

    const req = makePostRequest('/api/music/submissions/vote', { submissionId: SUBMISSION_ID });
    const res = await POST(req);

    expect(res.status).toBe(200);
    // Verify that voter_fid was passed to eq() in the first check
    const voterFidCall = eqCalls.find(([field]) => field === 'voter_fid');
    expect(voterFidCall).toBeDefined();
    expect(voterFidCall?.[1]).toBe(customFid);
  });
});
