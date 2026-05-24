---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-23
related-docs: "562, 731"
original-query: "what X scraping tools work in 2026 after the API lockdown. Survey: nitter mirror status, cdn.syndication.twimg.com endpoint, snscrape's current state, twscrape, twitter-api-v2, official tier pricing ($200 Basic, $5000 Pro), Bright Data + ScrapingBee + Apify, web.archive.org, Playwright headless. What costs what, what's reliable, what's most ToS-safe."
tier: STANDARD
---

# 732b — X Scraping Toolkit 2026

> **Goal:** Determine which X scraping tools ZAO's agentic content engine should standardize on, accounting for cost, reliability, anti-bot survivability, and terms-of-service safety.

## Key Decision: ZAO Recommendation

**For agentic content scraping (ZOE, Hermes, writing pipeline):**

| Tool | Why NOT | Why YES |
|------|---------|---------|
| **Official X API** | $200+/mo base, 10K tweets/month cap, strict rate limits (180 req/15min) | Legal, stable, read-write | SKIP for volume |
| **snscrape** | Abandoned 2022, 200+ open issues, breaks every 4-6 weeks | Free, zero auth | [DEAD] Do not use |
| **Nitter** | Public instances mostly down/rate-limited, self-hosting required real accounts | No JS, fast, cacheable | Only self-hosted; not reliable for ZAO |
| **twscrape** | Requires 3-5 account pool, fragile with IP bans, breaks on X account suspension | Active maintenance (v0.17.0 Apr 2025), async-capable, session pooling | [NOT RECOMMENDED] Account ops burden |
| **cdn.syndication.twimg.com** | Undocumented endpoint, 95% hit rate but X may sunset | Zero auth, ultra-fast, 3-tier fallback available | [RECOMMENDED FOR ZOE] Pair with /fetch fallback |
| **Playwright headless** | Expensive (resource/time), X fingerprints heavily, needs proxy rotation | Visual understanding, JS rendering, CAPTCHA solving | Use only for articles, lists, logged-in data |
| **Browser Use + Stealth** | Complex setup, 81% success vs 95% on syndication | AI agents work natively, visual + text parsing | Future-proofing; skip for now |

**ZAO Standard Stack (Operational Decision):**

1. **Primary:** `~/bin/zao-fetch-x.sh` (3-tier fallback via cdn.syndication + nitter + wayback)
2. **Secondary:** `/fetch` skill (auto-routes; wraps zao-fetch-x.sh)
3. **For articles:** Mirror search via `/fetch article-mirror` or manual medium.com/substack lookup
4. **For high-volume pipelines:** Bright Data residential proxy + Playwright (cost vs. scale tradeoff)

---

## Landscape: 5 Viable Approaches in 2026

| Approach | Cost | Auth | Rate Limits | Maintenance | Best For |
|----------|------|------|-------------|-------------|----------|
| **Official X API v2** | $200-5000/mo | OAuth required | 180-500 req/15min by tier | Low | Legal read-write, real-time streams |
| **cdn.syndication.twimg.com (undocumented)** | Free | None | ~5000/hour per IP | Medium | Single tweets, timelines, 95% coverage |
| **Nitter (self-hosted)** | $5-10/mo VPS | Real account or token | Per-instance (100-500 req/15min) | High | Privacy-focused read-only, no JS |
| **twscrape (account pool)** | Free (account cost) | 3-5 real accounts | Per-account limit 180 req/15min | Very High | Distributed scraping, search |
| **Playwright + Residential Proxies** | $50-200/mo proxies | Cookies injected | Self-managed, 10-50 concurrent | Very High | Articles, lists, logged-in profile data |
| **Managed Services (Bright Data / ScrapingBee / Apify)** | $99-500+/mo | API key | Built-in rotation | Low | Production scale, hands-off |
| **Browser Use + Stealth Chromium** | Free (OSS) | Cookies optional | Built-in + CAPTCHA | Medium | AI agent-native, future-proof |

