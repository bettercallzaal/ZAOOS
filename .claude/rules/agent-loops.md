# Agent Loop Operating Rules

Binding for any autonomous /loop or agent building or deploying in this repo (Claude Code sessions and ZOE's own loops). Numbers are STABLE cross-references - never renumber. Incidents, sources and the fold-back history: `research/dev-workflows/2649-rules-history/archive/agent-loops.md`.

1. **Ground truth over confidence.** Done only when `npm run typecheck` (0 errors), `esbuild`/build and the relevant tests are green and the bot boots clean. tsc alone is not enough.
2. **Read state before acting.** Start each pass with `git log -5`, a typecheck and the progress note. Open only the files the task touches.
3. **Read live code before building.** Usually "build X" is "X exists, wire the last 10%". Code is ground truth; docs are aspirational.
4. **One feature at a time; never leave a broken state.** Plan, code, verify, commit one feature before the next. If interrupted, the branch must be consistent.
5. **Cost and iteration ceilings.** Every autonomous path has a hard cap (daily item cap, budget cap, one-instance lock). Empty queue = zero spend.
6. **Persist lessons to the repo, and route each kind of correction to the store that owns it.** Memory = user/project facts; operating lessons = the repo.

   | Correction type | Goes to |
   |---|---|
   | Missing or outdated fact | the vault (`~/zao-vault/notes/`), or the ICM box if brand truth (box wins) |
   | New strategic choice | a decision note (`~/zao-vault/decisions/`) + a `project_*.md` memory |
   | Repeated preference | a rule in `.claude/rules/*.md`, committed |
   | Proven technique | a skill `~/.claude/skills/<name>/SKILL.md`, git-tracked |
   | Repeatable sequence | a worker (ZOE module or cron) - no new bots without a doc |
   | Dangerous action | a mechanical gate: a settings deny rule or hook that denies the command SHAPE |

   Which store wins on conflict: `handoff-discipline.md` rule 7.
7. **Subagents for bounded research/isolation; inline for the hot path.** Code, verify, commit stays inline. Don't grow one giant prompt.
8. **PR-only + human gate is the circuit breaker.** Never push to main or force-push. Autonomous work opens PRs; a human merges. Outbound (posts/DMs), on-chain and spend stay human-gated. Research docs and internal pings can be autonomous.
9. **One instance per resource.** Only one process polls a given bot token or holds a given lock. Check liveness by PROCESS, not tmux session name.
10. **Learn online periodically.** Every several cycles, pull fresh best practice and fold behavior-changing items back into these rules.
11. **Git hygiene on a shared clone.** Never leave uncommitted changes across sequential commands; commit before switching branches; after merging, `git reset --hard origin/main`; verify a fix is on origin/main before claiming it landed.
12. **Do gh-api file edits inline, not in shell functions** (multi-line vars with backticks/`##`/`**` get mangled).
13. **Fetch the file's fresh `.sha` immediately before each `PUT`.** On 409, re-fetch and retry.
14. **External create/write APIs: send browser headers** (`User-Agent: Mozilla...`, `Origin`, `Referer`) and check the OpenAPI `requestBody` field name.
15. **Own a resource by creating it yourself and capture the owner key.** Save keys to `~/.zao/private/` (chmod 600); never print or commit them.
16. **Watch sibling loops by their OUTPUT, not their process.** Flag a loop with no new branches/commits/PRs for ~2h+.
17. **Self-iterate every few ticks.** A new loop-ops lesson gets appended here and PR'd.
18. **Multi-line content edits go through a python script FILE, never inline shell; read the diff.** The `.py` fetches with `urllib` + `gh auth token`, builds the body in a triple-quoted string, base64-encodes, and `PUT`s. Abort if the pre-edit GET is empty or `content` is missing. On an append, only a non-zero deletion count is the alarm.
19. **To land a PR blocked by the doc-collision guard, rebase onto a NEW branch** (`git rebase origin/main` in a worktree, `git push origin HEAD:refs/heads/<new-branch>`), open a fresh PR, close the old as superseded. Never merge main in.
20. **Never run two file-writing subagents concurrently in one clone** - sequential, or each in `isolation: worktree`.
21. **Never boot-verify a poller entrypoint by importing or running it.** Verify with `tsc --noEmit`, `vitest run`, and `tsx -e "import(...)"` on non-entrypoint modules only. NEVER import `index.ts` or any file whose top-level boots the bot. Trust the deployed process (in `ps`) as the one poller; verify it by reading logs/liveness, not by launching a second.
22. **"Blocked" means needs a human or a gated action, not "not tried yet".** Exhaust self-serve (clone, read live code, search the API, network-free selftest) first. Reserve "blocked" for a gated action, a Mac-local asset the VPS can't reach, a merge decision, or a credential you don't hold.
23. **PR bodies with backticks/`$`/`{}` go through `--body-file`, never inline `--body`.**
24. **Redaction/secret scans for anything leaving to an external party are case-insensitive (`grep -inE`) and a standalone gate.** Scan the full sensitive set, read the output, fix, re-scan, then commit. If a leak reaches a pushed branch, delete the remote branch and re-push clean history before opening the PR.
25. **On a shared clone with a concurrent writer, all building goes through `git worktree add` off origin/main** - never touch the shared tree's HEAD: `git worktree add -b <branch> /tmp/wt-x origin/main`, symlink `node_modules` in, commit and push from there, then `git worktree remove`.
26. **`gh pr merge`/`gh pr create` do not update local `origin/main`** - `git fetch origin main` immediately before `git worktree add ... origin/main`.
27. **Never put a mutating command on the same shell line as a scan/guard via `&&`/`||`.** Run the guard as its own step, look at it, then commit separately.
28. **Claim before you build, and check for a sibling already building it.** For a board task, confirm it is not already `in_progress`, then claim it. Before building any tool/doc/feature, run `gh pr list --search "<topic>"` and `git ls-remote --heads origin | grep <topic>`. If a sibling did it, don't ship a second copy.
29. **Never union-merge a CODE conflict - hand-resolve it.** `merge=union` is scoped to `research/**` and `*.md` only.
30. **Boot-verify hard-fails when its verifier tool is absent.** Use the repo-local binary by explicit path, assert it is executable, abort the deploy if missing.
31. **Verify on a fresh checkout of the target commit, then restart the live bot onto it** - never verify the live clone in place. The fix must be committed on origin/main.
32. **The verify checkout must contain the target commit's object.** `git clone --depth 1 <localclone>` does NOT bring the clone's `origin/main` object; verify with `git -C "$LIVE" worktree add --detach /tmp/zoe-verify origin/main`. Assert its `HEAD` equals the intended SHA before trusting the verify. Never hot-edit the live deploy script or restart the bot yourself.
33. **Verify a subagent's file-writes and severity grades before trusting or PR-ing them** - `ls` the file, spot-read high-stakes findings, downgrade honestly.
34. **A subagent that writes a numbered research doc will collide - relocate it** to a reserved number in a worktree off origin/main, add the index row, PR it, and leave the working tree clean.
35. **Overnight/unsupervised loops are PR-only and honest, never auto-code.** Deliverables are reviewable artifacts (docs/rules/specs as PRs) - NOT unsupervised code changes to live routes, NOT merges, NOT anything gated. A real bug found at 3am is documented and flagged, not fixed in prod.
36. **Coordination is a shared surface, not the human as message bus.** Claude-to-Claude on one machine: `SendMessage`. Cross-machine (Mac / Windows / VPS / Pi), non-Claude agents, and reaching Zaal's phone via ZOE: the relay/bus. A message is transport, never the record - anything that matters lands in the vault handoff, the board or a PR.
37. **A follow-up push to an open PR has not landed until you verify the PR was still open when it arrived.** After any follow-up push: `gh pr view <n> --json state,mergedAt` and confirm the SHA is in the merged range. Recovery: cherry-pick (-x) onto a fresh branch off current origin/main and open a new PR; correct any title/body that claimed the stranded work.
