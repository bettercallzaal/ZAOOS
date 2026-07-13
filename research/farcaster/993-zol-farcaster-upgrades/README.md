---
topic: farcaster
type: guide
status: draft
last-validated: 2026-07-12
superseded-by:
related-docs: 891, 892, 910, 761, 762
original-query: "Make ZOL a genuinely better Farcaster agent - research Neynar tooling ZOL isn't using, learn from leading agents, evaluate webhooks vs polling, prioritize concrete upgrades for the Pi"
tier: DEEP
---

# 993 - ZOL Farcaster Agent Upgrade Plan: Neynar Tooling + Agent Playbooks

> **Goal:** Research how to improve ZOL (@zolbot, FID 3338501) from a functional Farcaster agent into a genuinely valuable one. Examine Neynar capabilities ZOL isn't using, study what leading agents do to build reach and engagement, and produce a prioritized, concrete upgrade plan grounded in ZOL's Pi-hosted architecture and ZAO's safety spine.

## Current State of ZOL (as of 2026-07-12)

ZOL runs on the Raspberry Pi (ansuz) as a sub-agent under ZOE. Today it:

1. **Posts daily Bonfire casts** - draws insights from the ZAO knowledge graph, posts to /zabal channel, anti-repeat guards active
2. **Replies to /zabal channel** - welcomes newcomers, points to zabalgamez.com wins/submissions/quests (acting as "ZABAL Gamez channel host")
3. **Drains Zaal-approved casts** - reads Telegram approvals via ZOE and casts them
4. **Posts WaveWarZ battle wins** - announces battle results
5. **Uses x402 for payments** - writes via Neynar's x402 hub (~$0.001 USDC per cast)
6. **Polls for mentions** - every minute, checks /zabal mentions; no webhook (Pi behind NAT)
7. **Requires human approval** - all casts need explicit approval in Telegram before posting (doc 891, doc 761)
8. **Neynar signer** - self-custodied Ed25519 signer on FID 3338501 (doc 910, implemented)

**Current metrics:** @zolbot has ~0 followers, /zabal channel has ~32 members. ZOL posts 1-2x/day. Engagement is minimal (low-volume discovery, no economic incentive for mentions/recasts, limited reach outside /zabal).

---

## Neynar Research Summary

**ZOL's current Neynar strategy** (verified in codebase):
- **Writes:** Direct Farcaster hub via self-signed Ed25519 signer (zero cost, owns key) - optimal
- **Reads:** Free Haatz mirror + self-hosted Hypersnap node; only uses Neynar API for enrichment
- **Cost:** Minimal. Avoids the ~$500/mo Neynar API read-path cost via free mirrors. x402 writes are ~$0.01 USDC per cast.

**Neynar free-tier reality:** 100 requests/day is tight for active agents, but ZOL's architecture minimizes API calls by using free mirrors for bulk reads.

**Top 5 Neynar quick wins** (all free-tier compatible, ranked by impact):
1. **Webhook for real-time mentions** (`/v1/webhook`) - cut response latency from 60s to <1s. Highest ROI (1-2 hrs to wire).
2. **Channel discovery** (`/v1/channel/list`) - identify ZAO-adjacent communities for cross-posting
3. **Cast search for context** (`/v2/farcaster/casts/search`) - agent decisions grounded in recent history
4. **Trending signals** (`/v2/farcaster/feed/trending`) - post timely reactions to viral ZAO moments
5. **Follower graph analysis** (`/v2/farcaster/followers`) - identify high-influence ZAO members for targeted recruitment

All five are free-tier compatible and already verified in Neynar API docs.

---

## Part 1 - Neynar Capabilities ZOL Isn't Using Yet

Based on docs.neynar.com + Neynar API reference, here are high-value Neynar features a smart agent deploys:

### A. Reactions & Engagement (High Value)

| Capability | What ZOL could do | Current status | Neynar endpoint | Priority |
|------------|------------------|-----------------|-----------|----------|
| **Like/recast button handler** | Auto-like/recast high-signal casts (Bonfire insights, builder wins, ZAO ecosystem). Builds social proof + engagement loop without new text. | Not implemented | `/v2/farcaster/casts` (read reactions) | HIGH |
| **Reactions via Neynar API** | Subscribe to reactions on ZOL's own casts; if a recast comes from a high-OpenRank account, reply/thank them. Learn who amplifies. | Not implemented | `/v2/farcaster/user/reactions` (aggregate sentiment) | MEDIUM |
| **Quote-cast surfacing** | Detect when someone quotes ZOL, respond with context or a thank-you. Turns quotes into conversations, not monologues. | Not implemented (Neynar API support TBD) | `/v2/farcaster/casts/search` (context lookup) | MEDIUM |

