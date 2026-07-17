---
topic: events/tokenomics
type: DESIGN-BRIEF
board-task: 64cfc58a
related-docs: 953/917
---

# ZAO Festivals × Boardwalk Fee Split Design Brief (July 2026)

**For:** Zaal → technical call with Deez (Boardwalk founder)  
**Context:** Doc 953 captures the Jun 29 meeting. This doc brainstorms the specific fee split mechanics so Zaal has a concrete pitch to open with on the next Deez call.

---

## Platform recap (from doc 953)

- **Boardwalk** (useboardwalk.com): token launcher with programmable 0.23-0.25% transfer-fee splits
- **Graduation threshold:** 10K or 10E seed liquidity minimum before token moves from auction to live LP
- **Participation points:** early/long-term stakers earn proportionally more fee access than late whales
- **Locked decision:** Boardwalk is for ZAO festivals (not Ball Games / zaalcaster, which go Clanker)

---

## Proposed fee split model

Zaal's verbal proposal from the Jun 29 call: **50% treasury / 50% active volunteers**.

Here are 3 concrete implementations ranked by simplicity:

### Option A — Weekly snapshot (Recommended)

| Destination | Share | Mechanics |
|---|---|---|
| ZAO Treasury | 50% | Multisig wallet (Zaal + 1 co-signer). Funds artist travel + event production. |
| Active Volunteer Pool | 50% | Distributed equally among anyone who submitted ≥ 1 qualifying contribution in the prior 7-day window. Contribution = a WaveWarZ battle scored, an event shift worked, or a task closed on the ZAOcowork board with `brands=ZAOstock`. |

**Why Option A:** dead simple to explain to volunteers, no complex points math, aligns with the fractal/weekly cadence ZAO already runs.

### Option B — Weighted points

| Destination | Share | Mechanics |
|---|---|---|
| ZAO Treasury | 40% | Same multisig. |
| Contribution pool | 40% | Points per action type: battle judged (1pt), event shift (3pt), marketing post (1pt), artist booked (5pt). Weekly pro-rata payout from points. |
| Early staker bonus | 20% | Boardwalk participation-points mechanism — rewards first 30 days of LP contribution. Auto-distributed by the protocol. |

**Why Option B:** rewards higher-stakes contributions (booking > posting) but introduces complexity. Use only if Deez's platform supports multi-destination LP splits natively.

### Option C — Minimum viable (start here, upgrade later)

| Destination | Share | Mechanics |
|---|---|---|
| ZAO Treasury | 80% | Accumulate until first ZAOstock Oct 3. Then pay out artist travel + festival expenses from treasury. |
| Zaal wallet | 20% | Covers Zaal's coordination costs and signals token launch isn't charity. Transparent, public address. |

**Why Option C:** reduces complexity for launch. Upgrade to Option A after proof-of-concept (post-ZAOstock Oct 3, when there's real fee revenue to distribute).

---

## Capital coordination problem

Boardwalk requires 10K or 10E to graduate the token from auction to live LP. Zaal's community can't be expected to supply this alone (confirmed in doc 953, line 310-311).

**3 paths to the 10E seed:**

1. **Zaal personally seeds it** — cleanest, fastest. Treat it as a ZAOstock production cost. Recouped via early LP position + 20% treasury share.
2. **Presale to ZAO circle** — announce to newsletter (500+ subscribers) 2 weeks before launch. Target 30 contributors × 0.33E each. Luma page + Telegram pin.
3. **Co-launch with Deez** — ask Deez if Boardwalk has a partner seed program. Founders/partners sometimes seed launch pools in exchange for a small protocol fee share.

---

## What to lock on the call with Deez

**Decision checklist (bring this to the call):**

- [ ] Does Boardwalk support multi-destination fee splits (treasury + volunteer pool) natively, or does Zaal need a splitter contract?
- [ ] Which blockchain? (Base preferred for ZAO community — low gas, Farcaster-native)
- [ ] What's the exact auction→LP graduation mechanic (bond curve? fixed price?)?
- [ ] Is there a "voluntary contribution" feature where someone can add to the LP without expecting fee return — to let the ZAO community participate symbolically even below the graduation bar?
- [ ] Can Zaal set the token name + ticker (ZAO Festivals or $ZAOFEST)?
- [ ] Timeline: if ZAOstock Oct 3 is the anchor event, when must the token launch to have meaningful fee accumulation by then?

---

## Recommended next step

Launch with **Option C** (80/20 treasury/Zaal) for simplicity. Lock the seed capital path first (Zaal personally seeding is fastest). After ZAOstock Oct 3 proves the model, upgrade to Option A for ZABAL / ZAOstock 2027 cycle.

Pitch to Deez: "I want to do ZAO festivals first. Oct 3 event as anchor. 80% to treasury for artist travel + event costs. 20% to my wallet as coordinator fee. Need to know if 10E is enough to graduate and what chain you recommend for a 25-person community."

---

## Timeline

| Milestone | Target date |
|---|---|
| Technical call with Deez | Week of Jul 21 (post-COC #7 pilot analysis) |
| Seed capital decision | Jul 24 |
| Token name + fee split locked | Jul 28 |
| Launch auction | Aug 4 (10 weeks before Oct 3) |
| ZAOstock Oct 3 — first fee payout | Oct 4 (post-event distribution) |
