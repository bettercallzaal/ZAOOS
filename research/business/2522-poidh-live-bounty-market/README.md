---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs: "business/2466-poidhz-platform-honest-audit, business/759-poidh-history-origin-to-2026, wavewarz/2356-wavewarz-clip-bounty-grounding, technology/1534-zao-devz-bounty-campaign"
original-query: "[STANDARD] What is actually happening on poidh right now - the live open-bounty market, issuer concentration, what predicts submissions (format vs prize size), and what it implies for BCZ round pricing and format for R6/R7"
tier: STANDARD
---

# 2522 - What is actually happening on poidh right now

> **Goal:** Measure the live poidh open-bounty market from chain and API, not from memory, and say what it means for how BCZ prices and formats R6 and R7.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **KEEP R6 and R7 as clip rounds. Do not switch to a code or build format.** | Clip bounties run 64% with-submission and photo 68%, against code at 43% and build at 52%, measured across all 99 open bounties on 2026-09-20. |
| 2 | **DO NOT raise the R6 or R7 prize to attract entries. Prize size does not buy them.** | The $50+ band is 43% with-submission - nearly the worst of the four bands - while under-$5 runs 69%. BCZ's own rounds took 8 to 11 claims each at $27 to $66, so our entry rate comes from format and distribution, not from the pot. |
| 3 | **PUT A DEADLINE IN EVERY ROUND. 81% of the market does not.** | 19 of 99 open bounties carry a parseable deadline and poidh's native `deadline` field is set on **zero** of them. A dated round is legible in a market where four out of five are not. |
| 4 | **SET `issuer_wallet` IN `org.config.json`.** | It is unset today, so any competitive query that filters "our bounties" returns an empty list that reads as a confident zero. Found while writing this doc. |
| 5 | **TREAT `bounties.fetchAll` AS THE REACHABLE MARKET, NOT THE MARKET.** | Issue #1459 on poidh-app documents 450 open, funded bounties on pre-v3 contracts the app no longer reads. **Re-read from chain here and confirmed to the wei on both ETH chains: 201 on Base + 24 on Arbitrum holding `0.606612841471201010 ETH`, worth $1,597 against a visible market of $3,181.** Every other figure in this doc describes the 99 reachable ones. |
| 6 | **TELL KENNY, WITH THE VERIFICATION.** | #1459 has sat 23 days with zero replies. We can now confirm half of it independently from chain and hand over the scanner that did it. That is a better first message than a new bounty round. |

## The market, measured

Surface: `bounties.fetchAll` over 4 pages via `scripts/build-bounty-dashboard.py`, written to `data/bounty-dashboard.json`, generated 2026-09-20T20:59Z. 99 open bounties.

| Measure | 2026-09-09 | 2026-09-20 |
|---|---|---|
| open, all chains | 89 | **99** |
| with at least one submission | 52% | **55%** (54/99) |
| median prize | $10.94 | **$11.59** |
| parseable deadline | 17% | **19%** (19/99) |
| native `deadline` field set | 0 | **0** |

Chain split: Base 80, Arbitrum 12, Ethereum mainnet 7. Total open value **$3,181** across **46 distinct issuers**, priced at ETH $2,633.31 and DEGEN $0.00108907 on the day.

**Concentration.** The top 3 issuers hold **40 of 99 bounties (40%) but only $695 (22%) of the value**. One wallet (`0x10fc964e...`) alone has 21 open. Volume and money sit in different hands: the high-count issuers post cheap bounties, and the large prizes come from the long tail.

## What predicts a submission

**Prize size does not.**

| Prize band | With submissions | Median prize |
|---|---|---|
| under $5 | **22/32 = 69%** | $2.63 |
| $5-15 | 11/26 = 42% | $8.82 |
| $15-50 | 15/27 = 56% | $21.59 |
| $50+ | **6/14 = 43%** | $112.31 |

**Format does.**

