---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-29
related-docs: 918
original-query: "https://x.com/deronin_/status/2045420155434320270 + https://x.com/datachaz/status/2055929071733743693 /zao-research this (Claude Code token-cutting tools)"
tier: STANDARD
---

# 920 — Claude Code token-optimization toolkit (for the ZAO agent fleet)

> **Goal:** Catalogue the token-cutting tools from two viral threads (DeRonin, DataChaz) and pick what the ZAO fleet (ZOE + researchers + web-improver, all claude-CLI) should actually adopt to cut Claude spend.

## Why this matters to ZAO

The fleet runs many claude-CLI agents 24/7 (ZOE orchestrator, Pi researchers, web-improver, ecosystem-watch). Token spend is the main running cost. These tools claim 40-98% context reduction. Even modest wins compound across the fleet.

## The tools (deduped across both threads)

| Tool | What it does | Claimed saving | Repo |
|------|--------------|----------------|------|
| RTK (Rust Token Killer) | CLI proxy filters terminal output before it hits context | 60-90% on dev commands | github.com/rtk-ai/rtk |
| Context Mode | Sandboxes raw tool output into SQLite; only summaries enter context | 98% on Playwright/GitHub/logs | (Claude Code plugin) |
| code-review-graph | Tree-sitter graph so Claude reads only relevant code | 49x on big monorepos | github.com/tirth8205/code-review-graph |
| claude-context (Zilliz) | Code-search MCP, hybrid BM25 + dense vector | ~40%, equivalent retrieval | github.com/zilliztech/claude-context |
| claude-token-optimizer | Reusable setup prompts; cuts doc tokens 11K -> 1.3K | 90% in 5 min | github.com/nadimtuhin/claude-token-optimizer |
| token-optimizer | Finds "ghost tokens"; survives compaction | context-decay fix | github.com/alexgreensh/token-optimizer |
| Caveman Claude | Forces terse caveman output | ~75% output tokens, "no accuracy loss" | github.com/juliusbrussee/caveman |

Note: Caveman Claude is ALREADY active in this session (the caveman SessionStart hook). Live proof the pattern works for output-token reduction.

## Recommendation for the fleet

Pick 2-3 by workflow (per DataChaz's own advice - do not stack all):
1. **RTK** - highest leverage for the fleet: the researchers + web-improver run heavy terminal/curl/git output. A proxy that filters before context = 60-90% on exactly our hot path. EVALUATE FIRST.
2. **Context Mode** - the fleet uses MCP servers (Playwright, supabase, github); 98% on those is the second-biggest win.
3. **claude-context (Zilliz)** - for code-heavy agents (web-improver, codebase-agent) that grep big repos.

Caveman is already proven in-session for output. The "setup prompt" tools (claude-token-optimizer) are one-time wins, lower priority.

DO NOT adopt blindly: each is a 3rd-party binary/MCP touching agent context. Vet for secret-safety (these proxies see tool output) before wiring into a bot that holds tokens. Test on the Pi researchers first (lowest risk, read-only), measure actual saving, then roll to ZOE.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Trial RTK on a Pi researcher; measure token delta | Zaal+Claude | Spike | next session |
| Vet RTK + Context Mode for secret-safety (they see tool output) | Zaal | Security check | before fleet rollout |
| If RTK wins, wrap into the fleet claude-CLI launch | Claude | PR | after trial |

## Sources

- [DeRonin thread - 10 repos to cut tokens 60-90%](https://x.com/deronin_/status/2045420155434320270) - FULL (text fetched via FxTwitter)
- [DataChaz thread - 10 tools to stop burning tokens](https://x.com/datachaz/status/2055929071733743693) - FULL (text fetched via FxTwitter)
- Repos above - PARTIAL (listed from threads; individual READMEs not yet fetched - verify claims before adopting)
