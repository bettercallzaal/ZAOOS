---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-10-09
superseded-by:
related-docs: 2207, 2365, 2626
original-query: "how people are indexing their files with agents"
tier: STANDARD
---

# 2650 - How people index their files with agents, and the one design for Zaal's Media layout

> **Goal:** Find out how people use agents (Claude Code, local LLMs, MCP servers, scripts) to build and keep current a catalog of their files, including what each file or folder is for, and recommend ONE design that extends what already exists on Zaal's Mac.

## Key Decisions

1. **BUILD: a Files section inside the existing `~/zao-vault/scripts/build-system-map.sh`.** It reads one `MANIFEST.md` per event folder under `~/Media/<date>-<event>/` (sha256 per raw file, plus where the second copy lives) and flags every top-level folder under `~/Media` that does not match the event pattern as UNSORTED. It is a script, so it costs nothing per run and gives the same answer every time. Reason: the same judgment every time is code, not inference (`code-over-inference.md`).
2. **DO NOT build an LLM crawler that describes every file on the disk.** Describing a file's purpose is judgment that should be made once, by whoever sorted the folder, and written down next to the files. Re-deriving it per file, per night, is the expensive pattern. The LLM is allowed for a one-time triage of an UNSORTED folder when Zaal asks for it.
3. **USE a per-folder `AGENTS.md` (or README) as the record of "what this folder is for".** The `agents.md` format is a README for agents, MIT licensed (LICENSE file read). The index reads that file; it does not infer the purpose.
4. **USE Spotlight (`mdfind`) for "where is it by name or kind", not for "what is it for".** It answered name queries correctly on this Mac today (control query, see Findings). Two measured outputs are unexplained and must be re-checked before anything relies on Spotlight for content: `mdutil -s /` printed `Index is read-only`, and `mdls` returned `kMDItemTextContent = (null)` for a markdown file.
5. **USE content hashes for integrity, not for description.** The MANIFEST sha256 list is the record. `rclone check --one-way` against the second copy is the verification step (it compares sizes and hashes and writes a report, and it does not alter either side). No new tool is adopted.
6. **NEEDS ZAAL'S APPROVAL:** (a) the nightly launchd job that runs the map build (a `com.zao.*` plist is his to load), (b) adopting the MANIFEST.md writer for each Media event, (c) the UNSORTED threshold (proposed: any top-level folder under `~/Media` that does not match `<YYYY-MM-DD>-<event>`).

## Before vs After

- **Before:** Spotlight finds files by name. `SYSTEM_MAP.md` (85 lines at `~/zao-vault/SYSTEM_MAP.md`) lists repos, tools and services, with no files. `zao-research-index` covers research docs only. Nothing records what a media folder is for.
- **After:** `SYSTEM_MAP.md` gains a Files section with one line per event (file count, bytes, manifest present or not, last verification date) and one line per UNSORTED folder. A gap prints `UNMEASURED`, never `0`.

## Options Compared

| Option | What it answers | Cost per run | Privacy exposure | Fit for Zaal |
|---|---|---|---|---|
| Spotlight + `mdfind` | Where is a file, by name, kind, date | $0, already running | Index lives on this Mac | Use for lookup. Not a description store. Two unexplained readings today (see Findings) |
| SQLite FTS5 catalog built by a script | Keyword search over paths, names and any text the script extracts | $0 per run (script) | Stores what the script reads; scope it | Good for search over MANIFESTs and AGENTS.md files. FTS5 is documented by sqlite.org |
| Embeddings + vector search (sqlite-vec, `vec0` KNN) | Semantic "find things like this" | Embedding model cost (local Ollama, or an API) | Sends content to an embedder unless local | Defer. Only worth it once descriptions exist to embed |
| MCP filesystem server | Lets an agent read and search directories it is allowed to see | Per-turn inference cost | Exposes exactly the directories listed as allowed | Useful for an agent to read a folder. It is an access layer, not a catalog |
| Hash manifests (sha256 list, `rclone check`, `hashdeep` audit mode) | Is this copy identical to that copy; did a file change | $0 (hashing time only) | Hashes and names only | Adopt. This is the integrity layer for Media events |
| Watcher (Watchman) | Records when files actually change, can trigger a rebuild | Background process | Paths only | Optional later, to refresh the map on change instead of nightly |
| Digital asset managers (Immich for photos and video, Hydrus for tagged files) | Browsable library with tags and metadata | Server running 24/7 | Runs a service on the Mac or the Pi | Skip for now. Overlaps the media archive problem in doc 2207 and needs its own server |
| LLM organizers that read content and propose moves (Local File Organizer, AI File Sorter) | "What is this file and where should it go" | Local model time, or API cost per file | Reads file contents | Use only for one-time triage of an UNSORTED folder, with review before any move |
| Duplicate finders (czkawka) | Same name, size or hash across folders | $0 | Paths and hashes | Use once on the 42 GiB of duplicate node_modules, as a report, not a delete |

