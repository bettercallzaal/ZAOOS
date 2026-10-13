---
topic: wavewarz
type: audit
status: research-complete
last-validated: 2026-10-13
superseded-by:
related-docs: "2668, 2525, 2617, 2634"
original-query: "wavezstation as 2 to get info to danny and research how we can improve it. How to improve WaveZStation, from evidence: the unverified contract (what verifying takes), a personal-data exposure in the public API, the pool figure on the site showing gross sales, the fee path from Base to the SOL treasury, buyer experience (35 buyer wallets, no buy over 100 USDC: what stops bigger buys), drop timing, and what the data says drives a song's sales. Rank improvements by impact on volume and by effort. (reconstructed: one field name removed until the exposure is fixed)"
tier: STANDARD
---

# 2670 - WaveZStation: what to improve, ranked by effect on volume and by effort

> **Goal:** Turn the measurements in doc 2668 into a ranked list of changes to WaveZStation, each tied to the evidence for it, so the team picks from data and not from taste.

Read on **2026-10-13**. Chain figures are Base blocks 49,105,370 to 52,565,323 (the same set as [doc 2668](../2668-wavezstation-onchain-ground-truth/)). Site figures are the public pages and scripts of wavezstation.com fetched at about 22:43 UTC. Nothing was bought, changed or sent. Addresses are truncated on purpose.

## Key Decisions

Ranked. "Volume" is the expected effect on USDC sold, judged from the evidence in the row. "Effort" is S (hours), M (days), L (weeks).

| Rank | Change | Volume | Effort | The evidence, in one line |
|---|---|---|---|---|
| 1 | GIVE every song page its own link preview (title, artist, cover, one line). | High | S | A song page served to a link-preview crawler has the title "WaveZStation", the description "Web3 music platform" and zero `og:` tags. Every share of every song is the same blank card. |
| 2 | TELL holders when they have money to claim. | High | S to M | 365.94 USDC is unclaimed, 18.7% of everything ever sold. 20 of 35 buyers have never claimed. Of the 15 who have, **12 bought again afterwards**. |
| 3 | BUILD around buyer count, not ticket size: the quest, artist-led drops, a reason for a 36th wallet to show up. | High | M | Song sales track the number of buyers (correlation 0.88 across 25 songs). The whole platform is 35 wallets and about 4 new ones a week. |
| 4 | GIVE a song a second moment after launch week. | Medium to high | M | The median song makes 82% of its sales on day one and 100% within a week. The three best sellers are the ones that kept selling after week one. |
| 5 | MEASURE the in-app browser loss, then cut it. | Unknown, plausibly high | M | The site's own script says purchases "don't work inside" in-app browsers: card, Apple Pay and Google Pay are all blocked there. That is where a link tapped on X, Instagram or TikTok opens. |
| 6 | VERIFY the contract on Basescan and Sourcify. | Medium, indirect | S | Unverified today. A quest builder had to reverse the ABI from bytecode. No buy has exceeded 100 USDC. |
| 7 | RELABEL "Pool Size". | Low direct, high for trust | S | The figure shown is total USDC ever bought, not money in a pool. The site sums to 1,947.30; the contract holds 365.94. It misled our own planning memo by a factor of 2.2. |
| 8 | KEEP drops at noon ET, Wednesday to Friday first, never Saturday. | Low to medium | S | 19 of 25 drops went live 11 AM to 1 PM; 46% of USDC is bought noon to 3 PM; Saturday has 5 buys ever. |
| 9 | FIX the personal-data field in the public song API. | None on volume; a real exposure | S | Reported to the operator on 13 Oct. Still present at 22:44 UTC. Detail withheld here until it is fixed. |
| 10 | WRITE DOWN the fee policy and move the fee Safe off a single key. | None on volume | S | The platform Safe is 1 of 1 and holds 81.18 USDC. No rule is recorded for where fees go next. |

Rows 1, 2, 6, 7 and 9 are hours of work each. Rows 1 and 2 are the two that the evidence says move money.

## 1. What actually limits WaveZStation today