| Task type | Open | With submissions |
|---|---|---|
| photo | 19 | **68%** |
| clip | 11 | **64%** |
| build | 33 | 52% |
| code | 14 | 43% |
| social | 3 | 33% |

The readable story is effort, not money: a photo or a clip is minutes of work and a build or a code task is hours, and the entry rate tracks that far better than the prize does.

**The caveat that must travel with the prize-band table.** `created_at` is present as a field on all 99 rows and **empty on all 99**, so I could not control for how long each bounty has been open, and the open set structurally over-represents bounties that never resolved. It is a real pattern in the standing set; it is not proof that a small prize attracts more people. Stated as a finding it would be wrong.

## The hidden market, and why 99 is not the number

Issue [#1459](https://github.com/picsoritdidnthappen/poidh-app/issues/1459), filed 2026-08-28 by `agentatwork`, open with **zero comments** 23 days later:

> 450 bounties that are still open and still hold funds live on poidh main contracts the app no longer reads. Combined, they hold 0.606612841471201010 ETH and 10044.182045344343434440 DEGEN. There is no path to them in the UI or through `bounties.fetchAll`, so neither the issuer who funded one nor a claimer who wants to submit to one can reach it from poidh.xyz.

Read from the contracts directly on 2026-08-28: Base `0xb502c585...` holds 201 open and funded of 990; Arbitrum `0x0Aa50ce0...` 24 of 180; four Degen contracts 225 between them. So the reachable open market measured here, 99 bounties and $3,181, sits beside roughly **450 stranded bounties holding more ETH than the entire visible market is worth**.

The issue's author found it the same way this doc's numbers are built - "I found this while fixing the same bug in my own page, which read one contract per chain and called it every bounty."

### Independently verified on 2026-09-20, to the wei

The issue has sat 23 days with no reply, so rather than repeat it this doc re-read the
contracts directly: `bounties(uint256)` over every id, open = zero `claimer`, funded =
nonzero `amount`, via batched `eth_call` against public RPCs.

| Chain | Contract | Ids read | Open + funded | ETH held | Issue #1459 says |
|---|---|---:|---:|---|---|
| Base | `0xb502c5856f7244dccdd0264a541cc25675353d39` | 990/990 | **201** | `0.581754831471201010` | 201, same to the wei |
| Arbitrum | `0x0Aa50ce0d724cc28f8F7aF4630c32377B4d5c27d` | 180/180 | **24** | `0.024858010000000000` | 24, same to the wei |
| Degen (4 contracts) | - | **0** | **UNVERIFIED** | - | 225, 10,044 DEGEN |

**225 of the claimed 450 are confirmed. The two ETH chains match exactly**, including the
combined `0.606612841471201010 ETH` headline. The Degen half is **FAILED, not refuted**:
`rpc.degen.tips` returns Cloudflare error 1016 and `degen.calderachain.xyz` and
`rpc-degen-mainnet-1.t.conduit.xyz` both return empty, so it could not be read from here.
At $0.00108907 the Degen side is worth about $11 regardless; the money is on the ETH chains.

**Scale, at the $2,633.31 ETH price used by the dashboard on the same day:**

> The stranded ETH is worth **$1,597.40**. The entire visible open market is **$3,180.82**.
> **Half as much value again is sitting in bounties nobody can reach as in every bounty
> poidh can show you.**

The Base stranded set was **created between 2024-05-28 and 2026-04-03** - so this is not an
artifact of one bad migration week. The newest one had been funded and unreachable for over
five months before the issue was filed.

One more thing the direct read settles: **`createdAt` is stored on chain** as the seventh
struct member, and is populated. The API returns it empty on all 99 live rows, which is why
the prize-band table above cannot be controlled for age. The data exists; the surface drops
it.

**Correction worth recording.** The first pass of this verification reported
`0.581754831471200995` against the issue's `...201010` and looked like a real discrepancy in
the last few wei. It was not - it was `sum(int) / 1e18` in float. Recomputed with exact
integer arithmetic it matches digit for digit. A float divide is not a measurement.

## The submission-count bug, tested rather than assumed

Issue #1464 reported `hasClaims: false` on 15 funded bounties that had 24 claims on chain. It is closed. The fix, PR [#1467](https://github.com/picsoritdidnthappen/poidh-app/pull/1467), replaces a `take: 1` length check with a Prisma `_count` aggregation and has been **open and unmerged since 2026-08-30**. Its author notes the root cause is probably indexer sync, not the API layer.

That directly threatens the 45% zero-submission figure, so it was tested. Fifteen of the 45 zero-submission bounties were re-read through `claims.fetchBountyClaims`, the endpoint that returns actual claim rows:

```
checked 15, of which 0 actually HAVE claims
```

Positive control on the same function, because a checker that finds nothing has to be shown to find something first:

```
our R5 (1330, 9 claims expected): 9
our R2 (1166, 8 claims expected): 8
live bounty 1333 (dashboard says HAS submissions): 1
live bounty 27: 3        live bounty 329: 3
```

**Conclusion: the false-negative bug did not reproduce on this sample.** 15 of 45 is a sample, not the set, and the unmerged fix means the underlying indexer-sync cause is still open upstream.

## BCZ against the market

| | Claims | Prize |
|---|---|---|
| R1 (1151) | 11 | $27.65 |
| R2 (1166) | 8 | $27.65 |
| R3 (1180) | 8 | $65.83 |
| R5 (1330) | 9 | $62.67 |
| R4 (1249) | 2 | $36.34, canceled at closeout |

**38 claims across five cast rounds, and every round that ran got submissions.** The market's $50+ band is 43% with-submission; R3 and R5 sat in that band and took 8 and 9. The market median prize is $11.59 and BCZ has never run below $27.

So BCZ is paying four to six times the market median and getting entries that the same-priced cohort does not. The difference is not the pot. It is the format (clip, the 64% band), a stated deadline (19% of the market has one), and the fact that a BCZ round is promoted into a channel rather than posted and left.

**BCZ has zero bounties open today** - R1, R2, R3 and R5 settled, R4 canceled, R6 and R7 uncast. Read from `data/rounds-live.json`, not from an issuer filter, because `issuer_wallet` is unset in `org.config.json` and that filter returns `[]`.

## The funnel

The Farcaster `/poidh` channel has **5,681 followers** (keyless read of `api.warpcast.com/v2/all-channels`, 2026-09-20; channel created 2024-02-06). That community supports **46 distinct issuers** and 99 open bounties. Roughly one issuer per 123 followers.

`picsoritdidnthappen/poidh-app` on 2026-09-20: **37 stars, 63 forks, 23 open issues, 26 contributors**, MIT (read from the LICENSE file, not the API field), last activity 2026-09-17. **Forks outnumber stars 63 to 37**, which is the signature of a codebase people clone to build on rather than one they bookmark.

**poidh has no Hacker News presence.** An exact-title search returns **0 hits**; the 1,565 fuzzy hits are all "Podhoretz" and "Podhound". Recorded as a negative signal: the conversation about poidh happens on Farcaster and in the repo, nowhere else that is publicly indexed.

## Also See

- [business/2466-poidhz-platform-honest-audit](../2466-poidhz-platform-honest-audit/) - the internal audit of our own platform against the live poidh data
- [business/759-poidh-history-origin-to-2026](../759-poidh-history-origin-to-2026/) - origin to v3 rebuild; established the open-bounty mechanic as the viral loop
- [wavewarz/2356-wavewarz-clip-bounty-grounding](../../wavewarz/2356-wavewarz-clip-bounty-grounding/) - R5 pre-launch grounding against live claim data
- [technology/1534-zao-devz-bounty-campaign](../../technology/1534-zao-devz-bounty-campaign/) - the code-bounty design, which this doc's format finding argues against repeating
- Tracker task `research-doc:2466` (todo, due 2026-09-09) - review of the prior audit, still open

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set `issuer_wallet` in `zpoidh/org.config.json` so competitive queries stop returning a false zero - merged PR, `check-site-claims.py` green | @Zaal | PR | 2026-09-27 |
| Keep R6 and R7 as clip rounds at their current 0.0125 ETH pot; do not raise the prize to chase entries - decision recorded in `rounds/r6/README.md` | @Zaal | PR | 2026-10-03 |
| Re-measure the R7 Twitch archive claim, whose re-check date passed 2026-09-13, before R7 casts - date moved in `rounds/r7/README.md` | @Zaal | PR | 2026-09-27 |
| Send Kenny the #1459 verification: 225 of 450 confirmed from chain to the wei, $1,597 stranded against a $3,181 visible market, plus the scanner - message sent | @Zaal | Outbound | 2026-09-27 |
| Read the Degen half of #1459 once a working Degen RPC is found, closing the remaining 225 - numbers added to this doc | @Zaal | PR | 2026-10-04 |
| Re-run this doc's measurements and update `last-validated`; the market moved 89 to 99 open in 11 days | @Zaal | PR | 2026-10-20 |

## Sources

- [poidh tRPC `bounties.fetchAll`](https://poidh.xyz/api/trpc/bounties.fetchAll) - **[FULL, method: direct JSON API via `scripts/build-bounty-dashboard.py`]** 99 open bounties, 4 pages, 2026-09-20T20:59Z
- [poidh tRPC `claims.fetchBountyClaims`](https://poidh.xyz/api/trpc/claims.fetchBountyClaims) - **[FULL, method: direct JSON API]** used for the 15-bounty false-negative test and the positive control
- [poidh-app issue #1459](https://github.com/picsoritdidnthappen/poidh-app/issues/1459) - **[FULL, method: `gh api`]** 450 stranded open funded bounties, verified open with 0 comments on 2026-09-20
- [poidh-app PR #1467](https://github.com/picsoritdidnthappen/poidh-app/pull/1467) - **[FULL, method: `gh api`]** `hasClaims` `_count` fix, unmerged since 2026-08-30
- [picsoritdidnthappen/poidh-app](https://github.com/picsoritdidnthappen/poidh-app) - **[FULL, method: `gh api` + `zao-research-snapshot`]** 37 stars / 63 forks / 23 issues / 26 contributors; LICENSE read as MIT from the file
- [Farcaster /poidh channel](https://farcaster.xyz/~/channel/poidh) - **[FULL, method: keyless `api.warpcast.com/v2/all-channels`]** 5,681 followers
- [Hacker News Algolia](https://hn.algolia.com/api/v1/search?query=%22poidh%22) - **[FULL, method: keyless API]** 0 exact-title hits. Negative signal, recorded deliberately
- poidh pre-v3 contracts, read directly - **[FULL, method: batched `eth_call` on `bounties(uint256)` via `base-rpc.publicnode.com` and `arb1.arbitrum.io/rpc`, 990/990 and 180/180 ids, 2026-09-20]** Base `0xb502c5856f7244dccdd0264a541cc25675353d39`, Arbitrum `0x0Aa50ce0d724cc28f8F7aF4630c32377B4d5c27d`
- Degen pre-v3 contracts - **[FAILED - `rpc.degen.tips` returns Cloudflare 1016; `degen.calderachain.xyz/http` and `rpc-degen-mainnet-1.t.conduit.xyz` both return empty. 225 of the claimed 450 remain unverified from this machine]**
- [poidh.xyz](https://poidh.xyz) - **[PARTIAL - JS app shell, 197 characters of text after stripping; not escalated because the tRPC API above is the same data at the source]**
- `zpoidh/data/bounty-dashboard.json`, `data/rounds-live.json`, `org.config.json` - **[FULL]** local, regenerated 2026-09-20
