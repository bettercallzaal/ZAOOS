---
topic: farcaster
type: market-research
status: draft
last-validated: 2026-04-30
related-docs: 472, 567, 568
tier: STANDARD
---

# 571 - Intori SCIS + Tuum Tech: Donald Bullers Meeting Prep

> **Goal:** Pre-meeting brief for Zaal's call with Donald Bullers (@db, FID 897), founder of Tuum Tech / intori. SCIS announcement Apr 17 2026 is the trigger; transcript will arrive after the meeting and this doc gets a v2.
>
> **Status:** DRAFT pending transcript. Locks recommendations once meeting notes ingested.

## Key Decisions (read first)

| # | Decision | Rationale |
|---|---|---|
| 1 | **Build a "ZAO Circle" inside intori as Q1 partnership wedge** | intori's Circles are pre-built identity spaces. ZAO = natural fit (music + web3 + creativity). 17K verified-human users >> 188 ZAO members. Distribution. |
| 2 | **Pitch ZAOstock Oct 3 Stamp issuance** | Stamps = "proof of participation in real communities." A ZAOstock-branded stamp earned by IRL attendees is the cleanest co-marketing artifact. |
| 3 | **Treat stamps as parallel to ZOLs/ZABAL points, not replacement** | Not yet onchain (per public docs). Use intori for *Farcaster discovery layer*, keep ZOLs/ZABAL for ZAO-internal contribution accounting. Revisit if intori tokenizes. |
| 4 | **Ask DB about Packs API / community-issued Circles before pitching** | If Packs are intori-only-curated, partnership is shallow co-marketing. If community-creatable, deep integration possible (ZAO Pack, COC Concertz Pack, WaveWarZ Pack). |
| 5 | **Co-brand on World App distribution** | ZAO has zero World App presence. intori is live there. Cheapest way to reach the verified-human channel. |
| 6 | **Park: tokenization, NFT-stamps, DID rails** | DB hints "value... soon" but nothing shipped. Don't build assumptions on unshipped. |

## What SCIS Actually Is

| Field | Value |
|---|---|
| Acronym | **Structured Conversational Inventory System** |
| Confirmed by | Apr 17 2026 announcement post `intori.co/news/introducing-scis` |
| Role | The internal *engine* that converts Pack answers into structured signals; NOT the user-facing app name |
| User-facing name | **intori** (= "Inter-Origins" per privacy policy) |
| Pipeline | `question -> answer -> topic -> signal -> progress` |
| Status | Live (powering Packs/Stamps shipped Mar 24 2026) |
| On-chain? | Not visible in public docs. Stamps appear to be DB records as of Apr 2026. DB hints: "what you earn... will carry more weight, more context, more value." |

### The 4-concept user model

| Primitive | What | Example |
|---|---|---|
| **Pack** | Short sequence of questions on one theme; 1 free daily, more available on top | "Creativity Pack", "Connection Pack", "Personal Growth Pack" |
| **Stamp** | Participation artifact earned per Pack open; multiple stampable per theme (rarity + accumulation) | "Music Lover", "Creator", "Foodie" |
| **Circle** | Shared identity space populated by users with matching stamps | Creativity, Ambition, Wellness, Nightlife, Pets, Tech |
| **Chemistry / Vibes** | Computed match metrics (% alignment + presence energy) | "78% chemistry, chill-builder vibe" |

### Architecture timeline (product pivots)

| Date | Pivot | Why |
|---|---|---|
| 2024 ("onchain summer") | Launched as Farcaster Frame for follow + channel suggestions | Distribution wedge into FC user base |
| ~2025 | Pivot from "gifts" to "stamps" | "reduce UX complexity and support scalable social graph growth" - LinkedIn |
| 2025 | Adopted Frames v2 at launch | Early-mover advantage on richer FC interactions |
| 2026-03-24 | Packs system shipped | Move from single daily theme to multi-context identity |
| 2026-04-17 | SCIS framing published | Brand the engine; signal partnerships/devtools coming |

