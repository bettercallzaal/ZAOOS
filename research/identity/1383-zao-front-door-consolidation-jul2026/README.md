---
topic: identity/web-presence
type: AUDIT
status: action-ready
created: 2026-07-17
board-task: 311b2dbc
related-docs: 1221, 1107, 1026, 1297
owner: Zaal
deadline: 2026-07-25 (before ZAOville + ZAOstock permit announcement)
---

# 1383 — ZAO Front Door Consolidation: Kill thezao.com, Canonicalize thezao.xyz

> **Problem:** Two domains exist for The ZAO — `thezao.com` (dead, stale bios, no canonical redirect) and `thezao.xyz` (the live production site). Every reference to thezao.com is a broken link in AI training data, search results, and bios. This is a GEO blocker.
>
> **Fix:** One afternoon, Zaal swaps all public-facing references. Zero code. Zero cost.

---

## The Core Issue

| Domain | Status | Problem |
|--------|--------|---------|
| `thezao.xyz` | LIVE — production site | The correct front door. All paths work. |
| `thezao.com` | DEAD or stale redirect | Referenced in old bios, GitHub, LinkedIn. Bots crawl it, find nothing or old content. |

GEO impact: AI systems cite the domain they find most consistently. If ChatGPT, Perplexity, or Gemini see half the ZAO bios pointing at thezao.com and half at thezao.xyz, they either cite the wrong one or decline to cite either. Doc 1221 (GEO master plan) flags this as step 1 of the canonical URL fix.

---

## Audit: Where thezao.com Still Appears

### GitHub (Highest GEO Priority)

| Repo | Location | Current | Fix To |
|------|----------|---------|--------|
| bettercallzaal/ZAOOS | README.md (repo description) | Check | `https://thezao.xyz` |
| bettercallzaal/CoCConcertZ | README.md, package.json homepage | Check | `https://thezao.xyz/coc` |
| bettercallzaal/wwtracker | README.md, package.json homepage | Check | `https://thezao.xyz/wavewarz` or `https://wwtracker.xyz` |
| bettercallzaal (profile) | GitHub bio URL | Check | `https://thezao.xyz` |
| thezao (org) | GitHub org URL field | Check | `https://thezao.xyz` |

**Action:** Go to each repo → Settings or README → find thezao.com → change to thezao.xyz.

---

### Social Profiles (Highest Audience Priority)

| Platform | Profile | Current URL | Fix To |
|----------|---------|-------------|--------|
| X (Twitter) | @bettercallzaal | Check bio link | `https://thezao.xyz` |
| X (Twitter) | @WaveWarZ | Check bio link | `https://wwtracker.xyz` |
| Farcaster | @bettercallzaal | Check profile | `https://thezao.xyz` |
| LinkedIn | Zaal Panthaki | Check featured links | `https://thezao.xyz` |
| Instagram | @bettercallzaal (if exists) | Check bio | `https://thezao.xyz` |

---

### Newsletter + Publication Bios (Critical for Grant Applications)

| Platform | Location | Fix |
|----------|----------|-----|
| Paragraph.com/@thezao | Author bio / "About" section | Swap thezao.com → thezao.xyz |
| Newsletter footer | Any edition footer with website link | Swap in next send |
| Substack (if mirrored) | Profile link | Swap |

---

### Grant Applications + Docs

| Doc/Asset | Status |
|-----------|--------|
| Artizen submission (if submitted Jul 18) | Verify thezao.xyz used — NOT thezao.com |
| Heart of Ellsworth grant application | Verify thezao.xyz |
| Fisher Foundation (when applying) | Use thezao.xyz |
| ZAO Fractured Atlas profile (when created) | Use thezao.xyz |

---

### ZAOOS Research Docs (Internal — Low GEO Priority but Good Hygiene)

The ZAOOS README llms.txt (PR #1785) already uses thezao.xyz. No action needed inside ZAOOS docs unless a specific doc references thezao.com directly.

---

## The thezao.com Redirect Fix (1 DNS Change, Zaal-Gated)

If Zaal controls thezao.com DNS:
1. Add a 301 redirect: `thezao.com → thezao.xyz`
2. Add: `www.thezao.com → thezao.xyz`

This means OLD links still work while new canonical is thezao.xyz. Cost: $0, time: 5 minutes in DNS panel.

**If thezao.com is expired/not controlled:** Contact domain registrar. If unrecoverable, prioritize swapping all bios faster so the dead domain gets zero new inbound.

---

## Priority Execution Order

1. **GitHub profile bio** (bettercallzaal + thezao org) — crawled daily by bots; highest GEO impact per minute
2. **X bio @bettercallzaal** — 2nd most crawled by AI systems
3. **Farcaster profile** — Warpcast embeds profile in frame cards shared on Farcaster
4. **Paragraph bio** — Newsletter subscribers + grant reviewers see this
5. **GitHub repo READMEs** (ZAOOS, CoCConcertZ, wwtracker) — One PR each, ~10 minutes
6. **thezao.com DNS redirect** — Catch-all for old links; nice-to-have

---

## GEO Connection

This directly executes Step 1 of doc 1221 (GEO master plan): "Set canonical URL = thezao.xyz across all profiles." Once complete, AI systems training on GitHub, X, and newsletter archives will consistently see thezao.xyz — increasing the chance that "The ZAO" returns thezao.xyz as the cited source.

Cross-reference: doc 1107 (SEO + GEO strategy), doc 1026 (ZAO brand audit which flagged the domain split).

---

## Status Tracker

| Platform | Swapped? | Date |
|----------|---------|------|
| GitHub bettercallzaal bio | [ ] | |
| GitHub thezao org | [ ] | |
| X @bettercallzaal bio | [ ] | |
| X @WaveWarZ bio | [ ] | |
| Farcaster @bettercallzaal | [ ] | |
| LinkedIn | [ ] | |
| Paragraph.com bio | [ ] | |
| thezao.com DNS redirect | [ ] | |
| ZAOOS README (PR #1785 covers) | [x] | Jul 17 |

*Update this table as Zaal completes each swap. Target: all done by Jul 25 (ZAOville week).*
