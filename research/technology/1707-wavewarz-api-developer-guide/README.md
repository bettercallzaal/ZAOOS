# 1707 — WaveWarZ Public API Developer Guide (Jul 2026)

**Type:** DEVELOPER-GUIDE  
**Topic:** Technology  
**Status:** ACTIVE — Public API at wavewarz.info/api/public/stats. No auth required. Open to any developer. Use this doc when: (1) a ZABAL builder asks how to pull WaveWarZ data, (2) responding to press asking for a live data link, (3) building Farcaster frames or Discord bots, (4) filling OP RF grant applications that ask for open ecosystem evidence. ZOE links this doc when someone asks "how do I get WaveWarZ stats programmatically?"

---

## Base URL

```
https://wavewarz.info/api/public/
```

All endpoints are GET. No API key required. Public CORS — accessible from any origin.

---

## Endpoints

### `/stats` — Platform Summary

Returns current platform-wide aggregate statistics.

**URL:** `GET https://wavewarz.info/api/public/stats`

**Response (Jul 2026 values — live data will differ):**

```json
{
  "total_battles": 1245,
  "main_events": 50,
  "main_battles": 162,
  "quick_battles": 1047,
  "community_battles": 36,
  "total_volume_sol": 523.991,
  "artist_payouts_sol": 9.0988,
  "trader_claims_sol": 127.343,
  "updated_at": "2026-07-18T..."
}
```

**Key fields:**
| Field | Description |
|-------|-------------|
| `total_battles` | All battles ever settled (MAIN + Quick + Community) |
| `main_events` | Number of COC Concertz / live events |
| `main_battles` | Battles in MAIN format |
| `quick_battles` | Battles in Quick format |
| `community_battles` | Organizer-hosted community battles |
| `total_volume_sol` | Total SOL staked across all battles (all time) |
| `artist_payouts_sol` | Total SOL paid to artists (both winning and losing sides) |
| `trader_claims_sol` | Total SOL claimed by winning traders |
| `updated_at` | ISO timestamp of last data refresh |

**Use this endpoint for:**
- Real-time stats blocks in grant applications
- Press inquiries asking for current numbers
- ZOE's weekly stat pulls
- Farcaster frame stat displays
- Discord/Telegram bot responses to "!stats"

---

### `/battles` — Battle List (if available)

**URL:** `GET https://wavewarz.info/api/public/battles`

Returns list of recent/active battles. Confirm endpoint availability with Hurricane.

---

### `/battle/:id` — Individual Battle

**URL:** `GET https://wavewarz.info/api/public/battle/:id`

Returns data for a specific battle by ID. Use the ID from the wavewarz.info battle URL.

**Expected fields (verify with Hurricane):**
- `id` — battle identifier
- `artist_a`, `artist_b` — artist display names
- `artist_a_audius`, `artist_b_audius` — Audius handles
- `status` — active | settled
- `artist_a_pct`, `artist_b_pct` — current vote percentages
- `total_sol` — total SOL staked
- `winner` — artist_a | artist_b (after settlement)
- `winner_payout_sol`, `loser_payout_sol` — settlement amounts
- `settled_at` — ISO timestamp

---

## Data Model: Payout Math

Use this when displaying payout projections or explaining the mechanic:

```
losing_pool = total SOL staked on losing artist
winning_pool = total SOL staked on winning artist

winning_trader_payout = losing_pool × 0.80   (distributed pro-rata to winning traders)
winning_artist_payout = losing_pool × 0.10
losing_artist_payout  = winning_pool × 0.10
```

**Example (100 SOL total, 60-40 split, Artist A wins):**
- Winning pool (A): 60 SOL
- Losing pool (B): 40 SOL
- Winning traders: 40 × 0.80 = 32 SOL
- Artist A (winner): 40 × 0.10 = 4 SOL
- Artist B (loser): 60 × 0.10 = 6 SOL

Note: the losing artist earns MORE than the winning artist when the losing pool is larger. This is correct and expected — it's the mechanism.

---

## Common Integration Patterns

### Pattern 1: Real-Time Stats Widget (React)

```typescript
// Minimal stats pull for a dashboard or Farcaster frame
async function getWWStats() {
  const res = await fetch('https://wavewarz.info/api/public/stats')
  const data = await res.json()
  return {
    battles: data.total_battles,
    volume: data.total_volume_sol.toFixed(3),
    artistPayouts: data.artist_payouts_sol.toFixed(4),
  }
}
```

### Pattern 2: Farcaster Frame (Vercel + Next.js)

```typescript
// app/api/frame/route.ts — stats frame endpoint
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const stats = await fetch('https://wavewarz.info/api/public/stats').then(r => r.json())
  
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${process.env.VERCEL_URL}/api/frame/image?battles=${stats.total_battles}&vol=${stats.total_volume_sol}" />
        <meta property="fc:frame:button:1" content="Battle Now" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://wavewarz.info" />
      </head>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } })
}
```

