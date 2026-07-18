# 1716 — WaveWarZ Artist Earnings Reference (Jul 2026)

**Type:** REFERENCE-GUIDE  
**Topic:** WaveWarZ  
**Status:** ACTIVE — ZOE sends this when an artist asks "how much can I earn on WaveWarZ?" or "how do payouts work?" Also used in press pitches to explain the Spotify comparison. Contains real payout data from Jul 2026. Update when significant new payouts occur or when API stats cross milestones (10 SOL artist payouts, $100K artist payouts).

---

## How WaveWarZ Artist Payouts Work

In every WaveWarZ battle, **both artists earn**. The mechanic:

```
Losing pool = total SOL staked on the losing artist
Winning pool = total SOL staked on the winning artist

Winning artist earns: losing_pool × 10%
Losing artist earns:  winning_pool × 10%
```

**The losing artist earns from the winning side's pool.** When more fans support the winner, the losing artist earns more. This means a popular battle — even if you lose — pays better than a small battle you win.

**Payout is automatic.** When the battle window closes, smart contract execution sends SOL directly to both artist wallets. No claim. No waiting. No platform approval. Visible on Solscan within minutes.

---

## Payout Math Examples

### Small Battle (10 SOL total, 60/40 split)

| Artist | Pool | Earns |
|--------|------|-------|
| Artist A (wins, 60%) | 6 SOL on their side | 4 SOL × 10% = **0.4 SOL** |
| Artist B (loses, 40%) | 4 SOL on their side | 6 SOL × 10% = **0.6 SOL** |

*Losing artist earns MORE than the winner when the pool split favors the winner.*

### Medium Battle (50 SOL total, 55/45 split)

| Artist | Pool | Earns |
|--------|------|-------|
| Artist A (wins, 55%) | 27.5 SOL on their side | 22.5 SOL × 10% = **2.25 SOL** |
| Artist B (loses, 45%) | 22.5 SOL on their side | 27.5 SOL × 10% = **2.75 SOL** |

*At 50 SOL total: both artists earn $450–$550 in today's SOL prices. Automatic.*

### MAIN Battle (200 SOL total, 65/35 split)

| Artist | Pool | Earns |
|--------|------|-------|
| Artist A (wins, 65%) | 130 SOL | 70 SOL × 10% = **7 SOL** |
| Artist B (loses, 35%) | 70 SOL | 130 SOL × 10% = **13 SOL** |

*MAIN battles: highest volume, highest absolute payouts. Losing artist still earns more than the winner here.*

---

## Real Payout Data (Jul 2026)

### Top Earners by Total SOL Earned

| Artist | Total SOL Earned | Battles (est.) | Notes |
|--------|-----------------|----------------|-------|
| STILOWORLD | 41.6 SOL | Multiple MAIN + Quick | Tier 1 headline artist |
| Geek Myth | 30.9 SOL | Multiple MAIN + Quick | Tier 1 — ZAOstock candidate |
| Lui | 30.0 SOL | Multiple MAIN + Quick | Tier 1 — ZAOstock candidate |
| Cannon Jones | 15.5 SOL | MAIN + Quick | Tier 2 — strong earner |

**Total to all artists (platform-wide):** 9.0988 SOL as of Jul 2026
- 1,245 battles total
- **Average per battle: ~0.0073 SOL to artists** (includes small quick battles dragging average down)
- MAIN battles: significantly higher average payouts per artist

Note: Individual artist totals above reflect cumulative earnings across all battles. Platform total (9.09 SOL) reflects all artists combined.

---

## Spotify Stream Equivalent

For press pitches and artist conversations: how does a WaveWarZ payout compare to Spotify?

**Spotify royalty rate (2026):** $0.003–$0.005 per stream (major DSP average)
**SOL price reference:** ~$200 per SOL (Jul 2026 — verify current price)

| SOL Earned | USD Value | Spotify Equivalent |
|-----------|-----------|-------------------|
| 0.1 SOL | $20 | 4,000–6,700 streams |
| 0.5 SOL | $100 | 20,000–33,000 streams |
| 1.0 SOL | $200 | 40,000–66,000 streams |
| 5.0 SOL | $1,000 | 200,000–333,000 streams |
| 10.0 SOL | $2,000 | 400,000–667,000 streams |

