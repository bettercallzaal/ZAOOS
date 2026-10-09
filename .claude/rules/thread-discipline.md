# Thread Discipline (anti-sprawl)

Externalize open loops so a fast pivot cannot drop one. History and the tool-status saga: `research/dev-workflows/2649-rules-history/archive/thread-discipline.md`.

1. **Live ledger.** The moment a thread opens, `TaskCreate` it (in_progress); on finish, `TaskUpdate` -> completed. The ledger, not the scrollback, is what is still open.
2. **Park on pivot.** When Zaal jumps threads before the current one is done, capture the leaving thread FIRST (`todo` - present in `~/bin` as of 2026-08-23, alongside `crush`, `cockpit`, `zao-triage`, `morning-pick`, `ztui`), then follow.
3. **End recap** on a natural stop, a `/compact`, or when asked: DONE (with proof - PR#/file), PARKED (captured, will resurface via crush), DROPPED (open, needs a decision). Never end a long session without it.

Guards: parking is not doing. Only park threads with real remaining work. A parked thread flows todo -> zao-triage -> crush -> morning-pick. Any rule note asserting a tool is missing is re-verified (`command -v`) before it is acted on.
