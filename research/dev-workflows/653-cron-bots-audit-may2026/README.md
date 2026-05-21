---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-21
original-query: Full inventory of every scheduled job and every running bot across local + Vercel + VPS 1 - surface dead zombie crash-looping and silent-failing units (reconstructed)
related-docs: 422, 459, 547, 601, 652
tier: STANDARD
---

# 653 - Cron Jobs + Bots Audit (May 2026)

> **Goal:** Full inventory of every scheduled job and every running bot across local + Vercel + VPS 1. Surface dead, zombie, crash-looping, and silent-failing units. One source of truth before adding more (Doc 652 routine plan, future Hermes/imanagent additions).

## Recommendations First

| # | Action | Severity | Owner | Reason |
|---|---|---|---|---|
| 1 | **DISABLE `paperclipai.service`** on VPS or fix the underlying `npx paperclipai run` failure | **CRITICAL** | @Zaal | systemd restart counter at **107,478** as of audit time. Crash-restart every ~10s for what looks like weeks. Burning CPU + log volume + masking other issues. Per `project_paperclip_infra.md` it powers paperclip.zaoos.com — confirm whether that endpoint is still wanted. If yes, fix doctor-check failure. If no, `systemctl --user disable --now paperclipai.service`. |
| 2 | **FIX or DELETE `zaoos-crons.sh`** (3 jobs hitting `www.zaoos.com/api/cron/*` with `CRON_SECRET`) | **HIGH** | @Zaal | `/tmp/zaoos-cron.log` shows dozens of `{"error":"Unauthorized"}` responses. The 64-char `CRON_SECRET` in `/home/zaal/zaoos-crons.sh` no longer matches what `www.zaoos.com` expects (rotated env var?). 3 daily jobs (follower-snapshot 6am, daily-digest 2am, health-snapshot Sun 0am) all silently 401-ing. Either rotate secret + redeploy, or kill the cron lines. |
| 3 | **DELETE `nightly-research.sh` cron** (`0 8 * * *`) | **HIGH** | @Zaal | Script references `docker exec openclaw-openclaw-gateway-1 openclaw agent` (decommissioned 2026-05-04 per `project_hermes_canonical.md`) AND uses MiniMax as primary (rejected per Hermes canon - Claude Sonnet via Hermes is the path). Plus wrong repo path (`/home/zaal/openclaw-workspace/ZAOOS` vs actual `/home/zaal/zao-os`). Either rewrite for Hermes/Claude or delete. |
| 4 | **DELETE 5 zombie `zaostock _send_digest.mjs` crons** (lines `7 10 4 5 *` ... `23 14 4 5 *`) | **MEDIUM** | @Zaal | These were a one-off May 4 2026 send (all 5 ran OK that day - last log `2026-05-04T14:23:02Z`). Cron schedule `4 5 *` = May 4 EVERY YEAR. Will fire again May 4 2027 unattended. Remove from crontab. |
| 5 | **DELETE `send-coc4.sh` cron** (`0 13 11 4 *` = April 11 every year) | **MEDIUM** | @Zaal | Same pattern - one-off COC4 promo blast leftover. Will re-fire annually. Remove. |
| 6 | **FORMALLY DECOMMISSION `zao-devz-stack.service`** | **MEDIUM** | @Zaal | Service exited clean status=0 on 2026-05-15 18:18 UTC, has not restarted. Per `project_hermes_canonical.md` + `CLAUDE.md` "ZAO Devz Phase 3 fold-in to Hermes pending" - matches reality. Disable systemd unit (`systemctl --user disable zao-devz-stack`), remove from `~/.config/systemd/user/`, update docs. Currently still `enabled` so a reboot would resurrect a dead bot. |
| 7 | **AUDIT `pixel-startup.sh @reboot` cron** | **MEDIUM** | @Zaal | Runs `docker exec -d openclaw-openclaw-gateway-1 ...` on every boot. openclaw container is decommissioned. Also starts `zoe-dashboard` at port :3001 - confirm if that dashboard is still wanted. Remove openclaw block, keep zoe-dashboard if used, otherwise delete entire script + cron line. |
| 8 | **DEDUPE zaostock-bot internal schedulers** | **MEDIUM** | @Zaal | `bot/src/schedule.ts` (morning 6am, evening 6pm, week-ahead Mon 9am, friday retro Fri 5pm) AND `bot/src/zoe/scheduler.ts` (separate 4 crons) both load. Two schedulers in one process. Pick one. Likely `schedule.ts` is the ZAOstock-domain one and `zoe/scheduler.ts` is leftover from when zaostock-bot was forked from zoe-bot. |
| 9 | **CONFIRM Vercel cron handlers (vault/banker/dealer trading agents) are still wanted** | **LOW** | @Zaal | `vercel.json` runs 3 daily trading agents at 6am/2pm/10pm UTC. Code lives in `src/lib/agents/`. Memories (`project_agent_squad_dashboard.md`) reference them as alive. Verify last run logs in Vercel dashboard, confirm no zombie runs. |
| 10 | **WIRE Doc 652 `/inbox` routine** | LOW | @Zaal | Once items 1-3 are done, add the daily 6:30 ET inbox-digest Claude Routine per Doc 652. |

