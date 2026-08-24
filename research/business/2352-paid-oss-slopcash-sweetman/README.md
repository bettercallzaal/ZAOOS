---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-24
superseded-by: null
related-docs: "1133, 365, 472"
original-query: "https://slop.cash/projects/eliza /zao-research this and also find other opensource repos that i could get paid for working on thats prob my easiest and best opportunity since it aligns with what im building also look up sweetman.eth and what he has done he is looking for builders"
tier: STANDARD
---

# 2352 - Paid Open-Source Work in 2026: slop.cash, the Bounty Market Reality, and the Sweetman Door

> **Goal:** Decide whether paid open-source contribution (slop.cash/eliza and peers) is a real income lane for a ZAO-ecosystem builder with heavy agent tooling, and what the sweetman.eth connection is actually worth.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| slop.cash Eliza pool | **TRY CHEAP, DO NOT BET** - one-day experiment cap until a verified payout exists | $10,000/mo pool advertised BUT the site's own leaderboard says "Payouts are off during beta" and "3 monthly pools awaiting verified funding." Top grinder (LAlalalune, 903 accepted events) holds a SIMULATED $3,497 share. Marginal cost is near zero for an agent-heavy builder, so a small run buys a public contributor record either way - but this is record-building, not income, until money moves |
| Algora-style bounty grinding | **SKIP as an income plan** | Independent census (verified from raw source): of 561 open issues advertising $1,142,625, **5 are plausibly claimable, $60 visible**. Paid bounties never close their issues, archived repos keep bounties, and fresh bounties draw 8-158 competing agent PRs within hours. The advertised market is ~99% phantom |
| OnlyDust Fellowship | **PURSUE - the one structured paid path** | $300-5,000/mo for 3 months, selected from consistent quality contributors ($18M distributed to 4,000 contributors over 4 years). Caveat: OnlyDust's own manifesto says maintainers began rejecting external money and the org pivoted focus to security (ctrlg.com) - verify the Fellowship is still funding before investing months |
| sweetman.eth outreach | **DO IT - the real opportunity in this query** | Music + agents + onchain is his exact lane and ZAO's exact lane. Warm surface already mapped in doc 1133. His current public work (artist catalog valuation agents, "LATASHA $1M in 200 days") is a natural collaboration for a 250-artist community. NOTE: "he is looking for builders" is Zaal-reported and NOT verified in any fetched public source - the DM confirms or kills it |
| Immunefi / Tenstorrent bounties | SKIP | $1k-$10M payouts but require security-audit / ML-hardware expertise outside the current skillset |

## What slop.cash actually is (fetched 2026-08-24)

GitHub-native contribution rewards, repo `elizaOS/slopdotcash` (renamed from `elizaOS/army`). Model: pick a project, install its "skill" into your coding agent (one-command installer targeting `~/.codex/skills` - Codex-flavored but adaptable), ship PRs, maintainers accept, accepted outcomes share a monthly pool by score. GitHub stays the source of truth; slop publishes score + review + payment state.

Live projects (Aug 13, 2026 state):
| Project | Pool | Notes |
|---|---|---|
| Eliza (elizaOS framework) | $10,000/mo | 73 scored contributors, 3,411 accepted score. Leaderboard #1 simulated $3,497/mo, #10 $227, #20 $107 |
| ASI (JAX continual-RL) | $5,000/mo | benchmark hill-climbing, seed-controlled comparisons required |
| Heir Elements SDK | $100/mo | tiny pool |
| Delta Star | $1,000,000 external prize | machine-checked Reed-Solomon proximity proofs - specialist mathematics |

**The three honesty flags:** (1) "Payouts are off during beta" - every dollar on the leaderboard is simulated; (2) pools "awaiting verified funding"; (3) the elizaOS ecosystem had token-collapse reports in early Aug 2026 (unverified, low-quality sources - but two independent signals now). An agent-army is already grinding it: #1 has 903 accepted events. Late entry competes with established farms.

## The 2026 paid-OSS market, measured not advertised

- **Algora**: avg payout $50-500, ~15% merge rate, 1-4 week payment, 9% org fee, agent-saturated (8-158 competing PRs per fresh bounty). Real but thin and crowded.
- **The census correction** (AsherKasper/bounty-census, README read raw - itself written by an autonomous agent as a $0-to-$1,000 experiment): 561 open bounty-labeled issues advertise $1.14M; after removing already-paid (labels never close) and archived repos, **5 claimable, $60 visible**. One repo - `ClankerNation/OpenAgents` - carries $1,091,100 across 201 issues with 12 stars and ZERO pull requests: treat as a red flag, not an opportunity.
- **OnlyDust**: $18M distributed historically; AI agent allocated $1M/mo across 2,000+ devs; current offering is the Fellowship ($300-5k/mo x 3 months, merit-selected, monthly review). Org pivoting toward supply-chain security.
- Smaller real lanes: WarpSpeed ($330-960, React Native/TS, approval required), converse.js ($100 first-merged-PR), direct repo bounties (Aeternity pays CHF).

