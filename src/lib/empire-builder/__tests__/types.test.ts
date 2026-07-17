// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  addressStatsResponseSchema,
  boosterSchema,
  empireSummarySchema,
  leaderboardEntrySchema,
  leaderboardListResponseSchema,
  leaderboardResponseSchema,
  leaderboardSlotSchema,
  rewardItemSchema,
  rewardsByTypeResponseSchema,
  rewardsSummaryResponseSchema,
} from '../types';

// ---------------------------------------------------------------------------
// empireSummarySchema
// ---------------------------------------------------------------------------

describe('empireSummarySchema', () => {
  it('parses with only required empire_address', () => {
    const result = empireSummarySchema.safeParse({ empire_address: '0xabc' });
    expect(result.success).toBe(true);
  });

  it('fails when empire_address is missing', () => {
    expect(empireSummarySchema.safeParse({}).success).toBe(false);
  });

  it('accepts total_distributed as a string or number', () => {
    expect(empireSummarySchema.safeParse({ empire_address: '0x1', total_distributed: '100' }).success).toBe(true);
    expect(empireSummarySchema.safeParse({ empire_address: '0x1', total_distributed: 100 }).success).toBe(true);
  });

  it('passthrough: preserves unknown fields', () => {
    const result = empireSummarySchema.safeParse({ empire_address: '0x1', extra_field: 'yes' });
    expect(result.success).toBe(true);
    if (result.success) expect((result.data as Record<string, unknown>).extra_field).toBe('yes');
  });
});

// ---------------------------------------------------------------------------
// leaderboardSlotSchema
// ---------------------------------------------------------------------------

describe('leaderboardSlotSchema', () => {
  it('parses with only required id', () => {
    expect(leaderboardSlotSchema.safeParse({ id: 'slot-1' }).success).toBe(true);
  });

  it('fails when id is missing', () => {
    expect(leaderboardSlotSchema.safeParse({ name: 'ZAO' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// leaderboardEntrySchema
// ---------------------------------------------------------------------------

describe('leaderboardEntrySchema', () => {
  it('parses with required address and rank', () => {
    expect(leaderboardEntrySchema.safeParse({ address: '0xabc', rank: 1 }).success).toBe(true);
  });

  it('fails when address is missing', () => {
    expect(leaderboardEntrySchema.safeParse({ rank: 1 }).success).toBe(false);
  });

  it('fails when rank is missing', () => {
    expect(leaderboardEntrySchema.safeParse({ address: '0xabc' }).success).toBe(false);
  });

  it('accepts null for farcaster_username', () => {
    expect(leaderboardEntrySchema.safeParse({ address: '0xabc', rank: 1, farcaster_username: null }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// leaderboardResponseSchema
// ---------------------------------------------------------------------------

describe('leaderboardResponseSchema', () => {
  const minLeaderboard = { id: 'lb-1' };
  const minEntries: unknown[] = [];

  it('parses with required leaderboard and entries', () => {
    expect(leaderboardResponseSchema.safeParse({
      leaderboard: minLeaderboard,
      entries: minEntries,
    }).success).toBe(true);
  });

  it('fails when leaderboard is missing', () => {
    expect(leaderboardResponseSchema.safeParse({ entries: [] }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// boosterSchema
// ---------------------------------------------------------------------------

describe('boosterSchema', () => {
  it('parses with only required type', () => {
    expect(boosterSchema.safeParse({ type: 'nft' }).success).toBe(true);
  });

  it('fails when type is missing', () => {
    expect(boosterSchema.safeParse({ multiplier: 2 }).success).toBe(false);
  });

  it('accepts nested requirement object with passthrough', () => {
    expect(boosterSchema.safeParse({ type: 'token', requirement: { minAmount: 100, extra: true } }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// addressStatsResponseSchema
// ---------------------------------------------------------------------------

describe('addressStatsResponseSchema', () => {
  const minEntry = { address: '0xabc', rank: 5 };
  const minLeaderboard = { id: 'lb-1' };

  it('parses with required entry and leaderboard', () => {
    expect(addressStatsResponseSchema.safeParse({
      entry: minEntry,
      leaderboard: minLeaderboard,
    }).success).toBe(true);
  });

  it('fails when entry is missing', () => {
    expect(addressStatsResponseSchema.safeParse({ leaderboard: minLeaderboard }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// rewardItemSchema — all fields optional
// ---------------------------------------------------------------------------

describe('rewardItemSchema', () => {
  it('parses an empty object (all fields optional)', () => {
    expect(rewardItemSchema.safeParse({}).success).toBe(true);
  });

  it('accepts amount as string or number', () => {
    expect(rewardItemSchema.safeParse({ amount: '1000' }).success).toBe(true);
    expect(rewardItemSchema.safeParse({ amount: 1000 }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rewardsSummaryResponseSchema — all optional
// ---------------------------------------------------------------------------

describe('rewardsSummaryResponseSchema', () => {
  it('parses an empty object', () => {
    expect(rewardsSummaryResponseSchema.safeParse({}).success).toBe(true);
  });

  it('parses with empire_rewards array', () => {
    expect(rewardsSummaryResponseSchema.safeParse({
      empire_rewards: [{ amount: '100' }],
    }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rewardsByTypeResponseSchema
// ---------------------------------------------------------------------------

describe('rewardsByTypeResponseSchema', () => {
  it('parses with required rewards array', () => {
    expect(rewardsByTypeResponseSchema.safeParse({ rewards: [] }).success).toBe(true);
  });

  it('fails when rewards is missing', () => {
    expect(rewardsByTypeResponseSchema.safeParse({ count: 5 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// leaderboardListResponseSchema — all optional
// ---------------------------------------------------------------------------

describe('leaderboardListResponseSchema', () => {
  it('parses an empty object', () => {
    expect(leaderboardListResponseSchema.safeParse({}).success).toBe(true);
  });

  it('parses with leaderboards array', () => {
    expect(leaderboardListResponseSchema.safeParse({
      leaderboards: [{ id: 'lb-1' }, { id: 'lb-2' }],
    }).success).toBe(true);
  });
});
