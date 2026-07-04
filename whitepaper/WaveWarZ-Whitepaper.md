# WaveWarZ

**The front door: live-traded music battles where artists win instantly and fans capture the prediction upside.**

> Version 0.1 draft - 2026-07-03. The thesis and mechanics are stable. Details evolve by community and partnership feedback.

**Tagline:** Back Music, Not Memes.

---

## 1. What WaveWarZ Is

WaveWarZ is a music prediction market on Solana mainnet and Base testnet where artists battle head-to-head and fans trade on the outcome.

Two artists perform live. Three judges score: a human expert, an X poll, and the SOL traded on each side. At settlement, the audience is split into winners and losers. Winners keep their principal and earn a share of the loser pool. Losers get 50% of their stake back. The winning artist earns 5% of the loser pool. The losing artist gets 2%. The platform keeps 3%. And every single trade flows 1% to each artist, paid instantly, automatically, and on-chain.

The result: roughly 98.5% of every dollar traded stays in the ecosystem. Artists are paid by the minute. Fans who predicted right capture the prediction upside. The person who takes the other side of your trade is another fan, not a platform. The whole thing settles in code, on a blockchain, with no middleman between the prediction and the payout.

979 battles have shipped. 458 SOL of cumulative volume. Seven partners embedded. Growing faster than the team can handle. This is not a whitepaper describing what could be built. This is what is live today.

---

## 2. Why Music Needs This

Music streaming pays artists $0.003 to $0.005 per play. A million plays is $3,000 to $5,000, paid 30 to 90 days late, with 70 to 87% of revenue captured by labels and platforms. The top 1% of artists earn careers from this. The rest earn pennies for work they own nothing of.

There is a deeper problem underneath the payment. Streaming is a passive medium. You make the song, the platform decides if the algorithm promotes it, and you have no control over who hears it or what happens next. The artist is at the end of a supply chain they did not build.

WaveWarZ inverts the supply chain. The artist is at the center. Fans compete on whether the artist will win. That competition creates liquidity. That liquidity creates price discovery. That price discovery is the artist's leverage - the market is constantly voting on their talent in real time, and they cash out of that vote instantly.

The mechanism solves three problems at once.

First, it monetizes attention in a way music has never done before. A one-million-play spotify release pays $3K to $5K, 60-90 days late. A 30-minute WaveWarZ battle with the same audience can generate $500 to $2,500 in volume in a single session, paid minute by minute. The artist is paid for captivating the audience right now, not for being heard at some point in the future.

Second, it turns the artist into a brand with real leverage. Fans are invested - literally - in the artist winning. The artist builds an audience that has something at stake in their success. Every previous model of music builds a passive following. WaveWarZ builds a traded following. A fan who trades on you five times is not a listener. They are a believer.

Third, it puts the artist first in the revenue chain for the first time. The streaming industry design says: distribute broadly, let the platforms keep most of it, pay the artist what is left. WaveWarZ says: let fans trade, keep the trade volume, pay the artist the moment they earn it, and keep what is left for the platform. The numbers flip. The artist goes from 13% to 98.5% of the transaction value. The platform goes from 87% to 1.5%. That is not a tweak. It is a different industry.

For a decade, the conversation in music-tech was: how do we help artists reach more people. The real conversation should be: how do we help artists monetize the people they already have. WaveWarZ answers that.

And it is the front door. The positioning is precise: WaveWarZ is not a music platform for music people. It is a trading platform for artists that happens to use music as the competitive medium. That is how Zaal frames it internally, and that is why the partnership strategy works. We route trading platforms, prediction-market natives, Solana communities, and fans of competitive music toward WaveWarZ. They discover the artist ecosystem inside The ZAO by accident, because the artist is at the center of the trading experience.

---

## 3. How It Works: The Mechanics

### Battle Structure

A match lasts 20 minutes per round, three rounds total, about two hours from start to settlement. Each round is streamed live on X Spaces, YouTube, Retake, and Pump.fun concurrently. The audience watches and trades.

