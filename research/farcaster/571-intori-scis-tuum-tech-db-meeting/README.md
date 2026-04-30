---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-04-30
related-docs: 472, 567, 568
tier: STANDARD
---

# 571 - Intori SCIS + Tuum Tech: Donald Bullers Meeting + ZAO Integration Path

> **Goal:** Document Zaal's meeting with Donald Bullers (DB, @db on Farcaster, FID 897), founder of Tuum Tech / intori. Capture verbal handshake on first integration (ZAO Music graph) and queue concrete next moves.
>
> **Status:** Meeting complete 2026-04-30. Awaiting DB's reach-out before sending the markdown brief.
>
> **Companion file:** [transcript-2026-04-30.md](./transcript-2026-04-30.md) - raw verbatim.

## Key Decisions (locked post-meeting)

| # | Decision | Source |
|---|---|---|
| 1 | **First integration: "ZAO Music supporters of independent artists" graph.** Not "music lovers" - DB explicitly reframed because casual music fans don't care about the artist; ZAO does. | DB verbatim |
| 2 | **Two graphs, in order: (a) ZAO Music, (b) Zaal personal.** DB will learn from clusters in (a) before personalizing (b). | DB verbatim |
| 3 | **Zaal owes DB a markdown brief.** DB will paste into his cloud and integrate when ready - 2-3 weeks, async, no fixed date. | DB verbatim: "send me the prompt, I'll pop it in my cloud" |
| 4 | **Boston sports = distribution lever for DB's side.** Adding Boston-Sports questions → @dish reshares → free FC distribution to Boston FC users. | DB verbatim |
| 5 | **WaveWarZ graph deferred.** Live-traded music battles produce stats (battles per musician, MC, vol). Becomes a separate WaveWarZ graph "a little bit longer down the road." Not P0. | Z verbatim |
| 6 | **ZAOstock Oct 3 2026 = pre-event intori activation.** Stream is non-negotiable; DB to "tap in on" pre-event side so intori users can prep / RSVP / discover the stream. Crypto tech only online; in-person stays low-tech. | Z verbatim |
| 7 | **DB invited to ZAOstock IRL (or virtual fallback).** | Z verbatim |
| 8 | **Communication preference: Telegram > Discord > Farcaster DMs.** Zaal noted FC DMs lose stuff; DB agreed. | Z verbatim |
| 9 | **Both aligned on open-source modality + non-technical UX.** ZAO musicians lack technical depth; intori solves the "I don't know what to ask the agent" problem via memory-file-driven onboarding. | Mutual quote alignment |
| 10 | **Token incentive layer (ZABAL → answer Qs):** Zaal proposed allowlist members earn $1 ZABAL per Q up to first 5/day, then 5 free with extra-data tagging. DB acknowledged but did not commit. **Hold this design until DB returns with API surface.** Per `feedback_no_unsolicited_features.md` - we don't ship gamification until asked. | Z proposed, DB neutral |

## What SCIS Actually Is (post-meeting, deeper than article)

The Intori news post is conceptual. The transcript reveals the engineering reality:

| Field | Public article | What DB said in meeting |
|---|---|---|
| What | "Structured Conversational Inventory System" - turns answers into structured signals | "Autonomously running, conversational system... like ChatGPT back-and-forth except solely for personalization" |
| Build duration | Not stated | "Pretty aggressively for maybe six months now" |
| Origin | Not stated | "Started: top 20 interest groups + database of questions and answers" |
| State | Not stated | Now autonomous - asks right Qs at right time, learns dislikes from interactions |
| Target output | "Structured signals" | "Digital twin of [user] for these specific interests" |
| Agent UX | Not described | Memory-file-driven: user says "music research agent" → engine pulls relevant slices from personality. **No need for user to spec each capability.** |
| intori app | Hero product per article | DB: "back burner product to what is happening in the backend" - SCIS is the actual focus |

**Critical reframe:** intori (the consumer app) is downstream of SCIS (the engine). DB has been heads-down on the engine for 6 months. Partnerships should target the engine layer - not the app layer.

This aligns directly with our ongoing memory work (project_research_zaal_personal_kg_agentic_memory branch + Doc 568 Aware Brain): memory-files-as-context-bridge for AI agents. SCIS is a working production version of what we've been researching.

## Donald Bullers Profile (validated against meeting)

| Field | Value |
|---|---|
| Handles | FC @db (FID 897), X @donaldbullers, LinkedIn /in/donaldbullers, web donaldbullers.com |
| Title | Founder & CEO Tuum Technologies, Founder Product Lead intori |
| Confirmed in meeting | Recently engaged (congrats from Z), couldn't attend Rome conf because of partner pushback, "ready for next phase of life" |
| Pace | "Ship and test things out and try" - mentality match with Z |
| Tooling preference | Markdown briefs into "my cloud" (likely Claude/local agent setup), async integration |
| Cadence | 2-3 week iteration loops |

### DB's worldview confirmed

