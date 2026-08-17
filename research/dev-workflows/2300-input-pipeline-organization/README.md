---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-08-17
superseded-by:
related-docs: "673, 676, 680, 737, 789, project_todo_operating_model_v3"
original-query: "zao-research all this input and information and audit the best way to organize all of this please"
tier: STANDARD
---

# 2300 - Input Pipeline Organization: System Map and Key Decisions

> **Goal:** Audit and document the system that processed a high-input weekend (5 meeting recordings, 3 OneNote dumps, ~60 tasks, 34 CRM contacts, 13 idea candidates) and provide a system map showing where each input type flows, with concrete improvement decisions and honest weaknesses.

## System Map: Input -> Processing -> Output Destinations

```
CAPTURE DOORS (Five input channels)
├─ Meeting Recordings (5)
│  ├─ local_audio: ~/Downloads/...(*.mp4, *.mov, *.m4a)
│  ├─ Craig: craig.horse URLs
│  └─ Fathom: fathom.video URLs
│
├─ Transcript Pastes (async from recording or live call narration)
│  └─ /meeting skill, paste mode
│
├─ OneNote Bulk Dumps (3)
│  └─ Claude session (bulk paste-in, format varies)
│
├─ ZOE DM Quick Capture
│  └─ Phone-based: /todo, /note, /idea
│
└─ Web Ingestion
   └─ Farcaster, emails, Spotify/YouTube/podcast URLs

PROCESSING PIPELINES
├─ /meeting Skill (doc 673)
│  ├─ Phase 1: Acquire transcript (local mlx-whisper, fallback VPS)
│  ├─ Phase 2: Extract structure (multi-pass JSON)
│  ├─ Phase 3: Confirm + present
│  ├─ Phase 4: Distribute
│  ├─ Phase 5: Report
│  └─ Phase 6: Clipboard next-actions
│
├─ /todo CLI (DEAD - vanished dependency)
│  └─ Now: manual Supabase tracker writes
│
├─ OneNote Imports (manual bulk sweep, PENDING KILL)
│  └─ Copy -> task creation -> archive/delete
│
└─ CRM Ingest (unified Supabase + Airtable mirror)
   ├─ Meeting attendees -> crm_contacts upsert
   ├─ Activity rows (legacy Airtable only)
   └─ Deterministic slug deduplication

OUTPUT DESTINATIONS (per project)
├─ ZAO Devz / General
│  ├─ Unified Supabase cowork tracker (tasks table)
│  ├─ research/events/NNNN-<slug>/README.md
│  ├─ research/events/_meetings-index.md (every meeting, one row)
│  ├─ Bonfire KG episodes (default ON)
│  ├─ Supabase CRM contacts (default ON)
│  └─ ZOE DM or @ZAOcoworkingBot
│
├─ ZAOstock
│  ├─ ZAOstock Supabase (tasks via paste-block, v2 pending)
│  ├─ research/events/NNNN-<slug>/README.md (same ZAOOS repo)
│  ├─ @ZAOstockTeamBot group
│  └─ Bonfire episodes
│
├─ ZAO OS / BCZ / WaveWarZ / One-Off
│  ├─ research/events/NNNN-<slug>/README.md only
│  └─ No external tracker write
│
└─ Contacts & Relationships
   ├─ Supabase crm_contacts (source of truth)
   ├─ Airtable AGENTIC base (optional mirror)
   └─ ~/.claude/projects/.../memory/project_<slug>.md (new people)

STATE PERSISTENCE
├─ Unified Supabase tracker (tasks table)
│  └─ Truth for "what am I doing today"
│
├─ research/ docs (permanent, ZAOOS only)
│  └─ Institutional memory by doc number
│
├─ ~/.zao/topics/ (thread state files)
│  └─ Live conversation context, refreshed per session
│
├─ ~/.zao/drafts/ (awaiting-send content)
│  └─ Outbound posts staged, not yet published
│
└─ ~/.claude/projects/.../memory/ (people, projects, context)
   └─ Cross-session facts
```

