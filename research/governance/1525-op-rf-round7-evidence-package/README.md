# 1525 — OP RF Round 7: ZAO On-Chain Evidence Package

**Type:** SUBMISSION-EVIDENCE  
**Topic:** Governance  
**Status:** BUILD ALONGSIDE DOC 1470 — this is the evidence dossier that doc 1470's 9-gate checklist points to. Submit together when gates are cleared. DAOstar registration (doc 1513) and Govbase PR (doc 1482, Jul 25) are prerequisite gates.

---

## Purpose

Optimism Retro Funding (RF) requires verifiable evidence that ZAO has delivered public good on Optimism. This doc compiles all on-chain citations, verifiable URLs, and submission-ready proof statements. Use this as the paste-ready source for the OP RF submission form.

---

## ZAO on Optimism Mainnet: The Three Contracts

All governance happens on Optimism Mainnet. These are the verifiable on-chain sources for every claim below.

| Contract | Address | Explorer |
|---|---|---|
| OG (ERC-20) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | optimistic.etherscan.io/token/0x34cE89... |
| ZOR (ERC-1155) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | optimistic.etherscan.io/token/0x9885CC... |
| OREC (Governance) | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | optimistic.etherscan.io/address/0xcB05F9... |

ZOR holders use OREC to vote on community WaveWarZ battles, ZABAL grant recipients, and ZAOstock charity payouts. Every vote is recorded on-chain.

---

## Gate 1: Consecutive Governance Sessions

**Claim:** ZAO has run 64+ consecutive weekly governance sessions (as of Jul 2026).

**On-chain verification:**
- OREC contract at `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` — review function call history
- Each session creates an on-chain proposal + vote record
- Optimistic Etherscan tx history shows unbroken weekly cadence from 2025 to present

**Paste-ready citation:**
> "ZAO has run 64 consecutive weekly on-chain governance sessions governing WaveWarZ and the ZABAL grant program, verified on OREC at 0xcB05F9254765CA521F7698e61E0A6CA6456Be532 on Optimism Mainnet."

**ZAOOS source:** doc 1469 (WaveWarZ Platform State Snapshot)

---

## Gate 2: Public Goods Delivered via WaveWarZ

**Claim:** WaveWarZ distributes automatic payouts to losing artists — a public-good redistribution mechanism.

**On-chain verification:**
- Solana Mainnet battle contracts: automatic payout txns on every battle close
- 9.0988 SOL ($1,820 equivalent) distributed to losing artists across 1,245 battles
- Public API: `wavewarz.info/api/public/stats` (live, no auth required)

**Paste-ready citation:**
> "WaveWarZ has completed 1,245 battles with 523.991 SOL in total volume. Losing artists automatically receive 10% of each battle pool — 9.0988 SOL distributed to losing artists as of Jul 2026, with no claiming required. API: wavewarz.info/api/public/stats"

**ZAOOS source:** doc 1433 (H1 2026 Platform Growth Summary)

---

## Gate 3: Community Battle Charity Payouts

**Claim:** ZOR holder votes determine which artist's battle pool goes to charity in Community Battle format.

**On-chain verification:**
- ZOR (ERC-1155) holders vote via OREC on community battle charity recipients
- 36 community battles completed; verified via WaveWarZ API (`communityBattles` field)
- Charity wallet receives on-chain payout directly from the battle contract

**Paste-ready citation:**
> "ZAO has completed 36 community battles where ZOR token holders vote on-chain to determine which artist's battle winnings go to a designated charity. Governance happens via OREC on Optimism Mainnet. Volume sourced from wavewarz.info/api/public/stats"

**ZAOOS source:** doc 1446 (charity selection), doc 1237 (on-chain economics)

---

## Gate 4: ZAOOS — Open-Access Governance Archive (CC-BY 4.0)

**Claim:** ZAO maintains a public, open-licensed archive of 1,500+ governance documents.

