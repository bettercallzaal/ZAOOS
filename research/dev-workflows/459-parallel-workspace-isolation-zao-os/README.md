### 459 — Parallel Workspace Isolation for Claude Code Sessions in ZAO OS

> **Status:** Research complete
> **Date:** 2026-04-20
> **Goal:** Stop parallel Claude Code terminals (all launched from `/Users/zaalpanthaki/Documents/ZAO OS V1`) from clobbering each other's branches, files, and pushes. Solution must keep ZAO OS as the single launch point but give each session its own isolated workspace.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Core mechanism | USE **git worktrees** — already adopted in `/worksession` skill but currently falling back to branch-only. Tighten the contract: NEVER work directly in `/Users/zaalpanthaki/Documents/ZAO OS V1`. Always cd into a worktree under `~/Documents/ZAO OS worktrees/<name>/`. |
| Native Claude Code flag | USE `claude --worktree <name>` (`-w` for short) — built-in flag launches Claude in a fresh worktree. No third-party install required. Eliminates manual `git worktree add` step. |
| Existing `/worksession` skill | UPGRADE — make worktree the only path (kill the branch-only fallback). Add a single shell alias `zsesh "<desc>"` that runs `cd "ZAO OS V1" && claude -w "ws/<desc>-<MMDD>-<HHMM>"`. |
| Parallel session manager | USE **Conductor.build** (free Mac app, $2.8M YC S24) for the visual dashboard layer. Already evaluated as WATCH in doc 412 — promote to ADOPT now that the pain point is real. |
| Cleanup | USE **WorktreeHQ** (doc 321) for branch hygiene + squash-merge detection. Worktrees pile up otherwise. |
| Visibility within ZAO OS folder | ADD a `wtl` shell alias (`git worktree list --porcelain | format`) to see all active worktrees + their branches + dirty states from any terminal. |
| Cross-session coordination | SKIP Conductor's notepad UI for now — use ZAO's existing `/z` skill + auto-memory + per-worktree shell title (`PS1`) for visibility. |
| Hard rule (NEW project memory) | Add to `.claude/memory.md` + global feedback memory: **"Never edit files in `/Users/zaalpanthaki/Documents/ZAO OS V1` directly. All work happens in worktrees."** |

---

## Why This Keeps Happening

Documented incidents this week:
- 2026-04-19: Pushed commit `01452913` directly to `origin/main` because branch state shifted between `git checkout main` and `git push` (parallel session swap).
- 2026-04-20 (multiple times this session): Worked on commits expecting to be on `ws/ecc-d2-d5-teaching-0420`, found myself on `ws/matteo-prefractal-449-450-0420` after a parallel session checkout. Cherry-picked to recover.
- General: 5 stale `ws/` branches deleted in one cleanup pass on 2026-04-11 (per doc 321).

Root cause: **all sessions share a single working directory**. Git's HEAD pointer + index + working tree are filesystem-global per repo checkout. When terminal B runs `git checkout main`, terminal A's filesystem state mutates underneath it. Branch + file edits made in A get attributed to whatever branch B switched to.

Worktrees solve this at the OS level — each worktree gets its own directory, its own HEAD, its own index, its own files on disk. Terminal A's `git checkout main` in `worktrees/foo/` does NOT affect terminal B in `worktrees/bar/`.

---

## Existing State (What's Already Done)

| Asset | Status | Gap |
|-------|--------|-----|
| `/worksession` skill at `.claude/skills/worksession/SKILL.md` | Tries worktree, falls back to branch-only | Fallback is the problem — when worktree fails (disk space, perms, missed step), we revert to the broken-by-design path |
| Doc 165 (multi-session mgmt, 2026-03-18) | Catalogs tools | No concrete adoption recommendation |
| Doc 321 (worktreehq + gtr, 2026-04-11) | Recommends UPGRADE from branches to worktrees | 9 days later, recommendation not actioned |
| Doc 412 (Conductor + Replicas, 2026-04-16) | Marked WATCH | Promote to ADOPT |
| Doc 408 (1M context session mgmt) | Decision flowchart for /clear vs /compact | Not relevant to filesystem isolation |

The recommendation already exists. The pattern hasn't been enforced.

---

## Comparison of Options

