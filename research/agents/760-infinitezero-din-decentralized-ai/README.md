---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-06-11
related-docs:
original-query: "https://github.com/InfiniteZeroFoundation/DevNet/blob/main/Documentation/GettingStarted.md - /zao-research this"
tier: STANDARD
---

# 760 — InfiniteZero / DIN: Decentralized Intelligence Network on Optimism Sepolia

> **Goal:** Capture what Infinite Zero Foundation's DIN protocol is, what its devnet (`sepolia-op-devnet`) requires from a participant, and whether ZAO should run a node or just monitor.

> **Re-research note (2026-06-11):** Re-ran from the same seed URL. The original 2026-05-28 pass was written off `GettingStarted.md` + `gh` repo metadata only and **missed the project's real provenance and mission framing**. This version adds: the founding **arXiv paper (2407.02461, Abraham Nash, Oxford, July 2024)**, the **Oxford / Solid / Berners-Lee lineage**, the rewritten README's "AI commons" privacy thesis, the previously-uncaptured `setup.md` (demo mode, wallet-password encryption, network enum), and a **name-collision warning** (din.build is a different DIN). Operational stance is unchanged but the credibility signal is materially higher.

## Key Decisions

| Decision | Recommendation | Reason |
|---|---|---|
| Run a DIN node from ZAO? | **MONITOR ONLY for now** | Still devnet (GI 2 in progress), still MNIST-only, no economic/reward layer live. Cost = OP Sepolia gas + ~10-15 min setup. Stance unchanged from 2026-05-28. |
| Did the new provenance change the call? | **Raises priority of WATCHING, not of running** | DIN is a real Oxford research output (arXiv 2407.02461) under the Shadbolt / Berners-Lee Human-Centered Computing group, built on the Solid personal-data-store idea. Serious lineage - worth tracking closely - but the devnet itself is still a federated-learning toy (MNIST). Watch harder, do not deploy yet. |
| If we run, which role? | **Auditor first, then Aggregator** | Auditor = evaluate submitted local models, lighter compute, fits ZAO's quality-judgment muscle. Aggregator = T1+T2 batch aggregation, heavier. Client requires owning a dataset that fits Model_0 (we do not). |
| ZOE integration relevance? | **LOW NOW, HIGH LATER** | DIN coordinates decentralized ML *training*, not LLM inference. Not useful for ZOE today. The integration window opens when DIN moves past MNIST toward general models. |
| Tracking cadence | **Quarterly, but read the arXiv paper + DPP repo, not just Telegram** | Foundational paper + DIN-Protocol-Proposals (DPP) repo are where real protocol direction lands. DPP is still empty (README only) as of 2026-06-11. |

## What DIN actually is

DIN = **Decentralized Intelligence Network**. A scalable federated-learning protocol coordinated by Ethereum smart contracts. Each training cycle = a **Global Iteration (GI)**. Currently on devnet: `sepolia-op-devnet` = Optimism Sepolia testnet + DIN contracts.

The flow per Global Iteration:

1. Clients train local models on their own data
2. Submit local model updates to IPFS (Filebase), reference on-chain
3. Auditors independently evaluate + approve/reject local models
4. Approved updates batched, assigned to Aggregators
5. Aggregators aggregate T1 then T2 batches
6. Global model finalized + published
7. Next iteration begins

Only **model parameter updates** are shared on-chain; **raw data never leaves the participant's device** (personal-data-store / Solid model). **Model_0** is the first registered model; training target is **MNIST** - a textbook federated-learning warm-up, not production AI.

## Provenance (NEW 2026-06-11 - the part the first pass missed)

| Fact | Source |
|---|---|
| DIN originates as an academic framework: **arXiv 2407.02461, "Decentralized Intelligence Network (DIN)", Abraham Nash, 2024-07-02** | [FULL] arXiv abstract |
| Affiliation: **University of Oxford**, Dept of Computer Science, Division of Human-Centered Computing (group associated with **Sir Nigel Shadbolt** and **Sir Tim Berners-Lee**) | [FULL] Oxford CS publication listing + README "Founded at University of Oxford" badge |
| Conceptual core = **personal data stores (Solid lineage) + federated learning on a public blockchain + a trustless cryptographic rewards/auditing mechanism**. Goal: no entity can control access to training data or capture the financial benefit. | [FULL] arXiv abstract |
| DevNet repo = the **implementation** of that 2024 paper; Model_0/MNIST is the first live instantiation | [FULL] paper + repo cross-read |

