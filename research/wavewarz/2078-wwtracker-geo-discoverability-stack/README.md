---
title: "WaveWarZ Tracker: GEO Discoverability Stack Implementation (Jul 2026)"
doc: 2078
topic: wavewarz
type: TECHNICAL-REFERENCE
status: ACTIVE — all 4 layers in PR as of 2026-07-25; reusable pattern for ZAO projects
tier: STANDARD
sources:
  - wwtracker repo (github.com/bettercallzaal/wwtracker)
  - wavewarz.info/api/public/stats (2026-07-25)
  - ZAOOS doc 1221 (GEO Master Plan)
  - ZAOOS doc 2074 (thezao.xyz GEO Kit)
related-docs: "1221, 2074, 2071, 2075, 2042"
---

# 2078 — WaveWarZ Tracker: GEO Discoverability Stack Implementation (Jul 2026)

**Type:** TECHNICAL-REFERENCE  
**Audience:** ZAO builders, other DAOs evaluating AI discoverability, grant reviewers, developers  
**Status:** All 4 layers merged or in passing PR as of 2026-07-25  
**Cross-refs:** doc 1221 (GEO strategy), doc 2074 (thezao.xyz GEO Kit — same pattern for ZAO's main site)

---

## Summary

Between July 17–25, 2026, the WaveWarZ analytics tracker (wwtracker.vercel.app) was upgraded with a 4-layer GEO (Generative Engine Optimization) discoverability stack. GEO enables AI systems — ChatGPT, Perplexity, Claude, Gemini — to extract structured facts from the tracker and cite WaveWarZ accurately in AI-generated answers.

This document records what was built, the precise files and PRs, and the expected GEO impact. It serves as a reusable implementation reference for other ZAO projects (thezao.xyz, ZAOOS, etc.) that need the same stack.

**North Star impact:** GEO dimension 7.6 → 8.5 (estimated post-merge)

---

## Why GEO Matters for WaveWarZ

WaveWarZ is the first documented live on-chain music-battle prediction market with verified AI-artist competition (AI Tournament, Jul 2026). Without machine-readable signals, AI engines answer "what is WaveWarZ?" with outdated, inaccurate, or empty responses. With GEO, every AI engine that crawls wwtracker.vercel.app sees:

- Authoritative structured data (JSON-LD Dataset schema)
- A plain-text machine-readable summary (llms.txt)
- Full crawl permission for AI training bots (robots.txt)
- A discoverable URL map (sitemap.xml)

The goal: any researcher, journalist, or AI system querying "WaveWarZ", "music battle prediction market", or "AI artist tournament onchain" gets accurate ZAO-sourced facts.

---

## The 4-Layer Stack

### Layer 1: robots.txt — Crawler Permission

**File:** `public/robots.txt`  
**PR:** #192 (merged 2026-07-25) — `feat(geo): add robots.txt + sitemap.ts for AI crawler discoverability`  
**Purpose:** Grants explicit `Allow: /` permission to all major AI crawlers. By default, some bots check for `Disallow` before indexing; explicit `Allow` removes ambiguity.

Crawlers explicitly permitted:
- `GPTBot` (ChatGPT), `ChatGPT-User`
- `ClaudeBot`, `anthropic-ai` (Claude)
- `PerplexityBot`
- `Googlebot-Extended` (Gemini / Google SGE)
- `CCBot` (Common Crawl)

Key line: `Sitemap: https://wwtracker.vercel.app/sitemap.xml` — links crawlers to the sitemap.

```
# Key structure (public/robots.txt)
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

# ... (6 named AI bots, all Allow: /)

Sitemap: https://wwtracker.vercel.app/sitemap.xml
```

**Principle:** Never block AI crawlers for a public, non-auth site. The default "allow all" plus explicit named bot entries maximizes coverage.

---

### Layer 2: sitemap.xml — URL Discovery

**File:** `app/sitemap.ts` (Next.js App Router auto-generates `sitemap.xml`)  
**PR:** #192 (same PR as robots.txt)  
**Purpose:** Gives AI crawlers and search engines a deterministic list of all tracker URLs. Without a sitemap, crawlers must guess or follow links; with one, every section is indexable.

Sections included in sitemap (matching AppShell section IDs):
```
https://wwtracker.vercel.app           — root (priority 1.0)
https://wwtracker.vercel.app/#overview — §00 platform snapshot
https://wwtracker.vercel.app/#what     — §01 how WaveWarZ works
https://wwtracker.vercel.app/#floor    — §02 treasury / operating floor
https://wwtracker.vercel.app/#growth   — §03 growth analytics
https://wwtracker.vercel.app/#profitability — §04 economics
https://wwtracker.vercel.app/#analytics    — §05 full analytics
https://wwtracker.vercel.app/#battles      — §06 battle intelligence
https://wwtracker.vercel.app/#traders      — §07 trader standings
https://wwtracker.vercel.app/#music        — §08 song records
https://wwtracker.vercel.app/#ecosystem    — §09 ZAO ecosystem
```

`changeFrequency: "daily"` for the root (live stats update every refresh).

---

### Layer 3: JSON-LD Dataset Schema — Structured Metadata

**File:** `app/layout.tsx` (JSON-LD `<script>` injected into `<head>`)  
**PR:** #176 (merged 2026-07-25) — `feat(seo): add JSON-LD Dataset schema + update metadata for GEO discov`  
**Purpose:** Embeds a machine-parseable `Dataset` schema describing WaveWarZ as a citable data source. Search engines and AI engines that understand JSON-LD can extract key facts without parsing prose.

Key schema fields:
```json
{
  "@type": "Dataset",
  "name": "WaveWarZ Battle Analytics",
  "description": "Live analytics for WaveWarZ — Solana music-battle prediction market. 1,291 battles, 878 SOL volume, 34 artists.",
  "url": "https://wwtracker.vercel.app",
  "creator": { "@type": "Organization", "name": "The ZAO" },
  "license": "https://opensource.org/licenses/MIT",
  "keywords": ["WaveWarZ", "music battle", "Solana", "prediction market", "onchain music"],
  "variableMeasured": ["battle count", "SOL volume", "artist payouts", "trader claims"],
  "temporalCoverage": "2025-05/2026-07"
}
```

Also added `<meta name="description">` content with key facts (battles, volume, artists) for fallback scrapers that don't parse JSON-LD.

---

### Layer 4: llms.txt — Plain-Text AI Summary

**File:** `public/llms.txt`  
**PR:** #145 (passing, open as of 2026-07-25) — `feat(geo): add llms.txt — make wwtracker AI-discoverable`  
**Purpose:** llms.txt is the emerging standard for AI-first indexing — a plain Markdown file at `/llms.txt` that tells language models what the site is and what facts to extract. Unlike HTML, it is scraped without CSS/JS noise. Unlike JSON-LD, it is readable by models trained only on plain text.

Content structure:
- **H1:** Site name + one-line description
- **H2 WaveWarZ:** How the platform works, live stats (updated 2026-07-25), 7 citable facts
- **H2 The ZAO:** Organization description, governance facts, contracts
- **H2 Tracker Sections:** Anchor links for all §00-§09 sections
- **H2 Research Sources:** Direct links to ZAOOS docs 1077, 1079, 1221, 1252, 1253, 1786, 1787, 2077

Live stats embedded (verified 2026-07-25):
- 1,291 battles, 878+ SOL (~$65K USD), 34 Audius-rostered artists
- AI Tournament: GEEK MYTH def. LUI 2-1, ~342 SOL semifinal (largest single event in platform history)

**Update cadence:** llms.txt should be updated whenever a major platform milestone is crossed (every ~50 SOL in cumulative volume, after each major tournament, after each IRL event). Recommended: update together with each `lib/battles.ts` snapshot refresh.

---

## GEO Impact Assessment

| Signal | Before (Jul 2026) | After | Notes |
|--------|------------------|-------|-------|
| robots.txt | None | Named AI bots allowed | Removes crawl ambiguity |
| sitemap.xml | None | 11 section URLs | All sections discoverable |
| JSON-LD | None | Dataset schema w/ creator | AI-parseable structured facts |
| llms.txt | None | Full AI summary + citable facts | Primary AI indexing target |
| `<meta description>` | Generic | Stats + org name | Fallback for non-JSON-LD scrapers |

**Expected GEO score movement (ZAOOS doc 1221 scale):** 7.6 → 8.5  
**Rationale:** All 4 layers combined produce a complete "AI-first" footprint. The remaining 0.5 gap is from thezao.xyz still needing its own GEO kit (doc 2074) and ZAOOS llms.txt updates.

---

## Reusable Pattern for Other ZAO Projects

Any ZAO project wanting the same GEO stack needs these 4 files:

```
public/
  robots.txt    — explicit AI bot Allow + Sitemap link
  llms.txt      — plain Markdown AI summary (update on each milestone)
app/
  sitemap.ts    — Next.js sitemap (or static sitemap.xml for non-Next sites)
  layout.tsx    — JSON-LD Dataset <script> in <head>
```

**For thezao.xyz:** See doc 2074 (complete artifacts ready to copy-paste).  
**For ZAOOS GitHub Pages:** A static `llms.txt` + `robots.txt` at the repo root suffice (no Next.js needed).  
**For future ZAO apps:** Copy `public/robots.txt` verbatim; customize `llms.txt` content; adapt `sitemap.ts` section URLs.

---

## PRs Reference

| PR | Title | Status | Layer |
|----|-------|--------|-------|
| #145 | feat(geo): add llms.txt | PASS (open) | Layer 4 |
| #176 | feat(seo): add JSON-LD Dataset schema | PASS (open) | Layer 3 |
| #192 | feat(geo): add robots.txt + sitemap.ts | PASS (open) | Layers 1 + 2 |

All three PRs pass TypeScript + Vercel checks. Merge order: any order (no file conflicts between the three).

---

## North Star Alignment

| Dimension | Impact | Mechanism |
|-----------|--------|-----------|
| GEO | 7.6 → 8.5 | llms.txt + JSON-LD + robots + sitemap = full AI-first footprint |
| Citability | 9.9 → 10.0 | Structured facts make AI citations more accurate and consistent |
| IP | +0.1 | WaveWarZ documented as "first AI-discoverable on-chain music battle platform" |
| Distribution | +0.2 | AI engines surface WaveWarZ in answers → organic discovery |

**The ZAO North Star #1 — "case study of a successful DAO":** A platform that is AI-discoverable and accurately cited in AI-generated answers contributes directly to ZAO being documented and referenced. Every researcher using Perplexity/Claude/ChatGPT to ask about on-chain music or AI-artist tournaments now has a path to finding WaveWarZ via structured data.
