---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: 2232, 863, 2099
original-query: "what if we had ppl pay in crypto but then gave them whop subscriptions, like use Unlock - spec the bridge"
tier: STANDARD
---

# 2233 - Unlock -> Whop crypto-access bridge (spec, grounded in ZAO's existing Unlock code)

> **Goal:** Spec Zaal's idea - pay in crypto (Unlock), get community/subscription access
> (Whop) - grounded in the Unlock integration ZAO ALREADY runs, and checked against the
> alternative (does it even need Whop?).

## The one-paragraph version (Founder read)

A person pays in crypto by buying an **Unlock key** (an on-chain membership NFT on Base
that ZAO owns the lock for). ZAO already knows how to check "does this wallet hold the
key" - that exact code ships today in `src/lib/unlock/lock.ts`. The bridge is: on a key
purchase, ZAO grants that person access to the paid surface. If the paid surface is a Whop
community (for the clipper campaigns), ZAO calls Whop's API to comp them a membership. The
crypto door stays **ZAO-owned and on-chain**; Whop is used only where it earns its keep.

## Grounded: ZAO already runs Unlock (this is an EXTENSION, not new integration)

Per `confirm-before-claiming-absence`, verified in-repo:
- `src/lib/unlock/lock.ts:37` - `hasValidKey(lockAddress, wallet) -> boolean` (on-chain key check on Base).
- `src/lib/unlock/lock.ts:56` - `findKeyHolder(lockAddress, wallets[]) -> address | null`.
- `src/app/api/events/verify-ticket/route.ts` - resolves fid -> Farcaster custody + verified
  ETH addresses (Neynar), checks the event's lock on Base, gates recordings/perks (doc 863).
- `src/app/api/events/create/route.ts` - events carry `lock_address` + `unlock_event_url` on
  Base (`chain_id` default 8453); the Unlock collectible is a projection of the canonical row.

So ZAO already has: a lock model, on-chain key verification, and fid->wallet resolution. The
bridge reuses `hasValidKey`/`findKeyHolder` verbatim - the "crypto paid, do they have access"
half is DONE. Only the "grant the downstream surface" half is new.

## The bridge (two directions - recommend Unlock-first)

**Unlock-first (recommended, ZAO owns the door):**
1. ZAO deploys/owns an Unlock **membership lock** on Base (crypto price in ETH/USDC/CLAWD).
2. A person buys a key (crypto). ZAO detects it - either the existing on-chain check
   (`hasValidKey`) on access, or an Unlock webhook / key-purchase event.
3. ZAO grants the downstream surface. If that surface is Whop: call the **Whop memberships
   API** to comp/grant a membership (grounded in doc 2232: Whop exposes `membership.activated`
   webhooks + `memberships.addFreeDays` / checkout / metadata). Store the Unlock-key <-> Whop-
   membership mapping so revocation stays in sync (key expires -> deactivate Whop access).

**Whop-checkout-with-crypto (NOT recommended as the primary):** Whop already accepts crypto
at checkout, but that puts the money door on Whop's rail (fees, off-chain Whop Credits, their
KYC). It's the opposite of ZAO-owned. Use only as a fallback for non-crypto-native buyers.

## Check twice (feedback_check_alternatives_oss_first): does it even need Whop?

The honest question the OSS-first rule forces: **the Unlock key alone is already an access
token ZAO owns.** ZAO's `verify-ticket` pattern already gates content by key-holding with NO
Whop. So:
- If the ONLY reason to be on Whop is its **clipper-campaign backend** (doc 2232), then bridge
  to Whop for that surface specifically - and keep the money door on Unlock.
- If ZAO can gate the clipper community with its OWN surfaces (the existing Unlock verify-ticket
  gate + Farcaster/Discord roles + the ZAO app), then it may NOT need Whop for access at all -
  Unlock + ZAO gating is the fully-owned, zero-fee path. Whop then earns its place only if its
  clipper campaign UX + payout ops are worth ~7-10% vs building on POIDH (doc 2232 phase-2).

Recommendation: **Unlock is the access rail regardless.** Whop is an OPTIONAL downstream the
bridge can grant into - adopt it only for the clipper backend, and keep the door ZAO-owned so
leaving Whop later costs nothing.

## Effort / risk (honest)

- **Low-new-code:** the on-chain half exists (`lock.ts`). New = a small grant-on-key service +
  the Whop API call + a mapping table + expiry sync. A few files, not a platform.
- **Gated (Zaal's):** deploying a paid Unlock lock (on-chain, money), holding a Whop API key,
  and any real payout are money/platform/on-chain - NOT autonomous. This doc is the design.
- **Risk:** key<->membership sync drift (expired key still has Whop access) - handle via the
  expiry check on the Unlock side as source of truth, re-verified with `hasValidKey`.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| DECISION: is Whop's clipper backend worth bridging into, or gate the clipper community with ZAO's own Unlock+Farcaster surfaces (no Whop)? | @Zaal | Decision (gated) | 2026-08-10 |
| If bridging: deploy a ZAO membership Unlock lock on Base (crypto price) - money/on-chain, Zaal-run | @Zaal | Gated | 2026-08-12 |
| Spec/build the grant-on-key service reusing `lock.ts hasValidKey` + Whop memberships API (design ready here; build is PR-only, keys gated) | @Zaal (Claude) | PR when greenlit | after decision |
| Review in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- ZAO in-repo (FULL): `src/lib/unlock/lock.ts` (hasValidKey :37, findKeyHolder :56),
  `src/app/api/events/verify-ticket/route.ts`, `src/app/api/events/create/route.ts`,
  `src/lib/unlock/events.ts`. Verified by grep 2026-08-06.
- Unlock Protocol (MIT, on-chain memberships on Base) + Whop memberships API/webhooks - doc 2232 (FULL).
- Doc 863 (Unlock ticket gating), doc 2099 (events canonical registry). [in-repo]

## Also See

- [Doc 2232](../2232-whop-clippers-incentives-oss-alternatives/) - the Whop vs OSS/on-chain decision this implements.
