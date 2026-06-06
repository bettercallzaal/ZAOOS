---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-21
original-query: "How do we bridge stream events (Twitch/StreamElements) to ZABAL Empire scoring and rewards? (reconstructed)"
related-docs: 627, 626, 625, 361, 324, 258, 283, 284, 222, 125
tier: DEEP
---

# 628 - Web3 Streaming + ZABAL Empire Bridge: From Stream Events to On-Chain Rewards

> **Goal:** Synthesize the full pipeline from real-time stream activity (Twitch + StreamElements per Doc 627) into on-chain ZABAL Empire scoring (per Doc 626 + 361), creator-coin mechanics (Zora), recurring fan support (Hypersub), revenue routing (0xSplits), tip checkout (Coinflow per Doc 125), agent automation (Privy + 0x per Doc 324), and viewer attestations (EAS). Hub doc - cross-links existing pieces, fills the streaming-specific bridge gaps.

> **Why this doc exists:** Doc 627 documented the streaming infra layer. Doc 626 documented Empire Builder mechanics. The synthesis - HOW stream events flow into ZABAL Empire scores - was missing. This doc closes it.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Stream event -> ZABAL score bridge** | USE the SAME `apiLeaderboards` pattern POIDH already ships (Doc 626). Build `/api/stream-leaderboard.json` returning `[{address, score}]` populated from StreamElements WebSocket events. Empire Builder pulls on schedule, applies boosters, distributes ZABAL. ZAO does not call Empire Builder write APIs |
| **Viewer wallet linkage** | USE Farcaster verified addresses as primary identity. Twitch viewer claims linkage by signing message in BCZ mini app context. Stored in Supabase `twitch_wallet_links` table. Coinbase Wallet integration with Farcaster (live 2026) makes this 1-click for many viewers |
| **Tipping checkout** | USE Coinflow Checkout widget for fiat-to-USDC tips on Base. Coinflow shipped subscriptions + universal tokenization Feb 2026 - covers card, ACH, Apple Pay, Google Pay, settles USDC to creator contract within minutes. Skip Twitch native subs for non-Affiliate channels (no rev share until Affiliate anyway) |
| **Recurring fan support** | USE Hypersub (Fabric STP) for monthly creator-supporter NFT subs on Base. ERC-721 time-bound, free/PWYW pricing supported, token-gated tiers - perfect for COC Concertz "season pass" and BCZ "consulting subscriber" tiers |
| **Revenue routing** | USE 0xSplits for tip + sub revenue split. Auto-routes USDC inflow to creator wallet + ZABAL Empire treasury + COC Concertz operations wallet. Audited, non-upgradeable, non-custodial. One contract per revenue stream |
| **Creator coins** | SKIP launching ZAO-side creator coins on Zora. ZABAL Empire is the existing currency - layering Zora creator coins fragments liquidity. EXCEPTION: per-stream commemorative content coins for milestone moments (first 1k follower stream, COC Concert anniversary) |
| **Watch-time attestations** | USE EAS offchain attestations for stream attendance (free - just signature). Timestamp on Base with bytes32 tx (cheap) only when issuing in batch (e.g., end-of-stream digest). Schema: `{streamerFid, viewerAddress, durationSeconds, peakConcurrentRank, sessionId}` |
| **NFT drops mid-stream** | USE Zora content coins via auto-mint webhook on stream milestones (raid received, peak viewer count, music drop). Trigger from StreamElements WebSocket -> Cloudflare Worker -> Zora SDK call. Each drop becomes a tradeable content coin (50% trade fee + 50% LP fee to creator) |
| **Agent execution layer** | USE Privy Agentic Wallet + 0x Swap API + Base Paymaster (per Doc 324). ZOE/BANKER agent reads stream events, swaps tip USDC -> ZABAL via 0x, deposits to Empire treasury, no human in loop, zero gas via Base Paymaster |
| **Sybil protection** | REQUIRE viewer wallet to hold > 0 ZABAL OR a Hypersub creator-supporter NFT OR > 1000 Respect to count for stream-leaderboard scoring. Filters bot/fake-account farming |
| **Multi-platform parity** | START Twitch-only. Stream events normalize through StreamElements WebSocket which already covers Twitch + YouTube + Facebook. Kick is chat-only via SE - skip until ZABAL has Kick-native users |

---

## Part 1 - The Pipeline (End-to-End)

