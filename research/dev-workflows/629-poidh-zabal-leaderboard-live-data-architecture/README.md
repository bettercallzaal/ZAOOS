---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-09
related-docs: 628, 627, 626, 625
tier: STANDARD
---

# 629 - POIDH x $ZABAL live leaderboard hub - data sources, free APIs, page architecture

> **Goal:** Document the three free data sources that power `bettercallzaal.com/poidh.html` (now the canonical UI for slot 8 of the $ZABAL Empire). Capture the response shapes, the merge logic, and the gallery rendering pattern so future iterations or other empires can copy the architecture in an hour.

> **Trigger:** Zaal asked to clean up the BCZ page into a real leaderboard hub showing submissions + socials of submitters. Doc 628 covered the meta-process; this doc covers the live-data pipeline.

> **Confirmed live 2026-05-09:** Slot 8 "POIDH Submitters" apiLeaderboard on the $ZABAL Empire (uuid `7b8e8dfa-529d-48ad-8c9b-bdb45cc35187`) is wired to BCZ's JSON feed. EB has already distributed 13.35 ZABAL across 10 unique submitters from Round 1.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Data merging strategy** | Fetch from three sources during refresh, merge into ONE rich JSON file (`poidh-claims.json`) consumed by the page in a single fetch. Avoids runtime CORS issues + multiple browser round-trips. Refresh runs server-side (Zaal's laptop) on demand or via cron. |
| **EB read endpoint = free authoritative leaderboard** | `GET https://www.empirebuilder.world/api/leaderboards/<uuid>` returns rank + score + boost + totalRewards + farcaster_username per address. No API key. This is the source of truth for ranking + ZABAL distributions. |
| **web3.bio = free profile resolver** | `GET https://api.web3.bio/profile/<address>` returns FC handle + display name + avatar + X handle + bio + follower count. No auth, no rate limit hit during normal use. Fills the gaps EB doesn't (avatars, X handles). |
| **POIDH tRPC = free claim/bounty data** | `https://poidh.xyz/api/trpc/<router>.<procedure>` exposes bounties + claims. Use `claims.fetchBountyClaims` for the gallery (each item has `url` = image URL, `description` = often the original post URL, `title`, `isAccepted`). |
| **Page renders from one static JSON** | `poidh-claims.json` is the sole runtime fetch. Static, cacheable, no CORS issues, fast first paint. Refresh script regenerates on demand. |
| **Avatar fallback = dicebear identicon** | When `web3.bio` returns null avatar (rare), fall back to `https://api.dicebear.com/7.x/identicon/svg?seed=<address>`. Free, deterministic, branded. |
| **Image fallback = hide on error** | POIDH IPFS URLs (`*.mypinata.cloud/ipfs/...`) occasionally 404. Use `onerror="this.style.display='none'"` to gracefully hide. Cards still show title + handle. |
| **Action: turn on booster toggles** | Slot 8 leaderboard currently has `apply_boosters: false`, `apply_reputation_boosters: false`, `apply_staking_boosters: false`. ZABAL/SANG/ZORO holders + high-rep submitters are NOT getting amplified yet. Zaal should toggle these ON via Empire dashboard or via `POST /api/leaderboards/refresh/apiLeaderboards` with the right body. |
| **Action: aggregate empire-wide rewards** | EB returns `totalRewards` per address - that's lifetime ZABAL across the WHOLE empire, not just from this leaderboard. We display it as-is, but note in copy that it includes all distributions. |
| **Refresh cadence** | Zaal runs `python3 scripts/refresh-poidh-leaderboard.py` on demand. For higher cadence: Cloudflare Worker on 5-min cron, KV cache, edge response. Static script suffices until > 100 submitters. |

---

## Part 1 - Three Free Data Sources (Verified)

### A. Empire Builder live leaderboard read

```
GET https://www.empirebuilder.world/api/leaderboards/<uuid>
```

No API key. Response shape:

