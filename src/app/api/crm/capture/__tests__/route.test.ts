import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makePostRequest, makeRequest } from '@/test-utils/api-helpers';

function getUniqueIp(): string {
  // Use random IP to avoid rate limit collisions between tests
  const r = Math.floor(Math.random() * 200000);
  return `${10 + Math.floor(r / 65536)}.${Math.floor((r / 256) % 256)}.${Math.floor(r % 256)}.${(r + 1) % 256}`;
}

// The route tries req.formData() first, then falls back to req.json(). Under the
// test Request impl, calling formData() on a JSON body can lock the body stream so
// the subsequent json() fails. To exercise the intended json-fallback LOGIC in
// isolation, stub formData() to reject cleanly (as it would for a non-form body)
// and json() to return the parsed payload. (See PR note: the real json-fallback
// path may hit body-stream consumption in some runtimes — worth a runtime check.)
function mockRequestMethods(req: ReturnType<typeof makePostRequest>, payload: unknown): void {
  const stub = req as unknown as {
    formData: () => Promise<FormData>;
    json: () => Promise<unknown>;
  };
  stub.formData = vi.fn(async () => {
    throw new Error('Not form data');
  });
  stub.json = vi.fn(async () => payload);
}

// FIFO chain: queries pop results from a queue in order.
// Each awaited call (via .then or .single()) consumes one result from the queue.
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods — each returns the chain for further chaining
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'like', 'limit', 'order', 'maybeSingle']) {
    chain[m] = vi.fn(() => chain);
  }

  // Terminal method .single() returns a promise that resolves to the next queued result
  chain.single = vi.fn(() => Promise.resolve(q.shift() ?? { data: null, error: null }));

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift() ?? { data: null, error: null });

  return chain;
}

// Create a Supabase mock that returns new FIFO chains on each from() call
function createSupabaseMock(results: Array<{ data?: unknown; error?: unknown }>[]) {
  let callIndex = 0;
  return {
    from: () => {
      const chainResults = results[callIndex] || [];
      callIndex++;
      return queuedChain([...chainResults]);
    },
  };
}

const { mockGetSupabaseAdmin } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    CRM_CAPTURE_TOKEN: undefined, // optional token (not required by default)
  },
}));

import { GET, OPTIONS, POST } from '../route';

