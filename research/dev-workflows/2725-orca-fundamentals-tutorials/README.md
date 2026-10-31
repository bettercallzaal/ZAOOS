---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-10-31
superseded-by:
related-docs: "2581, 2677, 2513, 2704, 2714, 2423"
original-query: "get orca running please deep research more about orca and give me tutorials on fundamentals please (Zaal, seat pane, 31 Oct 2026). Brief: ZAOOS research doc at DEEP tier, topic dev-workflows, extending the 1 Oct doc, titled 'Orca fundamentals for ZAO: a tutorial set'. Seven short tutorials, each: what it is, when to use it, exact commands or clicks on this Mac, one worked example from our estate, the mistake to avoid. End with a 10-line daily routine and a ranked adoption list with cost and gain. Real fetches only, never a feature not seen in the help or docs."
tier: DEEP
---

# 2725 - Orca fundamentals for ZAO: a tutorial set

> **Goal:** Teach Zaal, who directs agents and never handwrites code, the seven parts of Orca he works with every day, in the commands and clicks of this Mac, with examples from our own estate. Extends [doc 2581](../2581-orca-how-others-use-it/) rather than rebuilding it.

Everything is pinned to **Orca 1.4.242** (`orca --version`, 31 Oct 2026) and measured read-only that evening. Orca is by Stably AI, MIT licence (LICENSE file read: "Copyright (c) 2026 Lovecast Inc."), [github.com/stablyai/orca](https://github.com/stablyai/orca). Companion: the health diagnosis at vault `notes/orca-health-2026-10-31.md` (vault PR 390).

You will not type most of these. Read a command as "this is what to tell a lane, or what it will show you". Commands marked **yours** are the ones only you should run.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **DISABLE the `AFK review and prep through 5am` automation tonight (yours).** | Hourly Codex, run 119 at 19:00 on 31 Oct, four days past its end date. Orca ignores the UNTIL ([#35894](https://github.com/stablyai/orca/issues/35894)). See tutorial 4. |
| 2 | **USE one owner, "(0a) orca", for sleep, wake, rename and close (grill item 19, option A).** | Three known places and one unattributed caller stop lanes, with no caller log. 6 of 6 panes at a shell map to a sleep record. Policy in the health note. |
| 3 | **USE `zao-lane-sleep wake <lane>` to bring back a lane the auto-sleep stopped; USE Orca's right-click Sleep when you park one by hand.** | They are two different things, and only ours leaves a pane at a resume prompt. See tutorial 2. |
| 4 | **KEEP launchd and cron for timers that run code; USE Orca automations only with `--precheck`.** | `fleet-health` with a precheck skipped 99 of its last 101 runs. An automation without one spends a model run every time. |
| 5 | **SKIP orchestration Runs, Orca artifacts and skill-share links for now.** | Runs: last message 26 Oct, and they are experimental. Artifacts: public links, and the CLI here is not signed in. Skill links: treated as credentials, nobody to share with yet. |
| 6 | **TRIAL Agent hibernation only after the owner exists, on (w) lanes first.** | It resumes on open with no prompt, which is what our sleep lacks. An open upstream issue says it can sleep a session with background waits ([#33875](https://github.com/stablyai/orca/issues/33875)). |

## What changed since doc 2581 (1 Oct to 31 Oct)

| Measure | 2581, 1 Oct | Tonight | Source tonight |
|---|---|---|---|
| Installed version | 1.4.218 | 1.4.242; newest 1.4.245 (published 30 Oct) | `orca --version`, `gh api releases` |
| Repo | 82,852 stars, 5,368 forks | 111,707 stars, 7,060 forks | `gh api repos/stablyai/orca` |
| Our workspaces | 33 | 173 (140 completed, 19 in-progress, 14 todo, 0 in-review) | `orca worktree list --json` |
| Rows with a comment | 1 of 33 | 105 of 173 | same |
| Automations | 1, disabled | 2, both enabled | `orca automations list --json` |
| Orchestration | 2 runs, 22 tasks, 60 messages | 4 runs, 57 tasks, 69 messages, last 26 Oct 22:50 UTC | read-only `sqlite3` of `orchestration.db` |
| Reddit | FAILED | 2 threads read, and r/OrcaADE exists | exa fetch |
| 2581's `orca.yaml` action | open | still open: no `orca.yaml` on ZAOOS main | `git ls-tree origin/main` |

## Tutorial 1: repos, worktrees and the board

**What it is.** A *repo* is a project Orca knows. A *worktree* is one task's own folder and branch, so agents cannot overwrite each other. Each worktree is one row, which Orca calls a workspace. The *board* is that row's status: `todo`, `in-progress`, `in-review` or `completed`. A *parent* only nests rows in the sidebar; per the docs it "does not change Git history or branches".

**When to use it.** New job: new worktree. Related job: a child under the parent. Finished job: `completed`, with a comment saying why.

**On this Mac.**

```bash
# open a lane as a real sidebar row (the seat's job)
orca worktree create --name cards --repo "name:ZAO OS V1" --base-branch origin/main --agent claude --prompt "..."
orca worktree set --worktree path:<path> --display-name "(9) cards - BUILDING: Ali package" \
  --parent-worktree path:<parent> --workspace-status in-progress
orca worktree ps --json     # one line per row: agents, state, live terminals
```

Clicks: double-click a row title to rename. Right-click for archive, sleep or delete. The **N children** chip folds children. `Cmd-J` jumps to any row, even a hidden one.

**Our naming.** `(N) name - STATE: detail`. Slots 1 to 9 are top priorities, letters are children, `(0x)` are seat helpers, `(w)` is parked or waiting. In Progress holds your top 3, plus the seat, misc and their children; everything else is Todo, awake or asleep.

**Worked example.** BCZ, 31 Oct: the seat built `(5) BCZ - parent` with `(5a)` yapz, `(5b)` resume and `(5c)` merch under it. Tonight's read shows the rule drifting: 6 top-level rows, (2), (3), (4), (6), (7), (8), sit in In Progress outside `~/.zao/top3`.

**Mistake to avoid.** `orca repo add` puts the root checkout on the board as if it were a lane, and `orca worktree rm` deletes the folder and the branch: on 9 Sept the safe-looking `ws-fractal-lane` held 56 commits that were not on origin (vault `handoffs/ORCA-SESSIONS.md`). Prove a branch is pushed before any removal. That tap is yours.

## Tutorial 2: terminals and agents

**What it is.** A *terminal* is a pane in a worktree. An *agent* is Claude running in one. Rule from you, 30 Oct: one Claude per worktree; a Codex pane only if the two talk; anything else becomes a child worktree.

**When to use it.** `agent launch` starts Claude in an existing worktree. `terminal create` is for shells and commands. `terminal send` pushes one prompt to a Claude already running.

**On this Mac.**

```bash
orca terminal list --json                         # every pane, with a handle
orca terminal read --terminal <handle> --screen --json   # what the pane shows now
orca terminal send --terminal <handle> --text "continue" --enter --wait-submit 10 --json
orca agent launch --agent claude --worktree path:<path> --prompt "..." --json
zao-session-dupes --all                           # two Claudes in one worktree?
```

**Resume ids.** Every Claude has a session id. To find one: `zao-lane-sleep list` for slept lanes; the right sidebar, **Agents** tab, **Agent Session History**, then **Resume**; or `orca search "exact phrase"`, whose hits carry a resume command.

**Two different sleeps. This is the fundamental that explains your resume prompts.**

| | Orca's Sleep | Our `zao-lane-sleep` |
|---|---|---|
| Started by | Right-click a row, or the Agent hibernation setting (experimental, off by default) | The launchd agent, the messenger, or the seat |
| What it does | Stops the terminals and keeps the session records | Sends SIGTERM to the Claude process only and keeps the pane |
| Coming back | Open the row; per the docs Orca relaunches it with no click (not tested here) | Pane sits at a shell. Use `zao-lane-sleep wake <lane>` |
| From the CLI | Not available: no `sleep` under `orca worktree --help`; [#22571](https://github.com/stablyai/orca/issues/22571) is open, with our +1 | Yes, which is why we built it |

**What a restart does** (docs, `model/session-restore`, unless marked):

| Event | Agents | Layout and scrollback |
|---|---|---|
| Cmd-Q, auto-update, app crash | Keep running; the terminal host survives | Back |
| Reboot, OS update, power loss | Gone; re-run them | Back |
| Claude account switch (our measurement, 28 Oct; upstream [#31545](https://github.com/stablyai/orca/issues/31545), [#34690](https://github.com/stablyai/orca/issues/34690)) | Relaunched by `claude --resume`; can lose flags and leave duplicates | Back |

**Worked example.** (9) cards tonight: `zao-session-dupes --all` shows two live Claudes, started 17:59 and 18:16 EDT. Which launcher started the second one is not established. One gets closed after reading both tails, on your word because it is numbered.

**Mistake to avoid.** Using `orca terminal create` to open a lane. On 12 Oct that made iman-desk a tab inside the seat, not a sidebar row (vault `handoffs/orca-upgrades.md`). Also: `accepted: true` means the text arrived, not that a turn started, and long sends have lost their beginning (zorca `PLAYBOOK.md`), so lanes put the key point last and read the pane back.

## Tutorial 3: orchestration runs, tasks and gates

**What it is.** A tracked way for one coordinator to run several workers. A *Run* is the namespace and inbox. A *Task* is the work. A *Dispatch* is one attempt at a task. A *gate* is a question that blocks a task until answered. Orca's own words: "A Run is a durable namespace and coordinator inbox; it does not schedule or place workers." The docs mark it experimental, enabled under Settings, Experimental.

**When to use it.** Only when a worker must report completion against a tracked task, or when tasks depend on each other. For "go do this and report back", use a handoff instead: `worktree create --agent`. The guide forbids a Run for a plain handoff.

**On this Mac.**

```bash
orca orchestration run-list --json
orca orchestration run-create --objective "..." --json
orca orchestration task-create --spec "..." --task-title "..." --json
orca orchestration worker-start --task <id> --worktree new-child --name <n> --agent claude --json
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
orca orchestration gate-create --task <id> --question "..." --options '["yes","no"]' --json
```

**Worked example.** Ours has 4 runs: the August "ZAO operating run" (22 tasks), your 19 Oct todo board (33 tasks), the 26 Oct finance cascade (2 tasks) and a legacy tombstone. Across them: 35 completed, 16 ready, 6 blocked, 8 gates. Nothing since 26 Oct. Our real coordination runs through SendMessage and the vault, as [doc 2677](../2677-orca-best-practices-and-upgrades/) decided.

**Mistake to avoid.** `dispatch` without `--inject` records a task as dispatched and tells the worker nothing. All three lanes stalled that way on 26 Aug (`PLAYBOOK.md`). A send proves the message was stored, not read. Also, `gate-list` from a pane with no bound Run returns `run_required` (measured tonight): that is a scope refusal, not "no gates exist".

## Tutorial 4: automations and timers

**What it is.** Three kinds of timer live on this Mac, and they differ in cost.

| | Orca automation | launchd | cron |
|---|---|---|---|
| Runs | A prompt, in an agent | A program | A program |
| Costs | A model run, unless a precheck skips it | Compute only | Compute only |
| Ours tonight | 2 | 20 `com.zao.*` loaded (23 plists on disk) | 21 active lines |
| Needs Orca up | Stored and scheduled on the Orca host per the docs, so yes (my reading; not tested with Orca closed) | No | No |
| Missed while the Mac sleeps | Grace window setting | Runs on wake | Skipped |

**When to use it.** Code can do it: launchd or cron. It needs judgment: an automation, with `--precheck` so a quiet hour costs nothing.

**On this Mac.**

```bash
orca automations list --json
orca automations runs --id <id> --json
orca automations create --name "..." --trigger hourly --prompt "..." --provider claude \
  --workspace active --reuse-session --precheck "<cheap check>" --disabled --json
orca automations edit <id> --disabled --json    # the off switch
launchctl list | grep com.zao
```

**Worked example, good.** `fleet-health`: hourly, precheck on, `reuseSession` true. **99 of its last 101 runs were skipped by the precheck.** That is the model.

**Worked example, bad, live tonight.** `AFK review and prep through 5am`: Codex, hourly, no precheck, `UNTIL=20261027T090000Z`. It reached run 119 at 19:00 on 31 Oct. **Yours:** `orca automations edit 7dacb066-b0a5-442a-b294-cd1d36b7e80a --disabled --json`

**Mistake to avoid.** Trusting an end date: Orca accepts UNTIL, COUNT and INTERVAL and ignores them ([#35894](https://github.com/stablyai/orca/issues/35894), ours, open). Set a reminder to disable instead, and check it in `automations list`. The older form of the same mistake: `organizer-tick` ran every 5 minutes with no session reuse and leaked 136 tabs by 16:00 on 29 Aug.

## Tutorial 5: artifacts and worktree comments

**What it is.** They only share a tutorial. A *comment* is the status line on a row. An *Orca artifact* is a public web link to an HTML or Markdown file, published through an Orca account. **An Orca artifact is not the Claude Artifact tool**, which makes a private claude.ai page and is what we use.

**When to use it.** Comment: every checkpoint, by every lane. Orca artifact: not yet. To get something to your phone or another person, use the Claude Artifact tool (`/clipboard` skill's own table says so).

**On this Mac.**

```bash
orca worktree current --json     # read the comment first, so nothing gets overwritten
orca worktree set --worktree active --comment "fix in; running tests" --workspace-status in-progress --json
orca worktree set --worktree active --unread --json   # puts the dot on the row to ask for you
orca artifacts list --json       # tonight: authentication_required, "Sign in to Orca and try again."
```

Clicks for artifacts, if ever: sign in; **Settings, Artifacts, Allow publishing public artifact links** (off by default, device-wide, and only a human can turn it on); then **Share as artifact** on an open HTML or Markdown file.

**Worked example.** 105 of 173 rows carry a comment tonight, up from 1 of 33 on 1 Oct. Most live status still sits in the display name, which is why names drift. The owner policy splits them: lanes write the comment, the owner sets the name.

**Mistake to avoid.** Publishing anything private. "Anyone can view the share URL", and relative assets are not uploaded. `update` and `unshare` only work from the same file path and Orca profile that shared it, and we run two profiles; `delete` by id from `list` is the way out.

## Tutorial 6: skills across workspaces

**What it is.** A skill is a folder of instructions a Claude loads. Two separate things are called sharing here. **Across workspaces on this Mac** is already solved by symlinks. **Share links** publish a skill bundle to other people or machines.

**When to use it.** New shared habit: a skill, by PR to dotfiles, and every pane has it. Share link: only when someone outside this Mac needs it.

**On this Mac.**

```bash
orca skills list                     # guides bundled with this Orca version
orca skills get orca-cli             # the version-matched guide; never trust a copy
orca skills get orca-cli --reference browser
orca skills update --all --dry-run   # tonight: "No change" on all three Orca skills
orca skills installed --json         # tonight: 487 installed
# share links, only after Settings, Share Skills allows agents, signed in:
orca skills share --skill <name> --bundle-name "<name>" --json
```

**Worked example.** The chain that gives every pane the same skills: the Orca profile's `home/skills` links to `~/.claude/skills`, which links to `~/zaal-dotfiles/claude/skills`. One folder, every workspace, both accounts.

**Mistake to avoid.** That same chain means a branch switch in `~/zaal-dotfiles` changes every session's skills mid-conversation, so nobody checks out a branch in that tree. For share links: the docs say "treat the link like a credential", revoking does not remove copies already installed, and a skill folder can hold scripts or keys. Name each skill; `--all` is deliberately refused.

## Tutorial 7: the Orca browser and tabs

**What it is.** Each worktree has its own real Chromium browser in a pane, with its own tabs. It is not Chrome. Tabs are scoped, so switching rows restores that row's tabs.

**When to use it.** Reading a clipboard page, testing a site a lane built, or a page an agent must drive. Use Chrome only when you need your own logged-in Chrome.

**On this Mac.**

```bash
orca tab list --worktree all --json   # tonight: 5 tabs, 4 of them clipboard pages
orca tab create --url https://example.com --json
orca goto --url <url> --json          # then: orca snapshot, orca click --element @e3
```

Clicks: `Cmd-T` new tab, `Cmd-Shift-T` reopen a closed one, `Cmd-F` find, right-click reload for a hard reload. **Settings, Browser, Link Routing** decides whether links from terminals open here or in your system browser. Open a local HTML file and the toolbar offers **Share as artifact**, which is the public-link gate from tutorial 5.

**Worked example.** `/clipboard` writes a page to `~/.zao/clipboard/` (188 entries tonight), and inside Orca opens it as a tab through `orca tab`, with the choice set by `CLIPBOARD_OPENER`. Duplicate the tab and you keep that clip, because the tab's URL is the clip's own file. Doc [2714](../../agents/2714-agent-session-map/)'s session map also opens in Orca's browser.

**Mistake to avoid.** Reading `orca tab list` from one worktree as "no tabs": it printed 0 here while 5 existed, because the default is scoped to the current row. And on 25 Sept a lane closed a tab in a loop over a listing and took the ZAOstock Round 5 cast page with it. Clips survive on disk; unsaved page state does not. Close a named tab, never a list.

## Zaal's daily Orca routine

1. Open the sidebar **Agents** feed first: who finished, who is blocked, while you were away.
2. Read the messenger's feed. It holds your SEND, merge and A/B items; do those before anything in Orca.
3. Look at In Progress: your top 3, seat, misc. Anything else there, tell the owner.
4. Test one thing a lane built: its link, its 3 steps. This is the job; the rest is overhead.
5. Answer with one line in that lane's pane. Feedback goes to the lane, not the seat.
6. A pane sitting at a shell means it was slept, not that it broke. Ask for a wake, or say leave it.
7. Parking a lane yourself? Right-click, **Sleep**. Per the docs, reopening brings it back with no prompt; try it once on a (w) row.
8. Never switch Claude accounts with lanes running without expecting every pane to restart.
9. Numbered close, branch delete, settings, merge: yours. Each comes to you as one line to tap.
10. Last thing: read the owner's one-line board note, then close the laptop. Agents keep running across a quit, not a reboot.

## What to adopt next, ranked

| Rank | Adopt | Cost | Gain |
|---|---|---|---|
| 1 | Disable the AFK automation | One line, yours | Ends about 24 Codex runs a day that your 31 Oct ruling already excludes |
| 2 | Fence (3), (4), (6) in `~/.zao/sleep-never` | One line, yours | The agent stops ending numbered lanes tonight; keeps the swap relief from (w) lanes |
| 3 | Remove Playwright, with the corrected line in the health note | One line, yours. `/zao-research` loses one fetch rung | No Chrome tab per new pane, one less process tree per pane |
| 4 | (0a) orca owner and policy file | One letter from you (item 19), one lane | One caller for sleep and wake; board sweeps stop reaching you as questions |
| 5 | Agent sleep gated on swap, not load, with a caller log | One dotfiles PR | Sleeps fire on memory pressure, the thing they relieve. Load 117 tonight came largely from Chrome and vitest |
| 6 | Use the Agents feed and `orca search` | Nothing; the index reads enabled and current | "Who said X" in one line; catch-up in one place |
| 7 | Log swap around each wake | A few lines in the wake path | Replaces the unmeasured "3 GB" with a number the wake gate can use |
| 8 | Update to 1.4.245, at a calm moment | App relaunch; old panes stay on the previous terminal host. I read only the 1.4.243 to .245 headlines and a keyword grep | Listed work on hidden-terminal memory and idle CPU, sleep and resume |
| 9 | `orca.yaml` with `worktree.sharedDirectories: [node_modules]` in ZAOOS | One PR, ask-first | About 2.4 to 2.9 GiB saved per new workspace (vault `notes/node-modules-sharing-2026-10-09.md`); replaces the hand symlink in `.claude/rules/agent-loops.md` rule 25 |
| 10 | Agent hibernation trial on (w) lanes | One settings toggle, yours; global, so it needs (2) and (4) first, and #33875 stays a risk | Resume with no prompt, which is the root fix for your first complaint |
| Skip | Orchestration Runs, Orca artifacts, skill-share links | | Revisit when a job truly needs tracked workers, or a person outside this Mac needs a skill |

## Contradictions left standing

1. **Hibernation docs against themselves.** The v1.4.242 page says a worktree's panes "hibernate together as a unit"; [#33940](https://github.com/stablyai/orca/issues/33940) says the shipped behaviour is per pane, and the page on `main` now says so. The docs on `main` win; I have not tested either.
2. **Doc 2677 decision 7 against rank 10 here.** 2677 skips hibernation because it does not cut tokens. True. The case now is memory and resume prompts, a question 2677 did not ask.
3. **"3 GB per pane" in the brief against the source.** The figure traces to about 2.9 GiB of disk for `npm install` on 7 lanes, marked prediction. Swap per wake is unmeasured. Footprint per awake workspace: 1.47 GiB median tonight (15 workspaces) against 330 MB idle in [doc 2704](../../agents/2704-lane-idle-sleep-and-wake/). Different dates, load and metric; not comparable as a trend.
4. **Docs on Claude config.** `agents/claude-code` says Orca "picks up `~/.claude` automatically". Panes here run with `CLAUDE_CONFIG_DIR` set to a profile home, and that is what broke grill item 32's line. Control run in the health note.
5. **Community verdicts.** r/ClaudeCode's OP calls it "very mature and stable"; the same thread has "slow and laggy doing remote work" and "11 GB on my ssd". Lynxflow measures about 500 MB across 8 processes on an idle headless server; `orca diagnostics memory` reads 2.23 GiB for the app here tonight, at 173 rows. Lynxflow also warns that Orca rewrites agent config on start: not tested here.
6. **"Sleep restores all the agents"** (HN, BlueOrigin50) against our resume prompts. Both are true. See the table in tutorial 2.

## Staleness

Orca ships near daily: three releases landed after the installed one between 28 and 30 Oct. Every command is pinned to 1.4.242; re-run `orca skills get` after any update. Docs were read at tag `v1.4.242`; the site serves the current version, so it can differ. Board counts are from 19:29 EDT on 31 Oct and move hourly.

## Also See

- [Doc 2581](../2581-orca-how-others-use-it/) - how other teams run Orca; this doc's parent
- [Doc 2677](../2677-orca-best-practices-and-upgrades/) - what we use and what to upgrade, 14 Oct
- [Doc 2513](../2513-orca-ade-capabilities/) - earlier capability survey
- [Doc 2704](../../agents/2704-lane-idle-sleep-and-wake/) - why `zao-lane-sleep` exists
- [Doc 2714](../../agents/2714-agent-session-map/) - session map in Orca's browser
- [Doc 2423](../../agents/2423-vault-as-transport-inter-terminal-context/) - the vault as memory, not a bus
- Vault `notes/orca-health-2026-10-31.md`, `notes/orca-unused-features-2026-10-29.md`, `handoffs/ORCA-SESSIONS.md`
- Code: `~/zaal-dotfiles/bin/zao-lane-sleep`, `bin/zao-lane-sleep-auto`, `~/Documents/zorca/PLAYBOOK.md`
- Tracker rows from `zao-tracker search orca`: 5 related, all done; none in flight on this topic

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Disable the AFK automation (shipped = `orca automations show` reads `enabled` false) | Zaal | One line | 2026-11-01 |
| Add the 3 fence lines to `~/.zao/sleep-never`, keeping `wavewarz-protocol` (shipped = `zao-lane-sleep scan` reads never-sleep for (3), (4), (6)) | Zaal | One line | 2026-11-01 |
| Remove Playwright with the corrected line (shipped = `claude mcp get playwright` finds nothing in all 3 configs; a new pane opens no tab) | Zaal | One line | 2026-11-02 |
| Rule grill item 19 (shipped = line in the misc grill's decisions file) | Zaal | Decision | 2026-11-02 |
| Open the owner lane and commit `notes/orca-policy.md` (shipped = file on vault main; messenger skill no longer sleeps) | Seat, on Zaal's A | Lane | 2026-11-03 |
| Dotfiles PR: agent gates on swap and logs its caller; wake logs swap before and after (shipped = PR merged, tests with a red control) | (0a) orca | PR | 2026-11-07 |
| ZAOOS `orca.yaml` PR, ask-first (shipped = new child worktree has `node_modules` with no manual step) | Zaal, through (0a) orca | PR | 2026-11-14 |
| Re-validate after any Orca update; read 1.4.243 to 1.4.245 notes in full before updating (shipped = this doc's `last-validated` moved and rank 8 re-graded) | (0a) orca | Re-research | 2026-11-30 |

## Sources

Primary, this Mac, 31 Oct 2026, 1.4.242, read-only:

- `orca --help` (386 lines), `--help` for `repo`, `worktree`, `terminal`, `agent`, `orchestration`, `automations`, `artifacts`, `skills`, `tab`, `browser`, plus `worktree create`, `worktree set`, `terminal send`, `automations edit` **[FULL]**
- `orca skills get orca-cli`, with references `automations`, `browser`, `publishing` **[FULL]**
- `orca skills get orchestration` **[PARTIAL - first 80 of 213 lines; the `--full` references were read for doc 2581 at 1.4.218, not re-read]**
- `orca worktree list/ps`, `terminal list`, `automations list/show/runs`, `orchestration run-list/run-show/inbox/gate-list`, `tab list`, `artifacts list`, `skills installed`, `skills update --all --dry-run`, `search --index-status`, `status`, `diagnostics memory`, all `--json` where offered **[FULL - read-only]**
- `~/Library/Application Support/orca/logs/daemon.log`, `orchestration.db` by `sqlite3 mode=ro` **[FULL for the counts cited]**
- `~/.zao/sleep/*.json`, `~/.zao/sleep/auto.log`, `~/.zao/sleep-never`, `~/.zao/top3`, `~/.claude/state/status-*.json`, launchd plist, `crontab -l`, `launchctl list` **[FULL]**
- `~/bin/zao-lane-sleep`, `zao-lane-sleep-auto`, `zao-session-dupes`, `zao-lane-close`, `~/.claude/skills/clipboard/SKILL.md`, `messenger/SKILL.md` **[PARTIAL - headers and the sleep sections]**

Vault and repo records, origin/main:

- `handoffs/orca-research.md`, `orca-research.done.json`, `orca-upgrades.md`, `status/orca-upgrades.md`, `decisions/seat-2026-10-31-finance-claude-only.md`, `seat-2026-10-31-mac-claude-only-codex-desktop.md`, `notes/orca-unused-features-2026-10-29.md`, `~/.zao/briefs/misc-grill-queue-2026-10-31.md` **[FULL]**
- `handoffs/ORCA-SESSIONS.md` **[PARTIAL - first 190 lines]**; `handoffs/status/messenger.md`, `orchestrator2.md`, `MISTAKES.md` **[PARTIAL - grep for sleep, swap, resume]**
- `notes/storage-offload-2026-10-30.md` on the open vault #376 branch **[PARTIAL - swap and wake lines]**
- `~/Documents/zorca/PLAYBOOK.md` **[FULL]**; memory files `feedback_seat_job_is_lanes_and_orca_workflow`, `feedback_zaal_time_is_test_and_feedback`, `feedback_orca_sidebar_format`, `feedback_orca_in_progress_max_three`, `project_orca_account_switch_restarts_panes` **[FULL]**
- Doc 2581 **[FULL]**, doc 2677 **[FULL]**; docs 2513, 2704, 2714, 2423 **[PARTIAL - resolved by `zao-research-health --resolve`, summaries only]**

Orca docs. Each read as raw MDX at tag `v1.4.242` by `gh api`; the live page answered HTTP 200 on 31 Oct:

- [Session restore](https://www.onorca.dev/docs/model/session-restore), [Worktrees](https://www.onorca.dev/docs/model/worktrees), [Agents and sessions](https://www.onorca.dev/docs/model/agents-sessions), [Tabs and panes](https://www.onorca.dev/docs/model/tabs-panes-splits) **[FULL]**
- [Automations](https://www.onorca.dev/docs/cli/automations), [Orchestration](https://www.onorca.dev/docs/cli/orchestration), [Skills](https://www.onorca.dev/docs/cli/skills), [Worktree checkpoints](https://www.onorca.dev/docs/cli/worktree-checkpoints), [CLI overview](https://www.onorca.dev/docs/cli/overview) **[FULL]**
- [Hibernation](https://www.onorca.dev/docs/agents/hibernation), [Hooks and memory](https://www.onorca.dev/docs/agents/hooks-memory), [Claude Code](https://www.onorca.dev/docs/agents/claude-code), [Session history](https://www.onorca.dev/docs/agents/session-history) **[FULL]**
- [Notifications](https://www.onorca.dev/docs/notifications), [Agents feed](https://www.onorca.dev/docs/activity) **[FULL]**
- [Per-worktree browser](https://www.onorca.dev/docs/browser/overview) **[FULL - raw MDX; live page not separately checked]**; browser profiles **[PARTIAL - first 20 lines]**
- [Settings](https://www.onorca.dev/docs/settings), [CLI reference](https://www.onorca.dev/docs/cli/reference) **[PARTIAL - Artifacts, Experimental and Share Skills sections]**
- [Terminal](https://www.onorca.dev/docs/terminal), [Troubleshooting](https://www.onorca.dev/docs/troubleshooting) **[PARTIAL - fetched, not read; nothing here cites them]**

Changelog:

- [v1.4.242 release notes](https://github.com/stablyai/orca/releases/tag/v1.4.242) **[FULL for product sections; test and build list partly read]**
- [v1.4.243](https://github.com/stablyai/orca/releases/tag/v1.4.243), [v1.4.244](https://github.com/stablyai/orca/releases/tag/v1.4.244), [v1.4.245](https://github.com/stablyai/orca/releases/tag/v1.4.245) **[PARTIAL - keyword grep; 1.4.245 first 24 lines. Rank 8 says so]**
- [LICENSE](https://github.com/stablyai/orca/blob/main/LICENSE) **[FULL - file decoded]**, repo stats by `gh api` **[FULL]**

Upstream issues, `gh api`:

- [#35894](https://github.com/stablyai/orca/issues/35894), [#22571](https://github.com/stablyai/orca/issues/22571) with its comment, [#33875](https://github.com/stablyai/orca/issues/33875), [#33940](https://github.com/stablyai/orca/issues/33940) **[FULL - first 24 lines of the long bodies, which carry the claims used]**
- [#31545](https://github.com/stablyai/orca/issues/31545), [#34690](https://github.com/stablyai/orca/issues/34690), [#36427](https://github.com/stablyai/orca/issues/36427), [#28703](https://github.com/stablyai/orca/issues/28703), [#8133](https://github.com/stablyai/orca/issues/8133) **[PARTIAL - bodies capped at 900 characters a line and truncated output; #36427 and #28703 are other-platform reports, used only as context]**

Community:

- [r/ClaudeCode: Orca ADE is incredible](https://www.reddit.com/r/ClaudeCode/comments/1vwjgyv/orca_ade_is_incredible/), 142 points, 74 comments **[PARTIAL - exa fetch; post and 45 of the 74 comments]**
- [r/OrcaADE: Using Orca-CLI to automate the workflow](https://www.reddit.com/r/OrcaADE/comments/1vzk26j/using_orcacli_to_automate_the_workflow_across/) **[PARTIAL - exa fetch; post and 3 of 7 comments]**
- Reddit search **[FAILED - JSON endpoint HTTP 403; `zao-fetch-reddit.sh` has no OAuth credentials; Arctic Shift returned nothing; exa search found the two threads above]**
- [HN comment, BlueOrigin50](https://news.ycombinator.com/item?id=49237309), [empiree](https://news.ycombinator.com/item?id=49855392), [sent-hil](https://news.ycombinator.com/item?id=49103047) **[FULL - Algolia items API; the second is one comment's opening, as returned]**
- [D#30471 orca-fleet](https://github.com/stablyai/orca/discussions/30471) **[FULL - exa]**
- [Lynxflow hands-on](https://blog.lynxflow.co/en/posts/orca-ade-tutorial-from-install-to-headless/), 2026-10-10 **[FULL - exa]**
- [ZenoLab guide](https://zenolab.app/blog/orca-ade-guide/), 2026-10-21 **[PARTIAL - exa, first 4,500 characters; second-hand from the docs]**
- `@playwright/mcp` 0.0.69 `README.md` and `playwright-core/lib/tools/mcp/cdpRelay.js`, local npx cache **[PARTIAL - extension sections; tab timing not run]**
- X **[not fetched - no first-hand X account surfaced in search]**; Discord **[not joined, as in doc 2581]**

No Orca state was changed, nothing was installed, and disk stayed above the 20 GiB floor (27 GiB free by `df` at each read).
