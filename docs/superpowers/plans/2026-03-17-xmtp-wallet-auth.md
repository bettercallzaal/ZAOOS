# XMTP Wallet-Based Auth Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch XMTP from random auto-generated keys to wallet-based signing so members can discover each other naturally.

**Architecture:** `connectWallet()` and `useWalletXMTP` already exist. We're rewiring the UI to use them as the primary flow instead of `autoConnect`.

**Tech Stack:** wagmi, RainbowKit, XMTP browser-sdk, Next.js

---

## Task 1: Update ChatRoom to Use Wallet-Based XMTP

**Files:**
- Modify: `src/components/chat/ChatRoom.tsx`

- [ ] **Step 1: Import useWalletXMTP and replace handleXmtpConnect**

Add import:
```typescript
import { useWalletXMTP } from '@/hooks/useWalletXMTP';
```

Add the hook call after the existing `useXMTPContext()` line (~line 129):
```typescript
  const walletXmtp = useWalletXMTP();
```

Replace `handleXmtpConnect` (~line 133-136):
```typescript
  const handleXmtpConnect = useCallback(async () => {
    if (walletXmtp.canConnect) {
      await walletXmtp.connectWalletToXMTP();
    }
    // Fallback: if no wallet connected, the sidebar will show RainbowKit connect
  }, [walletXmtp]);
```

- [ ] **Step 2: Update auto-reconnect effect to use wallet**

Replace the auto-reconnect useEffect (~lines 180-189):
```typescript
  // Auto-connect XMTP when wallet is available
  useEffect(() => {
    if (!user || xmtp.isConnected || xmtp.isConnecting) return;
    if (walletXmtp.canConnect) {
      walletXmtp.connectWalletToXMTP();
    }
  }, [user, walletXmtp.canConnect]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Pass wallet state to Sidebar**

The Sidebar needs to know if a wallet is connected to show the right UI. Add a new prop:
```typescript
        onXmtpConnect={handleXmtpConnect}
        walletConnected={walletXmtp.isWalletConnected}
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`

---

## Task 2: Update Sidebar Enable Messaging Section

**Files:**
- Modify: `src/components/chat/Sidebar.tsx`

- [ ] **Step 1: Add walletConnected prop**

Add to SidebarProps interface:
```typescript
  walletConnected?: boolean;
```

Add to destructured props.

- [ ] **Step 2: Update the Enable Messaging section**

Replace the current Enable Messaging button section (the `!xmtpConnected && !xmtpConnecting` block, ~lines 173-200). The new version shows different UI based on wallet state:

```typescript
          {!xmtpConnected && !xmtpConnecting && (
            <SidebarSection title="Messages">
              {xmtpError && (
                <div className="px-3 py-2 mb-1">
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <p className="text-xs text-red-400 font-medium">Connection failed</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{xmtpError}</p>
                    </div>
                  </div>
                </div>
              )}
              {walletConnected ? (
                <button
                  onClick={onXmtpConnect}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-[#f5a623]/5 border border-[#f5a623]/20 text-sm transition-colors hover:bg-[#f5a623]/10"
                >
                  <svg className="w-4 h-4 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-[#f5a623] font-medium">{xmtpError ? 'Retry Connection' : 'Enable Messaging'}</p>
                    <p className="text-[10px] text-gray-500">Sign with your wallet to activate</p>
                  </div>
                </button>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-[#f5a623]/5 border border-[#f5a623]/20 text-sm transition-colors hover:bg-[#f5a623]/10"
                    >
                      <svg className="w-4 h-4 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                      </svg>
                      <div className="text-left">
                        <p className="text-xs text-[#f5a623] font-medium">Connect Wallet</p>
                        <p className="text-[10px] text-gray-500">Required for encrypted messaging</p>
                      </div>
                    </button>
                  )}
                </ConnectButton.Custom>
              )}
            </SidebarSection>
          )}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

---

## Task 3: Update ConnectXMTP Component (Messages Page)

**Files:**
- Modify: `src/components/messages/ConnectXMTP.tsx`

- [ ] **Step 1: Add wallet connection UI**

Replace the entire component to support both states (no wallet vs wallet connected):