## Donald Bullers Profile

| Field | Value |
|---|---|
| Handles | FC @db (FID 897), X @donaldbullers, LinkedIn /in/donaldbullers, web donaldbullers.com |
| Title | Founder & CEO, Tuum Technologies + Founder Product Lead, intori |
| FC OG status | FID 897 = sub-10K = "verified priority + engagement boosts" tier (per Farcaster News Feb 2026) |
| Followers | 6,511 on Farcaster (per web3.bio) |
| Crypto-native since | 2017 |
| Standards bodies | W3C, DIF (Decentralized Identity Foundation) - direct contributor |
| Ecosystem partners | ConsenSys/MetaMask, World Foundation, Hedera Hashgraph |
| Prior shipped | MetaMask Snaps, web wallets, decentralized identity authentication, social discovery systems |
| Education | B.S.B.A. Finance, Cum Laude (2006-2008) |
| Pre-Tuum | 10+ yrs tech leadership; digital marketing -> VP -> Founder track |

### Tuum Tech background

- Founded ~2019 (GitHub org created 2019-11-20)
- Originally **Elastos**-focused: "the world's leading Elastos software company" (DailyCoin 2021)
- Pivoted toward Farcaster/Base/World over 2024-2026
- 19 public repos. Notable: `decentralized-socialhub` (TS, 9 stars), `identify` (TS, 8 stars), `getDIDs.com`
- Current focus per LinkedIn: "decentralized identity, wallet, and social discovery infrastructure"

### DB's worldview (key quotes)

> "We are entering an era where synthetic output will vastly outnumber human signal. The danger isn't misinformation alone, it's meaning dilution." - blog 2026-01-07

> "Identity shouldn't be a single profile you set once. It should be something you maintain, refine, and expand through consistent participation." - SCIS post

> "These applications that we're building using blockchain technology, we want to make them in a way where you don't even know that you're using blockchain technology." - DailyCoin 2021

**Read:** anti-bot, pro-real-people, identity-as-process, abstract-the-chain. Aligns with The ZAO master positioning (project_zao_master_context: music first, community second, tech third) and feedback_no_unauthorized_commitments (real participation > gamified rewards).

## Traction Stats

| Metric | Value | As of |
|---|---|---|
| Accounts onboarded | 17,000+ | LinkedIn current |
| Questions answered | 1,200,000+ | LinkedIn current |
| FC followers (intori account) | 6,511 | web3.bio current |
| Live distribution | World App, Base App, Farcaster | 2026-04 |
| Daily active pattern | "answer up to 6 questions/day, new questions every 24h" | per @db casts |
| AI agent | Live inside Base App + FC clients (model not disclosed) | per LinkedIn |
| World Foundation partnership | Active - "interoperable messaging + onboard verified human users" | per LinkedIn |

**For comparison:** ZAO Farcaster channel = 188 members. Farcaster total = 650K registered, 307K with quality score >=0.6 (Nov 2025). intori already touched ~5.5% of high-quality FC.

## ZAO Ecosystem Angles

### A. Distribution wedges

| Wedge | Effort | Payoff |
|---|---|---|
| Pre-answer ZAO members onto a "ZAO Pack" so they bootstrap intori discovery | Low (if Packs are open) | Each ZAO member gets surfaced to non-ZAO intori users sharing chemistry; recruitment funnel |
| World App entry via co-promotion | Medium (need a hook) | First ZAO presence on World App; verified-human user pool |
| FC @db cross-cast on ZAO milestones | Free | DB has 6.5K FC followers; cheap distribution |

### B. Product overlaps to align (not duplicate)

