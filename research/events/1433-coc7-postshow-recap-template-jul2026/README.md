---
topic: events/coc
type: CONTENT TEMPLATE
status: READY — use Sunday Jul 20 evening / Monday Jul 21 after pilot report
created: 2026-07-18
---

# COC #7 Post-Show Recap Template (Jul 2026)

Ready-to-paste social posts for Sunday July 20 and Monday July 21. Fill [BRACKET] placeholders from Saturday's pilot report (`npx tsx scripts/generate-pilot-report.ts`).

---

## Placeholder reference

| Placeholder | Source |
|-------------|--------|
| `[PEAK_VIEWERS]` | pilot report → peak site viewers |
| `[GALLERY_UPLOADS]` | pilot report → gallery uploads |
| `[ARCHIVE_UPLOADS]` | pilot report → archive uploads to Arweave |
| `[BATTLE_COUNT]` | pilot report → number of battles run |
| `[BATTLE_VOTES]` | pilot report → total battle votes |
| `[BATTLE_1_TITLE]` | pilot report → Battle 1 title |
| `[BATTLE_1_WINNER]` | pilot report → Battle 1 winner |
| `[BATTLE_2_TITLE]` | pilot report → Battle 2 title |
| `[BATTLE_2_WINNER]` | pilot report → Battle 2 winner |
| `[GATE_COLOR]` | doc 1393 gate matrix → composite outcome |
| `[COC8_DATE]` | doc 1428 decision table → chosen COC #8 date |

---

## Sunday July 20 — First Recap Post

### X / Farcaster (primary — post this first)

```
COC #7 wrapped.

[PEAK_VIEWERS] peak viewers. [BATTLE_VOTES] battle votes. [GALLERY_UPLOADS] fan uploads.

WaveWarZ battle results:
[BATTLE_1_TITLE]: [BATTLE_1_WINNER] won
[BATTLE_2_TITLE]: [BATTLE_2_WINNER] won

The crowd voted. No algorithm. No payola.

COC #8 is coming. Date drops tomorrow.
```

### Farcaster /cocconcertz channel

```
COC Concertz #7 is a wrap.

Numbers from last night:
- [PEAK_VIEWERS] peak concurrent viewers on cocconcertz.com
- [BATTLE_VOTES] total WaveWarZ battle votes
- [GALLERY_UPLOADS] fan gallery uploads
- [ARCHIVE_UPLOADS] uploads archived to Arweave

Battle results:
1. [BATTLE_1_TITLE] — winner: [BATTLE_1_WINNER]
2. [BATTLE_2_TITLE] — winner: [BATTLE_2_WINNER]

The crowd decided every time.

COC #8 date drops tomorrow.
```

### Telegram (ZAO community)

```
COC #7 recap:

Peak viewers: [PEAK_VIEWERS]
Fan gallery uploads: [GALLERY_UPLOADS]
Arweave archive uploads: [ARCHIVE_UPLOADS]
Battle votes: [BATTLE_VOTES]

Battle winners:
- [BATTLE_1_TITLE]: [BATTLE_1_WINNER]
- [BATTLE_2_TITLE]: [BATTLE_2_WINNER]

Gate: [GATE_COLOR]

COC #8 date announcement coming Monday.
```

### Discord (#coc-events)

```
COC #7 Numbers — July 18, 2026

Peak concurrent viewers: [PEAK_VIEWERS]
Fan gallery uploads: [GALLERY_UPLOADS]
Arweave archive uploads: [ARCHIVE_UPLOADS]
Battle votes: [BATTLE_VOTES]

Battle results:
1. [BATTLE_1_TITLE] → Winner: [BATTLE_1_WINNER]
2. [BATTLE_2_TITLE] → Winner: [BATTLE_2_WINNER]

Overall gate: [GATE_COLOR]

COC #8 date comes Monday. Stay tuned.
```

---

## Monday July 21 — COC #8 Announcement

### X / Farcaster (primary)

```
COC Concertz #8: [COC8_DATE]

We looked at the numbers from #7. We're moving forward.

Same model: WaveWarZ battles, community vote, free entry.

ticket.cocconcertz.com
```

### Farcaster /cocconcertz

```
COC #8 is locked.

Date: [COC8_DATE]

COC #7 validated the format: [PEAK_VIEWERS] peak viewers, [BATTLE_VOTES] battle votes, crowd-determined results.

#8 builds on that. Free entry as always.

ticket.cocconcertz.com
```

### Telegram

```
COC #8 date: [COC8_DATE]

Based on COC #7 results ([GATE_COLOR] gate), we're moving forward. Details to follow.

Free entry. ticket.cocconcertz.com
```

---

## If PR #50 DID NOT merge before show

If `pilot report → peak viewers = 0`: note in the recap that viewer tracking wasn't active, and use Twitch + Spatial analytics as the source instead.

Add this line to recaps:
```
(Viewer count from Twitch analytics — real-time tracking was offline)
```

---

## Posting order

**Sunday July 20:**
1. Run pilot report: `npx tsx scripts/generate-pilot-report.ts`
2. Fill all [BRACKET] placeholders
3. X/Farcaster recap → wait 10 min
4. Farcaster /cocconcertz recap
5. Telegram
6. Discord

**Monday July 21:**
1. Lock COC #8 date using doc 1428 decision table
2. X/Farcaster announcement
3. Farcaster /cocconcertz
4. Telegram + Discord
5. Update board task with locked date

---

*Created: 2026-07-18 | Use: Sunday Jul 20 + Monday Jul 21 | Related: 1393 (gate matrix), 1428 (COC #8 decision), 1414 (show-day social kit), 1300 (post-show 72h plan)*
