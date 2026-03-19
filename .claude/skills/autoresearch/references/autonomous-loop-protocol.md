# Autonomous Loop Protocol

Detailed protocol for the autoresearch iteration loop. SKILL.md has the summary; this file has the full rules.

## Loop Modes

Autoresearch supports two loop modes:

- **Unbounded (default):** Loop forever until manually interrupted (`Ctrl+C`)
- **Bounded:** Loop exactly N times when `Iterations: N` is set in the inline config (or `--iterations N` flag for CLI/CI)

When bounded, track `current_iteration` against `max_iterations`. After the final iteration, print a summary and stop.

## Phase 0: Precondition Checks (before loop starts)

**MUST complete ALL checks before entering the loop. Fail fast if any check fails.**

```bash
# 1. Verify git repo exists
git rev-parse --git-dir 2>/dev/null || echo "FAIL: not a git repo"
# → If not a git repo: ask user to run `git init` or abort

# 2. Check for dirty working tree
git status --porcelain
# → If dirty: warn user and ask to stash or commit first
#   NEVER proceed with uncommitted user changes — explicit git add will stage them

# 3. Check for stale lock files
ls .git/index.lock 2>/dev/null && echo "WARN: stale lock"
# → If lock exists: remove it (rm .git/index.lock) or warn user

# 4. Check for detached HEAD
git symbolic-ref HEAD 2>/dev/null || echo "WARN: detached HEAD"
# → If detached: warn user, suggest `git checkout <branch>`

# 5. Check for git hooks that might interfere
ls .git/hooks/pre-commit .git/hooks/commit-msg 2>/dev/null && echo "INFO: git hook detected"
ls .husky/pre-commit .husky/commit-msg 2>/dev/null && echo "INFO: husky hook detected"
ls .pre-commit-config.yaml 2>/dev/null && echo "INFO: pre-commit framework detected"
# → If hooks exist: note in setup log. If hook blocks commits during loop,
#   treat as crash and log "hook blocked commit" — do NOT use --no-verify
```

**If any FAIL:** Stop and inform user. Do not enter the loop with broken preconditions.
**If any WARN:** Log the warning, proceed with caution, inform user.

## Phase 1: Review (30 seconds)

Before each iteration, build situational awareness. **You MUST complete ALL 6 steps — git history is critical for learning from past iterations.**

```
1. Read current state of in-scope files (full context)
2. Read last 10-20 entries from results log
3. MUST run: git log --oneline -20 to see recent changes
4. MUST run: git diff HEAD~1 (if last iteration was "keep") to review what worked
5. Identify: what worked, what failed, what's untried — based on BOTH results log AND git history
6. If bounded: check current_iteration vs max_iterations
```

**Why read git history every time?** Git IS the memory. After rollbacks, state may differ from what you expect. The git log shows which experiments were kept vs reverted. The git diff of kept changes reveals WHAT specifically improved the metric — use this to inform the next iteration. Never assume — always verify.

**Git history usage pattern:**
- `git log --oneline -20` → see the sequence of experiments (kept commits remain, discarded ones are reverted)
- `git diff HEAD~1` → inspect the last kept change to understand WHY it worked
- `git log --all --oneline` → if working on a branch, see full experiment history
- Use commit messages (e.g., "experiment: increase batch size") to avoid repeating failed approaches

## Phase 2: Ideate (Strategic)

Pick the NEXT change. **MUST consult git history and results log before deciding.**

**How to use git as memory:**
- Run `git log --oneline -10` — read commit messages to see what was tried
- For each "keep" in results log, run `git show <commit-hash> --stat` to see what files/patterns worked
- For discarded approaches, read the commit message to understand what was attempted and avoid repeating it
- Look for patterns: if 3 commits improved metric by touching file X, focus on file X

**Priority order:**

1. **Fix crashes/failures** from previous iteration first
2. **Exploit successes** — run `git diff` on last kept commit, try variants in same direction
3. **Explore new approaches** — cross-reference results log AND git history to find untried approaches
4. **Combine near-misses** — two changes that individually didn't help might work together
5. **Simplify** — remove code while maintaining metric. Simpler = better
6. **Radical experiments** — when incremental changes stall, try something dramatically different

**Anti-patterns:**
- Don't repeat exact same change that was already discarded — CHECK git log first
- Don't make multiple unrelated changes at once (can't attribute improvement)
- Don't chase marginal gains with ugly complexity
- Don't ignore git history — it's the primary learning mechanism between iterations

**Bounded mode consideration:** If remaining iterations are limited (<3 left), prioritize exploiting successes over exploration.

