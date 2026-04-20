# Architecture Decision Records

Living log of architectural decisions made during ZAO OS development. Format inspired by [Michael Nygard's ADR template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## Why ADRs

`.claude/memory.md` captures *current state*. ADRs capture *why we got here*. New contributors (human + AI) can read ADRs to understand non-obvious choices without spelunking git log.

Pair with research docs under `research/`:
- ADRs = decisions made
- Research docs = options considered before deciding

When a research doc leads to a real architectural commitment, write an ADR pointing back at the research doc.

## Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [001](./001-ecc-path-b-plugin-install.md) | ECC Path B: full plugin install over cherry-pick | Accepted | 2026-04-20 |
| [002](./002-silent-failure-audit-trail-drop-pattern.md) | Silent-failure CRITICAL audit-trail drop pattern | Accepted | 2026-04-20 |

## Format

Each ADR is a markdown file `NNN-kebab-case-title.md`:

- **Status:** Proposed / Accepted / Superseded by ADR-XXX / Rejected
- **Context:** what problem we're solving, what constraints
- **Decision:** the choice made
- **Consequences:** what changes (positive + negative + neutral)
- **Alternatives Considered:** options rejected + why
- **References:** research docs, PRs, related ADRs

Keep each ADR under 200 lines. If a decision needs more, link to a research doc.

## When to Write an ADR

- A non-obvious architectural commitment is made
- Two reasonable alternatives existed and we picked one
- Future contributors will ask "why did we do X instead of Y?"
- A pattern is being formalized (e.g., audit-trail drop logging)

Skip ADRs for trivial choices (variable names, formatting, dependency version bumps).
