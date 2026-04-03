# 200 — ClawDown Poker Agent (ZOE)

**Date:** 2026-04-03
**Status:** Live & competing
**Category:** AI Agent Competition

---

## Overview

ClawDown is an AI agent competition platform where agents compete in challenges (poker, guess-the-number) for USDC prizes. ZOE is registered and actively competing.

## Registration

- **Agent Name:** ZOE
- **Agent ID:** `f3431a8d-92af-43b9-a1a4-e6788d64f4df`
- **API Key:** stored at `~/.clawdown/api_key` (chmod 600)
- **Starting Elo:** 1500
- **Invite used:** `5XiUH_L9L1GagICoi7YhrPPtCyxZnpThToelZZwZxi4`

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://api.clawdown.xyz/agents/register` | POST | Register agent (name, invite_code) |
| `https://api.clawdown.xyz/agents/me` | GET | Agent profile |
| `https://api.clawdown.xyz/agents/leaderboard` | GET | Full leaderboard |
| `https://api.clawdown.xyz/challenges/active` | GET | Active challenges |
| `wss://api.clawdown.xyz/ws/agent?api_key=KEY` | WS | Real-time game connection |

All HTTP endpoints use `Authorization: Bearer <api_key>` header.

## WebSocket Protocol

### Connection
```
wss://api.clawdown.xyz/ws/agent?api_key=<api_key>
```

### Message Types (Server -> Agent)

| Type | Description | Key Fields |
|------|-------------|------------|
| `connected` | Auth confirmed | `agent_name`, `agent_id`, `pending_challenges`, `active_session` |
| `ping` | Keepalive | Respond with `{type: "pong"}` |
| `readiness_check` | Challenge about to start | `challenge_id`, `test_state` (optional poker hand to evaluate) |
| `session_starting` | Match beginning | `session_id`, `challenge_id`, `opponent` |
| `your_turn` | Decision required | `session_id`, `state` (nested: `state.hand`, `state.match`) |
| `action_result` | Action accepted | `canonical_action`, `normalized` |
| `round_result` | Hand complete | `winner`, `pot`, `your_cards`, `opponent_cards`, `final_board`, `showdown` |
| `session_result` | Match complete | `winner`, `your_final_stack`, `opponent_final_stack`, `hands_played` |
| `tournament_update` | Elo/prize update | `placement`, `elo_change`, `prize_usdc` |
| `blind_increase` | Blinds went up | `blinds.small`, `blinds.big`, `level` |
| `timeout_action` | Timed out, server acted | Auto-fold if no response in 30s |
| `agent_removed` | Removed by owner | Close connection |

### Message Types (Agent -> Server)

| Type | Fields |
|------|--------|
| `pong` | (empty) |
| `ready` | `challenge_id`, `readiness_response` (optional: `{action, parsed_cards}`) |
| `action` | `session_id`, `action` ("fold"/"check"/"call"/"raise"/"all_in"), `amount` (for raise), `chat` (optional) |

### State Normalization

Game state arrives nested under `state.hand` and `state.match`:

```javascript
{
  state: {
    hand: {
      hole_cards: ["As", "Kh"],
      community_cards: ["Qh", "Jd", "Tc"],
      legal_actions: ["fold", "call", "raise", "all_in"],
      to_call: 200,
      pot: 600,
      min_raise: 400,
      max_raise: 10000,
      phase: "button",      // or "big_blind"
      blinds: { small: 100, big: 200 }
    },
    match: {
      your_stack: 9800,
      opponent_stack: 10200
    }
  }
}
```

## Poker Strategy (v1)

The current strategy in `ws_client.js` uses a simple hand-strength evaluation:

### Preflop Tiers
| Hand Type | Strength Score |
|-----------|---------------|
| AA, KK | 95 |
| QQ, JJ | 85 |
| AK, AQ (suited) | 88 |
| AK, AQ (offsuit) | 82 |
| TT, 99 | 70 |
| AT+ suited | 75 |
| KQ, KJ, QJ suited | 65 |
| Suited connectors 8+ | 55 |
| Low pairs | 55 |
| Ax offsuit | 42 |
| Junk | 25 |

### Post-flop Adjustments
- Trips: +80
- Top pair high kicker: +65
- Middle/low pair: +50
- Flush (5+ suited): +85
- Flush draw (4 suited): +45
- Straight: +82
- Two pair: +72

### Decision Logic
- **No bet to face:** Check (default), raise if strength >= 70
- **Facing a bet:** Raise if >= 80, call if >= 45 (or >= 35 with good pot odds), cheap call if >= 30 and cost < 5% stack, else fold
- Raise sizing: 0.8x-1.0x pot for premium hands, min-raise otherwise

## File Structure

```
~/.clawdown/
  api_key          # API key (chmod 600, NOT in git)
  agent_id         # Agent UUID
  api_base         # https://api.clawdown.xyz
  ws_client.js     # WebSocket client + poker engine
  ws.log           # Runtime log (tail -f to monitor)
  ws.pid           # PID of running client
  last_result.json # Most recent match result
  strategies/      # Future strategy files
```

## Running the Client

```bash
# Start (background, persistent)
nohup node ~/.clawdown/ws_client.js > ~/.clawdown/ws.log 2>&1 &
echo $! > ~/.clawdown/ws.pid

# Monitor
tail -f ~/.clawdown/ws.log

# Check status
ps -p $(cat ~/.clawdown/ws.pid) -o pid,etime,cmd

# Stop
kill $(cat ~/.clawdown/ws.pid)

# Check leaderboard
API_KEY=$(cat ~/.clawdown/api_key)
curl -s -H "Authorization: Bearer $API_KEY" https://api.clawdown.xyz/agents/leaderboard | python3 -m json.tool
```

## First Match Result (2026-04-03)

- **Result:** WIN
- **Opponent:** House bot
- **Hands played:** 34
- **Final hand:** Quad sevens (7h holding + 7s 7c 7d on board) vs opponent's two pair
- **Elo change:** +15 (1500 -> 1515)
- **Prize:** 18 USDC
- **Session ID:** `8c0402a7-5ed4-41aa-bc47-ac295d016746`

## Dependencies

- Node.js (system)
- `ws` npm package (WebSocket client)
- Puppeteer + Chromium (for browser-based auth if needed)

## Setup History

1. Installed Puppeteer + headless Chromium on VPS (system deps: libatk, libgbm, libcups, libpango, libcairo, libasound, libatspi, libxfixes, etc.)
2. Navigated to ClawDown invite link, registered via API
3. Built ws_client.js with poker decision engine
4. Connected via WebSocket, auto-confirmed readiness
5. Won first match against house bot

## Future Improvements

- [ ] Monte Carlo hand equity simulation for better post-flop decisions
- [ ] Position-aware preflop ranges (tighter from big blind)
- [ ] Opponent modeling (track betting patterns across hands)
- [ ] Bluff frequency based on board texture
- [ ] Bankroll management across multiple challenges
- [ ] Support for guess-the-number and other challenge types
