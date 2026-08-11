---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-08-11
superseded-by:
related-docs: "826, 879, 928, 1031, 2036, 2156, 2246, 2262"
original-query: "we need to make our whole ecosystem work without the Mac having internet so that everything stays up looping on desktop, VPS and Pi - DEEP tier, inventory what only exists on the Mac before proposing anything, deliverable is a numbered doc in research/infrastructure/ with owners and real dates"
tier: DEEP
---

# 2264 - What has to change for the ecosystem to survive the Mac being offline

> **Goal:** Decide, per capability, where it lives when the Mac is shut - based on an exhaustive inventory of what only exists on the Mac today, not on an assumption about what is missing.

## The one-paragraph answer

The always-on tier is not missing. It already exists and is dense: the VPS runs 8 services and 22 cron entries, the Pi runs 7 tmux sessions and 7 cron entries, and **the VPS already has an authenticated Claude Code install** (`claude 2.1.167`, credentials written 2026-08-08). What is missing is not compute and not authorization. It is **reachability and state durability**. The VPS - the box that carries almost everything Zaal would want to reach - is the only machine in the estate not on the tailnet. And 292 MB of `~/.zao/` on the Mac, including the secrets file, the ICM owner keys, the CRM extracts and 103 transcript directories, is not a git repo and has exactly one backup file in it. Fix reachability first, durability second, and the lane migration is a small third step rather than a rebuild.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Put the VPS on the tailnet. This is the single blocking change and everything else queues behind it.** | `which tailscale` on `srv1537940` returns nothing. The box running ZOE, the bus, the cowork agent, ZAO Devz, the ZAOstock bot, farscout and cloudflared is the ONE machine unreachable by the private mesh. Every remote-access option below - `t3 pair --tailscale`, `zj vps`, plain ssh from Blink - is strictly better over a tailnet than over the public internet. |
| 2 | **The always-on Claude lane host is the VPS, not the Pi and not the Windows desktop.** | The VPS has Claude Code installed AND authenticated (`~/.claude/.credentials.json`, 1428 bytes, 2026-08-08; `hasCompletedOnboarding: true`; an `oauthAccount` block present). The Pi has NO claude binary at all. The Windows desktop answers ping on `100.72.152.63` but has port 22 closed, so it is currently a tailnet member with no shell. Lowest-effort correct home wins. |
| 3 | **DO NOT enable Remote Login on the Mac as the fix.** | It treats the symptom. The Mac sleeps; a lid close drops the node regardless of whether sshd is listening. Enabling sshd makes the Mac reachable *while awake*, which is the state where it was never the problem. Keep it as a convenience toggle, never as the availability answer. |
| 4 | **T3 Code is real, is a genuine fit, and gets a BOUNDED trial on the VPS - not on the Mac, and not before decision 1.** | Verified directly against `pingdotgg/t3code`: MIT, 18,270 stars, 4,143 forks, created 2026-02-08, pushed 2026-08-11. It runs a Linux systemd background service (`npx t3 service install`), pairs over a tailnet (`npx t3 pair --tailscale`), and uses the machine's EXISTING Claude Code credentials via `CLAUDE_CONFIG_DIR`. Installed on the VPS it controls VPS agents, which is exactly the shape of this problem. But it carries **1,611 open issues** at `v0.0.34-nightly` with three releases shipped on 2026-08-11 alone, and its own README says "We are very very early in this project. Expect bugs." Trial it on the VPS; do not put it on the path of anything gated. |
| 5 | **`~/.zao/` stops being a single-disk state store this week.** | 292 MB, NOT a git repo, one file in `backups/`. It holds `zao.env`, `private/icm-keys.json`, `private/farcaster-dm-crm-*.sql`, meeting transcripts and 103 transcript directories. A dead Mac disk loses all of it. Memory is already safe by a different route - `~/.claude/projects/.../memory` is a SYMLINK into `~/zaal-dotfiles/claude/memory/zaoos` and all 400 files are git-tracked - which is the pattern to copy, not invent. |
| 6 | **The cheap fleet is not broken, it is out of money. Top up OpenRouter or route to the VPS's own Ollama.** | The OpenRouter account reports `total_credits: 60, total_usage: 60.205736834` - overdrawn by $0.21. `~/.zao/fleet-brain.state` on the VPS reads `NO_CREDITS`, and `fleet-brain-check.sh:22` sets that literal only when the API response contains a credit error. Today's loop digest is **602 bytes** against 401,482 (08-10) and 731,140 (08-09). This matters here because every loop that cannot reach a cheap brain falls back onto the Claude weekly cap. |
| 7 | **Push the dotfiles. The backup is real but stale by 16 commits.** | `~/zaal-dotfiles` has 16 unpushed commits and 10 modified/deleted files in the working tree. Memory, skills and `~/bin` are only durable to the extent that they are PUSHED, and right now the newest 16 commits of them exist on one laptop. |

