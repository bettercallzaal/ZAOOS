---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
related-docs: 601, 665, 669, 673, 673a, 673b, 673c, 673d
tier: DEEP
parent-doc: 673
---

# Phase 2: ZOE ↔ Bonfire Bi-Directional Dialog + Automation

## Overview

Phase 1 (v0.3.0 ZAOcoworkingBot, shipped 2026-05-18) writes one-way to ZABAL Bonfire via fire-and-forget kEngram mutations. Phase 2 upgrades ZOE to READ from Bonfire and embed its knowledge into concierge replies, morning briefs, and proactive nudges. ZOE becomes a true knowledge-aware agent: she sees team activity across brands and can surface insights without manual relay.

**Architecture in one sentence:** ZOE gets a bonfire_query tool (with SDK fallback) injected into her Claude Max system prompt; daily schedules (brief, posts, nudges) read team activity from the KG; fallback to stale local cache on API errors.

---

## 1. Decision Matrix

| # | Decision | Options | VERDICT | Notes |
|---|----------|---------|---------|-------|
| 1.1 | **Bonfire API integration method** | A) HTTP + SDK, B) HTTP only, C) MCP when shipped | **A: HTTP + SDK** | Phase 2 lands both; MCP joins Phase 3. SDK future-proofs concierge.ts callsite. |
| 1.2 | **Query vs subscribe** | A) Pull (ZOE polls), B) Subscribe (Bonfire webhooks) | **A: Pull** | No webhook infra on Bonfire yet. ZOE polls on-demand (concierge DM) + scheduled (brief/posts). Lower complexity. |
| 1.3 | **ZOE schedule mode** | A) On-demand (only when Zaal asks), B) Cron-driven (periodic brief/posts refresh), C) Both | **C: Both** | On-demand for concierge (Zaal asks "what did Iman ship?"), cron for brief.ts (daily activity summary). |
| 1.4 | **Latency budget** | A) <1s cached, B) <5s API call, C) Best-effort timeout 10s | **C: Best-effort 10s** | Bonfire latency varies. Timeout 10s; on timeout, use cache + emit "bonfire unavailable" note. |
| 1.5 | **Write trust** | A) ZOE reads only, B) ZOE can write facts, C) ZOE writes with approval gate | **A: ZOE reads only** | Defer bonfire_write_fact to Phase 3. Phase 2 focuses on truth-seeking. |
| 1.6 | **Local cache strategy** | A) Last 5 queries, B) Full snapshot daily, C) TTL-based (30min per query) | **B: Daily snapshot** | Cron-driven snapshot at 06:00 UTC (morning before brief fires), refresh on concierge demand if >1h stale. |
| 1.7 | **Ontology coupling** | A) Generic KG queries, B) Brand-specific edge labels, C) Both with fallback | **C: Both** | Phase 2 uses generic (COMPLETED_BY, ASSIGNED_TO, BELONGS_TO). Brand profiles deferred to Phase 3. |
| 1.8 | **Error recovery** | A) Fail silent, B) Emit warning in reply, C) Trigger fallback ritual | **B: Emit warning** | ZOE says "bonfire offline" in replies; nudges/brief note the gap; user knows to check manually. |

**Status:** All verdicts LOCKED. Ready for build start.

---

## 2. Architecture Diagram

### Flow: ZOE reads Bonfire on-demand + scheduled

```
┌─────────────────────────────────────────────────────────────────┐
│                     Zaal's DM / @mention                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     v
          ┌──────────────────────┐
          │ concierge.ts (Phase2) │
          │ Call Claude Max with  │
          │ bonfire_query tool    │
          └──────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        v                         v
   (User DM)              (Tool Invocation)
   reply with                  │
   <bonfire_query>             v
      text            ┌─────────────────┐
                      │ bonfire/client   │
                      │ .ts: POST query  │
                      │ to Bonfire API   │
                      └────┬────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        v (2xx)                              v (timeout/error)
   Parse results              ┌──────────────────────┐
   return to LLM              │ Fall back to cache    │
        │                     │ ~/.zao/zoe/bonfire-  │
        │                     │ snapshot.json (20min) │
        └─────────────────────┤                      │
                              └──────────────────────┘
                              Return stale + warning
```

