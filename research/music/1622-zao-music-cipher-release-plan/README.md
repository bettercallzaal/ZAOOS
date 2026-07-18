# 1622 — ZAO Music: Cipher First Release Plan

**Type:** RELEASE-PLAN  
**Topic:** Music  
**Status:** PLANNING — Cipher is ZAO Music's planned first release. ZAO Music DBA operates under BCZ Strategies LLC. Release plan is pre-production as of Jul 2026. This doc captures the release architecture so that ZOE, Hurricane, and Zaal are aligned when Cipher is ready to drop.

---

## What Is ZAO Music

ZAO Music is the music label arm of ZAO, operating as a DBA under BCZ Strategies LLC. It is not a traditional record label:
- ZAO does not own artists' masters or take royalties
- ZAO distributes music through DistroKid under the ZAO Music umbrella
- Artists registered under ZAO Music are part of the ZAO ecosystem — they battle on WaveWarZ, participate in governance via Fractal, and have on-chain income from trading volume
- Revenue splits use **0xSplits** (on-chain split contracts) so distribution is automatic and auditable

**BMI registration:** ZAO Music is registered with BMI for PRO representation.

---

## What Is Cipher

Cipher is the planned first ZAO Music release — a track or EP that:
1. Features at least one artist from the WaveWarZ artist roster
2. Is released simultaneously on Audius, Spotify/Apple Music (via DistroKid), Sound.xyz or Zora, and as an on-chain collectible
3. Demonstrates the ZAO Music model: on-chain royalty splits, collectible release, WaveWarZ integration

**Why Cipher matters as ZAO IP:**  
Cipher is the first proof that ZAO can produce original music IP — not just run a platform for other artists' battles. It anchors the "ZAO IP = a staple in onchain art, music and culture" north star objective.

**Status as of Jul 2026:** Artist and track not yet confirmed publicly. Zaal owns the artist selection and recording coordination.

---

## Release Architecture

### Distribution Stack

| Platform | Role | How |
|---|---|---|
| Audius | Primary streaming + WaveWarZ integration | DistroKid → Audius (or direct upload) |
| Spotify / Apple Music | Mainstream distribution | DistroKid |
| Sound.xyz or Zora | On-chain collectible + editions | Direct upload; editions minted on Base or Ethereum |
| Farcaster (frame) | Launch cast with embedded player | Neynar cast with Sound.xyz/Zora frame |
| WaveWarZ | Feature the artist in a MAIN battle on release day | ZOR nominee → MAIN battle launched same day as release |

### Revenue Split Architecture

All ZAO Music releases use **0xSplits** for on-chain revenue distribution:

```
ZAO Music release → DistroKid collects streaming royalties
→ DistroKid sends to ZAO Music wallet (BCZ Strategies LLC)
→ ZAO Music wallet → 0xSplits contract
→ Split: [artist %] / [ZAO treasury %] / [ZOR holders %]
```

**Suggested split (to be confirmed with artist):**
- Artist: 70%
- ZAO treasury (governance fund): 20%
- ZOR holders collective: 10%

The ZOR holders' 10% is distributed pro-rata to all 157 ZOR holders — small amounts per holder, but a real on-chain dividend that makes ZOR holders co-owners of ZAO Music IP.

**On-chain collectible split (Sound.xyz / Zora editions):**
- Artist: 80%
- ZAO treasury: 20%
- Collector royalties: 5% on secondary (Sound.xyz/Zora default)

---

## Release Day Sequence

### T-7 days (announcement)

ZOE posts to X, Farcaster /zao, Telegram:
```
ZAO Music drops its first release in 7 days.
[Artist name] × ZAO Music.
Audius. Spotify. On-chain.
More details soon. /wavewarz for live updates.
```

ZOR holders get a Fractal governance preview: which ZOR holder % split contract is being used, confirming they'll receive a dividend.

### T-1 day (pre-save / pre-collect)

ZOE posts Sound.xyz or Zora pre-collect link:
```
Tomorrow: [track name] by [artist] via ZAO Music.
Pre-collect opens now: [Sound.xyz/Zora link]
100 editions at [price] SOL or ETH.
Tomorrow's release day also features: [artist] in a WaveWarZ MAIN battle.
```

### Release day