## Section 1 - The inventory: what only exists on the Mac

This section is the reason the doc exists. Per `confirm-before-claiming-absence.md`, nothing below is an assumption; each row was measured on 2026-08-11 and carries the command that produced it.

### 1a. The interactive lanes - 8 of them, all Claude Code

`tmux ls` plus a per-session `list-panes` walk:

| Lane | Working directory | Age |
|---|---|---|
| `alwayson` | `ZAO OS V1` | created 2026-08-11 |
| `audos` | `~/.zao/audos` | 2026-08-04 |
| `cowork` | `ZAO OS V1` | 2026-08-08 |
| `grill` | `~/.zao/grill` | 2026-08-04 |
| `zabalgames` | `~/Documents/zabalgames` | 2026-07-31 |
| `zaoresearch` | `ZAO OS V1` | 2026-08-11 |
| `zaostock` | `~/Documents/zaostock` | 2026-08-05 |
| `zpoidh` | `~/Documents/zpoidh` | 2026-08-04 |

Every one of the eight panes reports a Claude Code version string as its current command (`2.1.220` through `2.1.228`). These are not shells with a script in them; they are eight live Claude Code sessions, and the oldest has been up 11 days. A lid close ends all eight.

### 1b. The personal operating layer - 74 of 80 tools in `~/bin` exist nowhere else

`comm` against the VPS `~/bin` listing: the Mac has 80 entries, the VPS 97, and only 6 names are common. The Mac-only set is not miscellaneous - it is the whole capture-to-crush loop and the whole fleet-view layer:

- **Capture and triage:** `todo`, `crush`, `zao-triage`, `morning-pick`, `zao-tracker`, `zao-inbox`, `zao-agenda`
- **Fleet view and lane control:** `zj`, `ztui`, `zlane`, `zfleet`, `zx`, `zao-fleet`, `zao-loops`, `zao-tui`, `zao-hud`, `cockpit`, `zao-cockpit`, `status`, `zao-status`
- **Relay:** `zao-relay`, `relay`, `lane-send`, `lane-read`, `lane-relay-daemon`, `relay-autopull.sh`
- **Fetchers:** `zao-fetch-reddit.sh`, `zao-fetch-x.sh`, `zao-fetch-farcaster.sh`, `zao-ingest.sh`
- **Spend and identity:** `zao-spend`, `zao-secrets`, `icm`, `zao-icm.py`, `zao-crm`
- **Statusline:** `zao-cc-statusline.sh`, `zao-cc-state.sh`, `zao-cc-activity.sh`

The VPS's 91 unique tools are the other half of the same system - `loop-agent.sh`, `cheap-loop.sh`, `provider-health.sh`, `zoe-autodeploy.sh`, `bus-poll.py`, `fleet-*`. **Neither machine has the whole toolkit.** That is the honest finding, and it is worse than "the Mac has everything", because it means neither box can currently stand alone.

One important nuance in favour of migration: `zj` is ALREADY multi-host. Its own header documents `zj local|pi|vps` and a status column built from "a full walk of the pane's process descendants". The fleet-view tool was written for exactly this move.

### 1c. The Mac-only scheduled work

One launchd agent and three cron entries:

