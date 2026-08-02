# DreamNet Communication Standard

Brandon's standard (2026-08-01), adopted permanent. The diagnosis: our progress
reports write **engineer-to-engineer** when the primary reader is an intelligent
founder who owns the vision but did not write every line. Reports must **teach
while they report** - the job of a principal engineer / CTO, not a compiler.

**Anatomy is the anchor.** Zaal keeps the whole system in anatomical reference so
he knows what each piece does and where it goes. Every significant change is
explained through the organism model (Spine / Heart / Cortex / Eyes / Bloodstream
/ Control-Plane / Mouth / Claim Factory). Name the organ, say what it does, why
it's there, and how it maps to biology.

## When this applies (and when it does NOT)

- **APPLIES** to founder-facing PROGRESS REPORTS, Architect's Reports, 3-week /
  milestone summaries, and any "here's what changed" update to Zaal or Brandon.
- **Does NOT apply** to agent-to-agent fleet coordination or quick acks - those
  stay dense/terse (`feedback_agent_to_agent_no_fluff`). Different audience,
  different mode. A relay ack is signal; a progress report is teaching.

## The 15 sections (every significant report)

1. **Executive Summary (30 sec):** what changed, 3-8 plain-English sentences, as if
   to a founder/investor/CEO. No jargon unless immediately explained.
2. **Why this matters:** the "so what?" - what problem existed, why it limited the
   organism, what changes now, what new capability opens up.
3. **Before vs After:** an explicit BEFORE block and AFTER block.
4. **Explain Like I'm Smart (not a compiler):** no "deterministic replay-safe lease
   fencing" - say "two workers could grab the same job; the Heart hands out a
   temporary ownership token before work starts, so the second one backs off."
   Every technical term gets explained inline.
5. **Biological Analogy:** for each major change - what changed, why, how it
   resembles biology. The organ metaphor is central, not decoration.
6. **Architecture Diagram:** an ASCII diagram. Pictures beat paragraphs for recall.
7. **Evidence:** tests / receipts / deployments / PRs / benchmarks, split into
   **Proven / Hypothesis / Not yet tested** (ties to `anti-fabrication.md` -
   separate fact from assumption).
8. **Risks:** what can still go wrong - technical / architectural / operational /
   security / human / economic.
9. **Remaining Work:** Completed / In Progress / Blocked / Next - roadmap style.
10. **Explain It To A 12-Year-Old:** the same change in everyday language, zero
    jargon/abbreviations/assumptions.
11. **Teach Me Something:** one general engineering concept (not code-specific) -
    why leases exist, why receipts matter, why replay attacks happen, etc.
12. **Strategic Impact:** how it changes DreamLoops / Capsules / Claim Factories /
    Spore / University / Marketplace / Guilds / the roadmap. Cross-reference.
13. **Confidence:** for each major conclusion - Confidence % + Evidence + Unknowns.
    Never present speculation as certainty (`anti-fabrication.md`).
14. **Next Iteration:** highest-leverage next step + why + expected outcome +
    alternatives + tradeoffs + complexity. Don't stop at status.
15. **The Founder Test:** before sending, ask - "if Brandon had 2 minutes reading
    this in the car, would he get what changed, why it matters, how it works, why
    it's exciting, what's next?" If not, rewrite.

## The DreamNet Translation Layer (end every report with 4 lenses)

- **Engineer:** what changed technically?
- **Architect:** how did the organism evolve?
- **Founder:** why does this create long-term value?
- **Investor:** why is this hard to replicate + why does it raise the platform's value?

Four lenses on the same work forces the report to explain, not just log.

## Scaling (don't turn a one-line fix into a 15-section essay)

Match depth to the change. A small fix: Executive Summary + Before/After +
Evidence + the 4-lens translation is enough. A milestone (a new organ, a stage
closed, a 3-week roll-up): the full 15 sections. The Founder Test is the gate
either way - if it fails, rewrite; if a section adds nothing for this change, cut it.

## Feed it to Hermes

Brandon: "have Claude feed it to Hermes as well." Hermes (the auto-PR pipeline,
`bot/src/hermes`, reused by ZOE) writes PR descriptions + reports too. Its
founder-facing output (PR bodies, Architect's Reports, run summaries) follows this
standard - at minimum Executive Summary + Why + Before/After + Evidence
(proven/hypothesis) + the biological analogy for the organ it touched. Wire the
standard into Hermes's report/PR-body template so autonomous reports teach the
same way. (Follow-up: `bot/src/hermes` report template.)

## Source

Brandon, 2026-08-01 (iMessage + the "DreamNet Communication Standard" spec). Zaal:
"one of the biggest upgrades you can make to Zaal's Claude... this makes Claude
teach while it reports." Siblings: `anti-fabrication.md` (fact vs assumption,
confidence), `feedback_agent_to_agent_no_fluff.md` (the terse mode this does NOT
replace), the organism docs (2170/2171/2175). Anatomy framing: `[[project_brandon_organism_directives]]`.
