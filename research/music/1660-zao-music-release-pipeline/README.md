# 1660 — ZAO Music Release Pipeline: From Track to On-Chain (Jul 2026)

**Type:** OPERATIONS-GUIDE  
**Topic:** Music  
**Status:** CANONICAL — use for ZABAL S2 Track A artists (on-chain release required by graduation Nov 21), ZAO Music DBA under BCZ Strategies LLC, and any artist releasing through ZAO's distribution rails. Covers Audius (primary on-chain), DistroKid (mainstream DSPs), Sound.xyz/Zora (NFT releases), and 0xSplits revenue splits. The "battle-as-release-event" model is standard for ZAO Music releases. Last verified: Jul 2026.

---

## ZAO Music Entity Structure

**ZAO Music** operates as a DBA (doing business as) under **BCZ Strategies LLC** (Maine).  
- Not a separate legal entity — BCZ Strategies LLC is the contracting entity
- ZAO Music handles: distribution agreements, split contracts, release coordination
- Revenue routing: all ZAO Music income flows through BCZ Strategies LLC accounts
- Artists are NOT employees — they are independent contractors receiving split payments

**For ZABAL S2 Track A requirement:** An "on-chain release" means publishing a track on Audius (primary) OR Sound.xyz/Zora (NFT release). DistroKid alone is NOT on-chain for ZABAL graduation purposes.

---

## The Three Distribution Rails

### Rail 1: Audius (Primary On-Chain)

**Why Audius first:**
- Free to distribute
- Tracks are verifiable on-chain (Audius content node)
- WaveWarZ uses Audius track IDs in battle submissions (required for quick battles)
- CC-BY license compatible
- No gating, no approvals needed — upload and it's live

**Steps:**
1. Artist creates Audius account at audius.co (wallet connection optional but recommended)
2. Upload track file (WAV or MP3, 320kbps minimum)
3. Add metadata: title, artist name, genre, mood tags
4. Set license: CC-BY 4.0 recommended (required for WaveWarZ quick battles)
5. Publish
6. Send Audius track URL to ZOE (ZOE records in `zao_artists.audius_handle`)

**Release graphic requirement:** Artist or ZAO Music designs cover art (1400×1400px minimum). Can use ZAO visual identity color palette (doc 1627) or artist's own visual identity.

**Audius API pattern (for ZOE to verify track live):**
```typescript
const res = await fetch(`https://api.audius.co/v1/tracks/search?query=${trackTitle}&app_name=zaoos`)
const data = await res.json()
// Confirm track is indexed and owned by artist handle
```

---

### Rail 2: DistroKid (Mainstream DSPs)

**Why DistroKid:**
- Gets track onto Spotify, Apple Music, Amazon, YouTube Music, etc.
- Takes ~3-5 business days for distribution
- Cost: ~$19.99/year artist subscription (ZAO Music DBA pays — deducted from first royalty payout)
- Revenue split: DistroKid sends 100% to ZAO Music DBA; ZAO Music routes via 0xSplits

**Steps:**
1. Zaal distributes via the ZAO Music DistroKid account (bcz@bczstrategies.com)
2. Add track, artist name, release date, ISRC (DistroKid auto-assigns), UPC
3. Set stores: all stores selected by default
4. Set royalty email: ZAO Music DBA (routed via 0xSplits after receipt)
5. Submit and wait 3-5 business days

**Important:** DistroKid distribution is for tracks already released on Audius. Release on Audius first (day 0), then DistroKid distribution follows (day 3-5). Artists should not release exclusively through DistroKid for ZAO Music.

---

### Rail 3: Sound.xyz / Zora (NFT Release)

**When to use Sound.xyz or Zora:**
- For songs the artist wants to sell as limited editions (NFT)
- For tracks tied to a major event (ZAOstock, Africa Battle Week, graduation)
- For ZABAL S2 graduation release (NFT + Audius = strongest on-chain proof)

**Sound.xyz (recommended for music NFTs):**
1. Artist creates Sound.xyz account
2. Create a Sound Edition (ERC-1155 on Base or Optimism)
3. Set edition size (open edition vs. limited), price, and duration
4. ZAO Music pays the gas fee for the initial mint contract (deducted from split)
5. ZOE announces the edition drop with a countdown cast on Farcaster

**Zora (alternative for broader reach):**
1. Zora is Base-native — single-transaction minting
2. Use Zora if artist has a Coinbase/Base wallet already
3. Create a Zora Create contract for the track
4. ZOE posts the Zora link in /zao Farcaster channel

---

## 0xSplits Revenue Split Setup

Every ZAO Music release uses a **0xSplits immutable split contract** on Base.

**Standard ZAO Music split:**

| Recipient | Share |
|---|---|
| Artist | 70% |
| ZAO Treasury (BCZ Strategies) | 20% |
| ZOR Holders (via distribution contract) | 10% |

**0xSplits setup steps:**
1. Go to app.0xsplits.xyz
2. Create a new split
3. Add recipients:
   - Artist Phantom/Base wallet: 70%
   - ZAO Treasury wallet (Zaal confirms address): 20%
   - ZOR distribution wallet (Zaal confirms address): 10%
4. Set as **immutable** (no admin key — cannot be changed after creation)
5. Deploy on Base (gas ~$0.10-0.50 at Jul 2026 rates)
6. Send split contract address to ZOE (records in `zao_artists` table)

**Why immutable:** An immutable split means the artist can always verify their 70% is locked in — ZAO Music cannot change it after creation. This is the trust guarantee.

**Revenue flow:**
```
DistroKid royalty → BCZ Strategies LLC account 
  → Manual transfer to 0xSplits contract (monthly)
  → 0xSplits distributes: 70% to artist / 20% to ZAO treasury / 10% to ZOR
  
