---
topic: agents
type: comparison
status: research-complete
last-validated: 2026-07-05
superseded-by:
related-docs: 601, 759, 907, 969
original-query: "look at our overall agent tooling vs other people's agents"
tier: DISPATCH
---

# 972 - ZAO Agent Stack vs the Field (mid-2026)

> **Goal:** Honest comparison of ZAO's agent tooling against the 2026 frontier (web3/Farcaster agents + the broader dev-agent landscape), with a ranked adopt-list.

## Method + a caveat on numbers

Two parallel research agents ran (July 2026): one on the web3/Farcaster agent landscape, one on dev/personal agent-tooling SOTA. The **patterns** below are corroborated across sources. Specific vendor market stats the agents reported (daily volumes, GitHub-star counts, "$Xb market cap", "1B agents by EOY") are **agent-reported and NOT independently verified** - they are directionally indicative only and are deliberately kept out of the load-bearing claims. Verify before quoting any figure externally.

## Correction (verified in ZOE code, 2026-07-05)

After this doc was drafted from the two research agents (no code access), the actual ZOE code was read. **Two of the three "top-3" already exist and are NOT gaps:**
- **Multi-model routing EXISTS** - `concierge.ts` uses `selectModel()` routing haiku (quick) / sonnet (default) / opus (hard). Default is **sonnet**, so ZOE is already cost-conscious. The "~91% Opus" figure was THIS terminal's Claude Code usage, not ZOE's.
- **Self-improvement EXISTS** - `reflexion.ts` is scheduled (evening reflection -> memory patches).

The one **real** gap was cost/token observability (`call-budget` counted calls, not spend). **Shipped in PR #1097** (`cost-ledger`). The remaining items (shared cross-surface state, evals, omnichain, agent-token economics) stand.

## Verdict

ZAO's agent **architecture** is top-decile - ahead of nearly every solo builder. The gaps are not architectural; they are **operational** (observability, cost control, self-improvement) plus a few deliberate **strategic forks** (agent-token economics, omnichain) that collide with ZAO's stated ethos and are Zaal's call, not defaults.

The real moat is not the framework (ElizaOS/Eliza is open-source and cloneable). It is ZAO's **specialization** (music / culture / governance), **community**, **build-in-public credibility**, and **self-hosted independence** (own Farcaster signer, own fleet, no hosted-platform dependency).

## Our stack (the baseline being compared)

- **Orchestration:** Claude Code, Opus-heavy - skills, subagent fan-out, `/loop`, cloud `/schedule` crons, cross-terminal handoffs (see [[601]] for the cleanup that produced the current shape).
- **Live fleet (VPS):** ZOE concierge + ZAO Devz (Coder+Critic) + ZAOstock + Cowork bots; ZOL Farcaster agent on the Pi.
- **Autonomy:** ecosystem-watch, 3 ZOE daily cloud crons, the research-radar (added 2026-07-05), ZOL casting to /zabal.
- **Memory:** ZOE Letta-style 4-block memory (doc 759) + the Bonfire knowledge graph.
- **On-chain:** VAULT/BANKER/DEALER trading agents; self-hosted signer.
- **Multi-surface:** Telegram + Farcaster + X/Bluesky/Lens via `src/lib/publish/` (doc 969 per-platform).

## Scorecard vs the 2026 frontier

**Ahead of ~90% of builders:**
- Graph memory + Letta blocks (Bonfire + ZOE) - most run vector memory at best.
- Hierarchical multi-agent (concierge + workers + critics) - this IS the 2026 best-practice shape.
- Verification / adversarial loops baked in (Devz Coder+Critic, Hermes, audit swarms).
- HITL on writes (draft->approve, PR-only) - the field calls this non-negotiable; ZAO already does it.
- Self-hosted signer + multi-surface presence - no Virtuals/hosted dependency.

**Real gaps (both research lanes converge here):**

