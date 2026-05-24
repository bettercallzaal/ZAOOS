---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-23
related-docs: 154, 408, 429, 440, 459, 523, 601, 687
original-query: "Serena MCP server - how can ZAO OS use it? Deep dive on practical integration patterns for: ZAOOS monorepo, bot/src/zoe + bot/src/hermes, graduation workflow (safe_delete_symbol + find_referencing_symbols), .serena/memories/, Hermes auto-PR pipeline, onboarding agents to research/ + governance/, hooks integration. Cover alternatives (tree-sitter, ast-grep, gh CLI, plain LSP) and a concrete plan across all 5 primary surfaces."
tier: STANDARD
---

# 728 — Serena MCP for ZAO OS: Integration Plan Across All 5 Primary Surfaces

> **Goal:** Adopt Serena (oraios LSP-backed MCP) as the standard semantic-code layer for every ZAO surface (ZAOOS monorepo, ZOE, Hermes, ZAO Devz, Bonfire, ZAOstock bot) — cut Claude token spend, make graduation-deletion safe, give agents shared per-project memory.

## Key Decisions (Recommendations First)

| # | Decision | Reason | Action |
|---|----------|--------|--------|
| 1 | **USE Serena as the default code-intel MCP for every ZAO repo** | 60-80% token reduction on file-read heavy tasks; LSP-backed renames are atomic vs grep-and-replace | Already installed at `.serena/project.yml`; finish hook wiring (Action #1) |
| 2 | **ADD Serena auto-approve + SessionStart hooks to `.claude/settings.json`** | Today every `mcp__serena__*` call triggers a permission prompt — friction kills adoption | Append the hooks block (see Section "Hook Wiring") |
| 3 | **RUN `mcp__serena__onboarding` once per surface** to populate `.serena/memories/` | The directory has 1 misplaced UVR memory and zero project-structure entries — agents start cold every session | Run onboarding on ZAOOS root + each bot subtree |
| 4 | **USE `safe_delete_symbol` + `find_referencing_symbols` as the GRADUATION DELETE PROTOCOL** | `CLAUDE.md` mandates "code DELETED from ZAOOS" on graduation; today this is grep + pray | Wire into `/ship` skill graduation branch (Action #5) |
| 5 | **SKIP JetBrains backend** | Paid plugin; LSP backend already covers TypeScript (your primary lang) + Python + Go + Rust + Solidity (via LSP) for free | Keep `language_backend:` unset in `project.yml` |
| 6 | **SKIP grepai / ast-grep / Sverklo for now** | Serena + ripgrep already cover ~95% of ZAOOS needs. ast-grep only earns its slot during a structural migration | Reassess if/when ZAOOS does an RSC migration or Next.js codemod |
| 7 | **ADOPT per-project `.serena/memories/` as parallel-session-safe knowledge cache** | Different from your global `~/.claude/.../memory/`; survives session restarts; checked into git for team share | Convert top 5 `MEMORY.md` index lines that are project-specific to `.serena/memories/*.md` |
| 8 | **EXPOSE Serena over HTTP/SSE on VPS 1** for shared bot use (Phase 2) | Hermes (KVM 2 at 31.97.148.88) + ZOE + ZAOcoworkingbot (Iman VPS) could share one Serena index | Wait until LSP cold-start cost dominates — currently single-laptop usage |

## Current State (Verified 2026-05-23)

| Asset | Path | Status |
|-------|------|--------|
| Serena project config | `.serena/project.yml` | EXISTS, TypeScript LSP, project_name "ZAO OS V1", read_only:false |
| Serena project memories | `.serena/memories/` | 1 file: `project_uvr_playbook.md` (misplaced — UVR is research content, not project struct) |
| Serena tools wired into Claude | `mcp__serena__*` in deferred tool list | YES — 21 tools available |
| Claude Code project settings | `.claude/settings.json` | EXISTS, has hooks for lint/typecheck/branch-guard/notification — NO Serena hooks |
| Serena dashboard | `127.0.0.1:24289/dashboard/` | Running when MCP active; shows live tool call stream |
| Project-side bot code | `bot/src/zoe/`, `bot/src/hermes/`, `bot/src/devz/`, `bot/src/teams/` | All TypeScript, all benefit from Serena |
| Agent trading stack | `src/lib/agents/` (autostake, banker, burn, cast, dealer, runner, swap, vault, wallet, events, types, config) | 13 files — prime `find_referencing_symbols` territory |

## Findings

### Why Serena over plain Read/Grep

Independent benchmarks from 4 different dev-blog reviews converge on the same number: **60-80% token reduction** on read-heavy tasks ([hanafifirman](https://hanafifirman.dev/en/blog/serena-mcp-token-efficiency/), [eknath/MangoDriod](https://md.eknath.dev/posts/ai-ml/serena-claude-code-setup/), [aya.is](https://aya.is/en/stories/20260413-serena-mcp-semantic-code-assistant), [dudarik](https://dudarik.com/en/blog/serena-mcp/)).

MangoDriod (Feb 2026) measured concrete numbers on a multi-module KMP codebase:

| Session Type | Without Serena | With Serena | Savings |
|---|---|---|---|
| Quick exploration | 10k tok | 3k tok | ~70% |
| Feature implementation | 50k tok | 15k tok | ~70% |
| Full-day coding | 200k tok | 60k tok | ~70% |
| Monthly (20 days) | 4M tok | 1.2M tok | ~$8.40 on API |

For ZAOOS at **301 API routes + 279 components + 19 hooks**, this matters. The current pattern of `Read file.tsx → grep for symbol → Read related file` is exactly what Serena's `find_symbol` collapses into one call returning only the relevant symbol body.

The Opus 4.6 (high) practitioner quote from the Serena README:

> "Serena's IDE-backed semantic tools are the single most impactful addition to my toolkit — cross-file renames, moves, and reference lookups that would cost me 8-12 careful, error-prone steps collapse into one atomic call, and I would absolutely ask any developer I work with to set them up."

### Contexts + Modes (use `claude-code` + `editing` for ZAOOS)

Serena ships **5 contexts** (client profiles) and **9 modes** (task postures):

| Context | When | What it does |
|---------|------|--------------|
| `desktop-app` | Claude Desktop, shared Docker | Full toolset |
| **`claude-code`** | **Claude Code (ours)** | **Disables tools that overlap with Claude Code's built-in Edit/Write/Bash — avoids conflicts. Single-project.** |
| `ide` | VS Code, Cursor, Cline | Semantic-only; assumes IDE handles file ops |
| `codex` | OpenAI Codex CLI | Tool-call format optimized for Codex |
| `agent` | Agno / autonomous loops | Broader autonomy |

| Mode | When |
|------|------|
| `planning` | Read-only analysis, design docs |
| `editing` | Direct code modification (DEFAULT for our work) |
| `interactive` | Conversational back-and-forth |
| `one-shot` | Single-response tasks (incompatible with `interactive`) |
| `no-onboarding` | Skip auto-onboarding on first use |
| `no-memories` | Disable memory tools entirely |
| `onboarding` | Force onboarding routine |
| `query-projects` | Cross-project queries (only useful in multi-project context) |

**Recommendation for ZAOOS:** `--context=claude-code --mode=editing`. For research/audit sessions: switch to `--mode=planning` (read-only stance, safer).

### Memory: `.serena/memories/` is NOT the same as `~/.claude/.../memory/`

| | `~/.claude/projects/-Users.../memory/` | `.serena/memories/` |
|---|---|---|
| Scope | Cross-project, single user | Per-project, in repo |
| Visible to | Only Claude Code | Any MCP client reading the project |
| Checked into git? | No (user-private) | **Yes by default** (team-shared) |
| Loaded automatically? | Yes via `MEMORY.md` index | No — must call `read_memory` or `list_memories` |
| Best use | Zaal's preferences, feedback rules, person profiles | Project structure, build commands, file conventions, "where is X" notes |

The current `.serena/memories/project_uvr_playbook.md` is misplaced — UVR is research content (Doc 560). It should live in `research/community/` instead. Project-memory candidates worth writing into `.serena/memories/` for ZAOOS:

1. `project_structure.md` — the table in `CLAUDE.md` "Project Map"
2. `commands.md` — `npm run dev / build / typecheck / test / lint:biome`
3. `agent_stack.md` — 5 primary surfaces from `CLAUDE.md`, file paths for each
4. `graduation_protocol.md` — "things graduate to own repo; code deleted; redirect routes" pattern
5. `boundaries.md` — Always-do / Ask-first / Never-do rules from `CLAUDE.md`

### Graduation Workflow (the killer use case for ZAO)

`CLAUDE.md` defines graduation as "own repo, own DB, own domain. Code is DELETED from ZAOOS so there's no drift." Recent graduations: COC Concertz, BCZ YapZ (PR #480, May 2026), ZAOstock pending.

**Today's risk:** grep for `BczYapz`, delete files manually, miss a dynamic reference in a route handler or a config import, ship a broken deploy. The `feedback_no_merged_pr_code` memory exists because past attempts caused exactly this kind of churn.

**Serena protocol for graduation:**

```
1. find_symbol → name_path of the top-level component (e.g. "BczYapzApp")
2. find_referencing_symbols → list of every call site across 301 routes + 279 components
3. For each reference: replace with import to the new graduated package OR delete the call site
4. safe_delete_symbol → only deletes if zero refs remain; returns ref list if any
5. Repeat for next symbol in the graduation tree
6. After tree is clear: file/directory deletion via plain rm + git
```

`safe_delete_symbol` is the safety net — it refuses to delete when references exist, returning the locations instead. This eliminates the "I missed one" failure mode that produces broken builds on the graduation PR.

### Hermes Auto-PR Pipeline Integration

`bot/src/hermes/` is the autonomous fix-PR pipeline (`coder.ts`, `critic.ts`, `pr.ts`, `runner.ts`, `preflight.ts`). Today Hermes' coder spawns a Claude Code subprocess inside an isolated worktree. That subprocess has NO Serena access because each worktree gets a fresh project state.

**Two integration paths:**

| Path | How | Trade-off |
|------|-----|-----------|
| **A. Per-worktree Serena (stdio)** | Each Claude subprocess spawns its own Serena via stdio; index built per worktree | Cold LSP start (~30-60s on ZAOOS); fresh memory cache each run |
| **B. Shared Serena (HTTP/SSE)** | One long-running `serena start-mcp-server --transport streamable-http --port 8000` on the host; all worktrees point at it | Avoids cold start; shared memory; index drifts if worktree code diverges sharply |

**Recommendation:** Path A for now. Hermes runs are independent fix-and-PR cycles; each should see a clean index of its own worktree. Cold start cost is amortized over the 5-30 min fix loop. Revisit Path B when Hermes does parallel multi-worktree campaigns.

`preflight.ts` already runs `npm run typecheck`. Add a Serena `get_diagnostics_for_file` call as a cheaper pre-typecheck signal — catches LSP-level errors in seconds instead of the full tsc pass (90+ seconds on ZAOOS).

### Onboarding Agents to Large Unfamiliar Surfaces

`research/` has 727 numbered docs. `governance/` is dense ORDAO/Hats/Snapshot lore. `src/components/spaces/` has 40+ components. Today, when a new session needs to touch any of these, it bulk-reads which blows context.

**Serena's `get_symbols_overview`** returns a file outline (class/function names + line numbers) without reading bodies. For `research/` (markdown), use `mcp__serena__list_dir` + `find_file` to navigate without bulk reading READMEs.

**Pattern for new sessions:**

```
1. list_memories → see what previous sessions already learned
2. read_memory <relevant> → load only what matters this task
3. get_symbols_overview src/components/spaces → see all component names
4. find_symbol <specific component> → read only the one you need
```

Compare: today's pattern reads `src/components/spaces/SpaceModal.tsx` (likely 400+ lines) when the task only needs the `handleJoin` method.

### Hook Wiring (the missing piece)

Current `.claude/settings.json` has hooks for lint/typecheck/branch-guard/notification but **no Serena hooks**. Add:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__serena__*",
        "hooks": [
          { "type": "command", "command": "serena-hooks auto-approve --client=claude-code" }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "serena-hooks activate --client=claude-code" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "serena-hooks cleanup --client=claude-code" }
        ]
      }
    ]
  }
}
```

`serena-hooks` is bundled with the `serena-agent` install. Auto-approve eliminates the per-call permission prompt; activate ensures the project is bound on session start; cleanup releases the LSP process on exit.

**Caveat:** these hooks merge with the existing PreToolUse Bash hooks via the matcher field — verify after adding that the lint and branch-guard hooks still fire.

### 5 Primary Surfaces — Adoption Plan

Per `CLAUDE.md`, ZAO collapsed to 5 surfaces. Concrete Serena adoption per surface:

| Surface | Code path | Serena role | Memory files to seed |
|---------|-----------|-------------|----------------------|
| **ZOE** (`@zaoclaw_bot`) | `bot/src/zoe/` (concierge, scheduler, sidequests, brand.md, USERGUIDE.md, reflect, groups) | Symbol navigation across the 4-block Letta memory architecture; rename safety when restructuring brain blocks | `zoe_architecture.md`, `zoe_post_categories.md` |
| **Hermes** (`@zoe_hermes_bot`) | `bot/src/hermes/` (coder, critic, pr, runner, preflight, claude-cli, commands) | `get_diagnostics_for_file` for cheap preflight; Per-worktree stdio Serena inside coder | `hermes_pipeline.md`, `hermes_safety_invariants.md` |
| **ZAO Devz** (`@zaodevz_bot`) | `bot/src/devz/` | Symbol-aware dispatch (which file owns which subcommand); pre-fold-in audit for Phase 3 Hermes merge | `devz_dispatch_map.md` |
| **Bonfire** (knowledge graph) | External (bonfires.ai) + ingest scripts | N/A directly; but Serena could index the corpus ingester code paths | n/a (bonfire data, not code) |
| **ZAOstock bot** (`@ZAOstockTeamBot`) | `bot/` root (graduating to own repo) | **PRIMARY use case for `safe_delete_symbol` during the spinout** | Skip — graduating; let new repo run its own onboarding |

### Alternatives — When NOT to Use Serena

Comparison from the [Sverklo benchmark](https://sverklo.com/blog/practical-guide-mcp-code-intelligence/) (May 2026) and [cc.bruniaux.com](https://cc.bruniaux.com/guide/workflows/search-tools-mastery/):

| Tool | Strength | Weakness | Verdict for ZAOOS |
|------|----------|----------|-------------------|
| **ripgrep (built-in)** | 20ms text search, 100% local | No symbol awareness | **KEEP** — pair with Serena. "rg for text, Serena for symbols" |
| **Serena (LSP)** | Symbol rename/refs/defs, atomic | Requires working LSP per language | **ADOPT** — TS LSP already works |
| **ast-grep** | Structural pattern rewrites (`console.log($ARG)` → `logger.info($ARG)`) | Steep learning curve; YAML rules | **DEFER** — only earns slot during structural migration (e.g. RSC codemod) |
| **grepai** | Embedding-based semantic + call graph | 500ms per query; needs Ollama | **SKIP** — adds dependency, marginal win over Serena+rg |
| **jcodemunch-mcp** | Tree-sitter symbol index; best at "where is X defined" (0.65 F1) | Dual license $79-$1999 commercial | **SKIP** — licensing friction |
| **Sverklo MCP** | Combined search + structure + memory; bi-temporal | Heaviest install | **SKIP** for now; reevaluate if call-graph "blast radius" queries dominate |
| **GitNexus / CodeGraphContext** | Call-graph aware ("what breaks if I change this") | Heavier infra | **MONITOR** — gitnexus MCP already in your connecting servers list |
| **gh CLI** | Authoritative for PR/issue/commit metadata | Not a code-intel tool | **KEEP** — complementary; use for git/PR state, not code search |
| **plain LSP (no MCP wrapper)** | Direct IDE integration | Not exposed to AI agents | **N/A** — defeats the point |

The cc.bruniaux.com hierarchy is the right mental model:

```
rg (built-in)     →  90% of searches (text)
Serena            →  Symbol-aware refactoring + session memory
ast-grep          →  Large structural migrations only
```

## Hook Wiring — Step-by-step

```bash
# 1. Verify serena-hooks binary exists
which serena-hooks   # should be in PATH if serena-agent installed via uv

