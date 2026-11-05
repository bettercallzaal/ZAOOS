---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-10-24
superseded-by:
related-docs: "infrastructure/2264-mac-offline-always-on-migration, infrastructure/2284-oracle-always-free-vps-capacity, infrastructure/2291-infra-capability-audit, agents/2444-always-on-orchestrator, dev-workflows/879-tmux-mosh-pi-remote-workflow"
original-query: "i just wanna build somehihntg where i can offload all this work to my desktop too much is happening here and if this comuter needs to travel with me nothing happens while its off lets resaerch that too" (Zaal, 2026-10-24, vault notes/zaal-ideas-2026-10-24.md; scoped by the seat to compare the Windows desktop, cloud sessions, a VPS and a hybrid)
tier: DEEP
---

# 2715 - Offloading the lanes to an always-on machine: the desktop as the lane host, the Mac as a window

> **Goal:** Pick where ZAO's Claude Code lanes run so that work continues while the MacBook travels or is closed, and the Mac stops thrashing. Give a migration plan with Zaal's own steps marked.

This doc extends [doc 2264](../2264-mac-offline-always-on-migration/) (11 Aug), whose decision 2 put the always-on lane host on the VPS "not the Windows desktop", because the desktop then had no shell. It also builds on the vault's 9 Sep agentic infrastructure spec and its decision that agents on the PC live in WSL2. What changed since 2264 is listed in section 2.

## Key Decisions

| # | Recommendation | Why (measured or fetched this run) |
|---|---|---|
| 1 | **USE the hybrid, option (d): the Windows desktop runs the lanes in WSL2 as a Remote Orca Server, and the Mac and phone become clients.** | Orca's docs describe exactly this: "A Remote Orca Server lets one computer do the work while another computer provides the UI", connected through Tailscale, and "agents keep running when the client laptop sleeps or disconnects". The desktop is already on the tailnet and answered `tailscale ping` in 3 ms today. |
| 2 | **Keep the VPS for the bots. Do not move lanes there.** | The VPS is a 2-core box with 7 GB RAM (doc 2291, measured 2026-08-16), already busy with ZOE and the bots. It is also not on the tailnet today: `tailscale status` lists the Mac, the Pi, the desktop and the phone, but not `srv1537940`. This reverses doc 2264 decision 2. That decision chose the VPS because the desktop had no shell, which is still true (below), but the desktop has 6 cores and 16 GB, and Orca now documents the server path. |
| 3 | **Use cloud sessions only for GitHub-only overflow, never as the lane host.** | Cloud sessions keep running after the laptop closes, but each one starts with "just the pre-installed tools", reaches GitHub through a proxy, and gets keys only as environment variables or network secrets. They cannot see the vault clone, `~/bin`, `~/.zao/private`, or the Mac's MCP servers. The always-on-machine option for Pro and Max is Remote Control, in Anthropic's own words (section 3). |
| 4 | **Put the second CI runner on the desktop for the PRIVATE repos only (zao-vault, zaal-dotfiles), never ZAOOS.** | GitHub: "self-hosted runners should almost never be used for public repositories on GitHub, because any user can open pull requests against the repository and compromise the environment." ZAOOS is public (`private=false`); the vault and dotfiles are private. Today both runners are on the Mac (`MacBook-Air-5-zao-vault`, `MacBook-Air-5-zaal-dotfiles`), so they stop when it does. |
| 5 | **The desktop cannot take today's whole load. Cut sessions and per-session MCPs first, then move about half.** | The Mac has 24 GB and is out of room: load averages 108.82 / 121.28 / 92.30, swap 23.2 of 24 GB used, 30 `claude` processes and about 280 MCP-type processes (measured 2026-10-24, section 1). The desktop has 16 GB, and WSL2 gets 50% of Windows memory by default. Moving 30 sessions as they are would thrash the desktop instead. |
| 6 | **The bring-up is Zaal's (install, settings, sign-in). Agents write the runbook and verify each step from the Mac.** | Installing software, changing power settings and signing in are his. The desktop has no shell an agent can reach today: ports 22, 2222 and 3389 are closed (TCP probe over the tailnet, 2026-10-24). |

## 1. Measured state (2026-10-24, from this Mac)

