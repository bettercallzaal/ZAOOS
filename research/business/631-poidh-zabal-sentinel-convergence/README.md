---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-10
related-docs: 625, 626, 627, 628, 629, 468
tier: STANDARD
---

# 631 - POIDH x $ZABAL x Sentinel: convergence map + best ideas for ZABAL's next move

> **Goal:** Single map of every working part right now (POIDH platform, Empire Builder v3, $ZABAL Empire, BCZ leaderboard hub, poidh-sentinel autonomous bot) and a ranked list of the highest-leverage moves to "bring POIDH together" for the $ZABAL ecosystem. Synthesizes docs 625-629 plus deep-dive on the new poidh-sentinel agent (`github.com/0x94t3z/poidh-sentinel`).

> **Trigger:** Zaal asked for /zao-research on the connections + best next steps after building the live leaderboard hub at `bettercallzaal.com/poidh.html` (slot 8 of $ZABAL Empire). Specifically called out poidh-sentinel as a research target.

> **Header note:** Doc 630 is taken by a parallel session ("zabal-games"). This doc claims 631.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **The big picture** | Five working parts already exist: (1) POIDH platform on-chain bounties, (2) Empire Builder v3 SmartVaults, (3) $ZABAL Empire wired to BCZ feed, (4) BCZ leaderboard hub UI live, (5) poidh-sentinel autonomous bot built by 0x94t3z. The pieces are independent but compose into one loop: ZAO members fund/issue POIDH bounties -> Sentinel auto-manages -> winners get ETH on-chain -> Empire Builder distributes ZABAL to all submitters. Move 1 is to wire Sentinel into ZAO's loop. |
| **#1 next move - DM 0x94t3z this week** | poidh-sentinel was pushed last week (2026-05-03), built for the official poidh SKILL challenge. Author handle = `mr94t3z` on Farcaster. A 5-minute cast asking about ZAO collaboration unlocks two paths: fork-with-blessing (Sentinel-for-ZAO instance) OR partner directly (his bot manages BCZ bounties + ZAO funds his work). Either path saves Zaal months of build time. |
| **#2 - Fork or sponsor a Sentinel-for-ZAO** | Vercel mini app, TypeScript, Postgres (Neon), Neynar webhooks. Free LLM tier (Cerebras / Groq / OpenRouter) means $0/mo running cost beyond Vercel + Neon free tiers. Bot wallet needs a small ETH float. Fork in a weekend; configure ZAO branding + dedicated `@zao-sentinel` bot FID; deploy to Vercel. |
| **#3 - Wire Sentinel -> ZABAL distribution atomically** | Sentinel's existing winner flow: `acceptClaim` or `submitClaimForVote` -> `resolveVote` -> `/poidh` cast. ADD a step before the final cast: call Empire Builder's `POST /api/distribute-prepare` to release ZABAL to all leaderboard entries the same moment ETH lands. One unified "you won, here's your bag" moment for the winner + "everyone got ZABAL" moment for the leaderboard. |
| **#4 - Auto-bounty pipeline for BCZ YapZ + content** | Every new YouTube episode triggers Sentinel to draft a clipping bounty (using Kenny's POIDH framework from doc 628). Drafts to Zaal's DM for one-tap approve, then the bot funds + creates the bounty. Removes the "I'll write a bounty next week" friction. |
| **#5 - Use Sentinel as the JUDGE for ZAO bounties** | Sentinel already has a 3-stage evaluator (deterministic + OCR + vision AI + LLM verdict). Score >= 60 wins. Removes Zaal's manual judging weekend - he reviews Sentinel's pick and either confirms or override. Frees ~4-6 hours per round. |
| **AI-image detection as table stakes** | Sentinel's two-pass gpt-4o forensic check is opt-in. Turn it on for ZAO bounties. Disqualify pure AI submissions automatically; flag uncertain ones for Zaal review. Costs ~$0.007 per check (gpt-4o), ~$0.07 for 10 submissions. Cheap protection. |
| **Empire boost layer to power the loop** | Doc 627 noted slot 8 booster toggles are OFF. Flip Token + Reputation ON. THEN add a NEW booster: holders of any "@poidh-sentinel built" bounty NFT get a +2x. Aligns POIDH community + ZAO directly via the empire mechanic. |
| **Cross-empire integration** | yerbearserker (EB co-founder) has built ANY booster type. Open a request: $ZABAL Empire booster that recognizes "submitted to a Sentinel-managed bounty" via Sentinel's DB. Closes the loop: be active in POIDH -> get ZABAL boost -> hold ZABAL -> get more boost on next bounty. |
| **Recurring bounty cadence** | Three-tier rhythm: WEEKLY content-clip bounties (BCZ YapZ episodes, BCZ Connect Sesh recaps), MONTHLY thematic bounties (ZAO Stock build-up, COC concert capture), QUARTERLY meta-bounties (best new POIDH bounty written for ZAO, judged by yerbearserker / Kenny). Each tier produces ZABAL distribution + leaderboard motion. |

