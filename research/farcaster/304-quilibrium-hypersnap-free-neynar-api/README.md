# 304 - Quilibrium, Hypersnap, and Free Neynar API via haatz.quilibrium.com

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Understand Quilibrium's Hypersnap node, the free Neynar-compatible API at haatz.quilibrium.com, and what it means for ZAO OS

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use haatz.quilibrium.com for READ endpoints** | USE as a free fallback/secondary for read-only Neynar v2 calls (feed, user lookup, search). Saves $99-500/mo on Neynar credits for read-heavy operations |
| **Keep Neynar API key for WRITE endpoints** | KEEP paid Neynar for signer creation, cast posting, follow/unfollow, and any write operations that require an API key for auth |
| **Dual-provider architecture** | USE haatz as primary for reads, Neynar as primary for writes. Failover from haatz to Neynar on read errors. One env var swap, zero code changes |
| **Monitor Cassie's farcasterorg governance work** | WATCH - Cassie's independent protocol org (13 members, 2-reviewer PR merge rule) is the decentralization counterweight to Neynar's acquisition |
| **Run own Hypersnap node (future)** | SKIP for now - requires 16GB RAM, 4 cores, 1.5TB storage, 2-hour sync. Use haatz.quilibrium.com until ZAO needs dedicated infrastructure |

## The Big Picture: What Happened to Farcaster

### The Neynar Acquisition (January 21, 2026)

Neynar acquired the Farcaster protocol, Warpcast client, all code repos, and Clanker from Merkle Manufactory. The founders (Dan Romero, Varun Srinivasan) returned the full **$180 million** to investors - Paradigm got $150M back, plus a16z, Haun Ventures, USV, Variant, and Standard Crypto.

**Why it happened:** Farcaster's monthly protocol revenue had collapsed to ~$10,000/month. Only 4,360 users held Power Badges. The capital structure was unsustainable. Neynar, already the dominant infrastructure provider, acquired at minimal cost.

**The governance gap:** Farcaster had no governance token, no DAO, no community vote. The protocol transferred between private companies without community input. Neynar now controls: protocol spec, primary client, API layer, code repos, and Clanker.

### Cassie Heart's Response: farcasterorg

Cassie Heart (BDFL of Quilibrium, ex-Farcaster engineer, ex-Coinbase) created the **farcasterorg** GitHub organization as an independent counterweight:

| GitHub Org | Owner | Purpose |
|------------|-------|---------|
| `farcasterxyz` | Neynar (acquired) | Neynar employees only, Snapchain reference implementation |
| `farcasterorg` | Independent (13 members) | Independent protocol stewardship, Hypersnap, FIPs require 2 independent reviewer approvals |

**Key quote from Cassie's cast:** "PRs require two independent reviewers outside of the original contributor to merge, and PRs match to FIPs, other than bug fixes."

The farcasterorg has 3 repos:
1. **hypersnap** (Rust, GPL-3.0, 18 stars) - "Snapchain, made hyperdimensional"
2. **snap** (TypeScript) - Farcaster Snaps framework (embedded apps in casts)
3. **protocol** (empty, reserved) - Future independent protocol spec

## What is Hypersnap?

Hypersnap is the canonical open-source implementation of Farcaster's Snapchain network, built in Rust. Snapchain is the blockchain-like data layer that stores and syncs all Farcaster social data (casts, reactions, follows, user profiles).

### Technical Specs

| Spec | Value |
|------|-------|
| Language | Rust (96.9% of codebase) |
| Throughput | 10,000+ TPS |
| Node cost | < $1,000/month |
| RAM | 16 GB minimum |
| CPU | 4 cores/vCPUs |
| Storage | 1.5 TB |
| Sync time | Up to 2 hours for historical snapshot |
| Ports | 3381-3383 (TCP/UDP) |
| License | GPL-3.0 |
| Commits | 635 |

### How Hypersnap Differs from Snapchain (farcasterxyz)

Both are implementations of the same Snapchain spec. The "hyperdimensional" branding suggests Hypersnap incorporates Quilibrium's hypergraph data structures on top of the Snapchain spec, giving it richer data relationships than the reference implementation.

## The Free Neynar API: haatz.quilibrium.com

### What It Is

Quilibrium runs a Hypersnap node and exposes a **Neynar v2 API-compatible REST endpoint** at `haatz.quilibrium.com`. No API key required. All Neynar API endpoints are available.

**Cassie's cast:** "Anyone running a hypersnap node can enable theirs. We enabled ours and exposed it because we're frankly tired of neynar bilking the last few builders on this platform for $500 a month."

### Verified Endpoints (Tested April 8, 2026)

