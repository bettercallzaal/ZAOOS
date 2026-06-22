---
topic: business
type: guide
status: research-complete
last-validated: 2026-06-22
related-docs: 844, 885, 886, 843, 884
original-query: "https://play.artizen.fund/ research this as well"
tier: DEEP
---

# 887 - The Artizen Playbook (official rules, authoritative)

> **Goal:** Capture the full official Artizen Playbook (play.artizen.fund) as the canonical mechanics
> reference, and correct the prior ZAO docs it contradicts. This is the source of truth - it replaces
> inference with the platform's own published rules.

> **Source:** `play.artizen.fund` scraped in full via the headless `browse` tool 2026-06-22 (Artizen is
> client-rendered Bubble.io; WebFetch returns empty). The page also hosts **Venus**, Artizen's AI guide.

## Key decisions / corrections (read first)

| # | Finding | Impact |
|---|---------|--------|
| 1 | **Rank = Boost Score = (sales + match unlocked) x boost points received / 100.** Multiplicative. | CORRECTS doc 886 ("most Artifacts sold wins, boosts separate") - that was based on stale 2024 source code and is WRONG. You need BOTH dollars and boosts. |
| 2 | **Boost Points are earned by: holding ART (weekly recharge), donating to the Endowment, completing your profile, attending Artizen events, prosocial activity.** Quadratic voting - each extra vote costs more. | RESOLVES the doc 885 [FAILED] boost-formula gap. Did NOT need Venus/Rene - the playbook publishes it. |
| 3 | **Two leaderboards per drive: Projects vs projects AND Funds vs Funds.** Both use the same Boost Score. | The ZAO Fund competes on the FUNDS board (rank #13); ZAO projects compete on the PROJECTS board separately. |
| 4 | **Fund Director earns 20% of sponsor contributions to their Fund.** | Zaal (ZAO Fund director) earns 20% of sponsorships - a real revenue line, not just curation. |
| 5 | **Match cap: each project unlocks max 30% of a Fund's balance; cap shrinks as others claim. Sell EARLY.** | Tactical: first movers get more match. Get curated by more funds to deepen the pool. |
| 6 | **Payouts: season-end only. Sales+match = USDC; PRIZES = ART token.** Final week ranks on season totals. | Prize money is ART (ownership stake), not cash. Wash-sale-proof by design (no mid-season payout). |

## How ranking actually works (the core mechanic)

**Boost Score = (sales + match unlocked) x boost points received / 100.**

Worked example from the playbook (project race, 3x Match Multiple):
- Tree Sculpture: $1K sales -> +$3K match = $4K raised, 10,000 boosts -> **Score 400K -> #1**
- Little Library: $200 sales -> +$600 match = $800 raised, 9,000 boosts -> Score 72K -> #2
- Street Mural: $1.5K sales -> +$4.5K match = $6K raised, **100 boosts -> Score 6K -> LAST**

Street Mural sold the MOST dollars and finished LAST. Boosts multiply dollars; dollars alone or boosts
alone only get you so far. **The ZAO lever is BOTH: rally the crowd to buy $10 Artifacts AND to boost.**

## Match funding (confirmed mechanics)

- Every $1 of Artifact sales (and every $1 of sponsorship to a Fund) unlocks match, scaled by that week's
  **Match Multiple** set by Artizen (e.g. 3x = $1 unlocks $3, for $4 total on that dollar).
- Match comes from every Fund that curated you (proportional to fund size) PLUS a baseline from the
  **Artizen Endowment** (every approved project gets baseline match, so none is unfunded).
- **Cap: a project can unlock at most 30% of any one Fund's balance**, and the cap shrinks as other projects
  claim match. Sell early. Get curated by more funds = deeper total pool.
- Your weekly **available match** = your goal for the drive; it depends on fund sizes + your recent-drive
  activity (active projects earn a bigger share). Unused match returns to the Endowment + Funds for next week.

## Fund Drives + prizes

- Weekly, **Thursday to Thursday, ending Thursdays 11:00 AM PST**. New leaderboard each drive (clean slate).
- **Fair finish:** a drive only closes once the #1 spot has held for a full 5 minutes - no buzzer-sniping.
  The end is where ranks are won; have the community ready to buy + boost on cue.
- **Cash prizes by rank (halving curve):** #1 biggest, #2 = half of #1, #3 = half of #2, then flattens.
  For Funds with >10 projects, shifts to linear decay. Every ranked project/fund wins something.
- **A Fund's cash prize rolls into its match pool the next week** (compounds - a strong week starts the next
  week ahead). Project prizes add to the project's total money raised.
