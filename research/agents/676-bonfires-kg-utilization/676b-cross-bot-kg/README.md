---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
related-docs: 650, 665, 669, 673, 676
tier: STANDARD
parent-doc: 676
---

# 676b — Cross-Bot KG Architecture: Unified Bonfires Integration

> **Goal:** Design the shared knowledge graph infrastructure so ZAO ecosystem bots (ZOE, ZAOcoworkingBot, ZAOstockTeamBot, Magnetiq, AttaBotty, Hermes, the fractal Discord bot, zaomusicbot) all read from and write to ONE canonical ZABAL Bonfires bonfire. Concrete build spec for the shared ingest module + taxonomy + contention model.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| One shared ZABAL bonfire vs federated per-brand bonfires | **ONE SHARED (Phase 1) → Multi-bonfire Phase 3** | Single graph costs 0.1 ETH mint (already paid). Cross-bot READ is the payoff: ZOE can ask "what did ZAOstockTeamBot do this week?" Federated bonfires (Wavewarz bonfire, COC bonfire, etc) added post-validation via ontology profiles within the same graph, or as separate bonfires with cross-graph RAG. Cost scales; simplicity wins early. |
| Shared ingest module: npm package vs git submodule vs copy-paste | **NPM PACKAGE (if repo public) → copy-paste MVP** | ZAOcoworkingBot lives at github.com/songchaindao-dot/cowork-zaodevz. ZAOOS bot/ lives here. Two repos. Publishing to npm is 10 min setup but requires two maintainers. Copy-paste bonfire.ts + spool.ts to each bot repo is fastest MVP; sync via a shared .github/workflows/sync-bonfire-module.yml when updates land. Decision: COPY-PASTE MVP, then switch to git submodule if 5+ bots adopt. |
| Episode naming taxonomy | **Brand-prefix + bot-name + event-type (e.g., `zaostock:zaostock_bot:task_created`)** | Bonfires KG auto-extracts entities. A naming convention prevents name collisions + makes source-tracking trivial. Graph can filter by source_description = "ZAOcoworkingBot" vs "ZOE" vs "Magnetiq". |
| Write contention / rate limits | **SPOOL + GRACEFUL DEGRADE** | Bonfires API rate limits unknown per doc 669 Q6. Assume 100+ writes/day (50 from cowork bot, 20+ from ZOE tasks, 10+ from stock bot, 15+ from Magnetiq). Spool at ~/.zao/bonfires-spool.jsonl; drain on success; no blocking on user action. If spool grows > 1000, alert Zaal. |
| Each bot as a KG entity | **YES** | Create a "Bot" node for each: `bot:zoe`, `bot:zaocoworking`, `bot:zaostock`, `bot:magnetiq`, etc. Every episode edges to its source bot. Enables "all events from bot:zoe" queries. |
| Sharing across ZAOOS + cowork-zaodevz repos | **GIT SUBMODULE** | cowork-zaodevz is separate repo; ZAOOS is separate repo. Each `git submodule add` to a shared `bonfires-shared-module` repo (or pin commit hash in docs). Keeps bonfire.ts in sync across both. Fallback: mirror changes manually when updating either bot. |
| Cross-bot READ capability | **POST-PHASE-2** | Phase 1: all bots WRITE. Phase 2: ZOE reads via recall() to answer "team summary" or "what did Magnetiq find today?" Requires Ryan SDK stable + documented. |

## Architecture

```
ZAO Ecosystem Bots (6+)
  ├─ ZOE (ZAOOS bot/src/zoe/)
  ├─ ZAOcoworkingBot (cowork-zaodevz agent/src/)
  ├─ ZAOstockTeamBot (ZAOOS bot/src/ [future])
  ├─ Magnetiq (TBD repo)
  ├─ AttaBotty (TBD repo)
  ├─ Fractal Discord bot (TBD repo)
  ├─ zaomusicbot (TBD repo)
  └─ Hermes (agent runner)
       ↓
  Shared ingest module (bonfire.ts, spool.ts, eventToEpisode.ts)
       ↓
  Local spool: ~/.zao/bonfires-spool.jsonl (append-only; per-bot prefixed)
       ↓
  Non-blocking async: execFile('bonfire', ['kengram', 'batch', '--to', BONFIRE_ID, '--json', '-'])
       ↓
  Bonfires API: https://tnt-v2.api.bonfires.ai/knowledge_graph/episode/create
       ↓
  ZABAL Bonfire KG (780+ episodes, auto-extracting entities + edges)
       ↓
  Cross-bot queries: ZOE recalls "team status" → RAG over all bot events + extracts summary
```

