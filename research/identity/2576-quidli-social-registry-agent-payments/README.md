---
topic: identity
type: decision
status: research-complete
last-validated: 2026-09-29
superseded-by:
related-docs: "891, 316, 291, 2181, 2230"
original-query: "/zao-research https://farcaster.xyz/ahn.eth/0xafbc3695"
tier: STANDARD
---

# 2576 - Quidli: a social handle as a payable, scored identity

> **Goal:** Decide what ZAO does about Quidli, the "open social registry with
> reputation + permissionless onchain payments" pitched in the cast Zaal sent.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **USE nothing from Quidli for money movement.** No `connect_drop`, no API key, no `EVM_PRIVATE_KEY` in any lane. | Its send tools are API-key-only and its x402 mode puts a **private key in an agent's environment**. Every ZAO rule puts money on Zaal's tap. A lane holding a spend key is the one shape the estate is built to prevent. |
| 2 | **SKIP Quidli for Farcaster identity resolution. ZAO already has it.** | Neynar returns `verified_addresses.eth_addresses` and `sol_addresses` today, on the key ZAO already holds. Demonstrated in this research run: one call returned four ETH addresses and one SOL address for `ahn.eth`. Quidli would be a paid dependency for output ZAO gets for free. |
| 3 | **INVESTIGATE exactly one thing: cross-platform resolution for ZAOstock artist payouts** - specifically whether it resolves an artist by **email or X handle** when they have no Farcaster account. That is the only capability ZAO lacks. | 5 of ZAOstock's 8 acts are Maine locals, and `Michael Anderson` is recorded as having **no social media at all**. Handle-based payment resolves nothing for him. Test before believing the coverage claim. |
| 4 | **The cast's core premise does not survive its own reply thread, and ZAO should not repeat it.** | `@unify34`: *"Unfortunately by law in certain places a KYC is required"*. Quidli removes the need for a recipient to give **a platform** their SSN. It does not remove ZAO's own obligation when ZAO pays a US performer. Different problems; the cast conflates them. |
| 5 | **Treat Quidli as a 7-year-old company on its fifth pivot, not a new protocol.** | Same `quid.li` domain: employee equity (2019), work perks in BTC (2020), Slack tips (2021), Discord tips (2021), agentic payments (2026). Nothing in the cast says this. |

## What was actually sent

**Cast `0xafbc3695324b3748fa0c4f212b41c4fff7442f56`**, by `@ahn.eth` (justin,
FID 8004, **105,486 followers**), **2026-09-21 18:08:39 UTC**, in channel
`/quidli`. **77 likes, 14 recasts, 5 replies.**

It is a **quote-cast of `@nounishprof`** (FID 4167, 132,691 followers), who had
complained 2h18m earlier that setting up xmoney wanted *"dob, ssn, blood of first
born child"*. Justin's reply pitches `@quidli` (FID 13950) as the answer.

**Two things the rendering hides and that change how the cast reads:**

1. **The author is the founder.** His bio is *"wannabe battle rapper building
   /quidli"*, the cast is **in his own product's channel**, and `@quidli` is a
   mention of his own account. This is a pitch, not an observation.
2. **`@quidli` is stripped by the plain-text fetcher**, which renders the key
   sentence as *" addresses this with an open social registry"* - subject
   missing. The mention is at `mentions_positions` 351-358 in the raw object.
   Anyone reading the stripped text cannot tell what the cast is about.

**ZAO already knows this person.** `.claude/skills/farcaster/SKILL.md` line 57
carries `ahn.eth -> justin, FID 8004. "building /quidli..."` as a worked example
from **2026-08-07**, when Zaal sent the same profile. This is a return to a
thread seven weeks old, not a new name.

**And the amplifier is a ZAO collaborator.** `@nounishprof` replied *"Exactly!!"*
(19 likes) and separately asked `@warpee.eth` to *"curate news"*, who confirmed
*"captured for news"* - so it was routed into GM Farcaster, which Nounish Prof
co-hosts. He appears in `media/2181-zabal-gamez-guest-stream-recaps` and
`dev-workflows/2230-clawd-scribe-meeting-capture-adopt` from a 2026-07-22
brainstorm with Zaal.

## What Quidli is, measured

`quidli.xyz` (marketing) fronts `quid.li` (product: `connect.quid.li`,
`dapp.quid.li`, `mcp.connect.quid.li`). Its own line: *"Turn any social handle
into a verified wallet with a reputation score, then send it payment. No wallet
address required."*

**Nine MCP tools, and the split is the whole story:**

