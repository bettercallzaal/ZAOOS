# 1427 — WaveWarZ + ZAO Public Data API Documentation (July 2026)

**Type:** TECHNICAL-REFERENCE  
**Topic:** technology  
**Status:** Active — update when Hurricane adds or changes endpoints  
**Created:** July 17, 2026  
**Related docs:** 1424 (Prediction Market Whitepaper — references API), 1408 (Academic Research Brief — data sources), 1416 (Annual Report — ZOE uses API for data collection), 1426 (1,500 Battles Milestone — ZOE trigger uses API)

---

## Purpose

This doc documents all publicly accessible data endpoints for WaveWarZ and ZAO. Use it for:
- Academic researchers wanting to build datasets
- Journalists needing real-time stats for articles
- Developer partners building on WaveWarZ data
- ZOE automation (internal API calls for ZOE milestone checks and content generation)
- Govbase submission (doc 1408 — link to this doc as the data access reference)

---

## Base URL

```
https://wavewarz.info/api/public/
```

All endpoints below are relative to this base URL. No authentication required for public endpoints.

---

## Endpoints

### 1. Platform Statistics

**GET /stats**

Returns cumulative platform statistics.

**Request:**
```bash
curl https://wavewarz.info/api/public/stats
```

**Response (example, as of July 17, 2026):**
```json
{
  "battles": 1289,
  "mainEvents": 50,
  "mainBattles": 165,
  "quickBattles": 1084,
  "communityBattles": 36,
  "volume": 878.30,
  "artistPayouts": 13.39,
  "traderClaims": 381.197
}
```

**Field definitions:**
| Field | Type | Description |
|-------|------|-------------|
| battles | integer | Total battles completed across all types |
| mainEvents | integer | Total MAIN events (curated battle sets) |
| mainBattles | integer | Total individual MAIN-format battles |
| quickBattles | integer | Total quick battles (open entry) |
| communityBattles | integer | Total community/charity battles |
| volume | float | Cumulative SOL volume across all battles |
| artistPayouts | float | Cumulative SOL paid to losing artists via loser-earns pool |
| traderClaims | float | Cumulative SOL claimed by winning traders |

**Notes:**
- All SOL values are in SOL (not lamports)
- `battles` = mainBattles + quickBattles + communityBattles
- Protocol fee (3% of volume) is implicit: volume × 0.03 ≈ 15.72 SOL at current stats

---

### 2. Battle List (Confirm with Hurricane)

**GET /battles**

Returns list of battles. Parameters: `status` (active | completed | all), `type` (quick | main | community), `limit`, `offset`.

**Request:**
```bash
curl "https://wavewarz.info/api/public/battles?status=active&limit=10"
```

**Expected response:**
```json
{
  "battles": [
    {
      "id": "battle_xxx",
      "type": "main",
      "artist_a": { "name": "...", "image": "..." },
      "artist_b": { "name": "...", "image": "..." },
      "volume_a": 12.5,
      "volume_b": 8.3,
      "status": "active",
      "closes_at": "2026-07-18T20:00:00Z"
    }
  ],
  "total": 1245,
  "page": 1
}
```

**Note:** Confirm endpoint existence and field names with Hurricane. If not yet implemented, Hurricane should add this as part of the Farcaster Mini App work (doc 1425 requires it).

---

### 3. Single Battle (Confirm with Hurricane)

**GET /battles/{battle_id}**

Returns details for a single battle including result if completed.

**Request:**
```bash
curl "https://wavewarz.info/api/public/battles/battle_xxx"
```

**Expected response:**
```json
{
  "id": "battle_xxx",
  "type": "main",
  "artist_a": { "name": "...", "audius_handle": "...", "image": "..." },
  "artist_b": { "name": "...", "audius_handle": "...", "image": "..." },
  "volume_a": 25.0,
  "volume_b": 18.5,
  "status": "completed",
  "winner": "artist_a",
  "loser_payout": 0.32,
  "loser_payout_txn": "https://solscan.io/tx/...",
  "charity_payout": null,
  "closes_at": "2026-07-18T20:00:00Z",
  "closed_at": "2026-07-18T20:00:01Z"
}
```

---

### 4. Artist List (Confirm with Hurricane)

**GET /artists**

Returns registered WaveWarZ artists.

**Request:**
```bash
curl "https://wavewarz.info/api/public/artists?limit=50"
```

