# 250 — Farcaster Mini Apps llms.txt Deep Dive (April 2026)

> **Status:** Research complete
> **Date:** April 2, 2026
> **Goal:** Deep dive the official Farcaster Mini Apps llms-full.txt documentation, cross-reference with ZAO OS's current implementation (Doc 86, @farcaster/miniapp-sdk@0.2.3), and identify gaps + new features to adopt

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Webhook verification** | UPGRADE to `@farcaster/miniapp-node` `parseWebhookEvent` + `verifyAppKeyWithNeynar` — ZAO OS webhook at `src/app/api/miniapp/webhook/route.ts` currently has NO signature verification (comment on line 8 says "spec does not support HMAC"). The spec now DOES support verification via `@farcaster/miniapp-node` |
| **Haptics** | ADD haptic feedback to music player controls — `sdk.haptics.impactOccurred('medium')` on play/pause, `selectionChanged()` on track skip. Already feature-detected in `useMiniApp.ts` context. 3 types: impact (light/medium/heavy/soft/rigid), notification (success/warning/error), selection |
| **Back navigation** | ADD `sdk.back.enableWebNavigation()` to `useMiniApp.ts` init — automatic browser history integration so hardware back button works correctly in the mini app. Currently not implemented |
| **Batch transactions (EIP-5792)** | USE `wallet_sendCalls` for NFT minting flows — batch approve + transfer in one confirmation. New in the spec, not in Doc 86 |
| **Share extensions** | ADD `cast_share` location handler — when users share casts TO ZAO OS, detect `sdk.context.location.type === 'cast_share'` and route to appropriate handler (e.g., share a music cast → add to library) |
| **openMiniApp()** | USE to link between ZAO OS and ecosystem partners (SongJam, Empire Builder) — new action that opens another mini app directly |
| **Manifest schema update** | UPDATE manifest to use `miniapp` key (not `frame`) — the schema has changed from `frame.version` to `miniapp.version`. Add `requiredChains` and `requiredCapabilities` fields |
| **Solana wallet** | SKIP for now — ZAO OS is EVM-only (Base, Optimism). WaveWarZ uses Solana separately. Revisit if cross-chain NFTs are needed |
| **Quick Auth** | ALREADY IMPLEMENTED at `src/app/api/miniapp/auth/route.ts` using `@farcaster/quick-auth`. Now also available as `sdk.quickAuth.getToken()` and `sdk.quickAuth.fetch()` client-side — add client-side Quick Auth for authenticated API calls from mini app context |
| **Node.js requirement** | VERIFY ZAO OS runs Node.js 22.11.0+ — the SDK requires it. Current Vercel deployment should be fine but verify `engines` in package.json |

## Comparison: ZAO OS Current vs llms-full.txt Spec

| Feature | llms-full.txt Spec | ZAO OS Status | Gap |
|---------|-------------------|---------------|-----|
| **`sdk.actions.ready()`** | Required — hides splash screen | Implemented in `src/hooks/useMiniApp.ts:49` | None |
| **`sdk.context`** | user.fid, location, client, features | Implemented — extracts FID + safeAreaInsets | Missing: location context, features detection |
| **Quick Auth (server)** | `@farcaster/quick-auth` JWT verify | Implemented at `src/app/api/miniapp/auth/route.ts` | None |
| **Quick Auth (client)** | `sdk.quickAuth.getToken()` + `sdk.quickAuth.fetch()` | NOT implemented | **Add client-side Quick Auth** |
| **`composeCast()`** | Opens composer with text + channel | Implemented in `useMiniApp.ts:74` | Missing: `channelKey` parameter |
| **Webhook events** | 4 events with signature verification | Implemented at `src/app/api/miniapp/webhook/route.ts` | **Missing: signature verification** |
| **Notifications** | POST to notification URL, 1/30s rate limit, 100/day | Implemented at `src/app/api/notifications/send/route.ts` + `src/lib/notifications.ts` | None |
| **`addMiniApp()`** | Prompts user to install | NOT implemented | **Add install prompt** |
| **Haptics API** | 3 types: impact, notification, selection | NOT implemented | **Add to music player** |
| **Back navigation** | `sdk.back.enableWebNavigation()` | NOT implemented | **Add to useMiniApp init** |
| **Share extensions** | `cast_share` location context | NOT implemented | **Add cast share handler** |
| **`openMiniApp()`** | Open another mini app | NOT implemented | Add for ecosystem links |
| **`viewProfile()`** | Opens FID profile in client | NOT implemented | Add to member cards |
| **`viewCast()`** | Opens cast in client | NOT implemented | Add to cast components |
| **`sendToken()`** | Pre-filled send form | NOT implemented | Add for tipping |
| **`swapToken()`** | Token swap UI | NOT implemented | Low priority |
| **`viewToken()`** | Token details view | NOT implemented | Add for $ZABAL |
| **EIP-5792 batch txns** | `wallet_sendCalls` | NOT implemented | Add for NFT mint flows |
| **Solana wallet** | Wallet Standard provider | NOT needed | ZAO is EVM-only |
| **Capability detection** | `sdk.getCapabilities()` | NOT implemented | **Add before using new features** |
| **Chain detection** | `sdk.getChains()` | NOT implemented | Add for wallet features |
| **Client events** | miniappAdded/Removed, notifications | NOT implemented | Add for analytics |
| **Embed metadata** | `fc:miniapp` meta tag per page | Implemented in `src/app/layout.tsx:50` | Only on root — add to shareable pages |
| **Manifest** | `/.well-known/farcaster.json` | Referenced in Doc 86 but no route file found | **Verify manifest is served** |

