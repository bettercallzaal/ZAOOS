---
topic: business
type: decision
status: needs-zaal-approval
last-validated: 2026-07-30
related-docs: 1501, 1255, 1466, 682
original-query: "Board #49: ZABAL Gamez August prep for Saturday - concept (August = the July submitters) + ALL format options, website page draft, Saturday announcement copy (FC/X/YT) + rollout"
tier: STANDARD
---

# 2137 - ZABAL Games August Finals: concept, format options, page draft, announcement (board #49)

> **Goal:** Everything Zaal needs for the Saturday (2026-08-01) announcement: the concept locked in one line, every format option on the table with a recommendation, a deployable website page draft, and the announcement copy per platform. Announcement is PUBLIC = Zaal approves and posts; nothing here auto-publishes.

## The concept (one line)

**August is comprised of the July submitters.** Everyone who submitted anything in July - any format, partial counts (per the zabalgamez ICM box) - IS the finals pool. No new application, no gate. July was the open door; August is what the people who walked through it do next.

Why this is right:
- It makes July submission retroactively valuable ("you're already in") - the strongest possible close to open-build month.
- Zero-friction pool selection: the submissions board at zabalgamez.com/submissions already IS the list.
- It rewards action over polish, which is the ZABAL ethos (partial and WIP drafts counted all July).

## The locked baseline (Zaal, 2026-07-28)

Already decided in the zabalgamez terminal (memory: project_zabal_games_august_pipeline), restated here as the plan of record:

- **Weeks 1-2 - OPEN QUALIFIER:** every July submitter is on the leaderboard. Builders post a DAILY project update to earn points; the Farcaster community votes. Points + votes combined pick the **top 2 per track**.
- **Weeks 3-4 - BATTLE:** top 2 per track go head-to-head, one round per week.
- **3 tracks:** artist / builder / creator.
- **Settlement:** multi-factor (3-5 factors), WaveWarZ-Solana as ONE input, not the sole decider (doc 1255 protocol).
- Build order in flight: standings view -> season-points ledger -> settlement scorer (weights TBD with Sam + Arthur).

## ALL format options (the knobs still open + the alternatives considered)

### Knob 1 - qualifier scoring weight (daily-update points vs Farcaster votes)

| Option | Weight | Pro | Con |
|--------|--------|-----|-----|
| A | 70 points / 30 votes | Rewards consistent building; hard to sybil | Community feels less heard |
| B (recommended) | 50 / 50 | Clean story ("half your work, half the community"); easy to announce Saturday | Needs the anti-gaming knob solved |
| C | 30 / 70 | Maximum community energy + reach | Vote-brigading decides finals |

**Recommendation: B**, announced as "half from your daily updates, half from the community" - simplest sentence, defensible, and the anti-gaming fix (knob 2) covers its weakness.

### Knob 2 - vote anti-gaming

| Option | Mechanism | Pro | Con |
|--------|-----------|-----|-----|
| A (recommended) | 1 vote per FID per project per week | Trivial to implement + explain | A determined sybil can still farm FIDs |
| B | Respect-weighted votes (ZAO Respect holders weigh more) | Aligns with the fractal governance stack | Excludes new community; contracts dependency (doc 1255 TBD) |
| C | Quadratic by FID age | Punishes fresh accounts cleanly | Complexity nobody can explain in a cast |

**Recommendation: A for the qualifier now, B as a stated upgrade** once Respect weights lock with Sam + Arthur - announce A Saturday, do not block on contracts.

### Alternative formats (considered, not recommended - kept for the record)

1. **Pure daily tournament** (the original 2026-07-18 baseline): daily repo battles, percentile-rank points, monthly tournament, mentors support weekly top 8. Superseded by the two-phase design because a fresh daily pool ignores the July submitters (the concept), and percentile-of-the-day scoring never accumulates a season story.
2. **Jury-only finals** (8 mentors pick 8 finalists, doc 682 original sketch): cleanest to run, but zero community involvement and no build-in-public pressure - drops the daily-update engine that generates August content.
3. **Single mega-battle** (all submitters in one WaveWarZ-settled event): maximal spectacle, but one settlement event cannot fairly compare 3 tracks, and doc 1255 explicitly moved to multi-factor settlement to avoid exactly this.
4. **Async showcase close** (doc 1501 Option C, each completer ships a 1-page doc): right for the S1 WORKSHOP cohort close, too quiet for the Games finals - these are complementary, not competing (the S1 close can run in parallel per doc 1501).

## Deliverables in this doc

| File | What | Zaal's action |
|------|------|---------------|
| `website-page-draft.html` | Standalone dark-theme page: concept, timeline, how scoring works, CTA to the submissions board | Deploy to zabalgamez.com (route suggestion: /august) |
| `announcement-copy.md` | Saturday copy: Farcaster (+/zabal channel), X, YouTube community post + rollout schedule | Approve, edit voice where needed, post via Firefly (FC+X combined) |

## Rollout (Saturday 2026-08-01)

1. **Morning (9-10am ET):** Farcaster cast in /zabal + main feed (Firefly posts FC + X together per feedback_firefly_only).
2. **Midday:** YouTube community post (@bettercallzaal) pointing at the page + the Saturday stream if one runs.
3. **In the groups:** Telegram ZAO GC + Discord ZABAL channel copy (in announcement-copy.md) - short, links to the page.
4. **The page is the anchor:** every post links zabalgamez.com/august (or wherever Zaal deploys the draft). The submissions board stays the single source of the pool.
5. **Week 1 kicks off Monday 2026-08-03:** first daily-update day; standings page (in flight on branch claude/zabal-august-finals-obaj97) becomes the live scoreboard.

## Open questions for Zaal (do not block the announcement)

1. Confirm knob 1 = 50/50 and knob 2 = 1-vote-per-FID (the copy assumes both; both are one-line edits if changed).
2. Month-end payoff wording: the copy says "finalists battle on stream, winner crowned end of August" - if there is a prize/pool beyond status + mentorship, name it before posting (no invented rewards per anti-fabrication).
3. Whether the Saturday YouTube post rides an actual stream or is a text-only community post.

## Sources

- Memory: project_zabal_games (arc, naming), project_zabal_games_august_pipeline (LOCKED 2026-07-28 format + open knobs) [FULL]
- research/identity/icm-boxes/zabalgamez.llm.txt - canonical box copy in-repo (live useicm fetch FAILED from this sandbox - box content taken from the repo copy, which is the source of truth for edits) [FULL]
- Doc 1501 (S1 finals brief), doc 1255 (WaveWarZ battle protocol for August), doc 682 (ZABAL Games origin) [FULL]
