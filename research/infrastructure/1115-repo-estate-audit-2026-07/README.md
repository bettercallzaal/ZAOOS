---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-07-15
related-docs: 836, 1110, 1113, 1114
original-query: "audit all of our repos with our new functionality - where do DreamLoops, ZOE multi-model, ZOE soul, and Cua computer-use plug in"
tier: DISPATCH
---

# 1115 - ZAO Repo-Estate Audit + New-Capability Map (2026-07)

> **Goal:** Audit the active bettercallzaal repo estate and map where the capabilities shipped this week (DreamLoops persistent agents, ZOE multi-model routing, ZOE soul, Cua computer-use, zao-mcp) create the most leverage. Ranked by ROI, with immediate actions called out.

## Method

Four parallel read-only audit agents swept ~37 active repos (of 97 non-archived) across four clusters: core platform + agents, WaveWarZ + events + POIDH, Farcaster + music tools, content + learning + fractal. Each assessed what/state/opportunity/new-fit per repo. This doc synthesizes their findings. No repo was found broken - all have clean git hygiene and recent commits. The wins are in automation, data-synthesis, and agent-cohesion, not bugfixes.

## The one-line finding

You have a fleet of solid, siloed tools. The leverage now is not building more - it is **connecting them through the context layer (zao-mcp + Bonfire) and the agent layer (hermes + DreamLoops + multi-model)** so they act as one ecosystem instead of 37 islands.

## Top cross-cutting moves (ranked by ROI)

1. **Unblock the Bonfire read endpoint + finish zao-mcp member gating = the unified context layer.** Highest ROI, smallest dependency. Four agents (zol, farscout, zaocowork, wwtracker) are write-only to Bonfire or hand-carrying context. Unblocking Bonfire reads (single dependency: Bonfire admin key label) + finishing zao-mcp gating lets every agent pull grounded ZAO context instead of hardcoding it. Est. 0.5-1.5 days. This is the glue.

2. **Land hermes-orchestrator PRs 1-4 (especially PR4, learner retrieval).** hermes has stalled 50 days and is the blocker for STABLE autonomous loops. Today zol + farscout + zaocowork are stateless - they can't learn from past runs (PR4) or be nudged mid-run (PR3). This 50-day stall is the single biggest risk to the agent vision. Est. 2-3 days. Fix this before scaling the loop.

3. **Wire DreamLoops + multi-model into the agent fleet (farscout, zaocowork).** The framework is proven on zol (merged today). Grafting loop-capsules (stateful research cycles) + multi-model routing (Grok for triage, Claude for synthesis) to farscout + zaocowork turns three separate scripts into a coherent agent ecosystem. Est. 1.5 days.

4. **Stitch the publishing pipeline with one ZOE orchestrator.** zaoscribe (capture) -> spacetovideo (recap) -> ZAOVideoEditor (clips) -> zabalnewsletterbuilder / zaoonparagraph (publish) -> zingfisher (learning artifact) is a real pipeline broken only at manual handoffs. One ZOE persistent agent that monitors the chain, pre-grades against voice, and surfaces ready-to-ship batches to Telegram is the highest content ROI in the estate (daily shipping, tooling already works, just needs the coordination layer).

5. **Unify the snap ecosystem under one skill.** zlank (builder) + zlank-snap-template (starter) + ltaesnap (podcast snap) each produce Snaps with zero shared learning. One `/snap-*` skill family (scaffold -> build -> publish -> track) + multi-model (Grok for fast JSON) unlocks your "snap-per-event" vision.

6. **Auto-sync the reference tier.** bcz-journal (51 days stale), zao-icm (no validation), ZAONEXUS, bettercallzaalwebsite all drift without automation. Weekly ZOE sync agents (crawl the org -> regenerate the repo list; validate ICM boxes vs GEO; fetch approved testimonials) keep the canonical surfaces current without a human touch. Ties to GEO (doc 1110-adjacent).

## Immediate actions (quick + high-value)

- **Cloudinary key fix (CoCConcertZ)** - contest + gallery uploads DOWN since 2026-07-03 (key perms). Your 2-minute console fix, still open. Confirmed by two audit agents. Blocks COC #7.
- **Deprecate fractalbotapril2026** - the Python bot is superseded by fractalbotjuly2026 (canonical, shares the ZAOOS/ZOE stack). Archive April, migrate users, no new features on it.
- **Sunset / archive orphans** - `api` (x402 example, 90+ days stale, orphaned) archive it; `farmdrop` (Maine farmers market, unrelated to ZAO core) spin out or sunset.
- **zol PRs #1 + #2** need your approval (repo scaffold + auto-follow gate design).

## New-capability -> where it plugs in

| Capability | Highest-leverage homes |
|---|---|
| **DreamLoops** (stateful bounded loops) | farscout (dedup research cycles), zaocowork (dispatch capsules + cost cap), zpoidh (bounty ingest -> judging), zaotravelz (staggered outreach), wavewarzapp (battle-live cron), zol (weekly curator loops) |
| **ZOE multi-model** (Grok/Claude/GPT) | farscout triage, zaocowork stage-routing, ZAOpaperzBOT RAG, zaalcaster X-native summaries, snap JSON generation |
| **ZOE soul** (Q&A + narration) | wwtracker ("who's winning this season?"), zao-festivals admin ("how many checked in?"), fractal session narration, zingfisher progress, zol wisdom inheritance |
| **Cua computer-use** (desktop RPA) | CoCConcertZ artist onboarding, POIDH judging (video -> frames -> validate), overlay legibility check, snap preview-to-feed |
| **zao-mcp** (context layer) | THE context provider for zol + farscout + zaocowork + all future agents (replace hand-carried context) |
| **Bonfire** (unified feed) | ingest wwtracker + zpoidh -> "what's happening in ZAO right now" for ZOE + all agents |