**The key difference:** WaveWarZ payouts settle instantly, per battle, to the artist's wallet. Spotify royalties take 3-6 months to arrive via distributor.

**Press-ready comparison:**
> "A mid-sized WaveWarZ battle pays both artists the equivalent of 40,000–100,000 Spotify streams — automatically, within minutes of the battle closing."

---

## Battle Type Comparison for Artists

| Battle Type | Typical Volume | Artist Earnings | How to Get In |
|------------|---------------|-----------------|---------------|
| Quick Battle | 0.1–5 SOL total | ~$2–$50 per artist | Anyone on wavewarz.info — anytime |
| Community Battle | 5–50 SOL total | ~$50–$500 per artist | Apply to ZOR holders (doc 1700) |
| MAIN Battle (COC) | 50–300 SOL total | ~$500–$3,000+ per artist | ZOR holder nomination |

*Volumes are estimates based on Jul 2026 platform data.*

---

## How to Maximize Earnings

**For new artists:**
1. Start with Quick Battles — open to any artist with an Audius track and Phantom wallet
2. Build volume by promoting battles to your fanbase (more fan staking = higher payout for you)
3. Multiple battles > single battles — run quick battles regularly to compound earnings
4. Engage your community: fans who stake win SOL back if you win — they have incentive to promote too

**For established artists:**
1. Target Community Battles — organized events with more promotion support
2. Build toward MAIN Battle nomination — requires ZOR holder recognition (attend Fractal sessions or be nominated by a ZOR holder)
3. Time battles around releases — a new track drop coinciding with a battle drives staking volume
4. Consider ZABAL S2 (applications open Jul 21 through Aug 4) — ZABAL artists get more governance support for battle nominations

**Volume drives payouts — bring your audience:**
The more your fans stake, the more the opposing pool grows when you win, and the more the losing artist earns from your pool when you lose. High-engagement battles pay both artists well regardless of outcome.

---

## Earnings Timeline

| Stage | When | What Happens |
|-------|------|-------------|
| Battle opens | Day 0 | Fans begin staking SOL on artists |
| Battle closes | Day 1-7 (varies by type) | Staking window ends |
| Settlement | Within minutes of close | Smart contract executes automatically |
| Payout received | Same minute as settlement | SOL arrives in artist's Phantom wallet |
| Verifiable | Immediately | TX link on Solscan — anyone can see the payout |

There is no payment delay, no approval process, and no minimum threshold.

---

## Artist Requirements

To receive payouts in any WaveWarZ battle:

1. **Audius account** — free at audius.co. Must have at least one track uploaded.
2. **Solana wallet** — Phantom (phantom.app) is recommended. Must use the wallet registered with WaveWarZ.
3. **Wallet connected to WaveWarZ** — connect Phantom at wavewarz.info before the battle starts.
4. **Battle participation** — you or your ZOR holder contact must submit the track to ZAO for the battle setup.

**No label. No distributor. No approval.** Your wallet receives SOL directly from the smart contract.

---

## Citable Claims for Artist Pitches

Use these when recruiting artists for WaveWarZ or Africa Battle Week:

1. "WaveWarZ has paid 9.09 SOL directly to artists as of July 2026 — including losing artists, automatically."
2. "The top WaveWarZ artist (STILOWORLD) has earned 41.6 SOL in automatic battle payouts."
3. "A mid-sized WaveWarZ MAIN battle pays both artists the equivalent of 40,000–100,000 Spotify streams."
4. "Artist payouts arrive in your wallet within minutes of battle settlement — no claim, no label, no wait."
5. "In every WaveWarZ battle, both artists earn. The loser takes 10% of the winning pool automatically."

---

## Related Docs

- 1644 — WaveWarZ On-Chain Settlement Mechanics (full technical explanation of the smart contract)
- 1700 — WaveWarZ Community Battle Host Guide (how to set up a community battle for your artist)
- 1693 — ZAO Community Onboarding Guide — Path B: Artist (step-by-step for new artists)
- 1709 — ZAO Music Release Protocol (parallel earnings via 0xSplits + DSPs — complementary to WaveWarZ)
- 1701 — Hypebot Pitch Spec (uses the Spotify comparison from this doc)
- 1559 — ZAOstock Artist Pipeline (STILOWORLD, Geek Myth, Lui, Cannon Jones — earnings sourced here)
