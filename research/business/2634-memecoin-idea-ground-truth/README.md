---
topic: business
type: decision
status: research-complete
last-validated: 2026-10-07
superseded-by:
related-docs: "1108, 2195, 2384, 2376, 2422, 988, 1096, 2101, 2296"
original-query: "we just had a crazy idea for a memecoin can we open a terminal to brainstorm on ideas like that ... research /zao-research"
tier: STANDARD
---

# 2634 - Before a memecoin idea: what ZAO already has, the launch rails today, and six questions

> **Goal:** Zaal and Danny (blahkheart) had a memecoin idea after their stream on 2026-10-07. The idea itself has not been written down yet. This doc is the ground a brainstorm stands on: what The ZAO already decided and built, how the launch rails work today, what the evidence says, what Danny's stack offers, and the questions to answer before anything is tested. **Nothing is launched, bought or posted by anyone on the strength of this doc.**

## Summary

1. ZAO is not starting from zero: about forty research docs cover creator coins, a BCZ token went live on 2026-08-26, and Sparkz already has a public repo and a locked position, "start with a spark, not a token".
2. On every rail a launch cannot be taken back. On Clanker the supply is fixed at 100 billion and the liquidity is locked forever. Treat "launch" as a one-way door.
3. The one measured study found that 98.6 percent of pump.fun tokens collapsed. What makes the rare survivor hold is mostly stories, not data.
4. Danny's stack is a different tool: paid access passes (Unlock locks), quests, and an on-chain affiliate contract. It can test whether people show up without any tradeable token.
5. Six questions and one small, reversible test per rail are at the end. The cheapest honest test of a memecoin idea does not involve a coin.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | READ docs 1108 and 2195 before the brainstorm, not after | 1108 (DEEP) already compares "pure memecoin, no promises" with "utility token" on legal exposure; 2195 already has the anti-rug posture. A new idea should start from them |
| 2 | TREAT any launch as irreversible and therefore Zaal-gated | Every rail below fixes supply and locks or burns liquidity at creation. `lane-autonomy.md`: on-chain and public are his alone |
| 3 | TEST the idea without a token first | Sparkz's own locked position is tokenless-first; Danny's quests and locks can measure demand; a testnet deploy can prove the mechanics |
| 4 | DO NOT describe the coin as funding anything or returning anything until counsel has seen it | Doc 1108: the safest shape promises nothing; treasury rewards and "we will build value" bring back the investment-offer question. These are questions for him and counsel, not advice |

## 1. What The ZAO already has or decided

Counted on origin/main, 2026-10-07 (`git grep -l -i` over research doc READMEs): "clanker" 162 docs, "sparkz" 152, "$ZABAL / ZABAL token" 142, "creator coin" 54, "bonding curve" 49, "pump.fun" 19, "memecoin" 17, "zora coin" 14, "culture coin" 12, "f2dc" 1. About forty docs have one of these in the title.

| Thing | State | Where |
|---|---|---|
| **BCZ token** | LIVE. Went live 2026-08-26 through Jim's CEN launcher; Zaal swapped 0.001 ETH into it on the call ("we're officially live") | doc 2422 |
| **$ZABAL** | Exists as a token in the estate's docs (Clanker and Empire Builder integration, an Avalanche and x402 plan). Contract and live state NOT re-verified in this run | docs 631, 723, 1094 |
| **Sparkz** | Public repo `bettercallzaal/sparkz`, last pushed 2026-09-28: "Start with a spark, not a token. Every project is a Capsule ... not a coin. Farcaster-native, on Base." A configurable launcher with an AI advisor on the Clanker and Empire Builder rail. Positioning locked: creators say "back the album", never "coin" | docs 1096 to 1108, 2251, 2376; memory `project_sparkz_configurable_ai_advisor` |
| **Culture Coins and Meme Engines** | Brandon Ducar's white paper (2026-07-17), the protocol Sparkz implements: Creator Coin, Culture Coin, Culture Capsule, Meme Engine, Receipts. Hard rule in it: no single person stays the sole identity, controller, contributor, treasury beneficiary and governance authority of a verified Culture Coin | memory `project_culture_coins_meme_engine` |
| **f2dc** (Farcaster 2 Devcon) | IDEA ONLY. A crowdfund coin for Devcon 8, "a light Nouns DAO, but with liquid tokens". Not scoped or built | memory `project_f2dc` |
| **zaalcaster token** | PLAN ONLY (doc 988, 2026-07-07): stake plus tip, 50 percent burned and 50 percent to Zaal | doc 988 |
| **Legal framing** | WRITTEN, DEEP. Phase 1 "Pure memecoin (Clanker launch, zero promises) - lowest risk"; adding revenue sharing raises it. Cites the SEC staff statement on meme coins of 2025-02-27 and three enforcement cases | doc 1108 |
| **Anti-rug posture** | WRITTEN. Keep "born-locked + single-sided walls + permanent fee streams"; publish top-10-wallet concentration by default | doc 2195 |
| **Clanker v5 notes** | WRITTEN from two calls: fee recipients changeable after launch; "Token dies when its AI is broke" | docs 2101, 2296 |
| **deez's launcher** | A contact's competing launcher with fee protection at the token level, 10 ETH minimum | doc 953; memory `project_deez_token_launcher` |

