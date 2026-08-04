---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-08-04
superseded-by:
related-docs: 2191, 2174, 928
original-query: "zao-research this newsletter as well - AI For Humans (Gavin Purcell), 2026-08-04: computer-use agents actually work now, OpenAI Astra math breakthroughs, Seedance 2.5, Hank Green AI controversy, Karpathy's Claude Opus 5 Lord of the Rings three.js build"
tier: STANDARD
---

# 2192 - AI For Humans: the computer-use shift + Karpathy's long-horizon test

> **Goal:** Synthesize the 2026-08-04 AI For Humans newsletter and pull the two threads that matter for ZAO - (1) computer-use agents crossed from "sucks" to "works," validating the self-driving desktop direction; (2) Karpathy's Opus 5 experiment shows LLMs now sustain long-horizon builds, which is exactly the agent-spawning bet.

## Key decisions (for ZAO)

1. **The self-driving desktop direction is validated by the industry** - keep building it. Gavin Purcell (a mainstream AI creator, not a researcher) reports ChatGPT's Computer Use in the new desktop app now does real, tedious, multi-step web tasks well (he fixed a scrambled YouTube "show" order and "got three hours back"). This is the exact pattern our Windows desktop brain + Claude-in-Chrome automation already do - the mainstream just caught up. USE this as external validation, not a prompt to switch tools.
2. **Keep the human gate on anything irreversible - the newsletter says the same.** Gavin: "Would I trust it with something I couldn't easily redo? NO. NOT ON YOUR LIFE." His advice - "point one at something annoying and reversible" - is our exact rule (gated: spend/publish/outbound/on-chain; autonomous: research/drafts). Our discipline is the mainstream best practice.
3. **Karpathy's test is the agent-spawning thesis in one datapoint.** Opus 5, given the first paragraph of LOTR + a ~1M-token (~$10) budget, ran ~2 hours and wrote ~5,500 lines of Three.js that procedurally rendered the scene ("janky but fun," playable at karpathy.ai/lotr-movie). His line - "LLMs have all the stamina and patience in the world" - is precisely why long-horizon spawned agents (doc 2191) are worth building: the model will grind a bounded task to completion. The gap he flags (visual/scene composition still weak) is why our validation gate + human review stay non-negotiable.

## Findings

| Item | What (as reported) | Why it matters for ZAO |
|---|---|---|
| **ChatGPT Computer Use** | The old Codex app is now the ChatGPT desktop app (Mac + Windows); Atlas (standalone browser) is being sunset, its brain folded in. Computer use takes the mouse/keyboard, reads the screen, does email/spreadsheets/files. "It WORKS now." | Mirrors our desktop self-driving brain + `/browse` + Claude-in-Chrome. External proof the pattern is real; the differentiator is our gating + fleet, not the capability. |
| **OpenAI Astra** | An internal build reportedly solved 10 previously-unsolved math/theoretical-CS problems (sphere packing, Ramsey numbers, lattice crypto); ~$2,000 total compute. As-reported; not independently verified here. | Capability is still rising fast - budget for models getting materially smarter each cycle; do not over-fit the fleet to today's ceiling. |
| **Seedance 2.5** (ByteDance) | Live outside the US (Dreamina + Volcano Engine API): native 30s generations, up to 50 reference inputs, native 4K, post-gen subject-swap. No US date (copyright). | AI video maturing; relevant to ZAO content/media (ZM, WaveWarZ) when a US-available equivalent lands. |
| **Hank Green AI "controversy"** | A stray "I appreciate the pushback" ChatGPT line left in a script triggered a fan revolt; he says it was research-only, not writing. | Build-in-public lesson: even the most defensible AI use (research) can trigger backlash if it reads as hidden. Be transparent about AI use, which ZAO already is. |
| **Karpathy x Opus 5 LOTR** | 1 paragraph -> ~5,500 lines Three.js in ~2 hrs on ~1M tokens (~$10); playable at karpathy.ai/lotr-movie. A new "vibe test" beyond the pelican-on-a-bicycle. | The long-horizon-agent datapoint. Validates spawning bounded, long-running build agents (doc 2191) - and the honest limit (composition still janky) validates our critic/validation gate. |

## Also See

- [Doc 2191](../2191-zoe-agent-spawning-and-validation/) - ZOE agent-spawning + validation (the build this newsletter validates)
- [Doc 2174](../2174-*/) - desktop migration / bidirectional relay (the self-driving desktop)
- [Doc 928](../928-agent-loop-best-practices/) - agent-loop best practices (the gating discipline)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add "computer-use agent (ChatGPT/Claude desktop)" as a standing topic in the desktop learning loop | @Zaal | Bot task | 2026-08-07 |
| When a US-available AI video model with post-gen subject-swap lands, evaluate for ZM/WaveWarZ content | @Zaal | Research | 2026-09-01 |
| Keep the transparency line in build-in-public posts (AI-use disclosed) - Hank Green lesson | @Zaal | Ongoing-policy (already practiced) | 2026-08-04 |

## Sources

- AI For Humans newsletter, 2026-08-04 (Gavin Purcell) - `[FULL]` (pasted in full by Zaal; primary source). Secondary reporting of Astra/Seedance/Karpathy claims - treat item-level claims as as-reported.
- [Andrej Karpathy on X - the Opus 5 LOTR test](https://x.com/karpathy/status/2083749667410727319) - `[FULL]` (tweet text verified via search)
- [Karpathy playable build - karpathy.ai/lotr-movie](https://karpathy.ai/lotr-movie) - `[PARTIAL]` (referenced across sources; not rendered here)
- [The Decoder - Karpathy's next AI vibe test](https://the-decoder.com/unicorn-pelican-middle-earth-openai-co-founder-karpathy-is-looking-for-the-next-ai-vibe-test/) - `[FULL]`
- [Benzinga / TradingView - Karpathy Opus 5 3D LOTR](https://www.benzinga.com/markets/tech/26/08/60861644/andrej-karpathy-says-ai-has-moved-beyond-simple-prompts-after-claude-opus-builds-3d-lord-of-the-rings-world) - `[FULL]`
