---
topic: business
type: decision
status: research-complete
last-validated: 2026-06-26
superseded-by:
related-docs: 572, 899, 905, 907
original-query: "research airgap.finance fully (+ Farcaster @airgap); Zaal wants ZOE to 'make an android and run a ZABAL bot token'"
tier: STANDARD
---

# 908 - AirGap as a model for a ZOE onchain agent + ZABAL token (advisory-first)

> **Goal:** Decide how ZOE should "make an android" (spawn an onchain agent) + run a "ZABAL bot token" - using AirGap (airgap.finance) as the reference. Verdict: build the agent as an ADVISOR, gate with the EXISTING ZABAL token, do NOT launch a new token.

## Key decisions (recommendations first)

| Decision | Call | Why |
|----------|------|-----|
| Copy AirGap's model? | **No - it's a cautionary tale** | $AIRGAP is dust: ~$81k mcap, ~$83/day volume, ~5 traders/day, unverified contract, anon team, no docs/audit. The *idea* (signal agents) is fine; the *execution* failed. |
| ZOE onchain agent type | **Advisory only - signals, no execution, no custody** | No fund-holding = no custody/regulatory/rug risk, and it respects rule #0 (agents never autonomously launch/trade tokens). |
| New "ZABAL bot token"? | **No - use the EXISTING ZABAL ERC-20** | A second token with no utility copies AirGap's zero-traction failure. ZABAL already exists ([[doc 572]] kept it on Base). Gate premium signals behind it. |
| When to add execution / a token | **Only after ~6 months of proven advisory traction** | Named team + audit + organic demand first. Earn it. |

## What AirGap actually is

airgap.finance / Farcaster **@airgap** (FID 3324884) / X @airgapai: **"autonomous onchain intelligence on Base"** - personalized agents for onchain traders. Configurable agents, real-time token-launch detection + a "Token Behavior Engine" scoring tokens, signals streamed via SSE, alerts routed to Telegram, portfolio view, a REST API (`/api/v1`, wallet sign-in). NOT the old AirGap self-custody wallet (Papers AG) - different project.

**$AIRGAP token:** on Base, ~$81k mcap, ~$83/day volume, ~5 traders/day (per on-chain data - plausible, verify before quoting). Tokenomics/utility not published. Contract unverified on BaseScan. Dust-level - not a successful launch.

**Clanker tie:** YES - @airgap's own cast: "grateful to have clanker behind the gappy experiment." (NOTE: the research pass first concluded "no clanker connection" off on-chain deploy data; the primary-source cast corrects that - there IS a clanker relationship. Treat the "direct Uniswap V4, not clanker" claim as unverified.)

**Traction:** extremely weak - no media, no public community, minimal engagement, dust trading. May be early/stealth or stalling.

## The ZAO path: "ZOE makes an android" (advisory-first)

**Phase 1 - advisory agent (no execution, no custody):**
- ZOE spawns an onchain agent identity (smart account or Farcaster signer) that **generates signals only** - detects/scores onchain moves, posts to Farcaster/Telegram.
- It does NOT execute trades, hold funds, or touch the ZABAL treasury. Humans act on signals if they choose. Disclaimers; team eats first losses.

**Phase 2 - gate with existing ZABAL (optional):** premium signals / agent-parameter voting behind the **existing** ZABAL token. No new token.

**Phase 3 - execution (much later, optional):** only after 6+ months of reliable signals; non-custodial (agent proposes, human approves in UI); tiny test amounts; audit first.

## Honest risks

- Signal-accuracy -> people lose money + blame ZAO (disclaimer + team-first-loss).
- A new token dumping = brand damage (don't launch one; prove value first).
- Execution/custody = regulatory + rug exposure (advisory-first dodges it).
- Building reliable autonomous agents is hard - iterate, don't overpromise returns.

## Also See

- [Doc 907](../../agents/907-agent-fleet-dashboard/) - the fleet/control surface a signal agent would plug into
- [Doc 905](../905-incented-borker-sven/) - Borker (content) vs this (signals) - different agent lanes
- [Doc 572](../572-zabal-avalanche-l1-l2-gas-token/) - $ZABAL stays an ERC-20 on Base (use it, don't relaunch)
- `bot/src/zoe/` (orchestrator), `src/lib/agents/` (existing VAULT/BANKER/DEALER trading agents - the execution pattern if Phase 3 ever happens)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide advisory-first (not AirGap-style token) | @Zaal | Decision | Now |
| Spec a ZOE "signal android" - onchain detection -> Farcaster/Telegram, no execution | @Zaal/ZOE | Build | When prioritized |
| If gating: wire premium signals to the existing ZABAL token | @Zaal | Build | Phase 2 |
| Do NOT launch a new ZABAL bot token; revisit only with proven traction + audit | @Zaal | Hold | 6mo review |

## Sources

- [FULL - keyless scout, haatz] Farcaster @airgap (FID 3324884) bio + casts - "autonomous agents for onchain traders", clanker affiliation confirmed
- [FULL] [airgap.finance](https://airgap.finance) - product nav (Agency/Signals/Portfolio/Launches/$AIRGAP), wallet sign-in
- [PARTIAL - on-chain, verify] $AIRGAP token stats (mcap ~$81k, ~$83/day vol, ~5 traders) via BaseScan/Dexscreener per research agent
- [PARTIAL - 402 blocked] X @airgapai - exists, content not fully read
- [NOT FOUND] team page, GitHub, audit, docs, media coverage - absence noted as a signal
