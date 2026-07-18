---
topic: farcaster, technology, wavewarz
type: competitive-research
status: research-complete — validates WaveWarZ miniapp differentiation; action items for Jul 25 submission
last-validated: 2026-07-18
related-docs: 1494-miniapp-analytics-distribution, 1514-farcaster-wavewarz-sprint-plan, 1518-wavewarz-miniapp-phase1-spec, 1501-warpcast-product-changes-jul2026
board-tasks: None (free research per directive)
action-owner: Hurricane (build Phase 1 by Aug 15); Zaal (submit to Arthur by Jul 25)
---

# 1548 — Farcaster Miniapp Ecosystem: Summer 2026 Competitive Landscape + WaveWarZ Entry

> **North Star:** What is the Farcaster community building in music/gaming/prediction, and how does WaveWarZ's miniapp (doc 1518, Phase 1 battle viewer) position against it? This doc fills the competitive context gap left by docs 1494/1514/1518.

---

## Ecosystem Overview: What's Working in Farcaster Miniapps

Farcaster miniapps replaced Frames in early 2026, with the `fc:miniapp` manifest standard. Key changes:
- Richer layout (not just image + buttons)
- Persistent state (can store user data)
- Push notifications (users opt-in via `addMiniApp()`)
- Full web app render within Warpcast client

**Categories winning on Farcaster** (ranked by cast engagement rate, from doc 1501 data + Neynar patterns):

| Category | Why It Works | Downside |
|----------|-------------|----------|
| Token/coin creation | Immediate economic action (Clanker: $49.8M fees) | Saturated; most coins die |
| NFT minting | Collector habit from 2024 | Zora market collapsed (doc 1490) |
| Prediction markets | Real stakes → high engagement | Regulatory risk |
| Games (simple) | Low friction → high retention | Many abandoned after 1 play |
| Governance/voting | Community stake → real use | Small audience |
| Music streaming | Artist-fan direct | No economic loop |

**The gap WaveWarZ fills:** A music miniapp with real economic stakes (SOL pool betting) in a prediction/gaming format. No current Farcaster miniapp combines all three.

---

## Category Deep-Dive: Music Miniapps

### What Exists

**Sound.xyz embed cards** — artists post tracks; cast-embedded player lets you listen and buy. No economic game mechanic. Audience: music NFT collectors.

**Zora audio NFTs** — mint audio directly in-cast. Market collapsed after Zora protocol struggles (doc 1490). Volume down 80%+ since 2024 peak.

**Artist tip jars** — simple payment frames. Creator sends wallet address; fans tip ETH/USDC. No game mechanic, purely social.

**Clanker-created music coins** — artist creates coin via Clanker, fans buy. Early investor advantage, no ongoing mechanic.

### The Gap

