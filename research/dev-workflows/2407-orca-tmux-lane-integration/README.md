---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-24
superseded-by:
related-docs: "2403, 2343, 2319, 2405"
original-query: "how we can use orca to be part of our workflow better and make zj be able to see orca"
tier: STANDARD
---

# 2407 - Orca and the Wall are blind in the same way, and the process list already sees both

> **Goal:** Make Orca a first-class lane surface and make `zj` see it. Both turn
> out to be the same question, and it is not the question doc 2403 left open.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Start every Orca lane as `tmux new -A -s <lane>`. Zero code, works today.** | Measured live 2026-08-24: `zabalgames` and `zaostock` are attached inside Orca terminals right now, and `zj` lists both, and `lane-send` still works on both. The lane is unchanged; Orca is just the window it is drawn in. |
| 2 | **Teach `zj` a second source: `claude agents --json`, classified by process ancestry.** | A 4-line classifier separated all 9 local sessions correctly on its first run. It fixes Orca, `finance1`, and every launcher nobody has invented yet - not just Orca. |
| 3 | **Do NOT migrate the lane system to Orca.** | tmux is the SUBSTRATE (what a lane IS); Orca is a VIEWER (where it is drawn). Nothing in decision 1 or 2 requires giving up `zao-lane-boot`, `lane-send --check`, vault briefs, or the Wall. |
| 4 | **Doc 2403's decisive unknown is ANSWERED: no, Orca cannot detect an agent inside a user's tmux session - and it does not matter.** | Upstream open issues #7799, #10009, #10856 are exactly this, unfixed as of 2026-08-24. But the question was the wrong way round: you do not ask Orca to adopt tmux, you run tmux inside Orca. |
| 5 | **An Orca-launched Claude is reachable by `SendMessage`, never by `lane-send`.** | `lane-send` requires `tmux has-session` (line 33). `ListAgents` addresses by name and reaches non-tmux sessions. State this in the brief or a lane will silently fail to reach one. |

## The two measurements this rests on

### 1. `zao-agents` sees an Orca session. `zj` does not.

Run from inside an Orca worktree at `~/orca/workspaces/ZAO OS V1/harness`,
2026-08-24 08:0x:

```
zao-agents   10 local sessions, including:
             harness  busy  up 1m  ~/orca/workspaces/ZAO OS V1/harness
zj            7 local sessions, no `harness`
```

`zj` builds the Wall from `tmux list-sessions` (`~/bin/zj` line 40). An Orca
terminal is not a tmux session, so there is nothing for it to list.

### 2. But two lanes ARE already inside Orca, and the Wall sees them fine

`orca terminal list` showed two terminals whose preview was a tmux status bar.
Traced rather than inferred:

```
Orca Helper (pid 20499)
  -> /usr/bin/login ... orca-tcc-login /bin/zsh   (97076, tty ttys017)
    -> -/bin/zsh -l                               (97083)
      -> tmux new -A -s zabalgames                (97544)
```

`tmux list-clients`: `/dev/ttys017 <- zabalgames`, `/dev/ttys018 <- zaostock`.

So Zaal is already running the correct pattern on two lanes. `tmux new -A -s`
attaches if the session exists and creates it if not, which makes it safe to put
in a brief and safe to re-run.

## The symmetry, which is the actual finding

| Surface | Enumerates by | Blind to |
|---|---|---|
| `zj` (the Wall) | `tmux list-sessions` | every Claude not started under tmux - Orca, Terminal.app, VS Code |
| Orca | terminals **it** created | every agent inside a user's tmux session (upstream #7799) |
| `claude agents --json` | **the process list** | nothing local; cloud and other machines are out of scope and it says so |

Orca's own issue #7799 explains its half in terms that match the process chain
measured above, independently:

> "When a user runs `tmux` in an Orca pane, the process in the pane is the tmux
> **client**. tmux daemonizes a **server** (reparented to pid 1), and every pane
> process - including `claude` - is a child of that server, not of the pane's
> shell. So the descendant walk reaches only the tmux client."

Both tools fail the same way for the same reason: **each enumerates the sessions
it OWNS, and a session's owner is not the same thing as a session's existence.**

That is the general rule worth keeping, and it extends the windows-desktop lane's
"emit a TIMESTAMP, never a STATE" one level down:

> **Enumerate what is RUNNING, never what you LAUNCHED.** A launcher-scoped list
> is guaranteed to be incomplete the moment a second launcher exists - and there
> are already four on this Mac.

`zao-agents` gets this right for free and says why in its own docstring: absence
is the signal, so it needs no TTL, no heartbeat and no expiry logic.

