---
topic: agents
type: decision
status: specification
last-validated: 2026-05-18
tier: STANDARD
parent: 668
related-docs: 665, 547, 435, 245, 464, 289
---

# 668b - ZOE Memory Architecture Upgrade Path (May 2026)

**Goal:** Map ZOE's current 8-turn ring buffer limit to concrete 3-tier upgrade paths, with file paths, LoC estimates, and risk analysis.

**Current State:** ZOE (infra/portal/bin/bot.mjs) has:
- `~/.cache/zoe-telegram/conv-<chatId>.json` ring buffer (20 turns max, line 31: CONV_TURN_LIMIT)
- 7-day recent tips cache in system prompt (loadRecentTips)
- No per-message archive or context persistence beyond current session

**Problem:** Conversations older than 20 turns are lost. ZOE can't reference patterns from prior days. No audit trail.

---

## Current Architecture (Lines 54-73, 362-485)

```
loadConversation(chatId) -> read conv-<chatId>.json
appendConversation(chatId, userMsg, botReply) -> slice(-CONV_TURN_LIMIT)
                                                -> write back conv-<chatId>.json
loadSystemPrompt(chatId) -> build prompt with:
  - SOUL.md, USER.md, AGENTS.md, MEMORY.md (static files)
  - Recent tips (loadRecentTips) from ~/.cache/zoe-learning-pings/sent.json
  - Last 20 turns from conv-<chatId>.json
  - Current date/time
```

**Storage Pattern:**
```
~/.cache/zoe-telegram/
├── conv-<chatId>.json        # {turns: [{t, user, bot}, ...]} (max 20)
├── ship-rate.json
├── muted-docs.json
└── watched-sessions.json
```

---

## TIER 1 - Append-Only Conversation Logs

**Effort:** 25 LoC. **Risk:** Very low. **ROI:** Fixes audit trail + enables migration path.