An artist pair is selected by the WaveWarZ team (early on, rotating from a roster of 43+ active musicians). The matchup is announced 24 hours before. Fans bridge SOL or use a fiat on-ramp, and they buy ephemeral tokens denominated in SOL on whichever artist they think wins. Those tokens have a bonding curve price - the more SOL someone bets on an artist, the more expensive the next token costs. The curve is automated on-chain. At settlement, the ephemeral tokens burn and the SOL is divided according to the rules below.

Quick Battles are a faster variant: song versus song, 30-second final trading windows, settlement by SOL pool, X poll, and an AI judge (DJ Wavy, named after a community member) who grades the two tracks. These run Monday through Friday at 8:30pm EST on the same channels.

The ritual is daily. 11 shows per week. An appointment economy around artist discovery.

### Judging: Triple Consensus

Two of three judges must vote for the same artist for that artist to win.

1. **Human Judge** - an expert evaluator (sometimes a label founder, a producer, a musician, a critic) who watches live and renders a score. These are recorded on X for transparency.

2. **X Poll** - a community vote, open to anyone on X who wants to submit a vote. The poll weights each vote equally. No SOL required to vote. Fans who did not trade still get a voice.

3. **SOL Pool** - the artist whose trading tokens captured more SOL by settlement time wins the SOL judge. This is the prediction market judge. It reflects where real money moved, and it is the only automated judge (no human intervention needed).

Quick Battles replace the human judge with an AI judge (a language model grading the two tracks on objective criteria: production quality, originality, fit to genre, listener impact). This keeps Quick Battles fast and removes scheduling friction of finding a human judge every single day.

The triple system does two things. First, it prevents any single judge from controlling the outcome. A human judge cannot rig the battle. The X poll and the SOL pool can override them. Second, it creates three different ways to win - you can win on musical skill (human judge), you can win on popularity (X poll), or you can win on fan investment (SOL pool). Different artists excel at different judges, so the meta is varied.

### Tokenomics: Who Gets Paid and When

The design rule: keep as much in the ecosystem, pay the artist immediately, refund the losing traders as a consolation.

**Per-Trade Payouts (Instant)**

Every time someone buys a token, the artist of that token gets paid 1% of the trade volume, automatically. If an artist is in two battles simultaneously, they get paid 1% for each battle's volume separately. This happens per transaction, on-chain, with no delay. The artist can see the balance grow in real time during the match.

The platform keeps 0.5% per trade for operations. That is it. The remaining 98.5% of each trade stays in the ecosystem - either in the bonding curve pricing (getting returned as refunds to losing traders) or being distributed at settlement.

**Settlement Payouts (At Match End)**

When the match ends and judges declare a winner, the contract settles. The losing trader pool is divided:

- **50% refunded to losing traders** - consolation prize. If you bet $100 and lost, you get $50 back.
- **40% to winning traders** - reward. If you bet $100 on the winner, you get $100 back plus $40 from the loser pool (unless your fellow traders also bet, in which case it is split pro-rata).
- **5% to the winning artist** - celebration bonus. The artist gets an additional 5% of the loser pool on top of the 1% per-trade they already earned.
- **2% to the losing artist** - consolation bonus. Even the artist who lost still gets 2% of the loser pool as encouragement.
- **3% to the platform** - settlement fee. WaveWarZ operating costs.

The math works out to 100% of the loser pool being distributed. No money disappears. The mechanics ensure that the losing traders always get something back, the winning traders are incentivized to come back (they profit), and the artists always walk away with SOL in their wallet, even if they lose.

### Break-Even and Volume Reality

A battle breaks even at $500 in trading volume. Current average volume per match: $800 to $2,500. That is over break-even before the match starts most nights. The operation is structurally profitable because the fee structure (1.5% total - 1% artist, 0.5% platform) is designed to stay small while keeping the venue free for traders.

### Multi-Chain Execution

