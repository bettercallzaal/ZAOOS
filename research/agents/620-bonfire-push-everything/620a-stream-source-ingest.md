---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-06
related-docs: 547, 560, 613, 615, 618, 619, 620
tier: STANDARD
parent-doc: 620
---

# 620a - Stream-source ingest: Telegram + Farcaster + voice to Bonfire

> **Goal:** Map live-stream sources (Telegram DMs, group chats, Farcaster casts, voice transcripts) into the Bonfire knowledge graph. Auto-push everything Zaal touches so recall is always fresh, no manual curation required. This doc covers the three-source strategy, cost model, and concrete ship order.

---

## Decision Table: Use / Wire / Defer

| Source | Recommendation | Reason | Signal |
|---|---|---|---|
| **Telegram DMs (@zaoclaw_bot)** | WIRE | Native ZOE hook (grammy, `bot/src/zoe/index.ts`). Already parsed + stored in `recent.json`. Lowest effort, highest daily signal. Per-message push minimizes latency. | Push ~50 msgs/day, ~500 tokens/push = 25K tokens/day. |
| **Telegram group chats** | WIRE | ZAO Devz + ZAOstock team groups are decision sources. Distinguish user-sent (push) from bot-sent (skip). Existing grammy routing in place. | ~30 user msgs/day across groups. Skip bot noise. |
| **Farcaster casts (@zaal)** | WIRE | Neynar webhook + existing SDK. Subscribe to cast events. Push cast text, channel, mentions, timestamp. Separate from recast-spam. | ~10 casts/day, ~200 tokens per cast = 2K tokens/day. |
| **Voice (OpenWhisp pipeline)** | WIRE | Doc 560 approved. Dictation output lands as text file. Batch daily or per-transcript. | ~20 min voice/day = 1 transcript, ~300 tokens. |
| **Farcaster feeds Zaal reads** | DEFER | Out-of-scope doc 620. Optional Phase 2. Generates noise (high volume, low signal unless @mentioned). | ~100+ unread casts/day. |

---

## 1. Telegram Capture

### Current State

ZOE bot (`bot/src/zoe/index.ts`) already:
- Polls Telegram via grammy on DM + group messages
- Calls `pushRecent({ from: 'zaal', text })` on user messages
- Stores short-term in `~/.zao/zoe/recent.json`

Missing: auto-push to Bonfire on every DM/group message.

### Implementation Strategy

**Option A: Per-message push (recommended)**

Wire Bonfire ingest inside the existing `bot.on('message:text')` handler:

```typescript
// bot/src/zoe/index.ts at line ~147 (after pushRecent call)

async function pushToBonfire(source: 'dm' | 'group', text: string, groupId?: number) {
  try {
    const res = await fetch('https://tnt-v2.api.bonfires.ai/ingest_content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BONFIRE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: text,
        bonfire_id: process.env.BONFIRE_ID,
        title: `Zaal ${source === 'dm' ? 'DM' : 'group'}: ${text.slice(0, 60)}`,
        metadata: {
          source: 'telegram',
          from: 'zaal',
          channel_type: source,
          group_id: groupId,
          timestamp: new Date().toISOString(),
        },
      }),
    });
    if (!res.ok) console.error(`Bonfire ingest failed: ${res.status}`);
  } catch (err) {
    console.error('Bonfire push error:', err);
  }
}

// In the on('message:text') handler, after pushRecent():
await pushToBonfire(
  ctx.chat.type === 'private' ? 'dm' : 'group',
  text,
  ctx.chat.type !== 'private' ? ctx.chat.id : undefined
);
```

**Cost & latency:** Per-message means ~1 API call per message. Zaal sends ~50 Telegram messages/day. Each push is ~200-500 tokens (text + metadata). Daily cost: ~15K tokens.

**Distinction: user-sent vs. bot-sent**

Don't push bot replies (ZOE's concierge output, tips, scheduled nudges). Only push messages where `ctx.from.id === zaalId`. The existing `isAllowed()` guard already enforces this.

**Issue: admin-curl bypass**

Doc 606 mentions `feedback_admin_pushed_msgs_not_in_concierge_memory` - admin commands via curl bypass `pushRecent()`. Same risk applies to Bonfire: if Zaal posts via admin API instead of Telegram, it won't reach the graph. Mitigation: wire Bonfire ingest at TWO points:

1. In `index.ts` on ('message:text') - catches DMs
2. In `concierge.ts` result output - catches `/fix` and `/ask` replies that go back to Telegram

Sync these calls so duplicate messages don't double-ingest. Use (source + timestamp + text hash) as idempotency key in Bonfire if needed (check API docs).

**Group chats: which ones?**

Capture these groups (wire via ZAO_DEVZ_CHAT_ID env var + config):
- ZAO Devz (already tracked as `devzChatId` in index.ts)
- ZAOstock team chat
- RaidSharks (for context on raids)
- Skip: broadcasted-only groups (no user input)

### Data Shape

Bonfire ingest_content endpoint (from doc 544 curl example):

```json
{
  "content": "string",
  "bonfire_id": "69f13a649469bbc15bf61c10",
  "title": "string (first 60 chars of content)",
  "metadata": {
    "source": "telegram",
    "from": "zaal",
    "channel_type": "dm" | "group",
    "group_name": "ZAO Devz" (optional),
    "timestamp": "ISO8601"
  }
}
```

---

## 2. Farcaster Capture

### Setup: Neynar Webhook

Neynar SDK already integrated at `src/lib/farcaster/neynar.ts`. Add webhook subscription:

1. **Register webhook** (one-time, via Neynar dashboard or SDK):

   ```typescript
   // bot/src/zoe/farcaster-ingest.ts (new file)
   
   import { NEYNAR_API_KEY } from '@/lib/env';
   
   async function registerWebhook() {
     const res = await fetch('https://api.neynar.com/v2/farcaster/webhooks', {
       method: 'POST',
       headers: {
         'x-api-key': NEYNAR_API_KEY,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         target_url: 'https://zaoos.com/api/farcaster/webhook', // or VPS IP + path
         events: ['cast.created'],
         target_user_fid: 2915, // Zaal's FID
       }),
     });
     const data = await res.json();
     console.log('Webhook registered:', data.webhook_id);
     return data.webhook_id;
   }
   ```

2. **Receive webhook events** (on VPS):

   ```typescript
   // src/app/api/farcaster/webhook/route.ts
   
   import { NextRequest, NextResponse } from 'next/server';
   
   export async function POST(req: NextRequest) {
     const body = await req.json();
     
     // body.data = { type: 'cast.created', cast: { text, channel, timestamp, hash, author } }
     const { cast } = body.data;
     if (!cast) return NextResponse.json({ ok: true });
     
     // Push to Bonfire
     await pushToBonfire('farcaster', cast.text, {
       channel: cast.channel?.id,
       mentions: cast.mentions.map(m => m.username),
       hash: cast.hash,
       timestamp: cast.timestamp,
     });
     
     return NextResponse.json({ ok: true });
   }
   ```

3. **Push to Bonfire**:

   ```typescript
   // Inside farcaster-ingest.ts or webhook handler
   
   async function pushToBonfire(
     source: 'farcaster',
     text: string,
     meta: { channel?: string; mentions?: string[]; hash?: string; timestamp?: string }
   ) {
     const res = await fetch('https://tnt-v2.api.bonfires.ai/ingest_content', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${process.env.BONFIRE_API_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         content: text,
         bonfire_id: process.env.BONFIRE_ID,
         title: `Cast: ${text.slice(0, 60)}`,
         metadata: {
           source: 'farcaster',
           platform: 'farcaster',
           channel: meta.channel,
           mentions: meta.mentions,
           cast_hash: meta.hash,
           timestamp: meta.timestamp,
         },
       }),
     });
     if (!res.ok) console.error(`Farcaster ingest failed: ${res.status}`);
   }
   ```

### Scope

- **Include:** Casts authored by @zaal, replies to @zaal, casts in /poidh, /maine, /mindfulness channels (high-context for Zaal)
- **Skip:** Recast-only (no original text), quote recasts with zero new commentary

Cost: ~10 casts/day, ~200 tokens per cast = 2K tokens/day.

---

## 3. Voice (OpenWhisp Pipeline)

### Setup

Doc 560: OpenWhisp installed on Zaal's Mac. Hold Fn, speak, get text pasted into editor.

**Flow:**

1. OpenWhisp + Ollama on Mac produce a text file (or clipboard output)
2. Pipe transcript to Bonfire via a simple wrapper script

Example script:

```bash
#!/bin/bash
# ~/bin/voice-to-bonfire.sh

TRANSCRIPT="$1"  # text file or stdin
TITLE=$(head -c 60 "$TRANSCRIPT")
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

curl -X POST https://tnt-v2.api.bonfires.ai/ingest_content \
  -H "Authorization: Bearer $BONFIRE_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "content": "$(cat "$TRANSCRIPT" | jq -Rs .)",
  "bonfire_id": "$BONFIRE_ID",
  "title": "$TITLE...",
  "metadata": {
    "source": "voice",
    "platform": "openwhisp",
    "timestamp": "$TIMESTAMP",
    "agent_id": "$BONFIRE_AGENT_ID"
  }
}
EOF
```

**Integration point:** Call from `/newsletter` or `/onepager` skill (after voice-to-text, before final draft).

Cost: ~20 min voice/day = 1 transcript, ~300 tokens. Negligible.

### Deduplication Question

**Risk:** If Zaal speaks a voice note AND then copies it as a Telegram message, Bonfire sees both. Does it dedupe?

**Answer:** Bonfire SDK (doc 544) doesn't mention automatic content deduplication. Same text ingested twice = two separate entities in the graph.

**Mitigation:**
- Push voice transcripts with a dedicated source tag: `metadata.source = 'voice'`
- Push Telegram messages with `source = 'telegram'`
- Bonfire's LLM extraction should recognize semantic similarity during queries, but don't rely on it
- Manual dedup during weekly memory cleanup (future Phase 2)

---

## 4. Ordering: Which Source First?

### Ship Order (Difficulty scale 1-10, NOT time estimates)

**Step 1: Telegram DM push** - Difficulty 4
- Wire `pushToBonfire()` in `bot/src/zoe/index.ts` after existing `pushRecent()` call
- Environment setup: Ensure `BONFIRE_API_KEY`, `BONFIRE_ID` on VPS (already set per task context)
- Test: Send DM to @zaoclaw_bot, check Bonfire dashboard graph within 30 seconds
- Gain: ~50 messages/day auto-captured. Immediate insight into daily decision-making

**Step 2: Farcaster webhook** - Difficulty 6
- Register Neynar webhook for `cast.created` on @zaal's FID
- Wire `/api/farcaster/webhook` route to receive Neynar events
- Test: Cast on Farcaster, check graph. Verify only @zaal's casts + mentions land (filter recast-only noise)
- Gain: ~10 casts/day. Context about public positioning and social decisions

**Step 3: Voice transcript push** - Difficulty 3
- Wire voice-to-bonfire.sh script
- Hook into `/newsletter` or `/onepager` skill to call the script post-transcription
- Test: Dictate a note via OpenWhisp, check Bonfire
- Gain: ~1 transcript/day. Captures raw thinking before refinement

**Rationale:** Start with Telegram (ZOE already processes it, lowest friction). Add Farcaster webhook (requires webhook setup but proven Neynar integration). Voice last (smallest volume, easiest to add later without breaking other flows).

---

## 5. Cost Model

Bonfire pricing (https://bonfires.ai/pricing): Genesis tier custom. Doc 544 confirms no published per-tier rate limits.

**Estimated daily token cost:**

| Source | Volume | Tokens/unit | Daily Total |
|---|---|---|---|
| Telegram DMs | 50 msgs | 100 tokens | 5K |
| Telegram groups | 30 msgs | 100 tokens | 3K |
| Farcaster casts | 10 casts | 200 tokens | 2K |
| Voice transcript | 1 file | 300 tokens | 300 |
| **Total** | — | — | ~10.3K tokens/day |

At $10/1M tokens (rough API pricing guess; Bonfire is opaque), ~$0.10/day or ~$3/month incremental.

**Note:** Bonfire's Genesis tier is fixed-cost, not metered. Pushing this volume (10K tokens/day) likely has zero additional cost if Zaal's tier already covers it. Confirm with Joshua.eth before shipping.

---

## Sources

- Bonfire API docs: https://tnt-v2.api.bonfires.ai (ingest_content endpoint, bearer-token auth)
- Neynar webhooks: https://docs.neynar.com (cast.created event type)
- ZOE entry point: `bot/src/zoe/index.ts` (grammy on('message:text') handler at line ~104)
- Bonfire wiring guide: doc 544 (SDK config, HTTP API examples)
- OpenWhisp voice-to-text: doc 560 (local Whisper + Ollama, macOS Fn-key UX)
- Existing Farcaster wrapper: `src/lib/farcaster/neynar.ts` (headers, fetchWithFailover pattern)
