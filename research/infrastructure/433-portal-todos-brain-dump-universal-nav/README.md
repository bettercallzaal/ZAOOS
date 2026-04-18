# 433 - Portal v3: Todos Brain Dump + Universal Nav + infra/portal Versioned

> **Status:** Shipped + live
> **Date:** 2026-04-18
> **Goal:** Capture what shipped in this session (universal nav dock, session history on portal, infra/portal version-controlled repo path, todos brain-dump system with 35 seeded items) and where to route future brain-dumps.

---

## Key Decisions / Recommendations

| # | Item | State | Where |
|---|------|-------|-------|
| 1 | Universal nav dock across all *.zaoos.com | **LIVE** | iframe wrappers at claude.zaoos.com + ao.zaoos.com, inline on portal |
| 2 | Portal session history (last 10 spawns, re-spawn button) | **LIVE** | portal.zaoos.com, stored in localStorage |
| 3 | Quick-spawn templates (fix lint, add test, bump deps, run QA, triage issue) | **LIVE** | portal.zaoos.com |
| 4 | Portal todos brain-dump with filters | **LIVE** | portal.zaoos.com/todos |
| 5 | Bulk-add (one per line) + individual add | **LIVE** | portal.zaoos.com/todos "Bulk add" section |
| 6 | Priority (P0-P3), status, tags, project, search, order filters | **LIVE** | portal.zaoos.com/todos |
| 7 | "Spawn from todo" button | **LIVE** | Tap spawn on any todo card -> portal prefills with the text |
| 8 | infra/portal/ repo path in ZAOOS | **LIVE** | infra/portal/ with install.sh + sync.sh + README |
| 9 | Seeded 35 todos from prior-session TODO list | **LIVE** | All 35 items from the mega-session summary now in portal todos |

**Next steps:**
1. Bookmark portal.zaoos.com/todos as your universal brain-dump destination
2. Each time you have an idea or new TODO, open portal on phone -> type -> Add (or Bulk add for pasted lists)
3. Weekly: filter by P1 + open, pick 2-3 to spawn into agents
4. Write future ideas directly into the portal instead of Telegram or paper

---

## Where to Drop Each Type of Input (Definitive Routing)

| I have a... | Go to | Why |
|-------------|-------|-----|
| **Quick TODO or idea** | `portal.zaoos.com/todos` -> Add (or Bulk add) | Captures with priority + tags, searchable later |
| **Work I want an agent to start now** | `portal.zaoos.com` -> Quick Spawn | Immediate dispatch to ao.zaoos.com |
| **Walking-around thought** | Telegram `@zaoclaw_bot` | Fastest native tap. ZOE dispatches. |
| **Research thread starter** | Telegram forward to `zoe-zao@agentmail.to` | Processed via `/inbox` skill |
| **Bug or session log** | portal todos with `#bug` tag | Filterable later |
| **Links to read later** | portal todos with `#read` tag + URL in text | Filter shows reading queue |
| **Scheduled/recurring task** | Claude Routines (doc 422) | Anthropic cloud, reliable cron |
| **Long planning doc** | `/zao-research` skill -> docs | Versioned + index + cross-linked |

## Test It Works (1-minute check)

From your phone:
1. Open `portal.zaoos.com/todos` -> you should see the 35 seeded items (34 open, 1 done)
2. Type "test from phone" in the top textarea -> select P3 -> Add
3. Refresh -> item appears at the top with "0s" timestamp
4. Tap the priority chip "P3" -> only P3 items filter
5. Tap the tag chip "portal" -> filters to tag
6. Tap "clear filters" -> everything back
7. Tap "spawn" button on any todo -> lands on portal main with the todo prefilled into Quick Spawn

---

## Architecture Delta

### Before this session

```
portal.zaoos.com -> Caddy -> static index.html (tiles + spawn form)
ao.zaoos.com -> Caddy -> AO dashboard directly
claude.zaoos.com -> Caddy -> ttyd directly
```

### After this session

```
portal.zaoos.com -> Caddy :3003
  /                -> index.html (tiles + spawn form + history + templates)
  /todos           -> todos.html (brain dump UI)
  /api/todos       -> spawn-server :3004 (CRUD + filters)
  /spawn-action    -> spawn-server :3004 (fire ao spawn)
  /test-checklist  -> spawn-server :3004 (rendered HTML)
  /dock.js         -> universal nav JS (served by every page)

ao.zaoos.com -> Caddy :3002
  /                -> wrapper index.html (iframe + dock)
  /app/*           -> AO dashboard :3001

claude.zaoos.com -> Caddy :7682
  /                -> wrapper index.html (iframe + dock)
  /terminal/*      -> ttyd :7681

All *.zaoos.com
  forward_auth -> auth-server :3005 (cookie-based, 30 day)
```

### New repo-versioned layout

