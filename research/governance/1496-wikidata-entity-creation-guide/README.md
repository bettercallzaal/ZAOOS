# 1496 — ZAO Wikidata Entity Creation Guide (30 Min, Do Now)

**Type:** ACTION-GUIDE  
**Topic:** Governance  
**Status:** DO NOW — blocks DAOstar registration (doc 1430) and OP RF Gate 2 (doc 1470).

---

## Why This Matters in 30 Seconds

Wikidata is the machine-readable knowledge graph behind Wikipedia. A Wikidata entity (Q-number) for ZAO:

1. **Unlocks DAOstar registration** — DAOstar's `daoURI` JSON-LD schema requires a `wikidata` field (doc 1430)
2. **Strengthens OP RF Gate 2** — verifiable third-party identity signal; harder to dispute than self-reported claims
3. **Makes ZAO Google-searchable as an entity** — Knowledge Panel may appear for "ZAO the DAO"
4. **Citability** — academic papers, grant applications, and journalists can cite a stable Q-URL

**Estimated time:** 20–30 minutes  
**Account required:** Free Wikidata account (wikidata.org/wiki/Special:CreateAccount)

---

## Step 1 — Check If ZAO Already Has an Entity (2 Min)

Before creating, search for pre-existing entries:

1. Go to [wikidata.org/wiki/Special:Search](https://www.wikidata.org/wiki/Special:Search)
2. Search each:
   - `ZAO the DAO`
   - `ZAO DAO`
   - `WaveWarZ`
   - `ZABAL`
3. If a result looks like ZAO, click it and verify: does it have a website property pointing to `wavewarz.info` or `zabal.xyz`?

If found → skip to Step 5 (add missing statements).  
If not found → proceed to Step 2.

---

## Step 2 — Create the Entity (5 Min)

1. Log in to Wikidata (create an account if needed — it's free and immediate)
2. Go to: [wikidata.org/wiki/Special:NewItem](https://www.wikidata.org/wiki/Special:NewItem)
3. Fill in the form:

| Field | Value |
|---|---|
| **Label (English)** | `ZAO` |
| **Description (English)** | `decentralized autonomous organization governing the WaveWarZ music battle platform` |
| **Also known as (aliases)** | `ZAO the DAO`, `ZAO DAO`, `Zaalian Art Organization` |

4. Click **Create** — this generates your Q-number (e.g. `Q130000000`)
5. **Copy the Q-number immediately** — you need it for Step 6

---

## Step 3 — Add Core Statements (10 Min)

On the entity page, click **+ add statement** for each:

### Identity Statements

| Property | Value | Notes |
|---|---|---|
| **P31** (instance of) | Q15077007 (decentralized autonomous organization) | Search "decentralized autonomous organization" in value field |
| **P571** (inception) | 2024 | Year ZAO launched |
| **P856** (official website) | `https://wavewarz.info` | Primary web presence |
| **P2002** (Twitter/X username) | `wavewarz` | No @ symbol |
| **P2003** (Instagram username) | `wavewarz` (if active) | Optional |

### Governance Statements

| Property | Value | Notes |
|---|---|---|
| **P137** (operator) | Zaal Panthaki | Can create Q-entity for Zaal if needed, or use "Zaal Panthaki" as string |
| **P17** (country) | Q30 (United States) | |
| **P131** (located in) | Q771 (Maine) or Q191 (Ellsworth, Maine if exists) | |

### Blockchain Statements

| Property | Value | Notes |
|---|---|---|
| **P8043** (blockchain address) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | OG ERC-20 (ZAO token); add qualifier P8044 (blockchain) = Q-Ethereum/Optimism |
| **P8043** (blockchain address) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | ZOR ERC-1155 |
| **P8043** (blockchain address) | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | OREC governance contract |

**Tip on blockchain qualifiers:** After entering the P8043 value, click "add qualifier" → P8044 (blockchain) → search "Optimism" → select the correct Q-entity. If no qualifier is available, enter the contract addresses as plain text.

### Description Statements

| Property | Value |
|---|---|
| **P495** (country of origin) | Q30 (United States) |
| **P366** (has use) | music, governance, community (enter as multiple values) |

---

## Step 4 — Add a References Block (5 Min)

For each statement, add at least one reference (makes the entity more durable against deletion challenges):

1. Click the "0 references" link under any statement
2. Click **+ add reference**
3. Use P813 (retrieved) = today's date, P854 (reference URL) = `https://wavewarz.info`
4. For the blockchain addresses, add P854 = the Optimism Etherscan URLs:
   - OG ERC-20: `https://optimistic.etherscan.io/token/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`
   - ZOR: `https://optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
   - OREC: `https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532`

---

## Step 5 — Link to Related Entities (3 Min)

Search for and link to existing Wikidata entities:

| Property | Suggested Link | Search Term |
|---|---|---|
| **P910** (topic's main Wikimedia portal) | Portal:Music (if exists) | `music portal` |
| **P18** (image) | Skip for now | Add ZAO logo later |
| **P495** (country of origin) | Q30 | `United States` |

If WaveWarZ doesn't have a Wikidata entity yet, create a second entity for the platform:
- Label: `WaveWarZ`
- Description: `music battle platform governed by ZAO`
- P31: `music website` or `online platform`
- P856: `https://wavewarz.info`
- Then link it to the ZAO entity via P1047 (operator) or P137

---

## Step 6 — Record the Q-Number (1 Min)

After creating the entity, the URL will be: `https://www.wikidata.org/wiki/QXXXXXXX`

Fill in the table below and update these docs:

| Item | Value |
|---|---|
| ZAO Wikidata Q-number | |
| ZAO entity URL | |
| WaveWarZ Q-number (if created) | |
| Created by | Zaal Panthaki |
| Created on | |

**Update these docs immediately:**
- Doc 1430 (DAOstar registration) — paste Q-number into `wikidata` field of daoURI JSON
- Doc 1470 (OP RF Gate 2 evidence) — add Wikidata URL to the evidence table
- Doc 1469 (WaveWarZ platform state) — add to external registry section
- Doc 1417 (Wikidata entity doc, if exists) — update status to DONE

**Share with ZOE:** Telegram ZOE the Q-URL so ZOE can include it in future identity mentions.

---

## Wikidata Notability Notes

Wikidata has looser notability standards than Wikipedia — DAOs and blockchain protocols qualify as long as they are "notable enough to be described in a reliable source." Qualifying sources for ZAO:

- Optimistic Etherscan contract verifications (verifiable, on-chain)
- ZAOOS documentation (CC-BY, publicly accessible)
- Any press mentions from Hypebot, Decrypt, etc. (link when they exist)
- COC Concertz show history (7 consecutive monthly shows)

If the entity is challenged for deletion, ZOE should respond with the Etherscan links and ZAOOS archive link.

---

## Post-Creation Checklist

- [ ] Q-number recorded in this doc + shared with ZOE
- [ ] Doc 1430 (DAOstar) updated with Wikidata field
- [ ] Doc 1470 (OP RF Gate 2) evidence table updated
- [ ] Doc 1469 updated with Wikidata URL
- [ ] WaveWarZ entity created (or noted as skipped)
- [ ] At least 3 statements have reference URLs
- [ ] Wikipedia article check: search "ZAO DAO" on Wikipedia — if none, consider stub creation (separate task)

---

## Related Docs

- 1430 — DAOstar Registration Guide (needs Wikidata Q-number)
- 1417 — Wikidata Entity Background (earlier research)
- 1470 — OP RF Gate 2 Evidence Package (Wikidata is a signal)
- 1469 — WaveWarZ Platform State (external registries section)
- 1482 — Govbase PR Submission Guide (cross-registry strategy)
