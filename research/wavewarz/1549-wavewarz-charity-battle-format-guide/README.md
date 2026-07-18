# 1549 — WaveWarZ Community Charity Battle: Format Reference + Governance Guide (Jul 2026)

**Type:** TECHNICAL-REFERENCE  
**Topic:** WaveWarZ  
**Status:** CANONICAL — companion to MAIN battle spec (doc 1538). 36 community charity battles have been held as of Jul 2026. This format is used at COC Concertz shows and planned as the opening act for ZAOstock Oct 3.

---

## What Is a Community Charity Battle?

A Community Charity Battle (also called "community battle") is a WaveWarZ battle format where:
1. The payout pool goes to a **charity** chosen by ZOR holder vote — not to the losing artist
2. Any community member (not just invited artists) can enter
3. Governance is the primary function: ZOR holders choose the charity **and** curate who battles

As of Jul 2026: **36 community battles held**, $0.00 platform fee to ZAO (100% of payout goes to charity).

**Distinction from MAIN battle:**
| | Community Charity Battle | MAIN Battle |
|---|---|---|
| Who enters | Community members, anyone | ZOR-curated invitation |
| Payout recipient | Charity (ZOR vote) | Both artists (loser-earns) |
| Artist payout | $0 | Guaranteed loser payout |
| Governance vote | 2 votes: charity + participants | 1 vote: participant invitation |
| ZAO platform fee | 0% | Platform % (confirm with Hurricane) |
| How often | Monthly or at events | Every Thursday governance session |
| Primary purpose | Community cohesion + charity | ZAO ecosystem artist development |

---

## Community Battle Step-by-Step

### Step 1: Charity Selection (ZOR Holder Vote — 2 weeks before battle)
- ZOR holders vote to select the charity for the upcoming community battle
- Voting method: Fractal Democracy session (same mechanism as MAIN battle artist selection)
- Quorum: minimum 3 ZOR holders
- Result: charity name + wallet address confirmed by next governance session
- ZOE posts result to X, Telegram, Farcaster after vote

### Step 2: Participant Submission (open 1 week before battle)
- Open to all WaveWarZ community members
- Artists submit via wavewarz.info/battle/community (confirm URL with Hurricane)
- ZOR holders select final participants from submissions (same Thursday session as charity vote or next session)
- Target: 2–4 participants (standard bracket is 2 for simplicity; 4-way for events)

### Step 3: Battle Setup (24 hours before)
- Hurricane creates the battle on-chain with charity wallet as payout recipient
- Battle parameters: same voting window as MAIN (15 minutes) with ZOR holder vote
- ZOE posts battle announcement: "@wavewarz Community Battle — Tonight. Profits go to [Charity Name]. [wallet link]. Tune in: wavewarz.info"

### Step 4: Battle Day
- Same mechanics as MAIN: track submission → 15-min voting → on-chain record
- **Exception:** all proceeds route to charity wallet, not artists
- Artists who participate get: exposure, governance voting right, ZAOstock invitation pathway
- Audience gets: a vote on both charity and outcome

### Step 5: Post-Battle (within 2 hours)
- On-chain payout to charity wallet (Solana tx hash)
- ZOE posts: result + charity payout amount + tx hash + charity thank-you
- ZAO governance log: OREC records the charity selection vote (Optimism tx)
- ZAOOS doc: ZOE creates event note (format: date / charity / payout amount / tx hash)

---

## Charity Selection Criteria

ZOR holders can vote any charity. Guidelines from past sessions:

| Criteria | Notes |
|---|---|
| Must be verifiable | Public website + wallet or bank account |
| Music-adjacent preferred | Music education, artist welfare, local arts |
| Community connection preferred | Charities relevant to ZAO artists or locations |
| No political organizations | ZAO governance is apolitical by design |
| No ZAO-affiliated wallets | Cannot vote ZAO treasury as "charity" |

**Past community battle charities (ZOE fills from OREC):** [ZOE: pull from governance session logs — charity name + date + payout amount]

---

## ZAOstock Oct 3 Community Battle: The Opening Act

Per doc 1524 (ZAOstock day-of protocol), the community battle is the **first event of the night** at ZAOstock, before the MAIN battle headline.

