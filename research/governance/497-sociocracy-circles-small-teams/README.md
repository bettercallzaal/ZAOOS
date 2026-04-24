---
topic: governance
type: guide
status: research-complete
last-validated: 2026-04-24
tier: STANDARD
audience: ZAOstock team (18 ppl), festival ops, leadership
word-count: 550
sources: 8
---

# Sociocracy & Circles for Small Teams: ZAOstock Implementation Guide

## Core Decision: Sociocracy MVP for 18-Person Festival Team

| Factor | Sociocracy | Holacracy | Hybrid Pick |
|--------|-----------|-----------|-----------|
| Team size fit | Ideal (10-25) | Over-engineered | SOCIOCRACY |
| Training burden | Low (2-3 hours) | High (formal certs) | SOCIOCRACY |
| Entry cost | Free (guides + zoom) | USD 5K+ training | SOCIOCRACY |
| Flexibility | Highly adaptable | Fixed rulebook | SOCIOCRACY |
| Timezone scatter | Async-friendly | Sync-dependent | SOCIOCRACY |
| Volunteer retention | Better (ownership) | Worse (rigid) | SOCIOCRACY |

**Verdict: Sociocracy-lite, NOT Holacracy. Reason: scattered timezones, 18 part-time volunteers, need cultural fit (flat = ZAO DNA).**

---

## Key Decision: The MVP Pattern (80/20)

### What You Need (3 things)

1. **Seven Circles** with rotating "voice" (delegate) - music, ops, partners, merch, site, marketing, host
2. **Consent Decision-Making** - "silence = yes, objections only block if they signal harm"
3. **Rounds in Meetings** - everyone speaks once per topic, no cross-talk, clear roles (facilitator, secretary)

### What You Skip (to keep it lean)

- Double-linking (too heavy for 18 people)
- Formal Role Elections (just assign, rotate quarterly)
- General Circle (use single Slack/TG thread for cross-circle sync)
- 3-role structure in every circle (do facilitator + secretary only)

**Why this works:** Catalyst Tech Justice Network (2024) cut from 6 circles to 3, added asynchronous decision lanes, kept effectiveness. Squads (web3) dropped CEO entirely using this pattern. Panter (50+ people) still uses 10+ circles but confirms circles < 8 people move faster.

---

## Pattern 1: Picking & Rotating the "Voice" (Delegate)

### Selection Process (Consent-based, not voting)

1. **Circle decides**: "Who best represents us in the general sync?"
2. **Facilitator asks**: "Any objections to Person X being our voice?"
3. **Objections only block if they signal harm** - e.g., "X is unavailable most weeks" (valid), not "I don't like X" (opinion, not harm)
4. **Rotate every 3-4 months** or after a sprint closes (festival phases: pre-ops, sponsor, artist-confirm, on-site logistics, post-wrap)

### Real Example

Equal Care (UK cooperative, online-first): rotates facilitators every 4-5 meetings. Result: "distributes power, prevents burnout, everyone learns facilitation." No formal training needed—facilitator just reads the agenda aloud, manages rounds, names objections.

Collective Spaces Farm (Baja): rotates delegate every event cycle. Voice attends parent circle once/month, brings back decisions in 15-min update.

---

## Pattern 2: Consent Decisions in 15-20 Minutes (Async-Safe)

### The Process

1. **Proposer posts in TG** (or thread): "Decision: hire DJ from Boston or local? I propose Boston (cheaper, known engineer)."
2. **Question Round (5 min)**: Circle asks clarifying Qs. Proposer answers.
3. **Reaction Round (5 min)**: Each person says one sentence—gut feel, concern, excitement.
4. **Consent Check (3 min)**: "Objections that would cause harm?"
   - No objections = DECISION MADE. Celebrate.
   - Objection stated = "Tell me more" (1 min), amend proposal, re-check.
5. **Total: 15-20 min** if no objections; 30 min if one rounds of amendments.

### Tool: Loomio (Gold Standard)

Loomio (cooperatively owned, 2.5K GitHub stars) has built-in Consent templates:
- Sense check (test draft)
- Consent proposal (voting)
- Records reasoning forever

**Why**: async-friendly, archived, no Slack clutter. Catalyst Tech Justice + Loomio Co-op confirm this pattern works for remote teams.

### Telegram Alternative (Lighter)

Use TG bot **Ranked Choice Poll Bot** (@ranked_choice_voting_bot) or **Plurality Bot** (@pluralitybot) for quick straw polls (not binding consent, but sense-checking). **Limitation**: doesn't record reasoning. Use TG thread + pinned decision log (text file in repo or Notion) for permanent record.

---

## Pattern 3: Real Failure Modes (What Breaks)

### Anti-Pattern 1: Too Many Untrained People

**Symptom**: Rounds collapse, people cross-talk, objections are "I feel like," not harm-based.

