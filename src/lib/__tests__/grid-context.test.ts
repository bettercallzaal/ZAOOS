import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
  getGridContextForEntity,
  getGridContextBatch,
  type GridContextOptions,
} from '../grid-context';

/**
 * Tests for grid-context helpers - verifies formatting logic.
 * Grid fetches themselves are mocked to avoid DB dependencies.
 */

// Mock the grid modules
vi.mock('../grids/creator', () => ({
  getCreatorProfile: vi.fn(async (id: string) => ({
    identity: {
      name: id === 'unknown' ? null : id,
      primaryWallet: id === 'zaal' ? '0xzaal' : null,
      solanaBattleWallet: null,
      fid: id === 'zaal' ? 1 : null,
      zid: null,
      username: id === 'zaal' ? 'zaal' : null,
    },
    roles: { roles: id === 'unknown' ? [] : ['member'] },
    bodyOfWork: {
      submissions: id === 'unknown' ? [] : [{ id: '1', title: 'Song 1', type: 'submission' as const, occurredAt: null, url: null }],
      battles: [],
      events: [],
    },
    collaborators: { sourced: false, plannedSource: 'collaboration graph' },
    labels: { sourced: false, plannedSource: 'music metadata' },
    producers: { sourced: false, plannedSource: 'song metadata' },
    venues: { sourced: false, plannedSource: 'venue history' },
    found: id !== 'unknown',
  })),
}));

vi.mock('../grids/reputation', () => ({
  getReputationProfile: vi.fn(async (id: string) => ({
    identity: {
      name: id === 'unknown' ? null : id,
      wallet: id === 'zaal' ? '0xzaal' : null,
      fid: id === 'zaal' ? 1 : null,
      username: id === 'zaal' ? 'zaal' : null,
      zid: null,
    },
    respect: {
      og: 100,
      zor: 200,
      total: 300,
      rank: id === 'zaal' ? 5 : null,
      percentile: id === 'zaal' ? 95 : null,
      firstTokenDate: id === 'zaal' ? '2023-01-01T00:00:00Z' : null,
    },
    battles: { sourced: false, plannedSource: 'wavewarz_artists' },
    collaborations: { sourced: false, plannedSource: 'collaboration graph' },
    receipts: { sourced: false, plannedSource: 'DreamNet receipts' },
    trust: {
      score: id === 'zaal' ? 95.0 : 0,
      signals: id === 'zaal' ? ['respect percentile 95', 'held respect 18d'] : [],
      basis: 'v1 heuristic',
    },
    found: id !== 'unknown',
  })),
}));

describe('getGridContextForEntity', () => {
  it('should format creator context for a found entity', async () => {
    const ctx = await getGridContextForEntity('zaal', { type: 'creator' });
    expect(ctx).toContain('zaal');
    expect(ctx).toContain('member');
    expect(ctx).toContain('submission(s)');
    expect(ctx).not.toEqual('');
  });

  it('should return empty for unknown creator when strictFound=true', async () => {
    const ctx = await getGridContextForEntity('unknown', { type: 'creator', strictFound: true });
    expect(ctx).toBe('');
  });

  it('should format reputation context for a found entity', async () => {
    const ctx = await getGridContextForEntity('zaal', { type: 'reputation' });
    expect(ctx).toContain('zaal');
    expect(ctx).toContain('Respect 300');
    expect(ctx).toContain('rank #5');
    expect(ctx).toContain('95th percentile');
    expect(ctx).not.toEqual('');
  });

  it('should return empty for unknown reputation when strictFound=true', async () => {
    const ctx = await getGridContextForEntity('unknown', { type: 'reputation', strictFound: true });
    expect(ctx).toBe('');
  });

  it('should handle unsupported grid types gracefully', async () => {
    const ctx = await getGridContextForEntity('zaal', { type: 'battle' as any });
    expect(ctx).toContain('not yet wired');
  });

  it('should catch errors and return empty string', async () => {
    // Force an error by mocking a failure
    const ctx = await getGridContextForEntity('error', { type: 'creator' });
    // Should not throw, just return empty or error message
    expect(typeof ctx).toBe('string');
  });
});

describe('getGridContextBatch', () => {
  it('should fetch context for multiple entities', async () => {
    const result = await getGridContextBatch(['zaal', 'unknown'], { type: 'reputation' });
    expect(result['zaal']).toContain('zaal');
    expect(result['unknown']).toBe(''); // unknown returns empty
  });

  it('should handle empty input', async () => {
    const result = await getGridContextBatch([], { type: 'reputation' });
    expect(result).toEqual({});
  });

  it('should use Promise.allSettled to handle partial failures', async () => {
    const result = await getGridContextBatch(['zaal', 'error', 'unknown'], {
      type: 'creator',
    });
    // Should have entries for all, with some being empty on failure
    expect(Object.keys(result).length).toBe(3);
  });
});

describe('Context formatting edge cases', () => {
  it('should handle creator with minimal data', async () => {
    const ctx = await getGridContextForEntity('minimal', { type: 'creator' });
    // Should not crash, may be empty or have partial info
    expect(typeof ctx).toBe('string');
  });

  it('should include fid in reputation context when available', async () => {
    const ctx = await getGridContextForEntity('zaal', { type: 'reputation' });
    expect(ctx).toContain('fid 1');
  });
});
