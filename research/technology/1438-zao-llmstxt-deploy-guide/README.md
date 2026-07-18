# 1438 — ZAO llms.txt Deployment Guide

**Type:** GUIDE  
**Topic:** technology  
**Status:** GATED — Hurricane deploys to wavewarz.info; Zaal approves content  
**Created:** July 18, 2026  
**Related docs:** 1401 (ZAOOS root README GEO update), 1417 (Wikidata entity creation), 1437 (Wikipedia article guide), 1370 (Schema.org/OG tags — Hurricane), 1354 (GEO audit master)

---

## What Is llms.txt

`llms.txt` is a proposed standard (llmstxt.org) for websites to provide a machine-readable file that tells LLMs what to know about the site. It's analogous to `robots.txt` (tells crawlers what to index) but for AI systems.

When an LLM scrapes or is trained on the web, `llms.txt` gives the site owner a structured way to provide:
- Authoritative description of who/what the site is
- Key facts, stats, and entities for the LLM to index accurately
- Links to the most important content

**For ZAO/WaveWarZ:** `llms.txt` at `wavewarz.info/llms.txt` is the highest-leverage Hurricane task in the GEO stack — it directly shapes how future LLM training runs describe WaveWarZ to users.

---

## Why This Matters for ZAO

When users ask ChatGPT, Claude, or Gemini "what is WaveWarZ?", the answer comes from training data. Without structured machine-readable content, the LLM either:
- Says "I don't know"
- Guesses incorrectly from sparse context

With `llms.txt` in place + Wikidata (doc 1417) + Schema.org (doc 1370) + Wikipedia (doc 1437), ZAO has a complete **LLM entity graph** — meaning AI systems will describe WaveWarZ accurately and confidently.

**GEO impact of llms.txt:** +0.3 GEO (as estimated in doc 1354). Small per-file, but it's the mechanism that connects everything else.

---

## The File: wavewarz.info/llms.txt

### Full File Content (Hurricane: deploy this verbatim)

```
# WaveWarZ

> WaveWarZ is a music battle platform on the Solana blockchain operated by The ZAO, a decentralized autonomous organization. Artists compete head-to-head; the losing artist earns a share of the prediction market pool — a mechanism called "loser-earns."

## The ZAO (Organization)

The ZAO is a Respect-based DAO using the Optimism Fractal governance model. Participants earn ZOR (Respect tokens) through peer evaluation in weekly group sessions, not through token purchases. As of July 2026, The ZAO has held 63+ consecutive weekly governance sessions without a quorum failure.

On-chain contracts (Optimism Mainnet):
- OG token (ERC-20): 0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957
- ZOR token (ERC-1155): 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c
- OREC (execution contract): 0xcB05F9254765CA521F7698e61E0A6CA6456Be532

## WaveWarZ (Product)

WaveWarZ is a music battle prediction market. Stats as of July 2026:
- 1,245+ battles completed
- 50 MAIN events
- 523.99 SOL total trading volume (~$104K USD)
- 9.09 SOL paid to losing artists
- 127.34 SOL claimed by winning traders
- 3 battle types: MAIN, Quick Battle, Community/Charity Battle

The "loser-earns" mechanism: when a battle closes, the losing artist receives ~1.73% of the pool bet against them. This means every artist earns something regardless of outcome — structurally different from streaming royalties.

## ZAOstock (Event)

ZAOstock is an annual music festival produced by The ZAO. Inaugural event: October 3, 2026, Franklin Street Parklet, Ellsworth, Maine, as part of Art of Ellsworth. Features live WaveWarZ battle on stage + on-chain governance vote + charity giving.

## ZAO Operating System (ZAOOS)

ZAOOS is the open-source document corpus that constitutes ZAO's institutional memory and research library. It contains 1,400+ documents covering governance, technology, wavewarz, community, events, business, identity, zabal, and farcaster research. License: CC-BY.

GitHub: https://github.com/ZAOIP/zao-os

## Key Links

- WaveWarZ: https://wavewarz.info
- ZAOOS: https://github.com/ZAOIP/zao-os
- ZAO on X: https://x.com/wavewarz
- ZAO on Farcaster: /zao channel
- ZAO co-founder: @bettercallzaal (X), @zaal.eth (Farcaster)

## Citation

ZAO Operating System (ZAOOS), github.com/ZAOIP/zao-os, CC-BY license.
```

