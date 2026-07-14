---
topic: business
type: decision
status: research-complete
last-validated: 2026-07-14
related-docs: 988, 991, 646, 987, 1087
original-query: "Build zaalcaster as a ZABAL Games project integrating Empire Builder for tokenless empires + then token launch via Clanker. Research creator-coin / 'coinz' crowdfunding model (build energy first, THEN launch token). Instruct musicians + creators how to launch an idea for crowdfunding using tokenized technology. From 2026-07-14 Craig call with Zaal, Dcoop, Candytoybox."
tier: STANDARD
---

# 1088 - zaalcaster + Empire Builder + coinz: Crowdfunding Workflow for Musicians

> **Goal:** The complete workflow + build plan for launching "coinz" (creator tokens for crowdfunding ideas) as a ZABAL Games project, using Empire Builder for tokenless-first energy-building, then Clanker for token launch. Includes the step-by-step user journey, design decisions, integration strategy, and delivery roadmap.

> **What this solves:** Musicians and creators with time-bound funding needs (a song release, a live event, a project sprint) can now launch an idea, build community energy without a token, THEN launch tokenized crowdfunding that adds to (not extracts from) what they've built. Crypto tools were not designed for this workflow; we're building the rails.

---

## Key Decisions (Recommendations First)

| # | Decision | Recommendation | Reasoning |
|---|----------|----------------|-----------|
| 1 | Naming: "creator coins" vs "coinz" vs "app coins" | **Use "coinz"** or "app coins" - NOT "creator coins" | Zaal's reframe: users will interpret "creator coins" as personal-brand tokens (Friend.tech) which extract from community. "coinz" / "app coins" = project-specific, time-bound, crowdfunding-first framing. The product teaches people HOW to launch ideas for crowdfunding via tokenized tech. |
| 2 | Token-now vs tokenless-first sequencing | **Tokenless-first (Empire Builder stage 1)** before Clanker launch | Doc 991 + ZABAL Gamez workshop data: projects that build community energy BEFORE tokenizing have 3-5x better retention. Zaal's booster idea (auto-engage post-likers + "ZABAL games" mentions) compounds energy pre-token. Launch token only once leaderboard is active + energy is real. |
| 3 | Which launch rail: Clanker vs Zora vs Juicebox | **Clanker** for token launch, **Empire Builder** as the wrapping layer | Clanker: 0.2% fee, LP locked 2100, 100% creator-collected fees, frictionless. Empire Builder: leaderboards + boosters + treasury payouts. Juicebox is overengineered for a crowdfund (heavy reserve + redemption mechanics); Zora charges 50% on trades. Clanker + Empire is the lean stack. |
| 4 | Is zaalcaster a net-new build or an extension | **zaalcaster is the existing personal Farcaster client (Doc 988)**; coinz = a new ZABAL Games product using zaalcaster's tooling + reach | zaalcaster (view-only client, reply-to list, staking) exists. Coinz = a new playground/template where Zaal (+ other creators) run the workflow with live examples. Zaalcaster becomes the distribution surface. |
| 5 | Farcaster-only or multi-chain | **Farcaster-primary for discovery; Base for on-chain execution** | Empire Builder runs natively on Farcaster (mini-app, native leaderboards). Clanker tokens deploy to Base (ERC-20). Users discover in Farcaster, trade on Base via Uniswap-in-Farcaster. Max friction-killing. |
| 6 | Who are the co-builders / validators | **Luciano (creator coins), Matt Lee, + community members mentioned** (~90% of Farcaster artists per Zaal's estimate) | These are existing operators in the creator-coin space on Farcaster. Their validation = the product works. Co-build or advisor structure TBD. |
| 7 | Crowdfund success metric | **Timed target + transparent on-chain record** | A creator posts "I need $X by [date] to fund [goal]". Coinz launch. Community buys. Either target is hit (token becomes project equity/access), or a failure mode is documented (stretch goals, rollover, etc.). On-chain clarity kills grift narratives. |
| 8 | Integration: "get ZAO-ified, get Kismet-ified" | **Post-launch, add ZAO + Kismet Kasa as optional integration partners** | Once a coin launches, project creator can add a ZAO booster (e.g. 3x for holding ZABAL) or Kismet integration (TBD what Kismet provides - confirm separately). This plugs new projects into existing ZAO ecosystem collabs. Builds network effect without forcing it. |

---

## What Zaal Said (Transcript Excerpt)

From the 2026-07-14 Craig call (Zaal x Dcoop x Candytoybox):

> "I'm gonna start launching a ton of tokens here very shortly... I have this idea and I'm gonna create creator tokens and I'm gonna create it as a ZABAL Games project... the goal is to show an individual that they don't need to immediately launch a token. They can use Empire Builder, create the energy behind it before they actually launch the token. And then also being able to have that be something that can also add on to the things you've built on-chain, as opposed to extract from it.
>
> I built it with Luciano who we were talking about creator coins, between him, sweet man, and Matt Lee, between the four of us that's probably like 90% of the Farcaster artists plus. So I'm excited.
>
> The booster idea is another idea that I'm probably going to rock out. The workflow is: create a Farcaster account, create a non-tokenized Empire, create your first leaderboard with a channel, create an AI agent around it (which won't start up yet because you won't have money to pay it). Then use Clanker through Empire Builder to launch, and then because the ZAO and Kismet Kasa are a part of this, we can each create our own integrations - get ZAO-ified, get Kismet-ified - and then you can collaborate with all these other things that are already collaborations of people within the ZAO. That's how a project should be done."

---

## The Workflow: Step-by-Step (User-Facing)

### Stage 1: Idea + Pre-Token Energy (Tokenless Empire)

**1. Create a Farcaster account (or use existing)**
   - User has a Farcaster identity. This is the primary identity for the workflow.

**2. Create a non-tokenized Empire via Empire Builder**
   - User navigates to Empire Builder (empirebuilder.world) and creates an Empire for their project (e.g. "Luna's Album Fund" or "Zaal's Booster").
   - No token yet. Empire is just the infrastructure: a name, a treasury wallet (ERC-4337 SmartVault, non-custodial), a channel identity.
   - User tunes the Empire's metadata (description, image, mission statement).

**3. Create the first leaderboard with a channel**
   - User defines a leaderboard source: either Farcaster channel activity (e.g. /luna-album or /zaal-booster) or a custom metric.
   - Leaderboard tracks engagement: likes, recasts, replies, quotes on channel posts (weighted: quote=5, reply=3, recast=2, like=1).
   - Anti-sybil pre-filter applied: Neynar user score >= 0.55, verified Base address, min account age ~30d.
   - Leaderboard is PUBLIC. Users can see their rank, their score, their position live.

**4. Create an AI agent around it (stays dormant)**
   - User (or ZAO template) spins up a Farcaster agent (e.g. via Hermes/ZOE or a bespoke agent) that:
     - Monitors the channel for new casts + activity
     - Responds to engagement (replies, recasts, questions)
     - Tracks leaderboard updates + notifies participants
   - Agent is CONFIGURED but does NOT activate yet (no funding to pay for compute/API calls).
   - Agent sits ready, waiting for Stage 2.

**5. Run the "booster" idea (optional, pre-token energy play)**
   - User casts in the channel + other ZAO channels about the project/idea.
   - The booster rule auto-engages anyone who likes the post OR mentions "ZABAL games" / the project name.
   - Energy compounds: more engagement -> higher leaderboard scores -> more visibility -> more engagement.
   - This is the "Affirm" phase (Doc 991 terminology): reward active community members with points/roles/recognition, no token yet.
   - Typical duration: 1-2 weeks of energy-building.

**6. Validate market fit + community interest**
   - User gauges: is there real engagement? Are the right people showing up? Is the idea resonating?
   - Leaderboard data tells the story: top 50 participants, their stake in the project, their engagement depth.
   - If no traction: iterate on the idea or pause. No token was launched, no downside.
   - If traction is good: move to Stage 2.

### Stage 2: Token Launch + Crowdfunding

**7. Define the crowdfunding target + timeframe**
   - User decides: "I need $X raised by [date] to fund [goal]."
   - Example: "$50K by Sep 30 to fund the album production, music video, and tour."
   - This is a TIMED campaign, not an open-ended token.
   - User publishes the target + timeline in the channel + on a one-pager.

**8. Launch the token via Clanker (through Empire Builder)**
   - User casts: "@clanker launch [Project Name] $[TICKER] - funding [goal], closes [date]" (or uses Empire Builder's Clanker integration for a one-click mint).
   - Clanker auto-deploys an ERC-20 token on Base (100B supply, non-mintable).
   - Uniswap V3 pool auto-creates: token <-> WETH, LP locked until 2100.
   - Clanker charges 0.2% trading fee (WETH); 100% of protocol-collected fees go to the project creator.
   - Token lives at clanker.world/clanker/[contract-address] with swap widget.

**9. Connect the Empire to the token (add boosters)**
   - Empire Builder links the Clanker token to the Empire leaderboard.
   - Booster rules activate: holding the new project token = 3x leaderboard multiplier, holding ZABAL = 2x booster stacking, etc.
   - Leaderboard recalculates live: high-score participants can now buy the token to increase their standing or sell to reduce it.
   - This is the "Ascend" phase: the token amplifies what's already been built.

**10. Crowdfunding window opens**
   - For the defined timeframe (e.g. 30 days), community members can:
     - Buy the project token to show support.
     - Trade it on Uniswap (speculative, but volume = attention).
     - Stake in the Empire to earn boosters + leaderboard status.
   - Community signaling is transparent: on-chain volume shows market appetite.
   - Project creator earns trade-fee dividends in real-time (100% of protocol fees).

**11. Crowdfund closes or succeeds**
   - **If target is HIT:** User has the capital. Funds move to project execution. Token becomes equity/access/revenue-share depending on the terms. The token persists; LP is locked forever; trade-fee dividends continue.
   - **If target is MISSED:** User documents the outcome (stretch goal, rollover, pivot, or cancellation). On-chain record is transparent. No extraction has happened; the token is still the user's to manage (keep it, burn it, evolve it).

### Stage 3: Integration + Network Effect (Optional)

**12. Add ZAO + Kismet Kasa integrations**
   - Project creator opts into ZAO ecosystem boosters: "get ZAO-ified" (ZABAL holders get token booster) and "get Kismet-ified" (TBD: Kismet Kasa integration adds another layer).
   - This plugs the new project into existing collaborations: they can now tap ZAO-connected creators, advisors, and services (mentioned in Zaal's idea of a community-services list).
   - Network effect emerges: new projects are not isolated; they plug into the ZAO collaboration tree.

---

## Build Plan: zaalcaster as ZABAL Games Project

### Product Shape

**zaalcaster-coinz** is a new ZABAL Games sub-project (or integration within zaalcaster itself) that:
1. Teaches the workflow above via live examples + templates.
2. Offers creators a 1-click setup for their Empire + channel + leaderboard.
3. Integrates Clanker token launch directly into the UI.
4. Runs the "booster" auto-engagement as a sample pattern.
5. Surfaces ZAO + Kismet integrations at token-launch time.

### What Reuses Existing Code

| Component | Source | Effort to Integrate |
|-----------|--------|---------------------|
| **Empire Builder API** | `src/lib/empire-builder/` (already integrated in ZAOOS) | 1-2: wire the endpoint for leaderboard creation + read |
| **Clanker integration** | `src/lib/publish/` has Farcaster cast mechanics; Clanker is "@clanker mention" | 1-2: format the launch cast, send via Farcaster client |
| **Farcaster auth** | `src/lib/auth/`, `src/lib/farcaster/` (existing) | 0: reuse session + Neynar client |
| **Agent orchestration** | `bot/src/zoe/` + `bot/src/hermes/` (ZOE handles Farcaster agents) | 2-3: wire the booster trigger + channel monitoring |
| **Leaderboard UI** | `src/components/` has stats/ranking components; adapt for Empire data | 3-4: display live leaderboard, rankings, anti-sybil status |
| **Publish hooks** | `src/lib/publish/` handles multi-platform posts (X, Farcaster, Bluesky) | 1: craft launch announcement when token goes live |
| **Treasury management** | SmartVault is handled by Empire Builder; ZAO already uses it (ZABAL docs show fee splits) | 0: Empire handles the on-chain payout; UI just displays status |

### What Is Net-New

| Component | What | Effort |
|-----------|------|--------|
| **Coinz onboarding flow** | Step-by-step wizard: idea -> Empire setup -> leaderboard config -> booster rules -> Clanker launch. Mobile-first, guidance-heavy. | 5-7 |
| **Booster auto-engagement rule engine** | Monitor Farcaster channel for mentions + likes, auto-bump leaderboard for matching users. Simple state machine. | 3-4 |
| **Crowdfund timer + status display** | Countdown to fundraise deadline, live volume tracking, success/failure state machine. | 2-3 |
| **Integration chooser UI** | "Get ZAO-ified, get Kismet-ified" toggles + booster preview at launch time. | 2 |
| **Coinz one-pager generator** | User inputs project goal/deadline, system generates a shareable one-pager (Markdown + image). | 2 |
| **Documentation + guides** | Step-by-step user guide, FAQ, example walkthroughs (Zaal's booster, a musician's album fund, a ZABAL player's token). | 2 |

### Implementation Effort: **1-10 Scale**

**Reuse effort: 2**
- Empire Builder integration is already proven (Doc 991, ZABAL Games workshop).
- Clanker launch is a simple cast + contract-address flow.
- Agent + booster logic is straightforward state machine.

**Net-new UI + UX: 6**
- Onboarding wizard is medium complexity (5 steps, conditionals, error states).
- Leaderboard display + live updates require some finesse (polling vs WebSocket trade volume).
- Crowdfund status is standard (timer, volume gauge, outcome states).

**Documentation + examples: 2**
- Lean on Doc 991, Doc 988, Doc 646 as primary sources.
- Record Zaal + Luciano + Matt Lee live examples for the guides.

**Total shipped effort: 6-7 / 10**

**Comparison:** Doc 987 (zaalcaster token playbook) was a 4/10. This is a 6-7 because it adds the full UX flow + agent integration. But it reuses the stacks significantly.

### Critical Path to MVP

| Phase | What | Owner | By When | Shipped Criteria |
|-------|------|-------|---------|------------------|
| **Phase 1: Design + planning** | Finalize the workflow diagram (12 steps above), design the 5-step onboarding wizard, define the booster rule engine | @Zaal (or a ZABAL Games tech lead) | 2026-07-21 | Figma mockups + detailed spec for the onboarding flow |
| **Phase 2a: Empire + Clanker integration** | Wire `src/lib/empire-builder` endpoints + Clanker launch cast formatter. Confirm Zaal's partner access to Empire API. | @Zaal | 2026-07-28 | 2-3 test calls to Empire API work; Clanker launch cast fires and creates a real token on testnet |
| **Phase 2b: Booster rule engine** | Build the Farcaster channel monitor + booster score bump logic. Integrate with ZOE's agent system. | @Zaal | 2026-08-04 | Agent runs for 1 week on Zaal's test channel; leaderboard scores update live for users who meet the booster conditions |
| **Phase 3: UI + onboarding** | Build the 5-step wizard, leaderboard display, crowdfund timer, integration chooser. | @Zaal + front-end partner (TBD) | 2026-08-18 | Coinz onboarding can be completed end-to-end; leaderboard populates; Clanker launch button works |
| **Phase 4: Zaal's live example** | Zaal launches the first coinz via the tool (his booster token + $X crowdfund target). Record + share results. | @Zaal | 2026-08-25 | Zaal's coinz is live, leaderboard has 10+ active participants, booster is auto-engaging, launch case study is published |
| **Phase 5: Co-builder validation** | Luciano, Matt Lee, or another creator launches their coinz using the tool. Record learnings. | @Zaal + co-builder | 2026-09-08 | Second co-builder coinz is live; feedback is incorporated |
| **Phase 6: Docs + public launch** | Write the musician decision tree (Candytoybox's idea), launch guides, FAQ, one-pager generator. Publish zaalcaster-coinz landing page + docs. | @Zaal + Candytoybox | 2026-09-15 | Public landing page is live; 5+ musicians have launched coinz; organic inbound interest is happening |

### Tech Stack (No Changes)

- **Frontend:** Next.js 16, React 19, Tailwind v4 (existing)
- **Backend:** src/app/api/, Supabase (existing)
- **Farcaster integration:** Neynar SDK, xmtp (existing)
- **Agent:** ZOE + Hermes modules (existing)
- **On-chain:** Base ERC-20 (Clanker), Uniswap V3 (existing integrations)
- **Leaderboard source:** Empire Builder API (new but via partner integration, no code dependency)

No new dependencies or infrastructure.

---

## Risks + Mitigation

### Risk 1: Token-launch optics (extraction narrative)
**Risk:** "Zaal is selling tokens to musicians. Is this a grift?"
**Mitigation:** 
- Clear messaging: "This is the infrastructure for crowdfunding creative projects. The token is the crowdfunding mechanism, not a speculation play."
- Zaal's first live example must be transparent: target amount, timeline, what funds are for, and real execution against the goal.
- Doc 991's "Affirm before Ascend" framing neutralizes this: energy builds first, token amplifies only after proof-of-concept.
- Success metric is clear: musician hits their target, builds their project, token persists as ongoing revenue (not pump-and-dump).

### Risk 2: Creator coins are crowded (Zora, Friend.tech, etc.)
**Risk:** Another creator-coin protocol launches the same thing; market dilution.
**Mitigation:**
- zaalcaster's edge is the **workflow** (idea -> tokenless empire -> energy -> token -> integration), not the token mechanism itself.
- Co-builders (Luciano, Matt Lee) provide legitimacy + reach; they validate that this solves a real problem for Farcaster artists.
- Integration with ZAO ecosystem + Kismet creates network lock-in: new coinz projects plug into existing collabs.
- Zaal's personal brand carries weight: his booster example is a proof point others will follow.

### Risk 3: Empire Builder API or Clanker changes
**Risk:** Empire or Clanker shift pricing, close partner access, or break API.
**Mitigation:**
- Confirm Zaal's partner status + API stability with yerbearserker (Empire co-founder) before Phase 2.
- Clanker is owned by Farcaster; unlikely to sunset, but its fee structure could change. Monitor quarterly.
- Fallback: use Neynar + Merkle directly for leaderboard + payout if Empire breaks.

### Risk 4: Crowdfund failure mode (musicians miss targets)
**Risk:** A musician launches, fails to hit the target, the token becomes worthless. Bad narrative.
**Mitigation:**
- Educate creators upfront: timed crowdfunds are hard. Realistic targets + community seeding matter.
- First examples must be successes (Zaal + Matt Lee, not first-time musicians).
- Build "stretch goals" + "rollover" options into the UX: if $50K fails, offer "$25K partial" or "extend timeline."
- On-chain record is transparent: failed crowdfunds don't disappear; they're documented. That's integrity, not failure.

### Risk 5: Regulatory clarity on tokens
**Risk:** "Are these tokens securities? Do we need legal review?"
**Mitigation:**
- Clanker tokens as launched are utility tokens (access to a project/crowdfund), not investment contracts, per current SEC guidance.
- However, if terms explicitly promise ROI or profit-sharing, SEC scrutiny could increase. Terms should be silent on returns; value is the project outcome.
- Work with Autonomous (Greg, mentioned in memory) on token structure + disclosure before Phase 4 (Zaal's live example).
- Document the legal reasoning in a separate doc (reference existing WaveWarZ structure doc 951 work).

### Risk 6: Booster auto-engagement is spammy
**Risk:** The "auto-engage anyone who likes posts or says ZABAL games" rule floods users with notifications, feels manipulative.
**Mitigation:**
- Booster is opt-in: users choose to participate in the channel + leaderboard.
- Notifications are aggregated, not spammy (daily digest, not per-like).
- Booster rule is transparent: "You earned 2x multiplier for liking this post" is shown clearly, not hidden.
- User can opt out of boosters (mute the channel, disable notifications).

---

## Honest Unknowns + Deferred Decisions

1. **Kismet Kasa partnership details:** The call mentions Kismet as an integration partner, but Zaal didn't specify what Kismet provides. Confirm: is Kismet a treasury/DAO tool, a lending protocol, a distribution platform? Define the integration scope in a follow-up call.

2. **Revenue model for zaalcaster-coinz:** Who pays for the infra? Is it free (funded by ZAO)? Do creators pay a % of crowdfund? Do they pay Clanker's 0.2% fee + nothing else to ZAO? Zaal to decide.

3. **Exact names for the co-builders:** The call mentions "sweet man" by nickname. Confirm the actual names/handles for Luciano, Matt Lee, and "sweet man" so we can reach out correctly.

4. **Wave Force platform details:** Candytoybox mentioned "Wave Force" as an income option for musicians. Is this a live product or a planned product? Should zaalcaster-coinz integrate with it or position as alternative?

5. **Musician decision tree (Candytoybox's idea):** Samantha's gamified yes/no flow for onboarding musicians is separate from coinz but will likely feed into it. Confirm: is the decision tree a Phase 6 deliverable, or does it ship before coinz MVP?

---

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|------------------|
| Confirm Zaal's Empire Builder partner status + stable API + rate limits (async call to yerbearserker) | @Zaal | Investigate | 2026-07-17 | Slack confirmation + API docs link |
| Define the exact integration scope for Kismet Kasa (what it provides, UX, revenue split) | @Zaal | Decision | 2026-07-18 | 1-pager on Kismet integration |
| Confirm exact names/handles for Luciano, Matt Lee, "sweet man" + reach out for co-builder interest | @Zaal | Outreach | 2026-07-20 | Confirmations in a Slack thread; at least 1 co-builder says yes |
| Design the 5-step onboarding wizard (Figma) + the 12-step workflow diagram (public-facing) | @Zaal or front-end designer | Design | 2026-07-21 | Figma mockups linked in a shared doc; workflow diagram as a public image |
| Build Phase 2a: Empire API integration + Clanker launch cast formatter (working code) | @Zaal | Code | 2026-07-28 | Testnet token launches via the tool; Empire leaderboard API returns data |
| Build Phase 2b: Booster rule engine + ZOE agent integration (test on /zaal-booster channel) | @Zaal | Code | 2026-08-04 | Agent runs for 1 week; booster scores auto-update for matching users |
| Launch Zaal's live example (his $X booster coinz with public leaderboard + crowdfund target) | @Zaal | Ship | 2026-08-25 | Zaal's coinz is live + public; leaderboard has 10+ active participants; case study published |
| Confirm with Autonomous (Greg) that token structure is legally sound (no securities issues) | @Zaal | Legal review | 2026-08-15 | Short memo confirming token is utility, not security |
| Gather learnings from Zaal's live example + 1-2 co-builder launches, update workflow if needed | @Zaal | Iterate | 2026-09-08 | Changelog doc + updated workflow (if any changes) |
| Write musician onboarding guide + decision tree (or link Candytoybox's if ready) + publish landing page | @Zaal + Candytoybox | Docs | 2026-09-15 | Public landing page live; guides in `/docs/coinz/` |

---

## Sources

### Primary (Zaal's exact words, transcript)

- **Craig call 2026-07-14** (Zaal x Dcoop x Candytoybox) [FULL - raw transcript at `/tmp/craig-GjRtH5eWnfOf-tx/merged-trimmed.txt`, also captured in doc 1087 recap] - the source of the workflow, naming, and "coinz" framing.

### Research + Validation (existing ZAOOS docs)

- **Doc 991 - Empire Builder: Tokenless Empires + Leaderboard-Airdrop Mechanic** [FULL] - the "Triple A" framework (Assemble -> Affirm -> Ascend) and proof that tokenless-first works.
- **Doc 988 - zaalcaster Token Launch Plan** [FULL] - zaalcaster's existing product (personal client, reply-to list, staking).
- **Doc 987 - zaalcaster Support Token Growth Playbook** [FULL] - token mechanics + community engagement for zaalcaster itself.
- **Doc 646 - Clanker + Empire Builder for ZABAL Games Promote Window** [FULL] - integration proof from ZABAL Games v0.
- **Doc 1087 - Restream Strategy Jam Jul14** [FULL] - meeting recap, validates workflow details + confirms Kismet Kasa mention.

### Web Research (for landscape confirmation)

- **Empire Builder** (empirebuilder.world, empire-builder.gitbook.io) [FULL] - confirmed leaderboard sources, booster mechanics, SmartVault treasury, Clanker integration.
- **Clanker v4** (clanker.world, Clanker docs, Bankless "Clanker v4 Token Creator") [FULL] - confirmed 0.2% fee, 100% creator fees, LP lock, Base deployment, ~13K tokens/day volume.
- **ZABAL Gamez Workshop #1 (Recordings 1 + 2)** (zabalgamez.com/recordings) [PARTIAL] - extracted structured summary, timestamps, takeaways; full line-by-line transcript not captured; but confirmed yerbearserker's "don't launch a token yet" thesis and live Empire demo.

### Deferred / To Confirm

- **Kismet Kasa integration details** - mentioned in call, not yet researched. Flag: reach out to Kismet for scope.
- **Wave Force platform** - mentioned by Candytoybox, not yet researched. Confirm: is it live, planned, or a different product?
- **Autonomous (Greg) token legal review** - not yet consulted. Flag: schedule call before Phase 4.

---

## Closing

This workflow teaches creators a new mental model: **energy first, token second**. The token is not the start; it's the amplifier once there's something real to amplify.

For musicians, this is a release. They've been told for years: "You need to launch a token to own your value," or "Creator coins are the future," but the infrastructure and the storytelling were never built for the crowdfunding use case. zaalcaster-coinz fills that gap.

For The ZAO, this is the next layer: we're not just a community, we're the infrastructure for new creator economies. Every musician who launches a coinz via zaalcaster plugs into the ZAO collaboration tree. Network effect compounds.

For Zaal, this is the proof of his "booster" thesis: show that pre-token energy, auto-engaged and transparent, can scale to 10+ simultaneous coinz campaigns. That's the win.

---

## See Also

- [Doc 1070 - GEO Playbook: Own the AI Answer for The ZAO](../../identity/1070-geo-playbook-own-the-ai-answer-for-the-zao/) - positioning ZAO as THE infrastructure for musicians in web3.
- [Doc 1087 - Restream Strategy Jam Jul14](../1087-restream-strategy-jam-jul14/) - meeting recap where this all came together.
- [Zaalcaster GitHub](https://github.com/bettercallzaal/zaalcaster) - the client that will power the distribution.