### What It Does
- Every call to `appendConversation()` ALSO writes to `~/.cache/zoe-telegram/archive/<chatId>-<yyyy-mm>.jsonl`.
- Ring buffer stays at 20 turns (no perf impact).
- Archive is append-only (can't corrupt existing data).

### File Paths to Touch
1. `/Users/zaalpanthaki/Documents/ZAO OS V1/infra/portal/bin/bot.mjs` (lines 62-73)
2. Add new function `archiveConversation(chatId, turn)` (~15 LoC)
3. Call from `appendConversation()` after buffer write (~5 LoC)

### Code Sketch
```javascript
// NEW (after appendConversation)
function archiveConversation(chatId, turn) {
  try { mkdirSync(CONV_DIR + "/archive", { recursive: true }); } catch {}
  const date = new Date().toISOString().slice(0, 7);  // yyyy-mm
  const archiveFile = CONV_DIR + "/archive/" + chatId + "-" + date + ".jsonl";
  const line = JSON.stringify(turn) + "\n";
  try { appendFileSync(archiveFile, line); }
  catch (e) { console.error("Archive write error:", e.message); }
}

// MODIFY appendConversation (line 66)
const turn = {
  t: new Date().toISOString(),
  user: String(userMsg || "").slice(0, 2000),
  bot: String(botReply || "").slice(0, 800),
};
// ... after buffer slice(-CONV_TURN_LIMIT)
archiveConversation(chatId, turn);  // NEW LINE
```

### Pros
- Minimal code change
- No API deps, no new infra
- Immediate audit trail
- Foundation for Tier 2

### Cons
- Truncation issue NOT fixed (only new turns logged)
- Can't search/query historical data
- Need manual post-processing to make archive useful

### Migration Path
- Runs in parallel with Tier 2 (implement both, use T1 as fallback)
- Archive format is JSON Lines (.jsonl) — standard, queryable by `jq`

### Testing
```bash
# Manual: send 3 messages, check file was created
tail ~/.cache/zoe-telegram/archive/<chatId>-2026-05.jsonl
# Should see 3 JSON objects, one per line
```

---

## TIER 2 - Bonfires Knowledge Engine (kEngram per Session)

**Effort:** 60 LoC + API setup. **Risk:** Low (Bonfires read-only in Phase 1). **ROI:** Searchable history + session-scoped context.

### What It Does
- Each day (or session), call `bonfire kengram batch` to ingest that day's archive into Bonfires.
- ZOE queries Bonfires for context instead of relying on 20-turn window.
- kEngram = content-addressed merkle proof of conversation (immutable + dedup).

### Dependencies
- Bonfires API key (already in use per doc 547, env: BONFIRE_API_KEY)
- `pip install bonfires` on VPS (or use existing if already installed)
- `bonfires` CLI or SDK

### File Paths to Touch
1. `infra/portal/bin/bot.mjs` (lines 448-487, add to loadSystemPrompt)
2. `infra/portal/bin/bot.mjs` (new function ~20 LoC: `queryBonfireHistory`)
3. New cron script `infra/portal/bin/archive-to-bonfire.sh` (~30 LoC)

### Code Sketch
```javascript
// NEW in bot.mjs (inside loadSystemPrompt, around line 472)
async function queryBonfireHistory(chatId, query, limit = 5) {
  if (!process.env.BONFIRE_API_KEY || !process.env.BONFIRE_API_URL) return null;
  try {
    const res = await fetch(process.env.BONFIRE_API_URL + "/kg/search", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.BONFIRE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "conversation: " + chatId + " AND " + query,
        limit: limit,
      }),
    });
    if (!res.ok) return null;
    const { entities } = await res.json();
    return entities?.map(e => "- " + e.title + ": " + e.description).join("\n") ?? null;
  } catch (e) {
    console.error("Bonfire history query failed:", e.message);
    return null;
  }
}

// MODIFY loadSystemPrompt (line 483)
let contextFromBonfire = null;
if (process.env.BONFIRE_API_KEY && chatId) {
  contextFromBonfire = await queryBonfireHistory(chatId, "recent questions", 3);
}
if (contextFromBonfire) {
  prompt += "\n---\n\nCONTEXT FROM YOUR CONVERSATION HISTORY (Bonfire kEngram):\n" + contextFromBonfire;
}
```

### Cron Script (daily at 1am ET)
```bash
#!/bin/bash
# infra/portal/bin/archive-to-bonfire.sh
CONV_DIR="$HOME/.cache/zoe-telegram"
ARCHIVE_DIR="$CONV_DIR/archive"
[ -d "$ARCHIVE_DIR" ] || exit 0

# For each .jsonl file from yesterday, batch-ingest to Bonfire
YESTERDAY=$(date -d "1 day ago" +%Y-%m)
for f in "$ARCHIVE_DIR"/*-$YESTERDAY.jsonl; do
  [ -f "$f" ] || continue
  echo "Ingesting $(basename "$f") to Bonfire..."
  bonfires kengram batch --file "$f" --to "$BONFIRE_KG_ID" --sync || echo "Failed: $f"
done
```

### Env Vars Needed
```bash
# ~/.env.portal (add to existing)
BONFIRE_API_URL=https://tnt-v2.api.bonfires.ai
BONFIRE_API_KEY=sk-... (already present from doc 547)
BONFIRE_KG_ID=<genesis-tier-kg-id>  # Get from Bonfires dashboard
```

### Pros
- Solves truncation problem (can query any day, any topic)
- Immutable audit trail (merkle proof)
- Searchable, tagged, deduplicated
- ZOE gets situational awareness across months

### Cons
- Requires Bonfires SDK + active API key
- Adds ~0.5s per response (cache layer needed)
- Tier 2 depends on Tier 1 (archive format is kEngram input)
- If Bonfires API is down, fallback to ring buffer only

### Cache Layer (Cost Control)
```javascript
const bonfireCache = new Map();
const BONFIRE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

async function queryBonfireHistoryCached(chatId, query) {
  const key = chatId + ":" + query;
  const cached = bonfireCache.get(key);
  if (cached && Date.now() - cached.at < BONFIRE_CACHE_TTL_MS) {
    return cached.result;
  }
  const result = await queryBonfireHistory(chatId, query);
  bonfireCache.set(key, { result, at: Date.now() });
  return result;
}
```

### Testing
```bash
# Send a message
# Check archive was created: ls ~/.cache/zoe-telegram/archive/
# Run cron script manually: bash infra/portal/bin/archive-to-bonfire.sh
# Query Bonfire dashboard: docs ingested should appear
# Next message from ZOE: context should include "(from Bonfire history)"
```

---

## TIER 3 - Bonfires as Primary Working Memory

**Effort:** 180 LoC + architecture refactor. **Risk:** Medium (state mutation risk). **ROI:** Agent-native memory layer, no local FS.

### What It Does
- Replace ring buffer with Bonfires kEngram as primary (not fallback).
- At turn-start: fetch `<working_memory>` from Bonfires query.
- At turn-end: write turn to Bonfires (not just archive).
- The 4-block model (persona, human, tasks, working_memory) becomes Bonfires-native.

### Architecture Shift
```
BEFORE (Tier 2):
  loadSystemPrompt() -> static files + ring buffer + archive fallback

AFTER (Tier 3):
  loadSystemPrompt() -> static files + Bonfires query (primary) + ring buffer (ephemeral)
  appendConversation() -> write to Bonfires (primary) + ring buffer (for 20-turn context window)
```

### File Paths to Touch
1. `infra/portal/bin/bot.mjs` (refactor loadSystemPrompt, lines 448-487)
2. `infra/portal/bin/bot.mjs` (refactor appendConversation, lines 62-73)
3. New module `infra/portal/lib/bonfire-memory.mjs` (~80 LoC)
4. `.env.portal` (add Bonfires config, already in Tier 2)

### Code Sketch
```javascript
// NEW: infra/portal/lib/bonfire-memory.mjs
export async function readWorkingMemory(chatId) {
  if (!process.env.BONFIRE_API_KEY) return null;
  const res = await fetch(process.env.BONFIRE_API_URL + "/kg/search", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.BONFIRE_API_KEY}` },
    body: JSON.stringify({ query: `conversation:${chatId} type:working_memory`, limit: 1 }),
  });
  const data = await res.json();
  return data.entities?.[0]?.content ?? null;
}

