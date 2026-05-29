---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-05-28
related-docs:
original-query: "https://github.com/InfiniteZeroFoundation/DevNet/blob/main/Documentation/GettingStarted.md - /zao-research this"
tier: STANDARD
---

# 760 — InfiniteZero / DIN: Decentralized Intelligence Network on Optimism Sepolia

> **Goal:** Capture what Infinite Zero Foundation's DIN protocol is, what its devnet (`sepolia-op-devnet`) requires from a participant, and whether ZAO should run a node or just monitor.

## Key Decisions

| Decision | Recommendation | Reason |
|---|---|---|
| Run a DIN node from ZAO? | **MONITOR ONLY for now** | Devnet phase, GI 2 in progress, no economic layer live yet. Cost = ETH gas on Optimism Sepolia + ~10-15 min setup. Upside is learning + early-mover positioning when mainnet launches. |
| If we run, which role? | **Auditor first, then Aggregator** | Auditor work = evaluating submitted models, lighter compute, good fit for a ZAO operator watching for quality signals. Aggregator = Tier 1 + Tier 2 batch aggregation, heavier. Client role requires owning data, less useful for ZAO. |
| ZOE integration relevance? | **LOW NOW, HIGH LATER** | DIN is decentralized ML model training coordination, not LLM inference. Not directly useful for ZOE today. Watch for the moment DIN expands beyond MNIST to general inference - that is the integration window. |
| Tracking cadence | **Quarterly check** | Devnet is early; quarterly read of Telegram + GitHub commit cadence + DPP (DIN Protocol Proposals) is enough until mainnet announcement. |

## What DIN actually is

DIN = Decentralized Intelligence Network. Ethereum smart contracts coordinate decentralized AI training cycles. Each cycle = "Global Iteration" (GI). Currently on devnet (`sepolia-op-devnet` = Optimism Sepolia + DIN contracts).

The flow per Global Iteration:

1. Clients train local models on their own data
2. Submit local model updates to IPFS (Filebase), reference on-chain
3. Auditors independently evaluate + approve/reject local models
4. Approved updates batched, assigned to Aggregators
5. Aggregators aggregate T1 then T2 batches
6. Global model finalized + published
7. Next iteration begins

**Model_0** is the first registered model. Training target: **MNIST** (the handwritten-digit dataset). This is a textbook decentralized-federated-learning warm-up, not production AI yet.

## Findings

| Finding | Source |
|---|---|
| Devnet status: GI 1 complete, GI 2 in progress (as of 2026-05-28) | [FULL] DevNet/Documentation/GettingStarted.md |
| Stack: Ethereum smart contracts (Sepolia OP) + IPFS via Filebase + off-chain Python compute | [FULL] same |
| Min specs: 4GB RAM, ~30GB disk, CPU only (no GPU required) | [FULL] same, line 146-149 |
| Setup time: ~10-15 min for Python-fluent users | [FULL] same |
| CLI: `dincli` (Python) - `dincli system init`, `dincli aggregator register`, etc. | [FULL] same |
| Token: DIN token, buy + stake required for aggregator/auditor registration (e.g. `dincli aggregator dintoken buy 0.00001` then `stake 10`) | [FULL] same |
| Faucets: Optimism, Chainlink, LearnWeb3, ETHGlobal, Alchemy for OP Sepolia ETH | [FULL] same |
| Economic + reward distribution = "still under active development, not yet primary focus of devnet" | [FULL] same, line 170-172 |
| Repo: Python primary, 2 stars, 4 open issues (all Dependabot bumps), last push 2026-05-24 | [FULL] gh api repos/InfiniteZeroFoundation/DevNet |
| Sister repos: White-Paper (just a PDF), DIN-Protocol-Proposals-DPP, .github | [FULL] gh api orgs/InfiniteZeroFoundation/repos |
| Community channels: Telegram + Signal only (no Discord, no Farcaster, no X account visible from repo) | [FULL] same, line 178-194 |
| Community sentiment online: very thin. HN/Reddit return adjacent projects (AIgr.id, Raypher, etc.) but no notable DIN discussion threads as of 2026-05-28. | [PARTIAL - HN Algolia + Reddit JSON search returned no DIN-specific threads; absence confirmed via 2 queries, may resurface as project matures] |
| No prior research in ZAO library on InfiniteZero, DIN, or DevNet | [FULL] grep across `/Users/zaalpanthaki/Documents/ZAO OS V1/research/` |

