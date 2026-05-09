---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-09
related-docs: 626, 625, 468, 584
tier: STANDARD
---

# 627 - $ZABAL Empire ground truth + Empire Builder v3 capability map

> **Goal:** Read-out of $ZABAL Empire's live state on Empire Builder v3 (Zaal-owned, deployed 2026-01-01) plus a tour of every v3 capability ZAO/BCZ should consider next. Companion to doc 626 (POIDH leaderboard hookup) and doc 625 (POIDH playbook).

> **Source of truth:** `https://www.empirebuilder.world/skill/SKILL.md` (versioned `latest`, lastUpdated 2026-05-04). Always re-fetch at session start. References at `skill/references/{http-api,workflows,contracts}.md`.

> **Big correction from doc 626:** Zaal IS the $ZABAL Empire owner (`owner = 0x7234...e9af`). Not yerbearserker, not Adrian. Co-emperor: `0xb79c...7932` (Farcaster username "zaal" - likely Zaal's secondary wallet). Zaal can call every guardian-signed endpoint directly, including `distribute-prepare`. He doesn't need yerbearserker/Adrian to wire the POIDH leaderboard - he can do it himself from the Empire dashboard or via signed API call.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Empire identity** | $ZABAL Empire ID = `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` (Clanker v4 ERC-20 on Base 8453). Treasury SmartVault = `0xe0faa499d6711870211505bd9ae2105206af1462`. Owner = Zaal `0x7234c36a71ec237c2ae7698e8916e0735001e9af`. Use these in every Empire Builder API call. |
| **Skip yerbearserker/Adrian dependency** | Zaal owns the empire. Zaal signs his own EIP-191 messages from his owner wallet to create leaderboards, add boosters, prep distributions. The previous plan to DM yerbearserker / Adrian for the POIDH leaderboard config is OPTIONAL - Zaal can do it himself in seconds via the Empire dashboard at `empirebuilder.world/empire/0xbB48...0b07`. |
| **POIDH leaderboard slot** | USE next free slot. Existing slots: 1 = "ZABAL holders" (tokenHolders), 3 = "Songjam Season 1", 4 = "ZAO RESPECT 1/5/26". Slot 2 + 5+ are free. Recommend slot 5 with name "BCZ YapZ Submitters" (per doc 626). API path: `POST /api/leaderboards/apiLeaderboards`. |
| **Distribution flow (Zaal can do this himself)** | Phase 2 ZABAL airdrop = `POST /api/distribute-prepare` (Zaal signs as owner) -> Zaal's wallet broadcasts `executeBatch` on the SmartVault `0xe0faa...1462` -> `POST /api/store-distribution`. No yerbearserker/Adrian, no UserOp/paymaster, no co-signer flow. Zaal's owner EOA pays gas (~pennies on Base). |
| **What v3 adds that's NEW** | Six things ZAO/BCZ should explore: (1) native staking via StakingLocker (lock ZABAL/SANG for multipliers), (2) Farcaster cast / channel / interaction leaderboards (no scraping needed), (3) Quotient (reputation) leaderboards, (4) FarToken leaderboards, (5) Tipn leaderboards, (6) batched distributions to multiple leaderboards in one tx. See Part 4. |
| **Booster expansion** | Current 3 boosters: zaal Zora coin (5x at 1M holdings), ZAAL newsletter token (5x at 1M), Quotient reputation (default 1x). RECOMMEND adding: SANG holder (Adam's coin, ZABAL ecosystem alignment), ZORO holder (per-Zaal AMA mention), POIDH NFT claim holder (loops back to bounty engagement). Cap: ~10 boosters per empire is healthy. |
| **Treasury current state** | $1547.44 in treasury (USD-equiv display value), 178,213,603 ZABAL burned to date, 33 distributions made, 227 total distribution recipients, rank 5.23. Empire is ALIVE, not idle - keep the cadence. |
| **v3 vs v2 status** | $ZABAL has been migrated: `v2_empire_address = 0x99777...0dc9` (legacy), `v3_address = 0xe0faa...1462` (current = empire_address). Use the v3 address for every interaction. The v2 address is dead - ignore. |
| **Mainnet only** | Empire Builder is mainnet-only (Base 8453, Arbitrum 42161). No testnet. Every write = real funds + real on-chain state. Do read-only GETs first to dry-run. |
| **Auth model summary** | Reads: most are open GETs, no key needed. Writes: require `x-api-key` header + EIP-191 signature `{signature, message, signerAddress}` (signer must equal `empires.owner` OR be in `empires.co_emperors`). Distribute-prepare = stricter: signer MUST equal `owner()` exactly, co-emperors can't sign for it via the EOA path. |

---

## Part 1 - $ZABAL Empire Live State (snapshot 2026-05-09)

### Identity + ownership

| Field | Value |
|-------|-------|
| Empire ID (`base_token`) | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` |
| Token symbol | `ZABAL` (Clanker v4 ERC-20 on Base) |
| SmartVault (`empire_address` / `v3_address`) | `0xe0faa499d6711870211505bd9ae2105206af1462` |
| Legacy v2 address (deprecated) | `0x99777b2414d1261f041ebd9cf1e3c95f35a60dc9` |
| Owner | `0x7234c36a71ec237c2ae7698e8916e0735001e9af` (Zaal - SAME wallet that issued POIDH bounty 1151) |
| Co-emperor | `0xb79cdabf6f2fb8fea70c2e515aec35e827bf7932` (Farcaster: zaal) |
| Chain | Base (8453) |
| Created | 2026-01-01 |
| Deployment hash | `0x9960a54d...0923ce44` |

### Brand surfaces

| Surface | URL |
|---------|-----|
| Empire Builder dashboard | https://empirebuilder.world/empire/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07 |
| Songjam frontend | https://songjam.space/zabal |
| Creative hub | https://zabal.art/ |
| Twitter | https://x.com/bettercallzaal |
| Farcaster | https://farcaster.xyz/zaal |
| Tinybot | `zabalbot` |
| Logo | https://aquamarine-hidden-peafowl-945.mypinata.cloud/ipfs/bafybeibcjnzmmvybxzlrkxav4swybsogkottpr6yxw6milqcvbyk5sqcs4 |

### Activity metrics

| Metric | Value |
|--------|-------|
| Treasury (USD equiv) | $1,547.44 |
| Total ZABAL burned | 178,213,603 |
| Distribution counter | 33 (number of distributions made) |
| Total distributed (recipients tally) | 227 |
| Empire rank | 5.23 |
| Last v3 health check | 2026-05-09 14:26 UTC |

### Existing leaderboards on $ZABAL Empire (3 found, slot range 1-20)

| Slot | Name | Type | Token Boosters | Reputation Boosters | Staking Boosters | Last refresh |
|------|------|------|----------------|---------------------|------------------|--------------|
| 1 | ZABAL holders | tokenHolders | ON | ON | ON | 2026-05-09 21:25 UTC |
| 3 | Songjam Season 1 | (legacy/unset) | OFF | OFF | ON | 2026-05-06 14:22 UTC |
| 4 | ZAO RESPECT 1/5/26 | (legacy/unset) | ON | ON | ON | 2026-05-09 14:26 UTC |

**Free slots:** 2, 5-20. Recommend POIDH lands at slot 5 (slot 2 reserved for a future tokenHolders refresh of an attached token if needed).

### Active boosters (3)

| Booster | Type | Multiplier | Trigger |
|---------|------|------------|---------|
| `zaal` Zora Creator Coin | ERC-20 (zora-erc20) `0x2275...c285` | 5x | Hold >= 1,000,000 zaal tokens |
| `ZAAL` ZAO Newsletter Token | ERC-20 (standard) `0x3213...03d4` | 5x | Hold >= 1,000,000 ZAAL |
| Quotient Reputation Booster | QUOTIENT (default) | 1x base, scales by reputation | Quotient.social score |

---

## Part 2 - Empire Builder v3 Architecture (Confirmed via SKILL.md)

### Empires are ERC-4337 SmartVaults

The fundamental shift in v3: every Empire's treasury is an **ERC-4337 SmartVault** with the same logical address on Base + Arbitrum. SmartVault exposes:

```solidity
struct Call { address target; uint256 value; bytes data; }
function execute(Call calldata call_) external payable;
function executeBatch(Call[] calldata calls_) external payable;
function owner() external view returns (address);
```

Owner = the wallet that can call `execute` / `executeBatch` directly (EOA). Co-signers can only act through ERC-4337 UserOps via the website's bundler + paymaster - they CANNOT bypass via direct EOA calls (reverts `Unauthorized`).

### Empire ID vs SmartVault address

THIS IS THE #1 SKILL-FAILURE MODE per the official docs.

| Concept | Field names | Example |
|---------|-------------|---------|
| **Empire ID** (identity) | `tokenAddress`, `baseToken`, `empire_id`, `[empire_id]` path | `0xbB48...0b07` for ZABAL token-empire (or `fid12345`, or custom slug) |
| **SmartVault address** (treasury contract) | `empire_address`, `empireAddress`, `treasuryAddress` | `0xe0faa...1462` for ZABAL |

They are NEVER interchangeable unless an endpoint takes both as separate fields. Some endpoints (like `store-distribution`) require both.

### Three Empire ID shapes

| Shape | Example | Used for |
|-------|---------|----------|
| Token empire | `0x` + 40 hex (the ERC-20 base) | Most empires (ZABAL falls here) |
| Farcaster tokenless | `fid` + digits, e.g. `fid12345` | Empire anchored to a Farcaster fid, no token |
| Custom slug | alphanumeric | Empire with custom name, no token |

### Authentication tiers

| Tier | Use |
|------|-----|
| None | Most reads (`/api/empires/...`, `/api/leaderboards/...`, `/api/boosters/...`) |
| `x-api-key` header | Some reads, all writes (server-enforced via `validateRequest`) |
| `x-api-key` + EIP-191 signature `{signature, message, signerAddress \| signer}` | Guardian writes (leaderboard create, booster add/remove, distribute-prepare, deploy-empire). Server verifies `verifyMessage` then checks signer is owner or co-emperor. |
| `x-api-key` + signature with **strict owner check** | `distribute-prepare` only. Co-emperors can't sign. |

### Mainnet only - no testnet

Every write hits real Base or Arbitrum mainnet. There is no sandbox. Dry-run by reading first:
- `GET /api/empires/<empire_id>` 
- `GET /api/leaderboards/<uuid>`
- `GET /api/boosters/<empire_id>`

---

## Part 3 - Eleven Leaderboard Types (v3 expanded from 5 in earlier docs)

`POST /api/leaderboards/<typeSuffix>` with guardian sig + body. Refresh via `PATCH /api/leaderboards/refresh/<typeSuffix>`.

| Type | Path suffix | What it ranks | ZAO use case |
|------|-------------|---------------|--------------|
| Token holders | `tokenHoldersLeaderboards` | ERC-20 balance | Who holds the most ZABAL (already slot 1) |
| Stakers | `stakersLeaderboards` | StakingLocker stake amount + duration | Lock ZABAL for points (Phase 2 unlock) |
| NFT | `nftLeaderboards` | ERC-721 / ERC-1155 holdings | ZAO Stock NFT holders, POIDH claim NFT holders |
| **API-Sourced** | `apiLeaderboards` | External JSON URL | POIDH submitters (current BCZ integration) |
| CSV upload | `csvLeaderboards` | One-shot CSV (no auto-refresh) | One-time campaign winner lists |
| **FarToken** | `farTokenLeaderboards` | Holders of a Farcaster-launched token | Rank Clanker tokens linked to ZAO members |
| **Tipn** | `tipnLeaderboards` | Tipn (Farcaster tipping) activity | Reward Farcaster tippers in the ZAO orbit |
| **Farcaster cast** | `farcasterCastLeaderboards` | Engagement on a specific cast | One-shot promotional cast incentive |
| **Farcaster channel** | `farcasterChannelLeaderboards` | Engagement in a channel | /zao channel activity, /poidh channel for cross-promo |
| **Farcaster interaction** | `farcasterInteractionLeaderboards` | Likes/recasts/replies to your account | Reward people engaging with @bettercallzaal or @thezao |
| **Quotient** | `quotientLeaderboards` | Quotient.social reputation score | Reward high-rep accounts in ZAO ecosystem |

The Farcaster-native types (cast, channel, interaction) are the BIG v3 unlock - no external scraping needed; Empire Builder pulls Neynar/Hub data on its side.

---

## Part 4 - What v3 Lets ZAO/BCZ Do That Was Hard Before

### 1. Native staking + STAKING boosters

`POST /api/empires/activate-staking` flips a flag and auto-creates a stakers leaderboard. Then:

- Members lock ZABAL into the **immutable StakingLocker** contract (separate from the SmartVault) for any duration in `[0, 315_360_000]` seconds (0 = flexible, max = 10 years)
- `MAX_STAKES_PER_USER = 100` positions per (user, token)
- Min stake: token-dependent. Default = 100 tokens. WETH = 0.001 ETH. USDC = 1 USDC.
- Staking boosters: multiplier `[1.1x, 5.0x]`, capped at +5x total per user across all staking boosters
- Active staking auto-folds staked balances into `tokenHolders` and `farToken` leaderboards (so stakers don't lose their holdings ranking)
- Side-effect: every leaderboard refresh applies STAKING boosters additively when `apply_staking_boosters !== false`

**ZAO use case:** "Lock 100k ZABAL for 30 days, get 2x leaderboard points across every $ZABAL leaderboard you're on." Strong sticky-engagement loop.

### 2. Owner-signed distributions (Zaal can airdrop directly)

The flow per `references/workflows.md` Workflow 3:

```
1. GET /api/leaderboards?tokenAddress=0xbB48...0b07
   -> pick leaderboardId UUID (e.g. POIDH Submitters once created)

2. POST /api/distribute-prepare
   { tokenAddress: <empire_id>,
     leaderboardId: <uuid> | "main",
     amount: "1000000000000000000000",  // wei amount of ZABAL to distribute
     distributionMode: "weighted" | "even" | "raffle",
     signature, message, signer: 0x7234...e9af }
   -> returns transactions[] with calls[] or pre-encoded data, batchIndex per chain

3. Zaal's wallet (owner) submits each transactions[i] in batchIndex order:
   sendTransaction({ to: 0xe0faa...1462, data: tx.data, value: 0 })
   -> wait for receipt status === 1

4. POST /api/store-distribution
   { transactionHashes: ["0x...","0x..."], empireAddress: 0xe0faa...1462,
     baseToken: 0xbB48...0b07, leaderboardId, signature, message, signer }
```

Three modes per the AMA transcript I pulled earlier (doc 626 sources):
- **even split** - everyone gets same share
- **weighted** - share proportional to leaderboard `points` (boost-adjusted)
- **raffle** - random one address from top N wins the whole pot

**ZAO use case for POIDH:** weekly raffle distribution of 1000 ZABAL to top 10 POIDH submitters. Or weighted: distribute based on submission count (currently set to score 1 per unique wallet, but could shift back to claim-count if Zaal wants to reward power-submitters).

### 3. Farcaster cast / channel / interaction leaderboards

These are a unique v3 unlock. No external API endpoint, no scraping, no Neynar integration on Zaal's side. Empire Builder reads Farcaster Hub data directly.

**ZAO use case:**
- `/zao` channel leaderboard - rank by recent activity, distribute ZABAL weekly to top engagers
- A specific cast leaderboard - launch a major announcement cast, run a 7-day leaderboard for everyone who liked/recasted/replied, airdrop ZABAL
- @bettercallzaal interaction leaderboard - permanent leaderboard of accounts engaging with Zaal, ZABAL drops monthly

### 4. Quotient reputation leaderboards

Already have a Quotient booster on $ZABAL. Adding a Quotient leaderboard means ZABAL distributes proportionally to reputation tier. Aligns with ZAO's existing "Respect" framework + ORDAO governance vision.

### 5. Multi-chain operation

Every endpoint accepts `chainId` (8453 Base or 42161 Arbitrum). Empires have the same logical SmartVault address on both chains. ZAO is Base-native today but could mirror $ZABAL to Arbitrum if a partner ecosystem demands it without redeploying everything.

### 6. Tracked burns via store-burn

Burn ZABAL from the treasury (or any wallet) to `0x0` or `0xdEaD`, then `POST /api/store-burn` with the tx hash. Empire Builder decodes the receipt and updates `total_burned` on the empire. Already showing 178,213,603 ZABAL burned. Next deflation event can be tracked on-chain transparently.

---

## Part 5 - HTTP API Endpoint Catalog (Full v3)

### Reads (typical, no API key)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/top-empires` | Ranked empire list |
| GET | `/api/empires` | Paginated empires |
| GET | `/api/empires/[empire_id]` | Single empire (use for ZABAL recon) |
| GET | `/api/empires/search?q=` | Search by name |
| GET | `/api/empires/owner/[wallet]` | Empires owned by a wallet |
| GET | `/api/empires/ranking` | Empire-wide ranking calc |
| GET | `/api/empires/check` | Pre-check before deploy |
| GET | `/api/leaderboards?tokenAddress=<empire_id>` | List all empire leaderboards |
| GET | `/api/leaderboards/[id]` | Single leaderboard with entries |
| GET | `/api/leaderboards/consolidated?tokenAddress=` | All empire leaderboards merged |
| GET | `/api/boosters/[address]` | Booster list for empire |
| GET | `/api/staking-boosters/[address]` | Staking booster list |
| GET | `/api/empires/activate-staking?tokenAddress=` | Staking activation status |
| GET | `/api/empire-rewards/[token]` | Reward history |
| GET | `/api/empire-rewards/[token]/[type]` | Reward history filtered |
| GET | `/api/rewards/recipients/[txHash]` | Recipients of a tx |
| GET | `/api/distribution-records/[empireAddress]` | Cumulative per recipient |
| GET | `/api/airdrops/[tokenAddress]` | Airdrop list (API key) |
| GET | `/api/empire-airdrop-total` | Total airdrops |

### Writes - distributions & accounting

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/distribute-prepare` | API key + sig (signer = owner()) | Prepare batched ZABAL airdrop |
| POST | `/api/store-distribution` | API key | Record mined distribution |
| POST | `/api/store-burn` | API key | Track on-chain burn |
| POST | `/api/store-airdrop` | API key | Register external airdrop metadata |

### Writes - deploys

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/get-token-config` | API key | Get Clanker config for fresh deploy |
| POST | `/api/deploy-empire` | API key + sig | Deploy empire (fresh or attach existing token) |
| POST | `/api/deploy-empire-tokenless` | API key + sig | Deploy fid/slug-anchored empire |

### Writes - leaderboards & boosters

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/leaderboards/<type>` | API key + sig | Create leaderboard (one of 11 types) |
| PATCH | `/api/leaderboards/refresh/<type>` | API key | Refresh scores (30s cooldown) |
| POST | `/api/leaderboards/delete` | API key | Delete leaderboard |
| POST | `/api/boosters/[empire_id]` | API key + sig | Add ERC-20/NFT/Quotient booster |
| DELETE | `/api/boosters/[empire_id]` | API key + sig | Remove booster |
| POST | `/api/empires/activate-staking` | API key + sig | Flip staking flag, auto-create stakers leaderboard |
| POST | `/api/staking-boosters/[empire_id]` | API key + sig | Add staking booster |
| DELETE | `/api/staking-boosters/[empire_id]` | API key + sig | Remove staking booster |

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| ZABAL Empire ID | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` |
| ZABAL SmartVault | `0xe0faa499d6711870211505bd9ae2105206af1462` |
| Owner | `0x7234c36a71ec237c2ae7698e8916e0735001e9af` (Zaal) |
| Co-emperor count | 1 |
| Chain | Base (8453) |
| Token type | clanker_v4 ERC-20 |
| Treasury USD | $1,547.44 |
| Total burned | 178,213,603 ZABAL |
| Distributions made | 33 |
| Total distribution recipients | 227 |
| Existing leaderboards | 3 (slots 1, 3, 4) |
| Free slots | 2, 5-20 (17 slots open) |
| Active boosters | 3 (zaal Zora, ZAAL newsletter, Quotient default) |
| Leaderboard types available | 11 (was 5 in v2) |
| Refresh cooldown | 30 seconds |
| StakingLocker MAX_LOCK_DURATION | 315,360,000 seconds (10 years) |
| StakingLocker MAX_STAKES_PER_USER | 100 |
| Staking booster multiplier range | [1.1x, 5.0x], capped at +5x total |
| Default min stake | 100 tokens |
| Min stake WETH | 0.001 ETH |
| Min stake USDC | 1 USDC (6 decimals) |
| Native gas chain (writes) | owner pays - cheap on Base |
| Mainnet only | YES (Base 8453, Arbitrum 42161) |

---

## Sources

- [Empire Builder SKILL.md](https://www.empirebuilder.world/skill/SKILL.md) (latest, 2026-05-04)
- [Empire Builder skill/references/http-api.md](https://www.empirebuilder.world/skill/references/http-api.md) (1090 lines)
- [Empire Builder skill/references/workflows.md](https://www.empirebuilder.world/skill/references/workflows.md) (8 workflows)
- [Empire Builder skill/references/contracts.md](https://www.empirebuilder.world/skill/references/contracts.md) (SmartVault + StakingLocker ABI)
- [GitBook public API index](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public)
- [ZABAL Empire dashboard](https://empirebuilder.world/empire/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07) (live state used in this doc)
- [Songjam ZABAL leaderboard](https://songjam.space/zabal)
- [zabal.art creative hub](https://zabal.art/)
- [ZABAL AMA 2 transcript](https://alphagrowth.io/spaces/zabal-ama-2-rugged-twice-to-start) (distribution mode descriptions)

Verified URLs 2026-05-09: empirebuilder.world/skill/SKILL.md HTTP 200, /api/empires/0xbB48...0b07 returns full payload, /api/leaderboards?tokenAddress=0xbB48...0b07 returns 3 leaderboards, /api/boosters/0xbB48...0b07 returns 3 boosters.

---

## Also See

- [Doc 626 - Empire Builder + ZABAL POIDH airdrop architecture](../626-empire-builder-zabal-poidh-airdrop/) - the integration doc; this doc 627 is the empire-state + capability survey
- [Doc 625 - POIDH x ZAO bounty playbook](../../community/625-poidh-zao-bounty-playbook/)
- [Doc 584 - ZABAL Nexus link inventory](../584-zabal-nexus-link-inventory/) (if exists - referenced from 626)

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Stop blocking on yerbearserker / Adrian for POIDH leaderboard. Zaal owns the empire - he creates it himself via Empire Builder dashboard or signed API call | @Zaal | Self-serve | Today |
| Create slot-5 "BCZ YapZ Submitters" apiLeaderboard pointing to `bettercallzaal.com/poidh-leaderboard.json`, both booster toggles ON | @Zaal | Empire dashboard | Today |
| First ZABAL distribution to POIDH submitters: pick mode (recommend `weighted` since all scores = 1, equivalent to `even` for now), pick amount, sign owner-prepare, broadcast executeBatch, store | @Zaal | distribute-prepare flow | This week |
| Add SANG token booster (Adam's coin) for ZABAL ecosystem alignment - 3x at 100k SANG threshold | @Zaal | POST /api/boosters | Next week |
| Activate native staking on $ZABAL (`POST /api/empires/activate-staking`) and set up a stakers leaderboard with a 7d-lock 2x staking booster - increases ZABAL hold time | @Zaal | Activate + booster add | Month 1 |
| Spin up `/zao` Farcaster channel leaderboard (`farcasterChannelLeaderboards`) for weekly engagement-based ZABAL distribution | @Zaal | Leaderboard create | Month 1 |
| Add @bettercallzaal Farcaster interaction leaderboard for personal-brand activity rewards | @Zaal | Leaderboard create | Month 1 |
| Re-validate Empire Builder API surface in 30 days (skill is `latest` versioned, expected to evolve) | @Zaal | Doc update | 2026-06-09 |
| Investigate burn cadence - 178M already burned; consider quarterly burn schedule with public store-burn tracking for transparency | @Zaal | Strategy | Q2 |
