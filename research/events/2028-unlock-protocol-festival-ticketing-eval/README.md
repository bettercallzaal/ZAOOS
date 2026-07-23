# Unlock Protocol for ZAOstock Ticketing — RN/Expo Integration Eval (Oct 3, 2026)

**Doc 2028** · events · 2026-07-23 · Type: TECH-EVAL
**For:** `bettercallzaal/zao-festivals` (Expo SDK 57, Reown AppKit / WalletConnect v2, SIWE)
**Question:** Can we sell the existing "$50 pro ticket" tier as an on-chain NFT membership via Unlock Protocol instead of a normal payment, reusing the app's existing wallet-connect infra, and is it shippable by a small volunteer team before Oct 3, 2026?

**Bottom line:** Yes — but **do NOT build custom RN minting code.** Use Unlock's **hosted Events page + hosted Checkout link** (a URL you open in a WebView / external browser), deployed on **Base** (chain the ZAO ecosystem already uses). Day-of check-in is a **browser-based verifier page**, non-technical-volunteer-friendly. Custom in-app minting via a direct `purchase()` contract call is *possible* with the wallet the app already has, but it's a scope trap for a volunteer team and buys almost nothing over the hosted link. **Recommended path: hosted, no-code, ~1 day of setup.**

---

## 1. Is there a JS/TS SDK usable from React Native?

