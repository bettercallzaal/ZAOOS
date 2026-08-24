---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-08-23
superseded-by:
related-docs: "2400, 2300, 789, 754"
original-query: "Keep mapping more of this - extending doc 2400 (meeting ingestion + CRM) to the rest of ZAO's capture-and-routing ecosystem: the Telegram/ZOE capture door, Obsidian/OneNote vault capture, the cowork tracker/board system itself, and Bonfire's full role beyond meetings."
tier: STANDARD
---

# 2401 — ZAO's Capture Ecosystem: ZOE, the Vault, the Tracker, and Bonfire (current state, Aug 2026)

> **Goal:** Extend doc 2400's meeting-specific map to the rest of how anything
> gets into ZAO's system — a Telegram message, a scattered note, a task, a
> piece of knowledge — and where it lands. Same deviation as doc 2400: no
> external sources, this is our own code.

## Key Findings

1. **"One capture door" is really three parallel doors that all converge on
   one tracker.** Telegram DM to ZOE, an AgentMail-forwarded email, and a
   group mention each land differently at the front (`inbox-ingest.ts`,
   `concierge.ts`) but the destination for anything actionable is the same
   unified Supabase `tasks` table doc 2400 already found.
2. **The cowork tracker has exactly 5 writer prefixes, and I traced all of
   them to real code**: `pr-auto`, `research-doc`, `inbox`, `meeting`,
   `handoff` — each a subcommand of `~/bin/zao-tracker` (verified, 461
   lines). No sixth writer exists outside this CLI.
3. **Two genuinely load-bearing bugs are already fixed in the tracker script,
   with the incident still in the comments** — an `owner=Zaal` parsing bug
   that passed the literal string `"owner=Zaal"` as an owner name, and a
   context-capture gap where 98 of 133 overdue tasks (audited 2026-07-27)
   carried an identical boilerplate note. Both are visible as dated code
   comments (`zao-tracker:82-87`, `:159`, `:185`), not something I'm
   inferring — this script documents its own incident history inline.
4. **Bonfire's read path is still gated off.** `/labeling/hybrid` returns 403
   for the non-admin key, so semantic search returns empty until an admin
   runs labeling. This has been true since at least doc 754 (2026-05-24) and
   is still true today, per `~/.claude/skills/bonfire/SKILL.md:94`. ZOE's
   recall degrades gracefully (falls back to a manual relay to Zaal) rather
   than silently returning nothing.
5. **OneNote's kill-by-date has passed.** Doc 2300 set "complete by 2026-08-18
   end of day" for retiring OneNote as a capture surface. It's now 2026-08-23
   — 5 days past, with the doc's own language ("the last 3 pages are being
   manually migrated") suggesting it wasn't finished on schedule. Worth a
   direct check with Zaal rather than assuming either way.
6. **The vault has no root-level index or documented structure**, unlike
   `research/events/_meetings-index.md`. `~/zao-vault/onenote/INDEX.md`
   exists for the OneNote migration specifically, but nothing indexes
   `~/zao-vault/notes/` as a whole.

## 1. The Telegram/ZOE capture door

Three ingest streams, all in `bot/src/zoe/`:

| Stream | Handler | What happens |
|---|---|---|
| Telegram DM to `@zaoclaw_bot` | `concierge.ts` | Builds 4 memory blocks (persona, human, working_memory, tasks/quests) per turn, routes through cost-ledger tracking |
| AgentMail forward (`zoe-zao@agentmail.to`) | `inbox-ingest.ts` (185 lines) | Fetches from AgentMail API, dedupes by message id, redacts PII, appends to `inbox_context.jsonl`, then triggers triage |
| Group mention in a configured group | `concierge.ts` dispatch | Routed by per-group config (silent/mention/all) |

`inbox-ingest.ts:33` caps ingestion at `MAX_PER_TICK = 15` messages per run —
confirmed by direct read, an explicit cost control, not a bug.

