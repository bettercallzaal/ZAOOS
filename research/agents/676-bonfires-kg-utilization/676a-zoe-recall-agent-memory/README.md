---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-19
related-docs: 601, 665, 669, 673, 676
tier: STANDARD
parent-doc: 676
---

# 676a — ZOE Bonfire Recall: Agent Memory Architecture & Integration

Goal: Specify how ZOE's 4-block Letta-style memory integrates with ZABAL Bonfire KG for daily concierge recall + as replacement/augmentation for local file-based memory.

Context: Bonfire has 780 ingested episodes (31 brands + 80 GitHub READMEs + 668 research docs). Vector search blocked until `/labeling/hybrid` runs. ZOE lives at `bot/src/zoe/` with 4 blocks (persona/human/working/tasks) injected per-turn. Ryan (Bonfires founder) is shipping "compiled new ZOE" with bonfire memory substrate post-SDK finalization.

---

## Key Decisions (no preamble)

| Decision | Action | Why |
|---|---|---|
| **Bonfire augments, does NOT replace, local 4-block memory** | AUGMENT pattern | Hot cache (local files) + cold storage (bonfire) mirrors Letta's tiered approach. Human block can auto-refresh from KG, but task/working/persona stay local (low-latency, high-freq writes). Affords graceful degradation when bonfire is down or unlabeled. |
| **Human block refreshes from bonfire nightly** | YES, daily cron | `~/.zao/zoe/human.md` is hand-edited today (seeded from HUMAN_DEFAULT at line 170 of memory.ts). Automate via `recall('Zaal facts + relationships')` + bonfire-backed refresh ops. Fallback to manual if bonfire API fails. |
| **Recall is on-demand tool call, not prefetch per turn** | ON-DEMAND | Every turn prefetch = $0.10 baseline * N turns * cost of bonfire vector search (~0.02-0.05 per query). On-demand: ~$0.005 per call, invoked 2-4x/week. Break-even at 7+ turns. ZOE's reasoning layer (persona block line 56) already gates RECALL with "when you don't know a fact, use RECALL or grep." Ship on-demand. |
| **Vector search inject via new `<bonfire_recall>` prompt block** | YES, pre-alloc | When ZOE calls `recall()` (returns RecallRequest or RecallResult per recall.ts), inject result as `<bonfire_recall>source_query: ...\nresults:\n...</bonfire_recall>` block BETWEEN `<working_memory>` and `<tasks>`. Size-capped at 800 tokens (typical graph search = 200-400). Render in buildSystemBlocks() at concierge.ts line 22. |
| **Write taxonomy: ZOE mirrors captures + task ops to bonfire** | YES | `mirrorTurn()` in recall.ts writes ZOE's captures + completed tasks as `episode` nodes. Episode type = one of: `decision`, `reflection`, `learning`, `relationship`, `task_outcome`, `captured_fact`. Exclude task_ops with status pending (write on completion). Run after every turn that has captures or completed tasks. |
| **Letta-style memory "pressure" eviction: not needed with bonfire** | DEFER PRESSURE, INGEST ON COMPLETION | Letta does memory pressure because local memory is bounded (context window, disk). ZOE's local recent buffer is RECENT_MAX=8 turns (archival spilling to `~/.zao/zoe/archive/`). With bonfire backing, the archive becomes the cold store—no need for active compression. Just keep the hot cache lean (8 turns) and archive at month granularity (done). On task completion, mirror to bonfire; local task list can age out after 30 days without degrading recall. |
| **Failure modes: bonfire down mid-turn** | GRACEFUL DEGRADE | If bonfire API timeout (>2s) on recall() or mirrorTurn(), log error, continue without the graph context. ZOE's persona block line 56 says "if unsure, query Bonfire OR output the RECALL query for Zaal to relay"—fallback is built. No hard blocking. Implement `recall()` with 2s timeout + `Promise.race()` pattern. |
| **Cost model: adaptive graph_mode (Bonfires SDK)** | USE `adaptive` | Bonfires SDK supports `graph_mode: "adaptive" | "static" | "regenerate" | "append"`. Adaptive mode lets the model decide if KG query needed (LLM counts its uncertainty), saves ~40% token spend vs always-regenerate. Cost: baseline $0.10/turn + on-demand recall at $0.005-0.01 per query. Monthly: ~$50 concierge baseline + bonfire ops. Within budget from doc 620. |
| **Stale KG data risk: snapshot-not-hot** | MITIGATE VIA MANUAL RELAY UNTIL SDK | Today recall.ts uses manual relay (Zaal pastes to @zabal_bonfire, pastes reply back). Fresh data guaranteed by Zaal's hand. When SDK lands, implement `recall()` with BONFIRE_API_KEY env + 2s TTL on searches. Query result freshness = "whatever the graph had at query time"; if Zaal updated Bonfire 30s ago, ZOE sees 30s stale. For critical decisions, ZOE should ask: "is this fact current?" (handled by Letta-style persona rules). |

