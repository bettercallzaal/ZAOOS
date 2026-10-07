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

> ## CORRECTION, 2026-09-20, AND IT IS THE HEADLINE
>
> **The pre-v3 contracts are EMPTY. This doc originally said they hold
> `0.606612841471201010 ETH` and that the figure was "confirmed to the wei". The confirmation
> was real and the conclusion was wrong.**
>
> `eth_getBalance` returns **exactly zero** on Base `0xb502c5856f7244dccdd0264a541cc25675353d39`
> and on Arbitrum `0x0Aa50ce0d724cc28f8F7aF4630c32377B4d5c27d`, checked against two independent
> RPC providers with a positive control proving the call works.
>
> **Why the verification failed.** `bounties(uint256)` returns a RECORDED amount - a struct
> field written when a bounty is created and never zeroed when the contract was drained. The
> money is the contract's balance. This doc read the field, summed it, found the sum matched
> poidh-app issue #1459 to the wei, and treated agreement as proof. Two sources agreed with
> each other about the same stale field. **Neither had asked the chain how much money was
> there,** and one `eth_getBalance` call was available the whole time.
>
> Poidh's founder said it plainly in Telegram on 2026-09-20 - "the v2 contracts are completely
> drained" - and that is what sent me to check. He also said "degen chain is completely ded",
> which independently explains the six dead Degen endpoints recorded further down as merely
> unreachable.
>
> **What survives:** the 225 bounty records, the 542 claims, the 323 distinct claimants and the
> 100 issuers are all real and still readable on chain. The work happened. **What dies:** every
> dollar figure below that describes these bounties as holding money, the comparison against the
> live market's $3,181, and the entire "recoverable by direct contract call" section. There is
> nothing to recover.
>
> The sections below are left standing with this correction on top rather than quietly edited,
> because the mistake is more instructive than the finding was. Read every figure about the
> pre-v3 contracts as **recorded, not held**.

> **Goal:** Measure the live poidh open-bounty market from chain and API, not from memory, and say what it means for how BCZ prices and formats R6 and R7.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **KEEP R6 and R7 as clip rounds. Do not switch to a code or build format.** | Clip bounties run 64% with-submission and photo 68%, against code at 43% and build at 52%, measured across all 99 open bounties on 2026-09-20. |
| 2 | **DO NOT raise the R6 or R7 prize to attract entries. Prize size does not buy them.** | The $50+ band is 43% with-submission - nearly the worst of the four bands - while under-$5 runs 69%. BCZ's own rounds took 8 to 11 claims each at $27 to $66, so our entry rate comes from format and distribution, not from the pot. |
| 3 | **PUT A DEADLINE IN EVERY ROUND. 81% of the market does not.** | 19 of 99 open bounties carry a parseable deadline and poidh's native `deadline` field is set on **zero** of them. A dated round is legible in a market where four out of five are not. |
| 4 | **SET `issuer_wallet` IN `org.config.json`.** | It is unset today, so any competitive query that filters "our bounties" returns an empty list that reads as a confident zero. Found while writing this doc. |
| 5 | **TREAT `bounties.fetchAll` AS THE REACHABLE MARKET, NOT THE MARKET.** | Issue #1459 on poidh-app documents 450 open, funded bounties on pre-v3 contracts the app no longer reads. **CORRECTED: those contracts hold ZERO. The 225 records are real; the `0.606612841471201010 ETH` is a sum of stale struct fields, not money. See the correction at the top.** Every other figure in this doc describes the 99 reachable ones. |
| 6 | **~~TELL KENNY, WITH THE VERIFICATION~~ - HE CORRECTED US INSTEAD.** Sent 2026-09-20; he replied that the v2 contracts are completely drained and was right. The lesson stands in the other direction: he had the answer in one sentence and we had a day of arithmetic. **Original text:** | #1459 has sat 23 days with zero replies. We can now confirm half of it independently from chain and hand over the scanner that did it. That is a better first message than a new bounty round. **Sent 2026-09-20.** |
| 7 | **PUT A DATE ON EVERY BOUNTY, AND SAY SO ON poidhz.** | A stated deadline is the strongest lever measured here: entries roughly double in every prize band and the effect survives controlling for format. 81% of the market does not do it. This is the single most useful thing poidhz can tell an issuer, and the thing the site is already built around. |
| 8 | **COUNT PEOPLE, NOT JUST FUNDS, WHEN THIS IS DISCUSSED PUBLICLY.** | 306 wallets have stranded work on Base and 87 issuers have stranded bounties. "$1,374 locked" is an accounting line; "306 people did work nobody can see" is what it actually is. |

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

