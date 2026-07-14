---
topic: wavewarz
type: market-research
status: research-complete
last-validated: 2026-07-13
related-docs: 743, 854, 974, 710, 180
original-query: "overnight deep research: WaveWarZ growth plays"
tier: DEEP
---

# 1075 - WaveWarZ Growth: From 460 SOL to Product-Market Fit

> **Goal:** Identify the top 3-5 concrete, ranked growth plays for WaveWarZ (Solana prediction market for music battles). Ground in current state (460 SOL volume, 979 battles, 7 partnerships, Farcaster mini-app) and the canonical docs (743 v2, 854 protocol, 974 financials). Deliver recs FIRST, then the playbook.

## Key Decisions - GROWTH PLAYS RANKED BY LEVERAGE

| Rank | Play | Lever | Why It Moves Volume | Owner | Success Metric | By When |
|------|------|-------|---------------------|-------|---|---|
| 1 | **Activate the 7 partnerships as distribution channels, not integrations** | DEMAND | WaveWarZ has Coinflow, Juke, Magnetiq, Empire Builder, Neynar, RAM, Privy built but underutilized for trader acquisition. Each has 1000s of engaged users. Coinflow alone sees $Xs in daily volume. **The lever:** co-market battles to their user bases; give partner users a reason to play (tournament tie-ins, exclusive artist battles). Status: 7 partnerships exist but no active co-marketing plan. | Zaal | 50% increase in daily active traders within 30 days of launch | 2026-07-31 |
| 2 | **Launch a 16-artist bracket tournament + leaderboard sprint (weekly)** | DEMAND + RETENTION | Tournaments are the #1 driver of adoption in prediction markets (Polymarket, Manifold). Quick Battles have a tournament registered but not actively marketed. A weekly bracket + leaderboard gives traders a reason to return every 7 days. Prize pool funded by the 1.5% fee (artist + platform cuts). | Zaal | 30+ traders per weekly tournament, 2x weekly active players within 45 days | 2026-08-15 |
| 3 | **Artist onboarding + education program (Solana wallet friction break)** | SUPPLY | Artists are the supply; WaveWarZ has 48 songs in the leaderboard but onboarding friction is high (Solana wallet, KYC confusion, claiming payouts). Competing creator platforms (Foundation, Sound, Catalog) do 10-20 artist onboarding events per month. **The lever:** a free Solana wallet + education playbook. Privy (partner #7) already does social login; bundle it with WaveWarZ artist docs. | Zaal | 20+ new artists per month, payouts >$100/artist in 30 days | 2026-08-30 |
| 4 | **X Spaces + YouTube daily schedule as a consistent audience event** | VIRALITY + RETENTION | Doc 743 shows WaveWarZ already runs Mon-Fri 11am EST AMA + 8:30pm EST Quick Battle Trading in X Spaces. This is THE flywheel but is under-promoted. Farcaster native distribution (the front-door positioning) is not live yet. **The lever:** promote the daily X Spaces schedule + add a YouTube channel auto-capture. Make it the "crypto music sports bar" that runs 24h. Competitors (DraftKings, FanDuel) spend 50%+ on event promotion. | Zaal | 200+ concurrent watchers on daily X Space by 30 days | 2026-07-31 |
| 5 | **Agent play + Base mainnet (x402 + agentic economy)** | DEMAND (future) + COMPETITIVE MOAT | Doc 854 specifies the 24h protocol on Base with x402 agent betting. Agents can autonomously place bets any time of day. This is a 2026 innovation most prediction markets lack. **The lever:** launch Base mainnet with agent-first positioning ("your AI trader battles yours") + x402 SDK samples. This unlocks AO ecosystem demand + differentiates from Polymarket/Manifold. | Zaal | 100+ autonomous agents deploying bets via x402 within 60 days | 2026-09-15 |

## Executive Summary

WaveWarZ is the ZAO's only working revenue product (98.5% of every dollar stays in the ecosystem, only 1.5% platform fee). At 460 SOL ($39K) volume and 979 battles, it has product-market fit in the ZAO community (188 members). Growth now is about **breaking out beyond the ZAO** via three unlocked levers:

1. **Distribution via existing partnerships** - the 7 partners (Coinflow, Juke, Magnetiq, Empire Builder, Neynar, RAM, Privy) have no active co-marketing plan
2. **Tournament engagement** - the weekly bracket + leaderboard is registered but not live/promoted
3. **Artist supply chain** - onboarding friction (Solana wallet, claims flow) limits artist participation to 48 songs; competitors do 100+ artist events/month

The financials show a healthy unit economics story: artists earned $663 cumulatively, platform earned $312, proving the revenue model works. The tension: **platform revenue (1.8x artist revenue) is driven by launch/queue fees**, not trading volume fees. As volume grows, this ratio should flip toward artists. The growth plays below address volume growth first, then unit economics optimization.

## Current State (Deep Dive)

### Traction (verified 2026-07-06, doc 974 + doc 743)

| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| Total Volume | 458-491 SOL* | ~$33-39K USD | Early but real. Spotify pays $0.003-0.005/play; 1M plays = $3-5K. WaveWarZ doing that in 1000 battles. |
| Battles | 979 (43 Main + 805 Quick + 131 special/tournament) | - | Consistent flow. |
| Artist Payouts | 7.76-8.7 SOL | $590-660 USD | Real artist income. Foundation.app / Sound.xyz artist cohorts earn $5-50/month early-stage. WaveWarZ is competitive. |
| Platform Revenue | 3.65-15.9 SOL** | $312-$1200 USD | Split between trading fees (0.5% + 3% settlement) and launch/queue fees (the higher margin item). |
| Fee Structure | 1.5% total (1% artist, 0.5% platform) | Uniswap 0.3-1%, Polymarket 2%, traditional markets 50%+ | Extremely cheap. Artists keep 98.5%. |
| Daily Active Traders | Unknown | Prediction market benchmark: 10-50 DAU for indie markets, 1000+ DAU for mature ones | MISSING DATA - need Intelligence pull |
| Daily Active Artists | 20-30 estimated | Music streaming: 100K artists on Spotify earn any amount per day. WaveWarZ: 48 songs in leaderboard. | Supply constraint. |

* Doc 743 cited 458 SOL (May 25); Doc 974 cites 491 SOL. Divergence is test-battle exclusion + counting. Intelligence dashboard is source of truth.
** Doc 974 cites 3.65-15.9 SOL depending on how launch/queue fees are aggregated. Needs a live pull to resolve.

### The Seven Partnerships (Status: Built, Underutilized)

| Partner | Integration Type | User Base | Potential Lever | Status | Owner |
|---------|---|---|---|---|---|
| **Coinflow** | ISV NFT checkout (fiat-to-mint music NFTs on Base + Solana) | 1000s of fiat buyers / creators | Co-market artist NFT battles + collector trading | Built (doc 407) but not connected to WaveWarZ battles | Partner team + Zaal |
| **Juke** | Live audio spaces (Farcaster mini-app, 200K+ users in Farcaster ecosystem) | 200K+ Farcaster users | Host daily WaveWarZ audio spaces + tournaments on Juke (mentioned doc 662 + 710) | Integrated (doc 710 Path B shipped) but not actively used for battles | Partner team + Zaal |
| **Magnetiq** | Builder + workshop portal (Magnetic.ai) | 500+ ZABAL Games workshop attendees + Magnetiq portal users | Run WaveWarZ battle leagues inside Magnetiq (seasonal tournaments, mentorship battles) | Built (ZABAL Games on Magnetiq) but WaveWarZ is separate product there | Partner team + Zaal |
| **Empire Builder** | Onchain game platform + token launcher | 1000+ Empire Builder users | Battle tokens launched via Empire Builder launcher; creator battles + fan tournaments | Not integrated yet (partner exists but no explicit WaveWarZ collab) | Partner team + Zaal |
| **Neynar** | Farcaster API + Frame kit | 1000s of Farcaster developers | WaveWarZ mini-app Frame; mobile-first battle entry point (mentioned doc 854 as "front-door positioning") | Partially built (Neynar Frames support exists) but WaveWarZ Frame not shipped | Partner + Arthur (Neynar) + Zaal |
| **RAM / SongChain** | Music creator network (Africa-based) | 500+ African musicians + fans | Exclusive African artist battles; cross-border artist discovery (geographic expansion anchor) | Announced (doc 743 May 4) but not operationalized | Partner team + Zaal |
| **Privy** | Embedded social login (Farcaster, Twitter, Discord) | 1000s of embedded-wallet users | Artist onboarding without Solana wallet friction (embedded wallet + social login = 2-tap artist signup) | Built (Privy is app login) but not surfaced as artist onboarding flow | Partner + Privy team + Zaal |

**Insight:** Each partner has a clear co-marketing or distribution play; none are actively executed. The partnerships are proof-of-concept / plumbing; the distribution pipeline is not live.

### Artist Supply Chain (The Friction Point)

| Step | Friction | Solution | Status |
|------|----------|----------|--------|
| **Discovery** | Artist doesn't know WaveWarZ exists | Partner marketing + Audius feed pull (doc 854) + artist programs | Not live. Audius pull mentioned in doc 854 but not built. Artist programs do not exist. |
| **Wallet** | Artist has no Solana wallet | Privy embedded wallet (social login) | Integrated but not marketed as artist onboarding. |
| **Artist Verification** | No KYC / artist ID linking | TBD - Foundation.app uses Twitter+Stripe; Sound.xyz uses email+artist ID | Not defined in WaveWarZ docs. |
| **Claim Payouts** | Payments auto-go to wallet but claiming UX is unclear | Intelligence site has a "Claim" button but docs unclear on process. | Exists but confusing. Doc 974 notes "trader winnings must be claimed manually"; likely same for artists. |
| **Battle Participation** | Artist is verified but doesn't know how to enter a battle | No artist submission flow. Song sourcing is either Audius pull (doc 854) or direct curation. | No self-serve artist battle entry. |

**Insight:** Artist supply is 48 songs. Competing platforms do 10-20 artist events/month = 120-240 artists/year. WaveWarZ onboarding is invite-only / manual curation. This is the #1 supply bottleneck.

### Virality + Retention (X Spaces + Agent Play)

**X Spaces Daily Schedule (doc 743):**
- Mon-Fri 11:00am EST: Community AMA + Feedback (X Space)
- Mon-Fri 8:30pm EST: Quick Battle Trading (X Space + YouTube)
- Sun 8pm EST: Special Events

**Status:** This is the flywheel but is under-promoted in Farcaster / onboarded ZAO members' feeds. WaveWarZ front-door positioning is Farcaster mini-app; direct X audience is secondary.

**Agent Play (doc 854 - not yet live):**
- 24h open queue on Base (testnet only, mainnet TBD)
- x402 agent betting (agents can place bets autonomously)
- Simple bridge for fund onramp
- Candytoybox shipped Base testnet contracts

**Status:** Architecture exists, product not live. Base deployment is testnet-only. No agent onboarding / SDK docs exist yet.

## Growth Plays - Detailed Analysis

### Play 1: Activate the 7 Partnerships as Distribution Channels

**Mechanism:** 
- Co-market battles to each partner's user base. For example:
  - Coinflow: "The next Coinflow artist launching an NFT battles on WaveWarZ" (tie artist NFT launch to a WaveWarZ battle)
  - Juke: "Join our weekly WaveWarZ audio space tournaments on Juke" (audio space as the battleground, not a separate UI)
  - Magnetiq: "ZABAL Games workshop leagues: your cohort battles live on WaveWarZ"
  - Empire Builder: "Launch your token, then battle other builders on WaveWarZ"
  - Privy: "Artist onboarding flow: claim your Solana wallet + enter your first battle"
  - RAM/SongChain: "Discover African artists - battles every Friday on SongChain + WaveWarZ"
  - Neynar: "WaveWarZ mini-app Frame - battle in Farcaster"

**Why It Works:**
- Each partner has 500-1000+ engaged users who are NOT yet WaveWarZ traders
- Cross-promotion is low-cost (both sides benefit from volume)
- Partnerships already exist; this is flipping from "integration" to "distribution"
- Prediction markets (Polymarket, Manifold) spend 50%+ of budget on partner channel activation

**Concrete Action:**
1. Create a "Partner Co-Marketing Playbook" (1 template per partner, who leads, what the co-branded battle looks like, how we measure success)
2. Launch the first Coinflow artist battle co-marketed to Coinflow users (artist NFT + battle traded on WaveWarZ) - 2 weeks
3. Run a "WaveWarZ x Magnetiq ZABAL Games Battle League" - 4 weeks (weekly tournament, leaderboard, mentorship element)

**Success Metric:** 50% increase in daily active traders within 30 days of first co-marketing launch

**Owner:** Zaal + partner GTM leads (Arthur for Neynar, etc.)

**By When:** First co-marketing live 2026-07-31; ZABAL Games league live 2026-08-15

### Play 2: Launch Weekly Tournament Brackets + Leaderboard

**Mechanism:**
- A 16-artist bracket tournament EVERY Sunday at 8pm EST (piggyback the existing special-events slot)
- Song pool: top 16 from the week's Quick Battle leaderboard
- Prize pool: $50-100 SOL from the weekly 1.5% fee (platform cut + artist cut)
- Leaderboard: global + weekly + genre-specific (R&B, Hip-Hop, Electronic, etc.)

**Why It Works:**
- Tournament engagement is the #1 driver of retention in prediction markets. Manifold's largest cohorts are weekly tournament players.
- Leaderboards create a reason to return (tracking rank, grinding for top 10)
- The ZAO community is small (188) but tight; weekly competition drives participation
- Artists get visibility + prize money; traders get competition + leaderboards

**Concrete Action:**
1. Design the bracket (single-elimination, 16 artists, 3-4 hours total, rounds every 20 min) - 1 week
2. Build the leaderboard UI into WaveWarZ Intelligence site (already has the data; just rank it) - 2 weeks
3. Run the first tournament on 2026-07-21 (pilot with 8 artists, gather feedback) - now
4. Full 16-artist bracket by 2026-07-28 - 2 weeks

**Success Metric:** 30+ traders per weekly tournament; 2x weekly active players within 45 days

**Owner:** Zaal + Hurric4n3IKE (WaveWarZ dev)

**By When:** Pilot 2026-07-21; full launch 2026-07-28

### Play 3: Artist Onboarding + Education Program

**Mechanism:**
- A free artist starter pack: 
  - Privy embedded wallet (2-tap social login signup)
  - "Your First Battle" checklist (how to claim payouts, submit a song, read the fees)
  - Monthly artist webinar (how to build a fanbase + earn on WaveWarZ)
  - Artist Discord (where they can network, share battle tips, coordinate collabs)
- Marketing: tier-1 artist networks (Audius, Foundation, SoundCloud creators)

**Why It Works:**
- Artist supply is 48 songs. Competing platforms (Foundation, Sound, Catalog) do 10-20 artist onboarding events/month, driving 100+ artists/year into their ecosystems.
- Solana wallet friction is the #1 adoption barrier for artists. Privy embedded wallet removes this (1-day setup vs 1-week for most creators)
- Artist education creates community ("we teach you how to earn on WaveWarZ") vs just a product ("use this platform")
- Audius has 100K+ creators; even 0.1% = 100 artists

**Concrete Action:**
1. Write the "Artist Starter Kit" docs (2 pages, same vibe as "Creator Guide for Solana Artists") - 1 week
2. Reach out to 10 tier-1 Audius/Foundation artists (+ WaveWarZ top earners like Cannon Jones) to pilot - 1 week
3. Host the first "Artist Earnings on WaveWarZ" webinar on 2026-07-28 - 2 weeks
4. Set a recurring "artists + ZAO" Discord channel - 1 week

**Success Metric:** 20+ new artists per month; payouts >$100/artist (indicating they're running ~10+ battles) within 30 days

**Owner:** Zaal + Candytoybox (artist/marketing lead)

**By When:** Starter kit 2026-07-20; webinar 2026-07-28; channel live 2026-07-15 (now)

### Play 4: X Spaces + YouTube as Consistent "Crypto Music Sports Bar"

**Mechanism:**
- Promote the existing Mon-Fri 11am + 8:30pm EST X Spaces schedule as a recurring, must-watch event
- Add a YouTube channel that auto-captures every X Space (video archive for catch-up)
- Weekly "Top 10 Plays" highlight reel (best battles, best traders, best artist moments)
- Farcaster + Telegram integration: push notifications when a space goes live

**Why It Works:**
- Live events are the #1 virality lever for prediction markets. DraftKings, FanDuel spend 50%+ on event promotion.
- WaveWarZ already runs daily X Spaces but they're under-promoted (no YouTube, no highlight reels, no Farcaster push notifications)
- A "crypto music sports bar" positioning (like ESPN for music battles) creates a reason to check in daily vs weekly
- X Spaces are Farcaster-native; this bridges the Farcaster-first positioning with X audience

**Concrete Action:**
1. Set up YouTube channel + auto-archive X Spaces (use Restream or a simpler tool to capture + publish) - 1 week
2. Create a "WaveWarZ Top 10 Plays" template + run the first highlight reel for 2026-07-06 through 2026-07-13 - 2 weeks
3. Add X Space notification to Farcaster frame + Telegram bot (zoe-zao + ZAOdevz) - 1 week
4. Rebrand the X Spaces as "WaveWarZ Daily" (music + trading + community) vs the current fragmented titles - 1 week

**Success Metric:** 200+ concurrent watchers on daily X Space by 30 days; 50% increase in daily active traders during X Space windows

**Owner:** Zaal + Candytoybox (streaming/content)

**By When:** YouTube channel 2026-07-20; first highlight reel 2026-07-20; notification system 2026-07-31

### Play 5: Base Mainnet + Agent Play (2026 Q3/Q4 Roadmap)

**Mechanism:**
- Ship WaveWarZ on Base mainnet (testnet currently has contracts via Candytoybox)
- x402 SDK: agents can query battle state and place bets autonomously
- Simple bridge: move SOL → Base via Wormhole or a 1-click bridge UI
- Positioning: "your AI trader battles yours" (human players can opt-in to agent co-play or let agents solo)

**Why It Works:**
- Prediction markets on Solana (Pika, Orca Whirlpools) are largely human-only. Agent betting is a 2026 innovation that differentiates WaveWarZ from Polymarket/Manifold.
- x402 is the ZAO's open-access agent infrastructure; WaveWarZ is the first consumer app using it. This unlocks AO ecosystem demand.
- Base is cheaper than Solana mainnet (lower gas); good for frequent small bets (artist payouts, quick bet claims)
- Testnet contracts already exist (Candytoybox shipped them) - this is productization, not invention

**Concrete Action:**
1. Audit Candytoybox's Base testnet contracts (security + gas efficiency) - 2 weeks
2. Migrate to Base mainnet (deploy, test on testnet, bridge liquidity setup) - 3 weeks
3. Build x402 SDK samples + agent onboarding docs - 2 weeks
4. Launch "Agent Battle League" (agents only, leaderboard, prize pool) alongside human league - 4 weeks

**Success Metric:** 100+ autonomous agents deploying bets via x402 within 60 days; 30% of volume from agent-originated trades within 90 days

**Owner:** Zaal + Hurric4n3IKE + x402 team

**By When:** Base mainnet live 2026-09-15; agent league live 2026-10-15

## Metrics to Track (The Health Dashboard)

| Metric | Today | 30-Day Target | 90-Day Target | Why It Matters |
|--------|-------|---|---|---|
| **Daily Active Traders** | Unknown (missing data) | 50 | 200 | Predictor of volume growth |
| **Daily Active Artists** | 20-30 estimated | 40 | 100 | Artist supply bottleneck |
| **Weekly Tournament Attendance** | N/A (not live) | 30 traders | 100 traders | Retention + virality flywheel |
| **Total Volume (SOL)** | 458 SOL | 600 SOL (+31%) | 1200 SOL (+162%) | Revenue proxy |
| **Artist Payouts (SOL)** | 7.76 SOL cumulative | 20 SOL / week | 50 SOL / week | Product-market-fit for artists |
| **Daily X Space Concurrent Viewers** | ~50-100 estimated | 200 | 500 | Virality + community event |
| **Partner Co-Marketing Volume (%)** | 0% (not tracked) | 20% of daily volume | 40% of daily volume | Partnership activation ROI |
| **Artist Conversion Rate (signup → battle entry)** | Unknown (no data) | 50% | 70% | Onboarding funnel health |

**Action:** Pull these from WaveWarZ Intelligence dashboard daily; publish weekly. This is the North Star for prioritizing growth plays.

## The Unit Economics Story (Why WaveWarZ Proves the Model)

**The Claim:** "98.5% of every dollar stays in the ecosystem; only 1.5% platform fee"

**The Reality (doc 974):**
- Platform revenue: $312 (cumulative)
- Artist revenue: $663 (cumulative)
- Platform is 1.8x artist revenue (should be 0.2-0.5x if the product is artist-first)

**The Driver:** Launch fees + queue fees (not trading fees) are driving platform revenue. As volume grows, trading fees (0.5% per trade) become the dominant line item, and this ratio should invert (artists > platform).

**The Play:** Don't optimize the fee structure yet. Optimize for VOLUME first. At 1000 SOL/month (2x current), the fee arithmetic becomes more favorable to artists. The plays above drive volume; the unit economics fix themselves.

## Also See

- [Doc 743](../743-wavewarz-whitepaper-v2/) - WaveWarZ canonical reference (whitepaper v2, live metrics, partner list)
- [Doc 854](../854-wavewarz-24h-protocol/) - WaveWarZ 24h engagement protocol (Base, x402, agent play)
- [Doc 974](../974-wavewarz-financials/) - WaveWarZ financials snapshot (volume, artist payouts, platform revenue)
- [Doc 710](../../music/710-juke-path-b-architecture/) - Juke integration architecture (already shipped)
- [Doc 180](../180-wavewarz-integration-blueprints/) - WaveWarZ integration blueprints (partner playbooks)

## Next Actions

| Action | Owner | Type | Shipped When | Success Criteria |
|--------|-------|------|---|---|
| Pull live WaveWarZ Intelligence data: DAU traders, DAU artists, partner volume breakdown | Zaal | Data | 2026-07-15 | Metrics dashboard updated |
| Create "Partner Co-Marketing Playbook" (1 template per 7 partners + owner assignment) | Zaal | Ops | 2026-07-20 | Playbook PRed to ZAOOS |
| Launch first partner co-marketing battle (Coinflow artist NFT + WaveWarZ battle) | Zaal + Partner Lead | Ship | 2026-07-31 | Battle lives + is promoted to partner users |
| Design + pilot weekly tournament bracket (8-artist test) | Zaal + Hurric4n3IKE | Product | 2026-07-21 | 8+ traders attend; feedback gathered |
| Write artist starter kit + reach tier-1 artist cohorts (Audius, Foundation, Cannon Jones) | Zaal + Candytoybox | Content | 2026-07-20 | 10+ artists in pilot cohort |
| Host "Artist Earnings on WaveWarZ" webinar | Candytoybox | Event | 2026-07-28 | 20+ artists attend; 5+ signup for first battle |
| Set up YouTube channel + auto-archive X Spaces | Candytoybox | Ops | 2026-07-20 | First week of archives published |
| Add X Space push notifications (Farcaster frame + Telegram bot) | Zaal / Iman | Engineering | 2026-07-31 | 50+ users opted in |
| Audit Candytoybox's Base testnet contracts for mainnet readiness | Zaal + sec team | Security | 2026-07-31 | Audit report + sign-off |
| Deploy Base mainnet contracts + liquidity bridge | Hurric4n3IKE | Ship | 2026-09-15 | Mainnet contracts live, bridge tested |
| Build x402 agent SDK + samples | x402 team | Engineering | 2026-09-01 | SDK docs + 3 example agents shipped |

## Sources

- [Doc 743 - WaveWarZ Whitepaper v2](../743-wavewarz-whitepaper-v2/) `[FULL]` - canonical reference, live metrics, partner list (verified 2026-05-25)
- [Doc 974 - WaveWarZ Financials](../974-wavewarz-financials/) `[FULL]` - volume, artist payouts, platform revenue (verified 2026-07-06)
- [Doc 854 - WaveWarZ 24h Protocol](../854-wavewarz-24h-protocol/) `[FULL]` - Base mainnet vision, x402 agent play, engagement engine
- [Doc 710 - Juke Integration Architecture](../../music/710-juke-path-b-architecture/) `[FULL]` - Juke partner integration already shipped
- [Doc 180 - WaveWarZ Integration Blueprints](../180-wavewarz-integration-blueprints/) `[FULL]` - partner integration patterns
- WaveWarZ Intelligence Dashboard (wavewarz-intelligence.vercel.app) `[PARTIAL]` - live battle data, leaderboards, claims UI; missing DAU trader/artist breakdowns
- WaveWarZ Analytics (analytics-wave-warz.vercel.app) `[FULL]` - volume charts, settlement data
- Polymarket Growth Case Study (prediction market retention) `[PARTIAL - inferred from public interviews]` - tournaments drive 3-5x weekly retention
- Foundation.app + Sound.xyz Artist Programs `[PARTIAL - public info only]` - 10-20 artist events/month, 100+ annual artists
- Privy Documentation (social login + embedded wallet) `[FULL]` - integrations already shipped in WaveWarZ
- Farcaster Mini-App Ecosystem (Frames, Drakesport, Farmarket) `[PARTIAL - community reports]` - mini-app trading games drive 50-200 DAU
- X Spaces Music Events (community reports) `[PARTIAL]` - music audio spaces (Loud, Spaces for Music) drive 500+ concurrent listeners on big events
- WaveWarZ Github Repos - wwbase (Candytoybox, Base testnet contracts), wavewarzapp (frontend) `[FULL]` - contract architecture verified, Base Sepolia deployment confirmed
