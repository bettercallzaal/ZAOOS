---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-06-17
superseded-by:
related-docs: 863
original-query: "DEEP tier. Best architecture for ZAO time-boxed live-claim event tickets using Unlock Protocol. Two ticket types: (1) Lu.ma RSVP ticket - lock created when Lu.ma event is created, URL embedded in Lu.ma, driven by Lu.ma API + Guest Registered webhook; (2) live proof-of-attendance claim - Unlock lock gated by password-required-hook with secret revealed in-stream, claim page open only for the talk duration, hosted/embedded at collect.thezao.com via Magnetiq, with a live ping to Magnetiq attendees. Research Lu.ma API, Unlock password-hook + time-box mechanics, POAP comparison, Magnetiq surface, trigger sequencing. Builds on doc 863."
tier: DEEP
---

# 865 — Unlock-First Live-Claim Tickets (Lu.ma manual, Magnetiq deferred)

> **Goal:** Decide the architecture for ZAO event tickets driven entirely from Unlock Protocol on Base - a free RSVP ticket plus a time-boxed, secret-gated "you were here live" claim - without paying for the Lu.ma API and without blocking on Magnetiq.

## Key Decisions

| Decision | Call | Why |
|----------|------|-----|
| Source of truth | **Unlock, NOT Lu.ma** | Zaal's call 2026-06-17. Lu.ma API can create/update events + has native webhooks, BUT requires Lu.ma Plus (paid). Skip it. |
| Lu.ma role | **Manual listing.** Create the Lu.ma by hand, paste the Unlock claim URL into the description | Zero API cost. Lu.ma stays a discovery surface only. |
| Collectible protocol | **Unlock on Base. SKIP POAP** | POAP entered maintenance mode 2026-03-16 (no new drops) and is Gnosis-only. Unlock is active, on Base (where ZAO lives), keys are ERC-721 you can gate perks with. |
| Two locks per event | **(A) RSVP lock (free, open) + (B) live-claim lock (time-boxed + secret)** | Different proofs: RSVP = intent; live-claim = attendance. The live-claim is the valuable July build-eligibility signal. |
| Live-claim gating - v1 | **password-required-hook (secret revealed in stream) + manually close the claim page at talk end** | Ships now, zero custom Solidity. One hosted claim page we open/close. |
| Live-claim gating - v2 | **ONE custom `onKeyPurchase` hook combining password check + `block.timestamp` window** | Unlock allows only ONE hook per lock, so password + time must live in the same contract. On-chain enforced window, no manual close. |
| Per-talk secret | **Fresh lock per event (you deploy one per event anyway) or `setSigner` per event** | password-required-hook has NO multi-password rotation (open issue #1, unimplemented). One signer per lock per event is fine. |
| Key properties | **`expirationDuration = 0` (permanent) + soul-bound (non-transferable)** | Proof-of-attendance must not expire and must not be resellable. |
| Claim host surface | **ZAO OS (`/events/[slug]` - built in doc 863 / PR #864). NOT blocked on Magnetiq** | We control it today. collect.thezao.com does not exist yet and Magnetiq has zero public API. |
| Magnetiq | **DEFER + VERIFY** | Use for the live "it's on now" ping IF Tyler's platform supports embed + API. See open flag below. |

## Findings

### Lu.ma API (why we skip it)
- The API CAN create events (`POST /v1/events/create`), update them (`POST /v1/events/update`, description is updatable), and has NATIVE webhooks (`event_created`, `guest_registered`, `guest_updated`, `ticket_registered`, etc., managed via `/v2/webhooks/create`).
- BUT all API access requires **Lu.ma Plus (paid)**. Rate limits: 200 req/min (Calendar key) / 500 req/min (Org key).
- Decision: not worth a subscription for what a manual paste does. The auto-create-on-Lu.ma flow from the original query is dropped.

### Unlock time-box + secret mechanics (Base)
- **password-required-hook**: password -> keccak256 -> derived private key -> signer address; lock manager calls `setSigner(lock, signerAddress)`; the frontend signs the recipient address with the password-derived key and passes the signature as `data` in `purchase()`. The hook recovers the signer and compares. Direct contract calls can't bypass it. Source: the repo, FULL.
- **No password rotation**: only one signer per lock (issue #1 open since 2023, no PR). Per-talk uniqueness = a new lock (or a new `setSigner`) per event. Fine - we deploy one lock per event regardless.
- **One hook per type per lock** (confirmed, Unlock guide). So you CANNOT run password-required-hook AND a separate time-window hook on the same lock. To enforce the window on-chain, write ONE custom `onKeyPurchase` hook that does both: verify the password signature (copy the hook's logic) AND `require(block.timestamp >= start && block.timestamp <= end)`.
- **Time-boxing options ranked:**
  1. Off-chain: open/close the hosted claim page (v1, no Solidity). Simplest.
  2. On-chain manager toggle: lock manager caps/uncaps sales via the dashboard (e.g. set max keys to 0). Manual, no custom code.
  3. Custom combined hook (v2): on-chain `[start,end]` window. Trustless, no manual close.
- **Permanent + soul-bound**: `expirationDuration = 0` for non-expiring keys; set non-transferable for attendance integrity. Unlock publishes a "Proof of Attendance with Unlock" guide (POAP is trademarked, Unlock calls them Attendance NFTs).
- Gas on Base: not officially itemized; Base L2 = cents range for deploy + claim (confirm on basescan when we have the contract).

### POAP vs Unlock (decisive)
| Dimension | POAP | Unlock |
|-----------|------|--------|
| Status 2026 | Maintenance mode since 2026-03-16, no new drops | Active |
| Chain | Gnosis only | Base (+ Eth, OP, Arbitrum, Polygon, Gnosis) |
| Secret-word claim | Yes (POAP Home app) | Yes (password-required-hook) |
| Time window | Yes (start/end, but ~24h curation review) | Yes (page toggle or custom hook), instant, permissionless |
| Gates perks later | Weak (external verify) | Native (ERC-721, gate Discord/Telegram/site) |
| Soul-bound | Not native | Supported |

POAP's ~24h curation review alone kills same-stream distribution. Unlock wins on every axis for ZAO on Base.

### Magnetiq (OPEN FLAG - verify before relying)
- **Brand discrepancy:** magnetiq.io is documented as owned by **Koinema Srl (Bologna, Italy)**; Tyler Stambaugh is not listed on its public materials. The ZAO brand glossary records Magnetiq as "founded by Tyler Stambaugh." These may be different products, or the public site lags. VERIFY with Tyler which Magnetiq this is before integrating.
- **collect.thezao.com returns NXDOMAIN** - the surface does not exist yet. It would have to be set up.
- magnetiq.io has **zero public API, webhook, embed, or push-notification docs**. Pricing EUR 690-1270/event or EUR 270-570/month.
- Conclusion: Magnetiq cannot be designed against today. Self-host the claim on ZAO OS now; revisit Magnetiq for the live-ping only if Tyler confirms embed + API + room-push. The Tyler outreach message is drafted (clipboard 2026-06-17).

### Codebase ground truth
- We already shipped the ticketing base in doc 863 / PR #864: `src/lib/unlock/lock.ts` (viem `getHasValidKey` on Base), `src/app/api/events/verify-ticket/route.ts`, `src/app/events/[slug]/page.tsx`, `events` table migration. The live-claim adds a claim page + (v2) a custom hook on top of this.

## Recommended trigger flow (Unlock-first)

1. **Per event, deploy a live-claim lock on Base** (EVENTS by Unlock Labs or dashboard): price 0, `expirationDuration = 0`, non-transferable, attach password-required-hook, `setSigner` from this talk's secret.
2. **Make the Lu.ma by hand**, paste the claim URL in the description.
3. **Host the claim page on ZAO OS** (`/events/[slug]/claim`) - opens only during the talk window (v1: feature-flag/time check in the page; v2: the on-chain hook enforces it).
4. **Reveal the secret in-stream** at start and end. Only listeners can mint.
5. **Close the window** (v1: hide the page; v2: `block.timestamp` past end auto-blocks).
6. **Gate perks** (recording, July eligibility) by reading the key with the existing `verify-ticket` endpoint.
7. **(Later)** If Tyler confirms Magnetiq embed + API, mirror the claim there + use Magnetiq for the live room ping.

## Also See

- [Doc 863 - Unlock Protocol event ticketing](../../business/863-unlock-protocol-event-ticketing/) (the base build, PR #864)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Send Tyler the Magnetiq capability questions (drafted in clipboard) | @Zaal | Outreach | This week |
| Verify which Magnetiq (Koinema vs Tyler's) ZAO actually uses | @Zaal | Verify | Before any Magnetiq build |
| Build v1 live-claim page on ZAO OS (`/events/[slug]/claim`, password-hook + manual close) | @Team | PR | Next event |
| Spike v2 combined onKeyPurchase hook (password + time window) on Base | @Team | Spike | After v1 ships |
| Deploy first live-claim lock for the weekend event (price 0, expiry 0, soul-bound) | @Zaal | Hosted-app | This weekend |

## Sources

- [Lu.ma API help](https://help.luma.com/p/luma-api) [FULL] - API is Lu.ma Plus only; auth tiers; rate limits
- [Lu.ma webhooks help](https://help.luma.com/p/webhooks) [FULL] - native webhook event types
- [Lu.ma docs llms.txt](https://docs.luma.com/llms.txt) [FULL] - endpoint listing (events/create, events/update)
- [Lu.ma API reference pages](https://docs.luma.com/reference/authentication) [FAILED - JS-rendered, needs Playwright; endpoints corroborated via llms.txt]
- [Unlock password-required-hook repo](https://github.com/unlock-protocol/password-required-hook) [FULL] - setSigner, signature flow
- [Unlock password-hook rotation issue #1](https://github.com/unlock-protocol/password-required-hook/issues/1) [PARTIAL - title confirms no multi-password support; no PR]
- [Unlock checkout configuration](https://docs.unlock-protocol.com/tools/checkout/configuration) [FULL] - one-hook-per-type constraint
- [Unlock password-protected memberships guide](https://unlock-protocol.com/guides/password-protected-nft-memberships/) [FULL]
- [Unlock how-to-do-POAPs-with-Unlock guide](https://unlock-protocol.com/guides/how-to-do-poaps-with-unlock/) [FULL] - Attendance NFTs
- [Unlock networks (Base support)](https://docs.unlock-protocol.com/core-protocol/unlock/networks/) [FULL]
- [PublicLock contract reference](https://docs.unlock-protocol.com/core-protocol/public-lock/) [FAILED - 404 on sub-paths; exact on-chain sale-toggle function names unconfirmed, verify via Unlock Discord/basescan]
- [POAP distribution methods](https://help.poap.xyz/en/articles/5812140-poap-distribution-methods-101) [FULL] - secret word, mint links, QR
- [POAP drop setup (time window)](https://help.poap.xyz/en/articles/5802657-how-do-i-set-up-a-poap-drop) [FULL]
- [POAP maintenance-mode announcement](https://x.com/poapxyz/status/2032182456481202614) [FULL - official, 2026-03-16]
- [The Defiant: POAP moves to maintenance mode](https://thedefiant.io/news/nfts-and-web3/poap-moves-to-maintenance-mode-as-founders-eye-next-generation-of-digital-collectibles) [FULL - community/news source]
- [magnetiq.io](https://magnetiq.io) [FULL - Koinema Srl owned, no API/embed docs, EUR pricing]
- [collect.thezao.com](https://collect.thezao.com) [FAILED - NXDOMAIN, domain not registered]
- ZAO OS codebase: `src/lib/unlock/lock.ts`, `src/app/api/events/verify-ticket/route.ts` [FULL - shipped in doc 863 / PR #864]
