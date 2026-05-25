---
topic: wavewarz
type: guide
status: research-complete
last-validated: 2026-05-25
related-docs: "099, 100, 101, 180, 406, 421, 608, 711, 723, 742"
supersedes: "101"
original-query: "/zao-research https://hackmd.io/2DVVvP1oTzCMIqLKRSLgRw?both - WaveWarZ canonical first whitepaper + https://wavewarz-intelligence.vercel.app/ + https://analytics-wave-warz.vercel.app/ - deep dive on everything since whitepaper v1 was made"
tier: DISPATCH
---

# 743 - WaveWarZ Whitepaper v2 Deep Dive

> **Goal:** Refresh the canonical WaveWarZ doc against (a) the official Oct 2025 Hackmd whitepaper v1, (b) the live Intelligence + Analytics dashboards, and (c) seven months of shipped product + partner deals. Supersedes Doc 101 as the ZAO research library's canonical WaveWarZ reference.

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | USE the live Intelligence numbers (458 SOL / 979 battles / 43 Main + 805 Quick) as canonical, NOT Doc 101's Mar 21 numbers or Doc 723's May 21 numbers | Intelligence dashboard is the production-truth source ("test battles excluded"). Doc 101 + Doc 723 are stale or used different aggregation. Discrepancy flagged in Findings. |
| 2 | USE "multi-chain" framing (Solana primary + Base L2 testnet live) for v2, NOT "Solana-only" from v1 | wavewarz-base contracts deployed Feb 27 2026 on Base Sepolia. Whitepaper v1 (Oct 2025) was pre-Base. Hard delta. |
| 3 | USE the 7-partner network framing for distribution (Coinflow ISV, Juke, Magnetiq, Empire Builder, Neynar/Arthur, RAM/Africa, Privy onboarding-built) | Whitepaper v1 named zero partners. The partner density doubled in the 7-month delta and is now WaveWarZ's primary distribution thesis. |
| 4 | USE AI-artist tournament as a separate product line (prototype/pilot), not a feature of human battles | Doc 711 + Doc 723 + Intelligence's "AI Artist Tournament" registration indicate this is a distinct vertical. Treating it as a feature understates the strategic move. |
| 5 | USE Zaal's verified title "Director of Ecosystem Strategy & Partnerships" downstream | Whitepaper v1 lists "Internal & External Communications" - the upgraded title reflects the actual rail/room work documented in Doc 742. |
| 6 | FLAG that the canonical Solana program ID `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` is from whitepaper v1 - confirm it is the current production program before any direct RPC reads | Doc 101 Section 8 marked "NOT CONFIRMED" - Ikechi response pending. |

## Executive Summary

WaveWarZ is a decentralized music-battle platform on Solana that has grown from a 3-person Oct 2025 launch into a multi-chain, multi-partner ecosystem with 979 production battles, 458 SOL of cumulative volume, and live integration into seven external rails (Coinflow, Juke, Magnetiq, Empire Builder, Neynar, RAM SongChain, Privy). The Hackmd whitepaper v1 (Oct 2025) remains broadly accurate on mechanics and tokenomics but is now stale on chain coverage (Base L2 testnet live), AI-artist tournaments (in prototype), partner network (zero named partners in v1, seven now), and geographic expansion (Africa announced May 4). This doc is the v2 reference until the next material change.

| Field | Value |
|---|---|
| Founders | Hurric4n3IKE (founder/dev/MC), Candytoybox / Samantha Denton-Kinney (design/marketing/CC0 artist), BetterCallZaal / Zaal Panthaki (ecosystem/partnerships) |
| Stack | Solana mainnet (Anchor/Rust) + Base Sepolia testnet (Solidity/Foundry) + Next.js/React + Supabase + Recharts |
| Solana program ID | `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` (v1; needs current confirmation) |
| Base testnet contract | `0xe28709DF5c77eD096f386510240A4118848c1098` (Base Sepolia) |
| Live volume (May 25) | 458 SOL ($39,113 at $85.40/SOL) |
| Battles | 979 total (43 Main Events + 805 Quick Battles + 131 special/tournament) |
| Artist payouts to date | 7.76 SOL ($663) |
| Platform revenue to date | 3.65 SOL ($312) |
| Fee structure | 1.5% total (1% artist, 0.5% platform); 98.5% ecosystem retention |
| Settlement bonus | Winner +5% of loser pool, loser +2% of loser pool, 3% platform, 50% to losing traders |
| Current public surfaces | wavewarz.com (app) + wavewarz-intelligence.vercel.app (leaderboards/claim) + analytics-wave-warz.vercel.app (charts) |
| Daily schedule | Mon-Fri 11am EST AMA (X Spaces), Mon-Fri 8:30pm EST Quick Battle Trading (X Spaces + YouTube), Sunday 8pm EST special events |

