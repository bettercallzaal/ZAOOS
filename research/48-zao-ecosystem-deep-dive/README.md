# 48 — ZAO Ecosystem Deep Dive: Communities, People, Architecture

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Deep dive into every community, key person, and structural element of the ZAO ecosystem
> **Source:** ZAO Whitepaper Draft 3, WaveWarZ Whitepaper, public research

---

## Ecosystem Architecture (Layered)

```
Inner Ring (Core)
├── ZAO Fractal Governance (weekly Monday circles)
├── $ZAO Respect Token (soulbound, Base)
├── ZAO OS (Farcaster client — this repo)
└── ZID (sequential membership: ZID 1 = Zaal, ZID 2 = Candy)

Middle Ring (Products & Events)
├── WaveWarZ (music prediction market, Solana) — FIRST incubator project
├── ZABAL (coordination engine + token)
├── ZAO Festivals (PALOOZA, CHELLA, Stock)
├── Let's Talk About Web3 (podcast by Zaal + Ohnahji)
└── Student Loanz Initiative (education + $LOANZ on Base)

Outer Ring (Mutual Communities)
├── SongJam (voice verification + engagement infra)
├── Ohnahji University (Web3's First HBCU)
├── COC — Community of Communities (Uncle Corvus)
├── Magnetiq (ZABAL connector, Flow blockchain)
├── Quakey (Solana music/gaming, WaveWarZ mutual)
├── Impact Concerts / Token Smart (22K+ web3 creator community)
└── UVR (associated community)
```

---

## Key People

| Person | Real Name | Handle | Role | Key Detail |
|--------|-----------|--------|------|------------|
| **Zaal** | Zaal Panthaki | @bettercallzaal | ZAO Founder, ZABAL architect, WaveWarZ Communications | BS Electrical Engineering (RIT), Maine-based, 329+ daily newsletters |
| **Hurric4n3IKE** | Ikechi Nwachukwu | @Hurric4n3IKE | WaveWarZ Founder/Dev/MC | Web dev, audio engineer, UX designer, musician, writes Anchor/Rust smart contracts |
| **Candy** | Samantha | @CandyToyBoxYT1 | WaveWarZ Marketing/Design, ZAO ZID 2 | CC0 graphics, Web3 Academy Writers Guild, "Web3 Nuances" newsletter, agentic automation |
| **Ohnahji B** | — | @OhnahjiB | Ohnahji University Chancellor, LTAW3 co-host | "Web3's First HBCU", ohnahji.eth, Fractal Day 1: 5th |
| **EZ** | — | @EZinCrypto | LTAW3 co-host | Twitch streamer, community contributor |
| **Uncle Corvus** | — | @unclecorvus | COC founder, Ethergrounds | Blockchain coffee supply chain, cybernetic food truck, charitable work |
| **Adam Place** | Adam Place | @adam_songjam | SongJam Founder/CEO | Voice verification via zkProofs, $SANG token, Farcaster migration |
| **BinX** | — | — | ZAO co-founder | Festival organizing |
| **Mr. McFly** | — | — | ZAO co-founder | Festival organizing |
| **Prizem** | — | @Prizem | Community member | Fractal Day 1: 1st place |
| **SteveStrange** | — | @SteveStrange | Community member | Fractal Day 1: 3rd place |
| **Rhia23k** | — | @Rhia23k | Community member | Fractal Day 1: 4th place |
| **Losi** | — | @iamlosi | Web3 musician | From Cali, Colombia. Performed at ZAO-CHELLA |
| **Dr. Justin Goldston** | — | — | Gemach DAO / SydTek DAO | Connected to Student Loanz educational framework |

---

## WaveWarZ (Deep Dive)

### What It Is
Music prediction market on Solana — the **first project incubated from the ZAO.** Artists battle, fans trade on outcomes.

### Team
| Member | Role |
|--------|------|
| **Hurric4n3IKE** (Ikechi Nwachukwu) | Founder, Developer (Anchor/Rust), MC |
| **Candytoybox** (Samantha) | Design, Content, Marketing, Agentic Automation |
| **BetterCallZaal** (Zaal) | Head of Ecosystem, Communications, Partnerships |

