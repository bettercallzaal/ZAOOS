---
topic: wavewarz
type: audit
status: research-complete
last-validated: 2026-10-13
superseded-by:
related-docs: "743, 1343, 406, 2634, 2525, 2617"
original-query: "do we have a wavewarz terminal with wavezstation in it i wanna do some research. WaveZStation contract 0x6EEe0a8ebd1446a3a77a8F720bF37232fD88b255 and WaveZStation fee wallet 0xd97409D949d032A12bD4B7af1f94F7D3222C8E72. On-chain ground truth for both addresses, explain WaveZStation plainly, model the 1000 dollar artist-buy idea with real numbers. Added the same afternoon: what a quest builder needs to verify a purchase, and a revenue section (who earns what, fee income over 30, 90 and 365 days, volume needed for 500, 2,000 and 3,000 dollars a month, levers with evidence)."
tier: DEEP
---

# 2668 - WaveZStation on-chain ground truth: the contract, the fee wallet, the $1,000 buy, and who earns what

> **Goal:** Replace what we believed about WaveZStation with what the chain says: which chain, whether the contract is verified, every buy and claim since deploy, where each dollar goes, what a $1,000 buy would actually do, how a third party verifies a purchase, and what WaveWarZ and WaveZStation earn today.

All figures were read on **2026-10-13 between 19:25 and 19:55 UTC**. WaveZStation figures cover Base blocks **49,105,370 (deploy) to 52,565,323**. Nothing was bought, sent, signed or posted. This is analysis, not advice.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | USE the `AccessPurchased` event as the only proof of a purchase. Do NOT verify by `tx.to` or `tx.from`. | 111 of 234 buys were sent through the ERC-4337 EntryPoint, 30 through a router contract and 11 through a third relay. Only 123 of 234 call the contract directly. The event is emitted on all 234. Section 5 has the exact fragment. |
| 2 | CORRECT the round-ten memo before any buy is planned: the site's "pool" figure is gross sales, not 45% of sales. | Saturday in LA has sold **370.80 USDC**, not about 802. Read from the contract's own `getSong` and matched by summing 33 buy events. |
| 3 | DESCRIBE a buy as three flows, not one: 10% platform, 45% creator wallets, 45% to whoever already holds the song, the buyer included. | Section 4.1. A wallet that already holds shares gets part of its own fan share back, so "45% goes to the artist and the rest is spent" is not what the contract does. |
| 4 | SAY "45% to the artist" only with the wallet list beside it. | The 45% goes to the song's creator wallets, split by the song's own basis points. Saturday in LA has two wallets at 50/50, and one of them is also the third-largest buyer on the whole platform. |
| 5 | ASK Zaal three facts before any revenue plan is written (section 6.6): which payout wallet is his, how WaveZStation's USDC reaches the SOL treasury, and whether the 10 October transfer is a recurring cost. | None of the three is on any surface searched. Guessing any of them would invent a number. |
| 6 | PLAN revenue around paid entries and main events, not around trade volume. | In the last three weeks about 0.68 of 0.81 SOL of treasury income was flat per-entry fees. The trade fee on 52.24 SOL of 30-day volume is 0.26 SOL. |
| 7 | SKIP Dune for this work until the account is upgraded. | The Dune MCP answered every query with "Your account is read-only. Upgrade to create content or run queries." Everything here came from public RPCs instead. |

## 1. What we already held, and what survived

| Source | What it said | Status after today |
|---|---|---|
| `wavezstation.com/docs` (raw HTML, read today) | Every sale: 45% fan pool, 45% artist and collaborators, 10% platform. Fans earn "proportionally to how much each fan contributed to the pool". | CONFIRMED on all 234 buys, to the micro-USDC. |
| Round-ten research memo, public `bettercallzaal/poidhz` `rounds/daily/d10/RESEARCH.md`, 2026-10-10 | Base, USDC, contract not verified, 45% paid in the same transaction. Also: pool = 45% of sales, so the top song had "about 801.78 USDC of cumulative sales". | Chain, verification and split CONFIRMED. The 801.78 is WRONG: pool total is gross sales (section 3.3), and every figure the memo derived from it needs redoing. |
| ZAOOS docs `wavewarz/743-wavewarz-whitepaper-v2-deep-dive`, `wavewarz/1343-wavewarz-partner-activation-jul2026`, `business/406-coinflow-isv-deep-dive-wavewarz-zao` | "wavestation" appears only as a Coinflow merchant ID for WaveWarZ fiat on-ramp. | UNRELATED to this contract. Same word, different thing. Do not cite these three for the Base product. |
| ZAOOS doc `business/2634-memecoin-idea-ground-truth` | A WaveStation quest verifies a submitted transaction hash. | Still the design. Section 5 is what that verifier needs. |
| WaveWarZ ICM box, `research/identity/icm-boxes/wavewarz.llm.txt` | 2,152 bytes, 9 mentions of WaveWarZ. | Says nothing about WaveZStation (0 matches for "station", in a file that does match "wavewarz"). The box has a gap. |
| A September brief for the daily quest (team notes) | "The contract is verified on Basescan." | WRONG then or changed since. It is not verified today (section 2.2). |

## 2. On-chain ground truth

### 2.1 Which chain

**Base, chain id 8453.** Determined by asking seven chains whether code exists at the address. Control: the same call on Base USDC returned code, so an empty answer means empty.