---

## Part 1 - The Five Working Parts (visualized)

```
                                    USERS
                       (ZAO members, FC submitters, Kenny-curious)
                                      |
                     +----------------+----------------+
                     |                                 |
                     v                                 v
            +-----------------+              +--------------------+
            |   POIDH         |              |   bettercallzaal   |
            |   platform      |              |   .com/poidh.html  |
            |  (on-chain)     |              |   (the public hub) |
            |                 |              |                    |
            | bounties +      |              | live leaderboard   |
            | claims + NFTs   |              | + submission       |
            |                 |              |   gallery + R2 CTA |
            +--------+--------+              +---------+----------+
                     |                                 ^
                     | tRPC pulled                     | reads
                     v                                 |
              +------+--------+                        |
              |  refresh      |---> writes JSON files-+
              |  script       |     poidh-leaderboard.json (EB feed)
              | (BCZ repo)    |     poidh-claims.json     (page data)
              +------+--------+
                     |                                          
                     | EB pulls from                            
                     v                                          
            +--------+----------+                               
            |  Empire Builder   |                               
            |  v3 (Base SmartVault)                             
            |                   |                               
            | $ZABAL Empire     | <--- Zaal is owner            
            |  (token: 0xbB48..)|                               
            |  (vault: 0xe0fa..)|                               
            |                   |                               
            | slot 8 = POIDH    | <--- live, 13.35 ZABAL distrib
            | Submitters        |                               
            +--------+----------+                               
                     |                                          
                     | distributes ZABAL                        
                     v                                          
              SUBMITTER WALLETS                                 

         (PARALLEL TRACK - now PROPOSED to wire in)             
                                                                
            +----------------------+                            
            |  poidh-sentinel      | <--- 0x94t3z built; 
            |  (autonomous bot)    |      4 stars, prod 2026-05-03
            |                      |                            
            | Vercel mini app      |                            
            | Next.js + Postgres   |                            
            | Neynar webhooks      |                            
            | Free LLM tier        |                            
            |                      |                            
            | does:                |                            
            |  - Suggest bounties  |                            
            |  - Create on-chain   |                            
            |  - Monitor cron 1m   |                            
            |  - Eval claims (AI)  |                            
            |  - Pick winners      |                            
            |  - Pay out atomic    |                            
            |  - Cast announcements|                            
            |  - Detect AI images  |                            
            +----------+-----------+                            
                       |                                        
        proposed       |                                        
        connection ->  v                                        
              calls Empire Builder distribute-prepare           
              when winner picked = atomic ETH + ZABAL drop      
```

The five working parts loop:
1. **User submits** to a POIDH bounty in the `/poidh` channel via Sentinel mention OR directly on poidh.xyz
2. **Sentinel evaluates** every minute, picks winner when score >= 60
3. **POIDH contract** pays the ETH winner via `acceptClaim` / `resolveVote`
4. **BCZ refresh script** runs (or Cloudflare Worker on cron) to update `poidh-leaderboard.json`
5. **Empire Builder** pulls the JSON on its refresh cycle, distributes ZABAL to all leaderboard entries
6. **bettercallzaal.com/poidh.html** renders the live state (top marquees + table + gallery)
7. **Sentinel casts** the winner announcement in `/poidh` channel + cross-posts to `/zao`

---

## Part 2 - poidh-sentinel deep-dive (confirmed via README + .env.example)

### What it is

An autonomous bounty agent for POIDH, deployed as a Farcaster mini app. Lives in `/poidh` channel. Mention `@poidh-sentinel` to suggest a bounty, fund it, and have the bot create it on-chain. Cron loop continuously evaluates submissions and picks winners autonomously.

Built for the official `poidh SKILL challenge` (referenced in the poidh-app SKILL.md).

### Repo facts