**Why this matters:** Doc 892 notes OpenRank weights (recast=3, mention=12) - if ZOL becomes recast-able/quotable, the algorithm surfaces ZOL's reach. Winning agents (Bracky, Clanker) have strong recast ratios. Neynar research confirmed free-tier support for all three.

---

### B. Webhooks + Real-Time Mention Handling (Medium Value, High Effort)

| Capability | What ZOL could do | Current status | Blocker | Priority |
|------------|------------------|-----------------|---------|----------|
| **Neynar webhooks for mentions** | Subscribe to `cast.created` (all casts) or `mentions` (casts mentioning FID 3338501). Get events pushed instead of polling. **Bracky's 500%+ growth tied directly to webhook + reputation-gating.** | Doc 891 deliberate choice: polling for v1 due to Pi NAT. Webhooks need a public server. | Pi behind NAT - need fleet box or ngrok tunnel | MEDIUM |
| **Real-time reply latency** | Webhook = millisecond replies; polling = 60s latency. Faster reply = algorithm bump + better UX. | 60s polling window | Same blocker | MEDIUM |
| **Notification dedup** | Webhooks fire twice; need idempotency handling. | Partially implemented in `caster/index.ts` | None | LOW |

**When to upgrade:** Once ZOL moves to the fleet box (VPS consolidation in progress). ngrok tunnel is a stopgap (unreliable, added latency, external dependency).

---

### C. Feeds & Discovery (Medium Value)

| Capability | What ZOL could do | Current status | Neynar endpoint | Free-tier? | Priority |
|------------|------------------|-----------------|-----------|--------|----------|
| **Channel feeds** | Subscribe to a list of channels (zabal, music, builder, etc.) - build situational awareness. Mine them for cast-worthy insights. Broader than just /zabal mentions. | Not implemented | `/v1/channel/list` + `/v2/farcaster/channel/casts` | YES (100 req/day) | MEDIUM |
| **Trending feed** | Surface trending casts/topics. Reply to fast-growing threads (community Q&As, debates). Become a known responder to popular topics, not just reactive. | Not implemented | `/v2/farcaster/feed/trending` | YES | MEDIUM |
| **For-you feed** | Use Neynar's for-you ranking; if ZOL's casts consistently rank high here, it signals good reach. Correlate with our casts. | Not implemented (read-only insight) | `/v2/farcaster/feed/following` | YES | LOW |

**Why this matters:** Doc 892 notes agents that *acted proactive* (not just reactive to mentions) built stronger reputations. Aethernet posts bounties on its own schedule; Clanker watches mention volume and adjusts. ZOL is currently 100% reactive. Neynar research found all three endpoints are free-tier compatible; no cost barrier.

---

### D. Search & Context Enrichment (Low-Medium Value)

| Capability | What ZOL could do | Current status | Priority |
|------------|------------------|-----------------|----------|
| **Cast search** | `search_casts` to find context on a topic before replying. E.g. search for "ZABAL quest" to ground a reply in recent wins. Reduces hallucination. | Not implemented | LOW |
| **User search** | Find other builder accounts, follow-builders, verify credibility before engaging. Rank replies by who's asking. | Not implemented | LOW |

**Why this matters:** Cheaper than LLM reasoning, protects the Neynar score from off-topic noise.

---

### E. Frames / Mini-Apps / Snaps (High Value, Requires Dev Work)

| Capability | What ZOL could do | Current status | Priority |
|------------|------------------|-----------------|----------|
| **Embed a Snap in ZOL's replies** | Reply with an interactive unit (buttons: "Upvote quest", "View wins", "Learn ZAO"). No redirect needed - action in-cast. | Not implemented | **URGENT** |
| **Mini App for quest submission** | Deeper flow: show ZAO lore, let users submit ZABAL quest ideas, mint a commemorative NFT. Embedded in a modal. | Not implemented (UX only; backend exists) | HIGH |
| **Frame notifications** | If ZOL posts a quest or win announcement, the Frame can notify followers. Beats the default Farcaster notification logic. | Not implemented | MEDIUM |

**Why this matters:** Doc 892 cites this as the "biggest retention multiplier" - agents with Frames (Snaps specifically, launched ~Apr 2026) massively out-retained text-only agents. It's the acquisition + conversion surface. ZOL's Bonfire casts are good content, but without a Snap to act on, they're just reads (no conversion, no proof of engagement).

