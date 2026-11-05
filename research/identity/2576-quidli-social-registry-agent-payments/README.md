---
topic: identity
type: decision
status: research-complete
last-validated: 2026-10-22
superseded-by:
related-docs: "891, 316, 291, 2181, 2230, 2577, 2673, 2699"
original-query: "/zao-research https://farcaster.xyz/ahn.eth/0xafbc3695"
tier: DEEP
---

# 2576 - Quidli: a social handle as a payable, scored identity

> **Goal:** Decide what ZAO does about Quidli, the "open social registry with
> reputation + permissionless onchain payments" pitched in the cast Zaal sent.

**Upgraded from STANDARD to DEEP on 2026-09-29, same day.** The STANDARD pass
read the marketing page, the repo metadata and the cast. The DEEP pass **called
the live API without a key, audited the client source, and verified returned
addresses on-chain**. Three of the STANDARD pass's conclusions survive unchanged,
one is now much stronger, and the headline finding below was not visible at all
from the documentation. What changed is marked throughout.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **DO NOT pay a ZAO artist through Quidli.** Not a pilot, not one test artist. | **`connect_lookup` returns two different kinds of address under one field name, with nothing marking which is which.** Measured: `github/torvalds` and `twitter/jack` resolve to addresses with **nonce 0 and zero balance on both Base and Ethereum** - never used. `farcaster/dwr` resolves to a real used wallet. Same response shape for both. Paying a handle may send money to a wallet the recipient controls, or to one generated for them that they must claim, and **the caller cannot tell which happened.** |
| 2 | **USE nothing from Quidli for money movement**, unchanged from the STANDARD pass and now better evidenced. No `connect_drop`, no API key, no `EVM_PRIVATE_KEY` in any lane. | Source audit: **no spend cap anywhere in the client.** `wrapFetchWithPayment(fetch, client)` is called with no maximum, `CONNECT_API_BASE_URL` is env-overridable, and the default chain is 8453, Base mainnet. |
| 3 | **SKIP its reputation score. It is not measuring what ZAO would need.** | Measured live: `dwr` and `v` - **both Farcaster co-founders** - each score **24 of 100**, while Quidli's own founder scores **99**. All three have an identical Neynar score of 0.99. **The entire difference is Ethos**, which is 0 for the co-founders and 1,200+ for the other two. A Maine musician will have no Ethos score, so every ZAO artist would score like a stranger. |
| 4 | **SKIP it for Farcaster resolution.** ZAO already has that. | Its own response labels the sources: `neynar`, `lens`, `ethos`. ZAO holds a Neynar key and used it inside this research run. |
| 5 | **The cast's premise does not survive its reply thread, and ZAO should not repeat it.** | `@unify34`: *"Unfortunately by law in certain places a KYC is required"*, unanswered. Removing a platform's KYC demand on a recipient does not remove ZAO's obligation as a payer. |
| 6 | **Treat this as a funded 2018 company on its seventh positioning, not a new protocol.** It is not vapour and it is not new. | **QUIDLI SARL, France, SIREN 844760272, incorporated 2018-11-29**, plus **QUIDLI INC.** in Delaware (file 7066264). Same CEO, same GitHub org since 2018-03-21, and **seven distinct taglines** on `quid.li` between 2018 and 2025. Backed by **Tachyon (ConsenSys Ventures) from Q3 2018**. |

## Delta, 2026-10-22: re-validated, then measured against The ZAO's own flows

**Why this delta.** Zaal, 2026-10-22: review this tech and see how effective it
can be for The ZAO. Part 1 re-checks what changed since 2026-10-12. Part 2 takes
each ZAO flow that moves money and asks what Quidli would replace, what it costs,
what it needs, and what could go wrong. **The Key Decisions above stand.** Nothing
was spent or signed, no key or wallet was set, and no MCP config was changed.

### Part 1: what changed since 2026-10-12

| Check | 2026-10-12 | 2026-10-22 | Method |
|---|---|---|---|
| Hosted MCP version | 0.6.5 | **0.6.7** | curl JSON-RPC `initialize` to `https://mcp.connect.quid.li/` |
| Tools, and which spend | 14, 3 destructive | **14, the same 3 destructive** (`connect_drop`, `connect_trust_create`, `connect_trust_revoke`) | `tools/list` |
| npm `@quidli/connect-mcp` | (not recorded) | latest **0.6.12**, six releases 2026-10-15 to 10-17; **1,668 downloads** 2026-09-19 to 10-18 | `registry.npmjs.org`, `api.npmjs.org` |
| GitHub mirror | pushed 2026-10-07 | pushed **2026-10-17**; **32 commits since 2026-10-12, every one** `chore: sync from sns-backend` or `chore: restore mirror content after sync`; `package.json` says 0.6.7 while npm says 0.6.12; 7 stars, 1 fork | `gh api repos/Quidli/connect-mcp` and `/commits?since=2026-10-12` |
| Issues | #1 (host bug), #2 (outreach) open, no team reply | same two still open, plus **#3** (2026-10-17, another outside pitch). No team reply on any | `gh api .../issues?state=all` |
| Spend cap in the client | none | **still none**: `src/x402-fetch.ts` line 39 is `return wrapFetchWithPayment(fetch, client);` | codeload tarball of `main`, grep |
| Chains (`GET /chains`) | 9, 8 mainnet | **11, 10 mainnet**: adds **Monad (143)** and **Robinhood Chain (4663)**. `drop` is true on all 11 | curl, JSON |
| Read prices (`/price` and `connect_get_price`) | 0 and 0 | **0 and 0**, still free | curl and MCP |
| A provenance field on `/lookup` | absent | **still absent**. `RecipientWithWalletDto` has the same six fields: `did`, `type`, `value`, `ethWalletAddress`, `solWalletAddress`, `amountInWei` | `https://api.connect.quid.li/openapi.json`, 49,226 bytes, schemas parsed |
| `connect_lookup` farcaster/zaal | `0x4238...3E76`, nonce 0 | **the same ETH and SOL addresses, still nonce 0** on Base and Ethereum. Control on the same endpoints: a known-active address reads nonce 70 on Base and 5,969 on Ethereum | MCP, then `eth_getTransactionCount` on `mainnet.base.org` and `ethereum-rpc.publicnode.com` |
| `connect_lookup_exposed` farcaster/zaal | `accountCount: 0` | **`accountCount: 0`, `hasWallets: false`** | MCP |
| `connect_scores_by_account` farcaster/zaal | 98 | **98** (Neynar 0.98, Lens 0.8) | MCP |
| Homepage `quidli.xyz` | "claim them" playground copy | **New tagline: "The open payment layer for the agent economy"**. Claims "50+ Weekly MCP Downloads", "6M+ Indexed Social Accounts", "10 Chains". **Says lookup returns "a verified EVM or Solana wallet"** | curl + HTML strip, 81,612 bytes |
| `docs.quid.li` | HTTP 403 | **HTTP 403** | curl |
| Pricing for an API key or Smart Send | not published | **still not published.** The spec says only "x-api-key (subscription)"; no price on the homepage or the README | the three sources above |
| Is the Quidli MCP installed on this Mac? | no | **no.** No `quidli` entry in `mcpServers`, top-level or per-project, in the two `.claude.json` files read; no `.mcp.json` in this worktree | `python3` read of those files |

**Two of these matter.**

