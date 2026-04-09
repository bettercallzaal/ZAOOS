# 305 - Farcaster Channel Moderation & Community Management

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Map the full Farcaster channel moderation API surface and build a community management toolkit for ZAO OS as a /zao channel hub

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Channel moderation API** | USE the Farcaster Client API (`api.farcaster.xyz/fc/*`) - this is the only way to do channel-level moderation (ban, hide, pin, invite). Neynar does NOT wrap these endpoints |
| **Auth for moderation** | INSTALL `@farcaster/hub-nodejs` for Ed25519 self-signed token generation. ZAO already has `APP_SIGNER_PRIVATE_KEY` but it's EIP-712 (Ethereum), not Ed25519 (Farcaster App Key). Need to generate and register an Ed25519 App Key |
| **Read endpoints** | USE without auth - GET endpoints for channel-bans, members, invites, moderated-casts are all public and unauthenticated |
| **Admin panel integration** | ADD a "Channel" tab to the existing admin panel (`src/app/(auth)/admin/AdminPanel.tsx`) with ban management, cast moderation, pinning, and member/moderator invites |
| **Neynar app-level bans** | KEEP the existing Neynar ban system for app-wide bans (hides user from all ZAO OS API calls). Channel bans are separate and complementary |
| **Existing moderation** | KEEP `src/app/api/moderation/queue/route.ts` - AI moderation (Perspective API) feeds the queue, admin reviews. Channel moderation is a separate layer on top |

## Two Moderation Systems: Neynar vs Farcaster Client API

