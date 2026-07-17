// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before any import of the module under test
// ---------------------------------------------------------------------------
const mockAgent = vi.hoisted(() => ({
  login: vi.fn().mockResolvedValue(undefined),
  post: vi.fn().mockResolvedValue({ uri: 'at://did:plc:abc/app.bsky.feed.post/rkey123', cid: 'cid123' }),
  uploadBlob: vi.fn().mockResolvedValue({ data: { blob: { ref: 'blob-ref' } } }),
}));
const MockAtpAgent = vi.hoisted(() => vi.fn(() => mockAgent));
const mockDetectFacets = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const MockRichText = vi.hoisted(() => vi.fn(() => ({
  detectFacets: mockDetectFacets,
  text: 'mocked text',
  facets: [],
})));

vi.mock('@atproto/api', () => ({
  AtpAgent: MockAtpAgent,
  RichText: MockRichText,
}));

// ---------------------------------------------------------------------------
// Dynamic import handles — reset per test to bust the module-level agentCache
// ---------------------------------------------------------------------------
let isBlueskyConfigured: () => boolean;
let publishToBluesky: (content: any) => Promise<any>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  process.env.BLUESKY_HANDLE = 'test.bsky.social';
  process.env.BLUESKY_APP_PASSWORD = 'test-password';
  const mod = await import('../bluesky');
  isBlueskyConfigured = mod.isBlueskyConfigured;
  publishToBluesky = mod.publishToBluesky;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BLUESKY_HANDLE;
  delete process.env.BLUESKY_APP_PASSWORD;
});

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------
function makeContent(overrides: Partial<{
  text: string;
  images: string[];
  embeds: string[];
  castHash: string;
  castUrl: string;
  attribution: string;
}> = {}) {
  return {
    text: 'Hello world',
    images: [],
    embeds: [],
    castHash: '0xabc',
    castUrl: 'https://warpcast.com/~/123',
    attribution: 'via ZAO OS',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isBlueskyConfigured (3 tests)
// ---------------------------------------------------------------------------
describe('isBlueskyConfigured', () => {
  it('returns true when both BLUESKY_HANDLE and BLUESKY_APP_PASSWORD are set', () => {
    expect(isBlueskyConfigured()).toBe(true);
  });

  it('returns false when BLUESKY_HANDLE is missing', () => {
    delete process.env.BLUESKY_HANDLE;
    expect(isBlueskyConfigured()).toBe(false);
  });

  it('returns false when BLUESKY_APP_PASSWORD is missing', () => {
    delete process.env.BLUESKY_APP_PASSWORD;
    expect(isBlueskyConfigured()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// publishToBluesky (7 tests)
// ---------------------------------------------------------------------------
describe('publishToBluesky', () => {
  it('calls agent.login with BLUESKY_HANDLE and BLUESKY_APP_PASSWORD', async () => {
    await publishToBluesky(makeContent());
    expect(mockAgent.login).toHaveBeenCalledWith({
      identifier: 'test.bsky.social',
      password: 'test-password',
    });
  });

  it('returns { uri, cid, postUrl } with postUrl containing handle and rkey from uri', async () => {
    const result = await publishToBluesky(makeContent());
    expect(result.uri).toBe('at://did:plc:abc/app.bsky.feed.post/rkey123');
    expect(result.cid).toBe('cid123');
    expect(result.postUrl).toBe('https://bsky.app/profile/test.bsky.social/post/rkey123');
  });

  it('fetches image URL, calls uploadBlob, and includes images embed when content.images is non-empty', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: { get: (h: string) => h === 'content-type' ? 'image/jpeg' : null },
    });

    const result = await publishToBluesky(makeContent({ images: ['https://example.com/img.jpg'] }));

    expect(fetch).toHaveBeenCalledWith('https://example.com/img.jpg', expect.objectContaining({ signal: expect.anything() }));
    expect(mockAgent.uploadBlob).toHaveBeenCalledTimes(1);

    const postCall = mockAgent.post.mock.calls[0][0];
    expect(postCall.embed).toMatchObject({ $type: 'app.bsky.embed.images' });
    expect(postCall.embed.images).toHaveLength(1);
    void result;
  });

  it('skips an image and does not call uploadBlob when image fetch returns non-ok', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      headers: { get: () => null },
    });

    await publishToBluesky(makeContent({ images: ['https://example.com/bad.jpg'] }));

    expect(mockAgent.uploadBlob).not.toHaveBeenCalled();
    const postCall = mockAgent.post.mock.calls[0][0];
    expect(postCall.embed).toBeUndefined();
  });

  it('uses external embed with first embed URL when no images but content.embeds is non-empty', async () => {
    await publishToBluesky(makeContent({ embeds: ['https://example.com/link'] }));

    const postCall = mockAgent.post.mock.calls[0][0];
    expect(postCall.embed).toMatchObject({
      $type: 'app.bsky.embed.external',
      external: { uri: 'https://example.com/link', title: '', description: '' },
    });
  });

  it('passes no embed to agent.post when neither images nor embeds are present', async () => {
    await publishToBluesky(makeContent());

    const postCall = mockAgent.post.mock.calls[0][0];
    expect(postCall.embed).toBeUndefined();
  });

  it('slices images to max 4 even when 5 are provided', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: { get: (h: string) => h === 'content-type' ? 'image/jpeg' : null },
    });

    const fiveImages = [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg',
      'https://example.com/img4.jpg',
      'https://example.com/img5.jpg',
    ];

    await publishToBluesky(makeContent({ images: fiveImages }));

    expect(mockAgent.uploadBlob).toHaveBeenCalledTimes(4);
    const postCall = mockAgent.post.mock.calls[0][0];
    expect(postCall.embed.images).toHaveLength(4);
  });
});
