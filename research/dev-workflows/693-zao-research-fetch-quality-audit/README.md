---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-20
related-docs: 674, 683, 690, 691
tier: STANDARD
---

# 693 - /zao-research Fetch-Quality Audit: Why We Miss Info, and the Fix

> **Goal:** Find why links Zaal forwards lose information when researched, and fix the /zao-research skill so a source is fully read before a doc is written.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | DELETE every "firecrawl" reference in the /zao-research skill - it is not installed | The skill names firecrawl as the JS-rendering tool and the paywall fallback. `ToolSearch "firecrawl"` returns nothing. When WebFetch fails on a JS page, the prescribed escalation tool does not exist, so research silently drops to WebSearch snippets. |
| 2 | REPLACE the tool chain with what is actually installed: WebFetch -> `mcp__plugin_everything-claude-code_exa__web_fetch_exa` -> Playwright MCP / `/browse` skill -> Wayback Machine | These render JavaScript and exist right now. exa web_fetch returns clean markdown and batches URLs; Playwright is a full browser for Notion/X. |
| 3 | ADD a Fetch-Quality Gate before any doc is written: classify every source FULL / PARTIAL / FAILED; PARTIAL or FAILED must be escalated through the full chain or explicitly marked in the doc | This session shipped 4 docs written off metadata, search snippets, or 404s without escalating. The gate makes that impossible to do silently. |
| 4 | ADD a per-source fetch-quality marker to every doc's Sources section | A reader cannot currently tell whether a cited source was fully read or just its title. Doc 690 was honest ("0/5 article bodies"); most docs are not. |
| 5 | ADD a depth rule: a high-signal single source (long technical post, 500+ upvotes, a real playbook/spec) gets its own depth treatment, not one row in a synthesis table | Cluster-and-synthesize (docs 687-691) is right for breadth but compresses a deep source to a sentence. Depth and breadth are different jobs. |

## The Honest Audit: What This Session Missed

