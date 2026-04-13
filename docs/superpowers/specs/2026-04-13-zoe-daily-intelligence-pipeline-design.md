# ZOE Daily Intelligence Pipeline - Design Spec

**Date:** April 13, 2026
**Status:** Design complete, pending user review

---

## 1. What This Is

ZOE becomes Zaal's daily operating system -- capturing ideas from any channel (email, Telegram, Claude Code), processing them into organized repo context, managing daily tasks/priorities, drafting newsletters, and delivering schedule-aware briefings. Three inputs, one brain, everything lands in the repo.

## 2. Architecture

```
INPUTS                        PROCESSING                      OUTPUTS
                              
email ────┐                   Claude Code                     Morning briefing (TG + repo)
          │                   scheduled agents                Lunch ping (TG)
telegram ─┼──> Inbox Queue    (nightly + on-demand)           Drive prep (TG)
          │    (AgentMail +                                   Daily newsletter draft (repo)
claude ───┘    Supabase)      Categorize, research,           Weekly recap draft (repo)
                              file to repo, manage tasks      Task list (TG + repo)
                                                              Proactive thought prompts (TG)
```

## 3. Three Input Channels

### Email (zoe-zao@agentmail.to)
- Share sheet from phone -- forward links, tweets, articles
- Quick thoughts -- "research conviction staking vs ERC-4626"
- Forwards -- event invites, interesting threads

### Telegram (@zaoclaw_bot)
- Conversations with ZOE -- "add task: fund VAULT wallet"
- Voice notes (transcribed by Telegram)
- Quick updates -- "just finished Privy setup"
- Task management -- "what's next?", "mark X done", "reprioritize"

### Claude Code (/inbox or direct)
- Process inbox during sessions
- Add items directly -- ideas that come up while building
- Review daily files -- briefings, task lists, newsletter drafts

## 4. Schedule-Aware Behavior

### Zaal's M-F Schedule

| Time | Activity | ZOE Behavior |
|------|----------|-------------|
| 4:30-5:00 AM | Wake, phone | **Morning briefing** on Telegram. 3 priorities, overnight summary, newsletter ready |
| 5:00-5:45 AM | Computer sprint | Silent on TG. Briefing file in repo for Claude Code |
| 5:45-6:45 AM | Gym | Available on TG for light interaction. Thought prompts OK |
| 6:45-11:30 AM | Work (Jackson Labs) | Available but not pushy. Respond when messaged. 1-2 proactive pings max (interesting findings, reminders of own ideas) |
| 11:25 AM | Pre-lunch | **Lunch ping**: 3 actionable items for the 1-hour window |
| 11:30-12:30 PM | Lunch | Active on TG. Social engagement suggestions, quick tasks |
| 12:30-3:30 PM | Work | Same as morning work -- available, light proactive |
| 3:25 PM | Pre-drive | **Drive prep**: evening session priorities, PR status, meeting reminders |
| 3:30-4:00 PM | Drive | Available for voice/TG if needed |
| 4:00-7:00 PM | Prime building | Available on TG for task updates. Claude Code is primary interface |
| 7:00 PM+ | House duties | Light availability. Evening summary at 9pm |
| 10:00 PM | Asleep | **Nightly processing**: inbox, research, newsletter draft, tomorrow's briefing |

### Weekends
Flexible. No scheduled pings. Respond when messaged. Process inbox on demand.

## 5. Task Management

### Daily Task File
`docs/daily/YYYY-MM-DD-tasks.md`:

```markdown
# Tasks - April 13, 2026

## Priorities (max 3)
- [x] Set up Privy wallets for VAULT/BANKER/DEALER
- [ ] Fund wallets with $15 ETH each on Base
- [ ] Adrian call prep review (6pm EST)

## Today
- [ ] Fund wallets with $15 ETH each on Base
- [ ] Adrian call prep review (6pm EST)  
- [ ] Review staking PR #157

## Added During Day
- [ ] Ask Logesh about SongJam API rate limits (low)

## Carried From Yesterday
- [ ] Deploy ZabalConviction contract to Base

## Done Today
- [x] Set up Privy wallets (completed 5:30am)
- [x] Merged staking PR (completed 5:15am)

## Notes
- Adrian confirmed 6pm EST Sunday
- Privy App ID: clxxxxxxxxxx (saved to .env.local)
```

### Task Commands (Telegram)
- "add: [task]" -- adds to Today
- "done: [task]" or "finished [task]" -- marks complete
- "what's next?" -- returns top uncompleted priority
- "reprioritize" -- ZOE suggests new order based on time left in day
- "carry [task]" -- moves to tomorrow
- "block: [task] because [reason]" -- marks blocked with context