| What | Value | How |
|---|---|---|
| Mac load | 108.82 / 121.28 / 92.30 (1, 5, 15 min) | `uptime` |
| Mac memory | 24 GB RAM; swap 23,158 MB used of 24,576 MB | `sysctl hw.memsize`, `sysctl vm.swapusage` |
| Lanes | 30 `claude` processes, 6.38 GB resident | `ps -axo rss,command`, grouped |
| MCP and helper processes | serena 56, context7 44, playwright 42, other MCP 138, Orca 63 | the same `ps` grouping. Resident sizes undercount, because much of it is swapped out |
| Tailnet | Mac, Pi `ansuz`, desktop `desktop-h2ov6da`, iPhone online; ZAO VPS absent | `tailscale status --json` |
| Desktop shell | ping 3 ms; TCP 22, 2222, 3389 closed | `tailscale ping`, `nc -z` |
| Desktop hardware | Ryzen 5 3600 (6 cores, 12 threads), 16 GB, GTX 1660, Windows 10 Pro 22H2, 948 Mbps up | vault `handoffs/baraza-desktop-specs.md`, measured on the box 2026-08-20 |
| CI runners | 2 registered, both macOS on the MacBook | `gh api repos/.../actions/runners` |

About 9 MCP-type processes per lane (280 / 30) is the number to cut. That each session starts its own copies is an inference from these counts (56 serena processes for 30 sessions), not a documented fact.

## 2. What changed since doc 2264

- Orca documents a remote server path, with a mobile companion that "lists worktrees from every host you're connected to (local desktops and remote Orca servers) in a single view".
- Secrets have one home that already works on Linux: `zao-secrets` (macOS Keychain) was retired on 2026-09-16, and `zao-env` with `~/.zao/private/*.env` is the mechanism (dotfiles `bin/zao-secrets` header).
- The vault decided on 2026-09-09 that agents on the PC live in WSL2 Ubuntu, never native Windows, with vault and dotfiles cloned inside WSL.
- Unchanged: the desktop still has no shell, and the VPS is still off the tailnet.

## 3. The four options

| | (a) Desktop alone | (b) Cloud sessions | (c) A VPS | (d) Hybrid (recommended) |
|---|---|---|---|---|
| Runs while the Mac travels | Yes, if it does not sleep | Yes | Yes | Yes |
| Vault, `~/bin`, `~/.zao/private` | Yes, cloned in WSL2 | No; one repo per session from GitHub, keys as env vars or network secrets | Yes | Yes, on the desktop |
| MCP servers | Yes (installed on the server) | Only what an environment sets up | Yes | Yes |
| RAM for lanes | 16 GB (WSL2 default 50%) | Anthropic's VM | ZAO VPS 7 GB, 2 cores | 16 GB desktop plus the Mac when open |
| Cost | Electricity only (UNVERIFIED, not measured) | "no separate charge for the cloud VM"; counts toward plan limits | Hetzner shared from EUR 5.99/mo, dedicated from EUR 43.49/mo (excl. VAT) | Electricity; Tailscale Personal is $0 |
| Breaks | Mac-only tools (section 5) | Nearly every ZAO tool | Mac-only tools; another box to patch | Mac-only tools, which stay on the Mac |

Two lines from Anthropic settle (b) for ZAO. Self-hosted cloud environments "are in public beta on Team and Enterprise plans". And: "If you want to run Claude Code on your own always-on machine and drive it from other devices, use Remote Control, which is also available on Pro and Max plans." Remote Control "connects claude.ai/code or the Claude app for iOS and Android to a Claude Code session running on your machine", and "your computer has to stay on and the claude process has to keep running".

## 4. How each thing moves over

