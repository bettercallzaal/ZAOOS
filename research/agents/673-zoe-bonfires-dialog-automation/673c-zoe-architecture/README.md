---
title: ZOE Architecture Guide - Bonfire Integration Points
topic: agents
type: guide
status: research-complete
last_validated: 2026-05-18
related_docs:
  - 601  # agent stack cleanup
  - 605  # Phase 1 unlock (Playwright)
  - 665  # Bonfires deep dive
  - 669  # Bonfires everything we know
  - 673  # parent doc
tier: STANDARD
parent_doc: 673
---

# ZOE Architecture Guide - Where to Hook Bonfire Dialog

**TL;DR:** ZOE runs as a Telegram bot (Grammy) on ZAOOS bot/ subdir, backed by 4-block Letta-inspired memory (persona/human/working/tasks) at ~/.zao/zoe/. The 8 integration surfaces below are ranked by impact - the top 3 (LLM dispatch injection, morning brief intake, memory writes) are P0 for Bonfire dialog.

---

## ZOE's Runtime

**Entry point:** `bot/src/zoe/index.ts` (file:line 1-150)
- **Language:** TypeScript / Node.js (Grammy + node-cron)
- **Triggers:** Telegram polling on `@zaoclaw_bot` token (env: `ZOE_BOT_TOKEN`)
- **Run mode:** systemd user unit `zoe-bot.service` on VPS 1 (Iman's box) OR local dev via `pnpm tsx src/zoe/index.ts`
- **Chat scoping:** Private (Zaal DM) vs group (allowlisted per ~/.zao/zoe/groups.json)

**Concierge flow** `bot/src/zoe/concierge.ts` (file:line 1-170):
1. User sends Telegram message
2. Load memory blocks (persona/human/working/tasks) from ~/.zao/zoe/
3. Build system prompt via `buildSystemBlocks()` (file:line 22-51)
4. Call Claude Code CLI with `appendSystemPrompt` (bot/src/hermes/claude-cli.ts)
5. Parse Claude's reply for text + JSON ops (tasks/quests/captures)
6. Apply ops, write memory deltas, reply in Telegram

**Model selection** `bot/src/zoe/types.ts` (file:line 82-95):
- Default: Sonnet (cheap, cached)
- Strategic (>280 chars, "plan"/"tradeoff"): Opus
- Quick (factual <80 chars): Haiku
- Escalation via `"escalate": true` in reply JSON

---

## Memory Architecture - Letta Pattern

**Storage:** ~/.zao/zoe/ (Zaal's home machine)

```
~/.zao/zoe/
├── persona.md              (identity + voice rules, versioned in git)
├── human.md                (Zaal facts, refreshed daily)
├── tasks.json              (open task queue, global)
├── bootloader-template.md  (child-bot seed)
├── recent/                 (per-chat FIFO rings)
│   └── <chat_id>.json      (last 8 turns)
├── archive/                (turn history)
├── posts/                  (v1 state: schedule.json, log.jsonl)
├── events/                 (event sources: today.txt, tomorrow.txt)
├── sentinels/              (cron idempotency markers)
├── voice-memos/            (v2 feature - direct Zaal audio)
└── groups.json             (group configs + allowlists)
```

**4 memory blocks loaded per concierge turn** `bot/src/zoe/memory.ts` (file:line 22-51):

1. **persona.md** (~320 lines)
   - ZOE identity, voice rules, anti-patterns
   - Routing (when to call Hermes, when to RECALL to Bonfire)
   - Sidequests system (Earl Nightingale alignment test)
   - Group behavior rules
   - Loaded: full text, unchanged per turn

2. **human.md** (~200 lines, stub shown)
   - Identity facts (Farcaster, X, ENS, wallet, email)
   - Schedule (M-F 4:30am-9pm EST)
   - Active projects (ZAO OS, ZAOstock, BCZ YapZ, etc)
   - Key relationships (Cassie, Iman, ThyRev, etc)
   - Loaded: full text, refreshed daily (or via RECALL refresh)
   - **BONFIRE hook candidate**: daily refresh should pull latest facts from bonfire

3. **working_memory** (recent turns for this chat)
   - Last 8 turns (FIFO ring) from ~/.zao/zoe/recent/<chat_id>.json
   - Context line: "Chat: DM with Zaal" or "Chat: group '<name>' (id <id>)"
   - Loaded: last 8 turns, full conversation history

4. **tasks.json** (prioritized queue)
   - Open ZoeTasks: id, title, description, status, priority, source
   - Format: JSON array, global (not per-chat)
   - Loaded: full queue, rendered as block text
   - **BONFIRE hook candidate**: tasks could auto-sync to bonfire task backlog

Each block injected verbatim into system prompt via `buildSystemBlocks()`.

---

## Integration Surface #1: LLM Dispatch (System Prompt Injection)

**Impact: P0** - affects every reply, cheapest integration, highest leverage

**Where:** `bot/src/zoe/concierge.ts`, `buildSystemBlocks()` (file:line 22-51)

**Current system prompt structure:**
```
Today is {current_date}. ZOE v0.2.0.

<persona>
{blocks.persona}
</persona>

<human>
{blocks.human}
</human>

<working_memory>
Chat: DM with Zaal
{blocks.working}
</working_memory>

<tasks>
{blocks.tasks}
</tasks>

<quests>
{blocks.quests}
</quests>
```

**Integration proposal:**
Add a `<bonfire_context>` block after `<human>`, populated from Bonfire RECALL:

```typescript
// In buildSystemBlocks(), after human block:
const bonfireContext = await queryBonfireContext(blocks.chat_scope);
// returns: top 3 recent bonfire decisions, active side quests, pending actions

return [...].join('\n') +
  (bonfireContext ? `\n<bonfire_context>\n${bonfireContext}\n</bonfire_context>` : '');
```

**Budget impact:**
- Current: ~26KB cached system prompt (prompt-cache amortizes cost)
- Bonfire context add: ~2-4KB per turn (300-500 tokens)
- Cost: ~$0.01 per turn (Sonnet) if not cached

**Feasibility:** HIGH
- No changes to concierge logic, memory storage, or task ops
- Pure system-prompt enhancement
- Can query bonfire async, default to stale cache on timeout

**Hook name:** `bonfire_context_block`

---

## Integration Surface #2: Morning Brief (Brief Intake)

**Impact: P0** - daily 5am cron, feeds agenda, structured intake

**Where:** `bot/src/zoe/brief.ts` (file:line 1-100), `generateMorningBrief()`

**Current flow:**
1. Runs daily 09:00 UTC (5am EST) via scheduler (file:line 60-76)
2. Gathers: open tasks, last 24h commits, open PRs, AgentMail inbox
3. Calls Claude CLI with `BRIEF_SYSTEM_PROMPT`
4. Sends to Zaal's DM via Telegram

**Integration proposal:**
Add Bonfire activity snapshot to brief context:

```typescript
async function generateMorningBrief(opts: { repoDir: string }): Promise<string> {
  const [tasks, commits, prs, inbox] = await Promise.all([...]);
  
  // NEW: pull bonfire overnight activity
  const bonfireActivity = await queryBonfireOvernightSummary();
  // returns: { new_decisions: [], pending_recalls: [], teammate_updates: [] }
  
  const briefContext: BriefContext = {
    today_iso: new Date().toISOString(),
    open_tasks: tasks,
    commits_24h: commits,
    open_prs: prs,
    inbox: inbox,
    bonfire_activity: bonfireActivity,  // NEW
  };
  
  const briefText = await callClaudeCli({...});
  return briefText;
}
```

**Current brief structure (file:line 26-45):**
```
Morning brief - Mon May 04 5am

TOP PRIORITIES (N P0, M P1)
- ...

LAST 24H COMMITS
- ...

OPEN PRS
- ...

INBOX
- ...

portal.zaoos.com/todos - brain dump
```

**Augmented brief:**
```
Morning brief - Mon May 04 5am

BONFIRE OVERNIGHT
- [if any] decisions made, recalls pending, teammate updates

TOP PRIORITIES (N P0, M P1)
- ...
[rest as before]
```

**Budget impact:**
- Brief runs once/day
- Bonfire query: ~1KB result + network latency
- No token cost to ZOE (brief uses Claude CLI in-band)

**Feasibility:** MEDIUM-HIGH
- Requires Bonfire API query wrapper (reusable for #3)
- Brief system prompt already modular
- No memory schema changes

**Hook name:** `bonfire_overnight_intake`

---

## Integration Surface #3: Memory Writes (Mirror to Bonfire)

**Impact: P0** - bidirectional sync, keeps graph authoritative

**Where:** `bot/src/zoe/concierge.ts` (file:line 115-127), after `splitReplyAndOps()`

**Current memory writes:**
1. **Task ops** (file:line 82 in concierge.ts output format)
   - add/update/complete/defer tasks
   - Written to ~/.zao/zoe/tasks.json
   - Source: `bot/src/zoe/tasks.ts` (apply ops)

2. **Quest ops** (file:line 86-92)
   - set_main/add/score/complete/drop/pin side quests
   - Written to ~/.zao/zoe/sidequests.json
   - Source: `bot/src/zoe/sidequests.ts`

3. **Captures** (file:line 94-96)
   - text + topic, logged to ~/.zao/zoe/archive/
   - Used for learning, feeds human.md refresh

**Integration proposal:**
After applying ops locally, fire async writes to Bonfire:

```typescript
export async function runConciergeTurn(opts: ConciergeOptions): Promise<ConciergeResult> {
  // ... existing flow ...
  const { reply, taskOps, questOps, captures } = splitReplyAndOps(result.text);
  
  // Apply to local memory
  await applyTaskOps(taskOps);
  await applyQuestOps(questOps);
  
  // Mirror to Bonfire (fire-and-forget, log errors)
  Promise.all([
    syncTasksToBonfire(taskOps),
    syncQuestsToBonfire(questOps),
    syncCapturesToBonfire(captures),
  ]).catch(err => console.error('[zoe] bonfire sync error:', err));
  
  return { reply, task_ops: taskOps, ... };
}
```

**Bonfire sync protocol:**
- **Tasks:** `POST /bonfire/api/tasks` with { op, task, timestamp, source: 'zoe' }
- **Quests:** `POST /bonfire/api/quests` with { op, id, title, alignment, source: 'zoe' }
- **Captures:** `POST /bonfire/api/captures` with { text, topic, source: 'zoe-dm', created_at }

**Budget impact:**
- Fire-and-forget (no timeout blocking concierge reply)
- One HTTP request per turn type that has ops
- Network: ~100ms each, parallel
- No token cost to ZOE

**Feasibility:** MEDIUM
- Requires Bonfire API endpoints (docs 665, 669)
- Error handling (retry with backoff on 5xx)
- New env var: `BONFIRE_API_URL`, `BONFIRE_API_KEY`

**Load-bearing note:** Tasks/quests are ZOE's ground truth locally. Bonfire is secondary. If bonfire write fails, ZOE still works. Asymmetric: bonfire reads ZOE's state, not vice versa (yet).

**Hook name:** `bonfire_memory_sync`

---

## Integration Surface #4: Scheduler - Hourly Nudges (Read from Bonfire)

**Impact: P1** - nudges already generic, could be smarter

**Where:** `bot/src/zoe/scheduler.ts` (file:line 103-123), hourly cron

**Current nudge logic** `bot/src/zoe/nudges.ts`:
- Reads open task queue
- Picks the next highest-priority item
- Sends to Zaal: "Work on: {task title}"
- If empty, skips

**Integration proposal:**
Before nudge fire, consult Bonfire for "what should Zaal focus on RIGHT NOW":

```typescript
tasks.push(
  cron.schedule(
    '0 * * * *',
    async () => {
      const hour = new Date().getUTCHours();
      if (hour === 9 || hour === 1) return; // dodge brief + reflect
      try {
        if (!(await nudgesEnabled())) return;
        
        // NEW: check bonfire for time-sensitive context
        const bonfireContext = await queryBonfire_HourlyContext();
        // returns: { urgent_recalls_pending, teammate_blockers, time_sensitive_actions }
        
        const nudge = bonfireContext.urgent_recalls_pending?.length > 0
          ? `RECALL: ${bonfireContext.urgent_recalls_pending[0]}`
          : await nextNudge(); // fallback to local task queue
        
        if (!nudge) return;
        await opts.bot.api.sendMessage(opts.zaalTgId, nudge);
      } catch (err) { /* ... */ }
    },
  ),
);
```

**Benefit:** Bonfire can flag "you have 1 hour to respond to X" and ZOE's nudge respects it.

**Feasibility:** LOW-MEDIUM
- Requires Bonfire API for time-sensitive queries (may not exist yet)
- Risk: if Bonfire is down, nudges fall back to local (safe)
- No memory schema changes

**Hook name:** `bonfire_nudge_context`

---

## Integration Surface #5: Posts Scheduler (Read from Bonfire)

**Impact: P1** - posts already pull recent commits + voice memos, could pull bonfire signals

**Where:** `bot/src/zoe/posts/sources.ts` (file:line 12-118), `gatherBuildSignals()` et al

**Current post drafting cycle** (Doc 533, PR #388):
1. Scheduler fires 7 random times/day (file:line 140-145 in scheduler.ts)
2. Per category (build/ecosystem/event/personal), gather source signals:
   - **build:** last 24h git commits, open PRs
   - **ecosystem:** last 7d repo activity
   - **event:** manual event files (today.txt, tomorrow.txt)
   - **personal:** all-repos GitHub activity + voice memos
3. Draft post via Claude CLI (bot/src/zoe/posts/drafters.ts)
4. Send to Zaal in Telegram with APPROVE/SKIP buttons

**Integration proposal:**
Add Bonfire signals to source gathering per category:

```typescript
export async function gatherBuildSignals(repoDir: string): Promise<PostSourceSnapshot['build']> {
  const [recentCommits, openPrs] = await Promise.all([
    getGitActivity(repoDir),
    getGhPrList(),
  ]);
  
  // NEW: pull bonfire-tracked shipping (integrations, partnerships, external announcements)
  const bonfireShipping = await queryBonfire_RecentShipping();
  // returns: { external_announcements: [], partner_releases: [] }
  
  return {
    recentCommits,
    openPrs,
    bonfireShipping,  // NEW - feed to drafter
  };
}

export async function gatherEcosystemSignals(repoDir: string): Promise<PostSourceSnapshot['ecosystem']> {
  // Current: proxy via 7d repo commits
  
  // NEW: real ecosystem signals from Bonfire
  const bonfireActivity = await queryBonfire_EcosystemActivity();
  // returns: { team_wins: [], member_updates: [], project_milestones: [] }
  
  return {
    repoActivity: await getGitActivity(repoDir),
    bonfireActivity,  // NEW - takes priority over repo commits as "real ecosystem"
  };
}
```

**Drafter changes** (bot/src/zoe/posts/drafters.ts file:line 120-150):
- Augment `formatSourceBlock()` to include Bonfire signals
- Coach Claude to pick bonfire signals first ("real ecosystem activity") over git commits

**Feasibility:** MEDIUM
- Requires Bonfire API queries (can fail gracefully)
- Drafters already modular per category
- No memory schema changes, no task ops

**Hook name:** `bonfire_post_signals`

---

## Integration Surface #6: Evening Reflection (Pull + Reflect)

**Impact: P1** - daily reflection cron, can be more contextual

**Where:** `bot/src/zoe/scheduler.ts` (file:line 78-95), `generateEveningReflection()`

**Current:** Runs 01:00 UTC (21:00 EDT, 20:00 EST), sends reflection prompt to Zaal.

**Integration proposal:**
Pull Bonfire state before reflection:

```typescript
async function generateEveningReflection(opts: { repoDir: string }): Promise<string> {
  // Current: git activity, open tasks, etc
  
  // NEW: what changed in Bonfire today?
  const bonfireSnapshot = await queryBonfire_DailySnapshot();
  // returns: { decisions_made: [], actions_completed: [], next_era_preview: [] }
  
  const reflectionContext = {
    work_shipped: await getGitActivity(opts.repoDir),
    bonfire_moves: bonfireSnapshot,  // NEW
    open_tasks: await listOpenTasks(),
  };
  
  const reflection = await callClaudeCli({
    prompt: `Reflect on today (bonfire context included):...`,
    appendSystemPrompt: JSON.stringify(reflectionContext),
  });
  
  return reflection;
}
```

**Feasibility:** MEDIUM
- Requires Bonfire API
- Reflection system prompt already flexible
- No blocker dependencies

**Hook name:** `bonfire_reflection_context`

---

## Integration Surface #7: Concierge Chat Handler (Context Broadening)

**Impact: P2** - nice-to-have, higher system prompt cost

**Where:** `bot/src/zoe/concierge.ts`, any message from Zaal

**Current:** ZOE replies to Zaal's DM using local memory + tools (Read, Grep, Bash git queries).

**Integration proposal:**
If Zaal asks a question that requires graph facts (relationships, cross-project decisions), automatically offer to query Bonfire:

```typescript
if (looksLikeGraphQuery(opts.message)) {
  // e.g. "what's the status of X + Y working together?"
  return {
    reply: `This needs bonfire context. Query: \`/recall <specific question>\`\nI can't directly query bonfire yet, but I can digest what you paste back.`,
    captures: [{
      text: `autodetected graph query need: ${opts.message}`,
      topic: 'bonfire_relay',
    }],
  };
}
```

**Feasibility:** LOW-MEDIUM
- Requires ZOE to detect when it needs bonfire vs local tools
- System prompt cost is significant (per-message penalty)
- Simpler: just document in persona.md that Zaal should use `/recall` manually

**Hook name:** `bonfire_query_relay`

---

## Integration Surface #8: Child Bot Bootloader (Inherit Pattern)

**Impact: P2** - future child bots (Magnetiq, Attabotty, ZAOstock, Devz)

**Where:** `bot/src/zoe/memory.ts` (BOOTLOADER_PATH, file:line 32), `bot/src/zoe/index.ts` (spawn command file:line 25)

**Current bootloader** (persona.md file:line 120-141):
- Persona inherits from ZOE elder template
- Child bots spawn with their own memory dirs
- No bonfire integration yet

**Integration proposal:**
When spawning a child bot, pass bonfire context:

```typescript
// In ZOE's spawn-child command handler
const childBootloader = await buildChildBootloader({
  childName: 'magnetiq_bot',
  parentPersona: await readPersona(),
  bonfireContext: await queryBonfire_ChildBotContext('magnetiq'),
});
// writes to ~/.zao/magnetiq_bot/persona.md with bonfire hooks pre-wired
```

**Feasibility:** LOW (future feature)
- Depends on child bot architecture locking (already done per project memory)
- No blocker on current ZOE work

**Hook name:** `child_bot_bonfire_inheritance`

---

## Top 3 Hook Priorities for Bonfire Dialog

### Priority 1: LLM Dispatch Injection (Surface #1)

**Why:** Every reply goes through the concierge. Bonfire context in system prompt = highest leverage, lowest cost if cached.

**Implementation size:** ~30 lines of code (query helper + 2-line injection in buildSystemBlocks)

**Risk:** Low (pure system-prompt enhancement, fails gracefully)

**Timeline:** 1-2 hours

### Priority 2: Memory Writes Sync (Surface #3)

**Why:** ZOE's decisions are valuable signals for the bonfire graph. Async mirror keeps both in sync.

**Implementation size:** ~50 lines (sync helpers + fire-and-forget calls in runConciergeTurn)

**Risk:** Medium (requires Bonfire API contract, but write failures don't block ZOE)

**Timeline:** 2-4 hours

### Priority 3: Morning Brief Intake (Surface #2)

**Why:** Daily agenda briefing already structured; bonfire activity fits naturally. Single daily point of contact.

**Implementation size:** ~40 lines (query helper + context injection in generateMorningBrief)

**Risk:** Low (optional context block, graceful degradation)

**Timeline:** 1-2 hours

---

## Tool Integration Pattern (from Concierge)

ZOE's LLM dispatch already includes whitelisted tools (file:line 73-95 in concierge.ts):

```
Read, Glob, Grep
Bash(gh issue list*), Bash(gh pr list*)
mcp__playwright__browser_*
```

**Adding Bonfire tools** would follow this pattern:

```typescript
allowedTools: [
  // existing tools...
  'Bonfire(recall_query)',      // async Bonfire graph query
  'Bonfire(memory_snapshot)',   // pull raw graph state
],
```

This allows ZOE to directly query Bonfire mid-turn (not just in system prompt), enabling dynamic context retrieval on demand.

---

## Reference: File Locations

| Component | Path | Lines |
|-----------|------|-------|
| Main entry | bot/src/zoe/index.ts | 1-150 |
| Concierge (LLM dispatch) | bot/src/zoe/concierge.ts | 1-170 |
| Memory blocks | bot/src/zoe/memory.ts | 1-300 |
| Scheduler (crons) | bot/src/zoe/scheduler.ts | 1-157 |
| Morning brief | bot/src/zoe/brief.ts | 1-150 |
| Posts sources | bot/src/zoe/posts/sources.ts | 1-150 |
| Posts drafters | bot/src/zoe/posts/drafters.ts | 1-150 |
| Types | bot/src/zoe/types.ts | 1-129 |
| Claude CLI wrapper | bot/src/hermes/claude-cli.ts | 37-187 |