---

## Architecture: 4-Block Memory + Bonfire Bridge

### Current State (memory.ts)

ZOE's 4-block system (lines 259-475):

```typescript
export interface MemoryBlocks {
  persona: string;        // ~/.zao/zoe/persona.md (5.8 KB, versioned in git)
  human: string;          // ~/.zao/zoe/human.md (1.2 KB, hand-edited daily)
  working: string;        // ~/.zao/zoe/recent/<chat_id>.json (last 8 turns, ~3 KB)
  tasks: string;          // Filtered subset of tasks.json (open only, ~2 KB)
  quests: string;         // Sidequests (SIDEQUESTZ, ~1 KB)
  chat_scope: ChatScope;
  chat_title?: string;
}
```

Rendered into system prompt at buildSystemBlocks() (concierge.ts line 22):
```
<persona>...</persona>
<human>...</human>
<working_memory>...</working_memory>
<tasks>...</tasks>
<quests>...</quests>
[USER MESSAGE]
```

Total per-turn baseline: ~13-16 KB = ~3200 input tokens (verified by `inputTokens` in ConciergeResult, line 60 of types.ts).

### Proposed Bridge: Bonfire Augmentation

Add 5th optional block:

```typescript
export interface MemoryBlocks {
  // ... existing 4 blocks ...
  bonfire_recall?: {
    source_query: string;      // what ZOE asked the graph
    results: string;           // graph reply (size-capped 800 tokens)
    timestamp: string;         // ISO 8601, cache eviction signal
    search_latency_ms: number; // observability
  };
}
```

Render as `<bonfire_recall>...</bonfire_recall>` in buildSystemBlocks() AFTER `<working_memory>`, BEFORE `<tasks>`. Size guard: if results exceed 800 tokens, truncate with `[... {N} results omitted for context ...]`.

### Token Budget Impact

| Block | Tokens (baseline) | Bonfire case | Delta |
|-------|-------------------|--------------|-------|
| persona | 1200 | 1200 | +0 |
| human | 300 | 300 | +0 |
| working | 800 | 800 | +0 |
| tasks | 500 | 500 | +0 |
| quests | 200 | 200 | +0 |
| **bonfire_recall** | — | 200-400 | **+200-400** |
| **user message** | 100-300 | 100-300 | +0 |
| **TOTAL** | 3100-3600 | 3500-4500 | **+10-25%** |

Output tokens: ~200-400 (typical reply). Cost per turn: $0.10 (baseline Sonnet) + $0.005-0.015 (bonfire graph ops) = **$0.11-0.12 per turn cold**. 10 turns/day = $1.10-1.20/day. Monthly: $33-36 concierge baseline + $0.50-4.50 bonfire ingestion (doc 620c). Well within budget.

---

## Concrete Build Spec

### Phase 1: Augment (Week 1-2, no SDK yet, manual relay)

**File: `bot/src/zoe/recall.ts`** (existing, lines 1-83)

