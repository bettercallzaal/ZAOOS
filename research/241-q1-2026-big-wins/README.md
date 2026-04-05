# 241 — Q1 2026 Big Wins: The ZAO

> **Status:** Research complete (deep-dive details ongoing)
> **Date:** April 3, 2026
> **Goal:** Document all Q1 2026 wins for The ZAO community — content series foundation

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Content format** | One overarching Q1 recap post + daily deep-dive posts for each win |
| **Documentation home** | `research/241-q1-2026-big-wins/` with per-win detail files |
| **Skill** | `/big-win` skill for adding future wins to quarterly docs |
| **Cadence** | Q2 starts now — add wins as they happen via the skill |
| **WaveWarZ** | Deserves its own deep-dive session — 734 total battles, 472.67 SOL volume (live April 4) |

---

## Q1 2026 Big Wins — Quick Reference

| # | Win | One-Line Summary |
|---|-----|-----------------|
| 1 | SongJam Collaboration | Partnership with Adam & Logesh — ZABAL leaderboard, X Spaces, Farcaster integration |
| 2 | ZABAL Token Launch | Community token launched Jan 1 via Clanker — daily airdrops, SongJam leaderboard |
| 3 | Empire Builder Integration | $168 distributed via reward layer — top 10 leaderboard with boosts up to 9.2x |
| 4 | 1000+ SongJam Campaign Participants | December campaign drew 1000+ participants tracking ZABAL mentions |
| 5 | ETH Boulder Trip | Won Carrot Castle stay via Artizen/Incented — discovered Claude Code, changed everything |
| 6 | ZABAL Shout Out on Stage | Willy Wonka gave ZABAL a blank space shout out on stage at ETH Boulder |
| 7 | ZAOndz Launch | Nouns-style subDAO on Base — 20% of ZABAL token, NFT holders govern treasury (launched March, IYKYK/Fractal Nouns community) |
| 8 | Shipped ZAO OS | First full coding project — gated Farcaster client built with Claude Code in final weeks of Q1 |
| 9 | Daily Streaming Streak | 2 weeks of daily Twitch streams — build-in-public across coding, music, community topics |
| 10 | ZAO Stock Prep | Re-energized ZAO Festivals — past supporters + new 2025 contacts, 3 standups, Oct 3 event |
| 11 | ZAO Ville Announced | DMV area event July 25 — ZAO supporting promotion, production, marketing, organization |
| 12 | 3 Sets of ZOLs (9 winners) | ZABAL Opinion Leaders — monthly recognition, NFT perks, March ZOLs bring total to 12 |
| 13 | PolyRaiders Benefit Battle | Indies vs Classics Valentine's Day love songs battle on 2/14 — $1000+ raised for kids in Africa |
| 14 | Discord Bot + Claude Code | Revived dormant fractal bot at ETH Boulder in 24 hours — first month of vibe coding was all bot upgrades |
| 15 | Bought Noun #1797 | Mainnet Noun co-purchased with Civil Monkey & Fiona for 0.44 ETH on Jan 29 after 2+ months watching |
| 16 | WaveWarZ: First YouTube Stream | March — expanded from X Spaces to YouTube Live for nightly quick battles |
| 17 | WaveWarZ: ATH Volume | Stilo World vs It's Wonderful hit all-time high volume |
| 18 | WaveWarZ: 500+ Quick Battles + YouTube | Nightly battles transitioned from X Spaces to YouTube Live — 734 battles, 472 SOL volume |
| 19 | First PR to SongJam | PR #21: host controls (mute, speaker timers, room settings, co-hosts) — 245 lines, merged by Logesh on Mar 25 |
| 20 | Incented Campaigns | 6 campaigns totaling $260+ USDC + 485M ZABAL — clips, playlists, merch design, memes, Dappable builder challenge |
| 21 | Artizen Fund — Carrot Castle Win | Won Boulder Week room via $ART voting on Incented — the domino that started everything |
| 22 | Crypto Magazine Issue 12 | 2-page "People in Crypto" spread: "Rebuilding Ownership for Independent Artists" — pages 160-161 |
| 23 | BCZ Yapz Episodes 7-13 | 7 interviews in Q1: Yerbearserker, diviflyy, SNAX (PIZZA DAO), GIU (Pinetree), Roaring Sensei, Saltorious.eth (Among Traitors), Ali (Inflynce) |
| 24 | ZAO Fund for Emerging Culture | Created Artizen Season 6 fund — 33+ submissions, 20 curated projects via ZAO Respect voting |
| 25 | COC Concertz #3 | 3rd metaverse concert on March 7 with DUO DO, JOSEPH GOATS, STILO WORLD — next one planned |

