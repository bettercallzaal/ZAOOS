---
topic: events/coc-concertz
type: SHOW-BRIEF
status: pre-show
created: 2026-07-17
show-date: 2026-07-18 4PM EST
venue: Spatial.io (Dope Stilo Music Club) + Twitch bettercallzaal
related-docs: 1210, 1256, 1275, 1278
---

# 1284 — COC Concertz #7 Show Brief (July 18, 2026)

> **For Zaal's use during the show.** Talking points, WaveWarZ numbers, and what to say when introducing the ZAO, the platform, and what attendees can do right now. All numbers verified July 17, 2026.

---

## Show Logistics

| Detail | Value |
|--------|-------|
| Date/Time | July 18, 2026, 4PM EST |
| Venue | Spatial.io — Dope Stilo Music Club (browser, no download) |
| Stream | Twitch: twitch.tv/bettercallzaal |
| Format | DJ Zaal + WaveWarZ battle-circuit artists performing live |
| Wallet gate | OFF for COC #7 (open access pilot — anyone can enter + access archive) |
| BattleVote | LIVE — audience votes on WaveWarZ battles in real-time during show |

---

## Opening Remarks (paste-ready)

> "Welcome to COC Concertz #7 — the WaveWarZ Takeover. I'm Zaal Panthaki, co-founder of The ZAO. Tonight we're doing something we've never done before: we're running a live WaveWarZ music battle inside this concert hall, and YOU vote on who wins.
>
> WaveWarZ is a music prediction market. Two songs go head-to-head. You bet on who wins using real money — SOL on Solana. The winning side earns. The losing side earns too. And the artists? They earn automatically on every single trade.
>
> As of today: 1,245 battles. 524 SOL in volume. $1,497 raised for charity. And tonight you're part of that history.
>
> Head to wavewarz.info or look for the BattleVote button on this page to join a battle right now."

---

## WaveWarZ Numbers to Name-Drop During Show

Use these when talking about WaveWarZ to the audience:

| Stat | Number | Context |
|------|--------|---------|
| Total battles | **1,245** | Running since August 2025 |
| Total volume | **524 SOL (~$39,000)** | Real onchain trading by real fans |
| Artist payouts | **9.07 SOL (~$680)** | Auto, instant, no middleman |
| Charity raised | **$1,497** | 2 benefit-battle rounds for HuRya |
| Artist payout rate | **~1.73% of each trade** | vs Spotify's ~$0.004/stream |
| Songs ever battled | **921 unique songs** | On Solana, permanent record |

---

## COC Concertz Show Numbers

| Stat | Number |
|------|--------|
| COC #7 | Show number 7 in the series |
| COC series started | March 2025 |
| Shows per year | Monthly cadence from March 2026 |
| Venue | Spatial.io — Dope Stilo Music Club |
| Archive | Arweave-pinned (permanent, UDL-licensed per asset) |

---

## What Attendees Can Do Right Now

Talk through this during the show:

1. **Vote on a WaveWarZ battle** — the BattleVote widget is live on this page. Anonymous, one vote per session, no wallet required to vote (SOL required to bet)
2. **Go to wavewarz.info** — see the live platform, battle feed, leaderboard
3. **Follow @wavewarz on X** — battle updates + X Space schedule (Mon-Fri 8:30 PM EST)
4. **Join The ZAO newsletter** — paragraph.com/@thezao — daily build-in-public since 400+ editions ago
5. **Ask about WaveWarZ Artists** — any of tonight's performers may be in the WaveWarZ battle catalog

---

## ZAO Intro Paragraph (for anyone who asks "what is The ZAO?")

> "The ZAO is a decentralized artist collective — 188 active members across the US and internationally. We run a weekly governance session on Optimism (the Ethereum Layer 2) every single week — over 100 weeks in a row now. Our flagship product is WaveWarZ. And COC Concertz is our virtual concert series — tonight is our seventh show. We're free to attend, free to join, and everything we do is onchain."

---

## WaveWarZ Battle Show Format

During COC #7, Zaal will run battles live:

1. `npx tsx scripts/manage-battle.ts create` — opens a new battle between two performers
2. Announce the matchup live: "Song A vs Song B — vote now on the BattleVote widget"
3. Let it run for 5-10 minutes while music plays
4. `npx tsx scripts/manage-battle.ts close` — ends the battle and settles payouts
5. Announce the winner

**What makes tonight historic:** Real SOL, real payouts, real onchain settlement — all live, with the audience watching. No other virtual concert series does this.

---

## The Open-Access Pilot

COC #7 has the wallet gate turned OFF (normally, access to the Arweave archive requires ZABAL token on Base). Tonight, anyone can:
- Enter the Spatial.io venue
- Access the show archive after it ends
- Download fan galleries and photos

This is a deliberate experiment to measure what open access does to attendance. Metrics captured:
- Concurrent viewers (wallet connected vs. not)
- Archive uploads
- BattleVote interactions

Post-show report will be Supabase-sourced and written up by Saturday.

---

## What Tonight Proves

Frame this during closing remarks:

> "We just ran a live music battle in a virtual concert. The winner was chosen by the audience betting real money on Solana. The payout happened automatically. No label. No ticket sales. No venue cut. The ZAO gets 3% — everything else goes back to you.
>
> This is what decentralized music looks like. This is why WaveWarZ is different. And this is show number 7 of COC Concertz — we'll be back next month. Join the newsletter. Show your friends."

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1210 | COC #7 full architecture + BattleVote integration details |
| doc 1256 | COC Concertz full series record (shows 1-7) |
| doc 1275 | WaveWarZ artist payout vs industry (numbers source) |
| doc 1278 | ZAO Citable Claims — all stats in this doc sourced here |
