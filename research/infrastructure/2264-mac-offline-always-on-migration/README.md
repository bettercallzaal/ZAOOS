---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-08-11
superseded-by:
related-docs: "826, 879, 928, 1031, 2036, 2156, 2246, 2262"
original-query: "we need to make our whole ecosystem work without the Mac having internet so that everything stays up looping on desktop, VPS and Pi - DEEP tier, inventory what only exists on the Mac before proposing anything, deliverable is a numbered doc in research/infrastructure/ with owners and real dates. EXTENDED same day: what if i run out of usage for this week and switch to my zao claude - we will lose some connections, let's clean that up as a weakness. what's the best way to build in more functionality for moving vendors if needed."
tier: DEEP
---

# 2264 - What has to change for the ecosystem to survive the Mac being offline

> **Goal:** Decide, per capability, where it lives when the Mac is shut - based on an exhaustive inventory of what only exists on the Mac today, not on an assumption about what is missing. **Extended 2026-08-11** to the same question one layer up: what breaks when the Claude ACCOUNT switches, and where a vendor holds the only copy of our state.

> **The single most urgent item in this doc is Section 9.** ZABAL Gamez Season 1 exists only inside Upstash, the fix is already written as PR #615, and that PR as it stands would publish every live agent auth token to a public repository. Read that section before the migration order.

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

## Section 8 - The Claude account switch: what a cap-out actually costs

Zaal, 2026-08-11: "what if i run out of usage for this week and switch to my zao claude - we will lose some connections."

The brief carried a working list of what survives and what does not. **Measured, that list is wrong in three places**, and the shape of the problem is three-way rather than two-way. What follows is from `~/.claude.json` and the macOS keychain on 2026-08-11, not from the list.

### 8a. The real classification

**Class 1 - Anthropic-account-bound. Definitely lost on a switch.** `claudeAiMcpEverConnected` holds **13** connectors, not the 9 in the brief:

`Google Calendar`, `Gmail`, `Google Drive`, **`Claude Code Remote`**, `Descript`, `Expedia`, `Linear`, `TravExp`, `Slack`, `Notion`, `Canva`, `Calendly`, `Dropbox`

**The one that matters most is the one the brief did not list: `claude.ai Claude Code Remote`.** That is Remote Control - the feature `remoteControlAtStartup: true` turns on, and the thing that lets Zaal reach a session from his phone. It is bound to the Anthropic account. **Switching to the ZAO Claude account breaks phone reach into sessions**, which collides head-on with the Mac-independence goal in the first half of this doc. The two halves of the brief turn out to be one problem.

`Descript`, `Expedia` and `TravExp` were also missing from the list.

**Class 2 - vendor OAuth, stored on THIS MACHINE.** These are local HTTP MCP servers whose OAuth is to the VENDOR, not to Anthropic: `paragraph`, `notion` (the project-scoped one, distinct from the claude.ai connector of the same name), `supabase-cowork`, `hyperagent`, `grep`, `exa`. Config evidence: each is `type: http` with a `url` and **no `env` and no `headers`** - there is no key in the file, so the credential is an OAuth token held elsewhere.

**This class is the brief's main error.** It listed Supabase under "survives, keyed by file". Measured, `supabase-cowork` is `https://mcp.supabase.com/mcp?project_ref=etwvzrmlxeobinrlytza&read_only=true` with no headers and no env - it is OAuth, not file-keyed, and belongs in class 2.

**Class 3 - file-keyed or no-auth. Survives an account switch outright.** `context7`, `playwright`, `serena`, `gitnexus` (all `type: stdio`, launched by command, no credential), and `dune` - which genuinely is file-keyed, carrying `x-dune-api-key` in its `headers` block in `~/.claude.json`. The brief was right about Dune.

### 8b. What was NOT determined, stated as such

**Where class 2's OAuth tokens are stored, and therefore whether an Anthropic account switch actually loses them.** The macOS keychain holds exactly two relevant service entries - `Claude Code-credentials` and `Claude Safe Storage` - and no per-MCP-server items. `~/.claude/` holds `mcp-needs-auth-cache.json` and `mcp-health-cache.json`, which are caches, not credential stores. The tokens are therefore inside one of those two opaque keychain blobs, which were not opened.

So: class 2 is definitely lost if the MACHINE is lost, and **may or may not** be lost on an account switch. Rather than guess, the checklist below treats them as at-risk and the test is two minutes of Zaal's time (Next Actions).

Note also that `mcp-needs-auth-cache.json` currently lists `claude.ai Notion` and `notion` as needing auth - so Notion is already disconnected on both surfaces, independent of any switch.

### 8c. The re-auth checklist, in priority order

