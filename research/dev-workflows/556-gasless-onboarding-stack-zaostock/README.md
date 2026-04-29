---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-04-29
related-docs: 548, 549, 551, 557
tier: STANDARD
---

# 556 - Gasless Onboarding Stack for ZAOstock RSVP + ZABAL First-Stake + Cipher Mint

> **Goal:** Pick the gasless transaction stack for three concrete ZAO surfaces - ZAOstock RSVP, ZABAL first-stake, Cipher (ZAO Music release #1) mint. Specifically: who pays, how much, what code change is required, what happens if quota runs out.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Use **Coinbase Smart Wallet + CDP Paymaster** as primary gasless stack on Base | **YES** | $15K free Base Gasless Campaign credits + 0.25 ETH free on Paymaster activate. Native Base. 15M+ gasless tx, 50+ apps live. RPC method standardized: `wallet_sendCalls` with `paymasterService` capability. |
| Use **Privy gas-sponsorship** as secondary (where Privy embedded wallets already in use) | **YES** | If a flow already uses Privy (per Doc 548 / 549), adding gas sponsorship is a Privy dashboard toggle + `useSponsoredTransaction` hook. No new infra. |
| Use **Pimlico** (10% surcharge) or **Stackup** (USD-billed) | **NOT YET** | Coinbase + Privy cover ZAOstock + Cipher; reach for Pimlico/Stackup only if we hit quota or need cross-chain (Optimism, Arbitrum). |
| Use **ZeroDev** for ERC-20 paymaster (USDC-paid gas) | **DEFER** | Useful for ZAO Music drops where buyers pay in USDC; revisit once Cipher pricing is finalized. |
| Subsidize gas across ALL surfaces | **NO** | Sub-budget per surface. RSVP = unlimited gasless (cost: minimal, RSVP ~21K gas). Stake = first-stake gasless only (re-stakes user pays). Cipher mint = gasless on first 188 ZAO holders, paid afterward. |

## What ZAO Has Today (Verified 2026-04-29)

| Surface | Wallet stack | Gasless? |
|---|---|---|
| ZAO OS V1 main chat | iron-session + Neynar (Farcaster) + custom wagmi | **No** |
| `/stake` page | wagmi + viem | **No** |
| ZAOstock RSVP | TBD (in spinout repo per memory `project_zaostock_spinout`) | **No** |
| Cipher mint (ZAO Music) | TBD; likely Privy or Coinbase Smart Wallet | **No** |
| FISHBOWLZ legacy | Privy (per `project_fishbowlz_status`, paused) | n/a |

So gasless is a net-new capability for live ZAO surfaces.

## Stack Comparison

### Coinbase Smart Wallet + CDP Paymaster (Recommended Primary)

**Verified 2026-04-29:**

| Field | Value |
|---|---|
| Free credits on signup | 0.25 ETH free + Base Gasless Campaign up to $15K (eligible apps) |
| Production usage | 15M+ gasless tx, 50+ apps |
| ERC-20 gas (USDC-paid) | Yes, supported |
| RPC method | `wallet_sendCalls` with `capabilities.paymasterService.url` |
| SDK | `@base-org/account` |
| Allowlist control | Per-contract + per-function allowlist in CDP dashboard |
| Network | Base mainnet + Base sepolia |
| Free for users? | Yes (paymaster URL pays) |

**Concrete setup (5 steps):**

1. Sign up at Coinbase Developer Platform (CDP)
2. `Onchain Tools > Paymaster` to get service URL
3. Set contract+function allowlist (e.g. `RSVP.rsvp(uint256)`, `StakeVault.stake(uint256)`, `Cipher.mintFirst188()`)
4. `npm install @base-org/account` in ZAO repo
5. Replace existing `writeContract` calls with `wallet_sendCalls + paymasterService` capability

**Spend cap:** CDP's "built-in policy enforcement" - exact cap UI not documented in fetched content; verify on dashboard sign-up. Use a proxy on the paymaster URL to prevent leaks.

### Privy Gas Sponsorship (Recommended Secondary)

Per Doc 548 deep dive (`packages/auth/src/privy/features/gas-sponsorship/`):

| Field | Value |
|---|---|
| Hook | `useSponsoredTransaction()` |
| Setup | Enable in Privy Dashboard + fund gas tank |
| Coverage | Any EVM chain Privy supports |
| Cost model | Self-funded gas tank; Privy takes a fee on top per their gas-policy terms |
| Best for | Surfaces already using Privy embedded wallets |

**When to choose Privy:** if the surface uses Privy auth already (e.g. Lazer-scaffolded mini app per Doc 548). Reuses existing wallet creation.

### Pimlico (Defer)

| Field | Value |
|---|---|
| Pricing | actualGasCost * 1.1 (10% surcharge) |
| Billing | Monthly invoice (offchain in USD) |
| Stack | Verifying paymaster, ERC-4337 |

**When to choose:** cross-chain (OP, Arb, etc.) or when we want a stable 10% markup vs Coinbase's free-credits-then-pay model.

### Stackup (Defer)

| Field | Value |
|---|---|
| Pricing | Pay-as-you-go, USD-billed monthly based on actual gas at tx time |
| Stack | ERC-4337 |

**When to choose:** similar role to Pimlico; pick whichever has better UX after a real trial.

### ZeroDev (Defer to Cipher)

| Field | Value |
|---|---|
| Differentiator | ERC-20 paymaster - users pay gas in USDC instead of ETH |

**When to choose:** if Cipher mint is priced in USDC and we want users to pay all-in (mint + gas) in one token.

## ZAO Surface Plan

### ZAOstock RSVP (per memory `project_zaostock_spinout` - critical this week)

- **Stack:** Coinbase Smart Wallet + CDP Paymaster
- **Cost expectation:** RSVP = ~21K-50K gas, on Base ~$0.001-0.005 per RSVP
- **Budget:** unlimited gasless within Base Gasless Campaign credits ($15K covers ~3M-15M RSVPs)
- **Allowlist:** `ZAOstockRSVP.rsvp()` only - no other functions sponsored
- **Failure mode:** if credits exhaust, fall back to "user pays" mode with a banner explaining why

### ZABAL first-stake

- **Stack:** Coinbase Smart Wallet + CDP Paymaster
- **Cost expectation:** stake() ~80K-150K gas, ~$0.005-0.02 per first-stake
- **Budget:** sponsor ONLY first stake per address. Re-stakes = user pays (track via `firstStakeBlock` on contract)
- **Allowlist:** `StakeVault.stake(uint256)` w/ contract-side check `lastStakeBlock[user] == 0`
- **Failure mode:** sane fallback - subsequent stakes work normally, first-stake without sponsorship reverts to user-paid

### Cipher mint (ZAO Music release #1)

- **Stack:** Coinbase Smart Wallet + CDP Paymaster
- **Cost expectation:** mint ~100K-200K gas
- **Budget:** sponsor first 188 ZAO holders (verified onchain via ZAO OS allowlist), then user-paid
- **Allowlist:** `Cipher.mintFirst188()` only; the public `mint()` is user-paid
- **Failure mode:** holder #189+ pays gas; UI shows the explanation

## Rollout Plan (3 Weeks)

| Week | Action |
|---|---|
| Week 1 | Sign up CDP. Activate Paymaster. Get $15K + 0.25 ETH credits. Test on `/stake` page Base sepolia. |
| Week 2 | Wire `@base-org/account` into ZAO OS V1. Update `/stake` first-stake flow. Deploy to Base mainnet. Verify gasless tx works for one test user. |
| Week 3 | Wire RSVP into ZAOstock spinout repo (per memory). Wire Cipher mint to ZAO Music repo. Set surface-specific allowlists. |

## Cost Model

| Surface | Sponsored Population | Per-tx gas | Budget |
|---|---|---|---|
| ZAOstock RSVP | All attendees | $0.005 | $50 covers 10,000 RSVPs |
| ZABAL first-stake | Per address, lifetime | $0.02 | $100 covers 5,000 first-stakers |
| Cipher mint | First 188 ZAO holders | $0.05 | $10 covers all 188 |
| **Total cap** | | | **~$160 across all 3 surfaces if 10K RSVP + 5K first-stakers + 188 minters** |

Free credits ($15K + 0.25 ETH) cover this 100x over. Run unlimited gasless for ZAOstock + first-stake; tighter on Cipher (per-holder check).

## Risks

| Risk | Mitigation |
|---|---|
| Coinbase changes Paymaster pricing post-credits | Pimlico fallback at 10% surcharge - cap exposure $ for $ |
| Allowlist misconfiguration -> we sponsor accidental gas | Strict per-function allowlist; periodic audit of paymaster logs |
| Sponsored tx fails but UX implies success | Always surface paymaster failure to user; never auto-retry without consent |
| Spam (free RSVP -> bot abuses) | Rate-limit per Farcaster FID; require ZAO membership for RSVP |
| Privy + Coinbase wallet stacks coexist confusingly | Clear separation: Privy for Lazer-scaffolded mini apps only; Coinbase Smart Wallet for ZAO main client surfaces |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Sign up CDP, activate Paymaster | Zaal | One-shot | This week |
| Test `/stake` first-stake gasless on Base sepolia | Zaal | Spike | Next week |
| Configure allowlist for `RSVP.rsvp` + `StakeVault.stake` + `Cipher.mintFirst188` | Zaal | One-shot | Week 2 |
| Add monitoring: paymaster spend, sponsorship failures | Zaal | Dashboard | Week 3 |
| Document fallback UX (when sponsorship fails) | Zaal | UX spec | Week 3 |

## Also See

- [Doc 557 - Onchain festival ticketing](../557-onchain-festival-ticketing-zaostock/) - paired - ticketing layer + gasless layer together
- [Doc 548 - Lazer Mini Apps](../../farcaster/548-lazer-miniapps-cli-evaluation/) - Privy gas-sponsorship pattern
- [Doc 549c - 21st pricing & licensing](../549c-21st-dev-pricing-licensing/) - cost-aware Pro tier example
- Memory `project_zao_music_entity` - Cipher = release #1
- Memory `project_zaostock_spinout` - RSVP infra moves out of ZAO OS V1
- Memory `project_zaostock_master_strategy` - festival-as-proof, infra-as-product

## Sources

- [Base docs - Sponsor Gas](https://docs.base.org/use-cases/go-gasless) - 5-step setup, 0.25 ETH free
- [Base Gasless Campaign Smart Wallet](https://www.smartwallet.dev/base-gasless-campaign/) - $15K credits
- [Coinbase Paymaster product page](https://www.coinbase.com/developer-platform/products/paymaster) - 15M+ tx, 50+ apps, ERC-20 gas
- [Pimlico pricing](https://docs.pimlico.io/pricing) - 10% surcharge on actual gas
- [Stackup paymaster intro](https://www.stackup.sh/blog/introducing-stackups-paymaster) - USD-billed monthly
- [ZeroDev ERC-20 paymaster](https://docs.zerodev.app/sdk/core-api/pay-gas-with-erc20s) - USDC-paid gas
- Doc 548 - Lazer's bundled Privy gas-sponsorship feature

## Staleness Notes

Coinbase free-credit terms can change quarterly. Re-validate by 2026-05-29 or before any production rollout.
