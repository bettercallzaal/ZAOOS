---
topic: business
type: decision
status: draft
last-validated: 2026-07-29
related-docs: 1098, 2101, 2119
original-query: "Prep a full doc on Zoostr to send to cashlessman: launch it via Clanker (waiting for v5), tokenomics 50% creator vault / 25% LP (Trinity) / 1% to boostr leaderboarders; artist/builder/creator tracks via submissions+voting; /zao-research Trinity."
tier: STANDARD
---

# 2121 - Zoostr launch plan (draft for cashlessman)

> **Goal:** A shareable, grounded plan for the Zoostr launch - the first Sparkz creator-coin - covering tokenomics, the boostr airdrop snapshot, the Trinity LP rail, Clanker v5, and the artist/builder/creator track mechanic. This is a DRAFT for Zaal to review + send to cashlessman; the launch itself is Zaal's on-chain action.

## What Zoostr is

Zoostr is the **first launch on Sparkz** - the ZAO's creator-coin launcher (public repo `bettercallzaal/sparkz`, doc 1098). The launch doubles as a live experiment: engagement on ZABAL Gamez posts (via boostr) becomes the on-chain-rewarded contributor set, and three tracks (artist / builder / creator) invite the wider Farcaster audience in.

## Tokenomics (as Zaal specified - one gap flagged)

| Allocation | Share | Mechanism |
|---|---|---|
| **Creator vault** | **50%** | Locked creator vault (confirm: whose - the Zoostr creator's) |
| **Liquidity (Trinity)** | **25%** | Paired LP via Trinity Protocol (see below) |
| **Contributor airdrop** | **1%** | To the boostr leaderboard snapshot (~53 contributors) |
| **Unallocated - DECISION NEEDED** | **~24%** | Not yet assigned - see open decision |

**Open decision (the ~24%):** 50 + 25 + 1 = 76%. The remaining ~24% needs a call - candidates: public buy / open supply, more locked to the ZAO (the ~25%-ZAO pattern from the Sparkz plan), or a reserve to airdrop across the three tracks (artists/builders/creators who submit). Recommend splitting it deliberately, not leaving it implicit.

## The boostr experiment + the 1% snapshot

The "huge wave of likes on ZABAL Gamez posts" is **boostr** (`boostr.itscashless.com`, by cashlessman) - a Farcaster contributor-boosting system. Current snapshot (`/api/zabaal/stats`, 2026-07-29):
- **53 all-time / 52 active contributors** · 2,705 likes generated · 81 casts liked.
- Top by reach: @cashlessman.eth (9.1k), @smshakil (6.9k), @shamimarshad (6.1k), @zaal (3.4k), @liadavid (3.3k)...

**The 1% airdrops to this contributor set.** Engaging with ZABAL Gamez posts = becoming a boostr contributor = qualifying for the airdrop. Empire Builder boosters layer on top (fun boosters that amplify contributor standing). This is why the post invites people to engage - engagement IS the entry.

## The LP rail: Trinity Protocol (the /zao-research)

**Trinity Protocol = "Multi-Pool Token Liquidity on Base."** From the demo: it deploys a **TRINI-paired burn curve** for your token, owned by your wallet - **trading fees on the TRINI side come to you; the paired token side burns** on trades. So Zoostr's 25% LP would go into a Trinity multi-pool structure paired with TRINI, giving Zoostr a fee stream (TRINI-side fees) + a deflationary burn on the Zoostr side. Fits the Sparkz "creator earns from their coin's activity" model.
*(Trinity's site is a JS app that 403s to plain fetch; this is from the live demo + the earlier /demo view. Source PARTIAL - confirm the exact fee-split + TRINI dependency with the Trinity team before committing the 25%.)*

## Launch rail: Clanker v5 (waiting)

Launch is via **Clanker, gated on v5.** v5's key feature (per the James/Fractal call, doc 2101) is **changeable fee recipients after the fact** - which is what makes the creator-vault + cross-token fee mechanics work cleanly. So "launch today" is really **"ready to fire the moment v5 ships."** Prep everything now; execute on v5.

## The three tracks - tap in via submissions + voting

A Farcaster user "taps into" a track by **showing commitment**, not just a like:
- **Submit** as an artist / builder / creator (a submission = your entry into that track), OR
- **Vote** on submissions you like ("come vote for the submissions you're into").

So the funnel is: engage (boostr like) -> the post invites you -> you submit or vote in a track -> that commitment is what a track membership means. This needs a lightweight submissions + voting surface (a frame, or the existing ZABAL submission flow reused).

## The Farcaster post (draft)

> if you've noticed a wave of likes landing on posts tagged zabal gamez lately - that's me, running an experiment. if it's noise for you, mute "zabal gamez," no hard feelings.
> but if you're an **artist, a builder, or a creator**, i'd love for you to tap in. three tracks, one for each - submit what you're working on, or come vote for the submissions you're into. that's how you get in.

*(Zaal posts it - public content is his to send. Refine the CTA once the submissions/voting surface is decided.)*

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide the unallocated ~24% (public / ZAO-lock / track-airdrop) | @Zaal | Decision | before launch |
| Confirm Trinity's exact fee-split + TRINI dependency with their team before committing 25% LP | @Zaal | Research | before launch |
| Confirm the creator-vault recipient (whose 50%) | @Zaal | Decision | before launch |
| Send this doc to cashlessman for the boostr/airdrop coordination | @Zaal | Outbound | today |
| Stand up (or reuse) a submissions + voting surface for the 3 tracks | @Zaal | Build | before the post drives traffic |
| Fire the Clanker launch when v5 ships | @Zaal | On-chain | on v5 |

## Also See

- [Doc 1098](1098-sparkz-configurable-ai-advisor/) - Sparkz (Zoostr is its first launch)
- [Doc 2101](../events/2101-fractal-sparkz-tokenomics-james-festival3/) - Clanker v5 fee-recipient mechanics (James)
- [Doc 2119](2119-casberi-one-place-for-your-apps/) - accountless.eth / Farcaster-native builders context

## Sources

- boostr snapshot: `GET https://boostr.itscashless.com/api/zabaal/stats` (2026-07-29) [FULL - 53 contributors, the airdrop set]
- [trinity-labs.org](https://trinity-labs.org/) - "Trinity Protocol - Multi-Pool Token Liquidity on Base" [PARTIAL - JS app 403s to fetch; mechanism from the live /demo (TRINI-paired burn curve, fees-to-you, token-burns). Confirm specifics with the team.]
- Zaal's launch spec (this session's grill answers): 50% vault / 25% Trinity LP / 1% boostr contributors; tracks via submissions+voting; Clanker v5. [FULL]
