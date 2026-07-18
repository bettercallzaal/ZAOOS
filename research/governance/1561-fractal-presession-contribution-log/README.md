---
topic: governance
type: operational-template
status: current
last-validated: 2026-07-18
related-docs: 1475, 1542, 1540, 1553, 1549
original-query: "How should members submit their weekly contributions before the Fractal session? What format does ZOE collect?"
tier: STANDARD
---

# 1561 — ZAO Fractal Pre-Session Contribution Log

> **Who this is for:** All ZAO Fractal participants + ZOE (who collects and formats these before each session). Submit your log by **6PM Thursday** (1 hour before the session). ZOE posts a compiled summary to Telegram at session open.

---

## Why a Pre-Session Log?

Without a pre-session log, breakout groups spend the first 5–10 minutes asking "what did you do this week?" instead of deliberating. The log:

1. **Accelerates breakout discussion** — groups read the log before ranking, not during
2. **Helps new members articulate contributions** — the format shows what's relevant
3. **Gives facilitators context** — ZOE compiles all logs and shares the digest at session start
4. **Creates a data trail** — ZOE pulls from pre-session logs when filling session archive docs (1540)
5. **Calibrates expectations** — members see what others did before claiming a high rank

---

## The Format (Copy and Fill)

**Send to ZAO Telegram or ZOE (@zaoclaw_bot) by 6PM Thursday:**

```
ZAO Fractal Pre-Session Log — [DATE]
Name: [Your name / Farcaster handle]

This week I:
• [One-line item — specific, verifiable]
• [One-line item]
• [One-line item if applicable]

Biggest ZAO impact this week:
[1–2 sentences on the thing that moved the needle most]

Works in progress (not done yet, not for ranking — just context):
• [Anything you want the group to know you're building]

Attendance: [ ] In person  [ ] Remote
```

**Example — Builder:**
```
ZAO Fractal Pre-Session Log — Jul 24
Name: Iman (zaal_dev)

This week I:
• Merged PR #2208 — response.ok guards on all fetch calls in the fractals dashboard
• Reviewed and approved PR #2199 (webhook scoring_era fix)
• Fixed a live bug in the WaveWarZ leaderboard ZOR column (PR #2159)

Biggest ZAO impact this week:
Three merged PRs that directly fix the fractals dashboard before the Africa Battle Week vote UI goes live. Blocked 2 other PRs from shipping, now they can proceed.

Works in progress:
• Mobile view of the fractals leaderboard (PR #2271 — this week)

Attendance: [x] Remote
```

**Example — Artist/Connector:**
```
ZAO Fractal Pre-Session Log — Jul 24
Name: Hurricane (wavewarz_host)

This week I:
• Onboarded 2 WaveWarZ Africa artists to the Fractal session (first-timers)
• Hosted the WaveWarZ MAIN battle (Jul 22) — 43 ZOR holder votes
• Sent Africa Battle Week charity shortlist to 12 ZOR holders for their vote by Jul 25

Biggest ZAO impact this week:
Getting 2 Africa artists to their first Fractal session and walking them through the pre-session log is the first step of the Africa node. They both submitted logs.

Works in progress:
• ZAOstock artist confirmation emails (5 remaining)

Attendance: [x] In person
```

---

## ZOE's Collection Protocol

**When:** ZOE posts the pre-session reminder at **6AM Thursday** (12 hours before deadline).

**Reminder format (ZOE posts to ZAO Telegram):**
```
📋 Fractal Session tonight — 7PM EST

Submit your pre-session contribution log by 6PM:
→ Reply to this message with your log
→ Or DM me (@zaoclaw_bot) your log

Format: research/governance/1561-fractal-presession-contribution-log/README.md

I'll compile and post the digest at 6:55PM. 🔥
```

**At 6PM:** ZOE compiles all received logs into a digest and posts to Telegram:
```
📊 Pre-Session Digest — [DATE] — [N] members submitted

[Name 1]:
• [item 1]
• [item 2]
Impact: [biggest impact sentence]

[Name 2]:
• [item 1]
...

Members attending IRL: [list]
Members attending remote: [list]
No log submitted: [list, anonymized if sensitive]
```

**At 7PM session open:** ZOE shares the digest link so breakout groups can read it before discussion starts.

**Post-session:** ZOE saves received logs to the session archive doc (doc 1540 template, field: "Pre-session logs received").

---

## What Counts as a Log Item

Good log items are **specific, verifiable, and ZAO-scoped**:

| Type | Good item | Too vague |
|------|-----------|-----------|
| Code | "Merged PR #2208 — response.ok guards" | "Did some coding" |
| Music | "Submitted 3 tracks to WaveWarZ API — tracks #441, #442, #443" | "Made music" |
| Community | "Onboarded 2 Africa artists to Fractal (first session Jul 24)" | "Talked to people about ZAO" |
| Research | "Wrote doc 1561 on pre-session log format (PR #2272)" | "Wrote some docs" |
| Events | "Confirmed 18 of 20 ZAOstock artists for Oct 3 lineup" | "ZAOstock planning stuff" |
| Governance | "Cast vote on Africa charity shortlist — chose Afri-Love Foundation" | "Did governance" |

**Guideline:** If you can't link to it (PR, doc, on-chain tx, wavewarz.info battle ID), be more specific in your description. Peers need to be able to verify.

---

## Items to Leave Out of the Log

| What | Why |
|------|-----|
| Personal life / work outside ZAO | Log is ZAO-contribution only |
| Things you plan to do (not done yet) | Put in "works in progress" section instead |
| Contributions from before this week | Weekly ranking is weekly — only this week counts |
| Vague effort ("I was active") | Peers can't evaluate this; include a specific outcome instead |
| Criticism of another member's work | The log is for your contributions, not commentary |

---

## First-Session Members: What to Submit

If this is your first Fractal session and you haven't contributed to ZAO yet:

```
ZAO Fractal Pre-Session Log — [DATE]
Name: [Your name]

This week I:
• Attended my first ZAO Fractal session [or: "my second Fractal session"]
• [Anything you did to prepare: read docs, introduced yourself, shared ZAO on social]

Biggest ZAO impact this week:
Being here and learning the protocol. I'm in my first [N] sessions.

Works in progress:
• [What I plan to contribute next week]

Attendance: [x] Remote
```

**This is a valid log.** Showing up and learning IS contribution for a first-session member. Peers know this and weigh accordingly (see doc 1542, "Tips for new members Sessions 1–6").

---

## Log History and Privacy

- Logs submitted to ZOE or Telegram are stored in session archive docs (private to ZAO members unless the session doc is published)
- Logs are not shared outside ZAO without Zaal's approval
- ZOE anonymizes logs in public-facing session summaries (e.g., OP RF evidence, press mentions)
- Members can ask ZOE to edit or remove a log within 1 hour of submission if they included something in error

---

## Cross-References

| Doc | What |
|-----|------|
| [1475](../1475-fractal-democracy-session-guide/) | Full session structure — where the log fits in the 60-min flow |
| [1542](../1542-fractal-contribution-rubric/) | What ranks high in peer review — use to calibrate what to include in your log |
| [1540](../1540-governance-session-archive-template/) | Post-session archive — where ZOE files the collected logs |
| [1553](../1553-governance-zor-holder-voting-guide/) | How to vote in the session after submitting the log |
| [1549](../1549-fractal-partner-pitch-kit/) | When pitching new nodes, explain the pre-session log as part of the onboarding routine |