| Feature | Neynar API (existing) | Farcaster Client API (new) |
|---------|----------------------|---------------------------|
| **Base URL** | `api.neynar.com/v2/farcaster` | `api.farcaster.xyz/fc/*` |
| **Auth** | `x-api-key` header | Ed25519 self-signed Bearer token |
| **Scope** | App-wide (all ZAO OS users) | Channel-specific (/zao, /zabal, etc.) |
| **Ban users** | App-level ban (all endpoints) | Channel ban (can't reply in channel) |
| **Hide casts** | Not supported | `POST /fc/moderated-casts` with `action: hide` |
| **Pin casts** | Not supported | `PUT /fc/pinned-casts` |
| **Invite members** | Not supported | `POST /fc/channel-invites` (member or moderator role) |
| **Block users** | Not supported | `POST /fc/blocked-users` (protocol-level, cross-client) |
| **Mute users** | App-level mute | Not available (Neynar only) |
| **Package needed** | None (raw fetch) | `@farcaster/hub-nodejs` for Ed25519 signing |

## Complete Farcaster Client API Endpoint Reference

### Channel Bans

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/fc/channel-bans?channelId=zao` | No | List banned users, ordered by ban time desc |
| POST | `/fc/channel-bans` | Yes | Ban user from channel (body: `{channelId, banFid}`) |
| DELETE | `/fc/channel-bans` | Yes | Unban user (body: `{channelId, unbanFid}`). User goes to restricted state |

**Ban effect:** Banned user can't reply to channel casts, existing replies are hidden.

### Cast Moderation

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/fc/moderated-casts?channelId=zao` | No | List moderation actions (hide/unhide) |
| POST | `/fc/moderated-casts` | Yes | Hide or unhide a cast (body: `{castHash, action: 'hide'|'unhide'}`) |

**Requirement:** Caller must own or moderate the channel.

### Pinned Casts

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| PUT | `/fc/pinned-casts` | Yes | Pin cast to channel (body: `{castHash, notifyChannelFollowers?: boolean}`) |
| DELETE | `/fc/pinned-casts` | Yes | Unpin (body: `{castHash}` or `{channelId}`) |

**Note:** Replaces any existing pinned cast. Optional notification to all channel followers.

### Channel Invites

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/fc/channel-invites?channelId=zao` | No | List outstanding invites |
| POST | `/fc/channel-invites` | Yes | Invite user as member or moderator (body: `{channelId, inviteFid, role}`) |
| DELETE | `/fc/channel-invites` | Yes | Remove member/moderator or revoke invite (body: `{channelId, removeFid, role}`) |
| PATCH | `/fc/channel-invites` | Yes | Accept or decline invite (body: `{channelId, role, accept}`) |

**Rate limit:** 100 calls per caller per channel per hour. Max 1 outstanding invite per user per channel.

### Channel Members

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/fc/channel-members?channelId=zao` | No | List members, ordered by membership time desc |

### Restricted Users

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/fc/channel-restricted-users?channelId=zao` | No | List restricted users. Replies visible below the fold |

### User Blocking (Protocol-Level)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/fc/blocked-users?blockerFid=19640` | No | List users blocked by a FID |
| POST | `/fc/blocked-users` | Yes | Block user (body: `{blockFid}`) |
| DELETE | `/fc/blocked-users` | Yes | Unblock (body: `{unblockFid}`) |

**Block effect:** Blocked user can't reply, quote, or mention the blocker. Cross-client, protocol-level.

### Channel Metadata

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/channel?channelId=zao` | No | Full channel info: lead FID, moderator FIDs, follower/member counts, pinnedCastHash, publicCasting |
| GET | `/v2/all-channels` | No | List all channels |
| GET | `/v1/channel-followers?channelId=zao` | No | List channel followers |
| GET | `/v1/user-following-channels?fid=19640` | No | Channels a user follows |

## Authentication: Ed25519 Self-Signed Token

The Farcaster Client API uses JWS (JSON Web Signature) with Ed25519 keys, not Ethereum signing.

### Token Generation Pattern

```typescript
import { NobleEd25519Signer } from '@farcaster/hub-nodejs';

function generateFarcasterClientToken(
  privateKeyBytes: Uint8Array,
  publicKeyHex: string,
  fid: number,
): string {
  // Header
  const header = { fid, type: 'app_key', key: publicKeyHex };
  const encodedHeader = base64url(JSON.stringify(header));

  // Payload (5-minute expiry)
  const payload = { exp: Math.floor(Date.now() / 1000) + 300 };
  const encodedPayload = base64url(JSON.stringify(payload));

  // Sign
  const message = `${encodedHeader}.${encodedPayload}`;
  const signer = new NobleEd25519Signer(privateKeyBytes);
  const signature = signer.signMessageHash(
    new TextEncoder().encode(message)
  );
  const encodedSignature = base64url(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}
```

### Key Distinction from ZAO's Current Auth

| Auth Type | Current ZAO Usage | Farcaster Client API |
|-----------|------------------|---------------------|
| Algorithm | EIP-712 (Ethereum secp256k1) | Ed25519 |
| Key | `APP_SIGNER_PRIVATE_KEY` (Ethereum wallet) | Ed25519 App Key (separate) |
| Package | `viem` (privateKeyToAccount) | `@farcaster/hub-nodejs` (NobleEd25519Signer) |
| Token format | Neynar signer UUID | JWS Bearer token |
| Registration | Neynar managed signer | Register App Key on-chain via KeyGateway |

### How to Get an Ed25519 App Key

ZAO OS already registers Neynar managed signers for users (`src/app/api/auth/signer/route.ts`). The admin Ed25519 App Key is different - it's for the ZAO app itself (FID 19640) to call the Farcaster Client API as the channel owner.

**Options:**
1. **Use Neynar's signer** - The existing signer UUID might work if Neynar exposes the underlying Ed25519 key. INVESTIGATE whether `getSignerStatus()` returns the private key bytes
2. **Generate new Ed25519 key** - Create a new key pair, register as App Key for FID 19640 via KeyGateway contract on Optimism
3. **Use `@farcaster/hub-nodejs` key generation** - `ed25519.utils.randomPrivateKey()` to create, then register on-chain

## Comparison: Channel Moderation Approaches

| Approach | Auth Complexity | Coverage | Best For |
|----------|----------------|----------|----------|
| **Farcaster Client API (recommended)** | Medium - need Ed25519 App Key | Full channel moderation (ban, hide, pin, invite) | Channel owners/moderators managing their communities |
| **Neynar app-level bans** | Low - existing API key | App-wide only, no channel-specific tools | Spam prevention across all of ZAO OS |
| **AI moderation (Perspective API)** | None - existing | Content scoring, no enforcement | Flagging problematic content for review |
| **Supabase hidden_messages** | None - existing | Client-side hide only, not protocol-level | Quick hide without protocol enforcement |

## ZAO OS Integration Plan

### What Exists Today

- **AI moderation pipeline:** `src/lib/moderation/moderate.ts` scores content with Perspective API, flags to `moderation_log` table
- **Admin review queue:** `src/app/api/moderation/queue/route.ts` - admin reviews flagged items, can allow/hide
- **Hidden messages:** `src/components/admin/HiddenMessages.tsx` - local hide in Supabase (not protocol-level)
- **Admin panel:** `src/app/(auth)/admin/AdminPanel.tsx` with 15 tabs (users, ZIDs, allowlist, moderation, respect, engagement, etc.)
- **Admin FID check:** `src/lib/auth/session.ts` uses `communityConfig.adminFids` ([19640])
- **4 channels configured:** `community.config.ts` - `['zao', 'zabal', 'cocconcertz', 'wavewarz']`

### What to Build

**Phase 1: Read-Only Channel Dashboard (no auth needed)**
- New admin tab: "Channels" in `AdminPanel.tsx`
- For each configured channel, show: member count, follower count, banned users, moderators, pinned cast, restricted users
- All via unauthenticated GET requests to `api.farcaster.xyz/fc/*`
- Files: `src/app/api/channels/[channelId]/route.ts`, `src/components/admin/ChannelDashboard.tsx`

**Phase 2: Write Operations (Ed25519 auth required)**
- Generate Ed25519 App Key for FID 19640
- Token generation utility: `src/lib/farcaster/clientApi.ts`
- Channel moderation API routes:
  - `POST /api/channels/ban` - ban user from channel
  - `POST /api/channels/hide` - hide a cast
  - `POST /api/channels/pin` - pin a cast
  - `POST /api/channels/invite` - invite member/moderator
  - `POST /api/channels/block` - protocol-level block
- Admin UI: ban button on user profiles, hide button on casts, pin button, invite modal

**Phase 3: Integration with Existing Systems**
- Connect AI moderation queue to channel hide: when admin confirms "hide" in moderation queue, also call Farcaster Client API to hide at protocol level
- Connect allowlist to channel invites: when new member added to allowlist, auto-invite to /zao channel
- Show channel ban status on member profiles

### File Structure

```
src/lib/farcaster/
  clientApi.ts          # Ed25519 token generation + Farcaster Client API wrapper
  neynar.ts             # Existing Neynar v2 API (reads + writes)
src/app/api/channels/
  [channelId]/route.ts  # GET channel info (members, bans, moderators)
  ban/route.ts          # POST ban/unban user from channel
  hide/route.ts         # POST hide/unhide cast
  pin/route.ts          # POST pin/unpin cast
  invite/route.ts       # POST invite member/moderator
  block/route.ts        # POST block/unblock user
src/components/admin/
  ChannelDashboard.tsx   # Channel management UI in admin panel
```

### Env Vars Needed

```
# Ed25519 App Key for Farcaster Client API (channel moderation)
FARCASTER_APP_KEY_PRIVATE=<hex-encoded Ed25519 private key>
FARCASTER_APP_KEY_PUBLIC=<hex-encoded Ed25519 public key>
```

## Channel Moderation UX: How Other Clients Handle It

### Warpcast (Reference Client)

- Channel owner sees "Moderate" button on each cast
- Two feeds: "Main" (curated by moderators) and "Recent" (algorithmic, unmoderated)
- Moderators elevate quality content to Main, not just remove bad content
- Auto-mod via automod.sh (external service, not built into Warpcast)

### Herocast (AGPL-3.0, Power User Client)

- FarcasterDelegator integration for shared account ownership
- Channel management via Hats Protocol delegation
- Multi-account support for moderating multiple channels

### ZAO OS Approach (Recommended)

- **Elevation model** (not just punishment): pin quality casts, highlight member contributions
- **AI-assisted moderation**: Perspective API scores feed the moderation queue, admin confirms
- **Protocol + local**: Hide at both Farcaster protocol level AND local Supabase `hidden_messages`
- **Allowlist integration**: Auto-invite new allowlist members to /zao channel
- **Respect-weighted moderation**: Members with higher Respect get moderation warnings before bans

## Reference Implementations

| Project | License | Key Pattern |
|---------|---------|-------------|
| `artlu99/shim` | Unknown | Calls `/fc/channel-bans` unauthenticated (GET only), caches in Redis |
| `imbhargav5/q8t` | Unknown | Full `warpcast-api.ts` with GET and POST for channel-bans |
| `nekofar/warpcast` | Unknown | Auto-generated SDK from Farcaster Client API spec |

## Sources

- [Farcaster Client API Reference](https://docs.farcaster.xyz/reference/farcaster/api) - Complete endpoint docs
- [Farcaster Channels Documentation](https://docs.farcaster.xyz/learn/what-is-farcaster/channels) - Channel concepts
- [Neynar Mutes, Blocks, and Bans](https://docs.neynar.com/docs/mutes-blocks-and-bans) - App-level moderation
- [Farcaster Channel Moderation (Claus Wilke)](https://paragraph.com/@clauswilke/farcaster-channel-moderation) - UX analysis of new system
- [Herocast GitHub](https://github.com/hero-org/herocast) - AGPL-3.0 reference client
- [artlu99/shim GitHub](https://github.com/artlu99/shim) - Channel-bans caching pattern
- [@farcaster/hub-nodejs](https://www.npmjs.com/package/@farcaster/hub-nodejs) - Ed25519 signer for auth tokens