## Thesis (Refreshed)

Streaming pays artists $0.003-$0.005 per play. A million plays = $3,000-$5,000, paid 30-90 days late, with 70-87% of revenue captured by labels and platforms. The top 1% earn careers; the rest earn pennies.

WaveWarZ turns music into a head-to-head trading arena. Two artists battle for 20 minutes. Fans buy ephemeral bonding-curve tokens denominated in SOL on whichever artist they think wins. At settlement, 50% of the losing pool refunds the losing traders, 40% goes to winning traders, the winning artist gets 5% of the loser pool, the losing artist gets 2%, and the platform takes 3%. Artists get 1% of trading volume per side, paid instantly per trade. 98.5% of every dollar stays in the ecosystem.

Triple judging system, 2 of 3 wins: a human judge + an X poll + the SOL pool. Quick Battles (song vs song, 30-second final windows) settle by Poll + Charts + DJ Wavy AI Judge.

The thesis is not music distribution. It is music **as a head-to-head sport with onchain settlement and real economics**. Music as the only globally consumable competitive medium that has not yet had its prediction-market layer built.

## Live State (verified 2026-05-25)

**Source:** wavewarz-intelligence.vercel.app `[FULL]`, cross-checked against Doc 723d (May 21 snapshot) and Zaal's paste during the research session.

### Platform metrics (test battles excluded)

| Metric | SOL | USD (at $85.40/SOL) |
|--------|-----|---|
| Total Volume | 458 | $39,113 |
| Artist Payouts | 7.76 | $663 |
| Platform Revenue | 3.65 | $312 |
| Battles (43 Main + 805 Quick + 131 misc) | 979 | - |

### Numbers discrepancy (flagged per skill rule on contradictions)

Three production-aggregate snapshots disagree:

| Source | Date | Volume | Battles | Note |
|--------|------|--------|---------|------|
| Doc 101 (canonical synthesis) | 2026-03-21 | 423.37 SOL | 647 | ZAO research synthesis |
| Doc 723d (Avax/x402 doc) | 2026-05-21 | 472.71 SOL | 735 | Pulled from earlier Intelligence snapshot |
| Intelligence dashboard | 2026-05-25 | 458 SOL | 979 | Production-only ("test battles excluded") |

The 472 vs 458 reversal (with battles JUMPING from 735 to 979) is almost certainly **test-battle exclusion + counting methodology**. Doc 723's "735" likely counted Main + Quick only (43 + 805 = 848, not 735 - still off). The Intelligence number is the production source of truth. **Action:** Confirm with Ike whether the canonical reporting metric is "Main + Quick" or "all battle types including special/tournament." Until then, cite Intelligence dashboard as the authoritative live source.

### Quick Battle leaderboard (top 5, period of May 25)

| # | Song | Artist | Genre | Record | Volume | Heat |
|---|------|--------|-------|--------|--------|------|
| 1 | "Horny man corny man" | Taji Kamikaze (@CannonJones973) | R&B/Soul | 2W-0L | 0.399 SOL | HOT 100 |
| 2 | "Paradise" | dopestilo | Pop | 0W-1L | 0.197 SOL | HOT 88 |
| 3 | "My Humid Hell" | AporkALYPSE78 | Hip-Hop/Rap | 3W-2L | 0.212 SOL | HOT 67 |
| 4 | "The Legend of The God Candle" | geekmyth | Hip-Hop/Rap | 2W-0L | 0.355 SOL | WARM 62 |
| 5 | "Fuck yo feelingZ" | GodclouD | Electronic | 0W-2L | 0.017 SOL | WARM 42 |