**Order of operations:**

| Time | Action | Owner |
|---|---|---|
| 9:00 AM ET | DistroKid goes live (Spotify/Apple Music) | Zaal (pre-scheduled) |
| 9:00 AM ET | Audius track published | Zaal |
| 9:00 AM ET | Sound.xyz/Zora editions open | Zaal (pre-scheduled) |
| 9:05 AM ET | ZOE posts release cast to Farcaster /zao with embedded frame | ZOE auto |
| 9:10 AM ET | ZOE posts X thread: "track name + ZAO Music + all links" | ZOE auto |
| 9:10 AM ET | ZOE posts Telegram: release link + WaveWarZ battle link | ZOE auto |
| 10:00 AM ET | WaveWarZ MAIN battle opens for [artist] | ZOR pre-vote (close day before) |
| Post-battle | ZOE posts battle result + Cipher link: "Winner of the battle: [name]. Their track [Cipher] is out now." | ZOE auto |

---

## WaveWarZ Integration: Battle-as-Release-Event

The core ZAO Music release model ties the release to a WaveWarZ MAIN battle:

1. The releasing artist competes in a MAIN battle on release day
2. Fans discover the artist through the battle → listen to the release on Audius → collect on Sound.xyz
3. The battle result becomes a press moment: "Artist who drops new track today also competed in a WaveWarZ MAIN battle — and the loser still earned SOL"

**Why this works for press:**  
Music press (Hypebot, Water & Music) can write: "ZAO Music launched its first release with a WaveWarZ MAIN battle on the same day — fans could bet on the artist's performance AND collect their track simultaneously."

---

## BMI Registration Protocol

Before release:
1. Confirm BCZ Strategies LLC BMI membership is active
2. Register the work (song title, writers, publishers) with BMI at bmi.com/creator
3. If the artist is the songwriter, they need their own PRO registration (BMI/ASCAP/SESAC)
4. Split: if multiple songwriters, agree on shares before BMI registration (matches 0xSplits percentages)

ZOE reminder: Set BMI registration reminder T-14 days before release date.

---

## Press Angle for Cipher

**For music press (Water & Music, Hypebot):**
> "ZAO Music's first release ships with an on-chain revenue split contract — artists see their streaming royalties, collectible sales, and ZOR holder dividends all through one 0xSplits contract. No trust required."

**For Web3 press (Bankless, Decrypt):**
> "ZAO's music label drops its first release on Sound.xyz — and ZOR holders (the DAO's governance participants) receive 10% of on-chain revenue automatically, turning music fans into music co-owners."

---

## Post-Release: What Gets Documented in ZAOOS

After Cipher releases:
- New doc in `research/music/`: "ZAO Music Release [track name] — Post-Release Stats" (streaming numbers, edition sales, WaveWarZ battle outcome, 0xSplits tx hash)
- Update doc 1614 (North Star Narrative) with: "ZAO Music released [track name] by [artist] — first on-chain music release under ZAO IP"
- Update ZAO citable claims with: "First ZAO Music release: [date], [artist], [N] editions collected, [X] SOL in collectible sales"

---

## DECISION NEEDED

1. **Artist:** Who is the Cipher artist? Zaal to confirm. (Suggested: one of the ZAOstock line-up artists for maximum cross-promotion.)
2. **Track:** Is there a finished track ready? Or does ZAO Music need to produce one?
3. **Release date:** Tied to ZAOstock? Or earlier? A pre-ZAOstock Cipher drop (Sep 1?) could build momentum.
4. **On-chain platform:** Sound.xyz (Ethereum/Base) or Zora (Base)? Sound.xyz has better music-native discovery; Zora has cheaper gas.
5. **Edition count and price:** 100 editions at 0.01 ETH is a common entry point. 

---

## Related Docs

- 1614 — ZAO North Star Narrative Spec (Cipher updates the narrative)
- 1605 — WaveWarZ Estate Audit (Audius API integration reference)
- 1599 — WaveWarZ H2 2026 MAIN Event Calendar (release day MAIN battle scheduling)
- 1604 — ZAO Artist Directory Spec (Cipher artist entry in zao_artists table)
- 1562 — ZAOstock Sponsor Activation (Sound.xyz or Zora as co-sponsor of Cipher release?)