The numbers that frame everything else:

| | |
|---|---|
| Gross sold, all time | 1,956.30 USDC in 234 buys |
| Buyer wallets | **35** |
| New buyer wallets per week | 1 a week through August, then 4, 4, 4, **10**, 4, 4 |
| Buyers with two or more buys | 24 of 35 |
| Buyers holding five or more songs | 14 of 35 |
| Buyers who bought once and never again | 11 of 35 |
| Median lifetime spend per buyer | 20.00 USDC |
| Share of volume from the top five wallets | 59.7% |

People who arrive tend to stay: two thirds buy again and 40% hold five songs or more. What is missing is arrivals. Thirty-five wallets in eighty days is the constraint, and the ranking above is ordered by what the evidence says brings a new buyer in or brings an existing one back.

## 2. Evidence for each change

### 2.1 Link previews (rank 1)

Fetched the top song's page as a normal browser and again as a link-preview crawler. Both return the same 21.5 KB shell:

- `<title>WaveZStation</title>`
- `<meta name="description" content="Web3 music platform"/>`
- no `og:title`, `og:image`, `og:description` or `twitter:` tags. The home page is the same.
- the visible text before scripts run is "Loading...". Song title, artist and cover are filled in by the browser afterwards, which a crawler never sees.

Control: the same search over the same file finds the `<title>` and description tags, so the search works and the `og:` tags are absent, not missed.

Why it ranks first: a song's sales happen in its first day (section 2.4), and the first day is driven by people posting the link. Right now that post shows no song, no artist and no cover on X, Farcaster, Telegram, Discord or iMessage. It also means search engines and AI assistants have nothing to index per song.

What it takes: server-side metadata per song route (title "Song by Artist on WaveZStation", the cover as the image, a line such as "14 supporters"). The data is already in the song API.

Not read: the `/share/buy/<tx>` pages that buyers post after a purchase. Whether those carry a preview is UNKNOWN.

### 2.2 Unclaimed earnings are the cheapest volume there is (rank 2)

| | |
|---|---|
| Fan share generated | 880.34 USDC |
| Claimed | 514.40 USDC, 139 claims, 15 wallets |
| Sitting unclaimed | **365.94 USDC**, spread over 182 holder-song positions |
| Buyers who have never claimed | 20 of 35 |
| Claimers who bought again after their first claim | **12 of 15** |
| Unclaimed as a share of the fan share generated | 41.6% |

Claiming and re-buying go together in this data: four of five people who have claimed came back and bought. Twenty wallets have money waiting and have never pressed the button. Whether they know is UNKNOWN; the site has a "Cash out" control, and nothing in the pages read shows a notification.

What it takes: a message when a holder's claimable amount crosses a threshold ("you have 6.40 USDC from four songs"), and the claimable total on the first screen after login. Caveat: twelve of fifteen is a small sample, and people who claim may simply be the engaged ones. The test is cheap: notify, then count buys by notified wallets in the following week.

### 2.3 Sales follow the number of buyers (rank 3)

Across the 25 songs listed since late August:

| Measure | Value |
|---|---|
| Correlation of a song's gross with its number of buyers | **0.88** |
| Correlation of a song's gross with its top buyer's share | -0.28 |
| Median share of a song's gross that is one wallet | 50% |
| Gross with each song's single largest buyer removed | 903.30 of 1,769.30 |
| Median buyers per song | 5 (range 2 to 18) |

Two things are true at once. Half of the money on a typical song is one person, and yet the songs that sold most are the ones more people bought. The best-selling song has 14 buyers, the second 18, the third 12. No song with four buyers is in the top ten.

What moved buyer count in the record: the week of 21 September brought 10 new wallets, against 4 in a normal week. That was the week the daily-quest work began and several songs were pushed together. One week is one data point, not a law.

Entry routes for the 35 buyers' first purchase: 17 with their own wallet calling the contract, 15 through a smart wallet created at login, 3 through a router or relay. So about half of all buyers needed the site to make them a wallet. The login path is doing real work and is worth protecting.

