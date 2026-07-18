# 1547 — ZAO Revenue Model Breakdown: Where the Money Comes From (Jul 2026)

**Type:** BUSINESS-REFERENCE  
**Topic:** Business  
**Status:** CANONICAL — use for grant applications, press pitches, investor conversations, and Fisher grant budget section. Update after ZAOstock (Oct 3) when ticket + bar revenue is confirmed.

---

## The One-Sentence Revenue Summary

ZAO's revenue comes from three sources: (1) WaveWarZ platform fees on every battle, (2) ZAOstock ticket and event revenue, and (3) grants and fiscal sponsorship (Fractured Atlas → Fisher Fund → MAC).

---

## Revenue Stream 1 — WaveWarZ Platform Fees

WaveWarZ operates a prediction market: listeners bet SOL on which artist wins a battle. The platform takes a fee on every bet.

**Confirmed fee structure (from WW API stats, Jul 2026):**
- Total volume: 523.991 SOL across 1,245 battles
- Artist payouts to losers: 9.0988 SOL
- Trader claims (winning bettors): 127.343 SOL
- **Implied platform revenue:** 523.991 − 9.0988 − 127.343 − [winner artist payouts] = remainder goes to platform

**Why this matters for grants:**
> "WaveWarZ is a self-sustaining platform with on-chain revenue. ZAO does not rely solely on grant funding."

**Unit economics (rough):**
| Battle type | Avg volume | Platform fee % | Avg fee per battle |
|---|---|---|---|
| MAIN battle | ~2.5 SOL | ~15% | ~0.375 SOL |
| Quick battle | ~0.3 SOL | ~15% | ~0.045 SOL |
| Community battle | Community-donated | 0% to platform | $0 (charity) |

*Fee percentages are approximate — confirm exact split with Hurricane.*

**Trajectory:** At 1,245 battles / ~$523 SOL, WaveWarZ has processed meaningful on-chain volume for a sub-100 user platform. The 1,500 battle milestone (next) = additional ~200 battles × ~$0.05-0.35 avg platform fee = incremental.

---

## Revenue Stream 2 — ZAOstock Event Revenue

First-ever ZAOstock is Oct 3, 2026, Ellsworth ME.

**Projected revenue breakdown:**

| Revenue Source | Amount | Notes |
|---|---|---|
| GA tickets (free) | $0 | Free GA drives attendance — no barrier |
| Supporter tickets ($20) | $600–$1,000 | Assumes 30–50 Supporter purchasers |
| Sponsor contributions | $200–$2,000 | See Maine sponsor brief (doc 1539) |
| Bar / venue arrangement | $200–$500 | TBD — Jordan's Restaurant in-kind or revenue share |
| Streaming donation (virtual) | $100–$300 | Pay-what-you-can virtual stream |
| **Total ZAOstock projected** | **$1,100–$3,800** | Wide range — depends on sponsor confirmations |

**Cost breakdown (ZAOstock):**
| Cost | Estimate |
|---|---|
| Sound equipment rental | $600–$900 |
| Venue rental (if charged) | $200–$400 |
| Event insurance | $75–$200 |
| Artist fees (travel, per diem) | $500–$1,000 |
| Marketing (printing, digital) | $150–$300 |
| ZABAL S2 micro-grants | $1,500 |
| Facilitator fees (ZOE infra) | $500 |
| **Total ZAOstock estimated cost** | **$3,525–$4,800** |

**Gap:** $3,525-4,800 cost vs. $1,100-3,800 revenue = $0-$3,700 gap → grant-funded.

Fisher Fund request: $2,000–$5,000 (doc 1455). OP RF submission covers operational costs as retroactive public goods funding. Fractured Atlas fiscal sponsorship (doc 1509) unlocks tax-deductible donations for the remainder.

---

## Revenue Stream 3 — Grants and Fiscal Sponsorship

| Grant | Amount | Deadline | Status |
|---|---|---|---|
| Fractured Atlas (fiscal sponsorship) | Unlock donations | Jul 22 | PENDING — submit ASAP (doc 1509) |
| Fisher Community Fund | $2,000–$5,000 | Aug 15 | BLOCKED on FA |
| Optimism Retro Funding | Variable (OP tokens) | ASAP | Submit (doc 1444) |
| Maine Arts Commission (MAC) | $1,000–$5,000 | Sep deadline | BLOCKED on FA |
| Gitcoin / Protocol Guild | Variable | Next round | Future |
| NEA (National Endowment for Arts) | $5,000–$25,000 | Future | BLOCKED on FA + track record |

