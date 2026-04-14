# 353 — YouTube Content Pipeline Automation for COC Concertz

> **Status:** Research complete
> **Date:** April 13, 2026
> **Goal:** Design the optimal transcript-to-YouTube pipeline for COC Concertz multi-segment concert videos, comparing external tools vs custom-built, with a concrete build plan

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Pipeline approach | BUILD CUSTOM inside COC Concertz site — external tools don't handle multi-segment concert shows well and add $24-29/mo per seat. The newsletter builder already has 80% of the infrastructure |
| Transcription | USE Descript ($12/mo) for initial transcription + editing of raw video, then export .docx transcripts to feed into the COC pipeline. Descript's transcript-based editing is the best for concert video |
| Short clips | USE Opus Clip ($15/mo Starter) for auto-generating Shorts/Reels/TikTok from the uploaded full videos. Feed clips back into the pipeline for social posts |
| SEO optimization | SKIP vidIQ for now ($17/mo) — the custom YouTube Description template already handles SEO. Revisit at 1000+ subscribers |
| YouTube upload | BUILD YouTube Data API v3 integration into COC Concertz site — 6 uploads/day on free quota, OAuth 2.0, auto-fill title/description/tags/chapters |
| n8n automation | SKIP for now — adds infrastructure complexity. The custom pipeline is simpler for 13 promoters. Revisit when automating across multiple channels |
| Transcript storage | USE `content/transcripts/concertz-{N}/` in the repo (already set up) + Arweave archive for permanent storage (already built) |

## The COC Concertz Content Pipeline (Build Plan)

### Current State (what exists today)

```
Record show → Edit in Descript → Export segments (.mp4 + .docx)
    ↓
Manually copy transcripts to repo
    ↓
Newsletter builder generates YouTube descriptions (MiniMax AI)
    ↓
Manually copy-paste descriptions to YouTube
    ↓
Manually create social posts
```

**Pain points:** Too many manual copy-paste steps. Transcript files live in Movies folder, not connected to the site. No auto-fill for YouTube. Social posts generated separately.

### Target State (what to build)

```
Record show → Edit in Descript → Export segments (.mp4 + .docx)
    ↓
Upload .docx transcripts to /content page on COC Concertz site
    ↓
Site auto-generates:
  - YouTube descriptions (all segments)
  - YouTube chapters/timestamps
  - Social posts (X, Farcaster, Bluesky, Telegram, Discord)
  - Tags
    ↓
One-click copy OR direct YouTube API upload
    ↓
Opus Clip auto-generates short clips from uploaded videos
    ↓
Archive to Arweave (permanent storage)
```

### Build Phases

#### Phase 1: Content Hub Page (NOW — extends newsletter builder)

Add `/content` page that combines:
- Transcript upload (drag-and-drop .docx/.txt files)
- Auto-detect segments from filenames (seg1-intro, seg2-jose, etc.)
- Generate ALL descriptions at once (full show + per-segment)
- Tabbed output: YouTube Description | X | Farcaster | Bluesky | Telegram | Discord
- Copy buttons per tab per segment

**Files to create/modify:**
- `src/app/content/page.tsx` — new content hub page
- `src/components/content/TranscriptUploader.tsx` — multi-file upload + segment detection
- `src/components/content/BatchGenerator.tsx` — generate all descriptions at once
- `src/app/api/content/parse-transcript/route.ts` — extract text from .docx files server-side

**Key feature:** Auto-parse .docx files server-side using `mammoth` package (lightweight .docx-to-text, 0 deps, MIT license)

#### Phase 2: YouTube API Integration (NEXT)

Direct upload from the COC site to YouTube:
- OAuth 2.0 flow (one-time consent per Google account)
- `videos.insert` with resumable upload
- Auto-fill: title, description (from generator), tags, chapters
- Set privacy to unlisted → review → publish
- 6 uploads/day on free quota (enough for 5 segments + full show)

**Files to create:**
- `src/lib/youtube.ts` — YouTube Data API v3 client
- `src/app/api/youtube/auth/route.ts` — OAuth callback
- `src/app/api/youtube/upload/route.ts` — resumable upload endpoint
- `src/components/content/YouTubePublisher.tsx` — upload UI with progress

**Env vars:** `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`

#### Phase 3: Short Clips + Social Distribution (LATER)

