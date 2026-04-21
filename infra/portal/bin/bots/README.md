# ZAO Branded Bot Fleet

Home for all ZAO branded Telegram + Farcaster bots. Each bot runs as its own
tmux session managed by `infra/portal/bin/watchdog.sh`. Shared plumbing lives
in `_shared/`.

Designed per research docs 464, 465, 467, 468.

## Layout

```
bots/
  _shared/                    shared modules, imported by every bot
    bot-core.mjs              Telegram plumbing: poll, send+retry, callbacks
    fc-bot-core.mjs           Farcaster plumbing: Neynar webhooks, publishCast
    persona-loader.js         reads bots/<name>/persona.md
    rate-limit.js             per-user + per-group caps
    guardrail.js              Haiku post-reply tone check (placeholder)
    circuit.js                N-rejections-in-24h -> read-only (placeholder)
    model-router.js           Haiku/Sonnet/Opus routing per task
    approval-queue.js         draft-to-Telegram pattern for FC casts
  zao-devz/                   order 1 — autonomous coding in ZAO DEVZ group
  research/                   order 2 — /zao-research skill wrapper
  zao-stock/                  order 3 — conversational event assistant
  magnetiq/                   order 4 — SAPS idea generator
  wavewarz/                   order 5 — planning + hype
  poidh/                      Farcaster order 1 — bounty ideas in /poidh
  hypersub/                   Farcaster order 2 — TBD per Zaal
```

Each `bots/<name>/` contains:
- `persona.md` — voice, tone, examples, forbidden phrases, escalation
- `triggers.yaml` — scheduled + reactive + external trigger config with rate caps
- `.env` — bot token, fid, ALLOWED_USERS/GROUPS/FIDS, model overrides
- `bot.mjs` or `fc-bot.mjs` — thin wrapper that calls `runBot(config)`

## Current status (2026-04-21)

**Phase 1 — scaffolding only.** `_shared/` is empty. ZOE's existing bot at
`infra/portal/bin/bot.mjs` is the template we'll extract from in the A1 task
tomorrow. No branded bot is live yet.

## Next action

Per `project_tomorrow_first_tasks` memory: install Anthropic API key on VPS,
then extract `_shared/bot-core.mjs`, then ship `bots/zao-devz/`.

## Model routing default

- Haiku 4.5 for classification + guardrails + rate checks (60-80% of calls)
- Sonnet 4.6 for brand-voice reply generation (15-20%)
- Opus 4.7 reserved for ZOE concierge + heavy code inside AO sessions (<=5%)

Target: $5-8/day steady state across the full fleet per doc 467.

## Safety floor (required, every bot)

- `ALLOWED_USERS` + `ALLOWED_GROUPS` env vars
- Rate limit 3 replies/user/5min per group
- `callback_data` regex re-validation before any spawn
- `extra` context always wrapped as DATA not instruction-override
- Spawn-agent calls pass through existing allowlist at `spawn-server.js:213`
