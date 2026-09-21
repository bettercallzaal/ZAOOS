---
topic: wavewarz
type: audit
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs: "1237, 1644, 1785"
original-query: "WaveWarZ protocol: what the deployed program actually does, measured 2026-09-20 - the bonding curve constant correction (fitted 4.993e8 was wrong, exactly 5e8 with 100,000-token steps floored per trade), the fee split and the lamport that does not sum, the buy/sell slippage asymmetry (buy floor of 0 rejected, sell floor of 0 accepted, live client sends 0 on 92 of 92 sampled sells), settlement by larger pool with ties to B, the six-instruction set including the previously undocumented initializeMints, the account layout with two duplicate pool field pairs, the dust floor, and live validation of 38+ real trades predicted exactly during the finals. Depth: STANDARD."
tier: STANDARD
---

# 2525 — WaveWarZ protocol, measured against the deployed program

> **Goal:** Replace every inferred claim about the WaveWarZ Solana program with one measured against the program itself, and record the four that turned out wrong.

**A note on sources before the findings.** This doc has no Reddit, HN or X
source, so it does not satisfy Hard Requirement 7, and padding it with an
unrelated thread would be worse than saying so. Its sources are primary: the
deployed program's own responses to simulated transactions, its Anchor IDL, and
1,694 battle accounts read off mainnet. For questions of the form "what does
this program do", that is a stronger class of evidence than community
discussion, and every number below is reproducible by anyone with a public RPC.

## Key decisions

| Decision | Why | Confidence |
|---|---|---|
| **Use `CURVE_K = 5e8`, never the fitted `4.993e8`** | The 0.13% residual was per-trade flooring, not the constant. 17 buys and 5 sells reproduce EXACTLY under the corrected form | Measured |
| **Floor the token delta PER TRADE, not the running total** | Flooring the total matches a first buy into an empty pool 9 of 9 and misses later buys 5 of 8 by exactly one step | Measured |
| **Price a sell from the STORED supply (offset 196), not from the pool** | Minted supply is a sum of floored deltas and drifts below `sqrt(K x pool)`. Pricing off the pool overstated a small sell by **23.4%** | Measured |
| **Launch with BOTH `initializeBattle` and `initializeMints`** | The first alone returns `err: null` and leaves a battle nobody can ever trade | Measured |
| **Never send `minTokensOut: 0` on a buy; `minSolOut: 0` on a sell is fine** | The program rejects the first with `InvalidAmount (6006)` and accepts the second | Measured |
| **Correct doc 1237's "1.0% per trade goes to the artist" to 1.005%** | The program prints its own split: 502,500 of 750,000 on a 0.05 SOL buy | Measured |

## Findings

### 1. The bonding curve constant was a fit, and the fit was hiding the mechanism

    tokens_minted = floor( ( sqrt(5e8 * pool_after) - sqrt(5e8 * pool_before) )
                           / 100000 ) * 100000

`chain/CURVE.md` in the protocol repo recorded `C` as **4.993e8**, fitted
against 1,643 battles, and was honest that it could not close the question:
*"the constant is 4.993e8 as measured, and 5e8 is a plausible true value the
residual has not ruled out."* It listed integer truncation per trade first among
its untested candidates.

**That candidate was right.** Simulating buys against the deployed program and
reading the battle account back: `K = 5e8` with tokens minted in whole steps of
**100,000** reproduces **9 of 9** first buys and **8 of 8** later buys exactly.
Five sells reproduce exactly through `pool = supply^2 / 5e8`.

Flooring can only push one way, so accumulating it across thousands of trades
dragged the aggregate fit 0.13% below the round number.

**The step is per trade, and this is the part that fools a careful person.**
Flooring the running supply total matches every first buy into an empty pool -
nine of nine - and misses **five of eight** buys onto an existing pool by
exactly one step. The two models agree only when the pool starts empty, so a
derivation built from first buys alone confirms the wrong one.

**Consequence:** minted supply drifts steadily below the curve as a battle
trades. That is why the account stores `artist_a_supply` at offset 196 rather
than recomputing it.

