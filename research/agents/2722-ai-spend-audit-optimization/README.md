---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-29
superseded-by:
related-docs: agents/2646-free-inference-max-openrouter-credits, agents/2492-openrouter-free-fallback-chain-preflight, dev-workflows/2675-claude-rate-limit-multi-tool-routing, cross-platform/2698-stream-topics-video-audius-ai-cost, agents/2721-best-seat-loop-away-mode
original-query: "openrouter i think we have maxed usage, we should optimize the ai usage we are doing as a whole" (Zaal, 2026-10-29, relayed by the seat with the brief: audit ALL AI spend and usage, measure first with sources, give where each dollar and cap-hour goes, the top waste with evidence, and a ranked list of changes with expected saving and reversibility; no settings changes)
tier: STANDARD
---

# 2722 - Where the AI money and the Claude cap go, and what to cut first

> **Goal:** Measure every AI surface the estate uses over the last 30 days, find the biggest waste with evidence, and rank the changes by saving and by how cheap each is to undo. Nothing here changes a setting; every change is a recommendation.

All figures were measured on 2026-10-29 unless a line says otherwise. The Claude figures are the **list-price meter**: on Max the subscription covers them until the cap, so a Claude "saving" here means headroom under the weekly cap, not cash. The OpenRouter figures are real money.

## Key Decisions

| # | Decision | Expected saving | Undo cost | Evidence |
|---|---|---|---|---|
| 1 | **STOP waking idle lanes into a cold cache.** A lane idle for more than an hour pays to re-write its whole context (100k to 400k tokens) at the 1-hour write price of 2x input. Close lanes that only wait on Zaal (`resource-release.md` rule 7), and batch peer pings to a lane instead of sending them one at a time. | Up to **$1,621 a month** of meter, 18.5% of all spend. Half of that is a fair target. | Nil: it is a habit, not a setting. | 777 Opus turns in 30 days each wrote over 100k cache tokens, $1,620.87 in total, $2.09 each. Only $101.18 of cache writes came from the first turn of a transcript, so these are mid-session re-caches, not session starts. |
| 2 | **USE Codex for docs and research PR reviews, as already decided.** It is not happening: Codex ran 5 sessions in 30 days, the last on 2026-10-21. | The evaluator lane cost **$1,476.74** over 609 sessions. Moving the docs half (an estimate, not counted) frees about $700 a month of meter. | Low: route one PR type back. | `zao-spend --days 30 --by-lane`; `~/.codex/sessions` holds 5 rollouts modified in 30 days, 72.9M tokens in total. |
| 3 | **Run the messenger, merge and grill-sweep lanes on Sonnet 5.5, and keep the seat on Opus.** Sorting reports and checking merge gates is the same judgement every time (`code-over-inference.md`). | Sonnet 5.5 is half Opus 5.5's list rate (2/10 vs 4/20 per Mtok). These three lanes cost **$1,221** in 30 days, so about **$610** a month. | `/model` back in one keystroke. | `zao-spend` by lane: messenger $675.60, merge $449.33, grill-sweep $96.24. Opus is 85.6% of all spend; Sonnet 3.9%; Haiku 0.1%. |
| 4 | **Build the scripted sweep from doc 2721 (`seat-digest --panes`)** so a seat tick reads one file instead of re-asking every pane. | The seat lane (orchestrator2) cost **$2,150.19** in 30 days, the largest single line (24.1%). Doc 2721 measured $32 a day of peer wakes on it; removing half of those is about **$480** a month. | Low: the old sweep still works. | Doc 2721 Part 4, and `zao-spend` by lane. |
| 5 | **Keep Fable 5.1 for work that needs it, by request.** It cost $921 in 30 days at $0.277 a turn, against Opus at $0.117. | If half of the Fable turns ran on Opus: about **$265** a month. | `/model`. | Recount of 30 days of transcripts by model id, below. |
| 6 | **Find the OpenRouter key that is spending, then cap every key.** The account has **$12.33 left** of $151.00 bought. Of the $138.67 used in its lifetime, the keys found here explain $46.56. In the last 51 days the account used **$47.69**, and the keys found here used about $0.23 of it this month. So nearly all the recent OpenRouter spend is on a key this audit could not reach. | Real cash: about **$28 a month** at the 51-day rate, until the caller is found. Then a per-key monthly limit stops a repeat. | A key limit is one field in the OpenRouter dashboard (Zaal's; it is a settings change). | `GET /api/v1/credits` and `GET /api/v1/key` per key, below. A scan of the Mac's project `.env` files for more keys was **BLOCKED** by the permission system. |
| 7 | **Turn on ZOE's Anthropic-credits rung and give the VPS Ollama a model,** so the cap fallback is not one paid rung. Both are already built. | Small in money (ZOE's OpenRouter key used $0.23 this month), large in resilience: today a dead OpenRouter balance means no fallback at all. | One env var each (`ZOE_ANTHROPIC_API_RUNG=1` + key; `OLLAMA_ENABLED=1` + `ollama pull`). Env changes are "ask first", so Zaal's. | ZOE's log on 2026-10-29 10:40: "CAP FALLBACK: one rung (openrouter)". `ollama list` on the VPS lists no models. |

