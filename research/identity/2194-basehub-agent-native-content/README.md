---
topic: identity
type: market-research
status: research-complete
last-validated: 2026-08-04
superseded-by:
related-docs: 1016, 1021
original-query: "https://basehub.org/"
tier: STANDARD
---

# 2194 - BaseHub: agent-native content (basehub.org) vs the AI-native CMS (basehub.com)

> **Goal:** Zaal sent `basehub.org`. It turns out to be TWO different things under one name - decide what, if anything, ZAO adopts from each.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **ADOPT the basehub.org agent-native-docs PATTERN for ZAO's GEO surfaces** - `llms.txt` + `llms-full.txt` + `.md`-on-every-URL + a `/api/pages.json` manifest + an MCP server. This is a working reference implementation of exactly the "own what-is-The-ZAO for agents" priority. | It is the concrete shape of ZAO's top-priority GEO goal ([[project_geo_zao_iconic]]) and the ICM-box strategy ([[project_icm_boxes]], `icm-grounding.md`). basehub.org proves the pattern on Base's own docs. |
| 2 | **basehub.org is NOT a product to buy - it is an open-source (MIT) Base docs site to LEARN FROM (and cite).** Do not confuse it with basehub.com. | `.org` = "Reference for Agents on Base" (a content site). `.com` = a paid CMS. Different companies-of-intent, same name. |
| 3 | **basehub.com (the CMS) is a MAYBE for thezao.com content, not now.** It is a strong AI-native/git-for-content headless CMS ($12-29+/user), but ZAO's sites already run Next.js + Supabase + ICM boxes; a new CMS is an "ask first" dependency with no current pain it solves. | `code-restraint.md` rung 1 (does this need to exist?) + CLAUDE.md "ask first: new dependencies". Revisit only if thezao.com content editing becomes a real bottleneck. |

## The disambiguation (the whole point of this doc)

Zaal sent `basehub.org`. Fetching it reveals the `.org`/`.com` split is real and load-bearing:

| | **basehub.org** (what Zaal sent) | **basehub.com** |
|---|---|---|
| What | "Reference for Agents on Base" - an open docs site | "The AI-Native Headless CMS" |
| Purpose | Make Base's docs consumable by AI agents | Sell a fast, collaborative, git-for-content CMS |
| License / model | MIT, open-source, free | Paid SaaS; Personal free tier, Team from $29 |
| Agent surface | `llms.txt`, `llms-full.txt`, `.md` on every URL, `/api/pages.json`, MCP server `@wbnns/base-mcp`, RSS feeds | GraphQL API + typesafe TS SDK (`x-basehub-token` header) |
| Relevance to ZAO | HIGH - it is the GEO/agent-native pattern ZAO wants | Medium - a candidate CMS, no current need |

## Findings

### basehub.org - the agent-native pattern (FULL, the useful part)

Self-description (verbatim, `/llms.txt`): "BaseHub - reference for agents on Base. Every page is reachable as raw Markdown by appending .md to the URL." The full mechanism:

- **`.md` on any URL** - e.g. `/introduction/why-base.md` returns raw Markdown of that page. Zero extra infra; agents get clean text.
- **`/llms-full.txt`** - the entire corpus in one file for a single agent fetch.
- **`/api/pages.json`** - a JSON index of every page (machine-enumerable sitemap).
- **MCP server** - published on npm as `@wbnns/base-mcp`, so an agent can tool-call the corpus.
- **Mirrored live feeds** - `/feeds/blog.xml` (Base engineering blog) + `/feeds/status.xml` (Base statuspage) folded into the same site.

Content covered: Base network params, Flashblocks (200ms preconfirmations, 10x faster than the 2s block cadence), the full JSON-RPC API reference, node operation, and "seventy-plus Rust crates" in `base/base`. This is a curated, agent-first mirror of Base's docs - not a CMS.

**Why this is the ZAO lesson:** ZAO already has the upstream truth (ICM boxes, `useicm.com/api/objects/<id>/llm.txt`) and a GEO priority to own "what is The ZAO" for agents. basehub.org shows the DOWNSTREAM surface shape: a site where every page is `.md`-addressable, a `llms-full.txt` corpus, a JSON page index, and an MCP server. ZAO's sites (thezao.com, the ICM boxes) should generate exactly these from the box-as-source-of-truth (`icm-grounding.md`: box upstream, surfaces generated).

### basehub.com - the AI-native CMS (PARTIAL, secondary)

