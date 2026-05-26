---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-26
related-docs: "758, 758a, 758b, 758d, 758e, 720"
original-query: "Telegram /claim @builder-handle bot pattern for ZABAL Games mentor channel: first-write-wins, audit log to Supabase, Zaal moderates. Reuse Hermes or new bot? Framework choice?"
tier: STANDARD
---

# 758c - Telegram /claim bot pattern for ZABAL Games mentors

> **Goal:** First-write-wins /claim @builder Telegram command in private mentor channel. 8 mentors, 8 finalists, decisions atomic at the DB layer. Ship in one afternoon.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **USE grammY** (not Telegraf, not node-telegram-bot-api) | 92.2 benchmark score (vs Telegraf 82); better typed; Telegraf v4 types are overly complex; ecosystem shifting to grammY |
| 2 | **EXTEND Hermes** (not new bot) | One systemd unit, one bot in the channel, lower mentor cognitive load, reuse existing VPS deploy + secret-hygiene path |
| 3 | **USE Supabase UNIQUE(builder_handle) constraint** for atomicity | PostgreSQL row lock is the only race-safe primitive; INSERT + catch error code 23505 = first-write-wins |
| 4 | **DO NOT pre-SELECT before INSERT** | Two concurrent calls both see "unclaimed" and both succeed; the UNIQUE on INSERT is the only firewall |
| 5 | **SKIP advisory locks** (PG_ADVISORY_XACT_LOCK) | Add complexity; UNIQUE constraint is sufficient for this use case |
| 6 | **USE `bot.api.setMyCommands()` scoped to mentor channel** | /claim only shows in the mentor channel command menu; nobody else sees it |
| 7 | **AUTH via `bot.api.getChatMember()`** check for ADMINISTRATOR/OWNER status | Adds ~50ms latency per command, but only mentors (admins) can fire |

## Findings

### Framework: grammY over Telegraf

grammY scores 92.2 vs Telegraf 82 on a comparative benchmark; 3086+ code snippets in context7; superior docs; always-current API support; type-safety designed for approachability (Telegraf v4 migrated to TS but generated complex types that are harder to read than untyped v3). node-telegram-bot-api is too primitive (no middleware, spaghetti past 50 LOC). For a single /claim command extension to Hermes, grammY wins on clarity + maintainability. Hermes currently runs on Iman's VPS 187.77.3.104 via systemd.

### Hermes extension vs new bot

Reuse Hermes. Adding /claim to Hermes's middleware chain:
- One deploy / one systemd unit / one bot in mentor channel
- Mentors see one concierge (lower cognitive load)
- Reuses battle-tested infra
- /claim is stateless enough not to pollute core agent logic

New bot only if /claim becomes its entire focus (not the case for 8 mentors / 8 finalists / one summer).

### Race-condition handling: UNIQUE on (builder_handle)

Supabase = PostgreSQL. UNIQUE constraint on `builder_handle` is atomic. Two mentors INSERT same value at the same moment: PostgreSQL locks the row, one wins, the other gets error code `23505` "duplicate key violates unique constraint." Failed mentor's bot catches the error and replies "Builder already claimed by another mentor."

For Q6 conflict-resolution (builder picks; 24h FCFS fallback), add `claimed_at` timestamp + `conflict_resolution_mode` ENUM. Application logic: if builder claimed and `claimed_at < 24h ago`, reply "Under review, builder will confirm within 24h" + DM the builder with both mentors' info. If `>24h`, allow override claim. This is app code, not DB.

### Private group + mentor-only auth

`bot.api.getChatMember(chat_id, user_id)` returns status: ADMINISTRATOR / OWNER / BANNED / LEFT / MEMBER / RESTRICTED. In Hermes middleware: before handling /claim, check status. If not ADMIN/OWNER -> "Mentors only" + drop. Synchronous, ~50ms.

### Audit log schema

Supabase `mentor_claims`:

```sql
CREATE TABLE mentor_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_tg_id bigint NOT NULL,
  mentor_display_name text NOT NULL,
  builder_handle text NOT NULL UNIQUE,
  channel_id bigint NOT NULL,
  message_id bigint NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','reassigned','conflict')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON mentor_claims (mentor_tg_id);
CREATE INDEX ON mentor_claims (channel_id);
```

Successful INSERT logs. UNIQUE violation -> log conflict (status='conflict' on earlier row, or separate conflicts table for full FCFS audit).