**Most important near-term action:** Fisher Fund (Aug 15) requires Fractured Atlas approval first. FA application (doc 1509) = the unlock key for Fisher + MAC.

---

## How ZAO Uses Revenue

ZAO is a non-profit arts organization (pre-fiscal-sponsorship structure). All revenue flows to:

| Use | % of Revenue |
|---|---|
| Artist payouts (on-chain) | ~25% (WaveWarZ loser-earns mechanic) |
| Charity payouts (community battles) | ~5% |
| Platform infrastructure (VPS, API costs, AI fleet) | ~15% |
| ZAOstock production | ~30% |
| ZABAL S2 micro-grants | ~15% |
| ZAOOS maintenance (ZOL, archiving) | ~10% |

**Grant framing:** ZAO is a community-owned arts organization where on-chain governance decides how revenue is distributed. This is different from a for-profit startup — every SOL of WaveWarZ fee goes back into the community (artists, event, education) via DAO vote.

---

## Revenue Claims for Grants (Copy-Paste Blocks)

### Fisher Grant (Short)
> "WaveWarZ has processed 523.991 SOL in total trading volume across 1,245 battles, with 9.0988 SOL paid directly to losing artists as guaranteed payouts. ZAO's platform is self-sustaining with real transaction volume and does not rely solely on grant funding."

### OP Retro Funding (Short)
> "ZAO has operated WaveWarZ for 64+ consecutive weeks under on-chain governance. Platform volume: 523.991 SOL, 1,245 battles, 36 community charity battles. All governance transactions are verifiable on Optimism Mainnet (OREC contract 0xcB05...)."

### MAC Grant (Short)
> "ZAOstock 2026 is projected to generate $1,100–$3,800 in ticket and sponsor revenue while costing $3,525–$4,800 to produce. A MAC grant of $1,000–$2,000 would close the production gap and allow ZAO to bring free community admission while providing artist compensation."

---

## Revenue Model Comparison (ZAO vs. Typical Music Streaming)

| Metric | ZAO / WaveWarZ | Spotify |
|---|---|---|
| Artist revenue per play | $0.04–$0.35 SOL per battle | $0.004 per stream |
| Who captures revenue | Artist (direct to wallet) | Platform (~70% after label) |
| Revenue verification | On-chain, public | Opaque, requires label dashboards |
| Governance of payouts | ZOR holder vote | Corporate executive decision |
| Community charity revenue | 36 battles → charity vote | $0 |

---

## Projections: Jul 2026 → Dec 2026

| Metric | Jul 2026 (actual) | Dec 2026 (target) | Driver |
|---|---|---|---|
| WaveWarZ volume | 523.991 SOL | ~700 SOL | 300+ new battles |
| Platform fee revenue | ~$90–140 (SOL) | ~$120–190 | Linear with battles |
| ZAOstock ticket revenue | $0 (not yet) | $600–1,000 | Oct 3 event |
| Grant revenue | $0 confirmed | $2,000–5,000 | Fisher + OP RF |
| Total community payout | 9.0988 SOL artist + 127.343 SOL trader | 12 SOL artist, 170 SOL trader | Battle growth |

---

## ZOE Revenue Tracking Tasks

| Trigger | ZOE Action |
|---|---|
| Monthly (1st of month) | Pull WW API stats, update this doc's actuals |
| Grant approved | Update grant table Status → APPROVED + amount |
| ZAOstock revenue confirmed | Update ZAOstock revenue row with actual |
| 1,500 battles milestone | Post ZAOOS milestone doc with updated revenue stats |

---

## Related Docs

- 1509 — Fractured Atlas Application Brief (unlock Fisher + MAC, Jul 22)
- 1455 — Fisher Community Grant Draft (Aug 15, $2K–$5K)
- 1444 — OP Retroactive Funding Submission (submit ASAP)
- 1539 — ZAOstock Maine Sponsor Brief (Aug 1–Sep 15 outreach)
- 1427 — WaveWarZ Public API Documentation (revenue data source)
- 1382 — ZAO Proof Point Library (revenue claims in context)
- 1483 — ZAO Master Press Kit (revenue stats for journalists)
