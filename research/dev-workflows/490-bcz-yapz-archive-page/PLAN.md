# /bcz-yapz Archive Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public Next.js page at `/bcz-yapz` that lists all 17 BCZ YapZ episodes sourced from transcript frontmatter, with a list/thumbnail view toggle, and a reusable `getAllEpisodes()` util that also feeds the future BCZ 101 bot.

**Architecture:** Next.js 16 Server Component reads `content/transcripts/bcz-yapz/*.md` at build via `gray-matter`, validates with Zod, passes typed `Episode[]` to a Client Component that handles view toggle + `localStorage`. YouTube URLs populated via `scripts/sync-youtube-urls.ts` using `yt-dlp` (same tool used by PR #281 for dates).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, `gray-matter` (new dep), Zod (already in project), Vitest, `yt-dlp` CLI (already on Zaal's machine).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/app/bcz-yapz/page.tsx` | Server Component entry - calls `getAllEpisodes()`, renders `<HeroSection/><EpisodeList episodes/><FollowFooter/>`. Sets `revalidate = 3600`. |
| `src/app/bcz-yapz/layout.tsx` | Metadata - page title, description, OG tags. |
| `src/app/bcz-yapz/opengraph-image.tsx` | Generated 1200x630 OG card for social shares. |
| `src/app/bcz-yapz/_components/HeroSection.tsx` | Zones A + B: title, tagline, host line, primary CTA, about paragraph. Static copy from `config.ts`. |
| `src/app/bcz-yapz/_components/EpisodeList.tsx` | Client Component - view toggle (list/grid), `localStorage` persistence, renders array of card components. |
| `src/app/bcz-yapz/_components/EpisodeListCard.tsx` | List-view single-column card + expandable chapters block. |
| `src/app/bcz-yapz/_components/EpisodeGridCard.tsx` | Grid-view thumbnail card. |
| `src/app/bcz-yapz/_components/FollowFooter.tsx` | Zone D: subscribe + follow links. |
| `src/lib/bcz-yapz/types.ts` | `Episode` TypeScript interface + Zod schema for runtime parse validation. |
| `src/lib/bcz-yapz/episodes.ts` | `getAllEpisodes()` - reads `content/transcripts/bcz-yapz/*.md`, parses frontmatter, validates, sorts desc by `published`. |
| `src/lib/bcz-yapz/chapters.ts` | `parseChapters(slug)` - reads `content/youtube-descriptions/bcz-yapz/<slug>.md` if exists, extracts `CHAPTERS` block. Returns `null` when absent. |
| `src/lib/bcz-yapz/config.ts` | Exported const - page title, tagline, about paragraph, follow links. Editable without touching components. |
| `src/lib/bcz-yapz/__tests__/episodes.test.ts` | Unit tests for `getAllEpisodes()` - happy path, missing youtube_url, sort order, zod validation failure. |
| `src/lib/bcz-yapz/__tests__/chapters.test.ts` | Unit tests for `parseChapters()` - file exists, file absent, CHAPTERS block parsing. |
| `scripts/sync-youtube-urls.ts` | One-shot yt-dlp sync - matches videos to transcripts, writes `youtube_url` + `youtube_video_id`. |
| `scripts/set-youtube-url.ts` | Fallback CLI - manual `npx tsx scripts/set-youtube-url.ts <slug> <url>`. |
| `content/README.md` | Schema docs updated - new required fields. |
| `next.config.ts` | Add `img.youtube.com` to `images.remotePatterns`. |
| `package.json` | Add `gray-matter` dependency. |

---

## Task 1: Install gray-matter + configure next.config.ts

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Install gray-matter**

Run:
```bash
npm install gray-matter
```

Expected: `package.json` gets `"gray-matter": "^4.0.x"` in dependencies. `package-lock.json` updated.

- [ ] **Step 2: Add img.youtube.com to remotePatterns**

Open `next.config.ts`. Find the `remotePatterns` array (already exists per earlier check - includes `imagedelivery.net`, `wrpcd.net`, etc.).

Add this line inside the array:
```typescript
{ protocol: 'https', hostname: 'img.youtube.com' },
```

- [ ] **Step 3: Typecheck passes**

Run:
```bash
npm run typecheck
```
Expected: no errors. If errors, they're likely pre-existing and not from this change.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "build: add gray-matter + allow img.youtube.com thumbnails (doc 490)"
```

---

## Task 2: Define Episode types + Zod schema

**Files:**
- Create: `src/lib/bcz-yapz/types.ts`

- [ ] **Step 1: Write the types file**

Create `src/lib/bcz-yapz/types.ts`:

```typescript
import { z } from 'zod'

export const EpisodeFrontmatterSchema = z.object({
  title: z.string(),
  show: z.literal('BCZ YapZ'),
  episode: z.number().int().positive().optional(),
  guest: z.string(),
  guest_alias: z.string().optional(),
  guest_org: z.string(),
  guest_links: z.array(z.string()).optional().default([]),
  host: z.string(),
  date: z.union([z.string(), z.null()]).optional(),
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
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/bcz-yapz/types.ts
git commit -m "feat(bcz-yapz): episode types + zod schema (doc 490)"
```

---

## Task 3: TDD getAllEpisodes() - write failing test

**Files:**
- Create: `src/lib/bcz-yapz/__tests__/episodes.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `src/lib/bcz-yapz/__tests__/episodes.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getAllEpisodes } from '../episodes'
import type { Episode } from '../types'

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return { ...actual }
})

describe('getAllEpisodes', () => {
  it('returns episodes sorted by published date descending', async () => {
    const episodes = await getAllEpisodes()
    expect(Array.isArray(episodes)).toBe(true)
    expect(episodes.length).toBeGreaterThan(0)
    for (let i = 0; i + 1 < episodes.length; i++) {
      const a = episodes[i].displayDate
      const b = episodes[i + 1].displayDate
      if (a && b) {
        expect(a >= b).toBe(true)
      }
    }
  })

  it('each episode has a slug derived from filename', async () => {
    const episodes = await getAllEpisodes()
    for (const ep of episodes) {
      expect(ep.slug).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}-|^undated-/)
      expect(ep.slug).not.toMatch(/\.md$/)
    }
  })

  it('each episode exposes hasYoutube boolean derived from youtube_url', async () => {
    const episodes = await getAllEpisodes()
    for (const ep of episodes) {
      expect(typeof ep.hasYoutube).toBe('boolean')
      if (ep.frontmatter.youtube_url) {
        expect(ep.hasYoutube).toBe(true)
      } else {
        expect(ep.hasYoutube).toBe(false)
      }
    }
  })

  it('returns thumbnailUrl built from youtube_video_id when present', async () => {
    const episodes = await getAllEpisodes()
    for (const ep of episodes) {
      if (ep.frontmatter.youtube_video_id) {
        expect(ep.thumbnailUrl).toBe(
          `https://img.youtube.com/vi/${ep.frontmatter.youtube_video_id}/hqdefault.jpg`
        )
      } else {
        expect(ep.thumbnailUrl).toBeNull()
      }
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/bcz-yapz/__tests__/episodes.test.ts
```
Expected: FAIL with module-not-found error for `../episodes`.

- [ ] **Step 3: Commit failing test**

```bash
git add src/lib/bcz-yapz/__tests__/episodes.test.ts
git commit -m "test(bcz-yapz): failing tests for getAllEpisodes"
```

---

## Task 4: Implement getAllEpisodes()

**Files:**
- Create: `src/lib/bcz-yapz/episodes.ts`

- [ ] **Step 1: Write implementation**

Create `src/lib/bcz-yapz/episodes.ts`:

```typescript
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { EpisodeFrontmatterSchema, type Episode } from './types'

const TRANSCRIPTS_DIR = path.join(
  process.cwd(),
  'content/transcripts/bcz-yapz'
)

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '')
}

