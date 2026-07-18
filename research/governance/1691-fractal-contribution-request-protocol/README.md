---
topic: governance
type: protocol-spec
status: draft
last-validated: 2026-07-18
related-docs: 1481, 1542, 1475, 1532, 1553, 1568
original-query: "What is a Contribution Request in ZAO Fractal, how does it work, what's the approval flow, how are they paid out? Season 10 starts Nov 2026."
tier: STANDARD
season: 10 (Nov 2026 – Feb 2027)
---

# 1691 — ZAO Fractal Contribution Request Protocol

> **Status:** DRAFT — Season 10 (Nov 2026) will be the first CR season. This doc defines the protocol so Zaal + the community can pressure-test it before launch. Feedback welcome before Session 109.

---

## What Is a Contribution Request?

A **Contribution Request (CR)** is how ZAO community members propose specific work for the community to fund. It's the intersection of Fractal Democracy and a bounty board: you propose a task, the community evaluates it, and if approved, you complete it and earn ZOR + potentially USDC.

Think of it as the answer to: "I want to contribute to ZAO, but I don't know if my contribution is wanted or valued."

CRs make contribution bidirectional:
- **Current model (Seasons 1–9):** Show up → contribute something → get ranked → earn ZOR
- **CR model (Season 10):** Propose specific work → community approves → complete work → earn ZOR + USDC bounty

Both models coexist. CRs don't replace the Fractal session ranking — they add a funding mechanism on top.

---

## The CR Lifecycle

```
SUBMIT → REVIEW → APPROVE/REJECT → COMPLETE → PAY OUT
```

### 1. Submit (Week 1 of each month)

Anyone in the ZAO Fractal community can submit a CR. You don't need ZOR to submit, but you need to have attended at least one session (so the community knows who you are).

**Submission format:**

| Field | What to Include |
|-------|----------------|
| **Title** | One-line description (max 80 chars) |
| **Problem** | What problem does this solve for ZAO? (2-3 sentences) |
| **Deliverable** | What exactly will you produce? (be specific: "a 1000-word research doc" not "research") |
| **Timeline** | When will it be done? (specific date, not "ASAP") |
| **Requested bounty** | USDC amount + ZOR multiplier (see Tier table below) |
| **Why you** | One sentence on why you're the right person for this |

**Where to submit:** The governance proposal template (doc 1568) has a CR section. DM Zaal with the template completed, or post in the ZAO Telegram governance thread.

### 2. Review (Week 2)

Zaal reviews all submissions and determines which are:
- **Approved for community vote:** Goes to ZOR holder vote via Snapshot
- **Fast-tracked:** Approved by Zaal directly (small tasks under Tier 1)
- **Returned for revision:** Missing information or not aligned with current season priorities
- **Rejected:** Not aligned with ZAO's goals (rare — most get returned for revision first)

### 3. Community Vote (Week 2-3, for Snapshot-track CRs)

ZOR holders vote on CR approval via Snapshot. Vote runs 48 hours.

**Quorum:** At least 10 ZOR holders must vote. If quorum is not met, Zaal decides.
**Threshold:** Simple majority (>50%) to approve.

For fast-tracked CRs, Zaal's approval is sufficient.

### 4. Complete (by stated deadline)

Once approved, you have until your stated deadline to complete the work. Check-ins:
- **Midpoint:** Post a progress update in Telegram governance thread
- **Completion:** Post the finished deliverable in the same thread

If you can't complete by deadline: DM Zaal at least 48 hours before deadline. Extension may be granted once. Second extension = CR is forfeit (bounty is not paid, you keep any ZOR earned from sessions).

### 5. Pay Out (within 72 hours of completion approval)

Zaal reviews the completed deliverable. If it meets the stated deliverable spec:
- **ZOR:** Credited on-chain within 72 hours
- **USDC:** Sent to your stated wallet within 72 hours

If the deliverable doesn't meet spec: Zaal DMs with specific feedback. You have 7 days to revise. If revision is accepted, full payout. If not, Zaal decides partial payout case-by-case.

---

## CR Tiers

