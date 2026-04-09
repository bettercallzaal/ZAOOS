# 305 - Pocket Assistant: ZOE as Flow State Support, Not Dashboard

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Redesign ZOE's interface from a broken dashboard to a pocket assistant that supports Zaal's flow state and captures ideas on the go

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Kill the dashboard mindset** | The dashboard failed after 2 days of debugging. Zaal doesn't need another screen to check. ZOE should COME TO HIM via Telegram and email, not wait for him to visit a URL |
| **Telegram is the interface** | ZOE already sends via Telegram. Make this the ONLY interface. No browser needed. Works while walking, in meetings, on the train |
| **Email is the capture tool** | zoe@zaoos.com receives forwarded links and ideas. Zaal already emails himself - just redirect to ZOE instead of self |
| **Google Calendar MCP** | USE the official Google Calendar connector in Claude AI settings. ZOE scheduled triggers can read/write calendar. Knows when Zaal is free, can add focus blocks |
| **Flow Before Phone** | Based on Rian Doris research: ZOE should NOT message Zaal before 10 AM ET (3 hours after 7 AM wake). Morning is for flow work in Claude Code, not checking agents |
| **Kill zoe.zaoos.com** | KEEP it alive as a minimal status page (read-only, no interaction needed) but stop investing in it. All interaction moves to Telegram |
| **Batch processing** | Ideas/links captured via email queue up. Zaal runs `/inbox` in Claude Code when ready - during a break, not during flow time |

---

## Comparison of Options

| Interface | When Walking | When Coding | Capture Ideas | View Agent Results | Dispatch Tasks | Calendar |
|-----------|-------------|-------------|---------------|-------------------|----------------|----------|
| **Telegram** | YES | via /vps | Forward message | ZOE sends results | Text ZOE | With Google Calendar MCP |
| **Dashboard (current)** | Broken on mobile | Tab switch | NO | Buggy | Buggy modals | NO |
| **Email (zoe@zaoos.com)** | YES - forward anything | NO | YES - primary use | NO | NO | NO |
| **Claude Code** | NO | YES - primary | /inbox skill | Direct queries | /vps dispatch | With MCP connector |

**The answer is 3 tools for 3 contexts:**
- Walking around: **Telegram** (receive) + **Email** (send to ZOE)
- Coding: **Claude Code** with `/inbox`, `/vps`, skills
- Quick glance: **Dashboard** as read-only status (no interaction)

---

## The Flow State Protocol for ZOE

Based on Rian Doris (FlowState.com, Forbes 30 Under 30, $50M revenue from flow research):

### Morning (7 AM - 10 AM ET): FLOW BLOCK - No Interruptions

- ZOE does NOT send Telegram messages before 10 AM
- ZOE daily learning tip delivers at 7 AM but is a SCHEDULED trigger, not a Telegram ping
- Zaal works in Claude Code during this block
- Any ideas captured go to email (zoe@zaoos.com) - processed later
- Calendar blocks this time as "Flow Work" automatically

### Midday (10 AM - 2 PM ET): REVIEW + DISPATCH

- ZOE sends morning brief on Telegram at 10 AM (what agents did overnight, what needs attention)
- Zaal processes `/inbox` in Claude Code (researches queued links)
- Dispatch tasks to agents for afternoon work

### Afternoon/Evening (2 PM - 10 PM ET): CAPTURE + WALK

- Ideas captured via email to zoe@zaoos.com while walking, in meetings
- ZOE processes captures in background
- Agents work on dispatched tasks
- ZOE sends end-of-day summary at 6 PM on Telegram

---

## What To Build (Minimal, No Dashboard)

### 1. Email Capture: zoe@zaoos.com (Doc 298 + Cloudflare Worker)

Already designed. Cloudflare Email Worker receives email, parses URLs/text, stores in Supabase `zoe_inbox` table. `/inbox` skill processes from Claude Code.

### 2. Google Calendar Connector

Go to https://claude.ai/settings/connectors and connect Google Calendar. This gives Claude Code and scheduled triggers the ability to:
- Read today's schedule
- Add focus blocks ("Flow Work 7-10 AM")
- See free slots for meetings
- ZOE morning agent can reference calendar in daily brief

### 3. Telegram Flow Timing

Update ZOE's SOUL.md on VPS to enforce flow timing:
```markdown
## Communication Rules
- NEVER send Telegram messages before 10 AM ET
- Morning brief: 10 AM ET daily
- End-of-day summary: 6 PM ET daily
- Urgent only: agent errors, deploy failures
- Everything else: queue for next scheduled message
```

### 4. Morning Agent Update

Update the Morning Agent scheduled trigger (currently 9 AM ET) to 10 AM ET, and add Google Calendar context to the brief.

---

## ZAO OS Integration

### Files to Modify
- `.claude/skills/vps/SKILL.md` - add flow timing rules to Telegram section
- `.claude/skills/vps/zoe-routines.md` - add morning brief timing, calendar reference
- `.claude/skills/inbox/SKILL.md` - already created, needs Cloudflare worker deployed

### Scheduled Triggers to Update
- Morning Agent: shift from 9 AM ET (1 PM UTC) to 10 AM ET (2 PM UTC)
- Add: 6 PM ET (10 PM UTC) end-of-day summary trigger (replaces research freshness)

### What the Dashboard Becomes
Keep zoe.zaoos.com alive but make it DEAD SIMPLE read-only:
- Shows agent events from last 24h (no interaction buttons)
- Shows today's calendar (if connected)
- No login, no dispatch, no modals
- Static HTML that reads Supabase, refreshes every 60s
- If it breaks, nobody cares - Telegram is the real interface

---

## What This Looks Like in Practice

**7:00 AM** - Zaal wakes up, opens Claude Code, starts flow work on ZAO OS
**7:30 AM** - Has an idea about Farcaster Snaps while coding. Emails zoe@zaoos.com from phone: "research farcaster snaps mini app integration"
**9:45 AM** - Flow block ending. Opens Telegram.
**10:00 AM** - ZOE sends morning brief: "SCOUT completed cast research. CASTER has draft waiting for approval. ROLO identified 3 outreach targets. Calendar: 11 AM call with Steve about ZAO Stock."
**10:05 AM** - Zaal replies to ZOE on Telegram: "approve caster draft" and "dispatch scout to research the link I emailed"
**10:10 AM** - Opens Claude Code, runs `/inbox` - sees the Farcaster Snaps email from earlier, runs `/zao-research` on it
**2:00 PM** - Walking to get coffee. Forwards an interesting X thread to zoe@zaoos.com
**6:00 PM** - ZOE sends EOD: "SCOUT finished Farcaster Snaps research (doc 306). CASTER published the post. 4 new items in inbox. Tomorrow: ZAO Stock planning call at 2 PM."

---

## Sources

- [Rian Doris / FlowState.com](https://www.riandoris.com/about) - Forbes 30U30, $50M flow research
- [Google Calendar MCP Connector](https://github.com/nspady/google-calendar-mcp) - official MCP server
- [Claude.ai connectors](https://claude.ai/settings/connectors) - connect Google Calendar here
- [Telegram Brain Dump Assistant](https://alexeyondata.substack.com/p/telegram-assistant) - captures ideas, processes into structured markdown
- [FlowState.com](https://www.flowstate.com) - flow research institute