| ZAO primitive | intori parallel | Decision |
|---|---|---|
| ZOLs (contribution credits) | Stamps (participation proof) | KEEP both; ZOLs internal accounting, stamps external discovery |
| ZAOfestivals Points | Stamps tied to Circles | If branded ZAO Circle exists, MAP one-to-one; else keep separate |
| ZID (future identity layer per project_future_repos) | intori as identity hub | INVESTIGATE if Tuum DID infra is reusable; DB already shipped W3C-DIF stack |
| ZAO branded Circle (if community Circles open) | intori Circles | PITCH this in meeting |

### C. Event hook: ZAOstock Oct 3 2026

- Concrete: a ZAOstock-themed Pack opens Oct 3-10, IRL attendees earn a rarity-tier stamp.
- Dependency: needs Packs API or DB-side curation slot.
- Upside: first IRL-anchored stamp inside intori; case study for both sides.
- See also: project_zao_stock_confirmed.md, project_zaostock_master_strategy.md (Cassie 4/28: festival-as-proof, infrastructure-as-product).

### D. AI agent overlap

- intori has a feed-integrated AI agent live in Base App + FC clients.
- ZAO has ZOE (concierge agent), Hermes (PR pipeline bot), and the bot fleet plan (project_tomorrow_first_tasks).
- ASK: does intori expose its agent for white-label, or is it intori-internal?

### E. Brand-bot fleet alignment

Pattern from project_research_562_563: "Shann3 Ronin pattern (17 markdown + 1 agent = 10 accounts)". intori's AI agent + Pack curation would fit a "ZAO branded interview bot" inside the FC frame. Not a build-now item.

## Pre-Meeting Question List for DB

### Must-ask (architecture)

1. Is the SCIS engine + Packs API exposed for partners, or intori-curated only?
2. Are stamps onchain (NFT / SBT) or DB rows? Roadmap to onchain?
3. How does identity "travel" across World/Base/Farcaster — cryptographic proof or DB sync?
4. Can communities create branded Packs and Circles? Curation gate?
5. What's the AI agent - Claude/OpenAI/custom? Available for white-label?

### Must-ask (business)

6. Revenue model? Is intori free forever, or freemium incoming?
7. Token plans? Saw "value" hint in Packs post; what's the path?
8. World Foundation partnership - exclusive on World, or other identity partners welcome?
9. What does a "deep integration" partner relationship look like to you?
10. What does "small partnership" look like? (low-effort first step)

### Must-ask (overlap with ZAO)

11. Have you looked at music-community focused Circles? ZAO is music-first.
12. Open to IRL-event stamp issuance (ZAOstock Oct 3)?
13. Are you sourcing Pack questions from partners, or all in-house?
14. Anti-bot / sybil resistance approach - World ID, Talent Passport, Neynar score?

### Nice-to-ask (network)

15. How is the World Foundation collab going? What's working?
16. Tuum's history with W3C / DIF - any reusable identity primitives ZAO could adopt?
17. Frames v2 lessons learned - anything ZAO should know before building deeper?

## Risks + Dissent Flags

| Risk | Severity | Notes |
|---|---|---|
| **Architecture is opaque** in public docs - on-chain vs off-chain unclear | MED | Don't pitch deep integration without confirming primitives |
| **Stamps are off-chain** likely | MED | If true, ZAO can't lean on intori for credible-neutral attestations |
| **intori brand evolved 3+ times** in 18 months (Frames v1 -> stamps -> Packs -> SCIS) | LOW-MED | DB iterates fast; partnership timeline could shift mid-build |
| **Tuum's Elastos pivot** suggests willingness to abandon stacks | LOW | Net positive (rational), but factor into multi-year bets |
| **17K accounts != 17K weekly actives** | MED | Ask DB for WAU/DAU numbers in meeting; don't assume scale |
| **No public competitors mentioned** by intori | LOW | Could mean dominant or could mean small TAM. Doc 472 watchlist was P3 for a reason |

## Open Questions (block until transcript)

- What did Zaal want from the meeting? (intro, partnership, product feedback, fundraising?)
- Did DB pitch a specific ask?
- Any verbal commitments either side made?
- Did stamps' onchain status get answered?
- Did Packs API get answered?

