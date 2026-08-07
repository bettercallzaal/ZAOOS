---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-07
related-docs: 2234, 2232, 2233, 1534
original-query: "spec the x402 agent-payable funding endpoint over POIDH's existing escrow (doc 2234 next action)"
tier: STANDARD
---

# 2242 - x402 -> POIDH funding endpoint (spec)

> **Goal:** The design for doc 2234's #1 adopt: an HTTP-402 endpoint that lets an AGENT
> (ZOE, a partner bus, a script) fund or settle a POIDH bounty programmatically - a thin
> layer over POIDH's EXISTING canonical escrow (doc 1534). Spec only; build follows a
> Zaal greenlight because everything money-shaped here is gated.

## The one-paragraph version

Today a POIDH bounty is funded by a human clicking on poidh.xyz. This endpoint adds a
machine door: a caller hits `POST /api/bounties/fund`, gets back a **402 Payment
Required** carrying x402 payment instructions (the coinbase/x402 standard, Apache-2.0),
pays in USDC over HTTP, and the server - after verifying the payment - funds the POIDH
bounty on Base (optionally swapping USDC -> ZABAL first). ZOE can then top up a clip
bounty from a budget, or a federation partner (the tasern lane) can fund a ZAO bounty,
with a receipt emitted for every step. POIDH's contract stays untouched - it is already
the canonical, 4-round-tested escrow; we only automate the FUNDING of it.

## Route shape (api-routes.md conventions)

`src/app/api/bounties/fund/route.ts` - POST only.

```ts
const fundSchema = z.object({
  bountyId: z.string().min(1).max(100),        // existing POIDH bounty (Base)
  amountUsdc: z.number().positive().max(10_000), // hard cap per call
  swapToZabal: z.boolean().default(false),      // optional USDC->ZABAL leg
  memo: z.string().max(280).optional(),
});
```

Flow (two-phase, per the x402 standard):
1. **Unpaid request** -> `402` + the x402 `accepts` payment-requirements body (chain
   Base, asset USDC, amount, payTo = the ZAO funding wallet, nonce).
2. **Paid request** (x402 `X-PAYMENT` header) -> verify via an x402 facilitator (or
   local verification), then execute: (a) optional Uniswap-v3 exactInput USDC->ZABAL
   with minOut slippage (the leftclaw pattern, doc 2234), (b) fund the POIDH bounty,
   (c) emit a receipt (receipts.ts + the trust chain: the funding action is receipted,
   the receipt is what a partner's reputation can cite).
3. Response: `NextResponse.json({ success, data: { bountyId, txHash, funded } })`.

Auth model (pre-merge-security-and-suite.md - explicit): the 402 flow IS the auth for
payment (a valid on-chain payment is the credential), but the route still requires an
allowlisted CALLER identity (session OR a bus-partner token mapped via the zao-bus auth
model) so random internet traffic cannot even reach the quote step. Errors sanitized;
service keys never in responses; the funding wallet key NEVER in this route's env on
the public app - execution happens through a separate signer service (gated).

## What is explicitly NOT built here

- **No new escrow.** POIDH's contract is canonical (doc 1534, 4 rounds). This endpoint
  only automates funding it. (Doc 2234's core finding - reuse beats rebuild.)
- **No autonomous spend.** ZOE calling this endpoint with real funds requires the
  budget + wallet gates Zaal controls. The endpoint enforces per-call caps; the signer
  service enforces a daily cap (cost-governance pattern).

## GATED (Zaal's, every one)

| Item | Why gated |
|------|-----------|
| The ZAO funding wallet + signer service | holds/spends funds |
| Real x402 payments on (facilitator config) | money flow |
| Deploying the route to prod | live route + money path |
| ZOE's budget to auto-fund bounties | autonomous spend policy |
| The USDC->ZABAL swap leg (slippage params) | on-chain trade |

## Build plan (when greenlit - each PR-only)

1. Route + Zod + 402 quote (no execution) + tests - safe, no money moves.
2. Payment verification against an x402 facilitator (testnet first).
3. Signer service (separate, gated env) + POIDH funding call + receipts.
4. Swap leg last (optional).

## Sources

- Doc 2234 (leftclaw x402 adopt - the finding this specs), doc 1534 (POIDH = canonical
  escrow), docs 2232/2233 (the clipper/incentive thread this funds). [FULL, in-repo]
- coinbase/x402 (Apache-2.0, 137 stars - gh api verified 2026-08-06): the HTTP-402
  payments standard. leftclaw-services (MIT): the working reference. [FULL]

## Also See

- [Doc 2234](2234-leftclaw-x402-poidh-bounty-funding/) - the adopt decision this implements.