# 2. Back up current settings
cp .claude/settings.json .claude/settings.json.bak

# 3. Append Serena hooks (use jq to merge cleanly; manual edit risks JSON corruption)
# OR add the block above by hand under the existing "hooks" key

# 4. Restart Claude Code; verify dashboard at 127.0.0.1:24289 shows the project bound
# 5. Call mcp__serena__list_memories to confirm auto-approve works (no prompt)
```

## Onboarding — Step-by-step

```bash
# 1. Move misplaced UVR memory out of .serena/memories/
mv .serena/memories/project_uvr_playbook.md research/community/_temp-uvr-from-serena.md
# Then decide if its content is already in Doc 560; if so, delete

# 2. From Claude Code, invoke the onboarding tool
# In chat: ask Claude to call mcp__serena__onboarding
# Serena scans the repo and writes 4-6 baseline memories

# 3. Seed the 5 project-specific memories listed in "Memory" section above
# Either by hand or by asking Claude to write_memory for each

# 4. git add .serena/memories/ && commit — team shares this knowledge
```

## Performance Notes

- **First-index cost:** 30-90s on ZAOOS (depends on `tsconfig.json` paths + node_modules size). One-time per worktree.
- **Per-tool-call latency:** ~100ms (cc.bruniaux measurement); vs ripgrep ~20ms — but Serena returns a 30-line symbol body where ripgrep returns line numbers requiring a follow-up Read.
- **Dashboard port:** `127.0.0.1:24289` — localhost only, no security exposure.
- **WASM/native LSP:** TypeScript LSP uses `typescript-language-server` (Node-based). Already installed by `npm install` chain.

## Risks + Open Questions

1. **`serena-hooks` binary install path** — needs verification on Zaal's machine before the settings.json edit. If install was via the marketplace MCP (not `uv tool install`), the binary may be missing.
2. **Hook merge order** — appending the `PreToolUse` matcher for `mcp__serena__*` must not shadow the existing Bash matchers. JSON hook ordering is preserved in `.claude/settings.json` so this should work, but test post-add.
3. **`.serena/cache/` in git?** — `.serena/.gitignore` exists; verify cache + index files are excluded so commits don't carry binary blobs.
4. **JetBrains backend cost** — out of scope; LSP backend covers TypeScript + Python + Go + Solidity (for `contracts/`) for free. Revisit only if you want type-hierarchy queries on Solidity.
5. **Solidity LSP** — `solidity-ls` or `nomicfoundation/solidity-language-server` need separate install. Add `solidity` to `project.yml#languages` if you want Serena over `contracts/`.
6. **Stale index on worktree switch** — if you switch worktrees aggressively, Serena's index can drift. The hint is "diagnostics report symbols that don't exist." Fix: restart Serena or run `mcp__serena__check_onboarding_performed`.