## The `zj` fix, specified

`claude agents --json` returns `pid` for every session (verified 2026-08-24 -
fields are `cwd, kind, name, pid, sessionId, startedAt, status`). That makes the
classification exact rather than heuristic: **walk each agent's parent chain; if
it passes through the tmux server, it is already on the Wall.**

Run against all 9 local sessions, 2026-08-24:

```
session                        on the Wall?   owning app
finance1                       NO             Terminal.app
zao-identity hats mac          YES (tmux)     tmux
meetings-craig transcribe mac  YES (tmux)     tmux
openmatter                     YES (tmux)     tmux
zaostock                       YES (tmux)     tmux
zabalgames                     YES (tmux)     tmux
grill                          YES (tmux)     tmux
lanes                          YES (tmux)     tmux
harness                        NO             Orca
```

Correct on the first run, including the case that matters most: `zaostock` and
`zabalgames` are DISPLAYED in Orca and still classify as tmux lanes, because the
`claude` process is parented to the tmux server, not to Orca's login shell. The
display surface does not change what the lane is - which is exactly why decision
1 is safe.

**Implementation shape** (deliberately not written yet - see Next Actions):

- `zj` gains one local-only source that shells out to `zao-agents --json`.
  Reuse it, do not reimplement the loader (`code-restraint.md` rung 2, and
  `zj`'s own line 42 comment about a drifted inline copy of `outstandingCount`).
- Rows whose ancestry hits the tmux server are DROPPED - the tmux source already
  has them, with better data (`ctx`, `state`, last line).
- Rows that do not are printed in their own block, and the block says what is
  and is not possible with them:

```
off-wall (2)  - running, not in tmux: no attach, no lane-send, use SendMessage
  finance1   idle  up 30d  ~/Desktop/repos/finance-hq        Terminal.app
  harness    busy  up 1m   ~/orca/.../harness                Orca
```

Naming them `off-wall` rather than folding them into `local` is deliberate. They
are not lanes: `zj <name>` cannot attach to them and `lane-send` will refuse
them. A list that mixes attachable and non-attachable rows under one heading
teaches the wrong reflex.

## Making Orca first-class in the workflow

Ranked by value per unit of change. Nothing here requires abandoning anything.

**1. The brief tells the lane how to start (free).** `handoff-discipline.md`
already gives each lane one living brief. Add the launch line to the template:
`tmux new -A -s <lane>`. A lane opened in Orca then boots exactly like a lane
opened in Terminal - same tmux session, same `zao-lane-boot`, same Wall row.

**2. What Orca adds that the Wall cannot.** These are the reasons to use it at
all, and all of them are display-layer, so all of them are additive:

| Orca gives | The gap it closes |
|---|---|
| a GUI over worktrees, with file diffs and a real editor | `zj` can only attach to a pane |
| a mobile companion, notified when an agent finishes | Zaal is phone-first as of 2026-08-24; `zj` needs a terminal |
| account switching and Claude/Codex usage tracking | `claude-usage.md` is a whole rule about the weekly cap, with no live gauge |
| SSH worktrees and `orca serve` | the VPS and the Pi, currently reached only by `ssh` inside `zj` |

**3. `orca terminal list` / `worktree ps` are a real read-only surface.** Both
returned exit 0 and useful output. If a future tool needs to know what Orca has
open, this is the supported way to ask - do not read its Application Support
directory.

**4. Keep driving Orca from the GUI, not the CLI.** The `repo add` defect
recorded in the lanes brief (succeeds once, kills its own runtime, not
idempotent, no `repo rm`) is a mutation defect. Read-only commands are fine and
were used throughout this doc; the caution is specifically about writes.

## Honest limits

- **`zj` was NOT changed.** This doc specifies the fix and proves the classifier
  on live data; the code is a separate PR (`agent-loops.md` rule 4, one feature
  at a time).
- **The classifier was run once, on nine sessions, on one machine.** Per
  `liveness-probe-guard.md` rule 6 that is one measurement, not three. It is
  exact rather than statistical - ancestry either passes through the tmux server
  or it does not - but it has not been run on the Pi or the VPS, where `zj` also
  runs its probe.
- **Orca's mobile companion was not evaluated.** Same limit doc 2403 recorded; a
  store binary is a different trust surface from an MIT repo.
- **The 127 tmux-related issues in `stablyai/orca` were not sampled beyond the
  ten the search returned.** Whether #7799 is close to landing is unknown; if it
  lands, Orca gains its own view of tmux lanes and decision 2 gets cheaper, not
  wrong.
- **`ListAgents` returned 66 peers, 37+ of them offline Remote Control rows** -
  the dead-row problem of the lanes brief's problem 3 is unchanged and this doc
  does not address it.

## Also See

- [Doc 2403](../2403-orca-ade-evaluation/) - the Orca evaluation whose decisive unknown this answers. **Unmerged as of 2026-08-24** (branch `ws/research-2403-orca`), so this link is dead until it lands.
- [Doc 2405](../2405-skills-audit/) - the same lane's skills audit. **Unmerged as of 2026-08-24** (branch `ws/research-2405-skills`).
- [Doc 2343](../2343-zj-wall-signal-quality/) - the `zj` signal-quality audit that surfaced the idle/blocked split

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the `off-wall` block to `zj` per the spec above; merged when `zj` lists `finance1` and any Orca session under it | @Zaal (Claude, lanes lane) | PR to zaal-dotfiles | 2026-08-27 |
| Add `tmux new -A -s <lane>` to the vault handoff TEMPLATE launch section; merged when TEMPLATE.md carries it | @Zaal (Claude, lanes lane) | PR to zao-vault | 2026-08-26 |
| Re-run the ancestry classifier on the Pi and the VPS; done when the same table exists for both hosts | @Zaal (Claude, lanes lane) | Test | 2026-08-29 |
| Fix the `/zao-research` doc-number scan - it greps the whole `git ls-remote` line, so commit-SHA digits leak in and it returned 9996 today | @Zaal (Claude) | PR to zaal-dotfiles | 2026-08-27 |
| Update `/zao-research` step 3 + 7.5 to use `zao-doc-next <slug>` - the skill predates the repo's doc-collision guard, so it teaches a reservation method the guard rejects. This doc was written as 2406, blocked at commit, renumbered to 2407 | @Zaal (Claude) | PR to zaal-dotfiles | 2026-08-27 |
| Watch upstream #7799 / #10856; if either lands, re-read this doc's decision 2 | @Zaal (Claude) | Watch | 2026-09-15 |
| Do NOT migrate the lane system to Orca on the strength of this doc | @Zaal | Decision | standing |

## Sources

- [FULL - measured 2026-08-24, this Mac, method: `zao-agents` and `zj` run back to back from an Orca worktree] 10 local sessions vs 7; `harness` present in one and absent from the other.
- [FULL - measured 2026-08-24, method: `ps -eo pid,ppid,command` ancestry walk from each `claude agents --json` pid] the nine-session classification table. Raw chain for `zabalgames`: `Orca Helper 20499 -> login 97076 -> zsh 97083 -> tmux new -A -s zabalgames 97544`.
- [FULL - measured 2026-08-24, method: `tmux list-clients -F`] `/dev/ttys017 <- zabalgames`, `/dev/ttys018 <- zaostock`.
- [FULL - 2026-08-24, method: `claude agents --json` raw] session fields are `cwd, kind, name, pid, sessionId, startedAt, status`. The `pid` field is what makes the classifier exact.
- [FULL - 2026-08-24, method: local `orca` CLI, read-only commands only] `orca status` exit 0 (`runtimeState: ready`); `orca terminal list` exit 0, 7 terminals with previews; `orca agent-context` reports **232 commands, schema v1**.
- [FULL - fetched 2026-08-24, method: `gh api search/issues`] `repo:stablyai/orca tmux` - **127 issues**. Open and directly on point: **#7799** *"fix(pty): detect agents running inside a user's tmux session"* (2026-07-08), **#10009** (same, referencing #7797), **#10856** *"feat(terminal): detect agents inside tmux"* (2026-07-27), **#7284** *"feat(ssh): discover pre-existing tmux agent sessions on remote hosts"*, **#11540** *"[Bug]: Issues with TMUX"*.
- [FULL - fetched 2026-08-24, method: `gh api repos/stablyai/orca/issues/7799`] the quoted mechanism paragraph is verbatim from the issue body.
- [FULL - read 2026-08-24] `~/bin/zj` line 40 (`tmux list-sessions`), `~/bin/lane-send` line 33 (`tmux has-session ... exit 1`) and line 60 (refuses a lane with no live claude), `~/bin/zao-agents` docstring.
- [FULL - read 2026-08-24, method: `git show FETCH_HEAD:...`] doc 2403 on branch `ws/research-2403-orca`, unmerged. Its decisive-unknown section is what this doc answers.
- Credit: **stablyai** for Orca (MIT). The tmux-detection analysis quoted above is from the Orca contributors' own issue #7799, not from this lane. Neither Orca nor stablyai is affiliated with The ZAO.
