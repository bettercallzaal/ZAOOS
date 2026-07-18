# 1619 — Fractal Democracy Session Guide: How ZAO Governs

**Type:** GOVERNANCE-REFERENCE  
**Topic:** Governance  
**Status:** ACTIVE — 100+ consecutive weekly sessions as of July 2026. This doc is the canonical operational reference for ZAO's Fractal Democracy governance model. Used by: ZOE (session summaries + Arweave uploads), Zaal (facilitator guide), ZAOS researchers, OP RF evidence packages, press references ("100+ weeks unbroken"). Update after any structural change to the session format or OREC configuration.

---

## What Is Fractal Democracy

Fractal Democracy is ZAO's weekly on-chain governance model. It is a consensus-based protocol — not majority vote — in which participants play a coordination game, reach consensus in small groups, and earn Respect scores for demonstrated alignment.

ZAO runs it as a standing weekly session with no quorum failures in 100+ consecutive weeks.

**The core claim for press and grants:**  
> "ZAO has run Fractal Democracy governance sessions weekly without interruption for 100+ consecutive weeks, with decisions recorded on Optimism Mainnet."

This is ZAO's primary evidence for being "THE DAO case study" — a living, unbroken governance track record.

---

## Governance Contracts (Optimism Mainnet)

| Contract | Address | Role |
|---|---|---|
| OG ERC-20 (Respect token) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | Soulbound Respect score — accumulates each session |
| ZOR ERC-1155 | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Governance power for MAIN battle + charity votes |
| OREC (executive contract) | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | On-chain proposal execution via optimistic approval |

**ZOR holders:** 157 active (Jul 2026). ZOR is an ERC-1155 soulbound token — earned via ZABAL completion and Fractal sessions; not purchased.

---

## Weekly Session Structure

