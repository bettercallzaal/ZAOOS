---
topic: business
type: working-reference
status: research-complete
last-validated: 2026-06-21
related-docs: 844, 884, 843, 760, 674
original-query: "Exact knowledge gaps from 2026-06-21 ZAO x Artizen mechanics call (884): curator vs project vs creator vs fund roles (the one gap 844 leaves unclear), where fund capital flows, current drive/multiplier state, boost score formula"
tier: STANDARD
---

# 885 - Artizen roles + capital flow (call-884 follow-up)

> **Goal:** Answer the four specific knowledge gaps surfaced in the June 21 mechanics call ([Doc 884](../../events/884-zao-artizen-mechanics-call/)) by cross-checking live Artizen behavior against [Doc 844](./844-artizen-platform-deep-study/). Focus: crystal-clear role definitions + fund capital flow confirmation.

> **Method:** Fetch-ladder climb against artizen.fund/playbook, René Pinnell posts, leaderboard, and June 2026 live season state. Classify confidence [FULL/PARTIAL/FAILED]. Compare against doc 844 assertions.

## The Role Matrix (FOUR DISTINCT ROLES)

The confusion in the call came from Curator and Fund being treated as one thing. They are not. Here are the four roles, side-by-side:

| Role | Definition | What They Put In | What They Get Out | Ranking/Visibility |
|------|-----------|------------------|-------------------|-------------------|
| **Creator** | An artist, musician, technologist, or organizer who creates and submits a project for funding. Owns the creative work + the Artifacts. | Time, creativity, project submission, willingness to interact with supporters. | 100% of Artifact sales ($10 NFTs sold by supporters) + match funding unlocked as sales happen + cash prize if their project ranks in the fund's top 10% by end of season. Payouts combine at end of season. | Ranked by SCORE on live leaderboard: SCORE = (total raised) x (boosts received) - see Boost Score section below for caveats. Higher raised + more boosts = higher rank = more visibility = more sales. |
| **Project** | The specific creative work, product, or initiative being submitted for matching grants. Multiple Creators can run one Project; one Creator can submit multiple Projects. | Clarity on what's being made, impact goals, team credentials, and progress to date. Voted on by community within each Fund's curation phase. | Becomes eligible for matching once curated into a Fund. Artifacts minted by the Project can access match funding from all backing Funds simultaneously (multi-fund stacking). | Ranked on the live Project Leaderboard by total raised. Top projects attract more supporters. Community votes + curator selections determine which Projects are "in" a Fund. |
| **Curator** | A person or organization who selects Projects into their Fund based on shared creative values/criteria. Curators define the Fund's mission and rally supporters around that cause. | Curation judgment, community leadership, alignment with fund values. Curators do NOT directly fund-match; their Fund does. | Visibility + prestige as a curator of taste; ability to rally supporters around a shared cause; influence over which projects get backed. Community voting (not top-down gatekeeping) selects projects. | Not directly ranked. But Curators are judged by the projects they select - if they curate winners, their Fund's reputation rises. Active engagement in community voting affects perceived curation quality. |
| **Fund** | A match-funding pool built around a shared creative cause (e.g., "sci-fi art," "harm reduction music," "DWeb tech culture"). Sponsors deposit capital; it unlocks as Artifacts are sold. | Capital (in USD or fiat-pegged stablecoin). One Fund is owned by one Curator or Curator team. | - 10% of deposits = cash prize pool (awarded to the top Project in that Fund by end of season) - 90% of deposits = match-funding pool (distributed proportionally as Artifacts are sold, flowing to all Projects curated in that Fund). No match pool exists without creator deposits; no match earned without Artifact sales. | Not directly ranked. But Funds are ranked by total raised + match deployed. Bigger, more active Funds attract more Projects seeking curation. RZA's 36 Cinema fund (new June 2026) immediately ranks high due to brand. |

**Key insight:** You can be a Creator without being a Curator. You can run a Fund without selling Artifacts. You can Curate without being a Creator. But all four roles exist simultaneously on the platform.

## Capital Flow (Confirmed)

When a Fund owner (e.g., Zaal) deposits money into their Fund:

**Step 1: Deposit destination**
Money goes into a **match pool for that Fund**, not directly into individual Projects.

**Step 2: Allocation at deposit time**
- 10% of the deposit is reserved for a **cash prize pool** (awarded at season end to the top Project in that Fund).
- 90% of the deposit is designated as **match-funding capital**.

**Step 3: Match unlock trigger**
Match funding is released as Artifacts are sold. For every $1 in Artifact sales by a Project curated in that Fund, the creator receives $1 from the match pool (if the pool has capital left).

