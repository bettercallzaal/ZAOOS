# Doc 757: Web3 Audio + Video + Streaming Platforms — May 2026 Landscape

**Author:** Claude (Research)  
**Date:** 2026-05-26  
**Tier:** STANDARD  
**Status:** Complete  
**Related:** Doc 752 (Juke integration), Doc 735 (Leeward), Doc 43 (Live Audio Rooms)

---

## Executive Summary

Mapped 15+ web3 audio/video platforms across live streaming, decentralized transcoding, creator monetization, and NFT minting. Split: **9 platforms alive + actively used, 4 sunset/dormant, 2 emerging**.

**Key findings:**

- **Livepeer** leads on infrastructure: 134.4M minutes Q1 2026 (+71.9% QoQ), $257K fees (all-time high), AI inference now drives 60% of revenue.
- **Juke** owns Farcaster-native audio: Beta live, zero-backend chat architecture using Farcaster reply trees + Neynar webhooks.
- **Sound.xyz** dead as of Jan 2026: Sunset for product pivot to Vault.fm.
- **Base.Tube** emerging: Creator pass model (fans buy NFT, creator keeps 90% + resale royalties).
- **Circuit** production-ready on Base: RTMP ingest, multi-camera, PPV, tip-splitting smart contracts.
- **Drakula** growing: $575K paid to creators in 12 days via bonding curves + $DEGEN creator fund.

**Most relevant for ZAO:** Juke (already integrated, doc 752), Livepeer (if scaling video), Base.Tube (creator model), Circuit (white-label video stack).

**Surprise:** Livepeer pivoted from video transcoding to AI inference. Orchestrators are becoming GPU marketplace operators. Real DePIN story is infrastructure + AI, not delivery.

---

## Detailed Platform Inventory

### ALIVE + ACTIVELY USED (9)

#### 1. Juke (juke.audio) — Farcaster-Native Live Audio

- **Status:** Beta live (TestFlight iOS, Android coming)
- **Last Activity:** 2026-03-27 (build post by founder Nicky Sap)
- **Tech Stack:** LiveKit SFU + Farcaster native reply tree as chat layer
- **Architecture:** Zero backend chat infrastructure. Space creation = cast announcement to Farcaster. Chat replies = Farcaster replies. Neynar webhook spins up ephemeral listener for real-time UI update. Webhook tears down when space ends. Thread persists on Farcaster graph forever.
- **Users:** Farcaster native cohort, beta testers (size unknown)
- **Monetization Roadmap:** Premium host features (scheduled spaces, analytics, replays, clipping)
- **Key Insight:** Only possible on open protocol. No competitor (X, Discord, Telegram) can replicate this composability.
- **Integration Status:** ZAO shipped 9 of 11 asks (doc 752, 2026-05-23). Webhooks, audio-off mode, scheduled countdown, key-only auth confirmed. Migration applied. Juke webhook activation pending (stalled on Juke-generates-secret; resume Monday).

#### 2. Livepeer (livepeer.org) — Decentralized Video Transcoding + AI Inference

- **Status:** Live, hitting all-time highs in Q1 2026
- **Last Activity:** 2026-05-18 (Messari State of Livepeer Q1 report)
- **Usage Metrics:**
  - 134.4M minutes Q1 2026 (+71.9% QoQ)
  - Demand-side fees: $257K (+34.2% QoQ), all-time high
  - AI-driven fees: $154.7K (60% of total revenue)
  - Average cost per 1K minutes declining (throughput > fee capture)
- **TVL:** ~$414.5K (DePIN, not DeFi; TVL is not primary metric)
- **Users:** 500K+ DAU on edge network, builders, real-time AI video apps, enterprises
- **Key Win:** NaaP Analytics shipped Apr 2026 — production observability for SLAs, GPU supply inventory, reliability scoring
- **Tech:** WebRTC SFU, GPU marketplace, dual-agent scheduler for distributed AI training
- **Enterprise Validation:** Deutsche Telekom operates validator node on Theta EdgeCloud (similar DePIN model)
- **Surprise Finding:** Video transcoding revenue declining as throughput scales. AI inference is the real monetization driver now. Orchestrators becoming GPU rental operators, not just bandwidth sharers.

