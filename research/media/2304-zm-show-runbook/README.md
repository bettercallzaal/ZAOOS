---
topic: media
type: guide
status: research-complete
last-validated: 2026-08-17
superseded-by:
related-docs: 2153, 2181, 2269
original-query: "ZM show runbook adoption - the show ledger lives at ~/.zao/drafts (ZM runbook draft, M-F 5pm cadence). Turn it into a durable doc in ZAOOS research/ and a repeatable per-day prep checklist. NOTE: today's show 11 with RJ (Harmony Hubs) - promo post is HELD until RJ confirms; do NOT draft-send anything, prep-only."
tier: STANDARD
---

# 2304 - The ZM show runbook, and the per-day prep that makes 5pm automatic

> **Goal:** Make the M-F 5pm show survivable without heroics: the runbook as a durable doc, a prep checklist per weekday, and today's show-11 sheet - prep only, promo HELD.

## What ZM is

Zaal's M-F **5pm EST** stream, after work - designated THE main distribution surface (Zaal, 2026-08-16). Every other content system feeds it: the newsletter is the script, the board is the rundown, clips from the show become next-day socials. Doc 2153 holds the aggregation architecture; this doc holds the *operating* cadence.

Source of record: `~/.zao/drafts/2026-08-16-zm-stream-runbook.md`, adopted here verbatim-in-substance. The drafts file stays as scratch; this doc is durable.

## The week

| Day | Theme | Core segment |
|---|---|---|
| Mon | Week ahead | What's shipping this week across ZAO - the board, the dates, the plays |
| Tue | Interview | A guest - builders, artists, partners. Booked a week out |
| Wed | Farcaster news | The week on Farcaster + a GM Farcaster clip (**credit them, always**) |
| Thu | Build in public | Live building - the repo, Audos, Empire, whatever is real that day |
| Fri | Recap + wins | The week closed out loud - wins named, people credited, next week teased |

## Every show, same skeleton (~45-60 min)

1. **COLD OPEN** (pre-live): top song on repeat, newsletter up on screen
2. Come in talking the newsletter - today's issue IS the script
3. Today's events + this week - the board's due-dates ARE the rundown
4. Day-theme block (table above)
5. Standing ticks, rotate as fits: Zoostr/token talk when there is news; Fractal hygiene tick; content study ("look at Ari at Home")
6. **CLOSE**: one ask (join channel / RSVP / back a Spark), tomorrow's tease

Streaming: **Restream** to everything (the workshop default). 5pm sharp - the slot IS the brand.

## The per-day prep checklist

Same five steps every day, then the day block. Total prep target: **30 minutes, at 4pm**.

**Every day (the invariant five):**

- [ ] Newsletter issue for today exists and is open on screen (it is the script - if it does not exist, that is the 4pm emergency, nothing else is)
- [ ] Board pass: today's due items + this week's dates copied into the rundown (segment 3 reads straight off it)
- [ ] Restream targets green - one test frame before 4:45
- [ ] Cold-open song picked; newsletter tab + board tab staged
- [ ] The CLOSE decided BEFORE going live: today's one ask, tomorrow's tease. An improvised ask is a forgotten ask

**Mon - week ahead:** pull the week's ship-list from the board; name the plays and dates out loud; tease Tuesday's guest by name only if confirmed.

**Tue - interview:** guest confirmed in writing by Monday noon or the fallback runs (newsletter deep-dive); intro card: who they are, what they built, ONE question to open; promo post goes out ONLY after guest confirmation - never announce an unconfirmed guest.

**Wed - Farcaster news:** three stories max; grab the GM Farcaster clip and write the credit line INTO the rundown (`credit-attribution.md`: visible credit, not metadata); check the zabal/zaostock channels for anything live.

**Thu - build in public:** pick the ONE thing being built before 4pm, have the repo/tool open in a clean window; points stay private - talk shipping, not scores.

**Fri - recap:** wins list with NAMES attached (credit compounds); Friday's recap doubles as Monday newsletter fodder - capture it while talking; weekend/next-week tease.

**After every show (feeds OUT):**

- [ ] Flag 2-3 clip moments for ohnahji (standing pattern) - timestamped, not "somewhere in the middle"
- [ ] One cast per segment via the zabal/zaostock channels - drafted from the rundown, Zaal sends
- [ ] Friday only: recap notes into the Monday newsletter draft

## Show 11 - today (2026-08-17), prep sheet

**Status: promo HELD until RJ confirms. Nothing here is drafted for sending. Prep only.**

