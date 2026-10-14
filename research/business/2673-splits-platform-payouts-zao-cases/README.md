---
topic: business
type: decision
status: research-complete
last-validated: 2026-10-14
superseded-by:
related-docs: "143, 222, 1140, 2668"
original-query: "I think let's spend some time in the splits platform reviewing splits and how it works for uh businesses and payouts and leveraging the tooling that's there to make it easy to move crypto"
tier: STANDARD
---

# 2673 - Splits for ZAO payouts: what it does for each real case, measured from its code and docs

> **Goal:** Answer, case by case, whether Splits (splits.org, formerly 0xSplits) makes ZAO's payouts and day-to-day crypto easier, and give one safe test to click.

Splits is now **two products** under one name, and most confusion comes from mixing them:

1. **The Splits protocol.** Small on-chain contracts (a "Split") that receive money and pay it out by fixed percentages. Contracts are GPL-3.0, no protocol fee, EVM only. Doc `music/143-0xsplits-revenue-distribution` covered this for music releases on 2026-07-03.
2. **The Splits treasury app** ("Teams" or "Treasury", at app.splits.org). A self-custodial business account: multisig smart accounts with passkeys, invoicing, schedules, swaps and bridges, accounting, and an optional bank on and off ramp. **This is new since doc 143**, and it is the part that answers "make it easy to move crypto".

## Key Decisions

| # | Decision | Evidence |
|---|---|---|
| 1 | **WaveWarZ team payout on Solana: NO, Splits cannot do it.** Splits is EVM only. | The treasury docs list 11 fully and 5 partly supported networks, all EVM. Solana appears in two places, both as a destination only: a bridge line ("Tokens can be bridged and sent to an external address on Solana", `introduction/networks-and-assets.mdx` line 42) and the private-transfers table, which lists Solana for **USDC and USDT** routed through NEAR Confidential Intents (`transactions/sends.mdx` lines 36-37). So Splits **can send to a Solana address (tokens by bridge, USDC or USDT by private transfer) but cannot hold or split funds there**. The Split contracts are deployed on 32 chain ids, none of them Solana. The SDK and contracts contain zero mentions of Solana. |
| 2 | **Fix the WaveWarZ split before any tool touches it: the shares add to 99%, not 100%.** | `wwtracker/lib/distributions.ts` (public) sets operations 33, Hurricane 22, Candy 22, Zaal 22 = **99**. Each payout is computed as `totalSol * percent / 100`, so **1% of every distribution is never assigned**. The wallet fields are still empty strings. Split v2 contracts do not force 100: they check only that allocations sum to the stated total, so a 33/22/22/22 Split would silently pay 33.3/22.2/22.2/22.2. Decide where the 1% goes first. |
| 3 | **Base side, WaveZStation's 10% platform fee: YES, a Split fits, but behind the Safe, not instead of it.** | The fee lands in a Safe on Base (doc `wavewarz/2668-wavezstation-onchain-ground-truth`). The WaveZStation contract is not verified on Basescan, so whether its fee recipient can be changed is unknown. Until that is known, the Safe sends to a Split, or the Safe stays and a Split is used only for new revenue. |
| 4 | **Artist and collaborator payouts: YES, one immutable Split per act or release.** WaveZStation creators already get 45% in-contract, so no change there. | Split contracts cost gas only (no protocol fee) and anyone can trigger a payout. Splits Lite creates an **immutable push split** by default: owner set to the zero address, 0% distributor fee, money goes straight to recipients when distributed. |
| 5 | **BCZ Strategies LLC: YES for receiving and moving crypto; fiat needs KYB.** | Invoicing, accounts, payments and swaps are $0; "Bank transfers ... 0.25% Per transfer". KYB covers "businesses, including solo-member pass-through LLCs", "typically takes 5-7 business days", and supports US entities "excluding ... New York and Alaska". |
| 6 | **Never give a Split an owner unless you mean to.** | A Split's owner can rewrite the percentages (`updateSplit`), pause payouts (`setPaused`), and **execute any call from the Split wallet** (`execCalls`), which can move what it holds. For payouts to people, set no owner (immutable). |
| 7 | **Keep the existing Safe. Add the Splits app beside it only if the automation or bank ramp is wanted.** | "existing smart accounts (e.g. a Safe) can't be imported into Splits"; a Safe can only be watched read-only. Moving means new addresses. |

## The five cases, one by one

### 1. WaveWarZ team payout