```typescript
// Current state: RecallRequest/RecallResult types defined, recallViaSdk() returns manual_relay_needed

// ADD: New interface for graph-backed results when SDK lands
export interface BonfireRecallResult {
  query: string;
  results: Array<{
    id: string;
    title: string;
    summary: string;
    entity_type: 'fact' | 'decision' | 'person' | 'project' | 'event';
  }>;
  total_count: number;
  search_latency_ms: number;
}

// MODIFY recallViaSdk() to accept optional graph_mode
export async function recallViaSdk(
  req: RecallRequest,
  graph_mode: 'adaptive' | 'static' | 'regenerate' = 'adaptive'
): Promise<RecallResult> {
  const apiKey = process.env.BONFIRE_API_KEY;
  const bonfireId = process.env.BONFIRE_ID;

  if (!apiKey || !bonfireId) {
    return { kind: 'manual_relay_needed', query: req.query };
  }

  // Future: When SDK lands, implement:
  //   const client = new BonfireClient({ apiKey, bonfireId });
  //   const start = Date.now();
  //   const graphResult = await client.agents.chat({
  //     query: req.query,
  //     graph_mode,
  //     num_results: 5,
  //     timeout_ms: 2000,  // Hard 2s cutoff
  //   });
  //   const latency = Date.now() - start;
  //   return {
  //     kind: 'sdk_response',
  //     query: req.query,
  //     text: formatBonfireResults(graphResult),
  //     bonfire_result: graphResult,
  //     search_latency_ms: latency,
  //   };

  console.warn('[zoe/recall] SDK not configured; falling back to manual relay');
  return { kind: 'manual_relay_needed', query: req.query };
}

// ADD: Format graph results for prompt injection
function formatBonfireResults(result: BonfireRecallResult): string {
  const lines = [
    `Query: ${result.query}`,
    `Matches: ${result.total_count} (showing first 5)`,
    `Search time: ${result.search_latency_ms}ms`,
    '',
  ];
  for (const item of result.results.slice(0, 5)) {
    lines.push(`- [${item.entity_type.toUpperCase()}] ${item.title}: ${item.summary.slice(0, 150)}`);
  }
  if (result.total_count > 5) {
    lines.push(`\n[... ${result.total_count - 5} more results omitted ...]`);
  }
  return lines.join('\n');
}

// ADD: Mirror turn outcomes to bonfire
export async function mirrorTurn(
  captures: import('./types').ZoeCaptureNote[],
  completed_tasks: import('./types').ZoeTask[],
): Promise<{ written: number; failed: number; error?: string }> {
  const apiKey = process.env.BONFIRE_API_KEY;
  const bonfireId = process.env.BONFIRE_ID;

  if (!apiKey || !bonfireId) {
    return { written: 0, failed: 0, error: 'No bonfire config' };
  }

  // Future: When SDK lands:
  //   const client = new BonfireClient({ apiKey, bonfireId });
  //   for (const capture of captures) {
  //     await client.kg.create_node({
  //       title: capture.text.slice(0, 100),
  //       entity_type: capture.topic,  // 'decision', 'learning', etc.
  //       description: capture.text,
  //       metadata: { source: 'zoe_capture', created_at: capture.created_at },
  //     });
  //   }
  //   for (const task of completed_tasks) {
  //     await client.kg.create_node({
  //       title: `[COMPLETED] ${task.title}`,
  //       entity_type: 'task_outcome',
  //       description: `Task: ${task.description}\nOutcome: [from task.notes[-1]]`,
  //       metadata: { task_id: task.id, status: 'completed' },
  //     });
  //   }

  return { written: 0, failed: 0, error: 'SDK not configured' };
}
```

**File: `bot/src/zoe/memory.ts`** (update)