| Option | What it does | Setup cost | Per-session cost | Visibility | Verdict |
|--------|--------------|------------|------------------|------------|---------|
| **A. Branch-only (status quo)** | `git checkout -b ws/foo` in same dir | 0 | 5s | None — terminal title only | REJECT — root cause |
| **B. Manual `git worktree add`** | `git worktree add ../wt/foo -b ws/foo` per session | 0 | 30-60s (cd, install, env copy) | `git worktree list` | OK but friction kills adoption |
| **C. `claude --worktree` (native flag)** | Built into Claude Code; auto-creates worktree, launches Claude inside | 0 | 5s (single command) | `git worktree list` | **ADOPT — primary** |
| **D. `/worksession` skill** (already in repo) | Wraps option B inside Claude with branch naming + env copy | 0 | 0 (one chat message) | None | KEEP — secondary, when launching from existing Claude |
| **E. Conductor.build** | Mac app, dashboard for parallel Claude Code workspaces, auto worktree per task | 5 min install | 10s click | Full GUI dashboard | **ADOPT — visibility layer** |
| **F. WorktreeHQ** | Tauri desktop app, hygiene + squash-merge cleanup | 5 min install | 0 (background) | Per-worktree status cards | **ADOPT — cleanup layer** |
| **G. `parallel-code` (johannesjo)** | OSS CLI for running Claude+Codex+Gemini in parallel | git clone | 10s per | Terminal | SKIP — Conductor covers it |
| **H. tmux pane manager (`dmux`, ECC plugin)** | Terminal multiplexer for AI sessions | tmux install | 5s | tmux status bar | OPTIONAL — pair with C |
| **I. `gtr` (git-worktree-runner)** | CLI shortcut: `gtr new feature --ai` | npm install | 5s | None | SKIP — `claude -w` is native, no extra install |
| **J. devcontainers / dockerized sessions** | Container per session | High (Dockerfile, mounts) | 30-60s | Docker desktop | SKIP — overkill for solo dev, breaks Mac-native tooling |

---

## Recommended Setup (Concrete, Adoptable Today)

### 1. Add a single shell alias (`~/.zshrc`)

```bash
# Spawn a fresh Claude Code session in an isolated worktree off ZAO OS V1.
# Usage: zsesh fix-auth-bug   →   ws/fix-auth-bug-MMDD-HHMM in ../worktrees/<name>/
zsesh() {
  local desc="${1:-session}"
  local stamp=$(date +%m%d-%H%M)
  local branch="ws/${desc}-${stamp}"
  cd "/Users/zaalpanthaki/Documents/ZAO OS V1" || return 1
  git fetch origin --quiet
  claude --worktree "$branch"
}

# List all active worktrees with branch + dirty state
alias wtl='git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" worktree list'

# Prune merged/dead worktrees
alias wtprune='git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" worktree prune --verbose'
```

### 2. Update `.claude/memory.md` with the new contract

Add an "Active Decisions" line:
> **2026-04-20 — Workspace isolation:** Never edit files directly in `/Users/zaalpanthaki/Documents/ZAO OS V1`. All sessions launch via `zsesh <desc>` or `claude -w ws/<desc>` to spawn an isolated worktree under `~/Documents/ZAO OS worktrees/`. Branch + file state is per-worktree. See doc 459.

### 3. Upgrade `/worksession` skill (`.claude/skills/worksession/SKILL.md`)

Drop the branch-only fallback. Replace with a hard error message that tells the user to `zsesh` instead. Worktree is the only path.

### 4. Install Conductor.build (visibility)

```bash
brew install --cask conductor
```

Use it when running 3+ parallel sessions. Launch from the same ZAO OS folder; Conductor handles worktree creation + dashboard.

### 5. Install WorktreeHQ (cleanup)

```bash
# Tauri app — download from https://github.com/worktreehq/worktreehq/releases
```

Run weekly to detect squash-merged dead worktrees + branches.

### 6. Save feedback memory

Add to `~/.claude/projects/.../memory/feedback_*` so this rule survives across sessions:

> `feedback_workspace_worktrees.md`: Always launch new Claude Code sessions via `claude --worktree ws/<desc>` (or shell alias `zsesh`). Never work in `/Users/zaalpanthaki/Documents/ZAO OS V1` directly. Filesystem-shared sessions clobber branch + file state. Doc 459.

---

## ZAO Ecosystem Integration

Files affected:
- `~/.zshrc` (or `.bashrc`) — add `zsesh`, `wtl`, `wtprune` aliases.
- `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/memory.md` — add "Active Decisions" line for worktree-only workflow.
- `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/skills/worksession/SKILL.md` — drop branch-only fallback.
- `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/feedback_workspace_worktrees.md` — new feedback memory.
- `~/Documents/ZAO OS worktrees/` — new sibling dir holding all active worktrees (or use the existing `../worktrees/` path the worksession skill already references).

