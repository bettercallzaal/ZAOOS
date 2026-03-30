# 214 — ZAO Knowledge Graph: Member Identity & Relationship Mapping

> **Status:** Research + Planning
> **Date:** March 29, 2026
> **Tags:** `#knowledge-graph` `#identity` `#social-graph` `#zid` `#magnetiq` `#farcaster`
> **Supersedes:** Partial — Doc 198 (social graph analytics), Doc 158 (member naming/ENS)

---

## tl;dr

The ZAO needs to know **who members are**, **what they've done**, and **who they know** — across on-chain activity, chat behavior, fractal meetings, and IRL events. Right now this data is fragmented across Neynar, Supabase, the Respect contract, Magnetiq, and Fractal Bot. This doc maps what's in the graph, what's missing, and what ZAO OS needs to become the single source of truth.

---

## What Is the ZAO Knowledge Graph

A **member identity and relationship graph** connecting:

```
Member A
├── ZID #47
├── Base wallet (0x...)
├── Solana wallet (...)
├── Farcaster FID 12345
├── ENS name (alice.eth)
├── Respect score (847 ZAO)
├── Fractal meetings attended (23)
├── Connection to Member B (IRL: Magnetiq Proof of Meet)
├── Connection to Member C (online: replied to 12 casts)
├── Connection to Project: WaveWarZ (artist)
└── Connection to Event: ZAO-CHELLA (POAP holder)
```

This graph powers:
- **Reputation systems** — Respect is the native token; graph context amplifies it
- **Discovery** — "Artists who collaborated with Clejan" / "Members who attended ZAO Stock"
- **Governance** — Fractal meeting attendance + Respect = governance weight
- **Onboarding** — AI agent uses graph to connect new members to relevant people

---

## What's Currently in the Graph

### Data Sources

| Source | What it has | Access |
|--------|-------------|--------|
| **Supabase `users`** | FID, username, display name, ZID, wallet addresses, bio, social links, member tier | Direct via supabaseAdmin |
| **Supabase `respect_members`** | Total Respect, fractal Respect, on-chain OG, ZOR, fractal count | Direct |
| **Supabase `community_profiles`** | Artist category, biography, thumbnail, featured flag, slug | Direct |
| **Supabase `hidden_messages`** | Hidden cast hashes per user | Direct |
| **Neynar** | Follows/following, cast history, reactions, channel activity | API key |
| **Fractal Bot** | Meeting history, rankings per session, facilitator data | `data/history.json` on VPS |
| **Magnetiq** | IRL meet tokens, connection strength between wallets | Wallet addresses |
| **OREC contract (Base)** | On-chain fractal vote/respect records | `ornode` currently DOWN |
| **ZOR Respect1155** | On-chain ZOR holders (4 holders — early) | Direct |
| **OG Respect ERC-20** | On-chain ZAO Respect holders (122 holders) | Direct |
| **POAP / Attendance NFTs** | ZAO Stock (future), ZAO-CHELLA, PALOOZA | TBD |

### What's Connected in ZAO OS Today

**Members page** (`/members`):
- ZID, username, display name, ENS, bio
- Respect total + fractal count
- Artist category + thumbnail
- Social platform links
- Activity (last active)

**Chat / Casts:**
- Cast history from channel feed (Neynar, cached in Supabase `channel_casts`)
- Reaction counts (likes, recasts)
- Reply counts per cast

**Fractal meetings:**
- Meeting attendance tracked by Fractal Bot (`data/history.json`)
- Per-session rankings per member
- Facilitator history

---

## What's Missing

### Identity Gaps

| Gap | What it is | Why it matters |
|-----|-----------|---------------|
| **Cross-chain identity resolution** | Linking Base wallet ↔ Solana wallet ↔ FID to one ZID | Can't build unified Respect, social graph, or governance |
| **Social graph depth** | Follower/following is surface; need "meaningful connections" (replied, collaborated, met IRL) | Discovery and trust signals |
| **Project membership** | Who's officially on the WaveWarZ team vs just participated once? | Governance, credit, incubator eligibility |
| **Respect attribution** | Where did someone's Respect come from? Which fractal meeting, which contribution? | Accountability, growth tracking |
| **ENS / Basename resolution** | Many members have ENS but it's not displayed or used for routing | Identity on-chain |

### Relationship Gaps

| Gap | What it is | Why it matters |
|-----|-----------|---------------|
| **Magnetiq integration** | IRL meet tokens not imported into ZAO OS | Can't show "you met this person at ZAO Stock" |
| **Fractal meeting graph** | Members who attended the same fractal meeting = edge in graph | Discovery, trust, governance sub-networks |
| **Cast interaction graph** | "Member A replied to Member B 40 times" = meaningful relationship | Discovery, engagement health |
| **Project collaboration graph** | Co-produced a track, co-authored a proposal, co-organized an event | Cross-pollination, team formation |
| **Event attendance** | POAP / attendance NFT holders as a graph edge | IRL community bonding |
| **Cross-platform identity** | Member has Lens, Nostr, Bluesky but ZAO OS doesn't know | Discovery outside of FC |

### Infra Gaps

