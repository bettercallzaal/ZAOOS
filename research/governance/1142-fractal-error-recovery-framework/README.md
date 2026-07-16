---
topic: governance
type: framework
status: research-complete
last-validated: 2026-07-16
related-docs: 1139, 942, 718, 703, 981
original-query: "Design an error-recovery / failure-modes framework for ZAO Fractal governance grounded in doc 1139 lessons and mapped to feed the fractal whitepaper (doc 942)"
tier: DEEP
---

# 1142 - ZAO Fractal: Error Recovery & Failure Modes Framework

> **Goal:** Answer: When ZAO Fractal governance fails or degrades, how does it detect, contain, and recover? Ground this in Grace Rachmany's DAO-failure analysis (doc 1139) and map the framework to feed the Fractal whitepaper (doc 942). This is a design-only doc—no code, no gated actions. Structures decisions for future iteration.

---

## Executive Summary

ZAO Fractal has run unbroken for ~101 weeks (doc 703/981), but Rachmany's DAO-failure framework (doc 1139) identifies seven distinct failure modes that threaten all DAOs. Five apply directly to ZAO Fractal: (1) Forking Code as if it's reversible—ZAO makes irreversible governance decisions with no error-recovery path; (2) Dispensable People—onboarding pressure as ZAO scales will recreate gatekeeping; (3) Invisible Onboarding Costs—ZABAL Games success is unmeasured, making the ROI invisible when budgets tighten; (4) Code Thinking vs. Consequence Thinking—governance optimizes for mechanism elegance, not human prerequisites; (5) Drift to Financialization—Respect tokens risk becoming "just UBI for crypto people" if the mission isn't actively defended.

This framework maps each failure class to:
- **Failure taxonomy:** distinct breakage modes (e.g., OREC signer centralization, quorum capture, Respect Gini concentration), each grounded in doc-1139 and ZAO-specific surfaces (ORDAO, OREC 72h/72h windows, non-transferable Respect).
- **Error-recovery patterns:** concrete detection → containment → recovery → prevention for each failure (favoring OREC/Respect-weighting mechanisms over generic DAO patterns).
- **Circuit breakers & guardrails:** safe-stops that compose with ZAO's 72h+72h optimistic-execution window (e.g., emergency veto, signer rotation, participation floors).
- **Detection dashboard spec:** the handful of metrics that surface a failure early (participation rate, Gini, signer diversity).
- **Whitepaper insertion points:** which doc-942 chapters this framework becomes (Ch 9 "Limitations & Open Problems" + Ch 10 "Roadmap" for error-recovery experiments).
- **Open decisions for Zaal:** judgment calls on thresholds, who can trip a breaker, mutable vs. immutable recovery paths.

---

## Part 1: Failure Taxonomy

Each failure class is mapped to doc-1139 lesson, ZAO-specific surfaces, early-warning signals, and blast radius.

### FAILURE CLASS 1: Forking Code as if it's Reversible (Rachmany: "Code Isn't Like Forking a River")

**What breaks:** ZAO makes real governance decisions about money (artist partnerships, treasury allocation, governance structure). Decisions ripple outward and cannot be easily undone. As ZAO scales and Fractal deliberation gets faster, the risk of irreversible bad calls increases.

**ZAO-Specific Surfaces:**
- OREC architecture: 72h propose + 72h veto (doc 981, 703). The veto window is the only error-recovery point; after execution, on-chain state is immutable.
- Respect tokens: soulbound, non-transferable (doc 703). Cannot "unrank" a member once Respect is minted.
- Fractal circles: 100+ weeks of accumulated history, reputation, and consequential decisions (artist partnerships, Sparkz governance, ZAOstock Respect contracts).
- Treasury execution: OREC proposals move actual money. A governance mistake drains funds directly.

**Triggering Conditions:**
- Major decision passed without full deliberation (Fractal circle skipped, or "fast-tracked" via expedited voting).
- Decision's consequences were not modeled before execution (no pre-impact analysis).
- Post-execution, new information emerges that contradicts the decision (partner fails to deliver, unforeseen cascade).

**Early-Warning Signals:**
1. **Acceleration of decision cycles** — If Fractal goes from 100+ weeks to 20 weeks or "ad-hoc" voting, deliberation depth drops. Track cycle time as a proxy for consequence-thinking.
2. **Veto rate drops to zero** — If 72h veto window closes with zero vetoes over 4+ consecutive weeks, either vetoes are not being checked, or consensus is artificially perfect (suppression signal).
3. **Post-execution amendments spike** — If governance votes to "undo" or "patch" previous decisions at a rate > 15% of all decisions per quarter, error-recovery culture is already in crisis mode.
4. **Signer rotation fails** — If OREC signers don't rotate (currently 2 wallets: zaal.eth, civilmonkey.eth; doc 703) over 6 months, single-person-failure risk is unmitigated.

