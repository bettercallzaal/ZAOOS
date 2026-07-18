---
topic: identity/geo
type: GUIDE
status: ACTIVE — self-serve, no approval needed, ~30 min for Zaal
created: 2026-07-17
related-docs: 1221, 1354, 1359, 1362, 1363
owner: Zaal (creates the entity)
---

# 1364 — ZAO Wikidata Entity Setup Guide (Jul 2026)

> **Why Wikidata first:** Wikidata is the structured knowledge graph that powers Wikipedia infoboxes, Google Knowledge Panels, and is directly indexed by LLMs (ChatGPT, Gemini, Perplexity all pull from Wikidata). Creating a Wikidata entity for The ZAO is self-serve, takes 30 minutes, requires no approval, costs nothing, and immediately makes ZAO visible to every LLM and search engine that reads Wikidata. It also creates the citable reference that will go in the Wikipedia article's infobox. Doc 1354 ranked this G04 = highest priority non-gated GEO action.
>
> **Time estimate:** 30 minutes total. 10 min account setup (if no Wikidata account), 20 min creating the entity.
>
> **Prerequisites:** Wikidata account at wikidata.org (free, just an email). No technical setup required.

---

## Part 1: What to Create

Create **two Wikidata entities**:

1. **Q-entity: "The ZAO"** — the organization itself
2. **Q-entity: "WaveWarZ"** — the music platform (linked from The ZAO entity)

You can do them in one sitting. Start with WaveWarZ (simpler) then The ZAO (links to WaveWarZ).

---

## Part 2: Step-by-Step — Creating "WaveWarZ" Entity

### Step 1: Go to wikidata.org → Create new item

URL: `https://www.wikidata.org/wiki/Special:NewItem`

### Step 2: Fill in the label + description

| Field | Value |
|-------|-------|
| **Label (English)** | `WaveWarZ` |
| **Description (English)** | `music battle platform built on Solana where artists compete in head-to-head battles` |
| **Also known as (aliases)** | `Wave WarZ`, `wavewarz.info` |

### Step 3: Add statements (properties)

Click "add statement" for each:

| Property | Property ID | Value |
|----------|------------|-------|
| instance of | P31 | `website` + `music service` |
| country of origin | P495 | `United States` |
| official website | P856 | `https://wavewarz.info` |
| platform | P400 | `Solana` (create or find the Solana entity) |
| founded by | P112 | `Zaal Panthaki` (create a person entity if needed, or link if exists) |
| operator | P137 | `The ZAO` (link back after creating The ZAO entity) |
| genre | P136 | `music` |
| source code repository | P1324 | *(leave blank — WaveWarZ is proprietary)* |
| described at URL | P973 | `https://github.com/bettercallzaal/ZAOOS` |

### Step 4: Add references to each statement

For the "official website" statement, add a reference:
- Reference URL: `https://wavewarz.info`
- Retrieved: today's date

---

## Part 3: Step-by-Step — Creating "The ZAO" Entity

### Step 1: Go to wikidata.org → Create new item

URL: `https://www.wikidata.org/wiki/Special:NewItem`

### Step 2: Fill in the label + description

| Field | Value |
|-------|-------|
| **Label (English)** | `The ZAO` |
| **Description (English)** | `American music-focused decentralized autonomous organization operating WaveWarZ and ZAOstock` |
| **Also known as (aliases)** | `ZTalent Artist Organization`, `ZAO`, `The ZAO DAO` |

### Step 3: Add statements (in this order)

| Property | Property ID | Value | Reference |
|----------|------------|-------|-----------|
| instance of | P31 | `decentralized autonomous organization` + `nonprofit organization` | — |
| country of citizenship | P27 | `United States` | — |
| official website | P856 | `https://thezao.xyz` | URL retrieved: today |
| founded | P571 | `2025` (approximate — use year precision) | — |
| described at URL | P973 | `https://github.com/bettercallzaal/ZAOOS` | URL retrieved: today |
| has product or material produced | P1056 | `WaveWarZ` (link to the WaveWarZ Q-entity you just created) | — |
| genre | P136 | `music`, `blockchain` | — |
| blockchain | *(custom — or use "uses" / "platform" property)* | `Optimism`, `Solana` | — |
| social media followers | P8687 | *(see below)* | — |
| Twitter/X username | P2002 | `WaveWarZ` | — |
| Farcaster username | *(check if property exists)* | `zaalcaster` | — |
| GitHub username | P6715 | `bettercallzaal` | — |