```typescript
// MODIFY: buildMemoryBlocks() signature to accept optional bonfire context

export async function buildMemoryBlocks(
  scope: ChatScope = 'private',
  chatTitle?: string,
  bonfireRecall?: { query: string; results: string; latency_ms: number }, // NEW
): Promise<MemoryBlocks> {
  const [persona, human, recentTurns, tasks, quests] = await Promise.all([
    readPersona(),
    readHuman(),
    readRecent(scope),
    readTasks(),
    buildQuestsBlock(),
  ]);

  // ... existing working/tasksBlock construction ...

  return {
    persona,
    human,
    working,
    tasks: tasksBlock,
    quests,
    chat_scope: scope,
    chat_title: chatTitle,
    bonfire_recall: bonfireRecall, // NEW: optional
  };
}

// ADD: Helper to refresh human block from bonfire (nightly cron)
export async function refreshHumanBlockFromBonfire(): Promise<void> {
  const apiKey = process.env.BONFIRE_API_KEY;
  const bonfireId = process.env.BONFIRE_ID;

  if (!apiKey || !bonfireId) {
    console.log('[zoe/memory] Bonfire not configured; skipping human refresh');
    return;
  }

  // Future: When SDK lands:
  //   const client = new BonfireClient({ apiKey, bonfireId });
  //   const zaalFacts = await client.agents.chat({
  //     query: 'List all facts about Zaal Panthaki: identity, schedule, relationships, active projects',
  //     graph_mode: 'static',
  //     num_results: 20,
  //   });
  //   const refreshed = formatHumanBlockFromKG(zaalFacts);
  //   await fs.writeFile(HUMAN_PATH, refreshed, 'utf8');
  //   console.log('[zoe/memory] Human block refreshed from bonfire');

  console.log('[zoe/memory] Bonfire SDK not yet available; human block refresh deferred');
}

// ADD: Helper to format KG results back into human.md structure
function formatHumanBlockFromKG(kgResults: any): string {
  // Reconstruct markdown structure from bonfire entities
  // Parse entity_type + title + description from each result
  // Preserve existing sections: Identity, Schedule, Active projects, Key relationships
  // Return markdown string suitable for human.md

  // PLACEHOLDER: actual implementation deferred until SDK lands and we see graph structure
  return HUMAN_DEFAULT;
}
```

**File: `bot/src/zoe/concierge.ts`** (update)

```typescript
// MODIFY: buildSystemBlocks() to render bonfire_recall block

function buildSystemBlocks(blocks: MemoryBlocks, currentDate: string): string {
  const chatLine =
    blocks.chat_scope === 'private'
      ? 'Chat: DM with Zaal'
      : `Chat: group "${blocks.chat_title ?? blocks.chat_scope}" (id ${blocks.chat_scope})`;

  const lines = [
    `Today is ${currentDate}. ZOE v${ZOE_VERSION}.`,
    ``,
    `<persona>`,
    blocks.persona,
    `</persona>`,
    ``,
    `<human>`,
    blocks.human,
    `</human>`,
    ``,
    `<working_memory>`,
    chatLine,
    blocks.working,
    `</working_memory>`,
  ];

  // NEW: Inject bonfire recall if present
  if (blocks.bonfire_recall?.results) {
    lines.push('');
    lines.push(`<bonfire_recall>`);
    lines.push(`Source query: ${blocks.bonfire_recall.source_query}`);
    lines.push(`Search latency: ${blocks.bonfire_recall.latency_ms}ms`);
    lines.push('');
    lines.push(blocks.bonfire_recall.results.slice(0, 3200)); // ~800 token cap
    lines.push(`</bonfire_recall>`);
  }

  lines.push('');
  lines.push(`<tasks>`);
  lines.push(blocks.tasks);
  lines.push(`</tasks>`);
  lines.push('');
  lines.push(`<quests>`);
  lines.push(blocks.quests);
  lines.push(`</quests>`);

  return lines.join('\n');
}

// MODIFY: runConciergeTurn() to optionally invoke recall before calling Claude

export async function runConciergeTurn(opts: ConciergeOptions): Promise<ConciergeResult> {
  const model = opts.model ?? selectModel(opts.message);

  // NEW: Check if message triggers a bonfire recall
  const recallTrigger = detectRecallNeed(opts.message);
  let bonfireBlock: any = undefined;

  if (recallTrigger && process.env.BONFIRE_API_KEY) {
    try {
      const recallResult = await recall({ query: recallTrigger, reason: 'User question needs context', expected_kind: 'mixed' });
      if (recallResult.kind !== 'manual_relay_needed' && recallResult.text) {
        const latency = 0; // TODO: capture from recallResult when SDK lands
        bonfireBlock = {
          source_query: recallTrigger,
          results: recallResult.text,
          latency_ms: latency,
        };
      }
    } catch (err) {
      console.error('[zoe/concierge] recall failed, proceeding without graph context:', (err as Error).message);
    }
  }

  // Build memory blocks with optional bonfire_recall
  const blocks = await buildMemoryBlocks(opts.blocks.chat_scope, opts.blocks.chat_title, bonfireBlock);
  const systemBlocks = buildSystemBlocks(blocks, opts.context.current_date);

  // ... rest of runConciergeTurn unchanged ...
}

// ADD: Heuristic to detect when to trigger recall
function detectRecallNeed(message: string): string | null {
  const triggers = [
    /what.*status|what's.*doing|what.*progress/i,
    /remember.*when|did.*before|past.*experience/i,
    /who.*relationship|know.*person|team.*member/i,
    /when.*deadline|schedule.*when/i,
    /doc\s+\d+|research.*fact|source|grounding/i,
  ];

  for (const regex of triggers) {
    if (regex.test(message)) {
      // Extract likely query terms from message
      return message.length > 200 ? message.slice(0, 150) : message;
    }
  }
  return null;
}
```

