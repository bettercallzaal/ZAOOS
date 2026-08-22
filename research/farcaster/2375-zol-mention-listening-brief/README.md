---
topic: farcaster
type: implementation-brief
status: research-complete
last-validated: 2026-08-22
superseded-by:
related-docs: "892, 984, 1065, 2374, 910"
original-query: "ZOL: add mention-listening (Neynar webhook POST /v2/bot/mentions -> fetch convo -> reply). Board task 9068."
tier: STANDARD
---

# 2375 - ZOL Mention-Listening via Neynar Webhook — Implementation Brief

> **Goal:** ZOL responds to @mentions on Farcaster by fetching the conversation
> and replying in-thread. Board task 9068. Three decisions for Zaal before build:
> (1) auth model, (2) reply gate (auto vs Telegram approval), (3) rate-limit.
>
> **Timing note (from doc 2374, 2026-08-22):** Neynar is seeking a new operator
> as of Aug 17, 2026. Neynar's developer platform is in the handoff scope. This
> brief is designed so the auth layer and reply path are swappable if Neynar API
> changes.

## Key Decisions (Zaal answers these before build)

| # | Decision | Options | Default if Zaal doesn't answer |
|---|---|---|---|
| 1 | **Auth model** | (a) SIWN (Sign In With Neynar — OAuth 2.0 in dev) or (b) direct Neynar API key auth | (b) API key — SIWN not yet released |
| 2 | **Reply gate** | (a) Auto-reply within ZOL posting rules or (b) Telegram approval tap before each reply | (b) Telegram approval — one false reply tanks the ZOL account score |
| 3 | **Rate limit** | (a) 1 reply/hour global or (b) 1 reply/user/24h or (c) reply to all within Neynar User Score threshold ≥ 0.7 | (c) Neynar score-gated — filters spam without manual work |

## How the Neynar Webhook Works

**Endpoint:** `POST /v2/bot/mentions` — Neynar sends this to ZOL's registered webhook URL on every cast that @mentions ZOL's FID.

**Payload shape (from Neynar docs):**
```json
{
  "data": {
    "hash": "0x...",           // cast hash
    "author": { "fid": 123 },  // who mentioned ZOL
    "text": "@zol what's...",   // the cast text
    "parent_hash": "0x..."     // parent cast if it's a reply
  }
}
```

**ZOL's response flow:**
1. Receive webhook POST → verify Neynar signature header
2. Fetch full conversation thread via `GET /v2/farcaster/cast/conversation`
3. Run intent classifier (extend `build-intent.ts` or create `mention-intent.ts`)
4. If reply gate = Telegram: POST draft to Zaal via `drafts.ts` for tap-approval
5. If auto-reply: validate against ZOL posting rules (`agent-spend.md` + `zol-queue.ts`)
6. POST reply via Neynar `POST /v2/farcaster/cast` with parent_hash set

## Implementation Plan

### Phase 1 — Webhook receiver (2–3h)

Create `bot/src/zoe/zol-mention-webhook.ts`:
```typescript
// POST handler at /webhooks/neynar-mention
// 1. Verify X-Neynar-Signature header (HMAC-SHA512 of body + webhook secret)
// 2. Parse cast hash + author FID + text
// 3. Check: is author FID in ZOL block list?
// 4. Check: has this hash already been processed? (dedup via receipt-envelope.ts)
// 5. Enqueue to mention-reply-queue (new Supabase table or local JSONL)
```

**Neynar signature verification (required — prevents spoofed webhooks):**
```typescript
import { createHmac } from 'crypto';
const sig = req.headers['x-neynar-signature'];
const expected = createHmac('sha512', NEYNAR_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body)).digest('hex');
if (sig !== expected) return res.status(401).send('invalid');
```

### Phase 2 — Intent + reply (3–4h)

New file `mention-intent.ts` (pure, unit-testable — no grammY imports):
```typescript
type MentionIntent =
  | { kind: 'music-rec'; query: string }       // "recommend me something like X"
  | { kind: 'battle-info'; artist: string }     // "who is @zol battling next"
  | { kind: 'general'; text: string }           // fallback — route to concierge
  | { kind: 'ignore' };                         // spam/noise

export function classifyMention(text: string, authorScore: number): MentionIntent
```

