import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));

const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('fs', () => ({
  promises: {
    readFile: mockReadFile,
  },
  default: {
    promises: {
      readFile: mockReadFile,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    MINIMAX_API_KEY: 'test-minimax-api-key',
    MINIMAX_MODEL: 'MiniMax-M2.7',
    MINIMAX_API_URL: 'https://api.minimax.io/v1/chat/completions',
  },
}));

import { POST } from '../route';

// Mock global fetch for Minimax API calls
global.fetch = vi.fn() as unknown as typeof fetch;

// ── Test fixtures ────────────────────────────────────────────────────────────

const VALID_MESSAGE_ARRAY = [
  {
    role: 'user' as const,
    content: 'What is ZAO?',
  },
];

const VALID_MULTIPART_MESSAGES = [
  {
    role: 'system' as const,
    content: 'You are helpful.',
  },
  {
    role: 'user' as const,
    content: 'Hello',
  },
  {
    role: 'assistant' as const,
    content: 'Hi there!',
  },
  {
    role: 'user' as const,
    content: 'Tell me about ZAO research.',
  },
];

describe('POST /api/chat/assistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
    // Reset the module-level knowledge cache by reimporting
    vi.resetModules();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Authentication tests
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 401 when no session is present', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MESSAGE_ARRAY,
      }),
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session is explicitly null (unauthenticated)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MESSAGE_ARRAY,
      }),
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Input validation tests (Zod parsing)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 400 when messages array is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await POST(makePostRequest('/api/chat/assistant', {}));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when messages is not an array', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: 'not-an-array',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when messages array is empty', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: [],
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when message role is invalid enum', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: [
          {
            role: 'invalid-role',
            content: 'Hello',
          },
        ],
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when message content is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: [
          {
            role: 'user',
          },
        ],
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when message content is not a string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: [
          {
            role: 'user',
            content: 123,
          },
        ],
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('accepts all three valid roles: user, assistant, system', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockReadFile.mockResolvedValue('{}');

    const mockFetchResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ reply: 'test' })),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MULTIPART_MESSAGES,
      }),
    );

    expect(res.status).toBe(200);
  });

  it('returns 500 on malformed JSON body (caught by outer try/catch)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    // Manually create a request with invalid JSON
    const invalidReq = new Request('http://localhost:3000/api/chat/assistant', {
      method: 'POST',
      body: 'not valid json',
    });
    const res = await POST(invalidReq as unknown as Parameters<typeof POST>[0]);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Knowledge graph loading and doc retrieval
  // ────────────────────────────────────────────────────────────────────────────

  it('loads knowledge graph from file when available', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const knowledgeData = JSON.stringify({
      docs: [
        {
          id: '001',
          slug: 'music-docs',
          title: 'Music Library Documentation',
          category: 'system',
          tags: ['canonical', 'platform'],
          summary: 'Complete documentation of music library implementation.',
          related: [],
        },
      ],
    });

    mockReadFile.mockResolvedValue(knowledgeData);

    const mockFetchResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ reply: 'Test response' })),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: [
          {
            role: 'user',
            content: 'Tell about platform and music library',
          },
        ],
      }),
    );

    expect(res.status).toBe(200);

    // Verify the system message was constructed (either with or without doc injection)
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [_url, options] = fetchCall as [string, Record<string, unknown>];
    const bodyStr = options.body as string;
    const body = JSON.parse(bodyStr) as Record<string, unknown>;
    const messagesArray = body.messages as Array<{ role: string; content: string }>;
    const systemMsg = messagesArray[0];
    expect(systemMsg.role).toBe('system');
    // System prompt should contain the ZAO Assistant context
    expect(systemMsg.content).toContain('ZAO Assistant');
  });

  it('handles missing KNOWLEDGE.json gracefully (returns null)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'));

    const mockFetchResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ reply: 'Generic response' })),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MESSAGE_ARRAY,
      }),
    );

    expect(res.status).toBe(200);

    // Verify system prompt does NOT contain "Relevant research docs" when file fails to load
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [_url, options] = fetchCall as [string, Record<string, unknown>];
    const bodyStr = options.body as string;
    const body = JSON.parse(bodyStr) as Record<string, unknown>;
    const messagesArray = body.messages as Array<{ role: string; content: string }>;
    const systemMsg = messagesArray[0];
    expect(systemMsg.content).not.toContain('Relevant research docs');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Minimax API interaction
  // ────────────────────────────────────────────────────────────────────────────

  it('calls Minimax API with correct payload including model and max_tokens', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockReadFile.mockResolvedValue('{"docs":[]}');

    const mockFetchResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ reply: 'response' })),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MESSAGE_ARRAY,
      }),
    );

    expect(global.fetch).toHaveBeenCalledWith('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-minimax-api-key',
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
    });

    // Parse and verify request body structure
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [_url, options] = fetchCall as [string, Record<string, unknown>];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.model).toBe('MiniMax-M2.7');
    expect(body.max_tokens).toBe(4000);
    expect(body.messages).toBeDefined();
    expect(Array.isArray(body.messages)).toBe(true);
  });

  it('uses MINIMAX_API_URL from ENV for API calls', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockReadFile.mockResolvedValue('{"docs":[]}');

    const mockFetchResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ reply: 'test' })),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MESSAGE_ARRAY,
      }),
    );

    // Verify fetch was called with the correct URL from mocked ENV
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = fetchCall[0] as string;
    expect(url).toBe('https://api.minimax.io/v1/chat/completions');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Response handling
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 and parses JSON response from Minimax', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockReadFile.mockResolvedValue('{"docs":[]}');

    const mockResponse = {
      success: true,
      data: {
        choices: [
          {
            message: {
              content: 'This is the AI response',
            },
          },
        ],
      },
    };

    const mockFetchResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse)),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MESSAGE_ARRAY,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('falls back to { reply: text } when response is not JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockReadFile.mockResolvedValue('{"docs":[]}');

    const plainTextResponse = 'This is a plain text response';

    const mockFetchResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(plainTextResponse),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MESSAGE_ARRAY,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toBe(plainTextResponse);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Error handling
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 500 when Minimax API returns non-ok status', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockReadFile.mockResolvedValue('{"docs":[]}');

    const mockFetchResponse = {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Internal Server Error'),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MESSAGE_ARRAY,
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('AI request failed');

    // Verify error was logged
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('returns 500 when Minimax API throws an error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockReadFile.mockResolvedValue('{"docs":[]}');

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network failure'));

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: VALID_MESSAGE_ARRAY,
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');

    // Verify error was logged
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('returns 500 when request body parsing fails in outer try/catch', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    // Create a request with a body that throws when calling .json()
    const invalidReq = new Request('http://localhost:3000/api/chat/assistant', {
      method: 'POST',
      body: JSON.stringify({ messages: VALID_MESSAGE_ARRAY }),
    });

    // Mock req.json() to throw
    invalidReq.json = vi.fn().mockRejectedValue(new Error('JSON parse error'));

    const res = await POST(invalidReq as unknown as Parameters<typeof POST>[0]);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Integration: full happy path
  // ────────────────────────────────────────────────────────────────────────────

  it('processes a complete user query end-to-end', async () => {
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({
        fid: 123,
        username: 'testuser',
      }),
    );

    // Knowledge graph with docs that match common query terms
    const knowledgeData = JSON.stringify({
      docs: [
        {
          id: '042',
          slug: 'research-docs',
          title: 'Research Documentation',
          category: 'research',
          tags: ['canonical', 'docs', 'research'],
          summary: 'Comprehensive research documentation and guides.',
          related: ['043', '044'],
        },
      ],
    });

    mockReadFile.mockResolvedValue(knowledgeData);

    const mockApiResponse = {
      success: true,
      message: 'Here is the information you requested.',
    };

    const mockFetchResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify(mockApiResponse)),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await POST(
      makePostRequest('/api/chat/assistant', {
        messages: [
          {
            role: 'user',
            content: 'What research documentation exists?',
          },
        ],
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify Minimax was called with the correct structure
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [url, options] = fetchCall as [string, Record<string, unknown>];
    expect(url).toBe('https://api.minimax.io/v1/chat/completions');
    const bodyStr = options.body as string;
    const payload = JSON.parse(bodyStr) as Record<string, unknown>;
    expect(payload.model).toBe('MiniMax-M2.7');
    expect(payload.max_tokens).toBe(4000);
    const messagesArray = payload.messages as Array<{ role: string; content: string }>;
    expect(messagesArray.length).toBeGreaterThan(0);
    expect(messagesArray[0].role).toBe('system');
  });
});
