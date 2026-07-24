# 1482 — Govbase PR Submission Guide (ZAO Entry, Jul 25)

**Type:** ACTION-BRIEF  
**Topic:** Governance  
**Status:** EXECUTE JUL 25 — 30-minute task; adds ZAO to the governance research database used by academics, journalists, and DAO researchers. Stats refreshed 2026-07-24.

---

## What Is Govbase?

Govbase is an open-source database of governance structures across DAOs, platforms, and digital communities. Maintained by the Metagov community. Used by:
- Academic researchers studying DAO governance
- Journalists writing about decentralized organizations
- DAOstar and similar governance standards bodies
- Gitcoin, Optimism, and other DAO ecosystems for ecosystem mapping

**Why ZAO needs to be in Govbase:**
1. **Research citability**: journalists and academics searching for music DAOs will find ZAO
2. **OP RF citability**: OP RF reviewers often cross-reference Govbase for governance legitimacy
3. **DAOstar connection**: Govbase and DAOstar are companion registries; ZAO should be in both
4. **96-week streak documentation**: Govbase lets ZAO claim the Fractal Democracy streak in a searchable, permanent database

---

## Govbase Repository

Govbase is on GitHub: `github.com/metagov/govbase`

Submissions are made by opening a Pull Request that adds a new JSON entry to the appropriate folder.

**Main data file for DAOs:** `data/orgs/`

---

## Step-by-Step: Open the Govbase PR

### Step 1: Fork the Govbase Repo (5 min)

1. Go to: github.com/metagov/govbase
2. Click "Fork" (top right) to create your own copy
3. Clone your fork: `git clone https://github.com/bettercallzaal/govbase.git`
4. Or: edit directly in GitHub browser editor (easier, 0 setup)

### Step 2: Create ZAO Entry File (10 min)

Navigate to `data/orgs/` in the repo. Look at an existing entry (e.g., MakerDAO, Gitcoin) to understand the JSON structure.

Create a new file: `data/orgs/zao-the-dao.json`

**Paste-ready ZAO entry (JSON):**

```json
{
  "name": "The ZAO",
  "shortName": "ZAO",
  "type": "DAO",
  "sector": "Music / Creative Economy",
  "description": "The ZAO (Zeal Autonomous Organization) is a music DAO that operates WaveWarZ, a music battle prediction market on Solana where losing artists earn from trading activity. ZAO uses Fractal Democracy governance, with 96+ consecutive weekly governance sessions as of July 2026.",
  "website": "https://wavewarz.info",
  "socialLinks": {
    "twitter": "https://twitter.com/wavewarz",
    "farcaster": "https://warpcast.com/~/channel/zao",
    "github": "https://github.com/bettercallzaal/ZAOOS"
  },
  "blockchain": "multi-chain",
  "chains": ["Optimism Mainnet", "Solana"],
  "contracts": [
    {
      "name": "ZAO OG Token (ERC-20)",
      "address": "0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957",
      "chain": "Optimism Mainnet",
      "type": "Governance Token"
    },
    {
      "name": "ZOR Token (ERC-1155)",
      "address": "0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c",
      "chain": "Optimism Mainnet",
      "type": "Governance Token"
    },
    {
      "name": "OREC (Optimistic Respect-based Executive Contract)",
      "address": "0xcB05F9254765CA521F7698e61E0A6CA6456Be532",
      "chain": "Optimism Mainnet",
      "type": "Governance Contract"
    }
  ],
  "governanceModel": "Fractal Democracy (ORDAO / Optimistic Respect)",
  "governanceDetails": {
    "model": "Fractal Democracy",
    "framework": "ORDAO (Optimistic Respect-based DAO)",
    "sessionFrequency": "weekly",
    "consecutiveSessions": 96,
    "sessionStartDate": "2025",
    "rankingMechanism": "peer ranking in small groups (fractals) of 3-5",
    "respectScoring": "Fibonacci-weighted (55/34/21/13/8 by rank position)",
    "governanceToken": "ZOR (ERC-1155 on Optimism Mainnet)"
  },
  "primaryActivity": "Music battle prediction market (WaveWarZ)",
  "platformStats": {
    "totalBattles": 1289,
    "totalVolumeSOL": 878.2995,
    "artistPayoutsSOL": 9.0988,
    "traderClaimsSOL": 381.197,
    "asOf": "2026-07-24"
  },
  "notableFeatures": [
    "Loser-earns mechanic: losing artists earn ~10% of trading pool per battle",
    "96+ consecutive weekly Fractal Democracy governance sessions (as of Jul 2026)",
    "Three live smart contracts on Optimism Mainnet",
    "Free community music festival (ZAOstock) on Oct 3, 2026 in Ellsworth, Maine"
  ],
  "tags": ["music", "prediction-market", "fractal-democracy", "ordao", "solana", "optimism", "creator-economy"],
  "addedDate": "2026-07-25",
  "addedBy": "bettercallzaal (Zaal Panthaki, co-founder)"
}
```

