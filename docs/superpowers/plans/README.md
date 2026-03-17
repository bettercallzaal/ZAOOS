# ZAO OS Implementation Plans

> Active sprint plans for current development. Future sprints are in `future-sprints.md`.

## Current Sprints

| Sprint | Plan | Status | Effort |
|--------|------|--------|--------|
| **Sprint 1 — Quick Wins** | [sprint-1-quick-wins.md](2026-03-17-sprint-1-quick-wins.md) | Ready to execute | 1-2 days |
| **Sprint 2 — Respect Activation** | [sprint-2-respect-activation.md](2026-03-17-sprint-2-respect-activation.md) | Ready to execute | 1-2 weeks |

## Reference

| Doc | Purpose |
|-----|---------|
| [decisions-resolved.md](2026-03-17-decisions-resolved.md) | Architecture decisions (ElizaOS, pgvector, wallet-only auth, etc.) |
| [future-sprints.md](2026-03-17-future-sprints.md) | Sprints 3-7 detailed specs for later planning |

## Archive

Old and superseded plans are in `archive/`.

## Dependency Graph

```
Sprint 1 (Quick Wins) ─── no dependencies
Sprint 2 (Respect) ────── no dependencies
     │
     ├── Sprint 3 (Engagement) ── needs Respect
     ├── Sprint 4 (Moderation) ── needs Respect
     └── Sprint 5 (Hats) ──────── needs Respect
              │
              └── Sprint 5b (Treasury) ── needs Hats

Sprint 6 (AI Agent) ────── needs Respect
Sprint 7 (Distribution) ── no hard deps
```

Sprints 1 and 2 can run in parallel. Sprints 3-5 unlock after Sprint 2.