### For the blockchain governance:

| Property | Value |
|----------|-------|
| instance of | decentralized autonomous organization |
| governance model | `Fractal governance` (if Wikidata entity exists; else type as string) |
| location of creation | `United States` |
| number of members | 188 (approximate, Jul 2026) |

### Step 4: Add sitelinks (if Wikipedia article exists)

Once the Wikipedia article (doc 1359) is accepted, come back and add the sitelink:
- Language: `en`
- Article: `The ZAO (organization)` (or whatever title is used)

---

## Part 4: Verify These Related Entities Exist (or Create Them)

Before creating The ZAO entity, check if these already exist on Wikidata. Search at wikidata.org:

| Entity | Expected to exist? | If not: create? |
|--------|-------------------|----------------|
| Fractal governance | Possibly — search "Fractal governance" | Yes — simple 1-statement entity |
| Solana (blockchain) | Almost certainly — search "Solana" | No, find and link it |
| Optimism (blockchain) | Almost certainly — search "Optimism blockchain" | No, find and link it |
| Decentralized autonomous organization | Yes | No |

---

## Part 5: After Creating the Entities

### Within 48 hours:
1. Copy the Q-numbers of both entities (e.g., `Q123456789` for The ZAO, `Q987654321` for WaveWarZ)
2. Add to ZAOOS doc 1352 (IP catalog) in the on-chain + digital asset table
3. Add to the Wikipedia article draft (doc 1359) in the infobox section: `| wikidata = Q123456789 |`
4. Update doc 1354 GEO strategy: G04 = DONE, check it off

### ZOE automation:
- ZOE can't create Wikidata entities (requires human login + CAPTCHA), but ZOE can:
  - Monitor the entity quarterly for vandalism or incorrect edits
  - Add new statistics to the entity as ZAO milestones are reached (e.g., update "number of members" annually)

---

## Part 6: What This Unlocks

| Downstream effect | Timeline |
|------------------|---------|
| LLM indexing of The ZAO | 1-4 weeks after entity creation |
| Google Knowledge Panel (possible) | Weeks to months — depends on Google's entity indexing |
| Wikipedia infobox "wikidata = Q..." | When article is accepted |
| Structured data in search results | Ongoing, as Wikidata propagates |
| Schema.org alignment | WaveWarZ entity → can reference in JSON-LD (doc 1354 G05) |

**GEO impact:** +0.5/10 immediately (LLMs read Wikidata directly). If Google Knowledge Panel triggers, up to +1.0/10.

---

## Part 7: Common Wikidata Mistakes to Avoid

| Mistake | How to avoid |
|---------|-------------|
| Adding unverified facts | Only add facts you can reference with a URL |
| Using wrong property IDs | Search for the property name in the "add statement" search box |
| Duplicate entity | Search before creating — "The ZAO" may already exist under a different name |
| Missing references | Every statement should have at least one reference URL |
| Overly promotional language | Wikidata descriptions should be neutral (e.g., "music battle platform" not "revolutionary music platform") |
| Wrong instance type | Use "decentralized autonomous organization" not just "organization" — specificity helps LLM queries |

---

*Created: 2026-07-17 | Execute: self-serve, ~30 min | Priority: G04 from doc 1354, highest non-gated GEO action | After completing: update doc 1352 (IP catalog) with Q-numbers + doc 1354 (GEO strategy) with G04 DONE | Related: 1221 (GEO master plan), 1354 (GEO strategy), 1359 (Wikipedia draft — add wikidata Q-number to infobox), 1362 (press kit — add Wikidata link to links table)*
