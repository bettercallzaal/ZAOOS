---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-18
related-docs: "1181, 734, 997, 496, 759, 796, 983"
original-query: "/zao-research eliza OS and how it manages stuff and also our hermes agent and audit it with the lens of being able to parse through all this data and info use its context to help add more and organize it or know it needs to ask me for more info to categorize it (the OneNote-to-Obsidian corpus, 142 pages captured 2026-08-18)"
tier: STANDARD
---

# 2318 - ElizaOS Memory Architecture vs the ZAO Corpus-Organizing Agent (Hermes audited, ZOE the real organ)

> **Goal:** What ElizaOS's memory/knowledge system does in August 2026, whether Hermes can be the agent that parses the OneNote/Obsidian corpus (142 pages swept 2026-08-18), and what to build so an agent organizes the vault, enriches it with context, and ASKS Zaal when it cannot categorize.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt ElizaOS for corpus organizing | **NO - unchanged from doc 1181** | Autonomy-first, no ask-the-user pattern in core (verified against fetched source: actions return typed failures, model guesses next move). ZAO model is approval-gated. 19,087 stars, active (pushed 2026-08-18), but its shape is wrong for us. |
| Use Hermes as the corpus agent | **NO** | Hermes is a fix-PR pipeline: issue_text -> clone -> fixer -> critic (0-10 score, threshold gate) -> PR (`bot/src/hermes/runner.ts`). It has no memory store, no retrieval, no document model. Wrong organ. Keep it doing code. |
| The corpus organizer is ZOE-side | **YES - extend, do not build new** | ZOE already has the machinery: 4-block Letta memory (`memory.ts`, 896L), Bonfire recall/remember bridge (`recall.ts`), reflexion self-improvement (`reflexion.ts`), inbox ingest+triage with PII scrub (`inbox-ingest.ts`, `inbox-triage.ts`), deterministic task-classifier (brand + route, `task-classifier.ts`), commit-per-edit memory versioning (`memory-git.ts`). The vault organizer is a new consumer of existing organs, not a new bot (CLAUDE.md: no new bots without doc). |
| BORROW from ElizaOS | **5 patterns** | Scope-by-source-trust, two-store memory with fact confidence, typed refusals instead of guessing, provider cache tiers, retention-as-sweep. Details below. |
| The ask-Zaal loop | **BUILD - it is the missing piece everywhere** | Neither ElizaOS nor our stack has a first-class "I cannot categorize this, queue a question" primitive. Today's live proof: 3 of 4 OneNote routing questions needed Zaal's context (respect awards "tbh i dont know", interview list "add to crm as potential guests"). The grill queue IS the clarification API. |

## Findings

### 1. ElizaOS memory architecture (fetched from source, 2026-08-18)

All from `github.com/elizaOS/eliza` raw source via gh api (FULL fetches, scout ran 28 real fetches):

- **Four canonical memory kinds** (`packages/core/src/types/memory.ts`): DOCUMENT (whole docs), FRAGMENT (embedded sub-chunks), MESSAGE (conversation), DESCRIPTION (entity metadata) + CUSTOM. Documents fragment into position-tracked, embedded pieces for hybrid/vector/keyword search.
- **Two-store fact model**: fact memories carry `FactKind` ("durable" - identity/relationships/goals vs "current" - feelings/schedule), plus `confidence`, `lastReinforced`, and `verificationStatus: self_reported | confirmed | contradicted`. A fact is not a fact until confirmed - structurally.
- **Scope-by-source-trust** (`packages/agent/src/api/attachment-knowledge-ingest.ts`): a document's visibility scope derives from WHERE it came from (DM -> owner-private; public room -> user-private), never from who asks later. Retrieval walls (`document-access.ts`) refuse private items into public rooms at three checkpoints.
- **Ingest pipeline**: message attachment -> persist hook -> classify media format from mime -> extract searchable text -> append provenance line (hash + room + sender + scope) -> fragment -> embed. Media stored once, sha256-addressed, GC reference-aware.
- **Provider pattern** for context composition: each provider declares `position` (load order), `dynamic`, `cacheScope` (turn/conversation/session/global) - so per-turn context is assembled from typed, cache-tiered providers.
- **Retention as background sweep**: age bound + per-room row cap + per-sweep delete cap, OFF by default (`memory-retention.ts`).
- **No clarification primitive**: actions fail typed (`ATTACH_SCOPE_REFUSED`, `KNOWLEDGE_INVALID`); the model decides what to do next. Nothing queues a question to a human.
- Health: 19,087 stars, pushed 2026-08-18, releases are `pr-evidence-*` prereleases (2026-08-01..13). Community (HN via Algolia, FULL): interest clusters on crypto/on-chain integrations, not memory design.