- `com.zao.lane-relay` (launchd, `KeepAlive` true) runs `lane-relay-daemon`, which polls the relay hub every 6 seconds and delivers inbound messages into IDLE tmux lanes via `lane-send`. Its own comments record two production incidents it was hardened against - a duplicate-delivery race on 2026-08-09 fixed with an atomic `mkdir` lock, and an acked-then-destroyed message when a lane was a bare zsh shell. This daemon is the piece that makes a relay reach a lane nobody is sitting at, and it exists only on the Mac.
- `17 * * * * zao-vault-log` - hourly Obsidian vault commit
- `17 * * * * zao-spend --ledger --hours 1` - the spend ledger
- `0 9 * * 1 zao-fetch-healthcheck.sh` - weekly fetch-path check

### 1d. The state that lives on one disk

| What | Size / count | Durability |
|---|---|---|
| `~/.zao/` total | **292 MB** | **NOT a git repo.** One file in `backups/`. |
| `~/.zao/private/` | 32 MB, 60 files | Includes `icm-keys.json`, `zao.env`, CRM SQL extracts, meeting transcripts |
| `~/.zao/transcripts/` | 3.1 MB, 103 directories | Nothing pushes these anywhere |
| `~/.claude/.../memory/` | 400 files | **SAFE** - symlink into `~/zaal-dotfiles/claude/memory/zaoos`, git-tracked |
| `~/zaal-dotfiles` | 802 tracked files under `claude/` | **16 commits unpushed**, 10 files modified/deleted in the tree |
| `~/zao-vault` (Obsidian) | git repo | committed hourly by the Mac-only cron |

The memory row is the template. It is the one piece of Mac state that is already durable, and it got there by being a symlink into a git repo rather than by a backup job. Everything in the first three rows should reach the same place by the same route, minus the secrets, which need a different answer.

### 1e. The MCP gap

Mac: 10 MCP servers configured - `context7`, `dune`, `hyperagent`, `playwright`, `serena`, `supabase-cowork` globally, plus `gitnexus`, `grep`, `notion`, `paragraph` scoped to the ZAOOS project.

VPS: **zero** global MCP servers, and one project-scoped server (`scout`) across 29 known project entries.

So a Claude lane moved to the VPS today boots without Serena, without context7, without the Supabase tools and without Paragraph. That does not block the move, but it means "move the lane" is not a one-line change and should be scoped honestly.

### 1f. Genuinely Mac-bound, correctly so

Not everything should move, and pretending otherwise wastes the migration. These stay:

- **Browser automation against Zaal's logged-in Chrome.** The `playwright` MCP and the Claude-in-Chrome extension both drive a browser holding real sessions. A headless VPS browser is a different capability, not the same one relocated.
- **Local media capture and transcription.** `~/.zao/diarization-models/`, the Craig multitrack workflow, voice memos, `zao-ingest.sh`.
- **The macOS surfaces.** `pbcopy` (the `/clipboard` skill), `~/.zao/swiftbar-plugins/`, the local dev servers currently on ports 3000/3100/3200/3300.
- **Interactive building itself.** A human at a keyboard is a Mac-online activity by definition. The point of this doc is that nothing AUTONOMOUS should be.

## Section 2 - The tailnet, as it actually stands

`tailscale status` on 2026-08-11, with probes:

| Node | Tailnet IP | Owner | Probe result |
|---|---|---|---|
| `macbook-air-3` | 100.81.77.87 | zaalp99@ | sleeps; no sshd (per brief, verified today) |
| `ansuz` (Pi) | 100.117.191.11 | zaalp99@ | **port 22 OPEN**, up 3 days, 7 tmux sessions |
| `desktop-h2ov6da` (Windows) | 100.72.152.63 | zaalp99@ | pings (avg 83 ms), **port 22 closed/filtered** |
| `iphone-15` | 100.68.252.104 | zaalp99@ | Zaal's phone |
| `srv1073120` | 100.121.237.35 | **failoften@** | host key verification failed |
| VPS `srv1537940` | **absent** | - | 31.97.148.88, `which tailscale` returns nothing |