Cross-project applicability: same pattern works for `BetterCallZaal/`, `zao-os-ao-research/`, `zao-mono/zaoos/` (all of which already have a `worksession` skill copy). Generalize the alias by parameterizing on `$PWD`.

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Wrong-branch incidents this week | 2 (doc 459 incident log) |
| Stale `ws/` branches in one cleanup pass | 5 (doc 321) |
| Worktree creation time (claude -w) | ~10 seconds |
| Conductor.build funding | $2.8M, YC S24 |
| ZAO existing `/worksession` skill version | branch+worktree fallback (current) |
| Open `ws/` branches at incident time | 6+ (verified via `git branch` 2026-04-20) |
| Disk overhead per worktree | ~50MB checkout + node_modules (or share via symlink) |

---

## Risks + Mitigations

| Risk | Mitigation |
|------|-----------|
| Worktree disk usage piles up (each = full checkout) | Run `wtprune` weekly + WorktreeHQ stale detection. Optionally symlink `node_modules` (`worktree.symlinkDirectories` setting). |
| Forgetting `zsesh` and falling back to direct ZAO OS folder edits | Hookify rule that warns on Edit/Write to `ZAO OS V1` root path (vs worktree subpath). |
| Multiple worktrees on same branch (forbidden by git) | Naming convention `ws/<desc>-<MMDD>-<HHMM>` makes collision near-impossible. |
| Conductor doesn't support our flow | Test with 1 real task before relying. Uninstall is `brew uninstall --cask conductor`. |
| Auto-memory paths assume single working directory | Verify auto-memory still routes to `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` from worktrees (uses sanitized cwd; should map to the SAME memory across worktrees since they share the same git common dir). Test before relying. |

---

## Sources

- [Claude Code: Common Workflows - `--worktree` flag docs](https://code.claude.com/docs/en/common-workflows)
- [Conductor.build — parallel Claude Code in worktrees (Mac app, YC S24)](https://conductor.build/)
- [Mastering Git Worktrees with Claude Code (Medium, Dogukan Tuna)](https://medium.com/@dtunai/mastering-git-worktrees-with-claude-code-for-parallel-development-workflow-41dc91e645fe)
- [Scaling the Loop: Run 5 Claude Code Sessions in Parallel with conductor.build (Medium, March 2026)](https://georgetaskos.medium.com/scaling-the-loop-run-5-claude-code-sessions-in-parallel-with-conductor-build-539b52888a81)
- [Claude Code Git Worktrees: Parallel Feature Branches (MindStudio)](https://www.mindstudio.ai/blog/claude-code-git-worktrees-parallel-branches)
- [Running Multiple Claude Code Sessions in Parallel with git worktree (DEV Community)](https://dev.to/datadeer/part-2-running-multiple-claude-code-sessions-in-parallel-with-git-worktree-165i)
- [johannesjo/parallel-code on GitHub](https://github.com/johannesjo/parallel-code)
- [WorktreeHQ on GitHub](https://github.com/worktreehq/worktreehq)
- ZAO OS doc 165 — multi-session management catalog
- ZAO OS doc 321 — WorktreeHQ + gtr evaluation
- ZAO OS doc 412 — Conductor + Replicas roundup
- ZAO OS doc 408 — 1M context session management

---

## Next Action (Adoption Plan)

| Step | Difficulty | Owner |
|------|------------|-------|
| 1. Add `zsesh` + `wtl` + `wtprune` aliases to `~/.zshrc`, source it | 1/10 | Zaal |
| 2. Test `zsesh test-worktree` end-to-end (worktree creation, env copy, claude launch, push from worktree, PR) | 2/10 | Zaal + Claude pair |
| 3. Update `.claude/memory.md` Active Decisions section | 1/10 | Claude |
| 4. Update `/worksession` skill to drop branch-only fallback | 2/10 | Claude |
| 5. Save `feedback_workspace_worktrees.md` to auto-memory | 1/10 | Claude |
| 6. Install Conductor.build, run 1 real session through it | 3/10 | Zaal |
| 7. Install WorktreeHQ, schedule weekly cleanup reminder | 2/10 | Zaal |
| 8. After 1 week: re-evaluate. Is the rule sticking? Are incidents down to 0? | 1/10 | both |