**That quote is wrong about the funds and is reproduced here only because it is what the issue
says.** "Still hold funds" and "they hold 0.606612841471201010 ETH" describe struct fields.
`eth_getBalance` returns zero on both contracts. The unreachability it describes is real; the
money is not.

Read from the contracts directly on 2026-08-28: Base `0xb502c585...` holds 201 open and funded of 990; Arbitrum `0x0Aa50ce0...` 24 of 180; four Degen contracts 225 between them. So the reachable open market measured here, 99 bounties and $3,181, sits beside roughly **450 stranded bounties holding more ETH than the entire visible market is worth**.

The issue's author found it the same way this doc's numbers are built - "I found this while fixing the same bug in my own page, which read one contract per chain and called it every bounty."

### Independently verified on 2026-09-20, to the wei

The issue has sat 23 days with no reply, so rather than repeat it this doc re-read the
contracts directly: `bounties(uint256)` over every id, open = zero `claimer`, funded =
nonzero `amount`, via batched `eth_call` against public RPCs.

| Chain | Contract | Ids read | Open records | ETH **recorded** (NOT held) | **Actual balance** | Issue #1459 says |
|---|---|---:|---:|---|---|---|
| Base | `0xb502c5856f7244dccdd0264a541cc25675353d39` | 990/990 | **201** | `0.581754831471201010` | **`0`** | 201, same to the wei |
| Arbitrum | `0x0Aa50ce0d724cc28f8F7aF4630c32377B4d5c27d` | 180/180 | **24** | `0.024858010000000000` | **`0`** | 24, same to the wei |
| Degen (4 contracts) | - | **0** | **UNREADABLE** | - | - | 225, 10,044 DEGEN |

**Read the last two columns together or not at all.** The recorded column is a struct field.
The balance column is the money. They differ by the entire amount, and every conclusion this
section originally drew came from reading the first and calling it the second.

**CORRECTED 2026-09-20: what matches is the arithmetic, not the claim.** The 225 open
*records* are confirmed and the struct sums reproduce issue #1459's
`0.606612841471201010 ETH` exactly - but `eth_getBalance` returns **zero** on both contracts,
so the issue's headline and this section's original conclusion are both wrong. Two independent
readings of the same stale field agreeing is not verification. See the correction at the top
of this document.

**The Degen half is FAILED, not refuted - and the reason is its own finding.** Six public
endpoints across five providers were tried on 2026-09-20 and none could execute a call:

| Endpoint | Result |
|---|---|
| `rpc.degen.tips` | Cloudflare error 1016 |
| `degen.calderachain.xyz/http` | empty response |
| `rpc-degen-mainnet-1.t.conduit.xyz` | empty response |
| `degen.rpc.thirdweb.com` | `-32001 Invalid chain` |
| `666666666.rpc.thirdweb.com` | answers `eth_chainId` only; `eth_call`, `eth_blockNumber` and `eth_getBalance` all return `-32603` |
| `rpc.ankr.com/degen` | key-gated |
| `explorer.degen.tips` / `degen.blockscout.com` | empty / 404 |

So **225 stranded bounties and all 10,044 DEGEN sit on a chain that cannot currently be
audited from standard public infrastructure.** That is worse than the funds being
unreachable through the app: from this machine today they cannot be counted at all. At
$0.00108907 the DEGEN is worth about $11, so this costs almost nothing in money and
everything in verifiability. Claim scoped honestly: unreachable *from here, today, on those
endpoints* - not a claim that the chain is down.

**Scale, at the $2,633.31 ETH price used by the dashboard on the same day:**

