# Progressive Auth Flow — Wallet-First Design

## Problem
Current login has two side-by-side options (wallet + Farcaster) with no clear hierarchy. After login, messaging and posting require additional steps that aren't guided. Users don't know what they can/can't do yet.

## Design

### Landing Page
**Wallet connect is the primary CTA.** Farcaster sign-in is secondary below a divider.

Flow:
1. User connects wallet (RainbowKit) → SIWE signature → allowlist check → session created
2. Redirect to `/chat` with view access
3. If wallet not on allowlist → "Not a member" page with info about joining The ZAO

### Post-Login Progressive Prompts
Once inside, a small connection status bar (or cards in Settings) shows what's connected:

| Level | What | Status | Prompt |
|-------|------|--------|--------|
| 1 | Wallet | Connected (always, it's how you logged in) | - |
| 2 | Farcaster | Optional | "Connect Farcaster to post in channels" |
| 3 | XMTP | Optional | "Enable messaging to DM members" (auto-signs if wallet connected) |

**Level 2 prompt**: Show a subtle banner above the compose bar when user tries to type without a Farcaster signer: "Connect your Farcaster account to post". Clicking opens the Neynar SIWF flow.

**Level 3 prompt**: Auto-attempt XMTP connection when user navigates to Messages or clicks a DM. If wallet is connected, XMTP signing happens automatically (already built).

### Settings Page — Connection Hub
The Settings page becomes the central place to see and manage all connections:

```
Connections
[x] Wallet: 0x7234...9af (connected)
[ ] Farcaster: Connect to post in channels → [Connect Farcaster]
[x] XMTP Messaging: Enabled → [Reset]
```

### Login Page Layout

```
THE ZAO
Music Community on Farcaster

[  Connect Wallet  ]  ← primary gold button (RainbowKit)

── or ──

[Sign in with Farcaster]  ← secondary, smaller
```

### What Changes

| File | Change |
|------|--------|
| `src/app/page.tsx` | Swap button order — wallet primary, Farcaster secondary |
| `src/components/gate/LoginButton.tsx` | Restructure: wallet CTA on top, Farcaster below |
| `src/components/gate/WalletLoginButton.tsx` | Make it the primary styled button |
| `src/components/chat/ComposeBar.tsx` | Show "Connect Farcaster to post" if no signer |
| `src/components/chat/SignerConnect.tsx` | Keep as-is but surface it more prominently |
| `src/app/(auth)/settings/page.tsx` | Add Connections section showing all 3 levels |

### What Stays the Same
- Allowlist gate (wallet must be on allowlist)
- iron-session (7-day cookies)
- SIWE nonce validation
- SIWF nonce validation
- Admin FID checks
- All API routes