| Gap | What it is | Why it matters |
|-----|-----------|---------------|
| **OREC node is DOWN** | `ornode` endpoints unreachable; on-chain fractal votes not flowing | Can't verify Respect on-chain |
| **No unified member profile** | ZAO OS profile ≠ Fractal Bot history ≠ Neynar profile | Fragmented identity |
| **Respect attribution** | Don't know which fractal meeting earned which Respect points | Hard to track growth |
| **Knowledge graph DB** | Not using graph DB (could use Supabase + pgvector for similarity) | Scale limitation |

---

## How to Build It: The ZID-First Approach

The fix starts with **ZID as the canonical identity anchor**:

```
ZID #47 (canonical identifier)
    ├── Base wallet (verified via signature)
    ├── Solana wallet (manual or via cross-chain attestation)
    ├── Farcaster FID (linked via signer)
    ├── ENS (resolved from wallet)
    └── ZAO OS profile (display name, bio, avatar)
```

Every other graph relationship anchors to ZID.

### Phase 1: ZID Resolution (Q2 2026 — from whitepaper)

1. Sequential ZIDs — ZID 1 = Zaal, ZID 2 = Candy, etc.
2. ZID minted as on-chain identifier on Base
3. Cross-chain wallet linking via signed attestation messages
4. Display ZID on ZAO OS profile + on-chain

### Phase 2: Relationship Edges (Q3 2026)

| Edge type | Source | How to capture |
|-----------|--------|----------------|
| IRL meet (Magnetiq) | Wallet address shared at event | Import Mintiq meet events |
| Fractal meeting co-attendance | Fractal Bot history | Import from `data/history.json` |
| Cast reply chain | Neynar / Supabase | Count replies between FIDs in `channel_casts` |
| Co-attendance at event | POAP / attendance NFT | On-chain token holder list |
| Project collaboration | Manual project membership + on-chain tx | ZAO OS project pages |
| Follow relationship | Neynar | Follower graph for trust signals |

### Phase 3: Graph Query & Display (Q3–Q4 2026)

- **"Members you might know"** — based on fractal co-attendance + Magnetiq meets
- **"Active collaborators on this project"** — based on co-authorship of casts about the project
- **"Trust path to Member X"** — shortest path through ZAO relationships
- **Respect attribution** — breakdown of where Respect came from (fractal sessions, event attendance, project leadership)

---

## The Multi-Chain Identity Problem

The ZAO spans 4 chains. Each member might have identities on all of them:

| Chain | Identity type | Tool |
|-------|--------------|------|
| **Base** | $ZAO Respect, Hats roles, ZID | Etherscan, ZOA OS profile |
| **Solana** | WaveWarZ participation | Solana explorer |
| **Flow** | Magnetiq meet tokens | Magnetiq.xyz |
| **Optimism** | ORDAO fractal votes (if OREC recovers) | Optimism explorer |

**Current state:** These are siloed. ZAO OS bridges them via ZID, but only as much as users have connected.

**Goal:** One ZAO identity that resolves your Base wallet, Solana wallet, and FID — visible to other members as a unified profile.

---

## Knowledge Graph for AI Agents

The ZAO OS research library (213+ docs) is itself a knowledge graph — but it's primarily for **human** navigation and **AI agent** context. For AI agents to use it well:

1. **Doc 197** (OpenClaw agent memory/knowledge system) — already covers how agents use the research
2. **`_graph/KNOWLEDGE.json`** — machine-readable index, 191 docs
3. **AI onboarding agent** (planned for Q4 2026) — would use ZAO knowledge graph to greet new members with context: "You're ZID #X, you've attended 3 fractal meetings, you're connected to Member Y who shares your interest in hip-hop"

---

## Key Files

| File | What it tracks |
|------|---------------|
| `src/lib/db/supabase/schema.sql` | User profiles, Respect, community_profiles |
| `src/lib/farcaster/neynar.ts` | Neynar API integration |
| `src/hooks/useChat.ts` | Cast history + channel activity |
| `research/_graph/KNOWLEDGE.json` | Research library machine-readable index |
| `research/207-zao-vps-agent-stack/` | Fractal bot history (`data/history.json`) |
| `community.config.ts` | Channels, branding, admin FIDs, contract addresses |

---

## References

- [Doc 050 — Complete Guide](./050-the-zao-complete-guide/) — ZAO overview
- [Doc 051 — Whitepaper 2026](./051-zao-whitepaper-2026/) — ZID + multi-chain identity
- [Doc 158 — Member Naming / ENS / Basenames](./158-zao-member-naming-ens-basenames/) — ENS resolution
- [Doc 198 — Social Graph Analytics](./198-social-graph-analytics-discovery/) — technical graph analysis
- [Doc 199 — Advanced Social Graph](./199-advanced-social-graph-features/) — graph features
- [Doc 207 — VPS Agent Stack](./207-zao-vps-agent-stack-session-log/) — fractal bot data

---

## Next Steps

1. **Build ZAO Stock page in ZAO OS** — event info, ticket signup, NFT attendance tokens
2. **Import Magnetiq meet events** — connect meet tokens to ZAO OS profiles
3. **Restore OREC node** or find alternative — on-chain fractal vote verification
4. **Fractal co-attendance graph** — import `data/history.json` into Supabase as graph edges
5. **Cross-chain wallet linking** — signed attestation flow for Base + Solana

---

*Living document. ZOE ⚡ — ZAO OS orchestration layer.*
