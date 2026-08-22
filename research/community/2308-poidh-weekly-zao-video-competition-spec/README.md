---
topic: community
type: decision
status: research-complete
last-validated: 2026-08-22
superseded-by:
related-docs: 625, 768, 798, 891, 1534, 2202, 2266
original-query: "POIDH weekly ZAO video competition spec - open weekly internet competition, contestants say 'this is for the ZAO' at video start, post to X/IG/Farcaster, tag ZAO, submit screenshot + link to POIDH bounty. Spec: bounty structure on POIDH, judging, prize sizing options, anti-gaming, weekly cadence, winners feeding ZOLs/social. Board task P2, source onenote sweep. Raffle-safe: skill-judged only, no pre-announced random draws. PR-only, nothing outbound."
tier: STANDARD
---

# 2308 - POIDH weekly ZAO video competition (spec)

> **Goal:** A runnable spec for a recurring weekly skill-judged video competition on POIDH, where
> the entry is a public video that opens with the spoken line "this is for the ZAO." Covers bounty
> structure, the entry mechanic, judging, prize-sizing options, anti-gaming, cadence, and what
> happens to winners afterward. Money and go-live are Zaal's; this is the design.

## The framing correction, before anything else

The concept as written has R4's exact failure mode built into it, and that is the single most
important thing in this doc.

Zaal's note describes a two-surface entry: **post the video on X/IG/Farcaster, then submit a
screenshot + link as a POIDH claim.** R4 (bounty 1249, ZABAL Gamez open pot) ran on that same
shape and it broke. From `zpoidh/rounds/r4/CLOSEOUT.md`:

> "Bar rule 5 said 'submit your claim on this POIDH bounty page.' Only 2 POIDH claims ever existed
> on 1249 (both the same wallet). zabalgamez's own submission board had the real activity - this
> mismatch (individual claims never came) is why a claim-and-split was attempted manually in the
> first place, before the cancel mistake happened."

**16 builders did the work. 2 claims arrived, both from one wallet.** The POIDH claim was a second
chore after the real act, so almost nobody did it. Then the manual workaround to fix it is what led
to the bounty being accidentally canceled instead of withdrawn, closing the on-chain claim path and
forcing a $100 off-chain Empire Builder credit to 15 people.

A weekly competition repeats that chore 52 times a year. If the POIDH claim stays a second step,
this design fails weekly instead of once.

**The fix is not a reminder. It is to make the POIDH claim the entry itself.** The claim carries the
public post URL in its description; the screenshot becomes the claim's image. "Posted publicly but
never claimed on POIDH" is then not a lossy funnel, it is simply not an entry, and the rules say so
in one line. This is design decision #1 below and everything else assumes it.