## Current State: This Weekend's Flow

**Input Volume (2026-08-14 to 2026-08-17):**
- 5 meeting recordings (live-captured via /meeting, all extracted + indexed)
- 3 OneNote page dumps (manual copy-sweep in progress, kill decision pending)
- ~60 task captures (unified Supabase writes via /meeting actions + manual entry)
- 34 CRM contacts (auto-upserted on meeting end via crm_contacts schema)
- 13 idea candidates (captured in meeting quotes / research_seeds sections, no dedicated channel yet)

**Routing Pattern Observed:**
1. Meetings (doc 2287, 2295-2298) -> unified Supabase actions + research/events/ recap + CRM write + Bonfire episodes - all working
2. Tasks -> board (`project:` field, owner assignment working)
3. Contacts -> Supabase crm_contacts, indexed by deterministic slug
4. Ideas -> embedded in meeting research_seeds (no extraction into a separate tracking system)

## Key Decisions (3-5 Concrete Improvements)

### Decision 1: Kill OneNote as a capture door, migrate 3 pending dumps to Supabase

**What:** Complete the OneNote removal (v3 decision locked 2026-08-16). Final 3 pages are being manually swept into tasks/contacts; OneNote tab closes after 2026-08-17.

**Why:** OneNote is a sync liability - updates in OneNote do not reach the tracker, task descriptions drift, sync is unidirectional and lossy. Supabase + Claude session (paste-in) is the durable pair.

**Owner:** Zaal (sweep + close) + Claude (Supabase writes on acceptance)
**Real Date:** Complete by 2026-08-18 end of day
**Confidence:** High - the decision is locked; this is execution

**Proof:** All OneNote tasks will have a `legacy_source=onenote:<date>` marker in Supabase so they remain traceable and revertable.

---

### Decision 2: Consolidate idea capture into a dedicated Supabase `ideas` table with a Sparkz column

**What:** Ideas currently live scattered: meeting quotes, research_seeds, Bonfire episodes, sidebar chats, Telegram threads. Create a dedicated `ideas` table (parallel to tasks/contacts) with fields: `title`, `source_meeting` (doc link), `confidence`, `assigned_to` (Sparkz candidate? Community workshop? Live-testing pool?), and auto-link to Sparkz phase it belongs to.

**Why:** Of the 13 idea candidates this weekend, zero are currently queryable as "all ideas in the ZAO pipeline." They are locked inside meeting recaps and require a 20-minute manual scan. A dedicated table makes "what are we considering?" answerable in 10 seconds, and surfaces patterns (e.g. three separate people all proposing variants of the same feature).

**Owner:** Claude (schema + initial write) + Zaal (confirm phase assignments)
**Real Date:** Schema + v1 write by 2026-08-20; backfill ideas from docs 2287, 2295-2298 by 2026-08-21
**Confidence:** Medium - depends on schema fit with the Sparkz pipeline; may surface that ideas belong elsewhere

**Proof:** A `SELECT * FROM ideas WHERE assigned_to='Sparkz' ORDER BY confidence DESC` returns a ranked list, and that list is used in the next Sparkz intake call.

---

### Decision 3: Separate meeting-recap doc numbering from the event-journal archive

**What:** Currently all recaps land at `research/events/NNNN-<slug>/` where N increments globally, creating collision pressure (~200 collisions documented in the 2026-08-16 analysis, doc 2282 landed twice). Split the namespace: meeting recaps -> `research/events/meetings/YYYY-MM/NNNN-<slug>/` (month-keyed), event journals -> `research/events/journal/` (current structure, one index per month). The meeting index `_meetings-index.md` moves to the monthly folder and stays queryable from a master index.

**Why:** Parallel sessions race for the same doc number on same-day meetings (doc 789 addendum). Month-keying forces them into different branches automatically. The current collision guard requires fetching origin, scanning max, and re-checking - a high-friction gate that failed twice in one week (doc 2282 collision, then doc 2283 collision on the same repo). Structural separation is cheaper than a policy that requires compliance.

