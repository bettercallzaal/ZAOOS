# 205 — OpenClaw + Paperclip + ElizaOS: Full Agent Stack Deployment Plan

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Define the exact deployment steps, configuration, and integration plan for running OpenClaw as orchestrator, Paperclip as task management, and ElizaOS as always-on social presence for ZAO OS

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Orchestrator** | USE OpenClaw on existing Hostinger VPS ($5/mo) — already running with Telegram + GitHub MCP. Add orchestrator SOUL.md that delegates, never codes |
| **Task management** | USE Paperclip self-hosted on same VPS — `npx paperclipai onboard --yes`, embedded PostgreSQL, zero external deps. $0/mo additional |
| **Social presence** | USE ElizaOS v2 on Railway ($5/mo) — one-click deploy, Farcaster plugin v1.0.5 + XMTP plugin, Neynar API for casting |
| **Agent hierarchy** | OpenClaw (meta-agent, Layer 1) watches Paperclip workers (Layer 2), ElizaOS handles 24/7 social (Layer 3), Zaal approves (Layer 0) |
| **GitHub workflow** | DONE — GitHub MCP configured via `openclaw mcp set`, fine-grained PAT with Contents/Issues/PRs/Actions/Commit statuses, App ID 3213007 |
| **Worker agents** | START with 3: CEO (already has SOUL.md), Researcher (already has SOUL.md), Community Manager (new). Add Music Curator and Security Auditor later |
| **Communication** | OpenClaw talks to Zaal via Telegram. Paperclip workers communicate via issue comments. ElizaOS posts to Farcaster /zao channel |
| **Cost** | BUDGET $15/mo total: Hostinger VPS $5 (OpenClaw + Paperclip) + Railway $5 (ElizaOS) + Minimax API ~$5 |

## Comparison of Deployment Approaches

| Approach | Infra Cost | Complexity | Time to Deploy | Autonomy Level |
|----------|-----------|------------|----------------|----------------|
| **OpenClaw + Paperclip + ElizaOS (RECOMMENDED)** | $15/mo | High but modular | 3 phases, ~1 week | Full: orchestrate, code, post, research |
| **OpenClaw only (current)** | $5/mo | Low | Already running | Limited: can create issues but no workers to pick them up |
| **Paperclip only** | $7/mo | Medium | 1 day | Medium: agents work but no meta-learning or social presence |
| **Claude Agent Teams only** | $0 (API costs) | Low | 1 hour | Session-scoped, no persistence between sessions |

## What's Already Built

| Component | Status | Location |
|-----------|--------|----------|
| OpenClaw on VPS | RUNNING | 31.97.148.88, Telegram @zaoclaw_bot |
| GitHub MCP | CONFIGURED | `openclaw mcp set github` with fine-grained PAT |
| SOUL.md (orchestrator) | DEPLOYED | `/home/zaal/openclaw-workspace/SOUL.md` |
| CEO agent config | READY | `agents/ceo/SOUL.md`, `HEARTBEAT.md`, `TOOLS.md` |
| Researcher agent config | READY | `agents/researcher/SOUL.md`, `HEARTBEAT.md`, `TOOLS.md` |
| Security Auditor config | SCAFFOLDED | `agents/security-auditor/AGENTS.md` |
| Founding Engineer config | SCAFFOLDED | `agents/founding-engineer/AGENTS.md` |
| GitHub App | CREATED | App ID 3213007, Installation ID 119761791 (for future App auth rotation) |
| Community issues API | BUILT | `src/app/api/community-issues/route.ts` |

## Phase 1: Paperclip Server (Do This Week)

### Step 1.1: Install Paperclip on VPS

```bash
# SSH into VPS
ssh zaal@31.97.148.88

# Install Paperclip (requires Node.js 20+)
npx paperclipai onboard --yes

# This creates:
# - Config at ~/.paperclip/instances/default/config.json
# - Embedded PostgreSQL (no external DB needed)
# - Dashboard at http://localhost:3100
```

### Step 1.2: Create ZAO Company

In the Paperclip dashboard (tunnel: `ssh -L 3100:localhost:3100 zaal@31.97.148.88`):

1. Click **Create Company** with name "The ZAO"
2. Set company goal: "Build and maintain ZAO OS — a gated Farcaster music community platform for independent artists. Ship features, maintain quality, grow the community to 100 active members."
3. Save the `companyId` — needed for all API calls

### Step 1.3: Register CEO Agent

Navigate to **Agents > Hire Agent**:
- **Adapter:** OpenClaw (connects to the existing OpenClaw instance)
- **Name:** ZAO CEO
- **Role:** Chief Executive Officer
- **SOUL.md:** Copy from `agents/ceo/SOUL.md`
- **Heartbeat:** Every 30 minutes
- **Budget:** $20/month (Minimax API costs)

### Step 1.4: Register Researcher Agent