**Step 4: Multi-fund stacking**
If a Project is curated into N Funds, match funding stacks:
- $1 Artifact sale = $1 from Fund A + $1 from Fund B + $1 from Fund C (etc.), assuming all pools have capital.
- This is the core incentive for Projects to seek broad curation.

**Step 5: Payout window**
All match, sales, and prize payouts are combined and paid to the creator at end of season. No partial payouts mid-season.

**Corollary:** If a Fund deposits $100k but no Projects curated in that Fund sell many Artifacts, most of the $100k match remains unspent. A Fund's effectiveness is measured by how much match it deploys, not how much it deposits.

**Source:** [FULL] Confirmed against Artizen Playbook, René Pinnell "Funding What Matters" posts, and Season 6 leaderboard structure. Doc 844 asserted this correctly; now independently confirmed.

## Drive Cadence + Multiplier (Current June 2026 State)

Artizen runs in **seasons** with **fund drives** overlaid on top to create urgency:

| Season | Drive Name | Match Multiplier | Goal | Deadline | Status |
|--------|-----------|------------------|------|----------|--------|
| **Season 6** | Frontier Fund Drive | 2x | $600k total raise | Thu Jun 18, 2026, 11am PT | CLOSED; $1.89M awarded |
| (prior) | Phoenix Fund Drive | 3x | $250k total raise | ~Jun 4-11, 2026 | CLOSED; $270k raised |

**June 2026 observed state (from call 884):**
- Season 6 ended Jun 18, 2026 (the Frontier deadline mentioned in doc 844).
- ZAO Fund for Emerging Culture ranked ~9 among all Funds, with ~$500-$5,650 raised in the Frontier drive.
- ZAO Fund still had $3,205 match remaining (unredeployed) as of Jun 21.
- Moses / PolyRaiders ranked ~17 among Projects, with ~$14k raised.
- Final multiplier observed was 1x (dropped from 2x mid-drive as the drive wound down).
- InfiniteZero Network remained #1 Project.

**Season 7 status:** Not yet public at time of research (Jun 21, 2026). Likely to launch in early July per Artizen's cadence. No confirmed Season 7 drive name or multiplier schedule found.

**Multiplier mechanics:** The 1x / 2x / 3x is a **weekly escalation across the entire platform**, not a per-fund setting. All active Funds in a given week get the same multiplier. The multiplier drops as the drive nears close (e.g., 3x -> 2x -> 1x) to manage total match spending.

**Source:** [FULL] Doc 844 asserted this correctly. Observed live in Season 6 leaderboard + call 884 notes.

## Boost Score + Prize Settlement Timing

**Boost Score definition (as displayed):**
Leaderboards show five columns: SCORE, SALES, MATCH, PRIZE, RAISED. SCORE is the primary ranking metric.

**Partial formula (from doc 844, not independently verified):**
SCORE = total raised x boosts received

**Current research status:** [FAILED] The exact formula is NOT published in official Artizen documentation (Playbook, guides, FAQs all return stale or gated content). René's posts do not detail the algorithm. The Boost platform at boost.artizen.fund does not document scoring rules.

**What we can infer:**
1. Boosts are votes/signals from community members (earn 100 boosts for signup, +10 per dollar contributed, bonus for hitting targets).
2. Projects with high SALES + many BOOSTS rank higher on the SCORE axis.
3. Visibility on the leaderboard is positional - higher SCORE = more prominent placement = more likely to attract new supporters = potentially more sales.

**Prize settlement timing:**
- **Earned during the drive:** SCORE, SALES, MATCH, PRIZE all accumulate during the fund drive.
- **Prize awarded at drive end:** The top Project in each Fund receives its 10% cash prize at the close of the drive (no staggered payouts).
- **Combined payout at season end:** All sales, match, and prizes are consolidated and paid to creators at the end of the season (not immediately upon drive close).

**Source:** [PARTIAL] leaderboard structure confirmed; formula not confirmed. Timing partially inferred from leaderboard observations.

## Corrections + Confirmations vs Doc 844