```
                    [VIEWER ACTION ON TWITCH]
                              |
                              v
        StreamElements WebSocket event fires (Doc 627)
        types: tip | follow | subscriber | cheer | raid | host
                              |
                              v
        Cloudflare Worker subscribes to SE WebSocket
        Receives event { provider, type, data: { username, amount, ... } }
                              |
                              v
        Resolve viewer username -> wallet address
        Lookup order:
          1. Supabase twitch_wallet_links (cached, fast)
          2. Neynar by username -> Farcaster FID -> verified address
          3. Fall back to anonymous score (held until claimed)
                              |
                              v
        Calculate score delta per ZAO scoring matrix (see Part 4)
        e.g., $5 tip = 50 points, sub = 100 points, raid = 200 points
                              |
                              v
        UPSERT into Supabase stream_leaderboard table
                              |
                              v
        Edge function regenerates public JSON feed:
          https://bettercallzaal.com/stream-leaderboard.json
          (or zaoos.com/zabal-stream-leaderboard.json)
                              |
                              v
                Empire Builder cron (every N minutes)
                  GET <feed-url>
                  Apply ZABAL Empire boosters per address
                  Refresh on-chain leaderboard
                  Schedule ZABAL distribution per cycle
                              |
                              v
                $ZABAL distributed to viewer wallets on Base
                              |
                              v
       Optional: Zora content coin auto-mint on milestone events
       Optional: EAS attestation issued for stream attendance (batch)
```

This pipeline is deterministic, auditable, and reuses existing infra - the same `[{address, score}]` JSON contract POIDH leaderboard already ships (Doc 626).

---

## Part 2 - Component Map (What Goes Where)

| Component | Vendor / Stack | Cost | ZAO Doc |
|-----------|----------------|------|---------|
| Stream capture | OBS Studio | Free | 627 |
| Overlays + alerts + chatbot | StreamElements | Free | 627 |
| Realtime event source | StreamElements WebSocket (Socket.IO 2.2+) | Free | 627 |
| Viewer wallet identity | Farcaster verified address + Neynar | Free tier | (existing) |
| Mini app wallet | `@farcaster/miniapp-sdk` | Free | 626 |
| Score store | Supabase Postgres | Existing | (existing) |
| Score feed | Static JSON on Vercel/Cloudflare | $0 | 626 pattern |
| Score consumer | Empire Builder apiLeaderboards | Free | 626, 361 |
| Token contract | $ZABAL ERC-20 on Base (`0xbB48f19B...`) | n/a | 324 |
| Tip checkout | Coinflow Checkout widget | Coinflow rev share | 125 |
| Recurring sub | Hypersub (Fabric STP) on Base | ~5% protocol fee | New |
| Revenue split | 0xSplits on Base | Gas only | New |
| Agent wallet | Privy Agentic Wallet | Free 0-499 MAU | 324, 283, 284 |
| Swap aggregator | 0x Swap API v2 | Free 100K calls/mo | 324 |
| Gas sponsorship | Coinbase Base Paymaster | $15K Base credits | 324 |
| Watch-time attestation | EAS on Base | Free (offchain) / cheap (batch onchain) | New |
| NFT/content coin drop | Zora SDK on Base | 50% trade fee to creator | New |
| Webhook bridge | Cloudflare Worker | Free tier covers it | 626 |

---

## Part 3 - Stream Event -> Score Translation

Maps StreamElements WebSocket event payload (Doc 627 Part 2) to ZABAL Empire score contribution. Tunable; numbers below are STARTING values.

### Twitch Events

| Event | Payload | Score Formula | Notes |
|-------|---------|---------------|-------|
| `follow` | `{username}` | +5 | One-time per username; idempotent on dedupe |
| `subscriber` (Tier 1, $4.99) | `{tier: 1000, streak}` | +100 + streak * 10 | Resub streak rewards loyalty |
| `subscriber` (Tier 2, $9.99) | `{tier: 2000}` | +250 | |
| `subscriber` (Tier 3, $24.99) | `{tier: 3000}` | +600 | |
| `cheer` (bits) | `{amount: <bits>}` | amount * 0.05 | 100 bits = 5 points |
| `tip` (Coinflow / SE tip page) | `{amount: <USD>}` | amount * 10 | $5 tip = 50 points |
| `raid` (received) | `{viewers}` | min(viewers * 2, 500) | Cap on raid score |
| `host` (received) | `{viewers}` | min(viewers, 250) | Legacy, lower weight than raid |
| `chat-message` | `{message}` | +1 (capped 20/hr) | Anti-spam cap |
| `watch-time` | derived | minutesWatched * 0.5 | Polled separately, not from SE |