| Field | Value |
|-------|-------|
| Repo | github.com/0x94t3z/poidh-sentinel |
| Stars | 4 (just shipped) |
| Last push | 2026-05-03 |
| Default branch | main |
| Language | TypeScript |
| Topics | autonomous-bot, farcaster, poidh |
| Description | "Autonomous Poidh bounty bot that creates, monitors, evaluates, and resolves real-world action bounties end-to-end" |

### Stack (from .env + README)

| Layer | Tool | Free? |
|-------|------|-------|
| Hosting | Vercel | YES (free tier) |
| Database | Postgres on Neon | YES (free tier 500MB) |
| Webhooks | Neynar (HMAC-SHA512 verified) | YES (free tier dev key) |
| Cast publishing | Neynar managed signer | YES (signer creation $1 one-time per FID) |
| Bot wallet | EOA EVM wallet (own private key) | YES (small ETH float for gas) |
| RPC | Public Base/Arbitrum/Degen RPCs | YES (paid tier optional) |
| LLM tier 1 | Cerebras / Groq | YES (free tiers) |
| LLM tier 3 | OpenRouter free models | YES |
| OCR | ocr.space (default `helloworld` key) | YES |
| Vision AI | Groq Llama-Scout / Llama-3.2-vision | YES |
| Optional vision | OpenAI gpt-4o (~$0.007/call) | NO (opt-in) |
| AI-image detection | OpenAI gpt-4o two-pass | NO (opt-in) |

**Total mandatory cost: ~$0/mo + bot wallet ETH float.** Optional OpenAI for AI-image detection adds ~$0.007/call.

### Capabilities

| Capability | What it does |
|------------|--------------|
| 1. Suggest bounty | LLM responds to mentions with creative real-world bounty ideas. Validates against digital-only tasks. |
| 2. Create on-chain | Multi-step conversation: chain (Arbitrum/Base/Degen) -> amount -> open vs solo -> deposit. Detects deposit on-chain via cron. Calls `createOpenBounty` or `createSoloBounty`. |
| 3. Monitor submissions | Cron polls every minute on all active bounties. |
| 4. Evaluate proof | 3-stage: deterministic Jaccard pre-score (-> reject < 10) -> OCR via ocr.space (always runs) -> vision AI (only if pre-score >= 20). |
| 5. Pick winner | Highest scoring valid claim (>= 60 of 100). |
| 6. Execute payout | `acceptClaim` if no external contributors; else `submitClaimForVote` -> 48h wait -> `resolveVote`. |
| 7. Announce winner | `/poidh` channel cast + reply in announcement thread with score breakdown. |
| 8. Handle community vote | Re-nominates next-best claim if vote rejected. |
| 9. Detect AI images | Mention `@poidh-sentinel is this AI?` under any cast - bot runs two-pass forensic gpt-4o, primed with thread discussion. |
| 10. Cancel + refund | `cancel bounty` reply -> deterministic confirm -> refunds via plain wallet transfer (NOT contract refund). |
| 11. Zero-submission nudges | 72h: "no submissions yet"; 7+ days: "share the link or cancel". |
| 12. AI-detection during eval | Parallel-runs AI check on every image; flags AI-generated and penalizes. |

### Smart contract operations

Contract addresses confirmed identical across BCZ usage:
- Arbitrum + Base: `0x5555Fa783936C260f77385b4E153B9725feF1719`
- Degen: `0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f`

Functions Sentinel calls:
- `createOpenBounty(name, description)` / `createSoloBounty(...)`
- `bounties(id)` for state read
- `getClaimsByBountyId(bountyId, cursor)` paginated
- `participants(bountyId, index)` for contributor enumeration
- `acceptClaim(bountyId, claimId)` for direct payout (no vote)
- `submitClaimForVote(bountyId, claimId)` to start 48h vote
- `voteClaim(bountyId, vote)` (contributors call this)
- `bountyVotingTracker(bountyId)` deadline read
- `bountyCurrentVotingClaim(bountyId)` active vote read
- `resolveVote(bountyId)` after deadline
- `cancelSoloBounty` / `cancelOpenBounty` + `claimRefundFromCancelledOpenBounty`
- `pendingWithdrawals(address)`, `withdraw()`, `withdrawTo(address)`

### Author

| Field | Value |
|-------|-------|
| GitHub | 0x94t3z |
| Farcaster | mr94t3z (per /poidh thread context) |
| Built for | poidh SKILL challenge (run by Kenny) |
| Likely location | TBD - DM via Farcaster |

---

## Part 3 - Convergence Opportunities