- **Final week of season:** everyone ranked on SEASON totals (total sales, total match, total boost points).

## Payouts

- **Season-end only** (prevents wash-sale recycling mid-season; creators can buy their own Artifacts but
  can't recycle because nothing pays out until season close).
- Artifact sales + match funding -> **USDC**. End-of-season prize money -> **ART token** (ownership stake).
- Issued within a few weeks, up to 60 days (audit + clearing). Artizen is merchant of record; 10% fee taken
  upfront at purchase, nothing extra deducted at payout beyond transfer costs.
- **Rage Quit:** a creator can exit a season - keeps Artifact sales, forfeits match + prizes.

## Artifacts

- $10 each, open-edition NFTs. Each purchase mints 3 copies: fan, creator, Artizen. Supply fixes at season end.
- Spec (for winning): **square 1:1, >=1000px, .jpg/.png (or .gif >=500px, or .mp4 <=45s loop), NO text /
  logos / graphic overlays.** Not trailers/ads/posters.
- Not equity/securities - "you own the impact, not the project." Most go to zero; a few become valuable.

## The Endowment + ART token

- The Endowment is the engine: funds match + prizes + seeds new funds ($1,000 kickstart per new Fund). Fed by
  the 10% platform fee, a copy of every Artifact sold, sponsorships, on-chain activity.
- ART = a **Revnet on Juicebox** (autonomous mint/buyback/redemption). Donate to the Endowment -> earn ART +
  Boost Points (same action). ART gives a weekly Boost-Point recharge.
- **Issuance schedule (Bitcoin-style, price doubles each stage):** Stage 1 Genesis (Sept 17 2025, 3x35-day
  cycles, 10,000 ART/USD); Stage 2 Growth (Dec 31 2025, 7x120-day, 1,250 ART/USD); Stage 3 Scale (Apr 19
  2028, annual, ~9.7 ART/USD).
- ART contract (Base): `0x44c4516768e47cd97cfF2561B81a74699F23f8Ec`. The original contract
  (`0x794FDDbe...`) was forked + fixed after **Anthropic's Mythos model found vulnerabilities**; holders
  airdropped, no balances lost. Launching on Base, expanding to Solana/Arbitrum/Optimism/Ethereum.
- ZAO stance unchanged: ride the funding rail, treat ART as speculative, keep treasury off it (doc 845).

**On-chain check of the current ART contract (Basescan, 2026-06-22):** `0x44c4516768e47cd97cfF2561B81a74699F23f8Ec`
(Base) - total supply ~959,607,599 ART, **237 holders**, **no listed market price / market cap** ($0.00,
"-"), **0 transfers in 24h**. Thin, illiquid, effectively unpriced - a 237-holder community token, not a
liquid market. This updates doc 845's "~34 ETH dormant" with current data: the conclusion holds even harder -
do NOT treat ART (or the "$14M endowment") as a liquid/verifiable treasury asset; keep ZAO treasury off it.
Prizes are paid in ART, so a creator's ART prize is an illiquid stake, not cashable at a market price today.

**Endowment operational-maturity signal (2026-06-22):** Artizen's ORIGINAL Juicebox project hit a
misconfiguration - a 100% redemption rate bug - so it was archived with funds temporarily locked (a 101-day
duration), and Juicebox core devs (Jango, Filipv) covered with personal funds into a new project. This is a
real reliability wrinkle in the endowment's history; the engine is experimental (the playbook says so).

**Scraped `juicebox.money/@artizenfund` (browse, 2026-06-22):** total raised **34.21 ETH**, 61 payments,
owned by `nene❤.eth`, created **Oct 27 2023**, last activity ~a year ago (most payouts 2 years ago) - dormant.
**Critical distinction:** this is the LEGACY Juicebox project (matches doc 845's "~34 ETH dormant"), NOT the
current endowment. The CURRENT endowment is the new **Revnet** (Stage 1 Genesis started Sept 17 2025, ART
contract `0x44c45...`) - a separate vehicle, not this handle. So the oft-cited "~34 ETH" = the OLD project, not
today's endowment; do NOT equate them. The "$14M" would live in the new Revnet + off-chain reserves (insured
USD, BTC/ETH/SOL, Artifacts); the new Revnet treasury is JS-walled on revnet.app and still not pinned to a hard
figure. Net unchanged: the "$14M endowment" is self-reported + partly off-chain - do not bank on it.

**CAPSTONE - scraped the CURRENT endowment Revnet `revnet.app/v5:base:6` (operator `artizenendowment.eth`),
2026-06-22:** on-chain balance **$96.96**, **261 owners**, last activity ~2 months ago (USDC-in / ART-out,
"Funding Human Creativity"). So the **on-chain endowment holds under $100** - NOT $14M. The autonomous Revnet
the playbook touts as "the engine behind everything" currently holds <$100 redeemable. Therefore the "$14M
endowment" is almost entirely a claim about OFF-CHAIN reserves (insured USD deposits, BTC/ETH/SOL, a copy of
every Artifact) that are not verifiable on-chain and not in the Revnet. **Verdict on the $14M: refuted as an
on-chain / liquid figure - treat it as a self-reported off-chain claim only.** This is the strongest data yet
behind the standing ZAO rule: ride the funding rail (sales + match in USDC are real), keep treasury OFF ART,
and do not value the endowment at its headline number. Prizes paid in ART remain illiquid (237 ART holders,
no market price - see above).

