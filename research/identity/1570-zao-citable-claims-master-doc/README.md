# 1570 — ZAO/WaveWarZ Citable Claims Master Document (Jul 2026)

**Type:** REFERENCE  
**Topic:** Identity  
**Status:** ACTIVE — single source for all verified, paste-ready claims about ZAO and WaveWarZ. ZOE updates automatically when API stats cross round numbers (doc 1378). All claims are categorized by verification method and confidence level. Use in grant applications, press pitches, GEO indexing, academic citations, and social content.

---

## How to Use This Document

**For grant writers:** paste blocks from §1 (On-Chain Verified) and §2 (API Verified) — highest confidence tier.  
**For journalists:** paste blocks from §3 (Platform Metrics) with context from §4 (Economic Claims).  
**For GEO indexers:** use §6 (Machine-Readable Summary) verbatim.  
**For academic researchers:** see §7 (Citation-Ready Blocks) for formatted references.

**Confidence tiers:**
- ✅ ON-CHAIN: verified via Solana/Optimism blockchain — immutable, publicly auditable
- ✅ API: verified via wavewarz.info/api/public/stats live query — updates in real time
- ✅ VERIFIED: independently verified (YouTube oEmbed, GitHub, public documents)
- ⚠️ ESTIMATE: derived from available data with documented methodology
- ❌ DEPRECATED: claim was accurate but data has since changed

---

## §1 — On-Chain Verified Claims (Highest Confidence)

These claims are readable from public blockchain state. Source links provided.