The five parts work independently today. Convergence is where each part's strengths cover another's gaps.

### Gap analysis

| Today's gap | Filled by |
|-------------|-----------|
| Manual bounty creation, manual judging, manual winner cast (Zaal does it all) | Sentinel handles steps 2-7 of doc 628's lifecycle |
| ZABAL distribution lags ETH payout (EB refreshes on its cycle, not the moment a winner wins) | Sentinel POSTs to EB `/api/distribute-prepare` immediately after `acceptClaim` -> atomic moment |
| Round 2 has 0 submissions; recruitment depends on Zaal's casts | Sentinel auto-suggests bounty, auto-nudges at 72h + 7d, auto-shares link |
| AI-generated submissions slip through manual review | Sentinel's gpt-4o two-pass detection runs in parallel with vision eval |
| /poidh channel doesn't talk to /zao channel for cross-discovery | Sentinel cross-posts winner casts to both |
| Empire booster slot wasted on "OFF" toggles | Flip Token + Reputation ON; Sentinel + ZAO members get amplified ZABAL |
| Single bot for one community = limited reach | Spawn Sentinel-for-FISHBOWLZ, Sentinel-for-COC, etc. - hackathon meta-bounty pays for forks |

### The atomic distribution moment (the unlock)

Today's POIDH winner flow:
```
T+0:    Sentinel calls acceptClaim() / resolveVote()
T+0:    POIDH contract pays ETH to winner
T+0:    Sentinel casts winner in /poidh
T+1:    BCZ refresh script runs (manual or cron)
T+5min: Empire Builder hits its refresh cycle
T+5min: ZABAL distributes to all submitters
```

5-minute gap between ETH and ZABAL feels disjoint - a winner sees ETH first, ZABAL drops later as a separate notification.

Proposed atomic flow:
```
T+0:  Sentinel calls acceptClaim() / resolveVote()
T+0:  POIDH contract pays ETH to winner
T+0:  Sentinel calls EB POST /api/distribute-prepare on $ZABAL Empire
T+0:  Sentinel calls EB PATCH /api/leaderboards/refresh/apiLeaderboards
T+0:  Sentinel casts ONE message: "@winner wins X ETH + leaderboard distributed Y ZABAL across N submitters"
```

One cast, one moment, one full picture. Higher narrative impact, easier to clip.

### The hackathon meta-bounty

Kenny demonstrated meta-bounties at BCZ YapZ Ep 19 (chapter 17:35). Run a ZAO meta-bounty:

> "Best fork of poidh-sentinel for a $ZABAL Empire community. Pot: 0.5 ETH + 100k ZABAL airdropped to all submitters. Judging by yerbearserker + Kenny + Zaal."

Forks: Sentinel-for-FISHBOWLZ, Sentinel-for-COC-Concertz, Sentinel-for-WaveWarZ, Sentinel-for-BCZ-YapZ specifically. Each fork brings its own community into POIDH + ZABAL Empire. The meta-bounty multiplies reach by N communities.

---

## Part 4 - Best Ideas for ZABAL (ranked by leverage)

### TIER S - do these first

**1. DM 0x94t3z this week.** Open the conversation. Either he wants to partner (Sentinel manages BCZ bounties on retainer paid in ZABAL/ETH), OR he green-lights a fork. Five-minute cast unlocks months of work. [LEVERAGE: 100x]

**2. Wire Sentinel into the $ZABAL Empire distribution loop.** When Sentinel picks a winner, also call `POST /api/distribute-prepare` on the $ZABAL Empire so ZABAL drops in the same minute. Atomic moment narrative. [LEVERAGE: 50x]

**3. Flip Token + Reputation booster toggles ON for slot 8.** Three boosters are configured (zaal Zora coin 5x, ZAAL newsletter 5x, Quotient reputation) but TOGGLED OFF. Active ecosystem holders get nothing right now. Flip them ON via the Empire dashboard. [LEVERAGE: 20x, 5-minute fix]

### TIER A - within 30 days

**4. Fork poidh-sentinel for ZAO + deploy as `@zao-sentinel` Farcaster bot.** Vercel + Neon + Neynar = $0/mo. Bot wallet 0.05 ETH float. Run it on `/zao` channel for ZAO-specific bounties (BCZ YapZ clips, ZAO Stock recaps, fractal reflections). [LEVERAGE: 10x, weekend build]

