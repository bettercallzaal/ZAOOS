---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-05-05
related-docs: 234, 459, 547, 599, 600, 601, 605, 606, 607, 611
tier: STANDARD
---

# 612 - VPS audit + AgentMail integration plan (prep for ZOE autonomy v2)

> **Goal:** Audit the live VPS state on 2026-05-05, surface what to fix before doc 611 Phase 1 ships, lock the AgentMail integration shape, and identify free wins (Ollama already running, dead workspace to free 4.6GB, security defaults).

## Key Decisions

| Decision | Action |
|----------|--------|
| AgentMail integration uses REST API directly, no SDK | YES - existing inbox skill calls `https://api.agentmail.to/v0/inboxes/{inbox}/messages` with `Authorization: Bearer $KEY`. Keep the same shape in `bot/src/zoe/agents/inbox.ts`. |
| Copy AgentMail key from local `.env.local` to VPS `~/zao-os/bot/.env` | YES - Zaal does this himself via SSH (no paste here). Step-by-step in this doc. |
| Use Ollama (already running, port 11434) as no-cost classification fallback | YES - llama3.1:8b is loaded, 4.9 GB. Use for inbox auto-categorize + low-stakes routing decisions. Keeps Sonnet/Opus calls for actual writing/research. |
| Reclaim 4.6GB by removing dead `~/openclaw-workspace` | YES - confirmed dead per doc 601, only 30GB free of 96GB (69% used). |
| Audit + remove 4.3GB from `~/code` clone (likely stale ZAOOS) | INVESTIGATE this week - free another ~4GB likely safe. |
| Ship the Supabase backup cron Doc 459 documented but never enabled | YES - Phase 1 dependency, ship in same PR as inbox. |
| Add Langfuse observability before Phase 3 subagent harness | YES - already in doc 605 Phase 1. Now blocks doc 611 Phase 3 too. Bump priority. |
| Move zoe-bot to webhook mode (vs long-polling) | NO this sprint - polling works, no observed issues. Defer to doc 611 Phase 5 hardening. |
| Replace cloudflared with Caddy as edge | NO - cloudflared tunnel + caddy local both serve real roles, no conflict. |

## VPS state today (2026-05-05 ~10:12 UTC)

| Layer | Reality | Health |
|-------|---------|--------|
| OS | Ubuntu Linux 6.8.0-110, 4d 16h uptime | OK |
| CPU | 2 cores, load average 0.43 / 0.37 / 0.37 | Underutilized |
| Memory | 8GB total, 1.3GB used, 6.4GB available, 4GB swap | Lots of headroom |
| Disk | 96GB / 67GB used / 30GB free / 69% | TIGHT - clean up dead workspaces |
| Security | fail2ban active, ufw configured, SSH key only on port 22 | Good baseline |
| Edge | Cloudflared tunnel + Caddy reverse proxy on ports 3002/3003/7682 | Works |
| Local LLM | Ollama on :11434 with llama3.1:8b loaded (4.9GB) | UNUSED - free win |

### Services running (4 user units)

| Service | Process | Port | Purpose | Status |
|---------|---------|------|---------|--------|
| `cloudflared.service` | cloudflared | 20241/20242 | Tunnel for ZAO agents + paperclip | OK |
| `zao-devz-stack.service` | tsx zaostock-bot/src/devz/index.ts | 3007 | ZAO Devz Coder + Critic (Hermes) | OK, no errors past 24h |
| `zaostock-bot.service` | npm run start (zaostock-bot) | - | ZAOstock team bot | OK, ran morning digest 10:00 |
| `zoe-bot.service` | tsx zao-os/bot/src/zoe/index.ts | - | ZOE concierge bot | OK, polling as @zaoclaw_bot |

### Disk hogs (`/home/zaal`, sorted)

| Path | Size | Status |
|------|------|--------|
| `~/openclaw-workspace` | 4.6GB | DEAD - decommissioned per doc 601, safe to remove |
| `~/code` | 4.3GB | INVESTIGATE - ZAOOS clone tree, likely stale |
| `~/hermes-agent` | 1.1GB | LIVE - Hermes runner |
| `~/zao-os` | 257MB | LIVE - main ZAOOS clone, used by zoe-bot |
| `~/zaostock-bot` | 62MB | LIVE - ZAOstock + Devz bot source |
| Other | <100MB | Configs and small dirs |

Total reclaim opportunity: ~8.9GB by clearing the two stale workspaces. Drops disk usage from 69% to ~58%.

## AgentMail integration shape

### What's there today (manual flow)

`/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/skills/inbox/SKILL.md` (already in repo) defines:

- Forwarding address: `zoe-zao@agentmail.to`
- Whitelist: only process messages from `zaalp99@gmail.com`
- API: `https://api.agentmail.to/v0/inboxes/zoe-zao@agentmail.to/messages` (Bearer token)
- Labels: `x-posts`, `research`, `ideas`, `events`, `action-items`, `processed`
- Auto-categorize rules: URL contains `x.com` -> `x-posts`, etc.

### What's missing for autonomy

- API key on VPS (`AGENTMAIL_API_KEY` env). Currently lives at `/Users/zaalpanthaki/Documents/worktrees/inbox-process-0503-1109/.env.local` on Zaal's Mac.
- Polling cron in `bot/src/zoe/scheduler.ts`.
- TypeScript inbox agent in `bot/src/zoe/agents/inbox.ts` matching the existing skill's curl logic.

### API endpoints used (verified from skill)

```
GET  /v0/inboxes/{inbox}/messages?limit=50&label=!processed
GET  /v0/inboxes/{inbox}/messages/{message_id}
POST /v0/inboxes/{inbox}/messages/{message_id}/labels  (add label)
POST /v0/inboxes/{inbox}/messages/{message_id}/read    (mark read)
```

(The exact label-write paths differ slightly - first-poll Phase 1 ships read-only, label writes in a second PR after we exercise the API in production.)

### Cred handoff procedure (Zaal does this himself)

```
ssh zaal@31.97.148.88
cp /Users/zaalpanthaki/Documents/worktrees/inbox-process-0503-1109/.env.local /tmp/.local-env-only-here   # local copy step
# manually scp the line - or just nano the VPS file
nano ~/zao-os/bot/.env
# add at bottom:
# AGENTMAIL_API_KEY=<paste>
# AGENTMAIL_INBOX=zoe-zao@agentmail.to
# AGENTMAIL_WHITELIST=zaalp99@gmail.com
chmod 600 ~/zao-os/bot/.env
systemctl --user restart zoe-bot.service
```

Per project rule: never paste secrets into Claude chat. Zaal SCPs or types directly into nano on VPS.

## Ollama is the unused local LLM (free win)

VPS already runs Ollama on `localhost:11434`. Model loaded: `llama3.1:8b` (4.9GB). No additional setup, just unused.

### What to use it for

Low-stakes classification + summarization where Sonnet's quality is overkill:

- Inbox auto-categorize (label routing) - replace planned Sonnet call with Ollama call. Saves ~$0.001 per email but more importantly avoids API budget on noise.
- Bonfire entity-class proposal (low confidence threshold path) - propose Person/Project/etc with Ollama; Sonnet only on the ambiguous middle (0.4-0.7 confidence band).
- Audit subagent's first pass - Ollama drafts the fact-check, Sonnet validates only when Ollama flags concerns.

### What NOT to use it for

- Newsletter writing (voice quality matters)
- Brand-assistant outputs (Firefly posts, YouTube descriptions, casts)
- Concierge replies to Zaal (he reads these, must be on-brand)
- Research subagents (need correct sourcing, llama3.1:8b hallucinates URLs)

### How to call it from `bot/src/zoe/`

```typescript
// bot/src/zoe/ollama.ts (new, ~30 lines)
export async function ollamaClassify(prompt: string, system: string): Promise<string> {
  const r = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.1:8b',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      stream: false,
      options: { temperature: 0.1 },  // deterministic for classification
    }),
  });
  const data = await r.json() as { message?: { content?: string } };
  return data.message?.content?.trim() ?? '';
}
```

Add to ZOE allowedTools or just call directly from agent files. No new env, no API cost.

## Security audit (current baseline)

| Check | State | Verdict |
|-------|-------|---------|
| SSH on port 22, key-only auth | Confirmed | OK |
| Fail2ban active | Yes | OK |
| UFW configured | Yes (active+exited = applied) | OK |
| Open ports beyond 22 | None public-facing - all binding to localhost or routing through cloudflared/caddy | OK |
| Service-level isolation | Each bot runs as `zaal` user via systemd user units | Acceptable for single-user VPS, would split if multi-tenant |
| Secret hygiene | All `.env` files chmod 600, owned by zaal, not in git | OK |
| Backup cron | Documented in `bot/scripts/backup-supabase.sh`, NEVER scheduled | GAP - ship before Phase 1 |
| Log rotation | systemd journal default | OK for now, may grow |

## Observability gap (blocks doc 611 Phase 3)

ZOE today has zero LLM tracing. Console logs only. Doc 605 Phase 1 specced Langfuse self-host on VPS - this should ship BEFORE doc 611 Phase 3 (subagent harness) so we can:

- See per-subagent token cost
- Trace parent-child calls (concierge -> research-deep)
- Catch silent failures (the `bare: true` bug took 3 hours to find without traces)

Recommendation: pull doc 605 Phase 1 Langfuse install forward into doc 611 Phase 1 sprint. Same week.

## Improvements to ship in doc 611 Phase 1 PR

The Phase 1 PR scope expands slightly to absorb VPS prep:

1. **inbox.ts** - the agent itself (ships with @recall hook for Bonfire writes already wired)
2. **ollama.ts** - 30-line Ollama wrapper, used by inbox classifier
3. **audit.ts** - structured audit log writer (was Phase 5, pulled forward)
4. **scheduler.ts** - new `*/30 * * * *` cron + read of `~/.zao/zoe/paused.flag`
5. **VPS cleanup script** - `bot/scripts/vps-reclaim.sh` removes openclaw-workspace, audits ~/code
6. **VPS Supabase backup cron** - install `bot/scripts/backup-supabase.sh` to crontab on VPS
7. **Langfuse Docker compose on VPS** - matches doc 605 Phase 1 spec
8. **Update zoe-bot persona.md** with new commands `/inbox`, `/pause-zoe`, `/resume-zoe`

PR scope: ~12-16 hours. Single branch, single merge.

## Ops + monitoring upgrades (lower priority)

- **Healthcheck endpoint**: add `/health` to ZOE bot returning `{ ok: true, lastPollTs, pendingNotes }`. Cloudflared maps to `https://zoe.zaoos.com/health`. External uptime monitor (UptimeRobot free) pings every 5 min.
- **Disk monitoring**: add `~/bin/disk-watch.sh` cron daily 2am. If `>80%`, DM Zaal.
- **Daily 6am VPS health summary** in ZOE morning brief: `Up 5d, 1.3G/8G mem, 67G/96G disk, 4 svcs healthy.`

These are doc 611 Phase 5 hardening items but easy to ship alongside.

## Codebase touchpoints

- `bot/src/zoe/agents/inbox.ts` (new)
- `bot/src/zoe/ollama.ts` (new)
- `bot/src/zoe/audit.ts` (new)
- `bot/src/zoe/scheduler.ts` (extend)
- `bot/scripts/vps-reclaim.sh` (new)
- `bot/scripts/install-cron.sh` (new) - drops backup-supabase.sh + disk-watch.sh into crontab idempotently
- `infra/docker-compose.langfuse.yml` (new) - VPS-side Langfuse install
- `~/zao-os/bot/.env` on VPS - add AGENTMAIL_* + LANGFUSE_* (Zaal does this manually)

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Copy AgentMail key from Mac to VPS `~/zao-os/bot/.env` | @Zaal | SSH manual | Phase 1 kickoff |
| 2 | Confirm openclaw-workspace removal is OK (4.6GB free) | @Zaal | Approval | Phase 1 kickoff |
| 3 | Audit `~/code` directory contents before cleanup | Claude | Investigation | Same |
| 4 | Ship inbox.ts + ollama.ts + audit.ts + scheduler cron in one PR | Claude | PR | This week |
| 5 | Install Supabase backup cron on VPS | Claude | SSH script | Same PR |
| 6 | Ship Langfuse self-host (doc 605 Phase 1 + 611 Phase 3 prereq) | Claude | PR | This week or next |
| 7 | Add `/health` endpoint + UptimeRobot monitor | Claude | PR | Phase 5 hardening |
| 8 | Re-validate this doc after Phase 1 ships | Claude | Doc update | After PR merges |

## Sources

- Live VPS audit 2026-05-05 10:12 UTC via SSH
- `.claude/skills/inbox/SKILL.md` (in repo) for AgentMail API shape
- [AgentMail platform](https://agentmail.to/) - inbox provider
- [Doc 459 - VPS infrastructure baseline](../459-vps-infrastructure-baseline/) (referenced)
- [Doc 605 - Agentic tooling May 2026](../../agents/605-agentic-tooling-may-2026/) - Langfuse Phase 1
- [Doc 607 - Three bots one substrate](../../agents/607-three-bots-one-substrate/)
- [Doc 611 - ZOE autonomy v2](../../agents/611-zoe-autonomy-v2-inbox-bonfire-subagents/) - parent doc
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md) - confirmed `/api/chat` endpoint shape
- Local file `/Users/zaalpanthaki/Documents/worktrees/inbox-process-0503-1109/.env.local` - AgentMail key location confirmed
