---
topic: governance
type: playbook
status: published
created: 2026-08-22
last-validated: 2026-08-22
related-docs: 1227, 1774, 1765, 1481, 703, 942, 1531, 1699
tier: STANDARD
---

# 1775 — ZAO Fractal Growth Playbook

> **Purpose:** Concrete next-step actions derived from doc 1227 (Eden Fractal learnings) and doc 1774 (campaign narrative). Three themes, each with specific actions. This is the operating guide, not the pitch doc.

**The three themes:**
1. Lead with belonging, not governance tooling
2. Run 6-month seasons with deliberate ramps
3. Make participation invisible to non-technical users

---

## Theme 1: Lead with Belonging, Not Governance Tooling

### The lesson

Eden Fractal's 4+ years taught a single foundational truth: people don't adopt governance systems because governance is elegant. They adopt them because they feel something.

The emotional hook is always: **"Aren't you tired of doing this alone?"** — not "our voting mechanism is more equitable than token-weighted systems."

The ZAO Fractal's messaging has historically leaned technical. The Respect Game, OREC executor, ZOR soulbound tokens — these are real and impressive, but they're Phase 3 communication. Phase 1 is always belonging.

### Concrete next steps

#### A. Rewrite the ZAO Fractal one-line description everywhere it appears

**Current (wrong):** "ZAO Fractal is a weekly on-chain governance session using the Respect mechanism."

**New (right):** "ZAO Fractal is where ZAO members recognize each other's contributions — every Monday, on-chain, no wallet required to get started."

Update locations:
- `community.config.ts` channel description for `fractal-call`
- ZOE's pre-session reminder message in Discord
- The new member welcome packet (doc 1573)
- ZAOOS `/fractals` dashboard hero text
- Any ZOE Telegram replies that describe the fractal

#### B. Change the new member introduction sequence

**Current sequence:** New member joins → sees #fractal-call channel → reads about OREC/ZOR → confused → doesn't attend.

