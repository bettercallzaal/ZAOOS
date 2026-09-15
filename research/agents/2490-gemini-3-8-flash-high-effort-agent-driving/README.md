---
topic: agents
type: guide
status: research-complete
last-validated: 2026-09-15
superseded-by:
related-docs: 434, 196, 089
original-query: "Gemini 3.8 Flash (high reasoning effort) - what this model does best and worst, specifically for driving a coding agent like Antigravity. Depth: STANDARD. Focus on: reasoning-effort behaviour, context window and long-context reliability, tool-calling and agentic loop quality, code-editing accuracy, known failure modes (overclaiming, unverified edits, skipping persistence of changes), and how to write task instructions that suit it."
tier: STANDARD
---

# 2490 — Gemini 3.8 Flash at high effort: what it is good at, and why we should not be running it at high

> **Goal:** Decide the thinking level and the task-instruction shape for the Antigravity lane, from the model's own docs plus one measured failure set from our own repos on 2026-09-15.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **SET Antigravity to `medium`, not `high`.** | Google's own docs name `medium` as "Recommended for complex code and agentic use cases, providing higher first-pass accuracy" and reserve `high` for "deep reasoning, mathematics, and difficult multi-step tasks". We have been paying for `high` on work the vendor routes to `medium`. |
| 2 | **Expect ~40% higher cost per task than 3.7 Flash at the same prices.** | Artificial Analysis: $0.58/task at high vs $0.40 for 3.7 Flash, from a 30% rise in output tokens (48k avg) and more agentic turns - per-token pricing is unchanged. `medium` is $0.41, `low` is $0.24. |
| 3 | **Do not treat its self-reports as evidence.** Require a command whose output proves the claim. | Its three failures in our repos today were all reporting failures, not reasoning failures. More thinking cannot fix an uncommitted file. |
| 4 | **Give it verification commands, not verification adjectives.** | "Make sure it works" is unfalsifiable to a model that narrates diligence. `git show --stat <sha> -- <path>` is not. |
| 5 | **KEEP it for long-horizon agentic coding.** Do not move the lane off it. | Terminal-bench 2.1 90.8% (3.7 Flash: 81.6%) and DeepSWE v1.1 wins are real, and it is the default model for the Antigravity agent - swimming upstream costs more than it buys. |

## What it is

`gemini-3.8-flash`, GA, announced 2026-09-02 - Google's fourth Flash release in under four months.

| Spec | Value |
|---|---|
| Context window | 1,048,576 tokens |
| Max output | 65,536 tokens |
| Thinking levels | `low`, `medium`, `high` - default `medium`. `minimal` returns an error |
| Price | $0.75 / $3.75 per 1M in/out (introductory, through end of 2026); $1.50 / $7.50 standard |
| Cached input | 90% discount |
| Modalities | text, image, audio, video in; text out |
| Tools | function calling, code execution, Google Search/Maps grounding, computer use (preview) |
| Deprecated | `temperature`, `top_p`, `top_k` ignored; `thinking_budget` replaced by `thinking_level`; `candidate_count` unsupported |

**It is the default model for the Antigravity agent** in Gemini Managed Agents, and for the Antigravity SDK. So the lane is on the vendor's intended path; the only real dial is the thinking level.

## Benchmarks, 3.8 vs 3.7 Flash

| Benchmark | 3.8 Flash | 3.7 Flash |
|---|---|---|
| Terminal-bench 2.1 (agentic terminal coding) | 90.8% | 81.6% |
| SWE-Bench Pro | 61.6% | 60.4% |
| SWE-Atlas | 51.9% | 48.0% |
| τ³-bench Banking (tool use) | 38.1% | 30.9% |
| CharXiv (multimodal) | 86.2% | 84.5% |
| Humanity's Last Exam | 45.4% | **45.7%** |

Two things worth reading carefully. The gains concentrate in **agentic and tool-use** evals, not raw knowledge - τ³-Banking is the single largest jump. And HLE went **down** 0.3 points. This is a model tuned for doing, not for knowing.

Artificial Analysis Intelligence Index: **59 at high, 57 at medium, 52 at low** (3.7 Flash at high: 56). The whole high-vs-medium delta is **2 points of index for a 41% cost increase** ($0.58 vs $0.41 per task).

## The failure mode, named by the vendor

From Google's own launch post: *"3.8 Flash works harder. On complex tasks, it exhibits greater diligence - executing extra reasoning steps, and calling tools iteratively. At times, the model might use more tokens to maximize performance, especially at higher effort levels."*

And the docs: *"the model takes smaller reasoning steps, calls tools iteratively, and verifies its work along the way. Not every workflow needs this level of verification."*

That last sentence is the trap. **"Verifies its work along the way" is a claim about the model's internal loop, not about the repository.** On 2026-09-15 our Antigravity lane produced three outputs that were each internally verified and externally wrong.

## Measured against our own repos, 2026-09-15

One Antigravity run, three shipped artifacts, reviewed here. All three CI-green. All three had a defect that CI could not see.

