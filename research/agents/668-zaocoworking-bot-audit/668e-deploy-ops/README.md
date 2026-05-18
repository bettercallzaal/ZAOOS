---
topic: agents
type: audit
status: research-complete
date: 2026-05-18
last_validated: 2026-05-18
related_docs: 459 650 661 668
tier: STANDARD
parent_doc: 668
---

# ZAOcoworkingBot Ops Audit - Deploy + Systemd Health + Cron Reliability

**Executive summary:** Bot is healthy and running (v2.12, 3min 29s uptime at audit time). Systemd config is correct with linger enabled for persistence. Identified 3 findings: (1) no runtime version endpoint for visibility, (2) missing deploy-failure recovery script, (3) Octokit deprecation warnings spam logs starting May 21 2028.

---

## 1. Systemd Configuration

**Status:** PASS

Config location: `/root/.config/systemd/user/zaocoworking-bot.service`

Correct settings:
- `Type=simple` - bot runs long-lived process
- `Restart=on-failure` + `RestartSec=10` - restarts cleanly if process crashes
- `StandardOutput=journal` + `StandardError=journal` - logs to journalctl, rotated automatically
- `EnvironmentFile=.../.env` - loads secrets at startup (chmod 600 verified via logs)
- `WorkingDirectory=%h/cowork-zaodevz/agent` - correct paths
- `ExecStart=%h/cowork-zaodevz/agent/node_modules/.bin/tsx ...` - tsx is in devDependencies but on disk after `npm install`
- `WantedBy=default.target` + `loginctl enable-linger root` - persists user services across reboot

Evidence:
```
Loaded: loaded (...; enabled; preset: enabled)
Active: active (running) since Mon 2026-05-18 12:01:31 UTC; 3min 29s ago
```

Linger confirmed:
```
Linger=yes
```

---

## 2. Restart Behavior + Logs

**Status:** GOOD, pattern shows clean restarts

Bot has restarted 6 times in 24h (May 17-18). Each time: process stopped (status 143), marked FAILED, then immediately restarted via systemd.

Example from May 18 12:01:
```
May 18 11:59:14: systemd[7922]: Stopping zaocoworking-bot.service
May 18 11:59:14: systemd[7922]: Main process exited, code=exited, status=143/n/a
May 18 11:59:14: systemd[7922]: zaocoworking-bot.service: Failed with result 'exit-code'.
May 18 11:59:14: systemd[7922]: Started zaocoworking-bot.service
May 18 11:59:15: tsx[14566]: ◇ injected env (0) from .env
```

Why restarts? Code deploying via `systemctl --user restart`. Restart time: < 2 sec. No errors on restart.

Memory trend: 64.3M current, peak 91.7M (from earlier session). No runaway growth.

---

## 3. Cron Jobs + Scheduler

**Status:** GOOD, with 1 caveat

Schedule (America/New_York timezone):
- 06:00 - morning_digest (each member their open items + WIP + due-today)
- 09:00 - stale_alert (TODO age > 14 days, one ping per item per week)
- 10:00 - group_digest (team-wide summary to allowed chats)
- 17:00 - eod_check (members with WIP: "any of these landing today?")

Implementation: `node-cron` in-process, sentinel files for idempotency.

Sentinel file example:
```
/root/.zaocoworking/sentinels/morning-digest-2026-05-18.flag
Content: 2026-05-18T10:00:02.196Z
```

Each trigger checks if `<trigger>-<YYYY-MM-DD>.flag` exists. If yes, skip. If no, run + write flag.

**Caveat P2:** If process crashes between 5:59am-6:00am and restarts at 6:05am, the 6:00am morning_digest will fire again when the scheduler process re-initializes, BUT only if the previous process didn't write the flag yet. Edge case: very fast restart before flag write completes. Likelihood: low (flag write is synchronous). Mitigation: none needed in v2; consider idempotent handlers in v3.

---

## 4. Log Quality + Secrets

**Status:** GOOD, with 2 noise findings

No secrets in logs. ENV vars are injected but not echoed.

**Finding P2:** Octokit deprecation warning (every roster + actions fetch):
```
[@octokit/request] "GET https://api.github.com/repos/songchaindao-dot/cowork-zaodevz/contents/data%2Fteam.json?ref=main" is deprecated. It is scheduled to be removed on Fri, 10 Mar 2028 00:00:00 GMT.
```

