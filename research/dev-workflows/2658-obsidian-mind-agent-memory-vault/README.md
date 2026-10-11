---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-10
related-docs: "2317, 2448, 2401, 2459, 2423, 1093, 689, 045"
original-query: "Zaal shared https://www.reddit.com/r/BestGitHubRepos/comments/1x2cdu3/ (Obsidian Mind, github.com/breferrari/obsidian-mind, about 5k stars, MIT, TypeScript, v9.1.0 of 2026-10-06): an Obsidian vault plus Claude Code, Codex and Gemini hooks for persistent agent memory, with QMD semantic search and subagents like context-loader and review-prep. Run /zao-research on it as a STANDARD doc in ZAOOS. REAL FETCHES ONLY: read the repo README, the hooks, the QMD search module and the license on GitHub this run, and report each URL FULL/PARTIAL/FAILED. The question, extend-not-rebuild per code-restraint and confirm-before-claiming-absence: the ZAO already has ~/zao-vault (handoffs, status files, decisions, BLACKBOARD), the ~/.claude/projects memory files, SessionStart and PreCompact hooks in zaal-dotfiles (zao-lane-context.sh, zao-cc-bundle.sh), zao-tracker, and Bonfire recall; inventory those first, then say exactly which Obsidian Mind pieces we lack (likely only semantic recall over the vault and the session-end auto-note), what each would cost to adopt as an extension of our files rather than a second vault, what its hooks would collide with (two SessionStart writers), and a recommendation with A/B/C for Zaal. Credit the author and license."
tier: STANDARD
---

# 2658 - Obsidian Mind against the ZAO memory stack: what we have, the two pieces we lack, and what each costs as an extension

> **Goal:** Read breferrari/obsidian-mind (v9.1.0, MIT) from its raw files, inventory the ZAO's own memory surfaces from the files that run them, name exactly which Obsidian Mind pieces the ZAO lacks, price each as an extension of an existing ZAO file rather than a second vault, map where its hooks would collide with ours, and give Zaal an A/B/C.

Every quote below was read from a raw file fetched this run (method per source in Sources). Obsidian Mind's README uses em dashes inside sentences; where a quote is reproduced here they are replaced with hyphens per house style and nothing else is changed.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt Obsidian Mind as a vault, or install its hooks into `~/zao-vault` | **NO. Do not clone it, do not install `.claude/settings.json` from it.** | Its five hooks are project-scoped and would fire alongside the ZAO's user-scoped hooks in `~/.claude/settings.json` (symlinked from `~/zaal-dotfiles`): two SessionStart context writers, two PreCompact writers, a per-message classifier on top of `relay-autopull.sh`, and a write validator that warns on every ZAO handoff file because our frontmatter contract (`lane, machine, repo, status`) is not its contract (`date, description, tags`). Its folder model (`brain/ work/ org/ perf/`) is a performance-review vault for an employed engineer; ours is lane briefs, decisions and people. Collision map in Finding 4. |
| Semantic recall over the vault | **ADOPT QMD (tobi/qmd, MIT) as a tool pointed at `~/zao-vault`, wired into files we already run.** | This is the one piece the ZAO measurably lacks. A grep of `~/zaal-dotfiles/bin` and `~/zao-vault/scripts` for `embedding|semantic|fts5|sqlite-vec|qmd` on 2026-10-10 hit 5 files, none an index over the vault: `zao-research-index` is FTS5 over `research/` only; the other four are incidental word hits. Bonfire recall is semantic but over posted episodes, not vault files. `memory-index` is a name-plus-description listing with no search. Cost in Finding 5: one global npm install, about 2.25 GB of local models, zero API cost, one line in `zao-lane-context.sh` and one `qmd update` call in `zao-vault-toc`. |
| The session-end auto-note | **PARTIALLY HAVE. Extend `zao-cc-bundle.sh`, do not port the Stop hook.** | Obsidian Mind's PreCompact copies the raw transcript into the vault (`thinking/session-logs/`, keeps 30); its Stop hook is a hygiene report deduped per session, not a summary; its "wrap up" is a model-run command, the same shape as our `/precompact` and `/handoff` skills. The ZAO already has the mechanical half (`zao-cc-bundle.sh end|precompact` writing `.handoffs/`, measured: six bundles on this Mac dated 2026-10-08 to 2026-10-10) and the model half (`/precompact` writing `handoffs/status/<lane>.md`). The gap is one line: keep the transcript path's file next to the bundle. Raw transcripts stay out of the vault (secrets and third-party PII ride in transcripts; `pii-hygiene.md` rule 1). |
| The `context-loader` and `review-prep` subagents | **PORT `context-loader` as one agent file with a credit line; SKIP `review-prep`.** | `context-loader.md` is 2,903 bytes of prompt (Sonnet, `maxTurns: 20`): semantic search, primary-note lookup, backlinks, mentions, timeline, briefing. Nothing in `~/.claude/agents` or the ZAO agent list does a vault briefing for a person or project; the nearest is the generic `Explore` agent. `review-prep` aggregates performance-review evidence against a competency framework the ZAO does not keep. |
| The `om` MCP server (`remember`, `recall`, `record_work`, `reason`) | **SKIP for now, same verdict as doc 2317 ("adopt later").** | Its value is cross-repo scoped memory with declared reach and a confidence field. The ZAO's equivalents are the memory files (448 in this project's store on 2026-10-10) plus the vault, and doc 2448's open item is to merge their INDEX, not add a third store. Its `reason` tool spawns a second Claude session per call; that is spend the `agent-spend.md` rule would want metered first. |
| Its Codex and Gemini hook configs | **INVESTIGATE - does Zaal's Codex CLI honour `.codex/hooks.json`?** | `.codex/hooks.json` (1,886 bytes, read) wires the same three scripts for Codex with `CODEX_PROJECT_DIR`. The ZAO wants Codex used more (memory `feedback_use_codex_and_google_suite_more`, 2026-10-10); if Codex runs hooks, `zao-lane-context.sh` could be handed to it unchanged. One measured test, not a build. |

