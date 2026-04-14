# ZOE Daily Intelligence Pipeline - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade existing ZOE scheduled agents + VPS to become a full daily operating system: inbox processing, task management, newsletter drafting, proactive Telegram pings, and schedule-aware briefings.

**Architecture:** 3 existing RemoteTrigger agents get upgraded prompts. 2 new triggers added (nightly processor, Friday 4:30pm recap). VPS/OpenClaw gets updated SOUL.md with Telegram command recognition + task CRUD. Repo gets docs/daily/ structure for task files and captures.

**Tech Stack:** RemoteTrigger (claude.ai scheduled agents), OpenClaw (VPS Telegram), AgentMail API, Jina Reader, Supabase

---

## File Structure

### New Files
- `docs/daily/.gitkeep` -- daily briefings, tasks, captures, newsletter drafts
- `docs/weekly/.gitkeep` -- weekly recap newsletter drafts

### Modified (VPS via SSH)
- `/home/node/openclaw-workspace/SOUL.md` -- add command recognition + task CRUD
- `/home/node/openclaw-workspace/AGENTS.md` -- update schedule windows + proactive ping rules
- `/home/node/openclaw-workspace/COMMANDS.md` -- new file, all Telegram commands documented

### Modified (RemoteTrigger)
- `trig_012FUhqZtyxzGwPFktFy1Xxf` -- Morning Prep (upgrade prompt)
- `trig_01KXuM6StaK7gejfo25qzmYj` -- Evening Prep (upgrade prompt)
- `trig_017ZtkhQcEoy3wjEqZ8wGfPy` -- Friday Retro (change to 4:30pm EST + upgrade)
- NEW -- Nightly Processor (10pm EST)
- NEW -- Lunch Ping (11:25am EST)

---

### Task 1: Repo Structure + Task File Format

**Files:**
- Create: `docs/daily/.gitkeep`
- Create: `docs/weekly/.gitkeep`
- Create: `docs/daily/2026-04-13-tasks.md` (today's seed file)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p docs/daily docs/weekly
touch docs/daily/.gitkeep docs/weekly/.gitkeep
```

- [ ] **Step 2: Create today's task seed file**

```markdown
# Tasks - April 13, 2026

## Priorities
- [ ] Adrian call at 6pm EST -- prep doc at docs/call-prep/
- [ ] Fund agent wallets ($15 ETH each on Base)
- [ ] Set up Privy wallets (VAULT/BANKER/DEALER)

## Today
- [ ] Adrian call at 6pm EST
- [ ] Fund agent wallets
- [ ] Set up Privy wallets
- [ ] Review staking code on ws/zabal-staking-0411

## Carried From Yesterday
- [ ] Deploy ZabalConviction contract to Base ($0.50)

## Done Today

## Notes
- Adrian (Empire Builder) call: discuss V3 API endpoints for distribute/burn
- Prep doc: docs/call-prep/2026-04-13-adrian-empire-builder.md
```

Save to `docs/daily/2026-04-13-tasks.md`.

- [ ] **Step 3: Commit**

```bash
git add docs/daily/ docs/weekly/
git commit -m "feat(zoe): daily pipeline repo structure + task file format"
```

---

### Task 2: Nightly Processor (NEW RemoteTrigger)

Creates a new scheduled agent that runs at 10pm EST (2:00 AM UTC) every day. Processes inbox, drafts newsletter, compiles morning briefing.

**Files:**
- RemoteTrigger create (no local files)

- [ ] **Step 1: Create the nightly processor trigger**

Use `RemoteTrigger` with action `create`:

```json
{
  "name": "ZOE Nightly Processor",
  "cron_expression": "3 3 * * *",
  "job_config": {
    "ccr": {
      "environment_id": "env_017PbnwAwX8JgmqVM1rfrk9B",
      "events": [{
        "data": {
          "message": {
            "content": "<nightly processor prompt - see step 2>",
            "role": "user"
          },
          "type": "user",
          "uuid": "nightly-processor-001"
        }
      }],
      "session_context": {
        "allowed_tools": ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "WebSearch", "WebFetch"],
        "model": "claude-sonnet-4-6",
        "sources": [{"git_repository": {"url": "https://github.com/bettercallzaal/ZAOOS"}}]
      }
    }
  }
}
```

- [ ] **Step 2: Write the nightly processor prompt**

```
You are ZOE Nightly Processor. Run at 10pm EST every night. Process the day's captured ideas and prepare tomorrow.

