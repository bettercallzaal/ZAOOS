---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-10-10
related-docs: 661, 663, 677
tier: STANDARD
---

# 683d - Infra + VPS Ops Automation

> **Goal:** Audit VPS 1 (imanagent, 187.77.3.104) + VPS 2 (openclaw, 31.97.148.88) infrastructure. Identify deployment automation gaps, secret/env management fragility, systemd unit duplication, and consolidation wins. Model: GitHub Actions (doc 677), minimize hand-SSH deploys. Outcome: safe, auditable, one-command deploy pipeline for all ZAO bots.

## Current State Snapshot (2026-05-20)

### VPS 1 (187.77.3.104) - "imanagent"

- 1 active systemd --user service: `zaocoworking-bot.service`
- 4 git clones on disk:
  - `~/bonfire-ingest-scripts/` (no origin tracked)
  - `~/cowork-zaodevz/` -> https://github.com/songchaindao-dot/cowork-zaodevz.git
  - `~/zaoos-research/`
  - `~/zaoscribe/` -> https://github.com/bettercallzaal/zaoscribe.git
- Env management: hand-edited `.env` file via SSH `nano`, Supabase service role key + Telegram token synced via `bash bot/scripts/sync-supabase-env.sh`
- systemd unit installed manually: `cp bot/systemd/zaostock-bot.service ~/.config/systemd/user/`
- Deploy flow: SSH -> git pull -> npm install -> `systemctl --user restart <service>`
- Log access: `journalctl --user -u <service> -f` on VPS
- No auto-deploy on GitHub push

### VPS 2 (31.97.148.88) - "openclaw"

- Not key-accessible from this session; config unknown
- Docker-based (from earlier audit context)
- Likely running portal containers, agents, OpenAO

### VPS 1 "Portal" Infrastructure (infra/portal/)

- Dual-clone design: `~/zao-os/` (deploy repo) + `~/openclaw-workspace/zaoos` (dev clone)
- **Auto-sync pattern** via `infra/portal/bin/auto-sync.sh`: runs every minute from cron, idempotent, does 3 things:
  1. `git pull --ff-only` on both clones (skip if not on main or dirty)
  2. Re-runs `infra/portal/install.sh` if install/sync files changed (refreshes symlinks + crontab)
  3. Detects hash changes on hot bot files; kills tmux session to force watchdog respawn
- **watchdog.sh**: monitors tmux sessions + pgrep patterns, restarts dead processes
- **install.sh**: one-shot setup - symlinks, downloads binaries (ao, ttyd, caddy), seeds crontab
- Per-minute cron entries:
  - `watchdog.sh` (keep processes alive)
  - `auto-sync.sh` (pull + reinstall + bounce)
  - `session-watcher.mjs` (every 2 min, watches AO session maturity)
  - `test-checklist-ping.sh` (every 15 min)
- 6 branded bots (zoe-bot, spawn-server, auth-server, zoe-devz-bot, etc.) run in tmux sessions as the `zaal` user
- systemd unit templates: **NONE** - each bot has a separate tmux session + pgrep pattern in watchdog

### Env/Secret Management

- `.env.local` on dev (ZAOOS root) pulled into VPS via `sync-supabase-env.sh`
- Script reads plain text from `.env.local`, SSHs into VPS, pipes variables into `bash -c` to write `.env`
- **Risk:** 2026-05-20 note in rules/secret-hygiene.md - a Telegram token was leaked into chat during earlier SSH session
- No GitHub Actions secrets storage; all keys live on VPS `.env` files
- `.env` files are chmod 600 but not tracked; backups created on update but no rotation policy

### systemd Units

Exist in repo at:
- `bot/systemd/zaostock-bot.service` (basic npm start)
- `bot/systemd/zao-team-bots.service` (tsx entry point)

**Pattern:** both hardcode `WorkingDirectory=%h/zaostock-bot` + `EnvironmentFile=%h/zaostock-bot/.env`. No templating; copy-paste duplication.

### GitHub Actions Status

- 2 workflows exist:
  - `sync-to-paperclip.yml` (issue sync, unrelated)
  - `ci.yml` (linting/type checks on PR)