Run top to bottom after any account switch. The ordering is by what blocks work soonest, not alphabetically.

| # | Surface | Why this position | How to restore |
|---|---|---|---|
| 1 | **Claude Code Remote** | Without it Zaal cannot reach any session from his phone - and per Section 4 that is the whole operator layer | Reconnect the connector on the new account; confirm the session appears on the phone |
| 2 | **Paragraph** | The publishing path. 366 editions; a newsletter cannot ship without it | Re-run the browser OAuth against `mcp.paragraph.com` |
| 3 | **supabase-cowork** | The board and the tracker read through it; `todo`/`crush`/`zao-triage` degrade without it | Re-authorize `mcp.supabase.com` for project `etwvzrmlxeobinrlytza` |
| 4 | **Gmail + Google Calendar** | Inbound and scheduling; the daily loop notices within hours | Reconnect both claude.ai connectors |
| 5 | **Slack, Linear, Notion, Dropbox, Drive** | Real but not daily-blocking | Reconnect as needed, not upfront |
| 6 | **Canva, Calendly, Descript, Expedia, TravExp** | Occasional | Reconnect on first use |
| - | context7, playwright, serena, gitnexus, dune, grep, exa | **No action** - class 3, survives | - |

**Ten minutes, in that order, and only the first four before real work resumes.** That is the deliverable the brief asked for: a cap-out becomes a procedure rather than a discovery.

## Section 9 - Vendor exit, and the one that is an emergency

The principle the brief states is the right one and worth keeping verbatim: **you are locked in wherever the ONLY COPY of state lives inside a vendor. The fix is not migration, it is a nightly export into a repo we own, so leaving stays possible even when it is not planned.**

Ranked by that test, not by spend:

| Rank | Vendor | Only copy inside? | Verdict |
|---|---|---|---|
| 1 | **Upstash / Vercel KV** | **Yes - totally** | **Emergency. See below.** |
| 2 | Paragraph | Yes for 366 editions | Alpha API, OAuth-bound. Export is real work, not yet scoped |
| 3 | Vercel / Supabase / Neynar | No - data is portable | Rentable. Moving is work, not loss |
| 4 | Anthropic | Irreplaceable | Plan around the cap (Section 8), not the exit |

### 9a. The KV emergency is bigger than the brief said - and it is already built

The brief named three key patterns (`zabal:subs:*`, `qv:tally:*`, `zabal:points:tally`). **An exhaustive grep of `~/Documents/zabalgames` across `.ts/.tsx/.mjs/.js` finds 97 distinct key patterns**, spanning submissions, profiles, points, referrals, raffles, POAP claims, clips, comments, four separate vote systems, live presence, notifications and intake. The exposure is roughly 30x what the brief described.

Two corrections to the brief's framing, both in the direction of precision:

- **The points ROSTER is already safe.** `data/points-roster.json` (version, `_schema`, season, 15 people) is committed and was last updated 2026-08-11. `api/points.mjs` reads that roster and writes `zabal:points:tally`. So the roster is in git; **the accrued tally is what lives only in KV.**
- **No script in the repo reads live KV.** Three scripts match a KV grep - `test-crons.mjs`, `test-judging.mjs`, `test-submission-pipeline.mjs` - and all three use an in-memory Upstash stand-in and never contact the service ("never contacts external services", `test-submission-pipeline.mjs:3`). The absence of an exporter is confirmed by exhaustive search, not assumed.

**And the fix already exists.** `ZAODEVZ/zabalgames` **PR #615** ("feat(backup): nightly KV export, so Season 1 survives the vendor") was opened 2026-08-11T23:52Z, adding `api/export.mjs` (+125) and `.github/workflows/kv-backup.yml` (+81). Per `code-restraint.md` rung 1 and `agent-loops.md` rule 28, **do not build a second one.**

### 9b. PR #615 is well built, and must NOT be merged as written

Read directly rather than taken from the PR body. **What is right:**

- `verifyAdmin(req, DOMAIN)` runs **before** any KV access, returning 401 (`api/export.mjs`, handler). Correct order per `api-routes.md`.
- `verifyAdmin` (`lib/auth.mjs:89-107`) tries a Farcaster Quick Auth JWT + `isAdminFid`, then falls back to a **constant-time** compare against `ADMIN_KEY` - and the fallback is guarded by `if (ADMIN_KEY)`, so an unset key does not degrade into "empty string matches". Fail-closed, correctly.
- Errors return **502, not 200-with-partial** - the exact `silent-failure-guard.md` lesson, applied without being asked.
- It SCANs the keyspace rather than enumerating prefixes, and reads each key by its actual type. Both are the right calls, and the 97-pattern count above is evidence for why.