- **Lanes:** the Orca server runs inside WSL2. `orca serve service install` "writes a LaunchAgent on macOS or a systemd user unit on Linux", the service commands "are not available on Windows yet", and "On Linux the service stops at logout unless lingering is on (`loginctl enable-linger`)". systemd is the default for Ubuntu installed with `wsl --install` (Microsoft).
- **Agent accounts:** "On a headless orca serve host, register managed Claude/Codex accounts from the server shell: `orca account add --agent claude`". Install and authenticate Claude Code on the server, not the client (Orca remote docs). Install it in WSL with the Linux installer (Claude Code setup docs).
- **Vault and dotfiles:** `git clone` inside WSL2, then the dotfiles bootstrap, as the 9 Sep spec says. The desktop gets its own clones, never a shared folder. One writer per working tree (`.claude/rules/worktree-handoff.md`).
- **Secrets:** Zaal enters each one with `/secret` into `~/.zao/private/` on the desktop. Values never move by copy, chat or a tool.
- **Git identity:** `git config --global user.email zaalp99@gmail.com` and the name `Zaal Panthaki` in WSL (`workflow-discipline.md` rule 4). `gh auth login` is Zaal's.
- **MCP servers:** configured per machine; install on the server.
- **Remote access:** Tailscale SSH's server side runs "only" on Linux and macOS, not Windows, so SSH targets the WSL2 side. Orca's SSH worktrees say "Disconnects don't kill running agents; Orca reconnects and re-attaches".
- **Phone:** Orca mobile (pairing code, Relay or LAN) and Remote Control both work. The Orca docs say "Closing the desktop app drops a direct/LAN session until you reopen it", so phone pairing should point at the server, not at the Mac's app.

## 5. What breaks, and stays on the Mac

Counted in zaal-dotfiles `bin` on origin/main:
- `osascript` in 9 files: `zao-focus-terminal.sh`, `zao-notify.sh`, `zao-lane-watch`, `zao-tui`, `zao-mirror-reconcile`, `zao-fare-watch` and others.
- `launchctl` in 7 files, including `zao-runner-setup`, `zao-session-snapshot` and `zao-openrouter-preflight`.
- `brew` in 3 files.

These need Linux counterparts (`notify-send`, systemd timers) or stay Mac-only.

The Claude in Chrome extension drives the browser on the machine it runs in, so browser lanes stay on the Mac (UNVERIFIED on Windows Chrome). The Messages app and iMessage are macOS-only, so anything that reads them stays on the Mac. `zao-runner-setup` installs a LaunchAgent, so it needs a Linux mode (GitHub: "For Linux and macOS, you can install a service after you finish adding the runner").

## 6. Risks

- **WSL2 stops on its own.** Microsoft: the subsystem stops "about 8 seconds after closing ALL instances of the distribution shell", and `vmIdleTimeout` defaults to 60000 ms. A systemd service inside WSL2 may still stop when nothing on the Windows side holds the distribution open. How to keep it alive at Windows boot is UNVERIFIED here. It must be measured in bring-up step 6, not assumed.
- **Sleep.** Orca: "the server must stay awake and connected to the tailnet". `powercfg /change standby-timeout-ac` sets the sleep timeout "in minutes"; whether 0 reads as Never must be checked with `powercfg /query`.
- **Windows 10 end of support:** recorded in the vault spec ("Windows 10 left mainstream support in October 2025"), not re-fetched here.
- **Gaming and streaming share the box.** The 9 Sep spec's `zao-gaming` mode parks heavy jobs. The WSL2 memory cap is static and changing it needs `wsl --shutdown`.
- **Remote Orca Servers are beta** (Orca docs).

## 7. Migration plan (ZAAL = a step only Zaal can do)

| # | Step | Who | Done when |
|---|---|---|---|
| 1 | On the Mac: cut per-session MCPs (serena, context7, playwright load only where used) and cap open lanes | seat + dotfiles lane, PR | MCP process count per lane falls, read with the same `ps` grouping |
| 2 | Set Windows to never sleep on AC power, and confirm with `powercfg /query` | ZAAL | the query shows standby AC = never |
| 3 | Enable WSL2 and install Ubuntu (`wsl --install`); set the `.wslconfig` memory cap (the spec sets it once) | ZAAL | `wsl --version` works and `free -g` inside shows the cap |
| 4 | Inside WSL2: install Claude Code (Linux installer), `gh auth login`, git identity, clone vault and dotfiles, run the bootstrap; enter secrets with `/secret` | ZAAL for sign-ins and secrets, agent for the rest once a shell exists | `claude --version`, `gh auth status`, `zao-env` lists the names |
| 5 | Install Tailscale inside WSL2 (or reach it through the Windows node), open SSH to the WSL2 side, and test from the Mac | ZAAL for install and sign-in | the Mac's `nc -z` to port 22 succeeds |
| 6 | `orca serve service install --port 6768`, then `loginctl enable-linger`; reboot Windows and confirm the server comes back with no shell open | ZAAL to run it, agent to verify | after a reboot, the Mac's Orca shows the server and `tmux ls` survives a closed shell |
| 7 | Pair the Mac's Orca and Orca mobile to the server; open 2 or 3 lanes there first | ZAAL (pairing code) | lanes listed in the mobile app from both hosts |
| 8 | Runner: register a Linux runner on the desktop for zao-vault and zaal-dotfiles only, as a separate low-permission user, with a `zao-desktop` label | ZAAL for the registration token; dotfiles lane extends `zao-runner-setup` with a Linux mode | `gh api .../actions/runners` lists it online; one workflow run green |
| 9 | Move lanes over in batches, watching `free -g` and load on the desktop | seat | the Mac's swap stays under half, and lanes run with the lid closed |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Steps 2 to 7 of the migration plan; shipped when the Mac's Orca lists the desktop as a server after a Windows reboot | Zaal | Desktop setup | 2026-11-07 |
| PR cutting per-session MCP servers (step 1); shipped when the merged change shows fewer MCP processes per lane in `ps` | dotfiles lane | PR | 2026-10-31 |
| PR adding a Linux/systemd mode to `zao-runner-setup` (step 8); shipped when merged with a test | dotfiles lane | PR | 2026-11-07 |
| Measure WSL2 keep-alive after reboot (risk 1) and append the result to this doc; shipped when this doc carries the measured answer | dreamnet-research or whichever lane holds the desktop | Doc update | 2026-11-10 |

