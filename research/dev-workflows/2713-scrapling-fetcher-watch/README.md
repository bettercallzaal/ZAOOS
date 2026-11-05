---
topic: dev-workflows
type: evaluation
status: research-complete
last-validated: 2026-10-23
related-docs: "dev-workflows/306-web-scraping-ai-agents, 693, 730, 235, 562, 564, 822, 823"
original-query: "Scrapling (github D4Vinci/Scrapling), saved as a bookmark in 2026-02: is it worth adopting for ZOE ingest and research fetching?"
tier: QUICK
---

# 2713 - Scrapling: should ZAO adopt it as a fetcher?

> Author lane: bookmarks. Came out of Zaal's Chrome bookmarks review of 2026-10-23,
> where Zaal chose to have this written up as one held PR.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **WATCH, do not adopt now.** No new dependency until a specific fetch fails that Scrapling would fix. | ZAO's fetch problems are mostly IP-level blocks on Reddit and X (confirmed 2026-05-31: every curl, user-agent and exa route came back blocked from this machine). A scraping library on the same IP does not change who the firewall sees. The keyless trio (`zao-fetch-reddit.sh`, `zao-fetch-x.sh`, `zao-fetch-farcaster.sh`) and its healthcheck already cover the named sources. |
| 2 | **If a case appears, trial the plain HTTP `Fetcher` + parser + Markdown output first, with `robots_txt_obey` on.** | That path is a cheap, readable improvement over curl-and-strip for ordinary pages (CSS/XPath, adaptive element tracking, clean Markdown). It needs no browser. |
| 3 | **Do not use the CAPTCHA and Cloudflare bypass features.** | The README says the MCP server is built to "bypass any CAPTCHA" and that `StealthyFetcher` "can easily bypass all types of Cloudflare's Turnstile/Interstitial". Using that against a site that put the block up on purpose goes against that site's terms. That is a public-reputation risk for a public org, and it is the kind of call Zaal makes, not a lane. |
| 4 | **Do not install the MCP server into lanes yet.** | Docs 730 (`dev-workflows/730-claude-code-mcp-best-practices`) and 693 (`dev-workflows/693-zao-research-fetch-quality-audit`) already settled the fetch tool chain (exa `web_fetch` for JS pages; the Firecrawl question was reopened on the 2026-09-23 radar). Adding a third JS fetcher to the chain needs its own comparison with those two, not a drive-by install. |
| 5 | **If adopted, the license allows it with credit.** | BSD 3-Clause, read from the repo's LICENSE file ("BSD 3-Clause License / Copyright (c) 2024, Karim shoair"); PyPI metadata agrees. Keep the copyright notice, and add `adapted from D4Vinci/Scrapling (BSD-3-Clause)` at the use site (`credit-attribution.md`). |

## What it is (from the fetched sources)

- A Python scraping framework: "fast HTTP requests, stealth browsers, powerful parsing, and concurrent crawling into one library" (README).
- **Fetchers:** `Fetcher` makes HTTP requests that can impersonate a browser's TLS fingerprint and use HTTP/3. `StealthyFetcher` drives a full browser (Playwright Chromium or Chrome) with fingerprint spoofing and Cloudflare solving. Sessions persist.
- **Parsing:** CSS, XPath, text and regex search, adaptive element tracking (re-finds an element after the page changes), similar-element matching, clean Markdown output.
- **Spiders:** concurrent crawls, proxy rotation, retries, AutoThrottle, pause and resume, an optional `robots_txt_obey` flag, ready-made templates (CrawlSpider, SitemapSpider, feed spiders, ShopifySpider), JSON/JSONL/CSV/XML export.
- **AI:** an MCP server for agents (HTTP requests, browser actions, screenshots, saved login state, captured background API responses), plus an Agent Skill that teaches coding agents the current API.
- **Install shape:** the core needs only lxml, cssselect, orjson, tld and w3lib. The browser stack (curl_cffi, playwright, patchright, browserforge) comes in with the `fetchers` extra; `ai` adds `mcp>=2.0.0` and markdownify. Python >=3.10.

