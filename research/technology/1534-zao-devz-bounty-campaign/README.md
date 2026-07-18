---
topic: technology, community, zabal
type: campaign-plan
status: DO NOW — ZABAL Games July window closes Jul 31; cast bounties before Jul 25
last-validated: 2026-07-18
related-docs: 1528-zabal-s2-workshop-calendar, 1531-zabal-marketplace-boxstore-api, 1520-wwtracker-helius-setup, 1480-zao-mini-app-spec
board-task: ZAO Devz bounty campaign (with Iman)
action-owner: Zaal + Iman (cast bounties from BCZ Treasury wallet + coordinate submissions)
---

# 1534 — ZAO Devz Bounty Campaign: Design + Cast Plan (with Iman)

> **Goal:** Run a structured developer bounty campaign to attract builders during ZABAL Games July open build month (goal: 200 builders) and seed the Sep–Nov S2 cohort (doc 1528) with proven contributors. Builds on the existing POIDH infrastructure (`bettercallzaal/zpoidh`) and adds two new code bounties alongside R7 (bug fixes).

---

## Why Now

Three converging windows:

| Signal | Deadline |
|--------|----------|
| ZABAL Games July = open build month, 200 builder goal | Jul 31 |
| POIDH R4 (open pot) closes Jul 31 — good moment to roll into R7 | Jul 31 |
| R7 (bug fixes) is drafted but not cast — ready to ship this week | Cast by Jul 25 |
| ZABAL S2 cohort selection (Aug 22) rewards builders who ship | Aug 22 |

The campaign runs **Jul 25 → Aug 15** — after R4 closes and before S2 cohort selection. Builders who ship within the campaign window have a strong S2 application signal.

---

## Campaign Structure: 3 Bounties

### Bounty 1 — R7: ZABAL Gamez Bug Fixes (already drafted)

**Source:** `zpoidh/rounds/r7/` — draft complete, not yet cast.

**What:** Fix a real bug on `zabalgamez.com`. Submissions = PRs. Multiple fixes can be paid (OPEN-SPLIT or top-3 per judge call).

**Reward seed:** [Zaal sets amount — suggested: 5,000–10,000 ZABAL from treasury]

**Cast deadline:** Jul 25 (so fixes land before Jul 31 ZABAL Games close)

**Judge:** Zaal (single judge per R7 spec)

**Iman's role:** Review submission PRs for basic bar (does it fix a real bug, clean diff), present shortlist to Zaal.

---

### Bounty 2 — R8: ZAOOS WaveWarZ Mini App (new)

**What:** Build Phase 1 of the WaveWarZ Farcaster Mini App (frames.js, 3 screens, hosted on Vercel — full spec in doc 1480 / doc 1518). The spec is written; the bounty pays someone to build it.

**Submission format:** Working Vercel deploy URL + link to the public repo. The mini app must load in Warpcast, show platform stats on screen 1, show live battle on screen 2, ZAOstock CTA on screen 3.

**Reward:** [Suggested: 20,000–50,000 ZABAL — this is the highest-effort bounty] or $50–$100 USDC if treasury allows. Winner: first submission that fully passes the 3-screen spec and loads in Warpcast.

**Not winner-take-all optional:** Pay 70% to first full pass, 30% to any runner-up that ships a meaningful subset (e.g., screen 1 only).

**Deadline:** Aug 10 (builds off the Jul 25 cast, gives 2 weeks to build) — must beat the Aug 15 target from doc 1518.

**Iman's role:** Write the promo cast for `/wavewarz` and `/zabal` channels. Test each submission against the spec's checklist.

**Special note:** If Hurricane ships it before anyone claims the bounty, bounty is closed early (no payout needed). Hurricane is the default builder; the bounty is a parallel-path to accelerate or crowdsource if Hurricane is blocked.

---

### Bounty 3 — R9: ZABAL Marketplace Box-Store v1 (new)

**What:** Implement doc 1531 — the ZABAL marketplace $1 box-store. Full spec is written. Submission = working Vercel deploy of the 3 routes + basic frontend (GET /boxes + POST /boxes + POST /boxes/[id]/purchase verified against the spec).

**Submission format:** Public GitHub fork of ZAOOS, open PR, Vercel preview URL.

**Reward:** [Suggested: 10,000–20,000 ZABAL or $25 USDC]

**Deadline:** Aug 15

**Iman's role:** Create listings in the store once live (tests the merchant flow).

---

## Platforms

| Platform | For | Why |
|----------|-----|-----|
| **POIDH** (`poidh.xyz/base`) | R7, R8, R9 | On-chain escrow, ZAO has 4 rounds of track record, builders already familiar |
| **Bountycaster** (Farcaster) | R8, R9 | Native Farcaster audience; cast a bounty in /zabal channel → Farcaster builders see it |
| **GitHub Issues (ZAOOS)** | R7, R9 | Builders who browse GitHub directly find it; label `bounty` + `help wanted` |

For each bounty: POIDH is the canonical escrow. Bountycaster and GitHub Issues are amplification channels that link back to the POIDH URL.

---

## Promo Cast Templates

### R7 launch cast (Farcaster `/zabal` + X):
```
bug bounty: find a bug on zabalgamez.com + fix it, earn ZABAL.

we're running poidh bounty R7 — an open-split code bounty for real bug fixes.

THE BAR:
1. find a real bug users hit (not cosmetic, not spelling)
2. open a PR with a clean minimal fix
3. post the PR link on the bounty page

multiple good fixes = multiple payouts.

→ [POIDH bounty link]
closes [deadline] · judge: @bettercallzaal
```

