---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-08
superseded-by:
related-docs: "2253"
original-query: "https://www.reddit.com/r/claudeskills/s/KnCEskfZhp this might be good for us"
tier: STANDARD
---

# 2254 - Agent work should write itself to the board, with what it cost

> **Goal:** Decide what to take from Lumberjack Tasks. Answer: not the tool - we
> already have a board - but the pattern it names, which closes two gaps found
> the same day.

## The source, and why we are not adopting it

**Lumberjack Tasks** (`joseplano/LumberjackTasks`, MIT) is a self-hosted kanban
plus a Claude Code plugin. Its pitch:

> "Claude creates the ticket before it starts, moves it across the board as it
> works, and writes back the real minutes and real token count the ticket
> consumed."

And the line that lands hardest:

> "Scrolling back through a transcript is not project tracking."

**Verified 2026-08-08:** 0 stars, 0 forks, created AND last pushed 2026-07-14 -
a one-day build, untouched since. MIT, which is worth noting because two other
projects surfaced the same evening advertised "open source" while shipping BSL
1.1 and an unidentifiable licence.

**We do not want the tool.** ZAO already runs a kanban with ~357 open tasks.
Adding a second board is the opposite of the problem we have (`code-restraint.md`
rung 2 - reuse before rebuild).

## The two gaps it names, both real, both found the same day

### 1. Agent work leaves no trace on the board

On 2026-08-08 a single session deployed ZOE five times, patched and restarted
ZOL twice, put two previously-unversioned directories under git, fixed a
security hole in board authorization, and merged 15 PRs. **The board records
none of it.** Tasks were CLOSED (24 of them) but none were ever OPENED for the
work itself.

Combined with `activity_log` being 50 rows all dated 2026-05-21, the question
"what did the agent do today" is answerable only by reading a transcript - which
is exactly what the source calls not-project-tracking.

This is the same disease as [doc 2253](../../community/2253-iman-workflow-structural-frictions/)
found in the human half: Iman's work is invisible for the same reason. Neither
is a discipline problem. Nothing writes it down.

### 2. Cost is discovered, never recorded

The same evening produced two cost surprises, both discovered by accident:

- **OpenRouter exhausted** - $50.20 used against $50.00 purchased. The cause
  (six ZOL scripts defaulting to a frontier model at $50/1M output) was found by
  grepping, not from any record.
- **Supabase over quota** on THE ZAO ORG, with the culprit still unconfirmed -
  the tracker database is only 16 MB, so egress is the suspect, inferred from
  eleven modules polling it, not measured.

In both cases "what consumed this?" required an investigation. A ticket that
carries what it actually cost answers it immediately.

## Key decisions

| Decision | Why |
|---|---|
| **Do NOT adopt Lumberjack Tasks** | We have a board. A second one splits the record, which is the failure mode we are trying to fix. |
| **Take the pattern: open a task before substantial work, close it with the result AND the cost** | The board becomes a record of what happened rather than only what was intended. |
| **Reuse the existing surfaces** | `zao-tracker` already creates tasks; `feature-ran` already proves execution; `receipts.ts` already exists. This is wiring, not a new system. |
| **Threshold it** | Not every edit deserves a ticket. Something like: work that opens a PR, touches live infra, or runs longer than a few minutes. A ticket per trivial action recreates the noise problem (`noisy-signal-guard.md`). |

## What "cost" should mean here

Lumberjack records minutes and tokens. For ZAO the useful fields are wider,
because the spend is spread across surfaces:

- wall-clock minutes
- which model tier did the work (the $50/1M vs $1/1M distinction that mattered)
- PR number, if one opened
- what it touched: repo, VPS, Pi, board, external

The point is not accounting precision. It is that the next "why are we out of
credits" takes a query rather than an evening.

## Next actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Spec the open-task-on-start / close-with-cost wiring against the existing tracker CLI | @Zaal | PR | 2026-08-15 |
| Decide the threshold for what earns a ticket | @Zaal | Decision | 2026-08-15 |
| Revive or remove `activity_log` - it is stale enough to be misleading | @Zaal | Decision | 2026-08-15 |

## Sources

- Reddit r/claudeskills, "I wanted to see what Claude Code is actually working
  on and how much is left", fetched raw 2026-08-08 [FULL]
- `github.com/joseplano/LumberjackTasks` via the GitHub API - stars, forks,
  licence, created/pushed dates [FULL]
- ZAO cowork tracker + OpenRouter API + Supabase, live queries the same evening
  [FULL]

## Also see

- [Doc 2253](../../community/2253-iman-workflow-structural-frictions/) - the same
  invisibility, on the human side
- `.claude/rules/state-claims.md` - "silence is not evidence"
