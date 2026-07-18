---
topic: governance
type: proposal-template
status: current
last-validated: 2026-07-18
related-docs: 1475, 1540, 1553, 1524, 1542, 1561
original-query: "How do ZOR holders submit governance proposals? What's the format for the ZAOstock Oct 3 vote?"
tier: STANDARD
---

# 1565 — ZAO Fractal Governance Proposal Template

> **Who this is for:** Any ZOR holder who wants to submit a proposal for consideration at a ZAO Fractal governance vote — including the ZAOstock Oct 3 live IRL vote and weekly Thursday session votes.

---

## What Is a Governance Proposal?

A governance proposal is a structured request for ZOR holders to make a collective decision on something ZAO-wide.

**Proposals go to a governance vote when:**
- A decision affects ZAO's treasury, partnerships, or public commitments
- A decision affects how ZOR tokens are distributed or used
- A decision has community-wide implications (new partnerships, artist roster additions, platform direction)
- A facilitator brings it to the weekly Fractal session for deliberation

**Proposals do NOT require a formal vote when:**
- The decision is operational (ZOE/Zaal can execute directly)
- The decision is reversible and low-stakes
- The decision is within one team's circle (see doc 502 for ZAOstock circles)
- The proposal is really just a question or discussion topic (bring to weekly session instead)

**If in doubt:** Submit the proposal and let the facilitator decide whether it goes to a full vote.

---

## The Proposal Template

Copy and fill. Remove sections that don't apply.

```
GOVERNANCE PROPOSAL — ZAO Fractal
Submitted by: [Your name / wallet address]
Date submitted: [YYYY-MM-DD]
Target vote: [ ] Next Thursday session  [ ] ZAOstock Oct 3  [ ] Other: ___

---

TITLE
[One clear sentence describing what you're asking ZOR holders to decide]

CONTEXT (2–5 sentences)
[Why this decision is needed now. What happens if no decision is made.]

THE QUESTION
[A clear yes/no question OR a set of options — must be answerable by ZOR holders without more context]

OPTIONS
A) [Option A — specific, actionable]
B) [Option B — specific, actionable]
C) [Option C if applicable]
(D) Defer to next session

EXPECTED OUTCOME IF PASSED
[What specifically changes if Option A wins? If Option B wins?]

EVIDENCE / CONTEXT LINKS
[Any relevant ZAOOS docs, on-chain tx hashes, external sources that provide context]

WHO THIS AFFECTS
[ZOR holders / artists / ZAO community broadly / specific subgroup]

DEADLINE SENSITIVITY
[Is there a date by which this decision must be made? Why?]

PROPOSER'S RECOMMENDATION (optional)
[Which option do you support and why? Not required.]
```

---

## How to Submit

**Option A — Telegram (fastest):**
Send your proposal to ZOE (@zaoclaw_bot) with the header `GOVERNANCE PROPOSAL`. ZOE will file it in the next session's agenda doc.

**Option B — GitHub PR:**
Create a doc in `research/governance/proposals/[YYYYMMDD]-[short-title]/README.md` with the proposal template filled out. Open a PR to `main`. ZOE will pick it up from the PR.

**For the ZAOstock Oct 3 vote:**
Submit proposals by **September 15, 2026**. Zaal reviews, ZOE compiles a shortlist for ZOR holders by September 20. Proposals received after Sep 15 go to the next session, not ZAOstock.

---

## Worked Examples

### Example 1 — Charity Selection (Tight Binary)

```
TITLE
Should ZAOstock 2026 proceeds support Afri-Love Foundation or Future Beat Academy?

CONTEXT
ZAOstock expects ~$800 in merchandise proceeds + $200 in donation pool. The community has 
decided proceeds go to an Africa-connected music education nonprofit. Two candidates have 
been shortlisted after ZOR holder vetting.

THE QUESTION
Which nonprofit receives the ZAOstock 2026 proceeds?

OPTIONS
A) Afri-Love Foundation — Pan-African music access nonprofit, 501(c)(3)
B) Future Beat Academy — Beat-making education for youth in Lagos

EXPECTED OUTCOME
Winner receives ~$1,000 from ZAOstock proceeds. Zaal wires the funds within 2 weeks of Oct 3.
ZOE announces the winner from stage.

EVIDENCE
Doc 1557 (Africa Battle Week charity shortlist) — full candidate profiles and vetting notes.

WHO THIS AFFECTS
ZOR holders decide. Proceeds affect the chosen nonprofit.

DEADLINE SENSITIVITY
Must decide at ZAOstock (Oct 3) so proceeds can be disbursed by Oct 17. Cannot defer.

PROPOSER'S RECOMMENDATION
No recommendation — either nonprofit is a strong choice.
```

### Example 2 — New Member Invitation (Recommendation Round)

