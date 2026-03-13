# Hive Blockchain Research — Cross-Post Integration for ZAO OS

## Overview

Hive is a DPoS blockchain forked from Steem in March 2020, focused on decentralized social content. All posts/comments are stored on-chain with 3-second block times and zero transaction fees (rate-limited by Resource Credits instead). Two main frontends are relevant: **InLeo** (microblogging/threads) and **PeakD** (full-featured blogging).

## Hive Basics

### Tokens
- **HIVE**: Governance + utility token, stakeable as Hive Power (HP)
- **HBD**: Algorithmic stablecoin pegged to USD, ~20% APR savings rate
- **Hive Power (HP)**: Staked HIVE granting voting influence + Resource Credits; 13-week power-down

### Resource Credits (Free Transactions)
- Every account gets RCs proportional to staked HP
- RCs consumed per post/comment/vote/transfer
- Regenerate at 20% per day (full in 5 days)
- No tokens burned — truly free transactions
- Prevents spam via stake-based rate limiting

### Key Hierarchy
| Key | Purpose | Risk |
|-----|---------|------|
| **Posting Key** | Post, comment, vote, follow | Low — cannot move funds |
| **Active Key** | Transfers, staking, witness votes | Medium |
| **Owner Key** | Account recovery, change keys | High |
| **Memo Key** | Encrypt/decrypt messages | Low |

For ZAO OS integration, only the **posting key** is needed. Analogous to Farcaster signers.

### Content Model
- All content = `comment` operations on-chain
- Posts (no parent) vs comments (with parent_author)
- **Communities**: On-chain groups with mods, rules, curated feeds
- **Upvotes/Downvotes**: Stake-weighted, distribute daily reward pool
- 7-day payout window for earning rewards
- Markdown + JSON metadata for tags/app info

### Account Creation
- **Paid**: 3 HIVE (~$1-1.50) per account
- **Free**: Via Account Creation Tokens (RC-based) or services like hiveonboard.com
- Apps can create accounts programmatically

### Ecosystem Health (2025-2026)
- ~20,000 daily active users, ~50,000 monthly
- ~680,000 daily transactions
- Smaller but dedicated community
- 5+ years of uptime, battle-tested infrastructure

---

## InLeo (inleo.io)

### What It Is
- Formerly LeoFinance, rebranded to InLeo
- Hive-based frontend aiming to be "The Everything App" for Web3
- 10-year development runway, founded by @khaleelkazi

### Threads (Microblogging)
- Short-form content similar to tweets / Farcaster casts
- Stored on-chain as Hive `comment` operations
- Twitter-like feed on InLeo frontend
- Images, links, and mentions supported

### Threads vs Farcaster Casts
| Feature | InLeo Threads | Farcaster Casts |
|---------|--------------|-----------------|
| Storage | Hive blockchain (on-chain, permanent) | Farcaster Hubs (decentralized, prunable) |
| Cost | Free (uses RC) | Free (after account setup) |
| Identity | Hive username | FID + Ethereum address |
| Monetization | Earns HIVE/HBD/LEO rewards | No native rewards |
| Ecosystem | ~5,000 active users | ~500,000+ active users |

### LEO Token
- Hive Engine second-layer token
- ~6,000 LEO/day emission, 50M max supply
- ~20% staking APR (curation + ads revenue)
- LeoPremium: $10/month for enhanced features

### API
- No dedicated public API, but Threads are standard Hive `comment` operations
- Can post threads programmatically using `@hiveio/dhive` with correct parent structure + metadata tags

---

## PeakD (peakd.com)

### What It Is
- Most popular and polished Hive frontend (like Medium but decentralized)
- Built by @jarvie and team

### Features
- **Communities**: Full moderation, curation accounts, rules, themed feeds
- **Proposals**: Interface for Hive DAO fund
- **Wallet**: Full HIVE/HBD/Hive Engine token management
- **BeeChat**: Integrated decentralized messaging
- **Scheduling**: Schedule posts for future publication
- **Advanced editor**: Markdown with preview, image upload, beneficiaries

### Comparison with Other Hive Frontends
| Frontend | Focus | Unique Feature |
|----------|-------|---------------|
| **PeakD** | Full-featured blogging | Most polished UI, communities |
| **InLeo** | Microblogging + finance | Threads, LEO token |
| **Ecency** | Mobile-friendly social | Points system, mobile apps |
| **3Speak** | Video hosting | Decentralized video |

