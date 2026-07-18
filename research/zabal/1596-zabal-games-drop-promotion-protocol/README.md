---
topic: zabal, community, farcaster
type: activation-protocol
status: USE NOW — ZABAL Games drop scheduled Wed Jul 22; reuse for every future drop
last-validated: 2026-07-20
related-docs: 1534-zao-devz-bounty-campaign, 1584-bountycaster-zao-devz, 1455-zabal-gamez-show-expansion, 1567-zabal-s2-participant-tracker
board-tasks: None (responds to "ZABAL Games drop Wed")
action-owner: ZOE (Farcaster + TG posts); Zaal (approves cast); Iman (X cross-post)
---

# 1596 — ZABAL Games Drop Promotion Protocol

> **What this is:** A reusable promotion protocol for every ZABAL Games drop or season launch. Written for the Jul 22 drop and designed to be reused every time ZABAL Games releases a new batch, season, or game. ZOE follows this checklist automatically; Zaal just approves the cast text.

---

## What a ZABAL Games Drop Is

ZABAL Games (`zabalgamez.com`) runs live build-along workshops, game challenges, and community quests. A "drop" is one of:
- New game/challenge batch (fresh set of quests)
- New season open (signup window)
- Collab show or workshop announcement
- New community signup form going live

Each drop should generate sign-ups, Farcaster follows, and ZABAL token activity.

---

## Jul 22 Drop — Fast Checklist

Apply this protocol for the Jul 22 drop. Target: 10+ new sign-ups by Jul 24.

### Step 1: Confirm What's Dropping (Zaal / 5 min)

Before posting anything, Zaal confirms:
- [ ] What exactly launches Jul 22? (New game? S2 application opens? New workshop?)
- [ ] Is zabalgamez.com updated with the new content?
- [ ] What's the sign-up URL / CTA?

### Step 2: Post the Drop Cast on Farcaster (ZOE → Zaal approves)

**Post in /zabal and tag /wavewarz**

```
ZABAL Games just dropped. [One-line description of what dropped]

→ [zabalgamez.com or specific sign-up URL]

What ZABAL Games is:
Live workshops. Real bounties. Community quests.
You build → you earn → you level up.

If you're a builder, artist, or just curious about ZAO:
zabalgamez.com
```

**Timing:** 12pm ET on Jul 22 (peak Farcaster engagement window)

**ZOL should also auto-recast** this from @zolbot if it's configured to recast /zabal announcements (part of doc 1572 growth playbook).

### Step 3: Telegram Drop Announcement

Post to ZAO main Telegram group:

```
🎮 ZABAL Games dropped today — [one-line description]

→ [Sign-up link]

Jump in: zabalgamez.com
```

**If there's a specific Telegram group for ZABAL participants:** Also post there.

### Step 4: Iman X Cross-Post

Iman cross-posts the Farcaster cast to X (Twitter). Add to the end of the X post:
```
#web3gaming #ZABALGames #ZAO
```

This reaches the web3 audience outside Farcaster.

### Step 5: ZABAL Games Leaderboard / ZABAL Token Incentive (If Applicable)

If the drop includes ZABAL token incentives:
- Confirm ZABAL treasury balance covers the drop rewards
- Post ZABAL reward amounts explicitly in the cast:
  ```
  Earn ZABAL by completing challenges.
  Top 3 this week: 1,000 / 500 / 250 ZABAL
  ```
- ZOL monitors /zabal for challenge completions and distributes ZABAL per completion

---

## Reusable Protocol Template (For Every Future Drop)

Use this for every ZABAL Games drop/launch. Total time: 30 min.

| Step | Owner | Time | What |
|------|-------|------|------|
| 1. Confirm what's dropping | Zaal | 5 min | URL + content live check |
| 2. Farcaster drop cast in /zabal | ZOE draft → Zaal approve | 10 min | 1 cast, link, 1 CTA |
| 3. ZOL recast of drop announcement | ZOL (auto) or Zaal manual | 2 min | Amplify reach |
| 4. TG announcement | ZOE | 2 min | Short, link, emoji |
| 5. X cross-post | Iman | 5 min | Same text + hashtags |
| 6. 24h reply monitoring | ZOE | Ongoing | Respond to questions in /zabal |
| 7. Leaderboard post (if applicable) | ZOL | 24h after drop | Top performers + ZABAL earned |

**Total active time:** ~25 min. ZOE automates steps 3, 4, and 7.

---

## Success Metrics for Jul 22 Drop

| Metric | Target (24h after drop) |
|--------|------------------------|
| New sign-ups / form submissions | 10+ |
| Farcaster cast engagement (likes + replies) | 10+ |
| /zabal new members | 3+ |
| X engagement | 5+ likes or replies |
| ZABAL Games challenge starters | 5+ |

Check these metrics on Jul 23. If below target, do a second "reminder post" on Jul 24:

```
Reminder: ZABAL Games [what dropped] is still open.

[Sign-up URL]

First [X] to complete the challenge earns [ZABAL amount].
```

---

## ZOL Automation Notes

ZOL can automate parts of this drop protocol once the following are set up:
- ZOL monitors /zabal for "I completed [challenge]" style posts → logs to doc 1567 Supabase tracker
- ZOL distributes ZABAL to wallets of verified challenge completers
- ZOL posts weekly ZABAL leaderboard in /zabal (top 5 this week)

**Current status:** These automations require ZOL PRs #26-#39 to merge first (same gate as Keystones 3 and 4). Until then, Zaal + Iman manually tally completions.

---

## Past Drop Patterns (Reference)

From doc 1455 (ZABAL Gamez show expansion):
- The POIDH clip-bounty pipeline proved itself: record session → spark POIDH bounty → community clips it → distribution flywheel
- "Episode watch + comment" gives 2 game points — incentivizing community participation
- ZABAL rewards convert one-time players into repeat participants

From doc 1534 (ZAO Devz bounty):
- The R7 cast goes out Jul 25, same week as ZABAL Games drop — don't compete for attention. Post ZABAL Games on Jul 22, R7 bounty on Jul 25. Separate the signals.

---

## Sources

- Board task: "ZABAL Games drop Wed" (July 22, 2026)
- Doc 1455: ZABAL Gamez show expansion + POIDH pipeline (drop patterns reference)
- Doc 1534: ZAO Devz bounty campaign (R7 timing coordination)
- Doc 1584: Bountycaster guide (for R7 — separate from Jul 22 ZABAL Games drop)
- Doc 1567: ZABAL S2 participant tracker (Supabase backend for challenge completions)
- zabalgamez.com: live ZABAL Games site
