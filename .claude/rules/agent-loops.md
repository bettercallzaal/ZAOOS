# Agent Loop Operating Rules

Durable operating rules for any autonomous /loop or agent building/deploying in this repo (Claude Code sessions + ZOE's own loops). Learned online 2026-06-30 (Anthropic "building effective agents" + "effective harnesses for long-running agents") and folded back from live sessions since. Numbers are STABLE cross-references - never renumber. Incident detail for each rule lives in the doc/feedback it cites; this file keeps only the behavior-changing directive.

## The rules (behavior-changing)

1. **Ground truth over confidence.** A change is done only when `npm run typecheck` (0 errors), `esbuild`/build, and the relevant tests are green, and the bot boots clean. tsc-passing alone is not enough - esbuild can still crash the bot ([[feedback_validate_bot_changes_with_boot]]).

2. **Read state before acting.** Start each pass with `git log -5` + a typecheck + the progress note. Open only the files the task touches - do NOT re-read the whole codebase each cycle.

3. **Read live code before building.** Docs/gap-analyses overstate what's missing; usually "build X" is really "X exists, wire the last 10%." Code is ground truth; docs are aspirational.

4. **One feature at a time; never leave a broken state.** Plan -> code -> verify -> commit one feature before the next. If interrupted, the repo/branch must be consistent.

5. **Cost + iteration ceilings.** Every autonomous path needs a hard cap (daily item cap, budget cap, one-instance lock). Empty-queue = zero spend. Assume it stops when broke, not when done.

6. **Persist lessons to the repo, not just memory.** A repeated bug/lesson lands in `.claude/rules/` or a skill and gets committed, so future loops read it. Memory = user/project facts; operating lessons = the repo.

7. **Subagents for bounded research/isolation; inline for the hot path.** Subagent for "research/audit/verify X" (context isolation, cheaper). Keep code -> verify -> commit inline. Don't grow one giant prompt.

8. **PR-only + human gate is the circuit breaker.** Never push to main or force-push. Autonomous work opens PRs; a human merges. Outbound (posts/DMs), on-chain, and spend stay human-gated. Research docs + internal pings can be autonomous.

9. **One instance per resource.** Only one process may poll a given bot token / hold a given lock ([[project_zoe_one_instance_409]]). A second = split-brain. Check liveness by PROCESS, not tmux-session-name.

10. **Learn online periodically.** Every several cycles, pull fresh best-practices from the web and fold behavior-changing ones back into these rules. The loop improves itself, not just the product.

11. **Git hygiene on a shared clone.** NEVER leave uncommitted changes across sequential commands - a later `git checkout main` silently reverts them. Commit/stash before switching branches; after merging, `git reset --hard origin/main`; verify a fix is on origin/main (not just the working tree) before claiming it landed.

12. **Do gh-api file edits INLINE, not in shell functions.** A shell function holding a multi-line block var with backticks/`##`/`**` silently mangles the vars (every fetch looks empty). Repeat inline per repo.

13. **Fetch the file's fresh `.sha` immediately before each `PUT`.** SHAs drift; a stale sha 409s. On 409, re-fetch the sha and retry - don't abort.

14. **External create/write APIs: send browser headers.** A public API can 403 headless curl even when the OpenAPI says no auth - send `User-Agent: Mozilla...`, `Origin`, `Referer`. Check the OpenAPI `requestBody` for the exact field name.

15. **Own a resource by creating it yourself + capture the owner key.** When a tool shows an owner secret once (e.g. useicm `api_key` on create), create via API to capture it; save keys to `~/.zao/private/` (chmod 600), never print/commit. Browser-minted resources with the key uncaptured are un-editable orphans.

16. **Watch sibling loops by their OUTPUT, not their process.** Poll recent branches/commits/PRs of the repos other loops write to; flag a loop with no new output for ~2h+ (a dead script in a live tmux hides this - rule 9).

17. **Self-iterate every few ticks.** When a new loop-ops lesson appears, append it here and PR it. Rule 10 made concrete ("the loop is the product" - doc 994).

18. **Multi-line content edits go through a python-script FILE, never inline shell; read the diff.** Interpolated `{`,`}`,`$`,backticks clobber the command. Use a `.py` that fetches with `urllib`+`gh auth token`, builds the body in a triple-quoted string, base64-encodes, `PUT`s. Guards: (a) abort if the pre-edit GET is empty/`content` missing - never write a from-scratch file over a fetch failure; (b) "N additions, 0 deletions" on an append is NORMAL - only a non-zero deletion count on an intended append is the alarm.

19. **To land a live-code PR blocked by the research doc-collision guard, REBASE onto a NEW branch - don't merge-in main.** In a worktree, `git rebase origin/main` (replays only the branch's own files), resolve once, `git rebase --continue`. Force-push is blocked, so `git push origin HEAD:refs/heads/<new-branch>` (detached HEAD needs the full `refs/heads/` ref), open a fresh PR, close the old as superseded. Root cause is doc-numbering; real fix is ranges-per-agent.

