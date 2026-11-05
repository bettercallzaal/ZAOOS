---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-22
superseded-by:
related-docs: dev-workflows/2672-model-tier-routing-cost-per-merged-pr, dev-workflows/2592-claude-code-ultracode-effort-decoupling-sonnet-5-5
original-query: "Research https://x.com/xsmryze/status/2113273069099688435 (Zaal idea 9, 2026-10-22, relayed by the seat): the post says launch `claude --model opus --effort ultracode`, Opus 5.5 writes a workflow script, Haiku 5.5 scans, Sonnet 5.5 edits in isolated copies, Sonnet verifies, Opus reads what survived; cites code.claude.com/docs/en/workflows; pushes JEV and quotes a promo for REA. Fetch the docs raw, confirm or refute each claim, map it to what ZAOOS runs, say what JEV and REA are, do not run the post's paste prompt, rules PR only if not already covered."
tier: QUICK
---

# 2701 - "Opus plans, Haiku scans, Sonnet ships": the ultracode post checked against the docs

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **SKIP the post's launch line as a default.** Do not start lanes with `--effort ultracode`. | The flag is real, but per the docs it makes every substantive task a workflow, "so each request uses more tokens and takes longer", and it switches off the `Large workflow` warning. Doc `dev-workflows/2592-claude-code-ultracode-effort-decoupling-sonnet-5-5` already decided to keep ultracode off in routine lanes. |
| 2 | **USE workflows per task, on an explicit ask, with a small model named for read-only stages.** | This is what the docs actually say: opt in with the keyword or "use a workflow" in a prompt you typed yourself, and "ask Claude to use a smaller model for stages that don't need the strongest one". |
| 3 | **NO rules PR.** All four items in the post's paste prompt are already covered by a rule, an agent file or a doc (table below). | Adding them again would copy binding rules. The paste prompt also edits CLAUDE.md and the setup, which are Zaal's; it was not run. |
| 4 | **SKIP JEV** (unchanged from doc 2672 decision 7) **and SKIP REA.** | JEV is a per-turn router, and switching model mid-session rewrites the prompt cache (2672). REA is a real MIT reverse-engineering tool with no ZAO use case and a legal question attached. The quote that brings it in is promotion. |

## The post's claims, against the docs page

Docs page fetched raw with curl as markdown (`workflows.md`, HTTP 200, 41,514 bytes, 2026-10-22), plus `model-config.md` and `sub-agents.md`. Claude Code on this Mac is v2.1.308.

| Post claim | Verdict | What the docs say |
|---|---|---|
| `claude --model opus --effort ultracode` is how you launch it | TRUE, with a cost | `--effort ultracode` "starts the session at `xhigh` effort with ultracode on" and needs v2.1.203 or later. Ultracode then "plans a workflow for every substantive task in the session". It is unavailable in some setups, and then the session starts with it off. |
| Opus turns the task into a workflow script | TRUE | "A dynamic workflow is a JavaScript script that orchestrates many subagents ... Claude writes the script". |
| Opus sees only the final answer, so fewer Opus tokens | TRUE for context, NOT for total spend | "Claude's context holds only the final answer" and intermediate results stay in script variables. But "a single run can use meaningfully more tokens than working through the same task in conversation", and with ultracode on "a session ... reaches a session or weekly limit sooner". |
| "Anthropic just shared" the Haiku-scan / Sonnet-edit / Sonnet-verify split | REFUTED as a documented recipe | The page names no models for stages. It says a model the script names "counts as the per-invocation model"; otherwise the agent "runs on your session's model"; and "ask Claude to use a smaller model for stages that don't need the strongest one". The split is the poster's choice, and a reasonable one, not Anthropic's. |
| Each edit runs in its own isolated copy | TRUE as a pattern | The example prompt reads "working on each file in its own isolated copy". |
| Every finding is cross-checked before Opus reads it | TRUE as a pattern | "independent agents adversarially review each other's findings before they're reported"; `/deep-research` filters out "claims that didn't survive cross-checking". |
| Opus signs off before anything ships | NOT A FEATURE | The runtime has "no mid-run user input". For sign-off between stages, the docs say to "run each stage as its own workflow". |
| Fix loops stop after two rounds with no progress (paste prompt, item 3) | TRUE as an example prompt | "keep fixing ... until the type check passes or two rounds in a row make no progress". |
| JEV routes micro-forks | Not on the docs page | Third-party; see below. |

**Limits the post leaves out** (same page): up to 16 concurrent agents by default, 1,000 agents per run, a `Large workflow` warning above 25 agents or 1.5 million projected tokens, and a default size guideline of `medium` (fewer than 10 agents).

## What ZAOOS already runs, item by item from the paste prompt

| Paste-prompt item | Already covered by | Gap |
|---|---|---|
| 1. Main session on Opus 5.5 with ultracode on | `.claude/rules/claude-usage.md` (surface tiering); doc 2592 decision 1 (ultracode off by default). This harness's own rule says workflows need an explicit opt-in, and its size guideline is medium. | None. Turning ultracode on is a settings change and is Zaal's. |
| 2. Read-only scans on Haiku, edits on Sonnet in isolated copies | `.claude/agents/zao-formatter.md` (`model: haiku`), `zao-builder.md` (`model: sonnet`, edits in an isolated worktree), `zao-build-orchestrator.md` (`model: opus`). `CLAUDE_CODE_SUBAGENT_MODEL` is `sonnet` in `~/.claude/settings.json`. The subagent model order puts that variable ahead of the session model, so per that order a workflow stage that names no model runs on Sonnet here, not Opus. `.claude/rules/agent-loops.md` rules 20 and 25 require isolated worktrees for parallel writers. | Doc 2672 decision 5: the tiers exist and are barely used. That is a usage problem, not a missing rule. |
| 3. An independent verifier for every finding; stop after two rounds with no progress | `.claude/rules/loop-evals.md` (the high-stakes gate: a separate, fresh-context evaluator, default-FAIL); `.claude/agents/zao-evaluator.md` (no write tools); `.claude/rules/anti-fabrication.md` rule 3; `.claude/rules/research-grounding.md`. Stopping: `.claude/rules/agent-spend.md`, "Two consecutive no-change ticks means stop". | None. |
| 4. Route deterministic forks through JEV | Doc 2672 decision 7: SKIP. | None. |