| Chain | Code at `0x6EEe...b255` | Fee wallet nonce and code |
|---|---|---|
| Base | **yes, 8,275 bytes** | contract (Safe proxy), 0.00043 ETH |
| Ethereum, Optimism, Arbitrum, Polygon, BNB Chain, Zora | none | no code, nonce 0, balance 0 |

Not searched: Solana (the address is an EVM address) and any EVM chain outside those seven.

### 2.2 Is the contract verified

**No.**

| Surface | Contract `0x6EEe...b255` | Control |
|---|---|---|
| Basescan address page (raw HTML) | carries "Are you the contract creator? Verify and Publish" | the USDC page has no such prompt |
| Sourcify API | 404, `match: null` | the fee wallet returns 200, `exact_match` |
| Blockscout API | FAILED, Cloudflare challenge (HTTP 403) with and without browser headers | not read |

So there is no published source and no published ABI. Everything below about functions comes from the deployed bytecode's selector table, from hashing candidate names until they matched, and from calling the contract read-only.

### 2.3 Deploy, owner, fee wallet

| Fact | Value | How read |
|---|---|---|
| Deploy block | 49,105,370, 2026-07-25 17:21:27 UTC | binary search on `eth_getCode`; code empty at block 30,000,000 as the control |
| Deploy transaction | `0x867d3cfe...83ed` | receipt `contractAddress` equals the contract |
| Deployer | `0xF3aF...886a` | same receipt |
| `owner()` today | the deployer, a single key. `pendingOwner()` is zero. | `eth_call` |
| `paused()` | false | `eth_call` |
| `usdc()` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Base USDC) | `eth_call` |
| Proxy | not a proxy (EIP-1967 implementation slot is zero) | `eth_getStorageAt` |
| Fee wallet `0xd974...8E72` | a Safe (SafeProxy 0.7.6 build to SafeL2), **1 owner, threshold 1**, owner `0x29F5...aa34`, nonce 7. Deployed at block 42,202,825, before the contract. | Sourcify record, `getOwners()`, `getThreshold()` |

Who controls the deployer key and the Safe owner key is not a chain fact and is not recorded here.

### 2.4 Functions and events

Names marked "matched" were recovered by hashing a guessed signature and getting the exact selector or topic. Names marked "4byte" come from the openchain signature database.

| Selector / topic | Name | Source | What it does |
|---|---|---|---|
| `0x45feb00d` | `buyAccess(bytes32 songId, uint256 amount)` | matched | the buy |
| `0xd168e8a8` | `buyAccessFor(bytes32,address,uint256)` | matched | buy on behalf of a buyer, used by authorised payers |
| `0x7790ddc6` | `claimRewards(bytes32)` | 4byte | withdraw the caller's fan earnings on one song |
| `0x7ed51748` | `claimMany(bytes32[])` | 4byte | same, several songs |
| `0xf02e5daa`, `0x70c329a5` | song creation, with and without a minimum amount | names not recovered | owner creates a song with wallets, splits and basis points |
| `0x684ea890` | `getSong(bytes32)` | 4byte | song config and total shares |
| `0x8ccf8618` | `songExists(bytes32)` | matched | |
| `0x83177db3` | `hasAccess(bytes32,address)` | 4byte | true once the address has bought |
| `0x1c757b95` | `userShares(bytes32,address)` | 4byte | USDC the address has put into that song, 6 decimals |
| `0xda4e6595` | `pending(bytes32,address)` | 4byte | claimable now. The sum over all 182 holder-song pairs is 365.937287, against 365.937316 held, so this is the full claimable view |
| `0x00f96434` | `pendingRewards(bytes32,address)` | 4byte | a smaller figure (94.13 summed). What it excludes is UNKNOWN without source |
| `0x7f197734` | name not recovered | | the address's share of the song in basis points (returned 4611 for 171 of 370.8) |
| `0x12446ebc`, `0x5f3f6946` | `setSongPaused(bytes32,bool)`, `updateSongMinAmount(bytes32,uint256)` | matched | owner controls per song |
| `0x8456cb59`, `0x3f4ba83a` | `pause()`, `unpause()` | 4byte | owner can stop all buys |
| `0xe8e561f9` | `setAuthorizedPayer(address,bool)` | 4byte | used once, block 52,181,230 (2026-10-04), to authorise router `0x25df...e8a0` |
| `0x1171bda9` | `recoverERC20(address,address,uint256)` | 4byte | owner token rescue, see 2.5 |
| topic `0x91d2571f...d1ad` | `AccessPurchased(bytes32 indexed songId, address indexed payer, address indexed buyer, uint256 amount, uint256 fanAmount, uint256 creatorAmount, uint256 platformAmount)` | matched | one per buy |
| topic `0xfec539b3...01c7` | `RewardsClaimed(bytes32 indexed songId, address indexed user, uint256 amount)` | matched | one per claim |
| topic `0x49aead6b...f0e7` | `SongCreated(bytes32,address,address[],uint16[],uint16,uint16,uint256)` | matched | one per song |

There is **no sell, no withdraw of principal and no transfer of shares** in the selector table. Money put in comes back only as a share of later buys.

### 2.5 Can the owner take the fan pool

Simulated only (`eth_call`, nothing sent). `recoverERC20(USDC, owner, 1)` called as the owner reverts with custom error `0xc5c5e773`. The control, the same call from a non-owner, reverts with the different error `0x118cdaa7` (the standard "not the owner" error). So the owner passes the ownership check and is then refused for USDC specifically, at block 52,565,290. That is consistent with USDC being a protected token. It is one simulation against unverified code, not an audit.

## 3. Activity since deploy

