---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-07-27
related-docs: 2089, 2090, 2091, 2030
original-query: "Design a mechanism to replace the manual clipboard-paste handoffs between ZAO's Claude terminals (ZOE / ZAOcowork / fractal lanes) - Zaal was the message bus all session. (overnight system-improvement loop)"
tier: STANDARD
---

# 2092 - Lane handoffs: stop being the message bus between terminals

> **Goal:** Replace the manual ">>> PASTE INTO X <<<" clipboard relay between ZAO's Claude terminals with a shared, auditable coordination surface - so the lanes talk to each other, not through Zaal.

## The problem (from tonight)

The entire 2026-07-27 session ran with Zaal as the human message bus: every cross-terminal coordination was a ">>> PASTE INTO ZOE / ZAOCOWORK <<<" block that Zaal copy-pasted by hand between the ZOE lane, the ZAOcowork lane, and the fractal lane. Real costs observed: a "#262" was referenced that could not be located (wrong repo), double-filing of board tasks was a live risk ("do NOT re-run the SQL"), and the only record of who-knows-what lived in Zaal's clipboard. The lanes had no shared state.

## Decision

**Add a lightweight `lane_handoffs` table on the existing cowork Supabase; lanes write coordination messages and poll for their own.** Smallest viable: read-only polling + append-only writes, surfaced as copyable text in the cockpit. Signed with the existing `dreamnet.receipt.v1` emission (doc 2030) for an audit trail - no new signing system.

Weighed against: (a) reusing the cowork board with a "handoff" kind (rejected - pollutes the task board), and (b) adopting a Buzz-style shared log wholesale (rejected per doc 2089 - migration, not integration). A single purpose-built table is the least sprawl.

## Data model

```sql
CREATE TABLE lane_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_lane text NOT NULL,        -- "zoe" | "zaocowork" | "fractal" | ...
  to_lane text NOT NULL,          -- a lane, or "_broadcast"
  body text NOT NULL,             -- paste-ready markdown, ~3 lines of facts
  status text DEFAULT 'pending',  -- pending | acknowledged | done
  receipt_v1 jsonb,               -- {tx_id, sig, ts, hash} via dreamnet.receipt.v1
  read_by text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX lane_handoffs_to_status ON lane_handoffs(to_lane, status, created_at DESC);
```

## How each lane uses it

- **Write:** `zao-tracker handoff <from> <to> "<body>"` appends a row + emits the receipt. Body is the same 3-line fact block we paste today.
- **Read:** `zao-tracker poll <my_lane> --status pending` returns unacked handoffs to this lane; on ingest, set `status=acknowledged` + append the lane to `read_by[]`.
- **Surface:** a `[LANE MESSAGES]` section in the daily cockpit brief runs `poll` so handoffs show up without Zaal relaying.

The double-run question ("did we already run this SQL?") becomes "read `read_by[]` - was I listed?" - answerable from shared state, not memory.

## Reused vs new

| Component | Reused / New |
|---|---|
| Supabase table | NEW - one table on the existing `etwvzrmlxeobinrlytza` board |
| `handoff` + `poll` CLI | EXTEND `zao-tracker` (~100 lines) |
| Receipt/signing | REUSE `dreamnet.receipt.v1` (doc 2030) - emit on handoff create |
| Display | REUSE the cockpit brief - add one section |

## Safety

Lanes exchange coordination messages only (task IDs, PR numbers, doc refs) - never credentials, deploys, or authority. Handoffs are surfaced as readable text; the receiving human still decides to act. Every row carries a receipt so drift is traceable. This is the opposite of auto-acting: it makes the paste-block a queryable log instead of a clipboard.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Zaal approves the lane_handoffs design | zaal | Decision | 2026-08-05 |
| First PR: migration + `zao-tracker handoff`/`poll` + cockpit `[LANE MESSAGES]` section | zaal | PR | 2026-08-12 |

## Sources

- [Doc 2089](../../agents/2089-block-buzz-agent-workspace/) - Block Buzz signed cross-agent handoffs (the borrowed idea)
- [Doc 2090](../2090-async-coordination-board-uiux/) - async coordination (board = single source of truth)
- [Doc 2030 dreamnet.receipt.v1] - the existing receipt emission reused here