1. **The homepage now says lookup returns "a verified" wallet.** Measured on
   Zaal's own handle, it returns an address that is not one of his six
   Farcaster-verified addresses and has never sent a transaction. That claim is
   wrong for the one handle tested, and the API still has no field that would let
   a caller check it. **The invalidation condition this doc set on 2026-10-12, "a
   provenance or confidence field on `/lookup`", has not been met.**
2. **The release pace is real and the repo is a one-way mirror.** Six npm
   releases in three days, no human-written commit in the public repo, and no
   reply to any outside issue. Anyone installing it trusts a private backend they
   cannot read, and pinning matters: `npx -y @quidli/connect-mcp` takes whatever
   is latest.

### Part 2: every ZAO money flow, one at a time

Read from `origin/main` code, not from memory. File paths are ZAOOS unless said.

| ZAO flow | What we do today | What Quidli would change | Needs | Verdict |
|---|---|---|---|---|
| **Artist tips by Farcaster handle** (Spaces) | The tipper signs in their own wallet; `src/app/api/spaces/tips/route.ts` records `txHash`, `amount`, `chain` and `recipientFid` after the fact, behind `getSessionData()` and Zod. Recipient addresses come from Neynar `verified_addresses` (`src/app/api/users/wallet/route.ts`) | Replace the address step with `connect_lookup`. **Worse:** for `zaal` it returns an address that is not one of his verified wallets | Nothing for reads; an API key and a funded Quidli wallet to send | **Do not use.** Neynar already gives the recipient's own verified wallet, and we hold the key |
| **Respect and ZOLs** | Respect is read and synced from chain per member wallet (`src/app/api/respect/*`, `src/app/api/fractals/member/[wallet]`). ZAO members join with a wallet, so every recipient already has an address we know | Nothing. Quidli sends tokens; it cannot mint or award Respect, and it would resolve a member to a different address than the one they joined with | n/a | **Do not use.** No problem for it to solve |
| **WaveWarZ prizes and team payout** | Solana. The team split lives in `bettercallzaal/wwtracker` `lib/distributions.ts` (doc 2673: 33/22/22/22, which sums to 99, and empty wallet fields) | Quidli is the **only** tool reviewed so far that can send SOL or SPL to a handle (Splits cannot touch Solana, doc 2673). But a send comes **from the API-key owner's Quidli embedded wallet**, so treasury funds would first move into a wallet Quidli provisions, and X handles resolve to fresh wallets (doc 2576 headline: `twitter/jack` nonce 0) | API key (price unknown), SOL moved into a Privy wallet, gas | **Do not use.** Fix the 99% split and fill the wallet fields first; the team and the artists can give their own addresses |
| **ZAOstock artist pay** (the 7 acts who played on 2026-10-03) | Not built in code; the KYC and reporting decision for payouts was due 2026-10-17 and **no written decision was found** (searched: ZAO decision records by "KYC" and "quidli", 2026-10-22) | Pay by handle. Several acts have no on-chain identity at all, which no handle resolver can fix (doc 2577) | KYC and tax reporting apply to ZAO as payer whatever the rail (Key Decision 5) | **Do not use.** Fiat, or each act's own confirmed wallet |
| **The new ZAO Agent paying for tools** (doc 2699) | ZOE already pays Neynar over x402 with a **fixed** 0.01 USDC per call (`bot/src/zoe/farcaster/x402.ts`); a fixed amount is a cap by construction. Agent wallets in `src/lib/agents/wallet.ts` are Privy server wallets **with signing-time spending policies**. Doc 2699 Key Decision 4 sends every money call to a Zaal approval card | Quidli's client pays whatever a `402` asks, with no maximum, and `CONNECT_API_BASE_URL` can point it at any host | An `EVM_PRIVATE_KEY` or API key in the agent | **Do not use for payments.** The read tools could sit in the agent as open (free) tools, except `connect_lookup`, which **provisions a wallet for a third party** and so belongs on the gated list |
| **Paying someone with no wallet at all** (a bounty winner who only has GitHub or email) | Ask them to make a wallet, or pay fiat | This is Quidli's real strength: a claimable Privy wallet, made for them, that they get by signing in | API key, a funded Quidli wallet, and telling the person how to claim | **The one fit**, small amounts only, Zaal's tap, and the recipient told first |

**Cost, as far as it can be measured.** Reads are free today (`/price` returns 0
for lookup and scores). Sending needs an API key on a "subscription" whose price is
not published anywhere we could read (`docs.quid.li` returns 403), or x402 USDC per
request where priced, plus gas and the tokens themselves. **The cost of using it for
ZAO payouts is therefore UNKNOWN**, not zero. What it would replace costs nothing:
Neynar verified addresses (key already held), the keyless Farcaster hub, and asking
the payee.

**What it needs, in full.** For reads: nothing, no key, no wallet, no KYC. For
sends: a Quidli Connect account (a Privy sign-in), an API key, and funds in that
account's embedded wallet on the chain you send from. No KYC is asked of the
recipient; the homepage says stricter checks, "KYC included", are available "only
where a payment needs them", which is a sales contact, not a documented feature.

**Risks, ranked.**

1. **Wrong destination, silently.** Measured on Zaal's own handle twice, ten days
   apart: a payout address that is not his wallet, with no flag. Money sent there
   waits for a claim the recipient does not know about.
2. **No spend cap** in the client, and a configurable payment host.
3. **Custody shift.** Sends come from a Quidli-provisioned embedded wallet, so ZAO
   funds would sit in a wallet whose additional signers are not publicly stated
   (Privy allows `additional_signers`; doc section above, UNKNOWN).
4. **Side effects on third parties.** A lookup provisions a wallet for the person
   looked up. That is an action on someone who did not ask.
5. **Supply chain.** A one-way mirror of a private backend, six releases in three
   days, outside issues unanswered.
6. **Reputation score** still tracks Ethos (Key Decision 3); it would rank Maine
   musicians as strangers.

### Use it for / do not use it for (ranked)

| Rank | Use it for | Why |
|---|---|---|
| 1 | **Reading what a person chose to expose**, with `connect_lookup_exposed`, when an artist says "find me on Quidli" | Free, keyless, consent-based: it lists only what the owner exposed |
| 2 | **Onboarding one person who has no wallet at all**, a small payment sent by Zaal from his own account with claim instructions sent first | The claimable generated wallet is the product's genuine strength; it is the only case where "a wallet made for you" is what we want |
| 3 | **Watching it.** Re-check when a provenance field appears on `/lookup` | That one field would change Key Decision 1 |

| Rank | Do not use it for | Why |
|---|---|---|
| 1 | **Paying anyone who already has a wallet**: Farcaster artists, the 188 members, Respect holders | Measured: may pay a fresh wallet instead of theirs, with no flag |
| 2 | **WaveWarZ prizes or the team payout** | Treasury funds would move into a Quidli wallet first; X handles resolve to fresh wallets; fix the 99% split first anyway |
| 3 | **ZAOstock artist pay** | KYC and reporting are ZAO's as payer; several acts have no on-chain identity |
| 4 | **The ZAO Agent's x402 payments** | No spend cap; ZOE's own x402 path is fixed-price already |
| 5 | **Reputation gating** (who gets a reward, who is "real") | The score mostly measures Ethos |
| 6 | **On-chain trust attestations** (`connect_trust_create`) | Public, irreversible, costs gas, and provisions a wallet for the target |