> ~~The stranded ETH is worth **$1,597.40**. The entire visible open market is **$3,180.82**.~~
>
> **WRONG, and this was the most quotable sentence in the document.** There is no stranded
> ETH. The contracts hold zero; $1,597.40 was a struct sum priced in dollars, which made a
> bookkeeping artifact look like a treasury. The $3,180.82 live-market figure stands.
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

## The stranded funds are mostly unpaid work, which #1459 does not say

Issue #1459 counts money. It does not ask whether anyone had already done the work. They had.

`getClaimsByBountyId(uint256)` still answers on the pre-v3 Base contract, so the claims are
readable even though the app cannot show them. Read across all 201 stranded Base bounties on
2026-09-20:

| | Bounties | ETH | USD at $2,633.31 |
|---|---:|---|---:|
| Stranded on Base | 201 | `0.581754831471201010` | $1,531.94 |
| **Of those, with work already submitted** | **96** | `0.521890950410101000` | **$1,374.30** |

**492 claims are sitting on bounties nobody can reach.** Median 2 per bounty, and the largest
single pile is **69 claims on one bounty**. Bounty 934 holds 0.17081 ETH and carries 66
submissions; bounty 911 holds 0.0533 ETH and carries 69.

> **90% of the stranded value is on bounties where the work is already done.**
> It is not abandoned money. It is unpaid work, and the people who did it cannot show it to
> the person who owes them.

**306 distinct wallets have work stranded on Base**, across **87 distinct issuers**. Median
one claim each, so this is mostly 306 individual people who entered one bounty and heard
nothing, not a handful of prolific hunters. The claimant address is word 1 of each `Claim`
struct, confirmed against word 2, which carries the bounty id and matched the bounty being
queried on every element read.

**One of the 306 is Kenny.** Wallet `0x10fc964e...`, fid 2210, the founder and the largest
issuer on the platform, has **10 stranded claims of his own** on contracts his own app can no
longer read. He is not only the person who can fix this; he is one of the people it happened
to.

The 66 on bounty 934 were verified two ways on the same payload before being written down:
the ABI array-length word reads 66, and exactly 66 strictly-increasing element offsets follow
it. `cast` could not decode the struct array with a guessed signature, so the count comes
from the encoding itself rather than from a type that happened to parse.

**This is the strongest available argument for what poidhz should build next**, and it is in
Next Actions below: poidh cannot render these bounties or their claims, the contracts answer
fine, and the scan takes about four seconds per contract.

### The money is recoverable, and that changes what the page should say

Read from Blockscout on 2026-09-20, the last 50 transactions sent to the pre-v3 Base
contract. Two things fall out, and the second is the important one.

**The contract went quiet on 2026-04-21.** Its final transactions were two `createClaim`
calls from `0x342567eB63`, five months ago. The 50 most recent transactions span 2025-12-07
to 2026-04-21 and there is nothing since. So **nobody is still submitting work into the
void** - the harm is historical, it is just unresolved. The last two people to enter did so
in April and have heard nothing in five months. Kenny's own wallet appears in that tail,
calling `createOpenBounty` and `cancelOpenBounty` on 2026-04-01, three weeks before the
contract stopped being used.

**The funds are not lost. They are unreachable through the app and fully reachable from the
contract.** The method mix in those 50 transactions shows the escape hatches all working in
production before the cutover:

| Method | Times used |
|---|---|
| `cancelOpenBounty` | 14 |
| `createClaim` | 9 |
| `submitClaimForVote` | 8 |
| `createOpenBounty` | 6 |
| `voteClaim` / `resolveVote` | 3 / 3 |
| `acceptClaim` | 1 |
| `cancelSoloBounty`, `withdrawFromOpenBounty`, `joinOpenBounty` | 1 each |

So an issuer with a stranded bounty has two real options today, neither of which requires
poidh to ship anything: **`acceptClaim`** pays the person who did the work, and
**`cancelOpenBounty`** refunds the issuer. Both are direct contract calls.

**That is the difference between a graveyard and a lost-property office**, and it is what
`/lost` should be. Not "here is money nobody can reach" but "here is your bounty, here are
the 66 people who entered it, and here is the call that pays one of them or returns your
funds." The tension is real and the page must state it: cancelling refunds the issuer and
leaves the claimants with nothing, which is exactly the outcome 306 people are already
living with.

