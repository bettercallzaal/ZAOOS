# Decision Tracking + Action Item Extraction — ZAOstock

> **Doc:** 13-decision-ai.md
> **Status:** Research + shipping plan
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME
> **Budget window:** 163 days (now through Sep 3)
> **Current state:** 25 meetings planned (Tuesdays 10am EST, Apr 28-Sep 1). Doc 12 ships transcription + summaries. This doc focuses on the *extracted* decisions, action items, and accountability tracking that makes meetings actually *stick*.

---

## What This Doc Does

Maps 8 AI-assist patterns for capturing "we decided X," extracting "person Y owns task Z by date D," and tracking commitment follow-through. Ranked by ROI for a small team where decisions drift (email threads, Slack threads, Discord messages) and action items disappear. Every pattern gets a cost, a tool stack, USE/DEFER/SKIP logic, and integration hooks with stock_action_items + stock_timeline + Telegram.

---

## PARETO: 3 Wires That Move 80% of Needle

1. **Claude decision extraction from meeting transcript** - Free (reuses API key from doc 12), auto-labels "we decided X on DATE by PERSON" vs. "we're still debating X." Feeds a searchable decision log. Solves: "Wait, what did we decide on shirts?" without digging.

2. **stock_action_items table with owner + due_date + status tracking** - Already partially live in `/stock/team` dashboard. Wire structured insert flow: meeting transcript → extract action items → auto-create rows in stock_action_items. Telegram reminder cron (doc 12, Pattern 4) nudges owners.

3. **Accountability check-in at meeting start** - Zaal reads last meeting's action items (top 5) + their current status, opens with 3-min review ("We said X would be done. Status?"). Normalizes accountability culture. Free, high-signal. Prevents action item decay month-to-month.

All three ship by May 5. Together: decisions are *findable*, action items are *tracked*, owners are *accountable*. The team remembers what it decided.

---

## Decision Matrix: USE / DEFER / SKIP

