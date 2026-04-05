# 148 — Master Integration Plan: ZAO On-Chain Music Distribution Service

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Unified implementation roadmap bringing together all research (Docs 139-147) into a single plan for building ZAO's on-chain music distribution service

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Stack** | Zora Protocol SDK + 0xSplits + ZOUNZ governance (all on Base) |
| **UX** | Dead-simple 3-step mint flow for non-crypto-native artists |
| **Revenue** | 80/10/10 default split (artist/treasury/curator) |
| **Open source** | Everything forkable via community.config.ts |
| **Timeline** | 5 phases, 6-8 weeks total |

## Research Summary (Docs 139-148)

| Doc | Topic | Key Takeaway |
|-----|-------|-------------|
| 139 | Trustware SDK | Monitor only — too early. Use Zora + Splits instead. |
| 140 | BuilderOSS Ecosystem | ZOUNZ already deployed. Use builder-farcaster for notifications. builder-template-app for governance UI patterns. |
| 141 | On-Chain Distribution Landscape | Hybrid model: Zora NFTs + traditional DSP distribution via Unchained. |
| 142 | Zora Protocol SDK | create1155 for music editions on Base. ~$1.05 total cost per release. |
| 143 | 0xSplits | Automated revenue distribution. 80/10/10 splits. Immutable + trustless. |
| 144 | ZOUNZ + Music NFTs | DAO-governed distribution. Proposals fund releases. Treasury earns from splits. |
| 145 | Simple NFT Platform | 3-step mint flow. Server-side abstraction. Mobile-first. Gas sponsorship. |
| 146 | Open Contracts | Forkable trio: Nouns Builder + Zora + Splits. community.config.ts = fork point. |
| 147 | Full Pipeline | Single upload → Audius (streaming) + Zora (collecting) + ZOUNZ (governance). |

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    ZAO OS Frontend                    │
│              (Next.js 16 + React 19)                  │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │MintTrack │  │Collect   │  │Dashboard │            │
│  │(Artist)  │  │Track     │  │(Artist)  │            │
│  │          │  │(Fan)     │  │          │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │              │              │                  │
│  ┌────▼──────────────▼──────────────▼─────┐           │
│  │           API Routes Layer              │           │
│  │  /api/music/mint/create                 │           │
│  │  /api/music/mint/collect                │           │
│  │  /api/music/mint/dashboard              │           │
│  └────┬──────────────┬──────────────┬─────┘           │
└───────┼──────────────┼──────────────┼─────────────────┘
        │              │              │
   ┌────▼────┐    ┌───▼────┐    ┌───▼────┐
   │  Zora   │    │0xSplits│    │ IPFS   │
   │Protocol │    │        │    │(Pinata)│
   │  SDK    │    │  SDK   │    │        │
   └────┬────┘    └───┬────┘    └────────┘
        │              │
   ┌────▼──────────────▼────┐
   │     Base Chain          │
   │                         │
   │  ZOUNZ Contracts        │
   │  Zora 1155 Contracts    │
   │  0xSplit Contracts      │
   └─────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** SDK setup + basic minting

| Task | Files | Effort |
|------|-------|--------|
| Install `@zoralabs/protocol-sdk` + `@0xsplits/splits-sdk` | package.json | 15 min |
| Create `src/lib/music/zora.ts` — Creator/Collector clients | New file | 2 hrs |
| Create `src/lib/music/splits.ts` — Splits client + helpers | New file | 2 hrs |
| Add music NFT config to `community.config.ts` | Edit | 30 min |
| Create `POST /api/music/mint/metadata` — IPFS upload | New route | 3 hrs |
| Create `POST /api/music/mint/create` — Zora 1155 creation | New route | 4 hrs |

### Phase 2: Minting UI (Week 2-3)
**Goal:** Artist-facing mint form + collector button

| Task | Files | Effort |
|------|-------|--------|
| Build `MintTrack.tsx` — 3-step mint form | New component | 6 hrs |
| Build `CollectTrack.tsx` — collect button on track cards | New component | 3 hrs |
| Build `MintSuccess.tsx` — post-mint share flow | New component | 2 hrs |
| Add "Collect" to existing `MusicEmbed.tsx` | Edit | 2 hrs |
| Mobile-first responsive design | Styling | 3 hrs |

### Phase 3: Revenue & Dashboard (Week 3-4)
**Goal:** Artist earnings dashboard + treasury tracking