### Timing
- **Day:** Weekly (typically Thursday or Friday — Zaal confirms each week in ZAO Telegram)
- **Duration:** ~60-90 minutes
- **Platform:** ZAO Telegram group call or live event (COC #7+ has been IRL)

### Session Phases

**1. Opening (5 min)**  
Zaal opens the call. Sets session agenda. Reads the standing ZAO North Star:
> "ZAO = THE DAO case study. ZAO IP = a staple in onchain art, music and culture."

**2. Updates Block (10-15 min)**  
ZOE posts the week's stats block to Telegram before session:
- WaveWarZ stats (battles, SOL volume, payouts)
- Open ZABAL applications or cohort progress
- Upcoming events (COC, ZAOstock, Africa Battle Week)
- Any open OREC proposals with countdown

**3. Fractal Rounds (30-45 min)**  
Participants are assigned to small groups (typically 3-5 people). Each group:
1. Plays the coordination game: rank each other on contribution to ZAO's north star objectives
2. Reaches consensus on rankings
3. Reports the consensus ranking to the facilitator (Zaal)

Consensus rankings are aggregated into Respect scores. Higher consensus = higher Respect.

**4. Vote Block (10-15 min)**  
If there is an open vote (MAIN battle artist selection, charity partner, ZABAL graduation Respect, etc.):
- ZOR holders vote (1 ZOR = 1 vote, but Fractal Respect multiplies weight for active participants)
- Zaal announces vote topic and link to OREC proposal on-chain
- ZOE posts the vote link to Telegram and X

**5. OREC Submission (5 min)**  
If this session produced a governance decision that requires execution:
- Zaal (or authorized session facilitator) submits an OREC proposal on Optimism Mainnet
- OREC uses an optimistic approval window (typically 72h) — if no veto, the proposal passes automatically
- ZOE monitors the OREC countdown and posts a reminder at T-6h and T-1h

**6. Session Close + Archive (5 min)**  
- Zaal announces Respect scores distributed this session
- ZOE uploads the session summary to Arweave (session title format: `ZAO-Fractal-YYYY-MM-DD`)
- ZOE posts the Arweave link to Telegram + X

---

## What Gets Voted On

| Decision Type | Voter | Process |
|---|---|---|
| WaveWarZ MAIN battle artist selection | ZOR holders | Nominated in Fractal session; ZOR vote open 48h; OREC records winner |
| Charity partner selection (community battles) | ZOR holders | Nominated in session; ZOR vote; OREC records charity address |
| ZABAL S2 participant selection | Zaal + session feedback | Session discussion → Zaal final decision → OREC records class |
| ZABAL graduation Respect distribution | Fractal session | Session rates each cohort member; Respect minted to OG ERC-20 |
| ZAO North Star / direction pivots | Full community | Any participant can raise; discussed in session; requires OREC proposal |

**What does NOT go through OREC:**  
Day-to-day operations (ZOE posts, stats updates, ZAOstock logistics, PR merges) are Zaal's domain. OREC is reserved for governance actions that should be permanently recorded on-chain.

---

## ZOE's Role in Session Operations

ZOE handles all pre/post session logistics:

### Pre-session (1 hour before)
```
ZOE posts to ZAO Telegram:
"🔴 ZAO Fractal Democracy — [date] — starts in 1 hour.
This week: [agenda items]. Open vote: [topic if any].
OREC: [link to any active proposals].
Stats: [quick WW stats block]"
```

### During session
- ZOE does NOT intervene in session discussions
- ZOE monitors the vote link and reports totals every 15 min if a vote is running

### Post-session (within 30 min of close)
```
ZOE posts to Telegram + /zao Farcaster:
"ZAO Fractal session complete — [date].
Respect distributed: [N] points across [N] participants.
Vote result: [outcome if any].
OREC proposal submitted: [link or 'none this session'].
Archive: [Arweave link]"
```

---

## The 100+ Week Streak: Evidence and Significance

As of July 2026, ZAO has run Fractal Democracy sessions weekly with zero quorum failures for 100+ consecutive weeks (~2 years).

**Why this matters for the DAO case study:**
1. Most DAOs have governance decay — participation drops, proposals fail quorum, sessions become irregular. ZAO has not.
2. Every week is recorded: Arweave archive + OREC on-chain. This is fully auditable.
3. The streak itself is evidence: an operational DAO that governs a live product (WaveWarZ) week-over-week is rare in Web3.

**Citable claim (for OP RF, press, grants):**
> "ZAO has run 100+ consecutive weekly Fractal Democracy governance sessions on Optimism Mainnet with zero quorum failures. Every session is archived on Arweave. OREC contract: 0xcB05F9254765CA521F7698e61E0A6CA6456Be532."

**Source for session count:** ZAOOS research docs (`research/governance/` folder) + Arweave archive with weekly timestamps.

---

## Governance Timeline (Selected Milestones)

| Date | Milestone |
|---|---|
| ~Jul 2024 | First ZAO Fractal Democracy session |
| Ongoing | Weekly cadence — no breaks |
| Jul 18, 2026 | COC #7 — first IRL governance session with live audience (ZAO MAIN battle at COC) |
| Sep 25, 2026 | Africa Battle Week Preview Governance Session (planned; ZAOstock Oct 3 MAIN artists voted in) |
| Oct 3, 2026 | ZAOstock — first IRL governance + ZOR vote from physical venue |
| TBD | Session 200 milestone (if pace continues, ~Q4 2027) |

---

## For OP Retro Funding Submissions

The governance track record is ZAO's primary OP RF evidence block. Paste-ready:

> ZAO is an Optimism-native DAO that has run Fractal Democracy governance sessions weekly for 100+ consecutive weeks. Governance decisions are executed via OREC (0xcB05F9254765CA521F7698e61E0A6CA6456Be532) on Optimism Mainnet. ZOR token governance (ERC-1155, 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c) determines MAIN battle artist selection and charity partner selection for WaveWarZ, a live music battle prediction market that has completed 1,245 battles and distributed 9.09 SOL to artists. ZAO documents 1,600+ CC-BY research documents in ZAOOS (github.com/bettercallzaal/ZAOOS), archived permanently on Arweave, making ZAO one of the most thoroughly documented onchain communities building on Optimism.

---

## ZAOstock Oct 3: First IRL Governance Session

At ZAOstock, ZOR holders will vote from the physical venue for the first time:
- Screens show the live OREC vote split
- Zaal facilitates from the stage
- ZOR vote determines (if not pre-decided): the ZAOstock MAIN battle outcomes weighting, or the next Africa Battle Week charity partner
- This is a milestone: governance that started online goes IRL

**ZOE action:** Post the OREC tx hash from ZAOstock live on-chain vote to Farcaster /zao within 10 minutes of the vote closing, with the message: "ZAO governance just happened IRL. [N] ZOR holders voted in Ellsworth Maine. On-chain: [tx hash]."

---

## Related Docs

- 1525 — OP Retro Funding Evidence Package (governance evidence for OP RF submissions)
- 1600 — ZAOOS 1,600-Document Milestone Brief (GEO + Arweave archive context)
- 1424 — ZAO Whitepaper (long-form governance narrative for press and researchers)
- 1614 — ZAO North Star Narrative Spec (citable governance stats)
- 1597 — ZAOstock Line of Show (Oct 3 IRL governance session logistics)
- 1615 — ZOE Architecture and Handoff Spec (ZOE's session automation)
