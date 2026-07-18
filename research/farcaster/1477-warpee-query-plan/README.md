---
topic: farcaster, business
type: plan
status: pending-approval
last-validated: 2026-07-18
related-docs: 1095-farcaster-dead-revival-sparkz-timing, 1094-empire-builder-clanker-farcaster-deep-dive-jul14, 1132-zooster-boostr-zabal-leaderboard
original-query: "Warpee Knowledge API query plan - GM Farcaster podcast knowledge vs our repos"
tier: PLAN
---

# 1477 - Warpee Query Plan: GM Farcaster Podcast Knowledge vs ZAO Products

> **What:** Prioritized list of queries to run against the Warpee API (`POST api.gmfarcaster.com/v1/query`) — the GM Farcaster Knowledge API over hundreds of podcast episodes/transcripts. Each query costs $0.005 USDC via x402 on Base. This plan surfaces the gap Warpee fills: **podcast ecosystem sentiment** (what builders and creators say on-air) vs our existing web/technical research.
>
> **Total cost:** 10 queries × $0.005 = **$0.05 USDC**
>
> **Gate:** Requires Zaal to fund an x402 wallet and set a hard daily cap before any query is executed. See directive.

## Why Warpee (The Gap It Fills)

Our existing research (docs 1094, 1095, 1132, 984, etc.) is sourced from web pages, GitHub, and on-chain data. What we are missing: **what actual Farcaster ecosystem builders, creators, and hosts say in long-form conversation** — the podcast signal. GM Farcaster runs hundreds of episodes with builders across the entire ecosystem. Warpee makes this searchable with timestamped citations.

The podcast signal matters because:
- It captures real opinions builders share off-the-record that never hit docs or dashboards.
- It surfaces who the community considers credible voices on creator coins, music, agents.
- It reveals what has already been tried and why it failed, before we ship the same mistake.

## Query Plan (Prioritized)

### Tier 1: Sparkz Strategy Validation (Highest Signal)

**Q1 — Creator coin / culture coin ecosystem sentiment**
```
What have GM Farcaster hosts and guests said about creator coins, culture coins, and token launches for creators? What has worked, what has failed, and what do builders recommend avoiding?
```
*Why:* Doc 1095 gives us technical/market data. Warpee gives us the qualitative ecosystem argument — is the Sparkz "energy-first, token optional" thesis recognized and endorsed, or is it a contrarian position nobody else has landed on?

**Q2 — Token-optional and spark-first creator tools**
```
Have any guests discussed creator tools or platforms where the token is optional or comes after community momentum is built, rather than being the starting point?
```
*Why:* Directly tests whether Sparkz's core differentiation is genuinely novel or has been tried and failed (which the transcript record would show).

**Q3 — Empire Builder reputation and usage**
```
What have GM Farcaster guests said about Empire Builder — how they use it, whether it works for creators, and what its limitations are?
```
*Why:* We have the API surface (doc 1094a) but zero ecosystem opinion on whether Empire Builder is trusted, gamed, or ignored by actual creators. Influences how much to lean on it in Sparkz.

**Q4 — Clanker failure modes and what distinguishes surviving launches**
```
What have guests said about Clanker token launches that fail? What patterns distinguish tokens that retain value and community from the 90%+ that go to zero?
```
*Why:* Doc 1095 says 90%+ of Clanker tokens die. What the podcast community says about WHY is the pattern Sparkz needs to explicitly avoid and market against.

### Tier 2: Music + WaveWarZ Signal

**Q5 — Music creators on Farcaster (who and what)**
```
Which music artists, music producers, or music-focused builders have been featured on GM Farcaster or mentioned by guests as doing interesting work on Farcaster?
```
*Why:* ZOL (@zolbot) is the ZAO's music scout. This surfaces the humans ZOL should be following, quoting, and amplifying — and who we should be pitching Sparkz to first.

**Q6 — Music monetization models guests have endorsed**
```
What have GM Farcaster guests said about monetizing music on-chain — what models do they believe in (streaming royalties, NFTs, fan tokens, battles, live experiences) and which have they seen work?
```
*Why:* WaveWarZ (music battles, 524 SOL volume) and Sparkz (creator backing) both need the "music monetization" narrative. This tells us which framing resonates with the podcast-listening builder community.

**Q7 — Music battle platforms or prediction-market-style fan products**
```
Have any guests discussed platforms where fans trade on or bet on music outcomes — battles, chart positions, or similar fan-participation products for music?
```
*Why:* Tests whether WaveWarZ's core mechanic (fan trading on song battles) has been discussed favorably or critically by ecosystem voices. Reveals competitive landscape and potential partners.

### Tier 3: Agent/Bot + ZAO Awareness

**Q8 — AI agents and bots on Farcaster creating real value**
```
What have guests said about AI agents or bots on Farcaster that are actually useful or valuable to the community, rather than spammy? What makes the difference?
```
*Why:* ZOL is a Farcaster bot. The podcast record will tell us what community norms distinguish credible bots from spam — and who the respected voices on this topic are.

**Q9 — ZAO, ZABAL, WaveWarZ, or Sparkz mentions**
```
Have the ZAO, ZABAL, WaveWarZ, or Sparkz been mentioned on any GM Farcaster episodes? What was said?
```
*Why:* Baseline awareness check. If we have been mentioned, we need to know what frame the ecosystem has placed on us. If not, we know our awareness gap.

### Tier 4: People to Connect With

**Q10 — Builders to connect with on music + creator monetization**
```
Who are the guests or names mentioned on GM Farcaster who are most focused on music, creator monetization, or building tools for independent artists on Farcaster or Base? Who should we reach out to?
```
*Why:* Human connections with ecosystem credibility. One warm intro from someone trusted in this circle is worth more than 100 cold casts.

## Cost Summary

| Tier | Queries | Cost |
|------|---------|------|
| Tier 1 (Sparkz validation) | Q1–Q4 | $0.020 |
| Tier 2 (Music + WaveWarZ) | Q5–Q7 | $0.015 |
| Tier 3 (Agent + ZAO awareness) | Q8–Q9 | $0.010 |
| Tier 4 (People) | Q10 | $0.005 |
| **Total** | **10 queries** | **$0.050** |

## Execution Notes

- **Payment method:** x402 on Base (gasless via EIP-3009). Needs USDC on Base in an authorized wallet.
- **Alternative (free):** Tag `@warpee.eth` on Farcaster for same-knowledge-base responses. No setup. Zero cost. Slower (async) and unstructured. Could prototype 1–2 questions here to validate answer quality before funding the API.
- **MCP option:** `npx -y gmfarcaster-mcp` to add as a Claude Code tool — then queries run natively in session. This would be the right integration if Zaal approves ongoing use.
- **Output format:** Research docs to `research/farcaster/` (PR-only, never push main, never touch a shared clone).
- **Receipt log:** Every query + response + cost logged in `research/farcaster/1471-warpee-receipts/` once approved.

## Gate Checklist

- [ ] Zaal reviews this plan and approves query list
- [ ] x402 wallet funded with USDC on Base
- [ ] Hard daily cap set (suggest $0.25/day = 50 queries max)
- [ ] MCP or API key wired into session
- [ ] Execute Tier 1 first, report findings, then proceed

## Free Path While Waiting

Tag `@warpee.eth` on Farcaster with Q9 (ZAO/ZABAL/WaveWarZ mentions) — zero cost, tests the knowledge base in 10 minutes, tells us our ecosystem awareness baseline before spending anything.