Built: the BCZ token, the Sparkz repo. Everything else on this list is writing.

## 2. Launch rails today (fetched 2026-10-07)

| | Clanker (Base, Farcaster-native) | Zora coins (Base) | pump.fun (Solana) | Flaunch (Base) |
|---|---|---|---|---|
| Who can launch | Anyone who tags @clanker in a Farcaster cast with a name, ticker and optional image; also clanker.world and an SDK | Any Zora account. Three types: Creator Coin (one per profile, ticker is the username), Content Coin (one per post), Trend Coin (memes and moments) | Anyone. "Create a coin 0 SOL / 0 USDC" | "creators, communities, and developers" [PARTIAL] |
| Supply | "total supply of 100 billion ... The token isn't mintable after this step" | 1 billion per coin. Creator Coin: "50% to creator - Automatically distributed over 5 years", 50% tradeable. Content Coin: 10M to the creator, 990M tradeable. Trend Coin: "Entire 1B supply goes into the pool, no creator allocation" | Market cap is computed on 1 billion tokens | not read |
| Fees and who gets them | Creator-set swap fee; "The Clanker fee is fixed at 20% of LP fees". Table: creator 1% + protocol 0.2% = 1.2% total. Farcaster bot deploys: "Users will receive 80% of LP fees as creator rewards" | Creator and Content Coins: 1% trading fee; 20% of it is re-minted as locked liquidity, 80% goes to creator, referrers, Doppler and protocol. Trend Coins: 0.01%, "All collected fees go to the protocol". A "Sniper Tax" of 99% decaying to the base fee over 10 seconds | On the bonding curve: creator 0.300%, protocol 0.95%, LP 0%, total 1.25%. After graduation to PumpSwap the split varies with market cap; 0.015 SOL charged at graduation | "creator revenue in ETH, and configurable treasury behavior" [PARTIAL] |
| What the creator controls after | Claims rewards on the token's admin page. Optional vault: up to 30% of supply, locked at least 31 days (30% and 31 days are the bot's defaults if a vault is asked for) | Earns from every trade; metadata can be updated (an "Update Coin" SDK page exists, not read) | Creator fee; can opt to send it to charity; a "community take over" can change the fee owner | not read |
| What cannot be undone | Supply is fixed. "The LP Locker has no withdraw function, so LP NFTs that are deposited into it can never be withdrawn and are effectively locked forever" | One Creator Coin per profile, ever. The 20% liquidity re-mint is "essentially locked and burned" | The coin exists and trades from the first second | not read |

Two more that exist but were not fetched this run: Empire Builder and Jim's CEN launcher, both already used by ZAO (docs 1094, 2422).

What this means for an idea: on Clanker and Zora the liquidity cannot be pulled, which removes the classic rug. It does not remove the other one doc 2195 names: insiders holding supply and selling it. A Zora Trend Coin gives the creator nothing at all, by design. On pump.fun the platform takes about three times the creator's share on the curve.

## 3. What held and what died: evidence and lore

**Evidence.** Solidus Labs, "The 2025 Rug Pull Report" (May 2025), tokens created on pump.fun between January 2024 and March 2025: "Over 7 million tokens deployed with at least five trades, but only 97,000 tokens maintain liquidity above $1,000. A staggering 98.6% of tokens on Pump.fun collapse into worthless pump-and-dump schemes shortly after launch". The same report says "93% of liquidity pools on Raydium have exhibited characteristics of pump-and-dump schemes or rug pulls". Solidus sells compliance tooling, so it has a reason to find fraud; the token counts are still the only measured base rate found in this run.

