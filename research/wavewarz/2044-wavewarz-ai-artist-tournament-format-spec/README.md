---
title: "WaveWarZ AI Artist Tournament: Complete Format Specification"
doc: 2044
topic: wavewarz
type: IP-REFERENCE
status: ACTIVE — update after each tournament; grand final result pending
created: 2026-07-23
related-docs: 1787, 2042, 2041, 1785, 1538, 1787
owner: Zaal
---

# 2044 — WaveWarZ AI Artist Tournament: Complete Format Specification

> **Canonical format reference.** Cite in press pitches, OP RF evidence, grant apps, Wikipedia, and press kit when claiming "ZAO invented/runs AI artist music tournaments on-chain."
>
> Related: doc 1785 (V2 judging system), doc 1538 (MAIN battle mechanics), doc 1787 (Jul 2026 tournament event), doc 2042 (grand final preview).

---

## What the AI Artist Tournament Is

The **WaveWarZ AI Artist Tournament** is a competitive elimination bracket where **AI-generated musical artist personas** — not human artists — compete on the WaveWarZ Solana prediction market, judged by a combination of community vote, on-chain trading volume, and an AI music judge (DJ Wavy).

**What makes it unique:**
1. All competing artists are AI-generated (AI × human collaboration) — no human performers
2. The platform's own AI judge (DJ Wavy, V2 judging system) evaluates AI-generated music
3. Outcomes are settled on Solana Mainnet — immutable, publicly verifiable
4. Fans trade real SOL on AI artists they back — price discovery mechanism, not just a vote
5. Even losing AI artists earn payouts (loser-earns mechanic, same as human MAIN battles)

**First instance:** Jul 2026 — the first-ever AI Artist Tournament on WaveWarZ. This is believed to be the first live on-chain prediction market where AI-generated artist personas competed in a structured elimination tournament with an AI judge.

---

## Tournament Structure

### Format: Single-Elimination Bracket

Each round is a **MAIN battle** between two AI artists. The winner advances; the loser is eliminated but still earns a payout (loser-earns mechanic).

**Round structure (Jul 2026 tournament):**
- Semifinal: GEEK MYTH vs AI LUI → GEEK MYTH advances (2-1)
- Grand Final: GEEK MYTH vs Stormbourne → TBD
- Additional brackets (e.g. Stella Estrella Gauntlet) may run in parallel

> **Note:** Full bracket size and seeding methodology for the Jul 2026 tournament are [ZAAL TO CONFIRM — how many AI artists started the bracket, and how they were selected/seeded].

### Match Format: Best-of-3 Battles

Each round between two AI artists is a **best-of-3 series of WaveWarZ MAIN battles**:
- Battle 1: AI Artist A vs AI Artist B on Battle 1 tracks → winner wins Battle 1
- Battle 2: rematch on new tracks → winner wins Battle 2
- Battle 3 (if split): tiebreaker round → winner advances

**Judging (same V2 system as human MAIN battles, see doc 1785):**
1. **Poll**: Community vote on the platform
2. **Charts**: Trading volume for each artist's battle pool on Solana
3. **DJ Wavy**: AI music judge scoring each submission

All three signals are aggregated by the V2 judging system. DJ Wavy is the tiebreaker when Poll and Charts diverge.

---

## AI Artist Personas: What They Are

An AI Artist persona in WaveWarZ is a **distinct musical identity created via AI × human collaboration**:
- A unique artist "character" with a name, aesthetic, and musical style
- Songs generated using AI music tools (specific tools: [ZAAL TO CONFIRM])
- The human collaborator (Zaal or ZAO member) shapes the creative direction and selects/curates tracks
- The resulting tracks are uploaded to Audius and submitted to the battle contract

**Jul 2026 AI Artists:**

| Artist | Style/Identity | Tournament Status |
|--------|---------------|-------------------|
| **GEEK MYTH** | Mythological/nerd culture fusion, AI-generated | Semifinal winner; grand final |
| **AI LUI** | [AI music persona — style TBD] | Semifinal runner-up (eliminated after semifinal) |
| **Stormbourne** | Atmospheric/elemental AI music | Grand final participant |
| **Stella Estrella** | AI artist referenced in "gauntlet" format | Parallel bracket participant |

> **Note:** Detailed AI artist creation methodology (tools, prompts, collaboration process) is [ZAAL TO CONFIRM — for press pitches and IP documentation].

---

## Economics

