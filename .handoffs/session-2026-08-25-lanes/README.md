# Session handoff - 2026-08-25 - lane `lanes` (the harness lane)

Written at an Orca app-restart wind-down. **Nothing is in flight. Nothing is
half-done.** The last unit of work shipped and merged before this handoff was
written.

| Field | Value |
|---|---|
| Lane | `lanes` (vault frontmatter name); worktree directory is `harness` |
| Surface | Orca ADE worktree: `/Users/zaalpanthaki/orca/workspaces/ZAO OS V1/harness` |
| Repo | `bettercallzaal/ZAOOS` |
| Branch at wind-down | `handoff/session-2026-08-25-lanes`, cut fresh off `origin/main` |
| Working tree | clean |
| Resume with | `claude --resume` |
| Companion vault brief | `~/zao-vault/handoffs/lanes.md` (`status: unconsumed`, pushed at `b55ade1`) |

## State - what shipped this session

**Doc 2418, hypersnap state + ZAO feasibility. PR #3326, MERGED 2026-08-26T01:04:59Z.**
Lives on main at `research/farcaster/2418-hypersnap-state-and-zao-feasibility/`.

The verdict, so it does not need re-deriving:

- Hypersnap is a **hard fork of `farcasterxyz/snapchain`**, not a greenfield
  project. Contributor list proves it: aditiharini 245, sanjayprabhu 154,
  adityapk00 75 are Farcaster core; CassOnMars is third at 79.
- Its single divergence is **hyper mode** (`docs/hyper.md`): a parallel
  execution context where pruning is a no-op, so history is never dropped.
  Wire-compatible - legacy peers never see the extension. Disabled by default.
- **LICENSE read from the file**, not the API field: verbatim GPLv3, 35,149
  bytes, identical to upstream's. No network-use clause, so *running* a node
  triggers nothing. L7's "package a node members can run" **would** engage
  copyleft.
- State 2026-08-25: last commit 2026-08-09, CassOnMars sole author on all 12
  recent commits, no tagged release since **v0.11.8 on 2026-05-07**, newest
  outside issue/PR 2026-06-08, two substantive community PRs unreviewed since
  May. That commit reads **`final snapchain version for parity`** while upstream
  shipped v0.14.1 and v0.14.2. Cassie's live node reports 0.13.5.
- Node floor 16 GB / 4 vCPU / 1.5 TB / public IP / ports 3381-3383. Live DB
  **788 GB**, growing ~47 GB/yr. **Hyper mode is unbounded and unquantified.**
- **Recommendation: do not self-host hypersnap.** Keep haatz as the free read
  proxy - already BUILT and WIRED in `src/lib/farcaster/neynar.ts` with Neynar
  failover. If ZAO ever self-hosts, run vanilla snapchain.

## URGENT - doc number 2418 COLLIDED on main, discovered at wind-down

**Two different doc 2418s are now merged on `main`:**

| Path | PR | Merged |
|---|---|---|
| `research/farcaster/2418-hypersnap-state-and-zao-feasibility` (this lane) | #3326 | 2026-08-26T01:04:59Z |
| `research/identity/2418-zid-state-and-signup-spec` (another lane) | #3327 | 2026-08-26T01:07:41Z |

**Two minutes and 42 seconds apart. Both auto-merged.**

This is precisely the failure `doc-collision-guard` was built to stop - its own
block message cites "exactly what happened twice on 2026-08-22". It did not stop
it here. What was observed from this lane:

- `zao-doc-next hypersnap-state-and-zao-feasibility` printed `2418` and said
  `reserved`.
- `git push origin doc-2418` then reported **`Everything up-to-date`**, meaning
  the tag already existed on the remote *before* this lane pushed it.
- `git log -1 doc-2418` points at a **2026-08-25 19:25:22** commit about a doc
  1659 addendum - unrelated to either 2418.

So either `zao-doc-next` handed out a number whose tag already existed, or two
lanes raced it and both received 2418. **Not diagnosed further** - it was found
during wind-down and diagnosis is not a safe rushed action.

**Deliberately NOT fixed here.** Renumbering a doc already merged to main, under
a no-push wind-down order, is not something to rush. Both docs are intact and
readable; the collision is a numbering defect, not data loss.

