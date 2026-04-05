# 226 — Paperclip + OpenClaw Best Practices for ZAO OS

> **Status:** Research complete
> **Date:** March 30, 2026
> **Goal:** Actionable configuration guide for ZAO's Paperclip (agent orchestration) and OpenClaw (agent runtime) stack — SOUL.md writing, agent personas, MCP servers, skills, routines, issue sync, multi-agent handoffs, and knowledge base loading

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **SOUL.md scope** | KEEP under 200 lines. Identity + values + voice + constraints only. Move workflow rules to HEARTBEAT.md, move domain knowledge to MCP-accessible research docs |
| **Agent persona style** | USE specific behavioral descriptions ("default to 2-3 sentence replies") not vague adjectives ("be concise"). Add anti-patterns section listing phrases/behaviors to avoid |
| **MCP server priority** | ADD 4 servers immediately: Brave Search (web), Supabase (DB), Filesystem (local files), Tavily (AI-optimized search). Keep GitHub (already running). Total: 5 servers, ~2,400 tokens overhead |
| **Per-agent MCP routing** | ENABLE `mcpServers` per agent to limit tool exposure. CEO gets GitHub + Brave. Engineer gets GitHub + Supabase + Filesystem. Researcher gets Brave + Tavily + Filesystem |
| **Cron schedules** | SET 3 initial routines: daily digest (9:00 UTC), weekly fractal reminder (Mon 22:00 UTC / 5pm EST), weekly research staleness check (Mon 14:00 UTC) |
| **Issue sync direction** | KEEP one-way GitHub-to-Paperclip sync (PR #71). Add Paperclip-to-GitHub reverse sync via plugin when Paperclip generates its own issues from CEO decomposition |
| **Knowledge base loading** | USE git clone into workspace (`~/openclaw-workspace/zaoos/`). Skip QMD/vector search for now — BM25 keyword search over 225+ markdown files is sufficient at current scale |
| **Agent count** | REDUCE from 7 to 4 active agents. CEO (strategy/delegation), Engineer (code tasks), Researcher (knowledge/analysis), Community Manager (social/digest). Pause QA Engineer, OpenClaw, ZAO Orchestrator until workload justifies them |

## Comparison: Agent Configuration Approaches

| Approach | Persona Quality | Handoff Clarity | Cost/Month | Maintenance | Best For |
|----------|----------------|-----------------|------------|-------------|----------|
| **Detailed SOUL.md per agent + HEARTBEAT.md checklists (RECOMMENDED)** | High — each agent has distinct voice and constraints | High — heartbeat checklist tells agent exactly what to check | ~$40 (4 agents, staggered heartbeats) | Medium — update SOUL.md monthly | Teams with 3-7 agents, clear role separation |
| **Single shared system prompt** | Low — all agents sound identical | Low — no role-specific workflows | ~$20 | Low | Solo agent setups |
| **Full Paperclip org-chart with 9+ roles** | High | High | ~$120+ | High — many agents to tune | Large teams, high-volume task throughput |
| **OpenClaw-only (no Paperclip)** | Medium — SOUL.md works well | Low — no task management layer | ~$15 | Low | Personal assistant, no delegation |

## 1. SOUL.md Best Practices

### Structure (Under 200 Lines)

A well-crafted SOUL.md for ZAO should contain exactly these sections:

```markdown
# [Agent Name]

## Identity
Who this agent is. 1-2 sentences. Role in the ZAO community.

## Voice
Communication style. Specific, testable rules:
- Default response length (e.g., "2-3 sentences unless asked for detail")
- Formatting preference (bullets vs prose)
- Tone (direct, no hedging, lead with the point)

## Values
What this agent optimizes for. Ordered by priority:
1. Accuracy over speed
2. Community benefit over individual convenience
3. Transparency over polish

## Expertise
- Deep knowledge: [list domains]
- Working knowledge: [list domains]
- Defer to human: [list domains]

## Constraints (Never Do)
- NEVER expose API keys, tokens, or secrets
- NEVER push directly to main branch
- NEVER speak for the community without data
- NEVER generate code — create issues with specs instead (CEO only)

## Context
- Repo: bettercallzaal/ZAOOS
- Stack: Next.js 16, React 19, Supabase, Neynar, XMTP
- Community: ~40 members, decentralized music artists and builders
- Research library: 225+ docs at ~/openclaw-workspace/zaoos/research/
```

### ZAO-Specific SOUL.md Content

For a music community project, include:

- **Music domain context**: 9 audio platforms supported (Audius, SoundCloud, YouTube, Spotify, Apple Music, Bandcamp, Mixcloud, direct URL, HLS)
- **Governance context**: Three-tier system (ZOUNZ on-chain, Snapshot gasless, Community proposals with Respect weighting)
- **Community norms**: Respect-weighted decisions, build-in-public transparency, "Farcaster" not "Warpcast"
- **Anti-patterns**: No "vibes-only" language, no unsolicited music recommendations without data, no claiming community consensus without polling

### What NOT to Put in SOUL.md

| Content | Where It Belongs | Why |
|---------|-----------------|-----|
| Workflow steps (check inbox, process tasks) | `HEARTBEAT.md` | Changes per sprint, not per identity |
| API endpoints, file paths | MCP server tools | Keeps SOUL.md timeless |
| Full research doc contents | `~/openclaw-workspace/zaoos/research/` | Agent retrieves on demand |
| Secrets, tokens, keys | `.env` file on VPS | Security |
| Specific sprint goals | Paperclip issues/goals | Changes weekly |

### Current SOUL.md vs Recommended

The existing SOUL.md at `/home/zaal/openclaw-workspace/SOUL.md` (57 lines, written in `scripts/openclaw-update-soul.sh`) is solid but needs 3 improvements:

1. **Add anti-patterns section** — list specific phrases to avoid ("I'd be happy to help", "As an AI")
2. **Add expertise domains** — distinguish deep vs working knowledge
3. **Add voice specificity** — "2-3 sentence default" instead of "direct, no fluff"

## 2. Agent Persona Design

### The 4 ZAO Agents

Each agent needs a distinct SOUL.md. Here are the persona blueprints:

#### CEO Agent (ZAO Orchestrator)

```
Identity: Strategic leader. Breaks goals into issues. Never writes code.
Voice: Founder tone — direct, decisive, respects time. Leads with the point.
Expertise (deep): ZAO roadmap, community dynamics, governance
Expertise (working): Music tech, Farcaster protocol, tokenomics
Constraints: Never write code. Never merge PRs. Never approve without data.
Heartbeat: Check Paperclip inbox → Review open issues → Decompose new goals → Assign to agents
```

#### Engineer Agent

```
Identity: Full-stack developer. Executes coding tasks from Paperclip issues.
Voice: Technical, precise. Code snippets in responses. Names files and line numbers.
Expertise (deep): Next.js 16, React 19, Supabase, TypeScript, Tailwind v4
Expertise (working): Farcaster/Neynar API, XMTP, Wagmi/Viem, Web Audio API
Constraints: Never push to main. Always create branches. Always include tests.
Heartbeat: Check assigned issues → Pick highest priority → Create branch → Build → Open PR
```

#### Researcher Agent

```
Identity: Knowledge synthesizer. Searches 225+ research docs, conducts web research.
Voice: Analytical but accessible. Cites doc numbers. Quantifies findings.
Expertise (deep): Research methodology, music industry, web3 ecosystem, AI agents
Expertise (working): Farcaster, governance models, cross-platform publishing
Constraints: Never fabricate sources. Always cite doc numbers. Flag when research is stale (>30 days).
Heartbeat: Check research requests → Search library → Conduct web research → Save findings
```

#### Community Manager Agent

```
Identity: Community liaison. Monitors Farcaster, posts digests, onboards new members.
Voice: Warm but informative. Uses ZAO community language. Always says "Farcaster" not "Warpcast".
Expertise (deep): ZAO community, member profiles, Respect system, fractal process
Expertise (working): Farcaster protocol, content moderation, onboarding flows
Constraints: Never share member personal data. Never moderate without confidence score >0.8.
Heartbeat: Check mentions → Post daily digest → Flag moderation items → Update member directory
```

### Heartbeat Configuration Per Agent

| Agent | Interval | Wake on Assignment | Timeout | Session Style |
|-------|----------|-------------------|---------|---------------|
| CEO | 300s (5 min) | Yes | 120s | Resumable |
| Engineer | 0 (manual/assignment only) | Yes | 300s | Resumable |
| Researcher | 0 (manual/assignment only) | Yes | 180s | Isolated |
| Community Manager | 600s (10 min) | Yes | 120s | Resumable |

### Writing Effective Personas: The 5 Rules

1. **Specificity over aspiration** — "Reply in 2-3 sentences" beats "be concise"
2. **Anti-patterns are more valuable than examples** — Agents avoid what you explicitly ban
3. **Test with 5 scenarios** — expertise question, brainstorm, "I don't know", frustration, ambiguous request
4. **Iterate monthly** — Review agent outputs, add rules when drift appears. When agents make mistakes, add rules directly to their persona prompts
5. **Separate identity from workflow** — SOUL.md is WHO, HEARTBEAT.md is WHAT and WHEN

## 3. MCP Server Configuration

### Recommended Stack (5 Servers)

Add these to `/home/zaal/openclaw/openclaw.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropic/brave-search-mcp"],
      "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/filesystem-mcp", "/home/zaal/openclaw-workspace"]
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": { "TAVILY_API_KEY": "${TAVILY_API_KEY}" }
    }
  }
}
```

### Per-Agent MCP Routing

```json
{
  "agents": {
    "ceo": { "mcpServers": ["github", "brave-search"] },
    "engineer": { "mcpServers": ["github", "supabase", "filesystem"] },
    "researcher": { "mcpServers": ["brave-search", "tavily", "filesystem"] },
    "community-manager": { "mcpServers": ["supabase", "brave-search"] }
  }
}
```

**Token overhead**: Each MCP server adds 200-800 tokens of tool descriptions. 5 servers = ~2,400 tokens total. Per-agent routing reduces this to ~800-1,200 tokens per agent.

### MCP Server Cost

| Server | API Cost | Free Tier |
|--------|----------|-----------|
| GitHub | Free | Unlimited for public repos |
| Brave Search | $0 | 2,000 queries/month free |
| Supabase | $0 | Already on project plan |
| Filesystem | $0 | Local, no API |
| Tavily | $0 | 1,000 searches/month free |
| **Total** | **$0/month** | All within free tiers |

### Future MCP Servers (Add When Needed)

| Server | When | Why |
|--------|------|-----|
| PostgreSQL (direct) | When Supabase MCP is insufficient for complex queries | Raw SQL access |
| Puppeteer/Playwright | When QA Agent is activated | Browser automation for testing |
| Slack/Discord | When Community Manager needs direct channel posting | Currently using Telegram only |
| Sequential Thinking | When agents need multi-step reasoning | Enhanced reasoning for complex tasks |

## 4. Skills Setup

### OpenClaw Skills Format

Skills are markdown files at `~/.openclaw/skills/{name}/SKILL.md`. The format mirrors Claude Code's `.claude/skills/` pattern.

### Priority Skills to Create

#### Skill 1: zao-research

```markdown
# ZAO Research

Search the 225+ research docs in ~/openclaw-workspace/zaoos/research/ and conduct
new web research when needed.

## Usage
- "Research [topic]" — search existing library first, then web
- "What docs cover [topic]?" — library search only

## Process
1. Search research/_graph/KNOWLEDGE.json for matching tags/topics
2. Read matching README.md files
3. If insufficient, search web via Brave/Tavily MCP
4. Summarize findings with doc numbers and sources
```

#### Skill 2: community-digest

```markdown
# Community Digest

Generate daily activity summary for ZAO community.

## Process
1. Query Supabase for last 24h: new casts, proposals, music submissions, respect changes
2. Format as concise bullet points
3. Post to configured channel (Telegram/Discord/Farcaster)

## Schedule
Cron: 0 9 * * * (9:00 UTC daily)
```

#### Skill 3: issue-decomposer

```markdown
# Issue Decomposer

Break down high-level goals into actionable GitHub issues.

## Process
1. Read the goal description
2. Search research library for relevant context
3. Create 3-7 sub-issues with: title, labels, acceptance criteria, priority, estimated effort
4. Reference relevant research doc numbers in each issue body
5. Assign priority: P0 (blocking), P1 (this sprint), P2 (next sprint), P3 (backlog)
```

### Porting Claude Code Skills to OpenClaw

8 existing skills in `.claude/skills/` can be ported:

| Claude Code Skill | OpenClaw Equivalent | Effort |
|-------------------|-------------------|--------|
| `zao-research` | `zao-research` | 30 min (reformat SKILL.md) |
| `autoresearch` | Not portable (requires Claude Code runtime) | Skip |
| `minimax` | Not needed (OpenClaw uses MiniMax natively) | Skip |
| Custom skills (qa, review, ship) | gstack skills (already available as OpenClaw's `coding-agent`) | Config only |

## 5. Routines / Schedules

### OpenClaw Cron Configuration

Cron jobs persist under `~/.openclaw/cron/` and survive gateway restarts. Three schedule types:

| Type | Syntax | Example |
|------|--------|---------|
| `cron` | Standard 5-field | `0 9 * * *` (9am daily) |
| `every` | Interval in ms | `every 3600000` (hourly) |
| `at` | One-shot ISO timestamp | `at 2026-04-01T09:00:00Z` |

### Recommended Initial Routines

#### Daily Community Digest (9:00 UTC)

```
Schedule: 0 9 * * *
Agent: Community Manager
Session: isolated
Delivery: announce to Telegram
Prompt: "Generate the daily ZAO community digest. Query Supabase for: new casts (last 24h), active proposals, music submissions, respect changes. Format as concise bullets. Post to Telegram."
```

#### Weekly Fractal Reminder (Monday 22:00 UTC / 5pm EST)

```
Schedule: 0 22 * * 1
Agent: Community Manager
Session: isolated
Delivery: announce to Telegram + Discord
Prompt: "Post the weekly fractal reminder. Monday 6pm EST. Include: how to join, what to prepare, link to the process doc."
```

#### Weekly Research Staleness Check (Monday 14:00 UTC)

```
Schedule: 0 14 * * 1
Agent: Researcher
Session: isolated
Delivery: direct to Zaal (Telegram)
Prompt: "Scan research/_graph/KNOWLEDGE.json. Find docs older than 30 days with tags matching active sprint goals. List the top 5 most stale docs that need updating."
```

#### Nightly GitHub Sync (2:00 UTC)

```
Schedule: 0 2 * * *
Agent: CEO
Session: main
Delivery: none (internal)
Prompt: "Check GitHub for new issues, PRs, and comments on bettercallzaal/ZAOOS since last sync. Update Paperclip tasks accordingly."
```

### Cron Execution Styles

| Style | Use Case | Context |
|-------|----------|---------|
| `main` | Tasks needing full agent memory | CEO reviewing strategy |
| `isolated` | Tasks that should start fresh | Digests, reminders (no context pollution) |
| `current` | Continue existing conversation | Follow-up on earlier research |
| `session:<key>` | Named persistent session | Weekly report that accumulates data |

## 6. Issue Management / Sync Patterns

### Current Setup (GitHub to Paperclip)

The sync workflow (PR #71, `.github/workflows/sync-to-paperclip.yml`) triggers on GitHub issue events (opened, closed, labeled) and creates corresponding Paperclip issues via `scripts/sync-issue-to-paperclip.js`.

**Sync flow:**
```
GitHub Issue (opened/closed/labeled)
  → GitHub Actions workflow
    → scripts/sync-issue-to-paperclip.js
      → POST /api/companies/{id}/issues
        → Paperclip issue created
          → GitHub comment added ("Synced to Paperclip: ZAO-42")
```

### Improvements to Make

1. **Add bidirectional sync** — When Paperclip CEO decomposes goals into issues, push them back to GitHub
2. **Map Paperclip status changes to GitHub** — When agent marks issue "done" in Paperclip, close the GitHub issue
3. **Sync labels** — Map Paperclip priorities (critical/high/medium/low) to GitHub labels
4. **Deduplicate** — Check for existing Paperclip issue before creating (currently creates duplicates on re-label)

### Issue Creation Best Practices for Agents

When the CEO agent creates issues, enforce this template via HEARTBEAT.md:

```markdown
## Title
[Verb] [specific feature] — e.g., "Add binaural beats frequency presets"

## Body
**Problem:** What's wrong or missing
**Proposed Solution:** How to fix it
**Acceptance Criteria:**
- [ ] Criterion 1 (testable)
- [ ] Criterion 2 (testable)
**Related Research:** Doc 128, Doc 155
**Priority:** P1 (this sprint)
**Effort:** ~4 hours
```

## 7. Multi-Agent Orchestration

### How Agents Hand Off Work

Paperclip's coordination model is **task-centric with no side channels**. All communication flows through the issue system.

**Handoff pattern:**
```
CEO creates issue → assigns to Engineer
  Engineer picks up on next heartbeat
    Engineer creates branch, builds, opens PR
      Engineer comments on issue with PR link
        CEO reviews PR via GitHub MCP
          CEO approves or requests changes (issue comment)
            Engineer addresses feedback
              CEO closes issue when merged
```

### Escalation Rules

| Situation | Agent Action |
|-----------|-------------|
| Blocked by missing context | Comment on issue, tag Researcher |
| Blocked by external dependency | Escalate to CEO via parent issue comment |
| Quality concern | Create sub-issue for QA review |
| Needs human decision | Comment on issue, notify Zaal via Telegram |
| Budget exceeded | Paperclip auto-pauses agent at 100% budget ceiling |

### Preventing Agent Loops

3 safeguards to prevent runaway agent activity:

1. **Timeout per heartbeat** — 120-300s max execution time
2. **Budget ceiling** — Set monthly token budgets per agent ($10 CEO, $15 Engineer, $10 Researcher, $5 Community Manager = $40/month total)
3. **Session reset** — When agent loops on the same issue 3 times without progress, reset session for clean start

### Cross-Agent Context Sharing

Agents share context through 3 mechanisms:

1. **Issue comments** — Primary communication channel, full audit trail
2. **Shared workspace** — All agents access `~/openclaw-workspace/zaoos/` via Filesystem MCP
3. **Supabase MCP** — Shared database access for member data, governance state, music library

There is no separate messaging layer between agents. This is intentional — it creates inherent audit trails linking communication to work context.

## 8. Knowledge Base Loading

### Method: Git Clone (Recommended)

```bash
# On VPS:
cd ~/openclaw-workspace
git clone --depth 1 https://github.com/bettercallzaal/ZAOOS.git zaoos
```

**Why git clone over SCP/rsync:**
- Agents can `git pull` for updates without full re-transfer
- 225+ research docs at ~500KB total — trivial size
- Knowledge graph at `research/_graph/KNOWLEDGE.json` included automatically
- Codebase available for Engineer agent reference

### Auto-Update Schedule

Add a cron job to keep the workspace current:

```bash
# Crontab on VPS:
0 */6 * * * cd /home/zaal/openclaw-workspace/zaoos && git pull --ff-only >> /tmp/zaoos-sync.log 2>&1
```

This pulls every 6 hours (4 times/day), keeping agent knowledge within 6 hours of the latest commit.

### What Agents Access

| Path | Content | Size | Which Agents |
|------|---------|------|-------------|
| `research/*/README.md` | 225+ research documents | ~2MB | Researcher, CEO |
| `research/_graph/KNOWLEDGE.json` | Machine-readable index with tags and relations | ~50KB | Researcher |
| `src/` | Full source code | ~5MB | Engineer |
| `community.config.ts` | Community branding, channels, contracts | ~10KB | All agents |
| `CLAUDE.md` | Project instructions and conventions | ~5KB | All agents |
| `scripts/` | Database setup, wallet gen, sync scripts | ~100KB | Engineer |

### Knowledge Retrieval Patterns

Agents should search in this order:

1. **KNOWLEDGE.json** — Check tags and metadata first (fast, structured)
2. **Research README.md** — Read full doc when KNOWLEDGE.json points to it
3. **Source code** — Check `src/` when researching implementation details
4. **Web search** — Use Brave/Tavily MCP when internal knowledge is insufficient

### Skip Vector Search (For Now)

QMD MCP server (hybrid BM25 + vector search) is available but unnecessary at current scale:
- 225 markdown files are searchable via keyword grep in <1 second
- KNOWLEDGE.json provides structured tag-based lookup
- Vector search adds complexity (embeddings, storage, model dependency) without proportional benefit
- **Revisit when research library exceeds 500 docs** or when agents need semantic similarity matching

## ZAO OS Integration

### Files That Connect to Paperclip/OpenClaw

| Path | Purpose | Connection |
|------|---------|------------|
| `scripts/sync-issue-to-paperclip.js` | GitHub-to-Paperclip issue sync | GitHub Actions workflow trigger |
| `scripts/openclaw-update-soul.sh` | Update SOUL.md on VPS | Run manually when persona changes |
| `scripts/openclaw-setup-github.sh` | Configure GitHub MCP + initial SOUL.md | One-time setup script |
| `.github/workflows/sync-to-paperclip.yml` | GitHub Actions workflow for issue sync | Triggers on issue opened/closed/labeled |
| `community.config.ts` | Community context for agents | Agents read for branding, channels, contracts |
| `research/_graph/KNOWLEDGE.json` | Research index for agent retrieval | Filesystem MCP access |
| `src/app/api/chat/assistant/route.ts` | In-app AI assistant (MiniMax) | Separate from OpenClaw — coexists |

### VPS Configuration Files

| Path on VPS | Purpose |
|-------------|---------|
| `/home/zaal/openclaw/openclaw.json` | Gateway config: model, MCP servers, channels |
| `/home/zaal/openclaw/.env` | API keys and secrets |
| `/home/zaal/openclaw-workspace/SOUL.md` | Agent identity |
| `/home/zaal/openclaw-workspace/zaoos/` | Git clone of ZAO OS repo |
| `~/.openclaw/cron/` | Persistent cron job storage |
| `~/.openclaw/skills/` | OpenClaw skill definitions |

### Immediate Action Items

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Update SOUL.md with anti-patterns and expertise sections | 15 min | Higher persona quality |
| 2 | Add Brave Search + Filesystem MCP servers | 10 min | Web search + file access for agents |
| 3 | Add Supabase MCP server | 10 min | Direct database access for agents |
| 4 | Configure per-agent MCP routing | 15 min | Reduced token overhead per agent |
| 5 | Set up 3 cron routines (digest, fractal reminder, staleness check) | 20 min | Automated community ops |
| 6 | Git clone repo into workspace | 5 min | Full knowledge base for agents |
| 7 | Set up auto-pull cron on VPS | 5 min | Keep knowledge current |
| 8 | Reduce active agents from 7 to 4 | 10 min | Lower cost, clearer responsibilities |

**Total setup time: ~90 minutes. Monthly cost: ~$40 (agent API calls) + $0 (MCP servers on free tiers).**

## Sources

- [OpenClaw SOUL.md Guide — Learn OpenClaw](https://learnopenclaw.com/core-concepts/soul-md) — Structure, anti-patterns, specificity rule, iteration practices
- [Paperclip Agent Runtime Docs](https://github.com/paperclipai/docs/blob/main/agents-runtime.md) — Heartbeat policy, session management, adapter configuration, execution limits
- [Best MCP Servers for OpenClaw 2026](https://openclawlaunch.com/guides/best-mcp-servers) — Server rankings, installation methods, token overhead analysis
- [OpenClaw MCP Setup (12 Servers)](https://openclawvps.io/blog/add-mcp-openclaw) — Per-agent routing, environment variables, troubleshooting, token cost considerations
- [OpenClaw Cron Jobs — DeepWiki](https://deepwiki.com/openclaw/openclaw/3.7-automation-and-cron) — CronService architecture, schedule types, session targets, delivery modes, retry policy
- [Paperclip Review 2026 — Vibecoding](https://vibecoding.app/blog/paperclip-review) — Agent configuration patterns, heartbeat scheduling, skills attachment, 16 company templates
- [Paperclip SPEC.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/SPEC.md) — Agent roles, org chart structure, task hierarchy, approval gates, budget isolation
- [Paperclip Official](https://paperclip.ing/) — Zero-human company orchestration
- [OpenClaw Official Docs](https://docs.openclaw.ai/automation/cron-jobs) — Cron syntax, stagger windows, startup catchup
- [aaronjmars/soul.md](https://github.com/aaronjmars/soul.md) — Open-source SOUL.md generator and templates
- [Doc 202 — Multi-Agent Orchestration](../../agents/202-multi-agent-orchestration-openclaw-paperclip/) — Three-layer hierarchy, OpenClaw supervising Paperclip workers
- [Doc 204 — OpenClaw Setup Runbook](../../_archive/204-openclaw-setup-runbook/) — VPS config, phase-by-phase deployment
- [Doc 174 — Paperclip Multi-Company](../../_archive/174-paperclip-multi-company-agents/) — Task hierarchy, delegation patterns, cross-team work
- [Doc 175 — Paperclip ClipMart + Plugins](../../_archive/175-paperclip-clipmart-plugins/) — Plugin architecture, ZAO-specific plugin designs
- [Doc 208 — OpenClaw Skills & Capabilities](../../agents/267-openclaw-skills-capabilities/) — 52 installed skills, 82 extensions, channel integrations