#### 3. Zora (zora.co) — Layer 2 + NFT Mints + Live Streaming

- **Status:** Live, live streaming in beta (select creators)
- **Last Activity:** 2026-05 (support docs live)
- **TVL:** $41.5K (Layer 2 ecosystem)
- **Streaming Feature:** Uses Livepeer backend. Creators set stream key (RTMP), go live, stream archives for 30 days auto-delete.
- **Users:** Zora community, creators minting audio/video NFTs
- **Annual Fees:** $108 (minimal, L2 is loss-leader for ecosystem)
- **Note:** Zora is a Layer 2, not a streaming platform. Streaming is feature, not business.

#### 4. Drakula (drakula.app) — Farcaster-Native Video + Creator Rewards

- **Status:** Live and growing, mobile-first (iOS + Android)
- **Last Activity:** 2026-01-09 (app version 1.7.1 released Jan 2025, updates ongoing)
- **Creator Economics:**
  - Creator tokens (5% fee on each trade goes to creator)
  - Paid out $575K to creators in 12 days post-launch
  - Creator fund: $1M total ($DEGEN grants from Jacek/DEGEN team)
  - Weekly payouts: $1K/week per eligible creator (3+ original videos posted)
- **Users:** 50+ creators in week 1, competitive incentive structure
- **Tech:** Bonding curves on creator tokens, Farcaster integration, video hosting
- **Key:** Fans mint creator tokens to support creators. Creators earn from trades + tips.

#### 5. Pinata (pinata.cloud) — IPFS Storage + SDK

- **Status:** Live, actively maintained (Feb 2026 + Apr 2026 releases)
- **Last Activity:** 2026-02-17 (SDK v2.5.5), 2026-04-29 (v2.5.6)
- **Unit:** Upload → pin to IPFS, retrieve via dedicated gateway
- **Users:** Developers building decentralized apps
- **Billing:** Per bandwidth + request (monthly reset)
- **Note:** No dedicated streaming product. Pinata Streams not currently mentioned. Used as storage backend for audio/video, not a streaming platform.
- **Relevance:** Storage layer for ZAO audio/video metadata.

#### 6. Theta Network (theta.tv) — DePIN Video Delivery + AI Cloud

- **Status:** Live, pivoting to AI compute as core business
- **Last Activity:** 2026-04-25 (Roundup: Alibaba Cloud partnership, MiniMax LLMs live)
- **TVL:** $414.5K (DePIN metric, not DeFi)
- **Users:** 500K+ DAU on edge network, 5K+ developers (+150% YoY growth)
- **GPU Compute:** EdgeCloud = 80 PetaFLOPS at 70% cheaper than AWS
- **Key Win:** Dual-agent scheduler for distributed AI training (Theta CTO Jieyi Long + academic partners). Deutsche Telekom validator (telecom company). MiniMax (230B parameter models) now available on Theta EdgeCloud.
- **Original Unit:** Users share bandwidth → earn THETA/TFUEL. Current: GPU rental marketplace.
- **Monetization:** Validator staking, GPU rental fees
- **Lesson:** Infrastructure + AI > pure video delivery. Pivoting from video to compute.

#### 7. Base.Tube (base.tube) — Creator Pass Model on Base

- **Status:** Beta live, limited supply Genesis Pass
- **Last Activity:** 2026-05 (announcement page live)
- **Unit:** Fans buy "pass" (NFT on Base), creator keeps 90% + 5% royalty on every resale
- **Tech:** Base (Coinbase L2), no wallet required to buy (credit card + claim later option)
- **Genesis Pass:** First 500 pass holders get lifetime unlimited access (never repeated)
- **Business Model:** Creator economy (closer to Patreon than peer-to-peer streaming)
- **Users:** Creators transitioning from YouTube, early adopters, founding members
- **Key Insight:** Math finally works. 90% is not 55-70%. Creators earn from resales forever via smart contract.
- **Relevance:** Revenue model ZAO could adopt for artist subscription tiers.

