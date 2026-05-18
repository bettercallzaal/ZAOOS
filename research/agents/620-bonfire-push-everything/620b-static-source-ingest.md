---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-06
related-docs: 547, 613, 614, 615, 618, 619, 620
tier: STANDARD
parent-doc: 620
---

# 620b — Static-source ingest (research docs, memory files, drafts, archives)

> **Goal:** Catalog static sources (files, docs, archives on disk) and recommend push strategy to Bonfire knowledge graph so Zaal's recall system never goes stale.

## Decision Matrix: Push Strategy per Source

| Source | Count | Type | Recommendation | Reasoning | Difficulty |
|--------|-------|------|---|-----------|------------|
| **Research docs** (`research/` all subdirs) | 740 | markdown | **CRON nightly** vector-only + **HOOK on new/changed** full-graph | Vector-only cheap for mass updates; full-graph linkage rich for hot docs. 740 files too large for backfill in one call. | 6 |
| **Memory files** (`~/.claude/.../memory/`) | 135 | yaml+md | **BACKFILL-ONCE** full-graph, then **CRON hourly** diff | 135 files is one-shot backfill cost. These are Zaal's operating facts — must be in Bonfire or recall is useless. | 4 |
| **Newsletter drafts** (`~/.zao/zoe/newsletters/` on VPS) | rolling daily | markdown | **HOOK on write** to ZOE newsletter agent | Date-stamped entry after Whisper processing. Post as Document with {date, voice: zabal-y1, source: newsletter}. | 5 |
| **Voice transcripts** (Whisper `.txt` on VPS) | rolling | plaintext | **WATCHER on file creation** in `~/.zao/zoe/transcripts/` | Distinct from live stream (sub-agent 1). File-based after Whisper writes. Ingest as Document {date, transcript: true, source: whisper}. | 3 |
| **GitHub artifacts** (PRs, commits, issues) | rolling | structured | **WEBHOOK from GitHub** (or **CRON hourly** `gh` CLI) | Hermes auto-fix PRs are facts ("fixed X on Y"). Pull via gh API, push as Relation (Commit -describes- CodeChange). Rich for traceability. | 7 |
| **External archives** (Telegram, Farcaster, Pinboard, Lu.ma) | one-time bulk | json/export | **BACKFILL-ONCE per archive** | Telegram `recent.json` (rolling) + older exports. Farcaster cast history via Neynar bulk. Browser bookmarks. One-shot load, no ongoing sync unless Zaal exports new data. | 8 |

---

## Source-by-Source Implementation Path

### 1. Research Docs (`research/`, 740 files across 10+ topic folders)

**Structure:**
- Each numbered doc like `280-fid-registration-x402-deep-dive/README.md`
- YAML frontmatter in first comment block (rare; most just start with H1)
- Content: full markdown body (2-50 KB typical)

**Bonfire Ingest Plan:**
1. **Backfill-once (difficulty 3):** Script walk of `research/*/README.md`, extract title (first H1), frontmatter if present, full body. Batch into ~50 docs per POST /ingest_content_vector_only call (cheaper). Creates 740 Document nodes indexed by title + research-topic metadata.
2. **Nightly cron diff (difficulty 4):** After backfill, `git diff --name-only` on the research/ folder nightly. If any `.md` changed, re-ingest as vector-only (fast). If new doc numbered >current-max, do full-graph ingest (links relations to 620 parent).
3. **Git hook on commit (difficulty 5):** Pre-push hook checks `git diff HEAD~1` for research/ changes. If found, queue ingest job to async worker (defer to next morning to avoid blocking push).

**Payload shape (vector-only for nightly):**
```json
{
  "content": "[full markdown body]",
  "bonfire_id": "BONFIRE_ID",
  "title": "280 - FID Registration...",
  "metadata": {
    "doc_number": 280,
    "source": "research",
    "path": "research/agents/280.../README.md",
    "topic": "agents",
    "related": [281, 288, 289]
  }
}
```

**Why vector-only for nightly:** 740 docs is manageable as searchable entities, but full-graph (extracting entities + relations from each doc body) takes ~10-30sec per doc. Nightly = vector index + title is enough for recall; full-graph on new/hot docs when Zaal cares.

---

### 2. Memory Files (`~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/`, 135 files)

**Structure:**
- Each file has YAML frontmatter: `name`, `description`, `type` (project / user / feedback / reference), optional `originSessionId`
- Body: markdown facts (1-5 KB typical)
- Index at `MEMORY.md` lists all 135 with 1-line synopsis