```json
{
  "success": true,
  "leaderboard": {
    "id": "7b8e8dfa-529d-48ad-8c9b-bdb45cc35187",
    "base_token": "0xbb48f19b0494ff7c1fe5dc2032aeee14312f0b07",
    "empire_address": "0xe0faa499d6711870211505bd9ae2105206af1462",
    "name": "POIDH Submitters",
    "description": "Submit to ZAO POIDH bounties to climb. ZABAL distributed by score.",
    "leaderboard_number": 8,
    "leaderboard_type": "api",
    "api_endpoint": "https://bettercallzaal.com/poidh-leaderboard.json",
    "apply_boosters": false,
    "apply_reputation_boosters": false,
    "apply_staking_boosters": false,
    "last_refreshed_at": "2026-05-09T21:25:28.564+00:00",
    "upgraded": true
  },
  "entries": [
    {
      "address": "0x5dc697f2799bd232cad2d479c379ff305b699f9b",
      "rank": 1,
      "score": 1,
      "boost": 1,
      "farcaster_username": "pascaline",
      "x_name": null,
      "totalRewards": 4.254089648089822
    },
    ...
  ]
}
```

**Key fields per entry:**

| Field | Meaning | Notes |
|-------|---------|-------|
| `address` | Wallet (lowercase) | The empire's identity for that user |
| `rank` | Position 1-N | Pre-sorted by EB |
| `score` | Raw metric from API feed | Our `[{address, score}]` value |
| `boost` | Multiplier currently applied | `1` = no boost (booster toggles OFF) |
| `farcaster_username` | EB-resolved handle | Free FC resolution baked into EB |
| `x_name` | EB-resolved X handle | Often null - use web3.bio supplement |
| `totalRewards` | Lifetime ZABAL distributed to this address from this empire | Across ALL distributions, not just this leaderboard |

### B. web3.bio profile resolver

```
GET https://api.web3.bio/profile/<address>
```

No auth, no rate-limit at our usage levels. Returns array; first entry usually `farcaster` platform.

```json
[{
  "address": "0xa34514c2150029afa4d37577daee301166105355",
  "identity": "cryptfi-mariano",
  "platform": "farcaster",
  "displayName": "J'Mariano",
  "avatar": "https://imagedelivery.net/.../rectcrop3",
  "description": "I make videos— telling Onchain stories | here for DAO communities & CM",
  "links": {
    "farcaster": { "link": "https://farcaster.xyz/cryptfi-mariano", "handle": "cryptfi-mariano" },
    "twitter":   { "link": "https://x.com/cryptfi_mariano",      "handle": "cryptfi_mariano" }
  },
  "social": { "uid": 872568, "follower": 1718, "following": 893 }
}]
```

**Key fields:**

