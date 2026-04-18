# 430 - Portal Stack Improvements + Prioritized Build Order

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** What's shipped in the agent portal (doc 428 stack) + what to build and test next, prioritized. Companion to doc 428 (infra) and doc 429 (Claude Code skills).

---

## Key Decisions / Recommendations

Priority tiers for the 10 improvement tracks, ordered by ship-next:

| # | Track | Ship | Test plan | Why |
|---|-------|------|-----------|-----|
| 1 | Telegram `/done N` reply parsing | **SHIP NOW (S)** | Send `/done 1` to @zaoclaw_bot, refresh checklist UI, confirm test 1 flipped to DONE. | User already getting 15-min nudges. Replying in the same chat to mark complete = zero-friction loop. Reuses `zoe-bot/bot.mjs`. |
| 2 | Session-start pattern for claude.zaoos.com | **SHIP NEXT (S)** | Reload claude.zaoos.com, verify session opens on `ws/` branch not main, CLAUDE.md contents pre-loaded, tmux title shows branch. | VPS Claude started on `main` earlier today (doc 429 commit). `/worksession` must be forced at boot. |
| 3 | Cloudflare Access replacing `qwerty1` | **SHIP THIS WEEK (M)** | Hit any `*.zaoos.com` -> CF login via Google OAuth -> 24h cookie. Confirm Caddy basic_auth removed. | `qwerty1` = full shell if leaked. CF Access free tier (50 users), 1-time setup in dashboard. |
| 4 | AO quick-spawn v2 (multi-project, polling, errors) | **SHIP THIS WEEK (M)** | Pick `ZAOOS`, `BetterCallZaal`, `COC-Concertz` from dropdown. Submit. Poll `/spawn-status?id=...` every 3s. Surface stderr when `ao spawn` fails. | Portal form v1 only supports ZAOOS + fires-and-forgets. Real phone UX needs status. |
| 5 | Portal as PWA: shortcuts + share target | **SHIP THIS WEEK (S)** | iOS home screen -> long-press -> shortcuts [Spawn, Checklist, Claude, AO]. Share a URL from Safari -> picks ZAO portal -> creates spawn task with URL. | Manifest exists (doc 428). Add `shortcuts`, `share_target`, `icons[]` PNGs at 192+512. |
| 6 | Mobile keyboard toolbar for ttyd | **SHIP THIS WEEK (M)** | Custom ttyd wrapper page at `claude.zaoos.com`. Tap [Ctrl][Esc][Tab][arrows] -> correct keys emit into xterm. | ttyd has no built-in mobile toolbar; wetty install failed (gc-stats native dep, no `make`). |
| 7 | Agent observability panel | **SHIP NEXT WEEK (M)** | portal.zaoos.com/observability -> live AO sessions, last 20 log lines per session, total token spend today. | Right now AO is the only view. A single mobile-friendly digest beats bouncing between dashboards. |
| 8 | Rotating `qwerty1` until #3 ships | **SHIP NOW (XS)** | `~/.secrets/portal-password` rotated weekly via cron + pushed to Cloudflare Worker secret. | Interim until CF Access. |
| 9 | Multi-device state sync | **WAIT (already works)** | Open ao.zaoos.com on phone + laptop, spawn from laptop, watch phone update within 2s. | AO already uses WebSocket broadcast. No-op unless broken. |
| 10 | Claude Code scope hardening | **SHIP NEXT WEEK (M)** | Start `claude-zaoos` with `--allowed-tools=Read,Bash(git:*),Edit(research/**)` to prevent rogue commits on secrets. | Any password-leak on `claude.zaoos.com` currently = full shell, full repo write. |

**Build order (next 7 days):**
1. Telegram `/done` reply (Today - 30 min)
2. Rotate password script (Today - 15 min)
3. Session-start /worksession wrapper (Today - 45 min)
4. PWA shortcuts + share target (Tomorrow - 30 min)
5. Quick-spawn v2 (Saturday - 2 hrs)
6. Cloudflare Access + remove basic auth (Saturday - 1 hr)
7. Mobile keyboard toolbar for ttyd (Sunday - 2 hrs)
8. Agent observability panel + Claude Code scope lock (next week)