What it takes: the quest (section 5 of doc 2668 gives the verifier what it needs), and each artist bringing their own audience on drop day. Every one of the 21 artists has an X handle on their song record.

### 2.4 A song's life is one day long (rank 4)

| Share of a song's sales that came in | Median across 25 songs |
|---|---|
| its first 24 hours | **82%** |
| its first 7 days | **100%** |

The exceptions are the top of the table. The best seller made 39% of its sales in week one and the rest later. The third-best made 45%. The second-best made 19% on day one and 87% within the week. Songs that found a second moment are the ones that grew.

What it takes: a planned second moment per song. The record suggests candidates and proves none of them: a battle featuring the artist, a reaction round, a milestone post when a song passes a round number. This is the one row where the idea is not yet backed by a measured cause; the measured part is that almost nothing sells after week one unless something happens.

### 2.5 In-app browsers (rank 5)

The site's own script contains this message, shown to visitors it detects inside an app's built-in browser: purchases "don't work inside" that in-app browser, "card, Apple Pay, and Google Pay all get blocked", open the page in Safari or Chrome. The script also detects Farcaster's client.

So the team already knows and already shows a prompt. What nobody has is the size of the loss: how many visitors arrive that way and how many of them leave. That is UNKNOWN and no chain data can answer it. It matters because every channel used to promote a drop opens links in an in-app browser by default.

What it takes: first count it (visits that see the prompt, and how many reach a purchase). Then the usual fixes in order of effort: a one-tap "open in browser" link that works on each platform, and a Farcaster Mini App path so Farcaster users never leave the client.

### 2.6 What stops a bigger buy (context for ranks 3 and 6)

It is not the contract. A simulated `buyAccess` (read-only, nothing sent, from a fresh address given a pretend balance) succeeds at 5, 100, 1,000, 10,000 and 1,000,000 USDC. Controls: the same call below the 1 USDC minimum reverts, and without the pretend allowance it reverts with "transfer amount exceeds allowance". There is no cap in the contract.

What the buys look like:

| | |
|---|---|
| Buys of exactly 1.00 | 104 of 234 |
| Median buy | 2.00 |
| Most common amounts | 1 (104), 2 (24), 10 (21), 5 (17), 3 (13), 20 (10), 50 (5), 100 (3) |
| Buys of 50 or more | 12 buys, 823.00 USDC, by 7 wallets: 42.1% of all volume |
| Largest buy from a login-created smart wallet | 50.00 |
| Largest buy from a self-custody wallet | 100.00 |
| Smart-wallet buys of 20 or more | 7 of 74 |
| Self-custody buys of 20 or more | 21 of 123 |
| First buy of exactly 1.00 | 17 of 35 buyers |
| Of those 17, later made a buy of 10 or more | 7 |
| Of those 17, never bought again | 5 |

Reading it: people start at one dollar, and four in ten of them come back with ten or more. Large buys come from a handful of crypto-native wallets. Buyers who came in through a card or a login wallet stay small.

What plausibly holds size down, with how sure the data is:

- **The economics are steep and the page does not show them.** 55 cents of every dollar is gone for good, and the other 45 only comes back if later people buy. Measured. Whether the buy screen shows an estimate of what a buyer might earn is UNKNOWN (that part of the site loads on demand and was not read).
- **Trust.** Unverified contract, single owner key, single-key fee wallet. Measured facts; their effect on buy size is an inference.
- **Funding friction for card users.** Smart-wallet buys cap out lower. Measured; the cause is not.
- **No signal that bigger is normal.** Nobody has seen a buy over 100, because there has not been one.

### 2.7 Verifying the contract (rank 6)

Today: Basescan shows "Are you the contract creator? Verify and Publish"; Sourcify returns 404 for the address and 200 for the fee Safe.

What the bytecode says about how it was built: compiled with **Solidity 0.8.20**, and it carries an IPFS metadata hash. That hash did not resolve on three public IPFS gateways (two returned 403, one timed out), so the source cannot be recovered from outside. The team has to supply it.