**Package: [`@unlock-protocol/unlock-js`](https://www.npmjs.com/package/@unlock-protocol/unlock-js)** (v0.51.2 as of Jul 2026). It's the official wrapper around the Unlock + PublicLock contract ABIs.

- Two classes: `web3Service` (read-only queries) and `walletService` (send tx / sign). Also talks to Unlock's hosted backend "**locksmith**" for off-chain bits (metadata, credit-card purchases). [[docs]](https://docs.unlock-protocol.com/tools/unlock.js)
- It is designed for **node.js + browser front-ends**. The docs do **not** claim React Native support, and it is built on **ethers** (you `walletService.connect(provider, wallet)` with an ethers provider). React Native is not a first-class target.

**Verdict for RN:** `unlock-js` is *not* the clean path in Expo. It expects an ethers provider, while our app is on **Reown AppKit → wagmi/viem**. Two realistic in-app options if we ever wanted native minting:
   - **(a) Skip `unlock-js` entirely** and call the `PublicLock.purchase()` function directly with **viem/wagmi `writeContract`** (the ABI is published in [`@unlock-protocol/contracts`](https://www.npmjs.com/package/@unlock-protocol/contracts)). This reuses the connected wallet the app already has — no new provider, no ethers, no RN polyfill fight. This is the *only* sane "native mint" route.
   - **(b) `unlock-js` + ethers-in-RN** — requires shimming ethers/crypto in Metro (`react-native-get-random-values`, etc.). Extra dependency + polyfill maintenance for no functional gain. **Not recommended.**

> **Key point:** For our stack, "the SDK" is a red herring. If we mint in-app at all, it's a direct viem `writeContract` to `purchase()`, not `unlock-js`. But see §6 — we probably shouldn't mint in-app at all.

## 2. Mint / checkout flow — hosted UI or direct contract call?

**Both exist. The hosted flow is the intended one.**

- **Hosted Checkout** ([app.unlock-protocol.com/checkout](https://docs.unlock-protocol.com/tools/checkout/)) is a web app that mints the membership/ticket NFT. Organizers build it no-code via the **Checkout Builder** in the Unlock Dashboard (deploy Lock → configure checkout visually → get a **shareable URL** or embed config). It can be distributed as a plain link (email/Discord/QR) **or embedded in another web app**.
- **Credit card support is built in**: Unlock Inc. (via locksmith/Stripe) charges the card and delivers the NFT to the buyer — so a **$50 ticket buyer does NOT need crypto or even a wallet of their own** to complete purchase. [[credit-card blog]](https://unlock-protocol.com/blog/credit-card-nft) This matters a lot for a general-audience free-festival crowd.
- **Direct contract call**: `PublicLock.purchase(...)` mints a key from an already-connected wallet. It takes purchase args (price/recipient/referrer/keyManager/data) and returns tokenIds; passing the exact key price is a safety guard against a price change mid-tx. [[PublicLock API]](https://docs.unlock-protocol.com/core-protocol/smart-contracts-api/PublicLock) This is what we'd wire to viem if we wanted native minting.

**For an Expo app:** the pragmatic integration is **open the hosted checkout URL in a WebView / in-app browser** (or external browser + deep link back). No custom contract code, credit-card path included for free. Native `purchase()` only makes sense if we want a fully in-app crypto-native UX — a much bigger lift for marginal benefit.

## 3. Which chain(s)? Overlap with ZAO?

Unlock is deployed on **12+ networks** incl. Ethereum, Polygon, Gnosis, Optimism, Arbitrum, and **Base**. [[networks]](https://docs.unlock-protocol.com/core-protocol/unlock/networks/) [[Base launch]](https://unlock-protocol.com/blog/base)

**ZAO ecosystem chain map** (from `research/cross-platform/1628-zao-multichain-architecture-guide/`, `src/lib/agents/types.ts`, `community.config.ts`):
- **Base (chainId 8453)** = ZAO's **identity + commerce layer** — ZABAL/SANG tokens, $ZAO soulbound identity, ZOUNZ DAO, ZAO Music NFTs, ZAOstock's own on-chain bits (wavewarz-base contracts).
- **Optimism** = governance (ZOR, OG Respect, OREC).
- **Solana** = WaveWarZ battle settlement.

**→ Deploy the Lock on Base (8453).** Perfect overlap with the layer ZAO already uses for commerce + identity, low fees, same chain the festival's other on-chain pieces live on. No new chain to introduce.

## 4. Rough gas to deploy a Lock on Base

- A "Lock" is a `PublicLock` ERC-721 minted from the Unlock **factory** (`createLock`). Unlock uses a **template + EIP-1014 CREATE2** pattern so deploying a lock costs **~15% of a naive full-contract deploy**. [[deploying locks]](https://docs.unlock-protocol.com/core-protocol/public-lock/deploying-locks)
- On **Base** (L2, gas typically sub-cent to a few cents per typical tx), a one-time `createLock` for a single event is **cheap — on the order of pennies to ~$1**, not a meaningful cost. (No official fixed Base figure published; estimate from the factory/template design + Base fee levels. Confirm live on the Dashboard at deploy time.)
- It's a **one-time** cost per event/tier. Minting keys is paid by buyers (or, for CC purchases, netted out of the fiat charge).

## 5. Day-of check-in — does the Events app actually work, and is it volunteer-usable?

**Yes, and it's genuinely simple.**

- Unlock's **Events product** ([app.unlock-protocol.com/event](https://app.unlock-protocol.com/event)) lets you deploy an event contract, sell NFT tickets, and run check-in with QR codes. Supports paid or free events and optional **RSVP approval** (organizer approves attendees). [[introducing tickets]](https://unlock-protocol.com/blog/introducing-tickets) [[RSVP approval]](https://unlock-protocol.com/blog/rsvp-event-approval)
- **Attendee** shows a **QR code** from the Unlock keychain/ticket page (contains their public key + a signed lock address).
- **Verifier** is a **web page that works in any browser** — a volunteer opens the verifier URL on a phone, scans the attendee's QR with the camera, and the page confirms validity. Checking in **marks the NFT "used"** (metadata only the lock owner/designated verifier can set), preventing re-entry / passed-back tickets. [[checking key in]](https://unlock-protocol.com/blog/checking-key-in) Optional [tokenproof](https://unlock-protocol.com/guides/tokenproof/) integration exists but isn't needed.
- **Volunteer reality:** designate the gate volunteer(s) as verifiers in the dashboard once; day-of they open one URL, point the camera at each QR, watch for green/valid. No app install strictly required, no wallet needed to *verify* (verifier authorization is set up ahead of time). This is well within a non-technical volunteer's ability with a 2-minute briefing.

## 6. Bottom-line recommendation

**Shippable before Oct 3 — via the lightweight hosted path, not custom RN code.**

**Recommended (do this):**
1. In the Unlock **Dashboard**, deploy a Lock on **Base** for the "$50 pro ticket" tier (time-bound to the event window). One-time, ~pennies.
2. Use the **Events / Checkout Builder** to generate a **hosted checkout URL** with **credit-card + crypto** enabled (so non-crypto buyers can still pay $50 by card).
3. In the Expo app, the "$50 pro ticket" button **opens that hosted URL** in a WebView / in-app browser (buyers with the app's connected wallet can pay in crypto; everyone else pays by card). Keep the existing free RSVP flow untouched.
4. Day-of: designate 1–2 gate volunteers as **verifiers**; they use the **browser verifier page** to scan QR codes.

This is **~1 day of no-code setup + a small WebView screen**, reuses Base (already in the stack), and gives us Unlock's fraud-prevention + check-in for free.

**Not recommended for this timeline:** building native in-app minting (`unlock-js` in RN, or hand-rolled viem `purchase()` calls + custom QR verifier). It's technically doable with the wallet the app already has, but it's real engineering + testing for a volunteer team and delivers no attendee-facing benefit over the hosted link. Revisit only if a fully crypto-native, no-webview UX becomes a hard product requirement later.

**One open question for Zaal** (money/UX tradeoff, not a blocker): Unlock's credit-card path routes the $50 through Unlock Inc./Stripe (their fee + settlement) rather than straight to a ZAO wallet — acceptable for the convenience of letting non-crypto attendees buy, or do we want card money to land in a ZAO Stripe/bank account directly (in which case keep the existing payment rail for card and use Unlock only for the crypto/NFT-membership buyers)?

---

## Sources

- [`@unlock-protocol/unlock-js` (npm)](https://www.npmjs.com/package/@unlock-protocol/unlock-js) · [Unlock.js docs](https://docs.unlock-protocol.com/tools/unlock.js) · [`@unlock-protocol/contracts`](https://www.npmjs.com/package/@unlock-protocol/contracts)
- [Checkout docs](https://docs.unlock-protocol.com/tools/checkout/) · [PublicLock API](https://docs.unlock-protocol.com/core-protocol/smart-contracts-api/PublicLock) · [Deploying Locks](https://docs.unlock-protocol.com/core-protocol/public-lock/deploying-locks)
- [Networks](https://docs.unlock-protocol.com/core-protocol/unlock/networks/) · [Unlock on Base](https://unlock-protocol.com/blog/base)
- [Unlock Events app](https://app.unlock-protocol.com/event) · [Introducing Tickets](https://unlock-protocol.com/blog/introducing-tickets) · [Checking a key in (verifier)](https://unlock-protocol.com/blog/checking-key-in) · [RSVP approval](https://unlock-protocol.com/blog/rsvp-event-approval) · [Credit card support](https://unlock-protocol.com/blog/credit-card-nft) · [tokenproof + Unlock Events](https://unlock-protocol.com/guides/tokenproof/)
- ZAO chain map: `research/cross-platform/1628-zao-multichain-architecture-guide/`, `src/lib/agents/types.ts`, `community.config.ts`

**Related:** 1628 (ZAO multichain architecture), 1494 (ZAOstock artist booking), 1508 (ZAOstock Eventbrite launch — current ticketing rail), 1659 (ZAOstock sponsor activation).
