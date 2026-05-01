---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-01
related-docs: 361, 165
tier: STANDARD
---

# 582 - Empire Builder V3 Live (Soft Launch) + New Public API

> **Goal:** Capture what shipped in Empire Builder V3 on 2026-05-01 (soft launch from Adrian), document the new public API surface (especially the leaderboard endpoints whose signatures changed), and give ZAO OS a concrete plan to wire the new endpoints before Sunday's official announcement.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| V3 status | LIVE soft launch since 2026-05-01. Official announcement Sunday 2026-05-04. Treat the next 72 hours as bug-bash window for Adrian. |
| Site URL | USE `https://www.empirebuilder.world/` (canonical, www works). Doc 361's "no www" question is resolved. |
| API base | USE `https://empirebuilder.world/api/...`. No `www` on API host in any documented example. |
| Auth model | None on public reads. No API key, no headers required for any documented public endpoint. Treat as anonymous-rate-limited until Adrian confirms. |
| Leaderboard fetch | UPDATED signature. V2 conceptually keyed by token address; V3 keys by leaderboard UUID. Two-step flow now: 1) `GET /api/leaderboards?tokenAddress=<empire_id>` to discover slots 1-20, 2) `GET /api/leaderboards/<leaderboardId>` for entries. |
| Per-address stats | USE `GET /api/leaderboards/<leaderboardId>/address/<wallet>` for empireMultiplier replacement, returns `entry.points` (boost-adjusted) and `boosters[]` array. |
| ZAO OS today | NO direct API integration in `src/`. Only iframe embed at `src/app/(auth)/ecosystem/page.tsx`. SongJam-side `empireMultiplier` flows in via SongJam Worker, not directly from ZAO OS. |
| Doc 361 follow-ups | ANSWERED: distribute/burn API not in the public docs; only read endpoints are public. Write endpoints (distribute, burn, airdrop) still require Adrian for whitelisting. |
| Bug feedback to Adrian | DELIVER before Sunday: confirm `?tokenAddress=` discovery endpoint behaviour for ZABAL `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07`, confirm rate limits, confirm CORS for browser-side fetch from zaoos.com. |
| RaidSharks PR #165 V3 todos | UNBLOCK partially. Read endpoints are sufficient for leaderboard sync + multiplier display. Distribute remains manual via UI until Adrian opens write endpoints. |

## What Changed From Doc 361 (2026-04-15)

| Topic | Doc 361 Status | V3 Live Status (2026-05-01) |
|-------|----------------|-----------------------------|
| Public API access | Speculative, "ask Adrian after Farcon" | Live at `empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public` |
| Auth model | Open question | Documented as no-auth on public reads |
| Leaderboard fetch by token contract | Assumed | Replaced by two-step UUID flow |
| Distribute / burn / airdrop endpoints | "V3 will ship" | NOT in public docs. Read-only API only. |
| Webhook / event feed | Open question | Not documented as public. Assume polling for now. |
| iframe embed URL prefix | Open: `www.` or not? | `www.empirebuilder.world` works for the app site. |

## V3 Public API - Full Surface

All endpoints below are documented as public read-only. None list an auth header. None list a rate limit (assume polite usage, ask Adrian).

### Empires

| Endpoint | Path | Path/Query Params | Notes |
|----------|------|-------------------|-------|
| List empires | `GET /api/empires` | `type=top|native|recent`, `page` (default 1), `limit` (default 7) | Paginated list with filtering. |
| Single empire | `GET /api/empires/[empire_id]` | `empire_id` = base token address | Full empire metadata. |
| Search empires | `GET /api/empires/search` | `q`, `farcaster_name`, `page`, `limit` | Free-text + Farcaster lookup. |
| Empires by owner | `GET /api/empires/owner/[wallet_address]` | wallet | All empires owned by wallet. |
| Top empires | `GET /api/top-empires` | `page` (default 1), `limit` (default 20) | "Only empires with at least one USD distribution" included. Ordered by computed `rank` desc, `total_distributed` desc as tiebreaker. |

Example response shape for `/api/empires`:

```json
{
  "empires": [{
    "empire_address": "0x...",
    "base_token": "0x...",
    "name": "My Empire",
    "token_symbol": "EMP",
    "owner": "0x...",
    "rank": 95,
    "total_distributed": "1500000",
    "native": "yes",
    "farcaster_name": "myempire",
    "created_at": "2024-01-01T00:00:00Z"
  }],
  "totalCount": 142,
  "page": 1,
  "itemsPerPage": 10,
  "queryTime": 12.4
}
```