| Field | Use for |
|-------|---------|
| `identity` | Farcaster handle (sometimes a fallback when EB's `farcaster_username` is null) |
| `displayName` | Human-readable name on cards |
| `avatar` | Profile pic URL (use directly in `<img src>`) |
| `description` | Bio (optional hover text) |
| `links.farcaster.link` | Direct profile URL |
| `links.twitter.handle` + `.link` | X handle - **fills EB's null `x_name`** |
| `social.uid` | Farcaster FID |
| `social.follower` | Audience size (for sort/feature decisions) |

### C. POIDH tRPC

```
https://poidh.xyz/api/trpc/<router>.<procedure>?batch=1&input=<urlencoded>
```

Procedures used by the BCZ refresh script:

| Procedure | Input | Returns |
|-----------|-------|---------|
| `bounties.fetch` | `{id, chainId}` | Bounty + `extra.album` |
| `claims.fetchBountyClaims` | `{bountyId, chainId, limit}` | Claim list per bounty |

**Per-claim fields useful for the gallery:**

| Field | Meaning |
|-------|---------|
| `id` | POIDH-internal claim id (used in claim URL: `poidh.xyz/base/bounty/<bid>/claim/<id>`) |
| `onChainId` | Smart contract id (different from `id`) |
| `issuer` | The wallet that submitted the claim |
| `title` | Submitter's claim title (the "what they made" summary) |
| `description` | Often contains the original post URL (X/IG/YT link) |
| `url` | Image URL on POIDH's IPFS gateway (`*.mypinata.cloud/ipfs/...`) |
| `isAccepted` | Winner flag - `true` once issuer accepts |
| `bountyId` | Parent bounty |

---

## Part 2 - The Merge Logic

```
For each bounty (1151, 1166, ...):
    fetch bounty meta + claims via POIDH tRPC
    track unique submitter addresses (excl. issuer)

Fetch live leaderboard from EB by uuid
    -> get rank + boost + totalRewards + farcaster_username per address

For each unique submitter:
    fetch web3.bio profile
    -> get avatar + displayName + twitter_handle + follower count

Merge:
    For each address in unique_order:
        merge { eb fields } + { web3.bio fields } -> one row

Output:
    poidh-leaderboard.json   = strict EB feed [{address, score}]
    poidh-claims.json        = rich page data (bounties + claims + leaderboard)
    poidh-audit.json         = audit trail for verification
```

The merge order matters: EB data first (authoritative for rank + rewards), web3.bio fills gaps (avatar, X handle).

---

## Part 3 - Page Architecture

### One JSON, three views

```
poidh-claims.json (single fetch)
    │
    ├─→ Stats row    (totals.unique_submitters, total_zabal_distributed, etc.)
    │
    ├─→ Live leaderboard table
    │     For each leaderboard[] entry:
    │       avatar (web3.bio) + handle (EB or web3.bio) + rank + score + ZABAL + boost
    │       Plus inline FC / X / Basescan links
    │
    └─→ Submissions gallery
          For each claims[] entry:
            image (POIDH IPFS) + bounty badge + winner badge
            title + submitter avatar/handle (joined via address)
            "post" link (extracted from description) + "claim" link
```

### CSS approach

Reused BCZ's existing dark palette:
- `--zabal: #a78bfa` (purple) for the empire-distributed metric
- `--gold: #f5c842` for ETH escrow + winner badges
- `--cyan: #00e5ff` for live actions + score
- `--orange: #ff6b35` for section labels

Three layout patterns:

| Section | Layout |
|---------|--------|
| Stats | `grid-template-columns: repeat(4, 1fr)` desktop, `repeat(2, 1fr)` mobile |
| Bounty strip | Two cards side-by-side, stack on mobile |
| Leaderboard table | `grid-template-columns: 50px 1fr 80px 110px 90px` (rank · who · score · zabal · boost) |
| Gallery | `repeat(auto-fill, minmax(260px, 1fr))` - responsive without breakpoints |

### Failure-mode handling

| Failure | Mitigation |
|---------|-----------|
| EB endpoint down | Refresh script logs `WARN`, falls back to empty entries - leaderboard renders without rank/boost/rewards but still shows submitters |
| web3.bio profile null | Fall back to dicebear identicon avatar + truncated address as displayName |
| POIDH IPFS image 404 | `onerror="this.style.display='none'"` hides image; card still shows title + submitter |
| `description` lacks a URL | "post" link omitted; "claim" link still works |
| `farcaster_username` null in BOTH sources | Show truncated address as the handle |

---

## Part 4 - First Run Results (2026-05-09)

### Resolved submitter list (Round 1)

| Rank | Address | FC handle | ZABAL distributed | Boost |
|------|---------|-----------|-------------------|-------|
| 1 | `0x5dc697...9f9b` | @pascaline | 4.25 | 1.00x |
| 2 | `0x388e3d...24ff` | @noniwontmiss | 1.00 | 1.00x |
| 3 | `0x6dce11...6953` | @joeyofdeus | (resolving) | 1.00x |
| 4 | `0xaa2483...ea00` | @0xcollinxweb3 | (resolving) | 1.00x |
| 5 | `0xa34514...5355` | @cryptfi-mariano | (resolving) | 1.00x |
| 6 | `0x21422b...49cf` | @junyboy.eth | (resolving) | 1.00x |
| 7 | `0x34da76...a7e9` | @cheeka | (resolving) | 1.00x |
| 8 | `0x94652e...eaf6` | @megajayar.eth | (resolving) | 1.00x |
| 9 | `0xc4ba38...d25c` | @tashin | (resolving) | 1.00x |
| 10 | `0x0fbf06...25bc` | @watchcoin | (resolving) | 1.00x |

(Lower-ranked entries' totalRewards distributed equally before ranking diverged - pascaline got first-round flush.)

### Totals

| Metric | Value |
|--------|-------|
| Unique submitters across both rounds | 10 |
| Total claims | 11 (one wallet 2x in Round 1, score still 1) |
| Bounties tracked | 2 (1151 won, 1166 live) |
| Total ETH in escrow | 0.0165 |
| Total ZABAL distributed (lifetime, all-empire) | 13.35 |

---

## Part 5 - Booster Toggles Are OFF (Action Item)

Looking at `eb.leaderboard.apply_*_boosters`:

```json
"apply_boosters": false,
"apply_reputation_boosters": false,
"apply_staking_boosters": false
```

This is why every entry shows `boost: 1` (no multiplier). Zaal created the leaderboard with all three toggles OFF (or EB defaulted them).

**To turn them on (one of two paths):**

1. **Empire dashboard UI** - open the leaderboard, edit, flip Token Boosters + Reputation Boosters toggles to ON, save. UI signs the update tx.
2. **API call (advanced)**: `POST /api/leaderboards/refresh/apiLeaderboards` won't toggle these; need a separate update endpoint or recreate the leaderboard with the toggles on. The cleanest path is the UI.

Once flipped, the existing 3 boosters take effect:
- `zaal` Zora coin holders (>= 1M zaal) get 5x
- `ZAAL` newsletter token holders (>= 1M ZAAL) get 5x
- Quotient reputation booster scales by reputation tier

This makes Round 2 winners way more rewarding for active ecosystem holders.

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Slot used on $ZABAL Empire | 8 |
| Leaderboard UUID | `7b8e8dfa-529d-48ad-8c9b-bdb45cc35187` |
| Empire ID | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` |
| SmartVault | `0xe0faa499d6711870211505bd9ae2105206af1462` |
| API hook URL | `https://bettercallzaal.com/poidh-leaderboard.json` |
| Page hub URL | `https://bettercallzaal.com/poidh.html` |
| Rich data URL | `https://bettercallzaal.com/poidh-claims.json` |
| EB last refresh | 2026-05-09 21:25 UTC |
| Booster toggles | All OFF (action: turn on Token + Reputation) |
| Free APIs used | 3 (EB, web3.bio, POIDH tRPC) |
| API keys required | 0 |
| Page first-paint | < 200ms (single JSON fetch) |
| Total ZABAL distributed | 13.35 |
| Submitters resolved with FC handle | 10 / 10 (100%) |
| Submitters resolved with X handle | TBD (web3.bio coverage varies) |
| Submitters resolved with avatar | 10 / 10 (with dicebear fallback) |

---

## Sources

- [Empire Builder leaderboard live read](https://www.empirebuilder.world/api/leaderboards/7b8e8dfa-529d-48ad-8c9b-bdb45cc35187) - confirmed working 2026-05-09
- [web3.bio profile API](https://api.web3.bio/profile/0xa34514c2150029afa4d37577daee301166105355) - confirmed working
- [POIDH tRPC](https://poidh.xyz/api/trpc/) - confirmed working (no API key)
- [Empire Builder SKILL.md](https://www.empirebuilder.world/skill/SKILL.md) (lastUpdated 2026-05-04)
- BCZ live: `bettercallzaal.com/poidh.html` + `/poidh-claims.json` + `/poidh-leaderboard.json`
- Doc 627 (ZABAL Empire ground truth) - same uuid + ownership confirmed there
- Doc 628 (multi-hour learning capture) - earlier session that produced the static-feed version

Verified URLs 2026-05-09: all three free APIs returned valid JSON. EB endpoint requires no key; web3.bio rate-limit not hit at < 20 calls/run; POIDH tRPC public.

---

## Also See

- Doc 628 - Bounty-writing + integration learnings (the meta heuristics doc)
- Doc 627 - $ZABAL Empire ground truth + EB v3 capabilities
- Doc 626 - Empire Builder + ZABAL POIDH airdrop architecture
- Doc 625 - POIDH x ZAO bounty playbook

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Turn on Token Boosters + Reputation Boosters toggles for slot 8 leaderboard via Empire dashboard | @Zaal | UI signed action | This week |
| Run `python3 scripts/refresh-poidh-leaderboard.py` after Round 2 submissions land + after Round 1 winner is accepted on POIDH | @Zaal | One command | Ongoing |
| Validate web3.bio coverage for X handles - if low, swap to a Neynar v2 free-tier `bulk-by-address` lookup with 1 free API key | @Zaal | API swap if needed | Phase 2 |
| Move refresh to a Cloudflare Worker on 5-min cron when leaderboard > 100 submitters or auto-refresh becomes valuable | @Zaal | Worker port | When traffic warrants |
| Add per-bounty filter UI to the gallery (chip toggles for Round 1 / Round 2) once Round 2 has 5+ claims | @Zaal | Page enhancement | Late May |
| Consider adding a "Round leaderboard" view (filter by single bounty) alongside the all-rounds aggregate | @Zaal | Page enhancement | Round 3 onward |
| Re-validate this doc + EB API surface in 30 days | @Zaal | Doc update | 2026-06-09 |
