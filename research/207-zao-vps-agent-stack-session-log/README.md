# 207 — ZAO VPS Agent Stack: Full Session Log & Architecture

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Document everything deployed on the ZAO VPS (31.97.148.88), how the systems connect, and the roadmap for turning this into a community-managed open-source agent infrastructure

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **VPS agent stack** | RUNNING — OpenClaw (supervisor) + Paperclip (task mgmt) + Claude Code (auth'd) on single Hostinger KVM 2 ($5/mo) |
| **GitHub integration** | USE fine-grained PAT now (90-day expiry), GitHub App created (ID 3213007) for future rotation |
| **Inter-system bridge** | USE Paperclip REST API from OpenClaw — both on localhost, no auth overhead. Update SOUL.md with API endpoints |
| **Agent coordination** | USE Paperclip heartbeats (not always-on) for cost efficiency. CEO manages, Engineer codes, OpenClaw supervises |
| **Community management** | PLAN ElizaOS on Railway ($5/mo) for 24/7 Farcaster /zao channel presence. Managed as Paperclip worker |
| **Knowledge sharing** | USE 200+ research docs as agent knowledge base. Researcher agent updates them. OpenClaw references them when creating specs |
| **Open-source model** | DESIGN community.config.ts as the fork point — any community can clone ZAOOS, change config, and run their own agent stack |

## What Was Built (Session: March 28, 2026)

### Timeline of Actions

| Time | Action | Result |
|------|--------|--------|
| 7:00 PM | Created GitHub App `zao-orchestrator` | App ID 3213007, Installation ID 119761791 |
| 7:10 PM | Created fine-grained PAT | Scoped to ZAOOS: Contents, Issues, PRs, Actions, Commit statuses (R/W) |
| 7:15 PM | SCP'd setup script to VPS | `scripts/openclaw-setup-github.sh` |
| 7:18 PM | Ran setup — added `mcpServers` to config | FAILED — `mcpServers` not a valid root key |
| 7:21 PM | Fixed config, removed bad key | Container back to healthy |
| 7:25 PM | Discovered `openclaw mcp set` command | Correct way: `openclaw mcp set github '{...}'` |
| 7:30 PM | Configured GitHub MCP via CLI | SUCCESS — `openclaw mcp set github` with PAT |
| 7:34 PM | Tested on Telegram: "Create a GitHub issue" | SUCCESS — Issue #11 created with labels, acceptance criteria |
| 7:36 PM | Sent orchestrator role briefing via Telegram | Bot confirmed: "Ready to receive tasks" |
| 7:45 PM | Model accidentally switched to highspeed | Fixed via `/model` reset in Telegram |
| 8:00 PM | Research doc 205 written | Full 3-phase deployment plan |
| 8:18 PM | Installed Node.js 20 on VPS | `curl nodesource + apt install` |
| 8:23 PM | Installed Paperclip on VPS | `su - zaal -c "npx paperclipai onboard --yes"` |
| 8:24 PM | Set up Cloudflare tunnel | `cloudflared tunnel --url http://localhost:3100` |
| 8:28 PM | Created "The ZAO" company in Paperclip | Company + CEO agent + onboarding task |
| 8:37 PM | CEO first run — failed | `claude` not in PATH |
| 8:43 PM | Installed Claude Code CLI, logged in | `npm install -g @anthropic-ai/claude-code` + `/login` |
| 8:47 PM | CEO retry — SUCCESS | Cloned repo, reviewed 13 issues, hired Engineer, created plan |
| 8:50 PM | Engineer agent created | Pending board approval |
| 8:52 PM | Engineer approved | Now in sidebar, ready for tasks |

### Architecture Deployed

```
┌─────────────────────────────────────────────────────────┐
│  YOU (Zaal) — Claude Code locally + Telegram + Dashboard│
│  Can: approve hires, merge PRs, override decisions      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  OPENCLAW (Layer 1 — Supervisor)                        │
│  Telegram: @zaoclaw_bot                                 │
│  GitHub MCP: creates issues, reviews PRs                │
│  SOUL.md: orchestrator, never codes                     │
│  Minimax M2.7 LLM                                      │
│  TODO: Add Paperclip API access to SOUL.md              │
└──────────────────┬──────────────────────────────────────┘
                   │ checks in via localhost:3100/api
┌──────────────────▼──────────────────────────────────────┐
│  PAPERCLIP (Layer 2 — Task Management)                  │
│  Dashboard: Cloudflare tunnel                           │
│  Company: "The ZAO"                                     │
│  CEO Agent: Claude Code, Opus 4.6, 1hr heartbeat        │
│  Engineer Agent: Claude Code, 30min heartbeat           │
│  TODO: Researcher, Community Manager, QA agents         │
│  TODO: Routines for recurring work                      │
└──────────────────┬──────────────────────────────────────┘
                   │ (future)
┌──────────────────▼──────────────────────────────────────┐
│  ELIZAOS (Layer 3 — Social Presence) [NOT YET]          │
│  Railway: $5/mo                                         │
│  Farcaster: /zao channel monitoring + casting           │
│  XMTP: encrypted DMs                                    │
│  Managed as Paperclip worker                            │
└─────────────────────────────────────────────────────────┘
```

## Comparison: Agent Communication Patterns

| Pattern | How It Works | Latency | Cost | Best For |
|---------|-------------|---------|------|----------|
| **OpenClaw → Paperclip API** (RECOMMENDED) | OpenClaw curls localhost:3100 from inside SOUL.md instructions | <100ms | $0 | Supervisor check-ins, status reports |
| **Telegram → OpenClaw → GitHub** (WORKING) | Zaal messages bot, bot creates issues | 1-5 min | Minimax API | Ad-hoc task creation |
| **Paperclip heartbeat → Claude Code** (WORKING) | Agent wakes, checks tasks, codes, sleeps | Heartbeat interval | Anthropic API | Automated coding/research |
| **Claude Code on VPS** (AVAILABLE) | SSH + `claude` in repo directory | Instant | Max plan | Manual intervention, debugging |
| **Webhook (future)** | GitHub → Paperclip on PR/push events | Seconds | $0 | Real-time CI/CD triggers |

## How to Connect OpenClaw ↔ Paperclip

### Step 1: Get Paperclip API Key

On VPS:
```bash
cat /home/zaal/.paperclip/instances/default/config.json | python3 -c "import json,sys; c=json.load(sys.stdin); print(c.get('auth',{}).get('agentApiKey','not found'))"
```

### Step 2: Update OpenClaw SOUL.md

Add to `/home/zaal/openclaw-workspace/SOUL.md`:

```markdown
## Paperclip Integration

You can check on your Paperclip team at http://localhost:3100/api.
Auth: Authorization: Bearer {PAPERCLIP_API_KEY}
Company ID: 83f48c75-de79-4e05-bfa2-1631611b5be7

Key endpoints:
- GET /api/companies/{id}/dashboard — team overview
- GET /api/companies/{id}/issues?status=in_progress — active work
- GET /api/companies/{id}/issues?status=done — completed work
- GET /api/companies/{id}/agents — agent status

Check in every 6 hours. Report:
1. Who's working on what
2. What's blocked
3. What shipped since last check
4. Any issues that need Zaal's attention
```

### Step 3: Set Up Cron Check-in (Optional)

OpenClaw can run periodic check-ins via its cron system, or Zaal can ask via Telegram: "Check on the Paperclip team."

## Community Management Vision

### How This Becomes Community-Managed

1. **Community members submit issues** via ZAO OS UI → `src/app/api/community-issues/route.ts` → saves to Supabase AND creates Paperclip task
2. **CEO agent** triages: prioritizes, assigns to Engineer or Researcher
3. **Engineer agent** codes the fix/feature, opens PR
4. **OpenClaw** reviews the PR, comments
5. **Zaal approves and merges** (or community governance votes on features)
6. **ElizaOS** announces the ship to /zao Farcaster channel

### Knowledge Sharing Architecture

```
Community member asks question
    → ElizaOS checks research/ docs (200+)
    → If found: answers with citation
    → If not: creates research issue in Paperclip
    → Researcher agent investigates
    → New research doc written
    → Knowledge base grows
    → Next time someone asks: instant answer
```

### Open-Source Fork Model

Any community can run this stack:
1. Fork `bettercallzaal/ZAOOS`
2. Edit `community.config.ts` (branding, channels, contracts)
3. Deploy VPS ($5/mo) with OpenClaw + Paperclip
4. Deploy Railway ($5/mo) with ElizaOS
5. Total: $15/mo for a full AI-managed community platform

## ZAO OS Integration Points

| Component | File | Agent Connection |
|-----------|------|-----------------|
| Community issues API | `src/app/api/community-issues/route.ts` | Forwards to Paperclip CEO, needs GitHub issue creation added |
| Neynar client | `src/lib/farcaster/neynar.ts` | ElizaOS uses for casting, OpenClaw reads channel |
| Supabase | `src/lib/db/supabase.ts` | All agents can query via Supabase MCP (TODO) |
| Agent configs | `agents/*/SOUL.md` | Paperclip reads, OpenClaw tunes |
| Research library | `research/*/README.md` | Researcher agent creates, all agents reference |
| Community config | `community.config.ts` | Fork point for other communities |
| Music curation | `src/lib/music/curationWeight.ts` | Future Music Curator agent |
| Governance | `src/components/governance/` | Future Governance agent |

## VPS Service Inventory

| Service | Port | Process | Status |
|---------|------|---------|--------|
| OpenClaw Gateway | 18789 | Docker container | Running |
| Paperclip | 3100 | Node.js (zaal user) | Running (foreground) |
| Embedded PostgreSQL | 54329 | Paperclip-managed | Running |
| Ollama | 11434 | systemd | Installed (CPU-only) |
| SSH | 22 | sshd | Running (Fail2Ban active) |
| Cloudflare Tunnel | dynamic | cloudflared | Manual (run as needed) |

## Security Considerations

| Risk | Mitigation |
|------|-----------|
| Paperclip runs in foreground | TODO: Create systemd service or use tmux/screen |
| Fine-grained PAT expires | 90-day expiry, rotate before. GitHub App ready for migration |
| Fail2Ban locks out SSH | Unban via Hostinger console, consider SSH key setup |
| Agent pushes to main | Branch protection on GitHub, SOUL.md rules, PAT has no admin |
| Cloudflare tunnel is temporary | Regenerate URL each time, or set up named tunnel with account |
| Claude Code auth on VPS | Max plan, single user. Consider API key for headless agents |

## Next Steps (Priority Order)

1. **Wire OpenClaw → Paperclip** — Update SOUL.md with Paperclip API endpoints and key
2. **Create more agents** — Researcher, Community Manager, QA via Paperclip CEO
3. **Set up Routines** — Daily digest, weekly research update, fractal reminders
4. **Daemonize Paperclip** — systemd service so it survives terminal close
5. **Community issues → GitHub** — Add GitHub issue creation to community-issues API route
6. **Supabase MCP** — Give OpenClaw direct database access
7. **ElizaOS deployment** — Railway, Farcaster + XMTP plugins, character.json
8. **SSH key setup** — Stop relying on password auth, avoid Fail2Ban issues
9. **Improvement loop** — OpenClaw reviews Paperclip worker outputs every 6 hours

## Sources

- [Paperclip Quickstart](https://www.mintlify.com/paperclipai/paperclip/quickstart) — `npx paperclipai onboard --yes`
- [Paperclip GitHub](https://github.com/paperclipai/paperclip) — 36.7K stars, MIT
- [OpenClaw MCP CLI](https://playbooks.com/skills/openclaw/skills/github-mcp) — `openclaw mcp set` syntax
- [Cloudflare Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps) — free temporary URLs
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/getting-started) — v2.1.86
- [Doc 202 — Multi-Agent Orchestration](../202-multi-agent-orchestration-openclaw-paperclip/) — 3-layer architecture
- [Doc 204 — OpenClaw Setup Runbook](../204-openclaw-setup-runbook/) — VPS config
- [Doc 205 — Deployment Plan](../205-openclaw-paperclip-elizaos-deployment-plan/) — Phase 1-3 steps
