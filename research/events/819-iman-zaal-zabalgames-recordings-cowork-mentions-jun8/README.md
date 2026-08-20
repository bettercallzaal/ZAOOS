---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-06-08
related-docs: "778, 650, 818"
original-query: "/meeting imanxzaalcraig - ZABAL Games recordings pages + cowork board mentions"
tier: STANDARD
---

# 819 - Iman x Zaal: ZABAL Games recordings pages + cowork board mentions

> **Goal:** Walk the cowork board's mentions/activity surface with Iman, and scope the ZABAL Games recordings-page improvements he is about to build.

- **Date:** 2026-06-08
- **Duration:** ~13 min
- **Attendees:** Zaal, Iman ([[project_iman_role]])
- **Platform:** Discord/Craig recording
- **Project:** ZAO Devz / general

## What happened

Two threads:

**1. Cowork board - mentions + activity.** Iman asked about the small red "mentioned" badge on the menu. They traced it to the **Activity** tab / "My mentions" view (not the task list). Agreed the @mention signal should also surface on the **My Work / Activity** page, not just the menu badge. Iman noticed Jose's posts were not showing in his activity feed - flagged but not resolved on the call.

**2. ZABAL Games recordings pages.** Iman is building out the recordings pages (recordings-1/2/3, fireside-1; about to upload recordings-4 with Ohnahji). The direction Zaal set: **keep people on the ZABAL Games platform** rather than bouncing them to YouTube/Luma. Concretely - embed each recording as an in-page video viewer and remove the "watch on YouTube" button; add workshop-to-workshop navigation; make the main recordings page a fast jump-board of buttons. Fireside = a conversation (spaces-style), not a workshop; usually audio, but today's will be video.

## Decisions

| # | Decision | Owner | Confidence |
|---|----------|-------|-----------|
| 1 | Embed recordings as an in-page viewer; remove the "watch on YouTube" button - keep people on the ZABAL Games platform | Iman | high |
| 2 | Add "next workshop / previous workshop" navigation at the top of all ZABAL Games pages | Iman | high |
| 3 | Main recordings page: a row of jump-to buttons at the top for each recording (recordings-1/2/3, fireside-1, ...) | Iman | high |
| 4 | Surface @mentions on the "My Work" / Activity page, not just the menu badge | Iman | medium |

## Actions

| Title | Owner | Category | Confidence |
|-------|-------|----------|-----------|
| Embed recordings as in-page viewer + remove "watch on YouTube" across the recordings pages | Iman | Site/Tech | high |
| Add next/previous-workshop nav at the top of all ZABAL Games pages | Iman | Site/Tech | high |
| Rebuild the main recordings page with a top row of jump-to buttons | Iman | Site/Tech | high |
| Upload the Ohnahji recording (recordings-4) | Iman | Content | high |
| Add @mention surfacing to the My Work / Activity page | Iman | Site/Tech | medium |
| Send Zaal a screenshot/spec of the desired back-button nav so he can build it | Iman | Site/Tech | medium |

(A 7th item - adding "good clip spots" to the recordings page - was raised as optional and is intentionally left out of the tracker.)

## Key quotes

- Zaal: "we should just have our own stuff on our own platform pretty much as much as we can."
- Zaal: "remove the watch on YouTube button, focus on bringing people to these websites under the recordings page."
- Iman: "Is there a way we could get our recordings embedded onto our own site without having them to open the other sites... could it just be a viewer kind of thing here."
- Zaal: "the very top should just be a bunch of buttons where you can click on different videos and go right into the recordings."

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship recordings-page v2 (in-page viewer, no YouTube button, jump-board, prev/next nav) | Iman | Build | This week |
| Upload Ohnahji recording (recordings-4) | Iman | Content | This week |
| Send Zaal the back-button screenshot/spec | Iman | Handoff | Next |
| Surface @mentions on My Work/Activity + investigate why Jose's posts are missing from activity | Iman | Build | Next |

## Also See

- [Doc 778](../778-zabal-games-magnetic-build/) - ZABAL Games build (Magnetic, judging, demo)
- [Doc 818](../818-logesh-zaal-xspace-audio-extension-jun8/) - prior meeting this session (Logesh/SongJam audio extension)

## Transcript

Full transcript: [transcript.md](transcript.md)

## Re-verify pass 2026-08-20 (full 193-line transcript re-read)

All four quoted blocks verified verbatim at their cited lines; the metadata,
attendees and named page slugs (recordings-1/2/3, fireside-1, recordings-4) all
trace to source.

### A spelling flag that was raised and rejected

The checking pass flagged "Ohnahji" in this doc as an error because the
transcript says "Onaji". **The doc is right and the transcript is the artifact.**
Ohnahji is the canonical spelling: 390 occurrences across research and 11 in
project memory, against 26 and 1 for the phonetic form. A transcript is
authoritative for WHAT WAS SAID, never for how a name is SPELLED - the same
correction already applied in doc 994, where "divvy fly" is the transcript's
rendering of diviflyy. Recorded here so the doc is not "fixed" backwards later.

### Follow-through block

Everything below was owed by Iman with "this week" attached, meaning about
2026-06-14. Nothing records an outcome, 73 days on.

| Who owes | What | To whom | By when | Outcome recorded |
|---|---|---|---|---|
| Iman | Embed recordings in-page, remove the watch-on-YouTube button | Zaal / the site | ~2026-06-14 | none |
| Iman | Next/previous-workshop nav across ZABAL Games pages | Zaal / the site | ~2026-06-14 | none |
| Iman | Rebuild the recordings page with jump-to buttons | Zaal / the site | ~2026-06-14 | none |
| Iman | Upload the Ohnahji recording as recordings-4 | Zaal / the site | ~2026-06-14 | none |
| Iman | A screenshot/spec of the back-button nav | Zaal | "next" | none |
| Iman | Surface @mentions on My Work / Activity, and find why Jose's posts are missing | Zaal | "next" | none |
| Zaal | Build the back-button nav | Iman | after the spec | BLOCKED on the row above |

Iman is a teammate rather than an outside party, so this is an internal thread
rather than a relationship debt. It is still the same shape as the rest of the
sweep: undated or loosely-dated promises with no closing note.

### Worth knowing for the live recordings work

The intent recorded here is unambiguous and still current: "we should just have
our own stuff on our own platform pretty much as much as we can" (175) and
"remove the watch on YouTube button, focus on bringing people to these websites
under the recordings page" (180-181). Any recovery of the missing ZABAL sessions
should land on the site's own recordings page, not only on YouTube.

One thing this call flags but does not solve: Jose's posts were missing from the
activity feed as of 2026-06-08, and nothing here resolves it.

### Attribution caveat

The transcript is a single unlabeled block - the header says so - and speakers
are inferred from content. The inference reads correctly, but no line here is
explicitly attributed, so treat any "Iman said" as reconstruction rather than
label.