```
infra/portal/                          Lives in ZAOOS repo
  README.md                            Runbook
  install.sh                           First-run installer (no sudo)
  sync.sh                              Pull + refresh running services
  .gitignore
  caddy/
    Caddyfile                          Port-based vhosts, forward_auth
    portal/
      index.html                       Main portal with spawn + history + templates
      todos.html                       Brain-dump UI
      manifest.json
      icon.svg
      dock.js                          Copy of universal nav
    dock/dock.js                       Source of truth for dock
    claude/index.html                  Iframe wrapper + dock
    ao/index.html                      Iframe wrapper + dock
  bin/
    auth-server.js                     Cookie login :3005
    spawn-server.js                    Spawn + todos + checklist :3004
    watchdog.sh                        Every-minute cron
    start-agents.sh                    @reboot cron
    fix-node-pty.sh                    Homebridge node-pty fork symlink
    test-checklist-ping.sh             15-min Telegram nudge
  cloudflared/
    config.yml                         Tunnel ingress
  cron/
    crontab                            Snapshot of crontab -l
```

---

## Comparison - Brain-Dump Destination Options

| Option | Capture speed | Searchable | Mobile-native | Filterable | Verdict |
|--------|---------------|------------|---------------|------------|---------|
| **portal.zaoos.com/todos** | Fast (PWA, 1 tap) | Yes | Yes | Yes (status/priority/tag/project/search) | **PRIMARY** |
| Telegram ZOE DM | Fastest | Hard | Yes | No | Walking-around only |
| Email to zoe-zao@agentmail.to | Fast from any app | Via `/inbox` | Yes | No | Links + forwarded content |
| Notion | Slow on phone | Yes | Mediocre | Yes | Long docs only |
| Obsidian | Desktop-heavy | Yes | Poor | Manual | Skip for brain-dump |
| Paper notebook | Fast | No | N/A | No | Skip - never re-read |

**Rule:** Anything you might want to spawn an agent on -> portal todos. Anything that's a conversation starter -> Telegram ZOE. Anything you want to archive/reference -> Notion or research doc.

---

## The 35 Seeded Todos (priorities)

- **P1 (act on first): 10 items**
  - Apple Dev + Play Dev accounts
  - Sentry DSN in Vercel
  - Session refresh endpoint
  - Staking circuit breaker
  - qwerty1 rotation
  - zao-portal-infra PR
  - Test checklist completion (5 tests)
  - Matteo Tambussi Italy follow-up
  - ZAO Stock Oct 3 promo videos
  - WaveWarZ Sunday battle promo
- **P2 (this week): 16 items**
  - XMTP pagination, desktop shell, dashboard shell
  - Code-split, GitHub Actions CI
  - Spaces graceful exit, og.png optimize
  - Cloudflare Access, universal nav verify
  - Telegram /done, session-start wrapper
  - Quick-spawn v2
  - diagram-design install, zao-routines repo
  - Clearwing sourcehunt, nightly backup
  - Juke Farcaster partnership
- **P3 (when there is room): 8 items**
  - Observability panel, voice input
  - Cost tracker, offline PWA
  - Scheduled spawns, web push
  - og.png, CF Tunnel (done-ish)

---

## ZAO Ecosystem Integration

### Files / surfaces

- `infra/portal/**` - NEW versioned config mirror
- `~/caddy/**`, `~/bin/**`, `~/.cloudflared/config.yml` on VPS - deployed copies
- `portal-state/todos.json` on VPS - todos persistent store
- `test-checklist/state.json` on VPS - test progress
- `src/app/admin/agents/` in ZAOOS - existing Agent Squad Monitor, still the desktop dashboard

### Cross-doc alignment

- [doc 428 - portal infra origin](../428-unified-agent-portal-ao-phone-access/)
- [doc 430 - prior improvement plan](../430-portal-stack-improvements-plan/)
- [doc 431 - portal v2 plan (predecessor)](../431-portal-universal-nav-v2-improvements/)
- [doc 422 - Claude Routines (scheduled spawns home)](../../dev-workflows/422-claude-routines-zao-automation-stack/)
- [doc 305 - pocket assistant flow state](../../dev-workflows/305-pocket-assistant-flow-state-workflow/)
- [doc 154 - skills and commands master reference](../../dev-workflows/154-skills-commands-master-reference/)
- [doc 345 - ZABAL swarm master blueprint](../../agents/345-zabal-agent-swarm-master-blueprint/)

---

## Known Open Work

- Telegram `/done N` reply parsing still not shipped (doc 430 track 1). Still have to tap the link.
- Cloudflare Access still not shipped. Cookie auth is 30-day so low pain; password still `qwerty1`.
- Mobile keyboard toolbar for claude.zaoos.com still not built (iOS Ctrl/arrows gap).
- Agent observability panel (live sessions + logs consolidated) deferred.
- Cost tracker deferred.
- Doc number collisions across branches - this doc = 433 to leave room.

---

## Sources

- [Companion - doc 428](../428-unified-agent-portal-ao-phone-access/README.md)
- [Companion - doc 430](../430-portal-stack-improvements-plan/README.md)
- [Companion - doc 431](../431-portal-universal-nav-v2-improvements/README.md)
- [infra/portal/ repo path](../../../infra/portal/)
- [Caddy forward_auth](https://caddyserver.com/docs/caddyfile/directives/forward_auth)
- [Web App Manifest shortcuts](https://developer.mozilla.org/en-US/docs/Web/Manifest/shortcuts)