## "Boosts" (capital-B events) vs boost points

Confusing naming - two different things:
- **boost points** = the voting currency that feeds Boost Score (above).
- **Boosts** (the Boosts page) = time-limited **events**: Sales Sprints (compete to sell the most Artifacts
  for a cash prize) + Match Boosts (temporary match multipliers). Season 6 deployed $400k+ in sprint prizes +
  $129k in match-boost caps across 22 events; single-sprint pools $5k-$60k+. These also have a 5-min fair finish.

**Live Boosts page is login-gated.** `boost.artizen.fund` requires an email magic-link login - no public view
of currently-live sprints (scraped 2026-06-22: returns only a login form). To see/target a live sprint, Zaal
must check it from his logged-in account. The playbook FAQ is the only public source for the aggregate stats.

## Platform economics

- Artizen fee: **10%** on Artifact sales + sponsorships, taken upfront -> flows to the Endowment. Plus 10% of
  every ART purchase + a Pro subscription (premium voting/creator tools).
- Anti-manipulation: phone verification, limited free votes, quadratic voting (whales face diminishing
  returns, every vote manual), Fund Director eligibility gate, 30% match cap.

## Corrections to prior ZAO docs

| Doc | Was | Now (per playbook) |
|-----|-----|--------------------|
| 886 | "Win = most Artifacts sold; boosts are a separate visibility layer" | WRONG. Rank = (sales + match) x boost points / 100. Boosts multiply. Need both. |
| 885 | Boost Score formula [FAILED] / unverifiable | RESOLVED: published formula above + boost-point sources. |
| 844 | "Boost Score = total raised x boosts received" | Close but incomplete - it's (sales + match) x boost points / 100, and match counts too. |
| 886 | "Fund kickstarted with $10k" (from the call) | Playbook: new Funds seeded with $1,000. ZAO pool is $10,547 now (grew). |

## Also See

- [Doc 886](../886-artizen-zao-fund-manager-curator-benefit-cases/) - ZAO fund-manager strategy (needs the win-condition fix)
- [Doc 885](../885-artizen-roles-and-capital-flow/) - roles + capital flow
- [Doc 844](../844-artizen-platform-deep-study/) - platform deep study
- [Doc 884](../../events/884-zao-artizen-mechanics-call/) - the call that opened this thread

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fix the win-condition claim in ZAOartizen repo (TEAM-PLAYBOOK, CLAUDE.md, /rally, /apply, /leaderboard, /dashboard) - boosts multiply, not "most sales wins" | @Claude | Code | Now |
| Update doc 886 + TEAM-PLAYBOOK strategy: rally BOTH buys AND boosts; get boost points via ART/Endowment/profile/events | @Zaal | Strategy | This drive |
| Tell the crew to BOOST (free) not just buy - boosts multiply the score | @Zaal | Ops | This drive |
| Note Fund Director comp = 20% of sponsorships (ZAO Fund revenue line) | @Zaal | Decision | - |

## Sources

- [FULL] The Artizen Playbook - play.artizen.fund (full page scraped via headless browse, 2026-06-22). Sections: Welcome, Quickstart, Gameplay, Projects, Funds, Artifacts, Endowment, FAQ, Terms.
- [FULL] Worked example (Bloom Fund Drive) within the playbook - the Boost Score math.
- Cross-ref: docs 844/885/886 (this session) + live fund scrape (doc 886, rank #13).