**Not bit-exact.** Our square root and the program's differ by 1-2 token units
in 100,000 (0.002%), decisive only at a quantisation boundary. Bisected at a
1 SOL pool: the program accepts a **287,167** lamport buy and rejects **287,166**.

### 2. A 23.4% error in sell pricing, invisible where anyone would have looked

Flooring leaves part of the pool unrepresented by any token, and that residual
stays in the vault. Pricing a sell as `pool_before - poolAtSupply(supply_after)`
hands the seller the whole residual on top of their tokens' worth.

**The error is a CONSTANT number of lamports**, so it is worst exactly where
nobody tests:

| tokens sold | wrong quote | the program | overstated by |
|---|---|---|---|
| 100,000 | 109,520 | 88,740 | **23.42%** |
| 500,000 | 464,080 | 443,300 | 4.69% |
| 5,000,000 | 4,408,780 | 4,388,000 | 0.47% |
| 22,100,000 | 18,659,920 | 18,639,140 | 0.11% |

Priced from the supply curve instead, all five reproduce exactly.

### 3. The slippage asymmetry, and what the live client actually sends

| | buy | sell |
|---|---|---|
| floor of 0 | **rejected**, `InvalidAmount (6006)` | **accepted** |
| live client sends | 2% or 7%, a per-trade user setting | **0, on 92 of 92 sampled** |

`minTokensOut` and `minSolOut` are literal `u64`s in the instruction data, so
**every trade ever made is already public**. 512 landed trades decoded from 1,000
recent program transactions: **420 buys**, every one carrying a real floor and
none carrying 0 or 1; **92 sells**, every one carrying **0**.

The 2% and 7% values interleave within the same wallets (the value changes
between consecutive trades 160 times out of 419), so it reads as a user-selectable
setting rather than two clients or a changed default.

**Every sell on the live client goes out with no slippage protection.** Whatever
the pool does before it lands is what the seller takes. Buyers are protected
from exactly that risk. The program permits either, so this is a client choice.

### 4. The instruction set is six, and one of them was undocumented

Confirmed two independent ways: the IDL declares six, and a bucketing of 200
real program transactions by discriminator found exactly those six.

| instruction | accounts | args |
|---|---|---|
| `initializeBattle` | 8 | battle_id, **battle_duration**, start_time |
| `initializeMints` | 7 | none |
| `buyShares` | 13 | amount, artistA, minTokensOut, deadline |
| `sellShares` | 13 | amount, artistA, minSolOut, deadline |
| `endBattle` | 7 | none |
| `claimShares` | 9 | none |

**`initializeMints` was absent from the entire estate** until found by counting,
where it was **7.5%** of all program traffic. `initializeBattle` alone returns
`err: null`, writes a well-formed 353-byte account, derives the PDA a front end
would display, and leaves no mints — so nothing can ever be bought.

**Two argument traps.** The middle field of a launch is a **duration in
seconds** while the account stores an end time: pass an end time and the battle
runs **56.7 years**, with `err: null`, identical compute cost and an identical
log line. And the battle id **is** the start time in unix seconds, not an index.

**Anyone can launch.** The only signer is whoever pays the rent (~0.0055 SOL).
The transaction this was decoded from was signed by an ordinary wallet, not a
platform key.

### 5. Fees, and the lamport that does not add up

**1.500% on every trade**, split **67/33 toward the artist**. The program prints
its own breakdown; on a 0.05 SOL buy: total 750,000, artist 502,500, platform
247,500. So the artist takes **1.005%** of volume and the platform 0.495%.

**Doc 1237 says "The 1.0% per trade goes to the artist wallet."** That undersells
the artist by half a basis point and should be corrected.

**Both halves are floored independently and do not always sum.** One sell printed
61,063 + 30,076 against a fee of 91,140 — one lamport stays in the vault.
Compute in basis points: `Math.floor(750000 * 0.33)` is **247,499** and the
program says 247,500.

### 6. Account layout, and the duplicate pool fields