### Step 3: Open the Pull Request (5 min)

1. Commit the new file to your fork with message: `Add ZAO (The ZAO) - music DAO with Fractal Democracy governance`
2. Go to github.com/metagov/govbase
3. Click "New Pull Request" → compare your fork branch
4. Title: `Add ZAO (The ZAO) — music battle DAO with 96-week Fractal Democracy streak`
5. Description:

```
Adding ZAO (The ZAO) to the Govbase DAO registry.

ZAO is a music DAO that operates WaveWarZ, a music battle prediction market on Solana.

Governance highlights:
- 96+ consecutive weekly Fractal Democracy governance sessions (as of Jul 2026)
- Framework: ORDAO (Optimistic Respect-based DAO) — Fibonacci-weighted peer ranking
- 3 live contracts on Optimism Mainnet (OG token, ZOR token, OREC)
- 157 ZOR token holders

Platform stats (as of Jul 24, 2026):
- 1,289 WaveWarZ battles
- 878.30 SOL in volume ($66,110 USD at $75.27/SOL)
- 381.20 SOL in trader claims paid out
- 9.0988 SOL in artist payouts (loser-earns on-chain)

Research archive: https://github.com/bettercallzaal/ZAOOS (1,700+ CC-BY licensed documents)
Wikidata: [add when Wikidata entity is created — doc 1417]
```

6. Submit PR

---

## After the PR Is Merged

1. **Add Govbase URL to ZAOOS canonical docs** — update doc 1469 (WaveWarZ platform state) and doc 1475 (Fractal Democracy guide) with the Govbase entry link
2. **Update OP RF application** — add Govbase entry as supporting evidence (doc 1470)
3. **Update DAOstar registration** — DAOstar accepts Govbase entries as corroborating governance records (doc 1430)
4. **ZOE Telegram post:**
```
📋 ZAO is now listed in Govbase — the academic DAO governance database maintained by the Metagov community.

96 consecutive weekly governance sessions. 3 Optimism Mainnet contracts. 1,289 WaveWarZ battles.

[GOVBASE_LINK]
```

---

## Govbase PR: Expected Timeline

| Step | Time |
|---|---|
| Fork + create file | 10 min |
| Submit PR | 5 min |
| Metagov review | 1-4 weeks |
| PR merged | 2-6 weeks total |

**Metagov review note:** Govbase maintainers are academics and open-source contributors. PRs are reviewed on their own timeline. There is no way to expedite. Submit Jul 25 and follow up at 2 weeks if no response.

---

## Govbase vs DAOstar: Difference

| | Govbase | DAOstar |
|---|---|---|
| What it is | Research database of governance structures | Technical governance standard (DAO URI, EIP-4824) |
| Who uses it | Academics, journalists, researchers | DAO tools, dashboards, OP RF reviewers |
| How to submit | GitHub PR | daostar.io web form |
| Approval time | 2-6 weeks | Instant (self-service) |
| OP RF relevance | Supporting evidence | Formal gate (doc 1430) |

**ZAO should be in BOTH.** DAOstar is OP RF Gate 2 (higher urgency). Govbase is for long-term academic citability.

---

## Citable (After Govbase Merge)

> "The ZAO is listed in Govbase (metagov/govbase), the academic governance research database maintained by the Metagov community, with 96+ consecutive Fractal Democracy sessions documented." (for OP RF, press, grant applications)

---

## Related Docs

- 1450 — DAOstar Registration Guide (companion registry; higher urgency for OP RF)
- 1470 — OP RF Submission Guide (references Govbase as supporting evidence)
- 1475 — Fractal Democracy Session Guide (the 96-week streak Govbase documents)
- 1430 — DAOstar Registration Brief (Gate 2 for OP RF — do this first)
- 1417 — Wikidata Entity Creation Guide (Gate 1 for OP RF — do this first)
