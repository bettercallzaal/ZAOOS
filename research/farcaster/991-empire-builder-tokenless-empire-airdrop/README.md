---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-07-07
superseded-by:
related-docs: 987, 84, 527, 073
original-query: "/zao-research on Empire Builder including the two ZABAL Gamez workshop recordings (zabalgamez.com/recordings/1 + /2). Goal: use Empire Builder (Zaal is a partner; it's white-label) to run the $zaalcaster airdrop leaderboard mechanic - engage 3-5 launch casts -> climb leaderboard -> earn a 1% airdrop."
tier: DISPATCH
---

# 991 - Empire Builder: Tokenless Empires + the Leaderboard-Airdrop Mechanic

> **Goal:** How to use Empire Builder (white-label, Zaal is a partner) to run the $zaalcaster airdrop as an engagement leaderboard - and the bigger strategic call it forces: launch the token now, or run the Triple A "tokenless first" path.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Token now vs tokenless-first | STRONGLY consider tokenless-first (Triple A) | Empire's own co-founder (yerbearserker) built the whole ZABAL Gamez workshop on "don't launch a token yet." Matches doc 987's graveyard lesson. Erases nearly all of Zaal's Monday risk (no deploy, no funds moved, no grift optics) while still shipping something real. |
| 2 | Is Empire the right engine | YES for Zaal (partner + white-label) | The docs-only research said "not turnkey, use Merkle" - but the Part 2 recording shows a live cast-reactions leaderboard + a live raffle airdrop. Ground truth beats the public docs. Partner + white-label moots the gated-API / pricing / access flags. |
| 3 | Leaderboard signal for the campaign | Empire "Farcaster" leaderboard on cast reactions across the 3-5 posts, base score x boosters | Shown live in Part 2 ("wires two leaderboards: /zabal channel activity and cast reactions"). Native. Weight quote > reply > recast > like. |
| 4 | Anti-sybil | Pre-filter by Neynar user score >= 0.55 + a verified Base address before the payout | Empire does NOT natively filter by Neynar score/power badge (confirmed by both agents). You (white-label) apply the filter in the leaderboard data you feed it. |
| 5 | Payout shape | Weighted-by-rank from an Empire treasury (SmartVault), or a raffle to qualifying ranks | Empire supports weighted / even-split / raffle payouts from an ERC-4337 SmartVault (audited, Splits-powered). The Part 2 demo ran a live Warplet raffle to NFT holders. |
| 6 | Boosters | Add a $zaalcaster (or NFT/OG-badge) holder booster once the token exists | Empire boosters = base score x multiplier for token threshold / NFT / staking. Part 2 added a live $Zabal booster (10M min, 3x). This is the "hold-for-standing" plumbing we already wanted. |

## Findings

### A. What Empire Builder is (verified via recordings + docs)
- Community hub + leaderboards + boosters + treasury + payouts for Farcaster/Base/Arbitrum projects. Runs inside Farcaster as a mini-app; every Farcaster user auto-gets an Empire profile. Domain empirebuilder.world, docs empire-builder.gitbook.io. Treasury = ERC-4337 SmartVault (non-custodial, audited, Splits-powered). Integrates with Clanker v4 for token deploy.
- **Leaderboard = base score x boosters.** Base score sources: NFT holdings, ERC-20 balance, **Farcaster activity**, CSV upload, or API. Boosters: NFT-holding, token-threshold, or staking multipliers.
- **Payouts:** weighted-by-rank, even-split, or raffle - from the treasury, on-chain via Splits.
- **Sub-empires:** "the main empire is the tree, sub-empires are the branches" - a generative connected ecosystem (relevant: a zaalcaster empire could be a sub-empire under a ZAO/ZABAL tree).

### B. The strategic reframe - "don't launch a token yet" (Triple A)
From ZABAL Gamez Workshop #1 Part 1 (yerbearserker / Jordan Oram, co-founder + chief ecosystem architect of Empire Builder):
- **Thesis:** most projects launch token-first, spike, get extracted, and collapse. Build the project + community first; the token *amplifies*, it isn't the foundation. "Sequence matters."
- **The Triple A framework:** **Assemble** (build, no token) -> **Affirm** (reward your active people - leaderboards, boosters, staking, "tactical generosity") -> **Ascend** (launch the token once the ecosystem can carry it).
- Generative not extractive (and "why Clanker"). Staking without turning the token into a security.
- Part 2 proves it works with no token: he stood up a **tokenless ZABAL Gamez empire live** and wired two leaderboards (/zabal channel activity + cast reactions), with a live raffle airdrop to DotA NFT holders and a $Zabal booster (10M min, 3x) funded from the treasury.
- **Why this matters for $zaalcaster:** Zaal's Monday plan is a token launch. Empire's own founder's advice - and doc 987's graveyard data - both say run the tokenless empire first, affirm the community, ascend later. The reply-queue + leaderboard mechanic works tokenless (points/boosters/raffles); the token becomes the amplifier once there's real activity to amplify.