Method: every log emitted by the contract and by the fee wallet from block 49,105,370 to 52,565,323, pulled in 1,000-block windows from the Tenderly public Base RPC (3,460 windows), then the receipt and input of every one of the 415 transactions. Control: a window containing a known buy returned that buy. Basescan reports "263 transactions" to the contract; the difference from 415 is the relayed buys and the fee wallet's own transactions, which Basescan does not count as transactions to the contract. The scanner is `data/scan-logs.py`; run it and decode the three topics in section 2.4 to rebuild every figure here. The per-buy and per-claim tables are public chain data but they are a list of 35 buyers' wallets, so they are kept in the private companion note and not in this repo.

### 3.1 Totals

| | Value | Check |
|---|---|---|
| Buys | **234** | 0 failed transactions in the set |
| Gross paid in | **1,956.30 USDC** | USDC `Transfer` into the contract sums to 1,956.30 |
| To the platform Safe | **195.63 USDC, 10.00%** | 0 of 234 buys deviate |
| To creator wallets, same transaction | **880.34 USDC, 45.00%** | 0 of 234 deviate; transfers out to non-fee addresses minus claims equal 880.34 |
| To the fan pool | **880.34 USDC, 45.00%** | 0 of 234 deviate |
| Fan earnings claimed | 514.40 USDC in 139 claims by 15 wallets | |
| Still in the contract | **365.937316 USDC** | equals fan pool minus claims, and equals the contract's USDC balance on Basescan |
| Songs created on chain | 31 | the site API lists 29; the two extra are early test songs with 6.00 USDC between them |
| Buyer wallets | 35 | |
| Buy size | minimum 1.00, median 2.00, **maximum 100.00** | 104 of 234 buys are exactly 1.00; three buys of 100; **none of 1,000 or more** |

So the 45 percent figure shows up in three places that agree: the docs page, the `fanAmount` and `creatorAmount` fields of every purchase event, and the USDC transfers in the same transactions.

### 3.2 Over time

| Month | Buys | Gross USDC | Buyers | Claims | Claimed USDC |
|---|---|---|---|---|---|
| 2026-07 (from the 26th) | 6 | 6.00 | 1 | 4 | 2.70 |
| 2026-08 | 14 | 24.00 | 5 | 3 | 1.43 |
| 2026-09 | 138 | 1,475.30 | 26 | 69 | 376.36 |
| 2026-10 (to the 13th) | 76 | 451.00 | 21 | 63 | 133.91 |

By ISO week from the first week of September: 216.00, 185.80, 126.00, **816.00** (21 to 27 Sep), 270.00, 260.00, 53.50 (two days of the current week). Block times are computed as deploy time plus two seconds per block; control, block 52,565,304 computes to 19:32:35 UTC and the RPC reports the same second.

### 3.3 Per song, and the correction

| Gross USDC | Buys | Buyers | Song | Artist as listed |
|---|---|---|---|---|
| 370.80 | 33 | 14 | Saturday in LA | BennyJ504 |
| 264.00 | 22 | 18 | AI LUI - The Album (The Wavewarz Chronicles) | AI LUI |
| 248.50 | 15 | 12 | Fuck Yo FeelinZ | GodclouD |
| 162.00 | 13 | 8 | Killing Floor | GodclouD |
| 161.00 | 15 | 11 | WYAU - No Sleep Gang Anthem (ft. DaDutchess) | PKMN CTO |
| 128.00 | 7 | 7 | WAGBG | Nessy the Rilla |
| 119.00 | 8 | 8 | Rid This Rock of Disasters | r3plic4nt |
| 503.00 | 121 | | the other 24 songs together | |

**The site's `pool_total_usdc_wei` is the song's total shares, and one share is one USDC paid in.** Three reads agree: `getSong` returns 370,800,000 for Saturday in LA; the 33 purchase events for that song sum to 370.80; and the sum of the site's pool figures for 29 songs (1,947.30) plus the two delisted songs (6.00) plus one buy that landed during the read (3.00) is the 1,956.30 gross above. The 10 October memo divided the pool by 0.45 and got 801.78. That number should not be reused.

### 3.4 Who is buying

| Wallet | Gross USDC | Share of all volume | Note |
|---|---|---|---|
| `0x6c1dd135...6ae8` | 492.00 | 25.1% | |
| `0x7234...e9af` | 252.00 | 12.9% | 24 buys across 20 songs |
| `0x7e1e8ed4...a811` | 207.00 | 10.6% | **one of the two creator wallets of Saturday in LA**; 107.00 of it into that same song |
| `0xf8ac6bbe...edee` | 113.00 | 5.8% | also the largest claimer, 137.57 |
| `0xa3641168...6810` | 103.00 | 5.3% | |
| next 30 wallets | 789.30 | 40.3% | |

- Buys where the buyer is a creator wallet of that same song: **18 buys, 206.00 USDC**.
- Buys by any wallet that is a creator wallet of some song: **52 buys, 350.00 USDC (17.9% of volume)**.
- The Safe owner key bought once (1.00) and is itself a creator wallet on a song. The deployer key never bought (0 buys; the same filter finds 24 for the second wallet in the table, so the zero is real).

These are wallet facts from public chain data, shown truncated. Which person holds which wallet is not established in this doc.

### 3.5 The fee wallet's flows