The meter that Decisions 1 to 5 address comes to about $2,900 a month at the estimates above, taking half of Decision 1. These lines overlap (a seat wake on a cold cache counts in 1 and 4), so do not add them. The honest claim is "a third of the meter is addressable", not a dollar sum.

## Where the money goes - Claude Code (30 days, list-price meter)

`zao-spend --days 30 --by-lane` (run 2026-10-29): **$8,937.51 across 1,384 sessions.** My own recount of the same transcripts, deduplicated by message id and priced by model id at the rates `zao-spend` prints (read 2026-10-13), gave $8,751.59. That is 2.1% lower; subagent files and the pricing of five-minute cache writes probably make up the difference. The by-model and by-component splits below come from the recount.

**By model**

| Model | Cost | Share | Turns | $ per turn |
|---|---:|---:|---:|---:|
| Opus 5.5 | $7,486.95 | 85.6% | 64,054 | 0.117 |
| Fable 5.1 | $921.36 | 10.5% | 3,328 | 0.277 |
| Sonnet 5.5 | $337.60 | 3.9% | 9,808 | 0.034 |
| Haiku 5.5 | $5.27 | 0.1% | 1,927 | 0.003 |

Subagents are $405.40 of the total, 4.6%. The main sessions are $8,346.19.

**By what the tokens were**

| Component | Cost | Share |
|---|---:|---:|
| Cache reads | $4,700.54 | 53.7% |
| Cache writes | $3,008.20 | 34.4% |
| Output | $1,041.54 | 11.9% |

Cache writes are a third of the bill. Anthropic's caching page (read raw 2026-10-29): "Cache write tokens with a 1-hour TTL are 2 times the base input tokens price", against 1.25 times for five minutes and 0.1 times for a read. A Max session uses the 1-hour cache, so a full re-write costs twenty times a read of the same tokens.

**Opus cache writes by size of the write**

| Write size | Turns | Cost |
|---|---:|---:|
| under 20k tokens | 65,491 | $710.96 |
| 20k to 100k | 456 | $218.02 |
| **over 100k** | **777** | **$1,620.87** |

The 777 large writes are 1.2% of main-session Opus turns and about 22% of Opus cost. Doc 2721 measured the same thing from the seat's side: a median cache read of 222,796 tokens a call, so any wake after the hour re-writes a context of that size.

**By lane (top lines)**

| Lane | Cost | Sessions | Share of $8,937.51 |
|---|---:|---:|---:|
| orchestrator2 (the seat) | $2,150.19 | 383 | 24.1% |
| evaluator | $1,476.74 | 609 | 16.5% |
| messenger | $675.60 | 48 | 7.6% |
| wavewarz-protocol | $492.19 | 8 | 5.5% |
| zoe | $450.22 | 12 | 5.0% |
| merge | $449.33 | 5 | 5.0% |
| lane-quality (dotfiles) | $443.48 | 5 | 5.0% |
| zao-vault | $378.71 | 39 | 4.2% |

Coordination (seat, messenger, merge, seat-merge, seat-misc, grill-sweep) adds up to $3,413.85, **38.2%**. With the evaluator it is **54.7%**. That is more than half of the meter spent on running the factory rather than on the work it ships. `zao-spend` could not give dollars per merged PR: it printed "PR count incomplete - bettercallzaal (more than 300 merges; count truncated)" and "$ per merged PR: UNKNOWN".

## Where the cap goes - Claude Max

The status line writes each session's `rate_limits` to `~/.zao/usage/` (`bin/zao-statusline`, `USAGE_DIR`). 27 files were on disk.