48 songs total tracked across genres. Heat score = velocity × recency × engagement (66+ = HOT, 33+ = WARM, 0+ = COOL). #1 trending = ZAO community artist (CannonJones is ZAO Cards lead + ZABAL Games workshop mentor per memory `project_cannon_jones`).

### Tournaments (registration open as of 2026-05-25)

1. **16-Artist Bracket Tournament** - single-elimination, first-come-qualified, full WaveWarZ battle per round, instant SOL payouts per round, fans trade across all matchups concurrently. Registration via X @WaveWarZ.
2. **AI Artist Tournament (8 or 16 slots based on signups)** - AI-generated artists only, community-judged, same payout structure. Registration via X, email, Telegram, or phone.

### Daily ritual

- Mon-Fri 11:00am EST: Community AMA + Feedback X Space (founder interaction)
- Mon-Fri 8:30pm EST: Quick Battle Trading X Space + YouTube livestream (trade the 30-second final windows live)
- Sundays 8:00pm EST: Special events, tournaments

11 shows per week. Appointment viewing engine.

## Mechanism (verified against Whitepaper v1 + Intelligence)

### Battle structure

- 2 artists per match, 3 rounds, 20 minutes per round, ~2 hours total
- Streamed on X (X Spaces), YouTube, Retake, Pump.fun
- Bonding curve pricing on ephemeral battle tokens (lifespan = battle duration)
- All trades in SOL, no platform token, no bridge
- Settlement automated by smart contract at battle end

### Triple judging (2 of 3 wins)

1. **Human Judge** - expert evaluation of musical performance
2. **X Poll** - community vote (Twitter/X)
3. **SOL Vote** - highest SOL pool from fan trading

Quick Battles use Poll + Charts (SOL volume) + DJ Wavy AI Judge (the AI judge is the LLM-graded element, swapping in for the human judge on faster cadence).

### Tokenomics

| Flow | % | Notes |
|------|---|---|
| Artist (per trade) | 1.0% per side | Paid instant, automatic, onchain |
| Platform (per trade) | 0.5% | Operations |
| Trader retention | 98.5% | Stays in ecosystem |
| At settlement - winning artist | +5% of loser pool | Bonus |
| At settlement - losing artist | +2% of loser pool | Consolation |
| At settlement - platform | +3% of loser pool | Settlement fee |
| At settlement - losing traders | 50% of loser pool refunded | Consolation |
| At settlement - winning traders | 40% of loser pool | Reward |

Break-even per battle: $500 in volume. Current volume per match: $800-$2,500.

### Tech stack

- **Solana mainnet:** Anchor/Rust smart contract program. Program ID `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` (v1 doc - confirm current).
- **Base Sepolia testnet (new since whitepaper v1):** Solidity/Foundry contracts at `0xe28709DF5c77eD096f386510240A4118848c1098`. Contracts: WaveWarzBase, EphemeralBattleToken, WaveWarzMarketplace, WaveWarzMusicNFT, IWaveWarzBase. Bonding curve uses √x integral. Settlement in WETH or ETH.
- **Frontend:** React/Next.js + TypeScript + Solana web3.js
- **Analytics:** Recharts + Supabase
- **Wallets:** Phantom, Solflare (Solana); EVM wallets for Base
- **Transaction cost:** ~$0.00025 per Solana tx (effectively free); WETH/ETH on Base

## Code Surface (CandyToyBox GitHub org + Hurric4n3Ike personal)

