# ZIDs — ZAO Decentralized Identity

> A new identity layer wrapping Farcaster FIDs for the ZAO community

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

## Key Takeaways for ZAO OS

- ZID = FID wrapper with music + reputation + roles
- Start with PostgreSQL, attest on-chain via EAS
- Hats Protocol for role-based access control
- ZID creation is part of onboarding — seamless SIWF flow
- Design for Quilibrium migration but don't block on it
