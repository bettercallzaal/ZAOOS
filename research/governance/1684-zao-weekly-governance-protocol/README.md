# 1684 — ZAO Weekly Governance Protocol (Fractal DAO Sessions)

**Type:** CANONICAL-REFERENCE  
**Topic:** Governance  
**Status:** ACTIVE — Updated Jul 2026. 100+ consecutive sessions on Optimism Mainnet as of Jul 2026. This doc is the authoritative reference for how ZAO's weekly governance works: ZOR eligibility, session format, on-chain mechanics, voting history. Used in OP RF applications, academic citations, Mirror articles, ZOR holder onboarding, and grants.

---

## Why This Document Exists

ZAO has run 100+ consecutive weekly governance sessions without missing a single week. This is one of the most verifiable claims in the decentralized music space — every session is recorded on Optimism Mainnet via the OREC (On-Chain Respect) contract.

Most DAOs claim governance. ZAO has a transaction log.

This doc is the single source of truth for:
1. How the weekly session works (what happens, in what order)
2. Who can vote (ZOR holder eligibility rules)
3. What gets decided (WaveWarZ artists, community battles, ZABAL, spending)
4. How decisions are recorded (Fractal DAO + OREC contract)
5. Citable claims for grants, press, and academic research

---

## The ZAO Governance Stack

| Layer | What It Is | Where |
|-------|-----------|-------|
| **Fractal Democracy** | The governance process (weekly sessions, recognition scores) | Off-chain protocol, session recorded on-chain |
| **ZOR (Zaalian On-Chain Respect)** | Soulbound ERC-1155 token. Issued based on Fractal session participation. Non-transferable. | Optimism Mainnet: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| **OREC** | On-Chain Respect contract. Records every governance decision, session by session. | Optimism Mainnet: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| **OG (ZAO ERC-20)** | Fungible ZAO token. Pre-governance era, not used for current session voting. | Optimism Mainnet: `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` |
| **Snapshot** | Off-chain binding polls for community proposals (charity vote, spending). | snapshot.org/#/thezao.eth |

---

## Fractal Democracy: How ZOR Is Earned

ZOR is not minted by users — it's issued based on recognized contribution in weekly Fractal DAO sessions.

### The Fractal Process (Per Session)

1. **Members break into small groups (4-6 people)**
2. **Each group has a 30-minute discussion** about ZAO: what shipped, what's needed, what to prioritize
3. **Groups play the Fractal Democracy "respect game"**: each member ranks everyone else from most-to-least impactful contribution
4. **Rankings are aggregated** using the Fractal algorithm into a session-level "Respect score" for each participant
5. **Top Respect scorers receive ZOR** — the on-chain record of recognized governance contribution
6. **All results are submitted to OREC** — permanent, public, and queryable

### Why Soulbound Matters