**Bonfire Ingest Plan:**
1. **Backfill-once (difficulty 3):** Read entire memory/ folder, parse YAML frontmatter of each file, extract title (from `name` field) + body. POST each as full-graph (not vector-only) because these ARE entities — user facts, project decisions, feedback patterns. Create 135 Entity nodes typed by frontmatter `type` field.
2. **Cron hourly diff (difficulty 4):** After backfill, check `ls -la ~/.claude/.../memory/` and md5-hash each file. If hash changed, re-ingest that one file as full-graph. If new file created, ingest as full-graph. Goal: keep Bonfire's user/project/feedback entities in-sync with local memory without waiting for human review.

**Payload shape (full-graph for memory):**
```json
{
  "content": "[markdown body]",
  "bonfire_id": "BONFIRE_ID",
  "title": "Hermes is the canonical agent framework for ZAO",
  "metadata": {
    "type": "project",
    "source": "memory",
    "path": "~/.claude/.../memory/project_hermes_canonical.md",
    "originSessionId": "cf4c6640...",
    "relatedMemories": ["project_zoe_v2_redesign", "project_ollama_local_llm"]
  }
}
```

**Critical:** Memory files must go into Bonfire FIRST before research docs or other ingest. These are the ground truth. Zaal's recalls won't work without them. Prioritize as P0 backfill.

---

### 3. Newsletter Drafts (`~/.zao/zoe/newsletters/<date>.md` on VPS)

**Structure:**
- Daily entry generated by ZOE newsletter agent after 6am EST
- Date-stamped filename: `2026-05-06.md`, `2026-05-07.md`
- Content: 300-800 words, first-person voice (zabal-y1 persona)

**Bonfire Ingest Plan:**
1. **Hook on ZOE write (difficulty 4):** After ZOE newsletter agent writes `~/.zao/zoe/newsletters/<date>.md`, file-watcher triggers ingest. POST /ingest_content with full body. Creates Document node with metadata `{voice: zabal-y1, source: newsletter, date: 2026-05-06}`. Links to Bonfire agent UUID `69f13a649469bbc15bf61c10` as author.
2. **Backfill rolling history (difficulty 3):** At session start, ls `newsletters/` for last 30 days, check which already in Bonfire (via Bonfire search), backfill missing. Keep in sync with no more than 2-day lag.

**Payload shape:**
```json
{
  "content": "[markdown newsletter body]",
  "bonfire_id": "BONFIRE_ID",
  "title": "Daily reflection - 2026-05-06",
  "metadata": {
    "date": "2026-05-06",
    "voice": "zabal-y1",
    "source": "newsletter",
    "bonfire_agent_author": "69f13a649469bbc15bf61c10"
  }
}
```

---

### 4. Voice Transcripts (Whisper output `.txt` on VPS)

**Structure:**
- After Whisper processes audio (ZOE voice capture), writes `~/.zao/zoe/transcripts/<timestamp>.txt`
- Plain text, ~500-2000 words per session
- Rolling, new file every voice-session (typically 1-3x daily)

**Bonfire Ingest Plan:**
1. **Watcher on file creation (difficulty 3):** inotifywait or systemd file-trigger on `transcripts/` directory. When new `.txt` created, POST /ingest_content. Document node with metadata `{source: whisper, timestamp, duration_approx}`. Link to session transcript chain.
2. **No backfill needed.** Transcripts are live-going-forward. If Zaal wants past transcripts in Bonfire, explicit export request.

**Payload shape:**
```json
{
  "content": "[plain-text transcript]",
  "bonfire_id": "BONFIRE_ID",
  "title": "Voice transcript - 2026-05-06T14:32:11Z",
  "metadata": {
    "source": "whisper",
    "timestamp": "2026-05-06T14:32:11Z",
    "model": "whisper-large-v3",
    "language": "en"
  }
}
```

---

### 5. GitHub Artifacts (PRs, commits, issue comments)

**Structure:**
- Hermes auto-fix PRs (`#470+`) with title + body describing the fix
- Commit messages on `ws/` branches (rich context)
- Issue comments linking decisions to trackers
- All accessible via `gh api repos/zaalpanthaki/ZAO\ OS\ V1/...`

**Bonfire Ingest Plan:**
1. **Cron hourly `gh` walk (difficulty 6):** Every hour, run `gh pr list --state all --json title,body,number,url,mergedAt` + `gh issue list --state all --json title,body`. Filter for last-modified in past hour. POST each PR/issue as Document (full-graph to extract commit links, assignee mentions). Creates Relation between (Commit) -authored-by- (Zaal) -fixes- (Issue). Rich for agent traceability ("what did Hermes fix?").
2. **GitHub webhook (difficulty 7):** Alternatively, POST https://bonfire-ingest.zaoos.com/github-webhook on every push/PR/issue event. More real-time but requires endpoint auth + secret.