### Multipliers (Doc 361 Part 2)

```
finalScore = sum(rawEvents) * stakingMultiplier * empireMultiplier
```

- `stakingMultiplier` (SongJam side, SANG stake): 2.1x to 3.0x via `1 + sqrt(stake / 250000)`
- `empireMultiplier` (Empire Builder side, ZABAL holdings + activity): 4.0x to 8.6x

A viewer with $10 in ZABAL + active Empire participation can hit ~25x effective scoring vs a wallet with zero ZABAL. Aligns incentives: hold + engage = earn more.

### Sybil Filter

Score contributions only count if viewer wallet meets ONE of:
1. Holds > 0 ZABAL on Base
2. Holds active Hypersub creator-supporter NFT
3. Has > 1000 Respect score in ZAO OS
4. Farcaster verified address with > 100 followers

Below threshold = score accumulates but does not get boosters; effectively low-weight participation.

---

## Part 4 - Coinflow Tip Checkout for Streams

Reuses Doc 125 patterns. Specifics for streaming:

### Component

```jsx
import { CoinflowPurchase } from '@coinflow/react';

<CoinflowPurchase
  merchantId={process.env.COINFLOW_MERCHANT}
  blockchain="base"
  settlementType="usdc"
  walletAddress={creatorContract}  // 0xSplits contract
  onSuccess={(tx) => fireStreamElementsTip(tx)}
  amount={selectedAmount}
  email={viewer?.email}
/>
```

### Settlement -> Split -> Score

1. Viewer pays $5 via card (Coinflow Checkout)
2. Coinflow settles 5 USDC on Base to **0xSplits contract** (creator share + ZABAL treasury share + COC ops share)
3. Coinflow webhook fires to ZAO API (HMAC-verified, 24+ event types)
4. API route normalizes to a "tip" event, posts to StreamElements alert (animated visual on stream) AND adds to score feed
5. Empire Builder pulls feed on next refresh, distributes ZABAL with boosters

### Coinflow Subscriptions (Feb 2026)

For "creator-supporter monthly $5" tier - Coinflow handles recurring card billing, mints Hypersub NFT on first payment, burns/expires NFT on cancellation. Pairs Coinflow rails with Hypersub onchain identity.

---

## Part 5 - Hypersub for Recurring Stream Support

Hypersub = Fabric Subscription Token Protocol. ERC-721 NFT per supporter, time-bound (1mo, 3mo, 1yr).

### Tier Design (Example for BCZ Stream)

| Tier | Price | Duration | Perks |
|------|-------|----------|-------|
| Free / PWYW | $0+ | 30 days | StreamElements alert at $1+, name in credits |
| Supporter | $5 | 30 days | Discord channel access, weekly stream digest |
| Patron | $25 | 30 days | DM access to Zaal, priority Q&A in streams |
| Founding | $100 | 365 days | Annual on-chain badge NFT, 1-on-1 call quarterly |

### On-Chain Mechanics

- Each tier = one Hypersub contract on Base
- Holding active Hypersub NFT = booster eligibility in Empire Builder via ZAO custom booster rule
- Non-transferrable tier flag prevents resale of perks
- Bundles allow stacking (e.g., COC Concertz + BCZ for discount)

### Why Hypersub > Twitch Native Subs

| Dimension | Twitch Native Sub | Hypersub |
|-----------|-------------------|----------|
| Affiliate gate | YES (50 followers, 500 min, 7 days, 3 avg) | NO - works day 1 |
| Rev split | 50% (Affiliate) to 70% (Partner) | ~95% creator (Fabric protocol fee ~5%) |
| Payout delay | NET 15 above $50 | Instant on-chain |
| Lock-in | Twitch only | Portable - works on YouTube + Kick + IRL |
| Identity | Twitch handle | NFT in viewer wallet, follows them everywhere |
| Programmable | NO | YES (token-gating, splits, multipliers) |

For a non-Affiliate creator, Hypersub is strictly better. For an Affiliate, run BOTH - viewers self-select based on preferred rails.

---

## Part 6 - 0xSplits Revenue Routing

Audited, non-upgradeable smart-contract splits on Base. Single contract = N recipients with weights.

### Recommended Splits per Revenue Source

