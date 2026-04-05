# 133 — Reputation Scoring Systems for ZAO OS

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Design a composite ZAO Score from internal respect + external reputation signals

## Key Decisions / Recommendations

| System | Priority | Cost | Action |
|--------|----------|------|--------|
| **Neynar Score** | HIGH — already done | Free (existing key) | Display score on member profiles |
| **EAS (Attestations)** | HIGH | Free (off-chain) / ~$0.01 (on-chain on Optimism) | Create schemas for fractal sessions, membership |
| **OpenRank** | MEDIUM | Free | Add API call for social reputation graph |
| **Human Passport** | LOW | Free tier | Sybil resistance badge for scaling |
| **World ID** | LOW | Free | "Verified Human" badge (future) |
| **Inflynce** | SKIP | No public API | No developer access |

## Composite ZAO Score Formula

```
ZAO Score (0-1000) =
  Fractal Respect     × 0.30   (core governance)
  + Music Curation    × 0.20   (ZAO's purpose)
  + Session Attendance × 0.15  (showing up)
  + Neynar Score      × 0.10   (external social quality)
  + Tenure            × 0.10   (loyalty)
  + EAS Attestations  × 0.10   (on-chain credentials)
  + OpenRank          × 0.05   (social influence)
```

### Display Tiers
| Score | Tier | Description |
|-------|------|-------------|
| 850+ | Legend | Top ~5%, core contributors |
| 650+ | Veteran | Active long-term members |
| 450+ | Regular | Consistent participants |
| 250+ | Rising | New but engaged |
| 0-249 | Newcomer | Just joined |

## 1. EAS (Ethereum Attestation Service)

### What It Is
Open-source infrastructure for creating attestations — structured, signed claims. Native predeploy on all OP Stack chains.

### Contract Addresses (Optimism)
- **EAS:** `0x4200000000000000000000000000000000000021`
- **SchemaRegistry:** `0x4200000000000000000000000000000000000020`
- **Explorer:** `https://optimism.easscan.org`

### ZAO Attestation Schemas

| Schema | Schema String | When Created |
|--------|---------------|--------------|
| Fractal Session | `uint256 sessionNumber, uint256 respectEarned, address member, uint64 timestamp` | After each Monday fractal |
| Membership | `uint64 memberSince, string displayName, uint256 fid` | On member onboarding |
| Music Curation | `string songTitle, string artist, uint256 votes, uint64 timestamp` | On TOTD or milestone |

### SDK
```
npm install @ethereum-attestation-service/eas-sdk
```

### Cost
- Off-chain attestations: **free** (signed data, queryable via GraphQL)
- On-chain attestations: **~$0.01** on Optimism
- Schema registration: **one-time ~$0.01-0.05**

### Unlock Protocol + EAS
Unlock is integrating EAS for credentialing — proving course completion, event attendance. ZAO as a "certifying edu org" can attest that members completed fractal governance training, earned respect, contributed to music curation.

### Existing Code
`research/12-gating/README.md` line 183 already has a pattern for querying EAS via GraphQL. `research/23-austin-griffith-eth-skills/README.md` mentions EAS at attest.org.

## 2. Neynar Score

### Already Integrated
- `src/components/social/SocialPage.tsx` line 130: filters at 0.55 threshold
- `src/components/social/FollowerCard.tsx`: types `neynar_user_score`
- Available in every Neynar user object at `user.experimental.neynar_user_score`

### Score Details
- Float 0.0 to 1.0
- Updates weekly
- Measures: account quality, engagement patterns, distinguishes AI quality
- Decays with inactivity
- `power_badge` is a separate boolean (also returned)

### Thresholds
- 0.55: recommended starting point (ZAO's current spam filter)
- 0.7+: ~27,500 accounts qualify (high quality)
- 0.9+: ~2,500 accounts qualify (elite)

### Action Needed
Display the score on member profiles. Already available in Neynar responses — no new API call needed.

## 3. OpenRank (replaces Inflynce)

### Why OpenRank Instead of Inflynce
Inflynce has **no public developer API**. OpenRank is a free, open-source reputation protocol with documented APIs for Farcaster.

### API
- **Base URL:** `https://graph.cast.k3l.io`
- **Docs:** `https://graph.cast.k3l.io/docs`
- **Free to use** (public good)

### Key Endpoints
| Endpoint | Description |
|----------|-------------|
| `POST /scores/global/engagement/fids` | Global engagement ranking |
| `POST /scores/global/following/fids` | Following-based ranking |
| `GET /channels/{channel_id}/rankings` | Channel-specific reputation |

### Integration
```typescript
const fids = [19640, ...otherFids];
const res = await fetch('https://graph.cast.k3l.io/scores/global/engagement/fids', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(fids),
});
const scores = await res.json(); // [{ fid, score, rank }]
```

### Updates
- Global ranking updated every 2 hours
- Scores published on-chain on Base weekly
- Uses EigenTrust algorithm on peer-to-peer actions

## 4. Human Passport (formerly Gitcoin Passport)

- **API:** `https://api.passport.xyz`
- **Score:** Unique Humanity Score (threshold: 20 for passing)
- **Free tier** available
- **Stamps:** Verified credentials from GitHub, Google, ENS, etc.
- **Best for:** Sybil resistance as ZAO scales beyond 100 members

## 5. World ID

- **Contract (Optimism):** `0x42ff98c4e85212a5d31358acbfe76a621b50fc02`
- **SDK:** `@worldcoin/idkit`
- **Best for:** "Verified Human" badge on profiles
- **Limitation:** Requires user to have World ID (low adoption currently)

## Implementation Phases

| Phase | What | Effort | Cost |
|-------|------|--------|------|
| **1 (Now)** | Display Neynar score on profiles + ZAO Score from existing data | 2 hrs | Free |
| **2** | OpenRank integration | 2 hrs | Free |
| **3** | EAS off-chain attestations for fractal sessions | 1 day | Free |
| **4** | Human Passport sybil check | 2 hrs | Free |
| **5** | EAS on-chain attestations for milestones | 1 day | ~$0.01/attestation |

## Data Sources Already Available in ZAO OS

| Signal | Source | Already Built? |
|--------|--------|---------------|
| Fractal Respect | `respect_members` table | Yes |
| Session Count | `fractal_sessions` + `fractal_scores` | Yes |
| Neynar Score | Neynar API (existing key) | Yes (used for spam filter) |
| Power Badge | Neynar API | Yes (displayed on profiles) |
| Music Curation | `songs` + `song_submissions` tables | Yes |
| Member Tenure | `users.created_at` | Yes |
| Community Engagement | proposals, votes, comments | Yes |

**Phase 1 requires NO new APIs or services** — everything needed for the initial ZAO Score is already in the database.

## Sources

- [EAS Docs](https://docs.attest.org/)
- [EAS on Optimism](https://docs.optimism.io/chain/identity/contracts-eas)
- [EAS SDK (npm)](https://www.npmjs.com/package/@ethereum-attestation-service/eas-sdk)
- [Optimism EAS Explorer](https://optimism.easscan.org)
- [Neynar Score Docs](https://docs.neynar.com/docs/neynar-user-quality-score)
- [Neynar Score Algorithm](https://neynar.com/blog/neynar-scores-under-the-hood)
- [OpenRank Farcaster](https://docs.openrank.com/integrations/farcaster)
- [OpenRank API Docs](https://graph.cast.k3l.io/docs)
- [Human Passport](https://passport.human.tech/)
- [Human Passport API Docs](https://docs.passport.xyz/)
- [World ID Docs](https://docs.world.org/world-id)
- [Unlock Protocol EAS](https://docs.unlock-protocol.com/)
