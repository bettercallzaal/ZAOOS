---
topic: identity
type: comparison
status: research-complete
last-validated: 2026-04-25
related-docs: 055, 273, 283, 500
tier: DISPATCH
---

# 525 - Guild.xyz + Token-Gating Platform Evaluation for ZAO OS

> **Goal:** Decide whether ZAO should adopt Guild.xyz, swap to an alternative platform, or extend the current custom viem + Hats Protocol gate. Triggered by Zaal's question "guild.xyz and things like that."

## Key Decisions

| Decision | Verdict | Reason |
|---|---|---|
| Adopt Guild.xyz | **SKIP** | SaaS-only backend, can't gate by Farcaster FID (only follows), $350/yr buys features unused at 188 members. Conflicts with OSS-first policy (`feedback_oss_first_no_platforms.md`). |
| Adopt Collab.Land | **SKIP** | Discord-first; ZAO is Farcaster-first. Redundant. |
| Adopt Lit Protocol | **SKIP** | Over-engineered. PKPs + IPFS Lit Actions for binary access checks. |
| Adopt Unlock Protocol | **DEFER** | Only useful if ZAOstock paid memberships ship. Revisit after Oct 3. |
| Adopt EAS attestations on Base | **USE (Tier 2)** | Free, Base-native (predeployed `0x4200...0021`), pairs with Coinbase Verifications for sybil resistance. Add when contributor-badge gating is needed. |
| Adopt Farcaster-native gating (Neynar) | **USE (Tier 1)** | Already integrated. Channel membership + follow gating covers 90% of ZAO's use cases. Highest fit (9/10). |
| Replace custom viem gate | **NO** | Current `src/lib/spaces/tokenGate.ts` (104 LOC) is the wagmi/viem standard pattern. Most apps roll their own. |
| Add Ponder indexer | **USE (Tier 2)** | MIT, self-hostable on VPS 1. Pre-indexes ZABAL + Hats wearers. Gate checks: 1ms DB lookup vs. 2-5s RPC multicall. |
| Enable viem multicall batching | **USE (Tier 1)** | One-line config in `getClient()`. 20 token checks -> 1 RPC. Zero arch change. |
| Add Redis cache for gate results | **USE (Tier 1)** | Cuts RPC load ~80%. Self-host Redis on VPS 1. |
| Gitcoin Passport sybil API | **DEFER** | Free tier exists. Worth it if spam/farming becomes problem. Not yet. |

## Codebase Reality (Step 2 Result)

| File | LOC | Role |
|---|---|---|
| `src/lib/spaces/tokenGate.ts` | 104 | Custom ERC-20/721/1155 gate, viem, mainnet+Base+Optimism |
| `src/lib/hats/gating.ts` | 171 | Hats Protocol -> Permission mapping, 7 hat-roles |
| `src/lib/fishbowlz/tokenGate.ts` | 47 | FISHBOWLZ-specific gate (deprecated per `project_fishbowlz_deprecated.md`) |
| `src/app/api/spaces/gate-check/route.ts` | - | Gate API endpoint |
| `src/app/api/fishbowlz/gate-check/route.ts` | - | FISHBOWLZ gate (deprecated) |
| `src/app/api/discord/sync/route.ts` | - | Discord role sync |
| `src/components/portal/PortalGate.tsx` | - | Portal-level gate UI |
| `src/components/spaces/TokenGateSection.tsx` | - | Spaces gate UI |
| `src/lib/discord/client.ts` | - | Discord client wrapper |

**Stack right now:** custom viem -> Hats -> Discord sync. Pure code, no SaaS dependency. Aligns with `feedback_oss_first_no_platforms.md`.

---

## Guild.xyz - Detailed

### Pricing (verified 2026-04-25)
| Tier | Price | Members | Notes |
|---|---|---|---|
| Free | $0 | unlimited | Basic gating, Guild branding |
| Starter | $29/mo | up to 1K | Custom branding |
| Plus | $99/mo | up to 10K | Quests + analytics |
| Growth | $399/mo | up to 100K | CRM, advanced campaigns |

At 188 members, Starter = $3.50/member/yr. Cheap, but features (quests, CRM) unused at this scale.

### Architecture
- TypeScript SDK v2.6.9, REST API, EIP-712 signing (viem/wagmi compatible)
- UI open-source: `github.com/guildxyz/guild.xyz` (3.5K stars)
- Backend = proprietary SaaS. Forking UI doesn't enable self-host.
- Smart contracts: `github.com/guildxyz/guild-gated-contracts` (Solidity, 20 stars, rarely used)

