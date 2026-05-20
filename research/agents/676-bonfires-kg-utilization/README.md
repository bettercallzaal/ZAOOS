---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-19
related-docs: 601, 650, 664, 665, 669, 673, 676
tier: DISPATCH
---

# 676 - Bonfires Knowledge-Graph Utilization (DISPATCH)

> **Goal:** Now that the ZABAL Bonfire is usable - 780 episodes ingested, write pipeline live, ZOE bridge shipped - research every concrete way the ZAO ecosystem should USE the knowledge graph. 6 parallel sub-agents, each with a build spec.

## Headline

The ZABAL Bonfire stops being a place we dump data and becomes ZAO's shared brain. **6 utilization vectors, all buildable, ranked below.** Two are usable TODAY with zero new infra (@zabal_bonfire Telegram queries, ZOE writes). The rest are 4-8 hour builds. Everything reads better the moment an admin runs labeling - which is the single recurring unblock across all 6.

## What's in the bonfire right now

```
780 episodes = 31 brands + 80 GitHub repo READMEs + 668 research-library docs
+ live feed: every ZAOcoworkingBot /add /done + every ZOE capture (mirrorTurn)
auto-extraction building entity + edge graph (CREATED_BY / COMPLETED_BY / BELONGS_TO ...)
```

## The 6 vectors, ranked by ship-now value

