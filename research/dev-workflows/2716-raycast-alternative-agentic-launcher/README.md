---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-24
superseded-by:
related-docs: "dev-workflows/803-local-ai-assistant-stack-raycast-ollama-siri, infrastructure/2715-desktop-offload-always-on-lanes"
original-query: "i just delted raycast and dropbox from my computer, can we find a raycast alternitive for my laptop to make it more agenetic" (Zaal, 2026-10-24, relayed by the messenger)
tier: QUICK
---

# 2716 - A Raycast replacement that lanes can extend: Sol, with commands kept in dotfiles

> **Goal:** Pick one open-source launcher for the MacBook that replaces Raycast and can run ZAO's own `~/bin` tools, with three starter commands, and flag anything that still depends on Dropbox.

## Key Decisions

| # | Recommendation | Why |
|---|---|---|
| 1 | **USE Sol** (`ospfranco/sol`). | MIT (read from its LICENSE file), last push 2026-10-21, "runs natively", installs with `brew install --cask sol`. One tool covers the Raycast features in use: app search, a clipboard manager, window management and a Script Runner. |
| 2 | **Keep the commands as shell files in zaal-dotfiles, so lanes add new ones by PR.** | Sol's source (`src/stores/scripts.store.tsx`) loads `.sh` and `.applescript` files from `~/.config/sol/scripts`, watches that folder, reads `# name:` and `# icon:` header lines, and runs `.sh` files through `executeBashScript`. A git-tracked folder symlinked there is what makes it "agentic": an agent writes a script, Zaal gets a new command. |
| 3 | **SKIP Leader Key, Kunkun and Script Kit as the main launcher.** | Leader Key's README opens: "Leader Key has been surpassed by Tuna", the author's focus is on Tuna, and it has no app search or clipboard. Kunkun is GPL-3.0 and its README warns "Work in Progress... still in its early stages". Script Kit's repo (`johnlindquist/kit`) was last pushed 2025-12-05. |
| 4 | **Hammerspoon is the add-on if a command ever needs more than a script** (hotkeys, Lua automation). | MIT, 16,324 stars, pushed 2026-07-08; "a bridge between the operating system and a Lua scripting engine". It is not a launcher with app search, so it is not the Raycast replacement. |
| 5 | **Dropbox: nothing breaks.** Fix two stale mentions. | No tool, skill or code path depends on a Dropbox folder (grep below). `~/Dropbox` has already been missing since 2026-10-11. |

## Comparison

| Candidate | Licence (LICENSE file) | Last push | Local, no key | Runs our `~/bin` tools | LLM or agent mode | Footprint |
|---|---|---|---|---|---|---|
| **Sol** | MIT | 2026-10-21 | yes | yes, `.sh` Script Runner | none built in; a script can call `claude -p` | native app; RSS not measured (not installed) |
| Hammerspoon | MIT | 2026-07-08 | yes | yes, via Lua | none built in | not measured |
| Leader Key | MIT | 2026-03-02 | yes | yes ("Command action"; README warns PATH must be exported) | none | native Swift; not measured |
| Kunkun | GPL-3.0 | 2026-02-10 | yes | extensions | not checked | not measured |
| Script Kit | MIT | 2025-12-05 | yes | yes (TypeScript scripts) | not checked | not measured |
| Alfred (Powerpack) | proprietary, paid | n/a | yes | yes | not checked | not checked (no fetch this run) |
| Spotlight and Shortcuts | built in | n/a | yes | Shortcuts can run shell scripts (not fetched this run, UNVERIFIED) | not checked | already loaded |

No candidate ships an MCP server or an agent mode in its README. The agent part comes from the scripts it runs. Footprints are UNVERIFIED because nothing was installed; after install, read Sol's resident size with `ps -axo rss,comm | grep -i sol`.

## Setup (Zaal's taps marked ZAAL, about 5 minutes)

1. ZAAL: `brew install --cask sol`, open Sol, and give it the permissions it asks for. Set its hotkey to Cmd+Space, after freeing that key from Spotlight in System Settings.
2. Agent, after Zaal's go: add the folder `sol/scripts/` to zaal-dotfiles by PR, with the three scripts below. Then ZAAL runs `ln -s ~/zaal-dotfiles/sol/scripts ~/.config/sol/scripts`.
3. Each script starts with `export PATH="$HOME/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"`, because a launcher's shell is non-interactive (the same warning is in Leader Key's README).