| Gap | Why it matters | Fit |
|-----|----------------|-----|
| Observability / cost + evals | Hit a weekly usage cap 2026-07-05; blind on spend AND agent quality. Clearest frontier miss. | high |
| Multi-model routing | ~91% of turns are Opus. Field routes cheap/mid/frontier by task complexity (reported 40-60% savings). ollama + Sonnet already available. | high |
| Shared cross-surface state | The "3 ZOEs" problem - VPS bot, cloud crons, and terminal do not share memory. The 2026-07-05 ZOE-inbox bridge is step 1. | high |
| Self-improvement loop | Extend the Hermes run->observe->consolidate->reuse pattern to ZOE. The `feedback_*` memory loop exists but is not systematized. | med |
| Omnichain | Field trends multi-chain; ZAO is Base+ETH. WaveWarZ is already Solana - the wedge exists. | med |
| Agent-token economics | The field's monetization moat, BUT collides with ZAO's tokenless / Respect ethos. Philosophy call, not a gap. | Zaal's call |

## Recommended adopt-list (ranked by value x fit)

**Top 3 - high value, high fit, address real pain:**
1. **Multi-model routing in ZOE** - route classify->Haiku, drafting->Sonnet, hard reasoning->Opus. Directly fixes the cost/quota pain. Biggest immediate ROI.
2. **Cost + usage observability** - log model/tokens/cost per agent + action; a simple dashboard. Cannot optimize spend you cannot see.
3. **Systematize the Hermes self-improvement loop into ZOE** - turn ad-hoc `feedback_*` memories into reusable agent rules.

**Deliberate bets (not gaps to panic over):** eval/regression suite; memory auto-consolidation (periodic summarization to prevent drift); shared-state unification of the 3 ZOEs; omnichain (Solana, via the WaveWarZ wedge); agent-to-agent comms.

## The one strategic fork: agent-token economics

The field is monetizing agents (agent-owns-a-token, revenue splits, agent marketplaces). This is real and is where the field's "moat" talk points. It **cuts against ZAO's deliberate tokenless / Respect-based model.** Do not adopt by default. Worth a dedicated founder conversation weighing the Respect ethos against the monetization upside - out of scope for this doc.

## Also See

- [[601]] - agent stack cleanup decision (the current fleet shape)
- [[759]] - ZOE orchestrator locked (8 workers, 3 critics, 4-block memory)
- [[969]] - per-platform context profiles
- [[907]] - Agent Fleet Dashboard decision (covers the observability/cost adopt-item)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Prototype multi-model routing in ZOE (Haiku classify / Sonnet draft / Opus reason) and measure token-cost delta | @Zaal | PR | 2026-07-19 |
| Add per-agent cost+token logging + a simple spend view | @Zaal | PR | 2026-07-19 |
| Systematize `feedback_*` memories into reusable ZOE rules (extend Hermes loop) | @Zaal | PR | 2026-07-26 |
| Decide agent-token economics vs Respect/tokenless ethos (founder call) | @Zaal | Decision | 2026-07-31 |

## Sources

Web3 / Farcaster landscape + dev-agent SOTA (agent-gathered, 2026-07-05; market stats unverified):
- ElizaOS / Eliza (ai16z) - de-facto web3 agent framework, plugin ecosystem
- Virtuals Protocol - tokenized agent deployment ("Shopify of AI agents")
- Autonolas (Olas) - multi-agent DeFi coordination, Mech Marketplace
- Clanker / Aethernet / AIXBT / Bracky / Bankr - Farcaster-native agent archetypes (token launch, market signals, betting, DeFi)
- https://alexop.dev/posts/understanding-claude-code-full-stack/ - Claude Code (MCP, skills, subagents) 2026
- https://composio.dev/content/openai-agents-sdk-vs-langgraph-vs-autogen-vs-crewai - framework comparison
- https://vectorize.io/articles/mem0-vs-letta - agent memory (Letta / MemGPT 3-tier)
- https://www.digitalapplied.com/blog/multi-agent-orchestration-patterns-producer-consumer - orchestration patterns
- https://o-mega.ai/articles/self-improving-ai-agents-the-2026-guide - self-improvement loops
- https://mlflow.org/articles/what-is-agent-observability-a-2026-developer-guide/ - agent observability