**The blocker:**

`ZAODEVZ/zabalgames` is **`"private": false, "visibility": "public"`**. The workflow commits the **entire** export to `backups/kv-latest.json` on a public repo, nightly at 05:20 UTC. Among the 97 key patterns are:

| Key pattern | What it holds | Evidence |
|---|---|---|
| `zabal:agent:tok:${agentToken}` | **A live agent auth token, in the key NAME** | Written `api/submissions.mjs:417`; `api/agent.mjs:71` authenticates by reading `zabal:agent:tok:${tok}` |
| `zabal:notif:tokens` | Push notification tokens | `api/webhook.mjs:22` |
| `zabal:profile:nonce:${handle}` | Auth nonces | `api/profile.mjs:183` |
| `qv:ballots:*` | Per-voter private ballots | The PR body flags these itself |

**A keyspace dump to a public repo therefore publishes every live agent authentication token, permanently, in git history** - because the token IS the key name, redacting values would not help. The PR body's own privacy note says "nothing derived from this export may republish them", and the workflow it ships republishes them. That is not a criticism of the work; it is one step that was not taken, and it is irreversible once pushed.

This is `secret-hygiene.md` guard 4 and `pii-hygiene.md` rule 3, and it fires automatically the moment `ADMIN_KEY` is set - the one action the PR asks Zaal for.

**The fix is small and does not weaken the backup.** Any one of: commit to a private repo instead; encrypt the artifact before commit (age/gpg, key held by Zaal); or split the export so secret-bearing and ballot prefixes go to an encrypted or private destination while the rest stays in the public repo. The choice is Zaal's; the requirement is that **no unencrypted secret-bearing key reaches the public repo.**

## Section 10 - The two cron bugs, measured

### 10a. `zao-spend` overstates Opus by exactly 3x - not the ~10x suspected

`~/bin/zao-spend:49-53` sets rates per million as `(input, output, cache_write, cache_read)`:

```
"opus":   (15.00, 75.00, 18.75, 1.50)
"sonnet": (3.00, 15.00, 3.75, 0.30)
"haiku":  (1.00, 5.00, 1.25, 0.10)
"fable":  (3.00, 15.00, 3.75, 0.30)
```

Current published pricing: **Opus 5 is $5 / $25** per million (input/output), with cache write at 1.25x input and cache read at ~0.1x input - so $6.25 and $0.50. The table carries **Opus 4.1-era pricing** ($15/$75), which Opus 4.5 superseded.

- **Opus: every figure is exactly 3x too high** (15/5, 75/25, 18.75/6.25, 1.50/0.50 all equal 3).
- **Sonnet and Haiku are correct.**
- **Fable is wrong in the other direction** - it is priced at Sonnet rates but Fable 5 is $10/$50, so fable spend is **understated ~3.3x**.

Worked against the live one-hour window (output 364.7k, cache-write 6.4M, cache-read 143.9M), the reported **$337.48 becomes roughly $112** at correct rates. The tool's own footer prints "opus 15/75", so it states the wrong rate honestly - the fix is four numbers, and the ledger's historical rows should be treated as 3x inflated rather than deleted.

**Zaal's instinct that the number was wrong was right; the magnitude was 3x, not 10x.** The reason it feels larger is the thing `agent-spend.md` already documented: cost is dominated by cache reads, not by output tokens, so "93.8k output tokens" and "$140" are not comparable quantities and the ratio between them is not the error.

### 10b. `zao-vault-log` logs "0 shipped" every run

`~/bin/zao-vault-log:105` prints `logged $n shipped items` and line 112 commits `log: $DAY ($n shipped)`. The vault's last three commits are `log: 2026-08-11 (0 shipped)`, `log: 2026-08-10 (0 shipped)`, `log: 2026-08-09 (0 shipped)` - while 2026-08-11 alone shipped the PRs listed in this doc. The detector is broken, not the day.