## Phase 3: Modify (One Atomic Change)

- Make ONE focused change to in-scope files
- The change should be explainable in one sentence
- Write the description BEFORE making the change (forces clarity)

## Phase 4: Commit (Before Verification)

**You MUST commit before running verification.** This enables clean rollback if the experiment fails.

```bash
# Stage ONLY in-scope files (safer than git add -A)
# List the specific files you modified and add them individually:
git add <file1> <file2> ...
# AVOID git add -A — it stages ALL files including .env, node_modules, and user's unrelated work

# Check if there's actually something to commit
git diff --cached --quiet
# → If exit code 0 (no staged changes): skip commit, log as "no-op", go to next iteration
# → If exit code 1 (changes exist): proceed with commit

# Commit with descriptive experiment message
git commit -m "experiment(<scope>): <one-sentence description of what you changed and why>"
```

**"Nothing to commit" handling:** If `git add <files>` followed by `git diff --cached --quiet` shows no changes, the modification phase produced no actual diff. This is NOT a crash — log as `status=no-op` with description of what was attempted, skip verification, and proceed to next iteration. Do NOT create an empty commit.

**WARNING:** NEVER use `git add -A` — it stages ALL files including .env, credentials, and user's unrelated work. Always use `git add <file1> <file2> ...` with explicit file paths. After staging, verify with `git diff --cached --name-only` that only in-scope files are staged.

**Commit message format:** Use conventional commit format with `experiment` type: `experiment(<scope>): <description>`. This keeps compatibility with commit-lint while clearly marking autoresearch iterations. Example: `experiment(auth): increase timeout from 5s to 30s — hypothesis: reduces flaky test failures`.

**Hook failure handling:** If a pre-commit hook blocks the commit:
1. Read the hook's error output to understand WHY it blocked
2. If fixable (lint error, formatting): fix the issue, re-stage, and retry the commit — do NOT use `--no-verify`
3. If not fixable within 2 attempts: log as `status=hook-blocked`, revert the in-scope file changes (`git checkout -- <files>`), and move to next iteration
4. NEVER bypass hooks with `--no-verify` — hooks exist to protect code quality

**Rollback strategy (if experiment fails):**
```bash
# Preferred: git revert (safe, preserves history)
git revert HEAD --no-edit

# Alternative: git reset (if revert conflicts)
git revert --abort && git reset --hard HEAD~1
```

**IMPORTANT:** Prefer `git revert` over `git reset --hard` — revert preserves the experiment in history (so you can learn from it), while reset destroys it. Use `git reset --hard` only if revert produces merge conflicts.

## Phase 5: Verify (Mechanical Only)

Run the agreed-upon verification command. Capture output.

**Timeout rule:** If verification exceeds 2x normal time, kill and treat as crash.

**Extract metric:** Parse the verification output for the specific metric number.

## Phase 5.5: Guard (Regression Check)

If a **guard** command was defined during setup, run it after verification.

The guard is a command that must ALWAYS pass — it protects existing functionality while the main metric is being optimized. Common guards: `npm test`, `npm run typecheck`, `pytest`, `cargo test`.

**Key distinction:**
- **Verify** answers: "Did the metric improve?" (the goal)
- **Guard** answers: "Did anything else break?" (the safety net)