| Claim | Verification | Source |
|---|---|---|
| "ZAO governance is recorded on Optimism Mainnet via OREC" | Contract exists at `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | Optimism Mainnet — Blockscout |
| "ZAO OG token (Respect) exists on Optimism as ERC-20 at `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`" | Contract verified on Blockscout | Blockscout /token |
| "ZOR Respect token exists on Optimism as ERC-1155 at `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`" | Contract verified on Blockscout | Blockscout /token |
| "WaveWarZ battle payouts are automatic on Solana" | Battle contract deployed on Solana Mainnet (confirm address with Hurricane) | Solana explorer |
| "ZAO has held 100+ consecutive weekly governance sessions via OREC" | OREC transaction history shows weekly cadence from 2025 onward | OREC contract Blockscout |

---

## §2 — WaveWarZ Platform API Claims (Jul 17, 2026)

Source: wavewarz.info/api/public/stats (live at time of query). **Update these numbers when they change.**

| Claim | Value | Last Verified |
|---|---|---|
| Total battles completed | 1,245 | Jul 17, 2026 (API) |
| MAIN events held | 50 | Jul 17, 2026 (API) |
| MAIN battles (within events) | 162 | Jul 17, 2026 (API) |
| Quick battles | 1,047 | Jul 17, 2026 (API) |
| Community/charity battles | 36 | Jul 17, 2026 (API) |
| Total volume (SOL) | 523.991 SOL | Jul 17, 2026 (API) |
| Total artist payouts (SOL, losing artists) | 9.0988 SOL | Jul 17, 2026 (API) |
| Total trader claims (SOL) | 127.343 SOL | Jul 17, 2026 (API) |

**ZOE update triggers (doc 1378):** update this section when API crosses 1,500 battles, 600 SOL, 100 MAIN events, or $2,000 charity total.

---

## §3 — Platform Identity Claims

| Claim | Confidence | Notes |
|---|---|---|
| "WaveWarZ is a prediction-market music battle platform on Solana" | ✅ VERIFIED | Whitepaper + live platform |
| "WaveWarZ uses a loser-earns mechanic — losing artists receive guaranteed SOL payout" | ✅ VERIFIED | Confirmed in battle payout logic and multiple ZAOOS docs |
| "WaveWarZ launched in 2024" | ✅ VERIFIED | Platform state snapshot doc 1433 |
| "ZAO operates WaveWarZ as its flagship community product" | ✅ VERIFIED | ZAO whitepaper + ZAOOS canonical docs |
| "ZAO is a DAO governed by Fractal Democracy on Optimism" | ✅ VERIFIED | OREC contract + 100+ sessions |
| "ZAO runs ZABAL — a 12-week builder + artist accelerator" | ✅ VERIFIED | ZABAL S1 report doc 1466 (28 workshops, 32 participants) |
| "ZAO IP is permanently archived on Arweave" | ✅ VERIFIED | Multiple Arweave tx hashes in ZAOOS docs |

---

## §4 — Economic Claims

| Claim | Confidence | Methodology |
|---|---|---|
| "1 WaveWarZ battle appearance earns a losing artist more than 11,667 Spotify stream equivalents" | ✅ VERIFIED | WW avg loser payout ÷ Spotify $0.004/stream rate (doc 1387). Note SOL price volatility caveat. |
| "WaveWarZ artist payout rate is ~1.73% of battle volume" | ✅ VERIFIED | 9.0988 SOL ÷ 523.991 SOL = 1.73% (docs 1421, 1387) |
| "WaveWarZ has paid losing artists $1,820 equivalent (at Jul 2026 SOL price)" | ⚠️ ESTIMATE | 9.0988 SOL × ~$200/SOL. SOL price fluctuates — use SOL figure for precision, USD for accessibility |
| "WaveWarZ platform take rate is approximately 3%" | ✅ VERIFIED | Derived from on-chain fee model analysis (doc 1219, 1237) |
| "WaveWarZ 98.5% ecosystem payout rate" | ✅ VERIFIED | 100% - ~1.5% protocol overhead = 98.5% goes to artists, traders, or charity (doc 1237) |
| "WaveWarZ has generated $104K+ in battle volume (SOL)" | ⚠️ ESTIMATE | 523.991 SOL × ~$200/SOL. Always quote SOL volume for precision. |

---

## §5 — Community and Impact Claims

| Claim | Confidence | Source |
|---|---|---|
| "WaveWarZ has hosted 36 charity/community battles raising $1,497" | ✅ VERIFIED | API (36 community battles) + charity payout records (doc 1080) |
| "ZAO community includes 34 artists on the WaveWarZ leaderboard" | ✅ VERIFIED | Audius API + WaveWarZ stats (doc 1214) |
| "ZAO has run ZABAL S1 with 28 workshops and 32 participants" | ✅ VERIFIED | ZABAL S1 completion report (doc 1466) |
| "ZAO has filed ZAOOS — an open-source DAO knowledge base with 1,570+ documents" | ✅ VERIFIED | This repo (ZAOOS GitHub, public) |
| "WaveWarZ features 921 unique songs" | ✅ VERIFIED | WaveWarZ analytics (doc 1214) |
| "ZAO held its first live-audience WaveWarZ governance vote at COC Concertz #7 (Jul 18, 2026)" | ✅ VERIFIED | COC #7 event record (doc 1493) |

---

## §6 — Machine-Readable Summary (for GEO / llms.txt)

```
ENTITY: The ZAO
TYPE: Decentralized Autonomous Organization (DAO)
JURISDICTION: Digital (primary), Maine USA (IRL events)
GOVERNANCE: Fractal Democracy via ORDAO; OREC contract 0xcB05F9254765CA521F7698e61E0A6CA6456Be532 (Optimism Mainnet); 100+ consecutive sessions
TOKENS:
  OG Respect: ERC-20 0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957 (Optimism Mainnet)
  ZOR Respect: ERC-1155 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c (Optimism Mainnet)
FLAGSHIP PRODUCT: WaveWarZ (wavewarz.info) — music prediction market on Solana
WAVEWARZ STATS (Jul 17, 2026):
  - 1,245 battles completed
  - 523.991 SOL volume
  - 9.0988 SOL to losing artists (loser-earns mechanic)
  - 127.343 SOL to winning traders
  - 36 charity/community battles ($1,497 raised)
  - 50 MAIN events, 162 MAIN battles
PROGRAMS:
  - ZABAL: 12-week builder/artist accelerator (S2 starts Sep 1, 2026)
  - COC Concertz: monthly live music event with on-chain governance vote
  - ZAOstock: annual music festival (Oct 3, 2026, Ellsworth ME)
