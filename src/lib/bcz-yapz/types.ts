import { z } from 'zod'

function parseDate(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') {
    const s = String(value)
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }
  return null
}

export const EpisodeFrontmatterSchema = z.object({
  title: z.string(),
  show: z.literal('BCZ YapZ'),
  episode: z.number().int().positive().optional(),
  guest: z.string(),
  guest_alias: z.string().optional(),
  guest_org: z.string().optional(),
  guest_links: z.array(z.string()).optional().default([]),
  host: z.string(),
  date: z.unknown().transform(parseDate).optional(),
  published: z.string().optional(),
  duration_min: z.number().int().positive().optional(),
  format: z.string().optional(),
  language: z.string().optional(),
  topics: z.array(z.string()).optional().default([]),
  keywords: z.array(z.string()).optional().default([]),
  entities: z
    .object({
      orgs: z.array(z.string()).optional().default([]),
      people: z.array(z.string()).optional().default([]),
      projects: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({ orgs: [], people: [], projects: [] }),
  summary: z.string().optional().default(''),
  action_items: z.array(z.string()).optional().default([]),
  status: z
    .enum(['raw-undated', 'raw', 'cleaned', 'annotated'])
    .optional()
    .default('raw-undated'),
  youtube_url: z.string().url().optional(),
  youtube_video_id: z.string().optional(),
  thumbnail_override: z.string().nullable().optional(),
})

export type EpisodeFrontmatter = z.infer<typeof EpisodeFrontmatterSchema>

export interface Episode {
  slug: string
  frontmatter: EpisodeFrontmatter
  hasYoutube: boolean
  displayDate: string | null
  thumbnailUrl: string | null
}
