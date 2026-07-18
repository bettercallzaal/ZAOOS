---
topic: wavewarz/community
type: STRATEGY
status: ACTIVE — execute Aug 1+ alongside artist recruitment (doc 1342)
created: 2026-07-17
related-docs: 1302, 1341, 1342, 1343, 1347
owner: Zaal + ZOE + Hurricane (WaveWarZ team)
---

# 1348 — WaveWarZ Trader + Community Growth Strategy (Jul 2026)

> **The two sides of WaveWarZ:** Artists supply the battles. Traders/bettors create the volume. Growing only the artist side (doc 1342) without growing the trader side produces underbetted battles with low SOL volume — the network effect that makes WaveWarZ compelling breaks down. This doc is the demand-side companion to doc 1342.
>
> **Current state:** 1,245 total battles, 523.991 SOL volume, 127.343 SOL in trader claims. The trader pool is active but its size is opaque. Growing it by 2x would roughly double SOL volume with no additional artist changes.

---

## Part 1: Who Are WaveWarZ Traders?

### Current trader types (inferred from battle data)

| Type | Behavior | Platform origin |
|------|----------|----------------|
| ZAO community members | Bet on artists they know personally | ZAO governance participants |
| Crypto-native music fans | Bet based on sound/vibes, track volume | Audius, Farcaster /music |
| DeFi yield hunters | Bet on outcomes they can research | Solana DeFi (Raydium, Jupiter) |
| Competitive listeners | Treat WaveWarZ like fantasy sports | Sports betting, prediction markets |
| Artists betting on each other | Cross-betting among the competitor pool | WaveWarZ artist network |

### What makes a WaveWarZ trader stay

Based on 127.343 SOL in trader claims (vs. 9.0988 SOL artist payouts — traders earn 14x artists):
- Trader economics are compelling: high skill floor (musical taste) + on-chain payout
- The loser-earns mechanic creates guaranteed prizes (no zero-sum frustration from artist side)
- But: only retained traders (repeat bettors) drive volume; one-time bettors don't compound

**Key retention insight:** The first winning trade is the retention hook. The first losing trade is the churn risk. Onboarding traders should front-load the experience of winning.

---

## Part 2: Where to Find New Traders

### Tier A: Crypto-native music fans (highest conversion)

These audiences already understand onchain transactions AND care about music:

| Community | Size | How to reach |
|-----------|------|-------------|
| Audius listeners | 7M+ (estimate) | WaveWarZ uses Audius tracks — native integration (doc 1302) |
| Farcaster /music channel | ~500 members | Cast about battle mechanics + Solana payouts |
| Farcaster /zao channel | ~93 members | ZAO governance participants — already trust ZAO |
| Sound.xyz collectors | ~10K active | Music NFT buyers = music + onchain mindset |
| Zora collector community | ~15K active | Music NFT buyers familiar with Solana crossover |

### Tier B: Prediction market + gaming users

| Community | Size | Why they fit |
|-----------|------|-------------|
| Polymarket users | ~100K active | Already comfortable with onchain prediction |
| Fantasy sports Discord servers | ~50K+ | Bet on outcomes based on research = same behavior |
| Crypto gaming communities (Axie, STEPN alumni) | ~20K | Used to play-to-earn mechanics |
| Solana gaming Discord (MagicEden, Tensor) | ~30K | Solana-native, comfortable with on-chain bets |

### Tier C: Non-crypto music fans (longer conversion path)

| Community | Size | Why they fit |
|-----------|------|-------------|
| Beat battles subreddit (r/WeAreTheMusicMakers) | ~1.5M | Already participates in music competitions |
| Rap/hip-hop Discord servers | ~50K+ | Emotionally invested in "who's better" battles |
| Music production YouTube comments | ~500K+ | Viewers who judge beats actively |
| ZAOstock in-person attendees | 200-300 | Will see WaveWarZ battle live (doc 1346) |

---

## Part 3: Trader Acquisition Tactics

### Tactic T01: "Watch and Bet" onboarding flow

The fastest path from discovery to first bet:

