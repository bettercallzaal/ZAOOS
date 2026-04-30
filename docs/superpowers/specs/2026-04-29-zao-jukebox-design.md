---
status: draft - concept brainstorm
date: 2026-04-29
working-name: ZAO Jukebox
related-research: 407, 138, 143, 141, 144, 475, 526
related-memory: project_zao_master_context, project_zao_music_entity, project_raidsharks_empire_builder
---

# ZAO Jukebox - Design Brainstorm (concept layer)

> **Status:** Draft brainstorm only. No spec, no build commitment. Saved 2026-04-29 to resume later.
> **Origin:** Zaal idea sparked by betr mint, fused with GodCloud label thread (doc 475).

---

## One-line pitch

A weekly mystery-mint music miniapp on Farcaster. Drop $1, the game randomly picks one of Zaal's 10 curated artists for that week, you mint their NFT, and you earn $ZABAL only if you actually listen and post a real comment. Win = NFT + $1 back in $ZABAL. Loss = $1 gone if your roll lands on a sold-out artist. Gambling DNA, music payload, engagement gate.

---

## What's locked so far

| Var | Value |
|-----|-------|
| Format | Mint-IS-game blind drop, weekly |
| Curator | Zaal picks 10 artists each week (menu curated, roll random) |
| Cipher tie-in | None. Independent stream from GodCloud/DCoop label thread. |
| Mint price | $1 USDC per pull |
| Odds | Equal weight to start across all artists |
| Supply | 10 NFTs per artist per week |
| Sold-out behavior | If roll lands on depleted artist, $1 gone. Early-bird advantage by design. |
| Win mechanic | NFT + $1 back in $ZABAL (rebate from Zaal's 20% creator treasury) |
| $ZABAL gate | Full listen + Farcaster comment cast = unlock more $ZABAL on top of rebate |
| Top comments | Bonus $ZABAL pool, quality-ranked |
| Distribution | Discovery layer, points to existing distro (Sound / Spotify / Audius) |
| RNG | Commit-reveal / signed event v1, no Chainlink VRF |

---

## The mechanic in one motion

User pays $1 USDC. Game animates. Random pull lands on one of 10 curated artists. If that artist still has supply: NFT mints, $1 worth of $ZABAL refunds. If sold out: $1 gone, no NFT. Winner then must full-listen + post Farcaster comment to claim additional $ZABAL. Top quality comments win bonus pool.

---

## What it collapses

Three things people normally do separately, fused into one motion:

- **Discovery** (browse / recommend -> I find an artist)
- **Support** (stream / tip / buy -> I give them money)
- **Engagement** (comment / share -> I tell people about them)

Drop the coin -> get the artist -> prove you heard it -> earn the token.

---

## Why each party wins

**Fan** - Catches an artist they didn't know existed. Loss-aversion + scarcity = real stakes. Win = effectively free music + tokens. Has skin in the game.

**Artist** - Direct CRM most indie musicians have never had: wallets that paid + listened + commented. ~$0.80 per winning mint x supply = real revenue. Audience comes from the game itself, not algo luck.

**Curator (Zaal v1)** - Becomes the show. Like a DJ, not an algorithm. Trust accumulates in curator brand. Future: regional curators (GodCloud, DCoop, Steve Peer, Iman) each get their own jukebox.

**$ZABAL token** - Real demand-side use beyond top-50 distribution. Becomes "the music rebate token." Cleaner utility narrative than most chain tokens.

---

## Why this isn't betr / Sound / Spotify

| Thing it isn't | What it is instead |
|----------------|--------------------|
| Sound.xyz mint | No "pick the song first" - blind-mint into a curated set |
| Spotify discovery | Discovery has stakes ($1 + real NFT + real loss) |
| betr mint | Music-native, listen-gate, mandatory engagement, win returns rebate |
| A label | Not signing artists. Renting their catalog one week at a time. |
| A streaming app | NFT is the artifact, listening is the unlock condition |

---

## Win/loss math reframe

**Win:** $1 paid -> 80c artist + 10c ZAO Treasury + 10c platform -> user gets NFT + $1 worth of $ZABAL back (subsidized by Zaal's 20% creator treasury). Mint feels free.

**Loss:** $1 paid, no NFT, no rebate. Money routes to lost-$1 pool.

**Lost-$1 pool destination - three options:**

1. Burn - clean, but torches value
2. To the artist who sold out - generous, latecomers literally fund the hot artist
3. To the listener bonus pool - more $ZABAL for top commenters

Lean: split B + C. Loss money never disappears, gets routed to engagement.

---

## Variants of the rebate worth chewing on

- **v1 Flat:** Win = $1 in $ZABAL back. Always. Simple.
- **v2 Scaled:** $0.50-$2 in $ZABAL based on slot rarity (last slot = 2x).
- **v3 Compound:** Win = $1. Listen-through = +$1. Cast comment = +$1. Top comment = +$5. Stack pays $4-9 on a $1 spend, only if you engage. Most loop-y.
- **v4 Streak:** Win = $1. Two in a row = $1.50. Three = $2. Resets on loss. Encourages multi-pulls.

v3 is the strongest contender - every layer demands more engagement.

---

## Game format candidates (better than plinko)

**Jukebox (recommended)** - old-school glass jukebox. 10 vinyl records per artist visible. Drop coin -> mechanical arm grabs random record -> spins -> NFT mints. Empty slots stay visible. Music-native. Loss feels honest. Brandable as "ZAO Jukebox."

**Card Pack** - Pokemon / NBA Top Shot mechanic. Deck of N artists x 10 cards. Familiar UX, but generic.

**Vending Machine** - 2D grid, pull lever, slot empties. Mixtape / cassette vibe.

Plinko problem: closed pegs look broken once supplies deplete. Jukebox makes depletion legible AND dramatic.

---

## Bigger framing - the label thread

GodCloud convo (doc 475) decided NO NFT mints with Cipher #1. This idea sits **upstream** of that label decision, not parallel to it.

Funnel:

```
ZAO Jukebox (this idea)
   |
   |  Artists who hit. Fans who keep coming back.
   v
ZAO Music release pipeline (cipher / EP / album via DistroKid + 0xSplits + BMI)
   |
   v
The actual "everything in web3 music" thing
```

The miniapp = discovery + audience-warming layer for the label you might build later. Artists who win the jukebox are the ones you later put on cipher releases. Fans who keep showing up are the ones who buy the album.

Betr's flywheel ends at the spin. This one feeds a real music economy underneath it.

---

## What's still open at concept layer

1. **Trust model** - Zaal-curated v1 vs. open-submission vs. community-vote. Curator-first feels right; Zaal IS the brand.
2. **What the NFT means long-term** - Receipt ("I was there week 12"), Access key (unlocks future drops, fan club), or Asset (resellable, royalty-bearing). Pick one or stack.
3. **Loss as feature vs. filter** - Real-money loss = gambling pulse. But filters out non-crypto-native fans. Worth a parallel "no-loss-mode" for newcomers.
4. **Where the music lives** - Point to Spotify (NFT = fandom badge, no listen control) vs. host in-app (control listen-gate, host audio).
5. **Artist's reason to say yes - sharper version** - Beyond $0.80/mint + wallet list. Maybe: top-engagement artist of the month gets auto-slotted for next ZAO Music label release / ZAOstock slot / Empire Builder push / collab with another alum. Jukebox becomes the audition, the rest is the prize.
6. **Multi-curator future** - Zaal forever doesn't scale. Regional curators (GodCloud / DCoop / Steve Peer / Iman) each get their own jukebox? Multi-curator = multi-brand = bigger story.
7. **ZAO-only vs. public Farcaster product** - Gated = small high-trust. Public = betr-scale but loses curated-collective feel. Could be ZAO-curated, public-playable.

---

## What Zaal might actually be inventing

Not a mint app. Not betr. Not Sound.

A slot machine where:

- the prizes are real artists
- the rebate is the platform token
- the engagement gate filters humans from bots
- the curator is the show
- the loss money funds the next round of engagement

Gambling pulls them in. Music makes them stay. Comment gate keeps data clean. $ZABAL gives them a reason to come back next week.

---

## Source research already in the library

- doc 407 - Coinflow fiat-to-mint on Base (mint rail)
- doc 138 - Play counting / stream attribution (listen-gate)
- doc 143 - 0xSplits revenue distribution (artist-payout rail)
- doc 141 - Onchain music distribution landscape
- doc 144 - ZOUNZ unified distribution
- doc 475 - ZAO Music entity (GodCloud convo, DistroKid + BMI + 0xSplits)
- doc 526 - Distribution V3 per-entity playbooks

External: BETRMINT brief - Farcaster mini app, $1 USDC spin, gamified daily creator feature, $300K cumulative volume, top-20 mini app 9+ months, no music DNA, Toady Hawk + Netnose, $BETR Clanker token.

---

## Resume phrase

To pick this back up later: "continue ZAO Jukebox brainstorm" or "open the Jukebox doc."

Next step when resuming: pick on questions 1-7 above OR ping GodCloud / DCoop / Iman with the concept-layer brief for redline.
