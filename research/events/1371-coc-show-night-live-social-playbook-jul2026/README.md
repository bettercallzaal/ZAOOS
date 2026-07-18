# COC Concertz Show-Night Live Social Posting Playbook

**Doc number:** 1371  
**Status:** REUSABLE — use on every COC show night from #7 onward  
**Context:** Covers the IN-SHOW posting cadence (T-30min through T+60min). Pre-show broadcasts are in each show's show-day-socials doc (e.g. docs/coc7-show-day-socials.md). Post-show 72h plan is in doc 1300. This doc is the missing middle: what to post WHILE you are live.  
**Related docs:** 1300 (72h post-show plan), 1284 (COC #7 show brief), 1317 (COC #8 announcement)

---

## The Cadence

| Time | Action |
|------|--------|
| T-30min | "We're going live in 30" post |
| T-0 (showtime) | Go-live post with link |
| T+15min | First "in the room" post |
| T+30min (WaveWarZ vote opens) | Battle vote activation post |
| T+45min | Mid-show energy post |
| T+90min (show end) | Wrap post with numbers |
| T+60-120min | Recap cast (Farcaster primary) |

---

## Templates

### T-30: Pre-Show Countdown

**Farcaster (post in /cocconcertz channel):**
```
COC Concertz going live in 30 minutes.

WaveWarZ takeover. DJ Zaal on the decks. Live battle vote in the room.

Free entry, no headset needed → https://ticket.cocconcertz.com
```

**X:**
```
COC Concertz in 30 min. WaveWarZ battles live. Crowd votes. No wallet required.

→ https://ticket.cocconcertz.com
```

---

### T-0: Go-Live Post

**Farcaster:**
```
🎧 COC Concertz #[N] is LIVE.

[Venue/stream link]

First WaveWarZ battle: [Song 1] vs [Song 2]. Vote in the room.
```

**Telegram (ZAO + COC groups):**
```
COC is LIVE — join now

[Link]

WaveWarZ battle is starting. Get in the room and vote.
```

---

### T+15: In The Room

**Farcaster:**
```
[X] people in the room at COC Concertz #[N].

No wallet. No headset. No ticket.

Just pull up → [link]
```
*(Replace [X] with the current visitor count from `/api/metrics/coc7`)*

---

### T+30: WaveWarZ Battle Vote Activation

This is the highest-engagement post of the night. Post this when the battle vote opens.

**Farcaster (cast in main + /cocconcertz + /wavewarz):**
```
🎶 COC #[N] WaveWarZ Battle:

[Song 1 Title] by [Artist 1 Handle]
vs
[Song 2 Title] by [Artist 2 Handle]

Jump in the room and vote now → [link]

This is what it sounds like when web3 music fights for supremacy.
```

**X:**
```
WaveWarZ live at COC Concertz #[N].

[Song 1] vs [Song 2] — crowd votes the winner.

→ [link]
```

**Battle commentary hooks (pick one that fits the match):**
- "[Artist 1] has [N] wins on WaveWarZ. [Artist 2] is on a [N]-win streak. Right now in this room."
- "The vote is 60/40. That's [N] humans deciding who wins on-chain tonight."
- "Last time these two went head to head: [result]. Tonight is the rematch."
- "No bots. No algorithms. The crowd here decides."

---

### T+45: Mid-Show Energy

**Farcaster:**
```
Halfway through COC Concertz #[N].

[Mention a highlight: a win by a specific artist, a close vote, a DJ moment]

Still [X] minutes to go. Get in → [link]
```

---

### T+90: Show Wrap

**Farcaster (most important post of the night):**
```
COC Concertz #[N] — done.

[Total viewers] people showed up. No wallet required.

WaveWarZ winner tonight: [Artist Handle] — [N] wins total on the leaderboard now.

Archive is going to Arweave. The set lives forever.

See you next time.
```

**X (shorter):**
```
COC Concertz #[N] wrapped.

[X] people. No wallet required. WaveWarZ winner: [Artist].

Archive → Arweave. Permanent.
```

---

### T+60-120: Recap Cast (Farcaster)

This is the most important long-form post. Write it within 2 hours of the show ending.

```
COC Concertz #[N] numbers:

- [X] unique visitors (no wallet required — open access)
- [Y] uploads to the Arweave archive
- [Z] contest entries
- WaveWarZ winner: [Artist] (@[handle])

What worked: [1-2 sentences on what went well]

What we're changing for #[N+1]: [1-2 sentences on improvement]

Next show: [Date/TBD]

The archive is live at arweave.net/[tx-id]. Permanent.
```

---

## How to Get Real-Time Numbers

During the show, hit this URL (admin access required):
```
https://cocconcertz.com/api/metrics/coc[N]
```

Returns:
- `uniqueVisitors` — live concurrent count (updates as people join/leave)
- `galleryUploads` — total archive uploads so far
- `contestSubmissions` — contest entries

If the peak tracking PR (#50) is merged, check `stats/visitors_peak` in Firestore for the peak concurrent count.

---

## WaveWarZ Battle Vote: How the Show Format Works

For reference when writing live commentary:

1. Admin opens a battle via the ShowNight panel
2. Two WaveWarZ songs are shown in the room
3. Attendees vote by interacting in the Spatial.io room (or via the voting UI)
4. The winner advances in the WaveWarZ leaderboard
5. On-chain recording happens via the WaveWarZ protocol

Talk to this during the battle:
- Name the artists + handles
- Give the current vote split if you can see it
- Reference their WW record (wins/losses)
- Hype the permanence: "whoever wins tonight, it's on-chain"

---

## After the Show: ZOE Automation Targets

If ZOE Discord posting is enabled (PR #1806 ZAOOS, DISCORD_WEBHOOK_STATUS=1):
- ZOE's morning brief will include the recap the next day
- Post the recap cast manually tonight; ZOE picks it up in the next brief cycle

For ZOE to auto-post the recap, add a ZAOOS task: `ZOE: auto-post COC recap to Discord after each show` (future work, not yet implemented).
