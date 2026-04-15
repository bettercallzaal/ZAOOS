# 359 — Web Scraping & Data Extraction for AI Tools: Best Practices

> **Status:** Research complete
> **Date:** April 15, 2026
> **Goal:** Solve fetch failures (402/403/ECONNREFUSED) when Claude Code tries to read X posts, Linktree, artist pages. Define reliable, cheap pipeline for /inbox and content tools.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| YouTube metadata | USE YouTube Data API v3 - free, 10K units/day, tracks 200 videos/day indefinitely |
| X/Twitter posts | USE oEmbed endpoint (publish.x.com/oembed) for metadata - free, no auth. For full feeds, USE Apify X actor ($5-29/mo) |
| Reddit posts | USE official Reddit API with OAuth - free, 100 req/min |
| Arbitrary websites | USE Jina Reader (r.jina.ai prefix) - free 10M tokens/day (~200 req/day) |
| LLM-ready extraction | USE Firecrawl MCP if Jina limits hit - $83/mo for 100K pages |
| Linktree/JS pages | USE Jina Reader or Firecrawl - both handle JS rendering |
| Self-hosted scraping | SKIP for now - n8n + Playwright is free but fragile, 10-20% maintenance overhead/year |
| X API paid tier | SKIP - $100/mo Basic minimum, not worth it for <500 req/day |

## Why Fetches Fail

| Site | Error | Root Cause | Fix |
|------|-------|------------|-----|
| X/Twitter | 402 | Bot detection, no free API tier since Feb 2026 | oEmbed endpoint or Apify actor |
| Linktree | 403 | Explicit anti-scraping, requires JS rendering | Jina Reader (handles JS) |
| stilo.world | ECONNREFUSED | Client-side rendered (Next.js/React), no server HTML | Jina Reader or Firecrawl |
| Reddit | 403 | Requires OAuth token even for public data | Reddit API with OAuth (free) |

## Comparison: Scraping Services

| Service | Free Tier | Paid | JS Rendering | MCP Server | Best For |
|---------|-----------|------|-------------|------------|----------|
| **Jina Reader** | 10M tokens/day (~200 req) | Token-based | Yes | No (HTTP only) | Quick text extraction, free |
| **Firecrawl** | 500 lifetime credits | $83/mo (100K pages) | Yes | Yes (official) | LLM workflows, structured data |
| **Apify** | $5/mo credits (recurring) | $29/mo+ | Yes (actors) | No | Pre-built scrapers (X, YouTube) |
| **ScrapingBee** | None | $49/mo+ | Yes (5x credit multiplier) | No | SKIP - hidden credit multipliers |
| **Browserless** | 1K units | $250/mo+ | Yes | No | SKIP - too expensive for our scale |
| **oEmbed** | Unlimited | Free | N/A | N/A | Metadata only, 100+ platforms |

## The $0/mo Stack (Start Here)

1. **YouTube Data API v3** - free, 10K units/day. `videos.list` = 1 unit. Track hundreds of videos indefinitely.
2. **Reddit API** - free with OAuth. 100 req/min. Full public data.
3. **oEmbed** - free, no auth. Works for X, YouTube, Spotify, Vimeo. Returns title, author, thumbnail.
   - X: `https://publish.x.com/oembed?url=https://x.com/user/status/123`
   - YouTube: `https://www.youtube.com/oembed?url=https://youtu.be/xyz&format=json`
   - Universal: `https://noembed.com/embed?url=ANY_URL` (100+ sites)
4. **Jina Reader** - free 10M tokens/day. Prefix any URL: `https://r.jina.ai/https://example.com` returns clean text.

## Implementation for /inbox

When user forwards a URL to /inbox:

```
1. Detect platform from URL
2. Route to appropriate extractor:
   - youtube.com → YouTube Data API (title, description, channel, duration, thumbnail)
   - x.com/twitter.com → oEmbed endpoint (title, author, embed HTML)
   - reddit.com → Reddit API with OAuth (title, body, score, comments)
   - Everything else → Jina Reader (full text extraction)
3. Store extracted data in Supabase
4. AI processes the clean text for research/summaries
```

## Implementation for /content Pipeline

For the COC Concertz transcript-to-description workflow:
- .docx files → mammoth (already built)
- Artist profile data → Firestore (already built)
- Artist social links → oEmbed + Jina Reader for verification
- YouTube upload metadata → YouTube Data API v3

## oEmbed Platforms (Free, No Auth)

| Platform | Endpoint |
|----------|----------|
| X/Twitter | publish.x.com/oembed |
| YouTube | youtube.com/oembed |
| Spotify | open.spotify.com/oembed |
| Vimeo | vimeo.com/api/oembed.json |
| SoundCloud | soundcloud.com/oembed |
| Bandcamp | bandcamp.com/oembed |
| Universal | noembed.com/embed (100+ sites) |

## MCP Servers Available

| Server | What It Does | Setup |
|--------|-------------|-------|
| **Firecrawl MCP** | 12+ tools: scrape, crawl, search, structured extraction | `npx @anthropic/create-mcp firecrawl` |
| **Fetch MCP** (built-in) | Basic HTTP fetch - what we use now, gets blocked | Already installed |
| **Browser MCP** | Headless Chromium via Playwright | `npx @anthropic/create-mcp browser` |

Firecrawl MCP = best upgrade path. Handles JS rendering, returns Markdown, 83% accuracy on structured extraction.

## Budget Scaling

| Scale | Stack | Monthly Cost |
|-------|-------|-------------|
| <100 req/day | Jina + oEmbed + YouTube API + Reddit API | $0 |
| 100-500 req/day | Add Apify pre-built actors | $5-29 |
| 500-5K req/day | Add Firecrawl MCP | $83 |
| >5K req/day | Dedicated service (Bright Data, Oxylabs) | $200-500+ |

## ZAO Ecosystem Integration

**COC Concertz**: `src/app/api/content/parse-transcript/route.ts` already handles .docx. Add oEmbed + Jina routes for URL extraction.

**ZAO OS**: `/inbox` skill processes forwarded URLs. Route through platform detection → appropriate extractor.

**FISHBOWLZ**: Not relevant yet.

## Next Steps

1. Add oEmbed utility to ZAO OS (`src/lib/oembed/`) - 30 min
2. Add Jina Reader fallback to /inbox processing - 1 hour
3. Set up YouTube Data API key in .env - 15 min
4. Set up Reddit OAuth app - 30 min
5. Consider Firecrawl MCP if volume increases past free tiers

## Sources

- [Firecrawl MCP Server](https://docs.firecrawl.dev/mcp-server) - $83/mo, 12+ tools
- [Jina Reader](https://jina.ai/reader/) - free 10M tokens/day
- [oEmbed spec](https://oembed.com/) - free metadata protocol
- [Noembed](https://noembed.com/) - universal oEmbed gateway
- [YouTube Data API v3](https://developers.google.com/youtube/v3) - free 10K units/day
- [Reddit API](https://www.reddit.com/dev/api/) - free with OAuth, 100 req/min
- [X API pricing 2026](https://www.xpoz.ai/blog/guides/understanding-twitter-api-pricing-tiers-and-alternatives/) - no free tier, $100/mo Basic
- [Apify pricing](https://apify.com/pricing) - $5/mo free credits, pre-built X/YouTube actors
- [Web scraping cost guide 2026](https://tendem.ai/blog/web-scraping-cost-pricing-guide)
