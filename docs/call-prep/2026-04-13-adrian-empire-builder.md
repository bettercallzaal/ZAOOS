# Call Prep: Adrian (Empire Builder) - Sunday Apr 13, 6 PM EST

## Quick Context

**Adrian** is building Empire Builder V3 with new API endpoints for distribute and burn operations, timed for Farcon. Empire Builder is already embedded in ZAO OS at `zaoos.com/ecosystem` via iframe (whitelisted, needs `www.` prefix). The goal of this call is to align on a deeper integration between Empire Builder V3 and the ZABAL token stack.

---

## Agenda (suggested 30-45 min)

1. V3 overview - what's new, what's shipping for Farcon
2. API endpoints - distribute, burn, leaderboard query
3. Agent integration - can VAULT/BANKER/DEALER call these directly?
4. Custom ZABAL leaderboard within Empire Builder
5. Webhook/event feed for staking and burn events
6. Next steps + timeline

---

## What We Need from Empire Builder V3

| Need | Use Case |
|------|----------|
| Distribute API | Reward contributors (COC Concertz promoters, fractal participants) programmatically |
| Burn API | Auto-burn 1% on every agent trade (VAULT/BANKER/DEALER) |
| Leaderboard / staking query | Pull multiplier data into ZAO OS - SongJam already uses `empireMultiplier` |
| Webhooks / event feed | Trigger downstream logic when staking, burn, or distribute events fire |
| Agent-callable endpoints | Allow on-chain agents to call distribute/burn directly without a human in the loop |
| Custom ZABAL leaderboard | Branded leaderboard inside Empire Builder showing ZABAL holders + stakers |

---

## Key Questions for Adrian

1. **Auth model for V3 API** - API key, wallet sig, or OAuth? What are the rate limits?
2. **Burn endpoint** - Does it accept a `from` address and `amount`? Can an agent wallet call it trustlessly, or does it require a whitelisted caller?
3. **Distribute endpoint** - Single recipient or batch? Any minimum amounts or gas abstraction?
4. **Leaderboard API** - Can we query by token contract address (`0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07`) to get all stakers, balances, and multipliers?
5. **Webhooks** - What events are supported? POST to a URL we control, or a polling endpoint?
6. **Custom leaderboard** - Is this self-serve config in V3 or does it require manual setup on your end?
7. **iframe update** - Do we just add `www.` to fix the embed, or is there a V3 URL we should point to?
8. **Farcon timeline** - What's the hard ship date? Do we need to be on V3 before or after?

---

## What ZAO Brings to the Table

- **3 autonomous agents (VAULT/BANKER/DEALER)** creating daily ZABAL volume on Base - real, programmatic token activity, not manual
- **13+ COC Concertz promoters** earning ZABAL for content creation - active reward distribution use case ready to go
- **Knowledge graph + oracle** for outcome-based rewards (contributor scores, fractal Respect points feeding into token distributions)
- **SongJam leaderboard** already consuming `empireMultiplier` - live integration today
- **100+ member Farcaster community** in `/zao` channel - promotion and word-of-mouth for Empire Builder
- **Integration already live** at `zaoos.com/ecosystem` - we're already shipping this together

---

## Technical Details

**ZABAL token:** `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` (Base mainnet)

**Agent wallets** (Privy TEE-secured, not env var keys):
- VAULT - treasury management
- BANKER - liquidity and distribution
- DEALER - trading and burns

**Current Empire Builder touchpoints in ZAO OS:**
- `zaoos.com/ecosystem` - iframe embed (fix: add `www.` prefix)
- `SongJam` leaderboard - reads `empireMultiplier` field

**Desired agent flow for burns:**
```
Agent trade executes on Base
  -> calculate 1% burn amount
  -> call Empire Builder burn endpoint
  -> log burn event to Supabase
  -> broadcast to /zao Farcaster channel
```

**Desired flow for contributor rewards:**
```
COC Concertz promoter submits content
  -> oracle scores outcome (views, engagement, conversions)
  -> knowledge graph updates contributor score
  -> call Empire Builder distribute endpoint
  -> update leaderboard
```

---

## iframe Fix (Action Before Call)

The embed at `zaoos.com/ecosystem` needs the `www.` prefix. Quick fix - confirm exact V3 URL format with Adrian and update the embed URL in ZAO OS.

---

## Follow-ups / Commitments to Track

- [ ] Confirm V3 API docs / sandbox access after call
- [ ] Update iframe URL with `www.` prefix (or V3 URL)
- [ ] Test distribute + burn endpoints against ZABAL contract
- [ ] Wire BANKER agent to call burn endpoint post-trade
- [ ] Set up webhook receiver endpoint in ZAO OS (`/api/empire-builder/webhook`)
- [ ] Share ZAO OS GitHub / integration notes with Adrian if helpful
