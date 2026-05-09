---
topic: events
type: guide
status: draft
last-validated: 2026-05-09
related-docs: 627, 628, 629, 626, 625, 361, 324, 322, 354, 311
tier: STANDARD
---

# 630 - ZABAL Games v0: Claude Code Hackathon (8 Players, 24h Build + 24h Promote)

> **Goal:** Define the inaugural ZABAL Games - an 8-player Claude Code hackathon where every participant gets the same prompt at the same time, builds in public on Twitch for 24 hours, then promotes for 24 hours. Winners take USDC + ZABAL + on-chain artifacts. The Games dogfood the ZAO streaming flywheel (Doc 629), the Web3 streaming bridge (Doc 628), and put 8 new builders on the Empire Builder leaderboard simultaneously.

> **Status:** DRAFT - Zaal locked in format (24h+24h), prize (Treasury USDC + ZABAL), prompt scope (3-5 ideas), and timing (late June 2026) on 2026-05-09. Open: idea-option finalization, sponsorship sourcing, judge panel, application form copy.

---

## Key Decisions (Locked 2026-05-09)

| Decision | Locked Choice |
|----------|--------------|
| **Format** | 24h build + 24h promote (48h total) |
| **Prize structure** | Treasury USDC + ZABAL bag + on-chain artifacts (booster ID + Hats role for winner) |
| **Prompt scope** | 3-5 idea options inside the prompt, players pick or remix |
| **Date window** | 2026-06-27 Sat 12:00 PT -> 2026-06-29 Mon 12:00 PT (7 weeks out) |
| **Player count** | 8 players + waitlist |
| **Public on-chain rail** | Empire Builder apiLeaderboard scores stream activity in real time (per Doc 628) |
| **Stream platform** | Twitch primary, ZAO restream to /zabalgames hub on ZAO OS + YouTube via Doc 629 flywheel |

---

## Open Calls (Need Zaal Input)

| Question | Options |
|----------|---------|
| Final 5 idea options in the prompt (Part 4 below) | Refine list - which 5 ship? |
| Total USDC prize pool | $1750 (1st $1000 / 2nd $500 / 3rd $250) or scale up if sponsors? |
| Sponsors? | Empire Builder, SongJam, COC Concertz, external? |
| Judges | 3-5 person panel - candidates: Zaal, Adrian (Empire Builder), yerbearserker, Adam (SongJam), 1 community pick |
| Application gate | Open public, ZAO-member-only, or invite + apply? |
| Stream cadence requirement | Must stream 100% of build, 50%, or just before-and-after demos? |
| Solo only or teams of 2 allowed? | Solo recommended for v0; teams in v1 |
| Live judging stream | Yes (post-promote-window 1hr live judging on Twitch) or async + announce? |

---

## Part 1 - Format Spec

### Timeline

```
T-7 days (2026-06-20)   Applications close. Final 8 selected. Waitlist confirmed.
T-3 days (2026-06-24)   Onboarding call (90 min): rules, infra, Empire wallet setup,
                        wallet linkage to Twitch handle, Coinflow tip page setup
T-1 day  (2026-06-26)   Final tech check. Each player tests Twitch stream key,
                        Empire booster eligibility, Coinflow checkout link

T+0      (2026-06-27 12:00 PT Sat)
                        PROMPT DROPS simultaneously to all 8
                        Same prompt PDF + GitHub gist with 5 idea options
                        Build window opens. Streams must start within 30 min

T+0 -> T+24h            BUILD WINDOW (Sat 12:00 PT -> Sun 12:00 PT)
                        Player streams on Twitch
                        ZAO restreams all 8 to /zabalgames hub page on ZAO OS
                        Empire Builder live leaderboard scores stream events
                        StreamElements alerts trigger ZABAL drops to viewers (per Doc 628)
                        Streaming flywheel auto-clips highlights to YouTube + shorts
                        Coding happens in Claude Code, build in public (open repos)

T+24h    (2026-06-28 12:00 PT Sun)
                        SHIP DEADLINE
                        Required submissions:
                          - Live deployed URL
                          - GitHub repo link (public)
                          - 60-second demo video link
                          - Tweet/cast announcing ship

T+24h -> T+48h          PROMOTE WINDOW (Sun 12:00 PT -> Mon 12:00 PT)
                        Players promote on all surfaces
                        Tips during this window count via 0xSplits + Coinflow
                        ZAO accounts amplify all 8 (we want all of them to win)
                        Empire Builder scores: cast engagement + tips received

T+48h    (2026-06-29 12:00 PT Mon)
                        Submission window closes
                        Live judging stream on Twitch (1 hour)
                        Winners announced
                        On-chain prize distribution starts:
                          - USDC via 0xSplits to winner wallets
                          - ZABAL via Empire Builder distribute API
                          - Hats Protocol Champion NFT minted to 1st place
                          - Empire booster ID configured for top 3
```

