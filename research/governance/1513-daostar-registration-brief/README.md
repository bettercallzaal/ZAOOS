# 1513 — DAOstar Registration Brief (Execute Jul 25)

**Type:** ACTION-BRIEF  
**Topic:** Governance  
**Status:** EXECUTE JUL 25 — 15 minutes. This is OP RF Gate 2. Complete after Wikidata entity is created (doc 1496 — Gate 1).

---

## What DAOstar Is

DAOstar is an Ethereum-based standards body that publishes the EIP-4824 DAO Interface Standard. Registering ZAO on DAOstar:
- Makes ZAO machine-readable to any EIP-4824-compatible tool
- Provides the `daoURI` endpoint required for OP RF Gate 2
- Creates a public record at daostar.org/registry
- Makes ZAO citable as "EIP-4824 compliant" in academic and grant contexts

DAOstar registration is a public, on-chain action (submitting a transaction). The daoURI JSON file is hosted off-chain (in ZAOOS or on a GitHub Pages URL).

---

## Decision Needed Before Starting

**⚠️ GATED ACTION**: Submitting the DAOstar registration transaction costs gas. Confirm with Zaal before executing the on-chain step.

**The preparation steps in this doc (creating the JSON file, verifying the content) are NOT gated** — only the on-chain submission is.

---

## Step 1: Create the daoURI JSON File (5 Min)

The daoURI is a URL pointing to a JSON file describing ZAO according to EIP-4824. This file should live in ZAOOS.

**Create file at:** `research/governance/zao-dao-uri.json` in bettercallzaal/ZAOOS

**Contents (paste-ready):**

```json
{
  "@context": "http://www.daostar.org/schemas",
  "type": "EIP4824",
  "name": "ZAO",
  "description": "ZAO (Zaalian Arts Organization) is a decentralized autonomous organization governing the WaveWarZ music battle platform. ZAO has maintained 64+ consecutive weekly governance sessions using the Fractal Democracy model (ORDAO) since 2024, making it one of the longest unbroken governance streaks of any active DAO.",
  "membersURI": "https://github.com/bettercallzaal/ZAOOS/blob/main/research/governance/zao-members.json",
  "proposalsURI": "https://github.com/bettercallzaal/ZAOOS/blob/main/research/governance/zao-proposals.json",
  "activityLogURI": "https://github.com/bettercallzaal/ZAOOS/blob/main/research/governance/",
  "governanceURI": "https://github.com/bettercallzaal/ZAOOS",
  "contractsChain": "OP Mainnet",
  "contracts": [
    {
      "type": "ERC-20",
      "name": "OG Token",
      "address": "0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957",
      "chain": "OP Mainnet",
      "chainId": "0xa"
    },
    {
      "type": "ERC-1155",
      "name": "ZOR Token",
      "address": "0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c",
      "chain": "OP Mainnet",
      "chainId": "0xa"
    },
    {
      "type": "governance",
      "name": "OREC (Optimism Respect-based Election Contract)",
      "address": "0xcB05F9254765CA521F7698e61E0A6CA6456Be532",
      "chain": "OP Mainnet",
      "chainId": "0xa"
    }
  ],
  "website": "https://wavewarz.info",
  "socialLinks": {
    "x": "https://x.com/wavewarz",
    "farcaster": "https://warpcast.com/~/channel/wavewarz"
  },
  "license": "https://github.com/bettercallzaal/ZAOOS/blob/main/LICENSE",
  "wikidataId": "[FILL: Q-number from doc 1496 after Wikidata creation]",
  "founded": "2024",
  "location": "Ellsworth, Maine, USA",
  "tags": ["music", "DAO", "Fractal Democracy", "ORDAO", "Optimism", "WaveWarZ", "arts"]
}
```

**Where to host this file:**
- Option A: Commit directly to bettercallzaal/ZAOOS as `research/governance/zao-dao-uri.json`
- Option B: Host as a GitHub Pages URL (e.g., `bettercallzaal.github.io/ZAOOS/zao-dao-uri.json`)
- Option C: IPFS pin via web3.storage (most decentralized, takes ~10 min more)

