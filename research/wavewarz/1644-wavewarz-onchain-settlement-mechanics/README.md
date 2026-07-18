# 1644 — WaveWarZ On-Chain Settlement Mechanics: How the Loser Earns (Jul 2026)

**Type:** TECHNICAL-REFERENCE  
**Topic:** WaveWarZ  
**Status:** CANONICAL — use for press pitches, grant applications, academic citations, and technical due diligence. Describes how WaveWarZ settles battles on-chain automatically, including how the losing artist receives a guaranteed payout. Update after any significant protocol change. Last verified: Jul 2026 (1,245 battles settled).

---

## The Core Mechanic in One Paragraph

WaveWarZ is a prediction market for live music battles on Solana. Fans buy prediction tokens on which artist will win before a battle closes. When the battle settles, the smart contract distributes the token pool: winning-side traders share 80% of the loser-side token pool (proportional to their stake), the winning artist receives 10% of the losing-side pool, and the losing artist receives 10% of the winning-side pool. Both artists are paid. The settlement fires automatically — no admin action, no claim required, no middleman.

---

## Bonding Curve: How Token Pricing Works

WaveWarZ uses a **bonding curve** to price prediction tokens dynamically as fans buy and sell.

**What a bonding curve is:**  
The price of a prediction token increases as more people buy it, and decreases as people sell. This means early buyers pay less; late buyers pay more. The bonding curve ensures the contract always has enough SOL to pay all holders.

**Buy price vs. sell price:**  
At any point, the buy price is slightly higher than the sell price. The difference is the **spread** — this is how the platform generates protocol revenue without taking a cut from artist payouts.

**Why this matters:**  
- Fans take a financial position on the outcome
- Token price reflects live community sentiment (who fans think will win)
- Artists are not penalized for the bonding curve mechanics — their payout comes from a separate pool share
- Platform revenue = bonding curve spread, not artist payout reduction

---

## Battle Lifecycle: Step by Step

### 1. Battle Creation
A WaveWarZ operator (Zaal or ZAO team) creates a new battle:
- Two artists are designated (Artist A vs. Artist B)
- A battle PDA (Program Derived Address) is created on Solana mainnet
- Each artist is assigned a prediction token (Token A, Token B)
- A trading window is set (typically open until the battle begins)

### 2. Trading Window
- Fans buy Token A or Token B using SOL
- Bonding curve prices tokens dynamically
- At any point, fans can sell their tokens back (receive SOL minus the bonding curve spread)
- The smart contract holds all SOL in the battle PDA

### 3. Battle Closes (Trading Window Ends)
- No new token purchases or sales are accepted
- The contract locks the token pool
- Total SOL in the pool = all fan purchases (net of early sellers)

### 4. Outcome Submission
- The battle result is submitted on-chain (winner declared)
- For MAIN battles: ZOR holders governance-voted the matchup; Zaal submits the result
- For Quick battles: result is submitted after the live event or online battle concludes

### 5. Automatic Settlement
The contract executes the payout split **without any manual action**:

| Recipient | Share | Source |
|---|---|---|
| Winning-side traders | 80% | Loser-side token pool, proportional to stake |
| Winning artist | 10% | Loser-side token pool |
| Losing artist | 10% | Winning-side token pool |

The losing artist receives **10% of the winning-side pool** — the SOL staked by fans who bet on the artist who won. This is why the loser earns: they receive a share of their opponent's fan-base's stake.

### 6. Payout Fires
- SOL transfers to each recipient wallet automatically
- No claim transaction required from artists or traders
- Transaction is verifiable on Solana Explorer immediately
- ZOE monitors the WaveWarZ API and posts the result to X, Telegram, and Farcaster within minutes

---

## The Loser Earns: Why This Is Novel

In traditional music economics:
- Losing a competition = zero payout
- Even in battles (rap battles, music contests), the losing artist earns nothing financially
- Streaming platforms pay fractions of a cent per stream — a one-time battle "loss" pays zero

In WaveWarZ:
- The losing artist receives **10% of the winning-side pool** (the stake of fans who bet against them)
- If 100 SOL was staked on the winner and 40 SOL on the loser, the losing artist receives **10 SOL**
- The winning artist receives **4 SOL** (10% of the 40 SOL loser-side pool)
- In this example, the **losing artist earns 2.5x more than the winning artist**

This inverts the traditional incentive structure: artists with large fan bases betting against them are most rewarded for losing. The platform financially rewards the underdog for competing at all.

---

## PDA Architecture: Per-Battle Fund Isolation

Each WaveWarZ battle uses a **Program Derived Address (PDA)** — a smart contract account derived deterministically from the battle ID and the WaveWarZ program ID.

**Why PDAs matter for security:**
- Each battle is a completely separate on-chain account
- A vulnerability or exploit in one battle's token math cannot drain another battle's PDA
- ZAO never holds the SOL — it lives in the PDA until settlement
- No admin wallet key is required to trigger settlement (reduces key compromise risk)

**PDA derivation pattern:**
```
battle_pda = findProgramAddress(
  seeds: [battle_id_bytes, program_id_bytes],
  programId: WAVEWARZ_PROGRAM_ID
)
```

See doc 1632 (Smart Contract Security Posture) for security analysis of the PDA architecture.

---

## Live Statistics (Jul 2026)

