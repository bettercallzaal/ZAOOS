# 431 - Portal v2: Universal Nav + Version-Control + Backlog

> **Status:** Research + build plan
> **Date:** 2026-04-18
> **Goal:** Ship universal top-nav bar across `*.zaoos.com`, get VPS config into git (the critical gap), and rank the next wave of portal improvements. Companion to docs 428/430.

---

## Key Decisions / Recommendations

Top of the list based on Zaal's testing feedback + current state:

| # | Item | Ship | Effort | Why first |
|---|------|------|--------|-----------|
| 1 | **Version VPS config in `bettercallzaal/zao-portal-infra` repo** | SHIP TODAY | 45 min | Critical gap. Nothing on VPS is in git right now. One disk failure = full rebuild from memory. Also unblocks multi-device admin. |
| 2 | **Universal nav bar (floating "dock" overlay)** | SHIP TODAY | 60 min | Zaal asked. Tap any of 4 pills (AO / Claude / Portal / Checklist) from any subdomain. Injected via Caddy `handle_path` + shared JS from `nav.zaoos.com/dock.js`. Works without touching AO/ttyd internals. |
| 3 | **Push notifications via Telegram** (already done) + **Web Push for portal** | SHIP THIS WEEK | 2 hrs | Telegram pings work (15-min checklist). Add opt-in web push so the PWA itself nudges without Telegram. |
| 4 | **Session history + quick re-spawn** | SHIP THIS WEEK | 90 min | Portal remembers last 10 spawn prompts. Tap to re-fire the same prompt on a new session. |
| 5 | **Agent templates dropdown** | SHIP THIS WEEK | 45 min | Pre-written prompts for common tasks: "fix typo", "add test", "bump dep", "run qa", "triage issue N". |
| 6 | **Voice-to-prompt** | SHIP NEXT | 30 min | Safari on iOS has native `webkitSpeechRecognition`. Tap mic icon in spawn form, speak, releases -> prompt populates. |
| 7 | **Cost tracker** | SHIP NEXT | 2 hrs | Query Anthropic API for current month usage. Show on portal as a tile: "$X spent, Y tokens, Z sessions today". |
| 8 | **Offline shell (portal PWA)** | SHIP NEXT | 90 min | Service worker caches portal HTML + tiles. If offline, shows queued items + lets you stage a spawn (fires when back online). |
| 9 | **Scheduled spawns (mini-cron UI)** | SHIP NEXT | 2 hrs | Form: prompt + project + cron expression. Backed by `~/test-checklist/state.json`-style JSON + cron line. Same pattern reused. |
| 10 | **Multi-device state sync indicator** | POLISH | 30 min | Small dot in nav shows "3 devices active" when AO dashboard is open on more than one device. |
| 11 | **Backups: nightly tarball to Arweave/S3** | SHIP NEXT | 60 min | `tar` of `~/caddy ~/bin ~/test-checklist ~/.auth-token ~/.cloudflared ~/zoe-bot`, upload nightly. Redundancy for gap in item 1. |
| 12 | **Cloudflare Access finally** | SHIP WHEN ROOM | 45 min | Replaces cookie auth with Google OAuth across domains. Lower per-device friction, MFA support. Requires 10 min of CF dashboard clicks (only Zaal can do). |

---

## Universal Nav - Concrete Implementation

**Goal:** Every `*.zaoos.com` page renders a floating bottom or top pill dock with 4 one-tap shortcuts, styled navy+gold, iOS safe-area aware, non-intrusive.

### Approach - Caddy response body rewriting

Can't modify AO (Next.js app) or ttyd (xterm wrapper) internals. Instead:

1. Caddy serves a tiny JS loader from `portal.zaoos.com/dock.js` (one file, ~3 KB)
2. For HTML responses on each subdomain, Caddy injects `<script src="https://portal.zaoos.com/dock.js" defer></script>` before `</body>` using `replace` directive from `caddy-replace-response` module... BUT that module needs custom Caddy build (sudo).

### Alternative - iframe wrapper pages (works today, no rebuild)

For `claude.zaoos.com` already need a wrapper (mobile keyboard toolbar - doc 430 track 6). Make that same wrapper include the dock. For `ao.zaoos.com` ship a lightweight wrapper page too (dock on top + iframe below).