- The weekly window that reset on **Thu 2026-10-29 06:00** peaked at **95%** in the files still on disk.
- At 13:07 the same day, the new window (resets Wed 2026-11-04 05:00) stood at 19 to 22%, with five-hour figures from 6% to 24% across sessions. The spread means more than one account is in use, so these are per-account numbers.
- PARTIAL: 27 files cover only sessions that wrote recently, so the 95% is a floor for that week, not a full history. Anthropic does not publish how the cap weighs tokens, so "cap share = meter share by lane" is an assumption, UNVERIFIED.

A week that reaches 95% is the real constraint. The meter dollars above matter because they are the best proxy we have for what fills the cap.

## Where the money goes - OpenRouter (real money)

Measured with `zao-measure` (records in `~/.zao/measurements.jsonl`). Key values were never printed; each key was read through its own `GET /api/v1/key`.

| When | Credits bought | Used | Left |
|---|---:|---:|---:|
| 2026-09-08 21:12Z | $100.00 | $90.98 | $9.02 |
| 2026-10-29 17:06Z | $151.00 | $138.67 | **$12.33** |

So $51 was added and **$47.69 was used in 51 days**, about $0.94 a day.

| Key (where found) | Lifetime use | This month (UTC) | Limit |
|---|---:|---:|---|
| VPS `~/.zao/zao.env` (cheap-loop and the old VPS loops) | $45.97 | $0.00 | none |
| VPS `zao-bot-live/.env` (ZOE) | $0.59 | $0.23 | none |
| Mac `~/.zao/zao.env` | $0.003 | $0.00 | $10 |
| VPS farscout `.env` (retired bot) | $0.00 | $0.00 | none |
| VPS zaoscribe `.env` | the key call returned no `data` (probably revoked) | - | - |

The keys found explain **$46.56 of $138.67** lifetime use, and almost none of this month's. The VPS shared key's spend is old: `~/.zao/loop-provider.log` on the VPS last wrote on 2026-08-23 ("bcz: Using cheap-loop (openrouter, text-only)"), and in its last 2,000 lines the openrouter rung was named 1,572 times. That is the dead topic-loop fleet that `zao-vps-loops` replaced. **The current spender is on a key this audit did not reach.** Candidates I did not check: the Windows desktop, the Pi, and Mac project `.env` files (that scan was BLOCKED: "Permission to use Bash with command for f in $(grep -lsI "^OPENROUTER_API_KEY=" ... has been denied."). Five repos' GitHub Actions secrets were listed by name and none is named for OpenRouter, Anthropic, OpenAI, Gemini or xAI (ZAOOS, zao-vault, zaal-dotfiles, ZAOscout, zao-website).

How to find it in two minutes: the OpenRouter dashboard lists usage per key, or a provisioning key can call the key-list API. The provisioning docs (read raw) describe "Track key usage and automatically disable keys that exceed limits (with optional daily/weekly/monthly limit resets)", with `limit` and `limitReset: 'daily'` as fields. Both routes need Zaal's login.