The AI Artist Tournament uses the **identical economic structure** as WaveWarZ human MAIN battles (see doc 1538 for full mechanics):

### Per Battle
- **Trading pools**: Each AI artist has a Solana bonding-curve pool; fans buy/sell shares in each artist
- **Artist payout (both winner and loser)**: 1% of total battle trading volume + settlement bonus
- **Trader payout**: Winning-side share of the battle pool (via claimShares)
- **Platform fee**: ~0.5% of trading volume → platform revenue
- **All settlement**: On-chain, automatic, within minutes of battle close

### Tournament Scale (Jul 2026)

| Event | Volume | Notes |
|-------|--------|-------|
| Semifinal (GEEK MYTH vs LUI) | ~342 SOL (~$26,500) | 8.7× prior single-event platform record |
| Jul 16–23 week total | 356.621 SOL | 96% from AI tournament semifinal |
| AI tournament as % of all-time volume | ~39% | Of 878.316 SOL total (wavewarz.info, Jul 23) |
| Trader claims surge | +254 SOL | From ~127 SOL to 381 SOL cumulative in one week |

### Why AI Artists Drive Higher Volume
Speculative hypothesis (not verified): AI-generated artists may attract higher trading volumes because:
1. **No fan bias**: Traders evaluate the music directly, not artist reputation or following
2. **Novelty premium**: First-ever AI-vs-AI on-chain music tournament generates outsized attention
3. **Stakes narrative**: "Human picks between AI artists" is more engaging for speculative trading

> This is an open research question — the Jul 2026 data is insufficient to confirm. [Future tournaments will test this hypothesis.]

---

## On-Chain Verification

All AI Artist Tournament battles are fully verifiable on Solana Mainnet:
- Battle contracts: see main WaveWarZ battle program address (wavewarz.info/about)
- Each battle's initializeBattle transaction records the two competitor pools
- claimShares transactions show trader withdrawals (counted in traderClaims.withdrawalCount)
- All settlement is automatic and permissionless

**Live stats:** `GET https://wavewarz.info/api/public/stats` → `battles.mainBattles` includes AI tournament battles.

---

## Eligibility & Submission

> **⚠️ Section needs completion — ZAAL TO CONFIRM:**
> - How does an AI artist creator submit an AI persona to the tournament?
> - What constitutes an "AI-generated artist" for eligibility?
> - Is there a curation/application process, or does ZAO select all AI artists?
> - Can external creators submit AI artist personas, or is this ZAO-internal?

---

## ZAO IP Claims

The following claims are ZAO's based on the Jul 2026 tournament:

1. **"WaveWarZ ran the first-ever AI vs AI music battle tournament on a live Solana prediction market."** (Source: platform records, wavewarz.info, Jul 2026)

2. **"The AI Artist Tournament format is a ZAO-invented competitive format in which AI-generated musical personas compete via on-chain prediction markets."** (Source: this doc + doc 1787)

3. **"The V2 judging system (DJ Wavy + Poll + Charts) is designed to evaluate AI-generated music without human performer bias."** (Source: doc 1785)

4. **"In the Jul 2026 tournament, GEEK MYTH became the first AI artist to win an elimination round in an on-chain music battle tournament, defeating AI LUI 2-1 with ~342 SOL (~$26,500) in trading volume."** (Source: doc 1787)

5. **"The AI Artist Tournament generated 39% of all-time WaveWarZ trading volume (~342 SOL) in a single week — 8.7x the prior single-event platform record."** (Source: wavewarz.info/api/public/stats, Jul 23, 2026)

---

## Documentation Protocol

### When Grand Final Happens
1. Update doc 2042 "## Grand Final Result" section with winner, volume, date
2. Update this doc's "Tournament Structure" section with the complete bracket
3. Update "ZAO IP Claims" #4 to name the first AI Artist Tournament champion
4. Create a result post-event doc (analogous to doc 1787 for the semifinal)
5. Update doc 1787 to link to result doc

### After Tournament Ends (All Rounds)
- Update docs 1469, 1469, 1339 with final tournament volume numbers
- Update doc 1483 (press kit) with "First AI Artist Tournament Champion: [winner]"
- Update doc 1570 (citable claims) with verified final volume figure

---

*Created: 2026-07-23 | IP doc — cite in press, grants, Wikipedia. Status: ACTIVE, grand final pending. See doc 2042 for fill-in protocol when grand final happens.*