### Next Actions (2026-10-22; supersedes the table further down)

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| **Still open from 2026-10-12:** add `EVM_PRIVATE_KEY` and `CONNECT_API_KEY` to the variables no lane may hold. Not done: `AGENTS.md` on `origin/main` (173 lines) has no line naming either, read 2026-10-22. SHIPPED = the line exists | @Zaal (a lane can draft the PR) | PR | 2026-10-29 |
| **Still open:** the KYC and reporting decision for ZAOstock artist pay, independent of any rail. SHIPPED = a written decision on record | @Zaal | Decision | 2026-10-29 |
| Optional, Zaal's own account: sign in at `connect.quid.li` with Farcaster `zaal` and see whether `0x4238...3E76` is shown as his claimable wallet. Settles the Privy-pregeneration hypothesis. SHIPPED = a one-line result appended here | @Zaal | Test | none set |
| Re-run Part 1. **Invalidation condition, not a date:** a provenance field on `/lookup`, a published spend cap, or a public price for Smart Send. SHIPPED = a delta section here | quidli lane | Re-research | 2026-11-19 |
| Classify `connect_lookup` as a gated tool if the ZAO Agent ever lists Quidli tools (it provisions a wallet for a third party). SHIPPED = a line in that agent's gate table | ZAO Agent lane | Spec | when doc 2699 PR 2 (`core/gates.ts`) is built |

### Sources for this delta (all fetched 2026-10-22, keyless, nothing spent)

- `https://mcp.connect.quid.li/` - **[FULL, method: curl JSON-RPC]** `initialize`, `tools/list`, `tools/call` for `connect_get_price`, `connect_lookup`, `connect_lookup_exposed`, `connect_scores_by_account` (farcaster `zaal` only)
- `https://api.connect.quid.li/price`, `/chains`, `/openapi.json` - **[FULL, method: curl, JSON parsed]**
- `https://quidli.xyz` - **[FULL, method: curl + HTML strip]**; `https://quid.li` - **[FULL]**, unchanged title; `https://connect.quid.li` - **[PARTIAL, JS shell, 17 bytes of visible text]**; `https://docs.quid.li` - **[FAILED, HTTP 403]**
- `github.com/Quidli/connect-mcp` - **[FULL, method: `gh api` for repo, commits, issues; codeload tarball of `main` for `src/` and `README.md`]**
- `registry.npmjs.org/@quidli/connect-mcp`, `api.npmjs.org/downloads/point/last-month/@quidli/connect-mcp` - **[FULL, method: curl, JSON]**
- `mainnet.base.org`, `ethereum-rpc.publicnode.com` - **[FULL, method: JSON-RPC with a known-active control address]**
- ZAOOS `origin/main` files cited by path in Part 2 - **[FULL, method: `git show`]**

## Delta, 2026-10-12: re-run on Zaal's own handle, nothing spent

This is the re-run the Next Actions table asked for, done on the evening of
2026-10-12 for a private try-it guide written for Zaal. The
only identity looked up was Zaal's own (`farcaster/zaal`, FID 19640). His X and
GitHub handles were scored, not looked up, because `connect_lookup` now says it
provisions a wallet for anyone who has none. **The Key Decisions above stand
unchanged.**

**What was measured.** Each item was run once unless a count is given.

| Check | Result | Method |
|---|---|---|
| Hosted MCP, no key | `initialize` returned server `quidli-connect` **0.6.5**. `tools/list` returned **14 tools**, 3 marked `destructiveHint: true` (`connect_drop`, `connect_trust_create`, `connect_trust_revoke`) | curl JSON-RPC to `https://mcp.connect.quid.li/` |
| `connect_lookup` farcaster/zaal | ETH `0x4238...3E76`, status `completed`. **The same address on 3 calls** over about 6 minutes | the same |
| Is it one of his verified addresses? | **No.** FID 19640 has 6 verifications (4 ETH, 2 SOL), and the returned ETH and SOL addresses match none of them | `haatz.quilibrium.com/v1/verificationsByFid`, keyless |
| Hub instrument control | The control FID from the original pass does list, in its own verifications, the address Quidli returned for it on 2026-09-29. So the hub read can find a match when one exists | the same endpoint |
| Is `0x4238...3E76` used? | **nonce 0** on Base and on Ethereum, **0 bytes of code** on Base | `mainnet.base.org`, `ethereum-rpc.publicnode.com`. Control: a known-active public address returns nonce 70 on Base and 5,969 on Ethereum on the same endpoints |
| `connect_lookup_exposed` farcaster/zaal | `accountCount: 0`, `hasWallets: false` | hosted MCP |
| `connect_scores_by_account` | farcaster/zaal **98** (Neynar 0.98, Lens 0.8, Ethos wallet 1234). twitter/bettercallzaal `null` (Ethos 1234 only). github/bettercallzaal `null`, no categories | hosted MCP |
| `/price` | lookup 0, scores 0. Still free | hosted MCP |

**What changed in the client since v0.6.3** (codeload tarball of `main`, repo
pushed 2026-10-07):

- The README now documents all 14 tools. Source audit point 1 above, "the README
  documents 10 tools, the code registers 14", is **no longer true** as of v0.6.5.
- The `connect_lookup` tool description now says, verbatim: *"Resolving a
  recipient who has no wallet provisions one for them, so this is read-only for
  the caller but not for the recipient."* That disclosure is new and to their
  credit.
- Unchanged: `x402-fetch.ts` still calls `wrapFetchWithPayment(fetch, client)`
  with no maximum. There is still no spend cap.

### The likely explanation, stated as a hypothesis

**Hypothesis:** `0x4238...3E76` is a wallet Quidli generated and holds for the
`farcaster/zaal` identity, not a wrong match against somebody else's wallet. The
README says Connect *"generates a wallet for people who have never used
Quidli"*, the new tool description says lookup provisions one, and the address
is stable across calls, which fits a stored record. A wallet with 0 code and
nonce 0 also fits a smart-account address that has been computed but not yet
deployed, which is the usual shape for a generated custodial or claimable wallet.

**This is not established.** What the measurement does show: for an active
Farcaster account with 6 verified addresses, Quidli returned a payment
destination the account holder has never used, with no field saying so. That
holds under either explanation, so it is the finding, and it strengthens Key
Decision 1. The first pass saw generated-looking wallets only for handles with no
Farcaster wallet. Here it happens for a Farcaster handle that has verified
wallets.

**What would settle it:**

- **Proves "generated for Zaal":** Zaal signs in to `connect.quid.li` with his
  own Farcaster account and the dashboard shows `0x4238...3E76` as his Quidli
  wallet, or the wallet can be claimed or exported from there. This is Zaal's
  action, since account creation is his. Or Quidli adds a provenance field to
  `/lookup` that marks it generated.
- **Proves "wrong match":** the address turns up as a verified or custody
  address of a different Farcaster account, or as a wallet some other person
  controls. A reverse lookup by address needs a keyed API such as Neynar
  bulk-by-address, so it was not run here.
- **Not enough on its own:** another nonce check. A generated wallet and a
  never-used wallet of someone else both read nonce 0.

### Scope limits of this delta

- No lookup of anyone but Zaal. No API key, no wallet, no x402, no
  `connect_drop`, and nothing changed in any MCP config.
