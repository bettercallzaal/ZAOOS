---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-20
superseded-by:
related-docs: "728, 797"
original-query: "/zao-research what more we can do with serena with all our recent upgrades"
tier: STANDARD
---

# 2352 - Serena is 8 releases behind, and the gap contains silent-empty-result bugs

> **Goal:** Answer "what more can we do with Serena" by first establishing what we are running - which turns out to be a four-month-old version with known bugs in exactly the two conditions we operate under.

## Key Decisions

Recommendations first.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **UPGRADE Serena before adding any new usage.** We run **v1.1.2** (2026-04-14); upstream is **v1.7.0** (2026-08-09), with 8 releases between. | The gap is not features. It contains fixes for `find_referencing_symbols` returning **silently empty** on a tsserver crash, and for parallel agents overwriting each other's project registry. We are a 2,004-file TypeScript estate running ~18 concurrent lanes - both conditions, simultaneously. |
| 2 | **SET `web_dashboard_open_on_launch: false`** in `~/.serena/serena_config.yml` (line 47). | It opened a browser tab on **19 separate starts today**. The dashboard stays reachable from the macOS tray or on request; only the auto-open dies. |
| 3 | **REMOVE the stale worktree entry** from the project list (line 157): `.../ZAO OS V1/.claude/worktrees/agent-af7f192d91f80d7e1`. | A temporary agent worktree got permanently registered. It no longer exists, so it is a dead project Serena carries forever. |
| 4 | **WIRE `project health-check` into a check that can fail.** | Before v1.7.0 it **always exited 0 even when the check failed**, so no caller could act on its verdict. On our version it is a check that cannot fail - the exact shape `silent-failure-guard.md` rule 3 bans. |
| 5 | **DO NOT expand Serena usage first.** Docs 728 and 797 already specify the integration. | 728 (2026-05-23) covers the monorepo, graduation workflow and Hermes pipeline; 797 (2026-06-05) covers the JetBrains tradeoff. Neither is wrong - both simply predate v1.5.0 through v1.7.0. This doc updates the version premise under them. |

## Findings

### 1. What we are actually running

Measured on this machine, 2026-08-20:

| | |
|---|---|
| Installed | **v1.1.2**, released 2026-04-14 |
| Upstream latest | **v1.7.0**, released 2026-08-09 |
| Releases in between | v1.2.0, v1.3.0, v1.5.0, v1.5.1, v1.5.2, v1.5.3, v1.6.0, v1.6.1 |
| Repo | `oraios/serena`, 28,297 stars, pushed 2026-08-20, **MIT** (LICENSE file read directly, not the API classifier) |

It is not idle software. Today's logs show **571 symbol operations**:

```
165 find_symbol
147 find_referencing_symbols
111 get_symbols_overview
 92 replace_symbol_body
 76 activate_project
 56 search_for_pattern
```

`find_referencing_symbols` at 147 is the load-bearing one - it answers "what calls this before I change it," which is what makes a rename safe rather than hopeful.

### 2. The gap contains our own recurring failure mode

Four fixes in the changelog since v1.1.2 describe a query returning **an empty or partial result that looks like a successful answer**. That is `silent-failure-guard.md` in someone else's codebase, and two of them land squarely on how we operate.

**The one that matters most, verbatim from the changelog:**

> "a `tsserver` crash mid-indexing (e.g. a V8 heap OOM) sent the same `$/progress` "end" event as a normal completion, so `find_referencing_symbols` and other cross-file queries **silently returned an empty result instead of surfacing the crash**."

We have **2,004 `.ts`/`.tsx` files** across `src/` and `bot/src/`. A V8 heap OOM on a monorepo that size is not exotic. And an empty `find_referencing_symbols` does not read as an error - it reads as **"nothing references this,"** which is the green light to delete or rename it.

The others, same shape:

- **Metals/Scala:** the first `find_referencing_symbols` of a session could return "a fraction of the references with nothing to indicate it was incomplete."
- **clojure-lsp:** a stale index could make `find_symbol` return "a body from the position the symbol used to occupy."
- **GitignoreParser:** a directory named with pattern metacharacters could turn a scoped pattern into a broad one, "silently excluding most or all of the project from indexing."

We do not run Scala or Clojure, so those two are not our exposure - they are evidence that the class of bug was systemic across language servers in this window, not a one-off.

### 3. The second condition we uniquely hit: parallelism