- **Missing:** deploy-on-push, auto-pull-on-merge, secret scanning in CI
- cowork-zaodevz has zero workflows; doc 677 spec ready to ship

### One-Click Deploy Scripts

- `bot/scripts/install-bot-service.sh` - copies systemd unit + enables + restarts (requires manual beforehand: npm install + .env filled)
- `bot/scripts/sync-supabase-env.sh` - Supabase vars only; Telegram token still manual nano edit after
- `bot/scripts/backup-supabase.sh` + `restore-supabase-drill.sh` - DB backups, not deploy

---

## Ranked Opportunities Table

| Opportunity | Current State | Proposed Consolidation/Automation | Difficulty (1-10) | Value (H/M/L) | Cheap Win? |
|---|---|---|---|---|---|
| **1. GitHub Actions deploy-on-push** | All deploys are manual SSH + git pull | Add .github/workflows/deploy-*.yml for each VPS: trigger on push to main, runs auto-pull + npm install + systemctl restart. SSH key stored as GitHub secret (Actions > Secrets > DEPLOY_SSH_KEY). | 3 | HIGH | YES |
| **2. Env/secret manager (GitHub Actions Secrets)** | Hand-SSH nano edits, sync script pipes vars into bash -c (leaked token risk) | Migrate: .env.local vars -> GitHub Secrets. Deploy script SSH into VPS, pulls from GH API via gh CLI (installed on VPS), writes .env locally. OR: use Vercel KV / AWS SecretsManager. Audit: add secret-scan.py to CI. | 5 | HIGH | YES (partial: audit + GH Secrets is 2-day) |
| **3. Systemd unit templating** | 2 separate .service files, copy-paste structure | Create one `.service.template`, sed-interpolate vars on deploy (bot name, working dir, entry point). Generate per-bot units at install time. Reduces drift, eases adding new bots. | 2 | MED | YES |
| **4. Unified deploy script for all bots** | Per-service scripts scattered (install-bot-service.sh, sync-supabase-env.sh, backup-supabase.sh) | Single `scripts/deploy.sh <bot-name>` that: pulls env from GH Secrets, installs dependencies, validates .env, installs systemd unit, restarts service. Works for zaostock-bot, zao-team-bots, ZAOcoworkingBot. | 3 | HIGH | YES |
| **5. Consolidate VPS 1 + VPS 2 into one box** | 2 separate VPS, each with different deploy flows, key auth | Migrate openclaw services (Docker) to VPS 1 (KVM 2, 96GB, $25/mo). Single .github/workflows/deploy.yml covers all. Eliminate dual-config surface. Hostinger upgrade cost = $0 if already paid. | 8 | HIGH | NO (major lift) |
| **6. Health check + alerting (automated)** | Manual: `ss -tln | grep :<port>` or check with browser | Add health-check endpoints (/health, /status) to each bot. Cron job or GitHub Actions webhook every 5 min -> POST to bot health endpoint; log + alert on failure. Integrates with Telegram DM to Zaal. | 4 | HIGH | YES (if webhook endpoint exists) |
| **7. Log aggregation** | `journalctl` on VPS, manual tail -f, no retention/export | rsyslog or vector.dev to centralize logs (e.g., Datadog Free tier or ClickHouse on VPS 1). Searchable, alerting. Currently unstructured. | 6 | MED | NO (infra cost) |
| **8. CI secret scanning (pre-commit + GitHub Actions)** | No scanning; leak happened in May 2026 | Add secret_scan.py check to GitHub Actions (runs on every push). Pre-commit hook (optional, local). Blocks commits with 64-hex strings, PEM blocks, token patterns. | 2 | HIGH | YES |
| **9. Automated systemd unit symlink management** | Symlinked manually; breakage if paths change | Move symlinks into install.sh (already does this for infra/portal). Treat systemd units as immutable artifacts; regenerate on deploy. | 1 | LOW | YES (already done for portal) |
| **10. One-command local dev -> VPS preview** | No staging; dev = local, prod = VPS | Add GitHub Actions deploy-to-preview step: on push to `preview/*` branch, auto-deploy to separate systemd service on VPS (e.g., zaocoworking-bot-preview). Tear down on PR close. | 5 | MED | NO (needs extra service) |