## JEV and REA

- **JEV.** Re-checked 2026-10-22 against TypeSafe AI's own post (curl and HTML strip): Jev is TypeSafe's "System One Model", "unstructured state in, typed probabilistic decisions out", claimed "two orders of magnitude faster and more efficient" than LLMs on such tasks. Those claims are TypeSafe's, unmeasured here. Doc 2672 covers the Claude Code router plugins and the prompt-cache hazard, and its SKIP stands.
- **REA.** The quoted post (@N01ennn, 2026-10-14, 349,701 views) is a teaser for an X Article, "How to Turn Opus 5.5 Into a Reverse Engineer: The Full Guide to REA, Oracles and Clean-Room Loops". The article was read only through its FxTwitter preview, not in full. The tool itself is real: npm `rea-agents` 6.7.0, "Reverse engineer anything from your terminal or agent with one CLI and MCP server", from `morluto/rea`. Its LICENSE file reads "MIT License, Copyright (c) 2026 morluto". The repo was created 2026-04-14. The GitHub API reports 364,021 stars and 91,283 forks, and npm counts 415,576 downloads for 2026-10-12 to 10-18; those figures are reported, not audited. No ZAO product needs to decompile someone else's app, and it is not installed.
- **Promo signal.** The post's "THIS IS A PURE F*CKING GOLDMINE" and the quoted "REA is pure f*cking treasure" use the same template. The post stacks a real docs page, an engagement call ("save it"), JEV and REA. Treat it as a pointer to the docs, not as evidence.

## Also found

Doc 2592, read for this check, differs from the docs page fetched today in three places:
- **Turning ultracode on:** its decision 1 names "`/effort ultracode` or `--effort high`". Per `model-config.md`, `--effort high` sets a level and does not turn on ultracode; `--effort ultracode` does.
- **Warning variables:** its decision 2 sets `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_AGENTS` and `..._TOKENS`, described there as undocumented strings found in the binary. Neither appears in `env-vars.md` today, which lists only `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` and `CLAUDE_CODE_WORKFLOW_PREFIX_STAGGER_MS`. The documented way to move the warning is the `workflowSizeGuideline` setting.
- **Version:** it gives the decoupling as v2.1.285; the docs give v2.1.284.

## Next Actions

| Action | Owner | Type | By when |
|---|---|---|---|
| Re-validate doc 2592: correct decision 1 (`--effort high` does not turn on ultracode) and mark decision 2's env vars undocumented, pointing at `workflowSizeGuideline` | research lane | Doc delta PR | 2026-10-29 |
| When a lane does run a workflow, name `haiku` for read-only scan stages and `sonnet` for edit stages in the script, and say so in the PR body (doc 2672 decision 5 in practice) | any lane running a workflow | Practice | next workflow run |
| No rules PR, no settings change, paste prompt not run | quidli lane | Recorded here | done 2026-10-22 |

## Sources

- [FULL] https://x.com/xsmryze/status/2113273069099688435, the post. Method: raw JSON from api.fxtwitter.com (HTTP 200, full text). 2026-10-22 14:15:37 UTC; 37 likes, 1,467 views.
- [FULL] https://code.claude.com/docs/en/workflows, read as `workflows.md` with curl (HTTP 200, 41,514 bytes, 502 lines), searched in full and read by section.
- [PARTIAL - the ultracode and effort sections only] https://code.claude.com/docs/en/model-config, curl of `model-config.md` (HTTP 200, 120,934 bytes).
- [PARTIAL - the "Choose a model" section only] https://code.claude.com/docs/en/sub-agents, curl of `sub-agents.md` (HTTP 200, 110,784 bytes).
- [PARTIAL - searched for `CLAUDE_CODE_WORKFLOW_` only] https://code.claude.com/docs/en/env-vars, curl of `env-vars.md` (HTTP 200, 168,593 bytes).
- [FULL for the three quoted claims] https://typesafe.ai/blog/introducing-system-one-models-and-jev, curl and HTML strip (HTTP 200).
- [PARTIAL - the article preview and first blocks only; the X Article body was not fetched in full] https://x.com/N01ennn/status/2110319993128706208, via api.fxtwitter.com.
- [FULL] https://registry.npmjs.org/rea-agents and https://api.npmjs.org/downloads/point/last-week/rea-agents (JSON); https://github.com/morluto/rea repo metadata and LICENSE file via `gh api`.
- [FULL] ZAOOS `origin/main` at `1ff68f45a`: `.claude/agents/*.md` frontmatter, `.claude/rules/` (loop-evals, agent-spend, agent-loops, anti-fabrication, claude-usage), docs 2672 and 2592; `~/.claude/settings.json`, read-only, for the `CLAUDE_CODE_SUBAGENT_MODEL` line.