## The strongest lever measured: a stated deadline roughly doubles entries

Raw: **14/19 = 74%** of bounties with a parseable deadline have submissions, against
**38/79 = 48%** without. That is a bigger gap than format and far bigger than prize, so it
was tested against the two confounds that killed the last candidate.

**It is not the cheap-photo group in disguise.** The deadline group's median prize is
**$17.05** against **$8.92** without, and it skews toward `build`, the harder format. If
anything it is the more demanding half of the market.

**Controlled within format:**

| Format | With deadline | Without |
|---|---|---|
| build | **7/8 = 88%** | 9/25 = 36% |
| photo | **5/5 = 100%** | 8/14 = 57% |
| code | **2/3 = 67%** | 4/11 = 36% |
| clip | 0/1 | 7/10 = 70% |
| unclassified | 0/1 | 9/17 = 53% |

**Controlled within prize band:**

| Band | With deadline | Without |
|---|---|---|
| under $5 | **3/3 = 100%** | 19/29 = 66% |
| $5-50 | **8/11 = 73%** | 16/41 = 39% |
| $50+ | **3/5 = 60%** | 3/9 = 33% |

**Every prize band roughly doubles.** Three independent bands moving the same way is what
makes this worth acting on, rather than one ratio.

**Two honest limits, and the second is the one that matters.**

The `clip` and `unclassified` rows are `n=1`. They are printed rather than hidden, but they
say nothing. Several other cells are `n=3` to `n=5`.

And **a deadline may be a proxy for an issuer who cares.** Someone who bothers to write a
date probably also writes a clearer brief, picks a realistic ask and tells people the bounty
exists. Nothing here can separate "the deadline caused entries" from "the kind of issuer who
writes deadlines causes entries". The advice is the same either way - write the date - but
the mechanism is not established, and this doc has an interest in the deadline mattering,
since a deadline calendar is what poidhz is. Stated so a reader can discount it.

## A confound that nearly shipped as a finding

`is_multiplayer: false` bounties show **12/14 = 86%** with submissions against 48% for
multiplayer, which reads as "SOLO beats OPEN" and would have argued against R8 being an OPEN
bounty.

It is not a finding. Those 14 are almost all **$2.62 photo and IRL bounties**, several of
them literal duplicates - "Show this code in public" three times, "Random Act of Kindness"
three times, "Ramus Grove Stewardship" twice. Their median prize is $2.62 against $14.16 for
the rest. It is the cheap-photo effect wearing a different label, and the only reason it was
caught is that it contradicted a decision already made, which is a bad reason to check
something and the reason it got checked.

## Who is actually issuing, and it changes the picture

The top issuer by count is **Kenny, the founder**. The fourth is **poidhbot, the platform's
own bot**.

Identity confirmed from two independent sources before being written down: `api.web3.bio`
returns `farcaster:kenny` for `0x10fc964e...`, and Farcaster's own
`api.warpcast.com/fc/primary-address` for **fid 2210 (`kenny`, 20,695 followers)** returns
`0x10Fc964Ef70C8467CD8c53e9eD9347422AdF96A8` - the same wallet.

| Issuer | Open | Value | With submissions | Mix |
|---|---:|---:|---:|---|
| **kenny** (fid 2210) | 21 | $554.81 | 48% | 8 unclassified, 5 photo, 4 build; 3 chains |
| `0xc45d767e...` | 12 | $31.56 | 33% | 12 build, ~$2.63 each |
| `0x77c6235e...` | 7 | $108.24 | **14%** | 7 code |
| **poidhbot** | 5 | $323.38 | 20% | 2 clip, 1 social |
| `0xe35cea16...` | 4 | $10.52 | **100%** | 3 clip |
| `0xd109bdda...` | 3 | $7.89 | **100%** | 3 photo |

**Kenny and poidhbot together are 26 of 99 bounties (26%) and $878 of $3,181 (28%).** A
quarter of what looks like a live market is the founder and the platform's own bot seeding
it. The genuinely third-party market is 73 bounties, not 99.

**And the seeded bounties underperform the organic ones:**

> Excluding kenny and poidhbot: **43/73 = 59% with submissions.**
> Kenny and poidhbot's own: **11/26 = 42%.**

