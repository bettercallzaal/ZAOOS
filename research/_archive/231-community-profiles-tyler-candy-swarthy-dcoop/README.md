# 231 — Community Member Deep Profiles: Tyler/Magnetiq, Candy, Swarthy Hatter, DCoop/ZAOVille

> **Status:** Research complete
> **Date:** March 30, 2026
> **Tags:** `#community` `#profiles` `#magnetiq` `#wavewarz` `#zaoville` `#fractal`
> **Related:** Doc 47, Doc 48, Doc 50, Doc 65, Doc 78, Doc 101, Doc 224

---

## 1. Tyler Stambaugh / Magnetiq

### Identity

| Field | Detail |
|-------|--------|
| **Full name** | Tyler C. Stambaugh |
| **Title** | Co-Founder & COO (also referenced as Co-Founder & Chief Product Officer) |
| **Company** | MAGNETIQ, Inc. |
| **Location** | New York, NY |
| **Email** | tyler@magnetiq.xyz |
| **LinkedIn** | [linkedin.com/in/tyler-c-stambaugh-18020060](https://www.linkedin.com/in/tyler-c-stambaugh-18020060/) |
| **Polywork** | [polywork.com/tyler_stambaugh](https://www.polywork.com/tyler_stambaugh) |
| **Twitter** | @magnetiq_xyz (company account) |

### Background

Tyler co-founded MAGNETIQ alongside **Kaylan Sliney** (CEO). Together they were leveraging blockchain technology as early as 2022, initially working on projects for social impact organizations. They used NFTs as "identification anchors" for people who opted in and supported causes, then built communities around those digital assets.

Tyler's focus is on the product and operations side, with a passion for community engagement and blockchain technology. He has described founding MAGNETIQ as a way to "leverage one to power the other" (community engagement + blockchain).

### Magnetiq — The Company

| Field | Detail |
|-------|--------|
| **Founded** | July 2022 |
| **HQ** | New York, NY |
| **Size** | ~5 employees |
| **Blockchain** | Flow (Dapper Labs chain, same as NBA Top Shot) |
| **Website** | [magnetiq.xyz](https://www.magnetiq.xyz/) |
| **Tagline** | "Your brand's digital clubhouse" |
| **Security** | Emerald Shield verification (Emerald DAO security audit on Flow) |
| **Launch** | April 2023 (on Flowverse) |

### Co-Founder: Kaylan Sliney (CEO)

| Field | Detail |
|-------|--------|
| **Title** | Co-Founder & CEO of MAGNETIQ, Inc.; Co-Founder of Gotham Labs |
| **Background** | 15 years as a venture lawyer; blockchain since 2017 |
| **Speaking** | Sessionize speaker profile; topics include "Using Tech to Build Brand Culture: How NFTs Change the Game for Commerce-Based Communities" |
| **Expertise** | Women in Blockchain, Enterprise Blockchain, AdTech, MarTech, B2B SaaS |
| **Twitter** | @kaylan_sliney |
| **Podcast appearances** | Lyons Den (Ep7), Your Empress Era (Ep28), Web3 CMO Stories, Nifty Chicks |
| **Notable** | Advises 12+ startups; runs marathons; journey spans Connecticut, Africa, California, Nepal |

### Magnetiq Engineering Team (from Grant Application)

| Person | Role | Background |
|--------|------|-----------|
| Shashank Singla | Head of Engineering / CTO | Ex-Goldman Sachs, IIT Delhi, 12+ years, 2 AI exits, 350M+ daily requests at Paytunes |
| Harshit Garg | Program Manager | 6+ years digital transformation |
| Gurdeep Singh | Blockchain Developer | 5+ years dev, 2+ years blockchain |
| Jayant Pahuja | Frontend | 3+ years React/Tailwind |
| Ashish Gahlawat | Backend | 2+ years |
| Shantanu Bahadure | Designer | 5+ years UI/UX |

### How Magnetiq Works at Events

Magnetiq uses **QR codes** (not NFC) as the primary interaction mechanism:

1. **Setup:** Brand/creator creates a "hub" on the Magnetiq platform (no-code)
2. **At the event:** Each event gets a unique QR code (physical signage, printed badges, or screens)
3. **Attendee scans QR:** Opens in browser, no app install required
4. **Registration:** Person enters email, joins the hub
5. **Badge minting:** Gets an event-specific digital badge ("Magnet" or "Memento") minted on the Flow blockchain
6. **Post-scan experience:** Can upload selfies, answer surveys, watch intro content, browse project links
7. **Digital wallet:** Badges can be added to Apple Wallet or Google Wallet (no crypto wallet needed)
8. **CRM output:** Organizer gets a living CRM of everyone they met, organized by event, with submissions
9. **Security:** Each QR code is unique; duplicate scans are detected and flagged

**Key UX principle:** Web2 frontend experience (email-based auth, familiar scanning), Web3 backend (Flow blockchain NFTs). Attendees never need to know about blockchain.

### Flow Developer Grant #111

| Field | Detail |
|-------|--------|
| **GitHub issue** | [onflow/developer-grants#111](https://github.com/onflow/developer-grants/issues/111) |
| **Submitted by** | Tyler Stambaugh (October 28, 2022) |
| **Category** | Developer tools/services |
| **Amount requested** | $500,000 across 5 phases |
| **Status** | Closed as completed (July 3, 2023) |

**Grant milestones:**

| Phase | Timeline | Budget |
|-------|----------|--------|
| Onboarding | 8 weeks | $100,000 |
| MVP | 8 weeks | $100,000 |
| Alpha Launch | 12 weeks | $150,000 |
| Beta Launch | 24 weeks | $100,000 |
| Maintenance | Ongoing | $50,000 |

**Two development tracks in the grant:**

1. **Legacy Program Level-Up:** Connect existing Flow NFT projects to MAGNETIQ for utility delivery; includes full back-end dashboard with analytics
2. **MAGNETIQ Platform:** No-code solution for brands to create membership programs; consumer-friendly online experience for collecting utility

**Grant reviewer note:** Chris Ackermann (Flow team) requested scope reduction to focus on open-source components rather than the broader commercial platform.

### Core Platform Features

| Pillar | What It Does |
|--------|-------------|
| **Core Engagement** | Polls, surveys, gated content, engagement loops |
| **Co-Lab Studio** | UGC collection, co-creation tools, photo/video sharing |
| **Event Intelligence** | QR-gated content, post-event analytics, badge collection |
| **Commerce Community** | Shopify integration, rewards, revenue-driving communities |

### ZABAL / ZAO Connection

| Event | Detail |
|-------|--------|
| **ZABAL Connector** | Zaal used Magnetiq at **ETH Boulder** (February 2026) to create the ZABAL Connector hub |
| **Proof of Meet (POM)** | The ZABAL-specific use case: IRL connection tokens for people who met Zaal at events |
| **How POM works** | Attendee scans QR -> gets a digital badge on Flow -> becomes part of the ZABAL CRM |
| **Previous ZAO events** | Tyler has "done this at previous ZAO events" (per Doc 224) |
| **ZAO Stock role** | Tyler is assigned as the **IRL Connection Layer** for ZAO Stock (Oct 2026) — Magnetiq Proof of Meet tokens, ZABAL integration, community networking |
| **Task Force TF-04** | "Magnetiq IRL meet token integration confirmed" is a deliverable for ZAO Stock |

**Zaal's quote on POM:** "Proof of Meet isn't just a digital badge. It's an intentional acknowledgement of the magic we experience when we interact with others in person."

### Technical Gap

Magnetiq is on **Flow blockchain**; ZAO OS is on **Ethereum/Base/Optimism**. No native cross-chain bridge exists. Current integration is link-based. No public API. Contact tyler@magnetiq.xyz for API partnership.

---

## 2. Candy (Samantha Denton-Kinney)

### Identity

| Field | Detail |
|-------|--------|
| **Full name** | Samantha Denton-Kinney (also appears as Samantha Kinney) |
| **Handle** | CandyToyBox |
| **ENS** | CandyToyBox.eth |
| **ZID** | 2 (second ZAO ID ever issued, after Zaal's ZID 1) |
| **Location** | New York, United States |
| **Website** | [candytoybox.com](https://candytoybox.com/) (SSL cert issue as of March 2026) |
| **LinkedIn** | [linkedin.com/in/candytoybox](https://www.linkedin.com/in/candytoybox/) |
| **Devfolio** | [devfolio.co/@CandyToyBox](https://devfolio.co/@CandyToyBox) |
| **Peerlist** | [peerlist.io/candytoybox](https://peerlist.io/candytoybox) |
| **Medium** | [medium.com/@CandyToyBox](https://medium.com/@CandyToyBox) |
| **TikTok** | [@candytoybox](https://www.tiktok.com/@candytoybox) |
| **Skool** | [skool.com/@samantha-kinney-5119](https://www.skool.com/@samantha-kinney-5119) |
| **Education** | Bachelor of Business Administration, The City College of New York |

### Self-Description (Devfolio Bio)

"Web3 Builder | Based | ZAO Co-Founder | Student $LOANZ @loanzonbase Creator"

### ZAO Roles

| Role | Detail |
|------|--------|
| **ZAO Co-Founder** | One of the founding team (with Zaal, Hurric4n3IKE) |
| **WaveWarZ Co-Founder** | Marketing, Design, Agentic Automation (WaveWarZ co-founded in 2023) |
| **ZID 2** | Second ZAO member ever — ZID 1 = Zaal, ZID 2 = Candy |
| **Fractal Day 1** | Ranked 2nd on the very first ZAO Fractal Respect Game |
| **Student $LOANZ** | Creator of the $LOANZ token on Base (launched Feb 2025 on Flaunch.gg, sponsored ZAO-Chella) |
| **ZAO Stock role** | Design + Backup Support: visual design, materials, branding, sponsorship outreach |

### CandyToyBox on GitHub — 16 Repositories (All WaveWarZ)

| Repo | Description | Last Updated |
|------|-------------|-------------|
| `wavewarz-intelligence` | Analytics dashboard (deployed at wavewarz-intelligence.vercel.app) | Mar 17, 2026 |
| `wavewarz-base` | **Base L2 smart contracts** (Solidity/Foundry, 5 contracts, 8/8 tests passing) | Feb 27, 2026 |
| `analytics-wave-warz` | Charts dashboard (Recharts + Supabase) | Feb 28, 2026 |
| `homepage-redesign` | wavewarz.com frontend redesign | Feb 22, 2026 |
| `wavewarz-merch-shop` | "Agentic Merch Shop" (AI agent-powered merch store) | Feb 20, 2026 |
| `Dashboard_wallet_checker` | The Claim Tool (wallet scanner for claiming rewards) | Feb 1, 2026 |
| `V2-Stats-App-WaveWarz` | TypeScript stats app for WaveWarz Live-Traded Music Battles | — |
| `WaveWarz-Stats-App` | Earlier version of the stats app | — |
| `v0-wave-war-z-website-prototype` | Website prototype (v0 generated) | — |
| `v0-REDESIN` | Redesign prototype | — |
| `streamvoter` | Voting app (earlier experiment) | Oct 2025 |
| `MusicToken` | Token contract experiment | May 2025 |
| `AllowanceApp` | — | — |
| `blackbeard-cnc` | — | — |
| `onchain-commerce-zao` | On-chain commerce for ZAO | — |
| `seed-phrase` | — | — |

**GitHub stats:** 557 contributions in past year, 16 repos, 2 stars earned.

**Key technical finding:** Candy owns ALL the WaveWarZ development repos. The `wavewarz-base` repo contains **Solidity/Foundry smart contracts for WaveWarZ on Base L2** (5 contracts, 8/8 tests passing, deployed to Base Sepolia testnet at `0xe28709DF5c77eD096f386510240A4118848c1098`). This means she is writing the smart contracts for WaveWarZ's multi-chain expansion.

### Web3 Academy Writers Guild

Candy is a **Web3 Academy DAO Operator** and member of the Web3 Academy Writers Guild. She runs the **Web3 Academy DAO DOers Newsletter** on Substack ([web3adao.substack.com](https://web3adao.substack.com/)).

### Sponsorship Admin — Impact3 / Milk Road

| Field | Detail |
|-------|--------|
| **Title** | Sponsorship Administrator |
| **Company** | Impact3.co (Web3 Product & Marketing Studio) — sister organization to Milk Road |
| **Start date** | October 30, 2023 |
| **Contact email** | (at milkroadcoffee.com domain, per ZoomInfo) |
| **What she does** | Administers sponsorship deals for the Impact3/Milk Road ecosystem |

**Milk Road** is one of the largest Web3 media properties (newsletter + podcast + community). Impact3 is its Web3 product/marketing studio arm. Candy's role here gives her direct connections to major Web3 brands and sponsorship budgets.

### CC0 Art

Candy creates **CC0 graphics** for the ZAO and WaveWarZ ecosystems. CC0 means "Creative Commons Zero" — public domain, no rights reserved. This aligns with the ZAO's Nounish identity (Nouns DAO is CC0). Her design work includes:

- WaveWarZ branding and marketing materials
- ZAO event visual design (ZAO-Chella, ZAO-Palooza materials)
- Print + digital design for community materials
- ZAO Stock design materials (assigned role in Doc 224)

### Medium Articles (Published)

| Title | Date | Topic |
|-------|------|-------|
| Why Creators Need To Care About Web3 | Mar 6, 2023 | Web3 education for creators |
| Web3 Data Backpacks (interview with Evin McMullen, Disco.xyz) | Mar 6, 2023 | Digital identity, data ownership |
| Unleashing the Power of Memes in Web3 Marketing | Jun 20, 2023 | Marketing strategies |
| On-Chain Idol | Jun 6, 2023 | Blockchain talent shows |
| Harnessing the Potential of Roblox | Jun 29, 2023 | Gaming platform analysis |
| Unlocking the Power of ERC-6551 | Jun 30, 2023 | NFT smart contracts |
| The Evolution of Social Finance (SoFi) | Sep 26, 2023 | Social finance, Post.Tech |
| Understanding UTC in Web3 and Online Communities | — | Global timekeeping guide |

**Note:** The "Web3 Nuances" newsletter mentioned in internal docs was not found as a standalone publication. It may be an informal name for her Medium/Substack writing or an internal ZAO reference.

### Hackathon Activity

Per Devfolio: 1 project built, 1 hackathon attended, 0 prizes won. The project listed is **V2-Stats-App-WaveWarz** (TypeScript stats app for WaveWarz Live-Traded Music Battles).

### Design Work for ZAO Events

- **ZAO-Palooza (April 2024):** Trading card design, event branding
- **ZAO-Chella (Dec 2024):** Event materials, AR art display coordination, trading cards
- **ZAO Stock (Oct 2026 planned):** Assigned to Design + Backup Support team alongside DaNici

---

## 3. Swarthy Hatter (@swarrthy)

### Identity

| Field | Detail |
|-------|--------|
| **Real name** | Timothy |
| **Aliases** | SwarthyHatter, Swarthy Hatter, FkyKnives, @swarrthy |
| **Farcaster** | @swarrthy |
| **Nouns Builder forum** | [SwarthyHatter](https://forum.nouns.build/t/introduce-yourself/12/4) |
| **Web3 since** | 2020 |

### Background & Skills

From his Nouns Builder forum introduction post:

| Skill | Detail |
|-------|--------|
| **Product design** | Core competency |
| **Project management** | Core competency |
| **Technical writing** | Core competency |
| **Copywriting** | Core competency |
| **Public speaking** | Core competency |
| **Voice-over work** | Noted capability |
| **Development** | Learning — "willing to take on development tasks to build knowledge" |

Timothy has been a Web3 and DAO contributor since 2020. He describes himself as having "a lot of ideas for things to build" particularly around governance tools.

### Fractal Communities — "Bridges Fractal Communities"

Swarthy Hatter's defining role in the ZAO ecosystem is **bridging multiple fractal communities**. The fractal ecosystem includes:

| Community | Founded | Events | Connection |
|-----------|---------|--------|-----------|
| **Eden Fractal** | 2022 (by Dan Singjoy) | 110+ events | Original fractal model; inspired all others |
| **Optimism Fractal** | 2023 | Weekly events | Shared Respect Game tooling (Fractalgram); on Superchain |
| **ZAO Fractal** | 2023 (by Zaal) | 90+ events | Music/artist focus; Monday 6 PM EST |
| **Optimystics** | — | — | Builds all fractal governance tooling (Fractalgram, OREC) |

Swarthy bridges these communities — meaning he participates across multiple fractal groups, carries context between them, and helps cross-pollinate ideas and practices. The fractal communities share the **Respect Game** (an onchain social game for cooperative ranking of contributions), but each has its own focus (governance research, music, general Optimism ecosystem).

**Honored as a builder** in the Optimism Fractal community alongside Tadas, Vlad, and Zaal.

### Nouns Builder Involvement

- **Early contributor to City Nouns** — a Nouns Builder DAO project
- Joined the Nouns/Lil Nouns community "looking for a place to build and test governance tools"
- Interested in designing governance experiments within the Nouns ecosystem
- **SKTH** — referenced in connection to SwarthyHatter but no public information connects it to a specific DAO or project. May be a personal project or alias.

### Media and Production Work

Swarthy Hatter has **media + production skills** and is assigned to the ZAO Stock festival team:

| Role | Detail |
|------|--------|
| **ZAO Stock assignment** | Media + Production Support — video, photography, content capture, social media |
| **Responsibility** | Day-of documentation, build-in-public content pipeline |
| **Team** | Works alongside Ohnahji B and Maceo on the Media + Documentation team |
| **Coverage** | 3-person media team covers livestreaming, podcast production, photography, videography, social media |

### ZAO Ecosystem Position

| Context | Role |
|---------|------|
| **Doc 50 (Complete Guide)** | Listed in Fractal Community Network table: "Bridges fractal communities" |
| **Doc 224 (ZAO Stock)** | Media & Tech team member for ZAO Stock festival |
| **Doc 78 (Nouns Builder)** | Profiled as SwarthyHatter/SKTH — governance tools interest |
| **Optimism Fractal** | Honored as a builder |
| **ZAO Fractal** | Active participant bridging fractal networks |

### What's Missing

- No public website or portfolio found
- No GitHub profile found
- No LinkedIn profile found under these aliases
- Limited social media presence beyond Farcaster (@swarrthy) and Nouns Builder forum
- "SKTH" remains unresolved — could be a DAO, project, or personal abbreviation

---

## 4. DCoop / ZAOVille

### Identity

| Field | Detail |
|-------|--------|
| **Artist name** | DCoop |
| **WaveWarZ handle** | DCoopOfficial |
| **Location** | Falls Church, Virginia (DMV area — DC/Maryland/Virginia) |
| **X/Twitter** | [@DCoopOfficial](https://x.com/dcoopofficial) |
| **Facebook** | [facebook.com/DCoopOfficial](https://www.facebook.com/DCoopOfficial/) |
| **Genre** | Hip-hop / rap |
| **Description** | "Falls Church's favorite emcee" |

### DCoop as Artist

DCoop is a Virginia-based hip-hop artist from Falls Church, VA, active in both the traditional DMV music scene and the Web3 music space. He operates in the independent hip-hop lane, representing the DMV (DC/Maryland/Virginia) area.

The DMV hip-hop scene is a significant and growing force in American rap, with artists like Wale, Logic, Rico Nasty, IDK, Goldlink, and Ari Lennox having emerged from the region. DCoop operates in this ecosystem as an independent artist bridging traditional and on-chain music.

### WaveWarZ Battle History

DCoop is an active WaveWarZ artist. His wallet address is **not in the original 43-wallet list** that was mapped in Doc 101 — he may be a newer entrant to the platform.

**Notable battle:**

| Song | Opponent | Result | Volume |
|------|----------|--------|--------|
| Dark Ft Kata7yst | DCoopOfficial | LOSS (to Kata7yst, +96%) | **1.039 SOL** |

This was the **highest-volume recent battle** at the time of Doc 101's research (March 2026), at 1.04 SOL. It was part of Kata7yst's 6W-2L run in a single day (1.64 SOL total volume).

### Connection to Coop Records / Sonata

Doc 101 (WaveWarZ research) notes:

> "**DCoopOfficial** — Linked to Coop Records on Farcaster (onchain record label — github.com/Coop-Records/sonata)"

> "**DCoopOfficial -> Coop Records** is a notable connection — Coop Records runs **Sonata**, an open-source Farcaster music client (MIT license). This could be a Farcaster-native recruitment path."

**Important caveat:** This connection was noted as a research finding but was **not confirmed**. The name similarity (DCoop / Coop Records) drove the association. Coop Records is founded by **Cooper Turley (Coopahtroopa)**, a well-known Web3 music investor who has put 300 records onchain from ~100 artists, generating 130+ ETH in revenue from 250K mints. Sonata is Coop Records' Farcaster music client that aggregates all music shared on Farcaster.

**Whether DCoop the WaveWarZ artist is directly affiliated with Coop Records/Coopahtroopa, or if the name similarity is coincidental, remains unconfirmed.** DCoop is a DMV-based independent hip-hop artist; Cooper Turley operates a Web3 music label and investment fund at a different scale. They may simply share the "Coop" name.

### ZAOVille — The DMV ZAO Festival

| Field | Detail |
|-------|--------|
| **What** | A parallel ZAO festival event in the DMV (DC/Maryland/Virginia) area |
| **When** | July 2026 (planned) |
| **Where** | Virginia (specific venue TBD) |
| **Organizer** | DCoop |
| **Concept** | Multi-city ZAO festival model inspired by Afropunk (which runs festivals in multiple cities under one brand) |
| **Relationship** | ZAO Stock = Ellsworth, Maine (October 2026). ZAOVille = DMV area (July 2026). Same brand, two locations, two organizers |

**From Doc 224 (ZAO Stock Multi-Year Vision):**

> "ZAOVille — DCoop artist. Virginia-based. Running his own ZAO festival event in the DMV (Maryland/DC/Virginia area). Creates the **multi-city ZAO festival model** (Afropunk pattern). ZAO Stock = Ellsworth, ZAOVille event = DMV. Same brand, two locations."

DCoop's ZAO Stock role is **Performing Artist + Parallel Event Organizer** — he would both perform at ZAO Stock and coordinate the DMV satellite event (ZAOVille).

He is also listed as **production support** alongside AttaBotty for ZAO Stock staging.

### ZAO Ecosystem Timeline

| Date | Event |
|------|-------|
| 2023+ | DCoop active on WaveWarZ as DCoopOfficial |
| Mar 2026 | Featured in Doc 101 battle data (1.039 SOL battle vs Kata7yst) |
| Jul 2026 | **ZAOVille** planned (Virginia, organized by DCoop) |
| Oct 2026 | ZAO Stock planned (Maine) — DCoop as performer + production support |

### Social Media Presence

- **X/Twitter:** [@DCoopOfficial](https://x.com/dcoopofficial) — Bio references "DCoop in the DMV" with wolf, yin-yang, pirate flag, and WiFi emojis
- **Facebook:** [DCoopOfficial](https://www.facebook.com/DCoopOfficial/) — Music page
- **Farcaster:** Connection to Coop Records noted but unconfirmed
- **SoundCloud/Spotify:** Not confirmed through search (typical for independent DMV artists to have presence but with limited SEO)

### What's Missing

- No confirmed Farcaster profile found
- Coop Records / Coopahtroopa connection unconfirmed
- No confirmed SoundCloud, Spotify, or Apple Music profiles (may exist under different naming)
- ZAOVille venue, lineup, and logistics details not yet public
- WaveWarZ wallet address unknown (not in original 43-wallet mapping)

---

## Cross-Reference: How These Four Connect

```
ZAO Core
├── Candy (Co-Founder, ZID 2)
│   ├── WaveWarZ (all 16 GitHub repos)
│   ├── Student $LOANZ (creator)
│   ├── Impact3/Milk Road (sponsorship)
│   └── Web3 Academy (writer/operator)
│
├── Tyler / Magnetiq (ZABAL Connector)
│   ├── ETH Boulder POM (Feb 2026)
│   ├── ZAO Stock IRL tokens (Oct 2026)
│   └── Flow blockchain (cross-chain gap)
│
├── Swarthy Hatter (Fractal Bridge)
│   ├── Eden Fractal ←→ Optimism Fractal ←→ ZAO Fractal
│   ├── Nouns Builder (City Nouns, governance tools)
│   └── ZAO Stock media team
│
└── DCoop / ZAOVille (DMV Expansion)
    ├── WaveWarZ battles (DCoopOfficial)
    ├── ZAOVille (July 2026, Virginia)
    └── ZAO Stock performer + production
```

### ZAO Stock Festival Team Assignments

| Capability | Person | Status |
|-----------|--------|--------|
| IRL connection tokens | Tyler / Magnetiq | Confirmed |
| Design + print materials | Candy + DaNici | Confirmed |
| Media + documentation | Swarthy Hatter + Ohnahji + Maceo | Confirmed (3 people) |
| Performing artist | DCoop / ZAOVille + Hurric4n3Ike + roster | Confirmed |
| Production support | AttaBotty (lead) + DCoop (support) | Confirmed |
| Sponsorship outreach | Candy (Impact3/Milk Road connections) | Confirmed |

---

## Sources

### Tyler / Magnetiq
- [Tyler Stambaugh LinkedIn](https://www.linkedin.com/in/tyler-c-stambaugh-18020060/)
- [MAGNETIQ, Inc. LinkedIn](https://www.linkedin.com/company/magnetiq-xyz)
- [MAGNETIQ on Flowverse](https://www.flowverse.co/applications/magnetiq)
- [Flow Developer Grant #111](https://github.com/onflow/developer-grants/issues/111)
- [Kaylan Sliney Sessionize](https://sessionize.com/Kaylan-Sliney/)
- [Kaylan Sliney — Lyons Den Podcast](https://podcast.atlaslyons.com/2105867/episodes/12377318-ep7-kaylan-sliney-founder-ceo-gotham-labs-magnetiq)
- [Tyler Stambaugh — Web3 CMO Stories Podcast](https://webdrie.net/a-peek-into-blockchain-nfts-and-next-gen-marketing-with-tyler-stambaugh/)
- [Tyler Stambaugh Polywork](https://www.polywork.com/tyler_stambaugh)
- [Magnetiq Website](https://www.magnetiq.xyz/)

### Candy (Samantha Denton-Kinney)
- [CandyToyBox Devfolio](https://devfolio.co/@CandyToyBox)
- [Samantha Denton-Kinney Peerlist](https://peerlist.io/candytoybox)
- [CandyToyBox LinkedIn](https://www.linkedin.com/in/candytoybox/)
- [CandyToyBox Medium](https://medium.com/@CandyToyBox)
- [CandyToyBox GitHub (16 repos)](https://github.com/CandyToyBox)
- [Web3 Academy DAO Newsletter](https://web3adao.substack.com/)
- [Samantha Kinney ZoomInfo (Milk Road)](https://www.zoominfo.com/p/Samantha-Kinney/9877895135)
- [CandyToyBox TikTok](https://www.tiktok.com/@candytoybox)

### Swarthy Hatter
- [SwarthyHatter Nouns Builder Forum Post](https://forum.nouns.build/t/introduce-yourself/12/4)
- [Optimism Fractal Contributors](https://optimystics.io/blog/optimystic-articles/optimism-fractal-contributors/optimism-fractal-contributors)
- [Optimism Fractal Videos](https://optimismfractal.com/videos)
- [DanSingjoy.com (fractal founder)](https://dansingjoy.com/)

### DCoop / ZAOVille
- [DCoop on X/Twitter (@DCoopOfficial)](https://x.com/dcoopofficial)
- [DCoop Facebook](https://www.facebook.com/DCoopOfficial/)
- [Coop Records GitHub](https://github.com/Coop-Records)
- [Sonata (Coop Records Farcaster music client)](https://github.com/Coop-Records/sonata)
- [Coop Records Podcast — Music on Farcaster](https://pods.media/coop-records/music-on-farcaster-with-sonata)

### ZAO Internal Research
- [Doc 47 — ZAO Community Ecosystem](../../_archive/047-zao-community-ecosystem/)
- [Doc 48 — ZAO Ecosystem Deep Dive](../../_archive/048-zao-ecosystem-deep-dive/)
- [Doc 50 — The ZAO Complete Guide](../../community/050-the-zao-complete-guide/)
- [Doc 65 — ZABAL Partner Ecosystem](../../community/065-zabal-partner-ecosystem/)
- [Doc 78 — Nouns Builder Integration](../../_archive/078-nouns-builder-integration/)
- [Doc 101 — WaveWarZ + ZAO Whitepaper](../../wavewarz/101-wavewarz-zao-whitepaper/)
- [Doc 215 — ZAO Task Forces 2026](../../community/272-zao-task-forces-2026/)
- [Doc 224 — ZAO Stock Multi-Year Vision](../../_archive/224-zao-stock-multi-year-vision/)
