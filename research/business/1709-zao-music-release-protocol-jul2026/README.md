# 1709 — ZAO Music Release Protocol & Revenue Stack (Jul 2026)

**Type:** CANONICAL-REFERENCE  
**Topic:** Business  
**Status:** ACTIVE — ZAO Music is a music label and publishing entity under BCZ Strategies LLC. This doc is the canonical reference for how ZAO Music releases work: the revenue split, the contracts, the distribution pipeline, and the release checklist. Cite in: OP RF applications, grant narratives, artist pitch decks, press pitches. ZOE links this when an artist asks "how does ZAO Music pay me?"

---

## What Is ZAO Music

ZAO Music is ZAO's music label and publishing arm — a DBA (Doing Business As) under BCZ Strategies LLC.

What ZAO Music does:
- Releases music by ZAO-connected artists on traditional DSPs (Spotify, Apple Music, etc.)
- Structures every release with an immutable on-chain revenue split via 0xSplits on Base
- Handles BMI registration for performance royalties
- Provides distribution via DistroKid
- Lists artist tracks on Sound.xyz and Zora for web3-native sales and collector editions

What ZAO Music is NOT:
- Not a traditional label that takes a % of masters
- Not a label that controls artist IP — artists retain all rights
- Not required for an artist to participate in WaveWarZ (Audius tracks are separate from ZAO Music releases)

---

## Revenue Stack

### On-Chain Revenue Split (Base)

Every ZAO Music release uses an **0xSplits contract on Base**. The split is immutable — set at contract deployment, not changeable by ZAO or anyone else.

**Standard ZAO Music split:**

| Recipient | % |
|-----------|---|
| Artist | 70% |
| ZAO Treasury | 20% |
| ZOR Holders (collective) | 10% |

