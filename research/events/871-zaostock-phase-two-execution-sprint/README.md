---
topic: events
type: decision
status: research-complete
last-validated: 2026-06-17
superseded-by:
related-docs: 270, 428, 472, 476, 839, 853, 856, 866, 869
original-query: "Overall ZAOstock audit + where we are on project management, then move into phase two. Scope = ZAOstock specifically. Biggest risk = team/accountability. Phase two = the execution sprint to Oct 3."
tier: STANDARD
---

# 871 — ZAOstock Phase Two: The Execution Sprint to Oct 3

> **Goal:** Turn ZAOstock from "infrastructure built" into "event locked." Phase two is the 108-day execution sprint to Oct 3, and the #1 lever is fixing team/accountability first - because that is the most at-risk part and it is the foundation everything else runs on.

## The thesis (read first)

- **Tech is ahead, execution is behind.** The site (~90%, doc 853), dashboard, and AI tooling are largely done. What is NOT locked: a confirmed lineup, signed venue paperwork, committed sponsors, staffed roles.
- **The binding constraint is the Sep 3 artist cutoff = 78 days** (doc 472). Everything lineup-related clears by then or it does not happen.
- **The #1 risk is team/accountability** (Zaal's call, 2026-06-17): 17-19 people, a tracker, but ownership is fuzzy and the commitment model (doc 856: self-set commitment + two-per-task main/understudy) was defined, not applied. Phase two leads by fixing this - it is also Fellenz challenge 8 operationalized on a real deadline.

## Step 0 (week 1) - stand up the accountability spine BEFORE the workstreams run

This is the lead move. Nothing else in the sprint is reliable until this exists.

1. **Five workstreams, each with a single MAIN owner + an UNDERSTUDY.** No workstream ships with one name. The understudy can bother the main, report if they need help, and step in if the main goes quiet (doc 856 model).
2. **Every owner self-declares their commitment** (hours/week or "I own this outcome by date X") and it goes in the cowork tracker.
3. **Weekly standup is the forcing function** - the Tue/Mon ZAOstock cadence, run against the tracker, Sep 3 + Oct 3 as the visible countdown.
4. **The ZAOstock bot stays DM-only** (Fellenz #6 fix) so the group is a clean human channel for this sprint.

## The five workstreams (assign main + understudy in week 1)

| # | Workstream | Proposed main | Understudy (NEEDS ASSIGNING) | The one thing it must deliver |
|---|-----------|---------------|------------------------------|-------------------------------|
| 1 | **Lineup** | Dcoop (music 2nd) | Steve Peer? (co-curator) | A CONFIRMED artist grid locked before Sep 3 (78 days). Public grid = confirmed-only. |
| 2 | **Venue + ops** | Candy / Zaal | TBD | Signed Wallace Events agreement (stage + tent - currently a handshake), run-of-show, Black Moon after-party confirmed. |
| 3 | **Sponsors / money** | Jay or Duh? (sponsorship leads) | TBD | Convert the sponsor tracks into COMMITTED names + dollars against the $5-25K budget. |
| 4 | **Volunteers + roles** | Chikodi | TBD | Every event-day role staffed two-deep; volunteers onboarded via `/apply` + the commitment model. |
| 5 | **Site + media** | Zaal | TBD | Domain/Vercel cutover to `ZADEVZ/ZAOstock`, the C1-C8 brand fixes (doc 853), media-capture staffed (doc 433). |

Gaps to close immediately: workstreams 2-5 have no named understudy, and sponsors has no confirmed main. That is the accountability hole - fill it in week 1.

## Critical path (the calendar is the boss)

- **Now -> Sep 3 (78 days): LINEUP is the spine.** Artist outreach, confirmation, deliverable cutoff. If lineup slips past Sep 3, the event identity is at risk. Everything else flexes around this.
- **Now -> ~Aug (parallel):** sign Wallace Events (do not let a handshake ride); convert sponsors; staff roles.
- **Sep -> Oct 3:** run-of-show lock, media plan, site final, promo push (doc 473 drip).
- **Oct 3:** event.

## Immediate next moves (this week)

| Action | Owner | Type |
|--------|-------|------|
| Assign all 5 workstream mains + understudies; each declares commitment in the tracker | Zaal | Ops |
| Sign the Wallace Events stage + tent agreement (stop the handshake risk) | Zaal/Candy | Ops |
| Lineup: list confirmed vs TBA artists; set the public confirmed-only grid; drive to Sep 3 | Dcoop | Ops |
| Domain + Vercel cutover to `ZADEVZ/ZAOstock` + move 5 env vars | Zaal | Infra |
| Sponsors: name a main; turn tracks into a committed-target list | Jay/Duh? | Ops |
| ZAOstock bot DM-only (Fellenz #6) | Zaal/Iman | Infra |

## Also See

- [Doc 853](../853-zaostock-launch-backlog/) - site brand audit + launch backlog (the ~90%-done site + C1-C8 fixes)
- [Doc 472](../472-zaostock-artist-lockin-timeline/) - artist lock-in timeline + Sep 3 cutoff
- [Doc 428](../428-zaostock-run-of-show-program/) - run-of-show draft
- [Doc 856](../../community/856-zao101-content-expansion/) - the two-per-task accountability model this applies
- [Doc 866](../866-thyrev-zaal-coc-framing-laptop/) - COC framing (partner, not owned) for sponsor-page corrections
- [_zaostock-hub](../_zaostock-hub/) - the AI-assist + planning hub

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run the week-1 accountability stand-up: assign 5 workstream main+understudy pairs | Zaal | Ops | This week |
| Sign Wallace Events | Zaal/Candy | Ops | This week |
| Lineup confirmed-grid + drive to cutoff | Dcoop | Ops | Sep 3 |
| Domain/Vercel cutover + C1-C8 fixes | Zaal | Infra/PR | Next |

## Sources

- Zaal direction, 2026-06-17: scope = ZAOstock, biggest risk = team/accountability, phase two = execution sprint to Oct 3 `[FULL]`
- [Doc 853](../853-zaostock-launch-backlog/) - canonical site state (~90% done) `[FULL]`
- [_zaostock-hub](../_zaostock-hub/) - team (17-19), Oct 3 Franklin St Parklet, advisory `[FULL]`
- Date math: 78 days to Sep 3 cutoff, 108 to Oct 3 (from 2026-06-17) `[FULL]`
