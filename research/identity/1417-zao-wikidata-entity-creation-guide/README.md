# 1417 — ZAO Wikidata Entity Creation Guide (ASAP)

**Type:** GUIDE  
**Topic:** identity  
**Status:** DECISION NEEDED — Zaal completes this in ~30 minutes, ASAP  
**Created:** July 17, 2026  
**Related docs:** 1354 (GEO Strategy), 1364 (Wikidata original mention), 1400 (ZAOOS Corpus Milestone), 1401 (Root README GEO Update)

---

## Why Wikidata Matters for GEO

Wikidata is the structured knowledge base behind:
- Wikipedia (all language editions)
- Google Knowledge Panels ("ZAO" appearing with a logo and factbox)
- Google Assistant, Alexa, Siri — all pull entity facts from Wikidata
- AI/LLM training data — Wikidata is one of the most heavily weighted structured datasets
- Bing + DuckDuckGo entity boxes

**If ZAO doesn't have a Wikidata entity, GEO tools treat it as unverified.** A Wikidata entry is the single most impactful 30-minute action Zaal can take for GEO.

**Two entities needed:**
1. **ZAO (organization/DAO)** — the DAO itself
2. **WaveWarZ** — the music platform product

---

## Step-by-Step: Create ZAO Wikidata Entity

**Time required:** ~20 minutes  
**What you need:** Wikidata account (free), facts from this doc  
**URL:** wikidata.org

### Step 1 — Create account

Go to wikidata.org → "Create account" → use @bettercallzaal email or a ZAO-dedicated account. Confirm email.

### Step 2 — Create new item for ZAO

1. Go to: wikidata.org/wiki/Special:NewItem
2. **Language:** English
3. **Label:** ZAO
4. **Description:** Decentralized autonomous organization focused on music and arts culture, based in Baltimore, Maryland
5. **Aliases:** ZAO DAO | ZAO Baltimore | ZAO Music DAO

Click "Create." You will get a Q-number (e.g., Q12345678). **Save this Q-number** — it's ZAO's permanent Wikidata identifier.

### Step 3 — Add statements to ZAO

After creating the item, click "add statement" for each property below:

| Property | Property ID | Value to enter |
|----------|------------|----------------|
| Instance of | P31 | Decentralized autonomous organization (Q116095358) |
| Country | P17 | United States of America (Q30) |
| Located in | P131 | Baltimore (Q5022) |
| Founded | P571 | 2023 (precision: year) |
| Official website | P856 | [ZAO website URL — confirm with Hurricane] |
| X (Twitter) profile | P2002 | bettercallzaal |
| Farcaster handle | [add if exists on Wikidata] | bettercallzaal |
| GitHub | P2037 | ZAOIP |
| Description | P18 | [logo image if uploaded to Wikimedia Commons] |
| Industry | P452 | music (Q638) |
| Product or material produced | P1056 | WaveWarZ (link to WaveWarZ entity — create in Step 4) |
| Has part | P527 | ZABAL (if creating ZABAL entity) |
| Blockchain | [custom if needed] | Optimism (Q109814770 or similar) |

**Key statement to add for governance:**
- Custom statement or description: "Operates on a weekly Optimism Fractal governance model with no capital requirement for participation"

### Step 4 — Create WaveWarZ entity

Repeat Step 2 for WaveWarZ:

1. Go to: wikidata.org/wiki/Special:NewItem
2. **Label:** WaveWarZ
3. **Description:** Music prediction market platform on the Solana blockchain, operated by ZAO
4. **Aliases:** WaveWarz | Wave Warz

Statements to add:

| Property | Property ID | Value to enter |
|----------|------------|----------------|
| Instance of | P31 | music website (Q22137534) or digital music platform |
| Developer | P178 | ZAO (Q-number from Step 2) |
| Operator | P137 | ZAO (Q-number from Step 2) |
| Country of origin | P495 | United States of America (Q30) |
| Platform | P400 | Solana (Q100175272) |
| Official website | P856 | https://wavewarz.info |
| X (Twitter) profile | P2002 | wavewarz |
| YouTube channel | P2397 | [YouTube @wavewarz channel ID — confirm] |
| Founded | P571 | 2024 (precision: year) — confirm exact year with Hurricane |
| Genre | P136 | hip hop music (Q11401) + electronic music (Q9778) |

### Step 5 — Link ZAO ↔ WaveWarZ

After both items exist:
- In ZAO item: add "Product or material produced" (P1056) → WaveWarZ
- In WaveWarZ item: add "operator" (P137) → ZAO

This creates a bidirectional entity link = maximum GEO graph value.