## Shared Module Spec

### File Structure

```
bonfires-shared-module/
├── README.md                    (setup + usage)
├── src/
│   ├── bonfire.ts              (main entry; Bonfires API client)
│   ├── episode.ts              (episode factory + taxonomy)
│   ├── spool.ts                (local jsonl queue for failed writes)
│   ├── types.ts                (BonfireEvent, Episode, BotSource, etc)
│   └── retry.ts                (exponential backoff + circuit breaker)
├── tests/
│   └── bonfire.test.ts         (mock API calls, spool drain, collision)
└── package.json                (exports for npm or pin to submodule commit)
```

### Core Types

```typescript
// types.ts

export type BotSource = 
  | 'zoe' 
  | 'zaocoworking' 
  | 'zaostock' 
  | 'magnetiq' 
  | 'attabotty' 
  | 'fractal-discord' 
  | 'zaomusicbot' 
  | 'hermes';

export type BotEventKind = 
  | 'task_created' 
  | 'task_updated' 
  | 'task_completed' 
  | 'message_sent' 
  | 'decision_logged' 
  | 'event_scheduled' 
  | 'recall_query' 
  | 'analysis_completed';

export interface BonfireEvent {
  bot: BotSource;
  kind: BotEventKind;
  brand: string;              // "The ZAO" | "WaveWarZ" | "COC Concertz" | etc
  summary: string;            // user-facing description
  metadata: Record<string, unknown>; // {task_id?, user?, status?, etc}
  timestamp?: Date;           // defaults to now
}

export interface Episode {
  nodes: { uuid: string; name: string; summary: string; labels: string[] }[];
  edges: { source: string; target: string; name: string; fact?: string }[];
}
```

### Main Entry (bonfire.ts)

```typescript
import { BonfireEvent, Episode, BotSource } from './types';

export async function ingestEvent(event: BonfireEvent): Promise<void> {
  // Wrapper that calls episodeFromEvent() + writes + spools on failure
  
  const episode = episodeFromEvent(event);
  
  try {
    await postToApi(episode);
  } catch (error) {
    console.error(`[bonfire/${event.bot}] write failed, spooling:`, event);
    await appendSpool(event);
  }
}

async function postToApi(episode: Episode): Promise<void> {
  // POST to https://tnt-v2.api.bonfires.ai/knowledge_graph/episode/create
  // Headers: Authorization: Bearer $BONFIRE_API_KEY
  // Body: { bonfire_id, ...episode }
  
  const response = await fetch(`${process.env.BONFIRE_API_URL}/knowledge_graph/episode/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BONFIRE_API_KEY}`,
    },
    body: JSON.stringify({
      bonfire_id: process.env.BONFIRE_ID,
      ...episode,
      source_description: `ZAO Cross-Bot KG v1`, // auto-labeled
    }),
  });

  if (!response.ok) throw new Error(`Bonfires API ${response.status}`);
}
```

### Episode Factory (episode.ts)

```typescript
export function episodeFromEvent(event: BonfireEvent): Episode {
  const nodeName = `${event.bot}:${event.kind}:${uuid().slice(0, 8)}`;
  
  return {
    nodes: [
      {
        uuid: 'auto',
        name: nodeName,
        summary: event.summary,
        labels: [
          'BotEvent',
          eventKindToLabel(event.kind),
          event.brand,
          event.bot,
        ],
      },
      // Link to brand entity if it doesn't exist, create on first reference
      {
        uuid: 'auto',
        name: `brand:${event.brand}`,
        summary: event.brand,
        labels: ['Brand'],
      },
      // Link to bot entity
      {
        uuid: 'auto',
        name: `bot:${event.bot}`,
        summary: `Bot: ${event.bot}`,
        labels: ['Bot'],
      },
    ],
    edges: [
      {
        source: nodeName,
        target: `bot:${event.bot}`,
        name: 'CREATED_BY',
        fact: event.timestamp?.toISOString(),
      },
      {
        source: nodeName,
        target: `brand:${event.brand}`,
        name: 'IN_BRAND',
      },
    ],
  };
}

function eventKindToLabel(kind: BotEventKind): string {
  const map: Record<BotEventKind, string> = {
    'task_created': 'TaskCreated',
    'task_updated': 'TaskUpdated',
    'task_completed': 'TaskCompleted',
    'message_sent': 'MessageSent',
    'decision_logged': 'DecisionLogged',
    'event_scheduled': 'EventScheduled',
    'recall_query': 'RecallQuery',
    'analysis_completed': 'AnalysisCompleted',
  };
  return map[kind];
}
```