## Key Decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **Entry mechanic** | **The POIDH claim IS the entry. One surface, not two.** The claim's description field carries the public post URL; the claim image is the screenshot. Public post without a POIDH claim = not entered, stated as floor rule #1. This is the direct fix for R4's 16-builders/2-claims collapse (`rounds/r4/CLOSEOUT.md`). Do NOT run a parallel submission board alongside it - that split is what broke R4. |
| 2 | **Bounty type** | **Solo bounty, one new bounty per week, on Base.** Doc 625: solo = "no voting period, no contributor coordination overhead," correct for ZAO-funded asks (90% of cases). Open bounties trigger contributor-weighted voting above 50% once outside funds enter, which would hand winner selection to dust-voters and break the skill-judged requirement in #4. A weekly cadence also means a canceled or fumbled week costs one week, not a season. |
| 3 | **Cadence mechanic** | **A fresh bounty per week, not one long-running bounty.** POIDH pays exactly one accepted claim per bounty (doc 625: "One on-chain winner - single NFT transfer"). A single rolling bounty cannot pay a winner every week. `docs/create-bounty.html` already auto-versions the round number live off POIDH's own bounty feed (built for R6, no hand-tracked state), so weekly re-casting is already tooled. |
| 4 | **Raffle-safe compliance** | **Publish the full numeric rubric IN the bounty description before entries open, and use a skill-based tiebreak.** Zaal's raffle-safe rule is correct and the legal mechanism is stricter than "don't do a random draw": under the material-element test used by some states, chance may play *no* material role, and judging criteria "must be specific, documented, and disclosed to participants before they enter" (Fasthoff Law Firm, 2026-06-08). A coin-flip or random tiebreaker reintroduces chance and would reclassify the promotion. Ties break on the rubric's Substance sub-score, then earliest claim timestamp. Never on a draw. |
| 5 | **Prize sizing** | **Zaal's call. Three costed options in the table below.** All three assume the 102.5% budgeting rule (doc 625: 2.5% protocol fee deducted at acceptance) and clear the live-verified protocol floor of 0.001 ETH. Recommended starting point is Option B. |
| 6 | **Anti-gaming anchor** | **The spoken "this is for the ZAO" line at video start is the strongest anti-gaming primitive in the concept - keep it and make it a hard floor rule.** It cannot be satisfied by reposting someone else's video, and it cannot be added after the fact without a re-record. It is a liveness proof, not a slogan. Pair it with the existing audio rule and per-wallet dedup (details in Anti-gaming below). |
| 7 | **"Feeds ZOLs"** | **BLOCKED and ambiguous - needs a Zaal answer before any spec line depends on it.** Two separate things are called ZOL (see the ZOL section). If ZOLs-as-credits is meant, there is no system to feed: an exhaustive grep of ZAOOS `src/`, schema, and config found no ledger, table, or award path. Award them the way ZABAL Gamez points already work - manually, by Zaal ([[feedback_points_are_awarded_manually]]). |
| 8 | **Novelty check** | **Weekly recurring is genuinely untried on POIDH - this is not a me-too.** Measured live 2026-08-17 against `data/bounty-dashboard.json`: **0 of 91** currently-open POIDH bounties platform-wide use weekly / recurring / season language. Worth knowing before investing in cadence tooling: there is no existing pattern to copy and no competitor to differentiate from. |

## The spec

### 1. Bounty structure (per week)

