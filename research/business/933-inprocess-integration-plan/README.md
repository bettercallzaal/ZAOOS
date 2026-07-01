---
topic: business
type: design
status: research-complete
last-validated: 2026-07-01
related-docs: 931, 932
original-query: "https://docs.inprocess.world/ research this + plan an open-source repo we wanna build in; plan only, ask via ZOE if ready to build"
tier: DEEP
---

# 933 - InProcess integration PLAN (zao-inprocess open-source repo)

> **Goal:** A plan (not a build) for an open-source repo ZAO builds on InProcess. Review, then say build.

## What InProcess is
A live Web3 platform (inprocess.world / inprocess.fun, Base + Coinbase smart-wallet SDK, Arweave+IPFS storage) where creators document their creative journey on-chain as "moments" (works-in-progress) organized into collections. Collectors participate, comment, and fund via splits contracts. Full REST API (artists, moments, collections, revenue splits, wallet auth, analytics). Notably it publishes a docs.inprocess.world/llms.txt (the exact pattern from doc 917). Status: LIVE / production-ready; minimal public presence (bootstrapped/quiet); no published license or SLA found.

## Why relevant to ZAO
Build-in-public is ZAO's DNA; "moments = literal on-chain records of progress" extends research docs + Bonfire. Base-native (188 members on Base, no bridging). Concrete surfaces:
- WaveWarZ: musicians mint singles/stems as moments in production; collectors pre-fund; splits to featured artists.
- ZABAL Games: each round = collection, each submission = moment, winners minted with splits to mentors (solves the crediting/payout gap).
- ZAO Research: ZOE posts major docs as moments to an "Ecosystem Learning Timeline" (dual record with Bonfire).
- Governance/treasury: major decisions/partnerships minted as an on-chain "ZAO Governance Timeline."
- Agentic fleet: Hermes/ZOE milestones auto-post as moments.

## The repo plan - `zao-inprocess`
A TypeScript SDK + CLI wrapping the InProcess API with ZAO abstractions (moments-for-docs, moments-for-songs, moments-for-votes).

**MVP (Phase 1, ~3 wks, 1 dev):** SDK wrapper (auth, collections, moments, splits, wallet) + CLI (`zao-inprocess auth`, `create-collection`, `mint-moment`, `fetch-timeline`) + integration test vs live API + README + one worked example (mint a research doc as a moment). Standalone, no ZOE/Hermes dependency yet.

**Phase 2 (~3 wks):** Bonfire export (moments -> knowledge graph), ZOE hook (auto-mint on major research-doc creation), Next.js analytics dashboard (collections + collector leaderboards), ZABAL Games collection template.

**Stack:** TS/Node 20 + tsx, axios, Commander.js CLI, Next.js 16 dashboard (Phase 2), ZAO Supabase cache, InProcess email-OTP auth. Publish as `@zao/inprocess` (github.com/ZADEVZ/zao-inprocess), MIT or AGPL.

**First command to ship:** `zao-inprocess mint-research <doc-id>` - pulls from research/ and mints as a moment. Success: Zaal auths + mints a real doc to the live timeline within a week.

## Risks
- API stability (no published SLA) - mitigate with caching + circuit breaker + mock mode.
- License/ToS unknown - PING the InProcess team before public release (Day-1 gate).
- Adoption friction - start manual CLI, add ZOE automation only after Zaal confirms value.
- Arweave permanence vs IPFS speed - hybrid (Arweave metadata, IPFS media).
- Base-only assumption - design SDK to accept chainId.

## Recommendation
BUILD Phase 1 MVP - InProcess is production-ready, Base-aligned, and moments extend ZAO's build-in-public DNA; low downside (~3 wks, close the repo if adoption is low). Gate: confirm license/ToS with the InProcess team first.

## Next Actions
| Phase | Task | Owner | Gate |
|-------|------|-------|------|
| 0 | Ping InProcess team re: open-source / API ToS | Zaal | no legal blocker |
| 1 | SDK wrapper + CLI (TS) | Dev | green tests |
| 1 | Zaal manual end-to-end test (auth + mint a doc) | Zaal | screenshots |
| 1 | Public GitHub release + Farcaster announce | Zaal | repo public, no secrets |
| 2 | Bonfire export + ZOE auto-mint hook (if value confirmed) | Dev | moments in Bonfire, ZOE auto-posts |

## Sources
- [docs.inprocess.world](https://docs.inprocess.world) + [llms.txt](https://docs.inprocess.world/llms.txt) - FULL (API, SDK, storage)
- [inprocess.world](https://www.inprocess.world/) - FULL (product)
- Web3 creator-economy + Arweave/IPFS context - PARTIAL
- License, team, funding, uptime - FAILED (not public; confirm directly with the team)
