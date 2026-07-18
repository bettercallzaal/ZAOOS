---
topic: technology, ZOL, zaalcaster, infrastructure
type: implementation-brief
status: DECISION NEEDED — 4 open questions before implementation; blocked on ZOL PRs #26-#39 merging
last-validated: 2026-07-18
related-docs: 1545-zol-keystone3-intent-bridge-impl-brief, 1512-zol-dreamloops-activation-record
board-tasks: f7775231 (Keystone 4 board entry)
source: ZOL PR #42 DRAFT (docs/zol-keystone4-fleet-page-design-v1.md, 2026-07-17)
action-owner: Zaal (answer Q1-Q4, run Supabase migration); Hurricane (zaalcaster PR); ZOL maintainer (handler + heartbeat)
---

# 1554 — ZOL Keystone 4: zaalcaster Fleet Page — Implementation Readiness Brief

> **What this is:** A live read-only status page for the ZOL agent, embedded in zaalcaster. Zaal tabs to `/fleet` in zaalcaster and sees ZOL's health, active capsules, DreamLoop statuses, and the last 10 receipts — all sourced from the Pi via a Supabase relay. This brief distills ZOL PR #42 into the concrete gate checklist and implementation steps for Zaal and Hurricane.

---

## The Problem

ZOL runs on the Pi (`ansuz`, localhost:8089). zaalcaster runs on Vercel (serverless HTTPS). A direct Vercel→Pi HTTP call is not possible — the Pi is LAN-only.

**Solution (Option A, recommended):** ZOL's `heartbeat` loop writes a status snapshot to a Supabase `fleet_state` table every ~5 min. zaalcaster reads that table from a serverless function. Pi is never exposed; zaalcaster only sees the Supabase row.

```
Pi / ZOL heartbeat (every 5 min)
  → UPSERT fleet_state {agent_id="zolbot", health, capsules, loops, receipts}

Vercel / zaalcaster (api/fleet.js, on page load)
  → SELECT * FROM fleet_state WHERE agent_id = 'zolbot'
  ← {health, capsules, loops, receipts, updated_at, stale?}

zaalcaster Fleet tab
  → renders health + capsule list + loop statuses + last 10 receipts
  → shows "Data is N min stale" banner if updated_at > 10 min ago
```

---

## What Gets Built (After Gates Clear)

### ZOL Side (~1.5 hours, ZOL maintainer)

**1. `fleet.state.write` handler** — new entry in `src/handlers/index.js`:

```javascript
'fleet.state.write': async function({ store, signal }) {
  const snapshot = {
    agent_id: 'zolbot',
    health: JSON.stringify({
      status: 'ok',
      uptime_s: process.uptime(),
      checked_at: new Date().toISOString(),
    }),
    capsules: JSON.stringify(/* capsuleRegistry.list({status:'active'}) */),
    loops:    JSON.stringify(/* dreamloopRegistry.list({status:['live','dry-run']}) */),
    receipts: JSON.stringify(/* receiptJournal.list({limit:10}) */),
    updated_at: new Date().toISOString(),
  };
  const { COWORK_TRACKER_URL, COWORK_TRACKER_KEY } = process.env;
  await fetch(`${COWORK_TRACKER_URL}/rest/v1/fleet_state`, {
    method: 'POST',
    headers: {
      apikey: COWORK_TRACKER_KEY,
      Authorization: `Bearer ${COWORK_TRACKER_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(snapshot),
  });
  // Fails silently — board outage must not block heartbeat
}
```

**2. Add `fleet.state.write` as last step in `loops/heartbeat.json`:**

```json
{
  "id": "fleet-state-write",
  "handler": "fleet.state.write",
  "description": "Write ZOL status snapshot to Supabase fleet_state table",
  "on_error": "log_and_continue"
}
```

**Critical:** `on_error: log_and_continue` ensures a Supabase outage doesn't kill the heartbeat.

### Supabase Migration (~5 min, Zaal runs in dashboard)

```sql
CREATE TABLE IF NOT EXISTS fleet_state (
  agent_id    TEXT PRIMARY KEY,
  health      JSONB,
  capsules    JSONB,
  loops       JSONB,
  receipts    JSONB,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fleet_state ENABLE ROW LEVEL SECURITY;

-- ZOL writes via service_role key (COWORK_TRACKER_KEY)
CREATE POLICY "zolbot_write" ON fleet_state
  FOR ALL USING (auth.role() = 'service_role');

-- zaalcaster reads via anon key (public-safe)
CREATE POLICY "public_read" ON fleet_state
  FOR SELECT USING (true);
```

**Run this BEFORE Pi activation** so the first heartbeat can write.

### zaalcaster Side (~1.5 hours, Hurricane)

**1. `api/fleet.js` — new serverless function:**

```javascript
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { data, error } = await sb
    .from('fleet_state')
    .select('*')
    .eq('agent_id', process.env.FLEET_AGENT_ID ?? 'zolbot')
    .single();
  if (error || !data) {
    return res.status(200).json({ ok: false, reason: error?.message ?? 'no-data' });
  }
  const staleSec = (Date.now() - new Date(data.updated_at).getTime()) / 1000;
  return res.status(200).json({
    ok: true,
    stale: staleSec > 600,
    stale_sec: Math.round(staleSec),
    health:   JSON.parse(data.health   ?? '{}'),
    capsules: JSON.parse(data.capsules ?? '[]'),
    loops:    JSON.parse(data.loops    ?? '[]'),
    receipts: JSON.parse(data.receipts ?? '[]'),
    updated_at: data.updated_at,
  });
}
```

**2. Fleet tab in `public/index.html`:**

- Register tab key `f` (alongside existing tab key `8` for Empire)
- Zaal-role guard (same `blockedByAuth` pattern as Empire tab)
- Heading: `${FLEET_PRODUCT_NAME || 'ZOL'} Fleet Status`
- Renders: health uptime, stale banner (if >10 min old), capsule list, loop list, receipt table

**3. Config constants (add to `zaalcaster/config.js`):**

```javascript
export const FLEET_AGENT_ID      = process.env.FLEET_AGENT_ID      ?? 'zolbot';
export const FLEET_PRODUCT_NAME  = process.env.FLEET_PRODUCT_NAME  ?? 'ZOL';
```

**4. New Vercel env vars:**

| Variable | Value | Notes |
|----------|-------|-------|
| `SUPABASE_URL` | Same Supabase project as ZOL | Without `/rest/v1` suffix |
| `SUPABASE_ANON_KEY` | Supabase anon key | Public-safe (read-only by RLS) |
| `FLEET_AGENT_ID` | `zolbot` | Optional — default hardcoded |
| `FLEET_PRODUCT_NAME` | `ZOL` | Optional — for white-labeling |

---

## 4 Questions for Zaal (Blocking or Affecting Design)

**Q1 — RLS conflict check:**

The cowork-rls-hardening.sql (ZAOOS PR #1279) drops `authenticated_all` policies on all tables. Does the new `fleet_state` anon-read policy conflict with the hardened RLS setup?

→ **Action:** Before running the migration, verify the Supabase Database Advisor sees no conflict. If in doubt, use service_role for reads in zaalcaster (adds SUPABASE_SERVICE_ROLE_KEY to Vercel env — less public-safe).

**Q2 — Same Supabase project or separate?**

Should `fleet_state` share the ZAOcowork Supabase project (`COWORK_TRACKER_URL`), or use a separate ZOL-only project?

→ **Recommendation: Same project** (simpler, no new env vars, consistent with Keystone 3 bus). Separate only if cowork tracker uptime needs to be decoupled from ZOL fleet visibility.

**Q3 — Receipt depth:**

Does Zaal want the fleet page to show just `receiptId + loopId + status + completedAt`, or also the full `evidence` field (artifact hashes, tool call counts)?

→ **Recommendation: Lightweight for v1.** Add evidence depth as a future improvement if Zaal requests it. Keeps the Supabase row small (~5KB max per snapshot).

**Q4 — Stale threshold:**

If ZOL's heartbeat runs every 5 min, the fleet page data is at most 5 min stale during normal operation. Is the 10-min stale banner threshold correct, or should it be tighter (e.g., 8 min = 1 missed heartbeat)?

→ **Recommendation: 8 min** (= 1 missed heartbeat + 3 min grace). This gives a clear signal that ZOL has missed exactly one cycle.

---

## Implementation Gates

- [ ] ZOL PRs #26-#39 merged to main (v2 agent-gateway, capsule registry, receipt journal)
- [ ] ZOL PR #61 merged (DreamLoops activation) — fleet page should show live loop statuses
- [ ] Pi activated and heartbeat running (`curl localhost:8089/health` → `{"ok":true}`)
- [ ] Zaal answers Q1-Q4 above
- [ ] Zaal runs `fleet_state` Supabase migration
- [ ] Brandon reviews ZOL PR #42 (design review, same pattern as PR #29)
- [ ] `SUPABASE_URL` + `SUPABASE_ANON_KEY` set in Vercel env for zaalcaster

**Current status:** Same gate as Keystone 3 (doc 1545) — ZOL PRs #26-#39 not yet merged. Implement Keystone 3 and 4 together in one sprint after the v2 PRs land.

---

## Relationship to Keystone 3

| | Keystone 3 (doc 1545) | Keystone 4 (this doc) |
|---|---|---|
| Direction | ZOE → ZOL (intent dispatch) | ZOL → zaalcaster (status relay) |
| Supabase table | `tasks` (existing cowork board) | `fleet_state` (new table) |
| Trigger | User message in Telegram → ZOE | Heartbeat loop on Pi → ZOL |
| Latency | ~15 min (board poll) | ~5 min (heartbeat write) |
| ZOE side | `intent-router.ts` (new file) | No ZOE changes |
| ZOL side | `board.zol-intent.claim` handler | `fleet.state.write` handler |
| zaalcaster side | No changes | `api/fleet.js` + Fleet tab |
| Security | Board task as idempotency key | Anon-read RLS on fleet_state |

Both use Supabase as the relay layer. Both share the same implementation gate (ZOL PRs #26-#39). Implement together in one sprint.

---

## Security Invariants

1. **No Pi exposure.** Pi's localhost:8089 is never reachable from Vercel. Only Supabase row is.
2. **Supabase anon key is read-only by RLS.** The `SUPABASE_ANON_KEY` in Vercel env can't write.
3. **ZOL uses service_role key for writes.** `COWORK_TRACKER_KEY` already in Pi env — no new secrets.
4. **Fleet page is Zaal-role-only.** Same `blockedByAuth` guard as Empire tab (tab key `8`).
5. **No sensitive data in snapshot.** Receipts contain only IDs and timestamps. No prompts, no model outputs, no wallet data, no memory contents.

---

## Time Estimate

| Component | Owner | Time (after gates clear) |
|-----------|-------|--------------------------|
| `fleet.state.write` handler + heartbeat step | ZOL maintainer | ~1 hour |
| `fleet_state` Supabase migration | Zaal | ~5 min |
| `api/fleet.js` serverless function | Hurricane | ~1 hour |
| Fleet tab HTML + renderer | Hurricane | ~1.5 hours |
| Config constants + Vercel env | Hurricane + Zaal | ~15 min |
| **Total** | | **~3-4 hours** |

---

## Sources

- ZOL PR #42 DRAFT: `docs/zol-keystone4-fleet-page-design-v1.md` (2026-07-17)
- Board task f7775231 (Keystone 4 board entry)
- ZAOOS doc 1545 (Keystone 3 intent bridge — same implementation gate)
- ZAOOS doc 1512 (ZOL DreamLoops activation + Pi checklist)
- `bettercallzaal/zaalcaster` `public/index.html` (Empire tab pattern, tab key 8)