---

## Developer Integration

### @hiveio/dhive (Primary JS Library)
```bash
npm install @hiveio/dhive
```

```javascript
const { Client, PrivateKey } = require('@hiveio/dhive');
const client = new Client(['https://api.hive.blog', 'https://api.deathwing.me']);

// Post a comment/thread
client.broadcast.comment({
  author: 'youraccount',
  title: '',
  body: 'Hello from ZAO OS!',
  parent_author: '',
  parent_permlink: 'community-tag',
  permlink: 'unique-permlink-' + Date.now(),
  json_metadata: JSON.stringify({ app: 'zao-os', tags: ['music', 'zao'] })
}, PrivateKey.fromString('posting-private-key'));
```

### Authentication Options
1. **Hive Keychain** (browser extension, like MetaMask for Hive) — `npm install keychain-sdk`
2. **HiveAuth** (QR-based, mobile-friendly, no extension needed)
3. **HiveSigner** (OAuth2-style redirect flow)
4. **Stored Posting Key** (server-side, mirrors ZAO OS Farcaster signer pattern)

### Public API Nodes
- `https://api.hive.blog` (@blocktrades)
- `https://api.deathwing.me` (@deathwing)
- `https://api.openhive.network` (@gtg)
- `https://anyx.io` (@anyx)
- `https://rpc.ausbit.dev` (@ausbitbank)

---

## Music on Hive

### Active Music Communities

**Hive Open Mic** (`hive-105786`)
- Weekly global live music event
- ~80 fresh songs/week from ~100 musicians
- ~10,000 listeners worldwide
- Website: hiveopenmic.com

**BlockTunes** (blocktunes.net)
- Music NFT marketplace on Hive
- Artists mint collectible music NFTs using MUSIC tokens
- Also distributes to mainstream streaming platforms

**NFTTunz** (app.nfttunz.io)
- Digital music marketplace/auction platform
- Secondary market royalties for original artists

**Rising Star Game**
- Play-to-earn NFT game themed around music careers
- Musicians can mint actual music as in-game NFT Records

**VIBES Token**
- Hive Engine token for music content curation rewards

---

## Integration Plan for ZAO OS

### Architecture: Cross-Post to Hive

```
User posts in ZAO OS
  ├── Farcaster (via Neynar) — existing flow
  └── Hive (via dhive) — new channel option
       ├── Appears on PeakD
       ├── Appears on InLeo
       ├── Appears on Ecency
       └── Earns HIVE/HBD rewards from upvotes
```

### Recommended Auth: Stored Posting Key
- Mirrors current Farcaster signer pattern
- User provides Hive posting key during onboarding (or ZAO creates account)
- Server stores encrypted posting key
- Cross-posts signed and broadcast automatically
- Posting key cannot move funds — safe to store

### Phased Approach
1. **Phase 1**: Single ZAO community Hive account cross-posts all channel messages (zero user friction)
2. **Phase 2**: Individual member Hive accounts with posting key delegation
3. **Phase 3**: ZAO token on Hive Engine for community rewards

### Pros
- Censorship-resistant on-chain content
- Earn HIVE/HBD rewards from community upvotes
- Free transactions (no API costs like Neynar)
- Content visible on all Hive frontends simultaneously
- Established music community (Hive Open Mic, BlockTunes)
- Could create ZAO token on Hive Engine (~$1-5)

### Cons
- Account creation friction (3 HIVE each or free via RC)
- Key management complexity (4-tier system)
- Smaller ecosystem (~20k DAU vs Farcaster ~500k)
- Different content model (blog-oriented, threads are secondary)
- 7-day reward window, 13-week power-down
- Cannot truly delete content (only edit to blank)
- No existing Farcaster-Hive bridge (would be novel)

### Assessment
| Factor | Rating |
|--------|--------|
| Technical feasibility | High — dhive makes posting trivial |
| Integration complexity | Medium — account creation + key management |
| Cost | Very Low — free transactions, free APIs |
| Audience reach | Low-Medium — ~20k DAU but active music niche |
| Monetization potential | High — content earns real tokens |
| Alignment with ZAO | High — web3 music values match |

---

*Last updated: 2026-03-13*