| Field | Value |
|---|---|
| Platform | POIDH v2/v3, Base (chain 8453), contract `0x5555fa783936c260f77385b4e153b9725fef1719` |
| Type | Solo (Zaal escrows, Zaal accepts, no vote) |
| Title | `this is for the ZAO - week NN` (lowercase "poidh" wherever the word appears, per Kenny's own R1 review note) |
| Window | Cast Monday, closes Sunday 11:59pm PT. Explicit absolute date in the description, never "7 days" |
| Prize | See sizing options below |
| Judge | Single judge (Zaal). Not a 48h open vote |
| Album | **Open decision** - see the album question in Open Decisions |
| NFT naming | `ZAO Weekly #NNN` where NNN is the week number, continuing across weeks so the collection compounds |

The weekly bounty description reuses the canonical structure from doc 768 Part 4: title, one-line
ask, THE BAR (numbered floor rules), the rubric with its point values, deadline as an absolute
date, and the prize. The rubric must be in the description itself, not linked, for the compliance
reason in Key Decision #4.

### 2. Entry mechanic (the one-surface rule)

An entry is a POIDH claim on that week's bounty containing all of:

1. A video that **opens with the spoken line "this is for the ZAO"** in the first 3 seconds, audible, on camera.
2. The video **posted publicly** on X, Instagram, or Farcaster, with The ZAO tagged.
3. The **public post URL in the claim description**.
4. A **screenshot of the live post as the claim image** (this is what `api/claim-meta.mjs` already serves - a stateless metadata endpoint taking any poster image URL, built exactly for non-Farcaster-gated claim submission).

Floor rule #1 reads, verbatim: *"If it is not claimed on this poidh bounty page, it is not entered.
Posting publicly is required but posting alone does not enter you."*

### 3. THE BAR (floor rules - binary, checked before any scoring)

1. Claimed on this poidh bounty page (see above).
2. Video opens with the spoken line "this is for the ZAO" in the first 3 seconds.
3. Public post is live and public at judging time, with The ZAO tagged.
4. Duration inside the stated cap. **Publish the cap and a duration meter on the judging page before the window closes** - R2 lost its best-substance submission (Ebuka, claim 6616) at 91.88s against a 60s cap, "50% over the floor," on a binary it never saw coming (`project_poidh_judging_arch`).
5. **Audio rule** ([[feedback_poidh_audio_rule]], locked 2026-05-28, non-negotiable): no random background or ambient music under dialog. Binaural beat (single sustained tone, 8-30Hz beat between L/R) if non-silence is wanted. Original source audio fine. One clear instrumental fine if it does not compete with dialog. Layered melodic music under dialog = floor fail.
6. Your own work, your own face/voice on the opening line.

### 4. Judging and rubric

Reuse the judging architecture that already exists rather than inventing one. Per
`project_poidh_judging_arch`, each round produces `poidh-round{N}-judging.json` (floor checks,
rubric, pros/cons, pick_score 0-10, verdict) rendered by a static HTML page, with ffprobe-resolved
durations as the authoritative duration source and first-frame thumbnails per submission. The
verdict ladder (`STRONG_CANDIDATE` / `FLOOR_PASS_WEAK_RUBRIC` / `BORDERLINE_DURATION` /
`FLOOR_FAIL_DURATION` / `FLOOR_FAIL`) transfers unchanged.

Rubric, published in the bounty description before entries open, 100 points:

| Category | Points | What scores |
|---|---:|---|
| Substance | 40 | Does it actually say something true about The ZAO. Highest weight on purpose - this is the tiebreak category |
| Craft | 30 | Edit, framing, audio clarity, pacing |
| Distribution | 20 | Cross-posted to more than one of X / IG / Farcaster; posted in /zao and /poidh channels. R2's distribution box went mostly unticked because only 1 of 7 submitters cross-posted (doc 768) |
| Originality | 10 | Angle not already used in a prior week |

**Distribution is scored on cross-posting actions taken, not on likes or view counts.** Scoring raw
engagement rewards whoever can buy it, and makes the outcome depend on a variable the entrant does
not control, which weakens the skill-contest classification in Key Decision #4.

### 5. Prize sizing options (Zaal decides)

All figures at doc 625's tiers, budgeted at 102.5% to cover POIDH's 2.5% acceptance fee. The
protocol floor is live-verified: `MIN_BOUNTY_AMOUNT` = 0.001 ETH, `MIN_CONTRIBUTION` = 0.00001 ETH
(direct `eth_call` against the deployed Base contract, 2026-08-17).

| Option | Weekly prize | Escrow per week (102.5%) | 13-week cost | Doc 625 tier | Trade-off |
|---|---|---|---|---|---|
| **A - Seed** | 0.01 ETH | 0.01025 ETH | 0.1333 ETH | TIER B (creative output) | Cheapest real test. Above the 0.005 ETH practical floor where "claim gas + cognitive cost > prize." Risks reading as too small to justify a produced video |
| **B - Standard (recommended)** | 0.03 ETH | 0.03075 ETH | 0.3998 ETH | TIER B top / TIER C floor | The band doc 625 assigns to "production-quality, video." Enough to pull real edits, small enough that a dead week is not painful. Start here |
| **C - Flagship** | 0.1 ETH | 0.1025 ETH | 1.3325 ETH | TIER C top | Pulls outside-ZAO entrants and press. Only worth it once weeks 1-4 prove entries actually arrive. Running this cold risks paying flagship money for 2 entries |

A fourth path exists and is deliberately not recommended yet: **community-funded pot via an open
bounty.** It conflicts with Key Decision #2 (contributor voting would decide the winner) and should
stay off the table until the skill-judged format is established.

**Do not pre-announce a prize ladder for places 2 and 3 that you have not escrowed.** POIDH pays one
accepted claim per bounty; runner-up prizes are a manual ETH send to the claim wallet (doc 625:
"manual bonus prizes off-chain"). If runner-up money is promised in the description it must actually
be sent, by hand, every week.

### 6. Anti-gaming

| Vector | Mitigation | Grounding |
|---|---|---|
| Reposting someone else's video | The spoken opening line, on camera, in the entrant's own voice. Cannot be added to an existing video without re-recording | Key Decision #6 |
| One person, many wallets | Dedup by claim wallet AND by public-post account. One entry per person per week; the second claim from a matched pair is floor-failed, not silently dropped | R4 saw 2 claims from a single wallet on one bounty (`rounds/r4/CLOSEOUT.md`) |
| Engagement farming / bought likes | Distribution scores cross-posting actions, never like or view counts | Section 4 |
| Recycling last week's entry | Originality category (10 pts) plus a hard floor-fail for a video already submitted in a prior week. Keep a running hash/URL list per week | Section 4 |
| Late edits after judging starts | Judge against the claim as submitted; ffprobe durations and first-frame thumbs are captured at close and stored per round | `project_poidh_judging_arch` |
| Post deleted after winning | Floor rule 3 requires the post live at judging time; verify immediately before accepting the claim on-chain, since acceptance is irreversible |	Floor rules |
| Self-dealing | Zaal, Iman, and anyone judging are ineligible to enter. State it in THE BAR | Standard practice; also keeps the skill-contest classification clean |
| Dispute over a judgement call | Single judge is the rule and is stated up front. The published rubric is the appeal surface - a scored breakdown per entry on the judging page, which the existing judging JSON already produces | Section 4 |

### 7. Weekly operating loop

Assumes the fresh-bounty-per-week model from Key Decision #3.

| Day | Action | Tooling that already exists |
|---|---|---|
| Mon | Cast week NN bounty, escrow prize | `docs/create-bounty.html` (auto-versions the round number off POIDH's live feed) |
| Mon | Cross-post the cast to /zao and /poidh, Firefly cross-post to X | Doc 768 Part 4 cast checklist |
| Thu | Mid-window reply-cast: entry count, days left, and the duration meter | Doc 768 Part 4 "mid-window reminder", added for R3 |
| Sun 11:59pm PT | Window closes | Absolute date in description |
| Mon | Pull claims, ffprobe durations, build judging page, score, accept winner on-chain | `scripts/refresh-poidh-leaderboard.py`, `scripts/process-judging-videos.py`, `scripts/render-judging-html.py`, `scripts/run-judging-round.py` |
| Mon | Winner cast + next week's bounty in the same cast | `scripts/prepare-winner-announcement.py` |

Casting week NN+1 inside the week-NN winner cast is the single highest-leverage cadence move: it
makes the announcement and the recruitment the same post, which is how a weekly loop compounds
instead of restarting cold each week.

**Note on automation:** `github.com/0x94t3z/poidh-sentinel` (MIT - read from the LICENSE file, not
the API field) is real prior art for automating exactly this loop end-to-end: bounty creation from
chat, cron submission polling, AI evaluation, on-chain resolution. It is small (4 stars) and last
pushed 2026-05-03, so treat it as a reference architecture to read, not a dependency to adopt. Doc
2266 reached the same conclusion. The human-gated subset (suggest, evaluate, recommend, human calls
`acceptClaim`) is the part that matches ZAO's approval-gated posture.

### 8. What happens to winners: ZOLs and social

**This section is blocked on a Zaal answer, and the block is a naming problem, not a design problem.**

"ZOL" refers to two different things in the corpus, and doc 891 already flagged the clash as an open
Zaal decision ("Name clash - 'ZOL' collides with 'ZOLs' (ZAO contribution credits) in the brand
glossary. Confirm the agent name with Zaal before public launch"):

- **ZOLs** = ZAO contribution credits (brand glossary; doc 798 *ambient-fandom* - note 798 collides across three docs, the relevant one is `business/798-ambient-fandom-off-protocol-music-audience`, which describes "contribution credits (ZOLs)" as one of ZAO's off-protocol measurement instruments).
- **ZOL** = @zolbot, FID 3338501, ZAO's Farcaster agent ([[project_zol_farcaster_agent]]).

Both readings are actionable, and they are different work:

**If ZOLs-as-credits:** there is nothing to write to. An exhaustive grep across ZAOOS `src/`, the
schema, `community.config.ts`, and `entities.json` returns no ZOL ledger, table, award path, or
config - the only `src/` hits are `agentId: 'zol'` inside two test files plus one comment in
`src/lib/spore/types.ts`. Award them the way ZABAL Gamez points already work: manually, by Zaal,
with a typed reason. Do not build automatic accrual for competition wins -
[[feedback_points_are_awarded_manually]] is explicit that an identical mechanic was offered and
declined ("I don't want them to be automatic I wanna add points manually when ppl do things"), and
that a weekly competition converting activity into score is precisely the tally shape that rule
exists to prevent.

**If ZOL-the-agent:** @zolbot can amplify winner casts, but be honest about reach. Its own memory
records "over-built relative to the goal (reach). @zolbot has ~0 followers." Real distribution is
Zaal's own account. Use ZOL as a secondary echo, never as the announcement channel.

**The $ZABAL participation rail is the piece that already works, and it is currently disconnected.**
R2 distributed $ZABAL to all 7 floor-pass editors via slot 8 of the ZABAL Empire, making
participation itself the reward (doc 768). That is the natural fit for a weekly competition where
one person wins and everyone else showed up. But as of 2026-08-17 Empire Builder's POIDH Submitters
leaderboard still points its `api_endpoint` at the stale `bettercallzaal.com/poidh-leaderboard.json`
snapshot instead of zpoidh's live feed. Verified by running `scripts/check-eb-sync.py`: **34
addresses locally vs 16 on Empire Builder, 18 missing, 4 score mismatches.** A weekly competition
that promises $ZABAL to participants would today promise something that does not arrive. **Fixing
that config is a prerequisite, not a follow-up** - it is a dashboard change, no code.

## Open decisions (Zaal's, all gated)

| # | Question | Why it blocks | Default if unanswered |
|---|---|---|---|
| 1 | Prize option A, B, or C | Nothing can be escrowed without it | None. Hard block on week 1 |
| 2 | Which album do these land in | `org.config.json` sets `farcaster_album: "wethemmedia"`, so every weekly bounty would build We Them Media's album, not a ZAO one, permanently and on-chain. Doc 2266 raised this on 2026-08-11 and it is still unanswered | Hard block. A weekly cadence makes the wrong answer expensive fast |
| 3 | What "feeds ZOLs" means (credits vs the agent) | Section 8 | Manual credit award by Zaal, no automation |
| 4 | Is this a BCZ bounty or a The ZAO bounty | Changes issuer wallet, voice, tag target, and which channel the cast is pinned in. R1-R7 were all BCZ | BCZ, matching every prior round |
| 5 | Run past Kenny before week 1 | Kenny reviewed R1 pre-launch and returned 4 concrete fixes in under 30 minutes ([[project_poidh_bounty_live]]). A recurring format is a bigger ask than a one-off | Recommended yes, but it is outbound, so Zaal sends |

## What this spec explicitly does NOT do

- **No bounty goes live.** Nothing here is cast, escrowed, or posted. Money and go-live are Zaal's.
- **No outbound.** No DMs, no casts, no Kenny message drafted. Per the dispatch and [[feedback_dont_invent_outreach]].
- **No new escrow contract.** POIDH is canonical (doc 1534, doc 2234). This uses it as-is.
- **No automatic ZOL/points accrual.** See Section 8.
- **No pace targets.** No "N entries per week" goal is set here; that would be an invented cadence target ([[feedback_no_arbitrary_targets]]). The real constraints are the weekly deadline and the escrow.

## Also See

- [Doc 625 - POIDH x ZAO bounty playbook](../625-poidh-zao-bounty-playbook/) - prize tiers, solo vs open, fee math, the 18 templates
- [Doc 768 - POIDH bounty best practices](../../business/768-poidh-bounty-best-practices-zabalgames-r3/) - the canonical bounty-writing checklist, the audio rule, what broke in R2
- [Doc 2202 - POIDH x ZAO collaboration current state](../../business/2202-poidh-zao-collab-current-state-brand-alignment/) - R1-R7 history, the `/data` endpoint, the Empire Builder drift
- [Doc 2266 - POIDH as a cross-project propagation engine](../2266-poidh-cross-project-propagation/) - the album question, Kenny's meta-bounty format, poidh-sentinel
- [Doc 891 - Farcaster agentic bootcamp (ZOL)](../../agents/891-farcaster-agentic-bootcamp-zol/) - where the ZOL/ZOLs name clash was first flagged
- [Doc 1534 - ZAO Devz bounty campaign](../../technology/1534-zao-devz-bounty-campaign/) - POIDH as canonical escrow; R8/R9 campaign design
- zpoidh repo (`bettercallzaal/zpoidh`) - `rounds/r4/CLOSEOUT.md`, `docs/create-bounty.html`, `scripts/check-eb-sync.py`, `api/claim-meta.mjs`
- Tracker task `meeting:onenote-all-todos-sweep-2026-08-16` - "POIDH weekly ZAO video competition: write the spec", todo, due 2026-08-27

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fix Empire Builder's POIDH Submitters `api_endpoint` to `https://zpoidh.vercel.app/leaderboard` (shipped = `python3 scripts/check-eb-sync.py` prints IN SYNC) | @Zaal | EB dashboard config | 2026-08-21 |
| Answer Open Decision #1 (prize option A / B / C) and #2 (album) (shipped = both written into `org.config.json` with a one-line note on why) | @Zaal | Decision | 2026-08-24 |
| Answer Open Decision #3 - does "feeds ZOLs" mean contribution credits or @zolbot (shipped = one line in this doc's Section 8, doc re-validated) | @Zaal | Decision | 2026-08-24 |
| If greenlit: build `rounds/weekly/_template/` (description with embedded rubric, THE BAR, promo cast, mid-window cast) in zpoidh (shipped = PR merged, template renders a week-1 description) | @Zaal (Claude) | PR (zpoidh) | after Open Decisions 1+2 answered |
| Run the week-1 description past Kenny before casting, as with R1 (shipped = Kenny's reply captured in `rounds/weekly/w01/`) | @Zaal | Outbound (Zaal sends) | before week 1 casts |
| Migrate `scripts/refresh-poidh-leaderboard.py` off tRPC to POIDH's `/data` endpoint before a weekly loop depends on it (shipped = PR merged, script pulls `/data`) | @Zaal (Claude) | PR (zpoidh) | 2026-08-31 |

## 2026-08-22 Review Notes

- **R5 (WaveWarZ clip bounty) context:** Doc 2356 (WaveWarZ clip bounty pre-launch grounding) covers zpoidh R5 specifically — that round uses the same poidh spec as this weekly competition but is WaveWarZ-branded. R5 was due to launch 2026-08-21; status unknown from this machine.
- **Farcaster operator crisis (doc 2374):** If POIDH has a Farcaster-based entry flow, the Neynar uncertainty affects it. The weekly video competition spec should note which parts of the submission/verification flow are Farcaster-dependent vs chain-native.
- **ZOL mention-listening (doc 2375):** Doc 2375 covers ZOL picking up @warpee.eth Farcaster mentions. A POIDH submission via Farcaster cast could trigger ZOL's mention router — the two specs should be reconciled so ZOL doesn't duplicate or conflict with the poidh-native submission flow.

## Sources

- [FULL, read in-repo] `zpoidh/rounds/r4/CLOSEOUT.md` - the 16-builders/2-claims funnel collapse, the cancel-instead-of-withdraw incident, the $100 Empire Builder pivot, the 15-builder list
- [FULL, read in-repo] Doc 625 - POIDH x ZAO bounty playbook - prize tiers A-D, solo vs open comparison, 2.5% fee / 102.5% budgeting, 0.001 ETH protocol floor vs 0.005 ETH practical floor
- [FULL, read in-repo] Doc 768 - POIDH bounty best practices - bounty-writing checklist, THE BAR structure, the audio rule, R2 post-mortem (buried dialog, the 91.88s disqualification, 1-of-7 cross-posting)
- [FULL, read in-repo] Doc 2202, Doc 2266 - current-state synthesis and propagation research; album question, Kenny's positioning, poidh-sentinel
- [FULL, read in-repo] Memories `project_poidh_bounty_live` (WTM audition format, single judge, lowercase poidh, Kenny's 4 pre-launch fixes), `project_poidh_judging_arch` (judging page architecture, verdict ladder, ffprobe durations), `feedback_poidh_audio_rule` (the locked audio rule), `feedback_points_are_awarded_manually` (manual award rule), `project_zol_farcaster_agent` (@zolbot, FID 3338501, ~0 followers)
- [FULL, method: direct `eth_call` to Base RPC, 2026-08-17] POIDH v2 contract `0x5555fa783936c260f77385b4e153b9725fef1719` - `MIN_BOUNTY_AMOUNT` = 0.001 ETH, `MIN_CONTRIBUTION` = 0.00001 ETH. Selectors computed via keccak (`0xd5670525`, `0x40650c91`), not guessed. Re-verify with an `eth_call` to those selectors
- [FULL, method: curl + HTML strip, 2026-08-17] [Sweepstakes and Skill Contests - The Basics, Julia C. Archer, Enns & Archer LLP](https://www.ennsandarcher.com/s_basics.html) - prize/chance/consideration framework; "Elimination of the chance element transforms the promotion into a skill contest"
- [FULL, method: curl + HTML strip, 2026-08-17] [What Makes a Promotion a Sweepstakes, a Contest, or an Illegal Lottery, Hank Fasthoff, Fasthoff Law Firm PLLC, 2026-06-08](https://fasthofflawfirm.com/blog/sweepstakes-contests-illegal-lotteries) - the predominant-factor vs material-element tests; "Judging criteria must be specific, documented, and disclosed to participants before they enter"
- [FULL, method: `gh api` + LICENSE file read per Hard Requirement 13] [github.com/0x94t3z/poidh-sentinel](https://github.com/0x94t3z/poidh-sentinel) - MIT (read from LICENSE, not the API classifier field), 4 stars, last pushed 2026-05-03. Community source: autonomous POIDH bounty lifecycle prior art
- [FULL, method: live JSON fetch + parse, 2026-08-17] `https://zpoidh.vercel.app/data/bounty-dashboard.json` - 91 open POIDH bounties platform-wide, `generated_at` 2026-08-17T17:21:06Z; **0** match weekly/recurring/season language; only 2 of 91 carry a populated on-chain deadline field, confirming doc 2202's platform-wide finding
- [FULL, method: ran the script] `zpoidh/scripts/check-eb-sync.py`, 2026-08-17 - Empire Builder `api_endpoint` mismatch, 34 local vs 16 on EB, 18 addresses missing, 4 score mismatches
- [PARTIAL - nav shell only, escalated and replaced] `consumer.ftc.gov/articles/prize-scams` returned HTTP 404 with a navigation shell. Escalated per the fetch ladder to the two law-firm sources above rather than writing from a search snippet