| Tool | Auth | Moves money |
|---|---|---|
| `connect_get_price`, `connect_get_chains` | none | no |
| `connect_lookup`, `connect_lookup_exposed` | none (shared anonymous quota) | no |
| `connect_scores_batch`, `connect_scores_by_account`, `connect_scores_by_username` | none | no |
| `connect_me` | **API key only** | no |
| `connect_drop` (Smart Send), `connect_drop_balance` | **API key only** | **YES** |

Platforms claimed: X, Farcaster, GitHub, Discord, Telegram, LinkedIn, email,
phone. Chains: USDC on **Base** and **Solana**. Reputation is scored from
GitHub contribution history, X engagement, Discord participation, Farcaster
graph, phone and email.

**Licence: MIT.** Read from the LICENSE **file**, verbatim *"MIT License /
Copyright (c) 2026 Quidli"*, not from the API classifier field (Hard
Requirement 13). The two agreed in this case.

**The repo is a read-only mirror.** Its own description: *"PRs here are
overwritten on release; please open an issue instead."* The real source is
private, so MIT covers a published artifact you cannot contribute to or audit
the history of.

## Traction: vendor claims against checkable numbers

| Quidli says | What is independently checkable | Gap |
|---|---|---|
| "50+ Weekly MCP Installations" | **306 npm downloads last week**, 1,254 last month (`@quidli/connect-mcp`, registry API, 2026-09-21 to 09-27) | **Understated**, but downloads include CI and mirrors and are not installs |
| "100K+ Activated Users" | not checkable from outside | **VENDOR CLAIM, unverified** |
| "6M+ Indexed Social Accounts" | not checkable from outside | **VENDOR CLAIM, unverified** |

**GitHub `Quidli/connect-mcp`, read 2026-09-29:** **6 stars, 0 forks, 0
watchers, 2 open issues, 4 contributors**, created **2026-08-25**, last push
**2026-09-21** (the same day as the cast). npm package created **2026-06-18**,
**18 versions**, latest **0.6.3**.

**306 weekly npm downloads against 6 GitHub stars is the interesting shape.**
Either real automated usage with no developer community around it, or download
counts inflated by mirrors. Both readings are live; this doc does not pick one.

**The `@quidli` account has 976 followers and follows 3.** The founder has
105,486. The product has roughly 1 percent of its founder's audience.

**Hacker News, keyless Algolia API, `nbHits` for "quidli":** five Show HN posts
on the same domain across seven years - employee equity (2019-02-15),
work perks in BTC (2020-03-26), Slack tips (2021-04-26), Discord tips
(2021-11-30), and **"Agent payments by social handles" (2026-09-09), 1 point**.
Every one scored **1 to 4 points**. **Control:** the query `farcaster` returns
202 hits on the same endpoint, so the index answers and these zeros are real.

## Against what ZAO already has

| Capability | Quidli | ZAO today | Verdict |
|---|---|---|---|
| Farcaster handle -> wallet | `connect_lookup`, shared quota | **Neynar `verified_addresses`**, key already held, used in `src/app/api/neynar` and `src/lib/farcaster` | **ZAO has it.** Demonstrated this session: one call returned 4 ETH + 1 SOL address for `ahn.eth` |
| X / GitHub / LinkedIn / email / phone -> wallet | claimed | **none** | **The only real gap** |
| Reputation score across socials | 6 signals | `ZidManager.tsx`, ZIDs, ZOLs - ZAO's own membership record | Different thing. ZAO's is membership; Quidli's is inferred from public footprint |
| Batch payout | `connect_drop`, API key | Zaal's hand | **Do not close this gap with software** |
| Standards route | proprietary API | **ERC-8004 Reputation Registry**, already surveyed in `identity/543-bonfires-bot-shipping-questions` and `agents/891-farcaster-agentic-bootcamp-zol` | A standard beats a vendor for a registry ZAO would depend on |

## The security finding, stated plainly

**To use x402 pay-per-call, the MCP runs locally with `EVM_PRIVATE_KEY` in its
environment.** Quidli's own README warns *"do not send a private key to the
hosted endpoint"* - correct, and it means the local mode is the one that holds
the key.

**A ZAO lane with that variable set and `connect_drop` available can move USDC
without a human.** That is not a hypothetical; it is the documented purpose.
Every standing rule in this estate - outbound, money, on-chain - puts that on
Zaal. **So the read-only tools are adoptable and the send tools are not**, and
the line is enforceable because it is exactly the API-key boundary Quidli
already draws.

## The contradiction this doc does not resolve

