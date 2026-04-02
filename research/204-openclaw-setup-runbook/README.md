# 204 — OpenClaw Setup Runbook: VPS Configuration & ZAO Agent Deployment

> **Status:** In progress — VPS running, dashboard connected
> **Date:** March 28, 2026
> **Goal:** Complete step-by-step runbook for configuring OpenClaw on Hostinger VPS with ZAO knowledge base, Telegram, MCP servers, and agent personality

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **LLM Provider** | USE Minimax M2.7 as primary (OpenAI-compatible endpoint). Add as custom provider via `models.providers` in openclaw.json |
| **Fallback LLM** | USE Ollama llama3.1:8b locally on VPS ($0/mo) — already installed |
| **Agent Identity** | USE SOUL.md based on `agents/ceo/SOUL.md` — Zaal's digital twin, community-first leader |
| **Messaging** | USE Telegram first (simplest), Discord second. Config in `channels` block of openclaw.json |
| **Knowledge Base** | USE QMD MCP server for semantic search over 200+ research markdown files |
| **Memory** | USE OpenClaw's built-in MEMORY.md + daily logs |
| **Skills** | PORT existing `.claude/skills/zao-research/` to OpenClaw skill format |
| **MCP Servers** | ADD Supabase, GitHub, Tavily (web search) |

## Server Info (No Secrets)

| Item | Value |
|------|-------|
| **VPS Provider** | Hostinger KVM 2 |
| **IP** | 31.97.148.88 |
| **OS** | Ubuntu 24.04.4 LTS |
| **User** | zaal (sudo + docker) |
| **Docker** | v29.3.1 |
| **OpenClaw** | v2026.3.27 |
| **Ollama** | Installed (CPU-only) |
| **Firewall** | UFW active (SSH only) |
| **Fail2Ban** | Active |
| **Gateway Port** | 18789 (tunneled via SSH) |
| **Config Path** | `/home/zaal/openclaw/openclaw.json` |
| **Workspace** | `/home/zaal/openclaw-workspace` |

## Step-by-Step Configuration Plan

### Phase 1: Configure LLM Providers (Do Now)

On VPS, run the interactive configure command:
```bash
docker exec -it openclaw-openclaw-gateway-1 node dist/index.js configure
```

Or manually add Minimax to config. OpenClaw supports 12 official providers including MiniMax natively.

**Method A: Use `openclaw configure` interactive wizard**
```bash
docker exec -it openclaw-openclaw-gateway-1 node dist/index.js configure
```
Select Minimax when prompted, enter API key.

**Method B: Use `config set` commands**
```bash
docker exec openclaw-openclaw-gateway-1 node dist/index.js config set models.providers.minimax.apiKey "YOUR_KEY"
docker exec openclaw-openclaw-gateway-1 node dist/index.js config set models.providers.minimax.model "MiniMax-M2.7"
```

**Method C: Edit JSON directly**
Add to openclaw.json under a new `models` key:
```json
{
  "models": {
    "providers": {
      "minimax": {
        "apiKey": "YOUR_MINIMAX_KEY",
        "model": "MiniMax-M2.7"
      }
    }
  }
}
```

### Phase 2: Create SOUL.md (Agent Personality)

Create the SOUL.md at `/home/zaal/openclaw-workspace/SOUL.md`:

Based on `agents/ceo/SOUL.md`:
- Identity: ZAO CEO digital twin — community-first leader for decentralized music
- Voice: Direct, no fluff, lead with the point
- Values: Respect, Music, Community, Ownership, Transparency
- Knowledge: 200+ research docs, full codebase awareness
- Constraints: Never expose secrets, never speak for community without listening

### Phase 3: Connect Telegram Bot

1. **Create bot:** Message @BotFather on Telegram → `/newbot` → name it "ZAO Agent" → save token
2. **Add to config:**
```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "YOUR_BOT_TOKEN",
      "dmPolicy": "pairing"
    }
  }
}
```
3. **Restart gateway:** `docker compose down && docker compose up -d`
4. **Test:** Message the bot, approve pairing: `docker exec ... node dist/index.js pairing approve telegram <code>`

### Phase 4: Load Knowledge Base

**Option A: Copy research docs to workspace**
```bash
# From Mac:
scp -r research/_graph zaal@31.97.148.88:~/openclaw-workspace/research/
scp -r research/*/README.md zaal@31.97.148.88:~/openclaw-workspace/research/
```

**Option B: Clone repo into workspace**
```bash
# On VPS:
cd ~/openclaw-workspace
git clone --depth 1 https://github.com/bettercallzaal/ZAOOS.git zaoos
```

**Option C: QMD MCP Server (semantic search)**
Install QMD for hybrid BM25 + vector search over markdown:
```bash
# Install QMD MCP server
# Add to openclaw.json mcpServers config
```