The last two rows of the issuer table are the format finding restated at issuer level, and
they are the sharpest version of it in this doc: **one issuer's 7 code bounties at $108
total draw 14%, while another's 3 photo bounties at $7.89 total draw 100%.** Fourteen times
the money, a seventh of the response rate.

**What this means for BCZ specifically.** The largest issuer on the platform is the same
person who endorsed @wimpydwi on 2026-09-02 and believes R5 closed cleanly. Our standing
with the biggest account on poidh is currently gated behind a winner announcement that has
not gone out (`zpoidh/rounds/r5/winner-announce.md`, unsent since 2026-09-05).

## The funnel

The Farcaster `/poidh` channel has **5,681 followers** (keyless read of `api.warpcast.com/v2/all-channels`, 2026-09-20; channel created 2024-02-06). That community supports **46 distinct issuers** and 99 open bounties. Roughly one issuer per 123 followers.

`picsoritdidnthappen/poidh-app` on 2026-09-20: **37 stars, 63 forks, 23 open issues, 26 contributors**, MIT (read from the LICENSE file, not the API field), last activity 2026-09-17. **Forks outnumber stars 63 to 37**, which is the signature of a codebase people clone to build on rather than one they bookmark.

**poidh has no Hacker News presence.** An exact-title search returns **0 hits**; the 1,565 fuzzy hits are all "Podhoretz" and "Podhound". Recorded as a negative signal: the conversation about poidh happens on Farcaster and in the repo, nowhere else that is publicly indexed.

## What to build on poidhz.com next, ranked by what the data supports

Asked 2026-09-20 while waiting on Kenny's reply. Ranked by how much each is something
**only poidhz can do**, since anything poidh.xyz already does better is not an upgrade.

**1. `/lost` - the bounties poidh cannot show you.** The 201 stranded Base bounties, the 96
with work on them, and the 492 claims. Nobody else has this: poidh's own app reads the wrong
contracts and its API returns nothing for them. We have the scanner, it runs in about four
seconds per contract, and `getClaimsByBountyId` answers, so we can show the submissions too.
It serves the two people most harmed - an issuer who does not know 66 people entered, and a
hunter who did the work and got nothing. It is also the single best demonstration that
poidhz is a real client rather than a calendar.

**2. `/stats` - what actually gets entries.** Everything in the two tables above, regenerated
on the 6h cron: submission rate by format and by prize band, the count of bounties with no
deadline, the median prize. Every issuer on the platform is guessing at this, and we are
already computing it to write this document. Cheap: the numbers exist in
`data/bounty-dashboard.json` today and nothing renders them.

**3. Issuer pages.** 46 distinct issuers, and the top three hold 40% of the bounties. A page
per issuer - what they post, how often, what share gets entries, whether they pay - makes
poidhz the place you check before entering someone's bounty. The data is in the same file.

**4. Render `data/health.json`.** It is generated every 6h and nothing reads it. It carries
promises owed, re-check dates that have passed, and which drafts are gated. Putting it on
`/about` would make this programme's own unkept promises public, which is a decision about
how we talk about ourselves in public and therefore Zaal's, not a build task.

**5. Surface past-deadline-but-still-open bounties.** `scan-poidh-deadlines.py` already tags
these `deadline_status: past`. They are the most confusing thing on poidh for a newcomer - a
bounty that says it closed last month and still accepts claims - and explaining it is the
kind of thing a client is for.

