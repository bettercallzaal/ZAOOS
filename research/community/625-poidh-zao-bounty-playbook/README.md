---
topic: community
type: guide
status: research-complete
last-validated: 2026-05-09
related-docs: 468, 467, 423
tier: STANDARD
original-query: What operational templates and prize curves should ZAO use for POIDH bounties across all brands? (reconstructed)
---

# 625 - POIDH x ZAO Bounty Playbook (operational)

> **Goal:** 18 ready-to-post POIDH bounty templates across ZAO Stock, WaveWarZ, Fractal Mondays, COC Concertz, and BCZ personal. Includes prize curves, judging rules, NFT collectible naming, escalation paths. Built on top of doc 468's bot architecture - this is the OPERATIONS layer.

> **Counterpart:** doc 468 covers the bot/automation. This doc tells Zaal (or any ZAO operator) what to post, how much to fund, and how to judge - bot or no bot.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Default chain** | USE Base for 90% of ZAO bounties. Reasons: ZABAL token lives on Base; Coinbase Smart Wallet onboarding is frictionless; ZAO members already hold Base ETH. Reserve Degen Chain for music/culture-coded bounties (degen-native audience overlap). Skip Arbitrum unless a sponsor specifies it. |
| **Default bounty type** | USE solo bounties for ZAO-funded asks (Zaal escrows, Zaal accepts winner). Solo = no voting period, no contributor coordination overhead. SWITCH to open bounty only when raising a community-funded prize pool (e.g. WaveWarZ season prize, ZAO Stock attendance jackpot). |
| **Prize floor** | MIN 0.001 ETH on Base (~$2.50 at 2026 prices) per protocol minimum. PRACTICAL floor for ZAO is 0.005 ETH ($12-15) - below this, claim gas + cognitive cost > prize. Use 0.001-0.005 ETH only for puzzle/streak-style bounties where the NFT is the prize. |
| **Prize tiers** | TIER A (proof-of-attendance, low effort): 0.005-0.01 ETH. TIER B (creative output, photo+caption): 0.01-0.03 ETH. TIER C (production-quality, video/cover/recruit): 0.03-0.1 ETH. TIER D (campaign-grade, multi-step): 0.1-0.3 ETH or open-bounty pooled. |
| **Deadline shape** | DEFAULT 7-14 days. Weekly cadences (fractal Monday, WaveWarZ Sunday) get 7d. Event-tied bounties (ZAO Stock Oct 3) deadline = event date + 24h. Avoid "rolling forever" bounties - they accumulate stale claims and dilute the album. |
| **Judging cadence** | JUDGE within 48h of deadline. Late judging kills participation in next bounty. If 0 valid claims, DO NOT cancel - extend deadline once with a `reply` cast in /poidh, then if still nothing, cancel and refund. |
| **NFT naming convention** | USE `[ZAO Series Name] #[index]` format. Examples: "ZAO Stock Witness #001", "Fractal Solver #042", "WaveWarZ Battle Photog Season 1 #007". Series naming is the brand layer - bounty title = task; NFT = artifact. |
| **Channel posting** | POST every bounty to `/poidh` (where bounty hunters live) AND `/zao` (where ZAO members live) AND topic channel if applicable (`/wavewarz`, `/base`). Always tag `@thezao` so it lands in the album. |
| **Album discipline** | KEEP everything under `poidh.xyz/a/thezao`. Don't fragment across personal Zaal albums + ZAO album - the album becomes the ZAO bounty resume over time. New brand sub-albums (e.g. `/a/wavewarz`) only when sub-brand has 10+ bounties of own. |
| **Issuer wallet** | USE a dedicated ZAO Bounty Treasury EOA, not Zaal's personal wallet. Reasons: clean accounting; a single revocable signer; protocol enforces `msg.sender == tx.origin` so it MUST be EOA, not multisig. Fund from ZAO operating treasury monthly. |
| **Fee planning** | BUDGET 2.5% protocol fee on accepted bounties + 5% suggested NFT royalty on resales. On a 0.05 ETH bounty: claimant nets 0.04875 ETH, ZAO pays 0.00125 ETH to POIDH. Budget at 102.5% of intended prize. |
| **Fail mode for "no winners"** | If a bounty closes with submissions but none judged worthy: cancel + refund + post a `reply` cast explaining what was missing + relaunch with revised criteria. NEVER pick a weak winner just to clear the bounty - it sets the quality floor lower forever. |