### Phase 5: Add MCP Servers

Add to openclaw.json:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "YOUR_URL",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_KEY"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

### Phase 6: Add Skills

Port existing Claude Code skills to OpenClaw format:
- `zao-research` → search 200+ research docs
- `community-manager` → onboarding, digest, moderation
- `broadcast-manager` → schedule rooms, manage broadcasts

Skills are markdown files in `~/.openclaw/skills/` with the same SKILL.md format.

### Phase 7: Configure Cron Jobs

Via dashboard → Cron Jobs:
- **Daily digest:** 9am UTC — summarize community activity, post to Farcaster
- **Weekly research update:** Monday — check for stale research docs
- **Fractal reminder:** Monday 5pm EST — remind members about weekly fractal

## Comparison: OpenClaw Config Methods

| Method | When to Use | Complexity |
|--------|-------------|------------|
| `openclaw configure` | First-time setup, guided | Low |
| `openclaw config set key value` | Quick single-value changes | Low |
| Edit `openclaw.json` directly | Bulk changes, MCP servers | Medium |
| Dashboard → Settings | Visual changes, appearance | Low |
| Ask the agent in chat | "Add Minimax as a provider" | Lowest |

## Env Vars to Add to VPS .env

These go in `/home/zaal/openclaw/.env`:
```
# Minimax (primary LLM)
MINIMAX_API_KEY=your_key
MINIMAX_MODEL=MiniMax-M2.7
MINIMAX_API_URL=https://api.minimax.io/v1/chat/completions

# Ollama (local fallback)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# GitHub (for repo access MCP)
GITHUB_TOKEN=your_github_pat

# Supabase (for direct DB access MCP)
SUPABASE_URL=https://efsxtoxvigqowjhgcbiz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenClaw
OPENCLAW_CONFIG_DIR=/home/zaal/openclaw
OPENCLAW_WORKSPACE_DIR=/home/zaal/openclaw-workspace
```

## SSH Access Cheatsheet

```bash
# Connect to VPS
ssh zaal@31.97.148.88

# SSH tunnel for dashboard
ssh -L 18789:localhost:18789 zaal@31.97.148.88

# Dashboard URL
http://localhost:18789/#token=change-me-to-a-long-random-token

# Restart OpenClaw
cd ~/openclaw && docker compose down && docker compose up -d

# Check logs
docker logs openclaw-openclaw-gateway-1 --tail 20

# Approve device pairing
docker exec openclaw-openclaw-gateway-1 node dist/index.js devices approve

# Interactive configure
docker exec -it openclaw-openclaw-gateway-1 node dist/index.js configure
```

## ZAO OS Integration Points

| ZAO OS Component | OpenClaw Connection | How |
|-----------------|---------------------|-----|
| `research/_graph/KNOWLEDGE.json` | Agent memory / knowledge base | Copy to workspace or QMD MCP |
| `agents/ceo/SOUL.md` | Agent personality | Copy to workspace SOUL.md |
| `community.config.ts` | Community context | Agent reads for branding/config |
| `src/app/api/chat/assistant/` | In-app chat | Already built, uses Minimax |
| Supabase DB | MCP server for direct queries | MCP: @supabase/mcp-server |
| GitHub repo | MCP server for code access | MCP: @modelcontextprotocol/server-github |
| Neynar API | Farcaster actions | Custom MCP or API calls |

## Sources

- [OpenClaw Model Providers Docs](https://docs.openclaw.ai/concepts/model-providers)
- [OpenClaw Telegram Setup](https://docs.openclaw.ai/channels/telegram)
- [SOUL.md Guide](https://learnopenclaw.com/core-concepts/soul-md)
- [OpenClaw MCP Setup Guide](https://openclawvps.io/blog/add-mcp-openclaw)
- [OpenClaw RAG Knowledge Base](https://fast.io/resources/openclaw-knowledge-base-setup/)
- [Best MCP Servers for OpenClaw](https://openclawlaunch.com/guides/best-mcp-servers)
- [Custom LLM Providers](https://haimaker.ai/blog/integrating-custom-llm-providers-with-clawdbot/)
- [OpenClaw Mega Cheatsheet](https://moltfounders.com/openclaw-mega-cheatsheet)
- [Telegram Integration Guide (Hostinger)](https://medium.com/@mikhela65/how-to-connect-telegram-to-openclaw-on-hostinger-vps-control-your-ai-agent-from-anywhere-532ab7003d0e)
- [Doc 197 — OpenClaw Agent Memory](../197-openclaw-agent-memory-knowledge-system/)
- [Doc 202 — Multi-Agent Orchestration](../202-multi-agent-orchestration-openclaw-paperclip/)