| # | Vector | Usable today? | Build effort | Sub-doc |
|---|--------|---------------|--------------|---------|
| 1 | @zabal_bonfire as a team teammate (Telegram) | **YES - now** | 0 (already live) | [676d](676d-zabal-bonfire-teammate-search/) |
| 2 | ZOE writes captures/decisions to the KG | **YES - shipped** | 0 (mirrorTurn live in PR #571) | [676a](676a-zoe-recall-agent-memory/) |
| 3 | `/search` command in ZAOcoworkingBot | near-term | 4-6 h | [676d](676d-zabal-bonfire-teammate-search/) |
| 4 | Weekly fractal contribution digest | near-term | ~80 LoC | [676e](676e-governance-fractal/) |
| 5 | Cross-bot KG (all 6+ bots one graph) | architecture | shared module + per-bot wiring | [676b](676b-cross-bot-kg/) |
| 6 | Content flywheel (HyperBlog -> newsletter) | needs synthesis | 6-phase rollout | [676c](676c-content-flywheel/) |
| 7 | New-member onboarding chatbot | needs paid agent | 8 h | [676f](676f-onboarding-know-economy/) |
| 8 | ZOE recall replacing manual relay | needs labeling | wired, dormant | [676a](676a-zoe-recall-agent-memory/) |

## The two things usable RIGHT NOW (no build)

1. **@zabal_bonfire on Telegram** - per 676d, the agent is already deployed in the ZABAL Telegram group + Zaal's DMs with read access to the 780-episode KG. The team (Zaal, Iman, ThyRev, Samantha) can mention it today: "@zabal_bonfire what do we know about ZAOstock sponsors?" ~2-5s latency. No unlock.

2. **ZOE writes to the KG** - `mirrorTurn()` shipped in PR #571 mirrors every ZOE capture + completed task into the bonfire. The moment PR #571 merges + ZOE redeploys, the graph grows from her daily use automatically.

## The one recurring unblock

Every READ vector (ZOE recall, /search, onboarding chatbot, contribution digest queries) is gated on **the vector store being labeled.** `/labeling/hybrid` is 403 for the non-admin API key. Until an admin (Zaal via the dashboard, or Joshua) runs labeling once, search returns empty + everything falls back to manual relay. **This is the highest-leverage single action in the whole doc.**

## Sub-doc decisions (1-line each)

### 676a - ZOE recall + agent memory
**AUGMENT, don't replace.** ZOE's 4-block local memory (~3,200 tokens) stays as hot cache; bonfire is cold storage. Recall is on-demand (not per-turn prefetch) - ~$0.005/call, 2-4x/week, vs break-even at 7+ turns for prefetch. Human block auto-refreshes nightly from the KG via cron, replacing manual edits. 3-phase build.

### 676b - Cross-bot KG
**One shared ZABAL bonfire for Phase 1** (already minted, 0.1 ETH sunk). 6+ bots (ZOE, ZAOcoworkingBot, ZAOstockTeamBot, Magnetiq, AttaBotty, Hermes, fractal Discord bot) write ~95 events/day. Shared ingest module (bonfire.ts + spool.ts + episode.ts) copied across repos via submodule. Episodes tagged by bot source + brand + event kind. Append-only = contention-free. Federated per-brand bonfires deferred to Phase 3.

### 676c - Content flywheel
Team work -> bonfire -> Monday 11:30 cobuild triggers synthesis -> HyperBlog by Wednesday -> seeds the /newsletter skill (saves ~30 min/week of hand-recall) -> social posts. **No silent auto-publish** - Zaal final-checks voice + quality. 6-phase rollout, go/no-go at week 1. Cost $51-180/mo.

### 676d - @zabal_bonfire teammate + search
@zabal_bonfire is **live on Telegram now** - team queries it today. REST `/paid/agents/{id}/chat` is admin-gated - skip unless the team asks (Telegram is faster). Ship a `/search` command in ZAOcoworkingBot wrapping the `delve` endpoint, 4-6h, $0 on the existing Genesis tier.

### 676e - Governance / fractal
The KG has objective COMPLETED_BY edges. A weekly query "all episodes COMPLETED_BY <person> last 7 days" auto-generates each member's contribution digest **before** the Monday fractal. Augments peer-ranking with facts, doesn't replace it. Routes both OG + ZOR Respect ledgers through one source of truth. Phase 1 = ~80 LoC `/api/fractals/contribution-digest` route.

### 676f - Onboarding + $KNOW
Build `bonfire-search.zaoos.com` - a new-member chatbot over the KG ("what is WaveWarZ?", "how do I contribute?"). 8h build, ~$0.50-10/mo. zao-101 stays static for SEO. **$KNOW token: DEFER** - 7 unknowns need Joshua (post-launch date, supply, whether ingesting earns $KNOW, governance, liquidity, pricing, ERC-8004 scoring). ZAO holds a free call option; no rush.

## Recommended sequence

| Wave | Ship | Why first |
|------|------|-----------|
| 0 (now) | Tell the team they can DM @zabal_bonfire | Zero build, immediate value |
| 0 (now) | Merge PR #568 + #571 | Unblocks ZOE write-mirror + the ingest pipeline |
| 1 | Admin runs labeling on the bonfire | Unblocks every READ vector at once |
| 2 | `/search` command in ZAOcoworkingBot (676d) | 4-6h, team's daily Telegram surface |
| 2 | Weekly fractal contribution digest (676e) | ~80 LoC, lands before a Monday session |
| 3 | ZOE on-demand recall live (676a) | Wired already; labeling flips it on |
| 3 | Cross-bot KG shared module (676b) | Makes the graph ecosystem-wide |
| 4 | Content flywheel (676c) | Needs synthesis confirmed with Joshua |
| 4 | Onboarding chatbot (676f) | Needs paid-agent endpoint |

## Cross-cutting: the Joshua ask

Multiple sub-docs converge on questions only Joshua/Ryan can answer. Consolidated:
1. Run labeling on bonfire 69ef871f... (or grant an admin key) - unblocks all READ
2. `/paid/agents/{id}/chat` - pricing + how to enable
3. Synthesis / HyperBlog - automatic or manually triggered?
4. API rate limits for multi-bot writes
5. $KNOW: post-launch date, whether ingesting earns it, supply/vesting
6. ERC-8004 reputation - how it accrues, what it's worth
7. bonfires-mcp - install path for native Claude Code tools

One DM covers all 7. Draft is a Next Action below.

## What this confirms is healthy

- The write path is genuinely production-grade (secret-scan gate, spool/retry, UUID capture)
- @zabal_bonfire being live-on-Telegram-already means the team gets value before any merge
- Vendor lock-in is low - kEngrams export to Markdown/OWL (676a)
- The bonfire as ZAO's shared brain is the right architecture - 6 independent sub-agents all concluded "augment what exists, route through one graph"

## Hard numbers

- 780 episodes in the graph (31 + 80 + 668 + live feed)
- 6 utilization vectors, 2 usable today with zero build
- ~95 bot-write events/day projected once cross-bot KG lands
- ZOE recall: ~$0.005/on-demand call vs break-even 7+ turns for prefetch
- 0.1 ETH sunk on the Genesis NFT mint (the bonfire itself)
- Fractal: 12-18 participants/session, 8-15 completions/member/week
- 7 open questions for Joshua, 1 DM

## Sub-docs

- [676a - ZOE recall + agent memory](676a-zoe-recall-agent-memory/)
- [676b - Cross-bot KG architecture](676b-cross-bot-kg/)
- [676c - Content flywheel](676c-content-flywheel/)
- [676d - @zabal_bonfire teammate + search](676d-zabal-bonfire-teammate-search/)
- [676e - Governance / fractal contribution tracking](676e-governance-fractal/)
- [676f - Onboarding + $KNOW economy](676f-onboarding-know-economy/)

## Also See

- [Doc 665](../665-bonfires-deep-dive-zao-integration/) - Bonfires deep dive
- [Doc 669](../669-bonfires-everything-we-know/) - canonical Bonfires hub
- [Doc 673](../673-zoe-bonfires-dialog-automation/) - ZOE-Bonfires Phase 2 spec
- [Doc 664](../../governance/664-farcaster-fip-pow-tokenization-and-async-github-fractal/) - async fractal

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Tell the cowork team they can DM @zabal_bonfire now | @Zaal | Telegram msg | Today |
| Merge PR #568 (ingest pipeline) + #571 (ZOE bridge) | @Zaal | PR merge | This week |
| Run labeling on bonfire 69ef871f... via dashboard admin | @Zaal | Dashboard action | This week - unblocks all READ |
| DM Joshua the consolidated 7-question list | @Zaal | DM | This week |
| Build `/search` command in ZAOcoworkingBot (676d spec) | next session | PR | After labeling |
| Build weekly fractal contribution-digest route (676e spec) | Hermes | PR | Before a Monday session |
| Ship ZOE on-demand recall once labeling is live (676a) | next session | PR | After labeling |
| Cross-bot shared ingest module (676b spec) | next session | PR | Phase 3 |

## Sources

- [Doc 665](../665-bonfires-deep-dive-zao-integration/), [Doc 669](../669-bonfires-everything-we-know/), [Doc 673](../673-zoe-bonfires-dialog-automation/) - prior Bonfires research
- Bonfires API OpenAPI spec - https://tnt-v2.api.bonfires.ai/openapi.json (verified 2026-05-19)
- NERDDAO GitHub org - https://github.com/NERDDAO (bonfires-sdk, synthesis-frontend)
- 6 sub-docs above, each with their own STANDARD-tier sources (Letta/MemGPT, Mem0, CrewAI, Coordinape, SourceCred, OriginTrail, ERC-8004)
