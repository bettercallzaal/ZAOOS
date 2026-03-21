# 96 — WaveWarZ Deep Dive & ZAO OS Integration

> **Status:** Research complete
> **Date:** March 21, 2026
> **Goal:** Deep-dive WaveWarZ mechanics, tools ecosystem, and ZAO OS integration advantages

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **WaveWarZ page** | Add quick-link bar at top of `/wavewarz` with: Main App, Intelligence, Analytics |
| **Ecosystem card** | Update description to reflect SOL prediction market mechanics (not "ephemeral tokens") |
| **Community config** | Add WaveWarZ tool URLs to config for easy maintenance |
| **CSP** | Add `wavewarz-intelligence.vercel.app` and `analytics-wave-warz.vercel.app` to frame-src |
| **Future: Onchain data** | Battle Vault PDAs are public Solana data — read battle results without API |
| **Future: Battle feed** | Surface live/recent WaveWarZ battles in ZAO social feed via Solana RPC |
| **Future: Artist pipeline** | 43+ indie artists on WaveWarZ = ZAO recruitment targets |

---

## What WaveWarZ Actually Is

**Not "ephemeral tokens."** WaveWarZ is a **Solana prediction market for music battles** — closer to Polymarket for music than pump.fun.

### How Battles Work

1. Two songs/artists are matched
2. Each side gets a **Battle Vault PDA** (Solana smart contract escrow)
3. Fans deposit SOL into the side they think will win
4. Trading happens live during X Spaces sessions (Mon-Fri 8:30 PM EST)
5. After judging, the battle **settles**: winners get proportional share + 40% of losing pool

### Battle Types

| Type | Count | Description |
|------|-------|-------------|
| Quick Battles | 497 | Song vs song, single round |
| Main Events | 120 | Artist vs artist, multi-round, judges + X poll + SOL weight |
| Multi-Round | 40 | Extended tournament format |
| Benefit Battles | 2 | Charity events (~$1,500 raised) |

### Economics

| Flow | Percentage |
|------|-----------|
| **Winners** | Proportional share + 40% of losing pool |
| **Losers** | 50% refunded (partial recovery) |
| **Artists** | 1% trade volume + 5-7% settlement bonus |
| **Platform** | 0.5% per trade + 3% losing pool |
| **In ecosystem** | 98.5% of volume stays |

### Platform Stats (March 2026)

| Metric | Value |
|--------|-------|
| Total Volume | 423.37 SOL (~$37,917) |
| Total Battles | 647 |
| Tracked Artists | 43+ |
| Artist Payouts | 7.18 SOL (~$643) |
| Platform Revenue | 3.38 SOL (~$303) |
| Schedule | Mon-Fri 8:30 PM EST on X Spaces |

---

## WaveWarZ Tool Ecosystem

### 1. Main App — wavewarz.com
The battle platform. Create/join battles, trade SOL on outcomes, listen to tracks, vote.
- **Tech:** Next.js PWA on Vercel
- **Already integrated:** Embedded in ZAO OS at `/wavewarz`

### 2. Intelligence Dashboard — wavewarz-intelligence.vercel.app
"The verifiable analytics engine for WaveWarZ"
- Total volume, battle counts, artist payouts, platform revenue
- Full battle history browser (all 647 battles with IDs, songs, dates, volumes, winners)
- 5 leaderboard categories: Clipper, Artist, Song, Community, Trader
- Multi-round events tracker + benefit battle tracker
- **Claim tool** — paste wallet, scan for unclaimed winnings
- Real-time SOL price integration

### 3. Analytics — analytics-wave-warz.vercel.app
Chart-focused analytics complement to the Intelligence dashboard.
- **Tech:** Vite + React 19 + Recharts + Solana Web3.js + Supabase
- Visualization-heavy (charts, graphs, trends)
- Battle volume trends, artist performance over time

---

## ZAO OS Integration — What to Build

### Phase 1: Links & Navigation (NOW)
- Add quick-link bar at top of `/wavewarz` page: **Battles | Intelligence | Analytics**
- Each links to the respective app (wavewarz.com, intelligence, analytics)
- Update community.config.ts with WaveWarZ tool URLs

### Phase 2: Data Integration (NEXT)
- Read Battle Vault PDAs via Solana RPC (public data, no API needed)
- Show recent battle results in ZAO's `/wavewarz` Farcaster channel feed
- Display ZAO members' WaveWarZ stats (wins, volume traded) in profile

### Phase 3: Cross-Platform Synergy (FUTURE)
- "Enter WaveWarZ Battle" button on ZAO music submissions
- Respect-weight governance using WaveWarZ battle performance
- Auto-surface battle winners in ZAO music player
- Referral arrangement: ZAO-referred battles → community treasury revenue

---

## Competitive Advantages for ZAO OS

1. **Battle-as-Governance** — Use prediction market mechanics for ZAO decisions ("which song should @thezao promote?"). Skin-in-the-game produces better signal than free votes.

2. **Artist Discovery Pipeline** — 43+ indie artists (hip-hop/R&B) on WaveWarZ = exact ZAO target audience. Surface battle winners in ZAO feed automatically.

3. **Onchain Data** — Battle Vault PDAs are public. Read results, volumes, artist performance via Solana RPC without needing WaveWarZ API.

4. **Cross-Promote** — ZAO's Farcaster publishing + WaveWarZ battle entry = full distribution pipeline for artists.

5. **Multi-Tool Hub** — ZAO OS becomes the only place with WaveWarZ + Intelligence + Analytics in one navigation. No other community does this.

---

## Sources

- [WaveWarZ Main App](https://www.wavewarz.com/)
- [WaveWarZ Intelligence](https://wavewarz-intelligence.vercel.app/)
- [WaveWarZ Analytics](https://analytics-wave-warz.vercel.app/)
- [@WaveWarZ on X](https://x.com/WaveWarZ)
- [WaveWarZ Charity Battle Recap](https://x.com/WaveWarZ/status/1999858390567117201)
- Existing codebase: `src/app/(auth)/wavewarz/page.tsx`, `community.config.ts`
- Previous research: Doc 95 (Solana + WaveWarZ initial research)
