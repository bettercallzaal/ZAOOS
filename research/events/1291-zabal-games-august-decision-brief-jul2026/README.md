---
topic: events/zabal-games
type: DECISION-BRIEF
status: urgent
created: 2026-07-17
deadline: 2026-08-01
audience: Zaal + Iman (co-founders, ZABAL Games directors)
related-docs: 1259, 1283
---

# 1291 — ZABAL Games August Finals: Decision Brief (Due Before August 1)

> **For Zaal + Iman.** Five decisions that must be locked by August 1 to run August finals. Recommendations included. Doc 1283 has the August mechanics. This doc is the "what do we actually need to decide" layer on top.

---

## State of Play (July 17, 2026)

From doc 1259 (mid-season audit):
- **June:** COMPLETE. 28 workshops, 30+ PRs, 32-person roster. ✅
- **July:** STALLED. 0 recaps, 0 daily-updates entries in the data files. Builder momentum unknown. ⚠️
- **August:** PENDING. 0 finalists locked. finals.json is empty. Window dates not set. Prizes not defined. ❌

**Risk:** If decisions aren't made by August 1, the August finals window becomes unfeasible and ZABAL Games Q3 ends without a culminating event.

---

## The 5 Decisions

---

### Decision 1: August Finals Window (DATES)

**What needs to be decided:** The exact start and end dates for August finals submissions and judging.

**Context from doc 1283:** August mechanics call for a "finals window" during which builders submit final projects, judges review, and community votes.

**Recommendation:**
- Finals submission: **August 4–10, 2026** (first full week of August)
- Judging period: **August 11–17, 2026**
- Winners announced: **August 18, 2026** (Fractal session or dedicated announcement)
- Buffer before August ends for any disputes: 2 weeks

**Why this window:** Gives builders 3 weeks from now (July 17) to complete projects. Gives enough time for Fractal-based judging before end of month.

**What you need to do:** Set dates in the ZABAL Games calendar. Update finals.json with `window_start` and `window_end`.

---

### Decision 2: Who Are the Finalists? (ROSTER)

**What needs to be decided:** Which of the 32 June builders are advancing to August finals, and how that's determined.

**Context:** In June, 32 builders enrolled. Not all may have remained active through July. finals.json currently has an empty `finalists` array.

**Options:**

| Option | Description | Tradeoff |
|--------|-------------|---------|
| A: All active builders | Anyone who has submitted a PR since June 1 qualifies | Inclusive, but may have low-quality submissions |
| B: Self-selection | Builders opt in to finals by August 1 deadline | Filters for committed builders; risk of low count |
| C: Curator selection | Zaal + Iman review July activity and select top 15-20 | High quality floor, but work required |
| D: Hybrid (B + C) | Self-selection first, curators fill gaps to hit minimum | Balanced |

**Recommendation:** Option B (self-selection) with a minimum of 10 finalists required. If under 10 self-select, add top July contributors via curator review.

**What you need to do:** Send a message to the ZABAL Games Discord/Telegram: "August Finals are on. Submit your project pitch by July 28 to be a finalist." Track responses. Update finals.json.

---

### Decision 3: Judging Format (MECHANISM)

**What needs to be decided:** How winners are chosen — community vote, expert panel, Fractal Respect-weighted vote, or a combination.

**Context from doc 1283:** ZABAL August mechanics include a community judging component.

**Options:**

| Option | Description | Tradeoff |
|--------|-------------|---------|
| A: Fractal Respect-weighted | Use existing weekly Fractal votes as the judging round | Most onchain, fully ZAO-native |
| B: Expert panel | 3-5 judges (Zaal, Iman, + 3 outside experts) score submissions | Higher quality signal, requires recruiting judges |
| C: Community poll | Snapshot vote open to all ZABAL holders (351 holders) | Broadest participation, gameable |
| D: Hybrid A + B | Expert panel scores 50%, Fractal Respect-weighted 50% | Balanced, more complex to run |

