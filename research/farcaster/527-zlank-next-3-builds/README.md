---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-04-25
related-docs: 295, 489, 498, 500, 505
tier: STANDARD
---

# 527 — Zlank Next: Top 3 Builds Post-FarHack

> **Goal:** Pick what Zlank ships next now that v1 (14 blocks, polls, multi-page, zlank.online live) is in for FarHack 2026. Three builds in priority order, grounded in current Snap protocol surface, ZAO ecosystem leverage, and creator monetization paths that exist today.

## Key Decisions (Top of File)

| Rank | Build | Why now | Difficulty (1-10) | First user value |
|------|-------|---------|-------------------|------------------|
| 1 | **Token-gated blocks** (FID -> address -> balance check, then conditional render) | No competing Snap builder ships this. Lets ZAO holders, ZABAL holders, any Base-chain creator show different content per audience tier. Uses POST loop already wired. | 5 | Holders see exclusive content; non-holders see upsell |
| 2 | **One-click coin launch from Zlank** (Zora Coins SDK first, Empire Builder API behind a flag) | Every published Snap can mint a creator coin in the same flow. Recursive: each Snap promotes its own coin via `swap_token` action which is already in the snap-spec catalog. Ties Zlank into Zaal's "agents launch coins" thesis. | 6 | Creator coin live + buy button inside the Snap on first publish |
| 3 | **Live leaderboard block + persistent state** (KV-backed counter that POST-refreshes) | Built on infra Zlank already has (Redis vote tallies). Generalizes to: top voters, top tippers, top streamers. Stateful Snaps are a FarHack judging signal per Snap docs beta note. | 4 | Polls already do this; leaderboard expands to any tally + supports a "you are #N" personalization |

Skip until later: NFT mint flow (mint UX still messy), inline music (no audio element in Snap catalog, only image+open_url workaround), AI-generated text blocks (no clear creator value vs cost).

---

## Step 2 — Codebase grounding

| File | What's there |
|------|-------------|
| `/Users/zaalpanthaki/Documents/zlank/lib/blocks.ts` | 14 block types defined, Zod-style clamp functions |
| `/Users/zaalpanthaki/Documents/zlank/lib/snap-spec.ts` | Block-to-element mapping; auto-appends `zlank.online` footer |
| `/Users/zaalpanthaki/Documents/zlank/app/api/snap/[encoded]/route.ts` | GET/POST handlers; POST parses JFS via `@farcaster/snap` `parseRequest`, recordVote on `vote_X` input |
| `/Users/zaalpanthaki/Documents/zlank/lib/kv.ts` | node-redis client, `recordVote` uses `HINCRBY` + 30-day TTL — same pattern usable for any tally/leaderboard |
| `/Users/zaalpanthaki/Documents/zlank/lib/templates.ts` | 8 starter templates |

ZAO OS side:
- `src/lib/agents/types.ts` already defines tokens + contract addrs (ZABAL, ZOR) — token-gated blocks can reuse
- `community.config.ts` carries admin FIDs + community wallet — gating logic should pull from same source

---

## Build 1 — Token-gated blocks

### What it is
Block-level visibility flag: `gate: { token: '0xZABAL...', minBalance: '1' }`. POST handler resolves user FID -> primary address (Neynar `user/bulk`), reads ERC-20/ERC-721 balance via Alchemy or direct RPC, and either renders the gated block or swaps in an upsell button (`open_url` to swap the token).

### Why first
- Zero spec changes — Snap protocol already supports POST-driven re-render with different content per request.
- Differentiates Zlank from every other Snap builder (none ship this per Step 4 scan).
- Direct ZAO loop: ZABAL holders see member-only Snaps; non-holders see "buy ZABAL" button. Same code reused for ZOR, partner tokens.

### Implementation sketch (1-day spike)
1. Add `gate?: GateRule` to every Block type in `blocks.ts`.
2. New `lib/gates.ts`: `evaluateGate(rule, userFid)` -> `boolean`. Cache resolved address per FID for 5 min in Redis.
3. In `snap-spec.ts` `blockToElements`, if a block has `gate` and POST context says user fails, return upsell button instead of block elements.
4. Cap to one RPC call per Snap render (batch all gates).
5. Builder UI: per-block "Gate to..." dropdown listing common ZAO tokens + custom CAIP-19.

