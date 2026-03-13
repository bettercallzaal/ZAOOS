import { z } from 'zod';

export const castTextSchema = z.string().min(1).max(1024);

export const channelIdSchema = z.string().regex(/^[a-z0-9-]+$/);

export const castHashSchema = z.string().regex(/^0x[a-f0-9]{40,64}$/i);

export const sendMessageSchema = z.object({
  text: castTextSchema,
  parentHash: castHashSchema.optional(),
  embedHash: castHashSchema.optional(), // for quote casts
  embedUrls: z.array(z.string().url()).max(2).optional(), // image/link embeds
  channel: channelIdSchema.optional(),
  crossPostChannels: z.array(channelIdSchema).max(3).optional(), // post to multiple channels
});

export const hideMessageSchema = z.object({
  castHash: castHashSchema,
  reason: z.string().max(500).optional(),
});

export const csvRowSchema = z.object({
  ign: z.string().min(1).max(100),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const allowlistEntrySchema = z.object({
  fid: z.number().int().positive().optional(),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  real_name: z.string().max(100).optional(),
  ign: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
}).refine(data => data.fid || data.wallet_address, {
  message: 'Either fid or wallet_address is required',
});

export const removeAllowlistSchema = z.object({
  id: z.string().uuid(),
});
