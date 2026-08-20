---
topic: events
type: incident-postmortem
status: research-complete
last-validated: 2026-08-18
related-docs: "2310, 1045"
original-query: "/meeting craig-TXR8YyJV0xpB - meeting today with motomoto, include in our todo list organizing (reconstructed from slash command)"
tier: QUICK
---

# 2316 - Motomoto ZAOstock Virtual-Side Catch-up (2026-08-18)

> **Goal:** Recap of the Zaal x Iman x Aziz (Motomoto) call confirming Aziz as ZAOstock virtual-side team lead and the Baraza test plan.

## Meeting

| Field | Value |
|---|---|
| Date | 2026-08-18 |
| Duration | ~11 min |
| Attendees | Zaal, Iman (Afrikah), Aziz (Motomoto) |
| Platform | Discord/Craig (multitrack) |
| Project | ZAOstock (Oct 3 2026, Franklin St Parklet - [Doc 2310](../2310-zaostock-standup-aug17/) standup; insurance thread [Doc 1045](../../business/1045-zaostock-event-insurance-liability/)) |

## Decisions

| # | Decision | Owner | Confidence |
|---|---|---|---|
| 1 | Aziz (Motomoto) is the virtual-side TEAM LEAD for ZAOstock - supports Zaal, leads the virtual crew while Zaal is in-person | zaal | high |
| 2 | Baraza OBS-to-RTMP test happens this week (Zaal busy on the weekend) | zaal | high |
| 3 | Coordination surface: ZAO Devz telegram, dedicated "Motomoto todos" topic (created same day) | zaal | high |
| 4 | Stream rig: Zaal's desktop (no Mac mini); VPS or Pi as fallback | zaal | medium |
| 5 | Event-day virtual window: 12-6pm Eastern, team of 5-10, any 2-hour slot counts | zaal | high |

## Actions (written to the cowork board, source=meeting-capture, legacy_source=meeting:motomoto-20260818)

| Action | Owner | Due |
|---|---|---|
| Run Baraza OBS-to-RTMP test with Aziz | zaal | 2026-08-22 |
| Aziz sends plugin list + specs (Zaal's correction: Aziz sends specs) | Aziz (external) | 2026-08-19 |
| Recruit ZAOstock virtual team (5-10 people, 12-6pm ET slots) | zaal | - |
| Get LiDAR camera + scan venue for metaverse version | zaal | - |
| Ping general chat re today's fractal | iman | 2026-08-18 |
| Share Slack workspace/workflow ("reads from slack" idea) - parked as research seed | Aziz (external) | - |

## Key quotes

- "You guys are going to be two of our big supporting... support for the digital side of our virtual event" - Zaal (Iman + Thy Revolution/Motomoto)
- "So I think we can do a test this week" - Aziz
- "Any portion of that 12 Eastern to 6pm Eastern would be amazing... I'm not requesting everyone to be there the whole time" - Zaal
- "If you can send me the specs for your device, I can share with you some plugins that you will need to run the live stream" - Aziz

## Notes

- CRM finding: "Aziz" and "Motomoto" were two separate contacts rows for the same person (Craig track name azizmotomoto proves it). Both rows now carry merge-pending notes; real merge lands with the CRM completeness review card.
- Whisper hallucination loops on silent multitrack stretches; transcript flagged, loops are artifacts.
- The bounded-ask recruiting pattern from this call seeded the stream/guest playbook (zao-vault/notes/stream-guest-playbook.md).
- Stakeholder recap reply generated and copied for Zaal to paste to Aziz + Iman (new /meeting practice).

## Research seeds

- Slack-reader integration into ZOE's inbox pattern (Aziz's "reads from slack" idea) - evaluate only after Aziz shares his workspace.
- Baraza platform technical eval (OBS/RTMP ingest, what it needs from our side) - fires AFTER the first test; a recap is not the place to research it (scope honesty: this doc is a meeting recap, not a STANDARD research doc).

## ZAO stack context

- Actions landed in the unified cowork tracker `tasks` table (Supabase project etwvzrmlxeobinrlytza) with `legacy_source=meeting:motomoto-20260818` - same tracker the ZAOOS board UI reads.
- Contacts updated in the same project's `contacts` table (Aziz/Motomoto merge-pending).
- ZAOstock itself is mid-spinout from ZAOOS (see [Doc 2310](../2310-zaostock-standup-aug17/) standup); the virtual-side stream rig decision (desktop + VPS/Pi fallback) touches the same infra used by the ZAO stream stack.

Full transcript: [transcript.md](transcript.md) (in this doc's folder: `research/events/2316-motomoto-zaostock-virtual-catchup-aug18/transcript.md`)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Baraza test done and result noted on the board card | @Zaal | board card | 2026-08-22 |
| Paste stakeholder recap reply to Aziz + Iman | @Zaal | tap | 2026-08-18 |
| CRM merge Aziz/Motomoto rows (within completeness review) | @Zaal | board card | 2026-08-25 |

## Re-verify pass 2026-08-19 - REVERSED ACTION CORRECTED (was blocking the test)

Full transcript re-read. Everything else in this doc verified accurate
(team lead, test-this-week, 12-6pm window, 5-10 crew, desktop + VPS/Pi
fallback, TG coordination, LiDAR, fractal ping to Iman, Slack parked).

**The one error, and it was a deadlock.** This doc recorded the plugin/spec
exchange backwards. Transcript 05:23, AZIZ TO ZAAL:

> "If you can send me the specs for your device, I can share with you some
> plugins that you will need to run the live stream so that you can start
> installing them meanwhile."

Zaal: "just send it to me."

CORRECT ORDER: **Zaal sends the desktop specs FIRST; Aziz then sends the
plugin list.** The doc's action row ("Aziz sends plugin list + specs") had
both sides waiting on each other, which is why nothing moved between 8/18
and 8/19 with the test due 8/22. Board card 654b9aba corrected and raised
to P1 on 2026-08-19; a specs message is clipboarded for Zaal.

Independent of the exchange, the ZAO-side install list is already known
from the baraza-tv repo: OBS 28+, Advanced Scene Switcher plugin plus
obs/advss/baraza-advss-v2.json macros, the scenes/Baraza_Live.json
collection, Python 3.12 + requirements.txt for baraza-bridge.py, 64-bit
VLC for the playout scenes, OBS WebSocket on 4455.