**Health, as of 2026-10-23 (GitHub API):** 89,319 stars, 9,212 forks, 16 open issues, created 2024-10-13, last push 2026-10-22, latest release v0.5 on 2026-10-17. Single author (copyright "Karim shoair"). It is actively maintained, but one person carries it, so there is bus-factor risk.

## What ZAO already has (searched 2026-10-23)

- `~/bin`: `zao-fetch-reddit.sh` (v5, OAuth-first with a browse fallback), `zao-fetch-x.sh` (v2, keyless, syndication), `zao-fetch-farcaster.sh`, `zao-fetch-hn.sh`, `zao-scrape-x-timeline.sh` (nitter RSS plus fxtwitter), and `zao-fetch-healthcheck.sh`, which asserts real content and exists because doc 564's "fixed" Reddit fetch quietly broke.
- ZAOOS research, `git grep -il` on origin/main: scrapling 0 files, crawl4ai 0, patchright 0, playwright 102, fxtwitter 70, zao-fetch 116, firecrawl 16, jina reader 14. The prior decisions are in `dev-workflows/306-web-scraping-ai-agents` (hosted APIs first, self-hosting skipped), 562 and 564 (Reddit/X scraping evaluation and fix), 693 (fetch quality audit), 730 (MCP best practices: skip Firecrawl, exa covers it) and the 2026-09-23 radar (reopen Firecrawl as a plugin).
- In code: `bot/`, `src/` and `scripts/` have 0 Scrapling hits; playwright appears in 4 files, jina in 2.

So Scrapling would be a fourth option next to exa, the keyless scripts and a reopened Firecrawl, not the first of its kind.

## Where it could actually help

1. **Ordinary pages that curl-and-strip handles badly** (heavy layout, content hidden under nav). Here `Fetcher` plus Markdown output is a real quality gain, and research grounding (`research-grounding.md`) wants raw text, not a WebFetch summary.
2. **Sites that changed layout and broke a selector** (adaptive tracking).
3. **Sitemaps and RSS walks** for a corpus ingest (Bonfire, the newsletter archive) with robots obeyed.

It does **not** fix: IP-level blocks (Reddit, X), anything that needs a logged-in account (that stays Zaal's browser), or JS apps where the content arrives only from an authenticated API.

## Next Actions

| Action | Owner | Type | By |
|---|---|---|---|
| Keep on WATCH; no install | lanes | none | - |
| If a research fetch fails on an ordinary public page, trial `pip install scrapling` (core only) in a scratch venv on that page, compare with curl-and-strip, and record both outputs | whichever lane hits it | trial | when it happens |
| Fold Scrapling into the Firecrawl re-look the 2026-09-23 radar asked for, so the fetch chain is decided once | research lane | research | Zaal's call |

## Sources

- **[FULL]** github.com/D4Vinci/Scrapling README, raw markdown via `gh api repos/D4Vinci/Scrapling/readme` (base64 decoded, 597 lines), 2026-10-23. 
- **[FULL]** GitHub REST `repos/D4Vinci/Scrapling` and `releases/latest`, 2026-10-23 (stars, forks, issues, dates, v0.5).
- **[FULL]** `repos/D4Vinci/Scrapling/contents/LICENSE`, base64 decoded, 2026-10-23 (BSD 3-Clause, copyright Karim shoair).
- **[FULL]** pypi.org/pypi/scrapling/json, HTTP 200, 2026-10-23 (version 0.5, requires_python >=3.10, BSD 3-Clause text, requires_dist).
- **[NOT FETCHED]** scrapling.readthedocs.io pages (MCP server, agent skill, choosing a fetcher). The claims above that cite them come from the README's own summary lines only.
- **[FULL, internal]** `~/bin` script headers (`sed` read), the 2026-05-31 Reddit/X block measurement, ZAOOS origin/main `git grep` counts and doc lines for 306, 693, 730 and the 2026-09-23 radar.

Credit: Scrapling is by Karim Shoair (D4Vinci), BSD-3-Clause.