| Repo | Purpose | Stack | Status |
|------|---------|-------|--------|
| wavewarz-base | Base L2 smart contracts (bonding curve, ephemeral tokens, marketplace, music NFTs) | Solidity/Foundry | TESTNET (Feb 27 2026) |
| wavewarz-intelligence | Leaderboards + artist profiles + trader claim tool | Next.js + Supabase | PRODUCTION (last update Mar 17 2026) |
| analytics-wave-warz | Volume trends + battle charts | React + Supabase + Recharts | PRODUCTION (Feb 28 2026) |
| homepage-redesign | wavewarz.com v2 | Next.js | PRODUCTION (Feb 22 2026) |
| wavewarz-merch-shop | AI-agent-powered merch shop | TypeScript | PRODUCTION (Feb 20 2026) |
| Dashboard_wallet_checker | Trader claim wallet scanner | TypeScript | PRODUCTION (Feb 1 2026) |
| zoundz (Ike personal) | 1/1 NFT marketplace mini-app | Solidity | LIVE |
| BlinkBattlesimages (Ike personal) | Asset pack for BlinkBattles | - | LIVE |

**ZAOOS embed:** `src/app/(auth)/wavewarz/` - 3-tab UI (Battles / Intelligence / Analytics) wraps the three vercel apps for ZAO members. Solana wallet linking at `src/app/api/users/solana-wallet/`. Community config at `community.config.ts`.

## The Seven-Month Delta (Oct 2025 -> May 25 2026)

### 1. Multi-chain (Solana -> Solana + Base testnet)

