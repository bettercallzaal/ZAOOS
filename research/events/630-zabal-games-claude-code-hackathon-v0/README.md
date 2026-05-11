---
topic: events
type: guide
status: draft
last-validated: 2026-05-10
related-docs: 627, 628, 629, 626, 625, 361, 324, 322, 354, 311
tier: STANDARD
---

# 630 - ZABAL Games v0: Farcaster Vibe-Coding Challenge (8 Players, 24h Build + 24h Promote)

> **Goal:** Define the inaugural ZABAL Games - a **Farcaster vibe-coding challenge** for **8 Farcaster digital creators** (devs, designers, writers, video editors, musicians, streamers, podcasters - anyone who already ships in public). Every participant gets the same prompt at the same time, builds in public for 24 hours using **whatever vibe-coding harness they prefer** (Claude Code, Cursor, Windsurf, Aider, Cline, Bolt, v0, Lovable, etc.), then promotes for 24 hours. **Required:** show your work via at least one primary visibility mode + ongoing casts. Top 3 take a tiered share of a **$500 USDC pool**. All finishers receive a **participation collectible**. Winners chosen by **ZABAL token holders voting onchain** - no human panel. The Games dogfood the ZAO streaming flywheel (Doc 629) and Web3 streaming bridge (Doc 628), put 8 new ecosystem-aligned builds on the leaderboard, and most importantly **give 8 Farcaster creators a distribution boost they couldn't get alone**.

> **Tooling philosophy (revised 2026-05-11):** Tool-agnostic + visibility-mandatory. We don't lock players into Claude Code. We DO require they show their work - because the build-in-public spectacle IS the format. 4 visibility modes available (live Twitch stream, recorded screen sessions, public AI prompt logs, frequent build casts). Pick at least one primary mode plus ongoing /zabalgames casts. Vibe-coding subsidy reframed: ZAO covers up to $20/mo for the tool of your choice if cost is a blocker.

> **Positioning (revised 2026-05-10):** This is NOT a generic hackathon. It's a Farcaster-native challenge built on a win-win-win premise: **players get distribution + cash + portfolio**, **ZAO gets builders + content engine fuel**, **ZABAL holders get voting power + drama to watch**. Every prompt option ties to ZAO ecosystem rails so whatever ships becomes real infra.

> **Status:** DRAFT - Zaal locked in format (24h+24h), prize ($500 USDC tiered top-heavy + participation collectible only), tool-agnostic + visibility mandatory, $20 tooling subsidy, ZABAL-holder onchain voting (no human judge panel), prompt scope (3-5 ideas), and timing (late June 2026) on 2026-05-09 + revised 2026-05-10 + 2026-05-11. Open: idea-option finalization, application form copy, voting mechanism (snapshot weighted vs 1-token-1-vote vs quadratic), participation-collectible spec.

> **Prize philosophy (revised 2026-05-10):** Tiered top-heavy USDC + collectible for everyone who ships. No promised auxiliary perks (no slot guarantees, no Empire Booster guarantees, no extra ZABAL bag promised upfront). The collectible is the only thing every finisher receives beyond the cash. Real prize for the field = the experience + the open-source GitHub repo + the Hall of Fame entry. Any extra perks that emerge organically (a sponsor adds something, COC happens to invite a winner to perform, Empire Builder happens to mint a booster) are upside, not commitments.

> **Judging philosophy (revised 2026-05-10):** ZABAL holders are the judges. The community owns the outcome. No closed human panel - the whole vote is onchain via ZABAL token weight. Aligns the people deciding "best build" with the people whose token economy benefits from those builds. Mechanism choice (snapshot weighted by holdings, 1-token-1-vote, or quadratic) still open.

---

## How to Read This Doc

This is the working spec for ZABAL Games v0 (the inaugural run). It is meant to be:
1. **A pitch** - read Parts 0 + 1 + 6 to grok the idea in 5 minutes
2. **An implementation plan** - Parts 3 through 9 cover format, infra, runbook, and risks
3. **A discussion document** - Open Calls + Strategic Considerations sections invite input

Sections marked DRAFT or "needs Zaal input" are still in flux. Everything in the **Key Decisions** table is locked.

---

## Part 0 - TL;DR (60 seconds)

**What:** A Farcaster vibe-coding challenge. **8 Farcaster digital creators** (devs, designers, writers, video editors, musicians, streamers, podcasters - anyone shipping in public). Use **whatever vibe-coding harness you prefer** (Claude Code, Cursor, Windsurf, Aider, Bolt, v0, Lovable - your call). The constraint isn't the tool, it's **show your work in public**. Same prompt drops to all 8 simultaneously. 24 hours to build, 24 hours to promote. ZAO is the playground + the distribution boost.

**Who it's for:** Active Farcasters who already ship in public and want a focused weekend to build something real with vibe-coding tools while ZAO accounts amplify their work. You don't need to be a senior engineer - modern AI coding harnesses close a lot of skill gaps. You DO need to be comfortable building in public via one of 4 visibility modes (Twitch stream / recorded screen sessions / public prompt logs / frequent build casts).

**When:** 2026-06-27 Sat 12:00 PT to 2026-06-29 Mon 12:00 PT (build + promote). Voting 2026-06-29 to 2026-06-30. Results-reveal stream 2026-06-30.

**What players get:** Top 3 take a tiered share of a $500 USDC pool (1st $250 / 2nd $150 / 3rd $100). All finishers (1st through Nth) receive a participation collectible. Accepted players who need help affording their vibe-coding tool of choice (Claude Pro, Cursor Pro, Windsurf Pro, etc.) get up to $20/mo covered by ZAO.

**Who decides the winners:** ZABAL token holders. Onchain vote weighted by holdings. The community whose ecosystem the builds plug into picks which builds win - no human judge panel.

**What ZAO gets:** 8 new builders shipping into ZAO ecosystem rails simultaneously. 48 hours of live build content fed into the streaming flywheel (Doc 629). Real-world stress test of Empire Builder v3 + Coinflow + Hypersub + EAS at scale. Public proof that ZAO is *the* place builders go to ship in public.

**What it costs ZAO:** ~$685 max ($500 USDC pool + $160 tooling subsidy reserve + ~$25 gas/collectible mints). Sub-$1k for 8 new ecosystem-aligned builds and ~30 cross-platform pieces of content.

---

## Part 1 - Why ZABAL Games (Win-Win-Win)

**This is a Farcaster vibe-coding challenge, not a generic hackathon.** The target audience is 8 active Farcaster digital creators - devs, designers, writers, video editors, musicians, streamers, podcasters - anyone who already ships in public and wants a focused weekend to build something real with vibe-coding tools (their choice) while ZAO accounts amplify their work.

The format is structured around three reinforcing wins:

| Stakeholder | What they get out of the weekend |
|-------------|----------------------------------|
| **The 8 Farcaster creators** | Distribution boost (ZAO accounts amplify all 8 streams + casts), $50-$250 USDC if top 3, participation collectible (permanent onchain), GitHub repo as portfolio piece, 24h Claude Code live-coding footage to repurpose forever, audience growth even if you don't place |
| **The ZAO ecosystem** | 8 new ecosystem-aligned builds shipped in 48 hours, 8 new active builders engaged with rails (Empire, Farcaster, Hats, Bonfire, EAS, Coinflow), 30+ hours of live build content -> 150+ short clips via Doc 629 streaming flywheel, brand position as "ZAO is where Farcaster builders ship in public" |
| **ZABAL holders + viewers** | Onchain vote that decides outcomes (real token utility), 24h of multi-stream build drama, tippers earn ZABAL via Doc 628 stream-leaderboard rails, voting itself becomes a community engagement event |

If any one of these three wins doesn't land, the format is broken. The detailed stakeholder breakdown below extends each.

---

### Detailed Stakeholder Benefits

### For ZAO Ecosystem

