---
topic: dev-workflows
type: incident-postmortem
status: research-complete
last-validated: 2026-04-29
related-docs: 459, 551, 552, 553
tier: STANDARD
---

# 554 - Worktree Collision Postmortem (2026-04-29)

> **Goal:** Today's session hit branch collisions twice and the `safe-git-push.sh` pre-tool hook hard-blocked Bash calls when pwd left the repo. Document what happened, why, and propose concrete fixes. This is a real workflow risk - 261 ws/* branches on main + 4 active worktrees + multi-session parallel work = inevitable interference.

## Incidents (Both Today, Single 4-Hour Window)

### Incident 1 - Doc 548 Lazer branch swap

**Sequence:**
1. This session created `ws/research-lazer-tools-miniapps` on the main repo at `/Users/zaalpanthaki/Documents/ZAO OS V1`.
2. Wrote + committed Doc 548 + sub-files; pushed; opened PR #379.
3. Did follow-up edits (`/clipboard` skill output).
4. Tried to Edit Doc 548. **Edit failed with "File does not exist."**
5. `git branch --show-current` returned `ws/research-546-bonfires-deployments` - a parallel session had silently checked out a different branch on the main repo dir.
6. Recovered with `git checkout ws/research-lazer-tools-miniapps`.

**Root cause:** main repo dir is shared across all sessions; whichever session runs `git checkout` last wins. `git branch -a` reads global, but `HEAD` is per-worktree, and the main worktree counts as one - any session's checkout in the main dir swaps the file tree under every other session's feet.

### Incident 2 - Doc 549 branch swap

Same pattern. Different parallel session pushed `ws/research-548-bonfire-week1` (already a doc-548 number collision flagged in [Doc 551](../551-research-roadmap-library-audit/)) which kicked the active branch to that name.

### Incident 3 - `safe-git-push.sh` hook blocks every Bash call after cwd leaves repo

**Sequence:**
1. Bash command `cd /Users/zaalpanthaki/.claude/skills && ls`.
2. cwd changed to `~/.claude/skills` (not a git repo).
3. **Every subsequent Bash call** (echo, find, ls, even commands with no git intent) returned:
   ```
   PreToolUse:Bash hook error: [SAFE_PUSH_ARGS="$CLAUDE_TOOL_INPUT_command" REPO_DIR="$(pwd)" "$HOME/bin/safe-git-push.sh"]: [safe-git-push] detached HEAD — refusing as a precaution.
   ```
4. Recovery required avoiding `cd` and using absolute paths everywhere.

**Root cause:** the hook in `~/bin/safe-git-push.sh` evaluates `REPO_DIR="$(pwd)"` and runs a "detached HEAD" check before even inspecting whether the command is git-related. When pwd is not in a git repo, `git rev-parse --abbrev-ref HEAD` returns "HEAD" (detached-or-broken), the hook treats it as detached-HEAD-equivalent, and refuses.

This is over-broad: `echo "hi"` should not trigger a git push safety check.

## Existing Defences (and why they didn't fire)

Memory `feedback_workspace_worktrees` (per `MEMORY.md`):
> "Always launch sessions via `zsesh <desc>` or `claude --worktree`. Never edit ZAO OS V1 root directly. Doc 459."

**Status:** rule exists but not enforced - sessions can still launch via plain `claude .` from the main repo. This session, like the parallel ones, did so.

## State of Play (Verified 2026-04-29)

```
git -C "<repo>" worktree list:

/Users/zaalpanthaki/Documents/ZAO OS V1                                            66de6d49 [ws/research-551-560-multi]
/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/worktrees/agent-a5fb6a7a...        3df5413d [worktree-agent-a5fb6a7a...] locked
/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/worktrees/agent-ad1f7e9f...        585ddfff [worktree-agent-ad1f7e9f...] locked
/Users/zaalpanthaki/Documents/zao-os-ao-research                                   55f54b34 [ws/ao-research-doc415]
/Users/zaalpanthaki/Documents/ZAO-worktrees/content-apr22                          69dc4b7a [ws/content-transcripts-apr22-v2]
```

5 worktrees + 261 `ws/*` branches. Some sessions clearly use worktrees (`zao-os-ao-research`, `ZAO-worktrees/content-apr22`) - they're not the problem. The problem is sessions that work directly in the main repo dir.

## Fixes (Ranked, Cheapest First)

### Fix 1 - Hook: scope the safe-git-push check to git commands only

**File:** `~/bin/safe-git-push.sh`

**Current (broken):** runs detached-HEAD check on every Bash invocation.

**Proposed:**