| Endpoint | URL | Status | Notes |
|----------|-----|--------|-------|
| User feed | `/v2/farcaster/feed?fid=1325` | WORKING | Returns casts array + pagination cursor |
| User bulk lookup | `/v2/farcaster/user/bulk?fids=1325` | WORKING | Full profile: bio, followers (403,197 for Cassie), verified addresses |
| User search | `/v2/farcaster/user/search?q=zaal&limit=3` | WORKING | Found Zaal (FID 19640, 6,115 followers) |
| Channel feed | `/v2/farcaster/feed/channels?channel_ids=zao&limit=3` | WORKING | Returns /zao channel casts with full author data |
| Trending feed | `/v2/farcaster/feed/trending?limit=3` | TIMEOUT | May have rate limits or load issues |
| Cast conversation | `/v2/farcaster/cast/conversation?identifier=...&type=hash` | 404 | May need valid hash |

### Response Format

The response format is nearly identical to Neynar v2 but with minor differences:
- **Pagination:** Uses `{"next": {"cursor": "166188295"}}` instead of Neynar's `next_cursor`
- **No wrapper fields:** Missing Neynar's `success`/`code` metadata
- **Same data structure:** Cast objects, author profiles, reactions, embeds, mentioned profiles all match Neynar v2 schema

### What's Missing vs Paid Neynar

| Feature | haatz (free) | Neynar (paid) |
|---------|-------------|---------------|
| Read endpoints (feed, user, search) | All available | All available |
| Write endpoints (cast, follow, react) | Unknown - needs API key | Full support |
| Signer creation/management | Unknown | Full support |
| Webhooks | No | Yes |
| Frame validation | Unknown | Yes |
| Rate limits | Unknown (API metrics dashboard exists) | Tier-dependent |
| SLA/uptime guarantee | Community-run, best effort | Paid tier SLA |
| Feed generation/algorithms | Yes | Yes |

## Comparison: Neynar vs Hypersnap vs Self-Hosted Hub

| Option | Monthly Cost | Setup Time | Read API | Write API | Webhooks | Maintenance |
|--------|-------------|------------|----------|-----------|----------|-------------|
| Neynar Paid (starter) | $99/mo | 5 minutes | Full | Full | Yes | None |
| Neynar Paid (growth) | $499/mo | 5 minutes | Full + higher limits | Full | Yes | None |
| haatz.quilibrium.com | $0 | 0 minutes | Full (no key) | Unknown | No | None |
| Self-hosted Hypersnap | ~$100-200/mo (VPS) | 2+ hours | gRPC + REST | Via protocol | No | You manage |
| Self-hosted Hubble | ~$50-100/mo (VPS) | 1+ hours | HTTP API | Limited | No | You manage |

## ZAO OS Integration

### Current Architecture

ZAO OS uses Neynar v2 API exclusively via `src/lib/farcaster/neynar.ts`:
- Base URL hardcoded: `https://api.neynar.com/v2/farcaster`
- API key from `ENV.NEYNAR_API_KEY` (required env var in `src/lib/env.ts`)
- 69 files across `src/` reference Neynar
- All read AND write operations go through the same base URL

### Integration Plan: Dual-Provider with Zero Code Changes

**Step 1: Add env var for read base URL**

In `src/lib/env.ts`, add:
```
FARCASTER_READ_API_URL: optionalEnv('FARCASTER_READ_API_URL') || 'https://api.neynar.com'
```

**Step 2: Split neynar.ts into read/write base URLs**

In `src/lib/farcaster/neynar.ts`:
- Read functions (getTrendingFeed, getChannelFeed, getCastThread, getUserByFid, getUsersByFids, getUserByAddress, searchUsers, getFollowers, getFollowing, getRelevantFollowers) use `FARCASTER_READ_API_URL`
- Write functions (postCast, createSigner, registerSignedKey, followUser, unfollowUser, registerUser) keep using `api.neynar.com` with API key

**Step 3: Set env var**
```
FARCASTER_READ_API_URL=https://haatz.quilibrium.com
```

**Step 4: Add failover (optional)**

If haatz returns an error, fall back to Neynar for reads. Simple try/catch wrapper.

### Estimated Savings

ZAO OS is read-heavy (feed loading, user lookups, search). Rough estimate:
- 80-90% of API calls are reads (feeds, profiles, search)
- 10-20% are writes (casting, following, reactions)
- If reads go through haatz: saves most of the Neynar bill

## Who is Cassie Heart?

| Detail | Value |
|--------|-------|
| Farcaster username | @cassie (FID 1325) |
| Followers | 403,197 |
| Title | BDFL of Quilibrium |
| Bio | "BDFL of Quilibrium, ex-Farcaster, ex-Coinbase, always opinionated, never hydrated" |
| GitHub | CassOnMars |
| Role in farcasterorg | 1 of 13 independent members, Q Inc's representative |
| Verified addresses | 4 Ethereum addresses |