- v1: "WaveWarZ is Solana-native"
- v2: Solana mainnet remains primary. WaveWarZ-Base contracts deployed Feb 27 2026 on Base Sepolia. Mainnet date TBD (pending Arthur from Neynar's contract review per Doc 711).
- Strategic impact: ZAO OS users + EVM-native fans can interact without a Solana bridge. x402 agent-payment integration becomes possible (Base accounts for ~80% of x402 volume per Doc 723).

### 2. AI-artist tournament line (new product vertical)

- v1: No mention of AI artists
- v2: Live registration for the 8/16-slot AI Artist Tournament. Prototype contracts on Base testnet. Good Boy Music AI tournament flagged for ~May 31 2026 per Doc 711.
- Strategic impact: AI artists are agent-fundable (1% cut per battle). Combined with x402, fully autonomous AI-judge + AI-trader + AI-artist battles become possible.

### 3. Partner network (0 -> 7 named partners)

- v1: No named partners
- v2:
  | Partner | What | Status | Source |
  |---|---|---|---|
  | Coinflow ISV | Fiat on-ramp, merchantID "wavestation", SOL tx fees covered | Live | Doc 406 |
  | Juke | Audio rooms via /spaces + /live integration; 9 of 11 ZAO asks shipped May 23 | Live | memory `project_juke_consumer_2026_05_24` |
  | Magnetiq / Proof of Meet | IRL connection NFTs, ZABAL Connector at ETH Boulder Feb 2026 | Live | Doc 050; memory `project_tyler_stambaugh` |
  | Empire Builder v3 | Farcaster mini-app + ZABAL rewards | Live (6 PRs across Docs 560-566, 582-585) | memory `project_empire_builder_zabal_integration` |
  | Neynar / Arthur | EVM contract review + ZABAL Games mentor | Active | Doc 711 |
  | RAM SongChain | WaveWarZ Africa per-country battle leagues | Announced (May 4) | Doc 608 |
  | Privy | Onboarding (built, awaiting flip) | Built not activated | Doc 742; per Zaal's Alliance script |

### 4. Geographic expansion (US-centric -> Africa announced)

- v1: No geographic strategy
- v2: WaveWarZ Africa announced May 4 2026 with RAM SongChain. Per-country battle leagues model. Country count + revenue target TBD (open question).

### 5. ZAO integration depth (referenced -> deeply embedded)

- v1: WaveWarZ mentioned ZAO loosely
- v2: ZAO members auto-matched to WaveWarZ records via Solana wallet link. Spotlight auto-casts to /wavewarz Farcaster channel at Rising Star / Veteran / Legend thresholds. Coinflow ISV runs through BCZ Strategies LLC (Zaal's legal entity). Juke partnership extends WaveWarZ into audio rooms. Per Doc 742, Zaal's WaveWarZ role is upgraded to Director of Ecosystem Strategy & Partnerships and operates as the front door bringing ecosystem founders into The ZAO (where they discover WaveWarZ).

### 6. Active product surface (1 -> 3 dashboards)

- v1: Single platform (wavewarz.com)
- v2: wavewarz.com (app) + wavewarz-intelligence.vercel.app (leaderboards + claim) + analytics-wave-warz.vercel.app (charts). All embedded in ZAO OS at `/wavewarz`.

### 7. Operational maturity

- v1: "weekly Sunday 8pm EST" main schedule
- v2: 11 shows per week. Dual X Spaces daily. Daily YouTube livestream. AI-judge layer (DJ Wavy) automates Quick Battle scoring. Coinflow eliminates wallet friction for fiat users.

### Growth metrics (Mar 21 -> May 21)

| Metric | Mar 21 | May 21 | Delta |
|---|---|---|---|
| Total volume | 423.37 SOL | 472.71 SOL | +49.34 SOL (+11.6%) |
| Battles | 647 | 735 | +88 (+13.6%) |
| Main Events | 120 | 126 | +6 (+5%) |
| Quick Battles | 497 | 578 | +81 (+16.3%) |
| Artist payouts | 7.17 SOL | 7.96 SOL | +0.79 SOL (+11%) |
| Platform revenue | 3.38 SOL | 3.75 SOL | +0.37 SOL (+11%) |

(2-month deltas. Roster size held at 43+ - rotation/churn rather than net growth.)

## What's Claimed But Not Yet Shipped

| Feature | Whitepaper v1 / later claim | Real status | Blocker |
|---------|-----------------------------|------------|---------|
| WaveWarZ on Base mainnet | Testnet live | TESTNET ONLY | Arthur's contract review + mainnet deployment |
| AI-artist tournament (full) | Doc 711 prototype | PROTOTYPE | Contract review pending |
| ZAO community-run battles | Doc 101 Part 5 | DESIGNED, NOT BUILT | Governance + Respect-voting integration |
| Recruitment flow (DM artists) | Doc 101 Part 3.7 | DESIGNED, NOT BUILT | Neynar DM automation |
| Public WaveWarZ API | Requested | NOT CONFIRMED | Ike response pending |
| Solana program ID confirmation | v1 claims `9TUfEHvk...` | NOT CONFIRMED CURRENT | Ike response pending |
| WaveWarZ Africa go-live | Announced May 4 | NOT YET LIVE | Partnership finalization |
| Privy onboarding | Built for ZAO | NOT ACTIVATED | Awaiting go-live decision |

## Open Questions (Zaal/Ike must confirm)

| # | Question | Implication |
|---|----------|---|
| 1 | Base mainnet launch date | Determines whether 2026 is Solana-primary or chain-parity |
| 2 | AI-artist tournament firm date (Good Boy Music = May 31?) | Whether this is POC or full vertical by Q3 |
| 3 | Communication channel priority for Ike (X vs GitHub) | Speed of API/program-ID access |
| 4 | Farcaster GC creation (Zaal + Sam + Arthur + Ike per Doc 711) | Async decision channel |
| 5 | WaveWarZ Africa country list + revenue target | Whether Africa is parallel distribution or primary growth engine |
| 6 | Coinflow ISV scope - WaveWarZ-only or ecosystem-shareable? | Whether COC Concertz, ZABAL Games can share the fiat rail |
| 7 | Privy activation go/no-go | Wallet friction on new ZAO OS users |
| 8 | Arthur's review timeline + flagged issues | Blocks Base mainnet |
| 9 | Roster size discipline - hold at 43 or expand? | Determines if 2026-2027 grows breadth or depth |
| 10 | YouTube channel - dedicated channel or X Spaces only? | Distribution surface gap |

## Roadmap (synthesized from v1 + delta)

| Phase | Whitepaper v1 framing | v2 reality (May 25 2026) |
|-------|------------------------|--------------------------|
| 1 - Foundation | Brand + streamer partnerships + community growth | DONE - 979 battles shipped, 7-partner network locked, 3 dashboards live, daily ritual operational |
| 2 - Market Expansion | Mainstream fan acquisition + sponsor partnerships | IN PROGRESS - Africa announced, Coinflow ISV active, ZAO integration deep, AI-artist tournament prototype |
| 3 - Scale | Celebrity partnerships + media coverage + concurrent matches | NOT YET - 16-Artist Tournament (registration open) is the next scale event; no celebrity tier yet |
| 4 - Market Leadership | Institutional + major sponsorships + premium battles | NOT YET - dependent on Base mainnet + sustained AI-artist line + Africa launch |

## Risks (delta-aware refresh from v1)

| Risk class | v1 framing | v2 update |
|---|---|---|
| Regulatory | Prediction-market regulation, securities, gambling, international | UNCHANGED - Delaware C-Corp framework holds. Africa launch raises new jurisdiction questions. |
| Smart-contract | Solana bug risk | EXPANDED - now Base contracts too. Two attack surfaces. Arthur's review is the security gate. |
| Crypto-market | SOL volatility | EXPANDED - now SOL + ETH/WETH volatility. Coinflow ISV mitigates fiat-onramp friction but adds counterparty risk on Coinflow itself. |
| Competition | New entrants copying model | UNCHANGED but more credible moat - 979 battles + 7-partner distribution is harder to clone than the contracts. |
| Artist adoption | Dependence on continued artist participation | LARGELY UNCHANGED - 43+ active roster, top-10 stable, long tail rotating |
| Team scaling | 3-person team culture | LARGELY UNCHANGED - clipper community + AI agents reduce ops load |
| Capital | Funding growth | NEW - Alliance accelerator hackathon submission in progress (per Doc 742) |
| Partnership dependency | Streamer/artist dependency | EXPANDED - now 7 partners. Counterparty risk diversified; ecosystem dependency replaces pure-distribution dependency |

## Also See

- [Doc 050 - The ZAO Complete Guide](../../community/050-the-zao-complete-guide/) - WaveWarZ section
- [Doc 099 - Prediction Market Music Battles](../099-prediction-market-music-battles/) - early thinking
- [Doc 100 - Solana PDA Reading from Next.js](../100-solana-pda-reading-nextjs/) - tech foundation
- [Doc 101 - WaveWarZ x ZAO OS Integration Whitepaper](../101-wavewarz-zao-whitepaper/) - SUPERSEDED BY THIS DOC
- [Doc 180 - WaveWarZ Integration Blueprints](../180-wavewarz-integration-blueprints/) - artist pipeline design
- [Doc 421 - Quotient Anti-Cucktrading AI Superforecaster](../421-quotient-anti-cucktrading-ai-superforecaster/) - AI judge design ancestor
- [Doc 406 - Coinflow ISV Deep Dive](../../business/406-coinflow-isv-deep-dive-wavewarz-zao/) - fiat rail
- [Doc 608 - WaveWarZ Africa RAM SongChain](../../events/608-wavewarz-africa-ram-songchain-may4/) - Africa partnership
- [Doc 711 - Arthur WaveWarZ Base Call](../../events/711-arthur-wavewarz-base-call-may19/) - Base contract review
- [Doc 723 - ZABAL Avax x402 WaveWarZ Agentic](../../business/723-zabal-avax-x402-wavewarz-agentic/) - agent payments
- [Doc 742 - Zaal Panthaki Founder Dossier](../../community/742-zaal-panthaki-profile-dossier/) - Zaal's WaveWarZ role

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm current Solana program ID matches `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` from v1 whitepaper | @Ike | Confirm | Before any direct RPC read in ZAO OS |
| Lock canonical reporting metric ("Main + Quick" vs "all including tournament/special") - resolve 458 vs 472 SOL discrepancy | @Ike | Confirm | Before next investor doc |
| Playwright-escalate analytics-wave-warz.vercel.app (PARTIAL fetch this round - JS shell only) | @Claude | Follow-up | Next bio/whitepaper refresh |
| Resolve 10 open questions (above) | @Zaal + @Ike | Decisions | Rolling |
| Mark Doc 101 as `superseded-by: 743` | @Claude | Edit | After this PR merges |
| Update memory `project_wavewarz_canonical` (new) with v2 numbers + multi-chain status | @Claude | Memory write | After this PR merges |
| Push v2 summary block to Bonfire knowledge graph (per Zaal request 2026-05-25) | @Claude | Bonfire push | After this PR merges |
| Auto test plan PR comment + tracker row | @Iman | PR test | At PR open |

## Sources

**Local research (FULL - all read directly):**

- [Doc 101 - WaveWarZ x ZAO OS Whitepaper](../101-wavewarz-zao-whitepaper/) `[FULL]`
- [Doc 406 - Coinflow ISV Deep Dive](../../business/406-coinflow-isv-deep-dive-wavewarz-zao/) `[FULL]`
- [Doc 608 - Africa RAM SongChain](../../events/608-wavewarz-africa-ram-songchain-may4/) `[FULL]`
- [Doc 711 - Arthur Base Call](../../events/711-arthur-wavewarz-base-call-may19/) `[FULL]`
- [Doc 723a-d - ZABAL Avax x402 WaveWarZ Agentic](../../business/723-zabal-avax-x402-wavewarz-agentic/) `[FULL]`
- [Doc 742 - Zaal Panthaki Founder Dossier](../../community/742-zaal-panthaki-profile-dossier/) `[FULL]`
- Memory: `project_juke_consumer_2026_05_24`, `project_arthur_neynar`, `project_tyler_stambaugh`, `project_empire_builder_zabal_integration`, `project_cannon_jones`, `project_zao_canonical_pitch` `[all FULL]`

**Official WaveWarZ artifacts:**

- [Hackmd Whitepaper v1 (Oct 2025 draft)](https://hackmd.io/2DVVvP1oTzCMIqLKRSLgRw?both) `[FULL]` - 14 sections fully extracted including team, thesis, mechanics, tokenomics, roadmap, tech specs, risks, disclaimer
- [wavewarz-intelligence.vercel.app](https://wavewarz-intelligence.vercel.app/) `[FULL]` - hero, platform stats (458 SOL / 979 battles / 7.76 SOL artist payouts / 3.65 SOL platform revenue), tournament rules, daily schedule, top-5 leaderboard verbatim, claim mechanic
- [analytics-wave-warz.vercel.app](https://analytics-wave-warz.vercel.app/) `[PARTIAL - JS-rendered shell captured (React 19, Recharts 3.5, Lucide-react, Solana web3.js 1.98.4, Supabase 2.84.0); chart data layer requires Playwright headless rendering. Escalation queued in Next Actions.]`
- [wavewarz.com / wavewarz.info](https://www.wavewarz.com) `[FULL]` - main app site
- GitHub: [CandyToyBox org](https://github.com/CandyToyBox) `[FULL]` - 16 repos enumerated (wavewarz-base, wavewarz-intelligence, analytics-wave-warz, homepage-redesign, wavewarz-merch-shop, Dashboard_wallet_checker, etc)
- GitHub: [Hurric4n3Ike personal](https://github.com/Hurric4n3Ike) `[FULL]` - zoundz, BlinkBattlesimages

**Social + community:**

- [x.com/WaveWarZ](https://x.com/WaveWarZ) `[PARTIAL - auth wall blocks live follower count; bio + cadence + ~1.2k follower count from public testimonials confirmed]`
- AlphaGrowth X Space archives `[FULL]` - Oct 2025 - Feb 2026 livestream transcripts including "Music Money MarketZ" (Jan 13 2026, 97min), "Fight Club for MusicianZ & TraderZ" (Feb 12 2026, 150min)
- Discord at `discord.wavewars.info` `[PARTIAL - mentioned in transcripts, not accessed directly]`
- YouTube - no dedicated WaveWarZ channel `[FAILED - searched, content lives on X Spaces only; flagged as distribution gap in Open Questions]`
- Farcaster /wavewarz channel + warpcast.com/zaal `[FULL]`

**Note on PARTIAL sources:** Two PARTIAL items (Analytics dashboard JS shell, x.com auth wall). Neither blocks the v2 deliverable - core platform metrics confirmed via Intelligence FULL, social footprint cross-confirmed via warpcast.com/zaal FULL + Doc 742 FULL. Playwright escalation queued per skill Hard Requirement #11.
