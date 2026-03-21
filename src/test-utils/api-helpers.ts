/**
 * Shared test utilities for API route testing.
 *
 * Usage in test files:
 *
 *   import { makeRequest, chainMock, mockAuthenticatedSession } from '@/test-utils';
 *
 * NOTE: vi.hoisted() and vi.mock() calls cannot be extracted into a shared
 * utility because Vitest hoists them to the top of the *importing* file.
 * Each test file must still declare its own vi.mock() blocks. These helpers
 * reduce the boilerplate *inside* tests (request building, chain construction,
 * session data factories).
 */

import { NextRequest } from 'next/server';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Request builders
// ---------------------------------------------------------------------------

/**
 * Build a NextRequest suitable for testing route handlers.
 *
 * @param path  - URL path, e.g. '/api/proposals'
 * @param options - Standard RequestInit (method, body, headers, etc.)
 */
export function makeRequest(path: string, options?: RequestInit): NextRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(new URL(path, 'http://localhost:3000'), options as any);
}

/**
 * Build a GET NextRequest with search params.
 *
 * @param path   - URL path, e.g. '/api/proposals/comment'
 * @param params - Key-value search params
 */
export function makeGetRequest(
  path: string,
  params?: Record<string, string>,
): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

/**
 * Build a POST NextRequest with a JSON body.
 *
 * @param path - URL path, e.g. '/api/proposals/vote'
 * @param body - Object to be JSON-stringified as the request body
 */
export function makePostRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost:3000'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Supabase chain mock
// ---------------------------------------------------------------------------

export interface ChainMockResult {
  data?: unknown;
  error?: unknown;
  count?: number;
}

export interface ChainMock {
  /** The chain object — pass to mockFrom.mockReturnValue(chain) */
  chain: Record<string, ReturnType<typeof vi.fn>>;
  /**
   * A function that returns the chain.
   * Useful for mockFrom.mockImplementation(handler).
   */
  handler: () => Record<string, ReturnType<typeof vi.fn>>;
}

/**
 * Build a Supabase query-chain mock that resolves to `result`.
 *
 * Every chained method (.select, .eq, .order, etc.) returns the chain itself.
 * Terminal methods (.single) resolve to the provided result.
 * The chain also implements `.then` so it resolves when awaited directly.
 *
 * @param result - The { data, error, count } the chain resolves to
 */
export function chainMock(result: ChainMockResult): ChainMock {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const handler = () => chain;

  // Chainable methods — each returns the chain for further chaining
  const chainable = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'order',
    'range',
    'limit',
    'maybeSingle',
  ];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal — resolves the query
  chain.single = vi.fn().mockResolvedValue(result);

  // Allow the chain to be awaited directly (for queries without .single())
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));

  return { chain, handler };
}

// ---------------------------------------------------------------------------
// Session data factories
// ---------------------------------------------------------------------------

export interface SessionData {
  fid: number;
  username?: string;
  displayName?: string;
  isAdmin?: boolean;
  pfpUrl?: string;
  [key: string]: unknown;
}

/**
 * Return a default authenticated session, merged with any overrides.
 */
export function mockAuthenticatedSession(
  overrides?: Partial<SessionData>,
): SessionData {
  return {
    fid: 123,
    username: 'testuser',
    displayName: 'Test User',
    isAdmin: false,
    ...overrides,
  };
}

/**
 * Return null — representing no active session.
 */
export function mockUnauthenticatedSession(): null {
  return null;
}

/**
 * Return an admin session, merged with any overrides.
 */
export function mockAdminSession(
  overrides?: Partial<SessionData>,
): SessionData {
  return {
    fid: 123,
    username: 'admin',
    displayName: 'Admin User',
    isAdmin: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Common test constants
// ---------------------------------------------------------------------------

/** A valid UUID v4 for use in tests that require UUID parameters. */
export const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

/** A valid Ethereum address for use in tests that require wallet parameters. */
export const VALID_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

// ---------------------------------------------------------------------------
// Mock setup helpers
// ---------------------------------------------------------------------------

/**
 * Create the standard hoisted mocks for session + supabase.
 *
 * Call this inside vi.hoisted() at the top of your test file:
 *
 *   const { mockGetSessionData, mockFrom } = vi.hoisted(() => createHoistedMocks());
 *
 * Then wire them up with vi.mock():
 *
 *   vi.mock('@/lib/auth/session', () => ({
 *     getSessionData: () => mockGetSessionData(),
 *   }));
 *   vi.mock('@/lib/db/supabase', () => ({
 *     supabaseAdmin: { from: mockFrom },
 *   }));
 */
export function createHoistedMocks() {
  return {
    mockGetSessionData: vi.fn(),
    mockFrom: vi.fn(),
  };
}

/**
 * Create a mock for the notifications module.
 * Use with: vi.mock('@/lib/notifications', () => createNotificationsMock());
 */
export function createNotificationsMock() {
  return {
    createInAppNotification: vi.fn().mockResolvedValue(undefined),
    sendNotification: vi.fn().mockResolvedValue(undefined),
  };
}
