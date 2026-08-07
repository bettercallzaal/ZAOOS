---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: 2231, 2230, 2232, 673
original-query: "clawd-clipper -> ZAO content pipeline adopt-spec: the 4-stage select->anchor->judge->copy with hallucination-proof word-level anchoring"
tier: STANDARD
---

# 2237 - clawd-clipper -> ZAO content: adopt the hallucination-proof anchoring

> **Goal:** Spec what ZAO's content pipeline (episodes, Fractal calls, ZAOstock, the
> newsletter) should adopt from clawd-clipper. The standout is an anti-fabrication trick
> that fits ZAO's ethos exactly - and plugs into transcription ZAO already has.

## Grounding (real clone, MIT)

`clawdbotatg/clawd-clipper` (MIT, Austin Griffith), `gh repo clone --depth 1` 2026-08-06.
Read FULL: `src/anchor.ts`, `src/candidates.ts`, `src/judge.ts`. The 4-stage pipeline is
select -> anchor -> judge -> copy. Credit: clawdbotatg/clawd-clipper (MIT).

## The one thing to adopt: hallucination-proof word-level anchoring

The strongest, most ZAO-aligned piece (`anchor.ts:3-7`, `candidates.ts:6-7`):

- The selection model returns **verbatim QUOTES, never timestamps** (`candidates.ts:6-7`:
  "returns verbatim start/end quotes (NOT timestamps ... so the model can't [hallucinate]").
- `anchor.ts` **locates that quote in the word-timed transcript** and recovers the real
  `[start,end]`. "The model never emits timestamps; it copies a snippet, and we locate
  that snippet" (`anchor.ts:5`).
- **A quote that can't be found returns null and the caller DROPS the clip rather than
  guessing** (`anchor.ts:6-7`). Fabrication is impossible by construction - a clip is
  either anchored to real spoken words or it does not ship.
- Hard-won detail (`anchor.ts:13-15`): normalize contractions ("It's" -> "its") or quotes
  with apostrophes silently fail to anchor and drop good clips. Worth stealing verbatim.

This is `anti-fabrication.md` + Proof Drops made into a media primitive: a clip carries
its evidence (the real timestamps of real words) or it doesn't exist. Directly on ZAO's grain.

## Second adopt: the adversarial judge (a quality gate)

`judge.ts:6-19`: a second, INDEPENDENT model re-ranks, shown **only each clip's actual
transcript words - NOT the selection model's title/reason/score** ("can't be anchored by
the pitch"). It's stingy, finds the single biggest reason a clip would flop, and the final
rank BLENDS the two scores (both-like floats up, judge-guts sinks). This is the same
"fresh-context evaluator, no access to the pitch" pattern as `loop-evals.md`'s default-FAIL
evaluator - applied to content. Worth adopting as a clip-selection gate.

## It plugs into what ZAO already has (confirm-before-claiming)

ZAO already produces **word-timed transcripts** via the `/meeting` skill (mlx-whisper,
`whisper-large-v3-turbo`, doc 673) - the exact input `anchor.ts` needs. ZAO has NO clip
miner today (grep found none). So this is additive: `/meeting` (or the episode ingest)
gives the word-timed transcript; the anchoring layer turns model-picked quotes into real,
un-fabricated clip spans. No new transcription dependency.

## Check-alternatives (feedback_check_alternatives_oss_first)

The OSS clip tools from doc 2232 are **generators, not grounded selectors**:
- `mutonby/openshorts` (2.9k stars, **NOASSERTION** license - verify before ANY reuse) and
  `m-hoseyny/teek` (AGPL-3.0, share-alike) are OpusClip-style AI clip GENERATORS - they
  make 9:16 shorts, they do NOT do verbatim-quote anchoring or an adversarial judge.
So they solve a different problem (rendering) and neither has the anti-fabrication trick.
clawd-clipper's PATTERN (MIT) is the thing to adopt; the generators could render the final
cut later if wanted (openshorts only after its license is clarified). Adopt the PATTERN,
not a framework.

## Recommendation (build is PR-only; any publishing of clips is gated)

Adopt the **hallucination-proof anchoring** (verbatim quote -> locate in word-timed
transcript -> drop if unanchorable) + the **adversarial judge** as a ZAO content primitive
that turns a `/meeting`/episode transcript into grounded, evidence-carrying clip spans.
It is on-ethos (anti-fabrication), reuses ZAO transcription, and feeds the clipper/incentive
thread (docs 2232/2233/2234) with a PRODUCTION half whose clips are provably real.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build a ZAO clip-anchor primitive (verbatim quote -> word-timed span, drop-if-unanchorable), mirroring clawd anchor.ts | @Zaal (Claude) | PR | 2026-08-09 |
| Add the adversarial-judge clip gate (independent, words-only, blended score) | @Zaal (Claude) | PR | 2026-08-11 |
| Wire it to `/meeting` + episode transcripts (word-timed input already exists) | @Zaal (Claude) | PR | 2026-08-12 |
| Review in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- **clawdbotatg/clawd-clipper (MIT)** - clone 2026-08-06, read FULL: `anchor.ts`
  (verbatim-quote anchoring 3-7, contraction-norm 13-15), `candidates.ts` (quotes-not-
  timestamps 6-7), `judge.ts` (adversarial re-rank 6-19). [FULL]
- OSS alternatives: `mutonby/openshorts` (NOASSERTION), `m-hoseyny/teek` (AGPL-3.0) -
  generators, no anchoring (doc 2232). [FULL]
- ZAO: `/meeting` skill (word-timed mlx-whisper, doc 673); no existing clip miner (grep). [FULL, in-repo]

## Also See

- [Doc 2232](../../business/2232-whop-clippers-incentives-oss-alternatives/) - the clipper INCENTIVE half; this is the PRODUCTION half.
- [Doc 2230](2230-clawd-scribe-meeting-capture-adopt/) - clawd-scribe -> /meeting (the same anti-fabrication-in-media theme).
