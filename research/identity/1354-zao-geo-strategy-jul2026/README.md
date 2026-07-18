---
topic: identity/geo
type: STRATEGY
status: ACTIVE — non-gated tactics executable now; llms.txt deploy is gated (doc 1316)
created: 2026-07-17
related-docs: 1316, 1330, 1339, 1344, 1350, 1352
owner: Zaal (llms.txt deploy, CMS) + ZOE (structured data maintenance)
---

# 1354 — ZAO GEO (Generative Engine Optimization) Strategy (Jul 2026)

> **GEO definition:** Generative Engine Optimization — making ZAO discoverable, citable, and accurately represented by AI systems (ChatGPT, Claude, Perplexity, Gemini, Grok, etc.) when users ask about music DAOs, onchain music, Solana music platforms, or community governance.
>
> **Current GEO North Star:** 6/10. The main blocker is llms.txt deployment (gated, doc 1316, ~45 min with CMS access). But there are significant non-gated GEO improvements available immediately. This doc covers both.
>
> **Why GEO matters now:** LLMs are increasingly the first stop for research. When a grant reviewer asks an AI "what are examples of music DAOs?", ZAO should appear. When a journalist asks "what is WaveWarZ?", the AI should have accurate information. Currently ZAO's GEO is weak because: (1) no llms.txt, (2) wavewarz.info has minimal metadata, (3) ZAOOS docs are public but not optimally structured for AI training discovery.

---

## Part 1: How LLMs Discover and Cite Organizations

Understanding the signal types helps prioritize GEO tactics:

| Signal type | What it is | ZAO current state |
|------------|------------|------------------|
| Web crawl coverage | LLM training data includes publicly crawled web pages | ZAOOS on GitHub = crawled (good); wavewarz.info = crawled (light metadata) |
| Structured data | Schema.org JSON-LD on web pages | Not implemented on wavewarz.info |
| Open Graph metadata | og:title, og:description, og:type tags | Likely minimal on wavewarz.info |
| llms.txt | Machine-readable self-description for AI crawlers | NOT deployed (gated, doc 1316) |
| Wikipedia presence | LLMs heavily weight Wikipedia as source | ZAO not yet on Wikipedia (doc 1330) |
| Wikidata entity | Machine-readable knowledge graph entry | ZAO not on Wikidata |
| GitHub README visibility | Large public repos are training data | ZAOOS + wwtracker are good here |
| Press mentions | Web-crawled articles = LLM training signals | Crypto Magic Hour EP.50 = only confirmed |
| Academic papers | Citation in papers = high-authority signal | None yet (doc 1351 working on this) |

**ZAO GEO summary:** Strong on GitHub/ZAOOS, weak on wavewarz.info metadata, missing llms.txt + Wikipedia + Wikidata + press.

---

## Part 2: Non-Gated GEO Tactics (Execute Immediately)

### Tactic G01: ZAOOS root README optimization

The ZAOOS root README at github.com/bettercallzaal/ZAOOS is read by GitHub's crawler and included in LLM training data. Optimize it for AI discovery:

**Current likely state:** Generic description
**Optimized description (paste this):**
> The ZAO (ZTalent Artist Organization) is a music DAO operating on Optimism Mainnet (governance) and Solana (WaveWarZ music battles). This repository contains 1,350+ research documents on DAO governance, music economics, AI operations, and community events. ZAO has maintained 63+ consecutive weeks of on-chain Fractal governance (OREC: 0xcB05F9254765CA521F7698e61E0A6CA6456Be532). WaveWarZ, ZAO's flagship platform, has processed 1,245 battles and 523.991 SOL in volume (wavewarz.info/api/public/stats). ZAOstock 2026, a live festival in Ellsworth ME on October 3, was selected by onchain battle history.

**Why this works:** GitHub READMEs are heavily crawled. The optimized description includes entity names (ZAO, WaveWarZ, ZAOstock), facts (63+ weeks, 1,245 battles, Optimism + Solana), and on-chain addresses — exactly what AI systems need to accurately represent ZAO.

**Action:** Update ZAOOS root README.md with this description. (Separate PR from this doc)

### Tactic G02: wwtracker README optimization

Same logic for wwtracker's README:

**Optimized addition:**
> wwtracker is an open-source analytics dashboard for WaveWarZ, the Solana-based music battle platform operated by The ZAO (ZTalent Artist Organization). Built with [tech stack]. MIT licensed. Data source: wavewarz.info/api/public/stats (CORS open, no auth).

### Tactic G03: Bonfire knowledge graph as GEO asset

