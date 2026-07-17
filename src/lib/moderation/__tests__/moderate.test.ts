// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { moderateContent } from '../moderate';

const TEST_KEY = 'test-perspective-key';

// ---------------------------------------------------------------------------
// Perspective API response builder
// ---------------------------------------------------------------------------

function makeScores(overrides: Partial<Record<string, number>> = {}): Record<string, number> {
  const defaults: Record<string, number> = {
    TOXICITY: 0.1,
    SEVERE_TOXICITY: 0.05,
    IDENTITY_ATTACK: 0.02,
    INSULT: 0.08,
    THREAT: 0.03,
  };
  return { ...defaults, ...overrides };
}

function mockPerspective(scores: Record<string, number>, status = 200) {
  const attributeScores: Record<string, { summaryScore: { value: number } }> = {};
  for (const [attr, value] of Object.entries(scores)) {
    attributeScores[attr] = { summaryScore: { value } };
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ attributeScores }),
      text: async () => JSON.stringify({ attributeScores }),
    })),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.PERSPECTIVE_API_KEY;
});
afterEach(() => vi.unstubAllGlobals());

// ---------------------------------------------------------------------------
// Passthrough (no API key or empty text)
// ---------------------------------------------------------------------------

describe('passthrough when disabled', () => {
  it('returns allow when PERSPECTIVE_API_KEY is not set', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const result = await moderateContent('some text');
    expect(result).toEqual({ flagged: false, categories: [], scores: {}, action: 'allow' });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('returns allow when text is empty string', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    vi.stubGlobal('fetch', vi.fn());
    const result = await moderateContent('');
    expect(result.action).toBe('allow');
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('returns allow when text is whitespace only', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    vi.stubGlobal('fetch', vi.fn());
    const result = await moderateContent('   \n\t  ');
    expect(result.action).toBe('allow');
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Fail-open behavior
// ---------------------------------------------------------------------------

describe('fail-open on API errors', () => {
  it('returns allow when Perspective API returns non-ok status', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective({}, 503);
    const result = await moderateContent('bad content');
    expect(result.action).toBe('allow');
    expect(result.flagged).toBe(false);
  });

  it('returns allow when fetch throws a network error', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED'); }));
    const result = await moderateContent('bad content');
    expect(result.action).toBe('allow');
    expect(result.flagged).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Clean content
// ---------------------------------------------------------------------------

describe('clean content', () => {
  it('returns action: allow when all scores are below flag threshold (0.8)', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores());
    const result = await moderateContent('hello world');
    expect(result.action).toBe('allow');
    expect(result.flagged).toBe(false);
    expect(result.categories).toHaveLength(0);
  });

  it('returns scores for all 5 ATTRIBUTES', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores());
    const result = await moderateContent('hello world');
    expect(Object.keys(result.scores)).toEqual(
      expect.arrayContaining(['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'THREAT']),
    );
  });
});

// ---------------------------------------------------------------------------
// Flagged content (action: flag)
// ---------------------------------------------------------------------------

describe('flagged content', () => {
  it('returns action: flag when TOXICITY > 0.8 and SEVERE_TOXICITY <= 0.9', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores({ TOXICITY: 0.85, SEVERE_TOXICITY: 0.5 }));
    const result = await moderateContent('offensive text');
    expect(result.action).toBe('flag');
    expect(result.flagged).toBe(true);
    expect(result.categories).toContain('TOXICITY');
  });

  it('includes all categories that cross the 0.8 threshold', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores({ TOXICITY: 0.9, INSULT: 0.85, SEVERE_TOXICITY: 0.5 }));
    const result = await moderateContent('hostile text');
    expect(result.categories).toContain('TOXICITY');
    expect(result.categories).toContain('INSULT');
    expect(result.categories).not.toContain('SEVERE_TOXICITY');
  });

  it('does not flag when score is exactly at threshold (0.8 is not > 0.8)', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores({ TOXICITY: 0.8 }));
    const result = await moderateContent('borderline text');
    expect(result.flagged).toBe(false);
    expect(result.action).toBe('allow');
  });
});

// ---------------------------------------------------------------------------
// Hidden content (action: hide)
// ---------------------------------------------------------------------------

describe('hidden content', () => {
  it('returns action: hide when SEVERE_TOXICITY > 0.9', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores({ SEVERE_TOXICITY: 0.95 }));
    const result = await moderateContent('very bad content');
    expect(result.action).toBe('hide');
  });

  it('hide takes precedence over flag', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores({ TOXICITY: 0.88, SEVERE_TOXICITY: 0.92 }));
    const result = await moderateContent('severely toxic text');
    expect(result.action).toBe('hide');
  });
});

// ---------------------------------------------------------------------------
// Score precision
// ---------------------------------------------------------------------------

describe('score precision', () => {
  it('rounds scores to 3 decimal places', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores({ TOXICITY: 0.123456789 }));
    const result = await moderateContent('some text');
    expect(result.scores.TOXICITY).toBe(0.123);
  });
});

// ---------------------------------------------------------------------------
// Request shape
// ---------------------------------------------------------------------------

describe('request shape', () => {
  it('includes API key in the URL', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores());
    await moderateContent('hello');
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`key=${TEST_KEY}`);
  });

  it('sends all 5 requestedAttributes in the request body', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores());
    await moderateContent('hello');
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(Object.keys(body.requestedAttributes)).toEqual(
      expect.arrayContaining(['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'THREAT']),
    );
  });

  it('slices text to 3000 chars in the request body', async () => {
    process.env.PERSPECTIVE_API_KEY = TEST_KEY;
    mockPerspective(makeScores());
    const longText = 'a'.repeat(5000);
    await moderateContent(longText);
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.comment.text).toHaveLength(3000);
  });
});