### R8 launch cast (Farcaster `/wavewarz` + `/zabal` + X):
```
wanted: build the WaveWarZ farcaster mini app.

spec is written. frames.js. 3 screens: stats → live battle → ZAOstock CTA. host on vercel.

first builder who ships it and passes the bar wins [REWARD] ZABAL.

full spec → [link to doc 1518 or ZAOOS doc]
bounty → [POIDH R8 link]
closes aug 10 · judge: @bettercallzaal
```

### R9 launch cast (Farcaster `/zabal`):
```
build: ZABAL marketplace.

spec lives in ZAOOS. 3 api routes. supabase tables. viem tx verification. no escrow contract.

$1 boxes. ZABAL on Base. 4 hours to v1.

→ PR to ZAOOS + vercel preview → [POIDH R9 link]
closes aug 15 · judge: @bettercallzaal
```

---

## Reward Budget Summary

| Bounty | Suggested ZABAL | Suggested USDC alt |
|--------|---------------|-------------------|
| R7 — bug fixes | 5,000–10,000 ZABAL | $10–25 USDC |
| R8 — mini app | 20,000–50,000 ZABAL | $50–100 USDC |
| R9 — marketplace | 10,000–20,000 ZABAL | $25–50 USDC |
| **Total** | **35,000–80,000 ZABAL** | **$85–175 USDC** |

**Recommendation:** Pay in ZABAL to keep community-aligned and preserve USDC treasury. If ZABAL market price is very low at cast time, consider a USDC floor (e.g., "min $10 USDC equivalent in ZABAL at the rate on cast day").

Zaal: confirm available ZABAL from treasury before seeding each bounty on POIDH.

---

## Iman's Roles (concrete)

| Task | Platform | Time |
|------|----------|------|
| Write R8 promo cast + cross-post to Farcaster/X | Farcaster, X | 20 min |
| Write R9 promo cast + cross-post | Farcaster, X | 15 min |
| Review R7 submissions: basic bar check (does it fix a bug?) | GitHub | ~1 hr over campaign |
| Test R8 submission: load in Warpcast, click all 3 screens | Warpcast + browser | 15 min per submission |
| Create a box listing in the R9 marketplace after it ships | Browser | 5 min |
| Track submission counts in a daily standup note | Telegram | 2 min/day |

---

## Execution Checklist

**Jul 25 (R7 cast day):**
- [ ] Zaal seeds POIDH R7 bounty (5,000–10,000 ZABAL) via `zpoidh/docs/create-bounty.html`
- [ ] Iman cross-posts R7 promo cast to X + Farcaster /zabal
- [ ] Add `bounty` + `help wanted` label to 3 `zabalgamez` GitHub issues
- [ ] Zaal DMs top ZABAL Games builders individually about R7

**Jul 28 (R8 cast day):**
- [ ] Zaal seeds POIDH R8 bounty (20,000–50,000 ZABAL)
- [ ] Iman cross-posts R8 promo cast to /wavewarz + /zabal + X
- [ ] Add ZAOOS GitHub issue: "Bounty: WaveWarZ Mini App Phase 1" linking to doc 1518

**Aug 1 (R9 cast day, post-R4 close):**
- [ ] Confirm ZABAL marketplace v1 PR is not already in progress (Hurricane?)
- [ ] Zaal seeds POIDH R9 bounty (10,000–20,000 ZABAL)
- [ ] Iman cross-posts R9 promo cast to /zabal + X
- [ ] Add ZAOOS GitHub issue: "Bounty: ZABAL Marketplace v1" linking to doc 1531

**Aug 10–15 (close window):**
- [ ] R7 closes: Zaal reviews shortlist Iman surfaces
- [ ] R8 closes: test each submission in Warpcast + verify 3 screens
- [ ] R9 closes: verify Vercel preview URL + run through purchase flow
- [ ] Ship payout txns on-chain; update `zpoidh/data/claims.json`

---

## S2 Cohort Tie-In (Aug 22 selection)

Builders who ship within the campaign window get a "campaign contributor" badge for their S2 application (doc 1528). Concretely:

- R7 fix merged into ZAOOS: +1 "shipped code" signal in application
- R8 or R9 bounty won: automatic S2 cohort acceptance (no further review needed)
- Multiple campaign submissions: priority ranking in S2 batch

ZOE can generate a summary of campaign submissions when the S2 selection committee meets Aug 22.

---

## Related Docs

- [Doc 1528 — ZABAL S2 workshop calendar](../../zabal/1528-zabal-s2-workshop-calendar/) — S2 cohort selection Aug 22 uses campaign signals
- [Doc 1531 — ZABAL marketplace $1 box-store API](./1531-zabal-marketplace-boxstore-api/) — R9 bounty spec
- [Doc 1518 — WaveWarZ Mini App Phase 1 spec](./1518-wavewarz-miniapp-phase1-spec/) — R8 bounty spec
- [Doc 1520 — wwtracker Helius setup](./1520-wwtracker-helius-setup/) — potential R10 bounty after campaign close

## Sources

- `bettercallzaal/zpoidh` README + rounds r4/r5/r6/r7 (Jul 18, 2026 audit)
- ZAOOS board task `66638e35` — "ZAO Devz bounty campaign (with Iman)"
- Research docs 1480, 1518 (Mini App spec), 1531 (marketplace spec), 1528 (S2 calendar)