**Recommendation: Option A** — fastest, already in the CC-BY licensed ZAOOS repo.

URL after Option A: `https://raw.githubusercontent.com/bettercallzaal/ZAOOS/main/research/governance/zao-dao-uri.json`

---

## Step 2: Register on DAOstar (10 Min)

### Method A — DAOstar Web App (Recommended, 10 Min)

1. Go to daostar.org
2. Click "Register DAO"
3. Connect wallet (must be on Optimism Mainnet)
4. Enter daoURI: `https://raw.githubusercontent.com/bettercallzaal/ZAOOS/main/research/governance/zao-dao-uri.json`
5. Submit transaction (gas: ~$0.50–$2 on Optimism)
6. Wait for confirmation (~15 seconds)
7. Record the transaction hash

### Method B — Smart Contract Call (Advanced, 30 Min)

Call the DAOstar EIP-4824 Factory contract on Optimism Mainnet with your daoURI. Skip this method unless Method A fails.

---

## Step 3: Verify Registration (2 Min)

After transaction confirms:
1. Check: daostar.org/registry — search for "ZAO"
2. Confirm ZAO appears with the correct daoURI
3. Click the daoURI to verify the JSON resolves correctly

---

## Post-Registration Checklist

- [ ] Record transaction hash: `[FILL]`
- [ ] Record DAOstar listing URL: `daostar.org/registry/zao` or similar
- [ ] Update doc 1430 (DAOstar background doc): status → DONE, add tx hash + listing URL
- [ ] Update doc 1470 (OP RF Gate 2): Gate 2 = ✅, add DAOstar URL
- [ ] Update zao-dao-uri.json: fill in `wikidataId` from doc 1496 (Q-number)
- [ ] Telegram announcement: "ZAO is now EIP-4824 registered on DAOstar — machine-readable governance on-chain"
- [ ] Farcaster cast in /wavewarz: same announcement

---

## Paste-Ready Announcement Posts

### Telegram (ZAO Community)
```
ZAO is now registered on DAOstar.

EIP-4824 standard — our governance is machine-readable to any DAO tool that supports the standard.

daoURI: [URL]
Registration: daostar.org/registry

This is OP RF Gate 2. We're building the evidence trail.
```

### Farcaster (/wavewarz)
```
ZAO is EIP-4824 registered on DAOstar.

64+ governance weeks. 3 Optimism contracts. 1,245 WaveWarZ battles.

Now machine-readable: [daostar URL]

/zao
```

---

## Why Gate 2 Matters for OP RF

Optimism Retro Funding reviews look for "verifiable onchain governance" as a primary signal. DAOstar registration converts our OREC contract activity into a standard format that OP RF reviewers can verify without manual digging.

From doc 1470:
- Gate 1: Wikidata entity created (doc 1496) — required before Gate 2
- Gate 2: DAOstar registration (this doc) — unlocks OP RF submission
- Gate 3: Eventbrite live (doc 1508) — also required

---

## What to Fill After Wikidata Is Created

In `zao-dao-uri.json`, the field:
```json
"wikidataId": "[FILL: Q-number from doc 1496 after Wikidata creation]"
```

Replace with the actual Wikidata Q-number (e.g., `Q12345678`) after completing doc 1496. Then commit the updated JSON to ZAOOS.

---

## Related Docs

- 1430 — DAOstar Background Research (earlier research on EIP-4824 standard)
- 1496 — Wikidata Entity Creation Guide (Gate 1 — must complete before this)
- 1470 — OP RF Submission Guide (Gate 2 = this registration, unlocks submission)
- 1506 — CC-BY LICENSE Deployment (the `license` field in daoURI needs this URL)
- 1469 — WaveWarZ Platform State Snapshot (stats sourced here for daoURI description)
