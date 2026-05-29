---
id: agent-006
category: multi-agent-coordination
tier: core
severity: high
applies_to: [multi-agent]
deprecated_since: null
sources: [doc-758c, "research/agents/758c-telegram-claim-bot-pattern/README.md"]
---

## USE a UNIQUE constraint on the database for first-write-wins, not a pre-SELECT

When two agents (or agent + human) can claim the same resource at the same moment, the only race-safe primitive is a database-level UNIQUE constraint. Pre-SELECT-then-INSERT is the trap: both callers see "unclaimed", both INSERT, you get duplicate state.

PostgreSQL's UNIQUE constraint locks at the row level. INSERT throws on the second caller with error code 23505. Catch that, reply "already claimed", done. No application-level locks needed.

Advisory locks (`PG_ADVISORY_XACT_LOCK`) are overkill here. They add complexity across the codebase. UNIQUE constraints are simpler + sufficient for this use case.

### When NOT to do this

Single-writer flows: no race possible, no constraint needed. Or if the table genuinely allows duplicates (audit logs, event streams): use a different model.

### Example

```sql
-- For the ZABAL Games mentor /claim bot:
CREATE TABLE mentor_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_handle text NOT NULL UNIQUE,  -- the race-safe primitive
  mentor_tg_id bigint NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

-- In bot handler:
try {
  await db.from('mentor_claims').insert({ builder_handle: handle, mentor_tg_id: mentor });
} catch (err) {
  if (err.code === '23505') {
    return ctx.reply('Builder already claimed by another mentor.');
  }
  throw err;
}
```
