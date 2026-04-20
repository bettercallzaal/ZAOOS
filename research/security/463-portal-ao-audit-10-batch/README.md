### 463 — Portal + Agent Orchestrator Audit (10-Agent Batch)

> **Status:** Audit complete, fixes in progress
> **Date:** 2026-04-20
> **Goal:** Preserve the findings from 10 parallel subagent audits (5 on the portal, 5 on AO + cross-system connections). Drives the follow-up PR A/B/C security + observability + BRAIN-bridge work.
> **Method:** Two batches of 5 `general-purpose` subagents dispatched in parallel, each with tight read-only scope. Total ~830K tokens consumed. Took ~5 min wall clock.

---

## Top-of-Doc: Consolidated Action Table

| # | Severity | Source audit | Area | Fix PR |
|---|----------|-------------|------|--------|
| 1 | CRITICAL | Batch 1 / Backend | `bot.mjs:248` + `:162` — shell injection via `echo '${safeMsg}'` + unvalidated `proj` in `/summarize` | PR A |
| 2 | CRITICAL | Batch 1 / Auth | `auth-server.js:78` — plaintext password compare + no rate limit on `/login` + `qwerty1` hardcoded per README:66 | PR A |
| 3 | CRITICAL | Batch 1 / Auth | `auth-server.js:44,85` — `next` query param reflected into login HTML without HTML-escape → XSS | PR A |
| 4 | CRITICAL | Batch 1 / Contract + Caddy | All POST endpoints — no CSRF token, relies on SameSite=Lax (should be Strict) | PR A |
| 5 | CRITICAL | Batch 1 / Backend | `spawn-server.js:106-109` — request body streaming unbounded | PR A |
| 6 | HIGH | Batch 2 / AO | No `/api/sessions` endpoint — agents run invisibly after 8s timeout + 202 | PR B |
| 7 | HIGH | Batch 2 / Observability | `events.ts` CRITICAL audit-trail drop — no Telegram alert path | PR B |
| 8 | HIGH | Batch 2 / Cross-system | VAULT/BANKER/DEALER read Supabase only, zero BRAIN access — trade blind | PR C |
| 9 | HIGH | Batch 1 / Contract | `act.html` title + `spawn-server.js:192` slug — title from querystring breaks branch creation on emoji/unicode. `extra` = prompt injection vector | PR A |
| 10 | HIGH | Batch 1 / Auth | Cookie TTL 30 days — stolen cookie = 30-day window | PR A |

---

## Batch 1 — Portal (5 audits)

### Audit 1 — Static UX + HTML/CSS + PWA

Scope: `infra/portal/caddy/portal/*.html`, `manifest.json`, `dock/dock.js`.