What it takes, once the source and the exact compiler settings are in hand:

1. Basescan: Contract tab, Verify and Publish, "Solidity (Standard-Json-Input)", compiler 0.8.20, the same optimizer runs and EVM version used at deploy, plus the constructor arguments. Or one command from a Foundry project: `forge verify-contract <address> <ContractName> --chain base --watch`.
2. Sourcify: submit the same sources and metadata file; a full match follows if the metadata hash matches.
3. Check: the Contract tab shows source and a Read/Write panel, and Sourcify returns `exact_match`.

If the original settings are lost, verification fails on a bytecode mismatch and the only fix is finding the exact build. That is the one way this stops being an hour's work.

Why it matters for volume: integrators get an official ABI (the quest verifier needed one this week), wallets show a readable transaction instead of raw data, and anyone weighing a larger buy can read the rules they are buying into.

### 2.8 "Pool Size" (rank 7)

The song card labels a number "Pool Size". It is the API field `pool_total_usdc_wei`, which is the song's total shares, which is total USDC ever bought on that song (doc 2668 section 3.3). Nothing like that amount is in a pool: 45% went to the artist and 10% to the platform at once, and most of the fan share has been claimed.

| | USDC |
|---|---|
| Sum of "Pool Size" across the 29 listed songs | 1,947.30 |
| Actually held in the contract for all songs | 365.94 |

What it takes: rename it ("Total bought" or "Fan-funded"), and put the two numbers people care about beside it, both already derivable: paid to the artist (45% of it) and paid to supporters.

### 2.9 Drop timing (rank 8)

From the Eastern-time analysis of all 25 drops and 234 buys:

| | |
|---|---|
| Drops that went live 11 AM to 1 PM ET | 19 of 25 |
| USDC bought noon to 3 PM ET | 905.00 of 1,956.30 (46%) |
| Second window, the 6 PM hour | 297.50 |
| Buys by weekday | Fri 491.00, Wed 417.80, Mon 354.00, Sun 293.50, Thu 272.50, Tue 122.50, Sat 5.00 |
| Median first-week sales by drop day | Mon 14.50 (4 songs), Tue 16.75 (6), Wed 50.00 (5), Thu 70.00 (4), Fri 61.00 (4) |
| Drops per week, last five full weeks | 3, 4, 4, 5, 3 |

Noon is already the habit and it matches when people buy, so keep it. Wednesday to Friday drops had first weeks three to four times those of Monday and Tuesday drops, on four to six songs per day, which is too few to call a rule. If there are fewer than five songs in a week, the evidence says leave Monday and Tuesday empty first. Saturday should not be used.

### 2.10 The API field (rank 9)

A field carrying personal data is returned by a public, unauthenticated endpoint. It was reported to the operator on 13 October and was still returned at 22:44 UTC the same day. The field name, the count and how to reproduce it are in the private companion note and will be added here once it is fixed. The fix is removing one field from a public response.

### 2.11 Fees and keys (rank 10)

- The platform's 10% lands in a Safe with one owner and a threshold of one. It has received 195.63 USDC from the contract and holds 81.18.
- The contract's owner is one key. It can pause all buys or a single song. Its attempt to pull USDC out reverted in simulation.
- No written rule was found, in any public surface read, for when fees leave the Safe, where they go, or how income on Base relates to the Solana treasury's payout floor described in doc 2668 section 6.

What it takes: a short published policy, and a second and third signer on the Safe. Neither changes volume. Both change what happens on the day one key is lost.

## 3. Things that look like problems and are not

- **A buy-size cap.** There is none (section 2.6).
- **Retention.** 24 of 35 buyers bought more than once.
- **The split not being honoured.** It is exact on all 234 buys.
- **The owner being able to take the fan pool.** The rescue call reverts for USDC in simulation.

## 4. What this could not see

