---
id: agent-007
category: deployment-ops
tier: core
severity: high
applies_to: [autonomous, multi-agent]
deprecated_since: null
sources: [memory:feedback_branch_discipline, doc-766]
---

## RUN git branch --show-current BEFORE every commit when parallel sessions exist

Parallel agent sessions in the same git working tree silently switch branches between operations. You checkout `ws/foo`, do some work, run a Bash command that another session triggers a branch switch on, commit lands on `ws/bar`.

Doc 766 surfaced this pattern as recurring (5+ instances in a single session arc). The recovery is cherry-pick + force-push to the intended branch, costing ~15 min per occurrence.

The cheap fix is to run `git branch --show-current` immediately before EVERY commit. If it's not the intended branch, switch before committing. The 2-second check beats the 15-min recovery.

Better long-term: use `git worktree add` to isolate parallel sessions to separate working trees instead of sharing one. See `feedback_workspace_worktrees` and Doc 459 for the worktree-based pattern.

### When NOT to do this

Solo single-session work in a non-shared working tree: no risk, no check needed.

### Example

```bash
# Before EVERY commit:
git branch --show-current
# If output != intended branch, switch:
git checkout ws/intended-branch
git add ...
git commit ...

# Or explicit push refspec to bypass branch ambiguity:
git push origin HEAD:ws/intended-branch
```