**Today** (public repo `bettercallzaal/wwtracker`, `lib/distributions.ts`, last changed 2026-07-15): a Solana treasury keeps a 3.5 SOL operating floor; anything above it is distributed and the treasury returns to the floor. The split is operations 33%, then 22% each to three team members.

- **Solana: no.** Splits has no Solana accounts and no Solana split contract. What it can do is send *to* a Solana address: tokens by bridge, or USDC and USDT by private transfer. It cannot receive, hold or split money on Solana.
- **The 1% gap is a real bug in the plan, independent of any tool.** 33 + 22 + 22 + 22 = 99. The function `getDistributionBreakdown` multiplies by each percent over 100, so 1% of each distribution stays unassigned.
- **If the team payout ever moves to Base** (for example, the USDC side), it is one immutable Split with four recipients and the allocations fixed to 100. Paying out is one `distribute` transaction that anyone can send.

### 2. Paying artists and collaborators automatically

| Case | Splits fit | How |
|---|---|---|
| WaveZStation creators | **Not needed** | The contract already pays 45% to the song's creator wallets by their own basis points, in the same transaction (doc 2668). |
| A WaveZStation song with several collaborators | **Yes, untested** | Make one of the song's creator wallets a Split address. USDC accrues in the Split and pays out on `distribute`. Untested here: whether WaveZStation accepts a contract as a creator wallet. |
| ZAOstock acts, North Creek releases | **Yes** | One immutable Split per act or release, on Base, receiving the payment and paying each member their share. Same shape as doc 143's per-release split and doc `business/1140-sparkz-music-collab-0xsplits`. |
| A payee with no crypto wallet | **No** | A Split pays addresses. The treasury app can pay a US or EU bank account at 0.25%, but only from a KYB-verified workspace. |

**Push or pull.** A *push* split sends each recipient their share directly when distributed. A *pull* split credits balances in a shared "warehouse" contract, and **each recipient must then withdraw**. That confuses people: a 2025 issue on the contracts repo is a user asking why funds had not reached them after a distribution ("you need to withdraw post-distribution"). For people who are not crypto-native, use push. Splits Lite defaults to push.

### 3. BCZ Strategies LLC: receiving client payments and splitting to expenses or savings

The treasury app does this without writing any contract:

- **Invoicing** with automatic reconciliation for on-chain payment: "$0/month, No processing fees". An invoice can pay straight into an automation account.
- **Automation accounts**: "a deposit address for a revenue stream, with a policy that processes whatever lands there". Every 10 minutes a run starts once any token balance reaches $5; each balance worth at least $1 is "swapped ... split across the policy's destinations". Typical policy from the docs: "sweep everything to USDC, withhold a share for taxes, or split income across sub-accounts, partners, and the bank". Splits charges no fee on runs.
- **Operating accounts** as sub-ledgers: "a dedicated account per project, revenue source, campaign, or partner".
- **Fiat in and out**: after KYB through Bridge, ACH, wire or SEPA in, and out to the workspace's own bank, at **0.25%**.
- **Accounting**: tax lots, CSV export, and a read-only accountant seat.

**The custody trade-off in automation accounts.** Their signers are "the Treasury's passkeys plus a Splits server key, at 1-of-n", so **a Splits-held key can move funds out of an automation account without approval**, within the policy. Keep only flow-through money there, never savings.

### 4. "Make it easy to move crypto"

| Need | Splits treasury app | Source |
|---|---|---|
| One-off sends | Yes, $0 platform fee | pricing page |
| Recurring payouts (payroll) | **Schedules**: daily, weekly or monthly. Each occurrence is "a draft proposal, not an executed transaction"; signers approve each one. Drafts appear at 11:00 UTC daily. Transfers only, no swaps. | docs `transactions/schedules` |
| Many payments at once | **Batch**: "multiple transactions ... under a single signature" | docs `transactions/batch` |
| Swaps and bridges | "0% No added spread or bridge markup"; quotes routed across several providers, cross-network included | pricing page, docs `solutions/revenue-automation` |
| Multi-chain | Same account address and signers on every enabled network; 11 full EVM networks including Base, Optimism, Arbitrum, Ethereum | docs `introduction/networks-and-assets` |
| Gas sponsorship | A workspace-level stipend: **$5 one-time at $0 Earn balance**, $5/month at $1k+, $10/month at $10k+, $100/month at $100k+. Beyond that, gas is paid in the native token. "Sponsorship policies can change at any time". | docs `transactions/index` |
| Agents and scripts | A CLI and MCP server: list accounts, propose signer changes (approval still happens in the web UI), register an EOA as a signer for headless signing | docs `introduction/agents`, `accounts/signers` |
| Yield | "0% management fee, 20% performance fee" on idle balances | pricing page |