---

## Part 1 - POIDH v3 Mechanics (Confirmed 2026-05-09)

### Two bounty types

| Type | Funder | Acceptance | Use for |
|------|--------|------------|---------|
| **Solo** | Single issuer escrows full prize at create | Issuer accepts winner directly, no vote | ZAO-funded operations bounties (90% of cases) |
| **Open** | Multiple contributors stack into shared escrow | Issuer picks winner -> contributor-weighted vote (>50% yes wins) | Community prize pools, season-long campaigns |

### Hard protocol rules

| Rule | Detail | Impact |
|------|--------|--------|
| EOA-only creation | Smart contract wallets (multisig, AA) revert with `ContractsCannotCreateBounties()` | Use a dedicated EOA, not Safe/Coinbase Smart Wallet |
| Min bounty | 0.001 ETH (Arbitrum/Base) or 1000 DEGEN (Degen) | Practical ZAO floor higher (0.005 ETH) for participation |
| Min contribution (open) | 0.00001 ETH or 10 DEGEN | Trivially low; contributors can dust-vote |
| Issuer cannot claim | `IssuerCannotClaim()` revert | ZAO Treasury wallet posts; Zaal personal wallet can claim |
| One on-chain winner | Single NFT transfer; manual bonus prizes off-chain | Run secondary prizes by sending ETH to claim wallet addresses |
| Protocol fee | 2.5% on accepted payouts (deducted at acceptance) | Budget 102.5% of intended prize |
| NFT royalty | 5% suggested on resales | ZAO album NFTs accrue secondary value passively |
| Voting (open only) | >50% of participating, weighted by contribution amount | Single whale contributor can dominate; design open bounties to spread contributions |
| Pull payments | Winners withdraw via `withdrawPayments()`; not auto-pushed | Tell winners to claim funds; don't assume they got the alert |

### Frame v2 distribution

POIDH ships as a Farcaster Mini App (`fc:frame` meta, `launch_frame` action, splash `#2a81d5`). Every bounty card embed in a cast renders as a tappable mini-app launcher. Means: every ZAO POIDH bounty cast = inline call-to-action; no off-Farcaster click-out friction.

---

## Part 2 - Bounty Templates (Ready-to-Post)

Each row = post once, fill `<placeholder>`, escrow, ship cast. All prizes in ETH on Base unless noted.

### A. ZAO Stock (annual flagship event, next: Oct 3 2026)

| # | Title | Task | Proof | Prize | Deadline | NFT Series |
|---|-------|------|-------|-------|----------|-----------|
| 1 | First-At-Stock | First photo of you on-site at ZAO Stock 2026 | Photo with Franklin St Parklet sign visible + timestamp | 0.02 ETH | Oct 3 + 24h | ZAO Stock Witness #1 (annual reset) |
| 2 | Recruiter | Bring a non-ZAO friend; both of you on-site | Group photo, non-member tagged in caption | 0.01 ETH per recruit (cap 5/person) | Oct 3 + 24h | ZAO Stock Recruiter #001-XXX |
| 3 | Stage Capture | Best stage shot during any set | Photo, performer ID'd in caption | 0.05 ETH (1 winner) | Oct 4 EOD | ZAO Stock Lens 2026 #001 |
| 4 | Cypher Witness | Capture an unscheduled cypher/freestyle | Video clip 10-30s, location ID | 0.03 ETH | Oct 4 EOD | ZAO Cypher Vault #044+ |
| 5 | Day-After Postcard | One photo + 1-paragraph reflection cast | Cast linked, photo attached | 0.005 ETH (top 10 picked) | Oct 10 | ZAO Stock Postcard #001-010 |