**Structural read**: agent tooling made bounty supply hyper-competitive in 2026 - the arbitrage ("I have agents, others don't") is gone. What still pays: sustained, trusted contribution records (OnlyDust model) and relationships with maintainers - not drive-by PRs.

## sweetman.eth - update on doc 1133 (full study lives there)

Patrick Sweetman, CTO of Recoup ~2 years. GitHub `sweetmantech`: 272 public repos, "the dev for onchain music, helping musicians get paid," blog research.recoupable.com. Resume: Mint Songs (acquired by Napster), Coop Records, Sonata, In Process, Liquid-Splits, music-metadata hyperstructure npm package, ETH Denver 2024 finalist. Location conflicts across profiles (GitHub: Colombia; LinkedIn: Columbus OH; market.dev: Buenos Aires) - nomadic, do not assume.

**What is new since doc 1133 (7/16):**
1. **Artist catalog valuation agents** - shipped publicly: LATASHA's 27 releases since 2016, 3.84M streams, valued ~$16k (range $11-22k) from public data, weekly delta tracking. Her stated goal: "a world worth $1 million in 200 days."
2. **kismet.art** - raising $10k = 2 years runway; $6k raised via patron collection (7/12 post).
3. **`eliza-agentkit-starter` repo** - he is IN the eliza agent orbit, which connects both halves of this research: the person Zaal wants to work with already builds on the framework slop.cash pays for.
4. Farcaster (fid 23366) has 18 followers - **Farcaster is NOT his surface; LinkedIn + X + GitHub are.** Outreach goes there.

**The unverified claim**: "he is looking for builders" appears in no fetched source. It may come from a cast/post not indexed. The move is a direct DM referencing real overlap (agents for artist operations; a 250-artist community as a live testbed), not a job ask.

## Codebase grounding

- Prior study: `research/music/1133-recoupable-sweetman-study/README.md` (this repo) - architecture, MCP server pattern, partnership verdicts.
- ZAO's own agent stack lives at `bot/src/zoe/` (this repo) - Recoupable's structured artist-data MCP pattern was already flagged in 1133 as the pattern ZOE needs; any sweetman collaboration compounds work already underway.

## Also See

- [Doc 1133](../../music/1133-recoupable-sweetman-study/) - the deep sweetman/Recoupable study
- [Doc 365](../../dev-workflows/365-recoupable-monorepo-best-practices/) - Recoupable monorepo patterns
- [Doc 472](../../dev-workflows/472-ai-tooling-roundup-apr21/) - AI tooling roundup

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| DM sweetman (X or LinkedIn, NOT Farcaster) referencing catalog-valuation work + ZAO's 250-artist testbed; confirm or kill the "looking for builders" claim. Shipped = DM sent | @Zaal | outreach | 2026-08-27 |
| One-day slop.cash experiment: adapt the eliza skill, ship 1-2 PRs to elizaOS, log accepted score. Shipped = PR merged or verdict written back to this doc | @Zaal (agent-assisted) | experiment | 2026-08-31 |
| Verify OnlyDust Fellowship is currently funding (docs page + Discord ask); create contributor profile if yes. Shipped = profile live or "not funding" noted here | @Zaal | signup | 2026-08-31 |
| Re-validate this doc when slop.cash announces first VERIFIED payout; until then it stays record-building | @Zaal | re-research | 2026-09-15 |

## Sources