- The provisioning side effect cuts both ways. If the hypothesis is right, an
  earlier lookup created `0x4238...3E76`. Whether that was this run or an earlier
  one is unknown.

### Overnight follow-up, 2026-10-12: the hypothesis checked against public sources

**Verdict: very likely a Privy wallet that Quidli generated in advance for the
Farcaster identity `zaal`, which Zaal can claim by signing in.** It is not a wrong
match against someone else's wallet. This rests on four public sources that agree,
not on Quidli saying so in words:

1. **Quidli's own API spec has the field that the first pass said was missing.**
   `RecipientWithWalletDto` in `https://api.connect.quid.li/openapi.json`
   (Quidli Connect API 1.0.0) has `did`: *"Privy DID when the recipient has a
   Connect account"*. **Zaal's lookup result carried no `did`.** By the spec's
   own words, then, the identity has no Connect account, and the address came
   from somewhere other than a user who signed up. This **corrects the HEADLINE
   section above**, which says *"The response carries no field distinguishing the
   two cases."* There is a weak one: an absent `did` means "no Connect account".
   It still does not say "this address is the user's own wallet", so the
   practical risk in Key Decision 1 stands.
2. **Quidli runs on Privy.** The same spec says `/drop`, `/trust` and the revoke
   routes accept *"Privy Bearer token (Connect member with registered Smart Send
   signer)"*. `/drop/balance` reads *"the API key owner embedded wallet"*. The
   repo's `docs/skills/connect-trust/SKILL.md` says *"Unknown socials are
   provisioned the same way lookup/drop provision them"*.
3. **Privy's documented pregeneration flow is this behaviour.**
   `https://docs.privy.io/recipes/pregenerate-wallets.md`: *"you can pregenerate
   non-custodial Ethereum and Solana wallets for existing users, or create a new
   user with other login methods ... without requiring the user to login. You can
   even send assets to the wallet before the user logs in"* and *"Once the user
   associated with the account logs in, they will be able to access the
   pregenerated wallet and any assets sent to them."*
4. **Quidli's homepage describes the claim step.** `https://quidli.xyz` playground
   copy: *"Tokens sent! Now notify your recipient so they know to claim them."*

**Who holds the key.** Privy calls pregenerated wallets non-custodial, and the
user gets access by signing in with the linked account, here Farcaster. **The
open question is what other signers there are.** Privy's pregenerate API lets
the creating app attach `additional_signers` and policies to each wallet. No
public Quidli source says whether Quidli adds itself as a signer on the wallets
it generates. **UNKNOWN, not "no".**

**How Zaal would claim it, and in doing so settle this for good.** Sign in at
`connect.quid.li` with the Farcaster account `zaal`, then see whether the
dashboard shows `0x4238...3E76` as his wallet. That creates an account, which is
his call, and it is the only step that turns "very likely" into "measured".

**What still holds after this.** For an account with 6 verified wallets, Quidli's
payout address for that handle is a fresh wallet the person must find out about
and claim, not any wallet they already use. That is fine for onboarding someone
with no wallet. It is wrong for paying someone who has one, and the caller cannot
tell the two cases apart from the address.

### Each of the 14 tools against a concrete ZAO use

| Tool | Spends? | ZAO use |
|---|---|---|
| `connect_get_price` | no | Check reads are still free before a try-out. Trivial |
| `connect_get_chains` | no | No use. ZAO already knows its chains |
| `connect_lookup` | no for caller, **provisions a wallet for the recipient** | **No use for payouts** (Key Decision 1). Only Zaal on his own handles |
| `connect_lookup_exposed` | no (may charge x402 if the owner sets a price) | **The one consent-based read.** It lists only what a person chose to expose. Possible use: an artist who says "find me on Quidli" can be checked here. Otherwise no use |
| `connect_scores_batch`, `connect_scores_by_account` | no | No use. Key Decision 3: the score mostly tracks Ethos. ZAO already reads the Neynar score directly |
| `connect_scores_by_username` | no | No use (Connect usernames only) |
| `connect_me` | no, API key | No use without an account |
| `connect_drop` | **YES, sends tokens. Zaal-only** | **No use.** Not for WaveWarZ payouts and not for artist pay (Key Decisions 1-2) |
| `connect_drop_balance` | no, API key | No use without `connect_drop` |
| `connect_trust_create` | **YES, EAS attestation on Base, gas. Zaal-only** | No use now. An on-chain "ZAO vouches for this artist" is a public, irreversible statement, and it also provisions a wallet for the target |
| `connect_trust_revoke` | **YES, gas. Zaal-only** | No use (pairs with create) |
| `connect_trust_check`, `connect_trust_graph` | no | No use until someone ZAO trusts has attested on it. Nothing to read today |

**Net: one tool with a narrow consent-based use (`lookup_exposed`), one trivial
(`get_price`), twelve with no ZAO use.**

### Paying artists by handle: Quidli against the doc 2577 alternatives

| Path | Artist has a verified wallet | Artist has a wallet, linked nowhere | Artist has no wallet | Artist has no handle | Cost |
|---|---|---|---|---|---|
| **Farcaster hub verifications** (keyless, used in this delta) or Neynar | **Pays the artist's own verified wallet** | No answer, so ask them | No answer | No answer | Free (hub). Neynar key already held |
| **Lens** (doc 2577, keyless) | Same, Lens accounts only | No answer | No answer | No answer | Free |
| **Quidli `connect_lookup`** | **Measured here: may return a fresh generated wallet instead of the verified one** | Returns a generated wallet, not theirs | Returns a claimable generated wallet, which is its real strength | No answer | Reads free now. Payment needs an API key or x402 |
| **Ask the artist for an address** | Their choice of wallet | Works | They would need a wallet first | Works with fiat details | Free, one DM each |
| **Fiat rails** (ACH, Venmo, Zelle, check) | Works | Works | Works | Works | Rail fees, and KYC and reporting apply either way (Key Decision 5) |

**Recommendation, unchanged in direction and sharper in reason.** For artists on
Farcaster, read their hub-verified addresses (free, provable, their own wallet)
and confirm with them. For everyone else, ask or use fiat. Quidli's one real
advantage, a wallet for an artist with none, is an onboarding flow. It needs the
artist told and walked through claiming, and that is better done openly than as
a side effect of a payout.

### Sources for this delta (all fetched 2026-10-12, keyless)

- `https://mcp.connect.quid.li/` - **[FULL, method: curl JSON-RPC]** `initialize`, `tools/list`, `tools/call`
- `https://api.connect.quid.li/openapi.json` - **[FULL, method: curl, JSON parsed]** 49,006 bytes, `RecipientWithWalletDto.did`, route descriptions. `/docs`, `/swagger.json`, `/api-docs` returned 404
- `https://quidli.xyz` - **[FULL, method: curl + HTML strip]** the "claim them" playground copy
- `https://docs.quid.li` - **[FAILED, HTTP 403]**
- `https://docs.privy.io/recipes/pregenerate-wallets.md` - **[FULL, method: curl of the raw markdown, found via `https://docs.privy.io/llms.txt`]**
- `github.com/Quidli/connect-mcp` main, v0.6.5 - **[FULL, method: codeload tarball]** `README.md`, `LICENSE` (MIT, Copyright (c) 2026 Quidli), `src/tools/register.ts`, `src/x402-fetch.ts`, `src/hosted-gate.ts`, `docs/skills/connect-trust/SKILL.md`
- `https://haatz.quilibrium.com/v1/verificationsByFid` and `/userNameProofByName` - **[FULL, method: curl, JSON]**
- `mainnet.base.org`, `ethereum-rpc.publicnode.com` - **[FULL, method: JSON-RPC]**