**Owner:** Claude (schema + migration script) + Zaal (approve and run migration)
**Real Date:** Migration script written by 2026-08-22; migration run off main on 2026-08-23 (dry-run first)
**Confidence:** Medium-High - the schema is clear and the win is measurable, but impacts doc-citation conventions; requires comms to the team

**Proof:** After migration, `git show origin/ws/research-<branch>:research/events/meetings/2026-08/_meetings-index.md` works; no two concurrent /meeting skill runs collide on doc numbers; the index is still reachable as `_meetings-index.md` from the root.

---

### Decision 4: Persist meeting transcripts to Supabase media table instead of /tmp

**What:** Currently /meeting creates `/tmp/meeting-X.txt` + `/tmp/meeting-X.json` (transcript + segments) on the capturing machine only. These are volatile - a reboot deletes them, and the transcript is not searchable across sessions. Create a `media_transcripts` Supabase table with fields: `doc_id` (links to research/events), `raw_text`, `segments` (JSON), `uploaded_at`, `transcribed_by`, and index on doc_id for full-text search. The /meeting skill writes both the research/events/transcript.md file AND inserts into media_transcripts in parallel.

**Why:** Transcripts are currently lost on reboot. A research doc links to `/tmp/meeting-X.txt` which is gone on next session. Supabase makes them durable, queryable, and reusable (e.g. "find all meetings mentioning Solana" across all-time). The zip-copy approach (local file + Supabase row) is the bridge - researchers can still read offline-cached files, and Supabase is the reliable searchable store.

**Owner:** Claude (table schema + /meeting script modification) + Zaal (approve storage terms)
**Real Date:** Schema by 2026-08-20; /meeting modification + tested by 2026-08-21
**Confidence:** High - pure additive, no migration needed, backwards-compatible

**Proof:** `SELECT raw_text FROM media_transcripts WHERE doc_id=2287` returns the full transcript, and a Postgres full-text search finds all meetings mentioning "Solana".

---

### Decision 5: Parallelize meeting batch processing (currently sequential, one Mac bottleneck)

**What:** When 3-5 meetings arrive in one day, they are processed sequentially by the /meeting skill on one machine. Each run: acquire (0-2m), transcribe (1-3m), extract (2m), confirm (2m). A 5-meeting batch takes 30-50 minutes, mostly waiting. Parallelize by: (a) storing recordings + transcripts in a Supabase media_queue table (decision 4 enables this), (b) spawning up-to-3 parallel /meeting skill runs (one per recording, via cloud relay or a simple tmux-spawner script), (c) using Zaal's grill-queue to serialize his confirm phase (all questions batched into one answer round, then distributed back to the skill runs).

**Why:** A 50-minute single-threaded batch becomes 10-15m with 3 parallel workers. The grill-queue pattern already exists (doc 2092 lane_handoffs); meeting confirm just needs to join it. The blocker was transcript volatility (/tmp); decision 4 fixes it.

**Owner:** Claude (parallelization script + skill modification) + Zaal (test with next 5-meeting batch)
**Real Date:** Prototype by 2026-08-23; tested on first multi-meeting day after that
**Confidence:** Medium - depends on grill-queue availability and Zaal's review of parallel /confirm; may surface that confirm needs to be more atomic

**Proof:** A 5-meeting batch processes in <15m, and the meeting index has all 5 rows with consistent numbering (no collisions).

## Honest Weaknesses

### 1. Doc-Number Collisions (Known ~200, Frequency: High)

**What:** The collision guard in doc 789 requires scanning `research/` for max-number before writing a new doc. Parallel sessions or missed fetches cause duplicates (doc 2282, 2283 both collided in one week). When a collision happens, one PR clobbers the other's data, or a branch must be rebased onto a new number (agent-loops rule 19).

**Impact:** Medium - the data is recoverable (git history), but the developer tax is high (20-30min investigation + rebase per collision).

