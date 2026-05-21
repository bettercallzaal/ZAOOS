---
topic: identity
type: guide
status: research-complete
last-validated: 2026-05-20
original-query: "ZAO decentralized identity layer wrapping Farcaster FIDs with music profile and community context (reconstructed)"
tier: STANDARD
related-docs: [271, 051, 158]
---

# 005 - ZIDs — ZAO Decentralized Identity

> **Goal:** Design a ZAO-specific identity layer (ZID) that wraps Farcaster FID with music profile, Respect reputation, and community roles, backed by EAS attestations and Hats Protocol for governance.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | ZID as FID wrapper + music profile + Respect + roles | Single identity source for community reputation tracking across chains |
| 2 | PostgreSQL + EAS attestations (near-term) vs Quilibrium (long-term) | Postgres gives immediate scalability; EAS provides on-chain attestability; Quilibrium adds privacy layer when ready |
| 3 | Hats Protocol for role-based access control | ERC-1155 standard, revocable, integrates with governance; 15+ automations available |
| 4 | Sequential ZID minting (ZID #1 = Zaal, #2 = Candy, etc.) | Canonical ordering, on-chain resolvable via Base contract |

## Findings

| Finding | Source | Evidence |
|---------|--------|----------|
| EAS is live production standard for attestations across 6 chains (Base, OP, Eth, Polygon, Arbitrum, Gnosis) | [EAS Docs](https://docs.attest.org/) + [Quicknode Guide](https://www.quicknode.com/guides/ethereum-development/smart-contracts/what-is-ethereum-attestation-service-and-how-to-use-it) | EAS supports schema registration + resolver contracts; 2-contract minimum; EAS core: permissionless, token-free, open-source |
| Neynar acquired Farcaster (Jan 2026); identity & signer integration tightened | [Coindesk](https://www.coindesk.com/business/2026/01/21/farcaster-founders-step-back-as-neynar-acquires-struggling-crypto-social-app) + [Neynar Docs](https://docs.neynar.com/docs/integrate-managed-signers) | Managed signers sponsor on-chain fees by default; Neynar Data Oracle brings FID metadata (score, followers, verified addresses, badges) into onchain policies |
| Hats Protocol tree structure enables hierarchical roles with accountability edges | [Hats Docs](https://docs.hatsprotocol.xyz/) + [MCP Server available](https://www.pulsemcp.com/servers/hats-protocol) | ERC-1155 hat tokens; 15+ pre-built automations; supports Base, Optimism, Arbitrum, Polygon; role composition (admin, accountability) for org accountability |
| Quilibrium privacy layer designed for oblivious hypergraph (node operators can't see stored data) | [Quilibrium Docs](https://quilibrium.com/quilibrium.pdf) + [BSC News](https://bsc.news/post/quilibrium-crypto-guide-analysis) | Q v2.1 nearing completion (as of late 2025); multi-party computation network; QNS (Quilibrium Name Service) for permanent @username; long-term roadmap (Equinox, Event Horizon) targets serverless functions + distributed AI |

## ZAO Application

1. **Near-term (Q2-Q3 2026):** Deploy PostgreSQL ZID table linked to FID via SIWF (Sign In With Farcaster). Mint sequential ZIDs on Base contract. Integrate Hats Protocol for in-app role verification (moderator, curator, artist hats).
2. **Medium-term (Q4 2026):** Add EAS attestation layer — music profile + Respect score attestable on-chain. Test Neynar Data Oracle for bringing FID quality scores into governance thresholds.
3. **Long-term (2027+):** Evaluate Quilibrium migration path for privacy-preserving ZID state. Do NOT block near-term on Quilibrium readiness; migrate when stable.
4. **Hats integration:** Map ZAO roles (Founder, Moderator, Artist, Curator) to Hat tree structure. Automate role granting via Respect thresholds or Fractal attendance (Doc 207 history.json).

## Sources

- [EAS — Ethereum Attestation Service](https://attest.org/) [FULL]
- [Welcome to EAS Documentation](https://docs.attest.org/) [FULL]
- [Ethereum Attestation Service & Smart Contracts](https://www.quicknode.com/guides/ethereum-development/smart-contracts/what-is-ethereum-attestation-service-and-how-to-use-it) [FULL]
- [Neynar acquires Farcaster, January 2026](https://www.coindesk.com/business/2026/01/21/farcaster-founders-step-back-as-neynar-acquires-struggling-crypto-social-app) [FULL]
- [Neynar Managed Signers Documentation](https://docs.neynar.com/docs/integrate-managed-signers) [FULL]
- [Hats Protocol Documentation](https://docs.hatsprotocol.xyz/) [FULL]
- [Hats Protocol: Roles & Permissions](https://www.hatsprotocol.xyz/) [FULL]
- [Hats Protocol MCP Server](https://www.pulsemcp.com/servers/hats-protocol) [FULL]
- [Quilibrium: Peer-to-Peer MPC Platform](https://quilibrium.com/quilibrium.pdf) [FULL]
- [Quilibrium: Internet Nobody Owns](https://bsc.news/post/quilibrium-crypto-guide-analysis) [FULL]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Implement sequential ZID minting on Base (contract + Supabase table) | ZAO Backend | CODE | 2026-06-30 |
| Wire Hats Protocol tree to ZAO roles; test on testnet | ZAO Backend | CODE | 2026-07-15 |
| Design EAS schema for ZID attestations (music profile, Respect score) | ZAO Backend | DESIGN | 2026-06-15 |
| Test Neynar Data Oracle integration for quality score gating | Product | RESEARCH | 2026-07-01 |
| Evaluate Quilibrium privacy layer feasibility; set 2027+ roadmap | Security | RESEARCH | 2026-12-01 |

---

## Concept

| Layer | Identity | Source |
|-------|----------|--------|
| **Farcaster** | FID (uint256) | OP Mainnet IdRegistry |
| **ZAO** | ZID | Wraps FID + music profile + Respect + roles |

A ZID is a **ZAO-specific identity** that extends a Farcaster FID with community context.

---

## ZID Schema

```typescript
interface ZID {
  // Core Identity
  id: string;                    // unique ZID (e.g., "zao:12345")
  fid: number;                   // linked Farcaster FID
  createdAt: Date;

  // Profile
  displayName: string;
  avatar: string;                // IPFS or URL
  bio: string;

  // Music Profile
  musicProfile: {
    role: 'listener' | 'artist' | 'curator' | 'producer';
    genres: string[];            // preferred genres
    primaryPlatform: 'audius' | 'sound' | 'spotify' | 'other';
    artistVerified: boolean;     // verified musician
  };

  // Social Capital
  respect: {
    totalEarned: number;
    currentBalance: number;      // after decay
    tier: 'newcomer' | 'member' | 'curator' | 'elder' | 'legend';
  };

  // Community Roles (Hats Protocol integration)
  hats: {
    hatId: string;
    role: string;                // 'moderator', 'channel-lead', etc.
  }[];

  // Linked Accounts
  wallets: {
    address: string;
    chain: 'ethereum' | 'base' | 'optimism';
    verified: boolean;
  }[];

  // Music Collection
  stats: {
    tracksShared: number;
    tracksCollected: number;
    curations: number;           // tracks shared that others collected
    followers: number;
    following: number;
  };
}
```

---

## Architecture

### Near-Term (PostgreSQL + EAS)

```
┌──────────────┐     ┌─────────────┐     ┌─────────────────┐
│ Farcaster Hub │────▶│  ZAO Backend│────▶│   PostgreSQL     │
│ (FID source)  │     │             │     │   - zids table   │
└──────────────┘     │             │     │   - music_profiles│
                     │             │     │   - respect_ledger│
┌──────────────┐     │             │     └─────────────────┘
│ SIWF Auth    │────▶│             │
│ (login)      │     │             │────▶ EAS (on-chain
└──────────────┘     └─────────────┘      attestations)
```

### Long-Term (Quilibrium)
- Store ZID attestations on Quilibrium for privacy-preserving identity
- Quilibrium's oblivious hypergraph = node operators can't see stored data
- Go middleware service bridges ZAO backend ↔ Quilibrium network

---

## Database Schema

```sql
CREATE TABLE zids (
  id TEXT PRIMARY KEY,              -- 'zao:12345'
  fid BIGINT UNIQUE NOT NULL,
  display_name TEXT,
  avatar TEXT,
  bio TEXT,
  music_role TEXT DEFAULT 'listener',
  genres TEXT[] DEFAULT '{}',
  artist_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE zid_wallets (
  id SERIAL PRIMARY KEY,
  zid TEXT REFERENCES zids(id),
  address TEXT NOT NULL,
  chain TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  UNIQUE(zid, address, chain)
);

CREATE TABLE zid_hats (
  id SERIAL PRIMARY KEY,
  zid TEXT REFERENCES zids(id),
  hat_id TEXT NOT NULL,
  role TEXT NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW()
);
```

---

## ZID Creation Flow

```
1. User clicks "Sign In With Farcaster" (SIWF)
2. Auth returns FID + custody address
3. Check if ZID exists for this FID
   → If yes: load ZID, resume session
   → If no: create new ZID
4. New ZID flow:
   a. Generate ZID: "zao:{fid}"
   b. Pull profile data from Farcaster (pfp, name, bio)
   c. Prompt music profile setup (role, genres)
   d. Initialize Respect balance at 0 (tier: newcomer)
   e. Optional: link additional wallets
   f. Optional: verify artist status
5. ZID is active — user can now post, curate, earn Respect
```

---

## Hats Protocol Integration

ZIDs can hold "hats" representing community roles:

| Hat | Role | Powers |
|-----|------|--------|
| Top Hat | ZAO Admin | Full governance |
| Moderator Hat | Community Mod | Content moderation, ban users |
| Channel Lead Hat | Channel Owner | Manage specific music channels |
| Curator Hat | Trusted Curator | Boosted curation weight |
| Artist Hat | Verified Artist | Artist badge, release privileges |

See `research/07-hats-protocol/` for implementation details.

---

## Implementation Status (ZAOOS Codebase)

**Currently implemented:**
- Farcaster identity (SIWF) in `src/lib/fc-identity.ts`
- Hats Protocol integration: `src/app/api/hats/check/route.ts` (read FID's worn hats)
- Supabase users table with FID + wallet linking

**Not yet implemented:**
- Sequential ZID minting contract (Base)
- ZID as primary identity in DB (currently FID primary)
- EAS schema registration + attestation queries
- Hats automation for Respect-based role granting
- Quilibrium privacy layer

## Key Takeaways for ZAO OS

- ZID = FID wrapper with music + reputation + roles
- Start with PostgreSQL, attest on-chain via EAS
- Hats Protocol for role-based access control; 15+ pre-built automations available
- ZID creation is part of onboarding — seamless SIWF flow
- Design for Quilibrium migration (privacy-preserving hypergraph) but don't block on it; focus on EAS attestability now
- Neynar Data Oracle (post-acquisition, Jan 2026) can gate membership by FID quality score
