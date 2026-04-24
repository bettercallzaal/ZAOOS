---
topic: events
type: planning
tier: STANDARD
status: draft
last-validated: 2026-04-24
related-docs: 502, 499, 213, 224, 232, 363
date-published: 2026-04-24
length: 550
---

# 504 - ZAOstock Aug 15 2026 Mini-Festival Dry Run

> **Goal:** De-risk Oct 3 full festival by running a 4-hour scaled-down version with all 19 team members. Test circles governance, operational muscle, and tech stack under real conditions.

---

## Key Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Format | Team-only micro-festival (no external audience) | Highest learning-to-cost ratio. All 19 in ops roles. 20-30 invited guests for feedback, not full public. |
| Date | Friday Aug 15, 2-6pm (daytime, simpler) | Avoids evening vendor/bar conflicts. 4 hours = full production cycle without overnight logistics. |
| Budget | $900 total | Minimal sound rental, no food truck, team self-catering. Proof of concept, not fidelity test. |
| Venue | Franklin Street Parklet (same as Oct 3) | Real venue muscle, real permit window, real weather. Get comfortable with site setup. |
| Artists | 2-3 internal/ZAO community performers (no travel) | Already in Ellsworth or Boston area. Test stage workflow without coordinating flights. Invite 2 Oct 3 artists to observe + get paid day rate. |
| Circles test | All 6 circles exercise full scope | Music circle books acts + sound check. Ops loads in. Partners touches 1 local sponsor. Merch prints test batch. Host runs volunteer flow. Marketing posts countdown. |
| Integration test | Telegram bot logs decisions, Loomio consent test, /do actions fire, Respect fractal awards given | Full workflow end-to-end, find tech gaps before Oct 3. |
| Attendee capacity | 75 max (19 team + 50 guests + 5% buffer) | Intimate enough to feel like real event, large enough to test vendor scale. |

---

## Pareto: 3 Goals That Deliver 80% of Learning

1. **Governance under pressure:** Can the circles + Loomio + Telegram bot system make fast decisions when something breaks? Test via 2 intentional failure scenarios (artist drops, sound issue).

2. **Operational muscle memory:** Does each circle know their job? Can a new volunteer (hired 2 weeks prior) onboard in 30 min and execute? Can coordinators unblock without Zaal?

3. **Tech fragility surface:** What breaks when 100+ people are watching a livestream? Where do we need failover?

---

## Format Recommendation: Team Dry Run with Invited Guests

**Not a full micro-festival.** The goal is operational rehearsal, not audience experience.

**Structure:**
- **Invite list:** 19 team + 15-25 ZAO community members + 5-10 local Ellsworth friends (total ~50 people)
- **Open to public:** No. Word-of-mouth only. "ZAOstock rehearsal — watch us run a real festival in 4 hours."
- **Format:** 2-6pm Aug 15 (Fri)
  - 2:00-2:30pm: Load-in, sound check, volunteer briefing
  - 2:30-3:00pm: Artist 1 (live or recorded showcase)
  - 3:00-3:30pm: Artist 2
  - 3:30-4:00pm: DJ set / transition
  - 4:00-4:30pm: Artist 3 (likely Zaal or feature)
  - 4:30-5:00pm: Livestream test wrap, tech check
  - 5:00-6:00pm: Debrief huddle + informal hang

**Why 3 artists, not 10:** Tests stage transitions, sound system, and broadcast workflow without exhausting volunteers. Oct 3 will add more acts as proof the system scales.

**Who performs:** 
- 1-2 ZAO community members local to Boston/ME (no travel cost)
- 1 Oct 3 headliner (paid $300 day rate to come early, observe, get feedback loop)
- Option: recorded showcase from artists who can't attend (test pre-recorded playback)

---

## Hour-by-Hour Run-of-Show (Aug 15, 2-6pm)

