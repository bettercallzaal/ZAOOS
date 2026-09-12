---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-11
superseded-by:
related-docs: "dev-workflows/1113-zoe-multi-model-comparison, agents/1181-elizaos-2026-reresearch, agents/2482-self-evolving-code-review-agent-memory"
original-query: "https://x.com/polydao/status/2098417503928041671?s=46 research this and also I think I have wayyy to much of a reliance on Claude I need to use other sis include local ai"
tier: STANDARD
---

# 2483 - The Claude dependency is real, and the second path is already built and switched off

> **Goal:** Answer Zaal's two-part message: what the polydao repo list is worth,
> and what to do about relying on Claude. The measurement is the finding. ZOE
> already ships a Claude/Grok/GPT router, and it is DISABLED in production with
> no keys behind it. Ollama is installed on both the Mac and the VPS and holds
> one 7-month-old model on one of them and nothing on the other. The problem is
> not that a second path has to be built. It is that the one we have was never
> turned on or measured.

## Key Decisions

| # | Decision | Call | Why (evidence) |
|---|---|---|---|
| 1 | The 10 repos in the post | **SKIP as a plan, KEEP 2 as reference** | They are learning courses, not stack choices. Only `rasbt/LLMs-from-scratch` (Apache 2.0, read from LICENSE.txt) and `microsoft/ai-agents-for-beginners` (MIT) touch what we build. Nothing there reduces a Claude dependency. |
| 2 | Turn on the router we already have | **YES, behind a measurement** | `bot/src/zoe/models/router.ts` dispatches to Claude, Grok or GPT when `MODEL_ROUTING_ENABLED=1`. Measured on the live VPS: `MODEL_ROUTING_ENABLED` unset, `GROK_API_KEY` unset, `OPENAI_API_KEY` unset. So the fallback the code advertises does not exist in production. |
| 3 | Local models (Ollama) as the answer to reliance | **NO for anything that reviews or decides; YES for a narrow list** | Ollama is installed on the Mac (one model, `llama3.2:latest`, 2 GB, last touched 7 months ago) and on the VPS (`ollama list` returns NO models, service inactive). It is installed in two places and used in zero. A 3B-class local model cannot do what the critics do. It can do classification, redaction checks and offline triage. |
| 4 | What actually reduces the risk first | **Make the failure visible, then make it survivable** | The single point of failure is not "Claude" in the abstract, it is the weekly cap on one subscription with 29 call sites behind it and no key-backed fallback. A cap today degrades the fleet silently. |
| 5 | Rewriting the stack to be model-agnostic | **NO** | The abstraction already exists (`ClaudeCliResult`-compatible wrappers in the router, plus `bot/src/hermes/codex-cli.ts` as a second CLI). Adding a framework to solve a configuration problem is the mistake doc 2481 refused this week. |

## What the link actually is

A post by **@polydao (Mr. Buzzoni)**, 2026-09-11 14:24 UTC, 258 likes, 18,885
views when read: "10 repos i'd actually keep, from python fundamentals to LLMs,
agents and production AI". It is a curated list of large teaching repositories,
with a "pick by where you are" ladder at the end.

Measured 2026-09-11 (`gh api repos/<name>`), stars / last push / licence:

| Repo | Stars | Last push | Licence (read from the file where ambiguous) |
|---|---|---|---|
| jackfrued/Python-100-Days | 186,312 | 2026-07-29 | **NONE - all rights reserved** (no LICENSE file in the tree) |
| microsoft/generative-ai-for-beginners | 119,573 | 2026-09-10 | MIT |
| rasbt/LLMs-from-scratch | 104,786 | 2026-09-10 | API says NOASSERTION; **LICENSE.txt is Apache 2.0** |
| microsoft/ML-For-Beginners | 90,387 | 2026-09-10 | MIT |
| openai/openai-cookbook | 75,921 | 2026-09-11 | MIT |
| microsoft/ai-agents-for-beginners | 74,455 | 2026-09-10 | MIT |
| CompVis/stable-diffusion | 73,412 | **2024-06-18** | API says NOASSERTION; **LICENSE is CreativeML Open RAIL-M**, a use-restricted licence |
| microsoft/AI-For-Beginners | 68,391 | 2026-09-04 | MIT |
| pathwaycom/llm-app | 58,938 | 2026-07-05 | MIT |
| facebookresearch/segment-anything | 54,846 | **2024-09-18** | Apache 2.0 |