### Cron integration: brief.ts + posts/scheduler.ts

```
┌──────────────────────────────┐
│ 06:00 UTC (01:00 EST)        │
│ generateBriefSnapshot()       │
└──────┬───────────────────────┘
       │ POST /kg/search
       │ recent: true, limit: 50
       v
┌──────────────────────────────┐
│ Cache to                      │
│ ~/.zao/zoe/bonfire-snapshot   │
│ { date, activity[], stats }   │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 05:00 EST morning brief       │
│ generateMorningBrief()        │
└──────┬───────────────────────┘
       │ Read bonfire-snapshot
       │ Count completed items,
       │ pull top blockers
       v
  Include in brief text:
  "Team completed 3 items,
   2 blocked on APIs"
```

### Data flow: 8 ops from ZAOcoworkingBot → KG → ZOE reads

```
/add, /done, /assign, /setdue ... (8 ops)
        │
        v
  ZAOcoworkingBot.bonfire/
  .ts: eventToChangeset()
        │
        v
  POST kEngram/batch
        │
        v
  ZABAL Bonfire KG
  (nodes: todo:N, edges: ASSIGNED_TO, COMPLETED_BY)
        │
        │ 06:00 UTC
        └─────→ bonfire_query({ recent: true }) ← ZOE reads
                  returns: { nodes: [...], edges: [...], meta: {...} }
                        │
                        v
                  Parse + count + embed in brief/posts
```

---

## 3. New Files to Create

### **bot/src/zoe/bonfire/client.ts** (85 lines)
Wraps Bonfire HTTP API for query and snapshot reads. Exports:
- `bonfire_query(query: string, options?: QueryOpts)` - POST /kg/search, parse results
- `bonfire_snapshot()` - fetch recent activity, cache to disk
- `bonfire_cached_snapshot()` - load from ~/.zao/zoe/bonfire-snapshot.json
- `isBonfireEnabled()` - check BONFIRE_API_KEY + BONFIRE_ID env vars
- Error handling: logs on 4xx/5xx/timeout, returns null

### **bot/src/zoe/bonfire/tools.ts** (120 lines)
LLM tool definitions injected into Claude Max system prompt. Exports:
- `bonfire_query(query: string, limit?: number): { nodes: KGNode[], edges: KGEdge[], error?: string }`
- `bonfire_recent(category?: string, since_minutes?: number): { items: RecentItem[] }`
- Includes usage examples: "bonfire_query('tasks completed by Iman in last 7 days')"
- Tool descriptions optimized for Claude Max to invoke naturally

### **bot/src/zoe/bonfire/sync.ts** (70 lines)
Mirror Letta memory writes to Bonfire (Phase 2.5). Placeholder exports:
- `sync_memory_to_bonfire(block_name, block_content)` - queues async write (not called yet)
- `write_fact_to_bonfire(subject, predicate, object, fact)` - future for Phase 3

### **bot/src/zoe/bonfire/types.ts** (60 lines)
Bonfire API response shapes. Exports:
```typescript
interface KGNode { uuid: string; name: string; summary: string; labels: string[] }
interface KGEdge { source: string; target: string; name: string; fact?: string }
interface KGSearchResult { nodes: KGNode[]; edges: KGEdge[]; page_info: { total: number; has_more: boolean } }
interface CachedSnapshot { fetched_at: string; activity: ActivitySummary; nodes: KGNode[]; edges: KGEdge[] }
interface ActivitySummary { completed_count: number; blocked_count: number; assigned_to_user: Map<string, number> }
```

### **bot/src/zoe/concierge.ts** (modifications, ~30 lines added)
- Import bonfire/tools.ts
- If `BONFIRE_ENABLED`, append bonfire tool definitions to allowedTools list
- System prompt notes: "You can query the team's knowledge graph via bonfire_query(...) to answer questions about recent work."
- Pass tool results back to Claude Max as function returns

