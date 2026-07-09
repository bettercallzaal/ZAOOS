---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-07
superseded-by:
related-docs: 601, 983, 985
original-query: "build our wheel and spoke with ZOE at the center and the todo list on zaocowork/thezao.xyz as the hub - loop finding more ways to bring things together"
tier: STANDARD
---

# 989 - The ZOE wheel-and-spoke: ZOE at the center, the tracker as the hub

> **Goal:** One integration picture for Zaal's whole assistant stack. The **cowork tracker (thezao.xyz)** is the hub-of-record; **ZOE** is the router at the center; every surface, agent, terminal, and data source is a **spoke** that reads/writes through the hub. This doc is the map + the build backlog (the loop's worklist).

## The shape

```
                 [ Home dashboard (cockpit) ]
                            |
   Gmail --\                |                /-- Calendar
   Airtable CRM --\   [ TRACKER HUB ]   /-- dedicated terminals
                    \   thezao.xyz     /     (finance-hq, fractal,
   Hyperagent CoS ---   tasks table   ---     zaoonparagraph, zaalcaster)
                    /       |         \
   ZOL / Hermes ---/    [ ZOE router ]  \--- the board app (TaskRoom)
                            |
                      Telegram (push + escalation)
```

- **Hub = the tasks table** (Supabase `etwvzrmlxeobinrlytza`) surfaced at thezao.xyz. Single source of truth. Everything that matters becomes a task here.
- **ZOE = the router** at the center: captures (one deduped door), dispatches, pings near-real-time, escalates the super-important ones.
- **Cockpit = the home dashboard** ("Start here today"); the **board/TaskRoom** is the detailed spoke.

## The spokes (each connects THROUGH the hub)

| Spoke | Connects by | Status |
|-------|-------------|--------|
| Dedicated terminals (finance-hq, fractal, zaoonparagraph, zaalcaster) | write their todos + "shipped X" into the tracker, tagged by terminal | decided; wiring TODO |
| Hyperagent Chief of Staff | reads Gmail/Cal/Drive/CRM -> writes tasks to the hub (daily email todo, CRM nudges) | agent exists; wiring TODO |
| Gmail | morning triage -> important-to-reply task on the hub | triage proven; automation TODO |
| Airtable CRM | source of truth; CoS reads/writes; overdue -> hub tasks | Airtable set up; export 849 + wire TODO |
| Calendar | dated hub tasks sync to the ZAO calendar (+ milestones get a [ZAO MILESTONE] prefix) | gap (doc 979); sync TODO |
| Board app (thezao.xyz) | the cockpit + TaskRoom; next_owner + theme filters (shipped) | live |
| ZOL / Hermes | agent work + fix-PRs; report to the hub | live; reporting TODO |

## The operating model (the hub's rules - doc: feedback_assistant_operating_model)

Cockpit = home -> board -> ZOE. Capture = one deduped door. Rhythm = near-real-time push. Autonomy = do-more + flag-assumptions (money/public/irreversible confirm). Pings = all 4 triggers + ZOE **resends** super-important if no Telegram reply.

## The build backlog (the loop's worklist - bring things together)

Ordered by leverage. Each is a spoke-to-hub connection or a hub capability:

1. **Capture-door dedup** - fuzzy-match a new task against open ones before insert, so ZOE/inbox/meeting/me stop creating duplicates (the "101" cause). Extend the auto-tagger reconciler.
2. **Team routing** - `primary_team`/`secondary_team` on team_members; Iman=ZAODEVZ lead, Candy=WaveWarZ; board shows your teams, collapses the rest. (Code = a PR; schema = one SQL run.)
3. **CoS daily email -> hub task** - a morning "important emails to reply to" task, drafted, on the board.
4. **next_owner escalation-resend** - ZOE re-pings super-important unacked items (operating-model rule 5).
5. **Calendar <-> hub sync** - dated tasks appear on the ZAO calendar; milestones flagged.
6. **CRM (Airtable) <-> CoS <-> hub** - export the 849 Supabase contacts to Airtable; CoS reads overdue -> hub tasks.
7. **Migration-tracker reconcile** - adopt `supabase db push` so migrations stop slipping (token_claims lesson).
8. **Terminal -> hub reporting** - each dedicated terminal writes status to the tracker.

## Also See

- [Doc 983](../../dev-workflows/983-zao-assistant-todo-workflow/) - the workflow research this builds on.
- [Doc 985](../985-claude-global-workspace-jspace/) - agent-trust substrate (relevant as ZOE/CoS get more autonomy).
- [Doc 601](../601-agent-stack-cleanup-decision/) - the 5-surface base this hub sits on.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build capture-door dedup into the task write-path + reconciler | @Zaal | PR | 2026-07-14 |
| Ship team-routing (primary/secondary team) - code PR + schema SQL | @Zaal | PR | 2026-07-13 |
| Wire the CoS daily-email-to-hub-task morning job | @Zaal | Bot | 2026-07-14 |
| Add next_owner escalation-resend to ZOE | @Zaal | Bot | 2026-07-16 |
| Sync dated hub tasks to the ZAO calendar | @Zaal | PR | 2026-07-20 |
| Export 849 Supabase contacts to Airtable; wire CoS CRM reads | @Zaal | Data | 2026-07-20 |

## Sources

- [FULL] Zaal's operating-model + wheel-spoke direction (chat 2026-07-07) + the surfaces built this session (home dashboard, board filters, auto-tagger, zaoonparagraph, the tracker). The backlog above is the plan of record.