---

## Currently Shipped (doc 428 stack, as of 2026-04-17)

| Surface | URL | Auth | Backed by |
|---------|-----|------|-----------|
| Portal tiles + spawn form | `portal.zaoos.com` | basic (zaal:qwerty1) | Caddy :3003 + spawn-server :3004 |
| AO dashboard | `ao.zaoos.com` | basic | Caddy :3002 -> AO :3001 |
| Claude Code TUI | `claude.zaoos.com` | ttyd `-c zaal:qwerty1` | ttyd :7681 -> tmux `claude-zaoos` |
| Paperclip | `paperclip.zaoos.com` | none | tunnel -> :3100 |
| ZOE dashboard | `zoe.zaoos.com` | none | tunnel -> :5072 |
| Pixel Agents | `pixels.zaoos.com` | none | tunnel -> :5070 |
| OpenClaw gateway | `agents.zaoos.com` | none | tunnel -> :18789 |
| Telegram @zaoclaw_bot | Telegram | native | zoe-bot `bot.mjs` |
| Test-checklist Telegram ping | cron `*/15` | n/a | `~/bin/test-checklist-ping.sh` |
| Watchdog | cron `* * * * *` | n/a | `~/bin/watchdog.sh` |
| Reboot bootstrap | cron `@reboot` | n/a | `~/bin/start-agents.sh` |
| Node-pty self-heal | on boot | n/a | `~/bin/fix-node-pty.sh` |

Stack survives SSH logout via tmux. Reboot survival via `@reboot` cron. Session crash survival via `*/1` watchdog.

---

## Comparison - Auth Options

| Option | Cost | UX | Setup effort | Security |
|--------|------|-----|--------------|----------|
| Basic auth + `qwerty1` (**current**) | Free | 1 prompt per subdomain per session | 10 min (done) | Weak - single shared shell password, reusable, no MFA |
| Cloudflare Access OAuth + magic link | Free up to 50 users | Single sign-on across `*.zaoos.com`, 24h cookie | 30 min (CF dashboard + Caddy edit) | Strong - per-user identity, MFA via Google, revocable |
| Tailscale Funnel | Free (personal plan) | Device-bound | 20 min | Strong but no per-path auth |
| WireGuard VPN | Free (self-host) | Device VPN first | 2 hrs | Strong but phone WG gymnastics |
| Passkey / WebAuthn | Free | FaceID/biometric | 3 hrs (custom Caddy plugin or backend) | Strongest. Overkill for now. |

**Pick:** Cloudflare Access. Caddy's `forward_auth` directive integrates with CF Access JWT in ~3 lines of config.

---

## Comparison - Mobile Terminal UX Options

| Tool | Linux prebuilt? | Mobile keyboard toolbar? | Install effort on VPS | Verdict |
|------|-----------------|--------------------------|------------------------|---------|
| **ttyd (current)** | Yes | No built-in toolbar | Done | Works for scroll/tap, bad for Ctrl/arrows |
| wetty | No prebuilt (gc-stats native) | Yes built-in | Blocked - needs `make` (no sudo) | Skip until CF Access or sudo |
| gotty | Yes (Go static binary) | No built-in | 5 min (wget binary) | Install as fallback; same keyboard gap |
| Custom ttyd wrapper page | n/a | Yes - we build it | 2 hrs (HTML + JS overlay) | Best path. Reuse ttyd backend, new frontend. |
| code-server (VS Code in browser) | Yes | n/a (full IDE) | 15 min | Alt - 400MB RAM; great mobile UX for file edit |

**Pick:** Custom wrapper over ttyd. Serves `claude.zaoos.com` -> HTML page with a bottom toolbar of synthetic keys, iframes ttyd, dispatches keydown events.

---