Per `noisy-signal-guard.md`, a signal that always reads zero is a signal nobody will ever read, and it has now been wrong for at least three consecutive days. Either fix the detector or delete the cron - a third state, where it keeps running and keeps lying, is the one option that is not acceptable.

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
| **DO NOT set `ADMIN_KEY` on zabalgames until PR #615's destination is changed** - a public repo cannot receive `zabal:agent:tok:*`; done when the workflow writes somewhere private or encrypted | @Zaal | **Blocker** | 2026-08-12 |
| Choose the KV backup destination (private repo / encrypted artifact / split export), then set `ADMIN_KEY`; done when `backups/kv-latest.json` exists with no unencrypted agent token in it | @Zaal | Decision + secret | 2026-08-13 |
| Rotate any `zabal:agent:tok:*` issued before the backup lands, if the export ever ran against the public repo; done when old tokens 401 | @Zaal | Security | 2026-08-13 |
| Fix the `opus` row in `~/bin/zao-spend` to 5.00/25.00/6.25/0.50 and `fable` to 10.00/50.00/12.50/1.00; done when a 1h run reports roughly a third of today's figure | @Zaal | PR (dotfiles) | 2026-08-12 |
| Fix or delete `zao-vault-log`'s shipped detector; done when a run reports a non-zero count on a day with merged PRs, or the cron is gone | @Zaal | PR (dotfiles) | 2026-08-14 |
| Test whether a Claude account switch drops class-2 vendor OAuth (Paragraph / supabase-cowork); done when the answer is written into Section 8b | @Zaal | 2-minute test | 2026-08-15 |
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

Added for Sections 8-10 (all run 2026-08-11):

- `~/.claude.json` - `claudeAiMcpEverConnected` (13 entries), global + project `mcpServers` with per-server `type`/`url`/`env`/`headers` [FULL] - the OAuth-vs-key classification
- `~/.claude/plugins/**/.mcp.json` [FULL] - the plugin-provided servers (exa, github, memory, sequential-thinking)
- `security dump-keychain` service names + `ls ~/.claude/` [FULL] - only `Claude Code-credentials` / `Claude Safe Storage`; no per-MCP items, hence the stated unknown in 8b
- Exhaustive grep of `~/Documents/zabalgames` for `(zabal|qv):` key patterns across `.ts/.tsx/.mjs/.js` [FULL] - 97 distinct patterns
- `data/points-roster.json` shape + `api/points.mjs` [FULL] - roster in git, tally in KV
- `scripts/test-crons.mjs`, `test-judging.mjs`, `test-submission-pipeline.mjs` headers [FULL] - all three mock KV; no exporter exists
- `gh api repos/ZAODEVZ/zabalgames` [FULL] - `"private": false, "visibility": "public"`
- PR #615: metadata, file list, body, and the **source** of `api/export.mjs` + `.github/workflows/kv-backup.yml` on `ws/kv-backup`, plus `lib/auth.mjs:89-107` on main [FULL] - the auth guard and the destination were read, not taken from the PR description
- `api/submissions.mjs:417`, `api/agent.mjs:71`, `api/webhook.mjs:22`, `api/profile.mjs:183` [FULL] - the token-in-key-name evidence
- `~/bin/zao-spend:49-53` rate table + a live `--hours 1` run [FULL]
- `~/bin/zao-vault-log:105,112` + `git -C ~/zao-vault log -3` [FULL]
- Anthropic published model pricing via the bundled `claude-api` skill [FULL] - Opus 5 $5/$25, Fable 5 $10/$50, Sonnet 5 $3/$15, Haiku 4.5 $1/$5; cache write 1.25x input, cache read ~0.1x input. Consulted rather than recalled, because the whole 10a finding turns on it.

External:

- [pingdotgg/t3code](https://github.com/pingdotgg/t3code) [FULL] - repo metadata, README, `docs/user/remote-access.md`, `docs/user/background-service.md`, `docs/user/providers-claude.md`, issues and releases APIs, all read 2026-08-11
- [T3 Code on the App Store](https://apps.apple.com/us/app/t3-code-remote-claude-more/id6787819824) [PARTIAL - store listing and review excerpts via search, the review pages themselves were not fetched]
- [t3.codes](https://t3.codes/) [PARTIAL - surfaced in search, not fetched; the GitHub docs were used instead as the primary]
- HackerNews via Algolia API, queries "t3 code remote agent" and "tailscale remote dev machine" [FAILED for the topic - **zero stories** on T3 Code, and the tailscale query returned only 1-30 point items with 0 comments. There is no HN discussion of this tool to cite. Stated rather than substituted.]
- Reddit via `~/bin/zao-fetch-reddit.sh` [FAILED - the script takes a post URL and cannot parse a `search/?q=` URL ("could not extract post id"); the `.json` search route returned HTTP 429. Escalation was not pursued further because the GitHub source is primary here and stronger than any thread would have been. Noting it rather than filling the gap with a search snippet.]
- [Knightli, T3 Code Windows tutorial](https://knightli.com/en/2026/07/29/t3-code-windows-remote-control-codex-claude-code/) [PARTIAL - title and framing from search results only, not fetched]

**Community-source coverage is thinner than DEEP tier normally requires, and that is a finding rather than a shortfall in effort.** T3 Code has 18,270 stars and no HackerNews thread; Reddit was rate-limited. The primary source here is the machine estate itself, where 15 of 15 measurements are FULL and were run directly against the boxes in question.