> **This reframes the project.** It is not a random testnet - it is an Oxford Human-Centered Computing group shipping the Solid-style "data stays local, models go to the commons" thesis onto Ethereum. That lineage is the reason to keep watching.

## NAME COLLISION - do not confuse (NEW)

There are **at least three different "DIN" AI projects**. Keep them separate:

| Project | What | URL | Relation |
|---|---|---|---|
| **DIN = Decentralized *Intelligence* Network** | THIS doc. Oxford / Abraham Nash, federated learning, Model_0/MNIST on OP Sepolia | github.com/InfiniteZeroFoundation | The subject |
| DIN = Decentralized *Infrastructure* Network | Web3 agentic data marketplace, separate company | din.build | UNRELATED, different DIN |
| Thames Network / Institute for Decentralized AI | Oxford-adjacent edge-AI initiative | decentralized-ai.org | Same ecosystem-adjacent, possibly overlapping people, but a distinct effort |

## Findings

| Finding | Source |
|---|---|
| Devnet status: GI 1 complete, GI 2 in progress - **unchanged since 2026-05-28** | [FULL] DevNet/Documentation/GettingStarted.md |
| Stack: Ethereum smart contracts (Sepolia OP) + IPFS via Filebase + off-chain Python compute | [FULL] same |
| Min specs: 4GB RAM, ~30GB disk, CPU only (no GPU); setup ~10-15 min for Python-fluent users | [FULL] same |
| CLI: `dincli` (Python). Distributed as a wheel: **`dincli-0.1.0-py3-none-any.whl`** + tar.gz in `dist/`. Python **3.12.3** recommended. | [FULL] **setup.md (newly captured 2026-06-11)** + `dist/` listing |
| Setup adds a **demo mode** (`dincli system configure-demo --mode no` to use real keys) and a **network selector**: `[local \| sepolia_devnet \| sepolia_op_devnet \| mainnet]` - "Testnet and Mainnet support will be rolled out in a future release" | [FULL] setup.md |
| Private key is **encrypted at rest** via `DIN_WALLET_PASSWORD` env var - decent operational security note for anyone running a node | [FULL] setup.md |
| Token: DIN token, buy + stake required for aggregator/auditor registration (`dincli aggregator dintoken buy 0.00001` then `stake 10`) | [FULL] GettingStarted.md |
| Faucets: Optimism, Chainlink, LearnWeb3, ETHGlobal, Alchemy for OP Sepolia ETH | [FULL] same |
| Economic + reward distribution = "still under active development, not yet primary focus of devnet" - **unchanged** | [FULL] same |
| **README rewritten (commit 2026-05-17)** with a strong mission thesis: "global AI commons", "raw data never leaving the user's device, only anonymised, encrypted patterns join the network", "validator nodes running 24/7 from Japan to Canada", "Models belong to the commons" | [FULL] README.md |
| Repo now ships **both Foundry and Hardhat** toolchains (`foundry/` + `hardhat/` dirs) plus `cache_model_0/`, `dincli/`, `pyproject.toml`. Contributions go through the **`develop`** branch. | [FULL] repo contents listing |
| Repo activity: `pushed_at` = **2026-06-10**, but main HEAD commit is still **2026-05-17** (recent pushes hit branches/dist, not main). 2 stars, 4 open issues (Dependabot bumps). | [FULL] gh api |
| Sister repos: White-Paper (PDF, 3 stars, last push 2025-12-28), **DIN-Protocol-Proposals-DPP (still README-only, no proposals filed, untouched since 2024-09)**, .github | [FULL] gh api orgs/InfiniteZeroFoundation/repos |
| Community channels: Telegram + Signal only (no Discord, no Farcaster, no X visible from repo) | [FULL] GettingStarted.md |
| Community sentiment online: still thin. The academic paper (arXiv 2407.02461) is the main external footprint; no notable HN/Reddit DIN-devnet discussion threads. | [PARTIAL - web search surfaces the arXiv paper + Oxford listing but no community discussion threads specific to the devnet; absence consistent across 2026-05-28 and 2026-06-11 passes] |

## Roles compared

