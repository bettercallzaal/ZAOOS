import { z } from 'zod';

export const ZABAL_MODES = ['music', 'governance', 'events', 'build'] as const;
export const zabalModeSchema = z.enum(ZABAL_MODES);

export const fidSchema = z.number().int().positive().lt(100_000_000);

export const zabalVoteSchema = z.object({
  fid: fidSchema,
  mode: zabalModeSchema,
});

export const zabalSpotlightNominateSchema = z.object({
  nominator_fid: fidSchema,
  nominee_fid: fidSchema,
  reason: z.string().trim().max(280).optional(),
}).refine((d) => d.nominator_fid !== d.nominee_fid, {
  message: 'Cannot nominate yourself',
  path: ['nominee_fid'],
});

export const zabalSpotlightVoteSchema = z.object({
  voter_fid: fidSchema,
  nominee_fid: fidSchema,
});
