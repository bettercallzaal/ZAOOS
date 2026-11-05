# Claude Usage - surface tiering

mechanism: bot/src/zoe/models/free-tier.ts, bin/zao-triage (partial: the free-tier line only)

**Match each task to the cheapest surface that can do it well, and reserve the Claude Code weekly cap for grounded live-code work.** Origin and rationale: `research/dev-workflows/2649-rules-history/archive/claude-usage.md`.

| Work | Use | Boundary |
|---|---|---|
| Architecture, approach, spec-writing | Claude chat / plan mode | Hand the chosen approach to a grounded surface as a spec and file list. |
| Grounded live-code edits, verification, and PRs | Claude Code (spend the cap HERE) | Use the repository's rules, hooks, skills, and current implementation. |
| Well-specified mechanical code with a file list and acceptance criteria | Codex exec, when available | Check its result against the repository; do not delegate ambiguous discovery or completion judgment blindly. |
| Research triage; Google Docs and Sheets output | Gemini CLI (not installed yet, doc 2675 decision 5) | Treat fetched sources, not summaries, as evidence. |
| Bulk summarising and classifying inside ZOE loops | OpenRouter through ZOE's router | Text jobs only; file-editing work waits for a grounded coding surface. |
| Small private or offline text transformations | Ollama local | Local models only; `:cloud` Ollama models run on Ollama's servers and are not private (doc 2675 section 3). |

When Claude Code is capped the fleet fails over claude -> codex -> openrouter -> ollama.

**Free tiers get public text only.** The Gemini API free tier and OpenRouter `:free` models never receive private content: vault notes, member data, PII, DMs, board items, or unreleased code. The Gemini free tier's terms let Google use prompts to improve its products, and OpenRouter does not state per-model provider training for `:free` (both read 2026-10-16). Private work runs on the Claude or Codex plans or a paid API model. In code, every bot OpenRouter caller runs `assertNotFreeTier` (`bot/src/zoe/models/free-tier.ts`) before building a prompt; a new caller must too. GitHub Models is retired ("As of July 30, 2026, GitHub Models has been fully retired.", docs.github.com/en/github-models, read 2026-10-16); do not add it to any routing list.

- **One account per lane, fixed at launch.** Do not switch accounts inside a running lane with `/login`: it changes the config directory, so every lane sharing it moves too (doc 2675 decision 1).
- **`fallbackModel` does not cover a cap.** Claude Code switches fallback models only on overload or server errors, never on rate-limit errors, so a fallback does not rescue a capped session (doc 2675 decision 3).
- **On a cap, hand off through the lane brief** at `~/zao-vault/handoffs/<lane>.md`, then continue from it on the routed surface (doc 2675 decision 4). Any writable path a new agent gets follows `worktree-handoff.md`.
- **Plan in chat, hand the agent the spec + file list.** For a live codebase, let the agent write the code grounded in the repo; do not paste code written blind. Prewriting in chat is fine for greenfield or small standalone files.
- **Do not spend the cap on:** reading whole files/dirs each pass (open only what the task touches; grep `research/*/README.md`, never bulk-read), research a cheaper tier can do, long exploratory sessions, re-deriving established context (read the session state / progress note, do not re-explore).
- **Do spend it on:** grounded multi-file edits with verify + PR, and subagents for bounded research/audit/parallel work.
