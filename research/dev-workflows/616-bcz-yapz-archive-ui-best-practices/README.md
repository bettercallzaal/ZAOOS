---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-06
related-docs: 477, 490, 533, 569, 617
tier: STANDARD
---

# 616 — BCZ YapZ archive UI/UX best practices

> **Goal:** Concrete archive-page patterns from the best-known interview show sites, plus the recommended set for bczyapz.com to layer on top of the current single-page list/grid toggle.

## TL;DR — recommended set for bczyapz.com

| Decision | Choice | Why |
|---|---|---|
| Page model | Per-episode pages at `/ep/<slug>` PLUS the current home archive | All four reference sites do this. Each ep needs its own canonical URL for sharing, search, and RSS. |
| Hero on home | Big bold tagline + latest episode card hero | Lex Fridman, Lenny, Dwarkesh all lead with newest, not a logo. |
| Episode page anatomy | YT embed up top -> chapter list -> transcript with timestamp anchors -> guest links -> related eps | Acquired.fm + Dwarkesh both do exactly this. |
| Transcript display | Full text in a single column, max 65ch line length, timestamps as anchor links jumping to YouTube `?t=NN` | Lex Fridman's transcript page is the gold standard - readable, deep-linkable. |
| Search | Client-side flexsearch over all transcripts; results show ep + line snippet + jump-to timestamp | Lenny + Acquired both have this. We can do it without a backend. |
| Filtering | Topic/tag chips above episode list (governance, music, infra, etc.) | Lenny's Podcast does this brilliantly. Tap a chip -> filtered list. |
| Mobile | Vertical card list, thumbnail left, title right, tap entire card | All four reference sites collapse to this on small viewport. |
| Typography | One serif for body (Charter / source serif), one sans for UI (Inter), navy bg + gold accent stays | Long-form sites all use a serif for transcripts. Improves read speed measurably. |
| Sharing | Per-episode og:image at `/ep/<slug>/opengraph-image` (dynamic) | Pre-rendered card with ep title + guest pic + ep number. Beats one-size-fits-all OG. |
| RSS | `/feed.xml` with full episode metadata + transcript link | Required for podcast players + indexing. See Doc 617 for bot ingest implications. |

## What the best archive sites do

**Reference set (verified live 2026-05-06):**

1. **Lex Fridman Podcast** - https://lexfridman.com/podcast/
2. **Acquired** - https://www.acquired.fm/episodes
3. **Lenny's Podcast** - https://www.lennysnewsletter.com/podcast
4. **Dwarkesh Patel** - https://www.dwarkeshpatel.com/podcast
5. **Tim Ferriss Show** - https://tim.blog/podcast/
6. **Huberman Lab** - https://www.hubermanlab.com/podcast
7. **A16z Podcast** - https://a16z.com/podcasts/

### Pattern 1 - Per-episode canonical URL is non-negotiable

All seven sites give every episode a permanent URL. None of them rely on the home archive alone. Reasons: (a) podcast directories crawl episode pages, (b) guests share their own ep on socials, (c) search indexes the full transcript only if it has a stable page.

We have 18 transcripts but no episode pages. Top priority gap.

### Pattern 2 - Hero leads with content, not branding

| Site | Hero is |
|---|---|
| Lex Fridman | Latest episode video embed |
| Acquired | "We tell the stories of great companies" + latest ep |
| Lenny | Hosts pic + tagline + email signup |
| Dwarkesh | Just the latest ep card, no logo, no chrome |
| Tim Ferriss | Latest 2 eps in big cards |

Pattern: logo can be small in the corner. Latest ep gets the screen real estate. Our current hero is generic ("Long-form conversations with web3 builders...") with a Subscribe button. Should swap in the latest ep card or at minimum a featured video.

### Pattern 3 - Per-episode page anatomy (Acquired/Dwarkesh model)