### C. Can Empire run the "engage 3-5 casts -> leaderboard -> airdrop" mechanic?
- **Yes** - the Part 2 recording shows a live **cast-reactions** leaderboard being wired. (The docs-only agent said "not turnkey, no cast-specific tracking" - it was reasoning from public docs and missed the recording + partner access. Ground truth: it's done live in the workshop.)
- Native leaderboard-source options include **Farcaster** (activity), plus CSV + API for anything custom. So you can rank by reactions across a specific set of casts either natively or by feeding a computed CSV/API leaderboard.
- **Anti-sybil is on you:** Empire has no native Neynar-score / power-badge filter. Pre-filter the leaderboard set (Neynar user score >= 0.55, verified Base address, min account age ~30d) before the payout. White-label = you control that filtering layer.
- **Payout = the airdrop:** fund a SmartVault treasury with the 1% (once a token exists) and distribute weighted-by-rank or raffle to qualifying ranks. Tokenless variant: no token to drop yet - "Affirm" with points/roles/raffle of something else (Warplets, NFT, ZOLs, allowlist), and reserve the actual $zaalcaster drop for Ascend.

### D. Engagement scoring (the one design lever)
Weight by depth of advocacy, not cheap taps, over a ~7-14 day window across the 3-5 casts:
- quote-cast (5) > reply (3) > recast (2) > like (1), then multiply by Neynar user score (0.55-1.0) as the anti-sybil weight.
- Precedent: DEGEN Airdrop 1 was exactly a channel-activity leaderboard with like/recast/reply multipliers - the mechanic that drove its adoption.

### E. Where the agents disagreed (and the resolution)
- Docs-only agent verdict: "Empire not turnkey for cast-specific engagement -> use Neynar + Merkle." Valid IF you have no partner access and only public docs.
- Resolution: the recording shows cast-reactions leaderboards are a real, demoed Empire feature, and Zaal is a partner with white-label access. So Empire is the engine; Neynar is the anti-sybil pre-filter feeding it; Merkle/SmartVault is the on-chain payout Empire already wraps.

## Also See
- [Doc 987](../987-zaalcaster-support-token-growth-playbook/) - the $zaalcaster token growth playbook (this doc is the Empire-Builder execution companion)
- [Doc 84](../../agents/084-farcaster-ai-agents-landscape/) - Clanker landscape
- [Doc 527](../505-zlank-online-builder-spec/) - Zlank token-launch paths

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide token-now vs Triple-A tokenless-first for the Monday launch - blocks the whole build plan | @Zaal | Decision | 2026-07-09 |
| If tokenless-first: stand up a zaalcaster Empire (tokenless) + wire a cast-reactions leaderboard on 3-5 launch casts, Neynar-score pre-filtered | @Zaal | Page live | 2026-07-13 |
| Define the engagement scoring (quote 5 / reply 3 / recast 2 / like 1, x Neynar score, 7-14d window) in a zaalcaster TOKENOMICS.md | @Zaal | PR | 2026-07-12 |
| Confirm with yerbearserker/diviflyy the exact white-label API for feeding a cast-reactions leaderboard + anti-sybil pre-filter | @Zaal | Investigate | 2026-07-10 |
| If token: fund an Empire SmartVault with the 1%, configure weighted payout to qualifying ranks | @Zaal | PR | 2026-07-13 |

## Sources

Primary (Zaal's, ingested 2026-07-07):
- [ZABAL Gamez Workshop #1 Part 1 - "Don't launch a token yet"](https://zabalgamez.com/recordings/1) [PARTIAL - extracted the page's structured summary, best-moments timestamps, topics + key takeaways; full line-by-line transcript is lazy-loaded and not captured]
- [ZABAL Gamez Workshop #1 Part 2 - "Building a Tokenless Empire Live"](https://zabalgamez.com/recordings/2) [PARTIAL - same: structured summary + timestamped best-moments + takeaways captured, verbatim transcript not]

Web (via research subagents 2026-07-07):
- [Empire Builder](https://www.empirebuilder.world/) [FULL]
- [Empire Builder Docs](https://empire-builder.gitbook.io/empire-builder-docs) [FULL]
- [Building Empires: GM Farcaster ep295 with Jordan from Empire Builder](https://www.youtube.com/watch?v=qRjQxkihNpQ) [PARTIAL - metadata]
- [Neynar User Quality Score](https://docs.neynar.com/docs/neynar-user-quality-score) [FULL]
- [Neynar Verifications Contract](https://docs.neynar.com/docs/verifications-contract) [FULL]
- [DEGEN Token History](https://zerion.io/blog/the-true-history-of-degen/) [FULL]
- [Clanker v4 - Bankless](https://www.bankless.com/read/clanker-v4-token-creator) [FULL]
- [Merkle Airdrop Starter (reference)](https://github.com/Anish-Agnihotri/merkle-airdrop-starter) [FULL]
- [OpenRank Farcaster Ranking Strategies](https://docs.openrank.com/integrations/farcaster/ranking-strategies-on-farcaster) [FULL]