## Findings

### 1. How people actually do it (pattern level)

- **Index what the OS already indexes, then add meaning on top.** Spotlight is the store that already exists. The agent-side pattern is to query it (`mdfind`) and keep a separate description file per folder, because Spotlight records a file's kind and metadata, not its purpose.
- **A catalog as a plain SQLite database.** FTS5 supports external-content and contentless tables, and a trigram tokenizer, per the sqlite.org FTS5 page (fetched; keyword excerpts read). A script can populate it nightly.
- **Embeddings for "find similar".** The sqlite-vec README (fetched) describes storing float, int8 and binary vectors in `vec0` virtual tables and a KNN-style query. This answers a different question from a catalog.
- **Agents reach files through an allow-list.** The MCP filesystem server README (fetched) says directories are given as command-line arguments or dynamically through MCP Roots, and access is limited to the allowed directories. It gives an agent read access; it does not build an index by itself.
- **Integrity through manifests.** hashdeep (README fetched) computes MD5, SHA-1, SHA-256, Tiger and Whirlpool hashes recursively, and an audit mode checks a set of files against a known list. rclone check (docs fetched) compares sizes and hashes between two remotes and writes one-line-per-file reports (`=` identical, `*` different, `+` only on source, `-` only on destination, `!` error). git-annex (site fetched, partially) describes tracking which drive holds which file, and running from cron to add new files to archival drives.
- **Asset managers for media.** Immich (README fetched, partially) is a self-hosted photo and video manager. Hydrus (README fetched, partially) browses by tags instead of folders.
- **Organizers that read contents and propose moves.** Local File Organizer's README (fetched, partially) advertises a Dry Run Mode to check results before changes. AI File Sorter's README (fetched, partially) says the user reviews and approves before anything is moved.

### 2. Community signal

- **Hacker News, API search** (`hn.algolia.com/api/v1/search`, fetched this run): query "file index agent" returned 131 hits (10 read). Query "AI file organizer local" returned 43 hits (10 read). Most hits are unrelated (an indexer for one public document collection scored 211 points and is not about personal files). The relevant ones are small: "Show HN: Use local LLMs to organize your files" (2025-07-20, 6 points, no comments in the API response), "Show HN: I built a Python script uses AI to organize files, runs 100% locally" (2024-09-21, 11 points, 3 comments read in full). One commenter asked for ebook (ePub) support, and the author replied that the Gemma 2 models read books well.
- **Reddit, r/selfhosted post 1sxi8pu** (read via `~/bin/zao-fetch-reddit.sh`, Arctic Shift route, post body only). A user with 400+ MB RPG PDFs asks for a self-hosted library with RAG, page-level citations and local storage. The post reports that Paperless-ngx ran out of memory when opening the large files. The user's own edit lists the tools they will try, in order: Open Notebook, Open WebUI, AnythingLLM, RAGFlow, Onyx. The 35 comments were not retrieved (0 of 35), so no community verdict is claimed from this thread. The useful lesson is the failure mode: very large files break document managers, and people want page-level citations.
- **Matches Zaal's own case.** His 20 GiB of festival media has the same problem (large files, need to find things by what they are), and doc 2207 already chose a copy-first design with a manifest made at copy time.

### 3. Cost

- Script-based indexing has no per-run inference cost. `code-over-inference.md` (repo rule, measured 2026-08-20) puts a day of agent work at $3,001.85 across 71 sessions, and `zao-spend` (per `agent-spend.md`, measured 2026-08-10) gives cost = turns x about $1.01. The cost of a nightly LLM crawler would therefore be turns per night, every night, for descriptions that rarely change.
- Local inference: the Ollama README (fetched, partially) documents a local HTTP chat endpoint at `localhost:11434/api/chat`. Local inference has no per-token bill, but it uses this Mac's CPU and memory. Not measured here.
- API inference per file: no price is quoted in this doc. Pricing was not fetched, so the number is UNKNOWN.

