---
name: inbox
description: Process ZOE's email inbox - links, research topics, and notes forwarded to zoe@zaoos.com. View queued items, research them, mark as done.
---

# ZOE Inbox

Email links and research topics to **zoe@zaoos.com**. They queue up in Supabase. Process them here.

## Commands

- `/inbox` - show all unprocessed items
- `/inbox research` - research the top item and mark it done
- `/inbox clear` - mark all items as processed
- `/inbox count` - how many items are waiting

## How It Works

1. You email a link or topic to zoe@zaoos.com (or forward from your phone)
2. Cloudflare Email Worker parses it and inserts into Supabase `zoe_inbox` table
3. From Claude Code, run `/inbox` to see what's queued
4. Run `/inbox research` to research the top item using `/zao-research`

## Implementation

### Show Inbox

```bash
# Query unprocessed items
curl -s "https://efsxtoxvigqowjhgcbiz.supabase.co/rest/v1/zoe_inbox?status=eq.pending&order=created_at.desc&limit=20" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Display as a numbered list:
```
ZOE INBOX (N items pending)

1. [Apr 8] Graphify knowledge graph tool
   URL: https://github.com/safishamsi/graphify
   Notes: "check this out for research library"

2. [Apr 8] Farcaster Snaps protocol
   URL: https://x.com/...
   Notes: (forwarded from email)
```

### Research Top Item

1. Read the top pending item from `zoe_inbox`
2. Fetch the URL content if it's a link
3. Run `/zao-research` on the topic
4. Mark the item as `status: 'done'` in Supabase
5. Move to the next item or report "inbox zero"

### Mark Done

```bash
# Update status to done
curl -s -X PATCH "https://efsxtoxvigqowjhgcbiz.supabase.co/rest/v1/zoe_inbox?id=eq.{ID}" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

## Supabase Table Schema

Run this in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS zoe_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text,
  subject text,
  body text,
  urls text[] DEFAULT '{}',
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'researching', 'done', 'skipped')),
  source text DEFAULT 'email',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX idx_zoe_inbox_status ON zoe_inbox(status);
CREATE INDEX idx_zoe_inbox_created ON zoe_inbox(created_at DESC);

ALTER TABLE zoe_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read inbox" ON zoe_inbox FOR SELECT USING (true);
CREATE POLICY "Service role can insert" ON zoe_inbox FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update" ON zoe_inbox FOR UPDATE USING (true);
```

## Email Format

When emailing zoe@zaoos.com, any format works:
- Just a URL in the body
- A URL with notes in the subject line
- Forward an entire article
- Multiple URLs (one per line)

The Cloudflare worker extracts URLs and stores everything.
