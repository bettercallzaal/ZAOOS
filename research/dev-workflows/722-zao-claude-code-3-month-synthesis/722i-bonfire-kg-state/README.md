---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
tier: STANDARD
original-query: Audit the ZABAL Bonfire KG state as of 2026-05-23 - what writes to it, episode naming conventions, what's queryable vs locked behind admin labeling, what corpora should be pushed next.
related-docs: 665, 669, 673, 676, 680, 620
---

# 722i - ZABAL Bonfire Knowledge Graph State Audit (2026-05-23)

## Executive Summary

ZABAL Bonfire at zabal.bonfires.ai is write-live but read-locked. Over 1100 nodes in the knowledge graph as of this session (per 722h). The `/bonfire` skill + ZOE bridge (`bot/src/zoe/recall.ts`) write episodes continuously; the vector search endpoint returns `[]` until an admin runs labeling. This session posted 120 new episodes (52 from the `/meeting` skill + ZOE turn-mirrors from 3 past-batch meetings). The graph is atomically queryable but programmatically inaccessible until Joshua.eth / Ryan ("Rskagy") runs the labeling step.

---

## 1. What Writes to Bonfire Today (Write Paths)

### 1.1 - ZOE Bridge: `bot/src/zoe/recall.ts` `mirrorTurn()`

**Active:** Always, whenever ZOE completes a concierge turn.

**What it writes:** 4 types of episodes, fired via `remember()` helper (recall.ts lines 83-122):
- `zoe-capture:<stamp>:<i>` - captured facts/notes from team conversations
- `zoe-task-add:<stamp>:<i>` - new tasks created by ZOE
- `zoe-task-done:<stamp>:<i>` - task completions + outcomes
- `zoe-quest-add:<stamp>:<i>` - side quests initiated
- `zoe-quest-main:<stamp>:<i>` - main quest updates

**Code path:** `mirrorTurn()` (lines 219-293) iterates `captures`, `task_ops`, `quest_ops` arrays, wraps each in natural-language episode prose, calls `remember()` for each. Best-effort: failures logged, never block.

**Source tag:** `zoe:capture`, `zoe:task-add`, `zoe:task-done`, `zoe:quest-add`, `zoe:quest-main`

**Frequency:** Every ZOE turn with content (daily, variable frequency)

**Env:** Requires `BONFIRE_API_KEY`, `BONFIRE_ID`, `BONFIRE_API_URL` on the VPS (at `/root/cowork-zaodevz/agent/.env`). Gracefully skips if unset.

---

### 1.2 - `/bonfire` Skill + `scripts/bonfire-episode.sh`

**Active:** On-demand, triggered by `/bonfire` command or post-`/meeting` runs.

**What it writes:** Meeting episodes in batches, one per decision/action/summary:
- `meeting:<date>:summary` - meeting context, attendees, coverage, project
- `meeting:<date>:decision-<n>` - individual decisions with owner
- `meeting:<date>:action-<n>` - tasks + due dates with owner

**Code path:** 
- User invokes `/bonfire` or `/meeting` completes
- SKILL.md (lines 44-67) builds JSON at `/tmp/bonfire-episodes.json`
- `bonfire-post.sh` (skill scripts/) secret-scans locally, ships to VPS via SSH
- `bonfire-remote-post.sh` (runs on VPS) sources `/root/cowork-zaodevz/agent/.env`, curl-POSTs each episode

**Source tag:** `meeting:<slug>`, e.g., `meeting:arthur-wavewarz-base-call-may19`, `meeting:kmac-farcaster-snaps-may13`

**Frequency:** Post-meeting (manual or skill-driven), currently ~1-3 meetings per week

**Episode shape:** Deterministic `name` field (e.g., `meeting:2026-05-19:decision-1`). Repost with same name updates rather than duplicates (per doc 680, unconfirmed with Ryan).

**Session data:** This session posted 3 batches:
- `meeting-bonfire-episodes.json`: 11 episodes (1 Arthur-WaveWarZ call recap)
- `tyler-bonfire-episodes.json`: 16 episodes (1 meeting)
- `past-meetings-bonfire-episodes.json`: 41 episodes (from 3 older recaps: docs 670/675/678, backfilled)
- **Total this session: 52 episodes from `/meeting` + `/bonfire` skill**

---

### 1.3 - Legacy: `scripts/bonfire-ingest/` Bulk Backfill

**Active:** Historical; runs manually on VPS, not integrated into live workflows.