### Requirement Types
On-chain: ERC-20/721/1155, POAP, Mirror, Unlock, Snapshot, Lens, **Hats Protocol** (via ERC-1155 token ID), JuiceBox.
Social: Discord, Telegram, X, GitHub, Farcaster (FOLLOWS only — see below), Gitcoin Passport, Coinbase Verifications.
Allowlist: CSV upload, NFT trait matching.

### Farcaster Gap (Critical for ZAO)
Marketing says "Farcaster supported." Reality: only follow-relationships and caster-power thresholds. **Cannot gate by FID, channel membership, or cast history.** ZAO's allowlist is FID-based -> custom gate must remain.

### Hats Compatibility
Works. Create Guild role with ERC-1155 requirement using your Hats token ID. Limit: each Guild role gates only ONE Telegram channel.

### Reliability
- No public SLA, no status page
- Hosted on Vercel + Cloudflare (inherited 99.9%)
- API docs from 2023, SDK from Nov 2024 (lagging but stable)
- No CVEs / breaches reported 2025-2026

### Migration Difficulty
3.5/10 if pursued. Quick role replication. Discord backfill tricky. Custom FID gate must stay -> savings minimal.

### Why SKIP for ZAO
1. FID gating must stay custom -> Guild solves nothing here
2. 188 members = manual mgmt is fine; no bottleneck
3. Hats are core; Guild adds no governance value
4. SaaS-only conflicts with OSS-first
5. $350/yr negligible but unused features

### Revisit If
- Member count > 5K (Discord role mgmt becomes painful)
- ZAO wants quest engine (points, leaderboards, campaigns)
- Farcaster gating shifts from FID to follower relationships
- Member CRM analytics become valuable

---

## Alternatives Matrix (verified 2026-04-25)

| Platform | What | Pricing 2026 | Self-Host | ZAO Fit /10 | Verdict |
|---|---|---|---|---|---|
| **Farcaster Hub / Neynar** | Channel membership + follow gating | Free tier + paid API | Yes (Hubble) | **9** | USE Tier 1 |
| **EAS on Base** | Onchain attestations, predeployed `0x4200...0021` | Gas only | Yes (indexer OSS) | **8** | USE Tier 2 |
| **Coinbase Verifications** | KYC-backed EAS attestations on Base | Free | No (Coinbase-issued) | **7** | USE for sybil if needed |
| **Unlock Protocol** | Membership NFT contracts, recurring renewals | Gas only (Base since Oct 2024) | Yes (smart contracts) | **7** | DEFER until paid memberships |
| **Collab.Land** | Discord/Telegram bot | $17.99-$449/mo by verified members | No | **6** | SKIP, Discord-first |
| **Lit Protocol** | PKPs + access control conditions | Free SDK + compute metering | Partial | **5** | SKIP, over-engineered |
| **Snapshot Strategies** | Reuse voting strategies as gates | Free | Yes | **4** | SKIP, not real-time |
| **Privy** | Embedded wallets + auth | Free + per-user pricing | No | **3** | SKIP for gating (ok for auth) |
| **Sismo** | Legacy badges sunset Sep 2023 | n/a | n/a | **2** | DEAD |
| **Zora Allowlist** | Merkle-proof presale gate | Gas only | Yes | **2** | SKIP (NFT-mint only, not access) |

---

## Self-Hosted OSS Library Recommendations

Aligns with `feedback_oss_first_no_platforms.md`. Add to existing stack, not replace.

### Tier 1 (Ship Now, near-zero lift)

**1. Enable viem multicall batching**
```typescript
// src/lib/spaces/tokenGate.ts - getClient()
return createPublicClient({
  chain,
  transport: http(),
  batch: { multicall: { batchSize: 1024, wait: 10 } },
});
```
Result: 20 ERC-20 balance checks = 1 RPC call. Free.

