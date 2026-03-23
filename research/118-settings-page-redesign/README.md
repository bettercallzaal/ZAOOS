# 118 — Settings Page Redesign

> **Status:** Research complete
> **Date:** March 23, 2026
> **Goal:** Reorganize the settings page to unify connections, platforms, and socials into a clean, logical layout

## Key Decision: Merge Everything Into One Unified "Accounts" Section

**Current problem:** The settings page has 3 separate sections that overlap:
1. **CONNECTIONS** — Wallet, Farcaster, Posting, Messaging, Solana, Push Notifications (6 items in a flat list)
2. **CONNECTED PLATFORMS** — Bluesky, Lens, Hive, X (separate 2x2 card grid)
3. **SOCIALS** — X handle, Instagram, SoundCloud, Spotify, Audius (text inputs)

This is confusing because:
- "Wallet" appears in Connections but not in Platforms
- Bluesky appears in Platforms but not Connections
- X appears in both Platforms AND Socials
- There's no visual hierarchy — everything looks the same priority
- The card grid for platforms wastes space and looks inconsistent

## Recommended Layout: 3 Clear Sections

### Section 1: IDENTITY (who you are)
One card showing your primary identity across all protocols:

```
┌─────────────────────────────────────────────────┐
│ 🟢 Wallet     0x021a...5fcb           Primary   │
│ 🟢 Farcaster  @zaal (FID 19640)       Posting ✓ │
│ 🟢 Bluesky    @bettercallzaal.bsky    Connected │
│ 🟡 Lens       Not connected    [Connect Wallet] │
│ ⚪ Hive       Not connected         [Connect]   │
│ ⚪ Solana     Not connected         [Connect]   │
└─────────────────────────────────────────────────┘
```

**Why:** Every protocol uses your wallet as the root identity. Show them all in one place with consistent status dots. This is how Warpcast does "Verified Addresses" — one list, clear status.

### Section 2: FEATURES (what's enabled)
Toggles and status for app features:

```
┌─────────────────────────────────────────────────┐
│ Messaging (XMTP)    0x7234...E9Af     [Switch]  │
│ Cross-posting        3 of 5 platforms  [Manage]  │
│ Push Notifications   Disabled          [Toggle]  │
│ Signless (Lens)      Enabled                     │
└─────────────────────────────────────────────────┘
```

**Why:** These are features that depend on the identity connections above. They're settings you toggle, not accounts you connect.

### Section 3: SOCIALS (display links)
Your social media links (for your profile page, not for posting):

```
┌─────────────────────────────────────────────────┐
│ X / Twitter     @bettercallzaal                  │
│ Instagram       @zaal                            │
│ Spotify         [link]                           │
│ SoundCloud      [link]                           │
│ Audius          @zaal                            │
└─────────────────────────────────────────────────┘
```

**Why:** These are display-only links shown on your ZAO profile page. They don't affect app functionality.

## Design Patterns from Top Apps

### Warpcast (Farcaster)
- **Flat list** of connections with status dots (green/gray)
- Each item: icon + name + status + action (one line)
- No cards, no grids — just clean rows
- "Verified Addresses" section is a simple list

### Rainbow Wallet
- **Grouped sections** with headers
- Each connection: brand icon + label + address/handle + toggle
- Connected = green text, Not connected = gray with CTA

### Hey.xyz (Lens)
- **Minimal** — profile editing + session management
- Connected wallets shown as truncated addresses
- Sign out per session

### Common Pattern Across All
- **One row per connection** (not a card per connection)
- **Status dot** (green/gray) on the left
- **Action** (Connect/Disconnect/Switch) on the right
- **Grouped by purpose** (identity vs features vs display)

## Implementation for ZAO OS

### Changes to `SettingsClient.tsx`
1. **Merge CONNECTIONS + CONNECTED PLATFORMS** into one "ACCOUNTS" section
2. **Move Bluesky, Lens, Hive into the unified list** (same row format as Wallet/Farcaster)
3. **Keep SOCIALS separate** (these are display links, not auth connections)
4. **Add FEATURES section** for toggles (messaging, cross-posting, push notifications)
5. **Remove the 2x2 card grid** — replace with consistent rows

### Row Component Pattern
```tsx
<ConnectionRow
  icon={<BlueskyIcon />}
  name="Bluesky"
  status={handle ? 'connected' : 'disconnected'}
  detail={handle || undefined}
  action={handle ? { label: 'Disconnect', onClick: disconnect } : { label: 'Connect', onClick: connect }}
/>
```

### File Changes
- **Modify:** `src/app/(auth)/settings/SettingsClient.tsx` — restructure sections
- **Simplify:** `src/components/settings/ConnectedPlatforms.tsx` — convert from card grid to row list, or inline into SettingsClient
- **Keep:** `src/components/settings/LensConnect.tsx` — adapt to row format
- **Keep:** `src/components/solana/SolanaWalletConnect.tsx` — adapt to row format

### Effort
~2-4 hours for a developer. Mostly moving existing code into a new layout — minimal new logic.

## Sources
- [Warpcast wallet connection](https://blog.enkrypt.com/create-a-warpcast-account-and-link-your-enkrypt-wallet/)
- [Web3 UX trends 2026](https://bricxlabs.com/blogs/web-3-ux-design-trends)
- [thirdweb Connect patterns](https://thirdweb.com/learn/guides/thirdweb-connect-wallet-button-explained)
