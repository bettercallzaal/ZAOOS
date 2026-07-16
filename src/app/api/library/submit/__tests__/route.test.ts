import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockModerate, mockSummary, mockIsUrl, mockExtractOG } =
  vi.hoisted(() => ({
    mockGetSessionData: vi.fn(),
    mockFrom: vi.fn(),
    mockModerate: vi.fn(),
    mockSummary: vi.fn(),
    mockIsUrl: vi.fn(),
    mockExtractOG: vi.fn(),
  }));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/library/minimax', () => ({
  generateResearchSummary: (c: string) => mockSummary(c),
}));

vi.mock('@/lib/library/og-extract', () => ({
  isUrl: (i: string) => mockIsUrl(i),
  extractOGMetadata: (u: string) => mockExtractOG(u),
}));

vi.mock('@/lib/moderation/moderate', () => ({
  moderateContent: (t: string) => mockModerate(t),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

/** FIFO chain: insert→select→single, then a follow-up update await. */
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['insert', 'update', 'select', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(q.shift()));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('POST /api/library/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockModerate.mockResolvedValue({ action: 'allow' });
    mockSummary.mockResolvedValue({ summary: 'AI summary text' });
    mockIsUrl.mockReturnValue(false);
    mockExtractOG.mockResolvedValue({ ogTitle: null, ogDescription: null, ogImage: null });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/library/submit', { input: 'AI music' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when the session has no fid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: undefined }));
    const res = await POST(makePostRequest('/api/library/submit', { input: 'AI music' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Farcaster account required to submit');
  });

  it('returns 400 for empty input', async () => {
    const res = await POST(makePostRequest('/api/library/submit', { input: '' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when more than 3 tags are supplied', async () => {
    const res = await POST(
      makePostRequest('/api/library/submit', {
        input: 'topic',
        tags: ['Music', 'Tech', 'AI', 'Business'],
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when moderation flags the content', async () => {
    mockModerate.mockResolvedValue({ action: 'hide' });
    const res = await POST(makePostRequest('/api/library/submit', { input: 'bad topic' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Content flagged by moderation');
  });

  it('submits a freeform topic and attaches the AI summary', async () => {
    const entry = { id: 'e1', topic: 'AI music', fid: 123 };
    mockFrom.mockReturnValue(queuedChain([{ data: entry, error: null }, {}]));
    const res = await POST(makePostRequest('/api/library/submit', { input: 'AI music' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.entry.ai_summary).toBe('AI summary text');
    expect(body.entry.ai_status).toBe('complete');
    // No OG extraction for a non-URL topic.
    expect(mockExtractOG).not.toHaveBeenCalled();
  });

  it('extracts OG metadata for a URL submission and uses the OG title as topic', async () => {
    mockIsUrl.mockReturnValue(true);
    mockExtractOG.mockResolvedValue({
      ogTitle: 'The Future of Onchain Music',
      ogDescription: 'A deep dive',
      ogImage: 'https://img/x.png',
    });
    const entry = { id: 'e2', topic: 'The Future of Onchain Music' };
    mockFrom.mockReturnValue(queuedChain([{ data: entry, error: null }, {}]));
    const res = await POST(
      makePostRequest('/api/library/submit', { input: 'https://example.com/post' }),
    );
    expect(res.status).toBe(200);
    expect(mockExtractOG).toHaveBeenCalledWith('https://example.com/post');
  });

  it('marks ai_status failed when the summary is null', async () => {
    mockSummary.mockResolvedValue({ summary: null, error: 'Minimax not configured' });
    mockFrom.mockReturnValue(queuedChain([{ data: { id: 'e3' }, error: null }, {}]));
    const res = await POST(makePostRequest('/api/library/submit', { input: 'AI music' }));
    const body = await res.json();
    expect(body.entry.ai_status).toBe('failed');
  });

  it('returns 500 when the insert errors', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('db down') }]));
    const res = await POST(makePostRequest('/api/library/submit', { input: 'AI music' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to submit entry');
  });
});
