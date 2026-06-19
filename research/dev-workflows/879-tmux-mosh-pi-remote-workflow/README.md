---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-18
superseded-by:
related-docs: "528, 165, 459"
original-query: "cheat sheet for the tmux + mosh + Pi remote workflow so I can understand how to best use it - SSH into ansuz from the Mac or Blink and never lose Claude Code context on disconnect"
tier: STANDARD
---

# 879 - tmux + mosh + Pi: Never Lose Your Remote Claude Session

> **Goal:** A paste-ready cheat sheet for working on the Raspberry Pi (`ansuz`) from the Mac or from Blink (iOS), so Claude Code and any long task survive disconnects, sleep, signal drops, and closing the app.

## TL;DR

Two tools, two jobs. **tmux** runs on the Pi and keeps your shells/Claude/builds alive after you disconnect; **mosh** is an ssh replacement that rides out WiFi/cellular drops and phone sleep. Use them together. The one command to memorize is `tmux new -A -s main` (attach if it exists, else create). From the Mac: `ssh -t zaal@ansuz 'tmux new -A -s main'`. From Blink: `mosh ansuz -- tmux new -A -s main`. Detach with `Ctrl-b d`, walk away, reconnect later, run the same command, and you are back exactly where you left off with Claude still running. tmux survives everything except the Pi rebooting.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Always run remote work inside `tmux new -A -s main`** | `-A` makes one command create-or-attach, so you never lose state on disconnect and never have to check whether the session exists. |
| 2 | **Use mosh (not plain ssh) from Blink / mobile** | Plain ssh freezes and drops when the connection blips. mosh resumes instantly across IP changes, sleep, and dead zones. Pairs with tmux for full resilience. |
| 3 | **tmux is the persistence layer; mosh is the transport layer** | Disconnecting (close Blink, shut lid, lose signal) leaves tmux running on the Pi. Only a Pi reboot kills it. mosh just keeps the pipe healthy while you are connected. |
| 4 | **Scroll with the mouse wheel or `Ctrl-b [`** | Over mosh there is no terminal-native scrollback. The Pi `~/.tmux.conf` has `mouse on` + 50k history, so the wheel works; otherwise enter copy mode. |
| 5 | **Bake tmux into `/pi` for disconnect-proof Claude** | The `/pi` skill can launch Claude inside `tmux new -A -s pi` so a laptop disconnect never kills the run - reconnect from Mac or Blink and rejoin the same live Claude. |

## Environment (this setup)

- Pi host: `ansuz`, user `zaal`, on Tailscale at `100.117.191.11`
- Claude on Pi: `/home/zaal/.local/bin/claude`
- Installed: tmux 3.3a, mosh-server, tuned `~/.tmux.conf` (mouse on, 50k scrollback, vim pane nav, vi copy mode)
- tmux prefix: **`Ctrl-b`** (default; a `Ctrl-a` second prefix is available but commented out in the config)

## The one command to remember

```
tmux new -A -s main
```

`-A` = attach if a session named `main` exists, otherwise create it. Same command every time, first connect or tenth.

## Connect

From the Mac:

```
ssh -t zaal@ansuz 'tmux new -A -s main'
```

From Blink (iOS) - the mobile-resilient path:

```
mosh ansuz -- tmux new -A -s main
```

Blink one-time setup: Tailscale app ON on the phone, then `Settings > Hosts > +`:
- Host: `ansuz`
- HostName: `ansuz` (or `100.117.191.11` if the name does not resolve)
- User: `zaal`, plus your key

## Detach vs disconnect

- **Detach on purpose:** `Ctrl-b` then `d`. Everything keeps running on the Pi.
- **Just disconnect:** close Blink / shut the lid / lose signal - same effect, tmux keeps running.
- **Reattach:** run the connect command again, or `tmux a` for the last session.

## Run Claude so it never dies

```
ssh -t zaal@ansuz 'tmux new -A -s main'   # or the mosh line from Blink
# inside tmux:
claude
```

Start a task on the Mac, `Ctrl-b d`, then reattach from Blink later and the same Claude is still going.

## Cheat sheet (matches the Pi's tmux.conf)

Prefix is `Ctrl-b`: press and release it, then the key.

```
tmux ls                 list sessions (from a plain shell)
tmux a                  attach to last session
tmux a -t main          attach to a named session
tmux kill-session -t X  end a session you no longer need

Ctrl-b d                detach (work keeps running)
Ctrl-b c                new window (tab)
Ctrl-b 1..9             jump to window N
Ctrl-b ,                rename window
Ctrl-b |                split left/right     (custom bind)
Ctrl-b -                split top/bottom     (custom bind)
Ctrl-b h/j/k/l          move between panes   (vim style, custom bind)
Ctrl-b z                zoom/unzoom current pane
Ctrl-b [                copy/scroll mode; v select, y copy, q quit (vi keys)
mouse wheel             scroll directly (mouse is on)
Ctrl-b r                reload ~/.tmux.conf  (custom bind)
```

## Gotchas

- tmux survives disconnects and even ending Claude Code locally, but **NOT a Pi reboot**. After a reboot, sessions are gone - start fresh.
- mosh needs UDP (ports 60000-61000). Over Tailscale this just works; on a locked-down network where UDP is blocked, fall back to `ssh -t zaal@ansuz 'tmux new -A -s main'`.
- MagicDNS: if `ansuz` does not resolve in Blink, use the Tailscale IP `100.117.191.11`.
- One session, many devices: you can attach to `main` from the Mac and Blink at once - both see the same screen (mirrored). Use separate session names (`-s mac`, `-s phone`) if you want independent views.

## Sources

- Local environment inspection of `ansuz` (tmux 3.3a, mosh-server, `~/.tmux.conf`), 2026-06-18.
- Related: doc 528 (Pi dev coding agent), doc 165 (Claude Code multi-session management), doc 459 (parallel workspace isolation).
