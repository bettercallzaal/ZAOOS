---
topic: technology, ZOL, ZOE, agents
type: implementation-brief
status: DECISION NEEDED — 4 questions for Zaal before implementation can start
last-validated: 2026-07-18
related-docs: 1527-zoe-work-loop-dreamloop-port, 1512-zol-dreamloops-weekly-curator-artist-spotlight
board-tasks: 85d6860b (Keystone 3 implementation)
source: ZOL PR #40 DRAFT (docs/zol-keystone3-zoe-intent-bridge-design-v1.md, 2026-07-17)
action-owner: Zaal (answer Q1-Q4); Hurricane/Brandon (implement after gate clears)
---

# 1545 — ZOL Keystone 3: ZOE→ZOL Intent Bridge — Implementation Readiness Brief

> **What this is:** ZOE (the VPS concierge bot) and ZOL (the Pi music agent) don't talk to each other today. Keystone 3 adds the bridge: when Zaal sends a music or curation intent via Telegram, ZOE routes it to a ZOL DreamLoop instead of handling it locally. This brief distills the existing ZOL PR #40 design into what Zaal needs to decide + what gets built.

---

## The Gap Today

```
Telegram → ZOE (VPS, zao-os/bot)
               └─ topic-router.ts → {research, coding, capture, draft, chat}
               └─ no ZOL path

Pi (ansuz) → ZOL (@zolbot)
               └─ 72 DreamLoops (music-scout, artist-context, weekly-curator, …)
               └─ no trigger from ZOE
```

ZOE and ZOL share one channel already: the **ZAOcowork Supabase board**. Keystone 3 uses that as the message bus.

---

## The Bridge (Option A — Recommended)

```
Zaal sends: "scout new music artists on Farcaster"
  ↓
ZOE classifies intent → "music-scout"
ZOE creates board task: {
  title: "ZOL: music-scout (from Zaal via ZOE)",
  metadata: { intent_type: "music-scout", loop: "music-scout-v1", inputs: {} }
}
ZOE replies: "Queued for ZOL — result in ~15 min"
  ↓  (~15 min)
ZOL's detect-work-intent DreamLoop polls board
ZOL claims task (conditional PATCH prevents race)
ZOL runs music-scout-v1 DreamLoop
ZOL writes result to board task notes
ZOL (optionally) notifies Zaal via Telegram
```

**Why Supabase as bus?**
- Both systems already have `COWORK_TRACKER_URL` + `COWORK_TRACKER_KEY`
- No new infrastructure
- Full audit trail (every intent is a board row)
- Survives Pi restart (task stays on board until claimed)
- ~15 min latency is fine for music/curation (not time-critical)

---

## What Gets Built (After Gates Clear)

### ZOE Side — `zao-os/bot/src/zoe/intent-router.ts` (~1 day, Hurricane)

New file. Three functions:

**1. `classifyZolIntent(messageText, topicName)` → `ZolIntent | null`**

Regex-based classifier. Returns null if ZOE should handle it locally:

| User message | Intent |
|-------------|--------|
| "scout new music artists" | `music-scout` |
| "artist context @username" | `artist-context` (with handle) |
| "cite https://..." | `source-citation` (with URL) |
| "what do you know about X" | `query-memory` (with query) |
| "weekly curator run" | `weekly-curator` |
| Everything else | `null` (ZOE handles) |

**2. `intentToLoop(intent)` → `{ loop, inputs }`**

Maps intent to ZOL DreamLoop name:

| Intent | ZOL Loop |
|--------|----------|
| `music-scout` | `music-scout-v1` |
| `artist-context` | `artist-context-v1` |
| `weekly-curator` | `weekly-curator-v1` |
| `source-citation` | `source-citation-v1` |
| `query-memory` | `source-citation-v1` (nearest proxy) |

**3. `dispatchToZol(intent)` → board task create**

Creates a board task with `metadata.intent_type` set. ZOE replies with queued confirmation.

**Wiring in `zao-os/bot/src/index.ts`:**
```typescript
import { classifyZolIntent, intentToLoop } from './zoe/intent-router';
const zolIntent = classifyZolIntent(messageText, topicName);
if (zolIntent) {
  const { loop, inputs } = intentToLoop(zolIntent);
  await tracker.createTask({
    title: `ZOL: ${zolIntent.kind} (from Zaal via ZOE)`,
    category: 'engineering', priority: 'P2',
    metadata: { intent_type: zolIntent.kind, loop, inputs,
                zoe_thread_id: message.message_thread_id, requested_by: 'zaal' }
  });
  await bot.sendMessage(chatId, `Queued for ZOL: ${zolIntent.kind}. ~15 min.`);
}
```

### ZOL Side — `board.zol-intent.claim` handler (~0.5 day, whoever owns ZOL)

New handler in `src/handlers/index.js`. Added to `detect-work-intent` loop:

```javascript
'board.zol-intent.claim': async function({ state, signal }) {
  // Read unclaimed ZOL intents from board
  const tasks = await coworkTracker.listTasks({
    filter: "metadata->>intent_type.not.is.null",
    status: 'todo'
  });
  for (const task of tasks) {
    const claimed = await coworkTracker.claimTask(task.id); // conditional PATCH
    if (!claimed) continue; // race condition — another instance got it
    const { loop, inputs } = task.metadata;
    const runner = new DreamLoopRunner(state, handlers);
    const result = await runner.run(loop, inputs, { signal });
    await coworkTracker.updateTask(task.id, {
      status: 'done',
      notes: JSON.stringify(result, null, 2)
    });
  }
}
```