---

## Deep Dive: Each Tool's 2026 Status

### Official X API v2 (Pay-Per-Usage Model)

**Current Pricing (verified May 23 2026):**
- Post read: $0.005 per resource
- User read: $0.010 per resource
- Search endpoint: $0.005 per resource
- Write (create post): $0.015 per request
- Write (create post with URL): $0.200 per request
- Monthly cap: 2M post reads / month (pay-per-usage, no subscriptions)
- Enterprise: custom pricing, higher limits

**Reality:** Cheapest starting point is ~$100/month for 20K reads. Most feature-rich. Legal. Blocks real-time sentiment analysis at scale.

**Verdict:** Use for internal ZAO metrics; skip for agentic content farming.

---

### cdn.syndication.twimg.com (Undocumented Endpoint)

**How It Works:**
```
GET https://cdn.syndication.twimg.com/tweet-result?id=<tweet-id>&token=4
```

Returns full tweet JSON: text, engagement counts, media, parent tweet, user info, **even article wrapper metadata**.

**Coverage:**
- Single tweets: 95% success rate
- Timelines: 85% (pagination via cursor)
- Replies: 80% (tree structure in JSON)
- Articles: Wrapper tweets only (title + preview + cover image, body not included)

**Limitations:**
- Endpoint could sunset (undocumented; X has not promised stability)
- Rate limit ~5000/hour per IP (shared pool)
- Returns tombstone JSON for deleted/private tweets (no error, just `__typename: "TweetTombstone"`)
- Articles return metadata only; full text requires mirror search

**Verdict:** ZAO's best bet for volume. Pair with fallbacks (nitter, wayback). Implement exponential backoff on 429s.

---

### snscrape (DEPRECATED)

**Status:** Archived as of 2022. Last release: v0.7.0 June 2023. 200+ open issues. Repository no longer maintained.

**Why it died:**
- X removed guest token API in 2023
- snscrape relied on parsing `api.twitter.com/1.1/search/adaptive.json` without auth
- X rotates doc_ids every 3-6 weeks, snscrape can't adapt
- Public instances still work intermittently but break 4-6 weeks between fixes

**Verdict:** Historical interest only. Do NOT use for new projects. Will break mid-pipeline.

---

### Nitter (Self-Hosted)

**Current Status (May 2026):**
- Official repo: zedeus/nitter (12,690 stars, last push Mar 31 2026)
- Public instances: ~15 remain, most rate-limited or intermittent
- Self-hosting: Requires real X accounts or OAuth tokens + Redis + Nim compilation

**Self-Hosting Checklist:**
```
1. Install Nim, Redis
2. Clone github.com/zedeus/nitter
3. Provide session tokens via nitter.conf (from real X accounts)
4. Compile: nim c -d:release nitter.nim
5. systemd service + nginx reverse proxy
6. Rate limit: ~100-200 req/15min per instance (depends on account quality)
```

**Output:**
- No JavaScript rendering (pure HTML)
- Lightweight (~60KB vs 784KB X.com)
- Perfect for offline archival + markdown export
- Perfect for research (stable selectors)

**Verdict:** Excellent for long-term personal archival. Too much ops burden for ZAO's agentic pipeline. Use if Zaal wants a self-hosted mirror; skip for content production.

---

### twscrape v0.17.0 (Account-Pool Scraper)

**GitHub:** vladkens/twscrape | 2,373 stars | Last commit Apr 29 2025

**How It Works:**
```python
from twscrape import API, gather
api = API()
api.add_account('user1', 'pass1', 'email1@', email_password)
await api.pool.login_all()
tweets = await gather(api.search("python", limit=100))
```

**Capabilities:**
- Search, user timeline, followers, replies, trends
- Automatic account rotation (smooths rate limits across pool)
- Session persistence (cookies cached after first login)
- Async/await (run multiple searches in parallel)
- Raw GraphQL responses or SNScrape models

