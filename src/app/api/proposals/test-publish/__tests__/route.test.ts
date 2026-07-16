import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockPostToBluesky } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockPostToBluesky: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/bluesky/client', () => ({
  postToBluesky: mockPostToBluesky,
}));

// Mock ENV module for dynamic import
vi.mock('@/lib/env', () => ({
  ENV: {
    ZAO_OFFICIAL_SIGNER_UUID: 'mock-signer-uuid',
    ZAO_OFFICIAL_FID: 12345,
  },
}));

// Mock process.env for Bluesky check
vi.stubGlobal('process', {
  ...process,
  env: {
    ...process.env,
    BLUESKY_HANDLE: 'test.bsky.social',
    BLUESKY_APP_PASSWORD: 'test-password',
  },
});

import { GET } from '../route';

/**
 * Build a Supabase chain mock that resolves to `result`.
 * Each chainable method returns the chain, terminal methods resolve.
 */
function makeChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainableMethods = ['select', 'update', 'eq', 'order', 'limit'];
  for (const m of chainableMethods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

/**
 * Build a queued "from" implementation that returns a new chain for each call,
 * drawing results sequentially from a queue.
 */
function queuedFromChain(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const queue = [...results];
  return () => {
    const result = queue.shift() || { data: null, error: new Error('Out of queued results') };
    return makeChain(result);
  };
}

describe('GET /api/proposals/test-publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockPostToBluesky.mockResolvedValue(null);
  });

  // ================================================================
  // Auth guard tests
  // ================================================================

  it('returns 403 when user is not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/proposals/test-publish'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin only');
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET(makeGetRequest('/api/proposals/test-publish'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin only');
  });

  // ================================================================
  // List mode (no proposalId param)
  // ================================================================

  it('lists all proposals when no proposalId is provided', async () => {
    const proposals = [
      {
        id: 'prop1',
        title: 'Proposal 1',
        status: 'active',
        publish_text: 'Text 1',
        published_cast_hash: null,
        respect_threshold: 1000,
      },
      {
        id: 'prop2',
        title: 'Proposal 2',
        status: 'active',
        publish_text: 'Text 2',
        published_cast_hash: 'hash2',
        respect_threshold: 1000,
      },
    ];
    mockFrom.mockReturnValue(makeChain({ data: proposals, error: null }));

    const res = await GET(makeGetRequest('/api/proposals/test-publish'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.proposals).toEqual(proposals);
    expect(body.error).toBeNull();
  });

  it('includes error in list response if query fails', async () => {
    const error = new Error('db connection failed');
    mockFrom.mockReturnValue(makeChain({ data: null, error }));

    const res = await GET(makeGetRequest('/api/proposals/test-publish'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toBeDefined();
  });

  // ================================================================
  // Proposal lookup with ID
  // ================================================================

  it('returns error when proposal is not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'nonexistent' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toBe('Proposal not found');
    expect(body.steps.proposal).toBeNull();
  });

  it('returns 200 with steps when proposal lookup errors', async () => {
    const error = new Error('proposal lookup failed');
    mockFrom.mockReturnValue(makeChain({ data: null, error }));

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-123' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    // When proposal is not found, error is at top level and steps contains the details
    expect(body.error).toBe('Proposal not found');
    expect(body.steps.proposalError).toBeDefined();
  });

  // ================================================================
  // Threshold check and action determination
  // ================================================================

  it('shows BELOW THRESHOLD when votes do not meet threshold', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes = [
      { vote: 'for', respect_weight: 300 },
      { vote: 'for', respect_weight: 200 },
      { vote: 'against', respect_weight: 500 },
    ];

    // First call: get proposal, Second call: get votes
    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalRespectFor).toBe(500);
    expect(body.threshold).toBe(1000);
    expect(body.thresholdMet).toBe(false);
    expect(body.action).toBe('BELOW THRESHOLD');
  });

  it('shows ALREADY PUBLISHED when proposal has published_cast_hash', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'published',
      publish_text: 'Test text',
      published_cast_hash: 'some-hash',
      respect_threshold: 1000,
    };
    const votes = [{ vote: 'for', respect_weight: 1200 }];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('ALREADY PUBLISHED');
    expect(body.alreadyPublished).toBe(true);
  });

  it('shows WOULD PUBLISH when threshold is met and not yet published', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes = [
      { vote: 'for', respect_weight: 600 },
      { vote: 'for', respect_weight: 500 },
    ];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    mockPostToBluesky.mockResolvedValue(null); // No Bluesky publish

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalRespectFor).toBe(1100);
    expect(body.thresholdMet).toBe(true);
    expect(body.action).toBe('WOULD PUBLISH');
  });

  // ================================================================
  // Publishing capability detection
  // ================================================================

  it('detects Farcaster publish readiness from ENV', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes: unknown[] = [];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.farcasterPublishReady).toBe(true);
  });

  it('detects Bluesky publish readiness from env vars', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes: unknown[] = [];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.blueskyPublishReady).toBe(true);
  });

  // ================================================================
  // Bluesky publish success
  // ================================================================

  it('successfully publishes to Bluesky when threshold met', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text for Bluesky',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes = [{ vote: 'for', respect_weight: 1200 }];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
        { data: null, error: null }, // update call
      ]),
    );

    const blueskyUri = 'at://did:plc:example/app.bsky.feed.post/abc123';
    mockPostToBluesky.mockResolvedValue(blueskyUri);

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('WOULD PUBLISH');
    expect(body.blueskySuccess).toBe(true);
    expect(body.blueskyResult).toBe(blueskyUri);
    expect(body.dbUpdate).toBe('Published!');

    // Verify postToBluesky was called with correct arguments
    expect(mockPostToBluesky).toHaveBeenCalledWith(
      'Test text for Bluesky\n\n— Approved by ZAO governance',
      'https://zaoos.com/governance',
    );
  });

  it('marks proposal as published with Bluesky URI after successful post', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes = [{ vote: 'for', respect_weight: 1200 }];

    const updateChain = makeChain({ data: null, error: null });
    const queue = [
      { data: proposal, error: null },
      { data: votes, error: null },
    ];
    let updateCalled = false;

    mockFrom.mockImplementation(() => {
      if (updateCalled) {
        return updateChain;
      }
      const result = queue.shift();
      if (!result) {
        updateCalled = true;
        return updateChain;
      }
      return makeChain(result);
    });

    const blueskyUri = 'at://did:plc:example/app.bsky.feed.post/xyz789';
    mockPostToBluesky.mockResolvedValue(blueskyUri);

    await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));

    // Verify update was called
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        published_cast_hash: 'bluesky-only',
        published_bluesky_uri: blueskyUri,
        status: 'published',
      }),
    );
  });

  it('uses publish_text if available, otherwise falls back to title', async () => {
    const proposalWithText = {
      id: 'prop-1',
      title: 'Proposal Title',
      status: 'active',
      publish_text: 'Custom publish text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes = [{ vote: 'for', respect_weight: 1200 }];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposalWithText, error: null },
        { data: votes, error: null },
        { data: null, error: null },
      ]),
    );

    mockPostToBluesky.mockResolvedValue('at://uri');

    await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));

    expect(mockPostToBluesky).toHaveBeenCalledWith(
      expect.stringContaining('Custom publish text'),
      expect.any(String),
    );
  });

  it('falls back to title when publish_text is null', async () => {
    const proposalNoText = {
      id: 'prop-1',
      title: 'Fallback Title',
      status: 'active',
      publish_text: null,
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes = [{ vote: 'for', respect_weight: 1200 }];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposalNoText, error: null },
        { data: votes, error: null },
        { data: null, error: null },
      ]),
    );

    mockPostToBluesky.mockResolvedValue('at://uri');

    await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));

    expect(mockPostToBluesky).toHaveBeenCalledWith(
      expect.stringContaining('Fallback Title'),
      expect.any(String),
    );
  });

  // ================================================================
  // Bluesky publish error handling
  // ================================================================

  it('captures Bluesky error and continues', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes = [{ vote: 'for', respect_weight: 1200 }];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    const bskyError = new Error('Rate limited');
    mockPostToBluesky.mockRejectedValue(bskyError);

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.blueskyError).toBe('Rate limited');
    // blueskySuccess is only set on success, not on error
    expect(body.blueskySuccess).toBeUndefined();
    // Should NOT have updated the database
    expect(body.dbUpdate).toBeUndefined();
  });

  it('handles non-Error Bluesky exceptions', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes = [{ vote: 'for', respect_weight: 1200 }];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    mockPostToBluesky.mockRejectedValue('string error');

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.blueskyError).toBe('string error');
    expect(body.blueskySuccess).toBeUndefined();
  });

  // ================================================================
  // Votes query error handling
  // ================================================================

  it('includes votes error in steps when votes query fails', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: null, error: new Error('votes query failed') },
      ]),
    );

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.votesError).toBeDefined();
    expect(body.votes).toBeNull();
  });

  // ================================================================
  // Respect weight calculations
  // ================================================================

  it('correctly sums respect_weight for votes with "for" vote', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 2000,
    };
    const votes = [
      { vote: 'for', respect_weight: 500 },
      { vote: 'for', respect_weight: 300 },
      { vote: 'against', respect_weight: 1000 },
      { vote: 'for', respect_weight: 200 },
    ];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalRespectFor).toBe(1000); // 500 + 300 + 200
  });

  it('handles null respect_weight by treating as 0', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes = [
      { vote: 'for', respect_weight: null },
      { vote: 'for', respect_weight: 500 },
    ];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalRespectFor).toBe(500);
  });

  it('uses default threshold of 1000 when respect_threshold is null', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: null,
    };
    const votes = [{ vote: 'for', respect_weight: 500 }];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.threshold).toBe(1000);
  });

  it('handles empty votes array', async () => {
    const proposal = {
      id: 'prop-1',
      title: 'Test Proposal',
      status: 'active',
      publish_text: 'Test text',
      published_cast_hash: null,
      respect_threshold: 1000,
    };
    const votes: unknown[] = [];

    mockFrom.mockImplementation(
      queuedFromChain([
        { data: proposal, error: null },
        { data: votes, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/proposals/test-publish', { id: 'prop-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalRespectFor).toBe(0);
    expect(body.thresholdMet).toBe(false);
  });
});
