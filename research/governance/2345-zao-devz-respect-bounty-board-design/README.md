---
topic: governance
type: design
status: design-proposed
last-validated: 2026-08-20
related-docs: 696, 941, 1534, 1770, 942, 718
original-query: "Design the ZAO Devz bounty board, awarded via fractal respect, with Iman (board card 9eda9865)"
tier: STANDARD
---

# 2345 - ZAO Devz Bounty Board, Awarded via Fractal Respect (design, with Iman)

> **Goal:** The design for board card 9eda9865 (P1, due 2026-08-26): a standing ZAO
> Devz bounty board whose reward is **Fractal Respect**, coworked with Iman. Zaal's
> decoded line: "Bounty board for Devz, awarded via fractal respect, coworked with
> Iman." This is a DESIGN doc - the card closes when the design is agreed with Iman
> and on the board. Nothing here mints, posts, or spends until Zaal/Iman confirm.

## What already exists (verified before designing - nothing to duplicate)

Searched 2026-08-20: grep of `research/**` for bounty board / devz+bounty concepts,
grep of `src/**` for bounty surfaces, plus the fractal governance canon. Found:

| Exists | What it is | Relation to this design |
|---|---|---|
| Doc 1534 | July 2026 bounty CAMPAIGN (POIDH escrow, ZABAL/USDC rewards, R7-R9, window closed Aug 15) | Precedent for roles + amplification channels; NOT a standing board, NOT respect-rewarded |
| `bettercallzaal/zpoidh` | POIDH round infrastructure (R4-R7) | Optional money-escrow rail only |
| Cowork board (Supabase `tasks`) | The live task board, project `zaodevz` already exists | The board substrate - reuse, do not build a new app |
| Doc 1770 | Respect operations guide: submitBreakout URL, **Respect Account Batch form**, video +10 stream, `respect_members` registry (~161 wallets) | The mint mechanism bounty awards ride |
| Doc 941 | Votable burn/decay proposal: judged bounty ship = burn-pause signal (Vote 3); bounty-judging gated by Active Respect (phase 2) | This design is its "bounty surface" made concrete |
| `src/app/(auth)/contribute/page.tsx` | Links to GitHub issues labeled `bounty` | Amplification link target to update later |
| Vault (onenote sweep 2026-08-16) | The DKP (WoW Dragon Kill Points) research idea + "fractal upgrade proposal (multi-respect leaderboards)" thread | Framing input; the DKP research task stays its own P3 card |

Conclusion: no standing bounty board exists, and no bounty has ever paid Respect.
The design below is composition of existing pieces, not a build.

## The design