Two of the ten have not been pushed to in over a year, and the two the GitHub
API could not classify are exactly the two whose licences matter most: one is
Apache 2.0 (fine) and one is a **use-restricted RAIL licence** (not fine to
treat as open source). That is Hard Requirement 13 earning itself again - the
API field is a classifier and it was wrong on both.

## Findings

### The dependency, measured rather than felt

- **29 files** under `bot/src/` reference the Claude CLI path
  (`git grep -c "callClaudeCli\|claude-cli"`), including the cockpit, the
  newsletter agent, the brief, the concierge, the cost ledger, every critic,
  and both halves of the Hermes coder/critic pair.
- **The subscription, not the API.** `ANTHROPIC_API_KEY` is unset on the live
  VPS; ZOE's workers run through the Claude CLI on Zaal's subscription (ZAOOS
  #3473 made `--bare` conditional on an API key precisely so the subscription
  OAuth works). So the cap that matters is a weekly subscription cap on one
  account.
- **Every estate lane is Claude Code.** zj, vault, Zorca, wwtracker, zabalgamez,
  zao-calendar, the grill lane, baraza. There is no second harness anywhere,
  and the review discipline that produced 15 merged PRs tonight is one vendor
  deep.

### The second path exists and is switched off

`bot/src/zoe/models/router.ts` is a real multi-model router: Claude for deep
agentic work, Grok for fast code generation, GPT for structured reasoning, each
wrapped to return a `ClaudeCliResult`-compatible response, with a documented
fallback token cap (`FALLBACK_MAX_TOKENS`, 8192, raised after a 4096 cap cut a
long audit off mid-sentence on 2026-07-29). Its own header says it "gracefully
falls back to Claude if a model's API key is missing".

On the live VPS (`/home/zaal/zao-bot-live/bot/.env`), measured tonight:

    MODEL_ROUTING_ENABLED  unset
    GROK_API_KEY           unset
    OPENAI_API_KEY         unset
    OPENROUTER_API_KEY     SET
    ANTHROPIC_API_KEY      unset

So the router is off, and even if it were on, two of its three providers have no
key. The one configured non-Claude provider is OpenRouter, which serves the
caster's draft step (`bot/src/zoe/caster/reason.ts`), not the fleet.

**The fallback direction is also backwards for this problem.** The router falls
back TO Claude. Nothing falls back FROM it.

### Local AI: installed twice, used zero times

| Machine | Ollama | Models |
|---|---|---|
| Mac | `/usr/local/bin/ollama` | `llama3.2:latest`, 2.0 GB, modified 7 months ago |
| VPS | `/usr/local/bin/ollama` | **none**, service inactive |
| baraza (Windows) | installed per the streaming node work | not measured here |

No file under `bot/src/` references Ollama at all. So "include local AI" is not
a change of direction; it is starting to use something that has been sitting
installed on two machines for months.

**Where a local model is genuinely right, and where it is not.** A 3B-class
model on a VPS cannot replace a critic that gates auto-fix PRs, and pretending
otherwise trades a vendor risk for a correctness risk. What it can do, offline
and free, at the scale we run:

- Credential and PII pre-scan before anything is sent anywhere (the estate
  already refuses on regex; a local model catches what a regex does not).
- Classification: is this screen text a question or Claude Code's footer (the
  false ZAAL-QUESTION that cost 8 hours today), is this line copy or a record
  (the retired-names classifier, currently a path rule and explicitly a proxy).