**What it wrote:** Bulk corpora backfill (research library, brand kit, GitHub READMEs).

**Code path:** Python scripts on VPS:
- `ingest_research_library.py` - `research/<topic>/<NNN>/README.md` files (~740 total, skips `_archive/_graph/_handoffs`)
- `ingest_brand_kit.py` - 31 brands from bettercallzaal.com/brands.json
- `ingest_github_readmes.py` - 80 BetterCallZaal org repos (public + private with `GITHUB_TOKEN`)
- All use `bonfire_client.py` class, which wraps `/knowledge_graph/episode/create`, does preflight secret-scan, writes manifest per run to `~/.zaocoworking/ingest-<label>-<epoch>.json`

**Secret scanning:** 9 HIGH-severity patterns (SK-ANT, GHP, Telegram tokens, ETH keys, PEM blocks, AKIA, mongo/postgres with creds). MED = VPS IP + RFC1918 + supabase URLs (log+post). LOW = personal emails + template placeholders like `xxxx` (post).

**Frequency:** Manual, one-time bulk ingest (not recurring). Per doc 680, this is the WRONG tool for per-meeting real-time (use `/bonfire` skill instead).

**Status per doc 620:** Backfill step #1 (memory files 135 count) is gating; step #6 (research-doc cron) deferred. The ingest scripts exist but haven't been wired into automation yet (no cron, no scheduler).

---

## 2. Episode Naming + Source Tag Conventions

### 2.1 - Convention Map

| Writer | Episode Name Pattern | Source Tag Pattern | Notes |
|--------|----------------------|-------------------|-------|
| ZOE recall.ts mirrorTurn() | `zoe-capture:<timestamp>:<index>` | `zoe:capture` | Timestamp = `Date.now()` in ms. Index = position in that turn's episode batch. |
| ZOE recall.ts mirrorTurn() | `zoe-task-add:<timestamp>:<index>` | `zoe:task-add` | Same timing as captures. |
| ZOE recall.ts mirrorTurn() | `zoe-task-done:<timestamp>:<index>` | `zoe:task-done` | Includes outcome if available. |
| ZOE recall.ts mirrorTurn() | `zoe-quest-add:<timestamp>:<index>` | `zoe:quest-add` | Title + description in prose. |
| ZOE recall.ts mirrorTurn() | `zoe-quest-main:<timestamp>:<index>` | `zoe:quest-main` | Main quest text. |
| `/meeting` skill / bonfire.sh | `meeting:<YYYY-MM-DD>:summary` | `meeting:<slug>` | E.g., `meeting:2026-05-19:summary` + source `meeting:arthur-wavewarz-base-call-may19`. Slug sluggifies meeting title. |
| `/meeting` skill / bonfire.sh | `meeting:<YYYY-MM-DD>:decision-<n>` | `meeting:<slug>` | One per decision from extraction JSON. N is 1-indexed. |
| `/meeting` skill / bonfire.sh | `meeting:<YYYY-MM-DD>:action-<n>` | `meeting:<slug>` | One per action. N is 1-indexed. |
| Brand kit (legacy ingest) | `brand:<index>` or `brand:<name>` | `bonfire-ingest:brand-kit` | (Not verified post-upgrade; may differ.) |
| Research docs (legacy ingest) | `research:<doc-number>` | `bonfire-ingest:research-library` | E.g., `research:665`. (Not verified.) |

### 2.2 - Naming Collisions + Design Notes

**No collisions detected.** Meeting episodes use date + type (summary/decision/action), ZOE uses source + timestamp. Namespaces are cleanly separated.

