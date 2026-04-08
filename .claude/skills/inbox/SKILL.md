---
name: inbox
description: Process ZOE's email inbox. Links, ideas, and research topics forwarded to zoe-zao@agentmail.to. View queued items, research them, mark as done.
---

# ZOE Inbox

Email links and research topics to **zoe-zao@agentmail.to** from your phone. Process them here.

## Commands

- `/inbox` - show all unread items
- `/inbox research` - research the top unread item via /zao-research, then mark read
- `/inbox clear` - mark all items as read
- `/inbox count` - how many unread items

## How It Works

1. You email a link, forward a thread, or jot an idea to zoe-zao@agentmail.to
2. From Claude Code, run `/inbox` to see what's queued
3. Run `/inbox research` to research the top item

## Reading the Inbox

Use the AgentMail API to list unread messages:

```bash
source .env.local 2>/dev/null
export $(grep AGENTMAIL_API_KEY .env.local | tr -d ' ')
curl -s "https://api.agentmail.to/v0/inboxes/zoe-zao@agentmail.to/messages?label=unread&limit=20" \
  -H "Authorization: Bearer $AGENTMAIL_API_KEY"
```

Display as a numbered list:
```
ZOE INBOX (N unread)

1. [Subject line]
   From: sender@email.com
   Preview: first 100 chars of body...
   URLs found: https://...

2. [Subject line]
   ...
```

## Processing an Item

1. Read the full message via API:
   ```bash
   curl -s "https://api.agentmail.to/v0/inboxes/zoe-zao@agentmail.to/messages/{message_id}" \
     -H "Authorization: Bearer $AGENTMAIL_API_KEY"
   ```
2. Extract URLs from the body text (look for https:// patterns)
3. If it contains a URL: fetch it via Jina Reader to get clean content:
   ```bash
   curl -s "https://r.jina.ai/{URL}"
   ```
   This works on X/Twitter posts, articles, GitHub repos, any URL. Returns clean markdown.
   Then run /zao-research on the extracted content.
4. If it's plain text: treat as a research topic, run /zao-research directly
5. Mark as read by removing the 'unread' label:
   ```bash
   curl -s -X PATCH "https://api.agentmail.to/v0/inboxes/zoe-zao@agentmail.to/messages/{message_id}" \
     -H "Authorization: Bearer $AGENTMAIL_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"remove_labels": ["unread"]}'
   ```

## Custom Domain (Future)

When AgentMail paid plan is activated, add zaoos.com as custom domain
to get zoe@zaoos.com. For now, zoe-zao@agentmail.to works.

## Quick Test

Send yourself a test:
```bash
source .env.local && export $(grep AGENTMAIL_API_KEY .env.local | tr -d ' ')
curl -s -X POST "https://api.agentmail.to/v0/inboxes/zoe-zao@agentmail.to/messages/send" \
  -H "Authorization: Bearer $AGENTMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "zoe-zao@agentmail.to", "subject": "Test inbox", "text": "Testing the inbox pipeline"}'
```