| Benefit | Why it matters |
|---------|---------------|
| 8 new ecosystem-aligned builds in 48 hours | Every prompt option ties to existing rails (Empire, Farcaster, Hats, Bonfire, EAS, Hypersub, Coinflow). Whatever ships becomes ZAO infra |
| 8 new active builders on Empire Builder leaderboard | Each player's wallet ends the weekend with ZABAL + booster eligibility - real users, not just airdrop dust |
| Brand narrative: "ZAO is where builders ship in public" | Differentiates from gating-focused web3 communities. Position as production-output community |
| Reusable annual format | Participation collectible v0 implies v1, v2... = recurring tradition, recurring narrative reset |
| Content engine validation | Doc 629 streaming flywheel processes 8 simultaneous build streams - if it works here, it works for COC + BCZ scale |

### For ZABAL Token

| Benefit | Why it matters |
|---------|---------------|
| ZABAL holders become judges = direct token utility | Voting onchain is a real, ongoing token use case beyond holding/trading |
| Engagement event for the holder community | Voting drives chat, debate, attention - the token becomes a community-action artifact, not just a price chart |
| Story attached to each Games | Each Games has a winner the community PICKED - organic distribution narrative |
| Booster system gets real-world test under 8-stream load | Validates Empire Builder v3 apiLeaderboards at production volume |
| Voter-engagement spike | A scheduled ZABAL-required activity makes holding ZABAL feel actively useful, not passive |

### For Empire Builder (Adrian + yerbearserker)

| Benefit | Why it matters |
|---------|---------------|
| 8-stream apiLeaderboard stress test | Real production load on v3 endpoints |
| Empire Builder featured in player builds | Option B (stream leaderboard feed) is literally an Empire Builder integration build - free dev work |
| Cross-amplification | Adrian + yerbearserker can amplify Games + their voices add credibility - no obligation to judge or commit Booster IDs |
| Optional post-Games partnership | If a winner's build is excellent, Empire Builder team may organically want to feature it / mint a custom booster - but that's their call, not a ZAO promise |

### For COC Concertz

| Benefit | Why it matters |
|---------|---------------|
| Game itself becomes a COC content episode | "ZABAL Games Live" coverage stream feeds COC YouTube + Farcaster |
| Validates concert-streaming pipeline at peak load | If COC infra handles 8 simultaneous restreams, it handles any concert |
| Optional winner spotlight | If a winner's build vibes with COC's brand, COC may organically invite them to a featured stream - but no upfront promise |

### For BetterCallZaal (Zaal personally)

| Benefit | Why it matters |
|---------|---------------|
| Positions Zaal as a builder-event host | New brand layer beyond consulting - "the builder community gathering organizer" |
| Personal Twitch channel sees Game traffic | Multi-day spike in BCZ Twitch followers + viewers |
| Permanent on-chain artifact (Zaal as v0 host) | Hats Protocol can issue a "ZABAL Games Host" role to Zaal too - on-chain provenance |
| Connection capital | 8 new builders + every voting ZABAL holder engaging = wide net of new connections |

### For Each Farcaster Creator

| Benefit | Why it matters |
|---------|---------------|
| **Distribution boost from ZAO accounts** | BCZ Farcaster + /zao channel + COC Concertz + ZAO OS amplify all 8 of your streams + casts during promote window. Your audience grows whether you place or not - this is the biggest non-cash win |
| **24h of vibe-coding session footage** | Becomes your personal content asset forever - cut into demo reels, blog posts, YouTube videos, conference talks. Industry novelty (AI-augmented engineering with your tool of choice) makes the footage durable |
| **Streaming flywheel auto-clips your build** | Doc 629 pipeline turns 24h of stream into ~20 short-form clips (TikTok/Reels/YouTube/Farcaster). You keep them all - free content for your channels |
| USDC for top 3 ($250 / $150 / $100) | Real cash for the podium - rewards excellence |
| Participation collectible (every finisher) | Permanent onchain proof you shipped at the inaugural Games - recurring artifact across future v1, v2 etc |
| GitHub portfolio piece | Public repo with 24-hour build = job application differentiator, especially for AI-native engineering roles |
| Distribution practice | The promote window forces you to learn cross-posting, audience building, and live demo - skills most creators under-invest in |
| New audience | Players cross-pollinate each other's audiences across the 8 streams. ZABAL holder voters discover you. Tippers find your work |
| Voting eligibility for v1+ | Finishers may get bonus voting weight in subsequent Games (v1 design call) - alumni network forms |
| Optional ongoing connection | Winners often become ecosystem contributors - the Games is a tryout. No promised role though |
| Possible upside (not promised) | A sponsor adds extra prizes mid-Games. Empire Builder team likes a build and mints a booster organically. COC invites a winner to perform. None guaranteed - all possible |

### For Farcaster Ecosystem

| Benefit | Why it matters |
|---------|---------------|
| 8 new Farcaster Mini Apps / surfaces shipped in 48 hours | Concentrated supply of new mini-app content for the ecosystem |
| `/zabalgames` channel becomes live demo of channel-anchored events | Pattern reusable for other Farcaster-native hackathons |
| Cast volume + engagement spike | 8 builders + their audiences + ZAO amplifying = high-engagement weekend on /zao + /zabalgames |

### For Anthropic / Claude Brand

| Benefit | Why it matters |
|---------|---------------|
| Real-world creative use case | Claude Code in a hackathon context = differentiated from typical "fix bug" demos |
| Shareable footage | 8 simultaneous live-coding streams = endless clips for Claude marketing if they choose to use them |
| Community-led showcase | No Anthropic resources needed - ZAO funds and runs it - pure community signal |

### For Viewers

| Benefit | Why it matters |
|---------|---------------|
| 24h of multi-stream live coding | Pick a player, switch between, compare approaches |
| 24h of promote-window content | Demos, casts, reactions - second narrative arc |
| Tippers earn ZABAL via Doc 628 stream-leaderboard rails | Watching = earning, not just consuming |
| Hall-of-fame entry | Notable tippers can get on-chain attestation of being early supporters |

### Compounding Network Effect

Each ZABAL Games run creates:
- ~8 new participation collectible holders (whatever the chosen format - Hats role, ERC-721, Zora coin, EAS attestation)
- 8 new ecosystem-aligned builders engaged with ZAO rails
- ~8 GitHub repos (open-source by submission requirement)
- ~30 hours of live stream content -> ~150 short-form clips via Doc 629 flywheel
- ~24 hours of promote-window social posts
- 1 onchain ZABAL holder vote = engagement event for the entire token community

After 4 quarterly Games (1 year), ZAO has shipped: 32 new builds + 32 collectible-holding alumni + 32 ecosystem-aligned builders + ~600 short clips + ~120 hours of long-form + 4 community-wide voting events. All anchored to a single recurring brand event.

---

## Key Decisions (Locked 2026-05-09 + revised 2026-05-10)

| Decision | Locked Choice |
|----------|--------------|
| **Format** | 24h build + 24h promote (48h total active player window) + 24h voting + 1h reveal stream |
| **Prize structure** | $500 USDC pool, tiered with floor: 1st $150 / 2nd $100 / 3rd $75 / 4th-8th $35 each. **Every selected player who hits the submission bar gets paid.** Plus participation collectible for every finisher. NO other prizes promised upfront |
| **Judging** | ZAO DAO members who have earned their vote over the past 3 years vote onchain. Curated voter set (long-tenure ZAO contributors), NOT open ZABAL holder voting. Mechanism still snapshot-based |
| **Privacy** | v0 is invite-only, private cohort. Landing page is `noindex,nofollow`. No public promotion until invited cohort is locked |
| **Tooling** | Tool-agnostic - players use any vibe-coding harness (Claude Code, Cursor, Windsurf, Aider, Cline, Bolt, v0, Lovable, custom). "Show your work" is the constraint, not the tool |
| **Visibility requirement** | Pick at least 1 of 4 primary modes (live Twitch stream / recorded screen sessions / public prompt logs / frequent build casts) + ongoing /zabalgames casts throughout the build |
| **Tooling subsidy** | Up to $20/mo covered by ZAO for accepted players who need help affording their tool of choice (Claude Pro, Cursor Pro, Windsurf Pro, etc.) |
| **Prompt scope** | 3-5 idea options inside the prompt, players pick or remix |
| **Date window** | 2026-06-27 Sat 12:00 PT -> 2026-06-30 Tue 13:00 PT (build + promote + vote + reveal) |
| **Player count** | 8 players + waitlist 4 |
| **Public on-chain rail** | Empire Builder apiLeaderboard scores stream activity in real time (per Doc 628) |
| **Stream platform** | Twitch primary, ZAO restream to /zabalgames hub on ZAO OS + YouTube via Doc 629 flywheel |

