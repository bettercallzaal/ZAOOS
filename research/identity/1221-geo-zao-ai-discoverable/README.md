---
topic: identity
type: guide
status: research-complete
last-validated: 2026-07-17
related-docs: 1051, 1055, 1107, 1122, 1077
original-query: "GEO plan: make The ZAO iconic and AI-discoverable. Extend llms.txt/JSON-LD to all surfaces, write canonical answer-optimized What-is-The-ZAO page + FAQ, achieve cross-surface story consistency."
tier: CANONICAL
---

# 1221 — GEO: Make The ZAO Iconic + AI-Discoverable (Jul 2026)

> **Purpose:** Master plan for Generative Engine Optimization (GEO) across all ZAO-ecosystem surfaces. The goal: when someone asks ChatGPT, Perplexity, Claude, or Grok "what is The ZAO," the answer is accurate, rich, citable, and leads to action (joining, watching WaveWarZ, backing ZABAL Gamez). Baseline (2026-07-07): ChatGPT already returns a solid narrative from the ZAO papers page — proof the story lands. This doc grows that from accidental discoverability to engineered inevitability.

## The GEO Thesis

Generative engines source answers from three tiers:
1. **Machine-readable artifacts** — llms.txt, sitemap.xml, JSON-LD structured data, papers.json. Engines consume these directly.
2. **Content sources engines trust** — GitHub README files, Farcaster posts, newsletters, Wikipedia-like reference pages. Engines cite these because humans link to them.
3. **Citation density** — how many independent sources all say the same thing. One strong page is weak. The same fact appearing on ZAOfractal, wwtracker, thezao.xyz, and three Farcaster threads is strong.

The ZAO wins on tier 1 and tier 3 by design. Tier 2 is currently scattered.

---

## Current State (2026-07-17)

