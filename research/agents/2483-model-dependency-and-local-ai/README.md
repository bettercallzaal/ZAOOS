---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "dev-workflows/1113-zoe-multi-model-comparison, agents/1181-elizaos-2026-reresearch, agents/2482-self-evolving-code-review-agent-memory, agents/2204-cross-family-verification-99darwin-orchestrator, agents/2217-frontier-model-routing-decision"
original-query: "https://x.com/polydao/status/2098417503928041671?s=46 research this and also I think I have wayyy to much of a reliance on Claude I need to use other sis include local ai"
tier: STANDARD
---

# 2483 - The Claude dependency is real; the second path was already live when this doc first shipped

> **Goal:** Answer Zaal's two-part message: what the polydao repo list is worth,
> and what to do about relying on Claude.

## CENTRAL CLAIM CORRECTION - lead with this

**The 2026-09-11 version of this doc said "the router falls back TO Claude.
Nothing falls back FROM it" and called the `MODEL_ROUTING_ENABLED`-gated
router the only second path, DISABLED with no keys behind it. That was wrong
on the day it was published**, not just stale since. A separate mechanism -
`callCapFallback` / `routeAndCall` in the same file, gated independently of
`MODEL_ROUTING_ENABLED` - had been live in production since PR #2479
("cap-fallback - when Claude is rate-limited/capped, run the turn on a
non-Claude provider"), merged **2026-07-21**, seven weeks before this doc's
first publication. By 2026-09-11 it was already wired into `critic.ts`,
`concierge.ts`, `cli-cap-aware.ts`, `repo-improver.ts` and
`repo-improver-io.ts`, already had test coverage (PR #2726, 2026-07-29), and
was already documented in this same research library twice over - doc
`agents/2204-cross-family-verification-99darwin-orchestrator` (last-validated
2026-08-06) names the exact call site `concierge.ts:172`, and doc
`agents/2217-frontier-model-routing-decision` (also 2026-08-06) describes the
same ladder ("Claude Max (default, flat cap) -> cheap DeepSeek (fleet +
general cap-fallback)"). Neither was checked before the original doc asserted
the fallback direction was one-way. `OPENROUTER_API_KEY` was already SET in
production on 2026-09-11 (confirmed in the original measurement, unchanged
today) - `hasCapFallbackProvider()` was already `true` in production the day
the doc said no non-Claude path existed.

This does not mean "reliance on Claude" was never a real problem - it still
is, for the reasons below. It means the doc mischaracterized what already
existed to fix it.

## Updated 2026-09-25: what moved since last-validated (2026-09-11)

| Next Action (2026-09-11 doc) | Status today | Evidence |
|---|---|---|
| Measure the dependency's cost via `cost-ledger.ts`, 30 days, calls/day | **NOT DONE** | No doc, no tracker row. `zao-research-index` and `~/bin/zao-tracker search` for "cost-ledger"/"model dependency" both return nothing. |
| Prove the router fails over with a real test | **Already existed before this doc was written** - not a 2026-09-25 change, a correction of the 2026-09-11 record. `bot/src/zoe/models/__tests__/router-failover.test.ts` exists, covers `hasCapFallbackProvider`, `callCapFallback` (single-provider success, ladder fallthrough OpenRouter->Grok, all-fail aggregate error), git-blamed to PR #2726 (2026-07-29). | `git log --oneline -- bot/src/zoe/models/__tests__/router-failover.test.ts` |
| Put one non-Claude key behind the router and enable it | **Partially true already, more true now.** `OPENROUTER_API_KEY` was set on 2026-09-11 and still is - the cap-fallback ladder (not the `MODEL_ROUTING_ENABLED` path) has had a live key the whole time. Since then the ladder gained two more rungs: Surplus Intelligence (PR #3228, 2026-08-21) and a local Ollama rung (PR #3489, 2026-09-11). `MODEL_ROUTING_ENABLED` itself is still unset on the VPS - the model-*selection* feature (pick Grok for code gen, GPT for reasoning) remains off; only the cap-*fallback* ladder is live. | VPS `.env` re-read 2026-09-25: `MODEL_ROUTING_ENABLED`, `GROK_API_KEY`/`XAI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SURPLUS_API_KEY`, `OLLAMA_ENABLED` all absent; `OPENROUTER_API_KEY` present (name only checked, value never read). |
| Pull a current local model on the VPS, wire it to the PII pre-scan | **NOT DONE** | `ollama list` on the VPS still returns zero models. One change: the `ollama` systemd service is now reported `active` (was `inactive` on 2026-09-11) - the daemon runs, nothing is loaded into it, and `OLLAMA_ENABLED` is not set in the bot's `.env`, so even if a model were pulled the router's Ollama rung (added 2026-09-11, PR #3489) would not use it yet. |
| Refresh or remove the 7-month-old `llama3.2` on the Mac | **NOT DONE, not yet due** | Same file, now reporting "8 months ago" (time passing, not re-pulled). Due date was 2026-09-26 - one day after this re-research. |

## What's actually new since 2026-09-11 (not a correction, a real change)

- **PR #3228 (2026-08-21):** Surplus Intelligence added as a second cheap cap-fallback rung, ahead of the original OpenRouter-only ladder.
- **PR #3489 (2026-09-11, same day as the original doc):** a local Ollama rung added at the bottom of the cap-fallback ladder (`OLLAMA_ENABLED=1`, `OLLAMA_URL`, default model `qwen3:4b-instruct` - the exact model this doc's Next Actions had already recommended pulling). Not enabled in production - `OLLAMA_ENABLED` is absent from the VPS `.env`.
- **PR #3522 (2026-09-15):** a deterministic provider-health state machine with hysteresis (`provider-health.ts`), replacing ad hoc retry logic with tracked per-provider health state feeding `prioritizeProviders`.
- **`git grep -c "callClaudeCli\|claude-cli"` over `bot/src/**/*.ts`, non-test files: still 29** - re-run 2026-09-25 against the current checkout, unchanged from 2026-09-11. The raw Claude-CLI surface area has not shrunk; what changed is how much of it now has a working non-Claude escape hatch when capped.

## Key Decisions (revised)

| # | Decision | Call | Why (evidence) |
|---|---|---|---|
| 1 | The 10 repos in the original polydao post | **SKIP as a plan, KEEP 2 as reference** (unchanged from 2026-09-11 - not re-fetched today, no new evidence needed; this finding is about licence/relevance, not something that ages in two weeks) | Only `rasbt/LLMs-from-scratch` (Apache 2.0) and `microsoft/ai-agents-for-beginners` (MIT) touch what we build. |
| 2 | Whether a second path had to be "turned on" | **NO - correct the record: it already was, on 2026-09-11, and has grown two more rungs since** | See Central Claim Correction above. The actionable gap is not "enable the router," it is "wire `OLLAMA_ENABLED` and pull a model" and "measure whether the cap-fallback ladder is actually being exercised in practice" (Next Actions). |
| 3 | Local models (Ollama) as the answer to reliance | **NO for anything that reviews or decides; YES for a narrow list - unchanged call, but the code now has a slot for it** | Ollama is still installed with zero models loaded on the VPS and one untouched 8-month-old model on the Mac. The router's Ollama rung (PR #3489) is real code with nothing behind it yet - a slot, not a fix. |
| 4 | What actually reduces the risk first | **Measure whether the existing cap-fallback ladder has ever actually fired in production**, not build another path | Nobody has answered "how many times has `callCapFallback` actually run this month, and did it produce a usable result" - the ladder existing and the ladder being exercised are different claims, and only the first has been checked. |
| 5 | Rewriting the stack to be model-agnostic | **NO, unchanged** | The abstraction already exists twice over now (the `MODEL_ROUTING_ENABLED` selector and the cap-fallback ladder); a third framework would compound, not fix, the actual gap (decision 4). |

## Findings (re-verified 2026-09-25)

### The dependency, re-measured

- **29 non-test files** under `bot/src/` reference the Claude CLI path
  (`git grep -c "callClaudeCli\|claude-cli"`, current checkout) - unchanged
  count from 2026-09-11.
- **Still the subscription, not the API.** `ANTHROPIC_API_KEY` remains unset
  on the VPS today.
- **Every estate lane is still Claude Code** - unchanged, out of scope for
  this re-fetch (no VPS/lane data suggests otherwise).

### The cap-fallback ladder: live since 2026-07-21, not "switched off"

`callCapFallback()` / `hasCapFallbackProvider()` in `router.ts` check
`OPENROUTER_API_KEY`, `SURPLUS_API_KEY`, `XAI_API_KEY`, `OPENAI_API_KEY`, or
`OLLAMA_ENABLED=1` - none of this reads `MODEL_ROUTING_ENABLED`. On the VPS
today (`/home/zaal/zao-bot-live/bot/.env`, re-read 2026-09-25, names only,
values never read or printed):

```
MODEL_ROUTING_ENABLED   absent
XAI_API_KEY / GROK_API_KEY   absent
OPENAI_API_KEY          absent
ANTHROPIC_API_KEY       absent
SURPLUS_API_KEY         absent
OLLAMA_ENABLED          absent
OPENROUTER_API_KEY      present
```

`hasCapFallbackProvider()` therefore reads `true` today, and read `true` on
2026-09-11 too (`OPENROUTER_API_KEY` was already present then, per the
original doc's own measurement) - the fallback path this doc originally
called nonexistent was configured the whole time. It is called from
`bot/src/hermes/critic.ts`, `bot/src/zoe/concierge.ts`,
`bot/src/zoe/models/cli-cap-aware.ts`, `bot/src/zoe/critics/types.ts`,
`bot/src/zoe/repo-improver.ts` and `bot/src/zoe/repo-improver-io.ts` -
`concierge.ts` explicitly branches `if (isCap && hasCapFallbackProvider())`
before calling `callCapFallback`.

**What is still genuinely off:** the *model-selection* router
(`MODEL_ROUTING_ENABLED`-gated `selectBestModel`, which would let Grok take
code-gen tasks and GPT take structured-reasoning tasks even when Claude is
not capped) is still disabled, and two of its three named providers
(`XAI_API_KEY`/`GROK_API_KEY`, `OPENAI_API_KEY`) are still unconfigured. That
part of the 2026-09-11 finding holds. What did not hold was treating that as
the *only* second path.

### Local AI: still installed, still zero models loaded, one new dial

| Machine | Ollama | Models | Change since 2026-09-11 |
|---|---|---|---|
| Mac | `/usr/local/bin/ollama` | `llama3.2:latest`, 2.0 GB, ~8 months old | none - same file, just older |
| VPS | `/usr/local/bin/ollama` | **none** | service now reports `active` (was `inactive`); still zero models pulled; `OLLAMA_ENABLED` still absent from the bot's `.env` |

The router gained a real Ollama rung (PR #3489) on the same day this doc was
last validated, aimed at exactly the job this doc recommended (`OLLAMA_MODEL`
defaults to `qwen3:4b-instruct`) - but nobody has pulled that model or set
`OLLAMA_ENABLED=1`, so the rung is wired code with nothing behind it.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Measure whether `callCapFallback` has actually fired in production in the last 30 days (grep the bot's logs / cost-ledger for `provider: 'openrouter'`/`'grok'`/`'ollama'` results, not just Claude), and record calls-per-day per surface. This replaces the original "measure the dependency" action with the more honest question: is the existing fallback being exercised? | @zj | Measurement | 2026-10-03 |
| Set `OLLAMA_ENABLED=1` on the VPS and `ollama pull qwen3:4b-instruct` (~2.5 GB) so the router's already-built Ollama rung has a model behind it. Shipped when `ollama list` on the VPS is non-empty and `OLLAMA_ENABLED=1` is in the live `.env` | @zj | Config (VPS) | 2026-10-03 |
| Decide whether to also enable `MODEL_ROUTING_ENABLED` (the task-based selector, separate from the cap-fallback ladder) with one of Grok/GPT keyed, now that the cap-fallback ladder proves the wiring works | @Zaal | Decision + credential | 2026-10-03 |
| Refresh or remove the 8-month-old `llama3.2` on the Mac | @zj | Chore | 2026-09-30 |
| No adoption work from the polydao list (unchanged) | @zj | wontfix | wontfix |
| Correct any downstream doc or dashboard that cited the original "router built but switched off, Ollama unused, nothing falls back from Claude" framing - the fallback-exists half of that claim was wrong from 2026-09-11 forward | @zj | Doc sweep | 2026-10-03 |

## Also See

- [dev-workflows/1113 - ZOE Multi-Model Comparison: Claude vs Grok vs GPT](../../dev-workflows/1113-zoe-multi-model-comparison/) - the routing rationale the router cites
- [agents/1181 - ElizaOS 2026 re-research](../1181-elizaos-2026-reresearch/) - notes that ElizaOS abstracts Claude/GPT/Grok/Ollama while the ZAO fleet's *selection* router still does not (its cap-*fallback* ladder does, see above)
- [agents/2482 - the self-evolving code review agent](../2482-self-evolving-code-review-agent-memory/) - the other "adopt this?" call from the same session, also SKIP the stack and keep the idea
- [agents/2204 - Cross-family verification: 99darwin/orchestrator](../2204-cross-family-verification-99darwin-orchestrator/) - last-validated 2026-08-06, already names the exact cap-fallback call site (`concierge.ts:172`) this doc originally missed
- [agents/2217 - Frontier Model Routing Decision](../2217-frontier-model-routing-decision/) - last-validated 2026-08-06, already describes the same Claude-Max-then-cheap-fallback ladder

## Sources

1. [FULL, `zao-fetch-x.sh` tier 0, raw, 2026-09-11, not re-fetched today - static post] @polydao, "10 repos i'd actually keep" - https://x.com/polydao/status/2098417503928041671
2. [FULL, `gh api repos/<name>`, 2026-09-11, not re-fetched - repo licence/star data from the original pass, unrelated to the central-claim correction] Ten-repo table, unchanged from original doc.
3. [FULL, ssh, re-read 2026-09-25] `/home/zaal/zao-bot-live/bot/.env` on the production VPS - env var names only (`MODEL_ROUTING_ENABLED`, `XAI_API_KEY`/`GROK_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SURPLUS_API_KEY`, `OLLAMA_ENABLED` absent; `OPENROUTER_API_KEY`, `GROQ_API_KEY` present - `GROQ_API_KEY` is unrelated, used by Whisper transcription, not the router). Values never read or printed.
4. [FULL, ssh + local, re-run 2026-09-25] `ollama list` on both machines: VPS still zero models, service now `active` (was `inactive`); Mac still `llama3.2:latest`, 2.0 GB, ~8 months old.
5. [FULL, local, re-run 2026-09-25] `git grep -c "callClaudeCli\|claude-cli"` over `bot/src/**/*.ts`, non-test files: 29, unchanged.
6. [FULL, local, read 2026-09-25] `bot/src/zoe/models/router.ts` (current version, 24.7 KB, substantially larger than the 2026-09-11 version) - header comment, `hasCapFallbackProvider`, `callCapFallback`, `routeAndCall`, Ollama/Surplus/OpenRouter rungs.
7. [FULL, local, read 2026-09-25] `bot/src/zoe/models/__tests__/router-failover.test.ts` - covers the ladder (single success, OpenRouter->Grok fallthrough, all-fail aggregate error).
8. [FULL, local, `git log --oneline` + `git show -s --format=%ci`, 2026-09-25] Commit history for `bot/src/zoe/models/`: PR #2479 (2026-07-21, cap-fallback introduced), #2494 (2026-07-22), #2695 (2026-07-29), #2726 (2026-07-29, test coverage), #2891 (multi-family critic panel), #2900 (2026-08-06, high-tier escalation), #3228 (2026-08-21, Surplus rung), #3488/#3489 (2026-09-11, Ollama rung), #3522 (2026-09-15, provider-health state machine).
9. [FULL, local] `git grep -n "callCapFallback\|routeAndCall\|hasCapFallbackProvider" bot/src/**/*.ts` - call sites in `critic.ts`, `concierge.ts`, `cli-cap-aware.ts`, `critics/types.ts`, `repo-improver.ts`, `repo-improver-io.ts`.
10. [FULL, local] `research/agents/2204-cross-family-verification-99darwin-orchestrator/README.md` and `research/agents/2217-frontier-model-routing-decision/README.md`, both last-validated 2026-08-06 - both already document the cap-fallback ladder this doc originally said did not exist.
11. [FAILED - no result, not a tool failure] `zao-research-index "cost-ledger 30 day"` and `~/bin/zao-tracker search "cost-ledger"` / `"model dependency"` - no doc or tracker row found for the 30-day call-volume measurement Next Action; treated as not done, not as unmeasurable.
