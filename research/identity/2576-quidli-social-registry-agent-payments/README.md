---
topic: identity
type: decision
status: research-complete
last-validated: 2026-09-29
superseded-by:
related-docs: "891, 316, 291, 2181, 2230"
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

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `EVM_PRIVATE_KEY` and `CONNECT_API_KEY` to the variables no lane may hold. SHIPPED = the line exists in AGENTS.md | @Zaal | PR | 2026-10-10 |
| Decide the KYC and reporting question for ZAOstock artist payouts with whoever advises on finance, independent of any payment rail. SHIPPED = a written answer in the vault decisions folder | @Zaal | Decision | 2026-10-17 |
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