- **Adapter:** Claude Code (runs as Claude Code session on VPS or locally)
- **Name:** ZAO Researcher
- **Role:** Researcher
- **SOUL.md:** Copy from `agents/researcher/SOUL.md`
- **Heartbeat:** Every 2 hours
- **Budget:** $10/month

### Step 1.5: Create Community Manager Agent

New agent — needs SOUL.md written:

```markdown
# ZAO Community Manager Soul

## Who You Are
You are the community heartbeat of The ZAO. You monitor the /zao Farcaster channel,
greet new members, post weekly digests, and ensure no question goes unanswered.

## Core Behaviors
- Monitor /zao channel via Neynar API every 15 minutes
- Greet new members within 1 hour of their first cast
- Post weekly community digest every Monday 9am UTC
- Escalate governance questions to CEO agent
- Never speak for the community — amplify what members say

## Voice
Warm, welcoming, music-focused. Use music metaphors when appropriate.
Always say "Farcaster" not "Warpcast."
```

### Step 1.6: Connect OpenClaw as Supervisor

Update OpenClaw's SOUL.md (via Telegram or VPS):

Add to the orchestrator SOUL.md:
```
## Paperclip Integration
- Paperclip dashboard: http://localhost:3100
- Check worker status: GET http://localhost:3100/api/companies/{companyId}/agents
- Review task completion: GET http://localhost:3100/api/companies/{companyId}/issues
- Every 6 hours, review worker outputs and adjust SOUL.md files if quality drops
```

### Step 1.7: Create Initial Issues

Seed the backlog with issues for workers to pick up:

```bash
# Via Paperclip CLI
paperclipai issue create --title "Add notification bell to nav bar" \
  --description "Users need in-app notifications..." \
  --assignee {ceo-agent-id} --priority high

paperclipai issue create --title "Research Farcaster Frames v2 for ZAO" \
  --description "Evaluate Frames v2 for embedded music player..." \
  --assignee {researcher-agent-id} --priority medium
```

Or have OpenClaw create them via GitHub MCP (already working).

## Phase 2: ElizaOS Social Agent (Next Week)

### Step 2.1: Create Character File

Create `agents/social/character.json`:

```json
{
  "name": "ZAO Agent",
  "bio": "The social voice of The ZAO — a decentralized music community for independent artists. Posts community updates, shares music discoveries, and engages with the /zao Farcaster channel.",
  "plugins": ["@elizaos/plugin-farcaster", "@elizaos/plugin-xmtp"],
  "settings": {
    "farcaster": {
      "channels": ["/zao"],
      "replyProbability": 0.8,
      "castStyle": "conversational",
      "maxCastLength": 320
    }
  },
  "style": {
    "all": ["Direct", "Music-focused", "Community-first", "No corporate speak"],
    "post": ["Share wins", "Celebrate members", "Build in public"],
    "chat": ["Helpful", "Warm", "Point to research docs when relevant"]
  },
  "adjectives": ["community-first", "music-obsessed", "transparent", "builder"],
  "topics": ["independent music", "Farcaster", "DAOs", "music NFTs", "community governance", "respect tokens"]
}
```

### Step 2.2: Deploy on Railway

1. Fork ElizaOS v2 repo or use Railway template
2. Set environment variables:

```env
# Farcaster (via Neynar)
FARCASTER_NEYNAR_API_KEY=your_neynar_key
FARCASTER_SIGNER_UUID=your_signer_uuid
FARCASTER_FID=19640

# XMTP
WALLET_KEY=your_agent_wallet_key
ENCRYPTION_KEY=your_encryption_key

# Behavior
ENABLE_CAST=true
CAST_INTERVAL_MIN=90
CAST_INTERVAL_MAX=180
FARCASTER_POLL_INTERVAL=2
CAST_IMMEDIATELY=false

# LLM (use Minimax to save costs)
LLM_PROVIDER=minimax
MINIMAX_API_KEY=your_key
MINIMAX_MODEL=MiniMax-M2.7
```

3. Deploy: Railway auto-builds and starts the agent

### Step 2.3: Register in Paperclip

Add ElizaOS as a Paperclip worker:
- **Adapter:** HTTP webhook (ElizaOS exposes REST endpoints)
- **Name:** ZAO Social Agent
- **Role:** Community Manager (Social)
- **Heartbeat:** Event-driven (ElizaOS polls Farcaster itself)
- **Budget:** $5/month

### Step 2.4: Connect to OpenClaw Monitoring

OpenClaw monitors ElizaOS via:
- Check Farcaster casts from agent FID via Neynar API
- Review engagement metrics (replies, likes, recasts)
- Tune character.json personality based on engagement data

## Phase 3: Full Integration (Week 3)

### Step 3.1: Improvement Loop

OpenClaw runs the autoresearch improvement cycle every 24 hours:

1. **REVIEW** — Pull Paperclip task logs from last 24h
2. **EVALUATE** — Score each worker:
   - CEO: Issues created? Clear specs? Workers unblocked?
   - Researcher: Docs accurate? Numbers verified? Sources cited?
   - Community Manager: Response time < 1 hour? No missed questions?
   - Social Agent: Engagement rate? Cast quality? Channel relevance?