Two corrections to the brief's open questions:

1. **`srv1073120` is not a ZAO machine to plan around.** It belongs to tailnet user `failoften@`, not `zaalp99@`. It is a teammate's box shared into the tailnet. Treat it as someone else's server; do not schedule ZAO work onto it.
2. **The Windows desktop is on the tailnet but has no shell.** Reaching it is not a Tailscale problem, it is an OpenSSH-server-not-installed problem. That is a real second always-on candidate, but it is further away than the VPS, not closer, despite being described as "the always-on box".

## Section 3 - The always-on tier that already exists

Worth stating plainly, because the risk in a migration doc is proposing to build what is running.

**VPS `srv1537940` - 8 running services:** `zoe-bot`, `zao-devz-stack`, `zaostock-bot`, `cowork-agent`, `zao-bus`, `farscout`, `cloudflared`, plus dbus. **22 cron entries** including `zoe-autodeploy.sh` every 10 minutes, `loops-keepalive-failover.sh` every 3 minutes, `disk-guard.sh` every 20, `bus-poll-run.sh` hourly, and the morning/dinner/winddown routine pings. It also runs its own Ollama with `qwen2.5:3b` resident.

**Pi `ansuz` - up 3 days,** running Ollama, Pi-hole FTL, Docker, containerd and tailscaled, with 7 tmux sessions (`fleet`, `zol`, `zolz`, `zolt`, `ytr`, `seor`, `repor`) and 7 cron entries driving the ZOL Farcaster agent (`zol-daily.js`, `zol-zabal-watch.js` every 5 min, `zol-drain.js`, `zol-win-drain.js`, `zol-follow.js`) plus a `start-fleet.sh` re-run every 15 minutes.

Neither of these needs the Mac. **They are already Mac-independent today.** The exposure is narrower than "the ecosystem depends on the laptop": it is the eight interactive lanes, the relay daemon, the personal tool layer, and the state.

## Section 4 - What breaks if the Mac is shut for a week

| Capability | Breaks? | Detail |
|---|---|---|
| ZOE (`@zaoclaw_bot`), ZAO Devz, ZAOstock bot, cowork agent, the bus | **No** | systemd on the VPS, no Mac dependency |
| ZOL on Farcaster | **No** | Pi cron |
| ZOE auto-deploy, disk guard, keepalive failover | **No** | VPS cron |
| Supabase, Vercel, thezao.xyz, the board web surface | **No** | hosted |
| **The 8 Claude Code lanes** | **Yes, immediately** | all Mac tmux |
| **Relay delivery into idle lanes** | **Yes** | `lane-relay-daemon` is a Mac launchd agent |
| **`todo` / `crush` / `zao-triage` / `morning-pick`** | **Yes** | Mac-only binaries; the capture-to-crush loop stops at the door. The BOARD keeps working (it is Supabase, and ZOE reads it), but Zaal's way in from a terminal does not. |
| **`zj` / `ztui` fleet view** | **Yes** | Mac-only, even though it can already read remote hosts |
| **Spend ledger + Obsidian vault log** | **Yes** | hourly Mac cron; gap for the whole week |
| **`zao-spend` visibility** | **Yes** | the ledger silently stops accumulating, which is the exact failure `agent-spend.md` was written to end |
| **ICM edits** | **Yes** | `icm` and the owner keys are Mac-side |
| **Reddit / X / Farcaster fetchers** | **Yes** | Mac-only scripts, so research loops lose their fetch ladder |
| **All 10 MCP servers** | **Yes** | none configured on the VPS |
| Anything gated (outbound, on-chain, spend) | **Correctly yes** | this is by design and must stay that way |

The summary: **the autonomous half survives a week; the operator half does not.** Zaal keeps his bots and loses his cockpit. That is the actual shape of the problem, and it argues for moving the operator layer rather than re-homing the services.

## Section 5 - T3 Code, verified

Doc 2262 recorded that "the upstream repository did not surface in a GitHub repo search on 2026-08-11" and reasoned from the third-party ecosystem instead. **The repository exists and was read directly for this doc**: `gh api repos/pingdotgg/t3code` plus its README and two docs files.

