---
topic: security
type: decision
status: research-complete
last-validated: 2026-06-30
related-docs: 918
original-query: "neynar sounds good but i need the login to make the api key etc idk the best way to organize secrets with agents lets research"
tier: STANDARD
---

# Secret Management for ZAO Agent Fleet

## Goal

Zaal runs a small distributed agent fleet (~20 secrets across VPS + Pi + Mac + cloud sessions). Current state: secrets scattered in dotfiles (.env files, ~/.zao/private/) with good hygiene discipline (stub keys on disk, pre-commit scans, agents told not to exfiltrate). Problem: hard to rotate, manage across hosts, and audit what agents can access. This doc evaluates secret management patterns for this scale and recommends a concrete migration path.

## Findings

### Core Patterns: Three Families

1. **Per-Host Dotenv (Current State)**
   - Secrets live in `.env` files (gitignored) on each host (VPS, Pi, Mac)
   - Pros: zero dependencies, portable, works offline
   - Cons: manual rotation across 3 hosts, no audit trail, hard to scope per-agent, humans read all secrets
   - Scale: good for <5 hosts, breaks at 10+

2. **Centralized Secret Manager (SaaS/Self-Hosted)**
   - Single source of truth (cloud or self-hosted database)
   - Systemd unit + CLI/HTTP client pulls secrets at runtime
   - Pros: one place to rotate, audit logs, scoped access per agent, supports short-lived tokens
   - Cons: adds network dependency, learning curve, potential cost
   - Scale: sweet spot for 1-20 hosts + agents

3. **Encrypted-in-Git (SOPS + age)**
   - Secrets encrypted with age keypair, committed to git as `.env.enc`
   - Decryption key lives in `.config/sops/age/keys.txt` (outside git)
   - Pros: versioning, no new service, simple
   - Cons: still per-machine key management, no scoping per agent, rotation requires re-encrypt+commit
   - Scale: good for <3 machines, simpler than managers but less flexible

### Comparison: Realistic Options for ZAO Scale

| Tool | Cost (Solo) | Free Tier | Systemd Integration | Pi Ready | Self-Host | Secret Rotation | Learning Curve | Agent Scoping |
|------|-------------|-----------|---------------------|----------|-----------|-----------------|---------------|----|
| **Doppler** | $0-20/mo | 5 configs, unlimited secrets, 1 user | CLI inject (`doppler run -- service.sh`) | Yes (Node/Go) | No (SaaS only) | Native, 1-click | Low - drag/drop UI | Per-config scope |
| **Infisical** | $0 | Community ed. unlimited, SaaS free tier | CLI inject or env sync | Yes (Docker/native) | Yes (Docker Compose) | Native, rotation policy | Medium - UI + CLI | Per-secret granular ACL |
| **1Password** (Connect) | $0 setup, $800+/year | No free tier for orgs | Connect + CLI, item reference injection | Yes (CLI only, needs 1PW account) | No (SaaS only) | SaaS-managed | Medium - setup complex | Vault + collection scope |
| **Vault** (self-hosted) | $0 (OSS) | Open-source, no limits | `vault` agent, auth methods (K/V storage) | Yes (compile from source or Docker) | Yes (full control) | Built-in, token TTL | High - steep learning curve | Role-based granular |
| **Bitwarden Secrets** | $0 | Community server free tier | REST API + CLI (nascent) | Possible (Node client) | Yes (free server) | Via API, manual | Medium - new product | Per-service scope |
| **SOPS + age** | $0 | Open-source | Systemd `ExecStart=/usr/bin/bash -c 'eval $(sops -d .env.enc); exec $SERVICE'` | Yes (native CLI) | Full | Manual (re-encrypt) | Low - shell command | No per-secret scoping |

**Notes:**
- "Systemd Integration" = how a service unit (`/etc/systemd/user/zoe.service`) reliably gets fresh secrets at start
- "Pi Ready" = can the Pi hardware + arm64 OS run the client without heavy dependencies
- "Agent Scoping" = can you give ZOE read access to only its secrets (not all 20), vs. all-or-nothing?

### Agent-Specific Risk: LLM Processes Holding Secrets