## Comparison - Quick-Spawn v2 Features

| Feature v1 (today) | v2 target | Effort |
|--------------------|-----------|--------|
| Single project (ZAOOS) hardcoded | `<select>` auto-populated from `~/code/*` directories | S |
| Fire + redirect in 2s | Inline status: `queued -> running -> ready` via `/spawn-status?id=X` polling | M |
| No error surfacing | stderr tail on failure shown in textarea-size result box | S |
| No history | Last 5 spawns persisted in localStorage, shown as tiles | S |
| Plain prompt textarea | `/template` dropdown: fix-typo, add-test, bump-dep, triage-issue | M |
| No attachments | Drop a file link (PR URL, log URL), auto-prepend to prompt | S |

---

## Detailed - Track 1: Telegram `/done N` reply parsing

**What:** Extend `~/zoe-bot/bot.mjs` to parse inbound `/done <id>` messages from Zaal's chat ID and flip corresponding test in `~/test-checklist/state.json`.

**Why:** 15-min nudges already work. One-tap mark-done link works. But if Zaal's on Telegram already, typing `/done 3` is faster than switching to browser.

**Implementation (30 min):**
- bot.mjs already polls Telegram updates
- Add handler: if message.text matches `/^\/done\s+(\d+)$/`, PATCH `~/test-checklist/state.json`, reply "[DONE] test N"
- Also handle `/undo N`, `/checklist` (returns list + links), `/tests` (alias)

**Test:** Send `/checklist` to bot, expect list. Send `/done 1`, refresh `portal.zaoos.com/test-checklist`, test 1 now checked.

---

## Detailed - Track 2: Session-start pattern

**Problem:** When Claude Code launches on VPS at `claude.zaoos.com`, it starts on whatever branch the repo is on. Today it landed on `main` directly (doc 429 commit had to be branched after-the-fact).

**Fix:** Wrapper script `~/bin/claude-session.sh`:
```
#!/bin/bash
export PATH=$HOME/.local/bin:$PATH
cd ~/code/ZAOOS
# Ensure on a fresh ws/ branch named by date
BR="ws/phone-$(date +%Y%m%d-%H%M)"
if [ "$(git branch --show-current)" == "main" ]; then
  git fetch origin main && git checkout main && git pull --ff-only && git checkout -b "$BR"
fi
exec claude
```

Watchdog respawn calls this instead of raw `claude`.

**Test:** Kill `claude-zaoos` tmux, watchdog respawns, new session shows branch `ws/phone-YYYYMMDD-HHMM` in tmux status line.

---

## Detailed - Track 5: PWA shortcuts + share target

Augment `~/caddy/portal/manifest.json`:

```json
{
  "shortcuts": [
    { "name": "Spawn agent", "short_name": "Spawn", "url": "/#spawn", "icons": [{"src":"/icon.svg","sizes":"any"}] },
    { "name": "Open AO",     "short_name": "AO",    "url": "https://ao.zaoos.com" },
    { "name": "Claude TUI",  "short_name": "Claude","url": "https://claude.zaoos.com" },
    { "name": "Checklist",   "short_name": "Tests", "url": "/test-checklist" }
  ],
  "share_target": {
    "action": "/#spawn",
    "method": "GET",
    "params": { "title": "title", "text": "text", "url": "url" }
  }
}
```

**Test:** iOS home-screen long-press -> 4 shortcuts appear. Safari share sheet -> ZAO Portal accepts URL -> lands on spawn form prefilled with share text.

---

## Detailed - Track 6: Mobile keyboard toolbar wrapper

Structure: Caddy serves `claude.zaoos.com` -> custom HTML at `~/caddy/claude/index.html` that:

1. Full-screen iframe of `http://localhost:7681/` (ttyd)
2. Bottom sticky toolbar with buttons: `Ctrl`, `Esc`, `Tab`, `↑`, `↓`, `←`, `→`, `Ctrl-C`
3. Each button dispatches a synthetic `keydown` event into the iframe's contentWindow
4. Because both are on the same origin (claude.zaoos.com), no CORS issue

