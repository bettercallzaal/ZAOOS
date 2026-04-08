# 306 - Web Scraping for AI Agents: Reading X Posts, Articles, and Any URL

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Give Claude Code the ability to read any URL (including X/Twitter posts) when processing /inbox items

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **X/Twitter posts** | USE Jina Reader - `https://r.jina.ai/URL` reads X posts with full content extraction. Free up to 1M tokens. Tested and confirmed working on real X post today. |
| **General web pages** | USE Jina Reader as primary, Firecrawl MCP as secondary. Jina is zero-setup (HTTP prefix). Firecrawl needs API key but has better JS rendering. |
| **MCP server** | INSTALL Firecrawl MCP for Claude Code - `claude mcp add firecrawl --url https://mcp.firecrawl.dev/API_KEY/v2/mcp`. Gives scrape/crawl/search/extract tools. |
| **For /inbox skill** | UPDATE /inbox to use Jina Reader for URL extraction before running /zao-research. Prefix any URL with `https://r.jina.ai/` to get clean markdown. |
| **Self-hosted option** | SKIP for now. Firecrawl is open source (AGPL) and self-hostable but adds Docker complexity on VPS. Use hosted APIs until volume justifies self-hosting. |

---

## Comparison of Options

| Tool | X/Twitter | Free Tier | Setup | MCP Server | Self-Host | License | Best For |
|------|-----------|-----------|-------|------------|-----------|---------|----------|
| **Jina Reader** | YES (confirmed) | 1M tokens free | Zero - just HTTP prefix | Yes (community) | No | Proprietary | Single page reads, X posts, quick lookups |
| **Firecrawl** | Unknown | 500 credits (pages) | API key + MCP install | YES (official) | Yes (AGPL) | AGPL-3.0 | Full site crawls, structured extraction, JS-heavy sites |
| **Nia Docs** (Doc 301) | No | 50 queries/mo | `npx nia-docs URL` | No | No | MIT plugin | Documentation sites only |
| **Apify** | Yes (dedicated actor) | $5 free credits | Account + API key | Yes | No | Proprietary | High-volume scraping, social media |
| **Playwright/Puppeteer** | Requires auth | Free (self-hosted) | Heavy setup | No | Yes | Apache-2.0 | Full browser automation, auth flows |
| **ScrapeGraph AI** | Limited | Open source | pip install | No | Yes | MIT | AI-powered extraction with LLM |

---

## Jina Reader - The Winner for /inbox

### How It Works

Prefix any URL with `https://r.jina.ai/` and get clean markdown back:

```bash
# Read an X post
curl -s "https://r.jina.ai/https://x.com/ernestosoftware/status/2014110519913857122"

# Read any article
curl -s "https://r.jina.ai/https://www.example.com/article"

# With API key for higher limits
curl -s "https://r.jina.ai/https://x.com/..." \
  -H "Authorization: Bearer jina_xxx"
```

### Confirmed Working (Today)

Tested on `x.com/ernestosoftware/status/2014110519913857122` - returned full post content including:
- Author name and handle
- Complete post text (8-step framework, 500+ words)
- Embedded quotes
- Strategy breakdown

### Pricing

- **Free**: 1,000,000 tokens (no API key needed)
- **Paid**: starts at $0.02/1K tokens after free tier

### Limitations

- No engagement metrics (likes, retweets) - just content
- Rate limited on free tier
- Large pages may be truncated
- Some JS-heavy SPAs may not render fully

---

## Firecrawl MCP - For Complex Scraping

### Install for Claude Code

```bash
# Option 1: Remote hosted (recommended)
claude mcp add firecrawl --url https://mcp.firecrawl.dev/YOUR_API_KEY/v2/mcp

# Option 2: Local
claude mcp add firecrawl -e FIRECRAWL_API_KEY=your-key -- npx -y firecrawl-mcp
```

### What It Provides

- `firecrawl_scrape` - scrape single page to markdown
- `firecrawl_crawl` - crawl entire site
- `firecrawl_map` - get sitemap/URL list
- `firecrawl_search` - search the web
- `firecrawl_extract` - structured data extraction with schema

### Pricing

- **Free**: 500 credits (1 page = 1 credit)
- **Hobby**: $16/mo, 3,000 credits
- **Standard**: $83/mo, 100,000 credits

### When to Use Firecrawl Over Jina

- Full site crawls (Jina only does single pages)
- JS-heavy pages that need rendering
- Structured extraction (e.g., extract all product prices from a page)
- Search the web (Jina doesn't search, only reads URLs you give it)

---

## ZAO OS Integration

### Update /inbox Skill

When processing an inbox item with a URL:
1. Extract URLs from the email body
2. For each URL, fetch via Jina Reader: `https://r.jina.ai/{URL}`
3. Pass the clean markdown to `/zao-research`
4. Mark email as read

### Files Referenced

- `.claude/skills/inbox/SKILL.md` - update to use Jina Reader for URL extraction
- `src/lib/wavewarz/scraper.ts` - existing scraper in codebase (WaveWarZ battles)
- `src/app/api/wavewarz/sync/route.ts` - uses the scraper

### Existing Scraping in Codebase

ZAO OS already has `src/lib/wavewarz/scraper.ts` for scraping WaveWarZ battle data. This could be extended or the pattern could be reused, but for /inbox purposes Jina Reader is simpler (no code changes, just HTTP).

---

## Sources

- [Jina Reader](https://jina.ai/) - free URL-to-markdown, 1M tokens free
- [Firecrawl](https://www.firecrawl.dev/) - web scraping API for AI, AGPL-3.0
- [Firecrawl MCP Server](https://github.com/firecrawl/firecrawl-mcp-server) - official Claude Code MCP
- [Twitter Reader Claude Code Skill](https://github.com/daymade/claude-code-skills/blob/main/twitter-reader/SKILL.md) - dual Jina + twitter-cli approach
- [Jina vs Firecrawl comparison](https://blog.apify.com/jina-ai-vs-firecrawl/) - detailed analysis
- [How to Scrape X.com in 2026](https://scrapfly.io/blog/posts/how-to-scrape-twitter) - landscape overview