**2. Add Redis caching layer**
```typescript
const cacheKey = `gate:${walletAddress}:${gate.contractAddress}:${gate.chainId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
const result = await checkTokenGate(walletAddress, gate);
await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min TTL
return result;
```
Self-host Redis on VPS 1, or use Supabase Redis add-on ($5-60/mo). 80% RPC reduction.

### Tier 2 (Add if ZAO scales past ~1K active gate-checks/day)

**3. Ponder indexer**
- `github.com/ponder-sh/ponder` MIT, 1.06K stars, last push 2026-03-26
- Self-host on VPS 1 (Node + Postgres)
- Pre-index ZABAL Transfer events + Hats wearers
- Gate becomes `SELECT balance FROM holders WHERE address=?` (~1ms)
- Lift: medium (3/10). Payoff: high.

### Tier 3 (Optional)

**4. Gitcoin Passport sybil API**
- `github.com/passportxyz/passport`, free Models API
- Gate becomes: `sybil_score > 20 AND token_balance > 0`
- Add only if spam/farming becomes a problem.

### Do NOT Adopt
- Guild.xyz SDK (SaaS backend, no self-host)
- Zodiac Roles (`gnosisguild/zodiac-modifier-roles`) - overkill, Hats already covers role mgmt
- CASL - JS permission lib, no infrastructure win
- Subsquid - SSPL license (not pure OSS), non-EVM focus

### Already Built-In (Confirmed)
- `viem.multicall()` (use it - currently not configured)
- `wagmi.useReadContract()` / `watchContractEvent` (use for live event sync)

---

## Migration Roadmap (if Tier 1+2 adopted)

1. **Now:** Add `batch.multicall` config in `tokenGate.ts:54` (`getClient`). 1-line change. Difficulty 1/10.
2. **Now:** Stand up Redis on VPS 1 (`docker run redis:alpine`). Wire to `gate-check` route. Difficulty 2/10.
3. **Next sprint:** Spike Ponder indexer for ZABAL Transfer events. Difficulty 4/10.
4. **Quarterly:** Re-evaluate EAS + Coinbase Verifications when contributor-badge gating ships.
5. **Annual:** Re-evaluate Guild.xyz when member count > 5K or quest mechanics needed.

---

## Also See

- [Doc 055](../../_archive/055-hats-anchor-app-and-tooling/) - Hats Anchor app + tooling (archived)
- [Doc 273](../../music/273-web3-streaming-features-tipping-gating-tickets/) - Web3 streaming features incl. gating
- [Doc 283](../../283-privy-embedded-wallets-fishbowlz-token-mechanics/) - Privy + token mechanics
- [Doc 500](../../governance/500-dao-event-coordination-patterns/) - DAO event coordination
- `src/lib/spaces/tokenGate.ts` - current gate code
- `src/lib/hats/gating.ts` - current Hats integration

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add `batch.multicall` to `getClient()` in `src/lib/spaces/tokenGate.ts` | @Zaal or Quad | PR | Next sprint |
| Stand up Redis on VPS 1 + wire `gate:*` cache keys | @Zaal | VPS task | Next sprint |
| Spike Ponder indexer for ZABAL Transfer events | @Quad | Research PR | After Roddy 4/28 |
| Re-evaluate EAS gating when contributor-badge feature scoped | @Zaal | Doc update | When feature scoped |
| Annual Guild.xyz re-eval (set calendar) | @Zaal | Calendar | 2027-04-25 |
| Update `community.config.ts` if any new gate adopted | @Zaal | PR | After decision |

## Sources

All URLs verified live 2026-04-25.

### Guild.xyz
- https://guild.xyz - main site
- https://docs.guild.xyz - API + SDK docs
- https://github.com/guildxyz/guild.xyz - UI repo (3.5K stars, MIT)
- https://github.com/guildxyz/guild-sdk - TS SDK (163 stars, MIT, last commit 2024-11-18)
- https://github.com/guildxyz/guild-gated-contracts - Solidity contracts (20 stars)
- https://guild.xyz/base - Base chain Guild (667K members)

### Alternatives
- https://collab.land/pricing - Collab.Land pricing
- https://developer.litprotocol.com/sdk/introduction - Lit Protocol SDK
- https://unlock-protocol.com/ - Unlock Protocol (DAO migrated to Base Oct 2024)
- https://attest.org/ - EAS docs
- https://help.coinbase.com/en/coinbase/getting-started/verify-my-account/onchain-verification - Coinbase Verifications
- https://docs.privy.io/guide/react/authentication/ - Privy auth
- https://docs.zora.co/contracts/ERC721Drop - Zora allowlist
- https://docs.neynar.com/reference/follow-channel - Farcaster channel membership API
- https://docs.snapshot.box/user-guides/voting-strategies - Snapshot strategies

### OSS Libraries
- https://github.com/wevm/viem - viem (multicall built-in)
- https://wagmi.sh/core/actions/watchContractEvent - wagmi event watcher
- https://github.com/ponder-sh/ponder - Ponder indexer (MIT, 1.06K stars)
- https://github.com/enviodev/open-indexer-benchmark - Envio benchmarks
- https://github.com/passportxyz/passport - Gitcoin Passport (Models API + Stamps)
- https://github.com/gnosisguild/zodiac-modifier-roles - Zodiac Roles (GPL-3.0)

### Dead / Sunset
- Sismo Badges - sunset Sep 1 2023; Sismo Connect (Apr 2023 GA) is a different product

## Bonus: What is Serena (image attached to this request)

Not gating-related. Serena = `oraios/serena` MCP server for semantic code editing. Already installed in this project (see `.serena/` in git status). Provides symbol-tree tools (`find_symbol`, `get_symbols_overview`, `replace_symbol_body`, `insert_after_symbol`) so agents read code as a symbol graph instead of flat-text. Cheaper than `Read` for large files. No action needed.
