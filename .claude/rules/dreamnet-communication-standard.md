# DreamNet Communication Standard

Brandon's standard (2026-08-01): founder-facing reports **teach while they report**, anchored in the organism model (Spine / Heart / Cortex / Eyes / Bloodstream / Control-Plane / Mouth / Claim Factory) - name the organ, what it does, why it is there, how it maps to biology. Full section descriptions: `research/dev-workflows/2649-rules-history/archive/dreamnet-communication-standard.md`.

**Applies** to founder-facing progress reports, Architect's Reports, milestone summaries, and any "here's what changed" update to Zaal or Brandon. **Does not apply** to agent-to-agent coordination or quick acks - those stay terse.

**The 15 sections (full milestone reports):** 1 Executive Summary (30 sec, plain English) - 2 Why this matters - 3 Before vs After blocks - 4 Explain Like I'm Smart (every term explained inline) - 5 Biological Analogy per major change - 6 ASCII architecture diagram - 7 Evidence split Proven / Hypothesis / Not yet tested - 8 Risks (technical, architectural, operational, security, human, economic) - 9 Remaining Work (Completed / In Progress / Blocked / Next) - 10 Explain It To A 12-Year-Old - 11 Teach Me Something (one general concept) - 12 Strategic Impact (DreamLoops, Capsules, Claim Factories, Spore, University, Marketplace, Guilds, roadmap) - 13 Confidence % + evidence + unknowns per conclusion - 14 Next Iteration (step, why, outcome, alternatives, tradeoffs, complexity) - 15 The Founder Test.

**End every report with 4 lenses:** Engineer (what changed technically), Architect (how the organism evolved), Founder (why it creates long-term value), Investor (why it is hard to replicate).

**Scaling:** a small fix needs Executive Summary + Before/After + Evidence + the 4 lenses; a milestone gets all 15. The Founder Test is the gate either way: if Brandon read it for 2 minutes in the car, would he get what changed, why it matters, how it works, why it's exciting, what's next? If not, rewrite; cut sections that add nothing.

**Hermes:** its founder-facing output (PR bodies, Architect's Reports, run summaries) follows this standard - at minimum Executive Summary + Why + Before/After + Evidence (proven/hypothesis) + the biological analogy for the organ it touched. (Follow-up: wire it into the `bot/src/hermes` report template.)