### 4. Privacy

- **Index metadata, not contents.** The MANIFEST holds paths, sizes and hashes. It must not hold file text. Store the second-copy location as a path, not as contact data.
- **Exclude secret and private paths by name, before any reader runs.** `~/.zao/private/`, `.env` files and key files stay out of the index (`secret-hygiene.md`, `pii-hygiene.md` Rule 1 places raw query dumps in `~/.zao/private/`).
- **Copy no more than the question needs.** A catalog that stores paths, names, sizes and hashes answers the lookup questions. Storing extracted text is a separate decision with its own privacy review.
- **Vault visibility.** `pii-hygiene.md` (amended 2026-09-01) permits third-party contact data in the private vault. The file index is not a contact list, so it does not need that allowance, and it should not carry contact details.

### 5. Measured on this Mac, 2026-10-09 (local surface, not a web source)

- `mdfind -onlyin "<research/infrastructure/2207 folder>" 'kMDItemFSName == "README.md"'` returned the file. This is the control query: it returned a known file, so the instrument works for names.
- `mdfind -count 'kMDItemFSName == "*.md"'` returned 315670. This counts every markdown file Spotlight can see, including vendored dependency folders, so it is not a count of Zaal's documents.
- `mdutil -s /` printed `Index is read-only`. The cause is not established here. It needs a check before Spotlight is relied on for anything written.
- `mdls -name kMDItemTextContent` on a markdown README returned `(null)`. Either Spotlight did not extract that file's text, or the attribute is not exposed for it. Not established here.
- `df -h /` reports 92% capacity and 1.0Gi available on the root volume. Zaal's figure (423 of 460 GiB used) is his own measurement and is not re-measured here.
- `sqlite3` 3.51.0 is on the Mac. Python's sqlite module reports 3.45.3. Whether FTS5 is compiled in on both was not tested.

## Recommended Design (one design, extends what exists)

```
~/Media/<YYYY-MM-DD>-<event>/
  raw/        originals, never edited
  work/       working files
  out/        deliverables
  MANIFEST.md sha256 per raw file, second-copy path, date verified
  AGENTS.md   what this event is, who made it, what the folders hold

~/zao-vault/scripts/build-system-map.sh   (existing; gains a Files section)
  - reads ~/Media/*/MANIFEST.md          -> one line per event, UNMEASURED if absent
  - lists top-level ~/Media folders not matching the pattern -> UNSORTED
  - reads AGENTS.md presence per event   -> described / UNMEASURED
  - writes SYSTEM_MAP.md                 -> same command, no model call

launchd (Zaal loads it): nightly run of build-system-map.sh
monthly (Zaal loads it): rclone check --one-way raw/ against the second copy, report kept
```

Why this one: it reuses the map that already exists and is already generated rather than maintained. It adds no model call. Each event carries its own description, so the nightly job only reads text. Unsorted folders are flagged, not guessed at. The one judgment (what a folder is for) is written once, by the person who made it.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Approve the design above: Files section fed by MANIFEST.md, UNSORTED threshold `<YYYY-MM-DD>-<event>` | @Zaal | Decision | 2026-10-16 |
| Re-check `mdutil -s /` ("Index is read-only") and `mdls kMDItemTextContent` on a known markdown file; shipped when a dated note in `~/zao-vault` records both results | @Zaal | Check | 2026-10-16 |
| Adopt the MANIFEST.md writer for the next Media event (sha256 per raw file, second-copy path); shipped when `~/Media/<event>/MANIFEST.md` exists and lists every file in `raw/` | @Zaal | Process | 2026-10-23 |
| Add the Files section to `build-system-map.sh`, with UNMEASURED for missing manifests; shipped when a run prints the section and a gap shows UNMEASURED, not 0 | @Zaal (reviews the PR) | PR | 2026-10-23 |
| Load the nightly launchd job that runs the map build; shipped when `launchctl list` shows the label with a last exit of 0 | @Zaal | Config | 2026-10-30 |
| Monthly `rclone check --one-way` of raw/ against the second copy; shipped when the first report is written to the vault | @Zaal | Config | 2026-11-06 |
| Run `hashdeep`-style or `rclone` audit once over the 42 GiB of duplicate node_modules as a report only (no deletes); shipped when a report file lists the duplicate sets | @Zaal | Check | 2026-10-30 |

