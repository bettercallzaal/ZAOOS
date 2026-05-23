---
title: ZAOcoworkingBot Feature & UX Audit
doc: 668f
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-21
related-docs: [650, 661, 662, 665, 668]
tier: STANDARD
parent-doc: 668
---

# ZAOcoworkingBot v2.11 Feature & UX Audit

## Summary

ZAOcoworkingBot is **feature-parity incomplete** vs the cowork-zaodevz Next.js dashboard. Bot covers 8 out of 11 critical fields; dashboard supports rich editing workflows (approvals, task types, activity logs). For a **production-ready team tool**, close the field gaps and improve command discoverability.

## Top 3 Findings (P0 - P1)

### 1. MISSING: Phase field (Define/Measure/Analyze/Improve/Control)

**Severity: P0 (blocks adoption)**
- Dashboard: Full DMAIC phase selector (TaskRoom.tsx:260-267)
- Bot: Zero support. Types.ts declares `Phase` type but bot has no `/setphase` command
- Impact: Team cannot categorize work by Six Sigma phase on bot; dashboard-only feature creates friction in "what phase is this in?" workflows
- Fix: Add `cmdSetPhase()` in commands.ts (1 line of reuse from setprio/setdue pattern) + wire to index.ts + add to types.SuggestActionOp

**File:Line evidence:**
- `/tmp/cowork-fix/agent/src/types.ts:8` - Phase type defined but never mutated
- `/tmp/cowork-fix/agent/src/commands.ts:12-13` - setprio/setdue show how to pattern match + update
- Dashboard: `/Users/zaalpanthaki/Documents/cowork/src/components/TaskRoom.tsx:260-267`

---

### 2. MISSING: Task Type field (task/bug/feature/spike/epic)

**Severity: P1 (significant friction)**
- Dashboard: Full taskType dropdown with labels (TaskRoom.tsx:280-288)
- Bot: No `/settasktype` or natural-language extraction for task type
- Impact: Workers cannot flag spikes/bugs/epics in chat; all items default to "task"
- Fix: Add `taskType?: 'task'|'bug'|'feature'|'spike'|'epic'` to SuggestActionOp; wire `/settasktype <id> <type>` command

**Dashboard comparison:**
- cowork/src/lib/types.ts has `TASK_TYPES: ['task', 'bug', 'feature', 'spike', 'epic']`
- TaskRoom.tsx offers rich selector, logs changes in operational-log
- Bot: zero support

---

### 3. POOR UX: Command menu explosion + zero filtering discoverability

**Severity: P1 (adoption friction)**
- `/start` lists 23 commands in wall-of-text (index.ts:88-114)
- Users report slack: "I know about /mine, /list, /done but I forgot others exist"
- No inline help per command (e.g., `/wip` with no args says nothing; should suggest `/wip <id>` or list your WIP items)
- Dashboard has instant search + inline field hints
- Fix: 
  - Reorganize `/start` into 4 sections with subheadings
  - Add "smart" `/wip` (no args) = list your WIP items (like `/mine` filter)
  - Add inline command help via bot reply when `/wip` fails

**File:Line:**
- `/tmp/cowork-fix/agent/src/commands.ts:88-114` - wall of text /start help

---

## Complete Feature Matrix

| Feature | Bot | Dashboard | Gap | P |
|---------|-----|-----------|-----|---|
| CRUD Items | cmdAdd, cmdDone | quickCreate, updateItem | - | - |
| Status (TODO/WIP/BLOCKED/DONE) | /done, /wip, /blocked | dropdown | - | - |
| Owner (Zaal/Iman/ThyRev/etc) | /assign | dropdown | - | - |
| Priority (P1/P2/P3) | /setprio | dropdown | - | - |
| Due Date | /setdue (YYYY-MM-DD only) | input (YYYY-MM-DD) | No natural-date parsing ("tomorrow", "next Friday") | P2 |
| Notes | /setnote | textarea | - | - |
| Important flag | (parsed by LLM, not settable) | checkbox | No slash command to toggle | P2 |
| Urgent flag | (parsed by LLM, not settable) | checkbox | No slash command to toggle | P2 |
| **Phase** | none | DMAIC dropdown | **Missing entirely** | **P0** |
| **Task Type** | none | dropdown (task/bug/feature/spike/epic) | **Missing entirely** | **P1** |
| Category | /list <category> (filter only) | dropdown | Cannot CREATE with category in one shot | P2 |
| Approval workflow | none | checkbox toggle | Cannot enable requiresApproval | P1 |
| Activity log | none | detailed operational-log | No change history in bot | P2 |
| Delete item | none | DeleteSection button | No `/delete <id>` command | P2 |

---

## UX Gaps Beyond Fields

### Search & Discovery

**Gap:** `/list` searches by category only; no owner/priority/stale filtering
- Bot: `/list [category]` hardcoded to category filter (commands.ts:128-133)
- Dashboard: Multi-filter UI (Board.tsx:76-94) — search, owner, category, priority, phase, mineOnly, agingOnly
- Impact: "Show me all P1 items" or "all blocked items" requires manual scrolling after `/list`
- Fix: Add `/find <query>` that accepts "owner:Zaal", "priority:P1", "status:BLOCKED", parses naturally