## Priority Implementation Plan

### P0 — Fix Security Gap (1 hour)

**Webhook signature verification** — The biggest gap. Currently the webhook accepts any POST with valid JSON shape. The official `@farcaster/miniapp-node` package now provides `parseWebhookEvent` with `verifyAppKeyWithNeynar`.

```bash
npm install @farcaster/miniapp-node
```

Update `src/app/api/miniapp/webhook/route.ts`:
```typescript
import { parseWebhookEvent, verifyAppKeyWithNeynar } from "@farcaster/miniapp-node"

// Replace raw JSON parsing with:
const data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar)
```

### P1 — Haptics + Back Navigation (2 hours)

Add to `src/hooks/useMiniApp.ts`:

```typescript
// In the detect() function, after sdk.actions.ready():
await sdk.back.enableWebNavigation()

// Export haptics methods:
const triggerHaptic = useCallback(async (type: 'light' | 'medium' | 'heavy') => {
  if (!sdkRef.current || !isMiniApp) return
  const caps = await sdkRef.current.getCapabilities()
  if (caps.includes('haptics.impactOccurred')) {
    await sdkRef.current.haptics.impactOccurred(type)
  }
}, [isMiniApp])
```

Wire into `src/providers/audio/PlayerProvider.tsx` — haptic on play/pause/skip.

### P2 — Share Extensions + New Actions (4 hours)

Add location context handling to `useMiniApp.ts`:
- `cast_share` → detect shared music links, offer to add to library
- `cast_embed` → show contextual UI based on which cast embedded us
- `notification` → deep-link to the notification target

Add action wrappers:
- `viewProfile(fid)` → use on member cards in `src/components/members/`
- `viewCast(hash)` → use on cast cards in `src/components/chat/`
- `addMiniApp()` → show install prompt for non-added users
- `viewToken({ chainId: 8453, token: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07' })` → view $ZABAL

### P3 — Manifest Update + Embed Expansion (2 hours)

Update manifest schema from `frame` to `miniapp` key. Add:
```json
{
  "miniapp": {
    "requiredChains": ["eip155:8453"],
    "requiredCapabilities": ["wallet.getEthereumProvider", "actions.composeCast"]
  }
}
```

Add `fc:miniapp` embed metadata to shareable pages:
- `/stock` — ZAO Stock event page
- `/zao-leaderboard` — Respect leaderboard
- `/spaces/[id]` — Individual Space rooms
- `/music` — Music library

### P4 — Client-Side Quick Auth + Batch Transactions (4 hours)

Replace manual `fetch` calls in mini app context with `sdk.quickAuth.fetch()`:
```typescript
// Instead of:
const res = await fetch('/api/music/library', { headers: { ... } })

// Use:
const res = await sdk.quickAuth.fetch('/api/music/library')
```

Add EIP-5792 `wallet_sendCalls` for NFT minting (Doc 155 — Music NFT pipeline).