**Verifiable URLs:**
- GitHub: `github.com/bettercallzaal/ZAOOS` — public repository, 1,500+ research docs
- License: CC BY 4.0 (once doc 1506 deploys the LICENSE file)
- Arweave permanence: permanent decentralized archive of governance records
- Raw data access: GitHub API → `api.github.com/repos/bettercallzaal/ZAOOS`

**Paste-ready citation:**
> "ZAOOS is a CC-BY 4.0 licensed archive of 1,500+ ZAO governance documents, publicly accessible at github.com/bettercallzaal/ZAOOS and permanently archived on Arweave. The corpus documents every ZAO governance session, WaveWarZ platform analysis, grant application, and community initiative."

**ZAOOS source:** doc 1401 (ZAOOS README), doc 1506 (CC-BY license deployment)

---

## Gate 5: DAOstar Registration

**Claim:** ZAO is registered with DAOstar, the DAO standards organization.

**Verifiable URL:**
- DAOstar registration: `daostar.org` (after doc 1513 execute)
- EIP-4824 daoURI JSON: `raw.githubusercontent.com/bettercallzaal/ZAOOS/main/research/governance/zao-dao-uri.json`

**Paste-ready citation:**
> "ZAO is registered with DAOstar (daostar.org) under EIP-4824. The daoURI file at [daoURI URL] lists all three governance contracts and references the ZAOOS archive."

**Gate status:** ⚠️ PENDING — Doc 1513 contains the execute brief. DAOstar registration requires on-chain tx (~$0.50-$2 gas on Optimism Mainnet). Confirm with Zaal before executing.

**ZAOOS source:** doc 1513 (DAOstar registration brief)

---

## Gate 6: Govbase Entry

**Claim:** ZAO is listed in Govbase, the open dataset of governance organizations.

**Verifiable URL:**
- Govbase: `thelao.io/govbase` (once PR from doc 1482 merges)
- GitHub PR: the PR submitted as part of doc 1482 (execute Jul 25)

**Paste-ready citation:**
> "ZAO is listed in Govbase (thelao.io/govbase), the open dataset of DAO governance organizations, documenting the OREC contract address and 64-week session history."

**Gate status:** ⚠️ PENDING — Execute Jul 25 per doc 1482.

**ZAOOS source:** doc 1482 (Govbase PR submission)

---

## Gate 7: ZAOstock IRL Governance Vote

**Claim:** ZAO holds in-person DAO governance at a live music festival (ZAOstock, Oct 3).

**Evidence after Oct 3:**
- Eventbrite: event URL from doc 1508 (launches Jul 21)
- ZOR holder vote on-chain: OREC tx from Oct 3 governance moment
- Post-event debrief: ZAOOS doc created within 48h of ZAOstock

**Paste-ready citation (use after Oct 3):**
> "ZAOstock (Oct 3, 2026, Ellsworth ME) featured a live on-stage DAO governance vote where ZOR holders voted on-chain to determine which artist's battle winnings went to [charity]. The vote result is recorded on OREC at 0xcB05F9254765CA521F7698e61E0A6CA6456Be532."

**Gate status:** ⚠️ PENDING — ZAOstock is Oct 3. If OP RF deadline is before Oct 3, cite the COC #7 live audience battle (Jul 18) as IRL proof instead: "COC #7 (Jul 18, 2026) was the first ZAO governance session with a live audience."

