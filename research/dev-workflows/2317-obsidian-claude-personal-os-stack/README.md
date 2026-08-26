---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-26
related-docs: "2318, 2036"
original-query: "organize all of this so that i can just use obsidian and claude for everything - /zao-research this (Obsidian + Claude as the complete personal stack, from the OneNote consolidation session)"
tier: STANDARD
---

# 2317 - Obsidian + Claude as the Complete Personal Stack

> **Goal:** Zaal wants exactly two surfaces - Obsidian (memory) and Claude (hands). What the August 2026 ecosystem offers, what practitioners actually run, and the concrete setup for ~/zao-vault.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Primary access pattern | **Claude Code file tools directly on the vault - what we already do** | The highest-signal practitioner pattern (HN, 2026-04..06): run `claude` in the vault dir; one practitioner: "I just don't need to explain the project anymore... the LLM finds what it needs in the vault." No MCP needed for the core loop. |
| MCP server, if/when needed | **StevenStavrakis/obsidian-mcp (722 stars, MIT - LICENSE file read)** | Only top-3 option needing NO Obsidian plugin (direct vault access via stdio), etag conflict detection, transactional trash/history under `.obsidian-mcp/`. The bigger two (mcp-obsidian 4,309 stars MIT; obsidian-local-rest-api 2,813 stars MIT) both die when the Obsidian app closes - wrong shape for an always-on agent. ADOPT LATER, only when concurrent-writer conflicts actually appear. |
| Sync | **git only - never mix with Obsidian Sync or iCloud** | Mixing sync layers is the #1 reported failure mode. Vault already pushes to private GitHub. Mobile: Working Copy (iOS git client) beats Obsidian Sync ($96/yr) for a git-backed vault. |
| Vault structure | **Keep current dirs + adopt the frontmatter contract (below); skip wholesale templates** | agentic-memory-vault (Apache 2.0) and llm-wiki-kit (MIT) both converge on: hierarchical folders + index files, mandatory frontmatter, status-never-delete, append-only logs. We adopt the CONVENTIONS, not the frameworks (code-restraint rung 1: the templates are 12-15 star projects; our vault already works). |
| In-Obsidian AI plugins | **SKIP** | The 5 community AI plugins (incl "AI Assistant" with Claude 4 support) run only while Obsidian is open, inside the app - strictly weaker than Claude Code at the vault root. |
| The organizer agent | **vault-organizer per doc 2318** | This doc supplies its conventions; 2318 supplies its loop + ask-Zaal queue. |

## Findings

### 1. The three MCP servers (all licenses read from LICENSE files, per Hard Req 13)

| Server | Stars | License | Needs Obsidian open? | Distinguishing ops |
|---|---|---|---|---|
| MarkusPfundstein/mcp-obsidian | 4,309 (spot-verified this session) | MIT | YES (REST plugin) | search, patch_content by heading/blockref/frontmatter |
| coddingtonbear/obsidian-local-rest-api | 2,813 | MIT | YES (is the plugin) | JsonLogic metadata queries, command execution, active-file access. OPEN issue: backlink race (NoteJson serves before link resolution) |
| StevenStavrakis/obsidian-mcp | 722 (spot-verified) | MIT (LICENSE read, spot-verified) | NO | etag conflict detection, transactional trash + 30-day history, reserved-path blocks (.git, .obsidian) |

### 2. What practitioners actually run (HN via Algolia keyless API, real comments 2026-03..07)

- Direct Claude Code on vault dir - simplest, works (2026-04-22 comment with terminal screenshot).
- Git-backed vault + structure contract written IN the vault + CLAUDE.md pointing at it - the "empty context still works" pattern (2026-06-21).
- Cautionary: multi-tool agent stacks "broke on me after 1-2 days... I want the simplest of things: Claude Code + my Obsidian vault" (2026-06-18) - validates the two-surface goal directly.
- Vault as the single integration point for everything (home assistant, taxes, orchard - 2026-03-07).
- OCR inflow: iPhone Shortcut -> photo into vault -> Claude plugin transcribes (2026-07-19) - a pattern for Zaal's whiteboard/flyer captures.

### 3. The frontmatter contract to adopt (converged from both templates + our sweep)

```yaml
---
type: person | project | todo | reference | personal | archive | meeting-log | playbook | index
status: active | archived | draft        # archive, never delete
created / updated: YYYY-MM-DD
tags: [domain/x, lifecycle/y]
source: onenote | meeting | artifact | manual
confidence: high | medium | low          # on claims (mirrors ElizaOS verificationStatus, doc 2318)
archive-reason: "..."                    # REQUIRED when status: archived (no-archive-by-default rule)
routed: unrouted | board | crm | icm | research
---
```

The 2026-08-18 OneNote mirror already carries source/section/captured/routed; this contract extends it vault-wide. The `archive-reason` field is our own rule the templates lack; `confidence` + `routed` are what the vault-organizer (doc 2318) reads.

### 4. Failure modes to design around

