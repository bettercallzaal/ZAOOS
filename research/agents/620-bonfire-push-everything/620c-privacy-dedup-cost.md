---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-06
related-docs: 547, 568, 613, 615, 618, 619, 620
tier: STANDARD
parent-doc: 620
---

# 620c — Privacy, dedup, cost (operational layer for auto-ingest)

> **Goal:** Define operational safeguards for auto-pushing everything to Bonfire knowledge graph. Prevent privacy leaks, avoid duplicate facts, track cost, maintain audit trail.

---

## Decision Matrix: Operational Concerns

| Concern | Chosen Approach | Rationale |
|---------|-----------------|-----------|
| **Redaction** | Regex-strip before push (5 patterns) + human consent gate for Telegram group messages | API keys / wallet keys / .env never push. Third-party PII in group chats requires explicit opt-in. |
| **Dedup** | Client-side content hash (local SQLite) + Bonfire server-side title+metadata merge | Avoid 740 research doc backfill duplicating facts. Bonfire schema assumes similar entities merge by vector similarity. |
| **Cost** | Vector-only for nightly diffs + full-graph for new docs. Est. 30-50K chars/day = USD 0.30-1.50/day. | Daily volume < 1M chars. Full-graph on all sources would run 10-15x higher cost. Mix strategy = 80% cost saving. |
| **Audit trail** | jsonl log at `~/.zao/zoe/bonfire-pushes.log` (timestamp, source, hash, job_id, bytes) | Trace what went in, debug recall gaps, detect private-data leaks post-hoc, count against budget. |
| **Rate limiting** | Serialize jobs: max 3 active at once. Exponential backoff on 5xx; skip on 4xx. | Bonfire API async. Never exceed job concurrency per /jobs/active endpoint. Fail safe: log and move on. |
| **Two-graph question** | ONE Bonfire: Zaal's personal graph. Research docs stay in same graph + tagged with `source: research`. | Cross-bonfire recall is not yet supported. Mixed graph is acceptable: Zaal owns both dimensions. Delineate with metadata only. |

---

## 1. Privacy + Redaction Layer

### Secrets That Must Never Push

1. **API Keys:** `sk-ant-*`, `sk-*` (OpenAI pattern), `NEYNAR_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. **Wallet Private Keys:** `0x[a-fA-F0-9]{64}` (full Ethereum private key pattern)
3. **Session Secrets:** `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY` (from `.env`)
4. **Tokens & Credentials:** `[A-Z0-9_]{20,}=` (generic base64 token pattern), GitHub PAT (`ghp_[A-Za-z0-9]{36}`)
5. **PII without consent:** Email addresses, US phone numbers, names of people who did not consent to third-party graph

### Redaction Regex Patterns (PCRE)

```
# Anthropic API keys
sk-ant-[A-Za-z0-9_-]{20,}

# OpenAI/similar keys
sk-[A-Za-z0-9]{32,}

# Ethereum private keys (64-char hex)
(?:0x)?[0-9a-fA-F]{64}

# Generic long tokens (env-var style)
[A-Z_]{10,}=[A-Za-z0-9/_-]{20,}

# GitHub PAT
ghp_[A-Za-z0-9]{36}

# Email (to redact from group messages)
[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}

# US Phone (to redact from group messages)
(?:\+1)?[-.\s]?(?:\(\d{3}\))?[-.\s]?\d{3}[-.\s]?\d{4}
```

**Implementation:**

```typescript
// bot/src/zoe/redact.ts
export function redactSecrets(content: string): string {
  const patterns = [
    /sk-ant-[A-Za-z0-9_-]{20,}/g,
    /sk-[A-Za-z0-9]{32,}/g,
    /(?:0x)?[0-9a-fA-F]{64}/g,
    /[A-Z_]{10,}=[A-Za-z0-9/_-]{20,}/g,
    /ghp_[A-Za-z0-9]{36}/g,
  ];
  
  let redacted = content;
  patterns.forEach(pattern => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });
  
  return redacted;
}
```

### Consent Gate: Group Messages

**Decision:** Push only Zaal's outbound messages to Telegram group chats. Never push others' inbound messages without explicit opt-in (add field `source: telegram_outbound_zaal_only` to metadata).

**Rationale:** Prevents accidental disclosure of private DMs, team discussions, or other members' thoughts to third-party KG. Zaal can still recall his own questions + decisions; the graph is lower-fidelity for multi-user threads but privacy-respecting.

**Implementation:**
- Telegram ingest script checks `message.from_user.id` == Zaal's Telegram user ID
- Only push if true. Skip all inbound messages.
- Log skipped count daily: `"2026-05-06: ingested 23 of 47 Telegram messages (24 skipped — not Zaal)"` to `bonfire-pushes.log`

### PII Redaction for Research Docs

Research docs may reference real people (e.g., "Steve Peer", "Matteo Tambussi") + contract terms (e.g., "$20K budget"). Default: push as-is. If doc marked `[PRIVATE]` in title or frontmatter, skip.

---

## 2. Dedup Strategy

### Bonfire Server-Side Dedup

Query `/openapi.json` reveals `/ingest_content` has NO explicit dedup or merge logic. Test assumption: Bonfire merges entities by vector similarity (KG standard). Re-ingesting the same content (same title + content hash) likely results in vector-index update, not duplication in the graph itself. **Action item:** Ask Joshua.eth to confirm.

### Client-Side Dedup: Content Hash

**Storage:** `~/.zao/zoe/bonfire-dedup.sqlite`

```sql
CREATE TABLE bonfire_pushes (
  id INTEGER PRIMARY KEY,
  source TEXT NOT NULL,
  path TEXT,
  content_hash TEXT NOT NULL UNIQUE,
  title TEXT,
  bonfire_id TEXT,
  job_id TEXT,
  pushed_at DATETIME,
  char_count INTEGER,
  metadata_json TEXT
);