### Spool (spool.ts)

```typescript
export async function appendSpool(event: BonfireEvent): Promise<void> {
  // Append-only jsonl at ~/.zao/bonfires-spool.jsonl
  const spoolPath = `${process.env.HOME}/.zao/bonfires-spool.jsonl`;
  
  await fs.appendFile(
    spoolPath,
    JSON.stringify({ ...event, spooled_at: new Date().toISOString() }) + '\n'
  );
  
  // Check spool size; alert if > 1000 lines
  const lines = (await fs.readFile(spoolPath, 'utf-8')).split('\n').length;
  if (lines > 1000) {
    console.error(`[bonfire-spool] ALERT: spool is ${lines} lines, bonfire unreachable`);
    // TODO: send Telegram alert to Zaal (@zaal)
  }
}

export async function drainSpool(): Promise<void> {
  // Called on next successful write; replay all spooled events
  const spoolPath = `${process.env.HOME}/.zao/bonfires-spool.jsonl`;
  
  try {
    const content = await fs.readFile(spoolPath, 'utf-8');
    const events = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as BonfireEvent);
    
    for (const event of events) {
      await ingestEvent(event); // recursive; will re-spool if it fails
    }
    
    await fs.unlink(spoolPath); // drain succeeded, delete spool
  } catch (err) {
    console.warn('[bonfire-spool] drain failed:', err);
  }
}
```

## Episode Naming Convention

Every bot event MUST be named to prevent collisions and enable provenance tracking.

Format: `<bot>:<event_kind>:<uuid8>`

Examples:
- `zoe:task_completed:a1b2c3d4` (ZOE completed a task)
- `zaocoworking:task_created:x9y8z7w6` (ZAOcoworkingBot created a todo)
- `zaostock:event_scheduled:p3q4r5s6` (ZAOstockTeamBot scheduled an event)
- `magnetiq:analysis_completed:m1n2o3p4` (Magnetiq finished an analysis)

Kengram automatically extracts `bot:${bot}` and `brand:${brand}` as entities. Label all nodes with the bot source + event kind for faceted queries.

## Contention Model

### Write Ordering

Bonfires KG is append-only. Concurrent writes from 6+ bots are safe (no mutual exclusion needed). Order is undefined, but the merkle root updates consistently. Each episode is a content-addressed fact; drift is impossible.

### Rate Limits

Per doc 669 open question #4: **Bonfires API pricing is unknown.** Assume worst case: 1 credit per write. 50 writes/day from ZAOcoworkingBot + 20 from ZOE + 10 from ZAOstock + 15 from Magnetiq = ~95 writes/day. At 30 credits/day budget (typical SaaS), this is safe. If cost-per-write is higher, the spool model queues them without failing UX.

### Failure Recovery

1. **First failure:** exception caught in `ingestEvent()`; event appended to spool.
2. **Next success on ANY bot:** `drainSpool()` fires before new event is written.
3. **Spool grows to 1000:** automated alert to Zaal. Manual investigation required.

## Cross-Bot READ Example (Phase 2+)

Once ZOE's recall() bridge to Bonfires SDK is live, she can ask:

```typescript
// ZOE queries the KG for team summary
const query = 'What has the ZAOstockTeamBot done this week?';
const results = await recall({
  query,
  reason: 'Prepare daily standup',
  expected_kind: 'event',
});
// Returns: [list of zaostock:* nodes from past 7 days, ranked by date]
```

The KG returns all events from `bot:zaostock` nodes created within 7 days. ZOE's LLM summarizes into prose. No agent has to re-query the source.

## Integration Checklist

| Repo | File(s) | Change | By When |
|---|---|---|---|
| cowork-zaodevz | agent/src/teams/commands.ts | Add `import { ingestEvent } from '../bonfire'`; call after each command | Phase 1 |
| cowork-zaodevz | agent/src/teams/bonfire.ts | Implement via shared module (copy or submodule pin) | Phase 1 |
| ZAOOS | bot/src/zoe/concierge.ts | Call `ingestEvent()` on task completions, recalls, decisions | Phase 2 |
| ZAOOS | bot/src/zoe/bonfire.ts | Implement via shared module | Phase 2 |
| (future) | bot/src/zaostock/bonfire.ts | Implement for ZAOstockTeamBot | Phase 2 |
| (future) | bot/src/magnetiq/bonfire.ts | Implement for Magnetiq | Phase 3 |

