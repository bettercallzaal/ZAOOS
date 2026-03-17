# Progressive Auth Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make wallet the primary login, with Farcaster and XMTP as progressive add-ons.

**Architecture:** Reorder existing components on landing page, add connection prompts in chat, add connections section to settings. No new auth flows — just rewiring existing ones.

**Tech Stack:** RainbowKit, wagmi, iron-session, @farcaster/auth-kit, XMTP

---

## Task 1: Reorder Landing Page — Wallet Primary

**Files:**
- Modify: `src/components/gate/LoginButton.tsx`

- [ ] **Step 1: Swap the order — wallet on top, Farcaster below**

The current `LoginButton` renders `WalletLoginButton` first (good) then `SignInButton` below. The order is already correct but the visual hierarchy needs strengthening.

Update the component to make the wallet button more prominent and the Farcaster button secondary:

Change the divider text from "or" to "or sign in with Farcaster":
```typescript
<span className="text-xs text-gray-500 font-medium uppercase tracking-wider">or sign in with Farcaster</span>
```

Add a small description under the wallet button:
```typescript
<WalletLoginButton />
<p className="text-[10px] text-gray-600 mt-2">Recommended — connect your ZAO wallet</p>
```

- [ ] **Step 2: Update landing page tagline**

In `src/app/page.tsx`, update the tagline from:
```typescript
<p className="text-gray-400 text-base mb-3">Music Community on Farcaster</p>
```
To:
```typescript
<p className="text-gray-400 text-base mb-3">Decentralized Music Community</p>
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/gate/LoginButton.tsx src/app/page.tsx
git commit -m "Make wallet the primary login, Farcaster secondary"
```

---

## Task 2: Compose Bar — Farcaster Connect Prompt

**Files:**
- Modify: `src/components/chat/ComposeBar.tsx`

Currently, if a user doesn't have a signer, the compose bar shows but `hasSigner` is false and posting silently fails or shows the `SignerConnect` component above it. Make this clearer.

- [ ] **Step 1: Show inline prompt when no signer**

In `ComposeBar.tsx`, find where `hasSigner` is checked. When `hasSigner` is false, the textarea placeholder should indicate Farcaster is needed. Find the placeholder logic (around line 455-461) and update:

```typescript
placeholder={
  replyTo
    ? `Reply to ${replyTo.authorName}...`
    : quotedCast
      ? 'Add a comment...'
      : !hasSigner
        ? 'Connect Farcaster to post in channels...'
        : `Message #${channel}... (type @ to mention)`
}
```

This is likely already close to what exists. Just verify the `!hasSigner` case shows a clear message.

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ComposeBar.tsx
git commit -m "Show 'Connect Farcaster to post' prompt in compose bar"
```

---

## Task 3: Auto-Enable XMTP on Navigation to Messages

**Files:**
- Modify: `src/components/chat/ChatRoom.tsx`

XMTP auto-connect is already implemented (from the wallet auth migration). When a user with a connected wallet navigates to the chat page, XMTP auto-enables. This task just verifies it works and adds a brief status indicator.

- [ ] **Step 1: Verify auto-connect behavior**

The ChatRoom already has this effect:
```typescript
useEffect(() => {
  if (!user || xmtp.isConnected || xmtp.isConnecting || xmtp.error) return;
  if (walletXmtp.canConnect) {
    walletXmtp.connectWalletToXMTP();
  }
}, [user, walletXmtp.canConnect]);
```

This should already auto-enable XMTP. No code change needed — just verify by testing.

- [ ] **Step 2: Commit (no-op if no changes needed)**

---

## Task 4: Settings Page — Connections Section

**Files:**
- Modify: `src/app/(auth)/settings/page.tsx` or `src/components/settings/SettingsClient.tsx`

- [ ] **Step 1: Find the settings component**

Read the settings page to understand its structure. It likely has sections for Profile, Signer, Wallets, Account.

- [ ] **Step 2: Add Connections section at the top**

Add a new section before the existing content showing connection status:

```typescript
{/* Connections */}
<div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
  <h3 className="text-sm font-semibold text-white mb-3">Connections</h3>
  <div className="space-y-3">
    {/* Wallet — always connected (it's how they logged in) */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-sm text-white">Wallet</span>
      </div>
      <span className="text-xs text-gray-500 font-mono">
        {user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 'Connected'}
      </span>
    </div>

    {/* Farcaster */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${user.fid ? 'bg-green-400' : 'bg-gray-600'}`} />
        <span className="text-sm text-white">Farcaster</span>
      </div>
      {user.fid ? (
        <span className="text-xs text-gray-500">@{user.username}</span>
      ) : (
        <span className="text-xs text-gray-500">Not connected</span>
      )}
    </div>

    {/* Signer (posting) */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${user.signerUuid ? 'bg-green-400' : 'bg-gray-600'}`} />
        <span className="text-sm text-white">Posting</span>
      </div>
      {user.signerUuid ? (
        <span className="text-xs text-green-500/70">Enabled</span>
      ) : (
        <span className="text-xs text-[#f5a623]">Connect Farcaster first</span>
      )}
    </div>

    {/* XMTP Messaging */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${xmtpConnected ? 'bg-green-400' : 'bg-gray-600'}`} />
        <span className="text-sm text-white">Messaging</span>
      </div>
      <span className={`text-xs ${xmtpConnected ? 'text-green-500/70' : 'text-gray-500'}`}>
        {xmtpConnected ? 'Enabled' : 'Auto-enables with wallet'}
      </span>
    </div>
  </div>
</div>
```

Note: XMTP connected state needs to come from `useXMTPContext()`. Import it if not already available in the settings page.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/settings/page.tsx
git commit -m "Add Connections section to Settings showing wallet/Farcaster/XMTP status"
```

---

## Verification

After all tasks are complete:

- [ ] Run `npm run build` — must pass
- [ ] Test: Landing page shows wallet as primary CTA
- [ ] Test: Login with wallet → redirects to /chat
- [ ] Test: Without Farcaster signer, compose bar shows "Connect Farcaster to post"
- [ ] Test: XMTP auto-enables when wallet is connected
- [ ] Test: Settings page shows connection status for all 3 levels