```
claude.zaoos.com/        -> Caddy :7682 -> HTML wrapper (dock + iframe to /terminal)
claude.zaoos.com/terminal -> Caddy :7682 -> ttyd :7681

ao.zaoos.com/            -> Caddy :3002 -> HTML wrapper (dock + iframe to /app)
ao.zaoos.com/app         -> Caddy :3002 -> AO :3001

portal.zaoos.com/        -> Caddy :3003 -> portal HTML (inline dock, no iframe)
```

Dock HTML (one file, served from `~/caddy/dock/dock.html`):

```html
<div id="zao-dock" style="position:fixed;bottom:env(safe-area-inset-bottom,0);left:50%;transform:translateX(-50%);display:flex;gap:.3rem;padding:.4rem .5rem .6rem;background:rgba(10,22,40,.92);backdrop-filter:blur(8px);border-radius:14px 14px 0 0;border:1px solid rgba(245,166,35,.2);z-index:2147483647;font-family:-apple-system,sans-serif">
  <a href="https://portal.zaoos.com/" style="padding:.4rem .7rem;font-size:.72rem;color:#f5f4ed;text-decoration:none;border-radius:6px">Portal</a>
  <a href="https://ao.zaoos.com/" style="padding:.4rem .7rem;font-size:.72rem;color:#f5f4ed;text-decoration:none;border-radius:6px">AO</a>
  <a href="https://claude.zaoos.com/" style="padding:.4rem .7rem;font-size:.72rem;color:#f5f4ed;text-decoration:none;border-radius:6px">Claude</a>
  <a href="https://portal.zaoos.com/test-checklist" style="padding:.4rem .7rem;font-size:.72rem;color:#f5f4ed;text-decoration:none;border-radius:6px">Tests</a>
</div>
```

Highlight current surface by matching `window.location.hostname` in a 20-line script.

**Test plan:** visit ao.zaoos.com on phone -> dock visible at bottom -> tap Claude pill -> lands on claude.zaoos.com with dock still visible -> tap Portal -> back. Total one-tap hops: AO -> Claude = 1 tap (was 4: back, tap address bar, type URL, go).

---

## Version Control Gap - Concrete Fix

**Problem:** Every file I shipped today lives on VPS only. No git. No backup.

**Solution:** New repo `bettercallzaal/zao-portal-infra` mirroring the VPS layout:

```
zao-portal-infra/
├── caddy/
│   ├── Caddyfile                       # source of truth for vhost config
│   ├── portal/                         # portal static (index.html, manifest.json, icon.svg)
│   ├── dock/                           # universal nav
│   └── claude/                         # claude.zaoos.com wrapper (mobile keys)
├── bin/
│   ├── auth-server.js                  # cookie login
│   ├── spawn-server.js                 # quick-spawn + checklist backend
│   ├── watchdog.sh
│   ├── start-agents.sh
│   ├── fix-node-pty.sh
│   ├── test-checklist-ping.sh
│   └── claude-session.sh               # future wrapper (doc 430 track 2)
├── cloudflared/
│   └── config.yml
├── cron/
│   └── crontab                         # export of `crontab -l` with timestamps
├── zoe-bot/                            # reference; lives outside for now
├── secrets/
│   └── .env.example                    # PASSWORD, TOKEN paths. Real secrets NOT committed.
├── README.md                           # setup runbook
├── install.sh                          # idempotent setup script
└── sync.sh                             # pulls latest + restarts affected services
```

**Install on a fresh VPS:** `git clone && cd zao-portal-infra && ./install.sh`

**Sync existing VPS to latest main:** `cd ~/zao-portal-infra && git pull && ./sync.sh`