**ZAO's own earlier reading** (docs 2384 and 2195, not re-fetched): "100K tokens in 48h" on Zora shows how low the barrier is; most rugs are insider accumulation and post-graduation dumps through a contract working as designed; the most cited warning sign is top-10 wallets (excluding the pool) holding more than 30 percent of supply.

**Lore.** Why the survivors survive. "Community", "a real meme", "fair launch", "the dev stayed": each is a story told about the winners after they won. No source fetched here measures what separates a community coin that held from one that died. A second survival dataset (CoinGecko's failed-coins study) could not be fetched. So: the base rate is evidence; the recipe is lore. Say so in the brainstorm.

## 4. What Danny's stack offers (vault meeting notes only)

From three notes on zao-vault origin/main: 2026-09-03, 2026-09-07 and 2026-09-16.

- **Access passes are Unlock locks.** Danny: "You need an access pass, which is basically an Unlock Protocol lock, to get access to the daily quest." P2E Inferno has a lobby, daily quests, badges and paid passes; full membership is $12, with a trial tier.
- **An on-chain affiliate contract already exists.** Danny: "that's exactly the reasoning behind the infrastructure that I built." Zaal's condition, on record: "I hate affiliate marketing in general. The way it's done is poor because it's all MLM", versus a design "when there's a natural benefit for the people who already use it". Whether ZAO uses the contract was left as an open decision on 2026-09-03.
- **Quests check real on-chain actions.** The 09-16 design for a WaveStation quest verifies a submitted transaction hash, and reward NFTs are "non-transferable (to stop wallet-rotation gaming)".
- **T-Rex is the open-source Unlock events build.** Danny: "you can still check out T-Rex, because that's still built with Unlock ... t-rex.live". P2E Inferno itself was moved private "till you got enough revenue to get proper auditors".
- **A lesson from the same calls:** P2E Inferno's quest was gated on GoodDollar face verification, which failed live, and Danny removed it. A coin that depends on a third party's verification inherits that risk.

What this adds to a memecoin idea: a way to give a coin something to do (a pass, a quest, a referral share) and a way to test demand with non-transferable rewards before anything trades. It also adds the thing doc 1108 warns about: the moment holding the coin earns you something from someone's effort, the "no promises" shape is gone.

## 5. Risks, as questions for Zaal

These are questions, not legal advice. Doc 1108 is the estate's fuller treatment and it recommends counsel before any launch.

- **Who holds supply on day one?** How much sits with Zaal, Danny, ZAO or a vault, for how long, and is that published before launch?
- **What are buyers told?** In one sentence, in his words. Does that sentence promise anything: a product, a payout, a price, a use?
- **Would it read as an investment offer?** Is anyone told the coin funds work, or that the team's effort will make it worth more? Doc 1108's cases turn on exactly that.
- **Whose name is on it?** The ZAO, BetterCallZaal, Danny's brand, or none. A dead coin with a brand's name on it stays on-chain with that name.
- **Who can be hurt?** If 98.6 percent is the base rate, who in the community buys, and what do they lose?
- **What happens to fees?** Who receives creator rewards, is that wallet shared, and is it written down before the first trade?
- **Does it collide with what exists?** BCZ is live and Sparkz is tokenless-first. Is this a third thing, or one of those two?

## The six questions any memecoin idea must answer before it is worth a test

1. **What is the meme, in one line, and does it spread without the coin?** If the joke needs the price to be funny, it is not a meme yet.
2. **What does holding it do on day one?** "Nothing" is an acceptable and legally simpler answer. Anything else needs question 3.
3. **What does it promise, and who is on the hook for that promise?** Write the buyer-facing sentence and read it against doc 1108.
4. **Who holds what, and what is locked?** A table: wallet, share, lock, and where it is published.
5. **Which rail, and why that one?** Farcaster-native audience points to Clanker; a moment or a joke points to a Zora Trend Coin (no creator share); Danny's audience and quests point to a lock, not a coin.
6. **What would make you stop?** A number and a date decided before launch, since the token itself cannot be withdrawn.

## The smallest reversible test for each rail

A real launch is not reversible on any rail. So each test stops before the one-way door.

| Rail | Smallest reversible test | What it proves |
|---|---|---|
| No coin (Sparkz's own shape) | Post the meme as a spark or a cast with no token, and count replies and recasts for a week | Whether the meme spreads on its own (question 1) |
| Danny's stack | One quest with a non-transferable reward, or one free or low-price Unlock lock on a test network | Whether people will do something for it, with nothing tradeable |
| Clanker | Write the full deploy config (name, ticker, fee, vault share and days, reward wallet) and stop. Whether Clanker supports a test network was not checked: UNKNOWN | Whether questions 3, 4 and 5 have answers on paper |
| Zora | Draft the coin's metadata and choose the type (Creator, Content or Trend) without creating it | Whether the idea is a moment (Trend, nothing to the creator) or a project |
| pump.fun | None. Read the holder distribution of three comparable coins instead | What "normal" concentration looks like before choosing it |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Write the idea down in the ideas terminal, in his own words, before anything else | Zaal | Capture | when the terminal opens |
| Answer the six questions for that idea | Zaal, with the ideas lane | Brainstorm | same session |
| If the answers hold: pick one reversible test from the table | Zaal | Decision | after the brainstorm |
| Any launch, purchase or public post about a coin | Zaal only | Gated | never by a lane |

## Sources

Fetched 2026-10-07. "Raw" means curl with a browser User-Agent; quotes come from the fetched text.

1. Clanker docs, [Creator Rewards & Fees](https://clanker.gitbook.io/documentation/general/creator-rewards-and-fees.md) [FULL, raw markdown]
2. Clanker docs, [Farcaster Bot Deployments](https://clanker.gitbook.io/documentation/general/token-deployments/farcaster-bot-deployments.md) [FULL for the Base section, raw markdown]
3. Clanker docs, [Deploying a Token](https://clanker.gitbook.io/documentation/general/token-deployments/deploying-a-token.md) and the docs index `llms.txt` [PARTIAL: first paragraph and the index]
4. Zora docs, [Coins Protocol](https://docs.zora.co/coins) [FULL, raw, HTML stripped]
5. Zora docs, [Coin Rewards](https://docs.zora.co/coins/contracts/rewards) [PARTIAL: read to the start of the V4 market-reward table; exact percentages per recipient not read]
6. pump.fun, [Fees](https://pump.fun/docs/fees), "Last Updated: 20 May 2026" [PARTIAL: bonding-curve fees read in full; the PumpSwap market-cap schedule not read]
7. Flaunch docs, [home](https://docs.flaunch.gg/) [PARTIAL: one descriptive paragraph and the navigation]
8. Solidus Labs, [The 2025 Rug Pull Report](https://www.soliduslabs.com/reports/solana-rug-pulls-pump-dumps-crypto-compliance), May 2025 [FULL for the executive summary, raw, HTML stripped; a vendor of compliance software]
9. SEC, Staff Statement on Meme Coins (sec.gov) [FAILED: HTTP 403. Cited only through doc 1108, which marked it FULL on 2026-07-15]
10. CoinGecko, "How many cryptocurrencies failed" [FAILED: HTTP 403]
11. `gh repo view bettercallzaal/sparkz` (description, last push) [FULL]
12. zao-vault origin/main `meetings/danny-blahkheart-x-zaal-2026-09-03-p2e-inferno.md`, `meetings/danny-blahkheart-x-zaal-2026-09-07-gooddollar-unlock-trex.md`, `meetings/zaal-danny-jose-2026-09-16-wavestation-unlock-zaostock-logistics.md` [PARTIAL: read by keyword (unlock, affiliate, quest, token), not end to end]
13. ZAOOS docs 1108, 2195, 2384, 2422, 988, 2101, 2296 on origin/main [PARTIAL: frontmatter and key-decision lines]; agent memory files `project_culture_coins_meme_engine`, `project_f2dc`, `project_sparkz_configurable_ai_advisor`, `project_deez_token_launcher` [FULL for the first 30 lines each]

Not searched or fetched: Empire Builder's and the CEN launcher's current docs, any on-chain state (the $ZABAL and BCZ contracts were not read), Farcaster or X sentiment, and any dataset comparing surviving community coins with dead ones. Today's stream with Danny was not transcribed, so the idea itself is not in this doc.

Credit: Clanker, Zora, pump.fun and Flaunch for their own documentation; Solidus Labs for the report; Brandon Ducar for the Culture Coins framework; Danny (blahkheart) for P2E Inferno and T-Rex, as described in his own words in the vault notes.
