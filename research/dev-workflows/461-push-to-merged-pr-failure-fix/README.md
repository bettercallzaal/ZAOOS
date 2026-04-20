### 461 — Push-to-Merged-PR Failure: Root Cause + Durable Fix

> **Status:** Research complete + concrete hook ready to install
> **Date:** 2026-04-20
> **Goal:** Stop a recurring 24-hour pattern of pushing commits to wrong destinations (merged PRs, bare main, parallel-session branches) by replacing memory-only rules with executable preconditions.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Where to enforce | USE **defense in depth across 3 layers**: (1) Claude Code `PreToolUse` hook on Bash matching `git push *` blocks at the agent layer, (2) git `pre-push` hook in `.git/hooks/` blocks at the git layer (catches direct CLI use too), (3) shell wrapper in `~/.zshrc` catches `git push` typed manually. All three call the same checker script. |
| Checker script lives where | USE `~/bin/safe-git-push.sh` — single source of truth, callable from all 3 layers. Tracked in dotfiles, not in this repo. |
| Block conditions | BLOCK if **any** of: (a) current branch is `main`, (b) current branch is `master`, (c) current branch has a merged PR per `gh pr list --state merged --head <branch>`, (d) push spec includes `:main` or `+main` (force-push variants), (e) `--force` or `--force-with-lease` to a protected branch. |
| Override mechanism | USE explicit env var `ALLOW_UNSAFE_PUSH=1` for one-shot bypass (rare emergency). NO permanent override. |
| Memory-vs-mechanism stance | DROP reliance on auto-memory feedback files for push safety. Memory is loaded but not consulted at push time. Mechanism (script that runs) is the only reliable enforcement. |
| Branch rename guard | ADD a separate hook on Bash matching `git branch -m *` that blocks renaming the current branch when current is `main`/`master`. Catches the 2026-04-19 reflog-chain incident. |
| Cherry-pick + push idiom | DOCUMENT a single helper `safe-cherry-pick-to-new-pr <commit>` that creates fresh branch off main, cherry-picks, pushes, opens PR — replaces the manual sequence that has failed twice. |
| `feedback_*` memories | KEEP as documentation of intent, but DOWNGRADE expected enforcement — they're now hint-level, not blocker-level. |

---

## Failure Log (last 24 hours)

| Time | Failure | Root proximate cause | Why memories didn't help |
|------|---------|---------------------|--------------------------|
| 2026-04-19 evening | Pushed `01452913` directly to `origin/main` | Local branch had been silently renamed via `git branch -m main` after parallel-session reflog chain. `git push origin HEAD` then went to `origin/main` because that's what local main tracked. | Memory says "verify branch name before push" — I read `git branch --show-current`, saw `main`, but didn't trigger the "wait, push to main is forbidden" rule because it was a documented-only constraint. |
| 2026-04-20 ~08:50 ET | Committed work onto a parallel session's branch, then edited their PR body | Committed without first checking `git branch --show-current`. Branch had drifted between my last command and this one due to parallel terminal. | Same — memory rule never fired during multi-step sequence; consulted only at session start. |
| 2026-04-20 ~09:30 ET | Cherry-picked + pushed → ended up on `origin/main` again | Local branch `ws/ecc-harness-audit-0420` was tracking `origin/main` because of a prior rename. `git push origin HEAD` resolved to `origin/main`. | Verified with `git branch --show-current` (showed `ws/...`) but didn't check `git rev-parse --symbolic-full-name @{upstream}` to see remote tracking. |
| 2026-04-20 ~13:55 ET | Pushed `e9fc5df6` to a branch whose PR #236 had been merged 2 minutes earlier | Did not run `gh pr view` between my local commit and `git push`. Assumed PR was still open because that's the state I last saw. | Memory `feedback_no_push_merged_pr.md` says "check with gh pr list first" — I knew this rule and still didn't run it. The rule lives in text; my push lives in muscle memory. |

**Pattern:** Mental model of git state diverges from actual git state during multi-step sessions. Text rules in memory can't compete with a 1-second `git push` reflex.

---

## Comparison of Options