---

## Open Calls (Need Zaal Input)

| Question | Options |
|----------|---------|
| Final 5 idea options in the prompt (Part 4 below) | Refine list - which 5 ship? |
| USDC prize pool size | $500 locked for v0. Scale up via sponsor tracks in v1? |
| Sponsors for v0 (optional) | Empire Builder, SongJam, COC Concertz, external? Sponsors add prize on top of $500 base. No judging seats - judging is ZABAL-holder onchain |
| **ZABAL voting mechanism** | Snapshot weighted by holdings (1 ZABAL = 1 vote, plutocratic but simple), 1-token-1-vote (mini sybil-resistance via min-balance), or quadratic (sqrt of holdings, balances whales vs many small holders). Recommend **snapshot weighted** for v0 simplicity; quadratic for v1 |
| **Voting window** | 24h post-promote-window? 48h? Concurrent with promote phase to drive viewer engagement? Recommend post-promote 24h for v0 |
| **Voting eligibility floor** | Min ZABAL balance to vote? (e.g. 1M ZABAL) - prevents bot accounts but excludes new wallets. Or zero floor + sybil-protection via Farcaster verified address requirement |
| **Participation collectible spec** | NFT (Hats role NFT, generic ERC-721, Zora content coin)? Onchain attestation (EAS)? Frame-claimable Mini App? Recommend Hats role NFT for ecosystem fit |
| Application gate | **Farcaster digital creators** (active Farcaster handle + verified address required). Bonus weight if you have ZAO Respect / member status. Hybrid: open to any active Farcaster, prioritized to creators who already ship in public |
| Stream cadence requirement | Must stream the bulk of the build (recommendation: stream most of it, breaks for sleep/eat OK). Spot-checks via stream review verify nothing was pre-built |
| Solo only or teams of 2 allowed? | Solo recommended for v0; teams in v1 |
| Voting reveal stream | Yes (post-vote-close 1hr live results stream on Twitch) or async + announce? Recommend yes - reveal stream is content |

---

## Part 2 - Format Spec

### Timeline

```
T-7 days (2026-06-20)   Applications close. Final 8 selected. Waitlist confirmed.
T-3 days (2026-06-24)   Onboarding call (90 min): rules, infra, Empire wallet setup,
                        wallet linkage to Twitch handle, Coinflow tip page setup,
                        voting mechanism explainer
T-1 day  (2026-06-26)   Final tech check. Each player tests Twitch stream key,
                        Empire booster eligibility, Coinflow checkout link

T+0      (2026-06-27 12:00 PT Sat)
                        PROMPT DROPS simultaneously to all 8
                        Same prompt PDF + GitHub gist with 5 idea options
                        Build window opens. Streams must start within 30 min
                        ZABAL holder voting eligibility snapshot taken NOW
                        (prevents flash-buying ZABAL just to vote later)

T+0 -> T+24h            BUILD WINDOW (Sat 12:00 PT -> Sun 12:00 PT)
                        Player streams on Twitch
                        ZAO restreams all 8 to /zabalgames hub page on ZAO OS
                        Empire Builder live leaderboard scores stream events
                        StreamElements alerts trigger ZABAL drops to viewers (per Doc 628)
                        Streaming flywheel auto-clips highlights to YouTube + shorts
                        Coding happens in whatever vibe-coding harness you picked (Claude Code, Cursor, Windsurf, Aider, etc.)
                        Build in public via your declared visibility mode (open repos)

T+24h    (2026-06-28 12:00 PT Sun)
                        SHIP DEADLINE
                        Required submissions:
                          - Live deployed URL
                          - GitHub repo link (public, MIT or similar permissive license)
                          - 60-second demo video link
                          - Tweet/cast announcing ship in /zabalgames channel

T+24h -> T+48h          PROMOTE WINDOW (Sun 12:00 PT -> Mon 12:00 PT)
                        Players promote on all surfaces
                        Tips during this window count via 0xSplits + Coinflow
                        ZAO accounts amplify all 8 (we want all of them to win)
                        Empire Builder scores: cast engagement + tips received

T+48h    (2026-06-29 12:00 PT Mon)
                        Submission window closes
                        ZABAL holder voting opens on Snapshot
                        Voter info packet auto-published (all builds + demos + summaries)

T+48h -> T+72h          VOTING WINDOW (Mon 12:00 PT -> Tue 12:00 PT)
                        ZABAL holders cast onchain votes weighted by holdings
                        Eligible voters = ZABAL holders snapshot at T+0 + verified Farcaster
                        Vote-for-1 mechanism: each voter picks favorite build
                        Live tally visible on /zabalgames hub page

T+72h    (2026-06-30 12:00 PT Tue)
                        Voting closes
                        Live results-reveal stream on BCZ Twitch (1 hour)
                        Top 3 announced by ZABAL vote weight
                        On-chain distribution LIVE during stream:
                          - USDC via 0xSplits to top 3 wallets ($250 / $150 / $100)
                          - Participation collectible minted to all finishers
                        Hall of Fame entry on /zabalgames page
```

### Why 24+24 (not single 24h)

- "Single 24h ship+promote" rewards shallow output - whoever ships fastest gets max promote time
- "24+24" forces TWO disciplines (build AND distribute), maps to real-world product reality
- Splits viewer attention into two narrative arcs: drama (build) + payoff (promote)
- Lets ZAO content engine (Doc 629) clip the build for the promote window

### Why ZABAL-Holder Voting (not human panel)

- Aligned incentives - the people deciding are the people whose token economy benefits from the builds
- No bottleneck - no scheduling 3-5 humans for T+72h availability
- Transparent - every vote is onchain, disputes resolvable by reading the chain
- Recurring narrative - each Games drives ZABAL holder engagement; voting itself is content
- Sybil-resistant by token weight - holdings can't be faked cheaply

---

## Part 3 - The Prompt (What Players Get)

### Prompt Bundle

Each player receives identical materials at T+0:

1. **CONTEXT.md** - ZAO ecosystem primer
   - What ZAO is (188 members, Farcaster music community)
   - What ZABAL Empire is (token + Empire Builder leaderboard)
   - Existing ecosystem brands (BCZ, COC Concertz, FISHBOWLZ, WaveWarZ)
   - Tech stack baseline (Next.js, Supabase, Farcaster mini apps, Base)
   - Links to docs: this doc (630), 628 (web3 streaming), 626 (Empire Builder), 627 (streaming infra)

2. **CLAUDE.md / .cursorrules / AGENTS.md** - Repo-level AI-tool instructions (player picks whichever fits their harness)
   - Brand naming rules (WaveWarZ not Wave Wars, etc per BCZ CLAUDE.md)
   - Build conventions (no emojis, no em dashes, mobile-first)
   - Brand colors (ZAO orange/cyan/gold, dark bg)
   - Tooling baseline
   - Same content, different filename depending on which harness you use

3. **OPTIONS.md** - The 5 build options (see Part 5)