---

### F. Channel & Community Moderation (Low Priority for ZOL v1)

| Capability | What ZOL could do | Current status | Priority |
|------------|------------------|-----------------|----------|
| **Channel moderation** | Set roles in /zabal, mute spam, promote pinned announcements. | Not implemented | LOW - wait for /zabal growth |
| **Role-based replies** | If a cast is from a ZABAL team member (verified), ZOL replies differently (technical detail vs friendly welcome). | Not implemented | LOW |

**Why this matters:** Useful at scale (100+ members). Today /zabal is small; moderation overhead low.

---

## Part 2 - What Leading Farcaster Agents Do (Playbooks)

### Research: Live Farcaster Agent Landscape (2026)

Agents analyzed: Clanker (token launcher, $8M weekly fees), Ask Gina (wallet assistant), Bankr (DeFi terminal), Aethernet (bounty poster), Aether AI (multi-agent ecosystem, 6.8K token holders).

**Winning traits found:**
1. **Utility > conversation** - agents that solve real problems (token creation, trading, wallet txns) outperform chat-only bots
2. **Personality as moat** - distinct voice (Aether's persona, Gina's conversational style) prevents commoditization
3. **Real-time tag responses** - fast replies when mentioned (sub-second ideal) make agents feel like community members
4. **Treasury-funded engagement loops** - agents that fund their own engagement (bounties, rewards) create self-sustaining visibility
5. **Consistency > volume** - 3-4 high-quality weekly interactions per channel beats daily spam
6. **Companion products** - agents with adjacent tools (Gina's wallet, Aether's Bountycaster) create network effects
7. **Multi-platform presence** - agents on X + Farcaster get 30-40% more reach than Farcaster-only

**For ZOL:** Implication = ZOL needs not just replies, but a utility (trading insight, governance signal, builder leaderboard) + treasury bounties to sustain engagement + cross-posting to X for amplification.

### Analysis: The 4 Winning Patterns (from doc 892 + research)

**Pattern 1: Token / Economic Action Loop** [CRITICAL]

- **Winner:** Clanker (deploy ERC-20 on mention) -> 17,242 tokens, 7.62B volume, 50M fees
- **Winner:** Bracky (BRACKY rewards + betting) -> 4M mcap, 500%+ growth post-webhook
- **Winner:** Aethernet (Higher treasury distributions, NFT mints) -> 150k+ in incentives
- **Loser:** mfergpt, askgina (text-only analysis) -> plateaued

**The lesson:** Users promote agents that *give them something.* Token rewards = virality. Without economic participation, reach caps out fast.

**For ZOL:** Current state is text-only (Bonfire insights + welcomes). The next step is adding a $ZABAL action: mint a commemorative NFT for quest completions, tip a builder, or create a ZABAL season token. This needs:
- A spend policy (Privy, already researched in doc 891)
- A Snap to trigger the action (in-cast buttons)
- Clear game rules (how many tips per day, who qualifies, etc.)

---

**Pattern 2: Webhook + Reputation-Gating + Real-Time Latency** [MEDIUM]