- Positioned as "git for structured content": changes are immutable snapshots ("commits"), linear history, with branching / diffing / merging and eventual "Content Requests" (their "Pull Requests").
- Editor "feels like a Notion document" (press `/` for blocks, drag-drop, @-mention teammates); content is queried via a **typesafe GraphQL SDK** (`<Pump queries={[...]}>` React pattern) or any GraphQL client.
- Built by the team behind basement.studio. Stack (per Neon case study, FULL): Next.js frontend, Vercel deploy, **Neon** serverless Postgres (moved off Supabase for compute autoscaling; branches spin up in "under 500 ms"), Drizzle ORM, Cloudflare Workers via the Neon serverless driver.
- Pricing (per their Public-Beta post): Personal free (375 blocks, then $2.5/125; 75k API req, then $2.5/25k). Team from $29 (unlimited users). A separate "for teams" tier is quoted at **$12/user** with 500,000 API requests + 500GB asset storage. (Two pricing snapshots disagree on the exact block/req allowances - pricing is in flux; verify at basehub.com/pricing before any decision.)
- Category peers: Contentful (Basic ~$300/mo, founded 2013 Berlin), Sanity ($15/seat/mo, founded 2017 Oslo). basehub.com is the newer, indie, AI-native entrant.

### Community signal (thin - stated honestly)

There is **no basehub-specific Hacker News or Reddit thread** surfaced (the product is new/niche). General HN "Ask HN: headless CMS" threads exist and the directional sentiment is consistent with basehub.com's own pitch: developers dislike slow, single-player CMS web apps and value data ownership + git-checkable content. This is category context, not basehub-specific validation - treat basehub.com's DX claims as vendor claims until a real user thread appears.

## ZAO codebase grounding

- No `basehub` reference exists in `research/` or `src/` (grep, 2026-08-04) - this is net-new.
- The relevant existing ZAO ground truth is the ICM/GEO stack, not a CMS: `.claude/rules/icm-grounding.md` (box = upstream, surfaces generated), the ICM boxes (`useicm.com/api/objects/<id>/llm.txt`), and the GEO priority ([[project_geo_zao_iconic]], docs 1016/1021). basehub.org is the surface pattern those should generate INTO.

## Also See

- [[project_geo_zao_iconic]] - GEO = own "what is The ZAO" (top priority this maps to)
- [[project_icm_boxes]] - ICM boxes = ZAO's AI-readable upstream context
- `.claude/rules/icm-grounding.md` - box upstream, generate surfaces outward (the rule basehub.org exemplifies)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `llms.txt` + `llms-full.txt` + a `/api/pages.json` manifest to thezao.com, generated from the ICM `thezao` box (basehub.org pattern) - shipped when the three URLs return 200 with real content | @Zaal | PR | 2026-08-18 |
| Make every thezao.com content page `.md`-addressable (append `.md` -> raw Markdown), so agents get clean text - shipped when one page's `.md` variant resolves | @Zaal | PR | 2026-08-25 |
| Decide GO/NO-GO on evaluating basehub.com as thezao.com's CMS (default NO-GO unless content-editing is a real bottleneck) - decided when this doc's Decision #3 is confirmed or overturned | @Zaal | Decision | 2026-08-11 |

## Sources

- [basehub.org - Reference for Agents on Base](https://basehub.org/) - [FULL] homepage, fetched 2026-08-04
- [basehub.org/llms.txt](https://basehub.org/llms.txt) - [FULL] the agent feed itself (the load-bearing source)
- [basehub.com - The AI-Native Headless CMS](https://basehub.com/) - [PARTIAL] highlights only (marketing copy + code sample; full page not rendered)
- [Neon: Meet BaseHub - Developer Velocity Right Down to the Database](https://neon.com/blog/meet-basehub-developer-velocity-and-efficiency-right-down-to-the-database) - [FULL] basehub.com stack (Neon/Next.js/Vercel/Drizzle/Cloudflare), 2024-09-10
- [BaseHub Is Now Open for Everyone (Public Beta blog)](https://basehub.com/blog/basehub-is-now-open-for-everyone) - [PARTIAL] highlights: pricing + "git for structured content" positioning
- [BaseHub vs Contentful / vs Sanity - Startup Alternatives](https://startupalternatives.com/compare/basehub-vs-contentful) - [PARTIAL] category pricing comparison
- [apis.io - BaseHub API provider](https://apis.io/providers/basehub/) - [PARTIAL] GraphQL API metadata (`api.basehub.com/graphql`, `x-basehub-token`)
- [Ask HN: What headless CMS do you recommend?](https://news.ycombinator.com/item?id=16636517) - [PARTIAL] category sentiment only; no basehub-specific thread found
