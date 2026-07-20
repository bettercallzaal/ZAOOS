---
topic: africa-battle-week, events, zoe, operations
type: live-ops-guide
status: EXECUTE SEP 22 — ZOE runs this doc on each of the 5 battle days. Synthesizes docs 1675 (post templates), 1680 Section 3 (Hurricane checklist), and 1677 Week 4 (ZABAL S2 crossover) into a single day-by-day ops guide. Sep 22 = Day 1. Sep 26 = Day 5 (charity battle).
last-validated: 2026-07-18
related-docs: 1675-farcaster-content-calendar-sep2026, 1680-africa-battle-week-artist-onboarding-guide, 1677-zabal-s2-zoe-weekly-ops-guide, 1712-africa-battle-week-prelaunch-countdown, 1643-africa-battle-week-vote-results-protocol
action-owner: ZOE (all posts below); Hurricane (open/close battles, send URLs + payout tx hashes); Zaal (approves charity result post, monitors)
---

# 1720 — Africa Battle Week Live Operations (Sep 22-26, 2026)

> **What this is:** ZOE's day-by-day live ops guide for Africa Battle Week. Doc 1675 has the post templates. Doc 1680 Section 3 has Hurricane's setup checklist. This doc is ZOE's perspective: exact timing for all posts, Hurricane coordination, ZABAL S2 Week 4 crossover, and failure protocols if a battle doesn't fire correctly.
>
> **Africa Battle Week schedule:**
> - Day 1: Sep 22 (Monday) — first US vs West Africa battle
> - Day 2: Sep 23 (Tuesday)
> - Day 3: Sep 24 (Wednesday)
> - Day 4: Sep 25 (Thursday)
> - Day 5: Sep 26 (Friday) — charity battle, 100% SOL to [Charity Name]
>
> **All times ET.** Battle launch: 9 AM ET (2 PM WAT). Vote window: varies by battle (set by Hurricane). Settlement: within 1-2 hours of vote close.

---

## Pre-Week Staging (Sep 20-21)

**Sep 20 (Saturday):**
- ZOE receives all 5 battle URLs from Hurricane
- ZOE stages day-by-day launch posts using real battle URLs (replaces `[WaveWarZ battle URL]` placeholders from doc 1675)
- ZOE sends Zaal confirmation: "All 5 battle URLs received. Day 1-5 posts staged. Ready for Monday."

**Sep 21 (Sunday, eve):**
ZOE posts to /wavewarz + /zao at 8:00 PM ET:
```
Africa Battle Week starts TOMORROW.

5 battles. 5 days.
US artists vs West African artists.
All on-chain. Loser earns.

Day 1 drops at 9 AM ET.
The battle is live when the bell rings.

Ready?
```

---

## Day 1: Sep 22 (Monday)

**Note:** ZABAL S2 has its regular Monday session today. Zaal is running two events simultaneously. ZOE handles Africa Battle Week posts automatically. ZABAL S2 attendance recording comes AFTER the battle (staggered).

### 9:00 AM — Battle Launch Post
ZOE posts to /wavewarz:
```
Day 1 of Africa Battle Week is LIVE.

[Artist 1 US] vs [Artist 1 Africa]

Battle link: [Hurricane's URL from Sep 20]
ZOR holders: voting window opens when the battle closes.

What happens to the loser? They earn.
That's the whole point.
```

ZOE confirms with Hurricane: "Day 1 battle is showing live on your end?"
Hurricane replies: "Live" or sends status.

### 11:00 AM — Mid-Battle Update (if vote window is still open)
ZOE posts to /wavewarz:
```
Day 1 battle is open.

[N] votes cast. [Leader] is ahead.
[X] SOL wagered so far.

Polls close at [Hurricane confirms time].
Then the loser earns.
```
Note: ZOE pulls vote count from WaveWarZ API or waits for Hurricane to confirm. If API not available, ZOE skips mid-battle post and sends Zaal: "API not showing live vote count — skip mid-battle update or Hurricane can share?"

### Within 1 hour of settlement — Day 1 Result Post

Hurricane sends ZOE: `Winner: [handle] | Loser earned: [X] SOL | Voters: [N] | Payout tx: [Solana tx hash]`

ZOE posts to /wavewarz + /zao:
```
Africa Battle Week Day 1 result:

Winner: [@handle]
Loser earned: [X] SOL
Voters: [N]

Day 2 tomorrow: [Artist 2 US] vs [Artist 2 Africa]
```

ZOE also posts to ZABAL S2 Telegram (Week 4 ZABAL S2 crossover per doc 1677):
```
Africa Battle Week Day 1 done.
Track A ZABAL participants: you can still battle in today's open time.
Day 2 is tomorrow.
```