**Triage** (`inbox-triage.ts`, confirmed 5 buckets at line 25:
`'BUILD' | 'RESEARCH' | 'REFERENCE' | 'ACT-NOW' | 'SOMEDAY'`) classifies each
inbound item with a heuristic regex classifier — the file's own comment
admits this is a stand-in ("in production, ZOE would run this through
Claude"), not an LLM pass. It connects each item to a ZAO project by keyword
match against a hardcoded list that still includes Magnetiq, flagged
RETIRED elsewhere in this repo's rules — worth a pass to drop that entry.

**Memory persistence**: `~/.zao/zoe/persona.md` (hand-editable identity),
`~/.zao/zoe/human.md` (Zaal facts, meant to auto-refresh via Bonfire recall),
`~/.zao/zoe/recent/*.json` (per-chat working memory, FIFO), `tasks.json`
(open queue snapshot). `README.md:129` confirms a hard 50-LLM-call/day cap,
enforced in the concierge turn path.

### Automated vs manual

| Step | Automated |
|---|---|
| AgentMail fetch + dedup | Full, capped at 15/tick |
| PII redaction | Full, every synthesized summary, before persistence |
| Triage classification | Full (heuristic, not LLM — a known limitation) |
| Bonfire episode write | Full when key configured, best-effort |
| Acting on ambiguity | ZOE states an assumption and proceeds by default; only stops for irreversible/costly/external actions (`concierge.ts` `<clarify_policy>`) |

## 2. Obsidian/OneNote vault capture

`~/zao-vault` is the Obsidian vault (has `.obsidian/`, confirmed in the prior
session). Doc 2300 (2026-08-17, already the map this section builds on)
covers the weekend audit that produced the current plan:

| Item | Doc 2300's plan | Status as of this doc |
|---|---|---|
| Kill OneNote as a capture surface | Complete by 2026-08-18 EOD | **5 days past due** — doc's own text says "last 3 pages are being manually migrated," not closed |
| Dedicated `ideas` table (13 candidates stuck in meeting recaps) | Proposed, no table yet | Not verified built in this pass — flag for a follow-up check |
| Doc-number collision namespace (month-keying) | Proposed, ~200 known collisions at time of writing | Not verified migrated |
| `~/zao-vault/notes/` structure | — | No root `INDEX.md` found; only `onenote/INDEX.md` exists, scoped to the OneNote migration specifically |

I did not re-verify the ideas-table and collision-namespace items against
live code in this pass — doc 2300 already describes them as proposed-not-yet-
built, and nothing in this session's reads contradicted that. Flagging rather
than re-confirming, to avoid re-deriving doc 2300's own content.

## 3. The cowork tracker — the whole system, not just meetings

`~/bin/zao-tracker` (461 lines, read in full) is the single writer CLI. Five
subcommands, one `legacy_source` prefix each:

| Subcommand | `legacy_source` | Default owner | What it's for |
|---|---|---|---|
| `pr <num> "<title>"` | `pr-auto` | Iman | PR-created-a-test-task, per `feedback_pr_auto_test_task` |
| `research <num> "<title>"` | `research-doc` | Zaal | Every `/zao-research` doc, incl. this one |
| `inbox <id> "<title>"` | `inbox` | Zaal | ZOE-captured items |
| `meeting <slug> "<title>"` | `meeting` | Zaal | Meeting action items (doc 2400) |
| `handoff <slug> "<summary>"` | `handoff` | Zaal | Lane handoff briefs |

**Two incidents documented inline in the script itself:**

- `zao-tracker:82-87` — the usage doc shows `[owner=Zaal]` but earlier code
  took the raw positional arg, so it literally passed the string
  `"owner=Zaal"` as an owner label and failed with `owner 'owner=Zaal' not
  in team_members`. Fixed by stripping the `owner=` prefix — still fixed as
  of this read.
- `zao-tracker:159,185` — a 2026-07-27 audit found 98 of 133 overdue tasks
  carrying an identical boilerplate trailing sentence, because the schema
  never captured real context. Fixed by splitting title/notes and by a
  fallback string (`zao-tracker:214`: `"NO CONTEXT CAPTURED - pass --why and
  --done-when next time."`) — but that fallback WARNS, it does not BLOCK
  the create. A caller can still skip `--why`/`--done-when` today.

**One open item, not yet fixed:** `zao-tracker:274-277` — `--status
cancelled` is not a valid status (schema only allows todo/in_progress/
blocked/done); the comment says it "needs a migration, ask-first per
CLAUDE.md," and no PR exists for it. Callers work around this by marking
cancelled work `done` instead, which is a real signal-quality cost (a
cancelled task and a completed one are not the same fact).

**Surfaces that read this tracker**: The Wall (`zj`), ZOE's own concierge
turn (a `<tasks>` block injected into its system prompt), `/zao-research`'s
own dedup pre-check (Step 2.6), and a cowork app page in ZAOOS's `src/app/`.

## 4. Bonfire — beyond meetings

Three live posters into the ZABAL knowledge graph, not one:

| Poster | File | Trigger |
|---|---|---|
| ZOE's own capture/decisions | `recall.ts` `remember()` | Every capture where `bonfireConfigured()` is true |
| `/meeting` skill | `bonfire-episode.sh` (doc 2400) | Per meeting recap, one episode per decision/action |
| ZABAL Games community submissions | `bonfire-queue.ts` | Per steward approval, Upstash-queue-sourced |

All three funnel through the same secret-scan gate before posting — `recall.ts`
carries the same pattern list doc 2400 found in `bonfire-episode.sh`
independently (`sk-ant-*`, `ghp_*`, PEM blocks, 64-char hex, Telegram bot
tokens, Slack tokens, AWS keys) — confirmed by direct read, both scripts
implement the same list rather than sharing one function, which is a small
duplication worth noting but not urgent.

**The read path is still gated.** `~/.claude/skills/bonfire/SKILL.md:94`:
`/labeling/hybrid` is 403 for the non-admin key, so `/vector_store/search`
returns empty until an admin runs labeling — unchanged since doc 754
(2026-05-24, the key migration). ZOE's `recall()` handles this by falling
back to a manual relay to Zaal rather than silently returning nothing
(`recall.ts`, confirmed `RECALL_EPISODE_CHARS = 1200` default,
`READ_TIMEOUT_MS = 10_000`).

### Automated vs manual

| Step | Automated |
|---|---|
| Episode write (any of the 3 posters) | Full, best-effort, never throws on failure |
| Secret scan before write | Full, 100% of attempts, both known posters |
| Recall (read) | Full when configured, but degraded — falls back to manual relay since the labeling gate blocks real search |
| Labeling (make the graph searchable) | **Manual, admin-only, not yet run** |

## Consolidated gaps

1. **OneNote kill-by-date (2026-08-18) has passed, unconfirmed closed.**
   Worth a direct one-question check with Zaal rather than either assuming
   done or re-auditing from scratch.
2. **Bonfire read path still 403-gated** — three months after the key
   migration (doc 754), semantic search is still unavailable. This is an
   admin action (run labeling), not a code fix — flagging as a decision
   waiting on Zaal, not a bug.
3. **`--status cancelled` still unsupported** in the tracker — a real
   migration, not yet started, no PR tracking it.
4. **Context-capture on task creation is warn-not-block** — the exact gap
   the 2026-07-27 audit found is still possible to hit again; the fallback
   text fires but nothing stops a low-context task from being created.
5. **Magnetiq (retired) is still in ZOE's project-keyword list**
   (`inbox-triage.ts`) — small, low-stakes, but an inbound message mentioning
   Magnetiq would still route as if the project were live.
6. **Secret-scan pattern list is duplicated, not shared**, between
   `recall.ts` and `bonfire-episode.sh` — both correct today, but a future
   pattern update has to remember to touch both.
7. **No root index for `~/zao-vault/notes/`** — the vault has per-topic
   organization but nothing plays the role `_meetings-index.md` plays for
   meetings.

## Sources

All FULL — read in full or directly queried:

- `bot/src/zoe/{README.md, inbox-ingest.ts, inbox-triage.ts, concierge.ts, recall.ts, bonfire-queue.ts}` (this repo)
- `~/bin/zao-tracker` (461 lines, read in full)
- `~/.claude/skills/bonfire/SKILL.md`
- `research/dev-workflows/2300-input-pipeline-organization/README.md` (this repo — the prior map this doc extends)
- `research/dev-workflows/2400-meeting-ingestion-crm-pipeline-current-state/README.md` (this repo — the doc this one continues from)
- `~/zao-vault/onenote/INDEX.md`, `~/zao-vault/notes/` (existence/structure checked directly)
- `.claude/rules/pii-hygiene.md`, `.claude/rules/confirm-before-claiming-absence.md` (this repo, cited context)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Confirm whether OneNote kill (doc 2300, due 2026-08-18) actually closed | Zaal | Decision | wontfix (one-question check, not scheduled) |
| Decide whether to run Bonfire labeling (unblocks semantic search, admin-only) | Zaal | Decision | wontfix (known gate, not urgent per doc 754 history) |
| Migrate tracker schema to support `status=cancelled` | Zaal or next lane | PR | wontfix (no urgency signal, but the workaround costs signal quality) |
| Drop Magnetiq from ZOE's project-keyword list in `inbox-triage.ts` | Next lane | PR | wontfix (low-stakes cleanup) |