## Roles compared

| Role | What you do | Compute | Stake req | Best fit for ZAO |
|---|---|---|---|---|
| **Client** | Train local model on owned dataset, submit updates | Lowest (MNIST is tiny) | None mentioned for client role in devnet docs | LOW - we don't have a dataset to contribute that fits the model |
| **Auditor** | Evaluate submitted local models, approve/reject | Light (run evaluation scripts) | Buy + stake DIN (e.g. 10 DIN) | HIGH - aligns with ZAO's "judge quality" muscle |
| **Aggregator** | Aggregate Tier 1 then Tier 2 batches | Heavier (aggregation work) | Buy + stake DIN | MEDIUM - more compute, more reward exposure when economic layer is live |

> Per docs: a single participant can run as Client + Auditor + Aggregator simultaneously using multiple ETH accounts.

## Why ZAO might care (when, not now)

1. **Decentralized AI is on-narrative for ZAO's broader thesis.** ZAO's positioning as "digital creators" + autonomous agents (ZOE) is adjacent.
2. **Optimism Sepolia is a free testnet** - cost to experiment = essentially zero.
3. **Mainnet announcement is the trigger.** Until then, no economic upside.
4. **The Auditor role is interesting.** ZAO has cultural muscle around quality judgment (curation, festival lineups, COC concert selection). When DIN opens beyond MNIST, an "audit agent" run by ZAO could be a brand-aligned operator role.

## Why ZAO probably shouldn't run a node today

1. Pure MNIST training is uninteresting - no signal that scales.
2. Community channels are Telegram + Signal only - low transparency, hard to lurk.
3. No published mainnet timeline.
4. Time-cost to keep a devnet node healthy across iterations > learning value when there's no economic layer yet.

## Also See

(None yet - this is the first DIN-related doc in the library.)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Lurk in InfiniteZero Telegram (https://t.me/+I4Tl7foCVwwwM2Vk) for 4 weeks, note mainnet signals | Zaal | Passive watch | 2026-06-25 |
| Re-check at Q3 if economic layer / mainnet timeline announced; if so re-research as DEEP | Zaal | Re-research trigger | 2026-09-01 |
| If running a node becomes worth it: do Auditor role first on a fresh ETH account, not a ZAO treasury wallet | Zaal | Operational | conditional |
| Bookmark DIN-Protocol-Proposals-DPP repo for governance proposals - that is where the interesting protocol shifts will land | Zaal | Watch | 2026-06-01 |

## Sources

- [FULL] [DevNet GettingStarted.md](https://github.com/InfiniteZeroFoundation/DevNet/blob/main/Documentation/GettingStarted.md) - fetched via `gh api repos/InfiniteZeroFoundation/DevNet/contents/Documentation/GettingStarted.md` (541 lines, full content read)
- [FULL] [DevNet repo](https://github.com/InfiniteZeroFoundation/DevNet) - metadata, issues, language, last-push date via gh api
- [FULL] [InfiniteZero org repos](https://github.com/InfiniteZeroFoundation) - White-Paper, DIN-Protocol-Proposals-DPP, DevNet, .github
- [FULL] [Optimism Sepolia faucet ecosystem](https://console.optimism.io/faucet) and 4 others listed in DevNet doc - linkable, not all verified individually
- [PARTIAL - no thread results] HN Algolia search for "Infinite Zero Network DIN" and "Decentralized Intelligence Network" - returned adjacent projects (AIgr.id, Raypher) but no DIN-specific discussion. Confirmed empty, not a fetch failure.
- [PARTIAL - no thread results] Reddit JSON search for "Infinite Zero DIN decentralized" - empty result set. Project not yet on Reddit's radar as of 2026-05-28.
- [FAILED - intentionally skipped] White-Paper PDF was not fetched (single PDF binary, not in scope for STANDARD tier; revisit at DEEP re-research if mainnet announced).
