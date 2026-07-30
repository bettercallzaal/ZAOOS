# Fleet Persona Blocks

Per-brand persona blocks for the ZAO agent fleet (doc 2155 - the per-brand Identity Kit). Each brand identity on the shared runtime wears ONE of these to speak as that brand - NOT a new bot (doc 601), a persona block injected like ZOE's soul blocks ([[project_zoe_soul_architecture]]).

## The one rule: generated FROM the ICM box, never hand-drifted

Each `*.persona.md` here is DERIVED from that brand's ICM box (`research/identity/icm-boxes/<brand>.llm.txt`), which is the upstream source of truth ([[icm-grounding]]). When the brand's truth changes, change the BOX first, then regenerate the persona - never edit the persona in parallel (that is how bios drift). A persona is a distillation of the box for a speaking agent: identity, voice, what it talks about, hard guardrails, and the load-bearing facts.

## How the runtime uses them

An identity in the fleet registry (`bot/src/zoe/identities.ts`, `identities.example.json`) points its `personaRef` at one of these files. The runtime injects the persona so the agent for that brand speaks in-voice and on-fact. Reading is safe; the persona never authorizes an action - outbound (posts/DMs) stays gated to Zaal (doc 2155 guards).

## Present (drafts, ready when a brand is provisioned)

- `wavewarz.persona.md` - live-traded music battles on Solana
- `zabalgamez.persona.md` - the 3-month build-a-thon
- `sparkz.persona.md` - Capsule-first creator monetization ("back the album, not buy a coin")

ZOE itself keeps its existing soul/`human.md` architecture; these are the first brand faces beyond ZOE. Add a brand by writing `<brand>.persona.md` from its box and pointing an identity's `personaRef` at it.

## Source

Doc 2155 (per-brand Identity Kit), the ICM boxes, `icm-grounding.md`. Generated 2026-07-30.