20. **NEVER run two file-writing subagents concurrently in ONE clone - sequential, or give each an isolated worktree.** Commits are atomic per-branch but PR CREATION races (a PR opened against the wrong branch's head). `await` a subagent AND its `git reset --hard origin/main` fully before spawning the next. Concurrency only via `isolation: worktree`. (Concrete failure rule 11 warned about, at subagent granularity.)

21. **NEVER boot-verify a poller-entrypoint by importing/running it - it starts a live poll and collides with the running instance (rule 9).** To verify bot code: `tsc --noEmit`, `vitest run`, and `tsx -e "import('./src/zoe/concierge.ts')"` on NON-entrypoint modules only. NEVER import `index.ts` / any file whose top-level boots the bot. Trust the deployed process (in `ps`) is the one poller; verify it by reading logs/liveness, not launching a second.

22. **"Blocked" means needs-a-human-or-gated-action, NOT "I have not tried yet."** Before you park an item, exhaust self-serve: `gh repo clone` the target, read the live code, `WebSearch`/`WebFetch` the API, run a network-free selftest. Reserve "blocked" for a gated action, a Mac-local asset the VPS can't reach, a merge decision, or a credential you don't hold.

23. **PR bodies with backticks/`$`/`{}` go through `--body-file`, never inline `--body "..."`** (the shell runs backticked substrings as command substitution). And NEVER chain a safety scan + a `git commit` on one line - see rule 27.

24. **Redaction/secret scans for anything leaving to an external party must be case-INSENSITIVE (`grep -inE`) and a standalone gate.** Scan the full sensitive set (usernames, hostnames, IPs, tokens, key names, chat ids), read the output yourself, fix, re-scan, then commit. If a leak reaches a pushed branch, `git push origin --delete <branch>` then re-push the clean-history branch BEFORE opening the PR (force-push is blocked - rule 19).

25. **On a shared clone with a concurrent writer, ALL building goes through `git worktree add` off origin/main - never touch the shared working tree's HEAD.** HEAD can move between your `checkout -b` and your `commit`, landing the commit on main. `git worktree add -b <branch> /tmp/wt-x origin/main`, symlink `node_modules` in, commit+push from there, `git worktree remove`.

26. **`gh pr merge`/`gh pr create` do NOT update the local `origin/main` ref - always `git fetch origin main` immediately before `git worktree add ... origin/main`.** A stale ref reintroduces just-fixed state and false-fails the index guard.

27. **NEVER put a mutating command (`git commit`/`git push`/an API insert) on the same shell line as a scan/guard via `&&`/`||`.** `A && B || C && D` parses as `((A && B) || C) && D` - the commit runs whenever the left group is truthy. Run the guard as its OWN step (`bash scan; echo "EXIT=$?"`), LOOK at it, then commit separately.

28. **CLAIM before you build, and CHECK for a sibling already building it.** Before a board task: confirm it's not already `in_progress`, then claim it. Before building any tool/doc/feature: a 10-second `gh pr list --search "<topic>"` + `git ls-remote --heads origin | grep <topic>`. If a sibling did it, don't ship a second copy. (Rule 16 as a pre-flight step.)

29. **NEVER union-merge (dedupe-lines) a CODE conflict - hand-resolve it.** Union is safe ONLY for append-only prose (research docs, changelogs); on code it duplicates blocks and drops braces. The `.gitattributes` `merge=union` driver must be scoped to `research/**` and `*.md` ONLY - never `**/*.ts`.

30. **Boot-verify must HARD-FAIL when its verifier tool is absent - a missing tool is not a pass.** Use the repo-local binary by explicit path (`./bot/node_modules/.bin/esbuild`), assert it's executable first, and if it can't be obtained, ABORT the deploy and page. `tsc` alone is not enough - esbuild bundles the actual boot graph (rule 1).

31. **Verify on a FRESH checkout of the target commit, then restart the live bot onto it - never verify the live clone in place.** `zoe-autodeploy.sh` v2: verify origin/main in a throwaway checkout, and only on green ff the live clone + `npm install` + restart + health-check + auto-rollback on any boot error. The fix must be COMMITTED in origin/main, not an uncommitted edit a checkout reverts (rule 11).

32. **The verify checkout MUST actually contain the target commit's object.** `git clone --depth 1 <localclone>` does NOT bring the clone's `origin/main` object, so you silently verify the WRONG (stale) commit and the deploy stalls. Verify by `git -C "$LIVE" worktree add --detach /tmp/zoe-verify origin/main` (the live clone already has the object). General rule: **assert the verify checkout's `HEAD` equals the intended SHA before trusting the verify** - a verify against the wrong commit is a vacuous pass (sibling of rule 30). This is a gated `~/bin` operator script - never hot-edit the live deploy script or restart the bot yourself.

33. **VERIFY a subagent's file-writes and severity grades before trusting or PR-ing them.** A subagent's "the rule has been written to X" / "8 critical bugs" is a CLAIM, not a fact: `ls` the file it says it wrote, spot-read the source for any high-stakes finding, downgrade honestly. Extends [[feedback_no_sub_agent_context_fabrication]]. See also `anti-fabrication.md`.

34. **A subagent that writes a numbered research doc will collide - relocate it.** Reserve the real next number, move the content to a worktree off origin/main at that number (`sed` its self-refs), add the index row, PR it, and `rm` the stray so the working tree is left clean (rule 11).

35. **Overnight/unsupervised loops are PR-only + honest, never auto-code.** Deliverable = durable reviewable artifacts (docs/rules/specs -> PRs), NOT unsupervised code changes to live routes, NOT merges, NOT anything gated. A real bug found at 3am is DOCUMENTED + flagged, not fixed in prod.

36. **Coordination is a shared surface, not the human as message bus.** Don't run a session on Zaal hand-relaying paste-blocks between terminals. **Claude-to-Claude on one machine: use the native `SendMessage`** (shipped 2026-08-07) - named addressing that outlives the agent, push delivery, and a summary rather than your history. **Everything else stays on the relay/bus**: cross-machine (Mac / Windows desktop / VPS / Pi), non-Claude agents (tasern, Codex, the fleet), and reaching Zaal's phone via ZOE. And a message is transport, never the record - anything that matters still lands in `lane_handoffs` (doc 2092) or a PR. See doc 2246.

37. **A follow-up push to an open PR's branch has NOT landed until you verify the PR was still open when it arrived.** Docs PRs auto-merge (workflow contract v2); a push can race the merge and strand commits on the closed PR's branch while every local signal says success (push exit 0, remote head updated, `gh pr edit` still works). Hit 2026-08-20: #3189 auto-merged at 11:47Z while the doc-2340 + 2186-backfill commits were being pushed to it - main got 2 of 4 commits. After ANY follow-up push: `gh pr view <n> --json state,mergedAt` and confirm the new SHA is inside the merged range. Recovery: cherry-pick (-x) the stranded commits onto a fresh branch off CURRENT origin/main and open a new PR - never re-PR the stale branch (against a moved main its diff also REVERTS everything merged since the branch point). And correct the merged PR's title/body if they were edited to claim the stranded work (anti-fabrication rule 6).

## Source

Research docs: `research/agents/928-agent-loop-best-practices/` (2026-06-30, the base rulebook) + `research/agents/2127-loop-harness-engineering-anthropic/` (the Opus-5-era restatement). Primary: Anthropic Building Effective Agents + Effective Harnesses for Long-Running Agents. Fold-back history: rules 12-17 (2026-07-08 loop), 20-25 (2026-07-16 builder), 26-28 (2026-07-17 frictions), 29-32 (ZOE boot-crash deploy-safety), 33-36 (2026-07-27 subagent-trust), 37 (2026-08-20 meetings-lane merge race, PR #3189/#3197). Siblings: `anti-fabrication.md`, `code-restraint.md`, `workflow-discipline.md`, `silent-failure-guard.md`.
