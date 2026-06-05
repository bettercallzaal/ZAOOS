---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-06-05
superseded-by:
related-docs: 796
original-query: "Serena (oraios) - semantic code MCP toolkit + the JetBrains Plugin landing page (oraios-software.com). What it is, is it worth using, JetBrains plugin tradeoffs."
tier: STANDARD
---

# 797 - Serena: semantic-code MCP toolkit + JetBrains Plugin

> **Goal:** Decide whether Serena (the IDE-for-your-agent MCP) earns its place in the ZAO/BCZ Claude Code stack, whether the paid JetBrains Plugin is worth buying, and the failure modes to watch (memory blowups, LSP deadlocks).

## Key Decisions

| Decision | Verdict | Reason |
|----------|---------|--------|
| Keep Serena (LSP backend, free) in the Claude Code stack | KEEP - it is already active in this session | Serena is wired into Zaal's Claude Code (the SessionStart hook activates the cwd as a Serena project). Independent benchmark (ManoMano, 36K-line Java): Serena was the ONLY config that finished a refactor with all tests passing - $27.30/45min vs vanilla Claude $23.54/fail and Claude's built-in LSP $28.63/fail. Token-budget data (Thingstead): 43% lower total session cost because it ends sessions in fewer turns. |
| Buy the paid JetBrains Plugin | SKIP for now - LSP backend covers ZAOOS | ZAOOS is a single-language TS/React codebase; the free language-server backend already gives find-symbol, find-references, rename, symbolic edits. The Plugin's exclusives (move/inline/propagate-deletions, interactive debugging, type hierarchy, external-lib indexing) matter most for large polyglot/Java/Kotlin monorepos. Revisit IF you start a big multi-language repo or want agent-driven step-debugging. Plugin is paid (free trial); core stays MIT/free. |
| Use Serena for quick read-only lookups ("find a business rule") | SKIP - use native Claude | ManoMano found Serena cost ~4x more and took 60% longer on low-context lookups. Toggle it off with `/mcp` for exploration; turn on for refactors/writes. |
| Run Serena globally across every project | SKIP - register per-project | Serena's ~15 tool defs add ~3,000 tokens/turn to every request for the session's life (Thingstead). Per-project registration keeps that overhead off projects that do not need it. Global+local double-registration also causes an init doom-loop (Issue #904). |
| Trust default memory/cache limits on a TS/JS repo | NO - exclude node_modules | TS language server indexing `node_modules` is the #1 cause of runaway cache/RAM (Issue #944: 30GB RAM exhaustion, 6.2GB cache). Set `exclude_libs = true` for the TS language server and exclude `**/node_modules/**`. A core PR cut cache memory ~100x; keep Serena updated (v1.5.3+, 2026-05-26). |

## What it is

Serena (by Oraios Software / Jain & Panchenko Software Solutions GbR, Germany) is an open-source MCP server that gives a coding agent **IDE-grade semantic tools** - operating at the symbol level (find symbol, find references, rename, move, type hierarchy) instead of reading whole files or running grep. It does the *retrieval/editing*; the LLM (Claude, GPT, etc.) does the reasoning.

Repo facts (`github.com/oraios/serena`, verified 2026-06-05):
- **24,948 stars** (note: the marketing site still says "17k" - stale), 1,668 forks, **170 contributors**
- **MIT license**, Python (89.7%), created 2025-03-23, **v1.5.3** released 2026-05-26, last push 2026-06-04
- Installed via `uv`: `uv tool install -p 3.13 serena-agent` then `serena init`
- Integrates with Claude Code, Codex, Claude Desktop, Cursor, JetBrains, OpenWebUI, etc. via MCP
- IMPORTANT (from their README): do NOT install via an MCP/plugin marketplace - those carry outdated commands; use the uv quick-start

### Two backends

| | Language Servers (default, FREE) | JetBrains Plugin (PAID, free trial) |
|---|---|---|
| Cost | Free/OSS | Paid via JetBrains Marketplace |
| Languages | 40+ via LSP | All JetBrains-supported (NOT Rider/CLion) |
| find symbol / references / symbolic edit | yes | yes |
| rename | symbols only | symbols, files, directories |
| move / inline / propagate-deletions | no | yes |
| type hierarchy / search project dependencies | no | yes |
| interactive debugging (breakpoints, inspect vars, REPL) | no | yes (exclusive) |
| external library indexing | partial | full |
| setup | per-language LSP install | no extra setup, uses IDE engine |

Config: `~/.serena/serena_config.yml` (global) + `.serena/project.yml` (per-project). To use the JetBrains backend: `language_backend: JetBrains` or `serena start-mcp-server --language-backend JetBrains`.

## Findings

### 1. The value is real and independently benchmarked

- **ManoMano (Project Aegis, 2026-03)** pitted Vanilla Claude vs Claude Code built-in LSP vs Claude+Serena on a 36K-line / 381-class Java refactor. Only Serena delivered a building project with all tests passing (45 min, $27.30). Vanilla spun up 12 confused subagents, ran an hour, failed. Built-in LSP gave up after 3 iterations with 9 tests failing and "hallucinated methods and missing test classes." ManoMano now commits the `.serena` memory folder so all contributors share project memories.
- **Thingstead token-budget analysis**: Serena does NOT make turns cheaper (per-turn cost ~identical, ~3,000 token overhead/turn). It makes total sessions cheaper - 43% lower avg session cost ($1.79 to $1.02), -15% tokens/turn - because symbol-precision navigation finishes in fewer turns. Mental model: "fewer turns needed," not "cheaper turns."
- Agent self-eval (Opus 4.6, GPT-5.4): all independently said they'd want Serena for cross-file renames/moves/reference lookups that otherwise cost "8-12 careful, error-prone steps."

### 2. The failure modes are also real (all on large/polyglot repos)

- **Memory exhaustion (Issue #944, Jan 2026):** Serena's Python process hit ~30GB RAM three times, freezing Claude Code, even in SSE mode. Root cause = language-server indexing (esp. TS indexing `node_modules`; 6.2GB cache observed). Fix: exclude libs + a core PR that cut memory ~100x. Lesson: do not run defaults on a big JS/TS repo.
- **LSP repeated-init deadlock (Issue #634):** Go monorepos with multiple modules + `vendor` dirs caused infinite "Created View" loops and MCP tool timeouts. Reportedly fixed by a later gopls/bugfix.
- **Token output hangs (Issue #249):** Claude Code output freezes mid-generation; usually the underlying language server deadlocking (seen in TS, Go, Jekyll; Python mostly stable). Sometimes only removing the MCP unsticks it.
- **Dual-config doom loop (Issue #904):** registering Serena in BOTH global and per-project scope with the same name causes an infinite dashboard/init loop that drains tokens. Register once, per-project.

### 3. When to reach for it (from the Thingstead/ManoMano split)

- Deep code modification / refactor / writing tests across files: Serena MANDATORY.
- Mapping call graphs ("all callers of X", inheritance trees, every implementation of an interface): Serena.
- Quick read-only "find the business rule" exploration: native Claude (Serena 4x cost, 60% slower).
- Best combo: a semantic-search tool (ck-search/ast-grep) surfaces the symbol, then Serena maps its graph.

## Relevance to ZAO / BCZ

- Serena is ALREADY in Zaal's Claude Code: the SessionStart hook this session reads "Activate the current working directory as project using Serena's tools... read Serena Instructions Manual." So the LSP backend is live on ZAOOS (TS/React). Ground-truth, not aspirational.
- ZAOOS is exactly the brownfield TS codebase where Serena pays off (301 API routes, 279 components per CLAUDE.md) - symbol navigation beats grep across that surface. But it is also exactly the repo where the `node_modules` indexing memory bug bites: confirm `.serena` config excludes `node_modules`/`.next`/`dist`.
- Ties to [Doc 796](../796-zen-browser-firefox-fork-daily-driver/) (dev daily-driver tooling eval) and memory `project_cc_cloud_container_default` - the cloud container also needs Serena via uv if you want parity with the Mac.
- Note: this repo just suffered a git-pack corruption (memory `project_git_pack_corruption_repair`). Serena's heavy LSP indexing + `.serena/cache` growth is worth watching as a disk-pressure contributor, though it was NOT the cause there (interrupted `git gc` was).

## Also See

- [Doc 796](../796-zen-browser-firefox-fork-daily-driver/) - Zen Browser dev daily-driver eval (sibling tooling doc)
- Memory `project_cc_cloud_container_default` - cloud container is the parity target for Serena setup
- Memory `project_git_pack_corruption_repair` - disk-pressure context

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Verify ZAOOS `.serena/project.yml` excludes `node_modules`/`.next`/`dist` and TS `exclude_libs = true` (prevents the 30GB/6.2GB blowup) | @Zaal | Config check | This week |
| Confirm Serena registered per-project (not global+local) to avoid the #904 doom loop and ~3k tok/turn on unrelated repos | @Zaal | Config check | This week |
| Keep Serena pinned to v1.5.3+ (has the ~100x cache memory fix) - `uv tool upgrade serena-agent` | @Zaal | Maintenance | Standing |
| SKIP the paid JetBrains Plugin until a large polyglot/Java repo or agent-step-debugging need appears | @Zaal | Decision | N/A |
| If parity wanted, install Serena via uv in the claude.com cloud container | @Zaal | Setup | When cloud-container coding resumes |

## Sources

- [oraios/serena GitHub README](https://github.com/oraios/serena) - [FULL] stars/license/version/backends/feature tables/quick-start, fetched via exa web_fetch
- [Serena official docs - About](https://oraios.github.io/serena/01-about/000_intro.html) - [PARTIAL - exa highlights of intro + MCP client list]
- [Oraios Software JetBrains Plugin page](https://oraios-software.de/serena_jetbrains_plugin.php) - [PARTIAL - exa highlights; the .com variant returned HTTP 503, the .de mirror resolved with full feature copy]
- [ManoMano Tech - Project Aegis: Benchmarking AI agents, why Serena is our must-have](https://medium.com/manomano-tech/project-aegis-benchmarking-ai-agents-and-why-serena-is-our-new-must-have-311673db35dd) - [PARTIAL - exa highlights incl. full cost/time/pass-fail numbers for all 3 configs]
- [Thingstead - Budgeting Your Claude Code Tokens](https://blog.thingstead.io/budgeting-your-claude-code-tokens/) - [PARTIAL - exa highlights incl. the per-turn token table + 43% session-cost figure]
- [Issue #944 - Serena consumes ~30GB RAM, freezes Claude Code](https://github.com/oraios/serena/issues/944) - [PARTIAL - exa highlights incl. the node_modules/exclude_libs fix table + ~100x PR]
- [Issue #634 - LSP repeated init causing timeouts (Go monorepos)](https://github.com/oraios/serena/issues/634) - [PARTIAL - exa highlights of repro + resolution]
- [Issue #249 - MCP token output stops/hangs](https://github.com/oraios/serena/issues/249) - [PARTIAL - exa highlights of multi-language reports]
- [Issue #904 - dual global+local config doom loop](https://github.com/oraios/serena/issues/904) - [PARTIAL - exa highlights]
- [SmartScope - Serena MCP setup guide 2026](https://smartscope.blog/en/generative-ai/claude/serena-mcp-implementation-guide/) - [PARTIAL - exa highlights of uv/context flags + read_only safety guidance]