CREATE INDEX idx_source ON bonfire_pushes(source);
CREATE INDEX idx_path ON bonfire_pushes(path);
```

**Before each push:**
1. Compute `SHA256(content_string)` -> `content_hash`
2. Query: `SELECT COUNT(*) FROM bonfire_pushes WHERE content_hash = ?`
3. If found: skip (log: `"doc-547 already pushed 2026-05-06T14:22:11Z"`)
4. If not found: push and INSERT row with timestamp + job_id

**For backfill scenario (740 research docs):**
- Walk `research/*/README.md`, compute hashes for all
- Batch into 50-doc POST calls to `/ingest_content_vector_only` (cheaper)
- INSERT rows for each batch, atomically
- Expected: 740 new rows, ~30-60 seconds total backfill time

**For nightly diff:**
- `git diff --name-only research/` yesterday -> today
- For each changed file, re-compute hash, check table
- If changed: re-push (hash will differ)
- Result: update existing row or insert new row

### Soft Dedup: Entity Merge by Bonfire

Within the graph, "Steve Peer" appears in research docs #476, #582, #590. Bonfire's KG should merge these into one entity with 3 Document links. Verify by:
1. After backfill, query Bonfire's `/agents/{id}/chat` with "who is Steve Peer?"
2. Expect ONE entity node, 3 related documents, not 3 separate "Steve Peer" nodes.

---

## 3. Cost Model

### Daily Push Volume Estimate

| Source | Frequency | Volume | Chars | Notes |
|--------|-----------|--------|-------|-------|
| **Telegram** | 50 msgs/day avg | 200 chars/msg | 10K | `~/.zao/zoe/recent.json` rolling |
| **Farcaster casts** | 10 casts/day | 500 chars/cast | 5K | Zaal FID 19640 only |
| **Voice transcripts** | 20 min/day | 150 wpm | 18K | Whisper output, ~1 file/day |
| **Newsletter draft** | 1/day | 1500 chars | 1.5K | ZOE agent output |
| **Memory file edits** | 0-3/day | 5K chars avg | 0-15K | Sporadic updates |
| **Research doc changes** | 2-5 new/day | 8K avg | 16-40K | Nightly vector-only ingest |
| **SUBTOTAL** | — | — | **50-90K chars** | ~15-30K tokens equiv. |

### Pricing Estimate (Bonfire Private — Ask Joshua.eth)

Based on comparable services (Cognee, Graphiti, LightRAG), typical pricing:
- **Vector-only ingest:** USD 0.001-0.005 per 1K chars (cheap indexing)
- **Full-graph ingest:** USD 0.01-0.05 per 1K chars (entity extraction + linking)

**Conservative estimate (mid-tier):**
- 30K chars vector-only @ 0.003/1K = USD 0.09/day
- 20K chars full-graph @ 0.02/1K = USD 0.40/day
- **Total: USD 0.50/day = USD 15/month**

**Worst case (aggressive ingest, all full-graph):**
- 90K chars full-graph @ 0.05/1K = USD 4.50/day = USD 135/month

**Strategy to stay low:**
- Nightly diffs: always vector-only (saves 4-5x)
- New docs: full-graph only if user marks as "important"
- Research backfill: vector-only (1-time cost ~USD 3)
- Query API: typically free or bundled in Genesis tier

**Genesis tier status:** Zaal already pays (confirmed in prior research). Estimate is incremental cost above base subscription.

---

## 4. Audit Trail

### Push Log Schema

File: `~/.zao/zoe/bonfire-pushes.log` (jsonl format, one JSON object per line)

```json
{
  "timestamp": "2026-05-06T14:22:11.345Z",
  "source": "research",
  "path": "research/agents/620-bonfire-push-everything/README.md",
  "title": "620 — Auto-push everything to Bonfire knowledge graph",
  "content_hash": "sha256:a3f5e2c...",
  "char_count": 8234,
  "bonfire_id": "BONFIRE_ID",
  "job_id": "job_12345abc",
  "ingest_type": "vector_only",
  "status": "queued",
  "retry_count": 0,
  "notes": ""
}
```

### Log Lifecycle

1. **Pre-push:** Write entry with `status: queued`, `job_id: null`
2. **Post-push:** GET `/jobs/{job_id}/status`, update entry with `job_id`, `status: processing`
3. **Poll completion:** When job status = `completed`, update `status: success`
4. **Failure:** Update `status: failed`, add `error_message` field, increment `retry_count`

### Retention

- Keep all logs indefinitely (cheap to store).
- Rotate log file daily: `bonfire-pushes.log` -> `bonfire-pushes.log.2026-05-05`, etc.
- Optional: sync to Supabase table `bonfire_audit` for dashboard query (read-only).

### Analysis Queries

```bash
# Count pushes by source, last 7 days
jq 'select(.timestamp > "2026-04-29") | .source' bonfire-pushes.log | sort | uniq -c

# Find failed pushes
jq 'select(.status == "failed")' bonfire-pushes.log

# Estimate daily cost
jq 'select(.timestamp | startswith("2026-05-06")) | .char_count' bonfire-pushes.log | \
  awk '{s+=$1} END {print s " chars, est. USD " (s*0.00003)}'
```

---

## 5. Rate Limiting + Backoff

### Job Concurrency Limit

Query `/jobs/active` at start of each ingest batch. If `total >= 3`, wait before pushing new job.

```typescript
async function waitForCapacity() {
  const maxConcurrent = 3;
  
  while (true) {
    const res = await fetch('https://tnt-v2.api.bonfires.ai/jobs/active', {
      headers: { Authorization: `Bearer ${BONFIRE_TOKEN}` },
    });
    const { total } = await res.json();
    
    if (total < maxConcurrent) break;
    console.log(`Bonfire has ${total} active jobs, waiting...`);
    await sleep(5000); // 5s poll
  }
}
```

### Backoff Strategy

- **5xx (server error):** Exponential backoff: 2s, 4s, 8s, 16s, 32s (stop after 5 retries, then skip)
- **4xx (client error):** Log error, skip (not Bonfire's fault; likely bad payload)
- **Timeout (>30s):** Treat as 5xx, retry

```typescript
async function ingestWithBackoff(payload, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch('https://tnt-v2.api.bonfires.ai/ingest_content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BONFIRE_TOKEN}` },
        body: JSON.stringify(payload),
      });
      
      if (res.status >= 500) throw new Error(`5xx: ${res.status}`);
      if (res.status >= 400) {
        console.error(`4xx skipping: ${res.status}`, await res.text());
        return; // Don't retry 4xx
      }
      
      const { job_id } = await res.json();
      return job_id;
    } catch (err) {
      const backoffMs = Math.pow(2, attempt) * 1000;
      console.log(`Retry ${attempt + 1}/${maxRetries} in ${backoffMs}ms:`, err.message);
      await sleep(backoffMs);
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

---

## 6. One Bonfire or Two? Zaal Personal + ZAO Public

### Decision: ONE Bonfire (Zaal's personal)

**Reasoning:**
1. **Cross-recall today:** Bonfire does not support querying across multiple graphs (no federation). If research docs + memory files were split, Zaal's recall for "what context do I have on Steve Peer?" would need two API calls + manual merge.
2. **Access simplicity:** Genesis tier is one graph. Spinning up a second bonfire means separate billing, separate API keys, separate auth flow.
3. **Delineation by metadata:** Instead of two graphs, tag everything: `source: research`, `source: memory`, `source: personal`. Zaal can filter later.

**Future consideration (post-doc-620):** If ZAO research docs grow to 1500+ and Zaal wants a PUBLIC searchable ZAO knowledge graph (for community discovery, not recall), consider:
- Standalone Bonfire for ZAO Public (subset of research docs, no memory files, no personal casts)
- Bonfire API gateway at `/zao-research` that pushes to Public graph only
- Would require consent filtering: only ingest docs marked `[PUBLIC]`

**For now:** One graph, metadata-driven access control.

---

## 7. Pre-Push Checklist (Before First Backfill)

Before shipping `bot/src/zoe/bonfire-ingest.ts`:

- [ ] `.env` has `BONFIRE_ID` + `BONFIRE_TOKEN` (never check in; SSH only)
- [ ] Redaction layer tested on 5 real research docs (no false positives)
- [ ] Consent gate implemented: Telegram group messages skip by default
- [ ] Dedup table created at `~/.zao/zoe/bonfire-dedup.sqlite`
- [ ] Backoff logic tested with simulated 5xx failures
- [ ] Audit log template tested (write one entry, verify jsonl format)
- [ ] Rate limit check implemented (`/jobs/active` poll)
- [ ] Dry run on 10 research docs to staging Bonfire (if available)
- [ ] Cost estimate re-verified with Joshua.eth before bulk backfill

---

## Sources

- Bonfire OpenAPI spec: https://tnt-v2.api.bonfires.ai/openapi.json (endpoints `/ingest_content`, `/jobs/active`, `/insights/costs`)
- Secret hygiene reference: `.claude/rules/secret-hygiene.md` (five-guard pattern)
- Comparable KG services: doc 568 (Khoj, Reor, LightRAG, Cognee pricing patterns)