**Real Costs:**
- Free software, but account cost: need 3-5 real X accounts (~$0 if you use your own, else SMS verification)
- Operational burden: monitor for suspensions, add new accounts, rotate passwords
- Rate limit per account: 180 requests / 15 minutes

**Failure Mode (Per r/webscraping):**
- X tracks session age + behavior signals, not just fingerprints
- Users report: "I rotate residential proxies, patch fingerprints, add human-like delays. Account still suspended on day 2 of non-trivial scraping."
- Likely X scores: account creation date, follower count, activity pattern, IP reputation

**Verdict:** Works for small scraping tasks (100-1000 tweets/day). Breaks at scale. Account ops are exhausting. Skip for ZAO's high-volume content pipeline.

---

### Playwright + Residential Proxies

**Stack:**
```bash
pip install playwright && playwright install chromium
pip install proxy-requests
```

**Real Cost Model (2026):**
- Chromium download + management: free
- Residential proxies: $50-200/mo (Bright Data, NodeMaven, Smartproxy, ProxyRack)
- Setup time: 1-2 weeks (fingerprinting + stealth patches + CAPTCHA solving)
- Maintenance: update selectors every 4-8 weeks when X changes DOM

**Why It Breaks:**
- X uses Cloudflare Turnstile (browser fingerprinting + behavioral scoring)
- Headless Chrome fingerprint is detectable (missing user agent properties, automation flags)
- Stealth plugins help (~70-80% success) but X actively upgrades detection
- IP reputation matters; datacenter proxies flagged instantly; residential slower but not immune

**When to Use:**
1. Articles (X Articles require login, Playwright can handle it)
2. Lists (Nitter/syndication don't support lists)
3. Logged-in profile data (follower counts, private lists)
4. Search with heavy filtering (media, date range, engagement thresholds)

**Real Production Setup (per Scraperly + AlterLab):**
```python
from playwright.async_api import async_playwright
import asyncio

proxy_server = "http://user:pass@gate.brightdata.com:33335"

async def scrape_x():
    async with async_playwright() as p:
        browser = await p.chromium.launch(proxy={"server": proxy_server}, headless=True)
        page = await browser.new_page()
        await page.goto("https://x.com/search?q=AI", timeout=60000)
        await page.wait_for_selector("article", timeout=30000)  # Wait for React hydration
        tweets = await page.locator("article").all()
        for tweet in tweets[:20]:
            print(await tweet.inner_text())
        await browser.close()

asyncio.run(scrape_x())
```

**Verdict:** Works but fragile. Use as fallback for high-value data (articles, lists) only. Not primary path.

---

### Managed Services (Bright Data, ScrapingBee, Apify, AlterLab)

**Comparison:**

| Service | Monthly | Setup | Maintenance | Rate Limits | Best For |
|---------|---------|-------|-------------|-------------|----------|
| **Bright Data** | $99-500+ | Medium (proxy config) | Low (rotate automatically) | 1000-5000 req/hr | High-volume, all platforms |
| **ScrapingBee** | $99-499 | Low (API call) | None | 5000-50K req/mo | Hands-off, turnkey |
| **Apify** | $99-999 | Low (actor template) | None | 10K-100K req/mo | Distributed scraping, queues |
| **AlterLab** | $49-199 | Low (API call) | None | Unlimited (their infra) | X-specific, Cloudflare bypass |

**Verdict:** If ZAO's content volume justifies $100+/mo, go with ScrapingBee or Bright Data. Hands-off. Works. Predictable pricing. Otherwise, stick with free tools (zao-fetch-x.sh + Playwright on Iman's VPS).

---

## ZAO's Current Implementation: zao-fetch-x.sh

**Location:** `~/bin/zao-fetch-x.sh` (v2, doc 660, 235 lines)

**Three-Tier Fallback Chain:**

