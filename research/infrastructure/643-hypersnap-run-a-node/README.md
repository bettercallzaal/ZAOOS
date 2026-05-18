---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-05-11
related-docs: 309, 489, 597
tier: STANDARD
source: zaal-forwarded-url-2026-05-11
---

# 643 - Hypersnap: Should ZAO Run a Node?

> Goal: Decide whether running a Hypersnap node is worth ZAO's time, compute, and cost. What do we gain? What does it cost?

## Recommendation (FIRST)

**SKIP for now — cost-benefit doesn't close.** Hypersnap is legit infrastructure (not an airdrop farm), but ZAO gets full utility today for free via haatz.quilibrium.com with Neynar fallback. Running our own node opens future benefits (data sovereignty, custom indexing, private queries via Quilibrium privacy layer) but only if ZAO needs to operate independently from any third party. Current state: 188-member community, no token rewards, and a strong dual-provider setup already in place. Revisit Oct 2026 when ZAOstock wind-down analysis happens.

## What Hypersnap Actually Is

Hypersnap is a production-grade **independent fork of Snapchain** (Farcaster's data layer), maintained by the open farcasterorg organization. It's not official Farcaster, not a company, not VC-backed. Same consensus engine (Malachite BFT), same account-sharded data, same 10,000+ TPS — but with built-in Tantivy full-text search indexing and a public HTTP API (Neynar v2 compatible).

- **Project type:** L2 social data fork (Snapchain fork, Farcaster-compatible)
- **Live status:** Mainnet live. Public node at haatz.quilibrium.com verified daily
- **Token:** SNAP token (launched May 5, 2026 on Ethereum). Airdrop claim is live, but node operators do NOT earn SNAP as a reward
- **Node operator rewards:** None (as of May 11, 2026). Official site states "no current token rewards"
- **Backers:** None. Open community, farcasterorg governance (13-member organization, 2-reviewer rule)
- **License:** GPL-3.0 (source-available, not MIT)

## Run-a-Node Requirements (Official)

| Resource | Requirement |
|----------|-------------|
| CPU | 4 vCPU minimum (8+ recommended for faster sync) |
| RAM | 16 GB minimum (30-40 GB recommended for production) |
| Disk | 1.5 TB minimum, grows ~13-20 GB/day |
| Bandwidth | Low-hundreds GB during sync, then steady P2P traffic (cloud allowance sufficient) |
| Stake | None |
| Uptime SLA | None (best-effort community node) |
| OS | Ubuntu 24.04 LTS x64 |
| Ports | 3381/tcp (HTTP), 3382/udp (gossip), 3383/tcp (gRPC) - all require public IP |
| Sync time | 2-3 hours on Hetzner AX42 (per doc 597) |

## Rewards / Incentive Model

- **Token rewards per epoch:** None. The official run-a-node page explicitly states operators "will not earn tokens"
- **Airdrop to node operators:** The SNAP token airdrop (live May 5) is a one-time event unrelated to running a node. Operators are not eligible for additional SNAP distributions
- **Slashing risk:** No (Hypersnap uses proof-of-honest-operation; no slashing penalties for downtime)
- **Cost to run vs hypothetical reward:** Running a node costs $80-110/mo + admin time, earning $0/mo. Not a financial trade
- **Future upside:** If Hypersnap launches a node-operator incentive program (currently not planned, per official comms), operators who've been running would benefit. Unknown timing

## Comparison: ZAO's Real Options

| Option | Setup cost | Monthly cost | ZAO benefit | Trade-off |
|---|---|---|---|---|
| **Status quo (haatz + Neynar)** | None | ~$0-25/mo (Neynar reads within free tier) | Full API coverage, search, failover, zero ops burden | Depends on haatz.quilibrium.com uptime, Neynar stays cheap |
| **Run Hypersnap node on Hetzner AX42** | ~$100 (setup + review + provision) | $48-58 | Data sovereignty, custom search indexes, future privacy queries, community goodwill | $600/yr cost, syncs to 500GB/mo, ops burden (upgrade watchdog), liquidity if need to pivot |
| **Run Hypersnap node on GTHost (tighter specs)** | ~$100 | $59+ | Same as AX42 | Higher OOM risk under load, shorter disk runway (50-75 days), tight margin |
| **Run custom Snapchain validator** | Months of work | | Community election bid (15-voter process every 6mo), participate in consensus | Very high ops lift, requires sustained ZAO footprint on Farcaster |

## ZAO Use Cases (If We Ran It)

1. **Data sovereignty** - ZAO's member activity indexed independently; less reliance on third-party uptime. Weak argument: haatz already provides this for free
2. **Custom search index** - Hypersnap's Tantivy search can be configured per-instance. ZAO could index music NFTs, channel activity, or member contributions. Real but niche benefit
3. **Future privacy bridge** - If Quilibrium integrates privacy queries into Hypersnap, ZAO could run private analytics (see who follows whom, reaction patterns) without leaking member data. Roadmap item, not available today
4. **Community narrative** - Running a Hypersnap node = visible contribution to decentralization. Could be PR for ZAO's web3 credentials, but community doesn't know what Hypersnap is yet

## Risks

- **Disk growth at 188-member scale** - ~13-20 GB/day means AX42's 2TB lasts 100-150 days. Requires pruning or upgrade cycles. If community grows 10x, disk costs spike
- **SNAP token never becomes useful** - The airdrop is happening now, but the token has no clear utility. ZAO wouldn't earn it from running a node anyway, so this risk is moot
- **Hypersnap fork fractures or falls behind upstream Snapchain** - If farcasterorg loses contributors or Snapchain moves faster, Hypersnap becomes a liability. Low risk today (active PRs, clear governance), but 12-month unknown
- **Ops distraction** - Another service to monitor, upgrade, tune. ZAO already runs VPS 1 (Paperclip), ZAOstock bot, and agent infrastructure. This is "free" only if someone owns it
- **Feature lock-in** - If ZAO builds custom features on our own Hypersnap node (custom indexes, search endpoints), we're committed to maintaining it or migrating later

## Source Verification

- **Official "Run a Node" page** (https://hypersnap.org/run-a-node) - verified live May 11 2026. Explicitly states "no current token rewards"
- **Official homepage** (https://hypersnap.org) - verified live May 11 2026. Public node at haatz.quilibrium.com reported as "verified daily"
- **GitHub: farcasterorg/hypersnap** - Active. Latest commits and PRs within 48 hours (per TrendingRepo snapshot). Test coverage documented
- **SNAP token airdrop** - Live on Ethereum mainnet as of May 5, 2026. Launched at ~$0.153, now ~$0.019 (per DEX data from May 11)
- **Node operator rewards** - Zero SNAP token allocation to operators. Verified via official run-a-node copy and farcasterorg comms
- **X/Twitter sentiment** - Low-volume posting about Hypersnap. No major ecosystem integration announcements post-launch

## Ecosystem Context (Why This Matters)

Hypersnap exists in political tension: **Neynar (centralized efficiency) vs farcasterorg (decentralized independence)**. Both serve Snapchain data, but Neynar is faster/more features, farcasterorg is free/open. ZAO already hedges this via dual-provider failover in `src/lib/farcaster/neynar.ts`. Running our own node would move ZAO further down the independence path, but requires accepting the cost and ops trade-offs.

## Next Actions

| Action | Owner | Type | By when | Notes |
|--------|-------|------|---------|-------|
| Monitor farcasterorg roadmap for node-operator incentive programs | research session | Watch | Oct 2026 | If a rewards program launches, this doc auto-reverses to REVISIT |
| Document Tantivy search endpoint (doc 598) | research session | Doc | May 18 | Could be independent ZAO contribution to hypersnap-docs-web |
| Validate haatz.quilibrium.com uptime SLA (if any) | research session | Check | Jun 2026 | If haatz becomes flaky, this cost-benefit changes to INSTALL |
| Re-check this doc Oct 2026 (ZAOstock debrief) | @Zaal | Decision | Oct 10 | Bundle with "do we need data sovereignty post-festival?" discussion |

## Sources

- [Hypersnap "Run a Node" official page](https://hypersnap.org/run-a-node) - verified live May 11, 2026
- [Hypersnap homepage](https://hypersnap.org) - verified live May 11, 2026
- [SNAP token launch announcement (X/Twitter)](https://x.com/mirza_sarmin/status/2051258129111974235) - May 4, 2026 post
- [farcasterorg governance (GitHub)](https://github.com/farcasterorg/hypersnap) - active repo, latest commits within 48h
- [Doc 309 - Snapchain vs Hypersnap Protocol Deep Dive](../309-snapchain-hypersnap-protocol-deep-dive/) - technical context
- [Doc 597 - Hypersnap Install Reality Check](../597-hypersnap-install-prep/) - hardware/cost analysis
- Memory: [project_zao_os.md](~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_zao_os.md) - ZAO infrastructure status