## 1. Process Inbox (AgentMail)

Fetch unread messages from ZOE's inbox:
```bash
source .env.local 2>/dev/null
export $(grep AGENTMAIL_API_KEY .env.local | tr -d ' ')
curl -s "https://api.agentmail.to/v0/inboxes/zoe-zao@agentmail.to/messages?label=unread&limit=20" \
  -H "Authorization: Bearer $AGENTMAIL_API_KEY"
```

For each unread message:
a. Extract URLs from body text
b. For each URL, fetch clean content: curl -s "https://r.jina.ai/{URL}"
c. Categorize: idea / research / task / reference / bookmark
d. Research items: summarize findings, save to docs/daily/YYYY-MM-DD-captures.md
e. Task items: add to tomorrow's task file
f. Mark as read:
```bash
curl -s -X PATCH "https://api.agentmail.to/v0/inboxes/zoe-zao@agentmail.to/messages/{message_id}" \
  -H "Authorization: Bearer $AGENTMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"remove_labels": ["unread"]}'
```

## 2. Draft Daily Newsletter

Read today's captures file and any commits from today:
```bash
git log --since='16 hours ago' --oneline
```

Write a short daily newsletter draft (Year of the ZABAL voice):
- 2-3 paragraphs: what happened today + what's coming
- End with a mindful moment -- not a generic quote, draw from the day's context. Connect ideas, reflect on patterns, set an intention.
- Save to docs/daily/YYYY-MM-DD-newsletter.md (use TOMORROW's date)

## 3. Compile Morning Briefing

Read tomorrow's task file (carry over unfinished tasks from today).
Check git for open PRs and recent activity.
Check docs/call-prep/ for any upcoming meetings.

Write morning briefing:
```
GM Zaal. [Day of week] [Date].

TODAY'S 3 PRIORITIES:
1. [highest impact]
2. [second]
3. [third]

OVERNIGHT:
- Processed N inbox items (summary)
- Newsletter draft ready at docs/daily/YYYY-MM-DD-newsletter.md
- [PR/GitHub activity summary]

THOUGHT PROMPT:
[Connect something from today's captures to an ongoing project or idea. Be specific -- reference actual people, actual projects, actual research doc numbers.]

CALENDAR:
- [any known events for tomorrow]
```

Save to docs/daily/YYYY-MM-DD-briefing.md (TOMORROW's date).

## 4. Create Tomorrow's Task File

Create docs/daily/YYYY-MM-DD-tasks.md with:
- Carried tasks from today (anything not marked done)
- New tasks from inbox processing
- Recurring items (check Monday = fractal meeting)

## 5. Commit Everything

```bash
git add docs/daily/ docs/weekly/
git commit -m "docs: ZOE nightly processing $(date +%Y-%m-%d)"
git push origin HEAD
```
```

- [ ] **Step 3: Create the trigger via RemoteTrigger API**

- [ ] **Step 4: Verify trigger appears in list**

Run `RemoteTrigger` with action `list`, confirm "ZOE Nightly Processor" appears.

---

### Task 3: Upgrade Morning Prep Trigger

Update existing morning prep (trig_012FUhqZtyxzGwPFktFy1Xxf) to read the nightly-processed briefing and deliver it to Telegram instead of generating from scratch.

- [ ] **Step 1: Update the morning prep trigger prompt**

Use `RemoteTrigger` with action `update`, trigger_id `trig_012FUhqZtyxzGwPFktFy1Xxf`:

New prompt should:
1. Read today's briefing file from docs/daily/
2. Read today's task file from docs/daily/
3. Read today's newsletter draft from docs/daily/
4. If briefing exists (nightly processor ran): format for Telegram delivery
5. If briefing doesn't exist (nightly failed): generate one from scratch (current behavior as fallback)
6. Send to Telegram via curl to the bot API (or save as TG-ready markdown)

Keep the existing job board scanning and Farcaster engagement scanning.

- [ ] **Step 2: Change cron to 4:27 AM EST (8:27 UTC)**

```json
{
  "cron_expression": "27 8 * * 1-5"
}
```

- [ ] **Step 3: Verify update**

Run `RemoteTrigger` with action `get`, confirm updated prompt.

---

### Task 4: Add Lunch Ping Trigger (NEW)

- [ ] **Step 1: Create lunch ping trigger**

Schedule: 11:25 AM EST (3:25 PM UTC) M-F.

Prompt should:
1. Read today's task file -- what's done, what's remaining
2. Check inbox for any new items since morning
3. Check Farcaster for any mentions/replies to respond to
4. Compile 3 actionable items for the lunch window
5. Save to docs/daily/YYYY-MM-DD-lunch.md
6. Format for Telegram

```json
{
  "name": "ZOE Lunch Ping",
  "cron_expression": "27 15 * * 1-5",
  "job_config": { ... }
}
```

- [ ] **Step 2: Write the prompt** (similar structure to nightly but focused on 3 quick items)

- [ ] **Step 3: Create via RemoteTrigger API**

- [ ] **Step 4: Verify**

---

### Task 5: Update Evening Prep Trigger

Update existing evening prep (trig_01KXuM6StaK7gejfo25qzmYj) to include task status and be more action-oriented.

- [ ] **Step 1: Update prompt to read task file**

Add to existing prompt:
- Read today's task file, report what's done vs remaining
- Suggest what to tackle in the 4-7pm window based on priority + time needed
- Flag any tasks that need to carry to tomorrow

- [ ] **Step 2: Verify update**

---

### Task 6: Update Friday Retro to 4:30pm EST + Weekly Newsletter

Update existing Friday retro (trig_017ZtkhQcEoy3wjEqZ8wGfPy):
- Change time from 3pm to 4:30pm EST (8:30pm UTC = 20:30)
- Add weekly newsletter draft generation

- [ ] **Step 1: Update cron and prompt**

```json
{
  "cron_expression": "33 20 * * 5",
  "job_config": { ... updated prompt ... }
}
```

New prompt additions:
- Compile all daily captures from the week
- Draft weekly recap newsletter (longer format)
- Save to docs/weekly/YYYY-WNN-recap.md

- [ ] **Step 2: Verify update**

---

### Task 7: VPS ZOE - Command Recognition + Task CRUD

Update SOUL.md and create COMMANDS.md on the VPS so ZOE recognizes slash commands and natural language task management via Telegram.

- [ ] **Step 1: Create COMMANDS.md on VPS**

```bash
ssh zaal@31.97.148.88 'docker exec openclaw-openclaw-gateway-1 bash -c "cat > /home/node/openclaw-workspace/COMMANDS.md << '"'"'HEREDOC'"'"'
# ZOE Commands

## Task Management
- /tasks -- show today priorities and status
- /add [task] -- add a task to today
- /done [task] -- mark a task complete
- /next -- what should I do next?
- /carry [task] -- move task to tomorrow
- /priorities -- show just the top 3

## Information
- /status -- project status, open PRs, agent activity
- /inbox -- show unread inbox items
- /brief -- resend today morning briefing
- /newsletter -- show today newsletter draft

## Capture
- /idea [text] -- save an idea to docs/ideas/
- /research [topic] -- queue a research topic for nightly processing
- /bookmark [url] -- save a bookmark for later

## Meta
- /commands -- show this list
- /schedule -- show today schedule and upcoming events
- /week -- show weekly summary so far

## Natural Language (also works)
- "add task: fund wallets" = /add fund wallets
- "done with privy setup" = /done privy setup
- "whats next" = /next
- "remind me about X" = adds to task list with note
- Any URL sent = saved to inbox queue for nightly processing
- Any text that looks like an idea = saved to captures

## Notes
ZOE recognizes commands with or without the slash.
If a message does not match a command, ZOE treats it as conversation and responds naturally.
HEREDOC'"'"''
```

- [ ] **Step 2: Update SOUL.md to reference COMMANDS.md**

Add to SOUL.md after the Communication section:

```
## Commands
Read COMMANDS.md for the full command list. Recognize both /slash commands and natural language equivalents. When a user sends a command, execute it immediately -- don't ask for confirmation on routine operations.

For task commands (/add, /done, /next, /carry):
1. Update the local task file (daily/YYYY-MM-DD-tasks.md in ZAOOS repo)
2. Confirm with a short response
3. If the repo is available, commit the change

For capture commands (/idea, /research, /bookmark):
1. Save to the appropriate location
2. Confirm: "Saved. Will process tonight."
```

- [ ] **Step 3: Update AGENTS.md proactive ping rules**

Replace the DND section with:

```
### Proactive Behavior
- During phone hours (all hours except 5-5:45am and 4-7pm computer sprints):
  - Surface interesting findings (max 3-4/day)
  - Remind about own ideas ("you emailed about X yesterday...")
  - Connect dots between captures and projects
  - Nudge on priorities ("2 tasks left, it's 2pm")
- Always include dismiss option: [skip] [later] [shelve]
- During computer hours: respond when messaged, don't initiate
- Learn from dismissals: reduce categories that get skipped
```

- [ ] **Step 4: Deploy all VPS changes via SSH**

```bash
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 cat /home/node/openclaw-workspace/COMMANDS.md"
```

Verify all three files updated correctly.

- [ ] **Step 5: Set up Telegram BotFather commands**

Generate a message for Zaal to send to @BotFather on Telegram:

```
/setcommands

tasks - Show today's priorities and status
add - Add a task to today
done - Mark a task complete
next - What should I do next
carry - Move task to tomorrow
priorities - Show top 3 priorities
status - Project status and open PRs
inbox - Show unread inbox items
brief - Resend morning briefing
newsletter - Show newsletter draft
idea - Save an idea
research - Queue research topic
bookmark - Save a bookmark
commands - Show all commands
schedule - Today's schedule
week - Weekly summary so far
```

This creates the slash-command autocomplete menu in Telegram.

- [ ] **Step 6: Commit documentation locally**

Save a copy of COMMANDS.md to the repo too for reference:
```bash
cp docs/superpowers/specs/2026-04-13-zoe-daily-intelligence-pipeline-design.md .
git add docs/
git commit -m "feat(zoe): daily pipeline commands + VPS config deployed"
```

---

### Task 8: Test the Pipeline End-to-End

- [ ] **Step 1: Send a test email to inbox**

```bash
source .env.local && export $(grep AGENTMAIL_API_KEY .env.local | tr -d ' ')
curl -s -X POST "https://api.agentmail.to/v0/inboxes/zoe-zao@agentmail.to/messages/send" \
  -H "Authorization: Bearer $AGENTMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "zoe-zao@agentmail.to", "subject": "Test: pipeline active", "text": "Testing the nightly pipeline. This should appear in tomorrow morning briefing."}'
```

- [ ] **Step 2: Manually run the nightly processor**

Use `RemoteTrigger` with action `run` on the nightly processor trigger to test without waiting for 10pm.

- [ ] **Step 3: Verify output**

Check that docs/daily/ has:
- Tomorrow's briefing file
- Tomorrow's task file
- Today's captures file
- Newsletter draft

- [ ] **Step 4: Verify Telegram commands work**

Message @zaoclaw_bot with:
- `/commands` -- should list all commands
- `/tasks` -- should show today's task file
- `/add test task from telegram` -- should add to task file
- `/done test task from telegram` -- should mark complete

- [ ] **Step 5: Commit test results**

```bash
git add docs/daily/
git commit -m "test(zoe): pipeline end-to-end verification"
```