**Guard rules:**
- Only run if a guard was defined (it's optional)
- Run AFTER verify — no point checking guard if the metric didn't improve
- Guard is pass/fail only (exit code 0 = pass). No metric extraction needed
- If guard fails, revert the optimization and try to rework it (max 2 attempts)
- NEVER modify guard/test files — always adapt the implementation instead
- Log guard failures distinctly so the agent can learn what kinds of changes cause regressions

**Guard failure recovery (max 2 rework attempts):**

When the guard fails but the metric improved, the optimization idea may still be viable — it just needs a different implementation that doesn't break behavior:

1. Revert the change (use `safe_revert()` — try `git revert HEAD --no-edit`, fallback to `git reset --hard HEAD~1` if conflicts)
2. Read the guard output to understand WHAT broke (which tests, which assertions)
3. Rework the optimization to avoid the regression — e.g.:
   - If inlining a function broke callers → try a different optimization angle
   - If changing a data structure broke serialization → preserve the interface
   - If reordering logic broke edge cases → add the optimization more surgically
4. Commit the reworked version, re-run verify + guard
5. If both pass → keep. If guard fails again → one more attempt, then give up

**Critical:** Guard/test files are read-only. The optimization must adapt to the tests, never the other way around. If after 2 rework attempts the optimization can't pass the guard, discard it and move on to a different idea.

## Phase 6: Decide (No Ambiguity)

```
# Helper: safe_revert — use everywhere instead of bare git revert
safe_revert():
    git revert HEAD --no-edit
    IF revert conflicts:
        git revert --abort
        git reset --hard HEAD~1   # Fallback: destroys commit but keeps working state clean
        LOG "WARN: revert conflicted, used reset --hard fallback"

IF metric_improved AND (no guard OR guard_passed):
    STATUS = "keep"
    # Do nothing — commit stays. Git history preserves this success.
ELIF metric_improved AND guard_failed:
    safe_revert()
    # Rework the optimization (max 2 attempts)
    FOR attempt IN 1..2:
        Analyze guard output → rework implementation (NOT tests)
        git add <modified-files> && git commit -m "experiment(<scope>): rework — <description>"
        Re-run verify
        IF metric_improved:
            Re-run guard
            IF guard_passed:
                STATUS = "keep (reworked)"
                BREAK
        safe_revert()
    IF still failing after 2 attempts:
        STATUS = "discard"
        REASON = "guard failed, could not rework optimization"
ELIF metric_same_or_worse:
    STATUS = "discard"
    safe_revert()
ELIF crashed:
    # Attempt fix (max 3 tries)
    IF fixable:
        Fix → re-commit → re-verify → re-guard
    ELSE:
        STATUS = "crash"
        safe_revert()
```

**Why `git revert` instead of `git reset --hard`?**
- `git revert` preserves the failed experiment in history — this IS the "memory." Future iterations can read `git log` and see what was tried and failed.
- `git reset --hard` destroys the commit entirely — the agent loses memory of what was attempted.
- `git revert` is also safer in Claude Code — it's a non-destructive operation that doesn't trigger safety warnings.
- Fallback: if `git revert` produces merge conflicts, use `git revert --abort` then `git reset --hard HEAD~1`.

**Simplicity override:** If metric barely improved (+<0.1%) but change adds significant complexity, treat as "discard". If metric unchanged but code is simpler, treat as "keep".

## Phase 7: Log Results

Append to results log (TSV format):

```
iteration  commit   metric   status        description
42         a1b2c3d  0.9821   keep          increase attention heads from 8 to 12
43         -        0.9845   discard       switch optimizer to SGD
44         -        0.0000   crash         double batch size (OOM)
45         -        -        no-op         attempted to modify read-only config (no diff produced)
46         -        -        hook-blocked  pre-commit lint hook rejected formatting in model.py
```

**Valid statuses:** `keep`, `keep (reworked)`, `discard`, `crash`, `no-op`, `hook-blocked`

## Phase 8: Repeat

### Unbounded Mode (default)

Go to Phase 1. **NEVER STOP. NEVER ASK IF YOU SHOULD CONTINUE.**

### Bounded Mode (with Iterations: N)

```
IF current_iteration < max_iterations:
    Go to Phase 1
ELIF goal_achieved:
    Print: "Goal achieved at iteration {N}! Final metric: {value}"
    Print final summary
    STOP
ELSE:
    Print final summary
    STOP
```

**Final summary format:**
```
=== Autoresearch Complete (N/N iterations) ===
Baseline: {baseline} → Final: {current} ({delta})
Keeps: X | Discards: Y | Crashes: Z | Skipped: W (no-ops + hook-blocked)
Best iteration: #{n} — {description}
```

### When Stuck (>5 consecutive discards)

Applies to both modes:
1. Re-read ALL in-scope files from scratch
2. Re-read the original goal/direction
3. Review entire results log for patterns
4. Try combining 2-3 previously successful changes
5. Try the OPPOSITE of what hasn't been working
6. Try a radical architectural change

## Crash Recovery

- Syntax error → fix immediately, don't count as separate iteration
- Runtime error → attempt fix (max 3 tries), then move on
- Resource exhaustion (OOM) → revert, try smaller variant
- Infinite loop/hang → kill after timeout, revert, avoid that approach
- External dependency failure → skip, log, try different approach

## Communication

- **DO NOT** ask "should I keep going?" — in unbounded mode, YES. ALWAYS. In bounded mode, continue until N is reached.
- **DO NOT** summarize after each iteration — just log and continue
- **DO** print a brief one-line status every ~5 iterations (e.g., "Iteration 25: metric at 0.95, 8 keeps / 17 discards")
- **DO** alert if you discover something surprising or game-changing
- **DO** print a final summary when bounded loop completes