Cassie is one of the most significant independent voices in the Farcaster ecosystem. After the Neynar acquisition, she represents the decentralization faction - running independent protocol infrastructure (Hypersnap), providing free API access, and requiring multi-party review for protocol changes.

## What is Quilibrium?

| Component | Description |
|-----------|-------------|
| **Network type** | Decentralized protocol: compute + storage + networking |
| **Consensus** | Proof of Meaningful Work (PoMW) |
| **Data structure** | Hypergraph (richer than blockchain/DAG) |
| **Privacy** | Oblivious Hypergraph - node operators can't see stored data |
| **Token** | QUIL - fair launch, no pre-mine, no VC |
| **Language** | Go (main client: `ceremonyclient` repo) |
| **Relevance** | Runs Hypersnap node, provides free Farcaster API, future decentralized infrastructure for apps like ZAO OS |

## Farcaster Protocol Governance (Post-Acquisition)

### How Changes Get Made

Farcaster uses "rough consensus and running code." Four groups must agree:

1. **Protocol developers** - merge changes into hubs/contracts
2. **Hub runners** - deploy changes to infrastructure
3. **Application developers** - choose which hubs to read from
4. **Users** - choose which apps to use

### The farcasterorg Safeguard

The independent farcasterorg GitHub org (not controlled by Neynar) requires:
- PRs match to FIPs (Farcaster Improvement Proposals)
- 2 independent reviewers outside the original contributor
- 13 independent members from different organizations
- Cassie is Q Inc's sole representative

This is the primary governance mechanism preventing Neynar from unilateral protocol changes - since Hypersnap nodes can refuse to deploy changes that don't go through the FIP process.

### Snapchain Governance

A group of 15 voters chosen through rough consensus from the Farcaster community governs Snapchain-specific decisions.

## Running Your Own Node: Should ZAO Become a Node Operator?

### Snapchain Node (farcasterxyz/snapchain)

The reference Snapchain node gives you raw protocol access to all Farcaster data.

**Setup:**
```bash
curl -sSL https://raw.githubusercontent.com/farcasterxyz/snapchain/refs/heads/main/scripts/snapchain-bootstrap.sh | bash
```

**Requirements:**

| Resource | Minimum |
|----------|---------|
| RAM | 16 GB |
| CPU | 4 cores/vCPUs |
| Storage | 2 TB (snapshots are ~200 GB, growing) |
| Network | Public IP, ports 3381-3383 (TCP/UDP) |
| Sync time | Up to 2 hours for historical snapshots |
| Runtime | Docker Compose |

**What you get:**
- HTTP API at `localhost:3381` - raw protocol-level endpoints
- gRPC API - for programmatic access
- Direct data queries: `/v1/castsByFid?fid=ID`, `/v1/info`
- All Farcaster messages, reactions, follows, user data

**What you DON'T get:**
- No Neynar v2 API compatibility (different response format)
- No feed generation algorithms
- No user search
- No trending feeds
- No enriched data (follower counts, profile aggregation)
- No signer management

### Hypersnap Node (farcasterorg/hypersnap)

Hypersnap is the independent implementation that Quilibrium runs. Same Snapchain spec, different codebase (Rust vs the reference implementation).

**What makes it different:**
- Built by farcasterorg (independent from Neynar)
- "Hyperdimensional" - incorporates Quilibrium's hypergraph data structures
- Same system requirements as Snapchain
- GPL-3.0 license (viral - modifications must be open-sourced)
- The node that powers haatz.quilibrium.com's free Neynar-compatible API

**Key insight from Cassie's cast:** "Anyone running a hypersnap node can enable theirs." This means the Neynar v2 API compatibility layer is built into Hypersnap, not Snapchain. If you want to self-host a Neynar-compatible API, you need Hypersnap specifically.

### Snapchain vs Hypersnap: Raw API Comparison

| Endpoint Type | Snapchain (raw) | Hypersnap (haatz) | Neynar (paid) |
|---------------|----------------|-------------------|---------------|
| Cast by FID | `/v1/castsByFid?fid=X` | `/v2/farcaster/feed?fid=X` | `/v2/farcaster/feed?fid=X` |
| User lookup | `/v1/userDataByFid?fid=X` | `/v2/farcaster/user/bulk?fids=X` | `/v2/farcaster/user/bulk?fids=X` |
| User search | Not available | `/v2/farcaster/user/search?q=X` | `/v2/farcaster/user/search?q=X` |
| Channel feed | `/v1/castsByParent?url=...` | `/v2/farcaster/feed/channels?channel_ids=X` | `/v2/farcaster/feed/channels?channel_ids=X` |
| Trending feed | Not available | `/v2/farcaster/feed/trending` | `/v2/farcaster/feed/trending` |
| Signer creation | Not available | Unknown | Full support |
| Cast posting | Not available (protocol-level submit) | Unknown | Full support |
| Webhooks | Not available | Not available | Full support |