**Blast Radius:**
- **Immediate:** Artist partnership mistrust, treasury loss, governance legitimacy collapse.
- **Medium-term:** Members disengage if decisions aren't revisable (Rachmany's "no feedback loop for failure").
- **Long-term:** ZAO drifts toward "governance theater" (votes don't matter, Zaal decides).

**Severity:** HIGH. This is the #1 risk identified in doc 1139 for ZAO.

---

### FAILURE CLASS 2: Dispensable People & Onboarding Creep (Rachmany: "Dispensable People by Design")

**What breaks:** As ZAO scales (ZABAL Games, ZAOstock, Sparkz), onboarding barriers recreate themselves. Early members unconsciously build gatekeeping ("you must understand the Fractal," "Farcaster is required," "read these 5 docs first"). Diversity of perspective narrows.

**ZAO-Specific Surfaces:**
- Onboarding flow: ZABAL Games + mentorship (doc 1139). If budget gets cut or mentors burn out, onboarding quality drops.
- Contribution ledger: what counts as ZOL-eligible work? Currently unmeasured for mentorship, emotional support, cultural work (doc 703, 1139).
- Accessibility: Fractal calls are Monday 6pm EST (doc 703). Timezone-exclusive, excludes parents with early bedtime routines, excludes non-English speakers (no caption + no translation).
- Farcaster/wallet requirement: implicit assumption that new members have Farcaster + Optimism wallet (doc 703, 981).

**Triggering Conditions:**
- New member cohort shrinks or stops (no fresh faces for 4+ weeks).
- Time-to-first-contribution for new members increases (was 2 weeks, now 6+).
- Onboarding completion rate drops below baseline (80% -> 50%).
- Mentorship availability drops (mentors burn out, not recruited).

**Early-Warning Signals:**
1. **Onboarding completion metrics:** Define "successful onboarding = person reaches [X ZOLs / Y# of contributions] within [Z months]." Track monthly. Alert if rate drops 10%+ from baseline.
2. **Fractal attendance diversity:** Track fractal attendance by membership cohort (early OGs vs. new members vs. ZABAL Games grads). If new members attend < 30% of fractals, gatekeeping is real.
3. **Mentorship load imbalance:** Count mentors who are "over-utilized" (>3 mentees each, >5 hours/week). If >50% of mentors are burnt out, recruitment is failing.
4. **Feedback from failed onboardees:** Rachmany's #1 complaint (doc 1139) — no feedback when someone doesn't integrate. If zero post-mortems exist after a failed onboarding, blind spot is confirmed.
5. **Barrier audit:** Every quarter, walk through onboarding fresh as a new member. Log: (a) all explicit requirements listed, (b) all implicit assumptions (Farcaster, Optimism, English fluency, crypto background), (c) time to first contribution, (d) friction points encountered.

**Blast Radius:**
- **Immediate:** New members leave. Onboarding failures are silent (no one complains, they just disappear).
- **Medium-term:** ZAO becomes an insider club. Decision-making reflects only OG perspective.
- **Long-term:** Contribution pool stagnates, culture dies, ZAO becomes "opportunity for people who were already here."

**Severity:** MODERATE-HIGH. Inevitable without active resistance as scale increases.

---

### FAILURE CLASS 3: Invisible Onboarding Costs (Rachmany: "Onboarding Is Expensive, But Nobody Measures It")

**What breaks:** ZABAL Games budget could be cut if other priorities surge. Onboarding success/failure is unmeasured. "Why spend on mentors if contributors are already working?" Cycle repeats: budget shrinks, new members fail to integrate, retention drops, treasury seems healthier short-term.

**ZAO-Specific Surfaces:**
- ZABAL Games: explicitly budgeted onboarding, mentorship stipends (doc 1139, 703). Only defense against invisible cost creep.
- Treasury: If ZAO hits a capital crunch (partnership fails, expenses spike), ZABAL Games is discretionary and cuts quickly.
- Measurement: no public KPI on "onboarding ROI" (e.g., "80% of ZABAL members reach 50 ZOLs within 3 months"). Without measurement, success is invisible and failure is invisible.

**Triggering Conditions:**
- ZABAL Games budget gets reduced year-over-year or suspended.
- No onboarding success metrics published for 2+ consecutive quarters.
- Mentorship role goes unfilled for 4+ weeks.
- Turnover rate spikes (members join, then leave within 6 months).

**Early-Warning Signals:**
1. **Onboarding spend as % of treasury:** Define a safe minimum (e.g., "10% of treasury always budgeted for education/onboarding, separate from operational budget"). Alert if spend drops below 10%.
2. **Onboarding completion KPI dashboard:** Public, quarterly update: "X% of onboarded people reached Y ZOLs within Z months." Alert if rate drops 15% from baseline.
3. **Mentor burnout index:** Count mentors, track "hours/week per mentor," flag if any mentor exceeds 8h/week or if total available mentor-hours drop 20% month-over-month.
4. **Feedback loop instrument:** After each person fails to onboard (or succeeds), ask: "Why?" Document the answer. Quarterly synthesis of patterns (e.g., "3 people left because Farcaster barrier was too high").
5. **Turnover cohort analysis:** Track: of 100 people who onboarded this year, how many are still active after 6 months? After 12 months? Alert if cohort retention drops below 60%.

**Blast Radius:**
- **Immediate:** New-member experience degrades, churn increases.
- **Medium-term:** Contributor pool shrinks, mission-critical work (mentorship, culture-building) gets de-prioritized.
- **Long-term:** ZAO becomes a closed club. Culture ossifies. Growth halts.

**Severity:** MODERATE-HIGH. Insidious because failure is silent.

---

### FAILURE CLASS 4: OREC Signer Centralization (Derived from Rachmany: "Code Thinks People Are Dispensable" + "Insider Bias")

**What breaks:** Only 2 wallets have ever submitted to OREC (zaal.eth, civilmonkey.eth; doc 703, 981). If Zaal's wallet is compromised, lost, or unavailable, Fractal governance halts. No signer rotation, no committee, no decentralization of the verification/submission step.

**ZAO-Specific Surfaces:**
- OREC contract (`0xcB05F9...6Be532`, Optimism): executor contract that mints ZOR Respect after the 72h+72h windows close (doc 981).
- Submitter flow: Fractal circle votes → someone calls `submitBreakout(groupNum, address[] rankedAddresses)` → 72h vote window opens (doc 703, 981).
- Current reality: Zaal manually submits. If he's unavailable, submissions wait. If his wallet is compromised, a malicious submitter ranks the wrong people, mints Respect to attackers (doc 718e threshold was "1000 Respect to propose"; an attacker could artificially inflate a few wallets to that threshold).

**Triggering Conditions:**
- Only one signer (zaal.eth) has submitted in a 4-week period, and civilmonkey.eth is unreachable.
- Submission latency exceeds 24 hours (deliberate submission is delayed; maybe Zaal is traveling).
- A submission is discovered to be incorrect or malicious (e.g., wrong ranking for a circle).
- Signer wallet shows signs of compromise (unexpected outbound transactions, failed auth attempts).

**Early-Warning Signals:**
1. **Signer activity diversity:** Track which wallets have called `Vote()` on OREC. Alert if only one signer submits for 4+ weeks.
2. **Submission latency:** Measure time from fractal-end → on-chain submission. Baseline: < 2 hours. Alert if latency exceeds 6 hours in 3 consecutive weeks.
3. **Signer diversity goal:** Explicitly state target (e.g., "by Q3 2026, 3+ signers each submitting ≥1 proposal per month"). Track progress.
4. **Signer rotation schedule:** Document a rotation plan (e.g., "each signer gets stewardship of 2-4 fractals per month"). Publish the schedule.

**Blast Radius:**
- **Immediate:** Governance halts if Zaal is unavailable.
- **Medium-term:** If a malicious actor submits, Respect is minted incorrectly; reversal requires emergency governance.
- **Long-term:** "Fractal is really just Zaal voting, not decentralized."

**Severity:** HIGH. Zaal is a single point of failure.

---

### FAILURE CLASS 5: Respect Gini Drift & Whale Capture (Derived from Rachmany: "Code Thinks People Are Dispensable" + "Insider Bias")

**What breaks:** Early members accumulate Respect (OG Gini = 0.73; top 10 holders = 53% of supply; doc 981). Over time, wealth begets power: high-Respect members have higher voting weight, influence governance more, accumulate more Respect. Governance drifts toward plutocracy.

**ZAO-Specific Surfaces:**
- Respect tokens: non-transferable, soulbound (doc 703). Cannot trade, but early accumulation creates permanent advantage.
- Vote weight: computed as `Math.round(OG + ZOR)` (doc 942, 981). Higher Respect = more influence on governance decisions.
- Fractal circles: each week, 3-6 people are ranked 1-6, minting 272 points total (doc 981). If the same "core 6" appear in every circle, they accumulate Respect exponentially.
- Gini coefficient: doc 981 cites OG Gini = 0.73. Current ZOR distribution unknown (only 4 early holders documented). Monitoring is non-existent.

**Triggering Conditions:**
- Gini coefficient exceeds 0.80 (extreme inequality).
- Top 3 members hold >50% of total Respect.
- Same 6 members appear in every Fractal circle for 8+ consecutive weeks.
- A single wallet proposes >30% of all OREC proposals in a quarter.

**Early-Warning Signals:**
1. **Gini tracking:** Monthly compute and publish Gini for OG + ZOR combined. Alert if Gini increases 5% in a month.
2. **Top-holder concentration:** Track % of Respect held by top 3, top 10. Alert if top 3 > 40% or top 10 > 70%.
3. **Circle diversity:** Track which members appear in fractals. Count "unique members in fractals per week." Alert if unique count drops 20% month-over-month.
4. **Proposal origination:** Track who submits OREC proposals. If one person > 25% of proposals, flag as concentration.
5. **New-member Respect velocity:** Track average Respect earned by new members vs. OG members in their first month. If gap widens (new members earn <10% of what OGs earned), inequality is accelerating.

**Blast Radius:**
- **Immediate:** New members feel powerless (low Respect = low influence).
- **Medium-term:** Governance decisions reflect OG preferences. Minority opinions are suppressed.
- **Long-term:** ZAO becomes plutocracy. Rachmany's "voting is deadly" trap even for non-transferable Respect.

**Severity:** MODERATE-HIGH. Inevitable without active rebalancing mechanisms.

---

### FAILURE CLASS 6: Low Participation / Apathy (Rachmany: "Voting Is Deadly" + "Democracy Fatigue")

**What breaks:** Weekly synchronous meetings cause participation decline over months. Participation drops from 80% to 20% by month 6, and the 20% who remain are usually the same "core" people. Fractal loses deliberative power (if you only have 10 people per circle, you don't have real debate, you have groupthink).

**ZAO-Specific Surfaces:**
- Fractal calls: Monday 6pm EST, synchronous, required for consensus (doc 703). Time-zone exclusive, excludes night workers, excludes parents on bedtime duty.
- Voluntary participation: No penalty for absence, no "attendance requirement." If members stop showing up, they silently fall out.
- Fractal fatigue: After 100+ weeks, meeting every week is exhausting (doc 718e, Rachmany's democracy-fatigue research).

**Triggering Conditions:**
- Fractal attendance drops below 50% of active members for 3+ consecutive weeks.
- Unique members in fractals drops 30% month-over-month.
- Average breakout-group size drops below 3 (minimum for consensus to be meaningful).
- Fractal session is cancelled due to "not enough members showed up."

**Early-Warning Signals:**
1. **Attendance rate:** (unique members in this week's fractal) / (active members in community). Baseline: 60-80%. Alert if drops below 40%.
2. **Core-member bias:** Count how many members appear in the top 10 "most-frequent" fractal attendees. If >70% of submitted rankings come from top 10 members, core-concentration is happening.
3. **Breakout-group size distribution:** Track average group size. If dropping below 4, deliberation becomes shallow.
4. **Meeting-time accessibility:** Log how many members request async alternatives or "non-6pm" times. If >20% request changes, consider hybrid model.
5. **Fatigue signals in Discord:** Monitor for "I'm burned out on fractals" messages. Manual review quarterly.

**Blast Radius:**
- **Immediate:** Governance becomes unrepresentative (only 20% of members actually vote).
- **Medium-term:** Decisions lack legitimacy (decided by a tiny group in a big DAO).
- **Long-term:** Fractal becomes "theater"—votes happen, but the actual decision-maker is whoever happens to show up.

**Severity:** MODERATE. Gradual degradation, easy to miss.

---

### FAILURE CLASS 7: Veto Gridlock (Derived from Rachmany: "Code Isn't Like Forking a River")

**What breaks:** OREC's 72h veto window is designed as a safety-stop: if a Fractal circle's ranking is clearly wrong, the broader community can veto it before Respect mints. But if veto becomes weaponized—minor disagreements trigger vetoes, governance becomes paralyzed—decisions stall and trust erodes.

**ZAO-Specific Surfaces:**
- Veto mechanics: During the 72h veto window, anyone with sufficient Respect can propose a veto (doc 942 states "1000 Respect threshold," doc 981 says threshold is "2.6% of OG supply"). If veto passes, execution halts, ranking is thrown out, Fractal re-votes (doc 703).
- Veto legitimacy: A veto is legitimate if the Fractal circle made a clear mistake (wrong member ranked, fraud detected, process violated). A veto is illegitimate if it's just "I disagree with the ranking and I have enough Respect to block it."
- Current state: doc 703/981 show zero veto-related incidents documented, suggesting vetoes are rare or non-existent.

**Triggering Conditions:**
- A veto is filed for 3+ consecutive Fractal submissions (suddenly, consensus is questioned).
- A veto passes but the community disagrees with the veto (counter-veto pressure emerges).
- Veto cycle repeats 2+ times (Fractal A vetoed, re-voted, vetoed again; delays governance).
- Veto is filed on basis of "I just don't like this ranking" (subjective disagreement, not process violation).

**Early-Warning Signals:**
1. **Veto rate:** Track vetoes per month. Alert if veto rate exceeds 10% of all submissions (meaning 1 in 10 fractals gets challenged).
2. **Veto resolution time:** If veto → counter-veto → re-veto takes >2 weeks, gridlock is emerging.
3. **Veto legitimacy audit:** For each veto, log the reason (process violation? fraud? ranking error? pure disagreement?). If >30% are "pure disagreement," veto mechanism is being weaponized.
4. **Governance stall time:** If OREC proposals are pending resolution (not fully executed) for >30 days, stall-out is happening.

**Blast Radius:**
- **Immediate:** Governance slows to a crawl, decisions are delayed weeks.
- **Medium-term:** Members stop participating in Fractals (why bother if it gets vetoed?). Participation drops.
- **Long-term:** "OREC veto is a supermajority block" — governance becomes plutocracy again.

**Severity:** MODERATE. Depends on veto culture.

---

## Part 2: Error-Recovery Patterns

For each failure class, a concrete recovery mechanism: detection metric → containment step → recovery step → prevention.

### Recovery Pattern 1: Forking Code as if Reversible

| Phase | Action | Trigger | Owner | Timeline |
|-------|--------|---------|-------|----------|
| **Detection** | Weekly check: "How long has it been since a governance decision was amended or rolled back?" Track decision-reversal rate. | Reversal rate drops to 0% for 4+ weeks, OR a major decision post-launches with catastrophic consequences | Zaal + Governance Committee | Continuous |
| **Containment** | Immediate: call an emergency Fractal or governance meeting. Assemble a "post-mortem group" (decision-makers + affected parties). | Decision has caused measurable harm (treasury loss > 10%, partner relationship damaged, governance legitimacy questioned) | Zaal + affected parties | Within 24-48h |
| **Recovery** | (1) Document what went wrong (decision rationale vs. reality), (2) Propose amendment (Snapshot poll if reversible, or a new governance vote), (3) Execute amendment via new Fractal consensus (not unilateral), (4) If irreversible, write a public post-mortem. | Post-mortem is complete, recovery path is clear | Governance committee + Zaal | 1-4 weeks |
| **Prevention** | (1) Pre-impact analysis: before any major OREC proposal, require written "If this goes wrong, here's what breaks and how we fix it" doc, (2) Decision taxonomy: clearly mark which governance calls are reversible vs. irreversible, (3) Slower cycle time: don't accelerate Fractal cadence to "weekly vote" if deliberation depth is dropping | Once per quarter review: is the decision cycle getting faster without more deliberation? | Zaal + Governance committee | Standing rule |

### Recovery Pattern 2: Dispensable People & Onboarding Creep

| Phase | Action | Trigger | Owner | Timeline |
|-------|--------|---------|-------|----------|
| **Detection** | Quarterly onboarding health audit: walk through onboarding fresh as a new member. (a) log all explicit requirements, (b) list implicit assumptions, (c) time-to-first-contribution, (d) friction points. Compare to baseline. | Time-to-first-contribution increases 50%, OR new-member cohort shrinks for 4+ weeks, OR feedback from exit interviews mentions "too much Farcaster/crypto assumed" | ZABAL Games coordinator + ops | Every 90 days |
| **Containment** | (1) Remove one high-friction barrier each cycle (e.g., "no Farcaster required yet" or "Optimism wallet optional"), (2) Add one new accessibility option (async standoff, voice notes, etc.), (3) Recruit 1-2 new mentors if mentorship load is high | Audit reveals 5+ friction points, OR mentorship load is >5 hours/week per mentor | ZABAL coordinator | Immediately after audit |
| **Recovery** | (1) Rebuild onboarding flow if barrier analysis reveals systemic issues (e.g., "it takes 6 reading docs just to show up"), (2) Pay existing members to re-design it (ZOL bounty), (3) Pilot with next cohort | Onboarding completion rate drops 15% from baseline | Zaal + ZABAL coordinator | 2-4 weeks |
| **Prevention** | (1) Accessibility guidelines doc: "Meetings at 2-3 time slots per week (one for Asia, one for Europe, one for Americas). Async text + voice notes option for all fractals. No English-only culture. Mentors available for 1-1 intros." (2) Explicit non-requirement list: "You do NOT need: Farcaster account, Optimism wallet (yet), PhD in governance, to be a crypto expert, to be comfortable with English, to live in a certain timezone." (3) Contribution rubric: list all ZOL-eligible work (mentorship, emotional support, culture, curation, code, governance). | Once per quarter review: are barriers being added unconsciously? | Zaal + culture committee | Standing rule |

### Recovery Pattern 3: Invisible Onboarding Costs

| Phase | Action | Trigger | Owner | Timeline |
|-------|--------|---------|-------|----------|
| **Detection** | Public KPI dashboard: (1) "X% of onboarded people reached Y ZOLs within Z months" — track monthly cohorts, (2) Mentor burnout index: hours per mentor per week, (3) ZABAL spend as % of treasury | Onboarding completion rate drops 10% from baseline, OR mentorship spend drops below 10% of treasury, OR no update to KPI dashboard for 2+ months | ZABAL coordinator + treasury | Monthly |
| **Containment** | (1) Commit ZABAL budget as non-negotiable line item (e.g., "10% of treasury always budgeted for education/onboarding, separate from operational budget"), (2) If budget pressure emerges, cut something else first (not mentorship), (3) Survey mentors: "are you burning out? what would help?" | Budget pressure emerges, OR mentor burnout index spikes | Zaal + treasurer | Within 1 week |
| **Recovery** | (1) Recruit additional mentors (paid), (2) Reduce onboarding scope: instead of "teach them everything," focus on "unblock their first contribution," (3) Async onboarding: recorded mentorship sessions + self-paced docs | Onboarding completion rate stays below 60% for 2+ months | ZABAL coordinator | 2-6 weeks |
| **Prevention** | (1) Quarterly budget review: explicitly state "ZABAL Games is non-discretionary," (2) Publish onboarding ROI story annually: "This year, we mentored X people, Y reached core-contributor status, Z became Fractal participants. Cost per successful onboarding: $Z/person. Retention rate at 6 months: W%." (3) Tie ZABAL budget to membership growth: if ZAO wants to grow 50%, increase ZABAL budget 50% | Once per quarter: is onboarding explicitly prioritized in budget conversations? | Zaal + treasurer | Standing rule |

### Recovery Pattern 4: OREC Signer Centralization

| Phase | Action | Trigger | Owner | Timeline |
|-------|--------|---------|-------|----------|
| **Detection** | Track OREC submitters: (1) which wallets have called `Vote()` / `Execute()` in past 30 days, (2) submission latency (time from fractal-end to on-chain submission), (3) signer wallet health (no compromise indicators) | Only one signer (zaal.eth) has submitted in 4+ weeks, OR submission latency exceeds 6 hours in 3 consecutive weeks, OR a signer's wallet shows compromise signals | Ops + security | Weekly |
| **Containment** | Immediate: (1) Document the current 2-signer setup (zaal.eth + civilmonkey.eth), (2) Reach out to backup signer, confirm availability, (3) If backup is unavailable, identify a 3rd signer immediately and grant them submission rights | Only one signer available for 4+ weeks, OR wallet compromise suspected | Zaal | Within 24 hours |
| **Recovery** | (1) Establish signer rotation: 3+ wallets, each submits ~40% of proposals, rotation happens monthly, (2) Document signer handoff process (how do you grant signing rights, revoke them), (3) Create a signer playbook: "How to submit a Fractal to OREC" with screenshots + checklist | 2-signer setup has been in place for 6+ months without rotation | Zaal + ops | 2-4 weeks |
| **Prevention** | (1) Signer committee: establish a 3-4 person committee, each with signing rights, (2) Rotation schedule: publish a 3-month rolling schedule (who submits which fractals), (3) Succession plan: if a signer becomes unavailable, who is the immediate backup? Document it. (4) Signer diversity check: monthly review—are all signers still reachable and willing? | Standing rule: signer committee must meet quarterly to review delegation + rotation | Zaal | Quarterly |

### Recovery Pattern 5: Respect Gini Drift & Whale Capture

| Phase | Action | Trigger | Owner | Timeline |
|-------|--------|---------|-------|----------|
| **Detection** | Monthly metrics: (1) Gini coefficient (OG + ZOR combined), (2) % of Respect held by top 3, top 10, (3) unique members in fractals per week, (4) average Respect earned by new members vs. OGs | Gini exceeds 0.80, OR top 3 members hold >50% of Respect, OR same 6 members appear in every circle for 8+ weeks, OR new-member Respect velocity < 25% of OG velocity | Zaal + ops | Monthly |
| **Containment** | (1) Audit the fractal-assignment algorithm: are circles truly random, or is the same group appearing repeatedly? (2) If algorithm is biased, fix it (reseed randomizer, verify output), (3) If human bias exists (certain members are being favored), acknowledge it + pause fractals temporarily to reset | Gini spikes 10% in one month, OR same 6 members in 8+ consecutive weeks, OR audit reveals algorithm bias | Ops + Zaal | Within 1 week |
| **Recovery** | (1) Introduce "rebalancing mechanisms": new-member Respect bonus (e.g., +20 bonus points in first 3 months), (2) Respect decay: implement the votable decay proposal (doc 941) to flush old Respect and level the playing field, (3) If Gini stays high even after decay, consider hard reset: redistribute a % of Respect from high-holders to new members (requires explicit Fractal vote) | Gini stays above 0.75 for 3+ months despite interventions | Zaal + governance committee | 4-8 weeks |
| **Prevention** | (1) Standing rule: Gini is publicly reported monthly, target Gini < 0.70, (2) Diversity incentive: if this quarter's new-member Respect velocity equals OG velocity, public recognition (ZOL bonus? featured in newsletter?), (3) Rotate high-Respect members out of fractal leadership: if someone has ranked Level 6 five times, next 4 weeks they rank Level 4-5 max, to create space for new voices | Once per quarter: is Gini growing or shrinking? Is that intentional? | Zaal + governance committee | Standing rule |

### Recovery Pattern 6: Low Participation / Apathy

| Phase | Action | Trigger | Owner | Timeline |
|-------|--------|---------|-------|----------|
| **Detection** | Weekly metrics: (1) attendance rate (unique members in fractal / active members), (2) core-member concentration (% of rankings from top 10 members), (3) average group size, (4) accessibility requests (count "async alternative" requests per week) | Attendance rate drops below 40%, OR core-member concentration exceeds 70%, OR average group size drops below 4, OR 5+ accessibility requests in one week | Ops | Weekly |
| **Containment** | (1) Immediately: survey members, "What would help you attend fractal calls?" (2) Add 1-2 additional time slots (e.g., 2pm EST and 10pm EST, in addition to 6pm EST), (3) Make voice-notes-only participation an option (no need to speak live, just record a 3-min voice note) | Attendance drops below 30% in one week, OR 3 consecutive weeks of declining attendance | Ops + Zaal | Within 48 hours |
| **Recovery** | (1) Hybrid model: simultaneous in-Discord + Loom-recording + async-text-input. Members pick their medium, (2) Reduced cadence: if weekly is too much, move to bi-weekly for 1 month to assess, (3) Fatigue reset: publish "Fractal break week" every 8 weeks (skip one week to let people recover) | Attendance stays below 50% for 3+ consecutive weeks despite interventions | Zaal | 2-4 weeks |
| **Prevention** | (1) Standing rule: always offer 2+ meeting times per week (one for each major timezone), (2) Async option always available (voice notes, text summaries, recorded transcripts), (3) Monthly fatigue check-in: anonymous survey "How's your engagement level?" (Likert scale). If >30% say "burned out," activate a recovery week, (4) Recognition for loyal members: ZOL bonus for members who attend 75%+ of fractals, to incentivize consistency | Once per month: are we maintaining >60% attendance rate? If not, what needs to change? | Zaal + ops | Standing rule |

### Recovery Pattern 7: Veto Gridlock

| Phase | Action | Trigger | Owner | Timeline |
|-------|--------|---------|-------|----------|
| **Detection** | Track veto metrics: (1) veto rate (vetoes / total submissions), (2) veto resolution time, (3) reason for each veto (process violation vs. pure disagreement), (4) governance stall time (OREC proposals pending >30 days) | Veto rate exceeds 10%, OR a veto cycle repeats 2+ times (veto → re-vote → veto), OR >30% of vetoes are "pure disagreement," OR governance stall time exceeds 30 days | Ops + governance committee | Continuous |
| **Containment** | (1) Emergency governance call: assemble the veto-opposing group + the fractal circle + Zaal, (2) Mediation: understand the source of disagreement (is it process, or just taste?), (3) If process violation is confirmed, veto stands and fractal re-votes. If pure disagreement, (a) use deliberation (not voting) to reach consensus, or (b) record dissent and execute anyway if fractal majority wants to. | A veto is filed while a previous veto is still pending | Zaal + governance committee | Within 24-48 hours |
| **Recovery** | (1) Veto clarity doc: "When vetoes are legitimate and when they're not." Publish clear criteria (e.g., "A veto is legitimate if: ranking is mathematically wrong, process was violated, or fraud is suspected. A veto is NOT legitimate if: you just disagree with the ranking."), (2) If gridlock continues, move veto threshold higher (e.g., from 1000 Respect to 2000, to reduce weaponization) | Veto gridlock persists for 2+ weeks | Governance committee + Zaal | 1-2 weeks |
| **Prevention** | (1) Standing rule: veto rate target < 5% of submissions, (2) Veto legitimacy audit quarterly: review all vetoes, tally reasons, publish results, (3) Culture shift: frame veto as "safety mechanism, use sparingly" not "way to override circles you disagree with," (4) If veto rate creeps above 5%, investigate root cause (is Fractal consensus mechanism broken? is circle-assignment biased? is communication failing?) | Once per quarter: what's our veto rate? Is it rising or falling? Why? | Governance committee | Standing rule |

---

## Part 3: Circuit Breakers & Guardrails

Safe-stops that compose with ZAO's OREC 72h+72h window. These are thresholds and actions, not mechanisms yet.

### Circuit Breaker 1: Emergency Veto

**Trigger:** A single governance decision is causing catastrophic harm in real-time (e.g., artist partnership is actively harming community, Respect is being minted to malicious wallets, treasury funds are being misused).

**Who Can Trip It:** Any 3-person committee (Zaal + 2 governance committee members) can invoke emergency veto. Requires unanimous agreement.

**What It Does:** Pauses the OREC execution (prevents on-chain minting) for up to 72 hours. Triggers immediate emergency Fractal session (within 24h) to re-vote.

**Safeguard:** Cannot be used more than once per quarter (to prevent weaponization).

**Whitepaper Note:** "Emergency veto exists as a last-resort safety mechanism, not as a way to override consensus."

### Circuit Breaker 2: Signer Rotation

**Trigger:** Same signer has submitted for 4+ consecutive weeks, OR a signer becomes unavailable.

**Who Activates It:** Zaal + governance committee (with 24h notice).

**What It Does:** Rotates signing rights to the next signer in the pre-established committee. Outgoing signer documents all pending submissions (if any) and hands off to incoming signer.

**Safeguard:** Signer committee must have at least 3 members at all times.

**Whitepaper Note:** "Signer rotation prevents single-point-of-failure and distributes trust."

### Circuit Breaker 3: Fractal Pause & Reset

**Trigger:** Attendance drops below 30%, OR Gini exceeds 0.85, OR veto gridlock (no resolution for 2+ weeks).

**Who Activates It:** Zaal (with 48h community notice).

**What It Does:** Pauses Fractals for 1 week. Holds an all-hands governance meeting to diagnose the problem and reset assumptions (Do we need to rebalance Respect? Change meeting times? Take a break?).

**Safeguard:** Can only be activated once per quarter.

**Whitepaper Note:** "Fractals are durable only if the community is engaged. A pause is better than pretending to deliberate while half the room is disengaged."

### Circuit Breaker 4: Respect Rebalancing

**Trigger:** Gini exceeds 0.80, OR top 3 members hold >50% of Respect, OR new-member Respect velocity stays below 25% of OG velocity for 2+ months.

**Who Activates It:** Governance committee (with Zaal's approval).

**What It Does:** Implements one or more of:
- New-member Respect bonus (+20 points in first 3 months).
- Decay: implement doc-941's 180-day half-life (flush old Respect, give new members a chance).
- Hard reset: explicit Fractal vote to redistribute X% of Respect from high-holders to new members (requires 75%+ consensus).

**Safeguard:** Hard resets require Fractal consensus, not unilateral action.

**Whitepaper Note:** "Respect inequality is managed actively, not left to accumulate indefinitely."

### Circuit Breaker 5: Participation Floor

**Trigger:** Attendance rate drops below 40% for 2+ consecutive weeks, OR average group size drops below 3.

**Who Activates It:** Ops + Zaal.

**What It Does:** Immediately activates accessibility interventions:
- Add 1-2 additional meeting times (different timezones).
- Make voice-notes-only participation an option.
- If attendance stays below 40% after interventions, move to bi-weekly cadence.

**Safeguard:** Cadence cannot be reduced below bi-weekly (else governance loses momentum).

**Whitepaper Note:** "Participation is the lifeblood of fractal. If people stop showing up, fractal stops working."

---

## Part 4: Detection Dashboard Spec

What to measure and how often. This is a design-only spec; no implementation details.

### Core Metrics (Weekly)

| Metric | Formula | Baseline Target | Alert Threshold | Owner | Display |
|--------|---------|-----------------|-----------------|-------|---------|
| Attendance Rate | (unique members in this week's fractal) / (active members in community) | 60-80% | <40% | Ops | Public dashboard + Slack alert |
| Group Size Distribution | (average members per breakout group, median members per breakout group) | 4-5 avg, 4 median | <3 avg | Ops | Public dashboard |
| Signer Diversity | # of distinct OREC submitters in past 30 days | 2+ | <2 (only one signer) | Ops | Admin dashboard (alert to Zaal) |
| Submission Latency | (fractal-end time to on-chain submission) | <2 hours | >6 hours | Ops | Admin dashboard |
| Veto Rate | (vetoes filed this week) / (total OREC submissions) | <5% | >10% | Ops | Public dashboard + Slack alert |

### Monthly Metrics

| Metric | Formula | Baseline Target | Alert Threshold | Owner | Display |
|--------|---------|-----------------|-----------------|-------|---------|
| Gini Coefficient | Gini(OG + ZOR combined balances) | <0.70 | >0.80 | Ops | Public report |
| Top-Holder Concentration | % of Respect held by top 3, top 10 | Top 3 <35%, Top 10 <60% | Top 3 >50% or Top 10 >70% | Ops | Public report |
| Onboarding Completion Rate | (new members who reached [X ZOLs] within [Z months]) / (total new members) | >70% | <60% | ZABAL coordinator | Public KPI dashboard |
| Mentor Burnout Index | (sum of hours/week for all mentors) / (# of mentors) | <5 hours/mentor/week | >8 hours/mentor/week | ZABAL coordinator | Admin dashboard (alert to coordinator) |
| Unique Circle Members | # of distinct members who appeared in any fractal this month | Growth or stable | Decline >20% month-over-month | Ops | Public report |
| New-Member Respect Velocity | (avg Respect earned by members <3 months old) / (avg Respect earned by members >1 year old) | >50% | <25% | Ops | Admin dashboard |
| Core-Member Concentration | % of all rankings submitted by top 10 members | <60% | >70% | Ops | Public report |

### Quarterly Metrics

| Metric | Formula | Baseline Target | Alert Threshold | Owner | Display |
|--------|---------|-----------------|-----------------|-------|---------|
| Onboarding Audit Results | (# of friction points in fresh onboarding walk-through) | <5 major friction points | >7 | ZABAL coordinator | Public report |
| ZABAL Spend as % of Treasury | (ZABAL budget spent this quarter) / (total treasury spending) | >10% | <8% (trigger budget review) | Treasurer | Public report |
| Decision Reversal Rate | (# of governance decisions amended or rolled back) / (total decisions) | >5% | 0% for 2+ quarters (decision-making quality concern) | Governance committee | Admin review |
| Veto Legitimacy Breakdown | (% of vetoes due to process violation vs. pure disagreement) | >70% legitimate (process/fraud), <30% disagreement | >50% pure disagreement (veto is weaponized) | Governance committee | Admin report |
| Mentorship Load Balance | (# of mentors with >8 hours/week) | <20% | >50% (burnout) | ZABAL coordinator | Admin review |
| Member Satisfaction (via survey) | NPS-style question "How engaged are you in ZAO Fractal?" (Likert 1-5) | Avg >3.5 | Avg <3 (disengagement signal) | Ops | Admin review |

### Public vs. Admin Dashboards

**Public Dashboard** (readable by all ZAO members):
- Attendance Rate, Group Size Distribution, Veto Rate, Gini Coefficient, Top-Holder Concentration, Unique Circle Members, Core-Member Concentration.
- Monthly KPI report: onboarding completion rate, ZABAL spend %, member satisfaction.
- Quarterly decision reversal rate, veto legitimacy breakdown.

**Admin Dashboard** (Zaal + governance committee only):
- Signer Diversity, Submission Latency, Mentor Burnout Index, New-Member Respect Velocity, detailed onboarding audit results.
- Alerts when thresholds are breached.

---

## Part 5: Whitepaper Insertion Points

This framework feeds the Fractal whitepaper (doc 942). Explicit mapping:

### Chapter 9: "Limitations & Open Problems"

**Current state (per doc 942 outline):** "Plain honesty" on known gaps, doc 718e + 936 + 941 content.

**Integration:** Fold this framework's failure taxonomy into Ch 9 as:

1. **Section 9.1:** "Seven Failure Modes & How We Detect Them" — failure classes 1-7, with detection signals and triggers.
2. **Section 9.2:** "What We Cannot (Yet) Fix" — the inherent limits of fractal governance (scaling beyond 1000, making irreversible decisions, eliminating subjectivity in ranking).
3. **Section 9.3:** "Our Circuit Breakers & Guardrails" — the 5 circuit breakers that exist or will exist (emergency veto, signer rotation, fractal pause, Respect rebalancing, participation floor).
4. **Section 9.4:** "Measuring Health: What We Track Weekly/Monthly/Quarterly" — the detection dashboard, demystified for readers.

### Chapter 10: "Roadmap"

**Current state:** "Plain" roadmap on ledger reconciliation, all-members-on-chain, scaling.

**Integration:** Add a "Governance Health Roadmap" subsection:

- **Q3 2026 experiments:** Signer rotation (add 3rd signer), onboarding audit, ZABAL KPI dashboard launch.
- **Q4 2026 experiments:** Hybrid meeting model (async alternatives), Respect decay implementation (doc 941 vote), core-member rotation policy.
- **2027 experiments:** Governance pause protocol, emergency veto formalization, participiation-floor automation.

### Chapter 5-6 (Mechanism Description)

**Current state:** Description of how OREC + Respect work, with no mention of failure modes.

**Integration (light):** Footnotes in these chapters:

- "The 72h veto window exists to catch ranking errors or fraud before Respect mints. See Ch 9 for how we handle gridlock if this mechanism breaks."
- "Signer diversity is a safeguard against single-person failure; see Ch 9 for signer-rotation policy."

---

## Part 6: Open Decisions for Zaal

These require Zaal's judgment. Framework is designed, but thresholds and authority are policy, not tech.

### Decision 1: Gini Target

**Frame:** Respect inequality is inevitable (early members accumulate, compound). But how unequal is too unequal?

**Options:**
- (A) Gini target < 0.65 (aggressive rebalancing every quarter, hard resets likely).
- (B) Gini target < 0.75 (moderate rebalancing, decay policy + new-member bonuses).
- (C) Gini target < 0.85 (light touch, only intervene if inequality is extreme).

**Implications:**
- (A) = more governance time spent on rebalancing, less time on mission work. Higher new-member inclusion.
- (B) = middle ground, reactive rebalancing, okay for moderate scale (200-500 members).
- (C) = "let inequality grow, intervene only at crisis point" = easier day-to-day, but risks plutocracy.

**Recommendation:** (B) for ZAO's current scale. Re-evaluate at 500+ members.

### Decision 2: Who Can Trigger Circuit Breakers?

**Frame:** Emergency veto, signer rotation, fractal pause, Respect rebalancing—who has the authority to invoke these?

**Options:**
- (A) Only Zaal (fastest, but concentrates power).
- (B) Zaal + 1 other (requires buy-in, but still fast).
- (C) Zaal + 2-person committee (requires consensus, but slower).
- (D) Fractal vote (most democratic, but very slow, maybe too slow for emergencies).

**Implications:**
- (A) = risk of abuse, but fast response.
- (B) = balanced. Zaal has final say, but checks his own power.
- (C) = committee governance, slower but legitimate.
- (D) = emergency moves become politics.

**Recommendation:** (B) for most circuit breakers (Zaal + governance committee lead). (D) for Respect rebalancing (only if hard reset; soft rebalancing via (B)).

### Decision 3: Signer Committee Size & Rotation Cadence

**Frame:** How many signers should submit to OREC, and how often should they rotate?

**Options:**
- (A) 2 signers (current state), no rotation. Riskiest.
- (B) 3 signers, each submits ~40%, monthly rotation. Moderate.
- (C) 4+ signers, quarterly rotation. Most decentralized, but complex.

**Implications:**
- (A) = status quo, single-point-of-failure risk, but simple.
- (B) = good balance, 3-person committee is manageable, monthly keeps signers fresh.
- (C) = very resilient, but coordination overhead.

**Recommendation:** (B) immediately. Add civilmonkey.eth (confirmed), recruit 1 additional signer (Iman? ops lead?). 3-month rolling schedule.

### Decision 4: Participation Floor Threshold

**Frame:** At what attendance rate do fractals become unrepresentative? When do we activate interventions?

**Options:**
- (A) 50% attendance (halt fractals if <50% show up). High bar.
- (B) 40% attendance (intervene with async options if <40%). Medium bar.
- (C) 30% attendance (intervene aggressively only if <30%). Low bar, risk of governance by diehards.

**Implications:**
- (A) = stricter, fewer fractals, but each one represents majority.
- (B) = reasonable, most DAOs live at 30-50% participation.
- (C) = allows fractals at low participation, risks losing deliberative power.

**Recommendation:** (B), with automatic escalation: 40% → add async options; 30% → move to bi-weekly.

### Decision 5: Respect Decay & New-Member Bonuses (doc 941 vote parameters)

**Frame:** Should Respect decay? If so, how fast? Should new members get a head start?

**Options** (per doc 941):
- (A) No decay, no bonuses. Status quo (current), but Gini drift risk.
- (B) 180-day half-life + 20-point new-member bonus. Moderate rebalancing.
- (C) 90-day half-life + 50-point new-member bonus. Aggressive rebalancing, but constant churn.

**Implications:**
- (A) = simplest, but inequality grows.
- (B) = doc 941's recommendation, balances stability with fairness.
- (C) = new members feel welcomed, but OG members may feel devalued.

**Recommendation:** Schedule a Fractal vote on doc 941. Let the community decide; framework is neutral.

### Decision 6: Onboarding Success KPI

**Frame:** How do we measure "successful onboarding"? What's the target?

**Options:**
- (A) "Person reaches 50 ZOLs within 3 months, OR 30 ZOLs within 6 months." (achievement-based)
- (B) "Person attends 50% of fractals for 3 months OR does 1 significant contribution (project, mentorship, research)." (engagement-based)
- (C) "Person self-rates as 'engaged' in community after 6 months" + (A) or (B). (subjective + objective)

**Implications:**
- (A) = clear metric, but may exclude mentors (who give ZOLs, don't earn them).
- (B) = includes all contribution types, but harder to measure.
- (C) = most holistic, but requires survey infrastructure.

**Recommendation:** (B) + (A) as a secondary. "Success = attended 3+ fractals AND earned 30+ ZOLs, or did 1 major mentoring/project."

---

## Part 7: Framework to Whitepaper Link Map

| Framework Section | Doc 942 Chapter | Action | Status |
|---|---|---|---|
| Failure Taxonomy (Part 1) | Ch 9 "Limitations" | Fold 7 failure modes into 9.1 + 9.2 | Design-ready, awaiting integration |
| Recovery Patterns (Part 2) | Ch 10 "Roadmap" | Roadmap 7 recovery experiments into Q3-Q4-2027 timeline | Design-ready, awaiting integration |
| Circuit Breakers (Part 3) | Ch 9 "Limitations" | Add Ch 9.3 on guardrails + safety mechanisms | Design-ready, awaiting integration |
| Detection Dashboard (Part 4) | Ch 9 "Limitations" | Add Ch 9.4 on measurement + public transparency | Design-ready, awaiting integration |
| Open Decisions (Part 6) | Ch 10 "Roadmap" + Brainstorm | List 6 decisions for Zaal + leadership; request brainstorm before whitepaper draft | Blocked on brainstorm |

---

## Also See

- [Doc 1139](../1139-dao-fail-rachmany/) — Source: Rachmany's DAO-failure analysis.
- [Doc 942](../942-zao-fractal-whitepaper-outline-v2/) — Target: Fractal whitepaper outline, where this framework integrates.
- [Doc 718](../718-zao-fractal-whitepaper-foundations/) — Foundations: whitepaper research base.
- [Doc 703](../703-zao-fractal-current-state-may-2026/) — Ground truth: current state of ZAO Fractal.
- [Doc 981](../981-fractal-bot-synthesis/) — Implementation: bot + verified on-chain numbers.
- [Doc 941](../941-respect-burn-decay-proposal/) — Votable proposal: Respect decay + new-member bonuses.
- [Doc 718e](../718-zao-fractal-whitepaper-foundations/718e-critiques-failure-modes.md) — Similar failure-modes analysis for whitepaper (existing sibling).

---

## Next Actions

| Action | Owner | Type | Timeline |
|--------|-------|------|----------|
| Brainstorm Part 6 decisions (Gini target, circuit-breaker authority, signer size, participation floor, decay + bonuses, onboarding KPI) | @Zaal | Brainstorm | Before whitepaper draft |
| Fold this framework into doc 942 (Ch 9 + Ch 10 revisions) | @Zaal + @Claude | PR | After brainstorm |
| Build detection dashboard (public + admin, weekly/monthly/quarterly metrics) | @Claude / @Eng | Tool | Q3 2026 |
| Establish signer committee + rotation schedule | @Zaal + @Ops | Governance | Q3 2026 |
| Publish quarterly governance health report (metrics + decisions made) | @Zaal + @Ops | Process | Standing, starting Q3 2026 |

---

## Notes on Staleness & Verification

- **Last validated:** 2026-07-16 (date of this doc).
- **Grounded in:** Doc 1139 (Rachmany, 2024), doc 703 (on-chain state as of May 2026), doc 981 (verified numbers 2026-07-05), doc 942 (whitepaper outline current).
- **Tested against:** No implementation yet; this is design-stage. Framework is theory until Zaal's brainstorm + decisions + deployment.
- **Staleness risk:** Fractal state changes weekly. If this doc is read >3 months after 2026-07-16, re-verify against current doc 703 / 981 data and current OREC transaction count.