function buildThumbnailUrl(videoId: string | undefined): string | null {
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

function pickDisplayDate(
  published: string | undefined,
  date: string | null | undefined
): string | null {
  if (published) return published
  if (date) return date
  return null
}

export async function getAllEpisodes(): Promise<Episode[]> {
  if (!fs.existsSync(TRANSCRIPTS_DIR)) return []

  const filenames = fs
    .readdirSync(TRANSCRIPTS_DIR)
    .filter((name) => name.endsWith('.md'))

  const episodes: Episode[] = []

  for (const filename of filenames) {
    const filepath = path.join(TRANSCRIPTS_DIR, filename)
    const raw = fs.readFileSync(filepath, 'utf-8')
    const parsed = matter(raw)

    const result = EpisodeFrontmatterSchema.safeParse(parsed.data)
    if (!result.success) {
      console.warn(
        `[bcz-yapz] skipping ${filename}: frontmatter invalid`,
        result.error.flatten()
      )
      continue
    }

    const frontmatter = result.data
    const slug = slugFromFilename(filename)

    episodes.push({
      slug,
      frontmatter,
      hasYoutube: Boolean(frontmatter.youtube_url),
      displayDate: pickDisplayDate(frontmatter.published, frontmatter.date),
      thumbnailUrl: buildThumbnailUrl(frontmatter.youtube_video_id),
    })
  }

  episodes.sort((a, b) => {
    const aDate = a.displayDate ?? ''
    const bDate = b.displayDate ?? ''
    return bDate.localeCompare(aDate)
  })

  return episodes
}
```

- [ ] **Step 2: Run tests - expect pass**

Run:
```bash
npx vitest run src/lib/bcz-yapz/__tests__/episodes.test.ts
```
Expected: all 4 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/bcz-yapz/episodes.ts
git commit -m "feat(bcz-yapz): getAllEpisodes reads transcripts + parses frontmatter"
```

---

## Task 5: TDD parseChapters()

**Files:**
- Create: `src/lib/bcz-yapz/__tests__/chapters.test.ts`
- Create: `src/lib/bcz-yapz/chapters.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/bcz-yapz/__tests__/chapters.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseChapters } from '../chapters'

describe('parseChapters', () => {
  it('returns null when description file does not exist', async () => {
    const result = await parseChapters('nonexistent-slug')
    expect(result).toBeNull()
  })

  it('returns parsed chapters when description file exists', async () => {
    const result = await parseChapters('undated-deepa-grantorb')
    if (result === null) {
      return
    }
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThanOrEqual(3)
    expect(result[0]).toMatchObject({
      timestamp: expect.stringMatching(/^[0-9]+:[0-9]{2}$/),
      title: expect.any(String),
    })
    expect(result[0].timestamp).toBe('0:00')
  })
})
```

- [ ] **Step 2: Run test, expect fail**

Run:
```bash
npx vitest run src/lib/bcz-yapz/__tests__/chapters.test.ts
```
Expected: FAIL with module-not-found.

- [ ] **Step 3: Write implementation**

Create `src/lib/bcz-yapz/chapters.ts`:

```typescript
import fs from 'node:fs'
import path from 'node:path'

export interface Chapter {
  timestamp: string
  title: string
}

const DESCRIPTIONS_DIR = path.join(
  process.cwd(),
  'content/youtube-descriptions/bcz-yapz'
)

const CHAPTER_LINE = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(.+)$/

export async function parseChapters(slug: string): Promise<Chapter[] | null> {
  const filepath = path.join(DESCRIPTIONS_DIR, `${slug}.md`)
  if (!fs.existsSync(filepath)) return null

  const raw = fs.readFileSync(filepath, 'utf-8')
  const lines = raw.split('\n')

  let inChaptersBlock = false
  const chapters: Chapter[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === 'CHAPTERS') {
      inChaptersBlock = true
      continue
    }
    if (!inChaptersBlock) continue
    if (trimmed === '' || trimmed.startsWith('MENTIONED') || trimmed.startsWith('FOLLOW') || trimmed.startsWith('##')) {
      if (chapters.length > 0) break
      continue
    }
    const match = CHAPTER_LINE.exec(trimmed)
    if (match) {
      chapters.push({ timestamp: match[1], title: match[2].trim() })
    }
  }

  return chapters.length > 0 ? chapters : null
}
```

- [ ] **Step 4: Run test, expect pass**

Run:
```bash
npx vitest run src/lib/bcz-yapz/__tests__/chapters.test.ts
```
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bcz-yapz/chapters.ts src/lib/bcz-yapz/__tests__/chapters.test.ts
git commit -m "feat(bcz-yapz): parseChapters reads generated description CHAPTERS block"
```

---

## Task 6: Editable copy config

**Files:**
- Create: `src/lib/bcz-yapz/config.ts`

- [ ] **Step 1: Write config**

Create `src/lib/bcz-yapz/config.ts`:

```typescript
export const BCZ_YAPZ_PAGE = {
  title: 'BCZ YapZ',
  tagline:
    'Long-form conversations with web3 builders, music-first founders, and the coordination misfits The ZAO collects.',
  about:
    "BCZ YapZ is a long-form interview show hosted by Zaal. Each episode is a conversation with a builder, founder, or organizer working on something worth understanding - web3 music distribution, decentralized governance, AI tooling, coordination experiments, Maine community infrastructure, and more. Episodes run 25-30 minutes and drop Tuesdays. Transcripts are archived in the open so the full catalog stays searchable.",
  hostName: 'Zaal',
  hostFarcaster: 'https://farcaster.xyz/zaal',
  youtubeChannel: 'https://youtube.com/@bettercallzaal',
  fallbackPlaylistUrl: 'https://youtube.com/@bettercallzaal',
  follow: {
    farcaster: {
      handle: '@zaal',
      url: 'https://farcaster.xyz/zaal',
    },
    x: {
      handle: '@bettercallzaal',
      url: 'https://x.com/bettercallzaal',
    },
    youtube: {
      handle: '@bettercallzaal',
      url: 'https://youtube.com/@bettercallzaal',
    },
    zaoChannel: {
      handle: '/zao',
      url: 'https://farcaster.xyz/~/channel/zao',
    },
    zaoSite: {
      label: 'thezao.com',
      url: 'https://thezao.com',
    },
  },
} as const
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/bcz-yapz/config.ts
git commit -m "feat(bcz-yapz): editable page copy config"
```

---

## Task 7: HeroSection component

**Files:**
- Create: `src/app/bcz-yapz/_components/HeroSection.tsx`

- [ ] **Step 1: Write component**

Create `src/app/bcz-yapz/_components/HeroSection.tsx`:

```tsx
import Link from 'next/link'
import { BCZ_YAPZ_PAGE } from '@/lib/bcz-yapz/config'

export function HeroSection() {
  const { title, tagline, hostName, hostFarcaster, youtubeChannel, about } =
    BCZ_YAPZ_PAGE

  return (
    <section className="border-b border-white/10 bg-[#0a1628] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-[#f5a623] sm:text-5xl">
          {title}
        </h1>
        <p className="text-lg text-white/80 sm:text-xl">{tagline}</p>
        <p className="text-sm text-white/60">
          Hosted by{' '}
          <Link
            href={hostFarcaster}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f5a623] hover:underline"
          >
            {hostName}
          </Link>
        </p>
        <div>
          <Link
            href={youtubeChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-[#f5a623] px-5 py-2.5 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
          >
            Subscribe on YouTube
          </Link>
        </div>
        <div className="pt-6 text-sm leading-relaxed text-white/70">
          <p>{about}</p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/bcz-yapz/_components/HeroSection.tsx
git commit -m "feat(bcz-yapz): hero section (zones A + B)"
```

---

## Task 8: FollowFooter component

**Files:**
- Create: `src/app/bcz-yapz/_components/FollowFooter.tsx`

- [ ] **Step 1: Write component**

Create `src/app/bcz-yapz/_components/FollowFooter.tsx`:

```tsx
import Link from 'next/link'
import { BCZ_YAPZ_PAGE } from '@/lib/bcz-yapz/config'

export function FollowFooter() {
  const { follow, youtubeChannel } = BCZ_YAPZ_PAGE

  return (
    <section className="border-t border-white/10 bg-[#0a1628] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4 text-sm">
        <div>
          <Link
            href={youtubeChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-[#f5a623] px-4 py-2 font-semibold text-[#0a1628] transition hover:brightness-110"
          >
            Subscribe on YouTube
          </Link>
        </div>
        <ul className="space-y-1 text-white/70">
          <li>
            Follow Zaal on Farcaster:{' '}
            <Link
              href={follow.farcaster.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              {follow.farcaster.handle}
            </Link>
          </li>
          <li>
            Follow on X:{' '}
            <Link
              href={follow.x.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              {follow.x.handle}
            </Link>
          </li>
          <li>
            The ZAO channel:{' '}
            <Link
              href={follow.zaoChannel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              {follow.zaoChannel.handle}
            </Link>
          </li>
          <li>
            The ZAO site:{' '}
            <Link
              href={follow.zaoSite.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              {follow.zaoSite.label}
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/bcz-yapz/_components/FollowFooter.tsx
git commit -m "feat(bcz-yapz): follow footer (zone D)"
```

---

## Task 9: EpisodeListCard component

**Files:**
- Create: `src/app/bcz-yapz/_components/EpisodeListCard.tsx`

- [ ] **Step 1: Write component**

Create `src/app/bcz-yapz/_components/EpisodeListCard.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Episode } from '@/lib/bcz-yapz/types'
import type { Chapter } from '@/lib/bcz-yapz/chapters'

interface EpisodeListCardProps {
  episode: Episode
  displayIndex: number
  chapters: Chapter[] | null
}

export function EpisodeListCard({
  episode,
  displayIndex,
  chapters,
}: EpisodeListCardProps) {
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const { frontmatter, hasYoutube } = episode
  const epNumber = frontmatter.episode ?? displayIndex
  const topics = frontmatter.topics.slice(0, 3)

  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-4 text-white">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/60">
        <span className="font-semibold text-[#f5a623]">Ep {epNumber}</span>
        <span>·</span>
        <span>{episode.displayDate ?? 'TBD'}</span>
        {frontmatter.duration_min ? (
          <>
            <span>·</span>
            <span>{frontmatter.duration_min} min</span>
          </>
        ) : null}
      </div>
      <h2 className="mt-1 text-lg font-semibold">
        {frontmatter.guest}
        {frontmatter.guest_org ? (
          <span className="text-white/60"> · {frontmatter.guest_org}</span>
        ) : null}
      </h2>
      {frontmatter.summary ? (
        <p className="mt-2 text-sm text-white/80">{frontmatter.summary}</p>
      ) : null}
      {topics.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          {topics.map((topic) => (
            <li
              key={topic}
              className="rounded-full border border-white/10 px-2 py-0.5 text-white/60"
            >
              {topic.replace(/-/g, ' ')}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {hasYoutube && frontmatter.youtube_url ? (
          <Link
            href={frontmatter.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-[#f5a623] px-3 py-1.5 text-xs font-semibold text-[#0a1628] transition hover:brightness-110"
          >
            Watch on YouTube
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/40"
          >
            Not yet posted
          </button>
        )}
        {chapters && chapters.length > 0 ? (
          <button
            type="button"
            onClick={() => setChaptersOpen((v) => !v)}
            className="inline-flex items-center rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30"
          >
            {chaptersOpen ? 'Hide chapters' : `Chapters (${chapters.length})`}
          </button>
        ) : null}
      </div>
      {chapters && chaptersOpen ? (
        <ol className="mt-3 space-y-1 font-mono text-xs text-white/70">
          {chapters.map((chapter) => (
            <li key={`${chapter.timestamp}-${chapter.title}`}>
              <span className="text-[#f5a623]">{chapter.timestamp}</span>
              <span className="mx-2">-</span>
              <span>{chapter.title}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  )
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/bcz-yapz/_components/EpisodeListCard.tsx
git commit -m "feat(bcz-yapz): list-view episode card with expandable chapters"
```

---

## Task 10: EpisodeGridCard component

**Files:**
- Create: `src/app/bcz-yapz/_components/EpisodeGridCard.tsx`

- [ ] **Step 1: Write component**

Create `src/app/bcz-yapz/_components/EpisodeGridCard.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Episode } from '@/lib/bcz-yapz/types'

interface EpisodeGridCardProps {
  episode: Episode
  displayIndex: number
}

export function EpisodeGridCard({ episode, displayIndex }: EpisodeGridCardProps) {
  const { frontmatter, hasYoutube, thumbnailUrl } = episode
  const epNumber = frontmatter.episode ?? displayIndex

  const content = (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:border-white/30">
      <div className="relative aspect-video w-full bg-[#0a1628]">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={`${frontmatter.guest} - BCZ YapZ episode ${epNumber}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/40">
            No thumbnail
          </div>
        )}
      </div>
      <div className="p-3 text-white">
        <p className="text-sm font-semibold">
          {frontmatter.guest}{' '}
          <span className="text-white/60">· Ep {epNumber}</span>
        </p>
        <p className="mt-0.5 text-xs text-white/60">
          {episode.displayDate ?? 'TBD'}
          {frontmatter.duration_min ? ` · ${frontmatter.duration_min} min` : ''}
        </p>
      </div>
    </div>
  )

  if (hasYoutube && frontmatter.youtube_url) {
    return (
      <Link
        href={frontmatter.youtube_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </Link>
    )
  }

  return <div className="opacity-60">{content}</div>
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/bcz-yapz/_components/EpisodeGridCard.tsx
git commit -m "feat(bcz-yapz): thumbnail grid episode card"
```

---

## Task 11: EpisodeList client wrapper with toggle

**Files:**
- Create: `src/app/bcz-yapz/_components/EpisodeList.tsx`

- [ ] **Step 1: Write component**

Create `src/app/bcz-yapz/_components/EpisodeList.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { Episode } from '@/lib/bcz-yapz/types'
import type { Chapter } from '@/lib/bcz-yapz/chapters'
import { EpisodeListCard } from './EpisodeListCard'
import { EpisodeGridCard } from './EpisodeGridCard'

type View = 'list' | 'grid'

const STORAGE_KEY = 'bcz-yapz:view'

interface EpisodeListProps {
  episodes: Episode[]
  chaptersBySlug: Record<string, Chapter[] | null>
}

export function EpisodeList({ episodes, chaptersBySlug }: EpisodeListProps) {
  const [view, setView] = useState<View>('list')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'list' || stored === 'grid') setView(stored)
  }, [])

  useEffect(() => {
    if (!mounted) return
    window.localStorage.setItem(STORAGE_KEY, view)
  }, [view, mounted])

  return (
    <section className="bg-[#0a1628] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Episodes</h2>
          <div
            role="radiogroup"
            aria-label="View"
            className="inline-flex overflow-hidden rounded-md border border-white/10 text-xs"
          >
            <button
              type="button"
              role="radio"
              aria-checked={view === 'list'}
              onClick={() => setView('list')}
              className={`px-3 py-1.5 ${
                view === 'list'
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'bg-transparent text-white/70 hover:text-white'
              }`}
            >
              List
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={view === 'grid'}
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 ${
                view === 'grid'
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'bg-transparent text-white/70 hover:text-white'
              }`}
            >
              Thumbnails
            </button>
          </div>
        </div>
        {view === 'list' ? (
          <ul className="space-y-4">
            {episodes.map((episode, idx) => (
              <li key={episode.slug}>
                <EpisodeListCard
                  episode={episode}
                  displayIndex={episodes.length - idx}
                  chapters={chaptersBySlug[episode.slug] ?? null}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {episodes.map((episode, idx) => (
              <li key={episode.slug}>
                <EpisodeGridCard
                  episode={episode}
                  displayIndex={episodes.length - idx}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/bcz-yapz/_components/EpisodeList.tsx
git commit -m "feat(bcz-yapz): episode list client wrapper with view toggle"
```

---

## Task 12: page.tsx + layout.tsx

**Files:**
- Create: `src/app/bcz-yapz/page.tsx`
- Create: `src/app/bcz-yapz/layout.tsx`

- [ ] **Step 1: Write layout.tsx**

Create `src/app/bcz-yapz/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { BCZ_YAPZ_PAGE } from '@/lib/bcz-yapz/config'

export const metadata: Metadata = {
  title: `${BCZ_YAPZ_PAGE.title} - The ZAO`,
  description: BCZ_YAPZ_PAGE.tagline,
  openGraph: {
    title: `${BCZ_YAPZ_PAGE.title} - The ZAO`,
    description: BCZ_YAPZ_PAGE.tagline,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BCZ_YAPZ_PAGE.title} - The ZAO`,
    description: BCZ_YAPZ_PAGE.tagline,
  },
}

export default function BczYapzLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 2: Write page.tsx**

Create `src/app/bcz-yapz/page.tsx`:

```tsx
import { HeroSection } from './_components/HeroSection'
import { EpisodeList } from './_components/EpisodeList'
import { FollowFooter } from './_components/FollowFooter'
import { getAllEpisodes } from '@/lib/bcz-yapz/episodes'
import { parseChapters, type Chapter } from '@/lib/bcz-yapz/chapters'

export const revalidate = 3600

export default async function BczYapzPage() {
  const episodes = await getAllEpisodes()
  const chaptersBySlug: Record<string, Chapter[] | null> = {}
  for (const ep of episodes) {
    chaptersBySlug[ep.slug] = await parseChapters(ep.slug)
  }

  return (
    <main className="min-h-screen bg-[#0a1628]">
      <HeroSection />
      <EpisodeList episodes={episodes} chaptersBySlug={chaptersBySlug} />
      <FollowFooter />
    </main>
  )
}
```

- [ ] **Step 3: Typecheck + build**

Run:
```bash
npm run typecheck
```
Expected: no errors.

Run:
```bash
npm run build
```
Expected: build succeeds. `/bcz-yapz` listed in the route summary.

- [ ] **Step 4: Commit**

```bash
git add src/app/bcz-yapz/page.tsx src/app/bcz-yapz/layout.tsx
git commit -m "feat(bcz-yapz): page route + layout metadata"
```

---

## Task 13: YouTube URL sync script

**Files:**
- Create: `scripts/sync-youtube-urls.ts`

- [ ] **Step 1: Write script**

Create `scripts/sync-youtube-urls.ts`:

```typescript
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const CHANNEL_URL = 'https://www.youtube.com/@bettercallzaal'
const TRANSCRIPTS_DIR = path.join(
  process.cwd(),
  'content/transcripts/bcz-yapz'
)
const GAPS_LOG = path.join(
  process.cwd(),
  'scripts/sync-youtube-urls.gaps.log'
)

interface YtEntry {
  id: string
  title: string
  upload_date: string
}

function fetchYoutubeEntries(): YtEntry[] {
  console.log(`[yt-dlp] fetching video list from ${CHANNEL_URL}...`)
  const raw = execSync(`yt-dlp --flat-playlist -J "${CHANNEL_URL}"`, {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
  })
  const payload = JSON.parse(raw) as { entries?: YtEntry[] }
  const entries = payload.entries ?? []
  console.log(`[yt-dlp] got ${entries.length} video entries`)
  return entries
}

function isYapzVideo(entry: YtEntry): boolean {
  const t = entry.title.toLowerCase()
  return (
    t.startsWith('bcz yapz') ||
    t.startsWith('better call zaal yap') ||
    t.includes(' yapz ')
  )
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function matchEntry(
  entries: YtEntry[],
  guest: string,
  frontmatterDate: string | null
): YtEntry | null {
  const needle = normalize(guest)
  const candidates = entries.filter((e) => normalize(e.title).includes(needle))
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  if (!frontmatterDate) return candidates[0]

  const target = frontmatterDate.replace(/-/g, '')
  let best: YtEntry | null = null
  let bestDiff = Number.POSITIVE_INFINITY
  for (const c of candidates) {
    const diff = Math.abs(parseInt(c.upload_date, 10) - parseInt(target, 10))
    if (diff < bestDiff) {
      bestDiff = diff
      best = c
    }
  }
  return best
}

function main() {
  const entries = fetchYoutubeEntries().filter(isYapzVideo)
  console.log(`[filter] ${entries.length} BCZ YapZ videos`)

  const filenames = fs
    .readdirSync(TRANSCRIPTS_DIR)
    .filter((f) => f.endsWith('.md'))

  let matched = 0
  let skipped = 0
  const gaps: string[] = []

  for (const filename of filenames) {
    const filepath = path.join(TRANSCRIPTS_DIR, filename)
    const raw = fs.readFileSync(filepath, 'utf-8')
    const parsed = matter(raw)
    const data = parsed.data as Record<string, unknown>

    if (data.youtube_url) {
      skipped++
      continue
    }

    const guest = String(data.guest ?? '')
    const fmDate =
      typeof data.date === 'string'
        ? data.date
        : typeof data.published === 'string'
          ? data.published
          : null

    const match = matchEntry(entries, guest, fmDate)
    if (!match) {
      gaps.push(`${filename} (guest=${guest}, date=${fmDate})`)
      continue
    }

    data.youtube_url = `https://www.youtube.com/watch?v=${match.id}`
    data.youtube_video_id = match.id
    if (!data.published && match.upload_date) {
      const d = match.upload_date
      data.published = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
    }

    const updated = matter.stringify(parsed.content, data)
    fs.writeFileSync(filepath, updated, 'utf-8')
    console.log(`[match] ${filename} -> ${match.id} (${match.title})`)
    matched++
  }

  if (gaps.length > 0) {
    fs.writeFileSync(
      GAPS_LOG,
      gaps.join('\n') + '\n',
      'utf-8'
    )
    console.log(`[gaps] ${gaps.length} unmatched - see ${GAPS_LOG}`)
  }

  console.log(`[summary] matched=${matched} skipped=${skipped} gaps=${gaps.length}`)
}

main()
```

- [ ] **Step 2: Run the script**

Run:
```bash
npx tsx scripts/sync-youtube-urls.ts
```
Expected: `[summary] matched=17 skipped=0 gaps=0` (if all 17 are posted). Otherwise gaps logged.

- [ ] **Step 3: Verify transcripts updated**

Run:
```bash
grep -l "youtube_url:" content/transcripts/bcz-yapz/*.md | wc -l
```
Expected: 17.

- [ ] **Step 4: Commit (script + updated transcripts as one commit for traceability)**

```bash
git add scripts/sync-youtube-urls.ts content/transcripts/bcz-yapz/
git commit -m "feat(bcz-yapz): yt-dlp sync script + populate youtube_url across all 17 transcripts (doc 490)"
```

---

## Task 14: Fallback CLI for manual YT URL

**Files:**
- Create: `scripts/set-youtube-url.ts`

- [ ] **Step 1: Write script**

Create `scripts/set-youtube-url.ts`:

```typescript
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const slug = process.argv[2]
const url = process.argv[3]

if (!slug || !url) {
  console.error('Usage: npx tsx scripts/set-youtube-url.ts <slug> <youtube_url>')
  process.exit(1)
}

const match = /[?&]v=([A-Za-z0-9_-]{11})/.exec(url) ??
  /youtu\.be\/([A-Za-z0-9_-]{11})/.exec(url)
if (!match) {
  console.error(`Could not extract video id from ${url}`)
  process.exit(1)
}
const videoId = match[1]

const filepath = path.join(
  process.cwd(),
  'content/transcripts/bcz-yapz',
  `${slug}.md`
)
if (!fs.existsSync(filepath)) {
  console.error(`Transcript not found: ${filepath}`)
  process.exit(1)
}

const raw = fs.readFileSync(filepath, 'utf-8')
const parsed = matter(raw)
parsed.data.youtube_url = url
parsed.data.youtube_video_id = videoId
fs.writeFileSync(filepath, matter.stringify(parsed.content, parsed.data), 'utf-8')
console.log(`Updated ${filepath}: youtube_url + youtube_video_id`)
```

- [ ] **Step 2: Commit**

```bash
git add scripts/set-youtube-url.ts
git commit -m "feat(bcz-yapz): fallback manual URL setter script"
```

---

## Task 15: Update content/README.md schema docs

**Files:**
- Modify: `content/README.md`

- [ ] **Step 1: Read current schema block**

Open `content/README.md`. Find the `yaml` code block under `## Transcript frontmatter schema` starting `---` and ending `---`. (Lines ~33-74.)

- [ ] **Step 2: Add new fields after `status:` line**

Inside the yaml block, after the existing `status: "raw"` line, add:

```yaml
youtube_url: "https://www.youtube.com/watch?v=XXXXXX"  # required when status != "raw-undated"
youtube_video_id: "XXXXXX"                            # required when status != "raw-undated"
thumbnail_override: null                              # optional - custom thumbnail path
```

- [ ] **Step 3: Update the status enum description**

Find:
```
Status enum:
- `raw-undated` - converted from source but date/topics/entities not yet enriched (filename-only metadata)
```

Replace with:
```
Status enum:
- `raw-undated` - converted from source but date/topics/entities not yet enriched (filename-only metadata). `youtube_url`, `youtube_video_id`, and `published` may be omitted.
```

- [ ] **Step 4: Commit**

```bash
git add content/README.md
git commit -m "docs(content): document youtube_url + youtube_video_id + thumbnail_override fields"
```

---

## Task 16: Manual QA in dev browser

**Files:** none new.

- [ ] **Step 1: Start dev server**

Run in one terminal:
```bash
npm run dev
```
Wait for `Ready in <ms>`.

- [ ] **Step 2: Open http://localhost:3000/bcz-yapz**

Expect:
- Hero section renders title "BCZ YapZ" in gold on navy.
- Tagline visible.
- "Hosted by Zaal" line with Farcaster link.
- "Subscribe on YouTube" gold button.
- About paragraph below.
- Episodes section heading.
- List/Thumbnails toggle top-right of episodes.
- 17 list-view cards, newest first.
- Each card has guest, date, duration, summary, up to 3 topic chips, Watch button, Chapters button (if chapter data).
- Follow footer at bottom with all 4 link rows.

- [ ] **Step 3: Toggle to Thumbnails view**

Click Thumbnails. Expect:
- Grid of YouTube thumbnails (2 cols mobile, check at 640px + 1024px breakpoints).
- Guest + ep number below each thumbnail.
- Clicking a card opens YouTube in new tab.

- [ ] **Step 4: Verify localStorage persistence**

- In DevTools > Application > Local Storage > `http://localhost:3000`: expect `bcz-yapz:view: grid`.
- Reload page. View stays `grid`.
- Toggle back to List. Reload. View stays `list`.

- [ ] **Step 5: Verify graceful handling**

If any transcript had `youtube_url` stripped or missing:
- List card shows disabled "Not yet posted" button.
- Grid card has lowered opacity + no link wrapper.

- [ ] **Step 6: Run full test suite**

```bash
npm run test
```
Expected: all tests pass including the 6 new `src/lib/bcz-yapz/__tests__/*` tests.

- [ ] **Step 7: Run lint**

```bash
npm run lint:biome
```
Expected: no errors in the new files.

- [ ] **Step 8: Commit any fixes**

If QA surfaced bugs, fix them and commit with `fix(bcz-yapz): <issue>`.

---

## Task 17: Push + open PR

**Files:** none new.

- [ ] **Step 1: Confirm branch**

Run:
```bash
git branch --show-current
```
Expected: a fresh worktree branch (e.g. `ws/bcz-yapz-page-impl`). If not, create one from main first.

- [ ] **Step 2: Push**

```bash
git push -u origin HEAD
```

- [ ] **Step 3: Open PR**

```bash
gh pr create --base main --title "feat(bcz-yapz): public archive page at /bcz-yapz (doc 490)" --body "$(cat <<'EOF'
## Summary

- New public page at `/bcz-yapz` rendering all 17 BCZ YapZ episodes from transcript frontmatter.
- Server Component + gray-matter parse at build time, Zod-validated.
- List-view cards default + thumbnail grid toggle persisted in localStorage.
- Unposted episodes render with disabled "Not yet posted" state.
- `getAllEpisodes()` at `src/lib/bcz-yapz/episodes.ts` is reusable by future BCZ 101 bot.
- `scripts/sync-youtube-urls.ts` populated `youtube_url` + `youtube_video_id` across all 17 transcripts via yt-dlp.

## Test plan

- [ ] `/bcz-yapz` renders 17 episodes on desktop + mobile.
- [ ] List view card shows guest, date, duration, summary, topic chips, Watch button.
- [ ] Chapters button expands inline when description file exists.
- [ ] Toggle to Thumbnails shows grid of YT thumbnails.
- [ ] localStorage persists view across reloads.
- [ ] Unposted episodes show "Not yet posted" disabled button.
- [ ] Lighthouse mobile performance >= 90.
- [ ] Vitest suite passes.
- [ ] Biome lint passes.
EOF
)"
```

---

## Self-Review

**1. Spec coverage:**

| Spec requirement | Task |
|------------------|------|
| Public `/bcz-yapz` route | Task 12 |
| Build-time Server Component | Task 12 |
| `getAllEpisodes()` single source of truth | Tasks 3 + 4 |
| List-view default + thumbnail grid toggle | Tasks 9 + 10 + 11 |
| localStorage persistence | Task 11 |
| "Not yet posted" fallback | Tasks 9 + 10 |
| Chapters inline expansion | Tasks 5 + 9 |
| Zaal voice copy editable | Task 6 |
| `gray-matter` + `img.youtube.com` allowlist | Task 1 |
| `youtube_url` + `youtube_video_id` fields | Tasks 2 + 13 + 15 |
| `scripts/sync-youtube-urls.ts` | Task 13 |
| Fallback manual CLI | Task 14 |
| Schema docs update | Task 15 |
| OG metadata | Task 12 layout |
| Revalidate 3600 | Task 12 |
| Mobile-first + navy/gold theme | Tasks 7-11 (all use `#0a1628` + `#f5a623`) |
| Success criterion: reusable by BCZ 101 bot | Task 4 (episodes.ts is the shared util) |
| Success criterion: Lighthouse mobile >= 90 | Task 16 step 2 (manual verify) |

**2. Placeholder scan:** no TBDs, TODOs, or vague "add error handling" in any task. All code blocks are complete.

**3. Type consistency:**
- `Episode` interface defined in Task 2, used by Tasks 4, 9, 10, 11, 12.
- `Chapter` interface defined in Task 5, used by Tasks 9, 11, 12.
- `BCZ_YAPZ_PAGE` config defined in Task 6, used by Tasks 7, 8, 12.
- `getAllEpisodes()` signature: `() => Promise<Episode[]>` consistent in Tasks 3, 4, 12.
- `parseChapters()` signature: `(slug: string) => Promise<Chapter[] | null>` consistent in Tasks 5, 12.

**4. Scope check:** single page + one util + one script + tests. Focused. Single plan worthy.

**5. Ambiguity:**
- "Fresh worktree branch" in Task 17 - left to user discretion since session-specific. Acceptable.
- OpenGraph image generator (`opengraph-image.tsx`) listed in file structure but not in a task - downgraded to YAGNI (Next.js auto-generates OG from metadata in Task 12). Fine.
