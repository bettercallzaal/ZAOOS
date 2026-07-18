---
topic: events/coc
type: PLAYBOOK
status: READY — use Saturday Jul 19 morning after pilot report, announce Monday Jul 21
created: 2026-07-17
---

# COC #8 Date Announcement Playbook (Jul 2026)

One-stop branching guide for locking and announcing the COC #8 date. Run the pilot report Saturday morning (`npx tsx scripts/generate-pilot-report.ts`), read the gate color from doc 1393, then follow the matching branch below.

---

## Step 1 — Saturday morning (Jul 19, after show)

```bash
cd ~/coc
npx tsx scripts/generate-pilot-report.ts
```

Record these numbers:
- Peak site viewers: ____
- Gallery uploads: ____
- Archive uploads: ____
- Contest entries: ____
- Total battle votes: ____
- Overall gate color: RED / YELLOW / GREEN / GREAT

---

## Step 2 — Gate-to-date decision tree

| Gate color | COC #8 date | Rationale |
|-----------|-------------|-----------|
| GREAT (50+ viewers) | Aug 22, 2026 | Full momentum — 5-week window, normal production |
| GREEN (25-49 viewers) | Sep 5, 2026 | Healthy — extra 2 weeks for artist outreach (doc 1367) |
| YELLOW (10-24 viewers) | Sep 19, 2026 | Build audience — 9 weeks for Farcaster + WaveWarZ growth sprint |
| RED (<10 viewers) | DECISION NEEDED | Do not auto-announce — bring to Zaal for reevaluation |

If gate is RED: do not announce. Update board task + send zao-status ping to Zaal.

---

## Step 3 — Monday Jul 21: lock date + post

### Farcaster (cast in /cocconcertz)

**GREAT/GREEN version:**
```
COC #8 is locked.

[DATE]. Same venue, same energy.

COC #7 numbers: [PEAK_VIEWERS] peak viewers, [GALLERY_UPLOADS] fan uploads, [BATTLE_VOTES] battle votes.

Free entry. No wallet needed.

ticket.cocconcertz.com
```

**YELLOW version:**
```
COC #8 is coming.

[DATE]. We're building toward it.

COC #7 showed us what works: [BATTLE_VOTES] votes on WaveWarZ battles in one session. We're doubling down on that.

ticket.cocconcertz.com
```

### X (post to @bettercallzaal)

**GREAT/GREEN version:**
```
COC Concertz #8 — [DATE]

Just ran #7 with WaveWarZ battles. [PEAK_VIEWERS] peak viewers, [BATTLE_VOTES] battle votes.

#8 goes bigger. Same free entry.

ticket.cocconcertz.com
```

**YELLOW version:**
```
COC Concertz #8 — [DATE]

#7 was a test. WaveWarZ battles landed.

Growing before #8.

ticket.cocconcertz.com
```

### Telegram (ZAO community channel)

```
COC #8: [DATE]

After last night's show, date is locked.

Numbers from #7:
- Peak viewers: [PEAK_VIEWERS]
- Fan gallery uploads: [GALLERY_UPLOADS]
- Battle votes: [BATTLE_VOTES]

[GATE_COLOR] gate. We're moving forward.

Free entry as always: ticket.cocconcertz.com
```

### Discord (#coc-events)

```
COC #8 date locked: [DATE]

COC #7 recap:
- Peak viewers: [PEAK_VIEWERS]
- Gallery uploads: [GALLERY_UPLOADS]
- Archive uploads to Arweave: [ARCHIVE_UPLOADS]
- Battle votes total: [BATTLE_VOTES]
- Gate: [GATE_COLOR]

Next show in [WEEKS] weeks. Free entry, no wallet required.
ticket.cocconcertz.com
```

---

## Step 4 — Artist outreach (post-announcement)

Once date is locked, run the outreach process from doc 1367:
- Top 5 WaveWarZ artists by SOL volume (already ranked in doc 1367)
- DM template: "COC #8 is [DATE] — want a slot?"
- Target: confirm 2 artists within 48h of date announcement

---

## Placeholder reference

| Placeholder | Source |
|-------------|--------|
| `[DATE]` | Gate decision table above |
| `[PEAK_VIEWERS]` | `npx tsx scripts/generate-pilot-report.ts` → peak site viewers |
| `[GALLERY_UPLOADS]` | Same script → gallery uploads |
| `[ARCHIVE_UPLOADS]` | Same script → archive uploads |
| `[BATTLE_VOTES]` | Same script → total battle votes |
| `[GATE_COLOR]` | doc 1393 gate matrix outcome |
| `[WEEKS]` | Count from Jul 21 to COC #8 date |

---

## Board task checklist (Monday Jul 21)

- [ ] Run pilot report → capture all 5 numbers
- [ ] Determine gate color using doc 1393
- [ ] Pick COC #8 date from table above (or flag RED to Zaal)
- [ ] Copy-paste Farcaster post and cast
- [ ] Copy-paste X post and tweet
- [ ] Copy-paste Telegram message
- [ ] Copy-paste Discord message
- [ ] Update board task for COC #8 planning with locked date
- [ ] DM 2 artists from doc 1367 list within 48h

---

*Created: 2026-07-17 | Use: Saturday Jul 19 AM + Monday Jul 21 | Related: 1393 (gate matrix), 1367 (artist outreach), 1414 (show-day social kit), 1300 (post-show 72h plan)*