### Phase 2: Daily Human Block Refresh (Week 3, cron job)

Add systemd timer on VPS:

**File: `/etc/systemd/user/zoe-human-refresh.timer`**
```ini
[Unit]
Description=Daily ZOE human block refresh from bonfire
After=network-online.target

[Timer]
OnCalendar=daily
OnCalendar=05:00  # 5 AM EST, before Zaal's 6 AM wake
Persistent=true

[Install]
WantedBy=timers.target
```

**File: `/etc/systemd/user/zoe-human-refresh.service`**
```ini
[Unit]
Description=ZOE human block refresh
ConditionUser=zaalp

[Service]
Type=oneshot
ExecStart=/opt/claude-code/bin/zoe-refresh-human %h/.zao/zoe/human.md
Environment="BONFIRE_API_KEY=%s"
Environment="BONFIRE_ID=%s"
StandardOutput=journal
StandardError=journal
```

Script: `bot/scripts/refresh-human-block.sh`
```bash
#!/bin/bash
set -euo pipefail

HUMAN_PATH="${1:?human.md path required}"
BONFIRE_API_KEY="${BONFIRE_API_KEY:?env var required}"
BONFIRE_ID="${BONFIRE_ID:?env var required}"

# Invoke ZOE in "refresh mode"
cd /Users/zaalpanthaki/Documents/ZAO\ OS\ V1/bot

npx tsx src/zoe/index.ts --mode refresh-human \
  --out "$HUMAN_PATH" \
  --bonfire-api-key "$BONFIRE_API_KEY" \
  --bonfire-id "$BONFIRE_ID" \
  2>&1 | logger -t zoe-refresh-human
```

### Phase 3: Mirror Writes (Week 2, alongside recall)

After every concierge turn that has captures or completed tasks:

**File: `bot/src/zoe/index.ts`** (main loop, existing)

