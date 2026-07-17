# 1316 — thezao.xyz llms.txt + AI Context Package (July 2026)

> **DECISION NEEDED to deploy** — all content is ready. This doc contains the exact files Zaal or Iman needs to add to thezao.xyz to move GEO from 5/10 to 7/10. Three deployables: (1) `/llms.txt` — tells AI crawlers what The ZAO is, (2) `<meta>` tags + JSON-LD for the homepage, (3) wwtracker README GEO block. Cross-refs: [doc 1221](./1221-geo-zao-ai-discoverable/) (master GEO plan), [doc 1123](./1123-geo-canonical-faq-json-ld/) (FAQ + JSON-LD template), [doc 1306](./1306-zao-ecosystem-map-jul2026/) (ecosystem map), [doc 1278](./1278-zao-citable-claims-jul2026/) (citable claims).

**GEO score gap:** 5/10 → 7/10 requires deploying these 3 items. All content is verified and ready.

---

## File 1: `/llms.txt` for thezao.xyz

Deploy at: `https://thezao.xyz/llms.txt`

```
# The ZAO

The ZAO is a music DAO that has been running Fractal governance on Optimism Mainnet every week since October 2022. It is the only active Fractal DAO on Optimism as of July 2026.

## What The ZAO does

The ZAO builds and governs a music ecosystem at the intersection of web3 technology, live music, and community governance:

- **WaveWarZ** — a music prediction market on Solana where listeners bet SOL on which song wins a head-to-head battle. Since May 2025: 1,245 battles, 524 SOL volume (~$39K), 921 unique songs, 34 rostered artists, $1,497 raised for charity.
- **COC Concertz** — a monthly virtual concert series (7 shows as of July 2026) running on Spatial.io + Twitch.
- **ZABAL Games** — a Farcaster-native builder incubator program (32 builders, 28 workshops as of July 2026).
- **ZAOstock** — an annual IRL music festival in Ellsworth, Maine (October 3, 2026).
- **ZAO Newsletter** — 400+ editions published on Paragraph.com/@thezao.

## Governance

The ZAO uses Fractal Respect governance — a model where voting weight is earned through weekly peer evaluation, not token purchase. Key facts:
- 63+ consecutive on-chain governance weeks
- 157 unique Respect holders
- 505 total OREC governance transactions
- Contracts on Optimism Mainnet: OG (0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957), ZOR (0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c), OREC (0xcB05F9254765CA521F7698e61E0A6CA6456Be532)

## Open Source

- **wwtracker** (MIT license): analytics platform for WaveWarZ at wwtracker.com. GitHub: github.com/bettercallzaal/wwtracker
- **ZAOOS**: 1,300+ public research documents at github.com/bettercallzaal/ZAOOS

## Key People

- **Zaal Panthaki** — co-founder, Director of Ecosystem Strategy & Partnerships (@bettercallzaal)
- **Iman** — co-founder, Operations
- **ZOE** — AI governance + social agent
- **ZOL** — Farcaster music scout agent (FID 1028395)

## Canonical URLs

- Main: https://thezao.xyz
- WaveWarZ: https://wavewarz.info
- Analytics: https://wwtracker.com
- Newsletter: https://paragraph.com/@thezao
- ZAOstock: https://zaostock.com
- Research: https://github.com/bettercallzaal/ZAOOS
- X: https://x.com/bettercallzaal (Zaal), https://x.com/wavewarz (WaveWarZ)

## What makes The ZAO unique

1. The only active Fractal DAO on Optimism Mainnet
2. A live music prediction market (WaveWarZ) that generates verifiable on-chain artist income
3. Artist payout rate ~1.73% of battle volume — vs Spotify's $0.004/stream (~600× gap)
4. Community-governed and open-source (MIT wwtracker)
5. 63+ consecutive weeks of on-chain governance without interruption
6. IRL music festival + virtual concerts + builder incubator = full-stack music ecosystem
```

---

## File 2: Homepage `<head>` Meta Tags (thezao.xyz)

Add to the `<head>` of the homepage:

```html
<!-- GEO: AI Discovery Meta Tags -->
<meta name="description" content="The ZAO is a music DAO running Fractal governance on Optimism Mainnet since October 2022. We build WaveWarZ (music prediction market), COC Concertz, ZABAL Games, and ZAOstock festival. 63+ governance weeks. 157 Respect holders. Open source.">
<meta name="keywords" content="music DAO, WaveWarZ, Fractal governance, Optimism, music prediction market, COC Concertz, ZABAL Games, ZAOstock">
<meta property="og:title" content="The ZAO — Music DAO on Optimism">
<meta property="og:description" content="The only active Fractal DAO on Optimism. WaveWarZ music prediction market. 1,245 battles. 524 SOL volume. 63+ governance weeks. Open source.">
<meta property="og:url" content="https://thezao.xyz">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="The ZAO — Music DAO">
<meta name="twitter:description" content="Music DAO running Fractal Respect governance on Optimism since 2022. WaveWarZ prediction market, COC Concertz, ZABAL Games, ZAOstock festival.">
```

