---
topic: agents, technology, zaoos
type: implementation-spec
status: SPEC READY — implement after Bonfire read-path opens (doc 680 gate) OR ship v0 with static context fallback now
last-validated: 2026-07-20
related-docs: 570-zaal-personal-kg-agentic-memory, 665-bonfires-deep-dive-zao-integration, 680-meeting-skill-bonfire-bridge, 717-meeting-bonfire-posting-via-vps, 1150-bartosz-smartvibe-ai-music-queue-architecture, 601-zoe-bot-architecture, 605-agentic-tooling-may-2026
board-tasks: "ZAO AI assistant - bartosz-style, Bonfire-backed"
action-owner: Developer (ZAO Devz bounty R8 candidate); Zaal (approve API route placement)
---

# 1600 — ZAO AI Assistant: Bartosz-Style API + Bonfire-Backed Context

> **What this is:** Implementation spec for the ZAO public-facing AI assistant. Board task: "ZAO AI assistant - bartosz-style, Bonfire-backed." "Bartosz-style" = production-grade async API design borrowed from bartosz0718's SmartVibe architecture (doc 1150): idempotency keys, async job polling, consistent error shapes, credit protection. "Bonfire-backed" = uses ZAO's ZABAL Bonfire knowledge graph (`zabal.bonfires.ai`) as the context layer so the assistant answers from ZAO's actual knowledge, not hallucination.

---

## What This Is (Product Vision)

A **public-facing ZAO AI assistant** — think "chat with ZAO" — that any visitor to `zaoos.com` (or the WaveWarZ miniapp) can query to learn about ZAO, WaveWarZ, ZABAL, governance, Africa Battle Week, ZAOstock, or anything else in the ZAO knowledge graph.

**Not ZOE.** ZOE is ZAO's private Telegram orchestration bot (doc 601). This is the public-facing layer — open to anyone, no auth required for basic queries.

**Use cases:**
- "What is WaveWarZ?"
- "How do I vote in Africa Battle Week?"
- "Who won the last ZOR session?"
- "When is ZAOstock?"
- "How do I earn ZABAL tokens?"
- "What is ZAO governance?"

**Why this matters:** ZAO has a rich knowledge graph (all ZAOOS research docs, Bonfire episodes, 1600+ docs). A public assistant turns that into a live answer surface — every new research doc makes the assistant smarter.

---

## Architecture: The Two Layers

### Layer 1: Bonfire Context (Knowledge Retrieval)

ZAO's Bonfire instance (`zabal.bonfires.ai`) holds the knowledge graph. All ZAOOS research docs, meeting notes, and ZOE interactions feed into it via the episode API.

**Context retrieval:**
```
POST https://tnt-v2.api.bonfires.ai/vector_store/search
Body: {
  "bonfire_ref": "69ef871f0d22ed7e6f2b243a",
  "search_string": "<user question>",
  "limit": 5
}
```

This returns the top 5 knowledge graph episodes relevant to the user's question. Those episodes become the system prompt context for the Claude API call.

**Current gate:** The Bonfire read path (`/vector_store/search`) returns `[]` until an admin runs the labeling step (doc 680). Until that gate opens, fall back to a **static context bundle** (see fallback section below).

### Layer 2: Bartosz-Style API (bartosz0718 SmartVibe patterns, doc 1150)

The ZAO assistant API routes live in ZAOOS (`/api/assistant`). Designed for production from day 1:

**Endpoints:**

```
POST /api/assistant/query    — submit a question (async, returns job ID)
GET  /api/assistant/query/{id} — poll for answer
GET  /api/assistant/health   — status check (no auth)
```

**Why async?** Claude API calls take 2-10 seconds. Async prevents browser timeouts and enables streaming in future. Pattern directly mirrors SmartVibe's `/api/v1/generations` design.

**Auth:** None required for public queries (up to N/day rate limit by IP). Admin queries (accessing private Bonfire context) require iron-session.

---

## API Design (Bartosz-Style)

### POST /api/assistant/query

**Request:**
```json
{
  "question": "How do I vote in Africa Battle Week?",
  "context": "public",
  "idempotency_key": "client-generated-uuid"
}
```

**Response (202 Accepted):**
```json
{
  "id": "asst_01j9x...",
  "status": "queued",
  "created_at": "2026-07-20T14:00:00Z",
  "question_preview": "How do I vote in Africa Battle...",
  "poll_url": "/api/assistant/query/asst_01j9x..."
}
```

Idempotency: same `idempotency_key` returns the same `id` if the question was already asked (prevents duplicate charges and duplicate Claude calls).

### GET /api/assistant/query/{id}

**Status: queued**
```json
{
  "id": "asst_01j9x...",
  "status": "queued",
  "created_at": "2026-07-20T14:00:00Z"
}
```

**Status: processing**
```json
{
  "id": "asst_01j9x...",
  "status": "processing",
  "started_at": "2026-07-20T14:00:01Z"
}
```