### B. WaveWarZ (Sunday battles, ongoing)

| # | Title | Task | Proof | Prize | Deadline | NFT Series |
|---|-------|------|-------|-------|----------|-----------|
| 6 | Battle Photog | Photo of any artist mid-verse at this Sunday's battle | Photo, artist tagged, watermark NOT allowed | 0.02 ETH | Sun + 7d | WaveWarZ Photog S1 #NNN |
| 7 | Hot Bar Capture | 10-20s clip of a "hot bar" moment | Video clip, bar transcribed in caption | 0.03 ETH (jury picks) | Sun + 7d | Hot Bar Vault #NNN |
| 8 | Crowd Reaction | Best crowd-reaction shot during a battle | Photo, no faces unblurred without consent | 0.015 ETH | Sun + 7d | WaveWarZ Crowd #NNN |
| 9 | Season Prize Pool | Best body of WaveWarZ documentation across the season (5+ bounties accepted) | Compilation cast linking all 5 NFT IDs | OPEN bounty, target 0.5 ETH community pool | Season end | WaveWarZ Season N Champion #1 |

### C. Fractal Monday (weekly governance, 6pm EST)

| # | Title | Task | Proof | Prize | Deadline | NFT Series |
|---|-------|------|-------|-------|----------|-----------|
| 10 | Fractal First-Timer | Show up to your first Fractal call | Screenshot mid-call (Zoom/100ms), member confirms | 0.005 ETH (one per person, lifetime) | Same week | Fractal Onboarder #NNN |
| 11 | Group Photo Rotator | Best Fractal end-of-call group screenshot | Screenshot, all visible faces consenting | 0.005 ETH (1 winner per Monday) | Tue 11pm EST | Fractal Witness Mondays #YYYYMMDD |
| 12 | Respect Story | Cast a 200+ char story explaining who you gave Respect to and why | Cast linked, includes recipient handle | 0.01 ETH (top 3 picked Wednesday) | Wed 8pm EST | Respect Storyteller #NNN |

### D. COC Concertz (concert promotion + virtual shows)

| # | Title | Task | Proof | Prize | Deadline | NFT Series |
|---|-------|------|-------|-------|----------|-----------|
| 13 | Show Witness | Photo at any COC-promoted show this month | Photo, venue name visible, COC promoter tagged | 0.015 ETH (cap 3 winners/show) | Show + 7d | COC Witness 2026-MM #NNN |
| 14 | Virtual Audience | Screenshot of you in a COC virtual show stream | Screenshot with stream timestamp | 0.005 ETH | Show + 48h | COC Stream Citizen #NNN |
| 15 | Promoter Recruit | Recruit a new promoter to COC network | Photo of intro meeting + new promoter cast intro | 0.05 ETH | 30d | COC Network Builder #NNN |

### E. BCZ Personal (Zaal's solo, distinct album)

| # | Title | Task | Proof | Prize | Deadline | NFT Series |
|---|-------|------|-------|-------|----------|-----------|
| 16 | BCZ Merch in the Wild | Wear any BCZ-branded item in public + cast it | Photo, BCZ logo readable | 0.005 ETH (rolling, 5/quarter) | Q-end | BCZ Street Citizen #NNN |
| 17 | Connect Sesh Witness | Document any IRL session Zaal hosts | Photo, location ID, attendees consent in caption | 0.01 ETH (1 per session) | Session + 14d | BCZ Connect Witness #NNN |
| 18 | YapZ Quote Card | Best clip-quote pulled from a BCZ YapZ episode | Quote card image + episode link + timestamp | 0.005 ETH (1/episode) | Ep + 7d | BCZ YapZ Quote #ep#-#NNN |

---

## Part 3 - Prize Curve Logic

Why these tiers? Three-factor model: **effort + scarcity + collectibility-of-NFT**.

| Factor | Low | Mid | High |
|--------|-----|-----|------|
| Effort | Show up + 1 photo | Photo + caption + cast | Production (video, edit, recruit) |
| Scarcity | Anyone can claim | Limited window or rare moment | Once-per-season or one-shot moment |
| NFT collectibility | Generic series filler | Themed series with growing index | Numbered champion / hero NFT |