### 2. Hermes audit under the corpus lens

Ground truth read of `bot/src/hermes/` (3,056 lines, 13 modules):

- Pipeline: `dispatch -> cloneAndBranch -> runFixer (Opus) -> runCritic (Sonnet, 0-10) -> attempts loop (max HERMES_DEFAULT_MAX_ATTEMPTS) -> preflight gate -> PR -> pr-watcher` with a $20/day notional fleet cap (`runner.ts:36-58`) and per-run receipts into ZOE.
- State = one `HermesRun` row (status, attempts, scores, tokens, cost). No memory store, no embeddings, no retrieval, no document types, no user-question channel. Its only "context" is the issue text + repo profile system prompt (`types.ts`, `coder.ts`).
- **Verdict: Hermes is a verb (fix), not a memory.** Bolting corpus parsing onto it would rebuild ZOE's organs in the wrong body. It stays valuable exactly as the build-arm the organizer can DISPATCH to (e.g. "generate the CRM insert PR for these 22 contacts").

### 3. What ZOE already has (inventory, per confirm-before-claiming-absence)

130 modules in `bot/src/zoe/`; the corpus-relevant ten, docstrings read 2026-08-18:

| Module | What it already does |
|---|---|
| `memory.ts` (896L) | Letta-style 4-block memory per concierge turn |
| `recall.ts` (344L) | Bonfire read/write bridge, verified against live API |
| `reflexion.ts` (368L) | self-improving lesson memory (doc 759 Gap 4) |
| `bonfire-retry.ts` | durable retry queue for every Bonfire write |
| `inbox-ingest.ts` | AgentMail pull + PII-scrubbed summaries into standing context |
| `inbox-triage.ts` | structured triage per ingested item |
| `task-classifier.ts` | deterministic keyword classifier: ZAO brand + route per task (doc 983) |
| `memory-git.ts` | commit-per-edit versioning of memory files |
| `thread-memory.ts` | open threads -> Bonfire episodes (doc 796) |
| `bonfire-queue.ts` | drains community submission queue |

The gap is NOT memory, recall, ingest, triage, or classification - all exist. The gap is (a) a VAULT walker that runs the classifier over `~/zao-vault` notes, and (b) the ask-Zaal clarification queue when classification confidence is low.

### 4. The live experiment that proves the ask-loop matters

The 2026-08-18 OneNote sweep (142 pages -> vault, `~/zao-vault/onenote/`) was organized by exactly the target loop, run manually by this session: classify -> confident moves executed (mirror, personal/, archive/, people/ with `crm: pending`) -> UNCERTAIN items became grill questions. Results of the first grill round: fractal respect awards ("tbh i dont know... should go to the fractal zj"), devcon contacts ("just add to crm and close out"), interview list ("add to crm as potential guests" - uncategorizable without Zaal), money items ("finance lane bundle"). 3 of 4 needed human context no classifier could infer. An organizer without a question channel would have guessed wrong three times.

### 5. Borrow list -> concrete ZAO mappings

| ElizaOS pattern | ZAO adoption |
|---|---|
| Scope-by-source-trust | Vault frontmatter `scope:` set at ingest by SOURCE (onenote-personal -> private; research -> public-ok). PII/secret walls check scope before any outbound surface (socials, ICM, research docs). |
| Fact confidence + verificationStatus | Add `confidence:` + `verified: self_reported/confirmed` to vault note frontmatter; the organizer only auto-routes `confirmed` or high-confidence items, queues the rest for grill. |
| Typed refusals over guessing | Organizer emits `NEEDS_ZAAL(reason_code)` instead of best-guess filing; reason codes drive the grill batches (exactly AskUserQuestion / ZOE button decks). |
| Provider cache tiers | ZOE context assembly: stable blocks (persona, brand) vs per-turn blocks (board state, vault deltas) - already close to `memory.ts` 4-block design; formalize cacheScope per block. |
| Retention-as-sweep | Vault `onenote/` mirror is frozen; a weekly sweep proposes archive moves for notes untouched N days - as a PR, never auto-delete (no-rm-rf rule). |

