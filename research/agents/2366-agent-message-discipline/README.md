---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-22
superseded-by:
related-docs: "2349, 2282, 601"
original-query: "this amount of meessges isnt tenabile either please sort though how others interacte with their agents"
tier: STANDARD
---

# 2366 - 429 unread, zero actionable: agent message discipline

> **Goal:** Zaal showed a Telegram screenshot with **429 unread** from the ZAO
> Orchestration Bot and said the volume is not tenable. Find out what is
> actually sending them, fix it, and set a contract for what an agent is
> allowed to interrupt him for.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **An agent NEVER pings for something it already fixed.** | Measured: 100% of the 429 were `loop-watchdog` announcing a self-heal, text ending "No action needed." `~/.zao/idled-loops` was empty, so the genuinely actionable branch had **never fired once**. Fixed - it logs and rolls into the existing 12:00 digest instead. |
| 2 | **If Zaal cannot DO anything about it, it is not a message.** | The industry rule, verbatim: "If a human cannot take any action in response to an alert, it should not be sent as a notification." This is the single test that kills the whole 429. |
| 3 | **Noise is a SECURITY problem here, not a UX one.** | Confirmation fatigue is a documented clickthrough vulnerability - when approvals come too often people stop reading and reflexively approve, so "the checkpoint still exists but no longer catches anything." ZAO's money/outbound/irreversible gates depend on Zaal actually reading. 429 no-ops actively degrade the gates. |
| 4 | **Risk-tier every outbound message. Only Tier 1 interrupts.** | Interrupt only for irreversible, costly, outbound, or high-blast-radius. Everything else is digest or board. |
| 5 | **This binds ME too, not just the bots.** | On 2026-08-22 this session sent Zaal three long status messages in one evening while auditing the bot that was spamming him. Same failure, different sender. The contract below applies to Claude Code sessions identically. |
| 6 | **Default to PULL, not push.** | He already has pull surfaces that cost him nothing until he looks: `/hud`, the board, `zj`, IN-FLIGHT.md. Findings belong there. A push is for the rare thing that cannot wait for him to look. |

## The measurement

`loop-watchdog.py`, VPS cron `*/4 * * * *` = **360 runs/day**. Two ping paths:

```python
if restarted:
    ping(f"Loop watchdog: {...} froze -> restarted now. No action needed.")   # <-- the 429
for loop in spun:
    ping(f"Loop '{loop}' produced the SAME thing 3x ... Why is it stuck?")     # <-- actionable
```

| Signal | Value |
|---|---|
| Cron frequency | every 4 min (360/day) |
| Unread at screenshot | **429** |
| `~/.zao/idled-loops` contents | **empty** |
| => actionable pings ever sent | **0** |
| => share of messages saying "No action needed" | **100%** |

The script was not badly written - it correctly stays silent when all loops are
healthy (`print("all loops healthy")`, no ping). The bug is subtler and more
interesting: **the loops genuinely are freezing constantly, and the watchdog
faithfully announces each successful rescue.** It is a working component
narrating its own success 360 times a day.