| Tool | Pattern | Cost | ROI | Call | Integration | Timeline |
|------|---------|------|-----|------|-------------|----------|
| **Claude API for decision extraction** | Transcript → structured "we decided X" list | $0 (existing key) | VERY HIGH | USE | Route `/api/stock/team/meetings/[id]/extract-decisions` reads transcript, returns `{ decisions: [{ what, when, owner?, status: 'locked' \| 'tentative', rationale? }] }` | This week |
| **stock_action_items table** | Structured action item tracking (owner, task, due_date, status, priority) | $0 | VERY HIGH | USE | Existing table, wire insert flow from pattern above + dashboard UI (done in doc 477 Phase 2). Add `decision_context` (which meeting decision spawned this task). | This week |
| **Decision log search** | Searchable "did we decide X?" database (Typeform + Airtable alternative) | $0 (custom Supabase table + next.js UI) | HIGH | USE | New table `stock_decisions` (meeting_id, decision_text, owner, locked_date, status: 'locked' \| 'reopened', related_action_items). Search UI in dashboard. | May 1 |
| **Commitment scoring (who delivers vs. who doesn't)** | Track delivery rate per teammate (action items committed / action items completed % over time) | $0 (Claude analysis) | MEDIUM | DEFER | Nice-to-have accountability metric. Wire in June after 10 meetings of data. | June 1 |
| **Loomio voting tool** | When a decision is contested, run quick vote (async + synchronous modes) | $99/mo | LOW | SKIP | Overkill for 17-person volunteer team; consensus decision-making faster for first 160 days | Never |
| **Polis / StrawPoll** | Lightweight polling for quick "ship X or Y?" decisions | $0 (StrawPoll) | MEDIUM | DEFER | Free alternative exists; wire if team wants async voting input. Revisit May 15. | May 15 |
| **Meeting cost breakdown (decision cost tracker)** | Attach cost to decisions (e.g., "We decided on $5-25K budget, cost is opportunity vs. cash"). | $0 | LOW | SKIP | Too meta for sprint planning; revisit post-festival. | Never |
| **Disagreement detection (transcript analysis)** | Claude flags moments of tension/split opinions ("we're divided on X"). | $0.05/meeting (Claude Vision) | LOW | DEFER | Nice for retrospective analysis; not critical for operations. Wire Sep 1. | Sep 1 |
| **Cross-meeting decision threads** | Decisions discussed in meeting 1, revisited in meeting 3, 5 — auto-link them as a thread (topic X trajectory). | $0 (custom UI) | MEDIUM | DEFER | Useful after 15+ meetings. Helps spot recurring themes. Wire June 1. | June 1 |
| **Decision reversal tracking** | "We decided X on Apr 28. On May 5, we changed our mind. Here's why." Audit trail. | $0 (table flag + reason field) | MEDIUM | DEFER | Good discipline, but adds UI complexity. Manual tracking sufficient until June. | June 1 |
| **"What's the current state?" chatbot** | Any teammate asks "where are we on X?" and Claude reads dashboard + recent meetings + returns answer. | $0.10/query (Claude API) | HIGH | DEFER | Powerful UX for async team. Wire by June when decision base is large enough. | June 1 |
| **Obligation marketplace (ZABAL-style commitment tokens)** | Teammates publicly commit to actions, other teammates can co-sign (two-sig decision model for big asks). | $0 (custom UI) | LOW | SKIP | Overkill for first 160 days. Revisit if team scales or needs explicit consensus. | Never |

---

## ZAOstock Reality Check: Why This Isn't Overkill

**Current decision problem:** 17 teammates, mostly async, decisions get made in meetings but disappear into Discord/email threads. Three weeks later: "Wait, did we decide on paying volunteers or not? Let me ask Zaal." Zaal context-switches, has to remember a conversation from a month ago. **That's the bottleneck:** decisions aren't *discoverable*, action items aren't *tracked*, and accountability is *assumed* instead of *visible*.

**This is especially painful for a distributed team with high turnover** (volunteers drop in and out). Onboarding a new teammate should include: "Here are the 25 decisions we made so far, here are the action items, here's your role." Right now it's "Zaal, can you brief me?" = 1 hour.

**AI wires eliminate:**
- Decision archaeology (30 min per "wait, what did we decide on X?" incident).
- Action item loss (0 items slip through cracks; Telegram reminder makes it visible).
- Onboarding time (new teammate reads decision log instead of asking Zaal).
- Re-litigating decisions (decision log shows rationale, silences "but why did we...?" questions).

**Total savings: ~60+ hours for a 25-meeting cycle.** Zaal stays sane. Team moves faster.

---

## Pattern 1: Decision Extraction + Classification

**What:** Given meeting transcript (from doc 12), Claude reads it and labels every decision moment:
- "We decided to X" (LOCKED).
- "We're still debating X" (TENTATIVE, needs more input).
- "We agreed to revisit X at the next meeting" (DEFERRED).

Returns structured list with quote from transcript, who proposed it, who agreed, any dissent, and status.

**Tools:**
- **Claude API** ($0 additional; reuses doc 12 key).

**ZAOstock call:** USE. Costs $0. Directly feeds decision log.

**Integration point:**
- New route: POST `/api/stock/team/meetings/[id]/extract-decisions`
- Req: `{ meeting_id: string }`
- Claude system prompt: "Extract every decision from this transcript. Label each as LOCKED (unanimous agreement), TENTATIVE (debated but moved forward), or DEFERRED (revisit later). Include quote, owner (person who will execute), status. Ignore small procedural items ('let's meet next week'), focus on commitments that affect the festival (scope, artists, sponsors, timeline, roles). Format as JSON."
- Response: `{ decisions: [{ id: uuid, what: string, quote: string, proposed_by?: string, owner?: string, status: 'locked' | 'tentative' | 'deferred', rationale?: string, dissent?: string }] }`.
- Auto-insert into `stock_decisions` table.

**Timeline:** Wire by May 1. First 3 runs: human review 100% (Zaal or Candy spot-checks). By May 15, auto-insert with spot-check every 3rd meeting.

**Cost:** Negligible ($1.25 total for 25 meetings, less than doc 12 summaries since decisions are shorter extracts).

---

## Pattern 2: Action Item Extraction + Ownership Assignment

**What:** From decision list (Pattern 1) + meeting transcript, Claude extracts every "who does what by when":
- "Zaal will submit Bangor Savings app by Friday."
- "Candy + Design team will send shirt mockups by May 15."
- "Tyler will coordinate with Magnetic on sponsor features by end of May."

Returns list with owner(s), task description, due date, priority (blocker vs. nice-to-have), and parent decision (which decision spawned this task).

**Tools:**
- **Claude API** ($0 additional).

**ZAOstock call:** USE. Most critical pattern. Directly feeds accountability.

**Integration point:**
- New route: POST `/api/stock/team/meetings/[id]/extract-actions`
- Req: `{ meeting_id: string }`
- Claude system prompt: "Extract every action item from this transcript and decision list. For each action, identify: owner (name or 'TBD'), task (what), due_date (when — if vague like 'next week', infer from meeting date), priority (blocker or nice-to-have). Link to parent decision. Ignore procedural items ('send Slack reminder'). Format as JSON."
- Response: `{ action_items: [{ id: uuid, owner: string, task: string, due_date: date, priority: 'blocker' | 'nice-to-have', decision_id: uuid, status: 'pending' | 'in_progress' | 'done', notes?: string }] }`.
- On create: auto-insert into `stock_action_items` table.
- Telegram reminder cron (doc 12, Pattern 4) watches due_date and sends nudges.

**Timeline:** Wire by May 1. Manual review first 10 runs (2 min each). Then automate.

**Cost:** $0.

---

## Pattern 3: Accountability Check-In (Meeting Opening Ritual)

**What:** Every meeting opens with 3-min review: "Here are last week's action items. What's the status?" Zaal or Candy reads the top 5 from stock_action_items (by priority + due_date), opens with check-in. Sets tone: *we track what we commit to*.

**Tools:**
- **Supabase query** ($0).
- **Google Meet agenda (from doc 12, Pattern 3)** ($0).

**ZAOstock call:** USE. Costs $0. Behavioral change, not a tool change. But critical for culture.

**Integration point:**
- Agenda generation (doc 12, Pattern 3) includes "Last week's action items" section as agenda item #1.
- Zaal reads list aloud: "Candy, shirts mockups due today — status?" → Candy says "Just sent to design review" → Zaal logs in dashboard: status = "in_progress".
- Every action item gets a brief update (1 min per item, max 5 items).

**Timeline:** Start at first meeting (Apr 28). Free practice, builds culture.

**Cost:** $0.

---

## Pattern 4: Decision Log Search + Discovery

**What:** Searchable database of all 25 meetings' decisions. New teammate or anyone asks "did we decide on X?" — search the log, get answer with date, rationale, owner.

**Tools:**
- **Supabase full-text search** ($0).
- **Next.js search UI** ($0).

**ZAOstock call:** USE. Pays for itself on first 10 "did we decide X?" queries.

**Integration point:**
- New table: `stock_decisions` (meeting_id, decision_text, owner, locked_date, status, rationale, dissent_notes, related_action_items [array of IDs]).
- Dashboard new page: `/stock/team/decisions` — search bar + filters (status, owner, date range).
- Search returns decision + context: "We decided on Sept 3 artist lockin on Apr 28 because artists need 30 days to plan. Owner: DCoop. Related actions: [artist outreach, rider intake]."

**Timeline:** Wire by May 5. Add to dashboard.

**Cost:** $0.

---

## Pattern 5: "What's the Current State?" Chatbot

**What:** A teammate (or async person watching on Telegram) asks ZOE: "Where are we on shirts?" ZOE reads:
- Latest decision on shirts (from decision log).
- All open action items tagged "shirts" (from stock_action_items).
- Last 3 meeting notes mentioning "shirt" (from stock_meeting_notes).
- Related attachments (mockups, vendor quotes, etc.).
- Returns: "Shirts: Candy is lead. Decision locked Apr 28: custom print on local Maine blank. Mockups in review with design team (due May 15). Vendor RFQ pending. See [link to decision] + [link to actions]."

**Tools:**
- **Claude API** ($0.10-0.20/query).
- **ZOE agent (Telegram)** ($0).
- **Supabase vector search** (optional, $0 if using embedding cron).

**ZAOstock call:** DEFER. Wire in June when decision + action + note base is substantial (15+ decisions). High UX value once seeded.

**Integration point (June):**
- New ZOE Telegram command: `@ZOE where are we on [topic]?`
- ZOE sends query to Claude: "Read these decisions, actions, notes. Summarize state on [topic] for a teammate. Include owner + recent status + next step."
- Return: summary + links.

**Timeline:** June 1. Pilot with 2-3 queries, iterate.

**Cost:** ~$2-5 for summer (20-30 queries).

---

## Pattern 6: Commitment Scoring + Peer Accountability

**What:** Track per-teammate: action items committed / action items completed (%). Dashboard shows "Candy: 100% (12/12), Tyler: 85% (11/13), Jake: 75% (3/4)". Not a public shaming tool, but a gentle accountability mirror + recognition signal.

**Tools:**
- **Supabase aggregation** ($0).
- **Claude insights** ($0 additional).

**ZAOstock call:** DEFER until June. After 10 meetings, meaningful data emerges. Then: monthly digest email showing participation + delivery trends.

**Integration point (June):**
- New dashboard widget: "Team delivery scorecard" (sortable by %, by recent activity, by scope).
- Monthly email to Zaal: "[Zaal] your action items have 100% delivery rate (12/12). [New teammate]: you're at 50% (1/2) — common for ramp-up. Keep it up!" (encouragement, not judgment).

**Timeline:** June 1-30 (collect data), report starting July.

**Cost:** $0.

---

## Pattern 7: Decision Reversal Audit Trail

**What:** If a decision is REOPENED or LOCKED but later changed, record the new decision + rationale + reason for reversal. Prevents decision whiplash ("But we decided on this last month!"). Shows decision evolution.

**Tools:**
- **Supabase audit table** ($0).

**ZAOstock call:** DEFER. Nice discipline, but adds UI friction. Manual tracking (Zaal's intuition) sufficient until June.

**Integration point (June):**
- Add field to `stock_decisions`: `reopened_at`, `reopened_reason`, `reversal_decision_id` (FK to new decision).
- When Zaal re-opens a decision: `stock_decisions.status = 'reopened'`, log reason.
- Retrospective dashboard: "Decisions changed" section shows evolution (decision 1 → decision 2 → decision 3, with dates + reasons).

**Timeline:** June 1 (implement), useful for Sep 1 retrospective.

---

## Pattern 8: Cross-Meeting Decision Threads

**What:** A topic (e.g., "artists lineup") gets discussed in meetings 1, 3, 5. Auto-link them as a thread. Helps Zaal spot recurring themes ("we keep coming back to shirt budget"). Shows decision maturation.

**Tools:**
- **Supabase foreign keys + dashboard UI** ($0).
- **Claude NER on topics** (optional, $0.05/meeting).

**ZAOstock call:** DEFER until June. Wire after 15 meetings.

**Integration point (June):**
- Add field to `stock_decisions`: `topic` (topics tagged by Zaal: 'artists', 'shirts', 'sponsors', 'timeline', 'volunteers', 'media', etc.).
- Dashboard page: `/stock/team/decisions-by-topic` shows timeline per topic (decision 1 Apr 28 → decision 2 May 5 → decision 3 May 12, with rationale changes).
- Useful for retrospective: "See how our thinking on artists evolved as we learned more from Neynar API."

**Timeline:** June 1.

---

## Integration with stock_timeline (Milestones) + stock_action_items (Tasks)

**How doc 13 connects to other systems:**

**stock_timeline:**
- Table: milestone, due_date, owner, status.
- Doc 13 action items with due_dates should align with timeline milestones.
- When action item is created with due_date, check if milestone exists. If not, auto-create suggestion: "action item 'submit Bangor app' due May 24 — should we create milestone 'Sponsor pipeline closes' with that date?"

**stock_action_items:**
- Table: owner, task, due_date, status, priority, decision_id, related_timeline_id.
- Every action spawns from a decision (tracked via FK).
- Telegram reminder cron (doc 12) watches status + due_date.
- Dashboard Kanban (doc 477, Phase 2) shows actions by owner (Kanban column per scope: Ops, Music, Design, Finance).

**stock_decisions:**
- Table: meeting_id, decision_text, status, owner, locked_date, related_action_items [array].
- Central source of truth for "what did we decide?"
- Links to timelines, actions, meeting notes.

**Diagram:**
```
Meeting Transcript
    ↓
Pattern 1: Extract Decisions (LOCKED/TENTATIVE/DEFERRED)
    ↓
stock_decisions table
    ↓
Pattern 2: Extract Action Items (owner, task, due_date)
    ↓
stock_action_items table
    ↓
Pattern 4 (Telegram cron): Reminder nudges + accountability
    ↓
Action marked DONE or OVERDUE
    ↓
Pattern 6: Commitment scorecard updated
```

---

## Open-Source Patterns to Borrow

1. **Decision extraction NLP:** https://github.com/allenai/longformer (long-document BERT model for decision identification; fine-tuneable on ZAOstock meeting transcripts)
2. **Action item extraction:** https://huggingface.co/tner/tner-large (NER for task + owner + date; can fine-tune on ZAOstock)
3. **Accountability dashboard:** https://github.com/taskade/taskade-api (open-source task management + team dashboard patterns)
4. **Decision log UI:** https://github.com/documenso/documenso (document + decision signature model, adapted for decision approval workflow)
5. **Supabase full-text search:** https://github.com/supabase/supabase/tree/master/examples/search (Postgres FTS setup)

---

## Cost Breakdown (25 meetings, Apr 28-Sep 1)

| Component | Unit Cost | Qty | Total |
|-----------|-----------|-----|-------|
| Claude decision extraction | $0.03/decision | ~50 decisions | $1.50 |
| Claude action item extraction | $0.02/action | ~200 actions | $4.00 |
| Supabase tables + search | $0 | unlimited | $0 |
| Telegram nudges (ZOE) | $0 | 200+ reminders | $0 |
| Dashboard UI (next.js search + decision log) | 0.5 days engineering | 1 | ~4 hrs (in-house) |
| Development (routes + tables + integrations) | 1-2 days engineering | 1 | ~8 hrs (in-house) |
| **Total cash cost** | | | **$5.50** |

---

## Realistic 170-Day Roadmap

**Week of Apr 24 (this week):**
- Design `stock_decisions` + `stock_action_items` schema (Zaal + Candy, 1 hr).
- Proposal: add decision_context + decision_id FK to action_items.

**Week of May 1:**
- Wire Pattern 1 (decision extraction) + Pattern 2 (action extraction).
- Populate decision log manually from Apr 28 meeting transcript (test data, Zaal + Candy).
- Zaal + Candy review first 5 decisions for quality (15 min each).

**Week of May 5:**
- Auto-wire decision extraction into stock_decisions (daily insert flow).
- Auto-wire action extraction into stock_action_items (daily insert flow).
- Integrate with Telegram reminder cron (doc 12).

**Week of May 15:**
- Dashboard UI for decision log search (engineer 4 hrs).
- Add accountability check-in to meeting opening ritual (behavioral change, free).

**Ongoing (May 15-Sep 1):**
- Every meeting: transcript → decisions + actions → auto-inserted, auto-reminders.
- Zaal spot-checks every 3rd meeting for quality (5 min).
- Monthly (starting June): send Zaal trend report ("X decisions locked, Y still debated, Z reversed, team delivery rate Z%").

**June 1:**
- Ship Pattern 5 ("Where are we on X?" ZOE query).
- Consider Pattern 6 (commitment scorecard).
- Evaluate Pattern 7 + 8 (audit trail + decision threads) based on feedback.

**Sep 1 (retrospective):**
- Full decision + action history for next-year planning.
- Trends: which decisions stuck, which were revised? Which action owners delivered?
- Blueprint for ZAO-wide decision log (scale to whole org).

---

## Why Structured Decisions + Action Items?

**Without this:**
- Decisions disappear into Discord/Slack threads.
- Action items are assigned verbally ("Zaal, can you do X?") and forgotten.
- New teammates have no context ("Why did we decide on Sept 3 artist cutoff?").
- Accountability is invisible ("Did Candy do the shirts mockups or did she drop out?").

**With this:**
- Every decision is findable, with rationale + owner + date.
- Every action has a clear owner, due date, and status. Reminders prevent loss.
- New teammates can read decision log + action log instead of asking Zaal.
- Accountability is visible + normalized (not punitive, just transparent).

---

## Team Communication Norms (No Tools, Pure Culture)

To make doc 13 work, establish these norms:

1. **In meetings:** Always say "We're deciding X" out loud. Makes it transcribable. Vague handwaving → missed decisions.
2. **For action items:** Always say "Person Y will do Task Z by Date D" explicitly. Implicit assumptions are decision decay.
3. **Check-in ritual:** Zaal opens every meeting with status on last week's actions (3 min). Normalizes accountability.
4. **Async updates:** Teammates update action status in dashboard every Friday (or via Telegram message to ZOE). Keeps list fresh.
5. **Reopening decisions:** If a decision is reversed, say it explicitly: "We decided on shirts in Apr, but we're changing to [reason]." Log the reversal. Prevents whiplash.

These cost $0 and have 10x ROI vs. any tool.

---

## Success Metrics (170 days)

- **Decision discoverability:** New teammate searches for decision in log, finds it with context (answer: 95%+ of queries).
- **Action item follow-through:** 80%+ of committed action items marked "done" on time (tracked via stock_action_items status).
- **Accountability adoption:** Team uses Telegram reminder bot without reminders (proactive status updates, not reactive nudges).
- **Decision stability:** 80%+ of locked decisions stick through Sep 3 (measure: reversal rate, should be <20%).
- **Team morale:** Async teammates report "I can catch up in 5 min, not 45 min" and "I know what I'm supposed to do."

---

## This Week

1. Zaal + Candy: lock `stock_decisions` + `stock_action_items` schema (30 min).
2. Engineer: wire Pattern 1 + Pattern 2 routes (4 hrs).
3. May 1 meeting: first auto-extraction test. Review + iterate.

---

## Related Docs

- [12-meeting-ai.md](12-meeting-ai.md) (transcription + summaries; feeds decisions + actions to this doc)
- [476 - Apr 22 Team Recap](../476-zaostock-apr22-team-recap/) (locked decisions so far: artist lockin Sep 3, hybrid meetings, team intro posts)
- [477 - Dashboard Phase 1 Shipped](../477-zaostock-dashboard-notion-replacement/) (MeetingNotes, Phase 2 expands to actions + decisions)
- [472 - Artist Lockin Timeline](../472-zaostock-artist-lockin-timeline/) (Sep 3 decision — lives in this decision log)