**Principle: bounties become the third Respect-earning surface.** Today Respect is
earned two ways per week (doc 1770): breakout ranking and camera-on (+10). This
adds: **ship a judged bounty, earn Respect in the same weekly on-chain batch.**
It operationalizes doc 941's thesis ("participation is what you ship, not where
you sit") without waiting for the decay vote - the design works under today's
no-decay reality (doc 942's correction) and gets stronger if 941 passes.

### 1. The board - reuse the cowork board

- Bounties are cowork `tasks` rows: `project = zaodevz`, `category = Bounty`,
  one card per bounty. No new table, no new app.
- Card fields already fit: title, notes (spec + acceptance bar + reward), due,
  status, owner. Bounty-specific bits (reward tier, claim, PR link) live in
  structured lines in `notes` for v1; a `metadata.bounty` block if/when the
  board UI wants to render them.
- **Iman curates the board** (adds/grooms cards); Zaal approves each bounty
  before it goes OPEN (the reward is governance weight - casting one is gated).

### 2. Lifecycle

```
DRAFT -> OPEN -> CLAIMED -> SUBMITTED -> JUDGED -> AWARDED -> CLOSED
```

- **DRAFT:** Iman writes spec + acceptance bar. Zaal taps approve.
- **OPEN:** card visible; amplified (GitHub issue with `bounty` label, /zao and
  /zabal casts - outbound stays Zaal/Iman's tap, per the outbound gate).
- **CLAIMED:** builder comments on the card (or GitHub issue). First-claim is
  soft - parallel attempts allowed, the bar decides. **Newcomer rule: capture
  the builder's wallet at claim time** and add to `respect_members` - this
  kills doc 1770's single biggest friction (newcomer wallets missing at mint).
- **SUBMITTED:** a PR (or deploy URL for non-code) linked on the card. The
  artifact must be verifiable - no artifact, no award.
- **JUDGED:** Iman runs the first bar (does it meet the acceptance list, clean
  diff) and shortlists; **Zaal is the judge** (single-judge, the R7 precedent).
- **AWARDED:** Respect minted in the NEXT weekly fractal batch (see 3).
- **CLOSED:** card completed with PR link + mint reference in notes.

### 3. The award - ride the existing weekly mint, no new machinery

Doc 1770's **Respect Account Batch** form (zao.frapps.xyz -> New Proposal ->
Respect Account Batch) already mints arbitrary values per wallet with Title,
Reason, Meeting number, Mint type - it is how even-splits and video awards go
on-chain. Bounty awards are added as rows in that same weekly batch:

- Row: wallet (from `respect_members`), value (tier below), Title
  "ZAO Devz Bounty <card-id-short>", Reason = the PR URL, Meeting# = current
  week, Mint type = the week's convention.
- Settlement: ZOR Respect (ERC-1155 `0x9885CC...E7445c`, the live stream,
  fractals 74+), OREC 72h optimistic window - same as every other award.
- **Cadence: weekly, batched.** No per-bounty mints, no new relayer path. This
  respects the honest operating-core fact (94% of OREC proposals via one
  relayer - reference_zao_respect_onchain_facts): the design adds zero new
  proposal paths.

### 4. Denominations - Fibonacci, commensurate with the breakout curve (PROPOSED)

| Tier | Respect | Calibration |
|---|---|---|
| S - small fix, docs, bug | 8 | ~ a 5th-place breakout week (base curve) |
| M - feature, integration | 21 | ~ a 3rd-place week |
| L - a shipped product slice (mini app, marketplace v1) | 55 | ~ a 1st-place week (base curve) |

Rationale: a large bounty ship should weigh about like winning a week's breakout,
not dwarf it - Respect must stay one currency (values from doc 1770's verified
denomination table). Camera-on is 10; an S bounty at 8 deliberately sits just
under it. **These numbers are Zaal + Iman's tap, not settled.**

### 5. Money is optional and separate

A bounty MAY carry a ZABAL/USDC top-up via POIDH escrow (the doc 1534 rail) when
Zaal chooses - but Respect is the default and the identity of the board. Money
attached = POIDH is canonical escrow, board card links the round (1534 pattern).
Treasury spend stays Zaal-gated per bounty.

### 6. Doc 941 compatibility (forward design)

- A judged bounty ship = the burn-pause participation signal of 941 Vote 3, so
  if decay is adopted, remote builders keep weight without call attendance.
- Phase 2 (941's Snapshot path): gate bounty JUDGING by Active Respect tier -
  judging becomes a respect-weighted role, claim stays permissionless.
- DKP framing (the card's cited research thread): DKP is earn-then-SPEND;
  Respect is earn-only, soulbound weight. The analogy that holds: bounty
  respect = the DKP "earn" side; 941's Active/decay = the DKP relevance decay.
  The queued P3 "Research DKP" card stays separate - this design does not
  depend on it.

### 7. Iman's cowork roles (mirrors the proven 1534 table)

| Role | Surface |
|---|---|
| Draft bounty specs + acceptance bars | Cowork board |
| First-bar review of submissions, shortlist to Zaal | GitHub PRs |
| Newcomer wallet capture at claim time | respect_members |
| Promo casts when a bounty opens (Zaal-approved outbound) | Farcaster /zao /zabal, X |
| Weekly: hand the AWARDED rows to whoever runs the mint batch | Respect Account Batch |

### 8. What this deliberately is NOT

- Not a new app, bot, or contract - board = cowork board, mint = existing batch.
- Not auto-mint - a human builds the weekly batch; OREC's 72h window stays the gate.
- Not a leaderboard or multi-respect system - that is the separate fractal
  upgrade thread (2026-08-16 session); this is one earning surface.
- Not open-ended grinding - every award requires a judged, merged artifact.

## Open decisions (the "agreed with Iman" gate - tap sheet)

1. Denomination tiers: 8/21/55 as proposed, or different calibration?
2. Start respect-only, or allow money top-ups from bounty one?
3. Board visibility: member-only cowork view, or a public read surface?
4. Mint labeling: reuse the week's mintType with "ZAO Devz Bounty" titles (as
   designed), or ask Optimystics for a distinct bounty mint type?
5. Seed bounties: carry over the unfinished 1534 scopes (WaveWarZ mini app,
   marketplace v1) or start fresh from the current backlog?

## Honest limits (UNVERIFIED items)

- The Respect Account Batch form's per-row Title/Reason fields are documented
  from doc 1770's live-session observation; not re-tested this run.
- Whether video (+10) awards historically used a distinct mint type is not
  recorded in doc 1770 - affects open decision 4 only.
- `respect_members` count (~161) is as of 2026-07-20; not re-queried.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review this design with Iman, tap the 5 open decisions | @Zaal + @Iman | Decision | 2026-08-26 (card due) |
| On agreement: mark card 9eda9865 done, add the bounty-board convention note to the zaodevz project | @Zaal / lane | Board | With agreement |
| Seed first 3 bounty cards (per decision 5) | @Iman | Board | After agreement |
| First award rides the next weekly batch after a merge | @Zaal | Mint (gated) | Rolling |

## Sources

- Doc 1770 (Respect operations: batch form, denominations, video stream, respect_members) - direct read this run
- reference_zao_respect_onchain_facts memory (contracts, 156 holders, Gini 0.73 OG-only, OREC 72h/72h, relayer concentration) - direct read this run
- Doc 941 (burn/decay proposal, Votes 3/6 bounty touchpoints) - direct read this run
- Doc 1534 (July bounty campaign: roles, platforms, promo patterns) - direct read this run
- Doc 696 (fractal lineage: Respect soulbound, small-group consensus) - direct read this run
- Board card 9eda9865 (Supabase cowork tracker, read 2026-08-20): WHY/DONE-WHEN/SAID quoted from the card
- Vault: onenote-nuggets.md + all-todos-parent.md (DKP research line, fractal upgrade thread, 2026-08-16 sweep)
