# 483 — r/hermesagent — Nous Research Hermes as a Local-First Agent Framework

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Understand the Hermes agent community's stack, compare against our OpenClaw / ElizaOS / ZOE plumbing, and decide whether to adopt Hermes-class local models for any ZAO agent.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Adopt a Hermes-based local model for any ZAO agent? | USE for **OpenClaw operator pattern only** (see `project_openclaw_status.md`). A local Hermes + Qwen3.6-27B combo on VPS 1 is the cheapest way to keep a per-brand bot running 24/7 without Claude API burn. Do NOT replace ZOE or the frontier-class agents. |
| Pilot model? | USE **Qwen3.6-27B** (the r/hermesagent community thread already shows it running under Hermes with 93 upvotes). Works on VPS 1 specs after swap tuning. |
| Where does Hermes fit vs ZOE? | Hermes = **tool-calling muscle** on local hardware. ZOE = **frontier reasoning** in the cloud. They compose like Walden's Smart Friend pattern (doc 479). |
| Deterministic tool gating? | USE — the r/hermesagent thread "How to stop your Hermes agent from going rogue" flags the same risk we hit in `research/security/` audits: raw API keys in model context. Gate tool execution behind a whitelisted dispatcher. |
| Memory layer? | USE honcho or our own Supabase + Cohere memory (from Matricula, doc 484) before adopting Hermes; Hermes itself ships no memory. |

## Comparison of Options

| Stack | Hardware | Monthly cost | Tool calling | Memory | Fit |
|---|---|---|---|---|---|
| **Hermes + Qwen3.6-27B (local on VPS)** | ~32GB RAM | Server cost only | Native function calling | BYO | Per-brand bot fleet |
| Claude API (Sonnet) via ZOE | N/A | ~$0.50–$5/day per bot | Best-in-class | Our memory layer | Frontier tasks |
| Llama 3.x 70B via Ollama | 64GB+ | Server cost | Decent | BYO | Already too heavy for VPS 1 |
| Mistral Small 3 Instruct | ~16GB | Server cost | Good | BYO | Viable fallback |
| OpenAI GPT-5 via API | N/A | Variable | Excellent | N/A | Cross-frontier Smart Friend (doc 479) |

## How the r/hermesagent Ecosystem Works

Hermes is Nous Research's instruction-tuned model family (Hermes 3, Hermes 4) trained for tool use and agent loops. The subreddit patterns (from the JSON fetch of r/hermesagent):
- **"Hermes Agent Creative Hackathon"** — $25k, 16 days, sponsored by Kimi/Moonshot — indicates active bounty-funded ecosystem.
- **"hermesguide.xyz/ai-m..."** — community has a curated model picker sorted by RAM tier.
- **Deterministic tool gating** is the community's own answer to agent-going-rogue risk (matches our secret-hygiene rule).
- **honcho** used for memory management across Hermes agents.
- **Qwen3.6-27B + root access on a clean Ubuntu server** — the pattern the 93-upvote post validates.

## Concrete Integration Points

- `src/lib/agents/types.ts` — add `Agent.modelClass = 'frontier' | 'local-hermes' | 'local-llama'`.
- `src/lib/agents/runner.ts` — route local-class agents to a VPS 1 endpoint (Hermes + Qwen) and frontier-class to Anthropic.
- `infra/portal/bin/bots/` (see `project_tomorrow_first_tasks.md`) — the 10-brand bot fleet can default to local-hermes to keep API cost bounded.
- VPS 1 setup: reuse the hardening from `project_ao_vps_portal_decision.md`; add an `/api/hermes` reverse proxy.
- `.claude/rules/secret-hygiene.md` — extend to cover local-model tool gating (whitelist + arg validation + no raw key in model context).

## Specific Numbers

- **$25k** — Hermes Agent Creative Hackathon prize pool (16 days, Kimi/Moonshot sponsored).
- **Qwen3.6-27B** — community-recommended local model.
- **93 upvotes** — Hermes + Qwen3.6-27B community validation.
- **~27B parameters** — size threshold where Hermes + quantization + agent loop becomes viable on mid-range servers.
- **honcho** — the memory-management package called out in the community.

## Risks

- LOCAL MODELS LIE DIFFERENTLY — Hermes-tuned models can be confidently wrong on edge cases a frontier would flag. Always pair with a frontier reviewer (doc 479).
- TOOL SAFETY — "raw API keys in model context" is the canonical Hermes footgun. Our `.claude/rules/secret-hygiene.md` already forbids this; audit any Hermes integration before launch.
- ECOSYSTEM CHURN — model names change monthly. Pin versions; don't auto-upgrade.

## What to Skip

- SKIP trying to replace ZOE with Hermes. ZOE's voice is the product; local models will drift from it.
- SKIP the "one Hermes to rule all bots" design. Per-brand bot = per-fine-tune = per-risk surface. Start with 1.

## Sources

- [r/hermesagent](https://www.reddit.com/r/hermesagent/)
- [Nous Research Hermes](https://nousresearch.com/hermes)
- [hermesguide.xyz](https://hermesguide.xyz/)
- [honcho memory management](https://honcho.dev/)
- [Kimi/Moonshot](https://www.moonshot.cn/)