```
TITLE
Should the ZAO formally invite the top 3 WaveWarZ Africa Battle Week artists to join the Fractal?

CONTEXT
Africa Battle Week (Sep 12–13) will surface African artists who have already engaged with ZAO.
Inviting top performers to the Fractal is how the Africa node grows. This needs a governance 
decision because Fractal membership creates ZOR earning eligibility.

THE QUESTION
Approve inviting the top 3 Africa Battle Week artists (by battle performance + ZOR holder votes)
to attend 2 ZAO Fractal sessions as guests, with a full invite extended at session 2?

OPTIONS
A) Yes — invite top 3 (ZOE handles outreach)
B) Yes, but only invite top 1 as a starting point
C) No — wait until Africa Fractal node is formally launched first
D) Defer to next session

EXPECTED OUTCOME
Option A: ZOE sends 3 Telegram/email invites within 48 hours of ZAOstock
Option B: ZOE sends 1 invite
Option C/D: No invites until separate decision

EVIDENCE
Doc 1474 (Africa Fractal onboarding plan), Doc 1523 (new-node launch checklist)

WHO THIS AFFECTS
ZOR holders decide. 3 Africa artists affected. ZAO network grows by up to 3 members.

DEADLINE SENSITIVITY
Invites should go out within 1 week of Africa Battle Week (Sep 12–13). ZAOstock vote is ideal.

PROPOSER'S RECOMMENDATION
Option A — the Africa node needs founding members to be identified at a live event.
```

### Example 3 — Platform Direction (Season 10 Kickoff)

```
TITLE
What should be ZAO Fractal Season 10's primary focus (Oct 2026 – Jun 2027)?

CONTEXT
Season 9 = WaveWarZ Africa expansion (Oct 2025 – Sep 2026). Seasons give the Fractal a 
narrative arc. Season 10 begins at ZAOstock and needs direction so ZOE can calibrate 
what types of contribution rank highest in Fractal sessions.

THE QUESTION
What should Season 10 focus on?

OPTIONS
A) Scale — grow Africa Fractal node to 30+ members by Jun 2027
B) Depth — focus existing 188 members on ZABAL completion + on-chain governance activation
C) Distribution — prioritize WaveWarZ presence at IRL festivals beyond ZAOstock
D) Defer — let ZOR holders submit write-in proposals before committing

EXPECTED OUTCOME
The winning option becomes Season 10's stated north star. ZOE references it when framing 
weekly Fractal sessions and evaluating contributions.

EVIDENCE
Doc 1481 (season plan — Seasons 1–9 history and naming convention)
Doc 1423 (governance explainer — why season framing matters)

WHO THIS AFFECTS
All ZOR holders and Fractal participants. Affects how ZOE frames weekly sessions.

DEADLINE SENSITIVITY
Season 10 starts at ZAOstock. Decision must happen Oct 3 or Season 10 starts without direction.

PROPOSER'S RECOMMENDATION
Option A — Africa Fractal growth is the clearest continuation of Season 9 momentum.
```

---

## What Makes a Good Proposal

| Quality | What it means |
|---------|---------------|
| Single clear question | One decision per proposal. Don't bundle unrelated decisions. |
| Specific options | Each option must be actionable. "Do more" or "figure it out" are not valid options. |
| Decision is needed | There's a reason this can't be decided by ZOE/Zaal without a community vote. |
| Bounded scope | The decision affects ZAO, not the entire world. ZOR holders can see themselves affected. |
| Evidence linked | Relevant context is one click away. Don't force voters to research from scratch. |
| Deadline clear | The proposal explains why voting now matters vs next month. |

## What Makes a Weak Proposal (Will Be Tabled)

| Problem | Example |
|---------|---------|
| Question is vague | "Should ZAO focus more on Africa?" |
| No real options | "What should we do about X?" |
| Already decided | "Should ZAO keep running Fractal sessions?" |
| Doesn't require governance | "Should Zaal reach out to Hurricane about feature Y?" |
| No evidence | Claims without supporting docs or data |
| Purely personal ask | "Can ZAO fund my travel to ZAOstock?" (goes to direct request, not vote) |

---

## ZAOstock Oct 3 Vote Logistics

If your proposal is selected for the ZAOstock Oct 3 vote:

1. **Shortlist published:** Sep 20 (ZOE posts to Telegram)
2. **IRL vote window:** 2:40 PM – 3:05 PM EST at ZAOstock venue
3. **Voting method:** ZOR holders vote via Phantom wallet at wavewarz.info/vote (on projected screen)
4. **Quorum:** Minimum 10 ZOR holders casting votes for the result to be binding
5. **Result:** Zaal announces from stage at 3:05 PM
6. **On-chain record:** ZOE submits result to OREC (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`) within 24 hours
7. **Archive:** ZOE files the session doc (doc 1540 template) with vote results

For ZOR holders who cannot attend IRL: contact ZOE by Sep 30 to arrange async vote submission.

Full voting mechanics: [Doc 1553 — ZOR Holder Voting Guide](../1553-governance-zor-holder-voting-guide/)

---

## Cross-References

| Doc | What |
|-----|------|
| [1475](../1475-fractal-democracy-session-guide/) | Weekly session structure — where proposals are discussed |
| [1540](../1540-governance-session-archive-template/) | Session archive — where proposal results are filed |
| [1553](../1553-governance-zor-holder-voting-guide/) | Voting mechanics — Phantom wallet, Fractal session |
| [1524](../../events/1524-zaostock-day-of-operations-protocol/) | ZAOstock day-of protocol — includes vote schedule |
| [1542](../1542-fractal-contribution-rubric/) | Contribution rubric — for proposals about contribution types |
| [1561](../1561-fractal-presession-contribution-log/) | Pre-session log — separate from proposals (for weekly contributions) |
