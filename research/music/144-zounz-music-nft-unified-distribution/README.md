# 144 — ZOUNZ + Music NFTs: Unified DAO-Powered Music Distribution

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Design how ZOUNZ DAO governance connects to music NFT minting and distribution — making ZAO the first DAO-governed music distribution service

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Model** | ZOUNZ DAO governs the distribution service — proposals fund releases, treasury earns from splits |
| **Revenue loop** | ZOUNZ auction revenue → Treasury → Fund artist releases → Splits return revenue to Treasury |
| **Governance** | ZOUNZ NFT holders vote on which artists/releases to fund and feature |
| **Distribution** | Zora 1155 minting + 0xSplits (same chain as ZOUNZ = Base) |
| **Open contracts** | All contracts are open — any community can fork ZAO's model |

## The Vision: DAO-Governed Music Distribution

Most music distribution services are centralized companies (DistroKid, TuneCore, Unchained). ZAO can be **the first DAO that IS a distribution service** — where the community governs what gets distributed and how revenue flows.

```
┌─────────────────────────────────────────────┐
│              ZOUNZ DAO (Base)                │
│                                              │
│  Daily NFT Auction → Treasury                │
│  ZOUNZ holders vote on proposals             │
│                                              │
│  Proposal types:                             │
│  • "Fund Artist X's EP release"              │
│  • "Feature Track Y on ZAO homepage"         │
│  • "Change default split to 85/10/5"         │
│  • "Partner with label Z for compilation"    │
└──────────────────┬──────────────────────────┘
                   │ Treasury funds releases
                   ▼
┌─────────────────────────────────────────────┐
│           ZAO Music Distribution             │
│                                              │
│  Zora Protocol SDK → Mint 1155 editions      │
│  0xSplits → Auto-distribute revenue          │
│  IPFS (Pinata) → Store audio + metadata      │
│                                              │
│  Revenue flows back:                         │
│  • 80% → Artist                              │
│  • 10% → ZAO Treasury (DAO)                  │
│  • 10% → Curator who submitted               │
└─────────────────────────────────────────────┘
```

## How ZOUNZ Connects to Music NFTs

### Existing ZOUNZ Infrastructure (Already Deployed)

| Component | Contract | What It Does |
|-----------|----------|-------------|
| Token | `0xCB80...883` | ERC-721 NFT with voting power |
| Auction | `0xb2d4...bfb` | Daily English auctions |
| Governor | `0x9d98...17f` | Proposal creation + voting |
| Treasury | `0x2bb5...13f` | Timelock funds management |

### New Music NFT Layer (To Build)

| Component | Technology | What It Does |
|-----------|-----------|-------------|
| Music Minting | Zora Protocol SDK | Create ERC-1155 music editions |
| Revenue Splits | 0xSplits | Automated royalty distribution |
| Metadata | IPFS + Pinata | Store audio files + cover art |
| Curation | Respect-weighted | Community ranks tracks |

### The Connection Point

**ZOUNZ Governor proposals can:**
1. Send ETH from Treasury to fund a Zora 1155 music release
2. Set the `payoutRecipient` split to include Treasury address
3. Revenue from mint sales flows back to Treasury via split
4. **Virtuous cycle:** Treasury grows from both ZOUNZ auctions AND music NFT sales

## Proposal Templates

### "Fund Artist Release" Proposal
```
Title: Fund [Artist]'s single "[Track Name]"
Amount: 0.1 ETH from Treasury
Purpose: Cover Zora deployment + IPFS storage + initial marketing
Split: Artist 80% / Treasury 10% / Curator 10%
Expected: 100 mints @ 0.001 ETH = 0.1 ETH revenue
```

### "Community Compilation" Proposal
```
Title: ZAO Compilation Vol. 1 — 10 tracks
Amount: 0.5 ETH from Treasury
Purpose: Fund multi-artist compilation NFT
Split: Artists 70% (equal per track) / Treasury 20% / Curator 10%
Expected: 500 mints @ 0.005 ETH = 2.5 ETH revenue
```

### "Change Default Split" Proposal
```
Title: Increase artist share to 85%
Rationale: Community voted to prioritize artist revenue
New default: Artist 85% / Treasury 10% / Curator 5%
```

## User Experience Flow

### For Artists (ZAO Members)
1. **Submit track** via ZAO OS music submission form
2. **Community curates** — Respect-weighted voting surfaces best tracks
3. **DAO proposal** — Member proposes to fund the release
4. **ZOUNZ vote** — NFT holders approve/reject
5. **Auto-mint** — Track deployed as Zora 1155 on Base with 0xSplits
6. **Earn** — Revenue auto-splits to artist + treasury + curator
7. **Track analytics** — See mints, revenue, collector addresses

### For Collectors (Fans)
1. **Browse** ZAO OS music library
2. **See "Collect" button** on tracks that have been minted as NFTs
3. **Connect wallet** (already configured in ZAO OS via wagmi)
4. **Mint** for price set by artist/DAO (e.g., 0.001 ETH)
5. **Own** the music NFT — visible in profile, tradeable on secondary
6. **Earn** if the track appreciates on Zora secondary market

## Why Open Contracts Matter

All contracts used are open source and forkable:
- **Nouns Builder protocol** — MIT licensed, any community can deploy
- **Zora Protocol** — MIT licensed, permissionless minting
- **0xSplits** — Open source, deterministic addresses

**This means:** Any music community (not just ZAO) can fork this exact setup. ZAO becomes the **template** for DAO-governed music distribution.

## Revenue Projections

**Conservative (100 members, 10 releases/month):**
| Source | Monthly Revenue |
|--------|----------------|
| ZOUNZ auctions (avg 0.05 ETH/day) | 1.5 ETH |
| Music NFT mints (100 mints × 0.001 ETH × 10 releases) | 1.0 ETH |
| Treasury share (10% of music) | 0.1 ETH |
| **Total Treasury inflow** | **1.6 ETH** |

**Growth (500 members, 50 releases/month):**
| Source | Monthly Revenue |
|--------|----------------|
| ZOUNZ auctions | 3.0 ETH |
| Music NFT mints | 25.0 ETH |
| Treasury share (10%) | 2.5 ETH |
| **Total Treasury inflow** | **5.5 ETH** |

## Implementation Priority

1. **Phase 1:** Zora SDK integration + basic minting (Doc 142)
2. **Phase 2:** 0xSplits integration + artist dashboard (Doc 143)
3. **Phase 3:** ZOUNZ proposal templates for funding releases (this doc)
4. **Phase 4:** Auto-minting pipeline (approved proposals auto-deploy to Zora)
5. **Phase 5:** Cross-platform distribution (traditional DSPs via Unchained)

## Sources

- [ZOUNZ on Nouns Builder](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
- [Nouns Builder Docs](https://docs.nouns.build/)
- [Zora Protocol SDK](https://nft-docs.zora.co/protocol-sdk/introduction)
- [0xSplits Docs](https://docs.splits.org/)
- [ZAO OS community.config.ts — ZOUNZ contracts](../community.config.ts)
- [Nouns DAO Governance](https://www.nouns.com/learn/nouns-dao-governance-explained)
