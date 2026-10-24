---
topic: community
type: guide
status: research-complete
last-validated: 2026-10-23
superseded-by:
related-docs: "community/2705-zao-mentors-teach-to-stay (open PR #4149, not on main), community/758e-mentor-handbook-patterns, zabal/1543-zabal-s2-mentor-roster, events/654-zabal-games-empire-v3-yerbearzerker-meeting"
original-query: "write a STANDARD /zao-research draft of a ZAO Mentors design doc (Zaal's idea). Build on the prior work first: doc 758e, doc 1543, the archived zmentor repo, and doc 2705 (mentor pilot; Jordan resolved; 7 mentors, not 8). Run the searched: line before starting. Real fetches only, sources marked FULL/PARTIAL. ZAOOS hold rule: push the branch, record it, and don't open the PR. Nothing outbound. (seat refill relayed by messenger-69, 2026-10-23)"
tier: STANDARD
---

# 2711 - ZAO Mentors: how the circle runs

> **Goal:** Doc 2705 decides what ZAO Mentors is: a circle you stay in by teaching the team one hour a month, published in ZAO channels, with a one-month pilot. This doc designs how it runs: who does which job, the lesson template, where a lesson goes after it is taught, the ledger and its month-end routine, the one-page handbook, and the invite list. It builds nothing and asks no one.

This doc does not repeat 2705's decisions on membership, Respect, ZOL credits or rewards. It assumes them. Doc 2705 is in open PR #4149 and not yet on main, so it is cited by path.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **USE a rotating steward, so Zaal does not run every hour.** One mentor each month is steward: books the slot, nudges once, ticks the ledger. Zaal is steward for the pilot month only. | In June 2026 ZAO ran 31 workshops, and Zaal is the `host` on all 31 entries in the zao-media archive. Three outside sources name the same failure: an earlier series had "wide support, but it lacked a champion" and "went nowhere" (SourceCred forum); the organiser "ended up giving about 50% of the talks myself" (HN); "most knowledge sharing series like these fizzle out because the owner can't be assed" (r/ExperiencedDevs). A brown-bag guide gives the fix: "Rotate Ownership: Don't let one person be responsible for organizing everything." |
| 2 | **USE one fixed monthly slot, plus a recorded option.** One live "Mentor Hour" a month at a fixed time. A mentor who cannot make it records instead. The slot avoids the Monday 18:00 ET and Tuesday 12:00 ET fractal sessions. | Consistency is the habit ("Consistency is key. Establish a regular schedule": the Engineering Manager brown-bag guide). The fractal times come from Zaal's calendar (ZAO FRACTAL #121, 26 and 27 Oct 2026). A recorded path keeps 2705's "taught live or recorded" rule. |
| 3 | **USE a one-page lesson template.** It has title, who it is for, one outcome, what to have ready, the artifact link, and a credit line with name, handle and link. | 758e's first decision is a one-page handbook ("Techstars Mentor Manifesto = 1 page"). A template lowers the speaker's load: "Even something as simple as a template slide deck can really knock down the cognitive load on the speaker" (SourceCred forum). |
| 4 | **USE the zao-media archive as the lesson library. No new store.** Every taught hour gets one `content/*.json` entry with `show: "ZAO Mentors"`, `class: "produced"`, and the mentor in `guest` with the handle written inline, the way June did it ("Cassie (Cassandra Heart, @cassie)"). There is no `guestHandle` field, and none is needed. | The archive already holds 604 entries, 31 of them June workshops (show "ZABAL Gamez Workshops"), in this exact shape (`bettercallzaal/zao-media`, `content/`). A recording that is indexed is what makes the hour useful later: "We record the sessions and have them all indexed... New hires find them incredibly helpful" (r/ExperiencedDevs). |
| 5 | **The invite list is the 7 confirmed mentors in 758e, not 8.** Jordan Oram and yerbearserker are one person: Farcaster @yerbearserker is fid 409857 with bio "Jordan Oram - Empire Builder Co-founder" (re-read 2026-10-23 via api.farcaster.xyz), and "yerbearzerker" with a z has no FID. Membership stays open to anyone who teaches an hour. | The quidli follow-up branch `ws/research-2705-followup-jordan` records the resolution, and so does the year-end-opportunities lane status, 2026-10-23 11:27 EDT. The June archive shows the teaching pool is wider than the list: 31 sessions in 30 days. |
| 6 | **Write the mentor's non-duties into the handbook.** Mentors do not do the learner's work, are not on call, and do not find anyone a job. | CNCF's mentor guide has an explicit "Non-duties of Mentors" list (Apache-2.0 repo, content CC-BY-4.0). A one-hour-a-month role needs its limits stated, or it grows. |
| 7 | **SKIP a points table for learners.** | The archived zmentor repo scored mentees on a 24-task table from 100 to 1000 points. ZAO already ranks contribution through the Respect Game (2705 decision 4). A second score would compete with it. |