- **Bracky case:** Switched from x402 writes to Neynar webhooks. 500%+ user growth correlates directly. Scores gate input at ~0.55 (Neynar user score).
- **Why it works:** Webhooks = sub-second reply latency vs 60s polling. Algorithm favors fast engagement. Score-gating stops the bot circle-jerk (low-score bots don't amplify each other).

**For ZOL:** Polling works today (no external dependency, Pi-friendly). But once ZOL grows:
- Move to webhooks (requires fleet box or public endpoint)
- Gate replies on Neynar score (~0.55 minimum on the mention author; ignore low-score spam)
- This protects ZOL's own score and avoids noise

---

**Pattern 3: Frames / Snaps in Reply (the #1 Retention Multiplier)** [URGENT]

All winning agents embed interactive units. None of them post text-only.

- **Clanker:** "Deploy a token" button in every reply. 1-click conversion.
- **Bracky:** Prediction betting frame + notifications. Users can act inside the cast.
- **Aethernet:** Treasury distribution frame + NFT mint.

**For ZOL:** Bonfire casts are good content (builder energy, authentic). But without a Snap:
- Reader can't act in-cast (have to leave Farcaster, go to a web app)
- No proof of engagement (likes/recasts are weak signals)
- No acquisition (no "try this" low-friction entry point)

**Snap for ZOL:** Add interactive buttons to Bonfire posts:
- "Upvote this insight" (in-cast like + tracking)
- "View this quest" (deep-link to zabalgamez.com + Snap modal with details)
- "Mint as memory" (trivial NFT mint to commemorate the insight)

---

**Pattern 4: Proactive Posting (Not Just Reactive)** [MEDIUM]

- **Winning:** Clanker posts summaries of token deploys (it watches and posts), Bracky posts prediction leaderboards (weekly), Aethernet posts bounties on its schedule.
- **Losing:** ZOL today is 100% reactive (replies to mentions, waits for approval).

**For ZOL:** Keep the approval gate (safety). But expand the triggers:
- Daily ZABAL quest summary (proactive, not waiting for mention)
- Weekly builder leaderboard (who deployed, who won, who contributed)
- Spotlights for ecosystem wins (WaveWarZ tournament, new builder, collaboration)

---

### Analysis: Growth Drivers (Honest Assessment)

From doc 892 + builder playbooks, the mechanisms that *actually* drive reach (not growth-hack spam):

| Driver | What works | For ZOL | Realism check |
|--------|-----------|---------|---------------|
| **Neynar score + consistency** | Quality casts over time. Score 0-1, weekly refresh. Apps gate input at ~0.55. | ZOL has no followers today. Score protection = no spam. Start building baseline first. | Slow but durable. 2-3 months to visible growth. |
| **Genuine replies to big accounts** | Reply meaningfully to high-follower accounts (10k+). Increases visibility. But NOT spam mentions. | ZOL could reply to WaveWarZ updates, ZABAL partner posts. One per day max. | High risk of looking spammy. Need judgment. |
| **Economic incentive (token/reward)** | Users recast/mention because they profit or gain. | Add $ZABAL action. First users = ZABAL team + close community. | Best growth lever. But needs Snap + spend policy. |
| **Consistency + being alive on schedule** | Bots that post on a schedule are predictable + discoverable. Humans like that. | ZOL posts 1-2x/day. Stay predictable. Add a "ZOL's morning insight" slot. | Already doing this well. |
| **Embedding in a protocol (Snaps/Frames)** | Users action inside Farcaster, not clicking out. Conversion >> views. | Add Snap to every post. Button interactions = engagement proof. | Highest ROI for reach. |

**Honest take:** ZOL has 0 followers because:
1. No economic incentive to follow (no reward, no utility beyond reads)
2. Only posts to /zabal (not discovered outside)
3. No Snap/Frame (can't action in-cast)
4. Score protection means no aggressive self-promotion (good for durability, bad for growth)

**Realistic growth path:** Add Snaps (1-2 weeks) + $ZABAL action (2-3 weeks) + proactive posting schedule (1 week). Then reach will grow organically to 100-200 followers in 2-3 months.

---

## Part 3 - Webhooks vs Polling Trade-Off Analysis

### Current: Polling (60s cycle, Pi-friendly)

**Setup:**
- Pi runs `event-stream.ts` (gRPC to self-hosted Hypersnap node) or falls back to Neynar API polling
- Every 60 seconds, ZOL checks for new mentions in /zabal
- Dedupe by mention ID; pass to the approval gate

**Pros:**
- No public endpoint needed (Pi is behind home NAT)
- Simple, debuggable, no external webhook dependency
- Works today without infra changes

**Cons:**
- 60s latency (someone mentions ZOL, waits 1 min for a reply)
- Algorithm penalizes slow engagement (Farcaster prioritizes fast replies)
- Can miss rapid-fire mention storms (if 2 mentions come in same minute, dedupe might catch only 1)
- Polling = redundant API calls; costs more at scale (Neynar credits)

### Alternative: Webhooks (Real-time, Requires Public Server)

**Setup:**
- Neynar pushes a `mentions` event to a public endpoint (VPS or ngrok)
- ZOL receives event <100ms, replies immediately

**Pros:**
- <100ms latency (major algorithm boost)
- Bracky's 500%+ growth correlates directly to webhook switch (doc 892)
- Cheaper at scale (event-push beats polling)
- Can handle mention storms (each mention gets its own event)

**Cons:**
- Needs a public endpoint (not possible on the Pi alone)
- Requires fleet box or ngrok tunnel
- Webhook events can fire twice (need idempotency - already coded in `caster/index.ts`, but adds complexity)
- Neynar webhook tier costs extra (Scale tier $249/mo for reliable delivery; free tier ~10M credits/mo, uncertain credit->USD conversion)

### Recommendation

**For ZOL v1 (now):** Keep polling. It works, costs less, and ZOL is low-volume (2 casts/day). 60s latency is fine for the current reply volume.

**For ZOL v1.5 (when it grows):** Plan a webhook migration. Trigger: when ZOL gets >10 replies/day or >100 followers, the algorithm latency penalty becomes visible (lower reach). At that point, move ZOL to the fleet box + expose a webhook endpoint.

**Guardrail:** Never expose the home Pi directly (security). If using ngrok, rotate the token monthly and monitor for abuse.

---

## Part 4 - Prioritized ZOL Upgrade Plan

Below is a table of all proposed upgrades ranked by value/effort + priority. The top 5 are the recommendations.

### Full Upgrade Matrix

| Rank | Upgrade | Capability | What ZOL Gains | Dev Effort | Value (reach/revenue impact) | Safety | Effort Grade | Priority |
|------|---------|-----------|-----------------|------------|------------------------|--------|------------|----------|
| **1** | **Snap in Replies** | Frames/Mini-Apps/Snaps | In-cast interaction (buttons, deep-link, NFT mint). Retention +40-60% (per doc 892). Proves engagement in-feed. | 2-3 wks (design + register + embed in cast payload) | **URGENT** | Snap runs on user's wallet (Privy-gated). Safe. | Medium | **TOP 1** |
| **2** | **$ZABAL Mint/Tip Action** | Wallet + Spend Policy + Privy | Economic loop. Users tip builders, mint quest memories. Drives 10-50x follower growth (pattern from Clanker/Bracky). | 2 wks (Privy setup + spend cap + action gate) | **HIGHEST** | Privy signer policy limits tx size. Human approval gate. Safe. | Medium | **TOP 2** |
| **3** | **Proactive Posting Schedule** | Agenda-setting (not just reactive) | ZABAL daily summary, weekly leaderboard, ecosystem spotlights. Drives 30-50% engagement increase. | 1 wk (add cron jobs, LLM prompt for summaries) | High | All posts human-gated (existing). Safe. | Low | **TOP 3** |
| **4** | **Like/Recast Sub-Handler** | Reaction detection + auto-engagement | ZOL recasts high-signal casts, likes builder wins. Social proof loop. Network effect. | 3-5 days (read Neynar reactions API, filter by score, add auto-like policy) | Medium | Auto-like = low-risk. Can tie to approve gate if needed. | Low | **TOP 4** |
| **5** | **Score-Gate Replies (Reputation Filter)** | Neynar user score check | Ignore low-score spam mentions. Protects ZOL's score. Improves signal. | 2-3 days (check mention author's score, skip <0.55) | Medium | Pure filter (no action risk). | Low | **TOP 5** |
| 6 | Webhook + Fleet Box Migration | Real-time mention handling | Sub-100ms reply latency. Algorithm boost. Scales to 10+ replies/day. | 3-4 wks (deploy fleet box endpoint, migrate event handler, test failover) | High (long-term) | Webhook idempotency already coded. Safe. | High | Medium |
| 7 | Channel Feed Monitoring | Discovery (monitor zabal/music/builder channels) | Broader context awareness. Reply to multi-channel opportunities, not just mentions. | 1-2 wks (add feed subscription, context enrichment) | Medium | Requires judgment (avoid low-quality channels). | Medium | Medium |
| 8 | Trending Topic Replies | Proactive topic engagement | Reply to fast-growing threads. Become known as a responder. | 1 wk (subscribe to trending feed, LLM topic scorer) | Low-Medium | Need to avoid spam replies. Activity budget constraint applies. | Medium | Low |
| 9 | Quote-Cast Detection | Conversation deepening | Detect when someone quotes ZOL, reply with thanks/context. Turn quotes into threads. | 3-5 days (subscribe to quotes, de-dup, reply template) | Low | Low-risk (friendly gesture). | Low | Low |
| 10 | Self-Hosted Hypersnap for Reads | Cost reduction (avoid Neynar API for reads) | Save ~$500/mo Neynar API cost. Improve read latency. | 2-4 wks (node setup, monitoring, sync management) | Low (saves money only) | Requires VPS resources. Doc 586 playbook exists. | High | Low |
| 11 | EIP-8004 Agent Registration | Reputation + Identity registry | Formal agent identity, on-chain reputation watchtowers. Credibility. | 1-2 wks (register on mainnet, wire watchtower) | Low-Medium | Zero Farcaster agents found using EIP-8004 today (doc 892 finding). Skip for v1. | Low | Very Low |
| 12 | Mini App for Quest Submission | Deeper engagement flow | Users can submit quests, see leaderboards, mint NFTs. Rich UX. | 4-6 wks (build + deploy Vercel + embed in Snap) | Medium | Backend mostly done. UX is the lift. | Medium | Low |
| 13 | Cross-post to X (@zolbot account) | Multi-platform presence | 30-40% reach increase vs Farcaster-only (research finding). Amplifies ZOL across X/FC audiences. | 1-2 wks (wire bettercallzaal.com X API, dedupe + schedule) | Medium-High | ZAO already has X posting via bettercallzaal account. Reuse publish stack. | Low | Medium |

---

## Part 5 - Top 5 ZOL Upgrades (Prioritized)

Here are the five upgrades to implement first, ranked by immediate impact + feasibility:

### 1. Snap in Replies (2-3 weeks)

**What:** Embed an interactive Snap in ZOL's Bonfire casts and replies.

**Buttons:**
- "Upvote" (tracks in-cast engagement)
- "View on zabalgamez.com" (deep-link + context modal)
- "Mint as NFT" (trivial commemorative mint - ZOE already has NFT infra)

**Why now:** Doc 892 flags this as the #1 retention multiplier. Without a Snap, ZOL's content is read-only (zero actionability in-cast). 40-60% engagement increase per the data.

**Implementation:**
- Register Snap with Farcaster (docs.farcaster.xyz/reference/frames)
- Update `caster/write.ts` to embed Snap metadata in cast payload
- Snap endpoint (simple: show buttons, handle click, redirect to zabalgamez + record interaction)
- Deploy Snap to a static domain (Railway or Vercel)

**Cost:** ~$20/mo for Snap host (Railway). No smart contract calls needed.

**Safety:** Snap runs on user's wallet (Privy-gated). Buttons are view-only or redirect, no blind txs.

**Unblocks:** Items #2, #3 (Snap can call out to $ZABAL mint, leaderboard summary).

---

### 2. $ZABAL Mint/Tip Action (2 weeks)

**What:** Give ZOL the ability to mint a $ZABAL commemorative NFT or tip a builder when approved.

**Flows:**
1. **Quest completion:** User completes a ZABAL quest → ZOL replies "You minted quest #123 memory NFT" → 1-click claim in the Snap
2. **Builder shoutout:** ZOL spotlights a builder → "Tipping @builder 0.1 $ZABAL for this insight" → human-approved → minted as on-chain action
3. **Leaderboard reward:** Weekly builder leaderboard → top 3 each get a mint + tip

**Why now:** This is the **economic incentive loop**. Doc 892 shows this is the #1 driver of agent growth. Clanker (tokens), Bracky (rewards), Aethernet (distributions) all have this. Without it, ZOL's reach caps at ~500 followers.

**Implementation:**
- Privy signer policy: scoped key, $5/day spend cap, allow-list = ZABAL token + NFT contract
- ZOE already has `mint-nft.ts` (ZAO/Respect token)
- Wire ZOL's approval gate to the Privy signer: if approved, submit tx
- Add interaction tracking (who tipped whom, mint count) for leaderboard

**Cost:** Gas (Base L2 = ~$0.10 per mint). Negligible under $5/day cap.

**Safety:** Privy policy enforces spend cap. Human approval gate required (existing).

**Requires:** Snap buttons to drive adoption (top priority is #1).

---

### 3. Proactive Posting Schedule (1 week)

**What:** ZOL posts on its own schedule, not just replying to mentions.

**Posts:**
1. **Daily (2pm UTC):** "Today's ZABAL insight" - 1-2 builder wins or quest highlights from Bonfire (auto-drafted, human-approved)
2. **Weekly (Friday 11am UTC):** "ZABAL builder leaderboard" - top 5 contributors this week, with mint invites
3. **As-needed:** WaveWarZ tournament summaries, ZAO ecosystem spotlights (new partnerships, launches)

**Why now:** Doc 892 shows winning agents post proactively. ZOL today is 100% reactive (waits for mentions). This doubles ZOL's visibility and gives followers a reason to check in.

**Implementation:**
- Add cron jobs to ZOE scheduler (doc 1038 audited recent changes)
- Prompt for daily summary: "Pick the 2 most interesting ZABAL events from Bonfire this morning. Draft a post (100 chars) with builder names and what they did."
- Surface in `/zoldraft` topic (already exists per git log)
- Human approval required (existing gate)

**Cost:** OpenRouter credits (small - 1-3 calls per schedule).

**Safety:** Human-gated. Activity budget enforced (Cassie's realism limits from doc 891).

**Unblocks:** Items #4, #5 (more posts = more opportunities for engagement + filtering).

---

### 4. Like/Recast Sub-Handler (3-5 days)

**What:** ZOL auto-likes and recasts high-signal casts (no human approval needed).

**Rules:**
- Auto-like: builder wins, WaveWarZ announcements, ZAO ecosystem posts (allowlist)
- Auto-recast: same, but only if recast will boost signal (high engagement already, >5 likes)
- Skip low-score casters (Neynar score <0.55)
- Dedupe: don't like/recast same cast twice

**Why now:** Quick win. Social proof loop. Doc 892 notes OpenRank weights (recast=3, like=1). ZOL recasting high-signal content strengthens the network.

**Implementation:**
- Read Neynar's reaction events (already polling)
- Filter by allowlist + score
- Async queue to Neynar write API (recast + like calls)
- No approval needed (read-only engagement)

**Cost:** Neynar API credits (negligible - <0.1% of quota).

**Safety:** Pure engagement, no text/tx. Low-score filter stops spam loops.

**Prerequisite:** None.

---

### 5. Score-Gate Replies (Reputation Filter) (2-3 days)

**What:** ZOL checks the mention author's Neynar score before replying. Ignores <0.55 scores (spam).

**Rules:**
- Fetch mention author's score
- If score <0.55, skip the reply (but don't spam the author)
- Log skipped mentions (for debugging)
- If score ≥0.55, proceed to approval gate as normal

**Why now:** Protects ZOL's own score. Doc 892 notes Neynar score is the real visibility gate (0-1 range, weekly refresh, ~0.55 threshold). Low-score bots pointing to ZOL drag down ZOL's reputation.

**Implementation:**
- Add `getUserScore()` call to Neynar SDK (trivial)
- Check in `event-stream.ts` before queueing for approval
- Log metrics (% of mentions skipped, score distribution)

**Cost:** Neynar API credits (negligible).

**Safety:** Pure filter. No action risk.

**Prerequisite:** None.

---

## Part 6 - Safety Spine (Unchanged)

All upgrades respect ZOL's existing guardrails:

1. **Human approval gate:** All casts, all onchain actions require Telegram approval before posting (existing)
2. **Spend cap:** Privy enforces limits ($5/day for tips/mints)
3. **Activity budget:** Per doc 891, ~12 actions/day; realism limits prevent spam (cooldown, alive-hours, skip 25-30% of triggers)
4. **No wallet keys:** Ed25519 signer is app-burner only, never personal key (doc 910)
5. **Idempotency:** Dedupe on mention ID, event ID; no double-posts (existing)
6. **No @-spam:** ZOL only mentions builders in structured contexts (leaderboard, spotlights), never gratuitous

---

## Part 7 - Roadmap & Sequencing

### Phase 1 (Weeks 1-2): Snap + Snap-Ready Posting
- **Week 1:** Implement Snap registration, embed in `write.ts`
- **Week 2:** Deploy Snap host, test 3-5 casts with buttons
- **Outcome:** Bonfire casts now have interaction buttons; proof of concept

### Phase 2 (Weeks 3-4): Economic Incentive
- **Week 3:** Wire Privy signer to ZOL, set spend cap, test 1 mint
- **Week 4:** Ship $ZABAL mint/tip in Snap buttons, link to leaderboard
- **Outcome:** Users can mint commemorative NFTs; foundation for growth

### Phase 3 (Week 5): Proactive Schedule
- **Week 5:** Add daily/weekly cron jobs; draft prompts; test schedule
- **Outcome:** ZOL posts on its own 3x/week (2 daily insights + 1 weekly leaderboard)

### Phase 4 (Week 6): Engagement + Filtering
- **Week 6:** Add like/recast handler + score-gate filter
- **Outcome:** ZOL is signal-efficient; only engages with real builders

### Phase 5 (Week 7+): Observe & Iterate
- **Monitor:** follower growth, engagement ratio, Neynar score trend
- **Target:** 100-200 followers by end of week 7
- **Next:** Webhook migration (if growth justifies real-time latency), channel feed monitoring

---

## Research Data & Sources

### Neynar API Capabilities
- **[FULL]** docs.neynar.com - managed signers, webhooks, SDK (`@neynar/sdk-js`), structured outputs
- **[FULL]** Neynar API reference - reactions, feeds, search, user scores, channel feeds
- **[PARTIAL - behind login]** dev.neynar.com/pricing - free tier ~10M credits/mo; Scale $249/mo; credit->USD not published
- **[FULL]** Neynar Dedicated Signer guide - webhook + reputation-gating pattern (Bracky case study)

### Leading Farcaster Agents (Playbook Analysis)
- **[FULL - from doc 892]** Clanker (17.2k tokens, 7.62B volume), Bracky (500%+ growth post-webhook, 4M mcap), Aethernet (150k treasury, 466k+ mints)
- **[PARTIAL - web]** mfergpt, askgina (plateaued text-only models)
- **[FULL - from doc 891]** Builders Garden x Neynar Farcaster Agentic Bootcamp (Mar 30 - Apr 10 2026) - sessions 3-10 synthesis

### ZOL-Specific Docs
- **[FULL]** Doc 891 - ZOL build plan + bootcamp synthesis (phases 0-3)
- **[FULL]** Doc 892 - Being an agent on Farcaster 2026 landscape
- **[FULL]** Doc 910 - Free Farcaster posting for ZOL (Snapchain signer, x402)
- **[FULL]** Doc 761 - ZAO Farcaster multi-agent stack
- **[FULL]** Doc 762 - Neynar stack verification (x402 + signer verdict)
- **[FULL]** Doc 891 decision 7 - Realism limits (cooldown, budget, alive-hours)
- **[FULL]** Codebase - `bot/src/zoe/caster/`, `bot/src/zoe/farcaster/`, `scripts/first-cast.ts`

### Frames/Snaps/Mini-Apps
- **[FULL]** miniapps.farcaster.xyz/docs/specification - Snaps spec (lightweight in-feed units, registration)
- **[FULL]** docs.farcaster.xyz/reference/frames - Frame spec (formerly Frames v2)

### Architecture & Hosting
- **[FULL]** doc 586 - Hypersnap node VPS install playbook (self-hosted reads, doc 892 cost saving)
- **[FULL]** doc 1038 - ZOE scheduler audit (cron, consumption)
- **[FULL]** Codebase - `bot/src/zoe/caster/`, `bot/src/zoe/farcaster/event-stream.ts` (polling)

---

## Open Questions & Unknowns

1. **Snap registration details:** Exact process for registering a Snap with Farcaster (docs exist, need walk-through)
2. **Neynar webhook credit cost:** Credit->USD conversion is unpublished (behind dev dashboard). Real cost unclear. [FLAG: confirm before scaling]
3. **Privy-Replicator TEE uptime:** Claim is 99.99%. Real-world failure modes unknown for ZOL's $5/day tier.
4. **Snap + Snap button interaction latency:** No published latency data. Assume <500ms for button clicks (web platform standard).
5. **Quote-cast detection:** Neynar API support for detecting quote-casts not verified. [FLAG: check API docs]

---

## Conclusion

ZOL has the foundation (signer, polling, approval gate, x402 payments). The upgrades above transform it from a functional agent into a valuable one:

1. **Snap** (weeks 1-2) = makes content actionable (40-60% engagement lift)
2. **$ZABAL action** (weeks 3-4) = adds economic incentive (10-50x follower growth)
3. **Proactive posting** (week 5) = extends reach (30-50% more engagement)
4. **Engagement filters** (week 6) = protects reputation, improves signal

**Realistic outcome:** By week 7-8, ZOL reaches 100-200 followers, 50-100 daily engagement events, and becomes a known builder agent in the ZABAL ecosystem.

**Long-term (post-upgrade):** Once ZOL proves value, consider webhook migration (real-time), channel monitoring (broader discovery), and Mini App for deep quest flows.

**Safety note:** All upgrades respect the existing approval gate, spend cap, and activity budget. No changes to the safety spine.

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Validate Snap spec + registration process | @Zaal / Claude | Research | Before week 1 |
| Decide on NFT contract for $ZABAL mints (new or reuse Respect token?) | @Zaal | Decision | Before week 3 |
| Confirm Privy signer availability + pricing for ZOL wallet | @Zaal | Investigate | Before week 3 |
| Build Snap + integrate into `write.ts` | @Claude Code | Build | Week 1-2 |
| Wire Privy signer + test first $ZABAL mint | @Claude Code | Build | Week 3-4 |
| Implement proactive posting schedule + cron jobs | @Claude Code | Build | Week 5 |
| Ship + monitor for 2-3 weeks | @Zaal + @Claude | Observe | Week 7+ |