---

## 4 Questions for Zaal (Blocking Implementation)

**Q1 — Latency: Is 15 min acceptable?**

Option A (Supabase bus) gives ~15 min latency. This is fine for music scouting, citation, curator runs. But if Zaal needs artist context lookups in real-time during a live music session, Option B (SSH tunnel to Pi) gives synchronous response.

→ **If 15 min is fine: Option A only (simpler)**  
→ **If real-time is needed for some intents: Option B also needed (more infra)**

**Q2 — ZOE topic routing: Expand existing ZOL topic or add new classifier?**

`topic-router.ts` currently has cases: `research`, `coding`, `capture`, `draft`, `chat`. There's already a `ZOL` topic case. Should the intent classifiers live inside the existing `ZOL` topic, or should `classifyZolIntent()` run across all topics (so "scout music" in any topic gets routed)?

→ **Recommendation: run classifier across all topics** — music scout in the "chat" topic should still route to ZOL.

**Q3 — Result notification: Which bot notifies Zaal when ZOL finishes?**

When ZOL completes a dispatched loop (~15 min later), should it:
- **Option 3A:** Post result in Zaal's Telegram thread via the ZOE bot (requires ZOE to poll the board for its own dispatched tasks)
- **Option 3B:** ZOL sends a new Telegram message directly (using its own bot token)
- **Option 3C:** No notification — Zaal checks the board manually

→ **Recommendation: Option 3B** — ZOL already has `farcaster.read` + `message.classify` handlers; adding a TG send is natural. ZOE doesn't need to poll.

**Q4 — Pi SSH access from VPS (for Option B readiness):**

For Option B (real-time), the VPS needs SSH access to the Pi. Is this already set up (`~/.ssh/authorized_keys` on ansuz includes the VPS key)? If not, document the key setup for the fleet standard.

→ **If Option A is the only path needed: skip Q4**

---

## Implementation Gates (do not implement until ALL clear)

- [ ] ZOL PRs #26-#39 merged to main (v2 PRs — agent-gateway, capsules, loops)
- [ ] ZOL agent-gateway confirmed running on Pi: `curl localhost:8089/health → {"ok":true}`
- [ ] ZOL PR #61 merged (activates weekly-curator + artist-spotlight loops)
- [ ] Zaal answers Q1-Q4 above
- [ ] Brandon reviews design (per ZOL PR #40 which is DRAFT awaiting review)

**Current status:** PRs #26-#39 not yet merged. ZOL PR #61 is the priority (DreamLoops activation). Keystone 3 follows after ZOL v2 fully lands.

---

## Security Invariants (Unchanged by This Bridge)

1. **No ungated public posting.** ZOL's ApprovalBridge still gates any Farcaster cast. The bridge dispatches loops — loops still require Telegram approval for outbound actions.
2. **No wallet or signer access.** No ZOL intent type triggers financial or signing actions.
3. **Telegram remains the sole authority gate.** ZOE classifies + dispatches. ZOL executes within its existing gates.
4. **Board task as idempotency key.** Board task ID = `idempotencyKey` for ZOL work packet. Prevents duplicate execution if ZOE sends the same intent twice.
5. **No secrets in payloads.** Board task `metadata.inputs` contains handles, URLs, queries only — never tokens or keys.

---

## Relationship to Doc 1527 (ZOE Work-Loop DreamLoop Port)

Doc 1527 proposed porting the ZOE work-loop to DreamLoop manifests. Keystone 3 is orthogonal: it adds a ZOL dispatch path to ZOE's *existing* intent handling, not to the work-loop itself. Both can land independently.

**Order of operations:**
1. ZOL PR #61 merges → activates weekly-curator + artist-spotlight on Pi
2. ZOL PRs #26-#39 merge → v2 agent-gateway live on Pi
3. Keystone 3 lands → ZOE can route to ZOL DreamLoops via board bus
4. Doc 1527 Phase 2 → ZOE work-loop itself becomes a DreamLoop (separate track)

---

## Time Estimate

| Component | Owner | Time (after gates clear) |
|-----------|-------|--------------------------|
| `intent-router.ts` (classifyZolIntent + intentToLoop) | Hurricane | ~3 hours |
| Wiring in `index.ts` | Hurricane | ~1 hour |
| `board.zol-intent.claim` ZOL handler | ZOL maintainer | ~2 hours |
| `detect-work-intent` manifest update | ZOL maintainer | ~1 hour |
| Integration test (ZOE sends intent → board → ZOL claims) | Either | ~2 hours |
| **Total** | | **~1.5 days** |

---

## Sources

- ZOL PR #40 DRAFT: `docs/zol-keystone3-zoe-intent-bridge-design-v1.md` (2026-07-17, Brandon spec)
- Board task 85d6860b (Keystone 3 board entry, ZAOcowork)
- ZAOOS doc 1527 (ZOE work-loop DreamLoop port, PR #2222)
- ZAOOS doc 1512 (ZOL DreamLoops activation record + Pi checklist, PR #2202)
- ZOL branch `ws/v2-keystone3-bridge-design` (full design source)