**5. Auto-clipping pipeline for BCZ YapZ episodes.** New YouTube upload -> Zaal DM "draft a clipping bounty" -> Sentinel suggests title + description in POIDH framework -> Zaal one-tap approves -> bounty live. Removes the "next bounty when I have time" friction. [LEVERAGE: 8x]

**6. Auto-cancel + refund flow on the BCZ leaderboard hub.** poidh-sentinel ships this; reuse the pattern. Lets Zaal cancel via simple Farcaster reply ("cancel bounty") instead of clicking through to POIDH. [LEVERAGE: 4x]

**7. AI-image detection on every submission.** ENABLE_OPENAI_AI_DETECTION=true on the bot. Costs ~$0.007/check, ~$0.07 for 10 submissions. Cheap protection against AI slop without slowing eval. [LEVERAGE: 4x]

### TIER B - quarterly bets

**8. Run a Sentinel-fork hackathon as a ZAO meta-bounty.** "Best Sentinel fork for any $ZABAL Empire community. Pot: 0.5 ETH + 100k ZABAL." Multiplies POIDH adoption across FISHBOWLZ, COC, WaveWarZ, etc. Kenny + yerbearserker as co-judges aligns the three founders. [LEVERAGE: 20x at delivery]

**9. Add a "Sentinel activity" panel to bettercallzaal.com/poidh.html.** Shows the bot's last 10 actions (bounty created, submission evaluated, winner picked, ZABAL distributed). Live transparency layer. [LEVERAGE: 3x]

**10. Cross-empire boosters via a "$ZABAL holder boost on Sentinel-managed bounties".** Coordination with yerbearserker + 0x94t3z. ZABAL holders auto get 2x evaluation score weight on Sentinel decisions. Closes the loop: hold ZABAL -> better leaderboard ranking -> more ZABAL. [LEVERAGE: 8x at delivery, 2 conversations]

### TIER C - speculative

**11. Build a "ZAO Bounty Office" Farcaster mini app on top of Sentinel.** Single dashboard showing all $ZABAL Empire bounties (across forks if hackathon ships) + leaderboards + treasury distribution flows. Becomes the navigation hub for the whole ZAO bounty layer.

**12. Spin up a Sentinel staking layer.** Activate native staking on $ZABAL Empire (per doc 627 Part 4). Stakers get +5x boost on Sentinel-managed bounty leaderboards. Pulls ZABAL out of float into long lockups, reduces sell pressure.

**13. Treasury raffles via Sentinel.** Weekly: Sentinel runs a raffle distribution from the empire treasury to a random Top 100 leaderboard entry. Adds excitement on slow weeks between big bounties.

**14. POIDH + Quotient cross-pollination.** Quotient.social reputation already pluggable as a booster. Add a Quotient leaderboard alongside the api-leaderboard. Top-rep accounts get pre-screened submissions surfaced first.

---

## Part 5 - Recommended Next Steps (priority order)

| # | Action | Owner | When | Cost |
|---|--------|-------|------|------|
| 1 | Cast on Farcaster: "@mr94t3z curious if you'd partner with $ZABAL Empire on Sentinel for ZAO bounties - or bless a fork. Either way, pot's growing." | @Zaal | Today | 0 |
| 2 | Flip Token + Reputation boosters ON for slot 8 leaderboard via Empire dashboard | @Zaal | Today | gas (~$0.10) |
| 3 | Accept @cryptfi-mariano's claim 6368 on bounty 1151 from issuer wallet (still pending) | @Zaal | Today | gas + 2.5% protocol fee |
| 4 | Read poidh-sentinel `src/` directory + Vercel deploy guide; map fork plan | @Zaal / @ClaudeBot | This week | 0 |
| 5 | Reach out to yerbearserker about cross-empire booster mechanism for Sentinel-managed wallets | @Zaal | This week | 0 |
| 6 | Spec the atomic-distribution wiring: where Sentinel calls EB distribute-prepare in its winner flow | @Zaal | Next week | 0 (design doc) |
| 7 | Fork poidh-sentinel; configure ZAO branding + bot FID + bot wallet; deploy to Vercel | @Zaal / @ClaudeBot | Next 2 weeks | $1 FID reg + ~0.05 ETH wallet float |
| 8 | Draft Round 3 as a meta-bounty: "best Sentinel fork for any ZABAL community" | @Zaal | After Round 2 winner | TBD pot |
| 9 | Add Sentinel activity panel to bettercallzaal.com/poidh.html (live last-10 actions) | @Zaal / @ClaudeBot | Once Sentinel-for-ZAO is live | 0 |
| 10 | Re-validate this map in 30 days | @Zaal | 2026-06-10 | 0 |

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Working parts mapped | 5 (POIDH, EB v3, $ZABAL Empire, BCZ hub, Sentinel) |
| Sentinel repo last push | 2026-05-03 |
| Sentinel stars | 4 |
| Sentinel monthly cost | $0 mandatory (Vercel + Neon + Neynar free; bot wallet ETH float) |
| Sentinel optional cost | ~$0.007/call for OpenAI AI-image detection |
| LLM tiers | 3 (Cerebras / Groq / OpenRouter free) + optional OpenAI |
| Vision tiers | 3 (Groq Llama-Scout / Groq Llama-3.2-vision / OpenRouter Qwen) |
| Cron interval | 1 minute |
| Min open duration before eval | 72 hours |
| Vote window after `submitClaimForVote` | 48 hours |
| Eval cooldown after "none qualified" | 6 hours |
| Re-nudge cadence | 72h, then every 48h after 7d zero submissions |
| Winning threshold | score >= 60 of 100 |
| Spam-signal penalty | -40 per match |
| Digital-only signal penalty | -25 per match |
| Vision score gate | >= 20 deterministic pre-score |
| Best ideas listed | 14 (split across S/A/B/C tiers) |
| Recommended next steps | 10 |
| Top 3 Tier S leverage estimate | 100x + 50x + 20x |