## Also See

- [Doc 154](../154-skills-commands-master-reference/) — full skills + commands reference; Serena belongs in the "code intelligence" row
- [Doc 408](../408-claude-code-1m-context-session-management/) — 1M context strategy; Serena reduces what fills that window
- [Doc 429](../429-claude-code-skills-deep-dive/) — skills architecture; Serena is a tool layer, not a skill
- [Doc 440](../440-claude-code-process-level-up/) — Claude Code workflow level-ups; this doc is the code-intel chapter
- [Doc 459](../459-parallel-workspace-isolation-zao-os/) — worktree isolation; relevant to Path A vs Path B for Hermes
- [Doc 523](../../agents/523-zao-agentic-systems-full-audit-fix-pr-pipeline/) — Hermes fix-PR pipeline; Section "Hermes Integration" applies
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) — 5-surface cleanup; "Adoption Plan" table maps to this
- [Doc 687](../687-claude-code-workflow-context-patterns/) — context patterns; Serena is one of them
- [Doc 694](../694-research-library-audit/) — research library audit; Serena could help re-research older docs

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add Serena auto-approve + SessionStart + Stop hooks to `.claude/settings.json` | @Zaal | PR (this branch or own) | Next session |
| Move misplaced `project_uvr_playbook.md` out of `.serena/memories/` | @Zaal | manual mv + commit | Next session |
| Run `mcp__serena__onboarding` on ZAOOS root; seed 5 project memories | @Zaal | Claude session | Next session |
| Verify `serena-hooks` binary is in PATH; reinstall via `uv tool install -p 3.13 serena-agent@latest` if missing | @Zaal | Bash | Before hook PR |
| Update `/ship` skill graduation branch to use `safe_delete_symbol` + `find_referencing_symbols` protocol | @Zaal | Skill edit | Before next graduation (post-ZAOstock spinout) |
| Spike: per-worktree stdio Serena in `bot/src/hermes/runner.ts` preflight | @Zaal | Code change | Phase 2 Hermes work |
| Add `solidity` language to `.serena/project.yml#languages` if Serena-over-contracts desired | @Zaal | Config edit | Optional |
| Save ZOE task "verify Serena dashboard reachable after hook install" | @Zaal | ZOE task | Same day as hook PR |

