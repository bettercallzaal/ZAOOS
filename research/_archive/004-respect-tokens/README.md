# ZAO Respect Tokens — Social Capital System

> Non-transferable reputation tokens for the ZAO community

## Design Principles

1. **Soulbound (Non-Transferable)** — Cannot be bought or sold. Earned only.
2. **Earned Through Contribution** — Curation, engagement, early discovery, consistency.
3. **Slow Decay** — Use-it-or-lose-it prevents stale reputation from dominating.
4. **Grants Power** — Increased tip allowance, curation weight, governance votes.

---

## Earning Mechanisms

| Action | Respect Earned | Rationale |
|--------|---------------|-----------|
| **Curation Mining** | High | Share a track early → others collect/play → earn Respect |
| **Peer Recognition** | Medium | Other users "respect" your posts (tip-like) |
| **Consistency** | Low-Medium | Regular quality participation earns baseline |
| **Artist Releases** | Medium | Verified artists earn Respect for new music |
| **Community Building** | Medium | Onboarding new members, moderation, events |

### Curation Mining Formula (Draft)
```
respect_earned = (collectors_after_you - collectors_before_you) * time_decay_factor
time_decay_factor = 1 / (1 + hours_since_first_share * 0.1)
```
Early curators earn more. Diminishing returns over time.

---

## Existing Models to Learn From

### DEGEN (Farcaster Tipping Token)
- Daily tip allowances based on holdings/engagement
- Users tip by replying with amounts
- **Lesson:** Simple mechanics drive massive adoption. Keep it easy.

### Moxie (Airstack Fan Tokens)
- Fan tokens per user on Farcaster
- Engagement-based earning
- **Lesson:** Tying tokens to specific users creates social dynamics.

### Optimism Fractal Respect
- Non-transferable tokens earned through peer evaluation
- Groups of ~6 rank each other's contributions
- Fibonacci-weighted distribution (1, 2, 3, 5, 8, 13)
- **Lesson:** Peer evaluation is powerful but needs structured sessions.

### Friend.tech
- Bonding curve social tokens
- **Lesson:** Transferable social tokens create speculation, not community. Avoid this.

---

## Technical Implementation

### Token Standard: ERC-5192 (Minimal Soulbound)
- Non-transferable ERC-721
- `locked()` returns `true` always
- Deploy on **Base** (low gas, Farcaster-aligned)

### Architecture
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  ZAO OS Client  │────▶│  Backend API │────▶│  PostgreSQL  │
│  (Next.js)      │     │  (Next.js)   │     │  (Respect    │
│                 │     │              │     │   Ledger)    │
└─────────────────┘     └──────┬───────┘     └─────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  On-Chain (periodic) │
                    │  - EAS Attestations  │
                    │  - ERC-5192 Mint     │
                    │  - Merkle Root       │
                    └─────────────────────┘
```

### Off-Chain Tracking (Primary)
```sql
CREATE TABLE respect_ledger (
  id SERIAL PRIMARY KEY,
  zid TEXT NOT NULL,               -- ZAO ID
  fid BIGINT NOT NULL,             -- Farcaster FID
  action TEXT NOT NULL,            -- 'curation', 'peer_recognition', 'consistency', etc.
  amount DECIMAL NOT NULL,
  source_hash TEXT,                -- cast hash that triggered it
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE respect_balances (
  zid TEXT PRIMARY KEY,
  fid BIGINT NOT NULL,
  total_earned DECIMAL DEFAULT 0,
  current_balance DECIMAL DEFAULT 0,  -- after decay
  tier TEXT DEFAULT 'newcomer',       -- newcomer, member, curator, elder
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### On-Chain Attestation (Periodic)
- Use **EAS (Ethereum Attestation Service)** on Base
- Attest Respect score snapshots weekly/monthly
- Schema: `{ zid, fid, respectBalance, tier, timestamp }`
- Merkle root of all balances stored on-chain for verifiability

### Tiers
| Tier | Respect Required | Perks |
|------|-----------------|-------|
| Newcomer | 0 | Basic access |
| Member | 100 | Can tip Respect to others |
| Curator | 500 | 2x curation weight in feed ranking |
| Elder | 2000 | Governance votes, moderation powers |
| Legend | 10000 | Max tip allowance, special badge |

---

## Decay Mechanism

```typescript
// Weekly decay: 2% of current balance
const DECAY_RATE = 0.02;
const DECAY_INTERVAL = 7 * 24 * 60 * 60; // 1 week in seconds

function applyDecay(balance: number, lastUpdate: Date): number {
  const weeksSince = (Date.now() - lastUpdate.getTime()) / (DECAY_INTERVAL * 1000);
  return balance * Math.pow(1 - DECAY_RATE, weeksSince);
}
```

---

## Key Takeaways for ZAO OS

- Start with off-chain tracking (PostgreSQL) — fast iteration, no gas costs
- Periodically attest on-chain via EAS for credibility
- Soulbound = no speculation. Respect must be earned.
- DEGEN-style simplicity: easy to understand, easy to participate
- Curation mining is the killer feature — rewards finding good music early
