# Explicit Write Target - a tool that writes names its repo; the cwd never decides

mechanism: none yet (since 2026-10-23, #3470)

Every instance below wrote to a tree nobody chose, and each reported success:

- ZAOOS#3470, 2026-09-10: a `git clone` and a `cd` failed mid-chain, so `git remote remove origin` and `gh repo create --source=. --push` ran in the inherited cwd, `~/zao-vault`. The vault's tree was pushed to a new repo.
- ZAOOS#3470, 2026-10-20: `zao-status-append`, run from a shell sitting in a scratch vault worktree, appended to that worktree. The tool's own rule was "the caller's worktree wins". Fix: zaal-dotfiles#590.
- ZAOOS#4056, 2026-10-20: lanes ran `~/zao-vault/scripts/inflight-row.py`, the copy checked out in a clone 2350 commits behind origin. That copy committed rows onto the clone's local main, and they never reached origin. Fix: zaal-dotfiles#588.

Rule numbers are stable.

1. **Every write, commit, push or repo creation names its target by absolute path:** `git -C <abs>`, or a `--vault <path>` / `--repo <path>` argument. The inherited cwd never picks the target, in a tool or in a chained command.
2. **A tool's default target is a fixed path** (`~/zao-vault`), never "wherever the caller is".
3. **A path argument is checked to be the repo it claims before any write,** by its git common dir or its origin URL. Otherwise the tool refuses and writes nothing. A typo must not land a commit on another repo's main.
4. **In a chain, a step that can fail stops the chain.** Put `cd /abs || exit 1` on its own; a failed clone or checkout aborts everything after it.
5. **A shared clone is written through a throwaway worktree at origin/main.** Success is the push confirmed by `git merge-base --is-ancestor <sha> origin/main`; a local-only commit is not success.
6. **Run the copy of a tool that origin/main has,** not one checked out in a diverged clone. `zao-inflight-row` does this for the BLACKBOARD row writer.
