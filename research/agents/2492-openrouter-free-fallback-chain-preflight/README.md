---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-15
superseded-by:
related-docs: 2490, 2210, 761
original-query: "wheres our research on the models and what attabotty shared with us fallback-chain-openrouter-free.md whats next on this"
tier: STANDARD
---

# 2492 — The OpenRouter free fallback chain attabotty shared: 0 of 15 live, what replaced it, and the preflight that stops it rotting again

> **Goal:** Record what was in the July fallback chain, measure how much of it still exists, name the corrected chain now applied to Hermes, and say what happens next so a free-model list is never trusted from memory again.

## Key Decisions

| # | Decision | Why (measured 2026-09-15) |
|---|---|---|
| 1 | **Never implement `fallback-chain-openrouter-free.md` as written.** | Its `hermes config set` line, the part anyone copies, is **0 of 15** live model IDs. Its table is 8 of 15. The two lists share one model, `openai/gpt-oss-20b:free`, which is itself dead. |
| 2 | **The corrected 12-model chain is live in Hermes now.** | `hermes config get model.fallback` returns it, applied by `zao-openrouter-preflight --apply` (dotfiles #238, merged `e6734e6`). Primary stays `nvidia/nemotron-3-ultra-550b-a55b:free`, verified live. |
| 3 | **The list is not the fix; the preflight is.** Run it on a schedule with the drop alerts routed to Telegram. | Free IDs on OpenRouter turned over almost completely in seven weeks (July doc to 15 Sep). The corrected list will rot the same way; a catalogue check that drops dead entries loudly is what survives. |
| 4 | **Reply to attabotty with the corrected chain and the preflight offer.** Clip drafted; Zaal sends. | The July list came from attabotty. The doc cites `~/Documents/Hermes docs/Fall back chain instructions.rtf`, which does not exist on this Mac, so the chain cannot be re-derived from its stated source. |
| 5 | **Antigravity's thinking level for this class of work is `medium`** - see doc 2490. | Same session, same finding: the models research sits in `agents/2490-gemini-3-8-flash-high-effort-agent-driving`. |

## What attabotty shared

`~/Downloads/fallback-chain-openrouter-free.md`, dated 2026-07-26 in its own text, describing a 15-model free chain plus primary, safety net and "RAW MODE", with tiered cooldowns (300/180/120/90/60/30 s) and trigger codes 429, 402, 503. It carries two different chains: a table of Nemotron / Qwen / Tencent / Poolside / Gemma / Cohere IDs, and a `hermes config set` command of Gemini-exp / Phi / Llama / DeepSeek / Mistral / Hermes-3 IDs. The doc calls them "slightly different model IDs for some entries".

## Measured against the live catalogue

`https://openrouter.ai/api/v1/models`, pulled 2026-09-15: 446 models, 20 with a `:free` suffix, plus `openrouter/free`.

| Chain in the doc | Live today |
|---|---|
| Table (15 IDs) | 8 |
| `hermes config set` line (15 IDs) | **0** |

Dead from the table: `qwen/qwen3-coder:free`, `tencent/hy3:free`, `poolside/laguna-m.1:free`, `nvidia/nemotron-3-nano-30b-a3b:free`, `nvidia/nemotron-nano-12b-v2-vl:free`, `nvidia/nemotron-nano-9b-v2:free`, `openai/gpt-oss-20b:free`. Dead from the config line: every entry.

## The corrected chain (12, plus primary)

Primary `nvidia/nemotron-3-ultra-550b-a55b:free` (1,000,000 ctx). Fallback, in order: `thinkingmachines/inkling:free` (1,048,576), `nvidia/nemotron-3.5-lightning:free` (1,000,000), `nvidia/nemotron-3-super-120b-a12b:free` (262,144), `poolside/laguna-s-2.1:free`, `poolside/laguna-xs-2.1:free`, `google/gemma-4-31b-it:free`, `google/gemma-4-26b-a4b-it:free`, `nex-agi/nex-n2.5-pro:free` (all 262,144), `cohere/north-mini-code:free`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (256,000), `thinkingmachines/inkling-small:free` (1,048,576), `openrouter/free` (safety net). Cooldown tiers carried over unchanged. Left out on purpose: `inclusionai/ling-3.0-flash-sante` and `-fin` (domain variants by their slugs - inference, not measured), `nvidia/nemotron-3.5-content-safety` (moderation), `dots-studio/dots-3-note-preview` (preview), `liquid/lfm-2.5-2.6b` (65k) and `z-ai/glm-5.2` (32k) (too small). Full file: `~/Downloads/fallback-chain-openrouter-free-CORRECTED-2026-09-15.md`.

## The preflight

`~/bin/zao-openrouter-preflight` (zaal-dotfiles #238, Antigravity, 29 assertions in `zao-openrouter-preflight-test`, red control against a mutant catches 13). It fetches the catalogue, drops dead candidates to stderr as `[openrouter-preflight] DROPPED dead fallback: <id>`, exits 2 when every candidate is dead, and with `--apply` writes the survivors into Hermes. Run against the July config line it dropped all 15 and exited 2. Flags: `--from-hermes`, `--candidates-file`, `--models-json` (fixture seam), `--json`, `--strict`, `--apply`.

## Also See

- [Doc 2490](../2490-gemini-3-8-flash-high-effort-agent-driving/) - the models research from the same evening: Gemini 3.8 Flash at high vs medium.
- [Doc 2210](../../infrastructure/2210-zao-os-operating-manual/) - the loop defaults to OpenRouter with Ollama as local fallback.
- [Doc 761](../761-zao-farcaster-multiagent-quilibrium-stack/) - reasoning starts on OpenRouter.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Schedule `zao-openrouter-preflight --from-hermes --apply` weekly (launchd, Sunday 08:00 ET) with DROPPED lines posted to the ZAO Orchestration Bot; shipped = plist committed in dotfiles `launchd/` and one logged run | @Zaal (zj lane builds, Zaal loads the plist) | PR + launchd | 2026-09-21 |
| Send attabotty the reply in `clip-20260915-195818-attabotty-fallback-chain-0915`; shipped = sent, noted here | @Zaal | DM | 2026-09-17 |
| Re-validate this doc's 12 IDs against the catalogue and update the corrected file; shipped = `last-validated` bumped, any drop recorded | @Zaal (zj) | Re-research | 2026-10-13 |

## Sources

- `https://openrouter.ai/api/v1/models` pulled 2026-09-15, 446 models, parsed with python - `[FULL, official API]`
- `~/Downloads/fallback-chain-openrouter-free.md` and the corrected file beside it - `[FULL, local read]`
- `~/Documents/Hermes docs/Fall back chain instructions.rtf` (the doc's cited source) - `[FAILED: path does not exist on this Mac; directory absent]`
- zaal-dotfiles PR #238, `bin/zao-openrouter-preflight` and its test; `hermes config get model.fallback` - `[FULL, gh api + local run]`
- Antigravity session report 2026-09-15 19:50 (build and application of the preflight) - `[PARTIAL: its claims re-verified here by running the tool and reading the config; its test counts taken from its report]`