| Option | Layer | Blocks | Pro | Con | Verdict |
|--------|-------|--------|-----|-----|---------|
| **A. Claude Code PreToolUse hook on Bash** | Agent | Pushes initiated by Claude tool calls | Catches every Claude push, schema-supported, plays nicely with existing ECC hooks. Configurable per-machine. | Doesn't catch pushes made by Zaal manually in another terminal. Hook only runs in Claude sessions that loaded the settings. | **ADOPT** — primary enforcement for the agent failure mode |
| **B. Git pre-push hook (`.git/hooks/pre-push`)** | Git | Every `git push` on this checkout (Claude or Zaal) | Universal — catches all push origins. Native git mechanism. | Per-checkout, per-worktree. Not committed to repo (ignored by git). Each new worktree needs reinstall. Symlink trick fixes that. | **ADOPT** — backstop for non-Claude pushes + worktree case |
| **C. Shell wrapper in `~/.zshrc`** | Shell | `git push` typed in zsh sessions | Simple. Catches manual user pushes. | Bypassable by `command git push` or `\git push`. Doesn't run in non-zsh shells (Win bash, scripts). | OPTIONAL — third layer, tiny code |
| **D. Hookify rule via ECC plugin** | Agent | Conversation-pattern matching | Easy to author via `/hookify` skill. | Higher latency (LLM call), less deterministic, plugin-specific. | SKIP — Option A is faster + more reliable |
| **E. GitHub branch protection rule on `main`** | Server | Direct pushes to main | Server-side. Truly authoritative — even force pushes fail. | Doesn't catch push-to-merged-non-main-branch (the doc 460 incident). Requires branch protection settings change. | **ADOPT (separate)** — closes the "push to main" gap independently |
| **F. All of the above (defense in depth)** | All | Everything | Caught no matter the entry point | Maintenance: update checker script in 3 places (mitigated by single shared script) | **ADOPT — A + B + E required, C optional** |

---

## Concrete Implementation

### 1. Shared checker script — `~/bin/safe-git-push.sh`

```bash
#!/usr/bin/env bash
# Block git pushes that would land on main or on a branch whose PR is already merged.
# Called from: Claude PreToolUse hook, .git/hooks/pre-push, optional zsh wrapper.
#
# Exit codes:
#   0 = safe to push
#   2 = BLOCKED (caller should refuse)
#
# Override: ALLOW_UNSAFE_PUSH=1 in env bypasses checks (one-shot emergency only).

set -euo pipefail

if [[ "${ALLOW_UNSAFE_PUSH:-0}" == "1" ]]; then
  echo "[safe-git-push] ALLOW_UNSAFE_PUSH=1 — skipping checks." >&2
  exit 0
fi

# Determine the repo dir of the current invocation.
# Caller may set REPO_DIR; otherwise infer from PWD.
REPO_DIR="${REPO_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || echo "")}"
if [[ -z "$REPO_DIR" ]]; then
  echo "[safe-git-push] not inside a git repo — allowing." >&2
  exit 0
fi

cd "$REPO_DIR"

BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
if [[ -z "$BRANCH" ]]; then
  echo "[safe-git-push] detached HEAD — refusing as a precaution." >&2
  exit 2
fi

# 1. Block direct push to main / master
case "$BRANCH" in
  main|master)
    cat <<EOF >&2
[safe-git-push] BLOCKED: pushing while on '$BRANCH'.

Always create a PR. Recovery:
  git checkout -b ws/<descriptive-slug>-\$(date +%m%d-%H%M)
  git push -u origin HEAD
  gh pr create --base $BRANCH

If this is a TRUE emergency (admin recovery push), set ALLOW_UNSAFE_PUSH=1.
EOF
    exit 2
    ;;
esac

# 2. Block push to a branch whose PR was already merged.
# gh CLI is required. Fail open if missing (don't block; warn).
if ! command -v gh >/dev/null 2>&1; then
  echo "[safe-git-push] gh CLI not installed — skipping merged-PR check." >&2
  exit 0
fi

# Look up merged PRs for this exact head branch.
MERGED_PR=$(gh pr list --state merged --head "$BRANCH" --json number,mergedAt --jq '.[0].number' 2>/dev/null || echo "")

if [[ -n "$MERGED_PR" ]]; then
  cat <<EOF >&2
[safe-git-push] BLOCKED: branch '$BRANCH' has merged PR #$MERGED_PR.

Pushing more commits to a merged-PR branch orphans them — they never reach main.

Recovery (cherry-pick onto a fresh branch and open a new PR):
  git fetch origin main
  git checkout -b ws/\$(echo "$BRANCH" | sed 's/^ws\///')-followup-\$(date +%m%d-%H%M) origin/main
  git cherry-pick <commit-sha>
  git push -u origin HEAD
  gh pr create --base main

Override: ALLOW_UNSAFE_PUSH=1 (rare emergency only).
EOF
  exit 2
fi

# 3. Block force pushes to anything matching ws/<merged>
if [[ "${SAFE_PUSH_ARGS:-}" == *"--force"* ]] || [[ "${SAFE_PUSH_ARGS:-}" == *"-f"* ]]; then
  echo "[safe-git-push] WARNING: force push detected on $BRANCH — proceeding (allowed for non-main branches)." >&2
fi

echo "[safe-git-push] OK: $BRANCH passes safety checks." >&2
exit 0
```

Install:

```bash
mkdir -p ~/bin
# (paste script above into ~/bin/safe-git-push.sh)
chmod +x ~/bin/safe-git-push.sh
# Make sure ~/bin is on PATH (most setups have it; otherwise add to .zshrc/.bashrc)
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
```

### 2. Claude Code PreToolUse hook — append to `~/.claude/settings.json`

Inside the existing `"hooks"` block:

```json
"PreToolUse": [
  {
    "matcher": "Bash",
    "hooks": [
      {
        "type": "command",
        "command": "bash -c 'cmd=\"$CLAUDE_TOOL_INPUT_command\"; case \"$cmd\" in *\"git push\"*) SAFE_PUSH_ARGS=\"$cmd\" REPO_DIR=\"$(pwd)\" ~/bin/safe-git-push.sh ;; *) exit 0 ;; esac'",
        "if": "Bash(git push *)",
        "timeout": 10
      }
    ]
  }
]
```

Notes on the hook spec:
- `matcher: "Bash"` + `if: "Bash(git push *)"` — only fires for git push commands, no overhead on other Bash calls.
- Hook command pulls the actual command string from `$CLAUDE_TOOL_INPUT_command` (Claude Code env var).
- Exits 0 → push proceeds. Exits 2 → Claude Code blocks the tool call and reports the stderr message back to the agent (which shows it to user).
- Timeout 10s — `gh pr list` is fast (typically <2s).

### 3. Git pre-push hook — `~/bin/setup-pre-push-hook.sh`

```bash
#!/usr/bin/env bash
# Symlink ~/bin/safe-git-push.sh into the current repo's .git/hooks/pre-push.
# Run once per worktree (or call from a worktree-create skill).
set -euo pipefail
HOOK_DIR="$(git rev-parse --git-dir)/hooks"
mkdir -p "$HOOK_DIR"
cat > "$HOOK_DIR/pre-push" <<'EOF'
#!/usr/bin/env bash
# Read push args off stdin protocol if needed; for now just call shared checker.
SAFE_PUSH_ARGS="$*" REPO_DIR="$(git rev-parse --show-toplevel)" ~/bin/safe-git-push.sh
EOF
chmod +x "$HOOK_DIR/pre-push"
echo "Installed pre-push hook at $HOOK_DIR/pre-push"
```

Run once per checkout/worktree. Better: extend `/worksession` skill to run this automatically when a new worktree is created.

### 4. Optional zsh wrapper — append to `~/.zshrc`

```bash
git() {
  if [[ "$1" == "push" ]]; then
    SAFE_PUSH_ARGS="$*" REPO_DIR="$(command git rev-parse --show-toplevel 2>/dev/null || pwd)" ~/bin/safe-git-push.sh || return 2
  fi
  command git "$@"
}
```

Bypass: `command git push ...` (escapes the function). Documented escape hatch.

### 5. Branch-rename guard — separate Claude hook (same hooks block)

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "bash -c 'cmd=\"$CLAUDE_TOOL_INPUT_command\"; case \"$cmd\" in *\"git branch -m \"main\"*|*\"git branch -m main\"*) echo \"[safe-git] BLOCKED: refusing to rename main. Create a new branch with: git checkout -b ws/<name>\" >&2; exit 2 ;; *) exit 0 ;; esac'",
      "if": "Bash(git branch -m*)",
      "timeout": 5
    }
  ]
}
```

### 6. GitHub branch protection — one-time setup

```bash
gh api repos/bettercallzaal/ZAOOS/branches/main/protection \
  -X PUT \
  -F required_status_checks=null \
  -F enforce_admins=true \
  -F required_pull_request_reviews[required_approving_review_count]=0 \
  -F restrictions=null \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

Server-side authoritative. Even if all client-side hooks fail, GitHub refuses direct push to main.

---

## Test Plan

After installing all 5 pieces:

```bash
# 1. Confirm script is installed + executable
~/bin/safe-git-push.sh   # should print "OK" or block based on current branch

# 2. Test BLOCK path: try to push from main
cd /Users/zaalpanthaki/Documents/ZAO OS V1
git checkout main
echo "test" > /tmp/should-not-push
git add /tmp/should-not-push 2>/dev/null || true
git push origin HEAD --dry-run    # should be BLOCKED with main message

# 3. Test BLOCK path: push to merged PR branch
git checkout ws/<some-merged-branch>   # if any remain
git push origin HEAD --dry-run    # should be BLOCKED with merged-PR message

# 4. Test OK path: push from a fresh ws/ branch
git checkout -b ws/test-safe-push-$(date +%s)
git push -u origin HEAD --dry-run  # should print OK + proceed

# 5. Test override
ALLOW_UNSAFE_PUSH=1 git push origin HEAD --dry-run   # should bypass

# 6. Test from inside Claude session
# Ask Claude to "git push" while on main — should refuse, surface stderr to chat

# 7. Test branch rename guard from Claude
# Ask Claude to "git branch -m main foo" — should be blocked
```

