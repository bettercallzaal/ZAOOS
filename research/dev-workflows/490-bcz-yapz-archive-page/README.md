# 490 - BCZ YapZ Archive Page (/bcz-yapz)

> **Status:** Design complete, ready for implementation plan
> **Date:** 2026-04-23
> **Goal:** Ship a public ZAO OS page at `/bcz-yapz` that gives more context about the show and lists all 17 BCZ YapZ episodes, sourcing data from transcript frontmatter so the same pipeline feeds the BCZ 101 bot (doc 474).

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Route | USE `/bcz-yapz` under `src/app/bcz-yapz/page.tsx`. Public - no middleware gate. Matches `/spaces`, `/stock` pattern. |
| Gating | PUBLIC. BCZ YapZ is already on YouTube + Farcaster; gating hides it from the people most likely to care. |
| Data source | USE build-time reads of `content/transcripts/bcz-yapz/*.md`. Single source of truth via YAML frontmatter. Same `getAllEpisodes()` feeds the future BCZ 101 bot ingestion. |
| Rendering | USE Next.js Server Component for static generation. Client Component only for the list/grid view toggle. `revalidate = 3600` for belt-and-suspenders. |
| Episode card default view | USE single-column list cards with guest, date, duration, 1-2 sentence summary, 3 topic chips, Watch button, expandable Chapters. |
| Episode card alt view | USE 2/3/4-col responsive grid of YouTube thumbnails (`hqdefault.jpg`). Toggle button top-right of the list section. Persist in `localStorage`. |
| Sort | USE newest-first by `published` date. No secondary sort in v1 (YAGNI). |
| Missing YT URL handling | USE disabled "Not yet posted" button on the card. Card still renders - archive stays complete. |
| YT URL acquisition | USE `scripts/sync-youtube-urls.ts` running `yt-dlp --flat-playlist -J` on `@bettercallzaal`, fuzzy-matching title + upload_date to transcripts. Idempotent. Re-runs when new eps drop. |
| Frontmatter schema additions | ADD `youtube_url`, `youtube_video_id`, `thumbnail_override`. `published` becomes required when `status` is `raw`, `cleaned`, or `annotated`. Document in `content/README.md`. |
| Dependencies | ADD `gray-matter` (~50KB, MIT). No new Zod (already in project). `next.config.ts` gets `img.youtube.com` in `images.remotePatterns`. |

## Priority Stack (why this page exists)

| Rank | Reader | What they get from the page |
|------|--------|------------------------------|
| 1 | BCZ 101 bot + future RAG agents | `getAllEpisodes()` util is the canonical ingest path. Also a future `/api/bcz-yapz/episodes.json` for outside-repo agents. |
| 2 | Non-member visitors finding the show | Hero + about section + full episode archive + subscribe CTA. Zero friction to discover all 17 eps. |
| 3 | Guests sharing their own episode | Stable permalink card per episode they can point their network at. Their links are in the "Mentioned" / guest-links blocks (from doc 477). |
| 4 | Zaal (reference) | Single place to sanity-check the archive is in order. |

## Page Layout

Mobile-first, ZAO OS theme (navy `#0a1628` background, gold `#f5a623` accent). All copy editable via config, not hardcoded in components.

### Zone A - Hero

- Title: `BCZ YapZ`
- Tagline (1 line): `Long-form conversations with web3 builders, music-first founders, and the coordination misfits The ZAO collects.`
- Host line: `Hosted by Zaal` + link to `https://farcaster.xyz/zaal`
- Primary CTA: `Subscribe on YouTube` (gold button, opens `https://youtube.com/@bettercallzaal` in new tab)

### Zone B - About the show

~120 words. What BCZ YapZ is, who it's for, cadence. Grounded, no hype. Editable via `src/lib/bcz-yapz/config.ts` (exported const) so Zaal can tweak copy without touching components.

Placeholder copy for v1:

> BCZ YapZ is a long-form interview show hosted by Zaal. Each episode is a conversation with a builder, founder, or organizer working on something worth understanding - web3 music distribution, decentralized governance, AI tooling, coordination experiments, Maine community infrastructure, and more. Episodes run 25-30 minutes and drop Tuesdays. Transcripts are archived in the open at thezao.com/bcz-yapz so the full catalog stays searchable.

### Zone C - Episode list

- 17 cards today (all 17 BCZ YapZ transcripts on main as of PR #281's merge).
- Default view: single-column list cards.
- Toggle: `[List] / [Thumbnails]` in the top-right of the section. Icon-based on mobile (list icon / grid icon), labeled on desktop. Persisted in `localStorage` under `bcz-yapz:view`.
- Sort: newest-first by `published`. Unposted episodes (no `youtube_url`) sort by `date` and show a `Not yet posted` state.

### Zone D - Follow footer

- `Subscribe on YouTube` (repeat of Zone A CTA)
- `Follow Zaal on Farcaster` -> `@zaal` (https://farcaster.xyz/zaal)
- `Follow on X` -> `@bettercallzaal` (https://x.com/bettercallzaal)
- `The ZAO` -> `/zao` Farcaster channel (https://farcaster.xyz/~/channel/zao) + `thezao.com`
- `v2 flag:` link to `/bcz-yapz/transcripts` (future - transcript browser for researchers).

## Episode Card Specs

### List view card (default)

```
[Ep N] . YYYY-MM-DD . {duration_min} min
{Guest} . {Guest Org}
{summary}  (1-2 sentences)
{topic1} . {topic2} . {topic3}  (chips, first 3)
[Watch on YouTube] [Chapters]
```

Field sources:
- Ep N: `frontmatter.episode` (if set) else display index from sort order
- Date: `frontmatter.published` (fallback `frontmatter.date`)
- Duration: `frontmatter.duration_min`
- Guest / Org: `frontmatter.guest`, `frontmatter.guest_org`
- Summary: `frontmatter.summary`
- Topics: first 3 of `frontmatter.topics`
- Watch link: `frontmatter.youtube_url` (new required field)
- Chapters: parsed from `content/youtube-descriptions/bcz-yapz/<slug>.md` if exists; hide button if absent

Chapters expand inline on click - no modal, no route change. Pure React state toggle.

### Thumbnail view card

Responsive grid: 2 cols mobile, 3 cols tablet (>=768px), 4 cols desktop (>=1024px).

```
[YouTube thumbnail image]    (aspect-ratio 16:9)
{Guest} . {Ep N}
{YYYY-MM-DD} . {duration_min} min
```

Thumbnail URL: `https://img.youtube.com/vi/{frontmatter.youtube_video_id}/hqdefault.jpg` (480x360, always exists). Optional `maxresdefault.jpg` fallback upgrade via client-side `onerror` swap - YAGNI for v1.

Served via Next.js `<Image>` with `remotePatterns` allowlist for `img.youtube.com`. Lazy-loaded.

Click -> opens YouTube in new tab (same as Watch button).

## File Structure

```
src/app/bcz-yapz/
  page.tsx              # Server Component - reads transcripts, renders page
  layout.tsx            # sets <title>, <meta>, OG tags
  opengraph-image.tsx   # generated OG card for social shares
  _components/
    HeroSection.tsx     # Zone A + B, static content
    EpisodeList.tsx     # Client Component - view toggle + localStorage
    EpisodeListCard.tsx # list-view single-column card + expandable chapters
    EpisodeGridCard.tsx # thumbnail-view grid card
    FollowFooter.tsx    # Zone D

src/lib/bcz-yapz/
  episodes.ts           # getAllEpisodes() - fs read + gray-matter parse + zod validate + sort
  types.ts              # Episode interface + zod schema
  chapters.ts           # parseChapters(slug) - reads content/youtube-descriptions/<slug>.md
  config.ts             # editable copy (tagline, about paragraph, footer links)

scripts/
  sync-youtube-urls.ts  # one-shot: yt-dlp -> match -> write youtube_url + youtube_video_id
  set-youtube-url.ts    # fallback CLI: npx tsx scripts/set-youtube-url.ts <slug> <url>
```

## Data Flow

1. Build time: `page.tsx` (Server Component) calls `getAllEpisodes()`.
2. `getAllEpisodes()` reads `content/transcripts/bcz-yapz/*.md`, parses YAML frontmatter with `gray-matter`, validates each with Zod, returns `Episode[]` sorted desc by `published`.
3. Server Component renders `<HeroSection />`, `<EpisodeList episodes={episodes} />`, `<FollowFooter />`.
4. `EpisodeList` is `"use client"` (uses `useState` for toggle + `useEffect` for localStorage hydration). Receives episodes as props.
5. Each card gets its chapters prop pre-computed at build time via `parseChapters(slug)` called in the parent Server Component.
6. No runtime filesystem access on the page. No API fetch for the list.

## Frontmatter Schema Additions

Added to `content/README.md`:

```yaml
youtube_url: "https://www.youtube.com/watch?v=XXXXXX"    # required when status != "raw-undated"
youtube_video_id: "XXXXXX"                                # required when status != "raw-undated" (derived from youtube_url)
thumbnail_override: null                                  # optional - custom path if not using YT thumbnail
published: 2026-04-21                                     # required when status != "raw-undated" (was already optional)
```

Status `raw-undated` stays the only state where these fields can be absent. Transitioning to `raw` or further requires populating them.

## YouTube URL Acquisition

**Primary tool: `scripts/sync-youtube-urls.ts`**

```
1. Run yt-dlp --flat-playlist -J https://www.youtube.com/@bettercallzaal
   -> get all video entries: {id, title, upload_date, ...}

2. Filter to BCZ YapZ videos (title startsWith "BCZ YapZ" OR "Better Call Zaal Yaps").

3. For each transcript in content/transcripts/bcz-yapz/*.md:
   a. Parse frontmatter.
   b. Match a YouTube video by (guest name fuzzy match in title + upload_date within 2 days of frontmatter.date).
   c. If match:
      - Write youtube_url = https://www.youtube.com/watch?v={id}
      - Write youtube_video_id = {id}
      - If frontmatter.published missing, write published = upload_date.
   d. If no match: log to scripts/sync-youtube-urls.gaps.log with transcript slug + 2 nearest YT candidates.

4. Summary print: N matched, N unmatched, N skipped (already populated).
```

Invocation: `npx tsx scripts/sync-youtube-urls.ts`. Prereq: `yt-dlp` installed (already on Zaal's machine per worktree history `de100ec4 content: rebuild dates from YouTube ground truth (yt-dlp @bettercallzaal)`).

**Fallback tool:** `npx tsx scripts/set-youtube-url.ts <slug> <url>` - single-record manual paste when fuzzy match fails.

## Comparison: Data Source Approaches

| Approach | Source of truth | Tradeoffs | Picked? |
|----------|-----------------|-----------|---------|
| Hardcoded TS array | `src/app/bcz-yapz/episodes.data.ts` | Simplest ship. Dupes frontmatter data. Drifts out of sync. | no |
| Build-time read of transcripts | `content/transcripts/bcz-yapz/*.md` | Single source of truth. Feeds bot. Needs gray-matter. | YES |
| API route + client fetch | `/api/bcz-yapz/episodes` -> React Query | Overkill for static archive. Worse SEO (empty initial HTML). | no |

## Comparison: Card View Defaults

| Default view | Pros | Cons | Picked? |
|-------------|------|------|---------|
| List cards with summary | Reader gets reason to watch each ep. Scannable text. Accessible. | No visual pull. | YES (default) |
| Thumbnail grid | Visual. Easy to glance. | No substance - just clickbait thumbnails. | Toggle alt view |
| Timeline / vertical log | Matches "archive" mental model. | Vertical sprawl. Hard to compare eps. | no |

## Out of Scope (v1 non-goals)

- Per-episode detail pages (`/bcz-yapz/[slug]`) - link goes to YouTube directly. Future v2.
- Transcript browser (`/bcz-yapz/transcripts`) for researchers - future v2.
- Search / filter by topic, guest, keyword - YAGNI for 17 episodes; bring back at 30+.
- Audio-only player embed (if Zaal ships audio-only podcast feed later).
- RSS feed generation (future if Apple/Spotify podcast lands).
- Commenting, reactions, member-only chapters.
- Analytics instrumentation beyond what ZAO OS already has.
- Mini app (Farcaster frame) version of the page - `/miniapp` route already exists; revisit if traction warrants.

## Success Criteria

- Page at `/bcz-yapz` renders all 17 episodes from transcript frontmatter. Zero hardcoded episode data.
- Toggle between list view + thumbnail grid, persisted across reloads.
- Unposted episodes render gracefully (`Not yet posted` disabled button).
- `getAllEpisodes()` is reusable by future BCZ 101 bot ingestion without refactor.
- `scripts/sync-youtube-urls.ts` populates `youtube_url` + `youtube_video_id` for all 17 known-posted episodes in one run.
- Mobile-first: Lighthouse mobile performance score >= 90.
- OG tags render a shareable card on Farcaster, Twitter, iMessage.
- No regressions to existing routes (`/spaces`, `/stock`, etc.) - this is additive.

## Numbers Worth Remembering

| Metric | Value | Source |
|--------|-------|--------|
| Transcripts on main as of 2026-04-23 | 17 | `content/transcripts/bcz-yapz/` |
| Episodes posted to YouTube | 17 (per worktree yt-dlp sync) | PR #281 |
| BCZ YapZ channel | @bettercallzaal | doc 477 |
| ZAO Farcaster channel | /zao | memory `user_social_handles.md` |
| `gray-matter` bundle size | ~50KB | npm |
| YouTube `hqdefault.jpg` dimensions | 480x360 | YouTube CDN |
| YouTube `maxresdefault.jpg` dimensions | 1280x720 | YouTube CDN |
| ZAO OS theme navy | `#0a1628` | CLAUDE.md |
| ZAO OS theme gold | `#f5a623` | CLAUDE.md |
| Page revalidate interval | 3600s (1hr) | design decision |

## ZAO OS Integration

| File | Purpose |
|------|---------|
| `content/transcripts/bcz-yapz/*.md` | Source of truth for episodes (17 files) |
| `content/youtube-descriptions/bcz-yapz/<slug>.md` | Optional chapters source (generated by `/bcz-yapz-description` skill) |
| `content/README.md` | Frontmatter schema docs - updated to mark new fields required |
| `src/app/bcz-yapz/*` | New page + components |
| `src/lib/bcz-yapz/*` | New lib - shared with future BCZ 101 bot |
| `scripts/sync-youtube-urls.ts` | New YT URL sync tool |
| `next.config.ts` | Add `img.youtube.com` remotePatterns |
| `community.config.ts` | Consider adding BCZ YapZ to nav (optional - can link from main page) |
| `research/dev-workflows/477-youtube-seo-bcz-yapz/` | Sibling - the per-episode description skill |
| `research/agents/474-bcz101-bot-transcript-rag/` | Downstream consumer of `getAllEpisodes()` + transcript frontmatter |

## Sources

- [BCZ YapZ channel](https://youtube.com/@bettercallzaal)
- [The ZAO Farcaster channel](https://farcaster.xyz/~/channel/zao)
- [Doc 477 - BCZ YapZ YouTube Description + Timestamp Template](../477-youtube-seo-bcz-yapz/)
- [Doc 474 - BCZ 101 bot transcript RAG](../../agents/474-bcz101-bot-transcript-rag/)
- [gray-matter npm](https://www.npmjs.com/package/gray-matter) - YAML frontmatter parser
- [yt-dlp flat-playlist docs](https://github.com/yt-dlp/yt-dlp#output-template) - channel video listing
- [Next.js Server Components + Static Generation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Image Remote Patterns](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns) - YouTube thumbnail allowlist