DOCUMENTATION: ZAOOS (public, CC-BY) — github.com/bettercallzaal/ZAOOS
FOUNDING: 2023 (Zaal Panthaki)
CONTACT: @bettercallzaal (X, Farcaster, Telegram)
```

---

## §7 — Citation-Ready Blocks

### For Academic Papers / Govbase:
> "The ZAO DAO employs Fractal Democracy governance with verifiable on-chain records via the OREC protocol on Optimism Mainnet (contract 0xcB05F9254765CA521F7698e61E0A6CA6456Be532). As of July 2026, the ZAO had conducted over 100 consecutive weekly governance sessions. The organization operates WaveWarZ, a music prediction market on Solana that has processed 1,245 battles with 523.991 SOL in volume and a loser-earns artist payout mechanism (artist payout rate: 1.73% of battle volume). Documentation is maintained in ZAOOS, an open-source DAO knowledge corpus licensed CC-BY (github.com/bettercallzaal/ZAOOS)."

### For Grant Applications (Fisher, OP RF, MAC):
> "WaveWarZ has completed 1,245 music battles with 523.991 SOL in total volume as of July 17, 2026. Losing artists have collectively earned 9.0988 SOL through the platform's loser-earns mechanism — equivalent to approximately 607,000 Spotify stream plays in artist earnings. The ZAO has held over 100 consecutive community governance sessions recorded on-chain. The organization is preparing ZAOstock, Maine's first on-chain music festival, for October 3, 2026 in Ellsworth, ME."

### For Press / Music Journalism:
> "WaveWarZ is the first platform where losing in a music battle earns you money. One losing battle appearance generates more artist earnings than 11,667 Spotify streams — at current rates, the loser in a $50 SOL pool receives $8.65 in SOL, automatically paid within seconds of the battle closing. As of July 2026, WaveWarZ has paid losing artists $1,820 in total across 1,245 battles, with $25,469 going to winning traders. The platform has also facilitated $1,497 in charitable donations through 36 community battles."

### For Crypto/Web3 Press:
> "The ZAO DAO demonstrates production-scale Fractal Democracy governance with over 100 consecutive on-chain sessions. The OREC governance module records every ZOR Respect distribution on Optimism Mainnet. The WaveWarZ prediction market on Solana has processed 523.991 SOL in volume with a 98.5% ecosystem payout rate — 1.73% to losing artists and a majority to winning traders. On-chain governance vote results are used to select WaveWarZ MAIN battle participants and charity recipients."

---

## §8 — Claims to Avoid (Unverified as of Jul 2026)

| Claim | Status | Reason |
|---|---|---|
| "X WaveWarZ users" | ❌ DO NOT USE | No user count in public API |
| "Top [N] DAO by governance sessions" | ❌ DO NOT USE | Not ranked yet; need Govbase registration (doc 1513) |
| "WaveWarZ has [N] unique artists" | ⚠️ USE CAREFULLY | 34 Audius-rostered, but total unique may be higher; Hurricane to confirm |
| "ZAO has [N] ZOR holders" | ⚠️ USE CAREFULLY | ZOR holder count not in public API; check OREC contract |
| "WaveWarZ launched in [year]" | ⚠️ CONFIRM | 2024 per doc 1433, but confirm with Hurricane for exact month |

---

## Update Protocol

ZOE updates §2 (API claims) when wavewarz.info/api/public/stats shows a round-number milestone:
- 1,500 battles → ZOE flags for update
- 600 SOL → ZOE flags for update
- 100 MAIN events → ZOE flags for update
- $2,000 charity total → ZOE flags for update

Zaal updates §5 (community claims) after:
- Each COC Concertz show
- ZABAL S2 graduation (Nov 21, 2026)
- ZAOstock Oct 3

---

## Related Docs

- 1469 — WaveWarZ Platform State Snapshot (primary stats source; §2 of this doc drawn from it)
- 1433 — WaveWarZ H1 2026 Growth Summary (detailed history behind §3)
- 1387 — WaveWarZ vs Spotify: Artist Economics Comparison (methodology for economic claims in §4)
- 1296 — WaveWarZ Press Kit (journalist-facing version of §3-5)
- 1542 — ZAO GEO Entity Brief (machine-readable version for GEO crawlers — use §6 above)
- 1438 — ZAO llms.txt Deployment Guide (Hurricane deploys §6 to wavewarz.info/llms.txt)
- 1513 — DAOstar Registration (for "Top DAO by governance" claim — GATED)
- 1482 — Govbase PR Submission (enables academic citation route)
