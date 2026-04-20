# 454 - Agent Stack Reliability Hardening (Apr 20)

> **Status:** Research + recommendations
> **Date:** 2026-04-20
> **Goal:** Audit the VPS portal stack's reliability and identify 7 high-impact hardening improvements, with focus on the Apr 19-20 silent overnight (3 AO sessions died, no completion notifications, no failure alerts).

---

## Context

The ZAO OS portal runs on a Hostinger KVM VPS at 31.97.148.88 with:
- **Telegram bot** (`zoe-bot/bot.mjs`): slash commands `/todo`, `/done`, `/list`, `/recap`, `/focus`, Claude integration
- **Watchdog cron** (every 1 min): respawns critical tmux sessions (ao, caddy, claude, ttyd, cloudflared, spawn-server, auth-server, zoe-bot)
- **Morning brief** (5am ET): displays P0/P1 priorities + git commits
- **Evening reflect** (9pm ET): shows completed todos + tomorrow's focus
- **Test checklist ping** (every 15 min): nudges about next pending test
- **Auth server** (3005): cookie-based gate for *.zaoos.com domains
- **Spawn server** (3004): accept AO spawn requests, render UI

**Last night's incident (Apr 19 19:02 - Apr 20 05:00):** 3 AO sessions exited silently. Zaal expected either (a) merged-PR notifications or (b) failure alerts. Neither arrived. Morning brief fired at 5am but provided no alert that the stack had degraded.

---

## Top 7 Reliability Improvements (Ranked by Priority + Lift)

### 1. PR-Merge Telegram Notification (Missing Signal)

**What breaks today:**
- User ships a PR to GitHub, it merges, but ZOE never tells Zaal in Telegram. Zaal must manually check `portal.zaoos.com/todos` or GitHub to see that a task completed.
- The bot has NO connection to GitHub webhooks or polling loop. Overnight silence = invisible delivery.
- Contributes to "why is my work not showing up?" uncertainty and breaks the feedback loop (esp. critical for night-time agent work).

