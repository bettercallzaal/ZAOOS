# 121 — Lens V3 Auth Verdict: Can We Post Server-Side?

> **Status:** Research complete — BLOCKER IDENTIFIED
> **Date:** March 24, 2026
> **Goal:** Determine if ZAO OS can post to Lens without client-side wallet signing

## TL;DR — NO SERVER-ONLY POSTING PATH EXISTS

**Lens V3 requires a wallet signature to authenticate. Period.** There is no server API key, no app-level posting, no way to bypass wallet signing entirely.

However, **"signless mode" exists** — the user signs ONCE to delegate the Lens API as an executor, then all future posts happen without wallet popups. But that initial signature MUST come from the wallet that owns the Lens account.

## The Blocker for ZAO OS

| What we need | What Lens requires |
|-------------|-------------------|
| Post from server-side after user connects in Settings | User must sign with the **specific ETH wallet** that owns their Lens profile |
| User logged in via Farcaster (SIWF) — different wallet | Lens SDK uses wagmi `useWalletClient()` which returns whatever wallet is active |
| User has Phantom (Solana) connected via RainbowKit | Lens needs an ETH wallet (Rabby, MetaMask, etc.) |

**The core problem:** ZAO OS users log in via Farcaster (not ETH wallet). Their Lens profile is on a different ETH wallet. The Lens SDK needs that specific wallet to sign.

## What "Signless" Actually Means

1. User signs ONE transaction with their Lens-owning wallet
2. This delegates the Lens API as an "account manager" (on-chain)
3. After that, the Lens API can post on their behalf without further signatures
4. The SDK `post()` action works without `handleOperationWith(walletClient)` — the API handles it

**But step 1 is unavoidable.** The user MUST sign with the correct ETH wallet at least once.

## Options for ZAO OS

### Option A: Require ETH Wallet Connection (Recommended if we keep Lens)
1. Add a separate "Connect ETH Wallet" step in Lens settings (using RainbowKit)
2. User switches to their Rabby/MetaMask wallet
3. Sign once → enableSignless → tokens stored
4. Future posts work server-side via stored tokens

**Effort:** 2-4 hours. **UX:** Annoying — user must switch wallets.

### Option B: Defer Lens to Phase 2 (Recommended)
1. Remove Lens from cross-posting for now
2. Ship Bluesky (working), X (ready), Hive (ready)
3. Add Lens properly later when we have better wallet management
4. Focus on platforms that work TODAY

**Effort:** 30 minutes to disable. **UX:** Clean — no broken features.

### Option C: Manual Token Entry (Worst UX)
1. User goes to Hey.xyz, logs in, extracts tokens from browser DevTools
2. Pastes tokens in ZAO OS settings
3. Server uses tokens to post

**Effort:** 1 hour. **UX:** Terrible — only for developers.

## Recommendation: OPTION B — Defer Lens

Lens cross-posting has consumed ~8 hours of debugging across multiple attempts. The fundamental blocker (wallet mismatch) won't be solved without better wallet management.

**Ship what works:**
- Bluesky: ✅ Working (already cross-posting)
- X/Twitter: ✅ Ready (admin-only, env vars)
- Hive: ✅ Ready (posting key stored)
- Lens: ❌ Defer — needs dedicated wallet connection flow

**Come back to Lens when:**
1. We add proper multi-wallet management (Sprint 5+)
2. Or Lens adds app-level posting (unlikely)
3. Or we build a dedicated "Connect ETH Wallet for Lens" flow

## Sources

- [Lens Authentication](https://lens.xyz/docs/protocol/authentication) — all auth requires wallet signing
- [Lens Sponsored Transactions](https://www.lens.xyz/docs/best-practices/gasless/sponsored-transactions) — signless requires initial wallet signature
- [Lens V3 GitHub](https://github.com/lens-protocol/lens-v3) — account manager delegation is on-chain
- Doc 117, 120 — previous research attempts