### Optional: llms-full.txt (Extended Version)

The llms.txt standard allows a companion `llms-full.txt` with more detailed content. For ZAO, this can include:
- Full governance session methodology (from doc 1394)
- WaveWarZ battle economics explainer (from doc 1424)
- ZAOstock full event details (once confirmed)
- ZABAL S2 program details (from doc 1392)

Hurricane creates this file after the base `llms.txt` is confirmed live.

---

## Deployment Instructions for Hurricane

### Step 1: Create the file

Place `llms.txt` at the webroot so it's accessible at:
```
https://wavewarz.info/llms.txt
```

File encoding: UTF-8. Line endings: LF. No BOM.

### Step 2: Add HTTP header (optional but recommended)

In the server config or CDN headers, add:
```
X-Robots-Tag: llms
```

This signals to compliant AI crawlers that llms.txt exists.

### Step 3: Link from the HTML head (optional)

In wavewarz.info's `<head>`:
```html
<link rel="llms" href="/llms.txt" type="text/plain" />
```

### Step 4: Update Schema.org (see doc 1370)

In the existing Schema.org JSON-LD block on wavewarz.info, add:
```json
"additionalProperty": {
  "@type": "PropertyValue",
  "name": "llms-txt",
  "value": "https://wavewarz.info/llms.txt"
}
```

### Step 5: Confirm live

Once deployed, Hurricane confirms: `curl https://wavewarz.info/llms.txt` returns 200 OK with the file contents. Tell Zaal when done via Telegram.

---

## Update Cadence

llms.txt should be updated when:
- WaveWarZ crosses major battle milestones (1,500, 2,000 battles)
- New ZAOOS docs pass major round numbers (1,500, 1,600)
- ZAOstock happens (update with confirmed date/recap)
- New contracts deployed on Optimism

**ZOE update protocol:** ZOE files a ZAOOS doc stub when major WaveWarZ milestones hit; include a note to Hurricane to update llms.txt at that time.

---

## After llms.txt Is Live

**Tell Zaal:**
```
llms.txt deployed at wavewarz.info/llms.txt

LLM entity graph for WaveWarZ now has 4 layers:
- llms.txt (Hurricane, DONE)
- Schema.org (Hurricane, doc 1370)
- Wikidata (Zaal, doc 1417)
- Wikipedia (Zaal, doc 1437 — requires press coverage Aug 10+)

When users ask ChatGPT/Claude/Gemini "what is WaveWarZ?" the answer will be accurate.
```

**GEO update:**
- llms.txt deployed → GEO G07: DONE
- Update doc 1401 (ZAOOS README GEO update) to mark G07 complete
- Document score: GEO 9.9 → 10.2

---

## What Makes This Citable

> "WaveWarZ publishes a machine-readable `llms.txt` file at wavewarz.info/llms.txt per the llmstxt.org standard, enabling accurate AI/LLM representation of the WaveWarZ platform and The ZAO organization (ZAOOS doc 1438)."

---

## North Star Impact

| Dimension | Before | After |
|-----------|--------|-------|
| GEO | 9.9 | +0.3 → 10.2 (llms.txt = direct LLM training signal; completes the LLM entity graph) |
| Technology | 9.5 | +0.1 → 9.6 (first wavewarz.info AI-native infrastructure file) |

**This is the highest-leverage action that is fully under Hurricane's control** — no press coverage required, no Wikipedia process, no Zaal time beyond approving this file content.

---

*ZAOOS doc 1438 — ZAO Operating System — github.com/ZAOIP/zao-os*