Source: `wavewarz.info/api/public/stats` (public, no auth required)

| Metric | Value |
|---|---|
| Total battles settled | 1,245 |
| Total SOL volume | 523.991 SOL |
| Artist payouts (all artists) | 9.0988 SOL |
| Trader claims | 127.343 SOL |
| MAIN events | 50 |
| MAIN battles | 162 |
| Quick battles | 1,047 |
| Community battles | 36 |

**Artist payout breakdown (Jul 2026):**
- STILOWORLD: 41.6 SOL (highest earner — multiple MAIN battles)
- Geek Myth: 30.9 SOL
- Lui: 30.0 SOL
- Cannon Jones: 15.5 SOL

See doc 1435 (WaveWarZ Stats Reference) for full payout history and per-artist breakdown.

---

## WaveWarZ vs. Traditional Artist Revenue

| Revenue Source | Per-Event Earning (losing artist) |
|---|---|
| WaveWarZ (losing artist, typical quick battle) | 0.045–0.375 SOL ($3.37–$28.13 at Jul 2026 rates) |
| Spotify stream | $0.003–0.005 per stream |
| Apple Music stream | $0.006–0.01 per stream |
| Live performance (typical open mic) | $0 or tips |
| Music battle (traditional) | $0 (losing artist earns nothing) |

**Key framing:** A losing artist in a WaveWarZ quick battle earns the equivalent of 9,000–93,000 Spotify streams in a single event. This is not hypothetical — it is the on-chain track record across 1,245 settled battles.

---

## Copy-Paste Technical Description Blocks

### For Grant Applications (Fisher, MAC, OP RF)

> WaveWarZ is a prediction market for music battles deployed on Solana mainnet. Fans purchase prediction tokens on which artist will win a battle; when the battle closes, the smart contract automatically distributes the token pool: 80% to winning-side traders, 10% to the winning artist, and 10% to the losing artist. The settlement fires automatically, with no manual intervention or middleman. As of July 2026, 1,245 battles have been settled with $524 SOL in total trading volume and $9.09 SOL distributed directly to artists — including losing artists — as automatic on-chain payouts.

### For Press Pitches (Water & Music, Bankless, Decrypt, Hypebot)

> WaveWarZ is the first live music platform where the losing artist earns a guaranteed automatic payout. Here's the mechanic: fans stake SOL on who wins a music battle. When it closes, a Solana smart contract splits the pool — 80% to winning traders, 10% to the winning artist, 10% to the losing artist. The losing artist's payout comes from the winning fans' stake: the bigger the crowd betting against you, the more you earn for losing. 1,245 battles settled on Solana mainnet since launch. No human trigger needed — it fires automatically.

### For Academic/DAO Research Citations

> WaveWarZ (wavewarz.info) implements a prediction market settlement model for live music performance on Solana blockchain, using per-battle Program Derived Addresses (PDAs) for fund isolation and a bonding curve for dynamic token pricing. Settlement is fully automated: upon outcome submission, the Anchor/Rust program distributes the loser-side token pool 80% to winning traders and 10% to the winning artist, while distributing 10% of the winning-side token pool to the losing artist. This "loser-earns" mechanism inverts standard music competition economics and has been validated across 1,245 on-chain settlements (July 2026). Governance of MAIN battle matchups is conducted via Fractal Democracy on Optimism Mainnet (OREC: 0xcB05F9254765CA521F7698e61E0A6CA6456Be532), linking the Solana performance layer to the Optimism governance layer.

---

## Glossary

**Bonding curve:** A mathematical function that prices tokens based on supply. As more tokens are bought, the price rises. As tokens are sold, the price falls. WaveWarZ uses this to price prediction tokens dynamically.

**PDA (Program Derived Address):** A Solana smart contract account derived deterministically from seeds (battle ID + program ID). PDAs isolate funds per battle — a compromise in one battle cannot affect others.

**Settlement:** The on-chain transaction that closes a battle and distributes SOL to traders and artists based on the outcome.

**Prediction token:** A token representing a bet on which artist wins a WaveWarZ battle. Priced by the bonding curve; redeemable for SOL after settlement.

**MAIN battle:** A curated WaveWarZ battle where matchups are voted on by ZOR holders via Fractal Democracy governance. Distinguished from Quick battles (any artist can participate) and Community battles (ZOR holder nominations, charity payout option).

**ZOR:** ZAO's soulbound ERC-1155 governance token on Optimism Mainnet. ZOR holders govern MAIN battle matchups, ZAOstock event decisions, and charity votes. Soulbound = non-transferable, preventing flash loan governance attacks.

---

## Related Docs

- 1628 — ZAO Multi-Chain Architecture Guide (Solana + Optimism + Base + Arweave roles)
- 1632 — ZAO Smart Contract Security Posture (PDA security, audit status, incident response)
- 1619 — Fractal Democracy Session Guide (MAIN battle governance via ZOR + OREC)
- 1620 — WaveWarZ Quick Battle Onboarding Guide (artist path to first battle)
- 1435 — WaveWarZ Stats Reference (full battle history + per-artist payouts)
- 1637 — Water & Music Pitch Spec (press pitch using settlement mechanics as the hook)
- 1591 — Bankless + Decrypt Pitch Brief (settlement stats as press angle)
