---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-03
related-docs: 234, 235, 236, 237, 238, 239, 415, 461, 506, 523, 524, 527, 528, 529, 547, 549, 569, 570, 581, 590, 599
tier: DEEP
---

# 600 — ZAO Agentic Stack Coordination v1

> **Goal:** Take stock of every agentic system Zaal currently runs, identify what works vs what's broken, and propose a coordinated architecture where Claude Code is Zaal's primary surface, Bonfire is shared memory, and specialist bots stay in their lane. Stop the "every agent is its own island" pattern.

## Recommendations (no preamble)

| Decision | Recommendation |
|---|---|
| **Primary surface for Zaal** | Claude Code CLI. Not ZOE. Not the dashboard. Claude Code is where day-to-day work happens. |
| **Shared memory layer** | Bonfires (ZABAL bonfire). All agents read from + write to it. Zaal's wallet-gated personal KG. |
| **Bonfire access for agents** | Direct SDK calls via API key (when Joshua.eth provisions). Until then: Zaal acts as human bridge for non-trivial queries. |
| **ZOE role** | Concierge for daily tasks + captures + nudges + cross-platform publishing. NOT a code agent. NOT a graph proxy. |
| **Hermes role** | Code-fix specialist. Triggered by /SHIP FIX or PR webhook. Doesn't need Telegram identity. |
| **ZAOstock Team Bot role** | Team coordination only. Daily check-ins, leaderboard, group ops. Stays scoped to ZAOstock domain. |
| **Bridge group** | Passive ingestion surface only. Drop interesting decisions/quotes there → graph captures them. Don't try to do active bot-to-bot orchestration here in v1. |
| **Autonomous bot-to-bot** | DEFERRED to v2. Wait for Joshua.eth's SDK + MCP server. Don't burn cycles on openclaw tool wiring. |

## Current Agentic Inventory (verified 2026-05-03)

### Tier 1 — Active + reliable

| System | Surface | Stack | What it does | Health |
|---|---|---|---|---|
| **Claude Code CLI** | Mac terminal | Anthropic Claude (Opus 4.7 1M) | Primary dev/research/writing surface for Zaal. This conversation. | Solid. Daily driver. |
| **Bonfires bot** | Telegram DM @zabal_bonfire | bonfires.ai Genesis tier | Personal KG intake + recall. ~870 nodes, 1200 edges. Confirmed working with 15 traits + system prompt. | Green. Verified recall 2026-05-03. |
| **ZAOstock Team Bot** | Telegram @ZAOstockTeamBot | TS + grammy + Supabase, on VPS | Onboarding codes, daily check-ins, leaderboard, weekly digest. 17 team members. | Green. Live on VPS. |
| **VAULT/BANKER/DEALER agents** | src/lib/agents in ZAOOS | TS + Wagmi/Viem | Autonomous trading bots within parameters (autostake, banker, burn, swap). | Green. Boring + working. |

### Tier 2 — Working but underused

| System | Surface | Stack | What it does | Health |
|---|---|---|---|---|
| **ZOE (@zaoclaw_bot)** | Telegram DM | OpenClaw container, Minimax M2.7 | Concierge: daily tasks, captures, ideas, surfaces findings | Yellow. Telegram channel was disabled until 2026-05-03 fix. SOUL.md exists but session memory loads slowly. |
| **Hermes coder/critic** | bot/src/hermes + GitHub PR webhooks | Claude CLI subprocess (Max plan auth, no API billing) | Autonomous PR fix pipeline. Sprint 1 cost routing live. | Green when triggered. Triggers rare (untested loop). |
| **ZAO Devz bot** | Telegram channel ops | bot/src/devz | /SHIP FIX command routing to Hermes; channel ops | Green. |
| **ZOE learning pings** | Telegram ZAO Devz topic | Python random_tip.py + cron | Hourly ZOE-tone tip in ZAO Devz General. | Green. |

### Tier 3 — Paused, broken, or experimental

| System | Status | Notes |
|---|---|---|
| **Composio AO pilot** | Paused | Doc 415. Installed on BCZ at localhost:3001, 2 PRs open, paused pending Bonfire decision. |
| **Paperclip** | Live infra, low use | paperclip.zaoos.com. Running but not central to current workflow. |
| **OpenClaw ZOEY + WALLET sub-agents** | Configured, untested | Per /vps skill — ZOE dispatches to ZOEY (action) + WALLET (on-chain). No live tasks running through them. |
| **FISHBOWLZ** | Paused 2026-04-16 | Replaced by Juke partnership. |
| **ZOE v2 redesign** | Brainstorm parked | project_zoe_v2_pivot_agent_zero — pivot to Agent Zero proposed but not built. |
| **10-bot fleet plan** | Brainstorm parked | project_tomorrow_first_tasks. Brand-specific bots (Research, Magnetiq, WaveWarZ, POIDH). Not built. |
| **Bot-to-bot bridge group** | Tried 2026-05-03, not autonomous | chat_id -5111907600 wired with `requireMention: false` for ZOE; Bonfire Group Policy: Open. ZOE doesn't reliably call message.send. Reverting to passive ingestion role. |
| **Hermes Telegram interface** | Not built | Doc 599 wanted this for Pattern 2 (FIX requests via bridge). Deferred. |