---

## Top 5 Consolidations + Automations

### 1. GitHub Actions Deploy Pipeline (Difficulty 3, Value HIGH, Cheap Win: YES)

**Current state:** All deploys manual. SSH into VPS, git pull, npm install, systemctl restart. Error-prone, no audit trail, downtime if ECONNREFUSED.

**Proposed:** Add `.github/workflows/deploy-imanagent.yml` and `.github/workflows/deploy-vps2.yml`:

```yaml
name: Deploy to imanagent VPS
on:
  push:
    branches: [main]
    paths:
      - 'bot/**'
      - '.github/workflows/deploy-imanagent.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_SSH_KEY_IMANAGENT }}
          VPS_HOST: "zaal@187.77.3.104"
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_deploy
          chmod 600 ~/.ssh/id_deploy
          ssh -i ~/.ssh/id_deploy "$VPS_HOST" "cd ~/zao-os && git pull origin main && npm install --prefix bot && systemctl --user restart zaocoworking-bot || echo 'Service restart may need manual setup'"
          ssh -i ~/.ssh/id_deploy "$VPS_HOST" "journalctl --user -u zaocoworking-bot -n 20 --no-pager" || true
```

- Store `DEPLOY_SSH_KEY_IMANAGENT` in GitHub Secrets (Settings > Secrets and variables > Actions)
- Add public key to VPS `~/.ssh/authorized_keys`
- On merge to main, auto-deploy in <2min
- Logs from journalctl appear in GH Actions output
- Rollback: revert commit, re-push (or manual SSH if critical)

**Files to add:**
- `.github/workflows/deploy-imanagent.yml`
- `.github/workflows/deploy-vps2.yml` (if VPS 2 accessible)
- `scripts/deploy.sh` (local fallback for emergency)

**Time estimate:** 4 hours (gen workflows, test on VPS 1, secure SSH key handoff to Iman)

---

### 2. Unified Env/Secret Manager (Difficulty 5, Value HIGH, Cheap Win: YES partial)

**Current state:** `.env.local` -> SSH bash heredoc -> hand nano edit for Telegram token -> leaked token in chat history.

**Proposed:** GitHub Secrets as single source of truth:

1. Move all non-sensitive `.env` structure (URLs, keys) into `.github/workflows/deploy-*.yml` secrets section
2. On VPS, store ONLY `[REDACTED]` placeholders locally
3. Deploy script pulls from GitHub API:
   ```bash
   gh secret list --repo songchaindao-dot/zao-os-v1 | jq '.secretKey' > /tmp/secrets.json
   # sed into .env on deploy
   ```
4. Add `scripts/secret-scan.py` to GitHub Actions CI (runs on every push)

**Risks + mitigations:**
- GitHub Secrets are account-wide if using personal account; use org secrets instead
- Secret rotation: GitHub Actions provides no built-in rotation; use a separate secret manager (Doppler, 1Password, AWS SecretsManager) if rotation >3mo needed
- Immediate win: add secret-scan.py to CI (blocks leaks on push)

**Cheaper starting point:**
- Don't migrate all secrets yet; just add CI scanning + update sync-supabase-env.sh to refuse nano edits (error if token is passed in chat, require SSH key auth instead)

**Files to add:**
- `.github/workflows/secret-scan.yml` (runs on every push)
- `scripts/gh-secrets-to-env.sh` (pulls from GitHub API on VPS)

**Time estimate:** 2-day lite (scan + refuse-nano). 5-day full (migrate to GH Secrets).

---

### 3. Systemd Unit Templating (Difficulty 2, Value MED, Cheap Win: YES)

**Current state:** 2 hardcoded .service files; copy-paste per new bot.

**Proposed:** One template, sed during install:

```bash
# bot/systemd/bot.service.template
[Unit]
Description=ZAO Bot - {{BOT_NAME}}
After=network-online.target

[Service]
Type=simple
WorkingDirectory={{BOT_DIR}}
EnvironmentFile={{BOT_DIR}}/.env
ExecStart={{NODE_BIN}} {{BOT_ENTRY}}
Restart=always
RestartSec={{RESTART_DELAY}}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
```

