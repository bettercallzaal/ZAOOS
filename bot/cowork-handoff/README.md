# Cowork handoff — Bots status board

Drop-in artifacts so the cowork-zaodevz session can make the fleet **visible on the
board** with zero design work. Copy these into the cowork repo.

## What's here

| File | Goes to (cowork repo) | Purpose |
|------|----------------------|---------|
| `010_bot_heartbeats.sql` | `supabase/migrations/010_bot_heartbeats.sql` | The heartbeat table. Apply in Supabase SQL editor. |
| `BotsBoard.tsx` | a component dir, e.g. `src/components/BotsBoard.tsx` | The board panel. Reads `GET /api/v1/bots`, auto-refreshes 30s, offline-first. |

## Steps for the cowork session

1. **Apply** `010_bot_heartbeats.sql` (heartbeat endpoints return 503 gracefully until then).
2. **Mount** `<BotsBoard />` on the main board page (or a `/bots` route).
3. **Auth:** `BotsBoard` fetches `/api/v1/bots` from the browser, so make that **GET
   session-readable** for logged-in team members. If you'd rather keep it bearer-only,
   convert `BotsBoard` to a server component that fetches with a service token and
   passes `bots` as a prop (note in the file).
4. Adapt the Tailwind classes to your design system.

## Then go-live (ops)

**Cowork (Vercel):** `COWORK_BOT_TOKENS="zoe=…,zaodevz=…,zaostock=…"`.

**ZAOOS / VPS:** per systemd unit set `COWORK_API_URL` + the matching `COWORK_BOT_TOKEN`
(`zoe-bot`→`zoe=`, `zao-devz-stack`→`zaodevz=`, `zaostock-bot`→`zaostock=`), then
`systemctl --user restart zoe-bot zao-devz-stack zaostock-bot`.

Within 60s the three bots upsert heartbeats → the board shows green. Stale > 180s → red.

## Contract

Full API contract: cowork `docs/BOT-API.md` + ZAOOS `bot/COWORK_API.md`. The board
consumes `GET /api/v1/bots` → `{ bots: [{ bot, status, ts, meta, online, ageSeconds }] }`.