## Sources

- [oraios/serena GitHub README](https://github.com/oraios/serena) — [FULL] — README + capabilities tables + LSP vs JetBrains comparison
- [Serena docs: configuration / modes](https://github.com/oraios/serena/blob/main/docs/02-usage/050_configuration.md) — [FULL via raw GitHub] — contexts, modes, incompatibilities
- [Serena docs: clients (Claude Code setup)](https://github.com/oraios/serena/blob/main/docs/02-usage/030_clients.md) — [FULL via context7] — `serena setup claude-code`, hook recipes
- [Serena docs: memories + onboarding](https://github.com/oraios/serena/blob/main/docs/02-usage/045_memories.md) — [FULL via context7] — write_memory, onboarding, no-memories mode
- [Context7: /oraios/serena](https://context7.com/oraios/serena/llms.txt) — [FULL] — 444 code snippets covering tool examples
- [aya.is — Serena MCP review (Apr 2026)](https://aya.is/en/stories/20260413-serena-mcp-semantic-code-assistant) — [FULL] — Deno 2 + TS monorepo experience; cross-package symbol resolution
- [dudarik.com — Serena MCP (Mar 2026, updated May 14 2026)](https://dudarik.com/en/blog/serena-mcp/) — [FULL] — new find_declaration / find_implementations / diagnostics tools
- [hanafifirman.dev — token efficiency (Apr 2026)](https://hanafifirman.dev/en/blog/serena-mcp-token-efficiency/) — [FULL] — 60-80% reduction; debugging example
- [md.eknath.dev — 70% savings setup guide (Feb 2026)](https://md.eknath.dev/posts/ai-ml/serena-claude-code-setup/) — [FULL] — concrete token + cost table
- [aicoolies — Serena vs Claude Code comparison (Mar 2026)](https://aicoolies.com/comparisons/serena-vs-claude-code) — [FULL] — "not direct competitors; combine for IDE superpowers"
- [smartscope.blog — beginner guide (2026)](https://smartscope.blog/en/generative-ai/claude/serena-mcp-claude-code-beginners-guide/) — [PARTIAL] — translated content, some prose missing
- [cc.bruniaux.com — search tools mastery (rg + grepai + serena + ast-grep)](https://cc.bruniaux.com/guide/workflows/search-tools-mastery/) — [FULL] — comparison matrix + 4-tier hierarchy
- [Sverklo — MCP code intelligence benchmark (May 2026)](https://sverklo.com/blog/practical-guide-mcp-code-intelligence/) — [FULL] — 12 MCP servers compared; P1/P2/P4/P5 F1 scores
- [ast-grep MCP server (npm)](https://registry.npmjs.org/%40notprolands%2Fast-grep-mcp) — [FULL] — alternative for structural patterns
- [HN search: oraios/serena](https://hn.algolia.com/api/v1/search?query=serena+oraios) — [PARTIAL] — 1 story, 4 points, 1 comment (Apr 2025); thin community signal on HN
- Reddit r/ClaudeAI search for "serena mcp" — [FAILED] — returned empty Listing via zao-fetch-reddit.sh; subreddit search may require auth or different query. Escalation: tried direct subreddit search URL, got empty results object. Independent dev blogs (above) cover the same ground.

## Validation Notes

- **Date stamps:** Sources span Feb 2026 to May 2026; all current within 4 months
- **Version risk:** Serena ships frequently (`uvx --from git+https://github.com/oraios/serena`). The dudarik post (updated 2026-05-14) notes new diagnostic tools landed recently — install via `uv tool install -p 3.13 serena-agent@latest --prerelease=allow` to get them.
- **`initial_instructions` deprecation:** smartscope notes "`initial_instructions` manual loading is no longer required" — modern Claude Code auto-loads the MCP instructions (you saw this in the session-start system reminder).
- **Branch caveat:** This doc was researched on `ws/zao-juke-public-surfaces` (the branch had unrelated Juke changes). Decide whether to bundle into the juke PR or move to a research-only branch before pushing.
