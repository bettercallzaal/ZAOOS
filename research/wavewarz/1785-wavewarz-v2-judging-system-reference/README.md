# 1785 — WaveWarZ V2 Judging System: Technical Reference

**Type:** TECHNICAL-REFERENCE  
**Topic:** WaveWarZ  
**Status:** ACTIVE — V2 launched Mar 10, 2026. Supersedes V1 (human judge). Verified from wwtracker source (`components/AboutWaveWarZ.tsx`, `components/Faq.tsx`, `components/Battles.tsx`, `lib/freshness.ts`, `docs/WAVEWARZ-RESEARCH.md`).

---

## Summary

WaveWarZ V2 uses a **3-judge system** to determine battle winners. Each judge is independent. The winner is the artist that wins **best 2-of-3**.

| Judge | Signal | Source |
|---|---|---|
| **Poll** | Community vote (fans pick the winner) | WaveWarZ platform voting interface |
| **Charts** | SOL volume (which side drew more SOL into its trading pool) | On-chain bonding curve activity |
| **DJ Wavy** | AI judge verdict (automated artistic evaluation) | WaveWarZ AI system; on-chain tx signature |

---

## V1 → V2 Transition

| | V1 | V2 (since Mar 10, 2026) |
|---|---|---|
| Judge mechanism | Human judge (single decision) | 3-judge panel: Poll + Charts + DJ Wavy |
| Tie handling | Human judge has discretion | Best 2-of-3 eliminates ties by design |
| On-chain signal | None for judging | DJ Wavy has a unique on-chain signature (see §4) |
| AI involvement | None | DJ Wavy AI judge is a core component |

**Important:** Any WaveWarZ content referencing a "Human Judge" is V1 (pre-Mar 10, 2026) and is outdated. The current judging system is V2 only.

---

## Judge 1: Poll

**What it is:** Community vote on which artist wins.

**How it works:**
- Fans vote during or after the battle
- Majority vote winner takes the Poll judge score
- Accessible via the WaveWarZ platform interface (wavewarz.com)

**On-chain representation:** Not directly on Solana — the vote is recorded in the WaveWarZ backend (Supabase). The on-chain record is the battle settlement transaction.

**Citable:** "The Poll judge is a community vote — WaveWarZ is one of the only music competition platforms where fan votes directly determine 1/3 of the outcome."

---

## Judge 2: Charts

**What it is:** Market-based judgment — whichever artist's trading pool attracted more SOL volume wins.

**How it works:**
- Each battle creates two ephemeral bonding-curve pools (Artist A / Artist B)
- Traders buy the side they believe will win, adding SOL to that pool
- At battle close: the artist whose pool has MORE SOL wins the Charts judge
- This is a prediction market — traders are incentivized to pick correctly because winners earn from the loser's pool

**Economic mechanic:** Charts is simultaneously the revenue mechanism AND a judging input. SOL volume = trader conviction.

**On-chain representation:** All bonding curve trades are on Solana (program `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo`). Volume is directly readable from the PDA (program-derived address) per battle.

**Citable:** "WaveWarZ uses trading volume as a direct judgment input — the prediction market IS the judge. Charts winner = the artist traders collectively backed with the most SOL."

---

## Judge 3: DJ Wavy

**What it is:** An AI judge that evaluates the competing songs and renders a verdict.

**How it works:**
- DJ Wavy analyzes the competing tracks
- Renders a verdict for one artist
- Verdict is executed on-chain: a 0.005 SOL transaction to the WaveWarZ platform wallet PLUS a second transfer to the compared artist's wallet

**On-chain signature (unique to DJ Wavy):**
- Single queue/skip transaction = 0.005 SOL to platform wallet only (1 tx)
- DJ Wavy transaction = 0.005 SOL to platform wallet + SECOND transfer to another wallet (2 txs in sequence)
- This double-transfer pattern is the on-chain fingerprint of a DJ Wavy ruling
- Available from Dune; queue vs DJ Wavy split data begins ~Nov 2025; some Feb–Apr 2026 nights are unclassified pending Dune credits

**Freshness note:** Queue vs DJ Wavy split data was current as of 2026-06-16 (from `lib/freshness.ts`).

