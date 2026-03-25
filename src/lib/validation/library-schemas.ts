import { z } from 'zod';

export const LIBRARY_TAGS = [
  'Music',
  'Governance',
  'Tech',
  'Community',
  'AI',
  'Business',
  'Culture',
  'Other',
] as const;

export type LibraryTag = (typeof LIBRARY_TAGS)[number];

export const librarySubmitSchema = z.object({
  input: z.string().trim().min(1, 'Please enter a URL or topic').max(2000),
  note: z.string().trim().max(1000).optional(),
  tags: z.array(z.enum(LIBRARY_TAGS)).max(3).optional(),
});

export const libraryVoteSchema = z.object({
  entry_id: z.string().uuid('entry_id must be a valid UUID'),
});

export const libraryCommentSchema = z.object({
  entry_id: z.string().uuid('entry_id must be a valid UUID'),
  body: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be 500 characters or less'),
});

export const libraryDeleteSchema = z.object({
  entry_id: z.string().uuid('entry_id must be a valid UUID'),
});