- [slop.cash](https://slop.cash) - [FULL - exa web_fetch; curl returned JS shell first, escalated] verified 2026-08-24
- [slop.cash/projects/eliza](https://slop.cash/projects/eliza) - [FULL - exa web_fetch] verified 2026-08-24
- [AsherKasper/bounty-census README](https://github.com/AsherKasper/bounty-census) - [FULL - raw.githubusercontent.com curl, read verbatim] verified 2026-08-24
- [GitHub: sweetmantech](https://github.com/SweetmanTech) - [FULL - exa search content: profile, repos, bio] verified 2026-08-24
- [Farcaster user-by-username API, fid 23366](https://client.warpcast.com/v2/user-by-username?username=sweetman) - [FULL - direct keyless API] verified 2026-08-24
- [LinkedIn: sweetmantech posts Jul-Aug 2026](https://linkedin.com/in/sweetmantech) - [PARTIAL - exa highlights of post bodies; full comment threads not fetched, LinkedIn login-walled - escalation exhausted] 2026-08-24
- [The 2026 Open Source Money Map (agentupdate.ai)](https://www.agentupdate.ai/news/open-source-monetization-map-2026/) - [PARTIAL - exa highlights; per-platform stats quoted from highlights] 2026-08-24
- [OnlyDust manifesto](https://www.onlydust.com/) + [Fellowship docs](https://docs.onlydust.com/contributors-hiya/onlydust-fellowship) + [$1M AI-allocation blog](https://blog.onlydust.com/we-gave-1m-to-oss-contributors-with-an-ai-agent-it-wasnt-enough/) - [PARTIAL - exa highlights across three pages] 2026-08-24
- [Algora on OSS.Fund](https://www.oss.fund/algora/) - [PARTIAL - exa highlights; fee + stats from listing] 2026-08-24
- [Paragraph: Hyperstructures for Music (sweetman, 2022)](https://paragraph.com/@sweetman-eth/hyperstructures-for-music) - [PARTIAL - exa highlights; historical context only] 2026-08-24

## EXTENSION 2026-08-24 (same day): the "should we just work on Recoup?" decision

Follow-up question researched: is Recoup itself the open-source opportunity, and should it get exclusive focus?

### Recoup's actual contribution surface (gh api, verified 2026-08-24)
- **Org is active DAILY**: `chat` (110 open issues, pushed today), `api` (103 issues), `docs` (36), `skills`, `tasks` - all live.
- **But the shop is tiny and closed in practice**: the last 15 merged PRs on `chat` are ALL by sweetmantech himself. Whole visible team: sweetmantech + techeng322 + sidneyswift + two coding agents (`recoup-coding-agent`, `cursoragent`). `chat` has NO LICENSE file (all-rights-reserved by default) and no CONTRIBUTING.md.
- **The one explicitly open door: `recoupable/skills`** - has contributing.md, a RESOLVER.md routing table, CI that fails on unreachable skills, and instructions for adding skills + fixtures. Apache-2.0 on the plugin repos, MIT on docs. This is where outside PRs are invited.
- **Business state** (research.recoupable.com/blog/recoup-in-2026, read via exa): PROFITABLE, two enterprise partners, 2026 goal is enterprise retention/expansion. Their open strategy, verbatim: "open templates, agent recipes, integrations and SDKs while keeping enterprise features secure." Q4 2025 stack included x402 (agent payments).
- **No paid contributor program exists.** No job postings found. Contributing to Recoup earns relationship and record, not money - today.

### Verdict: NOT "just Recoup" - Recoup-FIRST, three lanes
1. **The handshake (this week)**: 1-2 quality PRs to `recoupable/skills` - the repo that explicitly invites it. A music-community operator shipping a skill (e.g. a community/event-ops skill informed by running 250+ artists) is the most credible possible DM opener.
2. **The relationship (the DM)**: sweetman outreach now references shipped work, not intentions. The ask is not a job: it is "your enterprise-retention roadmap needs artist-side distribution; I run the testbed."
3. **The real money angle is NOT employment**: Recoup exposes its stack via API/MCP with agent self-signup. A community operator can deliver label-services (research briefs, catalog valuations, content batches) to their own artists ON Recoup's stack - their blog explicitly wants developers building on it. That converts an existing artist network into a service line without waiting on anyone's hiring plans.
4. **Parallel lanes stay open** (from the main doc): OnlyDust Fellowship verification, the one-day slop.cash record-building run. Retroactive public-goods funding (Base Builder Grants, Optimism RetroPGF when a round opens, Octant) remains the structural fit for open-source work already shipped - retro lanes pay for aligned work, bounty lanes pay for races.

### Next Actions (extension)
| Action | Owner | Type | By When |
|---|---|---|---|
| Ship 1 PR to recoupable/skills (follow contributing.md + RESOLVER.md + fixture; CI green). Shipped = PR open with passing checks | @Zaal (agent-assisted) | PR | 2026-08-28 |
| THEN send the sweetman DM referencing the shipped PR | @Zaal | outreach | 2026-08-29 |
| Scope one Recoup-API-powered service for community artists (inputs: their 30 research endpoints; agent signup endpoint is auth-free). Shipped = one-page service spec | @Zaal | draft | 2026-09-05 |