### Risks
- Need user FID at GET time, but JFS-signed FID only arrives on POST. Fallback: render gated blocks as locked stubs on GET; swap to real content on first POST. Acceptable UX.
- RPC cost. Mitigate: cache balances 60-120s in Redis.

---

## Build 2 — One-click coin launch

### What it is
On first publish from the builder, optionally launch a Zora coin (or Empire Builder leaderboard token, behind feature flag) for that Snap. Auto-inject a `swap_token` button into the Snap pointing at the new CAIP-19. Royalties accrue to the creator's primary address.

### Why second
- Creator monetization with zero friction — they already pressed Publish.
- `swap_token` is already in the @farcaster/snap action catalog; inline buy works without further Snap protocol changes.
- Aligns with Zaal's stated thesis (project_zlank.md memory): "agents launch coins + run socials". This makes Zlank the surface that does it for humans first, then for agents.

### Implementation sketch (2-3 day spike)
1. Add `@zoralabs/coins-sdk` dependency (verify package name + current version before install).
2. New `app/api/coin/launch` route: server-side, takes `{snapId, name, symbol, payoutFid}`, calls `createCoin()`, returns CAIP-19 + tx hash.
3. Builder UI: post-deploy modal "Launch a coin for this Snap?" with name/symbol prefill from Snap title.
4. On launch, write CAIP-19 to `snapdoc:{id}` extras, regenerate Snap with auto-injected `swap_token` button at top.
5. Empire Builder path: same shape, different SDK call, gated behind `EMPIRE_BUILDER_API_KEY` env var (request from team).

### Risks
- Zora/Empire API contracts evolve fast — pin SDK versions and add a smoke test that runs weekly.
- Creator needs a wallet. Snap surface gives FID, not signing capability — coin must be launched via Zlank's own wallet on creator's behalf, with payout splits. Verify split contract behavior end-to-end before shipping.
- Avoid invalid claims about price/launchpad mechanics; defer to current vendor docs at deploy time.

---

## Build 3 — Live leaderboard + persistent state

### What it is
A new `leaderboard` block. Each entry the Snap accepts (vote, tip, slider value, custom POST event) increments a Redis sorted set. The block renders top N + viewer's rank + delta-since-last-render.

### Why third
- Generalizes the poll infra already shipped tonight (`recordVote` in `lib/kv.ts`).
- Stateful Snaps are explicitly highlighted in the FarHack "judging direction" signal (Step 4 finding).
- Unlocks templates: ZAOstock submission count, top music drops this week, top sponsor contributions, top tippers.

### Implementation sketch (1-day spike)
1. Add `LeaderboardBlock` to `blocks.ts`: `{ type: 'leaderboard', source: 'votes' | 'tips' | 'custom', topN: number }`.
2. In `snap-spec.ts`, render as bar_chart with viewer's rank as a text block above (personalize per POST FID).
3. Reuse Redis `HGETALL` + sort, or move to `ZRANGEBYSCORE` for true sorted set.
4. POST POST-render: write FID-keyed event so per-user history persists.
5. Builder UI: leaderboard block with source dropdown.

### Risks
- "Live" without a refresh trigger is misleading. Snap clients re-render on POST, not on a timer per spec. Frame the UX as "refreshes when you interact" — do not promise auto-refresh.
- Personalization-per-FID multiplies cache misses — pre-compute top N, append viewer line at request time.

---

## Step 4 — Findings: Ecosystem context

### Other Snap builders (April 25, 2026)

| Tool | Status | Differentiation vs Zlank |
|------|--------|--------------------------|
| Official `@farcaster/snap` template | Production | Hono server scaffold; for devs, not creators |
| `@farcaster/snap-hono` | Production (npm) | Convenience wrapper Zlank already uses |
| Montoya `farfeed-snap` | Production OSS example | Read-only feed Snap; not a builder |
| Neynar Frame Studio | Production | Pre-Snap Frames editor; no Snap support confirmed yet |
| Zlank | Live (Apr 25 2026) | First no-code Snap builder this researcher could verify |