## 4 Specific Numbers

1. **780 episodes** already in ZABAL bonfire (auto-extracted as of May 19, 2026).
2. **95 writes/day** projected (50 cowork + 20 ZOE + 10 stock + 15 Magnetiq).
3. **6 bot sources** launching in Phase 1-3 (ZOE, ZAOcoworking, ZAOstock, Magnetiq, AttaBotty, Fractal Discord, zaomusicbot = 7 total).
4. **1000-line spool threshold** before alert to Zaal.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Create bonfires-shared-module repo (or copy bonfire.ts + spool.ts to each bot) | @Zaal + Hermes | Setup | Phase 1 start |
| Integrate Phase 1 into ZAOcoworkingBot + test end-to-end | @Zaal + Hermes | PR | Phase 1 end |
| Ask Ryan / Joshua.eth: per-API-call pricing for Bonfires writes | @Zaal | DM | Pre-Phase-2 |
| Build ZOE recall → bonfire READ path (depends on SDK finalization) | Next session | PR | Phase 2 start |
| Add per-brand ontology profiles to ZABAL bonfire instead of minting separate bonfires | @Zaal + Ryan | Decision | Phase 3 |
| Document bonfire event taxonomy in bot/README.md + update .env.example | @Zaal | Docs | Phase 1 end |
| Set up alerting on spool size > 1000 (Telegram to @zaal) | @Zaal | Automation | Phase 1 end |

## Industry Research: Multi-Agent Memory Patterns

### CrewAI (2026)

CrewAI's unified Memory class replaces separate short-term/long-term/entity/external tiers. Key features:
- Single Memory() passes to all agents in crew unless overridden.
- LLM-driven extraction: system infers scope, categories, importance on save.
- Three layers: short-term (in-context), long-term (SQLite), entity (KG). Agents share crew memory automatically.
- CheckpointConfig saves crew state at task boundaries; resume on failure.
- 45,900+ GitHub stars; 12M+ daily agent executions (Mar 2026).

**Comparison to ZAO:** CrewAI is single-process, single-crew memory. ZAO's cross-bot KG is multi-process, multi-brand, persistent across VPS restarts. Different scale, same philosophy: shared state prevents duplication.

### Multi-Scope Memory Pattern (Hindsight, 2026)

Tags every memory write with identity scopes: `user_id`, `agent_id`, `run_id`, `app_id`, `org_id`. Composes at retrieval time. Merges and ranks results automatically.

**Comparison to ZAO:** ZAO's episode tagging (bot, brand, kind) is a 3-scope subset. Scalable to add user_id if ZAO Respect / contribution tracking requires it.

### CORAL (Self-Evolving Multi-Agent, 2025)

Long-running agents self-improve via shared persistent memory + async execution + heartbeat interventions. 3-10x improvement on math/algorithmic tasks vs fixed search.

**Comparison to ZAO:** ZAO's bonfire KG is the "shared persistent memory." ZOE's daily brief + ZAOcoworkingBot's weekly reviews are the "heartbeat interventions." Not yet self-evolving, but architecture supports it.

## Sources

- [Doc 669: Bonfires Everything We Know](../669-bonfires-everything-we-know/README.md) — canonical Bonfires reference
- [Doc 668d: ZAOcoworkingBot Bonfire Integration](../668-zao-agent-improvement-may-2026/668d-zaocoworking-bonfires-integration/README.md) — Phase 1 spec (subset of this design)
- [Bonfires.ai](https://bonfires.ai) — product homepage
- [NERDDAO/bonfires-sdk](https://github.com/NERDDAO/bonfires-sdk) — Python SDK (canon branch)
- [CrewAI Memory Documentation](https://docs.crewai.com/en/concepts/memory) — multi-agent unified memory pattern
- [Building Multi-Agent Systems with Shared Memory (Hindsight, 2026)](https://hindsight.vectorize.io/guides/2026/04/21/guide-building-multi-agent-systems-with-shared-memory)
- [State of AI Agent Memory 2026 (Mem0)](https://mem0.ai/blog/state-of-ai-agent-memory-2026) — memory landscape
- [NERDDAO/memento-mori](https://github.com/NERDDAO/memento-mori) — CrewAI + Bonfires showcase
- [Multi-Agent System Architecture Guide (ClickITech, 2026)](https://www.clickittech.com/ai/multi-agent-system-architecture/)