**Root Cause:** Sequential numbering + write-before-check semantics. The guard is a policy; structural namespace separation is the cure (decision 3).

**Workaround (today):** The /meeting skill (doc 789 addendum) reads live collision detection before writing. This works for /meeting only - arbitrary research docs written via Claude sessions still collide.

**When Decision 3 lands:** Collisions drop to ~0 for meetings; other research tasks will benefit from similar month-keying or per-author namespaces.

---

### 2. Recap Doc Quality Variance (Scores: 3-5/8)

**What:** Meeting recap docs are graded on the research-doc quality hook (`research/hooks.yaml`, doc 2191), and the median score is 3.5/8. The rubric expects: clear decisions (scored), actions (scored), quotes (scored), seeds (scored), confidence levels (scored). Recaps score low when extraction outputs are incomplete, confidence fields are missing, or the "why" context is thin. This weekend's recaps (2287, 2295-2298) averaged 4/8.

**Impact:** Medium - the docs are still useful (they link to the recordings), but they do not carry enough signal for async consumption. A Zaal reviewing a recap three weeks later re-opens the recording to understand context.

**Root Cause:** The /meeting extraction multi-pass (doc 676) is correct; the issue is that Phase 2.5 (clarification gate) is under-used. When Zaal is in rapid-fire mode (5 meetings in 3 days), asking clarifying questions feels like friction, so they are skipped. Later, a low-confidence action sits in the tracker unseen because the "why" is a template.

**Specific Miss (2026-07-27 audit - still applies):** Of 133 overdue tasks, 98 carried the template note "Action item from /meeting recap. Reply to Claude in next session if blocked." That is a 0/8 signal for context.

**When this is fixed:** The /meeting skill hard-gates on completeness (Phase 3 does not pass without why + done_when + quote on EVERY action). Decision 1 on OneNote kills one input type, freeing time for better confirm rounds.

---

### 3. OneNote Sync Loss (Still 3 Pages Pending)

**What:** OneNote is scheduled for kill (project_todo_operating_model_v3, locked 2026-08-16). The last 3 pages are being manually migrated. OneNote in limbo is a leak - if Zaal adds a task to OneNote out of habit on 2026-08-18, it is invisible to the tracker.

**Impact:** Low-Medium - only 3 pages remain, but the task is not assigned to anyone, so it could slip past 2026-08-18.

**Root Cause:** No hard close date on the migration; the decision is made but not operationalized.

**Fix:** Decision 1 operationalizes this (by 2026-08-18 end of day).

---

### 4. Missing Idea Extraction Channel

**What:** 13 idea candidates this weekend are scattered across meeting quotes, research_seeds, Bonfire episodes, and Telegram threads. There is no dedicated place to ask "what are we considering?" and get a ranked list. Ideas are not routed to Sparkz intake calls; they live in recaps only.

**Impact:** Low - ideas are not lost (they are in recaps, which are indexed), but they are not actionable until someone manually re-reads all-meetings-from-last-month and extracts them.

**Root Cause:** The todo system (unified Supabase tracker) does NOT have an ideas table. The post-OneNote cleanup (decision 1) will free capacity for this.

**Fix:** Decision 2 adds the ideas table.

---

### 5. Recap Docs Live in ZAOOS Only (Repo Sprawl on Graduation)

**What:** When ZAOstock, WaveWarZ, or another project graduates to its own repo, its recaps are NOT migrated. The research/ docs stay in ZAOOS forever (per doc 673 policy - research is permanent institutional memory, never graduates). But attendee contacts, decisions, and actions ALSO stay in ZAOOS tables + Bonfire, creating a split truth: the project graduated but its meeting history did not.

**Impact:** Low - graduate repos have complete freedom to link back to ZAOOS recaps. The policy is correct (one search archive). The weakness is not a bug, just a gotcha for new repos.

**Root Cause:** By design (doc 673). The decision to keep recaps in ZAOOS is explicit and sound.