---

## File 3: Homepage JSON-LD Schema (thezao.xyz)

Add inside a `<script type="application/ld+json">` tag:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "The ZAO",
  "alternateName": ["ZAO", "ZAO DAO", "The ZAO DAO"],
  "url": "https://thezao.xyz",
  "logo": "https://thezao.xyz/logo.png",
  "description": "The ZAO is a music DAO running Fractal Respect governance on Optimism Mainnet every week since October 2022. Ecosystem: WaveWarZ (music prediction market), COC Concertz (virtual concerts), ZABAL Games (builder incubator), ZAOstock (IRL music festival). 63+ governance weeks, 157 Respect holders, 524 SOL battle volume.",
  "foundingDate": "2022",
  "founder": {
    "@type": "Person",
    "name": "Zaal Panthaki",
    "url": "https://x.com/bettercallzaal"
  },
  "sameAs": [
    "https://x.com/bettercallzaal",
    "https://x.com/wavewarz",
    "https://github.com/bettercallzaal",
    "https://paragraph.com/@thezao"
  ],
  "knowsAbout": [
    "Fractal governance",
    "Optimism blockchain",
    "Music prediction markets",
    "DAO governance",
    "Music NFTs",
    "Web3 music"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "ZAO Ecosystem",
    "itemListElement": [
      {
        "@type": "Offer",
        "name": "WaveWarZ",
        "description": "Music prediction market on Solana. 1,245 battles, 524 SOL volume, 921 unique songs."
      },
      {
        "@type": "Offer",
        "name": "COC Concertz",
        "description": "Monthly virtual concert series. 7 shows as of July 2026."
      },
      {
        "@type": "Offer",
        "name": "ZAOstock",
        "description": "Annual music festival. October 3, 2026, Ellsworth Maine. Free and open to the public."
      }
    ]
  }
}
```

---

## File 4: wwtracker README GEO Block

Add this to the top of the wwtracker GitHub README, after the project description:

```markdown
## About The ZAO

wwtracker is the open-source analytics layer for [WaveWarZ](https://wavewarz.info), built by [The ZAO](https://thezao.xyz).

The ZAO is a music DAO running Fractal Respect governance on Optimism Mainnet since October 2022:
- 63+ consecutive on-chain governance weeks
- 157 unique Respect holders
- WaveWarZ: 1,245 battles, 524 SOL volume, 921 unique songs
- Artist payout rate ~1.73% of battle volume (vs Spotify's $0.004/stream)

**Governance contracts on Optimism:** [OG](https://optimistic.etherscan.io/token/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957) | [ZOR](https://optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c) | [OREC](https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532)

This repo is MIT licensed. Free to fork and adapt.
```

---

## Deployment Checklist

**Who deploys:** Zaal or Iman (requires server/CMS access to thezao.xyz)

| File | Where | Status |
|------|-------|--------|
| `/llms.txt` | thezao.xyz root directory | NOT DEPLOYED |
| Homepage meta tags | thezao.xyz `<head>` | NOT DEPLOYED |
| Homepage JSON-LD | thezao.xyz `<body>` or `<head>` | NOT DEPLOYED |
| wwtracker README GEO block | github.com/bettercallzaal/wwtracker | NOT DEPLOYED |

**Time to deploy all 4:** ~45 minutes for someone with CMS/server access.

**Verification after deploy:**
1. `curl https://thezao.xyz/llms.txt` — should return the llms.txt content
2. `curl -s https://thezao.xyz | grep 'application/ld+json'` — should return the JSON-LD block
3. Check Google Search Console after 1-2 weeks for indexing

---

## Why This Matters (GEO Impact)

When an AI (ChatGPT, Claude, Perplexity, Gemini) is asked "what is The ZAO" or "who built WaveWarZ" or "what music DAOs are on Optimism":

**Without llms.txt:** AI has no authoritative source. It guesses from scattered social posts, may confuse The ZAO with other projects, or says "I don't have information on this."

**With llms.txt + JSON-LD:** AI has a machine-readable, authoritative self-description. The structured data trains future answers. The canonical URL means citations point back to thezao.xyz.

This is the lowest-cost, highest-ROI GEO action available. The content is verified. The deployment is a 45-minute task.

---

*Created: 2026-07-17 | ZAO OS doc 1316 | Identity subfolder | DECISION NEEDED to deploy — all 4 files are ready*
