# 1453 — !summary Livestream Command Spec (Jul 2026)

> **Type:** DESIGN
> **Status:** READY TO BUILD
> **Owner:** Zaal + ZOE team (VPS deploy)
> **Created:** 2026-07-18

---

## What This Doc Covers

Full specification for the `!summary` command — a Telegram trigger that, when typed by Zaal in a live stream group chat, captures the current session context, summarizes it via Claude, and dispatches the summary to configured outputs (Telegram group, Farcaster, Bonfire). Built for COC Concertz stream nights and future ZAO live sessions.

---

## Why This Exists

During COC shows, WaveWarZ battles, and Fractal sessions, key moments happen in real-time but go undocumented. Zaal types `!summary` mid-stream and gets a human-readable recap back in seconds — usable as a post-show Farcaster thread, a community update, or a Bonfire knowledge graph episode.

Use cases in order of priority:
1. End-of-show COC recap for Farcaster posting
2. Mid-session WaveWarZ battle results summary
3. ZAOstock planning session capture
4. Fractal meeting notes → Bonfire episode

---

## Command Interface

### Trigger syntax

Typed in any Telegram group or DM where ZOE is active:

```
!summary
!summary [optional context note]
!summary coc7 post-show
```

Optional context note is appended to the Claude prompt to focus the summary (e.g., "focus on WaveWarZ results", "COC post-show Farcaster thread").

### Who can trigger

- **Zaal only** (Telegram user ID check). Others ignored silently.
- If needed later: expand to a `SUMMARY_ALLOWED_IDS` env list.

---

## Data Sources

ZOE assembles the summary context from up to 3 sources, whichever are available:

| Source | How accessed | Priority |
|--------|-------------|----------|
| Recent Telegram message history | Fetch last N messages from the current chat via Telegram Bot API `getUpdates` or stored in-memory buffer | High |
| ZAO Transcript (if running) | Check `zaoscribe` transcript endpoint or `/tmp/stream-transcript-*.txt` on VPS | Medium |
| Manual note from `!summary [note]` | Append directly to Claude prompt | Always |

For COC show nights, the Telegram group (`@coc_concertz` or `@zaoclaw`) has a running commentary feed. ZOE should buffer the last 50 messages per group and use that as the transcript input.

---

## Processing Pipeline

```
Zaal types !summary [optional note]
     │
     ▼
1. ZOE detects !summary prefix in group or DM message
     │
     ▼
2. Assemble context:
   - Pull last 50 messages from current chat buffer
   - Append any zaoscribe transcript if available
   - Append [optional note] if provided
     │
     ▼
3. Claude call (haiku-4 for speed):
   - System: "You are ZOE, ZAO's community elder. Summarize this livestream session..."
   - User: [assembled context]
   - Output: structured JSON {title, one_liner, key_moments[], next_steps[], farcaster_thread[]}
     │
     ▼
4. Format + dispatch outputs (configured per command invocation):
   - Reply in current Telegram chat (always)
   - Post to Farcaster via ZOL (if --farcaster flag or auto-configured)
   - Push to Bonfire as episode (always, for knowledge graph)
     │
     ▼
5. Log to ZOE cost ledger (cost-ledger.ts)
```

---

## Claude Prompt

### System prompt (ZOE persona)

```
You are ZOE, the ZAO community elder AI. You receive a livestream transcript
and return a structured JSON summary. Be concise, warm, and specific.
Never fabricate — if something didn't happen, omit it. Use lowercase prose.
No em dashes. Always cite specific moments if present (artist names, battle
scores, vote counts, timestamps if visible).
```

### User prompt template

```
Summarize this ZAO livestream session. Context note: {{optional_note}}

--- TRANSCRIPT START ---
{{assembled_transcript}}
--- TRANSCRIPT END ---

Return JSON in this exact shape:
{
  "title": "<4-8 word session title>",
  "one_liner": "<one sentence summary, max 280 chars>",
  "key_moments": ["<moment 1>", "<moment 2>", ...],  // 3-6 moments
  "next_steps": ["<action 1>", ...],  // 1-4 actions surfaced in discussion
  "farcaster_thread": ["<cast 1>", "<cast 2>", ...]  // 3-5 casts, each max 280 chars, self-contained
}
```

### Token budget

| Field | Model | Max input | Est. output |
|-------|-------|-----------|-------------|
| !summary (50 msgs) | claude-haiku-4-5 | ~2,000 tok | ~500 tok |
| !summary (full transcript) | claude-haiku-4-5 | ~8,000 tok | ~800 tok |

Cost per invocation: ~$0.001–0.003 (haiku rates).

---