| Task | Files | Effort |
|------|-------|--------|
| Create `POST /api/music/mint/collect` — collector mint route | New route | 3 hrs |
| Create `GET /api/music/mint/dashboard` — artist earnings | New route | 4 hrs |
| Build `ArtistEarnings.tsx` — revenue dashboard | New component | 5 hrs |
| Add Treasury music revenue to ZOUNZ dashboard | Edit | 3 hrs |
| Integrate mint count as engagement signal in trending | Edit | 2 hrs |

### Phase 4: Governance Integration (Week 4-5)
**Goal:** ZOUNZ proposals can fund and control releases

| Task | Files | Effort |
|------|-------|--------|
| Proposal templates for funding releases | New component | 4 hrs |
| Auto-create Zora mint from approved proposal | New API route | 6 hrs |
| Treasury revenue tracking from splits | New component | 3 hrs |
| @builderbot integration for mint notifications | Config | 2 hrs |

### Phase 5: Distribution Pipeline (Week 6-8)
**Goal:** Full pipeline with streaming + traditional DSPs

| Task | Files | Effort |
|------|-------|--------|
| Audius SDK integration — upload on mint | New lib + route | 8 hrs |
| Unified artist dashboard (streams + mints + revenue) | New component | 6 hrs |
| Unchained Music API for DSP distribution (optional) | New lib + route | 6 hrs |
| Open-source deployment guide for forking communities | Documentation | 4 hrs |

## New Dependencies

```json
{
  "@zoralabs/protocol-sdk": "^0.9.0",
  "@0xsplits/splits-sdk": "^6.4.1",
  "@audius/sdk": "^5.0.0"
}
```

## New Files Summary

```
src/
├── lib/music/
│   ├── zora.ts           # Zora Protocol SDK client
│   └── splits.ts         # 0xSplits client + helpers
├── app/api/music/mint/
│   ├── create/route.ts   # Create 1155 edition
│   ├── collect/route.ts  # Collector mint
│   ├── metadata/route.ts # IPFS upload
│   └── dashboard/route.ts # Artist earnings
├── components/music/
│   ├── MintTrack.tsx      # 3-step mint form
│   ├── CollectTrack.tsx   # Collect button
│   ├── MintSuccess.tsx    # Post-mint share
│   └── ArtistEarnings.tsx # Revenue dashboard
```

## Success Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Tracks minted | 10 | 50 |
| Total mints (collectors) | 100 | 1,000 |
| Artist revenue (ETH) | 0.5 | 5.0 |
| Treasury revenue (ETH) | 0.05 | 0.5 |
| Communities forked | 0 | 2 |

## Cross-References

| Doc | Relevance |
|-----|-----------|
| [78 — Nouns Builder Integration](../../_archive/078-nouns-builder-integration/) | ZOUNZ deployment details |
| [108 — Music NFT Landscape](../../_archive/108-music-nft-landscape-2026/) | Platform comparison, market size |
| [29 — Artist Revenue](../../business/029-artist-revenue-ip-rights/) | Revenue models, streaming economics |
| [128 — Music Player Audit](../../music/190-music-player-complete-audit/) | Existing music infrastructure |
| [130 — Next Music Integrations](../../music/130-next-music-integrations/) | Tier 4 features including Zora + Splits |
| [131 — On-Chain Governance](../../_archive/131-onchain-proposals-governance/) | ZOUNZ Governor integration |
| [138 — Play Counting](../../music/138-play-counting-stream-attribution/) | Stream attribution for tracking |
| [139-147 — This series](.) | Individual component research |

## Sources

All sources from Docs 139-147, consolidated:
- [Trustware](https://www.trustware.io/) | [SDK Demo](https://sdk.trustware.io/home)
- [BuilderOSS](https://github.com/BuilderOSS) | [Nouns Builder](https://nouns.build/)
- [Zora Protocol SDK](https://nft-docs.zora.co/protocol-sdk/introduction) | [npm](https://www.npmjs.com/package/@zoralabs/protocol-sdk)
- [0xSplits](https://docs.splits.org/) | [SDK](https://www.npmjs.com/package/@0xsplits/splits-sdk) | [Zora Integration](https://splits.org/blog/zora-integration/)
- [Audius](https://docs.audius.org/) | [SDK](https://www.npmjs.com/package/@audius/sdk) | [$AUDIO](https://docs.audius.org/learn/concepts/token/)
- [Unchained Music](https://www.unchainedmusic.io/) | [OnChain Music](https://onchainmusic.com/)
- [ZOUNZ DAO](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
- [Chainlink: Tokenized Royalties](https://chain.link/article/tokenized-royalties-smart-contracts)
- [Music NFT Market 2026](https://synodus.com/blog/blockchain/music-nft-marketplace/)