**ZAOOS source:** doc 1524 (day-of operations protocol), doc 1523 (COC #7 debrief)

---

## Gate 8: Wikidata Entity

**Claim:** ZAO has a verified Wikidata entity (machine-readable metadata).

**Verifiable URL:**
- Wikidata entity: `wikidata.org/entity/Q[ENTITY_ID]` (after doc 1496 execute)

**Gate status:** ⚠️ PENDING — Doc 1496 is the Wikidata entity creation brief (30 min, execute ASAP).

**ZAOOS source:** doc 1496 (Wikidata entity creation)

---

## Gate 9: ZAO as Optimism Ecosystem Builder

**Claim:** ZAO builds governance tooling that other DAOs can fork (ZAOOS CC-BY archive is forkable).

**Verifiable URL:**
- ZAOOS repo: `github.com/bettercallzaal/ZAOOS` (public, CC-BY 4.0)
- Fork count: visible on GitHub repo page
- Optimism Foundation: ZAO governs on OP Mainnet, supporting OP's DAO ecosystem growth

**Paste-ready citation:**
> "ZAOOS (github.com/bettercallzaal/ZAOOS) is a CC-BY 4.0 governance archive with 1,500+ documents that any DAO can fork. ZAO's governance operates entirely on Optimism Mainnet, supporting the OP DAO ecosystem."

**ZAOOS source:** doc 1401 (ZAOOS README), doc 1506 (CC-BY license)

---

## OP RF Submission: Paste-Ready "Impact Summary" Block

**Character limit:** ~1,000 chars (OP RF forms typically use this range).

```
ZAO has run 64 consecutive weekly on-chain governance sessions governing WaveWarZ 
— a music battle platform where losing artists automatically receive a 10% payout 
from every battle.

On-chain proof (Optimism Mainnet):
• OG ERC-20: 0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957
• ZOR ERC-1155: 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c  
• OREC (governance): 0xcB05F9254765CA521F7698e61E0A6CA6456Be532

Results (as of Jul 2026):
• 1,245 battles, 523.991 SOL volume ($104K)
• 9.09 SOL to losing artists (automatic, no claiming required)
• 36 community battles with charity payouts voted by ZOR holders
• 1,500+ governance documents in ZAOOS (CC-BY 4.0, github.com/bettercallzaal/ZAOOS)
• Registered with DAOstar under EIP-4824
• Listed in Govbase

ZAOstock (Oct 3, 2026): live DAO governance vote from the festival stage.
Proof: wavewarz.info/api/public/stats
```

---

## Gate Completion Tracker

| Gate | Doc | Status | Deadline |
|---|---|---|---|
| 1. 64 consecutive sessions | 1469 | ✅ Verifiable on-chain | Done |
| 2. WaveWarZ loser payouts | 1433 | ✅ API + Solana txns | Done |
| 3. Charity community battles | 1446, 1237 | ✅ 36 battles verified | Done |
| 4. ZAOOS CC-BY archive | 1506 | ⚠️ License file needed | ASAP |
| 5. DAOstar registration | 1513 | ⚠️ On-chain tx needed | ASAP |
| 6. Govbase PR | 1482 | ⚠️ Execute Jul 25 | Jul 25 |
| 7. ZAOstock IRL vote | 1524 | ⚠️ Pending Oct 3 | Oct 3 |
| 8. Wikidata entity | 1496 | ⚠️ Execute ASAP | ASAP |
| 9. ZAOOS as forkable DAO infra | 1401, 1506 | ⚠️ CC-BY license needed | ASAP |

**Minimum submission-ready gates (6 of 9):** Gates 1-3 are already verifiable. Clear gates 4, 5, 8 (ASAP) + gate 6 (Jul 25) to hit 7 of 9 before Oct 3.

---

## Related Docs

- 1470 — OP RF Submission Guide (9-gate checklist — the companion action doc)
- 1513 — DAOstar Registration Brief (gate 5 — execute ASAP)
- 1482 — Govbase PR Submission (gate 6 — execute Jul 25)
- 1506 — CC-BY License Deployment (gates 4 + 9 — execute ASAP)
- 1496 — Wikidata Entity Creation (gate 8 — execute ASAP)
- 1469 — WaveWarZ Platform State Snapshot (gates 1-3 evidence)
- 1433 — WaveWarZ H1 2026 Growth Summary (gate 2 evidence)
- 1237 — WaveWarZ On-Chain Economics (gate 3 evidence)
- 1524 — ZAOstock Day-Of Protocol (gate 7 evidence — post Oct 3)
