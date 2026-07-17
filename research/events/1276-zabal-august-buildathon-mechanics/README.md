---
topic: events/zabal-games
type: decision-brief
status: needs-zaal-approval
created: 2026-07-17
board-task: 815b8e69
related-docs: 1255, 1271, 1264, 701
owner: Zaal (to confirm mechanics before Aug 1)
deadline: 2026-07-28 (7 days before August opens)
---

# 1276 -- ZABAL Games August Build-a-Thon: Complete Mechanics Brief

> **How to use:** July closes July 31. August is the FINAL month of ZABAL Games 2026 — the code build-a-thon and product finals. This doc proposes the mechanics Zaal needs to lock by July 28 so builders can plan. Three decisions needed: (1) mentor metrics, (2) post criteria, (3) board setup.

---

## Context: Where We Are in the ZABAL Games Arc

| Month | Focus | Status |
|-------|-------|--------|
| June | Onboarding + first projects | DONE |
| July | Open build + knowledge game | Closes Jul 31 |
| August | Code build-a-thon + Finals | FINAL MONTH — needs mechanics locked by Jul 28 |

The August ZABAL Games is the finale. The WaveWarZ-Base Finals (three battle tracks per doc 1255) and QV ballot (PR #551) are the closing ceremonies. The build-a-thon itself is the runway INTO the finals.

---

## Decision 1: Mentor Metrics (What to Track Per Mentor Session)

**Context:** ZABAL mentors meet weekly with builders. Currently tracking attendance but not quality. The board task asks to "confirm mentor metrics."

**Recommendation:** Two-metric system.

| Metric | How to measure | Weight |
|--------|---------------|--------|
| Attendance rate | Sessions attended / sessions scheduled (per builder) | 50% |
| Builder progress signal | Did the builder ship something (PR/commit/demo) in the week following the session? | 50% |

**Why these two:** Attendance proves the mentor showed up. But "did the builder ship?" is the actual proof the session was useful — it's a leading indicator of finals readiness.

**Implementation:** The ZAOcowork board already has task rows per builder. The loop can add a weekly "mentor check-in" task template with these two fields as completion criteria.

**Zaal call:** Approve 50/50 or modify the weighting. Optional: add a third metric (qualitative builder rating, 1-5, collected via Telegram poll after each session).

---

## Decision 2: Post Criteria (What Counts as a Valid August Build Post)

**Context:** The board task asks to "confirm post criteria." In July, builders post reports to Bonfire via GitHub commits. August builds need a clearer "done" definition since the stakes are higher (finals eligibility).

**Recommendation:** Three-tier post criteria.

| Tier | Criteria | Unlocks |
|------|----------|---------|
| Entry | Public GitHub repo + `README.md` (project description, screenshots) + Telegram announcement in /zabal channel | Finals eligibility |
| Mid | Above + one live demo (Loom / YouTube / live stream) | Mentor feedback session + Bonfire report citation |
| Final | Above + a deployed product URL (Vercel / Railway / any live endpoint) | QV ballot inclusion + WaveWarZ Finals seeding |

**Why tiers:** Reduces "shipped something vs. didn't" arguments. A live URL is the clearest proof. Builders know exactly what they need to make it to the QV ballot.

**WaveWarZ Finale seeding (from doc 1255):** The Finals seeding for the three WaveWarZ battle tracks (Track A builder showcase, Track B artist+builder collab, Track C leaderboard sprint) should use the "Final" tier as the eligibility gate. Builders who hit "Final" criteria get seeded into the bracket.

**Zaal call:** Approve the three-tier structure, or simplify to two tiers (Entry / Final). Also confirm: does a "demo video" need to be live (Loom/YT) or can a GIF in the README count?

---

## Decision 3: August Board Setup (Supabase ZAOcowork Tasks)

**What needs to exist in the board before Aug 1:**
1. One task row per builder per week (4 Mondays in August: Aug 3, 10, 17, 24)
2. A "Finals deadline" task for Aug 31 (all "Final" criteria must be met by EOD)
3. A "QV ballot" task linking to PR #551 (zabalgames ballot — to be used for the finals vote)
4. A "WaveWarZ Finals" task linking to the three-track brief (doc 1255)

**Who creates them:** The loop can create these tasks via the Supabase REST API if Zaal approves the structure above. Requires: list of confirmed August builders (who is in the program?) and their Telegram handles.

**Zaal action:** Provide the August builder roster (names + Telegram handles + which tier they're currently at). The loop will create the board rows within 1 hour of receiving the list.

**Alternative (no builder list yet):** Create one generic "ZABAL Games August build week" task per Monday as a placeholder. Fill in builder-specific tasks when the roster is confirmed.

---

## August Timeline

| Date | Milestone | Who |
|------|-----------|-----|
| Jul 28 | Lock mechanics (this doc approved) | Zaal |
| Jul 31 | July knowledge game closes (citation tally, knowledge game winners) | Loop |
| Aug 1 | ZABAL August opens, builders receive mechanics brief | Zaal/Iman post |
| Aug 3, 10, 17, 24 | Mentor check-in weeks | Mentors + builders |
| Aug 24 | Last mentor session; builders enter finals sprint | |
| Aug 28 | All projects must hit "Entry" criteria to be eligble for QV ballot | Builders |
| Aug 31 | Finals criteria deadline; QV ballot window opens; WaveWarZ Finals | Builders + Zaal |
| Sep ~7 | QV ballot closes, Finals results announced | Zaal + Iman |

---

## Announcement Cast Draft (for Zaal to post in /zabal channel Aug 1)

**Farcaster (320 byte limit):**
> ZM. August ZABAL Games is live — the code finale month.
>
> Three tiers to ship: Entry (README + repo), Mid (demo video), Final (live URL = QV ballot + Finals eligibility).
>
> Check-ins every Monday. Finals Aug 31. Let's build.

**Telegram (longer):**
> ZM builders. July closes tonight — huge respect for everyone who posted reports and shipped.
>
> August is the final month. Here's how it works:
>
> **Entry:** Public repo + README + announce in this channel
> **Mid:** Demo video (Loom/YT/stream)
> **Final:** Live deployed URL
>
> Finals criteria due Aug 31. QV ballot + WaveWarZ Finals seed for everyone who hits Final tier.
>
> Weekly mentor check-ins every Monday. Build in public, ship by Aug 31.
>
> Full mechanics: [link to this doc once published]

---

## Loop Action Checklist (once Zaal approves)

- [ ] Zaal confirms builder roster for August (names + handles)
- [ ] Loop creates board tasks (weekly check-ins + Finals deadline) via Supabase REST
- [ ] Loop drafts announcement cast + Telegram post for Zaal to post Aug 1
- [ ] Loop opens PR to zabalgames repo: update `docs/august-buildathon-mechanics.md` with locked criteria
- [ ] Zaal (or Iman) posts announcement in /zabal Farcaster channel + ZABAL Telegram