### Cost Analysis: Run Your Own vs Use haatz

| Option | Monthly Cost | What You Get |
|--------|-------------|--------------|
| **haatz.quilibrium.com (free)** | $0 | Neynar v2-compatible reads, no setup, no maintenance |
| **Hetzner CAX31 (self-hosted)** | ~$18/mo (16GB ARM, 4 vCPU, 160GB + volume) | Raw Snapchain data, full control, need extra storage |
| **Hetzner CPX41 (self-hosted)** | ~$28/mo (16GB AMD, 4 vCPU, 240GB + volume) | Same as above, x86 |
| **DigitalOcean (self-hosted)** | ~$96/mo (16GB, 4 vCPU, 320GB + volume) | Same, more expensive |
| **Neynar Starter** | $99/mo | Full v2 API, webhooks, signer management |
| **Neynar Growth** | $499/mo | Higher rate limits |

**Storage note:** The 2TB requirement is the biggest cost factor. Hetzner Volumes are ~$0.052/GB/mo, so 2TB = ~$104/mo. DigitalOcean Volumes are $0.10/GB, so 2TB = $200/mo. This makes self-hosting more like $120-230/mo total.

### Recommendation for ZAO OS

**SKIP running your own node for now.** Here's why:

1. **haatz.quilibrium.com gives you 90% of the value for $0.** It's Neynar v2-compatible, no setup, community-run by Cassie herself.
2. **Self-hosted Snapchain gives you raw protocol data** but you'd need to build the Neynar v2 translation layer yourself - massive effort.
3. **Self-hosted Hypersnap gives you the Neynar-compatible API** but costs $120-230/mo for infrastructure - more than Neynar Starter.
4. **ZAO has ~188 members.** The traffic doesn't justify dedicated infrastructure yet.

**When to reconsider:**
- If haatz becomes unreliable or goes offline
- If ZAO grows past 1,000+ active users
- If you need guaranteed uptime/SLA for a production launch
- If you want to contribute to the farcasterorg ecosystem (run a node, get governance voice)

**The play:** USE haatz for free reads now (implemented in `src/lib/farcaster/neynar.ts`). KEEP Neynar API key for writes. REVISIT self-hosting when ZAO scales or if the political landscape changes.

## Risks and Considerations

| Risk | Mitigation |
|------|------------|
| haatz goes down | Failover to Neynar (keep API key active) |
| Response format changes | Minimal - already near-identical to Neynar v2 |
| Write endpoints don't work | Keep Neynar for all writes |
| Rate limiting unknown | Start with low traffic, monitor; Cassie says API metrics dashboard exists |
| GPL-3.0 license on Hypersnap | Only applies if we modify/distribute the node code; using the API is fine |
| Neynar changes API breaking compatibility | Hypersnap tracks the spec independently |

## Sources

- [Neynar Acquires Farcaster (January 21, 2026)](https://neynar.com/blog/neynar-is-acquiring-farcaster)
- [Neynar Acquisition Analysis - BlockEden Forum](https://blockeden.xyz/forum/t/neynar-acquired-farcaster-for-free-while-returning-180m-to-investors-dan-romero-is-building-a-wallet-and-the-protocol-has-no-token-is-decentralized-social-media-dead-or-just-getting-started/492)
- [farcasterorg GitHub Organization](https://github.com/farcasterorg)
- [Hypersnap Repository (GPL-3.0)](https://github.com/farcasterorg/hypersnap)
- [Farcaster Governance Docs](https://docs.farcaster.xyz/learn/contributing/governance)
- [Farcaster FIP Process](https://docs.farcaster.xyz/learn/contributing/fips)
- [Cassie Heart on Farcaster (@cassie)](https://farcaster.xyz/cassie)
- [Cassie Heart on GitHub (CassOnMars)](https://github.com/CassOnMars)
- [Quilibrium Network](https://quilibrium.com)
- [Quilibrium GitHub](https://github.com/quilibriumnetwork)
- [Web3 Galaxy Brain - Cassandra Heart Interview](https://web3galaxybrain.com/episode/Cassandra-Heart-Founder-of-Quilibrium)
- [Neynar Pricing](https://dev.neynar.com/pricing)
- [haatz.quilibrium.com API (live, tested)](https://haatz.quilibrium.com/v2/farcaster/feed?fid=1325)
- [Snapchain Docs - Getting Started](https://snapchain.farcaster.xyz/getting-started)
- [Snapchain Docs - What is Snapchain?](https://snapchain.farcaster.xyz)
- [Snapchain Casts API Reference](https://snapchain.farcaster.xyz/reference/grpcapi/casts)
- [Snapchain UserData API Reference](https://snapchain.farcaster.xyz/reference/grpcapi/userdata)
- [Snapchain GitHub (farcasterxyz)](https://github.com/farcasterxyz/snapchain)