Caveat: ecosystem is one month old. New builders will land. Watch FarHack Online 2026 winners list for direct competitors.

### Snap protocol signals
- Spec is in beta per `docs.farcaster.xyz/snap` — expect breaking changes; pin the npm version.
- `@farcaster/snap` action catalog already includes `swap_token`, `send_token`, `view_token` (CAIP-19) — monetization hooks exist.
- Persistent key-value store mentioned in Snap docs as a primitive — confirm via emulator before relying on it as anything beyond a cache.

### Monetization paths verified
| Path | Status | Take rate (per vendor docs at the linked URLs — verify before shipping) |
|------|--------|-----------------------------------------------------------------------|
| Zora Coins SDK | Live | Creator earns market-reward share; exact % must be re-checked at integration time |
| Clanker | Live | Public read API; partner key required for programmatic deploy |
| Empire Builder | Live | API gated; ties into individual-empire-token thesis from Orajo (project_zlank.md) |
| Hypersub (Fabric) | Live | Subscription contracts — fits paid-gate block behind Build 1 token gate |
| Loop (checkout) | Live | One-shot embed; lower priority than coin launch for ZAO loop |

Numbers (vendor-claimed; treat as last-validated by the researcher who wrote this on 2026-04-25, not by Zaal):
- @farcaster/snap is on `2.x` per node_modules pin in the Zlank repo (see `package.json`).
- Snap protocol shipped publicly in March 2026 (exact day disputed across sources; both candidates within March confirm "one month old").
- FarHack Online 2026 Snap track prize: $1,000 (per the form Zaal already filled — overrides the higher number an upstream agent guessed).

---

## Also See

- [Doc 295 — Farcaster Snaps initial research](../295-farcaster-snaps/)
- [Doc 489 — HyperSnap node](../489-hypersnap-farcaster-node-cassonmars/)
- [Doc 498 — Zlank unified SDK concept](../../business/498-zlank-unified-sdk-concept/)
- [Doc 500 — Snaps Zlank build platform](../500-snaps-zlank-build-platform/)
- [Doc 505 — Zlank online builder spec](../505-zlank-online-builder-spec/)

## Next Actions

| Action | Owner | Type | By when |
|--------|-------|------|---------|
| Spike Build 1 (token-gated blocks) on a fresh `ws/zlank-gates` branch | @Zaal | Code | Next zlank session |
| Verify @zoralabs/coins-sdk current API surface + payout-split behavior on testnet | @Zaal | Spike | Before Build 2 PR |
| Request Empire Builder partner API key | @Zaal | Outreach | Whenever Build 2 nears |
| Update project_zlank.md memory with shipped state + this doc number | @Zaal | Memory | After this PR merges |
| Update Doc 500/505 cross-links to point at this doc | @Zaal | Doc edit | When freshening 500/505 |

## Sources

Verified 2026-04-25, all returned HTTP 200 unless noted:

- [Farcaster Snap docs](https://docs.farcaster.xyz/snap)
- [farcasterxyz/snap GitHub](https://github.com/farcasterxyz/snap)
- [Zora Coins SDK docs](https://docs.zora.co/coins/sdk)
- [Neynar subscriptions API](https://docs.neynar.com/docs/common-subscriptions-fabric)
- [Neynar mint for FC users](https://docs.neynar.com/docs/mint-for-farcaster-users)
- [Neynar docs root](https://docs.neynar.com)
- [Hypersub interoperability blog (Splits)](https://splits.org/blog/hypersub-interoperability/)
- [Fabric (Hypersub STP) docs root](https://docs.withfabric.xyz/) — `/stp/overview` 404s; root works
- [FarHack Online 2026](https://farhack.xyz/hackathons/farhack-online-2026)
- [Montoya farfeed-snap (OSS Snap example)](https://github.com/Montoya/farfeed-snap)
- [Empire Builder docs](https://empire-builder.gitbook.io/empire-builder-docs)
- [Clanker (root)](https://www.clanker.world) — `/api` 404, may have moved

Community signal: no Reddit/HN threads with substantive "Snap builder" discussion found yet — protocol is too new. Re-check in 30 days.