- Guest: RJ (Harmony Hubs). **Schedule note:** today is a Monday; the runbook's interview slot is Tuesday and Monday is week-ahead. Either show 11 runs as Monday-week-ahead *with* a guest segment, or the themes shift a day this week. **Zaal's call, flagged not resolved** - the prep below covers both.
- Week-ahead block (runs regardless): play-in week frame (through Aug 23), the dates-ask going out, Zalcastr tease (launch is Wednesday, per the draft - launch it LIVE on stream).
- If RJ confirms: intro card - Harmony Hubs, the Ignite Radio family, CPM Collabs is the genuinely interesting thing they are building (doc 2269's teardown found it the closest thing to how ZAO thinks about artist splits - that is the warm opener).
- If RJ does not confirm by 4pm: fallback per the runbook - newsletter deep-dive; the week-ahead block simply runs longer.

**Sensitivity flag, for Zaal's eyes before going live - not for the show:** the Ignite/Harmony Hub **founder share is still unsent**, and it has been sitting public in this repo since 2026-08-13 (doc 2263 thread; it names their tip-button bug, their shipped API key, and their seeded-verified-profiles issue). If RJ is on the show today, there is a real chance their team has read it, or will after seeing the stream. **Send-or-acknowledge before airtime is strongly recommended** - being asked about it live, unprepared, is the bad version of that conversation. The send itself stays Zaal-gated as always.

## Automation targets (already tasked elsewhere - do not rebuild)

Per the draft, these feed the show and are owned by other lanes: newsletter daily prep + overnight scheduling (the script exists at 5pm), the socials pipeline (clips -> next-day IG/LinkedIn drafts), board due-dates -> segment 3. This doc's checklist assumes they deliver; it does not duplicate them.

## Findings

1. The runbook was one 47-line draft away from being durable - this was adoption, not invention.
2. The invariant-five prep is deliberately newsletter-first: if the script exists, every other miss is recoverable on air.
3. The show-11 schedule conflict (Monday guest vs Tuesday interview slot) is real and flagged, not resolved.
4. The RJ booking intersects the unsent-but-public Ignite founder share - surfaced to Zaal as a pre-air decision.

## Also See

- [Doc 2153](../2153-zm-zao-media-aggregation-system/) - the ZM aggregation architecture this cadence runs on
- [Doc 2181](../2181-zabal-gamez-guest-stream-recaps/) - guest-stream recap pattern
- [Doc 2269](../../music/2269-ignite-radio-teardown/) - the Harmony Hubs/Ignite context behind today's guest

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide show 11's shape (week-ahead with guest segment, or theme-shift) and confirm RJ | @Zaal | Decision | 2026-08-17 4pm |
| Send or consciously hold the Ignite founder share BEFORE airtime if RJ is on | @Zaal | Gated send | 2026-08-17 4pm |
| Book Tuesday's guest or invoke the fallback | @Zaal | Decision | 2026-08-17 noon |
| Adopt this doc as the show's prep source; retire the drafts file to scratch | @Zaal | Merge | 2026-08-18 |

## Sources

- `~/.zao/drafts/2026-08-16-zm-stream-runbook.md` - **[FULL]** read from disk, 47 lines, adopted in substance.
- `research/media/2153-zm-zao-media-aggregation-system/` - **[FULL]** frontmatter + architecture sections read for the feeds-in/feeds-out boundary.
- Doc 2269 + the founder-share thread (2026-08-13 session) - **[FULL]** this lane's own verified work; the sensitivity flag derives from it.
- The zoeee lane's dispatch of 2026-08-17 - **[FULL]** the tasking message, including the HOLD instruction, which this doc preserves.

## The Tuesday night-of runbook (added 2026-08-20, card 75ed8f1d)

Tuesday is interview day - the highest-variance show of the week, so it gets
the only minute-by-minute runbook. Everything here derives from the invariant
five above plus the Tue prep rules; nothing new is invented. Companion views:
the show playbook + guest playbook live at
`~/zao-vault/notes/stream-guest-playbook.md` - same facts, different reader.

| T | Action |
|---|---|
| Mon 12:00 | Guest confirmed IN WRITING or the fallback (newsletter deep-dive) is locked now, not Tuesday |
| Mon PM | Promo post goes out ONLY if confirmed. Never announce an unconfirmed guest |
| Tue 4:00 | The invariant five (newsletter up, board pass, Restream targets, cold-open song, the CLOSE decided). Intro card written: who they are, what they built, ONE opening question |
| Tue 4:40 | PROPOSED DEFAULT (Zaal confirms): guest joins the call for tech check - audio, camera, screen-share if they demo. No call time is recorded anywhere yet; this fills the gap flagged in the playbook |
| Tue 4:45 | Restream test frame out. Guest briefed on shape: newsletter cold open, they enter after segment 3, ~20-30 min conversation, they stay for the CLOSE if they want |
| 5:00 | Live. Cold open + newsletter as always - the guest waits; the skeleton does not bend |
| ~5:15 | Guest enters (day-theme block). Open with the ONE question from the intro card |
| ~5:45 | Wind toward the CLOSE: guest names where to find them + their one ask; Zaal delivers the show's one ask + tomorrow's tease (Wed = Farcaster news) |
| Post | 2-3 timestamped clip moments flagged; VISIBLE credit line for the guest in every clip/cast (credit-attribution.md); same-day stakeholder recap reply TO the guest (playbook Pattern 2) |

Failure modes, pre-decided: guest no-show at 4:50 = run the fallback without
drama, never say the missing guest's name on air; tech fails mid-show = drop to
audio-only, keep talking; guest goes long = the CLOSE still happens, cut the
standing ticks not the ask.

## Also See (addendum)

- `~/zao-vault/notes/stream-guest-playbook.md` - the show playbook (how ZM works
  beyond the night) + the guest playbook (being a great guest, both directions),
  extended 2026-08-20 from the same grounding. Cards 8a2142a6 + 3dece757.