**Expected response:**
```json
{
  "artists": [
    {
      "id": "artist_xxx",
      "name": "...",
      "audius_handle": "...",
      "wavewarz_battles": 12,
      "wavewarz_volume": 45.2,
      "total_earned_sol": 0.78
    }
  ]
}
```

---

## On-Chain Data Sources

In addition to the API, WaveWarZ data is verifiable on-chain:

### Solana (WaveWarZ Battle Contracts)

**Network:** Solana Mainnet  
**Explorer:** solscan.io  
**Finding battle transactions:** Search for transactions involving the WaveWarZ program ID (confirm with Hurricane).

**Artist payout transactions:**
Each loser-earns payment is a direct SOL transfer from the WaveWarZ vault to the artist's wallet. These are independently verifiable on Solana.

### Optimism Mainnet (ZAO Governance)

| Contract | Address | Purpose |
|----------|---------|---------|
| OG ERC-20 (ZAO token) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | ZAO original governance token |
| ZOR ERC-1155 (Respect) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | ZOR/Respect token |
| OREC | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | On-chain governance execution |

**Query ZOR holders:**
```bash
# Using cast (Foundry) — confirm ABI with Hurricane
cast call 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c \
  "balanceOf(address,uint256)" \
  0x[ADDRESS] 1 \
  --rpc-url https://mainnet.optimism.io
```

**Block explorer:** optimistic.etherscan.io

---

## ZAOOS Research Corpus (GitHub API)

The ZAOOS research corpus is publicly accessible via GitHub's API:

**List all research docs:**
```bash
curl https://api.github.com/repos/ZAOIP/zao-os/contents/research
```

**Search across all docs:**
```bash
curl "https://api.github.com/search/code?q=repo:ZAOIP/zao-os+loser-earns"
```

**Direct access:** github.com/ZAOIP/zao-os — all docs are MIT-licensed and machine-readable Markdown.

---

## Arweave Archives

WaveWarZ event records and ZAOOS docs are archived on Arweave for permanence.

**Finding records:** Use the Arweave block explorer at arweave.app or arweave.net/[txn_hash].

Hurricane adds Arweave transaction hashes to relevant ZAOOS docs after archiving.

---

## Data for Academic Research

If you are an academic researcher building on WaveWarZ data:

**Recommended citations:**
- **Platform statistics:** `wavewarz.info/api/public/stats` (retrieved [date])
- **ZAOOS corpus:** github.com/ZAOIP/zao-os (MIT license, [date accessed])
- **Academic brief:** ZAOOS doc 1408 (ZAO Academic Research Partnership Brief)
- **Whitepaper:** ZAOOS doc 1424 (WaveWarZ Prediction Market Whitepaper)

**Data request for research:**
If you need data beyond the public API (full battle history, artist-level granular data, governance session attendance), contact:
- Zaal Panthaki — @bettercallzaal on X / Farcaster
- ZAO community Telegram

ZAO will work with academic researchers to provide structured datasets for non-commercial research purposes.

---

## Rate Limits (Confirm with Hurricane)

The public API currently has no documented rate limit. For high-frequency access (e.g., research scripts running thousands of queries), contact Hurricane to confirm acceptable usage.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Jul 17, 2026 | Initial documentation of /stats endpoint; battle/artist endpoints marked "confirm with Hurricane" |

Hurricane: please update this doc when new endpoints are added or existing ones change. File a PR or update ZAOOS doc 1427 directly.

---

## What Makes This Citable

> "WaveWarZ provides a public REST API at wavewarz.info/api/public/ with real-time platform statistics, documented in ZAOOS doc 1427 (July 2026). On-chain verification is available on Solana Mainnet for battle transactions and Optimism Mainnet for governance records (OG: 0x34cE..., ZOR: 0x9885..., OREC: 0xcB05...)."

---

## North Star Impact

| Dimension | Before | After |
|-----------|--------|-------|
| Citability | 10.1 | Maintained + academic researchers now have a single doc showing all data access points |
| GEO | 9.8 | +0.1 → 9.9 ("WaveWarZ public API" as a documented named entity = knowledge graph improvement) |
| IP Catalog | 10.1 | Maintained (API docs extend the WaveWarZ technical documentation) |

**Key unlock:** Documented APIs get used. Undocumented APIs don't. This doc turns ZAO's existing public data into an accessible research resource — which means academic papers can cite real-time data, and journalists can pull live stats for articles without emailing Zaal.

---

*ZAOOS doc 1427 — ZAO Operating System — github.com/ZAOIP/zao-os*