## Output Formats

### 1. Telegram reply (always)

```
✅ ZAO Session Summary: [title]

[one_liner]

KEY MOMENTS:
• [moment 1]
• [moment 2]
• [moment 3]

NEXT STEPS:
• [action 1]
• [action 2]

Post to Farcaster? Reply with !post-summary to confirm.
```

### 2. Farcaster thread (on confirmation or auto)

ZOE queues the `farcaster_thread` array as a 3–5 cast thread via ZOL's existing cast pipeline. First cast always anchors with the session title. Subsequent casts are the key moments. Final cast is a CTA (zaostock.xyz, cocconcertz.com, or /zao channel depending on context).

### 3. Bonfire episode (automatic)

```json
{
  "name": "zoe:summary:{{iso_date}}:{{title_slug}}",
  "body": "{{one_liner}} Key moments: {{key_moments.join('. ')}}. Next steps: {{next_steps.join('. ')}}.",
  "source_tag": "livestream-summary"
}
```

---

## Implementation Plan

### Phase 1 — Basic !summary (Telegram reply only)

**File:** `bot/src/zoe/index.ts`

Add in the group message handler (around line 1047 `bot.on('message:text')`):

```typescript
if (text.startsWith('!summary') && ctx.from?.id === ZAAL_TELEGRAM_ID) {
  await handleSummaryCommand(ctx, text.slice(8).trim());
  return;
}
```

**New file:** `bot/src/zoe/summary-command.ts`

```typescript
export async function handleSummaryCommand(ctx: Context, note: string): Promise<void> {
  const chatId = ctx.chat?.id;
  const buffer = getChatBuffer(chatId); // last 50 messages
  const transcript = buffer.map(m => `${m.from}: ${m.text}`).join('\n');
  const result = await callClaude({ transcript, note });
  await ctx.reply(formatTelegramSummary(result));
  await pushToBonfire(result);
}
```

**New file:** `bot/src/zoe/chat-buffer.ts`

Simple in-memory map: `Map<chatId, Message[]>` capped at 50 per chat. ZOE's `bot.on('message:text')` handler appends every message to the buffer before routing.

### Phase 2 — !post-summary confirmation + Farcaster dispatch

Add a pending-summary store keyed by `chatId`. When Zaal replies with `!post-summary`, ZOE retrieves the last summary for that chat and dispatches the `farcaster_thread` array via ZOL.

### Phase 3 — zaoscribe integration

When zaoscribe is running on VPS, its transcript file path (`/tmp/stream-transcript-{{date}}.txt`) is exposed via a local endpoint. `summary-command.ts` checks for it and appends to the context if present.

---

## Config (`.env`)

```env
SUMMARY_ALLOWED_IDS=123456789       # Zaal's Telegram user ID (already set as ZAAL_TELEGRAM_ID)
SUMMARY_MAX_BUFFER=50               # Messages to include from chat buffer
SUMMARY_MODEL=claude-haiku-4-5      # Model for summarization
SUMMARY_AUTO_BONFIRE=true           # Always push to Bonfire
SUMMARY_AUTO_FARCASTER=false        # Require !post-summary confirmation to cast
```

---

## PR Scope

| PR | Scope |
|----|-------|
| PR 1 | `chat-buffer.ts` — in-memory buffer for last 50 messages per chat |
| PR 2 | `summary-command.ts` — Claude call + Telegram reply + Bonfire push |
| PR 3 | `index.ts` — wire `!summary` trigger in group message handler |
| PR 4 | `!post-summary` confirmation + Farcaster thread dispatch |

Start with PR 1–3 for a functional v1. PR 4 is a separate story.

---

## Testing Checklist

- [ ] `!summary` typed by Zaal in test group → ZOE replies within 5 seconds
- [ ] `!summary` typed by non-Zaal user → ZOE ignores silently
- [ ] Summary includes ≥ 3 key moments when ≥ 10 messages in buffer
- [ ] Bonfire post succeeds (`1 posted, 0 failed`)
- [ ] Cost ledger entry written for each invocation
- [ ] Empty buffer (< 5 messages) → ZOE replies with "not enough context yet"

---

## Related Docs

- [1272 — The ZAO Agent Stack Jul 2026](./1272-zao-agent-stack-jul2026/)
- [1319 — DreamLoops x ZAOcowork: Capsule Dispatch + Cost Caps](./1319-dreamloops-zaocowork-capsule-graft/)
- [1235 — Cowork Lead-Reengagement Skill](./1235-cowork-lead-reengagement-skill/)
- [717 — Bonfire Posting via VPS](../agents/717-meeting-bonfire-posting-via-vps/)