**Test plan:**
- Clone repo to `~/zao-portal-infra` on VPS
- Run `./sync.sh`
- Everything keeps working (it's a no-op mirror of current state)
- Rename some file via `ssh` edit, do NOT commit -> `./sync.sh` reverts it
- Repo is now the source of truth

---

## Comparison - Nav Injection Options

| Option | Mobile UX | Touches AO/ttyd | Effort | Verdict |
|--------|-----------|-----------------|--------|---------|
| Caddy response-body replace (inject `<script>`) | Great | No | Requires custom Caddy build (needs `make` - blocked by sudo) | Skip |
| iframe wrapper on each subdomain | Great | No | 1 hr | **SHIP** |
| Native AO + ttyd patches | Great | Yes | 4 hrs + risk of breaking AO on update | Skip |
| Bookmarklet | Poor | No | 5 min | Not persistent, doesn't show on home-screen PWA |
| Browser extension | N/A on iOS | No | n/a | iOS Safari no-go |

---

## Comparison - Notification Channels

| Channel | Native on iPhone? | Rich (buttons)? | Setup effort | Current state |
|---------|-------------------|-----------------|--------------|---------------|
| Telegram @zaoclaw_bot | Yes (Telegram app) | Inline buttons via bot API | Done | **Live.** 15-min checklist pings working. |
| Web Push (VAPID) | Yes (iOS 16.4+, only when PWA installed) | Limited (text + icon) | 2 hrs | Not built. Works only inside installed PWA on iOS. |
| Email (SendGrid/Resend) | Yes | Rich HTML | 30 min | Not built. Overkill for this. |
| SMS (Twilio) | Yes | Plain text | 20 min + $ | Overkill. |
| iOS Push via Apple dev account | Yes | Rich | 2 days | Not worth it for single-user. |

**Pick:** Keep Telegram as primary. Add Web Push only when PWA is installed, for in-app notifications (e.g. "spawn complete"). Web Push on iOS requires the site to be installed via Add-to-Home-Screen.

---

## Comparison - Scheduled Spawn Design

| Approach | UX | Effort | Reliability |
|----------|-----|--------|-------------|
| Portal form + cron line (self-manage) | OK | 1 hr | High - cron on VPS |
| Portal form + systemd user timer | Great | Hard - sudo gate for enable-linger | Blocked |
| Claude Routines (doc 422) | Portal calls Anthropic API | 2 hrs | High - Anthropic cloud |
| Portal form + node-cron in spawn-server | OK | 45 min | Medium - tied to spawn-server uptime |

**Pick:** node-cron inside spawn-server.js for v1 (ties to existing service). Upgrade to Claude Routines for v2 when we want off-VPS execution.

---

## ZAO Ecosystem Integration

### New repo to create

- `bettercallzaal/zao-portal-infra` (NEW) - VPS config mirror. Private repo. Secrets gitignored.

### Files to add/update on VPS (after repo exists)

- `~/zao-portal-infra/` - cloned repo
- `~/caddy/Caddyfile` - symlinked to repo
- `~/bin/*` - symlinked to repo
- `~/caddy/dock/dock.html` - NEW, universal nav
- `~/caddy/claude/index.html` - NEW, wrapper page with dock + mobile keys + iframe
- `~/caddy/ao/index.html` - NEW, wrapper page with dock + iframe

### Files to add to ZAO OS repo (local)

- `docs/portal-runbook.md` - pointer + install steps (not the infra itself)
- `research/infrastructure/431-portal-universal-nav-v2-improvements/` - this doc
- Eventually: `src/app/admin/portal-status/page.tsx` showing checklist state inside the main ZAO OS Agent Squad Monitor

### Cross-doc alignment

- [doc 428 - portal infra origin](../428-unified-agent-portal-ao-phone-access/)
- [doc 430 - prior improvements plan](../430-portal-stack-improvements-plan/)
- [doc 417 - remote access parent](../417-agent-tools-remote-access/)
- [doc 305 - pocket assistant flow state](../../dev-workflows/305-pocket-assistant-flow-state-workflow/)
- [doc 422 - Claude Routines (future scheduled spawn home)](../../dev-workflows/422-claude-routines-zao-automation-stack/)

---

## Sources

- [Caddy forward_auth directive](https://caddyserver.com/docs/caddyfile/directives/forward_auth)
- [Web Push on iOS (PWA-only, Apple docs)](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [webkitSpeechRecognition on iOS Safari](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Anthropic usage API for cost tracking](https://docs.anthropic.com/en/api/admin-api/usage-cost/get-cost-report)
- [Companion - doc 428 portal infra](../428-unified-agent-portal-ao-phone-access/README.md)
- [Companion - doc 430 prior improvement plan](../430-portal-stack-improvements-plan/README.md)
