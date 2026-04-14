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