#### BCZ Personal Stream Tips

```
Coinflow tip $X USDC -> 0xSplits contract -> {
  85% Zaal personal wallet,
  10% ZABAL Empire treasury,
  5% ZAO operations multisig
}
```

#### COC Concertz Live Stream Tips (artist-attributed)

```
Tip during artist's set -> 0xSplits contract -> {
  60% performing artist wallet,
  20% COC Concertz operations,
  15% ZABAL Empire treasury,
  5% ZAO operations multisig
}
```

#### Hypersub Subscription Revenue

```
$25 Patron sub -> Hypersub contract (~5% protocol fee) -> 0xSplits -> {
  70% creator,
  20% ZABAL treasury (used for buyback per Doc 258),
  10% COC ops
}
```

### Implementation Cost

- One-time deploy per split: ~$2-5 in gas on Base
- Per-distribution gas: ~$0.10
- Audit status: Audited, public source, non-upgradeable

---

## Part 7 - EAS Watch-Time Attestations

### Schema (Base)

```solidity
struct StreamAttendance {
  uint256 streamerFid;       // Farcaster ID of streamer
  address viewer;            // Viewer wallet
  uint64 sessionStart;       // Unix timestamp
  uint64 durationSeconds;    // Time watched
  uint16 peakConcurrentRank; // Position in concurrent viewer ranking
  bytes32 sessionId;         // Unique session identifier
}
```

### Cost Strategy

| Mode | When | Cost |
|------|------|------|
| Offchain attestation | Per viewer per stream | Free (signature only) |
| Batch onchain timestamp | End of stream digest, all attendees in one bytes32 root | ~$0.05-0.50 on Base |
| Per-attestation onchain | Premium streams (paid VOD, high-value) | ~$0.01-0.05 each on Base |

### Use Cases

1. **Reputation building** - "Watched 500+ hours of COC streams" = unlocks badge, Empire booster, Hats role
2. **Retroactive airdrops** - Snapshot attendance attestations as airdrop input
3. **Cross-platform proof** - Viewer takes attestation to other platforms (Lens, Bluesky) as proof-of-fan
4. **Anti-Sybil for governance** - Stream-attendance proof in governance vote eligibility

### Tooling

- `@ethereum-attestation-service/eas-sdk` for issuing
- `base.easscan.org` for indexing/explorer
- Bonfire (Doc 542, 546) reads attestations as social-graph signals

---

## Part 8 - Zora Content Coins for Stream Drops

Each Zora post can be tokenized as a tradeable "content coin" - ERC-20 on Base, fixed supply, 50% trade fee + 50% LP fee to creator.

### Stream Milestone Triggers

| Trigger | Zora Drop |
|---------|-----------|
| First 1k followers | Commemorative content coin (limited mint window) |
| Peak concurrent viewer record | "Record breaker" coin |
| Major raid received from > 100 viewers | Co-branded coin (creator + raider) |
| Music drop / album release stream | Album cover coin |
| Annual COC anniversary | Anniversary coin (yearly tradition) |

### Auto-Mint Architecture

```
StreamElements event (raid/follow milestone)
  -> Cloudflare Worker
  -> Zora API call (ERC-20 deploy + initial liquidity seed)
  -> Mint to viewers who attended (EAS attestation as proof)
```

### Why Zora Content Coins NOT Replacement for ZABAL

- ZABAL = persistent ecosystem currency (held, staked, multiplier-bearing)
- Zora content coin = ephemeral commemorative (specific moment)
- Liquidity stays separate; ZABAL routes treasury value, Zora coin trades on memetic appreciation

---

## Part 9 - Agent Layer (ZOE / BANKER)

Per Doc 324, the agent stack is Privy + 0x + Base Paymaster. Streaming-specific roles:

### ZOE (community-facing agent)

- Listens to StreamElements chat events via WebSocket
- Posts contextual ZABAL/Empire info on viewer commands (`!zabal`, `!score`, `!boosters`)
- Casts to Farcaster on stream-online (Doc 627 EventSub trigger)
- Replies to viewer questions about ZABAL economics

### BANKER (treasury agent)

- Reads tip/sub inflows from 0xSplits contracts
- Swaps a portion of inflow USDC -> ZABAL via 0x Swap API
- Deposits to ZABAL Empire treasury for booster funding
- Burns 1% on every swap per Doc 361 V3 burn endpoint
- Zero human in loop, zero gas via Base Paymaster

