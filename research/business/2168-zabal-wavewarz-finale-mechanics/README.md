# Doc 2168 - ZABAL Gamez August Finale: WaveWarZ Battle Mechanics

**Status:** DESIGN (has open dependencies on the WaveWarZ team - flagged below)
**Date:** 2026-07-31
**Loop:** ZABAL Gamez research loop, tick 3 (finale mechanics)
**Related:** 2137 (August concept), 2165 (Week 1 Most-Improved), 2166 (Week 2 options), [[project_wavewarz_canonical]] (doc 743), the wavewarz ICM box, the zabalgamez `finals.html`.

---

## Purpose

Weeks 1 and 2 are weekly-task build weeks (docs 2165, 2166). This doc specs the **finale**: how the top 2 per track go from "shortlisted" to "one winner per track," run as WaveWarZ battles. It reconciles the site's older 72-hour prediction-market write-up (`finals.html`, from the pre-loops.house plan) with the current model, and it names exactly what still needs the WaveWarZ team to confirm - so nothing here reads as decided when it is not.

## What a WaveWarZ battle actually is (grounded)

From the wavewarz ICM box + [[project_wavewarz_canonical]] (doc 743, verified live 2026-07-16 via wavewarz.info/api/public/stats):

- WaveWarZ is a **prediction-market-style battle platform**. Two entries go head-to-head; fans **trade positions** on the outcome; the market price aggregates the crowd's read; it **settles automatically on-chain**.
- **Live traction:** 1,245 total battles, 524.15 SOL lifetime volume (~$39K), 9.07 SOL paid to artists automatically on-chain. This is a shipped, revenue-generating product - not a concept.
- **Battle types:** Quick Battles (weekdays), Main Events (Sundays), **Community Battles (booked)**. The ZABAL finale is a set of **booked Community Battles**.
- **Fee / settlement economics** (doc 743, needs Ike re-confirm before the event): 1.5% total per trade - **1% to the artist/entry, 0.5% platform**. At settlement the loser pool partially feeds the winner pool; losing traders get a partial refund, winning traders take a share of the loser pool. The **1% artist cut keeps flowing on every future trade, forever** - a battle entry stays live post-finals.

## The chain question (THE key dependency - do not gloss)

The ICM box and canonical doc are explicit and they disagree with the site copy in a way that must be resolved:

- **WaveWarZ is LIVE on Solana mainnet** (program ID `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo`). All 1,245 real battles + 524 SOL of volume are Solana.
- **"WaveWarZ-Base"** (the chain the `finals.html` finale copy assumes) is a **Base build Sam is shipping**; canonical doc 743 lists a **Base Sepolia testnet** contract (`0xe287...1098`, launched Feb 2026). There is **no verified evidence of a Base *mainnet* WaveWarZ with live volume** as of this doc.

**Implication - flag for Zaal + Ike/Sam, UNVERIFIED until confirmed:** the finale needs a settlement rail that is actually live in late August. Two honest paths:

1. **Solana mainnet (the proven rail).** Run the finale as booked Community Battles on the live Solana product. Everything works today; the tradeoff is Base-wallet participants need a Solana wallet, and the "1% to builder forever on Base" framing on the site would change to SOL.
2. **WaveWarZ-Base (the new rail).** Only viable if Sam's Base build is mainnet-ready and audited by finale week. Better UX story (Base wallets, USDC-native, matches the site copy), but it is a **hard dependency on a ship date we do not control**.

Do not print a chain in the public Loops/site copy until Ike/Sam confirm which rail settles the finale. Default assumption for planning: **Solana mainnet unless the Base build is confirmed ready.**

## How each track maps onto a tradeable battle

The finale has **6 finalists** - top 2 in each of Artist / Builder / Creator (docs 2137, 2165, 2166). Mapping each to a WaveWarZ entry:

- **Artist track** - the natural fit. Two artist finalists' tracks battle head-to-head; fans trade on which wins. This is WaveWarZ's core use case.
- **Builder track** - the **build becomes the battle entry**. This is exactly what `finals.html` already describes: "each finalist build becomes a battle entry, metadata = URL + repo + demo + handle." The market trades on "would I actually use this build" - a stronger signal than a click-vote.
- **Creator track** - the **body of content** (clips/threads/recaps) becomes the entry; the crowd trades on which creator best told the story of the season.

The generalized "entry = URL/repo/demo/handle" model means a battle subject does **not** have to be music - which is the whole reason the Base build exists. (Confirm with Ike that non-music entries are supported on whichever rail settles.)

## Finale structure: top 2 per track -> 3-5 battles -> one winner/track

- **3 core battles (one per track):** the two finalists in each track go head-to-head. Winner of each = that track's champion. That is the minimum, and it cleanly produces **one winner per track**.
- **Up to 2 optional exhibition battles** to reach the "3-5 battles" range: e.g. a cross-track **"Champion of the Season"** battle among the 3 track winners, and/or a **community wildcard** battle (a Most-Improved standout from Week 1, doc 2165). These are spectacle + extra volume, not required to crown the track winners.

Recommended default: **3 track battles + 1 champion battle = 4**, with a 5th wildcard only if there is an obvious community story to run.

## Settlement + prizes (reconciled with the canonical $500 pool)

- **Market settlement** decides placement within each battle (winner by final volume/win-rate per WaveWarZ protocol). "The market decides, not a panel" stays the headline.
- **$500 USDC pool** (sponsored by The ZAO festivals team) sits **on top** of the market, tiered so **every finalist who ships gets paid** (doc 2137 / content.html). Exact per-finalist allocation = **confirm before finale** (open in `finals.html` too).
- **1% forever** to each entry's builder/artist from all future trades on their battle entry.
- **Commemorative collectible** for every finisher, a champion tier for winners. NOTE: `finals.html` currently says this collectible "opens on Magnetiq" - **Magnetiq is retired** ([[feedback_no_magnetiq_no_songjam]]); this line must be stripped/re-pointed in the site scrub. Do not carry Magnetiq into any finale copy.

## Open dependencies (owner = WaveWarZ team, not this loop)

1. **Which chain settles the finale** - Solana mainnet (proven) vs WaveWarZ-Base (needs ship+audit confirmation). Blocks the public chain/wallet copy. Owner: Ike / Sam.
2. **Non-music entries on the settling rail** - confirm Builder/Creator entries are supported as battle subjects. Owner: Ike.
3. **Per-finalist $500 USDC allocation** - the tier table. Owner: Zaal + festivals team.
4. **Respect-holder role in settlement** (the `finals.html` "pre-funded baseline positions" idea) - keep or drop for Season 1. Owner: Zaal + ORDAO/Iman.
5. **Battle dates** - booked Community Battle slots for late August. Owner: Zaal + Ike.

## What is decided vs not (anti-fabrication)

- **Decided:** finale = booked WaveWarZ Community Battles; top 2/track -> head-to-head; one winner/track; market settles placement; $500 USDC tiered pool on top; 1%-forever to entries. Structure = 3-5 battles (rec 4).
- **NOT decided (flagged above):** the settlement chain, non-music-entry support, the $500 tier table, Respect's role, dates. None of these are mine to decide - they need Ike/Sam/Zaal.

This is a **design/spec, not a built thing.** No battle is booked and no contract is deployed by this doc.