---

## Detailed Win Breakdowns

### 1. SongJam Collaboration
- **What:** Partnership with Adam and Logesh from SongJam to build the ZABAL ecosystem
- **Details:** Started with X Spaces talking about ZABAL + tweets. Evolved to also grab from the Farcaster ecosystem and ZAO's own voice channels. Integrated with Empire Builder, swapping APIs back and forth. Great ecosystem connection continuing into Q2.
- **Key people:** Adam, Logesh (SongJam team)
- **Duration:** Ongoing — started Q1, continuing all year
- **ZAO OS integration:** `community.config.ts` line 142-146, ecosystem partner with URL `songjam.space/zabal`

### 2. ZABAL Token Launch
- **What:** Launched the ZABAL token via Clanker ecosystem on January 1, 2026
- **Launch date:** January 1, 2026
- **Details:** Community token built with the SongJam ecosystem in mind. Uses the SongJam leaderboard for tracking mentions across X (24-hour rolling cycles). Daily airdrops through Clanker ecosystem continuing for the rest of the year. Evolving into the ZAOndz governance layer.
- **Total supply:** 100B ZABAL (confirmed on BaseScan)
- **Holders:** 342 on-chain addresses
- **Staking formula:** `1 + sqrt(Stake / 250,000)` — minimum stake 250K ZABAL
- **Note:** Clanker was acquired by Neynar in January 2026 — potential native integration path since ZAO OS already uses Neynar
- **ZAO OS integration:** `community.config.ts` line 160-164, Clanker partner

### 3. Empire Builder Integration
- **What:** Empire Builder as the rewards mechanism layer for ZABAL
- **Details:** Platform that helps take a token from a dream to an empire. ZAO uses it as the rewards distribution layer — distributing ZABAL rewards to people actively engaged with ZAO products. Gives rewards, multipliers, and boosters to people who hold on-chain items, boosting their leaderboard position. Two leaderboards feed into ZABAL: the Empire Builder leaderboard AND the SongJam leaderboard. API integration goes both directions.
- **Key features:** Reward distribution, multipliers/boosters for on-chain holders, dual leaderboard system
- **Total distributed:** $168 via Empire Builder
- **Burned:** 178.21M ZABAL
- **Treasury:** $1,463.34
- **Bot:** Tiny Intern (@zabalbot)
- **On-chain distributions (bulkSend via bettercallzaal.base.eth):**
  - Apr 3, 2026: 100.1M ZABAL to 10 recipients (block 44210036)
  - Mar 11, 2026: 28.2M ZABAL to 11 recipients
- **Top 10 Leaderboard:**

| Rank | Address | Score | Boost | Total Rewards |
|------|---------|-------|-------|---------------|
| 1 | ticweb3 | 499,007,933 | 4.5x | $6.49 |
| 2 | ohnahji | 313,900,882 | 7.3x | $6.82 |
| 3 | candytoybox | 255,835,536 | 6.9x | $2.84 |
| 4 | diviflyy | 246,131,324 | 6.2x | $5.99 |
| 5 | yerbearserker | 238,041,968 | 8.6x | $3.39 |
| 6 | metamu | 188,684,925 | 5.8x | $4.12 |
| 7 | rosecityweb3 | 181,422,577 | 5.5x | $3.82 |
| 8 | nounishprof | 177,884,810 | 9.2x | $5.86 |
| 9 | mozvane.eth | 118,098,218 | 4.8x | $2.49 |
| 10 | ezincrypto | 117,512,763 | 7.8x | $1.47 |

