import { z } from 'zod';

// Loose schemas: V3 API is new (live 2026-05-01) and may evolve.
// Use `.passthrough()` so unknown fields do not break parsing.

export const empireSummarySchema = z
  .object({
    empire_address: z.string(),
    base_token: z.string().optional(),
    name: z.string().optional(),
    token_symbol: z.string().optional(),
    owner: z.string().optional(),
    rank: z.number().optional(),
    total_distributed: z.union([z.string(), z.number()]).optional(),
    total_burned: z.union([z.string(), z.number()]).optional(),
    native: z.string().optional(),
    farcaster_name: z.string().optional(),
    logo_uri: z.string().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();
export type EmpireSummary = z.infer<typeof empireSummarySchema>;

export const leaderboardSlotSchema = z
  .object({
    id: z.string(),
    empire_address: z.string().optional(),
    leaderboard_type: z.string().optional(),
    name: z.string().optional(),
    leaderboard_number: z.number().optional(),
  })
  .passthrough();
export type LeaderboardSlot = z.infer<typeof leaderboardSlotSchema>;

export const leaderboardEntrySchema = z
  .object({
    address: z.string(),
    rank: z.number(),
    score: z.number().optional(),
    points: z.number().optional(),
    farcaster_username: z.string().nullable().optional(),
    totalRewards: z.number().optional(),
  })
  .passthrough();
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export const leaderboardResponseSchema = z
  .object({
    success: z.boolean().optional(),
    leaderboard: leaderboardSlotSchema,
    entries: z.array(leaderboardEntrySchema),
  })
  .passthrough();
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;

export const boosterSchema = z
  .object({
    type: z.string(),
    contractAddress: z.string().optional(),
    multiplier: z.number().optional(),
    qualified: z.boolean().optional(),
    requirement: z
      .object({
        minAmount: z.union([z.string(), z.number()]).optional(),
      })
      .passthrough()
      .optional(),
    token_symbol: z.string().optional(),
    token_image_url: z.string().optional(),
    chainId: z.number().optional(),
  })
  .passthrough();
export type Booster = z.infer<typeof boosterSchema>;

export const addressStatsResponseSchema = z
  .object({
    success: z.boolean().optional(),
    entry: leaderboardEntrySchema,
    boosters: z.array(boosterSchema).optional(),
    leaderboard: leaderboardSlotSchema,
  })
  .passthrough();
export type AddressStatsResponse = z.infer<typeof addressStatsResponseSchema>;

export const rewardItemSchema = z
  .object({
    type: z.string().optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    amount_usd: z.union([z.string(), z.number()]).optional(),
    transaction_hash: z.string().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

export const rewardsSummaryResponseSchema = z
  .object({
    empire_rewards: z.array(rewardItemSchema).optional(),
    burned: z.array(rewardItemSchema).optional(),
    airdrops: z.array(rewardItemSchema).optional(),
  })
  .passthrough();
export type RewardsSummaryResponse = z.infer<typeof rewardsSummaryResponseSchema>;

export const rewardsByTypeResponseSchema = z
  .object({
    rewards: z.array(rewardItemSchema),
    count: z.number().optional(),
  })
  .passthrough();
export type RewardsByTypeResponse = z.infer<typeof rewardsByTypeResponseSchema>;

export const leaderboardListResponseSchema = z
  .object({
    leaderboards: z.array(leaderboardSlotSchema).optional(),
    success: z.boolean().optional(),
  })
  .passthrough();
export type LeaderboardListResponse = z.infer<typeof leaderboardListResponseSchema>;
