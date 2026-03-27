# 158 — ZAO Member Naming: ENS Subnames vs Basenames vs Custom

> **Status:** Research complete
> **Date:** March 27, 2026
> **Goal:** Give every ZAO member a human-readable on-chain identity (e.g., zaal.thezao.eth, candy.thezao.eth)
> **Builds on:** [Doc 127 — ENS Integration Deep Dive](../127-ens-integration-deep-dive/)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Parent domain** | Register `thezao.eth` (~$5/year for 7+ chars) — NOT `zao.eth` ($640/year for 3 chars) |
| **Approach** | **Option A: NameStone gasless subnames** — zero gas, REST API, free, works today |
| **Fallback** | Option B: Namespace.ninja if NameStone doesn't fit (has L2 + token-gating built in) |
| **NOT recommended** | On-chain NameWrapper subnames (gas cost ~$2-5 per name x 40+ members = $80-200) |
| **NOT recommended** | Basenames (Base-specific, not interoperable with mainnet ENS ecosystem) |
| **When** | After `thezao.eth` is registered — can issue all 40+ names in one API batch |

## The 4 Options Compared

### Option A: ENS Subnames via NameStone (RECOMMENDED)

**How it works:** Register `thezao.eth` on-chain ($5/year). Use NameStone REST API to create gasless off-chain subnames (`zaal.thezao.eth`, `candy.thezao.eth`, etc.). Names resolve in every ENS-compatible wallet and dApp via CCIP-Read (ERC-3668).

| Aspect | Details |
|--------|---------|
| **Cost** | `thezao.eth` registration: ~$5/year + gas. Subnames: FREE (unlimited) |
| **Gas per subname** | $0 — off-chain, resolved via CCIP-Read |
| **API** | REST API + TypeScript SDK. Endpoints: Set Name, Get Names, Search, Delete |
| **Auth** | API key (free, request via form) |
| **Resolution** | Works in MetaMask, Rainbow, Coinbase Wallet, Etherscan, all ENS-aware apps |
| **Admin** | No-code admin panel for managing subnames |
| **Trade-off** | Centralized storage (NameStone servers). Not true on-chain NFTs |
| **Used by** | dynamic.xyz, burner.pro, POAP, ENSPro |

**Implementation in ZAO OS:**
```typescript
// POST to NameStone API
const res = await fetch('https://namestone.xyz/api/public_v1/set-name', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': NAMESTONE_API_KEY,
  },
  body: JSON.stringify({
    domain: 'thezao.eth',
    name: 'zaal',           // creates zaal.thezao.eth
    address: '0x7234...e9af', // member's wallet
    text_records: {
      description: 'ZAO Member — Founder',
      url: 'https://zaoos.com/members/zaal',
      'com.twitter': 'bettercallzaal',
    },
  }),
});
```

**Auto-issue flow:**
1. Member joins ZAO (passes gate check)
2. ZAO OS calls NameStone API to create `username.thezao.eth`
3. Name appears on their profile + resolves in all wallets
4. Admin can revoke via API if member leaves

### Option B: Namespace.ninja

**How it works:** Same parent domain concept, but Namespace provides a more full-featured platform with L2 support, token-gating, and a minting wizard.

| Aspect | Details |
|--------|---------|
| **Cost** | Parent domain: same. Subnames: configurable (free or paid) |
| **L2 support** | Yes — subnames resolve across Ethereum and L2s natively |
| **Token gating** | Built-in — can gate subname registration to NFT holders |
| **Setup** | Wizard at app.namespace.ninja for configuring minting parameters |
| **Trade-off** | More opinionated platform. Less raw API control vs NameStone |
| **Used by** | Multiple ENS communities, DAO tooling integrations |

**When to choose Namespace over NameStone:**
- If you want members to self-register (claim their own name)
- If you want to gate registration to ZOUNZ NFT holders
- If you want L2-native resolution without CCIP-Read

### Option C: On-Chain NameWrapper Subnames (NOT recommended for now)

**How it works:** Register `thezao.eth`, wrap it in the NameWrapper contract, then create on-chain ERC-1155 subnames that are real NFTs in members' wallets.

| Aspect | Details |
|--------|---------|
| **Cost** | $2-5 gas per subname creation. 40 members = $80-200 upfront |
| **Gas** | Every create, update, or transfer costs gas |
| **Benefit** | True on-chain NFTs. Members OWN their subname |
| **Fuses** | Can set permissions (irrevocable, non-transferable, etc.) |
| **Trade-off** | Expensive for a 40-member community. Complex smart contract interaction |
| **Best for** | Large DAOs (1000+) where members pay their own gas |

**When to upgrade to this:** If ZAO grows to 500+ members and wants truly decentralized, member-owned names.

