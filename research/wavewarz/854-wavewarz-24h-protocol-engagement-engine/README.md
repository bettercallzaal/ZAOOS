---
topic: wavewarz
type: decision
status: draft
last-validated: 2026-06-13
superseded-by:
related-docs: 839, 842, 778
original-query: "WaveWarZ idea (voice-captured 2026-06-13): 10 battles/day, 20 songs, open 24h for anyone to place picks anytime (back a side, or play both sides just to make money), live settlement window 8:30-8:45pm EST, players can decide on the fly or let their AI agent ride it. WaveWarZ protocol is the focus - the engine that pulls people onto the protocol and leverages the other toolings. Captured as part of the Fellenz brand/org work - 'it's all 1.'"
tier: STANDARD
---

# 854 — WaveWarZ 24h Protocol: The Always-On Engagement Engine of The ZAO

> **Goal:** Capture Zaal's 24h-battle protocol concept AND make explicit why it is not a separate WaveWarZ feature - it is the operational engine of the brand hierarchy the Fellenz critique (doc 839) and the org chart (doc 842) described. WaveWarZ is the always-on door that pulls outsiders into The ZAO. "It's all 1."

## Key Decisions (the framing to lock)

| # | Decision | Why |
|---|----------|-----|
| 1 | WaveWarZ shifts from a **live-only event** to an **always-on 24h market with a live settlement heartbeat** (8:30-8:45pm EST) | Makes "outsiders come in and engage" true at any hour, not just one window - the thing Fellenz praised WaveWarZ for |
| 2 | The WaveWarZ protocol is **the fan/player door** of the ZAO ecosystem; ZABAL Games is the **builder door**; both feed The ZAO umbrella | This is the org chart (doc 842) made operational - "protocol is the focus" because it is the flywheel |
| 3 | Two play modes ship as one system: **be present + decide on the fly** OR **let your AI agent ride it** | The agent path IS the agentic Base build (doc 741/wwbase) - unify human play and agent play under one protocol |
| 3b | **Chain = Base. Agent bets via x402. Onramp = a simple bridge.** (Confirmed Zaal 2026-06-13) | x402 lets ANY agent walk up and place bets before or during a battle - the open-access agent door. A simple bridge gets funds onto Base. **Candytoybox (Samantha) has already shipped the Base testnet contracts**, matching the wwbase brief's "deployed + verified on Base Sepolia." Solana was the prior live proof; the 24h protocol is built on Base |
| 4 | "Play both sides just to make money" = TODAY just the **loser-pool refund** (losers get partial money back), NOT a true two-sided market | Confirmed by Zaal 2026-06-13: no two-sided market-making exists yet. A real side-agnostic "arb the curve" mechanic is an OPEN design question, not a shipped feature - do not market it as arb |
| 5 | Frame this in the WaveWarZ brand + the Fellenz reply as **the concrete answer to challenge #7 ("where do I plug in?")** | The brand cleanup said what the pieces are; this says how a stranger becomes a participant |

## The concept (as captured)

Each day:
- **10 battles, 20 songs.** Each battle = two songs head to head.
- **Open for 24 hours.** Any person, any time in the day, can:
  - listen to any of the 20 songs,
  - place a pick on the side they think wins, OR
  - **play both sides** if they don't care who wins (today this just softens losses via the **loser-pool refund** - it is NOT true arb / two-sided market-making yet; see open question 1).
- **Live settlement window 8:30-8:45pm EST** - the quick battles actually run and resolve. The "event" is now the heartbeat of an all-day market, not the whole thing.
- **Two ways to play, your choice:**
  - **Present:** come back at 8:30, watch, and make decisions on the fly - react to the song, how it's changing, how the charts are moving.
  - **Agentic:** let your AI agent ride it whether you show up or not. Set it and let it go.
- **The point:** get people onto the **WaveWarZ protocol**. The protocol is the focus; it leverages the other ZAO toolings (Audius catalog, Farcaster/X distribution, the agent stack).

## Why it's "all 1" (the connection to the Fellenz work)

The Fellenz critique (doc 839) and the org chart (doc 842) established the brand hierarchy: **The ZAO is the umbrella; WaveWarZ is the incubated project that pulls in outside participants; ZABAL Games is the outsider-facing builder program.** Fellenz explicitly named WaveWarZ the *good* model - "those people are not members of the Zao, it's people coming in and engaging" - and his open challenge #7 was the missing **entry point**: "you've built it... where do I go?"