| Fact | Value | How measured |
|---|---|---|
| License | MIT | GitHub API |
| Stars | 18,270 | GitHub API |
| Forks | 4,143 | GitHub API |
| Created | 2026-02-08 | GitHub API |
| Last push | 2026-08-11 (today) | GitHub API |
| Version | `v0.0.34-nightly`, build stamped 2026-08-11 | releases API, 3 nightlies published on 2026-08-11 |
| Open issues (incl PRs) | **1,611** | GitHub API |

**What it does that matters here**, from `docs/user/remote-access.md` and `docs/user/background-service.md`:

- `npx t3@latest service install` installs a **systemd user service** that survives logout. The docs state plainly: "The background service currently requires Linux with systemd." The VPS is Linux with systemd. The Mac is not, which is itself an argument for putting it on the VPS.
- `npx t3 pair --tailscale` publishes the server over **Tailscale Serve HTTPS** and pairs via the `https://machine.tailnet.ts.net/` URL. The docs recommend exactly this over public exposure: "Use a trusted private network that meshes your devices together, such as a tailnet."
- Provider auth reuses the machine's existing Claude Code credentials; an empty `CLAUDE_CONFIG_DIR` means it uses Claude Code's normal config directory. **The VPS already has that directory populated and authenticated.**

**The honest counterweight.** 1,611 open issues at `v0.0.34` with the README saying "very very early" and "We are (mostly) not accepting contributions yet" is a pre-1.0 tool moving daily. Zaal's standing instruction on it (doc 2262, Key Decision 5) was study, do not wire in. Nothing here changes that instruction; it upgrades the recommendation from "unknown, do not touch" to "known, trial it in a bounded place after the tailnet lands, still nothing gated behind it."

**What it does NOT solve.** T3 Code controls agents on the machine it runs on. Installed on the Mac it makes the Mac's lanes phone-reachable while the Mac is awake, which is not the problem. It only answers this doc's question when installed on an always-on box - which requires decision 1 first. It is a control surface, not a relocation.

## Section 6 - Migration order

The order is forced by dependencies, not preference. Each step is independently useful, so a stall at any point still leaves the estate better than it is now.

**Step 1 - Tailscale on the VPS.** `tailscale up` on `srv1537940`, joined to the same tailnet, with the node named clearly. Nothing else here works well without it, and it costs one command. Not destructive, not gated, reversible.

**Step 2 - Push the dotfiles.** 16 commits, blocked on a `bin/zao-tracker` conflict. Until this lands, every "the tools are backed up" claim is 16 commits out of date. Hand-resolve the conflict; `never-union-merge-code` binds here since `zao-tracker` is a script, not prose.

**Step 3 - Durability for `~/.zao/`.** Split it: secrets (`zao.env`, `private/icm-keys.json`, `private/*.env`) go to whatever secret store Zaal picks and never to git; the durable non-secret state (transcripts, handoffs, clipboard history, the spend ledger) follows the memory pattern into a git-backed path. 292 MB needs a size decision before a route decision - do not push 292 MB into dotfiles blind.

**Step 4 - MCP parity on the VPS.** Configure at minimum `serena`, `context7` and `supabase-cowork` so a VPS lane is not a degraded lane. This is the step most likely to be under-scoped.

**Step 5 - Move ONE lane, not eight.** Pick the lane with the least Mac coupling - `zaoresearch` is the natural candidate since research is fetch-and-write - and run it in `tmux new -A -s` on the VPS per doc 879. Verify from Blink over the tailnet. `agent-loops.md` rule 9 binds hard: the lane must be moved, not duplicated. Two Claude sessions on the same working directory and the same board is the split-brain case.

**Step 6 - Port the operator layer.** `zj`, `todo`, `crush`, `zao-triage`, `zao-tracker` onto the VPS. They are shell scripts reading Supabase, so this is mostly a copy plus env wiring, but it is 74 files and deserves a scoped pass rather than a blanket `rsync`.

