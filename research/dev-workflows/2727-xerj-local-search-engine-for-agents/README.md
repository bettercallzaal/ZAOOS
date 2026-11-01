---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-31
superseded-by:
related-docs: agents/2474-agentic-lane-throughput-and-research-retrieval, agents/2599-hindsight-vector-memory-mcp-agent-fleet, identity/2196-agent-native-docs-llmstxt-mcp-reality
original-query: "https://github.com/xerj-org/xerj /zao-research"
tier: STANDARD
---

# 2727 - XERJ (xerj-org/xerj): a local search engine and MCP server for coding agents

> **Goal:** Say what XERJ is, who makes it, how mature it is, and whether it replaces or extends anything ZAO already runs.

All repository figures are as of 2026-10-31 (evening EDT, which is 2026-11-01 UTC), read with `gh api`.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **SKIP installing XERJ now.** Re-look on 2026-12-01. | Every job it would do here already has a working tool: `zao-research-index` (SQLite FTS5, BM25) searches the research library, Serena and `rg` search code, and the Hindsight MCP server plus Bonfire hold agent memory. It is also still a release candidate (`v1.0.0-rc.100`, 2026-10-27), and the standing rule from 2026-10-29 is no new projects until the cash goal is met. |
| 2 | **USE its measured result as a finding, not as a reason to install.** | Its own case study shows retrieval cuts output tokens 2.7x against grep, but only on code the model has not memorised. On popular public libraries (valkey, memcached) its own control lost: memory alone 6/6 for $1.49, XERJ 5/6 for $4.40. Our code is mostly a Next.js and Supabase stack the model knows well. |
| 3 | **If anyone trials it later, run it with auth on and the field-report path off.** | The quick start uses `--insecure` (no TLS, no API key, every local caller is a superuser). The project also asks every user and every agent to open a PR to its repo as a "field report", and ships an MCP tool, `xerj_field_report`, that files one. Under our rules a PR to an outside repo is an outbound action that is Zaal's to make. |
| 4 | **Do not use Corpus Hub packs until issue #2791 is answered.** | On 2026-10-31 a developer filed #2791 saying XERJ asked to relicense their AGPL code to MIT, they declined, and it was relicensed anyway. It was open and unanswered when read. The CLA also still has an unfilled placeholder where the legal owner should be named. |

## What XERJ is

One Rust binary (Apache-2.0) that does three things:

1. **`xerj autoindex <folder>`** works out what each file is (source code through tree-sitter, PDF, CSV, JSONL, SQLite, logs, mail, Office files) and builds one index per dataset. The README's sample run: 25,329 files, 593 datasets, 158.1 s with 8 workers. That is the project's own run.
2. **An Elasticsearch-compatible REST API** on `localhost:9200` for BM25, kNN vector and hybrid search. The README badge claims 1,444 of 1,454 ES YAML conformance cases pass. The default "semantic" embedder is lexical feature-hashing, not neural; neural is opt-in and downloads about 90 MB.
3. **An MCP server** (`xerj mcp`): search, semantic, vector and hybrid search, `xerj_def` (go to definition), `/_memory` store and recall, a link graph (`xerj_brain_*`), and Corpus Hub tools. The README says 23 tools with Hub tools on; andrew.ooo counted 13 on 2026-10-16. The count has grown between releases.

The main use case it sells is **reference coding**: the agent clones the open-source repos closest to the task, indexes them, and reads how they solved it before writing code.

## Who makes it

UNKNOWN as a named person or company.

- `xerj-org` is a GitHub **User** account (not an org), created 2026-06-28. Repo created 2026-06-30.
- `xerj-org` wrote 3,297 commits. The next contributors have 130 (Vinz2168), 109 (buger) and 38 (thomas-villani). A `cursoragent` account has 17.
- `NOTICE` says "Copyright 2026 The XERJ Authors". `CLA.md` opens with a maintainer note: "It has not been reviewed by a lawyer... Two placeholders must be filled in before it is authoritative - the legal entity named as the Project Owner, and the contact address."
- The only HN submission (2026-08-14, 3 points) was posted by HN user LeonidBugaev. The third-largest contributor, `buger` (109 commits), has the profile name Leonid Bugaev and company Tyk.io (`gh api users/buger`). That links him to the project but does not show he owns it.