### Leaderboards (signature changed in V3)

| Endpoint | Path | Notes |
|----------|------|-------|
| Discover leaderboards for an empire | `GET /api/leaderboards?tokenAddress=<empire_id>` | Returns slots 1-20, pinned items first. Use to find UUIDs. |
| Get leaderboard entries | `GET /api/leaderboards/[leaderboardId]` | `leaderboardId` is a UUID. Blocked addresses excluded automatically. |
| Get single address stats | `GET /api/leaderboards/[leaderboardId]/address/[walletAddress]` | Returns `entry`, `boosters[]`, `leaderboard`. 404 if address not in leaderboard. |

Example entries response from `GET /api/leaderboards/<uuid>`:

```json
{
  "success": true,
  "leaderboard": {
    "id": "uuid",
    "empire_address": "0x...",
    "leaderboard_type": "tokenHolders",
    "name": "Top Holders",
    "leaderboard_number": 1
  },
  "entries": [
    {
      "address": "0xAlice...",
      "rank": 1,
      "score": 50000.0,
      "points": 90000,
      "farcaster_username": "alice",
      "totalRewards": 1200.50
    }
  ]
}
```

Field semantics (quoted directly from docs):

- `rank` - "Position in leaderboard (1 = top)"
- `score` - "Raw metric (token balance, NFT count, engagement count, etc.) - not boosted"
- `points` - "Boost-adjusted score used for weighted distribution weighting"
- `totalRewards` - "Lifetime USD received from the empire's distributions"

Example single-address response:

```json
{
  "success": true,
  "entry": {
    "address": "0xYourWallet",
    "rank": 12,
    "score": 15000.0,
    "points": 22500,
    "farcaster_username": "alice",
    "totalRewards": 450.25
  },
  "boosters": [
    {
      "type": "NFT",
      "contractAddress": "0xNFTContract",
      "multiplier": 1.5,
      "qualified": true,
      "requirement": { "minAmount": "1" }
    }
  ],
  "leaderboard": {
    "id": "uuid",
    "name": "Top Holders",
    "leaderboard_type": "tokenHolders",
    "leaderboard_number": 1
  }
}
```

`boosters[].qualified` reflects "current on-chain holdings at the time of the last leaderboard refresh" - not real-time.

### Boosters

| Endpoint | Path | Notes |
|----------|------|-------|
| Boosters for empire | `GET /api/boosters/[empire_id]` | `empire_id` = base token address or identifier. |

Booster fields: `id` (UUID), `type` (`NFT` | `ERC20` | `QUOTIENT`), `contractAddress`, `multiplier`, `requirement.minAmount`, `token_symbol`, `token_image_url`, `chainId`. NFT-specific: `nft_platform`, `nft_standard`.

### Rewards & Distributions

| Endpoint | Path | Notes |
|----------|------|-------|
| Reward summary | `GET /api/empire-rewards/[empire_id]` | Returns `empire_rewards`, `burned`, `airdrops` arrays (3 most recent each). |
| Rewards by type | `GET /api/empire-rewards/[empire_id]/[type]` | `type` = `distribute` | `burned` | `airdrop`. Returns `rewards[]` and `count`. |
| Distribution recipients by tx | `GET /api/rewards/recipients/[transactionHash]` | Returns `recipients[]` (address, farcaster_username, amount) and `count`. |
| Distribution records by recipient | `GET /api/distribution-records/[empireAddress]` | Maps recipient address to total USD received and last update timestamp. |

## Site Surface (visual confirmation)

Visited `https://www.empirebuilder.world/` 2026-05-01:

| Surface | Status |
|---------|--------|
| Home CTA "Build your empire" / "How it works" | Live |
| Nav: Migrate, Create | Live |
| Sections: Top Empires, New, Recently Added, Forged | Live |
| Auth: Log in | Live |
| Footer: Farcaster, X, Discord, Basescan, CoinGecko, Dune analytics, Blog | Live |
| Featured token | Glonkybot (Adrian's Clanker auto-deploy agent) on Base |

Tagline: "The complete journey infrastructure for creators, builders, and founders."

## ZAO OS Current Integration State (ground truth)

| Surface | File | What |
|---------|------|------|
| iframe embed | `src/app/(auth)/ecosystem/page.tsx:78` | Points at ZABAL Empire Builder profile. |
| Ecosystem panel link | `src/components/ecosystem/EcosystemPanel.tsx` | Surface link in app shell. |
| Portal destination entry | `src/lib/portal/destinations.ts` | Discovery target. |
| Middleware host allowlist | `src/middleware.ts` | CSP / iframe parent allowance. |
| Direct API client for Empire Builder | None | No code calls `empirebuilder.world/api/*` in `src/`. |
| RaidSharks pipeline | PR #165 (per memory `project_raidsharks_empire_builder.md`) | V3 todos parked - now partially unblocked for read-side. |
| `src/lib/respect/leaderboard.ts` | Local Respect leaderboard | NOT Empire Builder. Reads OG / ZOR ERC-1155 on Optimism. Different system. Do not conflate. |

## Action Bridge - Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Reply to Adrian's GM with V3 site smoke test results from `www.empirebuilder.world` | @Zaal or @Claude | Telegram reply | Before Sunday 2026-05-04 |
| Run discovery call `GET /api/leaderboards?tokenAddress=0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` and capture the slot-1..20 UUID list for ZABAL into the doc | @Claude (next session) | Curl + commit follow-up note to this doc | Before Sunday 2026-05-04 |
| Ask Adrian: rate limits, CORS policy for `zaoos.com`, write-endpoint timeline (distribute / burn / airdrop / webhook) | @Zaal | Telegram DM | Before Sunday 2026-05-04 |
| Build `src/lib/empire-builder/client.ts` thin read client wrapping the 7 read endpoints with Zod validation (no auth, just baseURL + retry) | @Claude | PR | After Adrian confirms rate limits |
| Wire SongJam-style empireMultiplier surface natively in ZAO OS by reading `entry.points / entry.score` ratio per ZABAL holder | @Claude | PR follow-up to above | After client lib lands |
| Reopen RaidSharks PR #165 V3 todos for the read-side; keep distribute manual via UI until write API opens | @Claude | PR comment update | When client lib lands |
| Update `src/components/respect/SongjamLeaderboard.tsx` to optionally pull empireMultiplier directly from V3 instead of via SongJam Worker (resilience) | @Claude | PR | After client lib lands |
| Resolve doc 361 open questions in that doc's frontmatter ("auth model", "leaderboard signature", "iframe URL prefix") and link forward to this doc | @Claude | Edit doc 361 | Same PR as this doc |
| Add `empire-builder.gitbook.io` and `empirebuilder.world` to `last-validated` recheck queue (high-churn vendor) | @Claude | Calendar / queue | Recheck 2026-05-29 |

## Open Questions for Adrian (Sunday window)

1. Are write endpoints (distribute, burn, airdrop) coming to the public API, or staying agent-callable / whitelisted only?
2. CORS: can a browser session at `zaoos.com` call `empirebuilder.world/api/*` directly, or do we need to proxy server-side?
3. Rate limits per IP / per token / per endpoint?
4. Webhooks for staking / burn / distribute events - polling only for now?
5. Custom branded ZABAL leaderboard inside Empire Builder (carryover from doc 361 Q7) - status?
6. iframe embed v3 URL: still the same `/empire/<token>` shape, or new path?
7. Is `empireMultiplier` exposed under `entry.points / entry.score` or under a separate field name we should read directly?

## Sources

- [Empire Builder public API index](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public)
- [Get Leaderboard By Empire](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public/get-leaderboard-by-empire)
- [Get Leaderboard Stats for Single Address](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public/get-leaderboard-stats-for-single-address-within-empire)
- [Get Empires](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public/get-empires)
- [Get Top Empires](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public/get-top-empires)
- [Get Boosters By Empire](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public/get-boosters-by-empire)
- [Get Empire Rewards](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public/get-empire-rewards)
- [Get Distribution Records](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public/get-distribution-records)
- [Empire Builder home](https://www.empirebuilder.world/)
- Internal: `research/business/361-empire-builder-deep-dive-v3-integration/README.md`
- Internal: `src/app/(auth)/ecosystem/page.tsx`, `src/components/respect/SongjamLeaderboard.tsx`, `src/lib/portal/destinations.ts`

## Also See

- [Doc 361](../361-empire-builder-deep-dive-v3-integration/) - V3 anticipation doc, this doc supersedes its open questions
- Memory: `project_raidsharks_empire_builder.md` - PR #165 V3 todos partially unblocked by this research

## Staleness Notes

- Public API docs do not list rate limits, CORS, or auth requirements. These were not documented at fetch time on 2026-05-01. Confirm with Adrian before relying in production.
- "V3" badge is implicit (the docs page is the new public API; doc 361 referred to V3 features pre-launch). Adrian's Telegram message of 2026-05-01 is the only formal "V3 live" confirmation found.
- Recheck on 2026-05-29 or sooner if Adrian announces write endpoints.