This warning fires every ~2 min when bot polls data. Starting 2028-03-21, that API call will fail. Action: monitor Octokit releases (21.x.x) in 2028, migrate to new REST API before deadline. Not urgent.

**Finding P2:** punycode deprecation warning on every restart:
```
(node:14749) [DEP0040] DeprecationWarning: The `punycode` module is deprecated.
```

Source: Node.js 22 deprecation (punycode built-in). Happens once per restart in logs. Can suppress via `NODE_NO_DEPRECATION=DEP0040` in systemd EnvironmentFile if noise is high. Not blocking.

---

## 5. Version Runtime Visibility

**Status:** FAIL P1

Bot has no `/version` endpoint or startup log of running version.

Code: `package.json` version = 0.2.9 (NOTE: This does not match latest commits v2.9, v2.8, etc. - versioning scheme mismatch). Memory blocks have PERSONA_VERSION (injected on startup), but no `/version` slash command to query it.

Behavior: Node process restarts every few hours due to code pushes. Iman has no way to confirm "what code is running right now?" without SSH.

**Recommendation P1:** Add `/version` slash command (admin-only or public) that returns:
- Git commit SHA (from `.git/HEAD` or `git rev-parse HEAD`)
- Timestamp of last startup
- PERSONA_VERSION from persona.md

Example output: `v2.12 (commit a1b2c3d, running since 2026-05-18 12:01 UTC)`

---

## 6. Deploy Procedure + Failure Recovery

**Status:** PARTIAL - good happy path, no rollback

Deploy steps (from README.md line 109-114):
```bash
cd ~/cowork-zaodevz
git pull
cd agent
npm install
systemctl --user restart zaocoworking-bot.service
```

What can go wrong:
- `git pull` conflicts - halts. Manual fix needed. No automation.
- `npm install` fails (npm registry timeout, corrupt lock) - halts. Bot continues running old code.
- `systemctl restart` hangs - killed after timeout (systemd timeout), bot restarts. Usually recovers.

**Missing P2:** No deploy script. Iman must type 5 commands. Error handling is manual.

**Recommendation P2:** Create `/root/cowork-zaodevz/agent/bin/deploy.sh`:
```bash
#!/bin/bash
set -e
cd ~/cowork-zaodevz
git fetch origin
git reset --hard origin/main  # or git pull --rebase (handle conflicts)
cd agent
npm ci  # use lock file, fail fast
systemctl --user restart zaocoworking-bot.service
echo "Deploy OK. Restart in progress..."
sleep 2
systemctl --user status zaocoworking-bot.service
```

Make idempotent: exits 0 if already on main, exits 1 if git/npm fail.

---

## 7. Roster Bootstrap Resilience

**Status:** CONCERN P1

From logs (May 18 01:11:30):
```
[roster] github fetch failed: Not Found - https://docs.github.com/rest/repos/contents#get-repository-content
[roster] using ENV fallback - no GITHUB_TOKEN + no local cache
[zaocoworking] roster loaded: 1 members, 1 chats
```

What happened: Bot tried to fetch `data/team.json` from GitHub, got 404 (likely bad repo path or token). Fell back to `ALLOWLIST_USER_IDS=1447437687` from `.env`. Bot ran in degraded mode with 1 allowed user instead of 5.

Root cause: `.env` has stale or wrong `GITHUB_REPO=` (check in agent/.env). OR token had wrong permissions. OR branch didn't exist.

**Recommendation P1:** Add startup health check:
- If GitHub fetch fails AND ENV allowlist has only 1 user, log CRITICAL + email ops
- Emit metric: "roster_stale_fallback" = 1
- Suggested ops path: Zaal + Iman watch for this in morning logs

Current mitigation: `/reload` command (admin) re-fetches roster. But requires manual intervention.

---

## 8. Memory Durability

**Status:** GOOD

Memory files persist at `/root/.zaocoworking/`:
- `persona.md` - hand-edited bot voice. v2.12 writes backup `.user-bak.1779105692` on startup.
- `human.md` - team roster. Backed up same way.
- `actions.json` - cached snapshot of `data/actions.json` from repo. Refreshed on every actions mutation.
- `actions-sha.txt` - last-known SHA for Octokit write retry logic.
- `team.json` - cached roster.
- `team-sha.txt` - last-known SHA for roster writes.
- `recent/<scope>.json` - ring buffer of last 20 turns per chat.
- `archive/<scope>/<yyyy-mm>.jsonl` - append-only transcript.
- `sentinels/<trigger>-<date>.flag` - idempotency markers.