**Status: completed**
```json
{
  "id": "asst_01j9x...",
  "status": "completed",
  "answer": "To vote in Africa Battle Week...",
  "sources": ["Africa Battle Week ZOR voter guide (doc 1580)", "ZOR Snapshot vote setup (doc 1575)"],
  "bonfire_episodes_used": 3,
  "completed_at": "2026-07-20T14:00:05Z"
}
```

**Status: failed**
```json
{
  "id": "asst_01j9x...",
  "status": "failed",
  "error": {
    "type": "context_unavailable",
    "code": "BONFIRE_TIMEOUT",
    "message": "Could not retrieve context. Try again.",
    "retryable": true,
    "request_id": "req_..."
  }
}
```

### Error Shape (Consistent, SmartVibe-style)

All errors follow the same schema:
```json
{
  "error": {
    "type": "invalid_request_error | rate_limit_error | context_unavailable | internal_error",
    "code": "QUESTION_TOO_LONG | RATE_LIMITED | BONFIRE_TIMEOUT | CLAUDE_ERROR",
    "message": "Human-readable message",
    "retryable": true | false,
    "request_id": "req_..."
  }
}
```

### Rate Limiting (SmartVibe pattern)

| Tier | Limit | Auth |
|------|-------|------|
| Public (unauthenticated) | 10 queries/day per IP | None |
| ZAO member (iron-session) | 100 queries/day | Farcaster login |
| Admin | Unlimited | isAdmin flag |

Enforced via Supabase `assistant_queries` table (see schema below).

---

## Database Schema

```sql
-- Store queries for dedup, rate-limiting, and audit
CREATE TABLE assistant_queries (
  id TEXT PRIMARY KEY DEFAULT 'asst_' || gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
  question TEXT NOT NULL,
  question_hash TEXT NOT NULL,        -- SHA-256 of normalized question
  idempotency_key TEXT,               -- client-provided; unique constraint
  ip_address TEXT,                    -- for rate limiting
  fid INTEGER,                        -- if authenticated
  context_level TEXT NOT NULL DEFAULT 'public',  -- 'public' | 'admin'
  answer TEXT,
  sources JSONB,                      -- doc references used
  bonfire_episodes_used INTEGER,
  error JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX ON assistant_queries(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX ON assistant_queries(ip_address, created_at);  -- for rate limiting
CREATE INDEX ON assistant_queries(fid, created_at);         -- for member rate limiting
```

---

## System Prompt Design

The assistant needs a strong system prompt to stay on-topic and grounded:

```
You are the ZAO assistant — a public-facing AI that knows everything about The ZAO (thezao.xyz).

ZAO is a decentralized music organization that runs WaveWarZ (live music battles on Solana), ZABAL (community token), ZAOstock (annual music festival), and Fractal Democracy (governance). ZOL is ZAO's automated agent on Farcaster (@zolbot).

Answer questions about ZAO using ONLY the context provided below. If the context does not contain enough information to answer, say "I don't have that information yet — check thezao.xyz or ask @bettercallzaal on Farcaster."

Do NOT hallucinate ZAO facts. Do NOT discuss token prices or investment advice. Keep answers under 150 words unless the question requires detail.

--- CONTEXT ---
{bonfire_episodes}
--- END CONTEXT ---
```

The `{bonfire_episodes}` block is filled by the Bonfire vector search results for the user's question.

---

## Fallback: Static Context Bundle (Until Bonfire Read Path Opens)

While `POST /vector_store/search` returns `[]` (doc 680 gate), use a **static context bundle** — a curated JSON file checked into the repo that contains the key facts about ZAO:

```json
// src/lib/assistant/static-context.json
{
  "zao": "The ZAO is a decentralized music organization...",
  "wavewarz": "WaveWarZ is a live music battle platform on Solana where artists earn USDC even when they lose...",
  "zabal": "ZABAL is the community token on Base (0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07)...",
  "zor": "ZOR is an ERC-1155 governance token on Optimism (0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c)...",
  "zaostock": "ZAOstock is ZAO's annual music festival, Oct 3 2026 in Ellsworth, Maine...",
  "africa_battle_week": "Africa Battle Week is Sep 26 2026 — a US rapper vs West African artist with 100% SOL payout to a charity voted by the community...",
  "fractal_democracy": "Fractal Democracy is ZAO's weekly governance session where ZOR holders earn respect rankings..."
}
```

This covers 80% of common questions without Bonfire. The assistant embeds the relevant sections based on keyword matching in the question.

**Upgrade path:** When Bonfire read path opens, switch `context_source` from `static` to `bonfire` in a single env flag: `ASSISTANT_CONTEXT_SOURCE=bonfire`.

---

## UI Integration

### Option A: Chat Widget on zaoos.com (Recommended)

Add a floating chat button to `layout.tsx`. On click, opens a drawer with the chat interface.

```tsx
// src/components/AssistantChat.tsx
// Uses POST /api/assistant/query → poll until completed → render answer
```

Visible on all public pages. Collapses on mobile.

