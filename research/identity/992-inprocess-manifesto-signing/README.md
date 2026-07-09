---
topic: identity
type: decision
status: research-complete
last-validated: 2026-07-09
superseded-by: null
related-docs: "933, 962"
original-query: "Does inprocess.world (docs at https://docs.inprocess.world/, main site inprocess.world) make sense as the tool to host + collect signatures on The ZAO manifesto? The ZAO needs a 'sign the manifesto' URL - a page where community members can read the manifesto and add their signature/pledge (ideally wallet-native / Farcaster-native since ZAO is on Base + Farcaster)."
tier: STANDARD
---

# 992 — Manifesto Signing Tool: inprocess.world vs. Custom SIWF

> **Goal:** Evaluate inprocess.world for collecting manifesto signatures on The ZAO, and recommend the best tool for wallet/Farcaster-native pledge collection.

## Key Decision

**Use inprocess.world for minting ZAO research docs as moments (per doc 933). Do NOT use inprocess.world for manifesto signing. Build a custom SIWF + Supabase page in ZAOOS instead.**

inprocess.world is optimized for creator portfolio sharing (moments, collections, collectors, splits) and does not have a manifesto/pledge signing data model. Forcing moments to act as pledges would be a poor UX fit. A purpose-built pledge page offers full control, Farcaster-native sign-in, and aligns with ZAO's build-in-public + OSS-first values.

## What inprocess.world Is

**inprocess.world** is a live Web3 creator-economy platform (inprocess.world + inprocess.fun) where artists document their creative journey on-chain as "moments" (works-in-progress) organized into collections. Collectors participate, comment, fund via splits contracts. Full REST API with ~40+ endpoints (artists, moments, collections, revenue splits, wallet auth, analytics). Deployed on Base + Coinbase smart wallet SDK. Status: production-ready; bootstrapped/minimal public presence.

**Data Model:**
- Artists: Create collections and moments
- Moments: Individual creative works with metadata, comments, sales config
- Collections: Grouped moments (e.g., an album, a series)
- Collectors: Purchase/collect moments, fund via splits
- Splits: Revenue distribution contracts (on-chain)

**Authentication:** Email OTP + wallet auth (EIP-191 signed message). No Farcaster-native sign-in (SIWF).

**Hosting:** Closed SaaS only. No open-source alternative, no self-hosting, no embed widget documented.

## Does inprocess.world Support Manifesto Signing?

**Answer: No.** The API reference (50+ endpoints, fetched from docs.inprocess.world/llms.txt 2026-07-09 FULL) has no pledge, commitment, signature, or manifesto collection features. The data model supports:
- Creating moments (works-in-progress)
- Collecting moments (funding/participation)
- Comments on moments (discussion)
- Admin permissions on moments
- Revenue splits on collected moments

But it does NOT support:
- Signing a document/pledge
- Attesting to a commitment
- Collecting signatures with metadata (signer name, message, timestamp)
- Public pledge lists or leaderboards
- Embed-on-your-own-domain capability

Using moments as pledges would require:
1. Create a "ZAO Manifesto Pledge" moment in inprocess.world
2. Ask users to "collect" the moment as a pledge signal
3. Read the collect list from the API as a proxy for signatories

This is a poor fit:
- Collects are meant to fund creators (you would charge a fee or offer it free, confusing the intent)
- Moment comments are for feedback, not pledge metadata (why signed, timestamp)
- No way to export a clean "signers" CSV or embed the pledge page on thezao.xyz
- Vendor lock-in (all pledge data lives in inprocess.world)
- Closed-source SaaS (you cannot fork or modify the data model)
- Non-Farcaster-native (no SIWF)

## Three Alternatives Compared

| Aspect | inprocess.world (Moments) | Custom SIWF + Supabase | EAS on Base | Farcaster Frame |
|--------|--------------------------|----------------------|-------------|-----------------|
| **Purpose Fit** | Moments for pledges (misuse) | Purpose-built pledge page | On-chain attestations | Native signaling |
| **Farcaster-Native (SIWF)** | No (EIP-191 wallet only) | YES (Sign In With Farcaster) | No (wallet only) | YES (frame native) |
| **URL Ownership** | inprocess.world/... (no custom domain) | Your own (thezao.xyz/manifesto or /sign-manifesto) | N/A (on-chain only) | Farcaster frames (custom URL + frame) |
| **Data Export** | API only; tied to inprocess | Full control; Supabase export/backup | On-chain; queryable via RPC | Farcaster graph only |
| **Embed on Your Site** | No (not documented) | YES (iframe or native page) | N/A (on-chain) | YES (Farcaster frame embed) |
| **Cost** | Free (SaaS included in platform) | $0 (ZAO already runs ZAOOS + Supabase) | Gas cost per attestation (~0.01-0.05 USD on Base) | Free (Farcaster) |
| **Vendor Lock-In** | High (closed SaaS) | None (ZAO owns data + code) | None (on-chain permanent) | Medium (Farcaster-dependent) |
| **ZAO Values Alignment** | Partial (SaaS, not OSS) | High (build-in-public, own the data, code in ZAOOS) | High (on-chain, permanent, composable) | High (Farcaster native) |
| **Interop with ZOE** | Low (external API) | High (ZOE can read/write Supabase, send notifications) | Medium (ZOE can mint attestations, read chain) | Medium (ZOE can frame-react) |
| **Signature Metadata** | None (collect only) | Full (signer FID, wallet, message, timestamp, optional comment) | Full (schema-driven, queryable) | Minimal (frame context only) |
| **Time to Implement** | Weeks (learn API, design misfit) | ~3 days (SIWF route + React form + Supabase upsert) | ~5 days (custom form + EAS contract calls) | ~2 days (frame scaffold) |