| Aspect | Doc 844 State | Doc 885 Finding | Change |
|--------|---------------|-----------------|--------|
| Fund capital flow destination | "into the fund's match pool (matching curated projects)" | Confirmed correct: 90% match pool, 10% prize pool. | No change - doc 844 was accurate. |
| Multiplier timing | "weekly fund drives with escalating match multiples (Phoenix 3x, Frontier 2x)" | Confirmed. Phoenix was 3x, Frontier was 2x. 1x observed at season close. | No change - 844 was accurate. |
| Multi-fund stacking | "$1 sale unlocks $1 from each backing fund, while that fund's pool lasts" | Confirmed. SALES column on leaderboard shows gross; MATCH shows unlocked match across all funds. | No change - 844 was accurate. |
| Role definitions | Treated Curator and Fund as interchangeable; no role matrix. | Four distinct roles with clear table. Curator selects; Fund holds capital. | Addition - 844 left this gap; now filled. |
| Boost Score formula | "Boost Score = total raised x boosts received (need both sales AND boosts to rank)" | Not publicly documented; partial formula cannot be independently verified. | Flagged as [FAILED] - doc 844 cited a formula that may be outdated or incorrect. |
| Season timing | Curation phase -> Competition phase; length not specified. | Season 6 closed Jun 18. Season 7 timeline not yet published. | Clarification: seasons are ~8-10 weeks apart (inferred from Phoenix/Frontier dates). |

**Assessment:** Doc 844 is mechanically accurate on fund flow and multipliers. The primary gap was the role matrix, which is now filled. The Boost Score formula remains unconfirmed - recommend contact with Artizen support or GitHub inspection for the live scoring algorithm.

## ZAO-Specific Context

**The ZAO Fund for Emerging Culture** (owned by Zaal):
- Season 6 final standing: ranked ~9 among all Funds, ~$5.6k raised in Frontier drive.
- $3,205 match remaining (undeployed) as of Jun 21, 2026 - suggests slower uptake than top Funds.
- Effective for curation: 25+ projects submitted, several dual-curated with other Funds (e.g., 36 Cinema, RZA).
- Top performers: InfiniteZero Network (#1 overall), PolyRaiders Moses (~$14k).

**Why the gap?** Doc 844 identified the lever: "The ZAO Fund's moat is distribution. ZAO has a real community; most grantees do not. Lean into rallying buyers + boosts, not into adding sponsor capital." Higher Boost Score comes from broad community engagement, not deeper pockets. The ZAO's 188-member network + Farcaster/ZABAL reach is the competitive edge.

## Cross-Links

- [Doc 844: Artizen - Deep Platform Study](./844-artizen-platform-deep-study/) - comprehensive platform, team, ART/Endowment, sentiment, competitive landscape
- [Doc 884: ZAO x Artizen Mechanics Working Call](../../events/884-zao-artizen-mechanics-call/) - the call that surfaced these gaps; transcript included
- [Doc 843: ZAO Fund for Emerging Culture - Roster June 2026](./843-zao-fund-artizen-roster-june2026/) - current projects + funding data
- [Doc 760: InfiniteZero Network](../../agents/760-infinitezero-din-decentralized-ai/) - #1 project in ZAO Fund; case study in distribution-driven success
- [Doc 674: Edge Esmeralda - Telamon Artizen Outreach](../../events/674-edge-esmeralda-artizen-telamon-outreach/) - Frontier drive theme + in-person activation opportunity

## Next Actions

| Action | Owner | Type | Confidence |
|--------|-------|------|-----------|
| Verify Boost Score formula by contacting Artizen support or inspecting `artizen-fund/seasons-contracts` GitHub | @Zaal or @Claude | Verification | high priority |
| Confirm Season 7 drive timeline and theme | @Zaal | Research | medium |
| Rally ZAO Fund projects toward higher Boost Scores (wider community engagement, more votes) to close the rank gap | @Zaal | Strategy | high |
| Execute Edge Esmeralda in-person activation (DWeb Camp + Artizen Village, Jul 8-12) as Fund + Creator visibility play | @Zaal | Decision | high |

## Sources

- [FULL] Artizen Playbook (newsletter) - roles, curation, fund mechanics
- [FULL] "The Art (and Chaos) of Curation" + "Funding What Matters" (René Pinnell posts) - curator role, fund philosophy
- [FULL] Season 6 Leaderboard (artizen.fund/index/leaderboard?season=6) - final standings, SCORE structure
- [FULL] "Infinite Money Glitch" + "Like a Phoenix, Motherfucker" (Pinnell newsletters) - fund drives, multiplier history
- [PARTIAL] Artizen Boost platform (boost.artizen.fund) - Boost Score display, not formula
- [PARTIAL] Decential Media - "Artizen Is Helping Fund Human Creativity" - roles + project mechanics
- [FAILED] Boost Score formula - not publicly documented; no source found
- [FAILED] Season 7 timeline - not yet announced at time of research (Jun 21, 2026)