### **bot/src/zoe/brief.ts** (modifications, ~40 lines added)
- New function `generateBriefSnapshot()` - runs at 06:00 UTC, caches snapshot
- Modify `generateMorningBrief()` to read bonfire-snapshot.json
- Inject new section: "TEAM ACTIVITY (last 24h): X completed, Y blocked, Z by Iman"
- Graceful fallback: if snapshot missing, skip section

### **bot/src/zoe/posts/sources.ts** (modifications, ~25 lines added)
- New function `gatherBonfireSignals()` - read cached snapshot, pull top activity
- Call from `startPostsScheduler()` when picking ecosystem/build category
- Return top 3 blockers + 2 recent completions for drafters to reference

---

## 4. Env Contract

### New Variables

| Var | Type | Required | Phase | Notes |
|-----|------|----------|-------|-------|
| `BONFIRE_API_KEY` | string | Phase 2 | 2 | Shared with ZAOcoworkingBot. Joshua.eth provisioning. |
| `BONFIRE_ID` | string | Phase 2 | 2 | ZABAL Bonfire UUID. Shared with ZAOcoworkingBot. |
| `BONFIRE_API_URL` | string | no (default tnt-v2) | 2 | Bonfire API base URL, defaults to `https://tnt-v2.api.bonfires.ai`. |
| `BONFIRE_ZOE_READ_ENABLED` | bool | no (default true) | 2 | Toggle bonfire reads globally. Graceful no-op if false. |
| `BONFIRE_QUERY_TIMEOUT_MS` | int | no (default 10000) | 2 | Timeout for bonfire_query() calls. |
| `BONFIRE_SNAPSHOT_TTL_MINUTES` | int | no (default 30) | 2 | Cache TTL. If snapshot >30min old, refresh on next query. |

### Inherited

- `BONFIRE_API_KEY` already required by ZAOcoworkingBot
- `BONFIRE_ID` already required by ZAOcoworkingBot
- Both should be installed at bot startup via `.env` (not secrets manager yet)

### Phase 3

- `BONFIRE_WRITE_ENABLED` - gate for write_fact_to_bonfire()
- `BONFIRE_SYNC_INTERVAL_MINUTES` - Letta memory sync cron

---

## 5. Tool Surface for LLM

### Tool 1: bonfire_query

```typescript
interface BonfireQueryTool {
  name: 'bonfire_query';
  description: 'Search the team knowledge graph for facts, decisions, completed work, blockers. E.g. "tasks completed by Iman", "blockers in ecosystem", "decisions made this week".';
  input_schema: {
    type: 'object';
    properties: {
      query: {
        type: 'string';
        description: 'Natural language search, e.g. "what did Iman complete this week?" or "open blockers on APIs"';
      };
      limit?: {
        type: 'integer';
        description: 'Max results to return (default 10, max 50)';
      };
    };
    required: ['query'];
  };
  returns: {
    kind: 'success' | 'unavailable';
    results?: Array<{
      node: KGNode;
      edges: KGEdge[]; // incoming + outgoing for context
      relevance_score?: number;
    }>;
    error?: string;
    cache_note?: string; // "results from 20-min-old cache" if fallback
  };
}
```

### Tool 2: bonfire_recent

```typescript
interface BonfireRecentTool {
  name: 'bonfire_recent';
  description: 'Fetch team activity snapshot (cached hourly at 06:00 UTC). Returns counts: completed, blocked, assigned-to breakdown.';
  input_schema: {
    type: 'object';
    properties: {
      category?: {
        type: 'string';
        enum: ['all', 'ecosystem', 'build', 'events'];
        description: 'Filter by ZAO brand/category (default: all)';
      };
      since_minutes?: {
        type: 'integer';
        description: 'Results from last N minutes (default: 1440 = 24h)';
      };
    };
  };
  returns: {
    snapshot_fetched_at: string; // ISO timestamp
    completed_count: number;
    blocked_count: number;
    assigned_to: { [username: string]: number }; // count per owner
    top_blockers: string[]; // node names
    cache_age_minutes: number;
  };
}
```

