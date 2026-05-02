---
topic: farcaster
type: market-research
status: research-complete
last-validated: 2026-05-02
related-docs: 304, 309, 489, 534, 586
tier: DISPATCH
---

# 587 - Hypersnap + Quilibrium + farcasterorg Ecosystem (May 2026 Status)

> **Goal:** Synthesize current state of the parallel-Farcaster ecosystem Cassie Heart is building. Cover Hypersnap technical state, farcasterorg governance, the 13/15/11 power map, Quilibrium token + adoption, the FIP-19 "$HYPS" token speculation, Cassie's intent signals, and concrete warm-intro contribution targets. Pairs with Doc 586 (install playbook) so we know not just *how* to run the node but *why* and *how to engage the maintainer*.

## TL;DR Headlines

| Finding | Evidence |
|---|---|
| **There is no Farcaster token. There is a Hypersnap token coming, designed anti-speculative.** | Cassie filed a ~15,000-word FIP-19 (Proof-of-Work Tokenization) on 2026-03-24 in `farcasterorg`. Deterministic retroactive rewards, no airdrop, no team/investor allocation. FIDs 1 (Farcaster) and 309857 (Base App) explicitly **excluded**. Farcaster (the canonical project, now Neynar-stewarded) issued a public clarification on 2026-04-15: "There will be no token issuance." Dan Romero on 2026-01-28: "I had wanted to issue a token for Farcaster, but the right timing never came." (Source: Nicky Sap Substack, Apr 15 2026). |
| **FIP-11 functional signers cuts over on Snapchain MAINNET on 2026-05-07 17:00 UTC.** | Snapchain PR #870. **5 days from this doc's date.** Hypersnap v0.11.6 stable (2026-03-31) does NOT have it; the gap will widen until Hypersnap v0.11.7. **Operational implication: don't deploy ZAO writes that depend on functional signers via our own node until Hypersnap catches up.** |
| **The "11 validators" number is forward-looking spec, not current state.** | Only **6 validators** active as of 2026-05-02 per `validators.toml`. 5 are Neynar (one rotated mid-consensus on Jan 28 at block 26,386,684). 1 is **Uno** (joined Feb 23 2026 at block 28,415,000 — first non-Neynar validator). Spec permits up to 11; election cycle next due ~Aug 2026. |
| **Quilibrium is shipping but the token is dead money.** | $0.01152 (May 2 2026), -97.5% from ATH ($0.4514, Sept 23 2024), $10.4M market cap, $185K-$328K daily volume. Ceremonyclient monorepo last commit: 2026-05-02 (today, on v2.1.0.23 release branch). Privacy stack (oblivious hypergraph, E2EE, QStorage, QKMS, QCL, mixnet) all SHIPPED in Q1 2025. Apps adopting Q: zero outside Cassie's own (Quorum Messenger + Hypersnap). |
| **Cassie last commit: 2026-05-02 (Quilibrium monorepo). Last gist: 2026-04-18 ("how to hypersnap"). Last Hypersnap merge: 2026-04-28 PR #10.** | She is shipping HARD. Communication via code, not blog posts. Last public roadmap doc: May 2024. Last podcast: Web3 Galaxy Brain (early 2024). Heads-down through Quilibrium mainnet launch (~late May / early June 2026). |
| **Best ZAO contribution target: Hypersnap Issue #17 (notification aggregation).** | Open since 2026-04-29, author stephancill (community contributor), unmerged. Scope: aggregate mentions + reactions + follows from RocksDB into deduped/sorted/cursor-paginated notifications endpoint, +8 unit tests +1 integration test. Difficulty 6/10. Direct utility for ZAO. **High odds Cassie merges if tests pass.** |

## The Power Map (Who Controls What)