## THE HEADLINE, AND IT IS NOT IN ANY DOCUMENTATION

`POST https://api.connect.quid.li/lookup` needs **no API key and no auth**. So it
can be tested rather than taken on trust. Resolved addresses were then checked
against `mainnet.base.org` and `ethereum-rpc.publicnode.com`:

| queried | returned ETH | Base nonce | Ethereum nonce | what it actually is |
|---|---|---|---|---|
| `farcaster/ahn.eth` | `0x6a48ADE3...1699` | **2,852** | - | real, heavily used SMART WALLET (has code) |
| `farcaster/dwr` | `0x6ce09ed5...fea5` | **31** | - | real used EOA |
| `github/torvalds` | `0x45F600CF...3453` | **0** | **0** | **NEVER USED** |
| `twitter/jack` | `0x2cBba0dC...71fD` | **0** | **0** | **NEVER USED** |
| `twitter/quidliprotocol` | `0xcC88D5c2...2360` | **0** | - | **NEVER USED** (Quidli's own X account) |

**Control, on the same RPC that produced those zeros:** `vitalik.eth` returns
nonce **5,964**. So the zeros are the world, not the instrument.

**Red control on the endpoint itself:** `farcaster/zzzzqwertyuiopnotarealhandle99`
lands in `failed[]`. It does not invent a resolution for a handle that does not
exist. **Credit where due - that is the single most important thing it could get
right, and it gets it right.**

**The response carries no field distinguishing the two cases.** Both come back as
`{type, value, ethWalletAddress, solWalletAddress}`. Nothing says "this person
verified this address" versus "we made this address for them".

### The founder says the same thing, in his own words

This is not an inference. `@ahn.eth`, cast `0x96868c1870ace097497c93871482bdab08eb7268`,
**2026-09-15**, 36 likes, describing his own demo:

> "agent proceeds to use my bankr account to swap for BNKR, then **resolves all
> github accounts to wallets generated for those users via quidli** and then sends
> the BNKR tokens to my quidli smart wallet to execute the payments to those repo
> contributors directly"

**"Wallets generated for those users."** The on-chain measurement and the
founder's own description are the same fact reached from two directions.

### Why this is the decision, for ZAO specifically

The cast's argument is *"you still have no idea who you're settling with as
addresses aren't human readable"*. **For a handle with no linked wallet, Quidli
does not solve that - it generates a destination and returns it with the same
confidence as a verified one.** Paying a ZAOstock artist by email or handle could
park the money at an address they have never touched, pending a claim flow, with
no signal in the response that this is what happened.

**Stated as a limit, not smuggled in:** `nonce 0` proves an address is unused on
the chains checked. It does not prove nobody holds the key. The founder's quote is
what closes that gap, not my measurement alone.

## The reputation score, measured

`POST /scores`, no auth. The Neynar component is **identical (0.99) across all
four real accounts**, so it cannot be what separates them:

| handle | quidliScore | neynar | lens | ethos |
|---|---|---|---|---|
| `dwr` - Dan Romero, Farcaster co-founder, 630,355 followers | **24** | 0.99 | - | **0** |
| `v` - Varun Srinivasan, Farcaster co-founder | **24** | 0.99 | - | **0** |
| `nounishprof` - 132,691 followers | **99** | 0.99 | - | 1,200 |
| `ahn.eth` - Quidli's founder | **99** | 0.99 | 0.9 | 1,231 |
| `zzzzqwertyuiopnotarealhandle99` | `null` | - | - | - |

**The split falls exactly along the Ethos line, and Ethos is the only varying
input.** Four data points is a small natural experiment, and it is stated as such
- but the pattern is exact and the confound is absent.

**So `quidliScore` largely measures presence in Ethos Network's crypto-reputation
graph.** That is a coherent thing to measure. It is not "is this a real person I
can safely pay", which is what the cast implies and what ZAO would need.

**And the reputation is substantially resold.** `schemas.ts` enumerates
`quidli_score` (0-100), `lens_score` (0-1), `neynar_score` (0-1),
`ethos_twitter_reputation` (0-2800), `ethos_wallet_reputation` (0-2800), and the
live response carries a `source` field naming `neynar`, `lens` or `ethos` per
signal. The aggregation is real work; it is not an independent reputation system.

## Source audit: @quidli/connect-mcp v0.6.3, 1,908 lines, MIT

Licence read from the **LICENSE file**, verbatim *"MIT License / Copyright (c)
2026 Quidli"*, not the API classifier (Hard Requirement 13). They agreed here.
The repo is a **read-only mirror** - *"PRs here are overwritten on release"* - so
the real source is private.

**1. The README documents 10 tools. The code registers 14.** The four
undocumented ones are `connect_trust_create`, `connect_trust_revoke`,
`connect_trust_check` and `connect_trust_graph`. **`connect_trust_create` and
`connect_trust_revoke` are annotated `SPENDS_FUNDS` and write on-chain EAS
attestations on Base, costing ETH gas.** Installing this grants an agent two
undocumented on-chain write tools.

**2. No spend cap in the client.** `x402-fetch.ts` calls
`wrapFetchWithPayment(fetch, client)` with no maximum. A grep across `src` for
`maxValue`, `maxAmount`, `spendLimit`, `budget` or `cap` returns nothing outside
one unrelated comment.

**3. `CONNECT_API_BASE_URL` is env-overridable** (`config.ts`, `loadBaseUrl`).
With no cap, an x402-enabled instance signs payment for whatever a `402` from the
configured host asks.

**4. Default chain is 8453, Base mainnet.** Real money by default. And
`x402-fetch.ts` supports `84532` baseSepolia while the live `/chains` endpoint
does not offer it - so **there is no Base testnet route for a test payment.**

**5. `DEFAULT_HTTP_HOST` is `'0.0.0.0'`**, passed into `app.listen(port, host)`.
The HTTP variant binds every interface by default.

**6. `@x402/fetch` is pinned `~2.5.0` while upstream latest is `2.28.0`** - a
payments library held to the 2.5.x line.

**7. The client does not poll.** `/lookup` returns `{"status":"processing"}` at
**HTTP 200** on a cold query, and no retry or backoff exists in `src`. Measured:
first call `processing`, the same query 12 seconds later `completed`. **A single
call can return no wallet and no error.**

### Two things the code gets right, and they deserve saying

- **`config.ts` does `evmPrivateKey: apiKey ? undefined : evmPrivateKey`.** An API
  key and a private key cannot both be live. That is a deliberate mutual
  exclusion and it is correct.
- **Every tool carries an MCP annotation**, `SPENDS_FUNDS` (`readOnlyHint: false`,
  `destructiveHint: true`) or `READ_ONLY`. **3 of 14 spend**, and all three
  require an API key. A server that declares which of its tools move money is
  doing more than most.

## Live endpoint facts

- **`GET /price` returns `{"lookup":{"pricePerRecipient":"0"},"scores":{"pricePerScore":"0"}}`.**
  The read tools are free right now.
- **`GET /chains` returns 9 chains, 8 of them mainnet** - Ethereum, Base, Polygon,
  OP Mainnet, Arbitrum One, Avalanche, World Chain, Solana, plus World Chain
  Sepolia as the only testnet. The marketing page says only Base and Solana, so
  here it **understates**, which is the opposite of the usual direction.
- **The lookup platform enum is 9**: email, phone, telegram, discord, farcaster,
  twitter, github, linkedin, slack. Marketing names 8 and omits slack.
- **The API contradicts itself about the same person in the same minute.**
  `/lookup/exposed` for `ahn.eth` returns `profile: null, accounts: [],
  accountCount: 0, hasWallets: false`, while `/lookup` returned two wallets for
  him. The likeliest reading is that "exposed" means consented-and-self-listed
  while `/lookup` means indexed-or-generated - which, if right, means **Quidli
  will hand out a payment destination for someone who has consented to nothing.**
  Marked as the likeliest reading, not as established.
- Anonymous quota defaults: **50 rpm global, 5 rpm per agent**, and anonymous MCP
  requires `CONNECT_MCP_ALLOW_ANONYMOUS=true`.

## Who is actually using it

**Every number below was taken against a working control**, because on a question
like this an empty result and a broken query look identical.

| Surface | Result | Control that proves the instrument works |
|---|---|---|
| **PulseMCP** | **0 servers** for "quidli" | `q=github` returns 301 servers |
| **Official MCP registry** | **0** across 5 name variants | unrelated searches return real hits |
| **Glama.ai** | listed, "Official" badge, **License A, Quality A, Maintenance D**, self-described *"No data / Unresponsive"*, **zero discussion comments** | page fetched in full |
| **Smithery.ai** | page exists, JS shell, usage number not extractable; its registry API does not surface the server | PARTIAL, stated |
| **mcpservers.org** | **FAILED** - Cloudflare 403 on curl and on WebFetch alike. **Not a zero, a wall** | both instruments blocked identically |
| **Hacker News** | **6** Show HN posts 2019-2026, **none above 4 points**, essentially no comments, **no critical feedback anywhere** | `query=react` returns 304,335 hits |
| **Reddit** | **FAILED** - creds absent, OAuth 401, public JSON walled, 0 of 3 mirrors. **No snippet substitution used** | `--selftest` reported each path |
| **npm** | **306** downloads last week, 1,254 last month | registry API |
| **GitHub** | repo **6 stars, 0 forks, 2 open issues**; the **org has 2 followers** and 7 repos, only this one starred | `gh api` |
| **X** | `@quidliprotocol` **1,143 followers**; the founder's own `@AhnJustin` has **10 followers and 0 tweets**; the bare `@quidli` handle returns **404 "User is suspended"** on a different account id | control tweet fetched clean |

**Real independent signals do exist, and they are small:**

- **Energi**, a blockchain project, ran a genuine integration and promoted it in
  2024: *"No crypto wallet? No problem! With just your Gmail, you can now access
  Energi"*. 45 favourites, 860 views. **This is the only fully independent
  promotional content found**, and note it describes the same generated-wallet
  mechanism.
- **A Bankr hackathon award**, 2026-09-28, $250 cash plus $250 credits, to
  `justinquidli/contributor-payout` - real third-party recognition of the
  founder's own repo.
- **`xbornid.eth`** (6,126 followers) is the strongest evidence of a real outside
  user, posting hands-on notes: *"I've tried dropping via quidli connect to user
  (farcaster-fid), but it..."*
- **GitHub issue #1** is a real, well-specified bug from an outside account: the
  HTTP entry point hard-codes `allowedHosts` and never consumes
  `CONNECT_MCP_HOSTS`, so self-hosted deployments fail host validation *"while the
  repository's own helper/tests suggest the host should be accepted."* **No team
  reply.** Issue #2 is unrelated cold-outreach spam.

**The marketing claims against all of that:** "100K+ Activated Users" and "6M+
Indexed Social Accounts" have **no independent corroboration on any surface
checked**, against an X following of 1,143 and a GitHub org following of 2. "50+
Weekly MCP Installations" is the one claim that is **directionally consistent**
with 306 npm downloads a week, and npm downloads include CI and mirrors.

## The Farcaster footprint, measured

| Metric | Value |
|---|---|
| `/quidli` channel followers | **886**, with **11** members |
| Casts in the channel, last 30 days | **22** |
| **Distinct authors in the channel, last 30 days** | **1** - all 22 by the founder |
| Distinct authors over a wider 5-month sample | 3 |
| `@quidli` account | 557 lifetime casts, latest **2026-08-20** - **40 days idle**, median 3 likes |
| Third-party mentions of "quidli", after filtering bot and duplicate-broadcast patterns | **207 casts / 123 accounts** as a floor, down from 376 raw |
| Third-party mentions of **`connect_lookup`** | **0** |
| Third-party mentions of **`connect_drop`** | **0** - the single hit was a false positive on *"let's connect! Drop a reply"* |

**Two corrections this forced on assumptions, one of them mine:**

1. **The founder's audience does engage with the product content, and I would have
   guessed otherwise.** Over 30 days his 48 quidli casts have a **median 16.5
   likes** against **1.0** for his other 630. Not a broad endorsement - it is a
   consistent modest subset - but the direction is the opposite of the obvious
   assumption.
2. **The search endpoint's default sort undercounts massively** - 7 results versus
   700 when chron-sorted and paginated to exhaustion. Reading the default would
   have produced "almost nobody mentions it", and that would have been the
   instrument.

**`@nounishprof`'s interest is editorial, not endorsement.** He co-hosts GM
Farcaster; quidli appears in three "Featured Casts" segments in 12 days, and all
three are **re-embeds of the founder's own casts**, not host commentary. No
standalone mention from him after 2026-09-21.

**Noted because it is context for the ask:** `zaal`, FID 19640, is among the seed
cast's 77 likers. Zaal had already engaged with this cast before sending it.

## What this research got wrong, recorded rather than quietly fixed

**1. I built a damning finding on an invalid test subject and nearly filed it.**
My first score test used `farcaster/dwr.eth`, and concluded that Dan Romero scored
identically to a handle I invented. **`dwr.eth` does not exist on Farcaster** -
Neynar returns `NotFound`. His handle is `dwr`. Quidli returning `null` for
`dwr.eth` was **correct behaviour**, and my conclusion was an artifact of my own
bad input. The real test, with `dwr`, produced a stronger and different finding
(the Ethos weighting above).

**2. I hypothesised that the generated addresses were escrow accounts and refuted
it.** Both of `ahn.eth`'s Solana addresses are real, funded, System-Program-owned
accounts with transaction history - Quidli's holds ~0.0536 SOL and is the *more*
recently active. So they are not escrow. The correct, narrower finding: **Quidli
and the Farcaster protocol simply disagree about his Solana destination.** Quidli
returns `8vo1awED...WXRh`; Farcaster's only verified and primary SOL address is
`CCUqQn1X...ofBX`. Both real, different, and Quidli gives no provenance field to
adjudicate. The ETH answer, by contrast, matches Neynar's primary exactly.

## Scope limits, stated rather than hidden

- **No ZAOstock artist handle was queried.** Sending the roster to a vendor tells
  it who ZAO is about to pay, and that is not a lane's call. Every subject tested
  is a public figure or the vendor itself. **The artist-coverage question is
  therefore still untested** and stays with Zaal.
- **The product behind signup was not used.** `connect.quid.li` and
  `dapp.quid.li` require an account, and account creation is Zaal's. Every claim
  about the paid surface comes from the open-source client, the free endpoints and
  the marketing page.
- **No `connect_drop` was ever called.** Nothing in this research moved any money.
- **Reddit and mcpservers.org are FAILED, not zero.** Both were walled, with the
  method recorded.

## Also See

- `identity/543-bonfires-bot-shipping-questions` - ERC-8004 Reputation Registry.
  **Cited by path because 543 is AMBIGUOUS** and also resolves to
  `infrastructure/543-vercel-fluid-active-cpu-cap-bcz-team` (Hard Requirement 14).
- `agents/891-farcaster-agentic-bootcamp-zol` - reputation registry, "LinkedIn for agents"
- `events/316-farcaster-agentic-bootcamp-week2-deep-dive` - Farcaster graph as reputation
- `agents/291-farcaster-agentic-bootcamp-days-3-5` - agent identity standards
- `media/2181-zabal-gamez-guest-stream-recaps`, `dev-workflows/2230-clawd-scribe-meeting-capture-adopt` - Nounish Prof's prior work with Zaal
- `business/2577-quidli-competitive-landscape` - the landscape doc, **in PR #3693 which must NOT be merged until its base is fixed** (see the process-failure section above)
- ZAO codebase: `src/app/api/neynar`, `src/lib/farcaster`, `src/components/admin/ZidManager.tsx`, `src/lib/ens`
- ZAOOS `.claude/skills/farcaster/SKILL.md` line 57 - `ahn.eth` recorded 2026-08-07

## Next Actions

**Superseded on 2026-10-22** by the Next Actions table in the 2026-10-22 delta near the top of this doc. Kept as the record of what was asked on 2026-10-12.

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `EVM_PRIVATE_KEY` and `CONNECT_API_KEY` to the variables no lane may hold. SHIPPED = the line exists in AGENTS.md | @Zaal | PR | 2026-10-10 |
| Decide the KYC and reporting question for ZAOstock artist payouts with whoever advises on finance, independent of any payment rail. SHIPPED = a written decision on record | @Zaal | Decision | 2026-10-17 |
| If artist payouts by handle are still wanted, test coverage for the 8 ZAOstock acts YOURSELF (not via a lane) and check every returned address's nonce before sending anything. SHIPPED = a result table appended here with 8 rows and a nonce per address | @Zaal | Test | 2026-10-24 |
| Re-run the `/scores` comparison and the nonce check. **Invalidation condition, not just a date:** this doc's decisions change if Quidli adds a provenance or confidence field to `/lookup`, or if `quidliScore` stops tracking Ethos. SHIPPED = a delta section appended here | @Zaal | Re-research | 2026-10-29 |

## Sources

**Live API, tested by this lane without an API key. Nothing spent.**

- `POST https://api.connect.quid.li/lookup` - **[FULL, method: curl, JSON]** - resolution for 8 identities across farcaster, twitter and github, plus an invented handle as a red control
- `POST https://api.connect.quid.li/scores` and `GET /scores/farcaster/{handle}` - **[FULL, method: curl, JSON]**
- `POST https://api.connect.quid.li/lookup/exposed` - **[FULL, method: curl, JSON]**
- `GET https://api.connect.quid.li/price`, `GET /chains` - **[FULL, method: curl, JSON]**
- `mainnet.base.org` and `ethereum-rpc.publicnode.com` via `eth_getTransactionCount`, `eth_getBalance`, `eth_getCode` - **[FULL, method: JSON-RPC, with a vitalik.eth control on the same endpoint]**
- `api.mainnet-beta.solana.com` via `getAccountInfo`, `getSignaturesForAddress` - **[FULL, method: JSON-RPC]**

**Source code.**

- `github.com/Quidli/connect-mcp` at main, v0.6.3 - **[FULL, method: codeload tarball, 1,908 lines of src read; LICENSE base64-decoded and read verbatim; package.json parsed]**
- `npm @quidli/connect-mcp` - **[FULL, method: registry.npmjs.org plus api.npmjs.org downloads]**

**Farcaster, via Neynar API v2.**

- Seed cast `0xafbc3695...f56` and its 5-reply conversation - **[FULL, method: `/cast?type=hash`, `/cast/conversation`]** - and note `reactions.likes` is an EMPTY ARRAY while `likes_count` is 77; the array length reads as "0 likes" on a cast with 77
- Founder cast `0x96868c18...7268`, 2026-09-15 - **[FULL, method: `/cast/search` chron-sorted]** - the "wallets generated for those users" quote
- `/quidli` channel, feeds for FID 8004 and 13950, cast search paginated to exhaustion - **[FULL, method: Neynar channel and feed endpoints, with a `q=base` control]**
- `dwr` (FID 3), `v`, `nounishprof` (FID 4167), `ahn.eth` (FID 8004), `quidli` (FID 13950) - **[FULL, method: `/user/bulk`, `/user/by_username`]**

**Independent coverage.**

- Hacker News, 6 Show HN threads and comment trees - **[FULL, method: keyless Algolia API, control `query=react` = 304,335 hits]**
- PulseMCP - **[FULL for the zero, method: rendered page, control `q=github` = 301 servers]**
- Official MCP registry, 5 name variants - **[FULL for the zero, method: keyless REST; PARTIAL - could not page the whole registry]**
- Glama.ai listing - **[FULL, method: curl + HTML strip]**
- Smithery.ai - **[PARTIAL - page is a JS shell, usage number not extractable]**
- mcpservers.org - **[FAILED - Cloudflare 403 on curl AND WebFetch. A wall, not a zero]**
- Reddit - **[FAILED - `zao-fetch-reddit.sh --selftest`: creds absent, OAuth 401, public JSON walled, 0 of 3 mirrors. No snippet substitution used]**
- X profiles and the Energi integration tweet - **[FULL, method: api.fxtwitter.com; nitter mirrors and the syndication timeline both FAILED on target AND control]**
- GM Farcaster ep388, ep389, ep391 - **[FULL, method: curl on sitemap-derived episode URLs, raw text grep; the site's `?s=` search is FAILED and returns the homepage for every query]**
- GitHub issues #1 and #2, contributors, 56-commit log - **[FULL, method: `gh api`]**
- `quidli.xyz` - **[FULL, method: curl + HTML strip, 67,361 bytes]**
- Low Level Barbarians podcast, founder interviews - **[PARTIAL - existence and topic confirmed via search triage, no transcript fetched]**
- Crunchbase - **[FAILED - HTTP 403]**

## The company: 2018, funded, and on its seventh positioning

**This section corrects the STANDARD pass**, which called it "a seven-year-old
company on its fifth pivot" dated from a 2019 Show HN post. The entity is older
than that and the funding was not looked for at all.

**Two legal entities, one continuous operation.**

- **QUIDLI**, France, **SIREN 844760272**, SARL, **Active**, incorporated
  **2018-11-29**, registered at 12 Rue Louis Renault, Balma 31130 near Toulouse.
  Gérant: **Ahn Justin**, born 1985-07.
- **QUIDLI INC.**, Delaware, file **7066264**, registered agent Harvard Business
  Services at a standard incorporation-service address, not an operating office.

**It is the same team throughout, not a domain reuse.** The GitHub org was created
**2018-03-21** and never re-created; Justin Ahn is CEO and Gérant across the whole
arc; the `quid.li` subdomains `connect.`, `dapp.` and `mcp.connect.` still back
the current product even though marketing moved to `quidli.xyz`. **What changed
seven times is the product, not the company.**

**Founders.** Justin Ahn (CEO, ex-KPMG Seoul, ex-Rocket Internet, HEC Paris MBA
2013, Paris-based) and **Florent Bolzinger**, whom he met at HEC in 2013. The idea
was originally Bolzinger's, modelled on the "Slicing Pie" dynamic-equity concept.
**Bolzinger's PRIOR company Skylights was Y Combinator-backed in 2016 - Quidli
itself has no YC backing**, and that distinction is easy to get wrong. Guillaume
Figielski is co-founder/CTO and a `connect-mcp` contributor with 15 commits; the
rest of his bio traces only to a blocked Crunchbase page and is **PARTIAL**. A
fourth co-founder, Gagandeep Singh, is named by two secondary sources and by
neither of Ahn's own founder interviews - **UNCONFIRMED**.

**Funding, which the STANDARD pass wrongly left as an open question.**

- **Tachyon, the ConsenSys Ventures accelerator, became the first external investor
  in Q3 2018** - stated by Ahn himself in a dated 2019 interview.
- **Outlier Ventures** ran Quidli through its **NEAR Base Camp** cohort.
- **CoinCarp reports $0.38M disclosed across two rounds**, a Pre-Seed dated
  2019-11-13 and a Seed dated 2021-12-21, naming ConsenSys Ventures, Taisu
  Ventures, Bonfire Ventures, Visary Capital, SOSV, MOVE Capital, Cryptechie
  Ventures, OrangeDAO and w3b.vc.
- **Crunchbase, SOSV, Wellfound and F6S all returned 403 or 405.** Any
  Crunchbase-attributed figure is a search paraphrase, not a page anyone read, and
  is marked lower-confidence.

### The seven positionings, in the company's own words

Verbatim `<title>` and meta description from Wayback snapshots of `quid.li`, one
per year. This is the most useful artifact in this doc for judging the pivot
history, because it is the company describing itself at the time:

| Year | The company's own tagline |
|---|---|
| 2018 | *"Quidli \| Rework Work"* - "Split equity using blockchain and trade it for labor" |
| 2019 | *"Quidli \| Reworking How We Work"* - equity in one click |
| 2020 | *"Quidli \| Share value with your contributors"* |
| 2021 | *"Quidli \| Buy & share crypto"* |
| 2022 | *"Quidli \| Share crypto with others in Slack, Discord, and more"* |
| 2023 | *"Quidli \| Share Crypto to Achieve Team Goals"* |
| 2024 | *"Quidli \| Airdrop your native token in Discord, Slack, Telegram, GitHub, Twitter, and email"* |
| 2025 | *"Quidli \| Drop tokens to anyone in Discord, Slack, Telegram, GitHub, Twitter, and email"* |
| 2026 | **identical to 2025** |

**`quid.li` has been static since 2025-04-03** (`Last-Modified` header). The
current pitch lives only on `quidli.xyz`, which Wayback has crawled once, as a
redirect stub with no readable content - so **the agent-payments positioning
cannot be shown historically in its own words.** PARTIAL, stated.

### It had real customers, and that matters for judging it fairly

A Filecoin devgrants proposal filed on Quidli's behalf on **2023-01-30** states
verbatim: *"Quidli users include the community teams at ConsenSys, the NEAR
Foundation, ETHDenver, OrangeDAO, iExec, Flare Network, Concordium, and CUDOS."*
That is a dated primary source naming eight organisations. The 2018 product had 25
early companies and a disclosed price of *"free up to 5 shareholders, then
$1/month/person"*.

**The current product has none of that visible.** Measured on the live 67,361-byte
page: **zero matches** for "pricing", "case study", "case studies", "trusted by",
"used by", "customer" and "testimonial" - six terms, all absent. So the company
has a track record of real users on earlier products and shows no public evidence
of them on this one.

## Where it sits against the alternatives

**Read with one caveat that matters: the landscape research read this doc before
finishing, so where it reports the 14-tool count it is echoing my finding, not
corroborating it independently.** Circular agreement is not a second reading
(AGENTS.md rule 9). The findings below are the ones that came from elsewhere.

**The answer to ZAO's actual question is that no product in this class solves it.**
Every handle-resolution mechanism requires the payee to already have a wallet and
to have linked it somewhere. **A person with no social handle has nothing for any
of these systems to resolve.** That is structural, not a feature gap. For
ZAOstock's 8 acts the realistic shape is handle resolution for the already-linked
subset and **ordinary fiat rails - ACH, Venmo, Zelle, a cheque - for everyone
else**, which is what `Michael Anderson` needs regardless.

- **ERC-8004** is Draft but live-deployed across 17 EVM chains, verified on
  Basescan. **It does not resolve social handles** - it standardises reputation and
  discovery for agents that already hold an on-chain identity, a different problem.
  An independent arXiv study found only **3-15% of registrations are genuine live
  agents** and **59-91% of reputation feedback is Sybil-flagged**, which is a
  caution against treating any on-chain reputation registry as trustworthy by
  default, Quidli's included.
- **x402**'s canonical repo is now `x402-foundation/x402` at 6,662 stars. The HN
  claim of "3.1M transactions in 30 days" traces to a single low-engagement article
  behind a Cloudflare wall and is **unverifiable**. The 14,865-listing analysis was
  verified and found real organic demand of only **$3-6K a month**. A vendor
  dashboard claims $24.24M over 30 days against an independent same-day registry
  snapshot of **$43,606** - three orders of magnitude apart. x402 has **no identity
  or reputation layer at all**.
- **Agntor, Mu and Larkin** none resolve handles to wallets. **Mu requires a
  mandatory local private key with no approval step. Agntor is the only one with a
  documented human-approval threshold. Larkin never touches a key**, being
  receiver-side middleware. All three have 1-3 points on HN.
- **Free alternatives were live-tested.** Lens Protocol's public GraphQL API
  resolves a username to a wallet with no key. Neynar does it for Farcaster. Both
  cover only users who opted in - the same limitation class as Quidli, narrower
  platform coverage, no cost.

## A process failure in this research, recorded because it nearly shipped

**A subagent I dispatched to gather landscape findings instead reserved doc 2577,
wrote it, and opened PR #3693 - and cut its branch inside the SHARED working tree
from my own already-stale branch.** The resulting PR showed **163 files changed,
2,302 insertions and 14,330 deletions**, deleting **95 files that exist on main**,
including `research/security/2515-canva-connect-api-authz` (198 lines),
`research/wavewarz/2525-wavewarz-protocol-measured` (201 lines),
`.agents/rules/zao.md` and about two weeks of `docs/daily/*`.

**Nothing was wrong with its research. The base was 95 commits stale**, so
everything main had gained read as a deletion - AGENTS.md rule 7b, the shape where
"a superset and a deletion present identically".

**Two errors, both mine.** Scoping a subagent loosely enough that it created public
artifacts, and leaving a shared tree on a feature branch while it worked. The fix
was a warning comment on #3693 with the measured numbers, and this doc landed from
a **separate worktree cut from current `origin/main`**, leaving the shared tree on
its own branch with its 20 other-lane dirty files untouched (rule 6).