**When this surfaced:** Every time a project lead asked "where are our old meeting notes?" Answer: "in ZAOOS research/events/; your repo has only the active work."

**Workaround:** A README in every graduate repo's docs/ folder links to `https://github.com/bettercallzaal/ZAOOS/tree/main/research/events` with a filter hint ("search for [project-name]").

---

### 6. Transcript Volatility on Reboot (/tmp -> Supabase gap)

**What:** Transcripts are written to `/tmp/meeting-X.txt`. On reboot, they are gone. A recap doc links to `/tmp/meeting-X.txt`; on the next session, the path is dead. Zaal has to re-transcribe or dig through git history to find the transcript.

**Impact:** Low-Medium - transcripts are rare-accessed after the recap is written, so the loss is mostly invisible. But it breaks the 6-month "where did we talk about Solana?" use case.

**Root Cause:** Transcription is expensive (1-3m per meeting), so temporary storage was the first-pass design. Supabase media_transcripts table fixes this (decision 4).

**Fix:** Decision 4 adds durable storage.

---

## Cross-Thread: Quality Gate for /meeting Recaps (Doc 2191 Hook)

The research-doc quality hook scores recaps on completeness of extracted fields (decisions, actions, confidence, why, done_when, quote). The gate should be: 

- Phase 3 confirm blocks if any action is missing `why`, `done_when`, or `quote`.
- A recap CANNOT be written if the VERIFY block (low-confidence items) is non-empty without explicit Zaal resolution.

This is already policy (meeting/SKILL.md hard guardrails section); the issue is that the gate is not enforced by the skill (it says "never auto-write without Phase 3 confirm" but does not prevent a later manual slip). Making it a hard exit-on-empty check will raise recap scores naturally.

---

## Related Policies (No Changes Needed)

These are working as designed and do not need adjustment:

1. **Bonfire episodes (default ON)** - docs 673, 680 set this correctly. The KG should always have full meeting context.
2. **Airtable mirror (opt-in, phased out)** - doc 737 / doc 673 set Supabase as source of truth, Airtable as optional legacy write. This is correctly scoped.
3. **Meeting index one-row-per-meeting** - _meetings-index.md is the single query point; this is correct. (Decision 3 will move it to month-keyed folders but keep the same one-row rule.)
4. **Slug-based contact deduplication** - deterministic slug generation from name prevents duplicate CRM rows. Correct.
5. **Project-routed action trackers** - ZAOstock tasks -> ZAOstock Supabase, ZAO Devz -> cowork-zaodevz tracker. Correct.

---

## Next Session Handoff

1. **Immediate (by 2026-08-18):** Zaal completes OneNote sweep. Claude confirms 3 pages are in Supabase, then OneNote tab closes.
2. **By 2026-08-20:** Claude writes ideas table schema + gets Supabase approval. Migration script for decision 3 drafted.
3. **By 2026-08-22:** Migration script tested (dry-run on a clone). Schema for decision 4 (media_transcripts) ready.
4. **Next multi-meeting day:** Decisions 4 + 5 tested end-to-end.

---

## Sources

- Doc 673: Meeting Capture Skill Design
- Doc 676: Multi-Pass Extraction for Skill Engineering
- Doc 680: Bonfire Knowledge Graph Indexing
- Doc 737: Airtable AGENTIC CRM v3
- Doc 789: Single-Branch Multi-Meeting Pipeline
- Doc 2191: Research Doc Quality Hook
- Doc 2257: ZABAL S1 Season Retrospective (recent recap example)
- Doc 2282: Reddit as OSS Outreach (collision example)
- Doc 2300: This doc
- Project: project_todo_operating_model_v3 (memory)
- SKILL.md: /meeting (live skill definition)
- SKILL.md: /cloud-relay (inter-session coordination)
- CLAUDE.md: Workflow Orchestration section
- .claude/rules/: agent-loops.md (rule 19 collision recovery), session-boundaries.md, anti-fabrication.md