### Tool 3: bonfire_write_fact (Phase 3, stub in Phase 2)

```typescript
// Phase 2: tool defined but NOT added to allowedTools
// Phase 3: unlocked for selected tasks (e.g. "ZOE, log this decision")
interface BonfireWriteFactTool {
  name: 'bonfire_write_fact';
  description: '[PHASE 3] Write a fact to the knowledge graph.';
  input_schema: {
    type: 'object';
    properties: {
      subject: { type: 'string'; description: 'Entity name (e.g. "doc-601", "Zaal", "ZAO-coworking")' };
      predicate: { type: 'string'; description: 'Edge type (e.g. "DECIDED", "COMPLETED_BY", "BLOCKED_ON")' };
      object: { type: 'string'; description: 'Target entity name' };
      fact: { type: 'string'; description: 'Optional metadata (timestamp, reason)' };
    };
    required: ['subject', 'predicate', 'object'];
  };
  returns: { success: boolean; node_uuid?: string; error?: string };
}
```

---

## 6. Scheduler Integration

### 6.1 Morning Brief (brief.ts)

Add to `generateMorningBrief()`:

```typescript
async function generateMorningBrief(opts: { repoDir: string }): Promise<string> {
  // ... existing code: open tasks, commits, PRs, inbox ...

  // NEW: Bonfire team activity snapshot
  let teamActivityText = '';
  if (isBonfireEnabled()) {
    try {
      const snapshot = await bonfire_cached_snapshot();
      if (snapshot) {
        const completed = snapshot.activity.completed_count;
        const blocked = snapshot.activity.blocked_count;
        const topBlocker = snapshot.activity.top_blockers?.[0] ?? 'none';
        teamActivityText = [
          `TEAM ACTIVITY (24h)`,
          `- Completed: ${completed}`,
          `- Blocked: ${blocked} (top: ${topBlocker})`,
          `- See bonfire.zaoos.com for full graph`,
        ].join('\n');
      }
    } catch (err) {
      console.error('[zoe/brief] bonfire snapshot failed:', err);
      // silent fallback; brief continues without team activity section
    }
  }

  return [
    `Morning brief - ${dayOfWeek} ${date} 5am`,
    `TOP PRIORITIES (${p0Count} P0, ${p1Count} P1)`,
    // ... priorities ...
    teamActivityText,
    // ... rest ...
  ].join('\n\n');
}
```

### 6.2 Scheduler cron (scheduler.ts)

Add snapshot refresh at 06:00 UTC:

```typescript
export function startScheduler(opts: SchedulerOptions): { stop: () => void } {
  const tasks: ScheduledTask[] = [];

  // NEW: 06:00 UTC — bonfire snapshot refresh (caches for brief at 09:00)
  tasks.push(
    cron.schedule(
      '0 6 * * *',
      async () => {
        if (!isBonfireEnabled()) return;
        if (await alreadyFired('bonfire-snapshot')) return;
        try {
          await bonfire_snapshot();
          await markFired('bonfire-snapshot');
          console.log('[zoe/scheduler] bonfire snapshot refreshed');
        } catch (err) {
          console.error('[zoe/scheduler] bonfire snapshot failed:', err);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // ... rest of scheduler (morning brief 09:00, evening 01:00, etc.) ...
}
```

### 6.3 Posts scheduler (posts/scheduler.ts)

Integrate into signal gathering:

```typescript
async function gatherEcosystemSignals(repoDir: string): Promise<PostSourceSnapshot['ecosystem']> {
  // existing: git activity ...

  // NEW: bonfire activity
  let bonfireActivity: string[] = [];
  if (isBonfireEnabled()) {
    try {
      const snapshot = await bonfire_cached_snapshot();
      if (snapshot) {
        bonfireActivity = snapshot.activity.top_blockers
          .map((blocker) => `Team blockers: ${blocker}`)
          .slice(0, 3);
      }
    } catch (err) {
      // silent, ecosystem signals degrade gracefully
    }
  }

  return {
    repoActivity: [...repoActivity, ...bonfireActivity],
  };
}
```

---

## 7. Test Plan