**Recommendation:** Option D (hybrid). Expert panel gives credibility. Fractal Respect-weighting rewards community members who've been active all season.

**What you need to do:** Identify 3 outside judges (music-tech founders, DAO operators, or artists). Ask them by July 24.

---

### Decision 4: Prize Structure (INCENTIVES)

**What needs to be decided:** What finalists win and how prizes are distributed.

**Context:** prizes.json is currently empty. From doc 1283: ZABAL token allocation is the primary prize mechanism.

**Options:**

| Place | Option A (ZABAL only) | Option B (ZABAL + SOL) | Option C (ZABAL + SOL + spotlight) |
|-------|----------------------|----------------------|-----------------------------------|
| 1st | 500K ZABAL | 500K ZABAL + 1 SOL | 500K ZABAL + 1 SOL + COC #8 performance slot |
| 2nd | 250K ZABAL | 250K ZABAL + 0.5 SOL | 250K ZABAL + 0.5 SOL |
| 3rd | 100K ZABAL | 100K ZABAL + 0.25 SOL | 100K ZABAL + 0.25 SOL |
| Honorable mentions (up to 5) | 25K ZABAL each | 25K ZABAL each | 25K ZABAL each |

**Recommendation:** Option C for 1st place (COC #8 performance slot is high-value and costs nothing). Option B for 2nd + 3rd. Option A for honorable mentions.

**What you need to do:** Confirm treasury has ZABAL and SOL for prizes. Confirm COC #8 date for the performance slot promise. Update prizes.json.

---

### Decision 5: What Counts as a Submission? (SCOPE)

**What needs to be decided:** The criteria for what a valid finals submission is — what form it takes, how it's submitted, what it must include.

**Context:** Builders have been working on diverse projects: analytics tools, Farcaster mini-apps, governance bots, music platforms, agent tools.

**Recommended submission requirements:**

1. **GitHub repo** with at least 5 commits in August (or since June 1)
2. **2-minute demo video** or live demo
3. **One-paragraph project description** (what it does, who it's for, why it matters to ZAO)
4. **Battle stats integration** (optional bonus: uses wavewarz.info API or wwtracker data somehow)

**What you need to do:** Publish the submission format to the ZABAL Games Discord/Telegram by July 22. Update the ZABAL Games data files with `submission_format` details.

---

## Action Checklist (by date)

| By | Action | Owner |
|----|--------|-------|
| Jul 20 | Lock August finals window dates (Aug 4-10 submissions, Aug 11-17 judging, Aug 18 announcement) | Zaal |
| Jul 20 | Publish submission format to Discord/Telegram | Iman |
| Jul 22 | Identify and invite 3 outside judges | Zaal + Iman |
| Jul 24 | Confirm judges have accepted | Zaal |
| Jul 24 | Confirm prize treasury (ZABAL balance, SOL amount, COC #8 slot) | Zaal |
| Jul 28 | Finalist self-selection deadline (ask builders to opt in) | Iman |
| Aug 1 | Lock finalist list, update finals.json | Zaal + Iman |
| Aug 4 | Open submission window | — |
| Aug 10 | Close submission window | — |
| Aug 11-17 | Judging period (panel + Fractal vote) | Judges + community |
| Aug 18 | Announce winners at Fractal session | Zaal |

---

## What Happens If We Skip This

If August finals don't happen:
- 32 builders have no culminating event for their June work
- The ZABAL Games narrative collapses (built up for 3 months with no payoff)
- Potential builder churn from the cohort
- Missed grant/press hook ("first DAO-run music-tech build-a-thon with onchain prizes")

The upside of running even a minimal finals (self-select + community vote + small ZABAL prizes) far outweighs the risk.

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1259 | ZABAL Games mid-season audit — June complete, July stalled, August empty |
| doc 1283 | ZABAL Games August mechanics (what's planned) |
| doc 1285 | ZAOstock permit call (separate urgent item, same week) |
| doc 1289 | Grant tracker (ZABAL Games is fundable angle for grants) |
