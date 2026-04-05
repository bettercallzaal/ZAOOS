# 147 — The Full Distribution Pipeline: Audius Streaming + Zora Collecting + ZOUNZ Governance

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Design the end-to-end pipeline where one track upload flows to streaming (Audius), collecting (Zora), and governance (ZOUNZ)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Streaming** | Audius — free, decentralized, 250M+ streams, $AUDIO rewards, API for play tracking |
| **Collecting** | Zora on Base — ERC-1155 editions, 0xSplits revenue, secondary market |
| **Governance** | ZOUNZ DAO — treasury funds releases, community votes on features |
| **Pipeline** | Single upload → auto-distribute to all three |
| **Tracking** | Unified dashboard: streams (Audius) + mints (Zora) + revenue (Splits) |

## The Pipeline Architecture

```
Artist uploads ONE track via ZAO OS
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐
│ Audius ││ Zora   ││ IPFS   │
│Stream  ││ Mint   ││ Store  │
│        ││ (Base) ││        │
└───┬────┘└───┬────┘└───┬────┘
    │         │         │
    ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐
│$AUDIO  ││0xSplits││Metadata│
│Rewards ││Revenue ││Backup  │
└───┬────┘└───┬────┘└────────┘
    │         │
    └────┬────┘
         ▼
  ┌──────────────┐
  │ZAO Dashboard │
  │Unified Stats │
  └──────────────┘
```

## Audius Integration

### Upload via API
```typescript
// @audius/sdk
import { sdk } from '@audius/sdk';

const audiusSdk = sdk({
  appName: 'ZAO OS',
  apiKey: process.env.AUDIUS_API_KEY,
});

// Upload track to Audius
const { trackId } = await audiusSdk.tracks.upload({
  title: track.title,
  genre: track.genre,
  mood: track.mood,
  audioFile: track.audioBuffer,
  coverArt: track.coverArtBuffer,
});
```

### Track Plays via API
```typescript
// GET /v1/tracks/{trackId}/stream — streams with play counting
// GET /v1/tracks/{trackId} — returns play_count, repost_count, favorite_count
```

### $AUDIO Rewards
- Artists earn $AUDIO tokens based on streaming performance
- Season 1: 30M $AUDIO distributed (3% of 1.5B supply)
- Allocation: Streams 30%, Sales 20%, Wallet Balance 5%
- Oct 2025: Artists can launch their own tokens paired with $AUDIO

## Zora Integration (See Doc 142 for full details)

### Mint via Protocol SDK
- `create1155` → deploy edition on Base
- `payoutRecipient` → 0xSplits address
- Audio stored on IPFS, metadata on-chain

### Collector Economics
- Mint price set by artist/DAO
- Zora protocol rewards: 42.9% to creator
- Secondary market via Zora's Uniswap integration
- Referral rewards to ZAO treasury

## ZOUNZ Governance Layer

### How Governance Controls Distribution
- **Funding proposals:** "Fund Artist X's release — 0.1 ETH from Treasury"
- **Feature proposals:** "Add Audius upload to the minting flow"
- **Split proposals:** "Change default artist share to 85%"
- **Curation proposals:** "Feature Track Y on homepage for 1 week"

### Respect-Weighted Curation
Existing Respect system (`src/lib/music/curationWeight.ts`) weights:
- Higher Respect members' likes/reactions count more
- Trending algorithm surfaces community favorites
- Top-curated tracks nominated for DAO-funded releases

## Unified Artist Dashboard

```
┌──────────────────────────────────────────┐
│  My Music Dashboard                       │
│                                           │
│  "Summer Vibes" ─────────────────────     │
│                                           │
│  Streaming (Audius)                       │
│  ▓▓▓▓▓▓▓▓▓░░░░░░ 1,247 plays             │
│  $AUDIO earned: 12.5 AUDIO               │
│                                           │
│  Collecting (Zora/Base)                   │
│  ▓▓▓▓▓▓░░░░░░░░░ 42 collected            │
│  Revenue: 0.042 ETH                       │
│  Your share (80%): 0.0336 ETH            │
│                                           │
│  Community                                │
│  ♥ 23 likes | 🔥 Trending #3             │
│  Respect-weighted score: 847              │
│                                           │
│  [Withdraw Earnings] [Share on Farcaster] │
└──────────────────────────────────────────┘
```

## Revenue Comparison Per Track

| Source | Revenue Per Unit | Volume (100 members) | Monthly Est. |
|--------|-----------------|---------------------|-------------|
| Audius streams | ~$0.001 in $AUDIO | 1,000 plays | $1.00 |
| Zora NFT mints | 0.001 ETH ($3.50) | 20 mints | $70.00 |
| Zora secondary | 2.5% royalty | 5 resales | $8.75 |
| **Total per track** | | | **~$79.75** |

NFT collecting earns **70x more** than streaming alone. This is why the pipeline matters.

## Implementation Phases

### Phase 1: Zora Minting (Doc 142)
- SDK setup, minting UI, collection button
- 0xSplits integration

### Phase 2: Audius Upload
- Audius SDK integration
- Auto-upload on mint
- Play tracking dashboard

### Phase 3: ZOUNZ Governance Integration
- Proposal templates for funding releases
- Treasury revenue tracking
- Automated release pipeline

### Phase 4: Unified Dashboard
- Single view: streams + mints + revenue
- Farcaster share integration
- Artist analytics

## Sources

- [Audius Dev Docs](https://docs.audius.org/)
- [Audius SDK npm](https://www.npmjs.com/package/@audius/sdk)
- [$AUDIO Token Docs](https://docs.audius.org/learn/concepts/token/)
- [Audius Artist Airdrop](https://coinmarketcap.com/academy/article/audius-artist-appreciation-airdrop-guide-everything-you-need-to-know)
- [Zora Protocol SDK](https://nft-docs.zora.co/protocol-sdk/introduction)
- [0xSplits Docs](https://docs.splits.org/)
- [ZOUNZ on Nouns Builder](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