Tier formula:
- TIER A (low/low/low): 0.005 ETH (~$12)
- TIER B (mid/mid/low): 0.015-0.025 ETH (~$35-60)
- TIER C (mid/mid/high): 0.03-0.05 ETH (~$70-120)
- TIER D (high/high/high): 0.1+ ETH or pooled open bounty

For ZAO with 188 members + ~3-5 active bounty hunters at any time, pricing too low (<0.005) gets ignored, too high (>0.1) gets one mediocre claim from someone gaming for the prize. Stay in 0.01-0.05 sweet spot for 80% of bounties.

---

## Part 4 - Judging Rules (No-Drama Edition)

### Default judging contract

Posted in every ZAO bounty description verbatim:

> Judging by @zaal (or designated ZAO judge per bounty). Criteria: (1) meets stated proof requirement, (2) earliest valid claim wins ties, (3) creative quality breaks non-tied judgement calls. Judging within 48h of deadline. If no valid claim, deadline extends once or bounty cancels with refund. POIDH album: poidh.xyz/a/thezao. Disputes: reply in cast thread; final call by issuer.

### When to escalate to open-bounty voting

ANY of:
- Prize > 0.1 ETH (community money should get community vote)
- Multiple ZAO sub-brands co-funding (WaveWarZ + COC pooled)
- Subjective judgement (best song, best vibe) where Zaal taste alone shouldn't decide

### Disqualifiers (always reject)

- Watermarked claims (signal of cross-platform spam farming)
- AI-generated images claiming to be photos of real events
- Submissions where required tag/sign/proof element was edited in post
- Submissions from the issuer's own wallet (protocol blocks but worth restating)
- Submissions to private events without subject consent

---

## Part 5 - NFT Collectible Strategy

### Series-tier framework

| Series tier | Purpose | Naming | Mint cadence |
|-------------|---------|--------|--------------|
| **Recurring witness** | Ambient ZAO documentation | `[Event] Witness #YYYYMMDD-NNN` | Weekly/per-show |
| **Onboarding badge** | Lifetime proof of "I was there first / new" | `[Event] First-Timer #NNN` | One per person ever |
| **Champion edition** | Top-of-pyramid, 1-3 per season | `[Series] Season N Champion #1` | Quarterly/annual |
| **Hero shot** | Once-in-a-lifetime moment captures | `[Specific Moment] One-of-One` | Ad hoc |

### Why this matters

POIDH NFTs accrue value via:
1. **Album density** - more bounties under `/a/thezao` = stronger collective brand
2. **Series consistency** - "WaveWarZ Photog" with 47 entries reads as a real archive; scattered one-offs read as noise
3. **Royalty stream** - 5% suggested resale royalty flows back to ZAO Treasury wallet over time (passive)

### Collection portal

Add `nexus.html` link: `bettercallzaal.com/nexus.html` -> "ZAO POIDH Album" -> `poidh.xyz/a/thezao`. Already in nexus per doc 584. Verify next nexus update.

---

## Part 6 - Posting Checklist (Per Bounty)

Pre-post:
- [ ] Treasury wallet has prize + 0.001 ETH gas + 2.5% buffer
- [ ] Bounty title <50 chars (Farcaster cast embed display limit)
- [ ] Description includes proof requirement, deadline, judging contract paste, NFT series name
- [ ] Confirmed solo vs open type (default solo)
- [ ] Confirmed chain (default Base)

Post-create:
- [ ] Cast in `/poidh` channel with bounty embed
- [ ] Cross-cast in `/zao` + topic channel (`/wavewarz`, `/base`, etc.)
- [ ] Tag `@thezao` so it lands in the album
- [ ] Add to internal tracker (`bounties.csv` in ZAO ops repo - TBD)