**File:Line:**
- `/tmp/cowork-fix/agent/src/commands.ts:128-133` - category-only filter

---

### Bulk Operations

**Gap:** All commands act on one item at a time
- `/done 3` marks #3 done; cannot `/done 3,5,7` or `/done open mine`
- Dashboard: Can edit one task at a time but bulk-update via LLM-extracted suggestions
- Impact: "Mark all my TODOs as WIP in one go" requires 5 separate messages
- Fix: Parse comma-separated IDs in status commands; add `/done open` alias for all open items

---

### Natural-Date Parsing

**Gap:** `/setdue` requires YYYY-MM-DD; no "tomorrow" or "next Friday"
- Bot: ISO_DATE regex only (commands.ts:240)
- Dashboard: same limitation (cowork/src/components/TaskRoom.tsx:290-296)
- Impact: "Set due to next Friday" requires manual conversion outside chat
- Fix: Use existing LLM in memory.ts to parse "tomorrow" -> YYYY-MM-DD before cmdSetDue

**File:Line:**
- `/tmp/cowork-fix/agent/src/commands.ts:240` - strict ISO check

---

### Group Behavior

**Gap:** Bot responds to @mentions in groups but provides no context-switching UX
- index.ts:88-92 checks allowlist + @mention, silent drop otherwise
- User cannot ask "@bot what's blocked FOR ME vs FOR EVERYONE"
- Bot always lists grouped by owner in groups (formatItem + listGrouped)
- Impact: "What's blocked on my stuff?" in a group chat returns everything blocked
- Fix: Train LLM system prompt to extract "for me" vs "for team" from natural language; reply contextually

**File:Line:**
- `/tmp/cowork-fix/agent/src/index.ts:88-92` - allowlist + mention gate, no context hint
- `/tmp/cowork-fix/agent/src/commands.ts:51-66` - always groups by owner

---

### Notification Tuning

**Gap:** Stale-alert pings every 7 days; no way to snooze one item for 1 week
- scheduler.ts:24-25 hard-coded STALE_DAYS=14, STALE_REPING_DAYS=7
- User cannot say "this TODO is on hold, don't ping me" without blocking entire channel
- Impact: Stale alerts are all-or-nothing (keep them on or mute stale_alert channel entirely)
- Fix: Add per-item snooze logic; `/snooze <id> <days>` writes timestamp to actions.json

**File:Line:**
- `/tmp/cowork-fix/agent/src/scheduler.ts:24-25` - global stale age constants

---

### Onboarding for New Members

**Gap:** New member welcome DM is barebones
- notifyNewMember() (notifications.ts:71-98) lists 5 commands + /notify hint
- No guided first task or "here's how to use natural language" hint
- Impact: New member sees commands list, not workflow
- Fix: Expand welcome to include "message me naturally like 'add finish docs task for me due 2026-05-28'" with example extraction

**File:Line:**
- `/tmp/cowork-fix/agent/src/notifications.ts:71-98` - basic welcome

---

## Command Categorization Proposal

**Current:** 23 commands in one flat list (index.ts:247-272)

**Proposed:** Group by audience + frequency

```
DAILY DRIVER (everyone):
  /mine - your open items
  /list - all open items by owner
  /add <title> - new item (assign to self)
  /done <id> - mark done
  /wip <id> - move to WIP
  /blocked <id> <reason> - mark blocked

EDITING (everyone):
  /setdue <id> <YYYY-MM-DD> - set due date
  /setnote <id> <text> - add/replace notes
  /setprio <id> <P1|P2|P3> - set priority
  /setphase <id> <DMAIC> - set phase [NEW]
  /settasktype <id> <type> - set task type [NEW]
  /assign <id> <Owner> - reassign owner
  /setflag <id> [important|urgent] [on|off] - flag [NEW]

DISCOVERY (everyone):
  /find <query> - search (owner:X, priority:P1, etc) [NEW]
  /notify - manage proactive DM channels

ADMIN:
  /team - roster + chats
  /adduser <tg_id> <Name> [admin] - add member
  /addchat - allow group
  /reload - refresh roster
  /daily - post open-items digest

ADVANCED (expert users):
  /setmodel <provider> <model> - choose LLM
  /setkey <provider> <key> - bring your own API key
  /clearkey <provider> - remove API key
  /mymodel - show current LLM
  /providers - list available
  /autoconfirm [on|off] - skip "yes" step
  /whoami - show my ID + roster status
```

---

## Recommendation

**Timeline for adoption readiness:**

1. **This week (P0):** Add `/setphase` command (reuse setprio pattern, 10 min). Unblocks dashboard parity.
2. **Next sprint (P1):** Add `/settasktype`, reorganize `/start` into sections, add smart `/wip` with no args.
3. **Future (P2):** `/find` multi-filter, `/setflag` for important/urgent toggles, per-item snooze, bulk ops.

**Current state:** Bot is **ready for daily standup use** but **not yet a full dashboard replacement**. Phase + task-type gaps prevent teams from running full DMAIC + issue workflows via chat.

---

## Related Docs

- Doc 650: cowork-zaodevz imanagent design
- Doc 661-662: ZAOcoworkingBot design + v2 specs
- Doc 665: Hermes pattern
- cowork/ repo: Next.js dashboard reference