1. Mixed sync layers (git + Obsidian Sync + iCloud) - pick git, done.
2. Agent edits breaking plugin expectations (dataview/frontmatter drift) - the contract above is the guard; organizer validates before writing.
3. Plugin-dependent MCP dies with the app - why obsidian-mcp is the pick if MCP is ever needed.
4. Concurrent agent writes - today: single-writer (this lane). At multi-writer: obsidian-mcp etags or branch-per-agent + PR (what ZAOOS already does for code).
5. Backlink race in the REST plugin (open GitHub issue) - do not build on live backlink queries.

### 5. Obsidian itself (v1.13.7, from obsidian-releases desktop-releases.json)

No native REST API, no native AI surface - community plugins only. Confirms the vault-is-just-markdown stance: Obsidian is the reading/linking UI, Claude operates on files, git is the transport. The two-surface goal is architecturally sound because neither surface depends on the other's runtime.

### 6. Added since this doc was written (2026-08-26)

- **`TOC.md` + `scripts/build-toc.py`** now exist in the vault - the whole vault
  in one generated table (path, type, status, first-line hook). This doc's
  structure section predates it; a generated index is the cheap version of the
  "hierarchical folders + index files" convention it recommends, and it is
  regenerated rather than maintained by hand.
- **`~/zao-vault/README.md` gained a source-order block.** The vault is one of
  seven stores, and until now nothing said what to believe when two disagreed.
  Full division + precedence: `CLAUDE.md` ("Where Knowledge Lives") and
  `handoff-discipline.md` rule 7. Motivation and measurement: doc 2421.
- The doc's other decisions (Claude Code directly on the vault, git-only sync,
  skip in-app AI plugins, obsidian-mcp only when concurrent writers appear) were
  re-read on 2026-08-26 and all still hold.

## Also See

- [Doc 2318](../../agents/2318-elizaos-memory-vs-zao-corpus-agent/) - the vault-organizer spec this doc feeds
- [Doc 2036](../2036-context-hygiene-cost-discipline/) - context hygiene (MEMORY.md size, worktrees) that motivated vault-as-memory

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the frontmatter contract to zao-vault/templates/ + README (PR to zao-vault) | @Claude(zaoos-infra lane) | vault commit | 2026-08-19 |
| Approve conventions + vault-organizer Phase 1 together (one nod covers both, doc 2318 Next Actions) | @Zaal | approval | 2026-08-21 |
| Working Copy on iPhone/iPad pointed at zao-vault for mobile access | @Zaal | setup, ~10 min | 2026-08-25 |
| Re-check obsidian-mcp only when a second concurrent vault writer exists | @Claude(any lane) | deferred gate | wontfix until multi-writer |

## 2026-08-22 Review Notes

- **Vault as hub (doc 2319 outcome):** The vault-as-hub decision from doc 2317 is now implemented — `zao-vault/handoffs/` is the living handoff home (migrated 2026-08-18, 13 briefs, TEMPLATE, IN-FLIGHT, people/, inbox/, security-rotation brief). Doc 2319 cross-validates this decision.
- **OneNote corpus (doc 2324):** The OneNote routing pass (142 pages, 2026-08-18) demonstrated that the vault taxonomy works for inbox routing. The vault-organizer spec in doc 2318 extends it with automated routing.
- **Farcaster crisis context (doc 2374):** Obsidian + zao-vault captures ZAO institutional knowledge. If Neynar / Farcaster infrastructure is in handoff, the vault's role as a capture surface for intelligence (not just task state) becomes more important — the knowledge should not live solely in session context.

## Sources

- [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) - [FULL, gh api + README base64 decode; stars spot-verified 4,309 by orchestrator]
- [coddingtonbear/obsidian-local-rest-api](https://github.com/coddingtonbear/obsidian-local-rest-api) - [FULL, gh api + README + open issues list]
- [StevenStavrakis/obsidian-mcp](https://github.com/StevenStavrakis/obsidian-mcp) - [FULL, gh api; LICENSE file read verbatim (MIT), spot-verified by orchestrator]
- [HN search obsidian+claude](https://hn.algolia.com/api/v1/search?query=obsidian+claude) - [FULL, keyless API; 8 practitioner comments 2026-03..07 quoted from fetched JSON]
- [agentic-memory-vault](https://github.com/search?q=agentic-memory-vault) template README - [FULL, gh api; Apache 2.0, 15 stars]
- llm-wiki-kit template README - [FULL, gh api; MIT, 12 stars]
- [obsidian-releases desktop-releases.json](https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/desktop-releases.json) - [FULL, raw fetch; v1.13.7]
- community-plugins.json AI plugin scan - [FULL, raw fetch; 5 AI plugins, "AI Assistant" has Anthropic support]
- Reddit - [SKIPPED, walled from this machine per doc 2282]

Method note: scout ran 25 real fetches (gh api / raw.githubusercontent / hn.algolia), per-URL status logged; orchestrator spot-verified two star counts + one LICENSE file before trusting (research-grounding verify step).