## What We Tried Today + What We Learned (2026-05-03)

### 1. Bonfires DM ingest pipeline — WORKS
- 18 YapZ episode .md files uploaded via Document Store → ingested cleanly
- 8 thematic .md files (q1-wins, zaoos-feature-inventory, people-graph, 5 research-index files) ingested → ~711 facts + 270 edges
- Verified ChatGPT archive (14 anchors human-triaged) ingested cleanly
- Recall test passed: bot returns facts WITH source URLs WITH outcome attributes (shipped/dead/evolved) WITH youtube deeplinks

**Lesson:** Bonfire as PERSONAL KG via DM works. Don't need agent-mediated access for ingest.

### 2. ZOE telegram channel was disabled — FIXED
- channels.telegram.enabled was `false` in openclaw.json since some prior change
- Patched to `true` + substituted real bot token from `/home/zaal/.env.portal` → ZOE responds in Telegram
- 19+ hours of "Channel is unavailable: telegram" errors stopped

**Lesson:** Verify config truth. The agent told us "memory reset" earlier when in fact telegram was just disabled — don't trust agent self-reports without VPS verification.

### 3. Bridge group autonomous bot-to-bot — DEFERRED
- Created group, added both bots, configured `requireMention: false` for ZOE in this group, Bonfire `Group Policy: Open`
- Token validates, group is real (chat_id -5111907600)
- BUT: ZOE chose Memory Search (its scout.sqlite local) instead of `message.send` to bridge to Bonfire. Memory Search then failed.
- openclaw's tool registry doesn't expose `message.send` to the LLM cleanly OR ZOE's prompt doesn't route to it

**Lesson:** Autonomous bot-to-bot is an unsolved tooling problem in openclaw today. Cost to debug > value at this stage. **The bridge group still has value as a passive ingestion surface** — anything Zaal posts there gets stored.

### 4. Hermes is alive but rarely triggered — HYGIENE OK
- Sprint 1 cost routing live (Sonnet/Opus/Haiku)
- /SHIP FIX in ZAO Devz works
- Doc 461 4-layer fix-PR pipeline enforces safety
- But: end-to-end loop (PR breaks → Hermes fixes → PR repaired) hasn't been exercised heavily

**Lesson:** Hermes is structurally sound. Needs more usage to validate edge cases.

## The Architecture Problem