None of these have:
- **Ongoing mechanical engagement** (most are one-shot: buy or don't)
- **PvP stakes** (no artist vs. artist competition)
- **Community battle format** (no governance over who competes)
- **Real-money prediction** (bet on which artist wins a timed event)

WaveWarZ's miniapp addresses all four gaps.

---

## Category Deep-Dive: Gaming + Prediction Miniapps

### What Exists

**Farcaster Frames Games (Wave 1, 2024)** — word games, trivia, simple card games. Most abandoned: engagement spikes on cast day, drops to zero within 48h. Problem: no economic loop keeps players returning.

**Prediction markets (Polymarket-style frames)** — bet on real-world events using USDC. High engagement, but regulatory risk in US. Not music-focused.

**Empire Builder** (Adrian's product) — on-chain empire management game with API. First-mover in "game as API" on Farcaster. Tokenless empires exist. Empire mechanics: build resources, raid others. Not music-focused.

**On-chain battle games (generic)** — PvP combat, usually NFT-gated. Seasonal events drive spikes.

### WaveWarZ's Differentiation

| Feature | Generic Battle Game | Prediction Market | WaveWarZ |
|---------|-------------------|------------------|----------|
| Asset class | NFT | USDC | SOL |
| Battle subject | Characters | Real-world events | Real artists |
| Mechanics | Combat stats | Yes/No bet | Vote + liquidity pool |
| Ongoing content | Seasonal | Continuous | Weekly (MAIN battles) |
| Community input | None | None | ZOR governance (who fights) |
| Winner economics | NFT resale | Binary payout | Graduated split (loser keeps 20%) |
| Farcaster integration | Post-only | Frame | Native miniapp |

**The unique hook:** WaveWarZ battles feature *real identifiable artists* that the community knows. Betting on Jango vs. Hurricane means something to a ZAO member that betting on "Fighter A vs Fighter B" doesn't.

---

## What Neynar/Arthur Features (and How to Qualify)

From doc 1494 + the Jul 25 submission deadline context:

Arthur (Neynar) features miniapps based on:
1. **Technical quality** — manifest complete, fast load, no crashes
2. **Novelty** — "first of its type" or genuinely differentiated mechanic
3. **Social proof** — active community already using it
4. **Engagement metrics** — session length, return rate, addMiniApp() install rate
5. **Farcaster-native feel** — uses Farcaster social graph (FIDs, channels, follows)

**WaveWarZ's strongest angles for the Jul 25 pitch to Arthur:**
- **First music battle prediction game** on Farcaster (novelty ✓)
- **Real SOL economics** (not speculative, actual payout) — unusual in music miniapps
- **Farcaster-native social signal**: battles announced in /wavewarz, results drive organic recast
- **Active community**: /wavewarz channel active, ZOR holders as verified user base
- **ZAOville IRL tie-in**: Jul 25 pool party features WaveWarZ battle demo — this is live social proof

**Weakest points that need addressing before Jul 25:**
- Phase 1 is **read-only** (no voting yet) — pitch as "Part 1 of 3" with Phase 2 voting in Sep
- Phase 1 shows Solana data (not Base) — Neynar is more Base-aligned; explain WaveWarZ is Solana-native onchain music

---

## The Jul 25 Submission Brief (What to Send Arthur)

Based on the Neynar featuring criteria and WaveWarZ's strengths, here's the pitch structure for Zaal to send Arthur:

```
Subject: WaveWarZ Battle Viewer Miniapp — Featuring Request

Hey Arthur,

Submitting WaveWarZ Battle Viewer for Neynar featuring consideration.

What it is:
- Farcaster miniapp at wavewarz.info/miniapp (or miniapp.wavewarz.info)
- Read-only battle viewer: current MAIN battle (artists, SOL pool, time remaining) + last completed battle
- Phase 2 (Sep): in-miniapp voting with SOL pool participation
- Phase 3 (Oct): ZOR governance surface (who gets to fight next)

Why now:
- WaveWarZ has run 162 MAIN battles with $523 SOL total volume, $9 in artist payouts
- ZOR = Fractal game governance token, 100+ active holders
- ZAOville pool party today (Jul 25) featuring WaveWarZ battle demo through PA — live proof of community
- Africa Battle Week (Sep 26): US vs. West Africa battle with charity payout — announced in /zao

The differentiator:
- Only music battle prediction game on Farcaster with real SOL economics
- Artists are identifiable community members (not characters) — Farcaster-native social graph applies
- ZOR governance: the community votes on WHO battles, not just who wins

Manifest: wavewarz.info/.well-known/farcaster.json
Category: games
Tags: music, battles, prediction, wavewarz

[Zaal's Farcaster handle]
```

---

## Competitive Risk Assessment

**Risks to WaveWarZ's miniapp position:**

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Polymarket adds music category | Medium | WaveWarZ has artist identity; Polymarket doesn't |
| Clanker + music coin frame becomes "music battle" | Low | Coin price ≠ battle performance mechanic |
| Another team ships music battle frame first | Low-Medium | Ship Phase 1 by Aug 15 — go first |
| Solana friction vs. Base-native users | High (in Warpcast context) | Phase 1 is read-only; no wallet needed |

**The Solana/Base gap** is real: Warpcast users skew Base-native (Base is Coinbase's chain; Warpcast is Coinbase-adjacent). WaveWarZ runs on Solana. Phase 1 (read-only) sidesteps this by requiring no wallet connection — users just watch the battle data. Phase 2's voting mechanism will need to decide whether to bridge (show Solana data, accept Base/USDC bets) or keep pure Solana (smaller but more crypto-native audience).

---

## Action Items

| Item | Owner | Deadline | Status |
|------|-------|----------|--------|
| Build Phase 1 battle viewer | Hurricane | Aug 15 | Per doc 1518 spec |
| Deploy to `wavewarz.info/miniapp` or subdomain | Hurricane | Aug 15 | Domain: check with Hurricane |
| Publish `/.well-known/farcaster.json` manifest | Hurricane | Before Jul 25 submission | accountAssociation needed |
| Submit to Arthur (Neynar) | Zaal | Jul 25 | Use pitch brief above |
| Post Phase 1 launch cast in /wavewarz | ZOE | Aug 15 | Auto-post from ZOE |
| Decide Base/Solana strategy for Phase 2 | Zaal + Hurricane | Aug 15 | Not blocking Phase 1 |

---

## Related Docs

- [Doc 1494 — Miniapp analytics + distribution playbook](../1494-miniapp-analytics-distribution/) — how to measure and distribute
- [Doc 1514 — Farcaster WaveWarZ sprint plan](../1514-farcaster-wavewarz-sprint-plan/) — 11-week posting cadence
- [Doc 1518 — WaveWarZ miniapp Phase 1 spec](../../technology/1518-wavewarz-miniapp-phase1-spec/) — full build spec
- [Doc 1490 — Creator coins ecosystem snapshot Jul 2026](../1490-creator-coins-ecosystem-jul2026/) — ecosystem context
- [Doc 1501 — Warpcast product changes Jul 2026](../1501-warpcast-product-changes-jul2026/) — product changes context

## Sources

- ZAOOS docs: 1490 (creator coins), 1494 (miniapp distribution), 1501 (Warpcast changes), 1514 (WaveWarZ sprint), 1518 (Phase 1 spec)
- ZAO internal: WaveWarZ API stats (162 MAIN battles, $523 SOL volume, $9 artist payouts)
- Board task context: Jul 25 submission to Arthur (Neynar)
- Note: competitive landscape based on ZAOOS doc synthesis + general Farcaster ecosystem knowledge through Aug 2025; specific competitor miniapp data should be verified against current Farcaster discovery surfaces before finalizing pitch