export async function writeWorkingMemory(chatId, turn) {
  if (!process.env.BONFIRE_API_KEY) return false;
  const res = await fetch(process.env.BONFIRE_API_URL + "/kg/nodes", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.BONFIRE_API_KEY}` },
    body: JSON.stringify({
      type: "turn",
      title: `Turn ${turn.seq} - ${turn.t}`,
      content: JSON.stringify({ user: turn.user, bot: turn.bot }),
      metadata: { chat_id: chatId, seq: turn.seq },
    }),
  });
  return res.ok;
}

// MODIFY bot.mjs: loadSystemPrompt (async now)
async function loadSystemPrompt(chatId) {
  let prompt = ""; // ... existing static files ...
  
  // NEW: query Bonfire for recent context (primary memory)
  if (process.env.BONFIRE_API_KEY) {
    try {
      const workingMemory = await readWorkingMemory(chatId);
      if (workingMemory) {
        prompt += "\n---\n\nWORKING MEMORY (from Bonfires):\n" + workingMemory;
      }
    } catch (e) {
      console.error("Bonfire read failed, using ring buffer:", e.message);
      // Fallback to ring buffer (existing code path)
    }
  }
  
  // Fallback: ring buffer (ephemeral context window)
  const conv = loadConversation(chatId); // Still populated, used as recent cache
  if (conv.length) {
    prompt += "\n---\n\nRECENT BUFFER (last " + conv.length + " turns):\n"
      + conv.map(t => "Zaal: " + t.user + "\nZOE: " + t.bot).join("\n\n");
  }
  
  return prompt;
}

// MODIFY appendConversation: also write to Bonfire
async function appendConversation(chatId, userMsg, botReply) {
  const turn = { t: new Date().toISOString(), user: userMsg, bot: botReply };
  
  // Keep ring buffer (local cache)
  const prior = loadConversation(chatId);
  const turns = prior.concat([turn]).slice(-CONV_TURN_LIMIT);
  try { writeFileSync(CONV_DIR + "/conv-" + chatId + ".json", JSON.stringify({ turns }, null, 2)); }
  catch (e) {}
  
  // NEW: write to Bonfires (primary)
  if (process.env.BONFIRE_API_KEY) {
    try {
      await writeWorkingMemory(chatId, { ...turn, seq: turns.length });
    } catch (e) {
      console.error("Bonfire write failed (continuing with ring buffer):", e.message);
    }
  }
}
```

### Timeout & Resilience
```javascript
// Wrapper with 2-second timeout
async function withTimeout(promise, ms = 2000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// In loadSystemPrompt:
try {
  const workingMemory = await withTimeout(readWorkingMemory(chatId), 2000);
  // ...
} catch (e) {
  if (e.message === "timeout") console.warn("Bonfire slow, using ring buffer");
  // Fallback applies
}
```

### Pros
- No truncation issue (Bonfires is primary)
- True agent memory (each turn is a node, queryable)
- Scales to 1000s of turns without perf hit
- Multi-session context (can query across chats)

### Cons
- Async refactor (loadSystemPrompt becomes async, ripple effects)
- Bonfires API dependency (harder to debug offline)
- Need to handle sync failures gracefully
- More LoC, more state mutation surface

### Migration Path (Tier 1 → 2 → 3)
1. **Week 1 (Tier 1):** Archive logs, validate format
2. **Week 2 (Tier 2):** Ingest archive to Bonfires nightly, add read-path
3. **Week 3 (Tier 3):** Make Bonfires primary, ring buffer ephemeral

### Testing
```bash
# Day 1: send 5 messages, all stored in Bonfires + ring buffer
# Day 2: clear ring buffer (rm ~/.cache/zoe-telegram/conv-*.json)
# Day 3: send a question that requires context from Day 1
# Verify: ZOE answers correctly using Bonfire history (not ring buffer)
```

---

## Missing Projects Context (for human.md / persona.md)

ZOE flagged 4 missing entries. Shape for each:

### 1. Infanity
- What: [awaiting research]
- Owned by: [?]
- Link: [?]
- Why ZOE needs it: [?]

### 2. SongJam
- What: ZAO-backed community music jam token + DAO
- Owned by: [?]
- Link: github.com/bettercallzaal/songjam (if exists)
- Why ZOE needs it: Query patterns like "when is SongJam DAO vote" or "SongJam token supply"

### 3. Ansuz
- What: [awaiting research]
- Owned by: [?]
- Link: [?]
- Why ZOE needs it: [?]

### 4. Recoup
- What: Learning platform / recovery protocol [awaiting details]
- Owned by: [?]
- Link: [?]
- Why ZOE needs it: Might receive queries like "what's Recoup teach about X"

**Action:** Doc these in `~/.openclaw-workspace/human.md` with one-line entries:
```markdown
### Projects & Brands
- **SongJam:** Community token + DAO for music coordination ($SANG on Base). [Link when ready]
- **Infanity:** [Description needed — ask Zaal]
- **Ansuz:** [Description needed — ask Zaal]
- **Recoup:** Learning platform for [domain]. [Description needed]
```

---

## Truncation Problem (ZOE's Own Output Loss)

**Current Issue:** ZOE's output at [00:17] and [09:36] from earlier in this session are gone from her window.

**Solution:**
- **Tier 1:** Archive those outputs to .jsonl immediately (no help for current session, helps next one)
- **Tier 2:** Query Bonfires for them (they exist if archive was ingested)
- **Tier 3:** Bonfires is primary, so own outputs are stored at write-time

**Recommendation:** Implement Tier 1 + 2 in parallel. Don't wait for Tier 3 async refactor if urgency is high.

---

## Verdict: Implementation Order

**Week 1 (SHIP TODAY):**
- Tier 1: append-only logs (25 LoC, zero risk)
- Add 4 missing projects to human.md

**Week 2 (SHIP THIS WEEK):**
- Tier 2: Bonfires read-path + daily cron ingest (60 LoC, low risk, enables search)
- Test: ask ZOE about context from 3 days ago

**Week 3+ (DEPENDS ON RYAN'S SDK):**
- Tier 3: Only if Ryan's Bonfires SDK is production-ready AND async refactor is safe
- Otherwise: stay on Tier 2 (read-only Bonfires query + ring buffer)

**Fallback:** If Bonfires API is unreliable or down, Tier 1 + 2 degrade gracefully to ring buffer (20 turns).

---

## Risk Summary

| Tier | Failure Mode | Blast Radius | Mitigation |
|------|--------------|--------------|------------|
| 1 | Archive file write fails | Silent loss of single turn | Catch + log, ring buffer unaffected |
| 2 | Bonfires API down | Can't query history, use ring buffer | 2s timeout, fallback to T1 |
| 2 | Cost runaway | $5-20/month in queries | 10-min cache layer, 3 query limit |
| 3 | Async mutation race | Turn lost or duplicated | Write idempotent (use turn UUID), add lock |
| 3 | Ring buffer + Bonfires diverge | Conflicting context | Primary-replica pattern: Bonfire is source |

---

## Key File Paths (Absolute)

```
/Users/zaalpanthaki/Documents/ZAO OS V1/infra/portal/bin/bot.mjs
  - Line 54-73: loadConversation / appendConversation (MODIFY for T1, T2, T3)
  - Line 448-487: loadSystemPrompt (MODIFY for T2, T3)

/Users/zaalpanthaki/Documents/ZAO OS V1/infra/portal/bin/archive-to-bonfire.sh
  - NEW (30 LoC) - daily cron, Tier 2

/Users/zaalpanthaki/Documents/ZAO OS V1/infra/portal/lib/bonfire-memory.mjs
  - NEW (80 LoC) - Bonfire read/write, Tier 3

/Users/zaalpanthaki/Documents/ZAO OS V1/.openclaw-workspace/human.md
  - ADD: 4 missing projects (SongJam, Infanity, Ansuz, Recoup)
```

---

## Related Work

- **Doc 665:** Bonfires knowledge engine (ZOE query pattern)
- **Doc 547:** Multi-agent coordination (Hermes + Bonfire integration)
- **Doc 435:** ZOE effectiveness v2 (context-aware upgrade list)
- **Doc 464:** ZOE reply context (sent.json cache bug root cause)
- **Doc 289:** ZOE dashboard UX (visualization of memory layers)

---

**Specification complete. Ready for implementation sync.**