### Slash command auto-discovery

```typescript
await bot.api.setMyCommands(
  [{ command: 'claim', description: 'Claim a builder as mentor' }],
  { scope: { type: 'chat', chat_id: MENTOR_CHANNEL_ID } }
)
```

Scopes /claim to the private mentor channel only.

### Rate limiting

Telegram: 30 msgs/sec global, 1/sec per chat. Peak: 8 mentors claiming 8 finalists = 8 messages in ~1 sec. Well under cap. No custom rate-limiting needed.

### Testing first-write-wins

Mock two concurrent INSERTs in vitest:

```typescript
const handle = '@test-builder-' + Date.now()
const [a, b] = await Promise.all([
  supabase.from('mentor_claims').insert({ mentor_tg_id: 1, builder_handle: handle, /* ... */ }),
  supabase.from('mentor_claims').insert({ mentor_tg_id: 2, builder_handle: handle, /* ... */ }),
])
const successCount = [a, b].filter(r => r.error == null).length
expect(successCount).toBe(1)
```

### Killer gotchas

1. **Race before INSERT**: Don't SELECT-then-INSERT. Concurrent calls both see "unclaimed." UNIQUE on INSERT is the atomic firewall.
2. **Telegram retry**: If bot doesn't ACK in 30 sec, Telegram retries the callback. Second retry hits UNIQUE and is harmless. Keep DB ops <1 sec to avoid.
3. **Session race in grammY**: built-in session middleware is correct. Don't roll your own.
4. **No transaction needed**: single INSERT; let Supabase ACID handle it.

## Recommended Build Plan (5 steps)

1. **Create Supabase `mentor_claims` table** (migration above) + RLS policy allowing service-role writes only.
2. **Add `/claim` handler to Hermes** (grammY) - parse `@handle` payload, check `getChatMember` is admin, INSERT, catch `23505`.
3. **Wire conflict-resolution path** - on 23505: reply conflict; on success: reply claimed + DM builder with both options if a prior 24h-window claim exists.
4. **Deploy + test** - `systemctl restart hermes-bot`, fire /claim from two mentor accounts in rapid succession in staging mentor channel, verify only one row, second mentor sees conflict.
5. **Wire scoped command menu** - `setMyCommands([{ command: 'claim' }], { scope: { type: 'chat', chat_id: MENTOR_CHANNEL_ID } })`.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create `mentor_claims` Supabase table + RLS | @Zaal | migration | 2026-05-29 |
| Add /claim grammY middleware to Hermes (bot/src/hermes/) | @Zaal | PR (bot) | 2026-05-30 |
| Implement 23505 catch + builder-DM-on-conflict | @Zaal | PR (bot) | 2026-05-30 |
| Write vitest race-condition test (2x concurrent INSERT) | @Zaal | PR (bot) | 2026-05-30 |
| Deploy Hermes v2 to VPS, test in staging mentor channel | @Zaal | deploy | 2026-05-31 |
| Document /claim in Hermes README + ZAO mentor handbook (doc 758e) | @Zaal | docs | 2026-05-31 |

## Also See

- Doc 758 (hub) - parent
- Doc 758e - Mentor handbook patterns (the user-facing doc that says how /claim works)
- Doc 720 - ZAOstock standup May 19 (ZABAL Games initial commitment)
- Doc 734 - Hermes orchestrator framework (the bot infra this extends)
- Memory: project_hermes_canonical.md, project_zabal_games.md

## Sources

- [FULL] grammY vs other Bot Frameworks - https://grammy.dev/resources/comparison
- [FULL] Telegraf docs (context7) - /telegraf/telegraf
- [FULL] Winning Race Conditions with PostgreSQL - https://dev.to/mistval/winning-race-conditions-with-postgresql-54gn
- [PARTIAL - bot session best practices] Telegraf v4.12.0 release notes - https://github.com/telegraf/telegraf/blob/v4/release-notes/4.12.0.md
- [PARTIAL - no mentor-auth example] Telegram ChatMember status docs - https://docs.python-telegram-bot.org/en/stable/telegram.chatmember.html
- [PARTIAL - advisory locks optional here] PostgreSQL advisory locks guide - https://firehydrant.com/blog/using-advisory-locks-to-avoid-race-conditions-in-rails/
- [PARTIAL - Supabase upsert pattern] Supabase UNIQUE constraint guide - https://www.flowql.com/en/blog/guides/supabase-unique-constraint-error-fix/