**Implementation:** 0xSplits on Base ([0xSplits.xyz](https://splits.org))

**ZOR holder distribution:** The 10% to ZOR holders flows to the ZOR ERC-1155 contract at `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (Optimism Mainnet), distributed pro-rata to all ZOR holders at time of distribution. Distribution is triggered manually by Zaal when the contract accumulates meaningful ETH/USDC.

**Why immutable:** The immutability guarantee is a core trust signal to artists — ZAO cannot retroactively change the artist's take. This is citable in grant applications as a structural innovation in music publishing.

**Citable language:**
> ZAO Music releases use an immutable on-chain revenue split (via 0xSplits on Base) where artists receive 70% of all on-chain revenue from every release, automatically. ZAO Treasury receives 20%; ZOR token holders receive 10% as a reward for governance participation. No label can alter these terms after contract deployment.

---

### Traditional Revenue (Off-Chain)

**BMI Registration**
ZAO Music registers each release with BMI (Broadcast Music International) as the publisher. This enables:
- Performance royalties (when tracks are played on radio, at venues, etc.)
- Sync licensing royalties (when tracks are used in film, TV, ads)
- Mechanical royalties (when tracks are streamed on licensed DSPs)

BMI collects and passes royalties to BCZ Strategies LLC (as publisher) → BCZ pays the artist per the agreed split (mirrors the 70/20/10 on-chain structure).

**DistroKid Distribution**
ZAO Music uses DistroKid to distribute releases to all major DSPs:
- Spotify
- Apple Music
- Tidal
- YouTube Music
- Amazon Music
- +40 other platforms

DistroKid's "Keep 100% of royalties" plan: DSP revenue goes to BCZ Strategies LLC → BCZ distributes to artist per the on-chain split percentages.

**Why DistroKid over other distributors:**
- No per-stream fee (flat annual fee)
- Fast delivery (24-48h to most platforms)
- Supports Spotify for Artists, Apple Music for Artists verification
- Easy ISRC code generation per track

---

### Web3 Revenue (On-Chain)

**Sound.xyz:**
ZAO Music releases limited collector editions on Sound.xyz. Collectors mint a limited-edition token proving "first listener" status. Sound.xyz releases are separate from the main DSP release — they're for web3-native collectors and ZOR holders.

Sound.xyz revenue split: managed via 0xSplits (same contract as above). Collector mint revenue → 0xSplits → artist 70% / ZAO treasury 20% / ZOR holders 10%.

**Zora:**
ZAO Music uses Zora for open edition NFT releases — lower price point, higher volume. Any artist track can be minted as a Zora open edition for the duration of a WaveWarZ battle, creating a "buy the track during the battle" mechanic.

Zora revenue split: same 0xSplits contract or a Zora-native split.

---

## Release Checklist

For every ZAO Music release:

**Pre-release (4 weeks before):**
- [ ] Artist signs BCZ Strategies LLC artist agreement (email, informal for now)
- [ ] Track finalized as WAV/AIFF (44.1kHz, 24-bit)
- [ ] Artwork finalized (3000×3000px, JPEG or PNG)
- [ ] Artist bio and photo updated on Audius
- [ ] 0xSplits contract deployed on Base with correct artist wallet
- [ ] Confirm artist wallet address (Ethereum/Base compatible — not Solana)
- [ ] BMI registration submitted for the track (title, ISRC, publisher: BCZ Strategies LLC)

**Distribution (2 weeks before):**
- [ ] DistroKid release submitted (all DSPs, explicit/clean label, lyrics if available)
- [ ] Confirm release date in DistroKid (2 weeks for Spotify pre-save)
- [ ] Sound.xyz listing created (3 collector editions minimum, 1 ETH or less)
- [ ] Zora open edition minted (set duration: 7 days, or tied to battle window)
- [ ] Audius track uploaded (public, high-quality, official ZAO Music artist account)

**Release day:**
- [ ] ZOE posts release announcement (X, Farcaster /wavewarz, Telegram)
- [ ] WaveWarZ battle scheduled for same day (battle features the track)
- [ ] ZOR holders notified via Telegram about the Zora/Sound.xyz window
- [ ] Press kit updated (doc 1483) with new release

**Post-release (30 days after):**
- [ ] DistroKid streams report pulled — share with artist
- [ ] 0xSplits distribution triggered (if balance ≥ $10 worth)
- [ ] BMI royalty check scheduled (quarterly)
- [ ] ZAO DAO case study updated if release hits milestone (doc 1651)

---

## Cipher: First Planned ZAO Music Release

**Cipher** is the first planned release under the ZAO Music DBA.

**What Cipher is:**
- An EP (3-5 tracks) featuring ZAO-connected artists
- The first formal use of the ZAO Music 0xSplits release structure
- Planned to release before ZAOstock (Oct 3, 2026) — target: September 2026
- Will be featured in a WaveWarZ battle during Africa Battle Week (Sep 22-26)

**Cipher release mechanics:**
- Audius upload (for WaveWarZ battles)
- Sound.xyz limited collector edition (linked to Africa Battle Week)
- Zora open edition (minted during Africa Battle Week battles)
- DistroKid DSP release (concurrent with Africa Battle Week)

**Action:** Zaal to confirm Cipher artist roster and track status. This is GATED — requires artist confirmation before release checklist begins.

---

## ZAO Music vs WaveWarZ: What's Connected, What's Separate

| Aspect | WaveWarZ | ZAO Music |
|--------|----------|-----------|
| Chain | Solana (battles + payouts) | Base (0xSplits) + traditional DSPs |
| Artist onboarding | Audius account + Phantom wallet | BCZ agreement + Ethereum wallet |
| Revenue to artist | SOL from battle staking (automatic) | DSP royalties + on-chain mints (manual trigger) |
| Required for WaveWarZ | Yes (Audius tracks) | No — separate from battles |
| Connected? | Yes — battle track = ZAO Music track (when released) | Yes — same artist, two revenue channels |

**The two channels complement each other:** An artist can earn SOL from WaveWarZ battles AND earn DSP royalties + 0xSplits revenue from the same track via ZAO Music. They're not either/or.

---

## For Grant Applications

**Citable facts:**
1. ZAO Music uses immutable on-chain revenue splits — artist take cannot be changed by ZAO after contract deployment.
2. Artists receive 70% of all on-chain revenue from ZAO Music releases.
3. ZOR token holders receive 10% of ZAO Music release revenue as a governance participation reward — aligning music fans with governance participation.
4. ZAO Music operates under BCZ Strategies LLC with BMI publisher registration — ZAO can collect performance royalties on behalf of artists from traditional DSPs.
5. As of July 2026, the first ZAO Music release (Cipher) is in development, planned for September 2026 alongside Africa Battle Week.

**Revenue stack summary for grants:**
> ZAO Music operates two parallel revenue channels for artists: (1) on-chain via 0xSplits on Base (70% to artist, automatically); (2) off-chain via BMI + DistroKid DSP distribution. The on-chain split is immutable — permanently protecting artist earnings without relying on ZAO's goodwill. This is a structural improvement over traditional label arrangements where artists' royalty rates are renegotiated on every album.

---

## Related Docs

- 1644 — WaveWarZ On-Chain Settlement Mechanics (companion revenue stream to ZAO Music)
- 1628 — ZAO Three-Chain Architecture (Base = ZAO Music chain; Solana = WaveWarZ; Optimism = governance)
- 1651 — ZAO DAO Case Study (includes ZAO Music context)
- 1483 — ZAO Press Kit (ZAO Music section — update after each release)
- 1396 — Africa Battle Week Main Spec (Cipher will be featured during ABW)
- 1311 — OP RF Application Pack (ZAO Music as evidence of onchain music infrastructure)