### Battle Mechanics
- **3 consecutive 20-minute battles** per match, same 2 artists
- **Weekly:** Sundays 8 PM EST
- **Triple judging:** Human judge + X poll + SOL trading activity
- **Ephemeral tokens:** Created on bonding curves, exist ONLY during each 20-min window
- Tokens bought/sold during battle — price rises with demand (bonding curve)
- At battle end, tokens settle based on outcome

### Fee Structure (1.5% Total)
| Recipient | Share |
|-----------|-------|
| Artists | 1% of trading volume (immediate payout) |
| Platform | 0.5% for operations |

### Prize Distribution (at battle end)
| Recipient | Share |
|-----------|-------|
| Losing traders (partial recovery) | 50% |
| Winning traders | 40% |
| Winning artist bonus | 5% |
| Platform | 3% |
| Losing artist consolation | 2% |

### Technical
- **Smart contract:** `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` (Solana Mainnet)
- **Framework:** Anchor (Rust)
- **Transaction cost:** ~$0.00025 per tx
- **Legal entity:** Delaware C-Corporation

### Stats
- $800-2,500 per match volume ($50K+ total)
- 50+ curated artist pipeline
- 50+ weekly listeners on livestreams
- Break-even threshold: $500 per battle

### Notable Battles
| Battle | Event |
|--------|-------|
| Visionz vs. Rome | "Crypto Traders Decided This Music Battle!" |
| Hurric4n3ike vs. JANGO UU | WaveWarZ LIVE Rematch at ZAO-CHELLA (Miami, Dec 2024) |
| Indies vs. Classics | Charity battle — raised $270+ for girl child education in Nigeria |

### Lil WaveWarZ
Smaller-scale, accessible version of WaveWarZ — entry point for newer artists/fans. Operates within the WaveWarZ platform, not a standalone project. "Powered by The ZAO — a Nounish crew."

---

## Let's Talk About Web3 (LTAW3)

**A podcast by Zaal and Ohnahji** — its own project, not part of WaveWarZ.

