# 245 — ZOE Upgrade: Autonomous Workflow, Telegram Patterns, Neynar API & Founder Agent Playbook

> **Status:** Research complete
> **Date:** April 1, 2026
> **Goal:** Identify the highest-leverage upgrades to ZOE (OpenClaw agent on Hostinger VPS) for Zaal's daily workflow — combining autonomous routines, Telegram bot patterns, Neynar API creative uses, and founder agent best practices
> **Builds on:** Docs 234 (OpenClaw guide), 236 (autonomous operator pattern), 202 (multi-agent orchestration), 237 (USV agents), 239 (agent frameworks)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **OpenClaw version** | UPGRADE to v2026.3.31 — unified task ledger, ContextEngine plugin interface, 30+ security patches. Current install is outdated. |
| **Memory layer** | ADD Mem0 (41K GitHub stars, AWS's chosen memory provider) — 1,764 tokens vs Zep's 600K+. ZOE learns Zaal's priorities, decision patterns, communication style over time |
| **Nightly consolidation** | ENABLE openclaw-auto-dream plugin — 3-phase Collect/Consolidate/Evaluate cycle at 2am. ~$0.15/month on Minimax. Already documented in Doc 236 but not deployed |
| **Telegram interactivity** | ADD inline keyboards for task approval (approve/snooze/view buttons). Turn Telegram into a lightweight command center |
| **Telegram inline mode** | ENABLE via BotFather `/setinline` — search research docs from any Telegram chat by typing `@zaoclaw_bot query` |
| **Webhook receivers** | BUILD 2 webhook endpoints on VPS: (1) Neynar `mentioned_fids` for Farcaster mentions → Telegram relay, (2) Vercel deploy status → actionable alerts |
| **Competitive monitoring** | ADD weekly scan of 5 competitor projects: Sound.xyz, Catalog, Nina, Pods.media, Audius. Use Visualping or DuckDuckGo MCP for changelog detection |
| **Agent council model** | SKIP for now — solo founder + ZOE + Claude Code is sufficient at 188 members. Revisit when community hits 500+ |
| **Telegram mini app** | DEFER — high effort, low ROI at current scale. ZAO OS web app is the primary interface |
| **n8n automation** | INVESTIGATE — 182K stars, self-hostable. Would let Supabase events trigger ZOE (new proposal → auto-cross-post, new member → welcome sequence) |

## Comparison: ZOE Upgrade Options by Impact vs Effort

| Upgrade | Impact | Effort | Cost/mo | Priority |
|---------|--------|--------|---------|----------|
| **Upgrade OpenClaw to v2026.3.31** | HIGH — unified task ledger, flow visibility | 30 min | $0 | P0 |
| **Enable nightly consolidation (auto-dream)** | HIGH — ZOE accumulates permanent knowledge | 1 hr | $0.15 | P0 |
| **Neynar webhook → Telegram relay** | HIGH — closes Farcaster loop from phone | 2 hr | $0 | P0 |
| **Interactive Telegram keyboards** | MEDIUM — task mgmt from phone | 3 hr | $0 | P1 |
| **Mem0 memory layer** | HIGH — ZOE learns over time | 4 hr | ~$5 | P1 |
| **Vercel deploy webhook alerts** | MEDIUM — instant deploy status | 1 hr | $0 | P1 |
| **Competitive monitoring cron** | MEDIUM — weekly intel on 5 competitors | 2 hr | $0 | P2 |
| **Telegram inline mode** | LOW — search from any chat | 15 min | $0 | P2 |
| **ContextEngine plugin** | MEDIUM — auto-load relevant research per task | 4 hr | $0 | P2 |
| **n8n automation glue** | HIGH — event-driven workflows | 1 day | $0 (self-hosted) | P3 |

## Upgrade 1: OpenClaw v2026.3.31 (P0)

**What's new (released March 31, 2026):**
- **Unified Task Ledger** — ACP, subagent, cron, and background CLI execution tracked in one SQLite-backed ledger. `openclaw flows list|show|cancel` gives visibility into all work. Lost-run recovery and orphan detection built in.
- **ContextEngine Plugin Interface** — lifecycle hooks: `bootstrap`, `ingest`, `assemble`, `compact`, `afterTurn`, `prepareSubagentSpawn`, `onSubagentEnded`. ZOE could auto-inject relevant research docs based on the current task.
- **Plugin SDK stabilized** — ClawHub is the preferred distribution channel (over npm). Old extension API fully deprecated.
- **30+ security patches** including hardened auth flows.

**Deploy command:**
```bash
docker exec -u root openclaw-openclaw-gateway-1 bash -c 'npm install -g openclaw@latest'
docker restart openclaw-openclaw-gateway-1
```

Sources: [Release notes](https://github.com/openclaw/openclaw/releases/tag/v2026.3.31), [Upgrade guide](https://www.clawly.org/news/openclaw-2026323-2-plugin-sdk-stabilization-and-upgrade-checklist-for-self-hosters)

## Upgrade 2: Nightly Consolidation (P0)

Already documented in Doc 236. The auto-dream plugin implements a neuroscience-inspired 3-phase cycle:

1. **COLLECT** — scan unconsolidated daily logs (last 7 days), detect priority markers
2. **CONSOLIDATE** — route insights to correct memory layer, semantic deduplication, backlinks
3. **EVALUATE** — score importance with activation/decay, prune below threshold

Cost: ~$0.15/month on Minimax M2.7. Runs at 2am via cron.

Source: [openclaw-auto-dream](https://github.com/LeoYeAI/openclaw-auto-dream)

## Upgrade 3: Neynar Webhook → Telegram Relay (P0)

Set up a webhook filtered to ZAO's app FID (19640) using `mentioned_fids`. When someone tags ZAO on Farcaster:
1. Neynar webhook hits VPS endpoint
2. ZOE formats cast summary (author, content, channel, engagement)
3. Pushes to Zaal's Telegram with inline keyboard: [Reply] [Like] [Ignore]
4. If Zaal replies, ZOE casts back through Neynar

**Neynar x402 (NEW):** Pay-per-use API access via USDC on Base. Agents can now manage treasuries, cast messages, and access data through x402 payments. MCP support coming soon.

Key endpoints for ZOE:
- `POST /v2/farcaster/webhook` — create webhook with `mentioned_fids` filter
- `GET /v2/farcaster/feed/trending` — trending casts
- `GET /v2/farcaster/feed/channels` — channel feeds
- `GET /v2/farcaster/user/bulk` — bulk user lookups
- `POST /v2/farcaster/cast` — cast on behalf of app

Source: [Neynar webhook docs](https://docs.neynar.com/docs/how-to-setup-neynar-webhooks), [Neynar x402 blog](https://neynar.com/blog/agents-frames-and-the-future-of-farcaster-neynar-s-vision-for-x402)

## Upgrade 4: Telegram Interactive Keyboards (P1)

Turn Telegram into a command center with inline keyboards:

```
ZOE Morning Brief — April 2, 2026

3 open PRs need review:
• #87 — music player crossfade fix
• #88 — governance poll UI
• #89 — spaces recording

[Approve All] [View Diffs] [Snooze 1hr]

Top tasks from TASKS.md:
1. Fix Spaces DJ mode
2. Deploy content bank
3. Research ENS subnames

[Start #1] [Reprioritize] [Ask ZOE]
```

Uses Telegram `callback_query` handlers. OpenClaw can maintain TASKS.md and surface items with action buttons.

Source: [Telegram Bot API — Inline Keyboards](https://core.telegram.org/bots/api#inlinekeyboardmarkup)

## Upgrade 5: Mem0 Memory Layer (P1)

**Why this matters:** ZOE currently has flat-file memory (MEMORY.md + daily notes). Mem0 adds structured, searchable, self-organizing memory that learns from every interaction.

- **41K GitHub stars**, 14M downloads, MIT license
- AWS's exclusive memory provider for their Agent SDK
- Extracts facts from conversations, compares against existing memories, decides ADD/UPDATE/DELETE/NOOP
- **1,764 tokens** per memory injection vs Zep's 600K+ — critical for Minimax token budget
- Graph memory option connects related facts (e.g., "Zaal prefers mobile-first" links to "UI reviews should check responsive")

**Alternative:** Meta's PAHF framework — 3-step loop: (1) seek pre-action clarification, (2) ground actions in retrieved preferences, (3) integrate post-action feedback. Learns faster than no-memory baselines.

**For ZOE:** Run Mem0 as a sidecar service on the VPS. After each session, ZOE's daily note feeds into Mem0. At session start, Mem0 injects relevant memories into context.

Sources: [Mem0 Graph Memory](https://mem0.ai/blog/graph-memory-solutions-ai-agents), [5 Memory Systems Compared](https://dev.to/varun_pratapbhardwaj_b13/5-ai-agent-memory-systems-compared-mem0-zep-letta-supermemory-superlocalmemory-2026-benchmark-59p3), [Meta PAHF](https://arxiv.org/abs/2602.16173)

## Upgrade 6: Competitive Monitoring (P2)

Weekly scan of 5 projects in ZAO's space:

| Competitor | What to Track | How |
|-----------|---------------|-----|
| Sound.xyz | New features, artist tools, marketplace changes | DuckDuckGo MCP + changelog page |
| Catalog | Releases, collector features, economic model | DuckDuckGo MCP |
| Pods.media | Podcast NFT features, minting UX | DuckDuckGo MCP |
| Audius | Protocol updates, governance changes, API changes | GitHub releases API |
| Nina Protocol | Solana music marketplace features | GitHub releases API |

ZOE runs this as a Friday heartbeat task, produces a 5-bullet summary, pushes to Telegram.

Source: [Competely](https://competely.ai/), [Visualping](https://visualping.io/)

## The Founder Agent Playbook

What's working for solo founders with AI agents in 2026:

### The "Council" Model
3-5 specialized agents instead of one generalist. One profiled founder saves 20+ hours/week:
- **Chief of Staff agent** — daily priority/risk triage (not a to-do list)
- **Legal/compliance agent** — contract review, regulatory scanning
- **Community agent** — Discord/Farcaster monitoring, member engagement
- **Research agent** — competitive intel, market scanning

**ZOE's current role:** generalist. Upgrade path: keep ZOE as chief of staff, delegate specialized tasks to Claude Code scheduled agents (already set up) and future ElizaOS instance.

### Proactive > Reactive
The key shift: agents that initiate conversations. Patterns:
- **Context-aware follow-ups:** "You mentioned shipping PR tonight — did it go through?"
- **Threshold alerts:** token price drops 10%, governance proposal reaching quorum, member milestone
- **Weekly retro prompts:** Friday afternoon message generating build-in-public drafts

### Memory as Competitive Advantage
Agents that remember and learn compound over time. After 30 days, ZOE with Mem0 would know:
- Zaal's decision patterns (mobile-first bias, ship-fast preference)
- Which research topics matter most (music distribution > identity at current stage)
- Communication style preferences (concise, no emoji, Farcaster not Warpcast)
- Community member relationships and dynamics

Source: [AI Agent Blueprint for Solo Founders](https://www.indiehackers.com/post/ai-agent-blueprint-the-ultimate-daily-founder-workflow-solo-founders-only-211deb2d23), [Solo founder AI council](https://dnyuz.com/2026/02/13/im-a-solo-founder-with-ai-agents-instead-of-employees-my-council-of-ai-agents-saves-me-20-hours-a-week/)

## ZAO OS Integration

These upgrades connect to the existing codebase and infrastructure:

- **OpenClaw upgrade** — VPS at 31.97.148.88, Docker container `openclaw-openclaw-gateway-1`
- **Neynar webhook** — connects to existing `src/lib/farcaster/neynar.ts` patterns, app FID 19640 from `community.config.ts`
- **Competitive monitoring** — feeds into `research/inspiration/` folder (created this session)
- **Mem0** — complements existing MEMORY.md + `memory/YYYY-MM-DD.md` daily notes
- **Interactive keyboards** — extends ZOE's Telegram bot `@zaoclaw_bot`
- **Scheduled agents** — 3 already running on Claude Code (Morning Agent, Friday Agent, Monday Agent)
- **ZOE routines** — 3 new routines ready to deploy via `/vps deploy` (Farcaster Scanner, Community Voice, Content Assist)

## Implementation Order (Next Session)

```
Week 1 (P0 — 2 hours):
├── Upgrade OpenClaw to v2026.3.31
├── Enable openclaw-auto-dream nightly consolidation
└── Set up Neynar webhook → Telegram relay

Week 2 (P1 — 8 hours):
├── Add Telegram inline keyboards for task management
├── Install Mem0 sidecar on VPS
├── Set up Vercel deploy webhook alerts
└── Deploy ZOE routines from /vps deploy (already written)

Week 3 (P2 — 4 hours):
├── Add competitive monitoring cron (5 projects)
├── Enable Telegram inline mode
└── Explore ContextEngine plugin for research auto-loading

Future (P3):
├── n8n automation for event-driven workflows
├── ElizaOS for always-on Farcaster presence
└── Agent council model at 500+ members
```

## Sources

- [OpenClaw v2026.3.31 Release](https://github.com/openclaw/openclaw/releases/tag/v2026.3.31)
- [Plugin SDK Stabilization](https://www.clawly.org/news/openclaw-2026323-2-plugin-sdk-stabilization-and-upgrade-checklist-for-self-hosters)
- [Force Multiplier Article](https://towardsdatascience.com/using-openclaw-as-a-force-multiplier-what-one-person-can-ship-with-autonomous-agents/)
- [openclaw-auto-dream](https://github.com/LeoYeAI/openclaw-auto-dream)
- [Neynar Webhook Docs](https://docs.neynar.com/docs/how-to-setup-neynar-webhooks)
- [Neynar x402 Vision](https://neynar.com/blog/agents-frames-and-the-future-of-farcaster-neynar-s-vision-for-x402)
- [grammY Framework](https://grammy.dev/resources/comparison)
- [Mem0 Graph Memory](https://mem0.ai/blog/graph-memory-solutions-ai-agents)
- [5 Memory Systems Compared](https://dev.to/varun_pratapbhardwaj_b13/5-ai-agent-memory-systems-compared-mem0-zep-letta-supermemory-superlocalmemory-2026-benchmark-59p3)
- [Meta PAHF Framework](https://arxiv.org/abs/2602.16173)
- [AI Agent Blueprint for Solo Founders](https://www.indiehackers.com/post/ai-agent-blueprint-the-ultimate-daily-founder-workflow-solo-founders-only-211deb2d23)
- [Solo Founder AI Council](https://dnyuz.com/2026/02/13/im-a-solo-founder-with-ai-agents-instead-of-employees-my-council-of-ai-agents-saves-me-20-hours-a-week/)
- [Competely](https://competely.ai/)
- [OpenClaw Content Engine Playbook](https://stormy.ai/blog/building-passive-content-engine-openclaw-creator-playbook)
- [Discord OpenClaw Bot Guide](https://cybernews.com/best-web-hosting/run-ai-discord-agent-with-openclaw/)
