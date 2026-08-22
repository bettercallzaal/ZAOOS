---
topic: farcaster
type: implementation-brief
status: research-complete
created: 2026-08-22
last-validated: 2026-08-22
board-task: 9540381a-2030-45d8-b121-bcbe63175af7
related-docs: "2375-zol-mention-listening-brief, 2381-farcaster-hub-api-zol-migration-reference, 2378-zol-neynar-dependency-audit, 2383-neynar-operator-monitoring-brief"
original-query: "ZOL mention-listening spec: Snapchain polling as the Neynar-independent alternative to the webhook approach in doc 2375"
supersedes: 2375-zol-mention-listening-brief
tier: STANDARD
---

# 2387 - ZOL Mention Polling: Snapchain-Native Implementation Spec

> **Purpose:** Spec for ZOL mention-listening using Snapchain `castsByMention`
> polling. Supersedes the Neynar webhook approach from doc 2375 — that approach
> depends on Neynar's developer platform, which is in the operator-transition scope
> as of Aug 17, 2026. This approach has zero Neynar dependency.
>
> **Board task:** `9540381a-2030-45d8-b121-bcbe63175af7` — "ZOL: add
> mention-listening (Neynar webhook POST /v2/bot/mentions → fetch convo → reply)"

---

## Approach Comparison

| | Doc 2375 (Neynar Webhook) | This doc (Snapchain Polling) |
|--|--------------------------|------------------------------|
| Transport | Push — Neynar POSTs to ZOL's webhook | Pull — ZOL polls Snapchain every N min |
| Neynar dependency | HIGH — webhook delivery, signature verification, auth | ZERO |
| Latency | Near-real-time (seconds) | N minutes (configurable) |
| Infrastructure | ZOL must expose a public HTTPS endpoint | ZOL can run on any box, no public endpoint needed |
| Operator risk | Fails if Neynar's webhook service stops | Survives any Neynar failure |
| Implementation effort | Higher (webhook server, signature validation) | Lower (one fetch call + dedup) |

**Recommendation:** Implement Snapchain polling for the initial build. It is
simpler, safer during the operator transition, and fully functional for ZOL's
volume. The webhook approach can be revisited post-transition if latency becomes
a product constraint.

---

## The Snapchain Endpoint

```
GET https://hub.pinata.cloud/v1/castsByMention?fid=3338501&pageSize=50
```

- `fid=3338501` — ZOL's FID (ZOL's Farcaster identity, onchain Optimism)
- `pageSize=50` — returns up to 50 mentions; ZOL's mention volume is low
- Returns chronological list of casts that @mention FID 3338501
- Protocol-level: returns true `@mentions`, not the broken likes-based proxy
  in the existing `getNeynarMentions()` (which hits the likes endpoint — confirmed
  broken in doc 2378)

**Response shape:**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_CAST_ADD",
        "fid": 1234567,
        "timestamp": 103000000,
        "castAddBody": {
          "text": "@zol what do you think about...",
          "mentions": [3338501],
          "mentionsPositions": [0],
          "parentCastId": { "fid": 999, "hash": "0x..." }
        }
      },
      "hash": "0x..."
    }
  ],
  "nextPageToken": "..."
}
```

---

## Implementation Spec

### File: `src/mention-poll.js` (new file in `zol-upgrade/src/`)

```js
// ZOL mention polling via Snapchain castsByMention.
// Runs on a tick (every MENTION_POLL_INTERVAL_MIN, default 5).
// Stores last-seen timestamp to avoid re-processing.
// Calls processMention() for each new mention.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { submitZolReply } from './zol-lib.js';       // existing ZOL posting path
import { classifyMentionIntent } from './integrations.js'; // new function

const HUB = process.env.ZOL_HUB_URL || 'https://hub.pinata.cloud';
const FID = process.env.ZOL_FID || '3338501';
const STATE_FILE = process.env.MENTION_STATE_FILE || '/tmp/zol-mention-state.json';
const POLL_INTERVAL = parseInt(process.env.MENTION_POLL_INTERVAL_MIN || '5') * 60 * 1000;

function loadState() {
  if (!existsSync(STATE_FILE)) return { lastTimestamp: 0, seenHashes: [] };
  return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

async function fetchMentions() {
  const url = `${HUB}/v1/castsByMention?fid=${FID}&pageSize=50`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`castsByMention failed: ${resp.status}`);
  const data = await resp.json();
  return data.messages || [];
}

async function processMention(msg, signer) {
  const { hash, data } = msg;
  const { fid, timestamp, castAddBody } = data;
  const { text, parentCastId } = castAddBody;

  // Intent classification — extend integrations.js with classifyMentionIntent()
  const intent = await classifyMentionIntent(text);
  if (intent === 'ignore') return;

  // Reply gate: Telegram approval (default) or auto (configurable)
  const replyGate = process.env.MENTION_REPLY_GATE || 'telegram';
  if (replyGate === 'telegram') {
    // Extend bot/src/zoe/dm-build-session.ts pattern: send to Telegram for approval
    await sendMentionApprovalRequest({ fid, text, intent, replyHash: hash });
    return; // reply fires only after Telegram approval
  }

  // Auto-reply path (MENTION_REPLY_GATE=auto)
  const replyText = await generateMentionReply(text, intent);
  await submitZolReply({ parentHash: hash, parentFid: fid, text: replyText, signer });
}