---

## Sources

- [poidh-sentinel repo](https://github.com/0x94t3z/poidh-sentinel) - prod 2026-05-03
- [poidh-sentinel README.md](https://github.com/0x94t3z/poidh-sentinel/blob/main/README.md) - 64KB, full architecture spec
- [poidh-sentinel .env.example](https://github.com/0x94t3z/poidh-sentinel/blob/main/.env.example) - confirms free-tier-first stack
- [poidh-app SKILL.md](https://github.com/picsoritdidnthappen/poidh-app/blob/prod/SKILL.md) - the SKILL challenge that motivated Sentinel
- Doc 625 - POIDH x ZAO bounty playbook
- Doc 626 - Empire Builder + ZABAL POIDH airdrop architecture
- Doc 627 - $ZABAL Empire ground truth + EB v3 capabilities
- Doc 628 - Bounty-writing + integration learnings (POIDH framework)
- Doc 629 - POIDH x $ZABAL leaderboard data architecture
- Doc 468 - POIDH Farcaster bot architecture (the design doc; Sentinel is the existing impl that supersedes it)
- BCZ live: bettercallzaal.com/poidh.html (slot 8 of $ZABAL Empire)
- Empire Builder skill at empirebuilder.world/skill/SKILL.md (lastUpdated 2026-05-04)

Verified URLs 2026-05-10: poidh-sentinel repo accessible via GitHub API; Empire Builder live read endpoint returning 8 leaderboards; bettercallzaal.com/poidh-claims.json regenerated cleanly.

---

## Also See

- Doc 628 - meta heuristics (apply to Sentinel-fork bounty writing)
- Doc 627 - empire ground truth (where the cross-wiring lands)
- Doc 626 - integration architecture (the BCZ feed direction)
- Doc 468 - the bot design doc Sentinel implements (pre-empted)

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Cast at @mr94t3z asking about Sentinel collaboration / blessing for ZAO fork | @Zaal | Farcaster cast/DM | Today |
| Flip Token + Reputation booster toggles ON for slot 8 via Empire dashboard | @Zaal | UI signed action | Today |
| Accept @cryptfi-mariano claim 6368 to close Round 1 | @Zaal | POIDH app tap | Today |
| Read full poidh-sentinel `src/` to understand the fork surface (agent.ts, conversation-state.ts, bounty-loop.ts, deposit-checker.ts, submission-evaluator.ts) | @ClaudeBot | Code read + summary | This week |
| If 0x94t3z agrees to fork: clone, configure ZAO branding + bot FID + Neon DB + bot wallet, deploy to Vercel | @Zaal | Build | Next 2 weeks |
| Spec the atomic distribution call (Sentinel -> EB distribute-prepare integration point) | @Zaal | Design | Next 2 weeks |
| Draft Round 3 meta-bounty for best Sentinel fork across $ZABAL Empire communities | @Zaal | Bounty text | After Round 2 winner |
| Re-validate this map + Sentinel feature surface in 30 days | @Zaal | Doc update | 2026-06-10 |