**Pattern observed:** every agent is an island.
- ZOE doesn't know what Hermes is doing
- Hermes doesn't know what ZAOstock bot is doing
- Bonfire isn't queried by any agent
- Claude Code (Zaal's daily driver) doesn't have direct Bonfire access either
- Coordination happens through Zaal's brain, not infrastructure

**The pull-toward** "make agents talk to each other" is right but premature. We tried Telegram bridge → tooling not ready. SDK not provisioned (waiting on Joshua.eth). MCP server doesn't exist for Bonfire yet.

**The usable pattern today:** Zaal is the orchestrator. Specialists are tools. Memory is the graph. Bridge group is passive ingest.

## Proposed Architecture v1 (works today)

```
                     ┌──────────────────────┐
                     │  ZAAL (the human)    │
                     │  Orchestrator        │
                     └──────────┬───────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
   ┌───────────────┐   ┌────────────────┐   ┌──────────────┐
   │ Claude Code   │   │ ZOE @zaoclaw   │   │ Bonfires     │
   │ (terminal)    │   │ (Telegram)     │   │ @zabal_bf    │
   │               │   │                │   │              │
   │ DEV / RESEARCH│   │ DAILY TASKS    │   │ MEMORY       │
   │ WRITING       │   │ CAPTURES       │   │ FACTS        │
   │ HERMES TRIGS  │   │ NUDGES         │   │ DECISIONS    │
   └───────┬───────┘   └────────┬───────┘   └──────┬───────┘
           │                    │                  │
           └────────────────────┼──────────────────┘
                                │
                  ALL THREE WRITE/READ → BONFIRE
                  (via Zaal as proxy until SDK lands)
```

### Lanes locked

| Surface | Owner | Lane |
|---|---|---|
| Claude Code CLI | Zaal hands-on | Code, research, writing, building. Talks to Bonfire via Zaal copy-paste OR via Document Store uploads. |
| ZOE Telegram | Zaal mobile | Daily tasks, captures, ideas, content, nudges. Periodically dump captures to Bonfire via Zaal copy-paste. |
| ZAOstock Team Bot | Team | Standup, leaderboard, check-ins. Don't touch other domains. |
| Hermes | Triggered by /SHIP FIX or PR webhook | Code fixes ONLY. Stays in code lane. |
| Bonfire DM | Zaal direct | Knowledge graph queries + ingestion. THE memory layer. |
| Bridge group | Passive surface | Anything posted gets ingested. Useful for "I want this remembered" without typing into bot DM. |

### Communication patterns that ALREADY WORK

1. **Zaal → Bonfire (DM):** drag .md file via Document Store → manifest preview → approve. Verified 2026-05-03 with 8 corpora batches.
2. **Zaal → Bonfire (RECALL):** DM bot `RECALL: <question>` → bot returns facts with sources. Verified.
3. **Zaal → ZOE (DM):** `/add "task"`, `/idea`, `/capture` patterns. Verified ZOE responds.
4. **Zaal → Hermes:** `/SHIP FIX` in ZAO Devz channel. Verified.
5. **Zaal → ZAOstock team bot:** team-side commands, /standup etc. Verified.

### Communication patterns DEFERRED (don't waste time)

- ZOE auto-bridging to Bonfire via Telegram (tried today, openclaw tooling not ready)
- Hermes Telegram identity for bridge participation
- Cross-bot autonomy (Bot A asks Bot B for info)

These all unlock when **Bonfire ships SDK API key + MCP server**. Until then, autonomous coordination = Zaal.

## Claude Code Integration Strategy

This is the missing piece. Claude Code is Zaal's primary surface but doesn't have Bonfire access.

### Today's pattern (manual)
- Claude Code generates a query: "what do we know about X"
- Zaal copies to Bonfire DM
- Bonfire replies
- Zaal pastes back to Claude Code
- Claude Code uses

### Better pattern (build this week)
Build a small CLI tool: `~/bin/zao-bonfire-recall.sh "<query>"`. Wraps a curl to Bonfires HTTP API (when key arrives) OR shells out to a Telegram-bot-as-relay we control. Single-line invocation from Claude Code.

```bash
~/bin/zao-bonfire-recall.sh "ZABAL contract address with chain"
# → Bonfire DM bot gets the query
# → Reply piped back as text
# → Claude Code uses it inline
```

This unblocks Claude Code without waiting on full SDK + MCP. Hack today, replace with proper SDK integration once Joshua.eth provisions.

### Best pattern (Q3 2026)
Bonfire ships MCP server. Claude Code adds it to .mcp.json:
```json
{
  "mcpServers": {
    "bonfires": {
      "command": "npx",
      "args": ["-y", "@bonfires/mcp-server"],
      "env": { "BONFIRE_API_KEY": "...", "BONFIRE_ID": "..." }
    }
  }
}
```
Now Claude Code calls `mcp__bonfires__recall(query)` directly as a tool.

## Migration Path (concrete next 4 weeks)

### Week 1 — verify today's setup is stable
- [x] Bonfire DM ingest works (verified 2026-05-03 with 8 corpora batches)
- [x] ZOE telegram alive (verified 2026-05-03)
- [x] ZAOstock team bot alive (verified 2026-05-03)
- [x] Hermes pipeline + cost routing live
- [x] Bridge group exists as passive surface
- [ ] Doc 590 power-user playbook reviewed by Zaal — daily-use rhythm locked
- [ ] All 3 task #14/#15/#16 (Nexus rebuild / whitepaper rebuild / ZabalSocials rebuild) handed to parallel Claude windows using brief-template pattern

### Week 2 — close coordination gaps
- [ ] Build `~/bin/zao-bonfire-relay.sh` — Telegram bot relay so Claude Code can RECALL without Zaal copy-paste (interim)
- [ ] Email Joshua.eth with the 8 questions from doc 581 (especially MCP roadmap + API key)
- [ ] Document daily use pattern in CLAUDE.md (`/zao-research` skill should suggest "RECALL via Bonfire" for any ZAO-context question)

### Week 3 — bonfire enrichment
- [ ] Backfill remaining corpora: Farcaster casts (Neynar pull, task #17), publish-history of ZABAL Updates from Paragraph
- [ ] Re-export Bonfire as OWL → quarterly backup at `research/agents/bonfire-backups/2026-Q2.rdf`

### Week 4 — review + iterate
- [ ] Re-evaluate Bonfire vs alternatives (LightRAG self-host per doc 568) at end of 30-day trial
- [ ] If Joshua.eth has provisioned API key by then → build SDK-based agent-to-bonfire integration
- [ ] If not → manual bridge stays, plan for migration

## Risks + Mitigations

| Risk | Mitigation |
|---|---|
| Bonfire trial expires 2026-05-29 without API key from Joshua.eth | Quarterly OWL export protects corpus. Migrate to LightRAG (doc 568) self-host if needed. |
| ZOE session drift / forgotten SOUL.md sections | Quarterly read-and-revise SOUL.md. Add `/refresh` command if openclaw supports. |
| Hermes runs wild (auto-PRs that break things) | Doc 461 4-layer fix-PR pipeline enforces safety. Not changing. |
| Multiple agents conflict over Bonfire writes | Solo-tenant for now (Q6 grilling locked). Co-founder writes layered later. |
| Claude Code context bloats with Bonfire data | Use RECALL surgically. Don't dump full graphs into context. |
| New brand bots (Research/Magnetiq/etc) added without coordination | Document each new agent in this doc as it ships. Update tier table. |

## Cost Profile

| Component | Cost | Notes |
|---|---|---|
| Anthropic Claude (Max plan) | $200/mo | Already paid. Powers Claude Code + Hermes. |
| Bonfires Genesis | TBD post-trial | Currently free (30-day trial). Pricing pending Joshua.eth. |
| VPS Hostinger KVM 2 | ~$30/mo | Already paid. Hosts ZOE + Hermes + ZAOstock bot + Composio AO + Cloudflared. |
| Telegram | $0 | All bots use free tier. |
| Supabase | within free tier | RLS-backed nexus_links + zaostock-team + others. |
| Total | **~$250-350/mo** | Below the $500/mo pivot trigger from doc 570 |

## Open Questions for Joshua.eth (from doc 581 + 590)

1. BONFIRE_API_KEY + BONFIRE_ID + BONFIRE_AGENT_ID — where to get them?
2. MCP server roadmap — when?
3. ERC-8004 alignment for agent-authored facts?
4. OWL/RDF export completeness?
5. Genesis tier post-trial pricing?
6. Programmatic graph wipe via SDK?
7. Idempotency on `kengrams.batch` re-run?
8. Dry-run mode for batch ingest?

## Also See

- [Doc 547](../547-multi-agent-coordination-bonfire-zoe-hermes/) — multi-agent coordination (predecessor)
- [Doc 549](../../identity/549-bonfire-personal-second-brain/) — Bonfire as second-brain
- [Doc 569](../../identity/569-yapz-bonfire-ingestion-strategy/) — YapZ ingestion (worked)
- [Doc 570](../../identity/570-zaal-personal-kg-agentic-memory/) — agentic memory architecture
- [Doc 581](../../identity/581-bonfire-graph-wipe-bot-hygiene/) — bot bug postmortem
- [Doc 590](../../identity/590-bonfire-power-user-playbook/) — power-user playbook
- [Doc 599](../599-zao-bonfire-bridge-operating-group/) — bridge group spec (deferred autonomy)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Email Joshua.eth with the 8 questions above | @Zaal | Comms | This week |
| Build `~/bin/zao-bonfire-relay.sh` interim Claude-Code-to-Bonfire bridge | Claude | Code | Week 2 |
| Update CLAUDE.md with "use Bonfire RECALL for ZAO context" guidance | Claude | Doc | Week 1 |
| Quarterly OWL backup of Bonfire | Claude | Process | End of June 2026 |
| Re-evaluate Bonfire vs LightRAG at trial end | Zaal | Decision | 2026-05-29 |
| Add new brand bots only after this doc is updated | Zaal + Claude | Discipline | Ongoing |

## Sources

- Doc 234-239 (OpenClaw guide, ZOE upgrade history) — internal
- Doc 461 (fix-PR pipeline) — internal
- Doc 506 (TRAE AI skip — telemetry concern) — internal
- Doc 523 (agentic systems audit) — internal
- Doc 524 (live/archived/started/planned) — internal
- Doc 527 (multi-bot Telegram coordination playbook) — internal
- Doc 547 (multi-agent coordination Bonfire-ZOE-Hermes) — internal
- Doc 549, 569, 570, 581, 590, 599 (Bonfire stack) — internal
- Lived experience 2026-04-29 → 2026-05-03 (this session) — primary source