```typescript
// After handleMessage() returns ConciergeResult:

async function persistTurnAndMirror(result: ConciergeResult, scope: ChatScope) {
  // Push message to local archive (existing)
  await pushRecent({ from: 'zoe', text: result.reply }, scope);

  // Apply task ops (existing)
  const tasks = await readTasks();
  for (const op of result.task_ops) {
    // ... apply op to tasks ...
  }
  await writeTasks(tasks);

  // NEW: Mirror completed tasks + captures to bonfire
  if ((result.captures.length > 0 || result.task_ops.some(op => op.op === 'complete')) && process.env.BONFIRE_API_KEY) {
    try {
      const completedTasks = result.task_ops
        .filter(op => op.op === 'complete')
        .map(op => ({ id: (op as any).id, title: 'Task completed' }));

      await mirrorTurn(result.captures, completedTasks);
    } catch (err) {
      console.error('[zoe] mirror to bonfire failed:', (err as Error).message);
      // Continue; mirroring is async + can be retried
    }
  }
}
```

---

## Failure Modes & Mitigations

| Mode | Trigger | Impact | Mitigation |
|---|---|---|---|
| **Bonfire API down** | Service unavailable / 503 | recall() times out, ZOE falls back to manual relay (persona block line 61) | 2s timeout + Promise.race(). No hard block. Log to VPS syslog. |
| **Vector search returns empty** | Labeling not yet run on bonfire corpus | Recall returns no results, ZOE has no graph context | Ship with graceful empty reply format: "No graph results; ask Zaal directly or check research/". Not a failure—expected until labeling completes (doc 620 step 1). |
| **Stale KG data** | Zaal updates bonfire; ZOE queries 30s later | ZOE's context is outdated | Persona block line 67 covers this: "Never fabricate facts. If unsure, query Bonfire." ZOE learns to ask clarification if graph reply seems stale. Letta's self-edit pattern. |
| **Token overflow in bonfire_recall block** | Graph returns >800 tokens | System prompt exceeds model limit | Size-cap at 3200 chars (~800 tokens) in buildSystemBlocks(). Truncate with `[... omitted ...]` marker. Observable in inputTokens metric. |
| **Memory file corruption** | Disk write fails mid-session | Archive or recent.json corrupted | Existing: append-only archive (line 351-355 memory.ts) + ring buffer FIFO (line 401). On read error, skip corrupt line. Mirror to bonfire reduces single-source-of-truth risk. |

---

## Next Actions

| # | Action | Owner | Difficulty | Unlocks |
|---|--------|-------|------------|---------|
| 1 | Implement recall.ts SDK swap (placeholder -> real API call when key arrives) | Hermes or Zaal | 3 | Bonfire actually usable from ZOE—moves from manual relay to direct API |
| 2 | Add bonfire_recall block to MemoryBlocks interface + render in buildSystemBlocks() | ZOE or Hermes | 2 | Token budget confirmed, prompt injection tested |
| 3 | Wire detectRecallNeed() heuristic in runConciergeTurn() | ZOE or Hermes | 2 | ZOE autonomously invokes recall on relevant queries |
| 4 | Implement mirrorTurn() write path + integrate into main concierge loop | ZOE or Hermes | 3 | Bonfire accumulates ZOE's decision history + completed work |
| 5 | Set up daily cron for human block refresh (timer + service + script) | SysOps or Zaal | 2 | Human block stays fresh without manual edits |
| 6 | Test end-to-end: recall latency, token budget impact, cost per turn | Zaal | 3 | Readiness confirmation for Phase 2 full rollout |
| 7 | Install BONFIRE_API_KEY + BONFIRE_ID env vars on VPS + .env.local | Zaal or SysOps | 1 | Gates all SDK calls; prerequisite for phases 1-6 |
| 8 | Backfill 135 memory files + 740 research docs to bonfire (doc 620 step 1) | Hermes or cron job | 4 | Bonfire has corpus; recall becomes actually useful (not empty) |

---

## Industry Context: Letta vs Mem0 vs Bonfires

### Letta (MemGPT) Philosophy

Letta treats LLM context like OS virtual memory: core blocks stay in-context (RAM), recall tier is searchable history (disk cache), archival is cold storage. **Self-editing**: agents actively manage memory via tool calls, deciding what to promote/demote. **4-block structure inspired Letta pattern**: persona (system rules) + core (hot facts) + recall (conversation history) + archival (domain knowledge).