Byte 245 is named **`winner_decided`** in the IDL. **There is no field called
`settled`.** A battle past its `end_time` is not finished until that byte says
so, and a claim against one that has not settled returns `BattleNotEnded (6009)`.

**Two pairs of pool-like fields exist and the program writes the same value to
both**: `artist_{a,b}_sol_balance` at 212/220 and `artist_{a,b}_pool` at
228/236. Checked across every battle account on chain: **1,694 of 1,694**
identical on both sides. Reading either member of a pair is equivalent; reading
*across* the pairs is the mistake, since 228 is side A's pool.

Settlement follows the **larger pool**, and **a tie settles to artist B**. Seen
in the wild on 2026-09-19: battle 1789783495 closed 0.0493 against 0.0493 and
went to B.

### 7. Live validation

Run against the finals of 2026-09-20 with a watcher comparing every real trade
to the corrected model: **38 trades, 38 predicted exactly, 0 mismatched, 0 RPC
failures** in the first battle, continuing clean into the second.

These are trades other people made, with their own money, through the live
client. Every earlier verification in this estate was of a transaction we had
built ourselves.

## Also See

- [research/wavewarz/1237-wavewarz-onchain-economics](../1237-wavewarz-onchain-economics/) — carries the "1.0% to the artist" figure this doc corrects to 1.005%
- [research/wavewarz/1644-wavewarz-onchain-settlement-mechanics](../1644-wavewarz-onchain-settlement-mechanics/) — settlement split; this doc adds the tie rule and the `winner_decided` byte
- [research/wavewarz/1785-wavewarz-v2-judging-system-reference](../1785-wavewarz-v2-judging-system-reference/) — the judged winner, which disagrees with the settlement winner about one battle in eight

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Correct "1.0% per trade to the artist" to 1.005% in doc 1237 | @Zaal | PR to ZAOOS | 2026-09-27 |
| Send Candy the sell-side slippage finding (92 of 92 carry no floor) and ask whether it is deliberate | @Zaal | Message | 2026-09-22 |
| Merge wwtracker #333 so `/finals` and the diagnose tooling are on main behind `WW_FINALS` | @Zaal | PR merge | 2026-09-21 |
| Re-run `scripts/ww-verify-battle.ts` against the finals battles once settled, and append the final trade count to this doc | @Zaal | Script + doc edit | 2026-09-22 |

## Sources

- [wwtracker `lib/ww/quote.ts`](https://github.com/bettercallzaal/wwtracker/blob/main/lib/ww/quote.ts) — the corrected curve, fee split and sell pricing. `[FULL]` — method: local file, authored this session
- [wwtracker `lib/__fixtures__/ww-curve-measured.json`](https://github.com/bettercallzaal/wwtracker/blob/main/lib/__fixtures__/ww-curve-measured.json) — the 22 measured rows, asserted with no tolerance in `wwCurveMeasured.test.ts`. `[FULL]` — method: captured from `simulateTransaction` against mainnet
- [wavewarz-protocol `chain/CURVE.md`](https://github.com/bettercallzaal/wavewarz-protocol/blob/main/chain/CURVE.md) — the original fit and its honest open question, now resolved in place. `[FULL]` — method: local file
- [wavewarz-protocol `chain/wavewarz.idl.json`](https://github.com/bettercallzaal/wavewarz-protocol/blob/main/chain/wavewarz.idl.json) — instruction set, account layout, all 28 error codes. `[FULL]` — method: local file, byte-identical to the copy shipped in wavewarz.com's client bundle
- Solana mainnet, program `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` via `api.mainnet-beta.solana.com` — 1,694 battle accounts, 1,000 recent signatures, 512 decoded trades, and every simulation in this doc. `[FULL]` — method: `getProgramAccounts`, `getTransaction`, `simulateTransaction` with `sigVerify: false`
- [`zao-vault/projects/wavewarz-protocol-truths.md`](file:///Users/zaalpanthaki/zao-vault/projects/wavewarz-protocol-truths.md) — the private working record this doc is drawn from. `[FULL]` — method: local file

**No community source.** See the note under the title. Reddit, HN and X carry
nothing about this program's internals; the program does.