### Policy Controls (Privy Agentic Wallet)

- Daily transfer limit: 1 ETH worth
- Allowlist contracts: 0x Swap, ZABAL ERC-20, 0xSplits, Empire Builder
- Time windows: only during streamer's broadcast hours + 1hr after
- Signed-tx requirement: > $100 movement requires Zaal multisig co-sign

---

## Part 10 - Crypto Streaming Landscape (Sentiment + Competitors)

### What others are doing (mid-2026)

| Platform | Crypto Integration | Threat / Opportunity |
|----------|-------------------|---------------------|
| **Twitch** | $ZAP partnership (tipping, subs, on-chain fan engagement) | Twitch is moving in - ZAO must build on their rails before native Twitch tools commoditize |
| **Pump.fun streaming** | Native crypto streaming, memecoin-first | Validates demand; not a fit for music/community focus |
| **Kick + Bonk.fun** | Native BONK integration on Solana | ZAO is Base-native; not a direct competitor |
| **Sidekick** | "Trade tokens, send tips, claim airdrops inside stream" | Closest analog. Watch their UX for inspiration |
| **Zora** | Content coins, creator coins on Base | Use as drop platform, not replacement |
| **NFTwitch (2021 hackathon)** | Chainlink oracle to Twitch follower count -> dynamic NFT | Dead, but pattern is reusable |

### Community sentiment (Reddit + Medium synthesis)

**Pro-crypto-tipping streamer voices:**
- "Crypto tips land in your wallet within minutes vs Twitch's 15-day NET 15" (Onestream blog)
- Bypasses Affiliate gate entirely - creator earns from day one
- Global reach without payout-country restrictions

**Anti-crypto-tipping streamer voices:**
- "Most viewers don't have wallets" - solved via Coinflow card-to-USDC
- "On-chain tax confusion" - 0xSplits keeps splits transparent for accounting
- "NFT fatigue" - skip "NFT" framing, lean on creator-coin / supporter-pass language

**Community signal verdict:** Web3 tipping is a vitamin not a painkiller for non-crypto-native streamers; it IS a painkiller for crypto-native communities like ZAO. Build for ZAO-first, not Twitch-mainstream-first.

---

## Part 11 - Phase Plan

### Phase 1 (this month) - Tipping rail

1. Deploy 0xSplits for BCZ tip flow (85/10/5)
2. Embed Coinflow Checkout on `bettercallzaal.com/streaming` page
3. Hook StreamElements alert on tip webhook
4. Manually credit score via existing POIDH-style JSON feed

### Phase 2 (next month) - Empire integration

1. Deploy `stream-leaderboard.json` feed (mirror POIDH pattern from Doc 626)
2. Hand URL to Adrian / yerbearserker for Empire Builder apiLeaderboard config on $ZABAL Empire
3. Add Sybil filter (ZABAL holdings or Hypersub NFT or Respect threshold)
4. Empire pulls + applies boosters + distributes ZABAL on schedule

### Phase 3 (Q3 2026) - Recurring + attestations

1. Deploy Hypersub tiers for BCZ + COC Concertz
2. EAS schema deploy on Base; offchain attestations per viewer per stream
3. Batch on-chain timestamp at end of each stream (Merkle root of session attestations)
4. Bonfire (Doc 542, 546) reads attestations as graph signals

### Phase 4 (Q4 2026) - Drops + agents

1. Zora content coin auto-mint for milestone events
2. ZOE agent live in stream chat with ZABAL commands
3. BANKER agent automates tip-USDC -> ZABAL swap + Empire treasury deposit
4. Cross-stream booster portability (watch BCZ AND COC = stacked multiplier)

---

## Open Questions / Risks

| Question | Mitigation |
|----------|------------|
| Does Empire Builder v3 apiLeaderboard support refresh frequency below 1hr? | Confirm with Adrian; if not, batch score updates on the BCZ side |
| Twitch ToS on third-party tipping rails (Coinflow vs SE Tip) | Twitch tolerates third-party tips off-platform; risk = chargeback liability lives with creator |
| Coinflow availability in viewer's region | Coinflow supports US + EU + LATAM (PIX); some Asia gaps |
| Zora content coin spam on every milestone | Rate-limit to 1 drop per stream max; batch milestones |
| EAS schema versioning if we change scoring fields | Deploy new schema version; old attestations remain valid for prior period |
| ZABAL liquidity ($552 TVL per Doc 324) chokes BANKER swap volume | Throttle swap size; route via 0x multi-hop ZABAL <-> ETH <-> USDC |
| Sybil farming via cheap Farcaster account creation | Require verified address ($25 hold + linked X/phone/GH) for booster eligibility |
| Hypersub fee (~5%) erodes margin | Acceptable given creator-side rev share is 95% vs Twitch's 50% |