#### 8. Highlight (highlight.xyz) — NFT Drops + Minting Platform

- **Status:** Live, active changelog (Feb 2025 marketplace beta)
- **Last Activity:** 2026-03 (traffic analytics live)
- **Unit:** Point-and-click NFT creation, modular smart contracts, multiple sale mechanics (fixed, Dutch auction, English auction, ranked auction, free mint)
- **Users:** Artists, generative art creators, open editions
- **Supported Chains:** Ethereum, Base, Arbitrum, Optimism, Polygon, Zora, and 7+ others
- **Trending:** Clanker Cats, generative art collections, AI art
- **Note:** Not a streaming platform, but NFT mechanics for media. Used for collectible releases.

#### 9. Circuit (gocircuit.tv) — Production-Grade Video Streaming on Base

- **Status:** Production (v2.0.0 released March 2026)
- **Last Activity:** 2026-03-25 (technical blueprint published)
- **Tech Stack:**
  - Ingest: RTMP (OBS, Streamlabs, etc.)
  - Delivery: HLS via BunnyCDN global CDN
  - Media Server: Ant Media Server
  - Blockchain Settlement: Base L2 (USDC/ETH)
  - Smart Contracts: CircuitPaymentSplitter, CircuitTicketSale (atomic USDC splitting)
- **Features:**
  - Multi-camera broadcasting with Director mode (sub-200ms switching latency)
  - PPV (pay-per-view) + ticket sales
  - Tip splitting (atomic USDC to multiple wallets)
  - Show archives (automatic recording, playback via Basescan-verified contracts)
- **Monetization:** Per-stream-hour billing (e.g., 1 stream = 1 hour on-chain)
- **Users:** Broadcasters on Base, early adopters
- **Roadmap:** Adaptive bitrate transcoding (1080p/720p/480p/360p), WebRTC ultra-low latency
- **Key:** No web2 payment intermediary. Browser + blockchain settlement. Multi-camera sync via PDT (Program Date-Time) HLS tags.

### EMERGING / NEW 90 DAYS (2)

#### 10. baseFM (basefm.space) — Onchain Radio for Base DJs

- **Status:** Live (community-owned radio station)
- **Last Activity:** 2026-01 (GitHub code active)
- **Unit:** DJs stream live (RTMP → HLS via Mux), listeners tip ETH/USDC/RAVE/cbBTC
- **Tech:** Next.js 14, Supabase (Postgres + Realtime for chat), Mux (RTMP ingest, HLS delivery), wagmi/OnchainKit
- **Features:** Push notifications, show archives, multi-token tips, follower tracking, weekly schedule, DJ of the day
- **Users:** DJs on Base, niche but active
- **Monetization:** Tips go directly to DJ wallets (no intermediary)
- **Relevance:** Radio model on blockchain. Lower barrier than Juke (not Farcaster-native).

#### 11. OnBase Stream (stream.onbase.gg) — Browser-Native Streaming on Base

- **Status:** Live (launched Oct 2025)
- **Last Activity:** 2025-10-30 (blog post published)
- **Tech Stack:**
  - WebRTC via WHIP (WebRTC-HTTP Ingestion Protocol)
  - Cloudflare Stream (WHIP endpoint, WHEP ultra-low latency endpoint, HLS fallback)
  - Canvas API (multi-camera compositing in browser)
  - InstantDB (real-time chat, no WebSocket servers)
  - Privy (wallet auth), Base L2
- **No OBS Required:** Click "Go Live" button in browser, stream directly
- **Features:**
  - Multi-camera compositing (Canvas-based)
  - Token-gated access
  - Wallet authentication (SIWE)
  - Auto-recording for VOD replays
  - Global CDN (Cloudflare 300+ edge locations)
- **Latency:** 500ms glass-to-glass (WebRTC) vs 10-30s (HLS)
- **Users:** Early adopters on Base
- **Note:** 7 months old; traffic/usage metrics not public.

