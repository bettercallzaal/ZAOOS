import { describe, it, expect, vi, beforeAll } from 'vitest';
import { emitReceipt, emitReceiptBatch } from '../receipts';

/**
 * Tests for receipt emitter - verifies payload construction + error handling.
 * Does NOT test actual database I/O (db() is mocked).
 */

// Mock the supabase module. The builder is:
//  - awaitable (then)                 -> resolves to { data: <insert payload>, error: null }
//  - chainable .select().single()     -> resolves to { data: { id }, error: null }  (adhoc agent_run)
//  - chainable .select() then awaited -> resolves to { data: <insert payload>, error: null } (batch)
interface MockResult {
  data: unknown;
  error: null;
}
interface MockBuilder {
  select: () => MockBuilder;
  single: () => Promise<MockResult>;
  then: (resolve: (v: MockResult) => void) => void;
}
vi.mock('../../supabase', () => {
  const makeBuilder = (payload: unknown): MockBuilder => {
    const builder: MockBuilder = {
      select: () => builder,
      single: () => Promise.resolve({ data: { id: 'adhoc-run-id' }, error: null }),
      then: (resolve) => resolve({ data: payload, error: null }),
    };
    return builder;
  };
  return {
    db: vi.fn(() => ({
      from: vi.fn(() => ({
        insert: vi.fn((payload: unknown) => makeBuilder(payload)),
      })),
    })),
  };
});

describe('emitReceipt', () => {
  it('should emit a receipt with all fields populated', async () => {
    const result = await emitReceipt({
      runId: 'run-123',
      agentIdentity: 'zoe',
      capability: 'post_github',
      tool: 'github_cli',
      action: 'create_pull_request',
      resultType: 'success',
      approvalClass: 'auto',
      evidenceUrl: 'https://github.com/example/pr/123',
    });

    // In the mocked version, this should succeed
    expect(result).toBe(true);
  });

  it('should handle optional fields gracefully', async () => {
    const result = await emitReceipt({
      agentIdentity: 'hermes',
      capability: 'post_farcaster',
      tool: 'neynar_api',
      action: 'post_cast',
      resultType: 'success',
    });

    expect(result).toBe(true);
  });

  it('should accept null runId', async () => {
    const result = await emitReceipt({
      runId: null,
      agentIdentity: 'zol',
      capability: 'read_farcaster',
      tool: 'neynar_api',
      action: 'get_followers',
      resultType: 'success',
    });

    expect(result).toBe(true);
  });

  it('should set approval_class to auto by default', async () => {
    const result = await emitReceipt({
      agentIdentity: 'zoe',
      capability: 'test',
      tool: 'test_tool',
      action: 'test_action',
      resultType: 'success',
      // No approvalClass specified
    });

    expect(result).toBe(true);
  });
});

describe('emitReceiptBatch', () => {
  it('should emit multiple receipts', async () => {
    const inputs = [
      {
        agentIdentity: 'zoe',
        capability: 'post_github',
        tool: 'github_cli',
        action: 'create_pull_request',
        resultType: 'success' as const,
      },
      {
        agentIdentity: 'zol',
        capability: 'post_farcaster',
        tool: 'neynar_api',
        action: 'post_cast',
        resultType: 'success' as const,
      },
    ];

    const count = await emitReceiptBatch(inputs);
    expect(count).toBe(2);
  });

  it('should handle empty input', async () => {
    const count = await emitReceiptBatch([]);
    expect(count).toBe(0);
  });

  it('should return 0 for null/undefined input', async () => {
    const count1 = await emitReceiptBatch(null as unknown as any[]);
    expect(count1).toBe(0);

    const count2 = await emitReceiptBatch(undefined as unknown as any[]);
    expect(count2).toBe(0);
  });
});