WaveWarZ deployed first on Solana mainnet. Anchor/Rust smart contract, program ID `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` (v1 verification pending with the core team to confirm this is the current production program).

In February 2026, WaveWarZ deployed Base Sepolia testnet contracts in Solidity/Foundry to test EVM compatibility. The Base contracts implement the same mechanism (bonding curve, ephemeral tokens, settlement logic) with WETH/ETH instead of SOL. The goal is mainnet Base deployment in the second half of 2026. This is strategic because EVM-native fans (especially in the Ethereum ecosystem and ZAO OS users who hold Base assets) can participate without bridging.

---

## 4. The Traction: What Is Actually Happening

Updated 2026-07-02 (verified in doc 950): 500 SOL lifetime volume since the May 2025 launch, roughly 14,000 transactions over 230 days, and the operation has been profitable for four consecutive weeks with the dev wallet holding a 3.5 SOL floor. WaveWarZ is the first project in The ZAO incubator to reach profitability.

The detailed breakdown below is from the Intelligence dashboard snapshot of 2026-05-25 (numbers have grown since; see above).

### Platform Metrics

- **Total Volume (Life to Date):** 458 SOL ($39,113 at $85.40/SOL at snapshot time)
- **Total Battles:** 979 (43 Main Events + 805 Quick Battles + 131 special/tournament)
- **Artist Payouts (Life to Date):** 7.76 SOL ($663 at snapshot rates)
- **Platform Revenue (Life to Date):** 3.65 SOL ($312)
- **Fee Efficiency:** 1.5% total siphoned (1% artist, 0.5% platform); 98.5% ecosystem retention. Verified against the mechanism described in section 3.

### Daily Ritual (11 Shows Per Week)

- **Monday-Friday 11:00am EST:** Community AMA and feedback X Space (founder Hurric4n3IKE, Samantha Denton-Kinney, Zaal Panthaki)
- **Monday-Friday 8:30pm EST:** Quick Battle Trading on X Spaces and YouTube livestream (30-second final window, same-day settlement)
- **Sunday 8:00pm EST:** Special events, AI Artist Tournament (when active), 16-Artist Bracket Tournament (registration open as of May 25)

The 11-show rhythm creates an appointment economy. People carve out their calendar for WaveWarZ in the way they used to for their favorite TV show.

### Artist Roster and Heat

43+ active artists rotating through the battles. The quick-battle leaderboard (as of May 25) shows:

| Rank | Artist | Record | Volume | Status |
|------|--------|--------|--------|--------|
| 1 | Taji Kamikaze (@CannonJones973) | 2-0 | 0.399 SOL | ZAO Cards lead, ZABAL Games mentor |
| 2-5 | (dopestilo, AporkALYPSE78, geekmyth, GodclouD) | Mixed | 0.017-0.355 SOL | Long tail, rotating |

Heat is measured by velocity (battles per period), recency (how recent the last battle), and engagement (trader count, volume). The score ranges: HOT 66+, WARM 33+, COOL 0+. This is the real-time meritocracy at work - the artists who are drawing the most interest and the most capital are visible, and the incentives are aligned to keep performing and keep winning.

### Tournament Structure (Active)

Two tournaments are live with registrations open:

1. **16-Artist Bracket Tournament** - single elimination, full WaveWarZ battle per round, instant SOL payouts per round, fans trade all matchups concurrently, registration via X @WaveWarZ
2. **AI Artist Tournament (8 or 16 slots)** - AI-generated artists only, community-judged settlement, same payout structure as human battles, registration via X, email, Telegram, or phone

The AI tournament is a new product line. Same mechanism, but the artist is synthetic (generated by an AI model). This proves that the platform is artist-agnostic - the protocol cares about performance quality, not whether the performer is human. It also opens the door to fully autonomous artist-trader battles (AI artist, AI judge, AI traders) powered by agent infrastructure like The ZAO's own agent stack.

### Partnership Network (7 Named Partners)