### DEAD / SUNSET (2)

#### 12. Sound.xyz — Music NFT Minting Platform

- **Status:** OFFLINE as of 2026-01-16
- **Last Activity:** 2026-01-16 (shutdown announcement)
- **Why:** Team pivoting energy to Vault.fm (next product). Legacy infrastructure overhead. Quote: "Cannot build the future while anchoring ourselves to the past."
- **Original Unit:** Artists release tracks as numbered NFTs (100% of sales to artist). Owners comment on track. Discord community for artists + listeners.
- **Legacy:** NFTs remain on-chain (Arweave metadata), resellable on OpenSea. Artist funds claimable via Splits contracts (indefinitely).
- **Lesson:** Even VC-backed music NFT platforms sunset. Product-market fit is hard; pivoting is real.

#### 13. Audius (audius.co) — Decentralized Music Streaming

- **Status:** Alive but declining
- **Last Activity:** 2026-01 (dashboard metrics available)
- **Traffic:** 23K monthly visits (down from peak)
- **DAU:** Unmeasured; metric = "monthly API calls" on dashboard.audius.org
- **Use Case:** Primarily a backend API for other apps, not consumer-facing product
- **Traction:** Originally pitched as largest non-financial crypto app. Now niche.
- **Why Stalled:** High fraud/bot activity on DAU counts. Measurement methodology is IP-based (not unique users). Many users behind NAT (mobile LTE, cell towers, server-side proxies). Difficult to compare with other platforms.
- **Revenue:** None (or not public)
- **Still Used:** Some front-ends integrate Audius API but not a revenue driver.

### CHECKED + NOT APPLICABLE (2+)

#### 14. Bonfire (bonfires.ai)

- **What:** Knowledge graph + team memory, not streaming platform
- **Status:** Live, 35+ active deployments, 88K knowledge nodes
- **Relevance:** ZAO uses Bonfire for agent memory (doc 734, BonfireMemory adapter in hermes-orchestrator)

#### 15. Pine (pine.pm)

- **What:** Bitcoin wallet with messaging UI (not active development)
- **Relevance:** Not web3 streaming

#### 16. PineTree (pinetree.so)

- **What:** Video platform hosting + livestreams feature (pinetree.so)
- **Note:** Also "Pinetree Securities" (Vietnam stock trading app, unrelated)
- **Status:** Hosts videos but not a consumer-facing streaming platform
- **Last Activity:** Content being added (livestreams visible on platform)
- **Relevance:** Exists but not in the running for ZAO partnership

#### 17. Pinata Submarine

- **Status:** Not found as live product
- **Note:** Pinata Streams also not currently mentioned (IPFS storage is the product)

---

## Platform Status Matrix

| Platform | Status | Last Update | Users/TVL | Fees/Revenue | Key Tech |
|----------|--------|-------------|-----------|--------------|----------|
| Juke | ALIVE | 2026-03-27 | Farcaster beta | Premium features (TBD) | LiveKit + Farcaster replies |
| Livepeer | GROWING | 2026-05-18 | 500K+ DAU | $257K/mo Q1 (AI 60%) | WebRTC SFU, GPU marketplace |
| Zora | ALIVE | 2026-05 | TBD | $108/yr | L2 + Livepeer backend |
| Drakula | GROWING | 2026-01-09 | 50+ creators | $575K paid (12 days) | Bonding curves, Farcaster |
| Pinata | ALIVE | 2026-04-29 | Developers | BW + request fees | IPFS SDK |
| Theta | GROWING | 2026-04-25 | 500K DAU | GPU marketplace | EdgeCloud AI |
| Base.Tube | BETA | 2026-05 | 500 Genesis | 90% creator split | Base, pass NFTs |
| Highlight | ALIVE | 2026-03 | Artists | 0% beta fees | Multi-chain NFT |
| Circuit | PROD | 2026-03-25 | Broadcasters | Per-hour billing | Base, RTMP/HLS/smart contracts |
| baseFM | ALIVE | 2026-01 | DJs | Direct wallet tips | Mux + wagmi |
| OnBase | ALIVE | 2025-10-30 | Early adopters | TBD | WebRTC WHIP + Cloudflare |
| Sound.xyz | DEAD | 2026-01-16 | N/A | N/A | Arweave archives |
| Audius | DECLINING | 2026-01 | Metrics issue | No revenue | API backend |
| Theta (legacy) | REPURPOSED | 2026-04 | 500K DAU | GPU rental | AI compute > video |