Current risk landscape (from Zaal's secret-hygiene.md):
- Agent (LLM subprocess) runs with env vars containing real tokens
- If agent prompt includes "here is your current secrets", LLM can reproduce them in output
- If agent calls a tool and passes a secret as an argument, it's visible to the tool
- If agent writes files (research docs, etc.), secret can leak to disk

**Best practices to lock this down:**
1. **Inject secrets at exec, not in prompt:** Systemd passes env to the service; service starts before LLM process. LLM subprocess inherits env but never sees it in its prompt.
2. **Scoped tokens only:** Give each agent (ZOE, ZAO Devz, etc.) its own narrowly-scoped token, not a master key. E.g., ZOE gets `TELEGRAM_BOT_TOKEN` (write-only for its bot), NOT `TELEGRAM_API_KEY` (all accounts). [1Password Developers guide](https://developer.1password.com/docs/service-accounts/get-started/) describes this pattern.
3. **Short-lived credentials:** For Neynar, OpenRouter, etc., rotate API keys to short-lived tokens if the service supports it (most cloud API managers do). [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html) and Vault support native rotation policies.
4. **Never pass secrets as tool args:** Instead of `tool.call("send_telegram", message, token=my_token)`, the tool should read the token from env directly: `os.environ['TELEGRAM_BOT_TOKEN']`.
5. **Audit logs in the manager:** If a secret is read/rotated/accessed, log it. Centralized managers (Doppler, Infisical, Vault) provide this out of box. Per-host dotenv does not.

---

## Recommendation: Infisical (Self-Hosted) + Doppler (Temporary Fallback)

**Chosen approach: Start with Doppler (SaaS, today), migrate to Infisical (self-hosted, 1-2 sprints) once the workflow is proven.**

**Why Doppler first:**
- Zaal gets immediate relief from scattered dotfiles (single dashboard, rotation UI, CLI)
- Free tier covers 5 configs (VPS, Pi, Mac, test, staging) + unlimited secrets
- Zero setup time: sign up, drag secrets into the web UI, run `doppler run -- systemctl --user start zoe.service`
- Audit trail + API for Hermes/agents to request creds (future)

**Migration path to Infisical (self-hosted):**
1. Export Doppler secrets as JSON (Doppler CLI: `doppler secrets download`)
2. Deploy Infisical server on the VPS (Docker Compose, 10 min setup from [github.com/infisical/infisical](https://github.com/Infisical/infisical))
3. Import secrets via Infisical UI or CLI
4. Update systemd units to use Infisical CLI instead of Doppler CLI
5. Decommission Doppler (free tier, no cost, but data stays off-cloud)

**Systemd integration (concrete example):**

```ini
# /etc/systemd/user/zoe.service
[Unit]
Description=ZOE Bot
After=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/bash -c 'eval $(doppler secrets download --json | jq -r "to_entries | map(\"\(.key)=\(.value)\") | .[]" | tr -d "\""); exec /usr/bin/tsx bot/src/zoe/index.ts'
Restart=on-failure
Environment=PATH=/home/zaal/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin

[Install]
WantedBy=default.target
```

(Later: swap `doppler` for `infisical` CLI with same interface.)

**Agent scoping (for Neynar, OpenRouter, Telegram):**
- Create separate Doppler/Infisical projects per agent:
  - `zoe` project: TELEGRAM_BOT_TOKEN, NEYNAR_API_KEY (narrow scope), OPENROUTER_KEY (narrow)
  - `zao-devz` project: its own Telegram token, different Neynar scope
  - `shared` project: Supabase service role (read-only, or use RLS + session keys instead)
- Each systemd unit pulls from its project only. LLM process inherits scoped env.

**New key placement (Neynar example):**
- Today: `~/.zao/private/neynar.key` (file, human-readable)
- Tomorrow: Doppler UI dashboard, stored encrypted, access logged
- Next sprint: Infisical UI, self-hosted, full audit

**Cost:**
- Doppler free tier: $0 forever (5 configs)
- Infisical self-hosted: $0 (OSS license, runs on VPS you already have)

---

## Next Actions

1. **Week 1: Deploy Doppler**
   - Sign up at doppler.com (free tier), create 5 configs (vps/pi/mac/test/cloud)
   - Migrate secrets from scattered dotfiles into Doppler UI (10 min drag/drop)
   - Update systemd units to run via `doppler run --`
   - Verify ZOE + ZAO Devz + other services start correctly
   - Smoke test: rotate one secret in Doppler UI, confirm service picks up new value on restart

2. **Week 2-3: Lock in agent scoping**
   - Create Doppler projects per agent (zoe/zao-devz/cowork/farscout)
   - Move corresponding secrets to each project
   - Verify systemd units reference correct project
   - Audit: list who/what accesses each secret (Doppler audit tab)

3. **Sprint after next: Plan Infisical self-hosted**
   - Test Infisical on local machine (docker-compose, 5 min)
   - Write migration script (Doppler JSON -> Infisical import)
   - Document: how to deploy on VPS, update systemd to use Infisical CLI
   - Pilot: migrate ZOE first, monitor for 1 week, then roll out to others

---

## Sources

- **Doppler** official docs: https://docs.doppler.com/docs/cli
- **Infisical** GitHub + docs: https://github.com/Infisical/infisical, https://infisical.com/docs
- **SOPS + age** GitHub: https://github.com/getsops/sops
- **1Password Developers (Service Accounts)**: https://developer.1password.com/docs/service-accounts/get-started/
- **HashiCorp Vault** official docs: https://www.vaultproject.io/docs
- **Bitwarden Secrets Manager**: https://bitwarden.com/products/secrets-manager/
- **AWS Secrets Manager (rotation patterns)**: https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html
- **Systemd environment injection patterns**: https://man7.org/linux/man-pages/man5/systemd.exec.5.html