**New sequence:**
1. New member joins ZAO
2. ZOE DMs: "Welcome to ZAO. Every Monday at 6pm EST we run ZAO Fractal — a 60-minute call where we recognize each other's contributions for the week. No prep needed. Just show up and share what you've been working on."
3. If they attend: after the session, ZOE explains ZOR tokens (they've already participated, context makes sense now)
4. If they don't attend after 2 weeks: ZOE follows up with a peer invite (not a repeat of the system description)

**Who implements:** ZOE (ZOE ops guide is doc 1706). Zaal needs to update the new member welcome flow in ZOE's config.

#### C. Add a "belonging story" to every press mention

Any press pitch, Mirror article, or social post about ZAO Fractal should include at least one personal story: a member who showed up when they didn't have to, got recognized, and came back.

The story format:
> "[Person] joined ZAO as [a musician / a builder / an artist]. They weren't sure if they belonged. Then they attended their first Fractal session. [What happened in their session]. Now they've been coming back for [X] weeks. Their ZOR score is [N] — earned entirely from showing up and being recognized by their peers.

This is more powerful than any governance explanation. Collect 3–5 of these stories for Season 9 use.

**Who does this:** Zaal + ZOE gather stories in post-session DMs. Keep raw stories in `~/.zao/private/fractal-stories-*.txt`.

---

## Theme 2: Run 6-Month Seasons with Deliberate Ramps

### The lesson

Eden Fractal has run 12 seasons over 4 years. Each season has a theme, a boundary, and a reset. The format inside each season stays stable — the game doesn't change. What changes is the community's goal for that season.

ZAO's approach historically has been more ad-hoc. Season labels exist (doc 1481 named Seasons 1–9) but the deliberate "within-season cadence + season-boundary ritual" hasn't been executed.

The three elements Eden does that ZAO should adopt:
1. **Season theme** — a stated goal the whole community works toward
2. **Mid-season check** — at week 6, assess trajectory, course-correct if needed
3. **Season-boundary ritual** — public retrospective + celebration, then explicit close

### Concrete next steps

#### A. Season 9 Theme Statement (action: before first Africa session)

Document the Season 9 theme statement as a single sentence, post it in Discord and in ZAOOS:

> **Season 9 Theme:** "ZAO Fractal goes global — welcoming WaveWarZ Africa artists and running the first international Respect Game."

Everything in Season 9 is measured against this theme. If a decision doesn't advance this theme, it's deprioritized.

**Format for subsequent seasons:**
```
Season N Theme: [One sentence stating the season's goal]
Season N Duration: [Start date] to [End date] (~6 months / 12 sessions)
Season N Success Metric: [One measurable outcome]
```

#### B. Season 9 session ramp (first 4 weeks)

For WaveWarZ Africa onboarding, the first 4 sessions should follow a deliberate ramp — not throw them into the full on-chain protocol immediately:

| Session | Format | Goal |
|---------|--------|------|
| Session 97 (Week 1) | Full ZAO + WaveWarZ Africa members. ZAO veterans lead. Africa members observe + share. Offline voting (emoji poll). | First contact. Belong first. |
| Session 98 (Week 2) | Mixed groups, WaveWarZ Africa members in every group. Offline voting. | Integration, not observation. |
| Session 99 (Week 3) | Same format. Introduce: "This is how votes go on-chain." Show, don't require. | Demystify the tech. |
| Session 100 (Week 4) | Full protocol including on-chain submission. WaveWarZ Africa members invited to submit from their own wallets. | Full participation, fully optional. |

**If a WaveWarZ Africa member doesn't have a wallet by Session 100:** No problem. Their votes are still recorded. Wallet setup is an enabler, not a prerequisite.

**Reference:** Doc 1699 (Session 97 Africa Kickoff Runbook) for the specific facilitation plan.

#### C. Mid-season check template (use at Session 103, ~Week 6 of Season 9)

At the midpoint of every season, run a 15-minute async check using this template. ZOE can post it as a Discord poll:

```
ZAO Fractal Season 9 — Week 6 Check-In

1. How many unique WaveWarZ Africa members have attended at least 2 sessions?
   Target: 10+

2. Has any quorum failure occurred?
   Target: 0

3. Are new members understanding ZOR without asking "what is this?"
   (If >3 people asked in session, the onboarding comms need updating)
   Target: <3 confusion moments

4. Has Season 9 Theme advanced?
   Target: Yes, evidenced by [specific milestone]
```

**Who reviews:** Zaal at mid-season. ZOE surfaces the data from the Discord/Supabase.

#### D. Season-boundary retrospective ritual

At the end of every season, hold a public retrospective. The Season 8 retro (doc 1765) is the template.

The non-negotiable elements:
- **Published in ZAOOS research/** (auditable, permanent)
- **ZOR scorecard** — who earned the most Respect this season, announced publicly
- **Season grade** (1–5 on each metric)
- **Season N+1 preview** — what changes, what stays the same

The retrospective is also the moment to celebrate. Eden's "Celebrating Fractal Growth" session (their Season 12 mid-point) was one of the highest-energy sessions they ran. Public recognition is a growth accelerant.

---

## Theme 3: Make Participation Invisible to Non-Technical Users

### The lesson

Eden's 4-year rule: if someone needs to understand "smart contract," "on-chain," "wallet," or "Optimism" to participate, participation drops by ~80%.

The technical infrastructure should be completely invisible at the moment of first participation. The user's only decision: show up and share what they've been working on.

ZAO's current stack is built correctly (ZOR is soulbound, no secondary market, no wallet required to vote in Discord). The problem is the *communication* — onboarding docs and messaging often mention the tech before the community.

### Concrete next steps

#### A. Audit the new member journey for technical blockers

Walk through the experience of a brand new ZAO member who has never used crypto:

1. They join the ZAO Discord
2. They see the #fractal-call channel
3. They click into it and read the pinned message
4. They receive the ZOE welcome message
5. They attend their first Fractal session
6. They receive their first ZOR tokens
7. They try to check their ZOR balance

**For each step, check:** Is there a technical word (smart contract, wallet, Optimism, token, on-chain) that would cause a non-technical user to disengage?

If yes, rewrite that touchpoint. Replace technical vocabulary with behavior vocabulary:
- "On-chain session" → "Official session — votes get recorded permanently"
- "ZOR tokens" (on first mention) → "Recognition points" (explain ZOR later)
- "OREC Executor" → Never use this with non-technical users
- "Optimism Mainnet" → "Permanently recorded" (or omit entirely in Phase 1)

**Who audits:** Run this as a ZOE task — have ZOE draft the rewrite for each touchpoint, Zaal approves.

#### B. Create the "30-second participation path" document

This is a single-page guide that answers: "I want to participate in ZAO Fractal. What do I do right now?"

Format:
```
ZAO Fractal — Get Started in 30 Seconds

1. Join the ZAO Discord (link)
2. Show up to Monday's call at 6pm EST (invite link)
3. When it's your turn: share what you worked on this week (2 minutes)
4. Vote on your groupmates' contributions (guide is live in the call)

That's it. Everything else — tokens, governance, on-chain — comes later.
```

Post this in: #fractal-call pinned message, new member welcome packet (doc 1573), ZOE's response when someone asks "how do I join the fractal?"

#### C. Decouple wallet setup from first participation

**Current:** The Fractal Bot can auto-submit on-chain from the first session. This is technically impressive but creates an implicit expectation that members have wallets.

**Change:** Make the first session explicitly wallet-optional.

In Session 97 (Africa kickoff) and any new-node launch:
- First session: votes recorded in Discord (emoji reactions or Fractal Bot Discord poll)
- Post-session: ZOE DMs participants: "Your votes from today's session are saved. If you want them on-chain permanently, set up a wallet here: [link]. No pressure — your session still counts."
- For participants who DO have wallets: on-chain submission happens automatically (no change)

This removes the friction point for non-crypto-native members while preserving the on-chain record for those who opt in.

#### D. ZOR explanation: one sentence, no jargon

Every ZOR explanation in any ZAO communication should fit this template:

> **ZOR = your recognition record in ZAO.** You earn it by showing up and being recognized by your peers. It's permanent, can't be bought, and determines your governance weight in ZAO decisions.

That's it. No mention of ERC-1155, soulbound tokens, or Optimism in the first explanation.

Technical details are available in doc 1532 (ZOR Practical Guide) for anyone who wants them.

---

## Summary: 30-Day Action Checklist

### Week 1 (before next session)
- [ ] Update `community.config.ts` fractal channel description (Theme 1A)
- [ ] Update ZOE's new member DM to use belonging language (Theme 1B)
- [ ] Write Season 9 theme statement, post in Discord (Theme 2A)
- [ ] Write the "30-second participation path" one-pager (Theme 3B)

### Week 2–3
- [ ] Run the new member journey audit for technical blockers (Theme 3A)
- [ ] Update #fractal-call pinned message with new participation path (Theme 3B)
- [ ] Confirm Session 97 uses the 4-week Africa ramp (Theme 2B)
- [ ] Draft ZOR one-sentence explanation, update all touchpoints (Theme 3D)

### Week 4
- [ ] Collect 3 belonging stories from Season 8 members for press use (Theme 1C)
- [ ] Set calendar reminder for mid-Season 9 check-in at Session 103 (Theme 2C)
- [ ] Confirm wallet-optional flow is active for Session 97 (Theme 3C)

### Season boundary (end of Season 9)
- [ ] Publish Season 9 retro doc (using doc 1765 as template) (Theme 2D)
- [ ] Announce Season 10 theme at the Season 9 close session (Theme 2D)

---

## Related Docs

| Doc | What it covers |
|-----|----------------|
| [1227](../1227-eden-fractal-recent-meetings-learnings/) | Source material — Eden Fractal 4-year learnings |
| [1774](../1774-fractal-campaign-narrative/) | Campaign narrative (pitch, differentiation, competitive framing) |
| [1765](../1765-fractal-season8-retrospective/) | Season 8 retro — template for season-boundary retrospective |
| [1699](../../events/1699-session97-africa-kickoff-runbook/) | Session 97 Africa Kickoff Runbook |
| [1573](../1573-fractal-new-member-welcome/) | New member welcome packet (update with belonging language) |
| [1532](../1532-zor-practical-guide/) | ZOR Practical Guide (technical detail for members who want it) |
| [1706](../1706-fractal-democracy-weekly-ops-guide/) | ZOE weekly ops guide (update new member DM here) |
| [1481](../1481-fractal-season-plan/) | Season plan — Seasons 1–9 defined |