On deploy:
```bash
sed \
  -e "s|{{BOT_NAME}}|zaocoworking-bot|g" \
  -e "s|{{BOT_DIR}}|$HOME/zaocoworking-bot|g" \
  -e "s|{{NODE_BIN}}|/usr/bin/env npm|g" \
  -e "s|{{BOT_ENTRY}}|run start|g" \
  -e "s|{{RESTART_DELAY}}|5|g" \
  < bot/systemd/bot.service.template \
  > ~/.config/systemd/user/zaocoworking-bot.service
```

Benefit: add a new bot in seconds, no duplication, version-controlled template changes apply to all.

**Files to refactor:**
- `bot/systemd/bot.service.template` (new)
- `bot/scripts/install-bot-service.sh` (update to use sed)
- Delete `bot/systemd/zaostock-bot.service` + `zao-team-bots.service` after migration

**Time estimate:** 2 hours

---

### 4. Unified Deploy Script (Difficulty 3, Value HIGH, Cheap Win: YES)

**Current state:** 3 separate scripts (install-bot-service.sh, sync-supabase-env.sh, backup-supabase.sh); flow is unclear.

**Proposed:** Single entry point `scripts/deploy.sh`:

```bash
#!/bin/bash
# Usage: bash scripts/deploy.sh <bot-name> [--vps-host=...] [--dry-run]
set -euo pipefail

BOT_NAME=${1:-}
VPS_HOST=${VPS_HOST:-zaal@187.77.3.104}
DRY_RUN=${DRY_RUN:-}

[ -z "$BOT_NAME" ] && { echo "Usage: $0 <bot-name>"; exit 1; }

echo "1. Validate .env.local has required keys for $BOT_NAME"
# Check for Supabase URL, service role, bot token, etc.

echo "2. SSH into $VPS_HOST, git pull + npm install"
ssh "$VPS_HOST" "cd ~/zao-os && git pull origin main && npm install"

echo "3. Sync env via GitHub Secrets (or fallback to .env.local)"
# Either: gh secret get <key> | ssh write to VPS .env
# Or: sync-supabase-env.sh for legacy

echo "4. Install/validate systemd unit"
ssh "$VPS_HOST" "bash zao-os/bot/scripts/install-bot-service.sh $BOT_NAME"

echo "5. Restart service"
ssh "$VPS_HOST" "systemctl --user restart $BOT_NAME"

echo "6. Health check (wait 5s, curl /health or check journalctl)"
sleep 5
ssh "$VPS_HOST" "journalctl --user -u $BOT_NAME -n 10 --no-pager"

echo "Deploy complete: $BOT_NAME on $VPS_HOST"
```

Support bots:
- `zaocoworking-bot` (systemd service on VPS 1)
- `zaostock-bot` (systemd service on VPS 1)
- `zao-devz-bot` (systemd service on VPS 1, optional if not yet deployed)
- `zaoscribe` (likely systemd or docker on VPS 1)
- `openclaw` (docker on VPS 2, different script path)

**Files to add:**
- `scripts/deploy.sh` (master script)
- `scripts/deploy-bot.sh` (systemd bot subcommand)
- `scripts/deploy-docker.sh` (docker subcommand for VPS 2)

**Time estimate:** 4 hours

---

### 5. Automated Health Check + Alerting (Difficulty 4, Value HIGH, Cheap Win: YES if endpoints exist)

**Current state:** Manual `ss -tln` or browser check; silent failures possible.

**Proposed:** Per-bot health endpoint + GitHub Actions webhook every 5 min:

```bash
# .github/workflows/health-check.yml
name: Health Check - VPS 1 Bots
on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Health check bots
        run: |
          for bot in zaocoworking-bot zaostock-bot; do
            curl -f -m 5 "http://zaal@187.77.3.104:3003/health" || {
              echo "FAIL: $bot unhealthy"
              # POST to Telegram: DM Zaal
              curl -X POST "https://api.telegram.org/bot[REDACTED]/sendMessage" \
                -d "chat_id=<zaal_telegram_id>" \
                -d "text=ALERT: $bot health check failed"
              exit 1
            }
          done
```