## Complete Inventory

### Tier 1: Local (Zaal's Mac)

```
~/Library/LaunchAgents/:  18 third-party agents (Perplexity Comet,
                          Meld Studio, Dropbox updater, Google Keystone,
                          ollama, postgres@15) — NONE ZAO/ZOE/CLAW related.
~/crontab:                empty (no user crontab)
/Library/LaunchDaemons/:  none matching zao/zoe/claw/bcz/claude/hermes/wave/coc
```

**Verdict:** Local Mac is clean. All ZAO automation runs on VPS or Vercel.

### Tier 2: Anthropic Cloud (Claude Routines)

```
CronList output: "No scheduled jobs."
```

**Caveat:** `CronList` only enumerates jobs created via `CronCreate` in the current Claude Code session. The actual Claude Routines list (Doc 422) lives at `claude.ai/code/routines` and is not visible to this CLI. Per Doc 422 migration order, the queue is:

| # | Routine | Status |
|---|---|---|
| 1 | `/morning` cloud version (daily 6am ET) | **Not yet stood up** |
| 2 | `/inbox` cloud digest (daily 6:30am ET) | **Doc 652 designed, not yet stood up** |
| 3 | `/newsletter` | Not yet stood up |
| 4 | `/socials` | Not yet stood up |
| 5-10 | ZOE nightly / WaveWarZ / ZABAL swarm / research-digest / fractal-weekly / ZAOstock countdown | All not yet stood up |

**Verdict:** Zero Claude Routines live. Doc 422 (2026-04-17) is still aspirational. Build out blocked behind cleanup of legacy VPS crons first (this audit).

### Tier 3: Vercel (`vercel.json`)

| # | Path | Schedule (UTC) | What | Status |
|---|---|---|---|---|
| 1 | `/api/cron/agents/vault` | `0 6 * * *` daily 6am | VAULT autonomous trading agent | Active per config - **verify last run in Vercel dashboard** |
| 2 | `/api/cron/agents/banker` | `0 14 * * *` daily 2pm | BANKER autonomous trading agent | Active per config - **verify** |
| 3 | `/api/cron/agents/dealer` | `0 22 * * *` daily 10pm | DEALER autonomous trading agent | Active per config - **verify** |

Code: `src/lib/agents/{vault,banker,dealer}.ts` + `src/lib/agents/runner.ts`. Per CLAUDE.md "Boundaries" - "Ask first: Changes to agent trading parameters." Do not touch unless explicit.

**Other cron route handlers in `src/app/api/cron/` (NOT in `vercel.json`):**

| Path | Status |
|---|---|
| `/api/cron/daily-digest` | Called from VPS via `zaoos-crons.sh daily-digest`. **Returning `{"posted":false,"reason":"No activity today"}` and earlier `{"error":"Unauthorized"}`.** |
| `/api/cron/follower-snapshot` | Called from VPS via `zaoos-crons.sh follower-snapshot`. **401 Unauthorized in logs.** |
| `/api/cron/health-snapshot` | Called from VPS via `zaoos-crons.sh health-snapshot`. **401 Unauthorized in logs.** |
| `/api/cron/engagement-collect` | Route exists, no caller wired. **Orphan.** |
| `/api/cron/weekly-reflection` | Route exists, no caller wired. **Orphan.** |
| `/api/cron/zounz-events` | Route exists, no caller wired. **Orphan** (also see CLAUDE.md "don't pre-read zounz/"). |
| `/api/wavewarz/sync` | Called via `zaoos-crons.sh wavewarz-sync` nightly 11pm. **Status: 401 likely (uses same secret).** |

**Verdict:** Trading agents on Vercel cron config are intentional. The other 4 routes are called from VPS cron with a stale `CRON_SECRET` and silently 401. Either rotate the secret or move the routes to Vercel `crons` config (cleaner).

### Tier 4: VPS 1 — Root Crontab (`zaal@31.97.148.88`)

**Active jobs (10):**

