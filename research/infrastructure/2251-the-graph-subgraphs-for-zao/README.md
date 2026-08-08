---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-08-08
superseded-by:
related-docs: "2245, 2250"
original-query: "https://thegraph.com/ /zao-research this too"
tier: STANDARD
---

# 2251 - The Graph for ZAO: not yet, and here is the exact trigger

> **Goal:** Decide whether ZAO should index its on-chain data with The Graph,
> given how ZAO actually serves that data today.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **DO NOT adopt subgraphs for the current leaderboards.** | They do not read the chain. `src/app/api/respect/leaderboard/route.ts` and `src/app/api/staking/leaderboard/route.ts` both read **Supabase tables** (`respect_members`, `users`). A subgraph would replace something that is not there. |
| 2 | **DO adopt it when governance needs HISTORICAL state** - "who held what Respect at block N". | This is the one thing the Supabase mirror genuinely cannot do. It stores *now*, not *then*, and Fractal/Respect voting is a point-in-time question. |
| 3 | **The free tier covers ZAO outright at current scale.** | 100,000 queries/month free, verified in the billing docs. ZAO is a 188-member community with 157 Respect holders; a snapshot subgraph would not approach that ceiling. |
| 4 | **Do not add it "to be web3-native".** | Only **7 of 325 API routes** touch chain RPC at all. Indexing infrastructure for 7 routes is infrastructure looking for a job. |

## What The Graph actually is

Fetched raw from the docs, 2026-08-08:

> "The Graph is a suite of blockchain data infrastructure products that extract,
> process, and deliver scalable blockchain data solutions across **60+ networks**
> ... As of early 2026, The Graph has served over **1.27 trillion queries** to more
> than **75,000 projects**, powered by **50+ independent Indexer nodes** worldwide."

Three products: **Subgraphs** (custom GraphQL APIs over contract events),
**Substreams** (high-throughput streaming), **Amp** (the new one, positioned as a
"blockchain native database").

The problem it solves, in its own words: blockchains have *"no relational
structure ... no query language ... historical data needs archive nodes"*, so
answering "all transfers for this user" means scanning block by block, and
querying past state needs an expensive archive node.

**That last clause is the whole ZAO-relevant finding.** Everything else The Graph
does, ZAO has already solved a different way.

## What ZAO actually does today (the ground truth)

Checked the code rather than assuming:

| Route | Data source |
|---|---|
| `/api/respect/leaderboard` | `supabaseAdmin.from('respect_members')` |
| `/api/staking/leaderboard` | `supabaseAdmin.from('users')` + `agent_config` |
| routes touching chain RPC at all | **7 of 325** |

So ZAO already runs the "roll your own indexer" pattern: something writes chain
state into Supabase, and the read paths serve Postgres. That is cheap, fast, and
already built - and it is why a subgraph has nothing to displace right now.

## Where the Supabase mirror genuinely fails

A mirror stores the **current** value. It cannot answer:

- "What was this wallet's Respect balance at the block the vote opened?"
- "Who was eligible when the proposal was created, not when it closed?"
- "Reconstruct the leaderboard as of ZAOstock 2026."

Governance is made of exactly those questions. ZAO's Respect/Fractal model is
point-in-time by nature - a snapshot at proposal creation is the standard
defence against buying votes mid-vote. Today that would require an archive node
or a laboriously maintained history table.

**That is the trigger.** Not "we should use The Graph", but "governance needs
historical balances, and that is precisely what indexing exists for".

## Cost, verified

From the billing docs, fetched raw:

> "**Free Plan**: The Free Plan includes **100,000 free monthly queries** with full
> access to the Subgraph Studio testing environment."
>
> "**Growth Plan**: ... all queries after 100,000 monthly queries requiring
> payments with GRT or credit card."

At ZAO's scale - 188 members, 157 Respect holders, snapshots on proposal
boundaries rather than per-pageview - the free tier is not a starting allowance,
it is the whole budget. **UNVERIFIED:** the GRT price per query beyond the free
tier was not checked, because it does not bear on the decision at current scale.

## Alternatives, honestly

| Option | When it wins |
|---|---|
| **Supabase mirror** (today) | Current-state reads. Free, already built, no new dependency. |
| **Subgraph** | Historical state, event history, "as of block N". The governance case. |
| **Direct RPC + `getLogs`** | One-off backfills. Free but slow, and archive access is the expensive part. |
| **Dune / Covalent** | Analytics and dashboards, not app-path reads. |

## Decision

**Not yet.** Revisit when the first governance feature needs a balance at a past
block. At that point build **one** subgraph for the Respect token on Base - not a
platform migration, one contract, one question - and keep the Supabase mirror for
current-state reads. Two sources, each doing what it is good at.

## Also See

- [Doc 2245](../2245-zaoos-surface-map/) - where the 7-of-325 RPC-route count comes from
- [Doc 2250](../../dev-workflows/2250-webfetch-summarises-it-does-not-quote/) - why every quote here is a raw fetch

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| No build. Re-open this doc when a governance feature first needs a historical balance. Shipped when that feature is specced or this doc is marked superseded. | @Zaal | Decision | 2026-10-01 |
| If/when triggered: deploy ONE Respect-token subgraph on Base in Subgraph Studio and confirm it answers "balance at block N". Shipped when the query returns a correct historical balance. | @Zaal | Build | on trigger |

## Sources

- [thegraph.com](https://thegraph.com/) - **FULL** via `curl` + HTML strip, 2026-08-08. Raw text, not a summary (doc 2250).
- [About The Graph - docs](https://thegraph.com/docs/en/about/) - **FULL** via `curl` + HTML strip. All figures and quotations above are verbatim from it.
- [Subgraph billing - docs](https://thegraph.com/docs/en/subgraphs/billing/) - **FULL** via `curl` + HTML strip. The 100,000-query free tier is quoted verbatim.
- `src/app/api/respect/leaderboard/route.ts`, `src/app/api/staking/leaderboard/route.ts`, and a repo-wide scan for `createPublicClient|readContract|getLogs` - **FULL**, first-hand.