## Also See

- [Doc 472](../../dev-workflows/472-ai-tooling-roundup-apr21/) - prior watchlist note (Intori as P3, "re-evaluate ~2026-07-21"). This doc effectively supersedes that line.
- [Doc 567](../../dev-workflows/567-claude-skills-1116-ecosystem-zao-picks/) (note: dupe number in repo, see `project_research_roadmap_apr29` memory)
- [Doc 568](../../agents/568-aware-brain-local-kg-chat-memory-stack/) - Aware Brain stack; intori's structured-signal approach is conceptually similar to KG ingestion
- project_future_repos.md memory - ZID architecture decision
- project_zao_master_context.md - The ZAO positioning Tricky Buddha space
- project_zao_stock_confirmed.md - ZAOstock Oct 3 venue lock
- project_zaostock_master_strategy.md - Cassie debrief, festival-as-proof

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run meeting with DB | Zaal | Meeting | TODAY 2026-04-30 |
| Send transcript to this session for v2 update | Zaal | Handoff | Post-meeting |
| Update doc 571 status from `draft` to `research-complete` after transcript | Claude | Doc edit | T+1 day |
| If Packs API exists: spike a "ZAO Pack" prototype | Zaal/Quad | Build | T+2 weeks |
| Add intori cross-link to community.config.ts if partnership formed | Zaal | PR | Post-decision |
| If ZAOstock stamp lands: draft co-promo Farcaster + X posts | Claude | Content | Sept 2026 |
| If stamps go onchain: revisit ZID / ZOLs alignment | Zaal | Decision | When intori announces |
| Re-validate this doc | Claude | Doc | 2026-05-30 (30-day SLA) |

## Sources

- [Intori - Introducing SCIS (2026-04-17)](https://www.intori.co/news/introducing-scis)
- [Intori - Build Your Identity One Pack at a Time (2026-03-24)](https://www.intori.co/news/packs-build-your-identity)
- [Intori homepage](https://www.intori.co/)
- [Intori privacy policy - Inter-Origins definition](https://www.intori.co/privacy-policy)
- [Donald Bullers about page](https://www.donaldbullers.com/about/)
- [Donald Bullers blog - Fork in the Road (2026-01-07)](https://www.donaldbullers.com/fork-in-the-road/)
- [Donald Bullers Farcaster @db](https://warpcast.com/db)
- [Donald Bullers LinkedIn](https://www.linkedin.com/in/donaldbullers)
- [Donald Bullers - Finnotes profile](https://finnotes.org/people/donald-bullers)
- [DailyCoin interview (2021-08-20) - Tuum Elastos era](https://dailycoin.com/empowering-individuals-in-the-web-3-0-era-a-tuum-technology-approach)
- [Intori - Web3.bio profile, follower count](https://web3.bio/intori.farcaster)
- [Intori - World App listing](https://world.org/mini-app?app_id=app_263f86463869627f1183badc977e21a3)
- [Tuum Technologies GitHub org](https://github.com/tuum-tech)
- [Farcaster News - 307K quality users (2025-11-30)](http://farcasternews.com/2025/11/30/farcaster-reaches-307k-high-quality-users-with-neynar-scores-growth-metrics-explained-2025/)
- [Farcaster News - FID under 10K priority (2026-02-20)](http://farcasternews.com/2026/02/20/farcaster-fid-under-10k-why-og-users-get-verified-priority-and-engagement-boosts/)
- [Farcaster Protocol - Permissionless Onboarding FIP](https://github.com/farcasterxyz/protocol/discussions/91)
- [Farcaster docs - Create an account](https://docs.farcaster.xyz/developers/guides/accounts/create-account)

URLs verified live 2026-04-30 via exa fetch + web search. No 404s detected. donaldbullers.com sub-pages live; warpcast.com/db live.