### T1: bonfire_query on DM

**Given:** Zaal DMs ZOE "what is everyone working on?"  
**When:** concierge.ts invokes bonfire_query tool  
**Then:** Returns 10 recent nodes with ASSIGNED_TO edges, ZOE synthesizes reply ("Iman on X, Zaal on Y, ...")

### T2: Proactive blocker nudge

**Given:** bonfire_cached_snapshot shows 3+ blockers  
**When:** ZOE's hourly nudge fires  
**Then:** Nudge surfaces one blocker ("next move: unblock API key request for X")

### T3: Morning brief includes team activity

**Given:** 06:00 UTC snapshot refresh succeeds  
**When:** 09:00 UTC morning brief fires  
**Then:** Brief includes "TEAM ACTIVITY: 4 completed, 2 blocked"

### T4: Query by person

**Given:** Zaal DMs "what did Iman ship this week?"  
**When:** concierge invokes bonfire_query + searches COMPLETED_BY edges  
**Then:** Returns nodes where Iman is target of COMPLETED_BY, ZOE lists them

### T5: Graceful fallback on timeout

**Given:** Bonfire API timeout (>10s)  
**When:** bonfire_query times out  
**Then:** Falls back to cached snapshot + appends "bonfire offline, using last known state" to reply

---

## 8. Phase 2 Readiness Gate

### Must land BEFORE build starts:

1. **Bonfire API read access confirmed**
   - [ ] Joshua.eth provisions BONFIRE_API_KEY
   - [ ] `curl -H "Authorization: Bearer $BONFIRE_API_KEY" https://tnt-v2.api.bonfires.ai/v1/bonfires/$BONFIRE_ID/kg/search -d '{}' 2>&1` returns 2xx

2. **Query endpoint path verified**
   - [ ] POST /kg/search exists (not /search or /query)
   - [ ] Response shape matches KGSearchResult: `{ nodes: [...], edges: [...], page_info: {...} }`

3. **Performance baseline**
   - [ ] Single bonfire_query: <5s p50, <10s p99
   - [ ] Snapshot refresh (50 nodes): <3s

4. **ZAOcoworkingBot Phase 1 live**
   - [ ] systemd unit running on 187.77.3.104
   - [ ] At least 10 mutations in bonfire-spool.jsonl with status:'sent'

---

## 9. Phase 3+ Deferred

- **bonfire_write_fact tool:** Unlock write operations for ZOE. Requires approval gate for critical facts.
- **Cross-bot KG:** Magnetiq, AttaBotty, newsletter agents read/write to shared Bonfire (multi-brand KG).
- **Per-brand ontology profiles:** Brand-specific edge labels (ZABAL_BLOCKER_LABEL=tech, event, community). Query syntax: `"tech blockers in WaveWarZ"`.
- **Native SDK swap:** When Joshua.eth ships MCP server, replace HTTP client with native bindings.
- **Letta memory sync:** Mirror ZOE's 4-block memory (persona, human, working, tasks) as KG nodes. Enable historical query: "what did ZOE think about this 3 weeks ago?"

---

## File Checklist

- [ ] `bot/src/zoe/bonfire/client.ts` (85 lines)
- [ ] `bot/src/zoe/bonfire/tools.ts` (120 lines)
- [ ] `bot/src/zoe/bonfire/types.ts` (60 lines)
- [ ] `bot/src/zoe/bonfire/sync.ts` (70 lines, stub)
- [ ] `bot/src/zoe/bonfire/index.ts` (exports)
- [ ] `bot/src/zoe/concierge.ts` modifications
- [ ] `bot/src/zoe/brief.ts` modifications
- [ ] `bot/src/zoe/scheduler.ts` modifications
- [ ] `bot/src/zoe/posts/sources.ts` modifications
- [ ] `.env.example` updates (BONFIRE_API_KEY, BONFIRE_ID, BONFIRE_QUERY_TIMEOUT_MS)

---

**Last validated:** 2026-05-18  
**Ready for:** Coding session (next build)  
**Blocker:** Joshua.eth Bonfire SDK key provisioning
