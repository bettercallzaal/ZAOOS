---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-08-23
superseded-by:
related-docs: "709, 789, 2270, 2300, 2362, 2363, 737, 772, 676"
original-query: "How does ZAO currently ingest meetings (Craig, Fathom, voice memos, X Spaces) end to end, and how does the CRM work? Map the full current process: acquisition -> transcription -> diarization -> recap doc -> action-item routing -> CRM contact/company records -> Bonfire knowledge graph -> any indexes. Identify what's automated vs manual, what tools/scripts/skills are involved, where contact/company data actually lives, and any known gaps or broken links in the pipeline."
tier: STANDARD
---

# 2400 — How ZAO Ingests Meetings and Runs Its CRM (current state, Aug 2026)

> **Goal:** A current-state map of the live `/meeting` skill pipeline and the CRM
> it writes to — not a proposal, not a roadmap. Every claim below is read from
> the actual scripts, `SKILL.md`, and a live Supabase query, not from memory or
> an older doc's description of intent.

**Deviation from the standard template, stated up front:** this doc has no
external web/Reddit/HN sources (Hard Requirements 4 and 7 in the `/zao-research`
skill assume an external-tech-comparison doc). This is an internal process
audit — the sources are our own code, and citing an unrelated Reddit thread to
satisfy a checkbox would be worse than omitting it. "Sources" below are file
paths + line numbers + one live database query, each independently verifiable.

## Key Findings (read this first)

1. **The pipeline is one skill, six inputs, seven output targets.**
   `~/.claude/skills/meeting/SKILL.md` (641 lines) is the entire spec. Six
   acquisition modes feed into a shared transcribe → diarize → extract →
   route pipeline, which then fans out to up to seven distribution targets
   per meeting (tracker, doc, index, Bonfire, CRM, Telegram, calendar).
2. **The CRM is Supabase, not Airtable — and has been since 2026-07-22.**
   `contacts` table, project `etwvzrmlxeobinrlytza` (the SAME project as the
   cowork task tracker, not a separate one) — **1198 rows, verified live**
   via `mcp__supabase-cowork__list_tables` on 2026-08-23. `airtable-crm-write.py`
   still exists but is opt-in legacy, invoked by hand, not by default.
3. **`SKILL.md`'s own prose has drifted from its own script.** The Phase 4
   section still calls the table `crm_contacts`; the script's own comment
   (`supabase-crm-write.sh:84-86`) corrects this — the real table is
   `contacts`. The Scripts index (`SKILL.md:632`) still describes Airtable as
   "default-ON," contradicting the retirement note two sections earlier
   (`SKILL.md:505`). Both are stale prose around correct code — a doc bug,
   not a behavior bug. See Gaps, #1.
4. **Multitrack Craig input is preferred over the single mixed download**,
   specifically because the per-speaker filename removes the need to guess
   who said what — diarization is skipped entirely for that input type.
5. **Every distribution target degrades gracefully and independently.** No
   missing credential, unreachable API, or failed step aborts the run — each
   writer (CRM, Bonfire, tracker) checks its own env, skips with a printed
   message, and the rest of the pipeline continues. This is deliberate
   (`supabase-crm-write.sh:47`, `bonfire-episode.sh`), not an accident.
6. **A project memory (`project_crm_supabase_not_airtable.md`) was stale** —
   written 2026-05-31 saying the Airtable→Supabase repoint was "not yet
   done." It shipped 2026-07-22. Corrected as part of this research (rule:
   `confirm-before-claiming-absence.md` — verify, don't cite a memory as
   current fact).

## The pipeline, stage by stage

### 1. Acquisition — six input modes

| Mode | Trigger | Handling |
|---|---|---|
| `paste` | Transcript/notes pasted in chat, or Zaal narrating a meeting | Used directly, skips transcription |
| `local_audio` | A `.m4a/.mp3/.wav/.mp4/.mov/.opus` path | `transcribe.sh` — mlx-whisper local, VPS Whisper fallback |
| `craig_url` | `https://craig.horse/rec/<id>` | `fetch-craig.sh` downloads the single **mixed** `.flac` — forces diarization downstream |
| **Craig multitrack folder** | A downloaded folder, `1-<name>.wav, 2-<name>.aac, ...` | **Preferred mode** — filename IS the speaker, ground truth, no diarization needed |
| `fathom_url` | `https://fathom.video/share/...` | WebFetch the share page's embedded transcript JSON; ask Zaal to paste if the embed fails |
| `ingest_url` | Spotify/YouTube/Apple Podcasts/RSS/direct mp3/transcript page | Hands off to `~/bin/zao-ingest.sh` (12KB, confirmed present, last modified 2026-08-12) |

