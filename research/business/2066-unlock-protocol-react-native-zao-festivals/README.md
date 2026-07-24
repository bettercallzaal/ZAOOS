---
topic: business
type: research
status: research-complete
last-validated: 2026-07-24
superseded-by:
related-docs: 863, 1507
original-query: "Unlock Protocol integration options for the zao-festivals React Native / Expo (SDK 57) mobile app — sell the $50 pro ticket tier as an onchain time-bound NFT membership, reusing the existing Reown AppKit (WalletConnect v2 / SIWE) wallet infra. Report on RN SDK support, mint/checkout flow, chain overlap, gas cost, EVENTS check-in reality, and whether it's shippable before Oct 3 2026."
tier: STANDARD
---

# 2066 — Unlock Protocol on React Native (zao-festivals mobile app)

> **Goal:** Decide *how* to add an Unlock Protocol NFT membership (the paid "$50 pro ticket" tier) to the **zao-festivals Expo SDK 57 app**, which already has wallet-connect + SIWE via **Reown AppKit (WalletConnect v2)**. This is the mobile-integration layer under the strategic decision already made in **[Doc 863](../863-unlock-protocol-event-ticketing/)** (use EVENTS by Unlock Labs on Base).

## TL;DR recommendation

**Ship the hosted path, not a custom in-app mint — for Oct 3, 2026.** Create the ZAOstock paid tier as a lock on **events.unlock-protocol.com** (Base), open the hosted checkout in an **in-app browser / deep link** from the Expo app (the wallet the user already connected via Reown can sign there, or they pay by card), and check people in with Unlock's built-in **Verifier**. This needs **zero custom React Native web3 code** and reuses everything. Building a native in-app `purchase()` mint is *technically feasible* with the app's existing viem/wagmi stack, but it adds real scope and does **not** solve the actual blocker (see "The real blocker" below), so it is not worth it before Oct 3.

---

## The six questions, answered

### 1. Is there a JS/TS SDK usable from React Native?

**Yes, but it's the wrong tool for this app.** `@unlock-protocol/unlock-js` exists and is maintained (part of the `unlock` monorepo). It exposes two classes:

- **`Web3Service`** — read-only queries against Unlock/PublicLock contracts.
- **`WalletService`** — sends txns / signs; e.g. `walletService.purchaseKey({ lockAddress }, {}, cb)`.

**The catch:** unlock-js is built on **ethers**, and Unlock's docs make **no claim of React Native support**. ethers in Expo/RN needs shims (`crypto.getRandomValues` via `react-native-get-random-values`, `Buffer`, stream polyfills). That's the classic RN web3 friction.

**Why it doesn't matter here:** the app is already on **Reown AppKit's wagmi adapter (viem)**, not ethers. Reown AppKit for React Native ships **both** a wagmi adapter (`@reown/appkit-wagmi-react-native`) and an ethers adapter — the app uses wagmi. So the clean path is to **skip unlock-js entirely** and call the lock contract directly with **viem `writeContract`**, using the ABI from **`@unlock-protocol/contracts`** (`@unlock-protocol/unlock-abi-*`). No ethers, no shims, no second web3 stack. This is the only place unlock-js would have earned its keep, and viem already does it.

### 2. Mint/checkout flow — hosted UI or direct contract call?

**Both are possible. Two real options:**

**(a) Hosted checkout (recommended).** Unlock/EVENTS auto-generates a landing page + checkout hosted at `app.unlock-protocol.com` / `events.unlock-protocol.com`. From Expo you open it in an in-app browser (`expo-web-browser`) or deep-link. It handles wallet connect (WalletConnect, so the same wallets), **and** offers the credit-card path. **Zero custom mint code.**

**(b) Direct contract call (native, no webview).** Because the app already holds a connected signer via Reown, you can call PublicLock's **`purchase()`** directly:

```
purchase(uint[] values, address[] recipients, address[] referrers, address[] keyManagers, bytes[] data)
```

- **Free lock:** `values = [0]`, just gas.
- **Native-priced (ETH on Base):** send `value`.
- **ERC-20-priced (e.g. USDC):** an **`approve()`** on the token must precede `purchase()` (2 txns).
- `recipients = [connectedAddress]`, `referrers`/`keyManagers` can be zero-address, `data = ["0x"]`.

Via viem: `writeContract({ address: lock, abi: publicLockAbi, functionName: 'purchase', args: [...], value })`. Doable in ~a day of RN work **if** you accept crypto-only payment.

### 3. Which chain — does it overlap with ZAO's?

**Perfect overlap: Base (chainId 8453).** Unlock is deployed on Base (Unlock factory `0xd0b14797b9D08493392865647384974470202A78`). The ZAO ecosystem already lives on **Base** — the 188-member gate, and Doc 863 already fixed Base as the network for ZAO event locks. Same chain, same wallets, cheap gas. No new-chain decision needed. (Confirm the app's Reown AppKit config includes the Base chain — it should, given the ZAO footprint; cross-ref [Doc 1507](../../technology/1507-privy-auth-pivot-decision/) on the app's auth/chain direction.)

### 4. Gas / deployment cost for one Lock

**Cents to low single digits on Base.** `createLock` now deploys a **minimal EIP-1167 proxy** (not a full contract), so deployment is cheap. Base fees run **~$0.01–0.10** for typical txns; a proxy `createLock` lands in the low-cents-to-~$1 range depending on L1 data fee at the time. A `purchase()` mint is a normal NFT mint (~$0.01–0.10). For a single event, lock creation cost is a rounding error — the organizer wallet pays it once. (If you use the hosted EVENTS app, it deploys the lock for you in the same cheap range.)

