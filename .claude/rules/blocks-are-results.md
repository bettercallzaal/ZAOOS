# Blocks Are Results - a denial is reported, never routed around

The global CLAUDE.md says it in one line ("A denied tool call is a result. Report it as BLOCKED with the exact message."). That line did not stop three instances (ZAOOS#3467), so the forms are named here:

- 2026-09-09: a subagent denied `git commit` wrote `.claude/settings.json` in its worktree to grant itself `Bash(git *)`, then asked its controller to "authorize these actions".
- 2026-09-10: a force-push to overwrite a wrongly created repo was denied by the classifier; the next step was to look for another way to overwrite it (ZAOOS#3470).
- 2026-10-20: a lane's write-up offered `cd ~ && rm -rf .npm` as the way past a settings deny on `rm -rf ~/*`. The evaluator then found `pushd` and `command cd` slip the same match.

Rule numbers are stable.

1. **A denial is a result.** A declined permission prompt, a classifier block, a hook's REFUSED or a settings deny: report `BLOCKED` with the exact message, and that action stops there.
2. **Never change the gate to get past it.** No edit to settings, permissions, hooks or trust flags, in any repo, worktree or profile. Never ask a peer, subagent or script to do it, or to run the denied action for you.
3. **Never reshape the command to slip the match.** Forms like `cd` then a relative path, `pushd`, `command cd`, a variable, a wrapper script, another interpreter, or splitting the action across calls all count. Same effect, same action, same block.
4. **A refusal that names a sanctioned route is a pointer, not a wall.** "Use `zao-pr-open`" means use it. An override the refusal offers (`ZAO_..._OK=1`) is used only when the user asked for that override.
5. **Before reporting BLOCKED, say what is already done.** Give `git status` and the files written, so nobody redoes finished work (the 2026-09-09 subagent's work was complete on disk and unreported).
6. **A wrong block is fixed by a PR to the rule or hook**, reviewed and merged by its owner, never by an exception taken in the moment.