```
ON-CHAIN (OP Mainnet + Base)
  IdRegistry / IdGateway / StorageRegistry / KeyRegistry / TierRegistry
    -> immutable contracts, no governance change since acquisition

OFF-CHAIN GOVERNANCE
  farcasterxyz GitHub (Neynar-controlled, post-acquisition Jan 21 2026)
    -> Snapchain reference impl (MIT)
    -> 5 of 6 active validators
    -> issues all FIPs ("rough consensus + running code")
    -> NO token, NO airdrop, NO governance vote (per Dan Romero + Apr 15 clarification)

  farcasterorg GitHub (independent, created by Cassie 2026-02-15)
    -> Hypersnap fork (GPL-3.0)
    -> serves haatz.quilibrium.com (free Neynar v2 API)
    -> 1 of 6 active validators (Uno, joined Feb 23 2026)
    -> FIP-19 token spec (Hypersnap-only, ~15K words, anti-speculative PoW)
    -> nominally "13 members + 2-reviewer rule" per Doc 304 - but only 6 names
       publicly verified as of 2026-05-02 (gated org, members API requires auth)

THE 15 VOTERS
  Anonymous-ish. Per FIP-207 Appendix A: rough-consensus chosen,
  6-month rotation, votes stored as GitHub-repo signatures (repo location
  not public), 80% participation threshold. Next election: ~Aug 2026.

THE 11 VALIDATORS (currently 6)
  5 x Neynar (ed25519 keys: 29696eb4, 6bc2d890, 81032ece, db65769b
    [replaced 2c0f58a3 at block 26,386,684 on Jan 28], 67474a42)
  1 x Uno (ed25519 key 80d7800b, joined Feb 23 2026 at block 28,415,000,
    runs on GKE; "first non-Neynar validator")
  Spec permits 11; spaces for 5 more open.
```

## The 13 farcasterorg Members (Best Available Mapping)

The org is created (2026-02-15) but member visibility is gated. Public API + repo authorship reveals only 6 of the claimed 13:

| GitHub Handle | Affiliation | Evidence |
|---|---|---|
| @CassOnMars | Quilibrium BDFL, ex-Farcaster, ex-Coinbase | Org creator, 61% of Mar-Apr 2026 commits |
| @jfarid27 | Farcaster SDK contributor | Contributed `hypersnap` + `farcasterorg-sdk` Mar 2026 |
| @dvl38 | Farcaster / OpenClaw contributor | Contributed `hypersnap` + `snap` Mar-Apr 2026 |
| @rishavmukherji | **Neynar CEO Rish** | Listed as contributor on `farcasterorg/snap`. **The independent counterweight has Neynar's CEO as a member - tells us the fork is diplomatic, not adversarial.** |
| @bob-obringer | Neynar / Farcaster | Listed as contributor on `farcasterorg/snap` |
| @lyoshenka | Farcaster dev | Listed as contributor on `farcasterorg/snap` |
| 7 unknown | (likely core Snapchain + Quilibrium devs) | Membership API gated; no announcement cast pinned the list |

**Read of this:** farcasterorg is a *technical alignment* org, not a *political opposition* org. Neynar leadership is on the inside. The fork is the safety valve, not the schism.

## Hypersnap Technical State (v0.11.6 Stable, 2026-05-02)