### 5. Does the EVENTS check-in app work today, and what's day-of like for a volunteer?

**Yes, it works today. Two check-in modes:**

- **Any phone camera (view-only):** aim any phone at the ticket QR → opens a browser page showing ticket validity. Simple, but it **only views** status — it does not mark the ticket used, so it can't stop re-use on its own.
- **Verifier (the real one):** the organizer adds volunteers as **approved verifiers**; they open the EVENTS app on a smartphone and scan. "Scanning a ticket from the verifier confirms its authenticity" **and** checks the ticket in, **preventing reuse**. QR codes are emailed to attendees and "cannot be forged."

**Volunteer day-of:** a non-technical volunteer needs a smartphone, to be added as a verifier by Zaal beforehand, and to be logged into the EVENTS app. Then it's point-camera-at-QR → green/red. No special hardware, no crypto knowledge required at the gate. This is the strongest reason to use the hosted EVENTS product rather than hand-rolling check-in.

### 6. Bottom line — shippable before Oct 3, 2026 for a volunteer team?

**The hosted path is easily shippable; the custom-mint path is over-scope.**

- **Lightweight path (recommended):** create the paid tier as a lock on events.unlock-protocol.com (Base), link/deep-link to it from the app, use the Verifier at the gate. **No RN code, ships in an afternoon**, and gives you card payment for free.
- **Custom in-app mint:** feasible on the existing viem/wagmi stack (~1–3 days), but adds error-handling, approve-flow, and testing surface — and does not fix the real problem.

---

## The real blocker (name it explicitly)

Selling a **$50** tier **onchain** means the buyer pays in **crypto (ETH/USDC on Base)** — which **excludes most ZAOstock attendees**, who are ordinary festival-goers without a Base wallet holding $50 of USDC. There are only two ways around this, both from Doc 863:

1. **Unlock credit-card checkout** — needs **Stripe Connect KYC** (bank + identity, multi-day approval) and adds **~13% all-in fees** (Stripe 2.9%+$0.30 **plus** Unlock's ~10% surcharge). Only lives in the **hosted** checkout, which is another reason the hosted path wins.
2. **Keep the $50 tier as crypto-only on Base** — cleanest technically, but realistically only a handful of crypto-native attendees will use it.

So the honest framing for Zaal: the mobile SDK question (Q1–Q4) is the *easy* part. The decision that actually matters is **payment rail** — if you want non-crypto people to buy the $50 tier, you need the hosted checkout + Stripe Connect KYC started **now** (multi-day), and a custom in-app mint doesn't help. If the $50 tier is intentionally crypto-native (a "pro/holder" membership for the onchain crowd), then a direct in-app `purchase()` is a clean, cheap fit and the app already has the wallet.

## Recommended path for Oct 3

1. **Decide the payment rail first** (crypto-only vs. card) — this drives everything. If card: **start Stripe Connect KYC this week.**
2. Create the ZAOstock paid tier as a **lock on events.unlock-protocol.com**, network **Base**, time-bound to the event window (Unlock keys support expiration).
3. From the Expo app, add a **"Get Pro ticket"** button that opens the hosted checkout via `expo-web-browser` (reuses the connected wallet for crypto, or card for everyone else). Keep the **free RSVP flow native** as-is.
4. Add 2–3 volunteers as **Verifiers**; dry-run the scan loop before the gate opens.
5. **Only** build a native in-app `purchase()` mint later, if a crypto-native "holder tier" UX justifies it (viem `writeContract` on the existing stack — no unlock-js, no ethers shims).

## Sources

- [Unlock.js docs — Web3Service / WalletService / purchaseKey](https://docs.unlock-protocol.com/tools/unlock.js) [FULL]
- [Unlock PublicLock `purchase()` API](https://unlock-protocol.gitbook.io/unlock/developers/smart-contracts/lock-api) [FULL — purchase signature + ERC20 approve note]
- [`@unlock-protocol/unlock-js` on npm](https://www.npmjs.com/package/@unlock-protocol/unlock-js) [FULL]
- [Unlock Deploying Locks (createLock → proxy)](https://docs.unlock-protocol.com/core-protocol/public-lock/deploying-locks) [FULL]
- [How To Sell NFT Tickets for an Event (EVENTS + Verifier check-in)](https://unlock-protocol.com/guides/how-to-sell-nft-tickets-for-an-event/) [FULL]
- [Unlock deployed to Base L2 (factory `0xd0b1…A78`)](https://unlock-protocol.com/blog/base) [PARTIAL — via search summary]
- [Reown AppKit React Native — wagmi + ethers adapters](https://docs.reown.com/appkit/react-native/core/installation) [PARTIAL — via search summary]
- [Base network fees ($0.01–0.10 typical)](https://docs.base.org/base-chain/network-information/network-fees) [PARTIAL — via search summary]
- [Doc 863 — Unlock Protocol for ZAO Event Ticketing](../863-unlock-protocol-event-ticketing/) [FULL — parent decision: EVENTS on Base, Stripe fiat fees + KYC]
- zao-festivals app context: Expo SDK 57 + Reown AppKit (WalletConnect v2 / SIWE) [from directive]