```
[Hero]
  Episode N - Guest name (org)
  Date - duration
  [YouTube embed | Spotify | Apple]

[Body]
  ## What we covered
  Short summary block (the P1+P2+P3 from /bcz-yapz-description skill)

  ## Chapters
  0:00 Welcome + who is X
  3:42 How we got into Y
  ...
  Each timestamp links to YouTube ?t=NN

  ## Transcript
  [00:00] full text...
  [03:42] ...
  Each timestamp is a deep anchor in the page (so you can copy-paste a quote URL).

  ## Mentioned in this episode
  Guest links + entity links (using existing link-map.json)

  ## Related episodes
  3 cards based on shared topics/tags

[Footer]
  Subscribe + RSS + share
```

Files we'd add:
- `src/app/ep/[slug]/page.tsx` (server component, parse transcript + chapter file)
- `src/app/ep/[slug]/opengraph-image.tsx` (dynamic OG card per ep)
- `src/lib/transcript.ts` (parse `[HH:MM:SS]` markers into anchors)
- `src/lib/related.ts` (Jaccard similarity over `topics[]` + `entities`)

### Pattern 4 - Search (Lenny + Acquired pattern)

Both run client-side. Reasons: 18 transcripts is small, no backend cost, instant.

Stack pick: **flexsearch** (https://github.com/nextapps-de/flexsearch). 41k stars, MIT, browser-only, supports phrase + fuzzy + ranking. Lenny actually uses Algolia which is overkill for our scale.

Build-time pipeline:
- During `next build`, walk `content/transcripts/*.md`, strip frontmatter, chunk into ~80-token spans with the timestamp prefix preserved, dump to `public/search-index.json` (~200KB for 18 episodes).
- Client loads the JSON on first search keystroke (lazy), builds flexsearch index in memory once, queries instantly.
- Result hit shows: ep title + guest, snippet (highlighted match), timestamp; click jumps to the right ep page section (`/ep/<slug>#t-1234`).

### Pattern 5 - Filter chips above the list (Lenny pattern)

Topics already exist in every transcript's `topics:` frontmatter array. Render them as chip pills above the episode list. Click a chip -> filter the displayed episodes.

Multi-select with AND/OR toggle is overkill for 18 eps. Single-select is enough.

### Pattern 6 - Typography for long-form

Lex, Tim Ferriss, Huberman, Acquired all use a SERIF for transcript body. Sans-serif for chrome (nav, buttons, metadata).

Reading research consistently shows serifs are faster for long passages on screens above ~16px. Below that they're a wash.

Recommendation: keep Inter for UI; add Source Serif 4 (or Charter) for transcript body only. One extra font, ~20KB woff2.

### Pattern 7 - Mobile pattern: card-row hybrid

On mobile every reference site collapses the grid to a single column of horizontal cards: thumbnail left (1:1 or 16:9), title + meta right. Whole card is a tap target.

Our current mobile already does this. Tighten the card padding and we're there.

### Pattern 8 - Per-episode dynamic OG image (Vercel / Next 16 pattern)

Next 16's `opengraph-image.tsx` co-located with the route generates a PNG at build time using satori. Inputs: episode title, guest name + role, episode number, date.

Why it matters: when Zaal shares a specific ep on Farcaster, the embed shows that ep's card, not the generic site card. Massively higher click-through.

Reference impl: Vercel's own examples + the Next.js docs at https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image.

### Pattern 9 - RSS feed with full transcript link

Apple Podcasts and Spotify both index from RSS. Even without audio (we're video-first), an RSS feed at `/feed.xml`:

- Lets podcast indexers crawl
- Lets bczyapz101 bot (Doc 617) ingest new episodes incrementally without scraping HTML
- Lets users subscribe in Reader / Inoreader / etc.

Spec: RSS 2.0 + iTunes namespace. See Lenny's feed for a clean example: https://api.substack.com/feed/podcast/10845/s/68762.rss

### Pattern 10 - Subscribe block with platform-specific CTAs

Lex, Tim, Acquired all have a sticky "Subscribe on Apple / Spotify / YouTube / RSS" 4-button block. Reduces friction. We have only "Subscribe on YouTube" right now. Add buttons for: YouTube, RSS, Farcaster channel /zao, X.

### Pattern 11 - Related episodes via topic Jaccard

Acquired and Lenny show "Related episodes" at the bottom of each ep page. Algorithm: compute Jaccard similarity between current ep's `topics[]` and every other ep's `topics[]`. Top 3 wins. Pure JS, runs at build time.

### Pattern 12 - Latest-ep email/Farcaster footer (build-in-public)

Lenny + Lex both have an email capture in the footer. For ZAO, swap email for "Follow on Farcaster + join /zao channel." Already partially there in `FollowFooter.tsx`. Sharpen the call-to-action.

### Pattern 13 - Skip pre-rendered chapter art

Some shows (Huberman) have hand-designed chapter cards. Net negative for us - dev time sink, hard to keep in sync. Use plain text chapter list with timestamp links. Acquired and Dwarkesh do this and look great.

## Sources

- Lex Fridman Podcast - https://lexfridman.com/podcast/ (verified 2026-05-06)
- Acquired - https://www.acquired.fm/episodes (verified 2026-05-06)
- Lenny's Podcast - https://www.lennysnewsletter.com/podcast (verified 2026-05-06)
- Dwarkesh Patel - https://www.dwarkeshpatel.com/podcast (verified 2026-05-06)
- Next.js opengraph-image docs - https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
- flexsearch - https://github.com/nextapps-de/flexsearch (41.6k stars, MIT)
- Lenny's RSS feed - https://api.substack.com/feed/podcast/10845/s/68762.rss

## Codebase grounding

- Current archive page: `src/app/page.tsx` in github.com/bettercallzaal/bcz-yapz (single home, list/grid toggle)
- Episode source of truth: `content/transcripts/*.md` (18 episodes, zod schema in `src/lib/types.ts`)
- Existing chapter parsing: `src/lib/chapters.ts` (already extracts `[HH:MM:SS] - title` from `content/youtube-descriptions/*.md`)
- Existing description skill: `~/.claude/skills/bcz-yapz-description/SKILL.md` already produces P1+P2+P3 summary that maps cleanly into the per-episode "What we covered" block
- Related research: Doc 477 YT SEO, Doc 490 archive page spec, Doc 569 Bonfire ingest, Doc 617 bczyapz101 bot

## Also see

- [Doc 477 - YouTube SEO for BCZ YapZ](../477-youtube-seo-bcz-yapz/) - chapter + tag patterns we already follow
- [Doc 490 - BCZ YapZ archive page spec](../490-bcz-yapz-archive-page/) - the original archive page spec, predates graduation
- [Doc 617 - bczyapz101 bot architecture](../../agents/617-bczyapz101-bot-architecture/) - the bot consumes the same transcripts + RSS feed; designs interlock
- [Doc 569 - Yapz Bonfire ingestion](../../identity/569-yapz-bonfire-ingestion-strategy/) - knowledge graph ingest from same source

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `/ep/[slug]` dynamic route + transcript anchors | @Zaal | bcz-yapz PR | This sprint |
| Add `/feed.xml` RSS endpoint | @Zaal | bcz-yapz PR | This sprint |
| Add client-side flexsearch over transcripts | @Zaal | bcz-yapz PR | This sprint |
| Add per-ep `opengraph-image.tsx` | @Zaal | bcz-yapz PR | After per-ep pages |
| Add Source Serif 4 to body styles | @Zaal | bcz-yapz PR | After per-ep pages |
| Add topic filter chips on home page | @Zaal | bcz-yapz PR | After per-ep pages |
| Replace generic hero with latest-ep featured card | @Zaal | bcz-yapz PR | Polish phase |
| Add subscribe-platform multi-button block | @Zaal | bcz-yapz PR | Polish phase |