| Direction | Amount | Detail |
|---|---|---|
| In | 195.63 USDC | 234 transfers from the contract, nothing else |
| Out | 15.85 USDC | six payments to `0x9c78...0164` (an EOA): 0.16, 2.57, 1.78, 1.00, 7.20, 3.14 |
| Out | 100.00 USDC | one payment to `0xd026...2a12`, block 52,428,298, 2026-10-10 15:25 UTC |
| Balance | **81.18 USDC** at block 52,565,323 (80.88 at block 52,565,290, before the last buy in the set added 0.30), 0.00043 ETH | `balanceOf` at a named block, same answer from the Tenderly gateway and from mainnet.base.org |

Scope, and one gap it leaves: 195.63 in minus 115.85 out is 79.78, and the Safe holds 81.18. The other 1.40 USDC reached it by a path this scan cannot see. The scan reads the Safe's own logs and the transactions that touched the contract, from the contract's deploy block; a plain USDC transfer into the Safe from a third party, or anything before 25 July, leaves no log on either address. So "the contract is its only source of USDC" is true of the scanned transactions and not proven beyond them.

## 3.6 Where the artist share goes

To the wallets in the song's own `creator_wallets` list, in the song's own `creator_splits_bps`, in the same transaction as the buy. Of the 29 listed songs: 21 have one creator wallet, 7 have two, one has six (2.5%, 30%, 60%, 2.5%, 2.5%, 2.5%). All 29 carry creator 4500 and fan 4500 basis points and a 1 USDC minimum. Saturday in LA pays `0x7e1e8eD4...a811` and `0x73A8C85C...0c5b` half each.

## 4. WaveZStation, plainly

**What a buyer does.** Picks a song on wavezstation.com, pays any amount of USDC from 1 dollar up, and gets access to the song plus "shares" equal to the dollars paid. Shares cannot be sold or moved. There is no price and no curve: a dollar is a share, for the first buyer and the hundredth.

