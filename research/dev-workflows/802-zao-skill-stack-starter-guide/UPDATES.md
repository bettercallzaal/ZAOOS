# 802 - Starter Guide UPDATES (Part 2)

> Append-only change log for Zaal's Claude Code operating setup. Part 1 (README.md) stays canonical + stable; every skill/MCP/hook/workflow change lands here as a dated entry. See memory `feedback_ship_stack_changes_to_starter_guide`.

Format per entry: `## YYYY-MM-DD - <what changed>` + what / why / where the config lives.

---

## 2026-06-05 - Session: skill + MCP audit, config prune, repo recovery

**MCP audit (doc 801).** Measured real usage across 629 transcripts: ~150 MCP calls vs 12,834 total (1.2%). Decisions: lean into Serena (code edits/refactors, 60-80% token savings) + context7 (auto-rule for fast-moving stack); keep supabase/playwright/exa; disable gitnexus + ECC memory + sequential-thinking (0 calls). Config: `~/.claude/settings.json` permissions.allow.

**Skill prune (ECC).** Disabled 38 unused ECC skills in `skillOverrides` (`~/.claude/settings.json`):
- Language command-skills (never used on a Next.js/TS shop): cpp-build/review/test, flutter-build/review/test, go-build/review/test, gradle-build, kotlin-build/review/test, rust-build/review/test, python-review, jira.
- Unused command family: devfleet, orchestrate, eval, evolve, feature-dev, prp-commit/implement/plan/pr/prd, instinct-export/import/status, promote, projects, learn-eval, santa-loop, agent-sort, aside, claw.
- off-list grew 326 -> 402 entries. Why: each installed skill ships metadata into context every session; ~1,066 installed, ~8 used. Reversible (flip to "on" anytime).

**Worksession guard (new SessionStart hook).** `~/bin/worksession-guard.sh` + hook in `~/.claude/settings.json`. Nudges to run `/worksession` when a session starts on main/detached-HEAD or with a stale `remote.origin.push` refspec. Why: skipping /worksession caused the branch + silent-push bug this session.

**Bad push refspec cleared.** Removed a pinned `remote.origin.push = refs/heads/ws/research-zen-browser` from ZAOOS git config that was silently no-op'ing every `git push` (pushed the wrong, already-synced branch). Now `git push` uses the current branch normally.

**Repo recovery.** The ZAOOS working tree was wiped mid-session by an external process (NOT iCloud - confirmed outside any CloudDocs library; likely a parallel terminal's git-repair script). Recovered via fresh `git clone` from GitHub - fsck now clean, corruption (per memory `project_git_pack_corruption_repair`) cleared. Lost: a few untracked `2`-suffixed dup files never on GitHub (deemed non-critical). All committed work safe (docs 801, 802 on PRs #780, #782).

**Open follow-ups (not done):**
- `morning`/`reflect` -> scheduled `/loop` (deferred: new automation needs explicit ok).
- Archive `fractal`/`design`/`cold-outreach` (marginal).
- Research-skill overlap (zao-research vs bcz/bandz/autoresearch/last30days) - collapse to zao-research front door.
- context7 auto-invoke rule still to add to CLAUDE.md.

---

## 2026-06-06 - Read-only cowork MCP + tracker cleanup

**New MCP: `supabase-cowork` (read-only).** Added to `~/.claude.json` global `mcpServers` + permitted in `~/.claude/settings.json`:
```
https://mcp.supabase.com/mcp?project_ref=etwvzrmlxeobinrlytza&read_only=true
```
The official Supabase MCP pointed at the cowork tracker project, read-only. No bespoke server built (would have been the thin-wrapper anti-pattern doc 801 warns against). Verified live: SELECT returns task rows; UPDATE rejected with "cannot execute UPDATE in a read-only transaction". Note: `read_only=true` sandboxes SQL writes but still exposes Supabase management tools (branch/edge-function/migration) - optional hardening is `&features=database,docs` to drop them.

**Tracker cleanup - 98 stale tasks closed.** Cowork tracker (project etwvzrmlxeobinrlytza, `public.tasks`) had 407 rows, 354 todo, 115 overdue. Closed 98 as `done` (reversible, history kept): todo 354 -> 256, done 41 -> 139, overdue 115 -> 19. Buckets: 39 `pr-auto` (PRs long merged) + 36 overdue `research-doc` (docs shipped) auto-cruft, then the overdue `meeting` + `cowork-actions.json` set reviewed oldest-first one by one. The 19 overdue remaining were all explicitly KEPT (cold-outreach cluster, Leeward a-g, ZAOscribe, Magnetiq videos, ElizaOS decisions, etc - real open work). 273 non-overdue `cowork-actions.json` backlog untouched. Writes went through `~/bin/zao-tracker` service key (MCP is read-only by design).

**Stack changes from CLAUDE.md / config (now merged):** PRs #780 (doc 801), #782 (doc 802 + this UPDATES), #783 (CLAUDE.md context7 + Serena rules) all merged to main. Serena verified live (traced getSession across ~17 call sites). ECC skill prune live (200 unique skills off). Corruption memory updated with the definitive iCloud root cause (Documents was iCloud-synced -> "file 2" conflicts inside .git; fixed by turning sync off + moving 41 repos to ~/Desktop/repos).

**Systemic fixes surfaced (not yet done):**
- Tracker writers not idempotent on `legacy_id` - `meeting-1..5` each inserted twice; `232`/`closeout-a` and `234`/`closeout-d` are the same task from two sources. Fix: unique constraint or upsert in `~/bin/zao-tracker`.
- `pr-auto` + `research-doc` auto-tasks are created on PR/doc creation but never auto-closed on merge - that's why 75 cruft tasks accumulated. Fix: auto-close on merge.
