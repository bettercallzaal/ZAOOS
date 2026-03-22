# 114 — ZAO Fractal Live Infrastructure + Bot Data Flow (March 2026)

> **Status:** Research complete
> **Date:** 2026-03-22
> **Goal:** Map what's actually live, what data flows where, and what ZAO OS needs to become the "one place for all data"

## What's Live Right Now

| Service | Status | Key Stats |
|---------|--------|-----------|
| **zao.frapps.xyz** | LIVE | Vite SPA, /submitBreakout for on-chain submission |
| **OREC contract** | ACTIVE | 175 txns, last March 20, Vote+Execute pairs |
| **ZOR Respect1155** | DEPLOYED | 4 holders (early adoption) |
| **OG Respect ERC-20** | DEPLOYED | 122 holders, 38,484 ZAO supply |
| **ornode** | DOWN | All endpoints unreachable |
| **Bot web dashboard** | OFFLINE | Vercel deployment deleted |
| **Discord bot** | ACTIVE | Running on bot-hosting.net |

## Critical Finding: Only 2 Wallets on OREC

Only `zaal.eth` and `civilmonkey.eth` have ever called Vote/Execute on the OREC contract. This means Zaal is personally submitting most fractal results on-chain on behalf of breakout groups.

## Bot Webhook Events (6 Types)

The bot sends these webhook events to an external endpoint (configurable via `WEB_WEBHOOK_URL`):

| Event | Trigger | Key Data |
|-------|---------|----------|
| `fractal_started` | Session begins | threadId, participants, facilitator, currentLevel |
| `vote_cast` | Each vote | voterId, candidateId, level, totalVotes |
| `round_complete` | Level consensus reached | level, winnerId, voteDistribution |
| `fractal_complete` | All rounds done | results array (discordId, rank, level), totalRounds |
| `fractal_paused` | Facilitator pauses | currentLevel, pausedAt |
| `fractal_resumed` | Facilitator resumes | currentLevel, resumedAt |

**Auth:** Bearer token via `WEBHOOK_SECRET`. Fire-and-forget with 10s timeout.

## Bot History Data Format

Stored in `data/history.json`:

```json
{
  "fractals": [
    {
      "id": 1,
      "group_name": "ZAO Fractal: ...",
      "facilitator_id": "discord_id",
      "facilitator_name": "Display Name",
      "fractal_number": "session identifier",
      "group_number": "group within session",
      "rankings": [
        { "user_id": "id", "display_name": "name", "level": 6, "respect": 110 },
        { "user_id": "id", "display_name": "name", "level": 5, "respect": 68 }
      ],
      "completed_at": "2026-03-22T12:00:00+00:00"
    }
  ]
}
```

## Frapps Submit URL Format

Bot generates: `https://zao.frapps.xyz/submitBreakout?groupnumber=N&vote1=WALLET1&vote2=WALLET2&...`

- `vote1` = highest ranked (Level 6, 110 Respect)
- `vote2` = second (Level 5, 68 Respect)
- Down to `vote6` = lowest (Level 1, 10 Respect)
- Wallets from bot's wallet registry (`/register` command)

## Bot Config Constants

| Constant | Value |
|----------|-------|
| MAX_GROUP_MEMBERS | 6 |
| MIN_GROUP_MEMBERS | 2 |
| RESPECT_POINTS | [110, 68, 42, 26, 16, 10] |
| STARTING_LEVEL | 6 |
| THREAD_PREFIX | "ZAO Fractal:" |
| Vote threshold | ceil(members / 2) — simple majority |

## What ZAO OS Needs to Be "One Place for All Data"

### Data Sources to Unify

| Data | Current Location | ZAO OS Integration Path |
|------|-----------------|------------------------|
| Session history | Bot JSON files (history.json) | Webhook -> `/api/fractals/webhook` -> Supabase |
| Live session state | Discord bot memory | Webhook events (fractal_started, vote_cast, round_complete) |
| On-chain results | OREC contract (Optimism) | Read via viem multicall or orclient |
| OG Respect balances | ERC-20 contract | Already built: `src/lib/respect/leaderboard.ts` |
| ZOR Respect balances | ERC-1155 contract | Already built: `src/lib/respect/leaderboard.ts` |
| Member wallets | Bot JSON (wallets.json) | Sync to Supabase `users.respect_wallet` |
| Proposals | Bot JSON (proposals.json) + OREC | Read contract + mirror Discord proposals |
| Leaderboard | Bot `/rankings` command | Already built: `/api/respect/leaderboard` |
| Hats tree | Bot `/hats` + Optimism contract | Already built: `/api/hats/tree` |

### Phase 2 /fractals Page Features

Based on this research, the /fractals page should add:

1. **Webhook endpoint** at `/api/fractals/webhook` — receive bot events in real-time
2. **Live session indicator** — "Fractal happening now" with participant count
3. **Submit results link** — deep link to `zao.frapps.xyz/submitBreakout` with pre-filled params
4. **Weekly eligibility tracker** — who hasn't played this week yet
5. **OG Respect history** — show non-fractal distributions separately from ZOR
6. **Voting criteria card** — the 5 ZAO vision criteria
7. **Session stats** — 90+ weeks, total participants, total Respect distributed
8. **Combined leaderboard** — OG + ZOR + fractal scores in one view
9. **On-chain contract links** — OREC, ZOR, OG with Etherscan deep links (already in ProposalsTab)

### Webhook Integration Architecture

```
Discord Bot (Python, bot-hosting.net)
  |
  | POST /api/fractals/webhook (Bearer auth)
  | Events: fractal_started, vote_cast, round_complete, fractal_complete
  v
ZAO OS API Route (Next.js, Vercel)
  |
  | Insert/update Supabase tables
  v
Supabase (fractal_sessions, fractal_scores)
  |
  | Realtime subscription
  v
/fractals page (React client) — live updates
```

## Sources

- [OREC Contract on Etherscan](https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532)
- [ZOR Respect1155 on Etherscan](https://optimistic.etherscan.io/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c)
- [OG Respect ERC-20 on Etherscan](https://optimistic.etherscan.io/token/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957)
- [fractalbotmarch2026 source code](https://github.com/bettercallzaal/fractalbotmarch2026)
- Research docs 102, 109, 113 in this library