## Roles

| Role | Who | The whole job |
|---|---|---|
| Mentor | Anyone who teaches an hour in the month | Teach one hour, live in the slot or recorded; fill the template; post the link |
| Steward | One mentor a month, rotating (Zaal in the pilot) | Book the slot, nudge each mentor once, tick the ledger, hand the role on at month end |
| Archivist | The zao-media lane, or the steward | Add one zao-media entry per lesson |
| Learner | Any ZAO member | Attend or watch; bring the lesson to the Respect Game if it helped |

The steward's job is kept small on purpose. The zmentor playbook describes a "weekly 5-minute routine" and says to keep co-admins "so it is not all on one person". The steward here does the same at a monthly scale.

## The lesson template (one page)

| Field | Example |
|---|---|
| Title | A real past title: "ZABAL Gamez Workshop 1 - yerbearserker on Empire Builder" |
| Who it is for | One sentence naming the ZAO members it helps |
| One outcome | The one thing an attendee can do afterwards |
| Have ready | Accounts or tools to have open before the hour |
| Format | Live in the Mentor Hour, or a recording |
| Artifact | YouTube or Farcaster link, filled in after teaching |
| Credit line | Name, handle and link, e.g. "Jordan Oram (@yerbearserker)" |

Only the title and credit line are real: they come from a session yerbearserker already taught (zao-media `2026-06-01-yerbearserker-empire-builder-workshop.json`). The other rows describe what goes in each field. Nothing here is a booking.

## Where a lesson goes after it is taught

1. **Recording.** The live hour is recorded, the same way the June workshops were (28 of the 31 June entries carry a `youtubeId`).
2. **/zao post.** The mentor or steward posts the link in /zao, the default channel in `community.config.ts` (lines 36-38: `channels: ['zao', 'zabal', 'cocconcertz', 'wavewarz']`, `defaultChannel: 'zao'`).
3. **zao-media entry.** One JSON file in `bettercallzaal/zao-media/content/` with the fields the archive already uses: `slug`, `class`, `title`, `date`, `show`, `host`, `hostHandle`, `guest`, `brands`, `youtubeId`, `links`, `summary`, `chapters`. Set `show` to `ZAO Mentors` so the series can be filtered; `build.mjs` reads `.show`, so the new value needs no code change. Put the mentor's handle inline in `guest`, as the June entries do, and the mentor's profile link in `links` as a `{label, url}` pair. `build.mjs` on origin/main has no `guestHandle` field (0 references; checked 2026-10-24 and confirmed by the zao-media lane).
4. **Ledger row.** The steward ticks one row (next section).
5. **Respect Game.** That week, the mentor brings the lesson as a contribution (2705 decision 4).
6. **ZAOlingo, later.** A lesson that fits a track can become a ZAOlingo source (2705 decision 6). `bettercallzaal/zaolingo` is a private Next.js repo, last pushed 2026-07-13. Wiring lessons into it is out of scope here.

## The ledger and the month-end routine

One vault note for the pilot, `notes/zao-mentors-ledger.md`, one row per mentor per month:

| Month | Mentor (handle) | Topic | Link | Minutes | Steward tick | State |
|---|---|---|---|---|---|---|

State rules, from 2705: `taught` with an hour or more that month; `paused` after the first missed month; `alumni` after two missed months in a row; and an alumnus is back to `taught` by teaching again.

The steward's routine, about 10 minutes, on the last day of the month:

1. Open each link in the month's rows. A row counts when the link opens to roughly an hour of teaching.
2. Set each mentor's state.
3. Check that each lesson has its zao-media entry.
4. Name next month's steward, rotating in ledger order and skipping anyone paused.

## The one-page handbook

The sections follow 758e's outline, with compensation removed: there is no cash or token (2705 decision 7).

1. **What this is.** One hour of teaching a month keeps you in. Recorded, credited, kept in the ZAO library.
2. **Your hour.** The template above; live in the slot or recorded.
3. **What you get.** The 2705 set: ZAOOS doc credit, a post from a ZAO account, alumni access, and a Respect Game contribution.
4. **What you do not have to do** (from CNCF's non-duties). You do not do anyone's work for them, you are not on call between lessons, and you do not find anyone a job.
5. **How we behave.** 758e decision 6: no-asshole rule, confidentiality, no poaching.
6. **Who to ask.** This month's steward.

## The invite list (7 people, from 758e)

| Mentor | Teaching record in the zao-media archive (filename match only) |
|---|---|
| Jordan Oram (@yerbearserker) | 3 files, including two June workshops on Empire Builder (2026-06-01) |
| kmac.eth | none by filename; 2705 cites a booked zlank session with Zaal (doc 654) |
| CannonJones | 4 files, all WaveWarZ battles or interviews, not lessons |
| Shriyash Soni | none by filename |
| Tyler Stambaugh | none by filename |
| Arthur | none by filename |
| deez | none by filename |

The search covered the 604 filenames in `zao-media/content/`. It did not read each entry's `guest` field, so a lesson filed under another name would be missed. The pilot runs with two mentors, yerbearserker and kmac.eth, until Zaal names a third. That is the away-mode default recorded in the vault (`decisions/grill-2026-10-23-grill.md`, item 16, MEN, 2026-10-23 16:54 EDT), and Zaal can override it at any time. The year-end-opportunities lane put options for the third mentor to Zaal on 2026-10-23, with Shriyash Soni recommended. With two mentors the steward rotation alternates between them; Zaal is steward for the pilot month either way.

## What other programs show

| Source | What happened | Design answer |
|---|---|---|
| SourceCred forum, "Lunch & learn" (2021-02) | Proposed with Cred as the teacher's reward. An earlier "Brown Bag Lunches" attempt "lacked a champion" and "went nowhere". The 9-post thread ends on 2021-02-09 without announcing a first session. | Decision 1: a named steward every month |
| HN, "Tech Shorts" comment (2020-09) | About 70% of a 50-person team attended, but the organiser gave "about 50% of the talks myself" because few would present | Decision 1, and membership requires teaching, so presenting is the price of the seat |
| r/ExperiencedDevs (2024-09, 51 points) | One monthly series reached "about 30" recorded, indexed talks; its owner warns they fizzle without an owner. Others push back: "no one wants to do them" when management pushes | Decision 4 (index everything); the circle is opt-in, not a mandate |
| HN, "Ask HN: How do you share knowledge" (2021-07, 9 comments) | Study groups, Slack "drops" and open talk schedules tried; one commenter calls company-run events "BS" | Peer-run, not top-down; the steward is a peer |
| CNCF mentoring repo (3,126 stars, pushed 2026-10-19) | Mentors spend 3-6 hours a week per mentee in a full-time program, with written expectations and non-duties | Decision 6; ZAO asks for far less time, 1 hour a month, so the non-duties matter more |
| zmentor (Zaal's archived repo, 2026-06) | A weekly prompt bank, a 5-minute steward routine, co-admins, and a mentee points table | Steward routine reused; points table skipped (decision 7) |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide the pilot month and the fixed Mentor Hour slot; done when both are written in the 2705 pilot table | Zaal | decision | 2026-10-30 |
| Optional: name a third pilot mentor from the 7; until then the pilot runs with two (grill 2026-10-23 item 16, MEN); done when named in a grill ruling, or the pilot starts with two | Zaal | decision | 2026-10-30 |
| Ask the two pilot mentors, yerbearserker and kmac.eth (and a third if named); done when each has said yes or no | Zaal | outbound | 2026-11-06 |
| After Zaal's go on the pilot (row 1), create `notes/zao-mentors-ledger.md` with the table above; done when merged on vault main | bandzbuilds lane | vault note | 2026-10-31, or wontfix if no go |
| Fill the one-page handbook from the sections above; done when a vault note exists for Zaal to read | bandzbuilds lane | vault note | 2026-10-31 |
| After Zaal's go, file each lesson's entry as a zao-media content PR (show "ZAO Mentors", handle inline in `guest`); done when the first lesson's entry is merged in bettercallzaal/zao-media. Field fit already agreed with zao-media-stream on 2026-10-24 | bandzbuilds lane | PR | first lesson date, or wontfix if no go |
| Merge 2705 follow-up `ws/research-2705-followup-jordan` after #4149 merges; done when "7 mentors" is on main | quidli lane | PR | 2026-11-06 |

## Also See

- `research/community/2705-zao-mentors-teach-to-stay/` (open PR #4149): the decision doc this designs
- [758e - Mentor handbook patterns](../758e-mentor-handbook-patterns/)
- [1543 - ZABAL S2 mentor roster](../../zabal/1543-zabal-s2-mentor-roster/)
- [654 - ZABAL Gamez Empire v3 meeting](../../events/654-zabal-games-empire-v3-yerbearzerker-meeting/)

## Sources

- [SourceCred forum, "Lunch & learn", 2021-02-06 to 2021-02-09](https://discourse.sourcecred.io/t/lunch-learn/1061) [FULL - Discourse JSON API, all 9 posts]
- [Hacker News, "Tech Shorts" comment by mtippett, 2020-09-08](https://news.ycombinator.com/item?id=24410222) [FULL - HN Algolia items API]
- [Hacker News, "Ask HN: How do you share knowledge in your company?", 2021-07-04](https://news.ycombinator.com/item?id=27730349) [FULL - HN Algolia items API, 9 comments]
- [r/ExperiencedDevs, "Do you do knowledge sharing sessions in your company?", 2024-09-05](https://www.reddit.com/r/ExperiencedDevs/comments/1fa0jb1/do_you_do_knowledge_sharing_sessions_in_your/) [PARTIAL - 24 of 45 comments via exa web_fetch; zao-fetch-reddit.sh has no OAuth credentials; the browser fallback was skipped under the 2026-10-23 load hold]
- [CNCF mentoring, mentors guide](https://github.com/cncf/mentoring/blob/main/mentors/README.md) [FULL - gh api contents; LICENSE read: Apache-2.0, LICENSE-CONTENT read: CC-BY-4.0]
- [Engineering Manager, "Brown Bag Sessions"](https://engineeringmanager.info/docs/Knowledge%20Management/Knowledge%20Sharing/Brown-Bag-Sessions) [FULL - exa web_fetch; also the source of "Rotate Ownership: Don't let one person be responsible for organizing everything"]
- `bettercallzaal/zao-media` `content/` [FULL - gh api: 604 filenames, all 31 workshop entries read]
- `bettercallzaal/zmentor` (private, archived) [FULL - README, pages, `meetings/group-playbook.md`, `meetings/points-system.md`; private names left out]
- ZAOOS `community.config.ts`, docs 758e, 1543 and 654 [FULL - `git show origin/main` at e86864932]; doc 2705 [FULL - PR #4149 branch]
- Zaal's Google Calendar, "ZAO FRACTAL #121" events of 26 and 27 Oct 2026 [FULL - Calendar search]
