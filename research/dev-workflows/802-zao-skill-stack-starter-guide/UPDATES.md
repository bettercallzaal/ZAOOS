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