## Per-cluster condensed findings

### Core platform + agents
- **ZAOOS** - highly active (14 open PRs incl. multi-model + soul). Complete the ZOL -> Bonfire read loop.
- **zol** - operational, DreamLoops merged, PRs #1/#2 await approval. Enable Bonfire reads + multi-model triage.
- **hermes-orchestrator** - PRE-ALPHA, 50-day stall. THE blocker for stable loops. Land PR1-4.
- **zaocowork** - minimal but working (Sunday cron). Add hermes learner + cost cap + DreamLoops capsules.
- **farscout** - active, 81 tests, live on VPS. Add DreamLoops state + multi-model triage.
- **ZAONEXUS** - active link hub. Wire zao-mcp as a tool.
- **zao-mcp** - brand new (2026-07-13), 4 free tools. Finish member gating -> becomes THE context layer.
- **jax** (personal HVAC), **api** (orphaned x402 example) - out of scope / archive.

### WaveWarZ + events + POIDH
- **wwtracker** - active, live, 37 research-blocked issues (WebFetch outage). Swap to Bonfire queries. ZOE "WaveWarZ intelligence" persona.
- **wwbase / wavewarz-overlay** - stale/complete. Wire overlay to wwtracker API for dynamic names.
- **wavewarzapp** - demo-only, FCM/Firestore stubbed. Wire it -> becomes the canonical push layer for all ZAO events.
- **zao-festivals** - active ZAOstock dashboard. ZOE admin Q&A via Hats contract.
- **zpoidh** - active, judging automation 80% done (stalled on MP4 frame extraction). Finish it = 3x bounties/round.
- **poidh-v2-contracts** - healthy, sparse. ZOE-as-bounty-executor candidate.
- **CoCConcertZ** - active but BLOCKED (Cloudinary). Unblock, then image-moderation + token-gated artist signup.
- **zaotravelz** - active campaign HQ. DreamLoops outreach loop for the 7 drafted messages.

### Farcaster + music tools
- **zaalcaster** - active (shipping today). Juke audio -> album -> snap integration.
- **channelz** - incomplete, SIWN not wired (15-min PR unblocks it).
- **zlank** - live, active. Agent-generated snap templates.
- **ZAOscout / zaoscribe** - mature, isolated -> graduate to npm packages (@zaoscout/scrapers, @zaoscribe/extractor).
- **spacetovideo** - active. Wire Deepgram streaming for live captions; feed the recap pipeline.
- **zingfisher** - live `/learn`. Respect-gate + auto-generate courses from mentor transcripts.
- **farmdrop / ltaesnap** - stale/out-of-scope; template-ize ltaesnap or sunset.

### Content + learning + fractal
- **zaoonparagraph + zabalnewsletterbuilder** - active daily-shipping pipeline. ZOE pre-grades drafts against voice -> Telegram batch summary. Highest-ROI automation in this cluster.
- **ZAOVideoEditor** - functional but CI red. Wire into the newsletter pipeline (recording -> clips -> draft candidates).
- **ZAOpaperzBOT** - stable RAG bot. thezao.xyz/ask surface + citation mode + multi-model.
- **fractalbotjuly2026** - canonical rebuild. Leaderboard + Respect integration + ZOE narration.
- **fractalbotapril2026** - stale, superseded -> deprecate.
- **bcz-journal / zao-icm / bettercallzaalwebsite** - reference tier, drifts without automation -> weekly ZOE sync agents.

## Next Actions

| Action | Owner | Type | By When | Shipped criteria |
|--------|-------|------|---------|-----------------|
| Fix Cloudinary key perms (CoCConcertZ uploads) | @Zaal | Manual | 2026-07-16 | Test upload returns a res.cloudinary.com URL; contest + gallery live |
| Label Bonfire read endpoint admin key | @Zaal | Manual | 2026-07-18 | zol + farscout can read the graph; a test query returns cited results |
| Land hermes-orchestrator PR3 + PR4 (intervention + learner) | @Zaal | PR | 2026-07-25 | Agents can be nudged mid-run + inject past outcomes at spawn; merged |
| Finish zao-mcp member gating + wire zol/farscout to it | @Zaal | PR | 2026-07-25 | Agents pull context from zao-mcp, not hardcoded; gating enforced |
| Deprecate fractalbotapril2026 (archive + migrate) | @Zaal | Manual | 2026-07-20 | April repo archived; July bot is the only running fractal bot |
| Graft DreamLoops + multi-model into farscout + zaocowork | @Zaal | PR | 2026-08-01 | Both run stateful loops with model-routing; PRs merged, tests green |

## Sources

- [FULL] Four parallel read-only repo-audit agents, 2026-07-15 (core platform, WaveWarZ/events/POIDH, Farcaster/music, content/learning/fractal) - direct reads of ~37 repo READMEs, recent commits, and structure via gh.
- [Doc 836](../836-zaoos-repo-estate-census/) - prior ZAOOS estate census (2026-06-11).
- [Doc 1110](../../business/1110-zao-roadmap-2026/), [Doc 1113](../../dev-workflows/1113-zoe-multi-model-comparison/), [Doc 1114](../../agents/1114-trycua-computer-use/) - the new capabilities this audit maps.
