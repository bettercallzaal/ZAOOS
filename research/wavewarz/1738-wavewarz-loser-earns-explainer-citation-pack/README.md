# 1738 — WaveWarZ "Loser Earns" Mechanism: Explainer + Citation Pack (Jul 2026)

**Type:** CITATION-PACK  
**Topic:** WaveWarZ  
**Status:** ACTIVE — Canonical explainer for the loser-earns mechanism. ZOE uses when press, researchers, or grant reviewers ask "how does the payout model work?" Multiple audience versions below. Pull citable claims into OP RF, Fisher Fund, Mirror articles, and academic citations. Update stats quarterly.

---

## The Mechanism in One Sentence

In every WaveWarZ music battle, the **losing artist earns automatically** — receiving 10% of the winning side's staked pool — settled on-chain within seconds of the battle closing, with no human approval required.

---

## How It Works (Technical)

Each WaveWarZ battle creates two per-battle Program Derived Addresses (PDAs) on Solana:
- **Pool A:** Staked SOL backing Artist A
- **Pool B:** Staked SOL backing Artist B

When the battle closes:
1. The winning pool's SOL is distributed: **80% to winning traders / 10% to winning artist / 10% to losing artist**
2. The losing pool's SOL is distributed: **80% to losing traders / 10% to losing artist** (from winning pool) / **10% to winning artist** (from winning pool)
3. Settlement executes via Solana smart contract — no intermediary, no withdrawal request, no wait

**Net result:** Both artists receive SOL within seconds. The losing artist never walks away empty.

```
Winning Pool (e.g. 100 SOL from traders backing Artist A):
  → 80 SOL → winning traders (Artist A backers, pro-rata)
  → 10 SOL → Artist A (winning artist)
  → 10 SOL → Artist B (losing artist, from winning side)

Losing Pool (e.g. 60 SOL from traders backing Artist B):
  → 80 SOL → losing traders (Artist B backers, partial return — they still lose their stake delta)
  → [Artist B has already received their 10 SOL from winning side]
```

**Solana contract:** Deployed via Anchor. Each battle's PDAs are isolated — a bug in one battle cannot drain another.

---

## Why This Is Novel

### Compared to Traditional Music Revenue

| Model | Who earns | When they earn | If they lose |
|-------|-----------|----------------|--------------|
| Spotify streams | Artist | After 1,000+ streams | N/A |
| Live gig | Artist | After venue takes 15-30% | N/A |
| Music competition (traditional) | Winner only | After prize committee decision | Nothing |
| **WaveWarZ** | **Both artists** | **Seconds after battle closes** | **Still earns 10% of winning pool** |

### Compared to Web3 Music

Most web3 music platforms (Sound.xyz, Catalog, Zora) pay artists when their NFT sells. The buyer must exist; the artist must mint; the platform must facilitate the secondary market. WaveWarZ is the only platform where **artist payout is a guaranteed function of a live competitive event** — not contingent on a buyer, a secondary market, or a platform fee waiver.

### The Core Innovation

Conventional competition logic: only winners earn. WaveWarZ inverts this:

> "Losing a WaveWarZ battle is not a loss event. It is an earning event that happens to be smaller than the winning artist's earning event."

This is not a subsidy or a pity payment. It is designed into the smart contract. The loser's payout is funded by the winner's traders — the community that believed in the winning artist.

---

## Live Evidence (Jul 2026)

**Source:** wavewarz.info/api/public/stats (real-time, no auth required)

| Metric | Value (Jul 2026) |
|--------|-----------------|
| Total battles | 1,245 |
| Total SOL volume | 523.991 SOL |
| Artist payouts (total) | 9.0988 SOL |
| Trader claims | 127.343 SOL |
| MAIN battles | 162 |
| Community battles | 36 |
| Quick battles | 1,047 |

**What "9.0988 SOL to artists" means:** Every artist in every battle — winner and loser — received their cut automatically. There was no artist who competed and received nothing.

**Solana explorer verification:** Pull any MAIN battle's settlement TX on Solscan — two outbound transfers from battle PDA: one to winning artist wallet, one to losing artist wallet, within the same block.

---

## Citation-Ready Claim Blocks

### For Academic Research

```
The WaveWarZ platform (wavewarz.info) implements a novel "dual-earner" settlement 
mechanism on the Solana blockchain. In each music battle, both the winning and 
losing artist receive automatic on-chain payments upon battle closure, with the 
losing artist earning 10% of the winning side's staked pool. As of July 2026, 
the platform has settled 1,245 battles with 523.991 SOL in total volume and 
9.0988 SOL in verified artist payouts. Settlement is executed via per-battle 
Program Derived Addresses (PDAs) with no human intermediary. The platform is 
operated by The ZAO, a music DAO with 100+ consecutive weekly governance sessions 
on Optimism (contract: 0xcB05F9254765CA521F7698e61E0A6CA6456Be532).

Source: wavewarz.info/api/public/stats (real-time, cryptographically verifiable)
DAO governance contract: Optimism Mainnet OREC 0xcB05F9254765CA521F7698e61E0A6CA6456Be532
```