**Fix**: 30-min async video (Ted Rau's "3 Tools from Sociocracy") watched before first meeting. Facilitator named. **Cost**: zero. **Payoff**: meetings run 50% faster.

**Why it matters for ZAOstock**: 18 people scattered (likely some in Ellsworth, some remote). Training upfront avoids 5-7 wasted meetings.

### Anti-Pattern 2: Voice Goes Silent or Leaves

**Symptom**: Delegate misses 2 parent-circle meetings; decisions pass that harm their circle.

**Fix**: Alternate voice selected at start of each phase. Brief handoff call (15 min) if voice changes mid-cycle.

**Why it matters**: Festival is 6 months → 4 decision phases. At least 2 voice rotations. Plan substitutes now.

### Anti-Pattern 3: Perfectionism ("Good Enough" vs. "Perfect")

**Symptom**: Circle keeps rejecting DJ proposal because maybe we could get someone cheaper. Talks in circles 3 weeks.

**Fix**: Reframe: "Is this safe to try and safe to reverse?" (Loomio language). DJ hire = low-cost experiment. If it doesn't work, next DJ in 2 weeks.

**Why it matters**: Festival planning has hard deadlines (artist confirmations = Sept 30, merch orders = Aug 15). Perfectionism kills timelines.

### Anti-Pattern 4: Informal Hierarchy Persists

**Symptom**: Zaal's opinion ("I think the stage should be here") is treated as binding, even in a circle supposed to decide together.

**Fix**: Name it. In ops circle: "That's Zaal's preference. Circle, any objections to moving stage to corner B?" If no harm = decide. Zaal participates as equal voice in his circle.

**Why it matters**: ZAO culture is flat, but old power dynamics creep back. Structure forces equality.

---

## Application to ZAOstock

### Seven Circles + One General Sync

| Circle | Core Members (2-4) | Voice | Cadence |
|--------|------|------|---------|
| Music | Artist relations, DJ, sound | 1 person | Bi-weekly |
| Ops | Logistics, timeline, tasks | 1 person | Weekly |
| Partners | Sponsors, community links | 1 person | Monthly |
| Merch | Apparel, vendor management | 1 person | Bi-weekly |
| Site | Parking, permits, AV setup | 1 person | Weekly (on-site daily) |
| Marketing | Social, press, announcements | 1 person | Weekly |
| Host | MC, welcome, vibe, safety | 1 person | Monthly + on-site daily |

**General Sync**: 1 thread in Telegram (pinned). Each voice reports decisions every 2 weeks. Major conflicts escalated by consent. **No weekly general meeting** (kills time). Async by default.

### Timeline

**Phase 1 (Now - June)**: Train on sociocracy, name circles, pick initial voices, hold one mock decision (10 min, practice consent).

**Phase 2 (July - Aug)**: Each circle owns its domain. 2 consent checks/week per circle. Voices report bi-weekly.

**Phase 3 (Sept 1-30)**: Accelerated, daily music circle updates. All other circles weekly. Voices attend any "all-hands" calls.

**Phase 4 (Oct 1-3 on-site)**: Facilitators + voice go real-time. Consent checks in 5 min if needed. Secretary logs decisions live.

---

## Tools Evaluation

### Top 3 Picks

| Tool | Cost | Async | Telegram Integration | Notes |
|------|------|-------|-------------------|-------|
| **Loomio** | Free (co-op) or $500/yr team | Yes (gold) | Web-only (link in TG) | Industry standard. Reasoning + archive. Best for 15+ people. |
| **Plural Bot + TG Thread** | Free | Yes (manual) | Native (@pluralitybot) | Lightweight straw polls. Use for sense-checks before formal consent. |
| **Fractal Circle Bot** | Free (open-source) | Partial | Telegram-native | New (2025). Fractal governance + TG. Voting + representative selection. Overkill for ZAOstock but watch. |

**Recommendation**: Start with **Loomio (free tier) + TG threads for daily ops**. Move to Fractal Bot after festival if ZAO repeats this model annually.

---

## Next Actions

- [ ] 1. Schedule 45-min async: Ted Rau "3 Tools" video + Q&A call with team
- [ ] 2. Draft Circle Aims & Domains doc (who, what, constraints) by May 15
- [ ] 3. Run one practice consent decision (May 30): "What snacks at on-site meeting?"
- [ ] 4. Name all voices by June 1; publish decision log template
- [ ] 5. Set rotation schedule for phase 2 (every 2 weeks)

---

## Sources

- Sociocracy For All (sociocracyforall.org) - Ted Rau's 3-Tools, process-roles guides
- Catalyst Tech Justice (2025) - Real org using sociocracy with 3 circles, remote-first
- Collective Spaces Farm (2025) - Consent decisions for land cooperative event planning
- SI Labs (2026) - 10 governance anti-patterns table
- Loomio Cooperative Handbook + GitHub (loomio/loomio, 2.5K stars, AGPL)
- Squads (Tiziano - 2024) - sociocracy30.org, CEO-less scaling
- Panter.ch (2024) - Sociocracy 3.0 in growing tech firm (10+ circles)
- HN (Project Parliament, 2026) - Multi-model OSS governance discussion

---

## Glossary

**Consent**: Decision-making where silence = yes, only harm-based objections block. Not consensus (unanimity).

**Circle**: 5-12 person semi-autonomous team with a domain and aim.

**Voice (Delegate)**: Person selected by circle to represent them in parent/general sync.

**Facilitator**: Runs meeting, manages rounds, keeps time.

**Round**: Everyone speaks once, in order, no interruptions.

**Objection**: Argument that decision would cause harm. E.g., "We can't hire DJ without confirming stage size" (valid). "I don't like that DJ" (opinion, not valid).

**Safe-to-try**: Standard for consent in lieu of perfection. Can be amended/reversed later.