Post-deadline:
- [ ] Judge within 48h
- [ ] Accept winner via `acceptClaim` (solo) or `submitClaimForVote` (open with contributors)
- [ ] Reply-cast announcing winner with claim NFT link
- [ ] Send manual bonus prizes if any (off-chain ETH transfer to claim wallet)
- [ ] Post a `[BOUNTY CLOSED]` reply in original cast thread

---

## Part 7 - Operational Costs (Monthly Budget)

Assuming a steady-state 6 ZAO bounties/month at avg 0.025 ETH each:

| Line item | Amount | Notes |
|-----------|--------|-------|
| Bounty escrow (6 x 0.025 ETH) | 0.15 ETH (~$370) | Goes to winners, not lost |
| Protocol fees (2.5% of accepted) | 0.00375 ETH (~$9) | To POIDH |
| Gas (create + accept = 2 tx/bounty) | 0.0006 ETH (~$1.50) | Base is cheap |
| Manual bonus prizes (assume 30% of bounties) | ~0.01 ETH (~$25) | Off-chain bonuses |
| **Total burn rate** | ~$405/mo | All-in |

For 12 bounties/month (aggressive cadence), double everything = ~$810/mo. Compare to: a single $500 ad spend on Warpcast/X for community-engagement equivalent = comparable cost, but POIDH bounties produce permanent NFT artifacts + deeper engagement than ad clicks.

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| POIDH chains | 3 (Arbitrum, Base, Degen) |
| Recommended ZAO chain | Base (90%), Degen (10%, music-coded) |
| Min bounty (Base/Arb) | 0.001 ETH |
| Min bounty (Degen) | 1000 DEGEN |
| Min contribution (open, Base/Arb) | 0.00001 ETH |
| Min contribution (open, Degen) | 10 DEGEN |
| Practical ZAO prize floor | 0.005 ETH (~$12) |
| Practical ZAO prize ceiling (solo) | 0.1 ETH (~$240) |
| Protocol fee | 2.5% on accepted |
| NFT royalty (suggested) | 5% on resales |
| Open bounty vote threshold | >50% participating, weighted by contribution |
| Voting deadline (default) | Issuer-set when submitting claim for vote |
| Recommended bounty deadline | 7-14 days |
| Recommended judging turnaround | <48h post-deadline |
| Issuer wallet constraint | EOA only (no smart contract wallets) |
| Templates in this doc | 18 |
| ZAO event surfaces covered | 5 (ZAO Stock, WaveWarZ, Fractal, COC, BCZ personal) |
| Steady-state monthly cost (6 bounties) | ~$405 |
| Aggressive monthly cost (12 bounties) | ~$810 |
| ZAO POIDH album URL | poidh.xyz/a/thezao |

---

## Comparison: POIDH vs Bountycaster

| Dimension | POIDH | Bountycaster |
|-----------|-------|--------------|
| **Funding model** | On-chain escrow (smart contract) | Off-chain, peer-to-peer payment |
| **Trust** | Trustless escrow + protocol fee guarantees payout | Honor system, issuer can ghost |
| **NFT artifact** | Yes, claim NFT minted to issuer | None |
| **Min prize** | 0.001 ETH protocol-enforced | "Negotiable" or any amount |
| **Mini App** | Yes, Frame v2 with `launch_frame` | No native frame, web-only |
| **Discoverability** | `/poidh` channel + albums | `@bountybot` indexed casts |
| **Album / brand layer** | YES - `/a/thezao` is permanent collection | No |
| **For ZAO** | **PRIMARY** - escrow + NFT + album = brand asset | SECONDARY - good for one-off code/research bounties without on-chain art |

ZAO uses POIDH for the 90% of bounties where the photo/artifact IS the product. Bountycaster slots in for "find me a bug in this contract" or "write me a research summary" where there's no visual proof and trust is bilateral.

---

## ZAO Ecosystem Integration

Surface this doc when:
- Drafting new bounty in ZOE or `/poidh-bot` (doc 468)
- Updating `bettercallzaal.com/nexus.html` POIDH section
- ZAO Stock Oct 3 prep (templates 1-5 directly applicable)
- Onboarding new ZAO operator who'll run bounties

