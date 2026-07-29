---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-28
related-docs: 2103, 2104
original-query: "/zao-research https://www.reddit.com/r/ClaudeAI/s/pOiChDUHGG (SNOWFLOW - a WebGPU game demo Claude Code + Opus 5 built end-to-end; the author shared the implementation-brief prompt pattern)."
tier: STANDARD
---

# 2107 - The implementation-brief prompt pattern for end-to-end Claude Code builds

> **Goal:** Extract the reusable prompt pattern behind SNOWFLOW (a AAA-feeling WebGPU demo Claude Code built end to end) and how ZAO applies it - especially to ZABAL Games demos and build-in-public.

## What it is

A r/ClaudeAI builder shipped **SNOWFLOW** - a browser WebGPU demo (deformable snow, spell lighting, cloth sim, third-person snow-surf) that Claude Code + Opus 5 built **end to end from a single document**, no starter project: planning the architecture, writing the Babylon.js + WGSL systems, profiling performance, iterating from screenshots, and documenting decisions. Cost: **~9 hours, ~4M tokens** (uncached). Live: snowflow-lilac.vercel.app.

The transferable artifact is the **implementation brief** - one document that is simultaneously "the spec, the art direction, and the acceptance criteria." The pattern, not the snow physics, is the value.

## The pattern (what makes it work)

1. **One brief = spec + art direction + acceptance criteria.** The agent is handed a complete, self-contained document and told to "build it end to end." Not a chat of incremental asks - a single source of truth it owns.
2. **A "prime directive" that names the ONE judgment.** SNOWFLOW's: *"Visual quality is the product. A player loads this, walks around for ninety seconds... and either thinks 'this is AAA' or closes the tab. Everything below serves that single judgment."* One crisp success criterion the whole build optimizes toward.
3. **Explicit license to break the spec for the goal.** *"If a requirement in this brief conflicts with making the demo more beautiful, break the requirement. Note the deviation."* This is the key move: it tells the agent to optimize for the actual PRODUCT, not literal spec-compliance, and to log where it deviated - so you get judgment, not malicious compliance.
4. **A visual iteration loop.** The agent iterates from **screenshots** - visual ground truth, not just "does it compile." (This is the same grounding discipline as doc 2103, applied to a visual product: judge against the artifact, not the description.)
5. **Honest about the ceiling.** The author: *"this prompt created the base, but I had to write a lot more prompts to guide Opus further."* The brief bootstraps a strong base; it is not one-shot. Budget for follow-up steering.

## Signal + caveats (from the thread)

- **Opus 5 is notably strong at web 3D / game builds** - multiple commenters echoed it ("really really impressive whenever it has to make a web 3D game").
- **Mixed on general use** - one commenter: *"the dumbest Opus model I've used in at least 12 months"* for their non-game work. Read: excellent for well-specced visual/game builds, opinions vary elsewhere. Match the tool to the task.
- **Cost is real:** ~4M tokens for a ~9h demo. Ambitious end-to-end builds are a token investment, not a quick prompt.

## How ZAO applies it

- **ZABAL Games demos + the minigame port (board #572).** This is the exact recipe for a ZABAL game demo or minigame: write one implementation brief (spec + art direction + "the ONE judgment" + break-rules-for-the-goal), hand it to Claude Code, iterate from screenshots. The build-a-thon can teach this brief pattern as a mentor workshop.
- **Build-in-public content.** The brief itself + the ~9h/4M-token metric is shareable (a "how we built X with Claude Code" post) - fits the ZAO build-in-public ethos and the ZABAL Games audience.
- **General ambitious ZAO builds** (WaveWarZ features, Sparkz surfaces, thezao.com): adopt the **prime-directive + break-rules-for-the-goal** framing on the next big build. Naming the single product judgment up front, and licensing the agent to optimize toward it, is what separates "it followed the ticket" from "it built the thing."
- **Screenshot iteration** is already a ZAO pattern (`/qa`); the brief formalizes it as the acceptance loop.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Write an implementation brief (spec + art direction + prime directive) for the next ZABAL Games demo / the minigame port #572, hand to Claude Code | @Zaal | Build | 2026-08-08 |
| Add the "prime directive + break-rules-for-the-goal + screenshot-iterate" framing to the ZAO Claude Code build playbook (a skill or rule) | @Zaal | PR | 2026-08-08 |
| Consider a ZABAL Games mentor workshop on the implementation-brief pattern (teach the build-a-thon to spec for agents) | @Zaal | Decision | 2026-08-15 |

## Also See

- [Doc 2103](../../agents/2103-grounding-beats-guessing/) - grounding beats guessing (the screenshot-iteration is the same discipline, visual)
- [Doc 2104](../../agents/2104-fleet-coordination-deep-audit/) - fleet coordination (sibling ops doc)

## Sources

- [r/ClaudeAI - "People liked my desert, so here's a waterbending demo!" (SNOWFLOW), Any-Reputation8118](https://www.reddit.com/comments/1v94nal/) [PARTIAL - the intro, prime directive, and both override rules were fetched in full; the long spoilered numbered spec sections could not be retrieved (Reddit blocks WebFetch here and the .json response truncated the spoiler body). The transferable pattern is fully captured; the SNOWFLOW-specific graphics spec is not - see the live demo for the full thing.]
- Live demo: snowflow-lilac.vercel.app (WebGPU-capable browser). [verified present in-thread]