- Opus Clip API integration for auto-generating Shorts
- Social posting via platform APIs (X, Farcaster, Bluesky)
- Schedule posts around upload time
- Archive everything to Arweave

## Comparison: External Tools vs Custom Pipeline

| Feature | Descript ($12/mo) | Opus Clip ($15/mo) | Kapwing ($24/mo) | vidIQ ($17/mo) | Custom Pipeline ($0) |
|---------|-------------------|-------------------|-----------------|----------------|---------------------|
| Transcription | Best-in-class transcript editing | No | Basic auto-captions | No | Import from Descript |
| Description generation | Generic AI, no brand context | No | No | Basic AI titles | Brand-aware AI with full transcript context |
| Multi-segment handling | Export segments individually | No (single video in) | No | No | Auto-detect segments from filenames |
| Timestamp/chapters | AI-suggested, generic titles | No | No | No | Generated from transcript with real content labels |
| YouTube upload | Direct publish | No | No | No | YouTube Data API v3 (Phase 2) |
| Short clip generation | Manual clip tool | Best — AI auto-clips with virality score | Smart Cut | Can clip long-form to Shorts | Import from Opus Clip (Phase 3) |
| Social post generation | No | Captions only | No | No | Full multi-platform posts with @mentions |
| Brand voice | No | No | No | No | COC Concertz + ZAO voice profiles from config |
| @mention resolution | No | No | No | No | Auto-resolve from Firestore artist profiles |
| Permanent archive | No | No | No | No | Arweave via ArDrive Turbo |
| Cost for 13 promoters | $156/mo | $195/mo | $312/mo | $221/mo | $0 (self-hosted) |

**Verdict:** USE Descript for transcription (irreplaceable), BUILD CUSTOM for everything else. External tools don't understand multi-segment concert shows, can't do brand-aware AI, can't resolve @mentions, and would cost $156-312/mo for 13 promoters.

## YouTube Data API v3 Key Numbers

| Metric | Value |
|--------|-------|
| Daily quota | 10,000 units (free) |
| Upload cost | 1,600 units per video |
| Max uploads/day | 6 videos (9,600 units) |
| Resumable upload URI | Valid 7 days |
| Max file size | 256 GB |
| Max title length | 100 characters |
| Max description length | 5,000 characters |
| Max tags | 500 characters combined |
| OAuth scope | `youtube.upload` + `youtube.force-ssl` |
| Quota increase | Apply via Google Cloud console (usually approved in days) |

## Mammoth .docx Parser

For parsing uploaded .docx transcripts server-side:

```
npm install mammoth
```

- MIT license, 0 external deps, 234KB
- Extracts raw text from .docx with `mammoth.extractRawText()`
- Works in Node.js (Next.js API routes)
- Used by: Notion, Obsidian, dozens of CMS platforms

```typescript
import mammoth from "mammoth";

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
```

## COC Concertz Integration

| File | Purpose |
|------|---------|
| `content/transcripts/concertz-4/` | Already has 5 .docx + 5 .txt transcripts |
| `content/youtube-descriptions/concertz-4/` | Already has 6 generated descriptions |
| `src/app/newsletter/page.tsx` | YouTube Description template already built |
| `src/app/api/newsletter/generate/route.ts` | AI generation with MiniMax/OpenRouter already working |
| `src/components/newsletter/ContentPreview.tsx` | Tabbed preview with copy buttons already built |
| `concertz.config.ts` | Brand voice profiles already configured |
| `src/app/api/newsletter/resolve-mentions/route.ts` | @mention resolution from Firestore already built |

**80% of the pipeline already exists.** The missing pieces are:
1. `/content` page with multi-file transcript upload
2. Batch generation (all segments at once)
3. .docx parsing server-side (mammoth)
4. YouTube Data API v3 integration (Phase 2)

## Sources

- [Descript YouTube Tools](https://www.descript.com/tools/youtube-video-editor) — $12/mo, transcript-based editing + direct YouTube publish
- [Opus Clip](https://www.opus.pro/pricing) — $15/mo, AI video clipping with virality score
- [YouTube Data API v3: videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) — official upload documentation
- [n8n YouTube Automation](https://n8n.io/integrations/youtube/) — open-source workflow automation templates
- [Zernio YouTube API Guide 2026](https://zernio.com/blog/youtube-upload-api) — quota and resumable upload details
- [vidIQ Plans](https://vidiq.com/plans/) — $17/mo Boost, YouTube SEO optimization