**Note:** Bots need `/health` endpoints. If they don't exist, add lightweight ones (return JSON `{"ok": true}`).

**Files to add:**
- `.github/workflows/health-check.yml`
- `bot/src/health-endpoint.ts` (shared health check middleware)

**Time estimate:** 3 hours (add endpoints + workflow)

---

## Cheap Wins (All Difficulty <=3, Value HIGH, Buildable Now)

### Win 1: GitHub Actions Deploy-on-Push (4h)

**Immediate action:**
1. Add `.github/workflows/deploy-imanagent.yml` (copy template above)
2. Run `ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""` locally
3. Add public key to VPS `~/.ssh/authorized_keys`
4. Add private key to GitHub Secrets as `DEPLOY_SSH_KEY_IMANAGENT`
5. Test by pushing a no-op commit to main; watch GH Actions logs

**Outcome:** One-click deploy on every main merge. No more "oops, forgot to push."

---

### Win 2: GitHub Actions Secret Scan (2h)

**Immediate action:**
1. Copy `scripts/bonfire-ingest/secret_scan.py` into `.github/` (it exists on VPS)
2. Add `.github/workflows/secret-scan.yml`:
   ```yaml
   name: Secret Scan
   on: [pull_request, push]
   jobs:
     scan:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - run: python .github/secret_scan.py
   ```
3. Merge + test by pushing a file with a 64-char hex string (fake token); watch CI reject it

**Outcome:** No more leaked tokens in commit history. Auditable in GitHub logs.

---

### Win 3: Systemd Unit Template (2h)

**Immediate action:**
1. Create `bot/systemd/bot.service.template` (copy structure from existing .service files)
2. Update `bot/scripts/install-bot-service.sh` to sed-interpolate from template
3. Delete old .service files from repo
4. Test on VPS: `bash bot/scripts/install-bot-service.sh zaocoworking-bot` should auto-generate the unit

**Outcome:** Adding a new bot costs 5 min (write .env, run script). No more copy-paste drift.

---

### Win 4: `scripts/deploy.sh` (3h)

**Immediate action:**
1. Create `scripts/deploy.sh` (use template above)
2. Add subcommands: `scripts/deploy-bot.sh` (systemd), `scripts/deploy-docker.sh` (future)
3. Test locally: `bash scripts/deploy.sh zaocoworking-bot --dry-run` prints steps without executing
4. Test on VPS: full run should restart bot + show journalctl tail

**Outcome:** Deploy via `bash scripts/deploy.sh <bot-name>` from laptop. Single point of reference.

---

### Win 5: Light Env Secret Hygiene (1h)

**Immediate action - BLOCKING, do first:**
1. Update `bot/scripts/sync-supabase-env.sh` to refuse execution if Telegram token is passed via stdin (detect [REDACTED] pattern)
2. Add guard: `if grep -q TELEGRAM_BOT_TOKEN <<< "$1"; then echo "ERROR: do not paste tokens; use SSH only"; exit 1; fi`
3. Document: token MUST be edited on VPS via `ssh host 'nano ~/zaostock-bot/.env'` (no heredoc)

**Outcome:** Prevents future leaks. Tight enough until full GH Secrets migration.

---

## VPS 1 vs VPS 2 Consolidation

**Current:** VPS 1 (Hostinger, 187.77.3.104) runs imanagent + bots + portal. VPS 2 (Hostinger KVM 2, 31.97.148.88) runs openclaw Docker.

**Case for consolidation:** Eliminate dual deploy surface, single GitHub Actions workflow, one SSH key, easier monitoring.

**Case against:** VPS 2 may have high CPU/memory openclaw workloads; moving to VPS 1 risks stability. Docker images isolate; systemd services share runtime.

**Recommendation:** Do NOT consolidate yet. Plan for 2026-Q3 (post-ZAOstock):
- Profile VPS 2 CPU/memory load (get Hostinger stats)
- Plan Docker-on-VPS-1 infra (systemd units running Docker containers)
- Migration path: VPS 2 -> VPS 1 docker image, test on staging, cutover
- Payoff: single bill, single deploy, single monitoring