Two more fixes, and we are close to a worst case for both:

> "Parallel agents auto-registering projects could overwrite each other's changes to the global project list in `serena_config.yml`"

> "Race conditions in ProjectServer when used by multiple clients in parallel"

We run **~18 concurrent tmux lanes**, each its own Claude Code session, each with Serena attached and auto-registering whatever repo it boots into. That is precisely the described condition, on a version predating both fixes.

There is circumstantial support in our own config: the project list holds **11 entries including a dead agent worktree**, and one entry is line-wrapped mid-path (`/Users/zaalpanthaki/Documents/ZAO OS \n  V1/...`). Neither proves a lost write - a wrapped path may just be YAML folding - but a registry written concurrently by 18 processes on a version with a known lost-update bug is not one to trust silently.

### 4. What v1.7.0 adds that we would actually use

- **`project health-check` now exits 1 on failure**, and a `find_symbol` with no matches is a failure rather than a warning. This makes it usable as a real gate - it currently cannot fail.
- **Project activation errors are reported to the client**, not just buried in a log. Given lanes boot into repos automatically, a silent activation failure today looks identical to a working Serena that finds nothing.
- **`embed_memory` in prompt templates** - inline a memory's contents into a project prompt. Serena keeps per-project memories (currently **0** for `zao-fractal-bot`, cloned today), and this is the hook for feeding a lane's brief in automatically.
- **`languages` renamed to `language_servers`**, auto-migrated. Worth knowing before editing config by hand.
- **Security:** trusted-hosts on the dashboard and ProjectServer, and sandboxed prompt templating "preventing attackers from using custom prompts to execute commands in an uncontrolled manner." Our dashboard already binds `127.0.0.1`, so exposure is low - but prompt templating is not sandboxed on our version.

### Honest limits of this audit

- **I did not reproduce the tsserver bug here.** The claim is upstream's changelog, not our measurement. What is measured is our version, our file count, our lane count, and our tool-call volume. Whether we have *silently* had an empty `find_referencing_symbols` is unknown and, by the nature of the bug, would not have announced itself.
- **A wrapped path in the config is not proof of a lost write.** Flagged as consistent-with, not evidence-of.
- Upgrade mechanics were not tested. Serena runs via `uvx`/`uv tool`, so the version is pinned somewhere in the MCP invocation - find and change that, then re-run `project health-check`, rather than assuming a global upgrade takes.

## Also See

- [Doc 728 - Serena MCP ZAO integration](../728-serena-mcp-zao-integration/) - the integration spec, still valid, written against v1.1.x
- [Doc 797 - Serena semantic code MCP](../797-serena-semantic-code-mcp/) - the adopt decision + JetBrains tradeoff

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Find where the Serena version is pinned in the MCP config, upgrade to v1.7.0, and confirm with `serena --version` | @Zaal | Config | 2026-08-22 |
| Set `web_dashboard_open_on_launch: false` (line 47) - stops 19 unwanted browser tabs a day | @Zaal | Config | 2026-08-21 |
| Delete the dead worktree entry at line 157 of `serena_config.yml` | @Zaal | Config | 2026-08-21 |
| After upgrading, run `serena project health-check` on ZAOOS and confirm it exits non-zero on a deliberate failure | @Zaal | Verification | 2026-08-23 |
| Re-validate docs 728 and 797 against v1.7.0 and stamp `last-validated` | @Zaal | PR | 2026-08-27 |

## Sources

- [FULL - `gh api`, LICENSE read as a file] [oraios/serena](https://github.com/oraios/serena) - **MIT**, 28,297 stars, pushed 2026-08-20.
- [FULL - `gh api contents/CHANGELOG.md`, base64-decoded, 68,793 bytes] Every quotation above is verbatim from that file. Release notes on the GitHub Releases API are stubs pointing at it - the changelog is the only source with substance.
- [FULL - `gh api releases`] Version and date list: v1.1.2 (2026-04-14) through v1.7.0 (2026-08-09).
- [FULL - read on disk] `~/.serena/serena_config.yml` lines 30, 38, 47, 50, 53, 116, 157; the 11-entry project list.
- [FULL - counted on disk] 19 log directories under `~/.serena/logs/2026-08-20/`; tool-call tallies grepped from those logs; 2,004 `.ts`/`.tsx` files under `src/` and `bot/src/`.

Credit: **oraios/serena (MIT)**.