## Findings

### 1. What Obsidian Mind is (measured 2026-10-10)

| Fact | Value | Surface |
|---|---|---|
| Stars / forks / open issues | 5,068 / 570 / 9 | `gh api repos/breferrari/obsidian-mind` |
| Created / last push | 2026-02-28 / 2026-10-06 | same |
| Latest release | v9.1.0, 2026-10-06 | `gh api .../releases/latest` |
| Contributors | 8 (snapshot tool) vs 10 (reddit post's table) - the two counts use different API views; the top committer is breferrari with 206 commits, then `github-actions[bot]` with 29 | `zao-research-snapshot`, Arctic Shift post body |
| Files in tree | 278 blobs; 64 of them under `.claude/scripts/tests/` | `gh api .../git/trees/HEAD?recursive=1` |
| Runtime | Node 22+ with `--experimental-strip-types`, zero npm dependencies at runtime (its `package.json` says so); this Mac runs Node v23.3.0 | `.claude/scripts/package.json`, `node --version` |
| Licence | MIT, "Copyright (c) 2026 Brenno Ferrari" | LICENSE file, raw |
| Vendored skill | `kepano/obsidian-skills` by Steph Ango, MIT, as `.claude-plugin/plugin.json` | raw |

The README's own framing: "AI coding agents are powerful, but they forget. Every session starts from zero - no context on your goals, your team, your patterns, your wins." And the design rule it states: "Procedural code owns the environment. The agent owns content."

Its five hooks, from `.claude/settings.json` (raw) and the README's hook table:

| Hook | Script | Timeout | What it does |
|---|---|---|---|
| SessionStart (`startup|resume|clear|compact`) | `session-start.ts` (24,756 bytes + 42,663-byte lib) | 30 s | QMD re-index, North Star excerpt, active work, last-48h git changes, open tasks, full vault file listing, held under a byte budget (`eager_layer_budget_bytes: 9100` in the manifest, because past Claude Code's 10,000-character hook cap "a session receives only a 2,000-character preview") |
| UserPromptSubmit | `classify-message.ts` | 15 s | Regex-classifies each prompt (decision, incident, win, 1:1, person...) and injects routing hints; also hands the agent the previous Stop report |
| PostToolUse (`Write|Edit`) | `validate-write.ts` | 15 s | Frontmatter and wikilink check. Its own comment, line 86: "PostToolUse can't block the write, but a loud warning makes the..." - it warns, it does not block. Fires a debounced QMD refresh. |
| PreCompact | `pre-compact.ts` | 30 s | Copies the transcript to `thinking/session-logs/session_<trigger>_<ts>.jsonl`, retains 30 |
| Stop | `stop-checklist.ts` | 5 s | Hygiene findings, shown once per session and again only on change; full report parked in `.stop-handoff/` for the next prompt (pruned after 7 days) |

A v9 addition is a Claude Code "mod" (`.claude/skills/obsidian-mind/`) that, on Claude Code 2.1.287+, delivers the SessionStart output as an instruction file instead of hook output so it survives compaction and reaches subagents. The README is explicit that it "is unsandboxed code that runs with your permissions".

QMD, the search engine it leans on: `tobi/qmd`, 30,318 stars, pushed 2026-10-06, MIT ("Copyright (c) 2024-2026 Tobi Lutke", LICENSE read). Three local models: `embeddinggemma-300M` (about 328 MB), `qmd-query-expansion-1.7B` (about 1.28 GB), `Qwen3-Reranker-0.6B` (about 640 MB). "No API key to set up, no per-query cost, and it works offline." Metal on Apple Silicon. `qmd search` is BM25 with no model; `qmd query` is the full hybrid.

### 2. Inventory: what the ZAO already runs (each line names the file read)

| Obsidian Mind piece | ZAO equivalent | Surface read 2026-10-10 |
|---|---|---|
| SessionStart context injection | `~/bin/zao-lane-context.sh` (user-scoped SessionStart hook, prints the lane's brief and bundle PATHS, "paths only, never contents") plus `worksession-guard.sh`, `zao-cc-state.sh`, `zao-hook-check` | `~/.claude/settings.json` hooks block; script header |
| PreCompact / session-end bundle | `~/bin/zao-cc-bundle.sh end|precompact` writes `<cwd>/.handoffs/session-<date>-<lane>-<kind>/README.md` (gitignored) from the last prompts, last reply, git state and transcript path; "this hook cannot summarise - there is no model in a hook" | script header; `ls .handoffs` shows bundles dated 2026-10-08 to 2026-10-10 |
| Model-side wrap-up | `/precompact` skill (writes `handoffs/status/<lane>.md`, committed) and `/handoff` skill | `~/.claude/skills/precompact/SKILL.md` |
| The vault itself | `~/zao-vault`: 2,601 markdown files, 141 entries under `handoffs/`, `BLACKBOARD.md`, `DECISIONS.md`, `SYSTEM_MAP.md`, `daily/`, `people/`, git-synced to a private GitHub repo | `find`, `ls`, `git remote -v` |
| Vault hygiene scripts | 88 files in `~/zao-vault/scripts/`: `broken-links.py`, `check-status-frontmatter.py`, `build-toc.py`, `rot-scan.py`, `citation-audit.py`, three PreToolUse guards (`guard-no-secrets.sh`, `guard-not-for-sharing.sh`, `guard-outbound-freeze.sh`) | `ls`, settings hooks block |
| Agent memory | `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/`: 448 files; `memory-index` builds the cold index | `ls | wc -l`; script header |
| Task state | `zao-tracker` (Supabase board) | `command -v` |
| Knowledge-graph recall | Bonfire `/delve` via `bonfire-recall.sh`, local API first | `~/.claude/skills/bonfire/SKILL.md` lines 27 and 140 |
| Research search | `zao-research-index`, FTS5 over the research library, about 30 ms | script header |
| Daily note from shipped work | `zao-vault-log` (merged PRs into `daily/<date>.md`) and `zao-vault-toc` | script headers |
| Per-message classification | none. `relay-autopull.sh` runs on UserPromptSubmit for relay messages, not classification | settings hooks block |
| Write-time frontmatter validation | none as a hook. `check-status-frontmatter.py` and `broken-links.py` run as audits (`/vault-health`) | `~/zao-vault/scripts`, skill |
| Semantic search over the vault | **none** (see Key Decisions row 2 for the grep) | `grep -rliE` over `~/zaal-dotfiles/bin` and `~/zao-vault/scripts` |

What I did not search: the VPS and the Pi. If a vault index runs there it is not reachable from this Mac's files, and nothing in `SYSTEM_MAP.md`'s grep for `qmd` or `semantic search` suggested one (5 vault notes mention the words, all as commentary in handoff status and estate notes).

### 3. Piece by piece: lack, partial, have

| Piece | Status | Note |
|---|---|---|
| Semantic recall over the vault (QMD) | **LACK** | Only lexical grep today. |
| Session-end auto-note | **PARTIAL** | Mechanical bundle exists and fires; model summary exists as a skill; transcript backup does not exist. Obsidian Mind's version is no more automatic than ours: its summary step is also a model command ("say 'wrap up'"). |
| Context briefing subagent | **LACK, cheap** | One prompt file. |
| Per-message routing hints | **LACK, and not wanted** | A node spawn and about 100 tokens per prompt on every session; the ZAO routes captures through ZOE and `todo`, not regex on the prompt. |
| Write-time frontmatter warning | **PARTIAL** | Audits exist; a per-write hook does not. Doc 2448's "memory health check" item is the same gap and is still open. |
| Scoped cross-repo memory API with confidence | **LACK** | Doc 2317 and 2448 both chose "later". Unchanged. |
| Injection budget meter | **HAVE by design** | `zao-lane-context.sh` prints paths, not contents, so it cannot approach the cap. |
| Codex / Gemini hook parity | **UNKNOWN** | Not tested on this Mac. |

### 4. Hook collision map, if Obsidian Mind's `.claude/settings.json` were installed in `~/zao-vault`

Claude Code merges user-scope and project-scope hooks, so for a session started in the vault both sets fire.

| Event | ZAO hook (user scope) | Obsidian Mind hook (project scope) | Collision |
|---|---|---|---|
| SessionStart | `zao-lane-context.sh` injects brief and bundle paths; `worksession-guard.sh`; `zao-cc-state.sh WAITING`; `zao-hook-check`; `zao-guard atrisk` | `session-start.ts` injects up to 9,100 bytes of vault context and runs a QMD refresh | Two context writers. Combined injection is two hook outputs, each under its own cap, so nothing is truncated, but the lane gets a second, structurally foreign brief (North Star, `work/active/`) that points at folders the ZAO vault does not have. 30 s timeout on a hook that re-indexes 2,601 files at every `resume` and `compact`. |
| UserPromptSubmit | `zao-cc-state.sh WORKING`; `relay-autopull.sh` | `classify-message.ts` | Additive. One extra node process per prompt. Its hints ("file this as a decision in `brain/Key Decisions.md`") name paths that do not exist here. |
| PostToolUse Write/Edit | `zao-skills-postedit-hook.sh`, `zao-overlap hook`, `zao-cc-activity.sh` | `validate-write.ts` | Warns on every `.md` lacking `date`, `description`, `tags` (manifest `frontmatter_required.global`). Every ZAO handoff brief (`lane, machine, repo, status, written`) and status file would warn. `noisy-signal-guard.md`: a check that always fires is a check nobody reads. |
| PreCompact | `zao-cc-bundle.sh precompact` writes `.handoffs/` | `pre-compact.ts` copies the transcript jsonl into `thinking/session-logs/` inside the vault | Two writers, and the second puts a raw transcript into a git-synced vault. Transcripts carry tool output, which carries whatever secrets or third-party data the session touched. The ZAO bundle is gitignored for this reason. |
| Stop | `zao-cc-state.sh WAITING` | `stop-checklist.ts` (5 s) | Additive, low cost; its findings would be about a folder layout we do not use. |
| SessionEnd | `zao-cc-bundle.sh end` | none (deliberately; its comment explains Claude Code discards SessionEnd `systemMessage`) | No collision. |

Two more structural collisions. The hooks locate the vault by walking up to `vault-manifest.json`; without it every script exits quietly, so a partial install is a silent no-op (`silent-failure-guard.md`). And its memory model says Claude Code's `MEMORY.md` "is an auto-loaded index that points to vault locations - never the storage itself", which is the opposite of `handoff-discipline.md` rule 7, where agent memory and the vault are separate stores with separate jobs.

### 5. What each lacking piece costs as an extension of a ZAO file

| Piece | Extend which file | Steps | Cost | Reversible |
|---|---|---|---|---|
| QMD recall over the vault | `~/zaal-dotfiles/bin/zao-vault-toc` (add `qmd --index zao-vault update` after the TOC rebuild) and `~/bin/zao-lane-context.sh` (print one line: `vault recall: qmd --index zao-vault query "<q>"`); add a `/vault-health` check that the index exists and is younger than the newest note | `npm install -g @tobilu/qmd`; `qmd --index zao-vault collection add ~/zao-vault --name zao-vault --mask "**/*.md"`; `qmd --index zao-vault embed` once | About 2.25 GB of models on first use, one SQLite store, first embed of 2,601 files unmeasured on this Mac (measure before wiring); per-query "a couple of seconds" per the README because the query embeds locally. Zero dollars. Excludes: `.git`, `archive/`, `crm-import-*` via a `.qmdignore` so contact dumps are not embedded. | Yes: uninstall the package, delete the store. |
| Transcript next to the bundle | `~/bin/zao-cc-bundle.sh` | Copy `transcript_path` to the bundle dir on `precompact`; keep 30 like `pre-compact.ts` | One `copyFileSync` equivalent; `.handoffs/` is already gitignored | Yes |
| Context-briefing agent | new `~/zaal-dotfiles/claude/agents/vault-context-loader.md` | Port the six-step process (search, primary note, backlinks, mentions, timeline, briefing) with ZAO paths (`people/`, `projects/`, `handoffs/`, `decisions/`) and QMD-then-grep fallback; credit line `adapted from breferrari/obsidian-mind .claude/agents/context-loader.md (MIT)` | One file, git-tracked (`vanishing-dependencies.md` rule 1) | Yes |
| Write-time frontmatter warning | `~/zao-vault/scripts/check-status-frontmatter.py` gains a `--file` mode; wire as a PostToolUse hook scoped to `handoffs/status/*.md` only | Keep it to the one folder with a real contract so it can reach zero | Small; risk is noise if widened | Yes |

Not adopting: the mod (unsandboxed code in the session, and the ZAO rule is no settings or hook changes without a PR), the classifier, the `om` MCP server, the folder scaffold, `review-prep`, `brag-spotter`, `slack-archaeologist`, ShardMind install.

### 6. Community signal

The reddit post (r/BestGitHubRepos, score 50, Arctic Shift, 12 comments retrieved where the post reports 4) is a bot-style README digest; the comments are hostile to the category, not the repo: the top comment at 12 points, "Add that to the pile of ... other projects that do the exact same thing"; at 1 point, "What is different about this from giving Claude read/write permissions to an Obsidian vault on your machine?"; and "It is absolutely possible to do autostar to increase GitHub repo stars". That last one is a fair caution and it is why `zao-research-snapshot` takes a second look (Next Actions). Hacker News (Algolia, keyless): one submission, 2026-03-27, 4 points, 1 comment. Doc 2317 found the same practitioner consensus in April to June 2026: run `claude` in the vault directory and keep the stack to two surfaces.

The "what is different" question has a real answer, and it is the hooks plus QMD, not the vault. The ZAO already runs the hooks half in its own shape. QMD is the part worth taking.

### 7. Credit

- **Obsidian Mind** by Brenno Ferrari (GitHub `breferrari`), MIT. LICENSE file read this run. Author's README credits `kepano/obsidian-skills` (Steph Ango, MIT, vendored), James Bedford for vault structure, and `agenticnotetaking/arscontexta` for progressive disclosure and session hooks.
- **QMD** by Tobi Lutke (GitHub `tobi`), MIT. LICENSE file read this run.
- Any ZAO file adapted from either carries the inline credit in the form `credit-attribution.md` requires.

## The A/B/C for Zaal

**A (recommended, the fuller build; nothing here spends money, goes public, or is irreversible):** QMD over `~/zao-vault` wired into `zao-vault-toc` and `zao-lane-context.sh`, the transcript-next-to-bundle line in `zao-cc-bundle.sh`, and the `vault-context-loader` agent file. Three PRs to `zaal-dotfiles`, each with a measured line (first-embed time, three queries with their top hit, one bundle with its transcript). No second vault, no Obsidian Mind hooks.

**B:** QMD only. Same wiring, skip the agent file and the bundle line. One PR.

**C:** Nothing now; re-snapshot the repo on 2026-10-17 and revisit when the Codex hook question is answered. Docs 2317 and 2448 both already chose "later" on MCP-shaped memory, so C is consistent with prior rulings but leaves vault recall lexical.

Not offered: cloning Obsidian Mind or installing its `.claude/settings.json`, for the Finding 4 reasons.

## Also See

- [dev-workflows/2317-obsidian-claude-personal-os-stack](../2317-obsidian-claude-personal-os-stack/) - the two-surface decision; MCP "adopt later"
- [dev-workflows/2448-obsidian-plugins-agent-memory](../2448-obsidian-plugins-agent-memory/) - no community plugins; split-brain memory stores; memory health check still open
- [dev-workflows/2401-zao-capture-ecosystem-zoe-vault-tracker-bonfire](../2401-zao-capture-ecosystem-zoe-vault-tracker-bonfire/) - the capture ecosystem this doc inventories
- [dev-workflows/2459-handoff-artifacts-that-get-consumed](../2459-handoff-artifacts-that-get-consumed/) - agents grep rather than traverse links
- [agents/2423-vault-as-transport-inter-terminal-context](../../agents/2423-vault-as-transport-inter-terminal-context/) - the vault is memory, not a message bus
- [dev-workflows/1093-fable-second-brain-vs-zao-memory-surfaces](../1093-fable-second-brain-vs-zao-memory-surfaces/)
- [agents/689-ai-agent-memory-personal-systems](../../agents/689-ai-agent-memory-personal-systems/)
- [dev-workflows/045-research-organization-patterns](../045-research-organization-patterns/) - first mention of `tobi/qmd` in this library
- Tracker: research-doc rows for 2317 and 2320 (both done 2026-08-21); no open tracker task on "obsidian" or "semantic" on 2026-10-10

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Pick A, B or C; shipped when a decision note exists in `~/zao-vault/decisions/` naming the letter | @Zaal | Grill | 2026-10-14 |
| On A or B: install `@tobilu/qmd`, build the `zao-vault` index with `archive/` and `crm-import-*` excluded, measure first-embed time and three query latencies on this Mac, and PR `zao-vault-toc` + `zao-lane-context.sh` to `zaal-dotfiles` with the numbers in the PR body; shipped when merged and `/vault-health` reports the index age | side lane (Claude Code), reviewed by @Zaal | PR | 2026-10-24 |
| On A: PR `zao-cc-bundle.sh` to copy the transcript into the precompact bundle, retain 30; shipped when one bundle on this Mac contains `transcript.jsonl` | side lane, reviewed by @Zaal | PR | 2026-10-24 |
| On A: PR `claude/agents/vault-context-loader.md` to `zaal-dotfiles` with the MIT credit line; shipped when `claude agents` lists it and one briefing for a person note is pasted in the PR | side lane, reviewed by @Zaal | PR | 2026-10-24 |
| INVESTIGATE - does Zaal's Codex CLI run `.codex/hooks.json` SessionStart hooks? Shipped when a one-paragraph result is appended to this doc | side lane | Test | 2026-10-17 |
| Second look: `zao-research-snapshot breferrari/obsidian-mind`, append the delta here | side lane | Measurement | 2026-10-17 |

## Sources

All fetched 2026-10-10. Method named per line; nothing below came from WebFetch.

- [breferrari/obsidian-mind README.md](https://github.com/breferrari/obsidian-mind/blob/main/README.md) - FULL, raw via `curl raw.githubusercontent.com`, 45,420 bytes, HTTP 200
- [LICENSE](https://github.com/breferrari/obsidian-mind/blob/main/LICENSE) - FULL, raw, 1,071 bytes, MIT, Brenno Ferrari
- [.claude/settings.json](https://github.com/breferrari/obsidian-mind/blob/main/.claude/settings.json) - FULL, raw, 2,649 bytes (hook wiring and timeouts)
- [.claude/scripts/session-start.ts](https://github.com/breferrari/obsidian-mind/blob/main/.claude/scripts/session-start.ts) - FULL, raw, 24,756 bytes; lib 42,663 bytes
- [.claude/scripts/lib/qmd.ts](https://github.com/breferrari/obsidian-mind/blob/main/.claude/scripts/lib/qmd.ts) - FULL, raw, 7,134 bytes (the QMD invocation module); `qmd-bootstrap.ts` 3,339, `qmd-models.ts` 10,079, `qmd-refresh.ts` 14,658 bytes also FULL
- [.claude/scripts/pre-compact.ts](https://github.com/breferrari/obsidian-mind/blob/main/.claude/scripts/pre-compact.ts) - FULL, raw, 3,765 bytes
- [.claude/scripts/stop-checklist.ts](https://github.com/breferrari/obsidian-mind/blob/main/.claude/scripts/stop-checklist.ts) - FULL, raw, 9,206 bytes; `lib/stop-handoff.ts` 3,713 bytes FULL
- [.claude/scripts/validate-write.ts](https://github.com/breferrari/obsidian-mind/blob/main/.claude/scripts/validate-write.ts) - FULL, raw, 8,147 bytes
- [.claude/scripts/classify-message.ts](https://github.com/breferrari/obsidian-mind/blob/main/.claude/scripts/classify-message.ts) - FULL, raw, 3,046 bytes
- [.claude/scripts/lib/memory-recall.ts](https://github.com/breferrari/obsidian-mind/blob/main/.claude/scripts/lib/memory-recall.ts) - FULL, raw, 25,827 bytes; `memory-write.ts` 28,120 bytes FULL
- [.claude/agents/context-loader.md](https://github.com/breferrari/obsidian-mind/blob/main/.claude/agents/context-loader.md) - FULL, raw, 2,903 bytes; `review-prep.md` 2,753 bytes FULL
- [vault-manifest.json](https://github.com/breferrari/obsidian-mind/blob/main/vault-manifest.json) - FULL, raw, 6,227 bytes
- [.codex/hooks.json](https://github.com/breferrari/obsidian-mind/blob/main/.codex/hooks.json) - FULL, raw, 1,886 bytes; `.mcp.json` 116 bytes FULL
- Repo metadata and file tree - FULL, `gh api repos/breferrari/obsidian-mind`, `.../releases/latest`, `.../git/trees/HEAD?recursive=1` (278 blobs)
- [tobi/qmd](https://github.com/tobi/qmd) - FULL for metadata and LICENSE (`gh api`, LICENSE base64-decoded: MIT, Tobi Lutke); README not read this run
- [reddit r/BestGitHubRepos 1x2cdu3](https://www.reddit.com/r/BestGitHubRepos/comments/1x2cdu3/) - FULL, method: Arctic Shift via `~/bin/zao-fetch-reddit.sh`, body plus 12 comments with scores (scores as the index last saw them)
- [Hacker News: Obsidian vault template for engineering work docs via Claude Code](https://news.ycombinator.com/item?id=47539689) - FULL for metadata via `hn.algolia.com/api/v1/search` (4 points, 1 comment, 2026-03-27); comment body not read
- ZAO surfaces: `~/.claude/settings.json` hooks block, `~/bin/zao-lane-context.sh`, `~/bin/zao-cc-bundle.sh`, `~/bin/memory-index`, `~/bin/zao-research-index`, `~/bin/zao-vault-toc`, `~/.claude/skills/precompact/SKILL.md`, `~/.claude/skills/bonfire/SKILL.md`, `ls ~/zao-vault/scripts` - all read from disk this run