| Partner | Role | Status |
|---------|------|--------|
| **Coinflow ISV** | Fiat on-ramp ("wavestation" merchant ID), SOL tx fees covered | Live |
| **Juke** | Audio rooms, /spaces and /live integration, 9 of 11 ZAO asks shipped May 23 | Live |
| **Magnetiq** | IRL connection NFTs, ZABAL Connector, ETH Boulder Feb 2026 | Live |
| **Empire Builder v3** | Farcaster mini-app, ZABAL rewards | Live |
| **Neynar / Arthur** | EVM contract review, ZABAL Games mentor | Active |
| **RAM SongChain** | WaveWarZ Africa per-country battle leagues | Announced (May 4, 2026) |
| **Privy** | Onboarding flow for ZAO OS users | Built, awaiting activation |

The partnership density is the real distribution thesis. WaveWarZ is not trying to own the audience. It is embedded in seven different tools and ecosystems that already have an audience. When an Empire Builder player completes a quest in WaveWarZ, they discover it. When a Magnetiq organizer checks their connection NFT at a WaveWarZ battle, they get routed to The ZAO. When a RAM SongChain artist in Nigeria needs to route payments, WaveWarZ is the infrastructure. This is how a 3-person team distributes to thousands.

---

## 5. Where It Is Going

### Multi-Chain (Solana -> Solana + EVM)

Solana mainnet is the home base. Base testnet deployment in February 2026 proved the mechanism works on EVM. Mainnet Base launch is pending contract review from Arthur at Neynar (expected mid-2026). The strategic value: EVM-native traders do not need to bridge. ZAO OS users (many of whom have Base assets) can participate without friction. Once Base is live, similar deployments to other EVM chains are possible.

The thesis: chain-native liquidity. Do not ask traders to bridge. Embed in their chain.

### AI Artist Tournament as a Standalone Product

The AI Artist Tournament is a POC as of May 2026. Prototype contracts live on Base testnet. The first scheduled tournament (Good Boy Music, ~May 31, 2026 per team comms) will validate whether AI artists can attract the same audience and trading volume as human artists.

