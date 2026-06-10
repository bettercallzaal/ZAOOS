---
topic: governance
type: market-research
status: research-complete
last-validated: 2026-06-09
superseded-by:
related-docs: "784, 778, 458"
original-query: "/zao-research https://www.deepfunding.org/ https://x.com/deep_funding"
tier: STANDARD
---

# 835 - Deep Funding (AI-PGF: a market of AI models, a human jury)

> **Goal:** Research Deep Funding (deepfunding.org + @deep_funding) - Vitalik's AI-assisted public-goods funding mechanism - and map its pattern to ZAO's ZABAL Games judging, POIDH bounties, and contribution-weighting.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Deep Funding's "AI proposes weights, human jury spot-checks" IS the ZABAL Games judging architecture - adopt it explicitly as the design reference** | ZAO already sketched this in doc 784 (Plat0x/Bonfire: GitHub -> rubric-judging). Deep Funding is the same shape, validated at $250k by Vitalik/EF: AI models score contributions, a human jury checks a random sample, the best-aligned model's scores allocate. Steal the spot-check-not-judge-everything mechanic for the July build-a-thon - it scales judging past what mentors can manually review. |
| 2 | **Frame ZAO contribution-funding as a GRAPH problem, not an application pile** | Deep Funding's key reframe: not "how much did X contribute?" but "how much of the credit for outcome Y belongs to X?" For ZAO, that maps to ZOLs / Respect / Fractal contribution credit - weight contributions by their position in the dependency/impact graph, not flat per-submission. Higher signal than equal grants. |
| 3 | **TRACK for a future ZAO/ZABAL funding rail; do not build the full mechanism now** | The mechanism is real but nascent (only initial rounds done, "unproven at scale" per Gitcoin). ZAO is too small for a 40k-edge graph. The transferable pieces are the judging pattern (Decision 1) and the graph framing (Decision 2), not the whole Kaggle-competition apparatus. |

## Findings

### What it is

Deep Funding is an **AI-powered public-goods funding mechanism conceived by Vitalik Buterin**, run via deepfunding.org (with Gitcoin + Ethereum Foundation + Allo Capital + Pairwise + eval.science as collaborators). It reframes funding allocation as a **graph credit-attribution problem**: instead of "how much did project X contribute to humanity?" it asks "how much of the credit for outcome Y belongs to dependency X?"

### The three components (the transferable pattern)

1. **Dependency graph** - map the ecosystem's contribution relationships. Ethereum's initial graph: ~40,000 edges, seeded from consensus clients (Prysm, Lighthouse, Teku, Nimbus, Lodestar, Grandine) + execution clients (go-ethereum, Nethermind, Besu, Erigon, Reth), extended 2 hops out.
2. **A market of AI models** - an open contest (hosted on Kaggle) where anyone submits a model that proposes weights across the graph edges. Models may use code analysis, usage metrics, network centrality, community signals - any method.
3. **A human jury spot-check** - jurors do detailed analysis of a RANDOM sample of edges (not all 40k). The model whose weights best match the jury's ground-truth wins, and its weights allocate the whole pool. This is the scaling trick: humans steer without reviewing everything.

### The numbers (initial round)

- Vitalik sponsored **$250k**: **$170k** to OSS repos by computed weight, **$40k** to the best jury-aligned model, **$40k** to open-source model submissions (the deepfunding.org page rounds this to $170k + $50k = $220k).
- First round submissions ran **Feb 10 - May 10, 2025**.
- **A "major round" closed ~March 2026** - Vitalik (posting as vitalik.eth, 2026-03-11) confirmed "deep funding is continuing, and recently finished a major round," and advised researcher Devansh Mehta to keep refining it, including a **prediction-market version**.

### The novelty + the risk

- **Novelty:** Vitalik frames it as "collective prediction of future impact" - distinct from quadratic funding (community voting on what they like today) and traditional grants (institutional gatekeepers). It rewards what the crowd predicts will matter, validated by AI+jury rather than vibes.
- **Bull:** meritocratic (avoids excessive egalitarianism), scales to thousands of recipients no committee could review, AI-assisted but human-steered, fully open/auditable.
- **Bear (Vitalik's own caution):** prediction-driven funding can be gamed; opaque funding sources compromise neutrality; "if markets become the steering wheel, the definition of 'impact' and who measures it becomes the real battleground." Still "nascent and unproven at scale" (Gitcoin, early 2026).

### @deep_funding

The X account (522 followers) bio: "Driving rewards to open source repos with a market of AIs as the engine and humans as the steering wheel." Small but official.

## ZAO Application

- **ZABAL Games judging (doc 784):** Deep Funding is the proven reference for the GitHub -> AI-rubric-judging pipeline Plat0x/Bonfire sketched. Adopt the spot-check pattern: AI scores all submissions, mentors jury-check a random sample, the best-aligned scoring governs payouts. Scales the July build-a-thon judging.
- **Contribution credit (ZOLs / Respect / Fractal):** the graph-credit reframe ("credit for outcome Y belongs to X") is a sharper model than flat contribution points - weight by impact-graph position.
- **POIDH bounties / ZAO Fund for Emerging Culture (Artizen match fund):** a future "ZAO Deep Funding" mini-round could allocate a pool across ecosystem contributors via this mechanism once ZAO has a contribution graph worth weighting.

## Also See

- [Doc 784](../../events/784-plat0x-bonfire-zabal-architecture-may29/) - Plat0x/Bonfire GitHub -> rubric-judging (the ZAO sketch of this pattern)
- [Doc 778](../../events/778-tyler-magnetic-zabal-games-build-may27/) - ZABAL Games (where the judging rail lands)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fold the AI-scores + jury-spot-check pattern into the ZABAL Games July judging spec (doc 784) | @Zaal | Design | Pre-July build-a-thon |
| Reframe ZOL/Respect contribution credit as graph-weighted (credit-for-outcome), not flat per-submission | @Zaal | Governance | Next governance pass |
| Watch for Devansh Mehta's prediction-market spec + the major-round disclosures; re-validate this doc when published | @Zaal | Watch | Q3 2026 |

## Sources

- [deepfunding.org](https://www.deepfunding.org/) `[FULL - WebFetch; mechanism, 3 components, $220k split, Feb-May 2025 round, EF/Allo/Pairwise collaborators]`
- [@deep_funding](https://x.com/deep_funding) `[FULL - FxTwitter profile; 522 followers, bio]`
- [Gitcoin - Deep Funding (AI-PGF) mechanism](https://gitcoin.co/mechanisms/deep-funding) `[FULL via exa highlight; graph reframe, ~40k edges, Kaggle model contest, $250k split, jury spot-check, "nascent/unproven at scale"]`
- [Gitcoin - DeepFunding app](https://gitcoin.co/apps/deepfunding) `[FULL via exa highlight; consensus+execution client seeds, 2-hop graph, single/two-layer comparisons, eval.science]`
- [APED.ai - Vitalik: Deep Funding closed a major round (2026-03-13)](https://aped.ai/news/vitalik-buterin-says-deep-funding-just-closed-a-major-roundurges-refining-the-prediction-market-model-and-transparency-on-funding-sources) `[FULL via exa highlight; March 2026 major round, prediction-market guidance, "collective prediction of future impact"]`
- [PANews - Vitalik on deep funding for chaotic times (2026-03-11)](https://www.panewslab.com/en/articles/019cdb51-1aaa-71e9-9e3a-703f58d19bb0) `[FULL via exa highlight; meritocracy + AI-with-human-dominance advantages, "stable era" critique]`
