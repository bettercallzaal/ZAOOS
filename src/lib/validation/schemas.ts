import { z } from 'zod';

export const castTextSchema = z.string().trim().min(1).max(1024);

export const channelIdSchema = z.string().regex(/^[a-z0-9-]+$/);

export const castHashSchema = z.string().regex(/^0x[a-f0-9]{40,64}$/i);

export const sendMessageSchema = z.object({
  text: castTextSchema,
  parentHash: castHashSchema.optional(),
  embedHash: castHashSchema.optional(), // for quote casts
  embedFid: z.number().int().positive().optional(), // FID of quoted cast author
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
  display_name: z.string().max(100).optional(),
  pfp_url: z.string().url().optional(),
  username: z.string().max(100).optional(),
  custody_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  verified_addresses: z.array(z.string()).optional(),
  ens_name: z.string().max(200).optional(),
}).refine(data => data.fid || data.wallet_address, {
  message: 'Either fid or wallet_address is required',
});

export const removeAllowlistSchema = z.object({
  id: z.string().uuid(),
});

// --- Proposal schemas ---

export const proposalCategorySchema = z.enum([
  'general',
  'treasury',
  'governance',
  'technical',
  'community',
]);

export const createProposalSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().trim().min(1, 'Description is required').max(5000, 'Description must be 5000 characters or less'),
  category: proposalCategorySchema.optional().default('general'),
  closes_at: z
    .string()
    .datetime({ message: 'closes_at must be a valid ISO date string' })
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: 'closes_at must be in the future',
    })
    .optional(),
});

export const proposalCommentSchema = z.object({
  proposal_id: z.string().uuid('proposal_id must be a valid UUID'),
  body: z.string().trim().min(1, 'Comment body is required').max(2000, 'Comment must be 2000 characters or less'),
});

export const proposalVoteSchema = z.object({
  proposal_id: z.string().uuid('proposal_id must be a valid UUID'),
  vote: z.enum(['for', 'against', 'abstain'] as const, {
    message: 'Vote must be for, against, or abstain',
  }),
});