If it works, this is strategic because AI artists are agent-fundable. Imagine an agent (one of The ZAO's own, like ZOL or ZOE) that trains a generative music model, competes in WaveWarZ tournaments, and earns Respect for the wins. Fully autonomous artist and trader revenue flows. This ties The ZAO's agent stack directly to music economics, closing the loop between governance (Respect) and revenue (SOL).

### Geographic Expansion: WaveWarZ Africa

Announced May 4, 2026 in partnership with RAM SongChain. The model is per-country battle leagues (Ghana, Kenya, Nigeria, South Africa, etc., initially TBD with RAM). Each country organizes artists locally, settles battles on Solana or Base, and the country champion feeds into a continental tournament.

The thesis: music-as-sport is universal. The infrastructure is on-chain. The regulation is country-by-country, but the execution can be fully decentralized. Africa has both music talent and Solana adoption in pockets, and the per-country structure respects local autonomy while routing capital efficiently.

This is still early (as of May 2026). Country list, revenue target, and go-live date are TBD per partnership work with RAM.

### ZAO Integration: The Front Door

WaveWarZ is positioned as the front door to The ZAO. Artists start as traders or performers in WaveWarZ. As they participate and win battles, they build a Farcaster presence. When they hit Rising Star / Veteran / Legend milestones, they get auto-cast to the /wavewarz channel on Farcaster, introducing them to The ZAO community. They then discover The Fractal governance, the Respect game, the other lanes (ZABAL Games, events, agents), and the broader impact network.

Zaal's title in WaveWarZ is Director of Ecosystem Strategy and Partnerships. His job is to identify promising artists and builders who come through WaveWarZ, bring them into The ZAO proper, and route them to the opportunity that matches their talents. WaveWarZ generates the inbound flow. The ZAO converts them into long-term contributors.

This is integration at the identity level, not the API level. WaveWarZ users don't feel like they are being converted. They feel like they discovered something new because they were already in the ecosystem.

---

## 6. Connection to The ZAO and The Papers

WaveWarZ is one lane of The ZAO impact network. The others are ZABAL Games (the 3-month build-a-thon), Events and Festivals (ZAO Stock, COC Concertz), and the Agent Stack (ZOE, ZOL, ZAO OS). Each lane is a way to contribute, earn Respect, and move the mission forward.

The Fractal is the governance engine underneath. The Respect token records contribution. In WaveWarZ specifically, an artist who performs and wins battles earns Respect through the weekly Respect Game (the same mechanism The ZAO uses to distribute recognition across all lanes). A performer with a 10-win streak in a month will likely have their contribution ranked higher by the community than a one-time performer. That Respect accrues in their wallet, grants voting weight in network decisions, and stays with them forever. The artist is not just earning SOL from trades. They are building standing in the network.

The mission underneath both is the same: return profit, data, and IP to independent artists. WaveWarZ returns profit per-transaction (1% per trade, paid instantly) and per-match (bonuses at settlement). It returns data (every on-chain metric is public, every trader sees the history). It returns IP through artist-owned recordings and artist-owned distribution - the artist decides where their battle recordings are posted, and they own the streams.

The technical papers are:

1. **The ZAO Whitepaper** - the impact network thesis, Fractal governance, the lanes
2. **The ZAO Technical Whitepaper** - Respect mechanism, voting, on-chain architecture
3. **The ZAO Manifesto** - the five-line creed, signed on-chain for membership
4. **WaveWarZ** - this document, the music-as-prediction-market thesis and mechanics

All live at thezao.xyz/papers.

---

## 7. The Honest FAQ

### Is This Gambling?

Yes, under most regulatory frameworks, WaveWarZ would be classified as gambling. Fans are putting up capital to predict an outcome, and they profit or lose based on that prediction. That is the definition of gambling in most jurisdictions.

The legal framing is that this is a prediction market, which has different regulatory treatment in some jurisdictions (particularly the US, under CFTC rules around prediction markets on non-securities outcomes). Music battle outcomes are not securities - there is no financial instrument being traded, no claim to future earnings, no debt. It is a prediction on an event (who will win the battle).

But the regulatory landscape is unsettled. The specific risks:

1. **US State Gambling Laws:** Some states have narrow predictions-market exemptions (but not all). Other states classify all wagering as gambling and regulate it heavily or prohibit it entirely. WaveWarZ operates federally but users in restricted states should be aware of their local law. The team flags this in the terms of service (TBD - confirm this is in place with legal review).

2. **YouTube Content Policy:** this is not hypothetical - a YouTube community-strike concern over gambling-like content is an active issue (doc 951). Greg's read at Autonomous: platform rules are the immediate threat, ahead of any jurisdiction question - an offshore entity does not protect a YouTube channel. The workaround today is X Spaces and dedicated livestreams on Retake and Pump.fun, which have different content policies. But YouTube is a distribution gap.

3. **International Regulation:** Each country has different gambling and prediction-market rules. The RAM SongChain partnership (WaveWarZ Africa) will require country-by-country legal review before launch in each region.

**The bottom line:** WaveWarZ operates legally in the US under the prediction-market framing, but the regulatory landscape is unsettled. Users and partners should get legal advice specific to their jurisdiction. The team is actively working with Autonomous (legal, 18+ formation jurisdictions - doc 951, call of 2026-07-01) on a risk-first structure: identify liability exposure first, then pick the entity; a hybrid model (offshore holding + US pass-through) is under consideration to keep US banking. IP is a separate track - the WaveWarZ trademark and the gamification mechanism need their own global filings; an entity alone protects neither.

### What If You Lose Your Bet?

Losing traders get 50% of their capital back. That is built into the mechanism. If you bet $100 and lose, you walk away with $50. You do not walk away with nothing.

Losing traders also get to say "I lost on the outcome but I got to watch a live music battle with thousands of other fans." The experience has value beyond the trade outcome. That is the design - prediction markets work better when the underlying event is entertaining in its own right. The market is the wrapper. The music is the core. If the music is bad, the trades do not matter.

The risk of betting is real. Capital can be lost. But the mechanism is honest about it: you can only lose 50% on any single battle. The payout table is public. Anyone can audit it on-chain. The smart contract code is public (on GitHub, CandyToyBox org). There is no hidden downside.

### Artist Consent and Compensation

Artists in WaveWarZ participate voluntarily. They know the battle structure, the payout structure, and the audience size before they agree to battle. The WaveWarZ team has a recruitment pipeline (Neynar DM automation is in design, pending ship) to reach artists and present the opportunity clearly.

The artist is compensated three ways:

1. **Per-trade payout (1% instant)** - Every trade on their side generates immediate SOL. If $1,000 of trades happen on their side, they earn $10 of SOL instantly.
2. **Settlement bonus (5% of losing pool if they win, 2% if they lose)** - Guaranteed payout at match end.
3. **Reputation (Respect token)** - Winning battles accumulate Respect, which grants voting weight in The ZAO and long-term standing in the network.

The artist is not gambling their own capital (unless they choose to trade on themselves, which is allowed and sometimes happens). The artist is betting on their own talent to win a live competition, and they get paid to do it. That is closer to a live show payment model (you get paid to perform) than a gambling model (you put up capital that could be lost).

The ethical risk is small. The economic benefit is large and immediate. Artists control their participation (they can accept or decline battles). Compensation is transparent and on-chain.

### Why Not Use a Token?

WaveWarZ does not have a platform token. Every transaction is denominated in SOL on Solana, WETH/ETH on Base. There is no bridge, no wrapped asset, no governance token, no future dilution.

The rationale: tokens are useful for long-term coordination and for aligning incentives across a large community. WaveWarZ is a protocol, not a DAO. The team runs it. The governance is operational (team decisions on artist rosters, battle schedules, feature releases) not financial. A token would add complexity and create expectations of value appreciation that the team does not want to manage.

If The ZAO ever wanted to tokenize governance (e.g., anyone can propose a new battle type and the community votes), a token would be the tool. That is a future decision. Today, WaveWarZ stays simple: SOL in, SOL out, no extra layer.

### Why Should I Care About This If I am Not a Trader or an Artist?

If you are a builder, WaveWarZ is a case study in music economics. It shows that artists can be paid on-chain, fans can capture upside, and the whole thing can run without a record label or a streaming platform. That is the proof-of-concept for The ZAO's broader thesis.

If you are an investor, WaveWarZ is one lane of a network that is generating revenue (3.65 SOL platform revenue to date, growing) and is on the path to profitability. The 7-partner distribution model is harder to scale than a single platform, but it is harder for competitors to clone.

If you are just interested in what is possible with crypto and music, WaveWarZ is the clearest example I know of where the blockchain actually solves a real economic problem (instant artist payment, audience-driven pricing, transparent settlement). The problem is not theoretical. It is that artists are paid slowly and unfairly under the current system. WaveWarZ does not solve the entire music industry. It solves one moment: the live competitive moment where talent is being tested in real time. That moment can now be monetized by the artist fairly.

---

## 8. Verification Status

**Code-Verified (2026-05-25, Safe)**

- Solana program ID `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` - noted in whitepaper v1; **awaiting current confirmation from core team that this is the active production program**
- Base Sepolia testnet contract address `0xe28709DF5c77eD096f386510240A4118848c1098` - deployed Feb 27 2026, verified via GitHub CandyToyBox org
- Fee structure (1% artist, 0.5% platform per trade) - verified against wavewarz-intelligence.vercel.app hero stats and Doc 743 tokenomics table
- Settlement payout split (50% loser traders / 40% winner traders / 5% winner artist / 2% loser artist / 3% platform) - verified against Doc 743 Section 2.2 and Hackmd whitepaper v1
- Multi-chain status (Solana mainnet live + Base testnet live as of Feb 2026) - verified against Doc 743 Section 1 and GitHub deployment records
- Battle count and volume (979 battles, 458 SOL volume as of May 25 2026) - verified against Intelligence dashboard per Doc 743
- Partner count (7 named partners) - verified via Doc 743 Section 3 partner table

**Research-Sourced, Verify Before Publishing**

- WaveWarZ Africa launch date and country list - announced May 4 per Doc 608, go-live date TBD pending RAM SongChain finalization
- Base mainnet launch date - pending Arthur's contract review per Doc 711
- AI Artist Tournament first event date (Good Boy Music May 31 claimed in team comms) - pending confirmation
- Artist payout claim (7.76 SOL life-to-date) - per Intelligence dashboard, unverified against artist self-reports
- Platform profitability (3.5 SOL floor dev wallet, last 4 weeks profitable, 500 SOL lifetime, ~14,000 tx / 230 days) - VERIFIED vs doc 950 (Ohnahji strat sesh, 2026-07-02)
- YouTube content policy risk - VERIFIED vs doc 951 (active community-strike concern; platform rules trump jurisdiction per Greg)
- Regulatory classification under US CFTC prediction market exemption - claimed in this draft, recommend legal review with Autonomous counsel per Doc 951 partnership

**Not Yet Verified (TBD)**

- Neynar DM automation shipping timeline (claimed in design) - Ikechi / Arthur comms pending
- Privy onboarding activation go/no-go decision - Zaal / Ikechi decision pending
- Public WaveWarZ API existence and spec - Ikechi response pending per Doc 743 open questions
- Roster size discipline (43+ artists sustainable or expand) - team decision pending

**Sources**

- **Doc 743** (WaveWarZ Whitepaper v2 Deep Dive, 2026-05-25) - primary canonical source [FULL]
- **Hackmd whitepaper v1** (Official WaveWarZ whitepaper, Oct 2025) [FULL]
- **wavewarz-intelligence.vercel.app** (Platform metrics, leaderboards, May 25 2026) [FULL]
- **GitHub CandyToyBox org** (Code repositories, deployment records) [FULL]
- **User memory notes** (Profitability snapshot, 500 SOL volume, 3.5 SOL floor) [source noted as unclear]
- **Doc 608** (WaveWarZ Africa RAM SongChain, May 4 2026) [referenced in Doc 743]
- **Doc 711** (Arthur Neynar Base contract review call, May 19 2026) [referenced in Doc 743]
- **Doc 742** (Zaal Panthaki founder dossier, ecosystem partnerships) [referenced in Doc 743]
- **Doc 951** (Greg Autonomous legal structure, 2026-07-01 call) [FULL - verified on main]

**Next Actions Before Publishing**

1. Confirm with Ikechi that Solana program ID `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` is the current production program
2. Cross-check artist payout claim (7.76 SOL) with Intelligence dashboard raw data or artist receipts
4. Get Zaal approval on positioning ("front door to The ZAO, not closer/rails") and geographic expansion strategy
5. Lock AI Artist Tournament first event date with team
6. Confirm Privy onboarding status and activation timeline

---

## Also See

- **Doc 743** - WaveWarZ Whitepaper v2 Deep Dive (canonical reference)
- **Doc 099** - Prediction Market Music Battles (early thinking)
- **Doc 101** - WaveWarZ x ZAO OS Integration Whitepaper (superseded by Doc 743)
- **Doc 608** - WaveWarZ Africa RAM SongChain (May 4 2026)
- **Doc 711** - Arthur WaveWarZ Base Call (May 19 2026)
- **Doc 742** - Zaal Panthaki Founder Dossier (partnerships and role)
- **The ZAO** (main whitepaper) - impact network, Fractal, the lanes
- **The ZAO Technical Whitepaper** - Respect mechanism, on-chain governance
- **thezao.xyz/papers** - all papers live here