| Role | What you do | Compute | Stake req | Best fit for ZAO |
|---|---|---|---|---|
| **Client** | Train local model on owned dataset, submit updates | Lowest (MNIST is tiny) | None mentioned for client in devnet docs | LOW - we have no dataset that fits Model_0 |
| **Auditor** | Evaluate submitted local models, approve/reject | Light (run evaluation scripts) | Buy + stake DIN (~10) | HIGH - aligns with ZAO's "judge quality" muscle |
| **Aggregator** | Aggregate T1 then T2 batches | Heavier (aggregation work) | Buy + stake DIN | MEDIUM - more compute, more reward exposure once economic layer is live |

> A single participant can run Client + Auditor + Aggregator simultaneously using multiple ETH accounts (`ETH_PRIVATE_KEY_<index>` in `.env`).

## Why ZAO might care (when, not now)

1. **Real Oxford / Solid / Berners-Lee lineage** - on-narrative for ZAO's "creators own their stuff" + autonomous-agent thesis, and a credible team, not a memecoin.
2. **OP Sepolia is a free testnet** - cost to experiment is ~zero.
3. **Mainnet announcement is the trigger.** The network enum already lists `mainnet` as "future release" - that is the moment to re-research at DEEP tier.
4. **The Auditor role is brand-aligned.** ZAO has cultural muscle around quality judgment (curation, festival lineups, COC selection). When DIN opens beyond MNIST, a ZAO-run audit agent is a plausible operator role.

## Why ZAO probably shouldn't run a node today

1. Pure MNIST training is uninteresting - no signal that scales yet.
2. Community channels are Telegram + Signal only - low transparency, hard to lurk.
3. No published mainnet timeline (only an enum placeholder).
4. Keeping a devnet node healthy across iterations costs more attention than the learning is worth while there is no economic layer.

## Also See

- arXiv 2407.02461 (Nash, 2024) - the foundational DIN paper; read before any decision to participate.
- (No other DIN-related docs in the ZAO library yet.)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Read arXiv 2407.02461 (DIN paper) end-to-end - it is the real spec, the devnet docs are just CLI steps | Zaal | Read | 2026-06-20 |
| Lurk InfiniteZero Telegram (https://t.me/+I4Tl7foCVwwwM2Vk) for mainnet / economic-layer signals | Zaal | Passive watch | 2026-07-01 |
| Watch DIN-Protocol-Proposals-DPP repo - first real proposal = the signal protocol direction is firming up | Zaal | Watch | 2026-07-01 |
| Re-research at DEEP tier the moment `mainnet` flips from "future release" to live, OR economic/reward layer ships | Zaal | Re-research trigger | conditional |
| If running a node becomes worth it: Auditor role, fresh ETH account (NOT a ZAO treasury wallet), set `DIN_WALLET_PASSWORD` | Zaal | Operational | conditional |

## Sources

- [FULL] [DevNet GettingStarted.md](https://github.com/InfiniteZeroFoundation/DevNet/blob/main/Documentation/GettingStarted.md) - full content read via raw.githubusercontent.com (541 lines), 2026-06-11
- [FULL] [DevNet setup.md](https://github.com/InfiniteZeroFoundation/DevNet/blob/main/Documentation/setup.md) - newly captured this pass; dincli install, demo mode, network enum, wallet-password encryption
- [FULL] [DevNet README.md](https://github.com/InfiniteZeroFoundation/DevNet/blob/main/README.md) - mission framing, Oxford badge, develop-branch contribution model
- [FULL] [arXiv 2407.02461 - Decentralized Intelligence Network (DIN)](https://arxiv.org/abs/2407.02461) - Abraham Nash, 2024-07-02, full abstract read
- [FULL] [Oxford CS publication listing](https://www.cs.ox.ac.uk/publications/publication16345-abstract.html) - confirms Oxford / DIN provenance
- [FULL] DevNet repo metadata, contents, dist/, org repos via `gh api` (pushed 2026-06-10, HEAD commit 2026-05-17, 2 stars, foundry+hardhat dirs)
- [FULL - name-collision flag] [din.build](https://www.din.build/) - a DIFFERENT "Decentralized Infrastructure Network", do not conflate
- [PARTIAL - no community threads] Web search for InfiniteZero / DIN devnet discussion - surfaces the arXiv paper + Oxford listing + adjacent projects (din.build, decentralized-ai.org / Thames Network) but no devnet-specific HN/Reddit threads. Absence confirmed across both research passes.
- [FAILED - intentionally skipped] White-Paper PDF (single binary, out of scope for STANDARD; the arXiv paper supersedes it as the citable source)