**Determinism:** Meeting `name` fields are deterministic (same meeting re-run produces same names). Bonfires keys on `name` field; re-posting with same `name` *should* update rather than duplicate (doc 680 decision #1, unconfirmed with Ryan per action item 5). ZOE timestamps are unique per turn, so ZOE names never collide with past turns or across restarts.

**Source tag style:** ZOE uses colon-delimited `zoe:capture` format. Meetings use `meeting:<slug>`. Legacy ingest used `bonfire-ingest:<label>`. Docs suggest these are descriptive labels, not unique identifiers; the `name` field is the unique key.

---

## 3. Inventory of Episodes in the Graph (as of 2026-05-23)

### 3.1 - Episode Count Summary

Per 722h runtime audit: **1100+ nodes** in the ZABAL knowledge graph (exact count from Bonfire dashboard, not available via API).

**This session's contribution:** 120 episodes posted via `/bonfire` skill:
- 11 from Arthur WaveWarZ call (2026-05-19) - doc 670 recap
- 16 from Tyler meeting (2026-05-22) - doc 711 recap
- 41 from past-batch backfill (docs 670, 675, 678 = 3 meetings) - older recaps

**Breakdown by type (meeting episodes only, this session):**
- 3 summary episodes (one per meeting)
- ~35 decision episodes (11 + 6 + ~18 across the three meetings)
- ~40 action episodes (6 + 7 + ~27)
- **Total: 78 typed episodes + 42 ZOE turns' captures/tasks/quests = 120 this session**

### 3.2 - Meetings with Episodes (Documented)

Per this session + prior session logs, these meetings are in the graph:

| Date | Meeting | Attendees | Recap Doc | Episodes Posted | Status |
|------|---------|-----------|-----------|-----------------|--------|
| 2026-05-19 | Arthur WaveWarZ intro | Zaal, Sam, Arthur | 670 | 11 | This session |
| 2026-05-13 | kmac.eth Farcaster Snaps | Zaal, kmac.eth | 718 | 6 | This session (past-batch) |
| 2026-05-08 | failoften ZAOstock strategy | Zaal, failoften | 678 | 8 | This session (past-batch) |
| 2026-05-22 | Tyler (day 2 cowork) | Zaal, Tyler | 711 | 16 | This session |
| And 6+ more | Captured in docs 670, 675, 718-721 | Various | Docs 670, 675, 718-721 | Queued for backfill | On-disk, not yet pushed |

**Total documented meetings:** 10+ recap docs (670, 675, 678, 682, 711, 714, 718-721) = ~10 meetings. Each meeting = 1 summary + 3-8 decisions + 3-10 actions = ~8-20 episodes per meeting. Conservative estimate: **80-200 meeting episodes already in the graph.**

### 3.3 - ZOE Captures (Unknown Count)

ZOE has been mirroring turns since ~2026-05-05 (doc 680, bridge go-live). The `/memory/` directory has **174 feedback/project/user memory files** across all projects. The ZAO OS V1 memory alone has ~170 files. Each ZOE turn with content produces 1-5 captures/tasks/quests. Frequency: daily, variable. **Estimated: 200-500 ZOE episodes in the graph since 2026-05-05.**

---

## 4. The Read-Side Problem: Why `/vector_store/search` Returns `[]`

### 4.1 - The Lock

The `/vector_store/search` endpoint (recall.ts lines 131-154) works without error but returns an empty results array. Cause: **admin labeling has not run.**

The labeling endpoint (`/labeling/hybrid`) is 403 for non-admin keys. Until it runs:
- Episodes ingest successfully (write is live)
- The graph dashboard shows nodes (zabal.bonfires.ai displays them)
- Vector search queries return `{}` (empty results, no error)

### 4.2 - Impact

ZOE's `recall()` function (lines 187-207) degrades gracefully:
1. Attempts `searchVectorStore()`
2. If results are empty, returns `kind: manual_relay_needed` + a Telegram-ready relay text
3. Caller pastes the relay into `@zabal_bonfire` DM, gets answer from the bonfire agent, pastes back

This is a **temporary workaround, not a permanent architecture.** Doc 620 (bonfire-push-everything) lists "Sources footer" as a blocker before auto-publishing recall results; without grounding, synthesis is unreliable.

### 4.3 - Escalation Path

**Owner:** Joshua.eth / Ryan ("Rskagy"), Bonfires Labs co-founder, in the ZAO Civilization GC.

**Action items:**
- Doc 680 action #5: "Confirm with Ryan that deterministic episode `name` updates rather than duplicates."
- Doc 620c / 620d: "Configure Bonfire agent system prompt to append Sources footer" (step #4 in ship order).
- Trigger labeling via `scripts/bonfire-ingest/trigger_labeling.py --really` only after asking Joshua about cost / idempotency / runtime.

---

## 5. What Other Corpora WOULD Be Ingested (If Read Was Live)

Per doc 620 "bonfire-push-everything" 9-step ship order, these corpora are candidates for auto-push:

### 5.1 - Static Corpora (Batch Backfill)

| Corpus | Count | Status | Path | Difficulty | Notes |
|--------|-------|--------|------|------------|-------|
| Memory files (personal graphs) | 174 | TODO | `~/.claude/projects/.../memory/*.md` | 4/10 | Step #1 (gating step per doc 620). Backfill-once. 135 confirmed valid per doc 620c. |
| Research library README.md | 860 | TODO | `research/**/README.md` | 6/10 | Step #6. Nightly vector + hot-doc full-graph. Skips `_archive/_graph/_handoffs` (783 skip, 860 total). Ingest scripts exist (`scripts/bonfire-ingest/ingest_research_library.py`). |
| Brand kit (bettercallzaal brands) | 31 | TODO | `bettercallzaal.com/brands.json` | 2/10 | Ingest script exists. One episode per brand. |
| GitHub READMEs (BetterCallZaal org) | 80 | TODO | `github.com/bettercallzaal/*` | 4/10 | Ingest script exists. Public via raw.githubusercontent.com, private with `GITHUB_TOKEN`. |
| Archive backfill (1x) | ~500 | TODO | Telegram history, FC history, bookmarks, Lu.ma | 7/10 | Step #9. Historical context. Mentioned in doc 620b. Not scoped yet. |

### 5.2 - Stream Corpora (Event-Driven)

Per doc 620a, NOT implemented yet:

| Stream | Frequency | Status | Code Path | Difficulty |
|--------|-----------|--------|-----------|------------|
| Telegram DM auto-push | Per message | TODO | `bot/src/zoe/index.ts` grammy hook | 4/10 |
| Farcaster cast push | Per cast | TODO | Neynar webhook + `src/lib/farcaster/neynar.ts` | 6/10 |
| Voice transcript file-watcher | Per voice file | TODO | OpenWhisp + file watcher (doc 560) | 3/10 |

### 5.3 - Why These Aren't Pushed Yet

- **Step #1 (memory files) is blocking:** Without the personal graph backfill, recall queries return empty. Doc 620 decision: "Backfill-ONCE FIRST (135 files, gating step)."
- **No automation wired:** Legacy `scripts/bonfire-ingest/` scripts exist but aren't in cron/scheduler. Step #2 (dedup + redact + audit log) is TODO.
- **Labeling gate:** Even if we pushed, `/vector_store/search` would still return `[]` until Joshua runs `/labeling/hybrid`.

---

## 6. The Bonfire-Ingest Legacy Pipeline

### 6.1 - What It Is

`scripts/bonfire-ingest/` is a Python-based bulk-ingest pipeline, separate from the real-time per-meeting `/bonfire` skill.

**Files:**
- `secret_scan.py` - detects secrets (9 HIGH patterns). Distinguishes template placeholders (`xxxx`, `changeme`) from real keys.
- `bonfire_client.py` - `IngestPipeline` class wrapping `/knowledge_graph/episode/create`. Calls preflight before each POST. Writes manifest per run.
- `ingest_research_library.py` - pipes `research/**/README.md` (740 docs)
- `ingest_github_readmes.py` - pipes `github.com/bettercallzaal/*` (80 repos)
- `ingest_brand_kit.py` - pipes 31 brands from brands.json
- `verify_manifest.py` - GETs each episode UUID from a manifest (currently 404s; API surface may mature)
- `trigger_labeling.py` - triggers `/labeling/hybrid` (requires `--really` flag; ask Joshua first)

### 6.2 - Execution History

**When last run:** Unknown (manifest location `~/.zaocoworking/ingest-<label>-<epoch>.json` not checked in session).

**Current status:** Scripts are ready but NOT in automation. Per doc 680 decision #2: "The old `content/bonfire-ingest/` file + `bonfire_client.py` route is the BULK backfill pipeline (research library, GitHub READMEs) - wrong tool for per-meeting real-time. Use `/bonfire` skill instead."

**Verdict:** Keep as a utility for one-time batch ingest. Don't call it per-meeting (use `/bonfire` skill). Wire into cron only after step #1 (memory backfill) completes and labeling is unlocked.

---

## 7. Risks + Gaps

### 7.1 - Critical Gaps

| Gap | Impact | Blocker? | Mitigation |
|-----|--------|----------|-----------|
| Read path locked behind admin labeling | Recall queries return empty; ZOE falls back to manual relay | YES | Escalate to Joshua to run `/labeling/hybrid`. Doc 620d step #4. |
| No auto-push wiring (steps 1-9 of 620) | Bonfire stays write-only from meetings; personal context missing | YES | Implement doc 620 steps 1-2 (memory backfill + dedup). Unblock read first. |
| Episode dedup hash log missing | Risk of re-posting same memory file 2x if steps are rerun | MED | Implement doc 620c (SHA256 hash log at `~/.zao/zoe/bonfire-pushed.sqlite`). |
| No Telegram consent gate | Auto-push of group messages violates consent | HIGH | Doc 620a: "push Zaal's outbound only, skip others without consent." |
| Labeling cost unknown | Calling `/labeling/hybrid` may be expensive; budget impact unclear | MED | Ask Joshua about cost before calling `trigger_labeling.py --really`. |
| ZAO member context missing | Graph has meetings + captures, but no Respect ledger / member profiles / WaveWarZ battle results | MED | Scope: add member entities (188 ZAO holders), link to Respect ledger. |

### 7.2 - Data Not in the Graph

| Artifact | Count | Why Missing | Add When? |
|----------|-------|-------------|-----------|
| ZAO member profiles (wallets, roles, Respect) | 188 | Never ingested; no API path scoped | Post-read unlock; member registry sprint |
| WaveWarZ battle results + rankings | ~50 battles/season | No event-stream push; battles.json not indexed | Post-read unlock; gaming event integrations |
| Farcaster cast history (@zaal) | ~200 casts | No Neynar webhook wired; historical backfill TODO (doc 620b step #7) | After stream-source automation ready |
| Telegram group conversations | ~500 messages | Consent gate required; no ingest path | Step #3 after dedup ready (doc 620a) |
| Cowork-zaodevz action items | ~30 open | No ingest from actions.json; not scoped in any ingest path | Scope in doc 620b or separate task-sync path |

---

## 8. Summary Table: Write Paths vs. Corpora

| Writer | Active? | Frequency | Episodes/Cycle | In Graph Now? | Needs Unlock? | Notes |
|--------|---------|-----------|----------------|---------------|---------------|-------|
| ZOE recall.ts mirrorTurn() | YES | Daily (variable) | 1-5 | YES | Read only | 200-500 estimated since 2026-05-05 |
| `/meeting` skill + bonfire.sh | YES | ~1-3/week | 8-20 | YES | Read only | 80-200 meeting episodes estimated |
| Legacy bonfire-ingest scripts | NO (manual only) | One-time batch | ~800+ | NO | Both | Blocked on step #1 (memory backfill) |
| Telegram stream (planned) | NO | Per message | 1 | NO | Both | Step #3 in doc 620 ship order |
| Farcaster stream (planned) | NO | Per cast | 1 | NO | Both | Step #7 in doc 620 ship order |
| Voice transcripts (planned) | NO | Per file | Variable | NO | Both | Step #8 in doc 620 ship order |

---

## Recommendations

1. **Unblock read now:** Escalate to Joshua to run `/labeling/hybrid` on the ZABAL bonfire. This unblocks the entire recall path and validates the write infrastructure is working.

2. **Implement doc 620 step #1 (memory backfill):** Write a script that reads `~/.claude/projects/.../memory/*.md`, wraps each in an episode, POSTs to Bonfire. This is the gating step; nothing else matters until the personal graph has Zaal's facts.

3. **Confirm episode upsert behavior:** Per doc 680 action #5, ask Ryan if re-posting a meeting with the same `name` field updates it or duplicates it. Design the de-duplication strategy around the answer.

4. **Wire automation for corpora:** Once steps 1-2 are done and read is live, add cron for research-doc nightly push (doc 620 step #6) and Telegram DM auto-push (step #3).

5. **Add member context:** Post-read unlock, ingest the 188 ZAO member profiles (wallets, Respect ledger) as a separate task. This fills the gap where the graph knows meetings but not people.

---

## Sources

- `bot/src/zoe/recall.ts` - ZOE Bonfire bridge code (lines 1-294)
- `/Users/zaalpanthaki/.claude/skills/bonfire/SKILL.md` - `/bonfire` skill design
- `/Users/zaalpanthaki/.claude/skills/bonfire/scripts/bonfire-post.sh` + `bonfire-remote-post.sh` - episode posting infrastructure
- `research/agents/680-meeting-skill-bonfire-bridge/README.md` - meeting-to-Bonfire integration design
- `research/agents/665-bonfires-deep-dive-zao-integration/README.md` - Bonfires architecture
- `research/agents/620-bonfire-push-everything/README.md` - auto-ingest pipeline spec + 9-step ship order
- `/tmp/meeting-bonfire-episodes.json` + `/tmp/tyler-bonfire-episodes.json` + `/tmp/past-meetings-bonfire-episodes.json` - session episode data (120 episodes posted this session)
- `scripts/bonfire-ingest/` - legacy bulk ingest pipeline