---

## Implementation Order

1. **Week 1 (May 27-31, 2026)**
   - Win 5 (env hygiene guard)
   - Win 2 (secret scan to CI)
   - Win 3 (systemd template)

2. **Week 2 (Jun 3-7, 2026)**
   - Win 1 (deploy-on-push GitHub Actions)
   - Win 4 (scripts/deploy.sh)

3. **Week 3+ (Jun 10+)**
   - Env secret manager (GitHub Secrets migration OR Doppler integration)
   - Health check + alerting
   - VPS consolidation planning doc

---

## Risk Mitigations

| Risk | Mitigation |
|---|---|
| GitHub Actions SSH key compromise | Rotate key monthly. GitHub Secrets can be revoked. Use per-bot keys if sensitive. |
| Deploy workflow breaks mid-flight | Always test on a test bot first (e.g., zaoscribe). Workflow has rollback step (revert commit). |
| Systemd unit template sed breaks on special chars | Test with bots that have `-` and `_` in names. Quote all sed delimiters. |
| Secret scan blocks legitimate commits (false positive) | Keep secret_scan.py regex tight; test locally before merging to main. |
| Health check endpoint adds latency | Use separate low-overhead endpoint (return cached status, no DB queries). Timeout 5s. |

---

## Also See

- Doc 677 - GitHub Actions bonfire-sync pattern (model for git event automation)
- Doc 661 - DISPATCH audit (parallel agent work)
- Doc 663 - agent audit (related)
- `scripts/bonfire-ingest/secret_scan.py` - secret detection pattern
- `infra/portal/bin/auto-sync.sh` - auto-pull + bounce pattern (already in use)
- `bot/scripts/sync-supabase-env.sh` - env sync baseline (legacy, insecure)

---

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Review this doc; greenlight cheap wins | @Zaal | Decision | 2026-05-21 |
| Implement Win 5 (env guard) + Win 2 (secret scan) | Next session | Code | 2026-05-24 |
| Test Win 1 (deploy workflow) on test bot | Next session | Integration | 2026-05-28 |
| Merge all 5 wins into main | Next session | QA | 2026-05-31 |
| Plan VPS consolidation for Q3 | @Zaal + ops | Design | 2026-06-30 |

---

## Updated 2026-10-10: Material Changes Found (Radar Revalidation)

**What changed since 2026-05-20:**

### VPS Landscape -- Significantly Different