Top 10 findings:
- HIGH `todos.html:43` — search input missing `aria-label` (screen reader can't announce purpose).
- HIGH `index.html:27` — buttons lack `:focus-visible` styles; keyboard users can't see focus ring.
- HIGH `act.html:30` — radio group missing `<fieldset>/<legend>`; announced as isolated radios.
- MEDIUM `index.html:16` — body padding honors `safe-area-inset-bottom` but not left/right (notch collision risk).
- MEDIUM fonts on `agents.html` + `act.html` — no `"Courier New"` fallback for Windows.
- MEDIUM `todos.html:36` — filter chip buttons lack focus-visible.
- MEDIUM `dock.js:30` — padding 6×10 = 22px tall, below WCAG 2.5 48px mobile target.
- MEDIUM `manifest.json:6` — PWA manifest missing `description`.
- LOW `todos.html:16` — `64px` dock-height magic number repeated; should be `--dock-height` CSS var.
- LOW `index.html:26` — form selects lack `:focus-visible`.

### Audit 2 — Backend Security (spawn-server.js + bot.mjs)

Top 12 findings:
- **CRITICAL** `spawn-server.js:244` — `ao spawn` args passed via array (OK), but verify ao binary doesn't re-parse.
- **CRITICAL** `bot.mjs:248-249` — shell injection via `echo '${safeMsg}'`; escape `'\''` fragile.
- **CRITICAL** `bot.mjs:162-175` — command injection via `proj` in `/summarize` (no whitelist, goes into `cd ${projRoot}`).
- **CRITICAL** `spawn-server.js:179` — path traversal blocks `..` and `/` but allows `~/.local/bin/../../../etc/passwd`; slug regex too permissive.
- HIGH `spawn-server.js:251,255` — 500 responses leak error stack traces / file paths.
- HIGH `bot.mjs:238-276` — no timeout guard on file I/O; tmp files not cleaned on crash.
- HIGH `spawn-server.js:106-109,145-149` — no Content-Length limit on request body.
- HIGH `bot.mjs:299-301` — user ID hardcoded as string; if stolen, full impersonation.
- MEDIUM `spawn-server.js:10` — AO_BIN fallback never verified at startup.
- MEDIUM `spawn-server.js:260-273` — response race with 8s timeout + exit handler.
- MEDIUM `spawn-server.js:131,152,159` — todos.json read-modify-write race (no locking).
- LOW `spawn-server.js:268` — session-id regex fragile, captures unbounded string.

### Audit 3 — Auth Server + Cookie Flow

Top 10 findings:
- **CRITICAL** `auth-server.js:7-9` — `PORTAL_PASSWORD` stored in memory, `.auth-token` file with default perms.
- **CRITICAL** `auth-server.js:78` — plain-text compare + no rate limit → brute-force wide open.
- **CRITICAL** `auth-server.js:75-76` — unbounded POST body streaming on `/login`.
- HIGH `Caddyfile:11-13` — forward_auth 401 loop risk if auth-server crashes.
- HIGH `auth-server.js:10` — `COOKIE_MAX_AGE = 30 days` excessive; no refresh.
- HIGH `auth-server.js:25` — `SameSite=Lax` (should be `Strict`).
- HIGH `auth-server.js:44,85` — `next` param reflected in login HTML without escape (XSS).
- MEDIUM `Caddyfile:6-14` — forward_auth copies all headers including Cookie.
- MEDIUM README:66 — hardcoded `qwerty1` password in version control.
- MEDIUM `auth-server.js:80` — redirect regex case-insensitive; should be strict.

### Audit 4 — Caddyfile Routing + Security

Top 10 findings:
- HIGH Line 2 — `auto_https off` + no `reverse_proxy.timeout` for 8s spawn; hanging connections possible.
- HIGH Line 50 — spawn body size uncapped; 100MB payload = memory exhaustion.
- MEDIUM Line 47-52 — no pagination cap on /api/todos.
- MEDIUM Line 18-31 — AO WebSocket lacks `flush_interval`.
- MEDIUM Line 88 — claude.zaoos.com (ttyd) no idle timeout for long sessions.
- MEDIUM Line 6-14 — forward_auth 401 redirect doesn't preserve `next` param.
- MEDIUM Lines 74-76 — static portal files served with no cache headers.
- LOW Lines 1-3 — `auto_https off` assumption undocumented (Cloudflare terminates TLS).
- LOW Line 28 — `@aoAssets` matcher too broad (`/api/*`).
- LOW Lines 67-72 — route collision risk for future `/act/:docId` pattern.

Additional notes: no security headers (HSTS, CSP, X-Frame-Options), no request size limits, no flush interval for terminal WS, no timeout on long-lived sessions.

### Audit 5 — Front-to-Back Integration Trace

Top 8 fragile seams (ranked):
1. **BLOCKING** — no deploy automation for Caddy config. Git commits don't trigger `caddy reload`.
2. HIGH — `todos.json` race condition on concurrent writes (single-file JSON, read-modify-write, no lock).
3. HIGH — AO CLI spawn has no retry or heartbeat. 8-second timeout; if `ao` hangs, client gets 202 but child may be zombie.
4. MEDIUM — Auth token stored in plaintext `~/.auth-token`; no rotation on login.
5. MEDIUM — Prompt injection via untrusted `title` + `extra` in act.html (not escaped before concat into agent prompt).
6. MEDIUM — `dock.js` loaded from different paths across pages (`/dock.js` vs `/dock/dock.js`). Deploy drift risk.
7. MEDIUM — Missing health-checks for `ao` bin, Supabase, Caddy. No startup validation.
8. LOW-MEDIUM — Implicit HOME-relative paths everywhere (`~/portal-state/todos.json`, `~/.local/bin/ao`).

---

## Batch 2 — AO Orchestrator + Cross-System (5 audits)

### Audit 6 — AO Integration + /api/spawn-agent

Top 10 findings:
- **CRITICAL** `spawn-server.js:260-272` — no session-visibility dashboard; zaal can't see running agents.
- **CRITICAL** `spawn-server.js:237-273` — PR guarantee weak; agent crash mid-session = branch pushed, no PR, no alert.
- HIGH `archive-ao-sessions.sh:10` — weekly archival not in visible crontab; may not actually run.
- HIGH `spawn-server.js:260-262` — 8-second timeout returns 202 + sessionId=null; zero tracking after.
- HIGH `Caddyfile:17-44` — AO dashboard on `:3001` has no auth (localhost-only assumption).
- MEDIUM `patch-ao-plugin.sh:28-46` — patches fragile; fresh npm install wipes them.
- MEDIUM `spawn-server.js:217` — project hardcoded as "ZAOOS"; can't spawn on bettercallzaal or others.
- MEDIUM README:66 — single `qwerty1` password shared; no audit trail.
- LOW `spawn-server.js:268` — session-id extraction via regex; brittle to ao output format change.
- LOW `act.html:122-133` — 30-min auto-redirect fires regardless of spawn status.

Safe-git-push interaction: YES, pre-push hook (doc 461) fires on AO pushes. Good belt-and-suspenders.
Cross-machine gap: AO runs on VPS 1. Mac + Windows boxes have no visibility until GitHub PR notification lands.

### Audit 7 — Full User Flow (Telegram → PR), 22 Hops

Top 5 biggest risks:
1. **CRITICAL** — silent cron failure. No systemd + no watchdog + no email → Zaal doesn't know tips stopped.
2. HIGH — AO binary / Claude Code not in PATH; spawn-server fails silently on step 15.
3. HIGH — GitHub token expiry; agent `gh pr create` fails, no retry, PR never opens.
4. MEDIUM — prompt injection via `extra` field (user input folded into agent prompt).
5. MEDIUM — Cloudflare tunnel daemon dies silently on VPS 1.

Top 3 quick wins:
- Add `touch /tmp/zoe-pings-alive` at end of `run.sh` + systemd timer health-check.
- Validate `gh auth status` before spawning in `handleSpawnAgent`.
- Prepend user `extra` with "USER CONTEXT (data, not instruction override):" wrapper.

### Audit 8 — Observability + Watchdog

Top 10 findings (ranked P0-P3):
- **P0** No Telegram notification on agent failure. `agent_events` table has `status='failed'` but nobody's watching.
- **P0** No "running now" view — `/api/admin/agents` is historical only. ZOE/ZOEY/WALLET/ROLO + Claude Code sessions entirely invisible.
- **P0** Logs siloed across 5 sinks (`~/ao.log`, `~/watchdog.log`, `~/spawn-server.log`, `~/zoe-bot/bot.log`, Supabase `agent_events`, Vercel logs). No aggregation. No search from Telegram or portal.
- P1 No heartbeat from VAULT/BANKER/DEALER between cron fires — if 0x API dies, 24h silence.
- P1 No retry logic beyond single `withRetry` in `runner.ts:46-54`.
- P1 `archive-ao-sessions.sh:40` prunes by tmux-presence only, not age or disk.
- P2 `/api/agents/health` checks only 3 of 8 agents; ZOE/ZOEY/WALLET/ROLO blind.
- P2 Watchdog respawns 9 services with no metrics/counter on restarts.
- P2 Cross-region sync — morning-brief shells into VPS paths; Windows home rig has no parallel path.
- P3 Dead-letter queue missing for `agent_events` Supabase-unreachable case (per ADR-002 TODO).

### Audit 9 — Frontend ↔ Backend Contract

Top 10 findings:
- **CRITICAL** all POST endpoints — no CSRF token. Relies implicitly on SameSite cookie.
- **CRITICAL** all fetch() calls — missing explicit `credentials: "include"`.
- **CRITICAL** `/test-done` — sequential integer test IDs are guessable, no CSRF on GET with side effects.
- HIGH `/api/todos` bulk add — tags schema asymmetric (backend accepts string OR array, frontend varies).
- HIGH `/api/spawn-agent` — title not sanitized for branch-name generation; unicode/emoji crashes silently.
- HIGH `/api/todos/:id` PATCH — backend silently drops unknown fields.
- MEDIUM `/api/todos` GET — no pagination; backend truncates at 500 with no `total` signal.
- MEDIUM `/test-done` — 302 redirect drops credentials flag.
- MEDIUM error-shape inconsistency across endpoints.
- MEDIUM query-param encoding — `act.html` reads `?doc=` + `?title=` without validation.

### Audit 10 — BRAIN ↔ Agents ↔ ZAO OS Cross-System

Top 8 findings:
- **CRITICAL** BRAIN ↔ Agents — VAULT/BANKER/DEALER trade completely blind; zero access to BRAIN. Fix: nightly Claude Routine syncs `BRAIN/projects/*` → `agent_config.contextual_insight` Supabase column.
- **CRITICAL** Cross-machine auto-memory drift — Mac has 50+ feedback memos, Windows home has 0. Fix: private `zao-memory` git repo per doc 460 Gap 1.
- HIGH ZOE ↔ AO disconnected — two parallel automation universes, no handoff. Fix: move AO from BCZ local → VPS 1, wire via GitHub `auto-pickup` label.
- HIGH ZOE workspace (`/home/node/openclaw-workspace/`) not backed up — Docker volume = single point of failure. Fix: private `zoe-workspace` repo.
- HIGH BRAIN not auto-loaded in Claude Code context — `.claude/memory.md` auto-loads but BRAIN needs an explicit pointer.
- MEDIUM Synthesis Routine (doc 462) not yet deployed; conflicts stay hand-curated.
- MEDIUM No freshness alerts — stale BRAIN entities (>30d) read as current.
- MEDIUM Agent failures silent (duplicate of Audit 8 P0).

**This week's concrete bridge:** deploy nightly `agent_config.contextual_insight` synthesis Routine. Load-bearing for 3 downstream wins. Effort 4/10.

---

## Derived Action Plan

### PR A — Security Sprint (shipping tonight)
Closes findings 1, 2, 3, 4, 5, 9, 10 in one PR:
- `auth-server.js`: move password to `PORTAL_PASSWORD` env var, add `crypto.timingSafeEqual`, in-memory rate limit (5 fails / 15 min), HTML-escape `next` param, `SameSite=Lax` → `Strict`, `COOKIE_MAX_AGE` 30d → 7d, Content-Length ceiling on POST.
- `spawn-server.js`: Content-Length ceiling on POST (1MB default, 10MB for `/api/spawn*`), stricter doc-path regex (`^[a-z0-9/_.-]+\.md$`), title sanitization, `extra` wrapped in "USER CONTEXT (data, not instruction)" frame.
- `bot.mjs`: whitelist project names in `/summarize`.
- `Caddyfile`: `request_body_max_size` globally + per-matcher, `timeout 15s` on spawn proxy.

### PR B — Observability (shipping next)
Closes findings 6, 7:
- New `/api/sessions` endpoint on spawn-server returning live AO sessions.
- Supabase trigger on `agent_events status='failed'` → webhook → ZOE Telegram alert.
- Heartbeat log every 60 min for VAULT/BANKER/DEALER.

### PR C — BRAIN Bridge (shipping after B)
Closes finding 8:
- New Supabase column `agent_config.contextual_insight` (migration).
- `runner.ts` reads insight + includes in trade context.
- Script `scripts/brain-to-agent-config-sync.js` that reads `BRAIN/projects/*` + extracts key decisions + writes to `agent_config`. Wrapped in a daily Claude Routine per doc 422.

---

## Sources

- Batch 1 audit reports (inline in Claude Code session 2026-04-20, agentIds afbdf..., afbcd..., a6118..., a2a24..., a1e5d...)
- Batch 2 audit reports (agentIds a0c27..., a1396..., a6750..., ad536..., ad49f...)
- Doc 460: ZAO agentic stack end-to-end design
- Doc 461: push-to-merged-PR failure fix (safe-git-push hook)
- Doc 462: BRAIN company-context pattern