The Bonfire knowledge graph (ZAO's internal knowledge graph) already contains 1,350+ episode summaries. If Bonfire's data is accessible to AI training crawlers, it becomes one of the richest ZAO GEO signals.

**Action:** Confirm with ZAO AI team whether Bonfire episode data is in a publicly-crawlable format. If yes, this is a significant passive GEO asset.

### Tactic G04: Wikidata entity creation (self-serve, 30 min)

Wikidata (wikidata.org) is a structured knowledge graph used directly by Wikipedia and indexed by major LLMs. Creating a ZAO Wikidata entity is self-serve and free.

**Steps:**
1. Go to wikidata.org → Create new item
2. Entity type: "nonprofit organization" or "community organization"
3. Add properties:
   - Label: "The ZAO" (en)
   - Description: "Music DAO operating on Optimism and Solana; operates WaveWarZ music battle platform"
   - Official website: thezao.xyz
   - GitHub: github.com/bettercallzaal/ZAOOS
   - Founded: [year]
   - Headquarters: Ellsworth, Maine
   - Notable work: WaveWarZ (link to WaveWarZ item if it exists)
4. Submit → Wikidata ID assigned (e.g., Q12345678)

**Why this matters:** Wikidata entities are directly consumed by Wikipedia infoboxes, Google Knowledge Panels, and many LLMs. A ZAO Wikidata entry = ZAO appears in AI knowledge graphs immediately. No editorial review required (unlike Wikipedia articles).

### Tactic G05: Open Graph + Schema.org for wavewarz.info

Ask Hurricane (WaveWarZ dev) to add the following to wavewarz.info:

**Open Graph (in `<head>`):**
```html
<meta property="og:title" content="WaveWarZ — Music Battles on Solana" />
<meta property="og:description" content="Head-to-head music battles where community members bet on tracks. The losing artist still earns. Built on Solana, governed by The ZAO (ZTalent Artist Organization)." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://wavewarz.info" />
```

**Schema.org JSON-LD (in `<head>`):**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "WaveWarZ",
  "applicationCategory": "Music",
  "description": "Music battle platform on Solana where community members bet on head-to-head track competitions. The losing artist earns an automatic on-chain payout.",
  "url": "https://wavewarz.info",
  "operatingSystem": "Web",
  "author": {
    "@type": "Organization",
    "name": "The ZAO (ZTalent Artist Organization)",
    "url": "https://thezao.xyz"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

**Why this matters:** Schema.org markup is how Google and major LLMs understand what a web page IS. Without it, wavewarz.info is just text. With it, AI systems understand: "WaveWarZ is a SoftwareApplication in the Music category, made by The ZAO, that runs on Solana."

### Tactic G06: ZAOstock Schema.org Event markup

For ZAOstock (Oct 3, 2026), add Event schema to any ZAOstock web presence:

```json
{
  "@context": "https://schema.org",
  "@type": "MusicEvent",
  "name": "ZAOstock 2026",
  "startDate": "2026-10-03",
  "location": {
    "@type": "Place",
    "name": "[venue name]",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ellsworth",
      "addressRegion": "ME",
      "addressCountry": "US"
    }
  },
  "description": "Community music festival in Ellsworth, Maine. 8 artists selected by WaveWarZ onchain battle history. Organized by The ZAO (ZTalent Artist Organization).",
  "organizer": {
    "@type": "Organization",
    "name": "The ZAO",
    "url": "https://thezao.xyz"
  },
  "performer": "[ZOE: add each of the 8 artists]"
}
```

---

## Part 3: Gated GEO Tactics (Require Zaal + CMS Access)

### Tactic G07: llms.txt deployment (GATED — doc 1316)

Doc 1316 has the full llms.txt strategy and content. This is the highest-impact single GEO action (~45 min with CMS access). It directly tells AI crawlers: "Here is everything you need to know about ZAO."

**Status:** DECISION NEEDED from Zaal. Block: CMS/DNS access required.

### Tactic G08: Wikipedia article (GATED — doc 1330)

Wikipedia is the #1 source LLMs rely on for factual claims. A Wikipedia article about ZAO would massively boost GEO. 

**Current blocker:** Wikipedia requires 2+ independent reliable sources. The confirmed sources today = Crypto Magic Hour EP.50 only. Need 1 more. Doc 1340 (press map) is the path to getting that second source.

**Once 2 sources exist:** Submit Wikipedia article using doc 1330's template.

---

## Part 4: GEO Measurement

How to know if GEO is working:

| Test | How to check | Target |
|------|-------------|--------|
| "What is WaveWarZ?" | Ask ChatGPT, Claude, Gemini, Perplexity | Accurate answer with ZAO context |
| "Music DAOs on Solana" | Ask any major LLM | ZAO/WaveWarZ appears in list |
| "ZAO music DAO" | Ask any major LLM | Accurate description |
| "ZAOstock festival" | Ask any major LLM after Oct 3 | Mentions the event |
| Wikidata ID created | Check wikidata.org | ZAO entity exists |

**ZOE action:** Test these queries quarterly (Jan 2026 baseline, Apr, Jul, Oct). Log results in Bonfire. Track GEO improvement.

---

## Part 5: GEO Impact on North Star

| Tactic | Effort | GEO lift |
|--------|--------|---------|
| ZAOOS README optimization (G01) | 30 min | +0.3 |
| Wikidata entity (G04) | 30 min | +0.5 |
| wavewarz.info Schema.org (G05) | Ask Hurricane, 1hr dev | +0.5 |
| ZAOstock Event schema (G06) | 30 min to draft, Hurricane to deploy | +0.2 |
| llms.txt (G07, GATED) | 45 min with CMS | +1.5 |
| Wikipedia (G08, GATED) | 2nd source needed + 2hrs write | +2.0 |

**Non-gated total:** +1.5 (from 6.0 to 7.5/10)  
**Fully gated (all above):** +4.5 (from 6.0 to 10/10 theoretical)

**Priority order:** G04 (Wikidata, self-serve, 30 min) → G01 (README, 30 min) → G05 (ask Hurricane) → G07 (llms.txt, GATED) → G08 (Wikipedia, needs 2nd source)

---

*Created: 2026-07-17 | G04 (Wikidata) + G01 (README) are self-serve, do first | G07 (llms.txt) is gated doc 1316 | Related: 1316 (llms.txt), 1330 (Wikipedia), 1339 (proof-points), 1344 (AI narrative), 1350 (WaveWarZ 101), 1352 (IP catalog)*