### Why 24+24 (not single 24h)

- "Single 24h ship+promote" rewards shallow output - whoever ships fastest gets max promote time
- "24+24" forces TWO disciplines (build AND distribute), maps to real-world product reality
- Splits viewer attention into two narrative arcs: drama (build) + payoff (promote)
- Lets ZAO content engine (Doc 629) clip the build for the promote window

---

## Part 2 - The Prompt (What Players Get)

### Prompt Bundle

Each player receives identical materials at T+0:

1. **CONTEXT.md** - ZAO ecosystem primer
   - What ZAO is (188 members, Farcaster music community)
   - What ZABAL Empire is (token + Empire Builder leaderboard)
   - Existing ecosystem brands (BCZ, COC Concertz, FISHBOWLZ, WaveWarZ)
   - Tech stack baseline (Next.js, Supabase, Farcaster mini apps, Base)
   - Links to docs: this doc (630), 628 (web3 streaming), 626 (Empire Builder), 627 (streaming infra)

2. **CLAUDE.md** - Repo-level Claude Code instructions
   - Brand naming rules (WaveWarZ not Wave Wars, etc per BCZ CLAUDE.md)
   - Build conventions (no emojis, no em dashes, mobile-first)
   - Brand colors (ZAO orange/cyan/gold, dark bg)
   - Tooling baseline

3. **OPTIONS.md** - The 5 build options (see Part 4)