`@unify34` (229 followers, 0 likes): *"Unfortunately by law in certain places a
KYC is required"*. Nobody answered it. The founder replied to the praise and not
to this.

**It is the correct objection and it lands on ZAO specifically.** ZAOstock pays
performers. A US organiser paying a US performer has reporting obligations that
do not depend on the rail used - the same obligation whether payment is USDC on
Base or a cheque. Quidli removes a **platform's** KYC demand on a **recipient**.
It does not remove a **payer's** obligations. The cast treats those as one
problem and they are two.

**This doc does not resolve it and does not have the standing to.** It is a
question for whoever advises ZAO on finance, and it is flagged rather than
answered.

## Also See

- `identity/543-bonfires-bot-shipping-questions` - ERC-8004 Reputation Registry.
  **Cited by path because the number 543 is AMBIGUOUS** and also resolves to
  `infrastructure/543-vercel-fluid-active-cpu-cap-bcz-team` (Hard Requirement 14).
- `agents/891-farcaster-agentic-bootcamp-zol` - reputation registry, "LinkedIn for agents"
- `events/316-farcaster-agentic-bootcamp-week2-deep-dive` - Farcaster social graph as reputation
- `agents/291-farcaster-agentic-bootcamp-days-3-5` - agent identity standards comparison
- `media/2181-zabal-gamez-guest-stream-recaps` and `dev-workflows/2230-clawd-scribe-meeting-capture-adopt` - Nounish Prof's prior work with Zaal

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Test `connect_lookup` against **Michael Anderson by email** and two ZAOstock acts by X handle; record hit or miss per act in this doc. SHIPPED = a result table appended here with 8 rows | @Zaal | Test | 2026-10-10 |
| Decide the KYC/reporting question for ZAOstock artist payouts with whoever advises on finance, independent of any payment rail. SHIPPED = a written answer in the vault decisions folder | @Zaal | Decision | 2026-10-17 |
| Add `EVM_PRIVATE_KEY` and `CONNECT_API_KEY` to the list of variables no lane may hold. SHIPPED = the line exists in AGENTS.md | @Zaal | PR | 2026-10-10 |
| Re-snapshot `Quidli/connect-mcp` and re-read npm downloads; the 306/6-stars split is the thing to watch. SHIPPED = a delta line appended here | @Zaal | Re-research | 2026-10-29 |

## Sources

- [Cast 0xafbc3695...f56 by @ahn.eth](https://farcaster.xyz/ahn.eth/0xafbc3695) - **[FULL, method: Neynar API v2 `/cast?type=hash`, raw JSON]** - full text, mention ranges, embeds, reaction counts
- [Reply thread, 5 replies](https://farcaster.xyz/ahn.eth/0xafbc3695) - **[FULL, method: Neynar API v2 `/cast/conversation`, reply_depth=2]**
- [Quoted cast by @nounishprof](https://farcaster.xyz/nounishprof/0xa380a73e) - **[FULL, method: embedded object in the parent cast's JSON]**
- [quidli.xyz](https://quidli.xyz/) - **[FULL, method: curl + HTML strip, 67,361 bytes, 3,361 chars visible text]**
- [github.com/Quidli/connect-mcp](https://github.com/Quidli/connect-mcp) - **[FULL, method: `gh api` repo object + LICENSE file base64-decoded + README base64-decoded, 14,002 bytes]**
- [npm @quidli/connect-mcp](https://www.npmjs.com/package/@quidli/connect-mcp) - **[FULL, method: registry.npmjs.org JSON + api.npmjs.org downloads endpoints]**
- [Hacker News search "quidli"](https://hn.algolia.com/api/v1/search?query=quidli) - **[FULL, method: keyless Algolia API, with a `farcaster` control query returning 202 hits]**
- [Neynar user object, FID 13950](https://api.neynar.com/v2/farcaster/user/bulk?fids=13950) - **[FULL, method: Neynar API v2]**
- ZAO codebase: `src/app/api/neynar`, `src/lib/farcaster`, `src/components/admin/ZidManager.tsx`, `src/lib/ens` - **[FULL, method: local filesystem]**
- ZAOOS `.claude/skills/farcaster/SKILL.md` line 57 - **[FULL, method: local grep]**
- **[NOT FETCHED]** `connect.quid.li` and `dapp.quid.li` - the product itself is behind signup. Not escalated, because reaching it means creating an account, and account creation is Zaal's, not a lane's. **Stated rather than hidden:** every claim here about the product's behaviour comes from its own marketing page and its open-source client, never from using it.