---

## Also See

- [Doc 627 - Twitch Streaming + StreamElements](../../cross-platform/627-twitch-streaming-streamelements-integration/) - Streaming infra layer
- [Doc 626 - Empire Builder + ZABAL POIDH airdrop](../626-empire-builder-zabal-poidh-airdrop/) - apiLeaderboards pattern, $ZABAL Empire ground truth
- [Doc 625 - POIDH x ZAO bounty playbook](../../community/625-poidh-x-zao-bounty-playbook/) - POIDH as on-chain submission rail
- [Doc 361 - Empire Builder v3 Integration](../361-empire-builder-deep-dive-v3-integration/) - v3 API, multiplier formula, distribute/burn endpoints
- [Doc 324 - ZABAL/SANG Wallet Agent Tokenomics](../324-zabal-sang-wallet-agent-tokenomics/) - 0x + Privy + Base Paymaster agent stack
- [Doc 258 - ZABAL/SANG buyback](../258-zabal-sang-buyback/) - Treasury buyback flow
- [Doc 283 - Privy Embedded Wallets](../../identity/283-privy-embedded-wallets-fishbowlz-token-mechanics/) - Wallet provider rationale
- [Doc 222 - Payment Infrastructure (Stripe + Coinbase)](../222-payment-infrastructure-stripe-coinbase/) - Fiat rail comparison
- [Doc 125 - Coinflow Fiat Checkout](../../125-coinflow-fiat-checkout/) - Coinflow integration patterns
- [Doc 542 / 546 / 569 - Bonfire reputation graph](../../identity/) - Attestation consumer

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Phase 1 - deploy 0xSplits contracts (BCZ 85/10/5, COC 60/20/15/5) on Base | @Zaal | Smart contract deploy | 2026-05-23 |
| Phase 1 - add Coinflow Checkout to BCZ streaming page (`bettercallzaal.com/streaming/tip.html`) | @Zaal | PR (BCZ repo) | 2026-05-23 |
| Phase 1 - Cloudflare Worker bridging StreamElements WebSocket -> Supabase `stream_events` | @Zaal | PR | 2026-05-30 |
| Phase 2 - deploy `stream-leaderboard.json` feed using POIDH pattern from Doc 626 | @Zaal | PR | 2026-06-06 |
| Phase 2 - hand feed URL to Adrian/yerbearserker for Empire Builder apiLeaderboard config | @Zaal | DM | 2026-06-06 |
| Phase 2 - Sybil filter rules in Supabase view (ZABAL > 0 OR Hypersub OR Respect > 1000) | @Zaal | Migration | 2026-06-06 |
| Phase 3 - Hypersub tier deployment for BCZ (4 tiers: Free, $5, $25, $100) | @Zaal | Hypersub UI | 2026-06-20 |
| Phase 3 - EAS StreamAttendance schema deploy on Base | @Zaal | EAS deploy | 2026-06-20 |
| Phase 3 - end-of-stream Merkle root batch timestamp script | @Zaal | PR | 2026-07-04 |
| Phase 4 - Zora content coin auto-mint Cloudflare Worker | @Zaal | PR | Q3 2026 |
| Phase 4 - ZOE agent stream chat commands (`!zabal`, `!score`, `!boosters`) | @Team | PR | Q3 2026 |
| Phase 4 - BANKER agent tip-USDC -> ZABAL swap automation | @Team | PR | Q4 2026 |
| Confirm Empire Builder v3 apiLeaderboard refresh frequency (target sub-hour) | @Zaal | DM Adrian | 2026-05-16 |
| Add Hypersub creator-supporter NFT booster rule to ZABAL Empire on Empire Builder | @Zaal | Empire Builder UI | After Phase 3 |

---

## Sources

### Web3 + Token Stack