**What happens to the dollar, in that same transaction.** 10 cents to the platform Safe. 45 cents to the song's creator wallets. 45 cents to the people who bought that song before, split by how many shares each holds. The buyer's own earlier shares count; the shares from this very buy do not. Checked by replaying four songs by hand against their claim amounts to the sixth decimal (for example: a 3.00 buy, then a 10.00 buy, then the first buyer claims exactly 5.85, which is their own 1.35 plus all 4.50 of the second buy's fan share).

**The first buyer of a song is a special case.** With nobody before them, the first buyer's own 45% is credited back to them. 74.25 USDC of fan share was assigned that way across the 31 songs.

**What an artist gets.** 45% of every buy, at once, in USDC, to whatever wallets the song was created with. No claim step. Total so far: 880.34 USDC across all songs. For the top song: 166.86 USDC, split over two wallets.

**What an early buyer gets.** A stream of later buyers' money, for as long as people keep buying that song. Being early matters a lot: the first buyer of Killing Floor put in 7.00 and has 45.44 claimable.

**How it relates to WaveWarZ battles.** Same team, different product, different chain. WaveWarZ is on Solana: two tracks, a timed battle, traders buy and sell on a bonding curve, a winner is decided, fees are about 1.5% of trade volume. WaveZStation is on Base: one song, no end date, no selling, and 55% of every dollar leaves the buyer for good (45 to the artist, 10 to the platform). The artists overlap; the wallets and the ledgers do not.

## 4.1 What a 1,000 USDC buy does, as contract behaviour

The idea on the table, as published in the round-ten memo: a 1,000 buy on the best artist, making them the first artist with four figures, "which 45% would immediately go to you". This section says what the contract does with such a buy. It is not a plan, and the figures for any particular wallet are in the private companion note.

State at block 52,565,323: the top song, Saturday in LA, has 370.80 shares held by 14 wallets. The largest holder has 46.1%, a creator wallet of the song has 28.9%, a third wallet 16.7%, and the other 11 together 8.3%.

**One buy of 1,000 USDC on that song:**

| Where it goes | USDC | When |
|---|---|---|
| Platform Safe | 100.00 | same transaction |
| Creator wallet 1 | 225.00 | same transaction |
| Creator wallet 2 | 225.00 | same transaction |
| Fan share to the largest existing holder (46.1%) | 207.52 | claimable at once |
| Fan share to the creator wallet that also holds shares (28.9%) | 129.85 | claimable |
| Fan share to the third holder (16.7%) | 75.24 | claimable |
| Fan share to the other 11 holders | 37.39 | claimable |

- **If the buyer holds no shares in the song,** all 1,000 leaves them: 450 to creators, 100 to the platform, 450 to earlier holders. They end with 1,000 of 1,370.80 shares (72.9%).
- **If the buyer already holds shares,** their own slice of the 450 comes back to them. For the largest holder that is 207.52, a net cost of 792.48 and 85.4% of the shares afterwards.
- **What the artist side receives:** 450.00 as creators. Because one creator wallet also bought its own song, it receives 225.00 plus 129.85, so 354.85 to one wallet and 225.00 to the other.
- **Price impact:** none. There is no price. The only thing that moves is who owns the future fan share.
- **What a holder earns later:** their share of 45 cents on each later dollar, falling as others buy. A holder at 85.4% would need about 4,797 USDC of further sales on that one song to take 792.48 back out (about 2,062 if the share never diluted, which it would). The song has sold 370.80 in 34 days and the whole platform 1,956.30 in 80.
- **The two headline claims:** both hold today. No buy has ever exceeded 100.00 and no song has reached 1,000 in sales, so any 1,000 buy would be the first four-figure buy, and on this song it would make the first four-figure song (1,370.80).
- **Earlier shares earn from later buys by the same wallet.** This follows from the rule in section 4 and it means the result of several buys is not the same as one buy of the same total. Anyone designing a quest or a promotion on top of this contract should know it; section 5 covers the quest side.
- **A song with no buyers** is the special case from section 4: the first buyer's own 45% is credited back to them.

**Properties that matter to anyone buying, as facts:**

1. The money cannot be withdrawn or sold. The only way back is other people buying the same song.
2. The contract is unverified. The split is observed, not read. One owner key can pause all buys or one song. The owner's USDC rescue reverted in simulation, which is reassuring and is not an audit.
3. The platform fee Safe is 1 of 1.
4. Volume is concentrated: one wallet is 25.1% of everything ever bought and the top five are 59.7%. A single 1,000 buy would be a third of all volume to date, and anyone with a block explorer can see which wallet made it.
5. A creator wallet of the top song is its second-largest holder, so 28.9% of the fan share of any buy there goes to that wallet on top of the creator split.
6. The top spot is close: the second song is 106.80 behind.
7. Tax and securities treatment of fan-share earnings is not assessed here.

## 5. Verifying a purchase (for the quest verifier)

The single reference transaction was not enough because buys reach the contract three ways. A verifier that checks `tx.to == contract` or `tx.from == user` misses 47% of real buys.

**Contract that records purchases (Base, chain 8453):** `0x6EEe0a8ebd1446a3a77a8F720bF37232fD88b255`. One contract for all songs.

**Event to require** (name and types recovered by hash match, since the source is unpublished):

```json
{"type":"event","name":"AccessPurchased","anonymous":false,"inputs":[
 {"indexed":true,"name":"songId","type":"bytes32"},
 {"indexed":true,"name":"payer","type":"address"},
 {"indexed":true,"name":"buyer","type":"address"},
 {"indexed":false,"name":"amount","type":"uint256"},
 {"indexed":false,"name":"fanAmount","type":"uint256"},
 {"indexed":false,"name":"creatorAmount","type":"uint256"},
 {"indexed":false,"name":"platformAmount","type":"uint256"}]}
```

`topic0 = 0x91d2571f73e755f74c311033a226d71e90497226bcd164949105c22376d6d1ad`

**From a transaction hash:** fetch the receipt, require `status == 1`, find logs where `address` is the contract and `topics[0]` is the hash above. Then:

- **buyer** = `topics[3]`. This is the wallet credited with access and shares. Use it, not `tx.from`.
- **payer** = `topics[2]`. Equal to the buyer on 203 of 234 buys; on the other 31 it is the router `0x25dfc610...e8a0` paying on the buyer's behalf.
- **song** = `topics[1]`, a bytes32. Map it to a title with `GET https://www.wavezstation.com/api/songs/<uuid>`, field `wavestation_song_id`; `GET /api/discover?limit=100&sort=funded` lists the uuids.
- **total USDC paid** = first data word, 6 decimals. The other three words are the 45 / 45 / 10 split and always sum to it.
- **when** = the block timestamp.
- **uniqueness** = (transaction hash, log index). One transaction can carry more than one purchase.

**The call a user's wallet makes** (again recovered by hash match; selectors `0x45feb00d` and `0xd168e8a8`):

```json
[{"type":"function","stateMutability":"nonpayable","name":"buyAccess","inputs":[{"name":"songId","type":"bytes32"},{"name":"amount","type":"uint256"}],"outputs":[]},
 {"type":"function","stateMutability":"nonpayable","name":"buyAccessFor","inputs":[{"name":"songId","type":"bytes32"},{"name":"buyer","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[]}]
```

The buyer first approves USDC to the contract, then calls `buyAccess`. `buyAccessFor` is what the router calls. Smart-wallet users reach `buyAccess` inside an ERC-4337 user operation, which is why the function call is a weaker signal than the event.

**Which song, release or collection.** The chain knows only songs: one bytes32 `songId` per song, no album or collection id. Anything wider is grouped off chain. The site API gives each song an `artist_id` and an `artist` name, so "any song by artist Y" is the set of `wavestation_song_id` values sharing one `artist_id`, and "any song" is every id for which `songExists` is true. A quest is valid when the event's `songId` is in the allowed set, its `buyer` is the user's wallet, its `amount` is at least the minimum, and its block time is inside the window.

**Worked example,** the transaction shared as the reference, `0xdc2945a7...a7c9`: one `AccessPurchased`, buyer `0x7234...e9af`, song `0x5ede9f12d38a2ed1c0cc618fc206d16dbd8067751ac5ab2a9a830d2994d0b97c` (AI LUI - The Album), amount 1.000000 USDC, 2026-09-20 20:53 UTC.

**Read functions, no ABI file needed:**

```json
[{"type":"function","stateMutability":"view","name":"hasAccess","inputs":[{"type":"bytes32"},{"type":"address"}],"outputs":[{"type":"bool"}]},
 {"type":"function","stateMutability":"view","name":"userShares","inputs":[{"type":"bytes32"},{"type":"address"}],"outputs":[{"type":"uint256"}]},
 {"type":"function","stateMutability":"view","name":"songExists","inputs":[{"type":"bytes32"}],"outputs":[{"type":"bool"}]}]
```

`userShares` is cumulative USDC that wallet has put into that song, so "bought at least X today" needs the event, and "has ever bought this song" needs only `hasAccess`.

**A better direction than hash submission:** poll `eth_getLogs` on the contract for `topic0` plus `topics[3] = the user's wallet` over the quest window. No hash to paste, no way to submit someone else's transaction, and relayed buys are caught the same as direct ones.

**Two things the quest design should know:**

- A buyer who already holds shares in a song gets part of their own fan share back, and a creator wallet buying its own song gets the creator share back too. The only part nobody can recover is the 10% platform fee. A reward worth more than the unrecoverable part of the minimum buy can be farmed. 18 self-buys by creator wallets already exist.
- The contract is unverified, so the fragment above is reconstructed. It matched all 234 buys. If the team publishes the source, replace it with the official ABI.

## 6. Revenue: who earns what today

### 6.1 The two fee models

| | WaveWarZ (Solana) | WaveZStation (Base) |
|---|---|---|
| Fee per trade or sale | about 1.5% of trade value: 1.005% artist, 0.495% platform. Plus 3% of the losing pool to the platform at settlement. Plus flat per-entry fees paid straight to the treasury. | 10% platform, 45% creators, 45% earlier buyers |
| Source for the rate | public `bettercallzaal/wwtracker`, `docs/WAVEWARZ-RESEARCH.md` ("0.495% of every trade + 3% of every loser pool") | every purchase event, section 3.1 |
| Where the platform cut goes | treasury wallet `FNjYtwKVsbQzSmoBgLqa8ZGSJTzexQJi6xmV97iakq37` | Safe `0xd974...8E72` |
| Split of the platform cut | recorded as a model: surplus above a **3.5 SOL floor** is split 33% operations, 22% Hurricane, 22% Candy, 22% Zaal (`lib/distributions.ts` and `docs/ARCHITECTURE.md` section 10 in wwtracker; the four add to 99%) | **UNKNOWN.** No split is recorded for the Safe on any surface searched |

**Zaal's share, stated carefully.** The 22% is a model written in a public repo, with every recipient wallet field empty and every distribution entry "TBD - awaiting founder data". The chain shows payments of that shape (below). Which receiving wallet is his is **UNKNOWN** and is question 1 in section 6.6. Nothing here infers his share from his being on the team.

### 6.2 The treasury against its floor

Sources: wwtracker's public balance API (`/api/balance`, daily rows to 2026-09-23, backed by a Dune query) and, from 23 September on, all 547 successful treasury transactions read from the Solana public RPC. Continuity control on the transaction set: each transaction's closing balance equals the next one's opening balance on 544 of 546 joins.

| Fact | Value |
|---|---|
| Balance now | **2.7526 SOL** (slot 456,562,595), about 295 dollars at 107.20 per SOL (Coinbase spot, 19:48 UTC) |
| Distance to the 3.5 SOL floor | **0.7474 SOL short**, about 80 dollars |
| First day at or above 3.5 | 2026-04-14 |
| Days at or above 3.5 | 134 of the 163 days from 14 April to 23 September |
| Pattern from April to September | a weekly drop back to almost exactly 3.50, usually on a weekend: 18 such drops of 0.25 SOL or more in the daily data, the largest 3.52 SOL on 27 June and 2.28 SOL on 26 July |
| Last distribution | **2026-09-28 04:34 to 04:37 UTC**: 0.0726 SOL to each of `93cvxaZu...tk7r`, `6BKXGpzQ...jKko`, `62g5hYiS...kbjM`, and 0.1122 SOL to `EpnZnf28...Zqf7`. Total 0.3300 SOL, split 22 / 22 / 22 / 34 |
| What took it below the floor | **2026-10-10 15:19 UTC**: one transfer of 0.9063 SOL to `Eota8NVh...gbVu`. Balance went from 3.71 to 2.75. Six minutes later the Base Safe sent its 100.00 USDC (section 3.5). The purpose of either transfer is not on chain. |
| Since then | no distribution; 2.75 to 2.78 SOL |

At 22%, the 28 September payment was 0.0726 SOL per founder, about 7.80 dollars. The weekly drops in August and September were 0.37 to 0.56 SOL, so a 22% share ran about 0.08 to 0.12 SOL a week, 9 to 13 dollars at today's price.

### 6.3 Fee income over 30, 90 and 365 days

WaveWarZ volume is from the public battles API (1,618 battles, read 19:49 UTC; its own stats endpoint reports 980.97 SOL lifetime and my sum of the rows is 980.9665). The platform trade fee is that volume times 0.495%. Dollar figures use 107.20 per SOL at the time of reading, not the price on each day, because per-day prices were not fetched.

| Window | WaveWarZ battles | Volume SOL | Platform trade fee SOL | at 107.20 | WaveZStation gross USDC | WaveZStation platform fee USDC |
|---|---|---|---|---|---|---|
| 7 days | 10 | 1.2130 | 0.0060 | $0.64 | 240.00 | 24.00 |
| 30 days | 84 | 52.2397 | **0.2586** | **$27.72** | 1,527.50 | **152.75** |
| 90 days | 381 | 466.2995 | 2.3082 | $247.44 | 1,956.30 (whole life, 80 days) | 195.63 |
| 365 days | 1,550 | 863.5768 | 4.2747 | $458.25 | same | same |

The trade fee is not the whole of WaveWarZ income. For 23 September to 13 October (20.5 days, 14.76 SOL of volume, 52 battles) the treasury's transactions break down as:

| Line | SOL |
|---|---|
| Flat transfers in (46 of 0.005 or 0.02 SOL and a few larger), net of one wallet's 0.21 round trip | about +0.68 |
| Fees arriving on other people's buys and sells | +0.052 |
| Arriving at battle end | +0.078 |
| **Real income** | **about +0.81** |
| The treasury's own trading (it buys both sides): 4.3527 out, 4.2188 back | -0.134 |
| Battle setup costs | -0.267 |
| Left before payouts | about +0.41, or 0.14 SOL a week |
| Distribution, 28 Sep | -0.330 |
| Transfer, 10 Oct | -0.906 |

So at the current baseline the treasury's income is mostly flat per-entry fees, and it nets roughly 0.14 SOL a week before anyone is paid. Gross treasury inflow in the daily data is larger (2.12 SOL in September, 3.15 in August) because it includes the treasury's own claims on battles it seeded; those are not revenue.

In the last 30 days WaveZStation's platform fee (152.75 USDC, about 1.42 SOL) was 5.5 times WaveWarZ's trade fee (0.26 SOL).

### 6.4 Sensitivity: what it takes for his share to reach 500, 2,000 and 3,000 dollars a month

Assumption: his share is 22% of what is distributed, per the recorded model. All at 107.20 per SOL.

| His share per month | Surplus that must be distributed | WaveWarZ monthly volume if it came only from the 0.495% trade fee | Same at a 3% all-in take | WaveZStation monthly sales if he got 22% of its 10% (not on record) |
|---|---|---|---|---|
| $500 | $2,273 (21.2 SOL) | 4,283 SOL ($459,000) | 707 SOL | 22,727 USDC |
| $2,000 | $9,091 (84.8 SOL) | **17,131 SOL ($1.84M)** | 2,827 SOL | 90,909 USDC |
| $3,000 | $13,636 (127.2 SOL) | 25,697 SOL ($2.75M) | 4,240 SOL | 136,364 USDC |

For scale: WaveWarZ did 52.24 SOL in the last 30 days and 380.95 SOL in its best month ever (July 2026). WaveZStation did 1,527.50 USDC in the last 30 days. The 3% column is an illustration from the 1.4% to 6.3% range that wwtracker's own July note measured; it does not scale cleanly, because much of it is flat fees per battle.

**Keeping the wallet at 3.5 SOL.** Refilling the 0.7474 SOL gap at 0.14 SOL a week takes about five weeks with no payouts and no further costs. If a transfer the size of the 10 October one recurs monthly, the treasury needs about 0.21 SOL a week more than it nets now, roughly 2.5 times the current rate, before any distribution. Whether it recurs is question 3.

### 6.5 What has actually moved volume

| Lever | Evidence |
|---|---|
| Main events | 191 main battles carry 727.54 of 980.97 SOL (74%), 3.81 SOL each. 1,393 quick battles carry 242.84 SOL, 0.174 each. |
| A few days are most of the history | the ten biggest days are 51.8% of lifetime volume, out of 310 days with a battle |
| One series | LUI vs GEEK MYTH on 19 and 20 July: three battles, 342.0 SOL, 35% of all volume ever |
| Other spikes | 2 March (ItzWonderfull vs STILOWORLD, 39.46 SOL that day), 21 September (STORMI vs GEEK MYTH, 24.92), 11 June (Geek Myth vs Taji Kamikaze, 21.52), 8 June (AI LUI vs Benny J, 14.20) |
| Spikes do not stick | wwtracker's July note measured the day after the 342 SOL weekend back at 0.16 to 3.5 SOL a day. The weeks since: 4.78, 4.27, 12.38, 9.12, 14.06, 5.97, 3.51, 12.02, 33.88, 4.42, 1.50 |
| Quick battles are a floor, not growth | 18 to 35 SOL a month every month since January; October to date 4.40 with no main event |
| Paid entries | 46 transfers of 0.005 or 0.02 SOL in 20.5 days (10 of them one wallet's round trip) produced more treasury income than all trade fees. Count of entries, not SOL traded, is what the baseline income tracks |
| A 10% sale beats a 0.5% trade | WaveZStation's fee on 1,527.50 USDC out-earned WaveWarZ's trade fee on 52.24 SOL (about 5,600 dollars) by 5.5 times |
| WaveZStation's one spike | week of 21 September, 816.00 USDC: the daily-quest work started that week, and three wallets account for most of the large buys. A quarter of all WaveZStation volume is one wallet |

No lever here is a recommendation to trade. They are what the record shows moved the number.

### 6.6 Questions only Zaal can answer

1. Which Solana wallet receives your share? The 28 September payment went to `93cvxaZu...`, `6BKXGpzQ...` and `62g5hYiS...` (0.0726 SOL each). Is one of them yours, and is 22% the standing agreement?
2. How do WaveZStation's USDC fees reach the SOL treasury, if they do? The Safe has paid out twice: 15.85 USDC in small amounts to one address and 100.00 USDC on 10 October to another. Neither path to Solana is recorded. Does WaveZStation income count toward the 3.5 SOL floor, or does it have its own threshold?
3. Was the 0.9063 SOL transfer on 10 October a one-off or a recurring cost?
4. Are both creator wallets on Saturday in LA the artist's?

## Also See

- [Doc 743 - WaveWarZ whitepaper v2 deep dive](../743-wavewarz-whitepaper-v2-deep-dive/)
- [Doc 1343 - WaveWarZ partner activation](../1343-wavewarz-partner-activation-jul2026/)
- [Doc 2525 - WaveWarZ protocol, measured against the deployed program](../2525-wavewarz-protocol-measured/)
- [Doc 2617 - WaveWarZ Base L2 migration architecture](../2617-wavewarz-base-l2-migration-bonding-curves/)
- [Doc 406 - Coinflow ISV deep dive](../../business/406-coinflow-isv-deep-dive-wavewarz-zao/)
- [Doc 2634 - Memecoin idea ground truth](../../business/2634-memecoin-idea-ground-truth/)

## Next Actions

| # | Action | Owner | Type | Done when |
|---|---|---|---|---|
| 1 | Send the section 5 fragment to the quest builder | Zaal (his message to send) | outbound, his tap | the verifier reads `AccessPurchased` instead of `tx.to` |
| 2 | Answer the four questions in 6.6 | Zaal | his facts | each has a wallet or a yes/no beside it |
| 3 | Correct the 801.78 sales figure in the round-ten memo and anything derived from it | poidhz lane | PR | the memo says 370.80 with this doc as the source |
| 4 | Ask the WaveZStation operator to verify the contract on Basescan | Zaal to the team | outbound, his tap | the Contract tab shows source; section 5's ABI can be replaced with the official one |
| 5 | Add WaveZStation to the WaveWarZ ICM box, or give it its own | Zaal-gated box edit | box PUT | the box names the chain, the contract and the 45/45/10 split |
| 6 | Fill `lib/distributions.ts` in wwtracker with the 28 September distribution and the recipient wallets once question 1 is answered | wavewarz lane | PR | four TBD rows replaced by measured ones |
| 7 | Re-run `data/scan-logs.py` whenever these figures are quoted again | whoever quotes them | script | the figures carry that day's block |

## Sources

Method is stated for each, because a summary is not a read.

1. Base contract `0x6EEe0a8ebd1446a3a77a8F720bF37232fD88b255` and Safe `0xd97409D949d032A12bD4B7af1f94F7D3222C8E72`: `eth_getLogs`, `eth_getTransactionReceipt`, `eth_getTransactionByHash`, `eth_call`, `eth_getCode` against `https://base.gateway.tenderly.co` and `https://mainnet.base.org`, raw JSON-RPC. [FULL: all logs from deploy to block 52,565,323, all 415 receipts]
2. https://basescan.org/address/0x6EEe0a8ebd1446a3a77a8F720bF37232fD88b255 - curl, raw HTML, strings matched. [PARTIAL: verification prompt, transaction count and USDC balance read; transaction list pages not read]
3. https://sourcify.dev/server/v2/contract/8453/0x6EEe0a8ebd1446a3a77a8F720bF37232fD88b255 (404) and the same path for the Safe (200, `fields=all`). [FULL]
4. https://base.blockscout.com/api/v2/addresses/0x6EEe0a8ebd1446a3a77a8F720bF37232fD88b255 - [FAILED: HTTP 403 Cloudflare challenge, with and without browser headers. Not needed after source 1.]
5. https://www.wavezstation.com/docs - curl, HTML stripped to text. [FULL: 1,469 characters of text, quoted in section 1]
6. https://www.wavezstation.com/api/discover?limit=100&sort=funded and `/api/songs/<id>` for all 29 songs - curl, raw JSON, 19:31 UTC. [FULL]
7. https://api.openchain.xyz/signature-database/v1/lookup - selector and topic lookups. [FULL for the names marked 4byte]
8. Dune MCP - [FAILED: "Your account is read-only. Upgrade to create content or run queries." No Dune number appears in this doc except through source 11.]
9. Public Base RPCs tried for history and refused: publicnode (403 on ranges over 2,000 blocks and on old blocks), drpc (400), 1rpc and nodies (50-block cap), blastapi (400), onfinality (429), llamarpc (525). [FAILED, recorded so the next reader starts at Tenderly]
10. https://github.com/bettercallzaal/poidhz/blob/main/rounds/daily/d10/RESEARCH.md - local clone at commit 9050ccd, read in full. [FULL]
11. https://github.com/bettercallzaal/wwtracker - `lib/distributions.ts`, `docs/ARCHITECTURE.md` section 10, `docs/WAVEWARZ-RESEARCH.md`, `docs/research/wavewarz/2026-07-30-cadence-and-treasury-revenue.md`, read from `origin/main` at c17ea43. [PARTIAL: those four files, not the whole repo]
12. https://wwtracker.vercel.app/api/balance - curl, raw JSON, 662 daily rows to 2026-09-23. [FULL; the rows stop on 23 September, which is why source 13 exists]
13. Solana treasury `FNjYtwKVsbQzSmoBgLqa8ZGSJTzexQJi6xmV97iakq37`: `getBalance`, `getSignaturesForAddress`, `getTransaction` against `https://api.mainnet-beta.solana.com`. [PARTIAL: every transaction from 2026-09-23 to 2026-10-13 (558 signatures, 547 successful). Earlier history is from source 12 at daily grain only.]
14. https://wavewarz.info/api/public/battles (paged, 1,618 rows) and https://wavewarz.info/api/public/stats - raw JSON, 19:49 UTC. [FULL]
15. https://api.coinbase.com/v2/prices/SOL-USD/spot - 107.20, 19:48 UTC. [FULL]
16. Community: https://hn.algolia.com/api/v1/search?query=wavezstation&typoTolerance=false returns 0 hits, and 0 for "wavewarz"; the control query "bonding curve" returns 2,469. Reddit search JSON [FAILED: non-JSON block page for every query including the control]. X was not searched. So: no community discussion found on Hacker News, and Reddit and X are unsearched, not empty.
17. ZAOOS `research/identity/icm-boxes/wavewarz.llm.txt` and docs 743, 1343, 406, 2634, read by keyword from `origin/main`. [PARTIAL: keyword reads]
18. Team notes outside this repo (the September quest brief and a September call recap) - read by keyword. [PARTIAL]