| Tier | Example Deliverable | Typical Bounty |
|------|---------------------|----------------|
| **Micro** | Social post, session recap, one-page doc | 0 USDC + ZOR credit |
| **Tier 1** | Research doc, tutorial, 1-2 hour task | $25–$100 USDC + ZOR |
| **Tier 2** | Multi-part doc, code PR, 4-8 hour task | $100–$500 USDC + ZOR |
| **Tier 3** | Major feature, campaign, 1-week task | $500–$2,000 USDC + ZOR |
| **Tier 4** | Season-level project, weeks of work | Custom (requires Zaal approval) |

**ZOR multiplier:** Completing a CR earns a ZOR bonus on top of your regular session ZOR. Bonus scales with tier: Micro = +10% ZOR for that week's session; Tier 1 = +25%; Tier 2 = +50%; Tier 3 = +100%.

> **Source of funds:** CR bounties come from ZAO's operating budget. For Season 10, a specific CR budget is to be set before Session 109. **GATED: Zaal sets the Season 10 CR budget before Session 109 kickoff.**

---

## What Makes a Good CR

### High approval likelihood:
- Clear, scoped deliverable (can be evaluated as done/not done)
- Addresses a current ZAO priority (Africa expansion, ZAOstock, ZOR growth)
- Realistic timeline (not "2 days" for a week of work)
- Proposer has relevant skills (shown by past sessions or portfolio)

### Low approval likelihood:
- Vague deliverable ("help with marketing")
- Outside ZAO's current season scope
- Significantly higher bounty than comparable Tier work
- No prior session attendance

---

## Season 10 Context

Season 10 (sessions 109-120, Nov 2026 – Feb 2027) is the first CR season. The theme is "Contribution Requests" — the community actively proposes what should be built, researched, or produced, instead of waiting for Zaal to assign work.

**Target:** 20+ CRs submitted across Season 10. At least 10 completed.

**What Season 10 CRs might look like:**
- Research docs for ZAO ecosystem projects (music, events, governance)
- Code contributions to ZAOOS (API routes, dashboard improvements)
- Social content (Farcaster threads, Mirror articles, Telegram copy)
- Community tasks (member outreach, artist recruiting, session facilitation)
- Technical ops (OREC improvements, DAOstar updates, Bonfire ingestion)

---

## FAQ

**"Do I need ZOR to submit a CR?"**
No — but you need to have attended at least one Fractal session. Zaal needs to know who you are.

**"Can I submit multiple CRs at once?"**
One active CR per person at a time. You can queue a second once your first is completed or rejected.

**"What if my CR overlaps with someone else's?"**
First submitted, first reviewed. If two very similar CRs come in the same week, Zaal may ask you to collaborate or pick the better-scoped one.

**"Can ZAO-US and Africa participants both submit CRs?"**
Yes. Season 10 CRs are open to any ZAO Fractal participant who has attended at least one session, regardless of geography.

**"What counts as 'completion'?"**
Whatever the stated deliverable says. "A 1000-word research doc published in ZAOOS" = done when the PR is merged. "A Farcaster thread" = done when it's posted. Specific, verifiable deliverables make approval faster.

---

## Pre-Season-10 Checklist (Zaal)

- [ ] Set Season 10 CR budget (GATED: requires Zaal decision)
- [ ] Announce CR protocol to community at Session 108 close (Season 9 graduation)
- [ ] Run a test CR during Sessions 105-107 (late Season 9) — open one CR to community to test the process before Season 10 goes live
- [ ] Set up Snapshot space or approval workflow for CR votes
- [ ] Publish this doc (1691) in the ZAO Telegram governance thread as the official CR spec before Session 109

---

## Cross-References

| Doc | What |
|-----|------|
| 1481 | Season plan: Season 10 = Contribution Requests (sessions 109-120) |
| 1568 | Governance proposal template (includes CR submission format) |
| 1542 | Fractal contribution rubric (how peer ranking works; CRs are additive) |
| 1532 | ZOR practical guide (what ZOR is, how it's earned) |
| 1553 | ZOR holder voting guide (how Snapshot voting works for CRs) |
| 1475 | Weekly session guide (context for how sessions + CRs interact) |