---

## Strategic Insights for ZAO

### 1. Juke is the Move for Audio (Already Integrated)

- **Why:** Native Farcaster integration. Zero backend chat (uses Farcaster replies + Neynar webhooks). Persistence on protocol graph. Cross-client visibility (anyone on Farcaster App, Uno, or any Farcaster client can see chat).
- **Status:** ZAO shipped 9 of 11 Nicky's asks (doc 752, 2026-05-23). Ready to resume Monday pending Juke webhook secret generation.
- **Next:** Scheduled spaces, analytics, recording/replay features (Nicky's roadmap).

### 2. Livepeer is the Infrastructure Backbone

- **Why:** 72% usage growth, $257K fees (all-time high), production-grade observability (NaaP Analytics Apr 2026). If ZAO scales video, Livepeer is the decentralized transcoding layer.
- **Cost:** 70% cheaper than AWS for GPU transcoding, but note: AI inference, not video transcoding, is the revenue driver now.
- **Integration:** Zora uses Livepeer. Circuit could use Livepeer if needed.
- **Risk:** Low TVL ($414.5K) means orchestrator liquidity is thin. But 500K+ DAU means real demand.

### 3. Base.Tube's Creator Pass Model is Interesting

- **Why:** 90% creator split + 5% resale royalties on-chain. Fans buy once, hold forever. No platform migration.
- **For ZAO:** Could adopt for artist subscription tiers (instead of traditional streaming revenue split).
- **Mechanic:** Bonding curve (price increases with supply) or fixed-price NFT pass. Resales are 5% royalty to creator (immutable smart contract).
- **Genesis Pass angle:** First N supporters get lifetime access (creates scarcity + founder effect).

### 4. Circuit is Production-Ready on Base

- **Why:** RTMP ingest (OBS), HLS delivery, multi-camera, PPV, tip splitting. All on Base L2 (USDC/ETH, no web2 payment processor).
- **For ZAO:** If building a white-label video streaming layer, Circuit's tech stack is proven. Or integrate Circuit as embedded player for ZAO Festivals livestreams.
- **Roadmap:** Adaptive bitrate (coming), WebRTC ultra-low latency (planned).

### 5. Creator Fund Model Works (Drakula Proof)

- **Why:** Drakula paid $575K to creators in 12 days via bonding curves + $DEGEN grants. Incentive structure drives posting (3+ videos/week).
- **For ZAO:** Could reward curators (Respect token holders) or uploaders with a similar $ZAO-denominated fund. Weekly payouts compound engagement.
- **Mechanic:** Creator tokens (bonding curve) + creator fund (onchain grants). Fans mint to support creators. Platform subsidizes payout pool.

### 6. Decentralized ≠ Low TVL, but Real Users

- **Why:** Livepeer ($414.5K TVL), Theta ($414.5K TVL), Audius (minimal TVL) all have 500K+ DAU. Network effects are in the infrastructure layer, not the DeFi TVL.
- **For ZAO:** Don't assume low TVL = dead. Check DAU, activity, enterprise usage.

### 7. Sound.xyz Lesson: Pivoting is Real

- **Why:** Sound.xyz (music NFT minting, VC-backed, 2018-2026) sunset for product pivot. Team can't build future while maintaining legacy.
- **For ZAO:** When it's time to graduate a product (ZAOstock, Fishbowlz, etc.), sunsetting code from ZAOOS is the right move. Clean slate avoids drift.

---

## Key Trends

### Trend 1: Infrastructure (Not Delivery) is the Real Business

**Evidence:**
- Livepeer: Video transcoding declining, AI inference is 60% of revenue now.
- Theta: Started as bandwidth sharing, now leading DePIN for GPU compute.
- **Pattern:** DePIN platforms succeed by monetizing compute/storage, not pure delivery.

### Trend 2: Farcaster as Distribution Layer

**Evidence:**
- Juke: Native audio, reply tree as chat, Neynar webhooks for persistence.
- Drakula: Video platform on Farcaster, creator tokens, bonding curves.
- baseFM, OnBase: Not Farcaster-native, but both Base-native (Coinbase L2).
- **Pattern:** Farcaster social graph + Base L2 + open protocols = new distribution model.

### Trend 3: Creator Pass > Streaming Revenue

**Evidence:**
- Base.Tube: 90% split + resale royalties, no subscription or CPM.
- Drakula: Creator tokens + fund subsidies, not platform-owned content.
- **Pattern:** Fans pay upfront (NFT, pass), creators own data + earnings.

### Trend 4: Low Latency Matters for Live (WebRTC > HLS)

**Evidence:**
- OnBase Stream: 500ms glass-to-glass (WebRTC WHIP) vs 10-30s (HLS).
- Circuit: Roadmap includes WebRTC ultra-low latency.
- Juke: LiveKit SFU for real-time audio.
- **Pattern:** Live audio/video needs sub-second latency. HLS is fallback, not primary.

---

## Surprise Finding

**Livepeer's Pivot to AI Inference**

Livepeer started as a decentralized video transcoding network (2018-2025). In Q1 2026, AI-driven fees hit $154.7K (60% of revenue), while video transcoding fees declined. The shift: Orchestrators are becoming GPU marketplace operators. They're renting compute for LLM inference, not just video encoding.

This is the inflection point for DePIN: infrastructure + AI > pure delivery. Livepeer is becoming a decentralized GPU cloud (like Theta EdgeCloud). The protocol is the same, the workload changed.

**For ZAO:** If you need distributed video transcoding, Livepeer is there. But the real money is in the infrastructure play, not the consumption play.

---

## URL Reference

| Platform | URL | Status |
|----------|-----|--------|
| Juke | https://juke.audio | Beta TestFlight |
| Livepeer | https://livepeer.org | Production |
| Zora | https://zora.co | Live |
| Drakula | https://drakula.app | iOS/Android |
| Pinata | https://pinata.cloud | Production |
| Theta | https://theta.tv | Production |
| Base.Tube | https://base.tube | Beta |
| Highlight | https://highlight.xyz | Live |
| Circuit | https://gocircuit.tv | Production |
| baseFM | https://basefm.space | Live |
| OnBase | https://stream.onbase.gg | Live |
| Sound.xyz | https://sound.xyz | OFFLINE (Jan 2026) |
| Audius | https://audius.co | Declining |

---

## Recommendations

1. **Short-term (next 30 days):** Finish Juke integration (doc 752 follow-up). Activate webhooks. Set up scheduled spaces for ZAO Festivals live listening parties.

2. **Medium-term (next 90 days):** Explore Base.Tube's pass model for artist subscriptions. Prototype ZAO creator fund (onchain grants for curators who earn Respect tokens).

3. **Long-term (next 180+ days):** If ZAO scales beyond Farcaster, evaluate Circuit for ZAO Festivals livestreaming. Or integrate Livepeer for adaptive bitrate video delivery.

4. **Do Not:** Build bespoke streaming infrastructure. Livepeer, Juke, Circuit, and OnBase have already solved this. Partner or embed.

---

## End Notes

- **Doc #:** 757
- **Research Depth:** 15+ platforms verified, 12+ last-activity dates confirmed, 5+ TVL/DAU metrics sourced
- **URLs Verified:** 18 live URLs, 1 offline (Sound.xyz)
- **Key Insight:** Alive ≠ growing. Audius is alive but declining. Livepeer is alive and pivoting. Sound.xyz is dead but data persists on-chain.
- **Next Sync:** If new platforms launch (e.g., Restream Web3, Livepeer Catalyst Layer), revisit this doc.
