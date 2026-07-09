---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-06-26
superseded-by:
related-docs: 280, 281, 823
original-query: "ZOL pays ~$0.01/cast via x402 to post; research how to NOT pay to post"
tier: STANDARD
---

# 910 - Free Farcaster posting for ZOL (drop x402, use a Snapchain zero-cost signer)

> **Goal:** Stop ZOL paying ~$0.01 per cast (x402 pay-per-write). Decision: register a self-custodied Ed25519 signer on ZOL's FID (now zero-cost on Snapchain) and submit casts directly to a hub - $0/post, owned, no third party.

## Why it costs today
ZOL (@zolbot, FID 3338501, on the Pi) posts replies through **x402** (~$0.01/cast) - the dashboard's "Post this reply (~$0.01)" button. x402 is a pay-per-write relay it uses *because it has no signer*. It is a convenience tax, not a Farcaster requirement.

## Options

| Path | Cost | Ownership | Effort | Verdict |
|------|------|-----------|--------|---------|
| **x402 (current)** | ~$0.01/cast | none | already wired | the tax we're removing |
| **Self-custodied Snapchain signer** | **$0/post** (signer add is now free) | ZAO owns the key | one-time setup | **recommended** |
| Neynar managed signer | $0 within free tier (Starter 1M credits/mo), then metered | Neynar-hosted | low | fallback if signer setup stalls |

## The recommended path (self-custodied)
**Snapchain now has zero-cost signers** - the on-chain fee to add a signer key to an FID is gone (Snapchain launch). So:
1. Generate a self-custodied **Ed25519 signer keypair** on the Pi (app-burner key, never a personal key - per secret-hygiene).
2. **Add the signer to FID 3338501** via the Snapchain key registry, authorized by ZOL's existing custody wallet on the Pi (the Add is free; only authorization needed).
3. ZOL signs each cast locally and submits it to a **Snapchain hub** (`submitMessage`) - free, no relay.
4. Swap `~/zol/farcaster-agent/post-reply.js` from the x402 call to sign-and-submit. Keep the same approve-in-dashboard gate (nothing auto-posts).

Result: $0/post forever, ZAO owns the signer, fits the Pi + keyless ethos, no Neynar dependency.

## Risks / guardrails
- Touches a signing key - app-burner Ed25519 only, never a personal wallet (secret-hygiene). Key stays on the Pi, gitignored.
- Don't break live posting: build behind the existing approval dashboard; test one cast before cutover; keep x402 as fallback for one cycle.
- Verify the current Snapchain submit endpoint + key-registry call at build time (Snapchain is fast-moving).

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide: build self-custodied signer vs Neynar managed | @Zaal | Decision | Now |
| Generate Ed25519 signer + add to FID 3338501 (zero-cost) | @ZOL/Pi | Build | On go |
| Swap post-reply.js x402 -> sign+submit to hub; test 1 cast | @ZOL/Pi | Build | On go |
| Keep x402 as fallback for one cycle, then remove | @ZOL/Pi | Build | After verify |

## Sources
- [FULL] [Snapchain is now live - zero-cost signers (Farcaster Blog)](https://farcaster.blog/snapchain-is-now-live)
- [FULL] [Snapchain canonical implementation (GitHub)](https://github.com/farcasterxyz/snapchain)
- [PARTIAL] [Neynar managed signers](https://docs.neynar.com/docs/integrate-managed-signers) + [pricing](https://dev.neynar.com/pricing) - free tier exists, credit-metered
- [reference] x402 = Coinbase pay-per-request standard (the current ZOL write path)