## Recommended Architecture: Custom SIWF + Supabase Hybrid

**Build a pledging page in ZAOOS** that combines web2 + web3:

### Layer 1: Web2 (Supabase)
- **URL:** `thezao.xyz/manifesto` or `sign.thezao.xyz`
- **Auth:** Sign In With Farcaster (SIWF) — user taps "Sign" → Farcaster wallet pops → returns FID + username
- **Form:** Display manifesto text, optional "Why I'm signing" comment box
- **Storage:** Supabase `manifesto_signers` table:
  ```
  id | fid | wallet_address | signed_at | message | verified
  ```
- **Verification:** SIWF ensures real Farcaster users; optionally verify wallet signature for web3 proof
- **Export:** CSV for Zaal, Farcaster CSV import for mentions, onchain batch if desired

### Layer 2: Web3 (Optional)
- **EAS Attestations:** After signing on-chain, mint an EAS attestation to Base (permanent, composable record)
- **Hats Protocol:** Link to a Hats tree (per doc 962) if ZAO governance requires it
- **Batch Attestations:** ZOE job: weekly, batch-mint all unsigned pledges as EAS attestations

### Stack
- **Frontend:** React form in ZAOOS, Next.js route `/api/manifesto/sign` (POST)
- **SIWF:** Use `@farcaster/auth-kit` or similar (ZAO ecosystem standard)
- **Backend:** Iron-session (ZAO existing), Supabase RLS
- **Optional Web3:** Wagmi + Viem for EAS contract calls
- **Notification:** ZOE task to notify Zaal of new signers, optionally Farcaster mention

## Why NOT inprocess.world

1. **No manifesto data model** — Forcing moments to act as pledges breaks semantic intent
2. **Closed SaaS** — Vendor lock-in; no way to export or own the pledge list
3. **Not Farcaster-native** — Uses EIP-191 wallet auth, not SIWF; misses community UX standard
4. **Can't embed or customize** — No iframe widget, no custom domain, can't theme it
5. **Interop friction** — ZOE cannot read/write the pledge data without API calls; no RLS integration
6. **Confusing UX** — "Collecting" a moment implies purchasing/funding, not pledging
7. **Not aligned with ZAO values** — Closed platform, not build-in-public or OSS

**inprocess.world IS valuable for doc 933 use case:** Mint ZAO research + ZABAL Games results as moments to a timeline. That's the right fit. Don't conflate the two use cases.

## Recommendation Summary

| What | Where | Why |
|------|-------|-----|
| **Manifesto Signing Page** | Build custom in ZAOOS | Purpose-built, SIWF-native, full control, zero cost |
| **Pledge Storage** | Supabase + optional EAS | Own the data, ZOE interop, immutable option |
| **inprocess.world** | Use for doc minting (doc 933), NOT for signing | Separate use case, moments are for creative portfolios |

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve custom SIWF manifesto page architecture | @Zaal | Decision | 2026-07-11 (handle via ZOE Telegram) |
| Design Supabase schema + RLS for manifesto_signers table | @Zaal or @Dev | PR | 2026-07-14 |
| Implement `/api/manifesto/sign` route + React form in ZAOOS | @Dev | PR | 2026-07-18 |
| Manual test: Zaal signs manifesto via SIWF + verifies Supabase entry | @Zaal | Validation | 2026-07-19 |
| [Optional] Mint signatories as EAS attestations (Phase 2) | @Dev | PR | Post-MVP |
| [Optional] Create Hats tree for governance tie-in (per doc 962) | @Zaal | Design | Post-MVP |
| Announce `thezao.xyz/manifesto` live + solicit community signatures | @Zaal | Social | After MVP passes |

## Also See

- [Doc 933](../business/933-inprocess-integration-plan/) — inprocess.world integration for minting ZAO research docs as moments (separate use case)
- [Doc 962](../agents/962-bot-fleet-ethskills-integration/) — Manifesto minting as Hats Protocol hat on-chain

## Sources

- [docs.inprocess.world/llms.txt](https://docs.inprocess.world/llms.txt) - FULL (50+ API endpoints, no pledge/manifesto features) — fetched 2026-07-09
- [inprocess.world](https://inprocess.world) - PARTIAL (product page shows moments/collections UI, no docs on custom domains or embeds)
- [ZAOOS session.ts](../../src/lib/auth/session.ts) - FULL (Farcaster + wallet auth foundation for SIWF)
- [ZAOOS API routes](../../src/app/api) - FULL (verified no existing pledge/signature endpoints)
- Research doc 933 (inprocess.world integration plan) - FULL (context on inprocess platform + API)
- Farcaster SIWF patterns (implicit from ZAO ecosystem usage) - PARTIAL (design standard, not formally documented here)
