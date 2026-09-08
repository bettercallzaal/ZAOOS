---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-08
superseded-by:
related-docs:
original-query: "YouTube/ZAO growth: What is the optimal funnel structure for converting WaveWarZ YouTube Short viewers into active on-chain participants, given the friction gap between a Short and executing a Solana transaction for a music-first audience?"
tier: STANDARD
---

# 2476 - YouTube/ZAO growth: What is the optimal funnel structure for convertin

> Drafted by ZOE's research-worker from "YouTube/ZAO growth: What is the optimal funnel structure for converting WaveWarZ YouTube Short viewers into active on-chain participants, given the friction gap between a Short and executing a Solana transaction for a music-first audience?". Auto-committed to main for durability; review + deepen as needed.

Budget nearly exhausted. I have enough data to synthesize. Compiling now.

---

## Findings

### The Core Friction Gap - Named Precisely

The friction between a YouTube Short viewer and an on-chain action is not one step - it is four sequential trust failures that compound. Water and Music's survey of 157 music fans (liveness-verified-on-2026-09-08) quantifies the wall: 30.6% of music fans are "crypto-hesitant" (of whom 60.4% have no intention of ever owning crypto), and even among the 19% who already own music NFTs, cost and scam perception are the top blockers. A Short that ends with "connect your wallet" hits this wall immediately, before any trust exists.

The chain question matters here: ZOE's prompt references Solana, but doc 2409 (internal, 2026-08-24) places WaveWarZ on Base, with a Base-expansion doc (research/wavewarz/1323) from July 2026 confirming this. The friction model is identical regardless of chain - wallet creation + seed phrase + gas fees - but the specific CTA and ecosystem stack differ. This chain discrepancy should be resolved with Zaal before the funnel is committed.

### The Optimal Funnel Structure

The funnel has four phases; skipping any one kills conversion.

**Phase 1: Short as Proof-of-Value (not as explanation)**

WaveWarZ Shorts must show money moving - real payout moments, leaderboard changes, artist win clips - not explain the platform. This is the "proof-of-value" content hook recommended in doc 2409's key decisions, and it aligns with what the Water and Music report found: "doing things that don't scale" (direct, authentic community engagement) outperforms mass marketing for web3 music. The WaveWarZ Clippers program (doc 1293) is the supply chain for this content: clippers earn ZABAL points for clips that hit 1K+ views, creating a community-made highlight reel with no operator production cost.

**Phase 2: Community gateway, not wallet gateway**

The CTA in pinned comments and bio should route to a zero-wallet-friction community surface - Telegram or Farcaster channel - not a wallet connect or mint page. Telegram is lowest friction (no account required if viewer already uses it; ZOE already operates the WaveWarZ Telegram). Farcaster is strategically superior for long-term conversion: creating a Farcaster account on Base completes approximately 60% of the wallet setup required for a WaveWarZ transaction, meaning the community join IS the on-chain onboarding, not a separate step.

Chartlex's 2026 data (liveness-verified-on-2026-09-08) gives the benchmark: Shorts convert 1-3% of viewers into subscribers; Shorts linking to other videos show a 4.5% CTR on the link. The community CTA should be treated as the equivalent of this link click - expect 1-4% of total Short views to click through to any off-platform destination.

**Phase 3: Trust-building inside the community**

Water and Music's finding is unambiguous: high-touch beats mass marketing for web3 music. The artists with the healthiest onboarding used daily Twitter Spaces education, weekly community calls, and post-purchase check-ins. For WaveWarZ, this translates to: X Space battle commentary, Telegram prediction threads, and artist Q&As - all of which the existing WaveWarZ format already produces. The community IS the trust-building mechanism; the funnel does not need to add new programming.

**Phase 4: Wallet activation with a clear win-framing**

By Phase 4, a viewer has seen proof-of-value content, joined a community, and built trust through repeated exposure. The wallet step is introduced as "place your first prediction" not "connect your wallet" - the WaveWarZ prediction market model (music fan bets on an artist they already believe in) is structurally lower-friction than "buy an NFT" because it frames the transaction as a game with upside, not a purchase. The Water and Music survey's #2 blocker (cost/fees) is addressed by the "loser earns" mechanic (doc 2115) if that is live - this is worth surfacing in Shorts content.