Caddy config:
```
:7682 {
  root * /home/zaal/caddy/claude
  file_server
}
```

Then Caddyfile for `claude.zaoos.com` auth proxies to `:7682` (new wrapper), wrapper iframes `/terminal` which reverse_proxies to `:7681` (ttyd internal).

**Test:** Tap `Ctrl` then `C` on phone toolbar -> active Claude session receives SIGINT, returns to prompt. Tap `↑` -> previous command appears.

---

## ZAO Ecosystem Integration

- `~/caddy/portal/index.html` - portal HTML, update for shortcuts
- `~/caddy/portal/manifest.json` - PWA manifest, add `shortcuts` + `share_target`
- `~/caddy/claude/index.html` - NEW wrapper with mobile keys
- `~/caddy/Caddyfile` - new `:7682` block + updated routes
- `~/bin/spawn-server.js` - extend with `/spawn-status`, multi-project, history endpoints
- `~/bin/claude-session.sh` - NEW session-start wrapper
- `~/bin/watchdog.sh` - point at new wrapper instead of raw `claude`
- `~/zoe-bot/bot.mjs` - add `/done`, `/undo`, `/checklist`, `/tests` handlers
- `~/test-checklist/state.json` - unchanged, keep as single source of truth
- Cloudflared config `~/.cloudflared/config.yml` - no changes (routing static)
- CF dashboard - set up Access application for `*.zaoos.com`
- `community.config.ts` (ZAO OS repo) - no changes

Related local ZAO OS files:
- `src/app/admin/agents/` - Agent Squad Monitor already mobile-first
- `src/lib/publish/` - future: receive portal spawn events for broadcast

Companion docs:
- [doc 428 - Unified Agent Portal (parent infra)](../428-unified-agent-portal-ao-phone-access/)
- [doc 429 - Claude Code Skills deep dive](../../dev-workflows/429-claude-code-skills-deep-dive/)
- [doc 417 - Agent tools remote access (origin)](../417-agent-tools-remote-access/)
- [doc 305 - Pocket assistant flow state](../../dev-workflows/305-pocket-assistant-flow-state-workflow/)
- [doc 422 - Claude Routines](../../dev-workflows/422-claude-routines-zao-automation-stack/)

---

## Known Blockers

1. **No sudo** on VPS for `zaal`. Blocks: native-compile npm packages (wetty), apt installs. Workarounds: prebuilt binaries, user-local npm prefix.
2. **VPS Claude started on main** (not a ws/ branch) for doc 429. Track 2 fixes this.
3. **Five caddy processes** happened once during iteration. `pkill -9 caddy` + single tmux respawn cleaned it. Watchdog now guards.
4. **Doc number collisions** in git - multiple branches claimed 427, 428, 429. This doc = 430. Resolve pre-merge as branches converge.
5. **node-pty prebuilts only cover darwin/win32 upstream**. Using homebridge fork as drop-in symlink. `~/bin/fix-node-pty.sh` re-applies on boot.

---

## Sources

- [Cloudflare Access free tier and Caddy `forward_auth` integration](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/application-token/)
- [Web App Manifest - `shortcuts` and `share_target`](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [ttyd XTerm.js frontend customization](https://github.com/tsl0922/ttyd/wiki)
- [wetty repo - install failure due to gc-stats native dep](https://github.com/butlerx/wetty)
- [gotty static Go binary alternative](https://github.com/sorenisanerd/gotty)
- [Claude Code - allowed-tools field spec (via doc 429)](../../dev-workflows/429-claude-code-skills-deep-dive/README.md)
- [Companion - doc 428 portal infra](../428-unified-agent-portal-ao-phone-access/README.md)
- [Companion - doc 422 Claude Routines](../../dev-workflows/422-claude-routines-zao-automation-stack/README.md)
- [Companion - doc 417 agent tools remote access parent](../417-agent-tools-remote-access/README.md)