export async function pollMentions(signer) {
  const state = loadState();
  const mentions = await fetchMentions();

  const newMentions = mentions.filter(m =>
    m.data.timestamp > state.lastTimestamp &&
    !state.seenHashes.includes(m.hash)
  );

  for (const m of newMentions) {
    await processMention(m, signer);
    state.seenHashes.push(m.hash);
    if (m.data.timestamp > state.lastTimestamp) state.lastTimestamp = m.data.timestamp;
  }

  // Keep seenHashes bounded (last 1000)
  if (state.seenHashes.length > 1000) state.seenHashes = state.seenHashes.slice(-500);
  saveState(state);
  return newMentions.length;
}

// Standalone tick runner (called from cron or main loop)
if (import.meta.url === `file://${process.argv[1]}`) {
  const { getSigner } = await import('./zol-lib.js');
  const signer = await getSigner();
  setInterval(async () => {
    try {
      const n = await pollMentions(signer);
      if (n > 0) console.log(`[mention-poll] processed ${n} new mentions`);
    } catch (e) {
      console.error('[mention-poll] error:', e.message);
    }
  }, POLL_INTERVAL);
  console.log(`[mention-poll] polling every ${POLL_INTERVAL / 60000} min from ${HUB}`);
}
```

### Changes to existing files (minimal)

**`integrations.js`** — add `classifyMentionIntent(text)`:
```js
// Simple intent router; extend with LLM call if needed
export async function classifyMentionIntent(text) {
  const lower = text.toLowerCase();
  if (lower.includes('?') || lower.includes('what') || lower.includes('how')) return 'question';
  if (lower.includes('hello') || lower.includes('hey') || lower.includes('hi')) return 'greeting';
  return 'ignore'; // default: do not reply unsolicited
}
```

**`.env`** — new env vars:
```
ZOL_HUB_URL=https://hub.pinata.cloud
ZOL_FID=3338501
MENTION_POLL_INTERVAL_MIN=5
MENTION_REPLY_GATE=telegram          # 'telegram' or 'auto'
MENTION_STATE_FILE=/tmp/zol-mention-state.json
```

### `package.json` script addition:
```json
"mention-poll": "node src/mention-poll.js"
```

---

## Decisions Zaal Must Make (Same 3 from doc 2375 — still apply)

| # | Decision | Options | Recommended default |
|---|----------|---------|-------------------|
| 1 | **Reply gate** | (a) Telegram approval tap or (b) auto-reply within ZOL rules | (a) Telegram — one false reply tanks ZOL's reputation |
| 2 | **Poll interval** | 1 min / 5 min / 15 min | 5 min — adequate for ZOL's mention volume |
| 3 | **Intent scope** | Question-only / Greeting+Question / All mentions | Question-only for v1 — cleaner signal |

---

## Why NOT the Neynar Webhook (Doc 2375 Approach)

1. **Neynar developer platform is in operator-transition scope** — the webhook
   service (`POST /v2/bot/mentions`) could be disrupted during the handoff
2. **ZOL needs no public HTTPS endpoint** with polling — removes infra complexity
3. **Snapchain `castsByMention` returns real @mentions** — unlike the existing
   `getNeynarMentions()` which hits the likes endpoint (documented broken in doc 2378)
4. **5-min latency is acceptable for ZOL's use case** — ZOL is not a real-time
   customer service bot; reply-in-5-min is standard

---

## Relationship to Other ZOL Migrations (Doc 2381 Checklist)

This doc implements the **P2** item from doc 2381:

> P2: Fix `getNeynarMentions` → replace with `GET /v1/castsByMention?fid=3338501`
> on Snapchain. Current implementation hits the likes endpoint (broken). The polling
> spec in doc 2387 replaces it with a proper poll loop.

After this ships:
- P0 (hub URL) — 1-line change, `zol-lib.js:17`
- P0 (env override) — `ZOL_HUB_URL` var
- P1 (v1 search → v2) — 2-line change in `integrations.js:108`
- P2 (mention polling) — **this doc**

---

## Also See

- [Doc 2375](../2375-zol-mention-listening-brief/) — Original Neynar webhook approach (superseded for initial build)
- [Doc 2381](../2381-farcaster-hub-api-zol-migration-reference/) — Hub migration P0–P3 checklist
- [Doc 2378](../2378-zol-neynar-dependency-audit/) — Confirmed `getNeynarMentions` is broken (likes endpoint)
- [Doc 2383](../2383-neynar-operator-monitoring-brief/) — When to trigger hub migration

## Sources

- [INTERNAL] Doc 2375 — Neynar webhook mention-listening brief (approach superseded)
- [INTERNAL] Doc 2378 — ZOL Neynar dependency audit (mentions = broken via likes endpoint)
- [INTERNAL] Doc 2381 — Hub API migration reference (`castsByMention` as P2 fix)
- [INTERNAL] Snapchain HTTP API: `snapchain.farcaster.xyz/llms-full.txt` (verified in doc 2381)