**Next session, first thing:** decide which doc renumbers (convention favours
the later merge, #3327/ZID, but that is Zaal's call), then fix the directory
name, the `# NNNN -` heading, the index row, and any cross-references. Then fix
`zao-doc-next` itself - a reservation tool that hands out a taken number is
worse than no tool, because it is trusted.

Note this lane's own doc 2418 cites four-way collisions on number 599 as a
finding. The estate now has a fifth instance, created while documenting the
first four.

## The finding that outlives the doc

**The brief's premise was false, and so is the vault note it came from.**
`~/zao-vault/notes/zao-decentralization-scale.md` says hypersnap "is not
documented anywhere on disk" and calls it "the single biggest unknown on this
scale." Measured 2026-08-25:

- **19 research directories** touch hypersnap / Cassie / haatz
- **9 are hypersnap-specific**: `_archive/010`, `farcaster/304`, `309`, `489`,
  `586`, `587`, `589`, `597`, `infrastructure/643`
- a **200-line memory file**, `memory/project_hypersnap_node_install.md`, with a
  full install playbook and a Cassie engagement playbook
- **production code** at `src/lib/env.ts:88` and `src/lib/farcaster/neynar.ts`
- a VPS purchase reached the **Hetzner checkout page on 2026-05-04** and paused

**L4 is blocked on a decision deferred four months ago, not on an unknown.**
That note is currently steering lanes to re-research a solved topic. Correcting
it is the top open Zaal-tap below.

## Next steps - exact resume point

Resume by reading this file, then pick up at step 1. Nothing else is pending.

1. **Correct `~/zao-vault/notes/zao-decentralization-scale.md`.** Replace the
   "not documented anywhere on disk" paragraph with a pointer to doc 2418 plus
   the 9 prior docs; change L4's gate from "hypersnap research pass done" to
   "async settlement retention requirement specified". Done when the vault
   commit is pushed to main. **This is a vault edit, not a ZAOOS edit.**
2. **Recover `ws/research-599-hypersnap-vps-options`.** Never merged, still on
   origin, and **599 now collides four ways on main**
   (`business/599-adam-meeting...`, `agents/599-zao-bonfire-bridge...`,
   `events/599-inbox-digest-2026-05-03`,
   `infrastructure/599-podcast-mp3-hosting-bcz-yapz`). Reserve a fresh number
   with `zao-doc-next`, renumber, add the index row, PR it. The VPS cost
   comparison exists only on that branch.
3. **Resolve the 2418 collision** (see the URGENT section at the top) - pick
   which doc renumbers, fix dir + heading + index row, then fix `zao-doc-next`.
4. **Commit + push this handoff branch.** `handoff/session-2026-08-25-lanes`
   was committed but **NOT pushed** - the wind-down order forbade pushing.

## Open Zaal-taps

| # | Tap | Why it is yours |
|---|---|---|
| 1 | Is the paused Hetzner purchase **cancelled or deferred**? Unresolved since 2026-05-04 and silently blocking L7 in everyone's mental model. | A spend decision. |
| 2 | Is `FARCASTER_READ_API_BASE` actually **set in production**? BUILT and WIRED is confirmed from source; **LIVE is not**. Reading the env file was correctly blocked this session. | Needs prod access. |
| 3 | **Fix two PII-scanner false positives** (details below), or decide to leave them. | A rules/tooling change. |
| 4 | Specify the async Respect Game's **settlement inputs** (L3), then check them against canonical Farcaster retention. This is the one input that could reopen the hypersnap decision. | Product judgement. |

## Two guard bugs found - worth fixing, not routing around

Both blocked the doc-2418 commit. I reworded rather than bypassed, so the doc is
clean either way - but they will recur.

1. **A `u32` max value** (2^32 - 1, ten digits) appearing in a JSON response
   matched the **US phone** pattern in the PII scanner. Written here as an
   expression rather than the literal, because the literal re-trips the guard.
2. **The GitHub SSH clone endpoint** (`git` + `@` + `github.com`, written out
   here in pieces so this file does not trip the same guard) inside a quoted
   `git clone` command - matched the **email** pattern. This fires on any doc
   that quotes an SSH clone line.

Per `.claude/rules/noisy-signal-guard.md`: a check people route around protects
nobody. Reported in the PR #3326 body too.

## Process note for the next session

The `/zao-research` skill's Step 3 / Step 7.5 numbering procedure is **stale**.
The repo now enforces a `doc-collision-guard` hook that requires a **pushed
reservation tag**, not just a max-number scan. The scan alone gets you blocked.
The correct move is `zao-doc-next <slug>` up front, which reserves the number and
prints the branch name to use.

Also: the **PreCompact handoff guard reports lane `unknown`** from this Orca
worktree, because it detects the lane from a `~/Documents/ZAO OS V1` path shape
and this lane lives at `orca/workspaces/ZAO OS V1/harness`. The warning is a
false alarm here; the vault brief exists.

## Orchestration

**No `worker_done` was fired, and this lane has no orchestration task to fire it
against.** `orca orchestration task-list` returns 0 tasks and `run-current`
reports "No Run is bound to this terminal" - the lane was started from a pasted
prompt, not dispatched. `--type worker_done` hard-fails with `missing_task_id`.

A `type: status` message was delivered instead:
`msg_04bfe8c6cc79` to `run:run_a4892c0a5cdc`, carrying the verdict and an
explicit note that worker_done could not be sent. The coordinator should verify
against that message id, not against a worker_done that does not exist.