1. User sees WaveWarZ battle result post on X or Farcaster
2. Clicks link → wavewarz.info
3. Sees active battle: "Listen to both tracks. Who do you think wins?"
4. Privy wallet created in 30 seconds (doc 1343 — DECISION NEEDED: when does Privy flip?)
5. Coinflow: add $10 USDC → convert to SOL
6. Place first bet: $1-5 on the track they just heard
7. Result drops: they win → "You earned $X on wavewarz.info" → share moment

The entire flow should be completable in under 5 minutes. Every extra step is churn.

**Bottleneck:** Currently Privy integration is built but not flipped. When Privy goes live, new-trader conversion should jump significantly. This is the highest-leverage single action for trader growth.

### Tactic T02: Battle preview clips as trader recruitment

Before each MAIN event, post a 15-30 second preview of the two competing tracks on X and Farcaster:

```
🎵 Who wins this one?

[Artist A]: [track name]
[Artist B]: [track name]

Both tracks play on wavewarz.info — listen, then bet.
Battle goes live tonight [time].
```

Music preview clips get significantly more engagement than text posts about upcoming battles. They let potential traders make a judgment before clicking through, which pre-qualifies conversion intent.

### Tactic T03: Top trader leaderboard (recurring)

ZOE posts a weekly "Top 5 Traders This Week" on X and Farcaster:

```
📊 WaveWarZ Top Traders — Week of [date]

1. [handle/wallet prefix] — [X] SOL claimed
2. [handle/wallet prefix] — [X] SOL claimed
3. [handle/wallet prefix] — [X] SOL claimed
4. [handle/wallet prefix] — [X] SOL claimed
5. [handle/wallet prefix] — [X] SOL claimed

Season totals: wavewarz.info
Who's on the leaderboard next week?
```

Social proof of earnings + competitive framing → FOMO among non-traders. If the wwtracker dashboard exposes top-trader data (DECISION NEEDED: does the API have this?), ZOE can pull it automatically.

### Tactic T04: "Trader of the Month" recognition

Monthly: ZAO nominates and publicly recognizes the highest-performing trader:
- X post tagging them + their season stats
- Farcaster /zao cast featuring them
- Optional: small prize (exclusive ZAO Respect allocation, ZOR badge)

Creates aspirational identity: "I want to be WaveWarZ Trader of the Month." Builds community around the trader role, not just the artist role.

### Tactic T05: Prediction market crosspost to Polymarket community

Post a battle as a "prediction market framing" in Polymarket Discord or subreddit:
```
There's an onchain music battle on WaveWarZ tonight — two Solana-native producers.
You can actually bet on who wins, paid out automatically onchain.
If you're into prediction markets, this is the music version: wavewarz.info
```

Polymarket's community already understands "bet on outcomes with onchain payout." WaveWarZ is a natural fit. Just needs awareness.

### Tactic T06: ZAOstock live battle as trader onboarding event