- Pro-real-people ("digital twin for personalization, not synthetic noise")
- Open to community-driven distribution ("@dish reshares Boston-Sports Qs")
- Non-tokenized intori currently; did not push back on Z's ZABAL incentive idea but did not commit either
- Anti-bot framing matches his Jan 2026 blog ("Fork in the Road: Real People or Synthetic Comfort")

## Traction Stats (no new data from meeting)

Same as pre-meeting baseline:
- 17,000+ accounts onboarded
- 1.2M+ questions answered
- 6,511 FC followers (intori account)
- Live on World App, Base App, Farcaster
- AI agent live inside Base App + FC clients

DB did NOT share fresh WAU/DAU numbers in the meeting. Risk flag from pre-meeting brief stays open.

## ZAO Integration Path (locked)

### Phase 1: ZAO Music Graph (start here)

**Owner:** Zaal sends markdown brief to DB; DB integrates into SCIS.

**Theme positioning:** "Supporters of independent artists" (DB's exact reframe).

**Markdown brief should contain:**
1. ZAO context: 188 members, music-first, web3 builder community, Farcaster channel
2. 20-50 seed questions covering:
   - Artist discovery preferences (genre, indie vs major, format)
   - Community participation patterns (events, Spaces, NFTs)
   - Web3 stance (token gating, royalties, fan ownership)
   - Specific ZAO-adjacent micro-interests (cyphers, IRL events, allowlists)
3. Sample "good response" anchors so SCIS can calibrate signal vs noise
4. Output schema: what signals/clusters Z wants surfaced
5. Optional: list of @-handles to seed the cluster (top 30 active ZAO Farcaster users)

**Brief lives at:** `research/farcaster/571-intori-scis-tuum-tech-db-meeting/zao-music-brief-for-db.md` (TODO - draft pending DB ping).

### Phase 2: Zaal Personal Graph (after Phase 1 ships)

**Trigger:** DB completes Phase 1 + reports back on cluster quality.

**Scope:** Boston-sports + builder/founder context + ZAO ecosystem leadership context. Z's specific likes layered on top of base graph DB has built.

**Distribution play:** Boston-sports Q set unlocks @dish (and other Boston FC OGs) as resharing channel.

### Phase 3: WaveWarZ Graph (deferred, larger TAM)

**Why later:** WaveWarZ has its own production stats infrastructure (live music battles, market caps, musician records). Needs proper schema design before SCIS ingestion.

**Pre-req:** WaveWarZ graph spec written; possible Bonfire-style ingestion as parallel KG.

### Phase 4: ZAOstock Pre-Event Activation (Oct 2026)

**Scope:** intori users get pre-event Pack/Circle around ZAOstock. Funnels FC users who match the "supporter of independent artists" cluster toward the live stream RSVP.

**Constraint:** Z explicit non-negotiable: no crypto tech in-person. Intori activation = online/pre-event ONLY. In-person stays low-tech (per project_zaostock_master_strategy memory and Cassie 4/28 debrief).

**Unlock:** stream URL + show schedule + artist lineup ready to feed into intori.

## Bonfire Cross-Reference (introduced in meeting)

Zaal showed DB the Bonfire SDK during the call:

- Bonfire = Telegram-bot-based KG ingestion. Zaal saw it first at ETH Boulder hackathon (small group).
- Pattern: Telegram group becomes the conference data source; bot ingests talks, transcripts, side conversations into a connected knowledge graph.
- Per-query memory-queue updating before each agent query.
- Zaal already created a **WaveWarZ Bonfire** that captures stats + relationships per post.
- Has SDK + API.
- DB has not seen this; Zaal will share.

**Cross-link to existing ZAO research:**
- This is the same KG-ingestion pattern as Doc 568 (Aware Brain) and the agentic-memory work on the current branch.
- WaveWarZ Bonfire + intori SCIS could be **complementary, not competing**: Bonfire ingests group/event chat; SCIS ingests individual conversational signal.
- Future spike: can WaveWarZ Bonfire feed signals INTO SCIS for the WaveWarZ graph?

## Open Risks (post-meeting)

| Risk | Severity | Status after meeting |
|---|---|---|
| Architecture is opaque - on/off-chain status of stamps | MED | Still unanswered; not blocker for Phase 1 since brief is server-side |
| 17K accounts != 17K WAU | MED | Still unanswered. DB did not share WAU/DAU. Worth surfacing again in Phase 1 retro |
| DB pace + 2-3 week loops | LOW-MED | Confirmed async. Z accepts. Need not-blocking-on-this-for-ZAO-roadmap discipline. |
| Token incentive design ambiguous | MED | Z proposed, DB neutral. Hold all gamification until DB asks. |
| ZABAL distribution not yet wired | MED | Allowlist + payout flow doesn't exist. Don't promise users dollar-for-Q until built. |
| Engagement/conferencing event - Zaal proposed but not confirmed for ZAOstock | LOW | Soft invite extended; track separately in calendar memory if/when DB confirms. |

## Verbal Commitments (track for follow-through)

| Who | Commitment | Status |
|---|---|---|
| Zaal | Send DB a markdown brief for ZAO Music graph | PENDING - awaits DB ping |
| Zaal | Send DB the WaveWarZ Bonfire link + Bonfire SDK | PENDING |
| Zaal | Share two Sartorius / Among Traders podcasts with DB | PENDING |
| DB | Reach back out when ready to integrate brief | PENDING |
| DB | Pop markdown brief in his cloud + iterate (2-3 weeks) | PENDING - blocked by Z's brief |
| Both | Soft yes on ZAOstock Oct 3 alignment | LOOSE - revisit late summer |

## Also See

- [transcript-2026-04-30.md](./transcript-2026-04-30.md) - raw verbatim
- [Doc 472](../../dev-workflows/472-ai-tooling-roundup-apr21/) - prior watchlist note (was P3, "re-evaluate ~2026-07-21"); this doc supersedes
- [Doc 568](../../agents/568-aware-brain-local-kg-chat-memory-stack/) - parallel KG/memory research
- Current branch `ws/research-zaal-personal-kg-agentic-memory` - Zaal personal KG / agentic memory exploration; SCIS is now a working reference implementation
- project_zao_master_context.md memory - The ZAO positioning (music first, community second)
- project_zao_stock_confirmed.md memory - ZAOstock Oct 3 2026 venue lock
- project_zaostock_master_strategy.md memory - Cassie debrief; festival-as-proof
- project_future_repos.md memory - ZID architecture (Tuum DID infra reusable?)

## Next Actions

| Action | Owner | Type | When |
|--------|-------|------|------|
| Wait for DB ping before sending brief | Zaal | Inbound watch | DB-paced |
| Draft `zao-music-brief-for-db.md` (50 seed Qs + schema + ZAO context) | Zaal/Claude | Doc | Ahead of DB ping (so it's ready) |
| Send DB: WaveWarZ Bonfire link + Bonfire SDK URL | Zaal | DM | Anytime |
| Send DB: 2 Sartorius/Among Traders podcasts | Zaal | DM | Anytime |
| Review Among Traders mini-app pattern + write up "1-click digital twin" spike for ZAO FC client | Zaal/Quad | Research | Before rebuilding the ZAO FC front-end |
| Add intori cross-link to community.config.ts when partnership ships | Zaal | PR | Post-Phase-1 |
| Re-validate this doc | Claude | Doc | 2026-05-30 (30-day SLA) OR when DB pings, whichever first |
| If Phase 1 ships well: draft co-promo Farcaster + X posts | Claude | Content | Post-Phase-1 |
| If stamps go on-chain in future intori update: revisit ZID alignment | Zaal | Decision | When DB announces |

## Sources

### Primary

- [Transcript - Zaal x DB 2026-04-30](./transcript-2026-04-30.md) (this folder)
- [Intori - Introducing SCIS (2026-04-17)](https://www.intori.co/news/introducing-scis)
- [Intori - Build Your Identity One Pack at a Time (2026-03-24)](https://www.intori.co/news/packs-build-your-identity)

### Founder + company

- [Donald Bullers about](https://www.donaldbullers.com/about/)
- [DB blog - Fork in the Road (2026-01-07)](https://www.donaldbullers.com/fork-in-the-road/)
- [DB Farcaster @db](https://warpcast.com/db)
- [DB LinkedIn](https://www.linkedin.com/in/donaldbullers)
- [DB Finnotes profile](https://finnotes.org/people/donald-bullers)
- [DailyCoin interview 2021-08-20 - Tuum Elastos era](https://dailycoin.com/empowering-individuals-in-the-web-3-0-era-a-tuum-technology-approach)
- [Tuum Technologies GitHub org](https://github.com/tuum-tech)

### Distribution + ecosystem

- [Intori homepage](https://www.intori.co/)
- [Intori privacy policy - Inter-Origins definition](https://www.intori.co/privacy-policy)
- [Intori Web3.bio profile](https://web3.bio/intori.farcaster)
- [Intori World App listing](https://world.org/mini-app?app_id=app_263f86463869627f1183badc977e21a3)
- [Farcaster News - 307K quality users (2025-11-30)](http://farcasternews.com/2025/11/30/farcaster-reaches-307k-high-quality-users-with-neynar-scores-growth-metrics-explained-2025/)
- [Farcaster News - FID under 10K priority (2026-02-20)](http://farcasternews.com/2026/02/20/farcaster-fid-under-10k-why-og-users-get-verified-priority-and-engagement-boosts/)
- [Farcaster Protocol - Permissionless Onboarding FIP](https://github.com/farcasterxyz/protocol/discussions/91)
- [Farcaster docs - Create an account](https://docs.farcaster.xyz/developers/guides/accounts/create-account)

### Cross-references mentioned in meeting

- Bonfire (KG ingestion via Telegram bot, ETH Boulder hackathon origin) - URL pending Zaal share
- Sartorius / Among Traders (FC mini-app, 1-click digital twin pattern) - 2 podcast URLs pending Zaal share

URLs verified live 2026-04-30. Bonfire + Among Traders + 2 Sartorius podcasts will be added to this doc once Zaal forwards them.