## The build (spec, not built)

**`vault-organizer` = one ZOE-side loop, PR-only, no new bot:**
1. Walk `~/zao-vault` notes missing `routed:` frontmatter.
2. Classify with `task-classifier.ts` extended by a vault taxonomy (person / project / todo / reference / personal / archive) + confidence.
3. Confident + reversible -> apply as a vault git commit (memory-git pattern) + update `routed:`.
4. Low-confidence -> append to a grill queue (board `route=human` cards or AskUserQuestion batches in session).
5. Route targets: cowork board (todos), CRM (people, `crm: pending` -> Supabase), ICM boxes (brand copy deltas, content gated on Zaal), research docs (evergreen technical), Bonfire episodes (decisions/lore).
6. Hermes stays the dispatch target for any CODE the routing needs (e.g. CRM bulk-insert PR).

## Also See

- [Doc 1181](../1181-elizaos-2026-reresearch/) - the standing MONITOR + BORROW verdict this doc extends
- [Doc 734](../734-hermes-orchestrator-framework/) - Hermes architecture
- [Doc 997](../997-agent-harness-design-zaalcaster/) - harness design principles
- [Doc 759](../759-agent-best-practices-and-zoe-orchestrator-gap/) / [Doc 796](../796-zoe-conversational-proactive-redesign/) / [Doc 983](../../dev-workflows/983-zao-assistant-todo-workflow/) - the ZOE organs inventoried above (759 and 796 are the agents/ docs; both numbers also exist in other topic folders)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve vault-organizer spec (section "The build") so Phase 1 (walker + classifier + grill queue) can be built PR-only | @Zaal | approval | 2026-08-21 |
| Route the 2026-08-18 grill answers: CRM adds (devcon 5 + interviews 17), fractal-lane directive (respect awards), finance-lane bundle (money items) | @Claude(zaoos-infra lane) | lane dispatch + CRM rows | 2026-08-19 |
| Add `scope:`/`confidence:` frontmatter convention to vault template (templates/ dir) - PR to zao-vault | @Claude(zaoos-infra lane) | PR | 2026-08-20 |

## Sources

- [elizaOS/eliza repo metadata + releases](https://github.com/elizaOS/eliza) - [FULL, gh api, 2026-08-18: 19,087 stars, pushed 2026-08-18]
- `packages/core/src/types/memory.ts`, `packages/core/src/memory.ts` - [FULL, raw.githubusercontent.com via gh api; MemoryType/Memory/FactMetadata interfaces quoted verbatim]
- `packages/agent/src/actions/knowledge.ts`, `api/attachment-knowledge-ingest.ts`, `api/document-access.ts`, `api/documents-service-loader.ts`, `providers/conversation-proximity.ts`, `runtime/memory-retention.ts` - [FULL, raw fetch; ingest pipeline + scope walls + provider contract + retention policy]
- [HN Algolia search "elizaos"](https://hn.algolia.com/api/v1/search?query=elizaos) - [FULL, keyless API; 5 threads, low engagement, integration-focused]
- Local ground truth: `bot/src/hermes/*.ts` (13 files, 3,056 lines read 2026-08-18), `bot/src/zoe/` module inventory (130 modules, 10 corpus-relevant docstrings read) - [FULL, direct file reads]
- OneNote sweep artifacts: `~/zao-vault/onenote/` (142 pages), `~/.zao/private/onenote-sweep/00-REVIEW-2026-08-18.md` - [FULL, produced this session]

Method note: ElizaOS source fetched raw (gh api / raw.githubusercontent.com) by a REAL-FETCHES-ONLY scout (28 tool calls, per-URL status reported); quotes are verbatim from fetched files. WebFetch used for nothing load-bearing. Reddit not attempted (walled per doc 2282).