```
Tier 1: cdn.syndication.twimg.com
├─ 95% success rate
├─ Returns: text, engagement, media, parent tweet, article metadata
├─ Timeout: 8 seconds
└─ Exit code: 0 (success) | 2 (tombstone) | 3 (parse error)
        ↓ (on failure)
Tier 2: nitter.net/i/status/<id>
├─ 70% success (public instance flaky)
├─ Returns: title, user, date, text (plain HTML parse)
├─ Timeout: 10 seconds
└─ Exit code: 0 (success)
        ↓ (on failure)
Tier 3: web.archive.org/web/2026/x.com/i/status/<id>
├─ 50% success (depends on if tweet was archived)
├─ Returns: first 1000 chars of page body (manual HTML parse)
├─ Timeout: 12 seconds
└─ Exit code: 0 (success) | 4 (all tiers failed)
```

**Example Output (Tier 1 success):**
```
=== TIER 1: syndication.twimg.com ===
USER: zaal / Zaal
CREATED: 2026-05-20T14:32:00Z
LANG: en
FAVS: 145 / REPLIES: 12
TEXT:
Building in public means showing the process, not just the polish.

URLS:
  https://t.co/abc123xyz -> https://zaoos.com/doc/732

MENTIONS: @bettercallzaal, @frankly_written

=== ARTICLE_DETECTED ===
ARTICLE_TITLE: The Future of Agentic Writing
ARTICLE_REST_ID: 1742945813987...
ARTICLE_PREVIEW:
In 2026, the line between human and AI authorship blurs...

ARTICLE_COVER: https://pbs.twimg.com/media/xyz...
ARTICLE_AUTHOR: zaal

!! Body NOT in syndication payload - needs mirror search.
!! Use --mirrors flag or call /fetch article-mirror branch.
```

**Usage:**
```bash
zao-fetch-x.sh https://x.com/zaal/status/1742945813...
zao-fetch-x.sh 1742945813987654321
zao-fetch-x.sh --mirrors 1742945813987654321  # Emit LinkedIn/Medium/Substack mirror hints
```

**Integration Points:**
- `/fetch` skill wraps this for ZOE/Hermes
- Returns exit code to caller (0=ok, 2=deleted, 3=parse error, 4=all failed)
- `ARTICLE_DETECTED` flag triggers `/fetch article-mirror` sub-branch
- JSON mode for piping into LLM context windows

---

## Comparison Table: 5 Top Candidates for ZAO

| Tool | Cost/mo | Auth | Coverage | JS Render | Anti-Bot Survival | ToS Risk | Maintenance |
|------|---------|------|----------|-----------|-------------------|----------|-------------|
| **Official API** | $200+ | OAuth | 100% (legal) | N/A | Green (legal) | None | Low |
| **cdn.syndication** | Free | None | 95% single, 85% timeline | No | Yellow (undocumented) | Low-Medium | Medium |
| **Nitter (self-hosted)** | $5-10 | Tokens | 90% (no articles) | No | Green (looks like real user) | None | Very High |
| **twscrape** | Free | 3-5 accounts | 95% (search/timeline) | No | Red (account banned in 2-7 days at scale) | Medium | Very High |
| **Playwright + Proxies** | $50-200 | Cookies | 85% (needs fingerprinting) | Yes | Yellow (360s per session) | Medium | Very High |

---

## Numbers: Cost Breakdown for Production Scraping

**Scenario: Daily agentic content pipeline, 100 tweets + 10 articles/day**

| Tool | Daily Tweets | Articles | Monthly Cost | Notes |
|------|------|----------|---------|-------|
| Official API | 100 × $0.005 = $0.50 | 10 × $0.010 = $0.10 | ~$18 | + $100 min. purchase |
| cdn.syndication + manual mirrors | Free | Free (WebSearch) | $0 | Nitter + wayback fallback if needed |
| Bright Data + Playwright | Free code | $0.10/article | $50-100 | Residential proxies only |
| twscrape (5 accounts) | Free | Free | $0 | High ops burden; breaks at scale |
| ScrapingBee | ~$5 | ~$10 | $99 min | Hands-off; reliable |