**Not worth building:** anything that duplicates poidh's own create-bounty flow, or a second
leaderboard. `/hub` already covers the second and poidh does the first well.

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
| BUILD `poidhz.com/lost` - the stranded bounties, their claims, AND the recovery call per bounty (`acceptClaim` to pay the worker, `cancelOpenBounty` to refund the issuer). 201 Base bounties, 96 with work, 492 claims, 306 people. Page live with a 6h refresh | @Zaal | PR | 2026-10-11 |
| Tell the 87 issuers with stranded bounties that their funds are recoverable by direct contract call - a cast naming the count and linking `/lost`, not 87 DMs | @Zaal | Outbound | 2026-10-18 |
| Follow up to Kenny once he replies with the claims finding, which #1459 does not cover: 492 submissions stranded, 90% of the locked value on bounties where the work is done - message sent | @Zaal | Outbound | 2026-10-04 |
| ~~Send Kenny the #1459 verification~~ **SENT 2026-09-20 WITH A WRONG FIGURE.** It claimed $1,597 stranded; the contracts hold zero. Kenny corrected it himself within the hour. The sent copy is corrected at the top of `zpoidh/docs/outreach/kenny-poidhz-bundle.md` rather than deleted | @Zaal | Outbound | DONE |
| Read the Degen half of #1459 once a working Degen RPC is found, closing the remaining 225 - numbers added to this doc | @Zaal | PR | 2026-10-04 |
| Re-run this doc's measurements and update `last-validated`; the market moved 89 to 99 open in 11 days | @Zaal | PR | 2026-10-20 |

## Sources

- [poidh tRPC `bounties.fetchAll`](https://poidh.xyz/api/trpc/bounties.fetchAll) - **[FULL, method: direct JSON API via `scripts/build-bounty-dashboard.py`]** 99 open bounties, 4 pages, 2026-09-20T20:59Z
- [poidh tRPC `claims.fetchBountyClaims`](https://poidh.xyz/api/trpc/claims.fetchBountyClaims) - **[FULL, method: direct JSON API]** used for the 15-bounty false-negative test and the positive control
- [poidh-app issue #1459](https://github.com/picsoritdidnthappen/poidh-app/issues/1459) - **[FULL, method: `gh api`]** 450 stranded open funded bounties, verified open with 0 comments on 2026-09-20
- [poidh-app PR #1467](https://github.com/picsoritdidnthappen/poidh-app/pull/1467) - **[FULL, method: `gh api`]** `hasClaims` `_count` fix, unmerged since 2026-08-30
- [picsoritdidnthappen/poidh-app](https://github.com/picsoritdidnthappen/poidh-app) - **[FULL, method: `gh api` + `zao-research-snapshot`]** 37 stars / 63 forks / 23 issues / 26 contributors; LICENSE read as MIT from the file
- [Farcaster /poidh channel](https://farcaster.xyz/~/channel/poidh) - **[FULL, method: keyless `api.warpcast.com/v2/all-channels`]** 5,681 followers
- Farcaster `user-by-username` + `fc/primary-address` - **[FULL, method: keyless `api.warpcast.com`]** fid 2210 `kenny`, 20,695 followers, primary address `0x10Fc964Ef70C8467CD8c53e9eD9347422AdF96A8`
- [api.web3.bio](https://api.web3.bio/profile/0x10fc964ef70c8467cd8c53e9ed9347422adf96a8) - **[FULL, method: keyless JSON API]** independent second source for the same wallet-to-identity mapping, and for `poidhbot`
- Degen public RPC and explorer endpoints - **[FAILED - six endpoints across five providers on 2026-09-20, table in the body; none could execute eth_call]**
- [Hacker News Algolia](https://hn.algolia.com/api/v1/search?query=%22poidh%22) - **[FULL, method: keyless API]** 0 exact-title hits. Negative signal, recorded deliberately
- poidh pre-v3 contracts, read directly - **[FULL, method: batched `eth_call` on `bounties(uint256)` via `base-rpc.publicnode.com` and `arb1.arbitrum.io/rpc`, 990/990 and 180/180 ids, 2026-09-20]** Base `0xb502c5856f7244dccdd0264a541cc25675353d39`, Arbitrum `0x0Aa50ce0d724cc28f8F7aF4630c32377B4d5c27d`
- Degen pre-v3 contracts - **[FAILED - `rpc.degen.tips` returns Cloudflare 1016; `degen.calderachain.xyz/http` and `rpc-degen-mainnet-1.t.conduit.xyz` both return empty. 225 of the claimed 450 remain unverified from this machine]**
- [poidh.xyz](https://poidh.xyz) - **[PARTIAL - JS app shell, 197 characters of text after stripping; not escalated because the tRPC API above is the same data at the source]**
- `zpoidh/data/bounty-dashboard.json`, `data/rounds-live.json`, `org.config.json` - **[FULL]** local, regenerated 2026-09-20
