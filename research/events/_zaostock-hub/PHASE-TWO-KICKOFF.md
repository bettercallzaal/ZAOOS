# ZAOstock Phase Two — Kickoff Kit

> **Status:** Ready to run (week 1)
> **Plan of record:** [Doc 871 — Phase Two: The Execution Sprint to Oct 3](../871-zaostock-phase-two-execution-sprint/)
> **The math:** Oct 3 event · **Sep 3 artist cutoff** (the binding constraint) · counted from 2026-06-17 = 78 days to cutoff, 108 to event.
> **The lever:** team/accountability first. Nothing else in the sprint is reliable until the accountability spine exists.

This kit operationalizes doc 871's **Step 0**. It is the copy-paste team post, the owner-assignment board to fill in week 1, the week-1 checklist, and the ZAOstock-bot DM-only note. Source of truth for *why* is doc 871 — this doc is the *how/when*.

---

## 1. Team kickoff post (copy-paste)

> Post in the ZAOstock team channel. Tone: music first, community second, technology third. The ask is ownership, not attendance.

```
ZAOstock — Phase Two starts now 🎪

The build is ahead of us: the site, dashboard, and tooling are basically done.
What's NOT locked yet is the event itself — the lineup, the venue paperwork,
the sponsors, the day-of roles. Phase two is the execution sprint to close
that gap. 108 days to Oct 3. The artist cutoff is Sep 3 — 78 days — and that
one is hard.

The single thing that decides whether this lands is accountability. So we're
starting there. Five workstreams, and every one gets TWO names: a MAIN who
owns the outcome, and an UNDERSTUDY who can push them, cover if they go quiet,
and step in. No workstream rides on one person.

The five workstreams:
1. Lineup — confirmed artist grid locked before Sep 3 (this is the spine)
2. Venue + ops — signed Wallace Events agreement, run-of-show, after-party
3. Sponsors — turn the tracks into committed names + dollars
4. Volunteers + roles — every event-day role staffed two-deep
5. Site + media — domain cutover, brand fixes, media capture staffed

This week I'm asking each main + understudy to claim their workstream and
declare a commitment in the tracker — hours/week, or "I own this outcome by
date X." We run the weekly standup against that, with Sep 3 and Oct 3 on the
countdown.

Reply with the workstream you want to own or back up. Music first. Let's go.
```

---

## 2. Workstream owner board — FILL IN WEEK 1

Each workstream ships with a **main** and an **understudy**. From doc 871: workstreams 2–5 have **no named understudy**, and **Sponsors has no confirmed main** — that is the accountability hole to close this week.

| # | Workstream | Main | Understudy | The one deliverable | By when |
|---|-----------|------|-----------|---------------------|---------|
| 1 | **Lineup** | Dcoop | _TBD — Steve Peer?_ | Confirmed-only public artist grid, locked | **Sep 3** |
| 2 | **Venue + ops** | Candy / Zaal | _TBD_ | Signed Wallace Events agreement (stage + tent), run-of-show, Black Moon after-party | ~Aug |
| 3 | **Sponsors / money** | _TBD — Jay or Duh?_ | _TBD_ | Committed sponsor names + dollars vs the $5–25K budget | ~Aug |
| 4 | **Volunteers + roles** | Chikodi | _TBD_ | Every event-day role staffed two-deep; onboarded via `/apply` + commitment model | rolling |
| 5 | **Site + media** | Zaal | _TBD_ | Domain/Vercel cutover to `ZADEVZ/ZAOstock`, C1–C8 brand fixes (doc 853), media capture staffed (doc 433) | Next |

**Commitment model (doc 856):** each owner self-declares hours/week or an owned outcome+date, and it goes in the cowork tracker. The understudy can bother the main, report if they need help, and step in if the main goes quiet.

---

## 3. Week-1 checklist

- [ ] **Post the kickoff message** (section 1) in the ZAOstock team channel.
- [ ] **Assign all 5 main + understudy pairs** (section 2) — close the Sponsors-main and 4 understudy gaps. Each declares a commitment in the tracker.
- [ ] **Run the week-1 standup** against the tracker, Sep 3 + Oct 3 on the visible countdown (continue the existing Mon/Tue cadence; log a new file in `standups/`).
- [ ] **Sign the Wallace Events stage + tent agreement** — stop the handshake risk.
- [ ] **Lineup:** list confirmed vs TBA artists; set the public confirmed-only grid; start the drive to Sep 3.
- [ ] **Domain + Vercel cutover** to `ZADEVZ/ZAOstock` (+ move the 5 env vars).
- [ ] **ZAOstock bot → DM-only** (see section 4).

## 4. ZAOstock bot DM-only (Fellenz #6)

For this sprint the group stays a clean human channel — the [@ZAOstockTeamBot](https://t.me/ZAOstockTeamBot) responds in **DMs only**, not in the group. This is Fellenz challenge #6, folded into the sprint as a small infra task. Owner: Zaal/Iman. (Bot lives in `bot/` at repo root — separate from `bot/src/zoe/`.)

---

## Critical path (the calendar is the boss)

- **Now → Sep 3 (78 days): LINEUP is the spine.** If lineup slips past the cutoff, the event identity is at risk. Everything else flexes around it.
- **Now → ~Aug (parallel):** sign Wallace Events; convert sponsors; staff roles.
- **Sep → Oct 3:** run-of-show lock, media plan, site final, promo push (doc 473 drip).
- **Oct 3:** event — Franklin Street Parklet, Ellsworth ME (part of the 9th Annual Art of Ellsworth).

## Also see

- [Doc 871](../871-zaostock-phase-two-execution-sprint/) — phase-two plan of record (the *why*)
- [Doc 853](../853-zaostock-launch-backlog/) — site state (~90%) + C1–C8 brand fixes
- [Doc 472](../472-zaostock-artist-lockin-timeline/) — artist lock-in timeline + Sep 3 cutoff
- [Doc 856](../../community/856-zao101-content-expansion/) — the two-per-task accountability model
- [Doc 866](../866-thyrev-zaal-coc-framing-laptop/) — COC framing (partner, not owned) for sponsor-page copy
- [Hub README](README.md) — the AI-assist + planning hub index
