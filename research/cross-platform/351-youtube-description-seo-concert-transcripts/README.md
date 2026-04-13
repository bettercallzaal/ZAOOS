# 351 — YouTube Description SEO & Transcript-to-Description Workflow for COC Concertz

> **Status:** Research complete
> **Date:** April 13, 2026
> **Goal:** Define the optimal YouTube description structure, SEO strategy, timestamp/chapter formatting, and AI workflow for converting live concert transcripts into ready-to-paste YouTube descriptions for COC Concertz multi-artist shows

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Description structure | USE the 6-zone template below — hook in first 100 chars, 3-4 paragraphs, timestamps, tags at bottom |
| Character budget | STAY UNDER 3,000 chars for the description body (YouTube max is 5,000 but shorter performs better for SEO) |
| Timestamps format | USE `0:00 - Label` format (dash, not colon after time). First chapter MUST be `0:00`. Minimum 3 chapters. Titles under 50 chars for full display |
| Tags | USE comma-separated list. Total limit 500 characters across all tags. Include artist names, event name, genre, Web3 terms |
| First 100 characters | MUST contain primary keyword + artist names — this is what shows in search results and mobile |
| Formatting | USE plain text with blank lines between sections. YouTube supports bold (*text*) and italic (_text_) but plain text is safest for copy-paste |
| AI workflow | USE structured prompt with transcript segments → generate per-artist + full-show descriptions in one pass |
| Multi-video strategy | CREATE 4 descriptions per show: Full Show + 1 per artist set. Each is standalone SEO-optimized |

## YouTube Description Template for COC Concertz

```
ZONE 1: HOOK (first 100 chars — visible in search)
COC Concertz #{N} featuring {Artist1}, {Artist2}, {Artist3} — live from the metaverse. {Genre} + Web3.

ZONE 2: DESCRIPTION (3-4 paragraphs, ~800-1200 chars)
Paragraph 1: Artists + background + connection to Web3/community
Paragraph 2: Performance — style, energy, what made it distinct
Paragraph 3: Specific moments, tools, community context (grounded, no hype)
Paragraph 4 (optional): Artist socials + brief COC Concertz series description

ZONE 3: TIMESTAMPS (chapters)
0:00 - Welcome and Host Intro
2:30 - {Artist1} Introduction
5:00 - {Song Title}
...etc

ZONE 4: LINKS
🔗 COC Concertz: https://cocconcertz.com
🔗 {Artist1}: {url}
🔗 {Artist2}: {url}
🔗 {Artist3}: {url}

ZONE 5: ABOUT
COC Concertz is a recurring live music event by the Community of Communities, bringing musicians, builders, and listeners together across livestream platforms and metaverse environments.

ZONE 6: TAGS
{artist1}, {artist2}, {artist3}, COC Concertz, COC Concertz {N}, Community of Communities, Web3 music, {genre1}, {genre2}, metaverse concert, live music, {specific keywords from transcript}
```

## Comparison: Description Approaches

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| AI from full transcript (current) | Rich detail, accurate quotes, catches every moment | Long generation, may include filler, timestamps approximate without real timecodes | Full show descriptions |
| AI per-segment transcript | Focused per artist, accurate to segment content | Need to stitch segments manually, may miss cross-segment context | Per-artist YouTube uploads |
| Manual from notes + AI polish | Fastest, most authentic voice | Misses details, depends on note quality | Quick posts, social clips |
| Hybrid: AI draft → human timestamps | Best accuracy on chapters, AI handles prose | Requires watching video to fix timestamps | Production-quality uploads (USE THIS) |

## Timestamp Best Practices (2026)

| Rule | Detail |
|------|--------|
| First chapter | MUST be `0:00` — YouTube rejects chapters without it |
| Minimum chapters | 3 required for chapter markers to activate |
| Minimum video length | 10 minutes for chapters to be eligible |
| Chapter title length | Under 50 characters for full display across all devices |
| Format | `0:00 - Title` or `0:00 Title` (both work, dash is cleaner) |
| Spacing | One timestamp per line, no blank lines between timestamps |
| Content | USE actual content labels: song titles, artist names, topics — not generic "Part 1", "Part 2" |
| SEO boost | 43.7% of YouTube searches focus on videos with chapter markers. 2x faster indexing |
| Grouping | Don't timestamp jumps shorter than ~1 minute unless the content genuinely shifts |

## SEO Impact Numbers

