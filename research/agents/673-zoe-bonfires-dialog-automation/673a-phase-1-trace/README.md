---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: 650, 665, 668, 669, 673
tier: STANDARD
parent-doc: 673
---

# ZAOcoworkingBot v0.3.0 Phase 1: Data Flow to ZABAL Bonfire

## Overview

ZAOcoworkingBot v0.3.0 integrates with ZABAL Bonfire (zabal.bonfires.ai) via a **fire-and-forget hook** that enqueues action-tracker mutations to a local JSONL retry spool, then POSTs changesets to the Bonfires kEngram API. The bot remains fully functional if Bonfire is unconfigured; the integration is a pure aggregation layer. This trace documents the exact path from Telegram command to kEngram nodes/edges.

## 1. Trigger Lifecycle

**Entry point:** Slash command in Telegram group  
**Path:** Command handler (e.g., `/add`, `/done`) -> `mutateActions()` SHA-dance write -> `fireBonfire()` hook -> async `bonfireHook()` enqueue and POST.

### Command Examples (8 total ops)

| Op | Command | Entry | Result Call | Line |
|----|---------|-------|-------------|------|
| add | `/add Fix memory leak` | `cmdAdd(ctx, args)` | `fireBonfire('add', result, ctx)` | [203](file:///tmp/bonfire-build/agent/src/commands.ts#L203) |
| wip | `/wip 42` | `cmdWip(ctx, args)` -> `applyStatusCommand()` | `fireBonfire('wip', result, ctx)` | [239](file:///tmp/bonfire-build/agent/src/commands.ts#L239) |
| blocked | `/blocked 42 waiting for API key` | `cmdBlocked(ctx, args)` -> `applyStatusCommand()` | `fireBonfire('blocked', result, ctx, {reason})` | [239](file:///tmp/bonfire-build/agent/src/commands.ts#L239) |
| done | `/done 42` | `cmdDone(ctx, args)` -> `applyStatusCommand()` | `fireBonfire('done', result, ctx)` | [239](file:///tmp/bonfire-build/agent/src/commands.ts#L239) |
| assign | `/assign 42 Iman` | `cmdAssign(ctx, args)` | `fireBonfire('assign', result, ctx, {previousOwner})` | [288](file:///tmp/bonfire-build/agent/src/commands.ts#L288) |
| setdue | `/setdue 42 2026-05-28` | `cmdSetDue(ctx, args)` | `fireBonfire('setdue', result, ctx, {previousDue})` | [331](file:///tmp/bonfire-build/agent/src/commands.ts#L331) |
| setnote | `/setnote 42 blocked on Neynar review` | `cmdSetNote(ctx, args)` | `fireBonfire('setnote', result, ctx)` | [369](file:///tmp/bonfire-build/agent/src/commands.ts#L369) |
| setprio | `/setprio 42 P1` | `cmdSetPrio(ctx, args)` | `fireBonfire('setprio', result, ctx, {previousPriority})` | [403](file:///tmp/bonfire-build/agent/src/commands.ts#L403) |

### Not Triggering Bonfire

Group mentions to the bot (e.g., `@ZAOcoworkingBot update X`) call the LLM concierge path in `index.ts` which synthesizes suggestions but **does NOT call `fireBonfire()` directly**. The LLM can emit `SuggestActionOp` JSON which the bot then executes (and fires bonfire), but the mention itself does not trigger Bonfire.

## 2. kEngram Payloads: All 8 Ops

Each operation converts to a BonfireChangeset (nodes + edges) via `eventToChangeset()` [bonfire.ts:51](file:///tmp/bonfire-build/agent/src/teams/bonfire.ts#L51). Below are the exact JSON shapes as they land in the spool and POST to the API.

### 2.1 `add`: Create a new todo

**Trigger:** `/add Fix memory leak`  
**ActionItem created:**
```json
{
  "id": "137",
  "title": "Fix memory leak",
  "owner": "Iman",
  "status": "TODO",
  "priority": "P2",
  "category": "backend",
  "due": "",
  "notes": "",
  "createdBy": "Iman",
  "createdAt": "2026-05-18T14:32:01.000Z",
  "updatedAt": "2026-05-18T14:32:01.000Z",
  "completedAt": "",
  "completedBy": ""
}
```

**kEngram changeset [bonfire.ts:60-71]:**
```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:137",
      "summary": "Fix memory leak",
      "labels": ["Todo", "Open", "ZAO", "backend", "P2"]
    }
  ],
  "edges": [
    {
      "source": "todo:137",
      "target": "Iman",
      "name": "CREATED_BY",
      "fact": "2026-05-18T14:32:01.000Z"
    },
    {
      "source": "todo:137",
      "target": "ZAO",
      "name": "BELONGS_TO"
    },
    {
      "source": "todo:137",
      "target": "Iman",
      "name": "ASSIGNED_TO"
    }
  ]
}
```

### 2.2 `wip`: Mark in-progress

**Trigger:** `/wip 137`  
**Updated ActionItem:** `status: TODO -> WIP`

**kEngram changeset [bonfire.ts:74-83]:**
```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:137:wip:2026-05-18T14:35:22.000Z",
      "summary": "Marked in-progress at 2026-05-18T14:35:22.000Z",
      "labels": ["TodoEvent", "InProgress", "ZAO"]
    }
  ],
  "edges": [
    {
      "source": "todo:137:wip:2026-05-18T14:35:22.000Z",
      "target": "todo:137",
      "name": "UPDATES"
    },
    {
      "source": "todo:137:wip:2026-05-18T14:35:22.000Z",
      "target": "Iman",
      "name": "DONE_BY",
      "fact": "2026-05-18T14:35:22.000Z"
    }
  ]
}
```

### 2.3 `blocked`: Mark blocked with reason

**Trigger:** `/blocked 137 waiting for Neynar API key`  
**Updated ActionItem:** `status: WIP -> BLOCKED`, notes prepended

**kEngram changeset [bonfire.ts:85-94]:**
```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:137:blocked:2026-05-18T14:36:10.000Z",
      "summary": "Marked BLOCKED at 2026-05-18T14:36:10.000Z: waiting for Neynar API key",
      "labels": ["TodoEvent", "Blocked", "ZAO"]
    }
  ],
  "edges": [
    {
      "source": "todo:137:blocked:2026-05-18T14:36:10.000Z",
      "target": "todo:137",
      "name": "UPDATES"
    },
    {
      "source": "todo:137:blocked:2026-05-18T14:36:10.000Z",
      "target": "Iman",
      "name": "DONE_BY",
      "fact": "2026-05-18T14:36:10.000Z"
    }
  ]
}
```

### 2.4 `done`: Mark complete

**Trigger:** `/done 137`  
**Updated ActionItem:** `status: BLOCKED -> DONE`, `completedAt`, `completedBy` set

**kEngram changeset [bonfire.ts:96-105]:**
```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:137:done:2026-05-18T14:37:05.000Z",
      "summary": "Completed at 2026-05-18T14:37:05.000Z",
      "labels": ["TodoEvent", "Done", "ZAO"]
    }
  ],
  "edges": [
    {
      "source": "todo:137:done:2026-05-18T14:37:05.000Z",
      "target": "todo:137",
      "name": "COMPLETES"
    },
    {
      "source": "todo:137:done:2026-05-18T14:37:05.000Z",
      "target": "Iman",
      "name": "COMPLETED_BY",
      "fact": "2026-05-18T14:37:05.000Z"
    }
  ]
}
```

### 2.5 `assign`: Reassign owner

**Trigger:** `/assign 137 Zaal`  
**Updated ActionItem:** `owner: Iman -> Zaal`

**kEngram changeset [bonfire.ts:107-120]:**
```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:137:assigned:2026-05-18T14:38:45.000Z",
      "summary": "Assigned to Zaal at 2026-05-18T14:38:45.000Z",
      "labels": ["TodoEvent", "Assignment", "ZAO"]
    }
  ],
  "edges": [
    {
      "source": "todo:137:assigned:2026-05-18T14:38:45.000Z",
      "target": "todo:137",
      "name": "UPDATES"
    },
    {
      "source": "todo:137:assigned:2026-05-18T14:38:45.000Z",
      "target": "Zaal",
      "name": "ASSIGNED_TO"
    },
    {
      "source": "todo:137:assigned:2026-05-18T14:38:45.000Z",
      "target": "Iman",
      "name": "REASSIGNED_FROM"
    },
    {
      "source": "todo:137:assigned:2026-05-18T14:38:45.000Z",
      "target": "Iman",
      "name": "DONE_BY",
      "fact": "2026-05-18T14:38:45.000Z"
    }
  ]
}
```

### 2.6 `setdue`: Set due date

**Trigger:** `/setdue 137 2026-06-01`  
**Updated ActionItem:** `due: "" -> "2026-06-01"`

**kEngram changeset [bonfire.ts:122-131]:**
```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:137:due:2026-05-18T14:39:22.000Z",
      "summary": "Due date set to 2026-06-01 at 2026-05-18T14:39:22.000Z",
      "labels": ["TodoEvent", "DueDateChange", "ZAO"]
    }
  ],
  "edges": [
    {
      "source": "todo:137:due:2026-05-18T14:39:22.000Z",
      "target": "todo:137",
      "name": "UPDATES"
    },
    {
      "source": "todo:137:due:2026-05-18T14:39:22.000Z",
      "target": "Iman",
      "name": "DONE_BY",
      "fact": "2026-05-18T14:39:22.000Z"
    }
  ]
}
```

### 2.7 `setnote`: Update notes

**Trigger:** `/setnote 137 waiting on Neynar API approval from support@neynar.com`  
**Updated ActionItem:** `notes: "" -> "waiting on Neynar API approval from support@neynar.com"`

**kEngram changeset [bonfire.ts:133-142]:**
```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:137:note:2026-05-18T14:40:15.000Z",
      "summary": "Notes updated at 2026-05-18T14:40:15.000Z",
      "labels": ["TodoEvent", "NotesChange", "ZAO"]
    }
  ],
  "edges": [
    {
      "source": "todo:137:note:2026-05-18T14:40:15.000Z",
      "target": "todo:137",
      "name": "UPDATES"
    },
    {
      "source": "todo:137:note:2026-05-18T14:40:15.000Z",
      "target": "Iman",
      "name": "DONE_BY",
      "fact": "2026-05-18T14:40:15.000Z"
    }
  ]
}
```

### 2.8 `setprio`: Set priority

**Trigger:** `/setprio 137 P1`  
**Updated ActionItem:** `priority: P2 -> P1`

**kEngram changeset [bonfire.ts:144-153]:**
```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:137:prio:2026-05-18T14:41:02.000Z",
      "summary": "Priority changed P2 -> P1 at 2026-05-18T14:41:02.000Z",
      "labels": ["TodoEvent", "PriorityChange", "ZAO", "P1"]
    }
  ],
  "edges": [
    {
      "source": "todo:137:prio:2026-05-18T14:41:02.000Z",
      "target": "todo:137",
      "name": "UPDATES"
    },
    {
      "source": "todo:137:prio:2026-05-18T14:41:02.000Z",
      "target": "Iman",
      "name": "DONE_BY",
      "fact": "2026-05-18T14:41:02.000Z"
    }
  ]
}
```

## 3. Spool & Retry Logic

### Spool File Location
```
~/.zaocoworking/bonfire-spool.jsonl
```
See [spool.ts:18](file:///tmp/bonfire-build/agent/src/teams/spool.ts#L18).

### Spool Line Format
```json
{
  "id": "ne9p2l-a5k3x2",
  "event": { /* TeamEvent from 2.x above */ },
  "status": "pending" | "sent" | "failed",
  "attempts": 0,
  "enqueuedAt": "2026-05-18T14:32:01.000Z",
  "sentAt": "2026-05-18T14:32:02.500Z",
  "lastError": "status=503 service unavailable"
}
```

### Enqueue Flow [spool.ts:38-49]
1. Command handler calls `fireBonfire(op, item, ctx, extras)`
2. `bonfireHook()` calls `enqueue(event)` before HTTP POST
3. Event written to spool file with `status: 'pending'`
4. Spool ID returned

### HTTP POST [bonfire.ts:168-188]
```
POST https://tnt-v2.api.bonfires.ai/v1/bonfires/69ef871f0d22ed7e6f2b243a/kengram/batch
Authorization: Bearer ${BONFIRE_API_KEY}
Content-Type: application/json

{ "nodes": [...], "edges": [...] }
```

On 2xx response: spool line marked `status: 'sent'`, `sentAt` timestamp set.  
On non-2xx: spool line marked `status: 'failed'`, `lastError` logged.

### Retry & Drain [bonfire.ts:235-267]
- `drainSpool()` runs on bot startup and opportunistically
- Reads all `status: 'pending'` lines
- Re-POSTs each changeset
- Compacts `status: 'sent'` lines older than 24h
- Quarantines `status: 'failed'` with 5+ attempts to `bonfire-spool.dead.jsonl` after 7 days

## 4. Failure Modes

| Scenario | Behavior |
|----------|----------|
| Bonfires API down (5xx) | HTTP POST fails; line stays `pending`. Next drain (or restart) retries. Action tracker unaffected. |
| Invalid BONFIRE_ID | POST returns 4xx. Line marked `failed`. After 5 attempts, quarantined to `.dead.jsonl`. Action tracker unaffected. |
| Wrong endpoint path | Same as invalid ID: 4xx response, eventual quarantine. |
| Network timeout (8s) | AbortSignal.timeout() triggers; caught as error. Line `failed`, retries on next drain. |
| Partial write (node created, edge failed server-side) | Idempotency depends on Bonfires API. Since we use `uuid: 'auto'`, each retry POST will generate NEW UUIDs. No built-in deduplication in Phase 1. |
| BONFIRE_API_KEY missing/invalid | HTTP returns 401. Line marked `failed`. Eventually quarantined. |
| BONFIRE_ENABLED not set | `isBonfireEnabled()` returns false; `bonfireHook()` is a no-op. No spool file created. |

All failures are **best-effort**. Action tracker remains the source of truth; Bonfire is a pure view layer.

## 5. What's NOT Happening

- **No subscription to group chats.** The bot does NOT listen to all messages in the group. Only the 8 slash commands + admin `/daily` trigger bonfire writes.
- **Group mentions invoke LLM, not bonfire directly.** When someone says `@ZAOcoworkingBot please mark task 42 done`, the mention triggers the concierge LLM path (index.ts), which synthesizes a response and may emit a `SuggestActionOp`. That suggestion is executed (and fires bonfire), but the mention itself does not directly call `fireBonfire()`.
- **No webhooks from Bonfires back to the bot.** Phase 1 is unidirectional: bot -> Bonfire only. Bonfire state changes do not trigger bot actions.

## 6. Verification Path

To confirm a kEngram landed:

1. **Spool confirms sent:**  
   Check `/root/.zaocoworking/bonfire-spool.jsonl` for the event line. If `status: 'sent'` and `sentAt` is recent, the HTTP POST succeeded.

2. **Bonfire dashboard shows node:**  
   Visit zabal.bonfires.ai, navigate to the ZABAL Bonfire (ID `69ef871f0d22ed7e6f2b243a`), and search for the node name (e.g., `todo:137` for add ops, `todo:137:done:2026-05-18T14:37:05.000Z` for done ops). If visible, the changeset landed.

3. **Both signals required:**  
   Spool + dashboard both confirm successful write. If spool shows `sent` but node isn't visible in Bonfire UI, the API accepted the POST but may have dropped the changeset. Open an issue with Bonfires team.

---

**Last validated:** 2026-05-18 against `/tmp/bonfire-build/agent/src/` deployment (v0.3.0, pre-production).  
**Bot status:** Not yet running on VPS 1 (187.77.3.104). Integration code is complete; awaiting BONFIRE_API_KEY + BONFIRE_ID environment variables + systemd start.