- **Status:** Active, continuing into Q2
- **ZAO OS integration:** `community.config.ts` line 147-151, ecosystem partner at `empirebuilder.world`
- **Empire page:** [ZABAL Empire](https://www.empirebuilder.world/empire/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07)

### 4. 1000+ Participants in SongJam/ZABAL Campaign
- **What:** Over 1,000 participants in the ZABAL campaign on SongJam
- **Details:** Campaign ran for about 1 month in December 2025. Still running monthly campaigns. Campaign tracks ZABAL mentions across X Spaces and tweets, with the leaderboard ranking participants.

### 5. ETH Boulder Trip (Sponsored by Artizen via Incented)
- **What:** Attended Boulder Week / ETH Boulder, Feb 13-15, 2026 — stayed at Carrot Castle for FREE after winning the Artizen-sponsored Incented campaign
- **When:** February 12-16, 2026
- **Details:** Won the Carrot Castle Quest campaign (see #21) to get a free room at the legendary web3 community house. Had to leave early unfortunately — couldn't show the hackathon project. But the trip was transformative: installed Claude Code and within the first 24 hours upgraded the fractal Discord bot that had been dormant for 5+ months. The first month after getting Claude Code was dedicated to making the fractal bot what he wanted it to be. Then started thinking about front ends for the community, which became ZAO OS.
- **The domino chain:** Artizen campaign → Carrot Castle → ETH Boulder → Claude Code → fractal bot upgrades (1 month) → ZAO OS idea → shipped ZAO OS
- **Boulder Week output:** Coding content, newsletter content, networking content, various ETH Boulder challenge submissions. Did sessions and livestream studio but focus shifted to the 5 Incented campaigns.
- **Correction:** Original list said "ETH Denver" — Zaal only went to ETH Boulder, not Denver

### 6. ZABAL Shout Out on Stage
- **What:** ZABAL got shouted out on stage at ETH Boulder
- **Details:** A "blank space" shout out from Willy Wonka. Exciting to see the token recognized on stage at a major Ethereum event.

### 7. ZAOndz Launch (March 2026)
- **What:** Launched ZAOndz — a Nouns-style subDAO for ZABAL on Base
- **When:** March 2026
- **Details:** 20% of the ZABAL token lives in ZAOndz. People who own the NFTs can make proposals for what to do with that 20%. Launched with support from the IYKYK community / Fractal Nouns Community. Low treasury currently but it's a place to store and share ideas about what to do with the creator amount.
- **On-chain stats:** 10 NFTs minted, 2 owners, 1 proposal, latest auction ZOUNZ #9 (Mar 28)
- **Contract:** `0xCB80Ef04DA68667c9a4450013BDD69269842c883` (ERC-721 on Base)
- **ZAO OS integration:** `community.config.ts` line 166-170, `src/lib/zounz/contracts.ts`

### 8. Shipped ZAO OS
- **What:** First full coding project — gated Farcaster client for The ZAO
- **Details:** Very few users so far, which is okay. Still pushing. The build started in the last two weeks of Q1 after spending the first month post-Claude Code on the fractal Discord bot. ZAO OS is inspiring the entire Q2 build. This is Zaal's first full coding project ever.
- **Timeline:** Claude Code (mid-Feb) → fractal bot upgrades (Feb-Mar) → started thinking about front ends → ZAO OS shipped (late March)
- **ZAO OS integration:** The entire codebase — `src/`, `community.config.ts`, 240+ research docs

### 9. Daily Streaming Streak (BetterCallZaal on Twitch)
- **What:** Started a daily streaming streak on Twitch — build-in-public format
- **When:** Started in the last 2 weeks of Q1
- **Details:** Inspired by watching Ohnahji stream over the past 8 months and joining in on his streams. Streams cover everything — coding, music, community, many different topics and types. The goal is building in public. 2 weeks of consecutive daily streams.
- **Platform:** Twitch (bettercallzaal)

### 10. Prepped for ZAO Stock
- **What:** Re-energizing the ZAO Festivals project, bringing the team back together
- **Details:** ZAO Stock is reemerging from the ZAO Festivals idea. Brought back some people from past ZAO Festivals who supported, plus new people met in 2025. Team doing standups — had 3 standups in Q1. Q2 focus: building event functionality and organizational layer.
- **Event date:** October 3, 2026, Franklin St Parklet

### 11. ZAO Ville
- **What:** An event in the DMV area on July 25, 2026
- **When:** July 25, 2026
- **Details:** An associated ZAO Festivals event. ZAO will be supporting with promotion, production, marketing, and organization.

### 12. 3 Sets of ZOLs (12 Winners)
- **What:** ZABAL Opinion Leaders — top 3 monthly SongJam leaderboard performers get ZOL status
- **Details:** Top 3 people on the SongJam leaderboard each month earn ZOL status. Rewarded with NFTs and perks including abilities to create art for the ZAOndz NFTs. Goal is to incorporate ZAOndz into the ZOL program.
- **All 12 ZOLs (Q1 2026):**

| Month | ZOL #1 | ZOL #2 | ZOL #3 |
|-------|--------|--------|--------|
| January | GodFactor | wildermax | Preshzinobabe |
| February | tabbytheblack | ohnahji | akele |
| March | jason alder | collinsxweb3 | metamu |

- **Repeat winners:** ohnahji (2x), candytoybox, Jason Alder (2x) — shows consistent community engagement
- **Note:** Some names appear in both ZOL list and Empire Builder top 10 (ohnahji, metamu, candytoybox) — the most engaged members rise across all leaderboards

### 13. PolyRaiders Benefit Battle — Indies vs Classics
- **What:** WaveWarZ Valentine's Day charity battle — Indies vs Classics (love songs)
- **When:** February 14, 2026
- **Details:** "Indies vs Classics" — love songs theme for Valentine's Day. Many artists in the community supported. Used the WaveWarZ platform to host a charity benefit battle. Raised over $1,000 and donated to PolyRaiders for kids in Africa.

### 14. Discord Bot + Claude Code / Agentic Coding
- **What:** Revived the ZAO fractal Discord bot and discovered Claude Code at ETH Boulder
- **When:** February 2026 (at the event)
- **Details:** Zaal had the fractal Discord bot dormant for 5+ months — procrastinating on upgrades. At ETH Boulder, installed Claude Code and within 24 hours made the necessary upgrades. Tested during the next Monday fractal meeting. The ENTIRE first month after getting Claude Code was dedicated to making this bot what he wanted it to be. Part of the upgrades included integrating Artizen project curation — community members could use their ZAO Respect to decide if an Artizen project would be curated.
- **Significance:** This is the origin story. Claude Code → fractal bot → thinking about front ends → ZAO OS.

### 15. Bought Noun #1797
- **What:** Purchased mainnet Noun #1797 with Civil Monkey and Fiona
- **When:** January 29, 2026
- **Details:** 0.44 ETH bid split 3 ways after watching auctions for over 2 months with Civil. Getting involved with the Nouns space through these co-purchasers.

### 16. WaveWarZ: First YouTube Stream
- **What:** WaveWarZ went live on YouTube for the first time
- **When:** March 2026
- **Details:** Community started with X Spaces, then transitioned to YouTube Live for the quick battles. Platform expansion milestone.

### 17. WaveWarZ: All-Time High Volume
- **What:** Hit ATH on volume — Stilo World vs It's Wonderful
- **Details:** The Stilo World vs It's Wonderful match hit an all-time high on volume. STILO English has the highest per-battle volume ratio on the entire platform: 14.46 SOL across just 9 battles. Platform totals as of April 4: 734 battles, 472.67 SOL ($37,875). WaveWarZ deep-dive scheduled for separate session.

### 18. WaveWarZ: 500+ Quick Battles + YouTube Live Transition
- **What:** Biggest platform milestone — transitioned quick battles from X Spaces to YouTube Live
- **Details:** Locked in on the quick battle format with nightly battles Mon-Fri 8:30 PM EST. The transition from X Spaces to YouTube Live was the biggest milestone. Platform growing fast: +87 battles and +49.3 SOL volume in just 2 weeks. 43+ artists, 734 total battles, 472.67 SOL volume, 7.96 SOL in artist payouts. 16-artist tournament + AI artist tournament coming.

### 19. First Production Code Change to Someone Else's Code
- **What:** PR #21 to SongJam — host controls for live audio rooms
- **When:** March 25, 2026 (merged by Logesh)
- **PR:** [SongjamSpace/songjam-site#21](https://github.com/SongjamSpace/songjam-site/pull/21)
- **Details:** After spending months using the SongJam ecosystem, Zaal wanted to add features himself. Adam shared the GitHub repo. Zaal made a PR adding 4 features in 245 lines:
  1. **Mute All Confirmation** — inline Yes/No buttons replacing browser dialog
  2. **Speaker Time Limit** — configurable 1/2/3/5 minute limits with auto-notification
  3. **Room Settings Panel** — gear icon for title, description, rules, time limits
  4. **Co-host System** — promote speakers to co-hosts with full host privileges
- **Significance:** First time contributing to someone else's production codebase. 245 lines. Merged.

### 20. Incented Campaigns (6 total)
- **What:** Ran 6 campaigns on Incented totaling $260+ USDC + 485M ZABAL in rewards
- **Campaigns:**
  1. **Clip ZABAL on Den** — 45-sec clips from den.show streams. $15 USDC/cycle, 5M ZABAL/cycle
  2. **Top Curated Clip** — Curation challenge, ONE top clip selected. 3 cycles. $10 USDC/cycle, 90M ZABAL/cycle
  3. **Audius WaveWarZ Playlist** — Create playlist with 5+ WaveWarZ tracks. $10 USDC/cycle, 100M ZABAL/cycle
  4. **Design First ZABAL Merch** — Merch design submissions. One becomes official. $10 USDC/cycle, 100M ZABAL/cycle
  5. **Top ZAO Meme** — Meme with a "Z." Last Q1 campaign, currently voting. $10 USDC/cycle, 10M ZABAL/cycle
  6. **Dappable Builder Challenge** — Build apps for ZABAL/ZAO ecosystem. $50 USDC, vibe coding challenge
- **Total pool:** $260+ USDC + 485M ZABAL (+ $LOANZ and $ZAO tokens)
- **ZAO OS integration:** `community.config.ts` line 154-158, Incented partner at `incented.co/organizations/zabal`

### 21. Artizen Fund — Won Carrot Castle Stay for Boulder Week
- **What:** Won the "Castle Quest" Incented campaign sponsored by Artizen Fund
- **When:** Campaign ran ~late Jan 2026, Boulder Week Feb 12-16
- **Details:** Artizen Fund ($4M invested in creative projects) sponsored a Carrot Castle room via Incented. Carrot Castle = legendary web3 community house in Boulder — builders, artists, dinners, hot tub sessions, poker. Zaal applied, rallied community to vote with $ART tokens on Base, and WON.
- **Zaal's submission highlights:**
  - Pitched ZABAL Builder Sessions + Livestream-to-Onchain Studio
  - Referenced ZAO House at Art Basel 2024 as proof of IRL community house experience
  - Already shipped 3 Incented campaigns with 20+ submissions as proof of follow-through
  - Positioned it as "creative infrastructure, not a solo win"
- **Award:** 1 CARROT CASTLE COIN (CCC) on Base Mainnet
- **Links:**
  - [Campaign page](https://incented.co/details/cbc55ccb-b24d-4724-a4ad-39588890cc2e?org=carrot-castle)
  - [Zaal's submission](https://incented.co/applications/5cf6d3eb-f998-4c3d-93c5-6e6e6d0bb7cf?org=carrot-castle)
  - [Artizen Fund](https://artizen.fund) | [Carrot Castle](https://carrotcastle.xyz) | [$ART Endowment](https://artizen.fund/index/endowment)

### 22. Crypto Magazine — Issue 12 Feature (2-Page Spread)
- **What:** 2-page "People in Crypto" feature: "Zaal Panthaki (BetterCallZaal) — Rebuilding Ownership for Independent Artists"
- **Publication:** FUDG Crypto / Crypto Magazine, Issue 12, pages 160-161
- **Details:** Full 2-page spread covering Zaal's mission to rebuild ownership for independent artists. Topics include: decentralized alternatives for creators, the ZAO community, on-chain activity, building in public, governance, art, education, and culture. Zaal describes his approach: "I set down and build. Every single day." Mentions prediction on Bitcoin/Ethereum by 2025, collective voting, AI influence. Closes with advice for newcomers: "I believe in hacking what I can and documenting as I go."
- **Key quotes:** "Rebuilding Ownership for Independent Artists" | "The reason I entered crypto seriously in 2020 was social. It gave me the opportunity to build and grow something" | "Self-custody, transparency, and composability are features, not bugs"
- **Location listed:** Bar Harbor, Maine, USA
- **Images:** `research/newfiles/articlepage1.jpeg`, `research/newfiles/articlepage2.jpeg`
- **Link:** [Crypto Magazine Issue 12](https://cryptomagazine.myshopify.com/products/issue-11-crypto-magazine-copy?_pos=6&_sid=326e63009&_ss=r)

### 23. BCZ Yapz Episodes (7 in Q1, eps 7-13)
- **What:** 7 interview episodes produced in Q1, bringing total to 13
- **Platform:** YouTube
- **Playlist:** [BCZ Yapz on YouTube](https://www.youtube.com/watch?v=3vUAFwXqdeo&list=PLgkFmQwKv5euNDCQfn-1dYbv8Wvt-rxC3)
- **Q1 Episodes:**

| Ep | Guest | Topic/Project |
|----|-------|---------------|
| 7 | Yerbearserker | Empire Builder |
| 8 | diviflyy | Empire Builder |
| 9 | SNAX | PIZZA DAO |
| 10 | GIU | Pinetree |
| 11 | Roaring Sensei | — |
| 12 | Saltorious.eth | Among Traitors |
| 13 | Ali | Inflynce |

- **Notable:** Yerbearserker (#5 Empire Builder leaderboard) and diviflyy (#4) were guests — content and ecosystem feeding each other

### 24. ZAO Fund for Emerging Culture (Artizen Season 6)
- **What:** Created a community-owned funding vehicle on Artizen for independent creators
- **Stats:** 33+ submissions, 20 curated projects (curated by ZAO community members using their ZAO Respect to decide)
- **Eligibility:** Creator-owned projects integrating emerging tech, community participation, build in public, non-extractive, culminating in real-world activation
- **Link:** [ZAO Fund for Emerging Culture — Artizen Season 6](https://artizen.fund/index/mf/zao-fund-for-emerging-culture?season=6)
- **Significance:** ZAO goes from receiving funding (Carrot Castle win) to CREATING a funding vehicle for others. Full circle in one quarter. The curation mechanism ties directly to the fractal bot upgrades — ZAO Respect powers the curation decisions.

### 25. COC Concertz #3 (March 7, 2026)
- **What:** 3rd COC Concertz metaverse concert — the Q1 concert
- **Concert dates:** #1 March 29, 2025 | #2 October 11, 2025 | **#3 March 7, 2026**
- **Performers (COC #3):** DUO DO (@duodomusica), Dope Stilo (@dopestilo), JOSEPH GOATS (@joseacabreav)
- **Platform:** StiloWorld on Spatial.io
- **Co-organizer:** Thy Rev (Community of Communities)
- **Access:** Bonita NFT
- **Farcaster channel:** /cocconcertz
- **Next concert:** Planned

---

## Comparison of Q1 Win Categories

| Category | # of Wins | Key Highlights | Q2 Continuation |
|----------|-----------|----------------|-----------------|
| **Token/DeFi** | 4 (ZABAL, Empire Builder, ZAOndz, ZOLs) | Jan 1 launch, 1000+ participants, dual leaderboards, 20% subDAO, 9→12 ZOLs | Daily airdrops, more utility, ZOLs + ZAOndz merge |
| **Events/IRL** | 4 (ETH Boulder, PolyRaiders, ZAO Stock prep, ZAO Ville) | Won Carrot Castle, $1000+ charity on Valentine's Day, stage shout out, 3 standups | ZAO Ville July, ZAO Stock Oct 3 |
| **Products shipped** | 4 (ZAO OS, SongJam PR, fractal bot, WaveWarZ YouTube) | First full code build, first open source PR (245 lines merged), bot revived in 24hrs | Q2 build sprint |
| **Community/Content** | 5 (Incented, BCZ Yapz, Crypto Mag, daily streaming, COC Concertz) | 6 campaigns/$260+ USDC, 7 episodes, print feature, 2-week streak | More campaigns, more content |
| **Funding/Governance** | 3 (Artizen Castle win, ZAO Fund, Noun #1797) | Won room via $ART, created fund (33 submissions/20 curated), 0.44 ETH Noun | Deeper Artizen/Incented involvement |
| **WaveWarZ** | 3 (YouTube, ATH, 500+ Quick Battles) | 720 battles, 442 SOL volume, nightly format, platform expansion | Deep-dive session coming |

---

## The Q1 Domino Chain (Narrative Arc)

The story of Q1 2026 is one domino chain:

1. **Jan 1:** ZABAL token launches on Clanker
2. **Jan 29:** Co-purchases Noun #1797 with Civil Monkey & Fiona (0.44 ETH)
3. **Late Jan:** Wins Carrot Castle Quest campaign on Incented via $ART voting
4. **Feb 12-16:** Boulder Week / ETH Boulder — stays at Carrot Castle for free
5. **Feb ~13:** Installs Claude Code at ETH Boulder, upgrades dormant fractal Discord bot in 24 hours
6. **Feb 14:** PolyRaiders benefit battle raises $1000+ on WaveWarZ
7. **Feb-Mar:** First month of Claude Code = making the fractal bot what it should be. Bot now integrates Artizen curation via ZAO Respect.
8. **Mar 7:** COC Concertz #3 — DUO DO, JOSEPH GOATS, STILO WORLD
9. **Mar:** Starts thinking about front ends for the community → ZAO OS idea
10. **Mar:** WaveWarZ first YouTube stream, hits ATH volume, crosses 500 quick battles
11. **Mar 25:** First PR to SongJam merged — 245 lines, 4 host control features
12. **Mar:** Featured in Crypto Magazine Issue 12 (print + digital)
13. **Mar:** ZAOndz launches on Base with IYKYK/Fractal Nouns support
14. **Late Mar:** Ships ZAO OS — first full coding project
15. **Late Mar:** Starts daily Twitch streaming streak — 2 weeks of consecutive days
16. **Q1 total:** 6 Incented campaigns ($260+ USDC + 485M ZABAL), 7 BCZ Yapz episodes, 3 ZOL sets (9 winners), ZAO Fund created (33 submissions, 20 curated)

**The thesis:** One Artizen campaign win cascaded into an entire quarter of shipping.

---

## WaveWarZ Platform Stats (Growth Snapshot)

| Metric | Mar 21 (Doc 101) | Apr 3 (Doc 241) | Apr 4 (Live) |
|--------|------------------|-----------------|--------------|
| Total battles | 647 | 720 | **734** |
| Total volume | 423.37 SOL ($38K) | 442.31 SOL ($35K) | **472.67 SOL ($37,875)** |
| Artist payouts | 7.17 SOL ($644) | 7.65 SOL ($610) | **7.96 SOL ($638)** |
| Platform revenue | 3.38 SOL ($303) | 3.59 SOL ($287) | **3.75 SOL ($300)** |

**+87 battles, +49.3 SOL volume in ~2 weeks.** Growth is accelerating.

| Schedule | When |
|----------|------|
| Quick Battle Trading | Mon-Fri, 8:30 PM EST (YouTube Live) |
| Community AMA | Mon-Fri, 11:00 AM EST (X Spaces) |
| Main Events | Sundays |
| Upcoming | 16-artist tournament + AI artist tournament |

### Top Artists by Volume

| Artist | W-L | Battles | SOL Volume | Win % |
|--------|-----|---------|------------|-------|
| LUI | 49-22 | 71 | 29.59 SOL | 69% |
| STILO English | 4-5 | 9 | 14.46 SOL | 44% |
| PROF!T | 5-2 | 7 | 13.86 SOL | 71% |
| ONE | 9-5 | 14 | 12.04 SOL | 64% |
| Lil Rocky | 10-23 | 33 | 11.96 SOL | 30% |
| Stormi | 31-44 | 75 | 11.87 SOL | 41% |
| APORKALYPSE | 22-8 | 30 | 10.97 SOL | 73% |
| Preshzino Songz | 2-1 | 3 | 9.56 SOL | 67% |

*STILO English has the highest per-battle volume ratio on the platform (14.46 SOL across 9 battles)*

*Deep-dive into WaveWarZ Q1 wins scheduled for separate session*

---

## ZAO OS Integration

This doc connects to the codebase through:
- `community.config.ts` — All ecosystem partners (SongJam line 142, Empire Builder line 147, Incented line 154, Clanker line 160, ZAOndz line 166, WaveWarZ line 172)
- `src/lib/zounz/contracts.ts` — ZAOndz DAO contract addresses + ABIs
- `src/components/spaces/` — 40+ components for live audio/video rooms
- `community.config.ts` line 36 — channels: zao, zabal, cocconcertz, wavewarz
- Research docs: 65 (ZABAL ecosystem), 78 (Nouns Builder), 96/101/178 (WaveWarZ), 119/122 (SongJam)

---

## Still Needs Context

| # | Win | What's Needed |
|---|-----|---------------|
| 3 | Empire Builder | More granular distribution data (Zaal to provide) |
| 12 | ZOLs | Confirm monthly breakdown (which 3 names go with which month?) |
| 16-18 | WaveWarZ | Full deep-dive session (scheduled for after this doc) |

---

## Sources

- [SongJam ZABAL Leaderboard](https://songjam.space/zabal)
- [Empire Builder](https://empirebuilder.world)
- [Incented ZABAL Organization](https://incented.co/organizations/zabal)
- [ZAOndz on Nouns Builder](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
- [WaveWarZ Main App](https://www.wavewarz.com)
- [WaveWarZ Intelligence / Stats](https://wavewarz.info/)
- [Den.show ZABAL](https://den.show)
- [SongJam PR #21](https://github.com/SongjamSpace/songjam-site/pull/21)
- [Crypto Magazine Issue 12](https://cryptomagazine.myshopify.com/products/issue-11-crypto-magazine-copy?_pos=6&_sid=326e63009&_ss=r)
- [BCZ Yapz Playlist](https://www.youtube.com/watch?v=3vUAFwXqdeo&list=PLgkFmQwKv5euNDCQfn-1dYbv8Wvt-rxC3)
- [Artizen Fund](https://artizen.fund)
- [ZAO Fund for Emerging Culture](https://artizen.fund/index/mf/zao-fund-for-emerging-culture?season=6)
- [Carrot Castle Quest Campaign](https://incented.co/details/cbc55ccb-b24d-4724-a4ad-39588890cc2e?org=carrot-castle)
- [Zaal's Carrot Castle Submission](https://incented.co/applications/5cf6d3eb-f998-4c3d-93c5-6e6e6d0bb7cf?org=carrot-castle)
- [Carrot Castle](https://carrotcastle.xyz)
- [ZABAL Empire on Empire Builder](https://www.empirebuilder.world/empire/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07)
- [ZABAL on BaseScan](https://basescan.org/token/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07)
- [ZABAL Update 3 on Paragraph](https://paragraph.com/@thezao/zabal-update-3)
- [Incented Docs](https://docs.incented.co)