- Offline triage when the cap is hit: summarise, route, hold - not decide.

### Why this is the same defect as everything else tonight

A router that reports a provider choice while three of its providers are
unconfigured is **state says working, the thing does not work**: the same shape
as the bridge returning `{"ok": true}` on a scene switch that never happened,
the error marked handled that Zaal was never told about, and the guard green
because a bulk decision hid what it watched. The router has never been watched
failing over, so it is a fallback that has only ever agreed with us.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Measure the dependency's cost before changing it: read `bot/src/zoe/cost-ledger.ts` output for the last 30 days and record calls per day, per surface, and how many hit the weekly cap. Shipped when the numbers are in this doc | @zj | Measurement | 2026-09-19 |
| Prove the router fails over rather than assuming it: with `MODEL_ROUTING_ENABLED=1` and one non-Claude key, force a Claude failure and assert the reply comes from the other provider, with a test that goes red without the fallback. Shipped when that test exists in `bot/src/zoe/models/__tests__/` | @zj | PR (ZAOOS) | 2026-09-26 |
| Decide the second provider and put ONE key behind it, so the fallback is real: Grok, GPT or OpenRouter-for-everything. Shipped when the key is in the VPS env and the router is enabled | @Zaal | Decision + credential | 2026-09-19 |
| Pull one current local model on the VPS (`ollama pull qwen3:4b-instruct`, ~2.5 GB) and wire it to exactly one job: the pre-send credential and PII scan. Shipped when a send is blocked by the local model in a test | @zj | PR (ZAOOS) | 2026-10-03 |
| Refresh or remove the 7-month-old `llama3.2` on the Mac; an unused model that old is a claim about capability nobody has checked | @zj | Chore | 2026-09-26 |
| No adoption work from the polydao list | @zj | wontfix | wontfix |

## Also See

- [dev-workflows/1113 - ZOE Multi-Model Comparison: Claude vs Grok vs GPT](../../dev-workflows/1113-zoe-multi-model-comparison/) - the routing rationale the router cites
- [agents/1181 - ElizaOS 2026 re-research](../1181-elizaos-2026-reresearch/) - notes that ElizaOS abstracts Claude/GPT/Grok/Ollama while the ZAO fleet does not
- [agents/2482 - the self-evolving code review agent](../2482-self-evolving-code-review-agent-memory/) - the other "adopt this?" call tonight, also SKIP the stack and keep the idea

## Sources

1. [FULL, `zao-fetch-x.sh` tier 0, raw] @polydao, "10 repos i'd actually keep", 2026-09-11 14:24 UTC, 258 likes / 18,885 views - https://x.com/polydao/status/2098417503928041671 (read 2026-09-11)
2. [FULL, `gh api repos/<name>`] Stars, last push and licence field for all ten repos (table above), measured 2026-09-11
3. [FULL, `gh api .../contents/LICENSE*`, base64-decoded] `rasbt/LLMs-from-scratch` LICENSE.txt = Apache 2.0; `CompVis/stable-diffusion` LICENSE = CreativeML Open RAIL-M; `jackfrued/Python-100-Days` has no licence file
4. [FULL, local] `bot/src/zoe/models/router.ts` - the Claude/Grok/GPT router, its gate `MODEL_ROUTING_ENABLED`, and `FALLBACK_MAX_TOKENS`
5. [FULL, ssh, live] `/home/zaal/zao-bot-live/bot/.env` on the production VPS: MODEL_ROUTING_ENABLED, GROK_API_KEY, OPENAI_API_KEY and ANTHROPIC_API_KEY unset; OPENROUTER_API_KEY set (2026-09-11)
6. [FULL, ssh + local] `ollama list`: no models and inactive service on the VPS; `llama3.2:latest` 2.0 GB, 7 months old, on the Mac
7. [FULL, local] `git grep -c "callClaudeCli\|claude-cli"` over `bot/src/**/*.ts` excluding tests: 29 files