- [Empire Builder docs](https://www.empirebuilder.world/) - apiLeaderboards, v3 launch 2026-05-09. Verified 2026-05-09
- [Empire Builder GitBook](https://empire-builder.gitbook.io/empire-builder-docs) - API surface, multiplier mechanics
- [Hypersub by Fabric](https://hypersub.xyz/) - ERC-721 subscriptions on Base. Verified 2026-05-09
- [Fabric Hypersub docs](https://docs.withfabric.xyz/hypersub/overview) - Tier mechanics, free/PWYW pricing, token gating. Verified 2026-05-09
- [Fabric STP v2 docs](https://docs.withfabric.xyz/stp/overview) - Subscription Token Protocol underlying Hypersub. Verified 2026-05-09
- [0xSplits](https://0xsplits.mirror.xyz/) - Audited split contracts on Base. Verified 2026-05-09
- [0xSplits GitHub](https://github.com/0xSplits/splits-contracts) - Source code, audit links
- [0xSplits + Hypersub announcement](https://x.com/0xSplits/status/1826713965516533790) - "onchain Patreon" framing
- [Zora ecosystem guide](https://zerion.io/blog/guide-to-the-zora-ecosystem/) - Creator coins, content coins, fee model
- [Zora token guide](https://www.coingecko.com/learn/what-is-zora-crypto) - $ZORA on Base, 10B supply, 20% community incentive
- [Coinflow Checkout](https://coinflow.cash/) - Fiat-to-USDC on Base. Verified 2026-05-09
- [Coinflow Feb 2026 update](https://coinflow.cash/blog/new-at-coinflow-february-2026/) - Universal tokenization, subscriptions
- [Coinflow API docs](https://docs.coinflow.cash/guides/payouts/implementation-methods/api-integration) - Implementation reference

### Identity + Attestations

- [EAS docs](https://docs.attest.org/) - Schemas, onchain vs offchain. Verified 2026-05-09
- [EAS onchain vs offchain](https://docs.attest.org/docs/core--concepts/onchain-vs-offchain) - Cost model
- [EAS Base scanner](https://base.easscan.org/) - Schema explorer on Base
- [Quicknode EAS guide](https://www.quicknode.com/guides/ethereum-development/smart-contracts/what-is-ethereum-attestation-service-and-how-to-use-it) - Implementation tutorial
- [Farcaster mini-app wallets](https://miniapps.farcaster.xyz/docs/guides/wallets) - Verified address pattern. Verified 2026-05-09
- [Squid Router - link wallet to Warpcast](https://www.squidrouter.com/squid-school/link-wallet-address-warpcast-guide) - Verification flow
- [Farcaster in 2025: The Protocol Paradox - BlockEden](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/) - State of Farcaster mid-2025

### Streaming Crypto Landscape

- [Onestream - 7 Reasons Crypto Payments for Streamers](https://onestream.live/blog/accept-crypto-payments-as-streamers/) - Pro-crypto streamer thesis
- [Aurpay - YouTube/Twitch crypto monetization 2026](https://aurpay.net/aurspace/youtube-twitch-podcast-monetization-crypto-beyond-ads-2026/) - Beyond-ads strategy
- [Medium - Twitch + $ZAP web3 partnership](https://medium.com/@warriorcoincmc/twitch-poised-for-web3-integration-as-streaming-and-crypto-ecosystems-converge-fafc1a7592f8) - Twitch native crypto direction
- [Medium - Sidekick web3 streaming](https://medium.com/@XT_com/livestream-earn-repeat-the-sidekick-web3-experience-3babeadb09dc) - Closest competitor analog
- [NFTwitch GitHub (2021 hackathon)](https://github.com/AntonStrickland/nftwitch) - Chainlink-Twitch oracle precedent
- [Mintable - Twitch Supporter Badges via NFTs](https://mintable.medium.com/how-to-earn-eth-making-nfts-twitch-supporter-badges-for-donating-d3801f79b08c) - Pattern reference

### Twitch Reference (Doc 627 carry-over, validated again)

- [Twitch EventSub docs](https://dev.twitch.tv/docs/eventsub/) - Conduits, WebSocket transport. Verified 2026-05-09
- [Twitch IRC migration](https://dev.twitch.tv/docs/chat/irc-migration/) - Move to EventSub. Verified 2026-05-09
- [StreamElements WebSocket docs](https://github.com/StreamElements/api-docs/blob/main/docs/Websockets.md) - Event payload reference. Verified 2026-05-09
- [StreamElements OAuth2 docs](https://dev.streamelements.com/docs/api-docs/cd02cda5171ea-o-auth2) - Auth modes. Verified 2026-05-09