## Also See

- [Doc 2207 - Media to drive, indexed four ways](../2207-media-drive-archive-index/)
- [Doc 2365 - Managing agent memory: the index is byte-bound](../../dev-workflows/2365-agent-memory-management/)
- [Doc 2626 - Backing up the Mac: the options](../2626-mac-backup-options/)

## Sources

Method key: FULL = read in full (or the whole relevant part) this run. PARTIAL = some content read, reason stated. FAILED = not retrieved.

Web and API sources (fetched 2026-10-09 with curl and an HTML strip, the GitHub REST API via `gh api`, or the Algolia HN API, unless stated):

1. [agents.md README](https://raw.githubusercontent.com/agentsmd/agents.md/main/README.md) - FULL, method: curl raw.
2. [agents.md LICENSE](https://raw.githubusercontent.com/agentsmd/agents.md/main/LICENSE) - FULL, method: curl raw. MIT License, Copyright (c) 2025 OpenAI (read from the file).
3. [Watchman README](https://github.com/facebook/watchman) - FULL, method: `gh api repos/facebook/watchman/readme` (the raw.githubusercontent URL returned 404 this run). States purpose: watch files and record when they change.
4. [Watchman LICENSE](https://github.com/facebook/watchman/blob/main/LICENSE) - FULL, method: `gh api repos/facebook/watchman/contents/LICENSE` decoded. MIT License.
5. [rclone check docs](https://rclone.org/commands/rclone_check/) - FULL, method: curl + HTML strip, synopsis and flag list read.
6. [hashdeep README](https://raw.githubusercontent.com/jessek/hashdeep/master/README.md) - FULL, method: curl raw.
7. [hydrusnetwork/hydrus README](https://raw.githubusercontent.com/hydrusnetwork/hydrus/master/README.md) - PARTIAL, method: curl raw, keyword excerpts read (tags instead of folders; subscriptions).
8. [hydrus LICENSE](https://github.com/hydrusnetwork/hydrus/blob/master/LICENSE) - FULL, method: `gh api` decoded. The file opens with the WTFPL.
9. [git-annex home page](https://git-annex.branchable.com/) - PARTIAL, method: curl + HTML strip, first 2.6 KB of 4.7 KB read (use-case text on location tracking and cron-driven archival).
10. [git-annex licence](https://git-annex.branchable.com/) - FAILED, method: `gh api repos/alpernebbi/git-annex` and `repos/joeyh/git-annex` both returned 404. No licence claim is made for git-annex.
11. [MCP servers, filesystem README](https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/filesystem/README.md) - PARTIAL, method: curl raw, keyword excerpts read (allowed directories; MCP Roots).
12. [MCP servers LICENSE](https://raw.githubusercontent.com/modelcontextprotocol/servers/main/LICENSE) - FULL, method: curl raw. Apache License 2.0 text, with a notice that the project is moving from MIT to Apache-2.0 and that some contributions remain MIT.
13. [SQLite FTS5 documentation](https://www.sqlite.org/fts5.html) - PARTIAL, method: curl + HTML strip, 156 KB of text, keyword excerpts read (trigram tokenizer, external content and contentless tables).
14. [sqlite-vec README](https://raw.githubusercontent.com/asg017/sqlite-vec/main/README.md) - PARTIAL, method: curl raw, keyword excerpts read (`vec0` virtual tables, KNN query).
15. [sqlite-vec LICENSE-MIT](https://raw.githubusercontent.com/asg017/sqlite-vec/main/LICENSE-MIT) - FULL, method: curl raw. MIT License, Copyright (c) 2024 Alex Garcia.
16. [Recoll home page](https://www.lesbonscomptes.com/recoll/index.html) - PARTIAL, method: curl + HTML strip, keyword excerpts read. Site states the software is licensed under the GPL. This is the site's text, not a LICENSE file, so it is not treated as file-verified.
17. [czkawka README](https://raw.githubusercontent.com/qarmin/czkawka/master/README.md) - PARTIAL, method: curl raw, keyword excerpts read (duplicates by name, size or hash; empty folders; broken files).
18. [czkawka LICENSE](https://github.com/qarmin/czkawka) - FAILED, method: `gh api repos/qarmin/czkawka/contents` listing has no file matching LICENSE or COPYING. No licence claim is made.
19. [Immich README](https://raw.githubusercontent.com/immich-app/immich/main/README.md) - PARTIAL, method: curl raw, first 600 characters and the notices read.
20. [Immich LICENSE](https://raw.githubusercontent.com/immich-app/immich/main/LICENSE) - FULL, method: curl raw. GNU Affero General Public License v3 text.
21. [Local File Organizer README](https://raw.githubusercontent.com/QiuYannnn/Local-File-Organizer/main/README.md) - PARTIAL, method: curl raw, keyword excerpts read (Dry Run Mode; local models).
22. [AI File Sorter README](https://raw.githubusercontent.com/hyperfield/ai-file-sorter/main/README.md) - PARTIAL, method: curl raw, keyword excerpts read (review and approval before any change).
23. [Ollama README](https://raw.githubusercontent.com/ollama/ollama/main/README.md) - PARTIAL, method: curl raw, keyword excerpts read (`localhost:11434/api/chat`).
24. [simonw/llm README](https://raw.githubusercontent.com/simonw/llm/main/README.md) - PARTIAL, method: curl raw, keyword excerpts read (SQLite logs, embeddings). Cited only as a pointer; no claim depends on it.
25. [HN search API, "file index agent"](https://hn.algolia.com/api/v1/search?query=file%20index%20agent&tags=story&hitsPerPage=10) - FULL, method: curl JSON, 131 hits, 10 read.
26. [HN search API, "AI file organizer local"](https://hn.algolia.com/api/v1/search?query=AI%20file%20organizer%20local&tags=story&hitsPerPage=10) - FULL, method: curl JSON, 43 hits, 10 read.
27. [HN item 41613385 (Local File Organizer post)](https://news.ycombinator.com/item?id=41613385) - FULL, method: `hn.algolia.com/api/v1/items/41613385`, root text and 3 comments read.
28. [HN item 44626550 (AI File Sorter post)](https://news.ycombinator.com/item?id=44626550) - FULL, method: `hn.algolia.com/api/v1/items/44626550`, root text read; the API response lists no comments.
29. [Reddit r/selfhosted 1sxi8pu](https://www.reddit.com/r/selfhosted/comments/1sxi8pu/help_finding_a_selfhosted_pdf_library_with_airag/) - PARTIAL, method: `~/bin/zao-fetch-reddit.sh` via Arctic Shift. Post body read; 0 of 35 comments retrieved. The Reddit OAuth route was not configured on this machine.
30. [Reddit r/DataHoarder and r/LocalLLaMA search, Arctic Shift](https://arctic-shift.photon-reddit.com/api/posts/search) - FAILED, method: curl, returned "Timeout. Maybe slow down a bit" twice; nothing used.
31. [GitHub repo stats, rclone/rclone, facebook/watchman, modelcontextprotocol/servers, qarmin/czkawka, hydrusnetwork/hydrus](https://github.com/rclone/rclone) - FULL, method: `gh api repos/<owner>/<repo>`. Used only for the default branch and last push date, not for popularity claims.

Local sources (read on this Mac, 2026-10-09):

32. `man mdfind`, `man mdutil` - FULL, method: local man pages (`-live`, `-count`, `-onlyin`, `-name`; `mdutil -i`, `-E`, `-s`).
33. Local probe of Spotlight and disk (mdfind control, mdutil -s /, mdls, df, sqlite3 version, launchctl list for com.zao.*) - FULL for the output shown, method: direct command output, quoted in Findings section 5.
34. `~/zao-vault/scripts/build-system-map.sh` (header read) and `~/zao-vault/SYSTEM_MAP.md` (line count 85) - PARTIAL, method: head of file and wc -l. The generator's body was not read.
35. Repo rules `code-over-inference.md`, `agent-spend.md`, `secret-hygiene.md`, `pii-hygiene.md` - FULL, method: read from the orchestrator checkout's `.claude/rules/`.

Counts: FULL 17 (sources 1, 2, 3, 4, 5, 6, 8, 12, 15, 20, 25, 26, 27, 28, 32, 33, 35), PARTIAL 14 (sources 7, 9, 11, 13, 14, 16, 17, 19, 21, 22, 23, 24, 29, 34), FAILED 3 (sources 10, 18, 30). Source 31 is a lookup, not a claim source. The FAILED sources are the git-annex and czkawka licence checks and one Reddit search; no recommendation depends on any of them.
