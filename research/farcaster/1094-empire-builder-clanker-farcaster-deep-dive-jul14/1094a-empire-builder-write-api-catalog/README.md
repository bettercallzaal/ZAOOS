---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-07-14
related-docs: 991, 582, 583, 361, 584, 1088, 1092, 1094
original-query: "Empire Builder's full WRITE API surface beyond what's now known (deploy-empire-tokenless, deploy-new-token-with-empire, deploy-empire-for-existing-token) - specifically the exact request/response shape for: attach-token-to-tokenless-empire, add/remove boosters, add/remove staking boosters, activate staking, create/delete leaderboards, refresh leaderboards, store distributions/burns/airdrops, prepare distributions. Also confirm auth model and rate limits."
tier: DEEP
---

# 1094a - Empire Builder's full authenticated (write) API catalog

> **Goal:** Catalog every documented Empire Builder write endpoint - field-by-field request/response shapes - so zaalcaster (and any future ZAO OS integration) can build against it without guessing. This is the direct sequel to doc 1092's discovery that a "deploy tokenless empire" write endpoint exists and is documented in Empire Builder's gitbook, not just partner-whispered.

## Key Decisions

| # | Decision | Recommendation | Reasoning |
|---|----------|----------------|-----------|
| 1 | Is the write API safe to build zaalcaster's Phase 2b (booster engine) against | YES for boosters/staking/leaderboards - all 15 endpoints are publicly documented with full field-level specs, not partner-secret | Confirmed live 2026-07-14: `/api/authenticated/*` section is public gitbook content, reachable without any partner relationship. zaalcaster's own `EMPIRE_BUILDER_API_KEY` (Adrian-issued, PR #91) is the only credential needed. |
| 2 | The "attach a token to a tokenless empire" endpoint Adrian offered on the 2026-07-14 call (doc 1092) | STILL NOT in public docs - treat as the private endpoint Adrian promised, not a documented one | Checked every plausible slug (`attach-token`, `attach-token-to-empire`, `deploy-token-with-empire`) - all 404. The two-step "deploy new token with empire" flow (`/api/get-token-config` then `/api/deploy-empire`) creates a NEW token; it does not attach an EXISTING one, so it can't substitute for what Adrian offered. |
| 3 | Auth model | `x-api-key` header on every endpoint, with ONE exception | Delete Leaderboard additionally requires `x-wallet-address` header matching the signer. Every other endpoint is `x-api-key` + a body-level EIP-191 `signature`/`message`/`signer` triple. |
| 4 | Rate limits | UNDOCUMENTED - do not assume any specific number, build with backoff/retry regardless | No rate-limit language found anywhere in the authenticated docs section, the API overview, or "how empires work" pages. Same finding as doc 582 (public reads) in May - Empire Builder simply doesn't publish limits. |
| 5 | Leaderboard refresh cooldown | 30 seconds per leaderboard, HTTP 429 if violated | The one concrete rate-limit-shaped constraint found in the whole authenticated API - documented specifically on the refresh-leaderboard-by-empire page, not a general API limit. |
| 6 | Activate-staking replay protection | Message must embed a millisecond Unix `timestamp`; server rejects signatures older than 5 minutes | Prevents a captured signature from being replayed later - the only endpoint with this pattern; other endpoints don't time-bound their signed messages. Worth adopting this pattern if zaalcaster ever builds its own signed-message flows beyond what Empire Builder requires. |

## Findings: the 15 authenticated endpoints

All endpoints require `x-api-key: <key>` + `Content-Type: application/json` unless noted. All write actions that mutate empire state (not just store/refresh) require an EIP-191 `personal_sign` signature over an exact message string, following the same pattern doc 1092/zaalcaster PR #91 already implements for `deploy-empire-tokenless`.

### Empire creation (3 endpoints)

| Endpoint | Method + Path | Notes |
|----------|--------------|-------|
| Deploy Tokenless Empire | `POST /api/deploy-empire-tokenless` | Already fully specified in doc 1092 / zaalcaster's `empire.js`. `mode: 'custom'\|'farcaster'`, `owner`, `name`, `bio?`, `logoUri?`, `fid?`, `farcasterUsername?`, `signature`, `message`. |
| Deploy New Token with Empire | Two-step: `POST /api/get-token-config` then `POST /api/deploy-empire` | Step 1 builds a Clanker token config (name, symbol, image, creator address, pool/fee type, vault %, airdrop config, sniper-fee protection) and returns a `tokenConfig` object + optional `airdropTree`. Step 2 registers the resulting deployed token as an empire (`baseToken`, `clankerVersion: 'clanker_v4'`, `txHash`, `chainId`). This is a TOKEN LAUNCH flow, not an attach flow - it deploys a brand new Clanker token AND wraps it as an empire in one guided sequence. |
| Deploy Empire for Existing Token | `POST /api/deploy-empire` | For a token that ALREADY exists on-chain (not freshly deployed via step 1 above): `baseToken`, `name`, `owner`, `chainId` (8453 Base / 42161 Arbitrum), `tokenInfo {symbol, name, logoURI}`, `signature`, `message`, optional `empireMetadata {bio, website_url, twitter_url, warpcast_url}`. This is the closest documented thing to "attach a token to an empire" - but it CREATES a new empire wrapping the token, it does not attach a token to an EXISTING tokenless empire (see Key Decision #2). |

### Boosters (4 endpoints)

| Endpoint | Method + Path | Notes |
|----------|--------------|-------|
| Add Booster | `POST /api/boosters/[empire_id]` | `booster.type: 'NFT'\|'ERC20'\|'QUOTIENT'`, `contractAddress`, `multiplier` (1.1-5.0), `requirement.minAmount`, `chainId` (default 8453), `tokenId` (null unless ERC-1155). Plus `signer`/`signature`/`message` and a `tokenInfo` block for display. Recommended message: `"Add booster for empire id [empire_id]"`. |
| Remove Booster | `DELETE /api/boosters/[empire_id]` | `boosterId` (UUID, from the public `GET /api/boosters/[empire_id]` - already used in zaalcaster's `getEmpireBoosters`), `signer`, `signature`, `message`. |
| Add Staking Booster | `POST /api/staking-boosters/[empire_id]` | `minStake` (wei string, 18-decimal), `minLockupSeconds` (0 to 315,360,000 - i.e. up to 10 years), `multiplier` (1.1-5.0, max 1 decimal), `signer`/`signature`/`message` = `"Add staking booster for empire id <empire_id>"`. |
| Remove Staking Booster | `DELETE /api/staking-boosters/[empire_id]` | `boosterId` (UUID), `signer`/`signature`/`message`. |

### Staking activation (1 endpoint, has a paired public GET)

| Endpoint | Method + Path | Notes |
|----------|--------------|-------|
| Activate Staking | `POST /api/empires/activate-staking` | `tokenAddress` (empire id), `signer`, `signature`, `timestamp` (ms Unix, server rejects if >5 min old). Message: `"Activate staking for empire <empire_id_lowercase> at <timestamp>"`. Success response includes `stakingToken`, `chainId`, and a `leaderboardId` for an AUTO-CREATED stakers leaderboard - activating staking silently gives you a new leaderboard slot. Idempotent: re-activating returns `{success:true, alreadyActive:true}` instead of erroring. Companion public read: `GET /api/empires/activate-staking?tokenAddress=<empire_id>` -> `{staking_activated, stakingToken, chainId}`. |

### Leaderboards (3 endpoints, 9 leaderboard-type variants)

| Endpoint | Method + Path | Notes |
|----------|--------------|-------|
| Create Leaderboard | `POST /api/leaderboards/{type}Leaderboards` | 9 type-specific paths: `tokenHolders`, `stakers`, `nft`, `api`, `csv` (multipart/form-data), `farcasterCast`, `farcasterChannel`, `farcasterInteraction`, `farToken`. Common fields: `tokenAddress` (empire id), `name` (max 20 chars), `description` (max 180 chars), `applyBoosters`, `apply_reputation_boosters`, plus `signature`/`message`/`signerAddress`. Type-specific fields vary (e.g. token-holders needs `erc20Address`/`erc20ChainId`/`erc20Name`/`erc20Symbol`/`erc20ImageUrl`) - **this doc did not fully enumerate the other 8 types' unique fields**; flagged for a follow-up fetch if zaalcaster builds a leaderboard-creation UI. |
| Delete Leaderboard | `DELETE /api/leaderboards/delete?leaderboardId=[uuid]` | The ONE endpoint needing `x-wallet-address` header in addition to `x-api-key` - must match the `signerAddress` in the body. |
| Refresh Leaderboard By Empire | `PATCH /api/leaderboards/refresh/{leaderboardTypeEndpoint}` | `leaderboardId`, `tokenAddress`. 30s cooldown per leaderboard (429 if violated - see Key Decision #5). Response includes `entriesUpdated` count and `refreshedAt` ISO timestamp. |

### Rewards + distribution (4 endpoints)

| Endpoint | Method + Path | Notes |
|----------|--------------|-------|
| Store Distribution | `POST /api/store-distribution` | Records an ALREADY-EXECUTED on-chain distribution: `transactionHashes` (array of `{hash, chainId}`), `empireAddress` (SmartVault, distinct from empire id), `baseToken`, optional `distributionMode` (`even`\|`weighted`\|`raffle`), `leaderboardType`/`leaderboardNumber`. Response reports `totalUsdDistributed`, per-recipient breakdown, and how many tx hashes were skipped as already-recorded or too-old. |
| Store Burn | `POST /api/store-burn` | `transactionHash`, `empireAddress`, optional `chainId` (default 8453). Response includes running `total_burned`. |
| Store Clanker Airdrop | `POST /api/store-airdrop` | `tokenAddress`, `tokenName`, `tokenSymbol`, `creatorAddress`, `airdropEntries` (array of `{address, amount}` - amounts >0.1 rounded to 1, <=0.1 zeroed, an odd-sounding but explicit documented rule worth double-checking against a real payload before relying on it), `deploymentTxHash`, optional `merkleRoot`/`airdropContractAddress`/`lockupDays`/`vestingDays`. |
| Prepare Distribute | `POST /api/distribute-prepare` | The one write-shaped endpoint that returns UNSIGNED transaction data rather than executing anything: `treasuryAddress`/`empireAddress`, `baseToken`, `selectedTokenAddresses` (which ERC-20s in the vault to distribute), `distributionMode`, `leaderboardId`, `distributePercentage` (0-100), `recipientCount`, `raffleWinnerCount` (raffle mode), `signature`/`message`/`signer` (must be the vault owner). Returns per-chain `transactions[]` (contract address + calldata) for the CALLER to actually submit on-chain - this is a "prepare" step, not an execute step. Notably: "no session, no Redis, no transaction credit charge on this route" per their own docs, implying other routes DO consume some kind of credit/quota that isn't otherwise documented (see Honest Unknowns). |

## Honest Unknowns

1. **Rate limits / API credits**: the Prepare Distribute page's aside about "no transaction credit charge on THIS route" implies other routes have a credit system Empire Builder doesn't otherwise document. Ask Adrian directly rather than assuming.
2. **The attach-token-to-tokenless-empire endpoint**: confirmed absent from public docs as of 2026-07-14. Still pending from Adrian per doc 1092's action item.
3. **Leaderboard type-specific fields**: only `tokenHolders` was fully captured; the other 8 leaderboard-creation types (`stakers`, `nft`, `api`, `csv`, `farcasterCast`, `farcasterChannel`, `farcasterInteraction`, `farToken`) need their own field-by-field fetch before building a leaderboard-creation UI.
4. **Airdrop amount-rounding rule** ("amounts >0.1 rounded to 1, <=0.1 set to 0") reads like a documentation typo or a very specific dust-handling rule - verify against a real test call before trusting it in production code.

## What's Genuinely New Since Doc 1092 (2026-07-14, earlier same day)

Doc 1092 established that ONE write endpoint (`deploy-empire-tokenless`) exists and is documented. This research found the OTHER 14 - the full authenticated section was there all along, just not previously read end-to-end. Nothing here contradicts doc 1092; it's a straight extension.

## Also See

- [Doc 1092](../../1092-zaal-adrian-empire-builder-deep-dive-jul14/) - the call that found the first write endpoint and the profile-permanence warning.
- [Doc 1094](../) - hub doc synthesizing this + Clanker v5 + Farcaster protocol research.
- zaalcaster PR #91 (`bettercallzaal/zaalcaster`) - the only endpoint from this catalog currently implemented in code (`deploy-empire-tokenless`).

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|-------------------|
| Fetch the remaining 8 leaderboard-creation type schemas before building any leaderboard-creation UI in zaalcaster | @Zaal | Research | 2026-07-21 | Follow-up doc or PR updating this catalog with all 9 types' fields |
| Ask Adrian directly about rate limits / API credit system (Prepare Distribute's aside implies one exists) | @Zaal | Investigate | 2026-07-21 | Answer captured in a memory update or this doc |
| Build zaalcaster's booster-management UI (add/remove booster + staking booster) against this catalog | @Zaal | PR | 2026-07-28 | PR opened in bettercallzaal/zaalcaster following the empire.js write-function pattern from PR #91 |

## Sources

- [Empire Builder authenticated API index](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated) [FULL]
- [Deploy Tokenless Empire](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/deploy-tokenless-empire) [FULL]
- [Deploy New Token with Empire](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/deploy-new-token-with-empire) [FULL]
- [Deploy Empire for Existing Token](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/deploy-empire-for-existing-token) [FULL]
- [Add Booster](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/add-booster) [FULL]
- [Remove Booster](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/remove-booster) [FULL]
- [Add Staking Booster](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/add-staking-booster) [FULL]
- [Remove Staking Booster](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/remove-staking-booster) [FULL]
- [Activate Staking](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/activate-staking) [FULL]
- [Create Leaderboard](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/create-leaderboard) [FULL - token-holders type only, other 8 types PARTIAL, see Honest Unknowns]
- [Delete Leaderboard](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/delete-leaderboard) [FULL]
- [Refresh Leaderboard By Empire](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/refresh-leaderboard-by-empire) [FULL]
- [Store Distribution](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/store-distribution) [FULL]
- [Store Burn](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/store-burn) [FULL]
- [Store Clanker Airdrop](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/store-clanker-airdrop) [FULL]
- [Prepare Distribute](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/authenticated/prepare-distribute) [FULL]
- Attempted (attach-token endpoint search): `.../api/authenticated/attach-token`, `.../attach-token-to-empire`, `.../deploy-token-with-empire`, `.../smart-contracts/empire-factory` [FAILED - all 404, confirms Key Decision #2]
