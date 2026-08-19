---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-08-18
superseded-by:
related-docs: "2317, 2318, 2319"
original-query: "Logging everything to Obsidian - capture completeness for a two-surface (Obsidian + Claude) operating stack. Cover: daily-note/session-log conventions that work with agents (community practice, real fetches), capture QA (how to VERIFY nothing is dropped - checksums/inventories/the 2026-08-18 OneNote sweep as the case study), append-only journals (llm-wiki-kit pattern from doc 2317), and the concrete ZAO convention to adopt."
tier: STANDARD
---

# 2320 - Logging Everything to Obsidian: Capture Completeness for a Two-Surface Stack

> **Goal:** Turn "log everything to the vault" from a mandate into a checkable convention: where agent session logs land, what format survives contact with both humans and agents, and how to VERIFY nothing was dropped.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Daily-note grain | **One file per day per surface: `daily/YYYY-MM-DD.md` in the vault, sections appended per loop iteration / session** | Every working community system converges on date-named files with appended timestamped sections (jeffhuang 14-year single file; acascais per-project `daily_log/YYYY-MM-DD.md`; Donbavand multi-session daily file; agentlog daily-note append). ZAO already has `daily/` - keep it, do not add per-project daily dirs until one project's volume drowns the shared file. |
| Who writes the log | **The agent, in the same turn as the work, with a level-of-detail contract** - key actions + outcomes, decisions + reasoning, blockers, pending. NOT every file touched, NOT full command output | acascais tested both extremes: "every file touched" is unreadable, "worked on the project" is useless. Donbavand caps captures (5 prompts, 20 files) for the same reason. The organizer-loop iteration-1 log (2026-08-18) already follows this shape. |
| End-of-session automation | **SKIP hook-driven auto-journaling (chronicle/agentlog class tools) for now** | ZAO already has the PreCompact handoff guard + per-lane living briefs (doc 2319), which cover succession. Auto-journal hooks add a second writer to the vault per session (multi-writer risk flagged in doc 2317) and narrate bookkeeping into every turn (jcosta's own listed rough edge). Revisit only if lanes stop writing logs manually. |
| Promotion pipeline | **ADOPT the grep-able promotion marker: `PROMOTE:` line in any daily log or lane brief, swept by the organizer loop into notes/ or queues** | acascais's `**-> notes.md**:` marker + hook sweep is the cleanest two-tier (ephemeral daily log -> durable note) contract found; "no database, no state file, just text patterns in markdown". Same mechanism as ZAO's existing GRILL-QUEUE pattern - one marker, one sweeper. |
| Capture QA | **Inventory counts, not vibes: every sweep/migration commits a manifest (source count vs mirror count vs residual), and the loop reports the residual number every iteration** | The 2026-08-18 OneNote sweep worked because it was inventory-driven (see Findings). A capture system that cannot state "N remaining" cannot claim completeness. |
| Routing-quality signal | **Inbox size is the health metric: a growing `inbox/` means a missing domain, not a busy week** | jcosta runs the same architecture (route-first, inbox as back door): "after three weeks my fallback inbox holds exactly one item, which is the sign the routing is working". ZAO's `inbox/` held 0 files at both organizer intake checks on 2026-08-18 - healthy. |

## Findings

### 1. Daily-note conventions that survive agents (community practice)

- **Date-named append-only files are the universal substrate.** The 88-point HN thread (85 comments) splits between single-file-forever (kabdib: one flat file for years with a timestamp macro; the Windows `.LOG` first-line trick that appends a timestamp on every open) and file-per-day (jmcphers: 8 years of `diary/YYYY-MM-DD.md`, "compatible with Obsidian's Daily Notes"). Nobody sustainable uses an app-shaped database. Jeff Huang's system is the extreme proof: 14 years, one .txt, 51,690 hand-written lines, todo list becomes the what-done record by appending notes under each day's block.
- **Agents slot into the same shape.** Every 2026-era Claude Code + Obsidian writeup lands on `sessions/YYYY-MM-DD.md` or a daily-note section as the today-only tier: jcosta's routing priority puts it at position 3 (domain note > new domain file > daily session log > inbox); Donbavand stacks multiple sessions into one daily file with an overview table; the zenn.dev atani pipeline appends a per-tool "Claude Code Activity" section to the Obsidian daily note and is explicitly idempotent (re-running the same day replaces the section instead of duplicating it - a property worth copying).
- **The load-bearing piece is a per-turn reminder, not an end-of-session dump.** jcosta: capture fires on UserPromptSubmit BEFORE the reply ("Stop fires after Claude has already answered... too late to shape the reply"); the vault edit lands in the same turn as the answer. Donbavand's three-attempt journal death spiral ("I'd finish a session, tell myself I'd write it up later, and later never came") is the failure mode this kills.

### 2. Capture QA - verifying nothing is dropped

- **The OneNote sweep (2026-08-18) is the internal case study and the pattern to codify.** What made it verifiable: (a) a manifest BEFORE deletion - `onenote/00-DELETE-MAP.md` lists every page with line count, vault mirror path, curation destination, and a per-row IMAGE-CHECK flag; (b) a parallel visual archive - 321 full-page JPEG captures under `onenote/assets/` (verified by count on 2026-08-18); (c) an explicit gap ledger - the assets README declares its known gaps ("text-only pages, zero image risk, top-frame missing") instead of silently claiming 100%; (d) a routing state machine - 142 mirror pages each carry `routed:` frontmatter, so completeness is one grep: 122 unrouted remained after organizer batches 1-2 (started 142; 20 routed, 0 dropped, verified per-batch).
- **Generalized: capture QA = three numbers per sweep.** Source inventory (what exists), mirror inventory (what was captured), residual (what is not yet routed/verified). Commit all three with the batch. If any number is estimated rather than measured, say COULD NOT MEASURE - the vault's own `zao-vault-log` block does exactly this ("COULD NOT MEASURE 2026-08-18. This is not a claim that nothing shipped." - daily/2026-08-18.md) and that honesty is the standard (anti-fabrication rule: a missing verifier is a FAIL, not a pass).
- **Tools that skip rather than guess are the model.** claude-obsidian-chronicle's design rules: dedup by session_id (resume appends to the same note, never a duplicate), per-session lock so PreCompact + SessionEnd cannot double-write, and "skips, never guesses - empty/oversized convo, claude -p errors, or no vault -> log + exit, no garbage note". agentlog fails soft the same way (no resolvable daily note path -> skip the write). A capture layer that writes garbage on failure is worse than one that visibly skips.

### 3. Append-only journals (the llm-wiki-kit pattern, extended)

- llm-wiki-kit (MIT, iamsashank09/llm-wiki-kit, 62 stars as of 2026-08-18, up from 12 at doc 2317's write) ships `log.md` ("what happened when") + `index.md` as first-class wiki files with a dedicated `wiki_log` append operation - the journal is part of the schema, not an afterthought. Doc 2317 adopted the conventions (hierarchical folders, mandatory frontmatter, status-never-delete, append-only logs); this doc operationalizes the append-only log half.
- Append-only + git = the audit trail: the vault's git history is the tamper-evident layer (who wrote what when), the daily note is the human-readable layer. jcosta's sync hooks add the durability layer (pull-rebase on session start, hostname-stamped commit + push to two remotes on end, never force-push, abort-and-log on conflict) - ZAO's equivalent is the git vault + per-batch commits; the two-remote trick is worth stealing later, not now (single remote + Working Copy on phone already covers device loss for the vault's threat model).

### 4. The concrete ZAO convention (adopt now)

1. **Every loop iteration / session appends one `## <lane> - <what> (<time window>)` section to `daily/YYYY-MM-DD.md`** covering: what ran, what routed/shipped (with counts), what blocked, what queued next. The organizer loop's iteration-1 entry (2026-08-18) is the reference example. Chat is transport; the vault is the record (handoff-discipline rule 7).
2. **Level of detail contract:** decisions + reasoning + counts + blockers. Banned: raw tool output, full file lists, "made progress".
3. **Batch = commit = log line.** No vault commit without its daily-note section; no daily-note claim without its commit. The pair is the completeness check.
4. **Sweeps carry manifests.** Any migration/sweep of N items commits: source count, captured count, residual count, and a gap ledger for known losses. Frontmatter state (`routed:`) makes the residual grep-able.
5. **Promotion marker:** a `PROMOTE:` line in any daily log or brief flags content for notes/ or a queue; the organizer loop sweeps markers each iteration (same mechanic as GRILL-QUEUE).
6. **Inbox is the alarm, not the workflow.** Route first; anything in `inbox/` for more than one organizer iteration means a domain/queue is missing.

## Also See

- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - the two-surface stack verdict + frontmatter contract this extends
- [Doc 2318](../../agents/2318-elizaos-memory-vs-zao-corpus-agent/) - the vault-organizer agent whose loop enforces this
- [Doc 2319](../2319-handoff-workflow-audit/) - handoff briefs; the succession layer this logging layer complements
- Tracker: no in-flight related tasks found (checked 2026-08-18)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge this doc; the ZAO convention (section 4) becomes binding for lanes when the PR lands | @Zaal | PR review + merge | 2026-08-21 |
| Add the convention to `.claude/rules/handoff-discipline.md` as rule 11 (one PR, ~15 lines); shipped = rule merged on main | @Zaal (review) / organizer lane (write) | PR | 2026-08-22 |
| Organizer loop reports the unrouted-residual count in every daily-note section (already started: 122 as of batch 2); shipped = number present in each organizer entry in `daily/` | organizer lane | convention | 2026-08-19 |
| Add `PROMOTE:` marker sweep to the organizer loop iteration checklist in `handoffs/organizer.md`; shipped = brief updated + first sweep logged | organizer lane | vault edit | 2026-08-19 |

## Sources

- [Ask HN: How do you maintain your daily log?](https://news.ycombinator.com/item?id=33359329) - [FULL - Algolia items API, full comment tree walked, 88 points / 85 comments, 2022]
- [My productivity app is a never-ending .txt file (Jeff Huang)](https://jeffhuang.com/productivity_text_file/) - [FULL - curl + HTML strip; updated 2022-03-21; 14 years, 51,690 lines]
- [How I Give Claude Code a Persistent Brain in Obsidian (John Costa, 2026-06-17)](https://jcosta.tech/writing/how-i-give-claude-code-a-persistent-brain-in-obsidian/) - [FULL - exa web_fetch]
- [Adding a Daily Log to My Claude Code Knowledge System (Antonio Cascais, 2026-02-28)](https://blog.acascais.com/daily-log-claude-code/) - [FULL - exa web_fetch]
- [Claude Code Hooks + Obsidian = A Searchable Dev Journal That Writes Itself (Daniel Donbavand, 2026-02-04)](https://danieldonbavand.com/2026/02/04/my-journal-writes-itself/) - [FULL - exa web_fetch]
- [takashito/claude-obsidian-chronicle](https://github.com/takashito/claude-obsidian-chronicle) - [PARTIAL - exa search extract of README (design rules, trigger table, failure-mode log lines all captured); code not read - not needed, verdict is SKIP-for-now]
- [albireo3754/agentlog](https://github.com/albireo3754/agentlog) - [PARTIAL - exa search extract of README (append flow + fail-soft behavior captured); code not read - same SKIP verdict]
- [iamsashank09/llm-wiki-kit](https://github.com/iamsashank09/llm-wiki-kit) - [FULL - gh api readme, base64-decoded; MIT; 62 stars, checked 2026-08-18]
- [Summarizing AI Work Logs with Local LLM and Exporting to Obsidian Daily Notes (zenn.dev/atani, 2026-02-16)](https://zenn.dev/atani/articles/ai-log-summary-local-llm-obsidian) - [PARTIAL - exa search extract; the idempotent section-replace behavior and pipeline shape captured, full article body not fetched]
- Internal: `~/zao-vault/onenote/00-DELETE-MAP.md`, `onenote/assets/README.md` (321 captures counted on disk 2026-08-18), `daily/2026-08-18.md` organizer entries - [FULL - local files]
- Reddit: not attempted - fully walled from this machine per doc 2282 (2026-08-14 ladder measurement); HN + GitHub cover the community-source requirement.
