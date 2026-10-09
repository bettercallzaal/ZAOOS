# Claude Usage - surface tiering

**Match each task to the cheapest surface that can do it well, and reserve the Claude Code weekly cap for grounded live-code work.** Origin and rationale: `research/dev-workflows/2649-rules-history/archive/claude-usage.md`.

| Task | Surface |
|------|---------|
| Architecture, approach, spec-writing | Claude chat / plan mode |
| Research, docs, summaries, drafts, classification | OpenRouter (DeepSeek) / Ollama via the fleet loops |
| Well-specified, low-judgment mechanical code | Codex when available |
| Grounded edits + verify + PR on live code | Claude Code (spend the cap HERE) |

When Claude Code is capped the fleet fails over claude -> codex -> openrouter -> ollama.

- **Plan in chat, hand the agent the spec + file list.** For a live codebase, let the agent write the code grounded in the repo; do not paste code written blind. Prewriting in chat is fine for greenfield or small standalone files.
- **Do not spend the cap on:** reading whole files/dirs each pass (open only what the task touches; grep `research/*/README.md`, never bulk-read), research a cheaper tier can do, long exploratory sessions, re-deriving established context (read the session state / progress note, do not re-explore).
- **Do spend it on:** grounded multi-file edits with verify + PR, and subagents for bounded research/audit/parallel work.