| Detail | Value |
|--------|-------|
| **What** | Weekly podcast / livestream covering Web3 tech, music NFTs, creator tools, ZAO projects |
| **Hosts** | BetterCallZaal + Ohnahji B + EZinCrypto |
| **When** | Wednesdays 6 PM EST |
| **Where** | Twitch (bettercallzaal, ohnahji, ezincrypto) |
| **Archive** | [Pods.media](https://pods.media/lets-talk-about-web3/) |
| **Events** | Listed on [Luma](https://lu.ma/fw0nct7b) |
| **Features** | Intern program (Freezetheverse), guest appearances, community education |

LTAW3 is the **educational and cultural arm** of the ZAO ecosystem — a standalone podcast that brings the community together weekly to discuss what's happening in Web3 and how it affects independent artists.

---

## The ZAO Incubator Model

WaveWarZ is the first project. The incubator follows a **contribution-meritocratic path** — you earn your way to proposal authority through Respect, not capital.

### Artist Onboarding Journey (from whitepaper)
1. Join ZVerse (now ZAO OS)
2. Post in forums / participate
3. Earn Respect tokens
4. Vote in governance
5. Join a team
6. Contribute to IP
7. Propose new project ← **incubator access point**
8. Lead a community initiative

### Economic Tracks
| Track | How It Works |
|-------|-------------|
| **Self-Managed** | Creator retains 100% by handling all work |
| **Collaborative** | Creator shares modest cut for services (marketing, dev) |

---

## Cross-Chain Architecture

| Chain | What Lives There | Token |
|-------|-----------------|-------|
| **Base** (Ethereum L2) | $ZAO Respect (soulbound), $LOANZ (Student Loanz) | `0x34cE89...` |
| **Solana** | WaveWarZ battles, ephemeral tokens | `9TUfEH...` |
| **Flow** | Magnetiq NFT memberships | — |
| **Polygon** | Ohnahji NFT (student IDs) | — |

**Challenge:** Unified identity across chains. ZID would need to resolve a member's Base wallet, Solana wallet, and potentially Flow/Polygon addresses.

---

## Mutual Communities (Deep Dives)

### SongJam — Technology Partner

| Detail | Value |
|--------|-------|
| **What** | Voice Verification Network + X Spaces CRM |
| **Founder** | Adam Place (@adam_songjam), CEO |
| **Core tech** | Voice verification via zkProofs, X Spaces transcription, leaderboards, custom soundboard |
| **$SANG** | Token for Voice Verification Network, staking = √multiplier for scoring |
| **Genesis Testnet** | Launched (Feb 2026) |
| **Farcaster migration** | Actively moving from Web2 (X) to Farcaster |
| **ZABAL integration** | ZABAL leaderboard at songjam.space/zabal tracked mentions during Dec 2025 campaign |
| **Origin** | Started at Terra Luna hackathon → Solana music NFT prediction market bot → voice verification vision |
| **Website** | [songjam.space](https://www.songjam.space/) |

### Ohnahji University — Education Pillar

| Detail | Value |
|--------|-------|
| **What** | "Web3's First HBCU" — blockchain education for BIPOC communities |
| **Founder** | Chancellor Ohnahji B (@OhnahjiB), ohnahji.eth |
| **Format** | Weekly ONJU Saturdays (X Spaces), "The Alphite Gazette" (Medium syllabi) |
| **Topics** | Wallet security, dApps, AI, NFTs, multichain, open source, market analysis |
| **NFT** | 10K PFP collection as student ID (0.01 ETH mint, Polygon) |
| **Co-hosts** | Deans BOSS 2.0 and EyeSeeThru |
| **ZAO role** | LTAW3 co-host, Fractal Day 1: 5th, core community member |
| **Website** | [ohnahjiu.com](https://ohnahjiu.com/) |

### COC — Community of Communities

| Detail | Value |
|--------|-------|
| **What** | Cross-community collaborative framework for joint events and spaces |
| **Founder** | Uncle Corvus (@unclecorvus) |
| **Projects** | Ethergrounds (blockchain coffee), AgriSenseAi (predictive farming), Ether Portal, cybernetic web3 food truck |
| **Charitable** | Clean water in Guatemala, children's sports |
| **ZAO connection** | Co-hosts X Spaces with SongJam + ZAO members |

### Magnetiq — ZABAL Connector

| Detail | Value |
|--------|-------|
| **What** | No-code platform for utility-based NFT memberships ("Magnets") on Flow |
| **CEO** | Kaylan Sliney (co-founder of Gotham Labs) |
| **Funding** | Flow Developer Grant recipient |
| **How** | Brands create membership passes — consumers get familiar UX, NFT infra on backend |
| **ZAO connection** | Connector in ZABAL coordination ecosystem — memberships as access layer |
| **Website** | [magnetiq.xyz](https://www.magnetiq.xyz/) |

### Quakey — WaveWarZ Mutual

| Detail | Value |
|--------|-------|
| **What** | Solana community: NFTs (100 coins by Artist Apollo), metaverse (Nifty Island), gaming (Quakey Tanks), AR merch, music NFTs |
| **Token** | QUAKEY — "the ONLY utility-based memecoin" |
| **Partnership** | BlockQuake cryptocurrency exchange |
| **History** | Near rug-pull day 2 ($670K → $56K), BlockQuake rallied recovery |
| **ZAO connection** | Shared Solana music/gaming space with WaveWarZ |
| **Website** | [quakeycoin.com](https://www.quakeycoin.com/) |

### Impact Concerts / Token Smart

| Detail | Value |
|--------|-------|
| **Token Smart** | 22,000+ member web3 creator community, operating since 2019 |
| **Features** | TokenSmart Radio (24/7), metaverse events, music shows, archived audio from 2016-2022 |
| **Impact Concerts** | Web3 concert initiative within the ecosystem |
| **ZAO connection** | Shared focus on web3 creator events and music |
| **Website** | [tokensmart.co](https://www.tokensmart.co/) |

### UVR — Associated Community

Community-level relationship within the ZAO ecosystem. Limited public web presence — operates primarily through private channels.

---

## Student Loanz Initiative

| Detail | Value |
|--------|-------|
| **What** | Education arm + memecoin on Base |
| **Token** | $LOANZ on Base (`0x03315307b202bf9c55ebebb8e9341d30411a0bc4`) |
| **Launched** | February 2025 on Flaunch.gg |
| **Mission** | Settle student loan debt, bring education finance onchain |
| **How** | DeFi yield strategies for loan repayment, scholarship announcements, event access |
| **ZAO-CHELLA** | Sponsored ZAO-CHELLA at Art Basel Miami 2024 |
| **Supporting DAOs** | Gemach DAO (Dr. Justin Goldston), SydTek DAO (research/education) |
| **Website** | studentloanz.xyz (currently down) |

---

## Frameworks ZAO Uses

### Impact Networks (David Ehrlichman)

Book: "Impact Networks: Create Connection, Spark Collaboration, and Catalyze Systemic Change" (2021)

**Five Cs applied to ZAO:**
| C | ZAO Implementation |
|---|-------------------|
| **Clarify** | Four pillars (Artist/Autonomous/OS/Open Source) |
| **Convene** | Weekly fractals, LTAW3, festivals |
| **Cultivate** | Soulbound Respect tokens = verifiable trust |
| **Coordinate** | ZABAL as coordination engine, SongJam for tracking |
| **Collaborate** | WaveWarZ incubated, COC cross-community events |

### Octalysis Gamification (Yu-kai Chou)

| Core Drive | ZAO Implementation | Status |
|------------|-------------------|--------|
| Epic Meaning & Calling | "Cultural revolution" mission narrative | Live |
| Development & Accomplishment | Respect levels, ZID numbering, badges | Partial |
| Empowerment of Creativity | Real-time peer review in fractals | Live |
| Ownership & Possession | Soulbound $ZAO, on-chain profiles | Live |
| Social Influence & Relatedness | Mentorship, peer validation in fractals | Live |
| Scarcity & Impatience | Limited NFT drops, gated access | Partial |
| Unpredictability & Curiosity | Mystery events, surprise rewards | Planned |
| Loss & Avoidance | Streak rewards (329+ daily newsletters model this) | Partial |

### Nounish Identity

ZAO calls itself "a Nounish crew" — aligning with Nouns DAO values:
- Community-owned
- CC0 / open-source (ZAO OS is MIT)
- Treasury-funded (community-driven, not VC)
- Creative culture
- Public goods orientation

---

## ZVerse & Hivemind

| Concept | Whitepaper Description | Current Reality |
|---------|----------------------|-----------------|
| **ZVerse** | Digital hub, guild-like environment, on-chain profiles | **ZAO OS is becoming ZVerse** — the gated Farcaster client |
| **Hivemind** | Async proposal space, discussions, decision-making | **Planned** — would be a governance/proposals feature in ZAO OS |

The weekly ZAO Fractal is the live governance layer. Hivemind would add async governance on top.

---

## Sources

- [ZAO Whitepaper Draft 3](https://hackmd.io/u9jZ5Q1BR_uUwmRuksvF6Q)
- [WaveWarZ Whitepaper](https://hackmd.io/2DVVvP1oTzCMIqLKRSLgRw)
- [The ZAO](https://www.thezao.com/about)
- [WaveWarZ](https://www.wavewarz.com/)
- [SongJam](https://www.songjam.space/)
- [Ohnahji University](https://ohnahjiu.com/)
- [Magnetiq](https://www.magnetiq.xyz/)
- [Quakey Coin](https://www.quakeycoin.com/)
- [TokenSmart](https://www.tokensmart.co/)
- [Student Loanz (IQ.wiki)](https://iq.wiki/wiki/student-loanz-loanz)
- [Impact Networks (Ehrlichman)](https://www.penguinrandomhouse.com/books/678198/impact-networks-by-david-ehrlichman/)
- [Octalysis Framework](https://yukaichou.com/gamification-examples/octalysis-gamification-framework/)
- [Nouns DAO](https://nouns.wtf/)
- [CandyToyBox on X](https://x.com/candytoyboxyt1)
- [Hurric4n3IKE LinkedIn](https://www.linkedin.com/in/ikechi-nwachukwu/)
- [ZABAL Update 3](https://paragraph.com/@thezao/zabal-update-3)