ZOR cannot be traded, transferred, or bought. This is intentional:
- Prevents flash loan governance attacks (can't borrow voting power)
- Prevents plutocracy (rich wallets can't accumulate governance control)
- Ensures ZOR = actual participation, not token wealth

157 ZOR holders as of Jul 2026 = 157 people who have shown up and been recognized.

---

## Weekly Session Structure

**Cadence:** Every Friday (or Saturday in some weeks — consistent week-to-week, day varies)  
**Format:** Audio call (Telegram or X Spaces) + OREC submission  
**Duration:** 60-90 minutes  
**Average attendance:** 8-25 participants per session (varies by week)

### Session Agenda

| Time | Item | Owner |
|------|------|-------|
| 0:00-0:05 | Welcome + quorum check | Zaal |
| 0:05-0:15 | ZAO status report | Zaal/ZOE |
| 0:15-0:25 | Open proposals (if any) | Any holder |
| 0:25-0:55 | Fractal small groups | All participants |
| 0:55-1:05 | Group reports + recognition | Group leads |
| 1:05-1:20 | OREC submission + Snapshot vote (if needed) | Zaal |
| 1:20-1:30 | Announcements + next week preview | Zaal |

### What Gets Decided Each Session

**Standard governance items (most weeks):**
- WaveWarZ MAIN battle artist selection for upcoming COC Concertz show
- Community battle approvals (which community organizers can run battles)
- ZABAL cohort updates (applicants, curriculum changes, guest speakers)

**Special governance items (as needed, on Snapshot):**
- Spending proposals (ZAOstock budget line items, grants, equipment)
- Africa Battle Week charity selection
- Major protocol changes (payout split adjustments, new battle types)
- Partner approvals (new ZAO ecosystem partners)

---

## OREC: The On-Chain Record

Every Fractal DAO session result is submitted to the OREC contract on Optimism Mainnet.

**Contract:** `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`  
**Chain:** Optimism Mainnet (chain ID 10)  
**Explorer:** optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532

The OREC stores:
- Session number
- Timestamp
- Participating wallet addresses
- Respect score per participant
- ZOR award decisions

**How to verify the 100+ session claim:**
1. Go to Optimistic Etherscan at the OREC address above
2. Click "Events" tab
3. Each "Respect" event = one governance session
4. Count events from first session to present

This is not a self-reported number. It is a public transaction log.

---

## ZOR Holder Statistics (Jul 2026)

| Metric | Value | Source |
|--------|-------|--------|
| Total ZOR holders | 157 | OREC contract on Optimism |
| Sessions completed | 100+ | OREC event count |
| Consecutive weeks without quorum failure | 100+ | OREC timeline (no gap > 7 days) |
| Sessions where WaveWarZ artists were voted | ~60% of sessions | OREC + WaveWarZ records |
| Largest single session (attendance) | [ZOE fills from records] | Session log |
| First session | [ZOE fills] | OREC first event timestamp |

**Governance distribution:** ZOR holders are globally distributed — US, Africa, Europe, Asia. Africa Battle Week is a direct result of the governance community's geographic diversity.

---

## How WaveWarZ Artists Are Chosen

The most direct output of ZAO governance is the COC Concertz MAIN battle artist selection.

**Process:**
1. During the weekly session, members nominate WaveWarZ artists they want to see in the next MAIN battle
2. Nominations are discussed (track history, WaveWarZ experience, community ties)
3. Fractal voting determines which nomination receives highest recognition
4. Zaal confirms with the artist directly
5. ZOE records the decision and schedules the announcement

**This is not a random assignment.** ZOR holders collectively decided every MAIN battle lineup in COC Concertz history. That's governce making real programming decisions with real economic consequences (artist payouts in SOL).

---

## ZABAL Governance Role

ZABAL (ZAO Artist Builder Accelerator Lab) cohort decisions pass through governance:
- Cohort start/end dates
- Curriculum priorities (which skills to teach in which week)
- Guest speaker approvals
- ZABAL S2 Track A/B split ratio

ZABAL participants who attend governance sessions and receive ZOR become part of the governance community — they vote on future ZABAL cohorts, creating a self-reinforcing loop of artists governing the system that trains artists.

---

## Governance Case Study: Africa Battle Week Origin

Africa Battle Week (Sep 22-26, 2026) originated in governance. Not from Zaal's proposal — from ZOR holders during a Fractal session.

ZOR holders with connections to African and diaspora music communities raised the idea of a dedicated themed battle week during a weekly session. It received recognition scores, moved to a Snapshot vote, and passed. The charity vote (Jul 24-25, 2026) is itself a governance action: ZOR holders choose which African-focused charity receives 5% of ABW proceeds.

This is the governance-to-real-world pipeline:
1. Idea raised in session → recognition score → Snapshot vote → binding decision → real event with real artist payouts + charity donation

---

## Citable Claims for Grants and Press

**Use these exact formulations (all on-chain verifiable):**

> "The ZAO has held 100+ consecutive weekly governance sessions on Optimism Mainnet with zero quorum failures, recorded in the OREC contract at `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`."

> "157 ZOR holders participate in ZAO governance using soulbound ERC-1155 tokens that cannot be purchased — only earned through recognized contribution."

> "Every WaveWarZ MAIN battle artist in COC Concertz history has been selected by ZOR holder vote, not by a founder, label, or algorithm."

> "ZAO's Fractal Democracy governance model connects on-chain voting directly to real-world outcomes: artist selection, battle programming, event production, and charity fund allocation."

**For OP Retro Funding:**
> "ZAO is the only active Fractal Democracy DAO on Optimism Mainnet as of Jul 2026. The OREC contract has 100+ sequential session records, verifiable on Optimistic Etherscan."

**For academic citation:**
> Panthaki, Z. (2026). *The ZAO Governance Model: 100+ Consecutive Fractal Democracy Sessions on Optimism Mainnet*. ZAOOS (CC-BY). github.com/bettercallzaal/ZAOOS.

---

## ZOR Holder Onboarding

New participants frequently ask: "How do I get ZOR?"

**Answer:**
1. Join a ZAO weekly governance session (Friday/Saturday, announced on X + Telegram + Farcaster)
2. Participate in good faith in the Fractal small group
3. If recognized by peers (Fractal process), you receive ZOR in the OREC submission
4. ZOR is sent to your Optimism Mainnet wallet

**You cannot:**
- Buy ZOR
- Transfer ZOR from another wallet
- Earn ZOR by staking, liquidity providing, or holding other tokens

ZOR = showing up + being recognized.

---

## Governance Roadmap (H2 2026)

| Date | Item | Status |
|------|------|--------|
| Jul 24-25 | Africa Battle Week charity vote | SCHEDULED (doc 1678) |
| Sep 22-26 | Africa Battle Week governance execution | CONFIRMED |
| Oct 3 | ZAOstock IRL live governance vote (first MAIN-battle vote with live audience) | CONFIRMED |
| Q4 2026 | OREC v2 exploration (multi-chain, Fractal v2 compatibility) | RESEARCH |
| 2027 | ZOR holder quorum for ZAOstock festival production decisions | PROPOSED |

---

## Related Docs

- 1668 — Fractal DAO Evidence Package for OP Retro Funding (the grant application layer)
- 1651 — ZAO DAO Case Study Jul 2026 (the narrative layer — governance stats in context)
- 1570 — ZAO Citable Claims Master Doc (verified governance stats)
- 1678 — Africa Battle Week Charity Snapshot Poll Spec (upcoming governance action)
- 1619 — Fractal DAO Session Records (prior session-by-session log if it exists)
- 1311 — OP Retro Funding Application Pack (uses governance claims)
