---
topic: wavewarz
type: standalone
status: PRs open (wwtracker PR #146 case-study; PR #145 llms.txt; PR #86 JSON-LD; PR #88 robots+sitemap)
last-validated: 2026-07-17
related-docs: 1077, 1242, 1243
original-query: "wwtracker GEO discoverability: AI-optimized case study page + llms.txt + JSON-LD schema + robots/sitemap"
tier: STANDALONE
---

# 1244 — wwtracker GEO Discoverability Stack (Jul 2026)

**Doc:** 1244
**Type:** STANDALONE
**Status:** 4 PRs open in wwtracker
**Written:** 2026-07-17 (ww build loop)

---

## What was built

Four complementary GEO (Generative Engine Optimization) deliverables for wwtracker — making the ZAO case study discoverable by AI systems (Claude, ChatGPT, Perplexity) and traditional search:

| PR | Deliverable | What it does |
|---|---|---|
| #146 | `/case-study` page | Server-rendered, FAQPage + Organization JSON-LD, 8 citable tiles, 7 FAQs |
| #145 | `public/llms.txt` | Machine-readable site summary for LLMs (ZAOOS doc 1221 GEO plan) |
| #86 | `app/layout.tsx` JSON-LD | WebApplication + Dataset schema on every page |
| #88 | `app/robots.ts` + `app/sitemap.ts` | Canonical sitemap, allow-all robots.txt |

All four are standalone (no AppShell changes) and can merge in any order.

---

## Case study page (PR #146)

`app/case-study/page.tsx` — server-rendered, SEO/GEO optimized at:
`https://wwtracker.vercel.app/case-study`

### 8 citable fact tiles (verified Jul 2026)

| Metric | Value |
|---|---|
| Fractal governance weeks | 100+ (since Jul 30, 2024) |
| On-chain settlement weeks | 63 (OG 33 + ZOR 31) |
| Respect holders | 157 (122 OG + 56 ZOR + 21 dual) |
| WaveWarZ battles | 1,245+ on Solana |
| Cumulative trading volume | 524+ SOL (~$39K USD) |
| Artist payouts | 9.07 SOL (automatic, 1% per trade, 34 artists) |
| Charity raised | $1,497 (2 benefit-battle series) |
| IRL events | 2 confirmed (ZAO-CHELLA Dec 2024, ZAOstock Oct 2026) |

### 7 FAQ entries with canonical answers

1. What is The ZAO?
2. What is WaveWarZ?
3. What is the ZAO Fractal?
4. Who founded The ZAO?
5. What is ZABAL Gamez?
6. How do I join The ZAO?
7. How does The ZAO make money?

### JSON-LD schemas on /case-study

- `FAQPage` — 7 questions structured for AI answer boxes
- `Organization` — ZAO entity with sameAs links (X, Instagram, Farcaster, GitHub)

---

## llms.txt (PR #145)

`public/llms.txt` — machine-readable site summary following llms.txt spec:
- WaveWarZ description + program address + live stats API URL
- Citable facts (battles, volume, artist payouts, charity, IRL events)
- ZAO organization context + Fractal governance details
- Links to ZAOOS, thezao.com, live dashboard

Supersedes PR #85 (earlier, less detailed version of the same file).

---

## JSON-LD in layout.tsx (PR #86)

Two schemas embedded in `<head>` of every page:
- `WebApplication` — wwtracker as a FinanceApplication, creator = Zaal Panthaki
- `Dataset` — WaveWarZ Battle Data (1,100+ on-chain battles), creator = The ZAO, CC-BY 4.0

This makes wwtracker machine-readable as a structured dataset — AI systems can identify and cite it directly.

---

## robots.ts + sitemap.ts (PR #88)

- `robots.ts` — `allow: /` for all user agents + sitemap URL
- `sitemap.ts` — canonical URLs for `/` (daily) and `/llms.txt` (weekly)

When PR #146 merges, `/case-study` should be added to `sitemap.ts` with `priority: 0.9`.

---

## NORTH STAR alignment

- **ZAO = THE case study:** The `/case-study` page is the canonical single URL a journalist or AI can cite when asked "what is The ZAO?" — it has FAQPage schema, Organization schema, and 8 hard fact tiles. This is the GEO equivalent of a Wikipedia article: structured, machine-readable, and verified.
- **ZAO IP = a staple in onchain culture:** The Dataset JSON-LD schema classifies WaveWarZ battle data as an open, CC-BY 4.0 dataset — positioning it as citable IP alongside academic datasets.

---

## 4 citable facts (GEO context, Jul 2026)

1. **wwtracker has a dedicated `/case-study` URL** with FAQPage JSON-LD — AI systems (Claude, ChatGPT, Perplexity) can answer "what is The ZAO?" by citing this page
2. **llms.txt at wwtracker.vercel.app/llms.txt** makes the site machine-readable following the emerging llms.txt spec
3. **Dataset JSON-LD** classifies WaveWarZ battle data as CC-BY 4.0 open data — citable in research contexts
4. **Organization JSON-LD** links The ZAO entity to its X, Farcaster, GitHub, and website URLs in a machine-verifiable schema