- Visits, sign-ups, abandoned checkouts, traffic sources. No analytics were available; every funnel statement above is inferred from who ended up buying.
- The buy dialog itself (amount presets, what it tells a buyer about earnings). It loads on demand and was not read.
- The post-purchase share pages.
- Why any individual bought. A quarter of all volume is one wallet, and its reasons are not on chain.
- Whether the best-selling songs sold because of the song, the artist's audience, or who happened to promote them.

## Also See

- [Doc 2668 - WaveZStation on-chain ground truth](../2668-wavezstation-onchain-ground-truth/) (one row of its Key Decisions is corrected in the same pull request as this doc: the route counts are 74, 30 and 7, not 111, 30 and 11)
- [Doc 2617 - WaveWarZ Base L2 migration architecture](../2617-wavewarz-base-l2-migration-bonding-curves/)
- [Doc 2634 - Memecoin idea ground truth](../../business/2634-memecoin-idea-ground-truth/)

## Next Actions

| # | Action | Owner | Type | Done when |
|---|---|---|---|---|
| 1 | Add per-song link-preview metadata to the song route | WaveZStation operator | site change | a song link pasted into X, Farcaster and Telegram shows the cover, title and artist |
| 2 | Add a claimable-balance notice and put the total on the first screen | WaveZStation operator | site change | a holder with unclaimed USDC is told once; buys by notified wallets are counted for a week |
| 3 | Verify the contract on Basescan and Sourcify | whoever holds the source and build settings | 1 hour if settings are known | Basescan shows source; Sourcify returns `exact_match` |
| 4 | Rename "Pool Size" and show artist and supporter payouts | WaveZStation operator | site change | the card no longer implies money is held |
| 5 | Remove the personal-data field from the public song API | WaveZStation operator | site change | the field is absent for all songs; rank 9 is then written up in full |
| 6 | Count in-app browser visits and their conversion | WaveZStation operator | analytics | a number exists for visits that saw the prompt and for how many bought |
| 7 | Ship the purchase quest with the verifier from doc 2668 | the quest builder, with Zaal | integration | new buyer wallets per week is measured before and after |
| 8 | Add signers to the fee Safe and write the fee policy | the team | governance | the Safe is at least 2 of 3 and the policy is one page somewhere the team can read |
| 9 | Re-run this doc's measures four weeks after any of rows 1, 2 or 7 ship | wavewarz lane | script | new buyers per week and day-one share are compared with today's |

## Sources

1. Base contract logs, receipts and read-only calls, blocks 49,105,370 to 52,565,323, via `https://base.gateway.tenderly.co`; the scanner is `research/wavewarz/2668-wavezstation-onchain-ground-truth/data/scan-logs.py`. [FULL: the same 234 buys and 139 claims as doc 2668, re-cut by buyer, route and song]
2. `eth_call` simulation of `buyAccess` with a state override on the USDC token (balance and allowance for a fresh address), same RPC. [FULL: five sizes plus two controls]
3. https://www.wavezstation.com/ , `/discover` and one `/song/<id>` page, fetched with curl as a browser and as a link-preview crawler, raw HTML. [FULL for the three pages; meta tags quoted]
4. The 21 script files those pages reference, 3.5 MB, searched as text. [PARTIAL: only scripts referenced by those three pages; the buy dialog is in a chunk that was not fetched]
5. https://www.wavezstation.com/api/discover and `/api/songs/<id>` for 29 songs, raw JSON, 19:31 and 22:44 UTC. [FULL]
6. https://basescan.org/address/0x6EEe0a8ebd1446a3a77a8F720bF37232fD88b255 and the Sourcify API, as in doc 2668. [PARTIAL: verification status only]
7. IPFS gateways ipfs.io, dweb.link and gateway.pinata.cloud for the contract's metadata hash. [FAILED: 403, 403, timeout]
8. https://wavezstation.com/docs, raw text. [FULL]
9. Foundry `forge verify-contract` and the Basescan verification form: described from prior use, not re-fetched today. [PARTIAL: steps not re-read against current docs; confirm flags with `forge verify-contract --help` before running]
10. Community: none found. Hacker News exact-match search for the product name returns 0 hits (the control query returns thousands); Reddit search returned a block page; X was not searched.