`fetch-craig.sh:27-28` — the mixed-flac download endpoint is
`https://craig.horse/rec/<id>.flac?key=<key>&container=flac`. This is the ONLY
mode `fetch-craig.sh` can reach; multitrack requires the separate manual
download Zaal does himself, which is why `SKILL.md:206-210` explicitly warns:
if speaker attribution matters, ask for the multitrack folder instead of
using this script.

### 2. Transcription

`transcribe.sh` is local-first: mlx-whisper (`whisper-large-v3-turbo`) on
Apple Silicon, falling back to Whisper on Iman's VPS only when local tooling
is absent. Anti-hallucination flags, all four present in the live script
(`transcribe.sh:51-60`), tuned tighter than a since-superseded proposal from
this session (see doc 2362/2363's founding brief, corrected 2026-08-21):

| Flag | Value | Purpose |
|---|---|---|
| `--condition-on-previous-text` | `False` | Breaks the feedback loop that turns one hallucinated line into hundreds |
| `--compression-ratio-threshold` | `1.35` | Retries early on repetitive output (default 2.4 is too permissive) |
| `--no-speech-threshold` | `0.3` | Classifies quiet segments as silence sooner (default 0.6 misses it) |
| `--hallucination-silence-threshold` | `2` | Skips silence gaps over 2s rather than inventing speech to fill them |

`trim-loops.sh` runs automatically after, collapsing any run of ≥3 identical
consecutive lines to one line + a `[repeated Nx, trimmed]` marker — belt and
suspenders on top of the generation-time flags.

### 3. Diarization — who spoke when

`diarize.sh` + `diarize.py` run sherpa-onnx locally (pyannote segmentation +
3D-Speaker embedding), no HF token, no GPU. It only runs when there's real
ambiguity to resolve:

| Input shape | Diarize? |
|---|---|
| Craig multitrack (filename = speaker) | **No** — nothing to guess |
| Single mixed file, 3+ speakers | Yes |
| Single mixed file, unambiguous 2-person interview | No (skip to save time) |
| Single mixed file, 1 speaker | No |
| VPS transcription path (no `.json` sidecar) | Can't — no timestamps to diarize on |

### 4. Multitrack merge — `interleave-tracks.py`

For Craig multitrack input, each track transcribes independently, then
`interleave-tracks.py` (52 lines as of this session's fix, was 30) merges by
segment start time, collapses consecutive same-speaker repeats, and flags
them `[ARTIFACT: repeated xN, likely Whisper loop on silence]`. **As of
2026-08-23** (this session, zaal-dotfiles PR #77) it also prints a
per-speaker repetition rate to stderr — `[Name] N/M raw segments were
loop-repeats (P%)`, warning above 20%. Before this, that number required
manual counting; docs 2362 and 2363 (this session) did it by hand and found
Isaac Huston's track at 23%.

### 5. Extraction — five parallel passes, not one prompt

Per `SKILL.md` Phase 2: metadata, decisions, actions, quotes, and
research/memory seeds are extracted as five separate passes rather than one
combined prompt, then presented back to Zaal in Phase 3 as markdown tables
for confirmation before anything writes.

### 6. Recap doc + index

The confirmed extraction becomes `research/events/NNN-<slug>/README.md`
(doc-number reservation follows the same defensive-scan-and-collision-check
discipline as any `/zao-research` doc — see this doc's own Step 3/7.5
process). Every meeting also gets one row prepended to
`research/events/_meetings-index.md` — hand-maintained by the skill's own
write, not a separate script or cron.

### 7. Action-item routing

`append-actions.sh` (178 lines) resolves each action's owner against the
tracker's `team_members` table (case-insensitive), normalizes an
unresolvable `"Both"` owner to `Open` (a real bug it guards against — `Both`
resolves to nobody and the task goes invisible), and bulk-POSTs to
`/rest/v1/tasks` with `legacy_source=meeting:<slug>-<date>` so the row is
traceable back to the meeting that created it. If Supabase creds are absent
it prints a paste-block instead of failing.

| Project | Where actions land |
|---|---|
| ZAO Devz / general (default) | Unified Supabase `tasks` table, project `etwvzrmlxeobinrlytza` |
| ZAOstock | Paste-block for `@ZAOstockTeamBot` (v1 only; a direct-write v2 is deferred, pending ZAOstock's own task schema) |
| ZAO OS dev / BCZ / WaveWarZ / other | Recap-doc action table only, no external tracker |

### 8. CRM write

`supabase-crm-write.sh` (164 lines) is the default-ON path: for each
attendee, upsert into `contacts` by exact name match (no slug column — an
earlier version used one, the script's own comment at line 84-86 documents
the correction). Credentials from `~/.zao/cowork-tracker.env` or
`~/.zao/zao.env`; unset means "skip, exit 0," never a hard failure.

`airtable-crm-write.py` (230 lines) still exists, still works, and is still
useful if you specifically want an Airtable-side activity row (one row per
meeting, linked to all attendees) — but it's opt-in now, invoked by hand,
not part of the default `/meeting` flow as of the 2026-07-22 repoint.

**Live verification, 2026-08-23** (`mcp__supabase-cowork__list_tables`,
project `etwvzrmlxeobinrlytza`):

| Table | Rows | Note |
|---|---|---|
| `contacts` | **1198** | The real, queryable CRM — what `zao-crm` and the `/crm` page read |
| `contact_log` | 0 | Exists, unused |
| `meetings` | 0 | Exists, unused — see Gaps #4 |
| `meeting_notes` | 102 | The table actually holding meeting content, despite the empty `meetings` table sitting right next to it |
| `tasks` | 1838 | The unified action tracker `append-actions.sh` writes to |

ZAOOS side: `src/lib/crm/`, `src/app/api/crm/{capture,interactions}`,
`src/app/api/admin/contacts/route.ts` all confirmed present on disk.

### 9. Bonfire knowledge graph — always-on

**`SKILL.md` cites "doc 680" four times (lines 15, 403, 459, 485, 631) as the
source of the always-on rationale — no doc 680 exists anywhere in
`research/`.** Checked at both `maxdepth 2` and full-tree depth across every
topic folder; nearest neighbors are 681-689, none of them Bonfire-related.
Either 680 was renumbered away at some point and `SKILL.md` was never
updated, or it never shipped. Treat the always-on Bonfire behavior below as
grounded in the live script, not in that citation — see Gaps #7.

`bonfire-episode.sh` (112 lines) posts one summary episode plus one episode
per decision and per action (quotes are skipped — low standalone KG value)
to the ZABAL Bonfire graph, so the graph always carries full meeting
context. Every episode body is secret-scanned before posting (9 patterns:
`sk-ant-*`, `ghp_*`, PEM blocks, 64-char hex, Telegram bot tokens, Slack
tokens, AWS keys) — a match skips that episode rather than posting it.
Episode names are deterministic, so a re-run of the same meeting updates
rather than duplicates. Credentials from `~/.zao/bonfire.env` or
`~/.zao/zao.env`; same graceful-skip pattern as everything else.

### 10. Optional targets (opt-in per Phase 3, not default)

Telegram copy-paste block, Airtable CRM mirror, calendar-event description
append, memory writes (each proposed individually, Zaal confirms per entry)
— all confirmed opt-in in `SKILL.md`'s Phase 3 checklist, none fire without
an explicit yes.

## Automated vs manual

| Stage | Automated | Gated on a human |
|---|---|---|
| Acquisition | — | Always — someone hands the skill an input |
| Transcription (local or VPS) | Full | — |
| Loop-trim | Full (auto-called by `transcribe.sh`) | — |
| Diarization | Full, but conditionally skipped by input shape | — |
| Multitrack interleave + repetition-rate report | Full | — |
| Extraction (5 passes) | Runs automatically | **Confirmation required** (Phase 3) before anything writes |
| Project routing | Inferred | Confirmed by Zaal in Phase 3 |
| Action-tracker write | Full, after confirm | — |
| CRM write (Supabase) | Full, default-ON, after confirm | Opt-out available |
| Bonfire post | Full, default-ON, after confirm | Opt-out available |
| Recap doc + index row | — | The skill writes it; Zaal reviews on the branch before merge |
| Airtable CRM mirror | — | Opt-in, off by default |
| Telegram / calendar / memory | — | Opt-in per item, off by default |

The one thing worth being precise about: **nothing in this pipeline runs
unattended.** There is no cron, no hook, no watcher on a downloads folder.
Every run starts because a session invoked `/meeting` with an input. "Full"
in the table above means "runs without a second human touch once triggered,"
not "runs on a schedule."

## Gaps found

1. **`SKILL.md` prose drift** — `crm_contacts` (stale table name, Phase 4
   section) and "default-ON when env present" for Airtable (stale, Scripts
   index) both contradict the corrected code and the retirement note already
   present two sections earlier in the same file. Small fix, not filed as a
   PR here — this doc is research, not a build task; flagging for whoever
   picks it up next.
2. **`meetings` table is empty (0 rows) while `meeting_notes` holds the real
   102 rows of content.** Either `meetings` is dead weight worth dropping, or
   it was meant for something that never got wired up. Not investigated
   further here — a one-question follow-up, not a research gap.
3. **ZAOstock action routing is v1-only** — a paste-block for manual entry,
   not a direct Supabase write. A v2 is described in the skill as deferred,
   pending confirmation of ZAOstock's own task schema.
4. **Same-day index-row collisions are a known, unfixed risk.** Two sessions
   processing meetings the same day both prepend a row to
   `_meetings-index.md`; nothing serializes that write. A per-month split is
   mentioned as a future direction, not implemented.
5. **The project memory `project_crm_supabase_not_airtable.md` was three
   months stale** before this doc — corrected in this session as a
   byproduct of grounding this research (see that memory file's current
   text for the fix).
6. **Repetition-rate reporting on multitrack merges was manual until
   2026-08-23** — now automated (zaal-dotfiles PR #77, this session), but
   worth naming as a gap that existed until three days before this doc.
7. **`SKILL.md` cites a nonexistent doc 680, four times, for the Bonfire
   always-on rationale.** Verified absent from `research/` at full-tree
   depth (see section 9 above). This is the same class of drift as gap #1 —
   the code and behavior are fine, the doc's citation is dead. Whoever fixes
   gap #1 should fix this in the same pass: either find where 680 actually
   went (a renumber) or drop the citation.

## Sources

All FULL — read in full, not excerpted, or directly queried live:

- `~/.claude/skills/meeting/SKILL.md` (641 lines) — the whole spec
- `~/.claude/skills/meeting/scripts/{transcribe,trim-loops,diarize,fetch-craig,append-actions,supabase-crm-write,bonfire-episode}.sh`
- `~/.claude/skills/meeting/scripts/{diarize,interleave-tracks}.py`
- `~/.claude/skills/meeting/scripts/airtable-crm-write.py`
- `~/.claude/skills/meeting/references/{output-schema,distribution-targets,meeting-recap-template}.md`
- `research/events/_meetings-index.md` (this repo)
- `src/lib/crm/`, `src/app/api/crm/`, `src/app/api/admin/contacts/route.ts` (this repo, existence-verified)
- `mcp__supabase-cowork__list_tables` — live query, project `etwvzrmlxeobinrlytza`, 2026-08-23
- `mcp__supabase-cowork__get_project_url` — confirmed project URL
- Memory `project_crm_supabase_not_airtable.md` (found stale, corrected as part of this doc)
- Doc 709 (transcription pipeline audit, 2026-05-22), 789 (anti-loop flag roadmap, 2026-05-31), 2270 (AssemblyAI vs local evaluation, 2026-08-12), 2300 (input-pipeline organization, 2026-08-17), 2362/2363 (this session's live use of the pipeline, 2026-08-21)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Fix `SKILL.md`'s stale `crm_contacts` table name + stale Airtable "default-ON" line in the Scripts index | Zaal or next lane | PR to zaal-dotfiles | wontfix (low-stakes doc-only drift, fix opportunistically) |
| Decide whether the empty `meetings` table should be dropped or wired up | Zaal | Decision | wontfix (no urgency, one-question follow-up) |
| Confirm ZAOstock's own task schema so v2 direct-write action routing can be built | Zaal | Decision | wontfix (blocks a build, not scheduled) |
