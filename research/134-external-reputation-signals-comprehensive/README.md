# 134 — External Reputation Signals — Comprehensive Inventory

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Catalog every external reputation signal readable from wallet, Farcaster FID, or X handle

## Priority Matrix

### Batch 1: Free, No New API Keys (build now)

| Signal | Lookup By | API | Returns | Cost |
|--------|-----------|-----|---------|------|
| **Neynar Score** | FID | Already fetched | 0-1 float | Free (existing key) |
| **Power Badge** | FID | Already fetched | boolean | Free (existing key) |
| **OpenRank** | FID | `POST graph.cast.k3l.io/scores/global/engagement/fids` | score + rank | Free, no key |
| **Coinbase Verified ID** | Wallet (Base) | GraphQL `base.easscan.org/graphql` | verified boolean | Free, no key |
| **EAS Attestation Count** | Wallet (Optimism) | GraphQL `optimism.easscan.org/graphql` | attestation count + list | Free, no key |
| **GitHub Activity** | Username | `GET api.github.com/users/{username}` | repos, followers, created_at | Free, no key |

### Batch 2: Free, Need to Apply for API Key

| Signal | Lookup By | API | Returns | Cost |
|--------|-----------|-----|---------|------|
| **Talent Builder Score** | Wallet | `GET api.talentprotocol.com/api/v2/passports/{wallet}` | 0-100 score + breakdown | Free (apply) |
| **Human Passport** | Wallet | `GET api.passport.xyz/v2/stamps/{scorer}/score/{addr}` | humanity score + stamps | Free (apply) |
| **POAPs** | Wallet | `GET api.poap.tech/actions/scan/{address}` | POAP list + count | Free (apply) |
| **DegenScore** | Wallet | `GET docs.degenscore.com/api` (permissionless) | DeFi reputation 0-1000+ | Free |

### Skip / Defer

| Signal | Why Skip |
|--------|----------|
| **X/Twitter Metrics** | $200/month minimum for read API |
| **Etherscan Labels** | Pro Plus paid plan only |
| **Inflynce Mindshare** | No public API exists |
| **Lens Reputation** | Low relevance (most ZAO members not on Lens) |
| **Extra Warpcast Badges** | Only Power Badge exists |

## Detailed API Specs

### OpenRank
```typescript
const res = await fetch('https://graph.cast.k3l.io/scores/global/engagement/fids', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([19640, 3, 2]),
});
const scores = await res.json(); // [{ fid, score, rank }]
```

### Coinbase Verified ID (Base EAS)
```graphql
# POST https://base.easscan.org/graphql
query {
  attestations(where: {
    recipient: { equals: "0xWALLET" }
    schemaId: { equals: "0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9" }
    revoked: { equals: false }
  }) { id, time }
}
```
680,232 attestations on Base. Schema: `0xf8b05c...70f0de9`

### EAS Attestation Count (Optimism)
```graphql
# POST https://optimism.easscan.org/graphql
query {
  attestations(where: {
    recipient: { equals: "0xWALLET" }
    revoked: { equals: false }
  }) { id, schemaId, time, attester }
}
```

### GitHub Activity
```typescript
// No auth needed for public data (60 req/hr unauthenticated)
const res = await fetch('https://api.github.com/users/bettercallzaal');
const { public_repos, followers, following, created_at, bio } = await res.json();
```

### Talent Builder Score
```typescript
// Need API key (free, apply at talentprotocol.com)
const res = await fetch('https://api.talentprotocol.com/api/v2/passports/0xWALLET', {
  headers: { 'X-API-KEY': process.env.TALENT_API_KEY },
});
const { score, activity_score, identity_score, skills_score, human_checkmark } = await res.json();
```

### Human Passport
```typescript
// Need API key + Scorer ID (free, apply at passport.gitcoin.co)
const res = await fetch(`https://api.passport.xyz/v2/stamps/${SCORER_ID}/score/${address}`, {
  headers: { Authorization: `Bearer ${PASSPORT_API_KEY}` },
});
const { score, passing_score, stamp_scores } = await res.json();
```

### POAPs
```typescript
// Need API key (free, apply at documentation.poap.tech)
const res = await fetch(`https://api.poap.tech/actions/scan/${address}`, {
  headers: { 'X-API-Key': process.env.POAP_API_KEY },
});
const poaps = await res.json(); // Array of { event, tokenId, chain }
```

### DegenScore
```typescript
// Permissionless, no auth
const res = await fetch(`https://beacon.degenscore.com/v1/beacon/${address}`);
const { traits, score } = await res.json();
```

## How to Display on Member Profiles

```
┌─────────────────────────────────────────┐
│ REPUTATION SIGNALS                       │
├─────────────────────────────────────────┤
│ Farcaster  Score: 0.82  ⚡ Power Badge  │
│ OpenRank   #1,234 engagement             │
│ Coinbase   ✓ Verified ID                 │
│ EAS        12 attestations (Optimism)    │
│ Talent     Builder Score: 72/100         │
│ GitHub     14 repos · 89 followers       │
│ POAPs      23 events attended            │
│ DegenScore 645                           │
│ Passport   Humanity: 34/100 ✓ Passing    │
└─────────────────────────────────────────┘
```

## ENV Variables Needed

| Variable | Service | Required? |
|----------|---------|-----------|
| `NEYNAR_API_KEY` | Neynar | Already set |
| `ALCHEMY_API_KEY` | Alchemy | Already set |
| Future: `TALENT_API_KEY` | Talent Protocol | Apply free |
| Future: `PASSPORT_API_KEY` | Human Passport | Apply free |
| Future: `PASSPORT_SCORER_ID` | Human Passport | Apply free |
| Future: `POAP_API_KEY` | POAP | Apply free |

## Sources

- [Neynar Score](https://docs.neynar.com/docs/neynar-user-quality-score)
- [OpenRank Farcaster](https://docs.openrank.com/integrations/farcaster)
- [OpenRank API](https://graph.cast.k3l.io/docs)
- [EAS Docs](https://docs.attest.org/)
- [EAS GraphQL API](https://docs.attest.org/docs/developer-tools/api)
- [Coinbase Verifications](https://github.com/coinbase/verifications)
- [Coinbase Onchain Verify](https://www.coinbase.com/onchain-verify)
- [Talent Protocol API](https://docs.talentprotocol.com/docs/developers/talent-api/api-reference/talent-passports)
- [Human Passport](https://docs.passport.xyz/)
- [DegenScore API](https://docs.degenscore.com/api)
- [POAP API](https://documentation.poap.tech/)
- [GitHub API](https://docs.github.com/en/rest)
- [Lens Reputation](https://docs.lensreputation.xyz/)
- [X API Pricing](https://www.xpoz.ai/blog/guides/understanding-twitter-api-pricing-tiers-and-alternatives/)