### 5. Costs, custody, on-chain versus off, and Safe versus Splits

**Costs (pricing page, read 2026-10-14):** shared accounts, accounting, invoicing $0/month; payments, swaps and bridges 0%; bank transfers and fiat payments 0.25% each; yield 20% of performance. The protocol's Split contracts charge **no protocol fee**, only gas. An optional distributor incentive pays whoever triggers a distribution, capped at 6.5% in the contract; Splits Lite defaults it to 0.

**Custody.**

- *Treasury app:* "Splits never has custody of a workspace's assets." Every account is an ERC-4337 smart-contract multisig. Signers are passkeys or EOAs, and "Splits never has access to private keys". Recovery runs through a Root account controlled by recovery signers you choose. One option creates a Privy embedded wallet for an email address, so in that case a third-party wallet service is in the recovery path. The exception is the automation account's server key, above.
- *Split contracts:* immutable if created with no owner. An owner has full control (decision 6). A 2025 issue on the contracts repo shows a split created as "Controller: None" still exposes `owner()`, `setPaused` and `updateSplit` in its interface. The owner is the zero address, so those functions can never be called; the Splits team called it intended.

**On-chain versus off-chain.** On-chain: accounts, signer sets, thresholds, every transfer, Split percentages. Off-chain: workspace membership and roles, contact names, memos, accounting records, invoice data, schedules (until a draft is signed), and KYB data held by Bridge. Every account's signer set is public, so one passkey used across two workspaces links them for anyone reading the chain.

**Safe versus the Splits treasury app**

| | Safe (in use today) | Splits treasury app |
|---|---|---|
| What it is | Smart-contract multisig | Smart-contract multisig (ERC-4337) with passkeys |
| Bring an existing Safe in | n/a | **No**: watch-only; moving means new addresses |
| Same address on every chain | Only if deployed that way | Yes, by design |
| Invoices, schedules, accounting, tax lots | Third-party apps | Built in, $0 |
| Automatic split of incoming revenue | No (needs a Split or a module) | Yes, automation accounts (with a Splits server key) |
| Bank on and off ramp | Third-party | Built in, 0.25%, KYB required |
| Ecosystem and track record | Long-standing, widely integrated | Open-source audited contracts, $50,000 critical bug bounty |
| Solana | No | No |

**Splits Protocol versus alternatives for "pay several people a share"**

| Option | Chain | Fee | Changes after setup | Fits |
|---|---|---|---|---|
| Immutable Split (protocol) | EVM, incl. Base | gas only | Never | Artist and release payouts, team payout on Base |
| Safe paying by hand | EVM | gas only | Any time, by signers | Irregular payouts, today's setup |
| Splits automation account | EVM | $0 runs, 0.25% to bank | Policy editable by owners | BCZ income routing |
| A script on the Solana treasury | Solana | network fee | Any time | WaveWarZ team payout, since Splits cannot |

## Test one Split on Base, with tiny amounts (for Zaal to click)

Nothing here was done by this lane: no account, no transaction.

1. In a wallet you already use on **Base**, keep a little ETH for gas and about 1 USDC.
2. Open **lite.splits.org** (live, HTTP 200 on 2026-10-14; the older app.splits.org/create returns 404) and connect the wallet. Make sure the wallet is on **Base**: Splits Lite uses the wallet's network.
3. On **Create**, add two recipients you control (for example two of your own wallets) at **50 and 50**, so the total is 100.
4. Leave the defaults: **no owner** (immutable) and **0% distributor fee**. This creates a **push** split, where payouts go straight to the recipients.
5. Create it and sign. The app switches to **Search** and shows the new Split's address. Check that address on basescan.org; it should show contract code.
6. Send **1 USDC** to the Split's address.
7. In Splits Lite, on the Split's page, choose USDC and **distribute**. Sign.
8. Check both recipient wallets: each should show **0.50 USDC**. That proves the full path for the cost of gas only.

What the test does **not** prove: anything on Solana, or the treasury app (workspace, passkeys, automation). The treasury app needs an account, which is a separate decision.

## Also See