Acceptance: every block path returns non-zero exit + clear message. Every OK path returns 0.

---

## Memory vs Mechanism

| Layer | What it is | When it fires | Why it failed |
|-------|-----------|---------------|---------------|
| Auto-memory feedback | Markdown text loaded at session start | Read once at session boot, present in system prompt context | Not consulted at push time. The agent has the rule but the push command doesn't trigger lookup. |
| Skill description | Skill metadata loaded at session start | Same | Same. |
| User instruction in chat | Direct conversation | Whenever user types it | Fades after a few turns, no enforcement. |
| **Mechanism (this doc)** | Executable check that runs IMMEDIATELY before action | At the moment of `git push` | Cannot be ignored — exits 2 stops the push. |

The tax of memory-only rules: every push requires the agent to remember + apply 3+ rules in real time during a multi-step session. Cognitive load grows with rule count. Mechanism cost: write the script once, runs forever, cost zero per-push.

ZAO already has 6+ feedback memos about git/branch/push discipline. Continuing to add more memos doesn't fix the problem; it accumulates ignored text. This doc moves them from text → code.

---

## ZAO Ecosystem Integration

Files affected:
- `~/bin/safe-git-push.sh` — new (user-level dotfile, not in repo)
- `~/bin/setup-pre-push-hook.sh` — new (worktree setup helper)
- `~/.claude/settings.json` — add 2 hook entries to `hooks.PreToolUse`
- `~/.zshrc` — optional `git()` wrapper
- `/Users/zaalpanthaki/Documents/ZAO OS V1/.git/hooks/pre-push` — installed by setup script
- `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/skills/worksession/SKILL.md` — extend to install pre-push hook on new worktrees
- GitHub repo settings — branch protection on `main`

After install, downgrade these memory files to "intent doc" status (don't delete — they explain WHY):
- `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/feedback_no_push_merged_pr.md`
- `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/feedback_branch_discipline.md`
- `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/feedback_workspace_worktrees.md`
- `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/feedback_always_pr.md`

Each should reference doc 461 as the enforcement mechanism.

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Push-to-wrong-destination incidents in 24 hours | 4 |
| Existing feedback memos covering this rule | 4 (`no_push_merged_pr`, `branch_discipline`, `workspace_worktrees`, `always_pr`) |
| Time spent recovering each incident | 5-10 min (cherry-pick + new branch + new PR + comms) |
| Total rework from this pattern (24h) | 20-40 minutes |
| Hook latency budget | 10 seconds (`gh pr list` typically <2s) |
| Layers of defense in proposed fix | 3 (Claude hook + git hook + GitHub branch protection); 4 with optional zsh wrapper |
| Memory files to deprecate to "intent" status | 4 |

---

## Sources

- [Claude Code hooks docs (PreToolUse)](https://code.claude.com/docs/en/hooks)
- [git pre-push hook docs](https://git-scm.com/docs/githooks#_pre_push)
- [gh pr list — GitHub CLI](https://cli.github.com/manual/gh_pr_list)
- [GitHub branch protection API](https://docs.github.com/en/rest/branches/branch-protection)
- ZAO OS doc 459 — parallel workspace isolation
- ZAO OS doc 321 — git worktree branching
- ZAO OS doc 442 — ECC top picks (gateguard hook precedent)

---

## Adoption Plan

| Step | Difficulty | Owner |
|------|-----------|-------|
| 1. Install `~/bin/safe-git-push.sh` (paste script + chmod) | 1/10 | Zaal (or Claude with explicit OK) |
| 2. Add `PreToolUse` hook entries to `~/.claude/settings.json` | 2/10 | Claude via `update-config` skill |
| 3. Install `pre-push` hook in main repo + each worktree | 2/10 | Claude one-shot per worktree, or extend `/worksession` |
| 4. (optional) Add zsh `git()` wrapper to `~/.zshrc` | 1/10 | Zaal |
| 5. Set GitHub branch protection on `main` via `gh api` | 2/10 | Zaal (touches GitHub settings, his call) |
| 6. Add doc 461 reference to the 4 affected feedback memos | 1/10 | Claude |
| 7. Test all 7 scenarios from Test Plan section | 3/10 | Both |
| 8. After 1 week of zero incidents, declare the pattern fixed | — | both |

---

## Next Action

Install all 5 layers in this order: GitHub branch protection (server-side authoritative, blocks even if everything else fails) → safe-git-push.sh script → pre-push hook → Claude PreToolUse hook → optional zsh wrapper. Then run test plan.