4. **STARTER_KIT/** - Bootstrap repo
   - Next.js 16 starter with Tailwind v4 + Farcaster mini-app SDK
   - `.env.example` with named placeholder for Empire Builder, Neynar, Supabase
   - Sample API route hitting Empire Builder personal-stats endpoint
   - Pre-wired wagmi + Coinbase Smart Wallet

5. **JUDGING.md** - Voting mechanism explainer (Part 6)

6. **INFRA.md** - Provided rails
   - Each player gets pre-funded Privy agent wallet (gas-free build)
   - Empire Builder API key for read access
   - Supabase project shared (sandbox)
   - Coinflow merchant account for tip page

### Drop Mechanism

- 8 sealed tweets scheduled simultaneously at 12:00 PT 2026-06-27 from `@bettercallzaal` tagging each player's Farcaster handle
- Each tweet contains a magic link to the prompt bundle (token-gated to player's verified Farcaster wallet)
- Single Farcaster channel `/zabalgames` for cross-player community

---

## Part 4 - Onboarding (T-3 days)

90-minute call. Must attend OR forfeit. Walks through:

1. Rules + prize structure (5 min)
2. **Tooling subsidy check** - confirm each player has their vibe-coding tool subscription active. ZAO covers up to $20/mo for any accepted player who needs it (Claude Pro, Cursor Pro, Windsurf Pro, etc.) - tool-specific gift link or reimbursement sent 24 hours before T+0 (5 min)
3. **Visibility mode lock-in** - confirm each player's declared "show your work" primary mode (live stream / recorded sessions / public prompt logs / frequent casts). Set up the relevant infra (10 min)
4. Stream setup help - Twitch + StreamElements + OBS, if applicable (15 min) - reuse Doc 627
4. Wallet linkage - connect Farcaster verified address to Twitch handle (10 min)
5. Empire Builder wallet eligibility check (5 min)
6. Coinflow tip page setup (10 min)
7. **Voting mechanism explainer** - how ZABAL holders will vote, what voters will see, why outcome is community-decided (10 min)
8. Q&A (30 min)

Recorded for waitlist replacements + future v1 reference.

### Application Form Asks (T-7 weeks)

To gauge tooling subsidy cost in advance, the application form includes:
- **"Which vibe-coding harness will you use?"** [Claude Code / Cursor / Windsurf / Aider / Cline / Bolt / v0 / Lovable / Mix / Other / Not sure]
- **"Vibe-coding tool subsidy"** [I have my subscription active / I need ZAO to cover up to $20/mo / Not sure yet]
- **"Primary visibility mode"** [Twitch stream / Recorded screen sessions / Public prompt logs / Frequent build casts / Combination]

Worst case = 8 x $20 = $160 in tooling subsidies. Budget includes this.

---

## Part 5 - The 5 Idea Options (DRAFT - Need Zaal Refinement)

Each option ties to existing ZAO ecosystem rails. All shippable in 24h.

### Option A - ZABAL Empire Booster Workshop
Build a web tool that lets any ZAO member propose, simulate, and submit a custom booster rule for the $ZABAL Empire. Workflow:
- Connect Farcaster wallet
- Define rule (e.g., "+2x boost if holds POIDH claim NFT + Hypersub creator-pass")
- Simulate against current leaderboard (visualize the score delta)
- Generate ready-to-deploy booster config JSON
- Submit to Empire Builder via apiLeaderboards (read or hand off)

**Stack hint:** Next.js + viem + Empire Builder API (Doc 626)

### Option B - Twitch -> Empire Stream Leaderboard Feed
Implement Doc 628 Phase 2 in 24h. StreamElements WebSocket subscriber that scores tip/follow/sub/cheer/raid events, mirrors to a public JSON feed Empire Builder can pull. Demo with player's own Twitch channel.

**Stack hint:** Cloudflare Worker + Socket.IO client + KV store (or Supabase) + JSON feed endpoint

**Reference:** Doc 628 Part 1 (the pipeline diagram)

### Option C - ZAO Farcaster Mini App (Pick a Surface)
Build any one of these mini apps (player picks the surface):
- Stream-tracker: who in ZAO is live across Twitch/YouTube/Kick right now
- Member directory with ZABAL holdings + Bonfire score
- Music polling app: vote on weekly ZAO music drops
- ZABAL portfolio dashboard
- Governance vote UI for next Empire booster rule

**Stack hint:** Next.js + `@farcaster/miniapp-sdk` + Neynar API

### Option D - New ZOE Skill
A new Claude skill (`~/.claude/skills/`) doing one job for ZAO. Examples:
- Auto-summarize a Twitch VOD into a Farcaster cast thread
- Schedule + send weekly ZAO digest from Bonfire signal
- Generate per-platform captions from a transcript (per Doc 629)
- Track ZABAL Empire leaderboard moves and cast notable changes

**Deliverable:** SKILL.md + working scripts + README explaining trigger and outputs.

### Option E - Bonfire / Hats Role Automation
Connect Bonfire reputation graph (or Hats Protocol) to a ZAO surface:
- Auto-mint Hats role NFT when a Bonfire signal threshold is hit
- Auto-revoke role when conditions change
- Or: Bonfire-powered "co-sign" widget where ZAO members can attest to other members' contributions

**Stack hint:** Hats SDK on Base + Bonfire SDK (Doc 544)

### Option F (Wildcard) - Build Your Own
Player can propose their own build at T-3 onboarding call, must integrate at least 2 of: ZABAL Empire, Farcaster verified address, Hats Protocol, Bonfire, EAS attestations, Hypersub, Coinflow.

---

## Part 5b - Show Your Work (Visibility Modes)

ZABAL Games is tool-agnostic. Players use whatever vibe-coding harness fits their style - Claude Code, Cursor, Windsurf, Aider, Cline, Bolt, v0, Lovable, or hand-roll their own pipeline. **The constraint isn't the tool, it's the visibility.**

Each player picks at least ONE primary visibility mode, then supplements with ongoing /zabalgames casts throughout the build. Different modes fit different personalities - the goal is build-in-public spectacle, not a single recipe.

### Mode 1 - Live Twitch Stream

Stream the bulk of the build live on Twitch. The default - what most v0 players will probably pick. ZAO restreams all 8 to a single hub page so viewers can switch between players. Twitch chat is the running commentary.

- Pros: maximum drama, viewer tipping, ZAO content engine auto-clips, anti-cheat is built in
- Cons: highest pressure, hardest on introverts, technical setup overhead
- Setup: per Doc 627 (Twitch + StreamElements + OBS)

### Mode 2 - Recorded Screen Sessions

Screen-record your build sessions and upload to YouTube/Loom within 1h of each session ending. Cast the link to /zabalgames as you go. Less drama than live, easier on shy builders.

- Pros: no live-streaming overhead, edit out bathroom breaks, async-friendly across timezones
- Cons: lower viewer engagement, no live-tipping integration, requires self-discipline to upload promptly
- Setup: OBS local recording / Loom / Riverside

### Mode 3 - Public AI Prompt Logs

Share your AI conversation logs publicly as you go. Cursor + Windsurf composer history, Claude Code transcript dumps, Aider session logs, whatever your tool exports. Post snippets every 1-2 hours.

- Pros: lowest infra overhead, ideal for tool-fanatics who want to show their craft, contributes to public corpus of "how do creators actually use AI tools"
- Cons: no live viewers, no visual interest beyond text, harder to anti-cheat-verify
- Setup: GitHub Gist / personal blog / Farcaster long-form casts

### Mode 4 - Frequent Build Casts

Cast progress on Farcaster every 1-2 hours with screenshots, snippets, and what you're prompting. Lower bar than streaming, higher cadence required. Tag /zabalgames + @bettercallzaal.

- Pros: native Farcaster-first, highest signal-to-noise for ZABAL holders who'll vote, no separate platform needed
- Cons: requires steady cadence, easier to fake (need ZAO to spot-check casts vs git commit times), less engagement spectacle than streams
- Setup: just Farcaster

### Combination Mode

Most engaged players will probably mix - e.g., stream the first 6 hours, take a sleep break, screen-record sessions 7-16, then cast snapshots through the final stretch. Combination is welcome and probably optimal.

### What gets verified

Voters need to trust you actually built it in 24h with AI tools. The visibility mode is the verification mechanism. ZAO spot-checks:
- Stream archive vs git commit timestamps
- Screen recording upload timing vs git commit timestamps
- AI prompt log timestamps vs commits
- Cast cadence vs commit cadence

Faking is hard if you've committed to a primary mode. The empty starter repo at T+0 + the mandatory visibility mode = anti-cheat backbone.

---

## Part 6 - Judging (ZAO DAO Members With 3-Year Earned Vote)

**No human judge panel. Not open ZABAL-holder voting either.** The judging body is a curated voter set: **ZAO DAO members who have earned their vote in the DAO over the past 3 years**. Long-tenure contributors with Respect + history in the ecosystem. The people who actually built ZAO over 3 years pick what's worth building next.

### Why Curated DAO Voter Set (Not Open Token Holder Voting)

| Reason | Detail |
|--------|--------|
| **Earned not bought** | Open ZABAL holder voting = whoever has the most tokens wins. Whale risk. Buying-influence risk. 3-year DAO membership = earned reputation, not purchased token weight |
| **Ecosystem-aware judges** | DAO members who've been here 3 years know what builds the ecosystem actually needs vs what flashy demos show. Their taste IS the curatorial signal |
| **Aligned incentives** | Long-tenure DAO members hold ZABAL + have Respect + have shipped contributions themselves. They pick builds they would actually use |
| **No bottleneck** | No scheduling 3-5 humans to be available T+72h. Vote opens, vote closes, results onchain |
| **Transparent provenance** | Every vote is onchain. Disputes resolvable by reading the chain. No "the judge didn't like my project" gripes |
| **Limited scope, big signal** | A smaller curated voter set (probably ~30-80 DAO members) produces a meaningful vote rather than diluting across thousands of token holders |
| **Sybil-resistant by tenure** | 3-year DAO membership can't be faked - on-chain provenance + Respect history are verifiable |

### Eligibility Definition (Still Open Call)

"Earned their vote in the DAO over the past 3 years" needs precise definition before T+0. Candidate criteria (pick one OR combine):

| Criterion | What it means | Pros | Cons |
|-----------|---------------|------|------|
| **Respect score threshold** | Min Respect score earned in ZAO OS (e.g. > 1000 Respect cumulative) | Reflects actual contribution, already tracked in ZAO OS | Excludes ZAO members who contribute outside the Respect-scored channels |
| **Tenure threshold** | Min N years of continuous ZAO membership (e.g. joined > 2024) | Simple, verifiable via member roster | Doesn't distinguish active from passive members |
| **Combo: Respect + tenure** | Min Respect AND min tenure | Most rigorous, hardest to game | Most exclusive - might shrink voter set below useful size |
| **Hats Protocol DAO member role** | Hold the "ZAO DAO Member" Hat NFT | Onchain, snapshot-friendly | Requires that Hat to be issued to eligible members first |
| **Curated list at T+0** | Zaal + 2-3 trusted ZAO seniors lock the voter list manually | Maximum control, fastest to execute | Less "trustless," reads as more centralized |

Recommend: **Hats Protocol DAO member role + min 1000 Respect** for v0. Onchain verifiable, mechanically clean, both criteria already exist as data.

### Voting Mechanism (Open Call - Recommend One-Person-One-Vote for DAO Set)

Since voting is now restricted to DAO members with earned reputation (not open ZABAL holder voting), mechanism choice changes:

| Mechanism | Pros | Cons | Recommendation |
|-----------|------|------|----------------|
| **One-DAO-member-one-vote (1-person-1-vote)** | Treats every earned voter equally regardless of token holdings - aligns with "earned not bought" thesis | Requires verified per-member identity (Hats role NFT or curated list) | **Recommended for v0** |
| **Respect-weighted vote** | Members with more Respect (more contribution) get more vote weight - rewards historical contribution | More complex to compute + display | Consider for v1 |
| **Snapshot weighted by ZABAL holdings (DAO members only)** | Still uses token economy gradient, filtered to DAO members | Reintroduces whale risk inside the DAO | Skip - defeats the curatorial design |
| **Quadratic (sqrt of Respect)** | Balances whale-Respect vs many-medium-Respect members | Complex, premature for v0 | Save for v1+ |

### Voting Window (Open Call)

Three options on the table:

| Option | Window | Pros | Cons |
|--------|--------|------|------|
| **Concurrent with promote** | Voting opens at T+24h with promote window, closes T+48h | Voting + promotion happen together = drama, tippers AND voters watching | Players are still building distribution while votes are being cast = unfair to slower promoters |
| **Post-promote 24h** | Voting opens T+48h, closes T+72h | Clean phases - everyone has equal promote time before voting begins | Adds 24h to the total event length |
| **Post-promote 48h** | Voting opens T+48h, closes T+96h | More holders catch the vote (weekend deadline issue) | Loses momentum, harder to sustain attention |

Recommend: **Post-promote 24h** for v0. Clean, manageable, pairs with a 1-hour live results-reveal stream at T+72h.

### Voting Eligibility (Locked Direction - Specifics Open)

**Eligible voters = ZAO DAO members who have earned their vote over the past 3 years.** Snapshot taken at T+0 so the voter set is locked before Games begin.

Specifics still need locking (see Eligibility Definition table above). Recommended path:
- **Hats Protocol "ZAO DAO Member" Hat NFT** + min 1000 Respect score
- Snapshot at T+0 (2026-06-27 12:00 PT) - no late-joiners count
- Voters need a verified Farcaster address (standard sybil-resistance)

This produces a voter set of roughly 30-80 long-tenure ZAO members. Big enough to feel like a vote, small enough that each voice matters and feels accountable.

### What DAO Members Are Voting On

Each DAO voter picks their favorite build via vote-for-1. Top placements determined by total vote count (1-person-1-vote mechanism).

Recommend: **Vote-for-1** for v0. Simplest UX. Placements 1-8 by total vote count - 1st (most votes) gets $150, all the way down to 8th who still gets the $35 floor + collectible.

Voter info packet (auto-generated):
- All N submitted builds listed with: live URL, GitHub link, 60-sec demo embed
- Auto-generated summary card per build (project name, prompt option chosen, ZAO rails used)
- Optional: viewer-engagement metrics displayed (concurrent viewers, tip volume, GitHub stars)

### Voting Stream

Live results-reveal stream at T+72h. Top 3 announced. USDC + collectibles distributed onchain LIVE. ZAO community can react in chat. Recordable, clippable, becomes content.

---

## Part 7 - Prize Structure

### Philosophy (Revised 2026-05-10)

**Tiered top-heavy USDC + a participation collectible. That's it.** No promised auxiliary perks. Don't over-promise. Anything else (extra ZABAL bag from sponsors, Empire Booster from Adrian, COC slot from a winner's vibe-fit with COC) emerges organically and is upside, not commitment.

### USDC Pool: $500 Tiered with Floor (Everyone Selected Gets Paid)

| Place | USDC |
|-------|------|
| **1st** | $150 |
| **2nd** | $100 |
| **3rd** | $75 |
| **4th-8th** | $35 each (5 x $35 = $175) |
| **Total pool** | **$500** |

Why tiered-with-floor: rewards excellence (1st takes 30% of pool, 3-4x more than baseline) AND ensures no one walks away empty-handed if they shipped. The 8 selected players are the cohort - if they hit the submission bar, they get paid. The competitive layer is which placement they earn.

Why no goose eggs: ZABAL Games v0 is invite-only with 8 carefully selected creators. We're not running a 100-person open hackathon where elimination is the model. These are 8 specific people whose work we want to invest in - all of them get something concrete for shipping.

### Submission Requirements (must hit ALL by T+48h)

1. Live deployed URL (working, not 404)
2. Public GitHub repo link (open source - MIT or similar permissive license)
3. 60-second demo video link (Loom, YouTube, or self-hosted)
4. Tweet/cast on /zabalgames channel announcing ship

Miss any one = no submission = no USDC, no collectible, no Hall of Fame entry. Hard line keeps the bar real.

### Participation Collectible (Every Finisher)

Every player who hits the submission bar receives a participation collectible. This is the only thing every finisher gets beyond cash + voting eligibility for next time.

**Collectible spec is an open call** - 4 options:

| Option | What | Pros | Cons |
|--------|------|------|------|
| **Hats Protocol role NFT** | "ZABAL Games v0 Finisher" Hats role on Base | Native ZAO ecosystem, role-based access works across surfaces, recognizable | Niche outside ZAO crowd, requires Hats infra |
| **Generic ERC-721 NFT** | Custom contract or via Manifold/Zora | Universal, tradeable, displayable in any wallet | No special role mechanics, just collectible |
| **Zora content coin** | One coin per Games drop, finishers earn allocation | Tradeable + becomes ecosystem story (Games coin appreciates) | Adds liquidity surface to manage, complexity |
| **EAS attestation** | Onchain attestation via Ethereum Attestation Service | Cheap (free offchain or batch onchain), perfect for credentialing | Less visual/collectible feel, more "credential" than "trophy" |

**Recommend for v0:** Hats Protocol role NFT. Native to ZAO rails, role mechanics enable future utility (Finisher role unlocks future Games applications, Champion role unlocks judging weight bonus, etc).

### What's NOT Promised (Upside Possibilities Only)

These were in earlier drafts but are intentionally pulled to avoid over-promising. May emerge organically:

| Possibility | Why pulled from prize promise |
|-------------|------------------------------|
| Scaled ZABAL bag (50M / 25M / 10M / 5M) | Requires Empire Builder configuration + treasury commitment. Better to surprise with it post-Games if treasury allows |
| Custom Empire Booster ID | Requires Adrian/yerbearserker config. They might do it, but ZAO doesn't promise their work |
| COC Concertz featured stream slot | Requires winner's vibe to fit COC. Mention as possibility, not guarantee |
| Future paid roles in ZAO | Players are not contractors. Any future hiring is separate |

This means ZAO's commitment is just: $500 USDC + collectibles + up-to-$20 tooling subsidies + infra access. Clean.

### Total Pool Cost

| Component | Cost |
|-----------|------|
| USDC pool | $500 |
| Tooling subsidies (up to 8 x $20 - Claude Pro / Cursor Pro / Windsurf / etc.) | up to $160 |
| Participation collectible mints (8 x ~$1 gas on Base) | ~$8 |
| Voting infra (Snapshot is free) | $0 |
| Hosting + infra | covered by existing ZAO stack |
| **Total ZAO outlay** | **~$668 max** |

Sub-$700 for the entire v0. Affordable, repeatable.

### Distribution Mechanics

- USDC: single 0xSplits contract on Base, recipients = top 3 verified Farcaster addresses, weights $250/$150/$100
- Participation collectible: minted to all finishers' verified Farcaster addresses post-vote-close
- All distribution happens during the live results-reveal stream at T+72h
- Onchain transactions broadcast live during the reveal = transparent + content-rich

---

## Part 8 - Infrastructure (What ZAO Provides)

### For Players

| Resource | Provided | Notes |
|----------|----------|-------|
| **Vibe-coding tool subsidy (up to $20)** | **YES (if needed)** | Accepted players who need help affording their AI coding tool of choice (Claude Pro, Cursor Pro $20/mo, Windsurf Pro $15/mo, etc.) get up to $20/mo covered by ZAO. Asked at application time. Players pick their own tool |
| Pre-funded Privy agent wallet | YES | $5 ETH on Base for gas |
| Empire Builder API key | YES (read-only) | Personal-stats + leaderboard endpoints |
| Supabase sandbox project | YES | Shared, namespaced per player |
| Cloudflare Workers free tier | YES | If they want a backend |
| Twitch developer app shared | NO | Player creates own (covered in onboarding) |
| StreamElements account | NO | Player creates own (free) |
| Coinflow merchant link | YES | One per player for tip-during-build collection |
| Vercel free deployment | NO | Player creates own |
| Domain `<player>.zabalgames.dev` | YES | Auto-provisioned subdomain |

### For ZAO (the host)

| Surface | What |
|---------|------|
| `/zabalgames` Farcaster channel | Single hub for all 8 players + viewers |
| `bettercallzaal.com/zabalgames` (or `zaoos.com/zabalgames`) | Public landing page with live leaderboard, all 8 stream embeds, prize pool, schedule, voter info packet |
| ZAO OS dashboard widget | "ZABAL Games Live" panel for ZAO members |
| Twitch restream account | `@zabalgames` aggregating all 8 player streams via Restream multi-cam |
| Empire Builder apiLeaderboard | `zabalgames-v0` leaderboard pulling player score JSON every 15 min |
| Streaming flywheel | Doc 629 pipeline auto-clips top moments from each player's stream |
| Snapshot.org space | $ZABAL token voting space - hosts the v0 vote at T+48h |

---

## Part 9 - Promotion Plan (Pre-Event)

### T-7 Weeks (2026-05-09)

- Doc 630 published (this doc)
- Initial Farcaster cast in /zao announcing ZABAL Games coming
- DM Adrian + yerbearserker to share doc + confirm amplification support (no judge ask - judging is ZABAL holders)
- Set up Snapshot.org space for $ZABAL token (or confirm one exists)

### T-6 Weeks (2026-05-16)

- Public application form on `bettercallzaal.com/zabalgames`
- Twitter/X + Farcaster + LinkedIn announcement thread
- Confirm sponsor outreach (Empire Builder, SongJam, others) - sponsor money is on top of $500 base

### T-4 Weeks (2026-05-30)

- Applications close (or rolling)
- Final 8 announced via Farcaster cast
- "Meet the players" stream on BCZ Twitch (8x 5-min intros)

### T-3 Weeks (2026-06-06)

- Tech infra dry-run: dummy player runs the full pipeline solo
- Test Snapshot voting flow with dummy proposal
- Fix bugs surfaced by dry-run

### T-1 Week (2026-06-20)

- Final logistics confirmed
- Onboarding call calendar invite
- Hype campaign (1 cast/day on /zabalgames channel)
- Announce voting mechanism + window publicly so ZABAL holders can prepare

### T-3 Days (2026-06-24)

- 90-min onboarding call (per Part 4)
- Recorded + posted

### T-0 (2026-06-27)

- 12:00 PT prompt drop
- Live host stream on BCZ Twitch narrating start
- Snapshot voting eligibility taken (locks who can vote at T+48h)

---

## Part 10 - Risks + Mitigations

| Risk | Mitigation |
|------|------------|
| <8 applicants | Open public; promote across Farcaster + Reddit + dev Twitter early |
| Player drops mid-build | Waitlist 4 deep, auto-promote at T-1d if confirmed dropout |
| Twitch ToS issue (third-party tipping) | Coinflow tip happens off-stream via posted link; not in violation |
| Cheating (pre-built code) | Mandate empty starter repo at T+0 + verified empty git log; spot-check via stream review |
| One player dominates voting via huge existing audience | Mitigated by ZABAL-holder weighting (audience must convince ZABAL holders, not just count viewers). Quadratic voting in v1 if whale dominance becomes a problem |
| Empire Builder API rate-limit during 8 simultaneous polls | Coordinate with Adrian; throttle to 1 poll/min per player |
| StreamElements WebSocket flood | If event volume > 1k/min, batch via Cloudflare Queues |
| ZAO treasury USDC liquidity | Secure $500 USDC + up to $160 tooling subsidy reserve = $660 in dedicated wallet 7 days prior |
| **ZABAL whale single-handedly decides outcome** | v0 risk if 1-2 whales hold majority of supply. Mitigation: snapshot eligible voters at T+0 (no flash-buy), publish vote distribution transparently, plan quadratic voting for v1 |
| **Low ZABAL voter turnout** | If <10% of eligible holders vote, signal is weak. Mitigation: voter incentive (free participation collectible for voters too?), heavy promotion of voting window, results-reveal stream as the payoff |
| **Vote-buying / collusion** | A player could give ZABAL to friends to vote for them. Hard to prevent in any token-vote system. Mitigation: snapshot at T+0 prevents flash-distribution; transparency of holdings makes blatant collusion visible |
| **Snapshot.org dependency** | If using Snapshot, downtime during voting = problem. Mitigation: have backup contract-based vote ready (custom or use Tally/Aragon) |
| Bot tip farming | Tip score requires verified Farcaster address ($25 hold + linked X/phone/GH) |
| Player builds something unethical | Code-of-conduct in onboarding; right to disqualify pre-vote-open; ZABAL holders can also vote against |

---

## Part 11 - Strategic Considerations (Things to Think About Beyond Operations)

The Risks table (Part 10) covers operational risk. This section covers the broader strategic questions that shape whether ZABAL Games becomes a tradition or a one-off.

### Cultural Fit

| Question | Why it matters |
|----------|----------------|
| Does the existing ZAO community embrace builders, or do they feel alienated? | ZAO's identity is music-community-first. Bringing in 8 engineers may feel like a brand shift. Mitigation: ZAO holders ARE the judges - the music community literally picks who wins. Frame as "ZAO commissioning new tools" not "tech bros taking over" |
| Is the music community invited to participate beyond watching? | Yes - viewers earn ZABAL via stream-leaderboard tipping. ZABAL holders cast votes that decide outcomes. Some prompt options (Option C: ZAO Farcaster Mini App with music polling surface) are explicitly music-adjacent |
| Does Spanglish/multilingual ZAO segment feel included? | Onboarding call should be available in EN + ES if demand exists. Application form opens in both languages. Voter info packet bilingual. Not a blocker for v0 but worth tracking |

### Optics Around Prize Size

| Question | Why it matters |
|----------|----------------|
| Does $500 read as humble or cheap? | Among hackathon norms ($10k-100k typical), $500 reads small. Frame intentionally: "v0, intentionally constrained, ships > prizes." The collectible + GitHub repo + community-pick legitimacy ARE the real flex |
| Does the tiered model align with the rest of the format? | Yes - ZABAL holders need a meaningful gradient to vote on. Tiered USDC reinforces that 1st > 2nd > 3rd matters |
| Does the tooling subsidy feel like welfare or like infrastructure? | Frame as "ZAO removes infra friction so the only barrier is your idea - pick your tool, we cover it." Same energy as ETHGlobal handing out Optimism credits. Not charity, just plumbing |

### Diversity + Geography

| Question | Why it matters |
|----------|----------------|
| Does a PT-anchored event exclude EU/Asia builders? | Yes - EU player would be coding through their night. Mitigation v0: accept this constraint, track applicant geographies. Mitigation v1: split into 3 regional Games per quarter with global championship |
| Application gate: open public vs ZAO-member-only vs invite | Open public maximizes diversity but loses ecosystem context. ZAO-member-only fragments to existing community. Hybrid: open to anyone but bonus credit for ZAO Respect / member status. Recommend hybrid for v0 |
| Gender / experience-level mix | Don't quota for v0. Track data. If first cohort skews homogenous, adjust v1 outreach (post in r/girlsgonewired, r/learnprogramming, etc.) |

### IP + Code Ownership

| Question | Why it matters |
|----------|----------------|
| Who owns the code each player ships? | Each player owns their code. Open-source mandate (MIT or similar permissive license) is a submission requirement - keeps ZAO from claiming IP it didn't fund development on |
| Can ZAO use winning builds in production? | Per MIT license, yes. Doesn't transfer ownership. ZAO can fork + extend |
| Does ZAO incubate winners? | Optional ongoing relationship - no obligation. Some winners may become ecosystem contributors organically |
| What if a player's code uses a Claude-generated solution that's also in someone else's training data? | Standard hackathon risk. Open-source license = transparent. Players agree code is their own work product |

### Brand + Partner Risk

| Question | Why it matters |
|----------|----------------|
| What if Empire Builder / SongJam doesn't engage with the Games? | Less critical now - they're not committed as judges. Their support is amplification only. Games can run without them |
| What if a sponsor signs on and then pulls out? | v0 has no sponsors yet. Set hard 4-week-prior cutoff for sponsor commitments. Don't market sponsor names until USDC is wired. Sponsor money is on top of $500 base, not part of it |
| What if a player builds something offensive / off-brand? | Code of conduct in onboarding. Right to disqualify pre-vote-open on grounds of harassment, plagiarism, or hate content. Once vote opens, the community decides - ZAO trusts the holder collective |
| What if a winner refuses the on-chain collectible (privacy)? | Collectible held in escrow contract until claimed. USDC paid to a backup address or held in escrow. Winner's choice |
| What if the ZABAL community votes for an undeserving build (popularity over merit)? | This IS the system. Trust the holders. If outcomes are consistently bad, switch mechanism in v1 (quadratic, conviction). For v0, the message is "the community decides, even if Zaal disagrees" |

### Twitch ToS + Streaming Platform Risk

| Question | Why it matters |
|----------|----------------|
| Is third-party tipping (Coinflow) on Twitch streams a ToS issue? | Twitch tolerates off-platform tips (link in description). Risk = chargeback liability lives with creator. Coinflow is fiat-on-ramp not a payment processor on Twitch's side - so this is a gray area, not a violation |
| What if Twitch changes their stance mid-Games? | Backup: switch to YouTube Live primary, Twitch becomes secondary. Doc 629 flywheel works with both |
| What if a player streams something against Twitch ToS (DMCA music, etc) | Standard streamer risk. Players sign disclaimer in onboarding. ZAO not liable for individual stream content |

### AI-Assistance Disclosure

| Question | Why it matters |
|----------|----------------|
| Should we disclose that Claude is the build tool, or hide it? | Disclose loudly - this is the entire point. Differentiates ZABAL Games from hackathons that ban AI. Frames as "AI-augmented engineering is the new normal, here's what it looks like at peak" |
| Does this position ZAO as an Anthropic / any-vendor shill? | No - players pick their own vibe-coding harness (Claude Code, Cursor, Windsurf, Aider, etc.). ZAO doesn't take money from any vendor for v0. Tool-agnostic positioning protects ZAO from being seen as captured by one vendor |
| Will some viewers complain "this isn't real coding"? | Yes, some will. Counter-narrative: "this is the most real coding - shipping in 24 hours under public pressure with real users watching." Lean into it |

### Anti-Cheat / Submission Verification

| Question | Why it matters |
|----------|----------------|
| How do we know a player actually built it in 24h vs pre-built? | Mandate empty starter repo at T+0. Verify empty git log on submission. Spot-check via stream review (random 5-min chunks from each player's build stream). Players know they're being checked |
| How do we know AI-generated code doesn't violate someone's IP? | Standard AI-coding-tool disclaimer - players are responsible for their code's IP. Open-source license = transparent provenance |
| Multi-account cheating (one player runs 2 entries) | Application requires verified Farcaster + Twitch + GitHub - high friction to maintain dual identity convincingly. Not a v0 problem |

### Post-Event Trajectory

| Question | Why it matters |
|----------|----------------|
| What happens to the 8 builds after the weekend? | All open-source on GitHub. ZAO maintains a `/zabalgames` hall-of-fame page linking each. Some will die, some get incubated, some get integrated into ZAO OS - that's healthy |
| Do winners stay engaged with ZAO? | Optional. Some will, some won't. Mitigation: invite winners to /zabalgames Telegram for ongoing contact + first-look at v1 |
| Does ZABAL Games become quarterly, monthly, or one-off? | Decision deferred to post-v0 retrospective (Doc 631 placeholder). Probably quarterly is the sweet spot - enough cadence to compound brand, not so much it burns out the audience |
| Is there a championship across multiple Games? | v1+ feature. Top finishers across N Games qualify for an annual ZABAL Games Cup with bigger prize + IRL component |

### Data + Privacy

| Question | Why it matters |
|----------|----------------|
| What happens to the build streams (recordings)? | Players own their streams. ZAO archives clips for content engine but credits each player. Players can request deletion at any point |
| What happens to onboarding call recordings? | Same as above - players own. ZAO uses snippets for v1 promotion only with written permission |
| Do players' wallet addresses become public? | Yes - via the leaderboard JSON feed (per Doc 626 pattern). Players know this when they accept |
| GDPR / CCPA implications | Data minimization: only collect Farcaster handle + Twitch handle + verified address + tooling subsidy yes/no + creator type. Standard rights apply. Low risk for 8 players |

### Brand Compounding

| Question | Why it matters |
|----------|----------------|
| Does v0 success automatically mean v1 happens? | No - need 70%+ submission rate AND positive community sentiment AND zero critical incidents AND meaningful voter turnout. If any fails, retro before committing v1 |
| Can other ZAO ecosystem brands run their own Games? | Yes - COC Concertz Games (concert-promotion-themed), FISHBOWLZ Games (audio-room-themed), WaveWarZ Games (prediction-market-themed). All ride the same template. Builds the "Games" sub-brand under ZAO umbrella |
| Does this become an external brand (like ETHGlobal)? | Long-term possibility. v0 is internal-facing. v3+ could spin out as standalone with multi-token ecosystem support |

---

## Part 12 - v1 Iteration Ideas (Post-v0 Retrospective)

After ZABAL Games v0 ships and a retro is run (Doc 631 placeholder):

| v1 Idea | Why |
|---------|-----|
| Teams of 2 allowed | Doubles output, surfaces collab vibes |
| Global timezone variants | Run parallel ZABAL Games in EU/Asia weekend, single global winner |
| Sponsor tracks | Each sponsor (Empire Builder, SongJam, COC) sponsors a track with their own prize on top |
| Ongoing weekly mini-games | Smaller 12-hour events between full Games |
| Open tournament | Top 8 finishers across multiple Games qualify for an annual ZABAL Games Cup |
| Quadratic voting | Migrate from simple weighted to quadratic to balance whale influence |
| Conviction voting | Time-weighted voting for thoughtful evaluation |
| Voter rewards | ZABAL holders who voted in v0 get small participation collectible to incentivize turnout |
| IRL components | Final demo at COC Concertz live show / Farcon |
| Build-your-own-prompt option | Players propose prompts in advance; community votes which 5 ship |

---

## Also See

- [Doc 627 - Twitch + StreamElements](../../cross-platform/627-twitch-streaming-streamelements-integration/) - Streaming infra players use
- [Doc 628 - Web3 Streaming + ZABAL Empire Bridge](../../business/628-web3-streaming-zabal-empire-bridge/) - Score feed pattern, Coinflow tip flow, Hypersub, EAS
- [Doc 629 - Streaming as Main Media Source](../../infrastructure/629-streaming-as-main-media-source-flywheel/) - Auto-clip from build streams to shorts
- [Doc 626 - Empire Builder + ZABAL POIDH airdrop](../../business/626-empire-builder-zabal-poidh-airdrop/) - apiLeaderboards pattern for player score feed
- [Doc 625 - POIDH x ZAO bounty playbook](../../community/625-poidh-x-zao-bounty-playbook/) - On-chain submission rail (could pair with Games entry)
- [Doc 361 - Empire Builder v3](../../business/361-empire-builder-deep-dive-v3-integration/) - Distribute API for prize ZABAL
- [Doc 324 - ZABAL Wallet Agent Tokenomics](../../business/324-zabal-sang-wallet-agent-tokenomics/) - Privy agent wallets for player gas
- [Doc 322 - Paragraph publish.new](../../business/322-paragraph-publishnew-newsletter-agent-commerce/) - Post-Games recap newsletter
- [Doc 354 - Cross-Posting Infra](../../cross-platform/354-cross-posting-infrastructure-audit/) - Promote-window distribution
- [Doc 311 - Vibe-coded apps marketing playbook](../../311-vibe-coded-apps-marketing-playbook/) - Marketing patterns

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Share Doc 630 with Adrian + yerbearserker for input + amplification (no judge ask) | @Zaal | DM | 2026-05-12 |
| Refine final 5 idea options (Part 5) - get input from Adam (SongJam) on Option D ZOE-skill scope | @Zaal | Doc edit | 2026-05-16 |
| Confirm $660 ZAO treasury allocation ($500 USDC pool + $160 tooling subsidy reserve) | @Zaal | Treasury | 2026-05-16 |
| **Lock voting mechanism** (snapshot weighted vs 1-token-1-vote vs quadratic) | @Zaal | Decision | 2026-05-16 |
| **Lock participation collectible spec** (Hats role / ERC-721 / Zora coin / EAS) | @Zaal | Decision | 2026-05-16 |
| Add vibe-coding harness question + tooling subsidy + visibility mode to application form | @Zaal | Form copy | 2026-05-16 |
| Coordinate procurement: gift codes / reimbursement flow for multiple AI coding tool vendors | @Zaal | Procurement | 2026-06-13 |
| Send Claude Pro gift link to needing players 24h before T+0 | @Zaal | Email | 2026-06-26 |
| Build `bettercallzaal.com/zabalgames` landing page (static, applications form, voter info) | @Zaal | PR (BCZ) | 2026-05-23 |
| **Set up Snapshot.org space for $ZABAL token** (or confirm existing space) | @Zaal | Snapshot | 2026-05-23 |
| Open public applications via Farcaster/X/LinkedIn announcement | @Zaal | Cast/post | 2026-05-23 |
| Reach 16+ applications (over-subscribe to filter) | @Zaal | Outreach | 2026-06-06 |
| Final 8 selection + waitlist 4 | @Zaal | Decision | 2026-06-13 |
| Tech dry-run with dummy player | @Zaal | Test | 2026-06-13 |
| **Test Snapshot voting flow with dummy proposal** | @Zaal | Test | 2026-06-13 |
| Fix dry-run bugs in pipeline | @Zaal | PR | 2026-06-20 |
| Onboarding call (90 min) - includes voting mechanism explainer for players | @Zaal + 8 players | Calendar | 2026-06-24 |
| Pre-fund 8 Privy agent wallets ($5 ETH each on Base) | @Zaal | Wallet | 2026-06-26 |
| Schedule 8 sealed prompt-drop tweets for 2026-06-27 12:00 PT | @Zaal | Schedule | 2026-06-26 |
| Run ZABAL Games v0 build + promote phases (2026-06-27 -> 2026-06-29) | @Zaal + 8 players | Event | 2026-06-27 |
| **Open Snapshot vote at T+48h** with all submitted builds + auto-generated voter packet | @Zaal | Snapshot | 2026-06-29 |
| **Run results-reveal stream at T+72h** (live tally + onchain distribution) | @Zaal | Twitch | 2026-06-30 |
| Distribute USDC via 0xSplits + mint participation collectibles to all finishers | @Zaal | On-chain | 2026-06-30 (live) |
| Post-event retrospective doc (Doc 631 placeholder) | @Zaal | Doc | 2026-07-06 |
| Decide v1 - quarterly cadence or one-off? | @Zaal | Decision | 2026-07-13 |

---

## Sources

### Internal (cross-doc)

- ZAO research library docs cross-linked above
- BCZ POIDH leaderboard pattern at `bettercallzaal.com/poidh-leaderboard.json`
- Existing publish modules at `src/lib/publish/` (per Doc 354)

### External / Industry Reference

- [Empire Builder docs](https://www.empirebuilder.world/) - apiLeaderboards + distribute API for player score + prize. Verified 2026-05-09
- [Snapshot.org](https://snapshot.org/) - Onchain governance + voting platform for v0 ZABAL holder vote
- [Hats Protocol](https://docs.hatsprotocol.xyz/) - Participation collectible NFT mint mechanics on Base
- [Coinflow Checkout](https://coinflow.cash/) - Tip rail during promote window
- [0xSplits](https://0xsplits.mirror.xyz/) - USDC prize distribution contract
- [Farcaster Mini Apps docs](https://miniapps.farcaster.xyz/) - Player Option C reference
- [StreamElements docs](https://docs.streamelements.com/) - Streaming infra reference
- [Buildspace cohort model](https://buildspace.so/) - Prior art for cohort-based hackathon format
- [ETHGlobal hackathons](https://ethglobal.com/) - Multi-track judging, prize distribution model
- [Farcon hackathon track](https://farcon.com/) - Farcaster-native hackathon precedent