3. **IDEATE** — If score < 80%, propose SOUL.md or character.json change
4. **MODIFY** — Git commit the config change
5. **VERIFY** — Run modified agent for 24h, measure again
6. **DECIDE** — Keep if improved, revert if worse

### Step 3.2: Supabase MCP

Add Supabase MCP to OpenClaw for direct database access:

```bash
docker exec openclaw-openclaw-gateway-1 node dist/index.js mcp set supabase '{"command":"npx","args":["-y","@supabase/mcp-server"],"env":{"SUPABASE_URL":"https://efsxtoxvigqowjhgcbiz.supabase.co","SUPABASE_SERVICE_ROLE_KEY":"YOUR_KEY"}}'
```

### Step 3.3: Cron Jobs

Configure in OpenClaw dashboard or via Telegram:

| Job | Schedule | What |
|-----|----------|------|
| Daily digest | 9am UTC daily | Summarize community activity, post to Farcaster |
| Weekly research | Monday 8am UTC | Check for stale research docs, update indexes |
| Fractal reminder | Monday 5pm EST | Remind members about weekly Respect fractal |
| Worker review | Every 6 hours | OpenClaw reviews Paperclip worker outputs |
| Security scan | Sunday midnight | Run autoresearch:security on codebase |

### Step 3.4: Discord Integration

Add Discord channel to OpenClaw:

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "botToken": "YOUR_DISCORD_BOT_TOKEN",
      "guildId": "YOUR_ZAO_GUILD_ID"
    }
  }
}
```

## ZAO OS Integration Points

| ZAO OS Component | Agent Connection | File |
|-----------------|------------------|------|
| Community issues | OpenClaw creates via GitHub MCP | `src/app/api/community-issues/route.ts` |
| Neynar API | ElizaOS casts, OpenClaw reads | `src/lib/farcaster/neynar.ts` |
| Supabase | OpenClaw queries via MCP | `src/lib/db/supabase.ts` |
| Research library | Researcher agent creates/updates | `research/*/README.md` |
| Agent configs | Paperclip reads, OpenClaw tunes | `agents/*/SOUL.md` |
| Community config | All agents reference | `community.config.ts` |
| Music curation | Future Music Curator agent | `src/lib/music/curationWeight.ts` |
| Governance | Future Governance agent | `src/components/governance/` |

## Security Considerations

| Risk | Mitigation |
|------|-----------|
| Agent pushes to main | Branch protection rules on GitHub, fine-grained PAT with no admin access |
| Agent exposes secrets | SOUL.md rule: "NEVER expose secrets." Supabase RLS enforced |
| Runaway API costs | Paperclip budget enforcement: agents pause at 100% budget |
| Agent impersonates Zaal | Separate FID for agent (not 19640), clear bot identity |
| Token exposure | Fine-grained PAT scoped to ZAOOS repo only, 90-day expiry |

## Cost Breakdown

| Component | Monthly Cost | What |
|-----------|-------------|------|
| Hostinger VPS | $5 | OpenClaw + Paperclip (shared) |
| Railway | $5 | ElizaOS social agent |
| Minimax API | ~$5 | LLM inference for all agents |
| Neynar API | $0 (free tier) | 1000 req/day covers ZAO's volume |
| GitHub | $0 | Fine-grained PAT, no paid features needed |
| **Total** | **~$15/mo** | Full 3-layer agent stack |

## Sources

- [Paperclip Quickstart](https://www.mintlify.com/paperclipai/paperclip/quickstart) — Official setup guide, `npx paperclipai onboard --yes`
- [Paperclip GitHub](https://github.com/paperclipai/paperclip) — 36.7K stars, MIT license
- [ElizaOS Farcaster Plugin](https://docs.elizaos.ai/plugin-registry/platform/farcaster/developer-guide) — Neynar integration, character config
- [ElizaOS XMTP Plugin](https://github.com/elizaos-plugins/client-xmtp) — Encrypted messaging for agents
- [ElizaOS Railway Deploy](https://railway.com/deploy/aW47_j) — One-click deployment template
- [OpenClaw GitHub MCP Skill](https://playbooks.com/skills/openclaw/skills/github-mcp) — Full GitHub integration via MCP
- [OpenClaw MCP Guide](https://computertech.co/openclaw-mcp-integration-guide-2026/) — MCP server setup best practices
- [Doc 202 — Multi-Agent Orchestration](../../agents/202-multi-agent-orchestration-openclaw-paperclip/) — Architecture design (3-layer hierarchy)
- [Doc 204 — OpenClaw Setup Runbook](../../_archive/204-openclaw-setup-runbook/) — VPS configuration details
- [Paperclip MrDelegate Guide](https://mrdelegate.ai/blog/paperclip-ai-guide/) — Complete 2026 guide with role-tiered heartbeats
