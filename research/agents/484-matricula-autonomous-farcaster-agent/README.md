# 484 — Matricula — Autonomous Self-Improving Farcaster Agent (@matricula)

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Study evaaliya/Matricula's 4-layer self-improvement loop + energy budget + 3-goal KPI system; decide which pieces feed into ZAO's ZOE / ROLO / portal bot fleet.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Should ZAO adopt Matricula's 4-layer loop? | USE — Action → Metrics → Reflection → Strategy is the cleanest self-improvement loop we've seen for a single-writer Farcaster agent. Maps directly to what ZOE already needs (per `project_zoe_v2_redesign.md`). |
| Energy manager (token-cost budget with High / Medium / Low modes)? | USE — matches ZAO's `$0.50/day` per-bot budget target in `project_tomorrow_first_tasks.md`. Adopt Matricula's literal tiers: >70% = full power; 30–70% = selective; <30% = survival. |
| 3-goal KPI scoring (Influence / Patron / Treasury)? | USE a ZAO-shaped variant — for agents posting on behalf of a brand: **Reach / Relevance / Revenue**, each 0–100, lowest-score goal gets priority. |
| Memory stack (Supabase + Cohere embeddings)? | USE — we already have Supabase with pgvector. Cohere `embed-english-v3.0` is free-tier (1024 dims). Drop-in for the agent squad. Alternative: CORTEX (doc 488) if we want the hippocampal/dream-cycle features. |
| Fork for our bot fleet? | SOFT FORK — rewrite in TypeScript to match `src/lib/agents/` instead of Python; keep Matricula's architecture. Attribute MIT. |
| Tipping ETH on Arbitrum? | SKIP for now. Adds legal/ops surface. Revisit after ZAO Music legal thread (`project_zao_music_entity.md`) settles. |

## Comparison of Options

| System | Self-improvement | Energy budget | Goal scoring | Memory | Language |
|---|---|---|---|---|---|
| **Matricula (evaaliya)** | 4-layer loop, reflection.py | Daily Claude budget $0.50 | 3 goals × 0–100 | Supabase + Cohere pgvector | Python 3.11 + Node |
| Our current ZOE | Partial — no reflection layer | Per-request logs only | Ad hoc | Supabase (no embeddings) | TypeScript |
| ElizaOS | Action-reaction, no reflection | None native | None | Multi-backend | TypeScript |
| OpenClaw + Paperclip | Harness only, not self-improving | Yes | None | Per-agent | Shell + Docker |
| Agent Zero | Reflection native | Session-scoped | None | Vector DB | Python |

Matricula sits where ZAO actually needs to operate: small, cheap, public-facing, with accountable goals. Adopt its design; keep our TS stack.

## The 4-Layer Loop In Our Stack

| Matricula layer | Module | Our analog | Action |
|---|---|---|---|
| 1: Actions | `agent_loop.py` (Post → Notify → Engage) | `src/lib/agents/runner.ts` | Extend runner with explicit 3-step cycle |
| 2: Metrics | `engagement_tracker.py` | None yet | NEW file: track likes/replies/recasts per cast |
| 3: Reflection | `reflection.py` (Claude analyzes own performance) | None yet | NEW — nightly Claude call compares top vs bottom |
| 4: Strategy | `decision_engine.py` (learned rules injected into prompt) | `src/lib/agents/types.ts` | Add `learnedRules: string[]` per agent |

## 3-Goal KPI Adaptation

| Matricula goal | ZAO version | How scored |
|---|---|---|
| Influence (followers / eng rate / mentions) | **Reach** — Farcaster channel impressions, casts, recasts | Neynar API |
| Patron (strategic spend / dev connections) | **Relevance** — DMs from verified ZAO members, channel-fit | XMTP + member table |
| Treasury (wallet balance / runway) | **Revenue** — ZABAL distribution, SANG staking, tips | Supabase + onchain |

Lowest score = current priority. Injected into the agent's system prompt.

## Energy Manager — Copy Verbatim

```
🟢 High (>70%): full power — experiments, long posts, feed scan
🟡 Medium (30–70%): focused engagement only
🔴 Low (<30%): survival — skip reflection, skip feed, short replies
```

Tracks every Claude API call (input + output tokens → $). Daily budget: **$0.50**, configurable.

## Concrete Integration Points

- `src/lib/agents/runner.ts` — implement the 3-step cycle and the energy tiers.
- `src/lib/agents/types.ts` — add `EnergyBudget`, `GoalScore`, `LearnedRule`.
- `scripts/stock-schema.sql` (see the working tree) — precedent for adding domain tables; create `agent_memories` with pgvector 1024-dim.
- `src/app/api/agents/` — add `POST /api/agents/reflect` nightly cron endpoint.
- `.claude/rules/` — add `rules/agent-safety.md` with the Matricula safety limits (30 casts/day, 0.00005 ETH/tx, 0.001 ETH/day, bot score <0.2 skip).
- `research/agents/070-subagents-vs-agent-teams/` — cross-ref.

## Specific Numbers

- **4** layers in the self-improvement loop.
- **3** goals scored 0–100 each.
- **30** casts/day max.
- **$0.50/day** Claude budget.
- **0.00005 ETH (~$0.01)** max single tip.
- **0.001 ETH (~$0.30)** max daily tip spend.
- **<0.2** Neynar bot score → skip user.
- **1024** embedding dimensions (Cohere `embed-english-v3.0`).
- **FID 3319769** — @matricula's Farcaster FID.
- **2 verified wallets** — custody + Privy.

## What to Skip

- SKIP importing @matricula's personality prompt verbatim. Our bots follow `community.config.ts` brand voice.
- SKIP Python. We're a TypeScript house.
- SKIP the tipping chain (Arbitrum) for MVP; add after legal review.

## Sources

- [github.com/evaaliya/Matricula](https://github.com/evaaliya/Matricula)
- [Matricula README](https://github.com/evaaliya/Matricula/blob/main/README.md)
- [Cohere embed-english-v3.0](https://docs.cohere.com/docs/embed-v3)
- [Neynar v2 API](https://docs.neynar.com/)
- [Privy Agent Wallet](https://docs.privy.io/guide/server-wallets)