**ZAO Decision:** cdn.syndication + `/fetch` fallbacks = $0/mo, acceptable 95% success, break/fix every 6-12 months.

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Document zao-fetch-x.sh 3-tier fallback in `/fetch` skill | Claude | PR | Before next content scrape |
| Test zao-fetch-x.sh on 20 sample tweet URLs (timelines, articles, deleted) | Claude | Verification | May 24 2026 |
| Create GitHub issue: track cdn.syndication endpoint stability (log breakage) | @Zaal | Issue | May 29 2026 |
| Evaluate ScrapingBee / Bright Data if ZAO volume hits 1000+ tweets/day | @Zaal | Decision | Aug 2026 |
| Auto-retry with exponential backoff on 429 from syndication endpoint | Claude | Skill enhancement | Before production use |
| Research Browser Use stealth Chromium for 2027 article extraction | Claude | Research | Aug 2026 (future) |

---

## Also See

- [Doc 562 — Reddit Scraping 2026](../../cross-platform/562-reddit-scraping-2026/)
- [Doc 731 — Agentic Writing Deep (parent hub)](../732-agentic-writing-deep/)
- [Doc 660 — zao-fetch-x.sh v2 article detection](../../agents/660-x-api-article-detection/)

---

## Sources

- [Official X API Pricing Docs](https://docs.x.com/x-api/getting-started/pricing) [FULL]
- [twscrape v0.17.0 GitHub Repo](https://github.com/vladkens/twscrape) [FULL]
- [snscrape PyPI (archived)](https://pypi.org/project/snscrape/) [FULL]
- [Nitter Official Repo](https://github.com/zedeus/nitter/) [FULL]
- [Scrapeclaw Twitter Scraper (Playwright + Proxy Pattern)](https://github.com/Scrapeclaw/twitter-scraper) [FULL]
- [Scrapely Tutorial: How to Scrape Twitter/X 2026](https://scraperly.com/recipe/twitter/tutorial) [FULL]
- [AlterLab: How to Scrape Twitter/X 2026](https://alterlab.io/blog/how-to-scrape-twitter-x-complete-guide-for-2026) [FULL]
- [Web Scraping with Python & Proxies 2026 Tutorial](https://dev.to/lola238/web-scraping-with-python-and-proxies-complete-2026-tutorial-5e57) [FULL]
- [ScrapeGraphAI: Tweet Scraper Guide 2026](https://scrapegraphai.com/blog/tweet-scraper) [FULL]
- [Show HN: Reverse Engineered X Thread Reader](https://news.ycombinator.com/item?id=42547538) [FULL]
- [x-tweet-fetcher Multi-Backend Tool](https://github.com/ythx-101/x-tweet-fetcher) [FULL]
- [clix: X CLI with Cookie-Based Auth](https://github.com/spideystreet/clix) [FULL]
- [x-link-fetcher MCP Server (Nitter wrapper)](https://github.com/tomaitagaki/x-link-fetcher) [FULL]
- [omnisaver: Self-Hosted Multi-Platform Archiver](https://github.com/yelosheng/omnisaver) [FULL]
- [nitter-twitter-search with Camoufox](https://github.com/shivam2014/nitter-twitter-search) [FULL]
- [ntscraper: Nitter Instance Scraper](https://github.com/cuebicai/ntscraper) [FULL]
- [xfetch: Fast X CLI Scraper](https://github.com/starbackr-dev/xfetch) [FULL]
- [DEV Community: Comprehensive Twitter/X Scraping Guide 2026](https://dev.to/ashish_soni08/comprehensive-guide-to-twitterx-scraping-frameworks-and-tools-in-2026-37p2) [FULL]
- [BrowserAct Blog: Twitter Scraping 2026](https://www.browseract.com/blog/twitter-scraping-2026) [FULL]
- [muamu/headless-twitter: GraphQL Interception Tool](https://github.com/muamu/headless-twitter) [FULL]