```typescript
'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface ConnectXMTPProps {
  isConnecting: boolean;
  error: string | null;
  onConnect: () => void;
}

export function ConnectXMTP({ isConnecting, error, onConnect }: ConnectXMTPProps) {
  const { isConnected: hasWallet } = useAccount();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f5a623]/20 to-[#f5a623]/5 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Private Messaging</h2>
      <p className="text-sm text-gray-400 max-w-sm mb-2">
        End-to-end encrypted messaging powered by XMTP. DM other ZAO members or create private group chats.
      </p>
      <p className="text-xs text-gray-600 max-w-sm mb-6">
        Connect your wallet to create your messaging identity. Your wallet address becomes your XMTP identity.
      </p>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-900/30 text-red-400 text-xs rounded-lg max-w-sm">
          {error}
        </div>
      )}

      {hasWallet ? (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="flex items-center gap-2 px-6 py-3 bg-[#f5a623] text-black font-medium rounded-xl hover:bg-[#ffd700] transition-colors disabled:opacity-50"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Setting up messaging...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Enable Messaging
            </>
          )}
        </button>
      ) : (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="flex items-center gap-2 px-6 py-3 bg-[#f5a623] text-black font-medium rounded-xl hover:bg-[#ffd700] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update MessagesRoom to use wallet-based connect**

In `src/components/messages/MessagesRoom.tsx`, update `handleConnect` to use wallet:

Import:
```typescript
import { useWalletXMTP } from '@/hooks/useWalletXMTP';
```

Add hook and update handler:
```typescript
  const walletXmtp = useWalletXMTP();

  const handleConnect = useCallback(async () => {
    if (walletXmtp.canConnect) {
      await walletXmtp.connectWalletToXMTP();
    }
  }, [walletXmtp]);
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

---

## Task 4: Restore canMessage for Wallet-Based Discovery

Now that XMTP identity = wallet address, `canMessage` works naturally. Restore proper canMessage checks.

**Files:**
- Modify: `src/contexts/XMTPContext.tsx`

- [ ] **Step 1: Restore canMessage in checkZaoMembers**

Find the `checkZaoMembers` function. Replace the current simplified reachability check:
```typescript
          reachable: !!(m.storedXmtpAddress || m.lastLoginAt),
```

With proper canMessage:
```typescript
          reachable: reachableSet.has(idx),
```

And add back the canMessage logic before the mapping. After building the `merged` array, add:
```typescript
      const allAddresses: string[] = [];
      const addrToMemberIdx = new Map<string, number>();
      for (let i = 0; i < merged.length; i++) {
        for (const addr of merged[i].addresses) {
          const normalized = addr.toLowerCase();
          if (!addrToMemberIdx.has(normalized)) {
            allAddresses.push(normalized);
            addrToMemberIdx.set(normalized, i);
          }
        }
      }

      const reachableSet = new Set<number>();
      const reachableAddr = new Map<number, string>();
      if (allAddresses.length > 0) {
        try {
          const { IdentifierKind } = await import('@xmtp/browser-sdk');
          const BATCH_SIZE = 100;
          for (let i = 0; i < allAddresses.length; i += BATCH_SIZE) {
            const batch = allAddresses.slice(i, i + BATCH_SIZE);
            const identifiers = batch.map((addr) => ({
              identifierKind: IdentifierKind.Ethereum,
              identifier: addr,
            }));
            const results = await xmtpClient.canMessage(identifiers);
            for (const [addr, canMsg] of results.entries()) {
              if (canMsg) {
                const idx = addrToMemberIdx.get(addr.toLowerCase());
                if (idx !== undefined && !reachableSet.has(idx)) {
                  reachableSet.add(idx);
                  reachableAddr.set(idx, addr.toLowerCase());
                }
              }
            }
          }
        } catch (err) {
          console.error('[XMTP] canMessage check failed:', err);
        }
      }
```

And update the xmtpAddress field:
```typescript
          xmtpAddress: reachableAddr.get(idx) || m.storedXmtpAddress || m.addresses[0] || null,
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

---

## Verification

After all tasks are complete:

- [ ] Run `npm run build` — must pass
- [ ] Test: Without wallet connected, sidebar shows "Connect Wallet" button
- [ ] Test: Connect wallet → sidebar shows "Enable Messaging" button
- [ ] Test: Click Enable Messaging → MetaMask signature popup → XMTP connected
- [ ] Test: Other members with wallet-based XMTP show in Messageable list
- [ ] Test: DMs show correct sender names (not "Unknown")
- [ ] Test: Reset Messaging → clears state → can re-enable with wallet