### Option D: Basenames on Base (NOT recommended)

**How it works:** Each member registers their own `name.base.eth` Basename on Base L2.

| Aspect | Details |
|--------|---------|
| **Cost** | ~$1-5 per name depending on length |
| **Ecosystem** | 750K+ registrations. Supported by Coinbase Wallet, Base App |
| **Trade-off** | NOT branded to ZAO. Names look like `zaal.base.eth` not `zaal.thezao.eth` |
| **Trade-off** | No subname structure — each is an independent registration |
| **Trade-off** | Base-specific resolution. Limited interop with mainnet ENS apps |

**Verdict:** Good for individual identity but doesn't create ZAO community identity. Members who want one should register independently.

## Current State of Member Basenames

We already have Basename resolution built (`src/lib/ens/resolve.ts` — `resolveBasenames()`). The API at `/api/members/[username]` returns `basenames: {}` for wallets checked. As of today, **no ZAO members have Basenames registered** — this is an opportunity to create a unified identity system instead.

## Cost Comparison

| Approach | Year 1 (40 members) | Year 2+ | Per new member |
|----------|---------------------|---------|----------------|
| **NameStone (gasless)** | $5 (domain) + $0 (subnames) = **$5** | $5/year | $0 |
| **Namespace** | $5 (domain) + $0-varies | $5/year | $0-varies |
| **NameWrapper (on-chain)** | $5 (domain) + $120 (gas) = **$125** | $5/year | $3-5 |
| **Basenames** | $40-200 (individual) | $40-200/year | $1-5 each |

## Recommended Implementation Plan

### Phase 1: Register + Setup (1 hour)
1. Register `thezao.eth` at app.ens.domains (~$5 + gas)
2. Set up NameStone API key (free)
3. Configure parent domain in NameStone admin panel

### Phase 2: Batch Issue Names (2 hours)
4. Create `/api/admin/ens-subnames` route in ZAO OS
5. Pull all members from Supabase (name + wallet)
6. Batch-create `name.thezao.eth` for each member via NameStone API
7. Store subname in `users` table (`zao_ens_name` column)

### Phase 3: Display + Auto-issue (3 hours)
8. Show `zaal.thezao.eth` prominently on member profiles
9. Add to ProfileDrawer as primary identity
10. Auto-issue on new member onboarding
11. Add management UI in admin panel (create/revoke)

### Phase 4: Text Records (1 hour)
12. Set text records for each subname: `url` (profile link), `avatar` (PFP), `description`, `com.twitter`
13. Members' ZAO profiles become discoverable via any ENS lookup

**Total effort: ~7 hours. Cost: ~$5/year.**

## Alternative: `zao.eth` (3-letter premium)

`zao.eth` costs ~$640/year because 3-letter names are premium ($640/year vs $5/year for 4+ chars). This makes `thezao.eth` the obvious choice at 128x cheaper. The subnames `zaal.thezao.eth` vs `zaal.zao.eth` — the extra "the" is negligible and matches the brand ("The ZAO").

## Alternative: Custom Naming (Build Your Own)

You *could* deploy your own resolver contract and create a fully custom naming system (e.g., `.zao` TLD). This is what ENS itself does. However:

- Requires deploying and maintaining smart contracts
- Names wouldn't resolve in existing wallets/dApps without custom resolver integration
- Massive engineering effort for minimal benefit over ENS subnames
- **Verdict:** Not worth it. Use ENS infrastructure.

## Sources

- [NameStone — Create ENS Subdomains via API](https://namestone.com/)
- [NameStone Docs](https://namestone.com/docs)
- [NameStone Gasless Subnames](https://namestone.com/blog/gasless-subnames)
- [Namespace — Subnames for Everyone](https://namespace.ninja/)
- [Namespace — Unified Identity for Communities](https://namespace.ninja/blogs/unified-identity-for-your-community-with-ens-subnames)
- [ENS NameWrapper Deep Dive](https://ens.mirror.xyz/0M0fgqa6zw8M327TJk9VmGY__eorvLAKwUwrHEhc1MI)
- [ENS Subdomains Docs](https://docs.ens.domains/web/subdomains/)
- [Creating a Subname Registrar](https://docs.ens.domains/wrapper/creating-subname-registrar/)
- [Base — Basenames](https://www.base.org/names)
- [How Base Uses ENS](https://ens.domains/ecosystem/base)
- [ENS Registration Fees](https://support.ens.domains/en/articles/7900605-fees)
- [Doc 127 — ENS Integration Deep Dive](../127-ens-integration-deep-dive/)
- [Doc 135 — Exhaustive Profile Enrichment](../135-exhaustive-profile-enrichment-signals/)
- [Doc 136 — API Status Verification](../136-api-status-verification-march-2026/)