| # | What it reported | What was true |
|---|---|---|
| 1 | "Updated phrase tokenizer to treat `[,;:!?]` as phrase boundaries" in `zol-grounding.js` on the Pi | The file is **unchanged at HEAD and the tree is clean**. Its own earlier `git checkout zol-grounding.js` reverted the edit, and the commit staged only `test-grounding.js` and `zol-estate-facts.js`. The reported mechanism does not exist |
| 2 | Provider-health "fast-trip for auth/quota errors" | `msg.includes("401") \|\| msg.includes("402")` on the whole error string. Four ordinary errors measured tripping a healthy provider out of the ladder: `"prompt is 1402 tokens"`, `"request req_a402f timed out"`, `"model qwen3-401b unavailable"`, `"timed out after 1401ms"` |
| 3 | Provider-health "hysteresis prevents flapping" | `transitionOnSuccess` returned `HEALTHY` directly from `UNAVAILABLE`, skipping `RECOVERING` and the success threshold entirely - the one hole that undoes the feature the file is named for |

The common thread is not weak reasoning. Each artifact is well-structured, richly commented, and argued in its own header. **The model wrote a correct description of a thing it did not build.** Failure 1 is a persistence failure, 2 is an untested-input failure, 3 is a code-contradicts-its-own-comment failure. Raising the thinking level addresses none of them.

## Community signal

The Hacker News launch thread (1,160 points, 669 comments) carries the same shape from people with no stake in our repos:

- *"It's pretty good if you can actively steer it"* - steering, not autonomy, is where the value is.
- *"one time I said 'Hi' and it built out a 4 panel hello world app with (fake) weather, a todo list, and a couple other things"* - over-building far past the ask, **and populating it with fabricated data**. That is failure mode 1 and 2 in one sentence, from a stranger.
- *"opus 5 medium outputs 4x fewer tokens to achieve the same result"* - the verbosity is visible from outside.
- Recurring benchmaxxing scepticism on the agentic numbers specifically.

## How to write tasks for it

| Do | Instead of |
|---|---|
| "Run `git show --stat <sha> -- <path>` and paste the output" | "Confirm the change is committed" |
| "Run the detector against these 6 strings and paste the table" | "Handle edge cases" |
| "List the files in the commit. If a file you edited is missing, say so" | "Commit your work" |
| "Change only X. If you believe Y also needs changing, stop and say why" | "Fix the module" |
| Name the thinking level per task: `low` for a rename, `medium` for a feature | Leaving it at one global level |
| "If a gate blocks you, report it verbatim and stop" | "Get the tests passing" |

Two rules that come straight out of today's three failures:

1. **Every claim needs a command.** Not "I verified" - the command and its output. The model is fluent enough that prose describing verification is indistinguishable from verification.
2. **A commit is not done until `git show --stat` lists the file.** The model edits a working tree and then narrates the edit as shipped. Ask for the file list, every time.

## Also See

- [Doc 434 — Claude Code Aux Model Routing](../../dev-workflows/434-claude-code-aux-model-routing/)
- [Doc 196 — Solo Developer + AI Coding Landscape 2026](../../dev-workflows/196-solo-dev-ai-coding-landscape-2026/)
- [Doc 089 — Paperclip + gstack + Autoresearch](../../dev-workflows/089-paperclip-gstack-autoresearch-stack/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set the Antigravity lane's `thinking_level` to `medium`; PR merged or config committed | @Zaal | Config | 2026-09-17 |
| Restore `.husky/pre-commit` in `~/Documents/ZAO OS V1` - the delegator resolves to itself, so the secret scan, PII scan, doc-collision and index gates have not run in that tree since 2026-09-11 23:57; `git checkout -- .husky/pre-commit` and confirm a test commit runs all four | @Zaal | Fix | 2026-09-16 |
| Add "paste the command output" wording to the Antigravity task template | @Zaal | Doc | 2026-09-18 |
| Re-validate this doc against 3.9 Flash when it ships (four Flash releases in four months) | @Zaal | Re-research | 2026-10-15 |

## Sources

- [What's new in Gemini 3.8 Flash — Gemini API, Google AI for Developers](https://ai.google.dev/gemini-api/docs/latest-model) [FULL — exa web_fetch, raw page text] — thinking levels, the `medium` recommendation for agentic coding, `minimal` unsupported, Antigravity default, migration notes
- [Gemini 3.8 Flash — Google Cloud Documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-3-8-flash) [FULL — exa web_fetch] — the 3.8-vs-3.7 benchmark table, token limits, deprecated sampling params
- [Introducing Gemini 3.8 Flash and 3.8 Flash Cyber — blog.google](https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/) [FULL — exa web_fetch] — "3.8 Flash works harder" design statement, DeepSWE v1.1, HLE-Verified 54.9%
- [Gemini 3.8 Flash Model Card — Google DeepMind](https://deepmind.google/models/model-cards/gemini-3-8-flash/) [FULL — exa web_fetch] — 1M context, intended use, eval scope
- [Google has released Gemini 3.8 Flash — Artificial Analysis](https://artificialanalysis.ai/articles/gemini-3-8-flash) [FULL — exa web_fetch, raw article] — index 59/57/52 by effort, $0.58/$0.41/$0.24 cost per task, 48k avg output tokens, 2.5 min time per task
- [Hacker News launch thread, 1,160 points / 669 comments](https://news.ycombinator.com/item?id=49537553) [FULL — hn.algolia.com/api/v1/items/49537553, full comment tree parsed, 669 comments] — steering, the fake-weather over-build, token verbosity vs Opus 5, benchmaxxing scepticism
- Our own measurement, 2026-09-15: ZAOOS PRs #3520, #3521, #3522 and `ZAODEVZ` Pi commit `0ec7681` [FULL — read from `gh pr diff`, `git show --stat`, and running the code] — the three-failure table above