| Line | Schedule | Command | Status |
|---|---|---|---|
| 1 | `0 0 * * 0` Sun 0am | `zaoos-crons.sh health-snapshot` | **401 failing** |
| 2 | `0 13 11 4 *` Apr 11 annually | `zoe-bot/send-coc4.sh` | **Zombie - one-off leftover** |
| 3 | `0 2 * * *` daily 2am | `zaoos-crons.sh daily-digest` | **401 failing / "no activity"** |
| 4 | `0 23 * * *` daily 11pm | `zaoos-crons.sh wavewarz-sync` | **Likely 401 failing** |
| 5 | `0 6 * * *` daily 6am | `zaoos-crons.sh follower-snapshot` | **401 failing** |
| 6 | `0 8 * * *` daily 8am UTC (3am ET) | `nightly-research.sh` | **Dead infra refs (openclaw + MiniMax)** |
| 7 | `@reboot` | `pixel-startup.sh` | **Partially dead (openclaw refs)** |
| 8 | `* * * * *` every min | `auto-sync.sh` | **Healthy** — git pull + tmux respawn |
| 9-13 | `7-23 10-14 4 5 *` May 4 annually | `zaostock _send_digest.mjs 1-5` | **5 zombies - one-off leftover** |

**Commented-out / decommissioned (8):** All correctly disabled per recent cleanup:
- morning-brief.sh (replaced by zoe-bot.service)
- evening-reflect.sh (replaced by zoe-bot.service)
- archive-ao-sessions.sh (AO decommissioned)
- patch-ao-plugin.sh (AO decommissioned)
- zoe-learning-pings (Doc 601)
- start-agents.sh (AO/openclaw)
- watchdog.sh (disabled for test - may want to revive?)
- test-checklist-ping.sh (doc 601)
- session-watcher.mjs (Hermes session unused)

### Tier 5: VPS 1 — systemd User Units

| Unit | Status | What | Health |
|---|---|---|---|
| `zoe-bot.service` | **active (running)** since 2026-05-15 10:07 UTC | ZOE concierge (`bot/src/zoe`), Hermes-brain pattern | **Healthy.** Memory 68.6M, CPU 3min/35h. Logs show "[zoe/scheduler] hourly nudge sent" - internal node-cron working. |
| `zaostock-bot.service` | **active (running)** since 2026-05-12 12:27 UTC | @ZAOstockTeamBot Telegram bot | **Healthy.** Memory 83.5M. Last log "[schedule] evening skipped - no activity to recap" - the digest is firing but ZAOstock activity is quiet. |
| `cloudflared.service` | **active (running)** | ZAO agents + paperclip tunnels | **Healthy.** Carrier for paperclip.zaoos.com + ao.zaoos.com. |
| `paperclipai.service` | **activating (auto-restart)** Result: **exit-code 1** | Paperclip AI Agent Orchestrator | **CRITICAL CRASH LOOP** - restart counter **107,478**. Manual run of `start-paperclip.sh` reaches "Running doctor checks..." then exits. Needs investigation or disable. |
| `zao-devz-stack.service` | **inactive (dead)** since 2026-05-15 18:18 UTC | ZAO Devz dual-bot (Coder + Critic) | **Clean stop, not restarting.** Unit still `enabled` → reboot would resurrect. Per Hermes canon should be formally decommissioned. |

### Tier 6: Internal node-cron Schedules (Inside Running Bots)

**zaostock-bot (`bot/src/schedule.ts`)** - 4 schedules, all `America/New_York`:

| Schedule | Job |
|---|---|
| `0 6 * * *` | morning digest |
| `0 18 * * *` | evening recap |
| `0 9 * * 1` | week-ahead Monday 9am |
| `0 17 * * 5` | Friday retro 5pm |

**zaostock-bot (`bot/src/zoe/scheduler.ts`)** - 4 MORE schedules in same process. **Likely duplicates - see Recommendation #8.**

**zoe-bot (`/home/zaal/zao-os/bot/src/zoe/scheduler.ts`)** - 3+ cron.schedule calls + `[zoe/scheduler] hourly nudge sent (hour=17)` confirms hourly tick. **Healthy.**

### Tier 7: Telegram Bots (Source of Truth)

| Bot Handle | Service | Status | Where |
|---|---|---|---|
| **@zaoclaw_bot** (ZOE concierge) | `zoe-bot.service` | **HEALTHY** | VPS 1, hermes-brain, persona at `~/.zao/zoe/persona.md` |
| **@ZAOstockTeamBot** | `zaostock-bot.service` | **HEALTHY** | VPS 1, MiniMax LLM + node-cron, see `project_zaostock_bot_live.md` |
| **@zaodevz_bot** (ZAO Devz) | `zao-devz-stack.service` | **DEAD (folded into Hermes per canon)** | VPS 1, unit still enabled but service stopped |
| **@zoe_hermes_bot** (Hermes auto-PR) | (folded into `zoe-bot` per hermes canonical memory) | **N/A as separate process** | code at `bot/src/hermes/` |
| **@zabal_bonfire** (Bonfire knowledge graph) | external SaaS (bonfires.ai Genesis tier) | **Out of scope** for this audit | bonfires.ai infra |
| **imanagent** (cowork-zaodevz) | not built yet | Planned per Doc 650 | Iman's VPS (separate box) |