### The three starter commands

```bash
#!/bin/bash
# name: Open a lane
export PATH="$HOME/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
name=$(osascript -e 'text returned of (display dialog "Lane name" default answer "")') || exit 0
[ -n "$name" ] && zorca-lane-open "$name"
```

```bash
#!/bin/bash
# name: Estate page
export PATH="$HOME/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
zao-agent-map --open
```

```bash
#!/bin/bash
# name: Merge line for a PR
export PATH="$HOME/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
repo=$(osascript -e 'text returned of (display dialog "owner/repo" default answer "bettercallzaal/ZAOOS")') || exit 0
pr=$(osascript -e 'text returned of (display dialog "PR number" default answer "")') || exit 0
zao-merge "$repo" "$pr" --print-command | pbcopy
```

Sol also reads an optional `# icon:` line (`scripts.store.tsx`); these scripts leave it out and take its default.

Two of the three depend on things that are not ready yet:
- `zao-agent-map` is not on this Mac's PATH and not on zaal-dotfiles main. It exists only in open PR zaal-dotfiles #747.
- `~/zaal-dotfiles` (the live tree) is 61 commits behind its origin/main (doc 2715).

`zorca-lane-open` (usage: `name [directory]`) and `zao-merge` (`--print-command` takes a repo and a number) are on PATH today.

## Dropbox: what still mentions it

Searched with `git grep -i dropbox` on origin/main of zaal-dotfiles (`bin`, `claude/skills`), zao-vault (excluding `archive/`) and ZAOOS (`src`, `bot`, `scripts`, `.github`, `.claude`), plus a path search for `~/Dropbox`, `/Dropbox/` and `CloudStorage/Dropbox`. Control: "raycast" in the same dotfiles scope found the clipboard skill.

- **No dependency:** 0 hits in dotfiles `bin` or skills. The only path hits are two vault notes recording that `~/Dropbox` is gone (`notes/mac-audit-2026-10-22.md`, `handoffs/status/mac-organizing.md`). 25 vault files and 17 ZAOOS research docs mention Dropbox as history.
- **Stale 1:** `bot/src/zoe/concierge.ts:402` lists `mcp__claude_ai_Dropbox`. That is the claude.ai Dropbox connector, a cloud connector, so it works without the desktop app for as long as the Dropbox account exists. Keep it, or remove it if the account is closed (Zaal's fact).
- **Stale 2, Raycast:** zaal-dotfiles `claude/skills/clipboard/SKILL.md:29` points "Something copied earlier today" at "Raycast Clipboard History". Repoint it to Sol's clipboard manager in the same PR as step 2.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Install Sol and set the hotkey (setup step 1); shipped when Sol opens on the hotkey | Zaal | Install | 2026-10-31 |
| PR adding `sol/scripts/` with the 3 scripts to zaal-dotfiles, and repointing the clipboard skill; shipped when merged | dotfiles lane | PR | 2026-10-31 |
| Say whether the Dropbox account is kept; if closed, a PR drops the connector from `concierge.ts:402` | Zaal | Decision | 2026-11-07 |

## Sources

Method: the `gh api` contents and README endpoints, with base64 decoded and LICENSE files read as text (not the API's licence field). Fetched 2026-10-24.

- [FULL] Sol README and LICENSE: https://github.com/ospfranco/sol
- [FULL] Sol script store source: https://github.com/ospfranco/sol/blob/main/src/stores/scripts.store.tsx
- [FULL] Leader Key README and LICENSE: https://github.com/mikker/LeaderKey
- [FULL] Hammerspoon README and LICENSE: https://github.com/Hammerspoon/hammerspoon
- [FULL] Kunkun README and LICENSE: https://github.com/kunkunsh/kunkun
- [FULL] Script Kit README and LICENSE: https://github.com/johnlindquist/kit
- [NOT FETCHED] Alfred and Apple Shortcuts pages. Their rows carry no fetched claims beyond "paid" and "built in".
- Community: the GitHub repos' own discussion links only. No Reddit (IP block) or HN fetch was made for this QUICK doc.
- Local: `command -v` for the three tools, `--help` output, and the `git grep` searches above.