**Step 7 - T3 Code trial, VPS only.** After 1-6. `npx t3 service install` plus `npx t3 pair --tailscale`, pointed at a scratch repo, nothing gated behind it, for a week. Keep `zj` running the whole time; do not retire a working tool for a `v0.0.34` one on the strength of a trial.

**Not in the order, deliberately:** re-homing ZOE, the bus, the bots or the Pi's ZOL loops. They already do not need the Mac. Moving a healthy service is how a migration creates the outage it was meant to prevent.

## Section 7 - What this does not fix

- **Zaal's Claude weekly cap.** Moving lanes to the VPS moves where they run, not what they cost. With OpenRouter overdrawn, cheap-tier work is currently falling back to the cap; that is a billing fix, not an architecture one.
- **Two half-toolkits.** After this migration the Mac and VPS still have different `~/bin` contents. Full parity is a bigger project than this doc; step 6 narrows the gap to the operator layer specifically.
- **The Windows desktop.** It stays a tailnet member with no shell until OpenSSH Server is installed on it. Out of scope here, worth a separate small task.
- **Browser-session work.** Genuinely Mac-bound. If Zaal needs a logged-in Chrome while travelling, that is a different research question.

## Also See

- [Doc 826](../826-zao-infrastructure-estate-map/) - the estate map this updates
- [Doc 879](../../dev-workflows/879-tmux-mosh-pi-remote-workflow/) - `tmux new -A -s main` plus mosh from Blink, the existing remote-lane playbook
- [Doc 2262](../../agents/2262-agent-link-multi-agent-coordination/) - agent-link and the earlier T3 Code note this corrects
- [Doc 2156](../../dev-workflows/2156-zaal-toolkit-catalog/) - the toolkit catalogue behind section 1b
- [Doc 2036](../../dev-workflows/2036-context-hygiene-cost-discipline/) - context hygiene, worktrees, prompt cache
- `.claude/rules/agent-loops.md` rule 9 (one instance per resource), rule 25 (worktrees on a shared clone)
- `.claude/rules/agent-spend.md` - why a silent spend ledger is a real loss

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run `tailscale up` on VPS `srv1537940`; done when `tailscale status` from the Mac lists it with a 100.x IP | @Zaal | Ops (one command, not gated) | 2026-08-12 |
| Resolve the `bin/zao-tracker` conflict and push the 16 dotfiles commits; done when `git -C ~/zaal-dotfiles log origin/main..HEAD` is empty | @Zaal | Git | 2026-08-12 |
| Decide the split for `~/.zao/` - which paths are secrets, which become git-backed; done when a written path list exists in this doc's folder | @Zaal | Decision | 2026-08-14 |
| Install OpenSSH Server on `desktop-h2ov6da`; done when `nc -z 100.72.152.63 22` succeeds | @Zaal | Ops | 2026-08-15 |
| Top up OpenRouter or repoint the fleet at the VPS Ollama; done when `~/.zao/fleet-brain.state` on the VPS no longer reads `NO_CREDITS` | @Zaal | Billing / config | 2026-08-12 |
| Configure `serena`, `context7`, `supabase-cowork` MCP on the VPS; done when `claude mcp list` on the VPS shows all three connected | @Zaal | Config PR | 2026-08-16 |
| Move the `zaoresearch` lane to the VPS under `tmux new -A -s zaoresearch` and KILL the Mac copy; done when `zj vps` shows it and `tmux ls` on the Mac does not | @Zaal | Migration | 2026-08-18 |
| Port `zj`, `todo`, `crush`, `zao-triage`, `zao-tracker` to the VPS; done when `todo "test"` from a VPS shell appears on the board | @Zaal | PR | 2026-08-22 |
| Bounded T3 Code trial on the VPS only (`t3 service install` + `t3 pair --tailscale`), scratch repo, nothing gated; done when Zaal has driven one agent thread from his phone and written a keep/drop line here | @Zaal | Trial | 2026-08-25 |
| Re-validate this doc after the migration; done when `last-validated` is updated and the "what breaks" table is re-measured | @Zaal | Doc update | 2026-09-11 |