4. **STARTER_KIT/** - Bootstrap repo
   - Next.js 16 starter with Tailwind v4 + Farcaster mini-app SDK
   - `.env.example` with named placeholder for Empire Builder, Neynar, Supabase
   - Sample API route hitting Empire Builder personal-stats endpoint
   - Pre-wired wagmi + Coinbase Smart Wallet

5. **JUDGING.md** - 4-axis rubric (Part 5)

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

## Part 3 - Onboarding (T-3 days)

90-minute call. Must attend OR forfeit. Walks through:

1. Rules (5 min)
2. Stream setup help - Twitch + StreamElements + OBS (15 min) - reuse Doc 627
3. Wallet linkage - connect Farcaster verified address to Twitch handle (10 min)
4. Empire Builder wallet eligibility check (5 min)
5. Coinflow tip page setup (10 min)
6. Live judging walkthrough (10 min)
7. Q&A (35 min)

Recorded for waitlist replacements + future v1 reference.

---

## Part 4 - The 5 Idea Options (DRAFT - Need Zaal Refinement)

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

## Part 5 - Judging (4-Axis Rubric, 100 Points Total)

| Axis | Weight | Criteria |
|------|--------|----------|
| **Works** | 25 pts | Deployed and demoable. Doesn't crash on judge laptop. Core feature functions end-to-end. |
| **ZAO-native** | 25 pts | Actually uses ZABAL, Empire, Farcaster verified address, Bonfire, Hats, EAS, Hypersub, or Coinflow. The more rails wired, the higher the score. Surface-level "we used the brand" doesn't count. |
| **Stream presence** | 25 pts | Build stream watchable + entertaining. Demo crisp. Clip-worthy moments. (Streaming flywheel from Doc 629 ingests these clips for the promote phase regardless of judge score) |
| **Distribution** | 25 pts | Promote-window traction: cast engagement + tips received via Coinflow + viewers during promote stream + GitHub stars |

### Tiebreaker
**ZAO community vote** - 24h Snapshot vote among ZABAL holders during the judging window. Adds up to 10 bonus points (110 max possible).

### Judge Panel
3-5 person panel. Candidates (TBD):
- @Zaal (BCZ)
- Adrian (Empire Builder co-founder)
- yerbearserker (Empire Builder co-creator + ZABAL co-creator)
- Adam (SongJam)
- 1 community-elected judge (ZABAL holders nominate + vote 7 days prior)

---

## Part 6 - Prize Structure

### Locked-in: Treasury USDC + ZABAL + On-Chain Artifacts

| Place | USDC | ZABAL | On-chain artifacts |
|-------|------|-------|-------------------|
| **1st** | $1,000 | 50,000,000 | Hats "ZABAL Games Champion v0" NFT + custom Empire Booster ID named after them + COC Concertz featured stream slot + permanent /zabalgames hall-of-fame entry |
| **2nd** | $500 | 25,000,000 | Custom Empire Booster ID + hall-of-fame entry |
| **3rd** | $250 | 10,000,000 | Hall-of-fame entry |
| **4th-8th (participation)** | n/a | 5,000,000 each | Optional Hats "ZABAL Games Finisher v0" NFT |

### Total Pool

- **USDC:** $1,750 from ZAO treasury (or sponsor pool if secured)
- **ZABAL:** 110M total across podium + 25M participation = 135M ZABAL
  - At current $0.0000001429 / ZABAL = ~$19 USD value today
  - Bet: ZABAL appreciates over time = retroactively bigger prize

### Distribution

- USDC routed via 0xSplits contract on Base for transparency
- ZABAL via Empire Builder distribute API (per Doc 361 / 626)
- Hats NFT minted on Base to verified Farcaster address
- Empire Booster ID configured by yerbearserker post-judging

### Participation Floor

Every player who finishes (ships SOMETHING by T+48h) gets the 5M ZABAL participation bag. No-show = no bag. Encourages finishing over giving up.

---

## Part 7 - Infrastructure (What ZAO Provides)

### For Players

| Resource | Provided | Notes |
|----------|----------|-------|
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
| `bettercallzaal.com/zabalgames` (or `zaoos.com/zabalgames`) | Public landing page with live leaderboard, all 8 stream embeds, prize pool, schedule |
| ZAO OS dashboard widget | "ZABAL Games Live" panel for ZAO members |
| Twitch restream account | `@zabalgames` aggregating all 8 player streams via Restream multi-cam |
| Empire Builder apiLeaderboard | `zabalgames-v0` leaderboard pulling player score JSON every 15 min |
| Streaming flywheel | Doc 629 pipeline auto-clips top moments from each player's stream |

---

## Part 8 - Promotion Plan (Pre-Event)

### T-7 Weeks (Today, 2026-05-09)

- Doc 630 published (this doc)
- Initial Farcaster cast in /zao announcing ZABAL Games coming
- DM Adrian + yerbearserker to confirm Empire Builder support + judge participation

### T-6 Weeks (2026-05-16)

- Public application form on `bettercallzaal.com/zabalgames`
- Twitter/X + Farcaster + LinkedIn announcement thread
- Confirm sponsor outreach (Empire Builder, SongJam, others)

### T-4 Weeks (2026-05-30)

- Applications close (or rolling)
- Final 8 announced via Farcaster cast
- "Meet the players" stream on BCZ Twitch (8x 5-min intros)

### T-3 Weeks (2026-06-06)

- Tech infra dry-run: dummy player runs the full pipeline solo
- Fix bugs surfaced by dry-run

### T-1 Week (2026-06-20)

- Final logistics confirmed
- Onboarding call calendar invite
- Hype campaign (1 cast/day on /zabalgames channel)

### T-3 Days (2026-06-24)

- 90-min onboarding call (per Part 3)
- Recorded + posted

### T-0 (2026-06-27)

- 12:00 PT prompt drop
- Live host stream on BCZ Twitch narrating start

---

## Part 9 - Risks + Mitigations

| Risk | Mitigation |
|------|------------|
| <8 applicants | Open public; offer 1M ZABAL bonus to first 16 applicants |
| Player drops mid-build | Waitlist 4 deep, auto-promote at T-1d if confirmed dropout |
| Twitch ToS issue (third-party tipping) | Coinflow tip happens off-stream via posted link; not in violation |
| Cheating (pre-built code) | Mandate empty starter repo at T+0 + verified empty git log; spot-check via stream review |
| One player dominates with massive existing audience | Distribution score caps growth at 25 pts; total weighted by 4 axes prevents single-axis sweep |
| Empire Builder API rate-limit during 8 simultaneous polls | Coordinate with Adrian; throttle to 1 poll/min per player |
| StreamElements WebSocket flood | If event volume > 1k/min, batch via Cloudflare Queues |
| ZAO treasury USDC liquidity | Secure $1750 USDC in dedicated wallet 7 days prior |
| Judges dispute / no-show | Pre-record judge availability; redundant 5 panel = 3-of-5 quorum needed |
| Bot tip farming | Tip score requires verified Farcaster address ($25 hold + linked X/phone/GH) |
| Player builds something unethical | Code-of-conduct in onboarding; right to disqualify |

---

## Part 10 - v1 Iteration Ideas (Post-v0 Retrospective)

After ZABAL Games v0 ships and a retro is run (Doc 631 placeholder):

| v1 Idea | Why |
|---------|-----|
| Teams of 2 allowed | Doubles output, surfaces collab vibes |
| Global timezone variants | Run parallel ZABAL Games in EU/Asia weekend, single global winner |
| Sponsor tracks | Each sponsor (Empire Builder, SongJam, COC) sponsors a track with their own prize on top |
| Ongoing weekly mini-games | Smaller 12-hour events between full Games |
| Open tournament | Top 8 finishers across multiple Games qualify for an annual ZABAL Games Cup |
| AI-judge augment | Claude reviews code + UX, contributes 10% of score (kept under human judge oversight) |
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
| DM Adrian + yerbearserker - confirm Empire Builder support + judge willingness | @Zaal | DM | 2026-05-12 |
| Refine final 5 idea options (Part 4) - get input from Adam (SongJam) on Option D ZOE-skill scope | @Zaal | Doc edit | 2026-05-16 |
| Confirm $1750 USDC ZAO treasury allocation OR secure sponsor pool | @Zaal | Treasury | 2026-05-16 |
| Build `bettercallzaal.com/zabalgames` landing page (static, applications form) | @Zaal | PR (BCZ) | 2026-05-23 |
| Open public applications via Farcaster/X/LinkedIn announcement | @Zaal | Cast/post | 2026-05-23 |
| Reach 16+ applications (over-subscribe to filter) | @Zaal | Outreach | 2026-06-06 |
| Final 8 selection + waitlist 4 | @Zaal | Decision | 2026-06-13 |
| Tech dry-run with dummy player | @Zaal | Test | 2026-06-13 |
| Fix dry-run bugs in pipeline | @Zaal | PR | 2026-06-20 |
| Onboarding call (90 min) | @Zaal + 8 players | Calendar | 2026-06-24 |
| Pre-fund 8 Privy agent wallets ($5 ETH each on Base) | @Zaal | Wallet | 2026-06-26 |
| Schedule 8 sealed prompt-drop tweets for 2026-06-27 12:00 PT | @Zaal | Schedule | 2026-06-26 |
| Run ZABAL Games v0 (2026-06-27 -> 2026-06-29) | @Zaal + 8 players + judges | Event | 2026-06-27 |
| Post-event retrospective doc (Doc 631 placeholder) | @Zaal | Doc | 2026-07-06 |
| Distribute prizes (USDC via 0xSplits, ZABAL via Empire Builder, Hats NFT mint) | @Zaal | On-chain | 2026-06-29 (live) + 2026-07-01 cleanup |
| Decide v1 - quarterly cadence or one-off? | @Zaal | Decision | 2026-07-13 |

---

## Sources

### Internal (cross-doc)

- ZAO research library docs cross-linked above
- BCZ POIDH leaderboard pattern at `bettercallzaal.com/poidh-leaderboard.json`
- Existing publish modules at `src/lib/publish/` (per Doc 354)

### External / Industry Reference

- [Empire Builder docs](https://www.empirebuilder.world/) - apiLeaderboards + distribute API for player score + prize. Verified 2026-05-09
- [Hats Protocol](https://docs.hatsprotocol.xyz/) - Champion NFT mint mechanics on Base
- [Coinflow Checkout](https://coinflow.cash/) - Tip rail during promote window
- [0xSplits](https://0xsplits.mirror.xyz/) - USDC prize distribution contract
- [Farcaster Mini Apps docs](https://miniapps.farcaster.xyz/) - Player Option C reference
- [StreamElements docs](https://docs.streamelements.com/) - Streaming infra reference
- [Buildspace cohort model](https://buildspace.so/) - Prior art for cohort-based hackathon format
- [ETHGlobal hackathons](https://ethglobal.com/) - Multi-track judging, prize distribution model
- [Farcon hackathon track](https://farcon.com/) - Farcaster-native hackathon precedent