## Maturity

| Measure | Value | Source |
|---|---|---|
| Stars | 17,947 | `gh api repos/xerj-org/xerj` |
| Star growth | 6,205 (2026-10-16) -> 13.2k (2026-10-23) -> 17,801 (2026-10-31) | andrew.ooo, osrepos.com, andrew.ooo update |
| Forks | 1,397 | `gh api` |
| Open issues + PRs | 85 | `gh api` (`open_issues_count` counts both) |
| Total PRs ever | 1,971; 101 mention `user-feedback` | GitHub search API |
| Last commit | 2026-11-01 00:36 UTC (`e5d994b7`) | commits API |
| Latest release | `v1.0.0-rc.100`, 2026-10-27; no 1.0 final | releases API |
| Release pace | 16 release candidates between 2026-10-01 and 2026-10-12 | andrew.ooo |
| Licence | Apache-2.0, read from the 201-line LICENSE file | contents API |
| Community | HN: 1 story, 3 points, 1 comment. Reddit: not fetched (blocked) | HN Algolia API |

Stars tripled in 15 days while HN shows almost no discussion. We could not check the star list for bursts: the stargazers endpoint returned 404 for this repo and also for the control `cli/cli`, so the failure is our token, not the repo. That leaves star quality UNVERIFIED.

## What it would replace or extend here

Searched 2026-10-31: `zao-research-index` for "xerj", "code search", "agent memory", "hybrid search", "bm25", "semantic search", "vector search", "mcp server search"; `git cat-file` on origin/main for the Hindsight files; `command -v` for `rg`, `qmd`, `zoekt`, `ollama`. "xerj" appears nowhere in the library or repo.

| XERJ job | What we already run | Verdict |
|---|---|---|
| Search the research library | `~/bin/zao-research-index` (FTS5 over every doc on origin/main). Doc `agents/2474` chose exactly this: FTS5 first, small local embedder only for paraphrase. | Already built. XERJ adds a server process and a second index of the same corpus. |
| Code search, go-to-definition | Serena symbol tools (mandated in CLAUDE.md, `.serena/` in this repo), `rg` installed | Already built. Serena is closer to the editor. |
| Agent long-term memory | `mcp/hindsight-mcp-server/index.ts`, `src/lib/hindsight.ts`, `src/lib/memory-recall.ts` (all on origin/main, doc `agents/2599`); Bonfire for knowledge graph recall | Already built, two layers. |
| Library and API docs for an agent | context7 MCP (auto-use rule in CLAUDE.md) | Already built, for public libraries. |
| Reference coding (clone peers, read their solution) | `mcp__grep__searchGitHub` and `gh search code` do the find step; nothing indexes a cloned peer repo | Partial gap. This is the one thing XERJ does that we do not. Its own numbers say it pays off on unfamiliar or private code, which is not most of ZAOOS. |
| Log analytics | none in particular | Not a current need. |

**Glue-first read:** for four of the five jobs an installed tool already does it. The fifth (reference coding) is worth revisiting only when a lane works against an unfamiliar library and context7 has nothing for it.

## Risks found