**ZAOstock community battle specifics:**
- Charity: selected by ZOR holder vote at governance session prior to ZAOstock (target: Sep 25 Thursday session)
- Format: 2 artists from ZAOstock performer lineup compete community-style
- Live audience element: crowd can see real-time vote count on screen (PA system + visual display)
- Payout: on-stage announcement of charity payout amount + tx hash shown on screen
- Duration: 20-30 minutes total (5 min setup, 15 min voting, 5 min results + announcement)

**Why it matters for grants/press:**
> "ZAOstock will open with a community charity battle where the live audience watches a DAO vote in real time and a charity receives a direct on-chain payment from the stage."

This is the strongest single press hook for ZAOstock — verifiable, novel, and human-interest.

---

## Africa Battle Week: Community Battle Integration (Sep 26)

Doc 1529 (Africa Battle Week story brief): Africa Battle Week involves ZOR holders voting on which African artist(s) enter a community battle.

- Community battle format at Africa Battle Week: African artist vs. ZAO-based artist
- Charity: Africa-connected (ZOR holder vote determines)
- Cross-continent payout: charity wallet receives SOL directly, Africa partner handles fiat conversion or uses SOL directly

ZOR holders vote both the charity AND the participant matchup at the Jul 25 governance session (doc 1529 — vote result determines who to DM).

---

## Grant + Press Language (Community Battles)

### Short (press)
> "ZAO has run 36 community charity battles, directing WaveWarZ trading volume directly to charities chosen by on-chain governance vote. Each charity selection and payout is permanently recorded on the Solana and Optimism blockchains."

### Fisher Grant (medium)
> "ZAO's community battle format demonstrates community impact. 36 community battles have directed trading volume to charities voted by ZOR token holders through transparent on-chain governance. ZAOstock Oct 3 will feature a live community battle where a charity receives a direct on-chain payout announced to the audience in real time."

### OP RF (medium)
> "WaveWarZ community charity battles are a public goods primitive: governance determines where value flows, not the platform. 36 battles completed (Jul 2026). On-chain records: Solana Mainnet (payout txns) + Optimism Mainnet (OREC governance votes selecting each charity). ZAOstock Oct 3 will be the first IRL demonstration of this mechanism."

---

## ZOE Community Battle Automation

| Trigger | ZOE Action |
|---|---|
| Charity vote result (Thursday) | Post result to X, Telegram, Farcaster; update tracking doc |
| Battle open (battle created on-chain) | Post battle announcement (format: charity name + payout frame + link) |
| Battle close (results on-chain) | Post result with payout amount + Solana tx hash |
| Charity payout confirmed | DM charity account (if on X/Farcaster) with confirmation + tx hash |
| Monthly (1st) | Pull total community battle SOL payed to charities year-to-date; add to 7PM EOD report |

---

## Tracking Table (ZOE Maintains)

| Date | Charity | Battle Participants | Payout (SOL) | Solana Tx | OREC Vote |
|---|---|---|---|---|---|
| [ZOE: fill from ZAOOS governance session docs] | | | | | |

Running total: 36 community battles as of Jul 2026. ZOE adds each new row within 24 hours of battle close.

---

## Update Protocol

- After each community battle: ZOE adds row to tracking table above + posts result
- After ZAOstock (Oct 3): add ZAOstock community battle row + press hook update
- After Africa Battle Week (Sep 26): add Africa Battle Week row + cross-border note
- When total SOL to charities passes $1,000 milestone: ZOE creates ZAOOS doc noting milestone

---

## Related Docs

- 1538 — WaveWarZ MAIN Battle Mechanics (companion — MAIN format vs. community format)
- 1523 — COC #7 Post-Show Debrief (COC #7 had a governance vote — compare format)
- 1524 — ZAOstock Day-of Protocol (community battle as ZAOstock opening act)
- 1529 — Africa Battle Week Story Brief (community battle cross-border version)
- 1469 — WaveWarZ Platform Snapshot (36 community battles in total stats)
- 1540 — Governance Session Archive Template (OREC records charity selection votes)
- 1525 — OP RF Evidence Package (community battles = public goods governance evidence)