Codebase touchpoints:
- `community.config.ts` - already references POIDH album URL implicitly (verify on next config refresh)
- `bots/poidh/` - per doc 468 build spec; this doc's templates feed `bots/poidh/bounty-generator.mjs` system prompt
- `nexus.html` - link to `poidh.xyz/a/thezao` (already present per doc 584)

---

## Sources

- [POIDH home (live 2026-05-09)](https://poidh.xyz) - confirmed active, Frame v2 splash `#2a81d5`
- [POIDH v3 docs](https://docs.poidh.xyz) - solo + open + weighted voting + pull payments architecture
- [POIDH SKILL.md (poidh-app prod)](https://github.com/picsoritdidnthappen/poidh-app/blob/prod/SKILL.md) - cast commands, min amounts, error map
- [POIDH beginner's guide (Aug 2024)](https://words.poidh.xyz/poidh-beginner-guide) - 2.5% fee + 5% royalty + one-winner rule
- [POIDH open bounties explainer (May 2024)](https://words.poidh.xyz/poidh-open-multiplayer-bounties-explained) - >50% weighted voting
- [POIDH v3 architecture page](https://docs.poidh.xyz/architecture.html) - Bounty Manager + Claim Manager + Voting Engine + Pull Payment + NFT Escrow
- [POIDH state machines](https://docs.poidh.xyz/state-machines.html) - Active -> Claimed -> Voting -> Accepted/Rejected
- [Bountycaster](https://bountycaster.xyz) - alternative for non-NFT bounties, off-chain trust
- [POIDH on Ethereum.org Apps](https://ethereum.org/apps/poidh/) - third-party validation
- [POIDH "Freecash alternative" Nov 2025](https://words.poidh.xyz/poidh-seamless-freecash-alternative) - latest dated content from POIDH team
- ZAO internal: `community.config.ts` (wavewarz channel, fractal-call Mon 6pm EST), doc 468 (bot build spec), doc 467 (Telegram hub plan), doc 584 (nexus link inventory)

Verified URLs 2026-05-09: poidh.xyz HTTP 200, docs.poidh.xyz HTTP 200, github.com/picsoritdidnthappen/poidh-app accessible, words.poidh.xyz accessible, ethereum.org/apps/poidh HTTP 200.

---

## Also See

- [Doc 468 - ZAO Farcaster Hub: POIDH bot, HyperSub bot, dual-hub design](../../agents/468-zao-farcaster-hub-poidh-hypersub-dual-hub/) - bot/automation layer; this doc 625 is the operations/playbook layer
- [Doc 467 - Telegram hub fleet design](../../agents/467-telegram-hub-fleet-design/) - cross-hub plumbing
- [Doc 423 - Music x Crypto Connect Sesh Apr 17](../../events/423-music-x-crypto-connect-sesh-apr17/) - IRL event template that POIDH bounties can layer onto

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set up dedicated ZAO Bounty Treasury EOA + fund 0.5 ETH on Base | @Zaal | Wallet ops | Before next bounty |
| Add 18 templates to `bots/poidh/bounty-generator.mjs` system prompt seed | @Zaal | PR (post doc 468 Week 4 build) | Week 4 of bot rollout |
| Add `bounties.csv` tracker to ZAO ops repo (date, title, prize, claims, winner, NFT id) | @Zaal | New file | Before bounty #6 |
| Pin this doc URL in `/poidh` channel description and ZAO operator handbook | @Zaal | Channel ops | Week of 2026-05-12 |
| Run templates 1-5 (ZAO Stock series) starting 30 days pre-event | @Zaal | Bounty drops | 2026-09-03 |
| Templates 10-12 (Fractal series) - launch on next Fractal Monday post-doc | @Zaal | Bounty drops | 2026-05-11 (next Mon) |
| Re-validate prize tiers vs ETH price in 30 days | @Zaal | Doc update | 2026-06-09 |
| Confirm `@thezao` POIDH album = same wallet as ZAO Bounty Treasury (so NFTs land in right album) | @Zaal | Verify | Before next bounty |
