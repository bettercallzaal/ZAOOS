# 479 — Walden Yan (Cognition) — What's Actually Working in Multi-Agent Systems

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Extract the three proven multi-agent patterns from Walden's April 2026 post and map them onto ZAO OS's agent squad (VAULT/BANKER/DEALER/ROLO/ZOE/ZOEY) + portal bot fleet.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Default topology for ZAO's multi-agent systems? | USE Walden's rule: **writes single-threaded, reads parallel**. One writer agent owns the side-effect (tweet, tx, DB write); all other agents contribute intelligence, never actions. This closes the open issue in `project_agent_squad_dashboard.md` about conflicting agent writes. |
| Add a Code-Review-Loop to `/ship`? | USE — a clean-context reviewer catches an average of **2 bugs per PR, 58% severe** on Devin. Wire it as a second agent in `/ship` using **no shared context** with the coder. This is the single highest-ROI change in this doc. |
| Use the "Smart Friend" pattern (Sonnet calls Opus on tricky moments)? | USE across-frontier (Claude Sonnet ↔ GPT-5 ↔ Opus) not within-family. Walden explicitly says asymmetric small-to-large is still a training problem; cross-frontier routing works today. |
| Use manager-Devin-style delegation for long tasks? | USE for 1-week tasks, SKIP for 1-day tasks. Walden's own data: worked for feature batches (10 PRs), broke on short tasks because manager over-prescribes. |
| Swarm/unstructured networks of agents? | SKIP. "Mostly a distraction." Map-reduce-and-manage is the only shape that scales. |

## Comparison of Options

| Pattern | Walden's verdict | Our fit | ZAO example |
|---|---|---|---|
| Parallel writers (Swarm) | DON'T | Poor | Rejected — matches our own observation in `project_openclaw_setup.md` |
| Single writer + parallel reviewers | WORKS | Excellent | `/ship` + reviewer agent; VAULT tx + BANKER sanity-checker |
| Small primary calling "smart friend" | WORKS cross-frontier only | Good | ZOEY (Sonnet) delegating hard calls to ZOE (Opus) or GPT-5 |
| Manager + children for 10-PR scopes | WORKS with care | Medium | Portal bot fleet: ZOE concierge dispatching to independent brand bots |
| Unstructured swarm | DON'T | N/A | — |

## Walden's Three Patterns In Our Stack

### 1. Clean-Context Reviewer Loop

Maps to our `/review` and `/ultrareview` skills. Action: add a second-agent pass where the reviewer has **never seen the implementation chat**. Feed it only the diff + the spec. Quantified gain in Devin's numbers: 2 bugs/PR caught, 58% severe (logic, edge cases, security). Attention math: attention-head dilution on long coder contexts is the mechanism.

Implementation sketch:
- `src/app/api/` PR created by primary coder (Claude agent with full repo context)
- Reviewer agent spawned with `--clean-context` + spec + diff only
- Primary agent reviews reviewer findings against user instruction (filters "out-of-scope" and "user explicitly asked for X insecurity")
- Today this is roughly what the `santa-method` / `santa-loop` skills already attempt. Upgrade: enforce the no-shared-context rule.

### 2. Smart Friend (Primary → Larger Model)

Maps to the Opus 4.7 / Sonnet 4.6 split already in our toolbelt (see CLAUDE.md model IDs). Action: the smaller agent decides to escalate on **merge conflicts, ambiguous specs, security-adjacent changes**. Walden's note: "Primary always calls smart friend at least once to evaluate trickiness" is a cheap prompt-level rule we can adopt immediately.

Walden's also-important point: the smart friend should **refuse to guess** and instead send the primary to investigate a specific file. Cross-frontier (Claude ↔ GPT-5) works today; small-Sonnet-to-Opus is training-limited.

### 3. Manager + Children for Multi-PR Scopes

Maps to our "10-order branded bot fleet" plan in `project_tomorrow_first_tasks.md`: ZOE concierge (manager) dispatches to per-brand bots (children). Walden's warnings we should pre-empt:
- Manager defaults to over-prescriptive — combat by saying "describe the outcome, not the implementation" in the manager prompt.
- Children assume shared state — force an explicit handoff doc (we use `ws/` branches per terminal, extend to per-child agents).
- Cross-child messages don't happen by default — add an MCP tool `cortex_relationship` (see doc 488) so children can leave notes the manager surfaces.

## Concrete Integration Points

- `src/lib/agents/runner.ts` — add a `reviewer` agent hook after any `writer` agent completes. Single-threaded write guarantee.
- `src/lib/agents/types.ts` — extend the `AgentRole` union with `reviewer | manager | child | smart_friend`.
- `.claude/skills/review.md` and `.claude/skills/ship.md` — add the no-shared-context reviewer pass.
- `community.config.ts` — no change; this is an agent-infra pattern.
- `research/agents/202-multi-agent-orchestration-openclaw-paperclip/` and `research/agents/070-subagents-vs-agent-teams/` — cross-reference and supersede the outdated "swarms are cool" sections.

## Specific Numbers

- **~8x** Devin usage growth in Cognition's largest enterprise segment over the last 6 months.
- **2 bugs per PR** caught by Devin Review, **58%** severe (logic/edge/security).
- **950 tok/sec** SWE-1 (fast sub-frontier) — the model class we'd pair as primary in a Smart Friend setup.
- **200k LOC / 100k LOC / 10k+ iterations** — demo-scale multi-agent systems that worked because they had verifiable success criteria. Real product work does not.

## What to Skip

- SKIP any design that has 3+ agents taking simultaneous write actions. Every demo we've seen of this pattern fragments decisions.
- SKIP "agent council of equals" framings — the winning shape is 1 writer + N read-only contributors.
- SKIP the asymmetric small-to-large Smart Friend until frontier models are trained for it (Walden flags as open problem).

## Sources

- [Walden Yan — Multi-Agents: What's Actually Working](https://cognition.ai/blog/multi-agent-systems)
- [Walden Yan tweet (primary)](https://x.com/walden_yan/status/2047054401341370639)
- [Devin / Cognition](https://cognition.ai/)
- [Anthropic — multi-agent research system blogpost](https://www.anthropic.com/engineering/built-multi-agent-research-system)