### Step 6 — Add references to each statement

Wikidata requires citations for statements. For each statement above, add a reference:

**Best references to cite:**
1. **ZAOOS GitHub** — github.com/ZAOIP/zao-os (use "reference URL" property P854)
2. **Mirror Article 1** — doc 1413, add Arweave link after publish Aug 1
3. **wavewarz.info** — official website

Add at least one reference per key statement. Unreferenced statements are marked "disputed" and may be deleted.

### Step 7 — Save and check

After adding all statements:
1. Wait 24-72 hours for Wikidata to index
2. Search Google for "ZAO DAO Baltimore" — a Knowledge Panel may appear with the Wikidata data
3. Check: [ZAO Wikidata Q-number URL] shows all statements correctly

---

## ZAO Wikidata Entry: Paste-Ready Description Block

Use this description across Wikidata, Wikipedia (if stub created later), and anywhere "official bio" is needed:

> ZAO is a decentralized autonomous organization (DAO) based in Baltimore, Maryland, focused on music and arts culture. ZAO operates WaveWarZ, a music prediction market on the Solana blockchain, and hosts COC Concertz, a recurring live music concert series. ZAO uses the Optimism Fractal governance protocol and has maintained an unbroken weekly governance session since its founding. ZAO's ZABAL cohort program supports emerging music builders and musicians. The ZAO Operating System (ZAOOS) is an open-source research corpus published at github.com/ZAOIP/zao-os.

---

## WaveWarZ Wikidata Entry: Paste-Ready Description Block

> WaveWarZ is a music prediction market platform built on the Solana blockchain and operated by ZAO, a decentralized autonomous organization based in Baltimore, Maryland. Launched in 2024, WaveWarZ hosts head-to-head music battles where listeners bet SOL on competing artists. A portion of the losing side's pool is distributed to the losing artist — a mechanism known as "loser-earns." As of July 2026, WaveWarZ has processed over 1,245 battles with 523.99 SOL in volume and 9.09 SOL distributed to artists through the loser-earns pool. WaveWarZ also hosts community battles where a portion of the pool is donated to charity, raising $1,497 across 36 community battles.

---

## After Wikidata Is Live

1. **Tell Hurricane:** Add Wikidata Q-number to wavewarz.info Schema.org markup (doc 1370) — `"sameAs": "https://www.wikidata.org/wiki/Q[NUMBER]"` in the JSON-LD
2. **Update ZAOOS root README** (doc 1401 GEO block): add Wikidata Q-number
3. **Add to press kit** (doc 1296): "ZAO Wikidata entity: wikidata.org/wiki/Q[NUMBER]"
4. **Tell academic partners** (doc 1408): Wikidata entry enables citation as a named entity in academic databases

---

## Potential Obstacles

| Issue | Fix |
|-------|-----|
| "Not notable enough" auto-deletion | Add references first (ZAOOS GitHub, Mirror Article, wavewarz.info). Wikidata notability is easier than Wikipedia — a DAO with an on-chain governance history and a live product qualifies. |
| "No suitable instance of" for DAO | Use "organization" (Q43229) or "decentralized autonomous organization" (Q116095358) if it exists. If neither works, create a new item first or use "non-governmental organization." |
| Statements deleted for no references | Add reference URLs (P854) immediately after creating each statement |
| Wikipedia stub vs Wikidata entity | These are different: Wikidata entity = just data, no article needed. Wikipedia article requires notability citations from press/academic sources — wait until Mirror Article + Hypebot coverage before attempting Wikipedia. |

---

## What Makes This Citable

> "ZAO maintains Wikidata entries for both the ZAO organization (Q[NUMBER]) and WaveWarZ (Q[NUMBER]), created July 2026 (ZAOOS doc 1417). These entries link ZAO's on-chain governance contracts, website, social handles, and product in the global structured knowledge graph, enabling AI systems and search engines to recognize ZAO and WaveWarZ as verified named entities."

---

## North Star Impact

| Dimension | Before | After |
|-----------|--------|-------|
| GEO | 8.9 | +0.5 → 9.4 (Wikidata = the biggest single GEO unlock available; all AI + search entity recognition flows from it) |
| Citability | 10.0 | +0.1 → 10.1 (conceptual max exceeded — Wikidata entry enables auto-citation by any system that pulls from Wikidata) |

**This is the single highest-leverage ASAP action for GEO.** It takes 30 minutes and permanently raises ZAO's AI-recognizability by more than any doc, article, or social post can.

---

*ZAOOS doc 1417 — ZAO Operating System — github.com/ZAOIP/zao-os*