Sound.xyz/Zora primary sale → 0xSplits contract (automatic, if configured)
  → Same 70/20/10 split fires immediately
```

**ZOR holder distribution mechanism:**
The 10% ZOR share accumulates in the ZOR distribution wallet. Every quarter, Zaal distributes proportionally to ZOR holders (based on ZOR token balance at snapshot date). This is not automated yet (Q4 2026 build target).

---

## The Battle-as-Release-Event Model

ZAO Music's signature approach: **release a track on the same day you battle on WaveWarZ.**

**Why:**
- The battle creates a live, high-stakes context for the track
- Fans who trade in the battle are incentivized to listen to the track first
- The on-chain battle payout is the release event — "I released my track and settled a battle in the same block window"
- Press-worthy narrative: "Artist releases track + earns SOL in a music battle on the same day"

**Implementation:**
1. Track uploaded to Audius (day 0, minimum 3 days before battle)
2. WaveWarZ quick battle submitted with the Audius track URL as the battle track
3. Battle scheduled for release day
4. ZOE posts: "Today @[artisthandle] releases [track name] AND battles on WaveWarZ. Watch both on release day."
5. Release day: Battle runs → settlement fires → ZOE posts settlement + track link together
6. ZOE posts the 0xSplits split contract address as proof of the revenue structure

**Template post for ZOE (release + battle day):**
```
@[Artist] just released [Track Name] on Audius.

Today they also battled [Opponent] on WaveWarZ.

Battle result: [Win/Loss]. Payout: [X] SOL — automatic, on-chain.

Listen: [Audius URL]
TX: [Solana explorer URL]
```

---

## ZABAL S2 Track A: On-Chain Release Requirement

For Track A participants, graduation requires:
- ≥1 on-chain release by Nov 21, 2026
- "On-chain release" = Audius upload OR Sound.xyz/Zora edition

**Minimum viable ZABAL release:**
1. Upload any track to Audius with CC-BY license
2. Set a 0xSplits contract (even if all 100% goes to the artist — this proves on-chain release)
3. Report Audius track URL and 0xSplits contract address to ZOE by Nov 14 (T-7 days before graduation)

**Recommended ZABAL release (highest milestone value):**
1. Audius upload (primary on-chain)
2. DistroKid distribution (mainstream reach)
3. Sound.xyz limited edition (NFT)
4. 0xSplits contract (ZAO Music standard 70/20/10 split)
5. Battle on WaveWarZ on release day

---

## ZOE Release Announcement Automation

When a ZAO Music release is confirmed, ZOE triggers:

**T-7 days: Pre-release teaser**
```
New music from the ZAO ecosystem.

[@Artist] drops [track name] in 7 days.
Release day is also their WaveWarZ battle day.

Mark your calendar: [date]
[Audius URL — if available]
```

**Release day: Launch post**
```
[Track name] by [@Artist] is live.

Audius: [URL]
[Sound.xyz URL if NFT release]

And they're battling @[opponent] on WaveWarZ today.
[wavewarz.info URL]
```

**Post-battle: Settlement post**
```
[Track name] + [Win/Loss] battle result.

[@Artist] earned [X] SOL today.
Even as the [winner/loser].

Track: [Audius URL]
Battle TX: [Solana explorer]
Split contract: [Base explorer URL]
```

---

## ZAO Music Checklist (Per Release)

- [ ] Track audio file received (WAV or high-quality MP3)
- [ ] Cover art received (1400×1400px minimum)
- [ ] Artist Audius account confirmed or created
- [ ] Audius track uploaded and live
- [ ] Track CC-BY licensed on Audius
- [ ] 0xSplits contract deployed on Base (70/20/10)
- [ ] Split contract address sent to ZOE
- [ ] DistroKid distribution submitted (if mainstream release)
- [ ] Battle scheduled on WaveWarZ (if battle-as-release-event model)
- [ ] ZOE teaser post queued (T-7 days)
- [ ] ZOE release day post queued
- [ ] ZOE post-battle settlement post ready

---

## Related Docs

- 1622 — ZAO Music Cipher Release Plan (first ZAO Music original track — pilot of this pipeline)
- 1626 — ZABAL S2 Curriculum Spec (Track A on-chain release requirement)
- 1644 — WaveWarZ On-Chain Settlement Mechanics (battle-as-release-event — settlement mechanics)
- 1625 — ZAO Supabase Schema Reference (artist table — split contract address field)
- 1628 — ZAO Multi-Chain Architecture Guide (Base for 0xSplits, Audius for content, Zora on Base)
- 1627 — ZAO Visual Identity Spec (cover art color palette + guidelines)
- 1624 — ZAO Agent Fleet Reference (ZOE release announcement patterns)