This protocol concept is the answer to that, operationalized:

```
                         THE ZAO  (umbrella / impact network)
                                |
              +-----------------+------------------+
              |                                    |
   WaveWarZ PROTOCOL                        ZABAL GAMES
   the always-on door for                   the always-on door for
   FANS / PLAYERS                           BUILDERS
   (listen, pick, or let your               (come in, build, ship,
    agent ride - any hour)                   learn from mentors)
              |                                    |
              +----------------+-------------------+
                               |
                  outsiders become participants
                  -> they are now in The ZAO
```

- "Protocol is the focus" = the protocol is the **flywheel** that converts a stranger into an engaged participant with the lowest possible friction (no membership, plug in any hour, or just point an agent at it).
- It leverages the other toolings, which is the ZABAL-toolstack-serves-The-ZAO point from the org chart: the agent stack, Audius catalog, and distribution rails all exist to feed the protocol's two doors.
- So the brand cleanup (what the pieces are) and this protocol (how people enter) are one system. Capturing it here keeps the Fellenz body of work whole.

## Open design questions (to resolve before it's a spec)

1. **Liquidity / "both sides to make money":** RESOLVED for now (Zaal, 2026-06-13) - today "play both sides" is just the existing **loser-pool refund** (losers recoup part of their stake), NOT two-sided market-making. Open part: do we WANT a real side-agnostic market-maker role (two-sided liquidity / LP rewards) for the 24h market? On a single bonding curve, buying both sides pays spread both ways and nets a loss without a real AMM or opposing-pool structure - so "arb the curve" is not free and is not built. Decide whether to design it or keep the loser-pool refund as the only "make money either way" path.
2. **24h price discovery vs a 15-min settlement:** if picks are open all day but battles resolve in a 15-min window, what is the price path during the day vs at settlement? Is there continuous trading or a daily clearing?
3. **Agent autonomy bounds:** budget caps per agent per day, which signals it trades on (song, chart movement, social), and how a present human overrides their agent mid-battle.
4. **Song sourcing for 20/day:** where do the 20 songs come from each day (Audius catalog, artist submissions, ZAO roster)? This is also the artist on-ramp.
5. **Chain:** RESOLVED (Zaal, 2026-06-13) - **Base.** Agent bets go through **x402** (any agent can walk up and place bets before/during a battle); onramp via a **simple bridge**; **Candytoybox already shipped the Base testnet contracts**. Solana stays the prior live proof, but the 24h protocol is built on Base. Remaining sub-question: which bridge, and whether Solana liquidity migrates or the two co-exist.

## Also See

- [Doc 839](../../events/839-fellenz-brand-org-strategy/) - the Fellenz critique (WaveWarZ as the good model; entry-point challenge #7)
- [Doc 842](../../business/842-zao-org-chart-brand-hierarchy/) - the org chart this operationalizes
- [Doc 778](../../community/778-zabal-games-magnetic-build/) - ZABAL Games, the builder door (paired with this fan door)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide: brainstorm this into a full protocol spec (mechanics + the 5 open questions) | Zaal | Brainstorm | When ready |
| Fold the "WaveWarZ = always-on fan door" framing into the WaveWarZ brand brief (wwbase) | Zaal | PR | After Fellenz brand PRs land |
| Use this as the concrete entry-point answer in the Fellenz reply (challenge #7) | Zaal | Doc | When writing the reply |
| Chain RESOLVED: Base + x402 + simple bridge; Candy's Base testnet contracts exist. Open sub-task: pick the bridge | Zaal + Candytoybox | Decision | Before mainnet |

## Sources

- Voice capture from Zaal, 2026-06-13 (this session) `[FULL]` - the concept, verbatim intent preserved in original-query
- [Doc 839 - Fellenz brand/org critique](../../events/839-fellenz-brand-org-strategy/) `[FULL]` - WaveWarZ-as-good-model + entry-point challenge
- [Doc 842 - ZAO org chart](../../business/842-zao-org-chart-brand-hierarchy/) `[FULL]` - brand hierarchy this operationalizes