Reviewing docs 674-691 (this session's output) against what was actually fetched:

| Doc | Source that was NOT fully read | What happened | What should have happened |
|-----|-------------------------------|---------------|---------------------------|
| 674 Edge Esmeralda | The Edge Esmeralda Notion wiki (the actual link Zaal sent) | WebFetch returned an empty Notion app shell. Doc was written from WebSearch results instead. The wiki's schedule, sessions, participation details, attendee list - never read. | exa web_fetch_exa or Playwright renders Notion. Not tried. |
| 683 Artizen | The "Artizen Playbook" + "Guide to Raising Money" (news.artizen.fund) | Both URLs 404'd on WebFetch; artizen.fund 403'd. Doc was synthesized from Gitcoin + search snippets. The playbook - a guide to the exact platform Zaal runs a fund on - went unread. | Wayback Machine for the 404s; exa fetch for the 403. Not tried. |
| 690 X posts | 4 of 5 forwarded X posts | Only tweet titles + favorite counts came through the syndication endpoint. The doc itself states "Posts with full article bodies retrievable: 0/5". It is a doc about 5 headlines. | X long-form articles need a headless browser (Playwright). zao-fetch-x.sh gets tweet text only, not article bodies. Not escalated. |
| 691 Spotify episode | open.spotify.com episode 69LleBwkRozkLAhbsxaCUC | Reported "unreachable, episode ID not found" and SKIP. A podcast episode Zaal flagged - zero capture. | Playwright loads the Spotify web player; episode metadata is also searchable by ID. Not tried. |
| 687-689 Reddit clusters | Deep comment threads | post selftext + top ~5 comments parsed. Nested threads where dissent and nuance live - only partially walked. | zao-fetch-reddit.sh returns the full tree; walk it, do not stop at top-level. |

## Root Cause

Two compounding failures:

1. **The escalation path is broken.** The skill's "MCP Tool Order" lists firecrawl as step 3 (JS rendering, paywalls) and the failure-mode table says "Use firecrawl MCP with JS rendering fallback." Firecrawl is not installed. So the documented escalation is a dead end - and with no live escalation, the researcher falls back to WebSearch snippets and writes the doc anyway.

2. **No gate forces full retrieval before synthesis.** Nothing in the skill says "you may not write the doc until every source is FULL or explicitly marked." So a thin fetch flows straight into a thin doc. The skill's hallucination check (Step 6) checks whether URLs *resolve* - not whether their *content was actually read*.

The result: when a fetch is hard, the doc gets written off whatever scraps came back. The information loss is invisible because the doc still cites the URL.

## External Best Practices (2026)

- **Verification catches AI research errors 15-20% of the time** - multi-step verification is not optional; standard LLM synthesis forms echo chambers around whatever the first fetch returned.
- **Even the best deep-research agents have a citation-content gap** - OpenAI Deep Research: ~95% of citations identifiable, only ~70% completely correct. Citing a URL is not the same as having read it.
- **JS-rendered pages require headless browser rendering** (waitForSelector / DOM-ready). React/Vue/Angular sites and Notion return an empty shell to plain HTTP fetches.
- **X is a full React SPA behind Cloudflare + a login wall** - headless browser rendering is called "non-negotiable" for X article bodies. Syndication endpoints expose tweet text, not long-form articles.

## The Real Tool Chain (Installed + Verified 2026-05-20)

| Need | Tool | Status |
|------|------|--------|
| Plain article / HTML | WebFetch | installed |
| JS-rendered page, clean markdown, batch URLs | `mcp__plugin_everything-claude-code_exa__web_fetch_exa` | installed - this is the real firecrawl replacement |
| Semantic web search | `mcp__plugin_everything-claude-code_exa__web_search_exa` + WebSearch | installed |
| Full browser render (Notion, X articles, Spotify, login walls) | Playwright MCP (`mcp__playwright__*`) or `/browse` + `/gstack` skills | installed |
| Reddit | `~/bin/zao-fetch-reddit.sh` (full post + comment tree as JSON) | installed |
| X / Twitter tweets | `~/bin/zao-fetch-x.sh` (syndication -> nitter -> wayback) | installed - tweets only, NOT article bodies |
| Dead / 404 / moved URLs | Wayback Machine (`web.archive.org/web/<url>`) | available |
| firecrawl | - | NOT installed - remove from skill |

## The Fix: /zao-research Skill Changes

Applied to `~/.claude/skills/zao-research/SKILL.md` in this session:

1. **New Step 4.5 - Fetch-Quality Gate.** After fetching, before writing: classify each source FULL (content fully read) / PARTIAL (some content, some missing) / FAILED (nothing). Any PARTIAL or FAILED must be escalated through the full tool chain. Only after escalation is exhausted may a source stay PARTIAL/FAILED - and then it must be marked in the doc.
2. **Rewritten MCP Tool Order** - firecrawl removed; exa web_fetch + Playwright + Wayback put in its place, with a per-source-type escalation ladder (Notion/JS -> exa fetch or Playwright; X articles -> Playwright; dead URLs -> Wayback; Reddit -> full comment tree; media -> Playwright or metadata search).
3. **New Hard Requirement #11** - Sources section marks each source `[FULL]`, `[PARTIAL - what is missing]`, or `[FAILED - what was tried]`.
4. **Depth rule** added to tier guidance - a high-signal single source is not compressed into a synthesis-table row.

## Sources

- [The 2026 Deep Research AI Protocol](https://zeroskillai.com/deep-research-ai-protocol-2026/)
- [Best AI Deep Research Tools in 2026 (DeepWriter)](https://deepwriter.com/blog/best-ai-deep-research-tools-in-2026/)
- [Best Ways to Scrape JavaScript-Heavy Sites in 2026 (Bright Data)](https://brightdata.com/blog/web-data/scraping-js-heavy-websites)
- [How to Scrape X.com in 2026 (Scrapfly)](https://scrapfly.io/blog/posts/how-to-scrape-twitter)
- [Comprehensive Guide to Twitter/X Scraping 2026 (DEV)](https://dev.to/ashish_soni08/comprehensive-guide-to-twitterx-scraping-frameworks-and-tools-in-2026-37p2)

## Also See

- [Doc 674](../../events/674-edge-esmeralda-artizen-telamon-outreach/) - Notion wiki never read
- [Doc 683](../../business/683-artizen-platform-fund-director-guide/) - Artizen Playbook 404'd, not recovered
- [Doc 690](../../agents/690-inbox-x-posts-roundup-may2026/) - 0/5 X article bodies fetched

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Apply the 4 skill changes to ~/.claude/skills/zao-research/SKILL.md | @Claude | Skill edit | This session |
| Re-research the 3 thin docs with the real tool chain: 674 Notion wiki, 683 Artizen Playbook, 690 X article bodies | @Zaal decision | Re-research | On approval |
| Add the same Fetch-Quality Gate to the /inbox cluster workflow | @Claude | Skill edit | After this doc |
| Spot-check: did installing exa MCP remove the need for the `/fetch` skill's manual routing? | @Zaal | Decision | Next research session |
