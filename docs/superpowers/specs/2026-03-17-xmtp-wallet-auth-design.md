# XMTP Wallet-Based Auth Migration

## Problem

XMTP identities are created with random auto-generated keys that have no connection to the user's wallet. This causes:
- `canMessage` fails (checks wallet addresses, not random XMTP address)
- DM senders show as "Unknown" (inbox IDs don't match profile cache)
- Members can't discover each other for messaging
- Identity is per-device/browser (not recoverable)

## Solution

Use the user's real wallet address as their XMTP identity. The `connectWallet()` function already exists and works — make it the primary flow instead of `autoConnect()`.

## Approach: Auto-Detect Wallet

1. If wallet already connected (from SIWE login or wagmi state), auto-enable XMTP with that wallet — zero extra clicks
2. If no wallet connected, show RainbowKit "Connect Wallet" prompt in the Enable Messaging section
3. Once wallet connects, immediately trigger XMTP setup
4. Auto-reconnect on page load uses wagmi wallet state

## Changes Required

### ChatRoom.tsx
- Replace `handleXmtpConnect` → use `useWalletXMTP` hook
- Auto-reconnect effect: if wallet connected + not XMTP connected → call `connectWalletToXMTP()`
- Remove `autoConnect(user.fid)` calls

### Sidebar.tsx
- Enable Messaging section: if no wallet, show RainbowKit ConnectButton; if wallet connected, show "Enable Messaging" that triggers XMTP signing
- Update button text and description

### XMTPContext.tsx
- Keep `connectWallet` as-is (already works)
- Keep `autoConnect` but deprioritize — only used as internal fallback
- Remove `checkZaoMembers` canMessage workarounds (wallet addresses now match)
- Restore proper `canMessage` checks since XMTP identity = wallet address

### ConnectXMTP.tsx (messages page)
- Show RainbowKit wallet connect if no wallet
- Show "Enable Messaging" if wallet connected but XMTP not connected
- Wire to `useWalletXMTP().connectWalletToXMTP()`

### useWalletXMTP.ts
- Already exists — becomes the primary XMTP connection hook
- No changes needed

## Migration

- New users: connect wallet → XMTP identity is their wallet address
- Existing users: "Reset Messaging" button already exists → clears old random key → reconnect with wallet
- Old random-key conversations will appear as separate identities (expected — XMTP doesn't merge identities)

## What This Fixes

- `canMessage(walletAddress)` → true (wallet IS the XMTP identity)
- Profile resolution works (inbox ID maps to known wallet)
- No more "Unknown" senders
- Members discoverable without storing xmtp_address in DB
- Same identity across devices (same wallet = same XMTP identity)