- **The openclaw container + 7-agent squad was decommissioned** 2026-05-04 (CLAUDE.md). This was a Docker-based workload that ran on the old imanagent box (187.77.3.104); it was not a separate physical VPS. The "VPS 2 (openclaw)" label in this original doc was a misnomer -- openclaw was a container environment, not a second machine.
- **One VPS remains: 31.97.148.88** (Hostinger KVM 2, Ubuntu 24.04, user zaal). Confirmed as the live box by `.claude/skills/vps/SKILL.md`. The original doc's "VPS 1 (imanagent, 187.77.3.104)" was the old hostname/IP now retired. Bots were migrated off 187.77.3.104: `farscout.service` and `cowork-agent.service` both carry "migrated from 187.77.3.104" in their descriptions.
- The VPS consolidation question (Opportunity #5) is moot -- there is only one VPS.
- **farscout.service is still in the repo but is a zombie.** CLAUDE.md (2026-08-22) noted farscout was still running as `farscout.service` on the VPS, heartbeating `up` while doing nothing. Decommissioning it (`systemctl --user stop farscout && systemctl --user disable farscout`) is Zaal's action. The service file at `bot/systemd/farscout.service` should be deleted from the repo once the VPS unit is stopped.

### Systemd Unit Count: 2 -> 12

The original audit found 2 hardcoded `.service` files. As of 2026-10-10 there are 12 (9 services, 3 timers):
`cowork-agent.service`, `ecosystem-watch.service`, `ecosystem-watch.timer`, `farscout.service` (zombie), `fleet-claude-auth.service`, `fleet-claude-auth.timer`, `fleet-heartbeat.service`, `fleet-heartbeat.timer`, `zao-devz-stack.service`, `zao-fleet-agent.service` (STAGED, NOT ENABLED), `zaostock-bot.service`, `zoe-bot.service`.

This makes the systemd unit templating recommendation (Opportunity #3) more urgent -- each new bot adds another hardcoded file.

### ZOE Bot Working Directory Changed

The ZOE bot service now uses `WorkingDirectory=%h/zao-bot-live/bot` and `ExecStart=%h/zao-bot-live/bot/...`. The original doc documented `~/zao-os/` as the primary clone for ZOE. The deploy directory has been renamed or relocated. Any deploy automation targeting ZOE must reference `zao-bot-live/` not `zao-os/`. Other units (`zao-fleet-agent.service`, `zao-devz-stack.service`, etc.) still reference `%h/zao-os/bot` or other directories -- only `zoe-bot.service` has been updated to `zao-bot-live/`.

### Fleet-Agent Control Plane (New Architecture)

A new `zao-fleet-agent.service` was added (STAGED, not yet enabled) implementing a whitelisted start/stop/restart controller for the cowork control plane (doc 800 Phase 2). This adds a new security constraint for deploy automation: the fleet-agent only allows `systemctl --user {start,stop,restart}` on `{zoe-bot, zao-devz-stack, zaostock-bot}`. Any deploy pipeline must account for this gatekeeper rather than SSHing directly to systemctl.

### Cheap Wins Status (as of 2026-10-10)

Verified against repo state 2026-10-10 (grep of `.github/workflows/`, `scripts/`, `bot/systemd/`):
- Win 1 (GitHub Actions deploy-on-push): **NOT DONE** -- no deploy-*.yml in `.github/workflows/`
- Win 2 (secret scan in CI): **NOT DONE** -- no secret-scan.yml; `secret_scan.py` not in `.github/`
- Win 3 (systemd unit template): **NOT DONE** -- no `.service.template` file; all units remain hardcoded
- Win 4 (scripts/deploy.sh): **PARTIAL** -- `scripts/zoe-deploy.sh` and `scripts/zoe-autodeploy.sh` exist for ZOE but no general `deploy.sh` covering all bots
- Win 5 (env guard in sync-supabase-env.sh): STATUS UNKNOWN -- `sync-supabase-env.sh` not checked this run

### Secrets Management -- New Option Available

As of 2026, **Infisical** (MIT-licensed, self-hostable) is a stronger match than Doppler for the ZAO stack, given the VPS-first deployment model. Doppler is cloud-only; Infisical runs as a Docker container on VPS 1 with Postgres + Redis backend. It supports GitHub Actions via OIDC or service tokens. The original doc's recommendation to use GitHub Secrets as the migration target remains valid as a simpler first step. Infisical is the upgrade path if a central secrets store is needed across multiple bots. Source: pkgpulse.com comparison (standard search result, UNVERIFIED full fetch due to proxy limits -- directional only).

### OIDC-SSH-CA Pattern (New)

A pattern called `oidc-ssh-ca` allows GitHub Actions to deploy via short-lived SSH certificates instead of a stored key pair. The workflow generates an ephemeral key on each run, proves identity via GitHub's OIDC token, and receives a cert valid for a few minutes. The server trusts only the CA public key, so no `authorized_keys` management is needed. This is more secure than the static `DEPLOY_SSH_KEY_IMANAGENT` approach in Opportunity #1. However, this is a third-party project (not GitHub-native for VPS targets). Vet before adopting. Source: WebSearch result, readthedocs URL unreachable this run -- directional only.

### Sources (this revalidation)

- Repo: `bot/systemd/` tree, `.github/workflows/` tree -- FULL (direct file reads)
- Repo: CLAUDE.md Primary Surfaces section, farscout/zombie note -- FULL
- WebSearch: "GitHub Actions deploy VPS SSH 2026" -- standard, links retrieved, individual pages unreachable (proxy limits); summary used as directional
- WebSearch: "Doppler secrets management vs GitHub Actions Secrets VPS 2026" -- standard, directional
- WebSearch: "Infisical open source secrets manager VPS self-hosted 2026" -- standard, directional
- WebSearch: "GitHub Actions OIDC keyless deployment VPS 2026" -- standard, directional

