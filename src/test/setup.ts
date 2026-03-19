/**
 * Shared test setup — reusable mock factories for ZAO OS API route tests.
 *
 * Usage: import { mockGetSessionData, mockFrom, chainMock, makeRequest }
 *        from '@/test/setup' in any route test file.
 */
import { vi } from 'vitest';
import { NextRequest } from 'next/server';

/* ------------------------------------------------------------------ */
/*  Hoisted mock fns — call vi.hoisted() in YOUR test file instead    */
/*  if you need per-file vi.mock() calls. These are convenience       */
/*  factories for the most common patterns.                           */
/* ------------------------------------------------------------------ */

/**
 * Build a Supabase query-chain mock that resolves to `result`.
 * Supports .select/.insert/.update/.upsert/.eq/.neq/.in/.not/.order/.range/.limit/.single
 */
export function chainMock(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.upsert = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.range = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

/**
 * Create a NextRequest for testing route handlers.
 */
export function makeRequest(url: string, options?: RequestInit) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any);
}