See doc 1692 for the full Farcaster mini-app build spec.

### Pattern 3: Discord Bot (!stats command)

```javascript
// discord.js command handler
client.on('messageCreate', async (message) => {
  if (message.content === '!stats') {
    const stats = await fetch('https://wavewarz.info/api/public/stats').then(r => r.json())
    message.reply(
      `WaveWarZ Live Stats\n` +
      `Battles: ${stats.total_battles.toLocaleString()}\n` +
      `Volume: ${stats.total_volume_sol.toFixed(3)} SOL\n` +
      `Artist Payouts: ${stats.artist_payouts_sol.toFixed(4)} SOL\n` +
      `Battle now: wavewarz.info`
    )
  }
})
```

### Pattern 4: ZOE (Claude API + Tool Use)

ZOE pulls stats as a tool call when asked about current numbers. The tool definition:

```json
{
  "name": "get_wavewarz_stats",
  "description": "Get real-time WaveWarZ platform statistics",
  "input_schema": {
    "type": "object",
    "properties": {}
  }
}
```

Tool implementation: `fetch('https://wavewarz.info/api/public/stats').then(r => r.json())`

ZOE uses the `artist_payouts_sol` field to answer questions like "how much have artists earned?" and `total_battles` for "how many battles?"

---

## ZABAL S2 Builder Integrations (Sep–Nov 2026)

For ZABAL Track B builders, common integration starting points:

| Use case | Endpoint | Notes |
|----------|----------|-------|
| Stats dashboard | `/stats` | No auth, instant |
| Live battle tracker | `/battles` | Poll every 60s; respect rate limit |
| Artist earnings calculator | `/battle/:id` (all battles for an artist) | Filter by artist audius handle |
| Settlement notifier | Helius webhook → `/battles` | See doc 1692 §ZOE Integration for Helius pattern |

**ZABAL builder tip:** The Helius webhook (doc 1692) fires on WaveWarZ contract events. Use it to push notifications instead of polling — more efficient and no rate limit concerns.

---

## Rate Limits

**Current (Jul 2026):** No documented rate limit on the public API. Be considerate — don't hammer the endpoint.

**Recommended polling interval:** No faster than every 30s for live displays. For batch data pulls, fetch once and cache.

**If rate limited:** Contact Hurricane (@bettercallzaal or ZAO Telegram Ops) for a dedicated API key or to discuss caching strategies.

---

## Solscan Integration (Settlement Verification)

For displaying on-chain proof of artist payouts, combine the WaveWarZ API settlement data with Solscan:

**URL pattern:** `https://solscan.io/tx/{SETTLEMENT_TX_HASH}`

The settlement TX hash comes from the WaveWarZ battle data after `status === "settled"`. This is the proof-of-payout link used in:
- ZOE result posts ("TX: [Solscan link]")
- Press documentation
- Grant applications requiring on-chain evidence

---

## Audius Metadata Integration

WaveWarZ uses Audius track URLs to identify artists in battles. To resolve Audius handle → track metadata:

```
GET https://discoveryprovider.audius.co/v1/users/handle/{audius_handle}
```

Returns artist name, profile picture, follower count, and track list. Use for enriching battle displays with artist profile data.

See the Audius API docs at docs.audius.org for the full endpoint reference.

---

## Leaderboard & Handle Disambiguation

**Important:** A WaveWarZ/Audius handle is NOT the same as an artist's X handle. The platform uses Audius handles as the canonical artist identifier.

See doc `AUDIUS_MAP` (project-leaderboard-handles in memory) for the handle mapping table.

When displaying artist results, always use the Audius handle from the WaveWarZ API, not an assumed X handle.

---

## For Grant Applications

When OP Retro Funding, Fisher, or other grants ask for evidence of "open ecosystem" or "public API":

**Citable language:**
> WaveWarZ provides a public REST API at wavewarz.info/api/public/stats with no authentication required, returning real-time battle statistics, SOL volume, and artist payout data. As of July 2026: 1,245 battles settled, 523.991 SOL in volume, 9.0988 SOL in direct artist payouts. The API is used by ZABAL builders, ZOE (the ZAO AI agent), and third-party Farcaster frames.

**On-chain verification (complements the API):**
> All battle settlements are executed by the WaveWarZ Solana program. Each settlement is an on-chain transaction verifiable on Solscan. ZAO governance decisions that initiate battles are recorded on Optimism Mainnet via the OREC contract at 0xcB05F9254765CA521F7698e61E0A6CA6456Be532.

---

## Related Docs

- 1692 — WaveWarZ Farcaster Mini App Spec (primary integration using this API)
- 1644 — WaveWarZ On-Chain Settlement Mechanics (source for payout math)
- 1628 — ZAO Three-Chain Architecture (Solana + Optimism + Base context)
- 1651 — ZAO DAO Case Study (citable claims built on this API data)
- 1684 — ZAO Weekly Governance Protocol (governance that controls which battles happen)