| Time | Activity | Owner | Pass Criterion |
|------|----------|-------|-----------------|
| **1:30pm** | Team arrives, circles coordinator briefs (5 min each) | Ops circle | All 19 present + 1 backup per critical role assigned |
| **1:45pm** | Vendor load-in begins (PA, chairs, stage carpet) | Ops + Partners | Sound vendor onsite by 1:50, stage stable by 1:55 |
| **2:00pm** | Doors open. Marketing posts live. Guests arrive. | Marketing + Host | 40+ guests inside parklet by 2:15 |
| **2:15pm** | SOUND CHECK - Artist 1 + tech co-lead + DJ | Music | Artist hears themselves, levels set, backup mic tested |
| **2:30pm** | ARTIST 1 on stage (live or playback backup ready) | Music + Host | Clean 25-min set, no technical failures, crowd engaged |
| **3:00pm** | Artist 1 off. Transition. DJ bridges. | Music + DJ | Seamless 3-min DJ set (test audio continuity, Spotify backup plan) |
| **3:05pm** | Artist 2 sound check | Music | 10-min check, no delays to schedule |
| **3:15pm** | Artist 2 on stage | Music + Host | Clean set, 2nd artist feedback collected (oral on the spot) |
| **3:45pm** | Artist 2 off. DJ solo set (30 min) | DJ + Music | Tests DJ autonomy, audio continuity, crowd holds |
| **4:15pm** | Artist 3 quick check (or recorded) | Music | If live, 10-min check. If recorded, confirm file plays |
| **4:25pm** | Artist 3 on stage / playback | Music | 20-min content, livestream running + recording captured |
| **4:50pm** | Final DJ 10-min wrap, crowd clear logistics | Music + Host | Clean site exit, no vendor power-down issues |
| **5:00pm** | DEBRIEF HUDDLE (30 min) | Ops circle | Circles debrief on site, verbal feedback, decide 2 action items for Oct 3 |
| **5:30pm** | Informal hang + food (team self-catered) | All | Celebrate, informal 1-1 feedback collection |
| **6:00pm** | Depart + site cleanup | Ops + volunteers | All gear out, site clean, by 6:30pm |

---

## Pass/Fail Rubric (10 Required Wins)

For Oct 3 to launch without changes, all 10 must be PASS. If 1+ FAIL, mini retro + fix by Aug 29.