**Proposed fix:**
- File: `infra/portal/bin/bot.mjs`, add new section after the polling loop starts
- Add `watchPRMerges()` async function that polls `gh pr list --repo bettercallzaal/ZAOOS --state merged --search 'updated:>=<last-check-time>' --json number,title,updatedAt` every 5 minutes.
- Track last-checked timestamp in `~/.pr-merge-tracker.json` (timestamp + hash of PR numbers).
- On new merge detected, send Telegram message: "PR merged: #<number> <title>" with a one-line summary of what it shipped (via `gh pr view <number> --json body`).
- Store the merged PR list locally to deduplicate (don't spam same PR twice).

**Lift:** 8/10 (high confidence win, simple polling loop, no webhooks needed)
**Priority:** P0 (directly addresses last night's silent delivery)
**Effort:** 2/5 (90 min, reuse existing Telegram send logic)

---

### 2. AO Session Failure Alert (Exit Without PR)

**What breaks today:**
- When an AO session spawned via `/spawn` exits (success or failure), the bot has no way to know.
- Watchdog respawns the AO tmux session if the process dies, but doesn't track _why_ or notify Zaal.
- If a session crashes after 20 min of work (but before opening a PR), the result is lost and Zaal sees no alert.
- Morning brief can't see that work was attempted; todo list doesn't reflect failures.

**Proposed fix:**
- File: `infra/portal/bin/spawn-server.js`, extend the spawn handler.
- After spawning via `ao spawn --prompt <prompt>`, monitor the session's status every 30 sec via `tmux capture-pane -t <session-name> -p` or `ao info <session-id>`.
- If session state changes from WORKING to DONE or FAILED, send Telegram: "AO session <id> finished: <status>. Check <link>".
- Write session exit events to a local log file `~/ao-sessions.log` (timestamp, session-id, status, stdout tail, stderr tail).
- Have watchdog or a dedicated cron check for AO process exits and cross-reference with session log to spot crashes.

**Lift:** 7/10 (medium confidence, requires understanding AO session lifecycle, but reliable once wired)
**Priority:** P0 (prevents silent work loss)
**Effort:** 3/5 (120 min, need to poll AO API or parse logs)

---

### 3. Dead-Man Switch (Cron Tick Verification)

**What breaks today:**
- Three crons run: `watchdog.sh` (every 1 min), `test-checklist-ping.sh` (every 15 min), `start-agents.sh` (@reboot), plus morning-brief and evening-reflect (scheduled in `.claude/settings.json` on local dev machine, NOT in VPS cron).
- If ANY cron silently fails to execute (e.g., cron daemon crashes, or a cron job hangs and blocks the queue), there's no alert.
- Morning brief and evening reflect are NOT in the VPS crontab — they live in the local Claude Code environment. If Zaal's machine is off, they don't fire.
- Last night morning brief fired at 5am, but it didn't notice that the agent stack had degraded overnight.

**Proposed fix:**
- File: Create new `infra/portal/bin/deadman-check.sh` that runs every hour (cron).
- Check four markers: (1) last watchdog.log timestamp < 5 min ago, (2) last test-checklist cron.log timestamp < 20 min ago, (3) last morning-brief/evening-reflect signal in a log file, (4) `tmux list-sessions` count > 0.
- If ANY marker is stale, send Telegram alert: "DEADMAN: watchdog silent for 5+ min" or "DEADMAN: cron queue blocked".
- For morning-brief and evening-reflect, add explicit log writes to a shared file (`~/portal-state/cron-signals.log`) so the deadman check can verify they fired.

**Lift:** 8/10 (high confidence in implementation, catches a whole class of silent failures)
**Priority:** P0 (Meta-alert for any cascade failure)
**Effort:** 2/5 (60 min, straightforward shell timestamp checks)

---

### 4. Watchdog Process-Aware Respawn Coverage Gap

**What breaks today:**
- Watchdog checks if a tmux session exists OR if a process pattern matches. BUT:
  - If a process pattern like `"node.*spawn-server.js"` matches a stray node process from a previous failed spawn, watchdog won't respawn the real spawn-server.
  - If a tmux session's child process (e.g., node) dies but the tmux shell survives, the pattern check catches it — good. But if tmux AND the child both die synchronously, there's a 1-minute gap where the service is down and no one is watching.
  - The `ao start` process is complex (multi-stage init) and hard to monitor via `pgrep -f "ao start"`. If AO hits an internal error mid-init, the pattern check may not catch it.

**Proposed fix:**
- File: `infra/portal/bin/watchdog.sh`, refactor the respawn logic.
- Add a health-check function for each session: instead of just checking for a process pattern, call a lightweight health endpoint (e.g., `curl -s localhost:3004/health` for spawn-server, `curl -s localhost:3001/api/status` for AO if available).
- If health check fails, kill the session and respawn, regardless of whether the process pattern matches.
- For AO specifically, add a hardened check: `ao info <session> 2>&1 | grep -q "status.*working"` or similar (consult ao CLI docs).
- Log all respawns with reason: "respawned spawn-server: health check 500" vs "respawned spawn-server: process stray".

**Lift:** 6/10 (medium confidence; depends on each service having reliable health endpoints)
**Priority:** P1 (improves confidence in watchdog coverage, but not blocking)
**Effort:** 3/5 (90 min, need to add health checks or extend respawn logic)

---

### 5. Bot Error Handling and Telegram API Failure Resilience

**What breaks today:**
- In `bot.mjs`, the `sendMessage()` function (line 209) does `catch (e) { console.error("Send error:", e.message); }` but never bubbles the error back to the caller or retries.
- If Telegram API returns 429 (rate limit), 500 (server error), or network timeout, the message is silently dropped.
- Same for `sendTyping()` (line 235): error is swallowed with `.catch(function() {})`.
- `callClaude()` (line 238) has better error handling (returns error message to Telegram), but _other_ paths don't.
- No exponential backoff or retry logic anywhere. If the Telegram API hiccups once, the user gets no response.

**Proposed fix:**
- File: `infra/portal/bin/bot.mjs`, refactor error handling.
- Create `sendMessageWithRetry(chatId, text, maxRetries = 3)` that wraps the existing `sendMessage()` and implements exponential backoff (200ms, 500ms, 1s).
- On 429, add explicit delay (check Retry-After header from Telegram).
- On unrecoverable error (401, 403), log to a separate error file and alert once per hour to avoid spam.
- Add try-catch wrapper around the entire `poll()` loop so that a crash doesn't kill the bot (log + restart).
- Log all Telegram API calls (request + response, sanitized) to `~/zoe-bot/api.log` for debugging.

**Lift:** 7/10 (high confidence, improves stability noticeably)
**Priority:** P1 (reduces transient failures)
**Effort:** 2/5 (60 min, mostly adding retry wrapper)

---

### 6. Secrets Audit (Remaining Hardcoded References)

**What breaks today:**
- `bot.mjs` reads `TELEGRAM_BOT_TOKEN` from env (correct), but hardcodes `ALLOWED_USER = "1447437687"` (line 5). If this ID needs to change or add a second user, requires code edit.
- `auth-server.js` reads `PORTAL_PASSWORD` from env (correct), but hardcodes domain checks: `test(/^https:\/\/[a-z.-]+\.zaoos\.com(\/|$)/i)` (line 80). If TLD changes, code edit needed.
- The workspace path `/home/zaal/openclaw-workspace` is hardcoded in bot.mjs (line 6). Should be `$HOME/openclaw-workspace` from env.
- Install script assumes `~/.env.portal` exists and sources it (line 4 of install.sh), but if env var is missing at startup, the cron jobs fail silently.

**Proposed fix:**
- File: `infra/portal/bin/bot.mjs`, add env var reads at top: `const ALLOWED_USERS = (process.env.ALLOWED_USERS || "1447437687").split(",")`.
- File: `infra/portal/bin/auth-server.js`, read allowed domain from env: `const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || ".zaoos.com"`.
- File: `infra/portal/bin/bot.mjs`, replace hardcoded workspace path with `process.env.WORKSPACE || path.join(process.env.HOME, "openclaw-workspace")`.
- File: `infra/portal/install.sh`, add explicit check at the end: verify that all required env vars are set before declaring success.
- Document all required env vars in a template: `infra/portal/.env.portal.example`.

**Lift:** 5/10 (straightforward, but low risk if not done since defaults work)
**Priority:** P2 (operational hygiene, not urgent)
**Effort:** 1/5 (30 min)

---

### 7. Local Bot Test Harness (Pre-Deploy Verification)

**What breaks today:**
- There's no way to test the bot's slash commands locally before deploying to VPS.
- If a change to `/recap` logic breaks on VPS, Zaal only finds out when he calls it in Telegram.
- Morning brief and evening reflect scripts have no test harness; they're bare cron jobs with no way to dry-run.
- No mock Telegram API or message replay capability.

**Proposed fix:**
- File: Create `infra/portal/bin/test-bot-local.mjs` (Node.js test harness).
- Import the todo command handlers from `bot.mjs` and expose them as pure functions (refactor `handleTodoCommand()` to be decoupled from Telegram API).
- Use Node's built-in `assert` to test command parsing: assert `/todo foo P1` creates a todo with priority "P1", assert `/done <id>` updates status, etc.
- Create mock Telegram message objects and run through the full poll loop (minus the network call).
- For `bot.callClaude()`, mock the `execSync("claude ...")` call with fixed test responses.
- File: Create `infra/portal/bin/test-crons.sh` (bash test harness).
- Dry-run morning-brief and evening-reflect scripts with mock state files, verify output format.
- Add a pre-deploy checklist: `infra/portal/DEPLOY_CHECKLIST.md` that says "run test-bot-local.mjs before shipping to VPS".

**Lift:** 6/10 (builds confidence, enables faster iteration)
**Priority:** P1 (improves release quality)
**Effort:** 3/5 (90 min, test infra is new)

---

## Summary Table

| # | Improvement | Breaks | Fix Location | Lift | Priority | Effort |
|---|---|---|---|---|---|---|
| 1 | PR-merge notification | No signal when work ships | bot.mjs + new polling | 8/10 | P0 | 2/5 |
| 2 | AO session failure alert | Silent session crashes | spawn-server.js + logging | 7/10 | P0 | 3/5 |
| 3 | Dead-man switch cron | Cascade failures undetected | new deadman-check.sh | 8/10 | P0 | 2/5 |
| 4 | Watchdog health checks | Process pattern false negatives | watchdog.sh + endpoints | 6/10 | P1 | 3/5 |
| 5 | Bot error resilience | Transient API failures = silent drop | bot.mjs + retry logic | 7/10 | P1 | 2/5 |
| 6 | Secrets audit | Hardcoded IDs/domains | env vars in all scripts | 5/10 | P2 | 1/5 |
| 7 | Local test harness | No pre-deploy verification | new test-bot-local.mjs | 6/10 | P1 | 3/5 |

**Total effort:** ~13/35 = 13 hours of focused work to harden all 7.
**Quick wins (P0, < 3 hrs each):** #1 (PR-merge) + #3 (dead-man) = 2 hours to close the largest gaps.

---

## Cross-Reference to Doc 447

This audit complements doc 447 (agent-stack-week-improvement-sprint):
- Doc 447 focuses on **feature velocity** (context awareness, per-project memory, voice transcription).
- Doc 454 focuses on **reliability** (alerting, monitoring, error handling).
- Together: both are needed. Shipping features without hardening alerts means silent failures at scale.

Key gap doc 447 didn't address:
- No PR-merge webhook/poll (covered in #1 above).
- No AO session exit monitoring (covered in #2 above).
- No cron health verification (covered in #3 above).

---

## Incident Analysis: Apr 19-20

**Timeline:**
- 9:02pm ET (Apr 19): Last Telegram activity (test-checklist-ping sent nudge).
- ~10:00pm-11:00pm ET (estimated): 3 AO sessions exit (unknown cause).
- 5:00am ET (Apr 20): morning-brief fires, displays stale P0/P1 priorities, no alert about overnight degradation.
- ~7:00am ET: Zaal notices silence, checks portal manually, finds sessions gone.

**Root cause:** No monitoring between cron ticks. Watchdog respawned the ao tmux session, but:
1. The new session is empty (no work in progress).
2. Zaal has no signal that work was lost.
3. Morning brief didn't notice the gap (it only reports git log and open PRs, not session health).

**Prevention via this doc's fixes:**
- #2 (AO failure alert) would've caught the exit and sent "Session <id> crashed" at 10pm.
- #3 (dead-man check) would've detected that morning-brief had no prior cron signal and alerted.
- #1 (PR-merge) would've shown merged PRs from before the crash, providing context.

---

## Implementation Order (Recommended)

Ship in this order (highest ROI first):
1. **Week 1 (P0 quick wins):** #1 PR-merge notification (2 hrs) + #3 dead-man switch (2 hrs) = visible improvement overnight.
2. **Week 2 (P0 depth):** #2 AO failure alert (3 hrs) + #5 bot error resilience (2 hrs) = confidence in agent health.
3. **Week 3 (P1 polish):** #4 watchdog health checks (3 hrs) + #7 test harness (3 hrs) + #6 secrets audit (1 hr).

---

## Success Criteria (After All 7 Ship)

1. Telegram receives PR-merge notifications within 5 min of merge (verify by opening a test PR, merging it, checking bot response).
2. Any AO session exit sends an alert to Telegram within 30 sec (verify by spawning a session, killing it, checking alert).
3. Cron tick checker fires every hour and alerts if any cron > 90 sec stale (verify by inspecting cron.log timestamps).
4. Watchdog respawns services based on health checks, not just process patterns (verify by crashing a service and confirming respawn within 60 sec).
5. Telegram API failures (rate limit, timeout) are retried with backoff, user gets a response (verify by rate-limiting the API and sending a command).
6. All secrets are env-var driven with sensible defaults (verify by reading each script's top 10 lines for hardcoded values).
7. Test harness runs pre-commit, catches command handler bugs (verify by intentionally breaking a slash command and running tests).

---

## Sources

- Doc 447: Agent Stack 7-Day Improvement Sprint
- VPS codebase: `/infra/portal/bin/` (watchdog.sh, bot.mjs, spawn-server.js, auth-server.js, morning-brief.sh, evening-reflect.sh, test-checklist-ping.sh)
- VPS codebase: `/infra/portal/install.sh` (cron setup, env sourcing)
- Incident: Apr 19 19:02 - Apr 20 05:00 ET (3 AO sessions exited, no alerts, no PR-merge notifications)