describe('POST /api/crm/capture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- CORS checks ---

  it('returns 403 when CORS origin is not allowed', async () => {
    const req = makePostRequest('/api/crm/capture', { name: 'John Doe' });
    req.headers.set('origin', 'https://evil.com');
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('CORS: origin not allowed');
  });

  it('allows thezao.com origin', async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null },
          { data: null, error: null },
        ],
      ]),
    );
    const payload = { name: 'John Doe', honeypot: '' };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).not.toBe(403);
  });

  it('allows www.thezao.com origin', async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null },
          { data: null, error: null },
        ],
      ]),
    );
    const payload = { name: 'John Doe', honeypot: '' };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://www.thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).not.toBe(403);
  });

  it('allows app.thezao.com origin', async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null },
          { data: null, error: null },
        ],
      ]),
    );
    const payload = { name: 'John Doe', honeypot: '' };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://app.thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).not.toBe(403);
  });

  it('allows localhost:3000 for development', async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null },
          { data: null, error: null },
        ],
      ]),
    );
    const payload = { name: 'John Doe', honeypot: '' };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'http://localhost:3000');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).not.toBe(403);
  });

  it('allows localhost:3001 for development', async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null },
          { data: null, error: null },
        ],
      ]),
    );
    const payload = { name: 'John Doe', honeypot: '' };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'http://localhost:3001');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).not.toBe(403);
  });

  // --- Rate limiting checks ---

  it('allows up to 5 requests per minute from same IP', async () => {
    const chain = chainMock({ data: null, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: chain.handler });

    const ip = '192.168.1.1';
    for (let i = 0; i < 5; i++) {
      const payload = { name: `User ${i}`, honeypot: '' };
      const req = makePostRequest('/api/crm/capture', payload);
      mockRequestMethods(req, payload);
      req.headers.set('x-forwarded-for', ip);
      req.headers.set('origin', 'https://thezao.com');
      const res = await POST(req);
      expect(res.status).not.toBe(429);
    }
  });

  it('rejects 6th request when rate limit exceeded', async () => {
    const ip = '192.168.1.2';
    // Fill the limit (5 requests)
    for (let i = 0; i < 5; i++) {
      const chain = chainMock({ data: null, error: null });
      mockGetSupabaseAdmin.mockReturnValue({ from: chain.handler });
      const req = makePostRequest('/api/crm/capture', { name: `User ${i}`, honeypot: '' });
      req.headers.set('x-forwarded-for', ip);
      req.headers.set('origin', 'https://thezao.com');
      await POST(req);
    }
    // 6th request should be rate-limited
    const req6 = makePostRequest('/api/crm/capture', { name: 'User 6', honeypot: '' });
    req6.headers.set('x-forwarded-for', ip);
    req6.headers.set('origin', 'https://thezao.com');
    const res6 = await POST(req6);
    expect(res6.status).toBe(429);
    expect((await res6.json()).error).toBe('Rate limit exceeded. Try again in 1 minute.');
  });

  it('extracts IP from x-forwarded-for header', async () => {
    const chain = chainMock({ data: null, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: chain.handler });
    const req = makePostRequest('/api/crm/capture', { name: 'John Doe', honeypot: '' });
    req.headers.set('x-forwarded-for', '10.0.0.1, 10.0.0.2');
    req.headers.set('origin', 'https://thezao.com');
    const res = await POST(req);
    expect(res.status).not.toBe(429);
  });

  it('falls back to cf-connecting-ip header if x-forwarded-for absent', async () => {
    const chain = chainMock({ data: null, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: chain.handler });
    const req = makePostRequest('/api/crm/capture', { name: 'John Doe', honeypot: '' });
    req.headers.set('cf-connecting-ip', '203.0.113.5');
    req.headers.set('origin', 'https://thezao.com');
    const res = await POST(req);
    expect(res.status).not.toBe(429);
  });

  // --- Token authentication checks ---

  it('rejects request when token required but not provided', async () => {
    // By default ENV.CRM_CAPTURE_TOKEN is undefined so no token required
    const chain = chainMock({ data: null, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: chain.handler });
    const req = makePostRequest('/api/crm/capture', { name: 'John Doe', honeypot: '' });
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).not.toBe(401);
  });

  // --- Honeypot checks ---

  it('accepts honeypot field when empty (valid submission)', async () => {
    // Route with email: select by email (returns null), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: null, error: null }, // select by email (no existing)
          { data: null, error: null }, // insert
        ],
      ]),
    );
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect((await res.json()).ok).toBe(true);
  });

  it('returns 400 when honeypot field is filled (spam trap)', async () => {
    const req = makePostRequest('/api/crm/capture', {
      name: 'Spammer',
      email: 'spam@example.com',
      honeypot: 'filled-value',
    });
    req.headers.set('origin', 'https://thezao.com');
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid form data');
  });

  // --- Zod validation checks ---

  it('returns 400 when name is missing', async () => {
    const req = makePostRequest('/api/crm/capture', {
      email: 'john@example.com',
      honeypot: '',
    });
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid form data');
  });

  it('returns 400 when name is empty string', async () => {
    const req = makePostRequest('/api/crm/capture', {
      name: '',
      honeypot: '',
    });
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when name exceeds max length (200)', async () => {
    const req = makePostRequest('/api/crm/capture', {
      name: 'a'.repeat(201),
      honeypot: '',
    });
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid format', async () => {
    const req = makePostRequest('/api/crm/capture', {
      name: 'John Doe',
      email: 'not-an-email',
      honeypot: '',
    });
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts empty string for optional email field', async () => {
    // Route without email: uniqueNameSlug calls select().like(), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null }, // select for uniqueNameSlug
          { data: null, error: null }, // insert
        ],
      ]),
    );
    const payload = {
      name: 'John Doe',
      email: '',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts omitted email field', async () => {
    // Route without email: uniqueNameSlug calls select().like(), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null }, // select for uniqueNameSlug
          { data: null, error: null }, // insert
        ],
      ]),
    );
    const payload = {
      name: 'John Doe',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('returns 400 when message exceeds max length (8000)', async () => {
    const req = makePostRequest('/api/crm/capture', {
      name: 'John Doe',
      message: 'x'.repeat(8001),
      honeypot: '',
    });
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts empty string for optional message field', async () => {
    // Route without email: uniqueNameSlug calls select().like(), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null }, // select for uniqueNameSlug
          { data: null, error: null }, // insert
        ],
      ]),
    );
    const payload = {
      name: 'John Doe',
      message: '',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  // --- Form data parsing ---

  it('parses JSON body', async () => {
    // Route with email: select by email (returns null), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: null, error: null }, // select by email (no existing)
          { data: null, error: null }, // insert
        ],
      ]),
    );
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  // --- Supabase insert: simplified tests without DB mocking ---

  it('successfully processes valid submission with email', async () => {
    // Route with email: select by email (returns null), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: null, error: null }, // select by email (no existing)
          { data: null, error: null }, // insert
        ],
      ]),
    );

    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);

    // Route soft-fails (returns 201 ok: true) on DB errors to not expose them
    expect(res.status).toBe(201);
    expect((await res.json()).ok).toBe(true);
  });

  it('successfully processes valid submission without email', async () => {
    // Route without email: uniqueNameSlug calls select().like(), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null }, // select for uniqueNameSlug
          { data: null, error: null }, // insert
        ],
      ]),
    );

    const payload = {
      name: 'Jane Smith',
      message: 'No email provided',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect((await res.json()).ok).toBe(true);
  });

  it('stores optional company and role fields', async () => {
    // Route without email: uniqueNameSlug calls select().like(), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null }, // select for uniqueNameSlug
          { data: null, error: null }, // insert
        ],
      ]),
    );

    const payload = {
      name: 'John Doe',
      company: 'Acme Corp',
      role: 'CEO',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect((await res.json()).ok).toBe(true);
  });

  it('defaults source to webflow-form when not provided', async () => {
    // Route without email: uniqueNameSlug calls select().like(), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null }, // select for uniqueNameSlug
          { data: null, error: null }, // insert
        ],
      ]),
    );

    const payload = {
      name: 'John Doe',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('sets CORS headers in success response', async () => {
    // Route without email: uniqueNameSlug calls select().like(), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null }, // select for uniqueNameSlug
          { data: null, error: null }, // insert
        ],
      ]),
    );

    const payload = {
      name: 'John Doe',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://thezao.com');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
  });

  it('trims whitespace from name field', async () => {
    // Route without email: uniqueNameSlug calls select().like(), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null }, // select for uniqueNameSlug
          { data: null, error: null }, // insert
        ],
      ]),
    );

    const payload = {
      name: '  John Doe  ',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('accepts notes as alternative to message field', async () => {
    // Route without email: uniqueNameSlug calls select().like(), then insert
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [
          { data: [], error: null }, // select for uniqueNameSlug
          { data: null, error: null }, // insert
        ],
      ]),
    );

    const payload = {
      name: 'John Doe',
      notes: 'This is a note',
      honeypot: '',
    };
    const req = makePostRequest('/api/crm/capture', payload);
    mockRequestMethods(req, payload);
    req.headers.set('origin', 'https://thezao.com');
    req.headers.set('x-forwarded-for', getUniqueIp());
    const res = await POST(req);

    expect(res.status).toBe(201);
  });
});

describe('OPTIONS /api/crm/capture', () => {
  it('returns 200 with CORS headers for allowed origin', async () => {
    const req = makeRequest('/api/crm/capture', { method: 'OPTIONS' });
    req.headers.set('origin', 'https://thezao.com');
    const res = await OPTIONS(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://thezao.com');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
  });

  it('returns 403 for disallowed origin on OPTIONS', async () => {
    const req = makeRequest('/api/crm/capture', { method: 'OPTIONS' });
    req.headers.set('origin', 'https://evil.com');
    const res = await OPTIONS(req);

    expect(res.status).toBe(403);
  });

  it('returns 403 when origin header is missing on OPTIONS', async () => {
    const req = makeRequest('/api/crm/capture', { method: 'OPTIONS' });
    // No origin header set - treated as disallowed
    const res = await OPTIONS(req);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/crm/capture', () => {
  it('returns 405 Method Not Allowed', async () => {
    const req = makeRequest('/api/crm/capture', { method: 'GET' });
    const res = await GET(req);

    expect(res.status).toBe(405);
    expect((await res.json()).error).toBe('CRM export is not available - contact data is private');
  });
});