- `music/143-0xsplits-revenue-distribution`: the protocol for music releases, 2026-07-03
- `business/1140-sparkz-music-collab-0xsplits`: multi-musician splits for Sparkz (cited by path; the number 1140 resolves to more than one doc)
- `business/222-payment-infrastructure-stripe-coinbase`: payment rails compared
- `wavewarz/2668-wavezstation-onchain-ground-truth`: where WaveZStation's 10%, 45% and 45% go, and the fee Safe

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide where the missing 1% of the WaveWarZ team distribution goes and make the four shares add to 100. SHIPPED = a merged PR to `wwtracker/lib/distributions.ts` | @Zaal with the WaveWarZ team | Decision + PR | 2026-10-21 |
| Run the 8-step Base test above with 1 USDC. SHIPPED = a Split address on basescan with one distribution and both recipients showing 0.50 USDC | @Zaal | Test | 2026-10-21 |
| Find out whether WaveZStation's platform-fee recipient can be changed (the contract is unverified), before planning any Split behind the 10%. SHIPPED = a line appended to doc 2668 | WaveWarZ lane | Research | 2026-10-24 |
| Decide whether BCZ Strategies LLC opens a Splits treasury workspace with KYB for invoicing and the 0.25% bank ramp. SHIPPED = a decision note | @Zaal | Decision | 2026-10-31 |
| Re-validate fees, the gas stipend and supported networks; all three are marked as changeable. **Invalidation condition:** any pricing change, or Solana support appearing | lane | Re-research | 2026-11-14 |

## Sources

All fetched 2026-10-14. Nothing created, signed or sent.

- [github.com/0xSplits/splits-contracts-monorepo](https://github.com/0xSplits/splits-contracts-monorepo) at efec4ac - **[FULL for the files cited, method: git clone --depth 1; LICENSE read: GPL-3.0]**. `packages/splits-v2/src/libraries/SplitV2.sol` (allocation check, incentive cap comment "Limits max incentive to 6.5%"), `splitters/SplitWalletV2.sol` (`updateSplit` onlyOwner), `utils/Wallet.sol` (`execCalls` owner only), `utils/Pausable.sol`, `deployments/` (32 chain files; Base `8453.json`: SplitsWarehouse and push and pull factories, code confirmed on Base by `eth_getCode`).
- [github.com/0xSplits/splits-docs](https://github.com/0xSplits/splits-docs) at 49c6110 - **[PARTIAL - 18 of 61 pages read (networks, core concepts, accounts, signers, keys, recovery, security, transactions, schedules, batch, revenue automation, banking, business banking); method: git clone, raw MDX]**. No LICENSE file at the repo root.
- [github.com/0xSplits/splits-sdk](https://github.com/0xSplits/splits-sdk) at 12936cc - **[PARTIAL - LICENSE (MIT, "Copyright (c) 2022 0xSplits"), package version 6.7.0, and a Solana grep only; method: git clone]**
- [github.com/0xSplits/splits-lite](https://github.com/0xSplits/splits-lite) at a787229 - **[FULL for `src/app/page.tsx` and `src/constants/chains.ts`, method: git clone; LICENSE read: GPL-3.0]**
- [splits.org/pricing](https://splits.org/pricing) - **[FULL, method: curl + HTML strip, 1,502 bytes of text]**
- [lite.splits.org](https://lite.splits.org) - **[liveness only, HTTP 200]**; [app.splits.org/create](https://app.splits.org/create) - **[HTTP 404]**
- Community: [0xSplits/splits-contracts issue #16](https://github.com/0xSplits/splits-contracts/issues/16) (immutable split still exposes owner functions; team reply) and [issue #18](https://github.com/0xSplits/splits-contracts/issues/18) (pull-split withdrawal confusion) - **[FULL, method: gh api, issue and comments]**. Hacker News (Algolia search "0xsplits"): 0 relevant results. Reddit was not searched (no OAuth on this machine).
- [bettercallzaal/wwtracker `lib/distributions.ts`](https://github.com/bettercallzaal/wwtracker/blob/main/lib/distributions.ts) (public) - **[FULL, method: gh api contents, 43 lines]**
- `wavewarz/2668-wavezstation-onchain-ground-truth` - **[PARTIAL - the fee, Safe and chain lines read from origin/main]**

Credit: Splits and its contracts and SDK are by Splits Protocols, Inc. (0xSplits); contracts GPL-3.0, SDK MIT, Splits Lite GPL-3.0, each read from its LICENSE file.
