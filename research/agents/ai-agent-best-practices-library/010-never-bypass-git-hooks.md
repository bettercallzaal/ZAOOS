---
id: agent-010
category: deployment-ops
tier: core
severity: critical
applies_to: [autonomous]
deprecated_since: null
sources: [memory:feedback_no_grep_secrets, memory:feedback_never_push_main, ".claude/settings.json PreToolUse hooks"]
---

## NEVER bypass git hooks with --no-verify

Pre-commit and pre-push hooks are the last automated guard against shipping broken / unsafe code. Bypassing them with `--no-verify` is a deliberate downgrade of the safety system.

For autonomous agents this is especially dangerous: an agent that bypasses hooks once will bypass them again, normalizing the pattern. The config-protection hook in `.claude/settings.json` actively blocks `--no-verify` for this reason.

If a hook fails, the answer is to fix the underlying issue (the failing typecheck, the lint error, the secret in the diff) - not to skip the gate. Yes this is slower. The speed loss is the price of the safety guarantee.

Pre-existing failures NOT introduced by your changes are still a signal: someone else's broken work is now your problem to either fix or hand back to the owner. Don't paper over.

### When NOT to do this

Genuinely emergency hot-fixes where Zaal has explicitly authorized the bypass in chat (rare). Even then, document the bypass in the commit message + open a follow-up issue.

### Example

```bash
# WRONG
git commit --no-verify -m "lint failing, will fix later"
git push --no-verify

# CORRECT
git commit -m "..."
# Hook fails on typecheck error in worktrees/stray. Diagnose:
git ls-files --stage worktrees/stray
# It's an orphan submodule pointer. Fix:
git rm --cached worktrees/stray
rm -rf worktrees/stray
# Re-commit cleanly
git commit -m "..."
```