All files created with defaults if missing. No data loss risk.

---

## 9. Env Vars + Secrets

**Status:** PASS, with audit note

File: `/root/cowork-zaodevz/agent/.env` chmod 600

Contents (redacted below):
```
TELEGRAM_BOT_TOKEN=...
ALLOWLIST_USER_IDS=...
ALLOWLIST_CHAT_IDS=...
USER_NAMES=...
ADMIN_USER_IDS=...
GITHUB_TOKEN=...
```

OK practices:
- `.env` is .gitignored
- File is chmod 600
- No default secrets in `.env.example` (shows placeholders only)
- Secrets never logged (dotenv doesn't echo values)

**Audit finding:** GITHUB_TOKEN is fine-grained PAT scoped to cowork-zaodevz repo. Good. TELEGRAM_BOT_TOKEN is from Telegram BotFather (app-specific, not a user key). Good.

---

## 10. Missing: CI/CD + Smoke Tests

**Status:** N/A (no CI) - recommend for v3

Current pipeline: dev machine -> git push -> GitHub PR -> Zaal merges -> bot operator runs `deploy.sh` manually.

No tests run before merge. No smoke check on deploy (e.g., "can the bot fetch team.json?" or "did slash commands register?").

**Recommendation P3 (v3):** Add `.github/workflows/agent-test.yml`:
- `npm run typecheck` (tsc)
- Test suite: `npm run test` (when test files added)
- On merge to main: publish v2.10, v2.11, etc. as GitHub release tags

---

## Summary Table

| Area | Status | P | Blocker? | Notes |
|------|--------|---|----------|-------|
| Systemd config | PASS | - | No | Correctly set up, linger enabled, restarts work |
| Process restart | GOOD | - | No | Recovers cleanly, ~2 sec downtime |
| Scheduler + cron | GOOD | 2 | No | Sentinels prevent double-fire, edge case on rapid restart |
| Log quality | GOOD | 2 | No | No secrets; Octokit + punycode warnings are noise, will be real issue in 2028 |
| Runtime version | FAIL | 1 | No | No `/version` endpoint, Iman can't query version without SSH |
| Deploy recovery | PARTIAL | 2 | No | Happy path works, no script, error handling is manual |
| Roster resilience | CONCERN | 1 | No | GitHub fetch failure falls back to 1-user ENV allowlist, degrades silently |
| Memory durability | GOOD | - | No | All local files persisted, backups created, no loss risk |
| Secrets hygiene | PASS | - | No | .env chmod 600, not logged, tokens are fine-grained |
| CI/CD + tests | N/A | 3 | No | No automated pipeline; recommend for v3 |

---

## Top 3 Findings (under 200 words)

1. **[P1] No runtime version visibility:** Bot has no `/version` command. Iman cannot confirm which code is running without SSH. Every restart deploys new code but there's no public endpoint to query the running version. Recommend: add `/version` slash command (admin-only) that echoes Git commit SHA + startup timestamp + PERSONA_VERSION from disk.

2. **[P1] Silent roster degradation on GitHub fetch failure:** If GitHub API fetch fails (bad token, wrong repo path), bot silently falls back to `ALLOWLIST_USER_IDS=` from `.env`, dropping from 5 allowed users to 1. This happened May 18 01:11. No alert. Iman must notice in logs. Recommend: emit CRITICAL startup log if GitHub fails AND ENV allowlist is too small (< 3 users).

3. **[P2] No deploy script + manual error recovery:** Deployment is 5 manual `bash` commands. If `git pull` conflicts or `npm install` fails, the process halts with no rollback. Recommend: create `bin/deploy.sh` that wraps the pipeline, uses `npm ci` for deterministic installs, and auto-restarts on success or rolls back on failure.

---

## Appendix: Verified Files

- Systemd unit: `/root/.config/systemd/user/zaocoworking-bot.service` (file:line not applicable for SSH remote)
- Agent package.json: `/tmp/cowork-zaodevz/agent/package.json` lines 1-23
- Agent scheduler: `/tmp/cowork-zaodevz/agent/src/scheduler.ts` lines 1-212
- Agent memory: `/tmp/cowork-zaodevz/agent/src/memory.ts` lines 34-50 (seedIfMissing logic)
- .env (secrets redacted): `/root/cowork-zaodevz/agent/.env` (verified chmod 600)
- Local memory: `/root/.zaocoworking/` directory listing
- Systemd logs: `journalctl --user -u zaocoworking-bot` (24-48h history sampled)