### 4:30 PM — ZABAL S2 Week 4 Session Recap
ZOE posts session recap to /zabal and ZABAL S2 Telegram (doc 1677 post-session template):
```
ZABAL S2 Week 4: live Africa Battle Week governance session.

[N] participants attended.

Today's session: Africa Battle Week governance — how voting worked, what Track A artists participated in.

Day 2 tomorrow: [preview]
```

---

## Day 2: Sep 23 (Tuesday)

### 9:00 AM — Battle Launch Post
ZOE posts to /wavewarz:
```
Africa Battle Week Day 2 is LIVE.

[Artist 2 US] vs [Artist 2 Africa]

Battle: [URL]
Voting opens at close.

The loser earns.
```

ZOE posts to /zabal (ZABAL S2 crossover):
```
ZABAL S2 Track A update:

Day 2 of Africa Battle Week.
S2 artists: your battle window is open.
Battle today and it counts toward your 5-battle requirement.
```

### Mid-battle + Result: same pattern as Day 1

Day 2 result post adds ZABAL S2 note:
```
Africa Battle Week Day 2 result:

Winner: [@handle]
Loser earned: [X] SOL

Day 3 tomorrow.

2 battles done. 3 to go.
```

---

## Day 3: Sep 24 (Wednesday)

### 9:00 AM — Battle Launch Post
Same pattern. ZOE adds mid-week recap:

ZOE posts mid-week recap to /wavewarz after Day 3 result:
```
Africa Battle Week midpoint.

2 battles done.
[Total] SOL wagered.
[Total] SOL to losing artists via loser-earns mechanic.

Halfway through.
Day 3 of 5 is now complete.
```

ZOL mirrors key result to /zabal:
```
Africa Battle Week Day 3 result: [artist] won, [artist] earned [X] SOL.
[Cumulative total] SOL distributed to artists so far.
```

---

## Day 4: Sep 25 (Thursday)

### 9:00 AM — Battle Launch Post
Same pattern.

### Day 4 Result Post — includes ZAOstock CTA
ZOE posts Day 4 result to /wavewarz:
```
Day 4 of Africa Battle Week done.

Tomorrow (Sep 26): the charity battle.
100% of SOL goes to [Charity Name].
Automatic. On-chain.

Also: ZAOstock is in 8 days.
Africa Battle Week artists are the freshest names in WaveWarZ right now.
Meet them Oct 3 in Maine.

Tickets: [Eventbrite URL]
```

**Fractal reminder (Thursday 5PM ET per doc 1706):**
ZOE posts weekly Fractal session reminder to ZAO Telegram. If Fractal and Africa Battle Week overlap on a Thursday: ZOE combines them — but keeps them as separate posts (Fractal reminder to ZAO Telegram, ABW update to /wavewarz).

---

## Day 5: Sep 26 (Friday) — Charity Battle

### 9:00 AM — Charity Battle Launch Post
ZOE posts to /wavewarz:
```
Africa Battle Week Day 5 — Charity Battle.

100% of SOL wagered goes to [Charity Name].
[ZOR holders voted for this charity on Jul 24-25]

This is what community governance of charity looks like.
On-chain. Automatic. No middleman.

Battle is LIVE now.
[URL]
```

ZOE posts to /zao:
```
Today: Africa Battle Week charity battle.

[Charity Name] receives all SOL from this battle.
Voted by ZOR holders. Executed on-chain.

[Battle URL]
```

### Mid-battle Update
Same format as Days 1-4, but with charity context:
```
Charity battle in progress.

[N] votes cast. [X] SOL wagered (all goes to [Charity Name]).

Closes at [time].
```

### Within 1 hour of settlement — Charity Result Post (GATED)

**Hurricane sends ZOE:** `Charity tx: [Solana tx hash] | Amount: [X] SOL | Charity wallet: [address]`

**ZOE drafts and sends to Zaal for approval before posting:**
```
Africa Battle Week is over.

[Charity Name] received [X] SOL from today's charity battle.

TX: [tx hash]
[Solscan link]

ZOR holders chose the charity Jul 24-25.
The payout fired automatically Sep 26.
No middleman.

This is how music community philanthropy works in 2026.
```

**Zaal approves via Telegram ("post it") before ZOE sends.** This is the highest-visibility post of Africa Battle Week — do not auto-post.

### Africa Battle Week Wrap Post (Sep 26 Evening)
ZOE posts to /wavewarz + /zao:
```
Africa Battle Week 2026: final numbers.

5 days. 5 battles.
[Total] battles completed.
[Total] SOL wagered.
[Total] SOL to losing artists via loser-earns mechanic.
[Charity amount] SOL to [Charity Name].

First international battle week in WaveWarZ history.
US artists vs West African artists. All on-chain.

We're doing this again.
```