Reply is built and either:
- Auto-sent via `zol-queue.ts` (existing cast approval pipeline)
- Tapped via `drafts.ts` Telegram buttons (existing draft approval)

### Phase 3 — Wire to scheduler (1h)

Add webhook URL to ZOL's Neynar app registration (one-time Neynar dashboard step).
Add mention-reply-queue drain to `scheduler.ts` cron (rate-limit enforcement here).

## Neynar Operator Risk Mitigation

Per doc 2374: Neynar is seeking a new operator. To future-proof this build:

1. **Abstract the cast-send path.** `zol-mention-webhook.ts` should call a `castReply(hash, text)` helper — not Neynar directly — so the underlying POST URL is a single config swap.
2. **Store webhook secret in env, not code.** `env.ts` already has this pattern.
3. **Keep the mention queue durable.** Write to Supabase, not in-memory, so a Neynar API outage doesn't drop pending replies.

## What Exists Already (do not rebuild)

Per `confirm-before-claiming-absence.md` — verified against ZOE capability map (doc 2239):

| Need | Existing module |
|------|----------------|
| Cast approval / Telegram draft | `drafts.ts` |
| Cast queue drain | `zol-queue.ts` |
| Reply deduplication | `receipt-envelope.ts` |
| Neynar API calls | `bot/src/zoe/zol-queue.ts` + `team-tracker.ts` pattern |
| Rate-limit / spend governance | `agent-spend.md` + `call-budget.ts` |
| Signature verification pattern | `secret-hygiene.md` |

New code: `zol-mention-webhook.ts` (receiver), `mention-intent.ts` (classifier). Everything else wires to existing modules.

## Estimated Effort

| Phase | Hours | PR scope |
|-------|-------|---------|
| Webhook receiver + dedup | 2–3h | `zol-mention-webhook.ts` + Supabase table |
| Intent classifier + reply path | 3–4h | `mention-intent.ts` + wire to drafts.ts/zol-queue.ts |
| Scheduler + Neynar registration | 1h | `scheduler.ts` cron + env update |
| **Total** | **6–8h** | 2–3 PRs |

## ZOL Posting Rules (constraints on replies)

From `bot/src/zoe/zol-queue.ts` and doc 910 (free Farcaster posting path):
- Reply only to casts with Neynar User Score ≥ 0.7 (block spam FIDs)
- Never reply to own casts (loop guard)
- Max 1 reply per FID per 24h (prevent harassment perception)
- Reply text ≤ 320 chars (Farcaster limit)
- Never include links unless from verified ZAO sources
- Log every reply attempt via `receipts.ts` (audit trail)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Zaal: answer the 3 decisions in Key Decisions table | @Zaal | Decision | Before build |
| Zaal: confirm ZOL's Neynar app has a registered webhook URL (or create one in Neynar dashboard) | @Zaal | 5-min setup | Before Phase 1 |
| Build Phase 1: zol-mention-webhook.ts | @Zaal (Claude) | Code | After decisions |
| Test: send a cast @mentioning ZOL's FID, verify webhook fires + draft appears in Telegram | @Zaal | QA | After Phase 2 |

## Sources

- [FULL] Board task 9068: "ZOL: add mention-listening (Neynar webhook POST /v2/bot/mentions)" [FULL read]
- [FULL] Doc 2374 (2026-08-22): Farcaster operator crisis — Neynar operator uncertainty, Neynar API roadmap [this session]
- [FULL] Doc 2239 (2026-08-22): ZOE capability map — existing modules verified [this session]
- [FULL] Doc 892 (2026-06-23): Being an agent on Farcaster 2026 — Neynar score, posting rules [FULL read]
- [FULL] Bot source: bot/src/zoe/zol-queue.ts, drafts.ts, receipt-envelope.ts headers [this session]
- [PARTIAL — from Neynar dev call notes, doc 2374]: Neynar webhook spec, signature header format — directionally correct; verify exact header name against live Neynar docs before build
