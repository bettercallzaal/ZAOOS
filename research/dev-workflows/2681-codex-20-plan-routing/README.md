---
topic: dev-workflows
type: decision
status: review-pending
last-validated: 2026-10-16
related-docs: "2664, 2672, 2675"
original-query: "moving work to the Codex 20 dollar plan: its real limits from OpenAI's pricing and docs pages, codex exec non-interactive mode, AGENTS.md, MCP, worktrees, what the community reports works and fails on that tier (Reddit, HN, GitHub issues), the lane tasks of the last 7 days (gh pr list across bettercallzaal and ZAODEVZ repos) with which ones Codex could have done, and a routing rule proposal."
tier: QUICK
---

# 2681 - Routing ZAO work to the Codex plan

> **Goal:** Decide which bounded lane tasks move to Codex without treating it as a replacement for grounded repository work.

## Key Decisions

| Decision | Rationale |
|---|---|
| USE Codex for mechanical, fully specified changes and adversarial review. | `codex exec` accepts a non-interactive prompt and a working directory; it fits isolated worktrees with explicit acceptance criteria. |
| KEEP Claude Code for grounded live-code work. | ZAOOS rules, hooks, and skills are established there; `AGENTS.md` and `.claude/rules/` provide the operating contract. |
| USE MCPs one at a time, with the least privilege needed. | A failed MCP must be removed or disabled before adding another; the 2026-10-16 stale `node_repl` path was a concrete startup failure. |
| REQUIRE worktrees and PRs for Codex writes. | `scripts/zoe-autodeploy.sh` and the binding workflow rule already use `git worktree` isolation. |

## Findings

| Capability | Evidence | ZAO use |
|---|---|---|
| Non-interactive execution | `codex exec --help` exposes `exec`; a local smoke test returned the requested exact text on 2026-10-16. | CI-like review, scoped edits, and mechanical documentation changes. |
| Repository instructions | This repository's `AGENTS.md` provides commands, boundaries, and PR-only workflow. | Put the exact task, file list, and verification command in each Codex brief. |
| MCPs | Official Codex MCP documentation was fetched on 2026-10-16. | Start with GitHub, then Google Drive/Calendar; do not install broad connectors by default. |
| Worktrees | `scripts/zoe-autodeploy.sh:86-96` creates and removes a verification worktree. | One Codex lane per worktree, branch off `origin/main`, never direct-edit the shared checkout. |

## Community signal

One GitHub issue provides a concrete `codex exec --json` limitation: its author reports that context-compaction lifecycle events are omitted from the JSON stream, so an embedding application cannot log that event. An HN commenter describes using agent CLIs as a Linux utility for CI and PR review. These are user reports, not plan-limit measurements. The local failure was measured directly: a deleted application path produced `MCP startup failed: No such file or directory`; removing the stale entry made `codex exec` start cleanly.

The requested seven-day PR inventory could not be obtained: GitHub's owner-repo pagination returned no rows on 2026-10-16. This is an instrument result, not evidence that there were zero PRs. Re-run it with authenticated REST pagination before assigning a percentage of lane work.

## Routing rule

| Lane task | Route |
|---|---|
| Exact file-list change, test supplied, reversible PR | Codex in a fresh worktree |
| Research triage or Docs/Sheets output | Gemini CLI |
| Live-code discovery, multi-file design judgment, or release verification | Claude Code |
| Small private text conversion | local Ollama only |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Install the GitHub connector and verify `codex mcp list` shows it connected | Zaal | Setup | 2026-10-23 |
| Re-run authenticated PR inventory and publish a counted routing sample | codex lane | Research PR | 2026-10-23 |
| Apply the routing table from doc 2675 | Zaal | Review PR #3966 | 2026-10-23 |

## Sources

- [OpenAI Codex CLI](https://developers.openai.com/codex/cli/) [FULL - fetched 2026-10-16]
- [OpenAI Codex MCP](https://developers.openai.com/codex/mcp/) [FULL - fetched 2026-10-16]
- [OpenAI Codex agents](https://developers.openai.com/codex/agents/) [FULL - fetched 2026-10-16]
- [OpenAI ChatGPT pricing](https://openai.com/chatgpt/pricing/) [FULL - fetched 2026-10-16; no Zaal plan price recorded]
- [openai/codex #50593: `exec --json` context-compaction lifecycle](https://github.com/openai/codex/issues/50593) [FULL - issue body fetched 2026-10-17]
- [HN 43708025: OpenAI Codex CLI](https://news.ycombinator.com/item?id=43708025) [FULL - thread and top comments fetched 2026-10-17]
- Reddit Codex plan reports [FAILED - reddit.com returned a block page; Redlib mirrors at redlib.private.coffee, redlib.perennialte.ch, and redlib.tux.pizza failed or returned no result on 2026-10-17. Requires a fetched thread before this can become research-complete]
- [Doc 2664](../2664-claude-working-style-ported-to-codex/) [FULL - local repository source]
- [Doc 2675](../2675-claude-rate-limit-multi-tool-routing/) [FULL - local repository source]