That the loops freeze this often is its own problem, already documented in
[doc 2349](../../infrastructure/2349-vps-loop-starvation/) ("The VPS loops burn
two cores to produce nothing"). **This doc does not fix that** - it stops the
narration. Worth being explicit: silencing the alarm does not repair the thing
the alarm was about, and 2349's cards remain open.

## What the field does (and what it says about us)

**Interrupt only when consequential.** The rule across sources: reserve
synchronous interruption for actions that are *irreversible, costly, regulated,
or high-blast-radius* - deploying to prod, sending external comms, moving money,
deleting data, changing permissions. That list is almost exactly ZAO's existing
gate list in `lane-autonomy.md` (money / public / irreversible / Zaal-only
facts). **Our gates were already right; our noise floor was not.**

**The suppression rule.** "If an agent resolves an issue autonomously before a
human could respond, suppress the notification entirely or include it in a daily
digest." The 429 are the textbook case - the loop was already restarted before
the message arrived.

**Fatigue is a vulnerability, not an annoyance.** Because reflexive approval
means "the checkpoint still exists but no longer catches anything." For ZAO this
is the sharp end: the whole safety model is that Zaal reads and taps. Every
no-op message spends down the attention that the real gate depends on.

**Pull beats push for anything periodic.** GitHub's own agentic-workflow example
runs a daily digest into Discussions rather than notifying per event - tracking
PR lifecycle, merge rates, review turnaround, and surfacing "patterns that would
otherwise vanish into the noise."

## The contract (proposed - Zaal to accept, amend, or reject)

**Tier 1 - INTERRUPT (Telegram DM).** Only:
- A gate: money, outbound, on-chain, irreversible, or a fact only Zaal knows.
- A blocker where a lane is genuinely stopped until he answers.
- Something time-critical with a real deadline (a permit, an expiring VOD).

**Tier 2 - DIGEST (one message, at a fixed time).** Everything shipped, every
self-heal, every audit that came back clean. One rollup, not N events.
`loops-report.sh --tg` already exists at 12:00 and nothing else should duplicate it.

**Tier 3 - PULL ONLY (no message ever).** Findings, PRs opened, docs written,
lane state, anything already recorded in IN-FLIGHT / the board / `/hud`. He looks
when he wants it.

**Never a message:** anything the agent already fixed; anything with no possible
human action; a repeat of something still unread; a status ping whose only
content is that the agent is alive.

### The one test

> **Can Zaal do something about this, right now, that he could not do by looking
> at the board later?** If no - it is not a message.

## Honest limits

- **This does not fix why the loops freeze.** Doc 2349 owns that and is open.
  This doc removes a symptom, and could arguably make the underlying breakage
  *less* visible - which is why the restart is still logged
  (`~/.zao/loop-watchdog.log`) and still rolls into the 12:00 digest rather than
  vanishing.
- **The other 400+ unread across ZAAL BOTZ topics were not audited** - only the
  Orchestration Bot's 429 were traced to source. Other senders may have their
  own version of this.
- Both community sources are **PARTIAL** (search-result summaries, primaries not
  fetched). The direct quotes used here are short and attributed, and the
  load-bearing measurement (the 429, the empty idled-loops file, the cron) is
  local and FULL.

## Also See

- [Doc 2349](../../infrastructure/2349-vps-loop-starvation/) - why the loops freeze in the first place; still open
- [Doc 2282](../../infrastructure/2282-fleet-output-audit/) - judge a loop by what it wrote, not whether it is alive
- `.claude/rules/noisy-signal-guard.md` - "a check that always fires is a check nobody reads." This is that rule's largest measured instance to date: 429 to 0.
- `.claude/rules/lane-autonomy.md` - the gate list the Tier 1 definition reuses
- `feedback_zoe_dm_questions_group_status` - DM = questions, group = status. The contract above refines it with a third tier (pull-only).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Accept, amend, or reject the 3-tier contract above; whatever he picks becomes a `.claude/rules/` file so it binds sessions and bots alike | @Zaal | Decision | 2026-08-24 |
| Audit the remaining ZAAL BOTZ topic senders the same way (trace to source, count actionable vs not) | @Zaal (Claude) | Audit | 2026-08-26 |
| Confirm the 12:00 `loops-report.sh --tg` digest actually includes the now-suppressed restarts, so the information is not simply lost | @Zaal (Claude) | Verify | 2026-08-24 |
| Doc 2349's open cards (why the loops freeze) - unchanged by this doc, still need doing | @Zaal | Fix | per 2349 |

## Sources

- [FULL - read on the VPS 2026-08-22] `~/bin/loop-watchdog.py` (63 lines, both ping branches), `crontab -l` (`*/4` schedule), `~/.zao/idled-loops` (empty - the proof that 0 actionable pings were ever sent), `~/.zao/loop-watchdog-state.json` (16 loops tracked).
- [FULL - Zaal's screenshot 2026-08-22] 429 unread on ZAO Orchestration Bot, preview text "Loop watchdog: zoe, coc, huma..." - matching the self-heal branch verbatim.
- [PARTIAL - search-result summary, primary not fetched] [digitalapplied - Human-in-the-Loop Escalation Design for AI Agents 2026](https://www.digitalapplied.com/blog/human-in-the-loop-escalation-design-ai-agents-2026) and [agentsyncx - AI Agent Approval Workflow Best Practices](https://agentsyncx.com/blog/ai-agent-approval-workflow-best-practices) - confirmation fatigue as a clickthrough vulnerability, risk-tiering, interrupt-only-when-consequential.
- [PARTIAL - search-result summary] [Zylos - Agent Notification Intelligence](https://zylos.ai/zh/research/2026-04-23-agent-notification-intelligence-smart-alerting-triage/) - the suppress-or-digest rule for autonomously-resolved issues.
- [PARTIAL - search-result summary] [GitHub Agentic Workflows - Agent of the Day](https://github.github.com/gh-aw/blog/2026-05-26-agent-of-the-day/) - daily digest into Discussions rather than per-event notification.