- **`curl | sh` install.** The SkillsLLM security scan (2026-10-20) flags it as medium. The installer checks a SHA-256 against the GitHub release, per andrew.ooo.
- **Outbound by default in the culture, not the code.** The default node sends no document text out. `rerank` (to TypeSafe AI's Jev), proxy embeddings and the WAL tap do, and all three are off until an operator sets them (llms.txt, "Caveats"). The field-report PR ask is the real outbound risk for an agent fleet.
- **Licensing of mirrored corpora.** Issue #2791 (relicensing complaint) and #2793 (a contributor asking for their work to be changed in Corpus Hub), both 2026-10-31, both open.
- **An unnamed owner and a CLA with blanks.** Contributors sign a CLA whose counter-party is not named yet.
- **Release candidate.** 100 RCs, no 1.0.

## Also See

- [Doc 2474 - fleets of coding agents and grep-scale retrieval](../../agents/2474-agentic-lane-throughput-and-research-retrieval/) - the FTS5-first decision this doc confirms
- [Doc 2599 - Hindsight vector memory](../../agents/2599-hindsight-vector-memory-mcp-agent-fleet/) - the memory layer we already have
- [Doc 2196 - llms.txt is hygiene, MCP is the lever](../../identity/2196-agent-native-docs-llmstxt-mcp-reality/) - XERJ's install path is an llms.txt aimed at agents

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Re-run the snapshot (`gh api repos/xerj-org/xerj`, latest release, issue #2791 state, CLA owner field) and append a dated "Updated" note to this doc; done when that note is merged | Claude (research lane) | PR | 2026-12-01 |
| If a lane hits an unfamiliar library that context7 does not cover, trial reference coding on that one library with auth on, `xerj_field_report` unused, no Corpus Hub; done when a short note with token counts is added here | Claude (the lane that hits it) | Doc update | wontfix until that case happens |
| Leave `zao-research-index`, Serena and Hindsight as they are; no install, no config change | Claude (research lane) | None | 2026-10-31 (decided in this doc) |

## Sources

- [xerj-org/xerj repo metadata](https://github.com/xerj-org/xerj) - [FULL] `gh api repos/xerj-org/xerj`, read 2026-10-31
- [README.md](https://github.com/xerj-org/xerj/blob/main/README.md) - [FULL] contents API, 43,659 bytes saved and read
- [LICENSE](https://github.com/xerj-org/xerj/blob/main/LICENSE) - [FULL] contents API, Apache-2.0 text, 201 lines
- [CLA.md](https://github.com/xerj-org/xerj/blob/main/CLA.md) and NOTICE - [FULL] contents API
- [Commits, releases, contributors, issues](https://github.com/xerj-org/xerj/commits/main) - [FULL] REST API
- [Issue #2791](https://github.com/xerj-org/xerj/issues/2791) and [#2793](https://github.com/xerj-org/xerj/issues/2793) - [FULL] REST API, issue body and comments
- [xerj-org account and its 47 repos](https://github.com/xerj-org) - [FULL] `gh api users/xerj-org` and its repos list
- [xerj.org/llms.txt](https://xerj.org/llms.txt) - [FULL] curl, 79,860 bytes
- [Reference-coding case study](https://xerj.org/case-studies/reference-coding.html) - [FULL] curl plus HTML strip
- [docs/SECURITY_MODEL.md](https://github.com/xerj-org/xerj/blob/main/docs/SECURITY_MODEL.md) - [PARTIAL - fetched by curl, 52,807 bytes; only grepped for outbound and telemetry terms, not read end to end]
- [andrew.ooo review, 2026-10-16, facts updated 2026-10-31](https://andrew.ooo/posts/xerj-review-elasticsearch-compatible-search-for-ai-agents/) - [FULL] curl plus HTML strip. The reviewer did not install XERJ either.
- [osrepos.com profile, checked 2026-10-23](https://osrepos.com/repo/xerj-org-xerj.md) - [FULL] curl
- [SkillsLLM listing and security scan, 2026-10-20](https://skillsllm.com/skill/xerj) - [FULL] curl plus HTML strip
- [HN: "Local code search engine for reference coding", 2026-08-14](https://news.ycombinator.com/item?id=49298636) - [FULL] HN Algolia items API
- [Glama MCP listing](https://glama.ai/mcp/servers/egpo8tc3o0) - [PARTIAL - page fetched; it mirrors the README and adds no independent score in the text we stripped]
- Reddit search for "xerj" - [FAILED - JSON API 403; `zao-fetch-reddit.sh` has no OAuth credentials; gstack `/browse` got "You've been blocked by network security"]
- GitHub stargazer timeline - [FAILED - `stargazers` endpoint 404 for this repo and for the control `cli/cli`, so the cause is our token]
