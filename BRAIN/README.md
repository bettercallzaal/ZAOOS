# BRAIN — ZAO's Synthesized Company Context

> Continuously-updated, conflict-resolved, source-tracked representation of ZAO's people, projects, decisions, and relationships. Read by every Claude Code session, ZOE, and future agents.
> Substrate per [doc 462](../research/agents/462-hyperspell-company-brain-context-graph/). Architecture per [doc 460](../research/agents/460-zao-agentic-stack-end-to-end-design/).

## Why this exists

The agent industry built **retrieval** (search at runtime). Every agent re-discovers ZAO from zero on every query. Returns whichever fragment matches first. Confidently wrong on conflicts.

BRAIN is **synthesis**. Source tools (research/, ADRs, .claude/memory.md, openclaw MEMORY.md, Supabase, Telegram, Calendar, Gmail) get continuously folded into a single canonical view per entity. Conflicts get resolved upstream. Sources get tracked. Freshness gets stamped. The answer exists before the question.

## Layout

```
BRAIN/
├── people/         <fid>-<slug>.md      — one file per canonical identity
├── projects/       <slug>-<date>.md     — active projects with synthesized state
├── decisions/      mirrors docs/adr/    — committed architectural decisions
├── relationships/  <network>.md         — who connects to whom + how
└── _meta/
    ├── source_authority.md              — the 4-tier hierarchy
    ├── conflicts.md                     — unresolved + recently-resolved conflicts log
    └── freshness_report.md              — what's stale (>30d unconfirmed)
```

## Reading rules (for agents + humans)

1. **Open the entity file directly** for the question you have. Don't search. The answer is structured, sourced, current.
2. **Check the frontmatter `last_confirmed_at`** — if older than 30 days, treat as stale.
3. **For conflicts, see `_meta/conflicts.md`** — every unresolved conflict is logged with sources + chosen winner + reasoning.
4. **Source authority lives in `_meta/source_authority.md`** — when sources disagree, higher tier wins. Always.

## Writing rules (for the synthesis Routine + humans)

1. **One entity = one file.** Don't fragment.
2. **Frontmatter is structured** (yaml). Body is markdown narrative.
3. **Every claim has a source** — link inline `[per X](path)` or in the `## Sources` section.
4. **Bump `last_confirmed_at`** when you confirm an existing claim.
5. **Log new conflicts to `_meta/conflicts.md`** before resolving them in the entity file.

## Maintenance

**Today (v1):** hand-curated. Zaal + Claude pair.
**This month:** nightly Claude Routine `synthesize-brain` (per doc 422 + doc 462) pulls 8 sources, applies authority, writes BRAIN files, commits to repo.
**This quarter:** `/admin/brain` dashboard for one-click conflict resolution.

## Future migration

Sensitive items (member personal data, signer addresses, contracts) should move to a private `zao-memory` repo (per doc 460 Gap 1). For now, BRAIN/ lives in the public ZAOOS repo with public-safe content only — no PII, no secrets.

## How to add a new entity

```bash
# Person
cp BRAIN/_meta/template-person.md BRAIN/people/<fid>-<slug>.md
# Project
cp BRAIN/_meta/template-project.md BRAIN/projects/<slug>-<date>.md
```

(Templates land in v1.1 — for now copy an existing file as your starting point.)