| Dimension | Value |
|---|---|
| Latest stable | v0.11.6 (tagged 2026-03-31) |
| Latest upstream Snapchain | v0.11.8 (released 2026-04-30) |
| Lag vs upstream | 7-10 days typical, currently 32 days (v0.11.6 stable was 8 days *ahead* of upstream v0.11.6 — March; new release imminent) |
| Commits since v0.11.6 | 16+ |
| Last merge to main | PR #10 (2026-04-28) - "fix: missing hyper api, backfill, nightly deploys" |
| Sole committer | @CassOnMars (100% of Hypersnap-specific commits in last 90d) |
| Open PRs | 4 (PR #17 notif agg by @stephancill, #13 FIP-19/21 docs by @CryptoExplor, #12 feed_type=filter by @hellno, #2 FIP-11 placeholder, 70d stale) |
| Open issues | 7 (with 2 placeholder/test tickets) |
| GitHub reactions on issues | 0 across all issues. Low community surface. |
| Test config | docker-compose.testnet.yml: separate validators, separate bootstrap peers (4 AWS IPs different from mainnet), `.rocks.testnet` dir, README marks "UNSTABLE. Use at your own risk." |
| Nightly config | docker-compose.nightly.yml: tracks mainnet validators but pulls latest image daily. Multi-stage validator sets show consensus rotation events at heights 26,386,684 / 28,415,000 / 28,706,000 / 28,852,000. |

### Hypersnap-only Endpoints (vs Reference Snapchain)

1. **Tantivy full-text search** — across casts + users (not in Snapchain). Endpoint paths inferred but not formally documented; enumerate via `grpcurl list` after sync.
2. **Bulk RPC methods** — bulk fetch endpoints landed 2026-04-06.
3. **Feed filtering** — `feed_type=filter` (PR #12 pending, hellno).
4. **User hydrator** — fills cast/user data on read-nodes (PR #9 merged 2026-03-30).
5. **Webhooks/notifications** — `POST /v1/notifications` + webhook subscriptions (merged 2026-04-11).
6. **Bifurcated HTTP server** — Hyper framework HTTP at `0.0.0.0:3381`, separate from gRPC at `0.0.0.0:3383`. Snapchain reference is gRPC-primary; Hypersnap added the Neynar v2-compat HTTP layer that haatz.quilibrium.com exposes for free.

### Performance + Resource Reality

No published Grafana dashboards from Hypersnap operators. Inference from Snapchain reference operator threads (Reddit r/farcaster):

| VPS Class | Sync Time | Steady RAM | Disk @ 30d | Notes |
|---|---|---|---|---|
| Hetzner AX42 (16C/64GB/2TB NVMe) | 1.5-2h | 30-40 GB | 400-600 GB | Recommended floor |
| GTHost Ashburn (8C/32GB/1TB NVMe) | 2-3h | 28-32 GB | 350-500 GB | Workable; OOM risk on default backfill |
| OVH baremetal (48C/256GB/4TB) | 30 min | 30 GB | 600 GB | Overkill but allows multi-node colocation |
| Hostinger KVM 2 (8C/8GB/200GB) | N/A | OOM | full | **DOES NOT FIT.** |

Add 10-20% headroom for Tantivy index. Hypersnap had 2 memory leak fixes pre-v0.11.6 (2026-02-27, 2026-03-13); post-v0.11.6 telemetry is unpublished. Plan weekly `curl localhost:3381/v1/info` health checks.

### Backup + Restore

Not documented officially. Inferred safe path:

1. `docker compose down`
2. `rsync -av .rocks* .tantivy* zaal@new-vps:hypersnap/`
3. `docker compose up -d` on new box
4. Watch for Tantivy reindex on first boot (10-30 min cost). Test on testnet first.

## The FIP-19 "Hypersnap Token" — What It Actually Says

Filed 2026-03-24 by @CassOnMars in `farcasterorg`. ~15,000 words. Source: Nicky Sap Substack ("The First Farcaster Token Isn't Coming From Farcaster", 2026-04-15).

| Property | Value |
|---|---|
| Type | Proof-of-Work tokenization |
| Distribution | **Deterministic retroactive computation**, NOT airdrop |
| Allocation basis | Casts, reactions, storage rent, validator uptime — anchored to on-chain participation |
| Team allocation | 0% |
| Investor allocation | 0% |
| Pre-mine | 0% |
| Excluded FIDs | **1 (Farcaster) and 309857 (Base App)** — explicitly excluded so no implied protocol blessing |
| Anti-speculative design | Rewards proportional to network utility, not wealth. Anti-whale mechanics. |
| Bifurcation effect | **Probably none** in 2026. Snapchain (Neynar-stewarded) won't tokenize. Hypersnap is a parallel infrastructure track, not a forced replacement. Validators may dual-run if economically rational. |
| Retroactive precedent | Helium HIP-92 (2023) is the only clean precedent for "ran nodes for free, then got tokens via governance vote." Akash + Pocket did NOT retroactively reward early operators. |

**ZAO posture:** Operate Hypersnap node as **infra sovereignty + 1 lottery ticket**, not as a position. Track FIP-19 evolution monthly. If retroactive rewards land for early operators, we win a small amount; if they don't, we still got the API.

## Quilibrium ($QUIL) — Shipping But Languishing

| Metric | Value (2026-05-02) | Source |
|---|---|---|
| Wrapped QUIL price | $0.01152 | coingecko.com/en/coins/wrapped-quil |
| Market cap | $10.39M (902.29M circulating supply) | coingecko |
| 24h volume | $184K-$328K | coingecko / mexc |
| ATH | $0.4514 (2024-09-23) | coingecko |
| 90d change | -48.87% | coingecko |
| All-time low | $0.003549 | coingecko |
| Distance from ATL | +23.5% | computed |
| Active regions | 4 | infoquil.qstorage.quilibrium.com |
| Active nodes (historical baseline) | ~11,000 | quilibrium.guide (2024 reference; current count not publicly displayed) |
| Last monorepo commit | 2026-05-02 | github.com/QuilibriumNetwork/monorepo |
| Active release branch | v2.1.0.23 | created 2026-04-22, 6+ commits/day through May 2 |
| Last Cassie blog post | 2024-05-16 ("What to Expect When You're Expecting 2.0") | paragraph.xyz/@quilibrium.com — 18 months stale |

### What Q has shipped (Q1 2025 "Dusk")

- Multi-shard mainnet (live)
- End-to-end encryption on transactions (live)
- Oblivious hypergraph (live)
- QStorage (decentralized object storage)
- QKMS (key management)
- QConsole (operator dashboard)
- QCL (Quilibrium Computation Language - privacy-preserving smart-contract layer; not Solidity)
- Mixnet (network-level traffic privacy via shuffled lattice routing)

### What Q has NOT shipped

- "Equinox" phase (lambda functions, Redis-like DBs, advanced data structures) - **STALLED**, no public ETA
- "Event Horizon" phase (E2E encrypted streaming, AI/ML training, decentralized OS layer) - **STALLED**, no public ETA
- Any third-party app on Quilibrium other than Cassie's own (Quorum Messenger + Hypersnap)
- A 2026 roadmap doc

### Operator economics

- No staking, no slashing
- Rewards = work-proportional via Proof-of-Meaningful-Work, computed automatically
- "Ring" structure: Ring 0 = optimal latency, high rewards; Ring 4+ = many nodes, diluted rewards
- **Sub-breakeven at current $0.0115 token price.** A node earning ~1000 QUIL/mo grosses $11.50; even a Pi-class node loses money on electricity at that rate. Operators are ideological / long-vol speculators, not yield seekers.

### Bottom line on Q for ZAO

**WAIT.** Don't bet on Q for ZAO infra. Hypersnap (which runs on Q infrastructure tangentially) is the right play; full Q adoption is not. Re-evaluate Oct 2026 if Equinox ships + a credible 2026 roadmap is published. The optionality is preserved at zero cost — we already cite haatz.quilibrium.com which sits on this stack.

## Cassie Heart - 90-Day Activity Profile + Warm-Intro Strategy

### What she shipped (last 90 days)

| Date | Event | Repo / Source |
|---|---|---|
| 2026-05-02 | Latest commit | QuilibriumNetwork/monorepo (v2.1.0.23 branch) |
| 2026-04-29 | Reviewed/discussed | farcasterorg/hypersnap PR #17 (notif agg by stephancill) |
| 2026-04-28 | Merged | farcasterorg/hypersnap PR #10 ("fix: missing hyper api, backfill, nightly deploys") |
| 2026-04-22 | Opened release branch | Quilibrium v2.1.0.23 |
| 2026-04-18 | Published | gist "how to hypersnap" (cbb2007b...) |
| 2026-04-14 | Updated | farcasterorg/hypersnap-docs-web |
| 2026-04-11 | Personal repo push | CassOnMars/heds-kks-sim (medical research, hEDS off-label simulation; OFF-TOPIC for ZAO outreach) |

**Tone signal:** Bio reads "BDFL of Quilibrium, eng @ Farcaster, ex-Coinbase, always opinionated, ultra caffeinated, never hydrated." She values: technical depth, fair-launch ethos, free-tier infra, decentralization-as-practice. She rejects: marketing speak, federation-as-decentralization, unsolicited DMs, investment pitches, clones / wallet drainers.

### What she'd accept (Hypersnap issue menu, ranked for ZAO)

| Issue | Title | Difficulty | ZAO Fit | Notes |
|---|---|---|---|---|
| **#17** | fix: aggregate notifications, hydrate casts, add pagination | 6/10 | **HIGHEST** | Open PR by stephancill since 2026-04-29. We can either review-and-supplement or land a competing implementation that adds the requested 8 unit tests + 1 integration test. Direct utility for ZAO inbox. |
| #12 | add feed_type=filter, hydrate full casts in reactions | 5/10 | HIGH | Lower scope, also pending. Faster turnaround. |
| #13 | feat(hyper): StateContext helpers, SyncReport, FIP-19/21 docs | 8/10 | MEDIUM | Tokenomics + introspection docs. High-value but Cassie's domain; we'd be a co-author at best. |
| #15 | fork rewards | 7/10 | MEDIUM | Tokenomics consensus work. Likely needs FIP-19 to land first. |
| #2 | FIP-11 functional signers + hypersnap primitives | 9/10 | LOW | 70 days stale, blocked on upstream FIP-11 spec which cuts over 2026-05-07. Avoid until upstream ships. |

### What she would NOT accept

- Unsolicited DMs ("just checking in")
- Investment pitches disguised as feedback
- Marketing-first feature requests
- Centralized solutions sold as decentralized
- Anything assuming low competence ("ELI5")

### Top 3 Warm-Intro Moves (Ranked)

1. **Fix Hypersnap Issue #17** — implement notification aggregation with the requested test coverage. Open PR. Ship within 7-10 days. Probability of merge if perf-bounded + tested: HIGH.
2. **Document the ZAO -> Hypersnap integration pattern.** Three-part guide: (a) running Hypersnap as a ZAO read-source, (b) wiring 3-tier failover (own node -> haatz -> Neynar) in `src/lib/farcaster/neynar.ts`, (c) caching + rate-limit etiquette. Submit as PR to `farcasterorg/hypersnap-docs-web`. Could become canonical reference for app-dev onboarding.
3. **Run Hypersnap node + post empirical bottleneck report.** Boot time, RAM/CPU/disk profile, p50/p95/p99 endpoint latency under ZAO traffic, observed bugs. Open as GitHub issue with concrete fix proposals. Builds operator credibility.

**Avoid for now (heads-down phase):** Anything requiring her synchronous attention this month. She's launching Quilibrium v2.1.0.23. Best PR-merge window: late May / early June 2026, after that ships.

## Adjacent Token Snapshot (For ZAO Context)

| Token | Status (May 2 2026) | ZAO Relevance |
|---|---|---|
| $DEGEN | $0.000656-$0.000695, $15.69M cap, 1M+ holders, ~$50K/d tipping volume | LIVE. Tipping infra still works on Farcaster. Degen Chain L3 functional. |
| $CLANKER | Sub-penny, $8.4B+ cumulative volume, ~10K-13K daily token launches, $50M+ cumulative protocol fees, treasury holds 14% via buyback-and-burn | Owned by Neynar post-Jan 2026 acquisition. ZAO touchpoint via miniapps. |
| $PROCOIN | Community experiment, peaked $3.5M cap May 2025, settled $2M | Not official. Useful precedent for "ZAO Pro" community-token experiment IF we cross 10K users. |
| $HIGHER, $ENJOY, $BUILD, $NOICE | No 2026 mentions in search | Effectively quiet. Don't reference in roadmap. |
| $QUIL | $0.0115, languishing | Don't bet ZAO on this. |
| Farcaster Pro ($120/yr USDC) | 10K subscribers in <6h on launch (May 2025), $1.2M+ revenue, 100% to creator/dev rewards | Direct revenue benchmark for any future "ZAO Pro" tier. |

## Bifurcation Risk - Will Hypersnap + Snapchain Diverge?

**Near-term (2026):** No forced bifurcation. Hypersnap and Snapchain share Malachite BFT consensus + same on-chain anchors (FID registry, storage rent, key registry). Validators can dual-run. App devs choose which read path to use. The fork is *infra plurality*, not protocol war.

**Medium-term (2027+):** If FIP-19 token launches and Hypersnap operators earn meaningfully while Snapchain operators don't, Snapchain validators may migrate. But Snapchain's 5 Neynar slots aren't going anywhere; the bifurcation only matters at the long-tail validator slots that aren't yet filled.

**Long-term:** If Quilibrium ships Equinox + privacy-preserving queries, Hypersnap inherits a feature Snapchain reference cannot match without similar infrastructure investment. That's the structural moat. Until then, the two are functionally interchangeable for read-node use cases.

## ZAO Decision Matrix

| Question | Answer | Why |
|---|---|---|
| Run a Hypersnap node? | YES (Doc 586 install playbook, this week, GTHost Ashburn). | Sovereignty + bot fleet sub-ms reads + warm-intro chip. |
| Run a Snapchain (farcasterxyz reference) node instead? | NO. | Loses the Tantivy + Neynar v2 HTTP compat that makes Hypersnap useful for ZAO clients. |
| Become a Snapchain validator? | NOT YET. Maybe Aug 2026 election cycle. | Needs 3+ months of stable read-node operation + community reputation + Neynar coordination. Odds 5-25%. |
| Become a Hypersnap validator? | DEFER. | farcasterorg validator set isn't formally defined yet. Watch FIP-19 + governance docs land first. |
| Bet on FIP-19 ($HYPS) retroactive airdrop? | NO. **Treat as zero-EV bonus.** | Anti-speculative spec means rewards are utility-bound. Helium-style retroactive correction has precedent but is rare. Plan ZAO economics on $0 from this. |
| Bet on Quilibrium QUIL? | NO. | Token languishing 18 months, no roadmap, no apps. Reconsider Oct 2026. |
| Buy Farcaster Pro $120/yr for ZAO? | YES (low-cost, future-proof). | Real benchmark + maybe future PROCOIN-style community drops. |
| Tokenize ZAO directly? | DEFER until 10K users. | PROCOIN precedent: works as community experiment, not revenue driver. |
| Contribute to Hypersnap upstream? | YES, target Issue #17. | Highest-leverage warm intro to Cassie. |
| Engage Cassie via DM? | NO. | Bio + observed behavior says no. Use code (PRs, issues) only. |
| Engage Cassie via cast reply? | OK if substantive. | She reads replies on her casts. Concise + technical only. |

## Action Bridge (Concrete Next Moves)

| Action | Owner | Type | By When |
|---|---|---|---|
| Order GTHost Ashburn box per Doc 586 | @Zaal | Procurement | Today |
| Run Doc 586 install playbook on new box | Claude session | Ops | Within 24h of VPS access |
| **Pin to v0.11.6**, lag upstream by 7-10 days | Claude session | Ops | At install time |
| **Schedule alert for 2026-05-07 17:00 UTC** (FIP-11 functional signers cutover on Snapchain mainnet) | @Zaal + Claude | Calendar | This week |
| Watch for Hypersnap v0.11.7 release (will include FIP-11 + likely PRs #17 + #12 merged) | Claude | Monitor | Weekly check |
| Test Hypersnap v0.11.7 on testnet box first before promoting to mainnet | Claude session | Ops | When v0.11.7 lands |
| Implement Issue #17 (notification aggregation) - PR to farcasterorg/hypersnap | Claude session + @Zaal | Code | Within 14 days of Hypersnap node going live |
| Write ZAO -> Hypersnap integration guide; PR to farcasterorg/hypersnap-docs-web | Claude session | Docs | After Issue #17 PR lands |
| Subscribe ZAO to Farcaster Pro ($120/yr) | @Zaal | Subscription | This month |
| Re-validate this doc (Cassie ships, governance changes, prices move) | Claude | Audit | 2026-06-02 (30-day SLA) |
| Re-evaluate Quilibrium adoption | Claude | Research | 2026-10-02 (post-Equinox check) |
| Evaluate Snapchain validator slot eligibility for Aug 2026 election cycle | @Zaal | Decision | 2026-07-15 |

## Verified URLs (May 2 2026)

### Primary - Hypersnap + farcasterorg
- https://github.com/farcasterorg/hypersnap (41 stars, GPL-3.0, last push 2026-04-28, v0.11.6 stable)
- https://github.com/farcasterorg (org, created 2026-02-15)
- https://github.com/farcasterorg/hypersnap/issues/17 (notif agg, 2026-04-29 by stephancill)
- https://github.com/farcasterorg/hypersnap/pull/10 (merged 2026-04-28)
- https://gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7 (how to hypersnap, 2026-04-18)
- https://hypersnap-docs.qstorage.quilibrium.com/ (docs site)

### Primary - Snapchain
- https://github.com/farcasterxyz/snapchain (v0.11.8 latest, 2026-04-30)
- https://github.com/farcasterxyz/snapchain/blob/main/validators.toml (6 validator keys + history)
- https://snapchain.farcaster.xyz/validators (current validator list)
- https://snapchain.farcaster.xyz/whitepaper (Appendix A: 15-voter governance)
- https://github.com/farcasterxyz/protocol/discussions/207 (FIP: Snapchain finalized 2024-11-25)
- https://github.com/farcasterxyz/protocol/discussions/265 (How to Become a Validator, 2026-03-xx)
- https://github.com/farcasterxyz/protocol/discussions/266 (FIP-266 Snapchain Signers, 2026-04-07)
- https://github.com/farcasterxyz/protocol/discussions/262 (FIP-262 Functional Signers, 2026-02-21, Cassie author)

### Primary - FIP-19 + token clarification
- https://nickysap.substack.com/p/the-first-farcaster-token-isnt-coming (2026-04-15)
- https://www.weex.com/news/detail/farcaster-clarifies-that-it-will-not-issue-tokens-and-the-related-token-discussion-actually-pertains-to-the-fork-project-hypersnap-655792 (2026-04-15)
- https://longbridge.com/en/news/273933294 (Dan Romero on token timing, 2026-01-28)

### Primary - Quilibrium
- https://github.com/QuilibriumNetwork/monorepo (last commit 2026-05-02)
- https://github.com/QuilibriumNetwork/monorepo/pull/529 (v2.1.0.23 release, opened 2026-04-22)
- https://www.coingecko.com/en/coins/wrapped-quil (price $0.01152)
- https://infoquil.qstorage.quilibrium.com/ (4 active regions)
- https://paragraph.xyz/@quilibrium.com (last post 2024-05-16)

### Primary - Cassie
- https://github.com/CassOnMars (52 repos, 419 followers)
- https://farcaster.xyz/cass.eth (FID 1325, ~403K followers)
- https://web3galaxybrain.com/episode/Cassandra-Heart-Founder-of-Quilibrium (early 2024 podcast)

### Vendor (VPS)
- https://gthost.com/dedicated-servers (yura's pick, $59+/mo, 19 locations)
- https://www.hetzner.com/dedicated-rootserver (AX42 ~$48-58/mo)
- https://www.hetzner.com/sb (Server Auctions, $30-50 used hardware)

### Adjacent tokens
- https://baseadvice.com/2026/02/21/degen-token-farcaster-base-guide-from-tipping-experiment-to-1b-meme-ecosystem-on-base-blockchain/ (DEGEN status)
- https://splits.org/blog/pro-permissionless-integration/ (Farcaster Pro launch)
- https://firefly.social/post/farcaster/0xde2f1d05b248174fc2eefd2f6c3628cc604f41b7 (PROCOIN airdrop, 2025-05-29)

### Internal (ZAO research library)
- research/farcaster/304-quilibrium-hypersnap-free-neynar-api/ (2026-04-08, free haatz endpoint discovery)
- research/farcaster/309-snapchain-hypersnap-protocol-deep-dive/ (2026-04-09, protocol architecture)
- research/farcaster/489-hypersnap-farcaster-node-cassonmars/ (2026-04-23, intro)
- research/farcaster/534-snap-best-practices-from-the-wild/ (operator best practices)
- research/farcaster/586-hypersnap-node-vps-install-playbook/ (2026-05-02, install playbook + VPS purchase)

## What's NOT Yet Verified (Open Questions)

These are flagged so a future audit can close them:

1. **Identities of all 13 farcasterorg members.** Only 6 names publicly mappable as of 2026-05-02. The org's people page is gated.
2. **Identities of the 15 Snapchain voters.** No public roster. Per FIP-207 Appendix A votes are stored as GitHub-repo signatures but the repo location is not public.
3. **Last Snapchain election cycle date + outcome.** Spec says 6-month rotation; we infer next election is ~Aug 2026 but cannot confirm.
4. **Hypersnap-unique endpoint full reference.** No formal API spec doc; must enumerate via `grpcurl list` post-install.
5. **Exact Hypersnap v0.11.7 release date** (will include FIP-11 functional signers).
6. **Whether Hypersnap nightly tracks Q infrastructure for hosting** vs just running latest Docker.
7. **Whether Cassie will accept a 13th-member nomination from a non-protocol-core contributor like ZAO.** Likely no, but worth tracking signal.