**Citable:** "DJ Wavy is WaveWarZ's AI judge. Its verdicts have a unique on-chain signature: a dual-wallet transfer pattern distinct from standard battle transactions, allowing post-hoc analysis of which battles the AI decided vs. which were settled by trading volume alone."

---

## The 2-of-3 Outcome Matrix

| Poll | Charts | DJ Wavy | Winner | Decision type |
|---|---|---|---|---|
| A | A | A | Artist A | Unanimous |
| A | A | B | Artist A | Poll + Charts |
| A | B | A | Artist A | Poll + DJ Wavy |
| B | A | A | Artist A | Charts + DJ Wavy |
| B | B | A | Artist B | Poll + Charts (inverse) |
| A | B | B | Artist B | Charts + DJ Wavy (inverse) |
| B | A | B | Artist B | Poll + DJ Wavy (inverse) |
| B | B | B | Artist B | Unanimous |

Note: With 3 binary judges, no tie is possible — there's always a majority.

---

## What This Means for Artists

- **You can win even if traders doubted you.** If the Poll and DJ Wavy both pick you, you win regardless of which pool had more SOL.
- **Traders back their conviction.** The Charts judge creates direct economic alignment — put SOL on who you think wins.
- **The AI has a real say.** DJ Wavy can break apparent market consensus (Charts + Poll split where DJ Wavy casts the deciding vote).

---

## What This Means for ZAO IP

The 3-judge V2 system is a WaveWarZ-specific innovation that:
1. Creates the **first music prediction market where fans, markets, and AI all co-govern outcomes**
2. Makes each judge individually legible on-chain (Charts = on-chain volume; DJ Wavy = dual-transfer signature)
3. Eliminates tie scenarios by design (3 binary judges → always 2-1 or 3-0)
4. Integrates AI into a decentralized governance structure

No other music platform runs this combination. This is citable as a unique mechanism in academic, press, and grant contexts.

---

## Citation Blocks

### Block A — V2 Judging Mechanism (general audience)
> "WaveWarZ uses a 3-judge panel to determine battle winners: a community Poll (fan vote), the Charts (which artist's trading pool attracted more SOL), and DJ Wavy (an AI judge). The winner earns the title by winning any 2 of 3 — making it impossible to tie." — Source: wwtracker/components/Faq.tsx, docs/WAVEWARZ-RESEARCH.md

### Block B — On-Chain AI Judge (technical audience)
> "DJ Wavy, WaveWarZ's AI judge, leaves a unique on-chain signature: a dual-wallet transfer pattern (0.005 SOL to platform + parallel transfer to the compared artist) that allows automated detection of AI-adjudicated battles on Solana's Dune analytics. V2 launched Mar 10, 2026." — Source: wwtracker/components/Battles.tsx annotations

### Block C — Prediction Market + Judgment (academic/press)
> "WaveWarZ is the first music platform where prediction market outcomes (SOL volume) function as one of three equal judges. Fan economic conviction (SOL staked) is a direct determinant of artistic outcomes — not just ancillary data." — Source: wwtracker/components/AboutWaveWarZ.tsx

---

## Scope: Which Battles Use V2

- **MAIN battles (main events, main matches):** V2 judging (Poll + Charts + DJ Wavy, best 2-of-3)
- **Quick battles:** Use a different nightly format (SOL queue/skip system; DJ Wavy may participate for song selection, but the quick battle result mechanism differs)
- **Community battles:** Use community governance (ZOR holder vote) to select matchups; battle outcome still uses V2 judging

**Caution:** The exact role of DJ Wavy in quick battles vs MAIN battles is based on on-chain signal analysis. Quick battles prioritize the queue/skip mechanism. Verify with Hurricane before citing DJ Wavy's specific role in quick battles.

---

## Related Docs

- [1644](../1644-wavewarz-onchain-settlement-mechanics/) — On-chain settlement mechanics (PDA derivation, claimShares, artist payout math)
- [1738](../1738-wavewarz-loser-earns-explainer-citation-pack/) — Loser-earns mechanism explainer
- [1716](../1716-wavewarz-artist-earnings-reference/) — Artist earnings reference with real SOL data
- [970](../../business/970-wavewarz-djwavy-market-positioning/) — DJ Wavy market positioning (competitive differentiation)