---

## ZABAL S2 Week 4 Integration (All 5 Days)

Per doc 1677 (ZABAL S2 ops), Week 4 is "Africa Battle Week Live" for ZABAL S2. ZOE's additions each day:

| Day | ZABAL S2 Telegram Post |
|-----|----------------------|
| Sep 22 | "ZABAL S2 Track A: Day 1 is live. Battle at wavewarz.info — counts toward your 5-battle req." |
| Sep 23 | "Day 2 live. Track A: battle today counts. [URL]" |
| Sep 24 | "Day 3 live. Track A: 3 days of Africa Battle Week remaining." |
| Sep 25 | "Day 4 live. Tomorrow is the charity battle — Track A welcome to battle, Track B consider documenting today for ZAOOS doc." |
| Sep 26 | "Charity battle live. This is your Week 4 governance moment. Watch the on-chain vote happen in real time." |

**Week 4 session:** If Zaal runs a regular Monday ZABAL S2 session AND Africa Battle Week Day 1 is the same day (Sep 22 Monday), ZOE sequences: ABW launch post at 9AM → ZABAL session go-live at 1:45PM → ABW mid-battle at 11AM (if before session) → session runs 2-3:30PM → ABW result if settled by 4PM → ZABAL session recap at 4:30PM. ZOE does not post ZABAL recap during the ABW battle.

---

## Failure Protocols

### Battle doesn't launch at 9:00 AM
- ZOE waits until 9:15 AM
- If still not live: ZOE holds launch post, DMs Hurricane: "Day [N] battle not showing live at [URL]. Status?"
- If Hurricane doesn't respond within 20 minutes: ZOE DMs Zaal: "Day [N] launch delayed — Hurricane not responding. Action?"
- ZOE does NOT post "Day [N] is live" until Hurricane confirms it is

### Battle settlement stalls (no payout within 2 hours of vote close)
- ZOE waits 2 hours past expected settlement
- DMs Hurricane: "Day [N] settlement not received. Battle URL: [URL]. Status?"
- If no settlement within 4 hours of vote close: ZOE DMs Zaal: "Day [N] settlement delayed. Hurricane investigating."
- ZOE does NOT post the result until Hurricane confirms the payout tx hash

### Charity tx hash (Day 5) not sent by Hurricane within 3 hours of settlement
- ZOE DMs Hurricane: "Day 5 charity tx hash not received. Charity: [Name]. Wallet: [address]. Has the tx fired?"
- ZOE DMs Zaal: "Charity tx hash not yet confirmed. Do not post result until I confirm."
- ZOE does NOT post the Day 5 result without the tx hash — this post must include on-chain proof

### West African artist unreachable on their battle day
- ZOE cannot DM the artist directly (no established channel in ZOE)
- ZOE DMs Zaal: "Day [N] artist [handle] hasn't acknowledged their battle. Hurricane: is their track uploaded?"
- If artist is truly unreachable, Hurricane and Zaal decide: postpone the day or proceed with pre-uploaded track

---

## Post-Week: Sep 27 Recap (ZOE)

The day after Africa Battle Week ends, ZOE posts the Africa + ZAOstock combo recap (doc 1675 Sep 27 post):
```
Africa Battle Week recap: [N] battles, [total] SOL, [charity amount] SOL to charity.

6 days to ZAOstock.

The artists who just battled? Some of them will be in Ellsworth Oct 3.
Last tickets at: [Eventbrite URL]
```

ZOE also sends Zaal an end-of-week summary:
```
Africa Battle Week complete.

Battles: 5/5
Total SOL wagered: [X]
Total SOL to artists: [Y]
Charity payout: [Z] SOL to [Charity Name] (tx: [hash])

Highest-viewed battle: Day [N] (based on vote count)
ZABAL S2 Track A battles completed this week: [N]

ZAOstock is 6 days away.
```

---

## Sources

- `research/farcaster/1675-farcaster-content-calendar-sep2026/` — Sep 22-26 post templates (source for all post text above)
- `research/events/1680-africa-battle-week-artist-onboarding-guide/` — Section 3 (Hurricane day-of checklist) and Section 4 (day-of artist reference)
- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — Week 4 special instructions (Africa Battle Week live)
- `research/governance/1643-africa-battle-week-vote-results-protocol/` — Day 5 charity payout protocol + GATED post requirement
- `research/events/1712-africa-battle-week-prelaunch-countdown/` — pre-event ops (feeds this doc)