| Metric | Value | Source |
|--------|-------|--------|
| Description visible in search | First 100-157 characters (desktop), ~100 chars (mobile) | YouTube 2026 |
| Max description length | 5,000 characters | YouTube 2026 |
| Max tags total | 500 characters combined | YouTube 2026 |
| Chapter title max | 100 characters (50 recommended) | YouTube 2026 |
| Chapter markers search correlation | 43.7% of searches focus on chaptered videos | BananaThumbnail 2026 |
| Indexing speed with chapters | 2x faster than videos without | BananaThumbnail 2026 |
| Videos over 10 min | Required for chapter eligibility | YouTube Help |

## AI Prompt Template for COC Concertz Descriptions

This is the optimized prompt for generating descriptions from transcripts:

```
ROLE: You are a YouTube content editor for COC Concertz, a live Web3 music series by the Community of Communities.

TASK: From the transcript segments provided, generate YouTube-ready descriptions.

ABOUT COC CONCERTZ: Recurring live music events across metaverse environments, featuring live performances, artist conversations, and Web3 community activations. Audience is Web3-literate and music-focused.

OUTPUT FORMAT: Generate as a single clean block — ready to copy-paste into YouTube. No markdown headers, no labels.

STRUCTURE (for each video):
1. Hook line (under 100 chars): "COC Concertz #{N} ft. {artists} — live {genre} from the metaverse."
2. Description (3-4 paragraphs, 800-1200 chars total):
   - P1: Introduce artists, their background, Web3 connection
   - P2: Performance energy, style, what made it distinct
   - P3: Specific moments, tools, community context — grounded, no hype
   - P4: Artist socials + brief series description
3. Timestamps starting at 0:00 — based on transcript flow, ~1 min minimum gaps
4. Tags: comma-separated keywords (artist names, event number, genres, Web3 terms, song titles)

STYLE RULES:
- Tone: clear, grounded, warm but professional
- No emojis in description text (emojis OK in links section)
- No hashtags in description body
- No clickbait
- If songs are named in transcript, use exact titles in timestamps
- Accuracy over hype — if it wasn't in the transcript, don't write it
- Assume Web3-literate audience

GENERATE FOR:
- Full Show description (combined timeline)
- Per-artist descriptions (segment-specific timestamps starting at 0:00)
```

## Workflow: Transcript → YouTube Description

### Step 1: Prepare Transcripts
- Export each segment as separate files (intro, artist1, artist2, artist3, outro)
- Note the actual video runtime for each segment (for accurate timestamps)

### Step 2: AI Generation
- Feed all segments + the prompt template above to AI
- Get back: Full Show description + per-artist descriptions

### Step 3: Timestamp Correction
- Watch the actual uploaded video and adjust timestamps to real timecodes
- The AI timestamps from transcripts are approximate — they need human verification
- For per-artist videos: timestamps are more accurate since segments map 1:1

### Step 4: Format Check
- Verify first 100 chars contain artist names + COC Concertz
- Verify total description under 5,000 chars
- Verify tags under 500 chars total
- Verify timestamps start at 0:00 and have 3+ chapters
- Verify no blank lines between timestamps

### Step 5: Copy-Paste to YouTube
- Plain text — paste directly into YouTube description field
- Timestamps auto-convert to clickable chapters
- Tags go in the YouTube tags field separately (not in description)

## COC Concertz Integration

**Existing files:**
- `concertz.config.ts` — site config with artist info, social links, event data
- `src/lib/types.ts` — Event and Artist types with socialLinks (twitter, farcaster, etc.)
- `src/app/api/newsletter/generate/route.ts` — existing AI content generation (MiniMax/OpenRouter)
- Firestore `events` and `artists` collections have all the metadata

**Future automation path:**
The newsletter builder at `/newsletter` could be extended with a "YouTube Description" template that:
1. Pulls event + artist data from Firestore
2. Accepts transcript text (paste or upload)
3. Generates description in the YouTube-ready format
4. Outputs with copy button (same pattern as newsletter social posts)

This would be a new template in `src/components/newsletter/TemplateSelector.tsx` — the infrastructure is already built.

## Sources

- [VidIQ: YouTube Description Best Practices 2026](https://vidiq.com/blog/post/youtube-video-descriptions/)
- [12AM Agency: YouTube Video Descriptions for SEO 2026](https://12amagency.com/blog/how-to-write-youtube-video-descriptions-for-seo/)
- [BananaThumbnail: YouTube SEO 2026 Timestamps](https://blog.bananathumbnail.com/youtube-seo-2026/)
- [Influencer Marketing Hub: YouTube Chapters & Key Moments](https://influencermarketinghub.com/youtube-chapters-key-moments/)
- [TypeCount: YouTube Character Limits 2026](https://typecount.com/blog/youtube-description-character-limit)
- [Humble&Brag: YouTube Chapters Guide 2026](https://humbleandbrag.com/blog/youtube-chapters)