### Task Sources
Tasks come from:
1. Morning briefing (auto-generated from yesterday's carryover + inbox items)
2. You telling ZOE ("add: X")
3. Claude Code sessions (ZOE reads commit messages, detects new work)
4. Inbox items that imply action ("this is important lets think of how we can do an event")

## 6. Newsletter Pipeline

### Daily Newsletter ("Year of the ZABAL")
- **Drafted:** 10pm nightly by scheduled Claude Code agent
- **Source material:** Day's captures (inbox items, Telegram conversations, Claude Code activity, research docs created)
- **Format:** Short -- 2-3 paragraphs. What happened today + what's coming + mindful moment
- **Mindful moment:** Not generic quotes. Drawn from the day's context -- connections between ideas, reflections on progress, intention-setting. Example: "You captured 4 ideas about agent tokenomics yesterday. The conviction staking pattern connects to what Dan mentioned at fractals. Sometimes the best ideas are the ones that keep showing up in different conversations."
- **Saved to:** `docs/daily/YYYY-MM-DD-newsletter.md`
- **Published by:** You, during morning sprint. Edit and paste into Paragraph.

### Weekly Recap
- **Drafted:** Friday 10pm
- **Source material:** All daily captures + git log + research docs created + community events
- **Format:** Longer -- what shipped, what's coming, community highlights, week's best ideas
- **Saved to:** `docs/weekly/YYYY-WNN-recap.md`

### Newsletter Voice
Uses existing `/newsletter` skill patterns. Zaal's voice -- builder perspective, not corporate. Build-in-public energy. References specific people, specific projects, specific numbers.

## 7. Morning Briefing

Delivered to Telegram at 4:30am EST + saved to `docs/daily/YYYY-MM-DD-briefing.md`.

```
GM Zaal. Sunday April 13.

TODAY'S 3 PRIORITIES:
1. Adrian call at 6pm EST -- prep doc ready at docs/call-prep/
2. Fund agent wallets ($15 ETH each on Base)
3. Deploy ZabalConviction contract ($0.50)

OVERNIGHT:
- Processed 3 inbox items (2 X posts filed, 1 research doc created)
- Newsletter draft ready at docs/daily/2026-04-13-newsletter.md
- No new PRs or GitHub activity

THOUGHT PROMPT:
You emailed yourself about a "Red Sox inspiring social media" idea 
Friday. That's the same pattern as COC Concertz promoters -- 
passionate fan creates content, community amplifies. Worth exploring 
for the BCZ consulting pitch?

CALENDAR:
- 6:00 PM: Adrian / Empire Builder call (Calendly)
- Tomorrow: Monday fractal meeting 6pm EST
```

## 8. Proactive Pings

During phone hours, ZOE surfaces:

### Interesting Findings
"Austin Griffith just deployed a new CLAWD dApp -- looks like an LP management tool. Related to your VAULT agent. Want me to research it?"

### Reminders of Own Ideas
"3 days ago you emailed about a Facebook Marketplace haggling agent. Still want to explore that, or shelve it?"

### Connection Spotting
"The SongJam points system you researched uses the same conviction model as your staking contract. The multiplier formula could work for ZABAL oracle rewards too."

### Task Nudges
"2 priorities left and it's 2pm. Fund wallets is a 10-minute phone task -- want to knock it out now?"

### Rules
- Max 3-4 proactive pings per day during work hours
- Never during DND-flagged deep work
- Always include a way to dismiss ("skip", "later", "shelve")
- Learn from dismissals -- if you always skip ecosystem alerts, reduce them

## 9. Infrastructure

### Claude Code Scheduled Agents (via /schedule)
| Agent | Schedule | What It Does |
|-------|----------|-------------|
| Nightly Processor | 10:00 PM EST daily | Process inbox, research links, draft newsletter, compile tomorrow's briefing, update task carryovers |
| Morning Delivery | 4:30 AM EST M-F | Send briefing to Telegram, commit daily files to repo |
| Lunch Ping | 11:25 AM EST M-F | Send 3 actionable items to Telegram |
| Drive Prep | 3:25 PM EST M-F | Send evening session briefing to Telegram |
| Weekly Recap | 10:00 PM EST Friday | Compile week's activity into recap newsletter draft |

### VPS/OpenClaw (always-on)
- Telegram listener (@zaoclaw_bot)
- M2.7 for quick acks ("got it, filed", "marked done")
- Forwards complex requests to inbox queue for Claude Code processing
- Task CRUD -- add/done/reprioritize are simple enough for M2.7
- Escalates to Claude Code via `claude -p` for anything requiring research or writing

### Repo Structure
```
docs/
  daily/
    2026-04-13-briefing.md       # morning briefing
    2026-04-13-newsletter.md     # daily newsletter draft  
    2026-04-13-tasks.md          # task list (living doc, updated throughout day)
    2026-04-13-captures.md       # everything captured today (raw log)
  weekly/
    2026-W16-recap.md            # weekly newsletter draft
  call-prep/
    2026-04-13-adrian-empire-builder.md  # (already exists)
  ideas/
    facebook-marketplace-haggler-agent.md  # (already exists)
    red-sox-social-media.md               # from inbox capture
```

### Data Flow
```
1. You email a link from phone
2. AgentMail receives it at zoe-zao@agentmail.to
3. Nightly processor (Claude Code scheduled agent):
   a. Fetches all unread from AgentMail API
   b. Categorizes: idea / research / task / reference / bookmark
   c. Research items: fetch URL via Jina, run /zao-research, save doc
   d. Task items: add to tomorrow's task file
   e. Idea items: save to docs/ideas/
   f. Marks as read in AgentMail
4. Same processor drafts newsletter from day's captures
5. Same processor compiles morning briefing
6. 4:30am agent sends briefing to Telegram + commits to repo
7. You wake up, everything is ready
```

## 10. Telegram Message Format

### Briefing (long-form, morning only)
Full markdown with sections, priorities, calendar. See section 7.

### Proactive Ping (short, during day)
```
[thought] You emailed about Red Sox social media Friday. 
Same pattern as COC promoters. Research it? 
[research] [skip] [later]
```

### Task Update (minimal)
```
Done: Set up Privy wallets
Next: Fund wallets ($15 ETH each on Base)
2 priorities remaining today.
```

### Lunch Ping (3 items)
```
Lunch window:
1. Reply to @saltorious on Farcaster (they mentioned ZAO)
2. Quick task: add ZX_API_KEY to Vercel env vars (2 min)  
3. Interesting: new Bankr skill for cross-chain swaps dropped
```

## 11. What Stays the Same

- OpenClaw container on VPS (healthy, running)
- SOUL.md, AGENTS.md, MEMORY.md structure
- Telegram bot (@zaoclaw_bot)
- AgentMail inbox (zoe-zao@agentmail.to)
- All existing Claude Code skills and workflows

## 12. What Changes

- Add 5 scheduled Claude Code agents (nightly, morning, lunch, drive, weekly)
- Add docs/daily/ and docs/weekly/ directories
- Update VPS ZOE to handle task CRUD via Telegram
- Update VPS ZOE to forward complex items to inbox queue
- Update /inbox skill to work with the daily pipeline
- Create /morning skill that reads today's briefing file

## 13. Build Priority

| Priority | What | Effort |
|----------|------|--------|
| P0 | docs/daily/ structure + task file format | 30 min |
| P0 | Nightly processor (scheduled Claude Code agent) | 2 hours |
| P0 | Morning briefing delivery (scheduled agent + Telegram) | 1 hour |
| P1 | VPS ZOE task CRUD (add/done/next via Telegram) | 2 hours |
| P1 | Lunch ping + drive prep scheduled agents | 1 hour |
| P1 | Newsletter draft integration (nightly processor) | 2 hours |
| P2 | Proactive pings (interesting findings, thought prompts) | 3 hours |
| P2 | Weekly recap agent | 1 hour |
| P3 | Connection spotting (cross-reference captures with research library) | 4 hours |
| P3 | Task learning (adjust proactive behavior based on dismissals) | 2 hours |

## 14. Costs

| Item | Cost |
|------|------|
| Claude Code scheduled agents | $0 (Max plan) |
| VPS (existing) | $6/mo (no change) |
| AgentMail | $0 (free tier) |
| Telegram bot | $0 |
| **Total new cost** | **$0** |

## 15. Success Metrics

| Metric | Now | Target (30 days) |
|--------|-----|-------------------|
| Ideas captured per day | ~2 (inbox) | 5-10 (multi-channel) |
| Morning briefing available at 5am | Never | Every weekday |
| Newsletter drafts ready | 0 | Daily |
| Tasks tracked in repo | 0 | All daily tasks |
| Proactive pings acted on | 0 | 2-3/day |
| Time from idea to repo | Hours/days | < 12 hours (next nightly run) |

---

## Research Doc References

| Doc | What It Covers |
|-----|---------------|
| ZOE v2 Design (spec) | Original redesign -- single agent, schedule-aware |
| ZOE v2 Pivot (memory) | Agent Zero evaluation, OpenClaw limitations |
| VPS Skill (memory) | SSH access, Docker patterns, file management |
| OpenClaw Status (memory) | 7-agent architecture, cron patterns, dispatch routing |
