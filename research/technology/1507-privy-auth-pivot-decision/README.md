---
topic: technology, auth
type: decision
status: DECIDE
last-validated: 2026-07-18
related-docs: 282-privy-auth-fishbowlz-integration, 283-privy-embedded-wallets-fishbowlz-token-mechanics
board-task: 5162944e (Handoff: Privy embedded-wallet auth pivot → wallet-connect + Hats on Base)
action-owner: Zaal
original-query: "Privy embedded-wallet auth was fully built+merged then Zaal rejected holding keys - pivoted to wallet-connect (Reown AppKit + SIWE) + Hats on Base. Top task: decide whether to remove merged Privy code now or leave dormant until wallet-connect replaces it."
tier: STANDARD
---

# 1507 — Privy Auth Pivot: What Was Done, What Remains, What to Decide

> **DECISION:** Two distinct Privy code paths exist. One (user-facing embedded wallet) was already REPLACED — the pivot is complete. The other (agent server wallets for VAULT/BANKER/DEALER) is DORMANT but still correct — leave it until there's a replacement. Details below.

---

## What Was Rejected vs. What Remains

| Privy code | Package | File | Status | Action needed |
|-----------|---------|------|--------|---------------|
| User-facing embedded wallet (`PrivyProvider`, `usePrivy`) | `@privy-io/react-auth` | None — never in package.json | **REPLACED.** The pivot (RainbowKit + SIWE) is already live in `src/components/gate/WalletLoginButton.tsx`. | None. Already done. |
| Agent server wallets (VAULT, BANKER, DEALER) | `@privy-io/node` | `src/lib/agents/wallet.ts` | **DORMANT** — code exists, wallets not yet actively used. No cost if no API calls made. | See decision below. |

---

## The Pivot That Already Happened (User Auth — COMPLETE)

The rejected thing was **Privy embedded wallets for users** — where Privy would generate and custodize a wallet for each ZAO OS user. Zaal's objection was correct: ZAO should not hold users' keys.

**The replacement is already built and deployed:**
- `src/components/gate/WalletLoginButton.tsx` — RainbowKit + wagmi + `viem/siwe`
- `src/app/api/auth/siwe/route.ts` — SIWE verify endpoint
- `src/components/gate/LoginButton.tsx` — combines SIWF (primary) + WalletLoginButton (secondary)

Users bring their own wallets (MetaMask, Coinbase, WalletConnect, etc). ZAO never touches their keys. **No action needed here — this is done.**

---

## The Remaining Decision: Agent Wallets

`src/lib/agents/wallet.ts` manages TEE-secured server wallets for three named agents:

| Agent | Purpose | Env var |
|-------|---------|---------|
| VAULT | Long-term treasury custody | `VAULT_WALLET_ID` |
| BANKER | Operational fund routing | `BANKER_WALLET_ID` |
| DEALER | Trade execution, on-chain actions | `DEALER_WALLET_ID` |

These wallets are on Base (`eip155:8453`). Privy holds the keys in a TEE (Trusted Execution Environment) — ZAO never sees the raw private key, and Privy's policy engine enforces spending limits, contract allowlists, and time windows before signing.

**Why this is different from the rejected thing:** Privy holds the AGENT's keys, not any user's keys. The "ZAO holding user keys" concern doesn't apply here.

---

## Decision: Remove Now or Leave Dormant?

### Arguments for removing now

| Argument | Weight |
|----------|--------|
| Clean codebase — no dormant/unused dependencies | LOW — `@privy-io/node` is one package and one file; cleanup is marginal |
| Privy billing — if any wallets were created, they may count toward MAU | LOW — `@privy-io/node` doesn't incur cost unless active API calls are made. Check the Privy dashboard for any active wallet IDs. |
| Signal clarity — removes ambiguity about whether Privy is a ZAO dependency | MEDIUM — valid if the team wants a clean break |

### Arguments for leaving dormant

| Argument | Weight |
|----------|--------|
| No replacement exists for VAULT/BANKER/DEALER agent signing | HIGH — removing creates a gap without filling it |
| The agent wallet architecture is still correct for Sparkz / agentic economy | HIGH — these agents are core to the Sparkz fee-split and treasury model |
| Privy TEE is a stronger security model than raw private keys in env vars | HIGH — any replacement needs to match this security model |
| Zero cost if wallets are dormant (no active API calls) | MEDIUM — confirms leaving is free |

### Recommendation: LEAVE DORMANT

Do not remove until there is a clear replacement plan for VAULT/BANKER/DEALER agent signing. The risk of removing active infrastructure code without a replacement outweighs the marginal cleanliness benefit.

**If Zaal wants to cut the Privy dependency entirely:** the replacement options are:
1. **Raw private keys in env vars** — `DEALER_PRIVATE_KEY` etc. Simple but no TEE protection; private key must be managed carefully.
2. **Turnkey** — another TEE-based server signer (API-compatible with Privy's flow), Stripe-owned like Privy, similar trust model.
3. **Safe (multi-sig on Base)** — VAULT/BANKER as a Safe multisig. Zaal signs operations directly. No third-party key custody. High sovereignty, higher transaction friction.
4. **Reown AppKit Server** — Reown has server-side signing; less mature than Privy's node SDK.

None of these are installed. Until one is chosen and built, leave `wallet.ts` in place.

---

## Separate Task: Hats on Base Migration

The Hats Protocol integration (`src/lib/hats/client.ts`) currently targets **Optimism** (`optimism` chain). The board task says "Hats on Base."

Current:
```ts
// src/lib/hats/client.ts
import { optimism } from 'viem/chains';
// ...HatsClient({ publicClient: createPublicClient({ chain: optimism }) })
```

To migrate to Base: change `optimism` → `base` and update `HAT_IDS` in `src/lib/hats/constants.ts` to reflect Base-deployed hat tree IDs (if any hat tree has been deployed on Base — verify first).

**This is a separate task from the Privy decision.** Hats handles authorization (who has which role); Privy handles transaction signing. They are independent.

---

## Current Full Auth Stack (July 18, 2026)

| Path | Auth method | Wallet | Key custody |
|------|-------------|--------|-------------|
| User login via Farcaster | SIWF (`@farcaster/auth-kit`) | Farcaster custody wallet | User + Farcaster |
| User login via wallet | SIWE (RainbowKit + viem) | User's external wallet | User |
| Agent authorization | Hats Protocol (`@hatsprotocol/sdk-v1-core`, Optimism) | N/A (read-only check) | N/A |
| Agent signing (VAULT/BANKER/DEALER) | Privy TEE (`@privy-io/node`) — DORMANT | Privy-managed server wallets | Privy TEE |

---

## Also See

- [Doc 282 - Privy auth for FISHBOWLZ](../../identity/282-privy-auth-fishbowlz-integration/) — original Privy research; the `@privy-io/react-auth` path researched here was NOT implemented in ZAO OS V1 (only `@privy-io/node` was)
- [Doc 283 - Privy embedded wallets + smart wallets](../../identity/283-privy-embedded-wallets-fishbowlz-token-mechanics/) — deeper dive into Privy wallet mechanics; background context

## Sources

- Live codebase audit (2026-07-18): `src/components/gate/WalletLoginButton.tsx`, `src/app/api/auth/siwe/route.ts`, `src/lib/agents/wallet.ts`, `src/lib/hats/client.ts`, `package.json`
- Privy dashboard check (confirm no active wallet MAU before full removal)
