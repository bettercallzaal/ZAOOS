---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-27
superseded-by:
related-docs: "554, 2317, 2318, 2407"
original-query: "i truly think the biggest problem with our agentic setup is the context sharing from terminal to terminal through the obsidian vault should be improved can you /zao-research this and then we will send the last idea from this terminal to the orcestrator"
tier: STANDARD
---

# 2423 - The vault is memory, not a message bus: inter-terminal context sharing for the Orca fleet

> **Goal:** Decide how Orca lanes and the orchestrator should pass context to each other, given that two days of running 10+ panes through the Obsidian vault produced eaten briefs, duplicate writes, a 76-line cold-start handoff and screen-scraping as the only read path.

## Key Decisions

1. **Split the vault into two things with different rules.** Notes, daily logs, research and the estate maps stay in Obsidian as *memory*: read at cold start, written by the orchestrator only. Live coordination (who owns what, what is done, what is blocked, what Zaal must decide) moves to one *ledger* that tooling writes, not hands. The confusion this week came from using one surface for both.
2. **A handoff is a typed contract, not prose.** Every lane brief and every DONE carries six fields in frontmatter: `status` (active/blocked/done/stale), `branch`, `goal` (one line), `next-action` (one executable step), `do-not` (dead ends already tried), `evidence` (the command that proves it). A fresh pane validates branch + status before its first tool call and executes `next-action` only. The 76-line `handoffs/orchestrator-2026-08-27.md` becomes a 6-field header plus links.
3. **Pull, not push.** Lanes poll the ledger at start and at the end of each turn; the orchestrator stops relying on `orca terminal send` landing (it was eaten by restart, account switch and compaction three times this week). A brief that is not in the ledger did not happen.
4. **Git is the lock and the lie detector.** Claiming a task writes a row and pushes immediately; first push wins, second must rebase and sees the collision at claim time, not merge time. Staleness is judged by the branch's last commit, never by the note's last edit. This is the same rule the coordinator already applies when it verifies `worker_done` against disk (orca-organization.md convention 7); make it universal.
5. **Tooling writes the ledger, or it dies.** The strongest source in this doc is the author who archived his blackboard on 2026-08-17 because, working solo, he stopped filling it in. Any row that depends on a human or a lane remembering to write it will rot. `orca-board`, the `DONE.md` protocol and the orchestration DB already produce this data; the ledger must be generated from them, with hand edits limited to your own row.
6. **Per-task write-sets are the collision primitive.** The swarm template and 99darwin/orchestrator agree: a task declares `allowed_paths`; an out-of-scope write fails the run. Orca orchestration tasks get a `paths:` field in the brief; the coordinator refuses `completed` when the diff touches files outside it. This is what would have caught the two-lanes-one-evidence-section incident and the Phase 3.5 branch-write (#3338).
7. **Evaluate Claude Code's native cross-session messaging before building more.** Sessions on one machine can now discover each other and exchange plain-text messages over a local socket, and hooks can block a tool call pre-execution. That is the primitive `zorca-lane-enqueue` and the actuator were built around. Test it against a picker-blocked pane before the next zorca build pass.

## Findings

### What is actually broken (grounding, this week)

| Failure | Count | Root cause in transport terms |
|---|---|---|
| Brief sent, never received (restart / account switch / compact) | 3 | Push with no persistence; nothing to poll |
| Two lanes wrote the same evidence section | 1 | No write ownership per task |
| Cold-start handoff at 76 lines, three prior versions 200+ | 4 | Prose, no `next-action`, no `do-not` |
| Four surfaces hand-synced (daily, IN-FLIGHT row, handoff, DONE.md) | daily | Same fact, four writers |
| Only read path is `orca terminal read` screen text | all ticks | Pickers, spinners and compaction all look like state |
| `worker_done` fenced to registered producers | 1 | Ledger write needs identity, coordinator proxies via `task-update` |
| Doc-number collision scan hit a SHA fragment (9996) | 1 | Claim check reads names, not a ledger |

### What practitioners converged on (2026-04 to 2026-08)

All four blog sources, written independently by people running 2-5 Claude/Codex sessions, land on the same shape:

- **One file, in the repo, every session reads and writes.** Markdown (dexterlung), JSON (morinaga, 114 handoffs, zero misses), or task files with YAML frontmatter (AysajanE swarm). Nobody used a database first; morinaga would move to SQLite only when two sessions write concurrently.
- **Claim before you act, and the claim must push immediately.** dexterlung's first version claimed locally and pushed later; two sessions read empty and both claimed. Pushing on claim "turns git into the lock."
- **The coordination file is the file most likely to collide.** Rule: edit only your own row, never re-sort the others.
- **Stale is a git fact.** Branch idle time and ahead/behind, scripted (`npm run board`), not the hand-typed progress note.
- **Handoffs are typed state.** Praison's contract: filename `HANDOFF_YYYY-MM-DD_branch_topic.md`, fields status / branch / goal / next-action / do-not, one active handoff per branch, "archive or mark stale quickly." His diagnosis matches ours exactly: "The hard part is not writing a handoff file. The hard part is quickly proving that a handoff is yours, current, and actionable."
- **Pull beats push for sessions that terminate.** morinaga: "When neither side is listening when the other finishes, you need the handoff to live somewhere persistent... The consumer polls instead of subscribing." `next_check_at` and `max_silence_minutes` turn silence into an alert (exit 3) instead of a mystery. `start` throws on a duplicate id: "starting and resuming are different operations."
- **Ownership fields document intent; the runtime must enforce it.** morinaga's `owner`/`requester` are unenforced ("nothing stops Claude from marking a task complete itself"). The swarm template enforces: Worker writes only `allowed_paths`, Judge is a separate actor and "may not review its own session's work," out-of-scope write => `state: blocked`, file byte-identical. Four roles (Planner / Worker / Judge / Operator) map onto our orchestrator / lane / coordinator / Zaal.
- **Terminals are the wrong interface.** demivalerith: "The developer becomes a human message bus: checking terminals, copying commit IDs, repeating context... The more capable each agent becomes, the less useful a wall of terminal panes is as a coordination interface." Proposed minimum: each session declares goal, worktree, files it expects to touch, and the result another session waits for; handoffs carry producer, consumer, dependency, commit, expected behavior, open question. Advisory file leases via a pre-tool hook; "do not attempt automatic merging or function-level locking in the first release."

### Contradiction: the board that got retired

The blackboard post exists twice. The dev.to copy (2026-08-10) is the enthusiastic version. The original at coffeeshooters.com now carries an update dated 2026-08-17: Claude Code shipped per-session worktree isolation and agent teams, "Don't build a board," repo archived. His retained lessons: "the bottleneck was never compute, it was shared state; and what actually stopped the two real collisions in my codebase was git itself, not the board I built on top of it. The board's own claim gate was retired two months before the platform caught up... working solo, I stopped filling it in."

Two consequences for us. First, hand-maintained boards fail on discipline, not design, so the ledger must be generated (decision 5). Second, agent teams are ephemeral (one lead, one team, torn down) and do not cover our case: independently launched panes that persist across days and restarts. The persistent ledger is still ours to run; the collision layer underneath it may not be.

### Staleness and weak signal

- Both HN threads (Hivemind 47088912, swarm 46827542) are Show HN posts with 1 point and 0 comments. Cited for the problem statement, not for validation. Hivemind's pitch ("Agent C re-investigates a decision that Agent A already made and documented in a different session") is the exact failure in our four-surfaces row.
- demivalerith's post cites a RayTally HN snapshot (cross-session messaging thread, 50 points, 26 comments, 2026-08-09) that I did not fetch; the native-messaging claim needs a docs check before decision 7 is acted on.
- `gh search code "handoff ledger claude codex sessions"` returned zero results on 2026-08-27; the pattern lives in blog posts and single-author repos, not in a reusable package. Negative signal: nothing to adopt wholesale.
- Nothing here is older than five months. Claude Code's native features moved twice inside that window; re-validate by 2026-11-27.

### Mapping to what already exists

| Practitioner primitive | We already have | Gap |
|---|---|---|
| Ledger file | `orchestration.db` (Orca), `.handoffs/DONE.md` | DB is Orca-private; DONE.md is prose; no single read model |
| Claim + push | `worker_done` / `task-update` | No `paths`; coordinator cannot refuse out-of-scope diffs |
| Stale by git | `repo-cleanup audit`, coordinator disk check | Not run per tick |
| Typed handoff | `handoffs/*.md` (prose) | No frontmatter contract, no `next-action`, no `do-not` |
| Poll at start | `orca-resume-manifest` (read once) | Lanes never re-read mid-run |
| Screen read | `orca-board` states | Only read path; should become the fallback |

## Also See

- [Doc 554](../../dev-workflows/554-worktree-collision-postmortem/) - the first time two sessions wrote one checkout
- [Doc 2317](../../dev-workflows/2317-obsidian-claude-personal-os-stack/) - the vault as memory layer (this doc narrows that scope)
- [Doc 2318](../2318-elizaos-memory-vs-zao-corpus-agent/) - memory vs corpus, same split at the agent layer
- [Doc 2407](../../dev-workflows/2407-orca-tmux-lane-integration/) - Orca + tmux lane integration, "Orca and the Wall are blind the same way"
- `~/zao-vault/notes/orca-organization.md` - conventions 1-9, hazards, the coordinator-verifies-disk rule
- bettercallzaal/ZAOOS#3338 - HEAD is not a file, so write-sets cannot see two lanes committing to one checkout

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a `handoff-contract` block (status/branch/goal/next-action/do-not/evidence) to the handoff skill template; a handoff without it fails the skill's own check. Shipped when `handoffs/orchestrator-*.md` next written carries it. | @Zaal (orchestrator pane) | Skill PR | 2026-08-29 |
| Generate `~/zao-vault/LEDGER.md` from `orchestration.db` + `.handoffs/DONE.md` each `orchestrator-tick`; retire the hand-written IN-FLIGHT row. Shipped when the automation's tick log shows the file regenerated. | @Zaal (orchestrator pane) | Script in zorca | 2026-08-30 |
| Add `paths:` to the lane brief template; coordinator rejects `task-update --status completed` when `git diff --name-only` leaves the set. Shipped when one rejection is recorded in DONE.md. | @Zaal (coordinator lane) | zorca PR | 2026-09-02 |
| Test Claude Code native cross-session messaging against a picker-blocked pane; write the result as a new doc or a Findings addendum here. | @Zaal (orchestrator pane) | Experiment | 2026-09-01 |
| Lanes re-read LEDGER.md at the end of every turn (add to lane CLAUDE.md preamble). Shipped when a lane picks up a brief that was never `orca terminal send`-ed. | @Zaal (orchestrator pane) | Convention 10 in orca-organization.md | 2026-08-30 |

## Sources

- [FULL] [I Built My AI Team a Blackboard (dev.to mirror)](https://dev.to/dexterlung/i-built-my-ai-team-a-blackboard-how-to-stop-parallel-claude-sessions-from-colliding-j71) - dexterlung, 2026-08-10. exa web_fetch. Tail of the post (repo name) cut at 9k chars.
- [FULL] [Same post, original with the 2026-08-17 retirement notice](https://coffeeshooters.com/content/solo-dev-blackboard-for-parallel-ai-sessions-en) - 2026-06-24, updated 2026-08-17. exa web_fetch.
- [FULL] [How I coordinate Claude and Codex sessions with a pull-based JSON handoff ledger](https://dev.to/morinaga/how-i-coordinate-claude-and-codex-sessions-with-a-pull-based-json-handoff-ledger-5h93) - Nazar Boyko, 2026-07-22. exa web_fetch.
- [FULL] [Parallel Coding Agents Need Handoffs, Not More Terminals](https://dev.to/demivalerith/parallel-coding-agents-need-handoffs-not-more-terminals-71d) - 2026-08-11. exa web_fetch. Its RayTally source brief not fetched.
- [FULL] [Managing Handoffs in Multi-Agent Coding Sessions](https://mer.vin/2026/04/managing-handoffs-in-multi-agent-coding-sessions-fresh-context-without-losing-continuity/) - Mervin Praison, 2026-04-23. curl returned empty; exa web_fetch succeeded.
- [PARTIAL] [AysajanE/autonomous-agentic-research-swarm](https://github.com/AysajanE/autonomous-agentic-research-swarm) - MIT, 4 stars, created 2026-01-30. README first 6k chars via exa; task-file schema and role table read, gate details cut.
- [FULL] [Show HN: Hivemind](https://news.ycombinator.com/item?id=47088912) - 1 point, 0 comments. Algolia items API.
- [FULL] [Show HN: Autonomous Research Swarm](https://news.ycombinator.com/item?id=46827542) - 1 point, 0 comments. Algolia items API.
- [FAILED] `gh search code "handoff ledger claude codex sessions"` - zero results 2026-08-27 (negative signal, not an outage).
- Grounding: `~/zao-vault/notes/orca-organization.md`, `~/zao-vault/handoffs/orchestrator-2026-08-27.md` (76 lines), `~/Documents/zorca/.handoffs/DONE.md`, this session's watcher log.