## Sources

Local measurement (all run 2026-08-11, all on the machines named):

- `tailscale status` on `macbook-air-3` [FULL] - 5-node tailnet listing, owners and IPs
- `tmux ls` + per-session `tmux list-panes -F` on the Mac [FULL] - 8 lanes, Claude Code version per pane
- `comm -23 / -13` over `ls ~/bin` on Mac vs VPS [FULL] - 80 vs 97 entries, 74 Mac-only
- `systemctl --user list-units --state=running` + `crontab -l` on `srv1537940` [FULL] - 8 services, 22 cron entries
- `systemctl list-units --state=running` + `crontab -l` + `tmux ls` on `ansuz` [FULL] - 7 sessions, 7 cron entries
- `ls -la ~/.claude/.credentials.json` + `~/.claude.json` keys on the VPS [FULL] - authenticated Claude Code 2.1.167
- `du -sh ~/.zao` + `test -d ~/.zao/.git` + `ls -ld` on the memory symlink [FULL] - 292 MB, not a repo; memory symlinked into dotfiles
- `git -C ~/zaal-dotfiles log origin/main..HEAD` + `status --short` [FULL] - 16 unpushed commits, 10 dirty files
- `~/.claude.json` MCP keys, Mac and VPS [FULL] - 10 vs 0 global
- `curl https://openrouter.ai/api/v1/credits` from the VPS [FULL] - `total_credits: 60, total_usage: 60.205736834`
- `cat ~/.zao/fleet-brain.state` + `grep -n NO_CREDITS ~/bin/*.sh` on the VPS [FULL] - state literal traced to `fleet-brain-check.sh:22`
- `ls -la ~/.zao/loop-digest-*.jsonl` on the VPS [FULL] - 602 bytes today vs 401,482 and 731,140 the two prior days
- `nc -z` probes to 100.72.152.63:22 and 100.117.191.11:22 [FULL] - Windows closed, Pi open
- `lsof -nP -iTCP -sTCP:LISTEN` on the Mac [FULL] - node dev servers on 3000/3100/3200/3300, no production listener
- `head` of `~/zaal-dotfiles/bin/lane-relay-daemon`, `~/bin/zj`, `~/bin/todo`, `~/bin/zao-tracker` [FULL] - purpose and backing store read from source

External:

- [pingdotgg/t3code](https://github.com/pingdotgg/t3code) [FULL] - repo metadata, README, `docs/user/remote-access.md`, `docs/user/background-service.md`, `docs/user/providers-claude.md`, issues and releases APIs, all read 2026-08-11
- [T3 Code on the App Store](https://apps.apple.com/us/app/t3-code-remote-claude-more/id6787819824) [PARTIAL - store listing and review excerpts via search, the review pages themselves were not fetched]
- [t3.codes](https://t3.codes/) [PARTIAL - surfaced in search, not fetched; the GitHub docs were used instead as the primary]
- HackerNews via Algolia API, queries "t3 code remote agent" and "tailscale remote dev machine" [FAILED for the topic - **zero stories** on T3 Code, and the tailscale query returned only 1-30 point items with 0 comments. There is no HN discussion of this tool to cite. Stated rather than substituted.]
- Reddit via `~/bin/zao-fetch-reddit.sh` [FAILED - the script takes a post URL and cannot parse a `search/?q=` URL ("could not extract post id"); the `.json` search route returned HTTP 429. Escalation was not pursued further because the GitHub source is primary here and stronger than any thread would have been. Noting it rather than filling the gap with a search snippet.]
- [Knightli, T3 Code Windows tutorial](https://knightli.com/en/2026/07/29/t3-code-windows-remote-control-codex-claude-code/) [PARTIAL - title and framing from search results only, not fetched]

**Community-source coverage is thinner than DEEP tier normally requires, and that is a finding rather than a shortfall in effort.** T3 Code has 18,270 stars and no HackerNews thread; Reddit was rate-limited. The primary source here is the machine estate itself, where 15 of 15 measurements are FULL and were run directly against the boxes in question.