## New SDK Features Not in Doc 86

These features were added to the Mini Apps spec AFTER Doc 86 was written (March 2026):

| Feature | Added | What It Does | ZAO Relevance |
|---------|-------|-------------|---------------|
| **Haptics API** | June 4, 2025 | Physical feedback on mobile | Music player UX |
| **Back navigation** | June 4, 2025 | Hardware back button integration | Essential for mobile navigation |
| **Share extensions** | June 6, 2025 | Receive shared casts | Music link sharing |
| **Quick Auth client-side** | June 9, 2025 | `sdk.quickAuth.getToken()` + `.fetch()` | Simpler authenticated API calls |
| **`openMiniApp()`** | 2025 | Navigate between mini apps | Ecosystem partner linking |
| **Solana wallet** | May 21, 2025 | Wallet Standard integration | Not needed (EVM-only) |
| **`getCapabilities()`** | May 16, 2025 | Feature detection | Required before using new features |
| **`getChains()`** | May 16, 2025 | Chain detection | Required for wallet features |
| **EIP-5792 batch txns** | 2025 | `wallet_sendCalls` | NFT mint flows |
| **Manifest `miniapp` key** | 2025 | Replaces `frame` key in manifest | Must update manifest |
| **`requiredChains`/`requiredCapabilities`** | 2025 | Declare requirements in manifest | Add to manifest |
| **Domain migration** | 2025 | `canonicalDomain` in manifest | Useful if domain changes |

## ZAO OS Integration File Map

| File | Current State | What to Update |
|------|---------------|----------------|
| `src/hooks/useMiniApp.ts` | SDK detect + ready + composeCast | Add haptics, back nav, capability detection, location context, new actions |
| `src/app/api/miniapp/webhook/route.ts` | Accepts events, no signature verify | Add `@farcaster/miniapp-node` verification |
| `src/app/api/miniapp/auth/route.ts` | Server-side Quick Auth verify | Already correct — complement with client-side `sdk.quickAuth` |
| `src/app/layout.tsx:50` | `fc:miniapp` embed on root | Add embeds to shareable pages |
| `src/app/miniapp/page.tsx` | Mini app entry point | Add location context routing |
| `src/app/miniapp/layout.tsx` | Mini app layout wrapper | Add back navigation init |
| `src/providers/audio/PlayerProvider.tsx` | Player state, MediaSession | Add haptic feedback on controls |
| `src/components/members/` | Member cards | Add `viewProfile()` action |
| `src/components/chat/` | Cast display | Add `viewCast()` action |
| `community.config.ts` | Ecosystem links | Use `openMiniApp()` for partner mini apps |

## Notification Rate Limits (from llms-full.txt)

| Limit | Value |
|-------|-------|
| Per token per 30 seconds | 1 notification |
| Per token per day | 100 notifications |
| Token lifetime | Until user removes app or disables notifications |
| Dedup window | 24 hours per `notificationId` |

ZAO OS notification system at `src/lib/notifications.ts` should respect these limits.

## Sources

- [Farcaster Mini Apps llms.txt](https://miniapps.farcaster.xyz/llms.txt) — Summary documentation for LLMs
- [Farcaster Mini Apps llms-full.txt](https://miniapps.farcaster.xyz/llms-full.txt) — Complete API reference (full spec)
- [Farcaster Mini Apps Getting Started](https://miniapps.farcaster.xyz/docs/getting-started) — Setup guide, Node.js 22.11.0+ requirement
- [Farcaster Mini Apps Specification](https://miniapps.farcaster.xyz/docs/specification) — Manifest, embed, webhook schemas
- [AI Agents & LLMs Checklist](https://miniapps.farcaster.xyz/docs/guides/agents-checklist) — Agent-specific integration guide
- [GitHub: farcasterxyz/miniapps](https://github.com/farcasterxyz/miniapps) — Source code, SDK, examples
- [Doc 86 — Farcaster Mini Apps Integration](../173-farcaster-miniapps-integration/) — Previous ZAO OS research (March 2026, pre-haptics/back-nav)
- [@farcaster/miniapp-sdk npm](https://www.npmjs.com/package/@farcaster/miniapp-sdk) — ZAO OS currently on v0.2.3