**Payload shape (from PR):**
```json
{
  "content": "[PR title + body]",
  "bonfire_id": "BONFIRE_ID",
  "title": "PR #470 — fix(zoe): close stdin on claude CLI spawn",
  "metadata": {
    "source": "github",
    "type": "pull_request",
    "number": 470,
    "mergedAt": "2026-05-04T18:22:11Z",
    "branch": "ws/research-607-three-bot-substrate",
    "relatedIssues": [607]
  }
}
```

---

### 6. External Archives (Telegram, Farcaster, Pinboard, Lu.ma, browser bookmarks)

**Structure:**
- Telegram: `~/.zao/zoe/recent.json` (rolling last-N messages) + older exports from Telegram Desktop
- Farcaster: cast history via Neynar `GET /v2/farcaster/casts/user` bulk endpoint
- Pinboard/Raindrop: JSON export
- Lu.ma: RSVP/attended event list via personal export
- Browser: bookmarks.html or .json from Firefox/Safari

**Bonfire Ingest Plan:**
1. **Backfill-once per archive (difficulty 4-8 depending on source).** For each archive type, write a one-time ingest script:
   - **Telegram:** Read `recent.json` + any older `.json` exports. Group by date. POST as Document per day or per thread, metadata `{source: telegram, channel: @...}`.
   - **Farcaster:** Call Neynar bulk endpoint for all casts by Zaal FID 19640 (or similar), POST as Document per cast, metadata `{source: farcaster, cast_hash, reactions, replies_count}`.
   - **Pinboard/bookmarks:** Parse JSON, POST as Document per bookmark cluster (by tag), metadata `{source: pinboard, tags: [...], added_at}`.
   - **Lu.ma:** Export event RSVPs, POST as Document per event attended, metadata `{source: luma, event_date, event_name, location}`.
2. **No ongoing sync.** Archives are one-shot backfill. If Zaal later exports new data, manual trigger to re-ingest.

**Example payload (Telegram):**
```json
{
  "content": "[concatenated messages from 2026-05-06, preserving timestamps]",
  "bonfire_id": "BONFIRE_ID",
  "title": "Telegram messages - 2026-05-06",
  "metadata": {
    "source": "telegram",
    "date": "2026-05-06",
    "message_count": 47,
    "from_channels": ["@zaalp99", "@bettercallzaal"]
  }
}
```

---

## 3-Step Ship Order

**Difficulty 1-10 scale (not time estimates).**

1. **Backfill Memory Files + initial research docs (difficulty 4):**
   - Write `bot/src/zoe/bonfire-ingest.ts` with functions: `ingestMemoryFiles()` (reads 135 files), `ingestResearchDocs()` (batches 740 files, vector-only).
   - Test against staging Bonfire (use test bonfire_id if available, else create new one).
   - Run once, verify 875 nodes created in Bonfire.

2. **Wire cron jobs + git hooks (difficulty 5):**
   - Add systemd timer: `/etc/systemd/user/bonfire-nightly.timer` runs `bonfire-ingest.ts nightly-diff` at 2am EST.
   - Add pre-push hook: `.git/hooks/pre-push` checks for research/ changes, queues full-graph re-ingest to async worker (don't block push).
   - Add file-watcher for `~/.zao/zoe/newsletters/` and `transcripts/` (use systemd path unit or inotifywait in ZOE subprocess).

3. **One-time archive backfill (difficulty 6):**
   - Write `scripts/backfill-bonfire-archives.ts` with handlers for each archive type (Telegram, Farcaster, bookmarks).
   - Dry-run on subset of Telegram messages, verify shape matches Bonfire /ingest_content schema.
   - Run once for each archive type, log backfill completion to `~/.zao/zoe/bonfire-backfill.log`.

---

## Notes & Trade-offs

- **Vector-only vs full-graph:** Vector-only = fast, scalable, good for retrieval; full-graph = slow, rich, good for semantic navigation. Mix: vector-only for nightly diffs, full-graph for hot docs + memory files.
- **Backfill timing:** Memory files MUST backfill before research docs or Zaal's recall will be incomplete. Schedule memory-backfill as prerequisite.
- **De-duplication:** Bonfire API likely handles via title + content hash. Test on 2-3 files first before bulk backfill.
- **Offline workflow:** If Bonfire API is down, queue ingests to local SQLite (at `~/.zao/zoe/bonfire-queue.db`), retry on next sync. Don't lose data.

---

## Sources

- Bonfire OpenAPI spec: https://tnt-v2.api.bonfires.ai/docs (requires Genesis tier auth)
- GitHub webhook events: https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks
- inotifywait documentation: https://linux.die.net/man/1/inotifywait