The private finance sweep (finance-hq #328, not reproduced here) counts the top-ups and proposes an account guardrail. This doc agrees, and adds the per-key limit, so one runaway caller cannot drain the shared balance again.

**Callers of OpenRouter in code** (grep of `~/bin` and ZAOOS origin/main for `openrouter`, 2026-10-29):

| Caller | Model | When it spends |
|---|---|---|
| ZOE cap fallback, `bot/src/zoe/models/router.ts:318` | `deepseek/deepseek-chat` (or `OPENROUTER_MODEL`) | only when Claude is capped; log shows it serving at 12:30 and 15:30 on 2026-10-29 |
| ZOE high-stakes cross-family review, `router.ts:301` | `openai/gpt-5.5` (`OPENROUTER_HIGH_MODEL`) | on a `tier: 'high'` fallback only |
| Hermes critic panel, `bot/src/hermes/critic.ts:290` | DeepSeek voter, advisory | per critic run |
| ZOE repo-improver scout, `bot/src/zoe/scheduler.ts:1899` | cheap OpenRouter model | scheduled, gated on the key and a cost hard-stop |
| `~/bin/zao-triage:56` | `deepseek/deepseek-chat` | per inbox capture classified |
| `infra/vps/cheap-loop.sh`, `loop-agent.sh` | `deepseek/deepseek-chat` (VPS `~/.zao/model-pref`: `CHEAP_PREFER=openrouter`) | loop ticks; last logged 2026-08-23 |

## The other surfaces

| Surface | Measured use (30 days) | Finding |
|---|---|---|
| Codex | 5 sessions, 72.9M tokens, last 2026-10-21 | Barely used, though the standing decision is that Codex reviews docs and research PRs. It is the cheapest unused lever. |
| Ollama, Mac | `llama3.2:latest` (2.0 GB, local) and two `:cloud` models | `:cloud` models run on Ollama's servers, so they are not private (`claude-usage.md`). |
| Ollama, VPS | installed; `ollama list` shows **no models**; 6.5 GB of 7.9 GB memory available | ZOE's last rung (`router.ts:552`, default `qwen3:4b-instruct`) cannot serve, and cheap-loop's Ollama path has nothing to load. |
| Anthropic API credits (Max plan) | ZOE's credits rung is built (`router.ts:476`, `ZOE_ANTHROPIC_API_RUNG=1` plus `ZOE_ANTHROPIC_CREDITS_KEY`) and **off** on the VPS | Doc 2646: the credits are $100 a month on Max 5x and $200 on Max 20x, they do not cover Claude Code, and they expire each cycle. Whether they have been claimed is UNKNOWN. |
| The ZAO Anthropic account, ChatGPT, Google AI Pro | subscriptions in the private finance sweep | Their use was not measured here. What each one serves that the others do not is a question for Zaal, below. |

## Top waste, ranked by evidence

1. **Cold-cache wakes.** $1,620.87 in 777 turns (18.5%). The cause is the lane model, not a bug: lanes sit idle past the 1-hour cache, then a peer message wakes them. Two open Claude Code issues add to it: #105564 ("Second turn of every new session re-writes the ~17k session-start context to the prompt cache", opened 2026-10-28) and #99360 ("Subagents use the 5-minute prompt cache while the main session uses 1-hour", title read only). Neither is ours to fix; the lane habits are.
2. **Coordination at Opus rates.** 38.2% of the meter goes on the seat, messenger, merge and grill lanes. Most of their ticks apply a fixed rule to a list.
3. **Reviews on Claude that were assigned to Codex.** $1,476.74 on the evaluator against 5 Codex sessions.
4. **An OpenRouter key nobody is watching.** $47.69 in 51 days with no limit on the keys we found and no owner for the key we did not find.
5. **A fallback ladder with one rung.** Not waste yet, but the day the OpenRouter balance hits zero, ZOE has no fallback. This happened on 2026-08-21, per ZOE's own log line.

## Comparison: the four ways to cut the meter

| Option | Meter saved a month (estimate) | Cash saved | Risk | Reversible |
|---|---:|---:|---|---|
| Close waiting lanes, batch pings (Decision 1) | up to $1,600 | none (Max) | a closed lane costs a restart | yes |
| Codex for docs reviews (2) | ~$700 | none | cross-family reviews disagree more | yes |
| Sonnet for coordination lanes (3) | ~$610 | none | a weaker model misroutes a gated ask | yes, `/model` |
| Scripted seat sweep (4) | ~$480 | none | a script misses a pane it should flag | yes |
| Drop a Claude plan once the cap has headroom | small | **$100 or more a month** | lanes stall at the cap | yes, re-subscribe |

The last row is the only one that turns meter savings into cash. It is worth deciding only after two weeks of measurement show the weekly cap peaking well under 95%.

## Next Actions

| Action | Owner | Type | By when |
|---|---|---|---|
| Open the OpenRouter dashboard, find the key that used most of the $47.69 since 2026-09-08, and say which machine holds it. Done when this doc names it | Zaal | Read, his login | 2026-11-01 |
| Set a monthly limit on every OpenRouter key (a guardrail at account level per finance-hq #328, plus a per-key limit) | Zaal | Settings, his tap | 2026-11-01 |
| Seat and messenger: close lanes whose only next step is Zaal's answer, and batch peer pings to one per lane per tick. Re-run the >100k cache-write count from this doc on 2026-11-12 and compare it with 777 | seat | Habit + measurement | 2026-11-12 |
| Route docs and research PR reviews to `codex exec` read-only, as already decided. Done when Codex sessions over 7 days are above 5 | seat-merge / evaluator | Routing | 2026-11-05 |
| Decide whether messenger, merge and grill-sweep run on Sonnet 5.5 | Zaal | Decision, A/B | next grill |
| Build `seat-digest --panes` from doc 2721 Part 4 | research or dotfiles lane | PR | after #4206 merges |
| Add `ZOE_ANTHROPIC_API_RUNG=1` plus the credits key on the VPS, and `ollama pull qwen3:4b-instruct` with `OLLAMA_ENABLED=1` | Zaal (env change) | Env, ask first | next VPS session |
| Make `zao-spend` print the by-model and cache-write split this doc computed by hand, so the next audit is one command (`code-over-inference.md`: third time, write the tool) | dotfiles lane | PR | 2026-11-12 |

**Question for Zaal (with a default):** the ZAO Anthropic account, ChatGPT and Google AI Pro each cost money every month. Which of them does a lane actually use? A) keep all three until the two-week measurement is in (recommended); B) name the ones no lane uses and drop them now.