## Sources

Method: `curl` or `urllib`, HTML stripped, and sentences quoted from the saved text, not WebFetch summaries. All fetched 2026-10-24.

- [FULL] Orca README: https://raw.githubusercontent.com/stablyai/orca/main/README.md (MIT, per its License section)
- [FULL] Orca Remote Orca Servers: https://www.onorca.dev/docs/remote-servers
- [FULL] Orca SSH worktrees: https://www.onorca.dev/docs/ssh
- [FULL] Orca mobile companion: https://www.onorca.dev/docs/mobile
- [FULL] Claude Code setup: https://docs.claude.com/en/docs/claude-code/setup
- [FULL] Claude Code Remote Control: https://docs.claude.com/en/docs/claude-code/remote-control
- [FULL] Claude Code in the cloud: https://docs.claude.com/en/docs/claude-code/claude-code-on-the-web
- [FULL] Configure cloud environments: https://docs.claude.com/en/docs/claude-code/cloud-environments
- [FULL] Self-hosted environments: https://code.claude.com/docs/en/self-hosted-environments
- [FAILED - 404] https://code.claude.com/docs/en/self-hosted-runners (a guessed path; the environments page above covers it)
- [FULL] WSL advanced settings: https://learn.microsoft.com/en-us/windows/wsl/wsl-config
- [FULL] WSL systemd: https://learn.microsoft.com/en-us/windows/wsl/systemd
- [FULL] powercfg options: https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options
- [FULL] GitHub self-hosted runners: https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners
- [FULL] Adding self-hosted runners: https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners
- [FULL] Secure use reference (self-hosted runner hardening): https://docs.github.com/en/actions/reference/security/secure-use
- [FULL] Tailscale pricing (Personal $0, up to 6 users): https://tailscale.com/pricing
- [FULL] Tailscale SSH: https://tailscale.com/kb/1193/tailscale-ssh
- [FULL] Hetzner Cloud prices: https://www.hetzner.com/cloud
- [FULL] Community, Hacker News, "Claude Code Remote Control" (544 points, 2026-02-25), via the Algolia items API: https://news.ycombinator.com/item?id=47148454. Recurring comment: Tailscale plus tmux plus SSH is the dependable baseline; one early user called Remote Control "an extremely clunky and buggy prerelease" (February 2026, may be dated).
- [FULL] Community, Hacker News search "claude code wsl" (867 hits; top story about pasting images in WSL): https://hn.algolia.com/api/v1/search?query=claude%20code%20wsl&tags=story
- [FAILED - HTTP 403] Reddit search (the known IP block)
- Local, measured 2026-10-24: `uptime`, `sysctl`, `ps`, `tailscale status --json`, `tailscale ping`, `nc -z`, `gh api` runners and repo visibility, `git grep` on zaal-dotfiles origin/main.
- ZAO: doc 2264 (decisions 1 and 2), doc 2291 (VPS 2 cores and 7 GB), vault spec `projects/agentic-infrastructure-spec-2026-09-09.md`, vault decision `decisions/agentic-infrastructure-agents-live-in-wsl2.md`.