If a WaveWarZ MAIN event runs during ZAOstock intermission (doc 1346 decision #5):
- 200-300 in-person + hundreds virtual = largest single trader onboarding moment possible
- MC: "Take out your phone. Go to wavewarz.info. You're going to bet on the next battle live."
- Walk audience through Privy wallet creation live (Privy must be flipped by then)
- First 10 people who place a bet get a prize (ZAOstock swag, small SOL reward)

This is the highest-leverage single trader acquisition event of the year.

---

## Part 4: Trader Retention Tactics

### Winning ≠ retention. Community = retention.

Traders who make money leave when they lose a streak. Traders who feel community belonging stay through streaks.

**Community building tactics:**

1. **Weekly battle predictions thread:** ZOE posts on X and Farcaster every Monday: "This week's MAIN events: [list]. What's your pick?" → replies create community prediction culture
2. **Post-battle reaction posts:** After each battle, ZOE posts result + "Were you right?" → creates shared moment for traders
3. **Trader vs. community accuracy:** Track whether top traders predict differently than average community → turns WaveWarZ into a "can you beat the market?" game
4. **Artist + trader crossover:** Encourage artists to follow and interact with their top traders → builds personal connection that drives loyalty on both sides

### Seasons as retention structure

Currently WaveWarZ runs continuously without seasons. Adding seasonal structure could help retention:
- **Season boundaries:** Quarterly (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec)
- **Season leaderboard:** Separate from all-time — gives new traders a chance to rank
- **Season reset + prize:** Top 3 traders at season end receive a prize (SOL payout, ZOR badge, ZAOstock ticket)
- **Season recap:** ZOE posts a season wrap with stats + leaderboard → creates shareable content

**Decision needed from Hurricane:** Is seasonal leaderboard structure technically feasible with current WaveWarZ architecture?

---

## Part 5: ZOE Automation for Trader Growth

**TMP-TR01: Pre-battle track preview post**
```
🎵 Tonight's MAIN Event:

[Artist A] — "[track name]"
[Artist B] — "[track name]"

Listen to both → place your bet → winner announced [time].

wavewarz.info | #WaveWarZ
```

**TMP-TR02: Weekly top traders leaderboard**
```
📊 Top Traders This Week

1. [trader 1] · [X] SOL
2. [trader 2] · [X] SOL
3. [trader 3] · [X] SOL

Total trader claims all-time: [X] SOL
Your turn → wavewarz.info
```

**TMP-TR03: Post-battle "were you right?" engagement**
```
Results: [Artist A] vs [Artist B]
Winner: [Artist]

[N] trades · [X] SOL volume

Were you right? → wavewarz.info for full stats
Next battle: [date]
```

**TMP-TR04: Trader of the Month recognition**
```
🏆 WaveWarZ Trader of the Month — [Month]

@[trader handle]
[N] battles traded · [X] SOL claimed · [Y]% win rate

Trading WaveWarZ like a pro. Who's next?

→ wavewarz.info
```

---

## Part 6: Integration with Other Docs

| Doc | Integration |
|-----|-------------|
| 1302 (WaveWarZ onboarding) | Trader onboarding flow = step 5 in that doc |
| 1341 (MAIN event strategy) | Each MAIN event needs a trader audience — trader recruitment feeds this |
| 1342 (artist recruitment) | Artists recruit traders from their own fan base — cross-leverage |
| 1343 (partner activation) | Privy flip = #1 prerequisite for trader growth. Polymarket crosspost via Neynar amplification |
| 1347 (newsletter growth) | "Top Traders This Week" → newsletter feature → draws traders to subscribe |

---

## Part 7: Decisions Needed

1. **Privy flip status** (highest leverage): When does Privy go live? Trader conversion is directly blocked by wallet friction until then. Ask Hurricane immediately. (Doc 1343 also flags this)
2. **Trader leaderboard API**: Does the public API expose per-wallet trade counts and claims? If yes, ZOE can auto-post leaderboards. If no, this is a feature request for Hurricane.
3. **Season structure**: Is quarterly reset technically feasible? Hurricane decision.
4. **ZAOstock live battle**: Run a MAIN event during ZAOstock intermission as live trader onboarding? (Requires Hurricane coordination and battle setup on Oct 3) — also flagged in doc 1346.
5. **Track preview clips**: Can WaveWarZ auto-generate 15-30 second audio previews of competing tracks for social posts? Or does ZAO pull this from Audius directly?

---

## Part 8: North Star Impact

| Metric | Before | After (full execution) |
|--------|--------|----------------------|
| Distribution | 5.5/10 | 6.5/10 (more active traders = more engagement metrics) |
| Governance | 9/10 | 9.2/10 (top traders → ZAO governance participants) |
| IP catalog | 8.5/10 | 8.7/10 (more battles = more IP events on chain) |
| Overall | 7.0/10 | 7.3/10 |

**Volume projection:** If trader pool doubles from current active traders:
- Battle volume: 1,245 → ~1,800 battles by Dec 2026 (milestone: 2,000 target in doc 1345)
- SOL volume: 523.991 → ~750 SOL by Dec 2026
- Artist payouts: 9.0988 → ~15 SOL by Dec 2026

---

*Created: 2026-07-17 | Execute alongside doc 1342 (artist recruitment) Aug 1+ | Key prerequisite: Privy flip (doc 1343) | Related: 1302, 1341, 1342, 1343, 1347*