ZOE's current setup mirrors Letta's core layer (persona + human blocks) + recall tier (recent ring buffer + archive). Missing: self-editing. **ZOE doesn't yet call tools to edit memory**—that's Phase 2 (when SDK lands). Bonfire augments archival tier.

Sources:
- [Agent Memory: How to Build Agents that Learn and Remember | Letta](https://www.letta.com/blog/agent-memory)
- [Stateful AI Agents: A Deep Dive into Letta (MemGPT) Memory Models](https://medium.com/@piyush.jhamb4u/stateful-ai-agents-a-deep-dive-into-letta-memgpt-memory-models-a2ffc01a7ea1)

### Mem0 Approach

Mem0 is a plug-and-play memory service: you call `add()` to store facts, `search()` to retrieve. On Pro tier ($249/month), it builds a knowledge graph (entities + relationships) for multi-hop queries. **Framework-agnostic**: works with LangChain, CrewAI, AutoGen, or custom loops. **No self-editing**: the client code decides when to add/search; memory is passive.

ZOE differs: memory is active (ZOE decides to call recall based on persona rules). Bonfire is closer to Mem0's Pro tier (graph-backed) but agency-first.

Sources:
- [Mem0 vs Letta vs MemGPT 2026: AI Agent Memory Layer Comparison](https://tokenmix.ai/blog/ai-agent-memory-mem0-vs-letta-vs-memgpt-2026)
- [Mem0 vs Letta (MemGPT): AI Agent Memory Compared (2026)](https://vectorize.io/articles/mem0-vs-letta)

### Bonfires Positioning

Bonfires is **Letta philosophy + Farcaster-native auth + multi-bonfire knowledge network + $KNOW token economy**. kEngrams are content-addressed subgraphs (merkle-rooted), agents are first-class personas with tagging + autonomous ingestion every 20 minutes. Adaptive graph_mode (40% token savings) decides whether KG query is needed.

ZAO's choice: Bonfires for multi-brand federation (ZABAL bonfire today, WaveWarZ/COC/Stock bonfires later), Farcaster gating (matches ZAO OS auth layer), partner relationship (Joshua.eth actively shipping).

Tradeoff vs Letta: Bonfires is SaaS (vendor lock-in risk, mitigated by kEngram export to Markdown/OWL). Letta is OSS, self-host. For ZAO: Bonfire's social + economic layers justify the SaaS cost.

Sources:
- [Doc 669 — Bonfires: Everything We Know](../../669-bonfires-everything-we-know/README.md) (internal)
- [Doc 620 — Bonfire push-everything](../../620-bonfire-push-everything/README.md) (internal)

---

## Related Decisions

- **Doc 620** — Bonfire write pipeline (backfill, cron, redaction, cost)
- **Doc 669** — Bonfire landscape + API reference + SDK roadmap
- **Doc 673** — Bonfire ontology design for ZAO ecosystem
- **Doc 601** — ZOE specs & personality (parent doc for Hermes, concierge, memory)
- **Doc 665** — Bonfire deep-dive for ZAO (vector search, agent system, economics)

---

## Summary

ZOE's 4-block local memory + Bonfire augmentation creates a **tiered architecture** matching Letta's philosophy: hot cache (local files, low-latency) + cold storage (Bonfire KG, high-capacity). On-demand recall (not per-turn prefetch) keeps costs at ~$0.11-0.12/turn. Human block refreshes nightly from bonfire, reducing manual edits. Mirror writes (captures + task outcomes) feed the graph continuously. Graceful degradation when bonfire is down or unlabeled. Ship in phases: Phase 1 (recall block injection + SDK swap), Phase 2 (human refresh cron), Phase 3 (mirror writes). When Ryan ships the "compiled new ZOE," the graph substrate is already warm with 1-2 weeks of live corpus.

**Bottom line:** Bonfire AUGMENTS, NOT REPLACES, local memory. Local stays hot-cache (task writes stay fast, persona stays versioned in git). Graph becomes the durable, queryable institutional memory.