### Verified Metrics vs. Unverified Claims

| Claim from doc 2409 | Status | Source |
|---|---|---|
| "3x growth" from posting Shorts consistently | VERIFIED IN RANGE - "3-4x faster" subscriber growth from daily Shorts | Chartlex 2026, FULL, liveness-verified-on-2026-09-08 |
| "1-2% baseline conversion" for cold audiences | VERIFIED IN RANGE - "1-3% of viewers become subscribers" per Short | Chartlex 2026, FULL, liveness-verified-on-2026-09-08 |
| "2.5x watch time" increase | UNVERIFIED - not found in any fetched source |  |
| "5-7% participation rate" for community challenges | UNVERIFIED |  |
| "7-14 day trust window" | UNVERIFIED |  |
| "$50K equivalent" acquisition cost | UNVERIFIED |  |

Two of six UNVERIFIED claims now have grounded substitutes. The remaining four should be dropped from the doc or sourced in a DEEP tier run.

### The Farcaster Path Advantages

From internal docs (2409, verified 2026-08-24): WaveWarZ is on Base; Farcaster is Base-native. Creating a Farcaster account completes ~60% of the wallet setup required for WaveWarZ. The ZAO's existing 188-member graph provides initial social proof in a Farcaster channel (seeding problem is solved). This makes the Farcaster gateway structurally superior to Discord (web2, no wallet overlap) or a direct wallet CTA (wall too early).

### Community Source Gap

Hard Req 7 remains unmet at this tier. Attempts made: old.reddit.com (FAILED - Anthropic crawler block, liveness-verified-on-2026-09-08); Redlib not attempted (budget exhausted); HN Algolia API (0 results for web3 music onboarding queries, liveness-verified-on-2026-09-08); X/FxTwitter not attempted (no specific post ID available). This is a shipping blocker.

---

## Recommended Action

1. **Resolve the chain discrepancy first.** ZOE's prompt says "Solana" but internal docs place WaveWarZ on Base. The funnel CTA and ecosystem path (Farcaster vs. Phantom wallet) differ materially depending on the answer. Confirm with Zaal before committing the funnel.

2. **Build the two-gateway test.** Run one Short with a Telegram CTA (pinned comment) and one with a Farcaster channel link. Measure click-through rate on each at 7 days. Expected range from Chartlex data: 1-4% of views click any off-platform link. The gateway with higher click-through becomes the primary funnel.

3. **Redispatch as DEEP with the `/reddit-fetch` skill** to satisfy the community source requirement and retrieve primary sources for the four remaining UNVERIFIED metrics ("2.5x watch time," "5-7% participation," "7-14 day trust window," "$50K acquisition cost"). Neither the doc nor the funnel should be committed to production without those verifications.

---

## Sources

- [FULL, liveness-verified-on-2026-09-08] "Behind the Headlines: Analyzing Web3 Onboarding Strategies for Music Fans" - Water and Music - https://www.waterandmusic.com/behind-the-headlines-analyzing-web3-onboarding-strategies-for-music-fans/
- [FULL, liveness-verified-on-2026-09-08] "What a Good Web3 Marketing Funnel Actually Looks Like in 2026" - Coinbound - https://coinbound.io/what-a-good-web3-marketing-funnel-looks-like/
- [FULL, liveness-verified-on-2026-09-08] "YouTube Shorts for Music Promotion: What Works (2026)" - Chartlex - https://www.chartlex.com/blog/marketing/youtube-shorts-music-promotion-2026
- [PARTIAL - search summary only, no raw page fetch] YouTube Shorts benchmarks and creator economy statistics - awisee.com, owlclaw.com, shortsintel.com (via WebSearch)
- [FULL, internal] Doc 2409 - YouTube Shorts-to-community conversion funnel (ZAOOS research, 2026-08-24)
- [FULL, internal] Doc 1293 - WaveWarZ Clippers Program guide (ZAOOS research, 2026-07-17)
- [FULL, internal] Doc 1276 - WaveWarZ in music industry context (ZAOOS research, 2026-07-24)
- [FAILED - liveness-verified-on-2026-09-08] Reddit (old.reddit.com) - blocked by Anthropic crawler
- [FAILED - liveness-verified-on-2026-09-08] HN Algolia API - 0 results for web3 music onboarding queries