## Concrete Cleanup Diff (Proposed crontab)

For Recommendation 2-7, the cleaned-up VPS root crontab would look like:

```cron
# ZAO OS VPS cron — cleaned 2026-05-16 per Doc 653 audit

# === Live + healthy ===
* * * * * /home/zaal/bin/auto-sync.sh >> /home/zaal/.claude/auto-sync.log 2>&1

# === Conditional: keep only if CRON_SECRET rotated + endpoints confirmed live ===
# 0 0 * * 0 /home/zaal/zaoos-crons.sh health-snapshot >> /tmp/zaoos-cron.log 2>&1
# 0 2 * * * /home/zaal/zaoos-crons.sh daily-digest    >> /tmp/zaoos-cron.log 2>&1
# 0 23 * * * /home/zaal/zaoos-crons.sh wavewarz-sync  >> /tmp/zaoos-cron.log 2>&1
# 0 6 * * * /home/zaal/zaoos-crons.sh follower-snapshot >> /tmp/zaoos-cron.log 2>&1

# === Conditional: keep only if pixel-dashboard / zoe-dashboard still wanted ===
# @reboot /home/zaal/pixel-startup.sh >> /tmp/pixel-startup.log 2>&1

# === DELETED (one-off zombies) ===
# 0 13 11 4 * /home/zaal/zoe-bot/send-coc4.sh                              # COC4 promo one-off
# 7-23 10-14 4 5 * cd /home/zaal/zaostock-bot && node _send_digest.mjs N   # May 4 digest x5

# === DELETED (dead infra refs) ===
# 0 8 * * * /home/zaal/nightly-research.sh   # openclaw container gone, MiniMax deprecated
```

Roughly 75% reduction in active scheduled work, with the survivors actually doing what they claim.

## Sources

- VPS SSH session 2026-05-16: `systemctl --user list-units`, `crontab -l`, `journalctl --user -u <bot>`
- Local: `crontab -l`, `ls ~/Library/LaunchAgents/`
- Vercel: `vercel.json` + `src/app/api/cron/` directory listing
- `bot/src/schedule.ts` (this repo)
- VPS file inspection: `/home/zaal/{nightly-research,zaoos-crons,bin/auto-sync,pixel-startup}.sh`, `/home/zaal/.local/bin/start-paperclip.sh`
- Memories: `project_zoe_soul_architecture`, `project_hermes_canonical`, `project_zaostock_bot_live`, `project_paperclip_infra`, `project_cowork_zaodevz`, `project_agent_squad_dashboard`
- `CLAUDE.md` "Primary Surfaces (post-doc-601 cleanup, 2026-05-04)"

## Also See

- [Doc 422](../422-claude-routines-zao-automation-stack/) - The Claude Routines plan that's still aspirational
- [Doc 459](../../agents/) - Original VPS automation context
- [Doc 547](../../) - Cassie 4/28 validation that infra IS the product
- [Doc 601](../../music/601-suno-music-generation-deep-tooling-2026/) - Source for several decommission decisions referenced here
- [Doc 652](../652-inbox-gmail-bridge-morning-trigger/) - Sibling: the inbox routine that should slot in once cleanup is done

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide paperclipai: fix or `systemctl --user disable --now` | @Zaal | Decision + 1 command | Today (107k restarts is on fire) |
| Rotate or remove `CRON_SECRET` in `zaoos-crons.sh` after checking what `www.zaoos.com` expects | @Zaal | Env + crontab edit | This week |
| `crontab -e`: delete 5 zaostock May-4 digest lines + 1 send-coc4 line | @Zaal | crontab edit | This week |
| Delete or rewrite `nightly-research.sh` (openclaw + MiniMax dead) | @Zaal | Script edit + crontab | This week |
| `systemctl --user disable zao-devz-stack.service` + remove unit file | @Zaal | systemctl | This week |
| Audit `pixel-startup.sh`: remove openclaw block, keep zoe-dashboard if wanted | @Zaal | Script edit | This week |
| Pick one of zaostock-bot's two schedulers (`bot/src/schedule.ts` vs `bot/src/zoe/scheduler.ts`); delete the other | @Zaal | Code edit + PR | This week |
| Verify Vercel trading-agent crons last-run in dashboard | @Zaal | Check | Optional sanity |
| Add Doc 652 inbox-digest Claude Routine after cleanup lands | @Zaal | Routine setup | After items above |
| Re-run this audit quarterly (next: 2026-08-16) | @Zaal | Re-audit | Quarterly cadence |