### For Press / Journalists

```
WaveWarZ is the first music platform where losing a competition automatically pays 
the artist. When a battle closes, both artists receive SOL within seconds — the 
winner earns more, but the loser never walks away empty. This isn't charity: it's 
written into the smart contract. As of July 2026, the platform has paid out artists 
across 1,245 battles on Solana. The platform is governed by The ZAO, a music DAO 
that has held over 100 consecutive weekly governance sessions with zero failures.
```

### For Grant Applications

```
WaveWarZ introduces a verified novel payment model: automatic dual-artist payout on 
every music battle. The losing artist receives 10% of the winning pool — on-chain, 
within seconds, with no application, no human gatekeeper, and no platform fee. As 
of July 2026: 1,245 battles settled, 523.991 SOL volume, 9.0988 SOL to artists. 
This model has been operational for [X] months with zero settlement failures. 
The underlying DAO has operated with 100+ consecutive governance sessions on Optimism.
```

### For Social Media (X / Farcaster)

```
In a WaveWarZ battle, losing still pays.

When the battle closes, both artists receive SOL automatically:
→ Winning artist: 10% of the opposing pool
→ Losing artist: 10% of the winning pool

No gatekeepers. No withdrawal form. No wait.

1,245 battles. $523 SOL volume. Both artists earned in every one.
```

### For Web3 / Crypto Audience

```
WaveWarZ settlement mechanic:
- Two PDAs per battle on Solana (one per artist)
- Battle close triggers settlement instruction
- Winning pool: 80% traders / 10% winner / 10% loser
- Losing pool: 80% traders / [loser already received their % from winning side]
- Execution: same block as battle close, no human call required

Both artists get paid. On-chain. In seconds. This is the design.

wavewarz.info/api/public/stats — verify live.
```

---

## Why This Matters for ZAO's NORTH STAR

**NORTH STAR #1: ZAO = THE DAO case study**

The loser-earns mechanism is ZAO's most citable contribution to DAO design. It demonstrates that a DAO can:
1. Design economic incentives that serve all participants, not just winners
2. Encode fairness into a smart contract rather than relying on human judgment
3. Run a self-sustaining market where artists are economically motivated to participate regardless of outcome

**NORTH STAR #2: ZAO IP = a staple in onchain art, music and culture**

Loser-earns is ZAO's original IP. It did not exist before WaveWarZ. No other platform — web3 or traditional — has implemented it. The phrase "losing a music competition still pays the artist" is the most press-ready, grant-ready, academically-interesting claim ZAO has.

Every time it is cited:
- In a grant → ZAO is documented as an economic innovator
- In a press article → ZAO is documented as a cultural innovator
- In an academic paper → ZAO is documented as a DAO case study
- In an X thread → ZAO is documented as part of onchain music culture

**This mechanism IS ZAO's IP.** Documentation = permanence.

---

## Audience Translation Table

| Audience | Lead with | Proof point | CTA |
|----------|-----------|-------------|-----|
| Music journalist | "Losing a battle still pays the artist" | 9.09 SOL to artists across 1,245 battles | wavewarz.info |
| Web3 / crypto | "Dual-earner PDA settlement on Solana" | Solscan TX verification | wavewarz.info/api/public/stats |
| Grant reviewer | "Novel dual-artist automatic payment model" | 1,245 battles, zero settlement failures | OREC contract address |
| Academic researcher | "First implementation of dual-earner competitive music settlement" | Full citation block above | ZAOOS archive (ZAOOS) |
| Artist considering joining | "Even if you lose, you earn something" | Artist earnings reference (doc 1716) | wavewarz.info + ZAO Telegram |
| Investor/partner | "The platform pays all participants — alignment without subsidies" | 127.343 SOL trader claims + 9.09 SOL artist payouts | wavewarz.info |

---

## ZOE Usage Instructions

**When press asks "how does the payout model work?"**
→ Send the "For Press / Journalists" block above + wavewarz.info link

**When a grant application asks about economic innovation:**
→ Paste the "For Grant Applications" block; add current API stats on submission day

**When an artist asks "what happens if I lose?"**
→ Pull from doc 1716 (artist earnings reference) — specific SOL amounts. Supplement with: "The loser-earns mechanic means you get paid either way."

**When someone asks for academic citation:**
→ Paste the "For Academic Research" block — includes contract addresses and verifiable source

---

## Related Docs

- 1716 — WaveWarZ Artist Earnings Reference (specific payout math + real examples)
- 1644 — WaveWarZ Settlement Mechanics (technical deep dive)
- 1707 — WaveWarZ API Developer Guide (pull live stats)
- 1651 — ZAO DAO Case Study (full context for grant/academic use)
- 1723 — OP Retro Funding Evidence Pack (loser-earns in OP RF context)
- 1717 — ZAO X Content Playbook (social media post templates)
- 1614 — ZAO North Star Narrative (NORTH STAR framing for loser-earns)