```bash
#!/usr/bin/env bash
# Pre-tool hook for Bash commands.
CMD="$SAFE_PUSH_ARGS"

# Only inspect git commands.
if [[ ! "$CMD" =~ (git[[:space:]]+(push|reset[[:space:]]+--hard|checkout|rebase|cherry-pick)) ]]; then
  exit 0
fi

# If pwd isn't in a git repo, the hook has no jurisdiction - skip.
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

# ... existing detached-HEAD + force-push checks ...
```

This change alone would have stopped Incident 3.

### Fix 2 - Workflow: forbid main-repo checkout via env / hook

If `pwd` is the main repo (`/Users/zaalpanthaki/Documents/ZAO OS V1`) AND the command is `git checkout <ws/...>`, refuse and emit:

> "Don't checkout ws/* in main repo - launch worktree via `zsesh <desc>` instead. See memory `feedback_workspace_worktrees`."

Implementation: add to `safe-git-push.sh` after the git-only filter.

### Fix 3 - Branch hygiene: archive merged ws/* branches

261 ws/* branches mostly exist because no one prunes after merge. Quarterly:

```bash
git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads/ws/* \
  | grep '\[gone\]' \
  | awk '{print $1}' \
  | xargs git branch -D
```

Reduces collision surface (fewer branches = fewer accidental checkouts).

### Fix 4 - Document the 5-rule worktree workflow

Already partially in memory `feedback_workspace_worktrees`. Make it concrete:

1. Every session opens via `zsesh <slug>` or `claude --worktree`. Never `claude .` from the main repo dir.
2. Worktree path goes under `~/Documents/ZAO-worktrees/<slug>/` or `~/Documents/<repo>-<slug>/`.
3. Each ws/* branch belongs to exactly one worktree.
4. Main repo dir stays on `main` (and never mid-merge).
5. Periodic cleanup: prune merged branches + delete empty worktrees.

### Fix 5 - Skill enhancement: `/worksession` checks pwd vs main repo

Already invoked at session start per project CLAUDE.md. Add an early check:

```
if pwd == ~/Documents/ZAO OS V1 (main repo):
  WARN: "You are in the main repo dir. This session should be in a worktree."
  Suggest: "Run: zsesh <slug>"
```

### Fix 6 - Branch reservation script for /zao-research

Per Doc 551, the skill should pre-flight check that the next number is unique across all ws/* branches AND on main, AND on origin. Today's collision (548 lazer vs 548 bonfire-week1) is exactly this.

Add to skill:

```bash
NEXT_NUM=$(find research -maxdepth 2 -type d -name "[0-9]*" | sed 's/.*\///' | grep -oE '^[0-9]+' | sort -n | tail -1)
NEXT_NUM=$((NEXT_NUM + 1))
# Also check remote ws/* branches for collision
git ls-remote origin "ws/research-${NEXT_NUM}-*" 2>/dev/null
# If non-empty -> increment again
```

## What Did NOT Work Today

- Memory rule alone (`feedback_workspace_worktrees`) - rules without enforcement don't stop a busy founder mid-task.
- Pre-flight `git fetch origin` in `/zao-research` skill - it does sync but doesn't prevent the parallel session from also picking the same number.
- The `safe-git-push.sh` hook - over-broad scope made it actively harmful in Incident 3.

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Patch `~/bin/safe-git-push.sh` to scope to git commands only | Zaal | One-shot | Today (high impact) |
| Add main-repo-checkout refusal to the same hook | Zaal | One-shot | Today |
| Update `/worksession` skill to detect main-repo pwd + warn | Zaal | Skill PR | This week |
| Update `/zao-research` skill v3: pre-flight remote ws/* collision check | Zaal | Skill PR | This week |
| Quarterly prune of merged ws/* branches | Zaal | Cron / one-shot | Each Friday end-of-week |
| Update memory `feedback_workspace_worktrees` to reference this doc | Zaal | Memory edit | Today |

## Also See

- [Doc 459 - Workspace worktrees policy](../../) (referenced in memory) - locate exact path
- [Doc 551 - Research roadmap + library audit](../551-research-roadmap-library-audit/) - dupe-number issue is symptom of same problem
- Memory `feedback_workspace_worktrees`
- Memory `feedback_branch_discipline`
- Memory `project_fix_pr_pipeline_live` (Doc 461 / 523) - related pre-push pipeline

## Sources

- Live `git worktree list` and `git branch -a` 2026-04-29
- This session's own incident logs (Bash hook errors captured verbatim)
- Memory `feedback_workspace_worktrees` (canonical workflow rule)

## Staleness Notes

The hook fix is highest-impact and cheapest. Re-validate after Fix 1 ships. Re-audit after each major worktree-tooling change.