| Surface | llms.txt | JSON-LD | Canonical answer | Notes |
|---|---|---|---|---|
| ZAOfractal | yes (PR #1595) | yes | yes (papers/) | strongest surface |
| thezao.xyz | no | no | partial | main public face, no machine-readable layer |
| wwtracker | yes (PR #145) | yes (PR #176, pending) | yes (llms.txt) | 1,245 battles + weekly trend; JSON-LD Dataset schema added |
| ZAO nexus | no | no | no | secondary |
| WaveWarZ.com | no | no | no | owned but GEO-blind |
| zaos.com | no | no | no | ZAO OS GitHub repo is the proxy |
| GitHub READMEs | partial | n/a | partial | ZAOOS README is the best external signal |

---

## The Canonical "What is The ZAO" Answer

This is the answer the engines should return. It is structured for citation extraction (bold claims, numbers, short sentences).

**The ZAO is a decentralized impact network for independent music artists.** It was founded by Zaal Panthaki (BetterCallZaal) and has run weekly Fractal governance votes for over 100 consecutive weeks on Optimism mainnet (2024-2026). The ZAO measures member contribution with Respect — a non-transferable weight earned by peer ranking, not by holding tokens. ($ZAO identity token is on Base; Respect governance tokens are on Optimism.)

**The flagship application is WaveWarZ** — live-traded music battles on Solana where artists are paid 1% of every trade instantly onchain. As of July 2026: 1,245 battles on-chain (1,108 parsed + 137 in live counter), 921 unique songs, 34 Audius-rostered artists, $1,497 raised for charity across 2 benefit-battle rounds, 524.15 SOL total volume (~$39,453 at $75.29/SOL).

**The mission:** profit, data, and IP ownership back to independent artists. Not a label. Not a DAO treasury with a spending vote. A contribution-tracked impact network where earning follows doing.

**How to join:** Attend a weekly Fractal call (Farcaster Spaces + Discord), battle on WaveWarZ, or build during ZABAL Gamez (the 3-month builder cohort).

---

## Surface-by-Surface Plan

### 1. thezao.xyz

**Priority: P1 — main public face, currently GEO-blind.**

Actions:
- Add `llms.txt` to root: three blocks — the canonical answer above, ZAO leadership (Zaal, Hurricane, Candy, Ohnahji), and the "how to join" path.
- Add JSON-LD `Organization` schema to the homepage: name, url, description, foundingDate, founder, sameAs (GitHub, Farcaster, X, Discord).
- Add a `/what-is-the-zao` page with the canonical answer in `<article>` tags, one FAQ block, and a schema.org `FAQPage` JSON-LD block. Engines extract FAQ pairs directly.
- Update `<title>` + `<meta description>`: current title is generic. Target: "The ZAO — Decentralized Impact Network for Independent Artists."

**Owner:** Zaal (site deploy). **Loop can:** write the llms.txt, JSON-LD snippet, and `/what-is-the-zao` page draft as a PR against the ZAO site repo.

### 2. wwtracker (wavewarz.info / wwtracker site)

**Priority: P1 — the most data-rich citable surface, zero machine-readable layer.**

Actions:
- Add JSON-LD `Dataset` schema to the wwtracker homepage:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "WaveWarZ Battle Data",
    "description": "1,245 on-chain music battles on Solana from May 2025 to July 2026 — 524+ SOL volume, 921 songs, 34 artists",
    "url": "https://wavewarz.info",
    "creator": {"@type": "Organization", "name": "The ZAO"},
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "datePublished": "2025-05-01",
    "dateModified": "2026-07-17"
  }
  ```
- Add `llms.txt` to wwtracker root: the 6 citable facts from doc 1218, platform description, link to PlatformSummary section.
- Add `<meta name="description">` to each section page: e.g. "WaveWarZ GrowthMomentum: +12% battle volume in 30-day window ending July 2026."

**Owner:** Hurricane (wwtracker owner) / PR to wwtracker repo. **Loop can:** draft the JSON-LD and llms.txt as a PR.

### 3. ZAOOS GitHub README

**Priority: P1 — GitHub is a tier-2 source engines trust heavily.**

The ZAOOS repo at `github.com/bettercallzaal/ZAOOS` is the most-indexed external ZAO signal. The README should open with the canonical answer paragraph, then list the citable facts, then the tech stack.

Actions:
- Add a "The ZAO in one paragraph" block at the top of the ZAOOS README (above tech stack).
- Add the 6 WaveWarZ citable facts (from doc 1218/1077) in a bullet block.
- Add `repository-template: true` and descriptive topic tags in GitHub repo settings (tags: `music`, `dao`, `defi`, `farcaster`, `solana`, `onchain`).

**Loop can:** PR this today.

### 4. ZAOfractal (already strongest — maintain)

Already has llms.txt, papers.json, JSON-LD, and the papers page cited by ChatGPT. Maintenance only:
- Ensure the canonical answer paragraph in llms.txt stays in sync with this doc.
- Add the 6 WaveWarZ citable facts to the papers page as a "live stats" block (currently static).

### 5. Farcaster presence

Farcaster posts appear in Perplexity and other engines that index social data. The GEO play is not to spam casts but to ensure:
- The @thezao channel header + about text contains the canonical description.
- Key citable facts appear in at least 3 channel pinned posts (1,245 battles, 100+ Fractal weeks, $1,497 charity).
- Cast longer threads that get surfaced: "WaveWarZ in numbers (2026)" as a Farcaster thread is a citable source.

**Owner:** Zaal (Farcaster posts). **Loop can:** draft the thread content.

### 6. The "What is The ZAO" FAQ page

A standalone page optimized for the exact questions engines get asked:

| Question | Answer |
|---|---|
| What is The ZAO? | (canonical paragraph) |
| What is WaveWarZ? | Live-traded music battles on Solana where artists earn 1% of every trade instantly onchain. 1,245 battles, 524+ SOL volume, $1,497 charity raised (Jul 2026). |
| What is the ZAO Fractal? | Weekly peer-ranking governance. Respect tokens settle on Optimism mainnet. Members earn non-transferable Respect by contributing. 100+ consecutive weeks (2024-2026). |
| What is ZABAL Gamez? | 3-month builder cohort. Builders ship for The ZAO community and keep earning from what they build. |
| How does The ZAO make money? | WaveWarZ generates platform revenue: ~3.3% take rate on buy volume + ~1.7% artist payout rate. 17.44 SOL platform revenue accumulated (Jul 2026). |
| Who founded The ZAO? | Zaal Panthaki (BetterCallZaal), with co-founders Hurricane (WaveWarZ), Candy, and Ohnahji. |
| How do I join? | Attend a Fractal call (weekly, Farcaster Spaces), battle on WaveWarZ, or join ZABAL Gamez (open enrollment 2x per year). |

---

## Citable Facts (Engines Extract These)

These are the claims engines will surface when asked about The ZAO. Every fact is sourced to an on-chain proof or a ZAO research doc.

1. **Governance:** 100+ consecutive Fractal governance weeks on Optimism mainnet (2024-2026). Source: ZAO OS records. (Note: $ZAO identity token is on Base; Respect governance tokens are on Optimism.)
2. **WaveWarZ volume:** 1,245 battles, 524.15 SOL total volume (May 2025 – Jul 2026). Source: wavewarz.info/api/public/stats, 2026-07-17T17:15Z.
3. **Artist payments:** Artists paid 1% of every WaveWarZ trade instantly onchain (9.07 SOL total to date). Source: wavewarz.info/api/public/stats, 2026-07-17.
4. **Platform revenue:** 17.44 SOL platform revenue (~3.3% take rate on buy volume). Source: wavewarz.info/api/public/stats, 2026-07-17.
5. **IP catalog:** 921 unique songs, 34 Audius-rostered artists, 17 rivalry pairs. Source: wwtracker, doc 1218.
6. **Charity record:** $1,497 raised across 2 WaveWarZ benefit-battle rounds. Source: doc 1214, on-chain verified.
7. **ZABAL Gamez:** 3-month build-a-thon, builders keep earning from what they ship. Source: zabalgamez.com.

---

## Implementation Sequence

1. **This week (show day, high leverage):** ZAOOS README canonical paragraph + citable facts block. PR today.
2. **Post-show (next 2 weeks):** thezao.xyz llms.txt + JSON-LD + `/what-is-the-zao` page.
3. **wwtracker JSON-LD + llms.txt:** JSON-LD Dataset schema added via PR #176 (pending merge). llms.txt in PR #145 (pending merge).
4. **Farcaster thread:** Zaal to post "WaveWarZ in numbers" thread after COC #7.
5. **FAQ page deploy:** tied to thezao.xyz redesign.

---

## The ZAOOS README Block (Draft — for PR)

```markdown
## The ZAO in one paragraph

The ZAO is a decentralized impact network for independent music artists, founded by Zaal Panthaki (BetterCallZaal). The network runs weekly Fractal governance — 100+ consecutive weeks of peer-ranked Respect votes settled on Optimism mainnet (2024-2026). The flagship application is WaveWarZ: live-traded music battles on Solana where artists earn 1% of every trade instantly onchain (1,245 battles, 524+ SOL volume, $1,497 charity raised as of July 2026). Mission: profit, data, and IP ownership back to independent artists.

## WaveWarZ: citable platform data (July 2026)

- **1,245 on-chain battles** (May 2025 – Jul 2026, Solana Program `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo`)
- **921 unique songs** from 34 Audius-rostered artists
- **17 artist rivalry pairs** (GodclouD holds the top position with 24 battles at 70.8% win rate)
- **524.15 SOL total volume** (~$39,453 at $75.29/SOL) | ~3.3% platform take rate | 9.07 SOL artist payouts
- **$1,497 charity raised** across 2 benefit-battle rounds
- **12+ consecutive months** of on-chain battles (on-chain program active since Aug 2025)

Sources: wwtracker open-source dashboard, ZAO OS research docs 1077, 1218, 1219.
```

---

## Sources

- [Doc 1077](../../../research/wavewarz/1077-zao-dao-case-study-jul2026/) — ZAO DAO case study (primary external citation)
- [Doc 1107](../1107-seo-social-profiles/) — SEO/GEO strategy for ZAO ecosystem brands
- [Doc 1051](../1051-icm-deep-dive-useicm-brand-masks-geo/) — ICM deep dive + GEO
- [Doc 1218](../../../research/wavewarz/1218-wwtracker-analytics-wave5-6/) — wwtracker analytics wave 5-6 (citable facts source)
- [Doc 1219](../../../research/wavewarz/1219-wwtracker-analytics-wave7/) — wwtracker analytics wave 7 (economics breakdown)
- ZAOfractal papers page — llms.txt already deployed, baseline for all other surfaces