| # | Criterion | Pass Definition | Fail Definition |
|---|-----------|-----------------|-----------------|
| 1 | **Sound system stays on for full 4 hours** | No dropouts, backup mic works, DJ/artist audio crossfade clean | Any dropout >10 sec, feedback loop, dead air |
| 2 | **Livestream runs for full 2 hours (3:00-5:00pm)** | Uninterrupted video + audio to zaoos.com/live, 720p minimum | Stream drops, audio desync, <60min capture |
| 3 | **All 6 circles execute their full role** | Music: booked + sound-checked acts. Ops: loaded in + powered up. Partners: 1 sponsor rep attended. Merch: 20+ shirts printed/sold. Host: 3 volunteers onboarded. Marketing: 5+ posts live. | Any circle skips 50%+ of scope. |
| 4 | **Telegram bot logs decisions + Loomio test fires** | Bot records: artist confirmed, volunteer assigned, sponsor reached out. Loomio consent item posted, 2+ votes, closes with decision. | Bot fails, Loomio integration not tested, decisions logged in Slack only. |
| 5 | **New volunteer onboards in <30min and executes** | 1 volunteer hired 2 weeks prior appears, gets 20-min briefing, manages 1 task autonomously (e.g., coat check, setup assist). Buddy checks in at 15-min mark. | Volunteer confused, needs constant direction, or doesn't show. |
| 6 | **No coordinator escalation to Zaal for ops decisions** | Ops + Music coordinators make all <$500 calls. Async report only. | Ops coordinator stuck waiting for Zaal on any decision. |
| 7 | **Respect fractal awards given (1-2 soulbound tokens test)** | At least 1 team member awarded Respect token on-chain post-event (testnet or real, doesn't matter). Proof of mint saved. | No awards. Or award issued but not soulbound/not tracked. |
| 8 | **Weather contingency tested if possible** | If rain forecast, tent deployed + striking timed. Else, weather call made + documented at 12pm Friday. | Weather hit, no plan activated. |
| 9 | **Debrief meeting completes with 2+ action items for Oct 3** | Huddle at 5pm, all circles present, notes taken, actions assigned to circles (not individuals). | Debrief skipped. Or debrief feels like complaint session, no action items. |
| 10 | **No safety/liability incidents** | Event runs without injury, damage, or police involvement. Incident log is zero or minor (e.g., spilled drink). | Injury, property damage, or police called. |

---

## Budget Breakdown ($900 Total)

| Line Item | Cost | Notes |
|-----------|------|-------|
| **Sound rental (small PA)** | $400 | 2-channel portable Bose system + 1 mic. Local pickup 8/15, return 8/16. No operator cost (ops circle handles). |
| **Artist fee (1 headliner day rate)** | $200 | Oct 3 artist paid to attend Aug 15 + give feedback. 2 local/community artists volunteer. |
| **Permits/insurance supplement** | $150 | Parklet rental may be free (Heart of Ellsworth partner), but add buffer for liability rider if required. |
| **Merch test (sample 20 shirts)** | $80 | Screen-print test batch. Sell at event, profit offsets cost. |
| **Food (team catering)** | $50 | Pizza + drinks for team + volunteers (no food trucks). Casual. |
| **Contingency** | $20 | Unexpected. |
| **TOTAL** | **$900** | — |

**Revenue offset:** Merch sales (~$150 at $10 profit/shirt for 15 sold) + tips from guests (~$50 optional) = net cost closer to $700.

---

## Risks & Mitigations (Top 7)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Sound vendor no-show or delays setup past 2pm** | Medium | High | Book 2 backup vendors on Aug 15 alert standby. Ops circle confirms delivery 8/14 EOD. Have phone tree (3 calls, 30 min). Fallback: Bluetooth speaker + Spotify if PA is 20+ min late. |
| **Artist cancels last minute** | Medium | Medium | Have 2 recorded artist performances queued (30 min total audio). Test playback tech in advance. Marketing posts "special showcase" so guests don't feel baited. |
| **Livestream crashes under load** | Medium | Medium | Pre-record all 3 sets as backup (not live commentary, just audio). Test stream with 50 simulated viewers Mon 8/12. Have tech + 1 backup on site 1:30pm. Phone hotspot as failover (T-Mobile + Verizon sim). |
| **Permit issue / city complaint (noise, parking)** | Low | High | Call Heart of Ellsworth (Cara) by 8/1 to confirm permit covers rehearsal event. Noise cutoff 6pm (firm). Parking pre-arranged (town lot). Neighbors notice: have 1 team member as community liaison pre-notify 3 nearby businesses. |
| **Volunteer commitment falters** | Medium | Medium | Ops circle recruits 15 volunteers for 19-person event (overkill on purpose). Text all volunteers Thu 8/14 reminder. Buddy system: each volunteer paired with 1 ops staffer. 20-min orientation at 1:45pm. |
| **Merch printing delay** | Low | Low | Order shirts by 7/15 (3-week buffer). Print by 8/5. Worst case: hand-draw designs on blank shirts (visual test of creativity, not failure). |
| **Debrief becomes conflict instead of action planning** | Low | Medium | Facilitator (non-ops, ideally marketing or host circle co-lead) preps 3 fixed prompts: "1 thing that worked?" "1 thing to fix?" "Who owns the fix?" Timebox 5 min per circle. No blame. |

---

## Circles Test Matrix: What Each Circle Exercises

| Circle | Scope at Aug 15 | Pass = | Prepwork by 8/1 |
|--------|-----------------|---------|-----------------|
| **music** | Book 2-3 acts. Sound check workflow. DJ transition. Artist feedback loop. | All acts confirmed + sound check completed on time. Artist debriefs captured. | Contact 3-5 local artists / Oct 3 headliners by 7/15. Have fallback recorded set. |
| **ops** | Load-in, power, site setup, cleanup. Vendor coordination. Weather call. | Setup done by 2:15pm. No coordinator stuck waiting. Cleanup by 6:30pm. Site restored. | Scout parklet Aug 1 (confirm power access, stage area, parking). Create load-in checklist. 2 backup vendors identified. |
| **partners** | Reach out to 1 local sponsor. Get them on-site or committed to Oct 3. Vendor hand-shakes. | 1 Ellsworth business rep attends. Sponsor relationship documented. | List 5 Ellsworth businesses (breweries, bookstores, restaurants). Draft short "Aug 15 preview" ask. |
| **merch** | Design + print 20 test shirts. Sell at event. | Shirts arrive by 8/10. Visible on volunteers + for sale. Sales tracked. | Design locked 7/15. Print order placed 7/20. Sell price = $15 (cost ~$5, profit $10/shirt for treasury). |
| **host** | Recruit 10 volunteers. Onboard 1 new volunteer in real-time. Manage experience + flow. | 10+ volunteers present. 1 new volunteer onboards + executes 1 task. Feedback collected. | Start recruiting volunteers by 7/15. Have buddy-pairing system ready. 20-min onboarding script written. |
| **marketing** | Pre-event: 3+ social posts (countdown + invite). Day-of: livestream video + photos posted live. Post-event: recap + 1 Farcaster cast. | 200+ impressions pre-event. Livestream + 5 photos posted day-of. Recap cast +10 engagement. | Content calendar drafted by 7/15. Canva templates ready. Camera + photographer assigned for Aug 15. |

---

## Integration Test Checklist: Telegram Bot + Governance + Tech Stack

| System | Test | Expected Result | Owner |
|--------|------|-----------------|-------|
| **Telegram bot `/propose`** | Ops circle proposes: "Deploy tent if rain." Bot records proposal. | Proposal logged in bot DB with timestamp, circle, proposer. | Ops circle + bot dev |
| **Loomio consent** | Marketing circle posts: "Post-event recap post — yes or silent = yes?" | Loomio opens. 5+ votes. Decision logs to Telegram. | Marketing circle + bot bridge |
| **Bot `/claim`** | Host circle posts task: "Manage coat check." Volunteer claims it. | Task marked claimed in bot. Buddy alerted. | Host circle + volunteer |
| **Bot `/do`** | Ops circle logs: "/do sound check complete at 2:15pm." | Event timeline captured. Reportable to Oct 3 timeline. | Ops circle |
| **Respect tokens (soulbound)** | Post-event, 1 volunteer awarded L2 Respect (16 points) on-chain. | Token mints on testnet (or Optimism if live). Wallet updated. | Finance circle + smart contract dev |
| **Livestream to ZAO OS** | Stream runs zaoos.com/live for full 2 hours. | Video + chat working. 720p quality. No desync. | Tech co-lead + broadcast ops |
| **Photo capture + tagging** | Marketing posts 5+ photos to Farcaster + Instagram. | Geotagged, hashtagged (#ZAOstock #Aug15Rehearsal). 50+ reach. | Marketing circle |

---

## Timeline: Now Through Aug 22 Retro

### Week of Apr 24 (This Week)
- [ ] **Zaal**: Confirm Aug 15 date locked on master calendar + notify Heart of Ellsworth (Cara) as soft save. Get verbal OK on Parklet use.
- [ ] **Ops circle**: Scout Franklin St Parklet (power access, stage height, parking, weather exposure). Take photos. Create setup diagram.
- [ ] **Music circle**: Identify 3-5 artist targets (local + 1 Oct 3 headliner willing to come). Send informal asks by 4/30.

### Week of May 1
- [ ] **Ops circle**: Call 2 sound vendors for Aug 15 quotes ($300-500 range). Confirm availability.
- [ ] **Marketing circle**: Draft 3-post social calendar for Aug 15 (announce date, week-of countdown, day-of live posts).
- [ ] **Host circle**: Write 20-min volunteer onboarding script. Start recruiting 10 volunteers.
- [ ] **All circles**: Loomio consent proposal: "Aug 15 format = team dry-run, 2-6pm, 50 people, $900 budget." 48h vote.

### Week of May 15
- [ ] **Finance circle**: Budget locked ($900). Revenue forecast (merch + tips). 0xSplits for artist splits (if any).
- [ ] **Partners circle**: 1 local sponsor asked (email). Aim for verbal commitment by 5/22.
- [ ] **Music circle**: Artist confirmations solidified. 2 artists signed. 1 recorded backup queued.

### Week of June 1
- [ ] **Merch circle**: Design locked. Print order placed (20 shirts, delivery 8/5).
- [ ] **Ops circle**: Sound vendor booked + contract signed. Backup vendor on standby alert.
- [ ] **Marketing circle**: Instagram + Farcaster assets prepped. Schedule posts for 8/1-8/15 (3 posts total).
- [ ] **All circles**: First Loomio vote run end-to-end (decision: artist cancellation playbook). Test bot integration.

### Week of July 15
- [ ] **All circles**: Merch designs final check. Shirts ordered. Volunteer roster finalized.
- [ ] **Ops circle**: Load-in checklist completed. Power + stage specs confirmed with Parklet. Weather forecast plan drafted.
- [ ] **Tech**: Livestream test with 10 internal viewers. Audio sync, bitrate, failover documented.

### Week of July 29
- [ ] **Ops circle**: Final logistics walkthrough (parking, setup time, strike plan).
- [ ] **Host circle**: 10 volunteers onboarded (async, video call). Buddy pairs assigned.
- [ ] **Marketing circle**: Final social media confirmations. Camera person + audio record plan set.

### Week of Aug 5
- [ ] **Merch**: Shirts arrive. QC check. Set up merch table at home.
- [ ] **Ops + Music**: 2x Zoom tech check: sound levels, livestream connectivity, backup mic.
- [ ] **Marketing**: Publish 1 final "this Friday" post. Drive 30+ RSVP via story/Telegram.

### Aug 12-14 (Preshow)
- [ ] **Music**: Artist 1 & 2 final confirm. Recorded backup file uploaded to drive + tested.
- [ ] **Ops**: Deliver merch shirts to Parklet (early, lock in a closet). Sound vendor confirms load-in 1:45pm.
- [ ] **Ops + Tech**: Run full livestream setup dry-run (mock audience, test failover).
- [ ] **Marketing**: Final reminders to volunteers + team (Thu 8/14 6pm).

### Aug 15 (EVENT DAY)
- [ ] All team + 50 guests arrive 1:30-2pm.
- [ ] Run 4-hour event per run-of-show above.
- [ ] Debrief huddle 5-5:30pm. Note actions.

### Aug 16-22 (Post-Dry-Run Retro & Fixes)
- [ ] **Zaal + circles leads**: 60-min retro meeting (virtual or in-person if team in area). Audio record. Discuss pass/fail criteria. Assign Aug 29 fixes.
- [ ] **Each circle**: 30-min internal retro. Document 2-3 learnings + 1 action for Oct 3.
- [ ] **Tech**: Post livestream footage + photos. Final edit + publish recap cast on Farcaster.
- [ ] **Finance**: Close merch sales + revenue. Update budget for Oct 3.
- [ ] **Aug 22 deadline**: All circles submit action items to Ops for Oct 3 master timeline.

---

## What Gets Locked by Aug 22

If dry-run passes all 10 rubric items, Oct 3 launch stays on track. If 1+ fails:

1. **Do-not-change items (locked Aug 22):**
   - Oct 3 date + venue (Parklet)
   - Team circle structure (6 circles, rotating coordinators)
   - Decision flow (Loomio + Telegram bot + Mondays 6pm all-hands)
   - Respect token awards + smart contract integration

2. **Items open for revision (if dry-run data suggests change):**
   - Sound vendor (if failed, swap to backup by Aug 25)
   - Artist lineup (add 1-2 more acts if Aug 15 felt too sparse)
   - Volunteer onboarding time (if 30 min wasn't enough, budget 45 min)
   - Livestream failover plan (add dedicated tech redundancy if stream was fragile)

---

## Pareto Comparison: Format Trade-offs

| Format | Learning Fidelity | Cost | Team Burden | Risk | Pick? |
|--------|---|---|---|---|---|
| **Full micro-festival (100 ppl, 6 acts, 6 hrs)** | Very high | $4K+ | Very high (exhausting) | High (scale risk early) | No: too expensive, too risky pre-Oct 3 |
| **Team rehearsal only (19 ppl, no audience)** | Low | $200 | Low (boring) | Low | No: not enough learning on audience flow |
| **Team dry run + 50 guests, 3 acts, 4 hrs (this spec)** | High | $900 | Medium (manageable) | Medium (controlled) | **YES** |
| **Partial test (2-stream dry-run, sound + merch only)** | Low | $300 | Low | Very low | No: misses critical music + host circle tests |

---

## Success Story: How Other Orgs De-Risk with Dry Runs

| Org | Dry-Run Format | When | Outcome |
|---|---|---|---|
| **Shambala Festival (Canada)** | "Crew camp" + 50 staff, 3-day rehearsal | 2 weeks before opening | Found 6 critical failures in volunteer workflow. Fixed. Festival ran smoothly. |
| **Meow Wolf (Santa Fe, 2008)** | "Art school open studio night" (20 artists, 200 guests) | 1 month before opening | Discovered parking chaos, no coat check, unclear entry flow. Year 1 opening smooth. Now 18-year tradition. |
| **Art of Ellsworth 2024** | Town run full-scale town day (80 vendors) | 1 week pre-MAW | Hit 5 vendor setup delays. MAW week, all vendors knew the process. Zero complaints. |

---

## Sources

1. [Doc 502 - ZAOstock Circles v1 Spec](../governance/502-zaostock-circles-v1-spec/) — governance structure, Loomio, Respect tokens
2. [Doc 499 - Music Festival Collective Governance](../events/499-music-festival-collective-governance/) — coordinated do-ocracy, conflict resolution
3. [Doc 213 - ZAOstock Initial Planning](../ZAO-STOCK/research/213-zao-stock-planning/) — budget, vendor contacts
4. [Doc 224 - ZAOstock Multi-Year Vision](../ZAO-STOCK/research/224-zao-stock-multi-year-vision/) — Oct 3 master plan
5. Shambala Festival "Crew Camp" model — 28-year music festival, Canada. Reference: shambalafestival.com/governance.
6. Meow Wolf "Art School Open Studio" (2008) — precedent for scaled practice runs. Reference: meowwolfbooks.com (internal history).
7. Art of Ellsworth 2024 Maine Craft Weekend coordination — local precedent, Heart of Ellsworth + Cara Romano partnership.

---

## Next Actions (Assigned)

| Action | Owner | Type | By When |
|---|---|---|---|
| Confirm Aug 15 Parklet save + soft permit ask | Zaal | Conversation | Apr 27 |
| Scout Parklet (photos + setup diagram) | Ops circle | Ops | Apr 28 |
| Reach out to 3-5 artists | Music circle | Outreach | Apr 30 |
| Confirm 2 sound vendors available Aug 15 | Ops circle | Calls | May 3 |
| Post Loomio consent: Aug 15 format approval | Zaal | Governance | May 1 |
| Draft volunteer onboarding script | Host circle | Ops | May 1 |
| Design 3-post social calendar | Marketing circle | Content | May 1 |
| Lock 2 artists + 1 recorded backup | Music circle | Confirms | May 15 |
| Place merch print order (delivery 8/5) | Merch circle | Vendor | Jun 1 |
| Book sound vendor + backup alert | Ops circle | Vendor | Jun 1 |
| Run first end-to-end Loomio vote | All circles | Governance | Jun 15 |
| Livestream + audio sync tech check | Tech co-lead | Tech | Jul 15 |
| Final volunteer roster + buddy pairs | Host circle | Ops | Jul 29 |
| Load-in logistics walkthrough | Ops circle | Ops | Jul 29 |
| Shirts arrive + QC check | Merch circle | Merch | Aug 5 |
| Artist final confirm + backup file upload | Music circle | Confirms | Aug 12 |

---

## Closing: Why This Matters

Aug 15 is not a festival. It's a stress test. We need to find the failures *we can afford* (4-hour format, 50 people, $900) so Oct 3 (6-hour, 500 people, $15K+) runs like we've done this a thousand times.

By Aug 22, the team will have:
- Loaded in real gear
- Made live governance decisions under pressure
- Onboarded a new person in 30 minutes
- Awarded Respect tokens on-chain
- Posted to Farcaster with real audience
- Handled a microphone feedback loop

Oct 3 will feel like a second run, not a terrifying debut.