## Sources

Local measurements (method stated; all 2026-10-29):

1. `zao-spend --days 30 --by-lane` and `zao-spend --days 7`, `zao-spend --history` - [FULL]. Its merged-PR count was truncated, so $/PR is UNKNOWN.
2. A recount of `~/.claude/projects/*/**/*.jsonl` modified in 30 days, deduplicated by message id, priced at zao-spend's rates (a script in the session scratchpad, not committed) - [FULL]. It gives 2.1% less than zao-spend.
3. `~/.zao/usage/*.json`, the status line's rate-limit records - [PARTIAL - 27 files, only sessions that wrote recently].
4. OpenRouter `GET /api/v1/credits` and `GET /api/v1/key` with curl, via `zao-measure` (Mac) and ssh (VPS) - [FULL for the six keys found]. Mac project `.env` scan - [FAILED - BLOCKED by the permission system].
5. VPS over ssh: `ollama list`, `free -m`, `journalctl --user -u zoe-bot --since "7 days ago"`, `crontab -l`, `~/.zao/loop-provider.log`, `~/.zao/model-pref` - [FULL].
6. `~/.codex/sessions` rollouts and their `total_token_usage` - [FULL].
7. `gh secret list` names for five repos - [FULL, names only].
8. finance-hq PR #328, `budget/savings-sweep-2026-10-29.md` - [FULL; private, amounts not reproduced here].
9. ZAOOS origin/main: `bot/src/zoe/models/router.ts`, `bot/src/hermes/critic.ts`, `bot/src/zoe/scheduler.ts`, `infra/vps/cheap-loop.sh`; `~/bin/zao-triage` - [FULL for the lines cited].

External (raw fetches):

10. [Anthropic prompt caching](https://docs.claude.com/en/docs/build-with-claude/prompt-caching) - curl of the `.md`, 165,990 bytes - [FULL]. The 1.25x, 2x and 0.1x multipliers.
11. [OpenRouter provisioning API keys](https://openrouter.ai/docs/guides/overview/auth/provisioning-api-keys.md) - curl, 23,970 bytes - [FULL]. Per-key `limit` and `limitReset`.
12. [OpenRouter credit and rate limits](https://openrouter.ai/docs/api/reference/limits.md) - curl, 17,005 bytes - [FULL]. Credit limits are read from `GET /api/v1/key` as `limit_remaining`. The older `/docs/api-reference/limits` URL returned an app shell, not the page.
13. [Hacker News 47582877, "Claude Code bug can silently 10-20x API costs"](https://news.ycombinator.com/item?id=47582877), 2026-03-31, 66 points - HN Algolia items API - [FULL for the post and the first four comments]. It links an r/ClaudeCode thread that was not fetched.
14. [anthropics/claude-code #105564](https://github.com/anthropics/claude-code/issues/105564), opened 2026-10-28 - `gh issue view` - [FULL].
15. [anthropics/claude-code #99360](https://github.com/anthropics/claude-code/issues/99360) - `gh search issues` - [PARTIAL - title only].
16. Reddit r/ClaudeAI search through `zao-fetch-reddit.sh` - [FAILED - "No OAuth credentials" and "reddit blocked on every automated path"]. The HN thread above stands in as the community source.

Library: docs 2646 (Max API credits, the OpenRouter free tier), 2698 (plan prices), 2721 (the seat loop and its wake cost), 2675 (routing across tools), 2492 (the OpenRouter fallback chain).