### Option B: WaveWarZ Miniapp (Phase 3, Oct 3)

When the WaveWarZ miniapp ships (doc 1548, Phase 3), embed the assistant as "Ask ZAO" in the miniapp frame. Visitors to the battle miniapp can ask about voting, results, and ZOR.

### Option C: Farcaster Frame (Later)

A standalone Farcaster frame that accepts a question cast and replies with the assistant's answer. Good for /wavewarz channel engagement.

---

## Production Checklist (SmartVibe-Inspired, Doc 1150)

From bartosz0718's SmartVibe production checklist, adapted for ZAO:

- [ ] `ANTHROPIC_API_KEY` server-side only (never in client bundle)
- [ ] Use `Idempotency-Key` header for all POST requests
- [ ] Log `request_id` in every error response for debugging
- [ ] Retry Anthropic 503 with exponential backoff (max 3 retries)
- [ ] Do NOT retry 429 without waiting (`Retry-After` header)
- [ ] Rate-limit by IP at the route level (not just Supabase)
- [ ] Sanitize question input: max 500 chars, strip HTML/script tags
- [ ] Log all queries to `assistant_queries` table for audit + improvement

---

## Implementation Order

### Phase 1: Static Context + API Shell (This Week, 3-4 hours)

1. Create `src/lib/assistant/static-context.json` with ZAO facts (1 hour)
2. Create `POST /api/assistant/query` route (synchronous first — no job queue yet) (1 hour)
3. Create `src/components/AssistantChat.tsx` floating widget (1 hour)
4. Wire into `layout.tsx` (30 min)
5. Test: "What is WaveWarZ?" → answer from static context

**Ship this as a PR.** A working static-context assistant is better than nothing while waiting for Bonfire.

### Phase 2: Async Job Queue (After Phase 1 is live)

1. Add `assistant_queries` Supabase table (migration)
2. Refactor route: POST returns 202 immediately, background process handles Claude call
3. Add `GET /api/assistant/query/{id}` polling endpoint
4. Update `AssistantChat.tsx` to poll until completed
5. Add rate limiting by IP (check `assistant_queries` count in last 24h)

### Phase 3: Bonfire Context (After doc 680 gate opens)

1. Add `ASSISTANT_CONTEXT_SOURCE=bonfire` to env
2. Implement `vectorSearch(question)` in `src/lib/assistant/bonfire.ts`
3. Replace static context with Bonfire results in system prompt
4. Test with Bonfire: "Who won the last ZOR session?" → answer from actual graph

### Phase 4: Member-Tier Queries (After ZAOstock, Nov 2026)

1. Private Bonfire namespace for member-only ZAO content
2. Iron-session auth gate on `/api/assistant/query?context=private`
3. 100 queries/day for logged-in ZAO members

---

## What This Unlocks

| Before | After |
|--------|-------|
| Visitors to zaoos.com read static docs or get lost | Visitors ask "How do I get involved in WaveWarZ?" and get an instant answer |
| ZAO onboarding = Zaal answering the same Telegram DMs repeatedly | Assistant handles the top-20 FAQ — Zaal gets fewer repeat questions |
| 1600+ ZAOOS research docs exist but aren't queryable | Every doc that gets a Bonfire episode becomes part of the assistant's answers |
| WaveWarZ miniapp visitors don't know what ZOR is | "Ask ZAO" in the miniapp explains governance in real time |

---

## Bounty Path (R8 Candidate)

This is Phase 1 of the R8 miniapp bounty (doc 1584). The assistant widget is a self-contained feature:

- **Scope:** Static context + API route + chat widget (Phase 1 above)
- **Reward:** 20,000-50,000 ZABAL (from R8 range)
- **Dependencies:** None (Phase 1 uses no Bonfire, no external auth)
- **Timeline:** 3-4 hours for a developer familiar with Next.js + Anthropic SDK

Tag for R8 Bountycaster cast (Jul 25, /bounties + /miniapps channel): "Build ZAO's public AI assistant — Next.js route + chat widget, Anthropic API."

---

## Sources

- Board task: "ZAO AI assistant - bartosz-style, Bonfire-backed"
- Doc 1150: bartosz0718 SmartVibe API design (the "bartosz-style" reference — async polling, idempotency, consistent errors, production checklist)
- Doc 570: Zaal's personal KG + Bonfire multi-corpus plan
- Doc 665: Bonfire deep-dive — ZAO integration (API schema, episode format)
- Doc 680: Bonfire bridge + read-path gate (why `/vector_store/search` currently returns `[]`)
- Doc 601: ZOE bot architecture (ZAO's private assistant — this is the public-facing complement)
- Doc 605: Agentic tooling May 2026 (Claude Agent SDK context)
- `zabal.bonfires.ai` / BONFIRE_ID `69ef871f0d22ed7e6f2b243a`
- `src/lib/crm/types.ts`: `CrmContactPublic` (public network layer pattern to adapt)
- `src/app/network/page.tsx`: anon-client + RLS pattern for public routes (same pattern for assistant)
